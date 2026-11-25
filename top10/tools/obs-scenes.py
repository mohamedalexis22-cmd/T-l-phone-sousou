#!/usr/bin/env python3
"""Génère obs/TOPSIDE-scenes.json (collection de scènes OBS, Windows, dossier C:\\TOPSIDE)."""
import json, uuid, os
BASE = "file:///C:/TOPSIDE/live/"
CSS = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }"
sources = []

def src(id_, name, settings, audio=False):
    s = {"prev_ver": 503382019, "name": name, "uuid": str(uuid.uuid4()), "id": id_, "versioned_id": id_, "settings": settings,
         "mixers": 255 if audio else 0, "sync": 0, "flags": 0, "volume": 1.0, "balance": 0.5, "enabled": True, "muted": False,
         "push-to-mute": False, "push-to-mute-delay": 0, "push-to-talk": False, "push-to-talk-delay": 0, "hotkeys": {},
         "deinterlace_mode": 0, "deinterlace_field_order": 0, "monitoring_type": 0, "private_settings": {}}
    sources.append(s); return s

def nav(name, url, w, h):
    return src("browser_source", name, {"url": url, "width": w, "height": h, "css": CSS, "is_local_file": False,
                                         "reroute_audio": False, "restart_when_active": False, "shutdown": False})

cam = src("dshow_input", "Caméra", {"video_device_id": "", "res_type": 0, "active": True})
video = src("window_capture", "Vidéo à regarder (fenêtre du navigateur)", {"method": 0, "cursor": False, "window": ""})
ecran = src("monitor_capture", "Votre écran", {"monitor": 0, "capture_cursor": True})
alertes = nav("Alertes Twitch", BASE + "alertes.html", 1920, 1080)
bandeau = nav("Bandeau réseaux (défilant)", BASE + "bandeau.html", 1920, 90)

def item(s, i, x, y, w=None, h=None, visible=True):
    it = {"name": s["name"], "source_uuid": s["uuid"], "visible": visible, "locked": False, "rot": 0.0,
          "pos": {"x": float(x), "y": float(y)}, "scale": {"x": 1.0, "y": 1.0}, "align": 5, "bounds_type": 0, "bounds_align": 0,
          "bounds_crop": False, "bounds": {"x": 0.0, "y": 0.0}, "crop_left": 0, "crop_top": 0, "crop_right": 0, "crop_bottom": 0,
          "id": i, "group_item_backup": False, "scale_filter": "disable", "blend_method": "default", "blend_type": "normal",
          "show_transition": {"duration": 0}, "hide_transition": {"duration": 0}, "private_settings": {}}
    if w:
        it["bounds_type"] = 2; it["bounds"] = {"x": float(w), "y": float(h)}
    return it

scenes = []
def scene(nom, couches, avec_bandeau=True):
    couches = list(couches)
    if avec_bandeau:
        couches.append((bandeau, (0, 990), False))      # caché par défaut : cliquez l'œil pour l'afficher
    couches.append((alertes, (0, 0), True))
    items = [item(s, i + 1, *p, visible=v) for i, (s, p, v) in enumerate((c if len(c) == 3 else (c[0], c[1], True)) for c in couches)]
    scenes.append(src("scene", nom, {"id_counter": len(items), "custom_size": False, "items": items}))

def tchat(nom, w, h): return nav("Tchat · " + nom, BASE + "tchat.html", w, h)
def ov(e, nom): return nav("Overlay · " + nom, BASE + "overlay.html?ecran=" + e, 1920, 1080)

CAM_D = (1350, 40, 530, 298)
t_att = tchat("attente", 480, 1000)
t_col = tchat("colonne", 530, 662)
scene("1 · Attente", [(ov("attente", "attente"), (0, 0)), (t_att, (1400, 40))], False)
scene("2 · Plein écran (caméra)", [(cam, (0, 0, 1920, 1080)), (ov("pleinecran", "plein écran"), (0, 0))])
scene("3 · Écran + caméra", [(ecran, (0, 0, 1920, 1080)), (cam, (1440, 40, 440, 248)), (ov("ecrancam", "écran + caméra"), (0, 0))])
scene("4 · Écran + caméra (bas gauche)", [(ecran, (0, 0, 1920, 1080)), (cam, (40, 724, 440, 248)), (ov("ecrancamg", "écran + caméra bas gauche"), (0, 0))])
scene("5 · Discussion", [(cam, (0, 0, 1920, 1080)), (ov("discussion", "discussion"), (0, 0)), (tchat("discussion", 400, 620), (1480, 300))])
scene("6 · Réaction vidéo", [(video, (40, 40, 1280, 720)), (cam, CAM_D), (ov("reaction", "réaction vidéo"), (0, 0)), (t_col, (1350, 378))])
scene("7 · Tweets", [(video, (40, 40, 760, 880)), (cam, (840, 40, 1040, 585)), (ov("tweets", "tweets"), (0, 0)), (tchat("tweets", 1040, 375), (840, 665))])
scene("8 · Tier list", [(cam, CAM_D), (ov("tierlist", "tier list"), (0, 0)), (t_col, (1350, 378))])
scene("9 · Pause", [(ov("pause", "pause"), (0, 0)), (t_att, (1400, 40))], False)
scene("10 · Fin", [(ov("fin", "fin"), (0, 0)), (t_att, (1400, 40))], False)

audio = lambda name, id_: {"prev_ver": 503382019, "name": name, "uuid": str(uuid.uuid4()), "id": id_, "versioned_id": id_,
    "settings": {"device_id": "default"}, "mixers": 255, "sync": 0, "flags": 0, "volume": 1.0, "balance": 0.5, "enabled": True,
    "muted": False, "push-to-mute": False, "push-to-mute-delay": 0, "push-to-talk": False, "push-to-talk-delay": 0, "hotkeys": {},
    "deinterlace_mode": 0, "deinterlace_field_order": 0, "monitoring_type": 0, "private_settings": {}}
col = {"name": "TOPSIDE", "current_scene": "1 · Attente", "current_program_scene": "1 · Attente",
       "scene_order": [{"name": s["name"]} for s in scenes], "sources": sources, "groups": [], "quick_transitions": [],
       "transitions": [], "saved_projectors": [], "current_transition": "Fade", "transition_duration": 300,
       "preview_locked": False, "scaling_enabled": False, "scaling_level": 0, "scaling_off_x": 0.0, "scaling_off_y": 0.0,
       "virtual-camera": {"type2": 3}, "modules": {}, "resolution": {"x": 1920, "y": 1080}, "version": 2,
       "DesktopAudioDevice1": audio("Son du PC", "wasapi_output_capture"), "AuxAudioDevice1": audio("Micro", "wasapi_input_capture")}
sortie = os.path.join(os.path.dirname(__file__), "..", "obs", "TOPSIDE-scenes.json")
json.dump(col, open(sortie, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(scenes), "scènes,", len(sources), "sources")
