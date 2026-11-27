/* =========================================================
   TOPSIDE — moteur des écrans
   Deux écrans :
     • fiche  : présentation d'un joueur, posée sur la caméra
     • recap  : les classements de chacun à la fin
   Les données viennent du studio (index.html), enregistrées
   dans le navigateur (localStorage « topside-studio »).
   ========================================================= */
(function () {
  "use strict";

  const M = window.MARQUE;
  const BANQUE = Object.fromEntries((window.JOUEURS || []).map((j) => [j.id, j]));
  const CLE = "topside-studio";

  /* ---------- Outils ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const d = (ms) => `style="animation-delay:${ms}ms"`;

  // Un emplacement du classement → joueur affichable
  function resoudre(slot) {
    if (!slot) return null;
    const base = slot.joueur && BANQUE[slot.joueur] ? BANQUE[slot.joueur] : null;
    const libre = (slot.nomLibre || "").trim();
    if (!base && !libre) return null;
    let j;
    if (base) j = Object.assign({}, base);
    else {
      const mots = libre.split(/\s+/);
      const nom = mots.length > 1 ? mots.pop() : mots[0];
      j = { libre: true, prenom: mots.join(" "), nom, clubs: [] };
    }
    if (slot.photo) j.photo = slot.photo;
    return j;
  }
  const nomComplet = (j) => (j ? j.surnom || [j.prenom, j.nom].filter(Boolean).join(" ") : "—");
  const nomCourt = (j) => (j ? j.surnom || j.nom || j.prenom : "—");
  const initiales = (j) => (!j ? "?" : j.surnom ? j.surnom.slice(0, 2) : ((j.prenom || "")[0] || "") + ((j.nom || "")[0] || "")).toUpperCase();
  const animateur = (ep, id) => ep.animateurs.find((a) => a.id === id) || { id, nom: id };

  function periode(j) {
    if (!j || !j.clubs || !j.clubs.length) return "";
    const a = String(j.clubs[0][1] || "").slice(0, 4);
    const last = String(j.clubs[j.clubs.length - 1][1] || "");
    if (/–$/.test(last)) return a ? `depuis ${a}` : "";
    const m = last.match(/(\d{2,4})\s*$/);
    let b = m ? m[1] : "";
    if (b.length === 2) b = (Number(b) > 50 ? "19" : "20") + b;
    return a && b && a !== b ? `${a} – ${b}` : a;
  }
  const infoLigne = (j) => (j ? [j.poste, j.nation, periode(j)].filter(Boolean).join(" · ") : "");

  function compteur(v, delai) {
    const s = String(v ?? "").trim();
    if (!s) return `<span>—</span>`;
    if (!/^[\d\s .,]+$/.test(s)) return `<span>${esc(s)}</span>`;
    const n = Number(s.replace(/[\s ]/g, "").replace(",", "."));
    if (!isFinite(n)) return `<span>${esc(s)}</span>`;
    return `<span data-compte="${n}" data-delai="${delai}">0</span>`;
  }

  /* ---------- Décor ---------- */
  const ardoise = () => `<div class="ardoise">
      <i class="effacee" style="left:180px;top:140px;width:620px;height:260px"></i>
      <i class="effacee" style="left:1180px;top:620px;width:560px;height:220px"></i>
      <i class="effacee" style="left:860px;top:80px;width:380px;height:160px"></i></div>`;
  const sticker = () => `<div class="sticker a a-pose" style="animation-delay:100ms;--r:-8deg"><img src="${esc(M.logo)}" alt=""></div>`;
  const scotch = (cls, ms, r = 0) => `<div class="scotch ${cls} a a-scotch" style="animation-delay:${ms}ms;--r:${r}deg"></div>`;

  function photo(j, style, ms) {
    const img = j && j.photo ? `<img src="${esc(j.photo)}" alt="">` : "";
    const nat = j && j.nation ? `<span class="nat">${esc(j.nation)}</span>` : "";
    return `<div class="photo a a-pose" style="${style};animation-delay:${ms}ms">${nat}
      <div class="img"><span class="ini">${esc(initiales(j))}</span>${img}</div>
      <div class="legende">${esc(nomCourt(j))}</div></div>`;
  }

  /* ---------- Écrans ---------- */
  const SCENES = {
    // Présentation d'un joueur, sur la caméra plein cadre
    fiche(ep, p) {
      const a = animateur(ep, p.a);
      const slot = p.slot || ((ep.classements || {})[p.a] || [])[p.r - 1] || {};
      const j = resoudre(slot);
      const cote = (p.cote || ep.cote) === "gauche" ? "gauche" : "droite";
      const stats = (ep.stats || []).map((s, i) => ({ s, v: (slot.valeurs || [])[i] })).filter((x) => (x.s.label || "").trim());
      const lignes = stats.map(({ s, v }, i) => {
        const val = compteur(v, 1700 + i * 150);
        return `<div class="l a a-monte" ${d(1600 + i * 150)}><span class="lab">${esc(s.label)}</span>
          <span class="val">${s.accent ? `<span class="surligne anim" style="animation-delay:${2000 + i * 150}ms">${val}</span>` : val}</span></div>`;
      }).join("");
      const clubs = (j && j.clubs || []).map((c) => c[0]).filter((c, i, t) => t.indexOf(c) === i).slice(0, 5).join(" · ");
      const nomA = nomCourt(j);
      const taille = Math.round(Math.min(104, 560 / Math.max(1, nomA.length * 0.46)));
      const prenom = j ? (j.surnom ? [j.prenom, j.nom].filter(Boolean).join(" ") : j.prenom) : "";
      const glisse = cote === "droite" ? "a-glisse-d" : "a-glisse-g";
      return `<div class="scene overlay fiche ${cote} ${ep.panneau ? "panneau" : ""} ${p.r ? "" : "mention"}">
        <div class="carte papier a ${glisse}" ${d(0)}>
          ${scotch("", 350)}
          <div class="rangf a a-pose" ${d(450)}>${p.r ? `<span><small>#</small>${p.r}</span>` : `<span class="mh">Mention<br>honorable</span>`}</div>
          ${photo(j, "--r:-4deg", 500)}
          <div class="tampon a a-tampon" ${d(2300)}>${p.r ? "Choix" : "Mention"} de ${esc(a.nom)}</div>
          <div class="ident">
            <div class="prenom a a-fondu" ${d(900)}>${esc(prenom)}</div>
            <div class="nom titre a a-monte" style="animation-delay:950ms;font-size:${taille}px">${esc(nomA)}</div>
            ${infoLigne(j) ? `<div class="ligne-info a a-fondu" ${d(1100)}>${esc(infoLigne(j))}</div>` : ""}
            ${clubs ? `<div class="clubs a a-ecrit" ${d(1200)}>${esc(clubs)}</div>` : ""}
          </div>
          ${lignes ? `<div class="bulletin">${lignes}</div>` : ""}
          ${slot.argument ? `<div class="argument a a-ecrit-lisse" ${d(2600)}>« ${esc(slot.argument)} »</div>` : ""}
        </div></div>`;
    },

    // Récap : le classement de chacun
    recap(ep) {
      const anims = ep.animateurs.slice(0, 2);
      const listes = anims.map((a) => Array.from({ length: 10 }, (_, k) => {
        const j = resoudre(((ep.classements || {})[a.id] || [])[k]);
        return j ? nomComplet(j) : "";
      }));
      const compte = {};
      listes.forEach((l) => new Set(l.filter(Boolean)).forEach((n) => (compte[n] = (compte[n] || 0) + 1)));
      const communs = Object.values(compte).filter((c) => c > 1).length;
      const f = anims.map((a, i) => {
        const lignes = listes[i].map((n, k) => `<div class="ligne ${k < 3 ? "top" : ""} a a-glisse-g" ${d(800 + i * 150 + (9 - k) * 120)}>
          <span class="r">${k + 1}</span><span class="n">${!n ? "—" : compte[n] > 1 ? `<span class="surligne">${esc(n)}</span>` : esc(n)}</span></div>`).join("");
        return `<div class="feuille papier lignes ${i ? "d" : "g"} a a-tombe" style="--r:${i ? 1.5 : -1.5}deg;animation-delay:${200 + i * 250}ms">
          ${scotch("", 600 + i * 250)}<h3>${esc(a.nom)}</h3>${lignes}</div>`;
      }).join("");
      return `<div class="scene recap sur-ardoise">${ardoise()}${sticker()}
        <div class="tete"><div class="t titre craie-texture a a-monte" ${d(0)}>${esc(ep.titreRecap || "Nos classements")}</div></div>
        ${f}
        ${communs ? `<div class="bas a a-ecrit" ${d(2400)}>Surligné = ${communs} joueur${communs > 1 ? "s" : ""} dans nos deux tops</div>` : ""}</div>`;
    },
  };

  /* ---------- Déroulé : du 10 au 1, chacun son tour, puis le récap ---------- */
  function deroule(ep) {
    const t = [];
    for (let r = 10; r >= 1; r--) {
      ep.animateurs.forEach((a) => {
        const j = resoudre(((ep.classements || {})[a.id] || [])[r - 1]);
        t.push({ type: "fiche", p: { r, a: a.id }, overlay: true, label: `#${r} · ${a.nom} · ${j ? nomComplet(j) : "vide"}` });
      });
    }
    t.push({ type: "recap", p: {}, overlay: false, label: "Récap des classements" });
    return t;
  }

  /* ---------- Compteurs (horloge pilotable pour l'export) ---------- */
  let t0 = performance.now();
  let horlogeManuelle = null;
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  function majCompteurs(t) {
    document.querySelectorAll("[data-compte]").forEach((el) => {
      const cible = Number(el.dataset.compte);
      const x = Math.min(1, Math.max(0, (t - Number(el.dataset.delai || 0)) / 1100));
      const dec = Number.isInteger(cible) ? 0 : 1;
      el.textContent = (x >= 1 ? cible : cible * easeOut(x)).toLocaleString("fr-FR", { maximumFractionDigits: x >= 1 ? dec : 0 });
    });
  }
  function boucle() {
    if (horlogeManuelle == null) majCompteurs(performance.now() - t0);
    requestAnimationFrame(boucle);
  }

  function ajuste() {
    const st = document.getElementById("stage");
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    st.style.transform = `translate(${(innerWidth - 1920 * k) / 2}px, ${(innerHeight - 1080 * k) / 2}px) scale(${k})`;
  }

  function lireStockage() {
    try { return JSON.parse(localStorage.getItem(CLE) || "null"); } catch (e) { return null; }
  }

  const KIT = {
    SCENES, deroule, resoudre, nomComplet, BANQUE, CLE,
    ep: null, steps: [], i: 0, fond: "transparent",

    charger(ep) { this.ep = ep; this.steps = deroule(ep); },
    afficher(i) {
      if (!this.ep) return;
      this.i = Math.max(0, Math.min(this.steps.length - 1, i));
      const s = this.steps[this.i];
      document.getElementById("stage").innerHTML = SCENES[s.type](this.ep, s.p);
      document.body.classList.toggle("transparent", !!s.overlay && this.fond === "transparent");
      document.body.classList.toggle("fond-vert", !!s.overlay && this.fond === "vert");
      t0 = performance.now();
      horlogeManuelle = null;
      if (window.parent !== window) window.parent.postMessage({ kit: "etape", i: this.i }, "*");
    },
    suivant() { this.afficher(this.i + 1); },
    precedent() { this.afficher(this.i - 1); },
    rejouer() { this.afficher(this.i); },
    seek(ms) {
      horlogeManuelle = ms;
      document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; });
      majCompteurs(ms);
    },
  };
  window.KIT = KIT;
  window.__seek = (ms) => KIT.seek(ms);

  KIT.demarrer = function () {
    const q = new URLSearchParams(location.search);
    KIT.fond = q.get("fond") || "transparent";
    ajuste();
    addEventListener("resize", ajuste);
    const ep = window.EPISODE_EXPORT || lireStockage() || window.EPISODE_DEMO;
    if (ep) { KIT.charger(ep); KIT.afficher(Number(q.get("i") ?? location.hash.slice(1)) || 0); }
    window.__pret = true;
    if (window.parent !== window) window.parent.postMessage({ kit: "pret" }, "*");
    requestAnimationFrame(boucle);
    addEventListener("keydown", (e) => {
      if (["ArrowRight", " ", "PageDown"].includes(e.key)) { e.preventDefault(); KIT.suivant(); }
      else if (["ArrowLeft", "PageUp"].includes(e.key)) KIT.precedent();
      else if (e.key === "r" || e.key === "R") KIT.rejouer();
      else if (e.key === "f" || e.key === "F") document.documentElement.requestFullscreen?.();
    });
    addEventListener("click", () => KIT.rejouer());
    addEventListener("message", (e) => {
      const m = e.data || {};
      if (m.kit === "etat") { KIT.fond = m.fond || KIT.fond; KIT.charger(m.ep); KIT.afficher(m.i ?? KIT.i); }
      else if (m.kit === "aller") KIT.afficher(m.i);
      else if (m.kit === "rejouer") KIT.rejouer();
    });
  };
})();
