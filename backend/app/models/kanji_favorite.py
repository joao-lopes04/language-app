from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class KanjiFavorite(Base):
    __tablename__ = "kanji_favorites"
    __table_args__ = (UniqueConstraint("user_id", "kanji_id", name="uq_kanji_fav_user_kanji"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kanji_id: Mapped[int] = mapped_column(ForeignKey("kanji.id", ondelete="CASCADE"), index=True)
