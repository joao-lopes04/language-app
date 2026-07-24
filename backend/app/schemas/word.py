from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.jlpt import JlptLevel


class WordBase(BaseModel):
    japanese: str = Field(min_length=1, max_length=100)
    reading: str = Field(min_length=1, max_length=100)
    meaning: str = Field(min_length=1, max_length=500)
    notes: str | None = Field(default=None, max_length=2000)
    jlpt_level: JlptLevel = JlptLevel.N5


class WordCreate(WordBase):
    pass


class WordUpdate(BaseModel):
    japanese: str | None = Field(default=None, min_length=1, max_length=100)
    reading: str | None = Field(default=None, min_length=1, max_length=100)
    meaning: str | None = Field(default=None, min_length=1, max_length=500)
    notes: str | None = Field(default=None, max_length=2000)
    jlpt_level: JlptLevel | None = None


class WordRead(WordBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime