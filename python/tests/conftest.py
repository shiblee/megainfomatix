import pytest
from sqlalchemy import text

from database.db import create_db_engine


@pytest.fixture
def engine(tmp_path):
    """A throwaway SQLite database with a users table matching the Node.js migration."""
    engine = create_db_engine(f"sqlite:////{tmp_path / 'test.db'}")
    with engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, password_hash TEXT,"
            " role TEXT, is_active BOOLEAN, created_at DATETIME, updated_at DATETIME)"
        ))
        conn.execute(text(
            "INSERT INTO users (name, email, password_hash, role, is_active, created_at) VALUES"
            " ('A', 'a@x.io', 'h', 'admin', 1, '2026-11-01 10:00:00'),"
            " ('B', 'b@x.io', 'h', 'user', 1, '2026-11-01 12:00:00'),"
            " ('C', 'c@x.io', 'h', 'user', 0, '2026-11-03 09:00:00')"
        ))
        conn.execute(text("CREATE TABLE knex_migrations (id INTEGER PRIMARY KEY)"))
    return engine
