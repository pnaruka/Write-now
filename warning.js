// Manages the idle warning overlay (red vignette + "Keep Writing" text)
// and tracks idle time for accurate writing-time stats.
//
// Escalation levels (each fires after one additional threshold interval):
//   1 — soft pulse + nudge tone
//   2 — brighter pulse + urgent double-tone
//   3 — screen shake (strict) or strong pulse (encouraging) + triple burst
//
// Warning modes:
//   strict      — red, harsh, no-nonsense messages
//   encouraging — amber, warm, supportive messages

const vignette    = document.getElementById('vignette');
const nudge       = document.getElementById('nudge');
const threshDot   = document.getElementById('threshold-dot');

let isWarning       = false;
let warningLevel    = 0;
let warningMode     = 'encouraging';  // 'encouraging' | 'strict'
let escalateTimer2  = null;
let escalateTimer3  = null;
let idleStartTime   = null;   // timestamp when warning appeared
let totalIdleMs     = 0;      // accumulated idle ms for the current session

const nudgeMessages = {
  strict:      ['Write.',       'Stop stalling.',   'Write. Now.'],
  encouraging: ['Keep going…',  "You've got this.", "Write first, think later."]
};

function applyLevel(level) {
  warningLevel = level;

  vignette.classList.remove('pulse', 'pulse-hard', 'shake', 'encouraging');
  nudge.classList.remove('level-2', 'level-3', 'encouraging');

  nudge.querySelector('span').textContent = nudgeMessages[warningMode][level - 1];

  const enc = warningMode === 'encouraging';
  if (enc) {
    vignette.classList.add('encouraging');
    nudge.classList.add('encouraging');
  }

  if (level === 1) {
    vignette.style.opacity = '1';
    vignette.classList.add('pulse');
    nudge.classList.add('show');
    threshDot.classList.add('warn');
    enc ? playNudgeGentle() : playNudge();
  } else if (level === 2) {
    vignette.classList.add('pulse-hard');
    nudge.classList.add('level-2');
    enc ? playNudgeGentle() : playNudge2();
  } else if (level === 3) {
    // Strict: screen shake. Encouraging: strong pulse, no shake.
    vignette.classList.add(enc ? 'pulse-hard' : 'shake');
    nudge.classList.add('level-3');
    enc ? playNudgeGentle() : playNudge3();
  }
}

function showWarning() {
  if (isWarning) return;
  isWarning     = true;
  idleStartTime = Date.now();

  applyLevel(1);

  const t = getThresholdMs();
  escalateTimer2 = setTimeout(() => applyLevel(2), t);
  escalateTimer3 = setTimeout(() => applyLevel(3), t * 2);
}

function hideWarning() {
  if (!isWarning) return;
  isWarning    = false;
  warningLevel = 0;

  clearTimeout(escalateTimer2);
  clearTimeout(escalateTimer3);
  escalateTimer2 = escalateTimer3 = null;

  if (idleStartTime !== null) {
    totalIdleMs  += Date.now() - idleStartTime;
    idleStartTime = null;
  }

  vignette.style.opacity = '0';
  vignette.classList.remove('pulse', 'pulse-hard', 'shake', 'encouraging');
  nudge.classList.remove('show', 'level-2', 'level-3', 'encouraging');
  threshDot.classList.remove('warn');
}

function resetIdleTracking() {
  totalIdleMs   = 0;
  idleStartTime = null;
  isWarning     = false;
  warningLevel  = 0;
}

function getThresholdMs() {
  return parseInt(document.getElementById('thresh').value, 10) * 1000;
}
