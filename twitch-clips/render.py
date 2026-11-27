#!/usr/bin/env python3
"""Tekka clip renderer: VOD + time range + title -> dynamic vertical clip.

Style: split vertical 1080x1920, purple (#7B2CFF / #2A0A5E) title banner with
progress bar, Tekka logo, twitch pill, word-by-word captions, jump cuts on
silences, alternating punch-in zooms, SFX, popups and a logo outro.

usage: render.py spec.json
spec = {"vod": ..., "transcript": ..., "start": s, "end": e,
        "title": ["LINE 1", "LINE 2"], "out": "clip.mp4"}
"""
import json, os, subprocess, sys, tempfile, random
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
PURPLE, PURPLE_D, WHITE = (123, 44, 255), (42, 10, 94), (255, 255, 255)
ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
FONT_BLACK = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
FONT_XB = '/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'
PANEL_H = 960          # each half
BANNER_Y = 830         # banner sits across the seam
CAP_Y = 1520           # captions baseline area (bottom panel)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.stderr.write(r.stderr[-3000:])
        raise SystemExit(f'failed: {cmd[:6]}')
    return r.stdout


def A(p):
    return os.path.join(ASSETS, p)


# ---------------------------------------------------------------- timeline
def speech_segments(words, start, end, gap=0.9, pre=0.15, post=0.3, max_len=4.5):
    ws = [w for w in words if w['s'] >= start and w['e'] <= end]
    if not ws:
        return [(start, end)], []
    segs, cur = [], [ws[0]['s'] - pre, ws[0]['e'] + post]
    for w in ws[1:]:
        if w['s'] - pre <= cur[1] + gap - post:
            cur[1] = w['e'] + post
        else:
            segs.append(cur); cur = [w['s'] - pre, w['e'] + post]
    segs.append(cur)
    segs = [(max(start, a), min(end, b)) for a, b in segs if b - a > 0.25]
    # split long segments at word boundaries so the camera can change
    out = []
    for a, b in segs:
        inner = [w for w in ws if w['s'] >= a and w['e'] <= b]
        cut = a
        for w in inner:
            if w['e'] - cut > max_len and b - w['e'] > 1.2:
                out.append((cut, w['e'])); cut = w['e']
        out.append((cut, b))
    return out, ws


def remap(t, segs):
    acc = 0.0
    for seg in segs:
        a, b = seg[0], seg[1]
        real = seg[2] if len(seg) > 2 else b - a
        if t < a:
            return acc
        if t <= b:
            return acc + min(t - a, real)
        acc += real
    return acc


def probe_dur(p):
    return float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).strip())


# ---------------------------------------------------------------- scenes
def scene_kind(vod, t):
    """'screen' (tier list / browser), 'room' (full room cam) or 'match' (broadcast + cam overlay)."""
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{t:.2f}', '-i', vod, '-frames:v', '1',
                          '-vf', 'scale=192:108', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True).stdout
    if len(raw) < 192 * 108 * 3:
        return 'room'
    px = lambda x, y: raw[(y * 192 + x) * 3:(y * 192 + x) * 3 + 3]
    strip = [sum(px(x, y)) / 3 for y in range(0, 3) for x in range(0, 120)]
    if sum(strip) / len(strip) > 150:
        return 'screen'
    reg = [px(x, y) for y in range(45, 108, 3) for x in range(0, 120, 3)]
    r = sum(p[0] for p in reg) / len(reg); g = sum(p[1] for p in reg) / len(reg); b = sum(p[2] for p in reg) / len(reg)
    return 'room' if (b > g + 12 and (r + g + b) / 3 < 120) else 'match'


CFG = {'pill': ['EN LIVE TOUS LES SOIRS À PARTIR DE 21H', 'twitch.tv/teekkaa_'],
       'outro': ['EN LIVE TOUS LES SOIRS', 'À PARTIR DE 21H', 'twitch.tv/teekkaa_'],
       'kind': None, 'cam_top': [690, 620], 'cam_bot': [1300, 1380], 'cam_cy': 600}


