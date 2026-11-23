/* Exemple affiché au premier lancement du studio (avant que vous remplissiez). */
window.EPISODE_DEMO = (function () {
  const s = (joueur, valeurs, argument) => ({ joueur, nomLibre: "", valeurs, argument: argument || "", photo: "" });
  const v = (j) => {
    const b = (window.JOUEURS || []).find((x) => x.id === j) || { stats: {} };
    return [b.stats.selections ?? "", b.stats.butsSelection ?? "", "", ""];
  };
  const liste = (ids) => ids.map((id) => s(id, v(id)));
  const ep = {
    exemple: true,
    titreRecap: "Nos classements",
    cote: "droite",
    animateurs: [{ id: "a1", nom: "Sulayman" }, { id: "a2", nom: "Mosses" }],
    stats: [{ label: "Sélections" }, { label: "Buts en sélection" }, { label: "Ballons d'Or", accent: true }, { label: "Ligues des champions" }],
    classements: {
      a1: liste(["zidane", "ronaldinho", "r9", "henry", "xavi", "iniesta", "kaka", "pirlo", "buffon", "drogba"]),
      a2: liste(["ronaldinho", "zidane", "henry", "r9", "kaka", "iniesta", "xavi", "maldini", "pirlo", "pavel-nedved"]),
    },
  };
  ep.classements.a1[0].valeurs = ["108", "31", "1", "1"];
  ep.classements.a1[0].argument = "Le joueur des grands soirs : deux têtes en finale de Coupe du monde.";
  ep.classements.a1[9].valeurs = ["105", "65", "0", "1"];
  return ep;
})();
