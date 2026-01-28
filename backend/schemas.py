from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ExerciseBase(BaseModel):
    name_es: str = Field(min_length=1, max_length=200)
    name_en: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=50)


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseOut(ExerciseBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class EntryBase(BaseModel):
    exercise_id: int
    weight_kg: float = Field(gt=0)
    reps: int = Field(gt=0)
    sets: int = Field(gt=0)
    rpe: Optional[float] = Field(default=None, ge=0, le=10)
    date: date
    notes: Optional[str] = Field(default=None, max_length=2000)


class EntryCreate(EntryBase):
    pass


class EntryOut(EntryBase):
    id: int
    created_at: datetime
    exercise: ExerciseOut

    model_config = ConfigDict(from_attributes=True)
