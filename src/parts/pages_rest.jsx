// pages_rest.jsx — remaining ERP pages (Tarefas, Elétrica, Avisos, Calculadora,
// Encomendar 3D, Quadro Gestão, Reposições, Confronto, Controle de Saída,
// Críticos, Permissões, Auditoria, Painel TI).
const { useState: useStateR } = React;

// ---------- shared: Kanban ----------
function Kanban({ t, columns }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))`, gap: 16, alignItems: 'start', overflowX: 'auto', paddingBottom: 6 }}>
      {columns.map((col) => (
        <div key={col.key} style={{ background: t.elevated, border: `1px solid ${t.border}`, borderRadius: 16, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px 12px' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: uiTone(t, col.tone).fg }} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: t.text, whiteSpace: 'nowrap' }}>{col.title}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 8, background: t.hover, color: t.muted }}>{col.cards.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {col.cards.map((c, i) => (
              <div key={i} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 13, padding: 14, cursor: 'grab' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                  <Badge t={t} kind={c.prio[1]} dot>{c.prio[0]}</Badge>
                  {c.op && <span style={{ fontSize: 10.5, fontWeight: 800, color: t.muted }}>OP {c.op}</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text, lineHeight: 1.35 }}>{c.title}</div>
                {c.desc && <div style={{ fontSize: 12, color: t.muted, marginTop: 6, lineHeight: 1.4 }}>{c.desc}</div>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{(c.tags || []).map((tg) => <span key={tg} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 7, background: t.hover, color: t.muted }}>{tg}</span>)}</div>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 10.5, flexShrink: 0 }}>{c.who}</span>
                </div>
              </div>
            ))}
            <button style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 38, borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: t.muted, border: `1px dashed ${t.border}` }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = t.accentText; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}><Icon name="plus" size={15} /> Adicionar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Tabs({ t, tabs, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}`, marginBottom: 20 }}>
      {tabs.map(([k, label]) => {
        const on = value === k;
        return <button key={k} onClick={() => onChange(k)} style={{ all: 'unset', cursor: 'pointer', height: 36, padding: '0 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? t.onAccent : t.muted, whiteSpace: 'nowrap' }}>{label}</button>;
      })}
    </div>
  );
}

// ---------- Quadro de Tarefas ----------
function PageTarefas({ t }) {
  const [tab, setTab] = useStateR('active');
  const cols = [
    { key: 'todo', title: 'A Fazer', tone: 'gray', cards: [
      { title: 'Cortar chapas p/ bandeja de ovos', op: '73001', prio: ['Alta', 'red'], tags: ['Usinagem'], who: 'CM', desc: '120 unidades · aço 1020' },
      { title: 'Preparar filamento PLA azul', op: '54120', prio: ['Baixa', 'blue'], tags: ['3D'], who: 'DM' },
    ] },
    { key: 'doing', title: 'Em Produção', tone: 'amber', cards: [
      { title: 'Montagem da esteira #4', op: '88210', prio: ['Média', 'amber'], tags: ['Montagem'], who: 'AP', desc: 'Aguardando rolamentos' },
    ] },
    { key: 'done', title: 'Concluído', tone: 'green', cards: [
      { title: 'Pintura epóxi do gabinete', op: '00009', prio: ['Média', 'amber'], tags: ['Acabamento'], who: 'JR' },
      { title: 'Solda estrutura inox', op: '48001', prio: ['Alta', 'red'], tags: ['Elétrica'], who: 'BT' },
    ] },
  ];
  return (
    <div>
      <PageHeader t={t} title="Gestão de Tarefas" subtitle="Fluxo de produção — arraste os cartões entre as colunas."
        actions={<Btn t={t} icon="plus">Nova tarefa</Btn>} />
      <Tabs t={t} value={tab} onChange={setTab} tabs={[['active', 'Ativas'], ['completed', 'Concluídas']]} />
      <Kanban t={t} columns={tab === 'active' ? cols.slice(0, 2) : [cols[2]]} />
    </div>
  );
}

// ---------- Quadro Elétrica ----------
function PageEletrica({ t }) {
  const cols = [
    { key: 'fila', title: 'Na Fila', tone: 'gray', cards: [
      { title: 'Painel de comando 24VDC', op: '90101', prio: ['Alta', 'red'], tags: ['Comando'], who: 'BT', desc: 'Siemens · 16 entradas DQ' },
    ] },
    { key: 'mont', title: 'Em Montagem', tone: 'blue', cards: [
      { title: 'Cablagem inversor 0,75kW', op: '23301', prio: ['Média', 'amber'], tags: ['Inversor'], who: 'CM' },
      { title: 'Quadro de distribuição', op: '27801', prio: ['Baixa', 'blue'], tags: ['QDC'], who: 'AP' },
    ] },
    { key: 'test', title: 'Em Teste', tone: 'amber', cards: [
      { title: 'Comissionamento esteira', op: '88210', prio: ['Alta', 'red'], tags: ['Teste'], who: 'JR' },
    ] },
    { key: 'ok', title: 'Aprovado', tone: 'green', cards: [
      { title: 'Sensor de nível', op: '00401', prio: ['Média', 'amber'], tags: ['Sensor'], who: 'DM' },
    ] },
  ];
  return (
    <div>
      <PageHeader t={t} title="Quadro Elétrica" subtitle="Acompanhe os serviços elétricos por etapa."
        actions={<Btn t={t} icon="plus">Novo serviço</Btn>} />
      <Kanban t={t} columns={cols} />
    </div>
  );
}

