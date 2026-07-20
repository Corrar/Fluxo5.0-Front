// compras.jsx — Módulo Compras (SIGACOM-like, stateful): Solicitação de Compra (SC)
// → Cotação (mapa comparativo) → Pedido de Compra (PC) com aprovação por alçada →
// Recebimento (entrada/conferência). Fornecedores e fila central de aprovações.
const { useState: useStateCP } = React;
const CP_ACCENT = '#db2777', CP_ACCENT_T = '#f472b6';
const cpInitials = (n) => (n || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
const fmtBRLc = (n) => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CP_FORN_SEED = [
  { id: 'F-101', nome: 'Aço Brasil Ltda', cat: 'Matéria-prima', cnpj: '12.345.678/0001-90', contato: 'comercial@acobrasil.com', nota: 4.6, pedidos: 38 },
  { id: 'F-102', nome: 'Parafusos União', cat: 'Insumos', cnpj: '98.765.432/0001-10', contato: 'vendas@uniao.com', nota: 4.2, pedidos: 24 },
  { id: 'F-103', nome: 'Polímeros 3D Print', cat: 'Filamentos', cnpj: '45.111.222/0001-33', contato: 'sac@polimeros3d.com', nota: 4.8, pedidos: 19 },
  { id: 'F-104', nome: 'Elétrica Total', cat: 'Elétrica', cnpj: '33.222.111/0001-55', contato: 'pedidos@eletricatotal.com', nota: 3.9, pedidos: 15 },
  { id: 'F-105', nome: 'Tintas Premium SA', cat: 'Acabamento', cnpj: '77.888.999/0001-22', contato: 'comercial@tintaspremium.com', nota: 4.4, pedidos: 11 },
  { id: 'F-106', nome: 'Metalúrgica Andrade', cat: 'Matéria-prima', cnpj: '21.333.444/0001-77', contato: 'vendas@andrade.com', nota: 4.1, pedidos: 7 },
];
const CP_SC_STATUS = { pendente: ['Pendente aprovação', 'amber'], aprovada: ['Aprovada', 'green'], reprovada: ['Reprovada', 'red'], cotando: ['Em cotação', 'blue'], atendida: ['Atendida', 'gray'] };
const CP_SC_SEED = [
  { id: 'SC-0331', solicitante: 'Carlos Moura', setor: 'Usinagem', origem: 'Estoque · Crítico', item: 'Chapa Aço 1020 2mm', qtd: 50, un: 'ch', prio: 'alta', cc: 'CC-100', just: 'Reposição de estoque para OP-73001.', status: 'pendente', data: 'Hoje · 09:20' },
  { id: 'SC-0330', solicitante: 'Rafael Souza', setor: 'Produção 3D', origem: 'Produção 3D', item: 'Filamento PLA Azul 1kg', qtd: 40, un: 'un', prio: 'media', cc: 'CC-200', just: 'Demanda de impressão crescente.', status: 'aprovada', data: 'Hoje · 08:05' },
  { id: 'SC-0327', solicitante: 'Bruno Teixeira', setor: 'Elétrica', origem: 'Assistência Técnica', item: 'Cabo Flexível 2,5mm', qtd: 500, un: 'm', prio: 'media', cc: 'CC-300', just: 'Peça para OA-2041 (Granja São José).', status: 'cotando', data: 'Ontem · 16:40' },
  { id: 'SC-0322', solicitante: 'Júlia Ramos', setor: 'Acabamento', origem: 'Compras', item: 'Tinta Epóxi Cinza 3,6L', qtd: 12, un: 'lt', prio: 'baixa', cc: 'CC-400', just: 'Estoque abaixo do mínimo.', status: 'atendida', data: '12/06 · 11:00' },
];
// Demandas vindas de outros módulos, aguardando virar SC.
const CP_DEMANDAS_SEED = [
  { id: 'D-501', origem: 'Estoque', icon: 'box', item: 'Rolamento 6204ZZ', sku: '4.10.0233', qtd: 30, un: 'un', motivo: 'Abaixo do mínimo (Críticos)', setor: 'Almoxarifado', cc: 'CC-100', prio: 'alta' },
  { id: 'D-502', origem: 'Produção', icon: 'zap', item: 'Chapa Inox 304 1,5mm', sku: '1.02.0045', qtd: 8, un: 'ch', motivo: 'Consumo da OP-90101', setor: 'Produção', cc: 'CC-100', prio: 'media' },
  { id: 'D-503', origem: 'Produção 3D', icon: 'printer', item: 'Filamento PETG Preto 1kg', sku: '3.00.0102', qtd: 15, un: 'un', motivo: 'Fila de impressão', setor: 'Produção 3D', cc: 'CC-200', prio: 'media' },
  { id: 'D-504', origem: 'Assistência Técnica', icon: 'wrench', item: 'Sensor de nível', sku: '5.20.0099', qtd: 4, un: 'un', motivo: 'Peças para OA preventivas', setor: 'Campo', cc: 'CC-300', prio: 'alta' },
  { id: 'D-505', origem: 'RH', icon: 'users', item: 'EPI Luva Nitrílica', sku: '2.11.0081', qtd: 60, un: 'par', motivo: 'Reposição de EPI', setor: 'Administrativo', cc: 'CC-900', prio: 'baixa' },
];
const CP_COT_STATUS = { aberta: ['Aberta', 'blue'], analise: ['Em análise', 'amber'], aprovada: ['Aprovada', 'green'], recusada: ['Recusada', 'red'] };
const CP_COT_SEED = [
  { id: 'COT-0420', scId: 'SC-0327', item: 'Cabo Flexível 2,5mm', qtd: 500, un: 'm', setor: 'Elétrica', status: 'analise', prazo: '20/06', propostas: [
    { forn: 'Elétrica Total', valor: 1600, prazoEntrega: '2 dias', melhor: true }, { forn: 'Metalúrgica Andrade', valor: 1720, prazoEntrega: '3 dias' }, { forn: 'Parafusos União', valor: 1810, prazoEntrega: '5 dias' } ] },
  { id: 'COT-0418', scId: null, item: 'Filamento PLA Azul 1kg', qtd: 40, un: 'un', setor: 'Produção 3D', status: 'aberta', prazo: '22/06', propostas: [
    { forn: 'Polímeros 3D Print', valor: 3596, prazoEntrega: '4 dias', melhor: true }, { forn: 'Print Mat', valor: 3840, prazoEntrega: '6 dias' } ] },
];
const CP_PC_STATUS = { rascunho: ['Rascunho', 'gray'], aprovacao: ['Aguardando aprovação', 'amber'], aprovado: ['Aprovado', 'blue'], enviado: ['Enviado', 'blue'], confirmado: ['Confirmado', 'amber'], recebido: ['Recebido', 'green'] };
const CP_PC_NEXT = { aprovado: 'enviado', enviado: 'confirmado', confirmado: 'recebido' };
const CP_PC_NEXT_LABEL = { aprovado: 'Enviar ao fornecedor', enviado: 'Confirmar pedido', confirmado: 'Receber' };
const CP_PC_SEED = [
  { id: 'PC-2051', forn: 'Aço Brasil Ltda', itens: [{ nome: 'Chapa Aço 1020 2mm', qtd: 50, un: 'ch', valor: 145 }, { nome: 'Barra Redonda 1020', qtd: 20, un: 'br', valor: 78 }, { nome: 'Cantoneira 1"', qtd: 30, un: 'br', valor: 22 }], emissao: '14/06', prev: '19/06', status: 'confirmado', aprovador: 'Bruno Teixeira' },
  { id: 'PC-2048', forn: 'Polímeros 3D Print', itens: [{ nome: 'Filamento PLA Azul 1kg', qtd: 40, un: 'un', valor: 89.9 }], emissao: '13/06', prev: '17/06', status: 'aprovacao', aprovador: null },
  { id: 'PC-2042', forn: 'Elétrica Total', itens: [{ nome: 'Cabo Flexível 2,5mm', qtd: 500, un: 'm', valor: 3.2 }], emissao: '10/06', prev: '12/06', status: 'recebido', aprovador: 'Bruno Teixeira' },
  { id: 'PC-2055', forn: 'Tintas Premium SA', itens: [{ nome: 'Tinta Epóxi Cinza 3,6L', qtd: 12, un: 'lt', valor: 210 }], emissao: '—', prev: '—', status: 'rascunho', aprovador: null },
];
const CP_PRIO = { alta: ['Alta', 'red'], media: ['Média', 'amber'], baixa: ['Baixa', 'blue'] };
const CP_CC = [
  { id: 'CC-100', nome: 'Usinagem', orc: 40000, gasto: 27400 },
  { id: 'CC-200', nome: 'Produção 3D', orc: 18000, gasto: 9800 },
  { id: 'CC-300', nome: 'Elétrica', orc: 22000, gasto: 19600 },
  { id: 'CC-400', nome: 'Acabamento', orc: 12000, gasto: 4200 },
  { id: 'CC-900', nome: 'Administrativo', orc: 30000, gasto: 11500 },
];
const CP_CONTRATOS_SEED = [
  { id: 'CTF-051', forn: 'Aço Brasil Ltda', item: 'Chapa Aço 1020 2mm', preco: 138, un: 'ch', inicio: '01/2025', fim: '12/2025', total: 600, consumido: 220, ativo: true },
  { id: 'CTF-048', forn: 'Polímeros 3D Print', item: 'Filamento PLA Azul 1kg', preco: 84.5, un: 'un', inicio: '03/2025', fim: '02/2026', total: 480, consumido: 130, ativo: true },
  { id: 'CTF-040', forn: 'Elétrica Total', item: 'Cabo Flexível 2,5mm', preco: 3.05, un: 'm', inicio: '06/2024', fim: '05/2025', total: 6000, consumido: 6000, ativo: false },
];
const pcTotal = (pc) => pc.itens.reduce((a, i) => a + i.qtd * i.valor, 0);
const cpField = (t) => ({ boxSizing: 'border-box', height: 42, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', width: '100%' });
const cpLab = (t) => ({ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 });

function CPModal({ t, title, sub, icon, onClose, children, footer, w = 600 }) {
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
const CPBtnP = ({ t, onClick, disabled, icon, children, flex }) => (
  <button onClick={onClick} disabled={disabled} style={{ all: 'unset', boxSizing: 'border-box', cursor: disabled ? 'not-allowed' : 'pointer', flex, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, padding: '0 22px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: disabled ? t.elevated : t.accent, color: disabled ? t.faint : '#fff', boxShadow: disabled ? 'none' : `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` }}>{icon && <Icon name={icon} size={17} />}{children}</button>
);

// ---------- Painel ----------
function CPPainel({ t, sc, cot, pc, forn, demandas, demandaParaSc, setActive }) {
  const go = (id) => setActive && setActive(id);
  const dark = t.panel !== '#ffffff';
  const meses = [{ label: 'Jan', v: 62 }, { label: 'Fev', v: 70, accent: true }, { label: 'Mar', v: 58 }, { label: 'Abr', v: 81, accent: true }, { label: 'Mai', v: 74 }, { label: 'Jun', v: 88, accent: true }];
  const scPend = sc.filter((s) => s.status === 'pendente').length;
  const pcAprov = pc.filter((p) => p.status === 'aprovacao').length;
  const cotAtivas = cot.filter((c) => c.status === 'aberta' || c.status === 'analise').length;
  const aReceber = pc.filter((p) => p.status === 'enviado' || p.status === 'confirmado').length;
  const fluxo = [
    { id: 'cp-sc', icon: 'file', tone: 'blue', titulo: 'Solicitação de Compra', desc: 'O setor solicita o material; passa por aprovação.' },
    { id: 'cp-cotacoes', icon: 'clipboard', tone: 'amber', titulo: 'Cotação', desc: 'Cote com vários fornecedores e compare no mapa.' },
    { id: 'cp-pedidos', icon: 'cart', tone: 'accent', titulo: 'Pedido de Compra', desc: 'Aprovação por alçada e envio ao fornecedor.' },
    { id: 'cp-recebimento', icon: 'entrar', tone: 'green', titulo: 'Recebimento', desc: 'Conferência da entrega e baixa do pedido.' },
  ];
  return (
    <div>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '30px 32px', marginBottom: 24, background: `linear-gradient(120deg, ${dark ? '#5b1538' : '#7a1f4e'} 0%, ${t.accent} 135%)`, color: '#fff' }}>
        <Icon name="cart" size={190} style={{ position: 'absolute', right: -34, top: -40, opacity: 0.1 }} />
        <div style={{ position: 'relative', maxWidth: 640 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,.18)', marginBottom: 16 }}><Icon name="cart" size={13} /> Módulo Compras</div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 850, letterSpacing: '-.02em', lineHeight: 1.1 }}>Suprimentos & Compras</h1>
          <p style={{ margin: '8px 0 18px', fontSize: 14, color: 'rgba(255,255,255,.88)', lineHeight: 1.5 }}><b>{scPend} solicitação(ões)</b> e <b>{pcAprov} pedido(s)</b> aguardando aprovação · <b>{demandas.length} demanda(s)</b> dos módulos.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => go('cp-aprovacoes')} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: '#fff', color: t.accent, boxShadow: '0 6px 16px rgba(0,0,0,.2)' }}><Icon name="check" size={16} /> Aprovações</button>
            <button onClick={() => go('cp-sc')} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, background: 'rgba(255,255,255,.16)', color: '#fff' }}><Icon name="file" size={16} /> Solicitações</button>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <KPI t={t} mini icon="file" label="SC pendentes" value={scPend} kind="amber" />
        <KPI t={t} mini icon="clipboard" label="Cotações ativas" value={cotAtivas} kind="blue" />
        <KPI t={t} mini icon="cart" label="PC aguard. aprov." value={pcAprov} kind="accent" />
        <KPI t={t} mini icon="entrar" label="A receber" value={aReceber} kind="green" />
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 12 }}>Fluxo de compras</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 26 }}>
        {fluxo.map((s, i) => (
          <button key={s.id} onClick={() => go(s.id)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', position: 'relative', padding: 16, borderRadius: 16, background: t.panel, border: `1px solid ${t.border}`, transition: 'transform .15s, box-shadow .15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = t.shadow; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            <span style={{ position: 'absolute', top: 12, right: 14, fontSize: 12, fontWeight: 850, color: t.faint }}>{i + 1}</span>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: uiTone(t, s.tone).bg, color: uiTone(t, s.tone).fg, display: 'grid', placeItems: 'center' }}><Icon name={s.icon} size={19} /></span>
            <div style={{ fontSize: 14, fontWeight: 800, color: t.text, margin: '12px 0 5px' }}>{s.titulo}</div>
            <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.45 }}>{s.desc}</div>
          </button>
        ))}
      </div>
      <Card t={t} style={{ padding: 22, marginBottom: 26 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Compras por mês (R$ mil)</div>
          <Badge t={t} kind="green" dot>economia de 8%</Badge>
        </div>
        <BarChart t={t} data={meses} />
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <Icon name="exchange" size={16} style={{ color: t.accentText }} />
        <span style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>Demandas dos módulos</span>
        <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 8px', borderRadius: 7, background: t.accentSoft, color: t.accentText }}>{demandas.length}</span>
        <span style={{ fontSize: 12, color: t.muted, marginLeft: 4 }}>Estoque, Produção, 3D, Assistência e RH enviam pedidos direto para Compras.</span>
      </div>
      {demandas.length === 0 ? <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Sem demandas pendentes" sub="Tudo que os módulos pediram já virou solicitação de compra." /></Card> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {demandas.map((d) => { const pr = CP_PRIO[d.prio]; return (
            <Card t={t} key={d.id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={d.icon} size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11, fontWeight: 800, color: t.accentText }}>{d.origem}</div><div style={{ fontSize: 14, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.item}</div></div>
                <Badge t={t} kind={pr[1]} dot>{pr[0]}</Badge>
              </div>
              <div style={{ fontSize: 12, color: t.muted, margin: '11px 0' }}>{d.qtd} {d.un} · {d.motivo}</div>
              <button onClick={() => demandaParaSc(d)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', textAlign: 'center', height: 40, lineHeight: '40px', borderRadius: 10, fontSize: 13, fontWeight: 800, background: t.accent, color: '#fff' }}>Gerar solicitação de compra</button>
            </Card>
          ); })}
        </div>
      )}
    </div>
  );
}

