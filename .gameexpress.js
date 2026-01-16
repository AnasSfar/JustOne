const readline = require("readline");

/**
 * Tire N mots au hasard sans répétition
 */
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
  const s = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * Pose une question avec un timer qui:
 * - affiche en continu "Temps restant: mm:ss"
 * - annonce "Il reste 4/3/2/1 minute(s)" quand on franchit ces seuils
 * - retourne string saisie, ou null si timeout
 *
 * NOTE: nécessite accès direct à rl (readline.Interface)
 */
function askTimed(rl, question, ms, opts = {}) {
  const { announceMinutes = true, showCountdown = true } = opts;

  return new Promise((resolve) => {
    const start = Date.now();
    let done = false;

    // seuils minutes à annoncer
    const targets = new Set([4, 3, 2, 1]);
    const announced = new Set();

    // Prépare prompt
    rl.setPrompt(question);
    rl.prompt(true);

    const cleanup = () => {
      if (done) return;
      done = true;
      rl.removeListener("line", onLine);
      clearInterval(ticker);
      clearTimeout(killer);
      // Nettoie la ligne de countdown
      if (showCountdown) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
      }
    };

    const redrawCountdown = (remaining) => {
      if (!showCountdown) return;

      // Sauvegarde ce que l'utilisateur a déjà tapé
      const currentInput = rl.line ?? "";

      // Efface la ligne courante et écrit le countdown
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`Temps restant: ${formatMMSS(remaining)}  `);

      // Redessine le prompt + l'input en cours
      // (réaffiche correctement ce que la personne tape)
      process.stdout.write("\n");
      rl.prompt(true);
      rl.write(currentInput);
    };

    const maybeAnnounce = (remaining) => {
      if (!announceMinutes) return;

      // minutes restantes arrondies au supérieur (ex: 4:01 => 5, 3:59 => 4)
      const minLeft = Math.ceil(remaining / 60000);

      if (targets.has(minLeft) && !announced.has(minLeft)) {
        announced.add(minLeft);
        // saute une ligne proprement pour ne pas casser le prompt
        process.stdout.write("\n");
        console.log(`Il reste ${minLeft} minute${minLeft > 1 ? "s" : ""}.`);
        rl.prompt(true);
      }
    };

    const onLine = (line) => {
      cleanup();
      resolve(line.trim());
    };

    rl.once("line", onLine);

    // ticker visuel + annonces
    const ticker = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = ms - elapsed;

      if (remaining <= 0) return; // le killer gère la fin proprement
      maybeAnnounce(remaining);
      redrawCountdown(remaining);
    }, 250);

    // timeout “dur”
    const killer = setTimeout(() => {
      // saute une ligne pour éviter de coller au prompt
      process.stdout.write("\n");
      console.log("⏱ Temps écoulé !");
      cleanup();
      resolve(null);
    }, ms);
  });
}

/**
 * Collecte des indices (Express)
 * Règle: si timeout sur un indice -> indice perdu (on continue)
 */
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
      { announceMinutes: true, showCountdown: true }
    );

    if (gate === null) {
      // timeout sur "gate" => on considère que le joueur perd son tour d'indice
      continue;
    }
    if (gate.trim().toUpperCase() === "STOP") return { status: "STOP", clues };

    // Saisie de l'indice (1 mot, non vide, non interdit) avec timer
    while (true) {
      const raw = await askTimed(
        rl,
        "Entrez votre indice (1 mot) : ",
        roundMs,
        { announceMinutes: true, showCountdown: true }
      );

      if (raw === null) {
        // timeout => indice perdu
        break;
      }

      const clue = raw.trim().toLowerCase();
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
        console.log(
          "Indice interdit (interdit : le mot secret lui-même, sa traduction, ou un mot très proche)."
        );
        continue;
      }

      clues.push({ player: players[i], clue });
      break;
    }

    await askTimed(
      rl,
      "Indice enregistré. Appuyez sur Entrée et passez le clavier au joueur suivant...",
      roundMs,
      { announceMinutes: false, showCountdown: false }
    );
  }

  console.clear();
  return { status: "OK", clues };
}

/**
 * Joue une manche Express
 * Règle: si timeout sur la réponse => faux
 */
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
    { announceMinutes: true, showCountdown: true }
  );

  if (cmd === null) {
    // timeout => on passe la manche (ou tu peux décider STOP)
    console.log("Manche passée (timeout).");
    return { status: "OK", correct: false };
  }
  if (cmd.trim().toUpperCase() === "STOP") return { status: "STOP", correct: false };

  const res = await collectCluesExpress(rl, players, activeIndex, secretWord, banned, roundMs);
  if (res.status === "STOP") return { status: "STOP", correct: false };

  // Réponse du joueur actif
  console.clear();
  console.log(`${activePlayer}, c'est à votre tour de deviner le mot !`);
  console.log("Voici les indices reçus :");
  res.clues.forEach(({ player, clue }, index) => {
    console.log(`- Indice ${index + 1} de ${player} : ${clue}`);
  });

  const rawGuess = await askTimed(
    rl,
    "Entrez votre réponse (ou STOP) : ",
    roundMs,
    { announceMinutes: true, showCountdown: true }
  );

  if (rawGuess === null) {
    console.log(`Temps écoulé. Mauvaise réponse. Le mot était : ${secretWord}`);
    await askTimed(rl, "Fin de manche. Entrée pour continuer...", roundMs, {
      announceMinutes: false,
      showCountdown: false
    });
    return { status: "OK", correct: false };
  }

  const guess = rawGuess.trim().toLowerCase();
  if (guess === "stop") return { status: "STOP", correct: false };

  const correct = guess === secretWord.toLowerCase();
  if (correct) console.log("Bonne réponse !");
  else console.log(`Mauvaise réponse. Le mot était : ${secretWord}`);

  await askTimed(rl, "Fin de manche. Entrée pour continuer...", roundMs, {
    announceMinutes: false,
    showCountdown: false
  });

  return { status: "OK", correct };
}

module.exports = {
  drawRandomWords,
  playRoundExpress
};
