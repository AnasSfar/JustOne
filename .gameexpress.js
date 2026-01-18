const readline = require("readline");

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

function formatMMSS(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// askTimed (sans affichage en continu)

function askTimed(rl, question, ms, opts = {}) {
  const {
    announceMinutes = true,
    showOnceAtPrompt = true,
    minuteThresholds = [4, 3, 2, 1]
  } = opts;

  return new Promise((resolve) => {
    let done = false;

    // Affichage du prompt (une fois)
    if (showOnceAtPrompt) {
      process.stdout.write(`${question}\nTemps disponible: ${formatMMSS(ms)}\n> `);
    } else {
      process.stdout.write(question);
    }

    const minuteTimers = [];

    const cleanup = () => {
      if (done) return;
      done = true;
      rl.removeListener("line", onLine);
      clearTimeout(killer);
      minuteTimers.forEach(clearTimeout);
    };

    const onLine = (line) => {
      cleanup();
      resolve(line.trim());
    };

    rl.once("line", onLine);

    // Annonces minutes restantes
    if (announceMinutes) {
      for (const m of minuteThresholds) {
        const triggerAt = ms - m * 60000;
        if (triggerAt > 0) {
          minuteTimers.push(
            setTimeout(() => {
              if (done) return;
              process.stdout.write("\n");
              console.log(`Il reste ${m} minute${m > 1 ? "s" : ""}.`);
              process.stdout.write("> ");
            }, triggerAt)
          );
        }
      }
    }

    // Timeout final
    const killer = setTimeout(() => {
      if (done) return;
      process.stdout.write("\n");
      console.log("⏱ Temps écoulé !");
      cleanup();
      resolve(null);
    }, ms);
  });
}

// Collecte des indices (Express)

async function collectCluesExpress(rl, players, activeIndex, secretWord, banned, roundMs) {
  const clues = [];

  for (let i = 0; i < players.length; i++) {
    if (i === activeIndex) continue;

    console.clear();
    const gate = await askTimed(
      rl,
      `========================================
C'est au tour de : ${players[i]}. Préparez votre indice.
Les autres joueurs ne doivent pas regarder.
----> Mot mystère : ${secretWord}
Quand vous êtes prêt(e)s, appuyez sur Entrée (ou tapez STOP) :
======================================== `,
      roundMs,
      { announceMinutes: true, showOnceAtPrompt: false }
    );

    if (gate === null) {
      // timeout sur gate => joueur perd son tour d'indice
      continue;
    }
    if (gate.trim().toUpperCase() === "STOP") return { status: "STOP", clues };

    // Saisie de l'indice (AFFICHE le temps UNE SEULE FOIS ici)
    while (true) {
      const raw = await askTimed(rl, "Entrez votre indice (1 mot) :", roundMs, {
        announceMinutes: true,
        showOnceAtPrompt: true
      });

      if (raw === null) {
        // timeout => indice perdu
        break;
      }

      const clue = raw.trim().toLowerCase();
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
        console.log(
          "Indice interdit (interdit : le mot secret lui-même, sa traduction, ou un mot très proche)."
        );
        continue;
      }

      clues.push({ player: players[i], clue });
      break;
    }

    // Confirmation (pas besoin d'afficher le temps)
    await askTimed(
      rl,
      "Indice enregistré. Appuyez sur Entrée et passez le clavier au joueur suivant...",
      roundMs,
      { announceMinutes: false, showOnceAtPrompt: false }
    );
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

// Joue une manche Express
// Règle: si timeout sur la réponse => faux

async function playRoundExpress(roundIndex, players, activeIndex, card, rl, roundMs) {
  const activePlayer = players[activeIndex];
  const secretWord = card.word;
  const banned = card.banned;

  console.log("\n==============================");
  console.log(`Manche ${roundIndex + 1} / 13`);
  console.log(`----> Joueur actif : ${activePlayer}`);
  console.log(`Durée (Express) : ${formatMMSS(roundMs)}`);
  console.log("==============================");

  const cmd = await askTimed(
    rl,
    `Quand ${activePlayer} s'est tourné(e), appuyez sur Entrée (ou STOP) : `,
    roundMs,
    { announceMinutes: true, showOnceAtPrompt: false }
  );

  if (cmd === null) {
    console.log("Manche passée (timeout).");
    return { status: "OK", correct: false };
  }
  if (cmd.trim().toUpperCase() === "STOP") return { status: "STOP", correct: false };

  const res = await collectCluesExpress(rl, players, activeIndex, secretWord, banned, roundMs);
  if (res.status === "STOP") return { status: "STOP", correct: false };

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

  const guess = (await askTimed("Entrez votre réponse (ou STOP pour arrêter) : "))
    .trim()
    .toLowerCase();

  if (guess === "stop") return "STOP";

  if (guess === secretWord.toLowerCase()) {
    console.log("Bonne réponse, bien joué " + activePlayer + " et à toute l'équipe !");
  } else {
    console.log(`Mauvaise réponse. Le mot était : ${secretWord}`);
  }

  await askTimed(rl, "C'est la fin de cette manche n°" + roundIndex + ". Appuyez sur Entrée pour passez à la manche suivante...", roundMs, {
    announceMinutes: false,
    showOnceAtPrompt: false
  });

  return { status: "OK", correct };
}

module.exports = {
  drawRandomWords,
  playRoundExpress
};
