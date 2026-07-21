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
const REP_ENVIO_METODOS = [
  { id: 'correios-pac', nome: 'Correios — PAC', icon: 'truck' },
  { id: 'correios-sedex', nome: 'Correios — Sedex', icon: 'truck' },
  { id: 'jadlog', nome: 'Jadlog', icon: 'truck' },
  { id: 'transportadora', nome: 'Transportadora', icon: 'truck' },
  { id: 'retirada', nome: 'Retirada no local', icon: 'home' },
];
const REP_SEED = [
  { n: 'REP-1024', cliente: 'Granja Loja Centro', cidade: 'Curitiba - PR', status: 'pendente', envio: null, itens: [
    { sku: '9.99.0238', nome: 'Parafuso Sextavado M8', qtd: 40, sep: 0, estoque: 120, preco: 0.85 },
    { sku: '5.20.0099', nome: 'Cabo Flexível 2,5mm', qtd: 30, sep: 0, estoque: 18, preco: 3.2 },
    { sku: '4.10.0233', nome: 'Rolamento 6204ZZ', qtd: 8, sep: 0, estoque: 24, preco: 12.4 },
    { sku: '6.30.0205', nome: 'Disjuntor 25A', qtd: 6, sep: 0, estoque: 9, preco: 28 },
  ] },
  { n: 'REP-1023', cliente: 'Granja Filial Norte', cidade: 'Maringá - PR', status: 'pendente', envio: null, itens: [
    { sku: '1.02.0044', nome: 'Chapa Aço 1020 2mm', qtd: 12, sep: 0, estoque: 30, preco: 145 },
    { sku: '7.40.0150', nome: 'Arruela Lisa 8mm', qtd: 200, sep: 0, estoque: 500, preco: 0.2 },
    { sku: '5.31.0022', nome: 'Conector RJ45', qtd: 50, sep: 0, estoque: 12, preco: 2.5 },
  ] },
  { n: 'REP-1019', cliente: 'Granja Depósito Sul', cidade: 'Joinville - SC', status: 'em_preparo', envio: null, itens: [
    { sku: '3.00.0101', nome: 'Filamento PLA Azul', qtd: 4, sep: 4, estoque: 20, preco: 89.9 },
    { sku: '9.99.0238', nome: 'Parafuso Sextavado M8', qtd: 60, sep: 35, estoque: 120, preco: 0.85 },
    { sku: '4.10.0233', nome: 'Rolamento 6204ZZ', qtd: 10, sep: 0, estoque: 24, preco: 12.4 },
  ] },
  { n: 'REP-1011', cliente: 'Granja Loja Centro', cidade: 'Curitiba - PR', status: 'enviado', envio: { rastreio: 'BR123456789BR', metodo: 'correios-sedex' }, itens: [
    { sku: '5.20.0099', nome: 'Cabo Flexível 2,5mm', qtd: 6, sep: 6, estoque: 18, preco: 3.2 },
    { sku: '7.40.0150', nome: 'Arruela Lisa 8mm', qtd: 100, sep: 100, estoque: 500, preco: 0.2 },
  ] },
];
const repStatusMeta = { pendente: ['Pendente', 'amber'], em_preparo: ['Em preparo', 'blue'], concluido: ['Separado', 'green'], enviado: ['Enviado', 'green'] };
const repValor = (r) => r.itens.reduce((a, i) => a + i.preco * i.qtd, 0);
const repSepTot = (r) => r.itens.reduce((a, i) => a + i.sep, 0);
const repQtdTot = (r) => r.itens.reduce((a, i) => a + i.qtd, 0);

