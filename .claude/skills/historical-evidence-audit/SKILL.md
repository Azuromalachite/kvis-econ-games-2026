---
name: historical-evidence-audit
description: Use when adding or challenging historical claims, explanatory text, source-backed game parameters, historical assets or document-derived research in any weekly game. Audits exactly what evidence supports, what was read and what remains uncertain. Not for generic code changes with no historical or evidentiary claim.
---

# Audit historical evidence and model claims

**Scope:** Assess evidence, not gameplay correctness. For changed game rules or release decisions, also apply game-change-review and, when publishing, game-release-validation. A citation does not validate a formula merely because both concern the same period.

## 1. State the claim before gathering evidence

Identify the precise sentence, displayed asset, numerical assumption or research inference being checked. Write its geographic region, historical interval, and strength of wording. Separate:
- **Primary observation:** what a source records, without assuming the record is unbiased or complete.
- **Secondary interpretation:** what a scholar infers from one or more records.
- **Model assumption:** a deliberately chosen game rule or teaching simplification.
- **Calibrated or bounded parameter:** a number justified by identified evidence and a defensible mapping.
- **Unresolved hypothesis:** a proposed mechanism needing additional discriminating evidence.

Do not quietly promote a source description into an observed fact or a plausible mechanism into a historical law.

## 2. Read and record provenance

For each source record: exact identifier (DOI, manuscript shelfmark, inventory/corpus ID or archive accession), title and author/editor, edition/version, precise locator (page, folio, line, table or stable record), original language and script when relevant, translation and translator, historical date versus composition/publication date, and reading status.

Use reading statuses such as **discovered**, **metadata/abstract read**, **relevant passages read**, **full work read**, and **independently verified against original**. Mark unavailable or uninspected full text explicitly. An attribution to a primary source that only unread endnotes would show is unverified. Apply game-change-review's rules on historical sources.

Track independent historical events separately from manuscript fragments, copies, correspondence clusters and later scholarly retellings. Multiple letters about one dispute are not multiple independent disputes. Do not infer a person's identity, a port location or calendar conversion without documenting ambiguity.

## 3. Test the inference

- Ask whether geography, chronology, units, ship/commodity type and institutional setting actually match the game. Record historical dating ranges and unresolved calendar changes.
- Distinguish an **instruction** from a completed act; a dated letter is not necessarily a dated voyage. Distinguish a good's production origin from the port where it was redistributed.
- Distinguish a listed cost from the full business result, a receivable from spendable cash, and a freight exemption from a universal tariff rule. Keep currencies, quantities and weight measures in original units until conversion is justified.
- Look for counterevidence and alternative causal interpretations. Evaluate selection and survival bias before making prevalence or whole-network claims.
- Check rights for source text, images and translations separately from repository source-code licences. Record creator, source and licence (or permission, where no licence applies), as `AGENTS.md` rule 4 asks; do not bundle restricted copies.

**Regression examples:** The 415-dinar copper purchase in Monsoon Navigator's research record (PGP 5457, `research/03/literature/p02-p03-networks-and-economics-initial-review.md` §2), plus its reported charges, does not establish a complete profit estimate. A sea-condition preference in a Geniza letter does not supply a measured Aden–Calicut passage time. Frost & Silver's model GDP trajectory is not an observed Andes-specific data series. These examples illustrate inference boundaries, not universal historical conclusions.

## 4. Deliver only the minimum durable evidence

For each consequential claim, record:
- claim ID/text; source type and exact locator; reading level and translator/edition;
- supported proposition and **permitted wording**;
- temporal/geographical relevance, alternative interpretation, missing evidence, and the source's reading status (section 2);
- mapping to a game rule or exhibit, if any, labelled with one of the claim categories in section 1.

Correct the game's overclaim or mark it unresolved. Keep the authoritative claim record under `research/NN/` (see game-change-review), extending an existing record such as `research/03/literature/` rather than starting a parallel one; put task-specific reasoning in the PR. Do not copy large copyrighted excerpts into the repo. Keep the audit's working material — search transcripts, throwaway extraction scripts, bulk downloads, scratch notes — outside the repository (`AGENTS.md` rule 8); commit only the durable record and, where it guards a rule, the checker. If insufficient evidence exists, report the gap rather than inventing certainty.
