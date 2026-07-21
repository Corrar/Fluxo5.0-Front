// producao3d.jsx — "Fábrica 3D" module pages: Dashboard, Histórico, Demandas, Catálogo.
const { useState: useStateP3 } = React;
const P3_ACCENT = '#6366f1', P3_ACCENT_T = '#818cf8';

// P3_PECAS / P3_HIST / P3_DADOS (seeds de Catálogo, Histórico e Dashboard) REMOVIDOS na peça 2:
// as quatro telas do módulo renderizam 100% dos hooks reais (useFR3DParts / useFRProductions /
// useFRDemands). Nenhum dado inventado sobra na renderização.
// P3_DEMANDAS_SEED removido — Demandas renderiza 100% de useFRDemands (GET /producao-3d/demands).
const P3_DEMSTATUS = {
  analise:    { label: 'Em análise', kind: 'amber', next: 'aceita', act: 'Aceitar pedido', actIcon: 'check' },
  aceita:     { label: 'Aceita', kind: 'blue', next: 'produzindo', act: 'Iniciar produção', actIcon: 'printer' },
  produzindo: { label: 'Em produção', kind: 'accent', next: 'concluida', act: 'Finalizar peça', actIcon: 'check' },
  concluida:  { label: 'Concluída', kind: 'green' },
  rejeitada:  { label: 'Rejeitada', kind: 'red' },
  // 'Cancelada' é escrita pelo BACKEND quando a solicitação de origem é cancelada
  // (requests.controller: UPDATE demands_3d SET status='Cancelada' WHERE request_id=...) e pelo
  // DELETE /demands/:id (soft-cancel). Sem esta entrada, p3AdaptDemand caía no fallback 'analise' e
  // a demanda cancelada REAPARECIA na Fila com Aceitar/Recusar ativos — dava pra "produzir" algo já
  // cancelado (o backend só barrava na conclusão). Sem `next`/`act`: é estado terminal, sem botões.
  cancelada:  { label: 'Cancelada', kind: 'gray' },
};

// ==========================================================================
// LIGAÇÃO AO BACKEND /producao-3d (controller 100% no StockService — 06fc48d).
// Hooks compartilhados no padrão useFRClients/useFRSeparations; a peça 2 (Catálogo/
// Dashboard) reusa window.useFR3DParts / window.useFRProductions.
// ==========================================================================
function p3Err(e) { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; }
function p3Num(v) { const f = window.FRAdapters && window.FRAdapters.parseNumber; return f ? f(v) : (parseFloat(v) || 0); }
function p3Minutes(m) { m = Math.round(p3Num(m)); if (!m) return '—'; const h = Math.floor(m / 60), mm = m % 60; return (h ? h + 'h ' : '') + mm + 'min'; }
function p3RelTime(iso) { if (!iso) return ''; const d = new Date(iso); if (isNaN(d.getTime())) return ''; const s = Math.max(0, (Date.now() - d.getTime()) / 1000); if (s < 3600) return 'há ' + Math.max(1, Math.round(s / 60)) + ' min'; if (s < 86400) return 'há ' + Math.round(s / 3600) + ' h'; return 'há ' + Math.round(s / 86400) + ' dias'; }
function p3DateTime(iso) { if (!iso) return '—'; const d = new Date(iso); if (isNaN(d.getTime())) return '—'; const p = (x) => String(x).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes()); }

// Status da demanda: backend (real, capitalizado/acentuado) ↔ front (lowercase do P3_DEMSTATUS).
const P3_DEM_BACK2FRONT = { 'Em análise': 'analise', 'Aceita': 'aceita', 'Em desenvolvimento': 'produzindo', 'Concluída': 'concluida', 'Rejeitada': 'rejeitada', 'Cancelada': 'cancelada' };
const P3_DEM_FRONT2BACK = { analise: 'Em análise', aceita: 'Aceita', produzindo: 'Em desenvolvimento', concluida: 'Concluída', rejeitada: 'Rejeitada', cancelada: 'Cancelada' };

// Adapters backend → shape das telas.
function p3AdaptProduction(p) {
  p = p || {};
  return { id: p.id, product_id: p.partId || null, demandId: p.demandId || null,
    qtd: p3Num(p.quantity), gramas: p3Num(p.filamentGrams), tempo: p3Minutes(p.totalMinutes),
    // minutes/dateISO crus: o Dashboard agrega (soma horas, agrupa por período); `tempo`/`data` já vêm
    // formatados p/ exibição e não servem p/ cálculo. Aditivos — Histórico segue usando os formatados.
    minutes: p3Num(p.totalMinutes), dateISO: p.date || null,
    data: p3DateTime(p.date), operador: p.operator || '—', origem: p.demandId ? 'demanda' : 'propria' };
}
function p3AdaptDemand(d) {
  d = d || {};
  return { id: d.id, product_id: d.partId || null, requestId: d.requestId || null,
    qtd: p3Num(d.quantity), op: d.opNumber || '—', priority: d.priority || '',
    solicitante: d.requester || 'Sistema', quando: p3RelTime(d.createdAt),
    status: P3_DEM_BACK2FRONT[d.status] || 'analise', statusBack: d.status,
    // notas (`notes`) e motivoRecusa (`rejection_reason`) são campos SEPARADOS no banco (migration 010).
    // `notes` nasce com o resumo do pedido escrito pela requests.controller e vira anotação livre do
    // operador; o motivo da recusa tem coluna própria pra não ser sobrescrito pela anotação.
    notas: d.notes || '', motivoRecusa: d.rejectionReason || '' };
}
function p3AdaptPart(p) {
  p = p || {};
  // description entra no shape porque o PUT /parts/:id reescreve as QUATRO colunas de uma vez
  // (SET production_minutes, filament_grams, image_url, description). Sem ler a descrição atual não
  // dá pra reenviá-la, e salvar tempo/filamento apagaria a descrição da peça. Ver o save do P3Catalogo.
  // disponivel/pedidos: aditivos, usados pela Vitrine 3D (Encomendar). Catálogo/Dashboard/Demandas
  // ignoram — por isso o mesmo hook serve as quatro telas.
  return { product_id: p.id, code: p.code || '', nome: p.name || '', image: p.image || null,
    gramas: p3Num(p.filamentGrams), minutes: p3Num(p.productionMinutes), descricao: p.description || '',
    disponivel: p3Num(p.disponivel), pedidos: p3Num(p.pedidos) };
}

// Hook GET genérico → { items, loading, error, reload }.
function p3UseGet(path, adapt) {
  const R = window.React;
  const [items, setItems] = R.useState([]);
  const [loading, setLoading] = R.useState(true);
  const [error, setError] = R.useState(null);
  const mounted = R.useRef(true);
  const load = R.useCallback(function () {
    setError(null);
    window.FRApi.get(path, { skipLoading: true })
      .then(function (res) { if (!mounted.current) return; const rows = Array.isArray(res && res.data) ? res.data : []; setItems(rows.map(adapt).filter(Boolean)); setLoading(false); })
      .catch(function (e) { if (!mounted.current) return; setError(p3Err(e)); setLoading(false); });
  }, []);
  R.useEffect(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);
  return { items: items, loading: loading, error: error, reload: load };
}
function useFRProductions() { return p3UseGet('/producao-3d/productions', p3AdaptProduction); }
function useFRDemands() { return p3UseGet('/producao-3d/demands', p3AdaptDemand); }
function useFR3DParts() { return p3UseGet('/producao-3d/parts', p3AdaptPart); }
window.useFRProductions = useFRProductions;
window.useFRDemands = useFRDemands;
window.useFR3DParts = useFR3DParts;

