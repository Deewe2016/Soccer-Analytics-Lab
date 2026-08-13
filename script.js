const fallbackTeams = {
  "Brazil": 1880,
  "France": 1860,
  "Spain": 1845,
  "Argentina": 1835,
  "England": 1810,
  "Portugal": 1795,
  "Germany": 1785,
  "Netherlands": 1765,
  "Italy": 1745,
  "Belgium": 1735
};

let teams = fallbackTeams;
let ratingsUpdatedAt = null;

const home = document.querySelector('#home');
const away = document.querySelector('#away');
const venue = document.querySelector('#venue');
const homeElo = document.querySelector('#homeElo');
const awayElo = document.querySelector('#awayElo');
const homeOut = document.querySelector('#homeOut');
const awayOut = document.querySelector('#awayOut');

function populateTeams() {
  home.replaceChildren();
  away.replaceChildren();

  Object.entries(teams).forEach(([name]) => {
    home.add(new Option(name, name));
    away.add(new Option(name, name));
  });

  const names = Object.keys(teams);
  home.value = teams.Brazil ? 'Brazil' : names[0];
  away.value = teams.France ? 'France' : names[1] || names[0];
  syncRatings();
}

function updateLabels() {
  homeOut.value = homeElo.value;
  awayOut.value = awayElo.value;
}

function syncRatings() {
  homeElo.value = teams[home.value] ?? 1500;
  awayElo.value = teams[away.value] ?? 1500;
  updateLabels();
  analyze();
}

function getHomeAdvantage() {
  if (venue.value === 'home') return 55;
  if (venue.value === 'away') return -55;
  return 0;
}

function analyze() {
  const h = Number(homeElo.value) + getHomeAdvantage();
  const a = Number(awayElo.value);
  const expectedHome = 1 / (1 + Math.pow(10, (a - h) / 400));
  const draw = Math.max(0.15, 0.30 - Math.abs(expectedHome - 0.5) * 0.22);
  const remaining = 1 - draw;
  const homeWin = remaining * expectedHome;
  const awayWin = remaining * (1 - expectedHome);

  document.querySelector('#win').textContent = `${(homeWin * 100).toFixed(1)}%`;
  document.querySelector('#draw').textContent = `${(draw * 100).toFixed(1)}%`;
  document.querySelector('#loss').textContent = `${(awayWin * 100).toFixed(1)}%`;
  document.querySelector('#barHome').style.width = `${homeWin * 100}%`;
  document.querySelector('#barDraw').style.width = `${draw * 100}%`;
  document.querySelector('#barAway').style.width = `${awayWin * 100}%`;
}

async function loadRatings() {
  try {
    const response = await fetch(`ratings.json?cacheBust=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.teams) || data.teams.length === 0) throw new Error('No ratings');

    const countryNames = {
  ES: "Spain",
  AR: "Argentina",
  EN: "England",
  FR: "France",
  CO: "Colombia",
  PT: "Portugal",
  BR: "Brazil",
  NL: "Netherlands",
  NO: "Norway",
  BE: "Belgium",
  CH: "Switzerland",
  MX: "Mexico",
  DE: "Germany",
  MA: "Morocco",
  JP: "Japan",
  HR: "Croatia",
  EC: "Ecuador",
  DK: "Denmark",
  IT: "Italy",
  TR: "Turkey",
  UY: "Uruguay",
  AT: "Austria",
  SN: "Senegal",
  PY: "Paraguay",
  AU: "Australia",
  UA: "Ukraine",
  RU: "Russia",
  NG: "Nigeria",
  IR: "Iran",
  DZ: "Algeria",
  US: "United States",
  SQ: "Scotland",
  GR: "Greece",
  EG: "Egypt",
  RS: "Serbia",
  VE: "Venezuela",
  SE: "Sweden",
  CA: "Canada",
  CI: "Ivory Coast",
  KR: "South Korea",
  CL: "Chile",
  KO: "Kosovo",
  HU: "Hungary",
  PL: "Poland",
  CD: "DR Congo",
  PE: "Peru",
  IE: "Ireland",
  SI: "Slovenia",
  WA: "Wales",
  CZ: "Czech Republic",
  SK: "Slovakia",
  PA: "Panama",
  GE: "Georgia",
  IL: "Israel",
  RO: "Romania",
  UZ: "Uzbekistan",
  JO: "Jordan",
  BO: "Bolivia",
  CV: "Cape Verde",
  AL: "Albania",
  CM: "Cameroon",
  CR: "Costa Rica",
  BA: "Bosnia and Herzegovina",
  EI: "Ireland",
  SA: "Saudi Arabia",
  GH: "Ghana",
  HN: "Honduras",
  IS: "Iceland",
  TN: "Tunisia",
  IQ: "Iraq",
  ZA: "South Africa"
};

teams = Object.fromEntries(
  data.teams.map(item => [
    countryNames[item.code] || item.team,
    Number(item.elo)
  ])
);
    ratingsUpdatedAt = data.updatedAt;
    populateTeams();

    const status = document.querySelector('#dataStatus');
    if (status) status.textContent = `Live ratings loaded · ${data.teams.length} teams`;
  } catch (error) {
    populateTeams();
    const status = document.querySelector('#dataStatus');
    if (status) status.textContent = 'Using built-in fallback ratings · automatic update has not run yet';
    console.warn('Could not load ratings.json:', error);
  }
}

home.addEventListener('change', syncRatings);
away.addEventListener('change', syncRatings);
venue.addEventListener('change', analyze);
homeElo.addEventListener('input', updateLabels);
awayElo.addEventListener('input', updateLabels);
document.querySelector('#analyze').addEventListener('click', analyze);

populateTeams();
loadRatings();
