from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.jlpt import JLPT_LEVELS
from app.db.session import get_db
from app.models.deck import Deck
from app.models.grammar_note import GrammarNote
from app.models.kanji import Kanji
from app.models.review_event import ReviewEvent
from app.models.user import User
from app.models.word import Word
from app.models.word_review import WordReview
from app.schemas.stats import DashboardStats, JlptCount, ReviewsByDay
from app.services.ownership import scope_words
from app.services.srs import utc_now
from app.services.stats import compute_streak

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardStats:
    now = utc_now()

    vocabulary_total = int(
        db.scalar(scope_words(select(func.count()).select_from(Word), current_user)) or 0
    )
    kanji_total = int(
        db.scalar(
            select(func.count())
            .select_from(Kanji)
            .where(Kanji.language_code == current_user.study_language)
        )
        or 0
    )
    grammar_notes_total = int(
        db.scalar(
            select(func.count())
            .select_from(GrammarNote)
            .where(
                GrammarNote.user_id == current_user.id,
                GrammarNote.study_language == current_user.study_language,
            )
        )
        or 0
    )
    decks_total = int(
        db.scalar(
            select(func.count())
            .select_from(Deck)
            .where(
                Deck.user_id == current_user.id,
                Deck.study_language == current_user.study_language,
            )
        )
        or 0
    )
    srs_tracked = int(
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
    srs_due_now = int(
        db.scalar(
            scope_words(select(func.count()).select_from(Word), current_user)
            .outerjoin(WordReview, WordReview.word_id == Word.id)
            .where(or_(WordReview.word_id.is_(None), WordReview.due_at <= now))
        )
        or 0
    )

    user_word_ids = select(Word.id).where(
        Word.user_id == current_user.id,
        Word.study_language == current_user.study_language,
    )
    review_events_total = int(
        db.scalar(
            select(func.count())
            .select_from(ReviewEvent)
            .where(ReviewEvent.word_id.in_(user_word_ids))
        )
        or 0
    )

    jlpt_rows = db.execute(
        scope_words(select(Word.jlpt_level, func.count()), current_user).group_by(
            Word.jlpt_level
        )
    ).all()
    jlpt_map = {level: count for level, count in jlpt_rows}
    vocabulary_by_jlpt = [
        JlptCount(level=level, count=int(jlpt_map.get(level, 0)))
        for level in JLPT_LEVELS
    ]

    event_dates = db.scalars(
        select(ReviewEvent.reviewed_at).where(
            ReviewEvent.word_id.in_(user_word_ids)
        )
    ).all()
    date_set = {
        (dt.astimezone(timezone.utc).date() if dt.tzinfo else dt.date())
        for dt in event_dates
    }
    review_streak_days = compute_streak(date_set)

    start_day = now.astimezone(timezone.utc).date() - timedelta(days=6)
    start_dt = datetime.combine(start_day, datetime.min.time(), tzinfo=timezone.utc)
    daily_rows = db.execute(
        select(func.date(ReviewEvent.reviewed_at), func.count())
        .where(
            ReviewEvent.reviewed_at >= start_dt,
            ReviewEvent.word_id.in_(user_word_ids),
        )
        .group_by(func.date(ReviewEvent.reviewed_at))
        .order_by(func.date(ReviewEvent.reviewed_at))
    ).all()

    counts_by_day = {str(day): int(count) for day, count in daily_rows}
    reviews_last_7_days: list[ReviewsByDay] = []
    for offset in range(7):
        day = start_day + timedelta(days=offset)
        reviews_last_7_days.append(
            ReviewsByDay(day=day, count=counts_by_day.get(day.isoformat(), 0))
        )

    return DashboardStats(
        vocabulary_total=vocabulary_total,
        kanji_total=kanji_total,
        grammar_notes_total=grammar_notes_total,
        decks_total=decks_total,
        srs_tracked=srs_tracked,
        srs_due_now=srs_due_now,
        review_events_total=review_events_total,
        review_streak_days=review_streak_days,
        vocabulary_by_jlpt=vocabulary_by_jlpt,
        reviews_last_7_days=reviews_last_7_days,
    )
