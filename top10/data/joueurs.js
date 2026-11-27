/* =========================================================
   BANQUE DE JOUEURS — commune à TOUS les épisodes.

   Un joueur = une fiche. On l'ajoute une fois, on le réutilise
   dans n'importe quel Top 10. Les stats propres à un thème
   (ex. « matchs en tant que capitaine ») se mettent soit ici
   dans `stats`, soit dans l'épisode (`statsEpisode`).

   Champs :
     id           identifiant court, sans espace (ex. "zidane")
     prenom, nom  affichés sur les cartes
     surnom       (facultatif) remplace le nom à l'écran : "Ronaldinho"
     nation       code pays 3 lettres (FRA, BRA, ITA…)
     poste        texte libre (ex. "Milieu offensif")
     ne           date de naissance "AAAA-MM-JJ" (facultatif)
     clubs        [["Club", "début–fin"], …]
     photo        "assets/joueurs/<id>.png" (facultatif ; sinon
                  les initiales s'affichent)
     stats        { cle: valeur } — clés libres, voir STATS_LABELS
     palmares     liste de textes courts (facultatif)
     source       d'où viennent les chiffres (lien, site…)
     verifie      true quand quelqu'un a vérifié les chiffres
     maj          date de la dernière mise à jour des chiffres

   ⚠ Les fiches ci-dessous sont des EXEMPLES de départ, saisies
   de mémoire : verifie = false. Vérifiez chaque chiffre avant
   tournage (la régie liste les fiches non vérifiées).
   ========================================================= */

// Libellés par défaut des clés de stats (un épisode peut les renommer)
window.STATS_LABELS = {
  matchs: "Matchs",
  buts: "Buts",
  passes: "Passes déc.",
  selections: "Sélections",
  butsSelection: "Buts en sélection",
  matchsCapitaine: "Matchs capitaine",
  selectionsCapitaine: "Sél. capitaine",
  tropheesCapitaine: "Trophées capitaine",
  trophees: "Trophées",
  ballonsOr: "Ballons d'Or",
  coupesMonde: "Coupes du monde",
  ligueChampions: "Ligues des champions",
  championnats: "Championnats",
};