// ---------- Avisos ----------
function PageAvisos({ t }) {
  const avisos = [
    { titulo: 'Inventário geral dia 20/06', corpo: 'Estoque será congelado das 8h às 12h. Não registrar saídas nesse período.', tom: 'amber', autor: 'Ana P.', quando: 'há 2 h', fixo: true },
    { titulo: 'Novo fornecedor de inox', corpo: 'Aço Brasil aprovado para chapas 1020. Cadastrar nas próximas entradas.', tom: 'blue', autor: 'Bruno T.', quando: 'há 5 h' },
    { titulo: 'Filamento PLA em falta', corpo: 'Estoque de PLA azul abaixo do mínimo. Reposição solicitada ao setor de compras.', tom: 'red', autor: 'Rafael S.', quando: 'ontem', fixo: true },
    { titulo: 'Treinamento de EPI', corpo: 'Sexta-feira 14h no refeitório. Presença obrigatória para o setor de usinagem.', tom: 'green', autor: 'Júlia R.', quando: 'ontem' },
  ];
  return (
    <div>
      <PageHeader t={t} title="Avisos" subtitle="Mural de lembretes e comunicados da equipe."
        actions={<Btn t={t} icon="plus">Novo aviso</Btn>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {avisos.map((a, i) => (
          <Card t={t} key={i} hover style={{ padding: 18, borderTop: `3px solid ${uiTone(t, a.tom).fg}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, background: uiTone(t, a.tom).bg, color: uiTone(t, a.tom).fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="bell" size={18} /></span>
              {a.fixo && <Badge t={t} kind="amber">📌 Fixado</Badge>}
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text, margin: '14px 0 8px' }}>{a.titulo}</div>
            <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.5 }}>{a.corpo}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 13, borderTop: `1px solid ${t.border}` }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 9.5 }}>{a.autor.split(' ').map((x) => x[0]).join('')}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{a.autor}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: t.faint }}>{a.quando}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------- Calculadora ----------
function PageCalculadora({ t }) {
  const [qtd, setQtd] = useStateR('100');
  const [custo, setCusto] = useStateR('2.50');
  const [margem, setMargem] = useStateR('40');
  const [perda, setPerda] = useStateR('5');
  const q = parseFloat(qtd) || 0, c = parseFloat(custo) || 0, m = parseFloat(margem) || 0, p = parseFloat(perda) || 0;
  const custoBruto = q * c;
  const custoPerda = custoBruto * (1 + p / 100);
  const precoVenda = custoPerda * (1 + m / 100);
  const lucro = precoVenda - custoPerda;
  const fmt = (v) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const field = { boxSizing: 'border-box', height: 46, borderRadius: 12, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 14px', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 12, fontWeight: 600, color: t.muted, marginBottom: 8 };
  const rows = [['Custo bruto', fmt(custoBruto), false], [`Com perda (${p}%)`, fmt(custoPerda), false], [`Margem (${m}%)`, fmt(lucro), false]];
  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <PageHeader t={t} title="Calculadora de Custo" subtitle="Calcule o preço de venda a partir do custo, perda e margem." />
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <Card t={t} style={{ padding: 24, flex: '1 1 360px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={lab}>Quantidade</label><input value={qtd} onChange={(e) => setQtd(e.target.value.replace(/[^0-9.]/g, ''))} style={field} /></div>
            <div><label style={lab}>Custo unitário (R$)</label><input value={custo} onChange={(e) => setCusto(e.target.value.replace(/[^0-9.]/g, ''))} style={field} /></div>
            <div><label style={lab}>Perda (%)</label><input value={perda} onChange={(e) => setPerda(e.target.value.replace(/[^0-9.]/g, ''))} style={field} /></div>
            <div><label style={lab}>Margem (%)</label><input value={margem} onChange={(e) => setMargem(e.target.value.replace(/[^0-9.]/g, ''))} style={field} /></div>
          </div>
        </Card>
        <Card t={t} style={{ padding: 24, flex: '1 1 280px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: `linear-gradient(135deg, ${t.accent}, ${frHexToRgba(t.accent, 0.7)})`, border: 'none' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.85)', textTransform: 'uppercase' }}>Preço de venda sugerido</div>
          <div style={{ fontSize: 40, fontWeight: 850, color: '#fff', letterSpacing: '-.02em', margin: '8px 0 4px' }}>{fmt(precoVenda)}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)' }}>{fmt(precoVenda / (q || 1))} por unidade · lucro {fmt(lucro)}</div>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.22)', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {rows.map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#fff' }}><span style={{ opacity: .85 }}>{k}</span><span style={{ fontWeight: 800 }}>{v}</span></div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- Encomendar 3D (Vitrine) ----------
// VITRINE_PECAS (12 peças chumbadas, com `req` e `cat` inventados) REMOVIDO — a vitrine renderiza
// 100% de GET /producao-3d/parts, que passou a devolver `disponivel` (saldo pooled somado) e
// `pedidos` (Σ quantity_requested de requests não-rejeitadas) além dos campos técnicos.
//
// O que NÃO voltou, e por quê:
//   - TRILHAS POR CATEGORIA ("Embalagem de Ovos" / "Componentes 3D"): `products` não tem coluna de
//     categoria e todas as peças 3D dividem a mesma tag ["3D"] — não há como derivar os dois grupos.
//     No lugar entra uma grade única alfabética (o "Catálogo completo"). Volta se alguém criar a
//     dimensão de categoria no schema; inventá-la aqui seria repor o mock com outro nome.
//   - VITRINE_SPECS (densidade/loops/altura de camada): parâmetros de fatiamento que não existem em
//     lugar nenhum do backend. O hero passa a mostrar a descrição real da peça.
const VITRINE_SPECS_FALLBACK = 'Peça de fabricação sob demanda no setor de Produção 3D.';

function vitMinutes(m) { m = Math.round(m || 0); if (!m) return '—'; const h = Math.floor(m / 60), mm = m % 60; return (h ? h + 'h ' : '') + mm + 'min'; }

// Adapta a peça do catálogo 3D para o shape que os componentes da vitrine já consomem
// ({code, nome, img, stock, req, badge}) — mantém VitrinePoster/VitrineBadge/SolicitarPecaModal
// intactos e concentra a tradução num lugar só.
function vitAdapt(p) {
  const stock = p.disponivel || 0;
  return {
    product_id: p.product_id, code: p.code, nome: p.nome, img: p.image || null,
    stock: stock, req: p.pedidos || 0, minutes: p.minutes || 0, descricao: p.descricao || '',
    // Em estoque -> badge verde com o saldo; sem estoque -> laranja com o tempo de impressão.
    badge: stock > 0 ? { t: 'stock', v: stock + ' em Stock' } : { t: 'time', v: vitMinutes(p.minutes) + '/un.' },
  };
}

function VitrineBadge({ p }) {
  const stock = p.badge.t === 'stock';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, padding: '5px 11px', borderRadius: 999, color: '#fff', background: stock ? '#10b981' : '#f97316', boxShadow: '0 4px 10px rgba(0,0,0,.25)', whiteSpace: 'nowrap' }}>
      <Icon name={stock ? 'check' : 'clock'} size={13} /> {p.badge.v}
    </span>
  );
}

// Netflix-style poster: big image, name overlaid at the bottom.
function VitrinePoster({ t, p, slotPrefix, onSolicitar }) {
  return (
    <div style={{ position: 'relative', width: 230, flexShrink: 0, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'transform .18s ease, box-shadow .18s ease', border: `1px solid ${t.border}` }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = t.shadow; e.currentTarget.querySelector('.fr-poster-act').style.opacity = '1'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.querySelector('.fr-poster-act').style.opacity = '0'; }}>
      {p.img
        ? <img src={window.__asset(p.img)} alt={p.nome} style={{ display: 'block', width: '100%', height: 300, objectFit: 'cover', background: '#e9ebf0' }} />
        : <image-slot id={`${slotPrefix}-${p.code}`} shape="rect" placeholder="Render da peça" style={{ display: 'block', width: '100%', height: 300, background: '#e9ebf0' }}></image-slot>}
      <div style={{ position: 'absolute', top: 12, right: 12 }}><VitrineBadge p={p} /></div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '34px 14px 14px', background: 'linear-gradient(to top, rgba(8,10,16,.92) 8%, rgba(8,10,16,.55) 55%, transparent)', pointerEvents: 'none' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.7)', letterSpacing: '.04em' }}>{p.code}</div>
        <div style={{ fontSize: 14, fontWeight: 850, color: '#fff', lineHeight: 1.25, marginTop: 4 }}>{p.nome}</div>
      </div>
      <div className="fr-poster-act" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,10,16,.4)', opacity: 0, transition: 'opacity .18s ease' }}>
        <button onClick={(e) => { e.stopPropagation(); onSolicitar(p); }} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 11, fontSize: 13, fontWeight: 800, background: t.accent, color: '#fff', boxShadow: '0 6px 16px rgba(0,0,0,.3)' }}>
          <Icon name="send" size={16} /> Solicitar Peça
        </button>
      </div>
    </div>
  );
}

function VitrineRow({ t, title, items, slotPrefix, onSolicitar }) {
  const ref = React.useRef(null);
  const scroll = (dir) => { if (ref.current) ref.current.scrollBy({ left: dir * 520, behavior: 'smooth' }); };
  const arrow = (dir, name) => (
    <button onClick={() => scroll(dir)} style={{ all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', background: t.panel, border: `1px solid ${t.border}`, color: t.text, boxShadow: t.shadow }}
      onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = t.panel; }}>
      <Icon name={name} size={18} />
    </button>
  );
  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 850, color: t.text, letterSpacing: '-.01em' }}>{title}</h2>
        <div style={{ display: 'flex', gap: 8 }}>{arrow(-1, 'chevronLeft')}{arrow(1, 'chevronRight')}</div>
      </div>
      <div ref={ref} className="fr-scroll" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x proximity' }}>
        {items.map((p) => <div key={p.code} style={{ scrollSnapAlign: 'start' }}><VitrinePoster t={t} p={p} slotPrefix={slotPrefix} onSolicitar={onSolicitar} /></div>)}
      </div>
    </div>
  );
}

function SolicitarPecaModal({ t, peca, onClose, onConfirm }) {
  const [qtd, setQtd] = useStateR(1);
  const stock = peca.stock || 0;
  const n = Math.max(1, qtd);
  const separar = Math.min(n, stock);
  const produzir = Math.max(0, n - stock);
  const tipo = produzir > 0 ? 'producao' : 'separacao';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ position: 'relative', padding: '22px 24px', background: `linear-gradient(135deg, ${t.accent}, ${frHexToRgba(t.accent, 0.7)})`, color: '#fff' }}>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 16, right: 18, width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.18)' }}><Icon name="x" size={16} /></button>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: 'rgba(255,255,255,.8)' }}>{peca.code}</div>
          <div style={{ fontSize: 20, fontWeight: 850, marginTop: 5, maxWidth: 420, lineHeight: 1.2 }}>{peca.nome}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 999, background: 'rgba(255,255,255,.18)' }}><Icon name="box" size={13} /> {stock} em estoque</div>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 10 }}>Quantidade desejada</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setQtd((x) => Math.max(1, x - 1))} style={{ all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 700, color: t.text, border: `1px solid ${t.border}` }}>–</button>
              <input value={n} onChange={(e) => setQtd(Math.max(1, parseInt(e.target.value.replace(/[^0-9]/g, '')) || 1))} inputMode="numeric" style={{ width: 90, height: 44, textAlign: 'center', borderRadius: 12, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 20, fontWeight: 850, fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={() => setQtd((x) => x + 1)} style={{ all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 700, color: t.accentText, border: `1px solid ${t.border}` }}>+</button>
              <span style={{ fontSize: 13, color: t.muted }}>unidades</span>
            </div>
          </div>

          {/* breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {separar > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 14, background: uiTone(t, 'green').bg, border: `1px solid ${frHexToRgba('#10b981', 0.3)}` }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: uiTone(t, 'green').fg, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={19} /></span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>Separação no estoque</div><div style={{ fontSize: 12, color: t.muted }}>Disponível para retirada imediata.</div></div>
                <div style={{ fontSize: 22, fontWeight: 850, color: uiTone(t, 'green').fg }}>{separar}</div>
              </div>
            )}
            {produzir > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 14, background: uiTone(t, 'amber').bg, border: `1px solid ${frHexToRgba('#f59e0b', 0.3)}` }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: uiTone(t, 'amber').fg, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="printer" size={19} /></span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>Demanda de produção 3D</div><div style={{ fontSize: 12, color: t.muted }}>Excede o estoque — entra na fila de impressão.</div></div>
                <div style={{ fontSize: 22, fontWeight: 850, color: uiTone(t, 'amber').fg }}>{produzir}</div>
              </div>
            )}
          </div>

          <div style={{ fontSize: 12.5, color: t.muted, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
            <Icon name={tipo === 'producao' ? 'printer' : 'send'} size={15} style={{ color: t.accentText, flexShrink: 0 }} />
            {tipo === 'producao'
              ? <span>Será enviada uma <b style={{ color: t.text }}>solicitação de separação</b> ({separar}) e uma <b style={{ color: t.text }}>demanda de produção</b> ({produzir}) ao setor 3D.</span>
              : <span>Será enviada uma <b style={{ color: t.text }}>solicitação de separação</b> ({separar}) ao setor 3D.</span>}
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn t={t} icon="cart" onClick={() => onConfirm({ peca, qtd: n, separar, produzir, tipo })}>Adicionar ao pedido</Btn>
        </div>
      </div>
    </div>
  );
}

function PageEncomendar({ t: tBase, theme }) {
  const t = frTokens(theme, '#059669', '#34d399');
  const [q, setQ] = useStateR('');
  const [toast, setToast] = useStateR(null);
  const [sel, setSel] = useStateR(null);
  const [cart, setCart] = useStateR([]);
  const [cartOpen, setCartOpen] = useStateR(false);
  // OP é OBRIGATÓRIA: peça 3D tem tag ["3D"], que não está nos exemptTags do requests.controller
  // (camisetas/epi/ferramentas/insumos) -> sem op_code o POST /requests devolve OP_OBRIGATORIA_TAGS.
  const [opCode, setOpCode] = useStateR('');
  const [setor, setSetor] = useStateR('');
  const [enviando, setEnviando] = useStateR(false);

  // Catálogo real (mesmo hook das 4 telas do módulo 3D) + OPs abertas pro seletor.
  // Ambos são globals de outros parts; chamados incondicionalmente (regras de hooks) e já definidos
  // em tempo de render — os imports de main.jsx completam antes do primeiro render do React.
  const { items: parts, loading, error, reload } = window.useFR3DParts();
  const { items: clients } = window.useFRClients();
  const pecas = React.useMemo(() => parts.map(vitAdapt), [parts]);
  // OPs abertas, achatadas de clients[].ops[] (shape do adaptClient em pages_clientes.jsx:84):
  // { op_code, n, s, total_cost } — o status canônico vive em `s.s`, e não há `description`.
  // O backend recusa OP 'finalizada'/'encerrada' (OP_FINALIZADA), então filtramos as terminais aqui
  // pra não oferecer no select uma OP que o POST vai rejeitar.
  const ops = React.useMemo(() => {
    const TERMINAIS = ['concluido', 'concluida', 'finalizada', 'encerrada'];
    const out = [];
    (clients || []).forEach((c) => (c.ops || []).forEach((s) => {
      if (s && s.op_code && TERMINAIS.indexOf(String(s.s || '')) === -1) out.push({ op: s.op_code, cliente: c.nome || '' });
    }));
    return out.sort((a, b) => String(a.op).localeCompare(String(b.op)));
  }, [clients]);

  const solicitar = (peca) => setSel(peca);
  const addToCart = ({ peca, qtd }) => {
    setSel(null);
    setCart((xs) => {
      const i = xs.findIndex((x) => x.peca.code === peca.code);
      const recalc = (p, q2) => ({ peca: p, qtd: q2, separar: Math.min(q2, p.stock || 0), produzir: Math.max(0, q2 - (p.stock || 0)) });
      if (i >= 0) { const n = [...xs]; n[i] = recalc(peca, n[i].qtd + qtd); return n; }
      return [...xs, recalc(peca, qtd)];
    });
    setToast(`${peca.nome} adicionada ao pedido`);
    setTimeout(() => setToast(null), 2200);
  };
  const setCartQtd = (code, qtd) => setCart((xs) => xs.map((x) => x.peca.code === code ? { ...x, qtd, separar: Math.min(qtd, x.peca.stock || 0), produzir: Math.max(0, qtd - (x.peca.stock || 0)) } : x).filter((x) => x.qtd > 0));
  const removeCart = (code) => setCart((xs) => xs.filter((x) => x.peca.code !== code));

  // ENVIO REAL: um único POST /requests com a quantidade TOTAL por peça. Quem faz o split é o
  // backend (requests.controller): reserva o que há em estoque e joga o restante em demands_3d,
  // que alimenta o Kanban do módulo 3D. O separar/produzir da tela é só PREVIEW — se o estoque
  // mudar entre a montagem do carrinho e o envio, o backend decide, não a tela.
  const enviarTudo = async () => {
    if (enviando || !cart.length) return;
    if (!opCode) { setToast('Selecione a OP antes de enviar.'); setTimeout(() => setToast(null), 2600); return; }
    setEnviando(true);
    try {
      await window.FRApi.post('/requests', {
        sector: setor.trim() || 'Produção 3D',
        op_code: opCode,
        items: cart.map((x) => ({ product_id: x.peca.product_id, quantity: x.qtd })),
      });
      const sep = cart.reduce((a, x) => a + x.separar, 0);
      const prod = cart.reduce((a, x) => a + x.produzir, 0);
      const n = cart.length;
      setCart([]); setCartOpen(false); setOpCode(''); setSetor('');
      reload(); // saldo e ranking mudaram
      setToast(prod > 0 ? `${n} peça(s) enviada(s) · ${sep} p/ separação + ${prod} em produção 3D` : `${n} peça(s) enviada(s) p/ separação`);
      setTimeout(() => setToast(null), 3800);
    } catch (e) {
      const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
      setToast(g ? g(e) : 'Falha ao enviar o pedido.');
      setTimeout(() => setToast(null), 4200);
    } finally { setEnviando(false); }
  };

  const cartQ = cart.reduce((a, x) => a + x.qtd, 0);
  const ql = q.trim().toLowerCase();

  const porPedidos = React.useMemo(() => [...pecas].sort((a, b) => b.req - a.req), [pecas]);
  const hero = porPedidos[0] || null;
  // Só entra na trilha quem tem histórico (req > 0) — sem pedido nenhum, "Mais Solicitadas" seria
  // uma ordenação arbitrária disfarçada de ranking.
  const maisSolicitadas = porPedidos.filter((p) => p.req > 0).slice(0, 8);
  const results = pecas.filter((p) => !ql || p.nome.toLowerCase().includes(ql) || String(p.code).toLowerCase().includes(ql));
  const vit3dMobile = typeof window !== 'undefined' && window.innerWidth <= 640;

  if (loading && pecas.length === 0) return <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando vitrine…</Card>;
  if (error) return (
    <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
      <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
    </Card>
  );
  if (!pecas.length) return (
    <div>
      <h1 style={{ margin: '0 0 18px', fontSize: 27, fontWeight: 850, letterSpacing: '-.02em', color: t.text, display: 'flex', alignItems: 'center', gap: 11 }}><Icon name="printer" size={25} style={{ color: t.accentText }} /> Vitrine 3D</h1>
      <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhuma peça 3D no catálogo" sub="Marque produtos como 3D no Catálogo de Peças para que apareçam aqui." /></Card>
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* header + search */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 850, letterSpacing: '-.02em', color: t.text, display: 'flex', alignItems: 'center', gap: 11 }}><Icon name="printer" size={25} style={{ color: t.accentText }} /> Vitrine 3D</h1>
          <p style={{ margin: '7px 0 0', fontSize: 13.5, color: t.muted }}>Solicite peças para fabricação sob demanda.</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, width: 320, maxWidth: '100%', height: 46, padding: '0 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar peça por nome ou código…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
        </label>
      </div>

      {ql ? (
        <div>
          <div style={{ fontSize: 13, color: t.muted, marginBottom: 14 }}>{results.length} {results.length === 1 ? 'peça encontrada' : 'peças encontradas'}</div>
          {results.length === 0
            ? <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhuma peça encontrada" sub="Ajuste a busca para ver as peças da vitrine." /></Card>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {results.map((p) => <VitrinePoster key={p.code} t={t} p={p} slotPrefix="vitrine" onSolicitar={solicitar} />)}
              </div>}
        </div>
      ) : (
        <div>
          {/* hero — peça mais solicitada */}
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, marginBottom: 32, minHeight: vit3dMobile ? 'auto' : 320, display: 'flex', flexDirection: vit3dMobile ? 'column-reverse' : 'row', background: `linear-gradient(120deg, ${theme === 'dark' ? '#0b1f17' : '#06301f'} 0%, ${t.accent} 130%)` }}>
            <div style={{ flex: 1, minWidth: 0, padding: vit3dMobile ? '22px 22px 26px' : '34px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start', fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,.18)', color: '#fff', marginBottom: 16 }}><Icon name="zap" size={13} /> Mais solicitada</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.7)', letterSpacing: '.04em' }}>{hero.code}</div>
              <h2 style={{ margin: '6px 0 0', fontSize: vit3dMobile ? 26 : 32, fontWeight: 850, color: '#fff', letterSpacing: '-.02em', lineHeight: 1.1, maxWidth: 460 }}>{hero.nome}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 18px', flexWrap: 'wrap' }}>
                <VitrineBadge p={hero} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.9)' }}><Icon name="send" size={14} /> {hero.req} solicitações</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,.82)', lineHeight: 1.55, maxWidth: 440 }}>{hero.descricao || VITRINE_SPECS_FALLBACK}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
                <button onClick={() => solicitar(hero)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, height: 48, padding: '0 24px', borderRadius: 13, fontSize: 14, fontWeight: 800, background: '#fff', color: '#06301f', boxShadow: '0 8px 20px rgba(0,0,0,.25)' }}><Icon name="send" size={17} /> Solicitar Peça</button>
              </div>
            </div>
            <div style={{ width: vit3dMobile ? '100%' : '42%', minWidth: vit3dMobile ? 0 : 220, position: 'relative', flexShrink: 0 }}>
              {hero.img
                ? <img src={window.__asset(hero.img)} alt={hero.nome} style={{ display: 'block', width: '100%', height: vit3dMobile ? 200 : '100%', minHeight: vit3dMobile ? 200 : 260, objectFit: 'cover', background: '#e9ebf0' }} />
                : <image-slot id={`vitrine-hero-${hero.code}`} shape="rect" placeholder="Render da peça" style={{ display: 'block', width: '100%', height: vit3dMobile ? 200 : '100%', minHeight: vit3dMobile ? 200 : 260, background: '#e9ebf0' }}></image-slot>}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: vit3dMobile ? `linear-gradient(0deg, ${t.accent} 0%, transparent 38%)` : `linear-gradient(90deg, ${t.accent} 0%, transparent 28%)` }} />
            </div>
          </div>

          {/* Ranking REAL (Σ quantity_requested de requests não-rejeitadas). Se ninguém pediu nada
              ainda, a trilha some em vez de virar uma ordenação arbitrária chamada de "mais pedidas". */}
          {maisSolicitadas.length > 0 && (
            <VitrineRow t={t} title="Mais Solicitadas" items={maisSolicitadas} slotPrefix="vitrine-top" onSolicitar={solicitar} />
          )}

          {/* Trilhas por categoria REMOVIDAS: `products` não tem categoria e todas as peças 3D têm a
              mesma tag ["3D"]. No lugar, o catálogo inteiro em grade alfabética. */}
          <div style={{ marginBottom: 30 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 850, color: t.text, letterSpacing: '-.01em' }}>Catálogo completo <span style={{ fontSize: 13, fontWeight: 700, color: t.muted }}>({pecas.length})</span></h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {pecas.map((p) => <VitrinePoster key={p.code} t={t} p={p} slotPrefix="vitrine-all" onSolicitar={solicitar} />)}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 70, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderRadius: 13, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 10px 30px rgba(0,0,0,.3)', maxWidth: '90vw' }}>
          <Icon name="check" size={18} /> {toast}
        </div>
      )}
      {sel && <SolicitarPecaModal t={t} peca={sel} onClose={() => setSel(null)} onConfirm={addToCart} />}

      {cart.length > 0 && (
        <button onClick={() => setCartOpen(true)} style={{ all: 'unset', cursor: 'pointer', position: 'fixed', bottom: 24, right: 24, zIndex: 60, display: 'inline-flex', alignItems: 'center', gap: 11, height: 54, padding: '0 22px', borderRadius: 999, background: t.accent, color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: '0 10px 30px rgba(0,0,0,.32)' }}>
          <Icon name="cart" size={20} /> Ver pedido
          <span style={{ minWidth: 24, height: 24, padding: '0 7px', borderRadius: 999, background: 'rgba(255,255,255,.28)', display: 'grid', placeItems: 'center', fontSize: 12.5, fontWeight: 850 }}>{cartQ}</span>
        </button>
      )}

      {cartOpen && (
        <div onClick={() => setCartOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 66, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(640px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="cart" size={20} /></span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Pedido de peças</div><div style={{ fontSize: 12.5, color: t.muted }}>{cart.length} {cart.length === 1 ? 'peça' : 'peças'} · {cartQ} unidades</div></div>
              <button onClick={() => setCartOpen(false)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
            </div>
            <div className="fr-scroll" style={{ overflowY: 'auto', padding: '14px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cart.map((x) => (
                <div key={x.peca.code} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: t.elevated, border: `1px solid ${t.border}` }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="printer" size={18} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.peca.nome}</div>
                    <div style={{ display: 'flex', gap: 7, marginTop: 5, flexWrap: 'wrap' }}>
                      {x.separar > 0 && <Badge t={t} kind="green">{x.separar} separar</Badge>}
                      {x.produzir > 0 && <Badge t={t} kind="amber">{x.produzir} produzir</Badge>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <button onClick={() => setCartQtd(x.peca.code, x.qtd - 1)} style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}` }}>–</button>
                    <span style={{ minWidth: 26, textAlign: 'center', fontSize: 14, fontWeight: 800, color: t.text }}>{x.qtd}</span>
                    <button onClick={() => setCartQtd(x.peca.code, x.qtd + 1)} style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.accentText, border: `1px solid ${t.border}` }}>+</button>
                  </div>
                  <button onClick={() => removeCart(x.peca.code)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
                </div>
              ))}
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${t.border}` }}>
              {/* OP + setor: a OP é EXIGIDA pelo backend p/ peça 3D (tag "3D" não é isenta). Sem ela
                  o POST volta OP_OBRIGATORIA_TAGS — por isso o botão fica travado até escolher. */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <label style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 5 }}>OP <span style={{ color: uiTone(t, 'red').fg }}>*</span></div>
                  <select value={opCode} onChange={(e) => setOpCode(e.target.value)}
                    style={{ boxSizing: 'border-box', width: '100%', height: 42, padding: '0 11px', borderRadius: 11, border: `1px solid ${opCode ? t.border : uiTone(t, 'red').fg}`, background: t.elevated, color: t.text, fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }}>
                    <option value="">{ops.length ? 'Selecione a OP…' : 'Nenhuma OP em andamento'}</option>
                    {ops.map((o) => <option key={o.op} value={o.op}>{o.op}{o.cliente ? ' — ' + o.cliente : ''}</option>)}
                  </select>
                </label>
                <label style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 5 }}>Setor</div>
                  <input value={setor} onChange={(e) => setSetor(e.target.value)} placeholder="Produção 3D"
                    style={{ boxSizing: 'border-box', width: '100%', height: 42, padding: '0 11px', borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 18, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, color: t.muted }}>Separação <b style={{ color: uiTone(t, 'green').fg }}>{cart.reduce((a, x) => a + x.separar, 0)}</b></span>
                <span style={{ fontSize: 12.5, color: t.muted }}>Produção 3D <b style={{ color: uiTone(t, 'amber').fg }}>{cart.reduce((a, x) => a + x.produzir, 0)}</b></span>
                <span style={{ fontSize: 11.5, color: t.faint, marginLeft: 'auto' }}>prévia — o split final é do estoque no momento do envio</span>
              </div>
              <button onClick={enviarTudo} disabled={enviando || !opCode}
                style={{ all: 'unset', boxSizing: 'border-box', cursor: (enviando || !opCode) ? 'not-allowed' : 'pointer', width: '100%', height: 48, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 14, fontWeight: 800, background: (enviando || !opCode) ? t.elevated : t.accent, color: (enviando || !opCode) ? t.faint : '#fff', boxShadow: (enviando || !opCode) ? 'none' : `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` }}>
                <Icon name="send" size={18} /> {enviando ? 'Enviando…' : !opCode ? 'Selecione a OP para enviar' : 'Enviar pedido ao setor 3D'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Reposições ----------
// LIGADA a /replenishments. REP_SEED (4 pedidos) e REP_CATALOGO (10 materiais) REMOVIDOS.
//
// LIFECYCLE — o da tela agora é o do backend, não um paralelo:
//   pendente --authorize'reservar'--> em_preparo --authorize'entregar'--> concluido
//      ^                                  |                                   |
//      +------ authorize'reverter' -------+-----------------------------------+
//   qualquer (≠concluido/cancelada) --DELETE--> cancelada
// O 'enviado' do mock virou 'concluido': "confirmar envio" É o action='entregar' do backend, que dá
// a BAIXA FÍSICA (StockService.consume). O mock parava antes disso e nunca debitava estoque.
const REP_ENVIO_METODOS = [
  { id: 'correios-pac', nome: 'Correios — PAC', icon: 'truck' },
  { id: 'correios-sedex', nome: 'Correios — Sedex', icon: 'truck' },
  { id: 'jadlog', nome: 'Jadlog', icon: 'truck' },
  { id: 'transportadora', nome: 'Transportadora', icon: 'truck' },
  { id: 'retirada', nome: 'Retirada no local', icon: 'box' },
];
const repStatusMeta = {
  pendente: ['Pendente', 'amber'], em_preparo: ['Em preparo', 'blue'],
  concluido: ['Concluído', 'green'], cancelada: ['Cancelada', 'red'],
};
const repMetodoNome = (id) => (REP_ENVIO_METODOS.find((m) => m.id === id) || {}).nome || id || '—';
function repErr(e) { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; }
function repNum(v) { const f = window.FRAdapters && window.FRAdapters.parseNumber; return f ? f(v) : (parseFloat(v) || 0); }
function repMoney(v) { return 'R$ ' + repNum(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// Backend -> shape da tela. `id` (uuid) é a identidade; `order_number` é só rótulo.
function repAdapt(r) {
  r = r || {};
  return {
    id: r.id, n: r.order_number || '—', cliente: r.client_name || '', cidade: r.city_state || '',
    status: r.status || 'pendente',
    // total_value é campo PRÓPRIO do backend. A tela NÃO recalcula preco×qtd: o mock fazia isso e
    // superestimava o pedido entregue em parte (valorizava pelo pedido, não pelo entregue).
    valor: repNum(r.total_value),
    envio: r.tracking_code || r.shipping_info ? { rastreio: r.tracking_code || '', metodo: r.shipping_info || '' } : null,
    itens: (r.items || []).map((i) => {
      const p = i.products || {};
      return {
        id: i.id, product_id: i.product_id, sku: p.sku || '—', nome: p.name || '—', un: p.unit || '',
        qtd: repNum(i.qty_requested), sep: repNum(i.quantity), preco: repNum(p.unit_price),
        // stock_available é o LIVRE agora (já descontada a reserva deste pedido). O teto de separação
        // é sep + disponivel: o que este item já segurou mais o que ainda sobra no estoque.
        disponivel: repNum(p.stock_available),
      };
    }),
  };
}
function useFRReplenishments() {
  const R = window.React;
  const [items, setItems] = R.useState([]);
  const [loading, setLoading] = R.useState(true);
  const [error, setError] = R.useState(null);
  const mounted = R.useRef(true);
  const load = R.useCallback(function () {
    setError(null);
    window.FRApi.get('/replenishments', { skipLoading: true })
      .then((res) => { if (!mounted.current) return; const rows = Array.isArray(res && res.data) ? res.data : []; setItems(rows.map(repAdapt)); setLoading(false); })
      .catch((e) => { if (!mounted.current) return; setError(repErr(e)); setLoading(false); });
  }, []);
  R.useEffect(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);
  return { items, loading, error, reload: load };
}

const repSepTot = (r) => r.itens.reduce((a, i) => a + i.sep, 0);
const repQtdTot = (r) => r.itens.reduce((a, i) => a + i.qtd, 0);

function RepItemRow({ t, it, onSep, readOnly }) {
  // Teto = o que este item já reservou + o que ainda está livre no estoque.
  const maxSep = Math.min(it.qtd, it.sep + it.disponivel);
  const completo = it.sep >= it.qtd;
  const semEstoque = maxSep < it.qtd;
  const set = (v) => onSep(Math.max(0, Math.min(maxSep, v)));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 13, background: t.elevated, border: `1px solid ${completo ? frHexToRgba('#10b981', .4) : t.border}` }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center', background: completo ? uiTone(t, 'green').bg : t.hover, color: completo ? uiTone(t, 'green').fg : t.muted }}>
        <Icon name={completo ? 'check' : 'box'} size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.nome}</div>
        <div style={{ fontSize: 11.5, color: t.muted }}>
          {it.sku} · pedido {it.qtd}{it.un ? ' ' + it.un : ''} · livre {it.disponivel}
          {semEstoque && <span style={{ color: uiTone(t, 'amber').fg, fontWeight: 700 }}> · estoque insuficiente</span>}
        </div>
      </div>
      {readOnly ? (
        <span style={{ fontSize: 14, fontWeight: 850, color: t.text, flexShrink: 0 }}>{it.sep}/{it.qtd}</span>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <button onClick={() => set(it.sep - 1)} disabled={it.sep <= 0} style={{ all: 'unset', cursor: it.sep <= 0 ? 'not-allowed' : 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}`, opacity: it.sep <= 0 ? .4 : 1 }}>–</button>
          <input value={it.sep} onChange={(e) => set(parseInt(String(e.target.value).replace(/[^0-9]/g, '')) || 0)} inputMode="numeric"
            style={{ width: 52, height: 30, textAlign: 'center', borderRadius: 8, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
          <span style={{ fontSize: 12, color: t.faint, minWidth: 26 }}>/{it.qtd}</span>
          <button onClick={() => set(it.sep + 1)} disabled={it.sep >= maxSep} style={{ all: 'unset', cursor: it.sep >= maxSep ? 'not-allowed' : 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.accentText, border: `1px solid ${t.border}`, opacity: it.sep >= maxSep ? .4 : 1 }}>+</button>
        </div>
      )}
    </div>
  );
}

