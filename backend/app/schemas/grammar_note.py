from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.jlpt import JlptLevel


class GrammarNoteBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=50000)
    jlpt_level: JlptLevel | None = None


class GrammarNoteCreate(GrammarNoteBase):
    pass


class GrammarNoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1, max_length=50000)
    jlpt_level: JlptLevel | None = None


class GrammarNoteRead(GrammarNoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
