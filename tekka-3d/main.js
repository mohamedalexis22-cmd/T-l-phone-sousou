// Écran d'attente 3D — Tekka Cup 2026
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const CFG = window.TEKKA;            // { logo, jersey, photos:[[src,caption]...] }
const SPEED = 5.2;                   // vitesse du couloir (unités / s)
const PURPLE = 0x7b2cff, PURPLE_D = 0x2a0a5e;

/* ---------------- moteur ---------------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('gl').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06030c);
scene.fog = new THREE.FogExp2(0x0a0514, 0.028);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0.55, 2.05, 7.4);
const camTarget = new THREE.Vector3(-0.2, 1.75, -4);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.55, 0.93);
composer.addPass(bloom);
composer.addPass(new OutputPass());

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});

/* ---------------- textures ---------------- */
const loader = new THREE.TextureLoader();
const tex = (src, srgb = true) => { const t = loader.load(src); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const logoTex = tex(CFG.logo);
const photoTex = CFG.photos.map(([src]) => tex(src));

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  draw(c.getContext('2d'), w, h, t); t.needsUpdate = true;
  return t;
}
const logoImg = new Image(); logoImg.src = CFG.logo;
const jerseyImg = new Image(); jerseyImg.src = CFG.jersey;

/* ---------------- lumières ---------------- */
scene.add(new THREE.HemisphereLight(0x8a6cff, 0x0a0612, 0.35));
const key = new THREE.DirectionalLight(0xfff1e0, 1.5);
key.position.set(3, 9, 8); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -3, right: 3, top: 4, bottom: -1, near: 1, far: 30 });
key.shadow.bias = -0.0004; key.shadow.radius = 4;
key.target.position.set(-0.8, 1, 0); scene.add(key, key.target);
const rim = new THREE.SpotLight(0x9b5cff, 60, 30, 0.6, 0.6, 1.5);
rim.position.set(0, 5, -5); rim.target.position.set(-0.8, 1.5, 0); scene.add(rim, rim.target);
const fill = new THREE.PointLight(0xb08cff, 5, 14, 2); fill.position.set(-3.5, 2.5, 3); scene.add(fill);

/* ---------------- couloir ---------------- */
const LEN = 150, HALF_W = 4.6, WALL_H = 6.2;
// sol brillant avec lignes néon qui défilent
const floorGlow = canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#b48cff'; g.fillRect(w * 0.12, 0, 5, h); g.fillRect(w * 0.88 - 5, 0, 5, h);
  g.fillStyle = '#6d2cff'; g.fillRect(w / 2 - 3, 0, 6, h * 0.45);
  g.globalAlpha = .55; g.fillStyle = '#7b2cff'; g.fillRect(0, h * 0.92, w, 10);
});
floorGlow.wrapS = floorGlow.wrapT = THREE.RepeatWrapping; floorGlow.repeat.set(1, LEN / 6);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 2, LEN),
  new THREE.MeshStandardMaterial({ color: 0x0c0912, roughness: 0.22, metalness: 0.65, emissive: 0xffffff, emissiveMap: floorGlow, emissiveIntensity: 1.4, envMapIntensity: 0.6 }));
floor.rotation.x = -Math.PI / 2; floor.position.z = -LEN / 2 + 12; floor.receiveShadow = true; scene.add(floor);

