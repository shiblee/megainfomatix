"""Report generation: assemble sections into a report and persist it as JSON.

Reports are written to REPORTS_DIR as report_<timestamp>.json. Other output
formats (CSV, PDF, HTML) can be added as extra `export_*` methods.
"""
from __future__ import annotations

import json
from pathlib import Path

from utils.helpers import to_jsonable, utc_now, write_json


class ReportGenerator:
    def __init__(self, reports_dir: Path):
        self.reports_dir = reports_dir

    def build(self, title: str, sections: dict) -> dict:
        generated_at = utc_now()
        return to_jsonable({
            "id": generated_at.strftime("%Y%m%dT%H%M%SZ"),
            "title": title,
            "generated_at": generated_at.isoformat(timespec="seconds"),
            "sections": sections,
        })

    def save(self, report: dict) -> Path:
        return write_json(self.reports_dir / f"report_{report['id']}.json", report)

    def generate(self, title: str, sections: dict) -> dict:
        report = self.build(title, sections)
        report["path"] = str(self.save(report))
        return report

    def latest(self) -> dict | None:
        files = sorted(self.reports_dir.glob("report_*.json"))
        return json.loads(files[-1].read_text(encoding="utf-8")) if files else None
