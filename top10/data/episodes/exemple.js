/* =========================================================
   ÉPISODE D'EXEMPLE — sert de démo du kit.
   Pour un nouvel épisode : copiez _modele.js, renommez-le
   (ex. capitaines.js) et ajoutez-le dans data/episodes/liste.js.
   ========================================================= */
EPISODES.exemple = {
  titre: "Les meilleurs joueurs des années 2000",
  numero: 0,
  date: "",

  // Présentateurs (2 ou 3 conseillés). `id` court, `nom` affiché.
  animateurs: [
    { id: "a1", nom: "Sulayman" },
    { id: "a2", nom: "Mosses" },
  ],

  // Textes des parties (facultatifs — sinon textes par défaut)
  journee: "Comment s'est passée la journée ?",

  // Objectifs de la semaine (incrustation sur la caméra plein cadre)
  objectifs: {
    a1: ["Objectif numéro un", "Objectif numéro deux", "Objectif numéro trois"],
    a2: ["Objectif numéro un", "Objectif numéro deux"],
  },

  // Les 4 stats affichées sur la fiche (clés de STATS_LABELS ou nouvelles).
  // `label` remplace le libellé, `accent: true` la met en lila.
  stats: [
    { cle: "selections" },
    { cle: "butsSelection" },
    { cle: "ballonsOr", accent: true },
    { cle: "ligueChampions" },
  ],

  // Stats propres à ce thème : { idJoueur: { cle: valeur } }
  statsEpisode: {},

  // Mentions honorables : [idJoueur, idAnimateur]
  mentions: [
    ["maldini", "a1"],
    ["drogba", "a2"],
    ["buffon", "a1"],
  ],

  // Classement de chacun — index 0 = n°1, index 9 = n°10.
  // Un nom absent de la banque peut être écrit tel quel : "Pavel Nedvěd".
  classements: {
    a1: ["zidane", "ronaldinho", "r9", "henry", "xavi", "iniesta", "kaka", "pirlo", "buffon", "drogba"],
    a2: ["ronaldinho", "zidane", "henry", "r9", "kaka", "iniesta", "xavi", "maldini", "pirlo", "nedved"],
  },

  // Arguments affichés sous la fiche : "idAnimateur:idJoueur": "texte"
  arguments: {
    "a1:zidane": "Le joueur des grands soirs : deux têtes en finale de Coupe du monde, une volée en finale de Ligue des champions.",
    "a2:ronaldinho": "Le seul qui a fait applaudir le Bernabéu en étant adversaire. La décennie lui appartient.",
  },

  // Afficher après chaque rang l'écran « duo » (les choix côte à côte)
  duo: true,
};
