// producaoger.jsx — "Produção" module: Painel, Ordens de Produção (kanban), Apontamentos.

// ── PARSE NUMÉRICO (lote V) ──────────────────────────────────────────────────────────────────
// Alias locais para os helpers únicos de `window.FRAdapters` (lib/adapters.js), no mesmo padrão de
// fallback do resto da casa: se a lib não carregou, ninguém quebra.
//   frSanQtd  mantém dígitos + separador enquanto o operador digita ("2," é intermediário legítimo)
//   frNumQtd  string -> número, vírgula OU ponto; recusa dois separadores em vez de "consertar"
//   frInt     contagem: TRUNCA a fração, nunca multiplica; piso configurável
const frSanQtd = (v) => (window.FRAdapters && window.FRAdapters.sanitizeQtd
  ? window.FRAdapters.sanitizeQtd(v)
  : String(v === null || v === undefined ? '' : v).replace(/[^0-9.,]/g, ''));
const frNumQtd = (v) => (window.FRAdapters && window.FRAdapters.parseQtd
  ? window.FRAdapters.parseQtd(v)
  : parseFloat(String(v === null || v === undefined ? '' : v).replace(',', '.')));
const frInt = (v, piso) => (window.FRAdapters && window.FRAdapters.parseContagem
  ? window.FRAdapters.parseContagem(v, piso)
  : Math.max(piso === undefined ? 1 : piso, Math.trunc(parseFloat(String(v === null || v === undefined ? '' : v).replace(',', '.')) || 0)));

const { useState: useStatePG } = React;
const PG_ACCENT = '#7c3aed', PG_ACCENT_T = '#a78bfa';

const PG_STATUS = {
  planejada:  { label: 'Planejada', kind: 'gray', next: 'producao', act: 'Iniciar produção' },
  producao:   { label: 'Em produção', kind: 'accent', next: 'qualidade', act: 'Enviar p/ qualidade' },
  qualidade:  { label: 'Qualidade', kind: 'amber', next: 'concluida', act: 'Aprovar & concluir' },
  concluida:  { label: 'Concluída', kind: 'green' },
};
// PG_APONTA_SEED / PG_ARMAZEM_SEED / PG_CONSUMO_SEED REMOVIDOS na peça 2 — Armazém e Apontamentos
// renderizam 100% do backend real (/op-materials). O PG_ARMAZEM_SEED era o "lote por OP" com
// recebido/usado em memória; virou a projeção do GET /balance. O PG_CONSUMO_SEED virou o GET /events.
// O PG_APONTA_SEED (etapa/horas) já era código morto desde sempre: nenhuma tela o renderizava —
// e continua SEM backend (productions_3d não tem etapa/hora; apontar HORA é outra peça, não esta).
// PG_ORDENS_SEED REMOVIDO na peça do Painel (24/07/2026) — era a última ficção do módulo: o
// PGPainel agora deriva as OPs do GET /clients (window.useFRClients) e os KPIs de material do
// GET /op-materials/summary. PG_STATUS (acima) fica: o PGOrdens (kanban morto, ver PG_GAPS 6)
// ainda o referencia.

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
function pgUseGet(path, pick) {
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
        // `pick` existe para o /warehouse, que devolve { ops, total_ops, truncado, limite } em
        // vez de array nu. Sem ele, o comportamento e' EXATAMENTE o de antes.
        setItems(pick ? pick(res && res.data) : (Array.isArray(res && res.data) ? res.data : []));
        setLoading(false);
      })
      .catch(function (e) {
        if (!mounted.current || my !== reqId.current) return;
        setError(pgErr(e)); setLoading(false);
      });
  }, [path, pick]);
  R.useEffect(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);
  // TUDO que este hook busca é PROJEÇÃO DE MOVIMENTO DE ESTOQUE — o saldo por OP, o razão da OP e
  // a fila de recebimento são as três leituras de `op_material_events`, e quem escreve nessa tabela
  // (receive/consume) emite `stock_updated` no mesmo commit. Por isso a assinatura mora AQUI, no
  // fetcher compartilhado, e não em cada consumidor: um lugar, um evento, todos os três frescos.
  // Sem OP escolhida (`path` vazio) o `load` já retorna sem HTTP — evento chega e não custa nada.
  // `load` entra pela ref do hook, não pelas deps: trocar de OP recria a função a cada `path` novo
  // e o handler passa a chamar a versão nova SEM reassinar — o reqId lá em cima segue descartando
  // resposta velha. Assinatura única por hook = uma janela de debounce = 1 GET por evento.
  window.frUseStockReload(load);
  return { items: items, loading: loading, error: error, reload: load };
}

