// separacoes.jsx — Estoque › Quadro de Gestão. Board de separações (OPs) + tela de
// detalhe editável: separar item a item, salvar (reservar), editar o pedido e entregar.
//
// LIGADO ao backend real (GET/POST/PUT/DELETE /separations). A tela renderiza 100% do
// hook useFRSeparations (GET /separations); NÃO usa mais nenhum seed mock de separações.
// Cada ação vira uma chamada FRApi e refaz o fetch (reload) — sem estado otimista mentiroso.
//
// MAPA DE STATUS (backend → tela):
//   pendente / em_separacao → aba 'separacao' (Ativos, editável)
//   entregue                → aba 'entregue' (Entregues)
//   cancelada               → NÃO exibida (filtrada no adapter)
// A aba 'arquivado' é uma VIEW client-side de entregues (Set em localStorage, por navegador,
// SEM status novo no backend — decisão fechada). "Arquivar" só move o card entre abas locais.
//
// CATÁLOGO de materiais = produtos REAIS (window.useFRProducts → GET /products), pois criar/
// editar itens precisa do product_id (uuid). O picker de OP ainda usa window.FR_OPS_ATIVAS
// (seed de CLIENTES, dívida já documentada em pages_clientes.jsx — fora do escopo desta tela).
const { useState: useStateSep, useMemo: useMemoSep, useEffect: useEffectSep, useRef: useRefSep } = React;

const SEP_BRL = (n) => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const SEP_K = (n) => {
  n = Number(n || 0);
  if (n >= 1000) { const v = n / 1000; return 'R$ ' + (v >= 100 ? Math.round(v) : v.toFixed(1).replace('.', ',')) + ' mil'; }
  return 'R$ ' + n.toFixed(1).replace('.', ',');
};
const sepInitials = (s) => String(s || '').split(/[\s/]+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();

// number robusto (reusa o adapter dos produtos; fallback local)
function sepNum(v) {
  const f = window.FRAdapters && window.FRAdapters.parseNumber;
  if (f) return f(v);
  if (v === null || v === undefined) return 0;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}
function sepErr(e) {
  const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
  return g ? g(e) : (e && e.message) || 'Erro inesperado.';
}

// ---- rótulos de data a partir do backend (created_at / sent_at) ----
const SEP_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
function sepDateLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return String(d.getDate()).padStart(2, '0') + ' ' + SEP_MESES[d.getMonth()];
}
function sepStamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ---- status backend → tela ----
function sepFrontStatus(raw) {
  if (raw === 'entregue' || raw === 'concluida' || raw === 'finalizada') return 'entregue';
  if (raw === 'cancelada') return 'cancelada';        // filtrada no adapter (não exibida)
  return 'separacao';                                  // pendente / em_separacao
}

// ---- adapter: item REAL (GET /separations → items[]) → shape da tela ----
// disp = sep + (on_hand - reserved): mantém a matemática do SepItemRow (maxSep=min(qtd,disp),
// livre=disp-sep=disponível) correta sem tocar no componente. reserved é o reservado GLOBAL
// do produto (linha pooled do ALMOX), do qual este item já contribui com `sep`.
function adaptSepItem(it) {
  it = it || {};
  const prod = it.products || {};
  const stock = prod.stock || {};
  const onHand = sepNum(stock.quantity_on_hand);
  const reserved = sepNum(stock.quantity_reserved);
  const sep = sepNum(it.quantity);          // separado / reservado (DB)
  const avail = onHand - reserved;          // livre p/ reservar mais
  return {
    id: it.id || null,                      // separation_item uuid — payload do authorize
    product_id: it.product_id || null,      // payload de criar/editar
    sku: prod.sku || '',
    nome: prod.name || '',
    qtd: sepNum(it.qty_requested),          // solicitado
    sep: sep,                               // separado
    preco: sepNum(prod.unit_price),
    onHand: onHand,
    reserved: reserved,
    disp: sep + avail,                      // ver comentário acima
  };
}

// ---- adapter: separação REAL → shape da tela (null se cancelada) ----
function adaptSeparation(s) {
  s = s || {};
  const front = sepFrontStatus(s.status);
  if (front === 'cancelada') return null;
  const itens = Array.isArray(s.items) ? s.items.map(adaptSepItem) : [];
  return {
    id: s.id,
    op: s.production_order || '',
    cliente: s.client_name || 'Sem cliente',
    armazem: 'Almoxarifado',                 // origem (ALMOX pooled nesta fase)
    destino: s.destination || '',            // destino informado na criação/edição
    data: sepDateLabel(s.created_at),
    status: front,                           // 'separacao' | 'entregue'
    statusRaw: s.status,
    client_service_id: s.client_service_id || null,
    entrega: front === 'entregue' ? { em: sepStamp(s.sent_at || s.created_at), destino: s.destination || '' } : null,
    itens: itens,
    devolucoes: Array.isArray(s.returns) ? s.returns.map((r) => ({ nome: r.product_name, qtd: sepNum(r.quantity), un: '' })) : [],
  };
}

// ---- hook de dados: GET /separations adaptado (padrão do useFRClients/useFRProducts) ----
function useFRSeparations() {
  const R = window.React;
  const [items, setItems] = R.useState([]);
  const [loading, setLoading] = R.useState(true);
  const [error, setError] = R.useState(null);
  const mounted = R.useRef(true);
  const load = R.useCallback(function () {
    setError(null);
    window.FRApi.get('/separations', { skipLoading: true })
      .then(function (res) {
        if (!mounted.current) return;
        const rows = Array.isArray(res && res.data) ? res.data : [];
        setItems(rows.map(adaptSeparation).filter(Boolean));
        setLoading(false);
      })
      .catch(function (e) {
        if (!mounted.current) return;
        setError(sepErr(e));
        setLoading(false);
      });
  }, []);
  R.useEffect(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);
  return { items: items, loading: loading, error: error, reload: load };
}

