// devolucao.jsx — "Devolução por OP": 4-step guided wizard + history, per reference design.
const { useState: useStateD } = React;

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
const DEV_OP_STATUS = { 'Finalizado': 'green', 'Em produção': 'blue', 'Protótipo': 'amber' };
const DEV_STATUS = {
  enviada:     { label: 'Enviada', kind: 'blue' },
  conferindo:  { label: 'Em conferência', kind: 'amber' },
  recebida:    { label: 'Recebida', kind: 'green' },
  recusada:    { label: 'Recusada', kind: 'red' },
};
const DEV_OPS = [
  { id: 'OP-2038', produto: 'Bancada Inox 2,4M', cliente: 'Granja São José', setor: 'Montagem', status: 'Finalizado', itens: [
    { code: '8.11.0334', nome: 'TUBO INOX 304 Ø40 X 1,5MM', un: 'M', retirada: 12, devolvida: 0 },
    { code: '5.30.0712', nome: 'TERMINAL TUBULAR 2,5MM² AZUL', un: 'UN', retirada: 40, devolvida: 10 },
    { code: '9.99.0238', nome: 'PARAFUSO SEXTAVADO M8', un: 'UN', retirada: 60, devolvida: 0 },
  ] },
  { id: 'OP-2060', produto: 'Protótipo Gabinete 3D', cliente: 'Denester', setor: 'Produção 3D', status: 'Protótipo', itens: [
    { code: '3.50.0099', nome: 'FILAMENTO PETG PRETO 1,75MM (KG)', un: 'KG', retirada: 4, devolvida: 0 },
    { code: '5.03.0050', nome: 'SUPORTE DE SENSOR 3D', un: 'UN', retirada: 10, devolvida: 4 },
  ] },
  { id: 'OP-2041', produto: 'Painel Elétrico QGBT-12', cliente: 'Mantiqueira', setor: 'Montagem', status: 'Em produção', itens: [
    { code: '4.22.0190', nome: 'DISJUNTOR TRIPOLAR 25A CURVA C', un: 'UN', retirada: 6, devolvida: 0 },
    { code: '5.20.0099', nome: 'CABO FLEXÍVEL 2,5MM', un: 'M', retirada: 80, devolvida: 30 },
  ] },
];
const opSaldo = (op) => op.itens.map((i) => ({ ...i, saldo: i.retirada - i.devolvida })).filter((i) => i.saldo > 0);
const DEV_SEED = [
  { protocolo: 'DV-0471', opId: 'OP-2038', produto: 'Bancada Inox 2,4M', opStatus: 'Finalizado', status: 'conferindo', quando: '10/06/2026, 16:42',
    itens: [{ code: '8.11.0334', nome: 'TUBO INOX 304 Ø40 X 1,5MM', un: 'M', qty: 3, motivo: 'sobra', cond: 'bom' }] },
  { protocolo: 'DV-0469', opId: 'OP-2060', produto: 'Protótipo Gabinete 3D', opStatus: 'Protótipo', status: 'recebida', quando: '09/06/2026, 11:05',
    itens: [{ code: '3.50.0099', nome: 'FILAMENTO PETG PRETO 1,75MM (KG)', un: 'KG', qty: 1, motivo: 'excesso', cond: 'bom' }, { code: '5.30.0712', nome: 'TERMINAL TUBULAR 2,5MM² AZUL', un: 'UN', qty: 10, motivo: 'sobra', cond: 'bom' }] },
  { protocolo: 'DV-0465', opId: 'OP-2041', produto: 'Painel Elétrico QGBT-12', opStatus: 'Em produção', status: 'recusada', quando: '06/06/2026, 09:20',
    itens: [{ code: '4.22.0190', nome: 'DISJUNTOR TRIPOLAR 25A CURVA C', un: 'UN', qty: 2, motivo: 'defeito', cond: 'avar' }] },
];

