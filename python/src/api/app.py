"""Internal HTTP API consumed by the Node.js server (PYTHON_SERVICE_URL).

Not meant to be exposed publicly; the React client talks only to Node.js,
which handles authentication and forwards to these endpoints.
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException

from analysis.analyzer import analyze_database
from database.db import check_connection
from pipeline import build_monitor, build_report_generator, run_pipeline
from utils.helpers import to_jsonable

app = FastAPI(title="MegaInfomatix Analytics Service", version="1.0.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "database": "ok" if check_connection() else "unreachable"}


@app.get("/monitoring/snapshot")
def monitoring_snapshot(refresh: bool = True) -> dict:
    monitor = build_monitor()
    snapshot = monitor.collect_snapshot() if refresh else monitor.latest_snapshot()
    if snapshot is None:
        raise HTTPException(status_code=404, detail="No monitoring data collected yet")
    return snapshot


@app.get("/analysis/summary")
def analysis_summary() -> dict:
    if not check_connection():
        raise HTTPException(status_code=503, detail="Database is unreachable")
    return to_jsonable(analyze_database())


@app.get("/reports/latest")
def latest_report() -> dict:
    report = build_report_generator().latest()
    if report is None:
        raise HTTPException(status_code=404, detail="No reports have been generated yet")
    return report


@app.post("/reports", status_code=201)
def generate_report() -> dict:
    return run_pipeline()
