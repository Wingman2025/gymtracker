import json
import logging
from datetime import date
from pathlib import Path
from typing import List

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from . import models, schemas
from .db import Base, SessionLocal, engine, get_db

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
SEED_PATH = BASE_DIR / "data" / "exercises.json"

DEFAULT_EXERCISES = [
    {"name_es": "Sentadilla trasera", "name_en": "Back Squat", "category": "powerlifting"},
    {"name_es": "Press de banca", "name_en": "Bench Press", "category": "powerlifting"},
    {"name_es": "Peso muerto", "name_en": "Deadlift", "category": "powerlifting"},
    {"name_es": "Press militar", "name_en": "Overhead Press", "category": "powerlifting"},
    {"name_es": "Sentadilla frontal", "name_en": "Front Squat", "category": "weightlifting"},
    {"name_es": "Arranque", "name_en": "Snatch", "category": "weightlifting"},
    {"name_es": "Cargada", "name_en": "Clean", "category": "weightlifting"},
    {"name_es": "Cargada y envion", "name_en": "Clean & Jerk", "category": "weightlifting"},
    {"name_es": "Power snatch", "name_en": "Power Snatch", "category": "weightlifting"},
    {"name_es": "Power clean", "name_en": "Power Clean", "category": "weightlifting"},
    {"name_es": "Tiron de arranque", "name_en": "Snatch Pull", "category": "weightlifting"},
    {"name_es": "Tiron de cargada", "name_en": "Clean Pull", "category": "weightlifting"},
    {"name_es": "Good morning", "name_en": "Good Morning", "category": "accessory"},
    {"name_es": "Remo con barra", "name_en": "Barbell Row", "category": "accessory"},
    {"name_es": "Zancadas", "name_en": "Lunges", "category": "accessory"},
    {"name_es": "Fondos", "name_en": "Dips", "category": "accessory"},
    {"name_es": "Dominadas", "name_en": "Pull-ups", "category": "accessory"},
    {"name_es": "Hip thrust", "name_en": "Hip Thrust", "category": "accessory"},
    {"name_es": "Extensiones de espalda", "name_en": "Back Extensions", "category": "accessory"},
    {"name_es": "Plancha", "name_en": "Plank", "category": "accessory"},
]

app = FastAPI(title="Gym Tracker")
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


def _load_seed_exercises() -> List[dict]:
    if SEED_PATH.exists():
        try:
            with SEED_PATH.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
            exercises = []
            for item in data.get("exercises", []):
                name_es = str(item.get("name_es", "")).strip()
                name_en = str(item.get("name_en", "")).strip()
                category = str(item.get("category", "powerlifting")).strip() or "powerlifting"
                if name_es and name_en:
                    exercises.append(
                        {
                            "name_es": name_es,
                            "name_en": name_en,
                            "category": category,
                        }
                    )
            if exercises:
                return exercises
        except (OSError, json.JSONDecodeError) as exc:
            logger.warning("Failed to load exercises.json: %s", exc)
    return DEFAULT_EXERCISES


def seed_exercises() -> None:
    db = SessionLocal()
    try:
        if db.query(models.Exercise).count() > 0:
            return
        for item in _load_seed_exercises():
            db.add(models.Exercise(**item))
        db.commit()
    finally:
        db.close()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    seed_exercises()


@app.get("/")
def read_index() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/api/exercises", response_model=list[schemas.ExerciseOut])
def list_exercises(db: Session = Depends(get_db)):
    return (
        db.query(models.Exercise)
        .order_by(models.Exercise.category, models.Exercise.name_en)
        .all()
    )


@app.post("/api/exercises", response_model=schemas.ExerciseOut, status_code=201)
def create_exercise(payload: schemas.ExerciseCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(models.Exercise)
        .filter(
            or_(
                func.lower(models.Exercise.name_es) == payload.name_es.lower(),
                func.lower(models.Exercise.name_en) == payload.name_en.lower(),
            )
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Exercise already exists")

    exercise = models.Exercise(
        name_es=payload.name_es.strip(),
        name_en=payload.name_en.strip(),
        category=payload.category.strip(),
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


@app.get("/api/entries", response_model=list[schemas.EntryOut])
def list_entries(
    date: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Entry).options(selectinload(models.Entry.exercise))
    if date:
        query = query.filter(models.Entry.date == date)
    return query.order_by(models.Entry.date.desc(), models.Entry.created_at.desc()).all()


@app.post("/api/entries", response_model=schemas.EntryOut, status_code=201)
def create_entry(payload: schemas.EntryCreate, db: Session = Depends(get_db)):
    exercise = db.get(models.Exercise, payload.exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    entry = models.Entry(
        exercise_id=payload.exercise_id,
        weight_kg=payload.weight_kg,
        reps=payload.reps,
        sets=payload.sets,
        rpe=payload.rpe,
        date=payload.date,
        notes=payload.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    entry.exercise = exercise
    return entry


@app.delete("/api/entries/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.get(models.Entry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}
