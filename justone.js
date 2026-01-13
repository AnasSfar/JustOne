// lancement du jeu
const readline = require("readline");
const fs = require("fs");
const path = require("path");

    // Charger le dictionnaire (une seule fois)
const dictionary = JSON.parse(
  fs.readFileSync(path.join(__dirname, "dictionnaire.json"), "utf-8")
);

    // Fonction pour tirer N mots au hasard sans répétition
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(
  "Bienvenue dans Just One ! Veuillez sélectionner un mode de jeu (F = Facile, M = Intermédiaire, D = Difficile) : ",
  (niv) => {
    const lettre = niv.trim().toUpperCase();

    if (!["F", "M", "D"].includes(lettre)) {
      console.log("Mode invalide. Veuillez relancer le programme et choisir F, M ou D.");
      rl.close();
      return;
    }

    // Mapping vers les clés du dictionnaire
    const levelKey = lettre === "F" ? "Facile" : lettre === "M" ? "Moyen" : "Difficile";

    console.log("Mode choisi :", levelKey);

    // Tirage de 13 mots selon le niveau choisi
    const deck = drawRandomWords(dictionary[levelKey], 13);

    rl.close();
  }
);