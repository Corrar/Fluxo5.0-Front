// assistencia.jsx — Módulo Assistência Técnica (Field Service completo, stateful):
// atendimentos (corretiva/preventiva/instalação) com ciclo Aberto→Agendado→
// Deslocamento→Atendimento→Concluído→Faturado, apontamentos (mão de obra/peças/
// deslocamento), laudo técnico, agenda/despacho, contratos & SLA, base instalada
// com histórico, técnicos. Botões funcionais via estado no container ATModule.
const { useState: useStateAT } = React;
const AT_ACCENT = '#0d9488', AT_ACCENT_T = '#2dd4bf';

const AT_PIPE = [
  { key: 'aberto', label: 'Aberto', icon: 'file' },
  { key: 'agendado', label: 'Agendado', icon: 'calendar' },
  { key: 'deslocamento', label: 'Deslocamento', icon: 'truck' },
  { key: 'atendimento', label: 'Em atendimento', icon: 'wrench' },
  { key: 'concluido', label: 'Concluído', icon: 'check' },
  { key: 'faturado', label: 'Faturado', icon: 'barChart' },
];
const AT_STAGE = Object.fromEntries(AT_PIPE.map((s, i) => [s.key, { ...s, idx: i }]));
const AT_STAGE_KIND = { aberto: 'blue', agendado: 'amber', deslocamento: 'amber', atendimento: 'accent', concluido: 'green', faturado: 'gray' };
const AT_NEXT = { aberto: 'agendado', agendado: 'deslocamento', deslocamento: 'atendimento', atendimento: 'concluido', concluido: 'faturado' };
const AT_NEXT_LABEL = { aberto: 'Agendar', agendado: 'Despachar técnico', deslocamento: 'Iniciar atendimento', atendimento: 'Encerrar atendimento', concluido: 'Faturar' };
const AT_TIPO = {
  corretiva:  { label: 'Corretiva', kind: 'red', icon: 'wrench' },
  preventiva: { label: 'Preventiva', kind: 'green', icon: 'shield' },
  instalacao: { label: 'Instalação', kind: 'blue', icon: 'cpu' },
};
const AT_PRIO = { alta: ['Alta', 'red'], media: ['Média', 'amber'], baixa: ['Baixa', 'blue'] };
const fmtAT = (n) => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const atInit = (n) => (n || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
const atTotal = (o) => o.maoObra.reduce((a, m) => a + m.horas * m.valorHora, 0) + o.pecas.reduce((a, p) => a + p.qtd * p.valor, 0) + o.desloc.reduce((a, d) => a + d.valor, 0);

const AT_OS_SEED = [
  { id: 'OA-2041', tipo: 'corretiva', cliente: 'Granja São José', cidade: 'Castro - PR', equip: 'Embaladora de Ovos EV-200', serie: 'EV200-0143', tecnico: 'Carlos Moura', prio: 'alta', status: 'atendimento', aberta: '14/06 · 08:10', contrato: 'CT-118 · Premium', sla: '4h', slaRest: '1h 20min',
    problema: 'Esteira travando intermitentemente; sensor de nível sem leitura.',
    maoObra: [{ desc: 'Diagnóstico e troca de sensor', horas: 2, valorHora: 120 }],
    pecas: [{ nome: 'Sensor de nível', sku: '5.20.0099', qtd: 1, valor: 180 }, { nome: 'Correia A-32', sku: '4.10.0235', qtd: 2, valor: 28 }],
    desloc: [{ desc: 'Deslocamento 84 km', valor: 168 }], laudo: '', checklist: [] },
  { id: 'OA-2040', tipo: 'preventiva', cliente: 'Mantiqueira Céu Azul', cidade: 'Itanhandu - MG', equip: 'Classificadora CL-9', serie: 'CL9-0067', tecnico: 'Rafael Souza', prio: 'media', status: 'agendado', aberta: '14/06 · 07:30', contrato: 'CT-092 · Anual', sla: 'Visita 16/06', slaRest: '2 dias',
    problema: 'Manutenção preventiva trimestral — calibração e lubrificação.',
    maoObra: [], pecas: [{ nome: 'Rolamento 6205ZZ', sku: '4.10.0234', qtd: 4, valor: 16.8 }], desloc: [], laudo: '',
    checklist: [{ t: 'Verificar tensão das correias', ok: false }, { t: 'Lubrificar mancais', ok: false }, { t: 'Calibrar célula de carga', ok: false }, { t: 'Testar sensores', ok: false }] },
  { id: 'OA-2039', tipo: 'corretiva', cliente: 'Ovos da Nonna', cidade: 'Bastos - SP', equip: 'Esteira Transportadora ET-4', serie: 'ET4-0210', tecnico: null, prio: 'baixa', status: 'aberto', aberta: '13/06 · 16:40', contrato: 'Avulso', sla: '24h', slaRest: '6h',
    problema: 'Ruído na redução; cliente solicita inspeção.', maoObra: [], pecas: [], desloc: [], laudo: '', checklist: [] },
  { id: 'OA-2037', tipo: 'corretiva', cliente: 'Granja Paraíso', cidade: 'Cascavel - PR', equip: 'Embaladora de Ovos EV-200', serie: 'EV200-0098', tecnico: 'Bruno Teixeira', prio: 'alta', status: 'concluido', aberta: '12/06 · 09:00', contrato: 'CT-118 · Premium', sla: '4h', slaRest: 'Cumprido',
    problema: 'Painel elétrico sem energia — disjuntor queimado.',
    maoObra: [{ desc: 'Substituição de disjuntor', horas: 1.5, valorHora: 120 }], pecas: [{ nome: 'Disjuntor 32A', sku: '5.40.0011', qtd: 1, valor: 95 }, { nome: 'Cabo Flexível 2,5mm', sku: '5.20.0099', qtd: 10, valor: 3.2 }], desloc: [{ desc: 'Deslocamento 40 km', valor: 80 }],
    laudo: 'Disjuntor principal em curto. Substituído por modelo 32A. Sistema testado, operando normalmente. Recomenda-se revisão do aterramento na próxima preventiva.', checklist: [] },
  { id: 'OA-2035', tipo: 'instalacao', cliente: '3 Amores', cidade: 'Maringá - PR', equip: 'Classificadora CL-9', serie: 'CL9-0041', tecnico: 'Carlos Moura', prio: 'media', status: 'faturado', aberta: '11/06 · 14:20', contrato: 'Avulso', sla: '—', slaRest: 'Faturado',
    problema: 'Instalação e comissionamento de classificadora nova.',
    maoObra: [{ desc: 'Instalação + treinamento', horas: 6, valorHora: 120 }], pecas: [], desloc: [{ desc: 'Deslocamento 120 km', valor: 240 }],
    laudo: 'Equipamento instalado e comissionado. Operadores treinados. Cliente assinou termo de aceite.', checklist: [] },
];
const AT_CONTRATOS_SEED = [
  { id: 'CT-118', cliente: 'Granja São José', tipo: 'Premium', sla: '4h', cobertura: 'Mão de obra + peças + deslocamento', equip: 3, prev: 'Trimestral', venc: '12/2025', ativo: true },
  { id: 'CT-092', cliente: 'Mantiqueira Céu Azul', tipo: 'Anual', sla: '8h', cobertura: 'Mão de obra + deslocamento', equip: 2, prev: 'Trimestral', venc: '08/2025', ativo: true },
  { id: 'CT-076', cliente: 'Granja Paraíso', tipo: 'Premium', sla: '4h', cobertura: 'Mão de obra + peças', equip: 1, prev: 'Mensal', venc: '03/2025', ativo: false },
  { id: 'CT-101', cliente: 'Avine', tipo: 'Básico', sla: '24h', cobertura: 'Mão de obra', equip: 2, prev: 'Semestral', venc: '10/2025', ativo: true },
];
const AT_EQUIP_SEED = [
  { id: 'EV200-0143', modelo: 'Embaladora de Ovos EV-200', cliente: 'Granja São José', instal: '03/2023', garantia: true, ultima: '14/06', os: 6, estado: 'campo', hist: [['14/06', 'OA-2041 · Corretiva — troca de sensor'], ['02/03', 'Preventiva trimestral'], ['11/2023', 'Instalação']] },
  { id: 'CL9-0067', modelo: 'Classificadora CL-9', cliente: 'Mantiqueira Céu Azul', instal: '08/2022', garantia: true, ultima: '02/06', os: 3, estado: 'ok', hist: [['02/06', 'Preventiva trimestral'], ['10/03', 'Corretiva — célula de carga']] },
  { id: 'ET4-0210', modelo: 'Esteira Transportadora ET-4', cliente: 'Ovos da Nonna', instal: '11/2021', garantia: false, ultima: '20/05', os: 9, estado: 'alerta', hist: [['20/05', 'Corretiva — motoredutor'], ['14/02', 'Corretiva — esteira'], ['09/2021', 'Instalação']] },
  { id: 'EV200-0098', modelo: 'Embaladora de Ovos EV-200', cliente: 'Granja Paraíso', instal: '01/2024', garantia: true, ultima: '12/06', os: 2, estado: 'ok', hist: [['12/06', 'OA-2037 · Corretiva — disjuntor'], ['01/2024', 'Instalação']] },
];
const AT_TEC_SEED = [
  { nome: 'Carlos Moura', regiao: 'Paraná', tel: '(41) 99812-3344', concl: 38 },
  { nome: 'Rafael Souza', regiao: 'Minas Gerais', tel: '(35) 99701-2210', concl: 27 },
  { nome: 'Bruno Teixeira', regiao: 'Paraná', tel: '(41) 99655-8090', concl: 41 },
  { nome: 'Júlia Ramos', regiao: 'São Paulo', tel: '(14) 99230-1187', concl: 19 },
];

// ---------- UI helpers ----------
function ATStepper({ t, status, compact }) {
  const idx = AT_STAGE[status] ? AT_STAGE[status].idx : 0;
  return (
    <div style={{ display: 'flex', alignItems: compact ? 'center' : 'flex-start', gap: 0, overflowX: 'auto' }} className="fr-scroll">
      {AT_PIPE.map((s, i) => {
        const done = i < idx, cur = i === idx, on = done || cur;
        const col = cur ? t.accent : done ? uiTone(t, 'green').fg : t.border;
        const sz = compact ? 26 : 34;
        return (
          <React.Fragment key={s.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <span style={{ width: sz, height: sz, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, background: on ? col : t.elevated, color: on ? '#fff' : t.faint, border: on ? 'none' : `2px solid ${t.border}`, boxShadow: cur ? `0 0 0 4px ${frHexToRgba(t.accent, 0.16)}` : 'none' }}>
                <Icon name={done ? 'check' : s.icon} size={compact ? 13 : 16} />
              </span>
              {!compact && <span style={{ fontSize: 9.5, fontWeight: cur ? 800 : 600, color: on ? t.text : t.faint, whiteSpace: 'nowrap' }}>{s.label}</span>}
            </div>
            {i < AT_PIPE.length - 1 && <div style={{ flex: 1, height: 3, minWidth: compact ? 12 : 18, borderRadius: 3, background: i < idx ? uiTone(t, 'green').fg : t.border, margin: compact ? '0 3px' : '0 4px', marginTop: compact ? 0 : sz / 2 - 1.5 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
const atField = (t) => ({ boxSizing: 'border-box', height: 42, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', width: '100%' });
const atLab = (t) => ({ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 });
function ATModal({ t, title, sub, icon, onClose, children, footer, w = 560 }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: `min(${w}px,96vw)`, maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={icon} size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{title}</div>{sub && <div style={{ fontSize: 12.5, color: t.muted }}>{sub}</div>}</div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Painel ----------
function ATPainel({ t, os, contratos, setActive }) {
  const go = (id) => setActive && setActive(id);
  const dark = t.panel !== '#ffffff';
  const abertos = os.filter((o) => o.status === 'aberto').length;
  const campo = os.filter((o) => o.status === 'atendimento' || o.status === 'deslocamento').length;
  const agendados = os.filter((o) => o.status === 'agendado').length;
  const slaRisco = os.filter((o) => o.status !== 'concluido' && o.status !== 'faturado' && o.prio === 'alta').length;
  const meses = [{ label: 'Jan', v: 48 }, { label: 'Fev', v: 60, accent: true }, { label: 'Mar', v: 52 }, { label: 'Abr', v: 71, accent: true }, { label: 'Mai', v: 64 }, { label: 'Jun', v: 82, accent: true }];
  return (
    <div>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '30px 32px', marginBottom: 24, background: `linear-gradient(120deg, ${dark ? '#0a3d39' : '#0b504a'} 0%, ${t.accent} 135%)`, color: '#fff' }}>
        <Icon name="wrench" size={185} style={{ position: 'absolute', right: -30, top: -34, opacity: 0.1 }} />
        <div style={{ position: 'relative', maxWidth: 640 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,.18)', marginBottom: 16 }}><Icon name="wrench" size={13} /> Field Service</div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 850, letterSpacing: '-.02em', lineHeight: 1.1 }}>Atendimento & Manutenção</h1>
          <p style={{ margin: '8px 0 18px', fontSize: 14, color: 'rgba(255,255,255,.88)', lineHeight: 1.5 }}><b>{campo} em campo</b>, <b>{agendados} agendado{agendados === 1 ? '' : 's'}</b> e <b>{abertos} aguardando triagem</b>.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => go('at-os')} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: '#fff', color: t.accent, boxShadow: '0 6px 16px rgba(0,0,0,.2)' }}><Icon name="clipboard" size={16} /> Atendimentos</button>
            <button onClick={() => go('at-agenda')} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, background: 'rgba(255,255,255,.16)', color: '#fff' }}><Icon name="calendar" size={16} /> Agenda Técnica</button>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <KPI t={t} mini icon="file" label="Aguardando triagem" value={abertos} kind="blue" />
        <KPI t={t} mini icon="wrench" label="Em campo" value={campo} kind="accent" />
        <KPI t={t} mini icon="calendar" label="Agendados" value={agendados} kind="amber" />
        <KPI t={t} mini icon="alert" label="SLA em risco" value={slaRisco} kind="red" />
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <Card t={t} style={{ padding: 22, flex: 2, minWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Atendimentos por mês</div>
            <Badge t={t} kind="green" dot>SLA cumprido 94%</Badge>
          </div>
          <BarChart t={t} data={meses} />
        </Card>
        <Card t={t} style={{ padding: 22, flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 16 }}>Contratos ativos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {contratos.filter((c) => c.ativo).map((c) => (
              <button key={c.id} onClick={() => go('at-contratos')} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 8px', borderRadius: 10 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="file" size={15} /></span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.cliente}</div><div style={{ fontSize: 11, color: t.muted }}>{c.id} · SLA {c.sla}</div></div>
                <Badge t={t} kind="gray">{c.tipo}</Badge>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- Novo atendimento ----------
function ATNovaOS({ t, tec, onClose, onCreate }) {
  const [f, setF] = useStateAT({ cliente: '', cidade: '', tipo: 'corretiva', prio: 'media', equip: '', serie: '', contrato: 'Avulso', tecnico: '', problema: '' });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const valid = f.cliente.trim() && f.equip.trim() && f.problema.trim();
  return (
    <ATModal t={t} title="Abrir atendimento" sub="Nova ordem de atendimento (OA)." icon="clipboard" onClose={onClose} w={600}
      footer={<><Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
        <button onClick={() => valid && onCreate(f)} disabled={!valid} style={{ all: 'unset', cursor: valid ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 22px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: valid ? t.accent : t.elevated, color: valid ? t.onAccent : t.faint }}><Icon name="check" size={17} /> Abrir OA</button></>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1/-1' }}><label style={atLab(t)}>Cliente</label><input value={f.cliente} onChange={(e) => set('cliente', e.target.value)} placeholder="Ex: Granja São José" style={atField(t)} /></div>
        <div><label style={atLab(t)}>Cidade / UF</label><input value={f.cidade} onChange={(e) => set('cidade', e.target.value)} placeholder="Castro - PR" style={atField(t)} /></div>
        <div><label style={atLab(t)}>Contrato</label><input value={f.contrato} onChange={(e) => set('contrato', e.target.value)} placeholder="Avulso ou CT-000" style={atField(t)} /></div>
        <div>
          <label style={atLab(t)}>Tipo</label>
          <div style={{ display: 'flex', gap: 6 }}>{Object.entries(AT_TIPO).map(([k, v]) => { const on = f.tipo === k; return <button key={k} onClick={() => set('tipo', k)} style={{ all: 'unset', cursor: 'pointer', flex: 1, textAlign: 'center', height: 40, lineHeight: '40px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: on ? uiTone(t, v.kind).bg : t.elevated, color: on ? uiTone(t, v.kind).fg : t.muted, border: `1px solid ${on ? uiTone(t, v.kind).fg : t.border}` }}>{v.label}</button>; })}</div>
        </div>
        <div>
          <label style={atLab(t)}>Prioridade</label>
          <div style={{ display: 'flex', gap: 6 }}>{Object.entries(AT_PRIO).map(([k, v]) => { const on = f.prio === k; return <button key={k} onClick={() => set('prio', k)} style={{ all: 'unset', cursor: 'pointer', flex: 1, textAlign: 'center', height: 40, lineHeight: '40px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: on ? uiTone(t, v[1]).bg : t.elevated, color: on ? uiTone(t, v[1]).fg : t.muted, border: `1px solid ${on ? uiTone(t, v[1]).fg : t.border}` }}>{v[0]}</button>; })}</div>
        </div>
        <div><label style={atLab(t)}>Equipamento</label><input value={f.equip} onChange={(e) => set('equip', e.target.value)} placeholder="Embaladora EV-200" style={atField(t)} /></div>
        <div><label style={atLab(t)}>Nº de série</label><input value={f.serie} onChange={(e) => set('serie', e.target.value)} placeholder="EV200-0000" style={atField(t)} /></div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={atLab(t)}>Técnico (opcional)</label>
          <div style={{ position: 'relative' }}>
            <select value={f.tecnico} onChange={(e) => set('tecnico', e.target.value)} style={{ ...atField(t), appearance: 'none', WebkitAppearance: 'none', paddingRight: 34, cursor: 'pointer' }}>
              <option value="">Atribuir depois</option>
              {tec.map((x) => <option key={x.nome} value={x.nome}>{x.nome} · {x.regiao}</option>)}
            </select>
            <Icon name="chevronDown" size={16} style={{ position: 'absolute', right: 12, top: 14, color: t.muted, pointerEvents: 'none' }} />
          </div>
        </div>
        <div style={{ gridColumn: '1/-1' }}><label style={atLab(t)}>Problema relatado</label><textarea value={f.problema} onChange={(e) => set('problema', e.target.value)} rows={3} placeholder="Descreva o defeito ou serviço solicitado…" style={{ ...atField(t), height: 'auto', padding: '12px 14px', resize: 'vertical', lineHeight: 1.5 }} /></div>
      </div>
    </ATModal>
  );
}

// ---------- Atendimentos ----------
function ATOrdens({ t, os, tec, updateOs, openId, setOpenId, flash, onNova }) {
  const [filtro, setFiltro] = useStateAT('abertos');
  const [tipoF, setTipoF] = useStateAT('todos');
  const [q, setQ] = useStateAT('');
  const grupos = { abertos: ['aberto', 'agendado', 'deslocamento', 'atendimento'], concluidos: ['concluido', 'faturado'], todas: null };
  const tabs = [['abertos', 'Em aberto'], ['concluidos', 'Concluídos'], ['todas', 'Todos']];
  const ql = q.trim().toLowerCase();
  const view = os.filter((o) => {
    const g = grupos[filtro]; const go = !g || g.includes(o.status);
    const tf = tipoF === 'todos' || o.tipo === tipoF;
    const m = !ql || o.cliente.toLowerCase().includes(ql) || o.id.toLowerCase().includes(ql) || o.equip.toLowerCase().includes(ql) || (o.tecnico || '').toLowerCase().includes(ql);
    return go && tf && m;
  });
  const cur = os.find((o) => o.id === openId);
  return (
    <div>
      <PageHeader t={t} title="Atendimentos" subtitle="Ordens de atendimento — corretiva, preventiva e instalação."
        actions={<Btn t={t} icon="plus" onClick={onNova}>Abrir atendimento</Btn>} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 13, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, marginBottom: 16 }}>
        <Icon name="search" size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente, OA, equipamento ou técnico…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tabs.map(([k, label]) => { const on = filtro === k; return <button key={k} onClick={() => setFiltro(k)} style={{ all: 'unset', cursor: 'pointer', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: on ? t.accent : t.panel, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>{label}</button>; })}
        </div>
        <div style={{ width: 1, height: 24, background: t.border }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['todos', 'Todos os tipos'], ['corretiva', 'Corretiva'], ['preventiva', 'Preventiva'], ['instalacao', 'Instalação']].map(([k, label]) => { const on = tipoF === k; return <button key={k} onClick={() => setTipoF(k)} style={{ all: 'unset', cursor: 'pointer', padding: '7px 12px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: on ? t.accentSoft : 'transparent', color: on ? t.accentText : t.muted, border: `1px solid ${on ? frHexToRgba(t.accent, 0.4) : t.border}` }}>{label}</button>; })}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhum atendimento" sub="Ajuste os filtros ou abra um novo atendimento." /></Card></div>}
        {view.map((o) => { const sk = uiTone(t, AT_STAGE_KIND[o.status]); const tp = AT_TIPO[o.tipo]; const pr = AT_PRIO[o.prio]; const risco = o.prio === 'alta' && o.status !== 'concluido' && o.status !== 'faturado'; return (
          <Card t={t} key={o.id} hover style={{ padding: 16, cursor: 'pointer' }}>
            <div onClick={() => setOpenId(o.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', padding: '5px 10px', borderRadius: 8, background: uiTone(t, tp.kind).bg, color: uiTone(t, tp.kind).fg }}><Icon name={tp.icon} size={13} /> {tp.label}</span>
                <Badge t={t} kind={pr[1]} dot>{pr[0]}</Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '13px 0 3px' }}><span style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 700, color: t.accentText }}>{o.id}</span><span style={{ fontSize: 11, color: t.faint }}>· {o.aberta}</span></div>
              <div style={{ fontSize: 16, fontWeight: 850, color: t.text, letterSpacing: '-.01em' }}>{o.cliente}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.muted, marginTop: 4 }}><Icon name="cpu" size={13} /> {o.equip}</div>
              <div style={{ margin: '14px 0 4px' }}><ATStepper t={t} status={o.status} compact /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 13, borderTop: `1px solid ${t.border}` }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: t.muted }}>{o.tecnico ? <><span style={{ width: 22, height: 22, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 9 }}>{atInit(o.tecnico)}</span> {o.tecnico}</> : <span style={{ color: t.faint, fontStyle: 'italic' }}>Sem técnico</span>}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 7, background: risco ? uiTone(t, 'red').bg : sk.bg, color: risco ? uiTone(t, 'red').fg : sk.fg }}><Icon name="clock" size={12} /> {o.slaRest}</span>
            </div>
          </Card>
        ); })}
      </div>
      {cur && <ATOsDetail t={t} os={cur} tec={tec} updateOs={updateOs} flash={flash} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function ATApontaForm({ t, kind, onAdd }) {
  const [v, setV] = useStateAT(kind === 'mao' ? { desc: '', horas: '', valorHora: '120' } : kind === 'peca' ? { nome: '', sku: '', qtd: '1', valor: '' } : { desc: '', valor: '' });
  const set = (k, x) => setV((s) => ({ ...s, [k]: x }));
  const mini = { boxSizing: 'border-box', height: 38, borderRadius: 9, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' };
  const ok = kind === 'mao' ? (v.desc.trim() && +v.horas > 0) : kind === 'peca' ? (v.nome.trim() && +v.qtd > 0 && +v.valor >= 0) : (v.desc.trim() && +v.valor > 0);
  const add = () => { if (!ok) return; if (kind === 'mao') onAdd({ desc: v.desc.trim(), horas: +v.horas, valorHora: +v.valorHora || 0 }); else if (kind === 'peca') onAdd({ nome: v.nome.trim(), sku: v.sku.trim(), qtd: +v.qtd, valor: +v.valor }); else onAdd({ desc: v.desc.trim(), valor: +v.valor }); setV(kind === 'mao' ? { desc: '', horas: '', valorHora: '120' } : kind === 'peca' ? { nome: '', sku: '', qtd: '1', valor: '' } : { desc: '', valor: '' }); };
  return (
    <div style={{ display: 'flex', gap: 7, marginTop: 8, flexWrap: 'wrap' }}>
      {kind === 'mao' && <><input value={v.desc} onChange={(e) => set('desc', e.target.value)} placeholder="Serviço" style={{ ...mini, flex: 2, minWidth: 120 }} /><input value={v.horas} onChange={(e) => set('horas', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="h" style={{ ...mini, width: 52, textAlign: 'center' }} /><input value={v.valorHora} onChange={(e) => set('valorHora', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="R$/h" style={{ ...mini, width: 64, textAlign: 'center' }} /></>}
      {kind === 'peca' && <><input value={v.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Peça" style={{ ...mini, flex: 2, minWidth: 110 }} /><input value={v.sku} onChange={(e) => set('sku', e.target.value)} placeholder="SKU" style={{ ...mini, width: 80 }} /><input value={v.qtd} onChange={(e) => set('qtd', e.target.value.replace(/[^0-9]/g, ''))} placeholder="qtd" style={{ ...mini, width: 48, textAlign: 'center' }} /><input value={v.valor} onChange={(e) => set('valor', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="R$ un" style={{ ...mini, width: 64, textAlign: 'center' }} /></>}
      {kind === 'desloc' && <><input value={v.desc} onChange={(e) => set('desc', e.target.value)} placeholder="Descrição" style={{ ...mini, flex: 2, minWidth: 120 }} /><input value={v.valor} onChange={(e) => set('valor', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="R$" style={{ ...mini, width: 70, textAlign: 'center' }} /></>}
      <button onClick={add} disabled={!ok} style={{ all: 'unset', cursor: ok ? 'pointer' : 'not-allowed', display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 9, background: ok ? t.accent : t.elevated, color: ok ? t.onAccent : t.faint, flexShrink: 0 }}><Icon name="plus" size={16} /></button>
    </div>
  );
}

function ATOsDetail({ t, os, tec, updateOs, flash, onClose }) {
  const [tab, setTab] = useStateAT('resumo');
  const [laudo, setLaudo] = useStateAT(os.laudo);
  const [assign, setAssign] = useStateAT(false);
  const tp = AT_TIPO[os.tipo]; const pr = AT_PRIO[os.prio];
  const dark = t.panel !== '#ffffff';
  const totMO = os.maoObra.reduce((a, m) => a + m.horas * m.valorHora, 0);
  const totPec = os.pecas.reduce((a, p) => a + p.qtd * p.valor, 0);
  const totDes = os.desloc.reduce((a, d) => a + d.valor, 0);
  const total = totMO + totPec + totDes;
  const tabBtn = (k, label, icon) => { const on = tab === k; return <button onClick={() => setTab(k)} style={{ all: 'unset', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 40, borderRadius: 10, fontSize: 12.5, fontWeight: 800, background: on ? t.accent : t.elevated, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}><Icon name={icon} size={15} /> {label}</button>; };
  const rowKV = (label, val, bold) => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0' }}><span style={{ fontSize: 12.5, color: t.muted }}>{label}</span><span style={{ fontSize: bold ? 15 : 13.5, fontWeight: bold ? 850 : 700, color: t.text }}>{val}</span></div>;
  const nextLabel = AT_NEXT_LABEL[os.status];
  const advance = () => { const nx = AT_NEXT[os.status]; if (!nx) return; updateOs(os.id, { status: nx, slaRest: nx === 'concluido' ? 'Cumprido' : nx === 'faturado' ? 'Faturado' : os.slaRest }); flash(nx === 'faturado' ? 'Atendimento faturado · ' + fmtAT(total) : 'Status: ' + AT_STAGE[nx].label); };
  const addApont = (cat, item) => { updateOs(os.id, (o) => ({ ...o, [cat]: [...o[cat], item] })); flash('Apontamento adicionado'); };
  const delApont = (cat, i) => updateOs(os.id, (o) => ({ ...o, [cat]: o[cat].filter((_, j) => j !== i) }));
  const toggleChk = (i) => updateOs(os.id, (o) => ({ ...o, checklist: o.checklist.map((c, j) => (j === i ? { ...c, ok: !c.ok } : c)) }));
  const apontTab = (titulo, cat, ic, mapper, formKind) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 8 }}><Icon name={ic} size={13} /> {titulo}</div>
      {os[cat].length === 0 ? <div style={{ fontSize: 12.5, color: t.faint, padding: '2px 2px' }}>Nenhum apontamento.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {os[cat].map((l, i) => { const m = mapper(l); return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{m.nome}</div>{m.det && <div style={{ fontSize: 11, color: t.muted }}>{m.det}</div>}</div>
              <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{fmtAT(m.val)}</span>
              <button onClick={() => delApont(cat, i)} style={{ all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={14} /></button>
            </div>
          ); })}
        </div>
      )}
      {os.status !== 'faturado' && <ATApontaForm t={t} kind={formKind} onAdd={(it) => addApont(cat, it)} />}
    </div>
  );
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(700px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ position: 'relative', padding: '22px 24px', background: `linear-gradient(135deg, ${dark ? '#0a3d39' : '#0b504a'}, ${t.accent})`, color: '#fff' }}>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 16, right: 18, width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.18)', color: '#fff' }}><Icon name="x" size={16} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '4px 11px', borderRadius: 999, background: 'rgba(255,255,255,.2)' }}><Icon name={tp.icon} size={13} /> {tp.label}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{os.id}</span>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,.8)' }}>· {os.contrato}</span>
          </div>
          <div style={{ fontSize: 21, fontWeight: 850 }}>{os.cliente}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'rgba(255,255,255,.85)', marginTop: 5 }}><Icon name="mapPin" size={14} /> {os.cidade} · Aberta em {os.aberta}</div>
        </div>
        <div style={{ padding: '18px 24px 0' }}><ATStepper t={t} status={os.status} /></div>
        <div style={{ display: 'flex', gap: 8, padding: '18px 24px 14px', flexWrap: 'wrap' }}>
          {tabBtn('resumo', 'Resumo', 'file')}
          {tabBtn('aponta', 'Apontamentos', 'clipboard')}
          {os.checklist.length > 0 && tabBtn('check', 'Checklist', 'check')}
          {tabBtn('laudo', 'Laudo', 'pencil')}
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '0 24px 22px', flex: 1 }}>
          {tab === 'resumo' && (<>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <Badge t={t} kind={pr[1]} dot>Prioridade {pr[0]}</Badge>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 8, background: t.elevated, color: t.text, border: `1px solid ${t.border}` }}><Icon name="clock" size={13} /> SLA {os.sla} · {os.slaRest}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: t.elevated, border: `1px solid ${t.border}`, marginBottom: 16 }}>
              <span style={{ width: 42, height: 42, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="cpu" size={20} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{os.equip}</div><div style={{ fontSize: 11.5, color: t.muted }}>Série {os.serie}</div></div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 8 }}>Problema relatado</div>
            <p style={{ margin: '0 0 16px', fontSize: 13.5, color: t.text, lineHeight: 1.55 }}>{os.problema}</p>
            <div style={{ padding: '12px 16px', borderRadius: 14, background: t.elevated, border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon name="users" size={17} style={{ color: t.muted }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase' }}>Técnico</span>
                <span style={{ marginLeft: 'auto' }}>{os.tecnico ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 26, height: 26, borderRadius: '50%', background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 10 }}>{atInit(os.tecnico)}</span><span style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{os.tecnico}</span></span> : <span style={{ fontSize: 12.5, color: t.faint, fontStyle: 'italic' }}>Não atribuído</span>}</span>
                {os.status !== 'faturado' && <button onClick={() => setAssign((a) => !a)} style={{ all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: t.accentText, padding: '4px 8px', borderRadius: 7, border: `1px solid ${t.border}` }}>{os.tecnico ? 'Trocar' : 'Atribuir'}</button>}
              </div>
              {assign && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
                  {tec.map((x) => <button key={x.nome} onClick={() => { updateOs(os.id, { tecnico: x.nome, status: os.status === 'aberto' ? 'agendado' : os.status }); setAssign(false); flash('Técnico ' + x.nome + ' atribuído'); }} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: t.panel, border: `1px solid ${t.border}`, color: t.text }}><span style={{ width: 22, height: 22, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 9 }}>{atInit(x.nome)}</span>{x.nome}</button>)}
                </div>
              )}
            </div>
          </>)}

          {tab === 'aponta' && (<>
            {apontTab('Mão de obra', 'maoObra', 'wrench', (m) => ({ nome: m.desc, det: `${m.horas}h × ${fmtAT(m.valorHora)}`, val: m.horas * m.valorHora }), 'mao')}
            {apontTab('Peças', 'pecas', 'box', (p) => ({ nome: p.nome, det: `${p.qtd} × ${fmtAT(p.valor)}${p.sku ? ' · SKU ' + p.sku : ''}`, val: p.qtd * p.valor }), 'peca')}
            {apontTab('Deslocamento', 'desloc', 'truck', (d) => ({ nome: d.desc, det: '', val: d.valor }), 'desloc')}
            <div style={{ padding: '14px 16px', borderRadius: 14, background: t.accentSoft, border: `1px solid ${frHexToRgba(t.accent, 0.25)}` }}>
              {rowKV('Mão de obra', fmtAT(totMO))}{rowKV('Peças', fmtAT(totPec))}{rowKV('Deslocamento', fmtAT(totDes))}
              <div style={{ height: 1, background: frHexToRgba(t.accent, 0.2), margin: '6px 0' }} />
              {rowKV('Total do atendimento', fmtAT(total), true)}
            </div>
          </>)}

          {tab === 'check' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {os.checklist.map((c, i) => (
                <button key={i} onClick={() => toggleChk(i)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: c.ok ? uiTone(t, 'green').bg : t.elevated, border: `1px solid ${c.ok ? frHexToRgba('#10b981', 0.3) : t.border}` }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', flexShrink: 0, background: c.ok ? uiTone(t, 'green').fg : 'transparent', color: '#fff', border: c.ok ? 'none' : `2px solid ${t.borderStrong}` }}>{c.ok && <Icon name="check" size={14} />}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: t.text, textDecoration: c.ok ? 'line-through' : 'none', opacity: c.ok ? 0.7 : 1 }}>{c.t}</span>
                </button>
              ))}
              <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{os.checklist.filter((c) => c.ok).length}/{os.checklist.length} concluídos</div>
            </div>
          )}

          {tab === 'laudo' && (<>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 10 }}>Laudo técnico</div>
            <textarea value={laudo} onChange={(e) => setLaudo(e.target.value)} rows={7} placeholder="Descreva o diagnóstico, serviço executado e recomendações…" style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '12px 14px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: t.muted, padding: '9px 12px', borderRadius: 10, border: `1px dashed ${t.borderStrong}`, cursor: 'pointer' }} onClick={() => flash('Foto anexada ao laudo')}><Icon name="upload" size={16} /> Anexar foto</div>
              <button onClick={() => { updateOs(os.id, { laudo }); flash('Laudo salvo'); }} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, background: t.accent, color: t.onAccent }}><Icon name="check" size={16} /> Salvar laudo</button>
            </div>
          </>)}
        </div>

        {nextLabel && (
          <div style={{ display: 'flex', gap: 10, padding: '14px 24px', borderTop: `1px solid ${t.border}` }}>
            {os.status === 'agendado' && <Btn t={t} kind="ghost" icon="calendar" onClick={() => flash('Visita reagendada')}>Reagendar</Btn>}
            <button onClick={advance} style={{ all: 'unset', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, height: 46, borderRadius: 13, fontSize: 14, fontWeight: 800, background: t.accent, color: t.onAccent, boxShadow: `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` }}><Icon name={os.status === 'concluido' ? 'barChart' : 'check'} size={18} /> {nextLabel}{os.status === 'concluido' ? ' · ' + fmtAT(total) : ''}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Agenda Técnica ----------
function ATAgenda({ t, os, tec, flash }) {
  const stKind = { agendado: 'amber', deslocamento: 'amber', atendimento: 'accent' };
  const byTec = (nome) => os.filter((o) => o.tecnico === nome && (o.status === 'agendado' || o.status === 'deslocamento' || o.status === 'atendimento'));
  return (
    <div>
      <PageHeader t={t} title="Agenda Técnica" subtitle="Quadro de despacho — atendimentos ativos por técnico."
        actions={<Btn t={t} icon="plus" onClick={() => flash('Use “Abrir atendimento” para agendar uma visita')}>Agendar visita</Btn>} />
      <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }} className="fr-scroll">
          <div style={{ minWidth: 680 }}>
            {tec.map((x, ti) => { const ag = byTec(x.nome); const free = ag.length === 0; return (
              <div key={x.nome} style={{ display: 'flex', borderTop: ti === 0 ? 'none' : `1px solid ${t.border}` }}>
                <div style={{ width: 190, flexShrink: 0, padding: '16px', borderRight: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ width: 38, height: 38, borderRadius: '50%', background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 13 }}>{atInit(x.nome)}</span>
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: uiTone(t, free ? 'green' : 'accent').fg, border: `2px solid ${t.panel}` }} />
                  </div>
                  <div style={{ minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.nome}</div><div style={{ fontSize: 11, color: t.muted }}>{x.regiao}</div></div>
                </div>
                <div style={{ flex: 1, padding: '14px 12px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', minHeight: 70 }}>
                  {free ? <span style={{ fontSize: 12.5, color: t.faint, fontStyle: 'italic' }}>Sem visitas · disponível</span> : ag.map((o) => { const c = uiTone(t, stKind[o.status] || 'gray'); return (
                    <div key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '9px 13px', borderRadius: 11, background: c.bg, border: `1px solid ${frHexToRgba(c.fg, 0.3)}`, minWidth: 180 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: c.fg }}><Icon name={AT_STAGE[o.status].icon} size={12} /> {o.id} · {AT_STAGE[o.status].label}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: t.text }}>{o.cliente}</div>
                      <div style={{ fontSize: 11, color: t.muted }}>{o.cidade}</div>
                    </div>
                  ); })}
                </div>
              </div>
            ); })}
          </div>
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
        {[['amber', 'Agendado / Deslocamento'], ['accent', 'Em atendimento'], ['green', 'Disponível']].map(([k, l]) => <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: t.muted }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: uiTone(t, k).fg }} /> {l}</span>)}
      </div>
    </div>
  );
}

// ---------- Contratos ----------
function ATContratos({ t, contratos, setContratos, flash }) {
  const [q, setQ] = useStateAT('');
  const [nova, setNova] = useStateAT(false);
  const [f, setF] = useStateAT({ cliente: '', tipo: 'Premium', sla: '4h', cobertura: 'Mão de obra + peças + deslocamento', equip: '1', prev: 'Trimestral', venc: '12/2026' });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const ql = q.trim().toLowerCase();
  const view = contratos.filter((c) => !ql || c.cliente.toLowerCase().includes(ql) || c.id.toLowerCase().includes(ql));
  const criar = () => { if (!f.cliente.trim()) return; const n = 'CT-' + (120 + contratos.length); setContratos((xs) => [{ id: n, cliente: f.cliente.trim(), tipo: f.tipo, sla: f.sla, cobertura: f.cobertura, equip: +f.equip || 1, prev: f.prev, venc: f.venc, ativo: true }, ...xs]); setNova(false); setF({ cliente: '', tipo: 'Premium', sla: '4h', cobertura: 'Mão de obra + peças + deslocamento', equip: '1', prev: 'Trimestral', venc: '12/2026' }); flash('Contrato ' + n + ' criado'); };
  const gerarPrev = (c) => flash('OA preventiva gerada para ' + c.cliente);
  return (
    <div>
      <PageHeader t={t} title="Contratos & SLA" subtitle="Contratos de manutenção, cobertura e nível de serviço."
        actions={<Btn t={t} icon="plus" onClick={() => setNova(true)}>Novo contrato</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="file" label="Contratos ativos" value={contratos.filter((c) => c.ativo).length} kind="accent" />
        <KPI t={t} mini icon="cpu" label="Equip. cobertos" value={contratos.reduce((a, c) => a + c.equip, 0)} kind="blue" />
        <KPI t={t} mini icon="alert" label="A vencer" value={contratos.filter((c) => !c.ativo).length} kind="amber" />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 16px', borderRadius: 13, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text', marginBottom: 20 }}>
        <Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente ou nº do contrato…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {view.map((c) => (
          <Card t={t} key={c.id} hover style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 700, color: t.accentText }}>{c.id}</span><Badge t={t} kind={c.tipo === 'Premium' ? 'accent' : c.tipo === 'Anual' ? 'blue' : 'gray'}>{c.tipo}</Badge></div><div style={{ fontSize: 16, fontWeight: 850, color: t.text, marginTop: 8 }}>{c.cliente}</div></div>
              <Badge t={t} kind={c.ativo ? 'green' : 'red'} dot>{c.ativo ? 'Ativo' : 'A vencer'}</Badge>
            </div>
            <div style={{ fontSize: 12.5, color: t.muted, margin: '12px 0 14px', lineHeight: 1.5 }}>{c.cobertura}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[['SLA', c.sla], ['Equip.', c.equip], ['Prev.', c.prev]].map(([l, v]) => <div key={l} style={{ padding: '10px 8px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}`, textAlign: 'center' }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.04em', color: t.faint }}>{l.toUpperCase()}</div><div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginTop: 3 }}>{v}</div></div>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: t.muted }}><Icon name="calendar" size={13} /> Até {c.venc}</span>
              <button onClick={() => gerarPrev(c)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: t.accentText, padding: '5px 10px', borderRadius: 8, border: `1px solid ${t.border}` }}><Icon name="shield" size={13} /> Gerar preventiva</button>
            </div>
          </Card>
        ))}
      </div>
      {nova && (
        <ATModal t={t} title="Novo contrato" sub="Contrato de manutenção & SLA." icon="file" onClose={() => setNova(false)}
          footer={<><Btn t={t} kind="ghost" onClick={() => setNova(false)}>Cancelar</Btn><button onClick={criar} disabled={!f.cliente.trim()} style={{ all: 'unset', cursor: f.cliente.trim() ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 22px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: f.cliente.trim() ? t.accent : t.elevated, color: f.cliente.trim() ? t.onAccent : t.faint }}><Icon name="check" size={17} /> Criar contrato</button></>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={atLab(t)}>Cliente</label><input value={f.cliente} onChange={(e) => set('cliente', e.target.value)} placeholder="Nome do cliente" style={atField(t)} /></div>
            <div><label style={atLab(t)}>Tipo</label><div style={{ position: 'relative' }}><select value={f.tipo} onChange={(e) => set('tipo', e.target.value)} style={{ ...atField(t), appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>{['Premium', 'Anual', 'Básico'].map((x) => <option key={x}>{x}</option>)}</select><Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 13, color: t.muted, pointerEvents: 'none' }} /></div></div>
            <div><label style={atLab(t)}>SLA</label><input value={f.sla} onChange={(e) => set('sla', e.target.value)} placeholder="4h" style={atField(t)} /></div>
            <div><label style={atLab(t)}>Equipamentos</label><input value={f.equip} onChange={(e) => set('equip', e.target.value.replace(/[^0-9]/g, ''))} placeholder="1" style={atField(t)} /></div>
            <div><label style={atLab(t)}>Preventiva</label><div style={{ position: 'relative' }}><select value={f.prev} onChange={(e) => set('prev', e.target.value)} style={{ ...atField(t), appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>{['Mensal', 'Trimestral', 'Semestral', 'Anual'].map((x) => <option key={x}>{x}</option>)}</select><Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 13, color: t.muted, pointerEvents: 'none' }} /></div></div>
            <div style={{ gridColumn: '1/-1' }}><label style={atLab(t)}>Cobertura</label><input value={f.cobertura} onChange={(e) => set('cobertura', e.target.value)} style={atField(t)} /></div>
            <div><label style={atLab(t)}>Vigência até</label><input value={f.venc} onChange={(e) => set('venc', e.target.value)} placeholder="12/2026" style={atField(t)} /></div>
          </div>
        </ATModal>
      )}
    </div>
  );
}

