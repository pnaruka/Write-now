// Handles all audio feedback using the Web Audio API.
// Lazy-initialises AudioContext on first use (required by browser autoplay policy).

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function isAudioEnabled() {
  return document.getElementById('audio-on').checked;
}

// Level 1 (strict mode) — soft descending tone.
function playNudge() {
  if (!isAudioEnabled()) return;
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {}
}

// Gentle ascending tone — used for all levels in encouraging mode.
function playNudgeGentle() {
  if (!isAudioEnabled()) return;
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
  } catch (e) {}
}

// Level 2 (strict mode) — urgent double descending tone.
function playNudge2() {
  if (!isAudioEnabled()) return;
  try {
    const ctx = getAudioCtx();
    [0, 0.35].forEach(offset => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const t = ctx.currentTime + offset;
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.5);
      gain.gain.setValueAtTime(0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  } catch (e) {}
}

// Level 3 (strict mode) — rapid triple sine nudge, insistent but not harsh.
function playNudge3() {
  if (!isAudioEnabled()) return;
  try {
    const ctx = getAudioCtx();
    [0, 0.28, 0.56].forEach(offset => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const t = ctx.currentTime + offset;
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.22);
      gain.gain.setValueAtTime(0.42, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  } catch (e) {}
}

// Rising three-note chime — played when the session timer runs out.
function playTimeUp() {
  if (!isAudioEnabled()) return;
  try {
    const ctx = getAudioCtx();
    [523, 659, 784].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch (e) {}
}
