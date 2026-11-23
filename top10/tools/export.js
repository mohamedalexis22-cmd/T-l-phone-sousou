#!/usr/bin/env node
/* =========================================================
   EXPORT DES SCÈNES EN VIDÉO / IMAGE pour le montage.

   node tools/export.js [sauvegarde.json] [options]

     sauvegarde.json  le fichier « Télécharger la sauvegarde » du studio
                      (sans fichier : l'exemple)
     --etapes 0,5-9 n'exporter que certaines étapes (numéros de la régie − 1)
     --png          seulement une image fixe par étape (rapide)
     --fps 30       images par seconde (défaut 30)

   Résultat dans top10/export/<nom de la sauvegarde>/ :
     NN-nom.mp4    scènes plein écran (H.264, 1920×1080)
     NN-nom.mov    incrustations avec TRANSPARENCE (ProRes 4444)
     NN-nom.png    dernière image de chaque étape

   Nécessite Playwright (require('playwright')) et ffmpeg.
   L'animation est calculée image par image : aucune saccade,
   même sur une machine lente.
   ========================================================= */
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const opt = (k, def) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : def; };
const fichier = args.find((a, i) => !a.startsWith("--") && !(args[i - 1] || "").startsWith("--"));
const ep = fichier ? path.basename(fichier, ".json") : "exemple";
const donnees = fichier ? JSON.parse(fs.readFileSync(fichier, "utf8")) : null;
const fps = Number(opt("--fps", 30));
const pngSeul = args.includes("--png");
const filtre = opt("--etapes", null);

// Durée de chaque type de scène (secondes) — la dernière image se prolonge au montage
const DUREES = { fiche: 5, recap: 5 };

function choix(n) {
  if (!filtre) return () => true;
  const set = new Set();
  filtre.split(",").forEach((p) => { const [a, b] = p.split("-").map(Number); for (let k = a; k <= (b ?? a); k++) set.add(k); });
  return (i) => set.has(i);
}

const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function ffmpeg(sortie, alpha) {
  const commun = ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-"];
  const codec = alpha
    ? ["-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le", "-vendor", "apl0"]
    : ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "medium"];
  const p = spawn("ffmpeg", [...commun, ...codec, sortie], { stdio: ["pipe", "ignore", "inherit"] });
  return p;
}

(async () => {
  const racine = path.resolve(__dirname, "..");
  const dossier = path.join(racine, "export", ep);
  fs.mkdirSync(dossier, { recursive: true });
  const url = (i) => "file://" + path.join(racine, "scene.html") + `?i=${i}`;

  const nav = await chromium.launch();
  const page = await nav.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  if (donnees) await page.addInitScript((d) => { window.EPISODE_EXPORT = d; }, donnees);
  await page.goto(url(0));
  await page.waitForFunction(() => window.__pret);
  const steps = await page.evaluate(() => KIT.steps.map((s) => ({ type: s.type, label: s.label, overlay: s.overlay })));
  const garder = choix(steps.length);
  console.log(`« ${ep} » : ${steps.length} étapes`);

  for (let i = 0; i < steps.length; i++) {
    if (!garder(i)) continue;
    const s = steps[i];
    const base = path.join(dossier, `${String(i + 1).padStart(2, "0")}-${slug(s.label)}`);
    await page.evaluate((k) => KIT.afficher(k), i);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.images].map((im) => im.complete || new Promise((r) => (im.onload = im.onerror = r)))));
    const duree = DUREES[s.type] || 4;
    const shot = async (ms) => {
      await page.evaluate((t) => { window.__seek(t); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, ms);
      return page.screenshot({ omitBackground: s.overlay, type: "png" });
    };

    if (!pngSeul) {
      const ff = ffmpeg(base + (s.overlay ? ".mov" : ".mp4"), s.overlay);
      const n = Math.round(duree * fps);
      for (let f = 0; f < n; f++) {
        const buf = await shot((f * 1000) / fps);
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
      }
      ff.stdin.end();
      await new Promise((r) => ff.on("close", r));
    }
    fs.writeFileSync(base + ".png", await shot(duree * 1000));
    console.log(`  ✓ ${String(i + 1).padStart(2, "0")} ${s.label}${s.overlay ? "  (transparent)" : ""}`);
  }
  await nav.close();
  console.log(`\nFichiers dans ${dossier}`);
})().catch((e) => { console.error(e); process.exit(1); });
