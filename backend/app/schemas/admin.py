from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.core.study_language import StudyLanguage


class AdminUserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    study_language: StudyLanguage
    created_at: datetime
    word_count: int