// ---------- Equipamentos ----------
function ATEquip({ t, equip, setEquip, flash }) {
  const [q, setQ] = useStateAT('');
  const [openId, setOpenId] = useStateAT(null);
  const [nova, setNova] = useStateAT(false);
  const [f, setF] = useStateAT({ modelo: '', id: '', cliente: '', instal: '' });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const ql = q.trim().toLowerCase();
  const estados = { ok: ['Operando', 'green'], alerta: ['Atenção', 'amber'], campo: ['Em atendimento', 'accent'] };
  const view = equip.filter((e) => !ql || e.modelo.toLowerCase().includes(ql) || e.cliente.toLowerCase().includes(ql) || e.id.toLowerCase().includes(ql));
  const cur = equip.find((e) => e.id === openId);
  const criar = () => { if (!f.modelo.trim() || !f.cliente.trim()) return; setEquip((xs) => [{ id: f.id.trim() || 'EQ-' + Date.now(), modelo: f.modelo.trim(), cliente: f.cliente.trim(), instal: f.instal.trim() || '—', garantia: true, ultima: '—', os: 0, estado: 'ok', hist: [[f.instal.trim() || '—', 'Instalação']] }, ...xs]); setNova(false); setF({ modelo: '', id: '', cliente: '', instal: '' }); flash('Equipamento cadastrado'); };
  return (
    <div>
      <PageHeader t={t} title="Equipamentos" subtitle="Base instalada e histórico técnico por equipamento."
        actions={<Btn t={t} icon="plus" onClick={() => setNova(true)}>Cadastrar equipamento</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="cpu" label="Equipamentos" value={equip.length} kind="accent" />
        <KPI t={t} mini icon="check" label="Em garantia" value={equip.filter((e) => e.garantia).length} kind="green" />
        <KPI t={t} mini icon="alert" label="Em atenção" value={equip.filter((e) => e.estado === 'alerta').length} kind="amber" />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 16px', borderRadius: 13, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text', marginBottom: 20 }}>
        <Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por modelo, cliente ou número de série…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {view.map((e) => { const es = estados[e.estado]; const c = uiTone(t, es[1]); return (
          <Card t={t} key={e.id} hover style={{ padding: 18, cursor: 'pointer' }}>
            <div onClick={() => setOpenId(e.id)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ width: 46, height: 46, borderRadius: 12, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="cpu" size={22} /></span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 850, color: t.text }}>{e.modelo}</div><div style={{ fontSize: 11.5, color: t.muted, fontFamily: 'monospace' }}>{e.id}</div></div>
                <span style={{ fontSize: 10.5, fontWeight: 800, padding: '4px 9px', borderRadius: 7, background: c.bg, color: c.fg }}>{es[0]}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: t.text, fontWeight: 600, margin: '14px 0 4px' }}><Icon name="building" size={14} style={{ color: t.muted }} /> {e.cliente}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 13, borderTop: `1px solid ${t.border}` }}>
                <div><div style={{ fontSize: 9.5, fontWeight: 700, color: t.faint }}>INSTALADO</div><div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, marginTop: 2 }}>{e.instal}</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9.5, fontWeight: 700, color: t.faint }}>ÚLT. MANUT.</div><div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, marginTop: 2 }}>{e.ultima}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9.5, fontWeight: 700, color: t.faint }}>OS</div><div style={{ fontSize: 12.5, fontWeight: 800, color: t.accentText, marginTop: 2 }}>{e.os}</div></div>
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {e.garantia ? <Badge t={t} kind="green" dot>Em garantia</Badge> : <Badge t={t} kind="gray">Fora de garantia</Badge>}
              <button onClick={() => setOpenId(e.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: t.accentText }}>Histórico <Icon name="chevronRight" size={14} /></button>
            </div>
          </Card>
        ); })}
      </div>
      {cur && (
        <ATModal t={t} title={cur.modelo} sub={`${cur.id} · ${cur.cliente}`} icon="cpu" onClose={() => setOpenId(null)} w={520}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 14 }}>Histórico técnico</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {cur.hist.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: i === 0 ? t.accent : t.border, flexShrink: 0, marginTop: 3 }} />
                  {i < cur.hist.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 28, background: t.border, margin: '3px 0' }} />}
                </div>
                <div style={{ paddingBottom: 18 }}><div style={{ fontSize: 11.5, fontWeight: 800, color: t.accentText }}>{h[0]}</div><div style={{ fontSize: 13, color: t.text, marginTop: 2 }}>{h[1]}</div></div>
              </div>
            ))}
          </div>
        </ATModal>
      )}
      {nova && (
        <ATModal t={t} title="Cadastrar equipamento" sub="Adicionar à base instalada." icon="cpu" onClose={() => setNova(false)} w={500}
          footer={<><Btn t={t} kind="ghost" onClick={() => setNova(false)}>Cancelar</Btn><button onClick={criar} disabled={!f.modelo.trim() || !f.cliente.trim()} style={{ all: 'unset', cursor: (f.modelo.trim() && f.cliente.trim()) ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 22px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: (f.modelo.trim() && f.cliente.trim()) ? t.accent : t.elevated, color: (f.modelo.trim() && f.cliente.trim()) ? t.onAccent : t.faint }}><Icon name="check" size={17} /> Cadastrar</button></>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={atLab(t)}>Modelo</label><input value={f.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="Embaladora EV-200" style={atField(t)} /></div>
            <div><label style={atLab(t)}>Nº de série</label><input value={f.id} onChange={(e) => set('id', e.target.value)} placeholder="EV200-0000" style={atField(t)} /></div>
            <div><label style={atLab(t)}>Instalação</label><input value={f.instal} onChange={(e) => set('instal', e.target.value)} placeholder="06/2025" style={atField(t)} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={atLab(t)}>Cliente</label><input value={f.cliente} onChange={(e) => set('cliente', e.target.value)} placeholder="Nome do cliente" style={atField(t)} /></div>
          </div>
        </ATModal>
      )}
    </div>
  );
}

