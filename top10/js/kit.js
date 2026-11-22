/* =========================================================
   TOP 10 — moteur des scènes
   Lit MARQUE, JOUEURS, EPISODES, construit le déroulé de
   l'épisode et affiche chaque étape en 1920×1080.
   ========================================================= */
(function () {
  "use strict";

  const M = window.MARQUE;
  const BANQUE = Object.fromEntries((window.JOUEURS || []).map((j) => [j.id, j]));
  const LABELS = window.STATS_LABELS || {};

  /* ---------- Outils ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const d = (ms) => `style="animation-delay:${ms}ms"`;
  const deux = (n) => String(n).padStart(2, "0");

  function joueur(ref) {
    if (!ref) return null;
    if (BANQUE[ref]) return BANQUE[ref];
    const mots = String(ref).trim().split(/\s+/);
    const nom = mots.length > 1 ? mots.pop() : mots[0];
    return { id: null, libre: true, prenom: mots.length ? mots.join(" ") : "", nom, stats: {}, clubs: [] };
  }
  const nomComplet = (j) => (j ? j.surnom || [j.prenom, j.nom].filter(Boolean).join(" ") : "À dévoiler");
  const nomCourt = (j) => (j ? j.surnom || j.nom : "À dévoiler");
  const initiales = (j) => (!j ? "?" : j.surnom ? j.surnom.slice(0, 2) : ((j.prenom || "")[0] || "") + ((j.nom || "")[0] || "")).toUpperCase();
  const animateur = (ep, id) => ep.animateurs.find((a) => a.id === id) || { id, nom: id };

  function valeurStat(ep, j, cle) {
    if (!j) return null;
    const ov = j.id && ep.statsEpisode && ep.statsEpisode[j.id];
    if (ov && ov[cle] != null && ov[cle] !== "") return ov[cle];
    const v = j.stats && j.stats[cle];
    return v == null || v === "" ? null : v;
  }
  const labelStat = (s) => s.label || LABELS[s.cle] || s.cle;

  function periode(j) {
    if (!j || !j.clubs || !j.clubs.length) return "";
    const a = String(j.clubs[0][1] || "").slice(0, 4);
    const last = String(j.clubs[j.clubs.length - 1][1] || "");
    const m = last.match(/(\d{2,4})\s*$/);
    let b = m ? m[1] : "";
    if (b.length === 2) b = (Number(b) > 50 ? "19" : "20") + b;
    return a && b && a !== b ? `${a} – ${b}` : a;
  }
  const infoLigne = (j) => (j ? [j.poste, j.nation, periode(j)].filter(Boolean).join(" · ") : "");

  function portrait(j, extra = "") {
    const img = j && j.photo ? `<img src="${esc(j.photo)}" alt="">` : "";
    const flag = j && j.nation ? `<span class="drapeau">${esc(j.nation)}</span>` : "";
    return `<div class="portrait ${extra}"><span class="initiales">${esc(initiales(j))}</span>${img}${flag}</div>`;
  }

  function compteur(v, delai) {
    if (v == null) return `<span>—</span>`;
    const n = Number(String(v).replace(/\s/g, ""));
    if (!isFinite(n)) return `<span>${esc(v)}</span>`;
    return `<span data-compte="${n}" data-delai="${delai}">0</span>`;
  }

  const fond = (halo = { x: 1100, y: -300 }) =>
    `<div class="fond"><div class="halo" style="left:${halo.x}px;top:${halo.y}px"></div></div><div class="cadre"><i></i><i></i><i></i><i></i></div>`;

  function entete(ep, droite) {
    return `<div class="entete a a-descend" ${d(150)}>
      <div class="gauche"><img src="${esc(M.logo)}" alt=""><span>${esc(M.nom)} · ${esc(ep.titre)}</span></div>
      <div><span class="point"></span>${esc(droite || "")}</div></div>`;
  }

  function ticker(ep) {
    const items = [M.nom, ep.titre, M.signature].filter(Boolean);
    let s = "";
    for (let k = 0; k < 8; k++) items.forEach((t, i) => (s += `<span class="${i % 2 ? "l" : ""}">${esc(t)}</span><span>/</span>`));
    return `<div class="ticker a a-monte" ${d(600)}><div class="piste">${s}${s}</div></div>`;
  }

  /* ---------- Scènes ---------- */
  const SCENES = {
    intro(ep) {
      const lettres = [...M.nom].map((c, i) => `<span style="animation-delay:${200 + i * 70}ms">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
      return `<div class="scene intro">${fond({ x: 260, y: -160 })}
        <div class="balayage"></div>
        <div class="geant t-xxl t-contour">${lettres}</div>
        <div class="logo"><img src="${esc(M.logo)}" alt=""></div>
        <div class="bas">
          <div class="titre a a-masque" ${d(1900)}>${esc(ep.titre)}</div>
          <div class="sous a a-monte" ${d(2300)}><span class="pastille">${ep.numero ? "Épisode " + deux(ep.numero) : esc(M.signature)}</span></div>
        </div>${ticker(ep)}</div>`;
    },

    chapitre(ep, p) {
      return `<div class="scene chapitre">${fond({ x: 900, y: 200 })}${entete(ep, `Partie ${deux(p.n)}`)}
        <div class="num t-xxl t-contour lila a a-zoom" ${d(100)}>${deux(p.n)}</div>
        <div class="bloc">
          <div class="trait a a-trait" ${d(300)}></div>
          <div class="titre t-xxl a a-masque" ${d(450)}>${esc(p.titre)}</div>
          ${p.sous ? `<div class="sous a a-monte" ${d(800)}>${esc(p.sous)}</div>` : ""}
        </div>${ticker(ep)}</div>`;
    },

    objectifs(ep) {
      const cols = ep.animateurs.map((a, i) => {
        const items = ((ep.objectifs || {})[a.id] || []).filter(Boolean);
        const lis = items.map((t, k) => `<li class="a a-gauche" ${d(700 + i * 250 + k * 220)}><span class="case" ${d(1100 + i * 250 + k * 220)}></span><span>${esc(t)}</span></li>`).join("");
        return `<div class="panneau a a-monte" ${d(300 + i * 250)}>
          <span class="pastille">Objectifs</span><h3>${esc(a.nom)}</h3><ul>${lis || `<li class="a a-fondu" ${d(700)}><span class="case"></span><span>—</span></li>`}</ul></div>`;
      }).join("");
      return `<div class="scene objectifs overlay">
        <div class="titre-haut lt-nom" style="position:absolute;left:80px;top:70px;bottom:auto">
          <div class="barre a a-trait" ${d(0)}></div>
          <div class="n a a-masque" ${d(150)}>Objectifs de la semaine</div></div>
        <div class="colonnes">${cols}</div></div>`;
    },

    mentions(ep) {
      const cartes = (ep.mentions || []).map(([id, aid], i) => {
        const j = joueur(id);
        return `<div class="carte a a-flip" ${d(700 + i * 280)}>${portrait(j)}
          <div class="corps"><div class="nom">${esc(nomCourt(j))}</div>
          <div class="info">${esc(infoLigne(j) || nomComplet(j))}</div>
          <div class="par">Proposé par ${esc(animateur(ep, aid).nom)}</div></div></div>`;
      }).join("");
      return `<div class="scene mentions">${fond({ x: 1200, y: -500 })}${entete(ep, "Mentions honorables")}
        <div class="tete"><span class="pastille a a-gauche" ${d(200)}>Ils auraient pu y être</span>
          <h2 class="t-xxl a a-masque" ${d(350)}>Mentions <span class="lila">honorables</span></h2></div>
        <div class="cartes">${cartes}</div>${ticker(ep)}</div>`;
    },

    rang(ep, p) {
      const a = animateur(ep, p.a);
      const j = joueur((ep.classements[p.a] || [])[p.r - 1]);
      const stats = (ep.stats || []).slice(0, 4).map((s, i) =>
        `<div class="stat ${s.accent ? "accent" : ""} a a-monte" ${d(1500 + i * 120)}><div class="v">${compteur(valeurStat(ep, j, s.cle), 1600 + i * 120)}</div><div class="l">${esc(labelStat(s))}</div></div>`).join("");
      const clubs = (j && j.clubs || []).slice(0, 6).map((c, i) => `<span class="a a-fondu" ${d(1250 + i * 60)}>${esc(c[0])}<b>${esc(c[1] || "")}</b></span>`).join("");
      const arg = j && ep.arguments && ep.arguments[`${p.a}:${j.id || nomComplet(j)}`];
      const fam = nomCourt(j);
      const taille = Math.round(Math.min(108, 600 / Math.max(1, fam.length * 0.46)));
      return `<div class="scene rang">${fond({ x: -300, y: 100 })}${entete(ep, `Top 10 · le choix de ${a.nom}`)}
        <div class="chiffre ${p.r < 10 ? "un" : ""} t-xxl t-contour a a-gauche" ${d(0)}><span class="diese">#</span>${p.r}<span class="plein"><span class="diese">#</span>${p.r}</span></div>
        <div class="choix a a-gauche" ${d(400)}><span class="pastille pleine">Le choix de ${esc(a.nom)}</span></div>
        <div class="fiche a a-droite" ${d(700)}>
          ${portrait(j, "a a-fondu")}
          <div class="droite">
            <div class="poste a a-monte" ${d(950)}>${esc(infoLigne(j) || "Hors banque")}</div>
            <div class="nom a a-masque" ${d(1050)}><span class="prenom">${esc(j ? (j.surnom ? [j.prenom, j.nom].filter(Boolean).join(" ") : j.prenom) : "")}</span><span class="famille" style="font-size:${taille}px">${esc(fam)}</span></div>
            <div class="clubs">${clubs}</div>
            ${stats ? `<div class="stats a a-fondu" ${d(1450)}>${stats}</div>` : ""}
            ${arg ? `<div class="argument a a-monte" ${d(2100)}>${esc(arg)}</div>` : ""}
          </div></div>${ticker(ep)}</div>`;
    },

    "lt-rang"(ep, p) {
      const a = animateur(ep, p.a);
      const j = joueur((ep.classements[p.a] || [])[p.r - 1]);
      const mini = (ep.stats || []).slice(0, 3).map((s, i) => `<div class="a a-fondu" ${d(900 + i * 120)}><b>${compteur(valeurStat(ep, j, s.cle), 950 + i * 120)}</b>${esc(labelStat(s))}</div>`).join("");
      return `<div class="scene overlay"><div class="lt">
        <div class="rk a a-zoom" ${d(0)}><span><small>#</small>${p.r}</span></div>
        <div class="bd a a-masque" ${d(250)}>
          <div class="q">Le choix de ${esc(a.nom)}</div>
          <div class="n">${esc(nomComplet(j))}</div>
          <div class="mini">${mini}</div></div></div></div>`;
    },

    duo(ep, p) {
      const js = ep.animateurs.map((a) => joueur((ep.classements[a.id] || [])[p.r - 1]));
      const noms = js.map(nomComplet);
      const cols = ep.animateurs.map((a, i) => {
        const j = js[i];
        const meme = noms.filter((n) => n === noms[i]).length > 1 && j;
        return `<div class="col ${meme ? "meme" : ""} a a-monte" ${d(500 + i * 220)}>${portrait(j)}
          <div class="txt"><div class="qui">${esc(a.nom)}</div><div class="nom">${esc(nomComplet(j))}</div>
          <div class="info">${esc(infoLigne(j))}</div></div></div>`;
      }).join("");
      const accord = new Set(noms).size === 1 && js[0];
      return `<div class="scene duo">${fond({ x: 260, y: -700 })}${entete(ep, `Top 10 · rang ${p.r}`)}
        <div class="centre"><span class="pastille ${accord ? "pleine" : ""} a a-descend" ${d(100)}>${accord ? "Même choix !" : "Vos choix"}</span>
          <div class="n t-xxl a a-zoom" ${d(200)}><span class="lila">#</span>${p.r}</div></div>
        <div class="colonnes">${cols}</div>${ticker(ep)}</div>`;
    },

    recap(ep) {
      const listes = ep.animateurs.map((a) => (ep.classements[a.id] || []).map((r) => nomComplet(joueur(r))));
      const compte = {};
      listes.forEach((l) => new Set(l.filter((n) => n !== "À dévoiler")).forEach((n) => (compte[n] = (compte[n] || 0) + 1)));
      const communs = Object.values(compte).filter((c) => c > 1).length;
      const cols = ep.animateurs.map((a, i) => {
        const lignes = [];
        for (let r = 1; r <= 10; r++) {
          const ref = (ep.classements[a.id] || [])[r - 1];
          const j = joueur(ref);
          const n = nomComplet(j);
          const s = ep.stats && ep.stats[0] ? valeurStat(ep, j, ep.stats.find((x) => x.accent)?.cle || ep.stats[0].cle) : null;
          lignes.push(`<div class="ligne ${compte[n] > 1 ? "commun" : ""} ${r <= 3 ? "top" : ""} a a-gauche" ${d(600 + i * 120 + (10 - r) * 110)}>
            <span class="r">${r}</span><span class="n">${esc(n)}</span>${s != null ? `<span class="s">${esc(s)}</span>` : ""}</div>`);
        }
        return `<div class="col"><h3 class="a a-masque" ${d(300 + i * 150)}>${esc(a.nom)}</h3>${lignes.join("")}</div>`;
      }).join("");
      const lab = ep.stats && ep.stats.length ? labelStat(ep.stats.find((x) => x.accent) || ep.stats[0]) : "";
      return `<div class="scene recap">${fond({ x: 1000, y: 300 })}${entete(ep, "Le récap")}
        <div class="tete"><h2 class="t-xxl a a-masque" ${d(150)}>Nos <span class="lila">classements</span></h2></div>
        <div class="legende a a-fondu" ${d(2200)}><span class="pastille">${communs} joueur${communs > 1 ? "s" : ""} en commun</span>${lab ? `<span class="pastille">Chiffre : ${esc(lab)}</span>` : ""}</div>
        <div class="colonnes">${cols}</div>${ticker(ep)}</div>`;
    },

    outro(ep) {
      return `<div class="scene outro">${fond({ x: 260, y: -160 })}
        <div class="milieu">
          <img class="a a-zoom" ${d(100)} src="${esc(M.logo)}" alt="">
          <div class="q t-xxl a a-masque" ${d(500)}>Et <span class="lila">ton</span> top 10 ?</div>
          <div class="s a a-monte" ${d(900)}>Dis-nous en commentaire qui on a oublié.</div>
          <div class="r a a-monte" ${d(1200)}>${(M.reseaux || []).map((r) => `<span class="pastille">${esc(r)}</span>`).join("")}<span class="pastille pleine">Abonne-toi</span></div>
        </div>${ticker(ep)}</div>`;
    },

    "lt-nom"(ep, p) {
      const a = animateur(ep, p.a);
      return `<div class="scene overlay"><div class="lt-nom">
        <div class="barre a a-trait" ${d(0)}></div>
        <div class="n a a-masque" ${d(150)}>${esc(a.nom)}</div><br>
        <div class="s a a-masque" ${d(400)}>${esc(p.sous || M.nom)}</div></div></div>`;
    },
  };

  /* ---------- Déroulé d'un épisode ---------- */
  function deroule(ep) {
    const t = [];
    const add = (type, p, label, overlay = false) => t.push({ type, p: p || {}, label, overlay });
    add("intro", null, "Générique");
    add("chapitre", { n: 1, titre: "La journée", sous: ep.journee || "Comment s'est passée la journée ?" }, "Partie 1 · La journée");
    ep.animateurs.forEach((a) => add("lt-nom", { a: a.id }, `Nom à l'écran · ${a.nom}`, true));
    add("chapitre", { n: 2, titre: "Objectifs", sous: "Nos objectifs de la semaine." }, "Partie 2 · Objectifs");
    add("objectifs", null, "Objectifs (sur caméra)", true);
    add("chapitre", { n: 3, titre: "Mentions honorables", sous: "Ils auraient pu entrer dans notre top 10." }, "Partie 3 · Mentions");
    add("mentions", null, "Mentions honorables");
    add("chapitre", { n: 4, titre: "Le top 10", sous: ep.titre }, "Partie 4 · Le top 10");
    for (let r = 10; r >= 1; r--) {
      ep.animateurs.forEach((a) => {
        const j = joueur((ep.classements[a.id] || [])[r - 1]);
        add("lt-rang", { r, a: a.id }, `#${r} · ${a.nom} montre sa tablette · ${nomComplet(j)}`, true);
        add("rang", { r, a: a.id }, `#${r} · Fiche ${a.nom} · ${nomComplet(j)}`);
      });
      if (ep.duo && ep.animateurs.length > 1) add("duo", { r }, `#${r} · Les choix côte à côte`);
    }
    add("chapitre", { n: 5, titre: "Le récap", sous: "Le classement de chacun." }, "Partie 5 · Le récap");
    add("recap", null, "Récap des classements");
    add("outro", null, "Fin");
    return t;
  }

  /* ---------- Compteurs (pilotés par une horloge, pour l'export image par image) ---------- */
  let t0 = performance.now();
  let horlogeManuelle = null;
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  function majCompteurs(t) {
    document.querySelectorAll("[data-compte]").forEach((el) => {
      const cible = Number(el.dataset.compte);
      const delai = Number(el.dataset.delai || 0);
      const x = Math.min(1, Math.max(0, (t - delai) / 1100));
      const v = Math.round(cible * easeOut(x));
      el.textContent = v.toLocaleString("fr-FR");
    });
  }
  function boucle() {
    if (horlogeManuelle == null) majCompteurs(performance.now() - t0);
    requestAnimationFrame(boucle);
  }

  /* ---------- Affichage ---------- */
  function ajuste() {
    const st = document.getElementById("stage");
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    st.style.transform = `translate(${(innerWidth - 1920 * k) / 2}px, ${(innerHeight - 1080 * k) / 2}px) scale(${k})`;
  }

  const KIT = {
    SCENES, deroule, joueur, nomComplet,
    ep: null, steps: [], i: 0,

    afficher(i) {
      this.i = Math.max(0, Math.min(this.steps.length - 1, i));
      const s = this.steps[this.i];
      const st = document.getElementById("stage");
      st.innerHTML = SCENES[s.type](this.ep, s.p);
      document.body.classList.toggle("transparent", !!s.overlay && !KIT.forcerFond);
      document.body.classList.toggle("overlay-step", !!s.overlay);
      t0 = performance.now();
      horlogeManuelle = null;
      if (history.replaceState) history.replaceState(null, "", `#${this.i}`);
      if (window.parent !== window) window.parent.postMessage({ kit: "etape", i: this.i }, "*");
    },
    suivant() { this.afficher(this.i + 1); },
    precedent() { this.afficher(this.i - 1); },
    rejouer() { this.afficher(this.i); },

    // Export : fige toutes les animations à `ms` millisecondes
    seek(ms) {
      horlogeManuelle = ms;
      document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; });
      majCompteurs(ms);
    },
  };
  window.KIT = KIT;
  window.__seek = (ms) => KIT.seek(ms);

  /* ---------- Démarrage (page scene.html) ---------- */
  function charger(nom, ok) {
    if (window.EPISODES[nom]) return ok();
    const s = document.createElement("script");
    s.src = `data/episodes/${nom}.js`;
    s.onload = ok;
    s.onerror = () => { document.getElementById("stage").innerHTML = `<div style="padding:80px;font:40px sans-serif">Épisode « ${esc(nom)} » introuvable.</div>`; };
    document.head.appendChild(s);
  }

  KIT.demarrer = function () {
    const q = new URLSearchParams(location.search);
    const nom = q.get("ep") || "exemple";
    KIT.forcerFond = q.get("fond") === "1";
    ajuste();
    addEventListener("resize", ajuste);
    charger(nom, () => {
      KIT.ep = window.EPISODES[nom];
      KIT.steps = deroule(KIT.ep);
      const depart = Number(q.get("i") ?? location.hash.slice(1)) || 0;
      KIT.afficher(depart);
      window.__pret = true;
      if (window.parent !== window) window.parent.postMessage({ kit: "pret", steps: KIT.steps.map((s) => ({ label: s.label, overlay: s.overlay, type: s.type })) }, "*");
    });
    requestAnimationFrame(boucle);
    addEventListener("keydown", (e) => {
      if (["ArrowRight", " ", "PageDown"].includes(e.key)) { e.preventDefault(); KIT.suivant(); }
      else if (["ArrowLeft", "PageUp"].includes(e.key)) KIT.precedent();
      else if (e.key === "r" || e.key === "R") KIT.rejouer();
      else if (e.key === "f" || e.key === "F") document.documentElement.requestFullscreen?.();
    });
    addEventListener("message", (e) => {
      const m = e.data || {};
      if (m.kit === "aller") KIT.afficher(m.i);
      else if (m.kit === "suivant") KIT.suivant();
      else if (m.kit === "precedent") KIT.precedent();
      else if (m.kit === "rejouer") KIT.rejouer();
    });
  };
})();
