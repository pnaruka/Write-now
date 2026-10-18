# Write Now

A distraction-free writing dump app. The goal is to keep the user writing without stopping or thinking. When the user goes idle, a warning fires to nudge them back. Sessions are time-boxed but the user can keep writing after time runs out.

## File structure

| File | Responsibility |
|---|---|
| `index.html` | Markup only — three screens (setup, main editor, stats pane) |
| `style.css` | All styles |
| `audio.js` | Web Audio API — `playNudgeGentle()`, `playNudge()`, `playNudge2()`, `playNudge3()`, `playTimeUp()` |
| `warning.js` | Idle warning overlay — show/hide vignette, escalation levels, track idle time |
| `session.js` | Session lifecycle — countdown, overtime, start/end/extend, stats |
| `ui.js` | All DOM event listeners and UI wiring |

Script load order in `index.html`: `audio.js` → `warning.js` → `session.js` → `ui.js`. Each file depends on globals from the ones before it.

## Features

### Setup screen
- User picks a session duration: 5 / 10 / 15 / 20 min presets, or a custom value
- Selecting a preset updates the custom input box to match; typing a preset value in the custom box highlights that preset
- Custom duration only accepts whole numbers from the input's `min` to `max` (1–120): `-`, `+`, `.`, `,` and `e` keys are blocked, non-digit pastes and drops are rejected, leading zeros are stripped (so `0` can't be entered), and a keystroke that would exceed the max is ignored. An empty box means 1 minute and is filled with `1` on blur. Saved settings are normalised to the same range when loaded
- Idle warning threshold: slider from 2–10 s (default 4 s)
- Audio toggle for nudge sounds
- Hard mode toggle — suppresses Backspace and Delete in the editor
- Warning style picker: **encouraging** (default, amber/warm) or **strict** (red, no-nonsense)
- All settings (duration, threshold, audio, hard mode, warning style) are saved to `localStorage` on session start; on return visits the setup screen is pre-filled and a **"same as last time"** quick-start button appears
- Saved settings are read through `readSavedSettings()` → `normaliseSettings()` in `ui.js`: each field is validated on its own and falls back to `DEFAULT_SETTINGS` if missing or invalid (e.g. settings from older versions without `warningMode`). Corrupt JSON or unavailable storage is treated as "no saved settings", and a failed save never blocks starting a session

### Editor
- Fullscreen textarea, max-width 720 px, dark theme
- Countdown timer in the topbar (counts down from selected duration)
- Live word count in the topbar
- Idle warning fires after `threshold` seconds of no keystrokes and escalates in three levels:
  - **Level 1** (1× threshold): soft pulse + descending sine tone
  - **Level 2** (2× threshold): faster/brighter pulse + urgent double-tone
  - **Level 3** (3× threshold): screen shake + flashing text + rapid triple sine burst (strict) / strong pulse, no shake (encouraging)
- Only real text input (the `input` event) resets the idle timer — modifier keys, arrows, and Ctrl combos are ignored
- **Encouraging mode** — amber vignette, soft ascending tone at all levels, messages: *"Keep going…" / "You've got this." / "Write first, think later."*
- **Strict mode** — red vignette, escalating audio, messages: *"Write." / "Stop stalling." / "Write. Now."*

### Overtime mode
- When the countdown hits zero: audio chime plays, timer flips to `+0:00` and counts up in green
- Warnings stop after time expires — user is in free-write mode
- If the user stops typing for 5 s in overtime, the session ends automatically
- "End session" button appears in topbar once overtime begins; user can also end manually

### Stats pane
- Slides in from the right when session ends; writing area stays visible on the left
- Shows: **words written**, **time writing** (total elapsed minus idle time, in `Xm XXs` format), **words per minute**
- "Copy text" copies the full draft to clipboard
- "Save .txt" / "Save .md" download the draft with a timestamped filename
- "+ 1 more minute" extends the session by 1 minute, keeping the existing text and resuming the countdown immediately; time and idle totals carry over so the final stats cover the whole session
- "New session" returns to the setup screen

### Responsive layout
Breakpoints live at the bottom of `style.css`:
- **≤ 600 px wide (phones)** — setup controls stack vertically, tighter topbar/editor padding, bottom-bar tagline hidden, smaller vignette and nudge text. The stats pane becomes a **bottom sheet** (`#main` switches to a column; the pane animates `max-height` instead of `width`) with the three stats in a row and the buttons in a grid
- **≤ 380 px wide** — the "Write Now" title in the topbar is hidden to make room
- **≤ 500 px tall (landscape phones)** — reduced gaps and stat sizes
- At every size the setup screen and stats pane scroll when their content doesn't fit; they're centred with auto margins rather than `justify-content: center`, so nothing gets pushed off the top. `body` uses `100dvh` so mobile browser toolbars don't hide the bottom bar

## Key state (session.js + warning.js)

| Variable | Lives in | Purpose |
|---|---|---|
| `selectedMins` | `session.js` | Duration chosen on setup screen |
| `sessionStartTime` | `session.js` | Timestamp of first keystroke; null until then |
| `timeExpired` | `session.js` | True once countdown hits zero |
| `completedSecs` | `session.js` | Countdown + overtime seconds from segments before the latest "+ 1 more minute"; keeps stats covering the whole draft |
| `totalIdleMs` | `warning.js` | Accumulated ms where warning was visible |
| `idleStartTime` | `warning.js` | Timestamp when current idle period began |
| `warningLevel` | `warning.js` | Current escalation level (0 = none, 1–3) |
| `warningMode` | `warning.js` | `'encouraging'` (default) or `'strict'` |
| `hardMode` | `ui.js` | True when hard mode (no backspace) is enabled |

## Writing time calculation

Writing time = (`completedSecs` + `totalSecs` + `overtimeSecs`) − `totalIdleMs`

Using the committed session duration as the base (rather than time-to-first-keystroke) means the stat reflects the full time the user set aside to write, minus any time they were idle (warning showing). Idle time is measured precisely: `idleStartTime` is set when the warning appears, and the elapsed ms is added to `totalIdleMs` when the warning is dismissed (either by a keystroke or by `endSession` calling `hideWarning`).

## Audio

All sounds use the Web Audio API with a lazily initialised `AudioContext` (required by browser autoplay policy — context is created on first user interaction).

- **Nudge gentle** (`playNudgeGentle`): soft ascending sine 440 → 600 Hz, 0.7 s — used for all levels in encouraging mode
- **Nudge L1** (`playNudge`): single descending sine 440 → 300 Hz, 0.8 s
- **Nudge L2** (`playNudge2`): two descending sines 520 → 320 Hz, 0.35 s apart
- **Nudge L3** (`playNudge3`): three rapid descending sines 520 → 340 Hz, 0.28 s apart
- **Time up** (`playTimeUp`): rising three-note chime at 523 / 659 / 784 Hz

## Running

Plain HTML/CSS/JS — no build step or dependencies. Open `index.html` in a browser. The app uses only browser APIs (`localStorage`, Web Audio, `navigator.clipboard`, `Blob` downloads).
