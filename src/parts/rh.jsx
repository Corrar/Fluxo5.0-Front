// rh.jsx — Módulo RH (Recursos Humanos). Accent âmbar.
const { useState: useStateRH } = React;
const RH_ACCENT = '#d97706', RH_ACCENT_T = '#fbbf24';

const RH_COLAB = [
  { id: '019', nome: 'Bruno Teixeira', cargo: 'Administrador', setor: 'Diretoria', adm: '02/2019', salario: 'R$ 14.200', status: 'ativo', jornada: 'adm', regime: 'CLT', vale: 0 },
  { id: '023', nome: 'Mirela Fantim', cargo: 'Operadora', setor: 'Montagem', adm: '06/2022', salario: 'R$ 2.450', status: 'ativo', jornada: 'com', regime: 'CLT', vale: 600 },
  { id: '021', nome: 'Lincoln Gomes', cargo: 'Chefe de Produção', setor: 'Produção 3D', adm: '03/2020', salario: 'R$ 6.800', status: 'ativo', jornada: 'com', regime: 'CLT', vale: 600 },
  { id: '024', nome: 'Leo Monteiro', cargo: 'Operador', setor: 'Usinagem', adm: '09/2023', salario: 'R$ 2.450', status: 'ferias', jornada: 'not', regime: 'CLT', vale: 0 },
  { id: '017', nome: 'Júlia Ramos', cargo: 'Analista de Qualidade', setor: 'Qualidade', adm: '01/2021', salario: 'R$ 4.300', status: 'ativo', jornada: 'com', regime: 'CLT', vale: 0 },
  { id: '020', nome: 'Vitor Ladeia', cargo: 'Eletricista', setor: 'Elétrica', adm: '11/2022', salario: 'R$ 3.600', status: 'ativo', jornada: 'not', regime: 'CLT', vale: 750 },
  { id: '027', nome: 'Valdecir Bonatto', cargo: 'Torneiro', setor: 'Usinagem', adm: '05/2018', salario: 'R$ 3.900', status: 'afastado', jornada: 'com', regime: 'CLT', vale: 600 },
  { id: '016', nome: 'Davi Miranda', cargo: 'Operador 3D', setor: 'Produção 3D', adm: '07/2023', salario: 'R$ 2.450', status: 'ativo', jornada: 'not', regime: 'CLT', vale: 0 },
  { id: '031', nome: 'Renata Coelho', cargo: 'Designer (PJ)', setor: 'Projetos', adm: '04/2024', salario: 'R$ 7.500', status: 'ativo', jornada: 'pj', regime: 'PJ', vale: 0 },
  { id: '032', nome: 'Igor Salles', cargo: 'Dev Integrações (PJ)', setor: 'TI', adm: '08/2024', salario: 'R$ 9.000', status: 'ativo', jornada: 'pj', regime: 'PJ', vale: 0 },
];
const RH_CARGOS = ['Administrador', 'Chefe de Produção', 'Analista de Qualidade', 'Gestor de Estoque', 'Operador', 'Operadora', 'Operador 3D', 'Eletricista', 'Torneiro', 'Montador', 'Designer (PJ)', 'Dev Integrações (PJ)'];
const RH_SETORES = ['Diretoria', 'Montagem', 'Produção 3D', 'Usinagem', 'Qualidade', 'Elétrica', 'Projetos', 'TI', 'Almoxarifado'];
const RH_ADVERT_SEED = [
  { id: 1, nome: 'Davi Miranda', setor: 'Produção 3D', tipo: 'Verbal', gravidade: 'Leve', motivo: 'Atraso recorrente sem justificativa.', data: '15/06/2025', por: 'Lincoln Gomes' },
  { id: 2, nome: 'Mirela Fantim', setor: 'Montagem', tipo: 'Escrita', gravidade: 'Grave', motivo: 'Não utilização de EPI na linha de montagem.', data: '12/06/2025', por: 'Bruno Teixeira' },
  { id: 3, nome: 'Valdecir Bonatto', setor: 'Usinagem', tipo: 'Suspensão', gravidade: 'Leve', motivo: 'Reincidência — 2 dias de suspensão.', data: '08/06/2025', por: 'Bruno Teixeira' },
];
const ADVERT_TIPO = { 'Verbal': 'amber', 'Escrita': 'accent', 'Suspensão': 'red' };
// Gravidade define quantos pontos a advertência soma. 3 pontos = desligamento. Gravíssima desliga na hora.
const ADVERT_GRAV = {
  'Leve':       { pts: 1, tone: 'amber', desc: 'Falta simples — soma 1 ponto.' },
  'Grave':      { pts: 2, tone: 'red',   desc: 'Falta séria — soma 2 pontos.' },
  'Gravíssima': { pts: 3, tone: 'red',   desc: 'Justa causa — desligamento imediato.', imediato: true },
};
const ADVERT_LIMITE = 3;
const RH_STATUS = { ativo: ['Ativo', 'green'], ferias: ['Férias', 'blue'], afastado: ['Afastado', 'amber'], desligado: ['Desligado', 'red'] };
const JORNADAS_SEED = [
  { id: 'com', nome: 'Comercial', ini: '08:00', fim: '17:00', tipo: 'Diurno' },
  { id: 'adm', nome: 'Administrativo', ini: '09:00', fim: '18:00', tipo: 'Diurno' },
  { id: 'not', nome: 'Noturno', ini: '22:00', fim: '06:00', tipo: 'Noturno' },
  { id: 'pj', nome: 'PJ Flexível', ini: '—', fim: '—', tipo: 'PJ' },
];
const JORNADA_TIPO = { Diurno: 'blue', Noturno: 'accent', PJ: 'amber' };
const RH_PONTO_SEED = [
  { id: '019', nome: 'Bruno Teixeira', setor: 'Diretoria', jornada: 'adm', regime: 'CLT', ent: '08:55', almIni: '12:00', almFim: '13:00', sai: '—', st: 'presente', extra: '', vale: false, valeVal: 0 },
  { id: '023', nome: 'Mirela Fantim', setor: 'Montagem', jornada: 'com', regime: 'CLT', ent: '08:03', almIni: '12:00', almFim: '13:00', sai: '—', st: 'atraso', extra: '+3 min', vale: true, valeVal: 600 },
  { id: '021', nome: 'Lincoln Gomes', setor: 'Produção 3D', jornada: 'com', regime: 'CLT', ent: '07:45', almIni: '12:00', almFim: '13:00', sai: '—', st: 'presente', extra: '', vale: true, valeVal: 600 },
  { id: '017', nome: 'Júlia Ramos', setor: 'Qualidade', jornada: 'com', regime: 'CLT', ent: '07:58', almIni: '12:00', almFim: '13:00', sai: '—', st: 'presente', extra: '', vale: false, valeVal: 0 },
  { id: '020', nome: 'Vitor Ladeia', setor: 'Elétrica', jornada: 'not', regime: 'CLT', ent: '22:04', almIni: '02:00', almFim: '03:00', sai: '06:02', st: 'atraso', extra: '+4 min', vale: true, valeVal: 750 },
  { id: '016', nome: 'Davi Miranda', setor: 'Produção 3D', jornada: 'not', regime: 'CLT', ent: '—', almIni: '—', almFim: '—', sai: '—', st: 'ausente', extra: '', vale: false, valeVal: 0 },
  { id: '027', nome: 'Valdecir Bonatto', setor: 'Usinagem', jornada: 'com', regime: 'CLT', ent: '08:00', almIni: '12:00', almFim: '13:00', sai: '—', st: 'presente', extra: '', vale: true, valeVal: 600 },
  { id: '031', nome: 'Renata Coelho', setor: 'Projetos', jornada: 'pj', regime: 'PJ', ent: '—', almIni: '—', almFim: '—', sai: '—', st: 'pj', extra: '', vale: false, valeVal: 0 },
  { id: '032', nome: 'Igor Salles', setor: 'TI', jornada: 'pj', regime: 'PJ', ent: '—', almIni: '—', almFim: '—', sai: '—', st: 'pj', extra: '', vale: false, valeVal: 0 },
];
const RH_PONTO = RH_PONTO_SEED;
const PONTO_ST = { presente: ['Presente', 'green'], atraso: ['Atraso', 'amber'], ausente: ['Ausente', 'red'], pj: ['PJ · sem ponto', 'gray'] };
const RH_FERIAS_SEED = [
  { id: 1, nome: 'Leo Monteiro', setor: 'Usinagem', tipo: 'Férias', ini: '10/06', fim: '30/06', dias: 20, status: 'aprovado' },
  { id: 2, nome: 'Ana Esteves', setor: 'Qualidade', tipo: 'Folga', ini: '21/06', fim: '21/06', dias: 1, status: 'pendente' },
  { id: 3, nome: 'Vitor Ladeia', setor: 'Elétrica', tipo: 'Atestado', ini: '17/06', fim: '19/06', dias: 3, status: 'pendente' },
  { id: 4, nome: 'Davi Miranda', setor: 'Produção 3D', tipo: 'Férias', ini: '01/07', fim: '15/07', dias: 15, status: 'pendente' },
];

function rhInitials(n) { return n.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase(); }

function genPontoHist(p, periodo) {
  if (p.regime === 'PJ') return { dias: [], totAtraso: 0, totHe50: 0, totHe100: 0 };
  const n = periodo === 'dia' ? 1 : periodo === 'semana' ? 7 : periodo === 'custom' ? 14 : 30;
  const seed = parseInt(p.id) || 7;
  const WD = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const pad = (x) => String(x).padStart(2, '0');
  const dias = []; let totAtraso = 0, totHe50 = 0, totHe100 = 0;
  for (let i = 0; i < n; i++) {
    const dt = new Date(2025, 5, 17); dt.setDate(dt.getDate() - i);
    const dow = dt.getDay();
    const dia = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const wd = WD[dow];
    let row = { dia, wd, dow, ent: '08:00', almIni: '12:00', almFim: '13:00', sai: '17:00', atr: 0, he50: 0, he100: 0, falta: false, atestado: false };
    if (dow === 0) {
      // Domingo: folga. Se trabalhou, tudo é HE 100%
      const trabalhou = (seed + i) % 3 === 0;
      if (trabalhou) { const horas = 4 + ((seed + i) % 4); row = { ...row, ent: '08:00', almIni: '—', almFim: '—', sai: pad(8 + horas) + ':00', he100: horas, folga: true, trabalhou: true }; totHe100 += horas; }
      else { row = { ...row, ent: '—', almIni: '—', almFim: '—', sai: '—', folga: true, trabalhou: false }; }
    } else if (dow === 6) {
      // Sábado: folga. Se trabalhou, HE 50%
      const trabalhou = (seed + i) % 2 === 0;
      if (trabalhou) { const horas = 3 + ((seed + i) % 4); row = { ...row, ent: '08:00', almIni: '—', almFim: '—', sai: pad(8 + horas) + ':00', he50: horas, folga: true, trabalhou: true }; totHe50 += horas; }
      else { row = { ...row, ent: '—', almIni: '—', almFim: '—', sai: '—', folga: true, trabalhou: false }; }
    } else {
      const atr = (seed + i) % 4 === 0 ? (seed + i * 3) % 19 : 0;
      const he50 = (seed + i) % 5 === 0 ? 1 + (seed + i) % 2 : 0;
      row = { ...row, ent: atr ? ('08:' + pad(atr)) : '08:00', sai: he50 ? pad(17 + he50) + ':00' : '17:00', atr, he50 };
      totAtraso += atr; totHe50 += he50;
    }
    dias.push(row);
  }
  return { dias, totAtraso, totHe50, totHe100 };
}

// --- Cálculo de HE compartilhado entre o documento de viagem e a Folha de Pagamento ---
const rhParseSal = (s) => parseFloat(String(s || '').replace(/[^\d]/g, '')) || 0;
const rhValorHora = (c) => rhParseSal(c.salario) / 220;
// Horas noturnas estimadas a partir do relógio de ponto da competência (determinístico por colaborador).
const rhHorasNot = (c) => { const seed = parseInt(c.id) || 7; return (seed % 3 === 0) ? 0 : 8 + (seed % 5) * 3; };
// Proventos de horas extras (+ adicional noturno) de um colaborador, a partir do relógio de ponto da competência.
function rhHEProventos(c, periodo = 'mes', notPct = 20) {
  const h = genPontoHist(c, periodo);
  const vh = rhValorHora(c);
  const he50 = h.totHe50 || 0, he100 = h.totHe100 || 0;
  const val50 = he50 * vh * 1.5, val100 = he100 * vh * 2;
  const hnot = rhHorasNot(c);
  const valNot = hnot * vh * (notPct / 100);
  return { he50, he100, hnot, notPct, vh, val50, val100, valNot, total: val50 + val100 + valNot };
}

