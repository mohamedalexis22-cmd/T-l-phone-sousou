#!/usr/bin/env node
/* =========================================================
   IMPORT TRANSFERMARKT → banque de joueurs

   node tools/transfermarkt.js <lien | id | "nom à chercher"> [...]
   node tools/transfermarkt.js --fichier joueurs.txt   (un par ligne)
   Option : --id monid   (identifiant court dans la banque, 1 joueur)

   Exemples :
     node tools/transfermarkt.js https://www.transfermarkt.fr/zinedine-zidane/profil/spieler/3111
     node tools/transfermarkt.js "Paolo Maldini" "Carles Puyol"

   Récupère depuis la page profil publique : prénom, nom, photo,
   date de naissance, nationalité, poste, sélections / buts en
   sélection, et la liste des clubs (historique des transferts).
   Les fiches vont dans data/joueurs-transfermarkt.js ; la photo
   dans assets/joueurs/. Si le joueur existe déjà dans
   data/joueurs.js, vos chiffres saisis à la main restent
   prioritaires (les deux sont fusionnés).

   ⚠ Les matchs/buts en club ne sont pas sur la page profil :
   ajoutez-les à la main (ou dans statsEpisode).
   ========================================================= */
const fs = require("fs");
const path = require("path");

const RACINE = path.resolve(__dirname, "..");
const SORTIE = path.join(RACINE, "data", "joueurs-transfermarkt.js");
const PHOTOS = path.join(RACINE, "assets", "joueurs");
const BASE = "https://www.transfermarkt.fr";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const MOIS = { janv: 1, févr: 2, fevr: 2, mars: 3, avr: 4, mai: 5, juin: 6, juil: 7, août: 8, aout: 8, sept: 9, oct: 10, nov: 11, déc: 12, dec: 12 };
const PAYS = {
  France: "FRA", Brésil: "BRA", Argentine: "ARG", Italie: "ITA", Espagne: "ESP", Allemagne: "GER", Angleterre: "ENG",
  Portugal: "POR", "Pays-Bas": "NED", Belgique: "BEL", Croatie: "CRO", Uruguay: "URU", "Côte d'Ivoire": "CIV",
  Sénégal: "SEN", Cameroun: "CMR", Algérie: "ALG", Maroc: "MAR", Tunisie: "TUN", Égypte: "EGY", Nigeria: "NGA",
  Ghana: "GHA", Mali: "MLI", Pologne: "POL", Suède: "SWE", Danemark: "DEN", Norvège: "NOR", Suisse: "SUI",
  Autriche: "AUT", "République tchèque": "CZE", Tchéquie: "CZE", Serbie: "SRB", Écosse: "SCO", "Pays de Galles": "WAL",
  Irlande: "IRL", "Irlande du Nord": "NIR", Russie: "RUS", Ukraine: "UKR", Turquie: "TUR", Grèce: "GRE", Colombie: "COL",
  Chili: "CHI", Mexique: "MEX", "États-Unis": "USA", Japon: "JPN", "Corée du Sud": "KOR", Bulgarie: "BUL", Hongrie: "HUN",
  Roumanie: "ROU", Slovénie: "SVN", Slovaquie: "SVK", Bosnie: "BIH", "Bosnie-Herzégovine": "BIH", Gabon: "GAB", Guinée: "GUI",
  "RD Congo": "COD", Paraguay: "PAR", Pérou: "PER", Équateur: "ECU", Venezuela: "VEN", Australie: "AUS", Canada: "CAN",
  Géorgie: "GEO", Finlande: "FIN", Islande: "ISL", "Burkina Faso": "BFA", Togo: "TOG", Liberia: "LBR",
};

const texte = (s) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&#0?39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const slugId = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function get(url, json = false) {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9" } });
  if (!r.ok) throw new Error(`${r.status} sur ${url}`);
  return json ? r.json() : r.text();
}

