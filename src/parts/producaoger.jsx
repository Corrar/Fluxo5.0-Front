// producaoger.jsx — "Produção" module: Painel, Ordens de Produção (kanban), Apontamentos.
const { useState: useStatePG } = React;
const PG_ACCENT = '#7c3aed', PG_ACCENT_T = '#a78bfa';

const PG_STATUS = {
  planejada:  { label: 'Planejada', kind: 'gray', next: 'producao', act: 'Iniciar produção' },
  producao:   { label: 'Em produção', kind: 'accent', next: 'qualidade', act: 'Enviar p/ qualidade' },
  qualidade:  { label: 'Qualidade', kind: 'amber', next: 'concluida', act: 'Aprovar & concluir' },
  concluida:  { label: 'Concluída', kind: 'green' },
};
const PG_ORDENS_SEED = [
  { id: 'OP-2041', produto: 'Painel Elétrico QGBT-12', cliente: 'Mantiqueira', setor: 'Elétrica', qtd: 4, feito: 1, status: 'producao', prazo: '20/06', resp: 'Bruno T.' },
  { id: 'OP-2038', produto: 'Bancada Inox 2,4M', cliente: 'Granja São José', setor: 'Usinagem', qtd: 2, feito: 0, status: 'planejada', prazo: '24/06', resp: 'Carlos M.' },
  { id: 'OP-2060', produto: 'Protótipo Gabinete 3D', cliente: 'Denester', setor: 'Produção 3D', qtd: 1, feito: 1, status: 'qualidade', prazo: '18/06', resp: 'Rafael S.' },
  { id: 'OP-2055', produto: 'Esteira Transportadora 6M', cliente: 'Indústria Veloz', setor: 'Montagem', qtd: 1, feito: 1, status: 'concluida', prazo: '14/06', resp: 'Ana P.' },
  { id: 'OP-2052', produto: 'Suporte de Sensor (lote)', cliente: 'Mantiqueira', setor: 'Produção 3D', qtd: 50, feito: 22, status: 'producao', prazo: '19/06', resp: 'Davi M.' },
];
// PG_APONTA_SEED / PG_ARMAZEM_SEED / PG_CONSUMO_SEED REMOVIDOS na peça 2 — Armazém e Apontamentos
// renderizam 100% do backend real (/op-materials). O PG_ARMAZEM_SEED era o "lote por OP" com
// recebido/usado em memória; virou a projeção do GET /balance. O PG_CONSUMO_SEED virou o GET /events.
// O PG_APONTA_SEED (etapa/horas) já era código morto desde sempre: nenhuma tela o renderizava —
// e continua SEM backend (productions_3d não tem etapa/hora; apontar HORA é outra peça, não esta).
//
// ⚠ PG_ORDENS_SEED (acima) FICA: o PGPainel ainda deriva "OPs ativas / em produção / concluídas"
// dele, e o Painel não está no escopo desta peça. É a última ficção do módulo — as 3 telas desta
// peça não o tocam. Ao ligar o Painel, ele sai e as OPs vêm do GET /clients (como aqui embaixo).

// ==========================================================================
// LIGAÇÃO AO BACKEND /op-materials — o armazém de material por OP (peça 1 do módulo).
// Sub-razão do WIP: o físico central JÁ saiu no consume da separação; aqui vive o material que
// está COM a OP. Saldo é PROJEÇÃO (o backend soma o razão), nunca um número guardado.
// Hooks no padrão useFRClients / useFR3DParts.
// ==========================================================================
function pgErr(e) { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; }
function pgNum(v) { const f = window.FRAdapters && window.FRAdapters.parseNumber; return f ? f(v) : (parseFloat(v) || 0); }
const pgGenKey = () => (crypto.randomUUID?.() ?? `pg-${Date.now()}-${Math.random().toString(16).slice(2)}`); // fallback p/ contexto não-seguro (http://IP-LAN)
function pgDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso); if (isNaN(d.getTime())) return '—';
  const p = (x) => String(x).padStart(2, '0');
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

