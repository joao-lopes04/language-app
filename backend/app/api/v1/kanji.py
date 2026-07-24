from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.jlpt import JlptLevel
from app.db.session import get_db
from app.models.kanji import Kanji
from app.models.user import User
from app.models.word import Word
from app.schemas.kanji import KanjiDetail, KanjiRead, KanjiSummary
from app.schemas.word import WordRead
from app.services.ownership import scope_words

router = APIRouter(prefix="/kanji", tags=["kanji"])


@router.get("", response_model=list[KanjiSummary])
def list_kanji(
    q: str | None = Query(default=None, max_length=50),
    jlpt_level: JlptLevel | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Kanji]:
    statement = (
        select(Kanji)
        .where(Kanji.language_code == current_user.study_language)
        .order_by(Kanji.id)
    )
    if jlpt_level is not None:
        statement = statement.where(Kanji.jlpt_level == jlpt_level)
    if q:
        needle = f"%{q.strip().lower()}%"
        statement = statement.where(
            or_(
                func.lower(Kanji.character).like(needle),
                func.lower(Kanji.meanings).like(needle),
                func.lower(Kanji.on_readings).like(needle),
                func.lower(Kanji.kun_readings).like(needle),
            )
        )
    return list(db.scalars(statement).all())


@router.get("/{kanji_id}", response_model=KanjiDetail)
def get_kanji(
    kanji_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> KanjiDetail:
    kanji = db.get(Kanji, kanji_id)
    if kanji is None or kanji.language_code != current_user.study_language:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kanji not found")

    related_words = [
        WordRead.model_validate(word)
        for word in db.scalars(
            scope_words(select(Word), current_user)
            .where(Word.japanese.contains(kanji.character))
            .order_by(Word.id)
        ).all()
    ]

    return KanjiDetail(
        **KanjiRead.model_validate(kanji).model_dump(),
        related_words=related_words,
    )
