"""Compose et synthétise « solo pour nana » (piano), 100 % original.

Motifs cachés (alphabet musical cyclique A..G : H=A, I=B, ... N=G, O=A, S=E, U=G) :
  N-A-N-A        -> sol la sol la
  S-O-U-S-O-U    -> mi la sol mi la sol

Chaque phrase de 2 mesures porte une ligne du texte. Le script écrit :
  piano.wav            l'audio
  piano-timings.json   l'instant (en s) où commence chaque phrase / ligne

Usage : python3 compose_piano.py <dossier_de_sortie>
"""
import json
import sys

import numpy as np

SR = 44100
BPM = 70
BEAT = 60 / BPM
LEAD = 0.6  # silence au début

# MIDI : C4=60 A4=69
N = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def m(name):
    """'G#5' -> numéro MIDI"""
    p = N[name[0]]
    rest = name[1:]
    if rest.startswith('#'):
        p += 1
        rest = rest[1:]
    return 12 * (int(rest) + 1) + p


# (mélodie de 8 temps, (accord mesure 1, accord mesure 2))
PHRASES = [
    ("G4 .5 A4 .5 G4 .5 A4 2.5 E5 1 D5 1 C5 2", ("Am", "Am")),          # Dis, Nana…  (N-A-N-A)
    ("E5 1.5 D5 .5 C5 1 B4 1 A4 1.5 G4 .5 A4 2", ("Am", "F")),
    ("G4 1 C5 1 E5 1.5 D5 .5 D5 2 B4 1 G4 1", ("C", "G")),
    ("E5 1.5 D5 .5 C5 1 E5 1 F5 1.5 E5 .5 C5 2", ("Am", "F")),
    ("D5 1 F5 1 E5 1 D5 1 B4 2 G#4 1 E4 1", ("Dm", "E")),
    ("A4 2 C5 1 E5 1 D5 2 C5 1 A4 1", ("Am", "F")),
    ("F5 1 E5 1 D5 1 A4 1 C5 1.5 B4 .5 A4 2", ("Dm", "Am")),
    ("A4 .5 C5 .5 F5 3 G5 2 D5 1 B4 1", ("F", "G")),
    ("E5 1 G5 1 C6 1.5 B5 .5 B5 1 A5 1 G5 2", ("C", "G")),
    ("A5 1.5 G5 .5 E5 1 C5 1 B4 1 E5 1 G5 2", ("Am", "Em")),
    ("A5 1 G5 1 F5 1 E5 1 D5 1.5 E5 .5 G5 2", ("F", "G")),
    ("G5 .5 A5 .5 G5 .5 A5 2.5 F5 1.5 E5 .5 C5 2", ("Am", "F")),        # N-A-N-A aigu
    ("D5 1 F5 1 A5 1.5 G#5 .5 E5 2 B4 1 G#4 1", ("Dm", "E")),
    ("E5 .5 A5 .5 G5 1 E5 .5 A5 .5 G5 1 F5 1 E5 1 D5 2", ("F", "G")),  # S-O-U-S-O-U
    ("G4 .5 A4 .5 G4 .5 A4 2.5 C5 1 D5 1 E5 2", ("F", "G")),            # retour de l'intro
    ("G4 .5 A4 .5 C5 7", ("C", "C")),                                   # fin
]

CHORDS = {  # fondamentale (MIDI), tierce
    "Am": (45, 3), "F": (41, 4), "C": (48, 4), "G": (43, 4),
    "Dm": (50, 3), "E": (40, 4), "Em": (40, 3),
}


def parse(mel):
    t = mel.split()
    return [(m(t[i]), float(t[i + 1])) for i in range(0, len(t), 2)]


def freq(n):
    return 440.0 * 2 ** ((n - 69) / 12)


rng = np.random.default_rng(7)


