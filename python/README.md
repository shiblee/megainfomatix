# Python — Data Monitoring, Analysis & Reporting

Independent of the React client. It reads the shared database (same `DATABASE_URL` as the server)
and exposes an internal API that the Node.js server calls.

## Setup

```bash
cd python
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt   # runtime only: requirements.txt
cp .env.example .env              # if not already present
```

## Run

```bash
python src/main.py run                  # full pipeline once → output/reports/report_<ts>.json
python src/main.py monitor              # scheduled monitoring loop
python src/main.py monitor --once       # single snapshot
python src/main.py serve [--reload]     # internal API on http://127.0.0.1:8000 (docs: /docs)
python src/main.py query health         # one operation as JSON (how Node calls Python in production)
python -m pytest -q                     # tests
```

## Pipeline

```text
database/db.py           Data Source + Collection (SQLAlchemy, pandas)
monitoring/monitor.py    Monitoring: metrics, change detection, z-score anomalies, history
analysis/analyzer.py     Processing + Analysis: summaries, chart-ready time series
reports/report_generator Report Generation: JSON reports in REPORTS_DIR
api/app.py               Dashboard/API: /health, /monitoring/snapshot, /analysis/summary, /reports
pipeline.py              Wires the steps together (shared by CLI and API)
```

For production scheduling, run `python src/main.py run` from cron or a process manager,
or keep `monitor` running under systemd/supervisor.
