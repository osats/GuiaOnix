/* Hotel Onix — Guia do hóspede · Restaurante & Bar
 *
 * Carrega os JSON publicados no GitHub Pages e constrói:
 *   - Ementa do dia   (menu_executivo.json)  — muda diariamente
 *   - Carta Restaurante (restaurante.json)
 *   - Bar Grevin        (grevin.json)
 *
 * Ementas apenas em PT e EN. Nas versões FR/ES, mostra a carta em EN com
 * indicação discreta de que está disponível em PT e EN.
 * Layout próprio para telemóvel (não reutiliza o HTML de impressão).
 */
(() => {
  // ── Origem dos JSON publicados (ajustar se mudar de repositório) ──────────
  const CARTAS_BASE = "https://osats.github.io/EmentaOnix/";

  const lang = (document.body.dataset.language || "pt").toLowerCase();
  // menus só existem em pt/en; es e fr mostram en
  const mlang = (lang === "pt") ? "pt" : "en";

  const L = {
    pt: { dia: "Ementa do dia", carta: "Carta Restaurante", bar: "Bar Grevin",
          preco: "Preço", menuexec: "Menu executivo", alerg: "Alergénios",
          semdia: "Ainda não há ementa publicada para hoje.",
          erro: "Não foi possível carregar os menus. Tente novamente mais tarde.",
          nota: "", atualizado: "Atualizado", meia: "½ garrafa" },
    en: { dia: "Menu of the day", carta: "Restaurant Menu", bar: "Grevin Bar",
          preco: "Price", menuexec: "Set menu", alerg: "Allergens",
          semdia: "No menu published for today yet.",
          erro: "Could not load the menus. Please try again later.",
          nota: "", atualizado: "Updated", meia: "½ bottle" },
    es: { dia: "Menú del día", carta: "Carta del Restaurante", bar: "Bar Grevin",
          preco: "Precio", menuexec: "Menú ejecutivo", alerg: "Alérgenos",
          semdia: "Aún no hay menú publicado para hoy.",
          erro: "No se pudieron cargar los menús. Inténtelo más tarde.",
          nota: "Carta disponible en portugués e inglés.", atualizado: "Actualizado", meia: "½ botella" },
    fr: { dia: "Menu du jour", carta: "Carte du Restaurant", bar: "Bar Grevin",
          preco: "Prix", menuexec: "Menu exécutif", alerg: "Allergènes",
          semdia: "Aucun menu publié pour aujourd'hui.",
          erro: "Impossible de charger les menus. Réessayez plus tard.",
          nota: "Carte disponible en portugais et anglais.", atualizado: "Mis à jour", meia: "½ bouteille" },
  };
  const t = L[lang] || L.pt;

  const root = document.getElementById("rb-root");
  if (!root) return;

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const money = (v) => (v || v === 0) ? "€ " + Number(v).toFixed(2) : "";

  function chipsAlerg(codes, legenda) {
    if (!codes || !codes.length) return "";
    const parts = codes.map((c) => {
      const info = (legenda && legenda[c]) || {};
      const nome = info[mlang] || info.pt || c;
      return `<span class="rb-al" title="${esc(nome)}">${esc(c)}</span>`;
    });
    return `<span class="rb-als">${parts.join("")}</span>`;
  }

  function itemHTML(it, tipo, legenda) {
    const nome = esc(it.nome[mlang] || it.nome.pt);
    const en = (mlang === "pt" && it.nome.en && it.nome.en !== it.nome.pt)
      ? `<div class="rb-en">${esc(it.nome.en)}</div>` : "";
    const desc = it.desc && (it.desc[mlang] || it.desc.pt)
      ? `<div class="rb-desc">${esc(it.desc[mlang] || it.desc.pt)}</div>` : "";
    let preco;
    if (tipo === "vinhos" && it.preco_meia) {
      preco = `<span class="rb-meia">${t.meia} ${money(it.preco_meia)}</span> ${money(it.preco)}`;
    } else {
      preco = money(it.preco);
    }
    const reg = (it.regiao) ? `<span class="rb-reg">${esc(it.regiao)}</span>` : "";
    return `<div class="rb-item">
      <div class="rb-item-main"><div class="rb-name">${nome}${reg}</div>${en}${desc}
        ${chipsAlerg(it.alergenios, legenda)}</div>
      <div class="rb-price">${preco}</div></div>`;
  }

  function cartaHTML(data) {
    if (!data || !data.categorias || !data.categorias.length) return "";
    const legenda = data.alergenios_legenda || {};
    let out = "";
    if (data.titulo) {
      out += `<h3 class="rb-titulo">${esc(data.titulo[mlang] || data.titulo.pt)}</h3>`;
    }
    for (const cat of data.categorias) {
      out += `<div class="rb-cat">${esc(cat.nome[mlang] || cat.nome.pt)}</div>`;
      let regAtual = null;
      for (const it of cat.itens) {
        if (cat.tipo === "vinhos" && it.regiao && it.regiao !== regAtual) {
          out += `<div class="rb-regcab">${esc(it.regiao)}</div>`;
          regAtual = it.regiao;
        }
        out += itemHTML(it, cat.tipo, legenda);
      }
    }
    return out;
  }

  function menuDiaHTML(data) {
    if (!data || !data.pratos) return `<p class="rb-vazio">${esc(t.semdia)}</p>`;
    const p = data.pratos;
    const legenda = data.alergenios_legenda || {};
    const ordem = ["sopa", "peixe", "carne", "sobremesa"];
    const rotulos = {
      pt: { sopa: "Sopa", peixe: "Peixe", carne: "Carne", sobremesa: "Sobremesa" },
      en: { sopa: "Soup", peixe: "Fish", carne: "Meat", sobremesa: "Dessert" },
    }[mlang];
    const temPratos = ordem.some((k) => p[k]);
    if (!temPratos) return `<p class="rb-vazio">${esc(t.semdia)}</p>`;
    let linhas = "";
    for (const k of ordem) {
      const it = p[k];
      if (!it) continue;
      const nome = esc(it[mlang] || it.pt);
      const en = (mlang === "pt" && it.en && it.en !== it.pt) ? `<div class="rb-en">${esc(it.en)}</div>` : "";
      linhas += `<div class="rb-dia-item"><span class="rb-dia-rot">${esc(rotulos[k])}</span>
        <div><div class="rb-name">${nome}</div>${en}${chipsAlerg(it.alergenios, legenda)}</div></div>`;
    }
    const preco = data.preco ? `<div class="rb-dia-preco">${money(data.preco)}</div>` : "";
    const rod = (data.rodape && data.rodape[mlang === "pt" ? "pt" : "en"])
      ? `<p class="rb-rodape">${esc(data.rodape[mlang === "pt" ? "pt" : "en"])}</p>` : "";
    const hora = (data.rodape && data.rodape.horario) ? `<p class="rb-rodape">${esc(data.rodape.horario)}</p>` : "";
    return `<div class="rb-dia">${preco}${linhas}${rod}${hora}</div>`;
  }

  async function fetchJSON(nome) {
    const url = CARTAS_BASE + nome + "?t=" + Date.now();
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(nome + " " + r.status);
    return r.json();
  }

  function tabsSkeleton() {
    const nota = t.nota ? `<p class="rb-idioma-nota">${esc(t.nota)}</p>` : "";
    root.innerHTML = `
      ${nota}
      <div class="rb-tabs" role="tablist">
        <button class="rb-tab is-active" data-panel="dia">${esc(t.dia)}</button>
        <button class="rb-tab" data-panel="carta">${esc(t.carta)}</button>
        <button class="rb-tab" data-panel="bar">${esc(t.bar)}</button>
      </div>
      <div class="rb-panel is-active" id="rb-p-dia"><p class="rb-load">…</p></div>
      <div class="rb-panel" id="rb-p-carta"><p class="rb-load">…</p></div>
      <div class="rb-panel" id="rb-p-bar"><p class="rb-load">…</p></div>`;
    root.querySelectorAll(".rb-tab").forEach((b) => {
      b.addEventListener("click", () => {
        root.querySelectorAll(".rb-tab").forEach((x) => x.classList.remove("is-active"));
        root.querySelectorAll(".rb-panel").forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
        document.getElementById("rb-p-" + b.dataset.panel).classList.add("is-active");
      });
    });
  }

  async function load() {
    tabsSkeleton();
    const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

    try {
      const dia = await fetchJSON("menu_executivo.json").catch(() => null);
      set("rb-p-dia", menuDiaHTML(dia));
    } catch (e) { set("rb-p-dia", `<p class="rb-vazio">${esc(t.semdia)}</p>`); }

    try {
      const rest = await fetchJSON("restaurante.json");
      set("rb-p-carta", cartaHTML(rest) || `<p class="rb-vazio">${esc(t.erro)}</p>`);
    } catch (e) { set("rb-p-carta", `<p class="rb-vazio">${esc(t.erro)}</p>`); }

    try {
      const bar = await fetchJSON("grevin.json");
      set("rb-p-bar", cartaHTML(bar) || `<p class="rb-vazio">${esc(t.erro)}</p>`);
    } catch (e) { set("rb-p-bar", `<p class="rb-vazio">${esc(t.erro)}</p>`); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