function DevReturnBar({ t, it }) {
  const pct = it.retirada ? Math.round((it.devolvida / it.retirada) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 5, overflow: 'hidden', background: t.hover }}>
        {it.devolvida > 0 && <div style={{ width: pct + '%', background: '#94a3b8' }} title="Já enviado" />}
        <div style={{ width: (100 - pct) + '%', background: uiTone(t, 'green').fg }} title="Disponível para enviar" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 7, flexWrap: 'wrap', fontSize: 11.5 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: it.devolvida ? t.muted : t.faint, fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#94a3b8' }} /> Já enviado <b>{it.devolvida} {it.un}</b>{it.devolvida > 0 ? ` · ${pct}%` : ''}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: uiTone(t, 'green').fg, fontWeight: 700 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: uiTone(t, 'green').fg }} /> Disponível <b>{it.saldo} {it.un}</b></span>
        <span style={{ color: t.faint }}>de {it.retirada} {it.un} retiradas</span>
      </div>
    </div>
  );
}

const DEV_ARMAZEM = 'Montagem';
function DevStepOP({ t, opId, pick }) {
  const ops = DEV_OPS.filter((o) => o.setor === DEV_ARMAZEM);
  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: t.text }}>Selecione a Ordem de Produção</h3>
      <p style={{ margin: '0 0 20px', color: t.muted, fontSize: 14 }}>Aparecem apenas as OPs com material retirado pelo seu armazém ({DEV_ARMAZEM}).</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {ops.length === 0 && <div style={{ gridColumn: '1/-1', padding: 24, textAlign: 'center', color: t.muted, fontSize: 13, border: `1px dashed ${t.borderStrong}`, borderRadius: 12 }}>Nenhuma OP com material deste armazém.</div>}
        {ops.map((o) => {
          const cs = opSaldo(o).length; const on = opId === o.id;
          return (
            <button key={o.id} onClick={() => pick(o.id)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 13, padding: 16, borderRadius: 14, border: `1.5px solid ${on ? t.accent : t.border}`, background: on ? t.accentSoft : t.panel }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${on ? t.accent : t.borderStrong}`, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>{on && <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.accent }} />}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: t.text }}>{o.id}</span>
                  <Badge t={t} kind={DEV_OP_STATUS[o.status]} dot>{o.status}</Badge>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginTop: 6, color: t.text }}>{o.produto}</div>
                <div style={{ fontSize: 12.5, color: t.muted, marginTop: 3 }}>{o.cliente} · {o.setor}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 850, fontSize: 22, color: uiTone(t, 'green').fg, lineHeight: 1 }}>{cs}</div>
                <div style={{ fontSize: 11, color: t.faint }}>c/ saldo</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DevStepItens({ t, itens, sel, setItem }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: t.text }}>Quais materiais devolver?</h3>
      <p style={{ margin: '0 0 20px', color: t.muted, fontSize: 14 }}>Marque os itens e informe a quantidade (limitada ao saldo disponível).</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {itens.map((it) => {
          const r = sel[it.code] || { checked: false, qty: it.saldo };
          const clamp = (v) => Math.max(1, Math.min(it.saldo, v || 1));
          return (
            <div key={it.code} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 13, border: `1px solid ${r.checked ? t.accent : t.border}`, background: r.checked ? t.accentSoft : t.panel }}>
              <button onClick={() => setItem(it.code, { checked: !r.checked, qty: r.qty || it.saldo })} style={{ all: 'unset', cursor: 'pointer', width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', flexShrink: 0, background: r.checked ? t.accent : 'transparent', color: '#fff', border: `1.5px solid ${r.checked ? t.accent : t.borderStrong}` }}>{r.checked && <Icon name="check" size={14} />}</button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 9, color: t.text }}>{it.nome} <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: t.muted, fontWeight: 600, marginLeft: 4 }}>{it.code}</span></div>
                <DevReturnBar t={t} it={it} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, opacity: r.checked ? 1 : 0.4, pointerEvents: r.checked ? 'auto' : 'none' }}>
                <button onClick={() => setItem(it.code, { qty: clamp((r.qty || it.saldo) - 1) })} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}` }}>–</button>
                <input value={r.qty || it.saldo} onChange={(e) => setItem(it.code, { qty: clamp(parseInt(e.target.value)) })} style={{ width: 52, height: 34, textAlign: 'center', borderRadius: 8, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={() => setItem(it.code, { qty: clamp((r.qty || it.saldo) + 1) })} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.accentText, border: `1px solid ${t.border}` }}>+</button>
                <span style={{ width: 26, fontSize: 12, color: t.faint, textAlign: 'center' }}>{it.un}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
          <div key={c.code} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={20} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{c.nome}</div><span style={{ fontFamily: 'monospace', fontSize: 11.5, color: t.muted }}>{c.code}</span></div>
              <span style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{c.qty} {c.un}</span>
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 8 }}>Motivo da devolução {!c.motivo && <span style={{ color: uiTone(t, 'red').fg }}>*</span>}</div>
            {seg(c.motivo, DEV_MOTIVOS, (id) => setItem(c.code, { motivo: id }))}
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', margin: '14px 0 8px' }}>Condição do material</div>
            {seg(c.cond, DEV_CONDS, (id) => setItem(c.code, { cond: id }), (o) => o.kind)}
          </div>
        ))}
      </div>
    </div>
  );
}

