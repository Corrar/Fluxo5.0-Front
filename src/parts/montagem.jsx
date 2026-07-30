// montagem.jsx — Produção › Montagem de Máquinas (tela REAL, migration 016 / caminho B).
//
// LIGAÇÃO REAL: /assembly-machines atrás de requirePermission('montagem') — GET (grade com
// ?status e o agregado eventos_consumo), POST (cadastro na OP), GET /:id (detalhe + ÁRVORE
// DERIVADA do razão), PUT /:id (checklists dirty-save) e PUT /:id/status (parar/retomar).
// Gate canAccess('montagem') na própria tela: sem a chave nem monta (zero rede).
//
// A RÉGUA DA PEÇA (por que a tela é assim):
//   • A máquina PERTENCE a uma OP (N:1). No razão de material ela é ETIQUETA
//     (op_material_events.machine_id) — DIMENSÃO, nunca eixo: a projeção de saldo e o advisory
//     lock seguem por (OP, produto). Saldo por máquina seria a mesma classe de erro do op_id
//     no stock.
//   • A ÁRVORE DO PRODUTO É PROJEÇÃO, não cadastro: é a soma do que foi REALMENTE consumido e
//     apontado no Armazém com a etiqueta desta máquina. Por isso ela é READ-ONLY aqui — não
//     existe "adicionar material" nesta tela, porque material que não saiu do estoque não é
//     árvore, é desejo.
//
// O MOCK MORREU INTEIRO: MT_SEED (3 máquinas fictícias), MT_MAT_CATALOG (12 SKUs que não
// existem em products — conferido: nenhum bate), a adição manual de material, o "salvar árvore"
// (congelamento é v2) e o trio window.FR_MAQUINAS / window.__frMaqQueue / CustomEvent
// 'fr-maq-consumo' — a ponte de browser que ligava Armazém e Montagem por estado local e que
// estava MORTA desde que o PGLoteModal saiu. O elo agora é o banco: machineId no POST
// /op-materials/consume (ver o seletor de máquina na tela Apontamentos).
//
// FORA DA v1 (decisões travadas): congelamento da ficha técnica (bom_frozen_at nem nasceu),
// notificação de parada aos setores (notifications é órfã — parada é ESTADO, com motivo e setor
// gravados) e a transição 'concluida' (o backend recusa com 400 e a UI nem oferece).

const { useState: useStateMT } = React;
const MT_ACCENT = '#7c3aed', MT_ACCENT_T = '#a78bfa';

function mtErr(e) { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; }
function mtUID() { return 'L' + Math.random().toString(36).slice(2, 9); }  // id LOCAL de grupo/item (o banco guarda o jsonb inteiro)
function mtHoje() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function mtDataHora(iso) {
  const f = window.pgDateTime;
  if (f) return f(iso);
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
}

// TEMPLATE DO FRONT (não do banco, de propósito): os 5 grupos padrão nascem aqui e viajam no
// POST como checklists iniciais. Congelar isso numa migration obrigaria migration toda vez que
// a fábrica mudasse de método — o processo é da tela, o banco só guarda o jsonb.
const MT_GRUPOS_PADRAO = [
  { nome: 'Chassi', peso: 30, itens: ['Corte de perfis', 'Dobra', 'Montagem da estrutura', 'Conferência de medidas'] },
  { nome: 'Solda', peso: 10, itens: ['Solda do chassi', 'Esmerilhamento', 'Inspeção de solda'] },
  { nome: 'Materiais', peso: 25, itens: ['Separação de componentes', 'Instalação mecânica', 'Fixação geral'] },
  { nome: 'Elétrica', peso: 20, itens: ['Passagem de cabos', 'Painel elétrico', 'Sensores', 'Teste de energização'] },
  { nome: 'Acabamento', peso: 15, itens: ['Pintura', 'Identificação', 'Limpeza final', 'Checklist de entrega'] },
];
function mtTemplatePadrao() {
  return MT_GRUPOS_PADRAO.map((g) => ({ nome: g.nome, peso: g.peso, itens: g.itens.map((t) => ({ t, done: false, dia: null })) }));
}

