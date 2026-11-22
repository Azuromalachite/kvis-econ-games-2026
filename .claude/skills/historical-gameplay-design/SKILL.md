---
name: historical-gameplay-design
description: Use when proposing or revising a historical game's decision loop, learning mechanic, progression, player information, incentives or debrief. Converts historical inquiry into testable interactive choices, without assuming the intended lesson must win. Not for pure styling, release QA or research-only parameter sweeps.
---

# Design historical gameplay as an inquiry

**Purpose:** Create a small, playable historical problem space where choices reveal relationships worth discussing. This is a *creation* workflow, not an alternative to [game-change-review](../game-change-review/SKILL.md), [historical-evidence-audit](../historical-evidence-audit/SKILL.md), or automated model testing.

## 1. Define the historical problem space

- Read the current game's actual rules and prior results. Identify the player role, location, period, what the player can control, whose agency is omitted, and which institutions or environmental constraints matter.
- State one contestable inquiry question and a specific student explanation worth eliciting. Separate established historical evidence, interpretation and deliberate teaching simplification; request an evidence audit for disputed assertions.
- Describe the player's feasible actions, resources, constraints, uncertainty and information *at decision time*. Do not give a historical agent future knowledge merely to make a strategy test convenient.
- Name at least one alternative explanation and one plausible outcome that would challenge the intended lesson. The game must not be tuned merely to reward the strategy the teacher expects.

## 2. Map learning to decisions

Use a compact LM–GM / MDA-inspired mapping, not a new Game Design Document:

| Question | Required answer |
| --- | --- |
| Learning mechanism | What must the learner compare, predict, explain or reconsider? |
| Game decision | Which meaningful choice produces that opportunity? |
| Dynamics | What competing costs, benefits, risks, delays or feedback result? |
| Player experience | What tension or discovery should emerge during play? |
| Observable evidence | Which state changes, decisions or answers could show it happened? |
| Competing interpretation | What else could produce the same observed outcome? |

- Each proposed mechanic must enable a decision or interpretation that a simpler design cannot already support. If it does not, omit it.
- Avoid conflating *being engaging*, *winning*, *knowing the history*, and *improving learning*. These require different observations.
- Do not force a universal prediction form, score, difficulty curve, currency or timeline across weeks.

## 3. Anticipate strategies and design failures

- Before implementation, try a minimal policy or worked example against the **actual current engine** when possible; include an intentionally simple baseline and at least one plausible competing policy.
- Look for dominant or degenerate strategies, unpriced opportunity costs, irrelevant decisions, hidden information advantages, misleading scores, unreachable goals and exploits. A dominant strategy is a finding to explain, not automatically a bug.
- Specify a **design promise that can fail**: e.g., changing departure timing sometimes changes a relevant trade-off, or diversifying labor actually reduces an identifiable risk under declared conditions.
- Define the smallest counterexample, ablation or controlled comparison that could *kill the feature*. Specify observable outcomes and denominators; avoid redesigning the world to make the promise true.
- If the design requires richer event history, identify the **missing real state** rather than inventing a narrative, visit count or chart from incomplete logs.

## 4. Integrate feedback and debrief

- Show the consequence close enough to the decision to be legible, while retaining genuine delayed effects where historically meaningful.
- At a meaningful turning point or end, ask what the player predicted, what occurred, what alternative might explain it, and where the game model differs from historical evidence.
- Prefer distinct outcomes (such as welfare, profit, loss or resilience) over an unexplained composite score. Reflection is not proof of learning transfer; real classroom claims require appropriate study design.

## Minimal handoff

Produce a **one-page mechanic brief** in the PR or a single existing design record: historical question; player role and information; one decision loop; learning-to-mechanic mapping; strongest failure case; cheapest prototype/test; feedback/debrief; what would be measured; and explicit assumptions. Only propose a production mechanics change after the authorized review process.

**Known counterexamples:** Frost & Silver's earlier crew-diversification narrative conflicted with its frost-model incentives; Monsoon Navigator's reported vessel rankings varied by automated trading policy and information access. Treat both as prior findings attached to their original revisions, not evidence that any new design has been validated.