function PontoHistModal({ t, row, periodo, onClose }) {
  const h = genPontoHist(row, periodo);
  const periodoLabel = { dia: 'dia · 17/06', semana: 'semana · 13–17/06', mes: 'mês · Junho/2025' }[periodo];
  const stat = (icon, tone, label, val) => (
    <div style={{ flex: 1, minWidth: 120, padding: '14px 16px', borderRadius: 14, background: uiTone(t, tone).bg, border: `1px solid ${frHexToRgba(uiTone(t, tone).fg, 0.25)}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: uiTone(t, tone).fg, textTransform: 'uppercase' }}><Icon name={icon} size={13} /> {label}</div>
      <div style={{ fontSize: 22, fontWeight: 850, color: t.text, marginTop: 6 }}>{val}</div>
    </div>
  );
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(660px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>{rhInitials(row.nome)}</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>{row.nome}</div><div style={{ fontSize: 12.5, color: t.muted }}>Pontos batidos · {periodoLabel}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {stat('clock', 'amber', 'Total em atraso', h.totAtraso + ' min')}
            {stat('zap', 'green', 'Horas extras 50%', h.totHe50 + 'h')}
            {stat('zap', 'blue', 'Horas extras 100%', h.totHe100 + 'h')}
          </div>
          {h.dias.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: t.faint, border: `1px dashed ${t.borderStrong}`, borderRadius: 12 }}>Colaborador PJ — sem registro de ponto.</div>
          ) : (
            <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {h.dias.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: i === h.dias.length - 1 ? 'none' : `1px solid ${t.border}`, background: d.atr ? uiTone(t, 'amber').bg : 'transparent' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: t.text, width: 52 }}>{d.dia}</span>
                  <span style={{ fontSize: 12.5, color: t.muted }}>Ent <b style={{ color: d.atr ? uiTone(t, 'amber').fg : t.text }}>{d.ent}</b></span>
                  <span style={{ fontSize: 12.5, color: t.muted }}>{d.almIni}–{d.almFim}</span>
                  <span style={{ fontSize: 12.5, color: t.muted }}>Saí <b style={{ color: t.text }}>{d.sai}</b></span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    {d.atr > 0 && <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: uiTone(t, 'amber').bg, color: uiTone(t, 'amber').fg }}>+{d.atr}min</span>}
                    {d.he50 > 0 && <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: uiTone(t, 'green').bg, color: uiTone(t, 'green').fg }}>HE50 {d.he50}h</span>}
                    {d.he100 > 0 && <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: uiTone(t, 'blue').bg, color: uiTone(t, 'blue').fg }}>HE100 {d.he100}h</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Painel ----------
function RHPainel({ t, setActive }) {
  const ativos = RH_COLAB.filter((c) => c.status === 'ativo').length;
  const presentes = RH_PONTO.filter((p) => p.st !== 'ausente').length;
  const ferias = RH_COLAB.filter((c) => c.status === 'ferias').length;
  const go = (id) => setActive && setActive(id);
  const meses = [{ label: 'Jan', v: 44 }, { label: 'Fev', v: 46, accent: true }, { label: 'Mar', v: 45 }, { label: 'Abr', v: 48, accent: true }, { label: 'Mai', v: 47 }, { label: 'Jun', v: 50, accent: true }];
  const atalhos = [
    { id: 'rh-colab', icon: 'users', nome: 'Colaboradores', desc: `${RH_COLAB.length} cadastrados` },
    { id: 'rh-ponto', icon: 'clock', nome: 'Ponto & Frequência', desc: `${presentes} presentes hoje` },
    { id: 'rh-ferias', icon: 'calendar', nome: 'Férias & Ausências', desc: 'Aprovar solicitações' },
    { id: 'rh-folha', icon: 'barChart', nome: 'Folha de Pagamento', desc: 'Resumo do mês' },
  ];
  const orient = [
    { icon: 'users', tone: 'accent', titulo: 'Gerencie a equipe', desc: 'Cadastre colaboradores, ajuste cargo, setor e status (ativo, férias, afastado).' },
    { icon: 'clock', tone: 'blue', titulo: 'Acompanhe o ponto', desc: 'Veja entradas, atrasos e ausências do dia e exporte a frequência.' },
    { icon: 'calendar', tone: 'amber', titulo: 'Aprove ausências', desc: 'Analise pedidos de férias, folgas e atestados em um só lugar.' },
  ];
  const dark = t.panel !== '#ffffff';
  return (
    <div>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '30px 32px', marginBottom: 24, background: `linear-gradient(120deg, ${dark ? '#5a3206' : '#7a4506'} 0%, ${t.accent} 135%)`, color: '#fff' }}>
        <Icon name="users" size={190} style={{ position: 'absolute', right: -34, top: -40, opacity: 0.1 }} />
        <div style={{ position: 'relative', maxWidth: 620 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,.18)', marginBottom: 16 }}><Icon name="users" size={13} /> Módulo RH</div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 850, letterSpacing: '-.02em', lineHeight: 1.1 }}>Recursos Humanos</h1>
          <p style={{ margin: '8px 0 18px', fontSize: 14, color: 'rgba(255,255,255,.88)', lineHeight: 1.5 }}><b>{ativos} colaboradores ativos</b>, <b>{presentes} presentes hoje</b> e <b>{ferias} em férias</b>.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => go('rh-colab')} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: '#fff', color: t.accent, boxShadow: '0 6px 16px rgba(0,0,0,.2)' }}><Icon name="users" size={16} /> Ver Colaboradores</button>
            <button onClick={() => go('rh-ponto')} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, background: 'rgba(255,255,255,.16)', color: '#fff' }}><Icon name="clock" size={16} /> Ponto de hoje</button>
          </div>
        </div>
      </div>

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

      <PageHeader t={t} title="Indicadores" subtitle="Visão geral de pessoas." actions={<Btn t={t} kind="ghost" icon="download">Exportar</Btn>} />
      {(() => {
        const totalPonto = RH_PONTO.length || 1;
        const atrasos = RH_PONTO.filter((p) => p.st === 'atraso').length;
        const ausentes = RH_PONTO.filter((p) => p.st === 'ausente').length;
        const pj = RH_PONTO.filter((p) => p.st === 'pj').length;
        const presPct = Math.round((presentes / totalPonto) * 100);
        const absPct = Math.round((ausentes / totalPonto) * 100);
        const turnover = 3.1;
        const bySetor = RH_SETORES.map((s) => ({ s, n: RH_COLAB.filter((c) => c.setor === s).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
        const maxSetor = Math.max(...bySetor.map((x) => x.n), 1);
        const segs = [
          { label: 'Presentes', n: RH_PONTO.filter((p) => p.st === 'presente').length, tone: 'green' },
          { label: 'Atrasos', n: atrasos, tone: 'amber' },
          { label: 'Ausentes', n: ausentes, tone: 'red' },
          { label: 'PJ', n: pj, tone: 'gray' },
        ].filter((s) => s.n > 0);
        let acc = 0;
        const stops = segs.map((s) => { const from = (acc / totalPonto) * 360; acc += s.n; const to = (acc / totalPonto) * 360; return `${uiTone(t, s.tone).fg} ${from}deg ${to}deg`; }).join(', ');
        const Delta = ({ up, children, good }) => (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: uiTone(t, good ? 'green' : 'red').fg }}>
            <Icon name={up ? 'arrowUp' : 'arrowDown'} size={12} />{children}
          </span>
        );
        return (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <KPI t={t} icon="users" label="Headcount" value={RH_COLAB.length} sub={<Delta up good>+6 no semestre</Delta>} kind="accent" />
            <KPI t={t} icon="clock" label="Presença hoje" value={presPct + '%'} sub={<Delta up good>+2 p.p. vs ontem</Delta>} kind="green" />
            <KPI t={t} icon="alert" label="Absenteísmo" value={absPct + '%'} sub={<Delta up={false} good>-1 p.p. no mês</Delta>} kind="amber" />
            <KPI t={t} icon="exchange" label="Turnover" value={turnover + '%'} sub={<span style={{ color: t.muted }}>meta &lt; 4%</span>} kind="blue" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
            <Card t={t} style={{ padding: 22 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 18 }}>Headcount por setor</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {bySetor.map((x) => (
                  <div key={x.s}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}><span style={{ color: t.text, fontWeight: 600 }}>{x.s}</span><span style={{ color: t.muted, fontWeight: 800 }}>{x.n}</span></div>
                    <div style={{ height: 9, borderRadius: 6, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(x.n / maxSetor) * 100}%`, borderRadius: 6, background: `linear-gradient(90deg, ${t.accent}, ${frHexToRgba(t.accent, 0.6)})`, transition: 'width .5s' }} /></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card t={t} style={{ padding: 22 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 18 }}>Presença de hoje</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <RingChart t={t} size={140} thickness={16} center={{ value: presPct + '%', sub: 'presença' }}
                  segs={segs.map((s) => ({ label: s.label, value: s.n, color: uiTone(t, s.tone).fg }))} />
                <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {segs.map((s) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 11, height: 11, borderRadius: 3, background: uiTone(t, s.tone).fg, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: t.text, flex: 1 }}>{s.label}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: t.text }}>{s.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <Card t={t} style={{ padding: 22, marginBottom: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Evolução do quadro</div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Headcount mês a mês vs. meta</div>
              </div>
              <Badge t={t} kind="green" dot>+6 no semestre</Badge>
            </div>
            <AreaChart t={t} height={180} labels={meses.map((m) => m.label)}
              series={[
                { data: meses.map((m) => m.v), color: t.accent },
                { data: [46, 46, 47, 47, 48, 48], color: uiTone(t, 'blue').fg, fill: false, dot: false },
              ]} />
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.muted }}><span style={{ width: 16, height: 3, borderRadius: 2, background: t.accent }} /> Headcount</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.muted }}><span style={{ width: 16, height: 3, borderRadius: 2, background: uiTone(t, 'blue').fg }} /> Meta</span>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <Card t={t} style={{ padding: 22 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 6 }}>Movimentação de pessoal</div>
              <div style={{ fontSize: 12, color: t.muted, marginBottom: 18 }}>Admissões e desligamentos por mês</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 150 }}>
                {[['Fev', 1, 0], ['Mar', 2, 1], ['Abr', 1, 0], ['Mai', 3, 1], ['Jun', 2, 0]].map(([m, adm, des]) => (
                  <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: '100%', width: '100%', justifyContent: 'center' }}>
                      <div title={`${adm} admissões`} style={{ width: 14, height: `${(adm / 3) * 100}%`, minHeight: 4, borderRadius: '5px 5px 2px 2px', background: uiTone(t, 'green').fg }} />
                      <div title={`${des} desligamentos`} style={{ width: 14, height: `${(des / 3) * 100}%`, minHeight: 4, borderRadius: '5px 5px 2px 2px', background: uiTone(t, 'red').fg }} />
                    </div>
                    <div style={{ fontSize: 11, color: t.faint, fontWeight: 600 }}>{m}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.muted }}><span style={{ width: 10, height: 10, borderRadius: 3, background: uiTone(t, 'green').fg }} /> Admissões</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.muted }}><span style={{ width: 10, height: 10, borderRadius: 3, background: uiTone(t, 'red').fg }} /> Desligamentos</span>
              </div>
            </Card>
            <Card t={t} style={{ padding: 22 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 6 }}>Composição por regime</div>
              <div style={{ fontSize: 12, color: t.muted, marginBottom: 18 }}>Vínculo dos colaboradores</div>
              {(() => {
                const clt = RH_COLAB.filter((c) => c.regime !== 'PJ').length;
                const pjN = RH_COLAB.filter((c) => c.regime === 'PJ').length;
                const tot = clt + pjN || 1;
                return (
                  <>
                    <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ width: `${(clt / tot) * 100}%`, background: t.accent }} />
                      <div style={{ width: `${(pjN / tot) * 100}%`, background: uiTone(t, 'blue').fg }} />
                    </div>
                    {[['CLT', clt, t.accent], ['PJ', pjN, uiTone(t, 'blue').fg]].map(([lbl, n, col]) => (
                      <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                        <span style={{ width: 11, height: 11, borderRadius: 3, background: col, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: t.text, flex: 1 }}>{lbl}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{n}</span>
                        <span style={{ fontSize: 11.5, color: t.muted, width: 42, textAlign: 'right' }}>{Math.round((n / tot) * 100)}%</span>
                      </div>
                    ))}
                  </>
                );
              })()}
            </Card>
          </div>
        </>
        );
      })()}
    </div>
  );
}

