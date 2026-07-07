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
const PG_APONTA_SEED = [
  { id: 'AP-881', op: 'OP-2041', etapa: 'Cablagem', operador: 'Bruno T.', qtd: 1, tempo: '3h 20min', data: '17/06 · 10:15' },
  { id: 'AP-879', op: 'OP-2052', etapa: 'Impressão', operador: 'Davi M.', qtd: 12, tempo: '5h 40min', data: '17/06 · 09:02' },
  { id: 'AP-877', op: 'OP-2060', etapa: 'Acabamento', operador: 'Rafael S.', qtd: 1, tempo: '1h 10min', data: '16/06 · 16:30' },
  { id: 'AP-874', op: 'OP-2055', etapa: 'Montagem final', operador: 'Ana P.', qtd: 1, tempo: '8h 00min', data: '14/06 · 17:45' },
];
const PG_ARMAZEM_SEED = [
  { id: 'LT-501', sku: '5.20.0099', nome: 'Cabo Flexível 2,5mm', op: 'OP-2041', recebido: 120, usado: 60, un: 'm' },
  { id: 'LT-502', sku: '4.22.0190', nome: 'Disjuntor Tripolar 25A', op: 'OP-2041', recebido: 6, usado: 1, un: 'un' },
  { id: 'LT-503', sku: '8.11.0334', nome: 'Tubo Inox 304 Ø40', op: 'OP-2038', recebido: 24, usado: 0, un: 'm' },
  { id: 'LT-504', sku: '3.00.0101', nome: 'Filamento PLA Azul 1kg', op: 'OP-2052', recebido: 8, usado: 2, un: 'un' },
  { id: 'LT-505', sku: '9.99.0238', nome: 'Parafuso Sextavado M8', op: 'OP-2038', recebido: 200, usado: 0, un: 'un' },
  { id: 'LT-506', sku: '6.30.0012', nome: 'Tinta Epóxi Cinza 3,6L', op: 'OP-2060', recebido: 3, usado: 1, un: 'lt' },
  { id: 'LT-507', sku: '8.11.0334', nome: 'Tubo Inox 304 Ø40', op: 'OP-2055', recebido: 20, usado: 14, un: 'm' },
  { id: 'LT-508', sku: '5.30.0712', nome: 'Terminal Tubular 2,5mm²', op: 'OP-2041', recebido: 200, usado: 40, un: 'un' },
  { id: 'LT-509', sku: '9.99.0238', nome: 'Parafuso Sextavado M8', op: 'OP-2041', recebido: 150, usado: 0, un: 'un' },
];
const PG_CONSUMO_SEED = [
  { id: 'CM-330', lote: 'LT-501', op: 'OP-2041', destino: 'OP-2041', sku: '5.20.0099', nome: 'Cabo Flexível 2,5mm', qtd: 60, un: 'm', operador: 'Bruno T.', data: '17/06 · 10:20', desvio: false },
  { id: 'CM-328', lote: 'LT-504', op: 'OP-2052', destino: 'OP-2052', sku: '3.00.0101', nome: 'Filamento PLA Azul 1kg', qtd: 2, un: 'un', operador: 'Davi M.', data: '17/06 · 09:05', desvio: false },
];

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

