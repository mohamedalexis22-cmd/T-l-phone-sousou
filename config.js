// ─────────────────────────────────────────────────────────────
//  RÉGLAGES — tout ce que tu peux changer sans toucher au reste
// ─────────────────────────────────────────────────────────────
window.CONFIG = {
  owner: "sousou",
  her: "Nana 🌂",

  // Météo (vraie météo en direct)
  city: { name: "Troyes", lat: 48.2973, lon: 4.0744 },

  // Code à taper dans Téléphone → Clavier.
  // 129 = le grec qu'elle doit goûter, 707 = l'appart des deux Nana dans l'anime.
  code: "129707",

  // Jour J = le jour où tu lui envoies le lien (sert au Calendrier).
  // null = aujourd'hui. Sinon "2026-11-14".
  startDate: null,

  // L'appel final ne marche qu'à partir de ce moment (pour qu'elle galère 24 h).
  // null = tout de suite. Exemple : "2026-11-15T20:00:00+01:00"
  finaleOpensAt: null,

  // Tes comptes (laisse null si tu ne les utilises pas)
  youtubeUrl: null, // lien de la vidéo non répertoriée du solo
  insta: null,      // ex "@sousou.cache"
  snap: null,
  x: null,

  // Délais des notifications (en millisecondes)
  delays: { whatsapp: 7000, secret: 45000 },

  // Le texte qui s'écrit pendant le solo (1 ligne = 1 phrase de piano, 16 lignes)
  text: [
    "Dis, Nana…",
    "Tu te souviens de la première fois qu'on s'est parlé ?",
    "Moi oui. Et je crois que je vais m'en souvenir longtemps.",
    "Dans l'anime, deux filles avec le même prénom se croisent dans un train, sous la neige.",
    "Aucune des deux ne sait encore que sa vie vient de prendre un virage.",
    "Moi non plus, je savais pas.",
    "Je croyais pas trop au destin. Je trouvais ça bien pour les dessins animés.",
    "Et puis il y a eu toi.",
    "Ta voix, ton regard, ta façon de rire avant même la fin de mes phrases.",
    "Depuis, il y a des petits riens qui me ramènent à toi :",
    "une chanson qui passe, un prénom dans un générique, le chiffre sept.",
    "J'ai pas de groupe de rock, pas de studio, pas de chambre 707.",
    "J'ai juste un piano, quelques notes, et l'envie que tu les entendes.",
    "Je sais pas encore comment notre histoire se termine.",
    "Mais si c'est un anime… j'ai pas envie de sauter l'intro.",
    "— sousou",
  ],

  // Début de chaque phrase de piano (en secondes) — généré par tools/compose_piano.py
  timings: [0.6, 7.457, 14.314, 21.171, 28.029, 34.886, 41.743, 48.6, 55.457, 62.314, 69.171, 76.029, 82.886, 89.743, 96.6, 104.28],
};