// ---------- Solicitações de Compra ----------
function CPNovaSC({ t, onClose, onCreate }) {
  const [f, setF] = useStateCP({ solicitante: USER.name, setor: '', item: '', qtd: '1', un: 'un', prio: 'media', cc: 'CC-100', just: '' });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const ok = f.item.trim() && +f.qtd > 0 && f.setor.trim();
  return (
    <CPModal t={t} title="Nova solicitação de compra" sub="SC — requisição interna de material." icon="file" onClose={onClose}
      footer={<><Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn><CPBtnP t={t} icon="check" disabled={!ok} onClick={() => ok && onCreate(f)}>Enviar para aprovação</CPBtnP></>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div><label style={cpLab(t)}>Solicitante</label><input value={f.solicitante} onChange={(e) => set('solicitante', e.target.value)} style={cpField(t)} /></div>
        <div><label style={cpLab(t)}>Setor</label><input value={f.setor} onChange={(e) => set('setor', e.target.value)} placeholder="Usinagem" style={cpField(t)} /></div>
        <div style={{ gridColumn: '1/-1' }}><label style={cpLab(t)}>Material</label><input value={f.item} onChange={(e) => set('item', e.target.value)} placeholder="Ex: Chapa Aço 1020 2mm" style={cpField(t)} /></div>
        <div><label style={cpLab(t)}>Quantidade</label><input value={f.qtd} onChange={(e) => set('qtd', e.target.value.replace(/[^0-9]/g, ''))} style={cpField(t)} /></div>
        <div><label style={cpLab(t)}>Unidade</label><div style={{ position: 'relative' }}><select value={f.un} onChange={(e) => set('un', e.target.value)} style={{ ...cpField(t), appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>{['un', 'm', 'ch', 'lt', 'kg', 'br', 'cx', 'par'].map((u) => <option key={u}>{u}</option>)}</select><Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 13, color: t.muted, pointerEvents: 'none' }} /></div></div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={cpLab(t)}>Prioridade</label>
          <div style={{ display: 'flex', gap: 6 }}>{Object.entries(CP_PRIO).map(([k, v]) => { const on = f.prio === k; return <button key={k} onClick={() => set('prio', k)} style={{ all: 'unset', cursor: 'pointer', flex: 1, textAlign: 'center', height: 40, lineHeight: '40px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: on ? uiTone(t, v[1]).bg : t.elevated, color: on ? uiTone(t, v[1]).fg : t.muted, border: `1px solid ${on ? uiTone(t, v[1]).fg : t.border}` }}>{v[0]}</button>; })}</div>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={cpLab(t)}>Centro de custo (rateio)</label>
          <div style={{ position: 'relative' }}><select value={f.cc} onChange={(e) => set('cc', e.target.value)} style={{ ...cpField(t), appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>{CP_CC.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.nome} — saldo {fmtBRLc(c.orc - c.gasto)}</option>)}</select><Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 13, color: t.muted, pointerEvents: 'none' }} /></div>
        </div>
        <div style={{ gridColumn: '1/-1' }}><label style={cpLab(t)}>Justificativa</label><textarea value={f.just} onChange={(e) => set('just', e.target.value)} rows={3} placeholder="Motivo da solicitação…" style={{ ...cpField(t), height: 'auto', padding: '12px 14px', resize: 'vertical', lineHeight: 1.5 }} /></div>
      </div>
    </CPModal>
  );
}

function CPSolicitacoes({ t, sc, updateSc, gerarCotacao, flash }) {
  const [filtro, setFiltro] = useStateCP('todas');
  const [nova, setNova] = useStateCP(false);
  const tabs = [['todas', 'Todas'], ['pendente', 'Pendentes'], ['aprovada', 'Aprovadas'], ['cotando', 'Em cotação'], ['atendida', 'Atendidas']];
  const count = (k) => (k === 'todas' ? sc.length : sc.filter((s) => s.status === k).length);
  const view = filtro === 'todas' ? sc : sc.filter((s) => s.status === filtro);
  return (
    <div>
      <PageHeader t={t} title="Solicitações de Compra" subtitle="Requisições internas (SC) e seu fluxo de aprovação." actions={<Btn t={t} icon="plus" onClick={() => setNova(true)}>Nova SC</Btn>} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {tabs.map(([k, label]) => { const on = filtro === k; return <button key={k} onClick={() => setFiltro(k)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: on ? t.accent : t.panel, color: on ? '#fff' : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>{label}<span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 7, background: on ? 'rgba(255,255,255,.25)' : t.hover, color: on ? '#fff' : t.muted }}>{count(k)}</span></button>; })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
        {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhuma SC" sub="Crie uma nova solicitação." /></Card></div>}
        {view.map((s) => { const st = CP_SC_STATUS[s.status]; const pr = CP_PRIO[s.prio]; return (
          <Card t={t} key={s.id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: t.muted }}>{s.id}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{s.origem && s.origem !== 'Compras' && <Badge t={t} kind="blue">{s.origem}</Badge>}<Badge t={t} kind={st[1]} dot>{st[0]}</Badge></div>
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text, margin: '12px 0 4px' }}>{s.item}</div>
            <div style={{ fontSize: 12, color: t.muted }}>{s.qtd} {s.un} · {s.setor} · <Badge t={t} kind={pr[1]}>{pr[0]}</Badge>{s.cc ? <span> · <Badge t={t} kind="gray">{s.cc}</Badge></span> : null}</div>
            <div style={{ fontSize: 12.5, color: t.muted, margin: '12px 0', lineHeight: 1.5, fontStyle: 'italic' }}>“{s.just}”</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 9.5 }}>{cpInitials(s.solicitante)}</span>
              <span style={{ fontSize: 12, color: t.muted, flex: 1 }}>{s.solicitante} · {s.data}</span>
            </div>
            {s.status === 'pendente' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => { updateSc(s.id, { status: 'reprovada' }); flash('SC reprovada'); }} style={{ all: 'unset', cursor: 'pointer', flex: 1, textAlign: 'center', height: 40, lineHeight: '40px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}>Reprovar</button>
                <button onClick={() => { updateSc(s.id, { status: 'aprovada' }); flash('SC aprovada'); }} style={{ all: 'unset', cursor: 'pointer', flex: 1.3, textAlign: 'center', height: 40, lineHeight: '40px', borderRadius: 10, fontSize: 13, fontWeight: 800, background: t.accent, color: '#fff' }}>Aprovar</button>
              </div>
            )}
            {s.status === 'aprovada' && <button onClick={() => { gerarCotacao(s); flash('Cotação gerada para ' + s.item); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', textAlign: 'center', height: 42, lineHeight: '42px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, background: t.accentSoft, color: t.accentText, marginTop: 12 }}>Gerar cotação →</button>}
          </Card>
        ); })}
      </div>
      {nova && <CPNovaSC t={t} onClose={() => setNova(false)} onCreate={(f) => { gerarCotacao; setNova(false); flash('SC criada e enviada para aprovação'); window.__cpAddSc && window.__cpAddSc(f); }} />}
    </div>
  );
}

