from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.review_event import ReviewEvent
from app.models.user import User
from app.models.word import Word
from app.models.word_review import WordReview
from app.schemas.review import (
    DueWordRead,
    ReviewRatingRequest,
    ReviewRatingResponse,
    ReviewSummary,
    WordReviewState,
)
from app.schemas.word import WordRead
from app.services.ownership import get_owned_word, scope_words
from app.services.srs import apply_review_rating, utc_now

router = APIRouter(prefix="/reviews", tags=["reviews"])


def _review_state(review: WordReview | None) -> WordReviewState | None:
    if review is None:
        return None
    return WordReviewState(
        due_at=review.due_at,
        interval_days=review.interval_days,
        repetitions=review.repetitions,
        lapses=review.lapses,
        last_reviewed_at=review.last_reviewed_at,
    )


@router.get("/summary", response_model=ReviewSummary)
def review_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewSummary:
    now = utc_now()

    total_words = int(
        db.scalar(
            scope_words(select(func.count()).select_from(Word), current_user)
        )
        or 0
    )
    tracked_count = int(
        db.scalar(
            select(func.count())
            .select_from(WordReview)
            .join(Word, Word.id == WordReview.word_id)
            .where(
                Word.user_id == current_user.id,
                Word.study_language == current_user.study_language,
            )
        )
        or 0
    )
    due_count = int(
        db.scalar(
            scope_words(select(func.count()).select_from(Word), current_user)
            .outerjoin(WordReview, WordReview.word_id == Word.id)
            .where(or_(WordReview.word_id.is_(None), WordReview.due_at <= now))
        )
        or 0
    )
    return ReviewSummary(
        due_count=due_count,
        total_words=total_words,
        tracked_count=tracked_count,
    )


@router.get("/due", response_model=list[DueWordRead])
def list_due_words(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DueWordRead]:
    now = utc_now()
    words = list(
        db.scalars(
            scope_words(select(Word), current_user)
            .outerjoin(WordReview, WordReview.word_id == Word.id)
            .where(or_(WordReview.word_id.is_(None), WordReview.due_at <= now))
            .options(selectinload(Word.review))
            .order_by(WordReview.due_at.asc().nullsfirst(), Word.id)
        ).all()
    )

    return [
        DueWordRead(
            **WordRead.model_validate(word).model_dump(),
            review=_review_state(word.review),
        )
        for word in words
    ]


@router.post("/{word_id}/rate", response_model=ReviewRatingResponse)
def rate_word_review(
    word_id: int,
    payload: ReviewRatingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewRatingResponse:
    word = get_owned_word(db, current_user, word_id)

    existing = db.get(WordReview, word_id)
    updated = apply_review_rating(existing, word_id=word_id, rating=payload.rating)
    if existing is None:
        db.add(updated)
    db.add(
        ReviewEvent(
            word_id=word_id,
            rating=payload.rating,
            reviewed_at=utc_now(),
        )
    )
    db.commit()
    db.refresh(updated)

    return ReviewRatingResponse(
        word=WordRead.model_validate(word),
        review=_review_state(updated),
    )
