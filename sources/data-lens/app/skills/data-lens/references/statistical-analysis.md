# Statistical analysis for Data Lens

Use this guide for a statistical question about a chat file. Run Python on your own host and publish a derived CSV
through the workflow in [SKILL.md](../SKILL.md); no statistical engine or write permission is added to Lens.
Adapted from K-Dense's statistical-analysis skill; see [attribution and MIT licence](K-Dense-NOTICE.md).
Its helper scripts and other scientific skills are not bundled with Lens.

## Frame the question and design

Specify the target effect, outcome, units, comparison direction, observational unit, pairing/clustering and planned
contrasts. Keep planned inference distinct from exploration. Inspect group sizes, missingness, distributions and
outlier influence first. State how missing values are handled and report the observations actually analysed.

| Question and design | Method to consider | What to check and report |
|---|---|---|
| Two independent continuous means | Prespecified Welch t-test | Independence from the design, group n/mean/SD, mean difference and CI, statistic/df/p |
| Paired continuous means | Paired t-test on aligned within-unit differences | Correct pairing, distribution of differences, n pairs, difference and CI |
| More than two independent means | Welch ANOVA, or ordinary ANOVA with justified equal variance | Planned contrasts, dependence, variance/shape and multiplicity; appropriate post-hoc procedure |
| Rank/distribution contrast | Mann–Whitney, Kruskal–Wallis or paired Wilcoxon as appropriate | The target is not automatically a median difference; rank tests still have design/shape assumptions |
| Relationship between measurements | Pearson for linear or Spearman for monotone association; regression for an outcome model | Shape, outliers, dependence and residual diagnostics; association is not causation |
| Categorical counts | Contingency-table method appropriate to the design and cell counts | Actual counts, independent units, sparse cells, effect estimate and uncertainty |

Repeated/clustered observations need a model of their dependence; a larger row count does not make an independent
test valid. Do not automatically switch methods because a normality or variance test crosses a p-value threshold.
A non-significant diagnostic does not establish that an assumption holds. For paired tests inspect differences;
for regression inspect residuals. Document sensitivity analyses rather than trying alternatives until significant.

## Compute and report

Use appropriate installed Python libraries, such as SciPy for tests or statsmodels for regression. Verify the API
of the installed version, state the alternative and variance choice explicitly, and keep a runnable script.
If a required library is unavailable, state that limitation; do not fabricate statistics or silently substitute
a different method. No scientific package or upstream helper is supplied by this App.

Report sample sizes, descriptive summaries, the named method, effect estimate in meaningful units, uncertainty
interval and level, test statistic/df and p-value where applicable. State effect direction and the order of groups.
For a family of comparisons, define the family and correction (for example Holm or Benjamini–Hochberg) and label
raw versus adjusted p-values. Retain non-significant planned results. A non-significant result is not proof of no
effect, and statistical significance is not practical importance.

For sample-size planning, specify the smallest relevant effect and design assumptions. Do not interpret post-hoc
observed power as evidence about a completed study. If Bayesian analysis is actually requested, state the model
and priors, inspect convergence and prior sensitivity, and distinguish credible intervals from confidence
intervals; a posterior probability is not automatically a Bayes factor.

## Publish the calculated result

Write a new CSV with rows for the planned contrasts and columns such as `comparison`, `n_a`, `n_b`, `estimate`,
`ci_low`, `ci_high`, `p_value`, `p_adjusted` and `method`, using only fields appropriate to the method. Keep undefined
estimates blank and describe why. Include measurement units and the interval level in headers or the accompanying
explanation. Read the CSV back and compare its values with the calculation before sending it.

After your host sends the CSV into the same chat, use the returned file reference with `data_schema`, `data_query`
and `data_card`. A table preserves interval bounds and exact statistics; ordinary mean bars do not convey
uncertainty. Share the method, source version, missing-data policy, assumptions and material limitations alongside
the card. Never present EDA-selected contrasts as prespecified or infer a causal effect from an observational
association.
