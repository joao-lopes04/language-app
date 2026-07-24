from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.study_language import StudyLanguage
from app.db.base import Base

deck_words = Table(
    "deck_words",
    Base.metadata,
    Column(
        "deck_id",
        ForeignKey("decks.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "word_id",
        ForeignKey("words.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Deck(Base):
    """A user-created flashcard deck (subset of vocabulary words)."""

    __tablename__ = "decks"

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
    name: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    words: Mapped[list["Word"]] = relationship(
        secondary=deck_words,
        back_populates="decks",
    )
