from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.jlpt import JlptLevel
from app.schemas.word import WordRead


class DeckBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class DeckCreate(DeckBase):
    pass


class DeckUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)


class DeckSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime
    word_count: int = 0


class DeckRead(DeckBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    words: list[WordRead] = Field(default_factory=list)


class DeckWordsUpdate(BaseModel):
    word_ids: list[int] = Field(default_factory=list)


class DeckFromJlpt(BaseModel):
    jlpt_level: JlptLevel


class DeckFromHsk(BaseModel):
    hsk_level: int = Field(ge=1, le=6)
