// producao3d.jsx — "Fábrica 3D" module pages: Dashboard, Histórico, Demandas, Catálogo.
const { useState: useStateP3 } = React;
const P3_ACCENT = '#6366f1', P3_ACCENT_T = '#818cf8';

const P3_PECAS = [
  { code: '5.03.0002', nome: 'COPINHO 3D', cat: 'Componentes', fil: 'PLA Azul', gramas: 18, tempo: '1h 05min', stock: 1, img: 'assets/peca-copinho-3d.png' },
  { code: '5.03.0012', nome: 'CARAMBOLA 3D', cat: 'Componentes', fil: 'PETG Preto', gramas: 42, tempo: '2h 20min', stock: 39, img: 'assets/peca-carambola-3d.png' },
  { code: '5.03.0014', nome: 'ALOCADOR DE OVOS', cat: 'Embalagem', fil: 'ABS Cinza', gramas: 120, tempo: '6h 06min', stock: 0 },
  { code: '5.03.0029', nome: 'CAÍDA OVO EMBALADORA', cat: 'Embalagem', fil: 'PLA Branco', gramas: 88, tempo: '4h 12min', stock: 6, img: 'assets/peca-caida-ovo.png' },
  { code: '5.03.0050', nome: 'SUPORTE DE SENSOR', cat: 'Componentes', fil: 'PLA Azul', gramas: 22, tempo: '1h 30min', stock: 22 },
  { code: '5.03.0031', nome: 'SEPARADOR DE BANDEJA', cat: 'Embalagem', fil: 'PETG Preto', gramas: 64, tempo: '3h 05min', stock: 12 },
  { code: '5.03.0044', nome: 'GUIA DA ESTEIRA', cat: 'Componentes', fil: 'TPU Flex', gramas: 34, tempo: '0h 45min', stock: 8 },
  { code: '5.03.0061', nome: 'TAMPA DO DESCEDOR', cat: 'Embalagem', fil: 'PLA Branco', gramas: 52, tempo: '1h 12min', stock: 0 },
];
const P3_HIST = [
  { id: 'PR-3308', peca: 'CARAMBOLA 3D', code: '5.03.0012', qtd: 12, gramas: 504, tempo: '5h 40min', data: '17/06 · 14:20', op: 'OP-2041', operador: 'Rafael S.' },
  { id: 'PR-3305', peca: 'SUPORTE DE SENSOR', code: '5.03.0050', qtd: 8, gramas: 176, tempo: '4h 00min', data: '17/06 · 09:10', op: 'OP-2038', operador: 'Davi M.' },
  { id: 'PR-3301', peca: 'COPINHO 3D', code: '5.03.0002', qtd: 24, gramas: 432, tempo: '6h 25min', data: '16/06 · 16:45', op: 'OP-2060', operador: 'Rafael S.' },
  { id: 'PR-3298', peca: 'SEPARADOR DE BANDEJA', code: '5.03.0031', qtd: 6, gramas: 384, tempo: '3h 30min', data: '16/06 · 11:02', op: 'OP-2041', operador: 'Davi M.' },
  { id: 'PR-3294', peca: 'TAMPA DO DESCEDOR', code: '5.03.0061', qtd: 10, gramas: 520, tempo: '5h 10min', data: '15/06 · 15:30', op: 'OP-2060', operador: 'Rafael S.' },
];
// P3_DEMANDAS_SEED removido — Demandas renderiza 100% de useFRDemands (GET /producao-3d/demands).
const P3_DEMSTATUS = {
  analise:    { label: 'Em análise', kind: 'amber', next: 'aceita', act: 'Aceitar pedido', actIcon: 'check' },
  aceita:     { label: 'Aceita', kind: 'blue', next: 'produzindo', act: 'Iniciar produção', actIcon: 'printer' },
  produzindo: { label: 'Em produção', kind: 'accent', next: 'concluida', act: 'Finalizar peça', actIcon: 'check' },
  concluida:  { label: 'Concluída', kind: 'green' },
  rejeitada:  { label: 'Rejeitada', kind: 'red' },
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
const P3_DEM_BACK2FRONT = { 'Em análise': 'analise', 'Aceita': 'aceita', 'Em desenvolvimento': 'produzindo', 'Concluída': 'concluida', 'Rejeitada': 'rejeitada' };
const P3_DEM_FRONT2BACK = { analise: 'Em análise', aceita: 'Aceita', produzindo: 'Em desenvolvimento', concluida: 'Concluída', rejeitada: 'Rejeitada' };

// Adapters backend → shape das telas.
function p3AdaptProduction(p) {
  p = p || {};
  return { id: p.id, product_id: p.partId || null, demandId: p.demandId || null,
    qtd: p3Num(p.quantity), gramas: p3Num(p.filamentGrams), tempo: p3Minutes(p.totalMinutes),
    data: p3DateTime(p.date), operador: p.operator || '—', origem: p.demandId ? 'demanda' : 'propria' };
}
function p3AdaptDemand(d) {
  d = d || {};
  return { id: d.id, product_id: d.partId || null, requestId: d.requestId || null,
    qtd: p3Num(d.quantity), op: d.opNumber || '—', priority: d.priority || '',
    solicitante: d.requester || 'Sistema', quando: p3RelTime(d.createdAt),
    status: P3_DEM_BACK2FRONT[d.status] || 'analise', statusBack: d.status, notas: d.notes || '' };
}
function p3AdaptPart(p) {
  p = p || {};
  return { product_id: p.id, code: p.code || '', nome: p.name || '', image: p.image || null,
    gramas: p3Num(p.filamentGrams), minutes: p3Num(p.productionMinutes) };
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
const P3_DADOS = {
  '7':  { pecas: 284, filamento: 6.4, horas: 142, dias: 6, chart: [{ label: 'Seg', v: 320 }, { label: 'Ter', v: 480, accent: true }, { label: 'Qua', v: 410 }, { label: 'Qui', v: 560, accent: true }, { label: 'Sex', v: 504 }, { label: 'Sáb', v: 280 }] },
  '30': { pecas: 1180, filamento: 27.2, horas: 596, dias: 26, chart: [{ label: 'S1', v: 1800 }, { label: 'S2', v: 2400, accent: true }, { label: 'S3', v: 2100 }, { label: 'S4', v: 2900, accent: true }] },
  '90': { pecas: 3420, filamento: 79.5, horas: 1740, dias: 78, chart: [{ label: 'Abr', v: 6800 }, { label: 'Mai', v: 8200, accent: true }, { label: 'Jun', v: 9100, accent: true }] },
};

function P3PrinterModal({ t, printer, onClose, onSave, onDelete }) {
  const novo = !printer.id;
  const [f, setF] = useStateP3({ nome: printer.nome || '', modelo: printer.modelo || '', bico: printer.bico || '0,4mm', status: printer.status || 'ociosa', job: printer.job || '', prog: String(printer.prog ?? 0) });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const field = { boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 };
  const sela = { ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(500px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="printer" size={19} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{novo ? 'Cadastrar impressora' : 'Editar impressora'}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={lab}>Nome</label><input value={f.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: Prusa MK4 #1" style={field} /></div>
            <div style={{ width: 110 }}><label style={lab}>Bico</label><input value={f.bico} onChange={(e) => set('bico', e.target.value)} placeholder="0,4mm" style={field} /></div>
          </div>
          <div><label style={lab}>Modelo</label><input value={f.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="Ex: Original Prusa MK4" style={field} /></div>
          <div>
            <label style={lab}>Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['imprimindo', 'Imprimindo', 'green'], ['ociosa', 'Ociosa', 'gray'], ['manutencao', 'Manutenção', 'amber']].map(([id, label, k]) => { const on = f.status === id; return (
                <button key={id} onClick={() => set('status', id)} style={{ all: 'unset', cursor: 'pointer', flex: 1, textAlign: 'center', height: 40, lineHeight: '40px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: on ? uiTone(t, k).fg : t.elevated, color: on ? '#fff' : t.muted, border: `1px solid ${on ? 'transparent' : t.border}` }}>{label}</button>
              ); })}
            </div>
          </div>
          {f.status === 'imprimindo' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><label style={lab}>Imprimindo agora</label><input value={f.job} onChange={(e) => set('job', e.target.value)} placeholder="Ex: CARAMBOLA 3D" style={field} /></div>
              <div style={{ width: 110 }}><label style={lab}>Progresso %</label><input value={f.prog} onChange={(e) => set('prog', e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" style={field} /></div>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          {!novo ? <button onClick={() => onDelete(printer.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 42, padding: '0 14px', borderRadius: 11, fontSize: 13, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}><Icon name="trash" size={15} /> Excluir</button> : <span />}
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
            <Btn t={t} icon="check" onClick={() => f.nome.trim() && onSave({ id: printer.id || 'pr' + Date.now(), nome: f.nome.trim(), modelo: f.modelo.trim(), bico: f.bico, status: f.status, job: f.status === 'imprimindo' ? (f.job.trim() || 'Peça') : '', prog: parseInt(f.prog) || 0 })}>{novo ? 'Cadastrar' : 'Salvar'}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function P3Dashboard({ t }) {
  const [periodo, setPeriodo] = useStateP3('7');
  const [printers, setPrinters] = useStateP3([
    { id: 'p1', nome: 'Prusa MK4 #1', modelo: 'Original Prusa MK4', bico: '0,4mm', status: 'imprimindo', job: 'CARAMBOLA 3D', prog: 68 },
    { id: 'p2', nome: 'Prusa MK4 #2', modelo: 'Original Prusa MK4', bico: '0,4mm', status: 'imprimindo', job: 'SUPORTE DE SENSOR', prog: 31 },
    { id: 'p3', nome: 'Bambu X1 #3', modelo: 'Bambu Lab X1-Carbon', bico: '0,4mm', status: 'ociosa', job: '', prog: 0 },
  ]);
  const [edit, setEdit] = useStateP3(null);
  const d = P3_DADOS[periodo];
  const media = (d.pecas / d.dias).toFixed(1).replace('.', ',');
  const statusMap = { imprimindo: ['Imprimindo', 'green'], ociosa: ['Ociosa', 'gray'], manutencao: ['Manutenção', 'amber'] };
  const ativas = printers.filter((p) => p.status === 'imprimindo').length;
  const savePrinter = (p) => { setPrinters((xs) => (xs.some((x) => x.id === p.id) ? xs.map((x) => (x.id === p.id ? p : x)) : [...xs, p])); setEdit(null); };
  const delPrinter = (id) => { setPrinters((xs) => xs.filter((x) => x.id !== id)); setEdit(null); };
  const exportar = () => {
    const head = 'Periodo,' + periodo + ' dias\\nPecas produzidas,' + d.pecas + '\\nFilamento (kg),' + d.filamento + '\\nHoras de impressao,' + d.horas + '\\nMedia diaria,' + media + '\\n\\nImpressora,Modelo,Status,Imprimindo,Progresso';
    const rows = printers.map((p) => [p.nome, p.modelo, statusMap[p.status][0], p.job || '-', p.prog + '%'].join(','));
    const csv = head + '\\n' + rows.join('\\n');
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
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} icon="box" label="Peças produzidas" value={d.pecas.toLocaleString('pt-BR')} sub={`em ${periodo} dias`} kind="accent" />
        <KPI t={t} icon="zap" label="Filamento usado" value={`${d.filamento.toLocaleString('pt-BR')} kg`} sub="material consumido" kind="green" />
        <KPI t={t} icon="clock" label="Horas de impressão" value={`${d.horas}h`} sub={`${printers.length} impressoras`} kind="amber" />
        <KPI t={t} icon="barChart2" label="Média de produção" value={`${media}`} sub="peças por dia" kind="blue" />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <Card t={t} style={{ padding: 22, flex: 2, minWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Produção no período</div>
            <Badge t={t} kind="green" dot>{periodo} dias</Badge>
          </div>
          <BarChart t={t} data={d.chart} />
        </Card>
        <Card t={t} style={{ padding: 22, flex: 1, minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Impressoras <span style={{ fontSize: 12, fontWeight: 600, color: t.muted }}>· {ativas}/{printers.length} ativas</span></div>
            <button onClick={() => setEdit({})} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: t.accentText, padding: '6px 10px', borderRadius: 9, background: t.accentSoft }}><Icon name="plus" size={14} /> Cadastrar</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {printers.length === 0 && <div style={{ padding: 18, textAlign: 'center', fontSize: 13, color: t.muted, border: `1px dashed ${t.borderStrong}`, borderRadius: 12 }}>Nenhuma impressora cadastrada.</div>}
            {printers.map((p) => { const sm = statusMap[p.status]; const printing = p.status === 'imprimindo'; return (
              <div key={p.id} style={{ padding: '13px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: uiTone(t, sm[1]).bg, color: uiTone(t, sm[1]).fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="printer" size={18} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{p.nome}</div><div style={{ fontSize: 11, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{printing ? p.job : p.modelo}</div></div>
                  <Badge t={t} kind={sm[1]} dot>{sm[0]}</Badge>
                  <button onClick={() => setEdit(p)} title="Editar" style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="pencil" size={14} /></button>
                </div>
                {printing && (
                  <div style={{ marginTop: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700, marginBottom: 5 }}><span style={{ color: t.muted }}>Progresso</span><span style={{ color: t.accentText }}>{p.prog}%</span></div>
                    <div style={{ height: 6, borderRadius: 5, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${p.prog}%`, borderRadius: 5, background: uiTone(t, 'green').fg }} /></div>
                  </div>
                )}
              </div>
            ); })}
          </div>
        </Card>
      </div>
      {edit && <P3PrinterModal t={t} printer={edit} onClose={() => setEdit(null)} onSave={savePrinter} onDelete={delPrinter} />}
    </div>
  );
}

// ---------- Histórico de Produção ----------
// P3_HIST_SEED removido — Histórico renderiza 100% de useFRProductions (GET /producao-3d/productions).

function P3HistModal({ t, rec, onClose, onSave }) {
  const novo = !rec.id;
  const [f, setF] = useStateP3({ peca: rec.peca || '', code: rec.code || '', qtd: String(rec.qtd ?? ''), fil: rec.fil || 'PLA Azul', temp: rec.temp || '', teste: rec.teste || false, obs: rec.obs || '', melhoria: rec.melhoria || '', impacto: rec.impacto || '' });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const [pecaOpen, setPecaOpen] = useStateP3(false);
  const sugest = f.peca.trim() ? P3_PECAS.filter((p) => p.nome.toLowerCase().includes(f.peca.toLowerCase()) || p.code.includes(f.peca)).slice(0, 6) : P3_PECAS.slice(0, 6);
  const pickPeca = (p) => { setF((s) => ({ ...s, peca: p.nome, code: p.code, fil: p.fil || s.fil })); setPecaOpen(false); };
  const field = { boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const ta = { ...field, height: 'auto', padding: '11px 13px', resize: 'vertical' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 };
  const sela = { ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(580px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={novo ? 'plus' : 'pencil'} size={19} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{novo ? 'Registrar produção própria' : 'Anotações da produção'}</div><div style={{ fontSize: 12.5, color: t.muted }}>{novo ? 'Peça feita por conta própria (sem demanda).' : rec.id + ' · ' + rec.peca}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {novo && (
            <React.Fragment>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <label style={lab}>Peça</label>
                  <input value={f.peca} onChange={(e) => { set('peca', e.target.value); setPecaOpen(true); }} onFocus={() => setPecaOpen(true)} placeholder="Buscar peça do catálogo…" style={field} />
                  {pecaOpen && sugest.length > 0 && (
                    <React.Fragment>
                      <div onClick={() => setPecaOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                      <div className="fr-scroll" style={{ position: 'absolute', zIndex: 10, top: '100%', left: 0, right: 0, marginTop: 4, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6, maxHeight: 230, overflowY: 'auto' }}>
                        {sugest.map((p) => (
                          <button key={p.code} onClick={() => pickPeca(p)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 9 }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                            <span style={{ width: 30, height: 30, borderRadius: 8, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={15} /></span>
                            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{p.nome}</div><div style={{ fontSize: 11, color: t.muted }}>{p.code} · {p.fil} · {p.tempo}</div></div>
                            <Icon name="plus" size={15} style={{ color: t.accentText }} />
                          </button>
                        ))}
                      </div>
                    </React.Fragment>
                  )}
                </div>
                <div style={{ width: 130 }}><label style={lab}>SKU</label><input value={f.code} onChange={(e) => set('code', e.target.value)} placeholder="5.03.0000" style={field} /></div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 110 }}><label style={lab}>Quantidade</label><input value={f.qtd} onChange={(e) => set('qtd', e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="1" style={field} /></div>
                <div style={{ flex: 1 }}><label style={lab}>Temperatura</label><input value={f.temp} onChange={(e) => set('temp', e.target.value)} placeholder="Ex: 210°C" style={field} /></div>
                <div style={{ flex: 1 }}>
                  <label style={lab}>Filamento</label>
                  <div style={{ position: 'relative' }}><select value={f.fil} onChange={(e) => set('fil', e.target.value)} style={sela}>{P3_FILAMENTOS.map((c) => <option key={c}>{c}</option>)}</select><Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 15, color: t.muted, pointerEvents: 'none' }} /></div>
                </div>
              </div>
            </React.Fragment>
          )}
          <button onClick={() => set('teste', !f.teste)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 12, background: f.teste ? uiTone(t, 'amber').bg : t.elevated, border: `1px solid ${f.teste ? frHexToRgba('#f59e0b', 0.4) : t.border}` }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, display: 'grid', placeItems: 'center', flexShrink: 0, background: f.teste ? uiTone(t, 'amber').fg : 'transparent', color: '#fff', border: `1.5px solid ${f.teste ? 'transparent' : t.borderStrong}` }}>{f.teste && <Icon name="check" size={13} />}</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>Peça de teste</div><div style={{ fontSize: 11.5, color: t.muted }}>Marque se foi uma impressão de teste/validação.</div></div>
            <Icon name="zap" size={18} style={{ color: f.teste ? uiTone(t, 'amber').fg : t.faint }} />
          </button>
          <div><label style={lab}>Observação da peça</label><textarea value={f.obs} onChange={(e) => set('obs', e.target.value)} rows={2} placeholder="Ex: feita com filamento diferente, exigiu cama a 60°C…" style={ta} /></div>
          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', color: t.accentText, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="zap" size={14} /> Anotações de melhoria</div>
            <div style={{ marginBottom: 14 }}><label style={lab}>O que foi melhorado</label><textarea value={f.melhoria} onChange={(e) => set('melhoria', e.target.value)} rows={2} placeholder="Ex: aumentei o fluxo para 105%, reduzi velocidade…" style={ta} /></div>
            <div><label style={lab}>Impacto da melhoria</label><textarea value={f.impacto} onChange={(e) => set('impacto', e.target.value)} rows={2} placeholder="Ex: refugo caiu de 3 para 0 peças, acabamento melhor…" style={ta} /></div>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn t={t} icon="check" onClick={() => { if (novo && !f.peca.trim()) return; onSave({ ...rec, peca: f.peca.trim() || rec.peca, code: f.code.trim() || rec.code, qtd: parseInt(f.qtd) || rec.qtd || 1, fil: f.fil, temp: f.temp.trim(), teste: f.teste, obs: f.obs.trim(), melhoria: f.melhoria.trim(), impacto: f.impacto.trim() }, novo); }}>{novo ? 'Registrar' : 'Salvar'}</Btn>
        </div>
      </div>
    </div>
  );
}

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
function P3DemandaCard({ t, d, onAdvance, onReject, busy }) {
  const st = P3_DEMSTATUS[d.status] || P3_DEMSTATUS.analise;
  const isHist = d.status === 'concluida' || d.status === 'rejeitada';
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

        {/* observações */}
        {d.notas && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 12, padding: '11px 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
            <Icon name="file" size={15} style={{ color: t.muted, flexShrink: 0, marginTop: 1 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 2 }}>{d.status === 'rejeitada' ? 'Motivo da recusa' : 'Observações'}</div>
              <div style={{ fontSize: 12.5, color: d.status === 'rejeitada' ? uiTone(t, 'red').fg : t.muted, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{d.notas}</div>
            </div>
          </div>
        )}

        {!isHist && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => !busy && onReject(d)} disabled={busy} style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, fontSize: 13.5, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}`, opacity: busy ? 0.5 : 1 }}
              onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="x" size={16} /> Recusar</button>
            <button onClick={() => !busy && onAdvance(d)} disabled={busy} style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: t.accent, color: '#fff', boxShadow: `0 4px 12px ${frHexToRgba(t.accent, 0.3)}`, opacity: busy ? 0.6 : 1 }}><Icon name={st.actIcon || 'check'} size={16} /> {st.act}</button>
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
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);
  const busyRef = React.useRef(false); busyRef.current = busy;

  const items = demands.map((d) => { const pt = partsMap[d.product_id]; return { ...d, peca: (pt && pt.nome) || (d.product_id ? 'Peça ' + String(d.product_id).slice(0, 8) : '—'), code: (pt && pt.code) || '', img: (pt && pt.image) || null }; });
  const groups = {
    fila: items.filter((x) => x.status === 'analise' || x.status === 'aceita'),
    produzindo: items.filter((x) => x.status === 'produzindo'),
    historico: items.filter((x) => x.status === 'concluida' || x.status === 'rejeitada'),
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
  // Recusar = muda status para 'Rejeitada'. O endpoint só aceita { status } — o MOTIVO NÃO é
  // persistido (gap reportado); por isso confirmamos direto, sem coletar um texto que se perderia.
  const reject = async (d) => {
    if (busyRef.current) return;
    if (!window.confirm('Recusar a demanda de ' + d.qtd + '× ' + d.peca + '?')) return;
    setBusy(true);
    try {
      await window.FRApi.put('/producao-3d/demands/' + d.id + '/status', { status: 'Rejeitada' });
      reload();
      setToast({ kind: 'ok', msg: 'Demanda recusada.' });
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
        {view.map((d) => <P3DemandaCard key={d.id} t={t} d={d} busy={busy} onAdvance={advance} onReject={reject} />)}
      </div>
      )}
      <P3Toast t={t} toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

const P3_CATS = ['Componentes', 'Embalagem', 'Protótipo', 'Ferramenta'];
const P3_FILAMENTOS = ['PLA Azul', 'PLA Branco', 'PETG Preto', 'ABS Cinza', 'TPU Flex'];

function P3EditModal({ t, peca, onClose, onSave, onDelete }) {
  const novo = !peca.code;
  const [f, setF] = useStateP3({ nome: peca.nome || '', code: peca.code || '', cat: peca.cat || 'Componentes', fil: peca.fil || 'PLA Azul', gramas: String(peca.gramas ?? ''), tempo: peca.tempo || '', stock: String(peca.stock ?? 0), img: peca.img || '' });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const onFile = (file) => { if (!file) return; const r = new FileReader(); r.onload = () => set('img', r.result); r.readAsDataURL(file); };
  const field = { boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 };
  const sela = { ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(540px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={novo ? 'plus' : 'pencil'} size={19} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{novo ? 'Nova peça' : 'Editar peça'}</div><div style={{ fontSize: 12.5, color: t.muted }}>{novo ? 'Cadastre uma peça para impressão 3D.' : peca.code}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lab}>Imagem da peça</label>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 96, height: 96, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: `1px solid ${t.border}`, background: t.elevated, display: 'grid', placeItems: 'center', color: t.faint }}>
                {f.img ? <img src={window.__asset(f.img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="box" size={28} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', height: 38, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: t.accentText, background: t.accentSoft }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files[0])} />
                  <Icon name="upload" size={15} /> {f.img ? 'Trocar imagem' : 'Enviar imagem'}
                </label>
                {f.img && <button onClick={() => set('img', '')} style={{ all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: uiTone(t, 'red').fg }}>Remover</button>}
              </div>
            </div>
          </div>
          <div><label style={lab}>Nome da peça</label><input value={f.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: Copinho 3D" style={field} /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={lab}>SKU</label><input value={f.code} onChange={(e) => set('code', e.target.value)} placeholder="5.03.0000" style={field} /></div>
            <div style={{ flex: 1 }}>
              <label style={lab}>Etiqueta</label>
              <div style={{ position: 'relative' }}><select value={f.cat} onChange={(e) => set('cat', e.target.value)} style={sela}>{P3_CATS.map((c) => <option key={c}>{c}</option>)}</select><Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 15, color: t.muted, pointerEvents: 'none' }} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={lab}>Filamento gasto (g/un)</label><input value={f.gramas} onChange={(e) => set('gramas', e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" style={field} /></div>
            <div style={{ flex: 1 }}>
              <label style={lab}>Tipo de filamento</label>
              <div style={{ position: 'relative' }}><select value={f.fil} onChange={(e) => set('fil', e.target.value)} style={sela}>{P3_FILAMENTOS.map((c) => <option key={c}>{c}</option>)}</select><Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 15, color: t.muted, pointerEvents: 'none' }} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={lab}>Tempo gasto (por un)</label><input value={f.tempo} onChange={(e) => set('tempo', e.target.value)} placeholder="Ex: 1h 05min" style={field} /></div>
            <div style={{ width: 120 }}><label style={lab}>Em estoque</label><input value={f.stock} onChange={(e) => set('stock', e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" style={field} /></div>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          {!novo ? <button onClick={() => onDelete(peca.code)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 42, padding: '0 14px', borderRadius: 11, fontSize: 13, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}><Icon name="trash" size={15} /> Excluir</button> : <span />}
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
            <Btn t={t} icon="check" onClick={() => f.nome.trim() && f.code.trim() && onSave({ nome: f.nome.trim(), code: f.code.trim(), cat: f.cat, fil: f.fil, gramas: parseInt(f.gramas) || 0, tempo: f.tempo.trim() || '—', stock: parseInt(f.stock) || 0, img: f.img }, peca.code)}>{novo ? 'Cadastrar' : 'Salvar'}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Catálogo de Peças ----------
function P3Catalogo({ t }) {
  const [q, setQ] = useStateP3('');
  const [pecas, setPecas] = useStateP3(P3_PECAS);
  const [edit, setEdit] = useStateP3(null);
  const ql = q.trim().toLowerCase();
  const view = pecas.filter((p) => !ql || p.nome.toLowerCase().includes(ql) || p.code.includes(ql));
  const save = (np, oldCode) => { setPecas((xs) => oldCode ? xs.map((x) => (x.code === oldCode ? np : x)) : [np, ...xs]); setEdit(null); };
  const del = (code) => { setPecas((xs) => xs.filter((x) => x.code !== code)); setEdit(null); };
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
          <Btn t={t} icon="plus" onClick={() => setEdit({})}>Nova peça</Btn>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {view.map((p) => {
          const out = p.stock === 0;
          return (
            <Card t={t} key={p.code} hover style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                {p.img
                  ? <img src={window.__asset(p.img)} alt={p.nome} style={{ display: 'block', width: '100%', height: 220, objectFit: 'cover', background: '#e9ebf0' }} />
                  : <image-slot id={`p3d-${p.code}`} shape="rect" placeholder="Render da peça" style={{ display: 'block', width: '100%', height: 220, background: '#e9ebf0' }}></image-slot>}
                <span style={{ position: 'absolute', top: 0, left: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.04em', padding: '6px 13px', borderTopLeftRadius: 16, borderBottomRightRadius: 12, color: '#fff', background: t.accent }}>{p.cat}</span>
                <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 800, padding: '5px 11px', borderRadius: 999, color: '#fff', background: out ? '#ef4444' : '#10b981' }}>{out ? 'Esgotado' : `${p.stock} em estoque`}</span>
                <button onClick={() => setEdit(p)} title="Editar peça" style={{ all: 'unset', cursor: 'pointer', position: 'absolute', bottom: 10, right: 10, width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'rgba(8,10,16,.7)', color: '#fff', backdropFilter: 'blur(4px)' }}><Icon name="pencil" size={16} /></button>
              </div>
              <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.muted }}>{p.code}</div>
                <div style={{ fontSize: 17, fontWeight: 850, color: t.text, margin: '7px 0 14px', lineHeight: 1.25 }}>{p.nome}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <div style={{ flex: 1, padding: '9px 11px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}><Icon name="zap" size={11} /> FILAMENTO</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginTop: 3 }}>{p.gramas}g</div>
                    <div style={{ fontSize: 10.5, color: t.muted }}>{p.fil}</div>
                  </div>
                  <div style={{ flex: 1, padding: '9px 11px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}><Icon name="clock" size={11} /> TEMPO</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginTop: 3 }}>{p.tempo}</div>
                    <div style={{ fontSize: 10.5, color: t.muted }}>por unidade</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhuma peça" sub="Ajuste a busca ou cadastre uma nova peça." /></Card></div>}
      </div>
      {edit && <P3EditModal t={t} peca={edit} onClose={() => setEdit(null)} onSave={save} onDelete={del} />}
    </div>
  );
}

function renderPage3D(active, props) {
  const t = frTokens(props.theme, P3_ACCENT, P3_ACCENT_T);
  const p = { ...props, t };
  if (active === 'p3d-producao') return <P3Historico {...p} />;
  if (active === 'p3d-demandas') return <P3Demandas {...p} />;
  if (active === 'p3d-catalogo') return <P3Catalogo {...p} />;
  return <P3Dashboard {...p} />;
}

window.renderPage3D = renderPage3D;
