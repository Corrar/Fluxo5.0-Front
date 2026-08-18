// lib/adapters.js — adaptadores PUROS backend → shape do design (Etapa 2 · leva 1).
//
// Converte o produto REAL do GET /products (branch 002-FR5.0) no shape de card que as
// telas de Estoque já esperam: { sku, nome, tag, kind, disp, estoque, un, preco, img?, imgFit? }.
// NÃO renderiza nada e NÃO altera layout — só formato de dados. Exposto em window.FRAdapters.
//
// Shape real do GET /products (products.controller.ts:42-57), 1 linha por produto:
//   { id, sku, name, description, unit, tags, unit_price, sales_price, min_stock, active,
//     is_3d, production_minutes, filament_grams, image_url,
//     stock: { quantity_on_hand, quantity_reserved } }
//   - tags vem como STRING JSON (JSON.stringify(parsed), ex.: '["homolog"]') — não array.
//   - quantity_* podem vir number ou string (NUMERIC do PG) → parseNumber trata ambos.
//   - NÃO existe "disponível": calcula-se on_hand - reserved.

(function () {
  // number robusto: aceita number, string ('12.00' / '12,00'), null/undefined → 0.
  function parseNumber(v) {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  // ---------------------------------------------------------------------------------------------
  // UNIDADES QUE ACEITAM FRAÇÃO — metro, litro, quilo. Qualquer outra é de CONTAGEM (inteiro), que
  // é o default seguro para unidade nova/desconhecida.
  //
  // MORA AQUI, e não numa 4ª cópia dentro da tela: `conferencia.jsx:11` e `pages_main.jsx:567` já
  // declaram o mesmo Set como const de arquivo (a arquitetura window-globals do design não deixa
  // um part importar do outro). `lib/` é a camada que os parts JÁ consomem — pages_rest.jsx chama
  // `window.FRAdapters.parseNumber` via `repNum` desde sempre —, então é o único lugar onde esta
  // régua pode ser de verdade compartilhada. Migrar as duas cópias restantes é lote próprio;
  // está registrado no DIVIDAS.md.
  //
  // Espelha DECIMAL_UNITS do backend (requests.controller.ts:16) — se um lado mudar, o outro tem
  // de mudar junto, senão a tela aceita fração que o servidor recusa (ou o contrário).
  //
  // ⚠ trim() + toUpperCase() NÃO são cosmética: produção tem 'UND ' COM ESPAÇO no fim
  // (products.unit é texto livre). Comparação crua manda o item para o ramo errado EM SILÊNCIO.
  const DECIMAL_UNITS = new Set(['M', 'MT', 'L', 'KG']);
  function isDecimalUnit(un) {
    return DECIMAL_UNITS.has(String(un === null || un === undefined ? '' : un).trim().toUpperCase());
  }

  // unit_price (number) → 'R$ x,xx' pt-BR, 2 casas (mesmo formato do mock do design).
  function formatBRL(v) {
    return 'R$ ' + parseNumber(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // tags do backend: string JSON ('["homolog"]'), string simples, array já parseado, ou null.
  function parseTags(tags) {
    if (Array.isArray(tags)) return tags.filter(Boolean);
    if (typeof tags === 'string') {
      const s = tags.trim();
      if (!s) return [];
      if (s.charAt(0) === '[') {
        try { const a = JSON.parse(s); return Array.isArray(a) ? a.filter(Boolean) : []; } catch (_) { /* string simples */ }
      }
      return [s];
    }
    return [];
  }

  // Mapa tag→cor idêntico ao que o design usa no mock PRODUTOS.
  // Normaliza (sem acento, maiúsculo) p/ casar 'eletrica' com 'ELÉTRICA', '3d' com '3D', etc.
  const TAG_KIND = {
    HOMOLOG: 'amber', USINAGEM: 'blue', '3D': 'accent', MECANICA: 'gray',
    ELETRICA: 'amber', ACABAMENTO: 'green', EPI: 'red', FERRAMENTAS: 'blue',
  };
  function normKey(s) {
    // strip diacríticos (U+0300–U+036F) para casar 'eletrica' com 'ELÉTRICA'
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
  }
  function tagToKind(tag) {
    return TAG_KIND[normKey(tag)] || 'gray';
  }

  // Produto real (GET /products) → card do design. Puro, sem efeitos.
  function productToCard(p) {
    p = p || {};
    const stock = p.stock || {};
    const onHand = parseNumber(stock.quantity_on_hand);
    const reserved = parseNumber(stock.quantity_reserved);
    const disp = onHand - reserved;
    const minStock = parseNumber(p.min_stock);
    const tags = parseTags(p.tags);
    const first = tags.length ? String(tags[0]) : null;
    const tag = first ? first.toUpperCase() : null; // null → sem badge
    const precoNum = parseNumber(p.unit_price);
    const status = disp <= 0 ? 'esgotado' : disp <= minStock ? 'baixo' : 'ok';
    const img = p.image_url || undefined;
    return {
      // ---- shape consumido pelo design (idêntico ao mock) ----
      sku: p.sku || '',
      nome: p.name || '',
      tag: tag,
      kind: tag ? tagToKind(tag) : 'gray',
      disp: disp,
      estoque: onHand,
      // RESERVADO exposto (não só usado para calcular `disp`): a recontagem física precisa do PISO
      // antes de o operador digitar — o servidor recusa contagem abaixo do reservado
      // (AJUSTE_ABAIXO_RESERVA), e sem este campo o piso só apareceria como 400 depois do envio.
      reserved: reserved,
      un: p.unit || '',
      preco: formatBRL(precoNum),
      img: img,
      imgFit: img ? 'contain' : undefined,
      // ---- extras p/ lógica atual e ações da PRÓXIMA leva (UI ainda não usa) ----
      status: status,               // 'esgotado' | 'baixo' | 'ok' (baixo = disp <= min_stock)
      min_stock: minStock,
      precoNum: precoNum,
      sales_price: parseNumber(p.sales_price),
      product_id: p.id || null,     // usado nas escritas de produto (leva futura)
      stock_id: null,               // GET /products NÃO expõe o id da linha de stock; virá do GET /stock
      tags: tags,
      active: p.active !== false,
    };
  }

  window.FRAdapters = { productToCard, parseNumber, formatBRL, parseTags, tagToKind, isDecimalUnit, DECIMAL_UNITS };
})();
