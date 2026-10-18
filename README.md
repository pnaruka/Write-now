# Write Now

A distraction-free writing app that keeps you writing without stopping to think. Pick a session length and start typing — if you go idle, a warning nudges you back, getting more insistent the longer you stall. When time runs out you can keep going in overtime, then grab your text and stats at the end.

## Features

- **Time-boxed sessions** — 5, 10, 15 or 20 minute presets, or a custom duration
- **Idle warnings** — fire after a configurable 2–10 s of no typing and escalate through three levels (vignette pulse, sound, and in strict mode a screen shake)
- **Two warning styles** — *encouraging* (warm amber, gentle tones) or *strict* (red, no-nonsense)
- **Hard mode** — disables Backspace and Delete so you can't second-guess yourself
- **Overtime** — when the timer hits zero, keep writing as long as you like; the session ends after 5 s of inactivity or when you click "End session"
- **Session stats** — words written, time spent writing (excluding idle time) and words per minute
- **Export** — copy to clipboard or save as `.txt` / `.md`
- **Remembers your settings** — with a "same as last time" quick start

## Getting started

There's no build step and no dependencies. Clone the repo and open `index.html` in any modern browser:

```bash
git clone https://github.com/pnaruka/Write-now.git
cd Write-now
```

Then double-click `index.html`, or serve the folder locally if you prefer:

```bash
npx serve .
# or
python -m http.server
```

## Project structure

| File | Purpose |
|---|---|
| `index.html` | Markup for the setup, editor and stats screens |
| `style.css` | All styles |
| `audio.js` | Nudge and time-up sounds (Web Audio API) |
| `warning.js` | Idle warning overlay and escalation |
| `session.js` | Countdown, overtime, start/end/extend and stats |
| `ui.js` | DOM event listeners and UI wiring |

Scripts load in the order `audio.js` → `warning.js` → `session.js` → `ui.js`, as each depends on globals from the ones before it.

## Tech

Plain HTML, CSS and JavaScript using only browser APIs: `localStorage`, Web Audio, `navigator.clipboard` and `Blob` downloads.
