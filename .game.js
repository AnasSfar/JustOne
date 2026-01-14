console.log("Loaded .game.js from:", __filename);

// Fonction ask
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

// Tirer N mots au hasard sans répétition
function drawRandomWords(words, count) {
  const pool = [...words];
  const result = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool[index]);
    pool.splice(index, 1);
  }

  return result;
}

// Joue une manche (squelette pour l’instant)
async function playRound(roundIndex, players, activeIndex, secretWord, ask) {
  const activePlayer = players[activeIndex];

  console.log("\n==============================");
  console.log(`Manche ${roundIndex + 1} / 13`);
  console.log(`Joueur actif : ${activePlayer}`);
  console.log("==============================");

  // On récupère la saisie utilisateur
  const input = await ask(
    `Quand le joueur ${activePlayer} s'est tourné, Entrée pour continuer (ou PASS si vous voulez passer la manche / STOP si vous voulez arrêter le jeu) : `
  );

  const cmd = input.trim().toUpperCase();

  if (cmd === "STOP") return "STOP";
  if (cmd === "PASS") return "PASS";

  console.log(`Mot mystère : ${secretWord}`);

module.exports = { drawRandomWords, playRound };


  // ----- TODO -----
  // - indices
  // - annulation des doublons
  // - réponse
  // - score
  // - log fichier
  // -------------------------------------
  return "OK";
}

module.exports = {
  drawRandomWords,
  playRound
};