// ---------- Cotações ----------
function CPCotacoes({ t, cot, aprovarCotacao, recusarCotacao, flash }) {
  const [open, setOpen] = useStateCP(null);
  const [filtro, setFiltro] = useStateCP('todas');
  const tabs = [['todas', 'Todas'], ['aberta', 'Abertas'], ['analise', 'Em análise'], ['aprovada', 'Aprovadas'], ['recusada', 'Recusadas']];
  const count = (k) => (k === 'todas' ? cot.length : cot.filter((c) => c.status === k).length);
  const view = filtro === 'todas' ? cot : cot.filter((c) => c.status === filtro);
  const cur = cot.find((c) => c.id === open);
  return (
    <div>
      <PageHeader t={t} title="Cotações" subtitle="Mapa comparativo — compare propostas e aprove a melhor." actions={<Btn t={t} icon="plus">Nova cotação</Btn>} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {tabs.map(([k, label]) => { const on = filtro === k; return <button key={k} onClick={() => setFiltro(k)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: on ? t.accent : t.panel, color: on ? '#fff' : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>{label}<span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 7, background: on ? 'rgba(255,255,255,.25)' : t.hover, color: on ? '#fff' : t.muted }}>{count(k)}</span></button>; })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhuma cotação" sub="Gere a partir de uma SC aprovada." /></Card></div>}
        {view.map((c) => { const melhor = [...c.propostas].sort((a, b) => a.valor - b.valor)[0]; return (
          <Card t={t} key={c.id} hover style={{ padding: 18, cursor: 'pointer' }}>
            <div onClick={() => setOpen(c.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: t.muted }}>{c.id}{c.scId ? ' · ' + c.scId : ''}</span>
                <Badge t={t} kind={CP_COT_STATUS[c.status][1]} dot>{CP_COT_STATUS[c.status][0]}</Badge>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text, margin: '12px 0 4px' }}>{c.item}</div>
              <div style={{ fontSize: 12, color: t.muted }}>{c.qtd} {c.un} · {c.setor} · prazo {c.prazo}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, padding: '11px 13px', borderRadius: 11, background: t.accentSoft, border: `1px solid ${frHexToRgba(t.accent, 0.2)}` }}>
                <Icon name="check" size={15} style={{ color: t.accentText }} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: t.text }}>{melhor.forn}</div><div style={{ fontSize: 11, color: t.muted }}>{c.propostas.length} proposta(s) · entrega {melhor.prazoEntrega}</div></div>
                <span style={{ fontSize: 15, fontWeight: 850, color: t.accentText }}>{fmtBRLc(melhor.valor)}</span>
              </div>
            </div>
          </Card>
        ); })}
      </div>
      {cur && <CPCotModal t={t} cot={cur} onClose={() => setOpen(null)} onAprovar={(forn) => { aprovarCotacao(cur, forn); setOpen(null); flash('Cotação aprovada · PC gerado para ' + forn.forn); }} onRecusar={() => { recusarCotacao(cur.id); setOpen(null); flash('Cotação recusada'); }} />}
    </div>
  );
}
function CPCotModal({ t, cot, onClose, onAprovar, onRecusar }) {
  const pend = cot.status === 'aberta' || cot.status === 'analise';
  const sorted = [...cot.propostas].sort((a, b) => a.valor - b.valor);
  const [sel, setSel] = useStateCP(sorted[0].forn);
  return (
    <CPModal t={t} title={cot.item} sub={`${cot.id} · ${cot.qtd} ${cot.un} · ${cot.setor}`} icon="clipboard" onClose={onClose} w={640}
      footer={pend ? <><button onClick={onRecusar} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}><Icon name="x" size={17} /> Recusar</button><CPBtnP t={t} icon="check" onClick={() => onAprovar(sorted.find((p) => p.forn === sel))}>Aprovar &amp; gerar PC</CPBtnP></> : null}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 12 }}>Mapa comparativo ({sorted.length} propostas)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((p, i) => { const best = i === 0; const on = sel === p.forn; return (
          <button key={i} onClick={() => pend && setSel(p.forn)} style={{ all: 'unset', cursor: pend ? 'pointer' : 'default', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 13, background: on ? t.accentSoft : t.elevated, border: `1px solid ${on ? t.accent : t.border}` }}>
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: best ? t.accent : t.hover, color: best ? '#fff' : t.muted, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{cpInitials(p.forn)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}><span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{p.forn}</span>{best && <Badge t={t} kind="accent">Menor preço</Badge>}</div>
              <div style={{ fontSize: 11.5, color: t.muted }}>Entrega em {p.prazoEntrega}</div>
            </div>
            {pend && <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${on ? t.accent : t.borderStrong}`, background: on ? t.accent : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{on && <Icon name="check" size={12} style={{ color: '#fff' }} />}</span>}
            <span style={{ fontSize: 18, fontWeight: 850, color: best ? t.accentText : t.text }}>{fmtBRLc(p.valor)}</span>
          </button>
        ); })}
      </div>
    </CPModal>
  );
}

// ---------- Pedidos de Compra ----------
function CPPedidos({ t, pc, updatePc, aprovarPc, flash }) {
  const [filtro, setFiltro] = useStateCP('todos');
  const [open, setOpen] = useStateCP(null);
  const tabs = [['todos', 'Todos'], ['rascunho', 'Rascunho'], ['aprovacao', 'Aprovação'], ['aprovado', 'Aprovados'], ['enviado', 'Enviados'], ['recebido', 'Recebidos']];
  const count = (k) => (k === 'todos' ? pc.length : pc.filter((p) => p.status === k).length);
  const view = filtro === 'todos' ? pc : pc.filter((p) => p.status === filtro);
  const cur = pc.find((p) => p.id === open);
  return (
    <div>
      <PageHeader t={t} title="Pedidos de Compra" subtitle="Aprovação por alçada, envio e acompanhamento até o recebimento." actions={<Btn t={t} icon="plus">Novo pedido</Btn>} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {tabs.map(([k, label]) => { const on = filtro === k; return <button key={k} onClick={() => setFiltro(k)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: on ? t.accent : t.panel, color: on ? '#fff' : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>{label}<span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 7, background: on ? 'rgba(255,255,255,.25)' : t.hover, color: on ? '#fff' : t.muted }}>{count(k)}</span></button>; })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
        {view.map((p) => { const st = CP_PC_STATUS[p.status]; return (
          <Card t={t} key={p.id} hover style={{ padding: 18, cursor: 'pointer' }}>
            <div onClick={() => setOpen(p.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: t.muted }}>{p.id}</span><Badge t={t} kind={st[1]} dot>{st[0]}</Badge></div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text, margin: '12px 0 4px' }}>{p.forn}</div>
              <div style={{ fontSize: 12, color: t.muted }}>{p.itens.length} item(ns) · emissão {p.emissao} · entrega {p.prev}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14, paddingTop: 13, borderTop: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 11, color: t.faint }}>{p.aprovador ? 'Aprovado por ' + p.aprovador : 'Sem aprovação'}</span>
                <span style={{ fontSize: 17, fontWeight: 850, color: t.text }}>{fmtBRLc(pcTotal(p))}</span>
              </div>
            </div>
            {p.status === 'aprovacao' && <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><button onClick={() => { updatePc(p.id, { status: 'rascunho' }); flash('PC reprovado'); }} style={{ all: 'unset', cursor: 'pointer', flex: 1, textAlign: 'center', height: 40, lineHeight: '40px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}>Reprovar</button><button onClick={() => { aprovarPc(p.id); flash('PC ' + p.id + ' aprovado'); }} style={{ all: 'unset', cursor: 'pointer', flex: 1.3, textAlign: 'center', height: 40, lineHeight: '40px', borderRadius: 10, fontSize: 13, fontWeight: 800, background: t.accent, color: '#fff' }}>Aprovar</button></div>}
          </Card>
        ); })}
      </div>
      {cur && <CPPcModal t={t} pc={cur} onClose={() => setOpen(null)} updatePc={updatePc} aprovarPc={aprovarPc} flash={flash} />}
    </div>
  );
}
function CPPcModal({ t, pc, onClose, updatePc, aprovarPc, flash }) {
  const nx = CP_PC_NEXT[pc.status];
  const advance = () => { updatePc(pc.id, { status: nx }); flash('PC: ' + CP_PC_STATUS[nx][0]); };
  return (
    <CPModal t={t} title={pc.forn} sub={`${pc.id} · ${CP_PC_STATUS[pc.status][0]}`} icon="cart" onClose={onClose} w={620}
      footer={pc.status === 'aprovacao' ? <><button onClick={() => { updatePc(pc.id, { status: 'rascunho' }); onClose(); flash('PC reprovado'); }} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}>Reprovar</button><CPBtnP t={t} icon="check" onClick={() => { aprovarPc(pc.id); onClose(); flash('PC aprovado'); }}>Aprovar (alçada)</CPBtnP></>
        : pc.status === 'rascunho' ? <CPBtnP t={t} icon="check" onClick={() => { updatePc(pc.id, { status: 'aprovacao' }); onClose(); flash('PC enviado para aprovação'); }}>Enviar para aprovação</CPBtnP>
        : nx ? <CPBtnP t={t} icon={pc.status === 'confirmado' ? 'entrar' : 'cart'} onClick={() => { advance(); onClose(); }}>{CP_PC_NEXT_LABEL[pc.status]}</CPBtnP> : null}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 8, background: t.elevated, border: `1px solid ${t.border}`, color: t.text }}><Icon name="calendar" size={13} /> Emissão {pc.emissao}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 8, background: t.elevated, border: `1px solid ${t.border}`, color: t.text }}><Icon name="entrar" size={13} /> Entrega {pc.prev}</span>
        {pc.aprovador && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 8, background: uiTone(t, 'green').bg, color: uiTone(t, 'green').fg }}><Icon name="check" size={13} /> {pc.aprovador}</span>}
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 10 }}>Itens do pedido</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pc.itens.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={15} /></span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{it.nome}</div><div style={{ fontSize: 11, color: t.muted }}>{it.qtd} {it.un} × {fmtBRLc(it.valor)}</div></div>
            <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{fmtBRLc(it.qtd * it.valor)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: '13px 16px', borderRadius: 12, background: t.accentSoft }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.accentText }}>Total do pedido</span>
        <span style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{fmtBRLc(pcTotal(pc))}</span>
      </div>
    </CPModal>
  );
}

// ---------- Recebimento (Doc. de Entrada / Pré-nota) ----------
function CPConferencia({ t, pc, onClose, onConfirm }) {
  const hoje = new Date();
  const venc = new Date(hoje.getTime() + 28 * 864e5).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const [linhas, setLinhas] = useStateCP(pc.itens.map((i) => ({ ...i, receb: i.qtd })));
  const [doc, setDoc] = useStateCP('');
  const [vencimento, setVencimento] = useStateCP(venc);
  const setReceb = (idx, v) => setLinhas((xs) => xs.map((l, i) => (i === idx ? { ...l, receb: Math.max(0, +String(v).replace(/[^0-9]/g, '') || 0) } : l)));
  const totalPedido = linhas.reduce((a, l) => a + l.qtd * l.valor, 0);
  const totalReceb = linhas.reduce((a, l) => a + l.receb * l.valor, 0);
  const divergencias = linhas.filter((l) => l.receb !== l.qtd).length;
  const okDoc = doc.trim().length > 0;
  return (
    <CPModal t={t} title={`Conferência · ${pc.forn}`} sub={`${pc.id} · pré-nota de entrada`} icon="entrar" onClose={onClose} w={680}
      footer={<><Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn><CPBtnP t={t} icon="check" disabled={!okDoc} onClick={() => okDoc && onConfirm({ linhas, doc: doc.trim(), venc: vencimento, totalReceb, divergencias })}>Dar entrada</CPBtnP></>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div><label style={cpLab(t)}>Nº da nota / documento</label><input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="Ex: NF 004471" style={cpField(t)} /></div>
        <div><label style={cpLab(t)}>Vencimento do título</label><input value={vencimento} onChange={(e) => setVencimento(e.target.value)} placeholder="dd/mm" style={cpField(t)} /></div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 10 }}>Conferência item a item</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {linhas.map((l, i) => { const div = l.receb !== l.qtd; return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${div ? uiTone(t, 'amber').fg : t.border}` }}>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{l.nome}</div><div style={{ fontSize: 11, color: t.muted }}>Pedido: {l.qtd} {l.un} × {fmtBRLc(l.valor)}</div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: t.faint, textTransform: 'uppercase' }}>Recebido</span>
              <input value={l.receb} onChange={(e) => setReceb(i, e.target.value)} style={{ width: 64, textAlign: 'center', boxSizing: 'border-box', height: 38, borderRadius: 10, border: `1px solid ${div ? uiTone(t, 'amber').fg : t.border}`, background: t.panel, color: t.text, fontSize: 14, fontWeight: 800, outline: 'none', fontFamily: 'inherit' }} />
              <span style={{ fontSize: 11.5, color: t.muted, width: 22 }}>{l.un}</span>
            </div>
            {div ? <Badge t={t} kind="amber">{l.receb > l.qtd ? '+' : ''}{l.receb - l.qtd}</Badge> : <Icon name="check" size={16} style={{ color: uiTone(t, 'green').fg }} />}
          </div>
        ); })}
      </div>
      {divergencias > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, padding: '11px 13px', borderRadius: 11, background: uiTone(t, 'amber').bg, color: uiTone(t, 'amber').fg, fontSize: 12.5, fontWeight: 700 }}><Icon name="alert" size={16} /> {divergencias} item(ns) com divergência entre pedido e recebido — o título usará o valor efetivamente recebido.</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: '13px 16px', borderRadius: 12, background: t.accentSoft }}>
        <div><div style={{ fontSize: 11, color: t.muted }}>Pedido {fmtBRLc(totalPedido)}</div><span style={{ fontSize: 13, fontWeight: 700, color: t.accentText }}>Total a lançar no Financeiro</span></div>
        <span style={{ fontSize: 19, fontWeight: 850, color: t.text }}>{fmtBRLc(totalReceb)}</span>
      </div>
    </CPModal>
  );
}

