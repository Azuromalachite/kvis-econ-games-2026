> Imported source-context snapshot from `d64a632eaa78e2bc33f9cc4fd1726266f68ac246`. This is a dated source record, not the monorepo operating policy. Use [the Week 2 index](../README.md) and [current test instructions](../../../tests/02/README.md). Only relative Markdown links were relocated below; original run commands and status statements retain their source context.

# Frost & Silver

A browser game for a world-history class. You run an Andean ayllu (a farming community of about 1,000 people) across six harvests, each one farming year. Harvests 1–3 are consecutive years under the Inca, around 1500. Harvests 4–6 are sample years (c. 1575, c. 1592, c. 1600) after the 1573 colonial mita began sending one man in seven from the mita region to the silver mines at Potosí. Step through by hand (Next step, or Bring in harvest) or press Play to let the harvests run, at 1×, 2× or 4×; Pause stops it. Milestones (average reached the goal, hunger, stores used up, a killing frost, and the first colonial harvest where output is up but food is down) appear at the top of the harvest report and pause auto-play. Add `?seed=123` to the address to give a whole class the same weather, or pick a weather preset on the intro screen: Standard (seed 12345), Hard (seed 313) or Extreme (seed 2024). Presets change only the weather, never the rules; how they were chosen: [docs/hard-mode-2026-11-18.md](../notes/hard-mode-2026-11-18.md).

**The key message: GDP per person grew in sixteenth-century Latin America, but life did not get better, because food per person fell.** The game lets students watch both numbers side by side and see how growth and welfare can come apart.

That message comes from the original game's author, Amnuayvit Thitibordin, who built it on Maddison's historical statistics and his familiarity with global economic history, and also used it to teach the quipu, the Andean knotted-cord records. This adaptation keeps both: each harvest report is drawn as a quipu.

## Play

Play online: **https://azuromalachite.github.io/frost-and-silver-game/**

Or download `frost-and-silver.html` and open it in a browser. It is one self-contained file; the only outside resources are Google Fonts.

Each year you:

- assign work crews to four altitude zones (valley maize, upper fields of potatoes and tubers, high grain such as kañiwa, and puna pasture). Each zone shows the nearest Quechua-derived zone name (Pulgar Vidal 1941) and a rough air and soil temperature, for orientation only;
- build terraces (andenes) or raised fields (waru waru) against frost;
- freeze-dry surplus into chuño for the community stores;
- in the colonial years, choose whether to send crews to Potosí for wages.

One Play/Pause button and Next step control the pace. On Play, each year's plan is dealt into the crew board one crew at a time, so players see where the crews go (the plan is last year's; any click takes over). Milestones (the average reaching the goal, growth without a better life, stores used up, hunger) pause play. A **field and climate log** under the controls keeps one line per event for the whole game: frost and what it cost, dry years, feasts, tribute, stores, deaths and new terraces.

