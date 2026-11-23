/* =========================================================
   TOPSIDE — connexion anonyme au tchat Twitch (lecture seule)
   Aucun mot de passe : on lit le tchat public de la chaîne,
   comme un spectateur non connecté. On y reçoit les messages,
   les subs, réabonnements, subs offerts, bits et raids.
   (Les follows ne passent pas par le tchat.)
   ========================================================= */
window.TwitchTchat = function (chaine, rappels) {
  chaine = String(chaine || "").trim().toLowerCase().replace(/^#/, "").replace(/^https?:\/\/(www\.)?twitch\.tv\//, "").split(/[/?]/)[0];
  if (!chaine) return;
  const echappeTag = (v) => String(v || "").replace(/\\s/g, " ").replace(/\\:/g, ";").replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\\\/g, "\\");

  function analyser(ligne) {
    let tags = {}, reste = ligne;
    if (reste[0] === "@") {
      const i = reste.indexOf(" ");
      reste.slice(1, i).split(";").forEach((p) => { const k = p.indexOf("="); tags[p.slice(0, k)] = echappeTag(p.slice(k + 1)); });
      reste = reste.slice(i + 1);
    }
    let prefixe = "";
    if (reste[0] === ":") { const i = reste.indexOf(" "); prefixe = reste.slice(1, i); reste = reste.slice(i + 1); }
    const i2 = reste.indexOf(" :");
    const texte = i2 >= 0 ? reste.slice(i2 + 2) : "";
    const parts = (i2 >= 0 ? reste.slice(0, i2) : reste).split(" ");
    return { tags, prefixe, commande: parts[0], params: parts.slice(1), texte };
  }

  // "25:0-4,12-16/1902:6-10" → [{id, start, end}]
  function emotes(tag) {
    const r = [];
    String(tag || "").split("/").forEach((g) => {
      const [id, pos] = g.split(":");
      if (!id || !pos) return;
      pos.split(",").forEach((p) => { const [a, b] = p.split("-").map(Number); r.push({ id, start: a, end: b }); });
    });
    return r.sort((x, y) => x.start - y.start);
  }

  let ws, essais = 0;
  function connecter() {
    ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    ws.onopen = () => {
      essais = 0;
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send("PASS SCHMOOPIIE");
      ws.send("NICK justinfan" + Math.floor(10000 + Math.random() * 80000));
      ws.send("JOIN #" + chaine);
    };
    ws.onmessage = (e) => String(e.data).split("\r\n").filter(Boolean).forEach((l) => {
      if (l.startsWith("PING")) { ws.send("PONG :tmi.twitch.tv"); return; }
      const m = analyser(l), t = m.tags;
      const nom = t["display-name"] || (m.prefixe.split("!")[0]);
      if (m.commande === "PRIVMSG") {
        const msg = { id: t.id, userId: t["user-id"], nom, texte: m.texte, emotes: emotes(t.emotes), modo: t.mod === "1" || /broadcaster/.test(t.badges || "") };
        // action « /me »
        if (msg.texte.startsWith("\u0001ACTION ")) msg.texte = msg.texte.slice(8, -1);
        rappels.message && rappels.message(msg);
        if (t.bits) rappels.evenement && rappels.evenement({ type: "bits", nom, montant: Number(t.bits), message: m.texte.replace(/\b[a-zA-Z]+\d+\b/g, "").trim() });
      } else if (m.commande === "USERNOTICE") {
        const id = t["msg-id"], p = (k) => t["msg-param-" + k];
        let ev = null;
        if (id === "sub" || id === "resub") ev = { type: id === "sub" ? "sub" : "resub", nom, mois: Number(p("cumulative-months") || 1), prime: p("sub-plan") === "Prime", message: m.texte };
        else if (id === "subgift" && !t["msg-param-community-gift-id"]) ev = { type: "subgift", nom: p("recipient-display-name"), de: nom };
        else if (id === "submysterygift") ev = { type: "subgifts", nom, nombre: Number(p("mass-gift-count") || 1) };
        else if (id === "raid") ev = { type: "raid", nom: p("displayName") || nom, nombre: Number(p("viewerCount") || 0) };
        if (ev) rappels.evenement && rappels.evenement(ev);
      } else if (m.commande === "CLEARMSG") {
        rappels.supprime && rappels.supprime({ msgId: t["target-msg-id"] });
      } else if (m.commande === "CLEARCHAT") {
        rappels.supprime && rappels.supprime({ userId: t["target-user-id"], tout: !t["target-user-id"] });
      }
    });
    ws.onclose = () => { essais++; setTimeout(connecter, Math.min(30000, 1000 * 2 ** essais)); };
  }
  connecter();
};
