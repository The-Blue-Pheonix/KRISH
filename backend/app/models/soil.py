from pydantic import BaseModel


class Soil(BaseModel):
    moisture: float
    ph: float | None = None
