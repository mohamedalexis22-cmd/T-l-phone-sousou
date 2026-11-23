/* =========================================================
   TOPSIDE — réglages partagés par tous les overlays dans OBS
   Dans OBS : clic droit sur un overlay → Interagir → double-clic
   n'importe où → le panneau s'ouvre. Ce qui est enregistré ici
   vaut pour toutes les sources (même ordinateur).
   ========================================================= */
(function () {
  const CLE = "topside-live-obs";
  const CHAMPS = [
    ["nom", "Nom de l'émission (affiché quand il n'y a pas de sujet)", "ex. TOPSIDE"],
    ["couleur", "Couleur d'accent", "", "color"],
    ["chaine", "Nom de votre chaîne Twitch", "ex. topside"],
    ["sujet", "Sujet du live", "ex. On réagit à l'actu foot"],
    ["heure", "Heure de début (écran d'attente)", "ex. 21:00"],
    ["minutes", "… ou compte à rebours en minutes (relancé à chaque enregistrement)", "ex. 10"],
    ["prochain", "Prochain live (écran de fin)", "ex. Mercredi 21h : tier list"],
    ["reseaux", "Réseaux (séparés par des virgules)", "ex. @topside"],
    ["tiers", "Lignes de la tier list", "ex. S, A, B, C, D"],
  ];
  function lire() { try { return JSON.parse(localStorage.getItem(CLE) || "{}"); } catch (e) { return {}; } }
  function ecrire(v) { try { localStorage.setItem(CLE, JSON.stringify(v)); } catch (e) {} }

  // Valeur : réglage OBS d'abord, sinon paramètre d'adresse
  function valeur(nom) {
    const r = lire();
    if (r[nom] != null && String(r[nom]).trim() !== "") return String(r[nom]).trim();
    return new URLSearchParams(location.search).get(nom) || "";
  }

  function panneau() {
    if (document.getElementById("topside-reglages")) return;
    const r = lire();
    const d = document.createElement("div");
    d.id = "topside-reglages";
    d.innerHTML = `<style>
      #topside-reglages{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:grid;place-items:center;font:15px/1.4 Inter,Arial,sans-serif;color:#f4f3f7}
      #topside-reglages .p{width:min(560px,92vw);background:#141416;border:1px solid #2a2a30;border-radius:14px;padding:22px}
      #topside-reglages h3{font:400 28px Anton,Impact,sans-serif;text-transform:uppercase;margin:0 0 4px}
      #topside-reglages h3 b{color:#c4a7ff;font-weight:400}
      #topside-reglages small{color:#8d8b95}
      #topside-reglages label{display:block;font-size:12px;color:#8d8b95;margin:12px 0 4px}
      #topside-reglages input{width:100%;box-sizing:border-box;background:#1d1d21;color:#f4f3f7;border:1px solid #2a2a30;border-radius:8px;padding:10px 12px;font:inherit}
      #topside-reglages .b{display:flex;gap:8px;justify-content:flex-end;margin-top:18px}
      #topside-reglages button{border:0;border-radius:8px;padding:10px 16px;font:700 14px Inter,sans-serif;cursor:pointer}
      #topside-reglages .coul{display:flex;gap:10px;align-items:center}
      #topside-reglages input[type=color]{width:70px;height:44px;padding:3px;cursor:pointer}
      #topside-reglages .defaut{background:#1d1d21;color:#f4f3f7;font-weight:600}
      #topside-reglages .ok{background:#c4a7ff;color:#0b0b0c} #topside-reglages .non{background:#1d1d21;color:#f4f3f7}
      #topside-reglages .edit{width:100%;margin:14px 0 2px;background:#c4a7ff;color:#0b0b0c;font-size:15px;padding:12px}
      #topside-reglages .p{max-height:92vh;overflow:auto}
    </style><form class="p"><h3>Réglages <b>TOPSIDE</b></h3><small>Valables pour tous les overlays de ce PC.</small>
      ${window.TOPSIDE_EDITEUR ? '<button type="button" class="edit">✎ Modifier la disposition et les textes de cet écran</button>' : ""}
      ${CHAMPS.map(([k, l, ph, type]) => type === "color"
        ? `<label>${l}</label><div class="coul"><input type="color" name="${k}" value="${r[k] || "#c4a7ff"}"><button type="button" class="defaut">Lila d'origine</button></div>`
        : `<label>${l}</label><input name="${k}" placeholder="${ph}" value="${String(r[k] || "").replace(/"/g, "&quot;")}">`).join("")}
      <div class="b"><button type="button" class="non">Annuler</button><button class="ok">Enregistrer</button></div></form>`;
    document.body.appendChild(d);
    d.querySelector(".non").onclick = () => d.remove();
    const be = d.querySelector(".edit"); if (be) be.onclick = () => { d.remove(); window.TOPSIDE_EDITEUR(); };
    d.querySelector(".defaut").onclick = () => { d.querySelector("input[type=color]").value = "#c4a7ff"; };
    d.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      const v = Object.assign(lire(), Object.fromEntries(new FormData(e.target)));
      const mn = Number(String(v.minutes || "").replace(",", "."));
      if (mn > 0) v.finChrono = Date.now() + mn * 60000; else delete v.finChrono;
      v.maj = Date.now();
      ecrire(v); d.remove(); location.reload();
    };
  }

  addEventListener("dblclick", (e) => { if (!e.target.closest("input, button, .tuile, #topside-reglages, #outils-edition") && !document.body.classList.contains("edition")) panneau(); });
  // Les autres sources se rechargent quand les réglages changent
  let derniere = lire().maj || 0;
  setInterval(() => { const m = lire().maj || 0; if (m !== derniere) { derniere = m; location.reload(); } }, 2000);

  // Couleur d'accent appliquée à tous les overlays
  const c = lire().couleur;
  if (c && /^#[0-9a-f]{6}$/i.test(c)) {
    const st = document.documentElement.style;
    st.setProperty("--lila", c);
    st.setProperty("--lila-fort", c);
  }

  window.TOPSIDE_REGLAGES = { lire, valeur, panneau };
})();
