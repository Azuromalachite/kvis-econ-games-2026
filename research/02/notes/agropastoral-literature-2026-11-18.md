# Crop ecology and camelid pastoralism: reading notes

18 November 2026. Evidence for mechanisms and research questions, not a parameter
set for c.1500-1600. Reading depth and locators are recorded in
[sources.yml](../evidence/sources.yml). Partial reads remain `sections_read`;
finding a PDF does not upgrade its status. These notes introduce no new game rules.
See the [current implementation review](implementation-review-2026-11-18.md).

## Crop biology and soils

### Winkel et al. (2009): canopy microclimate

**Sheltered quinoa leaves were warmer during radiative cooling.**
In Table 1's cold-night subset, small-plant leaf temperatures averaged +0.17 C in
heterogeneous Blanca and -0.95 C in more uniform Surumi. This is local sheltering,
not warming of every plant. Tall neighbours reduce the lower leaves' exposure to
the night sky. One site-season and one adjacent plot per cultivar confound
architecture with cultivar; many temperature observations are not independent
replicated plots. No grain-yield benefit was measured. Low-wind modelling is
uncertain, and daytime shading can cost production. Quinoa is not kaniwa.

Possible use: a conditional exposure mechanism, tested separately from intrinsic
frost tolerance. No constant warming or guaranteed diversity bonus follows.
Claim: `claim.research.quinoa_canopy`.

### Condori et al. (2014): genotype and timing

**Resistant monocultures sometimes outperformed the simulated mixtures.**
The field-informed model distinguishes frost tolerance from developmental timing.
Ajanhuiri is frost tolerant without being bitter. Experimental yields used modern
seed and inputs; neither those yields nor introduced Alpha belong in a c.1500
calibration without historical evidence.

Possible use: compare tolerant, early and mixed strategies under varying event
timing. Do not make bitterness or a diversity advantage inevitable.
Claim: `claim.research.potato_genotype_timing`.

### Jacobsen et al. (2005): phenology

**Quinoa frost damage depended on developmental stage and exposure duration.**
Four-hour -4 C exposures reduced seed yield much more at flowering than at the
two-leaf stage. Table 5 implies about 10 percent early-stage loss; the abstract
says 9 percent. Controlled exposures do not reproduce an entire highland season.
Humidity affected survival; this differs from Winkel's question about temperature
gradients within a canopy.

Possible use: distinguish exposure, physiological tolerance and stage. Do not
transfer quinoa responses numerically to kaniwa.
Claim: `claim.research.quinoa_stage`.

### Leceta et al. (2024): terrace soils

**The three Laramate terrace systems did not have identical soil responses.**
Sihuilca was especially favourable, Ayllapampa comparatively neutral, and Santa
Maria showed incipient deterioration. Recovery after abandonment remains uncertain.
Camelid manure is plausible but not demonstrated for these terraces.

Possible use: investigate moisture retention and maintenance rather than assuming
universal soil exhaustion or treating all terraces as identical frost shields.
Claim: `claim.research.laramate_soils`.

### Arce et al. (2019): landscape management

**Commercial production and landrace conservation coexisted in the surveyed landscapes.**
The modern comparison covers 323 households and 1,101 fields. Land access and
communal fallowing distinguish landscapes. The inventory spans one season and
does not establish c.1500 crop boundaries or a covariance matrix for frost losses.

Possible use: compare access to dispersed plots and rotation. Market participation
alone should not automatically erase diversity.
Claim: `claim.research.potato_land_access`.

## Camelids and the puna

### Lane et al. (2022): engineered wetlands

**Bofedal pasture could be enlarged through hydraulic infrastructure.**
The upper Ica study combines structures, cores, pollen and dating to interpret
pre-Hispanic wetland enhancement, including Inca-period investment. This is local
evidence; it does not provide a universal stocking rate or maintenance cost.