// murs avec motif logo Tekka
const wallTex = canvasTex(512, 512, (g, w, h, T) => {
  g.fillStyle = '#120c1d'; g.fillRect(0, 0, w, h);
  const draw = () => { g.globalAlpha = 0.08; g.drawImage(logoImg, 96, 96, 320, 320); g.globalAlpha = 1; T.needsUpdate = true; };
  if (logoImg.complete) draw(); else logoImg.addEventListener('load', draw);
});
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(LEN / 4, WALL_H / 4);
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85, metalness: 0.1 });
for (const s of [-1, 1]) {
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(LEN, WALL_H), wallMat);
  wall.position.set(s * HALF_W, WALL_H / 2, -LEN / 2 + 12); wall.rotation.y = -s * Math.PI / 2; wall.receiveShadow = true; scene.add(wall);
  // néons au pied et en haut des murs
  for (const y of [0.04, WALL_H - 0.04]) {
    const n = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, LEN), new THREE.MeshBasicMaterial({ color: 0x9a5cff }));
    n.position.set(s * (HALF_W - 0.04), y, -LEN / 2 + 12); scene.add(n);
  }
}
// plafond avec barres lumineuses
const ceilTex = canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9c6ff'; g.fillRect(0, h * 0.45, w, h * 0.07); });
ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping; ceilTex.repeat.set(1, LEN / 5);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 2, LEN), new THREE.MeshStandardMaterial({ color: 0x07050b, emissive: 0xffffff, emissiveMap: ceilTex, emissiveIntensity: 1.2, roughness: 1 }));
ceil.rotation.x = Math.PI / 2; ceil.position.set(0, WALL_H, -LEN / 2 + 12); scene.add(ceil);

/* ---------------- cadres photo ---------------- */
const STYLES = [
  { name: 'gold',   frame: new THREE.MeshStandardMaterial({ color: 0xd8ae55, metalness: 1, roughness: 0.28 }), mat: 0xf3ead6 },
  { name: 'black',  frame: new THREE.MeshStandardMaterial({ color: 0x0b0a0f, metalness: 0.4, roughness: 0.18 }), neon: true },
  { name: 'white',  frame: new THREE.MeshStandardMaterial({ color: 0xf2f2f5, metalness: 0, roughness: 0.45 }), mat: 0xffffff },
  { name: 'chrome', frame: new THREE.MeshStandardMaterial({ color: 0xe9e9f2, metalness: 1, roughness: 0.08 }) },
  { name: 'purple', frame: new THREE.MeshStandardMaterial({ color: 0x3b1470, metalness: 0.6, roughness: 0.3 }), neon: true },
];
const neonMat = new THREE.MeshBasicMaterial({ color: 0xa875ff });
const glowTex = canvasTex(128, 128, (g, w, h) => {
  const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  r.addColorStop(0, 'rgba(255,235,200,0.9)'); r.addColorStop(1, 'rgba(255,235,200,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h);
});
function plaqueTex(text) {
  return canvasTex(512, 96, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f1d48c'); gr.addColorStop(1, '#a97a26');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a1206'; g.font = '700 44px Anton, Impact, "Arial Narrow", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text.toUpperCase(), w / 2, h / 2 + 2, w - 30);
  });
}
const plaqueTexs = CFG.photos.map(([, cap]) => plaqueTex(cap));

