
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

function askPlain(question) {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));
}

function parseDurationToMs(input) {
  // accepte: "90" (secondes), "90s", "2m", "2:30", "150s"
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

async function main() {
  const niv = await askPlain(
    "Bienvenue dans Just One Express !\nChoisissez un mode (F = Facile, M = Intermédiaire, D = Difficile) : "
  );

  const lettre = niv.toUpperCase();
  if (!["F", "M", "D"].includes(lettre)) {
    console.log("Mode invalide.");
    rl.close();
    return;
  }

  const levelKey = lettre === "F" ? "Facile" : lettre === "M" ? "Moyen" : "Difficile";
  console.log("Vous avez choisi le mode", levelKey);

  // Durée (une seule fois)
  let roundMs = null;
  while (roundMs === null || roundMs < 5_000) {
    const d = await askPlain(
      "Durée d'une manche (ex: 90, 90s, 2m, 2:30) (min 5s) : "
    );
    roundMs = parseDurationToMs(d);
    if (roundMs === null) console.log("Format invalide.");
    else if (roundMs < 5_000) console.log("Trop court. Mets au moins 5 secondes.");
  }

  const deck = drawRandomWords(dictionary[levelKey], 13);

  const players = [];
  console.log("\nEntrez les noms des 5 joueurs :");

  for (let i = 0; i < 5; i++) {
    let name = "";
    while (!name) {
      name = await askPlain(`Joueur ${i + 1} : `);
      if (!name) console.log("Nom invalide.");
    }
    players.push(name);
  }

  let activeIndex = 0;
  let score = 0;

  for (let round = 0; round < deck.length; round++) {
    const res = await playRoundExpress(round, players, activeIndex, deck[round], rl, roundMs);

    if (res.status === "STOP") {
      console.log("Arrêt demandé. Fin de la partie.");
      break;
    }

    if (res.correct) score += 1;
    activeIndex = (activeIndex + 1) % players.length;
  }

  console.log("\nPartie terminée.");
  console.log(`Score final : ${score} / ${deck.length}`);
  rl.close();
}

main();