// ---------- Apontamentos por OP ----------
function PGAponta({ t, ordens, consumos }) {
  const ops = [...new Set(consumos.map((c) => c.op))];
  const exportar = (op) => {
    const rows = consumos.filter((c) => !op || c.op === op);
    const head = 'OP,Material,SKU,Quantidade,Unidade,Operador,Quando,Apontada para';
    const csv = [head, ...rows.map((c) => [c.op, '"' + c.nome + '"', c.sku, c.qtd, c.un, c.operador, c.data, c.destino || c.op].join(','))].join('\\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = (op ? 'apontamentos-' + op : 'apontamentos-geral') + '.csv'; a.click();
  };
  return (
    <div>
      <PageHeader t={t} title="Apontamentos" subtitle="Materiais apontados por Ordem de Produção — quem apontou e quando."
        actions={<Btn t={t} kind="ghost" icon="download" onClick={() => exportar(null)}>Relatório geral</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="kanban" label="OPs com apontamentos" value={ops.length} kind="accent" />
        <KPI t={t} mini icon="out" label="Total de apontamentos" value={consumos.length} kind="amber" />
        <KPI t={t} mini icon="alert" label="Desvios de OP" value={consumos.filter((c) => c.desvio).length} kind="red" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ops.length === 0 && <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Sem apontamentos" sub="Ainda não há materiais apontados a nenhuma OP." /></Card>}
        {ops.map((op) => {
          const ord = ordens.find((o) => o.id === op) || {};
          const finalizada = ord.status === 'concluida';
          const rows = consumos.filter((c) => c.op === op);
          const totalUn = rows.reduce((a, c) => a + c.qtd, 0);
          return (
            <Card t={t} key={op} style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: `1px solid ${t.border}`, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: t.text, padding: '4px 10px', borderRadius: 8, background: t.accentSoft }}>{op}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{ord.produto || '—'}</div><div style={{ fontSize: 12, color: t.muted }}>{ord.cliente || ''} · {rows.length} apontamentos · {totalUn} un</div></div>
              {finalizada ? <Badge t={t} kind="green" dot>Finalizada</Badge> : <Badge t={t} kind="blue" dot>Em produção</Badge>}
                <button onClick={() => exportar(op)} title="Exportar relatório da OP" style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 13px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: t.accentText, background: t.accentSoft }}><Icon name="download" size={15} /> Relatório</button>
              </div>
              <div style={{ overflowX: 'auto' }} className="fr-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560, fontSize: 13 }}>
                  <thead><tr>{['Material', 'Qtd', 'Operador', 'Quando', 'Apontada p/'].map((h, k) => <th key={h} style={{ textAlign: k === 1 ? 'center' : 'left', padding: '11px 18px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: t.faint, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {rows.map((c, i) => (
                      <tr key={c.id}>
                        <td style={{ padding: '11px 18px', borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.border}` }}><div style={{ fontWeight: 600, color: t.text }}>{c.nome}</div><div style={{ fontSize: 11, color: t.muted }}>{c.sku} · {c.id}</div></td>
                        <td style={{ padding: '11px 18px', textAlign: 'center', fontWeight: 800, color: uiTone(t, 'red').fg, borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.border}` }}>-{c.qtd} {c.un}</td>
                        <td style={{ padding: '11px 18px', color: t.text, borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.border}` }}>{c.operador}</td>
                        <td style={{ padding: '11px 18px', color: t.muted, borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.border}` }}>{c.data}</td>
                        <td style={{ padding: '11px 18px', borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.border}` }}>{c.desvio ? <Badge t={t} kind="amber" dot>{c.destino} (desvio)</Badge> : <Badge t={t} kind="gray">{c.destino || c.op}</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Armazém por OP + apontar uso ----------
function PGLoteModal({ t, lote, ordens, onClose, onSave }) {
  const saldo = lote.recebido - lote.usado;
  const [qtd, setQtd] = useStatePG(String(saldo));
  const [destino, setDestino] = useStatePG(lote.op);
  const [opOpen, setOpOpen] = useStatePG(false);
  const [maquina, setMaquina] = useStatePG('');
  const n = Math.max(0, Math.min(saldo, parseInt(qtd) || 0));
  const desvio = destino !== lote.op;
  const opsList = ordens.filter((o) => o.status !== 'concluida');
  const maquinasOP = (window.FR_MAQUINAS || []).filter((mq) => mq.op === destino);
  React.useEffect(() => { setMaquina(''); }, [destino]);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(480px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'visible' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 16, fontWeight: 850, color: t.text }}>{lote.nome}</div><div style={{ fontSize: 12, color: t.muted }}>{lote.sku} · saldo {saldo} {lote.un}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
            <Icon name="exchange" size={15} style={{ color: t.accentText }} />
            <span style={{ fontSize: 12.5, color: t.muted }}>Material destinado à <b style={{ color: t.text }}>{lote.op}</b></span>
          </div>
          {/* recebido / consumido / saldo */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[['Recebido', lote.recebido, 'blue'], ['Consumido', lote.usado, 'amber'], ['Saldo', saldo, 'green']].map(([l, v, k]) => (
              <div key={l} style={{ flex: 1, padding: '13px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontSize: 22, fontWeight: 850, color: uiTone(t, k).fg, marginTop: 4 }}>{v} <span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{lote.un}</span></div>
              </div>
            ))}
          </div>
          <div style={{ height: 8, borderRadius: 6, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.round((lote.usado / lote.recebido) * 100)}%`, borderRadius: 6, background: t.accent }} /></div>

          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 12 }}>Apontar uso</div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: t.muted, textTransform: 'uppercase', marginBottom: 8 }}>Quantidade usada</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setQtd(String(Math.max(0, n - 1)))} style={{ all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 20, color: t.text, border: `1px solid ${t.border}` }}>–</button>
              <input value={qtd} onChange={(e) => setQtd(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" style={{ width: 90, height: 44, textAlign: 'center', borderRadius: 12, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 20, fontWeight: 850, fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={() => setQtd(String(Math.min(saldo, n + 1)))} style={{ all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 20, color: t.accentText, border: `1px solid ${t.border}` }}>+</button>
              <span style={{ fontSize: 13, color: t.muted }}>{lote.un} · máx {saldo}</span>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: t.muted, textTransform: 'uppercase', marginBottom: 8 }}>Apontar para a OP</label>
            <button onClick={() => setOpOpen((o) => !o)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, border: `1px solid ${opOpen ? t.accent : t.border}`, background: t.elevated }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: t.text }}>{destino} {!desvio && <span style={{ fontSize: 11.5, fontWeight: 600, color: uiTone(t, 'green').fg }}>· destinada</span>}{desvio && <span style={{ fontSize: 11.5, fontWeight: 600, color: uiTone(t, 'amber').fg }}>· desvio</span>}</span>
              <Icon name="chevronDown" size={16} style={{ color: t.muted }} />
            </button>
            {opOpen && <div onClick={() => setOpOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />}
            {opOpen && (
              <div className="fr-scroll" style={{ position: 'absolute', zIndex: 10, top: 'calc(100% + 6px)', left: 0, right: 0, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6, maxHeight: 220, overflowY: 'auto' }}>
                {opsList.map((o) => { const isDest = o.id === lote.op; return (
                  <button key={o.id} onClick={() => { setDestino(o.id); setOpOpen(false); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 9, background: destino === o.id ? t.hover : 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = destino === o.id ? t.hover : 'transparent'; }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: t.accentText }}>{o.id}</span>
                    <span style={{ fontSize: 12.5, color: t.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.produto}</span>
                    {isDest && <Badge t={t} kind="green">destinada</Badge>}
                  </button>
                ); })}
              </div>
            )}
            {desvio && <div style={{ fontSize: 11.5, color: uiTone(t, 'amber').fg, marginTop: 8, fontWeight: 600 }}>⚠ Material será apontado para uma OP diferente da destinada.</div>}
          </div>

          {/* máquina (alimenta a árvore do produto) */}
          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: t.muted, textTransform: 'uppercase', marginBottom: 8 }}>Máquina da OP <span style={{ color: t.faint, textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>· monta a árvore do produto</span></label>
            {maquinasOP.length === 0
              ? <div style={{ fontSize: 12, color: t.faint, padding: '10px 12px', borderRadius: 10, background: t.elevated, border: `1px dashed ${t.border}` }}>Nenhuma máquina cadastrada nesta OP (cadastre em Montagem de Máquinas).</div>
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {maquinasOP.map((mq) => { const on = maquina === mq.id; return (
                    <button key={mq.id} onClick={() => setMaquina(on ? '' : mq.id)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: on ? t.accent : t.elevated, color: on ? t.onAccent : t.text, border: `1px solid ${on ? t.accent : t.border}` }}>
                      <Icon name="settings" size={14} /> {mq.nome} {on && <Icon name="check" size={14} />}
                    </button>
                  ); })}
                </div>}
            {maquina && <div style={{ fontSize: 11.5, color: uiTone(t, 'green').fg, marginTop: 8, fontWeight: 600 }}>✓ Este consumo entra na árvore do produto desta máquina.</div>}
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn t={t} icon="check" onClick={() => n > 0 && onSave(lote, n, destino, desvio, maquina)}>Apontar uso</Btn>
        </div>
      </div>
    </div>
  );
}

