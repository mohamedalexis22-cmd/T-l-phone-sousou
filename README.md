# Le téléphone de sousou 🌂

Une chasse au trésor pour Nana : elle « trouve » le téléphone de sousou (une fausse page qui imite un iPhone), le fouille, reconstitue un code à 6 chiffres et compose le numéro. Un solo de piano se lance et un texte s'écrit ligne par ligne, en même temps que la musique.

## Le parcours
1. **Écran verrouillé** : elle balaie vers le haut pour ouvrir.
2. **7 s plus tard** : une notif WhatsApp, « Vous avez été ajouté au groupe « projet nana 🌂 » ». Les potes y parlent du plan et lâchent des indices.
3. **45 s plus tard** : un message de « sousou (2) » donne la règle. Six chiffres : les 3 premiers sont un truc qu'on devait manger ensemble, les 3 derniers la porte derrière laquelle vivent les deux Nana.
4. **Les indices** :
   - Notes « choses à faire avec nana » : *le 129 (c'est un grec)*.
   - Fiche contact de Nana : la porte n° ███ (707, l'appart de l'anime).
   - Notes « code ?? » et groupe WhatsApp.
5. **Téléphone → Clavier → `129707`**. L'appel entrant arrive et elle décroche. Le piano joue et le texte s'écrit.
6. Après l'appel, le titre « solo pour nana » se débloque dans Spotify.

Après 3 mauvais numéros, un indice s'affiche.

## Ce que tu peux changer : `config.js`
| Réglage | Rôle |
|---|---|
| `code` | le code à composer (par défaut `129707`) |
| `finaleOpensAt` | l'appel ne marche qu'à partir de cette date et heure (pour que ça dure jusqu'à 24 h) |
| `startDate` | le jour J, utilisé par le Calendrier |
| `insta`, `snap`, `x` | tes comptes : ils apparaissent dans le groupe WhatsApp et dans le Calendrier |
| `youtubeUrl` | le lien de la vidéo non répertoriée du solo (sinon : « vidéo privée ») |
| `text` | le texte final, 16 lignes, une par phrase de piano |

## Le piano
`tools/compose_piano.py` compose et synthétise le solo. C'est une mélodie originale en la mineur, avec deux motifs cachés :
- **N‑A‑N‑A → sol la sol la**
- **S‑O‑U‑S‑O‑U → mi la sol mi la sol**

Ce code musical est expliqué dans la note « piano ». Le script produit aussi `piano-timings.json`, qui donne le début de chaque phrase (champ `timings` dans `config.js`).

## Photos et vidéos
Le dossier `media/` (photos, vidéos, `piano.mp3`) **n'est pas dans le repo**, parce que le repo est public. Il contient :
`wallpaper.jpg`, `p-voiture.jpg`, `p-profil.jpg`, `p-equipe.jpg`, `p-cj.jpg`, `p-costard.jpg`, `p-bebe.jpg`, `p-maman.jpg`, `p-kais.jpg`, `v1.mp4` … `v7.mp4`, `piano.mp3`, plus des miniatures de 360 px dans `media/thumb/`.

## Lancer en local
```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000.

`python3 tools/build_artifact.py` assemble une page unique (CSS et JS intégrés) dans `dist/artifact.html`.
