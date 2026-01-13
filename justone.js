// lancement du jeu
const readline = require("readline");
const fs = require("fs");
const path = require("path");

// Chargement du dictionnaire
const dictionary = JSON.parse(
  fs.readFileSync(path.join(__dirname, "dictionnaire.json"), "utf-8")
);

// Outils console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Pose une question et retourne la réponse (promesse)
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

// Tire N mots au hasard sans répétition
function drawRandomWords(words, count) {
  const pool = [...words];
  const result = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool[index]);
    pool.splice(index, 1); // on enlève le mot tiré
  }
  return result;
}

async function main() {
  // Choix du niveau 
  const niv = await ask(
    "Bienvenue dans Just One ! Choisissez un mode (F = Facile, M = Moyen, D = Difficile) : "
  );

  const lettre = niv.toUpperCase();

  if (!["F", "M", "D"].includes(lettre)) {
    console.log("Mode invalide. Relancez le programme et choisissez F, M ou D.");
    rl.close();
    return;
  }

  // Mapping vers les clés du dictionnaire 
  const levelKey =
    lettre === "F" ? "Facile" : lettre === "M" ? "Moyen" : "Difficile";

  console.log("Mode choisi :", levelKey);

  // Tirage des 13 mots 
  const deck = drawRandomWords(dictionary[levelKey], 13);

  // Saisie des joueurs
const players = [];
console.log("\nEntrez les noms des 5 joueurs (nom obligatoire) :");

for (let i = 0; i < 5; i++) {
    let name = "";

    // Boucle jusqu'à obtenir un nom non vide
    while (name === "") {
      name = await ask(`Joueur ${i + 1} : `);
      if (name === "") {
        console.log("Nom invalide. Veuillez entrer un nom non vide.");
      }
    }

    players.push(name);
}
  console.log("\nJoueurs enregistrés :", players);

rl.close();
}

// Démarrage du programme
main();