const PW = 1.75, PH = 2.33, N_PER_SIDE = 12, GAP = 5.4;
const frames = [];
let photoCursor = 0;
function buildFrame(style) {
  const g = new THREE.Group();
  const border = style.mat ? 0.42 : 0.26;
  const back = new THREE.Mesh(new RoundedBoxGeometry(PW + border, PH + border, 0.14, 3, 0.04), style.frame);
  back.castShadow = true; g.add(back);
  if (style.mat) { const m = new THREE.Mesh(new THREE.PlaneGeometry(PW + 0.2, PH + 0.2), new THREE.MeshStandardMaterial({ color: style.mat, roughness: 0.9 })); m.position.z = 0.071; g.add(m); }
  if (style.neon) for (const [w, h, x, y] of [[PW + 0.1, 0.03, 0, PH / 2 + 0.05], [PW + 0.1, 0.03, 0, -PH / 2 - 0.05], [0.03, PH + 0.1, PW / 2 + 0.05, 0], [0.03, PH + 0.1, -PW / 2 - 0.05, 0]]) {
    const n = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), neonMat); n.position.set(x, y, 0.075); g.add(n);
  }
  const photoMat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.32 });
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), photoMat); photo.position.z = 0.078; g.add(photo);
  // reflet de verre
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0, clearcoat: 1 }));
  glass.position.z = 0.085; g.add(glass);
  // lampe de tableau + halo
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 1, roughness: 0.3, emissive: 0xfff0d0, emissiveIntensity: 0.0 }));
  lamp.rotation.z = Math.PI / 2; lamp.position.set(0, PH / 2 + border / 2 + 0.22, 0.28); g.add(lamp);
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.04), new THREE.MeshBasicMaterial({ color: 0xfff2d6 })); bulb.position.set(0, PH / 2 + border / 2 + 0.18, 0.3); g.add(bulb);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.6), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(0, 0.5, 0.02); g.add(halo);
  const plaqueMat = new THREE.MeshStandardMaterial({ metalness: 0.8, roughness: 0.35 });
  const plaque = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.28, 0.04, 2, 0.02), [null, null, null, null, plaqueMat, null].map(m => m || new THREE.MeshStandardMaterial({ color: 0xb88a35, metalness: 1, roughness: 0.3 })));
  plaque.position.set(0, -PH / 2 - border / 2 - 0.32, 0.04); g.add(plaque);
  return { g, photoMat, plaqueMat };
}
function assign(f) {
  const i = photoCursor++ % CFG.photos.length;
  f.photoMat.map = photoTex[i]; f.photoMat.emissiveMap = photoTex[i]; f.photoMat.needsUpdate = true;
  f.plaqueMat.map = plaqueTexs[i]; f.plaqueMat.needsUpdate = true;
}
for (let k = 0; k < N_PER_SIDE; k++) for (const side of [-1, 1]) {
  const f = buildFrame(STYLES[(k * 2 + (side > 0 ? 1 : 0)) % STYLES.length]);
  f.side = side;
  f.g.position.set(side * (HALF_W - 0.1), 2.75 + (k % 3 === 1 ? 0.15 : 0), 8 - k * GAP - (side > 0 ? GAP / 2 : 0));
  f.g.rotation.y = -side * Math.PI / 2;
  f.g.rotation.z = (k % 2 ? 1 : -1) * 0.012;
  assign(f); frames.push(f); scene.add(f.g);
}

