// NationScope data: 20 countries, World Bank World Development Indicators.
// Population and GDP are 2024 (SP.POP.TOTL, NY.GDP.MKTP.CD); GDP per capita 2024
// (NY.GDP.PCAP.CD); life expectancy 2023 (SP.DYN.LE00.IN). Population 2015 is the
// same WDI series, shown so each country page can show a decade of change.
// Values are rounded for display; the site states the source and year beside
// every figure. World totals: population 8.14bn, GDP $111.3 trillion (WDI 2024).
const NATIONS = [
  { code: "ind", name: "India",        region: "South Asia",      capital: "New Delhi",       pop2024: 1450.9, pop2015: 1310.2, gdp2024: 3.91,  gdpPc: 2695,  life: 67.7 },
  { code: "chn", name: "China",        region: "East Asia",       capital: "Beijing",         pop2024: 1409.0, pop2015: 1371.2, gdp2024: 18.73, gdpPc: 13293, life: 78.6 },
  { code: "usa", name: "United States",region: "North America",   capital: "Washington, D.C.",pop2024: 340.1,  pop2015: 320.7,  gdp2024: 29.30, gdpPc: 86169, life: 78.4 },
  { code: "idn", name: "Indonesia",    region: "Southeast Asia",  capital: "Jakarta",         pop2024: 283.5,  pop2015: 258.2,  gdp2024: 1.40,  gdpPc: 4925,  life: 71.7 },
  { code: "pak", name: "Pakistan",     region: "South Asia",      capital: "Islamabad",       pop2024: 251.3,  pop2015: 200.4,  gdp2024: 0.37,  gdpPc: 1471,  life: 66.1 },
  { code: "nga", name: "Nigeria",      region: "West Africa",     capital: "Abuja",           pop2024: 232.7,  pop2015: 181.1,  gdp2024: 0.19,  gdpPc: 807,   life: 52.6 },
  { code: "bra", name: "Brazil",       region: "South America",   capital: "Brasília",        pop2024: 212.0,  pop2015: 204.5,  gdp2024: 2.17,  gdpPc: 10253, life: 76.4 },
  { code: "bgd", name: "Bangladesh",   region: "South Asia",      capital: "Dhaka",           pop2024: 173.6,  pop2015: 155.6,  gdp2024: 0.45,  gdpPc: 2596,  life: 74.1 },
  { code: "rus", name: "Russia",       region: "Europe",          capital: "Moscow",          pop2024: 143.5,  pop2015: 143.8,  gdp2024: 2.17,  gdpPc: 15095, life: 73.4 },
  { code: "eth", name: "Ethiopia",     region: "East Africa",     capital: "Addis Ababa",     pop2024: 132.1,  pop2015: 100.8,  gdp2024: 0.23,  gdpPc: 1740,  life: 66.7 },
  { code: "mex", name: "Mexico",       region: "North America",   capital: "Mexico City",     pop2024: 130.9,  pop2015: 121.0,  gdp2024: 1.85,  gdpPc: 14129, life: 75.4 },
  { code: "jpn", name: "Japan",        region: "East Asia",       capital: "Tokyo",           pop2024: 124.0,  pop2015: 127.1,  gdp2024: 4.19,  gdpPc: 33797, life: 84.0 },
  { code: "phl", name: "Philippines",  region: "Southeast Asia",  capital: "Manila",          pop2024: 115.8,  pop2015: 101.7,  gdp2024: 0.46,  gdpPc: 3963,  life: 72.3 },
  { code: "egy", name: "Egypt",        region: "North Africa",    capital: "Cairo",           pop2024: 112.7,  pop2015: 93.8,   gdp2024: 0.38,  gdpPc: 3354,  life: 71.0 },
  { code: "vnm", name: "Vietnam",      region: "Southeast Asia",  capital: "Hanoi",           pop2024: 101.0,  pop2015: 91.7,   gdp2024: 0.48,  gdpPc: 4717,  life: 74.6 },
  { code: "deu", name: "Germany",      region: "Western Europe",  capital: "Berlin",          pop2024: 83.5,   pop2015: 81.2,   gdp2024: 4.69,  gdpPc: 56103, life: 81.2 },
  { code: "gbr", name: "United Kingdom", region: "Western Europe",capital: "London",          pop2024: 69.2,   pop2015: 65.1,   gdp2024: 3.70,  gdpPc: 53405, life: 81.2 },
  { code: "fra", name: "France",       region: "Western Europe",  capital: "Paris",           pop2024: 68.6,   pop2015: 66.5,   gdp2024: 3.17,  gdpPc: 46200, life: 83.3 },
  { code: "ita", name: "Italy",        region: "Southern Europe", capital: "Rome",            pop2024: 58.9,   pop2015: 60.8,   gdp2024: 2.38,  gdpPc: 40400, life: 83.8 },
  { code: "can", name: "Canada",       region: "North America",   capital: "Ottawa",          pop2024: 39.9,   pop2015: 35.7,   gdp2024: 2.24,  gdpPc: 56100, life: 81.6 },
];

