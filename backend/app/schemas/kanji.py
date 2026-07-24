from pydantic import BaseModel, ConfigDict, Field

from app.core.jlpt import JlptLevel
from app.schemas.word import WordRead


class KanjiSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    character: str
    meanings: str
    jlpt_level: JlptLevel | None = None
    hsk_level: int | None = None
    is_favorite: bool = False


class KanjiRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    character: str
    meanings: str
    on_readings: str | None = None
    kun_readings: str | None = None
    stroke_count: int | None = None
    jlpt_level: JlptLevel | None = None
    hsk_level: int | None = None
    notes: str | None = None


class KanjiDetail(KanjiRead):
    related_words: list[WordRead] = Field(default_factory=list)
    is_favorite: bool = False


class KanjiPage(BaseModel):
    items: list[KanjiSummary]
    total: int
    limit: int
    offset: int
