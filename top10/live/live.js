/* =========================================================
   TOPSIDE — overlays de live (version épurée, une caméra)
   overlay.html?ecran=attente|pause|fin|reaction|tweets|tierlist|discussion
   Tout se règle dans OBS : clic droit sur la source → Interagir →
   double-clic → réglages, ou « Modifier la disposition et les textes ».
   Disposition et textes enregistrés sur le PC (localStorage).
   ========================================================= */
(function () {
  "use strict";
  const M = window.MARQUE;
  const q = new URLSearchParams(location.search);
  const liste = (v) => String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
  const R = window.TOPSIDE_REGLAGES || { valeur: (k) => q.get(k) || "", lire: () => ({}) };
  const P = {
    ecran: q.get("ecran") || "attente",
    sujet: R.valeur("sujet"),
    heure: R.valeur("heure"),
    min: Number(q.get("min") || 0),
    prochain: R.valeur("prochain"),
    tiers: liste(R.valeur("tiers") || q.get("tiers") || "S,A,B,C,D").slice(0, 7),
    reseaux: liste(R.valeur("reseaux") || (M.reseaux || []).join(",")),
    apercu: q.get("apercu") === "1",
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const logo = "../" + M.logo;

  /* ---------- Disposition et textes personnalisés ---------- */
  const CLE_DISPO = "topside-dispo", CLE_TXT = "topside-textes";
  const lireJ = (k) => { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch (e) { return {}; } };
  const ecrireJ = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  function signaler() { // fait recharger les autres sources OBS
    const r = lireJ("topside-live-obs"); r.maj = Date.now(); ecrireJ("topside-live-obs", r);
  }
  const DISPO = lireJ(CLE_DISPO)[P.ecran] || {};
  const TXT = lireJ(CLE_TXT);
  const txt = (cle, defaut) => { const v = TXT[P.ecran + "." + cle]; return v != null && v !== "" ? v : defaut; };
  const T = (cle, defaut, tag = "span", cls = "") => `<${tag} class="${cls}" data-texte="${cle}">${esc(txt(cle, defaut))}</${tag}>`;

  // Dispositions d'origine (en pixels sur 1920×1080)
  const CAM = { x: 1350, y: 40, w: 530, h: 298 };
  const CHAT = { x: 1350, y: 378, w: 530, h: 662 };
  const ORIGINE = {
    attente: { bloc: { x: 120, y: 300 }, chat: { x: 1400, y: 40, w: 480, h: 1000 } },
    pause: { bloc: { x: 120, y: 330 }, chat: { x: 1400, y: 40, w: 480, h: 1000 } },
    fin: { bloc: { x: 120, y: 330 }, chat: { x: 1400, y: 40, w: 480, h: 1000 } },
    reaction: { video: { x: 40, y: 40, w: 1280, h: 720 }, cam: CAM, chat: CHAT, logo: { x: 40, y: 800, w: 74 }, barre: { x: 140, y: 812, w: 1180 } },
    tweets: { tweets: { x: 40, y: 40, w: 760, h: 880 }, cam: { x: 840, y: 40, w: 1040, h: 585 }, chat: { x: 840, y: 665, w: 1040, h: 375 }, logo: { x: 40, y: 950, w: 70 }, barre: { x: 130, y: 960, w: 700 } },
    discussion: { chat: { x: 1480, y: 300, w: 400, h: 620 }, logo: { x: 40, y: 40, w: 70 }, barre: { x: 40, y: 960, w: 1300 } },
    pleinecran: { logo: { x: 40, y: 34, w: 84 }, titre: { x: 140, y: 44, w: 700 } },
    ecrancam: { cam: { x: 1440, y: 40, w: 440, h: 248 }, bandeau: { x: 1440, y: 300, w: 440 } },
    ecrancamg: { cam: { x: 40, y: 724, w: 440, h: 248 }, bandeau: { x: 40, y: 984, w: 440 } },
    tierlist: { cam: CAM, chat: CHAT, logo: { x: 40, y: 34, w: 64 }, titre: { x: 124, y: 44, w: 700 }, ajout: { x: 840, y: 44, w: 480 }, board: { x: 40, y: 120, w: 1280, h: 740 }, bac: { x: 40, y: 880, w: 1280, h: 160 } },
  };
  const L = {};
  Object.entries(ORIGINE[P.ecran] || ORIGINE.attente).forEach(([k, v]) => (L[k] = Object.assign({}, v, DISPO[k] || {})));
  const NOMS = { bandeau: "Bandeau caméra", video: "Vidéo", tweets: "Tweets", cam: "Caméra", chat: "Tchat", logo: "Logo", barre: "Bandeau", bloc: "Textes", titre: "Titre", ajout: "Ajout joueur", board: "Tableau", bac: "À classer" };
  const pos = (b) => `left:${b.x}px;top:${b.y}px;${b.w ? `width:${b.w}px;` : ""}${b.h ? `height:${b.h}px;` : ""}`;

  /* ---------- Briques ---------- */
  function fondPerce(cles, accent) {
    const trous = cles.map((k) => L[k]);
    const couches = trous.map((t) => `linear-gradient(#000 0 0) ${t.x}px ${t.y}px / ${t.w}px ${t.h}px no-repeat`);
    couches.push("linear-gradient(#000 0 0)");
    const m = couches.join(", ");
    return `<div class="fond-live" style="-webkit-mask:${m};-webkit-mask-composite:xor;mask:${m};mask-composite:exclude"></div>` +
      cles.map((k) => `<div class="trou-vue" style="${pos(L[k])}">${esc(NOMS[k])}</div>
        <div class="cadre-trou ${k === accent ? "accent" : ""}" data-edit="${k}" style="${pos(L[k])}"></div>`).join("");
  }
  const logoA = () => `<div class="logo-live a" data-edit="logo" data-carre="1" style="${pos({ x: L.logo.x, y: L.logo.y, w: L.logo.w, h: L.logo.w })}"><img src="${esc(logo)}" alt=""></div>`;
  function barre(surCam) {
    const t = P.sujet || R.valeur("nom") || M.nom;
    const larg = L.barre.w || 1100;
    const taille = Math.round(Math.min(52, (larg - 200) / (Math.max(8, t.length) * 0.46)));
    return `<div class="barre-live a ${surCam ? "sur-cam" : ""}" data-edit="barre" data-largeur="1" style="${pos({ x: L.barre.x, y: L.barre.y, w: larg })};animation-delay:150ms">
      <div class="t" style="font-size:${taille}px">${esc(t)}</div><div class="direct"><i></i>${T("direct", "En direct")}</div></div>`;
  }

  /* ---------- Écrans ---------- */
  const ECRANS = {
    attente: () => ecranTexte(T("petit", "Le live commence dans", "div", "petit a"), `<div class="chrono a" id="chrono" style="animation-delay:200ms">--:--</div>`, P.sujet),
    pause: () => ecranTexte(T("petit", "Petite pause", "div", "petit a"), `<div class="grand a" style="animation-delay:200ms">${T("mot1", "On")} <span>${T("mot2", "revient")}</span></div>`, P.sujet),
    fin: () => ecranTexte(T("petit", P.prochain ? "Prochain live" : "C'est fini pour aujourd'hui", "div", "petit a"), `<div class="grand a" style="animation-delay:200ms">${T("mot1", "Merci")} <span>${T("mot2", "à vous")}</span></div>`, P.prochain),
    reaction: () => fondPerce(["video", "cam", "chat"], "video") + logoA() + barre(),
    tweets: () => fondPerce(["tweets", "cam", "chat"], "tweets") + logoA() + barre(),
    discussion: () => `<div class="trou-vue" style="left:0;top:0;width:1920px;height:1080px;border-radius:0">Caméra plein cadre</div>
        <div class="fond-chat" data-edit="chat" style="position:absolute;${pos(L.chat)};background:rgba(12,12,13,.55);border-radius:6px"></div>
        ${logoA()}${barre(true)}`,
    pleinecran: () => `<div class="trou-vue" style="left:0;top:0;width:1920px;height:1080px;border-radius:0">Caméra plein écran</div>
        ${logoA()}<div class="titre-coin a" data-edit="titre" data-largeur="1" style="${pos(L.titre)}">${T("titre", R.valeur("nom") || M.nom)}</div>`,
    ecrancam: () => ecranCam(),
    ecrancamg: () => ecranCam(),
    tierlist: () => fondPerce(["cam", "chat"]) + logoA() +
      `<div class="barre-live a" data-edit="titre" data-largeur="1" style="${pos(L.titre)}"><div class="t" style="font-size:44px">${esc(P.sujet || txt("titre", "Tier list"))}</div></div>
        <form class="tl-ajout" id="tl-ajout" data-edit="ajout" data-largeur="1" style="${pos(L.ajout)}" autocomplete="off">
          <input list="tl-banque" id="tl-nom" placeholder="Ajouter un joueur…"><button>Ajouter</button></form>
        <div class="tl-board" id="tl-board" data-edit="board" style="${pos(L.board)}"></div>
        <div class="tl-bac" id="tl-bac" data-edit="bac" style="${pos(L.bac)}"><span class="t">À classer</span></div>
        <datalist id="tl-banque"></datalist>`,
  };

  // Écran partagé plein cadre + caméra dans un coin + petit bandeau sous la caméra
  function ecranCam() {
    return `<div class="trou-vue" style="left:0;top:0;width:1920px;height:1080px;border-radius:0">Votre écran</div>
      <div class="trou-vue" style="${pos(L.cam)}">Caméra</div>
      <div class="cadre-trou cadre-cam" data-edit="cam" style="${pos(L.cam)}"></div>
      <div class="bandeau-cam a" data-edit="bandeau" data-largeur="1" style="${pos(L.bandeau)}">
        <img src="${esc(logo)}" alt="">${T("nom", R.valeur("nom") || M.nom, "span", "n")}<span class="direct"><i></i>${T("direct", "Live")}</span></div>`;
  }

  // Rangée réseaux (logos officiels + pseudos) + horaire
  function sociaux() {
    const S = window.SOCIAUX;
    if (!S) return P.reseaux.length ? `<div class="reseaux a" style="animation-delay:500ms">${P.reseaux.map(esc).join("   ·   ")}</div>` : "";
    return `<div class="sociaux a" style="animation-delay:500ms">${S.liste.map((s) => `<span class="so">${S.badge(s.app, 34)}<b>${esc(s.pseudo)}</b></span>`).join("")}</div>
      <div class="horaire-live a" style="animation-delay:650ms"><i></i>${T("horaire", S.horaire)}</div>`;
  }

  function ecranTexte(petit, centre, sujet) {
    return fondPerce(["chat"]) + `<div class="attente" data-edit="bloc" style="left:${L.bloc.x}px;top:${L.bloc.y}px;bottom:auto;justify-content:flex-start">
      <div class="logo-live a"><img src="${esc(logo)}" alt=""></div>
      ${petit}${centre}
      ${sujet ? `<div class="sujet a" style="animation-delay:350ms"><div class="t">${esc(sujet)}</div></div>` : ""}
      ${sociaux()}</div>`;
  }

  /* ---------- Compte à rebours ---------- */
  function lancerChrono() {
    const el = document.getElementById("chrono");
    if (!el) return;
    const reg = R.lire ? R.lire() : {};
    let fin;
    if (reg.finChrono) fin = new Date(Number(reg.finChrono));
    else if (/^\d{1,2}[:h]\d{2}$/.test(P.heure)) { const [h, m] = P.heure.split(/[:h]/).map(Number); fin = new Date(); fin.setHours(h, m, 0, 0); }
    else fin = new Date(Date.now() + (P.min || 5) * 60000);
    const deux = (n) => String(n).padStart(2, "0");
    const fini = txt("fini", "C'est parti");
    const maj = () => {
      const s = Math.max(0, Math.round((fin - Date.now()) / 1000));
      el.textContent = !s ? fini : s >= 3600 ? `${Math.floor(s / 3600)}:${deux(Math.floor(s / 60) % 60)}:${deux(s % 60)}` : `${deux(Math.floor(s / 60))}:${deux(s % 60)}`;
    };
    maj(); setInterval(maj, 1000);
  }

  /* ---------- Mode édition : déplacer, redimensionner, réécrire ---------- */
  function editer() {
    if (document.body.classList.contains("edition")) return;
    document.body.classList.add("edition", "apercu");
    const stage = document.getElementById("stage");
    const echelle = () => stage.getBoundingClientRect().width / 1920;
    const nouvelle = JSON.parse(JSON.stringify(L));
    const textes = Object.assign({}, TXT);

    const barreOutils = document.createElement("div");
    barreOutils.id = "outils-edition";
    barreOutils.innerHTML = `<b>Mode édition</b><span>Glissez les éléments · coin en bas à droite = taille · cliquez un texte pour le réécrire</span>
      <button class="raz">Disposition d'origine</button><button class="non">Annuler</button><button class="ok">Enregistrer</button>`;
    document.body.appendChild(barreOutils);

    // Textes modifiables
    stage.querySelectorAll("[data-texte]").forEach((el) => {
      el.contentEditable = "true"; el.spellcheck = false;
      el.addEventListener("input", () => { textes[P.ecran + "." + el.dataset.texte] = el.textContent.trim(); });
      el.addEventListener("mousedown", (e) => e.stopPropagation());
    });

    // Éléments déplaçables
    stage.querySelectorAll("[data-edit]").forEach((el) => {
      const k = el.dataset.edit;
      el.classList.add("editable");
      const etiq = document.createElement("span"); etiq.className = "etiq-edit"; etiq.textContent = NOMS[k] || k; el.appendChild(etiq);
      const poignee = document.createElement("span"); poignee.className = "poignee"; el.appendChild(poignee);
      const glisser = (e, mode) => {
        if (e.target.isContentEditable || e.target.closest("input")) return;
        e.preventDefault(); e.stopPropagation();
        const s = echelle(), b = nouvelle[k], x0 = e.clientX, y0 = e.clientY;
        const depart = { x: b.x, y: b.y, w: b.w || el.offsetWidth, h: b.h || el.offsetHeight };
        const bouge = (ev) => {
          const dx = Math.round((ev.clientX - x0) / s), dy = Math.round((ev.clientY - y0) / s);
          if (mode === "taille") {
            b.w = Math.max(60, depart.w + dx);
            if (el.dataset.carre) { b.h = b.w; el.style.height = b.w + "px"; }
            else if (!el.dataset.largeur && b.h != null) { b.h = Math.max(40, depart.h + dy); el.style.height = b.h + "px"; }
            el.style.width = b.w + "px";
          } else {
            b.x = Math.round(depart.x + dx); b.y = Math.round(depart.y + dy);
            el.style.left = b.x + "px"; el.style.top = b.y + "px";
          }
          // la zone rayée suit le cadre
          const vue = el.previousElementSibling;
          if (vue && vue.classList.contains("trou-vue")) { vue.style.left = el.style.left; vue.style.top = el.style.top; vue.style.width = el.style.width; vue.style.height = el.style.height; }
        };
        const lache = () => { removeEventListener("mousemove", bouge); removeEventListener("mouseup", lache); };
        addEventListener("mousemove", bouge); addEventListener("mouseup", lache);
      };
      el.addEventListener("mousedown", (e) => glisser(e, "bouger"));
      poignee.addEventListener("mousedown", (e) => glisser(e, "taille"));
    });

    barreOutils.querySelector(".non").onclick = () => location.reload();
    barreOutils.querySelector(".raz").onclick = () => {
      if (!confirm("Remettre la disposition et les textes d'origine pour cet écran ?")) return;
      const d = lireJ(CLE_DISPO); delete d[P.ecran]; ecrireJ(CLE_DISPO, d);
      const t = lireJ(CLE_TXT); Object.keys(t).forEach((c) => c.startsWith(P.ecran + ".") && delete t[c]); ecrireJ(CLE_TXT, t);
      signaler(); location.reload();
    };
    barreOutils.querySelector(".ok").onclick = () => {
      const d = lireJ(CLE_DISPO); d[P.ecran] = nouvelle; ecrireJ(CLE_DISPO, d);
      ecrireJ(CLE_TXT, textes);
      signaler(); location.reload();
    };
  }
  window.TOPSIDE_EDITEUR = editer;
  addEventListener("keydown", (e) => { if ((e.key === "e" || e.key === "E") && !e.target.closest("input, [contenteditable=true]")) editer(); });

  /* ---------- Tier list (OBS : clic droit sur la source → Interagir) ---------- */
  function lancerTierlist() {
    const CLE = "topside-tierlist:" + (P.sujet || "") + ":" + P.tiers.join("");
    const banque = (window.JOUEURS || []).slice().sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));
    const nomJ = (j) => j.surnom || [j.prenom, j.nom].filter(Boolean).join(" ");
    const etiquette = (j) => `${nomJ(j)} (${[j.nation, (j.ne || "").slice(0, 4)].filter(Boolean).join(", ")})`;
    const parEt = Object.fromEntries(banque.map((j) => [etiquette(j).toLowerCase(), j]));
    const sa = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    const parNom = {};
    banque.forEach((j) => [nomJ(j), j.nom || ""].forEach((k) => { k = sa(k); if (k) parNom[k] = k in parNom && parNom[k] !== j ? null : j; }));
    const parId = Object.fromEntries(banque.map((j) => [j.id, j]));
    document.getElementById("tl-banque").innerHTML = banque.map((j) => `<option value="${esc(etiquette(j))}">`).join("");

    let etat;
    try { etat = JSON.parse(localStorage.getItem(CLE) || "null"); } catch (e) { etat = null; }
    if (!etat) etat = { tiers: P.tiers.map(() => []), bac: [] };
    while (etat.tiers.length < P.tiers.length) etat.tiers.push([]);
    const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {} };

    const tuile = (t) => {
      const j = t.id && parId[t.id];
      const nom = j ? (j.surnom || j.nom) : t.nom;
      const ph = j && j.photo ? `background-image:url('../${esc(j.photo)}')` : "";
      return `<div class="tuile" draggable="true" data-k="${esc(t.k)}"><div class="im" style="${ph}">${ph ? "" : esc((nom || "?").slice(0, 2).toUpperCase())}</div><div class="nm">${esc(nom)}</div><span class="x" title="Retirer">×</span></div>`;
    };
    const zone = (z) => (z === "bac" ? etat.bac : etat.tiers[Number(z)]);
    const retirer = (k) => { for (const l of [etat.bac, ...etat.tiers]) { const i = l.findIndex((t) => t.k === k); if (i >= 0) return l.splice(i, 1)[0]; } };
    let tenue = null;
    function rendre() {
      document.getElementById("tl-board").innerHTML = P.tiers.map((t, i) => `<div class="tl-row"><div class="tl-lab">${esc(t)}</div><div class="tl-zone" data-z="${i}">${etat.tiers[i].map(tuile).join("")}</div></div>`).join("");
      const bac = document.getElementById("tl-bac");
      bac.querySelectorAll(".tuile").forEach((x) => x.remove());
      bac.insertAdjacentHTML("beforeend", etat.bac.map(tuile).join(""));
      bac.dataset.z = "bac";
      document.querySelectorAll(".tuile").forEach((el) => {
        el.addEventListener("dragstart", (e) => { tenue = el.dataset.k; e.dataTransfer.setData("text/plain", tenue); });
        el.querySelector(".x").addEventListener("click", (e) => { e.stopPropagation(); retirer(el.dataset.k); rendre(); });
      });
      document.querySelectorAll(".tl-zone, #tl-bac").forEach((z) => {
        z.addEventListener("dragover", (e) => { e.preventDefault(); z.classList.add("survol"); });
        z.addEventListener("dragleave", () => z.classList.remove("survol"));
        z.addEventListener("drop", (e) => {
          e.preventDefault(); z.classList.remove("survol");
          const k = e.dataTransfer.getData("text/plain") || tenue; if (!k) return;
          const t = retirer(k); if (!t) return;
          const cible = e.target.closest(".tuile"), l = zone(z.dataset.z);
          const i = cible ? l.findIndex((x) => x.k === cible.dataset.k) : -1;
          if (i >= 0) l.splice(i, 0, t); else l.push(t);
          rendre();
        });
      });
      sauver();
    }
    document.getElementById("tl-ajout").addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = document.getElementById("tl-nom"), v = inp.value.trim(); if (!v) return;
      const j = parEt[v.toLowerCase()] || parNom[sa(v)];
      etat.bac.push(j ? { k: "k" + Date.now(), id: j.id } : { k: "k" + Date.now(), nom: v });
      inp.value = ""; rendre();
    });
    rendre();
  }

  function ajuste() {
    const st = document.getElementById("stage");
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    st.style.transform = `translate(${(innerWidth - 1920 * k) / 2}px, ${(innerHeight - 1080 * k) / 2}px) scale(${k})`;
  }

  document.body.classList.toggle("apercu", P.apercu);
  document.title = "TOPSIDE · " + P.ecran;
  document.getElementById("stage").innerHTML = (ECRANS[P.ecran] || ECRANS.attente)();
  ajuste(); addEventListener("resize", ajuste);
  lancerChrono();
  if (P.ecran === "tierlist") lancerTierlist();
})();
