#!/usr/bin/env python3
"""Original cloud-rap beat (PNL-like mood): 140 BPM half-time, dreamy pads, 808 glides, hat rolls.
Timeline: drop (drums + 808 full) at DROP seconds, where the title card appears."""
import sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
BPM = 140
BEAT = 60 / BPM
BAR = 4 * BEAT
DROP = float(sys.argv[1]) if len(sys.argv) > 1 else 12.2
TOTAL = float(sys.argv[2]) if len(sys.argv) > 2 else 18.0
OUT = sys.argv[3] if len(sys.argv) > 3 else 'beat.wav'
rng = np.random.default_rng(7)
N = int(TOTAL * SR)
mix = np.zeros((N, 2))


def lp(x, f, o=2):
    return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[:N - i]
    l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    if sig.ndim == 1:
        mix[i:i + len(sig), 0] += sig * gain * l * 1.414
        mix[i:i + len(sig), 1] += sig * gain * r * 1.414
    else:
        mix[i:i + len(sig)] += sig * gain


def reverb(x, secs=3.5, wet=0.45):
    n = int(secs * SR)
    ir = rng.standard_normal((n, 2)) * np.exp(-np.linspace(0, 7, n))[:, None]
    ir = np.stack([lp(ir[:, 0], 5000), lp(ir[:, 1], 4200)], 1)
    ir /= np.abs(ir).sum(0) ** 0.5 * 30
    y = np.stack([fftconvolve(x[:, k], ir[:, k])[:len(x)] for k in range(2)], 1)
    return x * (1 - wet) + y * wet


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


# key: C# minor — C#m  A  E  B (i VI III VII), one chord per bar
prog = [[61, 64, 68], [57, 61, 64], [64, 68, 71], [59, 63, 66]]
roots = [37, 33, 40, 35]
t_ax = lambda d: np.arange(int(d * SR)) / SR

# ---------------- pads (detuned saws, slow attack, lowpassed)
pads = np.zeros((N, 2))
nbars = int(np.ceil(TOTAL / BAR)) + 1
for b in range(nbars):
    t0 = b * BAR
    if t0 >= TOTAL:
        break
    t = t_ax(BAR + 0.6)
    env = np.minimum(1, t / 0.5) * np.exp(-np.maximum(0, t - BAR) * 6)
    for k, m in enumerate(prog[b % 4] + [prog[b % 4][0] + 12]):
        for det, pan in ((-0.12, -0.6), (0.11, 0.6)):
            f = note(m + det)
            saw = 2 * ((t * f) % 1) - 1
            s = lp(saw, 1400 if t0 < DROP else 2600) * env * 0.05
            i = int(t0 * SR)
            seg = s[:max(0, N - i)]
            pads[i:i + len(seg), 0] += seg * (1 - pan) / 2
            pads[i:i + len(seg), 1] += seg * (1 + pan) / 2
mix += reverb(pads, 4.0, 0.55)

# ---------------- dreamy lead (sine + vibrato, echoes) — a short sad motif, after the drop too
lead = np.zeros((N, 2))
motif = [(0, 76, 1.5), (1.5, 75, 0.5), (2, 73, 1.0), (3, 71, 1.0), (4, 73, 2.5), (6.5, 68, 1.5)]
for rep in range(4):
    base = BAR * 2 + rep * BAR * 2
    for st, m, d in motif:
        t0 = base + st * BEAT / 2 * 2 * 0.5
        dur = d * BEAT * 0.5 * 2 * 0.5 + 0.25
        t = t_ax(dur)
        vib = 0.25 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.3)
        ph = 2 * np.pi * np.cumsum(note(m + vib)) / SR
        s = (np.sin(ph) + 0.25 * np.sin(2 * ph)) * np.minimum(1, t / 0.04) * np.exp(-t * 1.6) * 0.06
        for e, g, pan in ((0, 1, 0), (3 * BEAT / 4, 0.45, -0.7), (3 * BEAT / 2, 0.25, 0.7)):
            i = int((t0 + e) * SR)
            if i >= N:
                continue
            seg = s[:N - i]
            lead[i:i + len(seg), 0] += seg * g * (1 - pan) / 2
            lead[i:i + len(seg), 1] += seg * g * (1 + pan) / 2
mix += reverb(lead, 3.0, 0.5)

# ---------------- drums
def kick808(f0, dur=1.2, glide_to=None):
    t = t_ax(dur)
    f = f0 * (1 + 2.5 * np.exp(-t * 40))
    if glide_to:
        f = f * np.where(t > dur * 0.45, (glide_to / f0) ** np.minimum(1, (t - dur * 0.45) / 0.12), 1)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    return np.tanh(s * 2.2) * 0.55


def snare():
    t = t_ax(0.35)
    n = hp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 18)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return (n * 0.5 + tone * 0.4) * 0.7


def hat(open_=False):
    t = t_ax(0.18 if open_ else 0.05)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (18 if open_ else 90)) * 0.22


drums = np.zeros((N, 2))
def dadd(sig, t, g=1, pan=0):
    global mix
    i = int(t * SR)
    if i >= N:
        return
    seg = sig[:N - i]
    drums[i:i + len(seg), 0] += seg * g * (1 - pan) / 2 * 1.4
    drums[i:i + len(seg), 1] += seg * g * (1 + pan) / 2 * 1.4

bar0 = int(DROP // BAR)
offset = DROP - bar0 * BAR            # align bars so the drop lands on a downbeat
grid0 = offset
b = 0
while grid0 + b * BAR < TOTAL:
    t0 = grid0 + b * BAR
    chord = (b - bar0) % 4
    pre = t0 < DROP - 0.01
    # hats: light before the drop (from bar 2), full with rolls after
    if t0 >= BAR * 1.5 or not pre:
        for k in range(8):
            th = t0 + k * BEAT / 2
            dadd(hat(), th, 0.6 if pre else 1.0, 0.3)
        if not pre:
            for k in range(6):                      # 32nd-note roll at the end of the bar
                dadd(hat(), t0 + 3.25 * BEAT + k * BEAT / 8, 0.55 + k * 0.07, 0.3)
            dadd(hat(True), t0 + 1.5 * BEAT, 0.6, -0.3)
    if not pre:
        dadd(snare(), t0 + 2 * BEAT, 1.0)                     # half-time clap on 3
        r = roots[chord]
        add(kick808(note(r), 1.4, note(r + 7) if b % 2 else None), t0, 1.0)
        add(kick808(note(r), 0.5), t0 + 2.75 * BEAT, 0.8)
    b += 1
mix += reverb(drums, 1.2, 0.18)

# ---------------- riser into the drop + impact
t = t_ax(2.4)
riser = hp(rng.standard_normal(len(t)), 600) * (t / 2.4) ** 2.5 * 0.18
add(np.stack([riser, riser[::-1] * 0 + riser], 1), DROP - 2.4)
t = t_ax(2.0)
boom = np.tanh(np.sin(2 * np.pi * np.cumsum(55 * (1 + 3 * np.exp(-t * 25))) / SR) * np.exp(-t * 1.8) * 3) * 0.6
add(boom, DROP, 1.0)
# fade tail
fade = np.ones(N); fl = int(1.2 * SR); fade[-fl:] = np.linspace(1, 0, fl)
mix *= fade[:, None]
mix /= np.max(np.abs(mix)) + 1e-9
sf.write(OUT, (mix * 0.89).astype(np.float32), SR)
print(OUT, f'{TOTAL:.1f}s, drop at {DROP:.2f}s')
