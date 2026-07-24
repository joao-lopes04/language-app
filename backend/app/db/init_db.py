from sqlalchemy.orm import Session

import app.models.app_meta  # noqa: F401 — register models with SQLAlchemy
import app.models.deck  # noqa: F401
import app.models.grammar_note  # noqa: F401
import app.models.kanji  # noqa: F401
import app.models.kanji_favorite  # noqa: F401
import app.models.password_reset_token  # noqa: F401
import app.models.user  # noqa: F401
import app.models.review_event  # noqa: F401
import app.models.word_review  # noqa: F401
import app.models.word  # noqa: F401

from app.db.base import Base
from app.db.schema_patches import apply_sqlite_schema_patches
from app.db.seed_kanji import seed_kanji_if_empty
from app.db.session import SessionLocal, engine
from app.models.app_meta import AppMeta


def init_db() -> None:
    """Create tables and seed default data if the database is empty."""
    Base.metadata.create_all(bind=engine)
    apply_sqlite_schema_patches()
    db: Session = SessionLocal()
    try:
        existing = db.get(AppMeta, 1)
        if existing is None:
            db.add(
                AppMeta(
                    id=1,
                    app_name="Japanese Study App",
                    schema_version="m2",
                )
            )
            db.commit()
        seed_kanji_if_empty(db)
    finally:
        db.close()
