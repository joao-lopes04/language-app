from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.study_language import StudyLanguage
from app.db.kanji_seed_loader import load_kanji_seed_rows
from app.models.kanji import Kanji


def _seed_language(db: Session, language: StudyLanguage) -> int:
    rows = load_kanji_seed_rows(language)
    added = 0
    for row in rows:
        character = str(row["character"])
        exists = db.scalar(
            select(func.count())
            .select_from(Kanji)
            .where(
                Kanji.language_code == language,
                Kanji.character == character,
            )
        )
        if exists:
            continue
        db.add(Kanji(language_code=language, **row))
        added += 1
    if added:
        db.commit()
    return added


def seed_kanji_if_empty(db: Session) -> None:
    _seed_language(db, StudyLanguage.JAPANESE)
    _seed_language(db, StudyLanguage.CHINESE)