function PGArmazem({ t, armazem, setArmazem, ordens, consumos, setConsumos }) {
  const [tab, setTab] = useStatePG('lotes');
  const [lote, setLote] = useStatePG(null);
  const [toast, setToast] = useStatePG(false);
  const [q, setQ] = useStatePG('');
  const [verTudo, setVerTudo] = useStatePG([]);
  const ql = q.trim().toLowerCase();
  const apontar = (lt, qtd, destino, desvio, maquina) => {
    setArmazem((xs) => xs.map((m) => (m.id === lt.id ? { ...m, usado: m.usado + qtd } : m)));
    setConsumos((xs) => [{ id: 'CM-' + (340 + xs.length), lote: lt.id, op: lt.op, destino, sku: lt.sku, nome: lt.nome, qtd, un: lt.un, operador: 'Bruno T.', data: '17/06 · agora', desvio, maquina }, ...xs]);
    if (maquina) { try { window.__frMaqQueue = window.__frMaqQueue || []; window.__frMaqQueue.push({ maquinaId: maquina, sku: lt.sku, nome: lt.nome, qtd, un: lt.un }); window.dispatchEvent(new CustomEvent('fr-maq-consumo', { detail: { maquinaId: maquina, sku: lt.sku, nome: lt.nome, qtd, un: lt.un } })); } catch (e) {} }
    setLote(null); setToast(true); setTimeout(() => setToast(false), 2600);
  };
  const comSaldo = armazem.filter((m) => m.recebido - m.usado > 0).length;
  const filtrado = armazem.filter((m) => !ql || m.nome.toLowerCase().includes(ql) || m.sku.includes(ql) || m.op.toLowerCase().includes(ql));
  const ops = [...new Set(filtrado.map((m) => m.op))];
  return (
    <div style={{ position: 'relative' }}>
      <PageHeader t={t} title="Armazém da Produção" subtitle="Materiais recebidos do almoxarifado, já destinados a uma OP." />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="box" label="Lotes no armazém" value={armazem.length} kind="accent" />
        <KPI t={t} mini icon="kanban" label="OPs com material" value={ops.length} kind="blue" />
        <KPI t={t} mini icon="check" label="Com saldo" value={comSaldo} kind="green" />
        <KPI t={t} mini icon="out" label="Apontamentos" value={consumos.length} kind="amber" />
      </div>
      <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}`, marginBottom: 20 }}>
        {[['lotes', 'Materiais por OP'], ['consumos', 'Apontamentos']].map(([k, label]) => { const on = tab === k; return (
          <button key={k} onClick={() => setTab(k)} style={{ all: 'unset', cursor: 'pointer', height: 36, padding: '0 16px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? '#fff' : t.muted }}>{label}</button>
        ); })}
      </div>

      {tab === 'lotes' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text', marginBottom: 20 }}>
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar material ou OP no armazém…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
        </label>
      )}

      {tab === 'lotes' ? (
        ops.length === 0 ? <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada encontrado" sub="Nenhum material ou OP corresponde à busca." /></Card> : ops.map((op) => {
          const lotes = filtrado.filter((m) => m.op === op);
          const cli = (ordens.find((o) => o.id === op) || {});
          return (
            <div key={op} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: t.text, padding: '4px 10px', borderRadius: 8, background: t.accentSoft }}>{op}</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{cli.produto || '—'}</span>
                {cli.cliente && <span style={{ fontSize: 12, color: t.muted }}>· {cli.cliente}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {(verTudo.includes(op) ? lotes : lotes.slice(0, 3)).map((m) => { const saldo = m.recebido - m.usado; const out = saldo === 0; const finalizada = (ordens.find((o) => o.id === m.op) || {}).status === 'concluida'; return (
                  <Card t={t} key={m.id} hover={!finalizada} style={{ padding: 16, cursor: finalizada ? 'default' : 'pointer', opacity: finalizada ? 0.7 : 1 }}>
                    <div onClick={() => !finalizada && !out && setLote(m)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{m.nome}</div><div style={{ display: 'flex', gap: 7, marginTop: 6 }}><Badge t={t} kind="gray">{m.sku}</Badge><Badge t={t} kind="gray">{m.id}</Badge></div></div>
                        {finalizada ? <Badge t={t} kind="green" dot>OP finalizada</Badge> : out ? <Badge t={t} kind="green" dot>Consumido</Badge> : <Icon name="chevronRight" size={18} style={{ color: t.faint, flexShrink: 0 }} />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
                        <div><div style={{ fontSize: 9.5, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}>SALDO ATUAL</div><div style={{ fontSize: 26, fontWeight: 850, color: (out || finalizada) ? t.muted : t.accentText }}>{saldo} <span style={{ fontSize: 13, color: t.muted, fontWeight: 600 }}>{m.un}</span></div></div>
                        {finalizada ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: t.muted }}><Icon name="lock" size={14} /> Bloqueado</span>
                          : !out && <button onClick={(e) => { e.stopPropagation(); setLote(m); }} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 800, background: t.accent, color: '#fff' }}><Icon name="check" size={15} /> Apontar</button>}
                      </div>
                    </div>
                  </Card>
                ); })}
              </div>
              {lotes.length > 3 && (
                <button onClick={() => setVerTudo((xs) => xs.includes(op) ? xs.filter((x) => x !== op) : [...xs, op])} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 12, height: 38, padding: '0 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: t.accentText, background: t.accentSoft }}>
                  {verTudo.includes(op) ? <React.Fragment><Icon name="chevronDown" size={15} style={{ transform: 'rotate(180deg)' }} /> Ver menos</React.Fragment> : <React.Fragment><Icon name="chevronDown" size={15} /> Ver tudo ({lotes.length} materiais)</React.Fragment>}
                </button>
              )}
            </div>
          );
        })
      ) : (
        <Card t={t} style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }} className="fr-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640, fontSize: 13.5 }}>
              <thead><tr>{['Apontamento', 'Material', 'Destinada', 'Apontada p/', 'Qtd', 'Operador', 'Quando'].map((h, k) => <th key={h} style={{ textAlign: k === 4 ? 'center' : k === 6 ? 'right' : 'left', padding: '13px 18px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: t.faint, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
              <tbody>
                {consumos.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ padding: '12px 18px', fontFamily: 'monospace', fontWeight: 700, color: t.text, borderBottom: i === consumos.length - 1 ? 'none' : `1px solid ${t.border}` }}>{c.id}</td>
                    <td style={{ padding: '12px 18px', color: t.text, borderBottom: i === consumos.length - 1 ? 'none' : `1px solid ${t.border}` }}><div style={{ fontWeight: 600 }}>{c.nome}</div><div style={{ fontSize: 11, color: t.muted }}>{c.sku}</div></td>
                    <td style={{ padding: '12px 18px', borderBottom: i === consumos.length - 1 ? 'none' : `1px solid ${t.border}` }}><Badge t={t} kind="gray">{c.op}</Badge></td>
                    <td style={{ padding: '12px 18px', borderBottom: i === consumos.length - 1 ? 'none' : `1px solid ${t.border}` }}>{c.desvio ? <Badge t={t} kind="amber" dot>{c.destino}</Badge> : <Badge t={t} kind="green" dot>{c.destino}</Badge>}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 800, color: uiTone(t, 'red').fg, borderBottom: i === consumos.length - 1 ? 'none' : `1px solid ${t.border}` }}>-{c.qtd} {c.un}</td>
                    <td style={{ padding: '12px 18px', color: t.muted, borderBottom: i === consumos.length - 1 ? 'none' : `1px solid ${t.border}` }}>{c.operador}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', color: t.muted, borderBottom: i === consumos.length - 1 ? 'none' : `1px solid ${t.border}` }}>{c.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {lote && <PGLoteModal t={t} lote={lote} ordens={ordens} onClose={() => setLote(null)} onSave={apontar} />}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 70, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderRadius: 13, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 10px 30px rgba(0,0,0,.3)' }}><Icon name="check" size={18} /> Uso apontado com sucesso!</div>
      )}
    </div>
  );
}

function PGModule(props) {
  const t = frTokens(props.theme, PG_ACCENT, PG_ACCENT_T);
  const [ordens, setOrdens] = useStatePG(PG_ORDENS_SEED);
  const [aponta, setAponta] = useStatePG(PG_APONTA_SEED);
  const [armazem, setArmazem] = useStatePG(PG_ARMAZEM_SEED);
  const [consumos, setConsumos] = useStatePG(PG_CONSUMO_SEED);
  const p = { ...props, t, ordens, setOrdens, aponta, setAponta, armazem, setArmazem, consumos, setConsumos };
  if (props.active === 'prod-armazem') return <PGArmazem {...p} />;
  if (props.active === 'prod-montagem') { const Mt = window.PGMontagem; return <Mt {...p} />; }
  if (props.active === 'prod-receb') return <PGRecebimento {...p} />;
  if (props.active === 'prod-aponta') return <PGAponta {...p} />;
  return <PGPainel {...p} />;
}
function renderPageProd(active, props) { return <PGModule active={active} {...props} />; }
window.renderPageProd = renderPageProd;