// Hook GET genérico -> { items, loading, error, reload }. path null/'' = não busca (sem OP escolhida).
// reqId descarta resposta de requisição velha: trocar de OP rápido dispararia duas buscas e a
// primeira poderia responder DEPOIS, pintando a tela com o saldo da OP errada.
function pgUseGet(path) {
  const R = window.React;
  const [items, setItems] = R.useState([]);
  const [loading, setLoading] = R.useState(!!path);
  const [error, setError] = R.useState(null);
  const mounted = R.useRef(true);
  const reqId = R.useRef(0);
  const load = R.useCallback(function () {
    const my = ++reqId.current;
    if (!path) { setItems([]); setLoading(false); setError(null); return; }
    setLoading(true); setError(null);
    window.FRApi.get(path, { skipLoading: true })
      .then(function (res) {
        if (!mounted.current || my !== reqId.current) return;
        setItems(Array.isArray(res && res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(function (e) {
        if (!mounted.current || my !== reqId.current) return;
        setError(pgErr(e)); setLoading(false);
      });
  }, [path]);
  R.useEffect(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);
  return { items: items, loading: loading, error: error, reload: load };
}

// A fila do Recebimento: 1 linha por (separação, item) ainda não recebido por inteiro.
function useFROpPendingReceipts(sector) {
  return pgUseGet('/op-materials/pending-receipts' + (sector ? '?sector=' + encodeURIComponent(sector) : ''));
}
// A projeção do saldo da OP: 1 linha por produto.
function useFROpBalance(csid) { return pgUseGet(csid ? '/op-materials/balance/' + csid : ''); }
// O extrato do razão da OP (LIMIT 50 no backend). tipo opcional: 'consumido' | 'recebido' | ...
function useFROpEvents(csid, tipo) { return pgUseGet(csid ? '/op-materials/events/' + csid + (tipo ? '?event_type=' + tipo : '') : ''); }

// Mutações. Devolvem a resposta; quem chama trata erro/toast (padrão das telas já ligadas).
function frOpReceive(separationId, items, idemKey) {
  return window.FRApi.post('/op-materials/receive', { separationId: separationId, items: items }, { headers: { 'X-Idempotency-Key': idemKey } });
}
function frOpConsume(clientServiceId, productId, qty, idemKey) {
  return window.FRApi.post('/op-materials/consume', { clientServiceId: clientServiceId, productId: productId, qty: qty }, { headers: { 'X-Idempotency-Key': idemKey } });
}
Object.assign(window, { useFROpPendingReceipts, useFROpBalance, useFROpEvents, frOpReceive, frOpConsume, pgErr, pgGenKey, pgDateTime, pgNum });

// ---------- Toast (erro/sucesso) — mesmo visual das telas já ligadas ----------
function PGToast({ t, toast, onClose }) {
  if (!toast) return null;
  return (
    <div style={{ position: 'fixed', zIndex: 90, bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderRadius: 13, background: toast.kind === 'err' ? uiTone(t, 'red').fg : t.text, color: '#fff', boxShadow: '0 18px 40px rgba(0,0,0,.3)', maxWidth: '92vw' }}>
      <Icon name={toast.kind === 'err' ? 'alert' : 'check'} size={18} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
      <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', opacity: 0.7, flexShrink: 0 }}><Icon name="x" size={16} /></button>
    </div>
  );
}
window.PGToast = PGToast;

// ---------- Seletor de OP (compartilhado por Apontamentos e Armazém) ----------
// As OPs vêm do GET /clients REAL (decisão C) — NUNCA do window.FR_OPS_ATIVAS, que é montado do
// seed estático de pages_clientes e está dessincronizado do banco (dívida documentada lá).
// "OP aberta" = !frIsOpConcluida(status), o MESMO normalizador que a tela Clientes usa. Filtrar
// pela string literal 'em_andamento' devolveria 1 OP das 17 abertas (16 são legado 'pendente') e
// contradiria a Clientes, que já as exibe como "Em andamento".
function pgOpsAbertas(clientes) {
  const isConcl = window.frIsOpConcluida || function () { return false; };
  const out = [];
  (clientes || []).forEach((c) => (c.ops || []).forEach((o) => {
    if (!isConcl(o.s)) out.push({ id: o.id, op_code: o.op_code, cliente: c.nome });
  }));
  return out.sort((a, b) => String(a.op_code).localeCompare(String(b.op_code)));
}

function PGOpPicker({ t, ops, value, onChange, loading, error }) {
  const sela = { boxSizing: 'border-box', width: '100%', height: 46, borderRadius: 12, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none', appearance: 'none', WebkitAppearance: 'none', paddingRight: 34, cursor: 'pointer' };
  return (
    <div style={{ maxWidth: 420 }}>
      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 }}>Ordem de Produção</label>
      {error ? (
        <div style={{ fontSize: 13, fontWeight: 700, color: uiTone(t, 'red').fg }}>{error}</div>
      ) : (
        <div style={{ position: 'relative' }}>
          <select value={value} onChange={(e) => onChange(e.target.value)} style={sela} disabled={loading}>
            <option value="">{loading ? 'Carregando OPs…' : ops.length ? 'Selecione a OP…' : 'Nenhuma OP aberta'}</option>
            {ops.map((o) => <option key={o.id} value={o.id}>OP {o.op_code} · {o.cliente}</option>)}
          </select>
          <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 12, top: 16, color: t.muted, pointerEvents: 'none' }} />
        </div>
      )}
    </div>
  );
}

// ---------- Painel ----------
function PGPainel({ t, ordens, setActive }) {
  const emProd = ordens.filter((o) => o.status === 'producao').length;
  const concl = ordens.filter((o) => o.status === 'concluida').length;
  const ativas = ordens.filter((o) => o.status !== 'concluida').length;
  const setores = [['Usinagem', 88, 'green'], ['Produção 3D', 72, 'accent'], ['Elétrica', 64, 'amber'], ['Montagem', 80, 'blue']];
  const meses = [{ label: 'Jan', v: 58 }, { label: 'Fev', v: 70, accent: true }, { label: 'Mar', v: 64 }, { label: 'Abr', v: 82, accent: true }, { label: 'Mai', v: 76 }, { label: 'Jun', v: 90, accent: true }];
  const go = (id) => setActive && setActive(id);
  const atalhos = [
    { id: 'prod-armazem', icon: 'box', nome: 'Armazém', desc: 'Material por OP e apontamento' },
    { id: 'prod-aponta', icon: 'clipboard', nome: 'Apontamentos', desc: 'Consumo registrado por OP' },
    { id: 'devolucaoop', icon: 'exchange', nome: 'Devolução por OP', desc: 'Devolver sobra ao estoque' },
  ];
  const orientacoes = [
    { icon: 'box', tone: 'blue', titulo: 'Aponte o consumo no Armazém', desc: 'Registre o material usado em cada OP para manter o saldo do estoque correto.' },
    { icon: 'clipboard', tone: 'accent', titulo: 'Acompanhe os apontamentos', desc: 'Veja o consumo registrado por OP e exporte o relatório quando precisar.' },
    { icon: 'exchange', tone: 'amber', titulo: 'Devolva a sobra', desc: 'Ao finalizar a OP, devolva o material não utilizado pela página Devolução por OP.' },
  ];
  return (
    <div>
      {/* hero */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '30px 32px', marginBottom: 24, background: `linear-gradient(120deg, ${theme_dark(t)} 0%, ${t.accent} 135%)`, color: '#fff' }}>
        <Icon name="zap" size={190} style={{ position: 'absolute', right: -34, top: -40, opacity: 0.1 }} />
        <div style={{ position: 'relative', maxWidth: 620 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,.18)', marginBottom: 16 }}><Icon name="zap" size={13} /> Módulo Produção</div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 850, letterSpacing: '-.02em', lineHeight: 1.1 }}>Bom dia, Bruno 👋</h1>
          <p style={{ margin: '8px 0 18px', fontSize: 14, color: 'rgba(255,255,255,.88)', lineHeight: 1.5 }}>Você tem <b>{ativas} ordens ativas</b>, sendo <b>{emProd} em produção</b>. {concl} foram concluídas recentemente.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => go('prod-armazem')} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: '#fff', color: t.accent, boxShadow: '0 6px 16px rgba(0,0,0,.2)' }}><Icon name="box" size={16} /> Abrir Armazém</button>
            <button onClick={() => go('prod-aponta')} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, background: 'rgba(255,255,255,.16)', color: '#fff' }}><Icon name="clipboard" size={16} /> Apontamentos</button>
          </div>
        </div>
      </div>

      {/* acesso rápido */}
      <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 12 }}>Acesso rápido</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 26 }}>
        {atalhos.map((a) => (
          <button key={a.id} onClick={() => go(a.id)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 13, padding: 16, borderRadius: 16, background: t.panel, border: `1px solid ${t.border}`, transition: 'transform .15s, box-shadow .15s, border-color .15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = t.shadow; e.currentTarget.style.borderColor = t.borderStrong; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = t.border; }}>
            <span style={{ width: 42, height: 42, borderRadius: 12, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={a.icon} size={20} /></span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{a.nome}</div><div style={{ fontSize: 11.5, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.desc}</div></div>
            <Icon name="chevronRight" size={17} style={{ color: t.faint, flexShrink: 0 }} />
          </button>
        ))}
      </div>

      <PageHeader t={t} title="Indicadores" subtitle="Resumo das ordens de produção."
        actions={<Btn t={t} kind="ghost" icon="download">Exportar</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} icon="kanban" label="OPs ativas" value={ativas} sub="em andamento" kind="accent" />
        <KPI t={t} icon="check" label="Concluídas no mês" value="34" sub="+9%" kind="green" />
        <KPI t={t} icon="clock" label="Lead time médio" value="3,9 d" sub="-0,4 d" kind="blue" />
        <KPI t={t} icon="alert" label="Atrasadas" value="2" sub="precisa atenção" kind="red" />
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch', marginBottom: 26 }}>
        <Card t={t} style={{ padding: 22, flex: 2, minWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Produtividade mensal</div>
            <Badge t={t} kind="green" dot>+18% no semestre</Badge>
          </div>
          <BarChart t={t} data={meses} />
        </Card>
        <Card t={t} style={{ padding: 22, flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 18 }}>Eficiência por setor</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {setores.map(([nome, pct, tone]) => (
              <div key={nome}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}><span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{nome}</span><span style={{ fontSize: 13, fontWeight: 800, color: uiTone(t, tone).fg }}>{pct}%</span></div>
                <div style={{ height: 7, borderRadius: 6, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: uiTone(t, tone).fg }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* orientações */}
      <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 12 }}>Como usar o módulo</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {orientacoes.map((o, i) => (
          <Card t={t} key={i} style={{ padding: 18 }}>
            <span style={{ width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', background: uiTone(t, o.tone).bg, color: uiTone(t, o.tone).fg }}><Icon name={o.icon} size={19} /></span>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text, margin: '12px 0 6px' }}>{o.titulo}</div>
            <div style={{ fontSize: 12.5, color: t.muted, lineHeight: 1.5 }}>{o.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
function theme_dark(t) { return t.panel === '#ffffff' ? '#3b1d6e' : '#1e1140'; }

// ---------- Ordens de Produção (kanban) ----------
function PGOrdens({ t, ordens, setOrdens }) {
  const cols = [['planejada', 'Planejada'], ['producao', 'Em produção'], ['qualidade', 'Qualidade'], ['concluida', 'Concluída']];
  const advance = (id) => setOrdens((xs) => xs.map((o) => (o.id === id ? { ...o, status: PG_STATUS[o.status].next, feito: PG_STATUS[o.status].next === 'concluida' ? o.qtd : o.feito } : o)));
  return (
    <div>
      <PageHeader t={t} title="Ordens de Produção" subtitle="Acompanhe as OPs por etapa do processo."
        actions={<Btn t={t} icon="plus">Nova OP</Btn>} />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length}, minmax(250px, 1fr))`, gap: 16, alignItems: 'start', overflowX: 'auto', paddingBottom: 6 }}>
        {cols.map(([key, label]) => {
          const items = ordens.filter((o) => o.status === key);
          return (
            <div key={key} style={{ background: t.elevated, border: `1px solid ${t.border}`, borderRadius: 16, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px 12px' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: uiTone(t, PG_STATUS[key].kind).fg }} />
                <span style={{ fontSize: 13.5, fontWeight: 800, color: t.text, whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 8, background: t.hover, color: t.muted }}>{items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((o) => { const pct = Math.round((o.feito / o.qtd) * 100); const st = PG_STATUS[o.status]; return (
                  <div key={o.id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 13, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: t.text }}>{o.id}</span>
                      <span style={{ fontSize: 11, color: t.faint }}>{o.prazo}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.text, margin: '8px 0 4px', lineHeight: 1.3 }}>{o.produto}</div>
                    <div style={{ fontSize: 11.5, color: t.muted }}>{o.cliente} · {o.setor}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 0 6px' }}><span style={{ fontSize: 10.5, fontWeight: 700, color: t.faint }}>{o.feito}/{o.qtd} un</span><span style={{ fontSize: 11, fontWeight: 800, color: t.accentText }}>{pct}%</span></div>
                    <div style={{ height: 6, borderRadius: 5, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 5, background: o.status === 'concluida' ? uiTone(t, 'green').fg : t.accent }} /></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.muted }}><span style={{ width: 22, height: 22, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 9 }}>{o.resp.split(' ').map((x) => x[0]).join('')}</span> {o.resp}</span>
                      {st.next && <button onClick={() => advance(o.id)} title={st.act} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: t.accentText, padding: '5px 9px', borderRadius: 8, background: t.accentSoft }}>{st.act} <Icon name="chevronRight" size={13} /></button>}
                    </div>
                  </div>
                ); })}
                {items.length === 0 && <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: t.faint, border: `1px dashed ${t.border}`, borderRadius: 10 }}>Vazio</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Apontamentos ----------
// O montador aponta consumo peça a peça: escolhe a OP, BIPA a etiqueta (Code 128 -> o SKU cai no
// campo), informa a qtd e confirma -> POST /op-materials/consume. Abaixo, o extrato dos
// apontamentos da OP (GET /events?event_type=consumido).
//
// A busca roda sobre o SALDO da OP (GET /balance), não sobre o catálogo /products: só dá pra
// apontar o que a OP realmente recebeu. Bipar um SKU sem saldo aqui responde a verdade ("não tem
// saldo nesta OP") em vez de deixar o operador digitar tudo pra tomar 400 no fim.
//
// FORA desta tela (mock antigo, sem coluna em op_material_events): etapa, tempo/horas, operador
// digitado (vem do JWT), lote, máquina e o "desvio" (apontar p/ OP diferente da destinada).
// Ver PG_GAPS no fim do arquivo.
function PGAponta({ t }) {
  const { items: clientes, loading: cliLoading, error: cliError } = window.useFRClients();
  const [opId, setOpId] = useStatePG('');
  const ops = React.useMemo(() => pgOpsAbertas(clientes), [clientes]);
  const opSel = ops.find((o) => o.id === opId) || null;

  const { items: saldo, loading: balLoading, error: balError, reload: reloadBal } = useFROpBalance(opId);
  const { items: eventos, loading: evLoading, error: evError, reload: reloadEv } = useFROpEvents(opId, 'consumido');

  const [q, setQ] = useStatePG('');
  const [sel, setSel] = useStatePG(null);          // produto escolhido (linha do saldo)
  const [qtd, setQtd] = useStatePG('');
  const [idemKey, setIdemKey] = useStatePG(null);  // âncora gerada ao ESCOLHER a peça (abre o form)
  const [busy, setBusy] = useStatePG(false);
  const [toast, setToast] = useStatePG(null);
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);
  const skuRef = React.useRef(null);
  const qtdRef = React.useRef(null);

  // Foco automático no campo do SKU: o leitor Elgin digita e dá Enter sozinho — se o campo não
  // estiver focado, a bipada se perde. Refoca ao trocar de OP e depois de cada apontamento.
  React.useEffect(() => { if (opId && !sel && skuRef.current) skuRef.current.focus(); }, [opId, sel]);

  const comSaldo = saldo.filter((s) => pgNum(s.saldo) > 0);
  // Bipada/Enter: casa SKU exato primeiro (é o que o scanner entrega); só então tenta nome.
  const buscar = () => {
    const term = q.trim().toLowerCase();
    if (!term) return;
    const hit = comSaldo.find((s) => String(s.sku).toLowerCase() === term)
      || comSaldo.find((s) => String(s.sku).toLowerCase().includes(term) || String(s.name).toLowerCase().includes(term));
    if (!hit) {
      const noCatalogo = saldo.find((s) => String(s.sku).toLowerCase() === term);
      setToast({ kind: 'err', msg: noCatalogo ? `${noCatalogo.sku} está zerado nesta OP — nada a apontar.` : `"${q.trim()}" não tem saldo nesta OP.` });
      setQ('');
      return;
    }
    setSel(hit); setQ(''); setIdemKey(pgGenKey());   // âncora nasce aqui e sobrevive a erro
    setQtd(String(pgNum(hit.saldo)));
    setTimeout(() => qtdRef.current && qtdRef.current.select(), 0);
  };
  const cancelar = () => { setSel(null); setQtd(''); setIdemKey(null); };

  const confirmar = async () => {
    if (busy || !sel) return;
    const n = parseInt(qtd) || 0;
    if (!(n > 0)) { setToast({ kind: 'err', msg: 'Informe uma quantidade maior que zero.' }); return; }
    setBusy(true);
    try {
      await frOpConsume(opId, sel.product_id, n, idemKey);
      setSel(null); setQtd(''); setIdemKey(null);       // só o SUCESSO fecha o form e queima a chave
      reloadBal(); reloadEv();
      setToast({ kind: 'ok', msg: `Apontado: ${n} ${sel.unit || ''} de ${sel.name}.` });
      setTimeout(() => skuRef.current && skuRef.current.focus(), 0);
    } catch (e) {
      // NO ERRO: form aberto e MESMA idemKey (retry idempotente). O 400 do guard traz o saldo real.
      setToast({ kind: 'err', msg: pgErr(e) });
      reloadBal();
    } finally { setBusy(false); }
  };

  const field = { boxSizing: 'border-box', height: 46, borderRadius: 12, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };

  return (
    <div>
      <PageHeader t={t} title="Apontamentos" subtitle="Bipe a etiqueta da peça e aponte o consumo contra a Ordem de Produção." />
      <Card t={t} style={{ padding: 20, marginBottom: 20 }}>
        <PGOpPicker t={t} ops={ops} value={opId} onChange={(v) => { setOpId(v); cancelar(); }} loading={cliLoading} error={cliError} />

        {opId && (
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${t.border}` }}>
            {balError ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{balError}</span>
                <Btn t={t} kind="ghost" icon="refresh" onClick={() => reloadBal()}>Tentar novamente</Btn>
              </div>
            ) : balLoading && !saldo.length ? (
              <div style={{ fontSize: 13.5, color: t.muted }}>Carregando o saldo da OP…</div>
            ) : !sel ? (
              <React.Fragment>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 }}>Bipe ou digite o SKU</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 240, maxWidth: 420, ...field }}>
                    <Icon name="barcode" size={18} style={{ color: t.muted, flexShrink: 0 }} />
                    <input ref={skuRef} value={q} onChange={(e) => setQ(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } }}
                      placeholder="Aguardando a bipada…" autoFocus
                      style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
                  </div>
                  <Btn t={t} icon="search" onClick={buscar}>Buscar</Btn>
                </div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 8 }}>
                  {comSaldo.length ? `${comSaldo.length} material(is) com saldo nesta OP.` : 'Esta OP não tem material com saldo — receba antes, na tela de Recebimento.'}
                </div>
              </React.Fragment>
            ) : (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 }}>Peça</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{sel.name}</div>
                  <div style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>
                    {sel.sku} · disponível na OP: <b style={{ color: t.accentText }}>{pgNum(sel.saldo)} {sel.unit || ''}</b>
                  </div>
                </div>
                <div style={{ width: 130 }}>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 }}>Quantidade</label>
                  <input ref={qtdRef} value={qtd} onChange={(e) => setQtd(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmar(); } }}
                    inputMode="numeric" style={{ ...field, width: '100%', fontWeight: 800 }} />
                </div>
                <Btn t={t} kind="ghost" onClick={cancelar}>Cancelar</Btn>
                <button onClick={confirmar} disabled={busy}
                  style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: busy ? t.elevated : t.accent, color: busy ? t.faint : '#fff' }}>
                  <Icon name={busy ? 'refresh' : 'check'} size={17} style={busy ? { animation: 'fr-spin .7s linear infinite' } : undefined} /> {busy ? 'Apontando…' : 'Apontar consumo'}
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {opId && (
        <React.Fragment>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '4px 2px 12px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: t.faint }}>
              Apontado nesta OP {opSel ? '· OP ' + opSel.op_code : ''}
            </div>
            <Btn t={t} kind="ghost" icon="refresh" onClick={() => { reloadEv(); reloadBal(); }}>Atualizar</Btn>
          </div>
          {evError ? (
            <Card t={t} style={{ padding: 20, textAlign: 'center', color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700 }}>{evError}</Card>
          ) : evLoading && !eventos.length ? (
            <Card t={t} style={{ padding: 30, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando apontamentos…</Card>
          ) : eventos.length === 0 ? (
            <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada apontado ainda" sub="Os consumos desta OP aparecem aqui assim que forem registrados." /></Card>
          ) : (
            <DataTable t={t} columns={[
              { key: 'name', label: 'Material', render: (r) => (<div><div style={{ fontWeight: 700, color: t.text }}>{r.name}</div><div style={{ fontSize: 11, color: t.muted }}>{r.sku}</div></div>) },
              { key: 'qty', label: 'Qtd', align: 'center', render: (r) => <span style={{ fontWeight: 800, color: uiTone(t, 'red').fg }}>-{pgNum(r.qty)} {r.unit || ''}</span> },
              { key: 'user_name', label: 'Operador', render: (r) => r.user_name || '—' },
              { key: 'created_at', label: 'Quando', render: (r) => pgDateTime(r.created_at) },
            ]} rows={eventos} />
          )}
          <div style={{ fontSize: 11.5, color: t.faint, margin: '10px 2px 0' }}>Mostrando os 50 apontamentos mais recentes.</div>
        </React.Fragment>
      )}
      <PGToast t={t} toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ---------- Armazém da Produção ----------
// READ-ONLY nesta peça: a projeção do GET /balance (o que a OP recebeu, consumiu e ainda tem).
// Apontar consumo é na tela de Apontamentos; transferir OP->OP é a peça 4. O antigo PGLoteModal
// ("Apontar uso", com desvio e escolha de máquina) foi REMOVIDO — mexia em state local e era o
// único emissor do evento de browser 'fr-maq-consumo'. Ver PG_GAPS.
function PGArmazem({ t }) {
  const { items: clientes, loading: cliLoading, error: cliError } = window.useFRClients();
  const [opId, setOpId] = useStatePG('');
  const [extrato, setExtrato] = useStatePG(false);
  const ops = React.useMemo(() => pgOpsAbertas(clientes), [clientes]);
  const opSel = ops.find((o) => o.id === opId) || null;
  const { items: saldo, loading, error, reload } = useFROpBalance(opId);
  const { items: eventos, loading: evLoading, reload: reloadEv } = useFROpEvents(extrato ? opId : '', '');

  const tot = (k) => saldo.reduce((a, r) => a + pgNum(r[k]), 0);
  const EV_LABEL = { recebido: ['Recebido', 'green'], consumido: ['Consumido', 'red'], devolvido: ['Devolvido', 'amber'], transferido_in: ['Transf. entrada', 'blue'], transferido_out: ['Transf. saída', 'gray'] };

  return (
    <div>
      <PageHeader t={t} title="Armazém da Produção" subtitle="Material que está com a OP: o que ela recebeu do almoxarifado, o que já foi consumido e o que resta." />
      <Card t={t} style={{ padding: 20, marginBottom: 20 }}>
        <PGOpPicker t={t} ops={ops} value={opId} onChange={(v) => { setOpId(v); setExtrato(false); }} loading={cliLoading} error={cliError} />
      </Card>

      {!opId ? (
        <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Escolha uma OP" sub="Selecione a Ordem de Produção para ver o material que está com ela." /></Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
        </Card>
      ) : loading && !saldo.length ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando o saldo da OP…</Card>
      ) : (
        <React.Fragment>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <KPI t={t} mini icon="box" label="Materiais na OP" value={saldo.length} kind="accent" />
            <KPI t={t} mini icon="download" label="Total recebido" value={tot('recebido')} kind="green" />
            <KPI t={t} mini icon="zap" label="Total consumido" value={tot('consumido')} kind="amber" />
            <KPI t={t} mini icon="clipboard" label="Com saldo" value={saldo.filter((r) => pgNum(r.saldo) > 0).length} kind="blue" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '4px 2px 12px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: t.faint }}>
              Saldo por material {opSel ? '· OP ' + opSel.op_code : ''}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn t={t} kind="ghost" icon="file" onClick={() => { const n = !extrato; setExtrato(n); if (n) setTimeout(() => reloadEv(), 0); }}>{extrato ? 'Ocultar extrato' : 'Ver extrato'}</Btn>
              <Btn t={t} kind="ghost" icon="refresh" onClick={() => { reload(); if (extrato) reloadEv(); }}>Atualizar</Btn>
            </div>
          </div>

          {saldo.length === 0 ? (
            <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada nesta OP" sub="Esta OP ainda não recebeu material. Confirme o recebimento na tela de Recebimento." /></Card>
          ) : (
            <DataTable t={t} columns={[
              { key: 'name', label: 'Material', render: (r) => (<div><div style={{ fontWeight: 700, color: t.text }}>{r.name}</div><div style={{ fontSize: 11, color: t.muted }}>{r.sku}</div></div>) },
              { key: 'recebido', label: 'Recebido', align: 'center', render: (r) => pgNum(r.recebido) },
              { key: 'consumido', label: 'Consumido', align: 'center', render: (r) => pgNum(r.consumido) },
              { key: 'devolvido', label: 'Devolvido', align: 'center', render: (r) => pgNum(r.devolvido) },
              // transferido_in/out somados numa coluna: a peça 4 (transferência OP->OP) ainda não
              // escreve nenhum dos dois, então hoje isto é sempre 0 — fica pronto pro dia que for.
              { key: 'transferido', label: 'Transferido', align: 'center', render: (r) => { const v = pgNum(r.transferido_in) - pgNum(r.transferido_out); return v === 0 ? '—' : (v > 0 ? '+' : '') + v; } },
              { key: 'saldo', label: 'Saldo', align: 'center', render: (r) => { const v = pgNum(r.saldo); return <span style={{ fontWeight: 850, fontSize: 15, color: v > 0 ? t.text : t.faint }}>{v} <span style={{ fontSize: 11, fontWeight: 600, color: t.muted }}>{r.unit || ''}</span></span>; } },
            ]} rows={saldo} />
          )}

          {extrato && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: t.faint, margin: '4px 2px 12px' }}>Extrato do razão da OP</div>
              {evLoading && !eventos.length ? (
                <Card t={t} style={{ padding: 30, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando extrato…</Card>
              ) : eventos.length === 0 ? (
                <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Extrato vazio" sub="Nenhum movimento registrado nesta OP." /></Card>
              ) : (
                <React.Fragment>
                  <DataTable t={t} columns={[
                    { key: 'event_type', label: 'Movimento', render: (r) => { const [lb, k] = EV_LABEL[r.event_type] || [r.event_type, 'gray']; return <Badge t={t} kind={k}>{lb}</Badge>; } },
                    { key: 'name', label: 'Material', render: (r) => (<div><div style={{ fontWeight: 700, color: t.text }}>{r.name}</div><div style={{ fontSize: 11, color: t.muted }}>{r.sku}</div></div>) },
                    { key: 'qty', label: 'Qtd', align: 'center', render: (r) => { const neg = r.event_type === 'consumido' || r.event_type === 'devolvido' || r.event_type === 'transferido_out'; return <span style={{ fontWeight: 800, color: neg ? uiTone(t, 'red').fg : uiTone(t, 'green').fg }}>{neg ? '-' : '+'}{pgNum(r.qty)} {r.unit || ''}</span>; } },
                    { key: 'user_name', label: 'Quem', render: (r) => r.user_name || '—' },
                    { key: 'created_at', label: 'Quando', render: (r) => pgDateTime(r.created_at) },
                  ]} rows={eventos} />
                  <div style={{ fontSize: 11.5, color: t.faint, margin: '10px 2px 0' }}>Mostrando os 50 movimentos mais recentes.</div>
                </React.Fragment>
              )}
            </div>
          )}
        </React.Fragment>
      )}
    </div>
  );
}

