"""Internal HTTP API (optional transport) consumed by the Node.js server via PYTHON_SERVICE_URL.

Not meant to be exposed publicly; the React client talks only to Node.js, which
handles authentication and forwards here. On shared hosting the Node server runs
`main.py query ...` instead, so this service is not needed there.
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException

from api import handlers

app = FastAPI(title="MegaInfomatix Analytics Service", version="1.0.0")


def _call(fn, *args):
    try:
        return fn(*args)
    except handlers.ServiceError as error:
        raise HTTPException(status_code=error.status, detail=error.detail) from error


@app.get("/health")
def health() -> dict:
    return _call(handlers.health)


@app.get("/monitoring/snapshot")
def monitoring_snapshot(refresh: bool = True) -> dict:
    return _call(handlers.monitoring_snapshot, refresh)


@app.get("/analysis/summary")
def analysis_summary() -> dict:
    return _call(handlers.analysis_summary)


@app.get("/reports/latest")
def latest_report() -> dict:
    return _call(handlers.latest_report)


@app.post("/reports", status_code=201)
def generate_report() -> dict:
    return _call(handlers.generate_report)
