# Le téléphone de sousou 🌂

Une chasse au trésor pour Nana : elle « trouve » le téléphone de sousou (une fausse page qui imite un iPhone), le fouille, reconstitue un code à 6 chiffres et compose le numéro. Un solo de piano se lance et un texte s'écrit ligne par ligne, en même temps que la musique.

## Le parcours (le vrai chemin)
1. **Écran verrouillé.** Une notif « Souvenirs : 3 décembre 🍼 » donne le code. Elle balaie vers le haut et tape **0312**. Après 3 erreurs, un indice s'affiche. Le bouton Face ID la trolle.
2. **WhatsApp « projet nana 🌂 ».** Les potes lâchent des indices. **La plupart mentent.** Seul Shams dit vrai : « le premier générique 🎤 ».
3. **Message de « sousou (2) »** au bout de 45 s : « le numéro, je l'ai caché. Méfie-toi de mes potes. »
4. **Note « code ?? ».** Le numéro est dans une note verrouillée, et le mot de passe est « rangé avec les photos que personne doit voir ».
5. **Galerie → Masqués 🔒** (même code 0312). On y trouve la capture « Nom : Rose / ID : RRSDY2 » et les vidéos cachées.
6. **Notes → Notes verrouillées → mot de passe `rose`** (« Rose » est le premier générique de NANA). La note donne l'énigme : ce que je devais te faire goûter (129), puis la porte des deux Nana (707).
7. **Téléphone → Clavier → `129707`.** Elle décroche l'appel, puis le piano joue et le texte s'écrit.

## Les fausses pistes
| Piège | Où | Ce qui se passe |
|---|---|---|
| `66 66 66` | Amaruuu, dans le groupe | appel de CJ : « Ah shit, here we go again… t'as écouté Amaruuu 😭 » |
| `424 242` | note supprimée « VRAI CODE » (Gros loup dit l'avoir vue) | Gros loup : « J'ai menti. Désolé pas désolé » |
| mot de passe `kinder` | note supprimée « mdp notes » | « Mdr non. Trop facile 🍫 » |
| mot de passe `nana` | Dadoum, dans le groupe | « Dadoum t'a menti 😭 » |
| mot de passe `rrsdy2` | la capture dans Masqués | « Ça c'est un identifiant, pas un mot de passe 😏 » |
| `70 71 29` | contact « numéro secret 🤫 » | « Raté. Ce contact ment, comme les potes de sousou. » |
| `129129`, `707707`, `0312` | erreurs logiques | réponses dédiées (le 129 qui décroche, Shams, « c'est le code du tel ») |

## Ce que tu peux changer : `config.js`
| Réglage | Rôle |
|---|---|
| `lockCode` | le code de déverrouillage, qui ouvre aussi l'album Masqués (par défaut `0312`) |
| `notesPassword` | le mot de passe de la note verrouillée (par défaut `rose`) |
| `hiddenVideos` | les vidéos de l'album Masqués (mets ta vidéo ici) |
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
