
// lancement du jeu 
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(
  "Bienvenue dans Just One ! Veuillez sélectionner un mode de jeu (F = Facile, M = Moyen, D = Difficile) : ",
  (niv) => {
    let choix = niv.toUpperCase();

    if (!["F", "M", "D"].includes(choix)) { //version not in de JavaScript
      console.log(
        "Mode invalide. Veuillez relancer le programme et choisir entre Facile, Moyen ou Difficile."
      );
      return;
    }
    
    if (choix === "F") {
        choix = "Facile";
    } else if (choix === "M") {
        choix = "Moyen";
    } else {
        choix = "Difficile";
    }

    console.log(
      "Mode choisi :", choix,
      ". Préparation du jeu... Si vous vous êtes trompé du niveau voulu, relancez le programme."
    );

    rl.close();
  }
);

//variables et constantes