// Toast (erro/sucesso) — mesmo visual das telas já ligadas.
function P3Toast({ t, toast, onClose }) {
  if (!toast) return null;
  return (
    <div style={{ position: 'fixed', zIndex: 90, bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderRadius: 13, background: toast.kind === 'err' ? uiTone(t, 'red').fg : t.text, color: '#fff', boxShadow: '0 18px 40px rgba(0,0,0,.3)', maxWidth: '92vw' }}>
      <Icon name={toast.kind === 'err' ? 'alert' : 'check'} size={18} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
      <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', opacity: 0.7, flexShrink: 0 }}><Icon name="x" size={16} /></button>
    </div>
  );
}

// ---------- Dashboard Operacional ----------
const P3_PERIODOS = [['7', '7 dias'], ['30', '30 dias'], ['90', '90 dias']];
const P3_WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const P3_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// P3_DADOS (KPIs + série do gráfico chumbados) REMOVIDO — p3Aggregate deriva tudo das produções REAIS.
// Agrega as produções do período em KPIs + barras. Puro: recebe a lista já adaptada e devolve números.
// Bucket por dia (7d), semana (30d) ou mês (90d) — mais barras que isso vira poeira ilegível.
function p3Aggregate(prods, days) {
  const now = Date.now(), from = now - days * 86400000;
  const rows = [];
  for (let i = 0; i < prods.length; i++) {
    const ts = prods[i].dateISO ? new Date(prods[i].dateISO).getTime() : NaN;
    if (!isNaN(ts) && ts >= from && ts <= now) rows.push({ ...prods[i], ts: ts });
  }
  const pecas = rows.reduce((a, r) => a + r.qtd, 0);
  const gramas = rows.reduce((a, r) => a + r.gramas, 0);
  const minutes = rows.reduce((a, r) => a + r.minutes, 0);
  // Média por DIA COM PRODUÇÃO (não por dia do calendário): dia parado não é média baixa, é dia parado.
  const diasAtivos = new Set(rows.map((r) => new Date(r.ts).toDateString())).size;

  const span = days === 7 ? 86400000 : days === 30 ? 7 * 86400000 : 30 * 86400000;
  // ceil, NÃO round: com round o período de 30d daria 4 baldes de 7 dias = 28 dias, e as produções de
  // 28~30 dias atrás entravam nos KPIs mas sumiam do gráfico (barras somando menos que o card).
  const nB = Math.ceil(days * 86400000 / span);
  const buckets = [];
  for (let i = nB - 1; i >= 0; i--) {                     // i = quantos spans atrás → empilha antigo→recente
    const start = now - (i + 1) * span;
    const label = days === 7 ? P3_WD[new Date(start + span / 2).getDay()]
      : days === 30 ? 'S' + (nB - i)
      : P3_MES[new Date(start + span / 2).getMonth()];
    buckets.push({ label: label, v: 0 });
  }
  // Clamp: a produção exatamente na borda do período (now - days) cairia em idx -1 e sumiria da barra
  // sem sumir do KPI. Toda linha que passou no filtro tem que aparecer no gráfico — soma das barras
  // SEMPRE bate com o card "Peças produzidas".
  rows.forEach((r) => {
    const idx = Math.min(nB - 1, Math.max(0, nB - 1 - Math.floor((now - r.ts) / span)));
    buckets[idx].v += r.qtd;
  });
  const max = Math.max.apply(null, buckets.map((b) => b.v).concat([0]));
  if (max > 0) buckets.forEach((b) => { if (b.v === max) b.accent = true; });

  return { pecas: pecas, gramas: gramas, minutes: minutes, diasAtivos: diasAtivos, registros: rows.length, chart: buckets };
}

// P3PrinterModal (CRUD de impressoras) REMOVIDO — era 100% decorativo: cadastrava/editava/excluía em
// state local, sem NENHUM endpoint por trás (não existe tabela nem rota de impressoras no backend).
// Um formulário que promete "Cadastrar" e perde tudo no F5 mente pro operador; o card de impressoras
// saiu junto e o espaço virou o painel de Demandas, que tem dado real. Onda 2: /producao-3d/printers.

// Campos do antigo P3HistModal SEM coluna em productions_3d (id, product_id, demand_id, quantity,
// total_minutes, filament_grams, date, operator_id) — não são coletados no P3ProdModal:
//   temperatura · tipo de filamento · "peça de teste" · observação · melhoria · impacto
// Coletá-los seria pedir digitação pro lixo: o POST ignora o que não conhece. Onda 2: colunas + PUT.
const p3GenKey = () => (crypto.randomUUID?.() ?? `p3-${Date.now()}-${Math.random().toString(16).slice(2)}`); // fallback p/ contexto não-seguro (http://IP-LAN)

