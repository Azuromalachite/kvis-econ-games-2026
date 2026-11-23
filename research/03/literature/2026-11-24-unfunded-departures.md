# When cash cannot fund an empty departure

24 November 2026. **Historical evidence review and exploratory model follow-up. No game change or protocol amendment.** This follows the [C6 counterexample](../results/2026-11-24-depth-liquidity-validation/results.md). Frozen predictions remain unscored. These branches were chosen after seeing that counterexample and are not confirmatory tests.

**Recommendation:** distinguish an unfunded action from an insolvent merchant. Examine affordable waiting and alternative departures, then explicitly negotiated finance or authorized asset sales where available. Unpaid sales are not cash. Waiting must itself be affordable and changes the sailing calendar.

## What the evidence supports

These are purposively selected records, not a prevalence sample. Their different places and dates do not directly calibrate an early-fifteenth-century Aden scenario. English translations and catalog information were read; original manuscripts were not independently translated or collated. No source below supplies a universal rule or calibrated game parameter.

| ID and locator | Reading status and supported proposition | Limits |
| --- | --- | --- |
| **UF-H01:** [PGP 1633](https://geniza.princeton.edu/en/documents/1633/), Cambridge T-S 12.227; early eleventh century, middle Egypt. Norman Stillman English translation, recto 28-32 and margins; verso 1-3, 8-9 | Selected translation read. The writer reports borrowing more than 15 dinars, says workers will not process goods without wages, and requests money from his correspondent | Flax/madder labor, not ship's crew. No loan price, maturity or guaranteed access. PGP 4248 is related, not an independent second crisis. English/Hebrew renderings disagree on the remaining dirham amount; it is excluded |
| **UF-H02:** [PGP 9443](https://geniza.princeton.edu/en/documents/9443/), Cambridge T-S AS 156.237 + 156.238; Allan b. Hassun to Arus b. Yosef, Aden/India. Goitein English translation, AS 156.238 verso 4-9; article pp. 461-462 | Selected translation and corresponding article text/notes read. The merchant changes procurement location because Aden pepper is expensive; intermediaries arrange with captains that payment waits until he buys pepper | Freight space, not crew wages. Neither cashlessness nor deferral until resale is established. The letter gives a day/month without a year; no exact year is asserted |
| **UF-H03:** [PGP 34067](https://geniza.princeton.edu/en/documents/34067/), DK353, description and verso context | **Catalog description only; no full English translation supplied.** It reports a complaint that no one will lend to the sender or borrow from him. Proposed identification as Mahruz b. Yaaqov is tentative | 1131/32-c.1150 dates that person's documentary activity, not this letter. Not measured refusal rates or proof of inability to depart. Credit access cannot be presumed |
| **UF-H04:** [PGP 5340](https://geniza.princeton.edu/en/documents/5340/), Bodl. MS heb. d 66/64-65; court session 12 April 1098. Goitein/Friedman English translation, 65r 13-24 and 65v 1-5 | Selected translation read. Testimony mentions an advance concerning pepper and handling a principal's goods; parties dispute authority for those actions | Not a loan secured on an already-issued receivable or permission to sell any partner's property. Same Yosef Lebdi/Yequtiel dispute as related proceedings, not an independent financing event |
| **UF-H05:** [PGP 6292](https://geniza.princeton.edu/en/documents/6292/), BL OR 5566D.6. Goitein, *Letters of Medieval Jewish Traders* (1973), letter 40, pp. 199-201, sections B, C, E | **Translation and selected notes read** in the [scholarly scan](https://princetongenizalab.github.io/goitein-lmjt/40.pdf). Robes are allocated to expenses; an agent is instructed to sell and distribute proceeds; 15 dinars are reserved before further investment | A statement about lacking cash for other shipments concerns a particular allocation, not zero total wealth: section E assigns 100 dinars elsewhere. The editor's probable 1141 date and catalog uncertainty remain distinct. No unfunded departure proved |

UF-H01 distinguishes business assets from cash available to pay labor. UF-H02 establishes negotiable payment timing. Goitein explains the latter arrangement as advice against letting the captain purchase pepper on the merchant's behalf (p. 462, note 66): procurement control is an alternative explanation to liquidity rescue. Neither proves an optimal response to the game's shortfall. Borrowing is a historical option, not an automatically available escape button.

Chaudhuri's chapter 10, p. 210, discusses partnerships, ship/cargo bonds and bills of exchange, while noting uncertainty about initial credit access. See the [existing reading note](2026-11-24-chaudhuri-ch9-ch10-reading-note.md). This does not identify a standard medieval overdraft or justify a fixed rate. A bill payable elsewhere is not necessarily spendable locally now.

## What works in the observed game state

The [branch replay](../models/unfunded-departure-replay.mjs) reconstructs the real-engine decision through preceding transactions: monthIndex 4 (May), Aden, junk/normal, 97 D cash, no cargo, 13,605 D due at 5 (June). Every random draw is 0.99, disabling hazards. No new cargo is bought after the branch point. These are movement/accounting examples, not complete strategies or comparable campaign profits.

| Fixed branch | Lowest pre-credit cash | Endpoint | Cash at endpoint |
| --- | --- | --- | --- |
| Original empty departure to Kilwa in May | -43 D | Kilwa, month 8 (September) | 13,562 D |
| One paid wait, then June passage to Calicut | 27 D | Calicut, month 6 (July) | 13,597 D |
| Wait, retaining Kilwa and avoiding headwinds | 27 D | Kilwa, month 11 (December) | 13,334 D |

One wait costs 70 D: 97 - 70 = 27; receipt of 13,605 then gives 13,632. In June, Calicut is a one-month tailwind passage and Kilwa a headwind passage. Keeping Kilwa under the same wind policy requires five waits in total, then departure in October. **Endpoint balances cannot rank profit:** ports and times differ. Receipt timing and monsoon timing must be considered together; this is not an estimated return to waiting.

Two explicitly synthetic boundary fixtures qualify that finding:

- With 69 D, the 70 D wait is unaffordable and neither permitted empty departure is wage-funded. The replay takes no action; it infers neither rescue nor bankruptcy.
- With 70 D and just 1 D due next month, the first wait leaves 1 D after credit. The next wait costs 61 D and is unaffordable. A larger receipt the following month cannot fund that intervening charge. **Amounts and every payment boundary matter, not just the first receipt date.**

The [JSON record](../results/2026-11-24-depth-liquidity-validation/unfunded-branches.json) contains inputs, conditions, five cases and hashes. Node v24.22.1 was used with the same pinned engine as C6. From a complete checkout containing that commit:

```sh
node research/03/models/unfunded-departure-replay.mjs --output /tmp/monsoon-unfunded.json
```

On Windows, choose an output path in the system temporary directory. Default input retrieval uses `git show`; alternatively pass `--source-dir PATH` for an existing pinned tree. The script checks the engine, loader and baseline harness hashes against the C6 record. No packages are required. No formal hypothesis was added or scored.

## Proposed next model, not an adopted rule

1. **Separate cash, dated receipts and ownership.** A principal's goods or an unpaid customer's balance cannot be spent without the relevant arrangement.
2. **Check funding before buying and departing.** Cover known charges when due, including full voyage wages where charged upfront. Keep reserves for uncertain outlays separate; deterministic funding does not guarantee survival under hazards.
3. **Reconsider feasible actions.** Buy less where sufficient; otherwise examine another funded lane or an affordable sequence of waits reaching sufficient receipts. Recompute routes/prices as time advances. This changes the frozen quantity-only policy and needs an explicit new protocol.
4. **Specify finance separately.** Loans, partner remittances, advances, renegotiated due dates and receivable sales require counterparties, access, amounts, costs, timing and settlement. These mechanisms are not interchangeable. No universal price was found.
5. **Record a liquidity obstruction if no funded continuation exists.** Retain cash, debts, assets, receipts, time and reason. Do not assume bankruptcy, free funds or forfeited receivables. Credit, default and liquidation each need accounting rules.

At 97 D, a paid wait followed by a fresh route decision is feasible. At 69 D, current permitted actions offer no funded continuation. Additional finance, changed payment terms or an explicit stopping state must be specified. That distinction is the next bounded research target.

## Editions, access and review status

- Norman A. Stillman, **"A Case of Labor Problems in Medieval Egypt,"** *International Journal of Middle East Studies* 5(2), 1974, 194-201, [DOI 10.1017/S0020743800027823](https://doi.org/10.1017/S0020743800027823). Publisher metadata/extract and PGP English translation read; full article commentary not accessed at Cambridge/JSTOR. Optional follow-up, not a blocker to the bounded claim.
- S. D. Goitein, **"Portrait of a Medieval India Trader: Three Letters from the Cairo Geniza,"** *BSOAS* 50(3), 1987, 449-464, [DOI 10.1017/S0041977X00039458](https://doi.org/10.1017/S0041977X00039458). Edition verified at Cambridge; selected pp. 461-462 and notes read in this [scholarly upload](https://www.academia.edu/42944626/S_D_Goitein_Portrait_of_a_Medieval_India_Trader_Three_Letters_from_the_Cairo_Geniza_Bulletin_of_the_School_of_Oriental_and_African_Studies_vol_50_no_3_1987_449_464).
- PGP 6292's English translation is accessible in Goitein (1973), letter 40, pp. 197-201; no document request is needed. PGP 34067 remains catalog-level here. Chaudhuri's missing chapter endnotes remain in the [request queue](document-requests.md). No early-fifteenth-century Aden loan price, credit-access probability or evidence for routine receivable discounting was established.
- A second agent reported successfully rerunning all five bounded cases with Node v24.22.1, without numerical discrepancy. Its historical review did not finish because of a service usage limit. **Independent historical review remains pending.** This is a research proposal, not clearance to change gameplay or score frozen predictions.
