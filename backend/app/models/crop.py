from pydantic import BaseModel


class Crop(BaseModel):
    name: str
    growth_stage: str | None = None
