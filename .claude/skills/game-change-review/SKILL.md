---
name: game-change-review
description: Use when changing a game's rules, numbers, historical claims or end-of-game audit in this repo, reviewing such a change, adding a new game, or preserving consequential simulation findings. Covers what to write down (only what the code can't tell you), how to show a change works with a check that can fail, keeping commits lean (scratch work stays outside the repo), and how to get an independent review. Not needed for pure styling or copy edits.
---

# Changing or reviewing a game

Each game is plain HTML, CSS and JavaScript in its folder (one or more pages and modules, with the repo-wide `assets/theme.css` for shared styling; `AGENTS.md` rule 1), and the code is the source of truth for what a game does. Read the code instead of writing prose that restates it. In Monsoon Navigator's first repository, hundreds of lines of planning documents went stale within hours of the game changing, and most review rounds were spent fixing documents that contradicted each other.

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

**Where to put it:** put task-local rationale in the PR description. Keep durable evidence or decisions in one existing linked record, or add a compact record when the task needs it. Every document has one home (`AGENTS.md` rule 8): gameplay rules, decisions and history in `projects/NN/README.md`; evidence and research in `research/NN/`; checks in `tests/NN/`. Do not add game rules or academic notes to the root `AGENTS.md` or `README.md` — keep those minimal. Rule 1 (plain multi-file HTML/CSS/JS) applies to the playable game; it does not cover supporting evidence, and shared styling belongs in `assets/theme.css`. Avoid overlapping reports. Preserve unique source locators, reading depth, uncertainties and prior results when consolidating or migrating documents.

## Show the change works with a check that can fail

- **Play it.** Before and after, open the game in a browser (rule 5 in `AGENTS.md`), at phone and desktop widths. Use made-up student names in any screenshot or exported PDF.
- **If you change numbers or rules,** record the outputs that matter before and after: a travel-time table, the final profit for a fixed sequence of moves with the random number generator controlled, or an audit total. Then **break something on purpose** (change one constant in a temporary copy) and confirm your check notices. A check that can't fail proves nothing.
- **Controlling randomness:** to compare two strategies fairly, they must see the same random events. Giving them the same seed isn't enough if they make different moves and so draw different numbers.
- **Report** exactly which checks you ran and their output, and which you didn't run. A check that wasn't run isn't a pass.
- **Keep scratch out of the repo (`AGENTS.md` rule 8).** Run one-off experiments, exploratory test cases and ad-hoc harnesses in a temp directory outside the repository; their logs, screenshots and outputs stay there and are summarized in the PR. Commit a check only when it guards a durable contract — a pinned baseline, a planted defect, a packaging or evidence rule — and extend the existing `tests/NN/` suite rather than adding a parallel file. Fixtures you do commit must be small and inspectable.

## Retain week-specific simulation evidence without bloating Git

- **Location:** Keep week-specific research under `research/NN/`, where `NN` matches the game's folder `projects/NN/` (`research/02/` for Frost & Silver, `research/03/` for Monsoon Navigator). Work that genuinely spans games goes under `research/shared/`. Create subdirectories only when real artifacts are added. Paths recorded in manifests are **repository-relative from the repository root**, including configuration, code, results and external-archive manifests.
- **Preservation is not publication:** Save consequential exploratory, negative, contradictory and unresolved findings even if provenance is incomplete. Mark missing details and label their status honestly. Give every retained result one status: **exploratory** (any result not yet checked), **provenance-incomplete** (the fields below are not all recorded; name the missing ones), or **reproduced** (someone other than the author reran it from the recorded inputs and got the same result). Only a reproduced result may be called verified or confirmed. Missing fields decide the status, not whether the result is kept. Disclose results already seen before any later confirmatory analysis.
- **Identify the exact model:** Record source repository and commit, every file the game loads, with its path and SHA-256, harness repository and revision (or explicit same-repo commit), and how the harness was checked against real gameplay. Record runtime/dependencies, RNG algorithm, exact seeds or seed file, and how exogenous events are paired when strategies consume random draws differently. A seed alone is not proof of a matched comparison.
- **Define outcomes:** Record each metric's meaning and units, accounting and terminal settlement rules, and counts of attempted, completed, failed and excluded runs with denominators. Do not call loaded freight "delivered": Monsoon Navigator's documented freight tally includes loaded cargo from unsuccessful departures. If a genuine delivery measure is needed, implement and validate it independently.
- **Choose durable outputs:** Commit analysis code, protocol/configuration, a short interpretation and small inspectable CSV results or fixtures. Archive large traces and costly run-level datasets as versioned external artifacts with checksums and immutable references (for example a GitHub Release asset); retain a repository-relative manifest. Avoid large generated blobs in Git history and do not put identifiable student play logs in a public repository.
- **No duplicate reporting:** Keep task-local reasoning in the PR and one durable record for unique evidence. Reuse code and tests for implementation details; do not maintain separate status boards or hand-copied parameter tables.

