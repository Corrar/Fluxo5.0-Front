// devolucao.jsx — "Devolução por OP" (produção): assistente guiado + timeline REAL.
// LIGADO ao backend da peça 3 (registro em DUAS ETAPAS): esta tela só REGISTRA o pedido (pendente/
// em trânsito); o crédito de estoque + abate do custo da OP acontece na CONFERÊNCIA (aba Devoluções
// da Conferência). Fonte das OPs: window.useFRClients (GET /clients) — NUNCA o seed FR_OPS_ATIVAS.
// Itens devolvíveis + saldo per-OP: GET /stock/returns/op/:opCode. Timeline: .../op/:opCode/history.
const { useState: useStateD, useMemo: useMemoD, useEffect: useEffectD } = React;

const DEV_STEPS = [['01', 'OP'], ['02', 'Materiais'], ['03', 'Motivo & Condição'], ['04', 'Revisão']];
const DEV_MOTIVOS = [
  { id: 'sobra', label: 'Sobra de produção' },
  { id: 'excesso', label: 'Excesso retirado' },
  { id: 'defeito', label: 'Material com defeito' },
  { id: 'troca', label: 'Troca / substituição' },
];
const DEV_CONDS = [
  { id: 'bom', label: 'Bom estado', kind: 'green' },
  { id: 'avar', label: 'Avariado', kind: 'red' },
];
// Status REAL do pedido de devolução (op_returns_pending.status) → vocabulário da tela.
const DEV_STATUS = {
  pendente:  { label: 'Pendente de conferência', kind: 'amber', icon: 'clock' },
  conferido: { label: 'Conferida', kind: 'green', icon: 'check' },
  rejeitado: { label: 'Rejeitada', kind: 'red', icon: 'ban' },
};

