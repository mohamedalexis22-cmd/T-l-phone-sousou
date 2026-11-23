#!/usr/bin/env node
/* =========================================================
   LISTE DES JOUEURS D'UN OU PLUSIEURS CHAMPIONNATS (Transfermarkt)

   node tools/tm-effectifs.js GB1 ES1 IT1 L1 FR1 > joueurs.txt
   puis : node tools/transfermarkt.js --fichier joueurs.txt

   Codes : GB1 Premier League · ES1 Liga · IT1 Serie A · L1 Bundesliga
           FR1 Ligue 1 · PO1 Portugal · NL1 Pays-Bas · SA1 Arabie saoudite
           TR1 Turquie · BE1 Belgique · MLS1 MLS
   Sortie : un identifiant Transfermarkt par ligne, du joueur le plus
   cher au moins cher (les plus connus sont importés en premier).
   ========================================================= */
const BASE = "https://www.transfermarkt.fr";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const DELAI = Number(process.env.TM_DELAI || 4000);

async function get(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9" } });
  if (!r.ok) throw new Error(`${r.status} sur ${url}`);
  return r.text();
}

// « 180,00 mio. € » / « 500 K € » → nombre
function valeur(txt) {
  const m = txt.replace(/\s/g, "").match(/([\d,]+)(mio|K|k)?/);
  if (!m) return 0;
  const n = Number(m[1].replace(",", "."));
  return /mio/i.test(m[2] || "") ? n * 1e6 : /k/i.test(m[2] || "") ? n * 1e3 : n;
}

(async () => {
  const codes = process.argv.slice(2);
  if (!codes.length) { console.error("Usage : node tools/tm-effectifs.js GB1 ES1 …"); process.exit(1); }
  const joueurs = new Map();
  for (const code of codes) {
    let h;
    try { h = await get(`${BASE}/-/startseite/wettbewerb/${code}`); } catch (e) { console.error(`✗ ${code} : ${e.message}`); continue; }
    const clubs = [...new Set([...h.matchAll(/href="\/[^"\/]+\/startseite\/verein\/(\d+)(?:\/saison_id\/\d+)?"/g)].map((m) => m[1]))];
    console.error(`${code} : ${clubs.length} clubs`);
    for (const c of clubs) {
      await pause(DELAI);
      let k;
      try { k = await get(`${BASE}/-/kader/verein/${c}`); } catch (e) { console.error(`  ✗ club ${c} : ${e.message}`); if (/403|429/.test(e.message)) await pause(180000); continue; }
      // chaque ligne de joueur : lien profil … valeur marchande
      const lignes = k.split(/<tr class="(?:odd|even)">/).slice(1);
      let n = 0;
      for (const l of lignes) {
        const id = (l.match(/\/profil\/spieler\/(\d+)/) || [])[1];
        if (!id) continue;
        const v = valeur((l.match(/class="rechts hauptlink">\s*<a[^>]*>([^<]*)</) || [])[1] || "");
        if (!joueurs.has(id) || joueurs.get(id) < v) joueurs.set(id, v);
        n++;
      }
      console.error(`  club ${c} : ${n} joueurs`);
    }
  }
  [...joueurs.entries()].sort((a, b) => b[1] - a[1]).forEach(([id]) => console.log(id));
  console.error(`Total : ${joueurs.size} joueurs`);
})();