Possible use: investigate wet-season versus dry-season forage and pasture upkeep.
Claim: `claim.research.engineered_pasture`.

### Castellaro et al. (2004): dietary overlap

**Llama and alpaca diets differed but overlapped substantially.**
The Parinacota study reports overlap of about 61 percent in summer and 74 percent
in winter. Species and season matter, but mixed herds need not eliminate competition.

Possible use: distinguish wet and dry forage before assigning species benefits.
Claim: `claim.research.camelid_diets`.

### Riek et al. (2019): adult energetics

**Adult llama energetics varied with environmental conditions and movement.**
Measurements at 4,400 m involved seven non-pregnant females. They do not directly
calibrate newborn survival, pregnancy, pack work or sixteenth-century production.

Possible use: investigate forage requirements and body condition alongside cold
adaptation. Claim: `claim.research.llama_energetics`.

### Gomez-Quispe et al. (2022): recruitment vulnerability

**The 2019 alpaca cohort had 22 deaths among 100 crias.**
All deaths occurred within the first six weeks; follow-up ended at twelve weeks.
These were Huacaya alpacas at 4,193 m during January-April, grazing native pasture
and using open corrals at night. Colostrum intake was ensured within two to four
hours. Higher birth weight and remaining apparently healthy were associated with
survival. No necropsies or maternal-condition measurements established a causal
path from cold or nutrition to death.

Illness was classified using information during follow-up, not a predictor known
at birth. Its association cannot be inserted as the effect of preventive care.
Reported 100 percent survival among heavy crias is not a guarantee. Table 1's
categorical birth-weight row has a positive hazard coefficient despite the stated
protective direction; the continuous estimate is negative. Verify coding and raw
data before quantitative use.

Possible use: distinguish herd recruitment from existing adults, with explicit
uncertainty. The observed 22 percent loss is not a historical baseline or a frost
mortality coefficient. Claim: `claim.research.cria_cohort`.

### Valenzuela et al. (2021): protection intervention

**The body-vest group outperformed both comparison groups in the modern trial.**
Among 150 randomly assigned crias, survival was 100 percent with vests, 76 percent
in a semi-open shed and 64 percent in an open corral. The shed-corral difference
was not significant. Historical equipment, general effect size and independent
replication remain to be established.

Possible use: investigate neonatal protection; no automatic generic-shelter bonus.
Claim: `claim.research.cria_protection`.

### Lecoq (1998): transport

**Llama caravans helped provision colonial Potosi.**
The opening historical discussion links animals and caravan workers to supplies.
Only pp. 19-20 were read; payload, timing and income estimates require deeper work.

Possible use: investigate community provisioning versus commercial transport,
including who controls animals and receives returns.
Claim: `claim.research.caravan_supplies`.

### Szpak et al. (2012): manure and inference

**Fertilizer can alter the isotopic baseline used to reconstruct diet.**
The abstract reports maize nitrogen-isotope responses to dung and guano. Only
the abstract was read, despite availability of the complete PDF.

Possible use: investigate nutrient cycling; neither historical application rates
nor a crop-yield bonus follows from these isotope results.
Claim: `claim.research.fertilizer_isotopes`.

## Discriminating questions before implementation

1. Does a proposed strategy change frost exposure, biological tolerance,
   developmental timing, or the correlation of losses among plots? Test each
   mechanism separately before combining them.
2. Can a household meet food needs now without consuming seed or breeding assets
   needed later? Keep food flows distinct from productive stocks.
3. Does labour diversion affect current harvest, upkeep, transport, or recruitment?
   Modern studies motivate these pathways; historical evidence must establish
   which operated in the game's region and period.
4. Can time between sampled historical years be represented honestly? A herd or
   seed stock cannot silently jump decades using one annual transition.

No private teaching slides, article copies, extracted full texts or private file
links accompany these notes. Full bibliographic records are in
[research.bib](../references/research.bib); access routes are in
[ACCESS.md](../references/ACCESS.md).