window.JOUEURS = [
  {
    id: "zidane", prenom: "Zinédine", nom: "Zidane", nation: "FRA",
    poste: "Milieu offensif", ne: "1972-06-23",
    clubs: [["Cannes", "1988–92"], ["Bordeaux", "1992–96"], ["Juventus", "1996–01"], ["Real Madrid", "2001–06"]],
    stats: { selections: 108, butsSelection: 31, ballonsOr: 1, coupesMonde: 1, ligueChampions: 1 },
    palmares: ["Coupe du monde 1998", "Euro 2000", "Ligue des champions 2002", "Ballon d'Or 1998"],
    source: "", verifie: false, maj: "",
  },
  {
    id: "henry", prenom: "Thierry", nom: "Henry", nation: "FRA",
    poste: "Attaquant", ne: "1977-08-17",
    clubs: [["Monaco", "1994–99"], ["Juventus", "1999"], ["Arsenal", "1999–07"], ["Barcelone", "2007–10"], ["New York RB", "2010–14"]],
    stats: { ballonsOr: 0, selections: 123, butsSelection: 51, coupesMonde: 1, ligueChampions: 1 },
    palmares: ["Coupe du monde 1998", "Euro 2000", "Ligue des champions 2009"],
    source: "", verifie: false, maj: "",
  },
  {
    id: "maldini", prenom: "Paolo", nom: "Maldini", nation: "ITA",
    poste: "Défenseur", ne: "1968-06-26",
    clubs: [["AC Milan", "1985–09"]],
    stats: { ballonsOr: 0, matchs: 902, selections: 126, butsSelection: 7, ligueChampions: 5, championnats: 7 },
    palmares: ["5 Coupes d'Europe / Ligues des champions", "7 Serie A"],
    source: "", verifie: false, maj: "",
  },
  {
    id: "ronaldinho", prenom: "Ronaldo de Assis", nom: "Moreira", surnom: "Ronaldinho", nation: "BRA",
    poste: "Milieu offensif", ne: "1980-03-21",
    clubs: [["Grêmio", "1998–01"], ["PSG", "2001–03"], ["Barcelone", "2003–08"], ["AC Milan", "2008–11"], ["Flamengo", "2011–12"], ["Atlético Mineiro", "2012–14"]],
    stats: { selections: 97, butsSelection: 33, ballonsOr: 1, coupesMonde: 1, ligueChampions: 1 },
    palmares: ["Coupe du monde 2002", "Ligue des champions 2006", "Ballon d'Or 2005"],
    source: "", verifie: false, maj: "",
  },
  {
    id: "pirlo", prenom: "Andrea", nom: "Pirlo", nation: "ITA",
    poste: "Milieu", ne: "1979-05-19",
    clubs: [["Brescia", "1995–98"], ["Inter", "1998–01"], ["AC Milan", "2001–11"], ["Juventus", "2011–15"], ["New York City", "2015–17"]],
    stats: { ballonsOr: 0, selections: 116, butsSelection: 13, coupesMonde: 1, ligueChampions: 2 },
    palmares: ["Coupe du monde 2006", "Ligues des champions 2003 et 2007"],
    source: "", verifie: false, maj: "",
  },
  {
    id: "iniesta", prenom: "Andrés", nom: "Iniesta", nation: "ESP",
    poste: "Milieu", ne: "1984-05-11",
    clubs: [["Barcelone", "2002–18"], ["Vissel Kobe", "2018–23"], ["Emirates Club", "2023–24"]],
    stats: { ballonsOr: 0, selections: 131, butsSelection: 13, coupesMonde: 1, ligueChampions: 4 },
    palmares: ["Coupe du monde 2010", "Euros 2008 et 2012", "4 Ligues des champions"],
    source: "", verifie: false, maj: "",
  },
  {
    id: "xavi", prenom: "Xavier", nom: "Hernández", surnom: "Xavi", nation: "ESP",
    poste: "Milieu", ne: "1980-01-25",
    clubs: [["Barcelone", "1998–15"], ["Al Sadd", "2015–19"]],
    stats: { ballonsOr: 0, selections: 133, butsSelection: 13, coupesMonde: 1, ligueChampions: 4 },
    palmares: ["Coupe du monde 2010", "Euros 2008 et 2012", "4 Ligues des champions"],
    source: "", verifie: false, maj: "",
  },
  {
    id: "kaka", prenom: "Ricardo", nom: "Izecson dos Santos Leite", surnom: "Kaká", nation: "BRA",
    poste: "Milieu offensif", ne: "1982-04-22",
    clubs: [["São Paulo", "2001–03"], ["AC Milan", "2003–09"], ["Real Madrid", "2009–13"], ["Orlando City", "2015–17"]],
    stats: { selections: 92, butsSelection: 29, ballonsOr: 1, coupesMonde: 1, ligueChampions: 1 },
    palmares: ["Coupe du monde 2002", "Ligue des champions 2007", "Ballon d'Or 2007"],
    source: "", verifie: false, maj: "",
  },
  {
    id: "buffon", prenom: "Gianluigi", nom: "Buffon", nation: "ITA",
    poste: "Gardien", ne: "1978-01-28",
    clubs: [["Parme", "1995–01"], ["Juventus", "2001–18"], ["PSG", "2018–19"], ["Juventus", "2019–21"], ["Parme", "2021–23"]],
    stats: { butsSelection: 0, ballonsOr: 0, ligueChampions: 0, selections: 176, coupesMonde: 1 },
    palmares: ["Coupe du monde 2006"],
    source: "", verifie: false, maj: "",
  },
  {
    id: "r9", prenom: "Ronaldo Luís", nom: "Nazário de Lima", surnom: "Ronaldo", nation: "BRA",
    poste: "Attaquant", ne: "1976-09-18",
    clubs: [["Cruzeiro", "1993–94"], ["PSV", "1994–96"], ["Barcelone", "1996–97"], ["Inter", "1997–02"], ["Real Madrid", "2002–07"], ["AC Milan", "2007–08"], ["Corinthians", "2009–11"]],
    stats: { ligueChampions: 0, selections: 98, butsSelection: 62, ballonsOr: 2, coupesMonde: 2 },
    palmares: ["Coupes du monde 1994 et 2002", "Ballons d'Or 1997 et 2002"],
    source: "", verifie: false, maj: "",
  },
  {
    id: "drogba", prenom: "Didier", nom: "Drogba", nation: "CIV",
    poste: "Attaquant", ne: "1978-03-11",
    clubs: [["Le Mans", "1998–02"], ["Guingamp", "2002–03"], ["Marseille", "2003–04"], ["Chelsea", "2004–12"], ["Galatasaray", "2013–14"], ["Chelsea", "2014–15"]],
    stats: { ballonsOr: 0, selections: 105, butsSelection: 65, ligueChampions: 1 },
    palmares: ["Ligue des champions 2012"],
    source: "", verifie: false, maj: "",
  },
  {
    id: "raul", prenom: "Raúl", nom: "González", surnom: "Raúl", nation: "ESP",
    poste: "Attaquant", ne: "1977-06-27",
    clubs: [["Real Madrid", "1994–10"], ["Schalke 04", "2010–12"], ["Al Sadd", "2012–14"], ["New York Cosmos", "2014–15"]],
    photo: "assets/joueurs/raul.jpg",
    photoCredit: "Photo : Wikimedia Commons, « Raúl González in Real Madrid 2009 », CC BY-SA 2.0",
    stats: { selections: 102, butsSelection: 44 },
    source: "saisie manuelle (Transfermarkt indisponible)", verifie: false, maj: "2026-11-27",
  },
];