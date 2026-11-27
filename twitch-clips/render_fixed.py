#!/usr/bin/env python3
"""Render reviewed clips: trims + spelling fixes from fixes_clips.json.  --dry prints captions only."""
import json, os, re, sys
import render

CL = json.load(open('clips.json'))
FX = json.load(open('fixes_clips.json'))
GF = json.load(open('fixes_global.json'))
OUT = '/home/user/T-l-phone-sousou/twitch-clips/output/live_2941651036_v2'
dry = '--dry' in sys.argv
only = [a for a in sys.argv[1:] if not a.startswith('--')]


def merge(words):
    m = []
    for w in words:
        raw = w['w']
        if m and raw and (re.fullmatch(r'\s*[.,!?…;:]+\s*', raw) or (not raw.startswith(' ') and w['s'] - m[-1]['e'] < 0.3)):
            m[-1] = dict(m[-1], w=m[-1]['w'] + raw, e=w['e'])
        else:
            m.append(dict(w))
    return m


def find(words, phrase, last=False):
    o = [x for x in (render._norm(t) for t in phrase.split()) if x]
    n = [render._norm(w['w']) for w in words]
    for i in range(len(n) - len(o) + 1):
        if n[i:i + len(o)] == o:
            return words[i + len(o) - 1]['e'] if last else words[i]['s']
    raise SystemExit(f'phrase not found: {phrase}')


os.makedirs(OUT, exist_ok=True)
for i, c in enumerate(CL['clips'], 1):
    key = f"{i:02d}_{c['slug']}"
    if key not in FX or (only and key not in only):
        continue
    f = FX[key]
    tr = os.path.join(CL['outdir'], key + '.json')
    words = merge([w for s in json.load(open(tr)) for w in s['words']])
    start = find(words, f['start_at']) - 0.15 if 'start_at' in f else c['start']
    end = find(words, f['end_after'], last=True) + 0.12 if 'end_after' in f else c['end']
    fixes = GF + f.get('fixes', [])
    if dry:
        ws = [w for w in words if w['s'] >= start and w['e'] <= end]
        ws = render.apply_fixes([dict(w) for w in ws], fixes)
        print(f'=== {key} ({end - start:.0f}s) {f["title"]}')
        print(' '.join(w['w'].strip() for w in ws), '\n')
        continue
    spec = {'vod': CL['vod'], 'transcript': tr, 'start': start, 'end': end, 'title': f['title'],
            'fixes': f.get('fixes', []), 'out': os.path.join(OUT, key + '.mp4')}
    sp = os.path.join(OUT, key + '.spec.json'); json.dump(spec, open(sp, 'w'), ensure_ascii=False)
    render.main(sp)
    print('DONE', spec['out'], flush=True)
