// Tutorial JavaScript
let c = 5; // créer une variable a et lui assigner la valeur 5
console.log("Variable a =", c); // afficher la valeur de a dans la console
c = 10; // modifier la valeur de a à 10
console.log("Variable a =", c); // afficher la valeur de a dans la console
console.log("Variable", c, "de type", typeof c); // afficher le type de a

//une variable ne peut commencer par un chiffre
//let 1stName = "John"; // ceci est incorrect

const myAge = 10; // créer une constante myAge et lui assigner la valeur 10

// créer un objet 
const user = { // créer un objet user avec des propriétés name et age
    name : "Anas",
    age: 20,
};
console.log("Utilisateur :", user.name, "a", user.age, "ans"); // afficher le nom et l'âge de l'utilisateur
console.log(user); // afficher l'objet user dans la console
console.log(user["name"]); // afficher la propriété name de l'objet user

// Créer un tableau 
const colors = ["rouge", "vert", "bleu"]; // créer un tableau colors avec trois couleurs
console.log("Couleurs disponibles :", colors); // afficher le tableau colors dans la console
console.log(colors[0]); // afficher le premier élément du tableau colors
// le tableau est un objet 

colors[0] = "jaune"; // modifier le premier élément du tableau colors
console.log(colors[0]); // afficher le premier élément du tableau colors


//conditions if else switch

if (c > 5) { // vérifier si c est supérieur à 5
    console.log("c est plus grand que 5");
} else if (c === 5) { // vérifier si c est égal à 5
    console.log("c est égal à 5");
}

if (user.name.length > 0) { // vérifier si l'objet user a des propriétés
    console.log("L'utilisateur a un nom");
} else {
    console.log("L'utilisateur n'a pas de nom");
}
 
// fonctions arrow / regular

function orange() { // définir une fonction orange
    // Block de la fonction
    let n = "orange";
    console.log(n);
}

orange(); // appeler la fonction orange

function nameColor(n) { // définir une fonction nameColor avec un paramètre n
    console.log(n);
    retrun n;   // retourner la valeur de n et on sort 
}

nameColor("orange"); // appeler la fonction nameColor avec l'argument "orange"
nameColor("bleu"); // appeler la fonction nameColor avec l'argument "bleu"

