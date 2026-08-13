// Soccer Analytics Lab — Multi-Factor Match Model
//
// This model combines several team characteristics instead of relying
// entirely on Elo. The weights are intentionally easy to change so we
// can later backtest them against historical matches.

function buildTeamProfile(stats = {}) {
  return {
    elo: Number(stats.elo ?? 1500),

    // Attacking metrics
    xgFor: Number(stats.xgFor ?? 1.3),
    shots: Number(stats.shots ?? 12),
    shotsOnTarget: Number(stats.shotsOnTarget ?? 4),

    // Defensive metrics
    xgAgainst: Number(stats.xgAgainst ?? 1.3),

    // Other factors
    form: Number(stats.form ?? 0),
    attack: Number(stats.attack ?? 1),
    defense: Number(stats.defense ?? 1),
    possession: Number(stats.possession ?? 50)
  };
}


// Calculate expected goals for a matchup.
//
// venue:
//   "neutral" = neither team gets home advantage
//   "home"    = Team 1 gets home advantage
//   "away"    = Team 2 gets home advantage
function predictMatch(team1Stats, team2Stats, venue = "neutral") {
  const team1 = buildTeamProfile(team1Stats);
  const team2 = buildTeamProfile(team2Stats);

  // World Cup matches should normally use "neutral".
  const venueAdjustment =
    venue === "home" ? 0.18 :
    venue === "away" ? -0.18 :
    0;

  // Elo difference still matters, but it is only one factor.
  const eloDifference =
    (team1.elo - team2.elo) / 400;


  // -------------------------
  // ATTACKING STRENGTH
  // -------------------------

  const attack1 =
      0.45 * team1.xgFor
    + 0.20 * (team1.shots / 10)
    + 0.15 * (team1.shotsOnTarget / 4)
    + 0.10 * team1.attack
    + 0.10 * (team1.possession / 50);

  const attack2 =
      0.45 * team2.xgFor
    + 0.20 * (team2.shots / 10)
    + 0.15 * (team2.shotsOnTarget / 4)
    + 0.10 * team2.attack
    + 0.10 * (team2.possession / 50);


  // -------------------------
  // DEFENSIVE STRENGTH
  // -------------------------

  const defense1 =
      0.70 * team1.xgAgainst
    + 0.30 * team1.defense;

  const defense2 =
      0.70 * team2.xgAgainst
    + 0.30 * team2.defense;


  // -------------------------
  // EXPECTED GOALS
  // -------------------------

  const expectedGoals1 = Math.max(
    0.15,
    1.05
      + (attack1 - defense2) * 0.55
      + eloDifference * 0.20
      + team1.form * 0.03
      + venueAdjustment
  );

  const expectedGoals2 = Math.max(
    0.15,
    1.05
      + (attack2 - defense1) * 0.55
      - eloDifference * 0.20
      + team2.form * 0.03
      - venueAdjustment
  );


  return {
    expectedGoals: {
      team1: expectedGoals1,
      team2: expectedGoals2
    },

    eloDifference: team1.elo - team2.elo,

    attack: {
      team1: attack1,
      team2: attack2
    },

    defense: {
      team1: defense1,
      team2: defense2
    }
  };
}


// Poisson probability.
//
// Example:
// poissonProbability(2, 1.5)
// = probability of scoring exactly 2 goals
// when expected goals = 1.5
function poissonProbability(goals, lambda) {
  let factorial = 1;

  for (let i = 2; i <= goals; i++) {
    factorial *= i;
  }

  return (
    Math.exp(-lambda) *
    Math.pow(lambda, goals) /
    factorial
  );
}


// Generate every scoreline from 0-0 through maxGoals-maxGoals.
//
// The result is sorted from most likely to least likely.
function scoreMatrix(prediction, maxGoals = 7) {
  const matrix = [];

  for (let team1Goals = 0; team1Goals <= maxGoals; team1Goals++) {

    for (let team2Goals = 0; team2Goals <= maxGoals; team2Goals++) {

      const probability =
        poissonProbability(
          team1Goals,
          prediction.expectedGoals.team1
        ) *
        poissonProbability(
          team2Goals,
          prediction.expectedGoals.team2
        );

      matrix.push({
        team1Goals,
        team2Goals,
        probability
      });
    }
  }

  return matrix.sort(
    (a, b) => b.probability - a.probability
  );
}


// Calculate overall win/draw/loss probabilities
// from the scoreline probabilities.
function matchProbabilities(prediction, maxGoals = 7) {
  const scores = scoreMatrix(prediction, maxGoals);

  let team1Win = 0;
  let draw = 0;
  let team2Win = 0;

  for (const score of scores) {

    if (score.team1Goals > score.team2Goals) {
      team1Win += score.probability;

    } else if (score.team1Goals === score.team2Goals) {
      draw += score.probability;

    } else {
      team2Win += score.probability;
    }
  }

  // The 0-7 through 7-7 matrix doesn't contain every possible
  // soccer score, so normalize the probabilities.
  const total =
    team1Win +
    draw +
    team2Win;

  return {
    team1Win: team1Win / total,
    draw: draw / total,
    team2Win: team2Win / total
  };
}


// Run the complete model.
function analyzeMatch(team1Stats, team2Stats, venue = "neutral") {

  const prediction =
    predictMatch(
      team1Stats,
      team2Stats,
      venue
    );

  const probabilities =
    matchProbabilities(prediction);

  const scores =
    scoreMatrix(prediction);

  return {
    prediction,
    probabilities,

    // Top 10 most likely exact scorelines
    mostLikelyScores: scores.slice(0, 10)

// Make the functions available to the browser.
window.SoccerModel = {
  buildTeamProfile,
  predictMatch,
  poissonProbability,
  scoreMatrix,
  matchProbabilities,
  analyzeMatch
};
