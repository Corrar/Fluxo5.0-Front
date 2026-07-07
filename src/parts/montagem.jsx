// montagem.jsx — Produção › Montagem de Máquinas.
// Chefe de setor aponta o desenvolvimento de uma máquina vinculada a uma OP,
// marcando itens de checklists de processo. Paradas geram notificação aos setores.
const { useState: useStateMT } = React;
const MT_ACCENT = '#7c3aed', MT_ACCENT_T = '#a78bfa';

function mtUID() { return 'M' + Math.random().toString(36).slice(2, 8); }
function mtNow() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function mtHoje() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
// setores que recebem aviso de parada
const MT_SETORES_AVISO = [
  { nome: 'Compras', icon: 'cart' },
  { nome: 'Financeiro', icon: 'dollar' },
  { nome: 'Comercial', icon: 'users' },
  { nome: 'PCP', icon: 'clipboard' },
];
// grupos de processo padrão ao cadastrar uma máquina (peso = % do todo)
const MT_GRUPOS_PADRAO = [
  { nome: 'Chassi', peso: 30, itens: ['Corte de perfis', 'Dobra', 'Montagem da estrutura', 'Conferência de medidas'] },
  { nome: 'Solda', peso: 10, itens: ['Solda do chassi', 'Esmerilhamento', 'Inspeção de solda'] },
  { nome: 'Materiais', peso: 25, itens: ['Separação de componentes', 'Instalação mecânica', 'Fixação geral'] },
  { nome: 'Elétrica', peso: 20, itens: ['Passagem de cabos', 'Painel elétrico', 'Sensores', 'Teste de energização'] },
  { nome: 'Acabamento', peso: 15, itens: ['Pintura', 'Identificação', 'Limpeza final', 'Checklist de entrega'] },
];
function mtMkGrupos(defs) {
  return defs.map((g) => ({ id: mtUID(), nome: g.nome, peso: g.peso, itens: g.itens.map((x) => ({ id: mtUID(), txt: x, done: false, dia: null })) }));
}
function mtSeedGrupos(defs, doneMap) {
  const gs = mtMkGrupos(defs);
  gs.forEach((g) => { const n = doneMap[g.nome] || 0; g.itens.forEach((it, i) => { if (i < n) { it.done = true; it.dia = mtHoje(); } }); });
  return gs;
}

// catálogo de materiais p/ a árvore do produto (BOM)
const MT_MAT_CATALOG = [
  { sku: '5.20.0099', nome: 'Cabo Flexível 2,5mm', un: 'm' },
  { sku: '4.22.0190', nome: 'Disjuntor Tripolar 25A', un: 'un' },
  { sku: '8.11.0334', nome: 'Tubo Inox 304 Ø40', un: 'm' },
  { sku: '9.99.0238', nome: 'Parafuso Sextavado M8', un: 'un' },
  { sku: '2.11.0080', nome: 'Porca Sextavada M8', un: 'un' },
  { sku: '7.40.0150', nome: 'Arruela Lisa 8mm', un: 'un' },
  { sku: '6.30.0012', nome: 'Tinta Epóxi Cinza 3,6L', un: 'lt' },
  { sku: '5.30.0712', nome: 'Terminal Tubular 2,5mm²', un: 'un' },
  { sku: '3.00.0101', nome: 'Filamento PLA Azul 1kg', un: 'un' },
  { sku: '4.10.0233', nome: 'Rolamento 6204ZZ', un: 'un' },
  { sku: '1.02.0044', nome: 'Chapa Aço 1020 2mm', un: 'cap' },
  { sku: '8.50.0021', nome: 'Motoredutor 1cv', un: 'un' },
];

