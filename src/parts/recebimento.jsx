// recebimento.jsx — Produção: o setor confirma o material que a separação entregou.
//
// LIGADO ao backend real: fila do GET /op-materials/pending-receipts, confirmação via
// POST /op-materials/receive (peça 1). Cada linha da fila é um ITEM entregue ainda não recebido
// por inteiro; agrupamos por separação pra virar card. Recebimento PARCIAL é suportado — o teto
// por item é `separation_items.quantity` (o que a separação REALMENTE entregou) e quem valida é o
// backend; o input só facilita.
//
// A store in-memory (useFRSolic / FR_SOLIC_SEED) FOI LARGADA aqui: ela encenava um recebimento
// que não saía do browser e falava um namespace de OP ('73001') incompatível com o do armazém.
// Ela CONTINUA viva pra Solicitações/Conferência — não remover de store.jsx.
//
// FORA desta tela (decisão A + sem coluna): observação por item, "conferido" item a item e a
// divergência enviado-vs-recebido do mock. O backend não tem campo pra nenhum dos três; o que ele
// entende é "recebi N de M", e é isso que a tela coleta. Ver RC_GAPS no fim.
const { useState: useStateRC } = React;

// Agrupa as linhas da fila (1 por item) em cards (1 por separação), preservando a ordem do backend.
function rcAgrupar(rows) {
  const mapa = new Map();
  (rows || []).forEach((r) => {
    if (!mapa.has(r.separation_id)) {
      mapa.set(r.separation_id, {
        separation_id: r.separation_id, op_code: r.op_code, client_service_id: r.client_service_id,
        sector: r.sector, status: r.status, sent_at: r.sent_at, itens: [],
      });
    }
    mapa.get(r.separation_id).itens.push(r);
  });
  return [...mapa.values()];
}