function RepItemRow({ t, it, onSep }) {
  const maxSep = Math.min(it.qtd, it.estoque);
  const completo = it.sep >= it.qtd;
  const disp = !completo && it.estoque > it.sep;     // há estoque para separar e ainda falta
  const set = (v) => onSep(Math.max(0, Math.min(maxSep, v)));
  const repMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const stepper = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <button onClick={() => set(it.sep - 1)} disabled={it.sep <= 0} style={{ all: 'unset', cursor: it.sep > 0 ? 'pointer' : 'not-allowed', width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: t.panel, border: `1px solid ${t.border}`, color: t.muted, opacity: it.sep > 0 ? 1 : 0.4 }}><Icon name="minus" size={16} /></button>
      <input value={it.sep} onChange={(e) => set(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)} inputMode="numeric" style={{ boxSizing: 'border-box', width: 64, height: 42, textAlign: 'center', borderRadius: 10, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 17, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
      <button onClick={() => set(it.sep + 1)} disabled={it.sep >= maxSep} style={{ all: 'unset', cursor: it.sep < maxSep ? 'pointer' : 'not-allowed', width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: t.panel, border: `1px solid ${t.border}`, color: t.accentText, opacity: it.sep < maxSep ? 1 : 0.4 }}><Icon name="plus" size={16} /></button>
      <span style={{ fontSize: 13, color: t.faint, width: 38, textAlign: 'right' }}>/{it.qtd}</span>
    </div>
  );
  if (repMobile) {
    return (
      <div style={{ padding: '14px 16px', borderRadius: 14, background: t.elevated, border: `1px solid ${completo ? frHexToRgba('#22c55e', 0.4) : disp ? frHexToRgba(t.accent, 0.32) : t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          {disp && <span title="Disponível para separar" style={{ width: 9, height: 9, borderRadius: '50%', background: t.accent, flexShrink: 0, marginTop: 5, boxShadow: `0 0 0 4px ${frHexToRgba(t.accent, 0.18)}` }} />}
          {completo && <Icon name="check" size={20} style={{ color: uiTone(t, 'green').fg, flexShrink: 0, marginTop: 1 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: t.text }}>{it.nome}</div>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>SKU {it.sku} · pedido {it.qtd} · estoque {it.estoque}{it.estoque < it.qtd ? <b style={{ color: uiTone(t, 'red').fg }}> · falta estoque</b> : ''}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: t.faint }}>Separar</span>
          {stepper}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, background: t.elevated, border: `1px solid ${completo ? frHexToRgba('#22c55e', 0.4) : disp ? frHexToRgba(t.accent, 0.32) : t.border}` }}>
      {disp && <span title="Disponível para separar" style={{ width: 9, height: 9, borderRadius: '50%', background: t.accent, flexShrink: 0, boxShadow: `0 0 0 4px ${frHexToRgba(t.accent, 0.18)}` }} />}
      {completo && <Icon name="check" size={20} style={{ color: uiTone(t, 'green').fg, flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{it.nome}</div>
        <div style={{ fontSize: 12.5, color: t.muted, marginTop: 2 }}>SKU {it.sku} · pedido {it.qtd} · estoque {it.estoque}{it.estoque < it.qtd ? <b style={{ color: uiTone(t, 'red').fg }}> · falta estoque</b> : ''}</div>
      </div>
      {stepper}
    </div>
  );
}

function RepDetail({ t, rep, onClose, onUpdate }) {
  const [step, setStep] = useStateR(rep.status === 'enviado' ? 'envio' : 'separar');
  const [rastreio, setRastreio] = useStateR(rep.envio ? rep.envio.rastreio : '');
  const [metodo, setMetodo] = useStateR(rep.envio ? rep.envio.metodo : '');
  const [soFalta, setSoFalta] = useStateR(false);
  const sm = repStatusMeta[rep.status];
  const sepTot = repSepTot(rep), qtdTot = repQtdTot(rep);
  const pct = qtdTot ? Math.round((sepTot / qtdTot) * 100) : 0;
  const faltam = rep.itens.filter((i) => i.sep < Math.min(i.qtd, i.estoque)).length;
  const tudoSeparado = rep.itens.every((i) => i.sep >= i.qtd);
  const enviado = rep.status === 'enviado';

  const setSep = (idx, v) => onUpdate({ ...rep, status: 'em_preparo', itens: rep.itens.map((it, i) => (i === idx ? { ...it, sep: v } : it)) });
  const separarTudo = () => onUpdate({ ...rep, status: 'em_preparo', itens: rep.itens.map((it) => ({ ...it, sep: Math.min(it.qtd, it.estoque) })) });
  const confirmEnvio = () => { onUpdate({ ...rep, status: 'enviado', envio: { rastreio: rastreio.trim(), metodo } }); };

  const view = soFalta ? rep.itens.filter((i) => i.sep < Math.min(i.qtd, i.estoque)) : rep.itens;
  const metodoNome = (id) => (REP_ENVIO_METODOS.find((m) => m.id === id) || {}).nome || '—';
  const field = { boxSizing: 'border-box', height: 46, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 65, background: t.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: t.panel, overflow: 'hidden' }}>
        {/* header */}
        <div style={{ position: 'relative', padding: '26px 32px', background: `linear-gradient(135deg, ${t.accent}, ${frHexToRgba(t.accent, 0.72)})`, color: '#fff' }}>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 22, right: 26, display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 13, fontWeight: 700 }}><Icon name="chevronLeft" size={16} /> Voltar</button>
          <div style={{ maxWidth: 1500, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '4px 11px', borderRadius: 999, background: 'rgba(255,255,255,.2)', marginBottom: 12 }}><Icon name="refresh" size={13} /> {sm[0]}</div>
            <div style={{ fontSize: 26, fontWeight: 850, letterSpacing: '-.01em' }}>{rep.n}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,.9)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="users" size={15} /> {rep.cliente}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="mapPin" size={15} /> {rep.cidade}</span>
            </div>
          </div>
        </div>

        {/* step switch when not shipped */}
        {!enviado && (
          <div style={{ display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid ${t.border}`, background: t.panel }}>
            <div style={{ maxWidth: 1500, margin: '0 auto', width: '100%', display: 'flex' }}>
            {[['separar', '1 · Separar materiais'], ['envio', '2 · Dados de envio']].map(([k, lb]) => (
              <button key={k} onClick={() => setStep(k)} disabled={k === 'envio' && !tudoSeparado} style={{ all: 'unset', cursor: (k === 'envio' && !tudoSeparado) ? 'not-allowed' : 'pointer', padding: '15px 4px', marginRight: 24, fontSize: 13.5, fontWeight: 800, opacity: (k === 'envio' && !tudoSeparado) ? 0.4 : 1, color: step === k ? t.accentText : (k === 'envio' && !tudoSeparado) ? t.faint : t.muted, borderBottom: `2.5px solid ${step === k ? t.accent : 'transparent'}` }}>{lb}</button>
            ))}
            </div>
          </div>
        )}

        <div className="fr-scroll" style={{ overflowY: 'auto', flex: 1, minHeight: 0, background: t.bg }}>
          <div style={{ maxWidth: 1500, margin: '0 auto', padding: '26px 32px' }}>
          {(step === 'separar' && !enviado) && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => setSoFalta((v) => !v)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, padding: '7px 12px', borderRadius: 9, background: soFalta ? t.accent : t.elevated, color: soFalta ? t.onAccent : t.muted, border: `1px solid ${soFalta ? t.accent : t.border}` }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: soFalta ? t.onAccent : t.accent }} /> Disponível p/ separar {faltam ? `(${faltam})` : ''}
                  </button>
                </div>
                <button onClick={separarTudo} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: t.accentText, padding: '7px 12px', borderRadius: 9, background: t.accentSoft }}><Icon name="check" size={14} /> Separar tudo disponível</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {view.map((it) => <RepItemRow key={it.sku} t={t} it={it} onSep={(v) => setSep(rep.itens.indexOf(it), v)} />)}
                {view.length === 0 && <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: t.muted }}>Todos os itens disponíveis já foram separados. ✓</div>}
              </div>
            </>
          )}

          {(step === 'envio' || enviado) && (
            <>
              {enviado ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', borderRadius: 13, background: uiTone(t, 'green').bg, border: `1px solid ${frHexToRgba('#22c55e', 0.3)}` }}>
                    <Icon name="check" size={18} style={{ color: uiTone(t, 'green').fg }} /> <span style={{ fontSize: 13.5, fontWeight: 700, color: uiTone(t, 'green').fg }}>Pedido separado e enviado.</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: 16, borderRadius: 13, background: t.elevated, border: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint }}>MÉTODO DE ENVIO</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="truck" size={16} style={{ color: t.accentText }} /> {metodoNome(rep.envio.metodo)}</div>
                    </div>
                    <div style={{ padding: 16, borderRadius: 13, background: t.elevated, border: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint }}>CÓDIGO DE RASTREIO</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: rep.envio.rastreio ? t.text : t.faint, marginTop: 6, fontFamily: rep.envio.rastreio ? 'monospace' : 'inherit' }}>{rep.envio.rastreio || 'Não informado'}</div>
                    </div>
                  </div>
                  <button onClick={() => onUpdate({ ...rep, _track: Date.now() })} disabled={!rep.envio.rastreio}
                    style={{ all: 'unset', boxSizing: 'border-box', cursor: rep.envio.rastreio ? 'pointer' : 'not-allowed', width: '100%', height: 50, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14.5, fontWeight: 800, background: rep.envio.rastreio ? t.accent : t.elevated, color: rep.envio.rastreio ? t.onAccent : t.faint, boxShadow: rep.envio.rastreio ? `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` : 'none', border: rep.envio.rastreio ? 'none' : `1px solid ${t.border}` }}>
                    <Icon name="mapPin" size={18} /> Rastrear encomenda
                  </button>
                  {!rep.envio.rastreio && <div style={{ fontSize: 12, color: t.faint, textAlign: 'center' }}>Sem código de rastreio — o rastreamento não está disponível para este envio.</div>}

                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase' }}>Materiais enviados</span>
                      <span style={{ fontSize: 12.5, color: t.muted }}>{rep.itens.length} {rep.itens.length === 1 ? 'item' : 'itens'} · {repSepTot(rep)} un</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {rep.itens.map((it) => (
                        <div key={it.sku} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, background: t.elevated, border: `1px solid ${t.border}` }}>
                          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={19} /></span>
                          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{it.nome}</div><div style={{ fontSize: 12.5, color: t.muted, marginTop: 2 }}>SKU {it.sku}</div></div>
                          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}>ENVIADO</div><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{it.sep}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}`, fontSize: 12.5, color: t.muted }}>
                    <Icon name="box" size={15} style={{ color: t.accentText }} /> {sepTot} de {qtdTot} un separadas · {pct}% do pedido
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 8 }}>Método de envio</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {REP_ENVIO_METODOS.map((m) => {
                        const on = metodo === m.id;
                        return <button key={m.id} onClick={() => setMetodo(m.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 11, fontSize: 13, fontWeight: 700, background: on ? t.accent : t.elevated, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}><Icon name={m.icon} size={15} /> {m.nome}</button>;
                      })}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 8 }}>Código de rastreio <span style={{ color: t.faint, fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>· opcional</span></label>
                    <input value={rastreio} onChange={(e) => setRastreio(e.target.value.toUpperCase())} placeholder="Ex: BR123456789BR" style={{ ...field, fontFamily: 'monospace' }} />
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>

        {/* footer actions */}
        {!enviado && (
          <div style={{ padding: '16px 32px', borderTop: `1px solid ${t.border}`, background: t.panel }}>
          <div style={{ maxWidth: 1500, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: t.muted }}>
              {step === 'separar' && !tudoSeparado
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: uiTone(t, 'amber').fg, fontWeight: 700 }}><Icon name="alert" size={14} /> Separe todos os itens para concluir ({faltam} {faltam === 1 ? 'pendente' : 'pendentes'})</span>
                : <span>Total do pedido <b style={{ color: t.text }}>{fmtBRL(repValor(rep))}</b></span>}
            </div>
            {step === 'separar'
              ? <button onClick={() => tudoSeparado && setStep('envio')} disabled={!tudoSeparado} style={{ all: 'unset', boxSizing: 'border-box', cursor: tudoSeparado ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 9, height: 48, padding: '0 24px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: tudoSeparado ? t.accent : t.elevated, color: tudoSeparado ? t.onAccent : t.faint, boxShadow: tudoSeparado ? `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` : 'none' }}>Concluir separação <Icon name="chevronRight" size={16} /></button>
              : <button onClick={confirmEnvio} disabled={!metodo} style={{ all: 'unset', boxSizing: 'border-box', cursor: metodo ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 9, height: 48, padding: '0 24px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: metodo ? t.accent : t.elevated, color: metodo ? t.onAccent : t.faint, boxShadow: metodo ? `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` : 'none' }}><Icon name="truck" size={16} /> Confirmar envio</button>}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

const REP_CATALOGO = [
  { sku: '9.99.0238', nome: 'Parafuso Sextavado M8', estoque: 120, preco: 0.85 },
  { sku: '5.20.0099', nome: 'Cabo Flexível 2,5mm', estoque: 18, preco: 3.2 },
  { sku: '4.10.0233', nome: 'Rolamento 6204ZZ', estoque: 24, preco: 12.4 },
  { sku: '6.30.0205', nome: 'Disjuntor 25A', estoque: 9, preco: 28 },
  { sku: '1.02.0044', nome: 'Chapa Aço 1020 2mm', estoque: 30, preco: 145 },
  { sku: '7.40.0150', nome: 'Arruela Lisa 8mm', estoque: 500, preco: 0.2 },
  { sku: '5.31.0022', nome: 'Conector RJ45', estoque: 12, preco: 2.5 },
  { sku: '3.00.0101', nome: 'Filamento PLA Azul', estoque: 20, preco: 89.9 },
  { sku: '2.11.0080', nome: 'Porca Sextavada M8', estoque: 200, preco: 0.5 },
  { sku: '6.30.0012', nome: 'Tinta Epóxi Cinza 3,6L', estoque: 6, preco: 210 },
];

function RepNovoModal({ t, onClose, onSave }) {
  const [cliente, setCliente] = useStateR('');
  const [cidade, setCidade] = useStateR('');
  const [itens, setItens] = useStateR([]);   // { sku, nome, qtd, estoque, preco }
  const [q, setQ] = useStateR('');
  const ql = q.trim().toLowerCase();
  const disponiveis = REP_CATALOGO.filter((c) => !ql || c.nome.toLowerCase().includes(ql) || c.sku.includes(ql));
  const naLista = (sku) => itens.some((i) => i.sku === sku);
  const addItem = (c) => { if (!naLista(c.sku)) setItens((xs) => [...xs, { ...c, qtd: 1 }]); };
  const setQtd = (sku, v) => setItens((xs) => xs.map((i) => (i.sku === sku ? { ...i, qtd: Math.max(1, parseInt(String(v).replace(/[^0-9]/g, '')) || 1) } : i)));
  const delItem = (sku) => setItens((xs) => xs.filter((i) => i.sku !== sku));
  const valid = cliente.trim() && cidade.trim() && itens.length;
  const total = itens.reduce((a, i) => a + i.preco * i.qtd, 0);
  const field = { boxSizing: 'border-box', height: 46, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 8 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(820px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="refresh" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Novo pedido de reposição</div><div style={{ fontSize: 12.5, color: t.muted }}>Defina o destino e os materiais solicitados.</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>

        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 22 }}>
            <div><label style={lab}>Granja / Cliente</label><input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex: Granja Loja Centro" style={field} /></div>
            <div><label style={lab}>Cidade</label><input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Curitiba - PR" style={field} /></div>
          </div>

          <label style={lab}>Materiais do pedido</label>
          {itens.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {itens.map((it) => (
                <div key={it.sku} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{it.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {it.sku} · estoque {it.estoque}</div></div>
                  <input value={it.qtd} onChange={(e) => setQtd(it.sku, e.target.value)} inputMode="numeric" style={{ boxSizing: 'border-box', width: 60, height: 36, textAlign: 'center', borderRadius: 9, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                  <button onClick={() => delItem(it.sku)} style={{ all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
                </div>
              ))}
            </div>
          )}

          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Icon name="search" size={16} style={{ position: 'absolute', left: 13, top: 14, color: t.muted }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar material por nome ou SKU…" style={{ ...field, paddingLeft: 40 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }} className="fr-scroll">
            {disponiveis.map((c) => {
              const on = naLista(c.sku);
              return (
                <button key={c.sku} onClick={() => addItem(c)} disabled={on} style={{ all: 'unset', boxSizing: 'border-box', cursor: on ? 'default' : 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 11, border: `1px solid ${on ? frHexToRgba('#22c55e', 0.4) : t.border}`, background: on ? uiTone(t, 'green').bg : t.elevated }}
                  onMouseEnter={(e) => { if (!on) e.currentTarget.style.borderColor = t.accent; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.borderColor = t.border; }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{c.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {c.sku} · estoque {c.estoque}</div></div>
                  {on ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: uiTone(t, 'green').fg }}><Icon name="check" size={14} /> Na lista</span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: t.accentText }}><Icon name="plus" size={14} /> Adicionar</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12.5, color: t.muted }}>{itens.length} {itens.length === 1 ? 'material' : 'materiais'} · total <b style={{ color: t.text }}>{fmtBRL(total)}</b></div>
          <button onClick={() => valid && onSave({ cliente: cliente.trim(), cidade: cidade.trim(), itens: itens.map((i) => ({ sku: i.sku, nome: i.nome, qtd: i.qtd, sep: 0, estoque: i.estoque, preco: i.preco })) })} disabled={!valid}
            style={{ all: 'unset', boxSizing: 'border-box', cursor: valid ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 9, height: 48, padding: '0 24px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: valid ? t.accent : t.elevated, color: valid ? t.onAccent : t.faint, boxShadow: valid ? `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` : 'none' }}>
            <Icon name="check" size={17} /> Criar pedido
          </button>
        </div>
      </div>
    </div>
  );
}

function PageReposicoes({ t }) {
  const [reps, setReps] = useStateR(REP_SEED);
  const [tab, setTab] = useStateR('pendente');
  const [openId, setOpenId] = useStateR(null);
  const [tracking, setTracking] = useStateR(null);
  const [novoOpen, setNovoOpen] = useStateR(false);
  const cur = reps.find((r) => r.n === openId);

  const criarPedido = (data) => {
    const seq = 1024 + reps.length + 1;
    const novo = { n: 'REP-' + seq, cliente: data.cliente, cidade: data.cidade, status: 'pendente', envio: null, itens: data.itens };
    setReps((xs) => [novo, ...xs]);
    setNovoOpen(false);
    setTab('pendente');
    setOpenId(novo.n);
  };

  const onUpdate = (next) => {
    if (next._track) { setTracking(next.n); return; }
    setReps((xs) => xs.map((r) => (r.n === next.n ? next : r)));
  };
  const tabMap = { pendente: ['pendente'], em_preparo: ['em_preparo'], enviado: ['enviado'] };
  const view = reps.filter((r) => tabMap[tab].includes(r.status));

  return (
    <div>
      <PageHeader t={t} title="Reposições" subtitle="Pedidos de reposição das granjas — separe o material, defina o envio e rastreie a entrega."
        actions={<Btn t={t} icon="plus" onClick={() => setNovoOpen(true)}>Novo pedido</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="refresh" label="Pendentes" value={reps.filter((r) => r.status === 'pendente').length} kind="amber" />
        <KPI t={t} mini icon="box" label="Em preparo" value={reps.filter((r) => r.status === 'em_preparo').length} kind="blue" />
        <KPI t={t} mini icon="truck" label="Enviados" value={reps.filter((r) => r.status === 'enviado').length} kind="green" />
        <KPI t={t} mini icon="barChart" label="Valor total" value={fmtBRL(reps.reduce((a, r) => a + repValor(r), 0))} kind="accent" />
      </div>
      <Tabs t={t} value={tab} onChange={setTab} tabs={[['pendente', 'Pendentes'], ['em_preparo', 'Em Preparo'], ['enviado', 'Enviados']]} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
        {view.map((r) => {
          const sepTot = repSepTot(r), qtdTot = repQtdTot(r);
          const pct = qtdTot ? Math.round((sepTot / qtdTot) * 100) : 0;
          const sm = repStatusMeta[r.status];
          return (
            <Card t={t} key={r.n} hover onClick={() => setOpenId(r.n)} style={{ padding: 24, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{r.n}</span>
                <Badge t={t} kind={sm[1]} dot>{sm[0]}</Badge>
              </div>
              <div style={{ fontSize: 15.5, color: t.text, fontWeight: 700, marginTop: 14 }}>{r.cliente}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: t.muted, marginTop: 5 }}><Icon name="mapPin" size={14} /> {r.cidade}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: t.muted, marginTop: 7 }}><Icon name="box" size={14} /> {r.itens.length} materiais · {qtdTot} un</div>
              {r.status === 'enviado'
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, padding: '11px 14px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}`, fontSize: 12.5, color: t.muted }}><Icon name="truck" size={15} style={{ color: t.accentText }} /> {(REP_ENVIO_METODOS.find((m) => m.id === r.envio.metodo) || {}).nome}{r.envio.rastreio ? <span style={{ marginLeft: 'auto', fontFamily: 'monospace', color: t.text, fontWeight: 700 }}>{r.envio.rastreio}</span> : ''}</div>
                : <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 0 9px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: t.faint }}>{sepTot}/{qtdTot} separados</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{fmtBRL(repValor(r))}</span>
                    </div>
                    <div style={{ height: 9, borderRadius: 6, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: pct === 100 ? uiTone(t, 'green').fg : t.accent }} /></div>
                  </>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 16, fontSize: 13, fontWeight: 700, color: t.accentText }}>{r.status === 'enviado' ? 'Ver envio' : 'Gerenciar separação'} <Icon name="chevronRight" size={16} /></div>
            </Card>
          );
        })}
        {view.length === 0 && <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', fontSize: 13.5, color: t.muted }}>Nenhum pedido nesta aba.</div>}
      </div>
      {novoOpen && <RepNovoModal t={t} onClose={() => setNovoOpen(false)} onSave={criarPedido} />}
      {cur && <RepDetail t={t} rep={cur} onClose={() => setOpenId(null)} onUpdate={onUpdate} />}
      {tracking && (
        <div onClick={() => setTracking(null)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(440px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, boxShadow: t.shadow, padding: 26, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px', display: 'grid', placeItems: 'center', background: t.accentSoft, color: t.accentText }}><Icon name="mapPin" size={28} /></div>
            <div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>Rastreamento da encomenda</div>
            <div style={{ fontSize: 13, color: t.muted, marginTop: 8, lineHeight: 1.55 }}>O rastreamento em tempo real será exibido aqui através da <b style={{ color: t.text }}>integração com a API da transportadora</b>.</div>
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}`, fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: t.text }}>{(reps.find((r) => r.n === tracking).envio || {}).rastreio}</div>
            <button onClick={() => setTracking(null)} style={{ all: 'unset', cursor: 'pointer', marginTop: 18, height: 44, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 800, background: t.accent, color: t.onAccent, width: '100%' }}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Confronto (Viagens) ----------
const TRIP_STAGES = [
  { key: 'casa', label: 'Em casa', icon: 'home', sub: 'Material separado, aguardando saída.' },
  { key: 'viajando', label: 'Viajando', icon: 'truck', sub: 'Equipe em campo com o material.' },
  { key: 'retorno', label: 'Retorno', icon: 'returnHome', sub: 'Chegou — aguardando confronto.' },
  { key: 'finalizado', label: 'Finalizado', icon: 'check', sub: 'Confronto concluído.' },
];
const STAGE_IDX = (s) => TRIP_STAGES.findIndex((x) => x.key === s);
const fmtBRL = (n) => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const EXTRA_CAT = [
  { nome: 'Fita isolante', sku: '5.30.0011', price: 8 },
  { nome: 'Conector RJ45', sku: '5.31.0022', price: 2.5 },
  { nome: 'Abraçadeira nylon', sku: '3.11.0030', price: 0.4 },
  { nome: 'Terminal ilhós', sku: '5.32.0040', price: 1.2 },
];
const TRIPS_SEED = [
  { id: 1, origem: 'Matriz Curitiba', destino: 'Obra Centro', tecnicos: ['João Silva', 'Maria Souza'], saida: '14/06 · 07:30', stage: 'finalizado',
    itens: [{ nome: 'Cabo Flexível 2,5mm', sku: '5.20.0099', price: 3.2, levou: 50, voltou: 12 }, { nome: 'Rolamento 6204ZZ', sku: '4.10.0233', price: 12.4, levou: 6, voltou: 2 }, { nome: 'Parafuso M8', sku: '9.99.0238', price: 0.85, levou: 80, voltou: 20 }], extras: [] },
  { id: 2, origem: 'Matriz Curitiba', destino: 'Cliente Sul', tecnicos: ['Ana Paula', 'Rafael Souza'], saida: '14/06 · 06:50', stage: 'retorno',
    itens: [{ nome: 'Chapa Aço 1020 2mm', sku: '1.02.0044', price: 145, levou: 8, voltou: null }, { nome: 'Tinta Epóxi Cinza', sku: '6.30.0012', price: 210, levou: 3, voltou: null }, { nome: 'Arruela Lisa 8mm', sku: '7.40.0150', price: 0.2, levou: 120, voltou: null }], extras: [] },
  { id: 3, origem: 'Filial Maringá', destino: 'Obra Leste', tecnicos: ['Bruno Teixeira'], saida: 'Hoje · 13:00', stage: 'viajando',
    itens: [{ nome: 'Filamento PLA Azul', sku: '3.00.0101', price: 89.9, levou: 4, voltou: null }, { nome: 'Suporte de sensor', sku: '5.03.0050', price: 6, levou: 10, voltou: null }], extras: [] },
  { id: 4, origem: 'Matriz Curitiba', destino: 'Filial Norte', tecnicos: ['Carlos Moura'], saida: 'Hoje · 15:20', stage: 'casa',
    itens: [{ nome: 'Cabo Flexível 2,5mm', sku: '5.20.0099', price: 3.2, levou: 30, voltou: null }, { nome: 'Conector RJ45', sku: '5.31.0022', price: 2.5, levou: 50, voltou: null }], extras: [] },
];
const tripLevado = (tr) => tr.itens.reduce((a, it) => a + it.price * it.levou, 0);
const tripRetornado = (tr) => tr.itens.reduce((a, it) => a + it.price * (it.voltou || 0), 0) + (tr.extras || []).reduce((a, e) => a + e.price * e.qtd, 0);

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

// Confronto editor — user defines what came back; system computes consumption.
// mode: 'novo' (confronto inicial) | 'ajuste' (segundo confronto p/ material que voltou depois)
function ConfrontoEditor({ t, trip, onClose, onSave, mode = 'novo' }) {
  const isAjuste = mode === 'ajuste';
  const orig0 = React.useRef(trip.itens.map((it) => (it.voltou == null ? 0 : it.voltou)));
  const origExtras0 = React.useRef((trip.extras || []).reduce((a, e) => a + e.qtd, 0));
  const [itens, setItens] = useStateR(trip.itens.map((it) => ({ ...it, voltou: it.voltou == null ? '' : it.voltou })));
  const [extras, setExtras] = useStateR(trip.extras ? [...trip.extras] : []);
  const [addOpen, setAddOpen] = useStateR(false);
  const setVoltou = (i, v) => setItens((xs) => xs.map((it, j) => (j === i ? { ...it, voltou: v.replace(/[^0-9]/g, '') } : it)));
  const addExtra = (c) => { setExtras((xs) => (xs.some((e) => e.sku === c.sku) ? xs : [...xs, { ...c, qtd: 1 }])); setAddOpen(false); };
  const setExtraQtd = (i, v) => setExtras((xs) => xs.map((e, j) => (j === i ? { ...e, qtd: Math.max(1, parseInt(v.replace(/[^0-9]/g, '')) || 1) } : e)));
  const delExtra = (i) => setExtras((xs) => xs.filter((_, j) => j !== i));
  const levado = trip.itens.reduce((a, it) => a + it.price * it.levou, 0);
  const retornado = itens.reduce((a, it) => a + it.price * (parseInt(it.voltou) || 0), 0) + extras.reduce((a, e) => a + e.price * e.qtd, 0);
  const consumo = levado - retornado;
  // total devolvido a mais neste ajuste (un)
  const devolvidoAgora = isAjuste
    ? itens.reduce((a, it, i) => a + Math.max(0, (parseInt(it.voltou) || 0) - orig0.current[i]), 0) + Math.max(0, extras.reduce((a, e) => a + e.qtd, 0) - origExtras0.current)
    : 0;
  const accentC = isAjuste ? '#7c3aed' : t.accent;
  const accentSoftC = isAjuste ? frHexToRgba('#7c3aed', 0.14) : t.accentSoft;
  const accentTextC = isAjuste ? '#a78bfa' : t.accentText;
  const inp = { boxSizing: 'border-box', width: 64, height: 36, textAlign: 'center', borderRadius: 9, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', outline: 'none' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(820px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: accentSoftC, color: accentTextC, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={isAjuste ? 'shuffle' : 'returnHome'} size={20} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{isAjuste ? 'Confronto de ajuste' : 'Fazer confronto'}</div>
            <div style={{ fontSize: 12.5, color: t.muted }}>{trip.destino} · {isAjuste ? 'registre o material que voltou depois do confronto.' : 'informe o que voltou de cada item.'}</div>
          </div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        {isAjuste && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 24px', background: frHexToRgba('#7c3aed', 0.08), borderBottom: `1px solid ${t.border}`, color: t.muted, fontSize: 12.5, lineHeight: 1.5 }}>
            <Icon name="alert" size={16} style={{ color: accentTextC, flexShrink: 0, marginTop: 1 }} />
            <span>Use este ajuste quando um técnico devolver material <b style={{ color: t.text }}>após</b> o confronto já feito. Aumente o "voltou" do item ou inclua extras — o consumo é recalculado automaticamente.</span>
          </div>
        )}
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '18px 24px', flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 10 }}>{isAjuste ? 'Itens — corrija o que voltou' : 'Itens levados — quanto voltou?'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {itens.map((it, i) => {
              const usado = it.levou - (parseInt(it.voltou) || 0);
              const delta = isAjuste ? (parseInt(it.voltou) || 0) - orig0.current[i] : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${delta > 0 ? frHexToRgba('#7c3aed', 0.35) : t.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{it.nome}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>SKU {it.sku} · levou {it.levou}{isAjuste ? ` · voltou antes ${orig0.current[i]}` : ''}{delta > 0 ? <b style={{ color: accentTextC }}> · +{delta} agora</b> : ''}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, fontWeight: 700, color: t.faint, marginBottom: 3 }}>VOLTOU</div><input value={it.voltou} onChange={(e) => setVoltou(i, e.target.value)} inputMode="numeric" placeholder="0" style={inp} /></div>
                  <div style={{ textAlign: 'right', minWidth: 56 }}><div style={{ fontSize: 9, fontWeight: 700, color: t.faint }}>USOU</div><div style={{ fontSize: 15, fontWeight: 800, color: usado < 0 ? uiTone(t, 'red').fg : t.text }}>{usado}</div></div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 10px' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase' }}>Materiais extras que voltaram</span>
            <button onClick={() => setAddOpen((o) => !o)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: accentTextC, padding: '5px 10px', borderRadius: 8, background: accentSoftC }}><Icon name="plus" size={14} /> Adicionar</button>
          </div>
          {addOpen && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, padding: 12, borderRadius: 12, background: t.elevated, border: `1px dashed ${t.borderStrong}` }}>
              {EXTRA_CAT.map((c) => <button key={c.sku} onClick={() => addExtra(c)} style={{ all: 'unset', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, padding: '7px 12px', borderRadius: 9, background: t.panel, border: `1px solid ${t.border}`, color: t.text }}>+ {c.nome}</button>)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {extras.length === 0 && !addOpen && <div style={{ fontSize: 12.5, color: t.faint, padding: '4px 2px' }}>Nenhum material extra.</div>}
            {extras.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: uiTone(t, 'amber').bg, border: `1px solid ${frHexToRgba('#f59e0b', 0.25)}` }}>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{e.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {e.sku} · extra</div></div>
                <input value={e.qtd} onChange={(ev) => setExtraQtd(i, ev.target.value)} inputMode="numeric" style={inp} />
                <button onClick={() => delExtra(i)} style={{ all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="trash" size={15} /></button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', gap: 18, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: t.muted }}>Levado <b style={{ color: t.text }}>{fmtBRL(levado)}</b></span>
            <span style={{ fontSize: 12.5, color: t.muted }}>Retornado <b style={{ color: uiTone(t, 'amber').fg }}>{fmtBRL(retornado)}</b></span>
            <span style={{ fontSize: 12.5, color: t.muted }}>Consumido <b style={{ color: uiTone(t, 'red').fg }}>{fmtBRL(consumo)}</b></span>
            {isAjuste && devolvidoAgora > 0 && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: accentTextC, background: accentSoftC, padding: '5px 11px', borderRadius: 999 }}>+{devolvidoAgora} un devolvidas agora</span>}
          </div>
          <button onClick={() => onSave(itens.map((it) => ({ ...it, voltou: parseInt(it.voltou) || 0 })), extras, devolvidoAgora)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 48, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 14, fontWeight: 800, background: accentC, color: '#fff', boxShadow: `0 6px 16px ${frHexToRgba(accentC, 0.3)}` }}>
            <Icon name={isAjuste ? 'shuffle' : 'check'} size={18} /> {isAjuste ? 'Salvar ajuste' : 'Concluir confronto'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TripDetail({ t, trip, onClose, onConfronto, onAjuste }) {
  const [tab, setTab] = useStateR('levados');
  const tripMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const stageInfo = TRIP_STAGES.find((s) => s.key === trip.stage);
  const chegou = trip.stage === 'finalizado';
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
            <Icon name="home" size={17} style={{ opacity: .8 }} /> {trip.origem}
            <Icon name="chevronRight" size={17} style={{ opacity: .7 }} />
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

          {trip.stage === 'retorno' && (
            <button onClick={() => onConfronto(trip.id)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 48, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 14, fontWeight: 800, background: t.accent, color: t.onAccent, boxShadow: `0 6px 16px ${frHexToRgba(t.accent, 0.3)}`, marginBottom: 18 }}>
              <Icon name="returnHome" size={18} /> Fazer confronto
            </button>
          )}

          {chegou && (
            <button onClick={() => onAjuste(trip.id)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 13.5, fontWeight: 800, background: frHexToRgba('#7c3aed', 0.12), color: '#a78bfa', border: `1px solid ${frHexToRgba('#7c3aed', 0.3)}`, marginBottom: 18 }}>
              <Icon name="shuffle" size={17} /> Confronto de ajuste — material voltou depois
            </button>
          )}

          {chegou && (trip.ajustes || []).length > 0 && (
            <div style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 14, background: frHexToRgba('#7c3aed', 0.07), border: `1px solid ${frHexToRgba('#7c3aed', 0.22)}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: '.05em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: 10 }}><Icon name="shuffle" size={14} /> Ajustes posteriores</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {trip.ajustes.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: t.muted }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', flexShrink: 0 }} />
                    <span style={{ color: t.text, fontWeight: 700 }}>{a.data}</span>
                    <span>+{a.devolvido} un devolvidas · consumo recalculado p/ <b style={{ color: t.text }}>{fmtBRL(a.consumo)}</b></span>
                  </div>
                ))}
              </div>
            </div>
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
              <Icon name={stageInfo.icon} size={18} /> {trip.stage === 'retorno' ? 'A viagem chegou. Faça o confronto para registrar o que voltou.' : trip.stage === 'viajando' ? 'A equipe ainda está em campo.' : 'Material aguardando a saída.'}
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
              {(trip.extras || []).map((e, i) => (
                <div key={'x' + i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: uiTone(t, 'amber').bg, border: `1px solid ${frHexToRgba('#f59e0b', 0.25)}` }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(245,158,11,.2)', color: uiTone(t, 'amber').fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="plus" size={16} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{e.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {e.sku} · extra que voltou</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, fontWeight: 700, color: t.faint }}>VOLTOU</div><div style={{ fontSize: 16, fontWeight: 800, color: uiTone(t, 'amber').fg }}>{e.qtd}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SAIDA_CAT = [
  { nome: 'Cabo Flexível 2,5mm', sku: '5.20.0099', price: 3.2 },
  { nome: 'Rolamento 6204ZZ', sku: '4.10.0233', price: 12.4 },
  { nome: 'Parafuso Sextavado M8', sku: '9.99.0238', price: 0.85 },
  { nome: 'Chapa Aço 1020 2mm', sku: '1.02.0044', price: 145 },
  { nome: 'Tinta Epóxi Cinza 3,6L', sku: '6.30.0012', price: 210 },
  { nome: 'Filamento PLA Azul', sku: '3.00.0101', price: 89.9 },
  { nome: 'Arruela Lisa 8mm', sku: '7.40.0150', price: 0.2 },
  { nome: 'Conector RJ45', sku: '5.31.0022', price: 2.5 },
];
const SAIDA_TEAM = ['João Silva', 'Maria Souza', 'Ana Paula', 'Rafael Souza', 'Bruno Teixeira', 'Carlos Moura', 'Júlia Ramos'];
const SAIDA_ORIGENS = ['Matriz Curitiba', 'Filial Maringá', 'Depósito Joinville'];

function SaidaModal({ t, onClose, onSave }) {
  const [origem, setOrigem] = useStateR(SAIDA_ORIGENS[0]);
  const [destino, setDestino] = useStateR('');
  const [team, setTeam] = useStateR([]);
  const [roster, setRoster] = useStateR(SAIDA_TEAM);
  const [novoTec, setNovoTec] = useStateR('');
  const [itens, setItens] = useStateR([]);
  const [q, setQ] = useStateR('');
  const ql = q.trim().toLowerCase();
  const catList = ql ? SAIDA_CAT.filter((c) => c.nome.toLowerCase().includes(ql) || c.sku.includes(ql)) : SAIDA_CAT;
  const toggleTeam = (n) => setTeam((xs) => (xs.includes(n) ? xs.filter((x) => x !== n) : [...xs, n]));
  const addTec = () => { const n = novoTec.trim(); if (!n) return; setRoster((xs) => (xs.includes(n) ? xs : [...xs, n])); setTeam((xs) => (xs.includes(n) ? xs : [...xs, n])); setNovoTec(''); };
  const addItem = (c) => { setItens((xs) => (xs.some((i) => i.sku === c.sku) ? xs : [...xs, { ...c, levou: 1 }])); setQ(''); };
  const setQtd = (i, v) => setItens((xs) => xs.map((it, j) => (j === i ? { ...it, levou: Math.max(1, parseInt(String(v).replace(/[^0-9]/g, '')) || 1) } : it)));
  const delItem = (i) => setItens((xs) => xs.filter((_, j) => j !== i));
  const levado = itens.reduce((a, it) => a + it.price * it.levou, 0);
  const valid = destino.trim() && team.length && itens.length;
  const field = { boxSizing: 'border-box', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 8 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(820px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="out" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Registrar saída</div><div style={{ fontSize: 12.5, color: t.muted }}>Defina a viagem e o material que vai a campo.</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>

        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={lab}>Origem</label>
              <div style={{ position: 'relative' }}>
                <select value={origem} onChange={(e) => setOrigem(e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 34, cursor: 'pointer' }}>{SAIDA_ORIGENS.map((o) => <option key={o}>{o}</option>)}</select>
                <Icon name="chevronDown" size={16} style={{ position: 'absolute', right: 12, top: 14, color: t.muted, pointerEvents: 'none' }} />
              </div>
            </div>
            <div>
              <label style={lab}>Destino</label>
              <input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Ex: Obra Centro" style={field} />
            </div>
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
                  const added = itens.some((i) => i.sku === c.sku);
                  return (
                    <button key={c.sku} disabled={added} onClick={() => addItem(c)} style={{ all: 'unset', boxSizing: 'border-box', cursor: added ? 'default' : 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 11, background: t.elevated, border: `1px solid ${added ? t.accent : t.border}`, opacity: added ? 0.55 : 1 }}
                      onMouseEnter={(e) => { if (!added) { e.currentTarget.style.background = t.hover; e.currentTarget.style.borderColor = t.borderStrong; } }} onMouseLeave={(e) => { e.currentTarget.style.background = t.elevated; e.currentTarget.style.borderColor = added ? t.accent : t.border; }}>
                      <span style={{ width: 32, height: 32, borderRadius: 8, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={15} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</div><div style={{ fontSize: 10.5, color: t.muted }}>SKU {c.sku} · {fmtBRL(c.price)}</div></div>
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

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: t.muted }}>{itens.length} {itens.length === 1 ? 'item' : 'itens'} · levado <b style={{ color: t.text }}>{fmtBRL(levado)}</b></div>
          <button onClick={() => valid && onSave({ origem, destino: destino.trim(), tecnicos: team, itens: itens.map((it) => ({ ...it, voltou: null })) })} disabled={!valid}
            style={{ all: 'unset', boxSizing: 'border-box', cursor: valid ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, height: 48, padding: '0 24px', borderRadius: 13, fontSize: 14, fontWeight: 800, background: valid ? t.accent : t.elevated, color: valid ? t.onAccent : t.faint, boxShadow: valid ? `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` : 'none' }}>
            <Icon name="out" size={18} /> Registrar saída
          </button>
        </div>
      </div>
    </div>
  );
}

function PageConfronto({ t }) {
  const [trips, setTrips] = useStateR(TRIPS_SEED);
  const [openId, setOpenId] = useStateR(null);
  const [confrontoId, setConfrontoId] = useStateR(null);
  const [ajusteId, setAjusteId] = useStateR(null);
  const [saidaOpen, setSaidaOpen] = useStateR(false);
  const cur = trips.find((x) => x.id === openId);
  const confrontoTrip = trips.find((x) => x.id === confrontoId);
  const ajusteTrip = trips.find((x) => x.id === ajusteId);
  const stageMeta = { casa: ['Em casa', 'gray'], viajando: ['Viajando', 'blue'], retorno: ['Retorno', 'amber'], finalizado: ['Finalizado', 'green'] };
  const saveConfronto = (itens, extras) => {
    setTrips((xs) => xs.map((x) => (x.id === confrontoId ? { ...x, itens, extras, stage: 'finalizado' } : x)));
    setConfrontoId(null);
  };
  const saveAjuste = (itens, extras, devolvido) => {
    setTrips((xs) => xs.map((x) => {
      if (x.id !== ajusteId) return x;
      const levado = itens.reduce((a, it) => a + it.price * it.levou, 0);
      const retornado = itens.reduce((a, it) => a + it.price * (it.voltou || 0), 0) + (extras || []).reduce((a, e) => a + e.price * e.qtd, 0);
      const consumo = levado - retornado;
      const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' · ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return { ...x, itens, extras, ajustes: [...(x.ajustes || []), { data, devolvido, consumo }] };
    }));
    setAjusteId(null);
  };
  const registrarSaida = (data) => {
    const novo = { id: Date.now(), saida: 'Agora', stage: 'viajando', extras: [], ...data };
    setTrips((xs) => [novo, ...xs]);
    setSaidaOpen(false);
  };
  return (
    <div>
      <PageHeader t={t} title="Confronto de Viagens" subtitle="Acompanhe cada viagem: saída, campo, retorno e confronto do material."
        actions={<Btn t={t} icon="out" onClick={() => setSaidaOpen(true)}>Registrar saída</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="home" label="Em casa" value={trips.filter((x) => x.stage === 'casa').length} kind="gray" />
        <KPI t={t} mini icon="truck" label="Viajando" value={trips.filter((x) => x.stage === 'viajando').length} kind="blue" />
        <KPI t={t} mini icon="returnHome" label="Em retorno" value={trips.filter((x) => x.stage === 'retorno').length} kind="amber" />
        <KPI t={t} mini icon="check" label="Finalizadas" value={trips.filter((x) => x.stage === 'finalizado').length} kind="green" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {trips.map((tr) => {
          const sm = stageMeta[tr.stage];
          const isRetorno = tr.stage === 'retorno';
          return (
            <Card t={t} key={tr.id} hover style={{ padding: 18, cursor: 'pointer', border: isRetorno ? `1.5px solid ${t.accent}` : undefined, boxShadow: isRetorno ? `0 0 0 4px ${frHexToRgba(t.accent, 0.1)}` : undefined }}>
              <div onClick={() => setOpenId(tr.id)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Badge t={t} kind={sm[1]} dot>{sm[0]}</Badge>
                    {(tr.ajustes || []).length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, letterSpacing: '.03em', padding: '3px 8px', borderRadius: 999, background: frHexToRgba('#7c3aed', 0.14), color: '#a78bfa' }}><Icon name="shuffle" size={11} /> AJUSTADO</span>}
                  </div>
                  <span style={{ fontSize: 11.5, color: t.faint }}>{tr.saida}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '14px 0 4px', fontSize: 15.5, fontWeight: 800, color: t.text }}>
                  <Icon name="home" size={16} style={{ color: t.muted, flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tr.origem}</span>
                  <Icon name="chevronRight" size={15} style={{ color: t.faint, flexShrink: 0 }} />
                  <Icon name="mapPin" size={16} style={{ color: t.accentText, flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tr.destino}</span>
                </div>
                <div style={{ fontSize: 12.5, color: t.muted, marginBottom: 18 }}>{tr.tecnicos.join(', ')}</div>
                <TripStepper t={t} stage={tr.stage} compact />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 13, borderTop: `1px solid ${t.border}`, gap: 10 }}>
                <div><div style={{ fontSize: 9.5, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}>LEVADO</div><div style={{ fontSize: 15, fontWeight: 850, color: t.text }}>{fmtBRL(tripLevado(tr))}</div></div>
                {isRetorno
                  ? <button onClick={() => setConfrontoId(tr.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 11, fontSize: 13, fontWeight: 800, background: t.accent, color: t.onAccent, boxShadow: `0 4px 12px ${frHexToRgba(t.accent, 0.3)}` }}><Icon name="returnHome" size={16} /> Fazer confronto</button>
                  : <button onClick={() => setOpenId(tr.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: t.accentText, padding: '6px 10px', borderRadius: 9 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = t.accentSoft; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>Ver detalhes <Icon name="chevronRight" size={15} /></button>}
              </div>
            </Card>
          );
        })}
      </div>
      {cur && <TripDetail t={t} trip={cur} onClose={() => setOpenId(null)} onConfronto={(id) => { setOpenId(null); setConfrontoId(id); }} onAjuste={(id) => { setOpenId(null); setAjusteId(id); }} />}
      {confrontoTrip && <ConfrontoEditor t={t} trip={confrontoTrip} onClose={() => setConfrontoId(null)} onSave={saveConfronto} />}
      {ajusteTrip && <ConfrontoEditor t={t} trip={ajusteTrip} mode="ajuste" onClose={() => setAjusteId(null)} onSave={saveAjuste} />}
      {saidaOpen && <SaidaModal t={t} onClose={() => setSaidaOpen(false)} onSave={registrarSaida} />}
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
const PERM_KEYS = [
  { k: 'ver', label: 'Visualizar', icon: 'eye' },
  { k: 'add', label: 'Adicionar', icon: 'plus' },
  { k: 'edit', label: 'Editar', icon: 'pencil' },
  { k: 'rem', label: 'Remover', icon: 'trash' },
];
const PERM_SETORES = ['Usinagem', 'Produção 3D', 'Elétrica', 'Montagem', 'Almoxarifado'];
const PERM_PAGES = [
  { grupo: 'Principal', pages: ['Quadro de Tarefas', 'Quadro Elétrica', 'Avisos', 'Calculadora'] },
  { grupo: 'Estoque', pages: ['Catálogo', 'Entradas', 'Saídas'] },
  { grupo: 'Operacional', pages: ['Solicitações', 'Meus Pedidos', 'Encomendar 3D', 'Quadro Gestão', 'Reposições', 'Confronto'] },
  { grupo: 'Gestão Admin', pages: ['Controle de Saída', 'Críticos', 'Relatórios', 'Usuários', 'Clientes e OPs', 'Auditoria', 'Permissões', 'Painel TI'] },
];
const ALL_PAGES = PERM_PAGES.flatMap((g) => g.pages);
function defaultPerms(nome) {
  const n = nome.toLowerCase();
  const lvl = n.includes('chefe') || n.includes('admin') || n.includes('supervisor') ? 'full'
    : n.includes('analista') ? 'edit' : 'view';
  const out = {};
  ALL_PAGES.forEach((p) => {
    out[p] = lvl === 'full' ? { ver: true, add: true, edit: true, rem: true }
      : lvl === 'edit' ? { ver: true, add: true, edit: true, rem: false }
      : { ver: true, add: false, edit: false, rem: false };
  });
  return out;
}
const PERM_SEED = {
  'Usinagem': { classes: ['Chefe', 'Analista', 'Operador'], users: [{ nome: 'Carlos Moura', classe: 'Chefe' }, { nome: 'Marcos Dias', classe: 'Operador' }, { nome: 'Tiago Reis', classe: 'Analista' }] },
  'Produção 3D': { classes: ['Chefe', 'Operador'], users: [{ nome: 'Rafael Souza', classe: 'Chefe' }, { nome: 'Davi Miranda', classe: 'Operador' }] },
  'Elétrica': { classes: ['Chefe', 'Analista', 'Operador'], users: [{ nome: 'Bruno Teixeira', classe: 'Chefe' }, { nome: 'Everton Luz', classe: 'Operador' }] },
  'Montagem': { classes: ['Chefe', 'Operador'], users: [{ nome: 'Ana Paula', classe: 'Chefe' }, { nome: 'William Costa', classe: 'Operador' }] },
  'Almoxarifado': { classes: ['Chefe', 'Analista', 'Operador'], users: [{ nome: 'Júlia Ramos', classe: 'Chefe' }, { nome: 'Leo Monteiro', classe: 'Analista' }] },
};
function buildPermData() {
  const d = {};
  Object.entries(PERM_SEED).forEach(([setor, v]) => {
    d[setor] = { classes: v.classes.map((nome) => ({ nome, perms: defaultPerms(nome) })), users: v.users.map((u) => ({ ...u })) };
  });
  return d;
}

function PagePermissoes({ t }) {
  const [data, setData] = useStateR(buildPermData);
  const [setor, setSetor] = useStateR(PERM_SETORES[0]);
  const [openClasse, setOpenClasse] = useStateR(null);
  const [novaClasse, setNovaClasse] = useStateR('');
  const cur = data[setor];

  const findCi = (nome) => cur.classes.findIndex((c) => c.nome === nome);
  const togglePerm = (nome, page, k) => setData((d) => {
    const next = JSON.parse(JSON.stringify(d));
    const ci = next[setor].classes.findIndex((c) => c.nome === nome);
    const pp = next[setor].classes[ci].perms[page]; pp[k] = !pp[k];
    return next;
  });
  const toggleCol = (nome, k) => setData((d) => {
    const next = JSON.parse(JSON.stringify(d));
    const cls = next[setor].classes.find((c) => c.nome === nome);
    const allOn = ALL_PAGES.every((p) => cls.perms[p][k]);
    ALL_PAGES.forEach((p) => { cls.perms[p][k] = !allOn; });
    return next;
  });
  const addClasse = () => {
    const n = novaClasse.trim(); if (!n) return;
    setData((d) => {
      if (d[setor].classes.some((c) => c.nome.toLowerCase() === n.toLowerCase())) return d;
      const next = JSON.parse(JSON.stringify(d));
      next[setor].classes.push({ nome: n, perms: defaultPerms(n) });
      return next;
    });
    setOpenClasse(n); setNovaClasse('');
  };
  const delClasse = (nome) => setData((d) => {
    const next = JSON.parse(JSON.stringify(d));
    next[setor].classes = next[setor].classes.filter((c) => c.nome !== nome);
    next[setor].users = next[setor].users.map((u) => (u.classe === nome ? { ...u, classe: '' } : u));
    return next;
  });
  const setUserClasse = (ui, classe) => setData((d) => {
    const next = JSON.parse(JSON.stringify(d));
    next[setor].users[ui].classe = classe;
    return next;
  });
  const pickSetor = (s) => { setSetor(s); setOpenClasse(null); };

  const av = (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join('');
  const field = { boxSizing: 'border-box', height: 42, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' };
  const usersInClass = (nome) => cur.users.filter((u) => u.classe === nome).length;
  const permSummary = (cls) => { const c = { ver: 0, add: 0, edit: 0, rem: 0 }; ALL_PAGES.forEach((p) => PERM_KEYS.forEach((k) => { if (cls.perms[p][k.k]) c[k.k]++; })); return c; };

  const Toggle = ({ on, onClick }) => (
    <button onClick={onClick} style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 8, margin: '0 auto', background: on ? uiTone(t, 'green').fg : t.hover, color: on ? '#fff' : t.faint, border: `1px solid ${on ? 'transparent' : t.border}` }}>
      <Icon name={on ? 'check' : 'x'} size={14} />
    </button>
  );

  return (
    <div>
      <PageHeader t={t} title="Permissões" subtitle="Por setor, defina classes e o que cada uma pode fazer em cada página do sistema." />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        {PERM_SETORES.map((s) => {
          const on = setor === s;
          return (
            <button key={s} onClick={() => pickSetor(s)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 16px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, background: on ? t.accent : t.panel, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}`, boxShadow: on ? `0 4px 12px ${frHexToRgba(t.accent, 0.25)}` : 'none' }}>
              <Icon name="briefcase" size={15} /> {s}
              <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 7, background: on ? 'rgba(255,255,255,.25)' : t.hover, color: on ? t.onAccent : t.muted }}>{data[s].users.length}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Classes de acesso · {setor}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={novaClasse} onChange={(e) => setNovaClasse(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addClasse()} placeholder="Nova classe…" style={{ ...field, height: 40, width: 160 }} />
          <button onClick={addClasse} disabled={!novaClasse.trim()} style={{ all: 'unset', cursor: novaClasse.trim() ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', borderRadius: 11, fontSize: 13, fontWeight: 700, background: novaClasse.trim() ? t.accent : t.elevated, color: novaClasse.trim() ? t.onAccent : t.faint }}><Icon name="plus" size={15} /> Criar</button>
        </div>
      </div>

      {/* accordion de classes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
        {cur.classes.map((c) => {
          const open = openClasse === c.nome;
          const sum = permSummary(c);
          return (
            <Card t={t} key={c.nome} style={{ overflow: 'hidden', border: `1px solid ${open ? frHexToRgba(t.accent, 0.4) : t.border}` }}>
              <div onClick={() => setOpenClasse(open ? null : c.nome)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 18px', cursor: 'pointer', background: open ? t.accentSoft : 'transparent' }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: open ? t.accent : t.accentSoft, color: open ? t.onAccent : t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="shield" size={19} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 850, color: t.text }}>{c.nome}</div>
                  <div style={{ fontSize: 11.5, color: t.muted }}>{usersInClass(c.nome)} {usersInClass(c.nome) === 1 ? 'usuário' : 'usuários'} · {sum.ver}/{ALL_PAGES.length} páginas visíveis</div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginRight: 6 }}>
                  {PERM_KEYS.map((k) => <span key={k.k} title={k.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 7, background: t.hover, color: t.muted }}><Icon name={k.icon} size={12} /> {sum[k.k]}</span>)}
                </div>
                <button onClick={(e) => { e.stopPropagation(); delClasse(c.nome); }} title="Excluir classe" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
                <Icon name="chevronDown" size={18} style={{ color: t.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
              </div>
              {open && (
                <div style={{ borderTop: `1px solid ${t.border}`, overflowX: 'auto' }} className="fr-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: t.faint, borderBottom: `1px solid ${t.border}` }}>Página</th>
                        {PERM_KEYS.map((p) => (
                          <th key={p.k} style={{ padding: '10px 8px', borderBottom: `1px solid ${t.border}`, textAlign: 'center', minWidth: 80 }}>
                            <button onClick={() => toggleCol(c.nome, p.k)} title={`Marcar/desmarcar ${p.label} em tudo`} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: t.text }}>
                              <Icon name={p.icon} size={15} style={{ color: t.accentText }} />
                              <span style={{ fontSize: 10.5, fontWeight: 800 }}>{p.label}</span>
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERM_PAGES.map((g) => (
                        <React.Fragment key={g.grupo}>
                          <tr><td colSpan={5} style={{ padding: '10px 18px 6px', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: t.faint, background: t.elevated }}>{g.grupo}</td></tr>
                          {g.pages.map((page) => (
                            <tr key={page}>
                              <td style={{ padding: '10px 18px', fontSize: 13.5, fontWeight: 600, color: t.text, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{page}</td>
                              {PERM_KEYS.map((p) => (
                                <td key={p.k} style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${t.border}` }}>
                                  <Toggle on={c.perms[page][p.k]} onClick={() => togglePerm(c.nome, page, p.k)} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div style={{ fontSize: 15, fontWeight: 800, color: t.text, margin: '24px 0 12px' }}>Usuários · {setor}</div>
      <Card t={t} style={{ padding: 8 }}>
        {cur.users.map((u, ui) => (
          <div key={u.nome} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', borderBottom: ui === cur.users.length - 1 ? 'none' : `1px solid ${t.border}` }}>
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12.5, flexShrink: 0 }}>{av(u.nome)}</span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{u.nome}</div><div style={{ fontSize: 11.5, color: t.muted }}>{setor}</div></div>
            <div style={{ position: 'relative' }}>
              <select value={u.classe} onChange={(e) => setUserClasse(ui, e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 34, cursor: 'pointer', fontWeight: 700 }}>
                <option value="">Sem classe</option>
                {cur.classes.map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
              </select>
              <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 12, top: 13, color: t.muted, pointerEvents: 'none' }} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}


// ---------- Auditoria ----------
const AUD_ACOES = {
  criou:    { label: 'Criou',     kind: 'green', icon: 'plus' },
  editou:   { label: 'Editou',    kind: 'blue',  icon: 'pencil' },
  excluiu:  { label: 'Excluiu',   kind: 'red',   icon: 'trash' },
  acessou:  { label: 'Acessou',   kind: 'gray',  icon: 'eye' },
  aprovou:  { label: 'Aprovou',   kind: 'green', icon: 'check' },
  recusou:  { label: 'Recusou',   kind: 'amber', icon: 'x' },
  exportou: { label: 'Exportou',  kind: 'blue',  icon: 'download' },
  login:    { label: 'Login',     kind: 'gray',  icon: 'lock' },
};
const AUD_LOGS = [
  { id: 1, user: 'Bruno Teixeira', setor: 'Diretoria', acao: 'editou', alvo: 'Produto · Parafuso Sextavado M8', sku: '9.99.0238', detalhe: 'Valor unitário alterado de R$ 0,80 para R$ 0,85', pagina: 'Movimentação', data: '17/06/2026', hora: '09:42:18', ip: '192.168.0.12' },
  { id: 2, user: 'Ana Paula Reis', setor: 'Estoque', acao: 'criou', alvo: 'Entrada · NF-e 004471', detalhe: 'Entrada de 8 itens · R$ 12.400,00 (Aço Brasil Ltda)', pagina: 'Entradas', data: '17/06/2026', hora: '09:10:55', ip: '192.168.0.31' },
  { id: 3, user: 'Carlos Moura', setor: 'Usinagem', acao: 'acessou', alvo: 'Página · Relatórios', detalhe: 'Visualizou relatório de estoque geral', pagina: 'Relatórios', data: '17/06/2026', hora: '08:55:02', ip: '192.168.0.44' },
  { id: 4, user: 'Júlia Ramos', setor: 'Qualidade', acao: 'excluiu', alvo: 'OP · 00301', detalhe: 'Removida ordem de produção do cliente PRT Class', pagina: 'Clientes e OPs', data: '16/06/2026', hora: '17:20:41', ip: '192.168.0.50' },
  { id: 5, user: 'Rafael Souza', setor: 'Produção 3D', acao: 'editou', alvo: 'Usuário · Everton Luz', detalhe: 'Cargo alterado de Operador para Analista', pagina: 'Usuários', data: '16/06/2026', hora: '15:02:09', ip: '192.168.0.27' },
  { id: 6, user: 'Bruno Teixeira', setor: 'Diretoria', acao: 'aprovou', alvo: 'Solicitação · REQ-C12F0A92', detalhe: 'Aprovou pedido de 3 itens do setor Flow', pagina: 'Solicitações', data: '16/06/2026', hora: '14:31:50', ip: '192.168.0.12' },
  { id: 7, user: 'Ana Paula Reis', setor: 'Estoque', acao: 'exportou', alvo: 'Relatório · Estoque geral', detalhe: 'Exportou CSV com 25 itens', pagina: 'Produtos', data: '16/06/2026', hora: '11:08:33', ip: '192.168.0.31' },
  { id: 8, user: 'Júlia Ramos', setor: 'Qualidade', acao: 'recusou', alvo: 'Solicitação · REQ-90B2E551', detalhe: 'Recusou pedido — material indisponível', pagina: 'Solicitações', data: '15/06/2026', hora: '16:45:12', ip: '192.168.0.50' },
  { id: 9, user: 'Carlos Moura', setor: 'Usinagem', acao: 'login', alvo: 'Sessão iniciada', detalhe: 'Acesso via desktop · Chrome', pagina: 'Login', data: '15/06/2026', hora: '07:58:00', ip: '192.168.0.44' },
  { id: 10, user: 'Rafael Souza', setor: 'Produção 3D', acao: 'criou', alvo: 'Demanda · Suporte de sensor 3D', detalhe: 'Gerou demanda de produção (12 un)', pagina: 'Encomendar 3D', data: '15/06/2026', hora: '10:22:47', ip: '192.168.0.27' },
  { id: 11, user: 'Bruno Teixeira', setor: 'Diretoria', acao: 'editou', alvo: 'Permissões · Classe Chefe', detalhe: 'Habilitou "Remover" em Auditoria', pagina: 'Permissões', data: '14/06/2026', hora: '18:03:21', ip: '192.168.0.12' },
  { id: 12, user: 'Ana Paula Reis', setor: 'Estoque', acao: 'acessou', alvo: 'Página · Críticos', detalhe: 'Consultou itens abaixo do mínimo', pagina: 'Críticos', data: '14/06/2026', hora: '09:15:40', ip: '192.168.0.31' },
];

function PageAuditoria({ t }) {
  const [user, setUser] = useStateR('todos');
  const [acao, setAcao] = useStateR('todas');
  const [q, setQ] = useStateR('');
  const [sel, setSel] = useStateR(null);
  const usuarios = [...new Set(AUD_LOGS.map((l) => l.user))];
  const ql = q.trim().toLowerCase();
  const view = AUD_LOGS.filter((l) => (user === 'todos' || l.user === user) && (acao === 'todas' || l.acao === acao) && (!ql || l.alvo.toLowerCase().includes(ql) || l.detalhe.toLowerCase().includes(ql) || (l.sku || '').includes(ql)));
  const av = (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join('');
  const selStyle = { boxSizing: 'border-box', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 32px 0 13px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', appearance: 'none', WebkitAppearance: 'none', outline: 'none', cursor: 'pointer' };

  return (
    <div>
      <PageHeader t={t} title="Auditoria" subtitle="Histórico completo de ações — quem fez, o quê e quando."
        actions={<Btn t={t} kind="ghost" icon="download">Exportar log</Btn>} />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="clipboard" label="Eventos (7 dias)" value={AUD_LOGS.length} kind="accent" />
        <KPI t={t} mini icon="users" label="Usuários ativos" value={usuarios.length} kind="blue" />
        <KPI t={t} mini icon="pencil" label="Edições" value={AUD_LOGS.filter((l) => l.acao === 'editou').length} kind="amber" />
        <KPI t={t} mini icon="trash" label="Exclusões" value={AUD_LOGS.filter((l) => l.acao === 'excluiu').length} kind="red" />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 240px', minWidth: 200, height: 44, padding: '0 14px', borderRadius: 11, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
          <Icon name="search" size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por registro, detalhe ou SKU…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
        </label>
        <div style={{ position: 'relative' }}>
          <select value={user} onChange={(e) => setUser(e.target.value)} style={selStyle}><option value="todos">Todos os usuários</option>{usuarios.map((u) => <option key={u} value={u}>{u}</option>)}</select>
          <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 14, color: t.muted, pointerEvents: 'none' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={acao} onChange={(e) => setAcao(e.target.value)} style={selStyle}><option value="todas">Todas as ações</option>{Object.entries(AUD_ACOES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 14, color: t.muted, pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: t.muted, marginBottom: 14 }}>{view.length} {view.length === 1 ? 'evento' : 'eventos'}</div>

      <Card t={t} style={{ padding: 8 }}>
        {view.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: t.muted, fontSize: 13 }}>Nenhum evento para este filtro.</div>}
        {view.map((l, i) => {
          const a = AUD_ACOES[l.acao]; const c = uiTone(t, a.kind);
          return (
            <div key={l.id} onClick={() => setSel(l)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', borderRadius: 12, cursor: 'pointer', borderBottom: i === view.length - 1 ? 'none' : `1px solid ${t.border}`, transition: 'background .12s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12.5, flexShrink: 0 }}>
                {av(l.user)}
                <span style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: c.fg, color: '#fff', display: 'grid', placeItems: 'center', border: `2px solid ${t.panel}` }}><Icon name={a.icon} size={9} /></span>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>{l.user}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.04em', padding: '2px 8px', borderRadius: 6, background: c.bg, color: c.fg, textTransform: 'uppercase' }}>{a.label}</span>
                  <span style={{ fontSize: 13, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.alvo}</span>
                </div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.detalhe}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: t.text }}>{l.hora}</div>
                <div style={{ fontSize: 11, color: t.faint }}>{l.data}</div>
              </div>
              <Icon name="chevronRight" size={16} style={{ color: t.faint, flexShrink: 0 }} />
            </div>
          );
        })}
      </Card>

      {sel && (() => { const a = AUD_ACOES[sel.acao]; const c = uiTone(t, a.kind); return (
        <div onClick={() => setSel(null)} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '22px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
              <span style={{ width: 44, height: 44, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 14, flexShrink: 0 }}>{av(sel.user)}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 16.5, fontWeight: 850, color: t.text }}>{sel.user}</div><div style={{ fontSize: 12, color: t.muted }}>{sel.setor} · {sel.ip}</div></div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, padding: '6px 11px', borderRadius: 8, background: c.bg, color: c.fg, textTransform: 'uppercase' }}><Icon name={a.icon} size={13} /> {a.label}</span>
              <button onClick={() => setSel(null)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[['Ação realizada', sel.alvo, 'clipboard'], ['Detalhe', sel.detalhe, 'pencil'], ['Página', sel.pagina, 'box'], ['Data e hora', `${sel.data} às ${sel.hora}`, 'clock'], ['Endereço IP', sel.ip, 'lock']].map(([k, v, ic]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '12px 0', borderBottom: k === 'Endereço IP' ? 'none' : `1px solid ${t.border}` }}>
                  <span style={{ width: 32, height: 32, borderRadius: 9, background: t.elevated, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={ic} size={15} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase' }}>{k}</div><div style={{ fontSize: 13.5, fontWeight: 600, color: t.text, marginTop: 3 }}>{v}</div></div>
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