// ---------- Nova produção (POST /producao-3d/productions) ----------
// Peça do catálogo REAL (useFR3DParts). Filamento/tempo TOTAIS vêm pré-calculados (por-unidade × qtd)
// e continuam editáveis: a impressão real gasta o que gasta, e ambos têm coluna própria no INSERT.
function P3ProdModal({ t, parts, onClose, onSubmit, enviando, erro }) {
  const [f, setF] = useStateP3({ partId: '', qtd: '1', gramas: '', minutes: '', gT: false, mT: false });
  const [q, setQ] = useStateP3('');
  const [open, setOpen] = useStateP3(false);
  const sel = parts.find((p) => p.product_id === f.partId) || null;
  // Re-deriva os totais a partir da peça × qtd, EXCETO o que o operador já editou à mão (gT/mT).
  const recalc = (s, part, qtd) => {
    const n = parseInt(qtd) || 0;
    return { ...s,
      gramas: s.gT ? s.gramas : String(part ? Math.round(part.gramas * n) : ''),
      minutes: s.mT ? s.minutes : String(part ? Math.round(part.minutes * n) : '') };
  };
  const pick = (p) => { setF((s) => recalc({ ...s, partId: p.product_id }, p, s.qtd)); setQ(p.nome); setOpen(false); };
  const setQtd = (v) => setF((s) => recalc({ ...s, qtd: v }, parts.find((p) => p.product_id === s.partId), v));
  const ql = q.trim().toLowerCase();
  const sugest = (ql && (!sel || sel.nome.toLowerCase() !== ql) ? parts.filter((p) => p.nome.toLowerCase().includes(ql) || p.code.toLowerCase().includes(ql)) : parts).slice(0, 6);
  const field = { boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 };
  const ok = !!f.partId && (parseInt(f.qtd) || 0) > 0;
  return (
    <div onClick={() => !enviando && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="plus" size={19} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Nova produção</div><div style={{ fontSize: 12.5, color: t.muted }}>Peça impressa por conta própria — dá entrada no estoque.</div></div>
          <button onClick={() => !enviando && onClose()} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <label style={lab}>Peça <span style={{ color: uiTone(t, 'red').fg }}>*</span></label>
            <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); setF((s) => ({ ...s, partId: '' })); }} onFocus={() => setOpen(true)} placeholder="Buscar peça do catálogo…" style={field} />
            {sel && <div style={{ fontSize: 11.5, color: t.muted, marginTop: 6 }}>{sel.code} · {sel.gramas}g e {p3Minutes(sel.minutes)} por unidade</div>}
            {open && sugest.length > 0 && (
              <React.Fragment>
                <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                <div className="fr-scroll" style={{ position: 'absolute', zIndex: 10, top: '100%', left: 0, right: 0, marginTop: 4, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6, maxHeight: 230, overflowY: 'auto' }}>
                  {sugest.map((p) => (
                    <button key={p.product_id} onClick={() => pick(p)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 9 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={15} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{p.nome}</div><div style={{ fontSize: 11, color: t.muted }}>{p.code} · {p.gramas}g · {p3Minutes(p.minutes)}</div></div>
                      <Icon name="plus" size={15} style={{ color: t.accentText }} />
                    </button>
                  ))}
                </div>
              </React.Fragment>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 120 }}><label style={lab}>Quantidade <span style={{ color: uiTone(t, 'red').fg }}>*</span></label><input value={f.qtd} onChange={(e) => setQtd(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="1" style={field} /></div>
            <div style={{ flex: 1 }}><label style={lab}>Filamento total (g)</label><input value={f.gramas} onChange={(e) => setF((s) => ({ ...s, gramas: e.target.value.replace(/[^0-9]/g, ''), gT: true }))} inputMode="numeric" placeholder="0" style={field} /></div>
            <div style={{ flex: 1 }}><label style={lab}>Tempo total (min)</label><input value={f.minutes} onChange={(e) => setF((s) => ({ ...s, minutes: e.target.value.replace(/[^0-9]/g, ''), mT: true }))} inputMode="numeric" placeholder="0" style={field} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
            <Icon name="zap" size={15} style={{ color: t.accentText, flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.45 }}>Registrar <strong style={{ color: t.text }}>credita {parseInt(f.qtd) || 0} un.</strong> no estoque físico da peça. O operador e a data são gravados automaticamente.</div>
          </div>
          {erro && <div style={{ padding: '11px 13px', borderRadius: 11, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, fontSize: 12.5, fontWeight: 700 }}>{erro}</div>}
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={() => !enviando && onClose()}>Cancelar</Btn>
          <button onClick={() => ok && !enviando && onSubmit({ partId: f.partId, quantity: parseInt(f.qtd) || 0, filamentGrams: parseInt(f.gramas) || 0, totalMinutes: parseInt(f.minutes) || 0 })}
            style={{ all: 'unset', cursor: ok && !enviando ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: ok && !enviando ? t.accent : t.elevated, color: ok && !enviando ? '#fff' : t.faint }}>
            <Icon name={enviando ? 'refresh' : 'check'} size={17} style={enviando ? { animation: 'fr-spin .7s linear infinite' } : undefined} /> {enviando ? 'Registrando…' : 'Registrar produção'}
          </button>
        </div>
      </div>
    </div>
  );
}

function P3Dashboard({ t }) {
  const { items: prods, loading, error, reload } = useFRProductions();
  const { items: demands, loading: demLoading, error: demError } = useFRDemands();
  const { items: parts } = useFR3DParts();
  const [periodo, setPeriodo] = useStateP3('7');
  const [novo, setNovo] = useStateP3(false);
  const [idemKey, setIdemKey] = useStateP3(null);     // âncora X-Idempotency-Key (gerada ao ABRIR o form)
  const [enviando, setEnviando] = useStateP3(false);  // anti duplo-clique no POST
  const [erro, setErro] = useStateP3(null);
  const [toast, setToast] = useStateP3(null);
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);

  const d = React.useMemo(() => p3Aggregate(prods, parseInt(periodo)), [prods, periodo]);
  const media = (d.pecas / (d.diasAtivos || 1)).toFixed(1).replace('.', ',');
  const filamentoKg = (d.gramas / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const demCount = (ks) => demands.filter((x) => ks.indexOf(x.status) >= 0).length;

  // Registra a produção. O header carrega a âncora de idempotência: com ela o backend faz o pré-check
  // no razão e um retry da MESMA chave devolve o registro original — 1 crédito, 1 linha no histórico.
  const submit = async (payload) => {
    if (enviando) return;
    setErro(null);
    if (!payload.partId) { setErro('Selecione a peça no catálogo.'); return; }
    if (!(payload.quantity > 0)) { setErro('Informe uma quantidade maior que zero.'); return; }
    setEnviando(true);
    try {
      await window.FRApi.post('/producao-3d/productions', { ...payload, date: new Date().toISOString() },
        { headers: { 'X-Idempotency-Key': idemKey } });
      setNovo(false); setIdemKey(null);              // só o SUCESSO fecha o form e queima a chave
      reload();
      setToast({ kind: 'ok', msg: 'Produção registrada — estoque creditado.' });
    } catch (e) {
      // NO ERRO: form aberto e MESMA idemKey (retry idempotente — não credita duas vezes).
      setErro(p3Err(e));
    } finally { setEnviando(false); }
  };

  const exportar = () => {
    const head = 'Periodo,' + periodo + ' dias\nPecas produzidas,' + d.pecas + '\nFilamento (kg),' + filamentoKg + '\nHoras de impressao,' + Math.round(d.minutes / 60) + '\nRegistros,' + d.registros + '\nDias com producao,' + d.diasAtivos + '\nMedia por dia ativo,' + media + '\n\nBucket,Pecas';
    const csv = head + '\n' + d.chart.map((b) => b.label + ',' + b.v).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'dashboard-3d-' + periodo + 'dias.csv'; a.click();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 850, letterSpacing: '-.02em', color: t.text }}>Dashboard Operacional</h1>
          <p style={{ margin: '7px 0 0', fontSize: 13.5, color: t.muted }}>Visão geral da fábrica de impressão 3D.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
            {P3_PERIODOS.map(([k, label]) => { const on = periodo === k; return (
              <button key={k} onClick={() => setPeriodo(k)} style={{ all: 'unset', cursor: 'pointer', height: 34, padding: '0 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? '#fff' : t.muted }}>{label}</button>
            ); })}
          </div>
          <Btn t={t} kind="ghost" icon="download" onClick={exportar}>Exportar</Btn>
          <Btn t={t} icon="plus" onClick={() => { setErro(null); setIdemKey(p3GenKey()); setNovo(true); }}>Nova produção</Btn>
        </div>
      </div>

      {error && (
        <Card t={t} style={{ padding: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Icon name="alert" size={17} style={{ color: uiTone(t, 'red').fg }} />
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{error}</span>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} icon="box" label="Peças produzidas" value={loading && !prods.length ? '—' : d.pecas.toLocaleString('pt-BR')} sub={`em ${periodo} dias`} kind="accent" />
        <KPI t={t} icon="zap" label="Filamento usado" value={loading && !prods.length ? '—' : `${filamentoKg} kg`} sub="material consumido" kind="green" />
        <KPI t={t} icon="clock" label="Horas de impressão" value={loading && !prods.length ? '—' : `${Math.round(d.minutes / 60)}h`} sub={`${d.registros} produções`} kind="amber" />
        <KPI t={t} icon="barChart2" label="Média de produção" value={loading && !prods.length ? '—' : media} sub="peças por dia com produção" kind="blue" />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <Card t={t} style={{ padding: 22, flex: 2, minWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Produção no período</div>
            <Badge t={t} kind="green" dot>{periodo} dias</Badge>
          </div>
          {loading && !prods.length
            ? <div style={{ height: 180, display: 'grid', placeItems: 'center', color: t.muted, fontSize: 13.5 }}>Carregando produções…</div>
            : d.pecas === 0
              ? <div style={{ height: 180, display: 'grid', placeItems: 'center', color: t.muted, fontSize: 13.5 }}>Nenhuma produção registrada neste período.</div>
              : <BarChart t={t} data={d.chart} />}
        </Card>
        {/* Painel de Demandas (real, GET /producao-3d/demands) no lugar do card de impressoras decorativo. */}
        <Card t={t} style={{ padding: 22, flex: 1, minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Demandas <span style={{ fontSize: 12, fontWeight: 600, color: t.muted }}>· {demands.length} no total</span></div>
          </div>
          {demLoading && !demands.length ? (
            <div style={{ padding: 18, textAlign: 'center', fontSize: 13, color: t.muted }}>Carregando demandas…</div>
          ) : demError ? (
            <div style={{ padding: 18, textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{demError}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Na fila', ['analise', 'aceita'], 'amber', 'clock'], ['Em produção', ['produzindo'], 'accent', 'printer'], ['Concluídas', ['concluida'], 'green', 'check'], ['Rejeitadas', ['rejeitada'], 'red', 'x']].map(([label, ks, kind, icon]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: uiTone(t, kind).bg, color: uiTone(t, kind).fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={icon} size={18} /></span>
                  <div style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: t.text }}>{label}</div>
                  <span style={{ fontSize: 20, fontWeight: 850, color: t.text }}>{demCount(ks)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      {novo && <P3ProdModal t={t} parts={parts} enviando={enviando} erro={erro} onClose={() => setNovo(false)} onSubmit={submit} />}
      <P3Toast t={t} toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ---------- Histórico de Produção ----------
// P3_HIST_SEED removido — Histórico renderiza 100% de useFRProductions (GET /producao-3d/productions).

// P3HistModal REMOVIDO — virou o P3ProdModal do Dashboard (POST real). O antigo so chamava
// onSave em state local, e desde a peca 1 nem renderizado era: registrava producao em lugar nenhum.

function P3Historico({ t }) {
  const { items: prods, loading, error, reload } = useFRProductions();
  const { items: parts } = useFR3DParts();
  const partsMap = React.useMemo(() => { const m = {}; parts.forEach((p) => { m[p.product_id] = p; }); return m; }, [parts]);
  const [filtro, setFiltro] = useStateP3('todas');
  const [busy, setBusy] = useStateP3(false);
  const [toast, setToast] = useStateP3(null);
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);
  const busyRef = React.useRef(false); busyRef.current = busy;

  // GET /productions não traz nome/sku da peça (só product_id) → resolve pelo mapa de /parts.
  const recs = prods.map((p) => ({ ...p, peca: (partsMap[p.product_id] && partsMap[p.product_id].nome) || (p.product_id ? 'Peça ' + String(p.product_id).slice(0, 8) : '—'), code: (partsMap[p.product_id] && partsMap[p.product_id].code) || '' }));
  const tabs = [['todas', 'Todas'], ['demanda', 'Por demanda'], ['propria', 'Conta própria']];
  const count = (k) => k === 'todas' ? recs.length : recs.filter((r) => r.origem === k).length;
  const view = recs.filter((r) => filtro === 'todas' || r.origem === filtro);

  // Excluir = REVERSÃO de estoque (reverseReceive), não remoção cosmética → confirma antes.
  const del = async (r) => {
    if (busyRef.current) return;
    if (!window.confirm('Excluir a produção de ' + r.qtd + '× ' + r.peca + '?\n\nIsto REVERTE a entrada: baixa ' + r.qtd + ' un. do estoque físico. Não pode ser desfeito.')) return;
    setBusy(true);
    try {
      await window.FRApi.delete('/producao-3d/productions/' + r.id);
      reload();
      setToast({ kind: 'ok', msg: 'Produção revertida — estoque ajustado.' });
    } catch (e) {
      if (e && e.status === 404) { reload(); setToast({ kind: 'ok', msg: 'Produção já não existia — lista atualizada.' }); }
      else { setToast({ kind: 'err', msg: p3Err(e) }); } // 400 SALDO_INSUFICIENTE_REVERSAO → msg do StockError; registro FICA
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 850, letterSpacing: '-.02em', color: t.text }}>Histórico de Produção</h1>
          <p style={{ margin: '7px 0 0', fontSize: 13.5, color: t.muted }}>Peças produzidas — por demanda ou por conta própria. Excluir reverte a entrada no estoque.</p>
        </div>
        <Btn t={t} kind="ghost" icon="refresh" onClick={() => reload()}>Atualizar</Btn>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="box" label="Peças produzidas" value={recs.reduce((a, r) => a + r.qtd, 0)} kind="accent" />
        <KPI t={t} mini icon="printer" label="Por demanda" value={recs.filter((r) => r.origem === 'demanda').length} kind="blue" />
        <KPI t={t} mini icon="zap" label="Conta própria" value={recs.filter((r) => r.origem === 'propria').length} kind="green" />
        <KPI t={t} mini icon="clock" label="Registros" value={recs.length} kind="amber" />
      </div>

      <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}`, marginBottom: 18 }}>
        {tabs.map(([k, label]) => { const on = filtro === k; return (
          <button key={k} onClick={() => setFiltro(k)} style={{ all: 'unset', cursor: 'pointer', height: 36, padding: '0 15px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? '#fff' : t.muted }}>{label} <span style={{ opacity: .6, fontWeight: 800 }}>({count(k)})</span></button>
        ); })}
      </div>

      {loading && recs.length === 0 ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando produções…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
        </Card>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {view.map((r) => (
          <Card t={t} key={r.id} hover style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={21} /></span>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 850, color: t.text }}>{r.peca}</span>
                  {r.origem === 'propria' ? <Badge t={t} kind="green">Conta própria</Badge> : <Badge t={t} kind="blue">Demanda</Badge>}
                </div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{r.code || '—'} · {r.operador} · {r.data}</div>
              </div>
              <div style={{ display: 'flex', gap: 18, textAlign: 'center' }}>
                <div><div style={{ fontSize: 9, fontWeight: 700, color: t.faint }}>QTD</div><div style={{ fontSize: 16, fontWeight: 850, color: t.text }}>{r.qtd}</div></div>
                <div><div style={{ fontSize: 9, fontWeight: 700, color: t.faint }}>FILAMENTO</div><div style={{ fontSize: 16, fontWeight: 850, color: t.text }}>{r.gramas}g</div></div>
                <div><div style={{ fontSize: 9, fontWeight: 700, color: t.faint }}>TEMPO</div><div style={{ fontSize: 16, fontWeight: 850, color: t.text }}>{r.tempo}</div></div>
              </div>
              <button onClick={() => del(r)} disabled={busy} title="Excluir (reverte a entrada no estoque)" style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 14px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}`, opacity: busy ? 0.5 : 1, flexShrink: 0 }}
                onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="trash" size={15} /> Excluir</button>
            </div>
          </Card>
        ))}
        {view.length === 0 && <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada por aqui" sub="Nenhuma produção neste filtro." /></Card>}
      </div>
      )}
      <P3Toast t={t} toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ---------- Quadro de Demandas ----------
function P3DemandaCard({ t, d, onAdvance, onReject, onCancel, onSaveNotes, busy }) {
  const st = P3_DEMSTATUS[d.status] || P3_DEMSTATUS.analise;
  // 'cancelada' entra aqui: é terminal como concluida/rejeitada -> sem Aceitar/Recusar/Cancelar.
  const isHist = d.status === 'concluida' || d.status === 'rejeitada' || d.status === 'cancelada';
  const [editNota, setEditNota] = useStateP3(false);
  const [rascunho, setRascunho] = useStateP3(d.notas || '');
  // Some do modo edição quando a demanda muda ou quando o reload traz nota nova de fora.
  React.useEffect(() => { setRascunho(d.notas || ''); setEditNota(false); }, [d.id, d.notas]);
  const img = d.img;
  return (
    <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ position: 'relative', height: 160, background: '#e9ebf0' }}>
        {img
          ? <img src={window.__asset ? window.__asset(img) : img} alt={d.peca} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#9aa3b2' }}><Icon name="box" size={42} /></div>}
        <span style={{ position: 'absolute', top: 12, right: 12 }}><Badge t={t} kind={st.kind} dot>{st.label}</Badge></span>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, fontWeight: 850, color: t.text }}>{d.peca}</span>
          <Badge t={t} kind="gray">{d.op}</Badge>
          <span style={{ marginLeft: 'auto', fontSize: 9.5, fontWeight: 700, color: t.faint, letterSpacing: '.04em', textAlign: 'right' }}>QTD<br /><span style={{ fontSize: 18, color: t.text }}>{d.qtd}</span></span>
        </div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{d.code || '—'}</div>

        {/* solicitante */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 13, paddingTop: 13, borderTop: `1px solid ${t.border}` }}>
          <span style={{ width: 32, height: 32, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11.5, flexShrink: 0 }}>{String(d.solicitante || '?').split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: t.text }}>{d.solicitante}</div><div style={{ fontSize: 11, color: t.muted }}>{d.priority ? 'Prioridade ' + d.priority + ' · ' : ''}{d.quando}</div></div>
        </div>

        {/* MOTIVO DA RECUSA — bloco próprio, lê rejection_reason (migration 010). Antes este rótulo
            era usado sobre `notes` e exibia o RESUMO DO PEDIDO mal rotulado como motivo. */}
        {d.status === 'rejeitada' && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 12, padding: '11px 13px', borderRadius: 11, background: uiTone(t, 'red').bg, border: `1px solid ${t.border}` }}>
            <Icon name="x" size={15} style={{ color: uiTone(t, 'red').fg, flexShrink: 0, marginTop: 1 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 2 }}>Motivo da recusa</div>
              <div style={{ fontSize: 12.5, color: uiTone(t, 'red').fg, lineHeight: 1.45, whiteSpace: 'pre-wrap', fontStyle: d.motivoRecusa ? 'normal' : 'italic' }}>
                {/* NULL = recusada antes da 010 (o motivo nunca foi capturado) — dizer isso é mais
                    honesto do que mostrar em branco ou reaproveitar a anotação. */}
                {d.motivoRecusa || 'Motivo não registrado.'}
              </div>
            </div>
          </div>
        )}

        {/* ANOTAÇÕES (`notes`) — nasce com o resumo do pedido e o operador complementa/edita. */}
        {(d.notas || editNota) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 12, padding: '11px 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
            <Icon name="file" size={15} style={{ color: t.muted, flexShrink: 0, marginTop: 1 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase' }}>Anotações</div>
                {!editNota && !busy && (
                  <button onClick={() => setEditNota(true)} title="Editar anotação" style={{ all: 'unset', cursor: 'pointer', marginLeft: 'auto', color: t.muted, display: 'grid', placeItems: 'center' }}><Icon name="pencil" size={13} /></button>
                )}
              </div>
              {editNota ? (
                <div>
                  <textarea value={rascunho} onChange={(e) => setRascunho(e.target.value)} rows={4} placeholder="Anotação da fábrica…"
                    style={{ boxSizing: 'border-box', width: '100%', borderRadius: 9, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '9px 11px', fontSize: 12.5, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    <button onClick={() => { setRascunho(d.notas || ''); setEditNota(false); }} style={{ all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: t.muted, padding: '6px 10px' }}>Cancelar</button>
                    <button onClick={() => onSaveNotes(d, rascunho)} disabled={busy} style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 800, color: '#fff', background: t.accent, padding: '6px 13px', borderRadius: 8, opacity: busy ? 0.6 : 1 }}>Salvar</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: t.muted, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{d.notas}</div>
              )}
            </div>
          </div>
        )}
        {/* Sem anotação nenhuma: oferece criar (o bloco acima só aparece quando há texto). */}
        {!d.notas && !editNota && !isHist && (
          <button onClick={() => setEditNota(true)} style={{ all: 'unset', cursor: 'pointer', marginTop: 12, fontSize: 11.5, fontWeight: 700, color: t.muted, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="file" size={13} /> Adicionar anotação</button>
        )}

        {!isHist && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => !busy && onReject(d)} disabled={busy} style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, fontSize: 13.5, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}`, opacity: busy ? 0.5 : 1 }}
              onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="x" size={16} /> Recusar</button>
            <button onClick={() => !busy && onAdvance(d)} disabled={busy} style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: t.accent, color: '#fff', boxShadow: `0 4px 12px ${frHexToRgba(t.accent, 0.3)}`, opacity: busy ? 0.6 : 1 }}><Icon name={st.actIcon || 'check'} size={16} /> {st.act}</button>
          </div>
        )}
        {/* Excluir demanda = SOFT-CANCEL no backend (status 'Cancelada'). Discreto de propósito:
            é ação de exceção, não o caminho normal (o normal é Recusar, que pede motivo). */}
        {!isHist && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button onClick={() => !busy && onCancel(d)} disabled={busy} style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', fontSize: 11.5, fontWeight: 700, color: t.faint, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: busy ? 0.5 : 1 }}
              onMouseEnter={(e) => { if (!busy) e.currentTarget.style.color = uiTone(t, 'red').fg; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.faint; }}><Icon name="trash" size={13} /> Excluir demanda</button>
          </div>
        )}
        {isHist && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: t.faint }}>Registro histórico</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function P3RejectModal({ t, demanda, onClose, onConfirm }) {
  const [motivo, setMotivo] = useStateP3('');
  const sugest = ['Sem filamento disponível', 'Peça fora de especificação', 'Impressora em manutenção', 'Quantidade inviável no prazo'];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 66, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(480px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="x" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Recusar demanda</div><div style={{ fontSize: 12.5, color: t.muted }}>{demanda.id} · {demanda.peca}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 8 }}>Motivo da recusa <span style={{ color: uiTone(t, 'red').fg }}>*</span></label>
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Explique por que a demanda está sendo recusada…" style={{ boxSizing: 'border-box', width: '100%', borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '11px 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
            {sugest.map((s) => <button key={s} onClick={() => setMotivo(s)} style={{ all: 'unset', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, padding: '6px 11px', borderRadius: 8, background: t.elevated, color: t.muted, border: `1px solid ${t.border}` }}>{s}</button>)}
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <button onClick={() => motivo.trim() && onConfirm(demanda.id, motivo.trim())} style={{ all: 'unset', cursor: motivo.trim() ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: motivo.trim() ? uiTone(t, 'red').fg : t.elevated, color: motivo.trim() ? '#fff' : t.faint }}><Icon name="x" size={17} /> Confirmar recusa</button>
        </div>
      </div>
    </div>
  );
}

function P3Demandas({ t }) {
  const { items: demands, loading, error, reload } = useFRDemands();
  const { items: parts } = useFR3DParts();
  const partsMap = React.useMemo(() => { const m = {}; parts.forEach((p) => { m[p.product_id] = p; }); return m; }, [parts]);
  const [tab, setTab] = useStateP3('fila');
  const [busy, setBusy] = useStateP3(false);
  const [toast, setToast] = useStateP3(null);
  const [rejectTarget, setRejectTarget] = useStateP3(null); // demanda aguardando motivo no P3RejectModal
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);
  const busyRef = React.useRef(false); busyRef.current = busy;

  const items = demands.map((d) => { const pt = partsMap[d.product_id]; return { ...d, peca: (pt && pt.nome) || (d.product_id ? 'Peça ' + String(d.product_id).slice(0, 8) : '—'), code: (pt && pt.code) || '', img: (pt && pt.image) || null }; });
  const groups = {
    fila: items.filter((x) => x.status === 'analise' || x.status === 'aceita'),
    produzindo: items.filter((x) => x.status === 'produzindo'),
    // 'cancelada' entra no Histórico. Sem isto ela não casaria com nenhum grupo e sumiria das três
    // abas — a demanda existiria no banco e seria invisível na tela.
    historico: items.filter((x) => x.status === 'concluida' || x.status === 'rejeitada' || x.status === 'cancelada'),
  };
  const tabs = [['fila', 'Fila'], ['produzindo', 'Produzindo'], ['historico', 'Histórico']];
  const view = groups[tab];

  // Avançar status. Concluir (produzindo→concluida = 'Concluída' no backend) dispara o CRÍTICO #2:
  // receive + reserve + request 'aprovado'. Envia o status do BACKEND (capitalizado), não o do front.
  const advance = async (d) => {
    if (busyRef.current) return;
    const nextFront = P3_DEMSTATUS[d.status] && P3_DEMSTATUS[d.status].next;
    if (!nextFront) return;
    const backStatus = P3_DEM_FRONT2BACK[nextFront];
    setBusy(true);
    try {
      await window.FRApi.put('/producao-3d/demands/' + d.id + '/status', { status: backStatus });
      reload();
      setToast({ kind: 'ok', msg: nextFront === 'concluida' ? 'Peça produzida — estoque creditado e reservado para a solicitação.' : 'Demanda movida para "' + P3_DEMSTATUS[nextFront].label + '".' });
    } catch (e) { setToast({ kind: 'err', msg: p3Err(e) }); } // 400 "Demanda já concluída/cancelada" (guard) → msg clara
    finally { setBusy(false); }
  };
  // Recusar = abre o P3RejectModal p/ coletar o MOTIVO (obrigatório no modal). O endpoint agora
  // aceita { status, reason } e grava em rejection_reason (coluna própria — migration 010), então o
  // texto não se perde mais. Antes isto era um window.confirm sem motivo.
  const reject = (d) => { if (!busyRef.current) setRejectTarget(d); };
  const confirmReject = async (id, motivo) => {
    if (busyRef.current) return;
    setBusy(true);
    try {
      await window.FRApi.put('/producao-3d/demands/' + id + '/status', { status: 'Rejeitada', reason: motivo });
      setRejectTarget(null);
      reload();
      setToast({ kind: 'ok', msg: 'Demanda recusada — motivo registrado.' });
    } catch (e) { setToast({ kind: 'err', msg: p3Err(e) }); }
    finally { setBusy(false); }
  };

  // Anotação livre (`notes`). Campo distinto do motivo da recusa: salvar aqui não mexe em
  // rejection_reason (garantido pelo backend, que só a toca na transição p/ 'Rejeitada').
  const saveNotes = async (d, texto) => {
    if (busyRef.current) return;
    setBusy(true);
    try {
      await window.FRApi.put('/producao-3d/demands/' + d.id + '/notes', { notes: texto });
      reload();
      setToast({ kind: 'ok', msg: 'Anotação salva.' });
    } catch (e) { setToast({ kind: 'err', msg: p3Err(e) }); }
    finally { setBusy(false); }
  };

  // "Excluir" = soft-cancel (status 'Cancelada'); a linha fica no histórico. O backend recusa
  // cancelar demanda Concluída (400) — a reversão de estoque é o DELETE da produção.
  const cancelDemand = async (d) => {
    if (busyRef.current) return;
    if (!window.confirm('Excluir a demanda de ' + d.qtd + '× ' + d.peca + '?\n\nEla sai da fila e fica registrada como cancelada no histórico.')) return;
    setBusy(true);
    try {
      await window.FRApi.delete('/producao-3d/demands/' + d.id);
      reload();
      setToast({ kind: 'ok', msg: 'Demanda cancelada.' });
    } catch (e) { setToast({ kind: 'err', msg: p3Err(e) }); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader t={t} title="Quadro de Demandas" subtitle="Pedidos de peças recebidos dos setores para impressão." />
      <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}`, marginBottom: 22 }}>
        {tabs.map(([k, label]) => { const on = tab === k; return (
          <button key={k} onClick={() => setTab(k)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? '#fff' : t.muted }}>
            {label} <span style={{ fontSize: 11, fontWeight: 800, opacity: on ? 1 : .6 }}>({groups[k].length})</span>
          </button>
        ); })}
      </div>
      {loading && items.length === 0 ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando demandas…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
        </Card>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada por aqui" sub="Nenhuma demanda neste status." /></Card></div>}
        {view.map((d) => <P3DemandaCard key={d.id} t={t} d={d} busy={busy} onAdvance={advance} onReject={reject} onCancel={cancelDemand} onSaveNotes={saveNotes} />)}
      </div>
      )}
      {/* P3RejectModal existia pronto no arquivo e NUNCA era renderizado (código morto). Agora é o
          caminho da recusa: coleta o motivo obrigatório e manda { status, reason }. */}
      {rejectTarget && <P3RejectModal t={t} demanda={rejectTarget} onClose={() => !busy && setRejectTarget(null)} onConfirm={confirmReject} />}
      <P3Toast t={t} toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// P3_CATS / P3_FILAMENTOS REMOVIDOS — "Etiqueta" e "Tipo de filamento" eram selects de valores
