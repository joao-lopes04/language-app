from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.jlpt import JlptLevel
from app.core.study_language import StudyLanguage
from app.models.kanji import Kanji

JAPANESE_KANJI_SEED: tuple[dict[str, object], ...] = (
    {
        "character": "人",
        "meanings": "person, people",
        "on_readings": "ジン、ニン",
        "kun_readings": "ひと",
        "stroke_count": 2,
        "jlpt_level": JlptLevel.N5,
    },
    {
        "character": "本",
        "meanings": "book, origin, true",
        "on_readings": "ホン",
        "kun_readings": "もと",
        "stroke_count": 5,
        "jlpt_level": JlptLevel.N5,
    },
    {
        "character": "食",
        "meanings": "eat, food",
        "on_readings": "ショク、ジキ",
        "kun_readings": "たべる、くう",
        "stroke_count": 9,
        "jlpt_level": JlptLevel.N5,
    },
    {
        "character": "水",
        "meanings": "water",
        "on_readings": "スイ",
        "kun_readings": "みず",
        "stroke_count": 4,
        "jlpt_level": JlptLevel.N5,
    },
)

CHINESE_HANZI_SEED: tuple[dict[str, object], ...] = (
    {
        "character": "人",
        "meanings": "person",
        "on_readings": "rén",
        "kun_readings": None,
        "stroke_count": 2,
        "jlpt_level": None,
        "notes": "Common character in 中国人 (Chinese person).",
    },
    {
        "character": "好",
        "meanings": "good, like",
        "on_readings": "hǎo",
        "kun_readings": None,
        "stroke_count": 6,
        "jlpt_level": None,
    },
    {
        "character": "学",
        "meanings": "study, learn",
        "on_readings": "xué",
        "kun_readings": None,
        "stroke_count": 8,
        "jlpt_level": None,
    },
    {
        "character": "水",
        "meanings": "water",
        "on_readings": "shuǐ",
        "kun_readings": None,
        "stroke_count": 4,
        "jlpt_level": None,
    },
)


def _seed_language(
    db: Session,
    language: StudyLanguage,
    rows: tuple[dict[str, object], ...],
) -> None:
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
    db.commit()


def seed_kanji_if_empty(db: Session) -> None:
    _seed_language(db, StudyLanguage.JAPANESE, JAPANESE_KANJI_SEED)
    _seed_language(db, StudyLanguage.CHINESE, CHINESE_HANZI_SEED)