const MT_SEED = [
  {
    id: 'MAQ-014', nome: 'Classificadora de Ovos CL-12', op: 'OP-2041', cliente: 'Granja Mantiqueira', setor: 'Montagem', resp: 'Bruno Teixeira', status: 'andamento', parada: null,
    grupos: mtSeedGrupos(MT_GRUPOS_PADRAO, { Chassi: 4, Solda: 2, Materiais: 1, Elétrica: 0, Acabamento: 0 }),
    materiais: [
      { id: mtUID(), sku: '8.11.0334', nome: 'Tubo Inox 304 Ø40', qtd: 18, un: 'm' },
      { id: mtUID(), sku: '9.99.0238', nome: 'Parafuso Sextavado M8', qtd: 60, un: 'un' },
    ], arvoreSalva: false,
  },
  {
    id: 'MAQ-011', nome: 'Esteira Transportadora 6M', op: 'OP-2055', cliente: 'Indústria Veloz', setor: 'Usinagem', resp: 'Carlos Moura', status: 'parada',
    parada: { motivo: 'Falta de motoredutor 1cv — aguardando compra do fornecedor.', setor: 'Compras', em: '16/06 · 14:20' },
    grupos: mtSeedGrupos(MT_GRUPOS_PADRAO, { Chassi: 4, Solda: 3, Materiais: 1, Elétrica: 0, Acabamento: 0 }),
    materiais: [
      { id: mtUID(), sku: '8.11.0334', nome: 'Tubo Inox 304 Ø40', qtd: 24, un: 'm' },
      { id: mtUID(), sku: '8.50.0021', nome: 'Motoredutor 1cv', qtd: 2, un: 'un' },
    ], arvoreSalva: false,
  },
  {
    id: 'MAQ-009', nome: 'Lavadora Industrial LV-8', op: 'OP-2038', cliente: 'Granja São José', setor: 'Montagem', resp: 'Ana Paula', status: 'andamento', parada: null,
    grupos: mtSeedGrupos(MT_GRUPOS_PADRAO, { Chassi: 4, Solda: 3, Materiais: 3, Elétrica: 4, Acabamento: 2 }),
    materiais: [
      { id: mtUID(), sku: '5.20.0099', nome: 'Cabo Flexível 2,5mm', qtd: 40, un: 'm' },
      { id: mtUID(), sku: '4.22.0190', nome: 'Disjuntor Tripolar 25A', qtd: 3, un: 'un' },
      { id: mtUID(), sku: '1.02.0044', nome: 'Chapa Aço 1020 2mm', qtd: 5, un: 'cap' },
    ], arvoreSalva: false,
  },
];

// ---------- helpers de progresso ----------
function mtGrupoPct(g) { return g.itens.length ? Math.round((g.itens.filter((i) => i.done).length / g.itens.length) * 100) : 0; }
function mtOverall(m) {
  const wsum = m.grupos.reduce((a, g) => a + g.peso, 0) || 1;
  const done = m.grupos.reduce((a, g) => a + g.peso * (mtGrupoPct(g) / 100), 0);
  return Math.round((done / wsum) * 100);
}
const MT_GRUPO_COR = ['#7c3aed', '#2563eb', '#d97706', '#10b981', '#ec4899', '#0891b2'];

function mtExportArvore(m) {
  const rows = [['Máquina', 'OP', 'Cliente', 'SKU', 'Material', 'Quantidade', 'Unidade']];
  (m.materiais || []).forEach((x) => rows.push([m.nome, m.op, m.cliente || '', x.sku, x.nome, x.qtd, x.un]));
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `arvore-${m.id}-${m.op}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- barra segmentada de processos ----------
function MTProgressBar({ t, m, h = 10 }) {
  const wsum = m.grupos.reduce((a, g) => a + g.peso, 0) || 1;
  return (
    <div style={{ display: 'flex', width: '100%', height: h, borderRadius: h, overflow: 'hidden', background: t.hover }}>
      {m.grupos.map((g, i) => {
        const frac = (g.peso / wsum) * 100;
        const fill = mtGrupoPct(g);
        const col = MT_GRUPO_COR[i % MT_GRUPO_COR.length];
        return (
          <div key={g.id} style={{ width: `${frac}%`, height: '100%', position: 'relative', background: frHexToRgba(col, 0.16) }} title={`${g.nome} · ${fill}%`}>
            <div style={{ position: 'absolute', inset: 0, width: `${fill}%`, background: col }} />
          </div>
        );
      })}
    </div>
  );
}

// ---------- card resumido ----------
function MTCard({ t, m, onOpen }) {
  const pct = mtOverall(m);
  const parada = m.status === 'parada';
  const concl = pct >= 100;
  return (
    <Card t={t} hover onClick={onOpen} style={{ padding: 18, cursor: 'pointer', border: `1px solid ${parada ? frHexToRgba('#ef4444', 0.45) : t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 850, color: t.text }}>{m.nome}</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Badge t={t} kind="gray">{m.op}</Badge> {m.cliente}
          </div>
        </div>
        {parada ? <Badge t={t} kind="red" dot>Parada</Badge> : concl ? <Badge t={t} kind="green" dot>Concluída</Badge> : <Badge t={t} kind="accent" dot>Em montagem</Badge>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 7px' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: t.faint }}>Progresso geral</span>
        <span style={{ fontSize: 17, fontWeight: 850, color: parada ? uiTone(t, 'red').fg : t.text }}>{pct}%</span>
      </div>
      <MTProgressBar t={t} m={m} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {m.grupos.map((g, i) => {
          const col = MT_GRUPO_COR[i % MT_GRUPO_COR.length];
          return (
            <span key={g.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: t.muted, padding: '3px 8px', borderRadius: 7, background: t.elevated, border: `1px solid ${t.border}` }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: col }} /> {mtGrupoPct(g)}% {g.nome}
            </span>
          );
        })}
      </div>

      {parada && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 11px', borderRadius: 10, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, fontSize: 11.5, lineHeight: 1.45 }}>
          <Icon name="alert" size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><b>Parada:</b> {m.parada.motivo}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
        <span style={{ fontSize: 11.5, color: t.faint }}><Icon name="users" size={12} style={{ verticalAlign: '-2px' }} /> {m.resp}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: t.accentText, display: 'inline-flex', alignItems: 'center', gap: 5 }}>Apontar <Icon name="chevronRight" size={15} /></span>
      </div>
    </Card>
  );
}