// inventados: o GET /parts não devolve categoria e chumba material:'Padrão', e o PUT /parts/:id só
// aceita { productionMinutes, filamentGrams, image, description }. Sem coluna, sem campo.

// ---------- Catálogo de Peças ----------
// LIGA-PARCIAL honesto: lista de GET /producao-3d/parts (products WHERE is_3d = true), edição TÉCNICA
// via PUT /producao-3d/parts/:id. Nome e SKU são exibidos como leitura — quem os altera é o
// PUT /products/:id (outro módulo, outra permissão: produtos:edit). Ver P3_CAT_GAPS no final.
function P3PartModal({ t, peca, onClose, onSave, salvando, erro }) {
  const [f, setF] = useStateP3({ gramas: String(peca.gramas ?? 0), minutes: String(peca.minutes ?? 0), descricao: peca.descricao || '', image: peca.image || '' });
  const [imgErro, setImgErro] = useStateP3(null);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  // Sem endpoint de upload: a imagem vira dataURL e é gravada em products.image_url como texto — que
  // é exatamente o que já existe em produção (50 das 51 peças 3D guardam base64 aí, a maior com 97KB).
  // Cap de 512KB: essa string volta em TODO GET /parts (hoje ~2,7MB só de imagem), e as quatro telas
  // do módulo chamam esse GET. Sem trava, um PNG de câmera (5MB → ~6,7MB em base64) numa peça só
  // dobraria o payload de todo mundo. 512KB dá 5× de folga sobre a maior imagem real de hoje.
  const onFile = (file) => {
    if (!file) return;
    setImgErro(null);
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result || '');
      if (url.length > 512 * 1024) { setImgErro('Imagem grande demais (máx. ~380KB). Reduza antes de enviar.'); return; }
      set('image', url);
    };
    r.readAsDataURL(file);
  };
  const field = { boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const ta = { ...field, height: 'auto', padding: '11px 13px', resize: 'vertical' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 };
  return (
    <div onClick={() => !salvando && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(540px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="pencil" size={19} /></span>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Editar peça</div><div style={{ fontSize: 12.5, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{peca.code} · {peca.nome}</div></div>
          <button onClick={() => !salvando && onClose()} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lab}>Imagem da peça</label>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 96, height: 96, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: `1px solid ${t.border}`, background: t.elevated, display: 'grid', placeItems: 'center', color: t.faint }}>
                {f.image ? <img src={window.__asset(f.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="box" size={28} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', height: 38, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: t.accentText, background: t.accentSoft }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files[0])} />
                  <Icon name="upload" size={15} /> {f.image ? 'Trocar imagem' : 'Enviar imagem'}
                </label>
                {f.image && <button onClick={() => set('image', '')} style={{ all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: uiTone(t, 'red').fg }}>Remover</button>}
              </div>
            </div>
            {imgErro && <div style={{ fontSize: 12, fontWeight: 700, color: uiTone(t, 'red').fg, marginTop: 8 }}>{imgErro}</div>}
          </div>
          {/* Nome e SKU: leitura. O PUT deste módulo não os aceita — editá-los é outro endpoint. */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}><label style={lab}>Nome da peça</label><div style={{ ...field, lineHeight: '44px', color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{peca.nome}</div></div>
            <div style={{ width: 140 }}><label style={lab}>SKU</label><div style={{ ...field, lineHeight: '44px', color: t.muted }}>{peca.code}</div></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={lab}>Filamento gasto (g/un)</label><input value={f.gramas} onChange={(e) => set('gramas', e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" style={field} /></div>
            <div style={{ flex: 1 }}><label style={lab}>Tempo de impressão (min/un)</label><input value={f.minutes} onChange={(e) => set('minutes', e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" style={field} /></div>
          </div>
          <div><label style={lab}>Descrição</label><textarea value={f.descricao} onChange={(e) => set('descricao', e.target.value)} rows={3} placeholder="Ex: peça do descedor, imprimir com suporte…" style={ta} /></div>
          {erro && <div style={{ padding: '11px 13px', borderRadius: 11, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, fontSize: 12.5, fontWeight: 700 }}>{erro}</div>}
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={() => !salvando && onClose()}>Cancelar</Btn>
          <button onClick={() => !salvando && onSave({ productionMinutes: parseInt(f.minutes) || 0, filamentGrams: parseInt(f.gramas) || 0, image: f.image || null, description: f.descricao.trim() || null })}
            style={{ all: 'unset', cursor: salvando ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: salvando ? t.elevated : t.accent, color: salvando ? t.faint : '#fff' }}>
            <Icon name={salvando ? 'refresh' : 'check'} size={17} style={salvando ? { animation: 'fr-spin .7s linear infinite' } : undefined} /> {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function P3Catalogo({ t }) {
  const { items: pecas, loading, error, reload } = useFR3DParts();
  const [q, setQ] = useStateP3('');
  const [edit, setEdit] = useStateP3(null);
  const [salvando, setSalvando] = useStateP3(false);
  const [erro, setErro] = useStateP3(null);
  const [toast, setToast] = useStateP3(null);
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);
  const ql = q.trim().toLowerCase();
  const view = pecas.filter((p) => !ql || p.nome.toLowerCase().includes(ql) || p.code.toLowerCase().includes(ql));

  // PUT reescreve as 4 colunas SEMPRE (o UPDATE não é parcial) → o modal manda as 4, inclusive as que
  // o operador não tocou. Mandar só o campo alterado apagaria os outros três com NULL.
  const save = async (payload) => {
    if (salvando) return;
    setErro(null);
    setSalvando(true);
    try {
      await window.FRApi.put('/producao-3d/parts/' + edit.product_id, payload);
      setEdit(null);
      reload();
      setToast({ kind: 'ok', msg: 'Peça atualizada.' });
    } catch (e) { setErro(p3Err(e)); }   // no erro: modal aberto com o que foi digitado
    finally { setSalvando(false); }
  };

  // Excluir peça = DELETE /products/:id, que ARQUIVA (active = false), não apaga. Só passou a ser
  // honesto depois do `AND active = true` no get3DParts: antes a peça "excluída" voltava no refetch.
  // Arquivar preserva o histórico (produções e movimentações antigas seguem apontando pro produto).
  const remove = async (p) => {
    if (salvando) return;
    if (!window.confirm('Excluir a peça "' + p.nome + '" do catálogo 3D?\n\nEla é arquivada (não apagada): sai do catálogo, mas o histórico de produções e o estoque continuam intactos.')) return;
    setSalvando(true);
    try {
      await window.FRApi.delete('/products/' + p.product_id);
      reload();
      setToast({ kind: 'ok', msg: 'Peça arquivada — saiu do catálogo.' });
    } catch (e) { setToast({ kind: 'err', msg: p3Err(e) }); }   // 403 se faltar produtos:delete
    finally { setSalvando(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 850, letterSpacing: '-.02em', color: t.text, display: 'flex', alignItems: 'center', gap: 11 }}><Icon name="box" size={25} style={{ color: t.accentText }} /> Catálogo de Peças</h1>
          <p style={{ margin: '7px 0 0', fontSize: 13.5, color: t.muted }}>Peças cadastradas para impressão 3D, com filamento e tempo.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, width: 260, maxWidth: '100%', height: 46, padding: '0 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
            <Icon name="search" size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar peça…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
          </label>
          {/* Btn "Nova peça" REMOVIDO — não há POST /producao-3d/parts. Ver P3_CAT_GAPS. */}
          <Btn t={t} kind="ghost" icon="refresh" onClick={() => reload()}>Atualizar</Btn>
        </div>
      </div>
      {loading && pecas.length === 0 ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando catálogo…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
        </Card>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {view.map((p) => (
          <Card t={t} key={p.product_id} hover style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              {p.image
                ? <img src={window.__asset(p.image)} alt={p.nome} style={{ display: 'block', width: '100%', height: 220, objectFit: 'cover', background: '#e9ebf0' }} />
                : <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: 220, background: '#e9ebf0', color: '#9aa3b2' }}><Icon name="box" size={42} /></div>}
              {/* Badges "Etiqueta" e "N em estoque" REMOVIDOS: nenhum dos dois existe no GET /parts. */}
              <button onClick={() => { setErro(null); setEdit(p); }} title="Editar peça" style={{ all: 'unset', cursor: 'pointer', position: 'absolute', bottom: 10, right: 10, width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'rgba(8,10,16,.7)', color: '#fff', backdropFilter: 'blur(4px)' }}><Icon name="pencil" size={16} /></button>
              <button onClick={() => remove(p)} disabled={salvando} title="Excluir peça (arquiva)" style={{ all: 'unset', cursor: salvando ? 'not-allowed' : 'pointer', position: 'absolute', bottom: 10, right: 52, width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'rgba(8,10,16,.7)', color: '#fff', backdropFilter: 'blur(4px)', opacity: salvando ? 0.5 : 1 }}
                onMouseEnter={(e) => { if (!salvando) e.currentTarget.style.background = uiTone(t, 'red').fg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(8,10,16,.7)'; }}><Icon name="trash" size={16} /></button>
            </div>
            <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.muted }}>{p.code}</div>
              <div style={{ fontSize: 17, fontWeight: 850, color: t.text, margin: '7px 0 14px', lineHeight: 1.25 }}>{p.nome}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <div style={{ flex: 1, padding: '9px 11px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}><Icon name="zap" size={11} /> FILAMENTO</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginTop: 3 }}>{p.gramas}g</div>
                  <div style={{ fontSize: 10.5, color: t.muted }}>por unidade</div>
                </div>
                <div style={{ flex: 1, padding: '9px 11px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}><Icon name="clock" size={11} /> TEMPO</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginTop: 3 }}>{p3Minutes(p.minutes)}</div>
                  <div style={{ fontSize: 10.5, color: t.muted }}>por unidade</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhuma peça" sub={ql ? 'Nenhuma peça bate com a busca.' : 'Nenhum produto marcado como 3D no catálogo.'} /></Card></div>}
      </div>
      )}
      {edit && <P3PartModal t={t} peca={edit} salvando={salvando} erro={erro} onClose={() => setEdit(null)} onSave={save} />}
      <P3Toast t={t} toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// P3_CAT_GAPS — o que o Catálogo NÃO liga, e por quê (entrada da Onda 2):
//  1. CRIAR peça: não existe POST /producao-3d/parts. O POST /products aceita is_3d/production_minutes/
//     filament_grams/image_url e criaria uma peça 3D válida, MAS é outro módulo (permissão produtos:add,
//     não separacoes:edit) e exige sku no formato C.SS.NNNN + unit/min_stock/preços. Cadastrar peça pelo
//     módulo 3D é decisão de produto, não de fiação — fica fora até alguém decidir.
//  2. EXCLUIR peça: ✅ FECHADO. O get3DParts passou a filtrar `AND active = true`, então o
//     DELETE /products/:id (que ARQUIVA, active=false) virou honesto: excluiu, sai do catálogo e não
//     volta no refetch. O botão está no card. Arquivar preserva o histórico de produções/estoque.
//     NOTA de RBAC: o catálogo 3D roda em separacoes:edit, mas o DELETE /products/:id exige
//     produtos:delete (outro módulo). Hoje isso não bloqueia ninguém — admin faz bypass total
//     (auth.ts) e almoxarife, o único outro papel com separacoes:edit, também tem produtos:delete.
//     Se algum papel novo ganhar 3D sem produtos:delete, o botão passa a dar 403 (tratado em toast).
//  3. NOME/SKU: PUT /producao-3d/parts/:id não os aceita (só os 4 campos técnicos) → leitura no modal.
//  4. ESTOQUE por peça: GET /parts não devolve saldo (quem tem é o GET /products, com stock{}) → o badge
//     "N em estoque" saiu. Onda 2: ou o get3DParts faz LEFT JOIN stock, ou o catálogo cruza /products.
//  5. UPLOAD de imagem: não há endpoint; a imagem vai como dataURL base64 dentro de products.image_url
//     (cap de 512KB no modal) — mesmo formato dos dados que já estão lá. Onda 2: upload real + URL.
//  6. PESO do GET /parts: ~2,7MB, quase tudo base64 de imagem, e SEM cache compartilhado — Dashboard,
//     Histórico, Demandas e Catálogo baixam os 2,7MB cada um, por montagem de tela. Onda 2: ou o
//     get3DParts para de devolver image no list (só no detalhe), ou o useFR3DParts vira cache único.

function renderPage3D(active, props) {
  const t = frTokens(props.theme, P3_ACCENT, P3_ACCENT_T);
  const p = { ...props, t };
  if (active === 'p3d-producao') return <P3Historico {...p} />;
  if (active === 'p3d-demandas') return <P3Demandas {...p} />;
  if (active === 'p3d-catalogo') return <P3Catalogo {...p} />;
  return <P3Dashboard {...p} />;
}

window.renderPage3D = renderPage3D;
