from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.jlpt import JlptLevel
from app.db.session import get_db
from app.models.user import User
from app.models.word import Word
from app.schemas.word import WordCreate, WordRead, WordUpdate
from app.services.ownership import get_owned_word, scope_words
from app.services.word_csv import export_words_csv, import_words_csv
from app.services.word_filters import apply_word_list_filters

router = APIRouter(prefix="/words", tags=["words"])


@router.get("/export", response_class=PlainTextResponse)
def export_words(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PlainTextResponse:
    body = export_words_csv(db, current_user)
    return PlainTextResponse(
        content=body,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="vocabulary.csv"'},
    )


@router.post("/import")
def import_words(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, int]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload a .csv file")
    created, skipped = import_words_csv(db, current_user, file.file)
    return {"created": created, "skipped": skipped}


@router.get("", response_model=list[WordRead])
def list_words(
    jlpt_level: JlptLevel | None = Query(default=None),
    q: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Word]:
    statement = scope_words(select(Word), current_user).order_by(Word.id)
    statement = apply_word_list_filters(statement, jlpt_level=jlpt_level, q=q)
    return list(db.scalars(statement).all())


@router.get("/{word_id}", response_model=WordRead)
def get_word(
    word_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Word:
    return get_owned_word(db, current_user, word_id)


@router.post("", response_model=WordRead, status_code=status.HTTP_201_CREATED)
def create_word(
    payload: WordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Word:
    word = Word(
        **payload.model_dump(),
        user_id=current_user.id,
        study_language=current_user.study_language,
    )
    db.add(word)
    db.commit()
    db.refresh(word)
    return word


@router.patch("/{word_id}", response_model=WordRead)
def update_word(
    word_id: int,
    payload: WordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Word:
    word = get_owned_word(db, current_user, word_id)
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )
    for field, value in updates.items():
        setattr(word, field, value)
    db.commit()
    db.refresh(word)
    return word


@router.delete("/{word_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_word(
    word_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    word = get_owned_word(db, current_user, word_id)
    db.delete(word)
    db.commit()
