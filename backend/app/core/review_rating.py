import enum


class ReviewRating(str, enum.Enum):
    """How well you remembered a card during review."""

    AGAIN = "again"
    GOOD = "good"
    EASY = "easy"
