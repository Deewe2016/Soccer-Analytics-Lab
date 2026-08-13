const fallbackTeams = {
  "Brazil": 1880, "France": 1860, "Spain": 1845, "Argentina": 1835, "England": 1810,
  "Portugal": 1795, "Germany": 1785, "Netherlands": 1765, "Italy": 1745, "Belgium": 1735
};

let teams = fallbackTeams;
const home = document.querySelector('#home');
const away = document.querySelector('#away');
const venue = document.querySelector('#venue');
const homeElo = document.querySelector('#homeElo');
const awayElo = document.querySelector('#awayElo');
const homeOut = document.querySelector('#homeOut');
const awayOut = document.querySelector('#awayOut');

const countryNames = {
  ES:'Spain', AR:'Argentina', EN:'England', FR:'France', CO:'Colombia', PT:'Portugal', BR:'Brazil', NL:'Netherlands', NO:'Norway', BE:'Belgium', CH:'Switzerland', MX:'Mexico', DE:'Germany', MA:'Morocco', JP:'Japan', HR:'Croatia', EC:'Ecuador', DK:'Denmark', IT:'Italy', TR:'Turkey', UY:'Uruguay', AT:'Austria', SN:'Senegal', PY:'Paraguay', AU:'Australia', UA:'Ukraine', RU:'Russia', NG:'Nigeria', IR:'Iran', DZ:'Algeria', US:'United States', SQ:'Scotland', GR:'Greece', EG:'Egypt', RS:'Serbia', VE:'Venezuela', SE:'Sweden', CA:'Canada', CI:'Ivory Coast', KR:'South Korea', CL:'Chile', KO:'Kosovo', HU:'Hungary', PL:'Poland', CD:'DR Congo', PE:'Peru', IE:'Ireland', SI:'Slovenia', WA:'Wales', CZ:'Czech Republic', SK:'Slovakia', PA:'Panama', GE:'Georgia', IL:'Israel', RO:'Romania', UZ:'Uzbekistan', JO:'Jordan', BO:'Bolivia', CV:'Cape Verde', AL:'Albania', CM:'Cameroon', CR:'Costa Rica', BA:'Bosnia and Herzegovina', EI:'Ireland', SA:'Saudi Arabia', GH:'Ghana', HN:'Honduras', IS:'Iceland', TN:'Tunisia', IQ:'Iraq', ZA:'South Africa'
};

function displayName(item) {
  const raw = String(item.team ?? item.code ?? '').trim();
  return countryNames[raw.toUpperCase()] || raw;
}

function populateTeams() {
  home.replaceChildren();
  away.replaceChildren();
  Object.keys(teams).forEach(name => {
    home.add(new Option(name, name));
    away.add(new Option(name, name));
  });
  const names = Object.keys(teams);
  home.value = teams.Brazil ? 'Brazil' : names[0];
  away.value = teams.France ? 'France' : names[1] || names[0];
  syncRatings();
}

function updateLabels() { homeOut.value = homeElo.value; awayOut.value = awayElo.value; }
function syncRatings() { homeElo.value = teams[home.value] ?? 1500; awayElo.value = teams[away.value] ?? 1500; updateLabels(); analyze(); }
function getHomeAdvantage() { return venue.value === 'home' ? 55 : venue.value === 'away' ? -55 : 0; }

function analyze() {
  if (!window.SoccerModel) {
    console.error("SoccerModel has not loaded.");
    return;
  }

  const team1 = {
    elo: Number(homeElo.value),
    xgFor: Number(home.dataset.xgFor || 1.3),
    xgAgainst: Number(home.dataset.xgAgainst || 1.3),
    shots: Number(home.dataset.shots || 12),
    shotsOnTarget: Number(home.dataset.shotsOnTarget || 4),
    form: Number(home.dataset.form || 0),
    attack: Number(home.dataset.attack || 1),
    defense: Number(home.dataset.defense || 1),
    possession: Number(home.dataset.possession || 50)
  };

  const team2 = {
    elo: Number(awayElo.value),
    xgFor: Number(away.dataset.xgFor || 1.3),
    xgAgainst: Number(away.dataset.xgAgainst || 1.3),
    shots: Number(away.dataset.shots || 12),
    shotsOnTarget: Number(away.dataset.shotsOnTarget || 4),
    form: Number(away.dataset.form || 0),
    attack: Number(away.dataset.attack || 1),
    defense: Number(away.dataset.defense || 1),
    possession: Number(away.dataset.possession || 50)
  };

  const result = window.SoccerModel.analyzeMatch(
    team1,
    team2,
    venue.value
  );

  const p = result.probabilities;

  document.querySelector('#win').textContent =
    `${(p.team1Win * 100).toFixed(1)}%`;

  document.querySelector('#draw').textContent =
    `${(p.draw * 100).toFixed(1)}%`;

  document.querySelector('#loss').textContent =
    `${(p.team2Win * 100).toFixed(1)}%`;

  document.querySelector('#barHome').style.width =
    `${p.team1Win * 100}%`;

  document.querySelector('#barDraw').style.width =
    `${p.draw * 100}%`;

  document.querySelector('#barAway').style.width =
    `${p.team2Win * 100}%`;

  console.log("Multi-factor prediction:", result);
}
async function loadRatings() {
  try {
    const response = await fetch(`ratings.json?cacheBust=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.teams) || data.teams.length === 0) throw new Error('No ratings');
    teams = Object.fromEntries(data.teams.map(item => [displayName(item), Number(item.elo)]));
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