// ---- arquivamento client-side (localStorage, por navegador; NÃO é status de backend) ----
const SEP_ARCHIVE_KEY = 'fr_sep_archived_v1';
function sepLoadArchived() {
  try { const a = JSON.parse(localStorage.getItem(SEP_ARCHIVE_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (_) { return []; }
}
function sepSaveArchived(ids) { try { localStorage.setItem(SEP_ARCHIVE_KEY, JSON.stringify(ids)); } catch (_) { /* ignora quota */ } }

const sepTotals = (s) => {
  const tot = s.itens.reduce((a, i) => a + i.qtd * i.preco, 0);
  const sep = s.itens.reduce((a, i) => a + i.sep * i.preco, 0);
  const totQ = s.itens.reduce((a, i) => a + i.qtd, 0);
  const sepQ = s.itens.reduce((a, i) => a + i.sep, 0);
  return { tot, sep, totQ, sepQ, pct: totQ ? Math.round((sepQ / totQ) * 100) : 0 };
};

const SEP_TABS = [
  { id: 'separacao', label: 'Ativos' },
  { id: 'entregue', label: 'Entregues' },
  { id: 'arquivado', label: 'Arquivados' },
];
const SEP_STATUS = {
  separacao: { label: 'Em Separação', kind: 'amber' },
  entregue: { label: 'Entregue', kind: 'green' },
  arquivado: { label: 'Arquivado', kind: 'gray' },
};

// ---------- Progress bar ----------
function SepBar({ t, pct, tone = 'amber', height = 8 }) {
  const c = pct >= 100 ? '#10b981' : (tone === 'blue' ? t.accent : '#f59e0b');
  return (
    <div style={{ height, borderRadius: 6, background: t.hover, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 6, background: c, transition: 'width .3s cubic-bezier(.2,.8,.2,1)' }} />
    </div>
  );
}

// ---------- Board card ----------
function SepCard({ t, s, onOpen }) {
  const tot = sepTotals(s);
  const st = SEP_STATUS[s.status];
  const done = tot.pct >= 100;
  return (
    <Card t={t} hover onClick={onOpen} style={{ position: 'relative', padding: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: t.text, background: t.hover, border: `1px solid ${t.border}`, padding: '5px 12px', borderRadius: 9, letterSpacing: '.02em' }}>OP: {s.op || '—'}</span>
        <Badge t={t} kind={st.kind}>{st.label}</Badge>
      </div>
      <div style={{ position: 'relative', fontSize: 11.5, fontWeight: 700, color: t.faint, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 5 }}>{s.data}</div>
      <div style={{ position: 'relative', fontSize: 20, fontWeight: 800, color: t.text, lineHeight: 1.25, letterSpacing: '-.01em', textWrap: 'pretty', minHeight: 50 }}>{s.cliente}</div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, color: t.muted, fontSize: 13.5, fontWeight: 600 }}>
        <Icon name="users" size={16} />{s.armazem}
      </div>
      {s.status === 'entregue' && s.destino && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7, marginTop: 7, color: t.accentText, fontSize: 13, fontWeight: 700 }}>
          <Icon name="truck" size={15} />Destino: {s.destino}
        </div>
      )}
      <div style={{ position: 'relative', height: 1, background: t.border, margin: '20px 0 16px' }} />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 11 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: t.faint, letterSpacing: '.07em', textTransform: 'uppercase' }}>Financeiro</div>
          <div style={{ fontSize: 15.5, fontWeight: 800, marginTop: 4 }}><span style={{ color: '#10b981' }}>{SEP_K(tot.sep)}</span> <span style={{ color: t.faint, fontWeight: 600 }}>/ {SEP_K(tot.tot)}</span></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: t.faint, letterSpacing: '.07em', textTransform: 'uppercase' }}>Progresso</div>
          <div style={{ fontSize: 15.5, fontWeight: 800, marginTop: 4, color: t.text }}>{tot.sepQ}/{tot.totQ} <span style={{ color: done ? '#10b981' : t.muted, fontWeight: 700 }}>({tot.pct}%)</span></div>
        </div>
      </div>
      <div style={{ position: 'relative' }}><SepBar t={t} pct={tot.pct} height={9} /></div>
    </Card>
  );
}

// ---------- Stepper ----------
function SepStepper({ t, label, value, onChange, accent, maxed, minned, disabled }) {
  const c = accent || t.accent;
  const btn = (txt, fn, off) => (
    <button onClick={off ? undefined : fn} disabled={off} style={{ all: 'unset', cursor: off ? 'not-allowed' : 'pointer', width: 30, height: 32, display: 'grid', placeItems: 'center', color: off ? t.faint : t.muted, opacity: off ? 0.45 : 1, fontSize: 18, fontWeight: 700 }}
      onMouseEnter={(e) => { if (!off) e.currentTarget.style.color = c; }} onMouseLeave={(e) => { if (!off) e.currentTarget.style.color = t.muted; }}>{txt}</button>
  );
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: t.faint, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', background: t.elevated, border: `1px solid ${t.border}`, borderRadius: 11, overflow: 'hidden', opacity: disabled ? 0.5 : 1 }}>
        {btn('−', () => onChange(-1), disabled || minned)}
        <div style={{ minWidth: 30, fontSize: 15, fontWeight: 800, color: t.text }}>{value}</div>
        {btn('+', () => onChange(1), disabled || maxed)}
      </div>
    </div>
  );
}

