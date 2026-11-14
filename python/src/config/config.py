"""Environment-based configuration for the Python layer.

Loads python/.env once and exposes an immutable Settings object.
Import `get_settings()` everywhere instead of reading os.environ directly.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

PYTHON_DIR = Path(__file__).resolve().parents[2]  # .../python
ROOT_DIR = PYTHON_DIR.parent  # project root

# Existing environment variables take precedence over .env values.
load_dotenv(PYTHON_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    env: str
    log_level: str
    database_url: str
    monitoring_interval_seconds: int
    anomaly_zscore_threshold: float
    reports_dir: Path
    monitoring_dir: Path
    service_host: str
    service_port: int

    @property
    def is_production(self) -> bool:
        return self.env == "production"


def _resolve(path_value: str) -> Path:
    path = Path(path_value)
    return path if path.is_absolute() else PYTHON_DIR / path


@lru_cache
def get_settings() -> Settings:
    return Settings(
        env=os.getenv("PYTHON_ENV", "development"),
        log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
        database_url=os.getenv("DATABASE_URL") or "sqlite:///data/megainfomatix.db",
        monitoring_interval_seconds=int(os.getenv("MONITORING_INTERVAL_SECONDS", "60")),
        anomaly_zscore_threshold=float(os.getenv("ANOMALY_ZSCORE_THRESHOLD", "3.0")),
        reports_dir=_resolve(os.getenv("REPORTS_DIR", "output/reports")),
        monitoring_dir=_resolve(os.getenv("MONITORING_DIR", "output/monitoring")),
        service_host=os.getenv("PYTHON_SERVICE_HOST", "127.0.0.1"),
        service_port=int(os.getenv("PYTHON_SERVICE_PORT", "8000")),
    )
