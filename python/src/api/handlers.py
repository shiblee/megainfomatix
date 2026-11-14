"""Service operations shared by both transports:

  * HTTP  — api/app.py (FastAPI), used when the Node server sets PYTHON_SERVICE_URL
  * CLI   — `python src/main.py query <name>`, used on shared hosting where Node
            runs Python on demand (PYTHON_BIN) instead of a long-running service

Each handler returns JSON-serialisable data or raises ServiceError.
"""
from __future__ import annotations


class ServiceError(Exception):
    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


def health() -> dict:
    from database.db import check_connection

    return {"status": "ok", "database": "ok" if check_connection() else "unreachable"}


def monitoring_snapshot(refresh: bool = True) -> dict:
    from pipeline import build_monitor

    monitor = build_monitor()
    snapshot = monitor.collect_snapshot() if refresh else monitor.latest_snapshot()
    if snapshot is None:
        raise ServiceError(404, "No monitoring data collected yet")
    return snapshot


def analysis_summary() -> dict:
    from analysis.analyzer import analyze_database
    from database.db import check_connection
    from utils.helpers import to_jsonable

    if not check_connection():
        raise ServiceError(503, "Database is unreachable")
    return to_jsonable(analyze_database())


def latest_report() -> dict:
    from pipeline import build_report_generator

    report = build_report_generator().latest()
    if report is None:
        raise ServiceError(404, "No reports have been generated yet")
    return report


def generate_report() -> dict:
    from pipeline import run_pipeline

    return run_pipeline()


# name used by `main.py query <name>` -> handler
QUERIES = {
    "health": health,
    "monitoring-snapshot": monitoring_snapshot,
    "analysis-summary": analysis_summary,
    "reports-latest": latest_report,
    "reports-generate": generate_report,
}