// Allowlist ESPELHADA do backend (assembly.controller). Se divergir, a UI oferece um setor que
// o PUT recusa com 400.
const MT_SETORES_PARADA = ['Compras', 'Financeiro', 'Comercial', 'PCP'];
const MT_SETOR_ICON = { Compras: 'cart', Financeiro: 'dollar', Comercial: 'users', PCP: 'clipboard' };
const MT_GRUPO_COR = ['#7c3aed', '#2563eb', '#d97706', '#10b981', '#ec4899', '#0891b2'];
// Limites ESPELHADOS da borda do backend (validarChecklists): ≤20 grupos, ≤100 itens, textos.
const MT_MAX_GRUPOS = 20, MT_MAX_ITENS = 100, MT_MAX_TXT = 500, MT_MAX_NOME = 200;

// ---------- progresso: SEMPRE derivado, nunca coluna ----------
function mtGrupoPct(g) { const it = g.itens || []; return it.length ? Math.round((it.filter((i) => i.done).length / it.length) * 100) : 0; }
function mtOverall(cls) {
  const gs = Array.isArray(cls) ? cls : [];
  const wsum = gs.reduce((a, g) => a + (Number(g.peso) || 0), 0) || 1;
  const done = gs.reduce((a, g) => a + (Number(g.peso) || 0) * (mtGrupoPct(g) / 100), 0);
  return Math.round((done / wsum) * 100);
}

function mtExportArvore(m) {
  const rows = [['Máquina', 'OP', 'SKU', 'Material', 'Quantidade', 'Unidade']];
  (m.arvore || []).forEach((x) => rows.push([`MAQ-${m.display_no} ${m.name}`, m.op_code, x.sku, x.name, x.qty, x.unit || '']));
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `arvore-MAQ-${m.display_no}-OP-${m.op_code}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- barra segmentada (peso = fatia; preenchimento = % do grupo) ----------
function MTProgressBar({ t, cls, h = 10 }) {
  const gs = Array.isArray(cls) ? cls : [];
  const wsum = gs.reduce((a, g) => a + (Number(g.peso) || 0), 0) || 1;
  if (gs.length === 0) return <div style={{ height: h, borderRadius: h, background: t.hover }} />;
  return (
    <div style={{ display: 'flex', width: '100%', height: h, borderRadius: h, overflow: 'hidden', background: t.hover }}>
      {gs.map((g, i) => {
        const frac = ((Number(g.peso) || 0) / wsum) * 100;
        const fill = mtGrupoPct(g);
        const col = MT_GRUPO_COR[i % MT_GRUPO_COR.length];
        return (
          <div key={i} style={{ width: `${frac}%`, height: '100%', position: 'relative', background: frHexToRgba(col, 0.16) }} title={`${g.nome} · ${fill}%`}>
            <div style={{ position: 'absolute', inset: 0, width: `${fill}%`, background: col }} />
          </div>
        );
      })}
    </div>
  );
}

// ---------- card da grade ----------
function MTCard({ t, m, onOpen }) {
  const pct = mtOverall(m.checklists);
  const parada = m.status === 'parada';
  return (
    <Card t={t} hover onClick={onOpen} style={{ padding: 18, cursor: 'pointer', border: `1px solid ${parada ? frHexToRgba('#ef4444', 0.45) : t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 850, color: t.text }}>{m.name}</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Badge t={t} kind="gray">MAQ-{m.display_no}</Badge>
            <Badge t={t} kind="accent">OP {m.op_code}</Badge>
            {m.sector || ''}
          </div>
        </div>
        {parada ? <Badge t={t} kind="red" dot>Parada</Badge> : <Badge t={t} kind="accent" dot>Em montagem</Badge>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 7px' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: t.faint }}>Progresso geral</span>
        <span style={{ fontSize: 17, fontWeight: 850, color: parada ? uiTone(t, 'red').fg : t.text }}>{pct}%</span>
      </div>
      <MTProgressBar t={t} cls={m.checklists} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {(m.checklists || []).map((g, i) => {
          const col = MT_GRUPO_COR[i % MT_GRUPO_COR.length];
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: t.muted, padding: '3px 8px', borderRadius: 7, background: t.elevated, border: `1px solid ${t.border}` }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: col }} /> {mtGrupoPct(g)}% {g.nome}
            </span>
          );
        })}
        {(m.checklists || []).length === 0 && <span style={{ fontSize: 11.5, color: t.faint }}>Sem checklist ainda.</span>}
      </div>

      {parada && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 11px', borderRadius: 10, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, fontSize: 11.5, lineHeight: 1.45 }}>
          <Icon name="alert" size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><b>Parada ({m.stopped_sector}):</b> {m.stopped_reason}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
        <span style={{ fontSize: 11.5, color: t.faint }}>
          <Icon name="box" size={12} style={{ verticalAlign: '-2px' }} /> {m.eventos_consumo || 0} {Number(m.eventos_consumo) === 1 ? 'item na árvore' : 'itens na árvore'}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: t.accentText, display: 'inline-flex', alignItems: 'center', gap: 5 }}>Abrir <Icon name="chevronRight" size={15} /></span>
      </div>
    </Card>
  );
}

