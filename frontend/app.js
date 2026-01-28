const I18N = {
  es: {
    eyebrow: "Powerlifting + Weightlifting",
    title: "Registro de levantamientos",
    subtitle: "Guarda tus sesiones, controla tiempos por set y administra ejercicios.",
    language: "Idioma",
    log_title: "Nuevo registro",
    exercise: "Ejercicio",
    weight: "Peso (kg)",
    reps: "Reps",
    sets: "Sets",
    rpe: "RPE (0-10)",
    date: "Fecha",
    notes: "Notas",
    notes_placeholder: "Ej: tecnica, sensaciones, equipo",
    save_entry: "Guardar",
    timer_title: "Temporizador por set",
    timer_desc: "Elige un tiempo y controla tu descanso entre sets.",
    duration: "Duracion (seg)",
    planned_sets: "Sets planeados",
    start: "Iniciar",
    pause: "Pausar",
    reset: "Reiniciar",
    set_progress: "Set",
    entries_title: "Registros recientes",
    sets_reps: "Sets x Reps",
    actions: "Acciones",
    exercises_title: "Ejercicios sugeridos",
    exercises_desc: "Puedes agregar tu propio ejercicio bilingue.",
    name_es: "Nombre (ES)",
    name_en: "Nombre (EN)",
    category: "Categoria",
    add_exercise: "Agregar ejercicio",
    cat_powerlifting: "Powerlifting",
    cat_weightlifting: "Weightlifting",
    cat_accessory: "Accesorios",
    delete: "Borrar",
    saved: "Registro guardado.",
    deleted: "Registro borrado.",
    added: "Ejercicio agregado.",
    error: "Ocurrio un error."
  },
  en: {
    eyebrow: "Powerlifting + Weightlifting",
    title: "Strength log",
    subtitle: "Save sessions, control set timers, and manage exercises.",
    language: "Language",
    log_title: "New entry",
    exercise: "Exercise",
    weight: "Weight (kg)",
    reps: "Reps",
    sets: "Sets",
    rpe: "RPE (0-10)",
    date: "Date",
    notes: "Notes",
    notes_placeholder: "Ex: technique, feel, gear",
    save_entry: "Save",
    timer_title: "Set timer",
    timer_desc: "Pick a time and control your rest between sets.",
    duration: "Duration (sec)",
    planned_sets: "Planned sets",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    set_progress: "Set",
    entries_title: "Recent entries",
    sets_reps: "Sets x Reps",
    actions: "Actions",
    exercises_title: "Suggested exercises",
    exercises_desc: "Add your own bilingual exercise.",
    name_es: "Name (ES)",
    name_en: "Name (EN)",
    category: "Category",
    add_exercise: "Add exercise",
    cat_powerlifting: "Powerlifting",
    cat_weightlifting: "Weightlifting",
    cat_accessory: "Accessory",
    delete: "Delete",
    saved: "Entry saved.",
    deleted: "Entry deleted.",
    added: "Exercise added.",
    error: "Something went wrong."
  }
};

const state = {
  lang: localStorage.getItem("lang") || "es",
  exercises: [],
  entries: [],
  timer: {
    duration: 90,
    remaining: 90,
    intervalId: null,
    plannedSets: 3,
    currentSet: 1
  }
};

const elements = {
  exerciseSelect: document.getElementById("exercise-select"),
  entryForm: document.getElementById("entry-form"),
  weightInput: document.getElementById("weight-input"),
  repsInput: document.getElementById("reps-input"),
  setsInput: document.getElementById("sets-input"),
  rpeInput: document.getElementById("rpe-input"),
  dateInput: document.getElementById("date-input"),
  notesInput: document.getElementById("notes-input"),
  status: document.getElementById("status"),
  entriesBody: document.getElementById("entries-body"),
  exerciseList: document.getElementById("exercise-list"),
  exerciseForm: document.getElementById("exercise-form"),
  exerciseNameEs: document.getElementById("exercise-name-es"),
  exerciseNameEn: document.getElementById("exercise-name-en"),
  exerciseCategory: document.getElementById("exercise-category"),
  timerDisplay: document.getElementById("timer-display"),
  timerDuration: document.getElementById("timer-duration"),
  timerStart: document.getElementById("timer-start"),
  timerStop: document.getElementById("timer-stop"),
  timerReset: document.getElementById("timer-reset"),
  presetButtons: document.querySelectorAll(".preset"),
  plannedSets: document.getElementById("planned-sets"),
  setCount: document.getElementById("set-count")
};

function t(key) {
  return I18N[state.lang][key] || key;
}

function applyI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    node.placeholder = t(key);
  });
}

function setStatus(message) {
  elements.status.textContent = message;
  if (!message) return;
  window.setTimeout(() => {
    if (elements.status.textContent === message) {
      elements.status.textContent = "";
    }
  }, 3000);
}

function categoryLabel(category) {
  if (category === "powerlifting") return t("cat_powerlifting");
  if (category === "weightlifting") return t("cat_weightlifting");
  return t("cat_accessory");
}

