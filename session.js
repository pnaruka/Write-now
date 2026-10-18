// Core session logic: countdown, overtime, idle auto-end, and end-of-session stats.

let idleTimer        = null;
let countdownTimer   = null;
let overtimeTimer    = null;

let selectedMins     = 10;
let totalSecs        = 0;
let remainingSecs    = 0;
let overtimeSecs     = 0;
let completedSecs    = 0;     // countdown + overtime from segments before the latest extension
let timeExpired      = false;
let sessionStartTime = null;  // timestamp of first keystroke

// ── Idle timer ────────────────────────────────────────────────────────────────

function resetIdleTimer() {
  clearTimeout(idleTimer);
  hideWarning();

  if (timeExpired) {
    // After time runs out: auto-end if silent for 5 s
    idleTimer = setTimeout(endSession, 5000);
    return;
  }

  idleTimer = setTimeout(showWarning, getThresholdMs());
}

// ── Countdown ─────────────────────────────────────────────────────────────────

function onTimeExpired() {
  timeExpired = true;
  clearInterval(countdownTimer);
  clearTimeout(idleTimer);
  hideWarning();
  playTimeUp();

  document.getElementById('stat-timer').textContent = '+0:00';
  document.getElementById('stat-timer').classList.add('overtime');
  document.getElementById('session-status').textContent = "time's up — keep going";
  document.getElementById('btn-end').classList.add('visible');

  idleTimer = setTimeout(endSession, 5000);

  overtimeTimer = setInterval(() => {
    overtimeSecs++;
    const m = Math.floor(overtimeSecs / 60);
    const s = overtimeSecs % 60;
    document.getElementById('stat-timer').textContent =
      `+${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

// ── Start session ─────────────────────────────────────────────────────────────

function startSession() {
  totalSecs        = selectedMins * 60;
  remainingSecs    = totalSecs;
  overtimeSecs     = 0;
  completedSecs    = 0;
  timeExpired      = false;
  sessionStartTime = null;
  resetIdleTracking();

  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('editor').value = '';
  document.getElementById('stat-words').textContent = '0 words';
  document.getElementById('stat-timer').textContent = formatTime(selectedMins, 0);
  document.getElementById('stat-timer').classList.remove('overtime');
  document.getElementById('session-status').textContent = 'ready';
  document.getElementById('editor').focus();

  resetIdleTimer();

  countdownTimer = setInterval(() => {
    remainingSecs--;
    const m = Math.floor(remainingSecs / 60);
    const s = remainingSecs % 60;
    document.getElementById('stat-timer').textContent = formatTime(m, s);
    if (remainingSecs <= 0) onTimeExpired();
  }, 1000);
}

// ── Extend session ────────────────────────────────────────────────────────────

function extendSession() {
  clearInterval(countdownTimer);
  clearInterval(overtimeTimer);
  clearTimeout(idleTimer);

  // Carry the finished segment's time forward so stats cover the whole draft.
  // Idle time (totalIdleMs) is intentionally NOT reset for the same reason.
  completedSecs   += totalSecs + overtimeSecs;

  totalSecs        = 60; // always extend by 1 minute
  remainingSecs    = totalSecs;
  overtimeSecs     = 0;
  timeExpired      = false;

  document.getElementById('stats-pane').classList.remove('show');
  document.getElementById('stat-timer').textContent = formatTime(1, 0);
  document.getElementById('stat-timer').classList.remove('overtime');
  document.getElementById('btn-end').classList.remove('visible');
  document.getElementById('session-status').textContent = 'writing';
  document.getElementById('editor').focus();

  resetIdleTimer();

  countdownTimer = setInterval(() => {
    remainingSecs--;
    const m = Math.floor(remainingSecs / 60);
    const s = remainingSecs % 60;
    document.getElementById('stat-timer').textContent = formatTime(m, s);
    if (remainingSecs <= 0) onTimeExpired();
  }, 1000);
}

// ── End session ───────────────────────────────────────────────────────────────

function endSession() {
  clearInterval(countdownTimer);
  clearInterval(overtimeTimer);
  clearTimeout(idleTimer);
  hideWarning();  // flushes any open idle period into totalIdleMs

  const sessionSecs = completedSecs + totalSecs + overtimeSecs;
  const writingMs   = Math.max(0, sessionSecs * 1000 - totalIdleMs);
  const writingMins = writingMs / 60000;

  const text  = document.getElementById('editor').value;
  const words = countWords(text);
  const wpm   = writingMins > 0 ? Math.round(words / writingMins) : 0;

  const totalWritingSecs = Math.round(writingMs / 1000);
  const wMins = Math.floor(totalWritingSecs / 60);
  const wSecs = totalWritingSecs % 60;
  const displayTime = wMins > 0
    ? `${wMins}m ${wSecs.toString().padStart(2, '0')}s`
    : `${wSecs}s`;

  document.getElementById('done-words').textContent        = words.toLocaleString();
  document.getElementById('done-writing-time').textContent = displayTime;
  document.getElementById('done-wpm').textContent          = wpm;
  document.getElementById('stats-pane').classList.add('show');
  document.getElementById('btn-end').classList.remove('visible');
  document.getElementById('session-status').textContent = 'done';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function countWords(text) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

function formatTime(m, s) {
  return `${m}:${s.toString().padStart(2, '0')}`;
}
