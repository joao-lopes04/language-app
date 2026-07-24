"""Load kanji / hanzi seed rows from JSON files in backend/data/kanji/."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.core.jlpt import JlptLevel
from app.core.study_language import StudyLanguage

_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "kanji"

_FILE_BY_LANGUAGE: dict[StudyLanguage, str] = {
    StudyLanguage.JAPANESE: "ja.json",
    StudyLanguage.CHINESE: "zh.json",
}


def _parse_row(raw: dict[str, Any]) -> dict[str, Any]:
    row = dict(raw)
    jlpt = row.get("jlpt_level")
    if jlpt is None:
        row["jlpt_level"] = None
    elif isinstance(jlpt, str):
        row["jlpt_level"] = JlptLevel(jlpt)
    return row


def load_kanji_seed_rows(language: StudyLanguage) -> list[dict[str, Any]]:
    filename = _FILE_BY_LANGUAGE[language]
    path = _DATA_DIR / filename
    if not path.is_file():
        raise FileNotFoundError(f"Kanji seed file missing: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array")
    return [_parse_row(item) for item in data if isinstance(item, dict)]
