# Monsoon Navigator — P01 sailing windows: initial evidence review

[Research index](README.md) · [Current document requests](document-requests.md)

Date: 22 November 2026. Status: exploratory source investigation and access audit; not a completed systematic review or a preregistered model validation.

## Decision

Pursue **P01 / Q03: historically usable sailing windows**, beginning with **Aden ↔ Calicut**. Treat departure, open-sea passage, coastal approach, and arrival as distinct constraints. P02 merchant networks and P03 transport economics remain important, but this question tests the seasonal logic at the center of the game and can begin with a small, auditable case.

The working question is: **Does the season that gives the model a fast crossing also permit a historically supported departure and arrival?**

The current evidence warrants investigating this distinction. It does not yet justify replacing the game's monthly windows or travel times. This investigation did not change the engine or interface; this document records its initial findings.

Repository context: [research roadmap](https://github.com/Antooooon125/Week3-monsoon-navigator/blob/main/docs/research-directions-and-milestones.md), read on 22 November 2026; roadmap blob `45055cdc2ead618cc1474a440f566a085d53bee0`. Q03 is partially advanced by source discovery. Q04 is partially advanced by an access assessment. M1 remains unregistered and unrun.

## What the evidence currently supports

### Regional navigation is more specific than a two-season wind rule

Beaujard's introductory chapter describes difficult coastal navigation and berthing on India's west coast during the strong southwest monsoon, alongside several possible Arabia–India sailing windows. It points to Tibbetts for the navigational instructions. These passages support separating offshore assistance from coastal accessibility; they do not establish a universal July closure at Calicut. The chapter also warns that the solar Nairuz calendar drifted: a numbered day cannot be assigned a timeless Gregorian equivalent. Relevant chapter passages, particularly printed pp. 11–12, were read directly; the underlying editions were not. [S1]

### A contemporary merchant wanted to wait for better sea conditions

The Princeton Geniza Project's English translation of T-S 12.392 dates the letter to **28 October 1103 CE**. An India-bound traveler in an unidentified Red Sea port wishes he could delay the ship until the sea settled. His hypothetical offer of 200 dinars is rhetoric about avoiding departure, not a recorded payment or a calibrated cost. The letter provides neither an established Aden origin nor a Calicut destination, completed crossing, or transit duration. Relevant translated passages: recto 10–20 and verso 5–6. Translation credited to Marina Rustow and Alan Elbaum; no independent translation was attempted. [S2]

### Seasonal instructions are useful, but are not voyage observations

A letter from Madmun ibn Hasan in Aden to Avraham Ibn Yiju in Mangalore proposes dispatching a cargo ship at the beginning of the season and stopping at al-Diyyab. It is dated approximately to the 1130s. The instructions concern **Mangalore**, not Calicut, and describe intended action rather than a documented completed voyage. The island's identification is disputed between the Maldives and the Laccadives/Lakshadweep. Keep that ambiguity rather than inserting a certain island node into a route network. Relevant English translation: T-S 12.416 recto (2), 10–18, and verso 11–20; translator Marina Rustow. [S3]

### Translation and manuscript selection require checking

The RUTTER bibliography identifies Tibbetts as an important English route into Ibn Majid, while noting discrepancies with other editions and manuscript witnesses. Its discussions of the Fawa'id and associated editions were read through the author-uploaded text. This makes Tibbetts a starting point for extraction, with translation and edition recorded explicitly. It is not a substitute for reading the requested navigation passages. [S7]

## Pilot observation ledger

This is a source-discovery ledger, not a dataset of independent voyages. Different descriptions or copies of one document must share a document-family identifier.

| ID / source | Evidence class | Geographic and chronological fit | Permitted use | Numerical-window status |
| --- | --- | --- | --- | --- |
| PGP 9690 / T-S 12.392 [S2] | Contemporary letter; translated expression of preferred delay | Red Sea–India context, 1103; exact port and Indian destination unconfirmed | Establish that a merchant could value postponement because of sea conditions | Exclude: letter date is not a departure date |
| PGP 5417 / JRL Gaster heb. ms 1863/13 + T-S 12.416 [S3]; same document family as its other copy, PGP 5438 | Contemporary commercial instruction | Aden–Mangalore, inferred 1130s; uncertain island stop | Regional evidence of seasonal dispatch and planned intermediate provisioning/trade | Exclude from exact Calicut dates; no absolute departure date |
| PGP 26276 / T-S AS 146.89 + T-S NS 99.56 [S4] | Editorial summary and transcription; English primary translation not read | Mid-twelfth-century India trade; sender's location uncertain | Lead for season-dependent waiting | Exclude pending translation and location resolution |
| PGP 9045 / T-S AS 145.2 [S5] | Legal-document catalogue lead | Record header and descriptive dating differ: 1132 versus November/December 1130 | Flag chronology for specialist checking | Exclude until discrepancy resolved |
| Beaujard [S1] → Tibbetts | Modern historical synthesis pointing to navigational instructions | Several ports, periods, and calendars | Locate the underlying passage and compare route identity | Do not count as an independent historical voyage |

**Negative finding:** this first pass has not established a completed, dated Aden–Calicut passage. That is an access-and-evidence result, not proof that such records do not exist.

## Modelling literature: what is transferable

**Copeland, Riding the monsoon.** The article models an Iron Age/Periplus setting using modern 1992–1995 wind averages, contrasting summer and winter, with a simplified sailing-performance relationship derived through reconstructed Japanese vessel trials. Its fastest-path trade-cost approach is a methodological comparator, not direct performance evidence for a medieval dhow or junk. Selected methods and data-availability sections were read. The replication archive was located but not inspected, so software dependencies, inputs, licenses, and reproducibility remain unchecked. [S6]

**Perttola, Slayton, and Walker Vadillo.** Their comparison of Digital Navigator and qtVlm concerns early seventeenth-century Java–Sumatra. Agreement is better under favorable winds; adverse-wind results depend more on the routing approach. The discussion of routing assumptions and hindsight is useful for designing sensitivity checks. Their region-specific current results should not become a universal correction factor for the Arabian Sea. Selected methods and conclusions were read; code was not reproduced. [S8]

Neither study independently validates this game's travel times. Modern weather fields are analogues unless a defensible historical reconstruction is supplied.

## Next test and its falsifiers

The smallest useful next step is **one verified, directional historical route-window extraction**, with the calendar and endpoints resolved. Extract both directions if the source actually supplies them; absence of reverse instructions must remain missing data.

| Question | Observation needed | What would weaken the working interpretation? |
| --- | --- | --- |
| Are open-water assistance and port access sometimes in tension? | Same route/season with separate offshore and arrival or berthing advice | Source-level advice shows the proposed distinction does not affect this route, or the apparent conflict disappears after calendar conversion |
| Does the game's seasonal ranking agree with historical advice? | Verified directional window plus frozen model outputs | Model's preferred months fall outside the supported window after endpoint and calendar uncertainties are accounted for |
| Is a mismatch actually geometric? | Explicit port coordinates, units, and navigable route assumptions | Correcting geometry resolves the apparent seasonal mismatch without adding a port-access rule |

The game's reported July/January travel-time contrast is a **model output**, not a historical measurement. The roadmap's distance concern is also unresolved: a great-circle calculation would be a geometric lower bound, not an actual navigable sailing distance. `docs/baseline.md` D10 already records one such figure: about 1,808 nm between modern city coordinates, against the game's 1,450 nm. That figure uses modern points rather than historical anchorages. No independent geometry calculation was performed here.

Before any new confirmatory model sweep, commit a preregistration in accordance with the repository's research workflow. It must disclose that the roadmap, previously reported model contrasts, and the sources listed here have already been seen. This review cannot be retrospectively relabeled as preregistered.

### Proposed extraction fields

Record: source ID; document family; edition and translator; page/folio/line; date of composition; manuscript date where relevant; reading status; instruction versus actual action; exact origin and destination as written; proposed modern identification and confidence; direction; ship description as written; original calendar and day/month expression; conversion authority and uncertainty; departure constraint; offshore constraint; arrival constraint; observed versus recommended duration; stopovers; and exclusions.

Preserve original calendar expressions beside any converted dates. Record letter date separately from event date. Distinguish observed payment, proposed cost, and rhetorical amount. Do not merge later sailing manuals with twelfth-century letters without a chronology field and an explicit rationale.

### Proposed comparison rules to settle before registration

1. Freeze the engine revision, port coordinates, unit conversions, route assumptions, ship setting, and random-seed policy.
2. Classify evidence before inspecting additional model outputs: actual voyage; historical instruction; modern analogue; simulation output; or unresolved lead.
3. Use exact-route, calendar-resolved instructions for the primary comparison. Regional analogues inform interpretation and a separate sensitivity analysis.
4. Predefine how partial months, broad seasons, direction, and contradictory recommendations will be handled. Do not convert an imprecise season into an exact cutoff for convenience.
5. Register separate outcomes for transit speed, historically advised departure, and arrival practicability. Missing evidence does not mean closed or open.
6. Keep any pilot extraction and previously examined outputs labeled exploratory. If the historical evidence stays too coarse, report an inconclusive test rather than tune the engine to fit it.

## Document requests and access status

These are requests for research copies or relevant pages, not requests to redistribute full books in the repository. Please include the title/copyright page so the edition and pagination can be checked.

| Priority | Document / exact material | Why needed | Current access result |
| --- | --- | --- | --- |
| 1 | **G. R. Tibbetts, Arab Navigation in the Indian Ocean Before the Coming of the Portuguese** (1971; reprinted 1981): **pp. 360–382**, especially 368–369 and 372; additionally **pp. 227–231**, with footnotes | Verify route wording, calendar basis, source identity, and qualifications behind the modern synthesis | Bibliography verified; these pages not read. Page leads come from Beaujard and need edition checking |
| 2 | **Roxani Eleni Margariti, Aden and the Indian Ocean Trade: 150 Years in the Life of a Medieval Arabian Port** (2007): **pp. 35–45 and corresponding endnotes** | Check Aden's port-specific seasonal organization in the medieval context | Institutional metadata read; book pages not accessed. A review points to pp. 38–41; that locator is not direct book verification |
| 3 | **Copeland replication package**, `rtm_replication_pack.zip`, from the author's [research page](https://www.conradcopeland.com/research/rtm) / [Google Drive file](https://drive.google.com/file/d/1g191sqck9rvoazF6AmwgmiWqAlFNA2NR/view?usp=drive_link) | Audit inputs, code, licensing, and whether a small descriptive replication is feasible | Link resolves to a sign-in interface in this environment; contents not inspected. This does not establish that the archive is private |
| 4, optional | Copeland publisher files `ehr70016-sup-0001-Appendices.pdf` and `ehr70016-sup-0002-SuppMat.zip` | Inspect supporting assumptions and supplied materials alongside the author archive | Publisher download returned HTTP 403 here |

Additional access leads: Cambridge's April 2026 Fragment of the Month article about T-S 12.392 was located in indexed excerpts, but its URL redirected when opened. The accessible PGP translation was used instead. The RUTTER Zenodo PDF could not be parsed here; selected author-uploaded text was accessible. Neither problem needs to block the immediate Tibbetts extraction.

## Source register

| ID | Citation and stable link | Reading status |
| --- | --- | --- |
| S1 | Philippe Beaujard (2019), “Introduction: The Geography of the Indian Ocean and Its Navigation,” *The Worlds of the Indian Ocean*, pp. 9–18. [DOI: 10.1017/9781108341004.002](https://doi.org/10.1017/9781108341004.002) | Relevant chapter passages read directly |
| S2 | Princeton Geniza Project, [document 9690](https://geniza.princeton.edu/en/documents/9690/), T-S 12.392; English translation Marina Rustow and Alan Elbaum | Relevant English translation and catalogue record read; manuscript language not independently translated |
| S3 | Princeton Geniza Project, [document 5417](https://geniza.princeton.edu/en/documents/5417/), JRL Gaster heb. ms 1863/13 + T-S 12.416; English translation Marina Rustow | Relevant English translation and catalogue discussion read |
| S4 | Princeton Geniza Project, [document 26276](https://geniza.princeton.edu/en/documents/26276/), T-S AS 146.89 + T-S NS 99.56 | Editorial English summary read; transcription present; no full English primary translation read |
| S5 | Princeton Geniza Project, [document 9045](https://geniza.princeton.edu/en/documents/9045/), T-S AS 145.2 | Catalogue record read; date conflict unresolved |
| S6 | Conrad Copeland (online 2025; issue 2026), “Riding the monsoon: Geography and Iron Age trade in the Indian Ocean,” *Economic History Review* 79(1):312–341. [DOI: 10.1111/ehr.70016](https://doi.org/10.1111/ehr.70016) | Selected methods and data-availability sections read; replication archive unavailable here |
| S7 | Juan Acevedo, Inês Bénard, Juliane Müller (2024), *Indian Ocean Arab Navigation Studies Towards a Global Perspective: Annotated Bibliography and Research Roadmap*, RUTTER Technical Note 2, v5.1. [DOI: 10.5281/zenodo.10462161](https://doi.org/10.5281/zenodo.10462161); [author upload](https://www.academia.edu/44563503/RUTTER_Technical_Note_Indian_Ocean_Arab_Navigation_Studies_Towards_a_Global_Perspective) | Zenodo metadata and selected author-uploaded discussions of texts/editions read; whole PDF not checked |
| S8 | Wesa Perttola, Emma Slayton, Veronica Walker Vadillo (2024), “The Ship is Laden with Rice and Salt: A Comparison of Two Sailing Models on an Early 17th Century Trade Route Between Java and Sumatra,” *Journal of Maritime Archaeology* 19:427–453. [DOI: 10.1007/s11457-024-09419-1](https://doi.org/10.1007/s11457-024-09419-1) | Selected methods and conclusions read; no reproduction |
| S9 | Roxani Eleni Margariti (2007), *Aden and the Indian Ocean Trade: 150 Years in the Life of a Medieval Arabian Port*, UNC Press. [Institutional publication record](https://nes.princeton.edu/publications/aden-and-indian-ocean-trade-150-years-life-medieval-arabian-port) | Metadata only; requested book passages not read |

## Deliverable boundary

This dossier establishes a justified research direction, a pilot source ledger, exact access requests, and a proposed test structure. It supplies no new validated sailing constants, reconstructed historical wind field, completed model replication, or authority to change game mechanics. The next decisive evidence is the original route-and-calendar wording in Tibbetts, supplemented by medieval Aden-specific context.
