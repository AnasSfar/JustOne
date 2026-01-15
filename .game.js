// Tire N mots au hasard sans répétition
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

// Demande un indice à chaque joueur (sauf joueur actif)
// Le mot mystère est affiché à CHAQUE saisie d'indice
async function collectClues(players, activeIndex, secretWord, ask) {
  const clues = [];

  for (let i = 0; i < players.length; i++) {
    if (i === activeIndex) continue;

    console.clear();

    // Tout le "header" + consigne dans un seul ask (meilleur affichage)
    const gate = (await ask(
      `========================================
C'est au tour de : ${players[i]}. Préparez votre indice.
Les autres joueurs ne doivent pas regarder.
----> Mot mystère : ${secretWord} 
Quand tu es prêt et que les autres joueurs ne regardent pas, appuyez sur Entrée pour continuer puis tapez votre indice (ou tapez STOP pour arrêter) :
======================================== `
    ))
      .trim()
      .toUpperCase();

    if (gate === "STOP") return { status: "STOP", clues };

    // Saisie de l'indice (1 mot, non vide)
    let clue = "";
    while (clue === "" || clue.includes(" ")) {
      clue = (await ask("Entrez votre indice (1 mot) : ")).trim();

      if (clue === "") {
        console.log("Indice vide interdit.");
      } else if (clue.includes(" ")) {
        console.log("Indice invalide : un seul mot (pas d'espaces).");
      }
    }

    clues.push({ player: players[i], clue });

    await ask("Indice enregistré. Appuyez sur entrée et passez le clavier au joueur suivant...");
  }

  console.clear();
  clues = clues.toLowerCase().trim();
  return { status: "OK", clues };
}

// Joue une manche (squelette)
async function playRound(roundIndex, players, activeIndex, secretWord, ask) {
  const activePlayer = players[activeIndex];

  console.log("\n==============================");
  console.log(`Manche ${roundIndex + 1} / 13`);
  console.log(`----> Le joueur actif pour cette manche est : ${activePlayer}`);
  console.log("==============================");

  const cmd = (await ask(
    `Quand le joueur ${activePlayer} s'est tourné, Entrée pour continuer (ou PASS / STOP) : `
  ))
    .trim()
    .toUpperCase();

  if (cmd === "STOP") return { status: "STOP" };
  if (cmd === "PASS") return { status: "PASS" };

  // Collecte des indices (les 4 autres joueurs)
  const res = await collectClues(players, activeIndex, secretWord, ask);
  if (res.status === "STOP") return { status: "STOP" };

  // DEBUG temporaire (à enlever plus tard)
  console.log("Indices collectés :", res.clues);

  await ask("Fin de manche (pour l’instant). Entrée pour continuer...");
  return { status: "OK", clues: res.clues };
}

module.exports = {
  drawRandomWords,
  playRound
};
