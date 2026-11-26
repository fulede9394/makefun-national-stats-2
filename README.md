# NationScope — National Statistics, Clearly

[![make.fun](https://make.fun/badge/best-national-statistics-site-20261126-0539.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539)
[![rank](https://make.fun/badge/best-national-statistics-site-20261126-0539/fulede9394/makefun-national-stats-2/rank.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539)
[![reward](https://make.fun/badge/best-national-statistics-site-20261126-0539/fulede9394/makefun-national-stats-2/reward.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539)

An original national statistics site, built for [make.fun's best national statistics site bounty](https://make.fun/bounty/best-national-statistics-site-20261126-0539).

NationScope profiles 20 countries with headline figures from the World Bank's
World Development Indicators — population, GDP, GDP per person and life
expectancy, with the source and year beside every number. Visitors can search
the table, open a country page (rankings, a 2015-vs-2024 population chart and a
plain-language note), compare any two countries side by side, and read what
each indicator actually counts.

The site is plain static files under `app/` with no build step and no network
requests: it opens in desktop Chrome and on a phone. Charts are hand-drawn on
canvas by `app/charts.js`; there are no vendored libraries. `main.ts` copies
`app/` and `screenshots/` to the output directory and writes `dossier.json`
with the kit's vendored library.