function DevStepReview({ t, op, chosen, remove }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: t.text }}>Revise antes de enviar</h3>
      <p style={{ margin: '0 0 20px', color: t.muted, fontSize: 14 }}>Confira os dados. Ao confirmar, a solicitação vai ao Almoxarifado Central para conferência.</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        {[['Ordem de Produção', op.id], ['Produto', op.produto], ['Destino', 'Almoxarifado Central'], ['Itens', String(chosen.length)]].map(([k, v]) => (
          <div key={k} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', flex: '1 1 160px' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '.04em', color: t.faint, fontWeight: 700 }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4, color: t.text }}>{v}</div>
          </div>
        ))}
      </div>
      <Card t={t} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {chosen.map((c, i) => { const cm = DEV_CONDS.find((x) => x.id === c.cond), mv = DEV_MOTIVOS.find((m) => m.id === c.motivo); return (
            <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderBottom: i === chosen.length - 1 ? 'none' : `1px solid ${t.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{c.nome}</div><span style={{ fontFamily: 'monospace', fontSize: 11, color: t.muted }}>{c.code}</span></div>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: t.text, width: 70, textAlign: 'right' }}>{c.qty} {c.un}</span>
              <span style={{ fontSize: 12.5, color: t.muted, width: 130 }}>{mv ? mv.label : '—'}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, width: 110, fontSize: 12.5, color: t.text }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: uiTone(t, cm ? cm.kind : 'green').fg }} />{cm ? cm.label : '—'}</span>
              <button onClick={() => remove(c.code)} title="Remover" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={16} /></button>
            </div>
          ); })}
        </div>
      </Card>
    </div>
  );
}

function DevSuccess({ t, data, onNew, onTrack }) {
  const TL = [['send', 'Enviada pelo setor', data.quando, true], ['clipboard', 'Em conferência no almoxarifado', 'Aguardando almoxarife', false], ['check', 'Recebida e baixada do estoque', '—', false]];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 10px' }}>
      <div style={{ width: 88, height: 88, borderRadius: '50%', background: uiTone(t, 'green').bg, color: uiTone(t, 'green').fg, display: 'grid', placeItems: 'center', marginBottom: 22, boxShadow: `0 0 0 8px ${uiTone(t, 'green').bg}` }}><Icon name="check" size={48} /></div>
      <h2 style={{ margin: 0, fontSize: 26, fontWeight: 850, color: t.text }}>Solicitação enviada!</h2>
      <p style={{ color: t.muted, fontSize: 14.5, marginTop: 8, maxWidth: 460 }}>Sua devolução foi registrada e encaminhada ao <b style={{ color: t.text }}>Almoxarifado Central</b>. O saldo da OP só será baixado após a conferência do almoxarife.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: t.elevated, border: `1px solid ${t.border}`, borderRadius: 14, padding: '16px 24px', margin: '24px 0 26px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ textAlign: 'left' }}><div style={{ fontSize: 10.5, letterSpacing: '.06em', color: t.faint, fontWeight: 700 }}>PROTOCOLO</div><div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 800, color: uiTone(t, 'green').fg, marginTop: 2 }}>{data.protocolo}</div></div>
        <div style={{ width: 1, alignSelf: 'stretch', background: t.border }} />
        <div style={{ textAlign: 'left', fontSize: 13, lineHeight: 1.7, color: t.muted }}>
          <div>OP <span style={{ fontFamily: 'monospace', color: t.text }}>{data.opId}</span> · {data.produto}</div>
          <div><b style={{ color: t.text }}>{data.itens.length}</b> {data.itens.length === 1 ? 'item' : 'itens'} · {data.quando}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 28 }}>
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
        <Btn t={t} kind="ghost" icon="clipboard" onClick={onTrack}>Acompanhar no histórico</Btn>
        <Btn t={t} icon="plus" onClick={onNew}>Nova devolução</Btn>
      </div>
    </div>
  );
}

function DevCard({ t, d }) {
  const [open, setOpen] = useStateD(false);
  const st = DEV_STATUS[d.status] || DEV_STATUS.enviada;
  return (
    <Card t={t} style={{ overflow: 'hidden', padding: 0 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: 18, padding: '16px 18px' }}>
        <div style={{ flexShrink: 0, width: 120 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 15.5, fontWeight: 800, color: t.text }}>{d.protocolo}</div>
          <div style={{ fontSize: 11, color: t.faint, marginTop: 3 }}>{d.quando}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: t.text }}>{d.opId}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{d.produto}</span>
            <Badge t={t} kind={DEV_OP_STATUS[d.opStatus] || 'gray'} dot>{d.opStatus}</Badge>
          </div>
          <div style={{ fontSize: 12.5, color: t.muted, marginTop: 5 }}>{d.itens.length} {d.itens.length === 1 ? 'item devolvido' : 'itens devolvidos'}</div>
        </div>
        <Badge t={t} kind={st.kind} dot>{st.label}</Badge>
        <Icon name="chevronDown" size={19} style={{ color: t.faint, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${t.border}`, background: t.elevated, padding: '14px 18px' }}>
          {d.itens.map((it, i) => { const cm = DEV_CONDS.find((c) => c.id === it.cond), mv = DEV_MOTIVOS.find((m) => m.id === it.motivo); return (
            <div key={it.code} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 0', borderBottom: i === d.itens.length - 1 ? 'none' : `1px solid ${t.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{it.nome}</div><span style={{ fontFamily: 'monospace', fontSize: 11, color: t.muted }}>{it.code}</span></div>
              <span style={{ fontSize: 13, fontWeight: 800, color: t.text, width: 64, textAlign: 'right' }}>{it.qty} {it.un}</span>
              <span style={{ fontSize: 12, color: t.muted, width: 120 }}>{mv ? mv.label : '—'}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 100, fontSize: 12, color: t.text }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: uiTone(t, cm ? cm.kind : 'green').fg }} />{cm ? cm.label : '—'}</span>
            </div>
          ); })}
        </div>
      )}
    </Card>
  );
}

