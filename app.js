(() => {
  "use strict";
  const C = window.CONFIG;
  const $app = document.getElementById("app");
  $app.innerHTML = '<div id="screen"></div><div id="overlay"></div>';
  const $screen = document.getElementById("screen");
  const $overlay = document.getElementById("overlay");

  // ───────── utilitaires ─────────
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const hm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const M = (f) => `media/${f}`;
  const store = {
    get(k, d) { try { const v = localStorage.getItem("sousou:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("sousou:" + k, JSON.stringify(v)); } catch {} },
  };
  const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const J = dayStart(C.startDate ? new Date(C.startDate + "T12:00:00") : new Date());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const opensAt = C.finaleOpensAt ? new Date(C.finaleOpensAt) : null;
  const fmtLong = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} à ${hm(d)}`;
  const codeFmt = (s) => s.replace(/(\d{2})(?=\d)/g, "$1 ");

  // ───────── icônes ─────────
  const svg = {
    chev: '<svg width="8" height="14" viewBox="0 0 8 14"><path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    back: '<svg width="13" height="22" viewBox="0 0 13 22"><path d="M11 2L2 11l9 9" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg width="16" height="20" viewBox="0 0 16 20" fill="#fff"><rect x="1" y="8" width="14" height="11" rx="2.5"/><path d="M4 8V5.5a4 4 0 018 0V8" stroke="#fff" stroke-width="2" fill="none"/></svg>',
    signal: '<svg width="18" height="12" viewBox="0 0 18 12" fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>',
    phone: (c = "#fff", s = 30) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}"><path d="M6.6 10.8a15.2 15.2 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>`,
    video: (c = "#fff", s = 30) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}"><rect x="2" y="6" width="14" height="12" rx="3"/><path d="M17 10.5l5-3v9l-5-3z"/></svg>`,
    bubble: (c = "#fff", s = 32) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.5 1.4 4.7 3.6 6.2-.2 1.3-.8 2.6-1.8 3.6 2 0 3.8-.8 5-1.9 1 .2 2.1.4 3.2.4 5.5 0 10-3.6 10-8.2S17.5 3 12 3z"/></svg>`,
    play: (c = "#fff", s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}"><path d="M7 4.5v15a1 1 0 001.5.9l12-7.5a1 1 0 000-1.8l-12-7.5A1 1 0 007 4.5z"/></svg>`,
    pause: (c = "#fff", s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    person: (c = "#fff", s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}"><circle cx="12" cy="8" r="4.2"/><path d="M3.5 21c.8-4.5 4.2-7 8.5-7s7.7 2.5 8.5 7z"/></svg>`,
    del: '<svg width="30" height="22" viewBox="0 0 30 22"><path d="M9 1h18a2 2 0 012 2v16a2 2 0 01-2 2H9L1 11z" fill="#fff"/><path d="M14 6.5l9 9m0-9l-9 9" stroke="#000" stroke-width="2.2" stroke-linecap="round"/></svg>',
    star: (c = "#fff") => `<svg width="22" height="22" viewBox="0 0 24 24" fill="${c}"><path d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z"/></svg>`,
    clock: (c = "#fff") => `<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="${c}"/><path d="M12 6v6l4 2" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    dots: (c = "#fff") => `<svg width="22" height="22" viewBox="0 0 24 24" fill="${c}">${[5, 12, 19].map((x) => [5, 12, 19].map((y) => `<circle cx="${x}" cy="${y}" r="2.3"/>`).join("")).join("")}</svg>`,
    vm: (c = "#fff") => `<svg width="26" height="22" viewBox="0 0 26 14"><circle cx="6" cy="7" r="4.5" stroke="${c}" stroke-width="2" fill="none"/><circle cx="20" cy="7" r="4.5" stroke="${c}" stroke-width="2" fill="none"/><path d="M6 11.5h14" stroke="${c}" stroke-width="2"/></svg>`,
    mail: (c) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="${c}"><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M3 6.5l9 6.5 9-6.5" stroke="#1c1c1e" stroke-width="1.6" fill="none"/></svg>`,
    folder: '<svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor"><path d="M0 2a1.5 1.5 0 011.5-1.5h3l1.5 1.5h5.5A1.5 1.5 0 0113 3.5v6A1.5 1.5 0 0111.5 11h-10A1.5 1.5 0 010 9.5z"/></svg>',
    check: '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.5l2.7 2.5L10 3" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    flip: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><path d="M9.5 13.5a2.5 2.5 0 014.5-1.5M14.5 13.5a2.5 2.5 0 01-4.5 1.5"/></svg>',
  };
  const ICONS = {
    gallery: () => `<svg width="46" height="46" viewBox="-23 -23 46 46">${["#ff9500", "#ffcc00", "#34c759", "#5ac8fa", "#007aff", "#af52de", "#ff2d55", "#ff3b30"].map((c, i) => `<ellipse rx="6.3" ry="11" cy="-10" fill="${c}" opacity=".88" transform="rotate(${i * 45})" style="mix-blend-mode:multiply"/>`).join("")}</svg>`,
    notes: () => '<i style="top:31px"></i><i style="top:39px"></i><i style="top:47px"></i>',
    facetime: () => svg.video("#fff", 34),
    calendar: () => { const d = new Date(); return `<small>${DAYS[d.getDay()].slice(0, 3).toUpperCase()}.</small><b>${d.getDate()}</b>`; },
    camera: () => '<svg width="44" height="34" viewBox="0 0 44 34"><rect x="1" y="5" width="42" height="28" rx="6" fill="#3a3a3c"/><rect x="14" y="1" width="16" height="6" rx="2" fill="#3a3a3c"/><circle cx="22" cy="19" r="10" fill="#1c1c1e" stroke="#8e8e93" stroke-width="2"/><circle cx="22" cy="19" r="5" fill="#2b3a67"/><circle cx="19.5" cy="16.5" r="1.6" fill="#fff" opacity=".7"/></svg>',
    contacts: () => svg.person("#8e8e93", 40),
    weather: () => '<svg width="44" height="40" viewBox="0 0 44 40"><circle cx="17" cy="14" r="9" fill="#ffd60a"/><path d="M14 36h20a8 8 0 000-16 11 11 0 00-20 3 6.5 6.5 0 000 13z" fill="#fff"/></svg>',
    spotify: () => '<svg width="44" height="44" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#1ed760"/><path d="M6 9c4-1.3 8.5-1 12 1M6.8 12.3c3.3-1 6.8-.7 9.8.9M7.6 15.3c2.6-.7 5.2-.5 7.6.7" stroke="#000" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>',
    soutube: () => '<svg width="44" height="32" viewBox="0 0 44 32"><rect width="44" height="32" rx="9" fill="#ff0033"/><path d="M17 9v14l12-7z" fill="#fff"/></svg>',
    whatsapp: () => '<svg width="38" height="38" viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1012 2z" fill="none" stroke="#fff" stroke-width="2"/><path d="M8.6 7.5c.3-.6.6-.6.9-.6h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.5.7c-.1.2-.2.3 0 .6.5.9 1.8 2.3 3.4 2.9.3.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.4.4 0 .6-.3 1.7-1.6 2-1.2.3-2.6.1-5-1.4-2.6-1.7-3.7-4-3.9-4.6-.3-.9-.1-1.9.6-2.8z" fill="#fff"/></svg>',
    phone: () => svg.phone("#fff", 36),
    messages: () => svg.bubble("#fff", 38),
  };
  const icon = (id, size) => `<span class="ic ic-${id}"${size ? ` style="width:${size}px;height:${size}px"` : ""}>${ICONS[id]()}</span>`;

  // ───────── données ─────────
  const GALLERY = [
    { src: "v7.mp4", th: "v7.jpg", v: true, d: "Récents" },
    { src: "p-voiture.jpg", th: "p-voiture.jpg", d: "Récents" },
    { src: "v1.mp4", th: "v1.jpg", v: true, d: "Récents" },
    { src: "p-kais.jpg", th: "p-kais.jpg", d: "plage-1 kais-0" },
    { src: "v2.mp4", th: "v2.jpg", v: true, d: "Récents" },
    { src: "p-equipe.jpg", th: "p-equipe.jpg", d: "Récents" },
    { src: "v3.mp4", th: "v3.jpg", v: true, d: "Récents" },
    { src: "p-cj.jpg", th: "p-cj.jpg", d: "Grove Street" },
    { src: "v4.mp4", th: "v4.jpg", v: true, d: "Récents" },
    { src: "p-costard.jpg", th: "p-costard.jpg", d: "moi au mariage de Gros loup (un jour)" },
    { src: "v5.mp4", th: "v5.jpg", v: true, d: "Récents" },
    { src: "v6.mp4", th: "v6.jpg", v: true, d: "Récents" },
    { src: "p-maman.jpg", th: "p-maman.jpg", d: "maman 🤍" },
    { src: "p-bebe.jpg", th: "p-bebe.jpg", d: "3 décembre 2019" },
    { src: "wallpaper.jpg", th: "wallpaper.jpg", d: "Fond d'écran" },
  ];
  // Album « Masqués » : déverrouillé avec le code du téléphone
  const HIDDEN = [
    { src: "p-profil.jpg", th: "p-profil.jpg", d: "🙈 le mot de passe ? Shams le connaît. Il le donne pas à n'importe qui." },
    ...(C.hiddenVideos || []).map((v) => ({ src: v, th: v.replace(/\.\w+$/, ".jpg"), v: true, d: "🙈 à ne montrer à personne" })),
  ];
  const album = () => (S.p.album === "hidden" ? HIDDEN : GALLERY);

  const ext = [C.insta && `insta : ${C.insta}`, C.snap && `snap : ${C.snap}`, C.x && `x : ${C.x}`].filter(Boolean);
  const red = (w = 3) => `<span class="redact">${"0".repeat(w)}</span>`;

  const NOTES = [
    { t: "choses à faire avec nana 🌂", time: "23:12", prev: "goûter les nouveautés kinder", pin: true,
      body: () => `<h1>choses à faire avec nana 🌂</h1>
        ${chk(true, "goûter les nouveautés kinder")}
        ${chk(false, `lui faire goûter le ${red()} (c'est un grec, elle va voir)`, true)}
        ${chk(false, "regarder NANA ensemble jusqu'au dernier épisode")}
        ${chk(false, "lui jouer le morceau")}
        ${chk(false, "arrêter de perdre mon téléphone")}` },
    { t: "brouillon", time: "02:41", prev: "Dis, Nana…",
      body: () => `<h1>brouillon</h1>Dis, Nana…\n\n<span class="muted">(la suite je l'écris pas ici. elle est dans le piano.)</span>` },
    { t: "code ??", time: "01:58", prev: "6 chiffres.",
      body: () => `<h1>code ??</h1>6 chiffres.\n\nje l'ai mis dans une <b>note verrouillée</b> 🔒, comme ça personne tombe dessus.\n\nle mot de passe ? commence par les photos que personne doit voir 🙈\n(le code de cet album est noté quelque part dans mon <b>Calendrier</b>)` },
    { t: "piano", time: "hier", prev: "do ré mi fa sol la si",
      body: () => `<h1>piano</h1>do ré mi fa sol la si\nA B C D E F G…\n\nn = sol, a = la\n<b>nana = sol la sol la</b>\n\ns = mi, o = la, u = sol\n<b>sousou = mi la sol mi la sol</b>\n\n(personne va capter)` },
    { t: "phrases à arrêter de dire", time: "lundi", prev: "« j'arrive dans 5 min »",
      body: () => `<h1>phrases à arrêter de dire</h1>« j'arrive dans 5 min » (j'arrive dans 25)\n« c'est la dernière partie »\n« t'inquiète »\n« je dors pas, je repose mes yeux »` },
    { t: "courses", time: "samedi", prev: "kinder (les nouveaux)",
      body: () => `<h1>courses</h1>${chk(true, "kinder (les nouveaux)")}${chk(false, "pain (sinon la madré me tue)")}${chk(false, "rendre son chargeur à sista")}${chk(false, "croquettes")}` },
    // dossier verrouillé
    { t: "le numéro 🌂", time: "03:07", prev: "Verrouillée", folder: "locked",
      body: () => `<h1>le numéro 🌂</h1>6 chiffres, dans cet ordre :\n\n<b>1.</b> ce que je devais te faire goûter <span class="muted">(3 chiffres, la preuve est dans mes Messages)</span>\n<b>2.</b> la porte derrière laquelle vivent les deux Nana <span class="muted">(3 chiffres, gratte ta fiche dans mes Contacts)</span>\n\n→ <b>Téléphone</b>, clavier.\n\n<span class="muted">attention : mes potes t'ont menti. tous. enfin presque.</span>${opensAt ? `\n\n<span class="muted">et ça sonnera pas avant ${fmtLong(opensAt)}.</span>` : ""}` },
    // supprimés récemment (fausses pistes)
    { t: "VRAI CODE (à supprimer)", time: "il y a 2 j", prev: "424 242", folder: "deleted",
      body: () => `<h1>VRAI CODE</h1><b style="font-size:30px">424 242</b>\n\nà supprimer avant qu'elle tombe dessus !!` },
    { t: "mdp notes", time: "il y a 3 j", prev: "kinder 🍫", folder: "deleted",
      body: () => `<h1>mdp notes</h1>mot de passe des notes verrouillées : <b>kinder</b> 🍫\n\n(ou nana ? je sais plus)` },
    { t: "ancien brouillon", time: "il y a 5 j", prev: "Dis, Nana… non.", folder: "deleted",
      body: () => `<h1>ancien brouillon</h1>Dis, Nana… non c'est nul.\nrecommence.\n\nDis, Nana… toujours nul.\n\n<span class="muted">(le vrai est dans le piano)</span>` },
  ];
  function chk(done, txt, html) { return `<div class="check${done ? " done" : ""}"><i>${done ? svg.check : ""}</i><span>${html ? txt : esc(txt)}</span></div>`; }

  const CONTACTS = [
    { n: "129 🥙", tone: "t5", phone: "03 25 •• •• ••", note: "le meilleur grec de Troyes.\n(pas encore testé avec elle)" },
    { n: "Amaruuu", tone: "t2", phone: "06 •• •• •• 41", note: "ment tout le temps" },
    { n: "Amine", tone: "t3", phone: "06 •• •• •• 07", note: "le complice" },
    { n: "CJ", img: "p-cj.jpg", phone: "Grove Street", note: "ah shit, here we go again" },
    { n: "Dadoum", tone: "t4", phone: "07 •• •• •• 18" },
    { n: "Gros loup", img: "p-costard.jpg", phone: "06 •• •• •• 66", note: "toujours bien sapé" },
    { n: "La madré", tone: "t6", phone: "06 •• •• •• 01", note: "appeler dimanche ❤️" },
    { n: "Madré 2", tone: "t6", phone: "06 •• •• •• 02" },
    { n: "Mimine", tone: "t1", phone: "07 •• •• •• 33" },
    { n: "Momo", tone: "t2", phone: "06 •• •• •• 54" },
    { n: "Nana 🌂", tone: "t5", fav: true, phone: "06 •• •• •• ••", note: "elle porte le prénom d'une héroïne.\nl'autre Nana habite avec elle, derrière la porte n° ███.\n(regarde l'anime 😉)" },
    { n: "numéro secret 🤫", tone: "mono", phone: "70 71 29", note: "le numéro de l'appel. promis.\n(appeler à minuit)" },
    { n: "Sasa", tone: "t3", phone: "07 •• •• •• 90" },
    { n: "Shams", tone: "t4", phone: "06 •• •• •• 12", note: "expert en anime. le seul qui dit la vérité." },
    { n: "Sista", tone: "t1", phone: "06 •• •• •• 77", note: "lui rendre son chargeur" },
    { n: "Soso", tone: "t2", phone: "07 •• •• •• 25" },
    { n: "Taytay", tone: "t6", phone: "06 •• •• •• 38" },
    { n: "Wiwi", tone: "t3", phone: "07 •• •• •• 49" },
  ];
  const contact = (n) => CONTACTS.find((c) => c.n === n) || { n, tone: "mono" };
  const initials = (n) => { const w = n.replace(/[^\p{L}\p{N} ]/gu, "").trim().split(/\s+/); return ((w[0] || "?")[0] + (w[1] ? w[1][0] : "")).toUpperCase(); };
  const av = (n, size, cls = "") => {
    const c = typeof n === "string" ? contact(n) : n;
    if (c.img) return `<span class="av ${cls}" style="width:${size}px;height:${size}px;background-image:url('${M("thumb/" + c.img)}')"></span>`;
    if (c.n === "Nana 🌂") return `<span class="av ${c.tone} ${cls}" style="width:${size}px;height:${size}px;font-size:${size * 0.48}px">🌂</span>`;
    if (c.n === "numéro secret 🤫") return `<span class="av mono ${cls}" style="width:${size}px;height:${size}px;font-size:${size * 0.45}px">🤫</span>`;
    return `<span class="av ${c.tone || "mono"} ${cls}" style="width:${size}px;height:${size}px;font-size:${size * 0.38}px">${initials(c.n)}</span>`;
  };

  // Faux numéros → faux appels (les fausses pistes)
  const FAKE_CALLS = {
    "666666": { n: "CJ", line: "Ah shit, here we go again…\nT'as écouté Amaruuu 😭" },
    "424242": { n: "Gros loup", line: "J'ai menti. Désolé pas désolé 🕴️" },
    "707129": { n: "numéro secret 🤫", line: "Raté. Ce contact ment, comme les potes de sousou." },
    "129129": { n: "129 🥙", line: "Allô le 129 bonjour ? Pour commander, tapez 1…\n(t'as faim ou quoi 🥙)" },
    "707707": { n: "Shams", line: "La porte deux fois ? 😭\nRelis la note." },
    "0312": { me: 1, line: "Ça, c'est le code de mon téléphone. Pas le numéro 😏" },
    "031219": { me: 1, line: "Ça, c'est le code de mon téléphone. Pas le numéro 😏" },
  };
  // Faux mots de passe pour la note verrouillée
  const PW_TROLL = {
    kinder: "Mdr non. Trop facile 🍫",
    nana: "Dadoum t'a menti 😭",
    rrsdy2: "Ça c'est un identifiant, pas un mot de passe 😏",
    sousou: "Mon prénom ? Sérieux ? 😭",
    soso: "Mon prénom ? Sérieux ? 😭",
    "129": "Un mot. Pas des chiffres.",
    "707": "Un mot. Pas des chiffres.",
    "0312": "Ça c'est le code du téléphone. Ici c'est un mot.",
  };

  const WA_COLORS = { "Amine": "#53bdeb", "Momo": "#ff7aa2", "Gros loup": "#f7b955", "Amaruuu": "#a685ff", "Dadoum": "#4fd1a5", "Shams": "#ff8a65", "Taytay": "#e872d6", "Wiwi": "#9ad35a", "Mimine": "#6ec6ff" };
  const GROUP = "projet nana 🌂";
  const WA = [
    { id: "grp", name: GROUP, group: true, time: "22:53", unread: 1, pin: true,
      sub: "Amine, Momo, Gros loup, Amaruuu, Dadoum, Shams, Taytay, Wiwi, Vous",
      msgs: [
        { sys: "Vous avez créé le groupe « " + GROUP + " »" },
        { f: "Amine", t: "frérot t'es sûr de ton plan ?", tm: "21:02" },
        { me: 1, t: "t'inquiète. elle va galérer. genre vraiment.", tm: "21:03" },
        { f: "Momo", t: "il a fait un FAUX téléphone 😭😭😭", tm: "21:04" },
        { f: "Amaruuu", t: "elle trouvera jamais le numéro", tm: "21:10" },
        { f: "Amaruuu", t: "allez je l'aide : 66 66 66 🤫", tm: "21:10" },
        { f: "Gros loup", t: "arrête de l'embrouiller 😭", tm: "21:11" },
        { f: "Gros loup", t: "le vrai il l'a mis dans ses notes supprimées, je l'ai vu de mes yeux", tm: "21:11" },
        { f: "Dadoum", t: "et le mot de passe de la note c'est « nana », trop facile", tm: "21:12" },
        { me: 1, t: "🤐", tm: "21:12" },
        { f: "Shams", t: "vous racontez que des dingueries", tm: "21:20" },
        { f: "Shams", t: "moi je dis rien ici. si elle veut la vérité, qu'elle vienne en privé 🤫", tm: "21:20" },
        { f: "Taytay", t: "et si elle trouve pas ?", tm: "21:30" },
        { me: 1, t: "elle trouvera. c'est nana.", tm: "21:31" },
        ...(ext.length ? [{ me: 1, t: "et si elle bloque, le reste est dehors 👀\n" + ext.join("\n"), tm: "21:40" }] : []),
        { f: "Amine", vid: "v2.mp4", t: "on a gagné au fait 🏆", tm: "22:40" },
        { f: "Wiwi", t: "vous en dites quoi ?", tm: "22:53" },
      ] },
    { id: "nathan", name: "Gros loup", time: "20:14", unread: 1, msgs: [
        { f: "Gros loup", vid: "v1.mp4", t: "le barbecue est prêt, t'es où", tm: "20:12" },
        { f: "Gros loup", t: "t'as encore perdu ton tel ou quoi", tm: "20:14" } ] },
    { id: "amaruuu", name: "Amaruuu", time: "19:02", msgs: [
        { f: "Amaruuu", t: "frr c'est quoi le mdp de ta note", tm: "18:58" },
        { me: 1, t: "kinder", tm: "19:01" },
        { f: "Amaruuu", t: "ça marche pas 😭", tm: "19:02" },
        { me: 1, t: "normal 😏", tm: "19:02" } ] },
    { id: "momo", name: "Momo", time: "18:40", msgs: [
        { f: "Momo", vid: "v4.mp4", t: "l'ascenseur c'est notre studio", tm: "18:39" },
        { me: 1, t: "💀💀", tm: "18:40" } ] },
    { id: "dadoum", name: "Dadoum", time: "17:05", msgs: [
        { f: "Dadoum", vid: "v3.mp4", tm: "17:04" },
        { me: 1, t: "pourquoi tu manges une banane comme ça", tm: "17:05" } ] },
    { id: "taytay", name: "Taytay", time: "hier", msgs: [
        { f: "Taytay", vid: "v5.mp4", t: "le petit a plus de flow que toi", tm: "19:22" },
        { me: 1, t: "c'est vrai en plus", tm: "19:30" } ] },
    { id: "wiwi", name: "Wiwi", time: "hier", msgs: [
        { f: "Wiwi", vid: "v6.mp4", tm: "23:01" },
        { me: 1, t: "frère il est 23h", tm: "23:02" } ] },
    { id: "shams", name: "Shams", time: "22:58", unread: 1, quiz: true, msgs: [
        { f: "Shams", vid: "v7.mp4", tm: "02:13" },
        { f: "Shams", t: "tu dors ?", tm: "02:13" },
        { me: 1, t: "non je regarde nana", tm: "02:20" },
        { f: "Shams", t: "l'anime ou la fille 😭", tm: "02:20" },
        { f: "Shams", t: "si elle connaît pas le numéro de l'appart des deux Nana, c'est qu'elle a jamais regardé 😤", tm: "02:22" },
        { sys: "Aujourd'hui" },
        { f: "Shams", t: "nana c'est toi ? 👀", tm: "22:57" },
        { f: "Shams", t: "si c'est vraiment toi, dis-moi comment s'appelle ton chat. après je te dis le mot de passe 😼", tm: "22:58" } ] },
  ];

  const secretLines = () => [
    "Si tu lis ça, c'est que t'as trouvé mon téléphone.",
    "Il y a un appel qui t'attend. Mais le numéro, je l'ai caché.",
    "Fouille. Et méfie-toi de mes potes : la moitié ment.",
    "Commence par mes Notes 📝",
    ...(opensAt ? [`De toute façon ça ne sonnera pas avant ${fmtLong(opensAt)}.`] : []),
    "🌂",
  ];
  const IM = [
    { id: "secret", name: "sousou (2)", hidden: true, time: "", unread: true, msgs: () => secretLines().map((t) => ({ t })) },
    { id: "madre", name: "La madré", time: "19:48", unread: true, prev: "prends du pain", msgs: () => [{ t: "tu rentres à quelle heure ?" }, { me: 1, t: "tard" }, { t: "prends du pain" }] },
    { id: "sista", name: "Sista", time: "16:20", prev: "rends moi mon chargeur", msgs: () => [{ t: "rends moi mon chargeur" }, { t: "rends moi mon chargeur" }, { t: "RENDS MOI MON CHARGEUR" }, { me: 1, t: "quel chargeur" }] },
    { id: "mimine", name: "Mimine", time: "hier", prev: "chut", msgs: () => [{ t: "alors avec nana ?? 👀" }, { me: 1, t: "chut" }] },
    { id: "129", name: "129 🥙", time: "samedi", prev: "Votre commande est prête !", msgs: () => [{ t: "Bienvenue au 129 🥙 Merci pour votre commande !" }, { t: "Votre commande est prête ! À très vite au 129." }, { me: 1, t: "la prochaine fois je viens avec quelqu'un 🌂" }] },
  ];

  const FACETIME = [
    { n: "Nana 🌂", role: "favori", star: true },
    { n: "Amine", role: "le complice" },
    { n: "Gros loup", role: "garde du corps" },
    { n: "CJ", role: "consultant" },
    { n: "Shams", role: "expert en anime" },
    { n: "La madré", role: "la boss" },
    { n: "Momo", role: "témoin" },
    { n: "Mimine", role: "renseignements" },
  ];

  const TRACKS = [
    { t: "solo pour nana", a: "sousou", solo: true },
    { t: "Rose", a: "ANNA inspi' NANA (BLACK STONES)" },
    { t: "A Little Pain", a: "OLIVIA inspi' REIRA (TRAPNEST)" },
    { t: "Wish", a: "OLIVIA inspi' REIRA (TRAPNEST)" },
    { t: "Lucy", a: "ANNA inspi' NANA (BLACK STONES)" },
    { t: "Starless Night", a: "OLIVIA inspi' REIRA (TRAPNEST)" },
    { t: "Kuroi Namida", a: "ANNA TSUCHIYA" },
    { t: "Winter Sleep", a: "OLIVIA inspi' REIRA (TRAPNEST)" },
  ];
  const TRACK_BG = ["", "linear-gradient(135deg,#1a1a1a,#8b0d1f)", "linear-gradient(135deg,#f5f0e6,#c9b38a)", "linear-gradient(135deg,#2a2a3a,#c7c2d6)", "linear-gradient(135deg,#120c0c,#5a1a2a)", "linear-gradient(135deg,#0c1a33,#5d79b8)", "linear-gradient(135deg,#000,#444)", "linear-gradient(135deg,#dfe8f5,#7a92b8)"];

  function calEvents() {
    const ev = [
      { d: J, tm: "18:00", t: "📱 téléphone perdu", hot: true },
      { d: J, tm: "toute la journée", t: "🌂 elle le trouve ?" },
      { d: addDays(J, 1), tm: "20:00", t: "🥙 129 avec nana", hot: true },
      { d: addDays(J, 3), tm: "21:00", t: "📺 NANA ép. 1 → 47" },
      { d: addDays(J, -2), tm: "16:00", t: "🍫 kinder (fait ✔︎)" },
    ];
    const base = new Date(Math.min(+J, +dayStart(new Date())));
    ev.push({ d: new Date(base.getFullYear(), base.getMonth(), 7), tm: "07:07", t: "🙈 Masqués", n: "le code de l'album, c'est l'heure de cet événement." });
    ev.push({ d: new Date(base.getFullYear(), base.getMonth(), 21), tm: "12:00", t: "🔢 code : 4321", n: "(je note jamais mes vrais codes ici, t'es folle ?)" });
    if (C.insta) ev.push({ d: J, tm: "22:00", t: "📸 story insta" });
    if (C.snap) ev.push({ d: addDays(J, 1), tm: "09:00", t: "👻 snap" });
    if (opensAt) ev.push({ d: dayStart(opensAt), tm: hm(opensAt), t: "📞 l'appel", hot: true });
    return ev;
  }

  // ───────── état ─────────
  const S = {
    view: "lock", p: {},
    unlocked: false,
    waAdded: false,
    secret: store.get("secret", false),
    readWa: new Set(), readIm: new Set(),
    done: store.get("done", false),
    dial: "",
    phoneTab: "keypad",
    fails: 0,
    calSheet: null,
  };
  let cleanup = [];
  function go(view, p = {}, anim = true) {
    cleanup.forEach((f) => f()); cleanup = [];
    S.view = view; S.p = p;
    render(anim);
  }

  // ───────── rendu ─────────
  const statusBar = () => `<div class="sb"><span data-clock>${hm()}</span><span class="sb-r">${svg.signal}<span>5G</span><span class="batt"><b><i></i><span>20</span></b></span></span></div>`;
  const homeBar = () => '<div class="homebar"></div><button class="homebar-hit" data-a="home" aria-label="Accueil"></button>';
  const backBtn = (label, a = "home", extra = "") => `<button class="back" data-a="${a}" ${extra}>${svg.back}<span>${esc(label)}</span></button>`;

  const V = {};

  V.lock = () => {
    const d = new Date();
    return `<div class="lock" id="lock" style="background-image:url('${M("wallpaper.jpg")}')">
      <div class="lock-top">${svg.lock}<div class="lock-date">${cap(DAYS[d.getDay()])} ${d.getDate()} ${MONTHS[d.getMonth()]}</div>
      <div class="lock-time" data-clock>${hm(d)}</div><div class="lock-cap">tu as trouvé le téléphone de ${esc(C.owner)}…</div></div>
      <div class="lock-notifs">
        <div class="lnotif">${icon("gallery", 34)}<span class="grow"><span class="top"><b>Souvenirs</b><span>9:41</span></span><p>Il y a quelques années… 3 décembre 🍼</p></span><span class="lthumb" style="background-image:url('${M("thumb/p-bebe.jpg")}')"></span></div>
        <div class="lnotif">${icon("messages", 34)}<span class="grow"><span class="top"><b>La madré</b><span>19:48</span></span><p>prends du pain</p></span></div>
      </div>
      <button class="lock-hint" data-a="unlock">Balayez vers le haut pour ouvrir</button>${homeBar().replace('data-a="home"', 'data-a="unlock"')}</div>`;
  };

  V.home = () => {
    const apps = [["gallery", "Galerie"], ["notes", "Notes"], ["facetime", "FaceTime"], ["calendar", "Calendrier"], ["camera", "Appareil photo"], ["contacts", "Contacts"], ["weather", "Météo"], ["spotify", "Spotify"], ["soutube", "SouTube"]];
    const waN = (S.waAdded ? 1 : 0) + WA.filter((c) => c.unread && !S.readWa.has(c.id)).length;
    const imN = IM.filter((c) => c.unread && !S.readIm.has(c.id) && (!c.hidden || S.secret)).length;
    const dock = [["whatsapp", "WhatsApp", waN], ["phone", "Téléphone", S.done ? 0 : 1], ["messages", "Messages", imN]];
    const b = (n) => (n ? `<span class="badge">${n}</span>` : "");
    return `<div class="scr home" style="background-image:url('${M("wallpaper.jpg")}')">${statusBar()}
      <div class="grid">${apps.map(([id, l]) => `<button class="app-ic" data-a="open" data-v="${id}">${icon(id)}<span>${l}</span></button>`).join("")}</div>
      <div class="dock">${dock.map(([id, l, n]) => `<button class="app-ic" data-a="open" data-v="${id}" aria-label="${l}"><span class="ic ic-${id}">${ICONS[id]()}${b(n)}</span><span>${l}</span></button>`).join("")}</div>
      ${homeBar()}</div>`;
  };

  V.gallery = () => {
    const hid = S.p.album === "hidden", list = album();
    return `<div class="scr">${statusBar()}<div class="nav">${hid ? backBtn("Galerie", "open", 'data-v="gallery"') : backBtn("Accueil")}<span></span></div>
    <div class="scroll"><div class="big-title">${hid ? "Masqués" : "Galerie"}</div><div class="sub">${list.length} éléments</div>
    <div class="ph-grid">${list.map((g, i) => `<button class="ph-cell" data-a="photo" data-i="${i}" data-album="${hid ? "hidden" : ""}" style="background-image:url('${M("thumb/" + g.th)}')" aria-label="${g.v ? "Vidéo" : "Photo"} ${i + 1}">${g.v ? `<span class="vb">${svg.play("#fff", 12)}</span>` : ""}</button>`).join("")}</div>
    ${hid ? "" : `<div class="sec">Utilitaires</div><div class="card"><button class="row" data-a="hiddenalbum"><span>🙈</span><span class="grow">Masqués</span><span class="muted">🔒</span><span class="chev">${svg.chev}</span></button><button class="row" data-a="toast" data-t="Supprimés récemment : vide. J'efface pas mes photos, moi."><span>🗑️</span><span class="grow">Supprimés récemment</span><span class="chev">${svg.chev}</span></button></div>`}
    <div class="pad-bottom"></div></div>${homeBar()}</div>`;
  };

  V.photo = () => {
    const list = album(), i = S.p.i, g = list[i], al = S.p.album || "";
    const media = g.v ? `<video src="${M(g.src)}" controls playsinline autoplay loop></video>` : `<img src="${M(g.src)}" alt="">`;
    return `<div class="scr viewer">${statusBar()}<div class="nav">${backBtn(al ? "Masqués" : "Galerie", "open", `data-v="gallery" data-album="${al}"`)}<div class="viewer-h"><b>${esc(g.d)}</b><small>${i + 1} sur ${list.length}</small></div><span style="width:70px"></span></div>
      <div class="media">${media}
      ${i > 0 ? `<button class="photo-nav prev" data-a="photo" data-album="${al}" data-i="${i - 1}" aria-label="Précédent">‹</button>` : ""}
      ${i < list.length - 1 ? `<button class="photo-nav next" data-a="photo" data-album="${al}" data-i="${i + 1}" aria-label="Suivant">›</button>` : ""}</div>
      <div style="height:40px"></div>${homeBar()}</div>`;
  };

  V.notes = () => {
    const del = S.p.folder === "deleted";
    const mine = NOTES.filter((n) => !n.folder);
    if (del) {
      return `<div class="scr notes-app">${statusBar()}<div class="nav">${backBtn("Notes", "open", 'data-v="notes"')}<span></span></div>
      <div class="scroll"><div class="big-title">Supprimés récemment</div><div class="sub">Les notes sont effacées définitivement après 30 jours.</div>
      <div class="card">${NOTES.filter((n) => n.folder === "deleted").map(noteRow).join("")}</div><div class="pad-bottom"></div></div>${homeBar()}</div>`;
    }
    return `<div class="scr notes-app">${statusBar()}<div class="nav">${backBtn("Accueil")}<span></span></div>
    <div class="scroll"><div class="big-title">iCloud (toutes)</div><div class="sub">${mine.length + 1} notes</div>
    <div class="sec">Épinglées</div><div class="card">${secretRow()}${mine.filter((n) => n.pin).map(noteRow).join("")}</div>
    <div class="sec">Récentes</div><div class="card">${mine.filter((n) => !n.pin).map(noteRow).join("")}</div>
    <div class="sec">Dossiers</div><div class="card">
      <button class="row" data-a="note" data-i="${NOTES.findIndex((n) => n.folder === "locked")}"><span>🔒</span><span class="grow">Notes verrouillées</span><span class="muted">1</span><span class="chev">${svg.chev}</span></button>
      <button class="row" data-a="open" data-v="notes" data-folder="deleted"><span>🗑️</span><span class="grow">Supprimés récemment</span><span class="muted">${NOTES.filter((n) => n.folder === "deleted").length}</span><span class="chev">${svg.chev}</span></button></div>
    <div class="pad-bottom"></div></div>${homeBar()}</div>`;
  };
  function secretRow() {
    return S.done
      ? `<button class="row note-row secret-on" data-a="letter"><div class="grow"><b class="ellip">pour toi 🤍</b><small class="ellip">maintenant <em>${esc(C.letter.greeting)}</em></small><span class="folder">${svg.folder} Notes</span></div></button>`
      : `<button class="row note-row" data-a="toast" data-t="🔒 Cette note se déverrouille après un certain appel…"><div class="grow"><b class="ellip">🔒 note secrète</b><small class="ellip">Verrouillée <em>se déverrouille après un appel</em></small><span class="folder">${svg.folder} Notes</span></div></button>`;
  }
  function noteRow(n) {
    const i = NOTES.indexOf(n);
    return `<button class="row note-row" data-a="note" data-i="${i}"><div class="grow"><b class="ellip">${esc(n.t)}</b><small class="ellip">${esc(n.time)} <em>${esc(n.prev)}</em></small><span class="folder">${svg.folder} ${n.folder === "deleted" ? "Supprimés récemment" : "Notes"}</span></div></button>`;
  }
  // la note secrète : une vraie note iPhone, avec le solo en pièce jointe audio
  V.secret = () => {
    const L = C.letter, d = new Date(store.get("secretAt", Date.now()));
    const playing = spAudio && !spAudio.paused;
    const body = [`<h1>pour toi 🤍</h1>`, `<p>${esc(L.greeting)}</p>`, ...L.paragraphs.map((p) => `<p>${esc(p)}</p>`), `<p>${esc(L.signature)}</p>`].join("");
    return `<div class="scr notes-app">${statusBar()}<div class="nav">${backBtn("Notes", "open", 'data-v="notes"')}<span></span></div>
      <div class="scroll"><p class="note-date">${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} à ${hm(d)}</p>
      <div class="note-body secret-body">${body}<button class="att" data-a="secretplay"><span class="att-pp">${playing ? svg.pause("#000", 18) : svg.play("#000", 18)}</span><span class="grow"><b>solo pour nana</b><small>Enregistrement audio · 3:28</small></span><span class="att-wave">${Array.from({ length: 22 }, (_, i) => `<i style="height:${6 + Math.round(14 * Math.abs(Math.sin(i * 1.7)))}px"></i>`).join("")}</span></button>
      <p class="muted shake-tip">psst… secoue le téléphone 📳 (ou tape deux fois sur l'écran)</p>
      </div><div class="pad-bottom"></div></div>${homeBar()}</div>`;
  };
  V.note = () => {
    const n = NOTES[S.p.i];
    const back = n.folder === "deleted" ? backBtn("Supprimés", "open", 'data-v="notes" data-folder="deleted"') : backBtn("Notes", "open", 'data-v="notes"');
    return `<div class="scr notes-app">${statusBar()}<div class="nav">${back}<span></span></div>
      <div class="scroll"><p class="note-date">${esc(n.time)}</p><div class="note-body">${n.body()}</div></div>${homeBar()}</div>`;
  };

  V.facetime = () => `<div class="scr">${statusBar()}<div class="nav">${backBtn("Accueil")}<span></span></div>
    <div class="scroll"><div class="big-title">FaceTime</div><div class="ft-grid">${FACETIME.map((f) => `<button class="ft-card${f.star ? " star" : ""}" data-a="ftcall" data-n="${esc(f.n)}"><b>${esc(f.n)}</b>${av(f.n, 96)}<span class="ft-foot">${esc(f.role)}<span>${svg.video(f.star ? "#000" : "#fff", 18)}</span></span></button>`).join("")}</div></div>${homeBar()}</div>`;

  V.calendar = () => {
    const ev = calEvents();
    const today = dayStart(new Date());
    const month = (y, m) => {
      const first = new Date(y, m, 1), n = new Date(y, m + 1, 0).getDate();
      const off = (first.getDay() + 6) % 7;
      let cells = "";
      for (let k = 0; k < off; k++) cells += '<div class="cal-day"></div>';
      for (let d = 1; d <= n; d++) {
        const dt = new Date(y, m, d), wd = dt.getDay();
        const es = ev.filter((e) => +dayStart(e.d) === +dt);
        cells += `<button class="cal-day${wd === 0 || wd === 6 ? " we" : ""}${+dt === +today ? " today" : ""}" data-a="calday" data-d="${+dt}"><span class="num">${d}</span>${es.slice(0, 2).map((e) => `<span class="pill${e.hot ? " hot" : ""}">${esc(e.t.replace(/^\S+\s/, ""))}</span>`).join("")}</button>`;
      }
      return `<div class="cal-month">${cap(MONTHS[m])}${y !== today.getFullYear() ? " " + y : ""}</div><div class="cal-grid">${cells}</div>`;
    };
    const base = new Date(Math.min(+J, +today));
    const m2 = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    let sheet = "";
    if (S.calSheet) {
      const d = new Date(S.calSheet);
      const es = ev.filter((e) => +dayStart(e.d) === +d);
      sheet = `<div class="sheet-bg" data-a="calclose"><div class="sheet" data-stop><div class="grab"></div><h3>${cap(DAYS[d.getDay()])} ${d.getDate()} ${MONTHS[d.getMonth()]}</h3>
        ${es.length ? es.map((e) => `<div class="ev${e.hot ? " hot" : ""}"><i></i><div><b>${esc(e.t)}</b><small>${esc(e.tm)}</small>${e.n ? `<small style="display:block;color:var(--fg);margin-top:4px">${esc(e.n)}</small>` : ""}</div></div>`).join("") : '<div class="ev"><i style="background:var(--fg3)"></i><div><b class="muted">Aucun événement</b></div></div>'}</div></div>`;
    }
    return `<div class="scr">${statusBar()}<div class="nav">${backBtn(String(base.getFullYear()))}<span></span></div>
      <div class="cal-dow">${["L", "M", "M", "J", "V", "S", "D"].map((x) => `<span>${x}</span>`).join("")}</div>
      <div class="scroll">${month(base.getFullYear(), base.getMonth())}${month(m2.getFullYear(), m2.getMonth())}<div class="pad-bottom"></div></div>${sheet}${homeBar()}</div>`;
  };

  V.camera = () => `<div class="scr cam">${statusBar()}<div class="cam-view" id="camview" style="background-image:url('${M("wallpaper.jpg")}')">
      <div class="cam-cap" id="camcap">la plus belle chose de ce téléphone, c'est la personne qui le tient.</div></div>
      <div class="cam-modes"><span>VIDÉO</span><b>PHOTO</b><span>PORTRAIT</span></div>
      <div class="cam-bar"><button class="cam-thumb" data-a="open" data-v="gallery" style="background-image:url('${M("thumb/p-bebe.jpg")}')" aria-label="Galerie"></button><button class="shutter" data-a="shoot" aria-label="Prendre une photo"></button><span>${svg.flip}</span></div>${homeBar()}</div>`;

  V.contacts = () => {
    const groups = {};
    CONTACTS.forEach((c) => { const L = /[a-z]/i.test(c.n[0]) ? c.n[0].toUpperCase() : "#"; (groups[L] = groups[L] || []).push(c); });
    return `<div class="scr">${statusBar()}<div class="nav">${backBtn("Listes")}<span></span></div>
      <div class="scroll"><div class="big-title">Contacts</div>
      <button class="ct-me" data-a="contact" data-n="__me">${av({ n: C.owner, img: "p-bebe.jpg" }, 62)}<span><b>${esc(C.owner)}</b><span class="muted">Ma fiche</span></span></button>
      ${Object.keys(groups).sort().map((L) => `<div class="sec" style="font-size:15px;color:var(--fg2);padding:10px 16px 2px">${L}</div>${groups[L].map((c) => `<button class="ct-row" data-a="contact" data-n="${esc(c.n)}">${av(c, 40)}<span class="grow"><span>${esc(c.n)}${c.fav ? " ⭐" : ""}</span><span class="chev">${svg.chev}</span></span></button>`).join("")}`).join("")}
      <div class="pad-bottom"></div></div>${homeBar()}</div>`;
  };
  V.contact = () => {
    const me = S.p.n === "__me";
    const c = me ? { n: C.owner, img: "p-bebe.jpg", phone: "+33 6 •• •• •• ••", note: "si tu trouves ce téléphone, tu sais ce qu'il te reste à faire.\n→ Messages" } : contact(S.p.n);
    const btn = (ic, l) => `<span>${ic}${l}</span>`;
    return `<div class="scr">${statusBar()}<div class="nav">${backBtn("Contacts", "open", 'data-v="contacts"')}<span class="muted">Modifier</span></div>
      <div class="scroll"><div class="ct-detail">${av(c, 110)}<h2>${esc(c.n)}</h2></div>
      <div class="ct-btns">${btn(svg.bubble("#0a84ff", 22), "message")}${btn(svg.phone("#0a84ff", 22), "appel")}${btn(svg.video("#0a84ff", 22), "vidéo")}${btn(svg.mail("#0a84ff"), "e-mail")}</div>
      <div class="card"><div class="ct-field"><small>mobile</small><div>${esc(c.phone || "—")}</div></div>
      ${c.note ? `<div class="ct-field"><small>Notes</small><div class="plain">${esc(c.note).replace("███", '<span class="scratch" data-a="scratch"><b>707</b><i></i></span>')}</div></div>` : ""}</div>
      <div class="pad-bottom"></div></div>${homeBar()}</div>`;
  };

  // météo
  let WX = null;
  const WMO = (c) => c === 0 ? ["Dégagé", "☀️"] : c <= 2 ? ["Partiellement nuageux", "⛅️"] : c === 3 ? ["Couvert", "☁️"] : c <= 48 ? ["Brouillard", "🌫️"] : c <= 57 ? ["Bruine", "🌦️"] : c <= 67 ? ["Pluie", "🌧️"] : c <= 77 ? ["Neige", "🌨️"] : c <= 82 ? ["Averses", "🌦️"] : ["Orage", "⛈️"];
  function fallbackWx() {
    const now = new Date(), h = now.getHours();
    return { temp: 9, code: 3, hi: 11, lo: 4, night: h < 7 || h >= 18,
      hours: Array.from({ length: 10 }, (_, k) => ({ h: k ? pad((h + k) % 24) + " h" : "Maint.", c: [3, 3, 2, 61, 3, 2, 0, 2, 3, 3][k], t: 9 - Math.round(k / 3) })),
      days: Array.from({ length: 7 }, (_, k) => ({ d: k ? cap(DAYS[addDays(now, k).getDay()].slice(0, 3)) + "." : "Auj.", c: [3, 61, 2, 3, 0, 61, 2][k], lo: 3 + (k % 3), hi: 10 + (k % 4) })) };
  }
  async function loadWx() {
    try {
      const { lat, lon } = C.city;
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`);
      const j = await r.json();
      const now = new Date();
      const i0 = j.hourly.time.findIndex((t) => new Date(t) >= new Date(now.getTime() - 3600e3));
      WX = { temp: Math.round(j.current.temperature_2m), code: j.current.weather_code, night: !j.current.is_day,
        hi: Math.round(j.daily.temperature_2m_max[0]), lo: Math.round(j.daily.temperature_2m_min[0]),
        hours: j.hourly.time.slice(i0, i0 + 10).map((t, k) => ({ h: k ? pad(new Date(t).getHours()) + " h" : "Maint.", c: j.hourly.weather_code[i0 + k], t: Math.round(j.hourly.temperature_2m[i0 + k]) })),
        days: j.daily.time.map((t, k) => ({ d: k ? cap(DAYS[new Date(t + "T12:00").getDay()].slice(0, 3)) + "." : "Auj.", c: j.daily.weather_code[k], lo: Math.round(j.daily.temperature_2m_min[k]), hi: Math.round(j.daily.temperature_2m_max[k]) })) };
      if (S.view === "weather") render(false);
    } catch { /* hors ligne : on garde la météo de secours */ }
  }
  V.weather = () => {
    const w = WX || fallbackWx();
    const cls = w.night ? "night" : w.code >= 3 ? "grey" : "";
    return `<div class="scr wx ${cls}">${statusBar()}<div class="nav">${backBtn("Accueil", "home", 'style="color:#fff"')}<span></span></div>
      <div class="scroll"><div class="wx-head"><h2>${esc(C.city.name)}</h2><div class="t">${w.temp}°</div><p>${WMO(w.code)[0]}</p><p>H : ${w.hi}°  B : ${w.lo}°</p></div>
      <div class="wx-card"><div class="lbl">Prévisions horaires</div><div class="wx-hours">${w.hours.map((h) => `<div><span>${h.h}</span><span>${WMO(h.c)[1]}</span><span>${h.t}°</span></div>`).join("")}</div></div>
      <div class="wx-card"><div class="lbl">Prévisions sur 7 jours</div><div class="wx-days">${w.days.map((d) => `<div><span>${d.d}</span><span>${WMO(d.c)[1]}</span><span class="rng"><span>${d.lo}°</span><span class="bar"></span><span>${d.hi}°</span></span></div>`).join("")}</div></div>
      <div class="wx-card" style="text-align:center;font-size:15px">Il fait peut-être froid à ${esc(C.city.name)}, mais pas dans ce téléphone 🌂</div>
      <div class="pad-bottom"></div></div>${homeBar()}</div>`;
  };

  // spotify
  let spAudio = null;
  V.spotify = () => {
    const cov = ["wallpaper.jpg", "p-bebe.jpg", "p-voiture.jpg", "p-equipe.jpg"];
    const playing = spAudio && !spAudio.paused;
    return `<div class="scr sp">${statusBar()}<div class="nav">${backBtn("Accueil", "home", 'style="color:#fff"')}<span></span></div>
      <div class="scroll"><div class="sp-cover">${cov.map((c) => `<div style="background-image:url('${M("thumb/" + c)}')"></div>`).join("")}</div>
      <div class="sp-title"><span style="width:56px"></span><div class="sp-meta"><h2>pour nana 🌂</h2><b>${esc(C.owner)}</b><span class="muted">Playlist · ${TRACKS.length} titres</span></div>
      <button class="sp-play" data-a="sp" data-i="0" aria-label="Lecture">${playing ? svg.pause("#000", 24) : svg.play("#000", 24)}</button></div>
      <div style="height:14px"></div>
      ${TRACKS.map((t, i) => `<button class="sp-row${t.solo && !S.done ? " locked" : ""}${t.solo && playing ? " on" : ""}" data-a="sp" data-i="${i}"><span class="n">${i + 1}</span>
        <span class="th" style="background:${t.solo ? `center/cover url('${M("thumb/wallpaper.jpg")}')` : TRACK_BG[i]}">${t.solo && !S.done ? "🔒" : ""}</span>
        <span class="grow" style="min-width:0"><b class="ellip">${esc(t.t)}</b><small class="ellip">${esc(t.a)}</small></span></button>`).join("")}
      <div class="pad-bottom"></div></div>${homeBar()}</div>`;
  };

  V.soutube = () => `<div class="scr yt">${statusBar()}<div class="yt-top"><button data-a="home" aria-label="Accueil" style="display:flex">${ICONS.soutube().replace('width="44" height="32"', 'width="30" height="22"')}</button><span>SouTube</span></div>
    <div class="yt-chips"><span class="on">Tout</span><span>Piano</span><span>Anime</span><span>Nana</span><span>Mixes</span></div>
    <div class="scroll">
      ${C.youtubeUrl ? `<a class="yt-vid" href="${esc(C.youtubeUrl)}" target="_blank" rel="noopener">` : '<button class="yt-vid" data-a="yt">'}<div class="yt-th" style="background-image:url('${M("wallpaper.jpg")}')"><span class="dur">3:28</span>${C.youtubeUrl ? "" : '<span class="lockd">🔒 Vidéo privée<br>Elle ne se termine que si quelqu\'un compose le bon numéro.</span>'}</div>
      <div class="yt-info">${av({ n: C.owner, img: "p-bebe.jpg" }, 36)}<div><b>solo pour nana 🌂 (piano)</b><small>${esc(C.owner)} · 1 vue · non répertoriée</small></div></div>${C.youtubeUrl ? "</a>" : "</button>"}
      <button class="yt-vid" data-a="toast" data-t="Vidéo indisponible dans ton pays (le pays de sousou)"><div class="yt-th" style="background-image:url('${M("thumb/p-cj.jpg")}')"><span class="dur">0:12</span></div>
      <div class="yt-info">${av("CJ", 36)}<div><b>moi quand elle répond « mdr » à mon pavé</b><small>CJ · 2,4 k vues · il y a 3 jours</small></div></div></button>
      <div class="pad-bottom"></div></div>${homeBar()}</div>`;

  // whatsapp
  V.whatsapp = () => {
    const list = WA.map((c) => {
      const last = c.msgs[c.msgs.length - 1];
      const unread = c.unread && !S.readWa.has(c.id);
      const prev = (last.me ? "Vous : " : c.group && last.f ? last.f + " : " : "") + (last.t || "🎥 Vidéo");
      return `<button class="wa-row" data-a="wa" data-id="${c.id}">${c.group ? `<span class="av t5" style="width:52px;height:52px;font-size:24px">🌂</span>` : av(c.name, 52)}
        <span class="grow"><span class="top"><b class="ellip">${esc(c.name)}</b><time class="${unread ? "unread" : ""}">${c.time}</time></span>
        <span class="bot"><span class="ellip">${esc(prev)}</span>${unread ? `<span class="cnt">${c.unread}</span>` : c.pin ? "📌" : ""}</span></span></button>`;
    }).join("");
    return `<div class="scr wa">${statusBar()}<div class="nav">${backBtn("Accueil")}<span class="wa-blue" style="font-size:24px">+</span></div>
      <div class="scroll"><div class="big-title">Discussions</div>
      <div class="wa-chips"><span class="on">Toutes</span><span>Non lues ${WA.filter((c) => c.unread).length}</span><span>Favoris</span><span>Groupes 1</span></div>
      ${list}<div class="pad-bottom"></div></div>${homeBar()}</div>`;
  };
  V.wa = () => {
    const c = WA.find((x) => x.id === S.p.id);
    const msgs = c.msgs.map((m) => {
      if (m.sys) return `<div class="wa-sys">${esc(m.sys)}</div>`;
      const who = c.group && !m.me ? `<span class="who" style="color:${WA_COLORS[m.f] || "#53bdeb"}">${esc(m.f)}</span>` : "";
      const vid = m.vid ? `<video src="${M(m.vid)}" poster="${M("thumb/" + m.vid.replace(".mp4", ".jpg"))}" controls playsinline preload="none"></video>` : "";
      return `<div class="bub ${m.me ? "out" : "in"}">${who}${vid}${m.t ? esc(m.t).replace(/\n/g, "<br>") : ""}<span class="tm">${m.tm}${m.me ? " ✓✓" : ""}</span></div>`;
    }).join("");
    return `<div class="scr wa-thread">${statusBar()}<div class="wa-head">${backBtn("", "open", 'data-v="whatsapp"')}${c.group ? '<span class="av t5" style="width:36px;height:36px;font-size:18px">🌂</span>' : av(c.name, 36)}
      <span style="min-width:0;flex:1"><b class="ellip">${esc(c.name)}</b><small>${esc(c.group ? c.sub : "en ligne")}</small></span><span class="wa-blue">${svg.video("#25d366", 24)}</span></div>
      <div class="scroll" id="thread"><div class="wa-msgs">${msgs}${c.quiz ? shamsExtra() : ""}</div></div>
      ${c.quiz ? `<form class="wa-input" id="wa-form" autocomplete="off"><span class="wa-blue" style="font-size:26px">+</span><input id="wa-text" placeholder="Message" aria-label="Message à Shams" autocapitalize="off" autocorrect="off" spellcheck="false" /><button class="wa-send" aria-label="Envoyer">➤</button></form>` : '<div class="wa-input"><span class="wa-blue" style="font-size:26px">+</span><div>Message</div></div>'}${homeBar()}</div>`;
  };
  // fil de discussion avec Shams (réponses de Nana + réponses de Shams), gardé dans le navigateur
  S.shams = store.get("shams", []);
  function shamsExtra() {
    return S.shams.map((m) => `<div class="bub ${m.me ? "out" : "in"}">${esc(m.t)}<span class="tm">${m.tm}${m.me ? " ✓✓" : ""}</span></div>`).join("");
  }
  function shamsSay(lines, after) {
    let k = 0;
    const next = () => {
      if (k >= lines.length) return after && after();
      setTimeout(() => {
        S.shams.push({ t: lines[k++], tm: hm() }); store.set("shams", S.shams);
        if (S.view === "wa" && S.p.id === "shams") { render(false); document.getElementById("wa-text")?.focus(); }
        next();
      }, 1100);
    };
    next();
  }
  function shamsAnswer(raw) {
    const v = raw.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!v) return;
    S.shams.push({ me: 1, t: raw.trim(), tm: hm() }); store.set("shams", S.shams);
    render(false);
    if (store.get("shamsOk", false)) return shamsSay(["je t'ai déjà tout dit 😭", "le titre du premier générique. vérifie dans sa playlist 🎤"]);
    if (v.includes(C.catName)) {
      store.set("shamsOk", true);
      shamsSay(["ok c'est bien toi 😭", "le mot de passe de sa note, c'est le titre du premier générique de NANA 🎤", "si tu me crois pas, vérifie dans sa playlist Spotify"], () => hearts(innerWidth / 2, innerHeight / 2, 12));
    } else {
      const f = (S.shamsFails = (S.shamsFails || 0) + 1);
      shamsSay([f >= 3 ? "indice : il porte le nom d'un pouvoir dans One Piece 👀" : f === 2 ? "toujours pas 😂 t'es sûre que c'est toi ?" : "c'est pas son nom ça 😂"]);
    }
  }

  // messages
  V.messages = () => {
    const list = IM.filter((c) => !c.hidden || S.secret).map((c) => {
      const ms = c.msgs(); const last = ms[ms.length - 1];
      const unread = c.unread && !S.readIm.has(c.id);
      return `<button class="im-row" data-a="im" data-id="${c.id}">${unread ? '<span class="dot"></span>' : ""}${c.id === "secret" ? av({ n: C.owner, img: "p-bebe.jpg" }, 46) : av(c.name, 46)}
        <span class="grow"><span class="top"><b class="ellip">${esc(c.name)}</b><time>${c.time || S.secretTime || hm()} ${svg.chev}</time></span><p>${esc(c.prev || last.t)}</p></span></button>`;
    }).join("");
    return `<div class="scr">${statusBar()}<div class="nav">${backBtn("Accueil")}<span class="muted">Modifier</span></div>
      <div class="scroll"><div class="big-title">Messages</div>${list}<div class="pad-bottom"></div></div>${homeBar()}</div>`;
  };
  V.im = () => {
    const c = IM.find((x) => x.id === S.p.id);
    const avatar = c.id === "secret" ? av({ n: C.owner, img: "p-bebe.jpg" }, 54) : av(c.name, 54);
    return `<div class="scr">${statusBar()}<div class="im-head">${backBtn("", "open", 'data-v="messages"')}${avatar}<small>${esc(c.name)} ›</small></div>
      <div class="scroll" id="thread"><div class="im-msgs"><div class="ts">${/^\d/.test(c.time || "0") ? "Aujourd'hui " + (c.time || S.secretTime || hm()) : cap(c.time)}</div>${c.msgs().map((m) => `<div class="ibub ${m.me ? "out" : "in"}">${esc(m.t)}</div>`).join("")}</div></div>
      <div class="im-input"><span style="font-size:24px;color:var(--fg2)">+</span><div>iMessage</div></div>${homeBar()}</div>`;
  };

  // téléphone
  V.phone = () => {
    const tabs = [["fav", "Favoris", svg.star], ["rec", "Récents", svg.clock], ["ct", "Contacts", (c) => svg.person(c, 22)], ["keypad", "Clavier", svg.dots], ["vm", "Messagerie", svg.vm]];
    const tabbar = `<div class="tabbar">${tabs.map(([id, l, ic]) => `<button class="${S.phoneTab === id ? "on" : ""}" data-a="ptab" data-t="${id}">${ic(S.phoneTab === id ? "#0a84ff" : "#8e8e93")}${l}</button>`).join("")}</div>`;
    let body;
    if (S.phoneTab === "rec") {
      const rec = [["Nana 🌂", "appel manqué (3)", "22:58", true], ["La madré", "mobile", "19:40"], ["129 🥙", "fixe", "samedi"], ["Gros loup", "FaceTime audio", "vendredi"], ["Nana 🌂", "mobile", "jeudi"]];
      body = `<div class="big-title">Récents</div><div class="scroll">${rec.map(([n, s, t, miss]) => `<div class="rec-row">${av(n, 40)}<div><b class="${miss ? "miss" : ""}">${esc(n)}</b><small>${s}</small></div><time>${t}</time></div>`).join("")}</div>`;
    } else if (S.phoneTab === "fav") {
      body = `<div class="big-title">Favoris</div><div class="scroll"><div class="rec-row">${av("Nana 🌂", 40)}<div><b>Nana 🌂</b><small>mobile</small></div><time>⭐</time></div><div class="rec-row">${av("La madré", 40)}<div><b>La madré</b><small>mobile</small></div></div></div>`;
    } else if (S.phoneTab === "vm") {
      body = `<div class="big-title">Messagerie</div><div class="scroll"><div class="rec-row"><div><b>La madré</b><small>« rappelle-moi » · 0:04</small></div><time>hier</time></div><div class="rec-row"><div><b>Sista</b><small>« le chargeur. » · 0:02</small></div><time>lundi</time></div></div>`;
    } else {
      const full = S.dial === C.code;
      const keys = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]];
      body = `<div class="ph-display" id="dial">${esc(codeFmt(S.dial))}</div>
        <div class="ph-sugg${full ? " on" : ""}" id="sugg">${svg.person("#8e8e93", 18)} <b>${esc(C.her)}</b> ${esc(codeFmt(C.code))}</div>
        <div class="keypad">${keys.map(([k, s]) => `<button class="key" data-a="key" data-k="${k}"><b>${k}</b><small>${s || "&nbsp;"}</small></button>`).join("")}</div>
        <div class="key-row"><span></span><button class="key key-call" data-a="call" aria-label="Appeler">${svg.phone("#fff", 34)}</button><button class="key-del" data-a="keydel" aria-label="Effacer le dernier chiffre">${svg.del}</button></div>`;
    }
    return `<div class="scr ph">${statusBar()}<div class="nav">${backBtn("Accueil")}<span></span></div>${body}${tabbar}${homeBar()}</div>`;
  };

  function render(anim) {
    const html = V[S.view]();
    if (html === "") return;
    $screen.innerHTML = html;
    const scr = $screen.firstElementChild;
    if (anim && S.view !== "lock" && S.view !== "home" && scr) scr.classList.add("open");
    after[S.view] && after[S.view]();
  }

  const after = {
    lock() {
      const el = document.getElementById("lock");
      let y0 = null, dy = 0;
      el.addEventListener("pointerdown", (e) => { y0 = e.clientY; dy = 0; el.style.transition = "none"; });
      const move = (e) => { if (y0 == null) return; dy = Math.min(0, e.clientY - y0); el.style.transform = `translateY(${dy}px)`; };
      const end = () => { if (y0 == null) return; y0 = null; el.style.transition = ""; if (dy < -90) unlock(); else el.style.transform = ""; };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", end); window.addEventListener("pointercancel", end);
      cleanup.push(() => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); });
      el.addEventListener("wheel", (e) => { if (e.deltaY > 30) unlock(); }, { passive: true });
    },
    wa() {
      const t = document.getElementById("thread"); t.scrollTop = t.scrollHeight;
      const f = document.getElementById("wa-form");
      if (f) f.addEventListener("submit", (e) => { e.preventDefault(); const i = document.getElementById("wa-text"); const v = i.value; i.value = ""; shamsAnswer(v); });
    },
    im() { const t = document.getElementById("thread"); t.scrollTop = t.scrollHeight; },
    camera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      let stream = null, stopped = false;
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then((s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const v = document.createElement("video");
        v.autoplay = true; v.muted = true; v.playsInline = true; v.srcObject = s;
        const view = document.getElementById("camview");
        view.prepend(v); view.style.backgroundImage = "none";
      }).catch(() => {});
      cleanup.push(() => { stopped = true; stream && stream.getTracks().forEach((t) => t.stop()); });
    },
    weather() { if (!WX) loadWx(); },
  };

  function unlock() {
    if (S.asking) return;
    if (C.lockCode && !S.codeOk) {
      const el = document.getElementById("lock");
      if (el) { el.style.transform = "translateY(-100%)"; el.style.opacity = "0"; }
      S.asking = true;
      askCode({
        sub: "Saisissez le code", hint: "indice : regarde tes Souvenirs 🍼",
        onOk: () => { S.asking = false; S.codeOk = true; doUnlock(); },
        trolls: { "1234": "Sérieux ? 1234 ? 😭", "0000": "Non.", "0707": "Ça c'est pour plus tard 😏" },
        onCancel: () => { S.asking = false; go("lock", {}, false); },
      });
      return;
    }
    doUnlock();
  }
  function doUnlock() {
    const el = document.getElementById("lock");
    if (el) { el.style.transform = "translateY(-100%)"; el.style.opacity = "0"; }
    setTimeout(() => go("home", {}, false), el && el.style.opacity !== "0" ? 280 : 0);
    if (S.unlocked) return;
    S.unlocked = true;
    setTimeout(() => {
      S.waAdded = true;
      notify("whatsapp", "WhatsApp", `Vous avez été ajouté au groupe « ${GROUP} »`, () => go("wa", { id: "grp" }));
      if (S.view === "home") render(false);
    }, C.delays.whatsapp);
    if (!S.secret) setTimeout(revealSecret, C.delays.secret);
    else S.secretTime = store.get("secretTime", hm());
  }

  // Écran de code façon iPhone (déverrouillage + album Masqués)
  function askCode({ sub, hint, onOk, onCancel, code = C.lockCode, trolls = {} }) {
    const len = code.length;
    let val = "", fails = 0;
    const el = document.createElement("div");
    el.className = "pc";
    const keys = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["", ""], ["0", ""], ["", ""]];
    el.innerHTML = `<div class="pc-bg" style="background-image:url('${M("wallpaper.jpg")}')"></div>
      <div class="pc-in"><div class="pc-lock">${svg.lock}</div><p class="pc-t">${esc(sub)}</p>
      <div class="pc-dots">${"<i></i>".repeat(len)}</div><p class="pc-hint" aria-live="polite"></p>
      <div class="pc-keys">${keys.map(([k, s]) => (k ? `<button class="pc-key" data-k="${k}"><b>${k}</b><small>${s || "&nbsp;"}</small></button>` : "<span></span>")).join("")}</div>
      <div class="pc-foot"><button data-p="faceid">Face ID</button><button data-p="cancel">Annuler</button></div></div>`;
    el.style.pointerEvents = "auto";
    $overlay.appendChild(el);
    const dots = el.querySelector(".pc-dots"), hintEl = el.querySelector(".pc-hint"), cancelBtn = el.querySelector('[data-p="cancel"]');
    const paint = () => { [...dots.children].forEach((d, i) => d.classList.toggle("on", i < val.length)); cancelBtn.textContent = val ? "Effacer" : "Annuler"; };
    const close = () => { document.removeEventListener("keydown", onKey, true); el.remove(); };
    const press = (k) => {
      if (val.length >= len) return;
      val += k; paint();
      if (val.length === len) setTimeout(() => {
        if (val === code) { close(); hearts(innerWidth / 2, innerHeight / 2, 14); onOk(); return; }
        const tr = trolls[val];
        fails++; val = "";
        dots.classList.remove("shake"); void dots.offsetWidth; dots.classList.add("shake");
        paint();
        hintEl.textContent = tr || (fails >= 3 ? hint : fails === 2 ? "Toujours pas…" : "Code incorrect");
      }, 160);
    };
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) { press(e.key); e.preventDefault(); e.stopPropagation(); }
      else if (e.key === "Backspace") { val = val.slice(0, -1); paint(); e.preventDefault(); e.stopPropagation(); }
      else if (e.key === "Escape") { close(); onCancel && onCancel(); }
    };
    document.addEventListener("keydown", onKey, true);
    el.addEventListener("click", (e) => {
      const k = e.target.closest("[data-k]"), p = e.target.closest("[data-p]");
      if (k) press(k.dataset.k);
      else if (p && p.dataset.p === "faceid") toast("Face ID : visage non reconnu. T'es pas " + C.owner + " 😏");
      else if (p && p.dataset.p === "cancel") { if (val) { val = ""; paint(); } else { close(); onCancel && onCancel(); } }
    });
  }

  // Mot de passe de la note verrouillée
  function askPassword(onOk, o = {}) {
    const { title = "🔒 Note verrouillée", text = "Saisissez le mot de passe des notes pour voir « le numéro 🌂 ».", check = (v) => v === C.notesPassword.toLowerCase(),
      trolls = PW_TROLL, hint = "Mot de passe incorrect. indice : 🎤 un seul pote dit la vérité.", placeholder = "Mot de passe" } = o;
    let fails = 0;
    const el = document.createElement("div");
    el.className = "sheet-bg";
    el.style.pointerEvents = "auto";
    el.innerHTML = `<form class="sheet pw" autocomplete="off"><div class="grab"></div><h3>${esc(title)}</h3>
      <p class="muted" style="margin:0 18px 12px">${esc(text)}</p>
      <input id="pw-input" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" />
      <p class="pw-msg" aria-live="polite"></p>
      <div class="pw-btns"><button type="button" data-p="cancel">Annuler</button><button type="submit">OK</button></div></form>`;
    $overlay.appendChild(el);
    const input = el.querySelector("input"), msg = el.querySelector(".pw-msg"), form = el.querySelector("form");
    setTimeout(() => input.focus(), 250);
    el.addEventListener("click", (e) => { if (e.target === el || e.target.closest('[data-p="cancel"]')) el.remove(); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (!v) return;
      if (check(v)) { el.remove(); hearts(innerWidth / 2, innerHeight / 2, 14); onOk(); return; }
      fails++;
      msg.textContent = trolls[v] || (fails >= 3 ? hint : "Mot de passe incorrect.");
      form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
      input.select();
    });
  }
  function revealSecret() {
    S.secret = true; S.secretTime = hm();
    store.set("secret", true); store.set("secretTime", S.secretTime);
    notify("messages", "sousou (2)", secretLines()[0], () => go("im", { id: "secret" }));
    if (S.view === "home" || S.view === "messages") render(false);
  }

  function notify(app, title, text, onTap) {
    $overlay.querySelectorAll(".notif").forEach((o) => o.remove());
    const n = document.createElement("button");
    n.className = "notif";
    n.innerHTML = `${icon(app, 38)}<span class="grow"><span class="top"><b>${esc(title)}</b><span>maintenant</span></span><p>${esc(text)}</p></span>`;
    n.addEventListener("click", () => { n.remove(); if (S.view === "lock") unlock(); else if (!S.asking) onTap(); });
    $overlay.appendChild(n);
    setTimeout(() => { n.classList.add("out"); setTimeout(() => n.remove(), 400); }, 6500);
  }
  function toast(t, ms = 2600) {
    const el = document.createElement("div");
    el.className = "toast"; el.textContent = t;
    $overlay.appendChild(el);
    setTimeout(() => el.remove(), ms);
  }

  // ───────── effets : gratter, cœurs, secousse ─────────
  function scratch(el, amount) {
    const cover = el.querySelector("i");
    const o = Math.max(0, (parseFloat(cover.style.opacity || "1")) - amount);
    cover.style.opacity = o;
    if (o === 0 && !el.dataset.done) { el.dataset.done = "1"; const r = el.getBoundingClientRect(); hearts(r.left + r.width / 2, r.top, 6); }
  }
  document.addEventListener("pointermove", (e) => {
    const sc = e.target.closest && e.target.closest(".scratch");
    if (sc && (e.buttons || e.pointerType === "touch")) scratch(sc, 0.04);
  });

  const HEARTS = ["🤍", "💗", "💕", "🩷", "💖", "🌸"];
  function hearts(x, y, n = 18) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) n = Math.min(n, 4);
    const box = $app.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const h = document.createElement("span");
      h.className = "heart";
      h.textContent = HEARTS[i % HEARTS.length];
      const dx = (Math.random() - 0.5) * 220, dy = -(160 + Math.random() * 320), rot = (Math.random() - 0.5) * 80;
      h.style.left = (x - box.left) + "px"; h.style.top = (y - box.top) + "px";
      h.style.fontSize = 18 + Math.random() * 22 + "px";
      h.style.setProperty("--dx", dx + "px"); h.style.setProperty("--dy", dy + "px"); h.style.setProperty("--r", rot + "deg");
      h.style.animationDelay = Math.random() * 0.25 + "s";
      $overlay.appendChild(h);
      setTimeout(() => h.remove(), 2200);
    }
  }
  function heartRain() {
    const box = $app.getBoundingClientRect();
    for (let i = 0; i < 10; i++) setTimeout(() => hearts(box.left + Math.random() * box.width, box.top + box.height * (0.5 + Math.random() * 0.4), 4), i * 90);
  }
  // double-tap n'importe où → des cœurs (marche partout)
  let lastTap = 0;
  $app.addEventListener("pointerup", (e) => {
    const t = performance.now();
    if (t - lastTap < 300 && !e.target.closest("input, .pc-key, .key")) hearts(e.clientX, e.clientY, 10);
    lastTap = t;
  });
  // secouer le téléphone → pluie de cœurs (iPhone : autorisation demandée au premier toucher)
  let lastShake = 0, motionAsked = false, prev = null;
  window.addEventListener("devicemotion", (e) => {
    const a = e.accelerationIncludingGravity; if (!a || a.x == null) return;
    if (prev) {
      const d = Math.abs(a.x - prev.x) + Math.abs(a.y - prev.y) + Math.abs(a.z - prev.z);
      const t = performance.now();
      if (d > 32 && t - lastShake > 900) { lastShake = t; heartRain(); }
    }
    prev = { x: a.x, y: a.y, z: a.z };
  });
  document.addEventListener("click", () => {
    if (motionAsked) return; motionAsked = true;
    try { if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") DeviceMotionEvent.requestPermission().catch(() => {}); } catch {}
  }, { capture: true });

  // ───────── appels ─────────
  function callScreen(name, line, ms = 2600) {
    const el = document.createElement("div");
    el.className = "call";
    el.innerHTML = `<h2>${esc(name)}</h2><p>${esc(line)}</p><button class="hang" aria-label="Raccrocher">${svg.phone("#fff", 34).replace("<svg", '<svg style="transform:rotate(135deg)"')}</button>`;
    $screen.appendChild(el);
    const close = () => el.remove();
    el.querySelector(".hang").addEventListener("click", close);
    setTimeout(close, ms);
  }
  function trollCall(f) {
    const el = document.createElement("div");
    el.className = "call";
    const a = f.me ? av({ n: C.owner, img: "p-bebe.jpg" }, 110) : av(f.n, 110);
    el.innerHTML = `${a}<h2 style="margin-top:16px">${esc(f.me ? C.owner : f.n)}</h2><p>appel…</p><button class="hang" aria-label="Raccrocher">${svg.phone("#fff", 34).replace("<svg", '<svg style="transform:rotate(135deg)"')}</button>`;
    $screen.appendChild(el);
    const p = el.querySelector("p");
    const t1 = setTimeout(() => { p.style.whiteSpace = "pre-line"; p.style.color = "#fff"; p.style.fontSize = "20px"; p.textContent = f.line; }, 1500);
    const close = () => { clearTimeout(t1); el.remove(); };
    el.querySelector(".hang").addEventListener("click", close);
    setTimeout(close, 6500);
  }
  function placeCall() {
    if (!S.dial) return;
    if (FAKE_CALLS[S.dial]) { const f = FAKE_CALLS[S.dial]; S.dial = ""; render(false); trollCall(f); return; }
    if (S.dial !== C.code) {
      S.fails++;
      const n = codeFmt(S.dial);
      S.dial = ""; render(false);
      callScreen(n, "Le numéro que vous avez demandé n'est pas attribué.");
      if (S.fails === 3) setTimeout(() => toast("indice : il y a une note que tu n'as pas encore ouverte 🔒", 4200), 2700);
      return;
    }
    if (opensAt && new Date() < opensAt) {
      callScreen(C.her, `Ton correspondant n'est pas encore joignable.\nRéessaie ${fmtLong(opensAt)}.`, 4200);
      return;
    }
    finale();
  }

  // ───────── finale : le piano joue, la lettre s'écrit au stylo plume ─────────
  const PEN = `<svg class="pen" width="34" height="120" viewBox="0 0 34 120" aria-hidden="true">
    <defs><linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="#0d0d12"/><stop offset=".45" stop-color="#3a3a46"/><stop offset="1" stop-color="#0d0d12"/></linearGradient>
    <linearGradient id="ng" x1="0" x2="1"><stop offset="0" stop-color="#b8892f"/><stop offset=".5" stop-color="#f3d27a"/><stop offset="1" stop-color="#a67a25"/></linearGradient></defs>
    <path d="M17 0 L22 16 L12 16 Z" fill="url(#ng)"/><path d="M17 1 L17 13" stroke="#5a3e10" stroke-width=".8"/><circle cx="17" cy="11" r="1.2" fill="#5a3e10"/>
    <rect x="10.5" y="16" width="13" height="10" rx="2" fill="#1a1a22"/><rect x="10" y="25" width="14" height="3" fill="url(#ng)"/>
    <rect x="9" y="28" width="16" height="90" rx="7" fill="url(#pg)"/><rect x="23.5" y="34" width="2.5" height="40" rx="1.2" fill="url(#ng)"/></svg>`;

  // 1) l'appel : court, il l'envoie vers la note secrète
  function finale() {
    const el = document.createElement("div");
    el.className = "fin";
    el.innerHTML = `<div class="fin-bg" style="background-image:url('${M("wallpaper.jpg")}')"></div>${statusBar()}
      <div class="fin-start"><span class="av" style="width:120px;height:120px;background-image:url('${M("thumb/p-bebe.jpg")}')"></span><h2>${esc(C.owner)}</h2><p>appel entrant…</p>
      <div class="acts"><button data-f="no"><span style="background:var(--red)">${svg.phone("#fff", 32).replace("<svg", '<svg style="transform:rotate(135deg)"')}</span>Refuser</button>
      <button data-f="yes"><span style="background:var(--green)">${svg.phone("#fff", 32)}</span>Accepter</button></div></div>`;
    $overlay.appendChild(el); el.style.pointerEvents = "auto";
    el.querySelector('[data-f="no"]').addEventListener("click", () => {
      el.querySelector(".fin-start p").textContent = "t'es sûre ? 🥺";
      el.querySelector('[data-f="no"]').style.visibility = "hidden";
    });
    el.querySelector('[data-f="yes"]').addEventListener("click", () => {
      const box = el.querySelector(".fin-start");
      box.querySelector(".acts").remove();
      box.querySelector(".av").style.animation = "none";
      const p = box.querySelector("p");
      p.textContent = "00:00";
      const lines = ["…", "allô ?", "t'as trouvé. je savais que t'allais trouver.", "je t'ai laissé quelque chose.", "va voir dans mes Notes 🌂"];
      let s = 0;
      box.insertAdjacentHTML("beforeend", '<p class="fin-say" aria-live="polite"></p>');
      const say = box.querySelector(".fin-say");
      const iv = setInterval(() => {
        s++; p.textContent = `00:${pad(s)}`;
        if (s <= lines.length) say.textContent = lines[s - 1];
        if (s === lines.length + 2) {
          clearInterval(iv);
          p.textContent = "Appel terminé";
          setTimeout(() => {
            el.remove(); S.dial = "";
            S.done = true; store.set("done", true); store.set("secretAt", Date.now());
            go("home", {}, false);
            setTimeout(() => notify("notes", "Notes", "Une note secrète vient d'être déverrouillée : « pour toi 🤍 »", () => go("notes")), 500);
          }, 1200);
        }
      }, 1400);
    });
  }

  // ───────── événements ─────────
  $app.addEventListener("click", (e) => {
    const stop = e.target.closest("[data-stop]");
    const b = e.target.closest("[data-a]");
    if (!b || (stop && !stop.contains(b))) return;
    if (stop && b.dataset.a === "calclose") return;
    const a = b.dataset.a, d = b.dataset;
    switch (a) {
      case "unlock": unlock(); break;
      case "home": if (S.view !== "lock") go("home", {}, false); break;
      case "open": go(d.v, { album: d.album || "", folder: d.folder || "" }); break;
      case "photo": go("photo", { i: +d.i, album: d.album || "" }, false); break;
      case "note": {
        const i = +d.i;
        if (NOTES[i].folder === "locked" && !S.notesOpen) askPassword(() => { S.notesOpen = true; go("note", { i }); });
        else go("note", { i });
        break;
      }
      case "hiddenalbum":
        if (S.hiddenOpen) go("gallery", { album: "hidden" });
        else askCode({ sub: "Saisissez le code de Masqués", hint: "indice : regarde mon Calendrier 📅", code: C.hiddenCode,
          trolls: { [C.lockCode]: "Pas le même code que le téléphone, faut pas abuser 😏", "4321": "T'as vraiment cru que je notais mes codes ? 😭", "1234": "Mdr. Non." },
          onOk: () => { S.hiddenOpen = true; go("gallery", { album: "hidden" }); } });
        break;
      case "contact": go("contact", { n: d.n }); break;
      case "wa": S.readWa.add(d.id); go("wa", { id: d.id }); break;
      case "im": S.readIm.add(d.id); go("im", { id: d.id }); break;
      case "ftcall":
        if (d.n === "Nana 🌂") { go("camera"); setTimeout(() => toast("c'est toi que j'appelle 😏"), 400); }
        else callScreen(d.n, "FaceTime… indisponible");
        break;
      case "calday": S.calSheet = +d.d; render(false); break;
      case "calclose": S.calSheet = null; render(false); break;
      case "shoot": {
        const f = document.createElement("div"); f.className = "flash"; $screen.appendChild(f); setTimeout(() => f.remove(), 400);
        toast("photo enregistrée… dans ma tête 📸"); break;
      }
      case "sp": {
        const t = TRACKS[+d.i];
        if (t.solo) {
          if (!S.done) { toast("🔒 Ce titre se débloque avec la note secrète…"); break; }
          if (!spAudio) { spAudio = new Audio(M("piano.mp3")); spAudio.addEventListener("ended", () => S.view === "spotify" && render(false)); }
          if (spAudio.paused) spAudio.play(); else spAudio.pause();
          render(false);
        } else {
          toast(t.t === "Rose" ? "🎤 « Rose » : générique d'ouverture n°1 de NANA" : `Aperçu indisponible · ${t.t}`);
        }
        break;
      }
      case "yt":
        toast(S.done ? "Tu l'as déjà entendue… dans Spotify maintenant 🌂" : "🔒 Compose le bon numéro.");
        break;
      case "toast": toast(d.t); break;
      case "scratch": scratch(b, 0.34); break;
      case "letter":
        if (store.get("secretOpen", false)) go("secret");
        else askPassword(() => { store.set("secretOpen", true); go("secret"); setTimeout(() => hearts(innerWidth / 2, innerHeight * 0.4, 26), 350); }, {
          title: "🔒 pour toi 🤍", text: "Dernière question : qu'est-ce qu'on a déjà goûté ensemble ? (un seul mot)", placeholder: "Réponse",
          check: (v) => v.startsWith(C.secretAnswer), hint: "Non 😭 indice : 🍫 (et cette fois, c'est pas un piège)",
          trolls: { "129": "Ça, on l'a PAS encore goûté. C'est la suite 😏", grec: "Pas encore ! C'est prévu 🥙", rose: "Ça c'était l'ancien mot de passe 😭" } });
        break;
      case "secretplay":
        if (!spAudio) {
          spAudio = new Audio(M("piano.mp3"));
          spAudio.addEventListener("ended", () => { const pp = document.querySelector(".att-pp"); if (pp) pp.innerHTML = svg.play("#000", 18); if (S.view === "spotify") render(false); });
        }
        if (spAudio.paused) spAudio.play(); else spAudio.pause();
        b.querySelector(".att-pp").innerHTML = spAudio.paused ? svg.play("#000", 18) : svg.pause("#000", 18);
        break;
      case "ptab": if (d.t === "ct") { go("contacts"); break; } S.phoneTab = d.t; render(false); break;
      case "key":
        if (S.dial.length < 12) S.dial += d.k;
        document.getElementById("dial").textContent = codeFmt(S.dial);
        document.getElementById("sugg").classList.toggle("on", S.dial === C.code);
        break;
      case "keydel":
        S.dial = S.dial.slice(0, -1);
        document.getElementById("dial").textContent = codeFmt(S.dial);
        document.getElementById("sugg").classList.toggle("on", S.dial === C.code);
        break;
      case "call": placeCall(); break;
    }
  });
  document.addEventListener("keydown", (e) => {
    if (S.asking || document.querySelector(".pc, .pw")) return;
    if (S.view === "lock" && ["ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); unlock(); }
    else if (S.view === "phone" && S.phoneTab === "keypad" && /^[0-9*#]$/.test(e.key)) { S.dial += e.key; render(false); }
    else if (S.view === "phone" && e.key === "Backspace") { S.dial = S.dial.slice(0, -1); render(false); }
    else if (S.view === "phone" && e.key === "Enter") placeCall();
  });

  // horloge
  setInterval(() => { const t = hm(); document.querySelectorAll("[data-clock]").forEach((n) => { if (n.textContent !== t) n.textContent = t; }); }, 1000);

  render(false);
})();
