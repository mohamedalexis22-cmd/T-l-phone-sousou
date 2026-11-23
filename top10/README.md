# TOPSIDE — studio des écrans Top 10

Deux écrans, dans le style de l'émission (ardoise noire, papier, scotch et surligneur lila, photos polaroid) :

1. **La carte joueur** : elle s'affiche par-dessus la caméra plein cadre pendant que vous présentez votre choix. On y voit le rang, la photo, le nom, le poste, la nationalité, les clubs, 4 stats et votre argument, avec le tampon « Choix de… ».
2. **Le récap** : les deux classements côte à côte à la fin. Les joueurs présents dans les deux tops sont surlignés.

![Aperçu](apercu.jpg)

## Remplir son top 10

Ouvrez le studio (`index.html`, ou la page en ligne).

1. **Réglages** : vos prénoms, le côté de la carte (gauche ou droite), le fond (caméra ou fond vert).
2. **Les 4 stats** : écrivez ce que vous voulez afficher (« Matchs », « Matchs capitaine », « Trophées »…). Cochez celle à surligner en lila.
3. **Votre top** : cliquez sur l'onglet de votre prénom, puis pour chaque rang tapez le nom du joueur et choisissez-le dans la liste. La photo, le poste et les clubs arrivent tout seuls. Remplissez vos chiffres et, si vous voulez, un argument.
   - Joueur absent de la liste : écrivez son nom quand même, puis ajoutez une photo avec « Photo perso ».
   - « Cacher ce top » floute votre liste, pour que l'autre ne la voie pas.

Tout est enregistré **dans votre navigateur, sur votre appareil**. Rien n'est envoyé ailleurs. Pour passer sur un autre ordinateur, utilisez « Télécharger la sauvegarde » puis « Ouvrir une sauvegarde ».

## Mettre la carte dans la vidéo

**Le plus simple : enregistrer l'écran avec le fond vert.**
1. Dans Réglages, choisissez **Fond vert**.
2. Cliquez **Plein écran**, lancez votre enregistrement d'écran, puis cliquez sur l'image pour rejouer l'animation. Les flèches ← → passent au joueur suivant.
3. Au montage (CapCut, Premiere, Final Cut…), posez l'enregistrement au-dessus de votre caméra et appliquez **Incrustation chromatique** (chroma key) sur le vert.

**En clips vidéo transparents** (pour quelqu'un à l'aise avec un terminal) :

```bash
node tools/export.js topside-sauvegarde.json
```

Ça crée dans `export/` un `.mov` transparent par carte et un `.mp4` du récap. Il faut Node.js, Playwright et ffmpeg.

## Banque de joueurs

Plusieurs centaines de joueurs sont déjà importés depuis Transfermarkt : photo, poste, nationalité, date de naissance, clubs, sélections et buts en sélection. Pour en ajouter (il faut Node.js 18 ou plus récent) :

```bash
node tools/transfermarkt.js "Nom du joueur" "Autre joueur"
```

Si la recherche tombe sur un homonyme, donnez le lien du profil Transfermarkt à la place du nom. Transfermarkt bloque si on enchaîne trop vite : l'outil attend 4 secondes entre deux joueurs.

## Changer le logo, le nom, les couleurs

- Nom de l'émission, logo et réseaux : `da/marque.js`. Le logo est le fichier `assets/logo.png`.
- Couleurs et typos : `da/kit.css` (`--lila`, `--papier`, `--ardoise`…).

## Fichiers

```
top10/
  index.html                     le studio
  scene.html                     l'écran 1920×1080 (affiché dans le studio)
  da/                            charte : couleurs, typos, animations, logo
  js/kit.js                      dessin des deux écrans
  data/joueurs.js                fiches saisies à la main (prioritaires)
  data/joueurs-transfermarkt.js  fiches importées
  data/demo.js                   l'exemple du premier lancement
  assets/joueurs/                photos
  tools/transfermarkt.js         import Transfermarkt
  tools/export.js                export vidéo
```

Polices embarquées : Anton, Permanent Marker, Inter et JetBrains Mono (licences libres, dans `fonts/`).
