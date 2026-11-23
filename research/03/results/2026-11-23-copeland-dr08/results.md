# DR08: bounded reproduction of Copeland's first gravity regression
23 November 2026 · Version 2 · Status: **Reproduced — bounded, independently machine-checked**, limited to the three baseline entries below

| | |
| --- | --- |
| Protocol | [Protocol](#protocol) below. Unregistered reproduction of a previously published result; no pre-registration file |
| Run | 2026-11-23. Analysis script: each invocation runs three fits; the retained `result.json` is from one invocation, and earlier development runs were not logged. Independent check: run on the archive once for the record, plus two deliberately broken copies to show it can fail. Details in [Verification](#verification-23-november-2026) |
| Code | [`research/03/models/copeland_dr08.py`](../../models/copeland_dr08.py) (analysis); [`research/03/models/copeland_dr08_check.py`](../../models/copeland_dr08_check.py) (independent check, shares no code with the analysis) |
| Input | Public replication archive, SHA-256 `c76ec21c57741844419b4bf3d4f38e851ddcec07c239880275227a71aeb12ef6`; not in this repository |
| Records | [`result.json`](result.json) (analysis output); [`check.json`](check.json) (check output) |

## Result and scope
An independent Python reconstruction matches three reported entries in Table 5, column 1 of Conrad Copeland, “Riding the monsoon: Geography and Iron Age trade in the Indian Ocean,” *Economic History Review* 79(1) (2026):312–341, first published online 22 April 2025, DOI [10.1111/ehr.70016](https://doi.org/10.1111/ehr.70016). Target: printed p. 331, Table 5.

| Entry | Published | Reconstructed |
| --- | ---: | ---: |
| Observations | 107 | 107 |
| Log sailing-time coefficient | -0.311 | -0.3106386693086042 |
| Robust standard error | 0.155 | 0.15483756691432352 |

Both numerical estimates match to the published three decimal places. The published values were checked by the PR's author against the paper (p. 331). On 23 November 2026 the AI agent that fixed this PR after review also read Table 5 on Wiley's open-access full-text HTML page for the DOI: column 1 shows ln(SailDist) −0.311 (0.155), City FE, N 107 and R² 0.441, as above. That HTML page has no print page numbers, so the p. 331 locator itself rests on the author's check. This comparison has a single source. A second reviewer could not reach Wiley's page because of a bot wall, so −0.311 (0.155), N 107 and R² 0.441 rest on one reading.

This is a bounded reimplementation using prepared data, checked by an independent machine re-fit. It is not human specialist review, not native execution of the author's Stata script, and not a full replication of the article or a reconstruction of the historical inputs. The reported R² (0.441), Table 5 column 2 and the other regressions were not reproduced.

## Protocol
**Unregistered reproduction of a previously published result. This is not a preregistered confirmatory experiment; matching the published numbers is an expected target known before reconstruction, not a blind validation.** This section was written on 23 November 2026, after the reconstruction had run. It records what was done; it does not claim the plan was fixed in advance, except where a date says so.

- **Target, known in advance.** Table 5 column 1: N = 107, coefficient −0.311, robust SE 0.155. Both the analysis author and the checker knew these values before writing code.
- **Model.** The do-file's baseline, `ppmlhdfe good_count ldist_ptime_da same_reg lat_diff $city_fe`. That means a Poisson pseudo-likelihood with a constant, log sailing time in days, a same-region indicator, absolute latitude difference, and separate origin and destination city dummies with the 7th category of each set dropped, as the do-file drops them. The design has 107 rows and 50 columns of full rank.
- **Input checksums.** Archive SHA-256 `c76ec21c…2ef6` (in full above); member checksums are in `result.json`. Only `gravity_trade_data.dta` is fitted.
- **Methods.** Analysis: a Newton solver with line search. Check: IRLS with each weighted step solved by `numpy.linalg.lstsq` (SVD), written separately. Both compute three robust standard errors: HC0; HC1 = HC0·√(N/(N−K)); and HC0·√(N/(N−1)), the reghdfe/ppmlhdfe robust convention. The primary comparison uses the N/(N−1) variant.
- **When the convention was fixed.** The analysis author's record shows that the N/(N−1) convention was chosen from the ppmlhdfe and reghdfe source cited below. It does not show whether that choice came before or after HC0 and HC1 had been seen against the target. HC0 and HC1 are therefore reported next to it in every run. For the independent check, the HC0×√(N/(N−1)) convention was taken from the analysis author's reading of the ppmlhdfe/reghdfe source. It was specified in the brief for the check before the check was written.
- **Numerical acceptance tolerances.** Against the published values, N must match exactly and the coefficient and SE must be within 0.0005, half a unit of the last printed decimal. Against the analysis output, the check requires N = 107, coefficient −0.310639 ± 5×10⁻⁷ and SE 0.154838 ± 5×10⁻⁷. The omitted-city-effects mutant must give +0.2583 ± 5×10⁻⁵ and must fail the published-value check.
- **Reviewer procedure.** A reviewer who did not write the analysis script writes a separate check that does not import it. The reviewer runs the check on the public archive, records the environment and both checksums, and reruns the analysis script to compare its output with the committed `result.json`.
- **Exclusions.** No native Stata, no R², no column 2 or other regressions, no zero-outcome data or separation handling, no raw wind or GIS reconstruction, and no game calibration.

## Exact input and package inspection
Input: `rtm_replication_pack.zip` (311,845 bytes), the public replication archive linked from the [author's research page](https://www.conradcopeland.com/research/rtm) (Google Drive file id `1g191sqck9rvoazF6AmwgmiWqAlFNA2NR`). The user supplied the copy used for the analysis. A copy downloaded from the public link has the same SHA-256:
`c76ec21c57741844419b4bf3d4f38e851ddcec07c239880275227a71aeb12ef6`.

| Archive member, under Replication Pack/ | Rows | Columns |
| --- | ---: | ---: |
| gravity_trade_data.dta | 107 | 13 |
| gravity_trade_data_zeros.dta | 946 | 14 |
| trade_analysis_data.dta | 12,517 | 16 |
| trade_analysis_data_third.dta | 13,034 | 16 |
| replication_code.do | — | — |

There are exactly five files, plus a directory entry. The do-file was read in full, not executed. All four datasets were inspected for dimensions, columns and missing values; only the first dataset was fitted.

The archive has no README, licence file, dependency-version pins, raw Periplus coding records, raw wind grids, or GIS route-generation code. The do-file calls `ppmlhdfe`, `reghdfe` and `acreg`; official ppmlhdfe documentation also identifies `ftools` as a dependency. No Stata command was found on the available PATH. The article's data-availability statement says only that data and replication files are available from the author's webpage. A missing licence is a provenance gap; it does not establish that reuse is prohibited.

Prepared sailing times are supplied, so this package cannot by itself rebuild the wind-to-voyage-time calculation. The zero-augmented dataset's 946 rows must not be equated with the published estimation sample of 556; column 2's filtering/separation behavior was not investigated here.

## Rights and what is kept here
- The 50 coefficients, their standard errors and the fit diagnostics in `result.json` and `check.json` are independently computed derived outputs of our scripts. No input rows are included.
- The article is CC BY 4.0 (the licence on its version of record, registered with Crossref).
- The replication archive is publicly linked but carries no licence. None was found in the archive or on the author's page.
- The repository licence does not grant any permission to redistribute the original data. The original data are not included in this repository; obtain the archive from the author's page and check its SHA-256.

## Reconstruction
The author's baseline is:
`ppmlhdfe good_count ldist_ptime_da same_reg lat_diff $city_fe`.

The port constructs log(hours/24), the same-region indicator, absolute latitude difference, and separate origin/destination city dummies. As in the do-file, sorted category 7 is omitted from each dummy set. The resulting design has rank 50. All 107 outcomes are positive, so this narrow fit avoids zero-outcome separation; the script is not a general replacement for ppmlhdfe.

A NumPy Newton solver maximizes the Poisson pseudo-likelihood with line search. The dependent variable is the number of product varieties in the author's prepared bilateral data, not freight weight, trade value or profit.

The standard-error convention was checked against implementation source:
- [ppmlhdfe commit b85665d8](https://github.com/sergiocorreia/ppmlhdfe/blob/b85665d8f674e93c1e07446a9a2b29be7f797910/src/ppmlhdfe.mata#L468), line 468, requests `vce_asymptotic`.
- [reghdfe commit 29b2b203](https://github.com/sergiocorreia/reghdfe/blob/29b2b203f534413369d675d0c0f674d61291f536/src/reghdfe5.mata#L2804), lines 2804–2805, applies N/(N-1) to robust covariance in that mode.
- [Official ppmlhdfe help](https://scorreia.com/help/ppmlhdfe.html) identifies robust variance as the default.

The unadjusted sandwich SE (HC0) is 0.1541123284; applying the source-supported N/(N-1) variance factor gives 0.1548375669. A generic N/(N-rank) adjustment (HC1) gives 0.2111503682 and is not the convention used for the primary comparison. The author's actual package versions remain unspecified and were not natively verified. Derived variables use float64 here; Stata's default generated-variable storage can differ.

## Checks that ran
1. N and coefficient match the published target within half a unit of its last reported decimal.
2. The source-supported robust SE matches within the same rounding tolerance.
3. Using hours rather than days inside the log leaves the coefficient unchanged (difference below 1e-8). This is a sanity identity, not evidence: log(hours) = log(days) + log 24, and the constant absorbs the shift. It confirms only that the code has a constant and the expected units.
4. Deliberately omitting city effects fails the published-result check: the coefficient becomes +0.2583227689. This mutant is a validation exercise, not a competing preferred historical model.

No randomness, seed, network download or dependency installation is used by either script. No gameplay code was changed or gameplay tests claimed.

## Verification, 23 November 2026
**Independent machine check.**
- **Who ran it.** An AI agent, not a human specialist. It did not write the original analysis script. It is, however, the same agent that fixed this PR after review: it edited `copeland_dr08.py` (the `rights` block and LF output) and wrote this protocol and verification text. Before writing the check it had read the analysis script, and it took its targets (−0.310639, 0.154838, +0.2583) from that script's output. The check's code is independent: it was written without importing, calling or copying `copeland_dr08.py`. Its targets and its reading of the do-file were shared with the analysis, not derived separately.
- **Environment.** Python 3.14.10, NumPy 2.3.5, pandas 3.0.1, Windows 11 (10.0.26300).
- **Archive SHA-256.** `c76ec21c57741844419b4bf3d4f38e851ddcec07c239880275227a71aeb12ef6`, the copy downloaded from the public link.
- **Check script SHA-256.** `041ae44ca8238e4f69e81b151977bc9bdbd43d730e0b8aedffac7a4bf5723aaf`.
- **Observed numbers.** N = 107, 50 columns, rank 50, IRLS converged in 6 iterations, max |score| 1.8×10⁻¹¹.

  | Quantity | Observed |
  | --- | ---: |
  | Coefficient | −0.31063866930860723 |
  | SE, N/(N−1) convention | 0.1548375669142892 |
  | SE, HC0 | 0.15411232842184017 |
  | SE, HC1 | 0.21115036820309804 |
  | Omitted-city-effects coefficient | +0.2583227688891021 |
- **Tolerance.** Coefficient and SE within ±5×10⁻⁷ of −0.310639 and 0.154838; mutant within ±5×10⁻⁵ of +0.2583; published values within 0.0005; N exact.
- **Outcome.** All eight checks passed, recorded in [`check.json`](check.json). The coefficient agrees with the analysis output to about 3×10⁻¹⁵ and the N/(N−1) SE to about 3×10⁻¹⁴.
- **The check can fail.** Two deliberately broken copies were run and both failed. Swapping the N/(N−1) factor for N/(N−K) failed both SE checks. Zeroing `same_reg` made the design rank-deficient, and the check stopped.

**Rerun of the PR's own script.** An earlier adversarial review agent reported rerunning `copeland_dr08.py` (529619dd) on the public archive, with all fields matching except `runtime.python`. That record is in the PR review, not in the repository. On 23 November the checking agent repeated the rerun in the environment above, and that rerun supersedes the earlier report. Every value was identical except the `runtime.python` string.

**Changes to the analysis script after the rerun.** The script was then changed in two ways only. It now writes a `rights` block into `result.json`, and it writes LF line endings on every platform (on Windows it had written CRLF). Its SHA-256 is now `0b70457912323161446943838262be90b5378c34cb7026c4eaa5dd00975d1ee3`. The retained `result.json` was regenerated with it in the environment above. Compared with the previous file, only `rights`, `script_sha256` and `runtime.python` differ; every number is bit-identical. The earlier run, under Python 3.12.14, NumPy 2.3.5 and pandas 3.0.1, gave the same numbers.

**Limits of this verification.** This is not human specialist review, not native Stata, and not the full study. Both implementations share the reconstruction of the model from the do-file, so an error in reading the do-file would affect both.

An earlier review agent also refitted the full-category design with its own SVD-based IRLS. It obtained −0.3106386693085448 and the same SE convention numerically. That code is not retained.

## Re-run
Obtain the archive from the [author research page](https://www.conradcopeland.com/research/rtm) and check the SHA-256 above. From the repository root, with Python 3, NumPy and pandas:
```text
python -I research/03/models/copeland_dr08.py /path/to/rtm_replication_pack.zip --output /path/to/scratch/result.json
python -I research/03/models/copeland_dr08_check.py /path/to/rtm_replication_pack.zip --output /path/to/scratch/check.json
```
Each exits non-zero if a check fails. The [retained result.json](result.json) records the archive/member checksums, analysis-script checksum, runtime, fitted diagnostics, source-version provenance, rights statement and check outcomes. The repository intentionally excludes the original archive and datasets. The author's original software versions and raw-input pipeline remain provenance gaps. No gameplay model, RNG pairing, campaign accounting or settlement rules apply to this external-study regression.

## Meaning for Monsoon Navigator and request status
The result supports the reproducibility of this one prepared-data regression. It does not calibrate the game's prices, market depth, vessel capacities, pilot fees or medieval sailing times. The paper's first-century setting remains distinct from the game's medieval composite, and its transport model uses assumptions and later analogues.

DR08's former access blocker is resolved: the public archive was obtained and inspected, and the baseline numerical entries were independently reconstructed and machine-checked. The [request queue](../../literature/document-requests.md) now records that change and retains its earlier intake history. DR09's appendices and supplementary ZIP remain outstanding. Neither the archive receipt nor this limited reconstruction upgrades all of the paper's results to reproduced.
