# Smoke test, 18 November 2026

The checklist in [teaching-guide.md](../../research/02/notes/teaching-guide.md), run on the branch that
added it (the classroom-readiness pull request), served locally, in the
Chromium-based browser built into the Claude desktop app. The steps were driven
by script through the page itself: real page, real buttons, but clicks sent by
script, not by a person.

| step | result |
| --- | --- |
| Briefing loads; predictions and Start the game work | pass |
| Crews changed by hand; a terrace build (once two crews are free) | pass |
| The field log records each harvest | pass (46 lines over a full game) |
| Play runs; Pause stops it; Next step advances one step | pass |
| A milestone pauses play; Keep playing / Got it resumes | pass |
| At 1573 the re-plan box appears and the harvest waits for a choice | pass (button disabled until chosen) |
| End screen: success box, three charts, prediction grades | pass |
| Replay with the same weather: comparison table and the "identical weather" note | pass |
| Copy report | **partly tested**: the fallback (select the text and copy it) works; the clipboard itself needs a person's click and was not tested |
| Phone width (375 px), dark mode: readable, no sideways scroll | pass |

## Found during the test

- Seed 2024 is harsh: droughts at both 1592 and 1600, about 550 kcal after 1573
  with the default plan. Not a defect, but the teaching guide now recommends
  trying a seed before class, and uses 12345 as its example.

## Still to do by a person, on the classroom browser

- Copy report with a real click, and paste the result.
- Keyboard only: Tab through the predictions, Start, the crew steppers, the
  re-plan buttons and Play/Pause; Enter or Space activates each.
- One full game on the classroom's own browser and on a student phone.
