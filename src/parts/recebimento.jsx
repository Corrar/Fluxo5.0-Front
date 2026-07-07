// recebimento.jsx — Produção: conferência manual de recebimento de material vindo do estoque.
// Lê da store compartilhada: mostra solicitações em-transito (bipadas/enviadas pelo
// almoxarifado) e, ao confirmar, grava o registro de recebimento dentro da solicitação.
const { useState: useStateRC } = React;

function rcInitItens(itens) {
  return itens.map((i) => ({ ...i, recebida: i.recebida != null ? i.recebida : i.enviada, ok: false }));
}

function RCEnvioCard({ t, env, onConfirm }) {
  const [itens, setItens] = useStateRC(() => rcInitItens(env.itens));
  const [obs, setObs] = useStateRC('');
  const recebido = env.status === 'recebido' || env.status === 'divergencia' || env.status === 'concluido';

  const setRec = (idx, val) => setItens((xs) => xs.map((it, i) => (i === idx ? { ...it, recebida: val } : it)));
  const toggleOk = (idx) => setItens((xs) => xs.map((it, i) => (i === idx ? { ...it, ok: !it.ok } : it)));
  const marcarTodos = () => setItens((xs) => xs.map((it) => ({ ...it, ok: true, recebida: it.recebida })));

  const conferidos = itens.filter((i) => i.ok).length;
  const todosOk = conferidos === itens.length;
  const divergentes = itens.filter((i) => i.ok && Number(i.recebida) !== i.enviada).length;
  const pct = Math.round((conferidos / itens.length) * 100);

  const stMap = {
    'em-transito': { label: 'Em trânsito', kind: 'blue', dot: true },
    'conferindo': { label: 'Conferindo', kind: 'amber', dot: true },
    'divergencia': { label: 'Recebido c/ divergência', kind: 'amber', dot: true },
    'recebido': { label: 'Recebido completo', kind: 'green', dot: true },
    'concluido': { label: 'Recebido completo', kind: 'green', dot: true },
  };
  const st = stMap[env.status] || stMap['em-transito'];

  return (
    <Card t={t} style={{ overflow: 'hidden', opacity: recebido ? 0.92 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: `1px solid ${t.border}`, flexWrap: 'wrap' }}>
        <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={20} /></span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: t.text }}>{env.id}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: t.accentText, padding: '2px 8px', borderRadius: 7, background: t.accentSoft }}>{env.op}</span>
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>De <b style={{ color: t.text }}>{env.origem}</b> → {env.setor} · {env.data}</div>
        </div>
        <Badge t={t} kind={st.kind} dot={st.dot}>{st.label}</Badge>
      </div>

      <div style={{ overflowX: 'auto' }} className="fr-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620, fontSize: 13 }}>
          <thead><tr>{['Material', 'Enviado', 'Recebido', 'Conferido'].map((h, k) => (
            <th key={h} style={{ textAlign: k === 0 ? 'left' : 'center', padding: '11px 18px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: t.faint, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {itens.map((it, i) => {
              const rec = Number(it.recebida);
              const diverg = recebido ? (rec !== it.enviada) : (it.ok && rec !== it.enviada);
              const last = i === itens.length - 1;
              const bd = last ? 'none' : `1px solid ${t.border}`;
              return (
                <tr key={it.sku} style={{ background: it.ok ? (diverg ? uiTone(t, 'amber').bg : uiTone(t, 'green').bg) : 'transparent' }}>
                  <td style={{ padding: '11px 18px', borderBottom: bd }}>
                    <div style={{ fontWeight: 600, color: t.text }}>{it.nome}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>{it.sku}</div>
                  </td>
                  <td style={{ padding: '11px 18px', textAlign: 'center', borderBottom: bd, fontWeight: 700, color: t.text, whiteSpace: 'nowrap' }}>{it.enviada} <span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{it.un}</span></td>
                  <td style={{ padding: '11px 18px', textAlign: 'center', borderBottom: bd }}>
                    {recebido
                      ? <span style={{ fontWeight: 800, color: diverg ? uiTone(t, 'amber').fg : t.text }}>{rec} {it.un}</span>
                      : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <input value={it.recebida} onChange={(e) => setRec(i, e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric"
                            style={{ width: 64, height: 34, textAlign: 'center', borderRadius: 9, border: `1px solid ${diverg ? uiTone(t, 'amber').fg : t.border}`, background: t.elevated, color: t.text, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                          <span style={{ fontSize: 11, color: t.muted }}>{it.un}</span>
                        </div>
                      )}
                    {diverg && <div style={{ fontSize: 10.5, color: uiTone(t, 'amber').fg, fontWeight: 700, marginTop: 3 }}>{rec > it.enviada ? '+' : ''}{rec - it.enviada} divergência</div>}
                  </td>
                  <td style={{ padding: '11px 18px', textAlign: 'center', borderBottom: bd }}>
                    {recebido
                      ? <Icon name="check" size={18} style={{ color: uiTone(t, diverg ? 'amber' : 'green').fg }} />
                      : (
                        <button onClick={() => toggleOk(i)} title="Marcar item conferido" style={{ all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 8, display: 'inline-grid', placeItems: 'center', border: `2px solid ${it.ok ? uiTone(t, 'green').fg : t.borderStrong}`, background: it.ok ? uiTone(t, 'green').fg : 'transparent' }}>
                          {it.ok && <Icon name="check" size={15} style={{ color: '#fff' }} />}
                        </button>
                      )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!recebido && (
        <div style={{ padding: '14px 18px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.muted }}>{conferidos}/{itens.length} itens conferidos</span>
              {divergentes > 0 && <Badge t={t} kind="amber" dot>{divergentes} divergência{divergentes > 1 ? 's' : ''}</Badge>}
            </div>
            <div style={{ height: 7, borderRadius: 5, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 5, background: divergentes > 0 ? uiTone(t, 'amber').fg : uiTone(t, 'green').fg, transition: 'width .2s' }} /></div>
          </div>
          {!todosOk && <Btn t={t} kind="ghost" icon="check" onClick={marcarTodos}>Conferir todos</Btn>}
          <Btn t={t} icon="check" disabled={!todosOk} onClick={() => onConfirm(env.id, itens, divergentes > 0)}>Confirmar recebimento</Btn>
        </div>
      )}
      {recebido && (
        <div style={{ padding: '13px 18px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10, color: uiTone(t, divergentes > 0 ? 'amber' : 'green').fg, fontSize: 13, fontWeight: 700 }}>
          <Icon name="check" size={16} /> Conferido e recebido pelo setor {env.setor} · {env.recebidoPor || 'você'}{env.recebidoEm ? ' · ' + env.recebidoEm : ''}
        </div>
      )}
    </Card>
  );
}

function PGRecebimento({ t }) {
  const [solic] = useFRSolic();
  // Solicitações enviadas pelo estoque (em-transito) chegam aqui para conferência;
  // as já recebidas (concluido) ficam no histórico, lidas do registro gravado.
  const envios = solic.filter((s) => (s.status === 'em-transito' || (s.status === 'concluido' && s.recebimento)) && s.tipo !== 'devolucao')
    .map((s) => ({
      id: s.req, sid: s.id, origem: 'Almoxarifado Central', op: s.op, setor: s.setor, armazem: s.armazem,
      solicitante: s.sol, data: (s.envio && s.envio.em) || s.time,
      status: s.status === 'concluido' ? (s.recebimento && s.recebimento.divergencia ? 'divergencia' : 'recebido') : 'em-transito',
      recebidoPor: s.recebimento && s.recebimento.por, recebidoEm: s.recebimento && s.recebimento.em,
      itens: s.itens.map((it) => {
        const r = s.recebimento && s.recebimento.itens && s.recebimento.itens.find((x) => x.sku === it.sku);
        return { sku: it.sku, nome: it.nome, un: it.un || 'un', enviada: it.qtd, recebida: r ? r.recebida : it.qtd };
      }),
    }));

  const confirmar = (sid, itens, temDiverg) => {
    const recItens = itens.map((it) => ({ sku: it.sku, recebida: Number(it.recebida), enviada: it.enviada }));
    FRSolicActions.confirmarRecebimento(sid, (window.USER && window.USER.name) || 'Setor', recItens, temDiverg);
  };

  const pendentes = envios.filter((e) => e.status === 'em-transito');
  const recebidos = envios.filter((e) => e.status === 'recebido' || e.status === 'divergencia');
  const comDiverg = envios.filter((e) => e.status === 'divergencia').length;

  return (
    <div>
      <PageHeader t={t} title="Recebimento" subtitle="Confira manualmente o material que chegou do estoque e marque o que o setor recebeu." />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="box" label="Aguardando conferência" value={pendentes.length} kind="blue" />
        <KPI t={t} mini icon="check" label="Recebidos" value={recebidos.length} kind="green" />
        <KPI t={t} mini icon="alert" label="Com divergência" value={comDiverg} kind="amber" />
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: t.faint, margin: '4px 2px 12px' }}>Aguardando conferência</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        {pendentes.length === 0
          ? <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada para conferir" sub="Não há envios do estoque aguardando recebimento." /></Card>
          : pendentes.map((e) => <RCEnvioCard t={t} key={e.id} env={e} onConfirm={(_id, itens, dv) => confirmar(e.sid, itens, dv)} />)}
      </div>

      {recebidos.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: t.faint, margin: '4px 2px 12px' }}>Recebidos recentemente</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {recebidos.map((e) => <RCEnvioCard t={t} key={e.id} env={e} onConfirm={(_id, itens, dv) => confirmar(e.sid, itens, dv)} />)}
          </div>
        </>
      )}
    </div>
  );
}

window.PGRecebimento = PGRecebimento;