// ---------- Item row ----------
function SepItemRow({ t, item, onSep, onQtd, onRemove, readOnly, edit, disabled }) {
  const done = item.sep >= item.qtd;
  const pct = item.qtd ? Math.round((item.sep / item.qtd) * 100) : 0;
  const maxSep = Math.min(item.qtd, item.disp);   // não separar além do solicitado nem do estoque
  const semEstoque = item.disp < item.qtd;        // estoque insuficiente para atender o pedido
  const aSeparar = item.qtd - item.sep;           // reservado ainda não separado
  const livre = item.disp - item.sep;             // estoque livre após esta separação
  const disponivel = !done && livre > 0;          // tem estoque e ainda falta separar
  return (
    <Card t={t} style={{ position: 'relative', padding: 18, borderColor: done ? 'rgba(16,185,129,.4)' : (disponivel ? 'rgba(37,99,235,.35)' : (semEstoque ? 'rgba(245,158,11,.4)' : t.border)) }}>
      {disponivel && !edit && <div style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, borderRadius: 3, background: t.accent }} />}
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: t.muted, background: t.hover, padding: '3px 9px', borderRadius: 7, fontVariantNumeric: 'tabular-nums' }}>{item.sku}</span>
            {done
              ? <Badge t={t} kind="green" dot>Completo</Badge>
              : <Badge t={t} kind="amber" dot>Faltam {aSeparar}</Badge>}
            {disponivel && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: t.accentSoft, color: t.accentText }}>
                <span style={{ position: 'relative', width: 7, height: 7 }}>
                  <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: t.accent }} />
                  <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: t.accent, animation: 'sepPing 1.6s cubic-bezier(0,0,.2,1) infinite' }} />
                </span>
                Disponível p/ separar
              </span>
            )}
            {semEstoque && !done && <Badge t={t} kind="red" dot>Estoque insuficiente</Badge>}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 12, textWrap: 'pretty' }}>{item.nome}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.muted }}>Separado: <strong style={{ color: done ? '#10b981' : t.text }}>{item.sep}</strong> / {item.qtd}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{SEP_BRL(item.sep * item.preco)}</span>
          </div>
          <SepBar t={t} pct={pct} height={7} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22 }}>
          {edit ? (
            <>
              <SepStepper t={t} label="Solicitado" value={item.qtd} minned={item.qtd <= 1} disabled={disabled}
                onChange={(d) => onQtd(Math.max(1, item.qtd + d))} />
              <button title="Remover material" onClick={disabled ? undefined : onRemove} disabled={disabled} style={{ all: 'unset', cursor: disabled ? 'not-allowed' : 'pointer', width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: t.elevated, border: `1px solid ${t.border}`, color: '#ef4444', alignSelf: 'flex-end', opacity: disabled ? 0.5 : 1 }}
                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; }}>
                <Icon name="trash" size={17} />
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: t.faint, letterSpacing: '.05em', textTransform: 'uppercase' }}>A separar</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: aSeparar > 0 ? t.text : '#10b981', marginTop: 6 }}>{aSeparar}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: t.faint, letterSpacing: '.05em', textTransform: 'uppercase' }}>Em estoque</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: livre < 0 ? '#ef4444' : t.text, marginTop: 6 }}>{livre}</div>
              </div>
              {!readOnly && (
                <SepStepper t={t} label="Separar" value={item.sep} disabled={disabled}
                  accent={done ? '#10b981' : t.accent}
                  maxed={item.sep >= maxSep} minned={item.sep <= 0}
                  onChange={(d) => onSep(Math.min(maxSep, Math.max(0, item.sep + d)))} />
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

// ---------- Add material picker (catálogo REAL via prop) ----------
function SepAddPicker({ t, itens, catalog, onAdd, onClose }) {
  const [q, setQ] = useStateSep('');
  const inList = new Set(itens.map((i) => i.product_id));
  const view = catalog.filter((c) => !q || c.nome.toLowerCase().includes(q.toLowerCase()) || c.sku.includes(q));
  const addedCount = catalog.filter((c) => inList.has(c.product_id)).length;
  return (
    <Card t={t} style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>Catálogo de materiais</div>
        <span style={{ fontSize: 12, color: t.muted }}>{addedCount} de {catalog.length} já na lista</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160, height: 38, padding: '0 12px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}`, marginLeft: 'auto' }}>
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar no catálogo…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 13, fontFamily: 'inherit' }} />
        </label>
        <button onClick={onClose} title="Fechar" style={{ all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={17} /></button>
      </div>
      <div className="fr-scroll" style={{ maxHeight: 320, overflowY: 'auto' }}>
        {view.map((c, i) => {
          const added = inList.has(c.product_id);
          return (
            <div key={c.product_id || c.sku} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 16px', borderBottom: i < view.length - 1 ? `1px solid ${t.border}` : 'none', background: added ? 'rgba(16,185,129,.06)' : 'transparent' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.muted, background: t.hover, padding: '3px 8px', borderRadius: 6, fontVariantNumeric: 'tabular-nums' }}>{c.sku}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</div>
                <div style={{ fontSize: 11.5, color: t.faint, marginTop: 1 }}>{SEP_BRL(c.preco)} · disponível {c.disp}</div>
              </div>
              {added
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#10b981' }}><Icon name="check" size={15} />Na lista</span>
                : <button onClick={() => onAdd(c)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: t.accentSoft, color: t.accentText }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.accent; e.currentTarget.style.color = t.onAccent; }} onMouseLeave={(e) => { e.currentTarget.style.background = t.accentSoft; e.currentTarget.style.color = t.accentText; }}>
                    <Icon name="plus" size={15} />Adicionar</button>}
            </div>
          );
        })}
        {view.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: t.muted, fontSize: 13 }}>Nada encontrado no catálogo.</div>}
      </div>
    </Card>
  );
}

