from app.core.config import settings
from app.models.user import User
from app.schemas.auth import UserRead


def user_to_read(user: User) -> UserRead:
    return UserRead(
        id=user.id,
        email=user.email,
        study_language=user.study_language,
        is_admin=user.email.lower() in settings.admin_email_set,
    )
