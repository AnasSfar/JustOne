const score = require("./.score.js");

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
        .toLowerCase()
        .replace(/s$/, "");

    if (clue === "stop") return { status: "STOP", clues };
      if (clue === secretWord.toLowerCase()) {
        console.log("Indice interdit : le mot mystère lui même.");
        continue;
      }
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

// élimine les indices en double
function removeDuplicateClues(clues) {
  const counts = {};

  for (const { clue } of clues) {
    const key = clue.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  }

  return clues.filter(({ clue }) => counts[clue.toLowerCase()] === 1);
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

  if (cmd === "STOP") return "STOP";

  // Collecte des indices
  const res = await collectClues(players, activeIndex, secretWord, banned, ask);
  if (res.status === "STOP") return "STOP";

  // Réponse du joueur actif
  console.clear();
  console.log(`${activePlayer}, c'est à votre tour de deviner le mot !`);
  const finalClues = removeDuplicateClues(res.clues);
  const eliminatedCount = totalClues - finalClues.length;

  if (eliminatedCount > 0) {
    console.log(`⚠️ ${eliminatedCount} indice(s) ont été éliminé(s) car identiques.`);
  }

  if (finalClues.length === 0) {
    console.log("(Tous les indices ont été donc éliminés. Vous n'avez aucun indice. Bonne chance ! )");
  } else {
    console.log("Voici les indices reçus :");
    finalClues.forEach(({ player, clue }, index) => {
      console.log(`- Indice ${index + 1} de ${player} : ${clue}`);
    });
  }

  const guess = (await ask("Entrez votre réponse (ou STOP pour arrêter) : "))
    .trim()
    .toLowerCase();

  if (guess === "stop") return "STOP";

  if (guess === secretWord.toLowerCase()) {
    console.log("Bonne réponse, bien joué " + activePlayer + " et à toute l'équipe !");
  } else {
    console.log(`Mauvaise réponse. Le mot était : ${secretWord}`);
  }

  await ask("C'est la fin de cette manche n°" + roundIndex + ". Appuyez sur Entrée pour passez à la manche suivante...");
  return "OK";
}

// score
const correct = guess === secretWord.toLowerCase();

if (correct) {
  // +1 de base
  score.add(1);

  // bonus si aucun doublon (donc removed.length === 0)
  if (removed.length === 0) score.add(1);

  console.log("Bonne réponse, bien joué " + activePlayer + " et à toute l'équipe !");
} else {
  console.log(`Mauvaise réponse. Le mot était : ${secretWord}`);
}

// malus si tous éliminés (kept.length === 0)
if (kept.length === 0) score.add(-1);

module.exports = {
  drawRandomWords,
  playRound
};