def piano_note(n, dur, vel):
    """Une note de piano synthétique (additive, cordes légèrement désaccordées)."""
    f0 = freq(n)
    tail = 2.5
    total = dur + tail
    t = np.arange(int(total * SR)) / SR
    out = np.zeros_like(t)
    B = 0.00035
    base_decay = 0.35 + 3.2 * np.exp(-(n - 40) / 22)  # graves plus longs
    for k in range(1, 14):
        fk = k * f0 * np.sqrt(1 + B * k * k)
        if fk > SR / 2.2:
            break
        amp = (1 / k ** 1.15) * (1.0 if k < 3 else 0.8) * (0.6 + 0.8 * vel)
        dec_fast = base_decay / (1 + 0.55 * k)
        dec_slow = base_decay * 3.2 / (1 + 0.35 * k)
        env = 0.65 * np.exp(-t / dec_fast) + 0.35 * np.exp(-t / dec_slow)
        for det in (-0.9, 0.9):
            f = fk * 2 ** (det / 1200)
            out += 0.5 * amp * env * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28))
    # attaque + bruit de marteau
    att = np.minimum(1, t / 0.004)
    out *= att
    nz = rng.standard_normal(int(0.02 * SR)) * np.exp(-np.arange(int(0.02 * SR)) / (0.004 * SR))
    out[: len(nz)] += nz * 0.02 * vel
    # relâchement (pédale levée)
    rel = np.ones_like(t)
    r0 = int(dur * SR)
    rel[r0:] = np.exp(-(t[r0:] - dur) / 0.18)
    out *= rel
    return out * vel


def add(buf, sig, start, pan):
    i = int(start * SR)
    j = min(len(buf), i + len(sig))
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[i:j, 0] += sig[: j - i] * l
    buf[i:j, 1] += sig[: j - i] * r


def main(outdir):
    beats = []
    t = LEAD
    starts = []
    events = []  # (start, midi, dur, vel, pan)
    for pi, (mel, (c1, c2)) in enumerate(PHRASES):
        # ralentissement sur les deux dernières phrases
        beat = BEAT * (1.0 if pi < len(PHRASES) - 2 else (1.12 if pi == len(PHRASES) - 2 else 1.3))
        starts.append(round(t, 3))
        bar = 4 * beat
        last = pi == len(PHRASES) - 1
        soft = pi in (0, 5, len(PHRASES) - 1)
        # main gauche : arpèges en croches, pédale changée à chaque mesure
        for bi, ch in enumerate((c1, c2)):
            root, third = CHORDS[ch]
            pattern = [0, 7, 12, 12 + third, 19, 12 + third, 12, 7]
            if last and bi == 1:
                pattern = [0, 7, 12, 16, 19, 24, 26, 28]  # C add9, ça s'ouvre
            for k, iv in enumerate(pattern):
                st = t + bi * bar + k * beat / 2 + rng.normal(0, 0.006)
                pedal_end = t + (bi + 1) * bar - st + (3.0 if last else 0.05)
                v = (0.32 if soft else 0.42) * (1.1 if k == 0 else 0.85)
                events.append((st, root + iv, pedal_end, v, -0.35))
        # main droite
        bt = 0.0
        for note, d in parse(mel):
            st = t + bt * beat + rng.normal(0, 0.008)
            bar_end = t + (1 if bt < 4 else 2) * bar
            hold = max(d * beat, bar_end - st) + (0.05 if not last else 4.0)
            v = (0.62 if soft else 0.78) + 0.05 * rng.standard_normal()
            events.append((st, note, hold, float(np.clip(v, 0.4, 0.95)), 0.25))
            if last and note == m("C5"):
                for extra in ("E5", "G5"):  # accord final à la main droite
                    events.append((st + 0.03, m(extra), hold, 0.45, 0.25))
            bt += d
        t += 2 * bar
    total = t + 6
    buf = np.zeros((int(total * SR), 2))
    for st, note, dur, vel, pan in events:
        add(buf, piano_note(note, dur, vel), st, pan)

    # réverbe : convolution avec une réponse impulsionnelle synthétique
    ir_len = int(2.4 * SR)
    ti = np.arange(ir_len) / SR
    wet = np.zeros_like(buf)
    nfft = 1 << int(np.ceil(np.log2(len(buf) + ir_len)))
    for ch in range(2):
        ir = rng.standard_normal(ir_len) * np.exp(-ti / 0.55)
        ir[: int(0.012 * SR)] = 0
        # adoucit les aigus de la queue
        ir = np.convolve(ir, np.ones(6) / 6, mode="same")
        y = np.fft.irfft(np.fft.rfft(buf[:, ch], nfft) * np.fft.rfft(ir, nfft), nfft)[: len(buf)]
        wet[:, ch] = y
    wet *= np.max(np.abs(buf)) / (np.max(np.abs(wet)) + 1e-9) * 0.45
    mix = buf * 0.85 + wet
    mix /= np.max(np.abs(mix)) / 0.89
    fade = int(3 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]

    pcm = (mix * 32767).astype("<i2")
    import wave
    with wave.open(f"{outdir}/piano.wav", "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    with open(f"{outdir}/piano-timings.json", "w") as f:
        json.dump({"starts": starts, "end": round(t, 3), "duration": round(total, 3)}, f)
    print("phrases:", len(starts), "durée:", round(total, 1), "s")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
