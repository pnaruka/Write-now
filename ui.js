// Wires up all DOM event listeners and handles UI-only interactions
// (setup screen controls, editor events, post-session actions).

const editor        = document.getElementById('editor');
const threshInput   = document.getElementById('thresh');
const threshVal     = document.getElementById('thresh-val');
const audioCheck    = document.getElementById('audio-on');
const audioCheck2   = document.getElementById('audio-on-2');
const customMins    = document.getElementById('custom-mins');
const durBtns       = document.querySelectorAll('.dur-btn');
const statsPane     = document.getElementById('stats-pane');
const setupScreen   = document.getElementById('setup-screen');
const statTimer     = document.getElementById('stat-timer');
const statWords     = document.getElementById('stat-words');
const sessionStatus = document.getElementById('session-status');

// ── Setup: duration picker ────────────────────────────────────────────────────

const MIN_MINS = parseInt(customMins.min, 10) || 1;
const MAX_MINS = parseInt(customMins.max, 10) || 120;

// The custom box only ever holds a whole number from MIN_MINS to MAX_MINS,
// or is empty (which means MIN_MINS). Anything else is rejected as it's typed.
const BLOCKED_KEYS = ['-', '+', '.', ',', 'e', 'E'];
let lastCustomValue = customMins.value;

// Normalises a stored duration (e.g. from saved settings) to a valid value.
function toValidMins(value) {
  const n = parseInt(value, 10);
  if (!Number.isInteger(n) || n < MIN_MINS) return MIN_MINS;
  return Math.min(n, MAX_MINS);
}

// Highlights the preset button matching `mins`, if any.
function highlightPreset(mins) {
  durBtns.forEach(b => {
    b.classList.toggle('selected', parseInt(b.dataset.mins, 10) === mins);
  });
}

function setCustomMins(mins) {
  selectedMins     = mins;
  customMins.value = mins;
  lastCustomValue  = customMins.value;
  highlightPreset(mins);
}

durBtns.forEach(btn => {
  btn.addEventListener('click', () => setCustomMins(parseInt(btn.dataset.mins, 10)));
});

// Block minus, plus, decimal point and exponent keys outright.
customMins.addEventListener('keydown', e => {
  if (BLOCKED_KEYS.includes(e.key)) e.preventDefault();
});

// Only allow pasting / dropping plain digits.
customMins.addEventListener('paste', e => {
  const text = (e.clipboardData || window.clipboardData).getData('text');
  if (!/^\d+$/.test(text.trim())) e.preventDefault();
});
customMins.addEventListener('drop', e => e.preventDefault());

customMins.addEventListener('input', () => {
  let v = customMins.value.replace(/^0+/, '');   // no leading zeros, so no 0

  if (v !== '' && !/^\d+$/.test(v)) v = lastCustomValue;               // safety net
  if (v !== '' && parseInt(v, 10) > MAX_MINS) v = lastCustomValue;      // too big: ignore keystroke

  if (customMins.value !== v) customMins.value = v;
  lastCustomValue = v;

  selectedMins = v === '' ? MIN_MINS : parseInt(v, 10);
  highlightPreset(selectedMins);
});

// An empty box means 1 minute; show that once the user leaves the field.
customMins.addEventListener('blur', () => {
  if (customMins.value === '') setCustomMins(MIN_MINS);
});

// ── Setup: threshold slider ───────────────────────────────────────────────────

threshInput.addEventListener('input', () => {
  threshVal.textContent = threshInput.value + 's pause triggers warning';
});

// ── Setup: keep both audio checkboxes in sync ─────────────────────────────────

audioCheck.addEventListener('change',  () => audioCheck2.checked = audioCheck.checked);
audioCheck2.addEventListener('change', () => audioCheck.checked  = audioCheck2.checked);

// ── Persist / restore settings ───────────────────────────────────────────────

const SETTINGS_KEY = 'writenow-settings';

const DEFAULT_SETTINGS = {
  mins:        10,
  threshold:   4,
  audio:       true,
  hardMode:    false,
  warningMode: 'encouraging'
};

