# Food access, obligations and recovery: seven-paper review

18 November 2026. Reviewed against main `8e443c5`, including PR #29.
This contribution records evidence and proposed work, with no gameplay changes
or new historical coefficients. The [implementation review](food-access-recovery-gaps-2026-11-18.md)
separates current code observations from possible extensions.

The organising question is whether a shortfall arises from production,
purchasing power, obligations, access to supplies, or the capacity to recover.
These are different mechanisms even when they produce similar food outcomes.
The reviewed studies do not collectively identify their causal contributions
for the game's representative community.

## Reading scope

All seven sources are recorded as `sections_read`; the nine new claims are
`partly_supported`. Full-text availability does not imply a complete read or
verification of every figure. Locators below identify selected passages read;
tables were examined through extracted text, not an independent visual audit.
No supplements, historical account books or raw datasets were reanalysed.

| Work | Passages examined | Public reading route |
|---|---|---|
| Arroyo Abad, Davies and van Zanden 2012 | Author-hosted PDF pp. 4-8, 11 and 14: data, real wages, Maddison discussion and appendix | [18-page PDF](https://gpih.ucdavis.edu/files/ArroyoAbad_et_al.pdf) |
| Zagalsky 2014 | Selected printed pp. 385-388 and 391-392; Tables 5-7 discussion; abstract p. 375 | [Journal PDF](https://chungara.cl/Vols/2014/46-3/04-ZAGALSKY_46%283%29_2014.pdf) |
| Arce et al. 2018 | Methods: sample selection and surveys; Results: procurement and network structure; Discussion: limitations | [Publisher HTML](https://www.frontiersin.org/journals/sustainable-food-systems/articles/10.3389/fsufs.2018.00043/full) |
| Parsa, Ccanto and Rosenheim 2011 | Methods pp. 540-542; selected Results pp. 542-543 and Discussion pp. 543-545 | [Author-hosted PDF](https://rosenheim.faculty.ucdavis.edu/wp-content/uploads/sites/137/2014/09/Parsa-et-al.-2011-Ecol.-Appl.-.pdf) |
| Winterhalder, Larsen and Thomas 1974 | Selected pp. 95-102: methods, results, discussion and Tables II-V | [Author-uploaded PDF](https://www.researchgate.net/profile/Bruce-Winterhalder/publication/227279385_Dung_as_an_Essential_Resource_in_a_Highland_Peruvian_Community/links/0f3175319f121d0c3b000000/Dung-as-an-Essential-Resource-in-a-Highland-Peruvian-Community.pdf) |
| Sillar 2000 | Selected pp. 44, 48-54 and 56-58: husbandry, fertilizer, adoption and conclusion | [Author-uploaded article text](https://www.academia.edu/35728527/Dung_by_Preference_The_Choice_of_Fuel_as_an_Example_of_How_Andean_Pottery_Production_is_Embedded_Within_Wider_Technical_Social_and_Economic_Practices) |
| Barragan Romano 2020 | Introduction, early ore market, selected post-1575 processing discussion, Conclusions and footnote 11 | [Publisher HTML](https://doi.org/10.1017/S0020859019000555) |

## Wages and purchasing power

**Reconstructed purchasing power differs between free miners and mita workers.**
Arroyo Abad et al. distinguish their earnings and construct household welfare
ratios from wages and consumption baskets. Early Potosi prices are sparse;
substituted prices, assumed employment days and household composition matter.
The authors' occupational-risk adjustment is a comparison assumption, not an
observed conversion of income into health or food. Claim:
`claim.research.wage_purchasing_power`.

Use this to ask when earnings might replace foregone farming. It does not
establish actual consumption, a village-wide benefit, or the game's wage
crew coefficient. It also questions the Maddison reconstruction; matching a
GDP benchmark remains calibration rather than confirmation.

## Allocations and their fulfilment

**Official mita allocations were more rigid than tribute reassessments in the cases studied.**
Zagalsky compares official allocations across early colonial Potosi and discusses
selected regional cases. Claim: `claim.research.quota_tribute_paths`.

**Fixed allocations could be fulfilled through labour, money or mixed arrangements.**
The detailed 1610 evidence distinguishes these categories, absence and missing
information. Official allocations are not a count of actual miners. Claim:
`claim.research.quota_fulfilment`.

Use the distinction to investigate how communities financed obligations and
retained labour. The article does not provide a universal commutation rate or
justify transferring 1610 regional proportions to 1575. Its reading does not
resolve the separate access gap for Zagalsky's 2023 book.

## Seed access and recovery

**Seed exchange can support recovery after crop failure, with access differing by cultivar and farmer.**
Arce et al. surveyed 336 households in the modern central Andes. Farmers recalled
stressful and ordinary seasons that differed among respondents; aggregated
networks are not observations of everyone experiencing one simultaneous shock.
Recall, selection and limited replication constrain causal inference. Claim:
`claim.research.seed_network_recovery`.

The analysis motivates separating food inventory from viable planting material
and investigating exchange as a recovery pathway. It supplies neither a colonial
seed-loss percentage nor evidence that all communities recover at the same rate.
Future scenarios should distinguish local failure from failure among potential
suppliers too.

## Spatial arrangement and pests

**Local potato clustering was associated with lower weevil infestation in a rotating landscape.**
Parsa et al. analysed 140 fields during one growing season, distinguishing field
edges, centres and nearby potential weevil sources. The study separates spatial
clustering from repeated potato cultivation at one location. Management scenario
comparisons are fitted-model predictions, not randomized intervention outcomes.
Claim: `claim.research.weevil_spatial_scale`.

Do not infer a universal benefit from monoculture or a universal penalty from
diversification. A proposed game could allow production across elevations while
clustering fields locally and rotating their locations. That is a design
hypothesis; the paper does not quantify its combined weather and pest effects.

## Herd services beyond food

**Herds supplied fuel and fertilizer through their dung.**
Winterhalder et al. combine interviews with 15 families, collection observations,
kitchen tests and chemical analyses. Llama dung production was estimated from
eight animals over two dry-season days. Access to corrals and collection effort
matter alongside total production. Claim: `claim.research.herd_nonfood_services`.

Their pasture calculations describe contemporary practice, not carrying capacity.
The modern mixed-livestock system cannot calibrate precolonial herds. Fuel heat
and edible energy require separate accounts. A future model would need herd
ownership/access, seasonal collection and allocation conventions before treating
these services as a guaranteed benefit from each puna crew.

## Fuel allocation and transition costs

**Returning dung ash to fields recycles some nutrients without restoring all benefits of unburned manure.**
Sillar's ethnographic account describes ash reuse alongside losses of nitrogen
and organic benefits. A binary fuel-versus-fertilizer rule would oversimplify
that pathway. Claim: `claim.research.dung_ash_recycling`.

**Construction downtime and learning risks constrained kiln adoption in Sillar's account.**
The interpretation relates adoption to households' ability to absorb interruptions
and failures. It is not a controlled investment trial. Claim:
`claim.research.adoption_transition_costs`.

These passages motivate resource allocation and transition-cost questions. They
do not supply nutrient recovery coefficients or terrace, raised-field or storage
construction costs. Pottery-specific observations cannot be assigned directly
to those technologies.

## Household participation in mining

**Women participated in ore processing and trade within Potosi's mining economy.**
Barragan Romano documents activities outside underground mining, including food
exchanged for ore. The article spans several centuries; later banking examples
must be kept separate from the sixteenth-century discussion. Footnote 11
explicitly excludes a full treatment of provisioning and care. Claim:
`claim.research.household_mining_work`.

Use it to explain how multiple activities sustained mining, without assigning
gender-specific productivity coefficients. The combined older claim about paid
labour and women's work is now partly supported by direct selected readings;
Gil Montero and Zagalsky (2016) remains recorded as `from_notes`.

## What follows for research and teaching

The questions below are proposed investigations, not additional historical
findings:

1. Under which explicit prices, obligations and access constraints does wage work
   improve food availability compared with farming?
2. Does an obligation remove labour, require cash, induce commodity sales, or
   combine those channels? Whose budget bears each cost?
3. Can a household eat adequately while lacking seed, breeding animals or access
   to suppliers for the next production cycle?
4. Does a strategy spread weather exposure, reduce pest exposure, or preserve a
   productive asset? Those objectives need not select the same allocation.
5. Which construction or adoption decisions require sacrificing current output
   before obtaining later benefits?

Suggested debrief: identify the limiting account and the assumptions behind it,
then test a feasible alternative under a stated weather and institutional setup.
Keep household experiences distinct from a community mean. Do not pre-write a
result in which market participation, dispersion or a particular institution
must always improve or worsen welfare.

The literature and current-code observations can be reviewed now. Numerical
extensions require targeted evidence and explicit units first. Public references
and reading status are in [the bibliography](../references/research.bib),
[access record](../references/ACCESS.md), and [source registry](../evidence/sources.yml).
