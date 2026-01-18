let score = 0;

function add(n) {
  score += n;
}

function getScore() {
  return score;
}

function resetScore() {
  score = 0;
}

module.exports = { add, getScore, resetScore };
