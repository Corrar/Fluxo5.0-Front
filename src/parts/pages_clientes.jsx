// pages_clientes.jsx — "Clientes e OPs": KPIs, novo cliente, busca, grade de cards com OPs.
// LIGADO ao backend real (GET/POST/PUT/PATCH/DELETE /clients). A chave de React/estado é o UUID do
// backend (não o code). code/op_code são só DISPLAY. Status canônico do backend: em_andamento/concluido
// (largamos 'pausada'). O conteúdo da OP é o total_cost real (largamos a antiga ficção de itens por OP).
const { useState: useStateC } = React;

// Status CANÔNICO do backend (updateServiceStatus grava 'em_andamento'/'concluido').
const OP_STATUS = {
  'em_andamento': { label: 'Em andamento', badge: 'EM ANDAMENTO', kind: 'blue' },
  'concluido':    { label: 'Finalizada',   badge: 'FINALIZADA',   kind: 'green' },
};
// Fallback defensivo p/ qualquer status legado que ainda vier do banco (ex.: 'em-andamento' com hífen).
function opStatusOf(s) {
  if (OP_STATUS[s]) return OP_STATUS[s];
  if (s === 'finalizada' || s === 'done') return OP_STATUS['concluido'];
  return OP_STATUS['em_andamento'];
}
function isConcluido(s) { return s === 'concluido' || s === 'finalizada' || s === 'done'; }

// ⚠️ CLIENTES_SEED + os globais abaixo continuam sendo a FONTE MOCK de OUTRAS telas ainda não migradas
// (Meus Pedidos, Conferência, Montagem, Separações consomem window.FR_OPS_ATIVAS / frClienteDaOP).
// NÃO remover enquanto essas telas não forem ligadas. A tela de Clientes NÃO usa mais este seed
// (renderiza 100% do useFRClients -> GET /clients).
//
// 🧾 DÍVIDA TÉCNICA (documentada): estes globais estão DESSINCRONIZADOS do backend. São montados do
// seed estático no load do módulo, então uma OP real criada na tela Clientes NÃO aparece nos dropdowns
// das telas mock acima. AO LIGAR conferencia/montagem/pedidos/separacoes: FR_OPS_ATIVAS / frClienteDaOP
// têm que passar a vir do backend (GET /clients -> services), não deste seed — e aí este bloco sai.
const CLIENTES_SEED = [
  { id: '32401',     nome: 'DERLI JOSE',                ops: [{ n: 'OP 73001', s: 'em-andamento' }] },
  { id: '000321',    nome: 'FÁBIO BOLDT',               ops: [{ n: 'OP 32101', s: 'em-andamento' }] },
  { id: '674.408.86',nome: 'WALTER SAAGER',             ops: [{ n: 'OP 67401', s: 'em-andamento' }] },
  { id: '07591258',  nome: 'GRANJA SÃO JOSÉ',           ops: [{ n: 'OP 75901', s: 'em-andamento' }] },
  { id: '00004',     nome: 'DENESTER PROTOTIPO',        ops: [{ n: 'OP 00401', s: 'em-andamento' }] },
  { id: '901001',    nome: 'MANTIQUEIRA CÉU AZUL',      ops: [{ n: 'OP 90101', s: 'em-andamento' }, { n: 'OP 901001', s: 'em-andamento' }] },
  { id: '882102',    nome: 'GRANJA SANTA RITA',         ops: [{ n: 'OP 88210', s: 'em-andamento' }] },
  { id: '541203',    nome: 'AVIÁRIO BELA VISTA',        ops: [{ n: 'OP 54120', s: 'em-andamento' }] },
  { id: '730726',    nome: 'GRANJA PARAISO / JANAÍNA',  ops: [{ n: 'OP 73002', s: 'em-andamento' }] },
  { id: '48.839.025',nome: 'WILLIAN LEMKE',             ops: [{ n: 'OP 48001', s: 'finalizada' }] },
  { id: '000278',    nome: 'OVOS DA NONNA',             ops: [{ n: 'OP 27801', s: 'finalizada' }] },
  { id: '07453746',  nome: 'FLORENCIO AUGUSTO BENTO',   ops: [{ n: 'OP 74501RF', s: 'finalizada' }] },
  { id: '000262',    nome: '3 AMORES',                  ops: [{ n: 'OP 26202', s: 'finalizada' }, { n: 'OP 26201', s: 'finalizada' }] },
  { id: '000002',    nome: 'ENGENHARIA',                ops: [{ n: 'OP 00005', s: 'em-andamento' }, { n: 'OP 00007', s: 'em-andamento' }, { n: 'OP 00002', s: 'finalizada' }] },
  { id: '000003',    nome: 'PRT CLASS',                 ops: [{ n: 'OP 00301', s: 'em-andamento' }, { n: 'OP 00303', s: 'em-andamento' }, { n: 'OP 00302', s: 'finalizada' }] },
  { id: '000233',    nome: 'BOTELHO',                   ops: [{ n: 'OP 23301', s: 'em-andamento' }] },
  { id: '000001',    nome: 'OUTROS',                    ops: [{ n: 'OP 00101', s: 'finalizada' }] },
  { id: '000237',    nome: 'EDSON KAUSS',               ops: [{ n: 'OP 23701', s: 'finalizada' }] },
  { id: '000236',    nome: 'AVINE',                     ops: [{ n: 'OP 23601', s: 'finalizada' }] },
  { id: '000229',    nome: 'OVOS UP',                   ops: [{ n: 'OP 22901', s: 'em-andamento' }] },
];