const devMotivoLabel = (id) => (DEV_MOTIVOS.find((m) => m.id === id) || {}).label || '';
const devCondLabel = (id) => (DEV_CONDS.find((c) => c.id === id) || {}).label || '';
// observation enviada ao backend = "Motivo · Condição" (o backend guarda como texto livre).
const devObs = (c) => [devMotivoLabel(c.motivo), devCondLabel(c.cond)].filter(Boolean).join(' · ');
const devErr = (e) => { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; };
const devGenKey = () => (crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const devBRL = (v) => { const f = window.FRAdapters && window.FRAdapters.formatBRL; return f ? f(v) : ('R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })); };
const devDate = (iso) => { if (!iso) return ''; try { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };

// Barra: disponível a devolver (verde) vs. já em conferência (cinza), sobre o saldo WIP da OP.
function DevReturnBar({ t, it }) {
  const saldo = Number(it.saldo) || 0;
  const emDev = Number(it.em_devolucao) || 0;
  const disp = Number(it.available_to_return) || 0;
  const pctDev = saldo ? Math.round((emDev / saldo) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 5, overflow: 'hidden', background: t.hover }}>
        {emDev > 0 && <div style={{ width: pctDev + '%', background: '#94a3b8' }} title="Já em conferência" />}
        <div style={{ width: (100 - pctDev) + '%', background: uiTone(t, 'green').fg }} title="Disponível para devolver" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 7, flexWrap: 'wrap', fontSize: 11.5 }}>
        {emDev > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: t.muted, fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#94a3b8' }} /> Em conferência <b>{emDev} {it.unit}</b></span>}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: uiTone(t, 'green').fg, fontWeight: 700 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: uiTone(t, 'green').fg }} /> Disponível <b>{disp} {it.unit}</b></span>
        <span style={{ color: t.faint }}>saldo da OP: {saldo} {it.unit}</span>
      </div>
    </div>
  );
}

// ── PASSO 1: escolher a OP (das OPs reais do GET /clients) ──────────────────────────────────────
function DevStepOP({ t, opCode, pick, clientes, loading, error, reload }) {
  const [q, setQ] = useStateD('');
  const isConcl = window.frIsOpConcluida || function () { return false; };
  const OPS = [];
  (clientes || []).forEach((c) => (c.ops || []).forEach((o) => { if (o.op_code) OPS.push({ op_code: o.op_code, label: o.n || ('OP ' + o.op_code), cliente: c.nome, status: o.s, concluida: isConcl(o.s), total_cost: o.total_cost }); }));
  const ql = q.trim().toLowerCase();
  const view = ql ? OPS.filter((o) => (o.op_code + ' ' + o.cliente).toLowerCase().includes(ql)) : OPS;

  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: t.text }}>Selecione a Ordem de Produção</h3>
      <p style={{ margin: '0 0 16px', color: t.muted, fontSize: 14 }}>Escolha a OP de onde o material saiu. O saldo devolvível é calculado no próximo passo.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, marginBottom: 16 }}>
        <Icon name="search" size={17} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por OP ou cliente…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14 }} />
      </div>
      {loading && <div style={{ padding: 24, textAlign: 'center', color: t.muted, fontSize: 13 }}>Carregando OPs…</div>}
      {!loading && error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, border: `1px solid ${t.border}`, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Não foi possível carregar as OPs</div><div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{error}</div></div>
          <Btn t={t} icon="refresh" onClick={reload}>Tentar novamente</Btn>
        </div>
      )}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {view.length === 0 && <div style={{ gridColumn: '1/-1', padding: 24, textAlign: 'center', color: t.muted, fontSize: 13, border: `1px dashed ${t.borderStrong}`, borderRadius: 12 }}>Nenhuma OP encontrada.</div>}
          {view.map((o) => {
            const on = opCode === o.op_code;
            return (
              <button key={o.op_code} onClick={() => pick(o.op_code)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 13, padding: 16, borderRadius: 14, border: `1.5px solid ${on ? t.accent : t.border}`, background: on ? t.accentSoft : t.panel }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${on ? t.accent : t.borderStrong}`, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>{on && <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.accent }} />}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: t.text }}>{o.label}</span>
                    <Badge t={t} kind={o.concluida ? 'green' : 'blue'} dot>{o.concluida ? 'Concluída' : 'Aberta'}</Badge>
                  </div>
                  <div style={{ fontSize: 13, color: t.muted, marginTop: 6 }}>{o.cliente}</div>
                  {o.total_cost != null && <div style={{ fontSize: 11.5, color: t.faint, marginTop: 3 }}>Custo da OP: {devBRL(o.total_cost)}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PASSO 2: itens devolvíveis (GET /stock/returns/op/:opCode) ──────────────────────────────────
function DevStepItens({ t, mat, sel, setItem }) {
  if (mat.loading) return <div style={{ padding: 30, textAlign: 'center', color: t.muted, fontSize: 14 }}>Carregando materiais da OP…</div>;
  if (mat.semRastro) {
    return (
      <div style={{ padding: '10px 4px' }}>
        <div style={{ display: 'flex', gap: 14, padding: 18, borderRadius: 14, background: uiTone(t, 'amber').bg, border: `1px solid ${uiTone(t, 'amber').fg}33` }}>
          <span style={{ width: 44, height: 44, borderRadius: 11, background: t.panel, color: uiTone(t, 'amber').fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="alert" size={22} /></span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>OP anterior ao controle por OP</div>
            <div style={{ fontSize: 13.5, color: t.muted, marginTop: 5, lineHeight: 1.5 }}>Esta OP não tem rastro de material por OP, então não dá para devolver por aqui. Use a <b style={{ color: t.text }}>Entrada de Reaproveitamento</b> para dar entrada do material no estoque.</div>
          </div>
        </div>
      </div>
    );
  }
  if (mat.error) return <div style={{ padding: 24, textAlign: 'center', color: uiTone(t, 'red').fg, fontSize: 14, fontWeight: 700 }}>{mat.error}</div>;
  if (!mat.items.length) {
    return <div style={{ padding: '20px 4px' }}><EmptyState t={t} title="Nada disponível para devolução" sub="Esta OP não tem saldo de material devolvível no momento (tudo já foi consumido, devolvido ou está em conferência)." /></div>;
  }
  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: t.text }}>Quais materiais devolver?</h3>
      <p style={{ margin: '0 0 20px', color: t.muted, fontSize: 14 }}>Marque os itens e informe a quantidade (limitada ao disponível na OP).</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mat.items.map((it) => {
          const max = Number(it.available_to_return) || 0;
          const r = sel[it.product_id] || { checked: false, qty: max };
          const clamp = (v) => Math.max(1, Math.min(max, v || 1));
          return (
            <div key={it.product_id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 13, border: `1px solid ${r.checked ? t.accent : t.border}`, background: r.checked ? t.accentSoft : t.panel }}>
              <button onClick={() => setItem(it.product_id, { checked: !r.checked, qty: r.qty || max })} style={{ all: 'unset', cursor: 'pointer', width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', flexShrink: 0, background: r.checked ? t.accent : 'transparent', color: '#fff', border: `1.5px solid ${r.checked ? t.accent : t.borderStrong}` }}>{r.checked && <Icon name="check" size={14} />}</button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 9, color: t.text }}>{it.name} <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: t.muted, fontWeight: 600, marginLeft: 4 }}>{it.sku}</span></div>
                <DevReturnBar t={t} it={it} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, opacity: r.checked ? 1 : 0.4, pointerEvents: r.checked ? 'auto' : 'none' }}>
                <button onClick={() => setItem(it.product_id, { qty: clamp((r.qty || max) - 1) })} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}` }}>–</button>
                <input value={r.qty || max} onChange={(e) => setItem(it.product_id, { qty: clamp(parseInt(e.target.value)) })} style={{ width: 52, height: 34, textAlign: 'center', borderRadius: 8, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={() => setItem(it.product_id, { qty: clamp((r.qty || max) + 1) })} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.accentText, border: `1px solid ${t.border}` }}>+</button>
                <span style={{ width: 26, fontSize: 12, color: t.faint, textAlign: 'center' }}>{it.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PASSO 3: motivo + condição por item (viram a observation) ───────────────────────────────────
function DevStepMotivo({ t, chosen, setItem }) {
  const seg = (cur, opts, onPick, kindFn) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {opts.map((o) => { const on = cur === o.id; const k = kindFn ? kindFn(o) : 'accent'; return (
        <button key={o.id} onClick={() => onPick(o.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: on ? (kindFn ? uiTone(t, k).fg : t.accent) : t.elevated, color: on ? '#fff' : t.muted, border: `1px solid ${on ? 'transparent' : t.border}` }}>
          {kindFn && <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? '#fff' : uiTone(t, k).fg }} />}{o.label}
        </button>
      ); })}
    </div>
  );
  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: t.text }}>Motivo e condição de cada item</h3>
      <p style={{ margin: '0 0 20px', color: t.muted, fontSize: 14 }}>Informe por que está devolvendo e em que estado o material se encontra.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {chosen.map((c) => (
          <div key={c.product_id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={20} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{c.name}</div><span style={{ fontFamily: 'monospace', fontSize: 11.5, color: t.muted }}>{c.sku}</span></div>
              <span style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{c.qty} {c.unit}</span>
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 8 }}>Motivo da devolução {!c.motivo && <span style={{ color: uiTone(t, 'red').fg }}>*</span>}</div>
            {seg(c.motivo, DEV_MOTIVOS, (id) => setItem(c.product_id, { motivo: id }))}
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', margin: '14px 0 8px' }}>Condição do material</div>
            {seg(c.cond, DEV_CONDS, (id) => setItem(c.product_id, { cond: id }), (o) => o.kind)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PASSO 4: revisão ────────────────────────────────────────────────────────────────────────────
function DevStepReview({ t, opCode, chosen, remove, submitErr }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: t.text }}>Revise antes de enviar</h3>
      <p style={{ margin: '0 0 20px', color: t.muted, fontSize: 14 }}>Ao confirmar, a devolução vai ao Almoxarifado Central para conferência. O saldo só é creditado após a conferência.</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        {[['Ordem de Produção', 'OP ' + opCode], ['Destino', 'Almoxarifado Central'], ['Itens', String(chosen.length)]].map(([k, v]) => (
          <div key={k} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', flex: '1 1 160px' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '.04em', color: t.faint, fontWeight: 700 }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4, color: t.text }}>{v}</div>
          </div>
        ))}
      </div>
      <Card t={t} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {chosen.map((c, i) => { const cm = DEV_CONDS.find((x) => x.id === c.cond), mv = DEV_MOTIVOS.find((m) => m.id === c.motivo); return (
            <div key={c.product_id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderBottom: i === chosen.length - 1 ? 'none' : `1px solid ${t.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{c.name}</div><span style={{ fontFamily: 'monospace', fontSize: 11, color: t.muted }}>{c.sku}</span></div>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: t.text, width: 70, textAlign: 'right' }}>{c.qty} {c.unit}</span>
              <span style={{ fontSize: 12.5, color: t.muted, width: 130 }}>{mv ? mv.label : '—'}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, width: 110, fontSize: 12.5, color: t.text }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: uiTone(t, cm ? cm.kind : 'green').fg }} />{cm ? cm.label : '—'}</span>
              <button onClick={() => remove(c.product_id)} title="Remover" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={16} /></button>
            </div>
          ); })}
        </div>
      </Card>
      {submitErr && <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderRadius: 11, fontSize: 13, fontWeight: 700, color: '#fff', background: uiTone(t, 'red').fg }}><Icon name="x" size={16} /> {submitErr}</div>}
    </div>
  );
}

// ── Sucesso ─────────────────────────────────────────────────────────────────────────────────────
function DevSuccess({ t, opCode, count, onNew, onTrack }) {
  const TL = [['send', 'Registrada pelo setor', 'Agora', true], ['clipboard', 'Em conferência no almoxarifado', 'Aguardando almoxarife', false], ['check', 'Conferida e creditada ao estoque', '—', false]];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 10px' }}>
      <div style={{ width: 88, height: 88, borderRadius: '50%', background: uiTone(t, 'green').bg, color: uiTone(t, 'green').fg, display: 'grid', placeItems: 'center', marginBottom: 22, boxShadow: `0 0 0 8px ${uiTone(t, 'green').bg}` }}><Icon name="check" size={48} /></div>
      <h2 style={{ margin: 0, fontSize: 26, fontWeight: 850, color: t.text }}>Devolução registrada!</h2>
      <p style={{ color: t.muted, fontSize: 14.5, marginTop: 8, maxWidth: 480 }}><b style={{ color: t.text }}>{count}</b> {count === 1 ? 'item foi enviado' : 'itens foram enviados'} da OP <span style={{ fontFamily: 'monospace', color: t.text }}>{opCode}</span> ao <b style={{ color: t.text }}>Almoxarifado Central</b>. O saldo da OP só será creditado após a conferência do almoxarife.</p>
      <div style={{ display: 'flex', alignItems: 'flex-start', margin: '28px 0' }}>
        {TL.map(([ic, title, sub, on], i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 150 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', background: on ? uiTone(t, 'green').fg : t.elevated, color: on ? '#fff' : t.faint, border: on ? 'none' : `2px solid ${t.border}` }}><Icon name={ic} size={18} /></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: on ? t.text : t.muted, lineHeight: 1.3 }}>{title}</div>
              <div style={{ fontSize: 11, color: t.faint }}>{sub}</div>
            </div>
            {i < TL.length - 1 && <div style={{ flex: 1, height: 2, background: t.border, marginTop: 19 }} />}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Btn t={t} kind="ghost" icon="clipboard" onClick={onTrack}>Acompanhar esta OP</Btn>
        <Btn t={t} icon="plus" onClick={onNew}>Nova devolução</Btn>
      </div>
    </div>
  );
}

// ── Card da timeline (histórico REAL por OP) ────────────────────────────────────────────────────
function DevHistCard({ t, d }) {
  const st = DEV_STATUS[d.status] || DEV_STATUS.pendente;
  const enviada = Number(d.quantity) || 0;
  const conferida = d.conferred_qty == null ? null : Number(d.conferred_qty);
  const divergiu = conferida != null && conferida < enviada;
  return (
    <Card t={t} style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ width: 38, height: 38, borderRadius: 10, background: uiTone(t, st.kind).bg, color: uiTone(t, st.kind).fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={st.icon} size={19} /></span>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{d.name} <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: t.muted, fontWeight: 600 }}>{d.sku}</span></div>
          <div style={{ fontSize: 11.5, color: t.faint, marginTop: 3 }}>
            {devDate(d.created_at)}{d.requested_by_name ? ' · ' + d.requested_by_name : ''}
            {d.status !== 'pendente' && d.conferred_by_name ? ' · conferido por ' + d.conferred_by_name : ''}
          </div>
          {d.status === 'rejeitado' && d.reject_reason && <div style={{ fontSize: 12, color: uiTone(t, 'red').fg, marginTop: 4 }}>Motivo: {d.reject_reason}</div>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Enviada {enviada} {d.unit}</div>
          {conferida != null && <div style={{ fontSize: 12.5, fontWeight: 700, color: divergiu ? uiTone(t, 'amber').fg : uiTone(t, 'green').fg, marginTop: 2 }}>Conferida {conferida} {d.unit}{divergiu ? ` (−${enviada - conferida})` : ''}</div>}
        </div>
        <Badge t={t} kind={st.kind} dot>{st.label}</Badge>
      </div>
    </Card>
  );
}

function PageDevolucaoOP({ t: tBase, theme }) {
  const t = frTokens(theme, '#2563eb', '#7aa2ff');
  const { items: clientes, loading: cliLoading, error: cliError, reload: cliReload } = window.useFRClients();

  const [view, setView] = useStateD('novo');
  const [step, setStep] = useStateD(0);
  const [opCode, setOpCode] = useStateD(null);
  const [mat, setMat] = useStateD({ loading: false, items: [], semRastro: false, error: null });
  const [sel, setSel] = useStateD({});
  const [sent, setSent] = useStateD(null);
  const [busy, setBusy] = useStateD(false);
  const [submitErr, setSubmitErr] = useStateD(null);
  const [idemKey, setIdemKey] = useStateD(devGenKey());
  const [hist, setHist] = useStateD({ loading: false, rows: [], error: null });

  const loadReturnable = (code) => {
    setMat({ loading: true, items: [], semRastro: false, error: null });
    window.FRApi.get('/stock/returns/op/' + encodeURIComponent(code), { skipLoading: true })
      .then((res) => {
        // Shape do GET: { has_perop_history, items }. A UX decide o vazio pela flag, NÃO por status:
        //   items vazio & has_perop_history=false -> OP legada -> estado "use Reaproveitamento" (semRastro).
        //   items vazio & has_perop_history=true  -> tem rastro, nada disponível -> EmptyState normal.
        const d = (res && res.data) || {};
        const items = Array.isArray(d.items) ? d.items : [];
        const semRastro = items.length === 0 && d.has_perop_history === false;
        setMat({ loading: false, items, semRastro, error: null });
      })
      .catch((e) => {
        const st = e && e.response && e.response.status;
        if (st === 404) { setMat({ loading: false, items: [], semRastro: false, error: 'OP não encontrada no sistema.' }); return; }
        setMat({ loading: false, items: [], semRastro: false, error: devErr(e) });
      });
  };
  const loadHistory = (code) => {
    if (!code) return;
    setHist({ loading: true, rows: [], error: null });
    window.FRApi.get('/stock/returns/op/' + encodeURIComponent(code) + '/history', { skipLoading: true })
      .then((res) => setHist({ loading: false, rows: Array.isArray(res && res.data) ? res.data : [], error: null }))
      .catch((e) => setHist({ loading: false, rows: [], error: devErr(e) }));
  };

  const pickOp = (code) => { setOpCode(code); setSel({}); loadReturnable(code); };

  const chosen = Object.entries(sel).filter(([, v]) => v.checked && v.qty > 0)
    .map(([pid, v]) => ({ ...(mat.items.find((i) => i.product_id === pid) || {}), ...v, product_id: pid }))
    .filter((c) => c.product_id && c.sku != null);
  const setItem = (pid, patch) => setSel((s) => ({ ...s, [pid]: { qty: 1, motivo: '', cond: 'bom', checked: false, ...(s[pid] || {}), ...patch } }));
  const canNext = step === 0 ? !!opCode : step === 1 ? chosen.length > 0 : step === 2 ? chosen.every((c) => c.motivo) : true;

  const reset = () => { setStep(0); setOpCode(null); setSel({}); setSent(null); setSubmitErr(null); setMat({ loading: false, items: [], semRastro: false, error: null }); setIdemKey(devGenKey()); };
  const startNew = () => { reset(); setView('novo'); };
  const trackOp = () => { setView('hist'); loadHistory(opCode); };

  const submit = async () => {
    if (busy) return;
    setBusy(true); setSubmitErr(null);
    try {
      const returns = chosen.map((c) => ({ product_id: c.product_id, quantity: c.qty, observation: devObs(c) }));
      const res = await window.FRApi.post('/stock/returns', { op_code: opCode, returns }, { headers: { 'X-Idempotency-Key': idemKey } });
      const pending = (res && res.data && res.data.pending) || returns;
      setSent({ opCode, count: pending.length });
      loadHistory(opCode);
    } catch (e) {
      setSubmitErr(devErr(e));   // mantém o form + a MESMA idemKey (retry idempotente)
    } finally {
      setBusy(false);
    }
  };

  // ── HISTÓRICO (timeline REAL por OP) ──
  if (view === 'hist') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 850, letterSpacing: '-.02em', color: t.text }}>Acompanhar Devoluções</h1>
            <div style={{ fontSize: 13, color: t.muted, marginTop: 7 }}>{opCode ? <>OP <span style={{ fontFamily: 'monospace', color: t.text }}>{opCode}</span></> : 'Escolha uma OP para ver a timeline'}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {opCode && <Btn t={t} kind="ghost" icon="refresh" onClick={() => loadHistory(opCode)}>Atualizar</Btn>}
            <Btn t={t} icon="plus" onClick={startNew}>Nova devolução</Btn>
          </div>
        </div>
        {!opCode && <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhuma OP selecionada" sub="Registre uma devolução ou volte e escolha uma OP para ver o histórico." /></Card>}
        {opCode && hist.loading && <Card t={t} style={{ padding: 22, textAlign: 'center' }}><div style={{ fontSize: 13, color: t.muted }}>Carregando timeline…</div></Card>}
        {opCode && !hist.loading && hist.error && <Card t={t} style={{ padding: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Não foi possível carregar</div><div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{hist.error}</div></div><Btn t={t} icon="refresh" onClick={() => loadHistory(opCode)}>Tentar novamente</Btn></div></Card>}
        {opCode && !hist.loading && !hist.error && hist.rows.length === 0 && <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Sem devoluções nesta OP" sub="Ainda não há devoluções registradas para esta OP." /></Card>}
        {opCode && !hist.loading && !hist.error && hist.rows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hist.rows.map((d) => <DevHistCard key={d.id} t={t} d={d} />)}
          </div>
        )}
      </div>
    );
  }

  // ── WIZARD ──
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 850, letterSpacing: '-.02em', color: t.text }}>{sent ? 'Devolução Registrada' : 'Nova Devolução'}</h1>
          <div style={{ fontSize: 13, color: t.muted, marginTop: 7 }}>{sent ? 'Aguardando conferência do almoxarifado' : 'Assistente guiado em 4 passos'}</div>
        </div>
        <Btn t={t} kind="ghost" icon="clipboard" onClick={() => { setView('hist'); if (opCode) loadHistory(opCode); }}>Acompanhar</Btn>
      </div>

      {!sent && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
          {DEV_STEPS.map(([k, label], i) => {
            const active = i === step, done = i < step;
            return (
              <React.Fragment key={k}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0, background: active ? t.accent : done ? uiTone(t, 'green').fg : t.elevated, color: active || done ? '#fff' : t.faint, border: active || done ? 'none' : `2px solid ${t.border}` }}>{done ? <Icon name="check" size={18} /> : k}</div>
                  <div style={{ display: window.innerWidth < 720 && !active ? 'none' : 'block' }}><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>PASSO {k}</div><div style={{ fontSize: 13, fontWeight: 700, color: active ? t.text : t.muted }}>{label}</div></div>
                </div>
                {i < DEV_STEPS.length - 1 && <div style={{ flex: 1, height: 2, minWidth: 16, background: done ? uiTone(t, 'green').fg : t.border, margin: '0 12px' }} />}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
        {sent ? (
          <div style={{ padding: 28 }}><DevSuccess t={t} opCode={sent.opCode} count={sent.count} onNew={startNew} onTrack={trackOp} /></div>
        ) : (
          <React.Fragment>
            <div style={{ padding: 24 }}>
              {step === 0 && <DevStepOP t={t} opCode={opCode} pick={pickOp} clientes={clientes} loading={cliLoading} error={cliError} reload={cliReload} />}
              {step === 1 && <DevStepItens t={t} mat={mat} sel={sel} setItem={setItem} />}
              {step === 2 && <DevStepMotivo t={t} chosen={chosen} setItem={setItem} />}
              {step === 3 && <DevStepReview t={t} opCode={opCode} chosen={chosen} remove={(pid) => setItem(pid, { checked: false })} submitErr={submitErr} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 24px', borderTop: `1px solid ${t.border}`, background: t.elevated }}>
              <button onClick={() => setStep((s) => s - 1)} style={{ all: 'unset', cursor: 'pointer', visibility: step === 0 ? 'hidden' : 'visible', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: t.text, padding: '9px 14px', borderRadius: 10, border: `1px solid ${t.border}` }}><Icon name="chevronLeft" size={16} /> Voltar</button>
              <div style={{ fontSize: 13, color: t.muted }}>Passo {step + 1} de {DEV_STEPS.length}</div>
              {step < DEV_STEPS.length - 1
                ? <button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} style={{ all: 'unset', cursor: canNext ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: canNext ? t.accent : t.elevated, color: canNext ? '#fff' : t.faint, boxShadow: canNext ? `0 4px 12px ${frHexToRgba(t.accent, 0.3)}` : 'none' }}>Avançar <Icon name="chevronRight" size={16} /></button>
                : <button onClick={submit} disabled={busy} style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: t.accent, color: '#fff', opacity: busy ? 0.6 : 1, boxShadow: `0 4px 12px ${frHexToRgba(t.accent, 0.3)}` }}><Icon name="send" size={16} /> {busy ? 'Enviando…' : 'Confirmar Devolução'}</button>}
            </div>
          </React.Fragment>
        )}
      </Card>
    </div>
  );
}

window.PageDevolucaoOP = PageDevolucaoOP;