/* ---------------- coupe Tekka ---------------- */
const silver = new THREE.MeshStandardMaterial({ color: 0xf4f4f8, metalness: 1, roughness: 0.07, envMapIntensity: 1.4 });
const gold = new THREE.MeshStandardMaterial({ color: 0xe6b84f, metalness: 1, roughness: 0.22, envMapIntensity: 1.3 });
const blackGloss = new THREE.MeshPhysicalMaterial({ color: 0x050507, metalness: 0.2, roughness: 0.25, clearcoat: 1 });
function lathe(pts, mat, seg = 64) { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat); m.castShadow = true; return m; }
const trophy = new THREE.Group();
{
  // socle octogonal noir + plaque dorée
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.55, 8), blackGloss); base.position.y = 0.275; base.rotation.y = Math.PI / 8; trophy.add(base);
  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.18, 8), blackGloss); base2.position.y = 0.64; base2.rotation.y = Math.PI / 8; trophy.add(base2);
  const plateTex = canvasTex(512, 380, (g, w, h, T) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f6d77a'); gr.addColorStop(.5, '#d7a63c'); gr.addColorStop(1, '#f2cf6f');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const d = () => { g.save(); g.filter = 'brightness(0)'; g.drawImage(logoImg, w / 2 - 85, 18, 170, 170); g.restore();
      g.fillStyle = '#1b1406'; g.textAlign = 'center'; g.font = '700 40px Arial, sans-serif';
      g.fillText('TEKKA CUP WINNER', w / 2, 238); g.fillText('1ER ÉDITION', w / 2, 284); g.fillText('2026', w / 2, 330); T.needsUpdate = true; };
    if (logoImg.complete) d(); else logoImg.addEventListener('load', d);
  });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.38), new THREE.MeshStandardMaterial({ map: plateTex, metalness: 0.9, roughness: 0.3 }));
  plate.position.set(0, 0.29, 0.6); trophy.add(plate);
  // pied doré, tige argent, coupe
  trophy.add(lathe([[0, 0.72], [0.34, 0.72], [0.34, 0.76], [0.3, 0.8], [0.3, 0.98], [0.22, 1.02], [0, 1.02]], gold));
  trophy.add(lathe([[0, 1.0], [0.2, 1.0], [0.13, 1.1], [0.1, 1.28], [0.17, 1.36], [0.1, 1.44], [0.08, 1.6], [0.16, 1.66], [0.1, 1.72], [0.12, 1.8], [0.3, 1.95], [0.5, 2.35], [0.58, 2.8], [0.6, 3.05], [0.57, 3.1], [0, 3.1]], silver));
  trophy.add(lathe([[0.62, 2.98], [0.66, 3.02], [0.66, 3.2], [0.62, 3.24], [0.55, 3.24], [0.55, 2.98]], gold)); // bande couronne
  for (let i = 0; i < 10; i++) { // pointes de couronne
    const a = i / 10 * Math.PI * 2, p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), gold);
    p.position.set(Math.cos(a) * 0.64, 3.32, Math.sin(a) * 0.64); trophy.add(p);
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 12), gold); c.position.set(Math.cos(a) * 0.64, 3.24, Math.sin(a) * 0.64); trophy.add(c);
  }
  trophy.add(lathe([[0, 3.2], [0.5, 3.2], [0.48, 3.35], [0.38, 3.55], [0.22, 3.72], [0.08, 3.8], [0.06, 3.88], [0.12, 3.98], [0.1, 4.1], [0.04, 4.2], [0, 4.22]], silver)); // couvercle
  trophy.add(lathe([[0.17, 1.24], [0.2, 1.28], [0.2, 1.42], [0.17, 1.46], [0.1, 1.46], [0.1, 1.24]], gold)); // bague dorée de la tige
  // anses
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 16, 48, Math.PI * 1.1), silver);
    h.position.set(s * 0.62, 2.45, 0); h.rotation.z = s > 0 ? -Math.PI * 0.55 : Math.PI * 0.45; h.rotation.y = 0; trophy.add(h);
  }
}
// rubans bleu/blanc/rouge qui flottent
const ribbons = [];
for (const s of [-1, 1]) ['#1f4fd1', '#ffffff', '#d6202a', '#1f4fd1', '#ffffff', '#d6202a'].forEach((col, i) => {
  const geo = new THREE.PlaneGeometry(0.05, 1.5 + (i % 3) * 0.25, 1, 20); geo.translate(0, -(0.75 + (i % 3) * 0.125), 0);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.1 }));
  m.position.set(s * (0.98 + i * 0.012), 2.85, (i - 2.5) * 0.04); m.userData.base = geo.attributes.position.array.slice(); m.userData.ph = i * 0.7 + (s > 0 ? 2 : 0);
  trophy.add(m); ribbons.push(m);
});
const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.9, 48), blackGloss); pedestal.position.y = 0.45; pedestal.receiveShadow = true;
const pedRing = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.03, 8, 96), new THREE.MeshBasicMaterial({ color: 0xa875ff })); pedRing.rotation.x = Math.PI / 2; pedRing.position.y = 0.9;
const trophyGroup = new THREE.Group(); trophyGroup.add(pedestal, pedRing, trophy); trophy.position.y = 0.9; trophy.scale.setScalar(1.25);
trophyGroup.position.set(1.15, 0, -17); scene.add(trophyGroup);
const tSpot = new THREE.SpotLight(0xffffff, 90, 20, 0.38, 0.5, 1.4); tSpot.position.set(1.15, 5.9, -14); tSpot.target = trophyGroup; scene.add(tSpot);
const tGlow = new THREE.PointLight(0x8f4dff, 20, 8, 2); tGlow.position.set(1.15, 1.6, -15.5); scene.add(tGlow);