// ---------- modal: registrar parada ----------
function MTParadaModal({ t, m, onClose, onSave, busy }) {
  const [motivo, setMotivo] = useStateMT('');
  const [setor, setSetor] = useStateMT('Compras');
  const field = { boxSizing: 'border-box', width: '100%', borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '11px 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 75, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 18 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,96vw)', maxHeight: '92vh', overflowY: 'auto', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, boxShadow: t.shadow }} className="fr-scroll">
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="alert" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>Registrar parada</div><div style={{ fontSize: 12.5, color: t.muted }}>MAQ-{m.display_no} · {m.name} · OP {m.op_code}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 8 }}>Motivo da parada (até {MT_MAX_TXT})</label>
          <textarea value={motivo} maxLength={MT_MAX_TXT} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Ex: falta de material X, aguardando peça do fornecedor, problema de projeto…" style={{ ...field, resize: 'vertical' }} />
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', margin: '16px 0 8px' }}>Setor responsável pela solução</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MT_SETORES_PARADA.map((s) => {
              const on = setor === s;
              return <button key={s} onClick={() => setSetor(s)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: on ? t.accent : t.elevated, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}><Icon name={MT_SETOR_ICON[s]} size={15} /> {s}</button>;
            })}
          </div>
          {/* Sem promessa de notificação: notifications é órfã por decisão. A parada REGISTRA
              o setor responsável — quem avisa é o processo, não o sistema (dívida registrada). */}
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}`, color: t.muted, fontSize: 12.5, lineHeight: 1.5 }}>
            <Icon name="alert" size={16} style={{ flexShrink: 0, marginTop: 1 }} /> A parada fica registrada na máquina (motivo, setor e desde quando) e aparece na Auditoria. O aviso ao setor ainda é por fora do sistema.
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', height: 44, padding: '0 18px', borderRadius: 11, fontSize: 13.5, fontWeight: 700, color: t.text, border: `1px solid ${t.border}` }}>Cancelar</button>
          <button onClick={() => motivo.trim() && !busy && onSave({ reason: motivo.trim(), sector: setor })} disabled={!motivo.trim() || busy}
            style={{ all: 'unset', boxSizing: 'border-box', cursor: motivo.trim() && !busy ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, background: motivo.trim() && !busy ? '#ef4444' : t.elevated, color: motivo.trim() && !busy ? '#fff' : t.faint }}>
            <Icon name="alert" size={16} /> {busy ? 'Registrando…' : 'Registrar parada'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- modal: cadastrar máquina (OP REAL do GET /clients) ----------
function MTNovaModal({ t, onClose, onCreate, busy, erro }) {
  const { items: clientes, loading: cliLoading, error: cliError } = window.useFRClients();
  const opsAbertas = React.useMemo(() => (window.pgOpsAbertas ? window.pgOpsAbertas(clientes) : []), [clientes]);
  const [nome, setNome] = useStateMT('');
  const [opId, setOpId] = useStateMT('');
  const [setor, setSetor] = useStateMT('');
  const [resp, setResp] = useStateMT('');
  const opSel = opsAbertas.find((o) => o.id === opId) || null;
  const valid = nome.trim() && opSel;
  const field = { boxSizing: 'border-box', width: '100%', height: 46, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const lab = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 8 };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 75, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 18 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,96vw)', maxHeight: '92vh', overflowY: 'auto', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, boxShadow: t.shadow }} className="fr-scroll">
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="plus" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>Cadastrar máquina</div><div style={{ fontSize: 12.5, color: t.muted }}>A máquina pertence a uma OP — o material dela sai do armazém dessa OP.</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div style={{ marginBottom: 16 }}><label style={lab}>Nome da máquina</label><input value={nome} maxLength={MT_MAX_NOME} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Classificadora de Ovos CL-12" style={field} /></div>
          <div style={{ marginBottom: 16 }}>
            <label style={lab}>OP (abertas — GET /clients)</label>
            {cliError ? <div style={{ fontSize: 13, color: uiTone(t, 'red').fg, fontWeight: 700 }}>{cliError}</div> : (
              <div style={{ position: 'relative' }}>
                <select value={opId} onChange={(e) => setOpId(e.target.value)} disabled={cliLoading} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>
                  <option value="">{cliLoading ? 'Carregando OPs…' : 'Selecionar…'}</option>
                  {opsAbertas.map((o) => <option key={o.id} value={o.id}>{o.op_code} · {o.cliente || o.client_name || ''}</option>)}
                </select>
                <Icon name="chevronDown" size={16} style={{ position: 'absolute', right: 11, top: 15, color: t.muted, pointerEvents: 'none' }} />
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={lab}>Setor</label><input value={setor} maxLength={100} onChange={(e) => setSetor(e.target.value)} placeholder="Ex: Montagem" style={field} /></div>
            <div><label style={lab}>Responsável</label><input value={resp} maxLength={100} onChange={(e) => setResp(e.target.value)} placeholder="Chefe do setor" style={field} /></div>
          </div>
          <div style={{ marginTop: 16, padding: '11px 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}`, fontSize: 12.5, color: t.muted, lineHeight: 1.5 }}>
            Nascem os checklists padrão (Chassi 30 · Solda 10 · Materiais 25 · Elétrica 20 · Acabamento 15) — dá pra editar tudo depois, inclusive os pesos.
          </div>
          {erro && <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: uiTone(t, 'red').fg }}>{erro}</div>}
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', height: 44, padding: '0 18px', borderRadius: 11, fontSize: 13.5, fontWeight: 700, color: t.text, border: `1px solid ${t.border}` }}>Cancelar</button>
          <button onClick={() => valid && !busy && onCreate({ name: nome.trim(), op_code: opSel.op_code, sector: setor.trim(), responsible: resp.trim(), checklists: mtTemplatePadrao() })} disabled={!valid || busy}
            style={{ all: 'unset', boxSizing: 'border-box', cursor: valid && !busy ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, background: valid && !busy ? t.accent : t.elevated, color: valid && !busy ? t.onAccent : t.faint }}>
            <Icon name="check" size={16} /> {busy ? 'Cadastrando…' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- detalhe (tela cheia) ----------
function MTDetail({ t, id, onClose, onChanged }) {
  const R = window.React;
  const [m, setM] = useStateMT(null);
  const [cls, setCls] = useStateMT([]);        // cópia editável dos checklists (dirty-save)
  const [sujo, setSujo] = useStateMT(false);
  const [loading, setLoading] = useStateMT(true);
  const [erro, setErro] = useStateMT(null);
  const [busy, setBusy] = useStateMT(false);
  const [openG, setOpenG] = useStateMT(0);
  const [novoItem, setNovoItem] = useStateMT({});
  const [novoGrupo, setNovoGrupo] = useStateMT('');
  const [addGOpen, setAddGOpen] = useStateMT(false);
  const [paradaOpen, setParadaOpen] = useStateMT(false);

  const carregar = R.useCallback(function (inicial) {
    if (inicial) setLoading(true);
    setErro(null);
    return window.FRApi.get(`/assembly-machines/${id}`, { skipLoading: true })
      .then(function (r) {
        setM(r.data || null);
        setCls(JSON.parse(JSON.stringify((r.data && r.data.checklists) || [])));  // cópia profunda
        setSujo(false);
        if (inicial) setLoading(false);
      })
      .catch(function (e) { setErro(mtErr(e)); if (inicial) setLoading(false); });
  }, [id]);
  R.useEffect(function () { carregar(true); }, [carregar]);

  const mutar = (fn) => { setCls((xs) => { const c = JSON.parse(JSON.stringify(xs)); fn(c); return c; }); setSujo(true); };
  const toggle = (gi, ii) => mutar((c) => { const it = c[gi].itens[ii]; it.done = !it.done; it.dia = it.done ? mtHoje() : null; });
  const addItem = (gi, txt) => mutar((c) => { if (c[gi].itens.length < MT_MAX_ITENS) c[gi].itens.push({ t: txt.slice(0, MT_MAX_TXT), done: false, dia: null }); });
  const delItem = (gi, ii) => mutar((c) => { c[gi].itens.splice(ii, 1); });
  const addGrupo = (nome) => mutar((c) => { if (c.length < MT_MAX_GRUPOS) c.push({ nome: nome.slice(0, MT_MAX_NOME), peso: 10, itens: [] }); });
  const delGrupo = (gi) => mutar((c) => { c.splice(gi, 1); });
  const setPeso = (gi, v) => mutar((c) => { const n = Math.max(0, Math.min(100, parseInt(String(v).replace(/[^0-9]/g, '')) || 0)); c[gi].peso = n; });

  const salvar = function () {
    if (busy) return;
    setBusy(true);
    window.FRApi.put(`/assembly-machines/${id}`, { checklists: cls })
      .then(function () { return carregar(false); })
      .then(function () { if (onChanged) onChanged(); })
      .catch(function (e) { setErro(mtErr(e)); })
      .then(function () { setBusy(false); });
  };
  const mudarStatus = function (body) {
    if (busy) return;
    setBusy(true);
    window.FRApi.put(`/assembly-machines/${id}/status`, body)
      .then(function () { setParadaOpen(false); return carregar(false); })
      .then(function () { if (onChanged) onChanged(); })
      .catch(function (e) { setErro(mtErr(e)); })
      .then(function () { setBusy(false); });
  };

  const pageBg = t.panel === '#ffffff' ? '#f4f4f3' : '#0a0a0c';
  if (loading) {
    return <div style={{ position: 'fixed', inset: 0, zIndex: 65, background: pageBg, display: 'grid', placeItems: 'center', color: t.muted, fontSize: 14 }}>Carregando a máquina…</div>;
  }
  if (!m) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 65, background: pageBg, display: 'grid', placeItems: 'center', padding: 24 }}>
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{erro || 'Máquina não encontrada.'}</div>
          <Btn t={t} kind="ghost" icon="chevronLeft" onClick={onClose}>Voltar</Btn>
        </Card>
      </div>
    );
  }

  const parada = m.status === 'parada';
  const pct = mtOverall(cls);
  const somaPesos = cls.reduce((a, g) => a + (Number(g.peso) || 0), 0);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 65, background: pageBg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', padding: '24px 30px', background: parada ? 'linear-gradient(135deg, #b91c1c, #ef4444)' : `linear-gradient(135deg, ${t.accent}, ${frHexToRgba(t.accent, 0.72)})`, color: '#fff' }}>
        <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 18, right: 22, display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 13, fontWeight: 700 }}><Icon name="chevronLeft" size={16} /> Voltar</button>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '4px 11px', borderRadius: 999, background: 'rgba(255,255,255,.2)', marginBottom: 12 }}>
            {parada ? <><Icon name="alert" size={13} /> Parada</> : <><Icon name="settings" size={13} /> Em montagem</>}
          </div>
          <div style={{ fontSize: 26, fontWeight: 850, letterSpacing: '-.01em' }}>MAQ-{m.display_no} · {m.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: 13.5, color: 'rgba(255,255,255,.9)', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clipboard" size={15} /> OP {m.op_code}</span>
            {m.sector && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="settings" size={15} /> {m.sector}</span>}
            {m.responsible && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="user" size={15} /> {m.responsible}</span>}
          </div>
        </div>
      </div>

      <div className="fr-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: pageBg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '26px 30px 40px' }}>
          {erro && <Card t={t} style={{ padding: 14, marginBottom: 16, color: uiTone(t, 'red').fg, fontSize: 13, fontWeight: 700 }}>{erro}</Card>}

          {/* resumo */}
          <Card t={t} style={{ padding: 20, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Resumo da construção</div>
              <div style={{ fontSize: 24, fontWeight: 850, color: parada ? uiTone(t, 'red').fg : t.accentText }}>{pct}%</div>
            </div>
            <MTProgressBar t={t} cls={cls} h={14} />
            <div style={{ fontSize: 11.5, color: t.faint, marginTop: 10 }}>
              Soma dos pesos: {somaPesos}%{somaPesos !== 100 ? ' — o progresso é média ponderada, então funciona com qualquer soma (100 só deixa a leitura mais direta).' : ''}
            </div>
          </Card>

          {/* parada / retomar */}
          {parada ? (
            <Card t={t} style={{ padding: 18, marginBottom: 18, border: `1px solid ${frHexToRgba('#ef4444', 0.4)}`, background: uiTone(t, 'red').bg }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', color: '#ef4444', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="alert" size={19} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: uiTone(t, 'red').fg }}>Montagem parada</div>
                  <div style={{ fontSize: 13, color: t.text, marginTop: 4, lineHeight: 1.5 }}>{m.stopped_reason}</div>
                  <div style={{ fontSize: 11.5, color: t.muted, marginTop: 6 }}>Responsável: <b style={{ color: t.text }}>{m.stopped_sector}</b> · desde {mtDataHora(m.stopped_at)}</div>
                </div>
              </div>
              <button onClick={() => mudarStatus({ status: 'andamento' })} disabled={busy} style={{ all: 'unset', boxSizing: 'border-box', cursor: busy ? 'not-allowed' : 'pointer', marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, background: uiTone(t, 'green').fg, color: '#fff' }}><Icon name="check" size={16} /> Retomar montagem</button>
            </Card>
          ) : (
            <button onClick={() => setParadaOpen(true)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, height: 48, borderRadius: 13, fontSize: 14, fontWeight: 800, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, border: `1px solid ${frHexToRgba('#ef4444', 0.35)}`, marginBottom: 18 }}>
              <Icon name="alert" size={18} /> Registrar parada
            </button>
          )}

          {/* árvore do produto — READ-ONLY, projeção do razão */}
          <Card t={t} style={{ padding: 18, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="git" size={18} /></span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Árvore do produto</div>
                  {/* A nota honesta: isto NÃO é cadastro de materiais. */}
                  <div style={{ fontSize: 11.5, color: t.muted }}>Acumulado do consumo apontado no Armazém com esta máquina — não é lista planejada.</div>
                </div>
              </div>
              {(m.arvore || []).length > 0 && (
                <Btn t={t} kind="ghost" icon="download" onClick={() => mtExportArvore(m)}>Exportar CSV</Btn>
              )}
            </div>
            {(m.arvore || []).length === 0 ? (
              <div style={{ fontSize: 12.5, color: t.faint }}>Nada consumido nesta máquina ainda. O material entra pela tela <b style={{ color: t.muted }}>Apontamentos</b>, escolhendo esta máquina no apontamento.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {m.arvore.map((x) => (
                  <div key={x.product_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}` }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={15} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{x.name}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {x.sku}</div></div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{window.pgNum ? window.pgNum(x.qty) : x.qty} <span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{x.unit || ''}</span></span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* checklists — dirty-save */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Checklists de processo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {sujo && <span style={{ fontSize: 12, fontWeight: 700, color: uiTone(t, 'amber').fg }}>Alterações não salvas</span>}
              {cls.length < MT_MAX_GRUPOS && <button onClick={() => setAddGOpen((v) => !v)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: t.accentText, padding: '6px 11px', borderRadius: 9, background: t.accentSoft }}><Icon name="plus" size={14} /> Novo checklist</button>}
              <Btn t={t} icon="check" onClick={salvar}>{busy ? 'Salvando…' : 'Salvar'}</Btn>
            </div>
          </div>

          {addGOpen && (
            <Card t={t} style={{ padding: 14, marginBottom: 12, border: `1px dashed ${t.borderStrong}` }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input autoFocus value={novoGrupo} maxLength={MT_MAX_NOME} onChange={(e) => setNovoGrupo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && novoGrupo.trim()) { addGrupo(novoGrupo.trim()); setNovoGrupo(''); setAddGOpen(false); } }}
                  placeholder="Ex: Hidráulica, Testes, Pneumática…" style={{ boxSizing: 'border-box', flex: 1, height: 42, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }} />
                <Btn t={t} icon="check" onClick={() => { if (novoGrupo.trim()) { addGrupo(novoGrupo.trim()); setNovoGrupo(''); setAddGOpen(false); } }}>Criar</Btn>
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cls.map((g, gi) => {
              const col = MT_GRUPO_COR[gi % MT_GRUPO_COR.length];
              const open = openG === gi;
              const gp = mtGrupoPct(g);
              const dn = (g.itens || []).filter((i) => i.done).length;
              return (
                <Card t={t} key={gi} style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${col}`, boxShadow: open ? t.shadow : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', background: open ? frHexToRgba(col, 0.06) : 'transparent' }}>
                    <button onClick={() => setOpenG(open ? -1 : gi)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ position: 'relative', width: 46, height: 46, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '50%', background: `conic-gradient(${col} ${gp * 3.6}deg, ${t.hover} 0deg)` }}>
                        <span style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: open ? frHexToRgba(col, 0.06) : t.panel }} />
                        <span style={{ position: 'relative', fontSize: 12, fontWeight: 850, color: gp >= 100 ? uiTone(t, 'green').fg : col }}>{gp >= 100 ? <Icon name="check" size={18} /> : `${gp}%`}</span>
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{g.nome}</div>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: frHexToRgba(col, 0.12), color: col }}>{dn}/{(g.itens || []).length} concluídos</span>
                      </div>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: t.muted }}>peso</span>
                      <input value={g.peso} onChange={(e) => setPeso(gi, e.target.value)} inputMode="numeric"
                        style={{ boxSizing: 'border-box', width: 52, height: 34, textAlign: 'center', borderRadius: 8, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 13, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                      <button onClick={() => delGrupo(gi)} title="Remover checklist" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
                      <Icon name="chevronDown" size={18} style={{ color: t.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                    </div>
                  </div>
                  {open && (
                    <div style={{ padding: '4px 18px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(g.itens || []).map((it, ii) => (
                          <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 6px 5px 12px', borderRadius: 10, background: it.done ? frHexToRgba(col, 0.08) : t.elevated, border: `1px solid ${it.done ? frHexToRgba(col, 0.3) : t.border}` }}>
                            <button onClick={() => toggle(gi, ii)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                              <span style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'grid', placeItems: 'center', background: it.done ? col : 'transparent', border: `2px solid ${it.done ? col : t.borderStrong}`, color: '#fff' }}>{it.done && <Icon name="check" size={14} stroke={3} />}</span>
                              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: t.text, textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? 0.7 : 1 }}>{it.t}</span>
                              {it.done && it.dia && <span style={{ fontSize: 11, fontWeight: 700, color: t.muted, flexShrink: 0 }}><Icon name="calendar" size={12} style={{ verticalAlign: '-2px' }} /> {it.dia}</span>}
                            </button>
                            <button onClick={() => delItem(gi, ii)} title="Remover item" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
                          </div>
                        ))}
                        {(g.itens || []).length === 0 && <div style={{ padding: '10px 2px', fontSize: 12.5, color: t.faint }}>Nenhum item ainda — adicione abaixo.</div>}
                      </div>
                      {(g.itens || []).length < MT_MAX_ITENS && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <input value={novoItem[gi] || ''} maxLength={MT_MAX_TXT} onChange={(e) => setNovoItem((n) => ({ ...n, [gi]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter' && (novoItem[gi] || '').trim()) { addItem(gi, novoItem[gi].trim()); setNovoItem((n) => ({ ...n, [gi]: '' })); } }}
                            placeholder="Adicionar item ao checklist…" style={{ boxSizing: 'border-box', flex: 1, height: 40, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                          <button onClick={() => { if ((novoItem[gi] || '').trim()) { addItem(gi, novoItem[gi].trim()); setNovoItem((n) => ({ ...n, [gi]: '' })); } }} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: t.accentSoft, color: t.accentText }}><Icon name="plus" size={15} /> Add</button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
            {cls.length === 0 && <Card t={t} style={{ padding: 20, fontSize: 13, color: t.muted }}>Sem checklists. Crie o primeiro em "Novo checklist".</Card>}
          </div>
        </div>
      </div>

      {paradaOpen && <MTParadaModal t={t} m={m} busy={busy} onClose={() => setParadaOpen(false)} onSave={(info) => mudarStatus({ status: 'parada', reason: info.reason, sector: info.sector })} />}
    </div>
  );
}

// ---------- página (grade) ----------
function MTPageReal({ t }) {
  const R = window.React;
  const [machines, setMachines] = useStateMT([]);
  const [loading, setLoading] = useStateMT(true);
  const [erro, setErro] = useStateMT(null);
  const [aba, setAba] = useStateMT('');            // '' = default do backend (exclui concluída)
  const [abertaId, setAbertaId] = useStateMT(null);
  const [novaOpen, setNovaOpen] = useStateMT(false);
  const [novaErro, setNovaErro] = useStateMT(null);
  const [busy, setBusy] = useStateMT(false);
  const [busca, setBusca] = useStateMT('');

  const carregar = R.useCallback(function (status, inicial) {
    if (inicial) setLoading(true);
    setErro(null);
    return window.FRApi.get(`/assembly-machines${status ? `?status=${status}` : ''}`, { skipLoading: true })
      .then(function (r) { setMachines((r.data && r.data.machines) || []); if (inicial) setLoading(false); })
      .catch(function (e) { setErro(mtErr(e)); if (inicial) setLoading(false); });
  }, []);
  R.useEffect(function () { carregar(aba, true); }, [aba, carregar]);

  const criar = function (body) {
    setBusy(true); setNovaErro(null);
    window.FRApi.post('/assembly-machines', body)
      .then(function (r) { setNovaOpen(false); setAbertaId(r.data && r.data.id); return carregar(aba, false); })
      .catch(function (e) { setNovaErro(mtErr(e)); })   // 404 de OP fantasma cai aqui
      .then(function () { setBusy(false); });
  };

  const bl = busca.trim().toLowerCase();
  const view = bl ? machines.filter((m) => String(m.name).toLowerCase().includes(bl) || String(m.op_code).toLowerCase().includes(bl) || `maq-${m.display_no}`.includes(bl)) : machines;
  const emMontagem = machines.filter((m) => m.status === 'andamento').length;
  const paradas = machines.filter((m) => m.status === 'parada').length;

  return (
    <div>
      <PageHeader t={t} title="Montagem de Máquinas" subtitle="Cada máquina pertence a uma OP — o progresso é dos checklists, a árvore vem do consumo apontado."
        actions={<Btn t={t} icon="plus" onClick={() => { setNovaErro(null); setNovaOpen(true); }}>Cadastrar máquina</Btn>} />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="settings" label="Em montagem" value={emMontagem} kind="accent" />
        <KPI t={t} mini icon="alert" label="Paradas" value={paradas} kind={paradas > 0 ? 'red' : 'green'} />
        <KPI t={t} mini icon="clipboard" label="Máquinas listadas" value={machines.length} kind="blue" />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}` }}>
          {[['', 'Ativas'], ['andamento', 'Em montagem'], ['parada', 'Paradas'], ['todos', 'Todas']].map(function ([k, label]) {
            const on = aba === k;
            return <button key={k || 'default'} onClick={() => setAba(k)} style={{ all: 'unset', cursor: 'pointer', height: 36, padding: '0 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? '#fff' : t.muted }}>{label}</button>;
          })}
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Icon name="search" size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: t.muted }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, MAQ-… ou OP…" style={{ boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 12, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 14px 0 42px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <Btn t={t} kind="ghost" icon="refresh" onClick={() => carregar(aba, true)}>Atualizar</Btn>
      </div>

      {loading ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando máquinas…</Card>
      ) : erro ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{erro}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => carregar(aba, true)}>Tentar novamente</Btn>
        </Card>
      ) : view.length === 0 ? (
        <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title={bl ? 'Nenhuma máquina encontrada' : 'Nenhuma máquina cadastrada'} sub={bl ? 'Ajuste a busca.' : 'Cadastre a primeira máquina e vincule à OP dela.'} /></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {view.map((m) => <MTCard key={m.id} t={t} m={m} onOpen={() => setAbertaId(m.id)} />)}
        </div>
      )}

      {abertaId && <MTDetail t={t} id={abertaId} onClose={() => setAbertaId(null)} onChanged={() => carregar(aba, false)} />}
      {novaOpen && <MTNovaModal t={t} busy={busy} erro={novaErro} onClose={() => setNovaOpen(false)} onCreate={criar} />}
    </div>
  );
}

// Gate padrão da casa: sem a page_key 'montagem' a tela interna NEM MONTA (zero rede).
// Admin passa pelo bypass; a chave existe no universo (migration 016) e é concedível ao chefe
// de setor pela tela Permissões.
function PGMontagem({ t }) {
  const A = window.FRAuth;
  if (!A || typeof A.canAccess !== 'function' || !A.canAccess('montagem')) {
    return (
      <div>
        <PageHeader t={t} title="Montagem de Máquinas" subtitle="Máquinas em construção, vinculadas às Ordens de Produção." />
        <Card t={t} style={{ padding: 40, textAlign: 'center' }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'inline-grid', placeItems: 'center', marginBottom: 14 }}><Icon name="lock" size={24} /></span>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700 }}>
            Acesso bloqueado. Não possui o nível de permissão necessário (montagem) para ver as máquinas.
          </div>
        </Card>
      </div>
    );
  }
  return <MTPageReal t={t} />;
}
window.PGMontagem = PGMontagem;
