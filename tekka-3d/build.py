#!/usr/bin/env python3
"""Construit tekka-3d-obs.html (un seul fichier : code 3D + logo + maillot + photos intégrés).
Usage : NODE_PATH=<dossier node_modules avec three + esbuild> python3 build.py"""
import base64, json, os, re, subprocess, sys
here = os.path.dirname(os.path.abspath(__file__))
nm = os.environ.get('NODE_PATH', os.path.join(here, 'node_modules'))
esb = os.path.join(nm, '.bin', 'esbuild')
bundle = subprocess.run([esb, os.path.join(here, 'main.js'), '--bundle', '--minify', '--format=iife', '--target=es2020'],
                        check=True, capture_output=True, env={**os.environ, 'NODE_PATH': nm}).stdout.decode()
def uri(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(open(path, 'rb').read()).decode()
src = open(os.path.join(here, '..', 'tekka-waiting', 'index.html'), encoding='utf-8').read()
photos = re.findall(r'\["(photos/\d+\.jpg)","([^"]*)"\]', src)
photos = [[uri(os.path.join(here, '..', 'tekka-waiting', p), 'image/jpeg'), cap] for p, cap in photos]
html = open(os.path.join(here, 'template.html'), encoding='utf-8').read()
html = (html.replace('__LOGO__', uri(os.path.join(here, 'assets/logo.png'), 'image/png'))
            .replace('__JERSEY__', uri(os.path.join(here, 'assets/jersey.jpg'), 'image/jpeg'))
            .replace('__PHOTOS__', json.dumps(photos, ensure_ascii=False))
            .replace('<script>__BUNDLE__</script>', '<script>' + bundle.replace('</script', '<\\/script') + '</script>'))
out = os.path.join(here, 'tekka-3d-obs.html'); open(out, 'w', encoding='utf-8').write(html)
print(out, len(photos), 'photos', round(len(html) / 1e6, 1), 'Mo')
