from datetime import date, datetime, timedelta, timezone

from pydantic import BaseModel, Field

from app.core.jlpt import JlptLevel


class JlptCount(BaseModel):
    level: JlptLevel
    count: int


class ReviewsByDay(BaseModel):
    day: date
    count: int


class DashboardStats(BaseModel):
    vocabulary_total: int
    kanji_total: int
    grammar_notes_total: int
    decks_total: int
    srs_tracked: int
    srs_due_now: int
    review_events_total: int
    review_streak_days: int
    vocabulary_by_jlpt: list[JlptCount] = Field(default_factory=list)
    reviews_last_7_days: list[ReviewsByDay] = Field(default_factory=list)
