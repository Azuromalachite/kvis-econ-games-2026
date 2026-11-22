---
name: game-change-review
description: Use when changing a game's rules, numbers, historical claims or end-of-game audit in this repo, when reviewing such a change, or when adding a new game. Covers what to write down (only what the code can't tell you), how to show a change works with a check that can fail, and how to get an independent review. Not needed for pure styling or copy edits.
---

# Changing or reviewing a game

These games are single HTML files, and the code is the source of truth for what a game does. Read the code instead of writing prose that restates it. In Monsoon Navigator's first repository, hundreds of lines of planning documents went stale within hours of the game changing, and most review rounds were spent fixing documents that contradicted each other.

## Write down only what the code can't tell you

| Write it down | Why the code can't say it |
| --- | --- |
| The teaching question and what a student should be able to explain | Intent isn't in the code |
| Decisions and who made them: owner approvals, licence, "Play Only is the default" | The code shows *what*, not *who decided* or *why* |
| Known defects, marked as defects | The code can't tell you that crediting a voyage after month 24 is a bug and not a rule |
| Results already seen, such as a strategy sweep or a ship-ranking reversal | You can't un-see them; any later "prediction" about them has to disclose them |
| Sources for historical claims, and how far each was actually read | Prices and port stories in the code carry no source |
| Credits and licence for each game and asset | They have to travel with the file |

**Don't write down:** parameter tables, how functions work, file layout, or a status board that duplicates another one. If you need the numbers, read the constants. If you need to know whether they changed, use a check (below).

**Where to put it:** in the PR description. If it has to outlive the PR, ask the repo owner where, since `AGENTS.md` lists only `index.html` per project. Keep it to about a screen.

## Show the change works with a check that can fail

- **Play it.** Before and after, open the game in a browser (rule 5 in `AGENTS.md`), at phone and desktop widths. Use made-up student names in any screenshot or exported PDF.
- **If you change numbers or rules,** record the outputs that matter before and after: a travel-time table, the final profit for a fixed sequence of moves with the random number generator controlled, or an audit total. Then **break something on purpose** (change one constant in a temporary copy) and confirm your check notices. A check that can't fail proves nothing.
- **Controlling randomness:** to compare two strategies fairly, they must see the same random events. Giving them the same seed isn't enough if they make different moves and so draw different numbers.
- **Report** exactly which checks you ran and their output, and which you didn't run. A check that wasn't run isn't a pass.

## Get an independent review

- **For anything beyond a trivial edit,** have someone other than the author review it: a person, or a fresh agent given the diff, the claims and the files, but not the author's reasoning. Ask it to rerun the checks and look for contradictions, overclaims and tests that can't fail.
- **Status of fixes:** treat them as "addressed, awaiting review" until someone else confirms them. Re-review after fixes; fixes often introduce new contradictions.
- **Historical claims:** verify every DOI, catalogue record or quotation against the source. Never invent a page, a date or a citation. "Found" is not "read".

## Pitfalls that have already happened here

- **Stale branches.** `main` moved under open PRs, and statements in them, about line endings, the licence and the setup flow, became false. Re-check `main` before merging anything that describes it.
- **Line endings.** A line-ending change rewrote every line of a game file and hid the real edit. Keep line endings consistent, and look at the diff size before committing.
- **Overclaimed coverage.** A test title said it checked a threshold "from 20" but never tested 19 or 20. Test both sides of every threshold you name.
- **Overstated verification.** "Verified" appeared on a PDF export button that verified nothing. Don't label things more strongly than they are.
- **Real names.** Exported audit PDFs carry student names. Never commit them.
