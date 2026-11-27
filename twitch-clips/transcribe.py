import json, sys, time
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]
m = WhisperModel('small', device='cpu', compute_type='int8')
t = time.time()
segs, info = m.transcribe(src, language='fr', beam_size=1, word_timestamps=True, vad_filter=True)
res = []
for s in segs:
    res.append({'start': s.start, 'end': s.end, 'text': s.text,
                'words': [{'s': w.start, 'e': w.end, 'w': w.word} for w in (s.words or [])]})
    if len(res) % 50 == 0:
        print(f'{s.end:.0f}s done, {time.time()-t:.0f}s elapsed', flush=True)
json.dump(res, open(out, 'w'), ensure_ascii=False)
print('FINISHED', len(res), 'segments')
