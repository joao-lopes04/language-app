from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.review_rating import ReviewRating
from app.schemas.word import WordRead


class ReviewSummary(BaseModel):
    due_count: int
    total_words: int
    tracked_count: int


class WordReviewState(BaseModel):
    due_at: datetime
    interval_days: float
    repetitions: int
    lapses: int
    last_reviewed_at: datetime | None = None


class DueWordRead(WordRead):
    review: WordReviewState | None = None


class ReviewRatingRequest(BaseModel):
    rating: ReviewRating = Field(description="again, good, or easy")


class ReviewRatingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    word: WordRead
    review: WordReviewState
