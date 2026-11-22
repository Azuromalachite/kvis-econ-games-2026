# Frost & Silver: the history behind the game, and how far to trust it

What the game says about the Andes between 1500 and 1600, what each statement
rests on, and what is the game's own invention. Kept in step with the game
(last updated 2026-11-18); `evidence/check_evidence.py` checks that its anchors
still match the game.

## Short answers

- **GDP per person rose a little across the sixteenth century, as far as anyone
  can estimate.** Maddison's figures for Latin America as a whole go from 416
  (1500) to 438 (1600), in 1990 international dollars. These are conjectures for
  a whole continent, not measurements for the Andes.
- **Food per person probably fell for many Andean families, but no source gives
  the size.** The course figure of 1,700 falling to 1,200 kcal a day has no
  source we could find. The game keeps it only as a labelled teaching figure.
- **The game's central claim is a model result, not a finding.** In the game,
  GDP per person rises for two reasons, silver and the population collapse,
  and which counts as the main one depends on how you decompose it, while the
  colonial rules take the food. The collapse works mostly through how the
  player re-plans fewer crews: putting them all on the best land raises output
  per person (see the sensitivity sweep). That is a defensible
  reading of the estimates, but it depends on numbers the game chose.

## The game's key message

**GDP per person grew in sixteenth-century Latin America, but life did not get
better, because food per person fell.** This is the original author's framing.
The first half rests on Maddison's estimates; the second half is plausible but
its size is unsourced (see the food claims below). The game shows both numbers
side by side so students can see growth and welfare come apart.

## How to read this document

Each claim is labelled by the kind of support it has. These are kept apart on
purpose: "the game uses 50%" is not the same as "the population fell by 50%".

