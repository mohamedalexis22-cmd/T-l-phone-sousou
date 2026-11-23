/* TOPSIDE — derniers événements. Onglet JS. */
const nb = (n) => Number(n || 0).toLocaleString("fr-FR");
function poser(id, texte) {
  const el = document.getElementById(id);
  if (!el || !texte) return;
  el.textContent = texte;
  el.classList.remove("neuf"); void el.offsetWidth; el.classList.add("neuf");
}
window.addEventListener("onWidgetLoad", (obj) => {
  const d = (obj.detail.session && obj.detail.session.data) || {};
  if (d["follower-latest"]) poser("ev-follow", d["follower-latest"].name);
  if (d["subscriber-latest"]) poser("ev-sub", d["subscriber-latest"].name);
  if (d["cheer-latest"] && d["cheer-latest"].name) poser("ev-bits", `${d["cheer-latest"].name} · ${nb(d["cheer-latest"].amount)}`);
});
window.addEventListener("onEventReceived", (obj) => {
  const l = obj.detail.listener, e = obj.detail.event || {};
  if (l === "follower-latest") poser("ev-follow", e.name);
  else if (l === "subscriber-latest") poser("ev-sub", e.bulkGifted ? e.sender : e.name);
  else if (l === "cheer-latest") poser("ev-bits", `${e.name} · ${nb(e.amount)}`);
});
