# Gym Tracker (FastAPI)

Registro de levantamientos con temporizador por set y lista sugerida de ejercicios. UI bilingue (Espanol/English).

## Stack
- FastAPI + SQLite (SQLAlchemy)
- Frontend HTML/CSS/JS servido por FastAPI

## Ejecutar en local (PowerShell)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn backend.main:app --reload
```

Abrir: http://127.0.0.1:8000

## Datos
- Base SQLite: data\gym.db
- Lista sugerida: data\exercises.json

## API basica
- GET /api/exercises
- POST /api/exercises
- GET /api/entries
- POST /api/entries
- DELETE /api/entries/{id}

## Notas
- Unidades: kg
- El temporizador es por set y se controla desde la UI
