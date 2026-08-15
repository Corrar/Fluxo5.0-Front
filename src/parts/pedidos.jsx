// pedidos.jsx — "Meus Pedidos": catálogo + carrinho (Novo Pedido) e Histórico.
import * as XLSX from 'xlsx';   // SheetJS (rodada 16, pedidos-better): modelo e parse do Importar do Excel
const { useState: useStateP } = React;

// Persistência da navegação interna de "Meus Pedidos" no F5 — MESMO padrão do
// fr_active_module (app.jsx): chave constante + getItem no init + setItem na troca,
// tudo em try/catch com guarda de valor válido. Duas chaves independentes.
const FR_PEDIDOS_VIEW_KEY = 'fr_pedidos_view';
const FR_PEDIDOS_PAGE_KEY = 'fr_pedidos_cat_page';
function frReadPedidosView() { try { const v = localStorage.getItem(FR_PEDIDOS_VIEW_KEY); return (v === 'novo' || v === 'historico') ? v : 'novo'; } catch (e) { return 'novo'; } }
function frSavePedidosView(v) { try { localStorage.setItem(FR_PEDIDOS_VIEW_KEY, v); } catch (e) {} }
function frReadPedidosCatPage() { try { const n = parseInt(localStorage.getItem(FR_PEDIDOS_PAGE_KEY), 10); return (Number.isInteger(n) && n >= 1) ? n : 1; } catch (e) { return 1; } }
function frSavePedidosCatPage(n) { try { localStorage.setItem(FR_PEDIDOS_PAGE_KEY, String(n)); } catch (e) {} }

// PEÇA 1 (integração): o catálogo do "Novo Pedido" agora vem de window.useFRProducts()
// (GET /products adaptado) — montado dentro de PageMeusPedidos. O mock antigo foi removido.
// Obs.: campos ca/vida (EPI) não existem no produto real → tratados como ausentes (sem quebrar).
// Funcionários elegíveis para receber EPI / ferramentas.
const FR_FUNCIONARIOS = ['João Silva', 'Maria Souza', 'Carlos Moura', 'Ana Paula', 'Rafael Souza', 'Bruno Teixeira', 'Júlia Ramos'];
// Histórico de entregas de EPI (dias atrás) — usado para checar reposição antes da vida útil.
const EPI_HISTORICO = [
  { sku: '2.11.0080', func: 'João Silva', dias: 28 },     // luva (vida 90) → reposição antecipada
  { sku: '6.05.0003', func: 'Maria Souza', dias: 45 },    // protetor auricular (vida 120) → antecipada
  { sku: '6.05.0002', func: 'Carlos Moura', dias: 400 },  // botina (vida 365) → ok, já passou
  { sku: '6.05.0004', func: 'Ana Paula', dias: 10 },      // máscara (vida 30) → antecipada
];
function epiUltimaEntrega(sku, func) {
  const h = EPI_HISTORICO.find((x) => x.sku === sku && x.func === func);
  return h ? h.dias : null;
}
const PED_THUMB_BG = '#ffffff';
function PedThumb({ t, c, size, radius = 12 }) {
  const out = c.disp === 0;
  return (
    <div style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, overflow: 'hidden', background: c.img ? PED_THUMB_BG : (out ? t.hover : t.accentSoft), border: `1px solid ${t.border}`, display: 'grid', placeItems: 'center' }}>
      {c.img
        ? <img loading="lazy" src={window.__asset(c.img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: size > 70 ? '12%' : '10%', boxSizing: 'border-box', filter: out ? 'grayscale(1)' : 'none' }} />
        : <Icon name="box" size={Math.round(size * 0.42)} style={{ color: out ? t.muted : t.accentText }} />}
    </div>
  );
}
// Skeleton discreto do card de catálogo (mesma silhueta) enquanto o GET /products carrega.
function PedCatalogoSkeleton({ t }) {
  const bar = (w, mb) => ({ height: 11, width: w, borderRadius: 6, background: t.hover, marginBottom: mb });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 14, padding: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
      <div style={{ width: '100%', aspectRatio: '4 / 3', borderRadius: 11, background: t.hover, marginBottom: 12 }} />
      <div style={bar('90%', 8)} />
      <div style={bar('55%', 14)} />
      <div style={{ height: 40, borderRadius: 10, background: t.hover }} />
    </div>
  );
}
const FILTROS = ['3D', 'ANTIGO', 'BOBINA', 'CAMISETA', 'EPI', 'FEIRA', 'FERRAMENTAS', 'INSUMOS', 'PROTOTIPO', 'REFORMA', 'USINAGEM'];
// OPS_FALLBACK MORREU (06/08/2026). Era o segundo mock desta tela — seis clientes que não existem
// no banco ("Metalúrgica Andrade", "Tecno Plásticos S.A.", …), usados quando o seed global estava
// vazio. Com a fonte real ligada ele não tem para que servir: se o GET /clients falhar, o certo é
// dizer que falhou (o dropdown tem estado de erro próprio), não oferecer OP inventada que o backend
// rejeitaria com 404 no envio. Vazio honesto no lugar de lista falsa.

