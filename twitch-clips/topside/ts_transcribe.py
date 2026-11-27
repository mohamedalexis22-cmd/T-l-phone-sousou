#!/usr/bin/env python3
"""Re-transcribe each clip window with Whisper medium + a vocabulary prompt (no render)."""
import json, os, subprocess, sys
from faster_whisper import WhisperModel

PROMPT = ("TOPSIDE de Tekka, top 10 des meilleurs capitaines de l'histoire du foot. Wallah, wesh, frérot, "
          "Godín, Totti, De Bruyne, Mahrez, Algérie, CAN, Lahm, Benzema, Zlatan, Chiellini, Bonucci, Barzagli, Marcelo, Raúl, Puyol, Messi, Ronaldo, CR7, Kompany, Marquinhos, Buffon, Ramos, Piqué, Matip, Van Dijk, Fabinho, "
          "Thiago Silva, Modrić, Rakitić, Iniesta, Xavi, Busquets, Maradona, Otamendi, Romero, Molina, Tagliafico, Di María, "
          "Rodrygo, Vinícius, Nacho, Cavani, João Neves, Vitinha, Hakimi, Pogba, Neuer, Courtois.")
clips = json.load(open(sys.argv[1]))
vod, outdir = clips['vod'], clips['outdir']
os.makedirs(outdir, exist_ok=True)
model = WhisperModel('medium', device='cpu', compute_type='int8')
for i, c in enumerate(clips['clips'], 1):
    if c.get('skip'):
        continue
    trp = os.path.join(outdir, f"{i:02d}_{c['slug']}.json")
    if os.path.exists(trp):
        continue
    wav = f'/tmp/clip_{i}.wav'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(c['start']), '-to', str(c['end']),
                    '-i', vod, '-vn', '-ac', '1', '-ar', '16000', wav], check=True)
    segs, _ = model.transcribe(wav, language='fr', word_timestamps=True, vad_filter=False,
                               beam_size=5, initial_prompt=PROMPT)
    tr = [{'start': s.start + c['start'], 'end': s.end + c['start'], 'text': s.text,
           'words': [{'s': w.start + c['start'], 'e': w.end + c['start'], 'w': w.word} for w in s.words]}
          for s in segs]
    json.dump(tr, open(trp, 'w'), ensure_ascii=False)
    print('TRANSCRIBED', i, c['slug'], flush=True)
print('ALL TRANSCRIBED')