// A fila do Recebimento: 1 linha por (separação, item) ainda não recebido por inteiro.
// GUARD DE CUSTÓDIA POR SETOR (18/08/2026): o backend filtra pelo TOKEN, não por parâmetro — o
// operador comum não manda nada e recebe só o próprio setor. `verTudo` é o toggle "Ver tudo" do
// master (?scope=all); NÃO é segurança — é UX. O backend ignora scope=all pra quem não é
// admin/almoxarife (fail-closed do lado de lá), então mandar true sem ser master não muda nada.
function useFROpPendingReceipts(verTudo) {
  return pgUseGet('/op-materials/pending-receipts' + (verTudo ? '?scope=all' : ''));
}
// UNIDADE NORMALIZADA NA EXIBICAO — o DADO nao muda, so o que se mostra.
// Medido no catalogo ativo: 6 produtos com `unit` em MINUSCULA ("un") entre 11 unidades
// distintas, e o laudo do Confronto achou "UND " COM ESPACO em producao. Sem isto, dois cards
// do mesmo material apareceriam com unidades diferentes e o operador leria como coisas distintas.
// MAIUSCULA e nao minuscula: e' a forma que as telas irmas (Apontamentos, Recebimento) ja usam;
// a minuscula da referencia era estilo do mock.
function pgUnidade(u) { return String(u == null ? '' : u).trim().toUpperCase(); }

// ARMAZEM DA PRODUCAO (lote PG1): TODAS as OPs abertas com material, em UMA requisicao.
// A alternativa era chamar o /balance/:csid por OP — 16 GETs no mount, hoje. Ver o comentario
// grande no PGArmazem. `pick` normaliza a ausencia: erro ou shape inesperado vira lista vazia,
// nunca undefined derrubando a grade.
function useFROpWarehouse() {
  const r = pgUseGet('/op-materials/warehouse', pgPickWarehouse);
  return { data: r.items, loading: r.loading, error: r.error, reload: r.reload };
}
function pgPickWarehouse(d) {
  return { ops: Array.isArray(d && d.ops) ? d.ops : [], total_ops: pgNum(d && d.total_ops), truncado: !!(d && d.truncado), limite: pgNum(d && d.limite) };
}

// A projeção do saldo da OP: 1 linha por produto.
// ⚠ CONTINUA EXISTINDO E INTOCADO: a tela de Apontamentos e a Montagem o consomem.
function useFROpBalance(csid) { return pgUseGet(csid ? '/op-materials/balance/' + csid : ''); }
// O extrato do razão da OP (LIMIT 50 no backend). tipo opcional: 'consumido' | 'recebido' | ...
function useFROpEvents(csid, tipo) { return pgUseGet(csid ? '/op-materials/events/' + csid + (tipo ? '?event_type=' + tipo : '') : ''); }