// ---------- Colaboradores ----------
function RHColab({ t }) {
  const [colabs, setColabs] = useStateRH(RH_COLAB.map((c) => ({ ...c })));
  const [q, setQ] = useStateRH('');
  const [edit, setEdit] = useStateRH(null); // colaborador or {novo:true}
  const ql = q.trim().toLowerCase();
  const view = colabs.filter((c) => !ql || c.nome.toLowerCase().includes(ql) || c.cargo.toLowerCase().includes(ql) || c.setor.toLowerCase().includes(ql));
  const save = (data) => {
    if (data.novo) { setColabs((xs) => [{ ...data, novo: undefined }, ...xs]); }
    else { setColabs((xs) => xs.map((c) => (c.id === data.id ? { ...c, ...data } : c))); }
    setEdit(null);
  };
  const demitir = (id) => { setColabs((xs) => xs.map((c) => (c.id === id ? { ...c, status: 'desligado' } : c))); setEdit(null); };
  const cols = [
    { key: 'nome', label: 'Colaborador', render: (r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, opacity: r.status === 'desligado' ? 0.5 : 1 }}>
        <span style={{ width: 36, height: 36, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>{rhInitials(r.nome)}</span>
        <div><div style={{ fontWeight: 700, color: t.text }}>{r.nome}</div><div style={{ fontSize: 11.5, color: t.muted }}>#{r.id} · {r.cargo}</div></div>
      </div>) },
    { key: 'setor', label: 'Setor', render: (r) => <Badge t={t} kind="gray">{r.setor}</Badge> },
    { key: 'adm', label: 'Admissão', align: 'center', render: (r) => <span style={{ color: t.muted }}>{r.adm}</span> },
    { key: 'salario', label: 'Salário', align: 'right', render: (r) => <span style={{ fontWeight: 700 }}>{r.salario}</span> },
    { key: 'status', label: 'Status', align: 'center', render: (r) => <Badge t={t} kind={RH_STATUS[r.status][1]} dot>{RH_STATUS[r.status][0]}</Badge> },
    { key: 'acao', label: '', align: 'center', render: (r) => <button onClick={() => setEdit(r)} title="Editar" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}` }}
      onMouseEnter={(e) => { e.currentTarget.style.background = t.accentSoft; e.currentTarget.style.color = t.accentText; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}><Icon name="pencil" size={14} /></button> },
  ];
  return (
    <div>
      <PageHeader t={t} title="Colaboradores" subtitle="Equipe cadastrada no RH." actions={<Btn t={t} icon="userPlus" onClick={() => setEdit({ novo: true })}>Admitir colaborador</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="users" label="Total" value={colabs.filter((c) => c.status !== 'desligado').length} kind="accent" />
        <KPI t={t} mini icon="check" label="Ativos" value={colabs.filter((c) => c.status === 'ativo').length} kind="green" />
        <KPI t={t} mini icon="calendar" label="Em férias" value={colabs.filter((c) => c.status === 'ferias').length} kind="blue" />
        <KPI t={t} mini icon="out" label="Desligados" value={colabs.filter((c) => c.status === 'desligado').length} kind="red" />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text', marginBottom: 18 }}>
        <Icon name="search" size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, cargo ou setor…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
      </label>
      <DataTable t={t} columns={cols} rows={view} />
      {edit && <ColabModal t={t} colab={edit} onClose={() => setEdit(null)} onSave={save} onDemitir={demitir} />}
    </div>
  );
}

function ColabModal({ t, colab, onClose, onSave, onDemitir }) {
  const novo = !!colab.novo;
  const [nome, setNome] = useStateRH(novo ? '' : colab.nome);
  const [cargo, setCargo] = useStateRH(novo ? RH_CARGOS[4] : colab.cargo);
  const [setor, setSetor] = useStateRH(novo ? RH_SETORES[1] : colab.setor);
  const [salario, setSalario] = useStateRH(novo ? '' : String(colab.salario).replace(/[^\d]/g, ''));
  const [regime, setRegime] = useStateRH(novo ? 'CLT' : colab.regime);
  const [status, setStatus] = useStateRH(novo ? 'ativo' : colab.status);
  const fmtSal = (v) => 'R$ ' + (parseInt(v) || 0).toLocaleString('pt-BR');
  const field = { boxSizing: 'border-box', height: 42, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 6 };
  const sel = (val, set, opts) => (
    <div style={{ position: 'relative' }}>
      <select value={val} onChange={(e) => set(e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
      <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 13, color: t.muted, pointerEvents: 'none' }} />
    </div>
  );
  const save = () => { if (!nome.trim()) return; onSave({ novo, id: novo ? String(Math.floor(Math.random() * 900) + 100) : colab.id, nome: nome.trim(), cargo, setor, salario: fmtSal(salario), regime, status, jornada: novo ? 'com' : colab.jornada, vale: novo ? 0 : (colab.vale || 0), adm: novo ? new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : colab.adm }); };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={novo ? 'userPlus' : 'pencil'} size={19} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>{novo ? 'Admitir colaborador' : colab.nome}</div><div style={{ fontSize: 12.5, color: t.muted }}>{novo ? 'Cadastro de novo funcionário' : 'Ajuste salarial, cargo e situação'}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          <div style={{ marginBottom: 16 }}><label style={lab}>Nome completo</label><input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João da Silva" style={field} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div><label style={lab}>Cargo</label>{sel(cargo, setCargo, RH_CARGOS)}</div>
            <div><label style={lab}>Setor</label>{sel(setor, setSetor, RH_SETORES)}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div><label style={lab}>Salário (R$)</label><input value={salario} onChange={(e) => setSalario(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="2500" style={field} /><div style={{ fontSize: 11.5, fontWeight: 700, color: t.accentText, marginTop: 5 }}>{fmtSal(salario)}</div></div>
            <div><label style={lab}>Regime</label>{sel(regime, setRegime, ['CLT', 'PJ'])}</div>
          </div>
          {!novo && <div><label style={lab}>Situação</label>{sel(status, setStatus, ['ativo', 'ferias', 'afastado', 'desligado'])}</div>}
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          {!novo
            ? <button onClick={() => onDemitir(colab.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 16px', borderRadius: 11, fontSize: 13, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="out" size={15} /> Demitir</button>
            : <span />}
          <Btn t={t} icon="check" onClick={save}>{novo ? 'Admitir' : 'Salvar alterações'}</Btn>
        </div>
      </div>
    </div>
  );
}

function PontoConferenciaModal({ t, ponto, jornadas, jName, jTipo, only, onClose }) {
  const [step, setStep] = useStateRH('periodo');
  const [periodo, setPeriodo] = useStateRH('semana');
  const [ini, setIni] = useStateRH('2025-06-01');
  const [fim, setFim] = useStateRH('2025-06-17');
  const [edits, setEdits] = useStateRH({});
  const fmtBR = (iso) => { const [y, m, d] = (iso || '').split('-'); return d && m && y ? `${d}/${m}/${y}` : iso; };
  const periodoLabel = periodo === 'custom' ? `Período · ${fmtBR(ini)} a ${fmtBR(fim)}` : { dia: 'Dia · 17/06/2025', semana: 'Semana · 13–17/06/2025', mes: 'Mês · Junho/2025' }[periodo];
  const lista = ponto.filter((p) => p.regime !== 'PJ' && (!only || p.id === only.id));
  const fmtH = (n) => String(n).replace('.', ',') + 'h';
  const getVal = (eid, di, field, dflt) => { const k = eid + '-' + di + '-' + field; return edits[k] !== undefined ? edits[k] : dflt; };
  const setVal = (eid, di, field, v) => setEdits((m) => ({ ...m, [eid + '-' + di + '-' + field]: v }));
  const maskTime = (raw) => { const d = String(raw).replace(/\D/g, '').slice(0, 4); if (d.length <= 2) return d; return d.slice(0, 2) + ':' + d.slice(2); };
  const tIn = { boxSizing: 'border-box', width: 62, height: 30, textAlign: 'center', borderRadius: 7, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', outline: 'none' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: step === 'periodo' ? 'min(460px,96vw)' : 'min(960px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={step === 'periodo' ? 'calendar' : 'clock'} size={20} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{only ? only.nome : (step === 'periodo' ? 'Conferência de Ponto' : 'Pontos batidos')}</div>
            <div style={{ fontSize: 12.5, color: t.muted }}>{step === 'periodo' ? (only ? 'Escolha o período para puxar os pontos.' : 'Escolha o período de conferência.') : periodoLabel}</div>
          </div>
          {step === 'lista' && <button onClick={() => setStep('periodo')} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: t.muted, border: `1px solid ${t.border}` }}><Icon name="calendar" size={14} /> Período</button>}
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>

        {step === 'periodo' ? (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 12 }}>Período</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['dia', 'Hoje', '17/06/2025'], ['semana', 'Esta semana', '13 a 17 de junho'], ['mes', 'Este mês', 'Junho/2025'], ['custom', 'Período personalizado', 'Escolha as datas de início e fim']].map(([k, label, sub]) => {
                const on = periodo === k;
                return (
                  <button key={k} onClick={() => setPeriodo(k)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 13, background: on ? t.accentSoft : t.elevated, border: `1.5px solid ${on ? t.accent : t.border}` }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: on ? t.accent : 'transparent', border: on ? 'none' : `2px solid ${t.borderStrong}` }}>{on && <Icon name="check" size={13} style={{ color: t.onAccent }} />}</span>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{label}</div><div style={{ fontSize: 12, color: t.muted }}>{sub}</div></div>
                    <Icon name={k === 'custom' ? 'calendar' : 'calendar'} size={18} style={{ color: on ? t.accentText : t.faint }} />
                  </button>
                );
              })}
            </div>
            {periodo === 'custom' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 }}>Data início</label>
                  <input type="date" value={ini} max={fim} onChange={(e) => setIni(e.target.value)} style={{ boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 }}>Data fim</label>
                  <input type="date" value={fim} min={ini} onChange={(e) => setFim(e.target.value)} style={{ boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }} />
                </div>
              </div>
            )}
            <button onClick={() => setStep('lista')} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 48, marginTop: 20, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 14, fontWeight: 800, background: t.accent, color: t.onAccent, boxShadow: `0 6px 16px ${frHexToRgba(t.accent, 0.3)}` }}><Icon name="eye" size={18} /> Conferir pontos</button>
          </div>
        ) : (
          <div className="fr-scroll" style={{ overflowY: 'auto', padding: '18px 24px', flex: 1 }}>
            {lista.map((emp) => {
              const h = genPontoHist(emp, periodo);
              return (
                <div key={emp.id} style={{ marginBottom: 20, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: t.elevated, borderBottom: `1px solid ${t.border}` }}>
                    <span style={{ width: 36, height: 36, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>{rhInitials(emp.nome)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{emp.nome}</div><div style={{ fontSize: 11.5, color: t.muted }}>{emp.setor}</div></div>
                    <Badge t={t} kind={JORNADA_TIPO[jTipo(emp.jornada)]}>{jName(emp.jornada)} · {jTipo(emp.jornada)}</Badge>
                  </div>
                  <div style={{ overflowX: 'auto' }} className="fr-scroll">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600, fontSize: 12.5 }}>
                      <thead><tr>
                        {['Dia', 'Entrada', 'Almoço', 'Volta', 'Saída', 'HE 50%', 'HE 100%', 'Atraso', 'Presença'].map((c) => <th key={c} style={{ textAlign: c === 'Dia' ? 'left' : 'center', padding: '9px 12px', fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: t.faint, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{c}</th>)}
                      </tr></thead>
                      <tbody>
                        {h.dias.map((d, di) => {
                          const falta = getVal(emp.id, di, 'falta', false);
                          const atestado = getVal(emp.id, di, 'atestado', false);
                          const rowBg = falta ? uiTone(t, 'red').bg : atestado ? uiTone(t, 'blue').bg : d.folga ? frHexToRgba(d.dow === 0 ? '#6366f1' : '#10b981', 0.07) : d.atr ? uiTone(t, 'amber').bg : 'transparent';
                          const dimmed = falta;
                          return (
                          <tr key={di} style={{ background: rowBg }}>
                            <td style={{ padding: '8px 12px', borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: 800, color: t.text }}>{d.dia}</div>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: d.dow === 0 ? uiTone(t, 'accent').fg : d.dow === 6 ? uiTone(t, 'green').fg : t.muted }}>{d.wd}{d.folga ? ' · folga' : ''}</div>
                            </td>
                            {falta ? (
                              <td colSpan={7} style={{ padding: '8px 12px', textAlign: 'center', borderBottom: `1px solid ${t.border}`, color: uiTone(t, atestado ? 'blue' : 'red').fg, fontWeight: 800, fontSize: 12.5 }}>{atestado ? 'Falta abonada — atestado médico' : 'Falta não justificada'}</td>
                            ) : (<React.Fragment>
                            <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${t.border}`, opacity: dimmed ? 0.4 : 1 }}><input value={getVal(emp.id, di, 'ent', d.ent)} onChange={(e) => setVal(emp.id, di, 'ent', maskTime(e.target.value))} inputMode="numeric" maxLength={5} placeholder="00:00" style={{ ...tIn, color: d.atr ? uiTone(t, 'amber').fg : t.text, borderColor: d.atr ? frHexToRgba('#f59e0b', 0.4) : t.border }} /></td>
                            <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${t.border}`, opacity: dimmed ? 0.4 : 1 }}><input value={getVal(emp.id, di, 'almIni', d.almIni)} onChange={(e) => setVal(emp.id, di, 'almIni', maskTime(e.target.value))} inputMode="numeric" maxLength={5} placeholder="00:00" style={tIn} /></td>
                            <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${t.border}`, opacity: dimmed ? 0.4 : 1 }}><input value={getVal(emp.id, di, 'almFim', d.almFim)} onChange={(e) => setVal(emp.id, di, 'almFim', maskTime(e.target.value))} inputMode="numeric" maxLength={5} placeholder="00:00" style={tIn} /></td>
                            <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${t.border}`, opacity: dimmed ? 0.4 : 1 }}><input value={getVal(emp.id, di, 'sai', d.sai)} onChange={(e) => setVal(emp.id, di, 'sai', maskTime(e.target.value))} inputMode="numeric" maxLength={5} placeholder="00:00" style={tIn} /></td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: `1px solid ${t.border}` }}>{d.he50 ? <span style={{ fontWeight: 800, color: uiTone(t, 'green').fg }}>{fmtH(d.he50)}{d.dow === 6 ? '*' : ''}</span> : <span style={{ color: t.faint }}>—</span>}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: `1px solid ${t.border}` }}>{d.he100 ? <span style={{ fontWeight: 800, color: uiTone(t, 'accent').fg }}>{fmtH(d.he100)}{d.dow === 0 ? '*' : ''}</span> : <span style={{ color: t.faint }}>—</span>}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: `1px solid ${t.border}` }}>{d.atr ? <span style={{ fontWeight: 800, color: uiTone(t, 'amber').fg }}>+{d.atr}min</span> : <span style={{ color: t.faint }}>—</span>}</td>
                            </React.Fragment>)}
                            <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'inline-flex', gap: 5 }}>
                                <button onClick={() => { const nf = !falta; setVal(emp.id, di, 'falta', nf); if (!nf) setVal(emp.id, di, 'atestado', false); }} title="Marcar falta" style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', background: falta ? uiTone(t, 'red').fg : t.elevated, color: falta ? '#fff' : t.muted, border: `1px solid ${falta ? 'transparent' : t.border}` }}><Icon name="x" size={14} /></button>
                                <button onClick={() => { const na = !atestado; setVal(emp.id, di, 'atestado', na); if (na) setVal(emp.id, di, 'falta', true); }} title="Marcar atestado" style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', background: atestado ? uiTone(t, 'blue').fg : t.elevated, color: atestado ? '#fff' : t.muted, border: `1px solid ${atestado ? 'transparent' : t.border}` }}><Icon name="file" size={14} /></button>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '12px 16px', background: t.elevated, borderTop: `1px solid ${t.border}` }}>
                    <div style={{ flex: 1, minWidth: 130 }}><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.05em', color: t.faint, textTransform: 'uppercase' }}>Total atraso</div><div style={{ fontSize: 17, fontWeight: 850, color: h.totAtraso ? uiTone(t, 'amber').fg : t.text }}>{h.totAtraso} min</div></div>
                    <div style={{ flex: 1, minWidth: 130 }}><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.05em', color: t.faint, textTransform: 'uppercase' }}>Total HE 50%</div><div style={{ fontSize: 17, fontWeight: 850, color: uiTone(t, 'green').fg }}>{fmtH(h.totHe50)}</div></div>
                    <div style={{ flex: 1, minWidth: 130 }}><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.05em', color: t.faint, textTransform: 'uppercase' }}>Total HE 100%</div><div style={{ fontSize: 17, fontWeight: 850, color: uiTone(t, 'blue').fg }}>{fmtH(h.totHe100)}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step === 'lista' && (
          <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Btn t={t} kind="ghost" icon="download">Exportar</Btn>
            <Btn t={t} icon="check" onClick={onClose}>Salvar alterações</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Ponto & Frequência ----------
function RHPonto({ t }) {
  const [jornadas, setJornadas] = useStateRH(JORNADAS_SEED);
  const [ponto, setPonto] = useStateRH(RH_PONTO_SEED.map((p) => ({ ...p })));
  const [edit, setEdit] = useStateRH(null);
  const [hist, setHist] = useStateRH(null);
  const [filtroJ, setFiltroJ] = useStateRH('todas');
  const [filtroSt, setFiltroSt] = useStateRH('todos');
  const [periodo, setPeriodo] = useStateRH('dia');
  const [nome, setNome] = useStateRH(''); const [ini, setIni] = useStateRH(''); const [fim, setFim] = useStateRH(''); const [tipo, setTipo] = useStateRH('Diurno');
  const jName = (id) => (jornadas.find((j) => j.id === id) || {}).nome || '—';
  const jTipo = (id) => (jornadas.find((j) => j.id === id) || {}).tipo || 'Diurno';
  const setJornadaOf = (id, jid) => setPonto((xs) => xs.map((p) => (p.id === id ? { ...p, jornada: jid } : p)));
  const saveEdit = (data) => { setPonto((xs) => xs.map((p) => (p.id === edit.id ? { ...p, ...data } : p))); setEdit(null); };
  const addJornada = () => {
    if (!nome.trim()) return;
    const id = 'j' + Date.now();
    setJornadas((xs) => [...xs, { id, nome: nome.trim(), ini: ini || '—', fim: fim || '—', tipo }]);
    setNome(''); setIni(''); setFim(''); setTipo('Diurno');
  };
  const delJornada = (id) => setJornadas((xs) => xs.filter((j) => j.id !== id));
  const rows = ponto.filter((p) => (filtroJ === 'todas' || p.jornada === filtroJ) && (filtroSt === 'todos' || p.st === filtroSt));
  const atrasoMin = (p) => { const m = (p.extra || '').match(/(\d+)/); return m ? parseInt(m[1]) : 0; };
  const totalAtraso = ponto.reduce((a, p) => a + atrasoMin(p), 0);
  const periodTot = rows.map((r) => genPontoHist(r, periodo)).reduce((a, h) => ({ atr: a.atr + h.totAtraso, he50: a.he50 + h.totHe50, he100: a.he100 + h.totHe100 }), { atr: 0, he50: 0, he100: 0 });
  const [conf, setConf] = useStateRH(null);
  const [viagem, setViagem] = useStateRH({});
  const [docOp, setDocOp] = useStateRH(null);
  const toggleViagem = (id) => setViagem((m) => ({ ...m, [id]: !m[id] }));
  const valeTotal = ponto.filter((p) => p.vale).reduce((a, p) => a + (p.valeVal || 0), 0);
  const field = { boxSizing: 'border-box', height: 40, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' };
  const cols = [
    { key: 'nome', label: 'Colaborador', render: (r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ width: 34, height: 34, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11.5 }}>{rhInitials(r.nome)}</span>
        <div><div style={{ fontWeight: 700, color: t.text, display: 'flex', alignItems: 'center', gap: 6 }}>{r.nome}{r.vale && <Icon name="cart" size={12} style={{ color: t.accentText }} />}</div><div style={{ fontSize: 11.5, color: t.muted }}>{r.setor}{r.regime === 'PJ' ? ' · PJ' : ''}</div></div>
      </div>) },
    { key: 'jornada', label: 'Jornada', align: 'center', render: (r) => (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <select value={r.jornada} onChange={(e) => setJornadaOf(r.id, e.target.value)} style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', border: `1px solid ${t.border}`, background: uiTone(t, JORNADA_TIPO[jTipo(r.jornada)]).bg, color: uiTone(t, JORNADA_TIPO[jTipo(r.jornada)]).fg, fontWeight: 700, fontSize: 11.5, borderRadius: 8, padding: '5px 26px 5px 10px', fontFamily: 'inherit', outline: 'none' }}>
          {jornadas.map((j) => <option key={j.id} value={j.id}>{j.nome}</option>)}
        </select>
        <Icon name="chevronDown" size={13} style={{ position: 'absolute', right: 8, top: 8, color: 'currentColor', pointerEvents: 'none', opacity: .6 }} />
      </div>) },
    { key: 'vale', label: 'Vale', align: 'center', render: (r) => r.vale ? <Badge t={t} kind="green">R$ {r.valeVal}</Badge> : <span style={{ color: t.faint, fontSize: 12 }}>—</span> },
    { key: 'viagem', label: 'Viagem', align: 'center', render: (r) => (
      r.regime === 'PJ' ? <span style={{ fontSize: 12, color: t.faint }}>—</span> : (
      <button onClick={() => toggleViagem(r.id)} title="Marcar como em viagem" style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: viagem[r.id] ? uiTone(t, 'blue').bg : t.elevated, color: viagem[r.id] ? uiTone(t, 'blue').fg : t.muted, border: `1px solid ${viagem[r.id] ? frHexToRgba('#2563eb', 0.35) : t.border}` }}>
        <Icon name={viagem[r.id] ? 'truck' : 'home'} size={13} /> {viagem[r.id] ? 'Viajando' : 'Em casa'}
      </button>) ) },
    { key: 'acao', label: '', align: 'right', render: (r) => (
      r.regime === 'PJ'
        ? <span style={{ fontSize: 12, color: t.faint }}>—</span>
        : (
        <div style={{ display: 'inline-flex', gap: 8 }}>
          {viagem[r.id] && (
            <button onClick={() => setDocOp(r)} title="Enviar HE por e-mail" style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 34, padding: '0 13px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', color: uiTone(t, 'blue').fg, background: uiTone(t, 'blue').bg }}
              onMouseEnter={(e) => { e.currentTarget.style.background = uiTone(t, 'blue').fg; e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.background = uiTone(t, 'blue').bg; e.currentTarget.style.color = uiTone(t, 'blue').fg; }}><Icon name="send" size={13} /> Enviar HE</button>
          )}
          <button onClick={() => setConf(r)} title="Visualizar e editar pontos" style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 34, padding: '0 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', color: t.accentText, background: t.accentSoft }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.accent; e.currentTarget.style.color = t.onAccent; }} onMouseLeave={(e) => { e.currentTarget.style.background = t.accentSoft; e.currentTarget.style.color = t.accentText; }}><Icon name="eye" size={14} /> Visualizar e Editar</button>
        </div>)
    ) },
  ];
  return (
    <div>
      <PageHeader t={t} title="Ponto & Frequência" subtitle={'Análise por ' + ({ dia: 'dia · 17/06/2025', semana: 'semana · 13–17/06', mes: 'mês · Junho/2025' }[periodo])} actions={<Btn t={t} kind="ghost" icon="download">Exportar frequência</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <KPI t={t} mini icon="check" label="Presentes" value={ponto.filter((p) => p.st === 'presente').length} kind="green" />
        <KPI t={t} mini icon="clock" label="Atrasos" value={ponto.filter((p) => p.st === 'atraso').length} sub={totalAtraso + ' min no total'} kind="amber" />
        <KPI t={t} mini icon="alert" label="Ausentes" value={ponto.filter((p) => p.st === 'ausente').length} kind="red" />
        <KPI t={t} mini icon="cart" label="Vale-transporte" value={'R$ ' + valeTotal} sub={`${ponto.filter((p) => p.vale).length} colaboradores`} kind="accent" />
      </div>

      {/* jornadas / classes */}
      <Card t={t} style={{ padding: 18, marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="clock" size={17} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Jornadas de trabalho</div><div style={{ fontSize: 12, color: t.muted }}>Classes de horário — inclui turnos noturnos e regime PJ.</div></div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          {jornadas.map((j) => (
            <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
              <Badge t={t} kind={JORNADA_TIPO[j.tipo]}>{j.tipo}</Badge>
              <div><div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>{j.nome}</div><div style={{ fontSize: 11.5, color: t.muted }}>{j.tipo === 'PJ' ? 'Sem registro de ponto' : `${j.ini} – ${j.fim}`}</div></div>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.faint, marginLeft: 6 }}>{ponto.filter((p) => p.jornada === j.id).length} pess.</span>
              <button onClick={() => delJornada(j.id)} title="Remover" style={{ all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={14} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da jornada" style={{ ...field, flex: 1, minWidth: 150 }} />
          <input value={ini} onChange={(e) => setIni(e.target.value)} placeholder="Início (22:00)" style={{ ...field, width: 110 }} />
          <input value={fim} onChange={(e) => setFim(e.target.value)} placeholder="Fim (06:00)" style={{ ...field, width: 110 }} />
          <div style={{ position: 'relative' }}>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>
              <option>Diurno</option><option>Noturno</option><option>PJ</option>
            </select>
            <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 10, top: 12, color: t.muted, pointerEvents: 'none' }} />
          </div>
          <Btn t={t} icon="plus" onClick={addJornada}>Criar jornada</Btn>
        </div>
      </Card>

      {/* tabela de colaboradores — cada um com Visualizar e Editar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: t.text, marginRight: 'auto' }}>Colaboradores</span>
        <div style={{ position: 'relative' }}>
          <select value={filtroJ} onChange={(e) => setFiltroJ(e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 30, cursor: 'pointer' }}>
            <option value="todas">Todas jornadas</option>
            {jornadas.map((j) => <option key={j.id} value={j.id}>{j.nome}</option>)}
          </select>
          <Icon name="chevronDown" size={14} style={{ position: 'absolute', right: 9, top: 13, color: t.muted, pointerEvents: 'none' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={filtroSt} onChange={(e) => setFiltroSt(e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 30, cursor: 'pointer' }}>
            <option value="todos">Todos status</option>
            <option value="presente">Presentes</option><option value="atraso">Atrasos</option><option value="ausente">Ausentes</option><option value="pj">PJ</option>
          </select>
          <Icon name="chevronDown" size={14} style={{ position: 'absolute', right: 9, top: 13, color: t.muted, pointerEvents: 'none' }} />
        </div>
      </div>
      <Card t={t} style={{ marginBottom: 22, overflow: 'hidden' }}>
        <DataTable t={t} columns={cols} rows={rows} />
      </Card>

      {/* conferência geral */}
      <Card t={t} style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ width: 48, height: 48, borderRadius: 14, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="clock" size={24} /></span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Conferência geral</div>
          <div style={{ fontSize: 12.5, color: t.muted, marginTop: 2 }}>Ou use o botão <b style={{ color: t.text }}>Visualizar e Editar</b> em cada colaborador da tabela acima para puxar os pontos de um período.</div>
        </div>
        <Btn t={t} icon="eye" onClick={() => setConf('all')}>Conferir todos</Btn>
      </Card>

      {conf && <PontoConferenciaModal t={t} ponto={ponto} jornadas={jornadas} jName={jName} jTipo={jTipo} only={conf === 'all' ? null : conf} onClose={() => setConf(null)} />}
      {docOp && <ViagemHEModal t={t} op={docOp} hist={genPontoHist(docOp, 'mes')} onClose={() => setDocOp(null)} />}
    </div>
  );
}

function ViagemHEModal({ t, op, hist, onClose }) {
  const [sent, setSent] = useStateRH(false);
  const c = RH_COLAB.find((x) => x.nome === op.nome) || { salario: 'R$ 2.200' };
  // Puxa o mesmo cálculo de proventos usado na Folha de Pagamento (competência do mês).
  const he = rhHEProventos(c, 'mes');
  const valorHora = he.vh;
  const he50 = he.he50, he100 = he.he100;
  const val50 = he.val50, val100 = he.val100;
  const total = he.total;const email = op.nome.toLowerCase().replace(/[^a-zà-ÿ ]/g, '').trim().split(' ').slice(0, 2).join('.') + '@fluxoroyale.com';
  const fmt = (v) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const row = (lbl, h, v, tone) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
      <div><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{lbl}</div><div style={{ fontSize: 11.5, color: t.muted }}>{h.toFixed(1)}h × {fmt(valorHora * (tone === 'amber' ? 1.5 : 2))}</div></div>
      <span style={{ fontSize: 15, fontWeight: 850, color: uiTone(t, tone).fg }}>{fmt(v)}</span>
    </div>
  );
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px,96vw)', maxHeight: '90vh', overflowY: 'auto', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow }} className="fr-scroll">
        <div style={{ position: 'relative', padding: '22px 24px', background: `linear-gradient(135deg, #1d4ed8, #2563eb)`, color: '#fff' }}>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 16, right: 18, width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.18)' }}><Icon name="x" size={16} /></button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '4px 11px', borderRadius: 999, background: 'rgba(255,255,255,.2)', marginBottom: 12 }}><Icon name="truck" size={13} /> Em viagem</div>
          <div style={{ fontSize: 20, fontWeight: 850 }}>Demonstrativo de Horas Extras</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.85)', marginTop: 5 }}>{op.nome} · {op.setor} · Junho/2025</div>        </div>
        <div style={{ padding: 22 }}>
          {/* base puxada da folha */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '11px 14px', borderRadius: 11, background: t.accentSoft, border: `1px solid ${frHexToRgba(t.accent, 0.25)}` }}>
            <Icon name="barChart" size={16} style={{ color: t.accentText, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: t.text }}>Base da Folha · salário {c.salario} ÷ 220h = <b>{fmt(valorHora)}</b>/h</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {row('Hora extra 50%', he50, val50, 'amber')}
            {row('Hora extra 100%', he100, val100, 'red')}
            {he.hnot > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Adicional noturno {he.notPct}%</div><div style={{ fontSize: 11.5, color: t.muted }}>{he.hnot.toFixed(1)}h × {fmt(valorHora * (he.notPct / 100))}</div></div>
                <span style={{ fontSize: 15, fontWeight: 850, color: uiTone(t, 'accent').fg }}>{fmt(he.valNot)}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: '14px 16px', borderRadius: 12, background: uiTone(t, 'blue').bg }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: uiTone(t, 'blue').fg }}>Total a receber em HE</span>
            <span style={{ fontSize: 20, fontWeight: 850, color: uiTone(t, 'blue').fg }}>{fmt(total)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12, padding: '10px 13px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}` }}>
            <Icon name="check" size={14} style={{ color: uiTone(t, 'green').fg, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: t.muted }}>Valor sincronizado com os proventos da <b style={{ color: t.text }}>Folha de Pagamento</b> (competência Junho/2025).</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, padding: '11px 14px', borderRadius: 11, border: `1px solid ${t.border}` }}>
            <Icon name="bell" size={16} style={{ color: t.muted }} />
            <span style={{ fontSize: 12.5, color: t.muted }}>Enviar para</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: t.text, marginLeft: 'auto' }}>{email}</span>
          </div>
          {sent ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 16, height: 48, borderRadius: 13, background: uiTone(t, 'green').bg, color: uiTone(t, 'green').fg, fontSize: 14, fontWeight: 800 }}><Icon name="check" size={18} /> Documento enviado por e-mail!</div>
          ) : (
            <button onClick={() => setSent(true)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 48, marginTop: 16, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 14, fontWeight: 800, background: uiTone(t, 'blue').fg, color: '#fff', boxShadow: `0 6px 16px ${frHexToRgba('#2563eb', 0.3)}` }}><Icon name="send" size={17} /> Enviar documento por e-mail</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Férias & Ausências ----------
