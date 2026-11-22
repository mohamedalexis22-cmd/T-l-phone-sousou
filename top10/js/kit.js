/* =========================================================
   TOPSIDE — moteur des scènes
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

  function compteur(v, delai) {
    if (v == null) return `<span>—</span>`;
    const n = Number(String(v).replace(/\s/g, ""));
    if (!isFinite(n)) return `<span>${esc(v)}</span>`;
    return `<span data-compte="${n}" data-delai="${delai}">0</span>`;
  }

  /* ---------- Éléments de décor ---------- */
  const ardoise = () => `<div class="ardoise">
      <i class="effacee" style="left:180px;top:140px;width:620px;height:260px"></i>
      <i class="effacee" style="left:1180px;top:620px;width:560px;height:220px"></i>
      <i class="effacee" style="left:860px;top:80px;width:380px;height:160px"></i></div>`;
  const sticker = () => `<div class="sticker a a-pose" ${d(100)} style="--r:-8deg"><img src="${esc(M.logo)}" alt=""></div>`;
  const etiquette = (ep) => `<div class="etiquette-ep a a-fondu" ${d(300)}>${esc(M.nom)} · ${esc(ep.titre)}</div>`;
  const scotch = (cls, ms, r = 0) => `<div class="scotch ${cls} a a-scotch" style="animation-delay:${ms}ms;--r:${r}deg"></div>`;
  const souligne = (ms) => `<svg class="trait" viewBox="0 0 800 40" preserveAspectRatio="none"><path style="animation-delay:${ms}ms" d="M12 26 C 160 6, 300 38, 450 18 S 690 8, 788 24"/></svg>`;

  function photo(j, style, ms, extra = "") {
    const img = j && j.photo ? `<img src="${esc(j.photo)}" alt="">` : "";
    const nat = j && j.nation ? `<span class="nat">${esc(j.nation)}</span>` : "";
    return `<div class="photo a a-pose" style="${style};animation-delay:${ms}ms">${nat}
      <div class="img"><span class="ini">${esc(initiales(j))}</span>${img}</div>
      <div class="legende">${esc(nomCourt(j))}</div>${extra}</div>`;
  }

  // Taille du nom écrit au feutre sur la tablette (selon le mot le plus long)
  function tailleFeutre(texte, largeur, max) {
    const mot = Math.max(...String(texte).split(/\s+/).map((m) => m.length), 1);
    const lignes = String(texte).split(/\s+/).length;
    return Math.round(Math.min(max, largeur / (mot * 0.62), lignes > 2 ? max * 0.75 : max));
  }

  function tablette(j, r, cls, style, ms, largeur = 620, max = 120) {
    const n = j ? nomComplet(j) : "?";
    return `<div class="tablette ${cls} a a-tombe" style="${style};animation-delay:${ms}ms">
      <div class="ecran">
        ${r ? `<div class="rangt a a-fondu" ${d(ms + 500)}>#${r}</div>` : ""}
        <div class="nomt a a-ecrit" style="font-size:${tailleFeutre(n, largeur, max)}px;animation-delay:${ms + 650}ms">${esc(n)}</div>
        ${souligne(ms + 1550)}
      </div></div>`;
  }

  /* ---------- Scènes ---------- */
  const SCENES = {
    intro(ep) {
      return `<div class="scene intro sur-ardoise">${ardoise()}
        <div class="nom titre craie-texture a a-fondu" ${d(0)}>${esc(M.nom)}</div>
        <div class="logo a a-tombe" ${d(200)}><img src="${esc(M.logo)}" alt=""></div>
        <div class="feuille papier a a-pose" ${d(1100)}>
          ${scotch("", 1400, 0)}
          <div class="t titre">${esc(ep.titre)}</div>
          <div class="s feutre a a-ecrit" ${d(1600)}>${ep.numero ? "Épisode " + deux(ep.numero) : esc(M.signature)}</div>
        </div></div>`;
    },

    chapitre(ep, p) {
      return `<div class="scene chapitre sur-ardoise">${ardoise()}${sticker()}${etiquette(ep)}
        <div class="feuille papier lignes a a-tombe" ${d(100)}>
          ${scotch("g", 750, -38)}${scotch("d", 850, 38)}
          <div class="num a a-ecrit" ${d(800)}>Partie ${deux(p.n)}</div>
          <div class="t titre a a-monte" ${d(900)}><span class="surligne anim" style="animation-delay:1300ms">${esc(p.titre)}</span></div>
          ${p.sous ? `<div class="s a a-ecrit" ${d(1500)}>${esc(p.sous)}</div>` : ""}
        </div></div>`;
    },

    "lt-nom"(ep, p) {
      const a = animateur(ep, p.a);
      return `<div class="scene overlay"><div class="bande papier a a-glisse-g" ${d(0)}>
        ${scotch("", 350, -30)}
        <div class="n titre">${esc(a.nom)}</div>
        <div class="s a a-ecrit" ${d(500)}>${esc(p.sous || M.nom)}</div></div></div>`;
    },

    objectifs(ep) {
      const n = ep.animateurs.length;
      const notes = ep.animateurs.map((a, i) => {
        const items = ((ep.objectifs || {})[a.id] || []).filter(Boolean);
        const pos = n === 1 ? "left:80px" : i === 0 ? "left:80px" : i === n - 1 ? "right:80px" : `left:${650 + (i - 1) * 40}px`;
        const r = [-2.5, 2, -1][i % 3];
        const lis = (items.length ? items : ["—"]).map((t, k) => `<li class="a a-ecrit" ${d(700 + i * 300 + k * 450)}>
          <span class="case"><svg viewBox="0 0 54 54"><path style="animation-delay:${1100 + i * 300 + k * 450}ms" d="M6 28 L21 42 L50 4"/></svg></span>${esc(t)}</li>`).join("");
        return `<div class="note papier lignes a a-pose" style="${pos};bottom:80px;--r:${r}deg;animation-delay:${250 + i * 200}ms">
          ${scotch("", 450 + i * 200)}
          <div class="sous">Les objectifs de</div><h3>${esc(a.nom)}</h3><ul>${lis}</ul></div>`;
      }).join("");
      return `<div class="scene objectifs overlay">
        <div class="titre-o papier a a-glisse-g" ${d(0)}><div class="n titre"><span class="surligne anim" style="animation-delay:400ms">Objectifs</span> de la semaine</div></div>
        ${notes}</div>`;
    },

    mentions(ep) {
      const liste = ep.mentions || [];
      const n = liste.length, W = 430, G = 90;
      const x0 = (1920 - n * W - (n - 1) * G) / 2;
      const rots = [-5, 3, -2, 4];
      const ph = liste.map(([id, aid], i) => {
        const j = joueur(id);
        return photo(j, `left:${x0 + i * (W + G)}px;--r:${rots[i % 4]}deg`, 700 + i * 350,
          `${scotch("", 1000 + i * 350)}<div class="par">par ${esc(animateur(ep, aid).nom)}</div>`);
      }).join("");
      return `<div class="scene mentions sur-ardoise">${ardoise()}${sticker()}
        <div class="tete"><div class="t titre craie-texture a a-monte" ${d(150)}>Mentions honorables</div>
          <div class="s feutre a a-ecrit" ${d(500)}>Ils auraient pu y être…</div></div>
        ${ph}</div>`;
    },

    "lt-rang"(ep, p) {
      const a = animateur(ep, p.a);
      const j = joueur((ep.classements[p.a] || [])[p.r - 1]);
      const mini = (ep.stats || []).slice(0, 3).map((s, i) => `<div class="a a-fondu" ${d(900 + i * 150)}><b>${compteur(valeurStat(ep, j, s.cle), 950 + i * 150)}</b>${esc(labelStat(s))}</div>`).join("");
      return `<div class="scene overlay lt-rang"><div class="bloc">
        <div class="num a a-pose" ${d(0)}><span><small>#</small>${p.r}</span></div>
        <div class="bande2 papier a a-glisse-g" ${d(250)}>
          <div class="q a a-ecrit" ${d(500)}>Le choix de ${esc(a.nom)}</div>
          <div class="n titre">${esc(nomComplet(j))}</div>
          ${j && !j.libre ? `<div class="mini">${mini}</div>` : ""}</div></div></div>`;
    },

    rang(ep, p) {
      const a = animateur(ep, p.a);
      const j = joueur((ep.classements[p.a] || [])[p.r - 1]);
      const lignes = (ep.stats || []).slice(0, 4).map((s, i) => {
        const v = compteur(valeurStat(ep, j, s.cle), 1900 + i * 160);
        return `<div class="l a a-monte" ${d(1800 + i * 160)}><span class="lab">${esc(labelStat(s))}</span>
          <span class="val">${s.accent ? `<span class="surligne anim" style="animation-delay:${2200 + i * 160}ms">${v}</span>` : v}</span></div>`;
      }).join("");
      const clubs = (j && j.clubs || []).map((c) => c[0]).filter((c, i, t) => t.indexOf(c) === i).slice(0, 6).join(" · ");
      const arg = j && ep.arguments && ep.arguments[`${p.a}:${j.id || nomComplet(j)}`];
      const nomA = nomCourt(j);
      const taille = Math.round(Math.min(116, 520 / Math.max(1, nomA.length * 0.45)));
      const prenom = j ? (j.surnom ? [j.prenom, j.nom].filter(Boolean).join(" ") : j.prenom) : "";
      return `<div class="scene rang sur-ardoise">${ardoise()}${etiquette(ep)}
        <div class="chiffre titre craie-texture a a-pose" ${d(0)}><span>#</span>${p.r}</div>
        ${tablette(j, null, "", "", 150, 620, 120)}
        <div class="feuille papier a a-glisse-d" ${d(800)}>
          ${scotch("", 1150)}
          ${photo(j, "--r:-6deg", 1200)}
          <div class="haut-f">
          <div class="prenom a a-fondu" ${d(1300)}>${esc(prenom)}</div>
          <div class="nom titre a a-monte" ${d(1350)} style="font-size:${taille}px">${esc(nomA)}</div>
          <div class="ligne-info a a-fondu" ${d(1500)}>${esc(infoLigne(j) || "Joueur hors banque")}</div>
          ${clubs ? `<div class="clubs a a-ecrit" ${d(1600)}>${esc(clubs)}</div>` : ""}
          </div>
          ${lignes && j && !j.libre ? `<div class="bulletin">${lignes}</div>` : ""}
          ${arg ? `<div class="argument a a-ecrit-lisse" ${d(2700)}>« ${esc(arg)} »</div>` : ""}
          <div class="tampon a a-tampon" ${d(2400)}>Choix de ${esc(a.nom)}</div>
        </div></div>`;
    },

    duo(ep, p) {
      const js = ep.animateurs.slice(0, 2).map((a) => joueur((ep.classements[a.id] || [])[p.r - 1]));
      const noms = js.map(nomComplet);
      const meme = js[0] && noms[0] === noms[1];
      const t = ep.animateurs.slice(0, 2).map((a, i) =>
        tablette(js[i], null, i ? "d" : "g", "", 300 + i * 450, 640, 110) +
        `<div class="qui a a-ecrit" style="${i ? "right:150px" : "left:150px"};top:${i ? 290 : 300}px;animation-delay:${700 + i * 450}ms">${esc(a.nom)}</div>`).join("");
      return `<div class="scene duo sur-ardoise">${ardoise()}${sticker()}${etiquette(ep)}
        <div class="tete"><div class="t titre craie-texture a a-pose" ${d(0)}><span>#</span>${p.r}</div></div>
        ${t}
        ${meme ? `<div class="tampon clair a a-tampon" ${d(2600)}>Même choix !</div>` : ""}</div>`;
    },

    recap(ep) {
      const listes = ep.animateurs.slice(0, 2).map((a) => (ep.classements[a.id] || []).map((r) => nomComplet(joueur(r))));
      const compte = {};
      listes.forEach((l) => new Set(l.filter((n) => n !== "À dévoiler")).forEach((n) => (compte[n] = (compte[n] || 0) + 1)));
      const communs = Object.values(compte).filter((c) => c > 1).length;
      const f = ep.animateurs.slice(0, 2).map((a, i) => {
        const lignes = listes[i].map((n, k) => `<div class="ligne ${k < 3 ? "top" : ""} a a-glisse-g" ${d(800 + i * 150 + (9 - k) * 120)}>
          <span class="r">${k + 1}</span><span class="n">${compte[n] > 1 ? `<span class="surligne">${esc(n)}</span>` : esc(n)}</span></div>`).join("");
        return `<div class="feuille papier lignes ${i ? "d" : "g"} a a-tombe" style="--r:${i ? 1.5 : -1.5}deg;animation-delay:${200 + i * 250}ms">
          ${scotch("", 600 + i * 250)}<h3>${esc(a.nom)}</h3>${lignes}</div>`;
      }).join("");
      return `<div class="scene recap sur-ardoise">${ardoise()}${sticker()}
        <div class="tete"><div class="t titre craie-texture a a-monte" ${d(0)}>Nos classements</div></div>
        ${f}
        <div class="bas a a-ecrit" ${d(2400)}>Surligné = ${communs} joueur${communs > 1 ? "s" : ""} dans nos deux tops</div></div>`;
    },

    outro(ep) {
      return `<div class="scene outro sur-ardoise">${ardoise()}
        <div class="logo a a-tombe" ${d(100)}><img src="${esc(M.logo)}" alt=""></div>
        <div class="q titre craie-texture a a-monte" ${d(700)}>Et ton top 10 ?</div>
        <div class="s a a-ecrit" ${d(1100)}>Dis-nous en commentaire qui on a oublié.</div>
        <div class="feuille papier a a-pose" ${d(1700)}>${scotch("", 1950, -30)}
          <div class="t titre"><span class="surligne anim" style="animation-delay:2100ms">Abonne-toi</span></div>
          <div class="r">${(M.reseaux || []).map(esc).join(" · ")}</div></div></div>`;
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