// Mutações. Devolvem a resposta; quem chama trata erro/toast (padrão das telas já ligadas).
function frOpReceive(separationId, items, idemKey) {
  return window.FRApi.post('/op-materials/receive', { separationId: separationId, items: items }, { headers: { 'X-Idempotency-Key': idemKey } });
}
// machineId é OPCIONAL (Montagem v1, migration 016): ETIQUETA o consumo com a máquina que
// recebeu a peça. Só vai no corpo quando escolhido — o backend trata ausência como NULL, e a
// projeção de saldo da OP não enxerga a etiqueta (é dimensão, não eixo).
function frOpConsume(clientServiceId, productId, qty, idemKey, machineId) {
  const body = { clientServiceId: clientServiceId, productId: productId, qty: qty };
  if (machineId) body.machineId = machineId;
  return window.FRApi.post('/op-materials/consume', body, { headers: { 'X-Idempotency-Key': idemKey } });
}
// pgOpsAbertas sai pro window porque a Montagem (montagem.jsx) precisa da MESMA lista de OPs
// abertas — duplicar o normalizador lá faria as duas telas divergirem no dia que o critério mudar.
Object.assign(window, { useFROpPendingReceipts, useFROpBalance, useFROpEvents, frOpReceive, frOpConsume, pgOpsAbertas, pgErr, pgGenKey, pgDateTime, pgNum, pgUnidade });

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
// "OP aberta" = !frIsOpConcluida(status), o MESMO normalizador que a tela Clientes usa — por
// EXCLUSÃO do que terminou, nunca por igualdade com 'em_andamento'. (Correção 07/08/2026: o
// texto antigo aqui falava em "17 abertas, 16 legado 'pendente'"; esse número nunca conferiu
// com a validação — zero linhas em 'pendente'. A migration 021 fechou o vocabulário do banco
// em em_andamento|concluido. O filtro por exclusão fica: é o que mantém esta tela e a Clientes
// concordando, e o que absorve o vocabulário do 2.0 na carga sem sumir com OP viva.)
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
// LIGADO (24/07/2026): OPs do GET /clients (window.useFRClients — o MESMO normalizador da tela
// Clientes, frIsOpConcluida) + KPIs de material do GET /op-materials/summary.
// FICARAM DE FORA por SEM FONTE (decisão de produto 24/07): "concluídas no mês" (não existe
// concluded_at), lead time (sem timestamps de início/fim), atrasadas (sem coluna de prazo),
// produtividade mensal (sem série histórica) e eficiência por setor (métrica indefinida — a OP
// nem tem setor). "Em produção" como recorte separado de "ativas" também — e agora por um motivo
// mais simples que o alegado antes (o texto citava "16/17 das OPs abertas em legado 'pendente'",
// número que nunca existiu na validação): desde a 021 o vocabulário do banco é em_andamento|
// concluido, então "ativa" e "em produção" seriam literalmente o mesmo recorte. Separar os dois
// exigiria um estado que o sistema não tem — e inventá-lo aqui seria número sem fonte.
function PGPainel({ t, setActive }) {
  const { items: clientes, loading: cliLoading, error: cliError } = window.useFRClients();
  // summary é OBJETO (o pgUseGet é array-only) -> efeito próprio. null = carregando.
  const [sum, setSum] = React.useState(null);
  React.useEffect(() => {
    let on = true;
    window.FRApi.get('/op-materials/summary', { skipLoading: true })
      .then((r) => { if (on) setSum(r.data && typeof r.data === 'object' ? r.data : { erro: 'Resposta inesperada.' }); })
      .catch((e) => { if (on) setSum({ erro: pgErr(e) }); });
    return () => { on = false; };
  }, []);
  const isConcl = window.frIsOpConcluida || function () { return false; };
  const ops = [];
  (clientes || []).forEach((c) => (c.ops || []).forEach((o) => ops.push(o)));
  const ativas = ops.filter((o) => !isConcl(o.s)).length;
  const concluidas = ops.length - ativas;
  // valor honesto: '…' enquanto carrega, '—' se o carregamento falhou (nunca zero-como-dado).
  const vOp = (n) => (cliError ? '—' : cliLoading ? '…' : n);
  const vSum = (k) => (sum === null ? '…' : sum.erro ? '—' : pgNum(sum[k]));
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
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 850, letterSpacing: '-.02em', lineHeight: 1.1 }}>Bom dia 👋</h1>
          <p style={{ margin: '8px 0 18px', fontSize: 14, color: 'rgba(255,255,255,.88)', lineHeight: 1.5 }}>{cliError ? 'Não foi possível carregar as OPs agora.' : cliLoading ? 'Carregando as ordens de produção…' : <>Você tem <b>{ativas} {ativas === 1 ? 'OP ativa' : 'OPs ativas'}</b> e <b>{concluidas} {concluidas === 1 ? 'concluída' : 'concluídas'}</b>.</>}</p>
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

      <PageHeader t={t} title="Indicadores" subtitle="Ordens de produção e material em chão de fábrica — tudo do razão real." />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 26 }}>
        <KPI t={t} icon="kanban" label="OPs ativas" value={vOp(ativas)} sub="em andamento" kind="accent" />
        <KPI t={t} icon="check" label="OPs concluídas" value={vOp(concluidas)} sub="total" kind="green" />
        <KPI t={t} icon="box" label="Material em WIP" value={vSum('wip_unidades')} sub={sum && !sum.erro ? `${pgNum(sum.wip_linhas)} materiais distintos` : 'unidades nas OPs'} kind="blue" />
        <KPI t={t} icon="clipboard" label="Apontamentos" value={vSum('apontamentos_7d')} sub="últimos 7 dias" kind="amber" />
        <KPI t={t} icon="download" label="Recebimentos pendentes" value={vSum('recebimentos_pendentes')} sub="itens na fila" kind="red" />
      </div>
      {(cliError || (sum && sum.erro)) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: uiTone(t, 'amber').bg, color: uiTone(t, 'amber').fg, fontSize: 12.5, fontWeight: 600, marginBottom: 26 }}>
          <Icon name="alert" size={16} style={{ flexShrink: 0 }} />
          <span>{cliError || sum.erro} — os indicadores marcados com "—" não puderam ser carregados.</span>
        </div>
      )}

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
  // ETIQUETA DE MÁQUINA (Montagem v1, migration 016) — OPCIONAL. As máquinas vêm filtradas pela
  // OP escolhida: o backend recusa com 400 máquina de outra OP (guard de integridade da árvore),
  // e a UI não deve deixar o operador chegar lá. O 400 continua sendo a defesa de corrida (a
  // máquina pode mudar entre o load e o submit) — a UI só evita o erro previsível.
  const [maquinas, setMaquinas] = useStatePG([]);
  const [maquinaId, setMaquinaId] = useStatePG('');
  const [busy, setBusy] = useStatePG(false);
  const [toast, setToast] = useStatePG(null);
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);
  const skuRef = React.useRef(null);
  const qtdRef = React.useRef(null);

  // Foco automático no campo do SKU: o leitor Elgin digita e dá Enter sozinho — se o campo não
  // estiver focado, a bipada se perde. Refoca ao trocar de OP e depois de cada apontamento.
  React.useEffect(() => { if (opId && !sel && skuRef.current) skuRef.current.focus(); }, [opId, sel]);

  // Máquinas EM MONTAGEM da OP escolhida. Sem a page_key 'montagem' o GET volta 403 — a tela de
  // apontamento NÃO quebra por isso: cai pra lista vazia e o seletor some (quem aponta pode não
  // ser quem monta; os gates são independentes por decisão).
  React.useEffect(() => {
    setMaquinaId('');
    if (!opId) { setMaquinas([]); return; }
    let vivo = true;
    window.FRApi.get('/assembly-machines?status=andamento', { skipLoading: true })
      .then((r) => { if (vivo) setMaquinas(((r.data && r.data.machines) || []).filter((m) => String(m.client_service_id) === String(opId))); })
      .catch(() => { if (vivo) setMaquinas([]); });
    return () => { vivo = false; };
  }, [opId]);

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
      await frOpConsume(opId, sel.product_id, n, idemKey, maquinaId || null);
      setSel(null); setQtd(''); setIdemKey(null);       // só o SUCESSO fecha o form e queima a chave
      reloadBal(); reloadEv();
      const maq = maquinas.find((x) => x.id === maquinaId);
      setToast({ kind: 'ok', msg: `Apontado: ${n} ${sel.unit || ''} de ${sel.name}${maq ? ` · MAQ-${maq.display_no}` : ''}.` });
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
                  <input ref={qtdRef} value={qtd} onChange={(e) => setQtd(frSanQtd(e.target.value))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmar(); } }}
                    inputMode="numeric" style={{ ...field, width: '100%', fontWeight: 800 }} />
                </div>
                {/* Etiqueta OPCIONAL: só aparece se a OP tiver máquina em montagem. Sem escolha,
                    o consumo é da OP (machine_id NULL) — retrocompatível e válido. */}
                {maquinas.length > 0 && (
                  <div style={{ minWidth: 220 }}>
                    <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 }}>Máquina (opcional)</label>
                    <div style={{ position: 'relative' }}>
                      <select value={maquinaId} onChange={(e) => setMaquinaId(e.target.value)}
                        style={{ ...field, width: '100%', appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>
                        <option value="">Sem máquina (consumo da OP)</option>
                        {maquinas.map((mq) => <option key={mq.id} value={mq.id}>MAQ-{mq.display_no} · {mq.name}</option>)}
                      </select>
                      <Icon name="chevronDown" size={16} style={{ position: 'absolute', right: 11, top: 15, color: t.muted, pointerEvents: 'none' }} />
                    </div>
                  </div>
                )}
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
// READ-ONLY nesta peça: a projeção do razão da OP (o que a OP recebeu, consumiu e ainda tem).
// Apontar consumo é na tela de Apontamentos; transferir OP->OP é a peça 4. O antigo PGLoteModal
// ("Apontar uso", com desvio e escolha de máquina) foi REMOVIDO — mexia em state local e era o
// único emissor do evento de browser 'fr-maq-consumo'. Ver PG_GAPS.
//
// ── LOTE PG1: o <select> saiu, entrou a grade de todas as OPs ────────────────────────────────
// O PGOpPicker mostrava UMA OP por vez e a tela inteira recarregava a cada troca — era o "muito
// confuso" do Bruno. Agora todas as OPs abertas COM MATERIAL aparecem de uma vez, agrupadas, em
// grade de cards.
//
// ⚠ ISSO CUSTA **UMA** REQUISIÇÃO, NÃO UMA POR OP. O caminho ingênuo (manter o /balance/:csid e
// chamá-lo em laço) seriam 16 GETs no mount, hoje — e o lote BW acabou de cortar 89% do payload
// da listagem de produtos. O endpoint agregado GET /op-materials/warehouse faz o MESMO cálculo,
// agrupado por OP além de por produto. Se algum dia esta tela voltar a disparar N requisições, o
// desenho falhou: é o ponto do lote.
//
// O que NÃO entrou, de propósito:
//   · botão "Apontar" no card — a tela segue read-only. O apontamento vive em PGAponta, com fluxo
//     de LEITOR DE CÓDIGO DE BARRAS (bipar, não clicar); misturar os dois desenhos confunde mais
//     que o select que saiu. Se for para entrar, é lote próprio.
//   · o chip "LT-XXX" da referência — não é entidade. É rótulo do mock (ref21 PG_ARMAZEM_SEED);
//     não há tabela nem coluna de lote em migration nenhuma. Ver DIVIDAS.
//   · o "nome do produto" no cabeçalho da OP — client_services.description está VAZIA em 16/16
//     OPs abertas (medido em produção, 19/08/2026). O cabeçalho é código · cliente.
function PGArmazem({ t }) {
  const { data: armazem, loading, error, reload } = useFROpWarehouse();
  const [q, setQ] = useStatePG('');
  const [verTudo, setVerTudo] = useStatePG([]);
  const [extratoDe, setExtratoDe] = useStatePG('');

  const ops = (armazem && armazem.ops) || [];

  // FILTRO EM MEMÓRIA — digitar NÃO dispara requisição. A lista inteira já está na mão desde o
  // mount (é uma resposta só); filtrar no servidor aqui seria um GET por tecla para reduzir um
  // array que já está local.
  const ql = q.trim().toLowerCase();
  const filtradas = !ql ? ops : ops
    .map((o) => {
      const casaOp = String(o.op_code).toLowerCase().includes(ql) || String(o.client_name).toLowerCase().includes(ql);
      // OP que casa mostra TODOS os seus materiais; senão, só os materiais que casam.
      const mats = casaOp ? o.materiais : o.materiais.filter((m) =>
        String(m.name).toLowerCase().includes(ql) || String(m.sku).toLowerCase().includes(ql));
      return mats.length ? { ...o, materiais: mats } : null;
    })
    .filter(Boolean);

  const todos = filtradas.flatMap((o) => o.materiais);
  const somar = (k) => todos.reduce((a, m) => a + pgNum(m[k]), 0);

  return (
    <div>
      <PageHeader t={t} title="Armazém da Produção" subtitle="Material que está com a OP: o que ela recebeu do almoxarifado, o que já foi consumido e o que resta." />

      {error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
        </Card>
      ) : loading && !ops.length ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando o armazém…</Card>
      ) : (
        <React.Fragment>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <KPI t={t} mini icon="kanban" label="OPs com material" value={filtradas.length} kind="accent" />
            <KPI t={t} mini icon="box" label="Materiais" value={todos.length} kind="blue" />
            <KPI t={t} mini icon="download" label="Total recebido" value={somar('recebido')} kind="green" />
            <KPI t={t} mini icon="zap" label="Total consumido" value={somar('consumido')} kind="amber" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <label style={{ flex: 1, minWidth: 260, display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
              <Icon name="search" size={18} />
              <input data-fr="armazem-busca" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar material, SKU, OP ou cliente…"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
            </label>
            <Btn t={t} kind="ghost" icon="refresh" onClick={() => reload()}>Atualizar</Btn>
          </div>

          {/* TRUNCAMENTO DECLARADO: o endpoint tem teto de OPs e diz quando bateu. Uma tela que
              corta em silêncio parece completa sem estar — o aviso é a diferença. */}
          {armazem && armazem.truncado && (
            <Card t={t} style={{ padding: '12px 16px', marginBottom: 16, borderColor: uiTone(t, 'amber').fg }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'amber').fg }}>
                Mostrando {ops.length} de {armazem.total_ops} OPs com material. Use a busca para encontrar uma OP específica.
              </div>
            </Card>
          )}

          {filtradas.length === 0 ? (
            <Card t={t} style={{ padding: 10 }}>
              {ql ? <EmptyState t={t} title="Nada encontrado" sub="Nenhum material ou OP corresponde à busca." />
                  : <EmptyState t={t} title="Nenhuma OP com material" sub="Nenhuma Ordem de Produção aberta recebeu material do almoxarifado. Confirme o recebimento na tela de Recebimento." />}
            </Card>
          ) : filtradas.map((o) => {
            const aberto = verTudo.includes(o.client_service_id);
            const mostrar = aberto ? o.materiais : o.materiais.slice(0, 3);
            return (
              <div key={o.client_service_id} data-fr="armazem-op" style={{ marginBottom: 28 }}>
                {/* CABEÇALHO DA OP: código · cliente. O "nome do produto" da referência não tem
                    fonte (description vazia em 16/16) — espaço morto no layout não entra. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: t.accentText, padding: '4px 10px', borderRadius: 8, background: t.accentSoft }}>OP {o.op_code}</span>
                  {o.client_name ? <span style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{o.client_name}</span> : null}
                  <span style={{ fontSize: 12, color: t.faint }}>· {o.materiais.length} {o.materiais.length === 1 ? 'material' : 'materiais'}</span>
                  <div style={{ flex: 1 }} />
                  <Btn t={t} kind="ghost" icon="file" onClick={() => setExtratoDe(extratoDe === o.client_service_id ? '' : o.client_service_id)}>
                    {extratoDe === o.client_service_id ? 'Ocultar extrato' : 'Ver extrato'}
                  </Btn>
                </div>

                <div data-fr="armazem-grade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {mostrar.map((m) => {
                    const saldo = pgNum(m.saldo);
                    const zerado = saldo === 0;
                    return (
                      <div key={m.product_id} data-fr="armazem-card">
                      <Card t={t} style={{ padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <div data-fr="card-nome" style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{m.name}</div>
                            <div style={{ display: 'flex', gap: 7, marginTop: 6 }}><Badge t={t} kind="gray">{m.sku}</Badge></div>
                          </div>
                          {zerado ? <span data-fr="card-zerado"><Badge t={t} kind="green" dot>Consumido</Badge></span> : null}
                        </div>
                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}>SALDO ATUAL</div>
                          <div data-fr="card-saldo" style={{ fontSize: 26, fontWeight: 850, color: zerado ? t.muted : t.accentText }}>
                            {saldo} <span data-fr="card-un" style={{ fontSize: 13, color: t.muted, fontWeight: 600 }}>{pgUnidade(m.unit)}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: t.faint, marginTop: 8 }}>
                            Recebido {pgNum(m.recebido)} · Consumido {pgNum(m.consumido)}
                            {pgNum(m.devolvido) ? ` · Devolvido ${pgNum(m.devolvido)}` : ''}
                          </div>
                        </div>
                      </Card>
                      </div>
                    );
                  })}
                </div>

                {o.materiais.length > 3 && (
                  <button data-fr="armazem-vertudo" onClick={() => setVerTudo((xs) => (aberto ? xs.filter((x) => x !== o.client_service_id) : [...xs, o.client_service_id]))}
                    style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 12, height: 38, padding: '0 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: t.accentText, background: t.accentSoft }}>
                    <Icon name="chevronDown" size={15} style={aberto ? { transform: 'rotate(180deg)' } : null} />
                    {aberto ? 'Ver menos' : `Ver tudo (${o.materiais.length} materiais)`}
                  </button>
                )}

                {/* O extrato só MONTA quando aberto — e é aí que ele busca. Nenhuma requisição de
                    extrato sai no mount da tela: o lote existe para haver UMA. */}
                {extratoDe === o.client_service_id && <PGExtratoDaOp t={t} csid={o.client_service_id} opCode={o.op_code} />}
              </div>
            );
          })}
        </React.Fragment>
      )}
    </div>
  );
}

