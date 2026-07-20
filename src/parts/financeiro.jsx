// financeiro.jsx — Módulo Financeiro (SIGAFIN-like, stateful): Contas a Pagar,
// Contas a Receber, Fluxo de Caixa, Bancos & Conciliação, DRE / Centro de Custo.
const { useState: useStateFI } = React;
const FI_ACCENT = '#16a34a', FI_ACCENT_T = '#4ade80';
const fiInit = (n) => (n || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
const fmtFI = (n) => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fiField = (t) => ({ boxSizing: 'border-box', height: 42, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', width: '100%' });
const fiLab = (t) => ({ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 });

const FI_TIT_STATUS = { aberto: ['Em aberto', 'blue'], vence_hoje: ['Vence hoje', 'amber'], atrasado: ['Atrasado', 'red'], pago: ['Pago', 'green'], recebido: ['Recebido', 'green'] };
const FI_AP_SEED = [
  { id: 'AP-3041', forn: 'Aço Brasil Ltda', cat: 'Matéria-prima', cc: 'CC-100', doc: 'NF 004471', valor: 12400, venc: '19/06', status: 'aberto', origem: 'PC-2051' },
  { id: 'AP-3038', forn: 'Polímeros 3D Print', cat: 'Filamentos', cc: 'CC-200', doc: 'NF 008812', valor: 3596, venc: 'Hoje', status: 'vence_hoje', origem: 'PC-2048' },
  { id: 'AP-3033', forn: 'Elétrica Total', cat: 'Elétrica', cc: 'CC-300', doc: 'NF 002210', valor: 4760, venc: '12/06', status: 'atrasado', origem: 'PC-2042' },
  { id: 'AP-3030', forn: 'Energia SA', cat: 'Despesas fixas', cc: 'CC-900', doc: 'Conta luz', valor: 8900, venc: '10/06', status: 'pago', origem: '—' },
  { id: 'AP-3028', forn: 'Tintas Premium SA', cat: 'Acabamento', cc: 'CC-400', doc: 'NF 001190', valor: 2520, venc: '25/06', status: 'aberto', origem: 'PC-2055' },
];
const FI_AR_SEED = [
  { id: 'AR-7120', cliente: 'Granja São José', cc: 'CC-100', doc: 'NF-S 1042', valor: 28500, venc: 'Hoje', status: 'vence_hoje', origem: 'OP-73001' },
  { id: 'AR-7118', cliente: 'Mantiqueira Céu Azul', cc: 'CC-200', doc: 'NF-S 1039', valor: 15200, venc: '21/06', status: 'aberto', origem: 'OP-90101' },
  { id: 'AR-7110', cliente: '3 Amores', cc: 'CC-100', doc: 'NF-S 1031', valor: 9800, venc: '11/06', status: 'atrasado', origem: 'OP-26201' },
  { id: 'AR-7105', cliente: 'Ovos da Nonna', cc: 'CC-400', doc: 'NF-S 1028', valor: 6400, venc: '08/06', status: 'recebido', origem: 'OP-27801' },
  { id: 'AR-7101', cliente: 'Granja Paraíso', cc: 'CC-100', doc: 'NF-S 1024', valor: 18900, venc: '28/06', status: 'aberto', origem: 'OP-00021' },
];
const FI_BANCOS_SEED = [
  { id: 'B-001', banco: 'Banco do Brasil', conta: 'Ag 1234-5 / CC 67890-1', saldo: 184200, naoConc: 2 },
  { id: 'B-002', banco: 'Itaú', conta: 'Ag 0456 / CC 12345-6', saldo: 96400, naoConc: 0 },
  { id: 'B-003', banco: 'Caixa Econômica', conta: 'Ag 3210 / CC 00987-2', saldo: 42800, naoConc: 1 },
  { id: 'CX', banco: 'Caixa interno', conta: 'Dinheiro em espécie', saldo: 5300, naoConc: 0 },
];
const FI_CC = [
  { id: 'CC-100', nome: 'Usinagem', receita: 57200, custo: 31400 },
  { id: 'CC-200', nome: 'Produção 3D', receita: 21800, custo: 12600 },
  { id: 'CC-300', nome: 'Elétrica', receita: 14200, custo: 19600 },
  { id: 'CC-400', nome: 'Acabamento', receita: 9600, custo: 4200 },
  { id: 'CC-900', nome: 'Administrativo', receita: 0, custo: 20400 },
];

function FIModal({ t, title, sub, icon, onClose, children, footer, w = 520 }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: `min(${w}px,96vw)`, maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={icon} size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{title}</div>{sub && <div style={{ fontSize: 12.5, color: t.muted }}>{sub}</div>}</div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}
const FIBtn = ({ t, onClick, disabled, icon, children, flex }) => (
  <button onClick={onClick} disabled={disabled} style={{ all: 'unset', boxSizing: 'border-box', cursor: disabled ? 'not-allowed' : 'pointer', flex, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, padding: '0 22px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: disabled ? t.elevated : t.accent, color: disabled ? t.faint : '#fff', boxShadow: disabled ? 'none' : `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` }}>{icon && <Icon name={icon} size={17} />}{children}</button>
);

// ---------- Painel ----------
function FIPainel({ t, ap, ar, bancos, setActive }) {
  const go = (id) => setActive && setActive(id);
  const dark = t.panel !== '#ffffff';
  const aPagar = ap.filter((x) => x.status !== 'pago').reduce((a, x) => a + x.valor, 0);
  const aReceber = ar.filter((x) => x.status !== 'recebido').reduce((a, x) => a + x.valor, 0);
  const saldoBancos = bancos.reduce((a, b) => a + b.saldo, 0);
  const atrasadosAP = ap.filter((x) => x.status === 'atrasado').length;
  const meses = [{ label: 'Jan', v: 58 }, { label: 'Fev', v: 64, accent: true }, { label: 'Mar', v: 52 }, { label: 'Abr', v: 78, accent: true }, { label: 'Mai', v: 70 }, { label: 'Jun', v: 86, accent: true }];
  return (
    <div>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '30px 32px', marginBottom: 24, background: `linear-gradient(120deg, ${dark ? '#0c3d22' : '#0f5230'} 0%, ${t.accent} 135%)`, color: '#fff' }}>
        <Icon name="dollar" size={180} style={{ position: 'absolute', right: -24, top: -30, opacity: 0.1 }} />
        <div style={{ position: 'relative', maxWidth: 640 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,.18)', marginBottom: 16 }}><Icon name="dollar" size={13} /> Módulo Financeiro</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.75)', letterSpacing: '.04em' }}>SALDO CONSOLIDADO</div>
          <div style={{ fontSize: 38, fontWeight: 850, letterSpacing: '-.02em', margin: '4px 0 8px' }}>{fmtFI(saldoBancos)}</div>
          <p style={{ margin: '0 0 18px', fontSize: 14, color: 'rgba(255,255,255,.88)' }}>A pagar <b>{fmtFI(aPagar)}</b> · A receber <b>{fmtFI(aReceber)}</b></p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => go('fin-pagar')} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: '#fff', color: t.accent, boxShadow: '0 6px 16px rgba(0,0,0,.2)' }}><Icon name="arrowUp" size={16} /> Contas a Pagar</button>
            <button onClick={() => go('fin-receber')} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, background: 'rgba(255,255,255,.16)', color: '#fff' }}><Icon name="arrowDown" size={16} /> Contas a Receber</button>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <KPI t={t} mini icon="arrowUp" label="A pagar" value={fmtFI(aPagar)} kind="red" />
        <KPI t={t} mini icon="arrowDown" label="A receber" value={fmtFI(aReceber)} kind="green" />
        <KPI t={t} mini icon="alert" label="Títulos atrasados" value={atrasadosAP} kind="amber" />
        <KPI t={t} mini icon="wallet" label="Saldo em bancos" value={fmtFI(saldoBancos)} kind="accent" />
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <Card t={t} style={{ padding: 22, flex: 2, minWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Faturamento por mês (R$ mil)</div>
            <Badge t={t} kind="green" dot>+14% no semestre</Badge>
          </div>
          <BarChart t={t} data={meses} />
        </Card>
        <Card t={t} style={{ padding: 22, flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 16 }}>Próximos vencimentos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...ap.filter((x) => x.status !== 'pago')].slice(0, 4).map((x) => (
              <button key={x.id} onClick={() => go('fin-pagar')} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 8px', borderRadius: 10 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: uiTone(t, FI_TIT_STATUS[x.status][1]).bg, color: uiTone(t, FI_TIT_STATUS[x.status][1]).fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="arrowUp" size={14} /></span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.forn}</div><div style={{ fontSize: 11, color: t.muted }}>vence {x.venc}</div></div>
                <span style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{fmtFI(x.valor)}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- Tabela de títulos (Pagar/Receber) ----------
function FITitulos({ t, tipo, titulos, baixar, flash }) {
  const isAP = tipo === 'ap';
  const [filtro, setFiltro] = useStateFI('abertos');
  const [q, setQ] = useStateFI('');
  const [pay, setPay] = useStateFI(null);
  const pagoKey = isAP ? 'pago' : 'recebido';
  const grupos = { abertos: (x) => x.status !== pagoKey, baixados: (x) => x.status === pagoKey, todos: () => true };
  const tabs = [['abertos', isAP ? 'Em aberto' : 'A receber'], ['baixados', isAP ? 'Pagos' : 'Recebidos'], ['todos', 'Todos']];
  const ql = q.trim().toLowerCase();
  const nomeCampo = isAP ? 'forn' : 'cliente';
  const view = titulos.filter((x) => grupos[filtro](x) && (!ql || x[nomeCampo].toLowerCase().includes(ql) || x.id.toLowerCase().includes(ql) || x.doc.toLowerCase().includes(ql)));
  const totalAberto = titulos.filter((x) => x.status !== pagoKey).reduce((a, x) => a + x.valor, 0);
  const cur = titulos.find((x) => x.id === pay);
  return (
    <div>
      <PageHeader t={t} title={isAP ? 'Contas a Pagar' : 'Contas a Receber'} subtitle={isAP ? 'Títulos a pagar a fornecedores e despesas.' : 'Títulos a receber de clientes.'} actions={<Btn t={t} icon="plus">{isAP ? 'Novo título' : 'Nova cobrança'}</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon={isAP ? 'arrowUp' : 'arrowDown'} label={isAP ? 'Total a pagar' : 'Total a receber'} value={fmtFI(totalAberto)} kind={isAP ? 'red' : 'green'} />
        <KPI t={t} mini icon="clock" label="Em aberto" value={titulos.filter((x) => x.status !== pagoKey).length} kind="blue" />
        <KPI t={t} mini icon="alert" label="Atrasados" value={titulos.filter((x) => x.status === 'atrasado').length} kind="amber" />
        <KPI t={t} mini icon="check" label={isAP ? 'Pagos' : 'Recebidos'} value={titulos.filter((x) => x.status === pagoKey).length} kind="green" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tabs.map(([k, label]) => { const on = filtro === k; return <button key={k} onClick={() => setFiltro(k)} style={{ all: 'unset', cursor: 'pointer', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: on ? t.accent : t.panel, color: on ? '#fff' : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>{label}</button>; })}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200, height: 44, padding: '0 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
          <Icon name="search" size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar título, documento ou nome…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 13.5, fontFamily: 'inherit' }} />
        </label>
      </div>
      <Card t={t} style={{ padding: 8 }}>
        {view.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: t.muted, fontSize: 13 }}>Nenhum título.</div>}
        {view.map((x, i) => { const st = FI_TIT_STATUS[x.status]; const c = uiTone(t, st[1]); const baixado = x.status === pagoKey; return (
          <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 14px', borderBottom: i === view.length - 1 ? 'none' : `1px solid ${t.border}`, flexWrap: 'wrap' }}>
            <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 12, flexShrink: 0 }}>{fiInit(x[nomeCampo])}</span>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{x[nomeCampo]}</div>
              <div style={{ fontSize: 11.5, color: t.muted }}>{x.id} · {x.doc} · {x.cc}{x.origem !== '—' ? ' · ' + x.origem : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: t.faint }}>VENCIMENTO</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: t.text }}>{x.venc}</div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 110 }}>
              <div style={{ fontSize: 15.5, fontWeight: 850, color: isAP ? (baixado ? t.muted : t.text) : uiTone(t, 'green').fg }}>{fmtFI(x.valor)}</div>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '4px 10px', borderRadius: 7, background: c.bg, color: c.fg, whiteSpace: 'nowrap' }}>{st[0]}</span>
            {!baixado ? <button onClick={() => setPay(x.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 15px', borderRadius: 10, fontSize: 12.5, fontWeight: 800, background: t.accent, color: '#fff', flexShrink: 0 }}><Icon name="check" size={15} /> {isAP ? 'Pagar' : 'Receber'}</button>
              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: uiTone(t, 'green').fg, flexShrink: 0 }}><Icon name="check" size={15} /> Baixado</span>}
          </div>
        ); })}
      </Card>
      {cur && (
        <FIModal t={t} title={isAP ? 'Baixar pagamento' : 'Baixar recebimento'} sub={`${cur.id} · ${cur[nomeCampo]}`} icon={isAP ? 'arrowUp' : 'arrowDown'} onClose={() => setPay(null)}
          footer={<><Btn t={t} kind="ghost" onClick={() => setPay(null)}>Cancelar</Btn><FIBtn t={t} icon="check" onClick={() => { baixar(cur.id); setPay(null); flash(isAP ? 'Pagamento baixado · ' + cur.id : 'Recebimento baixado · ' + cur.id); }}>{isAP ? 'Confirmar pagamento' : 'Confirmar recebimento'}</FIBtn></>}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: 14, background: t.accentSoft, marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: t.accentText }}>Valor do título</span>
            <span style={{ fontSize: 22, fontWeight: 850, color: t.text }}>{fmtFI(cur.valor)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={fiLab(t)}>{isAP ? 'Documento' : 'Documento'}</label><input defaultValue={cur.doc} style={fiField(t)} /></div>
            <div><label style={fiLab(t)}>Vencimento</label><input defaultValue={cur.venc} style={fiField(t)} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={fiLab(t)}>Conta {isAP ? 'de saída' : 'de entrada'}</label><div style={{ position: 'relative' }}><select style={{ ...fiField(t), appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>{FI_BANCOS_SEED.map((b) => <option key={b.id}>{b.banco} — {fmtFI(b.saldo)}</option>)}</select><Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 13, color: t.muted, pointerEvents: 'none' }} /></div></div>
          </div>
        </FIModal>
      )}
    </div>
  );
}

