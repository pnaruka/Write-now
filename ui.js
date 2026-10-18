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

durBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    durBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMins     = parseInt(btn.dataset.mins);
    customMins.value = selectedMins;
  });
});

customMins.addEventListener('input', () => {
  if (customMins.value) {
    durBtns.forEach(b => b.classList.remove('selected'));
    selectedMins = parseInt(customMins.value) || 10;
  }
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

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    mins:        selectedMins,
    threshold:   threshInput.value,
    audio:       audioCheck.checked,
    hardMode:    hardMode,
    warningMode: warningMode
  }));
}

function applySettings(s) {
  // Duration
  selectedMins      = s.mins;
  customMins.value  = s.mins;
  durBtns.forEach(b => {
    b.classList.toggle('selected', parseInt(b.dataset.mins) === s.mins);
  });

  // Threshold
  threshInput.value    = s.threshold;
  threshVal.textContent = s.threshold + 's pause triggers warning';

  // Audio
  audioCheck.checked  = s.audio;
  audioCheck2.checked = s.audio;

  // Hard mode
  hardMode = s.hardMode;
  document.getElementById('hard-mode').checked = s.hardMode;

  // Warning mode
  warningMode = s.warningMode;
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.mode === s.warningMode);
  });
}

function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    applySettings(s);
    document.getElementById('btn-quickstart').style.display = 'inline-block';
  } catch (e) {}
}

// ── Session start / end buttons ───────────────────────────────────────────────

document.getElementById('btn-start').addEventListener('click', () => {
  saveSettings();
  startSession();
});

document.getElementById('btn-quickstart').addEventListener('click', () => {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return;
  applySettings(JSON.parse(raw));
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