function PageDevolucaoOP({ t: tBase, theme }) {
  const t = frTokens(theme, '#2563eb', '#7aa2ff');
  const [view, setView] = useStateD('novo');
  const [step, setStep] = useStateD(0);
  const [opId, setOpId] = useStateD(null);
  const [sel, setSel] = useStateD({});
  const [sent, setSent] = useStateD(null);
  const [devs, setDevs] = useStateD(DEV_SEED);
  const [filter, setFilter] = useStateD('todas');

  const op = opId ? DEV_OPS.find((o) => o.id === opId) : null;
  const itens = op ? opSaldo(op) : [];
  const chosen = Object.entries(sel).filter(([, v]) => v.checked && v.qty > 0).map(([code, v]) => ({ ...itens.find((i) => i.code === code), ...v })).filter((c) => c.code);
  const setItem = (code, patch) => setSel((s) => ({ ...s, [code]: { qty: 1, motivo: '', cond: 'bom', checked: false, ...(s[code] || {}), ...patch } }));
  const canNext = step === 0 ? !!opId : step === 1 ? chosen.length > 0 : step === 2 ? chosen.every((c) => c.motivo) : true;
  const reset = () => { setStep(0); setOpId(null); setSel({}); setSent(null); };
  const startNew = () => { reset(); setView('novo'); };
  const confirm = () => {
    const now = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const max = devs.reduce((m, d) => Math.max(m, parseInt((d.protocolo || '').replace(/\D/g, '')) || 0), 471);
    const rec = { protocolo: 'DV-0' + (max + 1), opId: op.id, produto: op.produto, opStatus: op.status, status: 'enviada', quando: now, itens: chosen.map((c) => ({ code: c.code, nome: c.nome, un: c.un, qty: c.qty, motivo: c.motivo, cond: c.cond })) };
    setDevs((d) => [rec, ...d]); setSent(rec);
  };
  const HIST_FILTERS = [['todas', 'Todas'], ['enviada', 'Enviada'], ['conferindo', 'Em conferência'], ['recebida', 'Recebida'], ['recusada', 'Recusada']];
  const counts = devs.reduce((a, d) => { a[d.status] = (a[d.status] || 0) + 1; return a; }, {});
  const list = filter === 'todas' ? devs : devs.filter((d) => d.status === filter);

  if (view === 'hist') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 850, letterSpacing: '-.02em', color: t.text }}>Minhas Devoluções</h1>
            <div style={{ fontSize: 13, color: t.muted, marginTop: 7 }}>Setor: <Badge t={t} kind="gray">Montagem Elétrica</Badge> · {devs.length} solicitações</div>
          </div>
          <Btn t={t} icon="plus" onClick={startNew}>Nova Devolução</Btn>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: t.faint }}><Icon name="box" size={13} /> STATUS:</span>
          {HIST_FILTERS.map(([id, label]) => { const on = filter === id; return (
            <button key={id} onClick={() => setFilter(id)} style={{ all: 'unset', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, padding: '7px 13px', borderRadius: 9, background: on ? t.accent : t.panel, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>{label}{id !== 'todas' && counts[id] ? ` · ${counts[id]}` : ''}</button>
          ); })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.length === 0 && <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhuma devolução" sub="Não há devoluções com este status." /></Card>}
          {list.map((d) => <DevCard key={d.protocolo} t={t} d={d} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 850, letterSpacing: '-.02em', color: t.text }}>{sent ? 'Devolução Registrada' : 'Nova Devolução'}</h1>
          <div style={{ fontSize: 13, color: t.muted, marginTop: 7 }}>Setor: <Badge t={t} kind="gray">Montagem Elétrica</Badge> · {sent ? 'Solicitação enviada ao almoxarifado' : 'Assistente guiado em 4 passos'}</div>
        </div>
        <Btn t={t} kind="ghost" icon="clipboard" onClick={() => setView('hist')}>Minhas devoluções</Btn>
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
          <div style={{ padding: 28 }}><DevSuccess t={t} data={sent} onNew={startNew} onTrack={() => setView('hist')} /></div>
        ) : (
          <React.Fragment>
            <div style={{ padding: 24 }}>
              {step === 0 && <DevStepOP t={t} opId={opId} pick={(id) => { setOpId(id); setSel({}); }} />}
              {step === 1 && <DevStepItens t={t} itens={itens} sel={sel} setItem={setItem} />}
              {step === 2 && <DevStepMotivo t={t} chosen={chosen} setItem={setItem} />}
              {step === 3 && <DevStepReview t={t} op={op} chosen={chosen} remove={(code) => setItem(code, { checked: false })} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 24px', borderTop: `1px solid ${t.border}`, background: t.elevated }}>
              <button onClick={() => setStep((s) => s - 1)} style={{ all: 'unset', cursor: 'pointer', visibility: step === 0 ? 'hidden' : 'visible', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: t.text, padding: '9px 14px', borderRadius: 10, border: `1px solid ${t.border}` }}><Icon name="chevronLeft" size={16} /> Voltar</button>
              <div style={{ fontSize: 13, color: t.muted }}>Passo {step + 1} de {DEV_STEPS.length}</div>
              {step < DEV_STEPS.length - 1
                ? <button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} style={{ all: 'unset', cursor: canNext ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: canNext ? t.accent : t.elevated, color: canNext ? '#fff' : t.faint, boxShadow: canNext ? `0 4px 12px ${frHexToRgba(t.accent, 0.3)}` : 'none' }}>Avançar <Icon name="chevronRight" size={16} /></button>
                : <button onClick={confirm} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: t.accent, color: '#fff', boxShadow: `0 4px 12px ${frHexToRgba(t.accent, 0.3)}` }}><Icon name="send" size={16} /> Confirmar Devolução</button>}
            </div>
          </React.Fragment>
        )}
      </Card>
    </div>
  );
}

window.PageDevolucaoOP = PageDevolucaoOP;