// ---------- Fluxo de Caixa ----------
function FIFluxo({ t, ap, ar, bancos }) {
  const saldoIni = bancos.reduce((a, b) => a + b.saldo, 0);
  const dias = [
    { d: 'Hoje', ent: ar.filter((x) => x.venc === 'Hoje' && x.status !== 'recebido').reduce((a, x) => a + x.valor, 0), sai: ap.filter((x) => x.venc === 'Hoje' && x.status !== 'pago').reduce((a, x) => a + x.valor, 0) },
    { d: '19/06', ent: 0, sai: 12400 },
    { d: '21/06', ent: 15200, sai: 0 },
    { d: '25/06', ent: 0, sai: 2520 },
    { d: '28/06', ent: 18900, sai: 0 },
  ];
  let saldo = saldoIni;
  const linhas = dias.map((x) => { saldo = saldo + x.ent - x.sai; return { ...x, saldo }; });
  const proj = linhas[linhas.length - 1].saldo;
  return (
    <div>
      <PageHeader t={t} title="Fluxo de Caixa" subtitle="Projeção de entradas e saídas por vencimento." actions={<Btn t={t} kind="ghost" icon="download">Exportar</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <KPI t={t} mini icon="wallet" label="Saldo atual" value={fmtFI(saldoIni)} kind="accent" />
        <KPI t={t} mini icon="arrowDown" label="Entradas previstas" value={fmtFI(dias.reduce((a, x) => a + x.ent, 0))} kind="green" />
        <KPI t={t} mini icon="arrowUp" label="Saídas previstas" value={fmtFI(dias.reduce((a, x) => a + x.sai, 0))} kind="red" />
        <KPI t={t} mini icon="barChart" label="Saldo projetado" value={fmtFI(proj)} kind={proj >= saldoIni ? 'green' : 'amber'} />
      </div>
      <Card t={t} style={{ padding: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, padding: '12px 16px', fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase' }}>
          <div>Vencimento</div><div style={{ textAlign: 'right' }}>Entradas</div><div style={{ textAlign: 'right' }}>Saídas</div><div style={{ textAlign: 'right' }}>Saldo</div>
        </div>
        {linhas.map((x, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, padding: '13px 16px', borderTop: `1px solid ${t.border}`, alignItems: 'center' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{x.d}</div>
            <div style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 700, color: x.ent ? uiTone(t, 'green').fg : t.faint }}>{x.ent ? '+' + fmtFI(x.ent) : '—'}</div>
            <div style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 700, color: x.sai ? uiTone(t, 'red').fg : t.faint }}>{x.sai ? '−' + fmtFI(x.sai) : '—'}</div>
            <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 850, color: x.saldo >= 0 ? t.text : uiTone(t, 'red').fg }}>{fmtFI(x.saldo)}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- Bancos & Conciliação ----------
function FIBancos({ t, bancos, flash }) {
  const total = bancos.reduce((a, b) => a + b.saldo, 0);
  const pend = bancos.reduce((a, b) => a + b.naoConc, 0);
  return (
    <div>
      <PageHeader t={t} title="Bancos & Conciliação" subtitle="Contas bancárias, saldos e lançamentos a conciliar." actions={<Btn t={t} icon="plus">Nova conta</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <KPI t={t} mini icon="wallet" label="Saldo total" value={fmtFI(total)} kind="accent" />
        <KPI t={t} mini icon="building" label="Contas" value={bancos.length} kind="blue" />
        <KPI t={t} mini icon="alert" label="A conciliar" value={pend} kind="amber" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {bancos.map((b) => (
          <Card t={t} key={b.id} hover style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="wallet" size={20} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{b.banco}</div><div style={{ fontSize: 11.5, color: t.muted }}>{b.conta}</div></div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}>SALDO</div>
              <div style={{ fontSize: 22, fontWeight: 850, color: t.text, margin: '2px 0 12px' }}>{fmtFI(b.saldo)}</div>
              {b.naoConc > 0 ? <button onClick={() => flash(b.naoConc + ' lançamento(s) conciliado(s)')} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', textAlign: 'center', height: 40, lineHeight: '40px', borderRadius: 10, fontSize: 13, fontWeight: 800, background: uiTone(t, 'amber').bg, color: uiTone(t, 'amber').fg }}>Conciliar {b.naoConc} lançamento(s)</button>
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 40, fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'green').fg }}><Icon name="check" size={15} /> Conciliado</div>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------- DRE / Centro de Custo ----------
function FIDre({ t }) {
  const receita = FI_CC.reduce((a, c) => a + c.receita, 0);
  const custo = FI_CC.reduce((a, c) => a + c.custo, 0);
  const lucro = receita - custo;
  const margem = receita ? Math.round((lucro / receita) * 100) : 0;
  return (
    <div>
      <PageHeader t={t} title="DRE & Centro de Custo" subtitle="Resultado do período por centro de custo." actions={<Btn t={t} kind="ghost" icon="download">Exportar DRE</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <KPI t={t} mini icon="arrowDown" label="Receita" value={fmtFI(receita)} kind="green" />
        <KPI t={t} mini icon="arrowUp" label="Custos & despesas" value={fmtFI(custo)} kind="red" />
        <KPI t={t} mini icon="dollar" label="Resultado" value={fmtFI(lucro)} kind={lucro >= 0 ? 'green' : 'red'} />
        <KPI t={t} mini icon="barChart" label="Margem" value={margem + '%'} kind="accent" />
      </div>
      <Card t={t} style={{ padding: 8, marginBottom: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 10, padding: '12px 16px', fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase' }}>
          <div>Centro de custo</div><div style={{ textAlign: 'right' }}>Receita</div><div style={{ textAlign: 'right' }}>Custo</div><div style={{ textAlign: 'right' }}>Resultado</div>
        </div>
        {FI_CC.map((c, i) => { const r = c.receita - c.custo; return (
          <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 10, padding: '13px 16px', borderTop: `1px solid ${t.border}`, alignItems: 'center' }}>
            <div><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{c.nome}</div><div style={{ fontSize: 10.5, color: t.faint, fontFamily: 'monospace' }}>{c.id}</div></div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: uiTone(t, 'green').fg }}>{fmtFI(c.receita)}</div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: uiTone(t, 'red').fg }}>{fmtFI(c.custo)}</div>
            <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 850, color: r >= 0 ? t.text : uiTone(t, 'red').fg }}>{fmtFI(r)}</div>
          </div>
        ); })}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 10, padding: '14px 16px', borderTop: `2px solid ${t.borderStrong}`, alignItems: 'center', background: t.accentSoft }}>
          <div style={{ fontSize: 13.5, fontWeight: 850, color: t.text }}>Total</div>
          <div style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 850, color: uiTone(t, 'green').fg }}>{fmtFI(receita)}</div>
          <div style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 850, color: uiTone(t, 'red').fg }}>{fmtFI(custo)}</div>
          <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 850, color: t.text }}>{fmtFI(lucro)}</div>
        </div>
      </Card>
    </div>
  );
}

