from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.jlpt import JlptLevel
from app.db.session import get_db
from app.models.kanji import Kanji
from app.models.kanji_favorite import KanjiFavorite
from app.models.user import User
from app.models.word import Word
from app.schemas.kanji import KanjiDetail, KanjiPage, KanjiSummary
from app.schemas.word import WordRead
from app.services.ownership import scope_words

router = APIRouter(prefix="/kanji", tags=["kanji"])


def _favorite_ids(db: Session, user_id: int) -> set[int]:
    rows = db.scalars(select(KanjiFavorite.kanji_id).where(KanjiFavorite.user_id == user_id)).all()
    return set(rows)


def _base_statement(user: User):
    return (
        select(Kanji)
        .where(Kanji.language_code == user.study_language)
        .order_by(Kanji.character, Kanji.id)
    )


def _apply_filters(
    statement,
    *,
    q: str | None,
    jlpt_level: JlptLevel | None,
    hsk_level: int | None,
    favorites_only: bool,
    user_id: int,
):
    if jlpt_level is not None:
        statement = statement.where(Kanji.jlpt_level == jlpt_level)
    if hsk_level is not None:
        statement = statement.where(Kanji.hsk_level == hsk_level)
    if favorites_only:
        statement = statement.join(
            KanjiFavorite,
            (KanjiFavorite.kanji_id == Kanji.id) & (KanjiFavorite.user_id == user_id),
        )
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
    return statement


@router.get("", response_model=KanjiPage)
def list_kanji(
    q: str | None = Query(default=None, max_length=50),
    jlpt_level: JlptLevel | None = Query(default=None),
    hsk_level: int | None = Query(default=None, ge=1, le=6),
    favorites_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> KanjiPage:
    statement = _apply_filters(
        _base_statement(current_user),
        q=q,
        jlpt_level=jlpt_level,
        hsk_level=hsk_level,
        favorites_only=favorites_only,
        user_id=current_user.id,
    )
    count_statement = _apply_filters(
        select(func.count())
        .select_from(Kanji)
        .where(Kanji.language_code == current_user.study_language),
        q=q,
        jlpt_level=jlpt_level,
        hsk_level=hsk_level,
        favorites_only=favorites_only,
        user_id=current_user.id,
    )
    total = int(db.scalar(count_statement) or 0)
    rows = list(db.scalars(statement.limit(limit).offset(offset)).all())
    favs = _favorite_ids(db, current_user.id)
    items = [
        KanjiSummary(
            id=k.id,
            character=k.character,
            meanings=k.meanings,
            jlpt_level=k.jlpt_level,
            hsk_level=k.hsk_level,
            is_favorite=k.id in favs,
        )
        for k in rows
    ]
    return KanjiPage(items=items, total=total, limit=limit, offset=offset)


@router.get("/favorites/ids", response_model=list[int])
def list_favorite_ids(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[int]:
    return list(_favorite_ids(db, current_user.id))


@router.post("/{kanji_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
def add_favorite(
    kanji_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    kanji = db.get(Kanji, kanji_id)
    if kanji is None or kanji.language_code != current_user.study_language:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kanji not found")
    exists = db.scalar(
        select(func.count())
        .select_from(KanjiFavorite)
        .where(
            KanjiFavorite.user_id == current_user.id,
            KanjiFavorite.kanji_id == kanji_id,
        )
    )
    if not exists:
        db.add(KanjiFavorite(user_id=current_user.id, kanji_id=kanji_id))
        db.commit()


@router.delete("/{kanji_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    kanji_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    fav = db.scalar(
        select(KanjiFavorite).where(
            KanjiFavorite.user_id == current_user.id,
            KanjiFavorite.kanji_id == kanji_id,
        )
    )
    if fav is not None:
        db.delete(fav)
        db.commit()


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
    favs = _favorite_ids(db, current_user.id)
    return KanjiDetail(
        id=kanji.id,
        character=kanji.character,
        meanings=kanji.meanings,
        on_readings=kanji.on_readings,
        kun_readings=kanji.kun_readings,
        stroke_count=kanji.stroke_count,
        jlpt_level=kanji.jlpt_level,
        hsk_level=kanji.hsk_level,
        notes=kanji.notes,
        related_words=related_words,
        is_favorite=kanji.id in favs,
    )
