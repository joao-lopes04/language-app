from datetime import date, timedelta

from app.core.jlpt import JLPT_LEVELS, JlptLevel


def compute_streak(review_dates: set[date]) -> int:
    """
    Count consecutive calendar days with at least one review, ending on the
    most recent day you studied.
    """
    if not review_dates:
        return 0

    streak = 0
    cursor = max(review_dates)
    while cursor in review_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def empty_jlpt_counts() -> dict[JlptLevel, int]:
    return {level: 0 for level in JLPT_LEVELS}
