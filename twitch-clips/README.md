# Clips Twitch Tekka

Génère des clips verticaux dynamiques à partir des VODs de twitch.tv/teekkaa_.

- `transcribe.py AUDIO OUT.json` : transcription Whisper (mots horodatés).
- `render.py SPEC.json` : monte un clip (coupes des blancs, zooms, sous-titres mot par mot,
  bandeau violet #7B2CFF, logo Tekka, pop-ups, effets sonores earshot, écran de fin).

Exemple de spec :

```json
{"vod": "live.mp4", "transcript": "transcript.json", "start": 1200, "end": 1245,
 "title": ["T'ES UN MENTEUR", "C'EST TOI QUI VAS GÉRER !"], "out": "clip.mp4"}
```

Télécharger une VOD : `yt-dlp --downloader native -f 1080p https://www.twitch.tv/videos/ID`
