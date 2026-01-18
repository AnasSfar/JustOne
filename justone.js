const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { drawRandomWords, playRound } = require("./.game.js");
const score = require("./.score.js");
score.resetScore();


// Charger le dictionnaire
const dictionary = JSON.parse(
  fs.readFileSync(path.join(__dirname, ".dictionnaire.json"), "utf-8")
);

// Fonction ask
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

// Interface readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  // Choix du niveau
  const niv = await ask(
    "Bienvenue dans Just One ! \nChoisissez un mode (TC = Version TC, F = Facile, M = Intermédiaire, D = Difficile) : "
  );

  const lettre = niv.toUpperCase();
  if (!["TC", "F", "M", "D"].includes(lettre)) {
    console.log("Mode invalide. Relancez le programme.");
    rl.close();
    return;
  }

  const levelKey =
    lettre === "F" ? "Facile" :
    lettre === "M" ? "Moyen" :
    lettre === "D" ? "Difficile" : 
    "TC";

  console.log("Vous avez choisi le mode", levelKey);

  // Tirage des 13 mots
  const deck = drawRandomWords(dictionary[levelKey], 13);

  // Saisie des joueurs
  const players = [];
  console.log("\nEntrez les noms des 5 joueurs :");

  for (let i = 0; i < 5; i++) {
    let name = "";
    while (name === "") {
      name = await ask(`Joueur ${i + 1} : `);
      if (name === "") console.log("Nom invalide. Veuillez entrer un nom non vide.");
    }
    players.push(name);
  }

  // Les manches
  let activeIndex = 0;

  for (let round = 0; round < deck.length; round++) {
    const status = await playRound(round, players, activeIndex, deck[round], ask);

    if (status === "STOP") {
      console.log("Arrêt demandé. Fin de la partie.");
      break;
    }

    // PASS ou OK -> on passe au joueur suivant et on continue
    activeIndex = (activeIndex + 1) % players.length;
  }

  // fin de partie
  console.log("\nPartie terminée.");
  console.log(`Score final : ${score.getScore()} / ${deck.length}`);
  rl.close();
}

// Démarrage
main();
