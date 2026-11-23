/* =========================================================
   TOPSIDE — overlays de live
   overlay.html?ecran=attente|pause|fin|reaction|tweets|tierlist|discussion
     &sujet=…   titre du live / sujet du jour
     &heure=21:00  ou  &min=10   compte à rebours (écran « attente »)
     &prochain=…  prochain live (écran « fin »)
     &cams=1|2    nombre de caméras
     &noms=Sulayman,Mosses
     &tiers=S,A,B,C,D   (tier list)
     &apercu=1    montre les trous (régie)
   ========================================================= */
(function () {
  "use strict";
  const M = window.MARQUE;
  const q = new URLSearchParams(location.search);
  const P = {
    ecran: q.get("ecran") || "attente",
    sujet: q.get("sujet") || "",
    heure: q.get("heure") || "",
    min: Number(q.get("min") || 0),
    prochain: q.get("prochain") || "",
    cams: Number(q.get("cams") || 2) === 1 ? 1 : 2,
    noms: (q.get("noms") || "Sulayman,Mosses").split(",").map((s) => s.trim()).filter(Boolean),
    tiers: (q.get("tiers") || "S,A,B,C,D").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 7),
    reseaux: (q.get("reseaux") || (M.reseaux || []).join(",")).split(",").map((s) => s.trim()).filter(Boolean),
    apercu: q.get("apercu") === "1",
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const d = (ms) => `style="animation-delay:${ms}ms"`;
  const logo = "../" + M.logo;

  /* ---------- Trous + cadres ---------- */
  function cadre(t, i) {
    const r = [-0.8, 0.6, -0.4, 0.9][i % 4];
    const scotchs = t.sansScotch ? "" : i % 2 ? `<div class="scotch hd"></div><div class="scotch bd"></div>` : `<div class="scotch hg"></div><div class="scotch hd"></div>`;
    return `<div class="trou-vue" style="left:${t.x}px;top:${t.y}px;width:${t.w}px;height:${t.h}px">${esc(t.nom)}</div>
      <div class="cadre-trou a a-fondu" style="left:${t.x}px;top:${t.y}px;width:${t.w}px;height:${t.h}px;animation-delay:${100 + i * 120}ms">
        <div class="bord ${t.fin ? "fin" : ""}" style="--r:${t.fin ? 0 : r}deg"></div>${t.fin ? "" : scotchs}
        ${t.etiq ? `<div class="etiq ${t.lila ? "lila" : ""}">${esc(t.etiq)}</div>` : ""}</div>`;
  }
  function fondPerce(trous) {
    const couches = trous.map((t) => `linear-gradient(#000 0 0) ${t.x}px ${t.y}px / ${t.w}px ${t.h}px no-repeat`);
    couches.push("linear-gradient(#000 0 0)");
    const m = couches.join(", ");
    return `<div class="fond-live" style="-webkit-mask:${m};-webkit-mask-composite:xor;mask:${m};mask-composite:exclude">
      <div class="ardoise"><i class="effacee" style="left:180px;top:140px;width:620px;height:260px"></i><i class="effacee" style="left:1180px;top:620px;width:560px;height:220px"></i></div></div>`;
  }
  const camsColonne = (x, y, w, hCam, gap) => (P.cams === 2
    ? [{ x, y, w, h: hCam, nom: "Caméra 1", etiq: P.noms[0] || "Cam 1", sansScotch: true }, { x, y: y + hCam + gap, w, h: hCam, nom: "Caméra 2", etiq: P.noms[1] || "Cam 2", sansScotch: true }]
    : [{ x, y, w, h: Math.round(hCam * 1.33), nom: "Caméra", etiq: P.noms.join(" & "), sansScotch: true }]);

  function barre(x, y, etiquette, largeurMax) {
    if (!P.sujet && !etiquette) return "";
    return `<div class="barre-live a a-glisse-g" style="left:${x}px;top:${y}px;animation-delay:300ms">
      <div class="sujet papier" style="max-width:${largeurMax || 1100}px">${scotchSimple()}
        <div class="q">${esc(etiquette)}</div><div class="t" style="${tailleTitre(P.sujet, largeurMax || 1100)}">${esc(P.sujet || M.nom)}</div></div>
      <div class="direct"><i></i>En direct</div></div>`;
  }
  const scotchSimple = () => `<div class="scotch" style="left:-46px;top:-6px;width:110px;transform:rotate(-30deg)"></div>`;
  function tailleTitre(t, larg) {
    const n = Math.max(8, String(t || "").length);
    return `font-size:${Math.round(Math.min(54, (larg - 70) / (n * 0.47)))}px`;
  }
  const sticker = (x, y) => `<div class="sticker a a-pose" style="left:${x}px;top:${y}px;animation-delay:200ms;--r:-8deg"><img src="${esc(logo)}" alt=""></div>`;

  /* ---------- Écrans ---------- */
  const ECRANS = {
    attente: () => ecranAttente("Le live", "commence", "Sujet du jour", true),
    pause: () => ecranAttente("Petite", "pause", "On revient tout de suite", false),
    fin: () => ecranAttente("Merci", "d'être venus", P.prochain ? "Prochain live" : "À très vite", false, P.prochain),

    reaction() {
      const video = { x: 50, y: 120, w: 1280, h: 720, nom: "Vidéo YouTube", etiq: "La vidéo", lila: true };
      const cams = camsColonne(1395, 120, 475, 267, 38);
      const yChat = cams[cams.length - 1].y + cams[cams.length - 1].h + 38;
      const trous = [video, ...cams, { x: 1395, y: yChat, w: 475, h: 1030 - yChat, nom: "Tchat", etiq: "Le tchat", sansScotch: true }];
      return fondPerce(trous) + trous.map(cadre).join("") + sticker(40, 10) + barre(220, 880, "On réagit à", 1060);
    },

    tweets() {
      const tw = { x: 60, y: 130, w: 860, h: 760, nom: "Tweets (capture navigateur)", etiq: "Vos tweets", lila: true };
      const cams = P.cams === 2
        ? [{ x: 990, y: 130, w: 420, h: 236, nom: "Caméra 1", etiq: P.noms[0], sansScotch: true }, { x: 1450, y: 130, w: 420, h: 236, nom: "Caméra 2", etiq: P.noms[1], sansScotch: true }]
        : [{ x: 990, y: 130, w: 880, h: 495, nom: "Caméra", etiq: P.noms.join(" & "), sansScotch: true }];
      const yChat = cams[0].y + cams[0].h + 44;
      const trous = [tw, ...cams, { x: 990, y: yChat, w: 880, h: 1030 - yChat, nom: "Tchat", etiq: "Le tchat" }];
      return fondPerce(trous) + trous.map(cadre).join("") + sticker(40, 10) + barre(60, 925, "On réagit à vos tweets", 880);
    },

    discussion() {
      const chat = { x: 1460, y: 330, w: 410, h: 600, nom: "Tchat", etiq: "Le tchat", fin: true };
      return `<div class="trou-vue" style="left:0;top:0;width:1920px;height:1080px">Caméra plein cadre</div>
        <div style="position:absolute;left:${chat.x}px;top:${chat.y}px;width:${chat.w}px;height:${chat.h}px;background:rgba(13,13,14,.55)"></div>
        ${cadre(chat, 1)}${sticker(60, 40)}${barre(90, 940, "En ce moment", 1200)}`;
    },

    tierlist() {
      const cams = camsColonne(1395, 120, 475, 267, 38);
      const yChat = cams[cams.length - 1].y + cams[cams.length - 1].h + 38;
      const trous = [...cams, { x: 1395, y: yChat, w: 475, h: 1030 - yChat, nom: "Tchat", etiq: "Le tchat", sansScotch: true }];
      return fondPerce(trous) + trous.map(cadre).join("") + sticker(40, 10) +
        `<div class="tl-titre papier a a-pose" style="left:180px;top:40px;animation-delay:200ms">${scotchSimple()}<div class="t">${esc(P.sujet || "Tier list")}</div></div>
        <form class="tl-ajout" id="tl-ajout" style="left:830px;top:52px;width:500px" autocomplete="off">
          <input list="tl-banque" id="tl-nom" placeholder="Ajouter un joueur…"><button>Ajouter</button></form>
        <div class="tl-board" id="tl-board" style="left:50px;top:150px;width:1290px;height:690px"></div>
        <div class="tl-bac" id="tl-bac" style="left:50px;top:870px;width:1290px;height:160px"><span class="t">À classer — glissez les photos dans les lignes</span></div>
        <datalist id="tl-banque"></datalist>`;
    },
  };


  function ecranAttente(mot1, mot2, etiq, chrono, prochain) {
    const chat = { x: 1380, y: 130, w: 470, h: 800, nom: "Tchat", etiq: "Le tchat" };
    const sujet = prochain || P.sujet;
    return fondPerce([chat]) + cadre(chat, 1) + `<div class="scene attente">
      <div class="centre">
        <div class="logo a a-tombe" ${d(100)}><img src="${esc(logo)}" alt=""></div>
        <div class="grand titre craie-texture a a-monte" ${d(500)}>${esc(mot1)} <span>${esc(mot2)}</span></div>
        ${chrono ? `<div class="compte a a-pose" ${d(900)}><div class="chrono" id="chrono">--:--</div><div class="lbl" id="chrono-lbl">avant le début</div></div>` : ""}
      </div>
      ${sujet ? `<div class="note papier lignes a a-pose" ${d(1200)}><div class="scotch"></div><div class="q">${esc(etiq)}</div><div class="t">${esc(sujet)}</div></div>` : ""}
      <div class="reseaux a a-fondu" ${d(1500)}>${P.reseaux.map((r) => `<span>${esc(r)}</span>`).join(" · ")}</div></div>`;
  }

  /* ---------- Compte à rebours ---------- */
  function lancerChrono() {
    const el = document.getElementById("chrono");
    if (!el) return;
    let fin;
    if (P.heure && /^\d{1,2}[:h]\d{2}$/.test(P.heure)) {
      const [h, m] = P.heure.split(/[:h]/).map(Number);
      fin = new Date(); fin.setHours(h, m, 0, 0);
    } else fin = new Date(Date.now() + (P.min || 5) * 60000);
    const maj = () => {
      const s = Math.max(0, Math.round((fin - Date.now()) / 1000));
      el.textContent = s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}` : `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
      document.getElementById("chrono-lbl").textContent = s ? "avant le début" : "ça commence !";
    };
    maj(); setInterval(maj, 1000);
  }

  /* ---------- Tier list (interactive : clic droit sur la source OBS → Interagir) ---------- */
  function lancerTierlist() {
    const CLE = "topside-tierlist:" + (P.sujet || "") + ":" + P.tiers.join("");
    const banque = (window.JOUEURS || []).slice().sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));
    const nomJ = (j) => j.surnom || [j.prenom, j.nom].filter(Boolean).join(" ");
    const etiquette = (j) => `${nomJ(j)} (${[j.nation, (j.ne || "").slice(0, 4)].filter(Boolean).join(", ")})`;
    const parEt = Object.fromEntries(banque.map((j) => [etiquette(j).toLowerCase(), j]));
    const sa = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    const parNom = {};
    banque.forEach((j) => [nomJ(j), j.nom || ""].forEach((k) => { k = sa(k); if (k) parNom[k] = k in parNom && parNom[k] !== j ? null : j; }));
    document.getElementById("tl-banque").innerHTML = banque.map((j) => `<option value="${esc(etiquette(j))}">`).join("");

    let etat;
    try { etat = JSON.parse(localStorage.getItem(CLE) || "null"); } catch (e) { etat = null; }
    if (!etat) etat = { tiers: P.tiers.map(() => []), bac: [] };
    while (etat.tiers.length < P.tiers.length) etat.tiers.push([]);
    const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {} };
    const parId = Object.fromEntries(banque.map((j) => [j.id, j]));

    const tuile = (t) => {
      const j = t.id && parId[t.id];
      const nom = j ? (j.surnom || j.nom) : t.nom;
      const ph = j && j.photo ? `background-image:url('../${esc(j.photo)}')` : "";
      return `<div class="tuile" draggable="true" data-k="${esc(t.k)}"><div class="im" style="${ph}">${ph ? "" : esc((nom || "?").slice(0, 2).toUpperCase())}</div><div class="nm">${esc(nom)}</div><span class="x" title="Retirer">×</span></div>`;
    };
    function rendre() {
      document.getElementById("tl-board").innerHTML = P.tiers.map((t, i) => `<div class="tl-row"><div class="tl-lab">${esc(t)}</div><div class="tl-zone" data-z="${i}">${etat.tiers[i].map(tuile).join("")}</div></div>`).join("");
      const bac = document.getElementById("tl-bac");
      bac.querySelectorAll(".tuile").forEach((x) => x.remove());
      bac.insertAdjacentHTML("beforeend", etat.bac.map(tuile).join(""));
      bac.dataset.z = "bac";
      brancher();
      sauver();
    }
    const liste = (z) => (z === "bac" ? etat.bac : etat.tiers[Number(z)]);
    function retirer(k) { for (const l of [etat.bac, ...etat.tiers]) { const i = l.findIndex((t) => t.k === k); if (i >= 0) return l.splice(i, 1)[0]; } }
    let tenue = null;
    function brancher() {
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
          // position : avant la tuile survolée, sinon à la fin
          const cible = e.target.closest(".tuile");
          const l = liste(z.dataset.z);
          const i = cible ? l.findIndex((x) => x.k === cible.dataset.k) : -1;
          if (i >= 0) l.splice(i, 0, t); else l.push(t);
          rendre();
        });
      });
    }
    document.getElementById("tl-ajout").addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = document.getElementById("tl-nom"), v = inp.value.trim(); if (!v) return;
      const j = parEt[v.toLowerCase()] || parNom[sa(v)];
      etat.bac.push(j ? { k: "k" + Date.now(), id: j.id } : { k: "k" + Date.now(), nom: v });
      inp.value = ""; rendre();
    });
    window.viderTierlist = () => { etat = { tiers: P.tiers.map(() => []), bac: [] }; rendre(); };
    rendre();
  }

  function ajuste() {
    const st = document.getElementById("stage");
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    st.style.transform = `translate(${(innerWidth - 1920 * k) / 2}px, ${(innerHeight - 1080 * k) / 2}px) scale(${k})`;
  }

  document.body.classList.toggle("apercu", P.apercu);
  document.title = "TOPSIDE · " + P.ecran;
  const f = ECRANS[P.ecran] || ECRANS.attente;
  document.getElementById("stage").innerHTML = f();
  ajuste(); addEventListener("resize", ajuste);
  lancerChrono();
  if (P.ecran === "tierlist") lancerTierlist();
})();
