let score = 0;

function increment() {
  score += 1;
}

function getScore() {
  return score;
}

function resetScore() {
  score = 0;
}

module.exports = {
  increment,
  getScore,
  resetScore
};