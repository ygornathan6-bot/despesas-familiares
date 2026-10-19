# Despesas da família

Sistema simples para organizar as despesas da casa: lançamento, total do mês,
resumo por categoria e por pessoa, e exportação para CSV (abre no Excel).

## Como usar

**Opção 1 — só o navegador:** gere o arquivo único e abra no Chrome.

```bash
python build_standalone.py
```

Depois abra `despesas-familiares.html`. Os dados ficam no próprio navegador (localStorage).

**Opção 2 — com Python e banco SQLite:**

```bash
python app.py
```

Abre em http://127.0.0.1:8000 e salva em `despesas.db`. Precisa apenas do Python 3.8+, sem instalar pacotes.

## Estrutura

- `index.html`: página
- `static/css/style.css`: estilos
- `static/js/app.js`: lógica (usa o servidor se existir; senão, o navegador)
- `app.py`: servidor local + SQLite
- `build_standalone.py`: gera o HTML de arquivo único