def panel_filters(kind, variant):
    """Return (top, bottom) crop filters for a 1920x1080 source -> 1080x960 each."""
    z_top, z_bot = (1.0, 1.18) if variant % 2 == 0 else (1.18, 1.0)
    if kind == 'screen':
        # top: the shared screen (left of the cam overlay); bottom: the cam overlay
        cw, ch = 1215 / z_top, 1080 / z_top
        top = f"crop={cw:.0f}:{ch:.0f}:{max(0, 640 - cw / 2):.0f}:{(1080 - ch) / 2:.0f}"
        cw2 = 400 / z_bot; ch2 = cw2 / 1.125
        bot = f"crop={cw2:.0f}:{ch2:.0f}:{1605 - cw2 / 2:.0f}:{max(0, 177 - ch2 / 2):.0f}"
    elif kind == 'match':
        # reactions only (no broadcast footage): two crops of the cam overlay
        def ov(cx, z):
            cw = 400 / z; ch = cw / 1.125
            x = min(max(1290, cx - cw / 2), 1920 - cw)
            return f"crop={cw:.0f}:{ch:.0f}:{x:.0f}:{max(0, 190 - ch / 2):.0f}"
        top = ov([1480, 1500][variant % 2], z_top)
        bot = ov([1730, 1710][variant % 2], z_bot)
    else:
        def cam(cx, cy, z):
            cw, ch = 1080 / z, 960 / z
            x = min(max(0, cx - cw / 2), 1920 - cw); y = min(max(0, cy - ch / 2), 1080 - ch)
            return f"crop={cw:.0f}:{ch:.0f}:{x:.0f}:{y:.0f}"
        cy = CFG['cam_cy']
        top = cam(CFG['cam_top'][variant % 2], cy if z_top == 1.0 else cy + 30, z_top)
        bot = cam(CFG['cam_bot'][variant % 2], cy if z_bot == 1.0 else cy + 30, z_bot)
    sc = f"scale={W}:{PANEL_H}:flags=lanczos,setsar=1"
    return f"{top},{sc}", f"{bot},{sc}"


def render_segment(vod, a, b, kind, variant, out):
    top, bot = panel_filters(kind, variant)
    fc = (f"[0:v]fps={FPS},split[a][b];[a]{top}[t];[b]{bot}[u];[t][u]vstack,format=yuv420p[v];"
          f"[0:a]aresample=48000,aformat=channel_layouts=stereo[au]")
    run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{a:.3f}', '-to', f'{b:.3f}', '-i', vod,
         '-filter_complex', fc, '-map', '[v]', '-map', '[au]',
         '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-c:a', 'aac', '-b:a', '192k', out])


# ---------------------------------------------------------------- graphics
def rounded(draw, box, r, fill, outline=None, width=0):
    draw.rounded_rectangle(box, r, fill=fill, outline=outline, width=width)


def fit_font(path, text, max_w, size):
    while size > 20:
        f = ImageFont.truetype(path, size)
        if f.getlength(text) <= max_w:
            return f
        size -= 2
    return ImageFont.truetype(path, size)


def make_overlay(title, path):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # banner
    bx0, bx1, by0, by1 = 60, W - 60, BANNER_Y, BANNER_Y + 230
    rounded(d, (bx0 + 6, by0 + 8, bx1 + 6, by1 + 8), 22, (0, 0, 0, 110))
    rounded(d, (bx0, by0, bx1, by1), 22, PURPLE + (255,), outline=WHITE + (255,), width=5)
    l1, l2 = title[0].upper(), (title[1].upper() if len(title) > 1 else '')
    f1 = fit_font(FONT_BLACK, l1, bx1 - bx0 - 70, 54)
    d.text((W / 2, by0 + 62), l1, font=f1, fill=WHITE, anchor='mm')
    if l2:
        f2 = fit_font(FONT_BLACK, l2, bx1 - bx0 - 140, 46)
        tw = f2.getlength(l2)
        rounded(d, (W / 2 - tw / 2 - 26, by0 + 100, W / 2 + tw / 2 + 26, by0 + 160), 30, WHITE + (255,))
        d.text((W / 2, by0 + 131), l2, font=f2, fill=PURPLE_D, anchor='mm')
    # progress track
    d.rounded_rectangle((bx0 + 40, by1 - 40, bx1 - 40, by1 - 32), 4, fill=(255, 255, 255, 170))
    # logo top-left
    logo = Image.open(A('logo_white.png')).resize((190, 190), Image.LANCZOS)
    shadow = Image.new('RGBA', logo.size, (0, 0, 0, 0)); shadow.putalpha(logo.getchannel('A').point(lambda v: v * 0.5))
    im.alpha_composite(shadow, (34, 44)); im.alpha_composite(logo, (30, 40))
    # twitch pill bottom: live schedule + channel
    f1 = ImageFont.truetype(FONT_BLACK, 34)
    f2 = ImageFont.truetype(FONT_XB, 32)
    l1, l2 = CFG['pill']
    tw = max(f1.getlength(l1) + 40, f2.getlength(l2))
    px0 = W / 2 - tw / 2 - 40; px1 = W / 2 + tw / 2 + 40
    py0, py1 = H - 214, H - 96
    rounded(d, (px0 + 5, py0 + 7, px1 + 5, py1 + 7), 30, (0, 0, 0, 110))
    rounded(d, (px0, py0, px1, py1), 30, WHITE + (255,))
    lx = W / 2 - (f1.getlength(l1) + 40) / 2
    d.ellipse((lx, py0 + 26, lx + 24, py0 + 50), fill=(255, 59, 92))
    d.text((lx + 40, py0 + 38), l1, font=f1, fill=PURPLE, anchor='lm')
    d.text((W / 2, py0 + 86), l2, font=f2, fill=PURPLE_D, anchor='mm')
    im.save(path)
    return (bx0 + 40, bx1 - 40, by1 - 36)


