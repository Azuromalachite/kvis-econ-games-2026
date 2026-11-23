# DR08: bounded reproduction of Copeland's first gravity regression
23 November 2026 · Version 1 · Status: **reproduced**, limited to the three baseline entries below

## Result and scope
An independent Python reconstruction matches three reported entries in Table 5, column 1 of Conrad Copeland, “Riding the monsoon: Geography and Iron Age trade in the Indian Ocean,” *Economic History Review* 79 (2026):312–341, DOI [10.1111/ehr.70016](https://doi.org/10.1111/ehr.70016). The article carries a 2025 copyright date; the supplied version gives the 2026 volume citation. Target: printed p.331, Table 5.

| Entry | Published | Reconstructed |
| --- | ---: | ---: |
| Observations | 107 | 107 |
| Log sailing-time coefficient | -0.311 | -0.3106386693086042 |
| Robust standard error | 0.155 | 0.15483756691432352 |

Both numerical estimates match to the published three decimal places. This is a bounded, independently reviewed reimplementation using prepared data. It is not native execution of the author's Stata script, full replication of the article, or reconstruction of the historical inputs. The reported R-squared, Table 5 column 2, and other regressions were not reproduced.

## Exact input and package inspection
User-supplied file: `rtm_replication_pack.zip` (311,845 bytes).
SHA-256: `c76ec21c57741844419b4bf3d4f38e851ddcec07c239880275227a71aeb12ef6`.

| Archive member, under Replication Pack/ | Rows | Columns |
| --- | ---: | ---: |
| gravity_trade_data.dta | 107 | 13 |
| gravity_trade_data_zeros.dta | 946 | 14 |
| trade_analysis_data.dta | 12,517 | 16 |
| trade_analysis_data_third.dta | 13,034 | 16 |
| replication_code.do | — | — |

There are exactly five files, plus a directory entry. The do-file was read in full, not executed. All four datasets were inspected for dimensions, columns and missing values; only the first dataset was fitted.

The archive has no README, licence file, dependency-version pins, raw Periplus coding records, raw wind grids, or GIS route-generation code. The do-file calls `ppmlhdfe`, `reghdfe` and `acreg`; official ppmlhdfe documentation also identifies `ftools` as a dependency. No Stata command was found on the available PATH. Absence of a licence file records a provenance gap; it does not establish that reuse is prohibited.

Prepared sailing times are supplied, so this package cannot by itself rebuild the wind-to-voyage-time calculation. The zero-augmented dataset's 946 rows must not be equated with the published estimation sample of 556; column 2's filtering/separation behavior was not investigated here.

## Reconstruction
The author's baseline is:
`ppmlhdfe good_count ldist_ptime_da same_reg lat_diff $city_fe`.

The port constructs log(hours/24), the same-region indicator, absolute latitude difference, and separate origin/destination city dummies. As in the do-file, sorted category 7 is omitted from each dummy set. The resulting design has rank 50. All 107 outcomes are positive, so this narrow fit avoids zero-outcome separation; the script is not a general replacement for ppmlhdfe.

A NumPy Newton solver maximizes the Poisson pseudo-likelihood with line search. The dependent variable is the number of product varieties in the author's prepared bilateral data, not freight weight, trade value or profit.

The standard-error convention was checked against implementation source, rather than selected only to obtain a numerical match:
- [ppmlhdfe commit b85665d8](https://github.com/sergiocorreia/ppmlhdfe/blob/b85665d8f674e93c1e07446a9a2b29be7f797910/src/ppmlhdfe.mata#L468), line 468, requests `vce_asymptotic`.
- [reghdfe commit 29b2b203](https://github.com/sergiocorreia/reghdfe/blob/29b2b203f534413369d675d0c0f674d61291f536/src/reghdfe5.mata#L2804), lines 2804–2805, applies N/(N-1) to robust covariance in that mode.
- [Official ppmlhdfe help](https://scorreia.com/help/ppmlhdfe.html) identifies robust variance as the default.

The unadjusted sandwich SE is 0.1541123284; applying the source-supported N/(N-1) variance factor gives 0.1548375669. A generic N/(N-rank) adjustment gives 0.2111503682 and is not the convention used for the primary comparison. The author's actual package versions remain unspecified and were not natively verified. Derived variables use float64 here; Stata's default generated-variable storage can differ.

## Checks that ran
1. N and coefficient match the published target within half a unit of its last reported decimal.
2. The source-supported robust SE matches within the same rounding tolerance.
3. Using hours rather than days inside the log leaves the coefficient invariant (difference below 1e-8).
4. Deliberately omitting city effects fails the published-result check: coefficient becomes +0.2583227689. This mutant is a validation exercise, not a competing preferred historical model.

Runtime: Python 3.12.14, NumPy 2.3.5, pandas 3.0.1, Windows 11. No randomness, seed, network download or dependency installation is used by the audit script. No gameplay code was changed or gameplay tests claimed.

A fresh review agent inspected the source specification and reran the checks. Its separate full-category, SVD-based Poisson IRLS implementation obtained coefficient -0.3106386693085448, agreeing within 6e-14, and independently obtained the same robust SE convention numerically. This is machine-assisted independent review, not specialist or human peer review.

## Re-run
Keep the author's original ZIP separately. The [retained analysis](../../models/copeland_dr08.py) is in the same repository commit as this result; its SHA-256 is recorded in result.json. From the repository root, with Python, NumPy and pandas available:
```text
python3 research/03/models/copeland_dr08.py /path/to/rtm_replication_pack.zip --output /path/to/scratch/result.json
```
The [retained result.json](result.json) records the archive/member checksums, audit-script checksum, runtime, fitted diagnostics, source-version provenance and check outcomes. It contains derived results and metadata, not the author's input rows. The repository intentionally excludes the original archive and datasets. The original study input comes from the [author research page](https://www.conradcopeland.com/research/rtm); use the exact checksum above. Runtime/dependency versions of this reconstruction are recorded, but the author's original software versions and raw-input pipeline remain provenance gaps. No gameplay model, RNG pairing, campaign accounting or settlement rules apply to this external-study regression.

## Meaning for Monsoon Navigator and request status
The result supports the reproducibility of this one prepared-data regression. It does not calibrate the game's prices, market depth, vessel capacities, pilot fees or medieval sailing times. The paper's first-century setting remains distinct from the game's medieval composite, and its transport model uses assumptions and later analogues.

DR08's former access blocker is resolved: received, inspected, baseline numerical entries independently reconstructed. The [request queue](../../literature/document-requests.md) now records that change and retains its earlier intake history. DR09's appendices and supplementary ZIP remain outstanding. Neither the archive receipt nor this limited reconstruction upgrades all of the paper's results to reproduced.

