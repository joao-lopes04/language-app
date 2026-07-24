from sqlalchemy import inspect, text

from app.db.session import engine


def _column_names(table: str) -> set[str]:
    inspector = inspect(engine)
    if table not in inspector.get_table_names():
        return set()
    return {col["name"] for col in inspector.get_columns(table)}


def _add_column_if_missing(table: str, column: str, ddl: str) -> None:
    if column in _column_names(table):
        return
    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {ddl}"))


def _table_create_sql(table: str) -> str | None:
    inspector = inspect(engine)
    if table not in inspector.get_table_names():
        return None
    with engine.connect() as connection:
        row = connection.execute(
            text("SELECT sql FROM sqlite_master WHERE type='table' AND name=:name"),
            {"name": table},
        ).fetchone()
    if row is None:
        return None
    return str(row[0])


def _migrate_kanji_composite_unique() -> None:
    """
    Replace legacy UNIQUE(character) with UNIQUE(language_code, character).

    Older databases were created before multi-language kanji; Chinese seed data
    shares characters with Japanese and requires the composite key.
    """
    create_sql = _table_create_sql("kanji")
    if create_sql is None:
        return
    if "uq_kanji_lang_character" in create_sql:
        return
    if "uq_kanji_character" not in create_sql and "UNIQUE (character)" not in create_sql:
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE kanji_new (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    language_code VARCHAR(8) NOT NULL DEFAULT 'ja',
                    character VARCHAR(4) NOT NULL,
                    meanings VARCHAR(500) NOT NULL,
                    on_readings VARCHAR(200),
                    kun_readings VARCHAR(200),
                    stroke_count INTEGER,
                    jlpt_level VARCHAR(2),
                    notes TEXT,
                    CONSTRAINT uq_kanji_lang_character
                        UNIQUE (language_code, character)
                )
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO kanji_new (
                    id,
                    language_code,
                    character,
                    meanings,
                    on_readings,
                    kun_readings,
                    stroke_count,
                    jlpt_level,
                    notes
                )
                SELECT
                    id,
                    COALESCE(NULLIF(language_code, ''), 'ja'),
                    character,
                    meanings,
                    on_readings,
                    kun_readings,
                    stroke_count,
                    jlpt_level,
                    notes
                FROM kanji
                """
            )
        )
        connection.execute(text("DROP TABLE kanji"))
        connection.execute(text("ALTER TABLE kanji_new RENAME TO kanji"))
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_kanji_jlpt_level "
                "ON kanji (jlpt_level)"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_kanji_language_code "
                "ON kanji (language_code)"
            )
        )


def apply_sqlite_schema_patches() -> None:
    """
    Add columns to existing SQLite tables when models change.

    create_all() only creates new tables; it does not alter existing ones.
    """
    if not engine.url.drivername.startswith("sqlite"):
        return

    _add_column_if_missing(
        "words",
        "jlpt_level",
        "jlpt_level VARCHAR(2) NOT NULL DEFAULT 'N5'",
    )
    _add_column_if_missing("words", "user_id", "user_id INTEGER")
    _add_column_if_missing("words", "study_language", "study_language VARCHAR(8)")

    _add_column_if_missing("grammar_notes", "user_id", "user_id INTEGER")
    _add_column_if_missing(
        "grammar_notes",
        "study_language",
        "study_language VARCHAR(8)",
    )

    _add_column_if_missing("decks", "user_id", "user_id INTEGER")
    _add_column_if_missing("decks", "study_language", "study_language VARCHAR(8)")

    _add_column_if_missing(
        "kanji",
        "language_code",
        "language_code VARCHAR(8) NOT NULL DEFAULT 'ja'",
    )

    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_words_jlpt_level "
                "ON words (jlpt_level)"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_words_user_id "
                "ON words (user_id)"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_kanji_language_code "
                "ON kanji (language_code)"
            )
        )

    # Backfill kanji language for rows created before M10+ auth work.
    if "language_code" in _column_names("kanji"):
        with engine.begin() as connection:
            connection.execute(
                text(
                    "UPDATE kanji SET language_code = 'ja' "
                    "WHERE language_code IS NULL OR language_code = ''"
                )
            )

    _add_column_if_missing(
        "kanji",
        "hsk_level",
        "hsk_level INTEGER",
    )

    _migrate_kanji_composite_unique()