| label | meaning |
| --- | --- |
| **documented** | stated in a primary or standard secondary source, and checked during this project |
| **estimate** | a scholarly reconstruction with wide uncertainty (population, GDP) |
| **interpretation** | a reading of the evidence that historians argue about |
| **sections read** | only some pages were read (named in the source's locator); enough to partly support a claim, never fully |
| **from notes** | taken from a source's abstract or a reference collection's reading notes; the full text was not re-read here |
| **game assumption** | a number or rule the game chose so the model can run; no source sets its size |
| **unsourced** | circulates in the course material; no source found |

## Chronology used by the game

| date | event | label |
| --- | --- | --- |
| c. 1500 | Inca rule over the Andes (Tawantinsuyu). Harvests 1–3 are set here. | documented |
| 1520s onward | Epidemics of smallpox and measles reach the Andes ahead of and alongside the conquest. | documented |
| 1532 onward | Spanish conquest, then civil wars among the conquerors; many state storehouses emptied. | documented (general); the storehouse detail is from notes |
| 1545 | Spaniards begin mining the Cerro Rico at Potosí. | documented |
| 1570s | Viceroy Francisco de Toledo's reforms: a general count of the population, resettlement into towns (reducciones), fixed tribute, and the Potosí mita drawing one adult man in seven from a defined mita region. Harvest 4 (c. 1575) is set here. | documented |
| 1585–91 | A new wave of epidemics. Harvest 5 (c. 1592) follows it. | documented as a period of epidemics; the game's 15% loss is a game assumption |
| c. 1600 | Harvest 6. Maddison's 1600 estimate is the comparison point. | estimate |

The game plays six harvests, each one farming year. Harvests 1–3 are three
years in a row; harvests 4–6 are snapshots decades apart.

## Claims the game makes

### Land and farming

| claim in the game | label | source and limits |
| --- | --- | --- |
| Andean communities held fields at several altitudes so that one frost or drought rarely ruined everything (the game no longer states this frequency claim: it describes access to resources at several heights, and says whether that buffered a bad year depends on which places and crops were affected) | interpretation | Murra (1972), the "vertical archipelago", from notes; no joint crop-loss evidence checked. Murra described access rights to separate "islands" of land, often far apart; the game draws one contiguous slope, which is a simplification. |
| In the game, frost always strikes from the top down, so higher fields are never safer than the valley | game assumption (claim.game.frost_from_top) | Frost risk rising with altitude: Trasmonte et al. (2008), abstract read. That a frost never spares a higher zone while hitting a lower one is the game's simplification. Its consequence, measured in a [strategy sweep](strategies-2026-11-18.md): placing crews on the best land first always beats spreading them, so the game no longer calls spreading insurance. Murra's insurance argument needs bad years that hit heights differently, which the game leaves out. |
| The game's four zones (valley, upper fields, high grain, puna) are schematic; real altitude ranges overlap and vary | documented | Geographers also use Quechua-derived names for these zones (Pulgar Vidal 1941); the game uses plain descriptive names and shows the nearest of his names under each: Quechua, Suni, Suni–Puna, Puna. The lecture's zones sit higher than his, so his low Yunga region, used by the original game, has no counterpart. |
| Each zone's air and soil temperature | game assumption (claim.game.air_temperature, claim.game.soil_temperature) | Air 6.5 °C colder per 1,000 m (the original game's lapse rate), anchored at about 12 °C at Cusco (about 3,400 m); not checked against station data. Soil 4.2 °C below the air, warmed 0.8 °C by terraces and 1.6 °C by waru waru: the original game's rule. Shown for orientation only; frost losses do not depend on them. |
| Maize grows in the warmer valleys below about 3,500 m; potatoes and other tubers higher; cold-tolerant kañiwa higher still; the puna is mainly pasture | documented (general agronomy) | Checked against secondary sources only. |
| Chuño keeps for years | documented | Fonseca & de Haan (2021), from notes; FAO Mountain Partnership (2023), read, for modern chuño. That it kept as long in 1500 is assumed. |
| Chuño is made by freezing potatoes at night and drying them in the sun by day | documented (modern practice) | FAO Mountain Partnership (2023), read: night freezing and daytime sun; white chuño is then soaked for 20–30 days and sun-dried for 5–8. It names no season and gives no rates. |
| How much chuño a crew can make depends on the winter after the harvest | game assumption (claim.game.chuno_winter) | The winter after each harvest is a game assumption: hard (1 in 4, 130% of normal), normal (1 in 2) or mild (1 in 4, 70%). It is unknown when crews are planned, so the same harvest and the same chuño crews can leave different stores. The source describes the process, not how weather changes its pace; the sizes and odds are play values. |
| Raised fields (waru waru) soften frost; terraces protect less | unverified for raised fields (Kolata & Ortloff read from notes only); the protection the game uses is a game assumption | Kolata & Ortloff (1989) model raised-field frost protection and show it depends on the field's shape and water. The game's frost losses (20% with waru waru, 40% with terraces, 60% without, 45% for cold-tolerant kañiwa) are play values. |
| Andean elders forecast rain from how clearly the Pleiades rise in June | documented (modern practice) | Orlove, Chiang & Cane (2000), checked from the abstract. That this was done around 1500 is not established. The game's forecast accuracy is a play value. |

### The Inca system

