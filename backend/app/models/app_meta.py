from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AppMeta(Base):
    """Single-row table used in M2 to prove the database layer works."""

    __tablename__ = "app_meta"

    id: Mapped[int] = mapped_column(primary_key=True)
    app_name: Mapped[str] = mapped_column(String(120))
    schema_version: Mapped[str] = mapped_column(String(20))
