"""Data monitoring: collect metrics, track history, detect changes and anomalies.

Each `collect_snapshot()` call:
  1. collects current metrics (database status, row count per table)
  2. compares them with the previous snapshot (change detection)
  3. flags values whose z-score vs. recent history exceeds the threshold (anomalies)
  4. appends the snapshot to a JSON-lines history file

Add new metrics by extending `collect_metrics()`.
"""
from __future__ import annotations

import json
import logging
import statistics
from pathlib import Path
from typing import Iterable

from sqlalchemy import Engine

from database.db import check_connection, count_rows, get_engine, list_tables
from utils.helpers import utc_now_iso

logger = logging.getLogger(__name__)

HISTORY_WINDOW = 50  # number of past snapshots used for anomaly detection
MIN_HISTORY_FOR_ANOMALIES = 5


def zscore_anomalies(history: Iterable[float], value: float, threshold: float) -> float | None:
    """Return the z-score of `value` against `history` if it exceeds `threshold`, else None."""
    values = list(history)
    if len(values) < MIN_HISTORY_FOR_ANOMALIES:
        return None
    stdev = statistics.pstdev(values)
    if stdev == 0:
        return None if value == values[-1] else float("inf")
    score = (value - statistics.fmean(values)) / stdev
    return score if abs(score) > threshold else None


class MonitoringService:
    def __init__(self, history_file: Path, engine: Engine | None = None, zscore_threshold: float = 3.0):
        self.engine = engine or get_engine()
        self.history_file = history_file
        self.zscore_threshold = zscore_threshold

    # ---- Data collection -------------------------------------------------
    def collect_metrics(self) -> dict[str, float]:
        if not check_connection(self.engine):
            return {}
        return {f"rows.{table}": count_rows(table, self.engine) for table in list_tables(self.engine)}

    # ---- History ---------------------------------------------------------
    def load_history(self, limit: int = HISTORY_WINDOW) -> list[dict]:
        if not self.history_file.exists():
            return []
        lines = self.history_file.read_text(encoding="utf-8").splitlines()[-limit:]
        return [json.loads(line) for line in lines if line.strip()]

    def _append_history(self, snapshot: dict) -> None:
        self.history_file.parent.mkdir(parents=True, exist_ok=True)
        with self.history_file.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(snapshot) + "\n")

    # ---- Monitoring ------------------------------------------------------
    def collect_snapshot(self, persist: bool = True) -> dict:
        database_ok = check_connection(self.engine)
        metrics = self.collect_metrics() if database_ok else {}
        history = self.load_history()
        previous = history[-1]["metrics"] if history else {}

        changes = {
            name: {"previous": previous.get(name), "current": value, "delta": value - previous.get(name, 0)}
            for name, value in metrics.items()
            if previous.get(name) != value
        }

        anomalies = []
        for name, value in metrics.items():
            series = [h["metrics"][name] for h in history if name in h.get("metrics", {})]
            score = zscore_anomalies(series, value, self.zscore_threshold)
            if score is not None:
                anomalies.append({"metric": name, "value": value, "zscore": score})

        snapshot = {
            "timestamp": utc_now_iso(),
            "database": "ok" if database_ok else "unreachable",
            "metrics": metrics,
            "changes": changes,
            "anomalies": anomalies,
        }

        if anomalies:
            logger.warning("Anomalies detected: %s", anomalies)
        if persist:
            self._append_history(snapshot)
        return snapshot

    def latest_snapshot(self) -> dict | None:
        history = self.load_history(limit=1)
        return history[-1] if history else None
