const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { drawRandomWords, playRoundExpress } = require("./.gameexpress.js");

const dictionary = JSON.parse(
  fs.readFileSync(path.join(__dirname, ".dictionnaire.json"), "utf-8")
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask simple (sans timer) pour config + noms
function askPlain(question) {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));
}

// Accepte: "90" (secondes), "90s", "2m", "2:30"
function parseDurationToMs(input) {
  const s = input.trim().toLowerCase();

  if (/^\d+:\d{1,2}$/.test(s)) {
    const [m, sec] = s.split(":").map(Number);
    return (m * 60 + sec) * 1000;
  }
  if (/^\d+m$/.test(s)) return Number(s.slice(0, -1)) * 60_000;
  if (/^\d+s$/.test(s)) return Number(s.slice(0, -1)) * 1000;
  if (/^\d+$/.test(s)) return Number(s) * 1000;

  return null;
}

function formatSeconds(ms) {
  return Math.ceil(ms / 1000);
}

async function main() {
  // Choix du niveau (4 modes)
  const niv = await askPlain(
    "Bienvenue dans Just One Express !\nChoisissez un mode (F = Facile, M = Moyen, D = Difficile, T = TC) : "
  );

  const lettre = niv.trim().toUpperCase();
  const MODE_MAP = { F: "Facile", M: "Moyen", D: "Difficile", T: "TC" };
  const levelKey = MODE_MAP[lettre];

  if (!levelKey || !dictionary[levelKey]) {
    console.log("Mode invalide. Relancez le programme.");
    console.log("Modes disponibles :", Object.keys(dictionary).join(", "));
    rl.close();
    return;
  }

  console.log("Vous avez choisi le mode", levelKey);

  // Durée des manches (une seule fois)
  let baseRoundMs = null;
  while (baseRoundMs === null || baseRoundMs < 5_000) {
    const d = await askPlain("Durée d'une manche (90, 90s, 2m, 2:30) : ");
    baseRoundMs = parseDurationToMs(d);
    if (baseRoundMs === null) console.log("Format invalide.");
    else if (baseRoundMs < 5_000) console.log("Trop court. Mets au moins 5 secondes.");
  }

  // Tirage des 13 mots
  const deck = drawRandomWords(dictionary[levelKey], 13);

  // Noms des joueurs
  const players = [];
  console.log("\nEntrez les noms des 5 joueurs :");

  for (let i = 0; i < 5; i++) {
    let name = "";
    while (!name) {
      name = await askPlain(`Joueur ${i + 1} : `);
      if (!name) console.log("Nom invalide. Veuillez entrer un nom non vide.");
    }
    players.push(name);
  }

  // Manches
  let activeIndex = 0;
  let score = 0;

  // temps variable (pénalité -5s si doublons)
  let currentRoundMs = baseRoundMs;

  for (let round = 0; round < deck.length; round++) {
    const res = await playRoundExpress(round, players, activeIndex, deck[round], rl, currentRoundMs);

    if (res.status === "STOP") {
      console.log("Arrêt demandé. Fin de la partie.");
      break;
    }

    if (res.correct) score += 1;

    // Pénalité -5s à la manche suivante si doublons détectés
    if ((res.duplicateCount ?? 0) > 0) {
      currentRoundMs = Math.max(5_000, currentRoundMs - 5_000);
      console.log(
        `⏱ Pénalité doublon: -5s. Prochaine manche: ${formatSeconds(currentRoundMs)}s`
      );
    }

    activeIndex = (activeIndex + 1) % players.length;
  }

  // Fin de partie
  console.log("\nPartie terminée.");
  console.log(`Score final : ${score} / ${deck.length}`);
  rl.close();
}

main();