// ---------- modal: registrar parada ----------
function MTParadaModal({ t, m, onClose, onSave }) {
  const [motivo, setMotivo] = useStateMT('');
  const [setor, setSetor] = useStateMT('Compras');
  const avisos = MT_SETORES_AVISO;
  const field = { boxSizing: 'border-box', width: '100%', borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '11px 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 75, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 18 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,96vw)', maxHeight: '92vh', overflowY: 'auto', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, boxShadow: t.shadow }} className="fr-scroll">
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="alert" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>Registrar parada</div><div style={{ fontSize: 12.5, color: t.muted }}>{m.nome} · {m.op}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 8 }}>Motivo da parada</label>
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Ex: falta de material X, aguardando peça do fornecedor, problema de projeto…" style={{ ...field, resize: 'vertical' }} />

          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', margin: '16px 0 8px' }}>Setor responsável pela solução</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {avisos.map((s) => {
              const on = setor === s.nome;
              return <button key={s.nome} onClick={() => setSetor(s.nome)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: on ? t.accent : t.elevated, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}><Icon name={s.icon} size={15} /> {s.nome}</button>;
            })}
          </div>

          <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 13px', borderRadius: 11, background: t.accentSoft, color: t.accentText, fontSize: 12.5, lineHeight: 1.5 }}>
            <Icon name="bell" size={16} style={{ flexShrink: 0, marginTop: 1 }} /> Ao registrar, <b>Compras, Financeiro, Comercial e PCP</b> serão notificados imediatamente sobre a parada desta máquina.
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', height: 44, padding: '0 18px', borderRadius: 11, fontSize: 13.5, fontWeight: 700, color: t.text, border: `1px solid ${t.border}` }}>Cancelar</button>
          <button onClick={() => motivo.trim() && onSave({ motivo: motivo.trim(), setor, em: mtNow() })} disabled={!motivo.trim()}
            style={{ all: 'unset', boxSizing: 'border-box', cursor: motivo.trim() ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, background: motivo.trim() ? '#ef4444' : t.elevated, color: motivo.trim() ? '#fff' : t.faint }}>
            <Icon name="alert" size={16} /> Registrar e notificar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- modal: nova máquina ----------