function CPRecebimento({ t, pc, receber, forn, avaliarForn, flash }) {
  const [conf, setConf] = useStateCP(null);
  const [aval, setAval] = useStateCP(null);
  const aReceber = pc.filter((p) => p.status === 'enviado' || p.status === 'confirmado');
  const recebidos = pc.filter((p) => p.status === 'recebido');
  const fornNota = (nome) => (forn.find((x) => x.nome === nome) || {}).nota;
  return (
    <div>
      <PageHeader t={t} title="Recebimento" subtitle="Doc. de entrada — conferência da nota, baixa do pedido, entrada no estoque e título no Financeiro." />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <KPI t={t} mini icon="entrar" label="A receber" value={aReceber.length} kind="amber" />
        <KPI t={t} mini icon="check" label="Recebidos" value={recebidos.length} kind="green" />
        <KPI t={t} mini icon="barChart" label="Valor a receber" value={fmtBRLc(aReceber.reduce((a, p) => a + pcTotal(p), 0))} kind="accent" />
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 12 }}>Aguardando recebimento</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16, marginBottom: 26 }}>
        {aReceber.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada a receber" sub="Pedidos enviados/confirmados aparecem aqui." /></Card></div>}
        {aReceber.map((p) => (
          <Card t={t} key={p.id} hover style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: t.muted }}>{p.id}</span><Badge t={t} kind={CP_PC_STATUS[p.status][1]} dot>{CP_PC_STATUS[p.status][0]}</Badge></div>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text, margin: '12px 0 4px' }}>{p.forn}</div>
            <div style={{ fontSize: 12, color: t.muted }}>{p.itens.length} item(ns) · entrega prevista {p.prev}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <span style={{ fontSize: 16, fontWeight: 850, color: t.text }}>{fmtBRLc(pcTotal(p))}</span>
              <button onClick={() => setConf(p)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, background: t.accent, color: '#fff' }}><Icon name="entrar" size={16} /> Conferir entrada</button>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 12 }}>Recebidos recentemente</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {recebidos.map((p) => { const nota = fornNota(p.forn); return (
          <Card t={t} key={p.id} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: uiTone(t, 'green').bg, color: uiTone(t, 'green').fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="check" size={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>{p.forn}</div><div style={{ fontSize: 11.5, color: t.muted }}>{p.id} · {fmtBRLc(pcTotal(p))}{p.doc ? ' · ' + p.doc : ''}</div></div>
            </div>
            <button onClick={() => setAval(p)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', textAlign: 'center', marginTop: 12, height: 38, lineHeight: '38px', borderRadius: 10, fontSize: 12.5, fontWeight: 800, background: t.elevated, border: `1px solid ${t.border}`, color: uiTone(t, 'amber').fg }}>★ Avaliar fornecedor{nota ? ' · ' + nota : ''}</button>
          </Card>
        ); })}
      </div>
      {conf && <CPConferencia t={t} pc={conf} onClose={() => setConf(null)} onConfirm={(res) => { receber(conf.id, res); setConf(null); flash('Entrada de ' + conf.id + ' registrada · estoque atualizado · título ' + res.doc + ' gerado no Financeiro'); }} />}
      {aval && <CPAvaliacao t={t} pc={aval} onClose={() => setAval(null)} onSave={(nota) => { avaliarForn(aval.forn, nota); setAval(null); flash('Fornecedor ' + aval.forn + ' avaliado: ' + nota + '★'); }} />}
    </div>
  );
}

