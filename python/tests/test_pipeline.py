from pathlib import Path

from sqlalchemy import text

from analysis.analyzer import analyze_database
from database.db import list_tables, normalize_database_url
from monitoring.monitor import MonitoringService, zscore_anomalies
from reports.report_generator import ReportGenerator


def test_normalize_database_url(tmp_path):
    assert normalize_database_url("sqlite:///data/app.db", tmp_path) == f"sqlite:///{tmp_path / 'data/app.db'}"
    assert normalize_database_url("sqlite:////abs/app.db") == "sqlite:////abs/app.db"
    assert normalize_database_url("sqlite:///:memory:") == "sqlite://"
    assert normalize_database_url("postgres://u:p@h/db") == "postgresql+psycopg://u:p@h/db"
    assert normalize_database_url("mysql://u:p@h/db") == "mysql+pymysql://u:p@h/db"


def test_list_tables_hides_internal_tables(engine):
    assert list_tables(engine) == ["users"]


def test_zscore_anomalies():
    assert zscore_anomalies([10, 11, 9, 10, 10], 10, 3.0) is None
    assert zscore_anomalies([10, 11, 9, 10, 10], 50, 3.0) is not None
    assert zscore_anomalies([10, 10], 50, 3.0) is None  # not enough history


def test_monitoring_detects_changes(engine, tmp_path):
    monitor = MonitoringService(tmp_path / "history.jsonl", engine)
    first = monitor.collect_snapshot()
    assert first["database"] == "ok"
    assert first["metrics"] == {"rows.users": 3}

    with engine.begin() as conn:
        conn.execute(text("INSERT INTO users (name, email, role, is_active) VALUES ('D', 'd@x.io', 'user', 1)"))

    second = monitor.collect_snapshot()
    assert second["changes"]["rows.users"]["delta"] == 1
    assert monitor.latest_snapshot()["metrics"]["rows.users"] == 4


def test_analysis_summary(engine):
    summary = analyze_database(engine)
    users = summary["users"]
    assert users["total"] == 3
    assert users["active"] == 2
    assert users["by_role"] == {"user": 2, "admin": 1}
    assert users["signups_by_day"][0] == {"period": "2026-11-01", "count": 2}


def test_report_generation(tmp_path: Path):
    generator = ReportGenerator(tmp_path)
    report = generator.generate("Test", {"value": 1})
    assert Path(report["path"]).exists()
    assert generator.latest()["sections"] == {"value": 1}