// ---------- Container stateful ----------
function FIModule({ active, theme, setActive }) {
  const t = frTokens(theme, FI_ACCENT, FI_ACCENT_T);
  const [ap, setAp] = useStateFI([...FI_AP_SEED]);   // bridge window.__finExtraAP (Compras→Financeiro) removido
  const [ar, setAr] = useStateFI(FI_AR_SEED);
  const [bancos] = useStateFI(FI_BANCOS_SEED);
  const [toast, setToast] = useStateFI(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2400); };
  const baixarAp = (id) => setAp((xs) => xs.map((x) => (x.id === id ? { ...x, status: 'pago' } : x)));
  const baixarAr = (id) => setAr((xs) => xs.map((x) => (x.id === id ? { ...x, status: 'recebido' } : x)));

  let page;
  if (active === 'fin-pagar') page = <FITitulos t={t} tipo="ap" titulos={ap} baixar={baixarAp} flash={flash} />;
  else if (active === 'fin-receber') page = <FITitulos t={t} tipo="ar" titulos={ar} baixar={baixarAr} flash={flash} />;
  else if (active === 'fin-fluxo') page = <FIFluxo t={t} ap={ap} ar={ar} bancos={bancos} />;
  else if (active === 'fin-bancos') page = <FIBancos t={t} bancos={bancos} flash={flash} />;
  else if (active === 'fin-dre') page = <FIDre t={t} />;
  else page = <FIPainel t={t} ap={ap} ar={ar} bancos={bancos} setActive={setActive} />;

  return (
    <div style={{ position: 'relative' }}>
      {page}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 80, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderRadius: 13, background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 10px 30px rgba(0,0,0,.3)', maxWidth: '90vw' }}>
          <Icon name="check" size={18} /> {toast}
        </div>
      )}
    </div>
  );
}

function renderPageFin(active, props) {
  return <FIModule active={active} theme={props.theme} setActive={props.setActive} />;
}
window.renderPageFin = renderPageFin;
