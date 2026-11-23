/* =========================================================
   TOPSIDE — overlays de live (version épurée, une caméra)
   overlay.html?ecran=attente|pause|fin|reaction|tweets|tierlist|discussion
     &sujet=…       sujet du live
     &heure=21:00   ou  &min=10   compte à rebours (attente)
     &prochain=…    prochain live (fin)
     &tiers=S,A,B,C,D
     &reseaux=@a,@b
     &apercu=1      montre les zones transparentes (régie)
   ========================================================= */
(function () {
  "use strict";
  const M = window.MARQUE;
  const q = new URLSearchParams(location.search);
  const liste = (v) => String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
  const R = window.TOPSIDE_REGLAGES || { valeur: (k) => q.get(k) || "" };
  const P = {
    ecran: q.get("ecran") || "attente",
    sujet: R.valeur("sujet"),
    heure: R.valeur("heure"),
    min: Number(q.get("min") || 0),
    prochain: R.valeur("prochain"),
    tiers: liste(q.get("tiers") || "S,A,B,C,D").slice(0, 7),
    reseaux: liste(R.valeur("reseaux") || (M.reseaux || []).join(",")),
    apercu: q.get("apercu") === "1",
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const logo = "../" + M.logo;

  /* ---------- Fond percé + cadres fins ---------- */
  function fondPerce(trous) {
    const couches = trous.map((t) => `linear-gradient(#000 0 0) ${t.x}px ${t.y}px / ${t.w}px ${t.h}px no-repeat`);
    couches.push("linear-gradient(#000 0 0)");
    const m = couches.join(", ");
    return `<div class="fond-live" style="-webkit-mask:${m};-webkit-mask-composite:xor;mask:${m};mask-composite:exclude"></div>` +
      trous.map((t) => `<div class="trou-vue" style="left:${t.x}px;top:${t.y}px;width:${t.w}px;height:${t.h}px">${esc(t.nom)}</div>
        <div class="cadre-trou ${t.accent ? "accent" : ""}" style="left:${t.x}px;top:${t.y}px;width:${t.w}px;height:${t.h}px"></div>`).join("");
  }
  const logoA = (x, y, taille = 74) => `<div class="logo-live a" style="left:${x}px;top:${y}px;width:${taille}px;height:${taille}px"><img src="${esc(logo)}" alt=""></div>`;
  function barre(x, y, largeur, surCam) {
    const t = P.sujet || R.valeur("nom") || M.nom;
    const taille = Math.round(Math.min(52, (largeur - 200) / (Math.max(8, t.length) * 0.46)));
    return `<div class="barre-live a ${surCam ? "sur-cam" : ""}" style="left:${x}px;top:${y}px;animation-delay:150ms">
      <div class="t" style="font-size:${taille}px">${esc(t)}</div><div class="direct"><i></i>En direct</div></div>`;
  }

  /* ---------- Écrans ---------- */
  // Colonne de droite commune : caméra (vous deux) + tchat
  const CAM = { x: 1350, y: 40, w: 530, h: 298, nom: "Caméra" };
  const CHAT = { x: 1350, y: 378, w: 530, h: 662, nom: "Tchat" };

  const ECRANS = {
    attente: () => ecranTexte("Le live commence dans", "Bientôt", "là", true, P.sujet),
    pause: () => ecranTexte("Petite pause", "On", "revient", false, P.sujet),
    fin: () => ecranTexte(P.prochain ? "Prochain live" : "C'est fini pour aujourd'hui", "Merci", "à vous", false, P.prochain),

    reaction() {
      const video = { x: 40, y: 40, w: 1280, h: 720, nom: "Vidéo", accent: true };
      return fondPerce([video, CAM, CHAT]) + logoA(40, 800) + barre(140, 812, 1180);
    },

    tweets() {
      const tw = { x: 40, y: 40, w: 760, h: 880, nom: "Tweets", accent: true };
      const cam = { x: 840, y: 40, w: 1040, h: 585, nom: "Caméra" };
      const chat = { x: 840, y: 665, w: 1040, h: 375, nom: "Tchat" };
      return fondPerce([tw, cam, chat]) + logoA(40, 950, 70) + barre(130, 960, 700);
    },

    discussion() {
      const chat = { x: 1480, y: 300, w: 400, h: 620, nom: "Tchat" };
      return `<div class="trou-vue" style="left:0;top:0;width:1920px;height:1080px;border-radius:0">Caméra plein cadre</div>
        <div style="position:absolute;left:${chat.x}px;top:${chat.y}px;width:${chat.w}px;height:${chat.h}px;background:rgba(12,12,13,.55);border-radius:6px"></div>
        <div class="trou-vue" style="left:${chat.x}px;top:${chat.y}px;width:${chat.w}px;height:${chat.h}px">Tchat</div>
        ${logoA(40, 40, 70)}${barre(40, 960, 1300, true)}`;
    },

    tierlist() {
      return fondPerce([CAM, CHAT]) + logoA(40, 34, 64) +
        `<div class="barre-live a" style="left:124px;top:44px"><div class="t" style="font-size:44px">${esc(P.sujet || "Tier list")}</div></div>
        <form class="tl-ajout" id="tl-ajout" style="left:840px;top:44px;width:480px" autocomplete="off">
          <input list="tl-banque" id="tl-nom" placeholder="Ajouter un joueur…"><button>Ajouter</button></form>
        <div class="tl-board" id="tl-board" style="left:40px;top:120px;width:1280px;height:740px"></div>
        <div class="tl-bac" id="tl-bac" style="left:40px;top:880px;width:1280px;height:160px"><span class="t">À classer</span></div>
        <datalist id="tl-banque"></datalist>`;
    },
  };

  function ecranTexte(petit, mot1, mot2, chrono, sujet) {
    const chat = { x: 1400, y: 40, w: 480, h: 1000, nom: "Tchat" };
    return fondPerce([chat]) + `<div class="attente">
      <div class="logo-live a"><img src="${esc(logo)}" alt=""></div>
      <div class="petit a" style="animation-delay:100ms">${esc(petit)}</div>
      ${chrono ? `<div class="chrono a" id="chrono" style="animation-delay:200ms">--:--</div>` : `<div class="grand a" style="animation-delay:200ms">${esc(mot1)} <span>${esc(mot2)}</span></div>`}
      ${sujet ? `<div class="sujet a" style="animation-delay:350ms"><div class="t">${esc(sujet)}</div></div>` : ""}
      ${P.reseaux.length ? `<div class="reseaux a" style="animation-delay:500ms">${P.reseaux.map(esc).join("   ·   ")}</div>` : ""}</div>`;
  }

  /* ---------- Compte à rebours ---------- */
  function lancerChrono() {
    const el = document.getElementById("chrono");
    if (!el) return;
    let fin;
    if (/^\d{1,2}[:h]\d{2}$/.test(P.heure)) { const [h, m] = P.heure.split(/[:h]/).map(Number); fin = new Date(); fin.setHours(h, m, 0, 0); }
    else fin = new Date(Date.now() + (P.min || 5) * 60000);
    const deux = (n) => String(n).padStart(2, "0");
    const maj = () => {
      const s = Math.max(0, Math.round((fin - Date.now()) / 1000));
      el.textContent = !s ? "C'est parti" : s >= 3600 ? `${Math.floor(s / 3600)}:${deux(Math.floor(s / 60) % 60)}:${deux(s % 60)}` : `${deux(Math.floor(s / 60))}:${deux(s % 60)}`;
    };
    maj(); setInterval(maj, 1000);
  }

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
