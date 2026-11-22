# Climate, weather and food access: evidence review

18 November 2026. Reviewed against main `8e443c5` (PR #29). This is an
evidence and design contribution. It supplies no historical weather series,
new probabilities, loss coefficients or gameplay changes. It complements the
crop and camelid review in [PR #23](https://github.com/Azuromalachite/frost-and-silver-game/pull/23).

The useful research question is how weather, exposure, management and access
to food jointly shape outcomes. A larger absolute frost loss under colonial
rules is a hypothesis to test, not a result established by these readings.
See the [debrief proposal](https://github.com/Azuromalachite/frost-and-silver-game/blob/d64a632eaa78e2bc33f9cc4fd1726266f68ac246/docs/weather-debrief-proposal-2026-11-18.md).

## Reading and access record

All entries below are `sections_read` in the registry, with bounded claims at
`partly_supported`. Having a complete article available is distinct from a
complete read. Supplied papers were read through their methods, results and
discussion; extracted tables and figure captions were examined. Independent
visual verification of every figure and supplementary-material review are not
claimed. No article copies or private links accompany these notes.

| Work | Sections examined | Access finding |
|---|---|---|
| Saavedra and Takahashi 2017 | Main text, printed pp. 58-69; Tables 1-4; figure captions 2-12 | Supplied 13-page PDF resolves earlier publisher/repository barrier |
| Sae-Lim et al. 2025 | Main text pp. 1-11; Table 2; figure captions 2-5 | Supplied 12-page PDF resolves earlier publisher barrier; supplements not read |
| Pouteau et al. 2011 | Methods 2.2-2.3; Results 3.1-3.2; Discussion 4.1-4.2 | Author-uploaded article text on ResearchGate |
| Garcia et al. 2007 | Methods 2; Results 3; Discussion 4, especially Tables 1, 2 and 5 | Article text on Academia.edu; numerical table transcription needs the original PDF |
| Canedo-Rosso et al. 2021 | Data 2; selected Methods 3; Results 4; Discussion 5 | Open publisher HTML |
| Cruz et al. 2024 | Methods 2; selected Results 3; Discussion 4.1; Conclusions 5 | Open publisher HTML |
| Jonaitis et al. 2021 | PDF pp. 4-10 and 13; Methods 3, selected Results 4, Discussion 5, Conclusions 6 | Author-institution PDF |
| Bird et al. 2011 | Study Site, selected Results and Discussion, Methods, Summary | Open PMC HTML |
| FAO frost protection, volume 1 | Chapters 1 and 3; Chapter 7, Heaters and Smoke effects | Open official HTML |
| FAO frost protection, volume 2 | Chapter 2, Introduction and Risk | Open official HTML |
| Wernke and Whitmore 2009 | Selected pp. 428-437, especially model exclusions and results on pp. 432-437 | Author-hosted PDF; reading advances beyond the earlier abstract |

## Findings from the supplied papers

### Saavedra and Takahashi: seasonal exposure and correlated physical controls

**Clouds, humidity and soil moisture influence minimum temperature together.**
The study combines observations at Huancayo in 1973-2006, four selected damaging
growing-season events, a three-night July 2010 campaign, and heat-transfer models.
It is a modern Mantaro Valley site, not a regional sixteenth-century reconstruction.
Claim: `claim.climate.frost_controls`.

Frequent winter freezing differs from rarer growing-season frost, when susceptible
crops are present. Clear nights had lower minimum air temperature than overcast
nights. Recent rainfall was associated with less cooling, but rain, humidity and
cloud cover covary: the observational differences are not a randomized irrigation
effect. The models help distinguish mechanisms without establishing historical
farm-level effect sizes.

Four selected crop-damaging events had station minimum temperatures from about
-0.3 to +1.4 C. Near-ground exposure can differ from a thermometer at two metres;
the campaign also found strong shallow inversions. A weather-station threshold,
leaf temperature, tissue injury and yield loss therefore require separate definitions.

The soil model's response to moisture was nonlinear: the simulated warming from
increasing very dry soil moisture was greater than from an equivalent increase in
already wet soil. A universal protection bonus would hide that dependency. The
campaign was short, used grass-covered ground, and lacked continuous measurement
of all relevant fluxes. The paper reports uncertainty from cloud liquid water and
model structure, including a cold bias. Crop-specific injury was not calibrated.

Possible use: separate growing-season frost from post-harvest winter processing;
represent shared atmospheric conditions and local moisture/exposure. Do not simply
multiply an independent drought loss by an independent frost loss and call the
combination empirically calibrated. Conversely, correlated drivers do not mean
their effects must be counted twice.

Public record: [DOI](https://doi.org/10.1016/j.agrformet.2017.02.019).

### Sae-Lim et al.: a regional circulation proxy is not local annual weather

**Plant-wax proxies distinguish regional circulation from local moisture stress.**
The study analyses a 35 cm sediment core from Lake Chacacocha, at 4860 m, with
hydrogen and carbon isotopes from several plant-wax chain lengths. Source
attribution distinguishes upland vegetation from wetland plants, supported by
local soil and peat comparisons. These are environmental proxies, not crop
calories or observations of individual frosts. Claim: `claim.climate.proxy_scales`.

Long-chain hydrogen isotopes are interpreted mainly through precipitation isotope
composition and upstream monsoon rainout. Mid-chain carbon isotopes and differences
between wax sources inform local water stress and evaporative conditions. These
interpretations depend on vegetation sources, physiological responses and hydrology;
they do not directly measure rainfall minus evaporation in physical units.

Table 2 gives a sample resolution of 11-40 years, averaging 25 years. The authors
propagate measurement and age-model uncertainty through 4000 realizations, then
resample onto an annual grid. Interpolation does not create annual observations.
The record cannot identify weather for the game's 1592 or 1600 harvest, their
sequence, or the frequency of two consecutive failed harvests.

The detailed later dry interval is approximately 1640-1850, mostly after the game;
the conclusion uses a coarser 1600-1800 description. Do not treat that rounding as
an independently dated drought onset in 1600. Strong regional monsoon circulation
coexisted with local moisture stress. Proposed explanations include evaporation,
meltwater supply and cold-limited access to water; their relative roles remain
uncertain. An isotope-derived dry interval is not automatically a hot drought.

Possible use: frame historical uncertainty and distinguish regional climate from
local conditions. Do not turn this record into harvest-specific event cards.
The paper identifies [NOAA study 41202](https://www.ncei.noaa.gov/access/paleo-search/study/41202)
as its data archive; those raw data and supplements were not reanalysed here.

Public record: [DOI](https://doi.org/10.1016/j.epsl.2025.119407).

## Supporting readings and their limits

### Pouteau et al. 2011: regional gradients and local terrain

**Regional elevation effects coexist with local terrain effects on frost occurrence.**
MODIS temperature and terrain models distinguish broad elevation patterns from
local drainage and exposure. Their six-year record was more useful for occurrence
at 0 C than rarer severe events. Fine-scale validation partly aggregates predictions
back to satellite resolution; independent field validation remains limited.
Different marginal risks do not supply simultaneous plot-loss covariance or crop
damage functions. Claim: `claim.climate.topoclimate`.

**For the game (our inference, not the paper's):** the drainage and exposure
effects it reports, at about 1 km, suggest that cold air draining downhill can
freeze a lower field while a higher one stays clear, which the game's rule
(frost always strikes from the top down, `claim.game.frost_from_top`) rules out.
The rule stays a labelled simplification, because the paper gives frost
occurrence, not the joint crop losses by height that diversification would need.
[DOI](https://doi.org/10.1016/j.rse.2010.08.011).

### Garcia et al. 2007: timing and water availability

**Rainfall onset, dry spells and growing-season length interact.**
Four stations with multi-decade records show important geographic and seasonal
differences. The paper's frost-free period allows a daily frost probability up to
50 percent, rather than guaranteeing no freezing. Tables in the HTML transcription
can lose minus signs; numerical calibration requires the original table images.
Modern station probabilities are not colonial parameters.
Claim: `claim.climate.season_timing`.
[DOI](https://doi.org/10.1016/j.jaridenv.2007.02.005).

### Canedo-Rosso et al. 2021: drought indicators and local effects

**Area averages can conceal local drought impacts.**
Satellite and gridded products for 1981-2015 are checked against uneven station
coverage. Severe drought often coincides with El Nino, with exceptions. Vegetation
indices represent agricultural conditions, not measured household consumption.
Spatial and seasonal product errors constrain inference; neither vegetation-index
units nor reported economic losses translate directly into calories.
Claim: `claim.climate.drought_heterogeneity`.
[DOI](https://doi.org/10.5194/nhess-21-995-2021).

### Cruz et al. 2024: adaptation and complementarity

**Ancient field placement and management addressed local climatic constraints.**
Archaeological mapping, field surveys and ethnographic comparison in Carangas and
Intersalar identify slope-based cultivation, water-conserving practices and
agropastoral complementarity. Broadly comparable environments supported different
landscapes and social arrangements. Modern observations help interpret past
practice; this is not an experiment isolating institutional effects or a calibrated
mita-by-frost interaction. Claim: `claim.climate.agricultural_adaptation`.
[DOI](https://doi.org/10.3390/land13050619).

### Jonaitis et al. 2021: a corrective ENSO comparison

**ENSO rainfall relationships differ across southern Peru and Bolivia.**
The analysis uses 75 stations, at least 90 percent record completeness, and
1972-2016 observations. Five station groups show differing responses. Some eastern
contrasts have opposite signs but are not statistically significant; they cannot
justify deterministic reversed rules. Group averages also do not yield a joint
distribution of field-scale crop losses. Claim: `claim.climate.enso_geography`.
[DOI](https://doi.org/10.1002/joc.7058).

### Bird et al. 2011: monsoon history

**The Pumacocha record constrains broad monsoon history.**
Varves, radiometric dates and calcite isotopes underpin the reconstruction. Its
stronger monsoon interval spans much of the game's period, but regional isotope
signals do not uniquely specify local rainfall, plant water stress or frost.
Seasonal weighting, age uncertainty and site differences limit historical mapping.
Claim: `claim.climate.monsoon_history`.
[DOI](https://doi.org/10.1073/pnas.1003719108).

### FAO 2005: physics and economic decisions

**Freezing conditions, crop injury and protection mechanisms are distinct.**
Volume 1 distinguishes frost definitions and heat-transfer mechanisms. Its active
protection chapter attributes fire protection mainly to heat, with little benefit
from smoke itself. A historically reported practice does not establish its
efficacy. Claim: `claim.climate.frost_definitions`.
[Volume 1](https://www.fao.org/4/y7223e/y7223e00.htm).

**Protection decisions depend on uncertain benefits and costs.**
Volume 2 evaluates alternatives across stochastic weather outcomes. This supports
comparing decisions over multiple scenarios, with downside outcomes as well as
averages. Its modern technologies, prices and financial framework are not Andean
historical parameters. Claim: `claim.climate.protection_economics`.
[Volume 2](https://www.fao.org/4/y7231e/y7231e00.htm).

### Wernke and Whitmore 2009: production sufficiency is not observed starvation

**Own-farm production shortfalls do not establish observed starvation.**
The Colca Valley reconstruction estimates production relative to household needs.
Its authors explicitly exclude tribute effects from that calculation and cannot
fully quantify herding, trade and food sharing. Shortfalls identify dependence on
other food sources or possible nutritional risk, not measured consumption or a
direct mortality coefficient. It supports asking about access and distribution,
while leaving weather-by-institution effects to be tested.
Claim: `claim.climate.food_access_limits`.
[DOI](https://doi.org/10.1007/s10745-009-9261-2).

## Evidence boundaries for the game

These papers motivate separating regional weather, local exposure, biological
damage and food access. They do not jointly establish a calibrated causal chain
for a community in the Potosi mita catchment. The debrief must allow outcomes
to contradict expectations: weather may change absolute losses, relative losses,
strategy rankings or hunger by different amounts.

Before quantitative ecological changes, specify a basin or acknowledge a composite
setting. Priorities are simultaneous losses across plots, historically feasible
response costs, crop and processing calendars, food-storage access, and the effects
of labour obligations. Fine-scale temperature maps alone do not resolve that list.

Garcilaso's historical frost-protection account is mentioned by Saavedra and
Takahashi, but the primary passage was not independently verified in this review.
It remains a lead, not evidence for a quantified protection effect.
