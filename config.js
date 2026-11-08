// ─────────────────────────────────────────────────────────────
//  RÉGLAGES — tout ce que tu peux changer sans toucher au reste
// ─────────────────────────────────────────────────────────────
window.CONFIG = {
  owner: "sousou",
  her: "Nana 🌂",

  // Météo (vraie météo en direct)
  city: { name: "Troyes", lat: 48.2973, lon: 4.0744 },

  // Code pour déverrouiller le téléphone (et l'album « Masqués »).
  // 0312 = la date de la photo de toi bébé, montrée dans « Souvenirs » sur l'écran verrouillé.
  lockCode: "0312",

  // Mot de passe de la note verrouillée « le numéro ».
  // Indice réel : Shams dit « le premier générique » → Rose (+ la capture « Rose » dans Masqués).
  notesPassword: "rose",

  // Vidéos cachées dans Galerie → Masqués (mets ta vidéo ici quand tu l'as tournée,
  // le fichier va dans media/). La première de la liste s'affiche en premier.
  hiddenVideos: ["v8.mp4", "v9.mp4"],

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

  // La lettre qui s'écrit au stylo plume pendant le solo de piano
  letter: {
    place: "Troyes",
    greeting: "Nana,",
    paragraphs: [
      "Ça fait deux mois qu'on se parle, et j'ai l'impression que c'est passé à une vitesse… waw.",
      "Au début, quand je suis venu te parler, je te trouvais juste belle. Maintenant, c'est ta personne que je trouve belle.",
      "On ne s'est jamais vus. Je ne vais pas te dire que je me suis attaché à toi, parce qu'on ne peut pas s'attacher à quelqu'un qu'on n'a jamais vu. Mais je me suis attaché à la personne que tu es.",
      "Je te respecte beaucoup. Toi, Haki, ton addiction au rose, ton addiction au mimi… C'est ça que j'aime chez toi : tu es toi-même.",
      "Je ne t'écris pas tout ça pour te séduire. Je te l'écris pour te dire que tu es une fille superbe. Avec tout ce qui t'est arrivé, tu aurais pu devenir quelqu'un de mauvais, et personne au monde ne t'en aurait voulu. Mais toi, tu as choisi la bonté.",
      "Je tenais à te l'écrire, parce que je ne sais pas si on te le dit assez. Alors sache-le :",
      "Eiva, tu es une femme merveilleuse, qui a conquis mon cœur. Je ne te le cache pas.",
    ],
    signature: "Sousou 🤍",
  },
};
