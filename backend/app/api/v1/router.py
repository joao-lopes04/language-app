from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.auth import router as auth_router
from app.api.v1.decks import router as decks_router
from app.api.v1.grammar_notes import router as grammar_notes_router
from app.api.v1.kanji import router as kanji_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.stats import router as stats_router
from app.api.v1.words import router as words_router
from app.db.session import get_db
from app.models.app_meta import AppMeta
from app.schemas.app_meta import AppMetaRead

router = APIRouter()

router.include_router(auth_router)
router.include_router(words_router)
router.include_router(kanji_router)
router.include_router(grammar_notes_router)
router.include_router(decks_router)
router.include_router(reviews_router)
router.include_router(stats_router)


@router.get("/health")
def health_check() -> dict[str, str]:
    """Simple endpoint to verify the API is running (no database)."""
    return {"status": "ok"}


@router.get("/meta", response_model=AppMetaRead)
def read_app_meta(db: Session = Depends(get_db)) -> AppMeta:
    """Read app metadata from SQLite — proves DB + ORM + API wiring."""
    meta = db.get(AppMeta, 1)
    if meta is None:
        raise HTTPException(status_code=404, detail="App metadata not initialized")
    return meta
