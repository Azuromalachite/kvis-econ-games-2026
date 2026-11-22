# Teaching guide

For an instructor running Frost & Silver in a class of about 45–60 minutes. The
game is ready for an **instructor-led pilot**. It is not yet meant as an
unguided assignment: students need the framing below to tell what the evidence
shows from what the game assumes.

## What students should leave with

- **GDP per person and food per person are different things**, and they can
  move apart. In the game they do: GDP per person rises while food falls.
- **The game is a model, not a reconstruction.** It produces a simulated result
  from stated assumptions. It does not show that Andean families actually ate
  1,700 or 1,200 kcal a day. The course figure of 1,700 → 1,200 has no source we
  could find, and the game labels it so.
- **Where the evidence ends and the designer's choices begin.** Every game
  number is labelled in the game, and the evidence for each claim is in
  [history-and-evidence.md](history-and-evidence.md).

## Before class

- **Use one seed for the whole class**: send the link with `?seed=` and a
  number, for example `frost-and-silver.html?seed=12345` (the pinned run's seed,
  a typical year: about 1,410 kcal after 1573 with the default plan). Everyone
  then gets the same frosts, droughts and forecasts, so differences in results
  come from choices, and the graded food prediction is comparable. Without a seed
  each player gets different weather.
- **Or pick a weather preset** on the intro screen: Standard (seed 12345, a
  typical weather), Hard (seed 313) or Extreme (seed 2024). Difficulty changes
  only the weather, never the rules. On Hard the default plan loses about 90
  people to hunger and a careful plan can save almost all of them; on Extreme
  (droughts at both 1592 and 1600, about 550 kcal after 1573 with the default
  plan) every tested plan loses well over 100, so success is how many survive.
  A link with `?seed=313` or `?seed=2024` preselects the preset. The end screen
  judges survival against the default plan on the same weather, so a group that
  chose Hard is not marked down for it. How the seeds were chosen:
  [hard-mode-2026-11-18.md](hard-mode-2026-11-18.md).
- **A class experiment**: give every group the Hard seed, let each choose its own
  policy, then compare who kept the most people alive and why. Compare groups
  only within one preset: the colonial rules' food effect depends on the weather
  (about −490 kcal on Standard, −720 on Hard and −1,040 on Extreme), because a
  fixed tribute takes a larger share of a poor harvest.
- **Standard is a typical weather**: on it the default plan's food is close to
  the plan chosen in advance's (about 1,410 against 1,600 kcal after 1573). Use Hard
  to show how many lives planning saves (92 hunger deaths against about 11). On Hard
  the plan loses a few more than it would without planting late: its hazy years
  mostly bring rain, so a good rule can still lose on one weather.
- **Try your seed first.** Some are harsh. A harsh seed can be a deliberate
  lesson, but it should not be a surprise.
- **Try it on the classroom browser and a phone** before the session; see the
  smoke test below.
- **Tell students how time works** (it is on the 1573 screen too): harvests 1–3
  are three years in a row around 1500; harvests 4–6 are snapshots of c. 1575,
  1592 and 1600. Food stores carry over between snapshots as a simplification;
  the game does not play the decades in between.

## Running the session

1. **Predict** (5 min). Students read the briefing and predict whether the
   colonial rules will make GDP per person and food per person rise, stay or
   fall, with a sentence of reasoning.
2. **Play** (20 min). Next step plays one step at a time; Play runs the
   harvests on its own and deals each plan into the crew board crew by crew.
   Milestones pause play.
3. **Re-plan at 1573.** When the population falls, the game stops and asks the
   student to re-plan: keep the plan's shares on fewer crews, put every crew on
   the best land first, or set crews by hand. This choice matters a great deal
   (see below), so ask students to write down why they chose it.
4. **Debrief** (15 min) from the end screen.

## What counts as success

No plan we tested keeps colonial food at the 1,700 goal on average: the best of
2,304 strategies averaged about 1,620 kcal a day after 1573 ([strategy
sweep](strategies-2026-11-18.md)). So reaching 1,700 is not the test. Success is:

- protecting the community: fewer hunger deaths, stores kept, food kept up;
- explaining, with the end screen's numbers, why GDP rose while food fell.