// ---------- Técnicos ----------
function ATTecnicos({ t, os, tec, setTec, flash }) {
  const [nova, setNova] = useStateAT(false);
  const [f, setF] = useStateAT({ nome: '', regiao: '', tel: '' });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const ativaDe = (nome) => os.find((o) => o.tecnico === nome && (o.status === 'atendimento' || o.status === 'deslocamento'));
  const criar = () => { if (!f.nome.trim()) return; setTec((xs) => [...xs, { nome: f.nome.trim(), regiao: f.regiao.trim() || '—', tel: f.tel.trim() || '—', concl: 0 }]); setNova(false); setF({ nome: '', regiao: '', tel: '' }); flash('Técnico cadastrado'); };
  return (
    <div>
      <PageHeader t={t} title="Técnicos" subtitle="Equipe de campo da assistência técnica."
        actions={<Btn t={t} icon="plus" onClick={() => setNova(true)}>Novo técnico</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="users" label="Técnicos" value={tec.length} kind="accent" />
        <KPI t={t} mini icon="wrench" label="Em campo" value={tec.filter((x) => ativaDe(x.nome)).length} kind="amber" />
        <KPI t={t} mini icon="check" label="Disponíveis" value={tec.filter((x) => !ativaDe(x.nome)).length} kind="green" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {tec.map((x) => { const ativa = ativaDe(x.nome); const c = uiTone(t, ativa ? 'accent' : 'green'); return (
          <Card t={t} key={x.nome} hover style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ width: 50, height: 50, borderRadius: '50%', background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 16 }}>{atInit(x.nome)}</span>
                <span style={{ position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: '50%', background: c.fg, border: `2.5px solid ${t.panel}` }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15.5, fontWeight: 850, color: t.text }}>{x.nome}</div><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.muted, marginTop: 3 }}><Icon name="mapPin" size={13} /> {x.regiao}</div></div>
              <span style={{ fontSize: 10.5, fontWeight: 800, padding: '4px 9px', borderRadius: 7, background: c.bg, color: c.fg }}>{ativa ? 'Em campo' : 'Disponível'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: t.muted, marginTop: 14 }}><Icon name="phone" size={14} /> {x.tel}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 13, borderTop: `1px solid ${t.border}` }}>
              {ativa ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: t.accentText }}><Icon name="wrench" size={14} /> Atendendo {ativa.id}</span> : <span style={{ fontSize: 12, color: t.faint }}>Sem OA ativa</span>}
              <span style={{ fontSize: 12, color: t.muted }}><b style={{ color: t.text }}>{x.concl}</b> concluídas</span>
            </div>
          </Card>
        ); })}
      </div>
      {nova && (
        <ATModal t={t} title="Novo técnico" sub="Adicionar à equipe de campo." icon="users" onClose={() => setNova(false)} w={460}
          footer={<><Btn t={t} kind="ghost" onClick={() => setNova(false)}>Cancelar</Btn><button onClick={criar} disabled={!f.nome.trim()} style={{ all: 'unset', cursor: f.nome.trim() ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 22px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: f.nome.trim() ? t.accent : t.elevated, color: f.nome.trim() ? t.onAccent : t.faint }}><Icon name="check" size={17} /> Cadastrar</button></>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={atLab(t)}>Nome</label><input value={f.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Nome do técnico" style={atField(t)} /></div>
            <div><label style={atLab(t)}>Região</label><input value={f.regiao} onChange={(e) => set('regiao', e.target.value)} placeholder="Paraná" style={atField(t)} /></div>
            <div><label style={atLab(t)}>Telefone</label><input value={f.tel} onChange={(e) => set('tel', e.target.value)} placeholder="(41) 90000-0000" style={atField(t)} /></div>
          </div>
        </ATModal>
      )}
    </div>
  );
}

