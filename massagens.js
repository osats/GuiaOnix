/* Hotel Onix — Guia do hóspede · Massagens (estilo original, folha branca).
 * Carrega massagens.json publicado pela app e constrói a tabela.
 * PT e EN; FR/ES em EN com nota discreta. Boa impressão em folha branca.
 */
(() => {
  const CARTAS_BASE = "https://osats.github.io/EmentaOnix/";

  if (!document.querySelector('link[href="massagens-tabela.css"]')) {
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = "massagens-tabela.css";
    document.head.appendChild(l);
  }

  const lang = (document.body.dataset.language || "pt").toLowerCase();
  const mlang = (lang === "pt") ? "pt" : "en";
  const L = {
    pt: { erro: "Não foi possível carregar as massagens.", nota: "", agenda: "AGENDA ABERTA" },
    en: { erro: "Could not load the massages.", nota: "", agenda: "OPEN SCHEDULE" },
    es: { erro: "No se pudieron cargar los masajes.", nota: "Tabla disponible en portugués e inglés.", agenda: "AGENDA ABIERTA" },
    fr: { erro: "Impossible de charger les massages.", nota: "Table disponible en portugais et anglais.", agenda: "AGENDA OUVERT" },
  };
  const t = L[lang] || L.pt;
  const root = document.getElementById("mass-root");
  if (!root) return;
  const esc = (s) => String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const pick = (o) => (o && (o[mlang] || o.pt)) || "";

  function itemHTML(it) {
    const desc = pick(it.desc);
    return `<div class="m-item">
      <div class="m-info"><div class="m-name">${esc(pick(it.nome))}
        ${it.duracao ? `<span class="m-dur">${esc(it.duracao)}</span>` : ""}</div>
        ${desc ? `<div class="m-desc">${esc(desc)}</div>` : ""}</div>
      <div class="m-price">${it.preco ? Number(it.preco).toLocaleString(mlang === "pt" ? "pt-PT" : "en-GB", {minimumFractionDigits:2, maximumFractionDigits:2}) + " €" : ""}</div></div>`;
  }

  function render(data) {
    if (!data || !data.categorias || !data.categorias.length) {
      root.innerHTML = `<div class="mtab"><p>${esc(t.erro)}</p></div>`; return;
    }
    const titulo = (data.titulo && (data.titulo[mlang] || data.titulo.pt)) || "Massagens";
    let corpo = "";
    data.categorias.forEach((cat, i) => {
      // primeira categoria sem rótulo (é a lista principal); as seguintes com rótulo
      if (i > 0) corpo += `<div class="m-section${i > 0 ? " m-couple" : ""}">${esc(pick(cat.nome))}</div>`;
      corpo += cat.itens.map(itemHTML).join("");
    });
    const nota = t.nota ? `<div class="m-idioma-nota">${esc(t.nota)}</div>` : "";
    const rod = data.nota && pick(data.nota);
    root.innerHTML = `<div class="mtab">
      ${nota}
      <div class="m-header"><img class="m-logo" src="assets/salutis-logo.svg" alt="Salutis"><h2>${esc(titulo)}</h2><div class="m-rule"></div></div>
      <div class="m-list">${corpo}</div>
      <div class="m-footer"><div class="m-agenda">${esc(t.agenda)}</div>
        ${rod ? `<div class="m-marc">${esc(rod)}</div>` : ""}</div>
    </div>`;
  }

  fetch(CARTAS_BASE + "massagens.json?t=" + Date.now(), { cache: "no-store" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(() => { root.innerHTML = `<div class="mtab"><p>${esc(t.erro)}</p></div>`; });
})();
