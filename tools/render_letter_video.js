// Fabrique la vidéo « lettre au stylo plume + solo de piano » (1080×1920, vertical).
// Chaque image est rendue à un instant précis, donc l'écriture est parfaitement
// calée sur la musique, comme dans le téléphone.
//
// Usage : node tools/render_letter_video.js <sortie.mp4> [fps]
// (nécessite playwright + ffmpeg, et media/piano.mp3)
const { chromium } = require("playwright");
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.resolve(process.argv[2] || "lettre-pour-nana.mp4");
const FPS = Number(process.argv[3] || 24);
const AUDIO = path.join(ROOT, "media/piano.mp3");

global.window = {};
require(path.join(ROOT, "config.js"));
const L = window.CONFIG.letter;
const app = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const PEN = app.match(/const PEN = `([\s\S]*?)`;/)[1];
const font = (f) => "data:font/woff2;base64," + fs.readFileSync(path.join(ROOT, "fonts", f)).toString("base64");
const DUR = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", AUDIO]).toString());
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const d = new Date();
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const chars = (txt) => [...txt].map((c) => (c === " " ? '<span class="ch gap"> </span>' : `<span class="ch">${esc(c)}</span>`)).join("")
  .replace(/((?:<span class="ch">[^<]*<\/span>)+)/g, '<span class="w">$1</span>');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Parisienne"; src: url(${font("parisienne-latin-400-normal.woff2")}); }
@font-face { font-family: "Pinyon Script"; src: url(${font("pinyon-script-latin-400-normal.woff2")}); }
html, body { margin: 0; width: 540px; height: 960px; overflow: hidden; background: #2a2119; }
body { background: radial-gradient(ellipse at 50% 30%, #3b2f24, #1c160f 75%); }
.desk { position: absolute; inset: 0; overflow: hidden; }
.sheet { position: absolute; left: 34px; right: 34px; top: 60px; }
.paper { position: relative; background: #f5eddc; color: #1b2a5c; border-radius: 3px; padding: 42px 30px 70px 34px;
  box-shadow: 0 1px 0 #e6d8bb, 0 24px 60px rgba(0,0,0,.6);
  background-image: radial-gradient(ellipse at 20% 10%, rgba(255,255,255,.55), transparent 55%),
    radial-gradient(ellipse at 90% 90%, rgba(150,120,70,.16), transparent 60%),
    repeating-linear-gradient(transparent 0 37px, rgba(27,42,92,.07) 37px 38px);
  background-position: 0 0, 0 0, 0 30px; }
.paper p { margin: 0 0 14px; font-family: "Parisienne", cursive; font-size: 25px; line-height: 38px; }
.l-date { text-align: right; font-size: 21px !important; margin-bottom: 18px !important; }
.l-hello { font-family: "Pinyon Script", cursive !important; font-size: 40px !important; margin-bottom: 10px !important; }
.l-sign { font-family: "Pinyon Script", cursive !important; font-size: 42px !important; text-align: right; margin-top: 22px !important; }
.w { white-space: nowrap; }
.ch { opacity: 0; display: inline-block; text-shadow: 0 0 .6px rgba(27,42,92,.55); }
.ch.gap { display: inline; }
.pen { position: absolute; left: 0; top: 0; width: 34px; height: 120px; transform-origin: 17px 0; filter: drop-shadow(4px 8px 6px rgba(0,0,0,.35)); z-index: 2; }
.title { position: absolute; left: 0; right: 0; bottom: 18px; text-align: center; font: 14px/1 Georgia, serif; letter-spacing: .3em; color: rgba(245,237,220,.45); text-transform: uppercase; }
</style></head><body><div class="desk"><div class="sheet" id="sheet"><article class="paper" id="paper">
<p class="l-date">${chars(`${L.place}, le ${d.getDate()} ${MONTHS[d.getMonth()]}`)}</p>
<p class="l-hello">${chars(L.greeting)}</p>
${L.paragraphs.map((p) => `<p>${chars(p)}</p>`).join("")}
<p class="l-sign">${chars(L.signature)}</p>${PEN}</article></div></div>
<div class="title">solo pour nana</div>
<script>
const DUR = ${DUR};
const paper = document.getElementById("paper"), sheet = document.getElementById("sheet"), pen = paper.querySelector(".pen");
const cs = [...paper.querySelectorAll(".ch")];
const wts = cs.map((c) => {
  const t = c.textContent, last = c === c.parentElement.lastElementChild && c.closest("p").lastElementChild.contains(c);
  let w = t === " " ? 0.55 : /[,;:]/.test(t) ? 4 : /[.!?…]/.test(t) ? 7 : 1;
  if (last) w += 12;
  return w;
});
const cum = []; wts.reduce((a, w, i) => (cum[i] = a + w), 0);
const W = cum[cum.length - 1];
const at = cum.map((c) => 1.2 + (c / W) * (DUR - 10));       // instant où chaque caractère est écrit
let pos = null, scroll = 0;
window.setT = (t) => {
  if (!pos) pos = cs.map((c) => { const r = c.getBoundingClientRect(), p = paper.getBoundingClientRect(); return [r.right - p.left - 4, r.bottom - p.top - 6]; });
  let last = -1;
  for (let i = 0; i < cs.length; i++) {
    const k = (t - at[i]) / 0.28;
    cs[i].style.opacity = k <= 0 ? 0 : k >= 1 ? 1 : k;
    cs[i].style.filter = k > 0 && k < 1 ? "blur(" + (0.6 * (1 - k)) + "px)" : "none";
    if (k > 0) last = i;
  }
  const done = last === cs.length - 1 && t > at[cs.length - 1] + 0.5;
  const [x, y] = last >= 0 ? pos[last] : [pos[0][0] - 10, pos[0][1]];
  pen.style.transform = "translate(" + x + "px," + y + "px) rotate(-38deg)";
  pen.style.opacity = done ? Math.max(0, 1 - (t - at[cs.length - 1] - 0.5) / 1.2) : 1;
  // la feuille remonte pour garder la plume vers 60 % de la hauteur
  const want = Math.max(0, Math.min(paper.offsetHeight + 120 - 960, y + 60 - 960 * 0.6));
  scroll += (want - scroll) * 0.08;
  sheet.style.transform = "translateY(" + (-scroll) + "px)";
};
</script></body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await p.setContent(html);
  await p.evaluate(async () => { await document.fonts.load('25px "Parisienne"'); await document.fonts.load('40px "Pinyon Script"'); await document.fonts.ready; });
  if (process.env.PREVIEW) { // aperçu : quelques images fixes
    for (const t of [3, 40, 110, 205]) {
      for (let k = 60; k >= 0; k--) await p.evaluate((t) => window.setT(t), t - k / FPS);
      await p.screenshot({ path: `${process.env.PREVIEW}/apercu-${t}.png` });
    }
    await b.close(); return;
  }
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-i", AUDIO,
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
    "-shortest", "-movflags", "+faststart", OUT], { stdio: ["pipe", "inherit", "inherit"] });
  const n = Math.ceil(DUR * FPS);
  for (let i = 0; i < n; i++) {
    await p.evaluate((t) => window.setT(t), i / FPS);
    const buf = await p.screenshot({ type: "jpeg", quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % (FPS * 20) === 0) console.log(`${Math.round((i / n) * 100)} %`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await b.close();
  console.log("ok", OUT);
})();