function MTNovaModal({ t, onClose, onCreate }) {
  const [nome, setNome] = useStateMT('');
  const [op, setOp] = useStateMT('');
  const [cliente, setCliente] = useStateMT('');
  const [resp, setResp] = useStateMT('');
  const ops = (window.FR_OPS_ATIVAS || []);
  const opFlat = ops.flatMap((c) => c.ops.map((o) => ({ op: o, cliente: c.cliente })));
  const valid = nome.trim() && op.trim();
  const field = { boxSizing: 'border-box', width: '100%', height: 46, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const lab = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 8 };
  const pick = (e) => { const v = e.target.value; setOp(v); const f = opFlat.find((x) => x.op === v); if (f) setCliente(f.cliente); };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 75, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 18 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,96vw)', maxHeight: '92vh', overflowY: 'auto', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, boxShadow: t.shadow }} className="fr-scroll">
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="plus" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>Cadastrar máquina</div><div style={{ fontSize: 12.5, color: t.muted }}>Vincule uma máquina a uma OP para apontar a montagem.</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div style={{ marginBottom: 16 }}><label style={lab}>Nome da máquina</label><input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Classificadora de Ovos CL-12" style={field} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={lab}>OP</label>
              <div style={{ position: 'relative' }}>
                <select value={op} onChange={pick} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>
                  <option value="">Selecionar…</option>
                  {opFlat.map((x) => <option key={x.cliente + x.op} value={x.op}>{x.op} · {x.cliente}</option>)}
                </select>
                <Icon name="chevronDown" size={16} style={{ position: 'absolute', right: 11, top: 15, color: t.muted, pointerEvents: 'none' }} />
              </div>
            </div>
            <div><label style={lab}>Responsável</label><input value={resp} onChange={(e) => setResp(e.target.value)} placeholder="Chefe do setor" style={field} /></div>
          </div>
          <div><label style={lab}>Cliente</label><input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Cliente da OP" style={field} /></div>
          <div style={{ marginTop: 16, padding: '11px 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}`, fontSize: 12.5, color: t.muted, lineHeight: 1.5 }}>
            Serão criados os checklists de processo padrão (Chassi, Solda, Materiais, Elétrica, Acabamento). Você poderá marcar os itens conforme o trabalho diário.
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', height: 44, padding: '0 18px', borderRadius: 11, fontSize: 13.5, fontWeight: 700, color: t.text, border: `1px solid ${t.border}` }}>Cancelar</button>
          <button onClick={() => valid && onCreate({ nome: nome.trim(), op: op.trim(), cliente: cliente.trim() || '—', resp: resp.trim() || 'Chefe de setor', grupos: mtMkGrupos(MT_GRUPOS_PADRAO) })} disabled={!valid}
            style={{ all: 'unset', boxSizing: 'border-box', cursor: valid ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, background: valid ? t.accent : t.elevated, color: valid ? t.onAccent : t.faint }}>
            <Icon name="check" size={16} /> Cadastrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- detalhe (tela cheia): apontar checklists ----------
function MTDetail({ t, m, onClose, onToggle, onParada, onRetomar, onAddItem, onDelItem, onAddGrupo, onAddMat, onSetMatQtd, onDelMat, onSalvarArvore }) {
  const [openG, setOpenG] = useStateMT(m.grupos[0] ? m.grupos[0].id : null);
  const [novo, setNovo] = useStateMT({});
  const [novoGrupo, setNovoGrupo] = useStateMT('');
  const [addGOpen, setAddGOpen] = useStateMT(false);
  const [matBusca, setMatBusca] = useStateMT('');
  const [matOpen, setMatOpen] = useStateMT(false);
  const pct = mtOverall(m);
  const parada = m.status === 'parada';
  const completo = pct >= 100;
  const mtMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const matInList = (sku) => (m.materiais || []).some((x) => x.sku === sku);
  const matResults = MT_MAT_CATALOG.filter((c) => { const q = matBusca.trim().toLowerCase(); return !q || c.nome.toLowerCase().includes(q) || c.sku.includes(q); });
  const pageBg = t.panel === '#ffffff' ? '#f4f4f3' : '#0a0a0c';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 65, background: pageBg, display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ position: 'relative', padding: mtMobile ? '20px 18px' : '24px 30px', background: parada ? `linear-gradient(135deg, #b91c1c, #ef4444)` : `linear-gradient(135deg, ${t.accent}, ${frHexToRgba(t.accent, 0.72)})`, color: '#fff' }}>
        <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 18, right: 22, display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 13, fontWeight: 700 }}><Icon name="chevronLeft" size={16} /> Voltar</button>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '4px 11px', borderRadius: 999, background: 'rgba(255,255,255,.2)', marginBottom: 12 }}>{parada ? <><Icon name="alert" size={13} /> Parada</> : <><Icon name="settings" size={13} /> Em montagem</>}</div>
          <div style={{ fontSize: mtMobile ? 22 : 26, fontWeight: 850, letterSpacing: '-.01em' }}>{m.nome}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: 13.5, color: 'rgba(255,255,255,.9)', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clipboard" size={15} /> {m.op}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="users" size={15} /> {m.cliente}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="user" size={15} /> {m.resp}</span>
          </div>
        </div>
      </div>

      <div className="fr-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: pageBg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: mtMobile ? '20px 18px 32px' : '26px 30px 40px' }}>
          {/* resumo */}
          <Card t={t} style={{ padding: 20, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Resumo da construção</div>
              <div style={{ fontSize: 24, fontWeight: 850, color: parada ? uiTone(t, 'red').fg : t.accentText }}>{pct}%</div>
            </div>
            <MTProgressBar t={t} m={m} h={14} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {m.grupos.map((g, i) => {
                const col = MT_GRUPO_COR[i % MT_GRUPO_COR.length];
                return (
                  <div key={g.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: t.text, padding: '6px 11px', borderRadius: 9, background: t.elevated, border: `1px solid ${t.border}` }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: col }} /> {g.nome} <span style={{ color: t.muted }}>· {mtGrupoPct(g)}% · peso {g.peso}%</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* parada / retomar */}
          {parada ? (
            <Card t={t} style={{ padding: 18, marginBottom: 18, border: `1px solid ${frHexToRgba('#ef4444', 0.4)}`, background: uiTone(t, 'red').bg }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', color: '#ef4444', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="alert" size={19} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: uiTone(t, 'red').fg }}>Montagem parada</div>
                  <div style={{ fontSize: 13, color: t.text, marginTop: 4, lineHeight: 1.5 }}>{m.parada.motivo}</div>
                  <div style={{ fontSize: 11.5, color: t.muted, marginTop: 6 }}>Encaminhado para <b style={{ color: t.text }}>{m.parada.setor}</b> · {m.parada.em} · setores notificados</div>
                </div>
              </div>
              <button onClick={onRetomar} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, background: uiTone(t, 'green').fg, color: '#fff' }}><Icon name="check" size={16} /> Retomar montagem</button>
            </Card>
          ) : (
            <button onClick={onParada} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, height: 48, borderRadius: 13, fontSize: 14, fontWeight: 800, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, border: `1px solid ${frHexToRgba('#ef4444', 0.35)}`, marginBottom: 18 }}>
              <Icon name="alert" size={18} /> Registrar parada — notifica os setores
            </button>
          )}

          {/* árvore do produto (BOM) */}
          <Card t={t} style={{ padding: 18, marginBottom: 18, border: m.arvoreSalva ? `1px solid ${frHexToRgba('#10b981', 0.4)}` : `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="git" size={18} /></span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Árvore do produto</div>
                  <div style={{ fontSize: 11.5, color: t.muted }}>Materiais aplicados nesta máquina · base da ficha técnica (BOM)</div>
                </div>
              </div>
              {m.arvoreSalva
                ? <Badge t={t} kind="green" dot>Árvore salva</Badge>
                : <span style={{ fontSize: 12, fontWeight: 700, color: t.faint }}>{(m.materiais || []).length} {(m.materiais || []).length === 1 ? 'material' : 'materiais'}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(m.materiais || []).map((mt) => (
                <div key={mt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}` }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={15} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{mt.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {mt.sku}</div></div>
                  {m.arvoreSalva
                    ? <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{mt.qtd} <span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{mt.un}</span></span>
                    : <>
                        <input value={mt.qtd} onChange={(e) => onSetMatQtd(mt.id, e.target.value)} inputMode="numeric" style={{ boxSizing: 'border-box', width: 64, height: 36, textAlign: 'center', borderRadius: 8, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                        <span style={{ fontSize: 12, color: t.faint, width: 28 }}>{mt.un}</span>
                        <button onClick={() => onDelMat(mt.id)} title="Remover" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
                      </>}
                </div>
              ))}
              {(m.materiais || []).length === 0 && <div style={{ padding: '12px 2px', fontSize: 12.5, color: t.faint }}>Nenhum material aplicado ainda.</div>}
            </div>

            {!m.arvoreSalva && (
              <div style={{ position: 'relative', marginTop: 12 }}>
                <button onClick={() => setMatOpen((v) => !v)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: t.accentText, background: t.accentSoft }}><Icon name="plus" size={15} /> Adicionar material</button>
                {matOpen && (
                  <div style={{ position: 'absolute', zIndex: 30, top: 'calc(100% + 6px)', left: 0, right: 0, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 8 }}>
                    <div style={{ position: 'relative', marginBottom: 6 }}>
                      <Icon name="search" size={15} style={{ position: 'absolute', left: 11, top: 11, color: t.muted }} />
                      <input autoFocus value={matBusca} onChange={(e) => setMatBusca(e.target.value)} placeholder="Buscar material…" style={{ boxSizing: 'border-box', width: '100%', height: 38, borderRadius: 9, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px 0 34px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                    <div className="fr-scroll" style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {matResults.map((c) => {
                        const on = matInList(c.sku);
                        return (
                          <button key={c.sku} onClick={() => { if (!on) { onAddMat(c); setMatOpen(false); setMatBusca(''); } }} disabled={on} style={{ all: 'unset', boxSizing: 'border-box', cursor: on ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, background: on ? frHexToRgba('#22c55e', 0.08) : 'transparent' }}
                            onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{c.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {c.sku} · {c.un}</div></div>
                            {on ? <span style={{ fontSize: 11.5, fontWeight: 700, color: uiTone(t, 'green').fg }}>✓ na lista</span> : <Icon name="plus" size={15} style={{ color: t.accentText }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* finalizar / exportar árvore */}
            {completo && !m.arvoreSalva && (m.materiais || []).length > 0 && (
              <button onClick={onSalvarArvore} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, height: 46, borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: uiTone(t, 'green').fg, color: '#fff' }}><Icon name="check" size={17} /> Finalizar e salvar árvore do produto</button>
            )}
            {completo && !m.arvoreSalva && (m.materiais || []).length === 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: uiTone(t, 'amber').fg, fontWeight: 600 }}>Adicione os materiais aplicados antes de salvar a árvore.</div>
            )}
            {m.arvoreSalva && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160, fontSize: 12.5, color: t.muted }}>Árvore congelada — ficha técnica salva para faturamento e reuso.</div>
                <button onClick={() => mtExportArvore(m)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: t.accentText, background: t.accentSoft }}><Icon name="download" size={15} /> Exportar árvore (CSV)</button>
              </div>
            )}
          </Card>

          {/* checklists */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Checklists de processo</div>
            {!parada && <button onClick={() => setAddGOpen((v) => !v)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: t.accentText, padding: '6px 11px', borderRadius: 9, background: t.accentSoft }}><Icon name="plus" size={14} /> Novo checklist</button>}
          </div>

          {addGOpen && !parada && (
            <Card t={t} style={{ padding: 14, marginBottom: 12, border: `1px dashed ${t.borderStrong}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 8 }}>Nome do novo checklist</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input autoFocus value={novoGrupo} onChange={(e) => setNovoGrupo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && novoGrupo.trim()) { onAddGrupo(novoGrupo.trim()); setNovoGrupo(''); setAddGOpen(false); } }} placeholder="Ex: Hidráulica, Testes, Pneumática…" style={{ boxSizing: 'border-box', flex: 1, height: 42, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={() => { if (novoGrupo.trim()) { onAddGrupo(novoGrupo.trim()); setNovoGrupo(''); setAddGOpen(false); } }} disabled={!novoGrupo.trim()} style={{ all: 'unset', boxSizing: 'border-box', cursor: novoGrupo.trim() ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 7, height: 42, padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, background: novoGrupo.trim() ? t.accent : t.elevated, color: novoGrupo.trim() ? t.onAccent : t.faint }}><Icon name="check" size={15} /> Criar</button>
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {m.grupos.map((g, gi) => {
              const col = MT_GRUPO_COR[gi % MT_GRUPO_COR.length];
              const open = openG === g.id;
              const gp = mtGrupoPct(g);
              const dn = g.itens.filter((i) => i.done).length;
              return (
                <Card t={t} key={g.id} style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${col}`, boxShadow: open ? t.shadow : 'none' }}>
                  <button onClick={() => setOpenG(open ? null : g.id)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', background: open ? frHexToRgba(col, 0.06) : 'transparent' }}>
                    <span style={{ position: 'relative', width: 46, height: 46, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '50%', background: `conic-gradient(${col} ${gp * 3.6}deg, ${t.hover} 0deg)` }}>
                      <span style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: open ? frHexToRgba(col, 0.06) : t.panel }} />
                      <span style={{ position: 'relative', fontSize: 12, fontWeight: 850, color: gp >= 100 ? uiTone(t, 'green').fg : col }}>{gp >= 100 ? <Icon name="check" size={18} /> : `${gp}%`}</span>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{g.nome}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: frHexToRgba(col, 0.12), color: col }}>{dn}/{g.itens.length} concluídos</span>
                        <span style={{ fontSize: 11.5, color: t.muted }}>peso {g.peso}% do todo</span>
                      </div>
                    </div>
                    <Icon name="chevronDown" size={18} style={{ color: t.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
                  </button>
                  {open && (
                    <div style={{ padding: '4px 18px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {g.itens.map((it) => (
                          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 6px 5px 12px', borderRadius: 10, background: it.done ? frHexToRgba(col, 0.08) : t.elevated, border: `1px solid ${it.done ? frHexToRgba(col, 0.3) : t.border}`, opacity: parada ? 0.7 : 1 }}
                            onMouseEnter={(e) => { const d = e.currentTarget.querySelector('.mt-del'); if (d) d.style.opacity = '1'; }}
                            onMouseLeave={(e) => { const d = e.currentTarget.querySelector('.mt-del'); if (d) d.style.opacity = '0'; }}>
                            <button onClick={() => !parada && onToggle(g.id, it.id)} disabled={parada} style={{ all: 'unset', boxSizing: 'border-box', cursor: parada ? 'not-allowed' : 'pointer', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                              <span style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'grid', placeItems: 'center', background: it.done ? col : 'transparent', border: `2px solid ${it.done ? col : t.borderStrong}`, color: '#fff' }}>{it.done && <Icon name="check" size={14} stroke={3} />}</span>
                              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: t.text, textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? 0.7 : 1 }}>{it.txt}</span>
                              {it.done && it.dia && <span style={{ fontSize: 11, fontWeight: 700, color: t.muted, flexShrink: 0 }}><Icon name="calendar" size={12} style={{ verticalAlign: '-2px' }} /> {it.dia}</span>}
                            </button>
                            {!parada && <button className="mt-del" onClick={() => onDelItem(g.id, it.id)} title="Remover item" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, opacity: 0, transition: 'opacity .12s', flexShrink: 0 }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>}
                          </div>
                        ))}
                        {g.itens.length === 0 && <div style={{ padding: '10px 2px', fontSize: 12.5, color: t.faint }}>Nenhum item ainda — adicione abaixo.</div>}
                      </div>
                      {!parada && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <input value={novo[g.id] || ''} onChange={(e) => setNovo((n) => ({ ...n, [g.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter' && (novo[g.id] || '').trim()) { onAddItem(g.id, novo[g.id].trim()); setNovo((n) => ({ ...n, [g.id]: '' })); } }} placeholder="Adicionar item extra ao checklist…" style={{ boxSizing: 'border-box', flex: 1, height: 40, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                          <button onClick={() => { if ((novo[g.id] || '').trim()) { onAddItem(g.id, novo[g.id].trim()); setNovo((n) => ({ ...n, [g.id]: '' })); } }} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: t.accentSoft, color: t.accentText }}><Icon name="plus" size={15} /> Add</button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- página ----------
function PGMontagem({ t }) {
  const [list, setList] = useStateMT(() => MT_SEED.map((m) => ({ ...m, grupos: m.grupos.map((g) => ({ ...g, itens: g.itens.map((i) => ({ ...i })) })) })));
  const [openId, setOpenId] = useStateMT(null);
  const [paradaId, setParadaId] = useStateMT(null);
  const [novaOpen, setNovaOpen] = useStateMT(false);
  const [toast, setToast] = useStateMT(null);
  const [busca, setBusca] = useStateMT('');

  const cur = list.find((m) => m.id === openId);
  const paradaM = list.find((m) => m.id === paradaId);
  const upd = (id, fn) => setList((xs) => xs.map((m) => m.id === id ? fn(m) : m));

  // expõe as máquinas (não-concluídas) para o Apontamento do Armazém escolher
  React.useEffect(() => {
    window.FR_MAQUINAS = list.filter((m) => !m.arvoreSalva).map((m) => ({ id: m.id, nome: m.nome, op: m.op, setor: m.setor }));
  }, [list]);
  // recebe consumo apontado no Armazém (via fila global) e injeta na árvore da máquina
  const drainRef = React.useRef(0);
  React.useEffect(() => {
    const drain = () => {
      const q = window.__frMaqQueue || [];
      if (q.length <= drainRef.current) return;
      const novos = q.slice(drainRef.current);
      drainRef.current = q.length;
      setList((xs) => xs.map((m) => {
        const mine = novos.filter((d) => d.maquinaId === m.id);
        if (!mine.length) return m;
        const mats = (m.materiais || []).map((x) => ({ ...x }));
        mine.forEach((d) => {
          const ex = mats.find((x) => x.sku === d.sku);
          if (ex) ex.qtd = (parseInt(ex.qtd) || 0) + (parseInt(d.qtd) || 0);
          else mats.push({ id: mtUID(), sku: d.sku, nome: d.nome, qtd: parseInt(d.qtd) || 0, un: d.un || 'un' });
        });
        return { ...m, materiais: mats };
      }));
    };
    drain();
    window.addEventListener('fr-maq-consumo', drain);
    return () => window.removeEventListener('fr-maq-consumo', drain);
  }, []);

  const toggle = (mid, gid, iid) => upd(mid, (m) => ({ ...m, grupos: m.grupos.map((g) => g.id === gid ? { ...g, itens: g.itens.map((it) => it.id === iid ? { ...it, done: !it.done, dia: !it.done ? mtHoje() : null } : it) } : g) }));
  const addItem = (mid, gid, txt) => upd(mid, (m) => ({ ...m, grupos: m.grupos.map((g) => g.id === gid ? { ...g, itens: [...g.itens, { id: mtUID(), txt, done: false, dia: null }] } : g) }));
  const delItem = (mid, gid, iid) => upd(mid, (m) => ({ ...m, grupos: m.grupos.map((g) => g.id === gid ? { ...g, itens: g.itens.filter((it) => it.id !== iid) } : g) }));
  const addGrupo = (mid, nome) => upd(mid, (m) => {
    const peso = Math.max(5, Math.round(100 / (m.grupos.length + 1) / 5) * 5);
    return { ...m, grupos: [...m.grupos, { id: mtUID(), nome, peso, itens: [] }] };
  });
  const addMat = (mid, c) => upd(mid, (m) => ({ ...m, materiais: [...(m.materiais || []), { id: mtUID(), sku: c.sku, nome: c.nome, qtd: 1, un: c.un }] }));
  const setMatQtd = (mid, iid, v) => upd(mid, (m) => ({ ...m, materiais: (m.materiais || []).map((x) => x.id === iid ? { ...x, qtd: Math.max(0, parseInt(String(v).replace(/[^0-9]/g, '')) || 0) } : x) }));
  const delMat = (mid, iid) => upd(mid, (m) => ({ ...m, materiais: (m.materiais || []).filter((x) => x.id !== iid) }));
  const salvarArvore = (mid) => { upd(mid, (m) => ({ ...m, arvoreSalva: true })); setToast({ kind: 'arvore' }); setTimeout(() => setToast(null), 4200); };
  const salvarParada = (info) => {
    upd(paradaId, (m) => ({ ...m, status: 'parada', parada: info }));
    const maq = list.find((m) => m.id === paradaId);
    try {
      window.dispatchEvent(new CustomEvent('fr-notify', { detail: {
        icon: 'alert', tone: 'red',
        titulo: `Parada — ${info.setor}`,
        txt: `${maq ? maq.nome : 'Máquina'} (${maq ? maq.op : ''}) parada: ${info.motivo}`,
      } }));
    } catch (e) {}
    setToast({ kind: 'parada', setor: info.setor }); setParadaId(null); setTimeout(() => setToast(null), 4200);
  };
  const retomar = (mid) => upd(mid, (m) => ({ ...m, status: 'andamento', parada: null }));
  const criar = (data) => { const id = 'MAQ-' + String(Math.floor(Math.random() * 900) + 100); setList((xs) => [{ id, status: 'andamento', parada: null, materiais: [], arvoreSalva: false, ...data }, ...xs]); setNovaOpen(false); setOpenId(id); };

  const ativas = list.filter((m) => m.status === 'andamento' && mtOverall(m) < 100).length;
  const paradas = list.filter((m) => m.status === 'parada').length;
  const concl = list.filter((m) => mtOverall(m) >= 100).length;
  const bl = busca.trim().toLowerCase();
  const view = bl ? list.filter((m) => m.nome.toLowerCase().includes(bl) || m.op.toLowerCase().includes(bl) || (m.cliente || '').toLowerCase().includes(bl)) : list;

  return (
    <div>
      <PageHeader t={t} title="Montagem de Máquinas" subtitle="Aponte o desenvolvimento da construção de cada máquina vinculada a uma OP."
        actions={<Btn t={t} icon="plus" onClick={() => setNovaOpen(true)}>Cadastrar máquina</Btn>} />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="settings" label="Em montagem" value={ativas} kind="accent" />
        <KPI t={t} mini icon="alert" label="Paradas" value={paradas} kind="red" />
        <KPI t={t} mini icon="check" label="Concluídas" value={concl} kind="green" />
        <KPI t={t} mini icon="clipboard" label="Total de máquinas" value={list.length} kind="blue" />
      </div>

      <div style={{ position: 'relative', marginBottom: 18 }}>
        <Icon name="search" size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: t.muted }} />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar máquina por nome (painel, esteira, lavadora…) ou OP…" style={{ boxSizing: 'border-box', width: '100%', height: 48, borderRadius: 13, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 40px 0 42px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
        {busca && <button onClick={() => setBusca('')} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={15} /></button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
        {view.map((m) => <MTCard key={m.id} t={t} m={m} onOpen={() => setOpenId(m.id)} />)}
        {view.length === 0 && <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', fontSize: 13.5, color: t.muted }}>{bl ? 'Nenhuma máquina encontrada para essa busca.' : 'Nenhuma máquina cadastrada.'}</div>}
      </div>

      {cur && <MTDetail t={t} m={cur} onClose={() => setOpenId(null)}
        onToggle={(gid, iid) => toggle(cur.id, gid, iid)} onAddItem={(gid, txt) => addItem(cur.id, gid, txt)}
        onDelItem={(gid, iid) => delItem(cur.id, gid, iid)} onAddGrupo={(nome) => addGrupo(cur.id, nome)}
        onAddMat={(c) => addMat(cur.id, c)} onSetMatQtd={(iid, v) => setMatQtd(cur.id, iid, v)} onDelMat={(iid) => delMat(cur.id, iid)} onSalvarArvore={() => salvarArvore(cur.id)}
        onParada={() => setParadaId(cur.id)} onRetomar={() => retomar(cur.id)} />}
      {paradaM && <MTParadaModal t={t} m={paradaM} onClose={() => setParadaId(null)} onSave={salvarParada} />}
      {novaOpen && <MTNovaModal t={t} onClose={() => setNovaOpen(false)} onCreate={criar} />}

      {toast && (
        <div style={{ position: 'fixed', zIndex: 90, bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderRadius: 13, background: t.text, color: t.panel, boxShadow: '0 18px 40px rgba(0,0,0,.3)', maxWidth: '92vw' }}>
          <Icon name={toast.kind === 'arvore' ? 'git' : 'bell'} size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {toast.kind === 'arvore'
              ? <>Árvore do produto <b>salva</b> · ficha técnica congelada para faturamento e reuso.</>
              : <>Parada registrada · <b>Compras, Financeiro, Comercial e PCP</b> foram notificados.</>}
          </span>
        </div>
      )}
    </div>
  );
}
window.PGMontagem = PGMontagem;
// inicializa a lista de máquinas para o seletor do Armazém (mesmo antes de abrir Montagem)
try { window.FR_MAQUINAS = MT_SEED.filter((m) => !m.arvoreSalva).map((m) => ({ id: m.id, nome: m.nome, op: m.op, setor: m.setor })); } catch (e) {}
