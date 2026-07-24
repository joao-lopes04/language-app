import enum


class StudyLanguage(str, enum.Enum):
    """Study target language for a user account."""

    JAPANESE = "ja"
    CHINESE = "zh"


STUDY_LANGUAGES: tuple[StudyLanguage, ...] = (
    StudyLanguage.JAPANESE,
    StudyLanguage.CHINESE,
)

LANGUAGE_LABELS: dict[StudyLanguage, str] = {
    StudyLanguage.JAPANESE: "Japanese",
    StudyLanguage.CHINESE: "Chinese",
}
