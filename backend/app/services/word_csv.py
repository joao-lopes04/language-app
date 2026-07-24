import csv
import io
from typing import BinaryIO

from sqlalchemy.orm import Session

from app.core.jlpt import JlptLevel
from app.models.user import User
from app.models.word import Word
from app.services.ownership import scope_words
from sqlalchemy import select


CSV_HEADERS = ("japanese", "reading", "meaning", "notes", "jlpt_level")


def export_words_csv(db: Session, user: User) -> str:
    words = list(
        db.scalars(scope_words(select(Word), user).order_by(Word.id)).all()
    )
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=CSV_HEADERS)
    writer.writeheader()
    for word in words:
        writer.writerow(
            {
                "japanese": word.japanese,
                "reading": word.reading,
                "meaning": word.meaning,
                "notes": word.notes or "",
                "jlpt_level": word.jlpt_level.value,
            }
        )
    return buffer.getvalue()


def import_words_csv(db: Session, user: User, file: BinaryIO) -> tuple[int, int]:
    text = io.TextIOWrapper(file, encoding="utf-8-sig")
    reader = csv.DictReader(text)
    if reader.fieldnames is None:
        return 0, 0
    created = 0
    skipped = 0
    for row in reader:
        japanese = (row.get("japanese") or "").strip()
        reading = (row.get("reading") or "").strip()
        meaning = (row.get("meaning") or "").strip()
        if not japanese or not reading or not meaning:
            skipped += 1
            continue
        level_raw = (row.get("jlpt_level") or "N5").strip().upper()
        try:
            jlpt = JlptLevel(level_raw)
        except ValueError:
            jlpt = JlptLevel.N5
        notes = (row.get("notes") or "").strip() or None
        db.add(
            Word(
                japanese=japanese,
                reading=reading,
                meaning=meaning,
                notes=notes,
                jlpt_level=jlpt,
                user_id=user.id,
                study_language=user.study_language,
            )
        )
        created += 1
    if created:
        db.commit()
    return created, skipped
