from sqlalchemy import Select, func, or_

from app.core.jlpt import JlptLevel
from app.models.word import Word


def apply_word_list_filters(
    statement: Select[tuple[Word]],
    *,
    jlpt_level: JlptLevel | None,
    q: str | None,
) -> Select[tuple[Word]]:
    if jlpt_level is not None:
        statement = statement.where(Word.jlpt_level == jlpt_level)

    if q:
        needle = f"%{q.strip().lower()}%"
        statement = statement.where(
            or_(
                func.lower(Word.japanese).like(needle),
                func.lower(Word.reading).like(needle),
                func.lower(Word.meaning).like(needle),
                func.lower(Word.notes).like(needle),
            )
        )

    return statement
