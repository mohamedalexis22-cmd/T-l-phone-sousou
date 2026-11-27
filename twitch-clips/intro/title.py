#!/usr/bin/env python3
"""TOPSIDE title card frames (1920x1080): speed lines, particles, Tekka logo, glowing title, subtitle tape."""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1920, 1080, 30
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 5.8
SUB = sys.argv[2] if len(sys.argv) > 2 else 'TOP 10 CAPITAINES ALL TIME'
OUT = sys.argv[3] if len(sys.argv) > 3 else 'frames'
PURPLE, PURPLE_D = (123, 44, 255), (42, 10, 94)
F_TITLE = '/usr/share/fonts/opentype/inter/Inter-BlackItalic.otf'
F_SUB = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
LOGO = Image.open('/home/user/clips/assets/logo_white.png')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(3)

# background: radial purple glow
yy, xx = np.mgrid[0:H, 0:W]
r = np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H / 2) / H * 0.6) ** 2)
k = np.clip(1 - r * 1.6, 0, 1)[..., None] ** 1.5
BG = (np.array([14, 8, 26]) * (1 - k) + np.array([70, 34, 130]) * k).astype(np.uint8)
lines = [(rng.uniform(0, 2 * math.pi), rng.uniform(0.15, 1.0), rng.uniform(1, 4), rng.uniform(0, 1)) for _ in range(140)]
parts = [(rng.uniform(0, W), rng.uniform(0, H), rng.uniform(1.5, 4), rng.uniform(0.3, 1)) for _ in range(90)]


def ease_out_back(x):
    c1 = 1.70158; c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def title_layer():
    """Big italic TOPSIDE with purple stroke + glow, prerendered."""
    f = ImageFont.truetype(F_TITLE, 250)
    txt = 'TOPSIDE'
    tw = int(f.getlength(txt)) + 120
    im = Image.new('RGBA', (tw, 360), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((tw / 2 + 10, 190), txt, font=f, anchor='mm', fill=PURPLE_D + (255,), stroke_width=14, stroke_fill=PURPLE_D + (255,))
    glow = Image.new('RGBA', im.size, (0, 0, 0, 0))
    ImageDraw.Draw(glow).text((tw / 2, 180), txt, font=f, anchor='mm', fill=PURPLE + (255,), stroke_width=16, stroke_fill=PURPLE + (255,))
    glow = glow.filter(ImageFilter.GaussianBlur(22))
    out = Image.alpha_composite(glow, im)
    ImageDraw.Draw(out).text((tw / 2, 180), txt, font=f, anchor='mm', fill=(255, 255, 255, 255), stroke_width=5, stroke_fill=(190, 150, 255, 255))
    return out


def sub_layer():
    f = ImageFont.truetype(F_SUB, 62)
    words = SUB.split()
    hl = ' '.join(words[-2:]) if len(words) > 2 else ''
    first = ' '.join(words[:-2]) if hl else SUB
    w1 = f.getlength(first + (' ' if hl else '')); w2 = f.getlength(hl)
    tw = int(w1 + w2) + 80
    im = Image.new('RGBA', (tw, 130), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(0, 22), (tw, 10), (tw - 6, 118), (6, 124)], fill=(240, 238, 236, 255))
    d.rectangle((40 + w1 - 6, 70, 40 + w1 + w2 + 6, 98), fill=(170, 130, 255, 255))
    d.rectangle((tw * 0.42, 4, tw * 0.55, 24), fill=(170, 130, 255, 230))
    d.text((40, 68), first, font=f, fill=(18, 12, 28), anchor='lm')
    if hl:
        d.text((40 + w1, 68), hl, font=f, fill=(18, 12, 28), anchor='lm')
    return im.rotate(1.5, resample=Image.BICUBIC, expand=True)


TITLE, SUBL = title_layer(), sub_layer()
n = int(DUR * FPS)
for i in range(n):
    t = i / FPS
    im = Image.fromarray(BG.copy(), 'RGB').convert('RGBA')
    d = ImageDraw.Draw(im, 'RGBA')
    # speed lines rotating slowly, burst at start
    burst = 1 + 2.5 * math.exp(-t * 4)
    for ang, rad, wd, ph in lines:
        a = ang + t * 0.05
        r0 = (0.18 + ((ph + t * 0.6 * burst) % 1) * 0.6) * W
        r1 = r0 + rad * 520 * burst
        x0, y0 = W / 2 + math.cos(a) * r0, H / 2 + math.sin(a) * r0 * 0.75
        x1, y1 = W / 2 + math.cos(a) * r1, H / 2 + math.sin(a) * r1 * 0.75
        d.line((x0, y0, x1, y1), fill=(200, 190, 230, int(60 + 60 * rad)), width=int(wd))
    for x, y, s, a in parts:
        yy_ = (y - t * 25 * a) % H
        tw_ = 0.5 + 0.5 * math.sin(t * 3 + x)
        d.ellipse((x - s, yy_ - s, x + s, yy_ + s), fill=(190, 170, 255, int(200 * a * tw_)))
    # flash at the very start
    if t < 0.25:
        d.rectangle((0, 0, W, H), fill=(255, 255, 255, int(255 * (1 - t / 0.25))))
    shake = 10 * math.exp(-t * 9) * math.sin(t * 90)
    # logo pops in
    lt = min(1, max(0, (t - 0.05) / 0.45))
    if lt > 0:
        s = int(230 * ease_out_back(lt))
        if s > 4:
            lg = LOGO.resize((s, s), Image.LANCZOS)
            im.alpha_composite(lg, (int(W / 2 - s / 2 + shake), int(250 - s / 2)))
    # title slams (scale from 1.6 to 1)
    tt = min(1, max(0, (t - 0.12) / 0.3))
    if tt > 0:
        sc = 1.6 - 0.6 * (1 - (1 - tt) ** 3)
        tl = TITLE.resize((int(TITLE.width * sc), int(TITLE.height * sc)), Image.LANCZOS)
        al = tl.getchannel('A').point(lambda v: int(v * min(1, tt * 2)))
        tl.putalpha(al)
        im.alpha_composite(tl, (int(W / 2 - tl.width / 2 + shake), int(560 - tl.height / 2 + shake * 0.5)))
    # subtitle tape slides in
    st = min(1, max(0, (t - 0.65) / 0.35))
    if st > 0:
        x = int(W / 2 - SUBL.width / 2 + (1 - ease_out_back(st)) * -900)
        im.alpha_composite(SUBL, (x, 760))
    # fade out at the end
    if t > DUR - 0.6:
        d2 = ImageDraw.Draw(im, 'RGBA')
        d2.rectangle((0, 0, W, H), fill=(0, 0, 0, int(255 * min(1, (t - (DUR - 0.6)) / 0.6))))
    im.convert('RGB').save(f'{OUT}/f{i:04d}.jpg', quality=92)
print(n, 'frames')
