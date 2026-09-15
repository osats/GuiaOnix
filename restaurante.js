/* Hotel Onix — Guia do hóspede · Restaurante & Bar
 * Carrega os JSON publicados no GitHub e constrói, com o aspeto das cartas PDF:
 *   Ementa do dia (menu_executivo.json), Carta Restaurante (restaurante.json),
 *   Bar Grevin (grevin.json). PT e EN; FR/ES em EN com nota discreta.
 * Alergénios com SÍMBOLOS (assets/allergens/<CODE>.png), não letras.
 * Restaurante = folha creme; Bar Grevin = folha bordô (Wine Bar).
 */
(() => {
  const CARTAS_BASE = "https://osats.github.io/EmentaOnix/";
  const ICONS = "assets/allergens/";

  if (!document.querySelector('link[href="menu-pdf.css"]')) {
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = "menu-pdf.css";
    document.head.appendChild(l);
  }

  const lang = (document.body.dataset.language || "pt").toLowerCase();
  const mlang = (lang === "pt") ? "pt" : "en";

  const L = {
    pt: { dia: "Ementa do dia", carta: "Carta Restaurante", bar: "Bar Grevin",
          semdia: "Ainda não há ementa publicada para hoje.",
          erro: "Não foi possível carregar os menus.", nota: "" },
    en: { dia: "Menu of the day", carta: "Restaurant Menu", bar: "Grevin Bar",
          semdia: "No menu published for today yet.",
          erro: "Could not load the menus.", nota: "" },
    es: { dia: "Menú del día", carta: "Carta del Restaurante", bar: "Bar Grevin",
          semdia: "Aún no hay menú publicado para hoy.",
          erro: "No se pudieron cargar los menús.", nota: "Carta disponible en portugués e inglés." },
    fr: { dia: "Menu du jour", carta: "Carte du Restaurant", bar: "Bar Grevin",
          semdia: "Aucun menu publié pour aujourd'hui.",
          erro: "Impossible de charger les menus.", nota: "Carte disponible en portugais et anglais." },
  };
  const t = L[lang] || L.pt;

  const HEAD = {
    restaurante: { nome: "RESTAURANTE", horas: "12H30–14H30 · 19H30–21H30",
                   sub: { pt: "Cozinha portuguesa · Sabores da região", en: "Portuguese cuisine · Regional flavours" }, winebar: "" },
    grevin:      { nome: "BAR GREVIN", horas: "16H00 – 23H00",
                   sub: { pt: "Tapas, vinho e refeições ligeiras", en: "Tapas, wine and light meals" }, winebar: "Wine Bar" },
  };
  const AL_NOME = {
    A:{pt:"Glúten",en:"Gluten"},B:{pt:"Leite",en:"Milk"},C:{pt:"Ovos",en:"Eggs"},D:{pt:"Soja",en:"Soya"},
    E:{pt:"Aipo",en:"Celery"},F:{pt:"Mostarda",en:"Mustard"},G:{pt:"Frutos de casca rija",en:"Tree nuts"},
    H:{pt:"Amendoim",en:"Peanuts"},I:{pt:"Sulfitos",en:"Sulphites"},M:{pt:"Moluscos",en:"Molluscs"},
    N:{pt:"Sésamo",en:"Sesame"},O:{pt:"Peixe",en:"Fish"},P:{pt:"Crustáceos",en:"Crustaceans"},Q:{pt:"Tremoço",en:"Lupin"} };

  const root = document.getElementById("rb-root");
  if (!root) return;
  const esc = (s) => String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const money = (v) => (v || v === 0) ? Number(v).toFixed(2).replace(".", ",") + " €" : "";
  const alNome = (c, legenda) => (legenda && legenda[c] && (legenda[c][mlang] || legenda[c].pt)) || (AL_NOME[c] && AL_NOME[c][mlang]) || c;

  function als(codes, legenda) {
    if (!codes || !codes.length) return "";
    return `<div class="pm-als">` + codes.map((c) =>
      `<img class="pm-al" src="${ICONS}${esc(c)}.png" alt="${esc(alNome(c, legenda))}" title="${esc(alNome(c, legenda))}">`
    ).join("") + `</div>`;
  }
  function legendaHTML(legenda) {
    const codes = legenda ? Object.keys(legenda) : Object.keys(AL_NOME);
    return `<div class="pm-legend">` + codes.map((c) =>
      `<span><img class="pm-al" src="${ICONS}${esc(c)}.png" alt="">${esc(alNome(c, legenda))}</span>`
    ).join("") + `</div>`;
  }

  function header(kind) {
    const h = HEAD[kind] || { nome: "", horas: "" };
    return `<div class="pm-header"><div class="pm-brand"><img src="assets/onix-logo.png" alt="Hotel Onix"></div>
      <div class="pm-head-right"><div class="pm-cat-name">${esc(h.nome)}</div>
      ${h.horas ? `<div class="pm-hours">${esc(h.horas)}</div>` : ""}</div></div>`;
  }

  function itemHTML(it, tipo, legenda) {
    const nome = esc(it.nome[mlang] || it.nome.pt);
    const en = (mlang === "pt" && it.nome.en && it.nome.en !== it.nome.pt) ? `<div class="pm-en">${esc(it.nome.en)}</div>` : "";
    const desc = it.desc && (it.desc[mlang] || it.desc.pt) ? `<div class="pm-desc">${esc(it.desc[mlang] || it.desc.pt)}</div>` : "";
    let preco = (tipo === "vinhos" && it.preco_meia)
      ? `<span class="pm-half">½ ${money(it.preco_meia)}</span><br>${money(it.preco)}` : money(it.preco);
    return `<div class="pm-item"><div class="pm-item-main"><div class="pm-name">${nome}</div>${en}${desc}
      ${als(it.alergenios, legenda)}</div><div class="pm-price">${preco}</div></div>`;
  }

  function cartaSheet(data, kind) {
    if (!data || !data.categorias || !data.categorias.length)
      return `<div class="pm-sheet"><div class="pm-body"><p>${esc(t.erro)}</p></div></div>`;
    const legenda = data.alergenios_legenda || {};
    const h = HEAD[kind] || {};
    const titulo = esc((data.titulo && (data.titulo[mlang] || data.titulo.pt)) || "");
    const dark = kind === "grevin" ? " pm-grevin" : "";
    let cols = "", catIndex = 0, catLinks = "";
    for (const cat of data.categorias) {
      let itens = "", reg = null;
      for (const it of cat.itens) {
        if (cat.tipo === "vinhos" && it.regiao && it.regiao !== reg) { itens += `<div class="pm-reg">${esc(it.regiao)}</div>`; reg = it.regiao; }
        itens += itemHTML(it, cat.tipo, legenda);
      }
      const catId = `menu-${kind}-${catIndex++}`;
      catLinks += `<a href="#${catId}">${esc(cat.nome[mlang] || cat.nome.pt)}</a>`;
      cols += `<section class="pm-catblock" id="${catId}"><div class="pm-cat"><span class="pm-cat-number">${String(catIndex).padStart(2,"0")}</span><h2>${esc(cat.nome[mlang] || cat.nome.pt)}</h2></div>${itens}</section>`;
    }
    const sub = h.sub ? `<div class="pm-subtitle">${esc(h.sub[mlang] || h.sub.pt)}</div>` : "";
    const wine = h.winebar ? `<div class="pm-winebar">${esc(h.winebar)}</div>` : "";
    const tag = t.nota ? `<div class="pm-tag">${esc(t.nota)}</div>` : "";
    return `<div class="pm-sheet${dark}">${header(kind)}<div class="pm-body">
      <div class="pm-titlerow"><div><h1 class="pm-title">${titulo}</h1>${sub}${wine}</div>${tag}</div>
      <div class="pm-rule"></div>
      <nav class="pm-category-nav" aria-label="${esc(t.carta)}">${catLinks}</nav><div class="pm-cols">${cols}</div>
      <div class="pm-footer">${legendaHTML(legenda)}
        <div class="pm-legal">IVA incluído à taxa legal · VAT included at the legal rate</div></div>
    </div></div>`;
  }

  function diaSheet(data) {
    if (!data || !data.pratos) return `<div class="pm-sheet"><div class="pm-body pm-day"><p>${esc(t.semdia)}</p></div></div>`;
    const legenda = data.alergenios_legenda || {};
    const p = data.pratos, ordem = ["sopa","peixe","carne","sobremesa"];
    const rot = { pt:{sopa:"Sopa",peixe:"Peixe",carne:"Carne",sobremesa:"Sobremesa"},
                  en:{sopa:"Soup",peixe:"Fish",carne:"Meat",sobremesa:"Dessert"} }[mlang];
    if (!ordem.some((k) => p[k])) return `<div class="pm-sheet"><div class="pm-body pm-day"><p>${esc(t.semdia)}</p></div></div>`;
    let dataFmt = "";
    if (data.data) { try { dataFmt = new Date(data.data + "T00:00:00").toLocaleDateString(
      lang === "pt" ? "pt-PT" : lang, { weekday:"long", day:"numeric", month:"long" }); } catch(e){ dataFmt = data.data; } }
    let cursos = "";
    for (const k of ordem) {
      const it = p[k]; if (!it) continue;
      const en = (mlang === "pt" && it.en && it.en !== it.pt) ? `<div class="pm-day-en">${esc(it.en)}</div>` : "";
      cursos += `<div class="pm-day-course"><div class="pm-day-rot">${esc(rot[k])}</div>
        <div class="pm-day-nome">${esc(it[mlang] || it.pt)}</div>${en}${als(it.alergenios, legenda)}</div>`;
    }
    const preco = data.preco ? `<div class="pm-price-big">${money(data.preco)}</div>` : "";
    const rodTxt = data.rodape && (data.rodape[mlang === "pt" ? "pt" : "en"]);
    const rod = rodTxt ? `<div class="pm-day-note">${esc(rodTxt)}${data.rodape.horario ? "<br>" + esc(data.rodape.horario) : ""}</div>` : "";
    return `<div class="pm-sheet">${header("restaurante")}<div class="pm-body pm-day">
      <div class="pm-eyebrow">${esc(t.dia)}</div>
      ${dataFmt ? `<div class="pm-day-date">${esc(dataFmt)}</div>` : ""}
      ${preco}<div class="pm-day-rule"></div>
      ${cursos}${rod}
      <div class="pm-footer">${legendaHTML(legenda)}</div></div></div>`;
  }

  function tabs() {
    const nota = t.nota ? `<p class="rb-idioma-nota">${esc(t.nota)}</p>` : "";
    root.innerHTML = `${nota}
      <div class="rb-tabs" role="tablist">
        <button class="rb-tab is-active" role="tab" aria-selected="true" aria-controls="rb-p-dia" id="rb-tab-dia" data-p="dia">${esc(t.dia)}</button>
        <button class="rb-tab" role="tab" aria-selected="false" aria-controls="rb-p-carta" id="rb-tab-carta" data-p="carta" tabindex="-1">${esc(t.carta)}</button>
        <button class="rb-tab" role="tab" aria-selected="false" aria-controls="rb-p-bar" id="rb-tab-bar" data-p="bar" tabindex="-1">${esc(t.bar)}</button>
      </div>
      <div class="rb-panel is-active" id="rb-p-dia" role="tabpanel" aria-labelledby="rb-tab-dia"><p class="rb-load">…</p></div>
      <div class="rb-panel" id="rb-p-carta" role="tabpanel" aria-labelledby="rb-tab-carta"><p class="rb-load">…</p></div>
      <div class="rb-panel" id="rb-p-bar" role="tabpanel" aria-labelledby="rb-tab-bar"><p class="rb-load">…</p></div>`;
    root.querySelectorAll(".rb-tab").forEach((b) => b.addEventListener("click", () => {
      root.querySelectorAll(".rb-tab").forEach((x) => {x.classList.remove("is-active"); if(x.matches("button")){x.setAttribute("aria-selected","false");x.tabIndex=-1;}});
      root.querySelectorAll(".rb-panel").forEach((x) => {x.classList.remove("is-active"); if(x.matches("button")){x.setAttribute("aria-selected","false");x.tabIndex=-1;}});
      b.classList.add("is-active"); b.setAttribute("aria-selected","true"); b.tabIndex=0;
      document.getElementById("rb-p-" + b.dataset.p).classList.add("is-active");
    }));
  }

  async function fetchJSON(nome) {
    const r = await fetch(CARTAS_BASE + nome + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error(r.status); return r.json();
  }
  // All visibility decisions use mainland Portugal, including DST.
  const portugalClock = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  });

  function menuDisponivel(menu, agora = new Date()) {
    const p = Object.fromEntries(portugalClock.formatToParts(agora)
      .map(part => [part.type, part.value]));
    const hoje = `${p.year}-${p.month}-${p.day}`;
    const minutos = Number(p.hour) * 60 + Number(p.minute);
    const temPratos = ["sopa", "peixe", "carne", "sobremesa"].some(k => {
      const prato = menu && menu.pratos && menu.pratos[k];
      return prato && [prato.pt, prato.en].some(v =>
        typeof v === "string" && v.trim().length > 0);
    });
    return Boolean(menu && menu.data === hoje && temPratos && minutos < 1290);
  }

  function mostrarDia(mostrar) {
    const botao = root.querySelector('[data-p="dia"]');
    const painel = document.getElementById("rb-p-dia");
    if (!mostrar && botao.classList.contains("is-active")) {
      root.querySelector('[data-p="carta"]').click();
    }
    botao.disabled = !mostrar;
    for (const el of [botao, painel]) {
      if (mostrar) el.style.removeProperty("display");
      else el.style.setProperty("display", "none", "important");
    }
  }

  async function load() {
    tabs();
    // Keep the day tab hidden until its date and content have been checked.
    mostrarDia(false);
    const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
    let menu = null;
    let refreshPending = false;
    let interacted = false;
    let requestedTab = location.hash.slice(1);
    const selectLinkedTab = () => {
      requestedTab = location.hash.slice(1);
      if (!['dia','carta','bar'].includes(requestedTab)) return;
      const tab = root.querySelector('[data-p="' + requestedTab + '"]');
      if (tab && !tab.disabled) tab.click();
      else if (requestedTab === 'dia') root.querySelector('[data-p="carta"]').click();
    };
    selectLinkedTab();
    window.addEventListener('hashchange', () => { interacted = true; selectLinkedTab(); });
    root.querySelectorAll(".rb-tab").forEach(b =>
      b.addEventListener("click", e => { if (e.isTrusted) interacted = true; }));

    async function atualizarDia(inicial = false) {
      if (refreshPending) return;
      refreshPending = true;
      try {
        menu = await fetchJSON("menu_executivo.json");
        set("rb-p-dia", diaSheet(menu));
      } catch (e) {
        menu = null;
      } finally {
        refreshPending = false;
        const disponivel = menuDisponivel(menu);
        mostrarDia(disponivel);
        if (inicial && disponivel && !interacted && (!requestedTab || requestedTab === 'dia')) {
          root.querySelector('[data-p="dia"]').click();
        }
      }
    }

    const verificar = () => mostrarDia(menuDisponivel(menu));
    // Hide at closing time even when the page stays open.
    setInterval(verificar, 1000);
    // Pick up a menu published after this page was opened.
    setInterval(() => atualizarDia(), 60000);
    document.addEventListener("visibilitychange", () => {
      verificar();
      if (!document.hidden) atualizarDia();
    });
    window.addEventListener("pageshow", verificar);

    await Promise.all([
      atualizarDia(true),
      fetchJSON("restaurante.json")
        .then(data => set("rb-p-carta", cartaSheet(data, "restaurante")))
        .catch(() => set("rb-p-carta", `<p class="rb-vazio">${esc(t.erro)}</p>`)),
      fetchJSON("grevin.json")
        .then(data => set("rb-p-bar", cartaSheet(data, "grevin")))
        .catch(() => set("rb-p-bar", `<p class="rb-vazio">${esc(t.erro)}</p>`))
    ]);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
