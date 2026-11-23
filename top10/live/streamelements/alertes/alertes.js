/* TOPSIDE — alertes. Onglet JS du Custom widget StreamElements.
   Une alerte à la fois (file d'attente), durée et son réglables dans « Fields ». */
let reglages = {};
const file = [];
let enCours = false;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nb = (n) => Number(n || 0).toLocaleString("fr-FR");

window.addEventListener("onWidgetLoad", (obj) => { reglages = obj.detail.fieldData || {}; });

window.addEventListener("onEventReceived", (obj) => {
  const l = obj.detail.listener, e = obj.detail.event || {};
  let a = null;
  if (l === "follower-latest" && reglages.follow !== false) a = { type: "Nouveau follow", nom: e.name };
  else if (l === "subscriber-latest" && reglages.sub !== false) {
    if (e.bulkGifted) a = { type: "Subs offerts", nom: e.sender || e.name, detail: `offre ${nb(e.amount)} sub${e.amount > 1 ? "s" : ""}` };
    else if (e.isCommunityGift) return; // déjà annoncé par l'alerte groupée
    else if (e.gifted) a = { type: "Sub offert", nom: e.name, detail: `offert par ${e.sender}` };
    else a = { type: e.amount > 1 ? "Réabonnement" : "Nouveau sub", nom: e.name, detail: e.amount > 1 ? `${nb(e.amount)} mois` : (e.tier === "prime" ? "Prime" : ""), msg: e.message };
  }
  else if (l === "cheer-latest" && reglages.bits !== false) a = { type: "Bits", nom: e.name, detail: `${nb(e.amount)} bits`, msg: e.message };
  else if (l === "raid-latest" && reglages.raid !== false) a = { type: "Raid", nom: e.name, detail: `${nb(e.amount)} raider${e.amount > 1 ? "s" : ""}` };
  else if (l === "tip-latest" && reglages.don !== false) a = { type: "Don", nom: e.name, detail: `${nb(e.amount)} €`, msg: e.message };
  if (!a) return;
  file.push(a);
  if (!enCours) suivante();
});

function suivante() {
  const a = file.shift();
  if (!a) { enCours = false; return; }
  enCours = true;
  const duree = Math.max(2, Number(reglages.duree || 6)) * 1000;
  const logo = reglages.logo ? `<img class="logo" src="${esc(reglages.logo)}" alt="">` : "";
  const msg = reglages.messages !== false && a.msg ? `<div class="msg">${esc(a.msg)}</div>` : "";
  const scene = document.getElementById("scene");
  scene.innerHTML = `<div class="alerte">${logo}<div class="txt"><div class="type">${esc(a.type)}</div><div class="nom">${esc(a.nom)}</div>${a.detail ? `<div class="detail">${esc(a.detail)}</div>` : ""}${msg}</div></div>`;
  if (reglages.son) { try { const s = new Audio(reglages.son); s.volume = Math.min(1, Number(reglages.volume ?? 50) / 100); s.play().catch(() => {}); } catch (err) {} }
  setTimeout(() => {
    const el = scene.querySelector(".alerte");
    if (el) el.classList.add("sort");
    setTimeout(() => { scene.innerHTML = ""; setTimeout(suivante, 400); }, 500);
  }, duree);
}
