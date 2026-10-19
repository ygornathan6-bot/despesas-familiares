"""Gera despesas-familiares.html: um único arquivo (CSS e JS embutidos)
para abrir direto no Chrome, sem servidor."""
from pathlib import Path

base = Path(__file__).parent
html = (base / "index.html").read_text(encoding="utf-8")
css = (base / "static/css/style.css").read_text(encoding="utf-8")
js = (base / "static/js/app.js").read_text(encoding="utf-8")

html = html.replace('<link rel="stylesheet" href="static/css/style.css">', f"<style>\n{css}</style>")
html = html.replace('<script src="static/js/app.js"></script>', f"<script>\n{js}</script>")

saida = base / "despesas-familiares.html"
saida.write_text(html, encoding="utf-8")
print("Gerado:", saida)