// ── Paginação do catálogo — CÓPIA VERBATIM do padrão validado em pages_main.jsx
// (frPageList + Paginacao, PAGE_SIZE=48). Recriada aqui com nomes próprios porque
// aquele componente NÃO é exposto em window e esta tarefa toca SOMENTE pedidos.jsx.
// Mesmo contrato de props e mesmo visual do <Paginacao> de Produtos.
const PED_PAGE_SIZE = 48;
function pedPageList(current, total) {
  const delta = 2, range = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  range.push(1);
  if (left > 2) range.push('…');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push('…');
  if (total > 1) range.push(total);
  return range;
}
function PedPaginacao({ t, page, totalPages, total, start, end, onPage, unidade = 'itens' }) {
  if (total <= 0) return null;
  const cell = (extra) => ({ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 40, height: 40, padding: '0 12px', borderRadius: 11, fontSize: 13, fontWeight: 700, background: t.panel, color: t.text, border: `1px solid ${t.border}`, transition: 'background .14s, border-color .14s, filter .14s', ...extra });
  const step = (n) => { if (n < 1 || n > totalPages || n === page) return; onPage(n); };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginTop: 22 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: t.muted }}>
        <b style={{ color: t.text, fontWeight: 800 }}>{start.toLocaleString('pt-BR')}–{end.toLocaleString('pt-BR')}</b> de <b style={{ color: t.text, fontWeight: 800 }}>{total.toLocaleString('pt-BR')}</b> {unidade}
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <button aria-label="Página anterior" onClick={() => step(page - 1)}
            style={cell(page <= 1 ? { opacity: .45, cursor: 'not-allowed' } : {})}
            onMouseEnter={(e) => { if (page > 1) e.currentTarget.style.background = t.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = t.panel; }}>
            <Icon name="chevronLeft" size={16} />
          </button>
          {pedPageList(page, totalPages).map((n, i) => {
            if (n === '…') return <span key={`gap${i}`} style={{ minWidth: 22, textAlign: 'center', color: t.faint, fontSize: 13, fontWeight: 700 }}>…</span>;
            const on = n === page;
            return (
              <button key={n} aria-current={on ? 'page' : undefined} onClick={() => step(n)}
                style={cell(on ? { background: t.accent, color: t.onAccent, border: `1px solid ${t.accent}`, boxShadow: `0 4px 12px ${frHexToRgba(t.accent, 0.28)}` } : {})}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = t.hover; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = t.panel; }}>
                {n}
              </button>
            );
          })}
          <button aria-label="Próxima página" onClick={() => step(page + 1)}
            style={cell(page >= totalPages ? { opacity: .45, cursor: 'not-allowed' } : {})}
            onMouseEnter={(e) => { if (page < totalPages) e.currentTarget.style.background = t.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = t.panel; }}>
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// Bloco de atribuição de funcionário p/ itens EPI e Ferramentas.
function EpiAssign({ t, item, cat, onFunc, onJust, onFoto, big }) {
  const isEpi = cat.cat === 'EPI';
  const dias = item.funcionario && isEpi ? epiUltimaEntrega(item.sku, item.funcionario) : null;
  const early = isEpi && dias != null && dias < cat.vida;
  const fileRef = React.useRef(null);
  const pickFoto = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => onFoto(item.sku, r.result);
    r.readAsDataURL(f);
  };
  return (
    <div style={{ marginTop: big ? 16 : 10, padding: big ? 0 : 10, borderRadius: 10, background: big ? 'transparent' : t.panel, border: big ? 'none' : `1px solid ${early ? frHexToRgba('#f59e0b', 0.5) : t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <Icon name={isEpi ? 'shield' : 'tool'} size={big ? 15 : 13} style={{ color: t.accentText }} />
        <span style={{ fontSize: big ? 11.5 : 10.5, fontWeight: 800, letterSpacing: '.05em', color: t.muted, textTransform: 'uppercase' }}>Destinar a funcionário</span>
        {isEpi && <span style={{ marginLeft: 'auto', fontSize: big ? 11.5 : 10, fontWeight: 700, color: t.faint }}>{cat.ca} · vida útil {cat.vida}d</span>}
      </div>
      {/* seletor de funcionário — chips sempre visíveis (sem dropdown que corta) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {FR_FUNCIONARIOS.map((f) => {
          const on = item.funcionario === f;
          return (
            <button key={f} onClick={() => onFunc(item.sku, f)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, padding: big ? '8px 13px 8px 8px' : '6px 11px 6px 6px', borderRadius: 999, background: on ? t.accent : t.elevated, border: `1px solid ${on ? t.accent : t.border}`, transition: 'all .12s' }}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = t.elevated; }}>
              <span style={{ width: big ? 28 : 24, height: big ? 28 : 24, borderRadius: '50%', background: on ? 'rgba(255,255,255,.25)' : t.accentSoft, color: on ? t.onAccent : t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: big ? 11 : 10, fontWeight: 800 }}>{f.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
              <span style={{ fontSize: big ? 13.5 : 12.5, fontWeight: 700, color: on ? t.onAccent : t.text }}>{f}</span>
              {on && <Icon name="check" size={big ? 16 : 14} style={{ color: t.onAccent }} />}
            </button>
          );
        })}
      </div>

      {early && (
        <div style={{ marginTop: 11 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: big ? '11px 14px' : '9px 11px', borderRadius: 10, background: uiTone(t, 'amber').bg, color: uiTone(t, 'amber').fg, fontSize: big ? 12.5 : 11.5, lineHeight: 1.5 }}>
            <Icon name="alert" size={big ? 17 : 15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span><b>Reposição antecipada.</b> Último {cat.ca} entregue a {item.funcionario.split(' ')[0]} há <b>{dias} dias</b> · vida útil média <b>{cat.vida} dias</b>. Justifique e anexe foto — irá para aprovação do escritório.</span>
          </div>
          <div style={{ display: big ? 'grid' : 'block', gridTemplateColumns: big ? '1fr 200px' : undefined, gap: 12, marginTop: 11, alignItems: 'stretch' }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t.muted, marginBottom: 6 }}>O que aconteceu?</label>
              <textarea value={item.justificativa || ''} onChange={(e) => onJust(item.sku, e.target.value)} placeholder="Ex: rasgou durante o uso, perdeu, danificou…" rows={big ? 4 : 2}
                style={{ boxSizing: 'border-box', width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${(item.justificativa || '').trim() ? t.border : frHexToRgba('#f59e0b', 0.5)}`, background: t.elevated, color: t.text, fontSize: big ? 13.5 : 12.5, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: big ? 96 : 'auto' }} />
            </div>
            <div style={{ marginTop: big ? 0 : 10 }}>
              {big && <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t.muted, marginBottom: 6 }}>Foto do material</label>}
              <input ref={fileRef} type="file" accept="image/*" onChange={pickFoto} style={{ display: 'none' }} />
              {item.foto
                ? (big
                    ? <div style={{ position: 'relative', borderRadius: 11, overflow: 'hidden', border: `1px solid ${t.border}`, height: 96 }}>
                        <img src={item.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => onFoto(item.sku, null)} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 8, background: 'rgba(0,0,0,.55)', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="x" size={14} /></button>
                      </div>
                    : <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <img src={item.foto} alt="" style={{ width: 44, height: 44, borderRadius: 9, objectFit: 'cover', border: `1px solid ${t.border}` }} />
                        <button onClick={() => onFoto(item.sku, null)} style={{ all: 'unset', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: t.muted, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="x" size={13} /> Remover foto</button>
                      </div>)
                : <button onClick={() => fileRef.current && fileRef.current.click()} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: big ? '100%' : 'auto', height: big ? 96 : 36, display: 'flex', flexDirection: big ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: big ? 8 : 7, padding: big ? 0 : '0 13px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: t.accentText, background: t.accentSoft, border: big ? `1.5px dashed ${frHexToRgba(t.accent, 0.4)}` : 'none' }}><Icon name="image" size={big ? 24 : 15} /> Anexar foto</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EpiDestinoModal({ t, items, catOf, onFunc, onJust, onFoto, isEarly, onClose, onConfirm }) {
  const invalido = items.some((c) => !c.funcionario || (isEarly(c) && (!(c.justificativa || '').trim() || !c.foto)));
  const ok = items.filter((c) => c.funcionario && !(isEarly(c) && (!(c.justificativa || '').trim() || !c.foto))).length;
  const early = items.filter((c) => isEarly(c)).length;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 75, background: 'rgba(8,10,16,.62)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(1000px,97vw)', maxHeight: '94vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 22, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '24px 30px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 15 }}>
          <span style={{ width: 48, height: 48, borderRadius: 14, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="shield" size={24} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 21, fontWeight: 850, color: t.text, letterSpacing: '-.01em' }}>Destinação de EPI e Ferramentas</div>
            <div style={{ fontSize: 13.5, color: t.muted, marginTop: 3 }}>Informe o funcionário de cada item. {early > 0 ? `${early} em reposição antecipada precisam de justificativa.` : ''}</div>
          </div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}` }}><Icon name="x" size={17} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '22px 30px', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {items.map((c) => {
            const cat = catOf(c.sku);
            const done = c.funcionario && !(isEarly(c) && (!(c.justificativa || '').trim() || !c.foto));
            return (
              <div key={c.sku} style={{ borderRadius: 16, border: `1px solid ${done ? frHexToRgba('#22c55e', 0.4) : t.border}`, background: t.elevated, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <PedThumb t={t} c={cat} size={64} radius={13} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16.5, fontWeight: 800, color: t.text }}>{cat.nome}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 6, flexWrap: 'wrap' }}>
                      <Badge t={t} kind="gray">{c.sku}</Badge>
                      <span style={{ fontSize: 12, fontWeight: 700, color: t.faint }}>{c.qtd} un</span>
                      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', padding: '3px 9px', borderRadius: 7, background: t.accentSoft, color: t.accentText }}>{cat.cat === 'EPI' ? 'EPI' : 'FERRAMENTA'}</span>
                    </div>
                  </div>
                  {done && <span style={{ width: 32, height: 32, borderRadius: '50%', background: uiTone(t, 'green').bg, color: uiTone(t, 'green').fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="check" size={18} /></span>}
                </div>
                <EpiAssign t={t} item={c} cat={cat} onFunc={onFunc} onJust={onJust} onFoto={onFoto} big />
              </div>
            );
          })}
        </div>
        <div style={{ padding: '16px 30px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13.5, color: t.muted }}><b style={{ color: t.text }}>{ok}/{items.length}</b> destinados</div>
          <button onClick={() => !invalido && onConfirm()} disabled={invalido} style={{ all: 'unset', boxSizing: 'border-box', cursor: invalido ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, height: 50, padding: '0 28px', borderRadius: 13, fontSize: 14.5, fontWeight: 800, background: invalido ? t.elevated : t.accent, color: invalido ? t.faint : t.onAccent, boxShadow: invalido ? 'none' : `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` }}>
            <Icon name="check" size={18} /> {early > 0 ? 'Enviar p/ aprovação' : 'Confirmar solicitação'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== PEÇA 2 (integração): histórico REAL via GET /requests/my =====
// Mesmo padrão do useFRProducts (products.js), colocado AQUI de propósito para não criar um 3º
// arquivo nem tocar no main.jsx — só pedidos.jsx. Adapta cada pedido ao shape que a tela já
// consome (idêntico ao mock MEUS_PEDIDOS): { id, req, sol, setor, op, status, time, itens:[{nome,sku,qtd}] }.

// Backend → vocabulário da tela (SOL_STATUS). Status real de requests: aberto/aprovado/conferido/
// entregue/rejeitado/devolvido. 'conferido' FALTAVA e caía no fallback: um pedido já conferido,
// pronto para sair, aparecia aqui como "Em Análise". Agora bate 1:1 com o mapa gêmeo do
// pages_admin (FR_REQ_STATUS_MAP_ADMIN), que é o que o comentário de lá sempre prometeu.
const FR_REQ_STATUS_MAP = { aberto: 'em-analise', aprovado: 'a-separar', conferido: 'em-transito', entregue: 'concluido', rejeitado: 'recusado', devolvido: 'concluido' };
function frMapReqStatus(be) { return FR_REQ_STATUS_MAP[be] || 'em-analise'; } // fallback neutro (chave válida em SOL_STATUS)

// created_at → tempo relativo pt-BR, sem libs.
function frRelTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const min = Math.floor((Date.now() - then) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  return `há ${d} dias`;
}

// O backend NÃO tem código humano de pedido. Derivamos um rótulo curto e ESTÁVEL do uuid
// ("PED-" + 6 primeiros hex do id) — não sequencial, sem risco de colidir.
function frReqLabel(id) { return 'PED-' + String(id || '').replace(/-/g, '').slice(0, 6).toUpperCase(); }

function frMyRequestToCard(r, solNome) {
  const its = Array.isArray(r.request_items) ? r.request_items : [];
  return {
    id: r.id,
    req: frReqLabel(r.id),
    sol: solNome || '—',                    // /my é do próprio user; backend não retorna requester
    setor: r.sector || '—',
    op: r.op_code || '—',                   // null = isento (EPI/ferramenta/insumo)
    status: frMapReqStatus(r.status),
    beStatus: r.status,                     // status CRU — quem decide se dá pra cancelar é ele, não o rótulo
    time: frRelTime(r.created_at),
    itens: its.map((it) => ({
      id: it.id,
      nome: (it.products && it.products.name) || it.custom_product_name || 'Item',
      sku: (it.products && it.products.sku) || '',
      un: (it.products && it.products.unit) || '',
      qtd: Number(it.quantity_requested) || 0,
      // FURO fechado (rodada 16): o /my SEMPRE mandou quantity_delivered/conference_note e este
      // adapter os descartava — o drawer 'mine' lê it.enviada/it.justificativa (mesmo contrato do
      // lado admin, pages_admin) e por isso NUNCA mostrava a QTD AJUSTADA aqui. Mesma semântica
      // de lá: null = nunca ajustado (foi tudo) | número = ajustado (incl. 0).
      enviada: it.quantity_delivered == null ? null : Number(it.quantity_delivered),
      justificativa: it.conference_note || null,
    })),
  };
}

function useFRMyRequests() {
  const R = window.React;
  const [items, setItems] = R.useState([]);
  const [loading, setLoading] = R.useState(true);
  const [error, setError] = R.useState(null);
  const mounted = R.useRef(true);
  const load = R.useCallback(function () {
    setLoading(true); setError(null);
    const prof = (window.FRAuth && window.FRAuth.profile) || {};
    const solNome = prof.name || null;
    window.FRApi.get('/requests/my', { skipLoading: true })
      .then(function (res) {
        if (!mounted.current) return;
        const rows = Array.isArray(res && res.data) ? res.data : [];
        setItems(rows.map(function (r) { return frMyRequestToCard(r, solNome); }));
        setLoading(false);
      })
      .catch(function (e) {
        if (!mounted.current) return;
        const getMsg = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
        setError(getMsg ? getMsg(e) : 'Não foi possível carregar os seus pedidos.');
        setLoading(false);
      });
  }, []);
  R.useEffect(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);
  return { items: items, loading: loading, error: error, reload: load };
}

// Skeleton discreto do card de histórico (mesma silhueta) enquanto GET /requests/my carrega.
function PedHistSkeleton({ t }) {
  const bar = (w, h, mb) => ({ width: w, height: h, borderRadius: 6, background: t.hover, marginBottom: mb });
  return (
    <Card t={t} style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={bar(92, 20, 0)} /><div style={bar(48, 13, 0)} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: t.hover, flexShrink: 0 }} />
        <div style={{ flex: 1 }}><div style={bar('68%', 13, 7)} /><div style={bar('28%', 11, 0)} /></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 13, borderTop: `1px solid ${t.border}` }}>
        <div style={bar(70, 12, 0)} /><div style={bar(84, 12, 0)} />
      </div>
    </Card>
  );
}

// SKU canônico d.dd.dddd — MESMO normalizador do import da Entrada por NF e do Inventário do
// Catálogo: tolera zero à esquerda e segmento curto; sem os 2 pontos devolve cru (não casa →
// "desconhecido" honesto).
function pedNormSku(v) {
  const s = String(v == null ? '' : v).trim();
  const m = s.match(/^0*(\d)\.0*(\d{1,2})\.0*(\d{1,4})$/);
  if (!m) return s;
  return `${m[1]}.${m[2].padStart(2, '0')}.${m[3].padStart(4, '0')}`;
}

// "Importar do Excel" VIVO (rodada 16, pedidos-better) — padrão do InventarioModal do Catálogo:
// modelo .xlsx real (SheetJS, colunas SKU/Quantidade, pré-preenchido com o catálogo pedível),
// drag-drop/parse .xlsx/.csv e PREVIEW com match contra o catálogo REAL carregado. Tudo
// CLIENT-SIDE: "Adicionar ao carrinho" só mexe no carrinho; o pedido continua saindo pelo
// MESMO POST /requests de sempre, shape intocado.
//
// Regras do preview (lição do lote anterior: NADA em silêncio):
//   • SKU fora de /products                → "SKU desconhecido", não entra;
//   • SKU de EPI/Ferramentas               → não entra (categorias neutralizadas nesta tela —
//     o destino por funcionário ainda não persiste no backend; mesmo motivo de elas não
//     aparecerem no catálogo);
//   • esgotado (disp ≤ 0)                  → sinalizado, NÃO entra — é a regra do clique manual:
//     card esgotado não tem botão Adicionar ("Indisponível");
//   • duplicata na planilha                → SOMA as quantidades e sinaliza;
//   • quantidade acima do disponível       → entra CLAMPADA ao disponível e sinaliza (mesmo teto
//     do stepper do carrinho); item já no carrinho soma com o que está lá, sinalizado;
//   • quantidade vazia                     → linha não contada (é o contrato do modelo pré-preenchido);
//     quantidade inválida (≤0 / não-numérica) → sinalizada, não entra.
function PedImportModal({ t, catalogo, todos, cart, onClose, onAdd }) {
  const [drag, setDrag] = useStateP(false);
  const [fileName, setFileName] = useStateP(null);
  const [linhas, setLinhas] = useStateP(null);   // null = sem arquivo; [] = nada aproveitável
  const [parseErro, setParseErro] = useStateP(null);

  const baixarModelo = () => {
    const dados = [['SKU', 'Quantidade'], ...(catalogo || []).map((p) => [p.sku, ''])];
    const ws = XLSX.utils.aoa_to_sheet(dados);
    // Blindagem anti-colapso (mesma da Entrada/Inventário): SKU como TEXTO explícito, senão o
    // Excel reinterpreta "9.99.0238" como número/data e o re-upload não casa mais.
    (catalogo || []).forEach((p, i) => {
      const addr = XLSX.utils.encode_cell({ c: 0, r: i + 1 });
      ws[addr] = { t: 's', v: String(p.sku), z: '@' };
    });
    ws['!cols'] = [{ wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedido');
    XLSX.writeFile(wb, 'modelo-pedido.xlsx');
  };

  const lerArquivo = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setParseErro(null);
    setLinhas(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });   // XLSX.read cobre .xlsx e .csv
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) { setParseErro('Não foi possível ler a planilha (sem abas).'); return; }
      const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
      if (!matriz.length) { setParseErro('Planilha vazia.'); return; }
      // Cabeçalho: 1ª linha sem quantidade numérica na coluna B → pula (mesma heurística da Entrada).
      const inicio = (matriz[0] && !Number.isFinite(Number(String(matriz[0][1]).replace(',', '.')))) ? 1 : 0;
      // 1º passe: acumula por SKU normalizado — duplicata SOMA e conta ocorrências.
      const acc = new Map();
      const invalidas = [];
      for (let i = inicio; i < matriz.length; i++) {
        const linha = matriz[i] || [];
        const skuRaw = String(linha[0] == null ? '' : linha[0]).trim();
        if (!skuRaw) continue;                                        // linha vazia
        const qtdRaw = String(linha[1] == null ? '' : linha[1]).trim();
        if (qtdRaw === '') continue;                                   // sem quantidade = não pedido (contrato do modelo)
        const qtd = Number(qtdRaw.replace(',', '.'));
        const chave = pedNormSku(skuRaw);
        if (!Number.isFinite(qtd) || qtd <= 0) { invalidas.push({ sku: skuRaw, qtdRaw }); continue; }
        const cur = acc.get(chave);
        if (cur) { cur.qtd += qtd; cur.ocorrencias += 1; } else { acc.set(chave, { skuRaw, qtd, ocorrencias: 1 }); }
      }
      // 2º passe: match contra o catálogo pedível (e contra /products inteiro para separar
      // "desconhecido de verdade" de "existe mas é EPI/Ferramenta").
      const porSkuCat = new Map((catalogo || []).map((p) => [pedNormSku(p.sku), p]));
      const porSkuTodos = new Map((todos || []).map((p) => [pedNormSku(p.sku), p]));
      const out = [];
      acc.forEach((v, chave) => {
        const noCat = porSkuCat.get(chave) || null;
        const noTodos = porSkuTodos.get(chave) || null;
        const base = { sku: noCat ? noCat.sku : v.skuRaw, nome: noCat ? noCat.nome : (noTodos ? noTodos.nome : null), qtd: v.qtd, ocorrencias: v.ocorrencias, somada: v.ocorrencias > 1 };
        if (!noTodos) { out.push({ ...base, situacao: 'desconhecido', entra: false }); return; }
        if (!noCat) { out.push({ ...base, situacao: 'neutralizado', entra: false }); return; }
        if (noCat.disp <= 0) { out.push({ ...base, situacao: 'esgotado', disp: noCat.disp, entra: false }); return; }
        const noCarrinho = (cart || []).find((c) => c.sku === noCat.sku);
        const jaTem = noCarrinho ? noCarrinho.qtd : 0;
        const alvo = jaTem + v.qtd;
        const qtdFinal = Math.max(1, Math.min(alvo, noCat.disp));      // mesmo clamp do carrinho
        const ajustada = qtdFinal < alvo;
        const efetiva = qtdFinal - jaTem;
        out.push({ ...base, situacao: efetiva > 0 ? 'ok' : 'teto', disp: noCat.disp, jaTem, qtdFinal, ajustada, entra: efetiva > 0 });
      });
      invalidas.forEach((x) => out.push({ sku: x.sku, nome: null, qtd: null, qtdRaw: x.qtdRaw, situacao: 'invalida', entra: false }));
      // Ordem estável: o que entra primeiro, depois os sinalizados.
      out.sort((a, b) => (a.entra === b.entra ? 0 : a.entra ? -1 : 1));
      setLinhas(out);
    } catch (e) {
      setParseErro('Não foi possível ler a planilha. Confirme que é um .xlsx ou .csv válido.');
    }
  };

  const rows = linhas || [];
  const nEntra = rows.filter((l) => l.entra).length;
  const nEsgotado = rows.filter((l) => l.situacao === 'esgotado').length;
  const nDesconhecido = rows.filter((l) => l.situacao === 'desconhecido').length;
  const nNeutral = rows.filter((l) => l.situacao === 'neutralizado').length;
  const nSomada = rows.filter((l) => l.somada).length;
  const nAjust = rows.filter((l) => l.ajustada).length;
  const nInvalida = rows.filter((l) => l.situacao === 'invalida').length;
  const nTeto = rows.filter((l) => l.situacao === 'teto').length;
  const cRed = uiTone(t, 'red');
  const cAmb = uiTone(t, 'amber');
  const cVerde = uiTone(t, 'green');
  const miniBadge = (tone, txt, key) => (
    <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 7, background: tone.bg, color: tone.fg, whiteSpace: 'nowrap' }}>{txt}</span>
  );
  const situacaoDe = (l) => {
    if (l.situacao === 'desconhecido') return [miniBadge(cRed, 'SKU desconhecido', 'd')];
    if (l.situacao === 'neutralizado') return [miniBadge(cAmb, 'EPI/Ferramentas — fluxo próprio', 'n')];
    if (l.situacao === 'esgotado') return [miniBadge(cRed, 'Esgotado — não entra', 'e')];
    if (l.situacao === 'invalida') return [miniBadge(cRed, `qtd inválida ("${l.qtdRaw}")`, 'i')];
    const b = [];
    if (l.situacao === 'teto') b.push(miniBadge(cAmb, 'carrinho já no teto do disponível', 't'));
    else b.push(miniBadge(cVerde, 'entra no carrinho', 'ok'));
    if (l.somada) b.push(miniBadge(cAmb, `${l.ocorrencias}× na planilha — somadas`, 's'));
    if (l.jaTem > 0 && l.situacao !== 'teto') b.push(miniBadge(cAmb, `soma com ${l.jaTem} já no carrinho`, 'c'));
    if (l.ajustada && l.situacao !== 'teto') b.push(miniBadge(cAmb, `ajustada ao disponível (${l.qtdFinal})`, 'a'));
    return b;
  };
  const confirmar = () => {
    if (!nEntra) return;
    onAdd(rows.filter((l) => l.entra).map((l) => ({ sku: l.sku, qtdFinal: l.qtdFinal })));
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 75, background: 'rgba(8,10,16,.62)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(760px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="upload" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Importar do Excel</div><div style={{ fontSize: 12.5, color: t.muted }}>Monte o carrinho a partir de uma planilha SKU × Quantidade.</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 14, background: t.accentSoft, border: `1px solid ${frHexToRgba(t.accent, 0.25)}`, marginBottom: 18 }}>
            <Icon name="sheet" size={22} style={{ color: t.accentText, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>Modelo de planilha</div><div style={{ fontSize: 11.5, color: t.muted }}>Colunas: SKU · Quantidade — já vem com os materiais pedíveis; preencha só o que quiser.</div></div>
            <button onClick={baixarModelo}
              style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: t.panel, color: t.accentText, border: `1px solid ${t.border}` }}><Icon name="download" size={15} /> Baixar modelo</button>
          </div>
          <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); lerArquivo(e.dataTransfer.files[0]); }}
            style={{ display: 'block', cursor: 'pointer', borderRadius: 16, padding: '28px 20px', textAlign: 'center', border: `2px dashed ${drag ? t.accent : t.borderStrong}`, background: drag ? t.accentSoft : t.elevated, transition: 'all .15s' }}>
            <input type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={(e) => { lerArquivo(e.target.files[0]); e.target.value = ''; }} />
            <div style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: 15, display: 'grid', placeItems: 'center', background: t.accentSoft, color: t.accentText }}><Icon name="upload" size={24} /></div>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{fileName || 'Arraste a planilha ou clique para selecionar'}</div>
            <div style={{ fontSize: 12.5, color: t.muted, marginTop: 5 }}>Formatos aceitos: .xlsx, .csv</div>
          </label>
          {parseErro && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 12px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, background: cRed.bg, color: cRed.fg, border: `1px solid ${frHexToRgba(cRed.fg, 0.25)}` }}>
              <Icon name="alert" size={15} /> {parseErro}
            </div>
          )}
          {linhas && !parseErro && (
            rows.length === 0 ? (
              <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, background: cAmb.bg, color: cAmb.fg }}>Nenhuma linha com quantidade preenchida na planilha.</div>
            ) : (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <Badge t={t} kind={nEntra ? 'green' : 'amber'} dot>{nEntra} {nEntra === 1 ? 'item entra' : 'itens entram'} no carrinho</Badge>
                  {nSomada > 0 && <Badge t={t} kind="amber" dot>{nSomada} duplicata{nSomada > 1 ? 's' : ''} somada{nSomada > 1 ? 's' : ''}</Badge>}
                  {nAjust > 0 && <Badge t={t} kind="amber" dot>{nAjust} ajustada{nAjust > 1 ? 's' : ''} ao disponível</Badge>}
                  {nTeto > 0 && <Badge t={t} kind="amber" dot>{nTeto} já no teto</Badge>}
                  {nEsgotado > 0 && <Badge t={t} kind="red" dot>{nEsgotado} esgotado{nEsgotado > 1 ? 's' : ''}</Badge>}
                  {nDesconhecido > 0 && <Badge t={t} kind="red" dot>{nDesconhecido} SKU desconhecido{nDesconhecido > 1 ? 's' : ''}</Badge>}
                  {nNeutral > 0 && <Badge t={t} kind="amber" dot>{nNeutral} EPI/Ferramentas</Badge>}
                  {nInvalida > 0 && <Badge t={t} kind="red" dot>{nInvalida} qtd inválida</Badge>}
                </div>
                <div style={{ borderRadius: 14, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto', maxHeight: 260, overflowY: 'auto' }} className="fr-scroll">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520, fontSize: 13 }}>
                      <thead><tr>
                        {['SKU', 'Material', 'Qtd', 'Disp.', 'Situação'].map((h, k) => <th key={h} style={{ position: 'sticky', top: 0, textAlign: k === 2 || k === 3 ? 'right' : 'left', padding: '10px 14px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: t.faint, borderBottom: `1px solid ${t.border}`, background: t.elevated, whiteSpace: 'nowrap' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {rows.map((l, i) => (
                          <tr key={`${l.sku}-${i}`} style={{ opacity: l.entra ? 1 : 0.75 }}>
                            <td style={{ padding: '9px 14px', fontWeight: 700, color: t.text, whiteSpace: 'nowrap', borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.border}` }}>{l.sku}</td>
                            <td style={{ padding: '9px 14px', color: l.nome ? t.text : t.faint, borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.border}` }}>{l.nome || '—'}</td>
                            <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: t.text, borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.border}` }}>{l.qtd == null ? '—' : l.qtd}</td>
                            <td style={{ padding: '9px 14px', textAlign: 'right', color: t.muted, borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.border}` }}>{l.disp == null ? '—' : l.disp}</td>
                            <td style={{ padding: '9px 14px', borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.border}` }}><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{situacaoDe(l)}</div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          <span style={{ marginRight: 'auto', fontSize: 11.5, color: t.faint }}>Nada é enviado ao servidor — o pedido sai só no "Confirmar Solicitação".</span>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <button onClick={confirmar} disabled={!nEntra}
            style={{ all: 'unset', boxSizing: 'border-box', cursor: nEntra ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: t.accent, color: t.onAccent, opacity: nEntra ? 1 : 0.45 }}>
            <Icon name="cart" size={16} /> Adicionar ao carrinho{nEntra ? ` (${nEntra})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageMeusPedidos({ t: tBase, theme }) {
  // Accent da referência 21 (o roxo #7c3aed era iteração MORTA do design): índigo tema-aware.
  // selBg/selFg/selBd = cor de seleção que no claro é o índigo cheio e no escuro vira véu
  // translúcido — exatamente a lógica pedDark da referência.
  const t = frTokens(theme, '#2e3192', '#8fa8ff');
  const pedDark = theme !== 'light';
  const selBg = pedDark ? frHexToRgba('#8fa8ff', 0.16) : '#2e3192';
  const selFg = pedDark ? '#aebfff' : '#ffffff';
  const selBd = pedDark ? frHexToRgba('#8fa8ff', 0.35) : '#2e3192';
  const { mobile: pedMobile } = (window.useFRViewport ? window.useFRViewport() : { mobile: false });
  const ACCENT_DARK = '#181a54';
  const [view, setView] = useStateP(frReadPedidosView);   // F5: restaura a aba salva ('novo'|'historico'), default 'novo'
  const [q, setQ] = useStateP('');
  const [fil, setFil] = useStateP(null);
  const [disp, setDisp] = useStateP('todos');
  const [sort, setSort] = useStateP('rel');
  const [catPage, setCatPage] = useStateP(frReadPedidosCatPage);   // F5: restaura a página salva (int>=1, default 1); clamp p/ total no render via catSafePage
  const [cart, setCart] = useStateP([]);
  const [pedidos, setPedidos] = useStateP([]);
  const [filter, setFilter] = useStateP('todas');
  const [openId, setOpenId] = useStateP(null);
  const [cancelando, setCancelando] = useStateP(null);   // pedido em confirmação de cancelamento
  // ⚰️ O chip "Setor" do cabeçalho morreu com o hero roxo (ref21 não o tem) — e com ele a
  // leitura de useFRIdentidade daqui. Era exibição pura: o POST nunca mandou sector (o servidor
  // deriva do token — dívida (f), fase 2), então nada de dado muda.
  const [toast, setToast] = useStateP(false);
  const [opSel, setOpSel] = useStateP(null);
  const [opOpen, setOpOpen] = useStateP(false);
  const [opQ, setOpQ] = useStateP('');
  const [sortOpen, setSortOpen] = useStateP(false);
  const [destinoOpen, setDestinoOpen] = useStateP(false);
  const [importOpen, setImportOpen] = useStateP(false);   // rodada 16: modal Importar do Excel
  const [cartOpen, setCartOpen] = useStateP(false);        // ref21: carrinho vira drawer lateral (FAB abre)
  const [sending, setSending] = useStateP(false);   // PEÇA 3: envio em andamento (anti duplo-clique)
  const [sendErr, setSendErr] = useStateP(null);    // PEÇA 3: mensagem de erro do envio
  // PEÇA 1: catálogo REAL (GET /products adaptado) — mesmo hook/pattern que a galeria de Produtos usa.
  const { items: frProdutos, loading: catLoading, error: catError } = window.useFRProducts();
  // Shape consumido por esta tela: cat ← tag (já vem MAIÚSCULO no adapter). ca/vida (EPI) inexistem em products → ausentes.
  // NEUTRALIZAÇÃO (cadeado): itens EPI/FERRAMENTAS têm destino por funcionário que o backend AINDA não
  // persiste (funcionario/justificativa/foto descartados no submit — ver "TODO PEÇA 4" em confirmar()).
  // Escondemos essas categorias do catálogo para ninguém enviar input que some silenciosamente; sobra
  // só o destino por OP, que persiste. Reverter esta linha quando a Peça 4 ligar as colunas no backend.
  const PED_DESTINO_MOCK = new Set(['EPI', 'FERRAMENTAS']);
  const CATALOGO = frProdutos
    .map((p) => ({ ...p, cat: p.tag || null }))
    .filter((p) => !PED_DESTINO_MOCK.has(p.cat));
  // PEÇA 2: histórico REAL (GET /requests/my). Sincroniza no estado local `pedidos` para preservar
  // as ações locais (confirmar/cancelar) até a Peça 3 ligar o backend de verdade.
  const { items: myReqItems, loading: histLoading, error: histError, reload: histReload } = useFRMyRequests();
  React.useEffect(function () { setPedidos(myReqItems); }, [myReqItems]);
  // Volta à página 1 quando o filtro/busca do catálogo muda — MAS pula o mount (skip da 1ª execução)
  // p/ NÃO sobrescrever a página restaurada do localStorage no boot; reseta só em mudança de filtro SUBSEQUENTE.
  const catFilterMounted = React.useRef(false);
  React.useEffect(function () {
    if (!catFilterMounted.current) { catFilterMounted.current = true; return; }
    setCatPage(1);
  }, [q, fil, disp]);
  // Grava a página do catálogo sempre que ela muda (troca de página OU reset de filtro).
  React.useEffect(function () { frSavePedidosCatPage(catPage); }, [catPage]);
  // ===== OPs do seletor: FONTE REAL (GET /clients), não mais o seed =====
  //
  // Antes daqui saía `window.FR_OPS_ATIVAS`, montado no load de pages_clientes.jsx a partir do
  // CLIENTES_SEED — um array ESTÁTICO. O operador escolhia OP de uma lista que não era a do
  // sistema: OP criada de verdade não aparecia, e OP do seed que não existe no banco aparecia
  // (o POST então tomava 404 OP_NAO_ENCONTRADA). Coincidiam só onde os números batiam por acaso.
  // Esta tela passa a beber da mesma fonte de Apontamentos/Armazém (producaoger) e Devolução.
  //
  // "DISPONÍVEL" = NÃO CONCLUÍDA, pelo normalizador compartilhado `frIsOpConcluida`
  // (pages_clientes.jsx) — nunca por igualdade com 'em_andamento'. O motivo é de DADO, não de
  // estilo: no 2.0 o estado ATIVO se chama `pendente` (18 OPs em produção, medido em 06/08/2026),
  // e no 5.0 se chama `em_andamento`. Filtrar pela string literal esconderia as 18 no dia da carga.
  // Excluir o que acabou mantém o ativo dos DOIS vocabulários. Ver a dívida "Vocabulário de status
  // de OP divergente entre 2.0 e 5.0" no DIVIDAS.md do backend.
  //
  // O SHAPE É O MESMO de antes ([{ cliente, ops: ['73001', ...] }]) de propósito: só a fonte muda,
  // a renderização do dropdown fica intacta.
  const { items: opClientes, loading: opsLoading, error: opsError } = window.useFRClients();
  const OPS = React.useMemo(() => {
    const concluida = window.frIsOpConcluida || function () { return false; };
    return (opClientes || [])
      .map((c) => ({ cliente: c.nome, ops: (c.ops || []).filter((o) => o.op_code && !concluida(o.s)).map((o) => o.op_code) }))
      .filter((c) => c.ops.length > 0)
      .sort((a, b) => String(a.cliente).localeCompare(String(b.cliente)));
  }, [opClientes]);
  const opsView = OPS.map((c) => {
    const s = opQ.trim().toLowerCase();
    if (!s) return c;
    if (c.cliente.toLowerCase().includes(s)) return c;
    const ops = c.ops.filter((op) => op.toLowerCase().includes(s));
    return ops.length ? { ...c, ops } : null;
  }).filter(Boolean);

  const ql = q.trim().toLowerCase();
  const inCart = (sku) => cart.find((c) => c.sku === sku);
  const catCounts = CATALOGO.reduce((a, c) => { if (c.cat) a[c.cat] = (a[c.cat] || 0) + 1; return a; }, {});
  const cats = [...new Set(CATALOGO.map((c) => c.cat))].filter(Boolean).sort();
  // Busca honra o placeholder ("nome, SKU ou palavra-chave"): a palavra-chave são as etiquetas
  // REAIS do produto (todas, não só a 1ª) — antes o texto prometia e o filtro só olhava nome/SKU.
  let cat = CATALOGO.filter((c) =>
    (!fil || c.cat === fil) &&
    (!ql || c.nome.toLowerCase().includes(ql) || c.sku.includes(ql) || (c.tags || []).some((tg) => String(tg).toLowerCase().includes(ql))) &&
    (disp === 'todos' || (disp === 'disp' && c.disp > 0) || (disp === 'cart' && cart.some((x) => x.sku === c.sku)))
  );
  cat = cat.slice().sort((a, b) => {
    if (sort === 'nome') return a.nome.localeCompare(b.nome);
    if (sort === 'maior') return b.disp - a.disp;
    return 0;
  });
  // PEÇA (perf): paginação do catálogo — MESMO cálculo de pages_main.jsx (PAGE_SIZE=48, safePage, slice).
  // Opera sobre 'cat' (lista já FILTRADA+ORDENADA) e afeta SÓ o que é renderizado; o carrinho ('cart') é estado à parte.
  const catTotal = cat.length;
  const catTotalPages = Math.max(1, Math.ceil(catTotal / PED_PAGE_SIZE));
  const catSafePage = Math.min(catPage, catTotalPages);                       // clamp: nunca aponta p/ página vazia
  const catStart = catTotal === 0 ? 0 : (catSafePage - 1) * PED_PAGE_SIZE + 1;
  const catEnd = Math.min(catSafePage * PED_PAGE_SIZE, catTotal);
  const catPageItems = cat.slice((catSafePage - 1) * PED_PAGE_SIZE, catSafePage * PED_PAGE_SIZE);
  const goToCatPage = (n) => setCatPage(n);                                   // troca de página NÃO mexe no carrinho
  const dispOf = (sku) => { const m = CATALOGO.find((c) => c.sku === sku); return m ? m.disp : 0; };
  const clampQ = (sku, n) => Math.max(1, Math.min(n, dispOf(sku) || 1));
  const add = (sku) => setCart((cs) => (cs.some((c) => c.sku === sku) ? cs.map((c) => (c.sku === sku ? { ...c, qtd: clampQ(sku, c.qtd + 1) } : c)) : [...cs, { sku, qtd: 1 }]));
  // Import do Excel → carrinho (client-side): o preview já calculou o TOTAL final por SKU
  // (soma com o que estava no carrinho + clamp ao disponível), então aqui é atribuição, não soma
  // de novo — o que o usuário viu no preview é exatamente o que o carrinho vira.
  const importarAoCarrinho = (rows) => setCart((cs) => {
    const next = [...cs];
    rows.forEach((r) => {
      const i = next.findIndex((c) => c.sku === r.sku);
      if (i >= 0) next[i] = { ...next[i], qtd: r.qtdFinal };
      else next.push({ sku: r.sku, qtd: r.qtdFinal });
    });
    return next;
  });
  const step = (sku, d) => setCart((cs) => cs.map((c) => (c.sku === sku ? { ...c, qtd: clampQ(sku, c.qtd + d) } : c)));
  const del = (sku) => setCart((cs) => cs.filter((c) => c.sku !== sku));
  const setFunc = (sku, f) => setCart((cs) => cs.map((c) => (c.sku === sku ? { ...c, funcionario: f } : c)));
  const setJust = (sku, v) => setCart((cs) => cs.map((c) => (c.sku === sku ? { ...c, justificativa: v } : c)));
  const setFoto = (sku, v) => setCart((cs) => cs.map((c) => (c.sku === sku ? { ...c, foto: v } : c)));
  const needsFunc = (sku) => { const c = catOf(sku); return c.cat === 'EPI' || c.cat === 'FERRAMENTAS'; };
  const isEarly = (item) => { const c = catOf(item.sku); return c.cat === 'EPI' && item.funcionario && (() => { const d = epiUltimaEntrega(item.sku, item.funcionario); return d != null && d < c.vida; })(); };
  const setQty = (sku, raw) => { const n = parseInt(String(raw).replace(/\D/g, '')); setCart((cs) => cs.map((c) => (c.sku === sku ? { ...c, qtd: (isNaN(n) || n < 1) ? 1 : clampQ(sku, n) } : c))); };
  const nameOf = (sku) => (CATALOGO.find((c) => c.sku === sku) || {}).nome;
  const catOf = (sku) => CATALOGO.find((c) => c.sku === sku) || { sku, disp: 0 };
  const cartInvalido = cart.some((c) => needsFunc(c.sku) && (!c.funcionario || (isEarly(c) && (!(c.justificativa || '').trim() || !c.foto))));
  const precisaEscritorio = cart.some((c) => isEarly(c));
  const precisaOP = cart.some((c) => catOf(c.sku).cat !== 'EPI');   // EPI é destinado a funcionário, não a OP
  const temDestino = cart.some((c) => needsFunc(c.sku));            // há itens que precisam de funcionário
  const totalUn = cart.reduce((a, c) => a + c.qtd, 0);
  // PEÇA 3: envio REAL (POST /requests). Escreve na 002-FR5.0 (cria pedido + reserva estoque).
  const confirmar = async () => {
    if (sending) return;                                                // anti duplo-clique
    if (!cart.length || (precisaOP && !opSel) || cartInvalido) return;  // validação de OP/destino já existente (reusada)
    // ⚠️ `sector` NÃO VAI MAIS NO CORPO — dívida (f), fase 2.
    //
    // Esta tela mandava `FRAuth.profile.sector` (a identidade em MEMÓRIA) enquanto o interceptor
    // mandava o token do localStorage. Numa divergência de sessão os dois discordam, e o pedido
    // nascia com o SETOR de um usuário e o `requester_id` de OUTRO — dado errado GRAVADO, não só
    // exibido, numa tabela que a auditoria acompanha. Agora o servidor deriva o setor do MESMO
    // token que identifica o requester: uma fonte, sem como divergir.
    //
    // O DOIS SIGNIFICADOS DE `sector`, para quem vier depois: aqui ele é ORIGEM (quem pediu) e por
    // isso é identidade, proibida no corpo. Em Encomendar 3D (pages_rest.jsx) ele é DESTINO — um
    // campo que o usuário digita, "para onde vai" — que é dado de negócio legítimo e CONTINUA
    // sendo enviado. O backend só deriva quando o corpo não manda; por isso o 3D não muda.
    // Ver a dívida "requests.sector com dois significados no mesmo campo" no DIVIDAS.md do backend.
    //
    // op_code só se houver OP escolhida.
    // items: { product_id, quantity, observation? } — observation só quando houver. EPI fica p/ Peça 4.
    const payload = {
      items: cart.map((c) => {
        const it = { product_id: catOf(c.sku).product_id, quantity: c.qtd };  // product_id REAL do useFRProducts (não sku/índice)
        if (c.observation) it.observation = c.observation;
        // TODO PEÇA 4: enviar EPI (funcionario / justificativa / foto) quando o backend tiver colunas.
        return it;
      }),
    };
    if (opSel && opSel.op) payload.op_code = opSel.op;   // op_code SÓ quando preenchido (nunca chave vazia/null)
    setSending(true); setSendErr(null);
    try {
      await window.FRApi.post('/requests', payload);        // 201 { success, id }
      setCart([]); setOpSel(null); setCartOpen(false);       // drawer fecha SÓ no sucesso (erro mantém tudo à vista)
      setToast(true); setTimeout(() => setToast(false), 2600);
      if (typeof histReload === 'function') histReload();    // recarrega histórico → novo pedido aparece
    } catch (e) {
      // Tratamento por MENSAGEM (o backend usa status HTTP inconsistente entre 400/404/500).
      // Erro já NORMALIZADO pelo interceptor de api.js → { status, message, raw }; a mensagem
      // do backend chega em e.message (== getErrorMessage(e)). NUNCA limpa o carrinho no erro.
      const getMsg = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
      const raw = String((getMsg ? getMsg(e) : (e && e.message)) || '').trim();
      const low = raw.toLowerCase();
      const GEN = 'Falha ao enviar o pedido. Tente novamente.';
      // (5) sem resposta HTTP (rede/timeout → status null/ausente) = genérico.
      const semResposta = !e || e.status === null || e.status === undefined;
      // (2) marcadores de infra / SQL / stacktrace = genérico (não vaza detalhe técnico ao usuário).
      const pareceInfra =
        ['conexão', 'conexao', 'econnrefused', 'etimedout', 'enotfound', 'timeout', 'network',
          'lista de itens inválida ou vazia', 'lista de itens invalida ou vazia'].some((m) => low.includes(m))
        || /(\bat\s+[\w.$<>]+\s*\()|violates|constraint|syntax error|null value|duplicate key|sqlstate|relation\s|column\s+"/i.test(raw);
      let msg;
      if (semResposta || !raw || pareceInfra) {
        msg = GEN;                                                 // (2)+(5) infra / rede / sem mensagem
      } else if (raw.startsWith('Erro Técnico: ')) {
        msg = raw.slice('Erro Técnico: '.length).trim() || GEN;    // (3) tira o prefixo técnico (ex.: estoque)
      } else {
        msg = raw;                                                 // (4) OP obrigatória / não encontrada / finalizada
      }
      setSendErr(msg);
    } finally {
      setSending(false);
    }
  };

  // histórico
  const tabs = [['todas', 'Todos'], ['em-analise', 'Em Análise'], ['a-separar', 'A Separar'], ['concluido', 'Concluídos'], ['recusado', 'Recusados']];
  const count = (k) => (k === 'todas' ? pedidos.length : pedidos.filter((x) => x.status === k).length);
  const hview = filter === 'todas' ? pedidos : pedidos.filter((x) => x.status === filter);
  const cur = pedidos.find((x) => x.id === openId);
  const emAndamento = pedidos.filter((x) => x.status === 'em-analise' || x.status === 'a-separar').length;

  const toggle = (val, icon, label) => {
    const on = view === val;
    return (
      <button onClick={() => { setView(val); frSavePedidosView(val); }} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 700,
        background: on ? selBg : 'transparent', color: on ? selFg : t.muted }}>
        <Icon name={icon} size={16} /> {label}
      </button>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* topo (ref21): o hero roxo MORREU — card-painel nos tokens da casa. O chip índigo do
          carrinho é BOTÃO (abre o drawer); em view=novo o painel expande com busca, Excel,
          segmentos de disponibilidade e ordenação — tudo operando sobre o dado REAL. */}
      <div style={{ position: 'relative', borderRadius: 18, padding: '18px 22px', marginBottom: 24, background: t.panel, border: `1px solid ${t.border}`, boxShadow: t.shadow, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 850, letterSpacing: '-.02em', color: t.text }}>Meus Pedidos</h1>
          <button onClick={() => { setView('novo'); frSavePedidosView('novo'); setCartOpen(true); }} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, padding: '5px 12px', borderRadius: 999, background: selBg, color: selFg, border: `1px solid ${selBd}` }}><Icon name="cart" size={13} /> {cart.length}</button>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: t.faint }}>{emAndamento} em andamento</span>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}` }}>
          {toggle('novo', 'plus', 'Novo Pedido')}
          {toggle('historico', 'clock', 'Histórico')}
        </div>
        {view === 'novo' && (
          <div style={{ position: 'relative', flex: '1 1 100%', minWidth: 0, marginTop: 4, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
            <div style={{ position: 'relative', display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 220, height: 42, padding: '0 14px', borderRadius: 11, background: t.elevated, border: `1px solid ${q ? t.accent : t.border}`, color: t.muted, cursor: 'text', transition: 'border-color .15s' }}>
                <Icon name="search" size={16} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar por nome, SKU…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 13.5, fontFamily: 'inherit' }} />
                {q && <button onClick={() => setQ('')} style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 6, color: t.muted }}><Icon name="x" size={15} /></button>}
              </label>
              {/* Casca do ref21 no Import EXISTENTE — mesmo modal, mesmo comportamento. */}
              <button title="Importar do Excel" onClick={() => setImportOpen(true)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 15px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, color: t.text, background: t.elevated, border: `1px solid ${t.border}` }}><Icon name="upload" size={15} /> Excel</button>
            </div>

            {/* segmentos de disponibilidade + ordenação */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              <div style={{ display: 'inline-flex', gap: 3, padding: 3, borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}` }}>
                {[['todos', 'Todos'], ['disp', 'Disponíveis'], ['cart', 'No carrinho']].map(([k, label]) => {
                  const on = disp === k;
                  const n = k === 'disp' ? CATALOGO.filter((c) => c.disp > 0).length : k === 'cart' ? cart.length : CATALOGO.length;
                  return (
                    <button key={k} onClick={() => setDisp(k)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: on ? selBg : 'transparent', color: on ? selFg : t.muted, transition: 'all .14s' }}>
                      {label} <span style={{ fontSize: 11, fontWeight: 800, opacity: .6 }}>{n}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: t.faint }}>Ordenar por</span>
                {(() => {
                  const SORTS = [
                    { id: 'rel', label: 'Relevância', icon: 'zap' },
                    { id: 'nome', label: 'Nome (A–Z)', icon: 'clipboard' },
                    { id: 'maior', label: 'Maior disponibilidade', icon: 'barChart2' },
                  ];
                  const cur = SORTS.find((s) => s.id === sort) || SORTS[0];
                  return (
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setSortOpen((o) => !o)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', borderRadius: 10, background: t.elevated, border: `1px solid ${sortOpen ? t.accent : t.border}`, color: t.text, transition: 'border-color .15s' }}>
                        <Icon name={cur.icon} size={15} style={{ color: t.accentText }} />
                        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{cur.label}</span>
                        <Icon name="chevronDown" size={15} style={{ color: t.muted, transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                      </button>
                      {sortOpen && <div onClick={() => setSortOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 39 }} />}
                      {sortOpen && (
                        <div style={{ position: 'absolute', zIndex: 40, top: 'calc(100% + 6px)', right: 0, minWidth: 210, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6 }}>
                          {SORTS.map((s) => {
                            const on = s.id === sort;
                            return (
                              <button key={s.id} onClick={() => { setSort(s.id); setSortOpen(false); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, background: on ? t.accentSoft : 'transparent' }}
                                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                                <Icon name={s.icon} size={15} style={{ color: on ? t.accentText : t.muted }} />
                                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: t.text }}>{s.label}</span>
                                {on && <Icon name="check" size={15} style={{ color: t.accentText }} />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* chips de categoria — etiquetas REAIS do catálogo carregado */}
            <div style={{ position: 'relative', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => setFil(null)} style={{ all: 'unset', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 11.5, fontWeight: 700, padding: '6px 13px', borderRadius: 999, background: !fil ? selBg : t.elevated, color: !fil ? selFg : t.muted, border: `1px solid ${!fil ? selBd : t.border}` }}>Todas</button>
              {cats.map((f) => {
                const on = fil === f;
                return <button key={f} onClick={() => setFil(on ? null : f)} style={{ all: 'unset', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 11.5, fontWeight: 700, padding: '6px 13px', borderRadius: 999, background: on ? selBg : t.elevated, color: on ? selFg : t.muted, border: `1px solid ${on ? selBd : t.border}` }}>{f} <span style={{ opacity: .55, fontWeight: 800 }}>{catCounts[f]}</span></button>;
              })}
            </div>
          </div>
        )}
      </div>

      {view === 'novo' ? (
        <div>
          {/* catálogo — largura toda (ref21); busca/Excel/segmentos/sort/chips subiram pro painel do topo */}
          <Card t={t} style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: t.muted }}>{catLoading ? 'Carregando materiais…' : catError ? 'Falha ao carregar materiais' : `${cat.length} ${cat.length === 1 ? 'material' : 'materiais'}${fil ? ` · ${fil}` : ''}${disp !== 'todos' ? (disp === 'disp' ? ' · disponíveis' : ' · no carrinho') : ''}`}</span>
              {(fil || disp !== 'todos' || q) && <button onClick={() => { setFil(null); setDisp('todos'); setQ(''); }} style={{ all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: t.accentText, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="x" size={13} /> Limpar filtros</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: pedMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))', gap: pedMobile ? 14 : 16 }}>
              {catError ? (
                <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '26px 20px', color: uiTone(t, 'red').fg, fontSize: 13, fontWeight: 600 }}><Icon name="alert" size={17} /> {catError}</div>
              ) : catLoading ? (
                Array.from({ length: 8 }).map((_, i) => <PedCatalogoSkeleton key={`sk${i}`} t={t} />)
              ) : (<>
              {cat.length === 0 && <div style={{ gridColumn: '1/-1', padding: 30, textAlign: 'center', color: t.muted, fontSize: 13 }}>Nenhum material encontrado.</div>}
              {catPageItems.map((c) => {
                const out = c.disp === 0;
                const added = inCart(c.sku);
                return (
                  <div key={c.sku} style={{ display: 'flex', flexDirection: 'column', borderRadius: 14, padding: 12, background: t.elevated, border: `1px solid ${added ? t.accent : t.border}`, opacity: out ? 0.6 : 1, transition: 'border-color .15s, transform .15s, box-shadow .15s' }}
                    onMouseEnter={(e) => { if (!out) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = t.shadow; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1.25', borderRadius: 11, overflow: 'hidden', background: c.img ? PED_THUMB_BG : t.hover, border: `1px solid ${t.border}`, display: 'grid', placeItems: 'center', marginBottom: 12 }}>
                      {c.img
                        ? <img loading="lazy" src={window.__asset(c.img)} alt={c.nome} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10%', boxSizing: 'border-box', filter: out ? 'grayscale(1)' : 'none' }} />
                        : <Icon name="box" size={pedMobile ? 40 : 42} style={{ color: t.faint }} />}
                      <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 11, fontWeight: 850, padding: '5px 11px', borderRadius: 999, background: out ? t.hover : uiTone(t, 'green').fg, color: out ? t.muted : '#fff', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,.18)', letterSpacing: '.02em' }}>{out ? 'Esgotado' : `${c.disp} disp.`}</span>
                      {added && <span style={{ position: 'absolute', top: 8, left: 8, width: 24, height: 24, borderRadius: '50%', background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.2)' }}><Icon name="check" size={14} /></span>}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 8, lineHeight: 1.3, minHeight: 36 }}>{c.nome}</div>
                    <Badge t={t} kind="gray">{c.sku}</Badge>
                    <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                      {out
                        ? <div style={{ fontSize: 12, fontWeight: 700, color: t.faint, textAlign: 'center', height: 40, display: 'grid', placeItems: 'center' }}>Indisponível</div>
                        : <button onClick={() => add(c.sku)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13, fontWeight: 700, background: added ? t.accentSoft : t.accent, color: added ? t.accentText : t.onAccent }}><Icon name={added ? 'check' : 'plus'} size={16} /> {added ? `No carrinho · ${added.qtd}` : 'Adicionar'}</button>}
                    </div>
                  </div>
                );
              })}
              </>)}
            </div>
            {!catLoading && !catError && catTotal > 0 && (
              <PedPaginacao t={t} page={catSafePage} totalPages={catTotalPages} total={catTotal} start={catStart} end={catEnd} onPage={goToCatPage} unidade="materiais" />
            )}
          </Card>

          {/* carrinho flutuante (ref21): a coluna sticky MORREU — FAB gradiente índigo + drawer
              lateral. SÓ CASCA: itens, clamp, OP real, gates de EPI, envio e erros são os mesmos. */}
          <button onClick={() => setCartOpen(true)} style={{ all: 'unset', cursor: 'pointer', position: 'fixed', right: 22, bottom: 22, zIndex: 55, display: 'flex', alignItems: 'center', gap: 10, height: 56, padding: '0 20px 0 18px', borderRadius: 999, background: `linear-gradient(135deg, ${ACCENT_DARK}, #2e3192)`, color: '#fff', boxShadow: '0 14px 34px rgba(24,26,84,.5)', border: '1px solid rgba(255,255,255,.18)', transition: 'transform .15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}>
            <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
              <Icon name="cart" size={22} />
              {cart.length > 0 && <span style={{ position: 'absolute', top: -8, right: -10, minWidth: 19, height: 19, borderRadius: 999, background: '#ffd400', color: '#181a54', fontSize: 11, fontWeight: 850, display: 'grid', placeItems: 'center', padding: '0 5px', boxSizing: 'border-box', boxShadow: '0 2px 6px rgba(0,0,0,.25)' }}>{cart.length}</span>}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800 }}>Carrinho</span>
            {totalUn > 0 && <span style={{ fontSize: 11.5, fontWeight: 850, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,.16)' }}>{totalUn} un</span>}
          </button>

          {/* drawer do carrinho */}
          {cartOpen && (
          <div onClick={() => setCartOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 64, background: 'rgba(8,10,16,.55)', backdropFilter: 'blur(2px)', display: 'flex', animation: 'frTripFade .2s ease-out' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(460px,100%)', height: '100%', marginLeft: 'auto', display: 'flex', flexDirection: 'column', background: t.panel, borderLeft: `1px solid ${t.borderStrong}`, boxShadow: t.shadow, animation: 'pedDrawerIn .28s cubic-bezier(.22,1,.36,1)' }}>
            <style>{`@keyframes pedDrawerIn{from{transform:translateX(70px);opacity:0}to{transform:none;opacity:1}}`}</style>
            <div style={{ position: 'relative', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', background: `linear-gradient(135deg, ${ACCENT_DARK}, #2e3192)`, color: '#fff' }}>
              <Icon name="cart" size={92} style={{ position: 'absolute', right: 50, top: -20, opacity: 0.12, pointerEvents: 'none' }} />
              <span style={{ position: 'relative', width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="cart" size={20} /></span>
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 850 }}>Carrinho</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>{cart.length} {cart.length === 1 ? 'item' : 'itens'} · <b style={{ color: '#ffd400' }}>{totalUn} un</b></div>
              </div>
              {cart.length > 0 && <button onClick={() => setCart([])} style={{ all: 'unset', cursor: 'pointer', position: 'relative', fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,.85)', padding: '5px 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,.28)' }}>Limpar</button>}
              <button onClick={() => setCartOpen(false)} style={{ all: 'unset', cursor: 'pointer', position: 'relative', width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.16)' }}><Icon name="x" size={16} /></button>
            </div>
            <div className="fr-scroll" style={{ padding: cart.length ? 14 : 0, flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div style={{ display: 'grid', placeItems: 'center', textAlign: 'center', padding: '46px 20px' }}>
                  <span style={{ width: 70, height: 70, borderRadius: '50%', background: t.elevated, color: t.faint, display: 'grid', placeItems: 'center', marginBottom: 16 }}><Icon name="cart" size={30} /></span>
                  <div style={{ fontSize: 13.5, color: t.muted }}>O seu carrinho está vazio.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cart.map((c) => {
                    const nf = needsFunc(c.sku);
                    const early = isEarly(c);
                    const pend = nf && (!c.funcionario || (early && (!(c.justificativa || '').trim() || !c.foto)));
                    return (
                    <div key={c.sku} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: t.elevated, border: `1px solid ${pend ? frHexToRgba('#f59e0b', 0.5) : t.border}` }}>
                      <PedThumb t={t} c={catOf(c.sku)} size={40} radius={9} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameOf(c.sku)}</div>
                        {nf
                          ? (c.funcionario && !pend
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: uiTone(t, 'green').fg, marginTop: 2 }}><Icon name="check" size={12} /> {c.funcionario}{early ? ' · justificado' : ''}</span>
                              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: uiTone(t, 'amber').fg, marginTop: 2 }}><Icon name="alert" size={12} /> {!c.funcionario ? 'Destinar funcionário' : 'Justificar reposição'}</span>)
                          : <div style={{ fontSize: 10.5, color: t.muted }}>{c.sku} · {dispOf(c.sku)} disp.</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => step(c.sku, -1)} style={{ all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}` }}>–</button>
                        <input value={c.qtd} onChange={(e) => setQty(c.sku, e.target.value)} inputMode="numeric" style={{ width: 38, height: 26, textAlign: 'center', borderRadius: 7, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 13, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                        <button onClick={() => step(c.sku, 1)} disabled={c.qtd >= dispOf(c.sku)} style={{ all: 'unset', cursor: c.qtd >= dispOf(c.sku) ? 'not-allowed' : 'pointer', width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', color: c.qtd >= dispOf(c.sku) ? t.faint : t.accentText, border: `1px solid ${t.border}`, opacity: c.qtd >= dispOf(c.sku) ? 0.5 : 1 }}>+</button>
                      </div>
                      <button onClick={() => del(c.sku)} title="Remover" style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ padding: 16, borderTop: `1px solid ${t.border}` }}>
              {precisaOP ? (
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 }}>Ordem de Produção (OP) <span style={{ color: uiTone(t, 'red').fg }}>*</span></label>
                <button onClick={() => setOpOpen((o) => !o)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11, border: `1px solid ${opOpen ? t.accent : t.border}`, background: t.elevated }}>
                  {opSel
                    ? <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opSel.cliente}</div><div style={{ fontSize: 11, color: t.muted }}>OP {opSel.op}</div></div>
                    : <span style={{ flex: 1, fontSize: 13.5, color: t.muted }}>Selecione a OP…</span>}
                  <Icon name="chevronDown" size={16} style={{ color: t.muted, transform: opOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </button>
                {opOpen && <div onClick={() => setOpOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 39 }} />}
                {opOpen && (
                  <div className="fr-scroll" style={{ position: 'absolute', zIndex: 40, bottom: 'calc(100% + 6px)', left: 0, right: 0, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6, maxHeight: 288, overflowY: 'auto' }}>
                    <div style={{ position: 'sticky', top: -6, background: t.panel, padding: '2px 2px 6px', margin: '-2px -2px 0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 10px', borderRadius: 9, background: t.elevated, border: `1px solid ${t.border}` }}>
                        <Icon name="search" size={15} style={{ color: t.muted }} />
                        <input autoFocus value={opQ} onChange={(e) => setOpQ(e.target.value)} placeholder="Buscar cliente ou OP…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 12.5, fontFamily: 'inherit' }} />
                      </label>
                    </div>
                    {/* "ABERTAS", não "EM ANDAMENTO": o critério é NÃO CONCLUÍDA, e depois da carga
                        do 2.0 a lista inclui OPs ativas gravadas como 'pendente'. Rótulo que promete
                        um status literal mentiria sobre o que está logo abaixo dele. */}
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', color: t.faint, padding: '7px 10px 5px' }}>OPs ABERTAS · CLIENTES E OPS</div>
                    {/* Três vazios diferentes, porque são três fatos diferentes. Com fonte real,
                        "Nenhuma OP encontrada" cobrindo carregamento e falha de rede seria mentira. */}
                    {opsLoading && <div style={{ padding: '14px 10px', textAlign: 'center', fontSize: 12.5, color: t.muted }}>Carregando OPs…</div>}
                    {!opsLoading && opsError && (
                      <div style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>Não foi possível carregar as OPs</div>
                        <div style={{ fontSize: 11.5, color: t.muted, marginTop: 3 }}>{opsError}</div>
                      </div>
                    )}
                    {!opsLoading && !opsError && opsView.length === 0 && (
                      <div style={{ padding: '14px 10px', textAlign: 'center', fontSize: 12.5, color: t.muted }}>
                        {OPS.length === 0 ? 'Nenhuma OP aberta no sistema.' : 'Nenhuma OP encontrada para esta busca.'}
                      </div>
                    )}
                    {opsView.map((c) => {
                      const single = c.ops.length === 1;
                      if (single) {
                        const op = c.ops[0];
                        const on = opSel && opSel.op === op && opSel.cliente === c.cliente;
                        return (
                          <button key={c.cliente + op} onClick={() => { setOpSel({ op, cliente: c.cliente }); setOpOpen(false); setOpQ(''); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 9, background: on ? t.hover : 'transparent' }}
                            onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                            <span style={{ width: 32, height: 32, borderRadius: 8, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="briefcase" size={15} /></span>
                            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.cliente}</div><div style={{ fontSize: 11, color: t.muted }}>OP {op}</div></div>
                            {on && <Icon name="check" size={15} style={{ color: t.accentText }} />}
                          </button>
                        );
                      }
                      return (
                        <div key={c.cliente} style={{ borderRadius: 10, marginTop: 2, marginBottom: 2, background: t.elevated, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px' }}>
                            <span style={{ width: 30, height: 30, borderRadius: 8, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="briefcase" size={14} /></span>
                            <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.cliente}</div>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 7, background: t.accentSoft, color: t.accentText }}>{c.ops.length} OPs</span>
                          </div>
                          <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {c.ops.map((op) => {
                              const on = opSel && opSel.op === op && opSel.cliente === c.cliente;
                              return (
                                <button key={op} onClick={() => { setOpSel({ op, cliente: c.cliente }); setOpOpen(false); setOpQ(''); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px 7px 12px', borderRadius: 8, background: on ? t.accentSoft : t.panel, border: `1px solid ${on ? t.accent : t.border}` }}
                                  onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = t.panel; }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: on ? t.accent : t.faint, flexShrink: 0 }} />
                                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: t.text }}>OP {op}</span>
                                  {on && <Icon name="check" size={14} style={{ color: t.accentText }} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 11, background: t.accentSoft, color: t.accentText, fontSize: 11.5, fontWeight: 600, marginBottom: 14 }}>
                  <Icon name="shield" size={14} style={{ flexShrink: 0 }} /> EPI é destinado ao funcionário — não requer OP.
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: 12.5, color: t.muted }}>Itens</span><span style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>{cart.length}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: 12.5, color: t.muted }}>Total de unidades</span><span style={{ fontSize: 16, fontWeight: 850, color: t.accentText }}>{totalUn}</span></div>
              </div>
              {precisaEscritorio && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 10, background: uiTone(t, 'amber').bg, color: uiTone(t, 'amber').fg, fontSize: 11.5, fontWeight: 600, marginBottom: 10 }}>
                  <Icon name="shield" size={14} style={{ flexShrink: 0 }} /> Há EPI em reposição antecipada — o pedido irá para aprovação do escritório.
                </div>
              )}
              {(() => {
                const opGate = cart.length && (!precisaOP || opSel);
                if (temDestino) {
                  // roteia pela tela de destinação
                  return (
                    <button onClick={() => opGate && setDestinoOpen(true)} disabled={!opGate} style={{ all: 'unset', boxSizing: 'border-box', cursor: opGate ? 'pointer' : 'not-allowed', width: '100%', height: 48, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 14, fontWeight: 800,
                      background: opGate ? t.accent : t.elevated, color: opGate ? t.onAccent : t.faint, boxShadow: opGate ? `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` : 'none' }}>
                      <Icon name="shield" size={18} /> Destinar EPI / Ferramentas <Icon name="chevronRight" size={16} />
                    </button>
                  );
                }
                return (
                  <button onClick={confirmar} disabled={!opGate || sending} style={{ all: 'unset', boxSizing: 'border-box', cursor: (opGate && !sending) ? 'pointer' : 'not-allowed', width: '100%', height: 48, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 14, fontWeight: 800, opacity: sending ? 0.75 : 1,
                    background: opGate ? t.accent : t.elevated, color: opGate ? t.onAccent : t.faint, boxShadow: opGate ? `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` : 'none' }}>
                    <Icon name={sending ? 'clock' : 'out'} size={18} /> {sending ? 'Enviando…' : 'Confirmar Solicitação'}
                  </button>
                );
              })()}
              {cart.length > 0 && precisaOP && !opSel && <div style={{ fontSize: 11.5, color: uiTone(t, 'amber').fg, textAlign: 'center', marginTop: 8, fontWeight: 600 }}>Selecione a OP para continuar.</div>}
              {cart.length > 0 && (!precisaOP || opSel) && temDestino && cartInvalido && <div style={{ fontSize: 11.5, color: t.muted, textAlign: 'center', marginTop: 8, fontWeight: 600 }}>Há EPI/ferramentas aguardando destinação.</div>}
              {sendErr && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 10, padding: '9px 11px', borderRadius: 10, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, fontSize: 11.5, fontWeight: 600, lineHeight: 1.4 }}><Icon name="alert" size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {sendErr}</div>}
            </div>
            </div>
          </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
            {tabs.map(([k, label]) => {
              const on = filter === k;
              return <button key={k} onClick={() => setFilter(k)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: on ? t.accent : t.panel, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>{label}<span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 7, background: on ? 'rgba(255,255,255,.25)' : t.hover, color: on ? t.onAccent : t.muted }}>{count(k)}</span></button>;
            })}
          </div>
          {histError ? (
            <Card t={t} style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11, textAlign: 'center', padding: '16px 10px' }}>
                <Icon name="alert" size={26} style={{ color: uiTone(t, 'red').fg }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Não foi possível carregar os seus pedidos</div>
                <div style={{ fontSize: 12.5, color: t.muted }}>{histError}</div>
                <button onClick={histReload} style={{ all: 'unset', cursor: 'pointer', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', borderRadius: 11, fontSize: 13, fontWeight: 700, background: t.accent, color: t.onAccent }}><Icon name="refresh" size={15} /> Tentar novamente</button>
              </div>
            </Card>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {histLoading && Array.from({ length: 6 }).map((_, i) => <PedHistSkeleton key={`hs${i}`} t={t} />)}
            {!histLoading && hview.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhum pedido ainda" sub={filter === 'todas' ? 'Você ainda não fez nenhum pedido.' : 'Nenhum pedido neste filtro.'} /></Card></div>}
            {!histLoading && hview.map((s) => {
              const mm = SOL_STATUS[s.status]; const c = uiTone(t, mm.kind);
              const tu = s.itens.reduce((a, it) => a + it.qtd, 0); const first = s.itens[0];
              return (
                <Card t={t} key={s.id} hover style={{ padding: 16, cursor: 'pointer' }}>
                  <div onClick={() => setOpenId(s.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', padding: '5px 10px', borderRadius: 8, background: c.bg, color: c.fg }}><Icon name={mm.icon} size={13} /> {mm.label}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.faint, whiteSpace: 'nowrap' }}><Icon name="clock" size={13} /> {s.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
                      <span style={{ width: 42, height: 42, borderRadius: 12, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="cart" size={20} /></span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{first.nome}{s.itens.length > 1 ? ` +${s.itens.length - 1}` : ''}</div>
                        <div style={{ fontSize: 12, color: t.muted }}>{tu} un</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 13, borderTop: `1px solid ${t.border}` }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: t.muted }}><Icon name="box" size={15} /> {s.itens.length} {s.itens.length === 1 ? 'item' : 'itens'}</span>
                    <button onClick={() => setOpenId(s.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: t.accentText, padding: '6px 10px', borderRadius: 9 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = t.accentSoft; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>Acompanhar <Icon name="chevronRight" size={15} /></button>
                  </div>
                </Card>
              );
            })}
          </div>
          )}
          {/* "Cancelar pedido" ERA um filter no estado local — o card sumia da tela e voltava no F5,
              sem nada ter acontecido no servidor. Agora abre o MESMO modal da lixeira das
              Solicitações (window.SolCancelModal), que faz o PUT e recarrega DO SERVIDOR.
              O botão que abre isto já nasce gateado dentro do SolicitacaoDetail (estado + permissão). */}
          {cur && <SolicitacaoDetail t={t} s={cur} mine onClose={() => setOpenId(null)} onCancel={() => setCancelando(cur)} />}
          {cancelando && <window.SolCancelModal t={t} s={cancelando} onClose={() => setCancelando(null)}
            onDone={() => { setCancelando(null); setOpenId(null); histReload(); }} />}
        </div>
      )}

      {destinoOpen && (
        <EpiDestinoModal t={t} items={cart.filter((c) => needsFunc(c.sku))} catOf={catOf} onFunc={setFunc} onJust={setJust} onFoto={setFoto} isEarly={isEarly}
          onClose={() => setDestinoOpen(false)} onConfirm={() => { confirmar(); setDestinoOpen(false); }} />
      )}

      {importOpen && (
        <PedImportModal t={t} catalogo={CATALOGO} todos={frProdutos} cart={cart}
          onClose={() => setImportOpen(false)} onAdd={importarAoCarrinho} />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 70, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderRadius: 13, background: uiTone(t, 'green').fg, color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 10px 30px rgba(0,0,0,.3)' }}>
          <Icon name="check" size={18} /> Solicitação enviada! Veja em Histórico.
        </div>
      )}
    </div>
  );
}

window.PageMeusPedidos = PageMeusPedidos;