function CPAvaliacao({ t, pc, onClose, onSave }) {
  const [nota, setNota] = useStateCP(5);
  const crit = [['Prazo de entrega', 'clock'], ['Qualidade do material', 'check'], ['Atendimento', 'users']];
  return (
    <CPModal t={t} title={`Avaliar ${pc.forn}`} sub={`${pc.id} · desempenho no fornecimento`} icon="building" onClose={onClose} w={460}
      footer={<><Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn><CPBtnP t={t} icon="check" onClick={() => onSave(nota.toFixed(1))}>Salvar avaliação</CPBtnP></>}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((s) => <button key={s} onClick={() => setNota(s)} style={{ all: 'unset', cursor: 'pointer', fontSize: 34, lineHeight: 1, color: s <= nota ? uiTone(t, 'amber').fg : t.border }}>★</button>)}
        </div>
        <div style={{ fontSize: 13, color: t.muted, marginTop: 8 }}>Nota geral: <b style={{ color: t.text }}>{nota.toFixed(1)}</b></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {crit.map(([lbl, ic]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
            <Icon name={ic} size={15} style={{ color: t.accentText }} />
            <span style={{ flex: 1, fontSize: 13, color: t.text }}>{lbl}</span>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: uiTone(t, 'amber').fg }}>{'★'.repeat(Math.round(nota))}</span>
          </div>
        ))}
      </div>
    </CPModal>
  );
}

