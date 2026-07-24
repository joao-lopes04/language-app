from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user
from app.db.session import get_db
from app.models.user import User
from app.models.word import Word
from app.schemas.admin import AdminUserSummary

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserSummary])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> list[AdminUserSummary]:
    users = list(db.scalars(select(User).order_by(User.id)).all())
    summaries: list[AdminUserSummary] = []
    for user in users:
        word_count = int(
            db.scalar(
                select(func.count()).select_from(Word).where(Word.user_id == user.id)
            )
            or 0
        )
        summaries.append(
            AdminUserSummary(
                id=user.id,
                email=user.email,
                study_language=user.study_language,
                created_at=user.created_at,
                word_count=word_count,
            )
        )
    return summaries
