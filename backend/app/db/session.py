from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _normalize_database_url(url: str) -> str:
    """Render and other hosts often use postgres://; SQLAlchemy 2 + psycopg needs postgresql+psycopg://."""
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://") :]
    if url.startswith("postgresql://") and "+psycopg" not in url and "+psycopg2" not in url:
        return "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


_db_url = _normalize_database_url(settings.database_url)

# check_same_thread=False is required for SQLite when FastAPI uses the same engine
# across different request threads in development.
connect_args = (
    {"check_same_thread": False} if _db_url.startswith("sqlite") else {}
)

engine = create_engine(_db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Open a DB session per request and always close it afterward."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
