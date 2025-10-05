/* script.js
   Stopwatch logic:
   - Uses performance.now() for better accuracy
   - Prevents multiple intervals
   - Supports Start, Stop, Reset
   - Bonus: Lap recording + persistence via localStorage
*/

/* ====== Helpers ====== */
// format seconds to HH:MM:SS
function formatTime(totalSeconds){
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const two = n => String(n).padStart(2,'0');
  return `${two(h)}:${two(m)}:${two(s)}`;
}

/* ====== DOM elements ====== */
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('startBtn');
const stopBtn  = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const lapBtn   = document.getElementById('lapBtn');
const lapsList = document.getElementById('lapsList');

/* ====== State ====== */
let intervalId = null;
let startTimestamp = 0; // in ms (performance.now)
let elapsedMs = 0;      // accumulated ms across sessions
let laps = [];

/* ====== Persistence keys (optional) ====== */
const STORAGE_KEY = 'stopwatch_state_v1';
function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    elapsedMs = data.elapsedMs || 0;
    laps = Array.isArray(data.laps) ? data.laps : [];
    // if running flag stored, we do not auto-start; user must press Start
  } catch(e){
    console.warn('Failed to parse stored state', e);
  }
}
function saveState(){
  try {
    const payload = { elapsedMs, laps, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch(e){ /* ignore storage failures */ }
}

/* ====== Display ====== */
function updateDisplay(){
  const now = performance.now();
  const currentElapsedMs = elapsedMs + (intervalId ? (now - startTimestamp) : 0);
  const totalSeconds = Math.floor(currentElapsedMs / 1000);
  timeEl.textContent = formatTime(totalSeconds);
}

/* ====== Tick ====== */
function tick(){
  updateDisplay();
}

/* ====== Buttons behavior ====== */
startBtn.addEventListener('click', () => {
  if (intervalId) return; // prevent multiple timers
  startTimestamp = performance.now();
  intervalId = setInterval(tick, 200);
  updateDisplay();
  // toggle UI
  startBtn.disabled = true;
  stopBtn.disabled = false;
  resetBtn.disabled = false;
  lapBtn.disabled = false;
});

stopBtn.addEventListener('click', () => {
  if (!intervalId) return;
  const now = performance.now();
  elapsedMs += (now - startTimestamp);
  clearInterval(intervalId);
  intervalId = null;
  updateDisplay();
  // toggle UI
  startBtn.disabled = false;
  stopBtn.disabled = true;
  resetBtn.disabled = false;
  lapBtn.disabled = true;
  saveState();
});

resetBtn.addEventListener('click', () => {
  if (intervalId){
    clearInterval(intervalId);
    intervalId = null;
  }
  elapsedMs = 0;
  startTimestamp = 0;
  laps = [];
  renderLaps();
  updateDisplay();
  // UI toggle
  startBtn.disabled = false;
  stopBtn.disabled = true;
  resetBtn.disabled = true;
  lapBtn.disabled = true;
  saveState();
});

lapBtn.addEventListener('click', () => {
  // record current HH:MM:SS and ms value
  const now = performance.now();
  const currentElapsedMs = elapsedMs + (intervalId ? (now - startTimestamp) : 0);
  const seconds = Math.floor(currentElapsedMs / 1000);
  const formatted = formatTime(seconds);
  laps.unshift({ timeMs: currentElapsedMs, label: formatted }); // newest first
  renderLaps();
  saveState();
});

/* ====== Laps rendering ====== */
function renderLaps(){
  lapsList.innerHTML = '';
  if (laps.length === 0) return;
  laps.forEach((l, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>Lap ${laps.length - i}</span><span>${l.label}</span>`;
    lapsList.appendChild(li);
  });
}

/* ====== Visibility & accuracy adjustments ====== */
document.addEventListener('visibilitychange', () => {
  // when tab becomes visible, update display
  if (document.visibilityState === 'visible') {
    // No special rebase needed since we use performance.now + elapsedMs
    updateDisplay();
  }
});

/* ====== Init ====== */
(function init(){
  loadState();
  renderLaps();
  updateDisplay();
  // initial UI state: reset/stop/lap disabled if nothing running
  startBtn.disabled = false;
  stopBtn.disabled = true;
  resetBtn.disabled = elapsedMs === 0 && laps.length === 0;
  lapBtn.disabled = true;
})();