The end screen says this and shows each student's own numbers. It first scores
a plan the student could have chosen before playing (Valley terraces, one Inca
chuño crew, best land first throughout, planting late in hazy years; the tested plan with the fewest hunger
deaths on average) on the student's own weather, and compares it with theirs:
hunger deaths first, then food after 1573, then welfare. Below that it names the
best of the 2,304 tested plans on that weather, picked after the weather is
known, so a hindsight benchmark rather than a fair score (it reaches 1,700 on
about 3 seeds in 10). A student can replay to try either. It lists the turning points of their game
(milestones, with the harvest each happened in). Assess the explanation, not the
outcome: two students with the same reasoning can get different results,
because the weather differs between seeds.

## Discussion prompts

- **Why did GDP per person rise?** In the game there are two causes, and which
  counts as "the main one" depends on how you count, and on the re-plan:
  silver, and the collapse (fewer people, re-planned onto their best land).
  With best land first, without silver GDP barely rises; without the collapse it
  still rises. With the same shares the rules are most of a smaller rise. Ask
  students what each counterfactual removes. Students answer this as an
  ungraded question before playing ("In this game GDP per person rises too.
  What do you think will raise it? Silver / fewer people sharing the land /
  both / not sure"), and the end screen shows
  the split for their own game; only the food prediction is graded.
- **What did your re-plan at 1573 do?** Putting every crew on the best land
  leaves no chuño and nothing growing up high. Which choice grows more depends on the plan the student held:
  with the starting plan (two chuño crews) keeping the shares grew less food on
  every test seed and never kept more stores; with few chuño crews (5/5/3/1,
  none on chuño) it grew more on 24 of 80, because spreading crews over the
  lower zones grows more than crowding the valley. The re-plan box shows both
  for the plan on the student's board. Ask what the game leaves out that might
  have made stores or variety worth keeping.
- **Why doesn't spreading crews across heights help in this game?** The
  vertical-archipelago interpretation (Murra's term) describes access to
  resources at several heights, often in separate places; whether that buffered
  a bad year depends on which places and crops were affected. In the game it
  never pays: the game uses a simplified frost boundary that always strikes the
  highest fields first, so a higher field is never safer. Ask
  students what the game would need to reward spreading, and what evidence
  would justify it. This turns a limit of the model into the lesson.
- **What does a GDP number hide?** Silver shipped to Spain counts as output;
  in this game's formula chuño made for the stores does not. Who ate?
- **A misconception to listen for: "the Spanish brought in extra workers."**
  Students sometimes explain the colonial years with outside labour. In this
  game the mita draws its workers from the student's own community and no one
  is added; the copied report says so under the student's reasoning. Ask what
  happens to the fields when one man in seven leaves.
- **Which change mattered?** After a replay, the end screen names the single
  change that, undone on the same weather, would have saved the most people,
  and says when a run had both the highest GDP and the most hunger deaths. Ask
  students to explain that one change before the rest.

## Known limits to mention

- The colonial dates are sampled snapshots; stores carry over between them.
- Spreading crews never pays, because the game's frost has no pattern that
  spares lower ground.
- "Households below 1,700 kcal" comes from an assumed spread around the
  average, a model guess, not a measurement.
- Quotas stay fixed after 1573. Tribute could be reassessed after a new count;
  mita allocations followed a different adjustment process.
- A community can grow a little in good years, but not enough to gain a crew.

## If your course materials use other numbers

Lecture slides may use other examples: a wage's purchasing power, a GDP series
for one country in other dollars, or a welfare index from a different classroom
model. They answer different questions from the game's food-availability
simulation. Say so before students compare them, for example with one slide
headed "Two models, different questions".

## Smoke test

Before a class, play once on the classroom browser, and once at phone width,
with a fixed seed:

- [ ] the briefing loads; the food prediction, the "what raised GDP?" question and Start the game work;
- [ ] change crews by hand; build terraces; the field log records each harvest;
- [ ] Play runs, Pause stops it, Next step advances one step;
- [ ] a milestone pauses play and Keep playing resumes it;
- [ ] at 1573 the re-plan box appears and the harvest waits for a choice;
- [ ] the end screen shows the success box, the charts, the graded food prediction and the answer to "what raised GDP?";
- [ ] Replay with the same weather gives the same frosts, and the comparison table appears;
- [ ] Copy report copies the text report;
- [ ] in dark mode, everything is readable;
- [ ] on a phone (375 px wide) nothing scrolls sideways: the intro with its weather choice, the re-plan box and the end screen.

A run of this list is recorded in [smoke-test-2026-11-18.md](../../../tests/02/manual-smoke.md).
