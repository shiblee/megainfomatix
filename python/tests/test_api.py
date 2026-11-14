import json
from dataclasses import replace

import pytest
from fastapi.testclient import TestClient

import analysis.analyzer
import database.db
import pipeline
from config.config import get_settings


@pytest.fixture
def wired(engine, tmp_path, monkeypatch):
    """Point every layer at the test database and a temp output directory."""
    settings = replace(get_settings(), reports_dir=tmp_path / "reports", monitoring_dir=tmp_path / "monitoring")
    for module in (database.db, analysis.analyzer, pipeline):
        monkeypatch.setattr(module, "get_engine", lambda: engine)
    monkeypatch.setattr(pipeline, "get_settings", lambda: settings)
    return engine


def test_http_api(wired):
    from api.app import app

    client = TestClient(app)
    assert client.get("/health").json() == {"status": "ok", "database": "ok"}
    assert client.get("/reports/latest").status_code == 404
    assert client.get("/monitoring/snapshot").json()["metrics"] == {"rows.users": 3}
    assert client.get("/analysis/summary").json()["users"]["total"] == 3

    created = client.post("/reports")
    assert created.status_code == 201
    assert client.get("/reports/latest").json()["id"] == created.json()["id"]


def test_cli_query(wired, capsys, monkeypatch):
    import main

    def query(name):
        monkeypatch.setattr("sys.argv", ["main.py", "query", name])
        main.main()
        return json.loads(capsys.readouterr().out)

    assert query("health") == {"ok": True, "data": {"status": "ok", "database": "ok"}}
    assert query("reports-latest") == {"ok": False, "status": 404, "detail": "No reports have been generated yet"}
    assert query("analysis-summary")["data"]["users"]["total"] == 3
    assert query("reports-generate")["ok"] is True
