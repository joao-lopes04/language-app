from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.jlpt import JlptLevel
from app.core.study_language import StudyLanguage
from app.db.base import Base


class GrammarNote(Base):
    """User-written grammar note (Markdown in content)."""

    __tablename__ = "grammar_notes"

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
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    jlpt_level: Mapped[JlptLevel | None] = mapped_column(
        Enum(JlptLevel, native_enum=False, length=2),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