// ---------- Aprovações (fila central) ----------
function CPAprovacoes({ t, sc, pc, updateSc, aprovarPc, updatePc, flash }) {
  const scPend = sc.filter((s) => s.status === 'pendente');
  const pcPend = pc.filter((p) => p.status === 'aprovacao');
  const vazio = scPend.length === 0 && pcPend.length === 0;
  return (
    <div>
      <PageHeader t={t} title="Aprovações" subtitle="Fila central de aprovação por alçada — SCs e Pedidos." />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <KPI t={t} mini icon="file" label="SC pendentes" value={scPend.length} kind="amber" />
        <KPI t={t} mini icon="cart" label="PC aguardando" value={pcPend.length} kind="accent" />
        <KPI t={t} mini icon="barChart" label="Valor a aprovar" value={fmtBRLc(pcPend.reduce((a, p) => a + pcTotal(p), 0))} kind="blue" />
      </div>
      {vazio && <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Tudo aprovado" sub="Nenhum item aguardando sua aprovação." /></Card>}
      {scPend.length > 0 && <div style={{ fontSize: 12.5, fontWeight: 800, color: t.text, margin: '4px 0 12px' }}>Solicitações de Compra</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: scPend.length ? 26 : 0 }}>
        {scPend.map((s) => { const pr = CP_PRIO[s.prio]; return (
          <Card t={t} key={s.id} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: uiTone(t, 'blue').bg, color: uiTone(t, 'blue').fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="file" size={19} /></span>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 700, color: t.muted }}>{s.id}</span><Badge t={t} kind={pr[1]}>{pr[0]}</Badge></div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text, marginTop: 4 }}>{s.item}</div>
                <div style={{ fontSize: 12, color: t.muted }}>{s.qtd} {s.un} · {s.solicitante} · {s.setor}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { updateSc(s.id, { status: 'reprovada' }); flash('SC reprovada'); }} style={{ all: 'unset', cursor: 'pointer', padding: '0 16px', height: 42, lineHeight: '42px', borderRadius: 11, fontSize: 13, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}>Reprovar</button>
                <button onClick={() => { updateSc(s.id, { status: 'aprovada' }); flash('SC aprovada'); }} style={{ all: 'unset', cursor: 'pointer', padding: '0 18px', height: 42, lineHeight: '42px', borderRadius: 11, fontSize: 13, fontWeight: 800, background: t.accent, color: '#fff' }}>Aprovar</button>
              </div>
            </div>
          </Card>
        ); })}
      </div>
      {pcPend.length > 0 && <div style={{ fontSize: 12.5, fontWeight: 800, color: t.text, margin: '4px 0 12px' }}>Pedidos de Compra</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pcPend.map((p) => (
          <Card t={t} key={p.id} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="cart" size={19} /></span>
              <div style={{ flex: 1, minWidth: 160 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 700, color: t.muted }}>{p.id}</span>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text, marginTop: 4 }}>{p.forn}</div>
                <div style={{ fontSize: 12, color: t.muted }}>{p.itens.length} item(ns) · <b style={{ color: t.text }}>{fmtBRLc(pcTotal(p))}</b></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { updatePc(p.id, { status: 'rascunho' }); flash('PC reprovado'); }} style={{ all: 'unset', cursor: 'pointer', padding: '0 16px', height: 42, lineHeight: '42px', borderRadius: 11, fontSize: 13, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}>Reprovar</button>
                <button onClick={() => { aprovarPc(p.id); flash('PC aprovado'); }} style={{ all: 'unset', cursor: 'pointer', padding: '0 18px', height: 42, lineHeight: '42px', borderRadius: 11, fontSize: 13, fontWeight: 800, background: t.accent, color: '#fff' }}>Aprovar</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------- Fornecedores ----------
function CPFornecedores({ t, forn, setForn, flash }) {
  const [q, setQ] = useStateCP('');
  const [nova, setNova] = useStateCP(false);
  const [f, setF] = useStateCP({ nome: '', cat: 'Insumos', cnpj: '', contato: '' });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const ql = q.trim().toLowerCase();
  const view = forn.filter((x) => !ql || x.nome.toLowerCase().includes(ql) || x.cat.toLowerCase().includes(ql));
  const criar = () => { if (!f.nome.trim()) return; setForn((xs) => [{ id: 'F-' + (107 + xs.length), nome: f.nome.trim(), cat: f.cat, cnpj: f.cnpj.trim() || '—', contato: f.contato.trim() || '—', nota: 0, pedidos: 0 }, ...xs]); setNova(false); setF({ nome: '', cat: 'Insumos', cnpj: '', contato: '' }); flash('Fornecedor cadastrado'); };
  return (
    <div>
      <PageHeader t={t} title="Fornecedores" subtitle="Cadastro e desempenho dos fornecedores." actions={<Btn t={t} icon="plus" onClick={() => setNova(true)}>Novo fornecedor</Btn>} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text', marginBottom: 18 }}>
        <Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou categoria…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {view.map((f2) => (
          <Card t={t} key={f2.id} hover style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 14, flexShrink: 0 }}>{cpInitials(f2.nome)}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{f2.nome}</div><div style={{ fontSize: 11.5, color: t.muted }}>{f2.cnpj}</div></div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 800, color: uiTone(t, 'amber').fg }}>★ {f2.nota || '—'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 13, borderTop: `1px solid ${t.border}` }}>
              <Badge t={t} kind="gray">{f2.cat}</Badge>
              <span style={{ fontSize: 12, color: t.muted }}><b style={{ color: t.text }}>{f2.pedidos}</b> pedidos</span>
            </div>
          </Card>
        ))}
      </div>
      {nova && (
        <CPModal t={t} title="Novo fornecedor" sub="Cadastro de fornecedor." icon="building" onClose={() => setNova(false)} w={500}
          footer={<><Btn t={t} kind="ghost" onClick={() => setNova(false)}>Cancelar</Btn><CPBtnP t={t} icon="check" disabled={!f.nome.trim()} onClick={criar}>Cadastrar</CPBtnP></>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={cpLab(t)}>Razão social</label><input value={f.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Nome do fornecedor" style={cpField(t)} /></div>
            <div><label style={cpLab(t)}>Categoria</label><div style={{ position: 'relative' }}><select value={f.cat} onChange={(e) => set('cat', e.target.value)} style={{ ...cpField(t), appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>{['Matéria-prima', 'Insumos', 'Filamentos', 'Elétrica', 'Acabamento', 'Serviços'].map((x) => <option key={x}>{x}</option>)}</select><Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 13, color: t.muted, pointerEvents: 'none' }} /></div></div>
            <div><label style={cpLab(t)}>CNPJ</label><input value={f.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" style={cpField(t)} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={cpLab(t)}>Contato</label><input value={f.contato} onChange={(e) => set('contato', e.target.value)} placeholder="email@fornecedor.com" style={cpField(t)} /></div>
          </div>
        </CPModal>
      )}
    </div>
  );
}

// ---------- Contratos de fornecimento + Orçamento por centro de custo ----------
function CPContratos({ t, contratos, setContratos, forn, flash }) {
  const [q, setQ] = useStateCP('');
  const [nova, setNova] = useStateCP(false);
  const [f, setF] = useStateCP({ forn: '', item: '', preco: '', un: 'un', inicio: '', fim: '', total: '' });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const ql = q.trim().toLowerCase();
  const view = contratos.filter((c) => !ql || c.forn.toLowerCase().includes(ql) || c.item.toLowerCase().includes(ql) || c.id.toLowerCase().includes(ql));
  const ok = f.forn.trim() && f.item.trim() && +f.preco > 0;
  const criar = () => { if (!ok) return; const n = 'CTF-' + (52 + contratos.length); setContratos((xs) => [{ id: n, forn: f.forn, item: f.item.trim(), preco: +f.preco, un: f.un, inicio: f.inicio.trim() || '—', fim: f.fim.trim() || '—', total: +f.total || 0, consumido: 0, ativo: true }, ...xs]); setNova(false); setF({ forn: '', item: '', preco: '', un: 'un', inicio: '', fim: '', total: '' }); flash('Contrato ' + n + ' criado'); };
  return (
    <div>
      <PageHeader t={t} title="Contratos de Fornecimento" subtitle="Preço negociado por período e orçamento por centro de custo." actions={<Btn t={t} icon="plus" onClick={() => setNova(true)}>Novo contrato</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <KPI t={t} mini icon="file" label="Contratos ativos" value={contratos.filter((c) => c.ativo).length} kind="accent" />
        <KPI t={t} mini icon="cart" label="Itens sob contrato" value={contratos.length} kind="blue" />
        <KPI t={t} mini icon="barChart" label="Orçamento total" value={fmtBRLc(CP_CC.reduce((a, c) => a + c.orc, 0))} kind="green" />
      </div>

      <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 12 }}>Orçamento por centro de custo</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 26 }}>
        {CP_CC.map((c) => { const pct = Math.min(100, Math.round((c.gasto / c.orc) * 100)); const crit = pct >= 85; return (
          <Card t={t} key={c.id} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>{c.nome}</div><div style={{ fontSize: 11, color: t.muted, fontFamily: 'monospace' }}>{c.id}</div></div>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: crit ? uiTone(t, 'red').fg : t.accentText }}>{pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: t.hover, overflow: 'hidden', margin: '12px 0 8px' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: crit ? uiTone(t, 'red').fg : `linear-gradient(90deg, ${t.accent}, ${frHexToRgba(t.accent, 0.65)})` }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: t.muted }}><span>Gasto {fmtBRLc(c.gasto)}</span><span>Saldo {fmtBRLc(c.orc - c.gasto)}</span></div>
          </Card>
        ); })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>Contratos de fornecimento</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, width: 280, maxWidth: '100%', height: 42, padding: '0 14px', borderRadius: 11, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
          <Icon name="search" size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar contrato, fornecedor ou item…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 13.5, fontFamily: 'inherit' }} />
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {view.map((c) => { const pct = c.total ? Math.min(100, Math.round((c.consumido / c.total) * 100)) : 0; return (
          <Card t={t} key={c.id} hover style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: t.muted }}>{c.id}</span>
              <Badge t={t} kind={c.ativo ? 'green' : 'red'} dot>{c.ativo ? 'Vigente' : 'Encerrado'}</Badge>
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text, margin: '12px 0 4px' }}>{c.item}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: t.muted }}><Icon name="building" size={13} /> {c.forn}</div>
            <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 11, background: t.accentSoft, border: `1px solid ${frHexToRgba(t.accent, 0.2)}` }}><div style={{ fontSize: 9, fontWeight: 700, color: t.accentText }}>PREÇO NEGOCIADO</div><div style={{ fontSize: 16, fontWeight: 850, color: t.text, marginTop: 2 }}>{fmtBRLc(c.preco)}<span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>/{c.un}</span></div></div>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}><div style={{ fontSize: 9, fontWeight: 700, color: t.faint }}>VIGÊNCIA</div><div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, marginTop: 4 }}>{c.inicio} – {c.fim}</div></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: t.faint, marginBottom: 6 }}><span>CONSUMO DO CONTRATO</span><span>{c.consumido}/{c.total} {c.un}</span></div>
            <div style={{ height: 7, borderRadius: 6, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: pct >= 100 ? uiTone(t, 'red').fg : t.accent }} /></div>
          </Card>
        ); })}
      </div>
      {nova && (
        <CPModal t={t} title="Novo contrato de fornecimento" sub="Preço negociado por período." icon="file" onClose={() => setNova(false)}
          footer={<><Btn t={t} kind="ghost" onClick={() => setNova(false)}>Cancelar</Btn><CPBtnP t={t} icon="check" disabled={!ok} onClick={criar}>Criar contrato</CPBtnP></>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={cpLab(t)}>Fornecedor</label><div style={{ position: 'relative' }}><select value={f.forn} onChange={(e) => set('forn', e.target.value)} style={{ ...cpField(t), appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}><option value="">Selecione…</option>{forn.map((x) => <option key={x.id} value={x.nome}>{x.nome}</option>)}</select><Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 13, color: t.muted, pointerEvents: 'none' }} /></div></div>
            <div style={{ gridColumn: '1/-1' }}><label style={cpLab(t)}>Item</label><input value={f.item} onChange={(e) => set('item', e.target.value)} placeholder="Ex: Chapa Aço 1020 2mm" style={cpField(t)} /></div>
            <div><label style={cpLab(t)}>Preço negociado</label><input value={f.preco} onChange={(e) => set('preco', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0,00" style={cpField(t)} /></div>
            <div><label style={cpLab(t)}>Unidade</label><div style={{ position: 'relative' }}><select value={f.un} onChange={(e) => set('un', e.target.value)} style={{ ...cpField(t), appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>{['un', 'm', 'ch', 'lt', 'kg', 'br'].map((u) => <option key={u}>{u}</option>)}</select><Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 13, color: t.muted, pointerEvents: 'none' }} /></div></div>
            <div><label style={cpLab(t)}>Início</label><input value={f.inicio} onChange={(e) => set('inicio', e.target.value)} placeholder="01/2026" style={cpField(t)} /></div>
            <div><label style={cpLab(t)}>Fim</label><input value={f.fim} onChange={(e) => set('fim', e.target.value)} placeholder="12/2026" style={cpField(t)} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={cpLab(t)}>Volume contratado (qtd)</label><input value={f.total} onChange={(e) => set('total', e.target.value.replace(/[^0-9]/g, ''))} placeholder="Ex: 600" style={cpField(t)} /></div>
          </div>
        </CPModal>
      )}
    </div>
  );
}