// ---------- Container stateful ----------
function ATModule({ active, theme, setActive }) {
  const t = frTokens(theme, AT_ACCENT, AT_ACCENT_T);
  const [os, setOs] = useStateAT(AT_OS_SEED);
  const [contratos, setContratos] = useStateAT(AT_CONTRATOS_SEED);
  const [equip, setEquip] = useStateAT(AT_EQUIP_SEED);
  const [tec, setTec] = useStateAT(AT_TEC_SEED);
  const [openId, setOpenId] = useStateAT(null);
  const [nova, setNova] = useStateAT(false);
  const [toast, setToast] = useStateAT(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2400); };
  const updateOs = (id, patch) => setOs((xs) => xs.map((o) => (o.id === id ? (typeof patch === 'function' ? patch(o) : { ...o, ...patch }) : o)));
  const criar = (f) => {
    const n = 'OA-' + (2042 + os.length);
    setOs((xs) => [{ id: n, tipo: f.tipo, cliente: f.cliente.trim(), cidade: f.cidade.trim() || '—', equip: f.equip.trim(), serie: f.serie.trim() || '—', tecnico: f.tecnico || null, prio: f.prio, status: f.tecnico ? 'agendado' : 'aberto', aberta: 'Agora', contrato: f.contrato.trim() || 'Avulso', sla: f.prio === 'alta' ? '4h' : '24h', slaRest: f.prio === 'alta' ? '4h' : '24h', problema: f.problema.trim(), maoObra: [], pecas: [], desloc: [], laudo: '', checklist: f.tipo === 'preventiva' ? [{ t: 'Inspeção visual', ok: false }, { t: 'Lubrificação', ok: false }, { t: 'Testes funcionais', ok: false }] : [] }, ...xs]);
    setNova(false); flash('Atendimento ' + n + ' aberto'); setActive && setActive('at-os');
  };

  let page;
  if (active === 'at-os') page = <ATOrdens t={t} os={os} tec={tec} updateOs={updateOs} openId={openId} setOpenId={setOpenId} flash={flash} onNova={() => setNova(true)} />;
  else if (active === 'at-agenda') page = <ATAgenda t={t} os={os} tec={tec} flash={flash} />;
  else if (active === 'at-contratos') page = <ATContratos t={t} contratos={contratos} setContratos={setContratos} flash={flash} />;
  else if (active === 'at-equip') page = <ATEquip t={t} equip={equip} setEquip={setEquip} flash={flash} />;
  else if (active === 'at-tecnicos') page = <ATTecnicos t={t} os={os} tec={tec} setTec={setTec} flash={flash} />;
  else page = <ATPainel t={t} os={os} contratos={contratos} setActive={setActive} />;

  return (
    <div style={{ position: 'relative' }}>
      {page}
      {nova && <ATNovaOS t={t} tec={tec} onClose={() => setNova(false)} onCreate={criar} />}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 80, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderRadius: 13, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 10px 30px rgba(0,0,0,.3)', maxWidth: '90vw' }}>
          <Icon name="check" size={18} /> {toast}
        </div>
      )}
    </div>
  );
}

function renderPageAT(active, props) {
  return <ATModule active={active} theme={props.theme} setActive={props.setActive} />;
}
window.renderPageAT = renderPageAT;
