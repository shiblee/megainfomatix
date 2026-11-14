"""End-to-end data pipeline.

    Data Source -> Collection -> Monitoring -> Processing -> Analysis -> Report -> Dashboard/API

Used by the CLI (main.py) and the internal API (api/app.py), so both run the same logic.
"""
from __future__ import annotations

import logging

from sqlalchemy import Engine

from analysis.analyzer import analyze_database
from config.config import Settings, get_settings
from database.db import get_engine
from monitoring.monitor import MonitoringService
from reports.report_generator import ReportGenerator

logger = logging.getLogger(__name__)


def build_monitor(settings: Settings | None = None, engine: Engine | None = None) -> MonitoringService:
    settings = settings or get_settings()
    return MonitoringService(
        history_file=settings.monitoring_dir / "history.jsonl",
        engine=engine or get_engine(),
        zscore_threshold=settings.anomaly_zscore_threshold,
    )


def build_report_generator(settings: Settings | None = None) -> ReportGenerator:
    return ReportGenerator((settings or get_settings()).reports_dir)


def run_pipeline(settings: Settings | None = None, engine: Engine | None = None) -> dict:
    settings = settings or get_settings()
    engine = engine or get_engine()

    logger.info("Collecting and monitoring data")
    snapshot = build_monitor(settings, engine).collect_snapshot()

    logger.info("Analysing data")
    analysis = analyze_database(engine) if snapshot["database"] == "ok" else None

    logger.info("Generating report")
    report = build_report_generator(settings).generate(
        "Data Monitoring & Analysis Report",
        {"monitoring": snapshot, "analysis": analysis},
    )
    logger.info("Report saved to %s", report["path"])
    return report
