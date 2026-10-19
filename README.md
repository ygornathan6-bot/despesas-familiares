# Despesas da família

Sistema simples para organizar as despesas da casa: lançamento, total do mês,
resumo por categoria e por pessoa, e exportação para CSV (abre no Excel).

## Estrutura

- `public/`: o site (HTML, CSS e JS). É o que a Vercel publica.
- `servidor/app.py`: servidor local opcional (Python + SQLite).
- `build_standalone.py`: gera `despesas-familiares.html`, arquivo único para abrir no Chrome.
- `vercel.json`: manda a Vercel publicar a pasta `public/`.

## Como usar

**Online (Vercel) ou direto no Chrome:** os dados ficam no navegador (localStorage), só naquele aparelho.

```bash
python build_standalone.py   # gera despesas-familiares.html
```

**Local com banco SQLite:**

```bash
python servidor/app.py
```

Abre em http://127.0.0.1:8000 e salva em `despesas.db`. Precisa só do Python 3.8+.
