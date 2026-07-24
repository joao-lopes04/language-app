from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.deck import Deck
from app.models.user import User
from app.models.word import Word
from app.schemas.deck import (
    DeckCreate,
    DeckRead,
    DeckSummary,
    DeckUpdate,
    DeckWordsUpdate,
)
from app.schemas.word import WordRead
from app.services.ownership import get_owned_deck, scope_words

router = APIRouter(prefix="/decks", tags=["decks"])


def _deck_to_read(deck: Deck) -> DeckRead:
    return DeckRead(
        id=deck.id,
        name=deck.name,
        created_at=deck.created_at,
        words=[WordRead.model_validate(word) for word in deck.words],
    )


def _scope_decks(statement, user: User):
    return statement.where(
        Deck.user_id == user.id,
        Deck.study_language == user.study_language,
    )


@router.get("", response_model=list[DeckSummary])
def list_decks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DeckSummary]:
    decks = list(
        db.scalars(
            _scope_decks(select(Deck), current_user)
            .options(selectinload(Deck.words))
            .order_by(Deck.id)
        ).all()
    )
    return [
        DeckSummary(
            id=deck.id,
            name=deck.name,
            created_at=deck.created_at,
            word_count=len(deck.words),
        )
        for deck in decks
    ]


@router.get("/{deck_id}", response_model=DeckRead)
def get_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeckRead:
    deck = db.scalar(
        _scope_decks(
            select(Deck).options(selectinload(Deck.words)),
            current_user,
        ).where(Deck.id == deck_id)
    )
    if deck is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    return _deck_to_read(deck)


@router.post("", response_model=DeckRead, status_code=status.HTTP_201_CREATED)
def create_deck(
    payload: DeckCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeckRead:
    deck = Deck(
        name=payload.name,
        user_id=current_user.id,
        study_language=current_user.study_language,
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return _deck_to_read(deck)


@router.patch("/{deck_id}", response_model=DeckRead)
def update_deck(
    deck_id: int,
    payload: DeckUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeckRead:
    deck = get_owned_deck(db, current_user, deck_id)
    db.refresh(deck, attribute_names=["words"])
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )
    for field, value in updates.items():
        setattr(deck, field, value)
    db.commit()
    db.refresh(deck)
    return _deck_to_read(deck)


@router.put("/{deck_id}/words", response_model=DeckRead)
def set_deck_words(
    deck_id: int,
    payload: DeckWordsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeckRead:
    deck = get_owned_deck(db, current_user, deck_id)
    db.refresh(deck, attribute_names=["words"])

    if payload.word_ids:
        words = list(
            db.scalars(
                scope_words(select(Word), current_user).where(
                    Word.id.in_(payload.word_ids)
                )
            ).all()
        )
        found_ids = {word.id for word in words}
        missing = [wid for wid in payload.word_ids if wid not in found_ids]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown or inaccessible word ids: {missing}",
            )
        deck.words = words
    else:
        deck.words = []

    db.commit()
    db.refresh(deck)
    return _deck_to_read(deck)


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    deck = get_owned_deck(db, current_user, deck_id)
    db.delete(deck)
    db.commit()
