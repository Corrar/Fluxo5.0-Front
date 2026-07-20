// pedidos.jsx — "Meus Pedidos": catálogo + carrinho (Novo Pedido) e Histórico.
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
const OPS_FALLBACK = [
  { cliente: 'Metalúrgica Andrade', ops: ['00021'] },
  { cliente: 'Tecno Plásticos S.A.', ops: ['00018'] },
  { cliente: 'Indústria Veloz', ops: ['901001', '901002'] },
  { cliente: 'Usinagem Premium', ops: ['73001'] },
  { cliente: 'Esteira Log', ops: ['12010'] },
  { cliente: 'Auto Peças Norte', ops: ['00009'] },
];

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

// Backend → vocabulário da tela (SOL_STATUS). Status real de requests: aberto/aprovado/entregue/rejeitado/devolvido.
const FR_REQ_STATUS_MAP = { aberto: 'em-analise', aprovado: 'a-separar', entregue: 'concluido', rejeitado: 'recusado', devolvido: 'concluido' };
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
    time: frRelTime(r.created_at),
    itens: its.map((it) => ({
      nome: (it.products && it.products.name) || it.custom_product_name || 'Item',
      sku: (it.products && it.products.sku) || '',
      qtd: Number(it.quantity_requested) || 0,
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

function PageMeusPedidos({ t: tBase, theme }) {
  const t = frTokens(theme, '#7c3aed', '#a78bfa');
  const { mobile: pedMobile } = (window.useFRViewport ? window.useFRViewport() : { mobile: false });
  const ACCENT_DARK = '#4c1d95';
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
  const [toast, setToast] = useStateP(false);
  const [opSel, setOpSel] = useStateP(null);
  const [opOpen, setOpOpen] = useStateP(false);
  const [opQ, setOpQ] = useStateP('');
  const [sortOpen, setSortOpen] = useStateP(false);
  const [destinoOpen, setDestinoOpen] = useStateP(false);
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
  const OPS = (window.FR_OPS_ATIVAS && window.FR_OPS_ATIVAS.length) ? window.FR_OPS_ATIVAS : OPS_FALLBACK;
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
  let cat = CATALOGO.filter((c) =>
    (!fil || c.cat === fil) &&
    (!ql || c.nome.toLowerCase().includes(ql) || c.sku.includes(ql)) &&
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
    // Setor do usuário logado (fallback ao que a tela já usava). op_code só se houver OP escolhida.
    const sector = (window.FRAuth && window.FRAuth.profile && window.FRAuth.profile.sector) || 'Geral';
    // items: { product_id, quantity, observation? } — observation só quando houver. EPI fica p/ Peça 4.
    const payload = {
      sector,
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
      setCart([]); setOpSel(null);
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
        background: on ? '#fff' : 'transparent', color: on ? ACCENT_DARK : 'rgba(255,255,255,.85)' }}>
        <Icon name={icon} size={16} /> {label}
      </button>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* header */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '24px 26px', marginBottom: 24, background: `linear-gradient(135deg, ${ACCENT_DARK}, #7c3aed)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <Icon name="cart" size={150} style={{ position: 'absolute', right: -20, top: -32, opacity: 0.12 }} />
        <div style={{ position: 'relative' }}>
          <h1 style={{ margin: 0, fontSize: 25, fontWeight: 850, letterSpacing: '-.02em' }}>Meus Pedidos</h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.88)', marginTop: 5 }}>Monte sua solicitação e acompanhe o andamento dos seus materiais.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,.7)' }}>Setor</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: 'rgba(255,255,255,.2)' }}>Geral</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: 'rgba(255,255,255,.2)' }}><Icon name="cart" size={13} /> {cart.length} no carrinho</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: 'rgba(255,255,255,.2)' }}><Icon name="clock" size={13} /> {emAndamento} em andamento</span>
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,.16)' }}>
          {toggle('novo', 'plus', 'Novo Pedido')}
          {toggle('historico', 'clock', 'Histórico')}
        </div>
      </div>

      {view === 'novo' ? (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* catálogo */}
          <Card t={t} style={{ flex: '3 1 460px', minWidth: 300, padding: 18 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200, height: 46, padding: '0 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${q ? t.accent : t.border}`, color: t.muted, cursor: 'text', transition: 'border-color .15s' }}>
                <Icon name="search" size={18} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procure por nome, SKU ou palavra-chave…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
                {q && <button onClick={() => setQ('')} style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 6, color: t.faint }}><Icon name="x" size={15} /></button>}
              </label>
              <Btn t={t} kind="soft" icon="upload">Importar do Excel</Btn>
            </div>

            {/* segmentos de disponibilidade + ordenação */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ display: 'inline-flex', gap: 3, padding: 3, borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
                {[['todos', 'Todos', null], ['disp', 'Disponíveis', 'check'], ['cart', 'No carrinho', 'cart']].map(([k, label, icon]) => {
                  const on = disp === k;
                  const n = k === 'disp' ? CATALOGO.filter((c) => c.disp > 0).length : k === 'cart' ? cart.length : CATALOGO.length;
                  return (
                    <button key={k} onClick={() => setDisp(k)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? t.onAccent : t.muted, transition: 'all .14s' }}>
                      {icon && <Icon name={icon} size={14} />}{label}
                      <span style={{ fontSize: 10.5, fontWeight: 800, padding: '1px 6px', borderRadius: 6, background: on ? 'rgba(255,255,255,.25)' : t.hover, color: on ? t.onAccent : t.faint }}>{n}</span>
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

            {/* chips de categoria */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
              <Icon name="box" size={14} style={{ color: t.muted, flexShrink: 0, marginTop: 7 }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setFil(null)} style={{ all: 'unset', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 11.5, fontWeight: 700, padding: '6px 13px', borderRadius: 9, background: !fil ? t.accent : t.elevated, color: !fil ? t.onAccent : t.muted, border: `1px solid ${!fil ? t.accent : t.border}` }}>Todas</button>
                {cats.map((f) => {
                  const on = fil === f;
                  return <button key={f} onClick={() => setFil(on ? null : f)} style={{ all: 'unset', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 11.5, fontWeight: 700, padding: '6px 13px', borderRadius: 9, background: on ? t.accent : t.elevated, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>{f} <span style={{ opacity: .7 }}>· {catCounts[f]}</span></button>;
                })}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: t.muted }}>{catLoading ? 'Carregando materiais…' : catError ? 'Falha ao carregar materiais' : `${cat.length} ${cat.length === 1 ? 'material' : 'materiais'}${fil ? ` · ${fil}` : ''}${disp !== 'todos' ? (disp === 'disp' ? ' · disponíveis' : ' · no carrinho') : ''}`}</span>
              {(fil || disp !== 'todos' || q) && <button onClick={() => { setFil(null); setDisp('todos'); setQ(''); }} style={{ all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: t.accentText, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="x" size={13} /> Limpar filtros</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: pedMobile ? '1fr' : 'repeat(auto-fill, minmax(228px, 1fr))', gap: pedMobile ? 14 : 12 }}>
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
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', borderRadius: 11, overflow: 'hidden', background: c.img ? PED_THUMB_BG : t.hover, border: `1px solid ${t.border}`, display: 'grid', placeItems: 'center', marginBottom: 12 }}>
                      {c.img
                        ? <img loading="lazy" src={window.__asset(c.img)} alt={c.nome} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10%', boxSizing: 'border-box', filter: out ? 'grayscale(1)' : 'none' }} />
                        : <Icon name="box" size={pedMobile ? 40 : 42} style={{ color: t.faint }} />}
                      <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10.5, fontWeight: 800, padding: '4px 9px', borderRadius: 999, background: out ? t.hover : uiTone(t, 'green').bg, color: out ? t.muted : uiTone(t, 'green').fg, whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>{out ? 'Esgotado' : `${c.disp} disp.`}</span>
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

          {/* carrinho */}
          <Card t={t} style={{ flex: '1 1 320px', minWidth: 280, position: 'sticky', top: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden', alignSelf: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '18px 20px', borderBottom: `1px solid ${t.border}` }}>
              <Icon name="cart" size={20} style={{ color: t.accentText }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Carrinho</span>
              {cart.length > 0 && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => setCart([])} style={{ all: 'unset', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: t.muted }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}>Limpar</button>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 8, background: t.accentSoft, color: t.accentText }}>{cart.length}</span>
                </div>
              )}
            </div>
            <div className="fr-scroll" style={{ padding: cart.length ? 12 : 0, minHeight: 220, maxHeight: 360, overflowY: 'auto' }}>
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
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', color: t.faint, padding: '7px 10px 5px' }}>OPs EM ANDAMENTO · CLIENTES E OPS</div>
                    {opsView.length === 0 && <div style={{ padding: '14px 10px', textAlign: 'center', fontSize: 12.5, color: t.muted }}>Nenhuma OP encontrada.</div>}
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
          </Card>
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
          {cur && <SolicitacaoDetail t={t} s={cur} mine onClose={() => setOpenId(null)} onCancel={() => { setPedidos((xs) => xs.filter((x) => x.id !== cur.id)); setOpenId(null); }} />}
        </div>
      )}

      {destinoOpen && (
        <EpiDestinoModal t={t} items={cart.filter((c) => needsFunc(c.sku))} catOf={catOf} onFunc={setFunc} onJust={setJust} onFoto={setFoto} isEarly={isEarly}
          onClose={() => setDestinoOpen(false)} onConfirm={() => { confirmar(); setDestinoOpen(false); }} />
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