async function chercher(nom) {
  const h = await get(`${BASE}/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(nom)}`);
  const m = h.match(/href="(\/[^"]+\/profil\/spieler\/(\d+))"/);
  if (!m) throw new Error(`aucun joueur trouvé pour « ${nom} »`);
  return Number(m[2]);
}

function dateISO(s) {
  const m = s.match(/(\d{1,2})\s+([a-zéû]+)\.?\s+(\d{4})/i);
  if (m && MOIS[m[2].toLowerCase()]) return `${m[3]}-${String(MOIS[m[2].toLowerCase()]).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const n = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return n ? `${n[3]}-${n[2]}-${n[1]}` : "";
}

const JEUNES = /\b(U\d{2}|Form\.?|Formation|Jgd|Youth|Juniors?|B$|II$|Reserves?|Fin de carrière|Sans club|Inconnu|Pause)\b/i;

function clubsDepuisTransferts(liste) {
  const t = liste.slice().reverse(); // du plus ancien au plus récent
  const sejours = [];
  for (let i = 0; i < t.length; i++) {
    const club = t[i].to.clubName;
    if (JEUNES.test(club) || t[i].to.isSpecial) continue;
    const debut = Number((t[i].date || "").match(/(\d{4})$/)?.[1]) || null;
    const suivant = t.slice(i + 1).find((x) => x.to.clubName !== club);
    const fin = suivant ? Number((suivant.date || "").match(/(\d{4})$/)?.[1]) || null : null;
    const dernier = sejours[sejours.length - 1];
    if (dernier && dernier.club === club) { dernier.fin = fin; continue; }
    // prêt de retour au même club : on fusionne si consécutif
    sejours.push({ club, debut, fin, actif: !suivant && !t.slice(i + 1).some((x) => x.to.isSpecial) });
  }
  const fmt = (a, b, actif) => (!a ? "" : actif && !b ? `${a}–` : !b || a === b ? `${a}` : `${a}–${String(b).slice(2)}`);
  return sejours.filter((s) => !(s.debut && s.fin && s.fin < s.debut)).map((s) => [s.club, fmt(s.debut, s.fin, s.actif)]);
}

async function telechargerPhoto(url, id) {
  fs.mkdirSync(PHOTOS, { recursive: true });
  for (const u of [url.replace("/header/", "/big/"), url]) {
    try {
      const r = await fetch(u, { headers: { "User-Agent": UA } });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 2000) continue;
      const fichier = `assets/joueurs/${id}.jpg`;
      fs.writeFileSync(path.join(RACINE, fichier), buf);
      return fichier;
    } catch (e) { /* essai suivant */ }
  }
  return "";
}

async function importer(entree, idForce) {
  const tmId = /^\d+$/.test(entree) ? Number(entree) : (entree.match(/spieler\/(\d+)/) || [])[1] ? Number(entree.match(/spieler\/(\d+)/)[1]) : await chercher(entree);
  const h = await get(`${BASE}/-/profil/spieler/${tmId}`);

  const h1 = (h.match(/<h1 class="data-header__headline-wrapper">([\s\S]*?)<\/h1>/) || [])[1] || "";
  const nom = texte((h1.match(/<strong>([\s\S]*?)<\/strong>/) || [])[1] || "");
  const prenom = texte(h1.replace(/<span[\s\S]*?<\/span>/g, "").replace(/<strong>[\s\S]*?<\/strong>/, ""));
  const photoUrl = (h.match(/<img src="([^"]+)"[^>]*class="data-header__profile-image"/) || [])[1] || "";
  const ne = dateISO(texte((h.match(/itemprop="birthDate"[^>]*>([\s\S]*?)<\/span>/) || [])[1] || ""));
  const natTxt = texte((h.match(/itemprop="nationality"[^>]*>([\s\S]*?)<\/span>/) || [])[1] || "");
  const poste = texte((h.match(/data-header__label">Position:\s*<span[^>]*>([\s\S]*?)<\/span>/) || [])[1] || "");
  const sel = h.match(/Sélections internationales\/buts:\s*<a[^>]*>\s*(\d+)\s*<\/a>\s*\/\s*<a[^>]*>\s*(\d+)\s*<\/a>/);

  let clubs = [];
  try { clubs = clubsDepuisTransferts((await get(`${BASE}/ceapi/transferHistory/list/${tmId}`, true)).transfers || []); } catch (e) { console.warn("  (historique des clubs indisponible)"); }

  const id = idForce || slugId(nom || prenom) || String(tmId);
  const photo = photoUrl ? await telechargerPhoto(photoUrl, id) : "";
  const stats = {};
  if (sel) { stats.selections = Number(sel[1]); stats.butsSelection = Number(sel[2]); }

  return {
    id, prenom, nom, nation: PAYS[natTxt] || natTxt.slice(0, 3).toUpperCase(), poste, ne, clubs, photo, stats,
    transfermarkt: `${BASE}/-/profil/spieler/${tmId}`,
    source: "Transfermarkt", verifie: false, maj: new Date().toISOString().slice(0, 10),
  };
}

function lireExistants() {
  if (!fs.existsSync(SORTIE)) return [];
  const ctx = { window: {} };
  new Function("window", fs.readFileSync(SORTIE, "utf8").replace(/^[\s\S]*?window\.JOUEURS_TM\s*=/, "window.JOUEURS_TM =").split("/* fusion */")[0])(ctx.window);
  return ctx.window.JOUEURS_TM || [];
}

function ecrire(liste) {
  const corps = liste.map((j) => "  " + JSON.stringify(j)).join(",\n");
  fs.writeFileSync(SORTIE, `/* Généré par tools/transfermarkt.js — ne pas modifier à la main :
   relancez l'outil. Pour corriger un chiffre, mettez-le dans
   data/joueurs.js (même id) : il passe devant. */
window.JOUEURS_TM = [
${corps}
];
/* fusion */
(function () {
  window.JOUEURS = window.JOUEURS || [];
  window.JOUEURS_TM.forEach(function (t) {
    var m = window.JOUEURS.find(function (j) { return j.id === t.id; });
    if (!m) return window.JOUEURS.push(t);
    m.stats = Object.assign({}, t.stats, m.stats);
    ["prenom", "nom", "nation", "poste", "ne", "photo", "transfermarkt"].forEach(function (k) { if (!m[k]) m[k] = t[k]; });
    if (!m.clubs || !m.clubs.length) m.clubs = t.clubs;
  });
})();
`);
}

(async () => {
  const args = process.argv.slice(2);
  const i = args.indexOf("--id"); const idForce = i >= 0 ? args.splice(i, 2)[1] : null;
  const f = args.indexOf("--fichier");
  let entrees = f >= 0 ? fs.readFileSync(args.splice(f, 2)[1], "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : args;
  if (!entrees.length) { console.log("Usage : node tools/transfermarkt.js <lien | id | \"nom\"> [...]"); process.exit(1); }
  const liste = lireExistants();
  for (const e of entrees) {
    try {
      const j = await importer(e, entrees.length === 1 ? idForce : null);
      const k = liste.findIndex((x) => x.id === j.id);
      if (k >= 0) liste[k] = j; else liste.push(j);
      console.log(`✓ ${j.prenom} ${j.nom} (${j.id}) · ${j.nation} · ${j.poste} · ${j.clubs.length} clubs · sél. ${j.stats.selections ?? "—"}${j.photo ? " · photo" : ""}`);
    } catch (err) { console.log(`✗ ${e} : ${err.message}`); }
    await pause(1500); // on reste poli avec le site
  }
  ecrire(liste);
  console.log(`\n${liste.length} joueur(s) dans data/joueurs-transfermarkt.js`);
})();