function RHFerias({ t }) {
  const [items, setItems] = useStateRH(RH_FERIAS_SEED);
  const set = (id, status) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status } : x)));
  const tipoKind = { 'Férias': 'blue', 'Folga': 'accent', 'Atestado': 'amber' };
  const stKind = { aprovado: ['Aprovado', 'green'], pendente: ['Pendente', 'amber'], recusado: ['Recusado', 'red'] };
  return (
    <div>
      <PageHeader t={t} title="Férias & Ausências" subtitle="Solicitações de férias, folgas e atestados." actions={<Btn t={t} icon="plus">Nova solicitação</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="clock" label="Pendentes" value={items.filter((x) => x.status === 'pendente').length} kind="amber" />
        <KPI t={t} mini icon="check" label="Aprovadas" value={items.filter((x) => x.status === 'aprovado').length} kind="green" />
        <KPI t={t} mini icon="calendar" label="Em férias agora" value="1" kind="blue" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {items.map((f) => (
          <Card t={t} key={f.id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 40, height: 40, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{rhInitials(f.nome)}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{f.nome}</div><div style={{ fontSize: 12, color: t.muted }}>{f.setor}</div></div>
              <Badge t={t} kind={stKind[f.status][1]} dot>{stKind[f.status][0]}</Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '12px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
              <Badge t={t} kind={tipoKind[f.tipo] || 'gray'}>{f.tipo}</Badge>
              <span style={{ fontSize: 12.5, color: t.text, fontWeight: 600 }}>{f.ini} → {f.fim}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 800, color: t.accentText }}>{f.dias} {f.dias === 1 ? 'dia' : 'dias'}</span>
            </div>
            {f.status === 'pendente' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button onClick={() => set(f.id, 'recusado')} style={{ all: 'unset', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42, borderRadius: 11, fontSize: 13, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="x" size={15} /> Recusar</button>
                <button onClick={() => set(f.id, 'aprovado')} style={{ all: 'unset', cursor: 'pointer', flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42, borderRadius: 11, fontSize: 13, fontWeight: 800, background: t.accent, color: '#fff', boxShadow: `0 4px 12px ${frHexToRgba(t.accent, 0.3)}` }}><Icon name="check" size={15} /> Aprovar</button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------- Advertências ----------
function RHAdvert({ t }) {
  const [items, setItems] = useStateRH(RH_ADVERT_SEED.map((a) => ({ ...a })));
  const [desligados, setDesligados] = useStateRH([]);
  const [novo, setNovo] = useStateRH(false);
  const [nome, setNome] = useStateRH(RH_COLAB[1].nome);
  const [tipo, setTipo] = useStateRH('Verbal');
  const [gravidade, setGravidade] = useStateRH('Leve');
  const [motivo, setMotivo] = useStateRH('');
  const gravPts = (g) => (ADVERT_GRAV[g] || ADVERT_GRAV['Leve']).pts;
  const countOf = (n) => items.filter((a) => a.nome === n).length;
  const pointsOf = (n) => items.filter((a) => a.nome === n).reduce((s, a) => s + gravPts(a.gravidade || 'Leve'), 0);
  const add = () => {
    if (!motivo.trim()) return;
    const c = RH_COLAB.find((x) => x.nome === nome) || {};
    const novoTotal = countOf(nome) + 1;
    const novoPts = pointsOf(nome) + gravPts(gravidade);
    setItems((xs) => [{ id: Date.now(), nome, setor: c.setor || '—', tipo, gravidade, motivo: motivo.trim(), data: new Date().toLocaleDateString('pt-BR'), por: 'Bruno Teixeira', n: novoTotal }, ...xs]);
    if (novoPts >= ADVERT_LIMITE) setDesligados((xs) => (xs.includes(nome) ? xs : [...xs, nome]));
    setMotivo(''); setNovo(false);
  };
  const del = (id) => setItems((xs) => xs.filter((x) => x.id !== id));
  const field = { boxSizing: 'border-box', height: 42, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 6 };
  // resumo por colaborador (por pontos de gravidade)
  const porColab = [...new Set(items.map((a) => a.nome))].map((n) => ({ nome: n, setor: (items.find((a) => a.nome === n) || {}).setor, count: countOf(n), pts: pointsOf(n) })).sort((a, b) => b.pts - a.pts);
  const novoPts = pointsOf(nome) + gravPts(gravidade);
  const willDismiss = novoPts >= ADVERT_LIMITE;

  return (
    <div>
      <PageHeader t={t} title="Advertências" subtitle="Registro disciplinar por gravidade — 3 pontos resultam em desligamento." actions={<Btn t={t} icon="plus" onClick={() => setNovo((v) => !v)}>Nova advertência</Btn>} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', borderRadius: 12, background: uiTone(t, 'amber').bg, color: uiTone(t, 'amber').fg, fontSize: 12.5, fontWeight: 600, marginBottom: 14, flexWrap: 'wrap' }}>
        <Icon name="alert" size={17} /> Política por gravidade: <b>Leve</b> = 1 ponto · <b>Grave</b> = 2 pontos · <b>Gravíssima</b> = desligamento imediato. Ao atingir <b>3 pontos</b> o colaborador é desligado.
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <KPI t={t} mini icon="bell" label="Total" value={items.length} kind="accent" />
        <KPI t={t} mini icon="users" label="Com advertência" value={porColab.length} kind="blue" />
        <KPI t={t} mini icon="alert" label="Risco (2/3 pts)" value={porColab.filter((p) => p.pts === 2).length} kind="amber" />
        <KPI t={t} mini icon="out" label="Desligados" value={porColab.filter((p) => p.pts >= ADVERT_LIMITE).length} kind="red" />
      </div>

      {(() => {
        const bloqueados = porColab.filter((p) => p.pts >= ADVERT_LIMITE);
        const risco = porColab.filter((p) => p.pts === 2);
        const advertidos = porColab.filter((p) => p.pts === 1);
        const ColabRow = ({ p, tone }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}` }}>
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: uiTone(t, tone).bg, color: uiTone(t, tone).fg, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{rhInitials(p.nome)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{p.nome}</div>
              <div style={{ fontSize: 11.5, color: t.muted }}>{p.setor} · {p.count} advertência(s)</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {[1, 2, 3].map((i) => <span key={i} style={{ width: 18, height: 8, borderRadius: 4, background: i <= p.pts ? uiTone(t, i >= 3 ? 'red' : i === 2 ? 'amber' : 'green').fg : t.hover }} />)}
              <span style={{ fontSize: 13, fontWeight: 850, color: uiTone(t, tone).fg, marginLeft: 6 }}>{Math.min(p.pts, ADVERT_LIMITE)}/3</span>
            </div>
          </div>
        );
        const Lane = ({ tone, icon, titulo, desc, lista, emptyMsg }) => (
          <div style={{ borderRadius: 18, border: `1.5px solid ${frHexToRgba(uiTone(t, tone).fg, 0.45)}`, background: uiTone(t, tone).bg, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 18px' }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, background: uiTone(t, tone).fg, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={icon} size={19} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 850, color: t.text }}>{titulo} <span style={{ fontSize: 12, fontWeight: 800, color: uiTone(t, tone).fg }}>· {lista.length}</span></div>
                <div style={{ fontSize: 12, color: t.muted }}>{desc}</div>
              </div>
            </div>
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lista.length === 0 ? <div style={{ fontSize: 12.5, color: t.muted, padding: '6px 4px', fontStyle: 'italic' }}>{emptyMsg}</div> : lista.map((p) => <ColabRow key={p.nome} p={p} tone={tone} />)}
            </div>
          </div>
        );
        return (
          <>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 14 }}>Gestão por colaborador</div>
            <Lane tone="red" icon="out" titulo="Desligados — limite atingido" desc="Acumularam 3 pontos (ou falta gravíssima) e foram desligados." lista={bloqueados} emptyMsg="Nenhum colaborador desligado." />
            <Lane tone="amber" icon="alert" titulo="Em risco (2/3 pontos)" desc="Uma falta leve a mais — ou qualquer falta grave — resulta em desligamento." lista={risco} emptyMsg="Ninguém em risco no momento." />
            <Lane tone="green" icon="bell" titulo="Com advertência (1/3 ponto)" desc="Possuem registro disciplinar, ainda dentro do limite." lista={advertidos} emptyMsg="Nenhuma advertência simples." />
          </>
        );
      })()}

      {novo && (
        <Card t={t} style={{ padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={lab}>Colaborador</label>
              <div style={{ position: 'relative' }}>
                <select value={nome} onChange={(e) => setNome(e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>{RH_COLAB.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select>
                <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 13, color: t.muted, pointerEvents: 'none' }} />
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: t.muted, marginTop: 6 }}>Acumula <b style={{ color: t.text }}>{Math.min(pointsOf(nome), ADVERT_LIMITE)}/3</b> pontos · ficará com <b style={{ color: willDismiss ? uiTone(t, 'red').fg : t.accentText }}>{Math.min(novoPts, ADVERT_LIMITE)}/3</b></div>
            </div>
            <div><label style={lab}>Formato</label>
              <div style={{ position: 'relative' }}>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}><option>Verbal</option><option>Escrita</option><option>Suspensão</option></select>
                <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 13, color: t.muted, pointerEvents: 'none' }} />
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lab}>Gravidade</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {Object.keys(ADVERT_GRAV).map((g) => {
                const sel = gravidade === g, tone = ADVERT_GRAV[g].tone;
                return (
                  <button key={g} onClick={() => setGravidade(g)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${sel ? uiTone(t, tone).fg : t.border}`, background: sel ? uiTone(t, tone).bg : t.elevated }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 850, color: sel ? uiTone(t, tone).fg : t.text }}>{g}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: uiTone(t, tone).fg, background: uiTone(t, tone).bg, borderRadius: 999, padding: '2px 8px' }}>{ADVERT_GRAV[g].imediato ? 'DESLIGA' : `+${ADVERT_GRAV[g].pts} pt`}</span>
                    </div>
                    <div style={{ fontSize: 11, color: t.muted, marginTop: 5, lineHeight: 1.4 }}>{ADVERT_GRAV[g].desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={lab}>Motivo</label><textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Descreva o motivo da advertência…" style={{ ...field, height: 'auto', padding: '10px 12px', resize: 'vertical' }} /></div>
          {willDismiss && <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', borderRadius: 10, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, fontSize: 12.5, fontWeight: 700, marginBottom: 14 }}><Icon name="alert" size={16} /> {ADVERT_GRAV[gravidade].imediato ? 'Falta gravíssima — o colaborador será desligado imediatamente.' : 'Esta advertência atinge 3 pontos — o colaborador será desligado.'}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><Btn t={t} kind="ghost" onClick={() => setNovo(false)}>Cancelar</Btn><Btn t={t} icon="check" onClick={add}>Registrar</Btn></div>
        </Card>
      )}

      <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 12 }}>Histórico</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((a) => {
          const g = ADVERT_GRAV[a.gravidade] || ADVERT_GRAV['Leve'];
          return (
          <Card t={t} key={a.id} style={{ padding: 16, borderLeft: `3px solid ${uiTone(t, g.tone).fg}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{rhInitials(a.nome)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{a.nome}</span><Badge t={t} kind={g.tone} dot>{a.gravidade || 'Leve'}</Badge><span style={{ fontSize: 11, fontWeight: 700, color: t.muted }}>{a.tipo}</span>{a.n && <span style={{ fontSize: 11, fontWeight: 800, color: t.muted }}>· {a.n}ª</span>}</div>
                <div style={{ fontSize: 12, color: t.muted }}>{a.setor}</div>
              </div>
              <span style={{ fontSize: 11.5, color: t.faint, whiteSpace: 'nowrap' }}>{a.data}</span>
              <button onClick={() => del(a.id)} title="Remover" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
            </div>
            <div style={{ fontSize: 13, color: t.text, marginTop: 12, padding: '11px 13px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}`, lineHeight: 1.5 }}>{a.motivo}</div>
            <div style={{ fontSize: 11.5, color: t.faint, marginTop: 8 }}>Aplicada por {a.por}</div>
          </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Folha de Pagamento ----------
function RHFolha({ t }) {
  const parseSal = (s) => parseFloat(s.replace(/[^\d]/g, ''));
  const fmt = (n) => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
  const [adj, setAdj] = useStateRH({});
  const [edit, setEdit] = useStateRH(null);
  const [night, setNight] = useStateRH({ ini: '22:00', fim: '05:00', pct: 20 });
  const get = (id) => adj[id] || { atrasoMin: 0, descAtraso: 0, faltas: [], hnot: 0, viaja: false };
  const apiHoras = (c) => { const h = genPontoHist(c, 'mes'); return { he50: h.totHe50, he100: h.totHe100 }; };
  const diaria = (c) => rhParseSal(c.salario) / 30;
  const valorHora = (c) => rhValorHora(c);
  const descTotal = (c) => { const a = get(c.id); return (parseFloat(a.descAtraso) || 0) + a.faltas.filter((f) => !f.just).length * diaria(c); };
  const proventos = (c) => { const a = get(c.id); const vh = valorHora(c); const he = rhHEProventos(c, 'mes', night.pct); return he.total + (a.hnot || 0) * vh * (night.pct / 100); };
  const liquido = (c) => parseSal(c.salario) + 620 - 480 + proventos(c) - descTotal(c) - (c.vale || 0);

  const cols = [
    { key: 'nome', label: 'Colaborador', render: (r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ width: 34, height: 34, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11.5 }}>{rhInitials(r.nome)}</span>
        <div><div style={{ fontWeight: 700, color: t.text, display: 'flex', alignItems: 'center', gap: 6 }}>{r.nome}{get(r.id).viaja && <Icon name="briefcase" size={12} style={{ color: t.accentText }} />}</div><div style={{ fontSize: 11.5, color: t.muted }}>{r.cargo} · {r.regime}</div></div>
      </div>) },
    { key: 'prov', label: 'Proventos', align: 'right', render: (r) => { const p = proventos(r); return <span style={{ color: p > 0 ? uiTone(t, 'green').fg : t.muted, fontWeight: p > 0 ? 700 : 400 }}>{p > 0 ? '+ ' + fmt(p) : '—'}</span>; } },
    { key: 'desc', label: 'Descontos', align: 'right', render: (r) => { const d = descTotal(r); return <span style={{ color: d > 0 ? uiTone(t, 'red').fg : t.muted, fontWeight: d > 0 ? 700 : 400 }}>{d > 0 ? '- ' + fmt(d) : '—'}</span>; } },
    { key: 'liq', label: 'Líquido', align: 'right', render: (r) => <span style={{ fontWeight: 800 }}>{fmt(liquido(r))}</span> },
    { key: 'acao', label: '', align: 'center', render: (r) => r.regime === 'PJ'
      ? <Badge t={t} kind="amber">PJ · NF</Badge>
      : <button onClick={() => setEdit(r)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: t.accentText, padding: '6px 11px', borderRadius: 9, border: `1px solid ${t.border}` }}
          onMouseEnter={(e) => { e.currentTarget.style.background = t.accentSoft; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="calculator" size={13} /> Calcular</button> },
  ];
  const nf = { boxSizing: 'border-box', height: 38, borderRadius: 9, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 10px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', outline: 'none', width: 88 };
  return (
    <div>
      <PageHeader t={t} title="Folha de Pagamento" subtitle="Competência · Junho/2025 · cálculo automático" actions={<><Btn t={t} kind="ghost" icon="file">Holerites</Btn><Btn t={t} icon="download">Exportar folha</Btn></>} />

      {/* config adicional noturno */}
      <Card t={t} style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="moon" size={17} /></span>
          <div style={{ flex: 1, minWidth: 160 }}><div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Adicional noturno</div><div style={{ fontSize: 11.5, color: t.muted }}>Período e percentual aplicados ao cálculo.</div></div>
          <label style={{ fontSize: 11, fontWeight: 700, color: t.muted }}>Início <input value={night.ini} onChange={(e) => setNight((n) => ({ ...n, ini: e.target.value }))} style={{ ...nf, width: 78, marginLeft: 6 }} /></label>
          <label style={{ fontSize: 11, fontWeight: 700, color: t.muted }}>Fim <input value={night.fim} onChange={(e) => setNight((n) => ({ ...n, fim: e.target.value }))} style={{ ...nf, width: 78, marginLeft: 6 }} /></label>
          <label style={{ fontSize: 11, fontWeight: 700, color: t.muted }}>Adicional <input value={night.pct} onChange={(e) => setNight((n) => ({ ...n, pct: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 }))} style={{ ...nf, width: 64, marginLeft: 6 }} />%</label>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} icon="users" label="CLT / PJ" value={`${RH_COLAB.filter((c) => c.regime === 'CLT').length} / ${RH_COLAB.filter((c) => c.regime === 'PJ').length}`} kind="blue" />
        <KPI t={t} icon="zap" label="Proventos extras" value={fmt(RH_COLAB.reduce((a, c) => a + proventos(c), 0))} sub="HE + noturno" kind="green" />
        <KPI t={t} icon="out" label="Descontos" value={fmt(RH_COLAB.reduce((a, c) => a + descTotal(c), 0))} sub="atrasos + faltas" kind="red" />
        <KPI t={t} icon="check" label="Líquido CLT" value={fmt(RH_COLAB.filter((c) => c.regime === 'CLT').reduce((a, c) => a + liquido(c), 0))} kind="accent" />
      </div>
      <DataTable t={t} columns={cols} rows={RH_COLAB} />

      {edit && <FolhaAjusteModal t={t} colab={edit} adj={get(edit.id)} api={apiHoras(edit)} diaria={diaria(edit)} valorHora={valorHora(edit)} night={night}
        onClose={() => setEdit(null)}
        onSave={(a) => { setAdj((m) => ({ ...m, [edit.id]: a })); setEdit(null); }} />}
    </div>
  );
}

function FolhaAjusteModal({ t, colab, adj, api, diaria, valorHora, night, onClose, onSave }) {
  const [viaja, setViaja] = useStateRH(!!adj.viaja);
  const [atrasoMin, setAtrasoMin] = useStateRH(String(adj.atrasoMin || ''));
  const [hnot, setHnot] = useStateRH(String(adj.hnot || ''));
  const [faltas, setFaltas] = useStateRH(adj.faltas && adj.faltas.length ? adj.faltas.map((f) => ({ ...f })) : []);
  const fmt = (n) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (v) => parseFloat(String(v).replace(',', '.')) || 0;
  const addFalta = () => setFaltas((xs) => [...xs, { dia: '', just: false, anexo: '' }]);
  const setFaltaDia = (i, v) => setFaltas((xs) => xs.map((f, j) => (j === i ? { ...f, dia: v } : f)));
  const anexar = (i) => setFaltas((xs) => xs.map((f, j) => (j === i ? { ...f, just: true, anexo: 'atestado.pdf' } : f)));
  const limparAnexo = (i) => setFaltas((xs) => xs.map((f, j) => (j === i ? { ...f, just: false, anexo: '' } : f)));
  const delFalta = (i) => setFaltas((xs) => xs.filter((_, j) => j !== i));

  const vh = valorHora;
  const p50 = (api ? api.he50 : 0) * vh * 1.5;
  const p100 = (api ? api.he100 : 0) * vh * 2;
  const pnot = num(hnot) * vh * (night.pct / 100);
  const faltasNaoJust = faltas.filter((f) => !f.just).length;
  const descFaltas = viaja ? 0 : faltasNaoJust * diaria;
  const valorMin = valorHora / 60;
  const descAtr = viaja ? 0 : (parseInt(atrasoMin) || 0) * valorMin;
  const proventos = p50 + p100 + pnot;
  const descontos = descAtr + descFaltas;
  const base = colab ? parseFloat(colab.salario.replace(/[^\d]/g, '')) : 0;
  const valeColab = colab ? (colab.vale || 0) : 0;
  const liquido = base + 620 - 480 + proventos - descontos - valeColab;

  const field = { boxSizing: 'border-box', height: 42, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 6 };
  const linha = (label, val, color) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ color: t.muted }}>{label}</span><span style={{ fontWeight: 700, color: color || t.text }}>{val}</span></div>
  );
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(680px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>{rhInitials(colab.nome)}</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>{colab.nome}</div><div style={{ fontSize: 12.5, color: t.muted }}>{colab.salario} base · diária {fmt(diaria)} · hora {fmt(vh)}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {/* viajante */}
          <button onClick={() => setViaja((v) => !v)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 18, background: viaja ? t.accentSoft : t.elevated, border: `1px solid ${viaja ? frHexToRgba(t.accent, 0.4) : t.border}` }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: viaja ? t.accent : t.hover, color: viaja ? '#fff' : t.muted, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="briefcase" size={17} /></span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>Funcionário viajante</div><div style={{ fontSize: 11.5, color: t.muted }}>Sem registro de ponto — não desconta atraso nem falta.</div></div>
            <span style={{ width: 40, height: 23, borderRadius: 999, background: viaja ? t.accent : t.borderStrong, position: 'relative', transition: 'background .15s', flexShrink: 0 }}><span style={{ position: 'absolute', top: 2, left: viaja ? 19 : 2, width: 19, height: 19, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} /></span>
          </button>

          {/* proventos: horas extras (via ponto) + noturno (manual) */}
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 10 }}>Horas extras — automáticas via relógio de ponto</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div style={{ padding: '11px 13px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ ...lab, margin: 0 }}>HE 50%</span><Badge t={t} kind="blue">ponto</Badge></div>
              <div style={{ fontSize: 17, fontWeight: 850, color: t.text, marginTop: 6 }}>{api ? api.he50 : 0}<span style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>h</span></div>
              <div style={{ fontSize: 11, fontWeight: 700, color: uiTone(t, 'green').fg, marginTop: 3 }}>+ {fmt(p50)}</div>
            </div>
            <div style={{ padding: '11px 13px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ ...lab, margin: 0 }}>HE 100%</span><Badge t={t} kind="blue">ponto</Badge></div>
              <div style={{ fontSize: 17, fontWeight: 850, color: t.text, marginTop: 6 }}>{api ? api.he100 : 0}<span style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>h</span></div>
              <div style={{ fontSize: 11, fontWeight: 700, color: uiTone(t, 'green').fg, marginTop: 3 }}>+ {fmt(p100)}</div>
            </div>
            <div><label style={lab}>Horas noturnas</label><input value={hnot} onChange={(e) => setHnot(e.target.value.replace(/[^0-9.,]/g, ''))} inputMode="decimal" placeholder="0h" style={field} /><div style={{ fontSize: 11, fontWeight: 700, color: uiTone(t, 'green').fg, marginTop: 5 }}>+ {fmt(pnot)} <span style={{ color: t.faint }}>({night.pct}%)</span></div></div>
          </div>

          {!viaja && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div><label style={lab}>Atraso (minutos)</label><input value={atrasoMin} onChange={(e) => setAtrasoMin(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" style={field} /><div style={{ fontSize: 11, fontWeight: 700, color: t.muted, marginTop: 5 }}>minuto = {fmt(valorMin)}</div></div>
              <div><label style={lab}>Desconto do atraso (R$)</label><div style={{ ...field, display: 'flex', alignItems: 'center', background: t.elevated, color: descAtr ? uiTone(t, 'red').fg : t.muted, fontWeight: 800 }}>{descAtr ? '- ' + fmt(descAtr) : fmt(0)}</div><div style={{ fontSize: 11, fontWeight: 700, color: t.faint, marginTop: 5 }}>{parseInt(atrasoMin) || 0} min × {fmt(valorMin)}</div></div>
            </div>
          )}

          {!viaja && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase' }}>Faltas no mês</span>
                <button onClick={addFalta} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: t.accentText, padding: '5px 10px', borderRadius: 8, background: t.accentSoft }}><Icon name="plus" size={14} /> Registrar falta</button>
              </div>
              {faltas.length === 0 && <div style={{ padding: '14px', textAlign: 'center', fontSize: 12.5, color: t.faint, border: `1px dashed ${t.borderStrong}`, borderRadius: 10, marginBottom: 8 }}>Sem faltas registradas.</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {faltas.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: f.just ? uiTone(t, 'green').bg : t.elevated, border: `1px solid ${f.just ? frHexToRgba('#10b981', 0.3) : t.border}` }}>
                    <input value={f.dia} onChange={(e) => setFaltaDia(i, e.target.value)} placeholder="Dia (12/06)" style={{ ...field, height: 34, width: 120, fontSize: 12.5 }} />
                    {f.just
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: uiTone(t, 'green').fg, flex: 1 }}><Icon name="file" size={14} /> {f.anexo} · justificada</span>
                      : <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: uiTone(t, 'red').fg }}>Desconto: {fmt(diaria)}</span>}
                    {f.just
                      ? <button onClick={() => limparAnexo(i)} style={{ all: 'unset', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: t.muted, padding: '6px 10px', borderRadius: 8, border: `1px solid ${t.border}` }}>Remover</button>
                      : <button onClick={() => anexar(i)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: t.accentText, padding: '6px 10px', borderRadius: 8, border: `1px solid ${t.border}` }}><Icon name="upload" size={13} /> Anexar atestado</button>}
                    <button onClick={() => delFalta(i)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={14} /></button>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: t.muted, marginTop: 10, lineHeight: 1.5 }}>Faltas com atestado anexado <b style={{ color: uiTone(t, 'green').fg }}>não são descontadas</b>.</div>
            </div>
          )}

          {/* resumo automático */}
          <div style={{ marginTop: 20, padding: 16, borderRadius: 14, background: t.elevated, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {linha('Salário base', fmt(base))}
            {linha('Benefícios', '+ ' + fmt(620), uiTone(t, 'green').fg)}
            {proventos > 0 && linha('Horas extras + noturno', '+ ' + fmt(proventos), uiTone(t, 'green').fg)}
            {linha('INSS + IRRF', '- ' + fmt(480), uiTone(t, 'red').fg)}
            {valeColab > 0 && linha('Vale (abatido)', '- ' + fmt(valeColab), uiTone(t, 'red').fg)}
            {descontos > 0 && linha('Atrasos + faltas', '- ' + fmt(descontos), uiTone(t, 'red').fg)}
            <div style={{ height: 1, background: t.border, margin: '4px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>Líquido a receber</span><span style={{ fontSize: 20, fontWeight: 850, color: t.accentText }}>{fmt(liquido)}</span></div>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end' }}>
          <Btn t={t} icon="check" onClick={() => onSave({ viaja, atrasoMin: parseInt(atrasoMin) || 0, descAtraso: descAtr, hnot: num(hnot), faltas })}>Salvar cálculo</Btn>
        </div>
      </div>
    </div>
  );
}

function PontoEditModal({ t, row, jornadas, onClose, onSave }) {
  const [jornada, setJornada] = useStateRH(row.jornada);
  const [ent, setEnt] = useStateRH(row.ent === '—' ? '' : row.ent);
  const [almIni, setAlmIni] = useStateRH(row.almIni === '—' ? '' : row.almIni);
  const [almFim, setAlmFim] = useStateRH(row.almFim === '—' ? '' : row.almFim);
  const [sai, setSai] = useStateRH(row.sai === '—' ? '' : row.sai);
  const [vale, setVale] = useStateRH(!!row.vale);
  const [valeVal, setValeVal] = useStateRH(String(row.valeVal || ''));
  const field = { boxSizing: 'border-box', height: 42, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 6 };
  const save = () => onSave({ jornada, ent: ent || '—', almIni: almIni || '—', almFim: almFim || '—', sai: sai || '—', vale, valeVal: vale ? (parseInt(valeVal) || 0) : 0 });
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>{rhInitials(row.nome)}</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>{row.nome}</div><div style={{ fontSize: 12.5, color: t.muted }}>Editar ponto e jornada · {row.setor}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={lab}>Jornada</label>
            <div style={{ position: 'relative' }}>
              <select value={jornada} onChange={(e) => setJornada(e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 34, cursor: 'pointer' }}>
                {jornadas.map((j) => <option key={j.id} value={j.id}>{j.nome}{j.ini !== '—' ? ` (${j.ini}–${j.fim})` : ''}</option>)}
              </select>
              <Icon name="chevronDown" size={16} style={{ position: 'absolute', right: 12, top: 13, color: t.muted, pointerEvents: 'none' }} />
            </div>
          </div>
          <label style={lab}>Horários do dia</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div><div style={{ fontSize: 11, color: t.muted, marginBottom: 5 }}>Entrada</div><input value={ent} onChange={(e) => setEnt(e.target.value)} placeholder="08:00" style={field} /></div>
            <div><div style={{ fontSize: 11, color: t.muted, marginBottom: 5 }}>Saída p/ almoço</div><input value={almIni} onChange={(e) => setAlmIni(e.target.value)} placeholder="12:00" style={field} /></div>
            <div><div style={{ fontSize: 11, color: t.muted, marginBottom: 5 }}>Volta do almoço</div><input value={almFim} onChange={(e) => setAlmFim(e.target.value)} placeholder="13:00" style={field} /></div>
            <div><div style={{ fontSize: 11, color: t.muted, marginBottom: 5 }}>Saída</div><input value={sai} onChange={(e) => setSai(e.target.value)} placeholder="17:00" style={field} /></div>
          </div>
          <button onClick={() => setVale((v) => !v)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: vale ? t.accentSoft : t.elevated, border: `1px solid ${vale ? frHexToRgba(t.accent, 0.4) : t.border}` }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: vale ? t.accent : t.hover, color: vale ? '#fff' : t.muted, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="cart" size={17} /></span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>Recebe vale</div><div style={{ fontSize: 11.5, color: t.muted }}>Vale-transporte / alimentação opcional.</div></div>
            <span style={{ width: 40, height: 23, borderRadius: 999, background: vale ? t.accent : t.borderStrong, position: 'relative', transition: 'background .15s', flexShrink: 0 }}><span style={{ position: 'absolute', top: 2, left: vale ? 19 : 2, width: 19, height: 19, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} /></span>
          </button>
          {vale && (
            <div style={{ marginTop: 12 }}>
              <label style={lab}>Valor do vale (R$ / mês)</label>
              <input value={valeVal} onChange={(e) => setValeVal(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="600" style={{ ...field, maxWidth: 200 }} />
            </div>
          )}
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn t={t} icon="check" onClick={save}>Salvar</Btn>
        </div>
      </div>
    </div>
  );
}

const DEBITO_TIPOS = [
  { id: 'vale', nome: 'Vale / Adiantamento', icon: 'cart', kind: 'blue' },
  { id: 'emprestimo', nome: 'Empréstimo', icon: 'barChart', kind: 'accent' },
  { id: 'avaria', nome: 'Avaria de equipamento', icon: 'alert', kind: 'red' },
  { id: 'uniforme', nome: 'Uniforme / EPI', icon: 'box', kind: 'amber' },
  { id: 'outro', nome: 'Outro', icon: 'file', kind: 'gray' },
];
const RH_DEBITOS_SEED = [
  { id: 1, colab: 'Mirela Fantim', setor: 'Montagem', tipo: 'vale', desc: 'Adiantamento salarial', total: 600, parcelas: 1, pagas: 0, valorParc: 600, data: '05/06/2025', por: 'Bruno Teixeira' },
  { id: 2, colab: 'Vitor Ladeia', setor: 'Elétrica', tipo: 'emprestimo', desc: 'Empréstimo pessoal', total: 1500, parcelas: 3, pagas: 1, valorParc: 500, data: '01/05/2025', por: 'Bruno Teixeira' },
  { id: 3, colab: 'Valdecir Bonatto', setor: 'Usinagem', tipo: 'avaria', desc: 'Quebra de paquímetro digital', total: 320, parcelas: 2, pagas: 0, valorParc: 160, data: '10/06/2025', por: 'Lincoln Gomes' },
  { id: 4, colab: 'Davi Miranda', setor: 'Produção 3D', tipo: 'uniforme', desc: '2 conjuntos de uniforme', total: 180, parcelas: 1, pagas: 1, valorParc: 180, data: '20/05/2025', por: 'Bruno Teixeira' },
];

function RHDebitos({ t }) {
  const [items, setItems] = useStateRH(RH_DEBITOS_SEED.map((d) => ({ ...d })));
  const [novo, setNovo] = useStateRH(false);
  const fmt = (n) => 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tipoInfo = (id) => DEBITO_TIPOS.find((x) => x.id === id) || DEBITO_TIPOS[4];
  const saldo = (d) => d.total - d.pagas * d.valorParc;
  const quitado = (d) => d.pagas >= d.parcelas;
  const pagarParcela = (id) => setItems((xs) => xs.map((d) => (d.id === id && d.pagas < d.parcelas ? { ...d, pagas: d.pagas + 1 } : d)));
  const remover = (id) => setItems((xs) => xs.filter((d) => d.id !== id));
  const totalAberto = items.reduce((a, d) => a + saldo(d), 0);
  const ativos = items.filter((d) => !quitado(d));

  return (
    <div>
      <PageHeader t={t} title="Débitos" subtitle="Vales, adiantamentos, empréstimos e avarias — desconto em folha" actions={<Btn t={t} icon="plus" onClick={() => setNovo(true)}>Novo débito</Btn>} />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} icon="out" label="Total em aberto" value={fmt(totalAberto)} sub={`${ativos.length} débitos ativos`} kind="red" />
        <KPI t={t} icon="users" label="Colaboradores" value={new Set(ativos.map((d) => d.colab)).size} sub="com débito" kind="amber" />
        <KPI t={t} icon="cart" label="Vales no mês" value={fmt(items.filter((d) => d.tipo === 'vale').reduce((a, d) => a + d.total, 0))} kind="blue" />
        <KPI t={t} icon="check" label="Quitados" value={items.filter(quitado).length} kind="green" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
        {items.map((d) => {
          const ti = tipoInfo(d.tipo);
          const pct = Math.round((d.pagas / d.parcelas) * 100);
          const ok = quitado(d);
          return (
            <Card t={t} key={d.id} style={{ padding: 18, opacity: ok ? 0.72 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, background: uiTone(t, ti.kind).bg, color: uiTone(t, ti.kind).fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={ti.icon} size={19} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{d.colab}</span>
                    {ok ? <Badge t={t} kind="green" dot>Quitado</Badge> : <Badge t={t} kind={ti.kind}>{ti.nome}</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{d.setor} · {d.desc}</div>
                </div>
                <button onClick={() => remover(d.id)} title="Remover" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = uiTone(t, 'red').fg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '16px 0 12px' }}>
                <div><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>TOTAL</div><div style={{ fontSize: 15, fontWeight: 850, color: t.text, marginTop: 2 }}>{fmt(d.total)}</div></div>
                <div><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>JÁ PAGO</div><div style={{ fontSize: 15, fontWeight: 850, color: uiTone(t, 'green').fg, marginTop: 2 }}>{fmt(d.pagas * d.valorParc)}</div></div>
                <div><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>FALTA PAGAR</div><div style={{ fontSize: 15, fontWeight: 850, color: ok ? uiTone(t, 'green').fg : uiTone(t, 'red').fg, marginTop: 2 }}>{fmt(saldo(d))}</div></div>
                <div><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>PARC. RESTAM</div><div style={{ fontSize: 15, fontWeight: 850, color: t.text, marginTop: 2 }}>{d.parcelas - d.pagas}<span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>/{d.parcelas}</span></div></div>
              </div>

              {!ok && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: uiTone(t, ti.kind).bg, marginBottom: 12 }}>
                  <Icon name="calendar" size={16} style={{ color: uiTone(t, ti.kind).fg, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: t.muted }}>Próxima parcela <b style={{ color: t.text }}>({d.pagas + 1}ª de {d.parcelas})</b></span>
                  <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 850, color: t.text }}>{fmt(d.valorParc)}</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.faint }}>{d.pagas} de {d.parcelas} parcelas pagas</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: ok ? uiTone(t, 'green').fg : t.accentText }}>{pct}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 6, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: ok ? uiTone(t, 'green').fg : t.accent }} /></div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 11, color: t.muted }}>Lançado {d.data} · {d.por}</span>
                {!ok && <button onClick={() => pagarParcela(d.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 800, background: t.accent, color: t.onAccent }}><Icon name="check" size={14} /> Descontar parcela</button>}
              </div>
            </Card>
          );
        })}
      </div>

      {novo && <RHDebitoModal t={t} onClose={() => setNovo(false)} onSave={(d) => { setItems((xs) => [{ ...d, id: Date.now(), pagas: 0, data: new Date().toLocaleDateString('pt-BR'), por: USER.name }, ...xs]); setNovo(false); }} />}
    </div>
  );
}

