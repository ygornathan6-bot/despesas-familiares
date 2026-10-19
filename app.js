const CATEGORIAS = ["Moradia", "Mercado", "Transporte", "Saúde", "Educação", "Lazer", "Contas", "Outros"];
const $ = (s) => document.querySelector(s);
const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hoje = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

// Armazenamento: usa o servidor Python (SQLite) se estiver rodando;
// se o HTML for aberto direto no Chrome, guarda no próprio navegador (localStorage).
const Store = {
  modo: "local",
  async carregar() {
    try {
      const r = await fetch("/api/despesas");
      if (!r.ok) throw new Error();
      const dados = await r.json();
      this.modo = "api";
      return dados;
    } catch {
      this.modo = "local";
      try { return JSON.parse(localStorage.getItem("despesas") || "[]"); } catch { return []; }
    }
  },
  async adicionar(d, lista) {
    if (this.modo === "api") {
      const r = await fetch("/api/despesas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
      if (!r.ok) throw new Error("Falha ao salvar");
      return await r.json();
    }
    const nova = { ...d, id: Date.now() };
    localStorage.setItem("despesas", JSON.stringify([...lista, nova]));
    return nova;
  },
  async remover(id, lista) {
    if (this.modo === "api") {
      const r = await fetch("/api/despesas/" + id, { method: "DELETE" });
      if (!r.ok) throw new Error("Falha ao excluir");
      return;
    }
    localStorage.setItem("despesas", JSON.stringify(lista.filter((x) => x.id !== id)));
  },
};

let itens = [];

const doMes = () => itens.filter((i) => i.data.startsWith($("#mes").value))
  .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);

function agrupar(lista, chave) {
  const m = {};
  lista.forEach((i) => { m[i[chave]] = (m[i[chave]] || 0) + i.valor; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

function barras(alvo, grupos, total) {
  alvo.replaceChildren();
  if (!grupos.length) { alvo.append(el("p", "vazio", "Sem dados neste mês.")); return; }
  grupos.forEach(([nome, valor]) => {
    const pct = total ? (valor / total) * 100 : 0;
    const linha = el("div", "barra-linha");
    const info = el("div", "barra-info");
    info.append(el("span", "", nome), el("span", "", brl(valor) + " · " + pct.toFixed(0) + "%"));
    const trilho = el("div", "trilho");
    const fill = document.createElement("i");
    fill.style.width = pct + "%";
    trilho.append(fill);
    linha.append(info, trilho);
    alvo.append(linha);
  });
}

function renderLista(lista) {
  const alvo = $("#lista");
  alvo.replaceChildren();
  if (!lista.length) { alvo.append(el("p", "vazio", "Nenhuma despesa neste mês. Adicione a primeira no formulário.")); return; }
  const wrap = el("div", "rolagem");
  const t = el("table");
  const cab = el("tr");
  [["Data", ""], ["Descrição", ""], ["Categoria", ""], ["Quem", ""], ["Valor", "num"], ["", ""]].forEach(([n, c]) => cab.append(el("th", c, n)));
  const thead = el("thead"); thead.append(cab);
  const tbody = el("tbody");
  lista.forEach((i) => {
    const tr = el("tr");
    const [y, m, d] = i.data.split("-");
    tr.append(el("td", "", d + "/" + m + "/" + y), el("td", "", i.descricao), el("td", "", i.categoria), el("td", "", i.pessoa), el("td", "num", brl(i.valor)));
    const td = el("td");
    const b = el("button", "excluir", "Excluir");
    b.type = "button";
    b.setAttribute("aria-label", "Excluir " + i.descricao);
    b.addEventListener("click", async () => {
      if (!confirm("Excluir \"" + i.descricao + "\"?")) return;
      try { await Store.remover(i.id, itens); itens = itens.filter((x) => x.id !== i.id); render(); }
      catch { alert("Não foi possível excluir. Tente novamente."); }
    });
    td.append(b); tr.append(td); tbody.append(tr);
  });
  t.append(thead, tbody); wrap.append(t); alvo.append(wrap);
}

function render() {
  const lista = doMes();
  const total = lista.reduce((s, i) => s + i.valor, 0);
  $("#total").textContent = brl(total);
  $("#total-sub").textContent = lista.length === 1 ? "1 lançamento no mês" : lista.length + " lançamentos no mês";
  barras($("#cats"), agrupar(lista, "categoria"), total);
  barras($("#pessoas"), agrupar(lista, "pessoa"), total);
  renderLista(lista);
  $("#pessoas-lista").replaceChildren(...[...new Set(itens.map((i) => i.pessoa))].map((p) => { const o = document.createElement("option"); o.value = p; return o; }));
  $("#modo").textContent = Store.modo === "api"
    ? "Salvando no banco de dados local (SQLite)."
    : "Salvando neste navegador. Os dados ficam só neste computador.";
}

function exportarCSV() {
  const lista = doMes();
  const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const linhas = [["Data", "Descrição", "Categoria", "Quem", "Valor"].join(";")];
  lista.forEach((i) => linhas.push([i.data, esc(i.descricao), i.categoria, esc(i.pessoa), String(i.valor).replace(".", ",")].join(";")));
  const blob = new Blob(["\ufeff" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "despesas-" + $("#mes").value + ".csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

async function iniciar() {
  $("#mes").value = hoje().slice(0, 7);
  $("#data").value = hoje();
  CATEGORIAS.forEach((c) => { const o = document.createElement("option"); o.textContent = c; $("#categoria").append(o); });
  itens = await Store.carregar();
  render();

  $("#mes").addEventListener("change", render);
  $("#csv").addEventListener("click", exportarCSV);
  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = {
      descricao: $("#descricao").value.trim(),
      valor: Math.round(parseFloat($("#valor").value) * 100) / 100,
      data: $("#data").value,
      categoria: $("#categoria").value,
      pessoa: $("#pessoa").value.trim(),
    };
    if (!d.descricao || !d.pessoa || !(d.valor > 0)) return;
    try {
      const nova = await Store.adicionar(d, itens);
      itens.push(nova);
      $("#mes").value = d.data.slice(0, 7);
      $("#descricao").value = ""; $("#valor").value = "";
      render();
      $("#descricao").focus();
    } catch { alert("Não foi possível salvar. Tente novamente."); }
  });
}
iniciar();
