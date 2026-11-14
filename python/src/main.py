"""Python layer entry point.

    python src/main.py run                     # run the full pipeline once and write a report
    python src/main.py monitor                 # monitor on a schedule (MONITORING_INTERVAL_SECONDS)
    python src/main.py monitor --once          # take a single snapshot (use this from cron)
    python src/main.py serve                   # start the internal HTTP API (PYTHON_SERVICE_URL)
    python src/main.py query <name>            # run one operation, print a JSON envelope (used by Node)
                                               #   names: health, monitoring-snapshot, analysis-summary,
                                               #          reports-latest, reports-generate
Heavy modules are imported inside each command so `query health` stays fast.
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
import time

from config.config import get_settings
from utils.helpers import setup_logging

logger = logging.getLogger("megainfomatix")


def cmd_run(_args: argparse.Namespace) -> None:
    from pipeline import run_pipeline

    print(json.dumps(run_pipeline(), indent=2))


def cmd_monitor(args: argparse.Namespace) -> None:
    from pipeline import build_monitor

    settings = get_settings()
    monitor = build_monitor(settings)
    interval = args.interval or settings.monitoring_interval_seconds

    if args.once:
        print(json.dumps(monitor.collect_snapshot(), indent=2))
        return

    logger.info("Monitoring every %ss (Ctrl+C to stop)", interval)
    try:
        while True:
            snapshot = monitor.collect_snapshot()
            logger.info(
                "db=%s metrics=%s changes=%d anomalies=%d",
                snapshot["database"], snapshot["metrics"], len(snapshot["changes"]), len(snapshot["anomalies"]),
            )
            time.sleep(interval)
    except KeyboardInterrupt:
        logger.info("Monitoring stopped")


def cmd_serve(args: argparse.Namespace) -> None:
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "api.app:app",
        host=args.host or settings.service_host,
        port=args.port or settings.service_port,
        reload=args.reload,
        log_level=settings.log_level.lower(),
    )


def cmd_query(args: argparse.Namespace) -> None:
    """Print exactly one JSON object on stdout: {"ok": true, "data": ...} or {"ok": false, "status", "detail"}."""
    from api.handlers import QUERIES, ServiceError

    try:
        result = {"ok": True, "data": QUERIES[args.name]()}
    except ServiceError as error:
        result = {"ok": False, "status": error.status, "detail": error.detail}
    except Exception as error:  # noqa: BLE001 - report every failure as JSON for the caller
        logger.exception("Query %s failed", args.name)
        result = {"ok": False, "status": 500, "detail": str(error)}
    sys.stdout.write(json.dumps(result))


def build_parser() -> argparse.ArgumentParser:
    from api.handlers import QUERIES

    parser = argparse.ArgumentParser(description="MegaInfomatix data monitoring & analysis")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("run", help="Run the full pipeline once").set_defaults(func=cmd_run)

    monitor = sub.add_parser("monitor", help="Run scheduled monitoring")
    monitor.add_argument("--once", action="store_true", help="Take a single snapshot and exit")
    monitor.add_argument("--interval", type=int, help="Seconds between snapshots")
    monitor.set_defaults(func=cmd_monitor)

    serve = sub.add_parser("serve", help="Start the internal HTTP API")
    serve.add_argument("--host")
    serve.add_argument("--port", type=int)
    serve.add_argument("--reload", action="store_true", help="Auto-reload on code changes (dev)")
    serve.set_defaults(func=cmd_serve)

    query = sub.add_parser("query", help="Run one operation and print JSON (used by the Node.js server)")
    query.add_argument("name", choices=sorted(QUERIES))
    query.set_defaults(func=cmd_query)

    return parser


def main() -> None:
    settings = get_settings()
    args = build_parser().parse_args()
    # Keep stderr quiet for machine calls; logs never go to stdout.
    setup_logging("WARNING" if args.command == "query" else settings.log_level)
    logger.info("Environment: %s", settings.env)
    args.func(args)


if __name__ == "__main__":
    main()