// Builds a complete, valid settings object from whatever was stored.
// Each field is checked on its own, so a missing or bad field (e.g. from an
// older version of the app) falls back to its default without losing the rest.
function normaliseSettings(saved) {
  const d = DEFAULT_SETTINGS;

  const threshMin = parseInt(threshInput.min, 10);
  const threshMax = parseInt(threshInput.max, 10);
  const threshold = parseInt(saved.threshold, 10);

  return {
    mins:        saved.mins === undefined ? d.mins : toValidMins(saved.mins),
    threshold:   threshold >= threshMin && threshold <= threshMax ? threshold : d.threshold,
    audio:       typeof saved.audio    === 'boolean' ? saved.audio    : d.audio,
    hardMode:    typeof saved.hardMode === 'boolean' ? saved.hardMode : d.hardMode,
    warningMode: Object.hasOwn(nudgeMessages, saved.warningMode) ? saved.warningMode : d.warningMode
  };
}

// Returns the saved settings, or null if there are none or they can't be read.
// localStorage itself can throw (e.g. storage disabled), as can JSON.parse.
function readSavedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return null;
    return normaliseSettings(saved);
  } catch (e) {
    return null;
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mins:        selectedMins,
      threshold:   parseInt(threshInput.value, 10),
      audio:       audioCheck.checked,
      hardMode:    hardMode,
      warningMode: warningMode
    }));
  } catch (e) {
    // Storage unavailable or full — the session still starts, settings just aren't remembered.
  }
}

// Expects a normalised settings object (see normaliseSettings).
function applySettings(s) {
  setCustomMins(s.mins);

  threshInput.value     = s.threshold;
  threshVal.textContent = s.threshold + 's pause triggers warning';

  audioCheck.checked  = s.audio;
  audioCheck2.checked = s.audio;

  hardMode = s.hardMode;
  document.getElementById('hard-mode').checked = s.hardMode;

  warningMode = s.warningMode;
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.mode === s.warningMode);
  });
}

function loadSettings() {
  const s = readSavedSettings();
  if (!s) return;
  applySettings(s);
  document.getElementById('btn-quickstart').style.display = 'inline-block';
}

// ── Session start / end buttons ───────────────────────────────────────────────

document.getElementById('btn-start').addEventListener('click', () => {
  saveSettings();
  startSession();
});

document.getElementById('btn-quickstart').addEventListener('click', () => {
  const s = readSavedSettings();
  if (!s) {
    // Saved settings vanished or became unreadable since page load.
    document.getElementById('btn-quickstart').style.display = 'none';
    return;
  }
  applySettings(s);
  startSession();
});

document.getElementById('btn-end').addEventListener('click', endSession);
document.getElementById('btn-extend').addEventListener('click', extendSession);

// ── Warning mode picker ───────────────────────────────────────────────────────

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    warningMode = btn.dataset.mode;
  });
});

// ── Hard mode: suppress backspace / delete ────────────────────────────────────

let hardMode = false;
document.getElementById('hard-mode').addEventListener('change', e => {
  hardMode = e.target.checked;
});

editor.addEventListener('keydown', e => {
  if (hardMode && (e.key === 'Backspace' || e.key === 'Delete')) {
    e.preventDefault();
  }
});

// ── Editor: track writing and reset idle timer ────────────────────────────────

editor.addEventListener('input', () => {
  if (!sessionStartTime) {
    sessionStartTime = Date.now();
    sessionStatus.textContent = 'writing';
  }
  statWords.textContent = countWords(editor.value) + ' words';
  resetIdleTimer();  // only real text input resets the idle timer
});

// keydown already handles hard-mode + idle reset above via the combined listener

// ── Post-session: save as file ───────────────────────────────────────────────

function downloadText(ext) {
  const blob = new Blob([editor.value], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `write-now-${new Date().toISOString().slice(0,16).replace('T','-')}.${ext}`
  });
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('btn-save-txt').addEventListener('click', () => downloadText('txt'));
document.getElementById('btn-save-md').addEventListener('click',  () => downloadText('md'));

// ── Post-session: copy text ───────────────────────────────────────────────────

document.getElementById('btn-copy').addEventListener('click', () => {
  const btn = document.getElementById('btn-copy');
  navigator.clipboard.writeText(editor.value).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy text', 2000);
  });
});

// ── Post-session: start a new session ────────────────────────────────────────

document.getElementById('btn-new-session').addEventListener('click', () => {
  statsPane.classList.remove('show');
  statTimer.classList.remove('overtime');
  statTimer.textContent     = '—';
  statWords.textContent     = '0 words';
  sessionStatus.textContent = '—';
  setupScreen.style.display = 'flex';
});

// ── Init ──────────────────────────────────────────────────────────────────────

loadSettings();
