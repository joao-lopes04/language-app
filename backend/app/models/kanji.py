from sqlalchemy import Enum, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.jlpt import JlptLevel
from app.core.study_language import StudyLanguage
from app.db.base import Base


class Kanji(Base):
    """Read-only character dictionary entry (Japanese kanji or Chinese hanzi)."""

    __tablename__ = "kanji"
    __table_args__ = (
        UniqueConstraint("language_code", "character", name="uq_kanji_lang_character"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    language_code: Mapped[StudyLanguage] = mapped_column(
        Enum(StudyLanguage, native_enum=False, length=8),
        default=StudyLanguage.JAPANESE,
        server_default=StudyLanguage.JAPANESE.value,
        index=True,
    )
    character: Mapped[str] = mapped_column(String(4))
    meanings: Mapped[str] = mapped_column(String(500))
    on_readings: Mapped[str | None] = mapped_column(String(200), nullable=True)
    kun_readings: Mapped[str | None] = mapped_column(String(200), nullable=True)
    stroke_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    jlpt_level: Mapped[JlptLevel | None] = mapped_column(
        Enum(JlptLevel, native_enum=False, length=2),
        nullable=True,
        index=True,
    )
    hsk_level: Mapped[int | None] = mapped_column(nullable=True, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