Students **predict** before playing, **track** each harvest in a report (four tiles: food, GDP index, welfare index, people; where the food went; and the same numbers knotted as a quipu), and **compare**: "Replay with the same weather" lets them change one choice and see its effect side by side. The end screen compares Inca and colonial harvests on food, a Caloric Welfare Index (50 food, 30 stores, 20 resilience, from the original game) and GDP per person shown as an index (Maddison's 1500 level = 100), and produces a text report to paste into a class page.

## What the model is, and is not

The game is a teaching model, not a reconstruction. The default plan, played with Next step on seeds 1–80 and choosing "Best land first" at each re-plan (measured 2026-11-18), gives on average:

| | Inca years | Colonial years |
|---|---|---|
| Food available per person per day | ~1,675 kcal | ~1,385 kcal |
| Caloric Welfare Index (out of 100) | ~64 | ~46 |
| GDP per person (index, Maddison 1500 = 100) | ~102 | ~109 |

Each harvest is followed by a winter that sets how much chuño a crew can freeze-dry (hard, normal or mild; a game assumption). It leaves these averages almost unchanged but moves single runs: colonial food differs by up to about 100 kcal a day, mostly because mild Inca winters leave smaller stores to carry past 1573.

GDP is shown as an index because the historical series come in different dollars (Maddison 2003 in 1990 dollars; the Maddison Project Database in 2011 dollars); an index can be compared with either without mixing units. Maddison's estimate for all of Latin America rises about 5% from 1500 to 1600; the game rises a little more.

The end screen separates two things:

- **Over time** (what an observer would see): food falls and GDP per person rises in nearly every game.
- **What the colonial rules did** (same people, same weather, Inca rules instead): food about −480 kcal; GDP roughly unchanged (about +2 index points), because silver about offsets the field labour lost. Over time, GDP per person rises for two reasons, and which counts as the main one depends on the decomposition. Silver adds about 8 index points, and the field output lost to the mita and resettlement takes about 6.5 back (resettlement about 2.5 of it). The population collapse adds about 6.5, mostly because when crews are lost the player re-plans, and "Best land first" drops the chuño crews and the highest fields so survivors farm only their best land; more land per survivor is about 1.5 of it. The re-plan is the player's choice, and which choice grows more depends on the plan held: with the default plan keeping the same shares grows less food on all 80 test seeds (colonial food near 1,000 kcal) and never keeps more stores, but with a 5/5/3/1 plan and no chuño crews it grows more on 24 of 80; the re-plan box shows both for the student's own plan. With the same shares the colonial rules account for most of a smaller GDP rise (3.05 of 4.65 points on average). With best land first, without silver GDP barely rises (+0.07 points); without the collapse it still rises (+5.47). In the game's formula chuño work counts for nothing in GDP, so moving crews from chuño to the fields raises measured GDP although nobody eats more. Details: [docs/sensitivity-2026-11-18.md](../notes/sensitivity-2026-11-18.md). Only the food prediction is graded on this comparison (food falls in every tested game). The GDP answer is shown for discussion: the weather nudges it ("rise" instead of "stay" in 5 of 80 seeds with the same plan) and the student's re-plan moves it (different on 35 of 80 seeds).

### Mechanisms that carry the result

| Mechanism | In the game | Status |
|---|---|---|
| Colonial quotas set at the 1573 count | mita = one man in seven of the 1573 population; tribute a set total (500 kcal per person at 1573, taken in food). Tribute could be reassessed after a new count; mita allocations followed a different adjustment process. The game keeps both fixed, so the burden per survivor rises | structure follows Toledo's system; tribute size is a game figure |
| Inca labour duty | one man in ten on state and temple fields (into the state qollqa); half that harvest returned as feasts and rations | teaching assumption; the game leaves out exchange and markets (Hirth & Pillsbury 2013) |
| Land per person | zone output ∝ labour^0.9, so survivors farm more land each, but terraces need hands | teaching assumption (cf. Wernke 2010) |
| Reducciones | colonial yields 7% lower at c. 1575, 12% at c. 1592, 15% at c. 1600: families resettled into towns far from fields, with the loss building up | mechanism from Wernke 2010; gradual and locally varied (Hunter 2025; de la Puente Luna & Perales 2026); sizes are teaching assumptions |
| Population | −50% before 1573, −15% more in the 1585–91 epidemics | round game figures; estimates vary widely |
| GDP | 340 + 0.045 × field output + silver, shown as an index (416 = 100); each mine worker's silver is worth more at harvests 5 and 6 (a teaching assumption; the late-century production trend is not yet verified here) | teaching assumptions, tuned to start near Maddison's 416 |

A "What would have to be true for this to reverse?" panel lets students change the Inca duty, colonial tribute, population fall and the value of mine work against farm work, and shows the thresholds where food would rise or GDP would fall.

Everything else (yields, frost and drought odds, protection, chuño, community stores, eating cap, hunger deaths, wage relief, household spread) is a play mechanic; the in-game "How the model works" section lists them. Waru waru protect against frost more than terraces do, because raised fields work through their water and shape (Kolata & Ortloff 1989); the sizes are play values. The community's chuño goes into community stores; "qollqa" is kept for Inca state storehouses (Morris 1986).

### Anchors and their status

- **GDP per person 416 (1500) → 438 (1600):** Maddison's conjectural estimates for Latin America as a whole, not Andes-specific. The game was tuned to land near both, so matching them is a design choice, not a test. It runs a little above 438 in the colonial years.
- **1,700 → 1,200 kcal per day:** the original game's teaching figure. We could not find a primary source; the game marks it as unsourced.
- **Households below 1,700 kcal:** a model guess (household food assumed to vary 30% around the average), illustrating the point of Wernke & Whitmore (2009) that households can go short while a region has a surplus.

The text and model were checked by four independent reviews (claims and charts; model logic; model construction; parameters and sensitivity), and their findings are addressed in this version.

### Evidence and checks

| file | what it is |
| --- | --- |
| [evidence/claims.yml](../evidence/claims.yml) | every load-bearing claim, with its kind (documented, estimate, interpretation, game assumption, game result, unsourced), status, sources and the pages that state it |
| [evidence/sources.yml](../evidence/sources.yml) | every source, with how far it has actually been read here |
| [evidence/check_evidence.py](../evidence/check_evidence.py) | checks the registry against the pages and the game's code; a changed constant fails until its claim is updated |
| [tests/test_check_evidence.py](../../../tests/02/test_check_evidence.py) | plants one defect per rule and shows each rule can fail |
| [CONTRIBUTING.md](https://github.com/Azuromalachite/frost-and-silver-game/blob/d64a632eaa78e2bc33f9cc4fd1726266f68ac246/CONTRIBUTING.md) | the rules, and how to run the checks |
| [AGENTS.md](https://github.com/Azuromalachite/frost-and-silver-game/blob/d64a632eaa78e2bc33f9cc4fd1726266f68ac246/AGENTS.md) | the short, binding rules for anyone changing the repository, human or AI |
| [docs/hard-mode-2026-11-18.md](../notes/hard-mode-2026-11-18.md) | the weather presets: how Standard, Hard and Extreme were screened from 2,000 seeds, and what the end screen compares them with |
| [docs/teaching-guide.md](../notes/teaching-guide.md) | for instructors: seeds, the session, what counts as success, discussion prompts, the smoke test |
| [docs/design.md](https://github.com/Azuromalachite/frost-and-silver-game/blob/d64a632eaa78e2bc33f9cc4fd1726266f68ac246/docs/design.md) | the visual and writing style, for anyone building a similar game |

The checker prints the current number of claims and sources, and how many history claims rest only on sources not yet read here, on every run.

**[docs/history-and-evidence.md](../notes/history-and-evidence.md)** goes claim by claim: what the game says about the Andes between 1500 and 1600, what kind of evidence supports each statement (documented, estimate, interpretation, game assumption, unsourced), and what the game leaves out.

## Sources

- Maddison, A. (2003). *The World Economy: Historical Statistics.* OECD.
- Arroyo Abad, L., & van Zanden, J. L. (2016). Growth under extractive institutions? *Journal of Economic History*, 76(4).
- Dell, M. (2010). The persistent effects of Peru's mining mita. *Econometrica*, 78(6).
- Wernke, S. A., & Whitmore, T. M. (2009). Agriculture and inequality in the colonial Andes. *Human Ecology*, 37, 421–440.
- Wernke, S. A. (2010). A reduced landscape: toward a multi-causal understanding of historic period agricultural deintensification in highland Peru. *Journal of Latin American Geography*, 9(3), 51–83.
- Orlove, B. S., Chiang, J. C. H., & Cane, M. A. (2000). Forecasting Andean rainfall and crop yield from the influence of El Niño on Pleiades visibility. *Nature*, 403.
- Pontzer, H., et al. (2016). Metabolic acceleration and the evolution of human brain size and life history. *Nature*, 533, 390–392.
- Murra, J. V. (1972). El control vertical de un máximo de pisos ecológicos en la economía de las sociedades andinas. Pulgar Vidal, J. (1941), on the altitude zones.
- Morris, C. (1986). Storage, supply, and redistribution in the economy of the Inka state. In *Anthropological History of Andean Polities*, 59–68. Cambridge University Press.
- Hirth, K., & Pillsbury, J. (2013). Redistribution and markets in Andean South America. *Current Anthropology*. https://doi.org/10.1086/673114
- Kolata, A. L., & Ortloff, C. (1989). Thermal analysis of Tiwanaku raised field systems in the Lake Titicaca Basin of Bolivia. *Journal of Archaeological Science*. https://doi.org/10.1016/0305-4403(89)90004-6
- Hunter, R. A. (2025). The structural transformation of Ollantaytambo's Inka ecology under Spanish rule. *Antiquity*. https://doi.org/10.15184/aqy.2024.200
- de la Puente Luna, J. C., & Perales Munguía, M. F. (2026). Villages at the crossroads: Inka and Spanish imperialism, local negotiation, and emerging reducción landscapes in early colonial Jauja, Peru. *Ethnohistory*. https://doi.org/10.1215/00141801-12105092
- Gil Montero, R., & Zagalsky, P. C. (2016). Colonial organization of mine labour in Charcas (present-day Bolivia) and its consequences. *International Review of Social History*. https://doi.org/10.1017/S0020859016000456
- Barragán Romano, R. (2020). Women in the silver mines of Potosí. *International Review of Social History*. https://doi.org/10.1017/S0020859019000555

Some of these were added from a reference collection's reading notes; the papers themselves have not all been re-read for this version.

## Status: a frozen teaching baseline, and research beside it

Since 18 November 2026 the game is frozen as a teaching baseline: it gets fixes,
accessibility work and changes from classroom feedback or the original author,
not new mechanics. Questions the evidence base has opened beyond the game's one
lesson are investigated in [`research/`](research-readme.md) as separate,
pre-registered models that are allowed to contradict the game.

## Research contribution, 18 November 2026

The [Codex-assisted research review](../notes/research-review-2026-11-18.md) records
reproducible model checks and remaining issues, including weather-dependent
prediction grades and the distinction between a conditional harvest comparison
and an alternative historical trajectory.

See [literature notes](../notes/literature-notes.md) for Tambo Viejo storage,
tribute reassessment and mita, diversified farming, exchange, and MPD2023
comparability; [BibTeX references](../references/research.bib) and
[access gaps](../references/ACCESS.md) provide the source trail.
These notes record proposed gameplay changes; they do not implement them.

Its readings were checked by an adversarial review before merging: six papers read only in part are recorded as `sections_read`, so the claims resting on them are `partly_supported`, not `supported`.

The [crop and camelid reading notes](../notes/agropastoral-literature-2026-11-18.md)
add twelve bounded sources, including the supplied Winkel and alpaca-survival
papers. The [implementation review after PR #29](../notes/implementation-review-2026-11-18.md)
distinguishes resolved upstream issues from remaining commodity, herd, water,
seed, market and historical-time limits. Its diagnostics reuse the existing
model check; they introduce no new gameplay rules or historical parameter values.

The [climate and weather review](../notes/climate-weather-literature-2026-11-18.md)
adds ten sources and extends the reading of Wernke and Whitmore (2009). It
distinguishes regional climate, local frost exposure, crop damage and food access;
the supplied Saavedra and Takahashi (2017) and Sae-Lim et al. (2025) papers resolve
two earlier full-text gaps. The [weather debrief proposal](https://github.com/Azuromalachite/frost-and-silver-game/blob/d64a632eaa78e2bc33f9cc4fd1726266f68ac246/docs/weather-debrief-proposal-2026-11-18.md)
sets out how to compare a defined strategy across different weather without
confusing that exercise with the existing same-weather benchmarks. These are
evidence notes and proposed behaviour, with no gameplay changes or new calibrated
weather parameters. All new source readings are recorded as `sections_read` and
the eleven new claims as `partly_supported`.

The [seven-paper food-access and recovery review](../notes/food-access-recovery-literature-2026-11-18.md)
examines wages and purchasing power, quota fulfilment, seed exchange, spatial pest
effects, dung resources and household mining work. Its
[implementation-gap review](../notes/food-access-recovery-gaps-2026-11-18.md) is based
on main through PR #29 and proposes an order of work without changing gameplay.
Five sources are newly registered and two earlier readings extended; all seven
are `sections_read`, with nine new claims at `partly_supported`.

The [potato-processing and mining-income specification](../notes/processing-income-spec-2026-11-18.md)
adds supplied-paper readings, a provisional energy audit and separate physical
and household-budget accounts. The [spatial climate-risk experiment](../notes/climate-risk-experiment-2026-11-18.md)
defines a narrow, held-out comparison before game integration. These are research
specifications; no new calibration or gameplay results are claimed.

## Credits and licence

Adapted from [“Week 2: Tahuantinsuyu Harvest & Frost Defense”](https://superlative-sprinkles-2653a1.netlify.app/) by Amnuayvit Thitibordin, licensed [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

Adapted by Thanakrit Wongsatit. Changes: rebuilt as a turn-based game with a colonial second act, a new model, and a new visual design. Icons from the IconMCP library.

This adaptation is licensed under **CC BY-NC-SA 4.0** as well (see `LICENSE.md`): you may share and adapt it for non-commercial purposes, with attribution, under the same licence.
