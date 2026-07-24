from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.study_language import StudyLanguage


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    study_language: StudyLanguage


class UserSettingsUpdate(BaseModel):
    study_language: StudyLanguage


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