function RCEnvioCard({ t, env, onConfirm, busy }) {
  // qty por item, default = restante (o caso comum é receber tudo que falta).
  const [qtds, setQtds] = useStateRC(() => {
    const o = {}; env.itens.forEach((it) => { o[it.item_id] = String(window.pgNum(it.pendente)); }); return o;
  });
  const set = (id, v) => setQtds((s) => ({ ...s, [id]: v.replace(/[^0-9]/g, '') }));
  const marcados = env.itens.filter((it) => (parseInt(qtds[it.item_id]) || 0) > 0);
  const acima = env.itens.filter((it) => (parseInt(qtds[it.item_id]) || 0) > window.pgNum(it.pendente));
  const podeConfirmar = marcados.length > 0 && acima.length === 0 && !busy;

  return (
    <Card t={t} style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: `1px solid ${t.border}`, flexWrap: 'wrap' }}>
        <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={20} /></span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: t.accentText, padding: '2px 8px', borderRadius: 7, background: t.accentSoft }}>OP {env.op_code}</span>
            {/* 'concluida' = saída manual; 'entregue' = Quadro Gestão. Os dois já debitaram o físico. */}
            <Badge t={t} kind={env.status === 'entregue' ? 'blue' : 'gray'}>{env.status === 'entregue' ? 'Separação entregue' : 'Saída manual'}</Badge>
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>Para <b style={{ color: t.text }}>{env.sector || '—'}</b> · {window.pgDateTime(env.sent_at)}</div>
        </div>
        <Badge t={t} kind="amber" dot>{env.itens.length} item(ns) a receber</Badge>
      </div>

      <div style={{ overflowX: 'auto' }} className="fr-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620, fontSize: 13 }}>
          <thead><tr>{['Material', 'Entregue', 'Já recebido', 'Restante', 'Receber agora'].map((h, k) => (
            <th key={h} style={{ textAlign: k === 0 ? 'left' : 'center', padding: '11px 18px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: t.faint, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {env.itens.map((it, i) => {
              const last = i === env.itens.length - 1;
              const bd = last ? 'none' : `1px solid ${t.border}`;
              const rest = window.pgNum(it.pendente);
              const n = parseInt(qtds[it.item_id]) || 0;
              const estoura = n > rest;
              return (
                <tr key={it.item_id}>
                  <td style={{ padding: '11px 18px', borderBottom: bd }}>
                    <div style={{ fontWeight: 600, color: t.text }}>{it.name}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>{it.sku}</div>
                  </td>
                  <td style={{ padding: '11px 18px', textAlign: 'center', borderBottom: bd, fontWeight: 700, color: t.text, whiteSpace: 'nowrap' }}>{window.pgNum(it.entregue)} <span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{it.unit || ''}</span></td>
                  <td style={{ padding: '11px 18px', textAlign: 'center', borderBottom: bd, color: t.muted }}>{window.pgNum(it.recebido)}</td>
                  <td style={{ padding: '11px 18px', textAlign: 'center', borderBottom: bd, fontWeight: 800, color: t.accentText }}>{rest}</td>
                  <td style={{ padding: '11px 18px', textAlign: 'center', borderBottom: bd }}>
                    <input value={qtds[it.item_id]} onChange={(e) => set(it.item_id, e.target.value)} inputMode="numeric"
                      style={{ width: 72, height: 34, textAlign: 'center', borderRadius: 9, border: `1px solid ${estoura ? uiTone(t, 'red').fg : t.border}`, background: t.elevated, color: t.text, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                    {estoura && <div style={{ fontSize: 10.5, color: uiTone(t, 'red').fg, fontWeight: 700, marginTop: 3 }}>máx. {rest}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '14px 18px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180, fontSize: 12, color: t.muted }}>
          Confirmar credita o material no <b style={{ color: t.text }}>armazém da OP {env.op_code}</b>. Receber menos que o restante é permitido — o resto continua na fila.
        </div>
        <button onClick={() => podeConfirmar && onConfirm(env, marcados.map((it) => ({ itemId: it.item_id, qty: parseInt(qtds[it.item_id]) || 0 })))}
          disabled={!podeConfirmar}
          style={{ all: 'unset', cursor: podeConfirmar ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: podeConfirmar ? t.accent : t.elevated, color: podeConfirmar ? '#fff' : t.faint }}>
          <Icon name={busy ? 'refresh' : 'check'} size={17} style={busy ? { animation: 'fr-spin .7s linear infinite' } : undefined} /> {busy ? 'Confirmando…' : 'Confirmar recebimento'}
        </button>
      </div>
    </Card>
  );
}

function PGRecebimento({ t }) {
  // Sem filtro de setor por ora: o backend não sabe o setor do caller de forma confiável
  // (separations.destination é texto livre, sem allowlist, e não conversa com profiles.sector).
  // A tela mostra a fila inteira; o recorte por setor entra quando o de-para existir. Ver RC_GAPS.
  const { items: rows, loading, error, reload } = window.useFROpPendingReceipts(null);
  const [busyId, setBusyId] = useStateRC(null);
  const [keys, setKeys] = useStateRC({});          // âncora X-Idempotency-Key por separação
  const [toast, setToast] = useStateRC(null);
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4600); return () => clearTimeout(id); }, [toast]);

  const cards = React.useMemo(() => rcAgrupar(rows), [rows]);

  // Chave gerada ao o card APARECER (equivale a "abrir o form"): sobrevive a erro e a re-render,
  // some só quando o recebimento dá certo. Protocolo do reaproveitamento.
  React.useEffect(() => {
    setKeys((prev) => {
      const next = { ...prev };
      let mudou = false;
      cards.forEach((c) => { if (!next[c.separation_id]) { next[c.separation_id] = window.pgGenKey(); mudou = true; } });
      return mudou ? next : prev;
    });
  }, [cards]);

  const confirmar = async (env, itens) => {
    if (busyId) return;
    const key = keys[env.separation_id];
    setBusyId(env.separation_id);
    try {
      await window.frOpReceive(env.separation_id, itens, key);
      const total = itens.reduce((a, i) => a + i.qty, 0);
      setKeys((s) => { const n = { ...s }; delete n[env.separation_id]; return n; });   // só o SUCESSO queima a chave
      reload();
      setToast({ kind: 'ok', msg: `Recebido: ${total} un. creditadas no armazém da OP ${env.op_code}.` });
    } catch (e) {
      // NO ERRO: a chave FICA (retry idempotente). O 400 do teto vem do backend com o número real.
      setToast({ kind: 'err', msg: window.pgErr(e) });
      reload();
    } finally { setBusyId(null); }
  };

  const totalItens = cards.reduce((a, c) => a + c.itens.length, 0);
  const totalPend = rows.reduce((a, r) => a + window.pgNum(r.pendente), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', color: t.text }}>Recebimento</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: t.muted }}>Confirme o material que a separação entregou. O que você confirmar entra no armazém da OP.</p>
        </div>
        <Btn t={t} kind="ghost" icon="refresh" onClick={() => reload()}>Atualizar</Btn>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="box" label="Separações na fila" value={loading && !cards.length ? '—' : cards.length} kind="blue" />
        <KPI t={t} mini icon="clipboard" label="Itens a receber" value={loading && !cards.length ? '—' : totalItens} kind="accent" />
        <KPI t={t} mini icon="download" label="Quantidade pendente" value={loading && !cards.length ? '—' : totalPend} kind="amber" />
      </div>

      {loading && !cards.length ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando a fila de recebimento…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
        </Card>
      ) : cards.length === 0 ? (
        <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada para receber" sub="Nenhuma separação entregue com material pendente de recebimento." /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cards.map((c) => <RCEnvioCard t={t} key={c.separation_id} env={c} busy={busyId === c.separation_id} onConfirm={confirmar} />)}
        </div>
      )}
      <PGToast t={t} toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

window.PGRecebimento = PGRecebimento;

// RC_GAPS — o que esta tela NÃO faz, e por quê:
//  1. DIVERGÊNCIA (enviado vs recebido) e "conferido" item a item: o mock encenava os dois. O
//     backend não tem coluna: o que ele modela é "recebi N de M", e receber menos JÁ É a
//     divergência — o restante fica na fila. Se divergência precisar virar exceção formal
//     (alguém investiga o que sumiu), é status/coluna nova, não input de tela.
//  2. OBSERVAÇÃO por item: decisão A — form enxuto, não coleta.
//  3. FILTRO POR SETOR: o GET aceita ?sector=, mas o backend não sabe o setor do caller —
//     separations.destination é texto livre sem allowlist e não conversa com profiles.sector nem
//     com warehouses.sector (3 vocabulários independentes). A fila vem inteira até existir de-para.
//  4. BACKLOG HISTÓRICO: a fila inclui saída manual com OP (decisão D2 da peça 1), o que traz ~77
//     separações / 276 itens desde 27/02 — material que saiu do almox há meses e já foi consumido
//     no chão de fábrica. Não é bug: é a decisão. O corte (data de virada) é uma linha no backend.