/* ---------------- médailles en cristal ---------------- */
const crystal = new THREE.MeshPhysicalMaterial({ color: 0xf2eeff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.25, ior: 1.5, clearcoat: 1, attenuationColor: new THREE.Color(0xc9b8ff), attenuationDistance: 2 });
const engrave = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, opacity: 0.85, color: 0xe9ddff, depthWrite: false });
const medals = [];
for (let i = 0; i < 7; i++) {
  const m = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.07, 8, 1), crystal); body.rotation.x = Math.PI / 2; body.rotation.y = Math.PI / 8; m.add(body);
  for (const z of [0.037, -0.037]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.44), engrave); e.position.z = z; if (z < 0) e.rotation.y = Math.PI; m.add(e); }
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.01), new THREE.MeshStandardMaterial({ color: PURPLE, roughness: 0.5, emissive: PURPLE_D, emissiveIntensity: 0.3 }));
  ribbon.position.y = 0.6; m.add(ribbon);
  m.position.set((i % 2 ? 1 : -1) * (1.6 + (i % 3) * 0.5), 3.4 + (i % 3) * 0.45, 6 - i * 10);
  m.userData.spin = 0.8 + (i % 3) * 0.4; m.userData.y0 = m.position.y;
  scene.add(m); medals.push(m);
}

/* ---------------- personnage 3D ---------------- */
const skin = new THREE.MeshPhysicalMaterial({ color: 0xa86f4c, roughness: 0.6, sheen: 0.25, sheenColor: new THREE.Color(0xffd1b0), clearcoat: 0.08 });
const hairMat = new THREE.MeshStandardMaterial({ color: 0x0e0906, roughness: 0.6 });
const shortsMat = new THREE.MeshStandardMaterial({ color: 0x0c0b10, roughness: 0.65 });
const sockMat = new THREE.MeshStandardMaterial({ color: 0xcfcfd6, roughness: 0.9 });
const bootMat = new THREE.MeshPhysicalMaterial({ color: 0x6d2cff, roughness: 0.3, clearcoat: 0.8 });
const soleMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.5 });
// maillot : vraie face avant du maillot Tekka + dos dégradé noir/violet
const jerseyTex = canvasTex(2048, 1024, (g, w, h, T) => {
  const paint = () => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#07060b'); gr.addColorStop(0.45, '#160b2b'); gr.addColorStop(1, '#6a2fe0');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.drawImage(jerseyImg, w * 0.27, 0, w * 0.46, h);
    // passepoils blancs sur les côtés
    g.strokeStyle = '#fff'; g.lineWidth = 10;
    for (const x of [w * 0.27, w * 0.73]) { g.beginPath(); g.moveTo(x, h * 0.25); g.lineTo(x, h); g.stroke(); }
    T.needsUpdate = true;
  };
  if (jerseyImg.complete && jerseyImg.naturalWidth) paint(); else jerseyImg.addEventListener('load', paint);
});
const jerseyMat = new THREE.MeshPhysicalMaterial({ map: jerseyTex, roughness: 0.7, sheen: 0.25, sheenColor: new THREE.Color(0x6a4bcc) });
const sleeveTex = canvasTex(256, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#08060d'); gr.addColorStop(1, '#7b35ff');
  g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#5b1fd6'; g.fillRect(0, 0, w, h * 0.16);
});
const sleeveMat = new THREE.MeshPhysicalMaterial({ map: sleeveTex, roughness: 0.7, sheen: 0.25, sheenColor: new THREE.Color(0x6a4bcc) });
const topMat = new THREE.MeshPhysicalMaterial({ color: 0x08070c, roughness: 0.6, sheen: 0.5, sheenColor: new THREE.Color(0x7b5cff) });

