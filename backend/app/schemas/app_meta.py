from pydantic import BaseModel, ConfigDict


class AppMetaRead(BaseModel):
    """JSON shape returned when reading app metadata from the database."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    app_name: str
    schema_version: str