function RHDebitoModal({ t, onClose, onSave }) {
  const [colab, setColab] = useStateRH(RH_COLAB[0].nome);
  const [tipo, setTipo] = useStateRH('vale');
  const [desc, setDesc] = useStateRH('');
  const [total, setTotal] = useStateRH('');
  const [parcelas, setParcelas] = useStateRH('1');
  const nTotal = parseFloat(String(total).replace(',', '.')) || 0;
  const nParc = Math.max(1, parseInt(parcelas) || 1);
  const valorParc = nTotal / nParc;
  const valid = colab && nTotal > 0;
  const field = { boxSizing: 'border-box', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 };
  const setor = (RH_COLAB.find((c) => c.nome === colab) || {}).setor || '';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="out" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Novo débito</div><div style={{ fontSize: 12.5, color: t.muted }}>Lançar débito para desconto em folha.</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lab}>Colaborador</label>
            <div style={{ position: 'relative' }}>
              <select value={colab} onChange={(e) => setColab(e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 34, cursor: 'pointer' }}>
                {RH_COLAB.map((c) => <option key={c.id} value={c.nome}>{c.nome} · {c.setor}</option>)}
              </select>
              <Icon name="chevronDown" size={16} style={{ position: 'absolute', right: 13, top: 14, color: t.muted, pointerEvents: 'none' }} />
            </div>
          </div>
          <div>
            <label style={lab}>Tipo de débito</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DEBITO_TIPOS.map((dt) => {
                const on = tipo === dt.id;
                return <button key={dt.id} onClick={() => setTipo(dt.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: on ? uiTone(t, dt.kind).fg : t.elevated, color: on ? '#fff' : t.muted, border: `1px solid ${on ? uiTone(t, dt.kind).fg : t.border}` }}><Icon name={dt.icon} size={14} /> {dt.nome}</button>;
              })}
            </div>
          </div>
          <div><label style={lab}>Descrição</label><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex: Adiantamento salarial" style={field} /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={lab}>Valor total (R$)</label><input value={total} onChange={(e) => setTotal(e.target.value.replace(/[^0-9.,]/g, ''))} inputMode="decimal" placeholder="0,00" style={field} /></div>
            <div style={{ width: 120 }}><label style={lab}>Parcelas</label><input value={parcelas} onChange={(e) => setParcelas(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" style={field} /></div>
          </div>
          {nTotal > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 11, background: t.accentSoft, color: t.accentText, fontSize: 13, fontWeight: 700 }}><Icon name="calculator" size={16} /> {nParc}x de R$ {valorParc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} descontadas em folha</div>}
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <button onClick={() => valid && onSave({ colab, setor, tipo, desc: desc.trim() || tipoInfoNome(tipo), total: nTotal, parcelas: nParc, valorParc })} style={{ all: 'unset', boxSizing: 'border-box', cursor: valid ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: valid ? t.accent : t.elevated, color: valid ? t.onAccent : t.faint }}><Icon name="check" size={16} /> Lançar débito</button>
        </div>
      </div>
    </div>
  );
}
function tipoInfoNome(id) { const x = DEBITO_TIPOS.find((d) => d.id === id); return x ? x.nome : 'Outro'; }

function renderPageRH(active, props) {
  const t = frTokens(props.theme, RH_ACCENT, RH_ACCENT_T);
  const p = { ...props, t };
  if (active === 'rh-colab') return <RHColab {...p} />;
  if (active === 'rh-ponto') return <RHPonto {...p} />;
  if (active === 'rh-ferias') return <RHFerias {...p} />;
  if (active === 'rh-advert') return <RHAdvert {...p} />;
  if (active === 'rh-debitos') return <RHDebitos {...p} />;
  if (active === 'rh-folha') return <RHFolha {...p} />;
  return <RHPainel {...p} />;
}
window.renderPageRH = renderPageRH;
