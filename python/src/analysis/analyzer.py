"""Data analysis: statistical summaries and dataset preparation for dashboards/reports.

`DataAnalyzer` holds generic, reusable operations on DataFrames.
`analyze_database()` builds the current analysis summary from application data.
Future analytical models can live alongside these as new functions/classes.
"""
from __future__ import annotations

import pandas as pd
from sqlalchemy import Engine

from database.db import get_engine, list_tables, read_table


class DataAnalyzer:
    """Generic, dataset-agnostic analysis helpers."""

    @staticmethod
    def describe_numeric(df: pd.DataFrame) -> dict:
        numeric = df.select_dtypes("number")
        if numeric.empty:
            return {}
        return numeric.describe().to_dict()

    @staticmethod
    def value_counts(df: pd.DataFrame, column: str) -> dict:
        if column not in df or df.empty:
            return {}
        return df[column].value_counts(dropna=False).to_dict()

    @staticmethod
    def time_series_counts(df: pd.DataFrame, date_column: str, freq: str = "D") -> list[dict]:
        """Count rows per period (D=day, W=week, MS=month) — ready for charting."""
        if date_column not in df or df.empty:
            return []
        dates = pd.to_datetime(df[date_column], errors="coerce", utc=True).dropna()
        if dates.empty:
            return []
        series = dates.dt.floor("D").value_counts().sort_index().resample(freq).sum()
        return [{"period": ts.date().isoformat(), "count": int(count)} for ts, count in series.items()]


def analyze_users(engine: Engine) -> dict:
    df = read_table("users", engine, columns=["id", "role", "is_active", "created_at"])
    if df.empty:
        return {"total": 0, "active": 0, "by_role": {}, "signups_by_day": []}

    analyzer = DataAnalyzer()
    return {
        "total": int(len(df)),
        "active": int(df["is_active"].astype(bool).sum()),
        "by_role": analyzer.value_counts(df, "role"),
        "signups_by_day": analyzer.time_series_counts(df, "created_at", "D"),
    }


def analyze_database(engine: Engine | None = None) -> dict:
    engine = engine or get_engine()
    tables = list_tables(engine)
    return {
        "tables": tables,
        "users": analyze_users(engine) if "users" in tables else None,
    }