function PGModule(props) {
  const t = frTokens(props.theme, PG_ACCENT, PG_ACCENT_T);
  // ordens (PG_ORDENS_SEED) segue SÓ p/ o PGPainel — as 3 telas da peça 2 não recebem seed nenhum:
  // Armazém/Apontamentos/Recebimento buscam do backend por conta própria. Ver PG_GAPS no fim.
  const p = { ...props, t, ordens: PG_ORDENS_SEED };
  if (props.active === 'prod-armazem') return <PGArmazem {...p} />;
  if (props.active === 'prod-montagem') { const Mt = window.PGMontagem; return <Mt {...p} />; }
  if (props.active === 'prod-receb') return <PGRecebimento {...p} />;
  if (props.active === 'prod-aponta') return <PGAponta {...p} />;
  return <PGPainel {...p} />;
}
function renderPageProd(active, props) { return <PGModule active={active} {...props} />; }
window.renderPageProd = renderPageProd;

// PG_GAPS — o que as 3 telas desta peça NÃO fazem, e por quê (entrada das próximas):
//  1. ETAPA/HORAS: o PG_APONTA_SEED encenava etapa (Cablagem/Impressão) + tempo ('3h 20min'). NÃO
//     tem coluna: op_material_events é material, não mão de obra. Apontar hora é outra peça e outra
//     tabela. A tela Apontamentos, apesar do nome, aponta MATERIAL — que é o que o mock já fazia.
//  2. DESVIO (apontar material da OP-A contra a OP-B): era a única regra cara do mock e saiu junto
//     com o PGLoteModal. Hoje o consume amarra no client_service_id escolhido, então NÃO existe
//     desvio — só se consome na OP que recebeu. Quando virar peça, o desenho certo é
//     transferido_out(A) + transferido_in(B) + consumido(B) — a 008 já tem os event_types e o
//     ref_event_id. Modelar como consumido(B) direto faria o saldo de B ficar negativo.
//  3. LOTE: o mock tinha lote (LT-###) como grão. O razão é por (OP, produto) — lote não tem coluna.
//     Se lote importar (validade/rastreio), é coluna nova em op_material_events.
//  4. MÁQUINA + árvore do produto: o PGLoteModal era o ÚNICO emissor do CustomEvent
//     'fr-maq-consumo', que montagem.jsx escuta (drain, ~505-526) pra somar material na BOM da
//     máquina. Com o modal fora, esse listener nunca mais dispara. Os dois lados eram mock (a BOM
//     da Montagem morre no F5), então nada real quebrou — mas a Montagem perdeu sua única fonte de
//     material. op_material_events não tem machine_id: ligar Montagem exige decidir se a máquina é
//     um eixo do consumo (coluna) ou um agregado à parte.
//  5. PAINEL (prod-painel): fora do escopo desta peça — segue no PG_ORDENS_SEED, com 8 KPIs
//     chumbados (34 concluídas, 3,9d lead time, 2 atrasadas, 4 setores, 6 meses).
//  6. PGOrdens (kanban de OP, acima): código morto desde ANTES desta peça — sem rota e sem item de
//     menu. Não removi por estar fora do escopo; quando ligar, a fonte é o GET /clients.
