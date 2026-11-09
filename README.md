# Le téléphone de sousou 🌂

Une chasse au trésor pour Nana : elle « trouve » le téléphone de sousou (une fausse page qui imite un iPhone), le fouille, reconstitue un code à 6 chiffres et compose le numéro. Un solo de piano se lance et une lettre s'écrit toute seule, au stylo plume, pendant la musique.

## Le parcours (le vrai chemin, 16 étapes)
| # | Où | Quoi | Réponse |
|---|---|---|---|
| 1 | Écran verrouillé | Balayer vers le haut. La notif « Souvenirs : 3 décembre 🍼 » donne le code | **0312** |
| 2 | Messages → « sousou (2) » (au bout de 45 s) | « le numéro, je l'ai caché… méfie-toi de mes potes… commence par mes Notes » | — |
| 3 | Notes → « code ?? » | Le numéro est dans une note verrouillée. Pour le mot de passe, il faut d'abord ouvrir Masqués, dont le code est dans le Calendrier | — |
| 4 | Calendrier → le 7 du mois → « 🙈 Masqués » | « le code de l'album, c'est l'heure de cet événement » : 07:07 | — |
| 5 | Galerie → Utilitaires → Masqués | Code de l'album | **0707** |
| 6 | Masqués → la capture | « le mot de passe ? Shams le connaît. Il le donne pas à n'importe qui. » | — |
| 7 | WhatsApp → Shams (en privé) | Il demande le prénom de son chat. Elle répond | **Haki** |
| 8 | Toujours Shams | « le mot de passe, c'est le titre du premier générique de NANA. Vérifie dans sa playlist » | — |
| 9 | Spotify → « Rose » | Confirme : « générique d'ouverture n°1 de NANA » | — |
| 10 | Notes → Notes verrouillées | Mot de passe | **rose** |
| 11 | Note « le numéro 🌂 » | Énigme : ce que je devais te faire goûter (preuve dans Messages) + la porte des deux Nana (à gratter dans Contacts) | — |
| 12 | Messages → « 129 🥙 » | Le ticket du grec | **129** |
| 13 | Contacts → Nana 🌂 → gratter le ███ | La porte des deux Nana | **707** |
| 14 | Téléphone → Clavier → appeler, puis décrocher | sousou : « … va voir dans mes Notes 🌂 » | **129707** |
| 15 | Notes → « pour toi 🤍 » | Dernière question : « à part le 129, qu'est-ce qu'on doit goûter ensemble ? » | **kinder** |
| 16 | La note | La lettre + le solo en pièce jointe audio, puis secouer le téléphone (ou double-taper) pour des cœurs | 🤍 |

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
| Masqués `0312` | réflexe | « Pas le même code que le téléphone, faut pas abuser 😏 » |
| Masqués `4321` | faux événement « 🔢 code : 4321 » du Calendrier (le 21) | « T'as vraiment cru que je notais mes codes ? 😭 » |
| Shams : un autre prénom | — | « c'est pas son nom ça 😂 ». Au bout de 3 essais : « un pouvoir dans One Piece 👀 » |
| note secrète `129` / `grec` / `rose` / `haki` | — | « À part le 129, j'ai dit 😭 », « On va pas goûter ton chat 😭 »… |

## Les effets
- **Des cœurs** apparaissent au déverrouillage, à chaque code ou mot de passe trouvé, quand Shams valide, quand elle gratte la fiche et à l'ouverture de la note secrète.
- **Double-taper n'importe où** fait aussi des cœurs.
- **Secouer le téléphone** fait une pluie de cœurs. Il faut que le site soit hébergé soi-même : sur iPhone, Safari demande l'autorisation au premier toucher. Sur la page Claude, le capteur est bloqué, donc il reste le double-tap.
- **Gratter** le ███ de la fiche de Nana révèle 707.

## Ce que tu peux changer : `config.js`
| Réglage | Rôle |
|---|---|
| `hiddenCode` | le code de l'album Masqués (par défaut `0707`) |
| `catName` | la réponse à la question de Shams (par défaut `haki`) |
| `secretAnswer` | la réponse pour ouvrir « pour toi 🤍 » (par défaut `kinder` : ce qu'on doit goûter ensemble à part le 129) |
| `lockCode` | le code de déverrouillage du téléphone (par défaut `0312`) |
| `notesPassword` | le mot de passe de la note verrouillée (par défaut `rose`) |
| `hiddenVideos` | les vidéos de l'album Masqués (mets ta vidéo ici) |
| `code` | le code à composer (par défaut `129707`) |
| `finaleOpensAt` | l'appel ne marche qu'à partir de cette date et heure (pour que ça dure jusqu'à 24 h) |
| `startDate` | le jour J, utilisé par le Calendrier |
| `insta`, `snap`, `x` | tes comptes : ils apparaissent dans le groupe WhatsApp et dans le Calendrier |
| `youtubeUrl` | le lien de la vidéo non répertoriée du solo (sinon : « vidéo privée ») |
| `letter` | la lettre : lieu, « Nana, », les paragraphes et la signature |

## Le piano
`tools/compose_piano.py` compose et synthétise le solo. C'est une mélodie originale en la mineur, avec deux motifs cachés :
- **N‑A‑N‑A → sol la sol la**
- **S‑O‑U‑S‑O‑U → mi la sol mi la sol**

Ce code musical est expliqué dans la note « piano ». 

## Écriture
Les polices manuscrites sont Parisienne (le corps de la lettre) et Pinyon Script (« Nana, » et la signature). Elles sont sous licence OFL, rangées dans `fonts/`, et intégrées dans la page au moment de l'assemblage.

## Photos et vidéos
Les photos, les vidéos et `piano.mp3` sont dans `media/` (miniatures dans `media/thumb/`).

## Mettre en ligne (GitHub Pages)
À chaque push sur `main`, le site est publié automatiquement par `.github/workflows/pages.yml`.
Il faut l'activer une fois : **Settings → Pages → Source : GitHub Actions**.
Adresse : https://mohamedalexis22-cmd.github.io/T-l-phone-sousou/

## Lancer en local
```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000.

`python3 tools/build_artifact.py` assemble une page unique (CSS et JS intégrés) dans `dist/artifact.html`.
