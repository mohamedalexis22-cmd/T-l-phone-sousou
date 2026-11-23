/* =========================================================
   TOPSIDE — réglages partagés par tous les overlays dans OBS
   Dans OBS : clic droit sur un overlay → Interagir → double-clic
   n'importe où → le panneau s'ouvre. Ce qui est enregistré ici
   vaut pour toutes les sources (même ordinateur).
   ========================================================= */
(function () {
  const CLE = "topside-live-obs";
  const CHAMPS = [
    ["chaine", "Nom de votre chaîne Twitch", "ex. topside"],
    ["sujet", "Sujet du live", "ex. On réagit à l'actu foot"],
    ["heure", "Heure de début (écran d'attente)", "ex. 21:00"],
    ["prochain", "Prochain live (écran de fin)", "ex. Mercredi 21h : tier list"],
    ["reseaux", "Réseaux (séparés par des virgules)", "ex. @topside"],
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
      #topside-reglages .ok{background:#c4a7ff;color:#0b0b0c} #topside-reglages .non{background:#1d1d21;color:#f4f3f7}
    </style><form class="p"><h3>Réglages <b>TOPSIDE</b></h3><small>Valables pour tous les overlays de ce PC.</small>
      ${CHAMPS.map(([k, l, ph]) => `<label>${l}</label><input name="${k}" placeholder="${ph}" value="${String(r[k] || "").replace(/"/g, "&quot;")}">`).join("")}
      <div class="b"><button type="button" class="non">Annuler</button><button class="ok">Enregistrer</button></div></form>`;
    document.body.appendChild(d);
    d.querySelector(".non").onclick = () => d.remove();
    d.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      const v = Object.assign(lire(), Object.fromEntries(new FormData(e.target)));
      v.maj = Date.now();
      ecrire(v); d.remove(); location.reload();
    };
  }

  addEventListener("dblclick", (e) => { if (!e.target.closest("input, button, .tuile, #topside-reglages")) panneau(); });
  // Les autres sources se rechargent quand les réglages changent
  let derniere = lire().maj || 0;
  setInterval(() => { const m = lire().maj || 0; if (m !== derniere) { derniere = m; location.reload(); } }, 2000);

  window.TOPSIDE_REGLAGES = { lire, valeur, panneau };
})();
