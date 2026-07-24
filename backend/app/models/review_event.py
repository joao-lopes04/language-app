from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.jlpt import JlptLevel
from app.core.review_rating import ReviewRating
from app.db.base import Base


class ReviewEvent(Base):
    """History log for statistics (one row per review rating)."""

    __tablename__ = "review_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    word_id: Mapped[int] = mapped_column(
        ForeignKey("words.id", ondelete="CASCADE"),
        index=True,
    )
    rating: Mapped[ReviewRating] = mapped_column(
        Enum(ReviewRating, native_enum=False, length=8),
    )
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )
