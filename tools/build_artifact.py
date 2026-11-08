"""Assemble une page unique (CSS + JS intégrés) dans dist/artifact.html.
Les médias restent dans media/ et sont publiés à côté.

Usage : python3 tools/build_artifact.py
"""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text()
css = (root / "style.css").read_text()
cfg = (root / "config.js").read_text()
app = (root / "app.js").read_text()

head = re.search(r"<head>(.*)</head>", html, re.S).group(1)
head = re.sub(r'\s*<meta charset[^>]*>', "", head)
head = re.sub(r'\s*<meta name="viewport"[^>]*>', "", head)
head = head.replace('<link rel="stylesheet" href="style.css" />', f"<style>\n{css}\n</style>")
out = f"""{head.strip()}
<div id="device"><div id="app"></div></div>
<script>
{cfg}
</script>
<script>
{app}
</script>
"""
title = re.search(r"<title>.*?</title>", out).group(0)
out = title + "\n" + out.replace(title, "", 1)
(root / "dist").mkdir(exist_ok=True)
(root / "dist" / "artifact.html").write_text(out)
print("dist/artifact.html", len(out), "octets")
