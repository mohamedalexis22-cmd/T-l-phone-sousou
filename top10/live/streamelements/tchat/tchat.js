/* TOPSIDE — tchat Twitch. Onglet JS du Custom widget StreamElements. */
let reglages = { max: 12, duree: 0, ignorer: "Nightbot,StreamElements,Streamlabs,Moobot", commandes: true };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

window.addEventListener("onWidgetLoad", (obj) => { reglages = Object.assign(reglages, obj.detail.fieldData || {}); });

// Texte + emotes (positions données par Twitch), tout le reste échappé
function texteAvecEmotes(texte, emotes) {
  const ems = (emotes || []).filter((e) => typeof e.start === "number" && e.urls).sort((a, b) => a.start - b.start);
  if (!ems.length) {
    // repli : remplacement par nom d'emote
    let html = esc(texte);
    (emotes || []).forEach((e) => {
      const url = e.urls && (e.urls["2"] || e.urls["1"]);
      if (url && e.name) html = html.split(esc(e.name)).join(`<img class="emote" src="${esc(url)}" alt="">`);
    });
    return html;
  }
  const car = Array.from(texte);
  let html = "", i = 0;
  ems.forEach((e) => {
    if (e.start < i) return;
    html += esc(car.slice(i, e.start).join(""));
    html += `<img class="emote" src="${esc(e.urls["2"] || e.urls["1"])}" alt="">`;
    i = e.end + 1;
  });
  return html + esc(car.slice(i).join(""));
}

window.addEventListener("onEventReceived", (obj) => {
  const l = obj.detail.listener, ev = obj.detail.event || {};
  const box = document.getElementById("tchat");
  if (l === "delete-message") { box.querySelectorAll(`[data-msg="${CSS.escape(ev.msgId || "")}"]`).forEach((x) => x.remove()); return; }
  if (l === "delete-messages") { box.querySelectorAll(`[data-user="${CSS.escape(ev.userId || "")}"]`).forEach((x) => x.remove()); return; }
  if (l !== "message") return;
  const d = ev.data || {};
  const ignores = String(reglages.ignorer || "").toLowerCase().split(",").map((s) => s.trim());
  if (ignores.includes(String(d.nick || d.displayName || "").toLowerCase())) return;
  if (reglages.commandes && String(d.text || "").startsWith("!")) return;
  const modo = (d.badges || []).some((b) => ["moderator", "broadcaster"].includes(b.type));
  const div = document.createElement("div");
  div.className = "m" + (modo ? " modo" : "");
  div.dataset.msg = d.msgId || "";
  div.dataset.user = d.userId || "";
  div.innerHTML = `<span class="n">${esc(d.displayName || d.nick)}</span>${texteAvecEmotes(d.text || "", d.emotes)}`;
  box.appendChild(div);
  while (box.children.length > Number(reglages.max || 12)) box.firstChild.remove();
  const duree = Number(reglages.duree || 0);
  if (duree > 0) setTimeout(() => { div.classList.add("sort"); setTimeout(() => div.remove(), 400); }, duree * 1000);
});