// Extrato do razão de UMA OP, sob demanda. Componente separado de propósito: montar/desmontar é o
// que liga e desliga o GET (o hook só busca com `csid` preenchido).
function PGExtratoDaOp({ t, csid, opCode }) {
  const { items: eventos, loading, reload } = useFROpEvents(csid, '');
  const EV_LABEL = { recebido: ['Recebido', 'green'], consumido: ['Consumido', 'red'], devolvido: ['Devolvido', 'amber'], transferido_in: ['Transf. entrada', 'blue'], transferido_out: ['Transf. saída', 'gray'] };
  return (
    <div data-fr="armazem-extrato" style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 2px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: t.faint }}>Extrato do razão · OP {opCode}</div>
        <Btn t={t} kind="ghost" icon="refresh" onClick={() => reload()}>Atualizar</Btn>
      </div>
      {loading && !eventos.length ? (
        <Card t={t} style={{ padding: 30, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando extrato…</Card>
      ) : eventos.length === 0 ? (
        <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Extrato vazio" sub="Nenhum movimento registrado nesta OP." /></Card>
      ) : (
        <React.Fragment>
          <DataTable t={t} columns={[
            { key: 'event_type', label: 'Movimento', render: (r) => { const [lb, k] = EV_LABEL[r.event_type] || [r.event_type, 'gray']; return <Badge t={t} kind={k}>{lb}</Badge>; } },
            { key: 'name', label: 'Material', render: (r) => (<div><div style={{ fontWeight: 700, color: t.text }}>{r.name}</div><div style={{ fontSize: 11, color: t.muted }}>{r.sku}</div></div>) },
            { key: 'qty', label: 'Qtd', align: 'center', render: (r) => { const neg = r.event_type === 'consumido' || r.event_type === 'devolvido' || r.event_type === 'transferido_out'; return <span style={{ fontWeight: 800, color: neg ? uiTone(t, 'red').fg : uiTone(t, 'green').fg }}>{neg ? '-' : '+'}{pgNum(r.qty)} {pgUnidade(r.unit)}</span>; } },
            { key: 'user_name', label: 'Quem', render: (r) => r.user_name || '—' },
            { key: 'created_at', label: 'Quando', render: (r) => pgDateTime(r.created_at) },
          ]} rows={eventos} />
          <div style={{ fontSize: 11.5, color: t.faint, margin: '10px 2px 0' }}>Mostrando os 50 movimentos mais recentes.</div>
        </React.Fragment>
      )}
    </div>
  );
}