// ---------- Rastreio / Follow-up (SC → Cotação → PC → Recebimento) ----------
function CPRastreio({ t, sc, cot, pc }) {
  const [q, setQ] = useStateCP('');
  // monta a cadeia a partir de cada PC, ligando à cotação e à SC de origem
  const cadeias = pc.map((p) => {
    const c = cot.find((x) => x.item === p.itens[0]?.nome) || null;
    const s = c && c.scId ? sc.find((x) => x.id === c.scId) : sc.find((x) => x.item === p.itens[0]?.nome);
    const etapas = [
      s ? { id: s.id, label: 'Solicitação', icon: 'file', tone: 'blue', info: s.solicitante + ' · ' + s.setor, done: true } : null,
      c ? { id: c.id, label: 'Cotação', icon: 'clipboard', tone: 'amber', info: c.propostas.length + ' proposta(s)', done: true } : null,
      { id: p.id, label: 'Pedido', icon: 'cart', tone: 'accent', info: p.forn + ' · ' + fmtBRLc(pcTotal(p)), done: ['aprovado', 'enviado', 'confirmado', 'recebido'].includes(p.status) },
      { id: p.doc || 'NF', label: 'Recebimento', icon: 'entrar', tone: 'green', info: p.status === 'recebido' ? (p.doc || 'entrada registrada') : 'aguardando', done: p.status === 'recebido' },
    ].filter(Boolean);
    return { pc: p, item: p.itens[0]?.nome || '—', etapas };
  });
  const ql = q.trim().toLowerCase();
  const view = cadeias.filter((c) => !ql || c.item.toLowerCase().includes(ql) || c.pc.id.toLowerCase().includes(ql) || c.pc.forn.toLowerCase().includes(ql) || c.etapas.some((e) => e.id.toLowerCase().includes(ql)));
  return (
    <div>
      <PageHeader t={t} title="Rastreio & Follow-up" subtitle="Acompanhe o processo de ponta a ponta: SC → Cotação → Pedido → Recebimento." />
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text', marginBottom: 18 }}>
        <Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por item, SC, PC, NF ou fornecedor…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {view.length === 0 && <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada encontrado" sub="Ajuste a busca." /></Card>}
        {view.map((c) => (
          <Card t={t} key={c.pc.id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{c.item}</span>
              <Badge t={t} kind={CP_PC_STATUS[c.pc.status][1]} dot>{CP_PC_STATUS[c.pc.status][0]}</Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'wrap' }}>
              {c.etapas.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: '1 1 180px', minWidth: 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: e.done ? uiTone(t, e.tone).fg : t.hover, color: e.done ? '#fff' : t.faint }}><Icon name={e.done ? 'check' : e.icon} size={16} /></span>
                      <div style={{ minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 800, color: t.text }}>{e.label}</div><div style={{ fontSize: 10.5, color: t.muted, fontFamily: 'monospace' }}>{e.id}</div></div>
                    </div>
                    <div style={{ fontSize: 11, color: t.muted, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.info}</div>
                  </div>
                  {i < c.etapas.length - 1 && <Icon name="chevronRight" size={16} style={{ color: t.faint, flexShrink: 0, margin: '0 6px' }} />}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------- Container stateful ----------
function CPModule({ active, theme, setActive }) {
  const t = frTokens(theme, CP_ACCENT, CP_ACCENT_T);
  const [sc, setSc] = useStateCP(CP_SC_SEED);
  const [cot, setCot] = useStateCP(CP_COT_SEED);
  const [pc, setPc] = useStateCP(CP_PC_SEED);
  const [forn, setForn] = useStateCP(CP_FORN_SEED);
  const [contratos, setContratos] = useStateCP(CP_CONTRATOS_SEED);
  const [toast, setToast] = useStateCP(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2400); };
  const updateSc = (id, patch) => setSc((xs) => xs.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const updatePc = (id, patch) => setPc((xs) => xs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const aprovarPc = (id) => setPc((xs) => xs.map((p) => (p.id === id ? { ...p, status: 'aprovado', aprovador: USER.name } : p)));
  const receber = (id, res) => {
    setPc((xs) => xs.map((p) => (p.id === id ? { ...p, status: 'recebido', doc: res && res.doc } : p)));
    // Bridge Compras→Financeiro (window.__finExtraAP) removido: ambos são módulos mock cadeados.
  };
  const avaliarForn = (nome, nota) => setForn((xs) => xs.map((f) => (f.nome === nome ? { ...f, nota: +nota } : f)));
  const addSc = (f) => { const n = 'SC-' + (332 + sc.length); setSc((xs) => [{ id: n, solicitante: f.solicitante, setor: f.setor, origem: f.origem || 'Compras', item: f.item.trim(), qtd: +f.qtd, un: f.un, prio: f.prio, cc: f.cc, just: f.just.trim() || '—', status: 'pendente', data: 'Agora' }, ...xs]); };
  const [demandas, setDemandas] = useStateCP(CP_DEMANDAS_SEED);
  const demandaParaSc = (d) => { addSc({ solicitante: USER.name, setor: d.setor, origem: d.origem, item: d.item, qtd: String(d.qtd), un: d.un, prio: d.prio, cc: d.cc, just: d.motivo + ' (demanda ' + d.id + ' de ' + d.origem + ')' }); setDemandas((xs) => xs.filter((x) => x.id !== d.id)); flash('Demanda de ' + d.origem + ' virou SC'); };
  window.__cpAddSc = addSc;
  const gerarCotacao = (s) => {
    const n = 'COT-' + (421 + cot.length);
    const base = 100 + Math.round(s.qtd * (5 + Math.random() * 8));
    const props = forn.slice(0, 3).map((fr, i) => ({ forn: fr.nome, valor: base * (1 + i * 0.07), prazoEntrega: (2 + i * 2) + ' dias', melhor: i === 0 }));
    setCot((xs) => [{ id: n, scId: s.id, item: s.item, qtd: s.qtd, un: s.un, setor: s.setor, status: 'analise', prazo: '7 dias', propostas: props }, ...xs]);
    updateSc(s.id, { status: 'cotando' });
    setActive && setActive('cp-cotacoes');
  };
  const aprovarCotacao = (c, prop) => {
    setCot((xs) => xs.map((x) => (x.id === c.id ? { ...x, status: 'aprovada' } : x)));
    if (c.scId) updateSc(c.scId, { status: 'atendida' });
    const n = 'PC-' + (2056 + pc.length);
    setPc((xs) => [{ id: n, forn: prop.forn, itens: [{ nome: c.item, qtd: c.qtd, un: c.un, valor: prop.valor / c.qtd }], emissao: 'Agora', prev: prop.prazoEntrega, status: 'aprovacao', aprovador: null }, ...xs]);
  };
  const recusarCotacao = (id) => setCot((xs) => xs.map((x) => (x.id === id ? { ...x, status: 'recusada' } : x)));

  let page;
  if (active === 'cp-sc') page = <CPSolicitacoes t={t} sc={sc} updateSc={updateSc} gerarCotacao={gerarCotacao} flash={flash} />;
  else if (active === 'cp-cotacoes') page = <CPCotacoes t={t} cot={cot} aprovarCotacao={aprovarCotacao} recusarCotacao={recusarCotacao} flash={flash} />;
  else if (active === 'cp-pedidos') page = <CPPedidos t={t} pc={pc} updatePc={updatePc} aprovarPc={aprovarPc} flash={flash} />;
  else if (active === 'cp-contratos') page = <CPContratos t={t} contratos={contratos} setContratos={setContratos} forn={forn} flash={flash} />;
  else if (active === 'cp-recebimento') page = <CPRecebimento t={t} pc={pc} receber={receber} forn={forn} avaliarForn={avaliarForn} flash={flash} />;
  else if (active === 'cp-rastreio') page = <CPRastreio t={t} sc={sc} cot={cot} pc={pc} />;
  else if (active === 'cp-aprovacoes') page = <CPAprovacoes t={t} sc={sc} pc={pc} updateSc={updateSc} aprovarPc={aprovarPc} updatePc={updatePc} flash={flash} />;
  else if (active === 'cp-fornecedores') page = <CPFornecedores t={t} forn={forn} setForn={setForn} flash={flash} />;
  else page = <CPPainel t={t} sc={sc} cot={cot} pc={pc} forn={forn} demandas={demandas} demandaParaSc={demandaParaSc} setActive={setActive} />;

  return (
    <div style={{ position: 'relative' }}>
      {page}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 80, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderRadius: 13, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 10px 30px rgba(0,0,0,.3)', maxWidth: '90vw' }}>
          <Icon name="check" size={18} /> {toast}
        </div>
      )}
    </div>
  );
}

function renderPageCompras(active, props) {
  return <CPModule active={active} theme={props.theme} setActive={props.setActive} />;
}
window.renderPageCompras = renderPageCompras;
