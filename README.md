************************************************************
                 JUST ONE – VERSION JAVASCRIPT | ANAS SFAR - FARAH GATTOUFI - YOUSRA MOUNIM
************************************************************

Ce jeu est une adaptation en ligne de commande du jeu
coopératif Just One, développée en Node.js.

Le projet propose :
- une version classique
- une version Express avec contrainte de temps
- plusieurs améliorations par rapport au jeu original


### 1. PRINCIPE DU JEU 

- 5 joueurs
- Le jeu se joue en manches
- À chaque manche :
  - 1 joueur est désigné comme joueur actif
  - Les 4 autres joueurs donnent chacun UN indice (un seul mot) avec AUCUNE COMMUNICATION autorisée
  - Les indices identiques sont éliminés
  - Le joueur actif tente de deviner le mot secret

Le jeu est coopératif :
le score est commun à toute l’équipe.

### 2. DICTIONNAIRE

Contrairement au jeu original, les joueurs n'auront pas à choisir des mots. Il existe un dictionnaire avec 13 mots. Le dictionnaire est un fichier JSON structuré par modes de difficulté.

Exemple de carte :

{
  "word": "amour",
  "banned": ["aimer"]
}

Chaque carte contient :
- un mot secret (word)
- une liste de mots interdits (banned)

MODES DISPONIBLES :
- Facile
- Moyen
- Difficile
- TC (vocabulaire lié aux télécommunications)

Le dictionnaire est fixe :
aucune modification automatique n’est faite pendant le jeu.


### 3. REGLES DES INDICES

Un indice est REFUSE s’il :
- est vide
- contient plusieurs mots
- est identique au mot secret
- appartient à la liste des mots interdits (banned)

Chaque joueur doit donc proposer un indice original
et indirect.


### 4. GESTION DES DOUBLONS

- Tous les indices identiques (insensibles à la casse)
  sont éliminés automatiquement.
- Le joueur actif est informé :
  - du nombre d’indices éliminés
  - des indices restants

Exemple :
"2 indices ont été éliminés car identiques."


### 5. SYSTEME DE SCORE 

Le score est coopératif.

- +1 point : le mot est correctement deviné
-  0 point : mauvaise réponse ou manche ratée
- -1 point : des doublons sont éliminés

Le score final correspond au nombre de mots trouvés.


************************************************************
                    MODE EXPRESS
************************************************************

La version Just One Express ajoute une contrainte de temps
pour rendre le jeu plus dynamique et plus exigeant.


### 6. PRINCIPE DU MODE EXPRESS

- Une durée de manche est choisie au début de la partie
- Formats acceptés :
  - 90
  - 90s
  - 2m
  - 2:30

IMPORTANT :
Le chrono démarre UNIQUEMENT lorsque le joueur actif
se tourne (après validation).

Le temps est partagé entre :
- la saisie des indices
- la réponse finale du joueur actif


### 7. COMPORTEMENT DU TIMER

- Si le temps s’écoule pendant la manche :
  -> la manche est ratée

Le jeu continue normalement après la manche (pas d’arrêt brutal).


### 8. PENALITE EXPRESS (DOUBLONS)

- Si au moins un doublon est détecté sur une manche :
  -> 5 secondes sont retirées à la manche suivante

Un message est affiché au début de la manche suivante :

"Pénalité : -5 secondes à cause des doublons précédents."

### 9. LANCER LE JEU

Version classique :
> node justone.js

Version Express :
> node justoneexpress.js


### 10. AMELIORATIONS APPORTEES

- Implémentation complète en Node.js (CLI)
- Score dynamique
- Mode Express avec chrono réel
- Mode TC spécialisé (télécommunications)
- Un jumelage avec un dictionnaire extérieure est envisagé.


### 11. CONTEXTE

Projet réalisé dans un cadre pédagogique au sein de l'INSA de Lyon au département Télécommunications, Services et Usages en troisième année.

Projet réalisé par Anas Sfar, Farah Gattoufi et Yousra Mounim.

************************************************************
                        FIN
************************************************************
