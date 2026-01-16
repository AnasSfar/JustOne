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
async function collectClues(players, activeIndex, secretWord, banned, ask) {
  const clues = [];

  for (let i = 0; i < players.length; i++) {
    if (i === activeIndex) continue;

    console.clear();

    const gate = (await ask(
      `========================================
C'est au tour de : ${players[i]}. Préparez votre indice.
Les autres joueurs ne doivent pas regarder.
----> Mot mystère : ${secretWord}
Quand vous êtes prêt(e)s et que les autres joueurs ne regardent pas, appuyez sur Entrée pour continuer puis tapez votre indice (ou tapez STOP pour arrêter) :
======================================== `
    ))
      .trim()
      .toUpperCase();

    if (gate === "STOP") return { status: "STOP", clues };

    // Saisie de l'indice (1 mot, non vide, non interdit)
    let clue = "";
    while (true) {
      clue = (await ask("Entrez votre indice (1 mot) : "))
        .trim()
        .toLowerCase();

    if (clue === "stop") return { status: "STOP", clues };

      if (clue === "") {
        console.log("Indice vide interdit.");
        continue;
      }

      if (clue.includes(" ")) {
        console.log("Indice invalide : un seul mot (pas d'espaces).");
        continue;
      }

      if (banned.includes(clue)) {
        console.log("Indice interdit (interdit : le mot secret lui même, sa traduction en une autre langue et un mot de la famille proche du mot secret).");
        continue;
      }

      break;
    }

    clues.push({ player: players[i], clue });

    await ask("Indice enregistré. Appuyez sur entrée et passez le clavier au joueur suivant...");
  }

  console.clear();
  return { status: "OK", clues };
}

// Joue une manche
async function playRound(roundIndex, players, activeIndex, card, ask) {
  const activePlayer = players[activeIndex];
  const secretWord = card.word;
  const banned = card.banned;

  console.log("\n==============================");
  console.log(`Manche ${roundIndex + 1} / 13`);
  console.log(`----> Le joueur actif pour cette manche est : ${activePlayer}`);
  console.log("==============================");

  const cmd = (await ask(
    `Quand ${activePlayer} s'est tourné(e), appuyez sur Entrée pour continuer (ou STOP pour arrêter le jeu) : `
  ))
    .trim()
    .toUpperCase();

  if (cmd === "STOP") return { status: "STOP" };

  // Collecte des indices (les 4 autres joueurs)
  const res = await collectClues(players, activeIndex, secretWord, banned, ask);
  if (res.status === "STOP") return { status: "STOP" };
}
  // la réponse du joueur actif
  async function answer(activePlayer, secretWord, clues, ask) {
    console.clear();
    console.log(`${activePlayer}, c'est à votre tour de deviner le mot !`);
    console.log("Voici les indices reçus :");
    res.clues.forEach(({ player, clue }, index) => {
      console.log(`- Indice ${index + 1} de ${player} : ${clue}`);
    });

    const answer = await ask("Entrez votre réponse (ou STOP pour arrêter) : ")
      .trim()
      .toUpperCase();
    if (answer === "STOP") return "STOP";

    if (answer === secretWord.toUpperCase()) {
      console.log("Bonne réponse !");
    } else {
      console.log(`Mauvaise réponse. Le mot était : ${secretWord}`);
    }

    await ask("Fin de manche. Appuyez sur Entrée pour passez à la manche suivante...");
  }
module.exports = {
  drawRandomWords,
  playRound
};
