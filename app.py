"""Servidor local das Despesas da Família (só biblioteca padrão do Python).

Uso:  python app.py   ->  abre http://127.0.0.1:8000 no navegador.
Os dados ficam em despesas.db (SQLite), na mesma pasta.
"""
import json
import re
import sqlite3
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from mimetypes import guess_type
from pathlib import Path

BASE = Path(__file__).parent.resolve()
DB = BASE / "despesas.db"
HOST, PORT = "127.0.0.1", 8000


def conectar():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con


def criar_tabela():
    with conectar() as con:
        con.execute(
            """CREATE TABLE IF NOT EXISTS despesas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                descricao TEXT NOT NULL,
                valor REAL NOT NULL,
                data TEXT NOT NULL,
                categoria TEXT NOT NULL,
                pessoa TEXT NOT NULL
            )"""
        )


def validar(d):
    try:
        descricao = str(d["descricao"]).strip()[:200]
        pessoa = str(d["pessoa"]).strip()[:60]
        categoria = str(d["categoria"]).strip()[:40]
        valor = round(float(d["valor"]), 2)
        datetime.strptime(str(d["data"]), "%Y-%m-%d")
    except (KeyError, ValueError, TypeError):
        return None
    if not descricao or not pessoa or not categoria or valor <= 0:
        return None
    return descricao, valor, str(d["data"]), categoria, pessoa


class Handler(BaseHTTPRequestHandler):
    def _json(self, codigo, dados=None):
        corpo = json.dumps(dados if dados is not None else {}).encode()
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def do_GET(self):
        caminho = self.path.split("?")[0]
        if caminho == "/api/despesas":
            with conectar() as con:
                linhas = con.execute("SELECT * FROM despesas ORDER BY data DESC, id DESC").fetchall()
            return self._json(200, [dict(l) for l in linhas])
        rel = "index.html" if caminho == "/" else caminho.lstrip("/")
        if rel != "index.html" and not rel.startswith("static/"):
            return self._json(404, {"erro": "não encontrado"})
        arquivo = (BASE / rel).resolve()
        if BASE not in arquivo.parents or not arquivo.is_file():
            return self._json(404, {"erro": "não encontrado"})
        corpo = arquivo.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", (guess_type(arquivo.name)[0] or "application/octet-stream") + "; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def do_POST(self):
        if self.path != "/api/despesas":
            return self._json(404, {"erro": "não encontrado"})
        try:
            tam = int(self.headers.get("Content-Length", 0))
            dados = validar(json.loads(self.rfile.read(tam)))
        except (ValueError, json.JSONDecodeError):
            dados = None
        if not dados:
            return self._json(400, {"erro": "dados inválidos"})
        with conectar() as con:
            cur = con.execute(
                "INSERT INTO despesas (descricao, valor, data, categoria, pessoa) VALUES (?,?,?,?,?)", dados
            )
            novo = con.execute("SELECT * FROM despesas WHERE id = ?", (cur.lastrowid,)).fetchone()
        self._json(201, dict(novo))

    def do_DELETE(self):
        m = re.fullmatch(r"/api/despesas/(\d+)", self.path)
        if not m:
            return self._json(404, {"erro": "não encontrado"})
        with conectar() as con:
            con.execute("DELETE FROM despesas WHERE id = ?", (int(m.group(1)),))
        self._json(200, {"ok": True})

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    criar_tabela()
    servidor = ThreadingHTTPServer((HOST, PORT), Handler)
    url = f"http://{HOST}:{PORT}"
    print(f"Despesas da família rodando em {url} (Ctrl+C para parar)")
    webbrowser.open(url)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nEncerrado.")
