---
name: art-direction-to-interface
description: Use when translating an adopted game art direction, visual prototype, illustration language or visual redesign brief into a working interface. Preserves identity, real gameplay state and decision legibility before release QA. Not for generic restyling, historical source verification or final deployment approval.
---

# Translate art direction into a usable game interface

**Purpose:** Make a game's intended visual language functional without turning every week into the same skin. This is a *design and implementation* workflow. Final device, accessibility, offline and print verification belongs to [game-release-validation](../game-release-validation/SKILL.md); protected rule changes require [game-change-review](../game-change-review/SKILL.md).

## 1. Pin the intended design and current game

- Identify the game's currently adopted design target and a **pinned reference revision** (brief, prototype, screenshots or owner decision); distinguish adoption from any separate release/licence decisions. Record explicit exclusions as well as positive requirements.
- Read the deployed game's current source and state transitions. An attractive old prototype is **not** authority to roll back newer mechanics, modes, credits, accessibility fixes or settlement logic.
- Preserve each week's own historical subject, symbols and visual voice. Common course branding may be reused; palette, composition, illustrations and narrative artifacts need not match other weeks.
- Before changing code, choose the one key player decision and current interface state that the redesign must make clearer.

## 2. Translate intent into a small visual contract

| Element | Specify |
| --- | --- |
| Hierarchy | Primary decision, prerequisite information, consequence, secondary details |
| Semantics | What each color, line, symbol, animation or graphic **actually means** |
| Visual language | Fonts/weights, semantic tokens, materials, image treatment, spacing and layout rhythm |
| Interaction | Available choices, selected/disabled/forecast states and feedback |
| Responsive layout | Reading order, text wrapping, hit areas, overflow cues and small-screen priorities |
| Provenance | Artist/source, licence or permission, required attribution and historical/schematic label |

- Distinguish **observed history**, **model output**, and **decorative illustration**. Atmospheric gradients or animated wind traces must not silently claim measured weather or extra data precision.
- If a visual needs absent information (ordered visits, cash history, event timestamps), first declare the missing state. Prefer a reviewed read-only recorder to parsing prose logs or fabricating chart data.
- Choose tokens and motifs that express the approved direction, not a new aesthetic invented because the agent has frontend preferences. Avoid decorative complexity that obscures choices.

## 3. Implement one truthful, interactive slice

- Start with one real gameplay state (setup, key decision, adverse event or audit). Use the current authorized engine and its actual actions; do not build a convincing but disconnected mock interface.
- Exercise selected, hover, focus, disabled, error, loading/transition and comparison states **where applicable**. A future-month preview must not alter the real departure date or consume simulation randomness.
- Prototype desktop and ~375px layouts early. Plan for labels, keyboard navigation, 44px-ish touch targets, text scaling and reduced motion; choose clear mobile layouts over hidden off-screen controls.
- Use a **blind decision-legibility probe**: show the rendered screen to a reviewer unfamiliar with the code. Can they identify their current state, available action, relevant trade-off and expected consequence? Treat this as formative feedback, not measured student learning.
- Compare the rendered result to the pinned reference in the **same viewport and state**. Note deliberate deviations, trade-offs and unresolved mismatches; revise before scaling to the remaining screens.

## 4. Check what the design actually communicates

- Does visual emphasis correspond to gameplay importance? Does a meter show a real quantity, with honest units and uncertainty? Are risks and benefits perceptible without color alone?
- Are illustrations subordinate to labels and controls at all tested sizes? Is navigation spatially meaningful rather than ornamental?
- Can someone tell a forecast from a real outcome, and a historical artifact from an original schematic drawing?
- Do screenshots and real interactions agree with the intended design? A CSS build, a static mock and an aesthetically pleasing screenshot alone cannot answer this.

## Minimal handoff

Keep a short implementation contract **in the PR**, not a parallel long design report: pinned design and engine revisions; chosen visual tokens/semantics; key decision and states; first playable slice; matched-view screenshots; blind legibility feedback; missing state; intentional deviations; asset rights; and handoff to game-release-validation.

**Known regression case:** Atlas of Moving Worlds had a clear visual target but its rollout exposed overlapping ship art, hidden mobile trade controls, broken radio-label associations and responsive-grid ordering issues. Design these interaction states deliberately; do not interpret this skill as permission to merge the blocked Atlas deployment.
