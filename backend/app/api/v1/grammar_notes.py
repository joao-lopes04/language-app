from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.jlpt import JlptLevel
from app.db.session import get_db
from app.models.grammar_note import GrammarNote
from app.models.user import User
from app.schemas.grammar_note import (
    GrammarNoteCreate,
    GrammarNoteRead,
    GrammarNoteUpdate,
)
from app.services.ownership import get_owned_grammar_note

router = APIRouter(prefix="/grammar-notes", tags=["grammar-notes"])


def _scope_notes(statement, user: User):
    return statement.where(
        GrammarNote.user_id == user.id,
        GrammarNote.study_language == user.study_language,
    )


@router.get("", response_model=list[GrammarNoteRead])
def list_grammar_notes(
    q: str | None = Query(default=None, max_length=100),
    jlpt_level: JlptLevel | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[GrammarNote]:
    statement = _scope_notes(select(GrammarNote), current_user).order_by(
        GrammarNote.updated_at.desc()
    )
    if jlpt_level is not None:
        statement = statement.where(GrammarNote.jlpt_level == jlpt_level)
    if q:
        needle = f"%{q.strip().lower()}%"
        statement = statement.where(
            or_(
                func.lower(GrammarNote.title).like(needle),
                func.lower(GrammarNote.content).like(needle),
            )
        )
    return list(db.scalars(statement).all())


@router.get("/{note_id}", response_model=GrammarNoteRead)
def get_grammar_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GrammarNote:
    return get_owned_grammar_note(db, current_user, note_id)


@router.post("", response_model=GrammarNoteRead, status_code=status.HTTP_201_CREATED)
def create_grammar_note(
    payload: GrammarNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GrammarNote:
    note = GrammarNote(
        **payload.model_dump(),
        user_id=current_user.id,
        study_language=current_user.study_language,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.patch("/{note_id}", response_model=GrammarNoteRead)
def update_grammar_note(
    note_id: int,
    payload: GrammarNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GrammarNote:
    note = get_owned_grammar_note(db, current_user, note_id)
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )
    for field, value in updates.items():
        setattr(note, field, value)
    note.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grammar_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    note = get_owned_grammar_note(db, current_user, note_id)
    db.delete(note)
    db.commit()