## Get an independent review

- **For anything beyond a trivial edit,** have someone other than the author review it: a person, or a fresh agent given the diff, the claims and the files, but not the author's reasoning. Ask it to rerun the checks and look for contradictions, overclaims and tests that can't fail.
- **Status of fixes:** treat them as "addressed, awaiting review" until someone else confirms them. Re-review after fixes; fixes often introduce new contradictions.
- **Historical claims:** verify every DOI, catalogue record or quotation against the source. Never invent a page, a date or a citation. "Found" is not "read".
- **Someone else's summary of a source** (a pasted assessment, an AI digest, a reviewer's notes) is a list of claims to check, not a reading. Check each claim against the pages and record it as confirmed, corrected or not found before anything enters `research/NN/`. Of 18 claims in one summary of two book chapters, 5 needed corrections to the page, the wording or the attribution (`research/03/literature/2026-11-24-chaudhuri-ch9-ch10-reading-note.md`). Mark as unverified any attribution to a primary source that only unread endnotes would show. Keep the PDFs out of the repository unless redistribution is confirmed.

## Pitfalls that have already happened here

- **Stale branches.** `main` moved under open PRs, and statements in them, about line endings, the licence and the setup flow, became false. Re-check `main` before merging anything that describes it.
- **Line endings.** A line-ending change rewrote every line of a game file and hid the real edit. Keep line endings consistent, and look at the diff size before committing.
- **Overclaimed coverage.** A test title said it checked a threshold "from 20" but never tested 19 or 20. Test both sides of every threshold you name.
- **A test that copies the code's formula.** A Monsoon display showed pirate tribute as `min(cash, 75)`, but the engine deducts the voyage's wages first. The test built its expected value with the same expression and passed. Take expected values from the engine's own outcome (its log entry, the change in state) or a hand-worked case, never from a re-implementation.
- **Draws forced to 0 and 0.999.** A marker test forced every random draw to one extreme or the other, so any probability threshold between them passed, including a decode that dropped the marines factor. Force draws to just either side of the engine's threshold, or use real draws with truth from the outcome.
- **Merge-conflict markers in a commit.** A `<<<<<<< ours` block sat in `tests/03/README.md` through several commits and a review, because nothing checks for markers. Search the diff for `<<<<<<<`, `=======` and `>>>>>>>` before committing a merge.
- **Overstated verification.** "Verified" appeared on a PDF export button that verified nothing. Don't label things more strongly than they are.
- **Real names.** Exported audit PDFs carry student names. Never commit them.
- **A lesson the model contradicted.** The resilience part of Frost & Silver's welfare index
  once rewarded spreading crews across zones as insurance. Its frost strikes from the top
  down, so spreading never insures against frost in the model; it can still add food through
  room and diminishing returns. The change was made in Frost & Silver's own repository on
  2026-11-18 and is recorded in the `cwiParts.res` comment in `projects/02/index.html`.
  Before a game states a lesson, check it against a sweep of strategies on the model, and
  keep the sweep as research (section above).
