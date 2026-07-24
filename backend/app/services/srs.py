from datetime import datetime, timedelta, timezone

from app.core.review_rating import ReviewRating
from app.models.word_review import WordReview

AGAIN_DELAY = timedelta(minutes=10)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def apply_review_rating(
    review: WordReview | None,
    *,
    word_id: int,
    rating: ReviewRating,
    now: datetime | None = None,
) -> WordReview:
    """
    Update (or create) SRS fields after the user rates a card.

    This is intentionally simpler than full SM-2 — good enough for learning and M9.
    """
    current = utc_now() if now is None else now

    if review is None:
        review = WordReview(
            word_id=word_id,
            due_at=current,
            interval_days=0.0,
            repetitions=0,
            lapses=0,
        )

    review.last_reviewed_at = current

    if rating == ReviewRating.AGAIN:
        review.lapses += 1
        review.repetitions = 0
        review.interval_days = 0.0
        review.due_at = current + AGAIN_DELAY
    elif rating == ReviewRating.GOOD:
        if review.repetitions == 0:
            review.interval_days = 1.0
        else:
            review.interval_days = min(review.interval_days * 2.0, 180.0)
        review.repetitions += 1
        review.due_at = current + timedelta(days=review.interval_days)
    elif rating == ReviewRating.EASY:
        if review.repetitions == 0:
            review.interval_days = 3.0
        else:
            review.interval_days = min(review.interval_days * 2.5, 180.0)
        review.repetitions += 1
        review.due_at = current + timedelta(days=review.interval_days)

    return review