// ---------- Import Excel/CSV modal (catálogo REAL via prop) ----------
function sepParseRows(text) {
  const out = [];
  text.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    const cells = line.split(/[;,\t]/).map((c) => c.trim());
    const sku = cells[0];
    let qtd = NaN;
    for (let i = cells.length - 1; i >= 1; i--) { const n = parseInt(cells[i].replace(/[^\d-]/g, ''), 10); if (!isNaN(n)) { qtd = n; break; } }
    if (sku && /\d/.test(sku) && !isNaN(qtd) && qtd > 0) out.push({ sku, qtd });
  });
  return out;
}
function SepImportModal({ t, itens, catMap, onApply, onClose }) {
  const [text, setText] = useStateSep('');
  const rows = useMemoSep(() => sepParseRows(text), [text]);
  const inList = new Set(itens.map((i) => i.sku));
  const updates = rows.filter((r) => inList.has(r.sku));
  const adds = rows.filter((r) => !inList.has(r.sku) && catMap[r.sku]);
  const unknown = rows.filter((r) => !inList.has(r.sku) && !catMap[r.sku]);
  const onFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setText(String(r.result || ''));
    r.readAsText(f);
  };
  const example = '5.20.0099;120\n6.30.0012;3\n8.10.0033;500\n3.02.0270;6';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(620px, 100%)', maxHeight: '88vh', overflowY: 'auto', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, boxShadow: '0 24px 64px rgba(0,0,0,.4)' }} className="fr-scroll">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${t.border}` }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>Importar planilha</div>
            <div style={{ fontSize: 12.5, color: t.muted, marginTop: 2 }}>Atualiza as quantidades e adiciona novos itens à lista.</div>
          </div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}` }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, height: 42, padding: '0 18px', borderRadius: 12, background: t.accent, color: t.onAccent, fontSize: 13.5, fontWeight: 700 }}>
              <Icon name="upload" size={17} />Selecionar arquivo
              <input type="file" accept=".csv,.txt,.tsv,.xlsx" onChange={onFile} style={{ display: 'none' }} />
            </label>
            <Btn t={t} kind="ghost" icon="sheet" onClick={() => setText(example)}>Usar exemplo</Btn>
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: t.faint, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 7 }}>Conteúdo (SKU; Quantidade — um por linha)</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'5.20.0099;120\n6.30.0012;3'} rows={5}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', border: `1px solid ${t.border}`, borderRadius: 12, background: t.elevated, color: t.text, fontSize: 13, fontFamily: 'ui-monospace, monospace', padding: 12, outline: 'none' }} />

          {rows.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Badge t={t} kind="blue">{updates.length} atualizações</Badge>
                <Badge t={t} kind="green">{adds.length} novos</Badge>
                {unknown.length > 0 && <Badge t={t} kind="red">{unknown.length} SKU não encontrado</Badge>}
              </div>
              <div className="fr-scroll" style={{ maxHeight: 230, overflowY: 'auto', border: `1px solid ${t.border}`, borderRadius: 12 }}>
                {[...updates.map((r) => ({ ...r, kind: 'upd' })), ...adds.map((r) => ({ ...r, kind: 'add' })), ...unknown.map((r) => ({ ...r, kind: 'unk' }))].map((r, i, arr) => {
                  const cur = itens.find((x) => x.sku === r.sku);
                  const nome = (catMap[r.sku] || {}).nome || (cur || {}).nome || 'Material desconhecido';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none', opacity: r.kind === 'unk' ? 0.6 : 1 }}>
                      <Badge t={t} kind={r.kind === 'upd' ? 'blue' : r.kind === 'add' ? 'green' : 'red'}>{r.kind === 'upd' ? 'Atualiza' : r.kind === 'add' ? 'Novo' : '?'}</Badge>
                      <span style={{ fontSize: 11.5, color: t.muted, fontVariantNumeric: 'tabular-nums' }}>{r.sku}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{cur ? `${cur.qtd} → ${r.qtd}` : r.qtd}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: `1px solid ${t.border}` }}>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn t={t} icon="check" onClick={() => onApply(updates.concat(adds))}>Aplicar importação{rows.length ? ` (${updates.length + adds.length})` : ''}</Btn>
        </div>
      </div>
    </div>
  );
}

// ---------- Detail ----------
const SEP_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'disp', label: 'Disponível p/ separar' },
  { id: 'pend', label: 'A separar' },
  { id: 'done', label: 'Completos' },
];
function sepItemFlags(i) {
  const done = i.sep >= i.qtd;
  return { done, disponivel: !done && (i.disp - i.sep) > 0, pend: !done };
}

function SepDetail({ t, sep, busy, catalog, catMap, archived, onBack, onReserve, onDeliver, onUpdateOrder, onCancel, onArchive, onUnarchive, notify }) {
  const [itens, setItens] = useStateSep(() => sep.itens.map((i) => ({ ...i })));
  const [cliente, setCliente] = useStateSep(sep.cliente);
  const [tab, setTab] = useStateSep('itens');
  const [q, setQ] = useStateSep('');
  const [fil, setFil] = useStateSep('todos');
  const [edit, setEdit] = useStateSep(false);
  const [picker, setPicker] = useStateSep(false);
  const [importing, setImport] = useStateSep(false);
  const [flash, setFlash] = useStateSep(null);
  const [delivOpen, setDelivOpen] = useStateSep(false);
  const [destino, setDestino] = useStateSep('');
  const st = SEP_STATUS[sep.status];
  const editable = sep.status === 'separacao';

  // Re-sincroniza o rascunho local sempre que os dados do servidor mudarem (após reload de mutação).
  useEffectSep(() => {
    setItens(sep.itens.map((i) => ({ ...i })));
    setCliente(sep.cliente);
    setEdit(false);
    setPicker(false);
    setImport(false);
  }, [sep]);

  const tot = useMemoSep(() => {
    const totQ = itens.reduce((a, i) => a + i.qtd, 0), sepQ = itens.reduce((a, i) => a + i.sep, 0);
    return { sep: itens.reduce((a, i) => a + i.sep * i.preco, 0), totQ, sepQ, pct: totQ ? Math.round((sepQ / totQ) * 100) : 0 };
  }, [itens]);

  // Rascunho de RESERVA (steppers "Separar") diverge do servidor?
  const reserveDirty = useMemoSep(() => {
    const byId = {}; sep.itens.forEach((i) => { if (i.id) byId[i.id] = i; });
    return itens.some((it) => { const s = it.id ? byId[it.id] : null; return !s || Number(s.sep) !== Number(it.sep); });
  }, [itens, sep]);

  // Rascunho de EDIÇÃO do pedido (cliente / qtd solicitada / itens add/remove) diverge?
  const editDirty = useMemoSep(() => {
    if (cliente !== sep.cliente) return true;
    if (itens.length !== sep.itens.length) return true;
    const orig = {}; sep.itens.forEach((i) => { orig[i.product_id] = i; });
    for (const it of itens) { const o = orig[it.product_id]; if (!o || Number(o.qtd) !== Number(it.qtd)) return true; }
    return false;
  }, [itens, cliente, sep]);

  const flashIt = (msg) => { setFlash(msg); setTimeout(() => setFlash(null), 2600); };

  // ---- edições LOCAIS (sem escrita) ----
  const setSep = (idx, v) => setItens((xs) => xs.map((it, i) => i === idx ? { ...it, sep: v } : it));
  const setQtd = (idx, v) => setItens((xs) => xs.map((it, i) => i === idx ? { ...it, qtd: v } : it));
  const removeItem = (idx) => {
    const it = itens[idx];
    setItens((xs) => xs.filter((_, i) => i !== idx));
    if (it.sep > 0) flashIt(`${it.nome} removido — a reserva (${it.sep} un.) será liberada ao salvar a edição.`);
    else flashIt(`${it.nome} removido — confirme em "Salvar edição".`);
  };
  const addItem = (c) => {
    if (itens.some((i) => i.product_id === c.product_id)) return;
    setItens((xs) => [...xs, { id: null, product_id: c.product_id, sku: c.sku, nome: c.nome, preco: c.preco, qtd: 1, sep: 0, onHand: c.estoque, reserved: c.estoque - c.disp, disp: c.disp }]);
  };
  const applyImport = (rows) => {
    setItens((prev) => {
      const next = prev.map((i) => ({ ...i }));
      let add = 0, upd = 0;
      rows.forEach(({ sku, qtd }) => {
        const ex = next.find((i) => i.sku === sku);
        if (ex) { ex.qtd = qtd; upd++; }
        else { const c = catMap[sku]; if (c) { next.push({ id: null, product_id: c.product_id, sku: c.sku, nome: c.nome, preco: c.preco, qtd, sep: 0, onHand: c.estoque, reserved: c.estoque - c.disp, disp: c.disp }); add++; } }
      });
      flashIt(`Planilha aplicada ao rascunho — ${add} adicionados, ${upd} atualizados. Clique em "Salvar edição".`);
      return next;
    });
    setImport(false);
  };

  // ---- ações REAIS (backend + reload no pai) ----
  const doReserve = async () => { if (busy) return; await onReserve(sep.id, itens); };
  const doneEdit = async () => {
    if (!edit) { setEdit(true); return; }
    if (editDirty) { const ok = await onUpdateOrder(sep.id, { cliente, itens }); if (ok) setEdit(false); }
    else setEdit(false);
  };
  const doDeliver = async () => { if (busy) return; setDelivOpen(false); await onDeliver(sep.id, itens, destino); };
  const doCancel = async () => {
    if (busy) return;
    if (!window.confirm('Cancelar esta separação? As reservas de estoque serão liberadas. Esta ação não pode ser desfeita.')) return;
    await onCancel(sep.id);
  };

  const dispCount = itens.filter((i) => sepItemFlags(i).disponivel).length;
  const matchFil = (i) => {
    const f = sepItemFlags(i);
    if (fil === 'disp') return f.disponivel;
    if (fil === 'pend') return f.pend;
    if (fil === 'done') return f.done;
    return true;
  };
  const view = itens.filter((i) => (!q || i.nome.toLowerCase().includes(q.toLowerCase()) || i.sku.includes(q)) && matchFil(i));

  const iconBtn = (name, fn, title, active, danger) => (
    <button title={title} onClick={fn} disabled={busy} style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', opacity: busy ? 0.6 : 1,
      background: active ? t.accent : t.elevated, border: `1px solid ${active ? t.accent : t.border}`, color: active ? t.onAccent : (danger ? '#ef4444' : t.muted), transition: 'all .14s' }}
      onMouseEnter={(e) => { if (!active && !busy) { e.currentTarget.style.borderColor = danger ? '#ef4444' : t.borderStrong; e.currentTarget.style.color = danger ? '#ef4444' : t.text; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = danger ? '#ef4444' : t.muted; } }}>
      <Icon name={name} size={18} />
    </button>
  );

  return (
    <div style={{ paddingBottom: editable && !edit ? 96 : 20 }}>
      <style>{`@keyframes sepPing{0%{transform:scale(1);opacity:.5}70%,100%{transform:scale(2.6);opacity:0}}`}</style>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <button onClick={onBack} style={{ all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: t.elevated, border: `1px solid ${t.border}`, color: t.text, flexShrink: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = t.elevated; }}>
          <Icon name="chevronLeft" size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: t.text, background: t.hover, border: `1px solid ${t.border}`, padding: '4px 10px', borderRadius: 8 }}>OP: {sep.op || '—'}</span>
            <Badge t={t} kind={st.kind}>{st.label}</Badge>
            {edit && <Badge t={t} kind="blue" dot>Editando</Badge>}
          </div>
          {edit
            ? <input value={cliente} onChange={(e) => setCliente(e.target.value)} style={{ width: '100%', maxWidth: 520, border: `1px solid ${t.border}`, borderRadius: 10, background: t.elevated, color: t.text, fontSize: 22, fontWeight: 800, padding: '8px 12px', fontFamily: 'inherit', outline: 'none' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = t.accent; }} onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }} />
            : <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: '-.02em', textWrap: 'pretty' }}>{cliente}</h1>}
          {sep.status === 'entregue' && sep.entrega && (
            <div style={{ marginTop: 8, fontSize: 12.5, color: t.muted, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icon name="truck" size={15} />Entregue em {sep.entrega.em}{sep.entrega.destino ? ` · destino ${sep.entrega.destino}` : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right', marginRight: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t.faint, letterSpacing: '.06em', textTransform: 'uppercase' }}>Valor separado</div>
            <div style={{ fontSize: 21, fontWeight: 850, color: '#10b981' }}>{SEP_BRL(tot.sep)}</div>
          </div>
          {editable && iconBtn(edit ? 'check' : 'pencil', doneEdit, edit ? 'Salvar edição' : 'Editar pedido', edit)}
          {editable && !edit && iconBtn('trash', doCancel, 'Cancelar separação (libera reservas)', false, true)}
          {sep.status === 'entregue' && !archived && iconBtn('box', () => onArchive(sep.id), 'Arquivar')}
          {sep.status === 'entregue' && archived && iconBtn('refresh', () => onUnarchive(sep.id), 'Desarquivar')}
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <div style={{ flex: 1 }}><SepBar t={t} pct={tot.pct} tone="blue" height={9} /></div>
        <span style={{ fontSize: 14, fontWeight: 800, color: tot.pct >= 100 ? '#10b981' : t.text, minWidth: 44, textAlign: 'right' }}>{tot.pct}%</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'inline-flex', gap: 4, padding: 5, background: t.elevated, border: `1px solid ${t.border}`, borderRadius: 14, marginBottom: 18 }}>
        {[['itens', 'Itens do Pedido'], ['dev', `Devoluções${sep.devolucoes.length ? ` (${sep.devolucoes.length})` : ''}`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ all: 'unset', cursor: 'pointer', padding: '11px 22px', borderRadius: 11, fontSize: 13.5, fontWeight: 700, background: tab === id ? t.text : 'transparent', color: tab === id ? t.panel : t.muted, transition: 'all .15s' }}>{label}</button>
        ))}
      </div>

      {tab === 'itens' ? (
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 50, padding: '0 16px', borderRadius: 13, background: t.elevated, border: `1px solid ${t.border}`, marginBottom: 14 }}>
            <Icon name="search" size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar material no pedido por nome ou SKU…"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
          </label>
          {edit && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Btn t={t} kind={picker ? 'primary' : 'soft'} icon="plus" onClick={() => { setPicker((v) => !v); setImport(false); }}>Adicionar material</Btn>
                <Btn t={t} kind="soft" icon="sheet" onClick={() => { setImport(true); setPicker(false); }}>Importar Excel</Btn>
                <span style={{ alignSelf: 'center', fontSize: 12.5, color: t.muted }}>{itens.length} materiais na lista</span>
              </div>
              {picker && <SepAddPicker t={t} itens={itens} catalog={catalog} onAdd={addItem} onClose={() => setPicker(false)} />}
            </div>
          )}
          {!edit && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {SEP_FILTERS.map((f) => {
                const on = fil === f.id;
                const badge = f.id === 'disp' && dispCount > 0;
                return (
                  <button key={f.id} onClick={() => setFil(f.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    background: on ? (f.id === 'disp' ? t.accent : t.text) : t.elevated, color: on ? (f.id === 'disp' ? t.onAccent : t.panel) : t.muted, border: `1px solid ${on ? 'transparent' : t.border}`, transition: 'all .15s' }}>
                    {f.id === 'disp' && <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? t.onAccent : t.accent }} />}
                    {f.label}
                    {badge && <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 7, background: on ? 'rgba(255,255,255,.25)' : t.accentSoft, color: on ? t.onAccent : t.accentText }}>{dispCount}</span>}
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {view.map((it) => {
              const idx = itens.indexOf(it);
              return <SepItemRow key={it.id || it.product_id || it.sku} t={t} item={it} readOnly={!editable} edit={edit} disabled={busy}
                onSep={(v) => setSep(idx, v)} onQtd={(v) => setQtd(idx, v)} onRemove={() => removeItem(idx)} />;
            })}
            {view.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 14 }}>Nenhum material neste filtro.</div>}
          </div>
        </div>
      ) : (
        <Card t={t} style={{ padding: 0 }}>
          {sep.devolucoes.length === 0
            ? <div style={{ padding: '50px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Nenhuma devolução</div>
                <div style={{ fontSize: 13.5, color: t.muted, marginTop: 6 }}>Materiais devolvidos por este setor aparecerão aqui.</div>
              </div>
            : (sep.devolucoes.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: i < sep.devolucoes.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <span style={{ color: t.text, fontWeight: 600 }}>{d.nome}</span><span style={{ color: t.muted }}>{d.qtd} {d.un}</span>
                </div>
              )))}
        </Card>
      )}

      {/* Sticky footer — só no modo separar (não-edição) de pedidos ativos */}
      {editable && !edit && (
        <div style={{ position: 'sticky', bottom: 0, marginTop: 22, marginLeft: -4, marginRight: -4, padding: '14px 20px', borderRadius: 16,
          background: t.panel, border: `1px solid ${t.borderStrong}`, boxShadow: t.shadow, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: t.faint, letterSpacing: '.06em', textTransform: 'uppercase' }}>Valor separado</div>
            <div style={{ fontSize: 20, fontWeight: 850, color: '#10b981' }}>{SEP_BRL(tot.sep)} <span style={{ fontSize: 13, color: t.muted, fontWeight: 700 }}>· {tot.sepQ}/{tot.totQ} itens</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: reserveDirty ? '#f59e0b' : t.muted }}>
              <Icon name={reserveDirty ? 'alert' : 'check'} size={15} />{reserveDirty ? 'Alterações não salvas' : 'Reservas em dia'}
            </span>
            {(() => {
              const off = busy || !reserveDirty;
              return (
                <button onClick={off ? undefined : doReserve} disabled={off} title={reserveDirty ? 'Salvar as quantidades separadas (reservar no estoque)' : 'Sem alterações de separação para salvar'}
                  style={{ all: 'unset', boxSizing: 'border-box', cursor: off ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, background: t.accentSoft, color: t.accentText, border: '1px solid transparent', opacity: off ? 0.55 : 1 }}>
                  <Icon name="check" size={17} />{busy ? 'Salvando…' : 'Salvar separação'}
                </button>
              );
            })()}
            {(() => {
              const off = busy || reserveDirty;
              return (
                <button onClick={off ? undefined : () => { setDestino(sep.destino || sep.armazem || ''); setDelivOpen(true); }} disabled={off}
                  title={reserveDirty ? 'Salve a separação antes de entregar' : 'Confirmar entrega (baixa o estoque físico)'}
                  style={{ all: 'unset', boxSizing: 'border-box', cursor: off ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, background: off ? t.elevated : t.accent, color: off ? t.faint : t.onAccent, border: `1px solid ${off ? t.border : t.accent}`, boxShadow: off ? 'none' : `0 4px 12px ${frHexToRgba(t.accent, 0.28)}` }}>
                  <Icon name="truck" size={17} />Confirmar Entrega
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {importing && <SepImportModal t={t} itens={itens} catMap={catMap} onApply={applyImport} onClose={() => setImport(false)} />}

      {/* Modal: armazém de destino antes da entrega */}
      {delivOpen && (
        <div onClick={() => setDelivOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="truck" size={20} /></span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>Confirmar entrega</div><div style={{ fontSize: 12.5, color: t.muted }}>Baixa o estoque físico do que foi separado e envia ao armazém escolhido.</div></div>
              <button onClick={() => setDelivOpen(false)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 10 }}>Armazém de destino</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SEP_ARMAZENS.map((a) => {
                  const on = destino === a;
                  return (
                    <button key={a} onClick={() => setDestino(a)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${on ? t.accent : t.border}`, background: on ? t.accentSoft : t.elevated }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: on ? t.accent : t.hover, color: on ? t.onAccent : t.muted, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={16} /></span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: t.text }}>{a}</span>
                      {on && <Icon name="check" size={17} style={{ color: t.accentText }} />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Btn t={t} kind="ghost" onClick={() => setDelivOpen(false)}>Cancelar</Btn>
              <button onClick={doDeliver} disabled={!destino || busy}
                style={{ all: 'unset', boxSizing: 'border-box', cursor: (destino && !busy) ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, background: (destino && !busy) ? t.accent : t.elevated, color: (destino && !busy) ? t.onAccent : t.faint, boxShadow: (destino && !busy) ? `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` : 'none' }}>
                <Icon name="truck" size={16} /> {busy ? 'Entregando…' : 'Confirmar entrega'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast local (rascunho) */}
      {flash && (
        <div style={{ position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', alignItems: 'center', gap: 9,
          background: t.text, color: t.panel, padding: '12px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, boxShadow: '0 12px 32px rgba(0,0,0,.3)', maxWidth: '92vw' }}>
          <Icon name="check" size={16} />{flash}
        </div>
      )}
    </div>
  );
}

// ---------- Nova Separação modal (catálogo REAL via prop) ----------
const SEP_ARMAZENS = ['Almoxarifado', 'Geral', 'Usinagem', 'Produção 3D', 'Elétrica', 'Montagem'];
function SepNovaModal({ t, catalog, busy, onClose, onCreate }) {
  const [op, setOp] = useStateSep('');
  const [cliente, setCliente] = useStateSep('');
  const [armazem, setArmazem] = useStateSep(SEP_ARMAZENS[0]);
  const [itens, setItens] = useStateSep([]);
  const [q, setQ] = useStateSep('');
  const [opOpen, setOpOpen] = useStateSep(false);
  const [opQuery, setOpQuery] = useStateSep('');
  const ql = q.trim().toLowerCase();
  const ops = (window.FR_OPS_ATIVAS || []);
  const opFlat = ops.flatMap((c) => c.ops.map((o) => ({ op: o, cliente: c.cliente })));
  const opl = opQuery.trim().toLowerCase();
  const opView = opFlat.filter((x) => !opl || x.op.toLowerCase().includes(opl) || x.cliente.toLowerCase().includes(opl));
  const disponiveis = catalog.filter((c) => !ql || c.nome.toLowerCase().includes(ql) || c.sku.includes(ql));
  const naLista = (pid) => itens.some((i) => i.product_id === pid);
  const addItem = (c) => { if (!naLista(c.product_id)) setItens((xs) => [...xs, { product_id: c.product_id, sku: c.sku, nome: c.nome, qtd: 1, preco: c.preco, disp: c.disp }]); };
  const setQtd = (pid, v) => setItens((xs) => xs.map((i) => (i.product_id === pid ? { ...i, qtd: Math.max(1, parseInt(String(v).replace(/[^0-9]/g, '')) || 1) } : i)));
  const delItem = (pid) => setItens((xs) => xs.filter((i) => i.product_id !== pid));
  const valid = op.trim() && cliente.trim() && itens.length && !busy;
  const total = itens.reduce((a, i) => a + i.preco * i.qtd, 0);
  const field = { boxSizing: 'border-box', height: 46, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 8 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(820px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="plus" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Nova separação</div><div style={{ fontSize: 12.5, color: t.muted }}>Cria o pedido (sem reservar). A reserva acontece ao separar os materiais.</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>

        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={lab}>OP</label>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setOpOpen((v) => !v)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 46, borderRadius: 11, border: `1px solid ${opOpen ? t.accent : t.border}`, background: t.elevated, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="clipboard" size={16} style={{ color: op ? t.accentText : t.muted, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {op
                      ? <><span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>OP {op}</span>{cliente ? <span style={{ fontSize: 12, color: t.muted }}> · {cliente}</span> : ''}</>
                      : <span style={{ fontSize: 14, color: t.muted }}>Selecionar OP…</span>}
                  </div>
                  <Icon name="chevronDown" size={16} style={{ color: t.muted, flexShrink: 0, transform: opOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                </button>
                {opOpen && (
                  <>
                    <div onClick={() => setOpOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 2, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 13, boxShadow: t.shadow, overflow: 'hidden' }}>
                      <div style={{ padding: 10, borderBottom: `1px solid ${t.border}` }}>
                        <div style={{ position: 'relative' }}>
                          <Icon name="search" size={15} style={{ position: 'absolute', left: 11, top: 11, color: t.muted }} />
                          <input autoFocus value={opQuery} onChange={(e) => setOpQuery(e.target.value)} placeholder="Buscar OP ou cliente…" style={{ boxSizing: 'border-box', width: '100%', height: 38, borderRadius: 9, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px 0 34px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                      </div>
                      <div className="fr-scroll" style={{ maxHeight: 240, overflowY: 'auto', padding: 6 }}>
                        {opView.map((x) => {
                          const on = op === x.op && cliente === x.cliente;
                          return (
                            <button key={x.cliente + x.op} onClick={() => { setOp(x.op); setCliente(x.cliente); setOpOpen(false); setOpQuery(''); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 9, background: on ? t.accentSoft : 'transparent' }}
                              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                              <span style={{ width: 34, height: 34, borderRadius: 9, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800 }}><Icon name="clipboard" size={15} /></span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>OP {x.op}</div>
                                <div style={{ fontSize: 12, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.cliente}</div>
                              </div>
                              {on && <Icon name="check" size={16} style={{ color: t.accentText, flexShrink: 0 }} />}
                            </button>
                          );
                        })}
                        {opView.length === 0 && <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: 12.5, color: t.muted }}>Nenhuma OP encontrada. Você pode digitar a OP manualmente abaixo.</div>}
                      </div>
                      <div style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>
                        <input value={op} onChange={(e) => setOp(e.target.value)} placeholder="Ou digite uma OP avulsa…" style={{ boxSizing: 'border-box', width: '100%', height: 36, borderRadius: 9, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <label style={lab}>Armazém de destino</label>
              <div style={{ position: 'relative' }}>
                <select value={armazem} onChange={(e) => setArmazem(e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 34, cursor: 'pointer' }}>{SEP_ARMAZENS.map((a) => <option key={a}>{a}</option>)}</select>
                <Icon name="chevronDown" size={16} style={{ position: 'absolute', right: 12, top: 15, color: t.muted, pointerEvents: 'none' }} />
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={lab}>Cliente</label>
            <input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex: Granja Paraíso / Elétrica" style={field} />
          </div>

          <label style={lab}>Materiais a separar</label>
          {itens.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {itens.map((it) => (
                <div key={it.product_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{it.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {it.sku} · disponível {it.disp}</div></div>
                  <input value={it.qtd} onChange={(e) => setQtd(it.product_id, e.target.value)} inputMode="numeric" style={{ boxSizing: 'border-box', width: 60, height: 36, textAlign: 'center', borderRadius: 9, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                  <button onClick={() => delItem(it.product_id)} style={{ all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
                </div>
              ))}
            </div>
          )}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Icon name="search" size={16} style={{ position: 'absolute', left: 13, top: 15, color: t.muted }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar material por nome ou SKU…" style={{ ...field, paddingLeft: 40 }} />
          </div>
          <div className="fr-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
            {disponiveis.map((c) => {
              const on = naLista(c.product_id);
              return (
                <button key={c.product_id || c.sku} onClick={() => addItem(c)} disabled={on} style={{ all: 'unset', boxSizing: 'border-box', cursor: on ? 'default' : 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 11, border: `1px solid ${on ? frHexToRgba('#22c55e', 0.4) : t.border}`, background: on ? frHexToRgba('#22c55e', 0.08) : t.elevated }}
                  onMouseEnter={(e) => { if (!on) e.currentTarget.style.borderColor = t.accent; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.borderColor = t.border; }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{c.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {c.sku} · disponível {c.disp}</div></div>
                  {on ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#22c55e' }}><Icon name="check" size={14} /> Na lista</span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: t.accentText }}><Icon name="plus" size={14} /> Adicionar</span>}
                </button>
              );
            })}
            {disponiveis.length === 0 && <div style={{ padding: 24, textAlign: 'center', fontSize: 12.5, color: t.muted }}>Nenhum produto no catálogo. Cadastre produtos no módulo de Estoque.</div>}
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12.5, color: t.muted }}>{itens.length} {itens.length === 1 ? 'material' : 'materiais'} · total <b style={{ color: t.text }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></div>
          <button onClick={() => valid && onCreate({ op: op.trim(), cliente: cliente.trim(), armazem, itens })} disabled={!valid}
            style={{ all: 'unset', boxSizing: 'border-box', cursor: valid ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 9, height: 48, padding: '0 24px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: valid ? t.accent : t.elevated, color: valid ? t.onAccent : t.faint, boxShadow: valid ? `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` : 'none' }}>
            <Icon name="check" size={17} /> {busy ? 'Criando…' : 'Criar separação'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------
function PageQuadroGestao({ t }) {
  const { items: list, loading, error, reload } = useFRSeparations();
  const prodHook = window.useFRProducts ? window.useFRProducts() : { items: [] };
  const products = prodHook.items || [];
  const catalog = useMemoSep(() => products
    .filter((c) => c && c.product_id && c.active !== false)
    .map((c) => ({ product_id: c.product_id, sku: c.sku, nome: c.nome, preco: c.precoNum, disp: c.disp, estoque: c.estoque })), [products]);
  const catMap = useMemoSep(() => { const m = {}; catalog.forEach((c) => { m[c.sku] = c; }); return m; }, [catalog]);

  const [tab, setTab] = useStateSep('separacao');
  const [q, setQ] = useStateSep('');
  const [selId, setSelId] = useStateSep(null);
  const [novaOpen, setNovaOpen] = useStateSep(false);
  const [busy, setBusy] = useStateSep(false);
  const [toast, setToast] = useStateSep(null);
  const [archived, setArchived] = useStateSep(sepLoadArchived);
  useEffectSep(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4400); return () => clearTimeout(id); }, [toast]);
  const busyRef = useRefSep(false); busyRef.current = busy;
  const okToast = (msg) => setToast({ kind: 'ok', msg });
  const errToast = (e) => setToast({ kind: 'err', msg: sepErr(e) });

  // executa uma mutação: bloqueia reentrância, chama FRApi, refaz o fetch, toast honesto
  const runAction = async (fn, okMsg) => {
    if (busyRef.current) return false;
    setBusy(true);
    try { await fn(); reload(); if (okMsg) okToast(okMsg); return true; }
    catch (e) { errToast(e); return false; }
    finally { setBusy(false); }
  };

  const criar = (data) => runAction(async () => {
    await window.FRApi.post('/separations', {
      client_name: data.cliente,
      production_order: data.op,
      destination: data.armazem,
      client_service_id: null,
      items: data.itens.map((i) => ({ product_id: i.product_id, quantity: i.qtd, observation: null })),
    });
    setNovaOpen(false); setTab('separacao');
  }, 'Separação criada. Reserve os materiais para começar.');

  const onReserve = (id, itens) => runAction(
    () => window.FRApi.put('/separations/' + id + '/authorize', { action: 'reservar', items: itens.filter((i) => i.id).map((i) => ({ id: i.id, quantity: i.sep })) }),
    'Separação salva — reservas atualizadas.',
  );

  const onDeliver = (id, itens, destino) => runAction(async () => {
    const sep = list.find((s) => s.id === id);
    if (destino && sep && destino !== sep.destino) {
      await window.FRApi.put('/separations/' + id, {
        client_name: sep.cliente, production_order: sep.op, destination: destino,
        client_service_id: sep.client_service_id || null,
        items: sep.itens.map((i) => ({ product_id: i.product_id, quantity: i.qtd })),
      });
    }
    await window.FRApi.put('/separations/' + id + '/authorize', { action: 'entregar', items: itens.filter((i) => i.id).map((i) => ({ id: i.id, quantity: i.sep })) });
    setSelId(null); setTab('entregue');
  }, 'Entrega confirmada — baixa de estoque registrada.');

  const onUpdateOrder = (id, payload) => runAction(async () => {
    const sep = list.find((s) => s.id === id);
    await window.FRApi.put('/separations/' + id, {
      client_name: payload.cliente,
      production_order: sep ? sep.op : '',
      destination: sep ? sep.destino : null,
      client_service_id: sep ? sep.client_service_id || null : null,
      items: payload.itens.map((i) => ({ product_id: i.product_id, quantity: i.qtd })),
    });
  }, 'Edição salva. Itens removidos tiveram a reserva liberada.');

  const onCancel = (id) => runAction(async () => {
    await window.FRApi.delete('/separations/' + id);
    setSelId(null);
  }, 'Separação cancelada — reservas liberadas no estoque.');

  const onArchive = (id) => { setArchived((a) => { const n = a.includes(id) ? a : [...a, id]; sepSaveArchived(n); return n; }); setSelId(null); setTab('arquivado'); okToast('Movida para Arquivados.'); };
  const onUnarchive = (id) => { setArchived((a) => { const n = a.filter((x) => x !== id); sepSaveArchived(n); return n; }); okToast('Removida dos Arquivados.'); };

  const archSet = new Set(archived);
  const sel = list.find((s) => s.id === selId);

  if (sel) {
    return (
      <>
        <SepDetail t={t} sep={sel} busy={busy} catalog={catalog} catMap={catMap} archived={archSet.has(sel.id)}
          onBack={() => setSelId(null)} onReserve={onReserve} onDeliver={onDeliver} onUpdateOrder={onUpdateOrder}
          onCancel={onCancel} onArchive={onArchive} onUnarchive={onUnarchive} notify={(k, m) => setToast({ kind: k, msg: m })} />
        {toast && <SepToast t={t} toast={toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  const inTab = (s) => {
    if (tab === 'separacao') return s.status === 'separacao';
    if (tab === 'entregue') return s.status === 'entregue' && !archSet.has(s.id);
    if (tab === 'arquivado') return s.status === 'entregue' && archSet.has(s.id);
    return false;
  };
  const counts = {
    separacao: list.filter((s) => s.status === 'separacao').length,
    entregue: list.filter((s) => s.status === 'entregue' && !archSet.has(s.id)).length,
    arquivado: list.filter((s) => s.status === 'entregue' && archSet.has(s.id)).length,
  };
  const view = list.filter((s) => inTab(s) && (!q || s.cliente.toLowerCase().includes(q.toLowerCase()) || s.op.includes(q)));

  return (
    <div>
      <PageHeader t={t} title="Quadro de Gestão" subtitle="Controle de separações — listas por OP, ligadas ao estoque real."
        actions={<><Btn t={t} kind="ghost" icon="refresh" onClick={() => reload()}>Atualizar</Btn><Btn t={t} icon="plus" onClick={() => setNovaOpen(true)}>Nova Separação</Btn></>} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 240, maxWidth: 460, height: 48, padding: '0 16px', borderRadius: 13, background: t.elevated, border: `1px solid ${t.border}` }}>
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente ou OP…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
        </label>
        <div style={{ display: 'inline-flex', gap: 4, padding: 5, background: t.elevated, border: `1px solid ${t.border}`, borderRadius: 14 }}>
          {SEP_TABS.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{ all: 'unset', cursor: 'pointer', padding: '9px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
              background: tab === tb.id ? t.text : 'transparent', color: tab === tb.id ? t.panel : t.muted, transition: 'all .15s' }}>
              {tb.label}{counts[tb.id] ? ` · ${counts[tb.id]}` : ''}
            </button>
          ))}
        </div>
      </div>

      {loading && list.length === 0 ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando separações…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
        </Card>
      ) : view.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>Nada por aqui</div>
          <div style={{ fontSize: 13.5, color: t.muted, marginTop: 6 }}>Nenhuma separação em "{SEP_TABS.find((x) => x.id === tab).label}".</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          {view.map((s) => <SepCard key={s.id} t={t} s={s} onOpen={() => setSelId(s.id)} />)}
        </div>
      )}

      {novaOpen && <SepNovaModal t={t} catalog={catalog} busy={busy} onClose={() => setNovaOpen(false)} onCreate={criar} />}
      {toast && <SepToast t={t} toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ---------- Toast (erro/sucesso) ----------
function SepToast({ t, toast, onClose }) {
  return (
    <div style={{ position: 'fixed', zIndex: 90, bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderRadius: 13, background: toast.kind === 'err' ? uiTone(t, 'red').fg : t.text, color: '#fff', boxShadow: '0 18px 40px rgba(0,0,0,.3)', maxWidth: '92vw' }}>
      <Icon name={toast.kind === 'err' ? 'alert' : 'check'} size={18} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
      <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', opacity: 0.7, flexShrink: 0 }}><Icon name="x" size={16} /></button>
    </div>
  );
}

Object.assign(window, { PageQuadroGestao });