| claim in the game | label | source and limits |
| --- | --- | --- |
| Communities owed labour to the state (mit'a) and worked state and temple fields | documented | Standard. |
| One man in ten worked the state fields; half of that harvest came back as feasts and rations | game assumption | How much labour went to the state and how much returned is debated. |
| The qollqa were state storehouses; households and communities kept their own stores | documented | Morris (1986), from notes. The game puts the community's chuño in community stores and keeps "qollqa" for state stores. |
| The Inca economy ran on redistribution | interpretation; the game simplifies | Hirth & Pillsbury (2013) argue exchange and markets also mattered. The game leaves exchange out and says so. |

### The colonial system

| claim in the game | label | source and limits |
| --- | --- | --- |
| The Potosí mita drew one adult man in seven, from a defined mita region, not from every community | documented | Checked in this project (Dell 2010 uses that boundary). |
| Mita and tribute quotas were set from census counts, with differing paths of adjustment | documented (partly) | The teaching reference describes count-based obligations. Selected sections of Zagalsky (2014) distinguish more rigid official mita allocations from tribute reassessment and distinguish allocations from actual labour or money payments (question 6). The game keeps both fixed as a simplification; its grouped recount wording still needs qualification. |
| Potosí also ran on paid workers (mingas); women worked in ore sorting, refining and trade | documented, partly supported | Gil Montero & Zagalsky (2016), from notes; Barragán Romano (2020), selected sections read. The game's wage crews stand in for paid work. |
| Tribute is taken as food: 500 kcal per person per day at the 1573 count | game assumption | The real tribute was a fixed amount per adult man, paid in silver and goods. The size is chosen to calibrate the game. |
| Resettlement into towns (reducciones) put many fields far from home | documented | Wernke (2010). |
| Resettlement cut yields by 7% (c. 1575), 12% (c. 1592) and 15% (c. 1600) | game assumption | Hunter (2025) and de la Puente Luna & Perales (2026), from notes: the change was gradual and varied from place to place. The sizes are invented. |
| The epidemics cut the population by half before 1573 and by 15% more in 1585–91 | estimate (direction); game assumption (sizes) | Cook (1981) estimates a very large fall with wide uncertainty. The game's round figures are not his. |

### Food and output

| claim in the game | label | source and limits |
| --- | --- | --- |
| GDP per person: 416 in 1500, 438 in 1600 (1990 international dollars) | estimate | Maddison (2003), checked: Latin America as a whole. Not Andes-specific. Newer Maddison Project figures use different dollars and must not be mixed in (Bolt & van Zanden 2025, from notes). |
| Total output and population fell while output per person rose | estimate | Maddison (2003). |
| Colonial Peru and Mexico saw economic growth from about 1550, driven partly by mining | interpretation | Arroyo Abad & van Zanden (2016), cited from a literature review, not re-read. |
| In the game, GDP per person rises through silver and through the population collapse; which is the main cause depends on the decomposition | game result | Default plan, seeds 1–80: silver adds about 8 index points and the field output lost to the mita and resettlement takes about 6.5 back (resettlement about 2.5 of it); the collapse adds about 6.5, of which about 3.0 is chuño crews moved to the fields, 2.0 retreating to the best zones and 1.5 more land per survivor ([sensitivity sweep](sensitivity-2026-11-18.md)). With best land first at each re-plan, without silver GDP barely rises (+0.07); without the collapse it still rises (+5.47); with the same shares the rules are most of a smaller rise (3.05 of 4.65). In the game's formula chuño work counts for nothing in GDP. The re-plan when crews fall is the player's choice (claim.game.crew_trim_order); these numbers use "Best land first". Keeping the same shares leaves colonial food near 1,000 kcal. |
| Food per person fell from about 1,700 to about 1,200 kcal a day | unsourced | The original game's figure. Not found in any source. Shown in the game as a dotted, labelled line. |
| Some households' own fields fall short even when the community produces a surplus | documented | Wernke & Whitmore (2009), selected model and results sections read. Own-farm shortfalls are not observed consumption or starvation; herding, trade and sharing are not fully quantified. The game's "households below 1,700 kcal" share comes from an assumed 30% spread, not from their figures. |
| Adults use about 2,190 (women) and 2,720 (men) kcal a day | documented, modern | Pontzer et al. (2016), Table 1, read. A modern multi-country sample that excluded manual labourers; used only for scale. |
| Skeletons and isotopes show diet changed after contact | documented, from notes | Klaus & Tam (2010); Tessone et al. (2025). Neither gives kcal a day. |

### Records: the quipu

| claim in the game | label | source and limits |
| --- | --- | --- |
| Quipus recorded numbers in base ten on pendant cords: clusters of single knots for tens, hundreds and thousands, a long knot for the units, a figure-eight knot for one, and a gap for zero | documented | Ascher & Ascher (1981); Urton (2003). Not re-read here. The game's quipu follows this convention but leaves out colour coding, subsidiary cords and how cords were grouped. |
| Early Spanish officials relied on quipu accounts for tribute and census counts (removed from the game until verified) | documented | Urton (2003), not re-read here. |
| Each harvest report is drawn as the community's quipu | game assumption | Which figures a community's cord keeper actually recorded is not known; the game picks the ones on its ledger. GDP is not put on the quipu, because no one at the time counted it. |

### Silver

| claim in the game | label | source and limits |
| --- | --- | --- |
| Potosí silver went to Spain and, through trade, as far as China | documented | Flynn (2015), cited from a literature review. |
| Silver output at Potosí rose sharply after the 1570s, once mercury amalgamation spread (removed from the game until verified: the game says only that its silver per mine worker rises, a teaching assumption) | documented | Bakewell (1984); the pages read so far concern wages and budgets, not the production trend. |
| Each mine worker's silver is worth more in later colonial harvests | game assumption | The path (harvests 4, 5, 6) is chosen to follow the late-century surge; its size is invented. |

### How the game shows its numbers

| choice | label | why |
| --- | --- | --- |
| GDP per person as an index, c. 1500 = 100 | game assumption | Maddison (2003) uses 1990 dollars; the Maddison Project Database (Bolt & van Zanden) uses 2011 dollars and has Peru-specific estimates for the early 1600s. An index lets the game be compared with either without mixing units. |
| Caloric Welfare Index out of 100 (50 food, 30 stores, 20 resilience) | game assumption | The weights come from the original game's classroom model; how each part is scored is this adaptation's. A model output, not a measurement. |

## What the game leaves out

- Markets, trade and money inside the community.
- Differences between households; the community is one average.
- Food quality as distinct from quantity.
- The health costs of silver, including mercury used in refining (Robins &
  Hagan 2012, from notes).
- Haciendas, Spanish towns and the colonial market for food, which drew farm
  output towards Potosí (Covey & Quave 2017, cited from a literature review).
- Local variation: one community stands for many very different ones.

## Open questions

1. Where does the 1,700 → 1,200 kcal figure come from? The original game's
   author may know.
2. How much of the rise in GDP per person was silver and how much was more
   land per survivor? Selected sections of Arroyo Abad, Davies & van Zanden
   (2012) are now read in the [food-access review](food-access-recovery-literature-2026-11-18.md).
   Its wage reconstruction does not identify that decomposition for this
   community. Arroyo Abad & van Zanden (2016) remains from notes.
3. How large was the Inca labour duty, and how much came back?
4. How quickly did resettlement and the abandonment of terraces cut yields,
   and where?
5. Is mean soil temperature in these zones below the air, as the original
   game assumes (claim.game.soil_temperature), or slightly above it, as is
   common for annual means? The original author may know.
6. Were mita quotas reset by recounts (revisitas) in practice, as tribute
   could be (claim.research.tribute_reassessment), and how long did a
   recount take? Zagalsky (2014), selected sections now read, supports greater
   rigidity in official mita allocations than tribute reassessment
   (claim.research.quota_tribute_paths), while distinguishing allocation from
   fulfilment in labour or money (claim.research.quota_fulfilment). Its detailed
   1610 evidence is later than the game. Adjustment timing and local application
   remain open; Cole (1985) is another reading lead. The game keeps both fixed.
7. Which bad years hit some heights and spared others: frost pockets on valley
   floors, drought, hail, pests? The game could reward spreading crews only if
   its shocks differed by zone, and that needs a source first
   (claim.game.frost_from_top). Trasmonte et al. (2008) rank frost risk by
   altitude and say nothing about valley floors freezing while slopes stay warm.
   The [climate review](climate-weather-literature-2026-11-18.md) now supplies
   evidence for terrain effects (claim.climate.topoclimate), interacting physical
   controls (claim.climate.frost_controls), and geographically differing drought
   responses (claim.climate.drought_heterogeneity). Our inference from the
   terrain evidence (Pouteau et al. report drainage and exposure effects at
   about 1 km, not this mechanism): cold air draining downhill is how a lower
   field can freeze while a higher one does not, which claim.game.frost_from_top
   rules out. It does not supply the joint
   crop-loss probabilities needed to quantify diversification. A basin or an
   explicitly composite setting also needs to be chosen before calibration.
   The [debrief proposal](https://github.com/Azuromalachite/frost-and-silver-game/blob/d64a632eaa78e2bc33f9cc4fd1726266f68ac246/docs/weather-debrief-proposal-2026-11-18.md) can test weather
   sensitivity using the present model while these numerical questions remain open.

8. In the original classroom design, what does puna food output represent:
   slaughter, exchange supported by livestock, or an aggregated pastoral return?
   That affects the scope of a herd model. The [new reading notes](agropastoral-literature-2026-11-18.md)
   and [implementation review](implementation-review-2026-11-18.md) distinguish
   those research questions from the present formula and historical evidence.

## Sources

| source | used for | read here? |
| --- | --- | --- |
| Maddison, A. (2003). *The World Economy: Historical Statistics*. OECD. | GDP estimates | figures checked |
| Arroyo Abad, L., & van Zanden, J. L. (2016). Growth under extractive institutions? *Journal of Economic History*, 76(4), 1182–1215. https://doi.org/10.1017/S0022050716000954 | colonial growth | no |
| Arroyo Abad, L., Davies, E., & van Zanden, J. L. (2012). Between conquest and independence: real wages and demographic change in Spanish America, 1530–1820. *Explorations in Economic History*, 49(2), 149–166. | wages and depopulation | selected passages, PDF pp. 4-8, 11 and 14 |
| Bolt, J., & van Zanden, J. L. (2025). Maddison-style estimates of the evolution of the world economy: a new 2023 update. *Journal of Economic Surveys*. https://doi.org/10.1111/joes.12618 | dollar units | from notes |
| Dell, M. (2010). The persistent effects of Peru's mining mita. *Econometrica*, 78(6), 1863–1903. https://doi.org/10.3982/ECTA8121 | mita region | boundary checked |
| Gil Montero, R., & Zagalsky, P. C. (2016). Colonial organization of mine labour in Charcas. *International Review of Social History*. https://doi.org/10.1017/S0020859016000456 | mita and paid labour | from notes |
| Barragán Romano, R. (2020). Women in the silver mines of Potosí. *International Review of Social History*. https://doi.org/10.1017/S0020859019000555 | women's work | selected publisher sections |
| Wernke, S. A., & Whitmore, T. M. (2009). Agriculture and inequality in the colonial Andes. *Human Ecology*, 37, 421–440. https://doi.org/10.1007/s10745-009-9261-2 | household shortfalls | selected pp. 428-437 |
| Wernke, S. A. (2010). A reduced landscape. *Journal of Latin American Geography*, 9(3), 51–83. | reducciones, terraces | no |
| Hunter, R. A. (2025). The structural transformation of Ollantaytambo's Inka ecology under Spanish rule. *Antiquity*. https://doi.org/10.15184/aqy.2024.200 | gradual change | from notes |
| de la Puente Luna, J. C., & Perales Munguía, M. F. (2026). Villages at the crossroads. *Ethnohistory*. https://doi.org/10.1215/00141801-12105092 | local variation | from notes |
| Cook, N. D. (1981). *Demographic Collapse: Indian Peru, 1520–1620*. Cambridge University Press. | population | no |
| Morris, C. (1986). Storage, supply, and redistribution in the economy of the Inka state. In *Anthropological History of Andean Polities*, 59–68. | state and community stores | from notes |
| Hirth, K., & Pillsbury, J. (2013). Redistribution and markets in Andean South America. *Current Anthropology*. https://doi.org/10.1086/673114 | exchange | sections read (pp. 642–643) |
| Murra, J. V. (1972). El control vertical de un máximo de pisos ecológicos en la economía de las sociedades andinas. | vertical archipelago | no |
| Pulgar Vidal, J. (1941). *Las ocho regiones naturales del Perú*. | zone names | secondary sources |
| Kolata, A. L., & Ortloff, C. (1989). Thermal analysis of Tiwanaku raised field systems. *Journal of Archaeological Science*. https://doi.org/10.1016/0305-4403(89)90004-6 | frost protection | from notes |
| Orlove, B. S., Chiang, J. C. H., & Cane, M. A. (2000). Forecasting Andean rainfall and crop yield from the influence of El Niño on Pleiades visibility. *Nature*, 403. https://doi.org/10.1038/47456 | Pleiades forecast | abstract |
| Fonseca, C., & de Haan, S. (2021). Traditional freeze-drying: chuño, kaya, chullqi. In *50 Andean Future Foods*. CIP. | chuño | from notes |
| Robins, N. A., & Hagan, N. A. (2012). Mercury production and use in colonial Andean silver production. *Environmental Health Perspectives*. https://doi.org/10.1289/ehp.1104192 | health costs | from notes |
| Klaus, H. D., & Tam, M. E. (2010). Oral health and the postcontact adaptive transition. *American Journal of Physical Anthropology*, 141(4), 594–609. | diet change | from notes |
| Tessone, A., Barberena, R., & Knudson, K. J. (2025). Isotopes and bioarchaeology in the Andes. *Archaeometry*. https://doi.org/10.1111/arcm.12989 | isotopes | from notes |
| Covey, R. A., & Quave, K. E. (2017). The economic transformation of the Inca heartland (Cuzco, Peru) in the late sixteenth century. *Comparative Studies in Society and History*, 59(2), 277–309. | colonial markets | no |
| Ascher, M., & Ascher, R. (1981). *Code of the Quipu: A Study in Media, Mathematics, and Culture*. University of Michigan Press. | quipu number system | no |
| Urton, G. (2003). *Signs of the Inka Khipu: Binary Coding in the Andean Knotted-String Records*. University of Texas Press. | quipus and colonial counts | no |
| Flynn, D. O. (2015). Silver in a global context, 1400–1800. In *The Cambridge World History*, vol. 6. | silver flows | from notes |
| Bakewell, P. (1984). *Miners of the Red Mountain: Indian Labor in Potosí, 1545–1650*. University of New Mexico Press. | silver context; wages and budgets | selected pp. 100-111, 122-125 and 132-133; silver-output series not audited |
| Pontzer, H., et al. (2016). Metabolic acceleration and the evolution of human brain size and life history. *Nature*, 533, 390–392. https://doi.org/10.1038/nature17654 | energy use for scale | read |

"From notes" means the source was cited from a reference collection's reading
notes or a literature review. Before quoting any of those claims elsewhere,
read the source.

## Research addendum, 18 November 2026

The [new literature notes](literature-notes.md) distinguish archaeological storage
capacity from actual inventory and access, and distinguish negotiable tribute
assessments from more rigid mining obligations. The table's general statement
about mita and tribute quotas now carries that qualification (see open question 6):
the current game holds both totals fixed as a simplification, and says so.

Hirth and Pillsbury's opening argument (pp. 642–643) has now been read; its exchange
interpretation is no longer based only on a collection note, but two pages of the
paper only partly support it. New source entries
separately record the 2025 Tambo Viejo systems article, the 2026 coca article,
Bruno's Formative-period farming discussion, the MPD2023 workbook checks, and
the Zagalsky presentation versus the unread book.

The [model review](research-review-2026-11-18.md) gives a specified seed sample and
a reproducible counterexample to the assertion that weather cannot change a
prediction grade. The game's wording was corrected after it
(claim.game.grading_weather). The historical and model limitations remain even when the
registry checker passes.

## Food access and recovery addendum, 18 November 2026

The [seven-paper review](food-access-recovery-literature-2026-11-18.md) distinguishes
reconstructed purchasing power from consumption, official quotas from actual
labour or payments, and food inventory from productive reserves. It also qualifies
generic diversification and fuel-versus-fertilizer rules. The
[implementation review](food-access-recovery-gaps-2026-11-18.md) records current code
limits and research gates on main through PR #29. These notes do not implement
new markets, stocks, pests, protection costs or historical parameters.

## Processing and mining budgets: evidence update

The [new specification](processing-income-spec-2026-11-18.md) records the supplied
processing papers and Bakewell/Cole page images, distinguishes mass yield from
energy recovery, records the two Burgos DOIs and documents a provisional batch
audit. Historical receipts, provisioning costs and transfers require separate
accounts. These readings do not validate the existing food, death or silver-path
coefficients. The pre-existing silver-surge claim remains unverified rather than
being upgraded merely because other parts of Bakewell were read.

The [climate experiment](climate-risk-experiment-2026-11-18.md) turns the open
spatial-risk question into a proposed one-crop, synchronized-weather comparison.
It establishes no diversification benefit or annual reconstruction. The original
author's open design questions above remain open.
