# Backlog

## ~~0. Save session as .txt / .md~~ ✓
~~Download buttons in the stats pane; timestamped filename.~~

## ~~1. Disable backspace~~ ✓
~~Hard mode toggle on the setup screen. When enabled, backspace and delete are suppressed — you can't erase, so you can't second-guess. Forces true forward momentum.~~

## ~~2. Save session settings~~ ✓
~~Persist the last-used duration and idle threshold to `localStorage`. On return visits, pre-fill the setup screen with those values. Add a "same as last time" quick-start button.~~

## ~~3. Warning escalation~~ ✓
~~Increase pressure the longer the user stays idle:~~
- ~~**Level 1** (threshold): soft vignette pulse + nudge audio~~
- ~~**Level 2** (2× threshold): brighter vignette, louder or repeated audio~~
- ~~**Level 3** (3× threshold): screen shake + aggressive audio~~

## ~~4. Smarter idle detection~~ ✓
~~Currently any keydown (including Ctrl, Shift, arrows, etc.) resets the idle timer, so the user can stall without triggering a warning. Idle detection should only reset on keys that produce actual text — i.e. use the `input` event on the textarea instead of (or in addition to) `keydown`, so modifier-only and navigation keypresses don't count as writing.~~

## ~~5. Warning modes~~ ✓
~~Two distinct personalities for the idle warning:~~

- ~~**Encouraging / motherly** — warm, gentle nudge. Soft colours, calm audio, messages like *"You've got this, keep going"*~~
- ~~**Strict / challenging / fatherly** — harsh, no-nonsense. Sharp red flash, loud tone, messages like *"Stop stalling. Write."*~~

~~User picks their preferred mode on the setup screen.~~

## ~~6. Extend session~~ ✓
~~When the session ends, add a "+ 1 more minute" option in the stats pane. Clicking it extends the session by 1 minute, keeping the existing text intact and resuming the countdown without clearing the editor.~~

## ~~7. Add README and .gitignore~~ ✓
~~Add a `README.md` describing the app, its features, how to run it and the project structure. Add a `.gitignore` covering OS, editor and log files.~~

## ~~8. Fix stats after "+ 1 more minute"~~ ✓
~~`extendSession()` resets `totalSecs` to 60 and clears `totalIdleMs`, but the word count still covers the whole draft, so words per minute is wildly inflated after an extension. Accumulate session time and idle time across extensions instead of resetting them.~~

## ~~9. Validate custom duration~~ ✓
~~The custom minutes input accepts `0` and negative values (`-5` gives a negative countdown). Clamp it to the input's `min`/`max` (1–120) and fall back to a sane default on invalid input.~~

## ~~10. Harden quick-start settings loading~~ ✓
~~The "same as last time" handler calls `JSON.parse` without a try/catch, and settings saved by older versions may be missing fields (e.g. `warningMode`), which makes the first warning throw. Parse safely and merge saved settings over defaults.~~

## ~~11. Remove stale comments~~ ✓
- ~~`ui.js`: the "keydown already handles hard-mode + idle reset above via the combined listener" comment describes code that doesn't exist.~~
- ~~`warning.js`: the header describes only the red vignette; update it to cover the amber encouraging mode.~~

## ~~12. Fix README clone instructions~~ ✓
~~Replace the `<repo-url>` placeholder with `https://github.com/pnaruka/Write-now.git` and change `cd write-now` to `cd Write-now`.~~

## ~~13. Update backlog item 6~~ ✓
~~Item 6 says the extension uses the same duration as the original; the shipped feature extends by 1 minute. Reword it to match, and add the ✓.~~

## ~~14. Responsive layout~~ ✓
~~`style.css` has no `@media` rules. Add breakpoints so the setup screen, editor, topbar and stats pane work on narrow (phone/tablet) screens — e.g. stack the stats pane below the editor instead of sliding in from the right.~~

## 15. Close hard-mode loopholes
Hard mode only blocks the Backspace and Delete keys. Text can still be removed by cutting (Ctrl+X / context menu), by selecting text and typing over it, or by drag-and-drop. Use the `beforeinput` event to cancel deleting input types (`deleteContentBackward`, `deleteByCut`, `deleteByDrag`, etc.) and any insertion that would replace a selection.