// Indicator catalogue: what each number means, its WDI series code and year.
const INDICATORS = [
  { key: "pop2024",  label: "Population",        unit: "million people", series: "SP.POP.TOTL",    year: 2024, about: "All residents counted at mid-year, whatever their citizenship. The most basic fact about a country: how many people live there." },
  { key: "gdp2024",  label: "GDP",               unit: "US$ trillion",   series: "NY.GDP.MKTP.CD", year: 2024, about: "The market value of everything produced inside the country in a year, in current US dollars. The headline measure of an economy's size." },
  { key: "gdpPc",    label: "GDP per capita",    unit: "US$",            series: "NY.GDP.PCAP.CD", year: 2024, about: "GDP divided by population. A rough gauge of average income — high in small rich countries, low where many people share a small economy." },
  { key: "life",     label: "Life expectancy",   unit: "years",          series: "SP.DYN.LE00.IN", year: 2023, about: "How long a newborn could expect to live if today's death rates never changed. It sums up health, nutrition and safety in one number." },
  { key: "popChange",label: "Population change", unit: "% since 2015",   series: "SP.POP.TOTL",    year: 2024, about: "How much the population grew or shrank between 2015 and 2024. Positive in most of the world, negative where births fall below deaths." },
];

const WORLD = { population: 8141.8, gdp: 111.3, populationYear: 2024, gdpYear: 2024 };

// Short plain-language notes so a visitor can read a country at a glance.
const NOTES = {
  ind: "The world's most populous country since 2023, and its fastest-growing large economy — but GDP per person is still under $3,000.",
  chn: "The second-largest economy and the world's factory; its population has started to shrink as births fall.",
  usa: "The largest economy by a wide margin, and the third most populous country, with the highest GDP per person of any large country.",
  idn: "The largest island nation and the fourth most populous country; a young, fast-growing economy in Southeast Asia.",
  pak: "A quarter of a billion people, growing fast — the population rose by a quarter in a decade.",
  nga: "Africa's most populous country and its largest economy in people terms, but income per person is among the lowest on this list.",
  bra: "South America's largest country and economy, with the Amazon rainforest covering most of its north.",
  bgd: "One of the most densely populated countries on Earth; incomes have risen steadily for two decades.",
  rus: "The world's largest country by land, with a population that has been flat for a decade.",
  eth: "Africa's second most populous country; its population grew by nearly a third in ten years.",
  mex: "North America's second economy, tightly linked to the United States by trade and manufacturing.",
  jpn: "The world's oldest large population: life expectancy is the highest here, and the population is shrinking.",
  phl: "An archipelago of over 7,000 islands; a young population with many workers abroad.",
  egy: "The Arab world's most populous country, where most people live along the Nile.",
  vnm: "One of Asia's fastest-growing economies, built on manufacturing and exports.",
  deu: "Europe's largest economy, built on manufacturing and exports, with a slowly shrinking population.",
  gbr: "The sixth-largest economy; services, especially finance, dominate its output.",
  fra: "Western Europe's second economy, with the longest life expectancy of the large European states.",
  ita: "The euro area's third economy; its population is falling as births stay low.",
  can: "A large, sparsely populated country whose economy rests on natural resources and services.",
};
