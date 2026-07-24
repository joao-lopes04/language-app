import enum


class JlptLevel(str, enum.Enum):
    """JLPT levels from beginner (N5) to advanced (N1)."""

    N5 = "N5"
    N4 = "N4"
    N3 = "N3"
    N2 = "N2"
    N1 = "N1"


JLPT_LEVELS: tuple[JlptLevel, ...] = (
    JlptLevel.N5,
    JlptLevel.N4,
    JlptLevel.N3,
    JlptLevel.N2,
    JlptLevel.N1,
)
