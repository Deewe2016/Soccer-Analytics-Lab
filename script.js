const teams = {
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

const home = document.querySelector('#home');
const away = document.querySelector('#away');
const homeElo = document.querySelector('#homeElo');
const awayElo = document.querySelector('#awayElo');
const homeOut = document.querySelector('#homeOut');
const awayOut = document.querySelector('#awayOut');

Object.entries(teams).forEach(([name, elo]) => {
  home.add(new Option(name, name));
  away.add(new Option(name, name));
});

home.value = 'Brazil';
away.value = 'France';
homeElo.value = teams[home.value];
awayElo.value = teams[away.value];

function updateLabels() {
  homeOut.value = homeElo.value;
  awayOut.value = awayElo.value;
}

function syncRatings() {
  homeElo.value = teams[home.value];
  awayElo.value = teams[away.value];
  updateLabels();
}

function analyze() {
  const h = Number(homeElo.value) + 55;
  const a = Number(awayElo.value);
  const expectedHome = 1 / (1 + Math.pow(10, (a - h) / 400));

  // Convert the Elo expectation into a soccer-style three-way estimate.
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

home.addEventListener('change', syncRatings);
away.addEventListener('change', syncRatings);
homeElo.addEventListener('input', updateLabels);
awayElo.addEventListener('input', updateLabels);
document.querySelector('#analyze').addEventListener('click', analyze);

updateLabels();
analyze();