// OPs ativas (em andamento) agrupadas por cliente — usadas pelo "Meus Pedidos".
window.FR_OPS_ATIVAS = CLIENTES_SEED
  .map((c) => ({ cliente: c.nome, ops: c.ops.filter((o) => o.s === 'em-andamento').map((o) => o.n.replace(/^OP\s*/i, '')) }))
  .filter((c) => c.ops.length > 0);

// Mapa OP → cliente (TODAS as OPs, qualquer status) — busca de cliente por OP nas etiquetas.
window.FR_OP_CLIENTE = (() => {
  const m = {};
  CLIENTES_SEED.forEach((c) => (c.ops || []).forEach((o) => { m[o.n.replace(/^OP\s*/i, '')] = c.nome; }));
  return m;
})();
window.frClienteDaOP = function (op) {
  const key = String(op).replace(/^OP\s*/i, '');
  const map = window.FR_OP_CLIENTE || {};
  if (map[key]) return map[key];
  const hit = Object.keys(map).find((k) => k === key || k.includes(key) || key.includes(k));
  return hit ? map[hit] : null;
};

// ---- Formatação BRL (reusa o adapter dos produtos; fallback simples) ----
function frBRL(v) {
  const f = window.FRAdapters && window.FRAdapters.formatBRL;
  return f ? f(v) : ('R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}
function frCliErr(e) {
  const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
  return g ? g(e) : (e && e.message) || 'Erro inesperado.';
}

// ---- Adapter: cliente REAL (GET /clients) -> shape da tela ----
// Backend: { id(uuid), code, name, services:[{ id(uuid), op_code, description, status, total_cost }] }
// A tela usa: chave = UUID; code/op_code = display; status canônico; total_cost real.
function adaptClient(c) {
  c = c || {};
  return {
    id: c.id,                                   // UUID — chave de React + path das rotas
    code: c.code || '',                         // display "ID do cliente"
    nome: c.name || '',
    ops: (c.services || []).map((s) => ({
      id: s.id,                                 // UUID do service — path das rotas /services/:id
      op_code: s.op_code || '',
      n: 'OP ' + (s.op_code || ''),             // display re-prefixado
      s: s.status || 'em_andamento',            // canônico
      total_cost: Number(s.total_cost || 0),
    })),
  };
}

// ---- Hook de dados: GET /clients adaptado (padrão do useFRProducts) ----
function useFRClients() {
  const R = window.React;
  const [items, setItems] = R.useState([]);
  const [loading, setLoading] = R.useState(true);
  const [error, setError] = R.useState(null);
  const mounted = R.useRef(true);
  const load = R.useCallback(function () {
    setError(null);
    window.FRApi.get('/clients', { skipLoading: true })
      .then(function (res) {
        if (!mounted.current) return;
        const rows = Array.isArray(res && res.data) ? res.data : [];
        setItems(rows.map(adaptClient));
        setLoading(false);
      })
      .catch(function (e) {
        if (!mounted.current) return;
        setError(frCliErr(e));
        setLoading(false);
      });
  }, []);
  R.useEffect(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);
  return { items: items, loading: loading, error: error, reload: load };
}

function PageClientes({ t, readOnly }) {
  const { items: clientes, loading, error, reload } = useFRClients();
  const [xfer, setXfer] = useStateC(null);   // { srcId, srcLabel } origem da transferência
  const [toast, setToast] = useStateC(null);
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);
  const [expanded, setExpanded] = useStateC([]);
  const [q, setQ] = useStateC('');
  const [filtro, setFiltro] = useStateC('todos');
  const [nid, setNid] = useStateC('');
  const [nnome, setNnome] = useStateC('');
  const [novaOp, setNovaOp] = useStateC({});
  const [busy, setBusy] = useStateC(false);

  const errToast = (e) => setToast({ kind: 'err', msg: frCliErr(e) });
  const okToast = (msg) => setToast({ kind: 'ok', msg });

  const finalizadas = (c) => c.ops.filter((o) => isConcluido(o.s)).length;
  const progresso = (c) => (c.ops.length ? Math.round((finalizadas(c) / c.ops.length) * 100) : 0);
  const opsTotais = clientes.reduce((a, c) => a + c.ops.length, 0);
  const opsFin = clientes.reduce((a, c) => a + finalizadas(c), 0);

  const ql = q.trim().toLowerCase();
  const view = clientes.filter((c) => {
    const match = !ql || c.nome.toLowerCase().includes(ql) || (c.code || '').toLowerCase().includes(ql) || c.ops.some((o) => o.n.toLowerCase().includes(ql));
    const pr = progresso(c);
    const fmatch = filtro === 'todos' || (filtro === 'andamento' && pr < 100) || (filtro === 'finalizadas' && pr === 100);
    return match && fmatch;
  });

  const toggle = (id) => setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  // ---- Handlers REAIS (FRApi + reload após sucesso) ----
  const addCliente = async () => {
    if (!nid.trim() || !nnome.trim()) { setToast({ kind: 'err', msg: 'Informe o ID/código e o nome do cliente.' }); return; }
    if (busy) return; setBusy(true);
    try {
      await window.FRApi.post('/clients', { code: nid.trim(), name: nnome.trim().toUpperCase() });
      setNid(''); setNnome(''); await reloadAsync();
    } catch (e) { errToast(e); } finally { setBusy(false); }
  };
  const renameCliente = async (c) => {
    const novo = window.prompt('Novo nome do cliente:', c.nome);
    if (novo == null) return;
    const name = novo.trim().toUpperCase();
    if (!name || name === c.nome) return;
    if (busy) return; setBusy(true);
    try { await window.FRApi.put('/clients/' + c.id, { name }); await reloadAsync(); }
    catch (e) { errToast(e); } finally { setBusy(false); }
  };
  const delCliente = async (id) => {
    if (busy) return; setBusy(true);
    try { await window.FRApi.delete('/clients/' + id); await reloadAsync(); }
    catch (e) { errToast(e); } finally { setBusy(false); }   // 400 FK-guard -> toast, NÃO remove
  };
  const addOp = async (cid) => {
    const label = (novaOp[cid] || '').trim();
    const op_code = label.replace(/^op\s*/i, '').toUpperCase().trim();
    if (!op_code) { setToast({ kind: 'err', msg: 'Informe o número da OP.' }); return; }
    if (busy) return; setBusy(true);
    try {
      await window.FRApi.post('/clients/' + cid + '/services', { op_code });
      setNovaOp((m) => ({ ...m, [cid]: '' }));
      setExpanded((e) => (e.includes(cid) ? e : [...e, cid]));
      await reloadAsync();
    } catch (e) { errToast(e); } finally { setBusy(false); }
  };
  const setOpStatus = async (serviceId, status) => {
    if (busy) return; setBusy(true);
    try { await window.FRApi.patch('/clients/services/' + serviceId + '/status', { status }); await reloadAsync(); }
    catch (e) { errToast(e); } finally { setBusy(false); }
  };
  const delOp = async (serviceId, label) => {
    if (busy) return; setBusy(true);
    try { await window.FRApi.delete('/clients/services/' + serviceId); await reloadAsync(); okToast(`${label} excluída.`); }
    catch (e) { errToast(e); } finally { setBusy(false); }   // 400 -> tem movimentações -> toast, NÃO remove
  };
  const doTransfer = async (destServiceId, destLabel) => {
    if (!xfer) return;
    if (busy) return; setBusy(true);
    try {
      await window.FRApi.post('/clients/services/' + xfer.srcId + '/transfer', { targetServiceId: destServiceId });
      const from = xfer.srcLabel; setXfer(null); await reloadAsync();
      setToast({ kind: 'ok', msg: `Movimentações de ${from} transferidas para ${destLabel}.` });
    } catch (e) { setXfer(null); errToast(e); } finally { setBusy(false); }
  };
  // reload retorna void; embrulho em Promise pra dar await (a UI atualiza quando os items chegam)
  const reloadAsync = () => { reload(); return Promise.resolve(); };

  const field = { boxSizing: 'border-box', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const initials = (n) => (n || '').replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const [hA1, hA2] = ['#0b3a8f', '#2563eb'];

  return (
    <div>
      {/* hero */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '26px 28px', marginBottom: 22, background: `linear-gradient(135deg, ${hA1}, ${hA2})`, color: '#fff' }}>
        <Icon name="users" size={180} style={{ position: 'absolute', right: -30, top: -38, opacity: 0.1 }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 850, letterSpacing: '-.02em', display: 'flex', alignItems: 'center', gap: 11 }}><Icon name="users" size={24} /> Painel de Clientes</h1>
            <p style={{ margin: '7px 0 0', fontSize: 13.5, color: 'rgba(255,255,255,.85)' }}>Gestão de Clientes e Ordens de Produção (OP).</p>
          </div>
        </div>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 22 }}>
          {[['users', 'Clientes', clientes.length], ['clipboard', 'OPs totais', opsTotais], ['check', 'OPs finalizadas', opsFin]].map(([ic, lab, val]) => (
            <div key={lab} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.18)' }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,.18)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={ic} size={19} /></span>
              <div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(255,255,255,.8)', textTransform: 'uppercase' }}>{lab}</div><div style={{ fontSize: 24, fontWeight: 850, lineHeight: 1.1 }}>{val}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* novo cliente */}
      {!readOnly && (
      <Card t={t} style={{ padding: 18, marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="userPlus" size={17} /></span>
          <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Novo cliente</span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: 150 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.muted, marginBottom: 7 }}>ID do cliente</label>
            <input value={nid} onChange={(e) => setNid(e.target.value)} placeholder="Ex: 001" style={field} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.muted, marginBottom: 7 }}>Nome do cliente</label>
            <input value={nnome} onChange={(e) => setNnome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCliente()} placeholder="Ex: Indústria Alfa Ltda" style={field} />
          </div>
          <Btn t={t} icon="userPlus" onClick={addCliente}>Adicionar cliente</Btn>
        </div>
      </Card>
      )}

      {readOnly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: t.accentSoft, color: t.accentText, fontSize: 12.5, fontWeight: 600, marginBottom: 22 }}>
          <Icon name="eye" size={16} /> Modo somente leitura — visualização de clientes e OPs.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: t.text, letterSpacing: '-.01em' }}>Lista de clientes</span>
        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: t.accentSoft, color: t.accentText }}>{view.length} de {clientes.length}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 220, height: 46, padding: '0 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, ID ou número da OP…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
        </label>
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
          {[['todos', 'Todos'], ['andamento', 'Em andamento'], ['finalizadas', 'Finalizadas']].map(([k, label]) => {
            const on = filtro === k;
            return <button key={k} onClick={() => setFiltro(k)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', height: 38, padding: '0 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? t.onAccent : t.muted, whiteSpace: 'nowrap' }}>{label}</button>;
          })}
        </div>
      </div>

      {loading && !clientes.length ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando clientes…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
        </Card>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
        {view.map((c) => {
          const open = expanded.includes(c.id);
          const pr = progresso(c);
          return (
            <Card t={t} key={c.id} hover style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: pr === 100 ? uiTone(t, 'green').bg : t.accentSoft, color: pr === 100 ? uiTone(t, 'green').fg : t.accentText, display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 14, flexShrink: 0 }}>{initials(c.nome)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 16.5, fontWeight: 850, color: t.text, letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</span>
                    {!readOnly && (
                      <button title="Renomear cliente" onClick={() => renameCliente(c)} style={{ all: 'unset', cursor: 'pointer', width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.faint, flexShrink: 0 }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = t.accentText; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.faint; }}><Icon name="pencil" size={13} /></button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: t.hover, color: t.muted, whiteSpace: 'nowrap' }}>ID {c.code}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: pr === 100 ? uiTone(t, 'green').fg : t.muted, whiteSpace: 'nowrap' }}>{finalizadas(c)}/{c.ops.length} finalizadas</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                  {!readOnly && (
                    <button onClick={() => delCliente(c.id)} title="Excluir cliente" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={16} /></button>
                  )}
                  <button onClick={() => toggle(c.id)} title={open ? 'Recolher' : 'Expandir'} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="chevronDown" size={18} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 0 8px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: t.faint }}>PROGRESSO</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: pr === 100 ? uiTone(t, 'green').fg : t.accentText }}>{pr}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 6, background: t.hover, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pr}%`, borderRadius: 6, background: pr === 100 ? `linear-gradient(90deg, ${uiTone(t, 'green').fg}, ${frHexToRgba(uiTone(t, 'green').fg, 0.7)})` : `linear-gradient(90deg, ${t.accent}, ${frHexToRgba(t.accent, 0.65)})`, transition: 'width .45s ease' }} />
              </div>

              {open && (
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
                  {!readOnly && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, height: 40, padding: '0 12px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
                      <Icon name="briefcase" size={15} />
                      <input value={novaOp[c.id] || ''} onChange={(e) => setNovaOp((m) => ({ ...m, [c.id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addOp(c.id)} placeholder="Adicionar nova OP…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 13, fontFamily: 'inherit' }} />
                    </label>
                    <button onClick={() => addOp(c.id)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: t.text, border: `1px solid ${t.border}`, background: t.panel }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = t.panel; }}><Icon name="plus" size={15} /> Nova OP</button>
                  </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {c.ops.map((o) => {
                      const st = opStatusOf(o.s); const col = uiTone(t, st.kind);
                      return (
                        <div key={o.id} style={{ borderRadius: 12, padding: 14, background: t.elevated, border: `1px solid ${t.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <span style={{ width: 9, height: 9, borderRadius: '50%', background: col.fg, flexShrink: 0 }} />
                            <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{o.n}</span>
                          </div>
                          <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.04em', padding: '4px 9px', borderRadius: 7, background: col.bg, color: col.fg }}>{st.badge}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: o.total_cost > 0 ? t.muted : t.faint }}>
                              <Icon name="dollar" size={13} /> {o.total_cost > 0 ? frBRL(o.total_cost) : 'Sem custo'}
                            </span>
                          </div>
                          {!readOnly && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                            <div style={{ position: 'relative' }}>
                              <select value={isConcluido(o.s) ? 'concluido' : 'em_andamento'} onChange={(e) => setOpStatus(o.id, e.target.value)} style={{ boxSizing: 'border-box', width: '100%', height: 38, borderRadius: 9, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 32px 0 12px', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', appearance: 'none', WebkitAppearance: 'none', outline: 'none', cursor: 'pointer' }}>
                                <option value="em_andamento">Em andamento</option>
                                <option value="concluido">Finalizada</option>
                              </select>
                              <Icon name="chevronDown" size={14} style={{ position: 'absolute', right: 11, top: 12, color: t.muted, pointerEvents: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button onClick={() => setXfer({ srcId: o.id, srcLabel: o.n })} title="Transferir todas as movimentações para outra OP"
                                style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 38, borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: t.accentText, border: `1px solid ${t.border}`, background: t.panel }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = t.panel; }}>
                                <Icon name="swap" size={15} /> Transferir movimentações
                              </button>
                              <button onClick={() => delOp(o.id, o.n)} title="Excluir OP" style={{ all: 'unset', cursor: 'pointer', width: 38, height: 38, borderRadius: 9, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}`, flexShrink: 0 }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
                            </div>
                          </div>
                          )}
                        </div>
                      );
                    })}
                    {c.ops.length === 0 && <div style={{ padding: '14px', textAlign: 'center', fontSize: 12.5, color: t.muted, border: `1px dashed ${t.border}`, borderRadius: 10 }}>Nenhuma OP cadastrada.</div>}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {view.length === 0 && <Card t={t} style={{ padding: 24, textAlign: 'center', color: t.muted, fontSize: 13.5, gridColumn: '1/-1' }}>Nenhum cliente encontrado.</Card>}
      </div>
      )}

      {/* Modal: transferir movimentações da OP */}
      {xfer && (() => {
        const dests = clientes.flatMap((c) => c.ops.map((o) => ({ c, o })).filter((x) => x.o.id !== xfer.srcId));
        return (
          <div onClick={() => setXfer(null)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8,10,20,.55)', display: 'grid', placeItems: 'center', padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 96vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: t.panel, borderRadius: 18, border: `1px solid ${t.borderStrong}`, boxShadow: t.shadow, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: t.accentSoft, color: t.accentText, flexShrink: 0 }}><Icon name="swap" size={19} /></div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Transferir movimentações</div>
                    <div style={{ fontSize: 12.5, color: t.muted }}>De <b style={{ color: t.text }}>{xfer.srcLabel}</b> para a OP escolhida</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: t.muted, lineHeight: 1.5 }}>Todas as movimentações (pedidos, saídas, devoluções) vinculadas a esta OP serão reatribuídas à OP de destino.</div>
              </div>
              <div className="fr-scroll" style={{ padding: 12, overflowY: 'auto' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', color: t.faint, padding: '4px 8px 8px' }}>ESCOLHA A OP DE DESTINO</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dests.map(({ c, o }) => (
                    <button key={o.id} onClick={() => doTransfer(o.id, o.n)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.elevated; }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>{o.n}</div>
                        <div style={{ fontSize: 11.5, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome} · {opStatusOf(o.s).label}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: t.faint, flexShrink: 0 }}>{o.total_cost > 0 ? frBRL(o.total_cost) : '—'}</span>
                      <Icon name="chevronRight" size={16} style={{ color: t.muted, flexShrink: 0 }} />
                    </button>
                  ))}
                  {dests.length === 0 && <div style={{ padding: 16, textAlign: 'center', fontSize: 12.5, color: t.muted }}>Nenhuma outra OP disponível.</div>}
                </div>
              </div>
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setXfer(null)} style={{ all: 'unset', cursor: 'pointer', height: 38, padding: '0 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: t.text, border: `1px solid ${t.border}` }}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', zIndex: 90, bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderRadius: 13, background: toast.kind === 'err' ? uiTone(t, 'red').fg : t.text, color: '#fff', boxShadow: '0 18px 40px rgba(0,0,0,.3)', maxWidth: '92vw' }}>
          <Icon name={toast.kind === 'err' ? 'alert' : toast.kind === 'ok' ? 'check' : 'swap'} size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ all: 'unset', cursor: 'pointer', opacity: 0.7, flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>
      )}
    </div>
  );
}

window.PageClientes = PageClientes;