const M = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; return m; };
const player = new THREE.Group();
const body = new THREE.Group(); player.add(body);
const pelvis = new THREE.Group(); pelvis.position.y = 1.02; body.add(pelvis);
const chest = new THREE.Group(); pelvis.add(chest);
// torse
const torso = M(new THREE.CylinderGeometry(0.4, 0.35, 0.74, 48, 1, true), jerseyMat, 0, 0.4, 0); torso.rotation.y = Math.PI; torso.scale.z = 0.74; chest.add(torso);
const shoulders = M(new THREE.SphereGeometry(0.4, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), topMat, 0, 0.77, 0); shoulders.scale.set(1, 0.42, 0.74); chest.add(shoulders);
const belly = M(new THREE.SphereGeometry(0.35, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), shortsMat, 0, 0.03, 0); belly.scale.set(1, 0.5, 0.74); chest.add(belly);
const collar = M(new THREE.TorusGeometry(0.13, 0.03, 12, 32), topMat, 0, 0.92, 0); collar.rotation.x = Math.PI / 2; chest.add(collar);
chest.add(M(new THREE.CylinderGeometry(0.1, 0.11, 0.2, 24), skin, 0, 0.98, 0));
// tête
const head = new THREE.Group(); head.position.y = 1.38; chest.add(head);
const skull = M(new THREE.SphereGeometry(0.46, 64, 48), skin); skull.scale.set(1, 1.04, 0.97); head.add(skull);
const jaw = M(new THREE.SphereGeometry(0.36, 48, 32), skin, 0, -0.17, 0.06); jaw.scale.set(1.05, 0.8, 1); head.add(jaw);
for (const s of [-1, 1]) {
  const ear = M(new THREE.SphereGeometry(0.1, 24, 16), skin, s * 0.45, -0.02, -0.02); ear.scale.set(0.5, 1, 0.8); head.add(ear);
  const white = M(new THREE.SphereGeometry(0.085, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, clearcoat: 1 }), s * 0.16, 0.02, 0.37); white.scale.set(1, 1.15, 0.6); head.add(white);
  const iris = M(new THREE.SphereGeometry(0.052, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0x3a2312, roughness: 0.1, clearcoat: 1 }), s * 0.155, 0.01, 0.415); iris.scale.set(1, 1.1, 0.5); head.add(iris);
  const pupil = M(new THREE.SphereGeometry(0.026, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.05, clearcoat: 1 }), s * 0.155, 0.01, 0.435); pupil.scale.z = 0.4; head.add(pupil);
  const spark = M(new THREE.SphereGeometry(0.012, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), s * 0.155 - 0.02, 0.04, 0.445); head.add(spark);
  const brow = M(new THREE.CapsuleGeometry(0.022, 0.1, 6, 12), hairMat, s * 0.16, 0.15, 0.41); brow.rotation.z = Math.PI / 2 + s * 0.15; head.add(brow);
  const cheek = M(new THREE.SphereGeometry(0.07, 20, 12), new THREE.MeshStandardMaterial({ color: 0xe0866d, roughness: 0.7, transparent: true, opacity: 0.35 }), s * 0.25, -0.12, 0.37); cheek.scale.z = 0.3; head.add(cheek);
}
const nose = M(new THREE.SphereGeometry(0.06, 24, 16), skin, 0, -0.07, 0.45); nose.scale.set(1.1, 0.9, 0.8); head.add(nose);
// grand sourire
const mouthShape = new THREE.Shape(); mouthShape.moveTo(-0.14, 0); mouthShape.quadraticCurveTo(0, -0.2, 0.14, 0); mouthShape.quadraticCurveTo(0, -0.05, -0.14, 0);
const mouth = M(new THREE.ShapeGeometry(mouthShape, 24), new THREE.MeshStandardMaterial({ color: 0x5a1414, roughness: 0.6 }), 0, -0.17, 0.42); head.add(mouth);
const teethShape = new THREE.Shape(); teethShape.moveTo(-0.12, -0.012); teethShape.quadraticCurveTo(0, -0.07, 0.12, -0.012); teethShape.quadraticCurveTo(0, -0.04, -0.12, -0.012);
const teeth = M(new THREE.ShapeGeometry(teethShape, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }), 0, -0.17, 0.423); head.add(teeth);
// cheveux courts bruns ondulés (amas de boucles)
{
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const geo = new THREE.SphereGeometry(1, 16, 12);
  for (let i = 0; i < 230; i++) {
    const v = new THREE.Vector3(rnd() * 2 - 1, rnd() * 1.1 - 0.1, rnd() * 2 - 1).normalize();
    if (v.y < 0.12 && v.z > -0.2) continue;     // pas sur le visage ni les oreilles
    if (v.z > 0.55 && v.y < 0.5) continue;      // front dégagé
    if (v.y < -0.25) continue;
    const r = 0.07 + rnd() * 0.055;
    const c = M(geo, hairMat); c.scale.setScalar(r); c.position.copy(v.multiplyScalar(0.465 + rnd() * 0.04)); c.position.y += 0.03; head.add(c);
  }
}
// bras
const arms = [];
for (const s of [-1, 1]) {
  const sh = new THREE.Group(); sh.position.set(s * 0.43, 0.7, 0); chest.add(sh);
  const sleeve = M(new THREE.CylinderGeometry(0.135, 0.15, 0.34, 32), sleeveMat, 0, -0.12, 0); sh.add(sleeve);
  sh.add(M(new THREE.SphereGeometry(0.15, 24, 16), topMat, 0, 0.02, 0));
  sh.add(M(new THREE.TorusGeometry(0.135, 0.012, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, -0.29, 0).rotateX(Math.PI / 2));
  sh.add(M(new THREE.CapsuleGeometry(0.085, 0.2, 8, 16), skin, 0, -0.34, 0));
  const el = new THREE.Group(); el.position.y = -0.46; sh.add(el);
  el.add(M(new THREE.CapsuleGeometry(0.078, 0.24, 8, 16), skin, 0, -0.15, 0));
  const hand = M(new THREE.SphereGeometry(0.095, 24, 16), skin, 0, -0.34, 0); hand.scale.set(0.85, 1, 0.9); el.add(hand);
  arms.push({ sh, el, s });
}
// jambes
const legs = [];
for (const s of [-1, 1]) {
  const hip = new THREE.Group(); hip.position.set(s * 0.17, 0, 0); pelvis.add(hip);
  hip.add(M(new THREE.CylinderGeometry(0.19, 0.18, 0.32, 32), shortsMat, 0, -0.08, 0));
  hip.add(M(new THREE.BoxGeometry(0.02, 0.3, 0.06), new THREE.MeshBasicMaterial({ color: 0x9a5cff }), s * 0.185, -0.08, 0));
  hip.add(M(new THREE.CapsuleGeometry(0.105, 0.22, 8, 16), skin, 0, -0.3, 0));
  const knee = new THREE.Group(); knee.position.y = -0.46; hip.add(knee);
  knee.add(M(new THREE.CapsuleGeometry(0.095, 0.1, 8, 16), skin, 0, -0.04, 0));
  knee.add(M(new THREE.CylinderGeometry(0.1, 0.085, 0.3, 24), sockMat, 0, -0.24, 0));
  knee.add(M(new THREE.TorusGeometry(0.1, 0.012, 8, 24), new THREE.MeshBasicMaterial({ color: 0x8a4dff }), 0, -0.13, 0).rotateX(Math.PI / 2));
  const ankle = new THREE.Group(); ankle.position.y = -0.42; knee.add(ankle);
  ankle.add(M(new RoundedBoxGeometry(0.2, 0.13, 0.36, 3, 0.06), bootMat, 0, -0.02, 0.07));
  ankle.add(M(new RoundedBoxGeometry(0.21, 0.04, 0.37, 2, 0.015), soleMat, 0, -0.085, 0.07));
  ankle.add(M(new THREE.BoxGeometry(0.21, 0.02, 0.12), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0.0, 0.08));
  legs.push({ hip, knee, ankle, s });
}
player.position.set(-0.85, 0.02, 0); player.scale.setScalar(1.08);
scene.add(player);
// ombre douce de contact
const contact = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshBasicMaterial({ map: glowTex, color: 0x000000, transparent: true, opacity: 0.0, depthWrite: false }));
contact.rotation.x = -Math.PI / 2; contact.position.set(-0.85, 0.012, 0); scene.add(contact);

