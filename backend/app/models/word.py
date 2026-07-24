from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.jlpt import JlptLevel
from app.core.study_language import StudyLanguage
from app.db.base import Base


class Word(Base):
    """A vocabulary entry (Japanese surface form, reading, and meaning)."""

    __tablename__ = "words"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    study_language: Mapped[StudyLanguage | None] = mapped_column(
        Enum(StudyLanguage, native_enum=False, length=8),
        nullable=True,
        index=True,
    )
    japanese: Mapped[str] = mapped_column(String(100))
    reading: Mapped[str] = mapped_column(String(100))
    meaning: Mapped[str] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    jlpt_level: Mapped[JlptLevel] = mapped_column(
        Enum(JlptLevel, native_enum=False, length=2),
        default=JlptLevel.N5,
        server_default=JlptLevel.N5.value,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    decks: Mapped[list["Deck"]] = relationship(
        secondary="deck_words",
        back_populates="words",
    )
    review: Mapped["WordReview | None"] = relationship(
        back_populates="word",
        uselist=False,
        cascade="all, delete-orphan",
    )