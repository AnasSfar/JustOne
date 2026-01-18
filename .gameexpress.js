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

// Supprime les doublons (insensible à la casse) et renvoie kept/removed
function removeDuplicateClues(clues) {
  const counts = {};
  for (const { clue } of clues) {
    const key = clue.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  }

  const kept = [];
  const removed = [];

  for (const item of clues) {
    if (counts[item.clue.toLowerCase()] === 1) kept.push(item);
    else removed.push(item);
  }

  return { kept, removed };
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

    const killer = setTimeout(() => {
      if (done) return;
      process.stdout.write("\n");
      console.log("⏱ Temps écoulé !");
      cleanup();
      resolve(null);
    }, ms);
  });
}

// Pause simple (sans timer) pour éviter les comportements bizarres
function pause(rl, message) {
  return new Promise((resolve) => rl.question(message, () => resolve()));
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
        console.log("Indice interdit : le mot mystère lui-même.");
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
        console.log("Indice interdit (mot secret, anglais, ou mot très proche).");
        continue;
      }

      clues.push({ player: players[i], clue });
      break;
    }

    // Confirmation sans timer
    await pause(rl, "Indice enregistré. Entrée et passez le clavier au joueur suivant...");
  }

  console.clear();
  return { status: "OK", clues };
}

// Joue une manche Express (OPTION 1 : timeout => manche ratée, partie continue)
async function playRoundExpress(roundIndex, players, activeIndex, card, rl, roundMs) {
  const activePlayer = players[activeIndex];

  const secretWord = typeof card === "string" ? card : card.word;
  const banned =
    typeof card === "string"
      ? [secretWord.toLowerCase()]
      : (card.banned ?? [secretWord.toLowerCase()]);

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
    return { status: "OK", correct: false, duplicateCount: 0 };
  }
  if (cmd.trim().toUpperCase() === "STOP") {
    return { status: "STOP", correct: false, duplicateCount: 0 };
  }

  const res = await collectCluesExpress(rl, players, activeIndex, secretWord, banned, roundMs);
  if (res.status === "STOP") return { status: "STOP", correct: false, duplicateCount: 0 };

  const totalClues = res.clues.length;
  const { kept, removed } = removeDuplicateClues(res.clues);
  const eliminatedCount = totalClues - kept.length;

  // Affichage indices
  console.clear();
  console.log(`${activePlayer}, c'est à votre tour de deviner le mot !`);

  if (eliminatedCount > 0) {
    console.log(`⚠️ ${eliminatedCount} indice(s) ont été éliminé(s) car identiques.`);
  }

  if (kept.length === 0) {
    console.log("(Tous les indices ont été éliminés. Vous n'avez aucun indice. Bonne chance !)");
  } else {
    console.log("Voici les indices reçus :");
    kept.forEach(({ player, clue }, index) => {
      console.log(`- Indice ${index + 1} de ${player} : ${clue}`);
    });
  }

  const rawGuess = await askTimed(rl, "Entrez votre réponse (ou STOP) :", roundMs, {
    announceMinutes: true,
    showOnceAtPrompt: true
  });

  if (rawGuess === null) {
    console.log(`⏱ Temps écoulé. Mauvaise réponse. Le mot était : ${secretWord}`);
    await pause(rl, "Fin de manche. Entrée pour continuer...");
    return { status: "OK", correct: false, duplicateCount: eliminatedCount };
  }

  const guess = rawGuess.trim().toLowerCase();
  if (guess === "stop") return { status: "STOP", correct: false, duplicateCount: eliminatedCount };

  const correct = guess === secretWord.toLowerCase();
  if (correct) console.log("Bonne réponse !");
  else console.log(`Mauvaise réponse. Le mot était : ${secretWord}`);

  await pause(rl, "Fin de manche. Entrée pour continuer...");

  return { status: "OK", correct, duplicateCount: eliminatedCount };
}

module.exports = {
  drawRandomWords,
  playRoundExpress
};