/* ---------------- poussière / étincelles ---------------- */
const sparkGeo = new THREE.BufferGeometry(); const SP = 260; const sp = new Float32Array(SP * 3);
for (let i = 0; i < SP; i++) { sp[i * 3] = (Math.random() * 2 - 1) * 4; sp[i * 3 + 1] = Math.random() * 6; sp[i * 3 + 2] = 10 - Math.random() * 70; }
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xc7a6ff, size: 0.05, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
scene.add(sparks);

/* ---------------- animation ---------------- */
const clock = new THREE.Clock();
let travelled = 0;
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  travelled += SPEED * dt;
  // défilement
  floorGlow.offset.y = travelled / 6; ceilTex.offset.y = travelled / 5; wallTex.offset.x = 0;
  for (const f of frames) {
    f.g.position.z += SPEED * dt;
    if (f.g.position.z > 10) { f.g.position.z -= N_PER_SIDE * GAP; assign(f); }
  }
  for (const m of medals) {
    m.position.z += SPEED * dt; m.rotation.y += m.userData.spin * dt; m.position.y = m.userData.y0 + Math.sin(t * 1.6 + m.userData.spin * 5) * 0.12;
    if (m.position.z > 9) m.position.z -= 70;
  }
  const a = sparkGeo.attributes.position.array;
  for (let i = 0; i < SP; i++) { a[i * 3 + 2] += SPEED * 1.2 * dt; if (a[i * 3 + 2] > 10) a[i * 3 + 2] -= 70; }
  sparkGeo.attributes.position.needsUpdate = true;
  // coupe
  trophy.rotation.y = Math.sin(t * 0.4) * 0.5;
  for (const r of ribbons) {
    const p = r.geometry.attributes.position, b = r.userData.base;
    for (let i = 0; i < p.count; i++) { const y = b[i * 3 + 1]; p.array[i * 3 + 2] = b[i * 3 + 2] + Math.sin(t * 3 + y * 3 + r.userData.ph) * 0.06 * -y; }
    p.needsUpdate = true; r.geometry.computeVertexNormals();
  }
  // course (cycle procédural)
  const ph = t * Math.PI * 2 * 1.55;
  for (const L of legs) {
    const p = ph + (L.s > 0 ? Math.PI : 0);
    L.hip.rotation.x = -0.85 * Math.sin(p);
    const kb = Math.max(0, Math.cos(p)); L.knee.rotation.x = 0.15 + 1.55 * kb * kb;
    L.ankle.rotation.x = -0.35 * Math.sin(p) - 0.2 * kb;
  }
  for (const A of arms) {
    const p = ph + (A.s > 0 ? 0 : Math.PI);
    A.sh.rotation.x = 0.75 * Math.sin(p); A.sh.rotation.z = A.s * 0.16;
    A.el.rotation.x = -1.35 - 0.35 * Math.sin(p);
  }
  body.position.y = 0.09 * Math.abs(Math.cos(ph)) - 0.02;
  chest.rotation.x = 0.13; chest.rotation.y = 0.14 * Math.sin(ph);
  pelvis.rotation.y = -0.1 * Math.sin(ph);
  head.rotation.x = -0.1; head.rotation.y = -0.12 * Math.sin(ph) + Math.sin(t * 0.5) * 0.08; head.rotation.z = 0.03 * Math.sin(ph);
  // caméra qui flotte légèrement
  camera.position.x = 0.55 + Math.sin(t * 0.35) * 0.35; camera.position.y = 2.05 + Math.sin(t * 0.5) * 0.08;
  camera.lookAt(camTarget);
  composer.render();
  requestAnimationFrame(animate);
}
animate();
window.__tekkaReady = true;