// Detalhe em tela cheia: separar (reservar), enviar (entregar, PARCIAL permitido), reverter, rastrear.
function RepDetail({ t, rep, busy, onClose, onReservar, onEntregar, onReverter, onRastrear }) {
  const [sep, setSep] = useStateR(() => rep.itens.map((i) => i.sep));
  const [step, setStep] = useStateR(rep.status === 'concluido' ? 'envio' : 'separar');
  const [metodo, setMetodo] = useStateR(rep.envio ? rep.envio.metodo : '');
  const [rastreio, setRastreio] = useStateR(rep.envio ? rep.envio.rastreio : '');
  React.useEffect(() => { setSep(rep.itens.map((i) => i.sep)); }, [rep]);

  const concluido = rep.status === 'concluido';
  const cancelada = rep.status === 'cancelada';
  const readOnly = concluido || cancelada || busy;
  const sepTot = sep.reduce((a, b) => a + b, 0);
  const qtdTot = repQtdTot(rep);
  const pct = qtdTot ? Math.round((sepTot / qtdTot) * 100) : 0;
  // ENVIO PARCIAL PERMITIDO: basta ter separado ALGUMA coisa. O backend consome o separado e libera a
  // reserva remanescente sozinho. O mock exigia sep >= qtd em TODOS os itens, o que travava para
  // sempre qualquer pedido cujo estoque fosse menor que o pedido.
  const podeEnviar = sepTot > 0;
  const parcial = sepTot < qtdTot;
  const itensPayload = () => rep.itens.map((i, idx) => ({ id: i.id, quantity: sep[idx] }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 65, background: t.bg, overflowY: 'auto' }} className="fr-scroll">
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '22px 20px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: t.muted }}><Icon name="chevronLeft" size={18} /> Voltar</button>
          <span style={{ marginLeft: 'auto' }}><Badge t={t} kind={repStatusMeta[rep.status] ? repStatusMeta[rep.status][1] : 'gray'} dot>{repStatusMeta[rep.status] ? repStatusMeta[rep.status][0] : rep.status}</Badge></span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 850, color: t.text, letterSpacing: '-.02em' }}>{rep.n}</div>
          <div style={{ fontSize: 13.5, color: t.muted, marginTop: 3 }}>{rep.cliente} · {rep.cidade} · {repMoney(rep.valor)}</div>
        </div>

        {!concluido && !cancelada && (
          <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}`, marginBottom: 20 }}>
            {[['separar', '1 · Separar materiais'], ['envio', '2 · Dados de envio']].map(([k, label]) => {
              const on = step === k, dis = k === 'envio' && !podeEnviar;
              return <button key={k} onClick={() => !dis && setStep(k)} disabled={dis} style={{ all: 'unset', cursor: dis ? 'not-allowed' : 'pointer', height: 36, padding: '0 16px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? '#fff' : dis ? t.faint : t.muted }}>{label}</button>;
            })}
          </div>
        )}

        {step === 'separar' && !concluido && !cancelada && (
          <Card t={t} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>Materiais <span style={{ color: t.muted, fontWeight: 600 }}>({sepTot}/{qtdTot} · {pct}%)</span></div>
              <button onClick={() => setSep(rep.itens.map((i) => Math.min(i.qtd, i.sep + i.disponivel)))} disabled={readOnly}
                style={{ all: 'unset', cursor: readOnly ? 'not-allowed' : 'pointer', fontSize: 12.5, fontWeight: 700, color: t.accentText, opacity: readOnly ? .5 : 1 }}>Separar tudo disponível</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {rep.itens.map((it, idx) => (
                <RepItemRow key={it.id} t={t} it={{ ...it, sep: sep[idx] }} readOnly={readOnly}
                  onSep={(v) => setSep((xs) => xs.map((x, i) => (i === idx ? v : x)))} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <Btn t={t} kind="ghost" icon="check" onClick={() => onReservar(rep, itensPayload())}>{busy ? 'Salvando…' : 'Salvar separação'}</Btn>
              <Btn t={t} icon="arrowRight" onClick={() => podeEnviar && setStep('envio')}>Ir para o envio</Btn>
            </div>
          </Card>
        )}

        {(step === 'envio' || concluido) && !cancelada && (
          <Card t={t} style={{ padding: 20 }}>
            {concluido ? (
              <>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text, marginBottom: 16 }}>Envio</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  <div style={{ flex: '1 1 200px', padding: '12px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>MÉTODO DE ENVIO</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginTop: 4 }}>{repMetodoNome(rep.envio && rep.envio.metodo)}</div>
                  </div>
                  <div style={{ flex: '1 1 200px', padding: '12px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>CÓDIGO DE RASTREIO</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>{(rep.envio && rep.envio.rastreio) || 'Não informado'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
                  {rep.itens.map((it) => <RepItemRow key={it.id} t={t} it={it} readOnly />)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => onRastrear(rep)} disabled={!(rep.envio && rep.envio.rastreio) || busy}
                    style={{ all: 'unset', cursor: !(rep.envio && rep.envio.rastreio) || busy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, color: !(rep.envio && rep.envio.rastreio) ? t.faint : t.accentText, border: `1px solid ${t.border}` }}>
                    <Icon name="search" size={16} /> Rastrear encomenda
                  </button>
                  {/* Reverter desfaz a BAIXA FÍSICA (receive + reserve de volta) e limpa envio/rastreio. */}
                  <Btn t={t} kind="ghost" icon="refresh" onClick={() => onReverter(rep)}>{busy ? 'Revertendo…' : 'Reverter entrega'}</Btn>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text, marginBottom: 4 }}>Dados de envio</div>
                <div style={{ fontSize: 12.5, color: t.muted, marginBottom: 16 }}>
                  Confirmar o envio dá <b style={{ color: t.text }}>baixa física</b> de {sepTot} un. no estoque.
                  {parcial && <span style={{ color: uiTone(t, 'amber').fg }}> Envio parcial: a reserva dos {qtdTot - sepTot} restantes é liberada.</span>}
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 8 }}>Método de envio *</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {REP_ENVIO_METODOS.map((m) => {
                    const on = metodo === m.id;
                    return <button key={m.id} onClick={() => setMetodo(m.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: on ? t.accent : t.elevated, color: on ? '#fff' : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}><Icon name={m.icon} size={15} /> {m.nome}</button>;
                  })}
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 8 }}>Código de rastreio · opcional</div>
                <input value={rastreio} onChange={(e) => setRastreio(e.target.value.toUpperCase())} placeholder="Ex: BR123456789BR"
                  style={{ boxSizing: 'border-box', width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 14, fontFamily: 'ui-monospace, monospace', outline: 'none', marginBottom: 18 }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => metodo && podeEnviar && onEntregar(rep, itensPayload(), metodo, rastreio.trim())} disabled={!metodo || !podeEnviar || busy}
                    style={{ all: 'unset', cursor: (!metodo || !podeEnviar || busy) ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, height: 46, padding: '0 22px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: (!metodo || !podeEnviar || busy) ? t.elevated : t.accent, color: (!metodo || !podeEnviar || busy) ? t.faint : '#fff' }}>
                    <Icon name="send" size={17} /> {busy ? 'Enviando…' : !metodo ? 'Escolha o método' : parcial ? `Confirmar envio parcial (${sepTot})` : 'Confirmar envio'}
                  </button>
                </div>
              </>
            )}
          </Card>
        )}

        {cancelada && (
          <Card t={t} style={{ padding: 20 }}>
            <div style={{ fontSize: 13.5, color: t.muted, marginBottom: 14 }}>Pedido cancelado — a reserva de estoque foi liberada.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{rep.itens.map((it) => <RepItemRow key={it.id} t={t} it={it} readOnly />)}</div>
          </Card>
        )}
      </div>
    </div>
  );
}

// Modal de criar/editar. `order_number` é campo do usuário: o backend NÃO o gera (coluna NOT NULL
// preenchida pelo body). Vem sugerido a partir do maior existente, mas é editável — é número de
// documento de negócio, não id técnico.
function RepNovoModal({ t, edit, sugestaoNumero, produtos, salvando, erro, onClose, onSave }) {
  const [numero, setNumero] = useStateR(edit ? edit.n : sugestaoNumero);
  const [cliente, setCliente] = useStateR(edit ? edit.cliente : '');
  const [cidade, setCidade] = useStateR(edit ? edit.cidade : '');
  const [itens, setItens] = useStateR(edit ? edit.itens.map((i) => ({ product_id: i.product_id, sku: i.sku, nome: i.nome, qtd: i.qtd, preco: i.preco, disponivel: i.disponivel })) : []);
  const [q, setQ] = useStateR('');
  const ql = q.trim().toLowerCase();
  const cat = (produtos || []).filter((p) => !ql || p.nome.toLowerCase().includes(ql) || String(p.sku).toLowerCase().includes(ql)).slice(0, 40);
  const naLista = (id) => itens.some((i) => i.product_id === id);
  const addItem = (p) => !naLista(p.product_id) && setItens((xs) => xs.concat([{ ...p, qtd: 1 }]));
  const setQtd = (id, v) => setItens((xs) => xs.map((i) => (i.product_id === id ? { ...i, qtd: Math.max(1, parseInt(String(v).replace(/[^0-9]/g, '')) || 1) } : i)));
  const delItem = (id) => setItens((xs) => xs.filter((i) => i.product_id !== id));
  const total = itens.reduce((a, i) => a + i.qtd * i.preco, 0);
  const valid = numero.trim() && cliente.trim() && cidade.trim() && itens.length;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(720px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center' }}><Icon name="refresh" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{edit ? 'Editar pedido' : 'Novo pedido de reposição'}</div><div style={{ fontSize: 12.5, color: t.muted }}>{itens.length} item(ns) · {repMoney(total)}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '18px 22px', flex: 1 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {[['Nº do pedido *', numero, setNumero, '1 1 150px'], ['Cliente / Granja *', cliente, setCliente, '1 1 200px'], ['Cidade - UF *', cidade, setCidade, '1 1 160px']].map(([lab, val, set, flex]) => (
              <label key={lab} style={{ flex, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 5 }}>{lab}</div>
                <input value={val} onChange={(e) => set(e.target.value)} style={{ boxSizing: 'border-box', width: '100%', height: 42, padding: '0 12px', borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }} />
              </label>
            ))}
          </div>

          {itens.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {itens.map((i) => (
                <div key={i.product_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.nome}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>{i.sku} · livre {i.disponivel} · {repMoney(i.preco)}</div>
                  </div>
                  <input value={i.qtd} onChange={(e) => setQtd(i.product_id, e.target.value)} inputMode="numeric"
                    style={{ width: 60, height: 34, textAlign: 'center', borderRadius: 9, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                  <button onClick={() => delItem(i.product_id)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
                </div>
              ))}
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42, padding: '0 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text', marginBottom: 10 }}>
            <Icon name="search" size={17} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar material por nome ou SKU…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 13.5, fontFamily: 'inherit' }} />
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }} className="fr-scroll">
            {cat.length === 0 && <div style={{ padding: 14, textAlign: 'center', fontSize: 12.5, color: t.muted }}>Nenhum material encontrado.</div>}
            {cat.map((p) => {
              const dentro = naLista(p.product_id);
              return (
                <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: `1px solid ${t.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>{p.sku} · livre {p.disponivel} · {repMoney(p.preco)}</div>
                  </div>
                  <button onClick={() => addItem(p)} disabled={dentro} style={{ all: 'unset', cursor: dentro ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, padding: '6px 11px', borderRadius: 8, background: dentro ? t.hover : t.accentSoft, color: dentro ? t.faint : t.accentText }}>{dentro ? 'Na lista' : 'Adicionar'}</button>
                </div>
              );
            })}
          </div>
        </div>
        {erro && <div style={{ padding: '10px 22px', fontSize: 12.5, fontWeight: 600, color: uiTone(t, 'red').fg, background: uiTone(t, 'red').bg }}>{erro}</div>}
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <button onClick={() => valid && !salvando && onSave({ order_number: numero.trim(), client_name: cliente.trim(), city_state: cidade.trim(), total_value: total, items: itens.map((i) => ({ product_id: i.product_id, qty_requested: i.qtd })) })}
            disabled={!valid || salvando}
            style={{ all: 'unset', cursor: (!valid || salvando) ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: (!valid || salvando) ? t.elevated : t.accent, color: (!valid || salvando) ? t.faint : '#fff' }}>
            <Icon name="check" size={17} /> {salvando ? 'Salvando…' : edit ? 'Salvar alterações' : 'Criar pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageReposicoes({ t }) {
  const { items: reps, loading, error, reload } = useFRReplenishments();
  const [tab, setTab] = useStateR('pendente');
  const [openId, setOpenId] = useStateR(null);
  const [modal, setModal] = useStateR(null);      // { edit } | { novo: true }
  const [tracking, setTracking] = useStateR(null); // { code, loading, data, erro }
  const [busy, setBusy] = useStateR(false);
  const [erroModal, setErroModal] = useStateR(null);
  const [toast, setToast] = useStateR(null);
  const [produtos, setProdutos] = useStateR([]);
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);
  // Catálogo de materiais do modal (GET /products, com stock agregado pooled).
  React.useEffect(() => {
    window.FRApi.get('/products', { skipLoading: true })
      .then((r) => setProdutos((Array.isArray(r.data) ? r.data : []).map((p) => ({
        product_id: p.id, sku: p.sku || '—', nome: p.name || '—', preco: repNum(p.unit_price),
        disponivel: Math.max(0, repNum(p.stock && p.stock.quantity_on_hand) - repNum(p.stock && p.stock.quantity_reserved)),
      })))).catch(() => setProdutos([]));
  }, []);

  const cur = reps.find((r) => r.id === openId) || null;
  const tabs = [['pendente', 'Pendentes'], ['em_preparo', 'Em preparo'], ['concluido', 'Concluídos'], ['cancelada', 'Cancelados']];
  const view = reps.filter((r) => r.status === tab);
  // Sugestão do próximo número a partir do MAIOR existente no backend (não do tamanho do array, que
  // era o do mock e colidia). Ainda é sugestão: o campo é editável e o backend não gera.
  const proxNumero = React.useMemo(() => {
    const nums = reps.map((r) => parseInt(String(r.n).replace(/\D/g, ''), 10)).filter((x) => !isNaN(x));
    return 'REP-' + (nums.length ? Math.max.apply(null, nums) + 1 : 1001);
  }, [reps]);

  const run = async (fn, msgOk) => {
    if (busy) return false;
    setBusy(true);
    try { await fn(); reload(); setToast({ kind: 'ok', msg: msgOk }); return true; }
    catch (e) { setToast({ kind: 'err', msg: repErr(e) }); return false; }
    finally { setBusy(false); }
  };

  const criar = async (payload) => {
    setErroModal(null); setBusy(true);
    try { await window.FRApi.post('/replenishments', payload); setModal(null); reload(); setToast({ kind: 'ok', msg: 'Pedido criado.' }); }
    catch (e) { setErroModal(repErr(e)); } finally { setBusy(false); }
  };
  const editar = async (id, payload) => {
    setErroModal(null); setBusy(true);
    try { await window.FRApi.put('/replenishments/' + id, payload); setModal(null); reload(); setToast({ kind: 'ok', msg: 'Pedido atualizado.' }); }
    catch (e) { setErroModal(repErr(e)); } finally { setBusy(false); }
  };
  const reservar = (rep, items) => run(
    () => window.FRApi.put(`/replenishments/${rep.id}/authorize`, { action: 'reservar', items }),
    'Separação salva — estoque reservado.');
  const entregar = async (rep, items, metodo, rastreio) => {
    const tot = items.reduce((a, i) => a + i.quantity, 0);
    const parcial = tot < repQtdTot(rep);
    const okRes = await run(
      () => window.FRApi.put(`/replenishments/${rep.id}/authorize`, { action: 'entregar', items, shipping_info: metodo, tracking_code: rastreio || null }),
      parcial ? `Envio parcial confirmado — ${tot} un. baixadas, reserva restante liberada.` : `Envio confirmado — ${tot} un. baixadas do estoque.`);
    if (okRes) setOpenId(null);
  };
  const reverter = (rep) => run(
    () => window.FRApi.put(`/replenishments/${rep.id}/authorize`, { action: 'reverter', items: rep.itens.map((i) => ({ id: i.id, quantity: i.sep })) }),
    'Entrega revertida — estoque devolvido e re-empenhado.');
  const cancelar = (rep) => {
    if (!window.confirm(`Cancelar o pedido ${rep.n}?\n\nA reserva de estoque é liberada. O pedido fica no histórico como cancelado.`)) return;
    run(() => window.FRApi.delete('/replenishments/' + rep.id), 'Pedido cancelado — reserva liberada.').then((ok) => { if (ok) setOpenId(null); });
  };
  // Rastreio REAL: GET /tracking/:code. Depende de WONCA_API_KEY no ambiente — sem ela o backend
  // devolve 503 e a tela diz isso, em vez de fingir que rastreou.
  const rastrear = async (rep) => {
    const code = rep.envio && rep.envio.rastreio;
    if (!code) return;
    setTracking({ code, loading: true });
    try { const r = await window.FRApi.get('/tracking/' + encodeURIComponent(code), { skipLoading: true }); setTracking({ code, data: r.data }); }
    catch (e) { setTracking({ code, erro: repErr(e) }); }
  };

  if (loading && reps.length === 0) return <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando reposições…</Card>;
  if (error) return (
    <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
      <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
    </Card>
  );

  return (
    <div>
      <PageHeader t={t} title="Reposições" subtitle="Pedidos de reposição para clientes — separação, envio e baixa de estoque."
        actions={<><Btn t={t} kind="ghost" icon="refresh" onClick={() => reload()}>Atualizar</Btn><Btn t={t} icon="plus" onClick={() => { setErroModal(null); setModal({ novo: true }); }}>Novo pedido</Btn></>} />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="clipboard" label="Pendentes" value={reps.filter((r) => r.status === 'pendente').length} kind="amber" />
        <KPI t={t} mini icon="box" label="Em preparo" value={reps.filter((r) => r.status === 'em_preparo').length} kind="blue" />
        <KPI t={t} mini icon="check" label="Concluídos" value={reps.filter((r) => r.status === 'concluido').length} kind="green" />
        <KPI t={t} mini icon="barChart" label="Valor em aberto" value={repMoney(reps.filter((r) => r.status === 'pendente' || r.status === 'em_preparo').reduce((a, r) => a + r.valor, 0))} kind="accent" />
      </div>

      <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}`, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(([k, label]) => { const on = tab === k, n = reps.filter((r) => r.status === k).length; return (
          <button key={k} onClick={() => setTab(k)} style={{ all: 'unset', cursor: 'pointer', height: 38, padding: '0 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? '#fff' : t.muted }}>{label} <span style={{ fontSize: 11, fontWeight: 800, opacity: on ? 1 : .6 }}>({n})</span></button>
        ); })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada por aqui" sub="Nenhum pedido de reposição neste status." /></Card></div>}
        {view.map((r) => {
          const sepTot = repSepTot(r), qtdTot = repQtdTot(r), pct = qtdTot ? Math.round((sepTot / qtdTot) * 100) : 0;
          const podeEditar = r.status === 'pendente';
          const podeCancelar = r.status !== 'concluido' && r.status !== 'cancelada';
          return (
            <Card t={t} key={r.id} hover style={{ padding: 18 }}>
              <div onClick={() => setOpenId(r.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 850, color: t.text }}>{r.n}</div>
                    <div style={{ fontSize: 12.5, color: t.muted, marginTop: 2 }}>{r.cliente}</div>
                    <div style={{ fontSize: 11.5, color: t.faint }}>{r.cidade}</div>
                  </div>
                  <Badge t={t} kind={repStatusMeta[r.status] ? repStatusMeta[r.status][1] : 'gray'} dot>{repStatusMeta[r.status] ? repStatusMeta[r.status][0] : r.status}</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14 }}>
                  <div><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>VALOR</div><div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>{repMoney(r.valor)}</div></div>
                  <div style={{ textAlign: 'right', fontSize: 11.5, color: t.muted }}>{r.itens.length} item(ns)<br />{sepTot}/{qtdTot} separado</div>
                </div>
                <div style={{ height: 7, borderRadius: 6, background: t.hover, overflow: 'hidden', marginTop: 10 }}><div style={{ height: '100%', width: pct + '%', borderRadius: 6, background: t.accent }} /></div>
                {r.status === 'concluido' && r.envio && (
                  <div style={{ marginTop: 10, fontSize: 11.5, color: t.muted, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>{repMetodoNome(r.envio.metodo)}</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace' }}>{r.envio.rastreio || '—'}</span>
                  </div>
                )}
              </div>
              {(podeEditar || podeCancelar) && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                  {/* Editar só em 'pendente': o PUT /:id remove itens que sumirem da lista, e remover
                      um item já reservado deixaria a reserva órfã (o backend não guarda contra isso). */}
                  {podeEditar && <button onClick={() => { setErroModal(null); setModal({ edit: r }); }} disabled={busy} style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', fontSize: 11.5, fontWeight: 700, color: t.muted, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="pencil" size={13} /> Editar</button>}
                  {podeCancelar && <button onClick={() => cancelar(r)} disabled={busy} style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', fontSize: 11.5, fontWeight: 700, color: t.faint, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    onMouseEnter={(e) => { if (!busy) e.currentTarget.style.color = uiTone(t, 'red').fg; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.faint; }}><Icon name="trash" size={13} /> Cancelar</button>}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {modal && <RepNovoModal t={t} edit={modal.edit} sugestaoNumero={proxNumero} produtos={produtos} salvando={busy} erro={erroModal}
        onClose={() => !busy && setModal(null)}
        onSave={(payload) => (modal.edit ? editar(modal.edit.id, payload) : criar(payload))} />}

      {cur && <RepDetail t={t} rep={cur} busy={busy} onClose={() => setOpenId(null)}
        onReservar={reservar} onEntregar={entregar} onReverter={reverter} onRastrear={rastrear} />}

      {tracking && (
        <div onClick={() => setTracking(null)} style={{ position: 'fixed', inset: 0, zIndex: 71, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, padding: 24, boxShadow: t.shadow }}>
            <div style={{ fontSize: 17, fontWeight: 850, color: t.text, marginBottom: 4 }}>Rastreamento</div>
            <div style={{ fontSize: 13, color: t.muted, fontFamily: 'ui-monospace, monospace', marginBottom: 16 }}>{tracking.code}</div>
            {tracking.loading && <div style={{ fontSize: 13, color: t.muted }}>Consultando transportadora…</div>}
            {tracking.erro && (
              <div style={{ fontSize: 13, color: uiTone(t, 'amber').fg, background: uiTone(t, 'amber').bg, padding: '12px 14px', borderRadius: 11, lineHeight: 1.5 }}>
                {tracking.erro}
                <div style={{ fontSize: 11.5, color: t.muted, marginTop: 6 }}>O rastreio usa a API Wonca (GET /tracking/:code) e exige a variável <b>WONCA_API_KEY</b> no ambiente do backend.</div>
              </div>
            )}
            {tracking.data && <pre style={{ margin: 0, fontSize: 11.5, color: t.text, background: t.elevated, padding: 14, borderRadius: 11, maxHeight: 320, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{JSON.stringify(tracking.data, null, 2)}</pre>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}><Btn t={t} kind="ghost" onClick={() => setTracking(null)}>Fechar</Btn></div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', zIndex: 90, bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderRadius: 13, background: toast.kind === 'err' ? uiTone(t, 'red').fg : t.text, color: '#fff', boxShadow: '0 18px 40px rgba(0,0,0,.3)', maxWidth: '92vw' }}>
          <Icon name={toast.kind === 'err' ? 'alert' : 'check'} size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ all: 'unset', cursor: 'pointer', opacity: .7, flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>
      )}
    </div>
  );
}

// ---------- Confronto (Viagens) ----------
// LIGADA a /travel-orders. TRIPS_SEED, EXTRA_CAT, SAIDA_CAT, SAIDA_TEAM e SAIDA_ORIGENS REMOVIDOS.
//
// LIFECYCLE — o da tela é o do backend, não um paralelo:
//   pending ("Em viagem": POST cria e RESERVA o material — StockService.reserve)
//     --POST /:id/reconcile--> reconciled ("Finalizada": libera a reserva, baixa física do
//     consumido, entrada física de extras)
// O mock desenhava 4 estágios (casa/viajando/retorno/finalizado) sem transição entre eles; o
// backend tem 2 estados vivos. Colapsado por decisão de produto (24/07/2026). 'awaiting_stock'
// (legado, sem escritor hoje) cai em "Em viagem" — mesma doutrina do DELETE do backend
// (reconciled vs resto). Origem: SEM FONTE (travel_orders não tem coluna) -> oculta; só destino
// (city). Confronto de ajuste (2º confronto): o backend rejeita (VIAGEM_JA_RECONCILIADA) ->
// adiado como peça própria, botão removido.
const TRIP_STAGES = [
  { key: 'pending', label: 'Em viagem', icon: 'truck', sub: 'Equipe em campo com o material reservado.' },
  { key: 'reconciled', label: 'Finalizada', icon: 'check', sub: 'Confronto concluído.' },
];
const STAGE_IDX = (s) => TRIP_STAGES.findIndex((x) => x.key === s);
const fmtBRL = (n) => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cfData = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Backend -> shape da tela. Itens com quantity_out>0 = levados; quantity_out=0 = "extra puro" do
// confronto (voltou sem ter saído). `voltou` (quantity_returned) só tem significado após reconcile.
// price = products.unit_price aninhado no GET — fonte real dos R$ (nada de preço chumbado).
function cfAdapt(r) {
  r = r || {};
  const all = (Array.isArray(r.items) ? r.items : []).map((i) => {
    const p = i.products || {};
    return {
      id: i.id, product_id: i.product_id, nome: p.name || '—', sku: p.sku || '—', un: p.unit || '',
      price: repNum(p.unit_price), levou: repNum(i.quantity_out), voltou: repNum(i.quantity_returned),
    };
  });
  const done = (r.status || 'pending') === 'reconciled';
  return {
    id: r.id, done, stage: done ? 'reconciled' : 'pending',
    destino: r.city || '—',
    // technicians é VARCHAR único no schema; a tela grava "A, B" e lê de volta em chips.
    tecnicos: String(r.technicians || '').split(',').map((s) => s.trim()).filter(Boolean),
    saida: cfData(r.created_at),
    itens: all.filter((i) => i.levou > 0),
    extras: all.filter((i) => !(i.levou > 0) && i.voltou > 0),
  };
}
function useFRTravels() {
  const R = window.React;
  const [items, setItems] = R.useState([]);
  const [loading, setLoading] = R.useState(true);
  const [error, setError] = R.useState(null);
  const mounted = R.useRef(true);
  const load = R.useCallback(function () {
    setError(null);
    window.FRApi.get('/travel-orders', { skipLoading: true })
      .then((res) => { if (!mounted.current) return; const rows = Array.isArray(res && res.data) ? res.data : []; setItems(rows.map(cfAdapt)); setLoading(false); })
      .catch((e) => { if (!mounted.current) return; setError(repErr(e)); setLoading(false); });
  }, []);
  R.useEffect(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);
  return { items, loading, error, reload: load };
}
const tripLevado = (tr) => tr.itens.reduce((a, it) => a + it.price * it.levou, 0);
const tripRetornado = (tr) => tr.itens.reduce((a, it) => a + it.price * (it.voltou || 0), 0) + (tr.extras || []).reduce((a, e) => a + e.price * e.voltou, 0);

function TripStepper({ t, stage, compact }) {
  const idx = STAGE_IDX(stage);
  return (
    <div style={{ display: 'flex', alignItems: compact ? 'center' : 'flex-start', gap: 0 }}>
      {TRIP_STAGES.map((s, i) => {
        const done = i < idx, cur = i === idx, on = done || cur;
        const col = cur ? t.accent : done ? uiTone(t, 'green').fg : t.border;
        const sz = compact ? 28 : 38;
        return (
          <React.Fragment key={s.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ width: sz, height: sz, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                background: on ? col : t.elevated, color: on ? '#fff' : t.faint, border: on ? 'none' : `2px solid ${t.border}`,
                boxShadow: cur ? `0 0 0 4px ${frHexToRgba(t.accent, 0.16)}` : 'none' }}>
                <Icon name={done ? 'check' : s.icon} size={compact ? 14 : 18} />
              </span>
              {!compact && <span style={{ fontSize: 10.5, fontWeight: cur ? 800 : 600, color: on ? t.text : t.faint, whiteSpace: 'nowrap' }}>{s.label}</span>}
            </div>
            {i < TRIP_STAGES.length - 1 && <div style={{ flex: 1, height: 3, minWidth: compact ? 14 : 26, borderRadius: 3, background: i < idx ? uiTone(t, 'green').fg : t.border, margin: compact ? '0 3px' : '0 5px', marginTop: compact ? 0 : sz / 2 - 1.5 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Confronto editor — o usuário informa o que voltou; quem baixa o consumo é o BACKEND
// (POST /:id/reconcile: libera reserva + reverseReceive do consumido + receive de extras).
// Extras = materiais que voltaram sem estar na viagem (catálogo real via GET /products).
// Produto que JÁ está na viagem fica fora do picker: o backend deduplica returnedItems por
// product_id — o excedente de um item existente entra pelo próprio "voltou" (> levou).
function ConfrontoEditor({ t, trip, produtos, salvando, erro, onClose, onSave }) {
  const [itens, setItens] = useStateR(trip.itens.map((it) => ({ ...it, voltou: '' })));
  const [extras, setExtras] = useStateR([]);
  const [q, setQ] = useStateR('');
  const ql = q.trim().toLowerCase();
  const naViagem = (pid) => trip.itens.some((i) => i.product_id === pid) || extras.some((e) => e.product_id === pid);
  const cat = ql ? (produtos || []).filter((p) => !naViagem(p.product_id) && (p.nome.toLowerCase().includes(ql) || String(p.sku).toLowerCase().includes(ql))).slice(0, 8) : [];
  const setVoltou = (i, v) => setItens((xs) => xs.map((it, j) => (j === i ? { ...it, voltou: v.replace(/[^0-9]/g, '') } : it)));
  const addExtra = (p) => { setExtras((xs) => xs.concat([{ product_id: p.product_id, nome: p.nome, sku: p.sku, price: p.preco, qtd: 1 }])); setQ(''); };
  const setExtraQtd = (i, v) => setExtras((xs) => xs.map((e, j) => (j === i ? { ...e, qtd: Math.max(1, parseInt(String(v).replace(/[^0-9]/g, '')) || 1) } : e)));
  const delExtra = (i) => setExtras((xs) => xs.filter((_, j) => j !== i));
  const levado = tripLevado(trip);
  const retornado = itens.reduce((a, it) => a + it.price * (parseInt(it.voltou) || 0), 0) + extras.reduce((a, e) => a + e.price * e.qtd, 0);
  const consumo = levado - retornado;
  const inp = { boxSizing: 'border-box', width: 64, height: 36, textAlign: 'center', borderRadius: 9, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', outline: 'none' };
  const payload = () => ({
    returnedItems: itens.map((it) => ({ product_id: it.product_id, returnedQuantity: parseInt(it.voltou) || 0 }))
      .concat(extras.map((e) => ({ product_id: e.product_id, returnedQuantity: e.qtd }))),
  });
  return (
    <div onClick={() => !salvando && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(820px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="returnHome" size={20} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Fazer confronto</div>
            <div style={{ fontSize: 12.5, color: t.muted }}>{trip.destino} · informe o que voltou de cada item.</div>
          </div>
          <button onClick={() => !salvando && onClose()} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '18px 24px', flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 10 }}>Itens levados — quanto voltou?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {itens.map((it, i) => {
              const usado = it.levou - (parseInt(it.voltou) || 0);
              return (
                <div key={it.product_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{it.nome}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>SKU {it.sku} · levou {it.levou}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, fontWeight: 700, color: t.faint, marginBottom: 3 }}>VOLTOU</div><input value={it.voltou} onChange={(e) => setVoltou(i, e.target.value)} inputMode="numeric" placeholder="0" style={inp} /></div>
                  <div style={{ textAlign: 'right', minWidth: 56 }}><div style={{ fontSize: 9, fontWeight: 700, color: t.faint }}>USOU</div><div style={{ fontSize: 15, fontWeight: 800, color: usado < 0 ? uiTone(t, 'red').fg : t.text }}>{usado}</div></div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 10px' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase' }}>Materiais extras que voltaram</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42, padding: '0 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text', marginBottom: 10 }}>
            <Icon name="search" size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar material extra por nome ou SKU…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 13.5, fontFamily: 'inherit' }} />
            {q && <button onClick={() => setQ('')} style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 6, color: t.muted }}><Icon name="x" size={15} /></button>}
          </label>
          {cat.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, padding: 10, borderRadius: 12, background: t.elevated, border: `1px dashed ${t.borderStrong}` }}>
              {cat.map((p) => (
                <button key={p.product_id} onClick={() => addExtra(p)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, background: t.panel, border: `1px solid ${t.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</div><div style={{ fontSize: 10.5, color: t.muted }}>SKU {p.sku} · {fmtBRL(p.preco)}</div></div>
                  <Icon name="plus" size={15} style={{ color: t.accentText, flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
          {ql && cat.length === 0 && <div style={{ fontSize: 12.5, color: t.faint, padding: '2px 2px 10px' }}>Nenhum material fora da viagem com esse termo.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {extras.length === 0 && !ql && <div style={{ fontSize: 12.5, color: t.faint, padding: '4px 2px' }}>Nenhum material extra.</div>}
            {extras.map((e, i) => (
              <div key={e.product_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: uiTone(t, 'amber').bg, border: `1px solid ${frHexToRgba('#f59e0b', 0.25)}` }}>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{e.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {e.sku} · extra</div></div>
                <input value={e.qtd} onChange={(ev) => setExtraQtd(i, ev.target.value)} inputMode="numeric" style={inp} />
                <button onClick={() => delExtra(i)} style={{ all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="trash" size={15} /></button>
              </div>
            ))}
          </div>
        </div>
        {erro && <div style={{ padding: '10px 24px', fontSize: 12.5, fontWeight: 600, color: uiTone(t, 'red').fg, background: uiTone(t, 'red').bg }}>{erro}</div>}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', gap: 18, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: t.muted }}>Levado <b style={{ color: t.text }}>{fmtBRL(levado)}</b></span>
            <span style={{ fontSize: 12.5, color: t.muted }}>Retornado <b style={{ color: uiTone(t, 'amber').fg }}>{fmtBRL(retornado)}</b></span>
            <span style={{ fontSize: 12.5, color: t.muted }}>Consumido <b style={{ color: uiTone(t, 'red').fg }}>{fmtBRL(consumo)}</b></span>
          </div>
          <button onClick={() => !salvando && onSave(payload())} disabled={salvando} style={{ all: 'unset', boxSizing: 'border-box', cursor: salvando ? 'not-allowed' : 'pointer', width: '100%', height: 48, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 14, fontWeight: 800, background: salvando ? t.elevated : t.accent, color: salvando ? t.faint : '#fff', boxShadow: salvando ? 'none' : `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` }}>
            <Icon name="check" size={18} /> {salvando ? 'Registrando…' : 'Concluir confronto'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TripDetail({ t, trip, busy, onClose, onConfronto }) {
  const [tab, setTab] = useStateR('levados');
  const tripMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const stageInfo = TRIP_STAGES.find((s) => s.key === trip.stage);
  const chegou = trip.done;
  const av = (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join('');
  const levado = tripLevado(trip), retornado = tripRetornado(trip), consumo = levado - retornado;
  const tabBtn = (k, label, icon) => {
    const on = tab === k;
    return (
      <button onClick={() => setTab(k)} style={{ all: 'unset', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42, borderRadius: 11, fontSize: 13, fontWeight: 800, background: on ? t.accent : t.elevated, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>
        <Icon name={icon} size={16} /> {label}
      </button>
    );
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(840px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ position: 'relative', padding: '22px 24px', background: `linear-gradient(135deg, ${t.accent}, ${frHexToRgba(t.accent, 0.7)})`, color: '#fff' }}>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 16, right: 18, width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.18)', color: '#fff' }}><Icon name="x" size={16} /></button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '4px 11px', borderRadius: 999, background: 'rgba(255,255,255,.2)', marginBottom: 12 }}><Icon name={stageInfo.icon} size={13} /> {stageInfo.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 19, fontWeight: 850, letterSpacing: '-.01em', flexWrap: 'wrap' }}>
            <Icon name="mapPin" size={17} style={{ opacity: .8 }} /> {trip.destino}
          </div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.85)', marginTop: 6 }}>Saída: {trip.saida}</div>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '22px 24px' }}>
          <div style={{ marginBottom: 22 }}><TripStepper t={t} stage={trip.stage} /></div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 10 }}>Equipe em viagem</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
            {trip.tecnicos.map((n) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 12px 7px 7px', borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}` }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 10.5 }}>{av(n)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{n}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: chegou ? (tripMobile ? '1fr 1fr' : '1fr 1fr 1fr') : '1fr', gap: tripMobile ? 8 : 12, marginBottom: 22 }}>
            <div style={{ padding: 16, borderRadius: 14, background: t.elevated, border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}><Icon name="upload" size={13} /> LEVADO</div>
              <div style={{ fontSize: 20, fontWeight: 850, color: t.text, marginTop: 6 }}>{fmtBRL(levado)}</div>
            </div>
            {chegou && <div style={{ padding: 16, borderRadius: 14, background: t.elevated, border: `1px solid ${t.border}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}><Icon name="shuffle" size={13} /> RETORNADO</div><div style={{ fontSize: 20, fontWeight: 850, color: uiTone(t, 'amber').fg, marginTop: 6 }}>{fmtBRL(retornado)}</div></div>}
            {chegou && <div style={{ gridColumn: tripMobile ? '1 / -1' : 'auto', padding: 16, borderRadius: 14, background: uiTone(t, 'red').bg, border: `1px solid ${frHexToRgba('#ef4444', 0.25)}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 700, color: uiTone(t, 'red').fg, letterSpacing: '.04em' }}><Icon name="out" size={13} /> CONSUMIDO</div><div style={{ fontSize: 20, fontWeight: 850, color: uiTone(t, 'red').fg, marginTop: 6 }}>{fmtBRL(consumo)}</div></div>}
          </div>

          {!trip.done && (
            <button onClick={() => !busy && onConfronto(trip.id)} disabled={busy} style={{ all: 'unset', boxSizing: 'border-box', cursor: busy ? 'not-allowed' : 'pointer', width: '100%', height: 48, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 14, fontWeight: 800, background: t.accent, color: t.onAccent, boxShadow: `0 6px 16px ${frHexToRgba(t.accent, 0.3)}`, marginBottom: 18 }}>
              <Icon name="returnHome" size={18} /> Fazer confronto
            </button>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {tabBtn('levados', 'Itens Levados', 'upload')}
            {tabBtn('retornados', 'Itens Retornados', 'shuffle')}
          </div>
          {tab === 'levados' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trip.itens.map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={16} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{it.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {it.sku}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, fontWeight: 700, color: t.faint }}>LEVOU</div><div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{it.levou}</div></div>
                </div>
              ))}
            </div>
          ) : !chegou ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px', borderRadius: 12, background: uiTone(t, 'amber').bg, color: uiTone(t, 'amber').fg, fontSize: 13, fontWeight: 600 }}>
              <Icon name={stageInfo.icon} size={18} /> A equipe está em campo — faça o confronto para registrar o que voltou.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trip.itens.map((it, i) => {
                const usado = it.levou - (it.voltou || 0);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={16} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{it.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {it.sku}</div></div>
                    <div style={{ display: 'flex', gap: 14, textAlign: 'right' }}>
                      <div><div style={{ fontSize: 9, fontWeight: 700, color: t.faint }}>LEVOU</div><div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{it.levou}</div></div>
                      <div><div style={{ fontSize: 9, fontWeight: 700, color: t.faint }}>VOLTOU</div><div style={{ fontSize: 15, fontWeight: 800, color: uiTone(t, 'amber').fg }}>{it.voltou}</div></div>
                      <div><div style={{ fontSize: 9, fontWeight: 700, color: t.faint }}>USOU</div><div style={{ fontSize: 15, fontWeight: 800, color: uiTone(t, 'red').fg }}>{usado}</div></div>
                    </div>
                  </div>
                );
              })}
              {(trip.extras || []).map((e) => (
                <div key={e.product_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: uiTone(t, 'amber').bg, border: `1px solid ${frHexToRgba('#f59e0b', 0.25)}` }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(245,158,11,.2)', color: uiTone(t, 'amber').fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="plus" size={16} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{e.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {e.sku} · extra que voltou</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, fontWeight: 700, color: t.faint }}>VOLTOU</div><div style={{ fontSize: 16, fontWeight: 800, color: uiTone(t, 'amber').fg }}>{e.voltou}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Registrar saída = POST /travel-orders (cria a viagem e RESERVA cada item — StockService.reserve).
// Catálogo REAL via GET /products (nada de SAIDA_CAT chumbado). Equipe: texto livre em chips —
// não existe cadastro de técnicos no backend (technicians é VARCHAR na viagem); o roster sugerido
// vem dos nomes das viagens já existentes, nunca de nomes inventados.
function SaidaModal({ t, produtos, rosterSeed, salvando, erro, onClose, onSave }) {
  const [destino, setDestino] = useStateR('');
  const [team, setTeam] = useStateR([]);
  const [roster, setRoster] = useStateR(rosterSeed || []);
  const [novoTec, setNovoTec] = useStateR('');
  const [itens, setItens] = useStateR([]);
  const [q, setQ] = useStateR('');
  const ql = q.trim().toLowerCase();
  const catList = (ql ? (produtos || []).filter((c) => c.nome.toLowerCase().includes(ql) || String(c.sku).toLowerCase().includes(ql)) : (produtos || [])).slice(0, 40);
  const toggleTeam = (n) => setTeam((xs) => (xs.includes(n) ? xs.filter((x) => x !== n) : [...xs, n]));
  const addTec = () => { const n = novoTec.trim(); if (!n) return; setRoster((xs) => (xs.includes(n) ? xs : [...xs, n])); setTeam((xs) => (xs.includes(n) ? xs : [...xs, n])); setNovoTec(''); };
  const addItem = (c) => { setItens((xs) => (xs.some((i) => i.product_id === c.product_id) ? xs : [...xs, { ...c, levou: 1 }])); setQ(''); };
  const setQtd = (i, v) => setItens((xs) => xs.map((it, j) => (j === i ? { ...it, levou: Math.max(1, parseInt(String(v).replace(/[^0-9]/g, '')) || 1) } : it)));
  const delItem = (i) => setItens((xs) => xs.filter((_, j) => j !== i));
  const levado = itens.reduce((a, it) => a + it.preco * it.levou, 0);
  const valid = destino.trim() && team.length && itens.length && !salvando;
  const field = { boxSizing: 'border-box', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 8 };

  return (
    <div onClick={() => !salvando && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(820px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="out" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Registrar saída</div><div style={{ fontSize: 12.5, color: t.muted }}>Defina a viagem e o material que vai a campo — o estoque fica reservado até o confronto.</div></div>
          <button onClick={() => !salvando && onClose()} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>

        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={lab}>Destino</label>
            <input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Ex: Obra Centro" style={field} />
          </div>

          <label style={lab}>Equipe que vai viajar</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {roster.map((n) => {
              const on = team.includes(n);
              return (
                <button key={n} onClick={() => toggleTeam(n)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: on ? t.accent : t.elevated, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>
                  <Icon name={on ? 'check' : 'plus'} size={13} /> {n}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, height: 42, padding: '0 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
              <Icon name="userPlus" size={16} />
              <input value={novoTec} onChange={(e) => setNovoTec(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTec())} placeholder="Cadastrar novo técnico…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 13.5, fontFamily: 'inherit' }} />
            </label>
            <button onClick={addTec} disabled={!novoTec.trim()} style={{ all: 'unset', cursor: novoTec.trim() ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 7, height: 42, padding: '0 16px', borderRadius: 11, fontSize: 13, fontWeight: 700, background: novoTec.trim() ? t.accentSoft : t.elevated, color: novoTec.trim() ? t.accentText : t.faint, border: `1px solid ${t.border}` }}><Icon name="plus" size={15} /> Adicionar</button>
          </div>

          <label style={lab}>Materiais a levar</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text', marginBottom: 12 }}>
            <Icon name="search" size={17} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar material por nome ou SKU…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
            {q && <button onClick={() => setQ('')} style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 6, color: t.muted }}><Icon name="x" size={15} /></button>}
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
            {/* catálogo inline */}
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 8 }}>Catálogo</div>
              <div className="fr-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                {catList.map((c) => {
                  const added = itens.some((i) => i.product_id === c.product_id);
                  return (
                    <button key={c.product_id} disabled={added} onClick={() => addItem(c)} style={{ all: 'unset', boxSizing: 'border-box', cursor: added ? 'default' : 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 11, background: t.elevated, border: `1px solid ${added ? t.accent : t.border}`, opacity: added ? 0.55 : 1 }}
                      onMouseEnter={(e) => { if (!added) { e.currentTarget.style.background = t.hover; e.currentTarget.style.borderColor = t.borderStrong; } }} onMouseLeave={(e) => { e.currentTarget.style.background = t.elevated; e.currentTarget.style.borderColor = added ? t.accent : t.border; }}>
                      <span style={{ width: 32, height: 32, borderRadius: 8, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={15} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</div><div style={{ fontSize: 10.5, color: t.muted }}>SKU {c.sku} · livre {c.disponivel} · {fmtBRL(c.preco)}</div></div>
                      <Icon name={added ? 'check' : 'plus'} size={16} style={{ color: added ? uiTone(t, 'green').fg : t.accentText, flexShrink: 0 }} />
                    </button>
                  );
                })}
                {catList.length === 0 && <div style={{ padding: 18, textAlign: 'center', fontSize: 12.5, color: t.faint }}>Nenhum material.</div>}
              </div>
            </div>
            {/* selecionados */}
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 8 }}>Selecionados ({itens.length})</div>
              {itens.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', borderRadius: 12, border: `1px dashed ${t.borderStrong}`, color: t.muted, fontSize: 13 }}>Toque nos itens do catálogo para adicioná-los à viagem.</div>
              ) : (
                <div className="fr-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                  {itens.map((it, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.nome}</div><div style={{ fontSize: 10.5, color: t.muted }}>SKU {it.sku}</div></div>
                      <input value={it.levou} onChange={(e) => setQtd(i, e.target.value)} inputMode="numeric" style={{ boxSizing: 'border-box', width: 54, height: 34, textAlign: 'center', borderRadius: 9, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                      <button onClick={() => delItem(i)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {erro && <div style={{ padding: '10px 24px', fontSize: 12.5, fontWeight: 600, color: uiTone(t, 'red').fg, background: uiTone(t, 'red').bg }}>{erro}</div>}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: t.muted }}>{itens.length} {itens.length === 1 ? 'item' : 'itens'} · levado <b style={{ color: t.text }}>{fmtBRL(levado)}</b></div>
          <button onClick={() => valid && onSave({ technicians: team.join(', '), city: destino.trim(), items: itens.map((it) => ({ product_id: it.product_id, quantity: it.levou })) })} disabled={!valid}
            style={{ all: 'unset', boxSizing: 'border-box', cursor: valid ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, height: 48, padding: '0 24px', borderRadius: 13, fontSize: 14, fontWeight: 800, background: valid ? t.accent : t.elevated, color: valid ? t.onAccent : t.faint, boxShadow: valid ? `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` : 'none' }}>
            <Icon name="out" size={18} /> {salvando ? 'Registrando…' : 'Registrar saída'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageConfronto({ t }) {
  const { items: trips, loading, error, reload } = useFRTravels();
  const [openId, setOpenId] = useStateR(null);
  const [confrontoId, setConfrontoId] = useStateR(null);
  // saida = { key } — X-Idempotency-Key gerada ao ABRIR o modal: re-tentar o MESMO envio reusa a
  // chave (o backend devolve a viagem já criada em vez de duplicar a reserva); modal novo = chave nova.
  const [saida, setSaida] = useStateR(null);
  const [busy, setBusy] = useStateR(false);
  const [erroModal, setErroModal] = useStateR(null);
  const [toast, setToast] = useStateR(null);
  const [produtos, setProdutos] = useStateR([]);
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);
  // Catálogo real (GET /products): preço = unit_price; livre = on_hand - reserved (agregado pooled).
  React.useEffect(() => {
    window.FRApi.get('/products', { skipLoading: true })
      .then((r) => setProdutos((Array.isArray(r.data) ? r.data : []).map((p) => ({
        product_id: p.id, sku: p.sku || '—', nome: p.name || '—', preco: repNum(p.unit_price),
        disponivel: Math.max(0, repNum(p.stock && p.stock.quantity_on_hand) - repNum(p.stock && p.stock.quantity_reserved)),
      })))).catch(() => setProdutos([]));
  }, []);

  const cur = trips.find((x) => x.id === openId) || null;
  const confrontoTrip = trips.find((x) => x.id === confrontoId) || null;
  const stageMeta = { pending: ['Em viagem', 'blue'], reconciled: ['Finalizada', 'green'] };
  // Roster sugerido = nomes já usados nas viagens existentes (nunca nomes inventados).
  const rosterSeed = React.useMemo(() => {
    const s = new Set();
    trips.forEach((tr) => tr.tecnicos.forEach((n) => s.add(n)));
    return Array.from(s);
  }, [trips]);

  const registrarSaida = async (payload) => {
    setErroModal(null); setBusy(true);
    try {
      await window.FRApi.post('/travel-orders', payload, { headers: { 'X-Idempotency-Key': saida.key } });
      setSaida(null); reload(); setToast({ kind: 'ok', msg: 'Saída registrada — material reservado no estoque.' });
    } catch (e) { setErroModal(repErr(e)); } finally { setBusy(false); }
  };
  const confrontar = async (payload) => {
    setErroModal(null); setBusy(true);
    try {
      await window.FRApi.post(`/travel-orders/${confrontoId}/reconcile`, payload);
      setConfrontoId(null); reload(); setToast({ kind: 'ok', msg: 'Confronto concluído — estoque acertado.' });
    } catch (e) { setErroModal(repErr(e)); } finally { setBusy(false); }
  };

  if (loading && trips.length === 0) return <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando viagens…</Card>;
  if (error) return (
    <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
      <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
    </Card>
  );

  return (
    <div>
      <PageHeader t={t} title="Confronto de Viagens" subtitle="Registre a saída do material, acompanhe a viagem e faça o confronto do retorno."
        actions={<><Btn t={t} kind="ghost" icon="refresh" onClick={() => reload()}>Atualizar</Btn><Btn t={t} icon="out" onClick={() => { setErroModal(null); setSaida({ key: crypto.randomUUID() }); }}>Registrar saída</Btn></>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="truck" label="Em viagem" value={trips.filter((x) => !x.done).length} kind="blue" />
        <KPI t={t} mini icon="check" label="Finalizadas" value={trips.filter((x) => x.done).length} kind="green" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {trips.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhuma viagem" sub="Registre uma saída para reservar material e acompanhar o confronto." /></Card></div>}
        {trips.map((tr) => {
          const sm = stageMeta[tr.stage];
          const emViagem = !tr.done;
          return (
            <Card t={t} key={tr.id} hover style={{ padding: 18, cursor: 'pointer', border: emViagem ? `1.5px solid ${t.accent}` : undefined, boxShadow: emViagem ? `0 0 0 4px ${frHexToRgba(t.accent, 0.1)}` : undefined }}>
              <div onClick={() => setOpenId(tr.id)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Badge t={t} kind={sm[1]} dot>{sm[0]}</Badge>
                  <span style={{ fontSize: 11.5, color: t.faint }}>{tr.saida}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '14px 0 4px', fontSize: 15.5, fontWeight: 800, color: t.text }}>
                  <Icon name="mapPin" size={16} style={{ color: t.accentText, flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tr.destino}</span>
                </div>
                <div style={{ fontSize: 12.5, color: t.muted, marginBottom: 18 }}>{tr.tecnicos.join(', ') || '—'}</div>
                <TripStepper t={t} stage={tr.stage} compact />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 13, borderTop: `1px solid ${t.border}`, gap: 10 }}>
                <div><div style={{ fontSize: 9.5, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}>LEVADO</div><div style={{ fontSize: 15, fontWeight: 850, color: t.text }}>{fmtBRL(tripLevado(tr))}</div></div>
                {emViagem
                  ? <button onClick={() => { setErroModal(null); setConfrontoId(tr.id); }} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 11, fontSize: 13, fontWeight: 800, background: t.accent, color: t.onAccent, boxShadow: `0 4px 12px ${frHexToRgba(t.accent, 0.3)}` }}><Icon name="returnHome" size={16} /> Fazer confronto</button>
                  : <button onClick={() => setOpenId(tr.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: t.accentText, padding: '6px 10px', borderRadius: 9 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = t.accentSoft; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>Ver detalhes <Icon name="chevronRight" size={15} /></button>}
              </div>
            </Card>
          );
        })}
      </div>
      {cur && <TripDetail t={t} trip={cur} busy={busy} onClose={() => setOpenId(null)} onConfronto={(id) => { setOpenId(null); setErroModal(null); setConfrontoId(id); }} />}
      {confrontoTrip && <ConfrontoEditor t={t} trip={confrontoTrip} produtos={produtos} salvando={busy} erro={erroModal} onClose={() => !busy && setConfrontoId(null)} onSave={confrontar} />}
      {saida && <SaidaModal t={t} produtos={produtos} rosterSeed={rosterSeed} salvando={busy} erro={erroModal} onClose={() => !busy && setSaida(null)} onSave={registrarSaida} />}
      {toast && (
        <div style={{ position: 'fixed', zIndex: 90, bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderRadius: 13, background: toast.kind === 'err' ? uiTone(t, 'red').fg : t.text, color: '#fff', boxShadow: '0 18px 40px rgba(0,0,0,.3)', maxWidth: '92vw' }}>
          <Icon name={toast.kind === 'err' ? 'alert' : 'check'} size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ all: 'unset', cursor: 'pointer', opacity: .7, flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>
      )}
    </div>
  );
}


// ---------- Controle de Saída ----------
function PageControleSaida({ t }) {
  const rows = [
    { sol: 'Carlos M.', setor: 'Usinagem', item: 'Parafuso M8', qtd: '40 un', op: '73001', data: '14/06 09:12', st: ['Liberado', 'green'] },
    { sol: 'Ana P.', setor: 'Montagem', item: 'Rolamento 6204ZZ', qtd: '6 un', op: '88210', data: '14/06 08:40', st: ['Liberado', 'green'] },
    { sol: 'Rafael S.', setor: 'Produção 3D', item: 'Filamento PLA', qtd: '2 un', op: '54120', data: '13/06 16:20', st: ['Aguardando', 'amber'] },
    { sol: 'Júlia R.', setor: 'Acabamento', item: 'Tinta Epóxi', qtd: '1 lt', op: '00009', data: '13/06 11:05', st: ['Bloqueado', 'red'] },
  ];
  const cols = [
    { key: 'sol', label: 'Solicitante', render: (r) => <span style={{ fontWeight: 700 }}>{r.sol}</span> },
    { key: 'setor', label: 'Setor', render: (r) => <Badge t={t} kind="gray">{r.setor}</Badge> },
    { key: 'item', label: 'Item' },
    { key: 'qtd', label: 'Qtd', align: 'center', render: (r) => <span style={{ fontWeight: 700 }}>{r.qtd}</span> },
    { key: 'op', label: 'OP', align: 'center', render: (r) => <span style={{ color: t.muted }}>{r.op}</span> },
    { key: 'data', label: 'Quando', align: 'center', render: (r) => <span style={{ color: t.muted }}>{r.data}</span> },
    { key: 'st', label: 'Status', align: 'center', render: (r) => <Badge t={t} kind={r.st[1]} dot>{r.st[0]}</Badge> },
  ];
  return (
    <div>
      <PageHeader t={t} title="Controle de Saída" subtitle="Liberação e rastreio de retiradas de material por setor."
        actions={<Btn t={t} icon="out">Nova liberação</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="out" label="Saídas hoje" value="18" kind="accent" />
        <KPI t={t} mini icon="check" label="Liberadas" value="14" kind="green" />
        <KPI t={t} mini icon="clock" label="Aguardando" value="3" kind="amber" />
        <KPI t={t} mini icon="lock" label="Bloqueadas" value="1" kind="red" />
      </div>
      <DataTable t={t} columns={cols} rows={rows} />
    </div>
  );
}

// ---------- Críticos ----------
// LIGAÇÃO AO BACKEND: GET /products/low-stock (RBAC estoque_critico:view). O endpoint agrega o
// saldo POOLED por produto (op_id IS NULL) e devolve só quem está <= min_stock, já ordenado pelo
// disponível ascendente — a tela não refiltra nem reordena, só apresenta.
function crtNum(v) { const f = window.FRAdapters && window.FRAdapters.parseNumber; return f ? f(v) : (parseFloat(v) || 0); }
function crtErr(e) { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; }

function crtAdapt(r) {
  r = r || {};
  return {
    id: r.id, nome: r.name || '—', sku: r.sku || '—', un: r.unit || '',
    disp: crtNum(r.disponivel), min: crtNum(r.min_stock),
    // Bônus do endpoint: quanto já foi pedido e ainda não atendido (requests abertas/aprovadas).
    demanda: crtNum(r.demanda_reprimida),
  };
}

function useFRLowStock() {
  const R = window.React;
  const [items, setItems] = R.useState([]);
  const [loading, setLoading] = R.useState(true);
  const [error, setError] = R.useState(null);
  const mounted = R.useRef(true);
  const load = R.useCallback(function () {
    setError(null);
    window.FRApi.get('/products/low-stock', { skipLoading: true })
      .then(function (res) { if (!mounted.current) return; const rows = Array.isArray(res && res.data) ? res.data : []; setItems(rows.map(crtAdapt)); setLoading(false); })
      .catch(function (e) { if (!mounted.current) return; setError(crtErr(e)); setLoading(false); });
  }, []);
  R.useEffect(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);
  return { items: items, loading: loading, error: error, reload: load };
}

function PageCriticos({ t }) {
  const { items: rows, loading, error, reload } = useFRLowStock();
  // Ruptura = disponível ZERADO (ou negativo). O mock usava `disp <= 5`, um limiar inventado que não
  // significava nada; ruptura de verdade é não ter o item.
  const emRuptura = rows.filter((r) => r.disp <= 0).length;

  return (
    <div>
      <PageHeader t={t} title="Itens Críticos" subtitle="Materiais abaixo do estoque mínimo — priorize a reposição."
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Btn t={t} kind="ghost" icon="refresh" onClick={() => reload()}>Atualizar</Btn>
            {/* INERTE de propósito: o destino natural é POST /replenishments, mas a tela Reposições
                ainda está cadeada — criar a reposição aqui geraria um registro que o usuário não tem
                onde ver, editar ou autorizar. Religar junto com o destrave de Reposições. */}
            <span title="Disponível quando a tela Reposições for destravada." style={{ display: 'inline-flex', alignItems: 'center', gap: 9, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, background: t.panel, color: t.faint, border: `1px solid ${t.border}`, cursor: 'not-allowed' }}>
              <Icon name="refresh" size={17} /> Gerar reposição
            </span>
          </div>
        } />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="alert" label="Abaixo do mínimo" value={loading ? '—' : rows.length} kind="red" />
        <KPI t={t} mini icon="box" label="Em ruptura" value={loading ? '—' : emRuptura} kind="amber" />
        {/* KPI "Cobertura média" REMOVIDO: exigia taxa de consumo histórica e o payload não tem nada
            que a derive. Era um "9 d" chumbado. Volta quando houver série de consumo. */}
      </div>

      {loading && rows.length === 0 ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando itens críticos…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
        </Card>
      ) : rows.length === 0 ? (
        <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhum item crítico" sub="Todo o estoque está acima do mínimo configurado." /></Card>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {rows.map((r) => {
          // min = 0 (produto sem mínimo configurado, que só entra na lista se zerou) faria disp/min
          // virar Infinity/NaN e quebrar a barra — barra cheia quando não há mínimo pra comparar.
          const pct = r.min > 0 ? Math.min(100, Math.round((r.disp / r.min) * 100)) : 100;
          const ruptura = r.disp <= 0;
          return (
            <Card t={t} key={r.id || r.sku} hover style={{ padding: 18, borderLeft: `3px solid ${uiTone(t, ruptura ? 'red' : 'amber').fg}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{r.nome}</div>
                  <Badge t={t} kind="gray">{r.sku}</Badge>
                </div>
                <Badge t={t} kind={ruptura ? 'red' : 'amber'} dot>{ruptura ? 'Ruptura' : 'Crítico'}</Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
                <div><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>DISPONÍVEL</div><div style={{ fontSize: 22, fontWeight: 850, color: uiTone(t, ruptura ? 'red' : 'amber').fg }}>{r.disp} <span style={{ fontSize: 12, color: t.muted }}>{r.un}</span></div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>MÍNIMO</div><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{r.min}</div></div>
              </div>
              <div style={{ height: 7, borderRadius: 6, background: t.hover, overflow: 'hidden', marginTop: 12 }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: uiTone(t, ruptura ? 'red' : 'amber').fg }} /></div>
              {r.demanda > 0 && (
                <div style={{ marginTop: 10, fontSize: 11.5, color: t.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="cart" size={13} /> {r.demanda} {r.un} já solicitados e não atendidos
                </div>
              )}
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
}

// ---------- Permissões ----------
// LIGAÇÃO AO BACKEND: matriz papel × page_keys REAIS + exceções por usuário.
//   GET  /admin/permissions/roles  → { [role]: page_key[] }      (15 papéis / 57 chaves hoje)
//   POST /admin/permissions/roles  → replace-all { role, permissions } (guard anti-vazio no back)
//   GET  /admin/permissions/users  → { [user_id]: page_key[] }
//   POST /admin/permissions/users  → replace-all { userId, permissions } (vazio = sem exceções)
//   GET  /users                    → dropdown de usuários reais
// ESCOPO v1 (travado): SEM criar papel (typo viraria papel-fantasma atribuível na allowlist do
// UPDATE_ROLE), SEM remover papel (o guard anti-vazio do backend também barra), SEM normalizar
// a convenção mista flat×namespaced (dívida). O agrupamento por módulo é SÓ VISUAL — o dado é
// flat; chave sem grupo óbvio cai em "Outras", exibida crua.
// SALVAR SEMPRE CONFIRMA avisando o efeito real: role_permissions_updated / user_permissions_
// updated DESLOGAM na hora quem for afetado (comportamento dos dois fronts) — a UI não esconde.
// Limitação conhecida: o universo de chaves é a UNIÃO dos conjuntos dos papéis (GET /roles);
// chave que perder o último papel que a tinha some do checklist no próximo load (v1).
function permErr(e) { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; }

// Agrupamento VISUAL por módulo (apresentação, nunca semântica). Prefixo → grupo, na ordem.
const PERM_GRUPOS = [
  { grupo: 'Estoque', prefixos: ['produtos', 'estoque_critico', 'estoque', 'entradas', 'saidas', 'stock_', 'valores', 'calculo_minimo'] },
  { grupo: 'Operação', prefixos: ['solicitacoes', 'minhas_solicitacoes', 'separacoes', 'reposicoes', 'confronto_viagem', 'consultar'] },
  { grupo: 'Produção 3D', prefixos: ['producao_3d', 'solicitar_3d', 'producao'] },
  { grupo: 'Painéis e Relatórios', prefixos: ['dashboard', 'office_dashboard', 'relatorios'] },
  { grupo: 'Tarefas e Utilidades', prefixos: ['tarefas_eletrica', 'avisos', 'calculadora'] },
  { grupo: 'Gestão Admin', prefixos: ['usuarios', 'permissoes', 'logs', 'clientes'] },
];
function permGrupoDe(key) {
  for (const g of PERM_GRUPOS) { if (g.prefixos.some((p) => key === p || key.indexOf(p) === 0)) return g.grupo; }
  return 'Outras';
}

// Rótulo amigável onde óbvio; a CHAVE CRUA aparece SEMPRE ao lado — a convenção mista faz
// 'clientes' e 'clientes:view' coexistirem, e sem a chave crua os rótulos colidiriam.
const PERM_BASES = {
  produtos: 'Produtos', estoque: 'Estoque', entradas: 'Entradas', saidas: 'Saídas',
  estoque_critico: 'Críticos', valores: 'Valores', calculo_minimo: 'Cálculo de Mínimo',
  stock_view_edit: 'Estoque — editar visão', stock_view_financial: 'Estoque — visão financeira',
  clientes: 'Clientes e OPs', solicitacoes: 'Solicitações', minhas_solicitacoes: 'Meus Pedidos',
  separacoes: 'Separações', reposicoes: 'Reposições', confronto_viagem: 'Confronto de Viagem',
  consultar: 'Consulta', dashboard: 'Dashboard', office_dashboard: 'Painel do Escritório',
  relatorios: 'Relatórios', producao_3d: 'Produção 3D', solicitar_3d: 'Encomendar 3D',
  producao: 'Produção', tarefas_eletrica: 'Quadro Elétrica', avisos: 'Avisos',
  calculadora: 'Calculadora', usuarios: 'Usuários', permissoes: 'Permissões', logs: 'Auditoria',
};
const PERM_ACOES = { view: 'ver', add: 'adicionar', edit: 'editar', delete: 'excluir', apontar: 'apontar' };
function permLabelDe(key) {
  const partes = key.split(':');
  const b = PERM_BASES[partes[0]];
  if (!b) return key; // sem rótulo óbvio → chave crua
  return partes[1] ? `${b} — ${PERM_ACOES[partes[1]] || partes[1]}` : b;
}

// Gate por permissão, padrão da Auditoria: sem page_key 'permissoes' a tela interna NEM MONTA
// (nenhuma chamada de rede). Ver ≠ salvar: o POST segue admin-only no backend — um não-admin
// com 'permissoes' vê a matriz e recebe o 403 do salvar no Card de erro (é o desenho).
function PagePermissoes({ t }) {
  const A = window.FRAuth;
  if (!A || typeof A.canAccess !== 'function' || !A.canAccess('permissoes')) {
    return (
      <div>
        <PageHeader t={t} title="Permissões" subtitle="Matriz de acesso por cargo e exceções por usuário." />
        <Card t={t} style={{ padding: 40, textAlign: 'center' }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'inline-grid', placeItems: 'center', marginBottom: 14 }}><Icon name="lock" size={24} /></span>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700 }}>
            Acesso bloqueado. Não possui o nível de permissão necessário (permissoes) para ver a matriz.
          </div>
        </Card>
      </div>
    );
  }
  return <PagePermissoesReal t={t} />;
}

function PagePermissoesReal({ t }) {
  const R = window.React;
  const [aba, setAba] = R.useState('papeis'); // 'papeis' | 'excecoes'
  const [matriz, setMatriz] = R.useState(null);     // GET /roles → { role: keys[] }
  const [excecoes, setExcecoes] = R.useState(null); // GET /users (permissions) → { user_id: keys[] }
  const [usuarios, setUsuarios] = R.useState([]);   // GET /users (contas)
  const [loading, setLoading] = R.useState(true);
  const [error, setError] = R.useState(null);
  const [papel, setPapel] = R.useState('');
  const [usuarioId, setUsuarioId] = R.useState('');
  const [marcadas, setMarcadas] = R.useState([]);
  const [confirmando, setConfirmando] = R.useState(false);
  const [salvando, setSalvando] = R.useState(false);
  const [feedback, setFeedback] = R.useState(null); // { kind: 'ok'|'erro', msg }

  const carregar = R.useCallback(function (inicial) {
    if (inicial) setLoading(true);
    setError(null);
    return Promise.all([
      window.FRApi.get('/admin/permissions/roles', { skipLoading: true }),
      window.FRApi.get('/admin/permissions/users', { skipLoading: true }),
      window.FRApi.get('/users', { skipLoading: true }),
    ]).then(function (rs) {
      setMatriz(rs[0].data || {});
      setExcecoes(rs[1].data || {});
      setUsuarios(Array.isArray(rs[2].data) ? rs[2].data.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }) : []);
      if (inicial) setLoading(false);
    }).catch(function (e) { setError(permErr(e)); if (inicial) setLoading(false); });
  }, []);
  R.useEffect(function () { carregar(true); }, [carregar]);

  // Defaults após o primeiro load: primeiro papel em ordem alfabética / primeiro usuário por nome.
  R.useEffect(function () {
    if (matriz && !papel) { const rs = Object.keys(matriz).sort(); if (rs.length) setPapel(rs[0]); }
  }, [matriz, papel]);
  R.useEffect(function () {
    if (usuarios.length > 0 && !usuarioId) setUsuarioId(usuarios[0].id);
  }, [usuarios, usuarioId]);

  // Baseline = verdade carregada do servidor; troca de alvo/aba (ou reload pós-save) ressincroniza.
  const baseline = aba === 'papeis' ? ((matriz && matriz[papel]) || []) : ((excecoes && excecoes[usuarioId]) || []);
  R.useEffect(function () {
    setMarcadas(baseline.slice());
    setFeedback(null);
    // baseline entra via matriz/excecoes/papel/usuarioId — strings/objetos estáveis do estado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, papel, usuarioId, matriz, excecoes]);

  // Universo do checklist = união dos conjuntos de TODOS os papéis (dado real, flat).
  const universo = R.useMemo(function () {
    if (!matriz) return [];
    const s = new Set();
    Object.keys(matriz).forEach(function (r) { (matriz[r] || []).forEach(function (k) { s.add(k); }); });
    return Array.from(s).sort();
  }, [matriz]);
  const grupos = R.useMemo(function () {
    const m = new Map();
    universo.forEach(function (k) { const g = permGrupoDe(k); if (!m.has(g)) m.set(g, []); m.get(g).push(k); });
    const ordem = PERM_GRUPOS.map(function (g) { return g.grupo; }).concat(['Outras']);
    return ordem.filter(function (g) { return m.has(g); }).map(function (g) { return { grupo: g, keys: m.get(g) }; });
  }, [universo]);

  const addedNow = marcadas.filter(function (k) { return baseline.indexOf(k) < 0; }).sort();
  const removedNow = baseline.filter(function (k) { return marcadas.indexOf(k) < 0; }).sort();
  const dirty = addedNow.length > 0 || removedNow.length > 0;
  // Espelha o guard do backend: conjunto vazio de PAPEL removeria o papel da allowlist — a UI
  // nem deixa tentar (no espelho por usuário, vazio é legítimo = sem exceções).
  const vazioBloqueado = aba === 'papeis' && marcadas.length === 0;

  const alternar = function (k) {
    setMarcadas(function (m) { return m.indexOf(k) >= 0 ? m.filter(function (x) { return x !== k; }) : m.concat([k]); });
  };

  const usuarioAlvo = usuarios.filter(function (u) { return u.id === usuarioId; })[0] || null;
  const roleLabel = (window.FRAccess && window.FRAccess.roleLabel) || function (r) { return r; };

  const salvar = function () {
    setSalvando(true); setFeedback(null);
    const req = aba === 'papeis'
      ? window.FRApi.post('/admin/permissions/roles', { role: papel, permissions: marcadas })
      : window.FRApi.post('/admin/permissions/users', { userId: usuarioId, permissions: marcadas });
    req.then(function () {
      // Recarrega do servidor (verdade autoritativa) — o baseline novo zera o dirty.
      return carregar(false).then(function () {
        setFeedback({ kind: 'ok', msg: 'Salvo. Quem foi afetado foi deslogado e entra com o conjunto novo.' });
      });
    }).catch(function (e) {
      setFeedback({ kind: 'erro', msg: permErr(e) });
    }).then(function () { setSalvando(false); setConfirmando(false); });
  };

  const selStyle = { boxSizing: 'border-box', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 32px 0 13px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', appearance: 'none', WebkitAppearance: 'none', outline: 'none', cursor: 'pointer', maxWidth: 320 };
  const tabBtn = function (on) { return { all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 16px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, background: on ? t.accent : t.panel, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }; };

  return (
    <div>
      <PageHeader t={t} title="Permissões" subtitle="Matriz de acesso por cargo e exceções por usuário — direto do banco, salvar aplica na hora."
        actions={<Btn t={t} kind="ghost" icon="refresh" onClick={() => carregar(true)}>Atualizar</Btn>} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <button onClick={() => setAba('papeis')} style={tabBtn(aba === 'papeis')}><Icon name="shield" size={15} /> Papéis</button>
        <button onClick={() => setAba('excecoes')} style={tabBtn(aba === 'excecoes')}><Icon name="key" size={15} /> Exceções por usuário</button>
      </div>

      {loading ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando matriz de permissões…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => carregar(true)}>Tentar novamente</Btn>
        </Card>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
            {aba === 'papeis' ? (
              <div style={{ position: 'relative' }}>
                <select value={papel} onChange={(e) => setPapel(e.target.value)} style={selStyle}>
                  {Object.keys(matriz || {}).sort().map((r) => {
                    const lbl = roleLabel(r);
                    return <option key={r} value={r}>{lbl === r ? r : `${lbl} (${r})`}</option>;
                  })}
                </select>
                <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 14, color: t.muted, pointerEvents: 'none' }} />
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} style={selStyle}>
                  {usuarios.map((u) => <option key={u.id} value={u.id}>{u.name} · {roleLabel(u.role)}</option>)}
                </select>
                <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 14, color: t.muted, pointerEvents: 'none' }} />
              </div>
            )}
            <span style={{ fontSize: 12.5, color: t.muted }}>
              {aba === 'papeis'
                ? `${marcadas.length} de ${universo.length} chaves marcadas`
                : `${marcadas.length} exceção(ões) — além do que o cargo ${usuarioAlvo ? roleLabel(usuarioAlvo.role) : ''} já concede`}
            </span>
          </div>

          <Card t={t} style={{ padding: 8, marginBottom: 14 }}>
            {grupos.map((g) => (
              <React.Fragment key={g.grupo}>
                <div style={{ padding: '12px 14px 6px', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: t.faint, background: t.elevated, borderRadius: 8 }}>{g.grupo}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2, padding: '6px 4px 10px' }}>
                  {g.keys.map((k) => {
                    const on = marcadas.indexOf(k) >= 0;
                    const mudou = (baseline.indexOf(k) >= 0) !== on;
                    return (
                      <div key={k} onClick={() => alternar(k)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', background: mudou ? uiTone(t, 'amber').bg : 'transparent', transition: 'background .12s' }}
                        onMouseEnter={(e) => { if (!mudou) e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { if (!mudou) e.currentTarget.style.background = 'transparent'; }}>
                        <span style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'grid', placeItems: 'center', background: on ? uiTone(t, 'green').fg : t.hover, color: on ? '#fff' : t.faint, border: `1px solid ${on ? 'transparent' : t.border}` }}>
                          <Icon name={on ? 'check' : 'x'} size={13} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{permLabelDe(k)}</div>
                          {permLabelDe(k) !== k && <div style={{ fontSize: 10.5, color: t.faint, fontFamily: 'ui-monospace, monospace' }}>{k}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </Card>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Btn t={t} icon="check" kind={dirty && !vazioBloqueado ? 'primary' : 'ghost'} onClick={() => { if (dirty && !vazioBloqueado && !salvando) setConfirmando(true); }}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </Btn>
            {dirty && <Btn t={t} icon="undo" kind="ghost" onClick={() => setMarcadas(baseline.slice())}>Desfazer</Btn>}
            {dirty && !vazioBloqueado && (
              <span style={{ fontSize: 12.5, color: t.muted }}>
                {addedNow.length > 0 ? `+${addedNow.length} concedida(s)` : ''}{addedNow.length > 0 && removedNow.length > 0 ? ' · ' : ''}{removedNow.length > 0 ? `−${removedNow.length} revogada(s)` : ''}
              </span>
            )}
            {vazioBloqueado && (
              <span style={{ fontSize: 12.5, color: uiTone(t, 'red').fg, fontWeight: 700 }}>
                Conjunto vazio não é permitido: removeria o papel da allowlist (remoção de papel não existe na v1).
              </span>
            )}
            {!dirty && feedback && (
              <span style={{ fontSize: 12.5, fontWeight: 700, color: feedback.kind === 'ok' ? uiTone(t, 'green').fg : uiTone(t, 'red').fg }}>{feedback.msg}</span>
            )}
            {dirty && feedback && feedback.kind === 'erro' && (
              <span style={{ fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{feedback.msg}</span>
            )}
          </div>
        </div>
      )}

      {confirmando && (
        <div onClick={() => !salvando && setConfirmando(false)} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(460px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: uiTone(t, 'amber').bg, color: uiTone(t, 'amber').fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="alert" size={20} /></span>
              <div style={{ fontSize: 15.5, fontWeight: 850, color: t.text }}>Confirmar alteração de acesso</div>
            </div>
            <div style={{ fontSize: 13.5, color: t.text, lineHeight: 1.5, marginBottom: 8 }}>
              {aba === 'papeis'
                ? `Salvar desloga imediatamente todos os usuários do cargo ${papel} (precisarão entrar de novo).`
                : `Salvar desloga imediatamente ${usuarioAlvo ? usuarioAlvo.name : 'o usuário'} (precisará entrar de novo).`}
            </div>
            <div style={{ fontSize: 12.5, color: t.muted, marginBottom: 18 }}>
              {addedNow.length > 0 && <div>Concede: {addedNow.join(', ')}</div>}
              {removedNow.length > 0 && <div>Revoga: {removedNow.join(', ')}</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn t={t} kind="ghost" onClick={() => !salvando && setConfirmando(false)}>Cancelar</Btn>
              <Btn t={t} icon="check" onClick={() => !salvando && salvar()}>{salvando ? 'Salvando…' : 'Confirmar e salvar'}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ---------- Auditoria ----------
// ---------- Auditoria ----------
// LIGAÇÃO AO BACKEND: GET /admin/logs (contrato v1 — envelope { logs, total, limit, offset }).
// TUDO server-driven: action/user/q/startDate/endDate/limit/offset viajam como query params e a
// tela NUNCA refiltra o array recebido — filtrar no cliente em cima de UMA PÁGINA é a armadilha
// do LIMIT mapeada no recon (inventa resultado). Formatação das 22 actions conhecidas em
// lib/audit_format.js (window.FRAuditFormat), com fallback obrigatório: ação nova não quebra.
// CORTES DA V1 (escopo travado): sem KPIs, sem Exportar, modal sem pagina/sku; sem listener de
// socket (dívida registrada: a sala do new_audit_log é por ROLE, a tela é por PERMISSÃO 'logs'
// — ligar o listener hoje vazaria evento pra quem perdeu a permissão; redesenho futuro).
function audErr(e) { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; }

// created_at (timestamp UTC do banco) -> data/hora locais pt-BR pra exibição.
function audQuando(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { data: '—', hora: '—' };
  return { data: d.toLocaleDateString('pt-BR'), hora: d.toLocaleTimeString('pt-BR') };
}

const AUD_PAGE_SIZE = 50; // = limit default do backend (teto 100; acima disso o backend dá 400)

function useFRAuditLogs(filtros, offset) {
  const R = window.React;
  const [data, setData] = R.useState({ logs: [], total: 0, limit: AUD_PAGE_SIZE, offset: 0 });
  const [loading, setLoading] = R.useState(true);
  const [error, setError] = R.useState(null);
  const [tick, setTick] = R.useState(0); // reload manual (botão Atualizar / Tentar novamente)
  R.useEffect(function () {
    let vivo = true;
    setLoading(true); setError(null);
    const params = { limit: AUD_PAGE_SIZE, offset: offset };
    if (filtros.action) params.action = filtros.action;
    if (filtros.user) params.user = filtros.user;
    if (filtros.q) params.q = filtros.q;
    if (filtros.startDate) params.startDate = filtros.startDate;
    if (filtros.endDate) params.endDate = filtros.endDate;
    window.FRApi.get('/admin/logs', { params: params, skipLoading: true })
      .then(function (res) {
        if (!vivo) return;
        const d = res && res.data ? res.data : {};
        setData({ logs: Array.isArray(d.logs) ? d.logs : [], total: d.total || 0, limit: d.limit || AUD_PAGE_SIZE, offset: d.offset || 0 });
        setLoading(false);
      })
      .catch(function (e) { if (!vivo) return; setError(audErr(e)); setLoading(false); });
    return function () { vivo = false; };
  }, [filtros.action, filtros.user, filtros.q, filtros.startDate, filtros.endDate, offset, tick]);
  return { data: data, loading: loading, error: error, reload: function () { setTick(function (n) { return n + 1; }); } };
}

// Gate por permissão: sem page_key 'logs' a tela interna NEM MONTA (nenhuma chamada de rede),
// e o usuário vê a mesma retórica do 403 do backend — o padrão das outras telas ligadas, onde
// essa mensagem chega pelo Card de erro da API.
function PageAuditoria({ t }) {
  const A = window.FRAuth;
  if (!A || typeof A.canAccess !== 'function' || !A.canAccess('logs')) {
    return (
      <div>
        <PageHeader t={t} title="Auditoria" subtitle="Histórico completo de ações — quem fez, o quê e quando." />
        <Card t={t} style={{ padding: 40, textAlign: 'center' }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'inline-grid', placeItems: 'center', marginBottom: 14 }}><Icon name="lock" size={24} /></span>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700 }}>
            Acesso bloqueado. Não possui o nível de permissão necessário (logs) para ver a auditoria.
          </div>
        </Card>
      </div>
    );
  }
  return <PageAuditoriaLogs t={t} />;
}

function PageAuditoriaLogs({ t }) {
  const R = window.React;
  const [action, setAction] = R.useState('ALL');
  const [user, setUser] = R.useState('todos');
  const [qInput, setQInput] = R.useState('');
  const [q, setQ] = R.useState('');
  const [startDate, setStartDate] = R.useState('');
  const [endDate, setEndDate] = R.useState('');
  const [offset, setOffset] = R.useState(0);
  const [sel, setSel] = R.useState(null);

  // Busca livre com debounce: tecla NÃO vira request; 400ms de silêncio viram UMA request.
  R.useEffect(function () {
    const id = setTimeout(function () { setQ(qInput.trim()); }, 400);
    return function () { clearTimeout(id); };
  }, [qInput]);

  // Mudou qualquer filtro -> volta pra primeira página (offset velho podia passar do novo total).
  R.useEffect(function () { setOffset(0); }, [action, user, q, startDate, endDate]);

  const filtros = {
    action: action !== 'ALL' ? action : '',
    user: user !== 'todos' ? user : '',
    q: q, startDate: startDate, endDate: endDate,
  };
  const { data, loading, error, reload } = useFRAuditLogs(filtros, offset);

  // Dropdown de usuários REAIS, semeado UMA vez dos últimos 100 eventos (não há endpoint
  // dedicado; v1 aceita a janela). O filtro em si é server-side (?user= ILIKE nome/email) —
  // a lista só alimenta o select. Falhou? A tela segue de pé só com "Todos".
  const [usuarios, setUsuarios] = R.useState([]);
  R.useEffect(function () {
    let vivo = true;
    window.FRApi.get('/admin/logs', { params: { limit: 100 }, skipLoading: true })
      .then(function (res) {
        if (!vivo) return;
        const rows = (res && res.data && res.data.logs) || [];
        // 'Usuário Removido' FORA do dropdown: é o COALESCE de autor apagado, não identidade
        // filtrável (?user= ILIKE name/email NULL → sempre zero = falso-vazio). Órfãos seguem
        // aparecendo nas listagens sem filtro.
        setUsuarios(Array.from(new Set(rows.map(function (l) { return l.user_name; }).filter(function (n) { return n && n !== 'Usuário Removido'; }))).sort());
      })
      .catch(function () { /* select fica só com "Todos" — sem quebrar a tela */ });
    return function () { vivo = false; };
  }, []);

  const fmt = window.FRAuditFormat;
  const av = (n) => String(n || '—').split(' ').map((x) => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const selStyle = { boxSizing: 'border-box', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 32px 0 13px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', appearance: 'none', WebkitAppearance: 'none', outline: 'none', cursor: 'pointer' };
  // colorScheme segue o TEMA DO APP (não o do SO): frTokens não expõe flag de modo, mas o
  // panel do tema claro é sempre '#ffffff' (sidebar.jsx) — é o discriminador disponível.
  const dateStyle = { boxSizing: 'border-box', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 13px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', outline: 'none', colorScheme: t.panel === '#ffffff' ? 'light' : 'dark' };

  // Paginação 100% do envelope: total/limit/offset ditam página atual e navegação.
  const totalPaginas = Math.max(1, Math.ceil(data.total / data.limit));
  const pagina = Math.floor(data.offset / data.limit) + 1;
  const temAnterior = offset > 0;
  const temProxima = offset + data.limit < data.total;
  const pageBtn = (enabled) => ({ all: 'unset', boxSizing: 'border-box', cursor: enabled ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: enabled ? t.text : t.faint, border: `1px solid ${t.border}`, background: t.panel, opacity: enabled ? 1 : 0.55 });

  return (
    <div>
      <PageHeader t={t} title="Auditoria" subtitle="Histórico completo de ações — quem fez, o quê e quando."
        actions={<Btn t={t} kind="ghost" icon="refresh" onClick={() => reload()}>Atualizar</Btn>} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 240px', minWidth: 200, height: 44, padding: '0 14px', borderRadius: 11, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
          <Icon name="search" size={17} /><input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Buscar no conteúdo dos eventos…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
        </label>
        <div style={{ position: 'relative' }}>
          <select value={user} onChange={(e) => setUser(e.target.value)} style={selStyle}><option value="todos">Todos os usuários</option>{usuarios.map((u) => <option key={u} value={u}>{u}</option>)}</select>
          <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 14, color: t.muted, pointerEvents: 'none' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={action} onChange={(e) => setAction(e.target.value)} style={selStyle}><option value="ALL">Todas as ações</option>{Object.keys(fmt.AUDIT_ACTIONS).map((k) => <option key={k} value={k}>{k}</option>)}</select>
          <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 14, color: t.muted, pointerEvents: 'none' }} />
        </div>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} title="De (data inicial)" style={dateStyle} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} title="Até (data final, inclusiva)" style={dateStyle} />
      </div>

      <div style={{ fontSize: 12.5, color: t.muted, marginBottom: 14 }}>
        {loading ? 'Carregando…' : `${data.total} ${data.total === 1 ? 'evento' : 'eventos'} · página ${pagina} de ${totalPaginas}`}
      </div>

      {error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
        </Card>
      ) : (
      <Card t={t} style={{ padding: 8 }}>
        {loading && data.logs.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: t.muted, fontSize: 13 }}>Carregando auditoria…</div>}
        {!loading && data.logs.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: t.muted, fontSize: 13 }}>Nenhum evento para este filtro.</div>}
        {data.logs.map((l, i) => {
          const f = fmt.formatAudit(l.action, l.details); const c = uiTone(t, f.kind);
          const quando = audQuando(l.created_at);
          return (
            <div key={l.id} onClick={() => setSel(l)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', borderRadius: 12, cursor: 'pointer', borderBottom: i === data.logs.length - 1 ? 'none' : `1px solid ${t.border}`, transition: 'background .12s', opacity: loading ? 0.6 : 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12.5, flexShrink: 0 }}>
                {av(l.user_name)}
                <span style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: c.fg, color: '#fff', display: 'grid', placeItems: 'center', border: `2px solid ${t.panel}` }}><Icon name={f.icon} size={9} /></span>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>{l.user_name}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.04em', padding: '2px 8px', borderRadius: 6, background: c.bg, color: c.fg, textTransform: 'uppercase' }}>{f.verbo}</span>
                  <span style={{ fontSize: 13, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.alvo}</span>
                </div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.frase}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: t.text }}>{quando.hora}</div>
                <div style={{ fontSize: 11, color: t.faint }}>{quando.data}</div>
              </div>
              <Icon name="chevronRight" size={16} style={{ color: t.faint, flexShrink: 0 }} />
            </div>
          );
        })}
      </Card>
      )}

      {!error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <button disabled={!temAnterior} onClick={() => temAnterior && setOffset(Math.max(0, offset - data.limit))} style={pageBtn(temAnterior)}><Icon name="chevronLeft" size={15} /> Anterior</button>
          <button disabled={!temProxima} onClick={() => temProxima && setOffset(offset + data.limit)} style={pageBtn(temProxima)}>Próxima <Icon name="chevronRight" size={15} /></button>
        </div>
      )}

      {sel && (() => {
        const f = fmt.formatAudit(sel.action, sel.details); const c = uiTone(t, f.kind);
        const quando = audQuando(sel.created_at);
        // Modal v1: SEM 'Página' e SEM sku (cortes de escopo); setor real no cabeçalho.
        const linhas = [
          ['Ação realizada', f.alvo, 'clipboard'],
          ['Detalhe', f.frase, 'pencil'],
          ['Data e hora', `${quando.data} às ${quando.hora}`, 'clock'],
          ['Endereço IP', sel.ip_address || '—', 'lock'],
        ];
        return (
        <div onClick={() => setSel(null)} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '22px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
              <span style={{ width: 44, height: 44, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 14, flexShrink: 0 }}>{av(sel.user_name)}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 16.5, fontWeight: 850, color: t.text }}>{sel.user_name}</div><div style={{ fontSize: 12, color: t.muted }}>{sel.sector || 'Setor não informado'} · {sel.ip_address || '—'}</div></div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, padding: '6px 11px', borderRadius: 8, background: c.bg, color: c.fg, textTransform: 'uppercase' }}><Icon name={f.icon} size={13} /> {f.verbo}</span>
              <button onClick={() => setSel(null)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {linhas.map(([k, v, ic]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '12px 0', borderBottom: k === 'Endereço IP' ? 'none' : `1px solid ${t.border}` }}>
                  <span style={{ width: 32, height: 32, borderRadius: 9, background: t.elevated, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={ic} size={15} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase' }}>{k}</div><div style={{ fontSize: 13.5, fontWeight: 600, color: t.text, marginTop: 3, overflowWrap: 'anywhere' }}>{v}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ); })()}
    </div>
  );
}


// ---------- Painel TI (Suporte ao Desenvolvedor) ----------
const DEV = { nome: 'Diego Alves', cargo: 'Desenvolvedor', online: true };
const DEV_ATUAL = { titulo: 'Integração NF-e v2', desc: 'Sincronização automática de notas fiscais com o estoque.', prog: 70, prazo: '17/06 · 18h', restante: 'hoje' };
const DEV_TRABALHOS = [
  { titulo: 'Integração NF-e v2', prog: 70, eta: 'hoje', tone: 'blue' },
  { titulo: 'Correção fila de impressão 3D', prog: 40, eta: 'amanhã', tone: 'amber' },
  { titulo: 'Relatório de auditoria export', prog: 15, eta: 'sex', tone: 'gray' },
];
const TICKET_STATUS = {
  aberto:      { label: 'Aberto', kind: 'amber', step: 0 },
  analise:     { label: 'Em análise', kind: 'blue', step: 1 },
  desenvolvimento: { label: 'Em desenvolvimento', kind: 'accent', step: 2 },
  concluido:   { label: 'Concluído', kind: 'green', step: 3 },
};
const TICKET_STEPS = ['Aberto', 'Em análise', 'Desenvolvimento', 'Concluído'];
const CHAMADOS_SEED = [
  { id: 'TI-1042', titulo: 'Erro ao exportar relatório em PDF', prioridade: ['Alta', 'red'], status: 'desenvolvimento', data: '17/06 08:40', desc: 'O botão PDF na página Relatórios não gera o arquivo.',
    chat: [{ de: 'user', txt: 'O PDF não baixa, dá erro.', h: '08:41' }, { de: 'dev', txt: 'Reproduzi aqui, é a fonte. Corrigindo agora.', h: '09:02' }] },
  { id: 'TI-1039', titulo: 'Lentidão na busca de produtos', prioridade: ['Média', 'amber'], status: 'analise', data: '16/06 15:20', desc: 'A busca demora ~5s com muitos itens.',
    chat: [{ de: 'user', txt: 'Tá bem lento pra buscar.', h: '15:22' }] },
  { id: 'TI-1031', titulo: 'Adicionar coluna de lote nas entradas', prioridade: ['Baixa', 'blue'], status: 'concluido', data: '14/06 10:05', desc: 'Solicitação de nova coluna.',
    chat: [{ de: 'dev', txt: 'Implementado e publicado ✅', h: '11:30' }] },
];

function PagePainelTI({ t }) {
  const [chamados, setChamados] = useStateR(CHAMADOS_SEED);
  const [novo, setNovo] = useStateR(false);
  const [chatId, setChatId] = useStateR(null);
  const [detId, setDetId] = useStateR(null);
  const [msg, setMsg] = useStateR('');
  const [form, setForm] = useStateR({ titulo: '', prioridade: 'Média', desc: '', imagens: [] });
  const chatCham = chamados.find((c) => c.id === chatId);
  const detCham = chamados.find((c) => c.id === detId);
  const abertos = chamados.filter((c) => c.status !== 'concluido').length;

  const enviarMsg = () => {
    if (!msg.trim()) return;
    setChamados((xs) => xs.map((c) => c.id === chatId ? { ...c, chat: [...c.chat, { de: 'user', txt: msg.trim(), h: 'agora' }] } : c));
    setMsg('');
  };
  const onFiles = (files) => {
    [...files].slice(0, 4).forEach((f) => { const r = new FileReader(); r.onload = () => setForm((s) => ({ ...s, imagens: [...s.imagens, { nome: f.name, url: r.result }] })); r.readAsDataURL(f); });
  };
  const criarChamado = () => {
    if (!form.titulo.trim()) return;
    const pmap = { Alta: 'red', Média: 'amber', Baixa: 'blue' };
    const id = 'TI-' + (1043 + chamados.length);
    setChamados((xs) => [{ id, titulo: form.titulo.trim(), prioridade: [form.prioridade, pmap[form.prioridade]], status: 'aberto', data: 'agora',
      solicitante: USER.name, setor: USER.setor, funcao: USER.funcao, desc: form.desc.trim(), imagens: form.imagens,
      chat: form.desc.trim() ? [{ de: 'user', txt: form.desc.trim(), h: 'agora', imagens: form.imagens }] : [] }, ...xs]);
    setForm({ titulo: '', prioridade: 'Média', desc: '', imagens: [] }); setNovo(false);
  };
  const field = { boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 };

  return (
    <div>
      <PageHeader t={t} title="Suporte & TI" subtitle="Abra chamados, acompanhe o desenvolvimento e fale com o time de TI."
        actions={<Btn t={t} icon="plus" onClick={() => setNovo(true)}>Abrir chamado</Btn>} />

      {/* hero — trabalho atual do dev */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '26px 28px', marginBottom: 22, background: `linear-gradient(120deg, #0b1430 0%, ${t.accent} 145%)`, color: '#fff' }}>
        <Icon name="terminal" size={170} style={{ position: 'absolute', right: -24, top: -30, opacity: 0.1 }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,.18)', marginBottom: 14 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 0 3px rgba(52,211,153,.35)' }} /> Dev trabalhando agora
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.7)' }}>{DEV.nome} · {DEV.cargo}</div>
            <h2 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 850, letterSpacing: '-.02em', lineHeight: 1.1 }}>{DEV_ATUAL.titulo}</h2>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,.82)', maxWidth: 440, lineHeight: 1.5 }}>{DEV_ATUAL.desc}</p>
            <div style={{ marginTop: 18, maxWidth: 420 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, marginBottom: 7 }}><span style={{ color: 'rgba(255,255,255,.85)' }}>Progresso</span><span>{DEV_ATUAL.prog}%</span></div>
              <div style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,.2)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${DEV_ATUAL.prog}%`, borderRadius: 6, background: '#34d399' }} /></div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 16, padding: '16px 20px', minWidth: 170 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: 'rgba(255,255,255,.8)', textTransform: 'uppercase' }}><Icon name="clock" size={13} /> Prazo de término</div>
            <div style={{ fontSize: 22, fontWeight: 850, marginTop: 7 }}>{DEV_ATUAL.prazo}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.78)', marginTop: 3 }}>Conclui {DEV_ATUAL.restante}</div>
          </div>
        </div>
      </div>


      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* coluna principal: chamados */}
        <div style={{ flex: '2 1 420px', minWidth: 300 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
            <KPI t={t} mini icon="clipboard" label="Meus chamados" value={chamados.length} kind="accent" />
            <KPI t={t} mini icon="clock" label="Em aberto" value={abertos} kind="amber" />
            <KPI t={t} mini icon="check" label="Resolvidos" value={chamados.length - abertos} kind="green" />
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 12 }}>Acompanhe seus chamados</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chamados.map((c) => {
              const st = TICKET_STATUS[c.status]; const col = uiTone(t, st.kind);
              return (
                <Card t={t} key={c.id} hover style={{ padding: 16 }}>
                  <div onClick={() => setDetId(c.id)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: t.muted }}>{c.id}</span>
                        <Badge t={t} kind={c.prioridade[1]} dot>{c.prioridade[0]}</Badge>
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: col.bg, color: col.fg, textTransform: 'uppercase' }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: t.text, margin: '10px 0 12px' }}>{c.titulo}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      {TICKET_STEPS.map((s, i) => (
                        <React.Fragment key={s}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, background: i <= st.step ? (i === st.step ? t.accent : uiTone(t, 'green').fg) : t.elevated, color: i <= st.step ? '#fff' : t.faint, border: i <= st.step ? 'none' : `2px solid ${t.border}` }}>{i < st.step ? <Icon name="check" size={11} /> : <span style={{ fontSize: 9, fontWeight: 800 }}>{i + 1}</span>}</span>
                          {i < TICKET_STEPS.length - 1 && <span style={{ flex: 1, height: 2, background: i < st.step ? uiTone(t, 'green').fg : t.border }} />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
                    <span style={{ fontSize: 11.5, color: t.faint }}>{c.data}</span>
                    <button onClick={() => setChatId(c.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: t.accentText, padding: '6px 11px', borderRadius: 9, background: t.accentSoft }}><Icon name="bell" size={14} /> Chat {c.chat.length > 0 && `· ${c.chat.length}`}</button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* coluna lateral: dev + status */}
        <div style={{ flex: '1 1 280px', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card t={t} style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ width: 46, height: 46, borderRadius: '50%', background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 15 }}>DA</span>
                <span style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: uiTone(t, 'green').fg, border: `2.5px solid ${t.panel}` }} />
              </div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 850, color: t.text }}>{DEV.nome}</div><div style={{ fontSize: 12, color: uiTone(t, 'green').fg, fontWeight: 600 }}>● Online · {DEV.cargo}</div></div>
            </div>
            <button onClick={() => setChatId(chamados[0] && chamados[0].id)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 42, marginTop: 16, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13.5, fontWeight: 800, background: t.accent, color: t.onAccent }}><Icon name="bell" size={16} /> Falar com o Dev</button>
          </Card>

          <Card t={t} style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Icon name="terminal" size={16} style={{ color: t.accentText }} />
              <span style={{ fontSize: 13.5, fontWeight: 850, color: t.text }}>Trabalhos em andamento</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {DEV_TRABALHOS.map((w) => (
                <div key={w.titulo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: t.text }}>{w.titulo}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.muted, whiteSpace: 'nowrap' }}>{w.prog}% · {w.eta}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${w.prog}%`, borderRadius: 6, background: uiTone(t, w.tone).fg }} /></div>
                </div>
              ))}
            </div>
          </Card>

          <Card t={t} style={{ padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 850, color: t.text, marginBottom: 14 }}>Status dos serviços</div>
            {[['API Principal', 'green'], ['Banco de Dados', 'green'], ['Impressão 3D', 'amber'], ['NF-e', 'green']].map(([nome, tone], i, arr) => (
              <div key={nome} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.border}` }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: uiTone(t, tone).fg, boxShadow: `0 0 0 3px ${uiTone(t, tone).bg}`, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: t.text }}>{nome}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: uiTone(t, tone).fg }}>{tone === 'green' ? 'Operacional' : 'Instável'}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* modal novo chamado */}
      {novo && (
        <div onClick={() => setNovo(false)} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center' }}><Icon name="plus" size={19} /></span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Abrir chamado</div><div style={{ fontSize: 12.5, color: t.muted }}>Descreva o problema ou solicitação ao Dev.</div></div>
              <button onClick={() => setNovo(false)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                <span style={{ width: 38, height: 38, borderRadius: '50%', background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 14, flexShrink: 0 }}>{USER.name[0]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>{USER.name}</div>
                  <div style={{ fontSize: 11.5, color: t.muted }}>{USER.setor} · {USER.funcao}</div>
                </div>
                <Badge t={t} kind="accent">Solicitante</Badge>
              </div>
              <div><label style={lab}>Título</label><input value={form.titulo} onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))} placeholder="Ex: Erro ao salvar produto" style={field} /></div>
              <div>
                <label style={lab}>Prioridade</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Baixa', 'Média', 'Alta'].map((p) => { const on = form.prioridade === p; const k = { Baixa: 'blue', Média: 'amber', Alta: 'red' }[p]; return (
                    <button key={p} onClick={() => setForm((s) => ({ ...s, prioridade: p }))} style={{ all: 'unset', cursor: 'pointer', flex: 1, textAlign: 'center', height: 40, lineHeight: '40px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: on ? uiTone(t, k).fg : t.elevated, color: on ? '#fff' : t.muted, border: `1px solid ${on ? 'transparent' : t.border}` }}>{p}</button>
                  ); })}
                </div>
              </div>
              <div><label style={lab}>Descrição</label><textarea value={form.desc} onChange={(e) => setForm((s) => ({ ...s, desc: e.target.value }))} rows={4} placeholder="Detalhe o que aconteceu…" style={{ ...field, height: 'auto', padding: '12px 13px', resize: 'vertical' }} /></div>
              <div>
                <label style={lab}>Anexar imagens</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {form.imagens.map((im, i) => (
                    <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: `1px solid ${t.border}` }}>
                      <img src={im.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setForm((s) => ({ ...s, imagens: s.imagens.filter((_, j) => j !== i) }))} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: 'rgba(8,10,16,.7)', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="x" size={12} /></button>
                    </div>
                  ))}
                  {form.imagens.length < 4 && (
                    <label style={{ width: 72, height: 72, borderRadius: 10, border: `2px dashed ${t.borderStrong}`, display: 'grid', placeItems: 'center', cursor: 'pointer', color: t.muted }}>
                      <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => onFiles(e.target.files)} />
                      <Icon name="upload" size={20} />
                    </label>
                  )}
                </div>
                <div style={{ fontSize: 11, color: t.faint, marginTop: 7 }}>Anexe prints do problema (até 4 imagens).</div>
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Btn t={t} kind="ghost" onClick={() => setNovo(false)}>Cancelar</Btn>
              <Btn t={t} icon="check" onClick={criarChamado}>Abrir chamado</Btn>
            </div>
          </div>
        </div>
      )}

      {/* modal detalhe chamado */}
      {detCham && (() => { const st = TICKET_STATUS[detCham.status]; return (
        <div onClick={() => setDetId(null)} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,96vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '22px 24px', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: t.muted }}>{detCham.id}</span>
                <Badge t={t} kind={detCham.prioridade[1]} dot>{detCham.prioridade[0]}</Badge>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: uiTone(t, st.kind).bg, color: uiTone(t, st.kind).fg, textTransform: 'uppercase' }}>{st.label}</span>
                <button onClick={() => setDetId(null)} style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
              </div>
              <div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{detCham.titulo}</div>
            </div>
            <div style={{ padding: 24, overflowY: 'auto' }} className="fr-scroll">
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 22 }}>
                {TICKET_STEPS.map((s, i) => (
                  <React.Fragment key={s}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', background: i <= st.step ? (i === st.step ? t.accent : uiTone(t, 'green').fg) : t.elevated, color: i <= st.step ? '#fff' : t.faint, border: i <= st.step ? 'none' : `2px solid ${t.border}` }}>{i < st.step ? <Icon name="check" size={13} /> : <span style={{ fontSize: 11, fontWeight: 800 }}>{i + 1}</span>}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: i <= st.step ? t.text : t.faint, whiteSpace: 'nowrap' }}>{s}</span>
                    </div>
                    {i < TICKET_STEPS.length - 1 && <span style={{ flex: 1, height: 2, background: i < st.step ? uiTone(t, 'green').fg : t.border, marginTop: -18 }} />}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 7 }}>Solicitante</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
                <span style={{ width: 36, height: 36, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 13 }}>{(detCham.solicitante || USER.name)[0]}</span>
                <div><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{detCham.solicitante || USER.name}</div><div style={{ fontSize: 11.5, color: t.muted }}>{detCham.setor || USER.setor} · {detCham.funcao || USER.funcao}</div></div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 7 }}>Descrição</div>
              <div style={{ fontSize: 13.5, color: t.text, lineHeight: 1.5, marginBottom: detCham.imagens && detCham.imagens.length ? 14 : 20 }}>{detCham.desc || '—'}</div>
              {detCham.imagens && detCham.imagens.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                  {detCham.imagens.map((im, i) => <img key={i} src={im.url} alt="" style={{ width: 84, height: 84, borderRadius: 10, objectFit: 'cover', border: `1px solid ${t.border}` }} />)}
                </div>
              )}
              <button onClick={() => { setDetId(null); setChatId(detCham.id); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 44, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13.5, fontWeight: 800, background: t.accentSoft, color: t.accentText }}><Icon name="bell" size={16} /> Abrir chat do chamado</button>
            </div>
          </div>
        </div>
      ); })()}

      {/* chat drawer */}
      {chatCham && (
        <div onClick={() => setChatId(null)} style={{ position: 'fixed', inset: 0, zIndex: 66, background: 'rgba(8,10,16,.5)', display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(420px,100%)', height: '100%', display: 'flex', flexDirection: 'column', background: t.panel, borderLeft: `1px solid ${t.borderStrong}`, boxShadow: t.shadow }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ position: 'relative' }}><span style={{ width: 38, height: 38, borderRadius: '50%', background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 13 }}>DA</span><span style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: uiTone(t, 'green').fg, border: `2px solid ${t.panel}` }} /></div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{DEV.nome}</div><div style={{ fontSize: 11.5, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chatCham.id} · {chatCham.titulo}</div></div>
              <button onClick={() => setChatId(null)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
            </div>
            <div className="fr-scroll" style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatCham.chat.length === 0 && <div style={{ textAlign: 'center', color: t.faint, fontSize: 13, marginTop: 30 }}>Envie uma mensagem para o Dev.</div>}
              {chatCham.chat.map((m, i) => {
                const mine = m.de === 'user';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '78%' }}>
                      <div style={{ padding: '10px 13px', borderRadius: 14, borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4, background: mine ? t.accent : t.elevated, color: mine ? t.onAccent : t.text, fontSize: 13.5, lineHeight: 1.45 }}>{m.txt}</div>
                      <div style={{ fontSize: 10, color: t.faint, marginTop: 4, textAlign: mine ? 'right' : 'left' }}>{mine ? 'Você' : DEV.nome} · {m.h}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: 14, borderTop: `1px solid ${t.border}`, display: 'flex', gap: 9 }}>
              <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarMsg()} placeholder="Pergunta rápida…" style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 12, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={enviarMsg} style={{ all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: t.accent, color: t.onAccent, flexShrink: 0 }}><Icon name="send" size={18} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


Object.assign(window, {
  PageTarefas, PageEletrica, PageAvisos, PageCalculadora, PageEncomendar,
  PageReposicoes, PageConfronto, PageControleSaida,
  PageCriticos, PagePermissoes, PageAuditoria, PagePainelTI,
});
