from fastapi import HTTPException, status
from sqlalchemy import Select, and_
from sqlalchemy.orm import Session

from app.core.study_language import StudyLanguage
from app.models.deck import Deck
from app.models.grammar_note import GrammarNote
from app.models.user import User
from app.models.word import Word


def scope_words(statement: Select, user: User) -> Select:
    return statement.where(
        Word.user_id == user.id,
        Word.study_language == user.study_language,
    )


def get_owned_word(db: Session, user: User, word_id: int) -> Word:
    word = db.get(Word, word_id)
    if (
        word is None
        or word.user_id != user.id
        or word.study_language != user.study_language
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Word not found")
    return word


def get_owned_deck(db: Session, user: User, deck_id: int) -> Deck:
    deck = db.get(Deck, deck_id)
    if (
        deck is None
        or deck.user_id != user.id
        or deck.study_language != user.study_language
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    return deck


def get_owned_grammar_note(db: Session, user: User, note_id: int) -> GrammarNote:
    note = db.get(GrammarNote, note_id)
    if (
        note is None
        or note.user_id != user.id
        or note.study_language != user.study_language
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


def language_label(language: StudyLanguage) -> str:
    return "Japanese" if language == StudyLanguage.JAPANESE else "Chinese"
