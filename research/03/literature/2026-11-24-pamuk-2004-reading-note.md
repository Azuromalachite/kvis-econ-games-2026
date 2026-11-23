# Pamuk (2004), Prices in the Ottoman Empire: how a long price series is built (reading note)

24 November 2026. [Research index](README.md) · [Current document requests](document-requests.md).

This article was not a document request. The owner supplied it as possible evidence on prices. It is **methodological evidence** about building a price index from institutional accounts. It is **not an Indian Ocean price table**, and its numbers must not be transplanted into game prices. It supplies no game parameter. The text below paraphrases.

**Read after registration.** Read on 2026-11-24, after the depth-and-liquidity protocol (`research/03/pre-registrations/2026-11-23-depth-liquidity.md`) was registered and frozen: read after registration and before any result of it existed. It cannot inform that protocol's tests, and nothing here amends it.

## Record

| Field | Value |
| --- | --- |
| Reference | Şevket Pamuk, "Prices in the Ottoman Empire, 1469–1914", *International Journal of Middle East Studies* 36, no. 3 (August 2004): 451–468. The issue number and month are from the [Cambridge Core article page](https://www.cambridge.org/core/journals/international-journal-of-middle-east-studies/article/prices-in-the-ottoman-empire-14691914/E73150A57D16E1184E2EB33626E1B2E1) (opened 2026-11-24; the working link); the PDF prints only volume, year and pages |
| DOI | **The publisher's DOI, shown but unregistered.** The Cambridge Core page and the PDF's download footer give `10.1017/S0020743804363063`; the PDF's header prints it as `10.1017.S0020743804363063`, with a full stop. On 2026-11-24 it returned 404 at Crossref and at doi.org's handle service, and Crossref searches by title, author and journal (ISSN 0020-7438, 2004) found no record; Crossref holds no issue-3 article records for IJMES 36. Use the Cambridge Core page, not a doi.org link |
| Copy | Owner-supplied PDF from Cambridge Core (`10.1017@S0020743804363063.pdf`), **held privately and not redistributed**: not committed, copied into the repository or uploaded |
| What the file contains | 18 PDF pages, pp. 451–468: the full text, Table 1, Figures 1–5, the endnotes (notes 1–30, pp. 466–468) and the appendix (p. 468) |
| Reading status | **Read in full, 2026-11-24.** The archival collections named in note 1 and Pamuk's *500 Yıllık Fiyatlar* (2000), which holds the series, were not consulted |

## Findings

- **Sources** (452). Prices of standard goods from more than 6,000 account books and price lists, for Istanbul and to a lesser extent other cities. Three food indexes: the pious foundations and their soup kitchens, the Topkapı palace kitchen, and official price ceilings (*narh*). The archival collections are listed in note 1 (466).
- **Standardisation** (452–453). Standard commodities, to limit quality change; eight to ten foods per index; fixed weights within each of five sub-periods before 1860; food at 75–80% of the overall index. The weights are a constructed urban budget, not observed consumer budgets (453).
- **Missing observations** (452–453). Missing years were estimated by a regression algorithm; goods without observations were dropped from a sub-period.
- **Choice of source** (453). Foundation and soup-kitchen prices were preferred because palace and *narh* prices might be administered.
- **Extremes excluded** (454). A price more than 100% above or more than 50% below the previous year's was dropped unless the new level recurred later. Most were document errors; some must have been real prices.
- **Reliability by horizon** (454). Government involvement, institutional buyers and the exclusion rule all damp year-to-year movement, so Pamuk has little confidence in annual fluctuations and much more in medium- and long-term levels.
- **After 1860** (454). Quarterly wholesale prices from the Istanbul commodity exchange are linked to the earlier series.
- **Silver content** (458–459). The index is also expressed in grams of silver, multiplying by the silver content of the currency (silver content in Figure 3; the silver-equivalent index in Figure 4 and Table 1, column 3, per 458); debasement, not silver inflow, is the main long-run cause of price rises (460, 466).
- **Table 1** (455), decennial averages, 1469 = 1.0: the nominal CPI for 1910–14 is 294.2; the silver content is 0.0083 g; the CPI in grams of silver is 2.84. The silver-equivalent decennial averages range 0.85–2.84 (Table 1); Pamuk describes the range as roughly 1.0 to 3.0 (459, 466).
- **Short-run causes** (458). Harvests and wars were the main short-term causes of price movements.
- **Relative prices** (458). Some foods (meat, flour, milk, eggs) and wood rose 400- to 700-fold over the period; olive oil, honey, coffee, onions and manufactures less than 200-fold.
- **Integration** (451, 456, 465). Prices in other Ottoman cities moved with Istanbul's over the medium and long term, which Pamuk attributes to maritime trade.

## The pasted assessment, checked

| Claim (as pasted) | Verdict | Page and wording as found |
| --- | --- | --- |
| More than 6,000 account books and price lists | **Confirmed** | 452 |
| Source types, standardisation, missing observations, silver content | **Confirmed** | 452–454 (sources, standard goods, regression imputation); 458–459 (silver) |
| Table 1, p. 455: nominal CPI 1910–14 = 294.2 against silver-adjusted 2.84 (1469 = 1) | **Confirmed** | 455; decennial averages, the last row a five-year one |
| More reliable for medium and long-run trends than for short-run ones | **Confirmed** | 454 |
| Some extremes excluded | **Confirmed** | 454, with the exact rule above |

## What remains unresolved

- **DOI.** The publisher's DOI is unregistered: 404 at doi.org and Crossref (above).
- **Primary sources.** Note 1 names the collections, but no account book was checked. The annual series are in *500 Yıllık Fiyatlar*, not in the article (note 2).
- **No numerical calibration.** The article is about Istanbul consumer prices, mainly food, with annual observations. It contains no Indian Ocean port prices, no seasonal or monthly movement, nothing on cargo arrivals, and no traded-goods price for the game's ports or goods.

## Bearing on game mechanisms

- **Do not transplant.** None of its numbers, including 294.2, 2.84, the 400–700-fold rises or the 1.3% a year (454, 465), may become a game price, wave amplitude or trend.
- **Annual institutional series cannot calibrate a seasonal wave.** Pamuk's series is annual and deliberately damped (454). A monthly ±8% wave (the game's form; see the [Chaudhuri note](2026-11-24-chaudhuri-ch9-ch10-reading-note.md#bearing-on-game-mechanisms)) can be neither confirmed nor refuted from it.
- **Method, if a game price series is ever built from sources:** state the source type, standardise the good, report imputed values, state any outlier rule, and keep nominal and metal-equivalent prices apart.
- **Per-good behaviour.** The relative-price divergence (458) supports per-good price paths only over centuries, not over the game's 24 months. It belongs, at most, to the unregistered per-good idea in the Chaudhuri note, as context.
