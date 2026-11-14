from fastapi.testclient import TestClient

import api.app as api_module
import pipeline
from config.config import get_settings


def test_api_endpoints(engine, tmp_path, monkeypatch):
    from dataclasses import replace

    settings = replace(get_settings(), reports_dir=tmp_path / "reports", monitoring_dir=tmp_path / "monitoring")
    monkeypatch.setattr(pipeline, "get_settings", lambda: settings)
    monkeypatch.setattr(pipeline, "get_engine", lambda: engine)
    monkeypatch.setattr(api_module, "check_connection", lambda: True)
    monkeypatch.setattr(api_module, "analyze_database", lambda: __import__("analysis.analyzer").analyzer.analyze_database(engine))

    client = TestClient(api_module.app)

    assert client.get("/reports/latest").status_code == 404
    assert client.get("/monitoring/snapshot").json()["metrics"] == {"rows.users": 3}
    assert client.get("/analysis/summary").json()["users"]["total"] == 3

    created = client.post("/reports")
    assert created.status_code == 201
    assert client.get("/reports/latest").json()["id"] == created.json()["id"]