function PGModule(props) {
  const t = frTokens(props.theme, PG_ACCENT, PG_ACCENT_T);
  // Nenhuma tela recebe seed: Painel/Armazém/Apontamentos/Recebimento buscam do backend por
  // conta própria. Ver PG_GAPS no fim.
  const p = { ...props, t };
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
//  4. MÁQUINA + árvore do produto: RESOLVIDO em 30/07/2026 (migration 016, caminho B). A ponte de
//     browser morreu de vez — FR_MAQUINAS / __frMaqQueue / CustomEvent 'fr-maq-consumo' não
//     existem mais em lugar nenhum. O elo agora é o BANCO: op_material_events ganhou machine_id
//     (DIMENSÃO, nunca eixo — a projeção de saldo e o advisory lock seguem por OP,produto) e o
//     seletor opcional de máquina desta tela manda machineId no consume. A árvore do produto da
//     Montagem é PROJEÇÃO (SUM de 'consumido' por machine_id), não cadastro.
//  5. PAINEL (prod-painel): LIGADO em 24/07/2026 — OPs do GET /clients + KPIs do GET
//     /op-materials/summary. Os 5 indicadores chumbados sem fonte (concluídas-no-mês, lead time,
//     atrasadas, produtividade mensal, eficiência por setor) SAÍRAM por decisão de produto; cada
//     um volta quando ganhar coluna/série que o sustente (concluded_at, prazo, setor na OP...).
//  6. PGOrdens (kanban de OP, acima): código morto desde ANTES desta peça — sem rota e sem item de
//     menu, e agora sem seed (PG_ORDENS_SEED saiu com o Painel; nenhum caller passa `ordens`).
//     Não removi por estar fora do escopo; quando ligar, a fonte é o GET /clients.
