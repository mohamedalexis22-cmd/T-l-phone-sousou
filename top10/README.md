# Kit graphique Top 10 foot

Une charte graphique complète et réutilisable pour **tous** vos Top 10 : noir et blanc, touche lila, des écrans animés en 1920×1080, une banque de joueurs et une régie pour piloter le tournage.

![Aperçu](apercu.jpg)

## Ce qu'il y a dedans

| Écran | Quand | Type |
|---|---|---|
| Générique | ouverture de la vidéo | plein écran |
| Parties 1 à 5 | séparateurs (Journée, Objectifs, Mentions, Top 10, Récap) | plein écran |
| Nom à l'écran | présentation de chaque animateur | incrustation (transparente) |
| Objectifs de la semaine | pendant la caméra plein cadre | incrustation (transparente) |
| Mentions honorables | 2–3 joueurs qui auraient pu y être | plein écran |
| « Montre sa tablette » | quand un animateur révèle son choix | incrustation (transparente) |
| Fiche joueur | n°, poste, nation, clubs, 4 stats animées, argument | plein écran |
| Duo | les choix de chacun au même rang (« Même choix ! » si identiques) | plein écran |
| Récap | le classement complet de chacun, joueurs en commun en lila | plein écran |
| Fin | appel à commenter + s'abonner | plein écran |

Le déroulé suit l'ordre de la vidéo : journée → objectifs → mentions → top 10 (du 10 au 1, chacun son tour) → récap → fin.

## Utilisation

1. **Ouvrir la régie** : double-cliquez `top10/index.html` (aucune installation, marche hors connexion).
   Cliquez une étape ou utilisez `→` / `←` / `R` (rejouer). La colonne de gauche signale les places vides, les joueurs hors banque, les stats manquantes et les fiches non vérifiées.
2. **En direct / OBS** : ajoutez une source *Navigateur* → fichier local `top10/scene.html?ep=NOM`, taille 1920×1080. Les incrustations ont un fond transparent.
3. **Pour le montage** : exportez les clips (voir plus bas).

## Préparer un nouvel épisode

1. Copiez `data/episodes/_modele.js` → `data/episodes/mon-theme.js`, et remplacez `EPISODES._modele` par `EPISODES["mon-theme"]`.
2. Ajoutez `"mon-theme"` dans `data/episodes/liste.js`.
3. Remplissez : titre, animateurs, objectifs, les 4 `stats` à afficher, les mentions, les classements (index 0 = n°1), les arguments.

Les stats propres à un thème (ex. matchs comme capitaine) se mettent soit dans la fiche du joueur, soit dans `statsEpisode` de l'épisode. Exemple pour un thème capitaines :

```js
stats: [
  { cle: "matchs" },
  { cle: "matchsCapitaine", accent: true },
  { cle: "selectionsCapitaine" },
  { cle: "tropheesCapitaine" },
],
statsEpisode: { maldini: { matchsCapitaine: 0 /* le chiffre trouvé */ } },
```

Un joueur absent de la banque peut être écrit en toutes lettres dans un classement (`"Pavel Nedvěd"`) : sa fiche s'affiche sans stats.

## Banque de joueurs

`data/joueurs.js` est commun à tous les épisodes : un joueur ajouté une fois sert pour tous les Top 10. Chaque fiche a un `source` (d'où viennent les chiffres) et un `verifie` (passez à `true` une fois vérifié).

> ⚠ Les 11 fiches fournies sont des exemples saisis de mémoire, **non vérifiés**. Contrôlez les chiffres avant de les utiliser à l'écran.

**Photos** : déposez un PNG détouré dans `assets/joueurs/` et indiquez `photo: "assets/joueurs/zidane.png"`. Il passe automatiquement en noir et blanc avec un voile lila. Sans photo, les initiales s'affichent.

## Changer le logo et le nom

Tout est dans `da/marque.js` : nom, signature, réseaux, chemin du logo. Pour le logo, remplacez simplement `assets/logo.svg` (ou indiquez un PNG transparent).
Les couleurs et typos sont dans `da/kit.css` (`--lila`, `--noir`, `--blanc`…).

## Exporter les clips pour le montage

Il faut Node.js, Playwright et ffmpeg.

```bash
node tools/export.js mon-theme
```

Les fichiers arrivent dans `top10/export/mon-theme/` :
- `.mp4` pour les écrans plein écran ;
- `.mov` (ProRes 4444) **avec transparence** pour les incrustations, à poser au-dessus de la caméra ;
- `.png` : l'image finale de chaque étape.

Options : `--png` (images seules, rapide), `--etapes 0,10-14` (seulement certaines étapes), `--fps 60`.

## Fichiers

```
top10/
  index.html            régie
  scene.html            scène 1920×1080 (OBS / plein écran)
  da/marque.js          nom, logo, réseaux
  da/kit.css            charte (couleurs, typos, animations)
  data/joueurs.js       banque de joueurs
  data/episodes/        un fichier par Top 10
  js/kit.js             moteur des écrans
  tools/export.js       export vidéo
```

Polices embarquées : Anton, Inter et JetBrains Mono (licence SIL OFL, dans `fonts/`).
