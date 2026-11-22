/* =========================================================
   MODÈLE D'ÉPISODE — à copier pour chaque nouveau Top 10.
   1. Copiez ce fichier : data/episodes/mon-theme.js
   2. Remplacez "_modele" ci-dessous par "mon-theme"
   3. Ajoutez "mon-theme" dans data/episodes/liste.js
   4. Remplissez au fur et à mesure (les cases vides s'affichent « — »)
   ========================================================= */
EPISODES._modele = {
  titre: "Titre du top 10",
  numero: 1,
  date: "",

  animateurs: [
    { id: "a1", nom: "Sulayman" },
    { id: "a2", nom: "Mosses" },
  ],

  journee: "Comment s'est passée la journée ?",

  objectifs: {
    a1: ["", ""],
    a2: ["", ""],
  },

  // 4 stats conseillées (2×2 sur la fiche). Exemple pour un thème capitaines :
  //   { cle: "matchs" }, { cle: "matchsCapitaine", accent: true },
  //   { cle: "selectionsCapitaine" }, { cle: "tropheesCapitaine" }
  stats: [
    { cle: "matchs" },
    { cle: "buts" },
    { cle: "selections" },
    { cle: "trophees", accent: true },
  ],

  // Chiffres propres au thème, sans toucher la banque :
  //   statsEpisode: { zidane: { matchsCapitaine: 0 } }
  statsEpisode: {},

  mentions: [
    // ["idJoueur", "a1"],
  ],

  // index 0 = n°1 … index 9 = n°10 (ids de la banque ou noms libres)
  classements: {
    a1: ["", "", "", "", "", "", "", "", "", ""],
    a2: ["", "", "", "", "", "", "", "", "", ""],
  },

  arguments: {
    // "a1:idJoueur": "Pourquoi il est là.",
  },

  duo: true,
};