function exerciseName(exercise) {
  return state.lang === "es" ? exercise.name_es : exercise.name_en;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function loadExercises() {
  const data = await fetchJson("/api/exercises");
  state.exercises = data;
  renderExercises();
  renderExerciseSelect();
}

async function loadEntries() {
  const data = await fetchJson("/api/entries");
  state.entries = data;
  renderEntries();
}

function renderExerciseSelect() {
  elements.exerciseSelect.innerHTML = "";
  state.exercises.forEach((exercise) => {
    const option = document.createElement("option");
    option.value = exercise.id;
    option.textContent = exerciseName(exercise);
    elements.exerciseSelect.appendChild(option);
  });
}

function renderExercises() {
  elements.exerciseList.innerHTML = "";
  state.exercises.forEach((exercise) => {
    const item = document.createElement("li");
    item.className = "exercise-item";

    const text = document.createElement("span");
    text.textContent = exerciseName(exercise);

    const meta = document.createElement("small");
    meta.textContent = categoryLabel(exercise.category);

    item.appendChild(text);
    item.appendChild(meta);
    elements.exerciseList.appendChild(item);
  });
}

function renderEntries() {
  elements.entriesBody.innerHTML = "";
  state.entries.forEach((entry) => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = entry.date;

    const exCell = document.createElement("td");
    exCell.textContent = entry.exercise ? exerciseName(entry.exercise) : "-";

    const weightCell = document.createElement("td");
    weightCell.textContent = entry.weight_kg.toFixed(1);

    const setsRepsCell = document.createElement("td");
    setsRepsCell.textContent = `${entry.sets} x ${entry.reps}`;

    const rpeCell = document.createElement("td");
    rpeCell.textContent = entry.rpe == null ? "-" : entry.rpe.toString();

    const notesCell = document.createElement("td");
    notesCell.textContent = entry.notes || "";

    const actionsCell = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "chip";
    deleteBtn.textContent = t("delete");
    deleteBtn.addEventListener("click", () => deleteEntry(entry.id));
    actionsCell.appendChild(deleteBtn);

    row.appendChild(dateCell);
    row.appendChild(exCell);
    row.appendChild(weightCell);
    row.appendChild(setsRepsCell);
    row.appendChild(rpeCell);
    row.appendChild(notesCell);
    row.appendChild(actionsCell);

    elements.entriesBody.appendChild(row);
  });
}

async function createEntry(payload) {
  await fetchJson("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function deleteEntry(id) {
  try {
    await fetchJson(`/api/entries/${id}`, { method: "DELETE" });
    await loadEntries();
    setStatus(t("deleted"));
  } catch (error) {
    console.error(error);
    setStatus(t("error"));
  }
}

async function createExercise(payload) {
  await fetchJson("/api/exercises", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function updateTimerDisplay() {
  elements.timerDisplay.textContent = formatTime(state.timer.remaining);
  elements.setCount.textContent = `${state.timer.currentSet} / ${state.timer.plannedSets}`;
}

function resetTimer() {
  const duration = Number(elements.timerDuration.value) || state.timer.duration;
  state.timer.duration = duration;
  state.timer.remaining = duration;
  state.timer.currentSet = 1;
  updateTimerDisplay();
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  } catch (error) {
    console.warn("Audio not available", error);
  }
}

function startTimer() {
  if (state.timer.intervalId) return;
  const duration = Number(elements.timerDuration.value) || state.timer.duration;
  state.timer.duration = duration;
  if (state.timer.remaining <= 0 || state.timer.remaining > duration) {
    state.timer.remaining = duration;
  }

  state.timer.intervalId = window.setInterval(() => {
    state.timer.remaining -= 1;
    if (state.timer.remaining <= 0) {
      state.timer.remaining = 0;
      stopTimer();
      beep();
      if (state.timer.currentSet < state.timer.plannedSets) {
        state.timer.currentSet += 1;
      }
    }
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (state.timer.intervalId) {
    window.clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
  }
}

function setLanguage(lang) {
  state.lang = lang;
  localStorage.setItem("lang", lang);
  applyI18n();
  renderExercises();
  renderExerciseSelect();
  renderEntries();
}

function init() {
  applyI18n();
  const today = new Date().toISOString().slice(0, 10);
  elements.dateInput.value = today;
  elements.timerDuration.value = state.timer.duration;
  elements.plannedSets.value = state.timer.plannedSets;
  updateTimerDisplay();

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });

  elements.entryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      exercise_id: Number(elements.exerciseSelect.value),
      weight_kg: Number(elements.weightInput.value),
      reps: Number(elements.repsInput.value),
      sets: Number(elements.setsInput.value),
      rpe: elements.rpeInput.value ? Number(elements.rpeInput.value) : null,
      date: elements.dateInput.value,
      notes: elements.notesInput.value.trim() || null
    };

    try {
      await createEntry(payload);
      await loadEntries();
      elements.notesInput.value = "";
      setStatus(t("saved"));
    } catch (error) {
      console.error(error);
      setStatus(t("error"));
    }
  });

  elements.exerciseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      name_es: elements.exerciseNameEs.value.trim(),
      name_en: elements.exerciseNameEn.value.trim(),
      category: elements.exerciseCategory.value
    };

    try {
      await createExercise(payload);
      elements.exerciseNameEs.value = "";
      elements.exerciseNameEn.value = "";
      await loadExercises();
      setStatus(t("added"));
    } catch (error) {
      console.error(error);
      setStatus(t("error"));
    }
  });

  elements.timerStart.addEventListener("click", startTimer);
  elements.timerStop.addEventListener("click", stopTimer);
  elements.timerReset.addEventListener("click", () => {
    stopTimer();
    resetTimer();
  });

  elements.timerDuration.addEventListener("change", resetTimer);
  elements.plannedSets.addEventListener("change", () => {
    state.timer.plannedSets = Number(elements.plannedSets.value) || 1;
    if (state.timer.currentSet > state.timer.plannedSets) {
      state.timer.currentSet = state.timer.plannedSets;
    }
    updateTimerDisplay();
  });

  elements.presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      elements.timerDuration.value = btn.dataset.seconds;
      resetTimer();
    });
  });
}

Promise.all([loadExercises(), loadEntries()])
  .then(init)
  .catch((error) => {
    console.error(error);
    setStatus(t("error"));
  });
