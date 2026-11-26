// NationScope — the small front-end that turns the static data tables in
// data.js into the pages a visitor actually sees.
//
// There is no build step and no network call anywhere in here: every page
// is rendered from the constants that data.js already placed on the window
// (NATIONS, INDICATORS, WORLD, NOTES) and the canvas painters from
// charts.js (drawBars, drawPairedBars). The router below is hash based, so
// every page is a plain link — #/ for the table, #/country/<code> for one
// country, #/compare for the side-by-side view, and #/indicators and
// #/about for the reference pages. The header and footer never move; only
// the <main id="view"> element is replaced on each navigation.

(function () {
  "use strict";

  // The single mount point declared in index.html. Everything this file
  // draws lands inside it, and nothing else on the page is ever touched
  // except the navigation highlight and the document title.
  var viewRoot = document.getElementById("view");

  // The teal used for the first (or only) series in a chart, and the amber
  // used for the second series. These mirror the palette in style.css so
  // the bars agree with the headings and the header highlight.
  var FIRST_COLOUR = "#2a7f6f";
  var SECOND_COLOUR = "#e8a33d";

  // ---------------------------------------------------------------------------
  // Small formatting helpers: one place where numbers become readable text.
  // ---------------------------------------------------------------------------

  // Escape the handful of characters that would break out of an HTML string.
  // The country data is static and trusted, but the search box echoes nothing
  // into markup, and this keeps every interpolation below safe by habit.
  function escapeHtml(rawText) {
    return String(rawText)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Population is stored in millions, so anything at or above a thousand
  // million reads better as billions: 1450.9 becomes "1.45 bn", while 340.1
  // stays "340.1 m". Two decimals for billions keeps India and China apart.
  function populationText(millions) {
    if (millions >= 1000) {
      return (millions / 1000).toFixed(2) + " bn";
    }
    return millions.toFixed(1) + " m";
  }

  // GDP is stored in trillions of current US dollars, always with two
  // decimals so the table columns line up: "$29.30 tn", "$4.19 tn".
  function gdpText(trillions) {
    return "$" + trillions.toFixed(2) + " tn";
  }

  // GDP per person is stored as whole dollars; group the thousands so
  // $86169 reads as $86,169 instead of a wall of digits.
  function incomeText(dollars) {
    return "$" + Math.round(dollars).toLocaleString("en-US");
  }

  // Life expectancy is stored with one decimal, and the unit is part of the
  // reading on the country and compare pages: "84.0 years".
  function lifespanText(years) {
    return years.toFixed(1) + " years";
  }

  // The decade change between the 2015 and 2024 populations, as a signed
  // percentage with one decimal: Japan's -2.4%, the United States' +6.0%.
  // The sign is always shown, so a fall is never mistaken for a rise.
  function decadeChangeText(nation) {
    var change = ((nation.pop2024 - nation.pop2015) / nation.pop2015) * 100;
    var sign = change >= 0 ? "+" : "";
    return sign + change.toFixed(1) + "%";
  }

  // A country's share of the whole world's population, from the world total
  // in data.js: Japan holds about 1.5% of 8.14 billion people.
  function worldShareText(nation) {
    var share = (nation.pop2024 / WORLD.population) * 100;
    return share.toFixed(1) + "%";
  }

  // ---------------------------------------------------------------------------
  // Lookups and rankings over the country table.
  // ---------------------------------------------------------------------------

  // Find a country by its three-letter code, case-insensitively, so a typed
  // or pasted link such as #/country/JPN still lands on Japan. Returns the
  // record, or null when no code matches.
  function findNation(code) {
    if (!code) {
      return null;
    }
    var wanted = String(code).toLowerCase();
    for (var i = 0; i < NATIONS.length; i += 1) {
      if (NATIONS[i].code === wanted) {
        return NATIONS[i];
      }
    }
    return null;
  }

  // A country's position when the whole list is ordered from largest to
  // smallest on one measure: 1 means the biggest population, the biggest
  // economy, the highest income, or the longest life, depending on the key.
  function rankAmong(nation, key) {
    var ordered = NATIONS.slice().sort(function (a, b) {
      return b[key] - a[key];
    });
    for (var i = 0; i < ordered.length; i += 1) {
      if (ordered[i].code === nation.code) {
        return i + 1;
      }
    }
    return ordered.length;
  }

  // A copy of the table ordered by 2024 population, largest first. The data
  // file already arrives in that order, but sorting here means the table and
  // the "most people" chart can never drift apart if the data is reordered.
  function nationsByPopulation() {
    return NATIONS.slice().sort(function (a, b) {
      return b.pop2024 - a.pop2024;
    });
  }

  // ---------------------------------------------------------------------------
  // Shared fragments: the stat cards and the country table.
  // ---------------------------------------------------------------------------

  // One of the six cards on a country page: a small-caps label, a large
  // value, and a quiet supporting line underneath. The supporting line may
  // be empty for cards that need no extra context.
  function statCard(label, value, note) {
    var html = '<div class="stat">';
    html += '<span class="stat-label">' + escapeHtml(label) + "</span>";
    html += '<span class="stat-value">' + escapeHtml(value) + "</span>";
    html += '<span class="stat-note">' + escapeHtml(note || "") + "</span>";
    html += "</div>";
    return html;
  }

  // One row of the home table: the name links to that country's own page,
  // and every figure sits in a right-aligned numeric cell.
  function countryTableRow(nation) {
    var html = "<tr>";
    html += '<td><a href="#/country/' + nation.code + '">' + escapeHtml(nation.name) + "</a></td>";
    html += '<td class="num">' + populationText(nation.pop2024) + "</td>";
    html += '<td class="num">' + gdpText(nation.gdp2024) + "</td>";
    html += '<td class="num">' + incomeText(nation.gdpPc) + "</td>";
    html += '<td class="num">' + lifespanText(nation.life) + "</td>";
    html += "</tr>";
    return html;
  }

  // Which countries a search phrase leaves visible. Matching looks at the
  // name, the region and the capital, so "east asia", "paris" and "japan"
  // all find what a visitor probably meant. The home table and the live
  // search share this one filter, so they can never disagree about a query.
  function visibleNations(searchPhrase) {
    var phrase = (searchPhrase || "").trim().toLowerCase();
    return nationsByPopulation().filter(function (nation) {
      if (!phrase) {
        return true;
      }
      var haystack = (nation.name + " " + nation.region + " " + nation.capital).toLowerCase();
      return haystack.indexOf(phrase) !== -1;
    });
  }

  // The rows of the home table for one search phrase. An empty result still
  // renders the table, with one honest row saying so.
  function countryRowsHtml(searchPhrase) {
    var visible = visibleNations(searchPhrase);
    if (visible.length === 0) {
      return '<tr><td colspan="5">No countries match that search.</td></tr>';
    }
    var rows = "";
    for (var i = 0; i < visible.length; i += 1) {
      rows += countryTableRow(visible[i]);
    }
    return rows;
  }

  // The whole home table, filtered by an optional search phrase.
  function countryTableHtml(searchPhrase) {
    var html = '<div class="tablewrap"><table>';
    html += "<thead><tr><th>Country</th>";
    html += '<th class="num">Population (2024)</th>';
    html += '<th class="num">GDP (2024)</th>';
    html += '<th class="num">GDP per person (2024)</th>';
    html += '<th class="num">Life expectancy (2023)</th></tr></thead>';
    html += '<tbody id="country-rows">';
    html += countryRowsHtml(searchPhrase);
    html += "</tbody></table></div>";
    return html;
  }

  // Re-render only the table body when the visitor types in the search box.
  // Rebuilding the whole home page on every keystroke would throw the input
  // away and drop the cursor, so the search handler reaches for the tbody
  // by id and swaps just its rows, reusing the same row builder as the
  // first render.
  function refreshCountryRows(phrase) {
    var body = document.getElementById("country-rows");
    if (!body) {
      return;
    }
    body.innerHTML = countryRowsHtml(phrase);
  }

  // ---------------------------------------------------------------------------
  // Home page: hero, world totals, search, two charts, the full table.
  // ---------------------------------------------------------------------------

  function buildHomePage() {
    var html = "";
    html += '<section class="hero">';
    html += "<h1>Every country, in numbers.</h1>";
    html += '<p class="lede">NationScope gathers the headline statistics of 20 countries \u2014 population, economy and how long people live \u2014 from the World Bank, with the source and year beside every figure.</p>';
    html += '<div class="worldline">';
    html += "<span><strong>" + (WORLD.population / 1000).toFixed(2) + " bn</strong> people on Earth, " + WORLD.populationYear + "</span>";
    html += "<span><strong>$" + WORLD.gdp.toFixed(1) + " tn</strong> world GDP, " + WORLD.gdpYear + "</span>";
    html += "<span><strong>" + NATIONS.length + "</strong> countries profiled</span>";
    html += "</div></section>";

    html += '<div class="search">';
    html += '<label for="country-search">Find a country</label>';
    html += '<input id="country-search" type="search" placeholder="Type a name \u2014 try Japan, Nigeria, Brazil\u2026" autocomplete="off">';
    html += '<p class="hint">Or browse the table below.</p>';
    html += "</div>";

    html += '<div class="charts">';
    html += '<div class="chartbox"><h2>Most people, 2024</h2>';
    html += '<canvas id="chart-population" width="600" height="330"></canvas>';
    html += '<p class="src">World Bank WDI, SP.POP.TOTL, 2024. Bars show millions of people.</p></div>';
    html += '<div class="chartbox"><h2>Biggest economies, 2024</h2>';
    html += '<canvas id="chart-gdp" width="600" height="330"></canvas>';
    html += '<p class="src">World Bank WDI, NY.GDP.MKTP.CD, 2024. Bars show trillions of US dollars.</p></div>';
    html += "</div>";

    html += "<h2>All countries</h2>";
    html += countryTableHtml("");
    html += '<p class="src">World Bank WDI. Population and GDP 2024; life expectancy 2023. Figures are rounded for display.</p>';

    html += '<div class="chartbox wide"><h2>Longest lives</h2>';
    html += '<canvas id="chart-life" width="600" height="330"></canvas>';
    html += '<p class="src">World Bank WDI, SP.DYN.LE00.IN, 2023. Bars show years of life expectancy at birth.</p></div>';

    return html;
  }

  // Paint the three home charts once the markup is in the document, so the
  // canvases have a real width to measure. Each chart shows the top ten on
  // its measure; the population and economy charts are the two in the grid,
  // and the life-expectancy chart is the wide one below the table.
  function paintHomeCharts() {
    var byPopulation = nationsByPopulation().slice(0, 10);
    var populationCanvas = document.getElementById("chart-population");
    if (populationCanvas) {
      drawBars(populationCanvas, byPopulation.map(function (nation) {
        return { label: nation.name, value: nation.pop2024, colour: FIRST_COLOUR };
      }), populationText);
    }
    var byGdp = NATIONS.slice().sort(function (a, b) {
      return b.gdp2024 - a.gdp2024;
    }).slice(0, 10);
    var gdpCanvas = document.getElementById("chart-gdp");
    if (gdpCanvas) {
      drawBars(gdpCanvas, byGdp.map(function (nation) {
        return { label: nation.name, value: nation.gdp2024, colour: SECOND_COLOUR };
      }), gdpText);
    }
    var byLife = NATIONS.slice().sort(function (a, b) {
      return b.life - a.life;
    }).slice(0, 10);
    var lifeCanvas = document.getElementById("chart-life");
    if (lifeCanvas) {
      drawBars(lifeCanvas, byLife.map(function (nation) {
        return { label: nation.name, value: nation.life, colour: FIRST_COLOUR };
      }), lifespanText);
    }
  }

  // Wire the search box up after the home page renders: every keystroke
  // narrows the table, and clearing the box brings all twenty rows back.
  function wireHomeSearch() {
    var box = document.getElementById("country-search");
    if (!box) {
      return;
    }
    box.addEventListener("input", function () {
      refreshCountryRows(box.value);
    });
  }

  // ---------------------------------------------------------------------------
  // Country page: crumb, note, six stat cards, the 2015-vs-2024 chart.
  // ---------------------------------------------------------------------------

  function buildCountryPage(nation) {
    var html = "";
    html += '<p class="crumb"><a href="#/">All countries</a> \u203a ' + escapeHtml(nation.region) + "</p>";
    html += "<h1>" + escapeHtml(nation.name) + "</h1>";
    html += '<p class="lede">' + escapeHtml(NOTES[nation.code] || "") + "</p>";

    html += '<div class="stats">';
    html += statCard("Population, 2024", populationText(nation.pop2024),
      "Rank #" + rankAmong(nation, "pop2024") + " of " + NATIONS.length + " \u00b7 " + decadeChangeText(nation) + " since 2015");
    html += statCard("GDP, 2024", gdpText(nation.gdp2024),
      "Rank #" + rankAmong(nation, "gdp2024") + " of " + NATIONS.length + " \u00b7 World Bank WDI");
    html += statCard("GDP per person, 2024", incomeText(nation.gdpPc),
      "Rank #" + rankAmong(nation, "gdpPc") + " of " + NATIONS.length);
    html += statCard("Life expectancy, 2023", lifespanText(nation.life),
      "Rank #" + rankAmong(nation, "life") + " of " + NATIONS.length);
    html += statCard("Capital", nation.capital, "Region: " + nation.region);
    html += statCard("Share of world population", worldShareText(nation),
      "Of " + (WORLD.population / 1000).toFixed(2) + " billion people, " + WORLD.populationYear);
    html += "</div>";

    html += '<div class="chartbox wide"><h2>Population: 2015 vs 2024</h2>';
    html += '<canvas id="chart-decade" width="600" height="150"></canvas>';
    html += '<p class="src">World Bank WDI, SP.POP.TOTL. Bars show millions of people.</p></div>';

    // A way back to the table, and a little breathing room before the footer:
    // without it the footer would sit flush against the chart box, since the
    // page's main element carries no bottom padding of its own.
    html += '<p><a href="#/">&larr; All countries</a></p>';

    return html;
  }

  // Paint the paired 2015/2024 bars for one country. A single pair is all
  // this chart ever holds, so the grey 2015 bar sits directly above the
  // teal 2024 bar and the decade's direction is obvious at a glance.
  function paintCountryChart(nation) {
    var canvas = document.getElementById("chart-decade");
    if (!canvas) {
      return;
    }
    drawPairedBars(canvas, [{
      label: nation.name,
      before: nation.pop2015,
      after: nation.pop2024
    }], populationText);
  }

  // A short page for a code that matches nothing, instead of a blank view
  // or a silent redirect: it names the code and offers the way back.
  function buildMissingCountryPage(code) {
    var html = "";
    html += "<h1>Country not found</h1>";
    html += '<p class="lede">There is no country with the code \u201c' + escapeHtml(code || "") + "\u201d in this list of " + NATIONS.length + " countries.</p>";
    html += '<p><a class="button" href="#/">Browse the 20 countries</a></p>';
    return html;
  }

  // ---------------------------------------------------------------------------
  // Compare page: two pickers, a side-by-side table, one population chart.
  // ---------------------------------------------------------------------------

  // The rows of the comparison table. Each row knows how to read its value
  // off a country and how to print it; the winner is whichever side holds
  // the larger number, since a bigger population, economy, income, lifespan
  // or growth rate is the "winning" side for that row.
  var COMPARE_ROWS = [
    { label: "Population, 2024", valueOf: function (n) { return n.pop2024; }, print: populationText },
    { label: "GDP, 2024", valueOf: function (n) { return n.gdp2024; }, print: gdpText },
    { label: "GDP per person, 2024", valueOf: function (n) { return n.gdpPc; }, print: incomeText },
    { label: "Life expectancy, 2023", valueOf: function (n) { return n.life; }, print: lifespanText },
    { label: "Population change since 2015", valueOf: function (n) { return (n.pop2024 - n.pop2015) / n.pop2015 * 100; }, print: function (v) { return (v >= 0 ? "+" : "") + v.toFixed(1) + "%"; } }
  ];

  // The <option> list shared by both pickers, with the chosen country
  // marked selected. Options are ordered by population, largest first, so
  // the big countries a visitor most often wants are at the top.
  function pickerOptions(selectedCode) {
    return nationsByPopulation().map(function (nation) {
      var selected = nation.code === selectedCode ? ' selected' : "";
      return '<option value="' + nation.code + '"' + selected + ">" + escapeHtml(nation.name) + "</option>";
    }).join("");
  }

  function buildComparePage(first, second) {
    var html = "";
    html += "<h1>Compare two countries</h1>";
    html += '<p class="lede">Pick any two of the ' + NATIONS.length + ' countries and see their headline numbers side by side.</p>';

    html += '<div class="pickers">';
    html += '<label>First country <select id="compare-first" aria-label="First country">' + pickerOptions(first.code) + "</select></label>";
    html += '<label>Second country <select id="compare-second" aria-label="Second country">' + pickerOptions(second.code) + "</select></label>";
    html += "</div>";

    html += '<div class="tablewrap"><table>';
    html += "<thead><tr><th></th>";
    html += '<th class="num">' + escapeHtml(first.name) + "</th>";
    html += '<th class="num">' + escapeHtml(second.name) + "</th></tr></thead><tbody>";
    COMPARE_ROWS.forEach(function (row) {
      var firstValue = row.valueOf(first);
      var secondValue = row.valueOf(second);
      var firstWins = firstValue > secondValue;
      var secondWins = secondValue > firstValue;
      html += "<tr><td>" + escapeHtml(row.label) + "</td>";
      html += '<td class="num' + (firstWins ? " win" : "") + '">' + row.print(firstValue) + "</td>";
      html += '<td class="num' + (secondWins ? " win" : "") + '">' + row.print(secondValue) + "</td></tr>";
    });
    html += "</tbody></table></div>";

    html += '<div class="chartbox wide"><h2>Population, 2024</h2>';
    html += '<canvas id="chart-compare" width="600" height="120"></canvas>';
    html += '<p class="src">World Bank WDI, SP.POP.TOTL, 2024. The larger bar wins each row.</p></div>';

    return html;
  }

  // Paint the compare chart: the first country's bar in teal, the second's
  // in amber, so the two sides stay distinguishable without a legend.
  function paintCompareChart(first, second) {
    var canvas = document.getElementById("chart-compare");
    if (!canvas) {
      return;
    }
    drawBars(canvas, [
      { label: first.name, value: first.pop2024, colour: FIRST_COLOUR },
      { label: second.name, value: second.pop2024, colour: SECOND_COLOUR }
    ], populationText);
  }

  // When either picker changes, redraw the whole compare page with the new
  // pair. Rebuilding is cheap here, and it keeps the table, the chart and
  // the picker states in agreement with each other.
  function wireComparePickers() {
    var firstPicker = document.getElementById("compare-first");
    var secondPicker = document.getElementById("compare-second");
    if (!firstPicker || !secondPicker) {
      return;
    }
    function redraw() {
      var first = findNation(firstPicker.value) || NATIONS[0];
      var second = findNation(secondPicker.value) || NATIONS[1];
      viewRoot.innerHTML = buildComparePage(first, second);
      paintCompareChart(first, second);
      wireComparePickers();
    }
    firstPicker.addEventListener("change", redraw);
    secondPicker.addEventListener("change", redraw);
  }

  // ---------------------------------------------------------------------------
  // Indicators page: what each number actually counts, in plain language.
  // ---------------------------------------------------------------------------

  function buildIndicatorsPage() {
    var html = "";
    html += "<h1>What each number counts</h1>";
    html += '<p class="lede">Every figure on this site comes from the World Bank\u2019s World Development Indicators. Here is what each one measures, which series it comes from, and which year it covers.</p>';
    INDICATORS.forEach(function (indicator) {
      html += '<div class="indicator">';
      html += "<h2>" + escapeHtml(indicator.label) + ' <span class="unit">\u00b7 ' + escapeHtml(indicator.unit) + " \u00b7 " + escapeHtml(indicator.series) + ", " + indicator.year + "</span></h2>";
      html += "<p>" + escapeHtml(indicator.about) + "</p>";
      html += "</div>";
    });
    html += '<p class="src">Source: World Bank, World Development Indicators (CC BY 4.0). Population and GDP 2024; life expectancy 2023.</p>';
    return html;
  }

  // ---------------------------------------------------------------------------
  // About page: what the site is, where the numbers come from, how to use it.
  // ---------------------------------------------------------------------------

  function buildAboutPage() {
    var html = "";
    html += "<h1>About NationScope</h1>";
    html += '<p class="lede">NationScope is an independent reference site that puts the headline statistics of 20 countries in one place, with the source and the year beside every figure.</p>';
    html += "<p>All of the numbers come from the World Bank\u2019s World Development Indicators, published under a CC BY 4.0 licence. Population and GDP are for 2024; life expectancy is for 2023, the latest year the Bank had published when this site was built. The twenty countries profiled are the world\u2019s most populous, so together they cover most of humanity.</p>";
    html += "<p>NationScope is not affiliated with the World Bank. Figures are rounded for display \u2014 populations to one decimal place in millions, GDP to two decimals in trillions of dollars \u2014 and the indicator pages spell out exactly what each series counts.</p>";
    html += "<h2>How to use this site</h2>";
    html += '<ul class="tips">';
    html += "<li>Search the table on the home page by name, region or capital \u2014 try \u201cEast Asia\u201d or \u201cParis\u201d.</li>";
    html += "<li>Open any country to see its rankings, its capital, its share of the world\u2019s people, and how its population moved between 2015 and 2024.</li>";
    html += "<li>Compare any two countries side by side, with the larger figure in each row highlighted.</li>";
    html += "<li>Read the indicators page before quoting a number, so you know what it actually counts.</li>";
    html += "</ul>";
    html += '<p><a class="button" href="#/">Browse the 20 countries</a></p>';
    return html;
  }

  // ---------------------------------------------------------------------------
  // Router: read the hash, draw the page, highlight the nav, set the title.
  // ---------------------------------------------------------------------------

  // Which top-level section a route belongs to, for the navigation
  // highlight. A country page belongs to no section, so no nav link is
  // highlighted there; the home page highlights "Countries".
  function sectionFor(route) {
    if (route === "" || route === "/") {
      return "#/";
    }
    if (route === "/compare" || route === "/indicators" || route === "/about") {
      return "#" + route;
    }
    return null;
  }

  function highlightNav(route) {
    var wanted = sectionFor(route);
    var links = document.querySelectorAll("nav a");
    for (var i = 0; i < links.length; i += 1) {
      var link = links[i];
      if (wanted && link.getAttribute("href") === wanted) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    }
  }

  // Draw the page for the current hash. The hash is split on slashes after
  // the leading "#", so "#/country/jpn" becomes ["country", "jpn"] and "#/"
  // becomes an empty route that means the home page.
  function renderRoute() {
    var hash = window.location.hash || "#/";
    var route = hash.replace(/^#/, "");
    var parts = route.split("/").filter(function (piece) {
      return piece !== "";
    });
    var pageTitle = "NationScope \u2014 National Statistics, Clearly";

    if (parts.length === 0) {
      viewRoot.innerHTML = buildHomePage();
      paintHomeCharts();
      wireHomeSearch();
    } else if (parts[0] === "country" && parts.length === 2) {
      var nation = findNation(parts[1]);
      if (nation) {
        viewRoot.innerHTML = buildCountryPage(nation);
        paintCountryChart(nation);
        pageTitle = nation.name + " \u2014 NationScope";
      } else {
        viewRoot.innerHTML = buildMissingCountryPage(parts[1]);
        pageTitle = "Country not found \u2014 NationScope";
      }
    } else if (parts[0] === "compare" && parts.length === 1) {
      var first = findNation("usa");
      var second = findNation("chn");
      viewRoot.innerHTML = buildComparePage(first, second);
      paintCompareChart(first, second);
      wireComparePickers();
      pageTitle = "Compare two countries \u2014 NationScope";
    } else if (parts[0] === "indicators" && parts.length === 1) {
      viewRoot.innerHTML = buildIndicatorsPage();
      pageTitle = "Indicators \u2014 NationScope";
    } else if (parts[0] === "about" && parts.length === 1) {
      viewRoot.innerHTML = buildAboutPage();
      pageTitle = "About \u2014 NationScope";
    } else {
      // An unknown hash is treated as the home page rather than a dead end:
      // the visitor still gets the full table instead of a blank screen.
      viewRoot.innerHTML = buildHomePage();
      paintHomeCharts();
      wireHomeSearch();
    }

    highlightNav(route);
    document.title = pageTitle;
    window.scrollTo(0, 0);
  }

  // Re-render whenever the hash changes, and draw the first page now so the
  // site is usable even before any navigation happens.
  window.addEventListener("hashchange", renderRoute);
  renderRoute();
})();
