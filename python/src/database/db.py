"""Database access for the Python layer (SQLAlchemy).

DATABASE_URL uses the same format as the Node.js server, so both layers can share it:
    sqlite:///data/megainfomatix.db       relative to the project root
    sqlite:////absolute/path/app.db
    postgresql://user:pass@host:5432/db   -> postgresql+psycopg (pip install "psycopg[binary]")
    mysql://user:pass@host:3306/db        -> mysql+pymysql      (pip install pymysql)

The Node.js server owns the schema (Knex migrations). This layer only reads.
"""
from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

import pandas as pd
from sqlalchemy import Engine, create_engine, inspect, text
from sqlalchemy.pool import StaticPool

from config.config import ROOT_DIR, get_settings

INTERNAL_TABLE_PREFIXES = ("knex_", "sqlite_", "alembic_")


def normalize_database_url(url: str, root_dir: Path = ROOT_DIR) -> str:
    """Translate a shared DATABASE_URL into a SQLAlchemy URL."""
    url = url.strip()

    if url.startswith("sqlite:"):
        rest = url[len("sqlite://"):]
        if rest in ("", "/:memory:", ":memory:"):
            return "sqlite://"
        path = Path(rest[1:] if rest.startswith("/") else rest)
        if not path.is_absolute():
            path = root_dir / path
        return f"sqlite:///{path}"

    if re.match(r"^postgres(ql)?://", url):
        return re.sub(r"^postgres(ql)?://", "postgresql+psycopg://", url)

    if url.startswith("mysql://"):
        return "mysql+pymysql://" + url[len("mysql://"):]

    return url  # already a SQLAlchemy URL, e.g. postgresql+psycopg://...


def create_db_engine(database_url: str) -> Engine:
    url = normalize_database_url(database_url)
    if url == "sqlite://":
        return create_engine(url, poolclass=StaticPool, connect_args={"check_same_thread": False})
    if url.startswith("sqlite:///"):
        Path(url[len("sqlite:///"):]).parent.mkdir(parents=True, exist_ok=True)
    return create_engine(url, pool_pre_ping=True)


@lru_cache
def get_engine() -> Engine:
    return create_db_engine(get_settings().database_url)


def check_connection(engine: Engine | None = None) -> bool:
    engine = engine or get_engine()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:  # noqa: BLE001 - report any driver error as "down"
        return False


def list_tables(engine: Engine | None = None) -> list[str]:
    engine = engine or get_engine()
    return sorted(
        name for name in inspect(engine).get_table_names() if not name.startswith(INTERNAL_TABLE_PREFIXES)
    )


def count_rows(table: str, engine: Engine | None = None) -> int:
    engine = engine or get_engine()
    if table not in list_tables(engine):
        raise ValueError(f"Unknown table: {table}")
    with engine.connect() as conn:
        return int(conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar_one())


def read_table(table: str, engine: Engine | None = None, columns: list[str] | None = None) -> pd.DataFrame:
    engine = engine or get_engine()
    if table not in list_tables(engine):
        return pd.DataFrame(columns=columns or [])
    cols = ", ".join(f'"{c}"' for c in columns) if columns else "*"
    with engine.connect() as conn:
        return pd.read_sql(text(f'SELECT {cols} FROM "{table}"'), conn)