def make_dot(path):
    im = Image.new('RGBA', (34, 34), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((2, 2, 32, 32), fill=WHITE, outline=PURPLE_D, width=4)
    im.save(path)


def make_popup(text, path, color=(255, 59, 92)):
    f = ImageFont.truetype(FONT_BLACK, 46)
    tw = f.getlength(text)
    im = Image.new('RGBA', (int(tw + 120), 110), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    rounded(d, (6, 10, im.width - 2, im.height - 2), 40, (0, 0, 0, 120))
    rounded(d, (0, 0, im.width - 8, im.height - 12), 40, color + (255,), outline=WHITE + (255,), width=4)
    d.text(((im.width - 8) / 2, (im.height - 12) / 2), text, font=f, fill=WHITE, anchor='mm')
    im.save(path)
    return im.size


def make_outro(path):
    import numpy as np
    yy, xx = np.mgrid[0:H, 0:W]
    r = np.sqrt((xx - W / 2) ** 2 + ((yy - H / 2 + 120) * 0.8) ** 2) / 1000
    k = np.clip(1 - r, 0, 1)[..., None] ** 1.6
    rgb = np.array(PURPLE_D) * (1 - k) + np.array(PURPLE) * k
    im = Image.fromarray(rgb.astype('uint8'), 'RGB').convert('RGBA')
    d = ImageDraw.Draw(im)
    logo = Image.open(A('logo_white.png')).resize((620, 620), Image.LANCZOS)
    im.alpha_composite(logo, ((W - 620) // 2, (H - 620) // 2 - 120))
    f = ImageFont.truetype(FONT_BLACK, 58)
    d.text((W / 2, H / 2 + 320), CFG['outro'][0], font=f, fill=WHITE, anchor='mm')
    d.text((W / 2, H / 2 + 395), CFG['outro'][1], font=f, fill=WHITE, anchor='mm')
    f2 = ImageFont.truetype(FONT_XB, 42)
    d.text((W / 2, H / 2 + 480), CFG['outro'][2], font=f2, fill=(220, 200, 255), anchor='mm')
    im.convert('RGB').save(path)


# ---------------------------------------------------------------- captions
def ass_time(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h}:{m:02d}:{s:05.2f}'


import re, unicodedata


def _norm(t):
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r"[^a-z0-9']", '', t)


def apply_fixes(words, fixes):
    """words: [{'s','e','w'}] (one per spoken word). fixes: [[old phrase, new phrase], ...].
    Matching ignores case/accents/punctuation; new words share the old span's timing."""
    for old, new in fixes:
        o = [_norm(x) for x in old.split()]
        o = [x for x in o if x]
        if not o:
            continue
        i = 0
        while i <= len(words) - len(o):
            if [_norm(w['w']) for w in words[i:i + len(o)]] == o:
                s0, e0 = words[i]['s'], words[i + len(o) - 1]['e']
                tail = re.search(r'[.,!?…]+$', words[i + len(o) - 1]['w'].strip())
                nw = new.split()
                if nw and tail and not re.search(r'[.,!?…]$', nw[-1]):
                    nw[-1] += tail.group(0)
                if not nw:
                    del words[i:i + len(o)]
                    continue
                tot = sum(len(x) for x in nw)
                acc, rep = s0, []
                for x in nw:
                    d = (e0 - s0) * len(x) / tot
                    rep.append({'s': acc, 'e': acc + d, 'w': ' ' + x})
                    acc += d
                words[i:i + len(o)] = rep
                i += len(nw)
            else:
                i += 1
    return words


def make_ass(words, segs, path, fixes=()):
    hdr = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Inter Black,78,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,7,3,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    hl = '{\\3c&HFF2C7B&\\bord11\\fscx114\\fscy114}'
    ws = []
    merged = []
    for w in words:
        raw = w['w']
        if merged and raw and (re.fullmatch(r'\s*[.,!?…;:]+\s*', raw) or (not raw.startswith(' ') and w['s'] - merged[-1]['e'] < 0.3)):
            merged[-1] = dict(merged[-1], w=merged[-1]['w'] + raw, e=w['e'])
        else:
            merged.append(dict(w))
    merged = apply_fixes(merged, list(fixes))
    for w in merged:
        txt = w['w'].strip().upper()
        if not txt:
            continue
        s, e = remap(w['s'], segs), remap(w['e'], segs)
        if e - s < 0.05:
            continue
        ws.append((s, e, txt))
    groups, cur = [], []
    for wd in ws:
        cur.append(wd)
        if len(cur) == 3 or wd[2][-1:] in '.?!,':
            groups.append(cur); cur = []
    if cur:
        groups.append(cur)
    lines = []
    for gi, g in enumerate(groups):
        g_end = groups[gi + 1][0][0] if gi + 1 < len(groups) else g[-1][1] + 0.3
        for i, (s, e, _) in enumerate(g):
            end = g[i + 1][0] if i + 1 < len(g) else min(g_end, e + 0.6)
            parts = []
            for j, (_, _, t) in enumerate(g):
                parts.append((hl + t + '{\\r}') if j == i else t)
            pop = '{\\fad(0,0)\\t(0,80,\\fscx104\\fscy104)\\t(80,160,\\fscx100\\fscy100)}' if i == 0 else ''
            lines.append(f"Dialogue: 0,{ass_time(s)},{ass_time(end)},Cap,,0,0,0,,{{\\pos({W // 2},{CAP_Y})}}{pop}{' '.join(parts)}")
    open(path, 'w').write(hdr + '\n'.join(lines) + '\n')


# ---------------------------------------------------------------- main
def main(spec_path):
    spec = json.load(open(spec_path))
    for k in ('pill', 'outro', 'kind', 'cam_top', 'cam_bot', 'cam_cy'):
        if k in spec:
            CFG[k] = spec[k]
    vod, start, end = spec['vod'], spec['start'], spec['end']
    words = [w for seg in json.load(open(spec['transcript'])) for w in seg['words']]
    segs, ws = speech_segments(words, start, end)
    tmp = tempfile.mkdtemp(prefix='tekka_')
    random.seed(int(start))

    # 1. segments (jump cuts + alternating framing)
    parts, variant, prev_screen = [], 0, None
    for i, (a, b) in enumerate(segs):
        scr = CFG['kind'] or scene_kind(vod, (a + b) / 2)
        variant = variant + 1 if scr == prev_screen else 0
        prev_screen = scr
        p = os.path.join(tmp, f'seg{i:03d}.mp4')
        render_segment(vod, a, b, scr, variant, p)
        parts.append(p)
    lst = os.path.join(tmp, 'list.txt')
    open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
    base = os.path.join(tmp, 'base.mp4')
    run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', base])
    real = [probe_dur(p) for p in parts]
    segs = [(a, b, d) for (a, b), d in zip(segs, real)]
    dur = probe_dur(base)
    cut_times, acc = [], 0.0
    for d in real[:-1]:
        acc += d; cut_times.append(acc)

    # 2. graphics
    ov = os.path.join(tmp, 'overlay.png'); dot = os.path.join(tmp, 'dot.png')
    tx0, tx1, ty = make_overlay(spec['title'], ov); make_dot(dot)
    pop1 = os.path.join(tmp, 'pop1.png'); pop2 = os.path.join(tmp, 'pop2.png')
    p1 = make_popup('ABONNE-TOI !', pop1)
    p2 = make_popup('♥ ENREGISTRE ET LIKE', pop2, PURPLE)
    outro = os.path.join(tmp, 'outro.png'); make_outro(outro)
    ass = os.path.join(tmp, 'caps.ass')
    gfix = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fixes_global.json')))
    make_ass(ws, segs, ass, gfix + spec.get('fixes', []))
    t_pop1, t_pop2 = dur * 0.22, dur * 0.62
    OUT_D = 1.6

    # 3. compose: banner slides in, captions, progress dot, popups, flash on hard cuts
    flash = ''.join(f"drawbox=x=0:y=0:w=iw:h=ih:color=white@0.35:t=fill:enable='between(t,{c:.2f},{c + 0.05:.2f})'," for c in cut_times[2::5])
    pop_in = lambda t0: f"if(lt(t,{t0}+0.12),(t-{t0})/0.12,1)"
    fc = (
        f"[0:v]{flash}null[v0];"
        f"[1:v]format=rgba[ovl];"
        f"[v0][ovl]overlay=x='if(lt(t,0.25),-W+W*t/0.25,0)':y=0[v1];"
        f"[v1][2:v]overlay=x='{tx0}+({tx1}-{tx0})*t/{dur:.3f}-17':y={ty - 17}[v2];"
        f"[3:v]format=rgba[pa];[v2][pa]overlay=x='W-w-40':y='150-60*(1-min(1,(t-{t_pop1:.2f})/0.15))':enable='between(t,{t_pop1:.2f},{t_pop1 + 2.4:.2f})'[v3];"
        f"[4:v]format=rgba[pb];[v3][pb]overlay=x='W-w-40':y='150-60*(1-min(1,(t-{t_pop2:.2f})/0.15))':enable='between(t,{t_pop2:.2f},{t_pop2 + 2.4:.2f})'[v4];"
        f"[v4]ass={ass}:fontsdir=/usr/share/fonts/opentype/inter,trim=duration={dur:.3f},setpts=PTS-STARTPTS[v5];"
        f"[5:v]loop=-1:size=1,trim=duration={OUT_D},fps={FPS},format=yuv420p,setsar=1,"
        f"zoompan=z='1.12-0.12*on/{int(OUT_D * FPS)}':d=1:s={W}x{H}:fps={FPS},fade=t=in:d=0.12[o];"
        f"[v5][o]concat=n=2:v=1:a=0,format=yuv420p[v]"
    )
    # audio: speech + sfx
    sfx = [(A('sfx_whoosh.wav'), 0.0, 0.9), (A('sfx_impact.wav'), 0.05, 0.55)]
    for k, c in enumerate(cut_times):
        if k % 2 == 0:
            sfx.append((A('sfx_whoosh.wav'), max(0, c - 0.12), 0.35))
    for c in cut_times[2::5]:
        sfx.append((A('sfx_click.wav'), c, 0.4))
    sfx += [(A('sfx_pop.wav'), t_pop1, 1.0), (A('sfx_pop.wav'), t_pop2, 1.0),
            (A('sfx_riser.wav'), max(0, dur - 2.3), 0.5), (A('sfx_impact.wav'), dur, 0.9)]
    inputs = ['-i', base, '-loop', '1', '-i', ov, '-loop', '1', '-i', dot, '-loop', '1', '-i', pop1,
              '-loop', '1', '-i', pop2, '-i', outro]
    for f, _, _ in sfx:
        inputs += ['-i', f]
    afc = f"[0:a]apad=pad_dur={OUT_D},loudnorm=I=-15:TP=-1.5[sp];"
    labels = ['[sp]']
    for k, (_, t0, vol) in enumerate(sfx):
        ms = int(t0 * 1000)
        afc += f"[{6 + k}:a]aresample=48000,aformat=channel_layouts=stereo,volume={vol},adelay={ms}|{ms}[s{k}];"
        labels.append(f'[s{k}]')
    afc += f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=first,alimiter=limit=0.95[a]"
    total = dur + OUT_D
    run(['ffmpeg', '-loglevel', 'error', '-y', *inputs, '-filter_complex', fc + ';' + afc,
         '-map', '[v]', '-map', '[a]', '-t', f'{total:.3f}', '-r', str(FPS),
         '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', spec['out']])
    print(f"{spec['out']}: {total:.1f}s, {len(segs)} cuts (source {end - start:.1f}s)")
    return spec['out']


if __name__ == '__main__':
    main(sys.argv[1])
