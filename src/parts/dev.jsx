// dev.jsx — "Desenvolvedor" module: Painel, Chamados (board + detail + chat), Meus Trabalhos.
const { useState: useStateDV } = React;
const DV_ACCENT = '#0891b2', DV_ACCENT_T = '#22d3ee';

const DV_STATUS = {
  aberto:         { label: 'Aberto', kind: 'amber', next: 'analise', act: 'Iniciar análise' },
  analise:        { label: 'Em análise', kind: 'blue', next: 'desenvolvimento', act: 'Iniciar desenvolvimento' },
  desenvolvimento:{ label: 'Em desenvolvimento', kind: 'accent', next: 'concluido', act: 'Concluir chamado' },
  concluido:      { label: 'Concluído', kind: 'green' },
};
const DV_STEPS = ['Aberto', 'Em análise', 'Desenvolvimento', 'Concluído'];
const DV_CHAMADOS_SEED = [
  { id: 'TI-1042', titulo: 'Erro ao exportar relatório em PDF', prioridade: ['Alta', 'red'], status: 'desenvolvimento', data: '17/06 08:40', prog: 70,
    solicitante: 'Ana Paula', setor: 'Estoque', funcao: 'Gestora', desc: 'O botão PDF na página Relatórios não gera o arquivo.',
    chat: [{ de: 'user', txt: 'O PDF não baixa, dá erro.', h: '08:41', ts: 100 }, { de: 'dev', txt: 'Reproduzi aqui, é a fonte. Corrigindo agora.', h: '09:02', ts: 200 }, { de: 'user', txt: 'Beleza, aguardando! Mandei um print do erro.', h: '09:40', ts: 900, unread: true }] },
  { id: 'TI-1041', titulo: 'Adicionar filtro por tag em Produtos', prioridade: ['Baixa', 'blue'], status: 'aberto', data: '17/06 07:55', prog: 0,
    solicitante: 'Carlos Moura', setor: 'Usinagem', funcao: 'Operador', desc: 'Seria útil filtrar o catálogo por etiqueta.', chat: [{ de: 'user', txt: 'Consegue adicionar esse filtro?', h: '07:55', ts: 500, unread: true }, { de: 'user', txt: 'Ajudaria bastante no dia a dia.', h: '07:56', ts: 520, unread: true }] },
  { id: 'TI-1039', titulo: 'Lentidão na busca de produtos', prioridade: ['Média', 'amber'], status: 'analise', data: '16/06 15:20', prog: 20,
    solicitante: 'Bruno Teixeira', setor: 'Diretoria', funcao: 'Admin', desc: 'A busca demora ~5s com muitos itens.',
    chat: [{ de: 'user', txt: 'Tá bem lento pra buscar.', h: '15:22', ref: 'TI-1039', ts: 300 }] },
  { id: 'TI-1031', titulo: 'Coluna de lote nas entradas', prioridade: ['Baixa', 'blue'], status: 'concluido', data: '14/06 10:05', prog: 100,
    solicitante: 'Júlia Ramos', setor: 'Qualidade', funcao: 'Auditora', desc: 'Solicitação de nova coluna.',
    chat: [{ de: 'dev', txt: 'Implementado e publicado ✅', h: '11:30', ts: 50 }] },
];

// ---------- Painel ----------
function DevPainel({ t, chamados }) {
  const abertos = chamados.filter((c) => c.status !== 'concluido').length;
  const emDev = chamados.filter((c) => c.status === 'desenvolvimento').length;
  const resolv = chamados.filter((c) => c.status === 'concluido').length;
  const meses = [{ label: 'Seg', v: 4 }, { label: 'Ter', v: 7, accent: true }, { label: 'Qua', v: 5 }, { label: 'Qui', v: 9, accent: true }, { label: 'Sex', v: 6 }];
  const fila = chamados.filter((c) => c.status === 'desenvolvimento' || c.status === 'analise');
  return (
    <div>
      <PageHeader t={t} title="Painel do Desenvolvedor" subtitle="Visão geral dos chamados e do trabalho em andamento." />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} icon="file" label="Chamados abertos" value={abertos} kind="amber" />
        <KPI t={t} icon="terminal" label="Em desenvolvimento" value={emDev} kind="accent" />
        <KPI t={t} icon="check" label="Resolvidos no mês" value="31" kind="green" />
        <KPI t={t} icon="clock" label="Tempo médio" value="1,8 d" sub="até resolver" kind="blue" />
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <Card t={t} style={{ padding: 22, flex: 2, minWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Chamados resolvidos (semana)</div>
            <Badge t={t} kind="green" dot>+15% vs. anterior</Badge>
          </div>
          <BarChart t={t} data={meses} />
        </Card>
        <Card t={t} style={{ padding: 22, flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 16 }}>Trabalhando agora</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {fila.length === 0 && <div style={{ fontSize: 13, color: t.muted }}>Nada em andamento.</div>}
            {fila.map((c) => (
              <div key={c.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 12.5, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.titulo}</span><span style={{ fontSize: 11, fontWeight: 700, color: t.muted }}>{c.prog}%</span></div>
                <div style={{ height: 6, borderRadius: 5, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${c.prog}%`, borderRadius: 5, background: t.accent }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- Chamado detail (status + progress + chat) ----------
function DevChamadoDetail({ t, c, onClose, onAdvance, onProgress, onReply, focus, onToggleFocus }) {
  const [msg, setMsg] = useStateDV('');
  const st = DV_STATUS[c.status];
  const stepIdx = ['aberto', 'analise', 'desenvolvimento', 'concluido'].indexOf(c.status);
  const send = () => { if (!msg.trim()) return; onReply(c.id, msg.trim()); setMsg(''); };
  const W = focus ? 'min(1000px,98vw)' : 'min(680px,96vw)';
  const H = focus ? '96vh' : '92vh';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: focus ? t.panel : 'rgba(8,10,16,.6)', backdropFilter: focus ? 'none' : 'blur(2px)', display: 'grid', placeItems: 'center', padding: focus ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: W, maxHeight: H, height: focus ? '100%' : 'auto', display: 'flex', flexDirection: 'column', background: t.panel, border: focus ? 'none' : `1px solid ${t.borderStrong}`, borderRadius: focus ? 0 : 20, boxShadow: focus ? 'none' : t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: t.muted }}>{c.id}</span>
            <Badge t={t} kind={c.prioridade[1]} dot>{c.prioridade[0]}</Badge>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 8, background: uiTone(t, st.kind).bg, color: uiTone(t, st.kind).fg, textTransform: 'uppercase' }}>{st.label}</span>
            <button onClick={onToggleFocus} title={focus ? 'Sair do foco' : 'Modo foco'} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: focus ? t.accentText : t.muted, border: `1px solid ${t.border}` }}><Icon name={focus ? 'chevronsRight' : 'eye'} size={15} /></button>
            <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
          </div>
          <div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{c.titulo}</div>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {/* stepper */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            {DV_STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, background: i === stepIdx ? t.accent : i < stepIdx ? uiTone(t, 'green').fg : t.elevated, color: i <= stepIdx ? '#fff' : t.faint, border: i <= stepIdx ? 'none' : `2px solid ${t.border}` }}>{i < stepIdx ? <Icon name="check" size={13} /> : i + 1}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: i <= stepIdx ? t.text : t.faint, whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < DV_STEPS.length - 1 && <span style={{ flex: 1, height: 2, background: i < stepIdx ? uiTone(t, 'green').fg : t.border, margin: '0 6px', marginTop: -16 }} />}
              </React.Fragment>
            ))}
          </div>
          {/* solicitante */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}`, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>{c.solicitante.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{c.solicitante}</div><div style={{ fontSize: 11.5, color: t.muted }}>{c.setor} · {c.funcao} · {c.data}</div></div>
          </div>
          <div style={{ fontSize: 13.5, color: t.text, lineHeight: 1.5, marginBottom: 18 }}>{c.desc}</div>
          {/* progress control */}
          {c.status !== 'concluido' && c.status !== 'aberto' && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: t.muted, marginBottom: 7 }}><span>PROGRESSO</span><span style={{ color: t.accentText }}>{c.prog}%</span></div>
              <input type="range" min="0" max="100" value={c.prog} onChange={(e) => onProgress(c.id, parseInt(e.target.value))} style={{ width: '100%', accentColor: t.accent }} />
            </div>
          )}
          {/* chat */}
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 10 }}>Conversa com o solicitante</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {c.chat.length === 0 && <div style={{ fontSize: 12.5, color: t.faint }}>Sem mensagens ainda.</div>}
            {c.chat.map((m, i) => { const mine = m.de === 'dev'; return (
              <div key={i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '76%' }}>
                  <div style={{ padding: '9px 13px', borderRadius: 14, borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4, background: mine ? t.accent : t.elevated, color: mine ? '#fff' : t.text, fontSize: 13.5, lineHeight: 1.45 }}>{m.txt}</div>
                  <div style={{ fontSize: 10, color: t.faint, marginTop: 3, textAlign: mine ? 'right' : 'left' }}>{mine ? 'Você' : c.solicitante} · {m.h}</div>
                </div>
              </div>
            ); })}
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 9 }}>
            <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Responder ao solicitante…" style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 12, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={send} style={{ all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: t.accent, color: '#fff', flexShrink: 0 }}><Icon name="send" size={18} /></button>
          </div>
          {st.next && <Btn t={t} icon={c.status === 'desenvolvimento' ? 'check' : 'printer'} onClick={() => onAdvance(c.id)}>{st.act}</Btn>}
        </div>
      </div>
    </div>
  );
}

function DevChamados({ t, chamados, setChamados, scripts, setScripts }) {
  const [tab, setTab] = useStateDV('novos');
  const [openId, setOpenId] = useStateDV(null);
  const [focus, setFocus] = useStateDV(false);
  const [scriptsOpen, setScriptsOpen] = useStateDV(false);
  const advance = (id) => setChamados((xs) => xs.map((x) => (x.id === id ? { ...x, status: DV_STATUS[x.status].next, prog: DV_STATUS[x.status].next === 'concluido' ? 100 : DV_STATUS[x.status].next === 'desenvolvimento' ? Math.max(x.prog, 10) : x.prog } : x)));
  const progress = (id, v) => setChamados((xs) => xs.map((x) => (x.id === id ? { ...x, prog: v } : x)));
  const reply = (id, txt) => setChamados((xs) => xs.map((x) => (x.id === id ? { ...x, chat: [...x.chat, { de: 'dev', txt, h: 'agora' }] } : x)));
  const groups = {
    novos: chamados.filter((c) => c.status === 'aberto' || c.status === 'analise'),
    dev: chamados.filter((c) => c.status === 'desenvolvimento'),
    feitos: chamados.filter((c) => c.status === 'concluido'),
  };
  const tabs = [['novos', 'Novos'], ['dev', 'Em desenvolvimento'], ['feitos', 'Concluídos']];
  const view = groups[tab];
  const cur = chamados.find((c) => c.id === openId);
  return (
    <div>
      <PageHeader t={t} title="Chamados" subtitle="Solicitações de suporte recebidas dos setores."
        actions={<Btn t={t} kind="ghost" icon="terminal" onClick={() => setScriptsOpen(true)}>Meus Scripts</Btn>} />
      <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}`, marginBottom: 22 }}>
        {tabs.map(([k, label]) => { const on = tab === k; return (
          <button key={k} onClick={() => setTab(k)} style={{ all: 'unset', cursor: 'pointer', height: 38, padding: '0 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? '#fff' : t.muted }}>{label} <span style={{ opacity: .6, fontWeight: 800 }}>({groups[k].length})</span></button>
        ); })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
        {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada por aqui" sub="Nenhum chamado neste status." /></Card></div>}
        {view.map((c) => { const st = DV_STATUS[c.status]; return (
          <Card t={t} key={c.id} hover style={{ padding: 16, cursor: 'pointer' }}>
            <div onClick={() => setOpenId(c.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 800, color: t.muted }}>{c.id}</span><Badge t={t} kind={c.prioridade[1]} dot>{c.prioridade[0]}</Badge></div>
                <Badge t={t} kind={st.kind} dot>{st.label}</Badge>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text, margin: '11px 0 10px', lineHeight: 1.3 }}>{c.titulo}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 10.5 }}>{c.solicitante.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
                <span style={{ fontSize: 12, color: t.muted }}>{c.solicitante} · {c.setor}</span>
              </div>
              {c.status === 'desenvolvimento' && (
                <div style={{ marginTop: 12 }}><div style={{ height: 5, borderRadius: 5, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${c.prog}%`, borderRadius: 5, background: t.accent }} /></div></div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
              <span style={{ fontSize: 11.5, color: t.faint }}>{c.data}</span>
              <button onClick={() => setOpenId(c.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: t.accentText, padding: '6px 10px', borderRadius: 9, background: t.accentSoft }}>Abrir {c.chat.length > 0 && `· ${c.chat.length}`} <Icon name="chevronRight" size={14} /></button>
            </div>
          </Card>
        ); })}
      </div>
      {cur && <DevChamadoDetail t={t} c={cur} onClose={() => { setOpenId(null); setFocus(false); }} onAdvance={advance} onProgress={progress} onReply={reply} focus={focus} onToggleFocus={() => setFocus((f) => !f)} />}
      {scriptsOpen && <DevScriptsModal t={t} scripts={scripts} onClose={() => setScriptsOpen(false)} onSave={setScripts} />}
    </div>
  );
}

// ---------- Meus Trabalhos ----------
function DevTrabalhos({ t, chamados, setChamados }) {
  const ativos = chamados.filter((c) => c.status === 'desenvolvimento' || c.status === 'analise');
  const progress = (id, v) => setChamados((xs) => xs.map((x) => (x.id === id ? { ...x, prog: v } : x)));
  return (
    <div>
      <PageHeader t={t} title="Meus Trabalhos" subtitle="Chamados que você está desenvolvendo agora." />
      {ativos.length === 0 ? (
        <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada em andamento" sub="Aceite um chamado para começar a trabalhar." /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ativos.map((c) => { const st = DV_STATUS[c.status]; return (
            <Card t={t} key={c.id} style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ width: 42, height: 42, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="terminal" size={20} /></span>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 800, color: t.muted }}>{c.id}</span><Badge t={t} kind={st.kind} dot>{st.label}</Badge></div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginTop: 5 }}>{c.titulo}</div>
                  <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{c.solicitante} · {c.setor}</div>
                </div>
                <div style={{ width: 220, maxWidth: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: t.muted, marginBottom: 6 }}><span>Progresso</span><span style={{ color: t.accentText }}>{c.prog}%</span></div>
                  <input type="range" min="0" max="100" value={c.prog} onChange={(e) => progress(c.id, parseInt(e.target.value))} style={{ width: '100%', accentColor: t.accent }} />
                </div>
              </div>
            </Card>
          ); })}
        </div>
      )}
    </div>
  );
}

// ---------- Scripts pessoais do dev (anotação particular, global) ----------
function DevScriptsModal({ t, scripts, onClose, onSave }) {
  const [list, setList] = useStateDV(scripts || []);
  const [tit, setTit] = useStateDV('');
  const [code, setCode] = useStateDV('');
  const add = () => { if (!code.trim()) return; setList((xs) => [...xs, { titulo: tit.trim() || 'Snippet', code: code.trim() }]); setTit(''); setCode(''); };
  const del = (i) => setList((xs) => xs.filter((_, j) => j !== i));
  const copy = (txt) => { try { navigator.clipboard && navigator.clipboard.writeText(txt); } catch (e) {} };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(640px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="terminal" size={18} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>Meus Scripts & Anotações</div><div style={{ fontSize: 12, color: t.muted }}>Bloco particular do dev — consulte quando precisar.</div></div>
          <button onClick={() => { onSave(list); onClose(); }} style={{ all: 'unset', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: t.accentText, padding: '7px 12px', borderRadius: 9, background: t.accentSoft }}>Salvar</button>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((s, i) => (
            <div key={i} style={{ borderRadius: 12, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: t.elevated }}>
                <Icon name="terminal" size={14} style={{ color: t.accentText }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: t.text, flex: 1 }}>{s.titulo}</span>
                <button onClick={() => copy(s.code)} title="Copiar" style={{ all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="copy" size={14} /></button>
                <button onClick={() => del(i)} title="Excluir" style={{ all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="trash" size={14} /></button>
              </div>
              <pre style={{ margin: 0, padding: '12px 14px', fontSize: 12.5, fontFamily: 'monospace', color: t.text, background: t.panel, overflowX: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{s.code}</pre>
            </div>
          ))}
          {list.length === 0 && <div style={{ fontSize: 13, color: t.faint, textAlign: 'center', padding: 10 }}>Nenhum snippet ainda.</div>}
          <div style={{ borderRadius: 12, border: `1px dashed ${t.borderStrong}`, padding: 12 }}>
            <input value={tit} onChange={(e) => setTit(e.target.value)} placeholder="Título do snippet (opcional)" style={{ boxSizing: 'border-box', width: '100%', height: 38, borderRadius: 9, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 8 }} />
            <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={4} placeholder="Cole aqui o código / anotação técnica…" style={{ boxSizing: 'border-box', width: '100%', borderRadius: 9, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '10px 12px', fontSize: 12.5, fontFamily: 'monospace', outline: 'none', resize: 'vertical' }} />
            <button onClick={add} style={{ all: 'unset', cursor: 'pointer', marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: t.accent, color: '#fff' }}><Icon name="plus" size={15} /> Adicionar snippet</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Chat centralizado ----------
function DevChat({ t, chamados, setChamados }) {
  const base = chamados.filter((c) => c.chat.length > 0 || c.status !== 'concluido');
  const lastTs = (c) => c.chat.reduce((m, x) => Math.max(m, x.ts || 0), 0);
  const convs = [...base].sort((a, b) => lastTs(b) - lastTs(a));
  const [sel, setSel] = useStateDV(convs[0] ? convs[0].id : null);
  const [msg, setMsg] = useStateDV('');
  const [rec, setRec] = useStateDV(0);
  const [lightbox, setLightbox] = useStateDV(null);
  const cur = chamados.find((c) => c.id === sel);
  const unread = (c) => c.chat.filter((m) => m.de === 'user' && m.unread).length;
  const markRead = (id) => setChamados((xs) => xs.map((x) => (x.id === id ? { ...x, chat: x.chat.map((m) => (m.unread ? { ...m, unread: false } : m)) } : x)));
  const openConv = (id) => { setSel(id); markRead(id); };
  const push = (m) => setChamados((xs) => xs.map((x) => (x.id === cur.id ? { ...x, chat: [...x.chat, { de: 'dev', h: 'agora', ts: Date.now(), ...m }] } : x)));
  const send = () => { if (!msg.trim() || !cur) return; push({ txt: msg.trim() }); setMsg(''); };
  const onFile = (file) => { if (!file || !cur) return; const img = (file.type || '').indexOf('image') === 0; const r = new FileReader(); r.onload = () => push({ kind: 'file', nome: file.name, tipo: file.type, url: r.result, img }); r.readAsDataURL(file); };
  const openFile = (m) => { if (m.img) setLightbox(m.url); else { const a = document.createElement('a'); a.href = m.url; a.download = m.nome || 'arquivo'; a.target = '_blank'; a.click(); } };
  React.useEffect(() => { if (!rec) return; const id = setInterval(() => setRec((s) => s + 1), 1000); return () => clearInterval(id); }, [rec]);
  const stopRec = (sendIt) => { if (sendIt && rec > 0) push({ kind: 'audio', dur: rec }); setRec(0); };
  const fmtDur = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const last = (c) => { const m = c.chat[c.chat.length - 1]; if (!m) return 'Sem mensagens'; return m.kind === 'audio' ? '🎤 Áudio' : m.kind === 'file' ? (m.img ? '📷 Imagem' : '📎 Arquivo') : m.txt; };

  return (
    <div>
      <PageHeader t={t} title="Chat" subtitle="Responda todas as conversas dos chamados em um só lugar." />
      <Card t={t} style={{ padding: 0, overflow: 'hidden', display: 'flex', height: 'min(640px, 74vh)' }}>
        {/* conversation list */}
        <div className="fr-scroll" style={{ width: 290, flexShrink: 0, borderRight: `1px solid ${t.border}`, overflowY: 'auto' }}>
          {convs.map((c) => { const on = sel === c.id; const u = unread(c); return (
            <button key={c.id} onClick={() => openConv(c.id)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', gap: 11, padding: '13px 16px', borderBottom: `1px solid ${t.border}`, background: on ? t.accentSoft : 'transparent' }}>
              <span style={{ width: 40, height: 40, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12.5, flexShrink: 0 }}>{c.solicitante.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 13.5, fontWeight: u ? 800 : 700, color: t.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.solicitante}</span>
                  {u > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: uiTone(t, 'green').fg, color: '#fff', fontSize: 10.5, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{u}</span><span style={{ width: 9, height: 9, borderRadius: '50%', background: uiTone(t, 'green').fg }} /></span>}</div>
                <div style={{ fontSize: 11.5, color: u ? t.text : t.muted, fontWeight: u ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{last(c)}</div>
                <div style={{ fontSize: 10, color: t.faint, marginTop: 2, fontFamily: 'monospace' }}>{c.id} · {c.titulo}</div>
              </div>
            </button>
          ); })}
        </div>
        {/* messages */}
        {cur ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 38, height: 38, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>{cur.solicitante.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{cur.solicitante}</div><div style={{ fontSize: 11.5, color: t.muted }}>{cur.setor} · online</div></div>
            </div>
            <div className="fr-scroll" style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 10, background: t.elevated }}>
              {cur.chat.length === 0 && <div style={{ fontSize: 13, color: t.faint, textAlign: 'center', marginTop: 20 }}>Inicie a conversa.</div>}
              {cur.chat.map((m, i) => { const mine = m.de === 'dev'; const refC = m.ref && chamados.find((x) => x.id === m.ref); return (
                <div key={i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '76%' }}>
                    <div style={{ padding: m.kind === 'file' && m.img ? 4 : '8px 11px', borderRadius: 14, borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4, background: mine ? t.accent : t.panel, color: mine ? '#fff' : t.text, fontSize: 13.5, lineHeight: 1.45, boxShadow: '0 1px 2px rgba(0,0,0,.08)' }}>
                      {/* chamado reference */}
                      {refC && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 9, marginBottom: 7, background: mine ? 'rgba(255,255,255,.18)' : t.elevated, borderLeft: `3px solid ${mine ? '#fff' : uiTone(t, refC.prioridade[1]).fg}` }}>
                          <Icon name="file" size={14} style={{ color: mine ? '#fff' : t.accentText, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}><div style={{ fontSize: 10.5, fontWeight: 800, fontFamily: 'monospace', color: mine ? '#fff' : t.accentText }}>{refC.id}</div><div style={{ fontSize: 11, color: mine ? 'rgba(255,255,255,.85)' : t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{refC.titulo}</div></div>
                        </div>
                      )}
                      {m.kind === 'audio' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 170 }}>
                          <span style={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, background: mine ? 'rgba(255,255,255,.22)' : t.accentSoft, color: mine ? '#fff' : t.accentText }}><Icon name="play" size={15} /></span>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>{[6, 12, 8, 16, 10, 14, 7, 13, 9, 5, 11, 8].map((h, k) => <span key={k} style={{ width: 2.5, height: h, borderRadius: 2, background: mine ? 'rgba(255,255,255,.7)' : t.accentText }} />)}</div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: mine ? 'rgba(255,255,255,.9)' : t.muted }}>{fmtDur(m.dur)}</span>
                        </div>
                      ) : m.kind === 'file' ? (
                        m.img ? <img src={m.url} alt={m.nome} onClick={() => openFile(m)} style={{ display: 'block', maxWidth: 220, borderRadius: 11, cursor: 'pointer' }} />
                          : <button onClick={() => openFile(m)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px 4px 0', minWidth: 160 }}><span style={{ width: 36, height: 36, borderRadius: 9, display: 'grid', placeItems: 'center', flexShrink: 0, background: mine ? 'rgba(255,255,255,.2)' : t.accentSoft, color: mine ? '#fff' : t.accentText }}><Icon name="file" size={18} /></span><span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.nome}</span><span style={{ fontSize: 10.5, opacity: .75, textDecoration: 'underline' }}>Abrir arquivo</span></span></button>
                      ) : m.txt}
                    </div>
                    <div style={{ fontSize: 10, color: t.faint, marginTop: 3, textAlign: mine ? 'right' : 'left' }}>{mine ? 'Você' : cur.solicitante} · {m.h}</div>
                  </div>
                </div>
              ); })}
            </div>
            {/* input bar */}
            <div style={{ padding: 12, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 9 }}>
              {rec > 0 ? (
                <React.Fragment>
                  <button onClick={() => stopRec(false)} title="Cancelar" style={{ all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}><Icon name="trash" size={18} /></button>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 16px', borderRadius: 12, background: uiTone(t, 'red').bg }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: uiTone(t, 'red').fg, animation: 'frPing 1.4s ease-in-out infinite' }} />
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>Gravando… {fmtDur(rec)}</span>
                  </div>
                  <button onClick={() => stopRec(true)} title="Enviar áudio" style={{ all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: t.accent, color: '#fff', flexShrink: 0 }}><Icon name="send" size={18} /></button>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <label title="Anexar arquivo" style={{ cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}`, flexShrink: 0 }}>
                    <input type="file" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files[0])} />
                    <Icon name="paperclip" size={18} />
                  </label>
                  <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Escreva uma mensagem…" style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 12, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
                  {msg.trim()
                    ? <button onClick={send} style={{ all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: t.accent, color: '#fff', flexShrink: 0 }}><Icon name="send" size={18} /></button>
                    : <button onClick={() => setRec(1)} title="Gravar áudio" style={{ all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: t.accent, color: '#fff', flexShrink: 0 }}><Icon name="mic" size={18} /></button>}
                </React.Fragment>
              )}
            </div>
          </div>
        ) : <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: t.muted, fontSize: 13 }}>Selecione uma conversa.</div>}
      </Card>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8,10,16,.85)', display: 'grid', placeItems: 'center', padding: 30 }}>
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,.5)' }} />
          <button onClick={() => setLightbox(null)} style={{ all: 'unset', cursor: 'pointer', position: 'fixed', top: 24, right: 28, width: 42, height: 42, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.15)', color: '#fff' }}><Icon name="x" size={22} /></button>
        </div>
      )}
    </div>
  );
}

// ---------- Projetos (checklists) ----------
const DV_PROJ_SEED = [
  { id: 'pj1', nome: 'App Mobile do Estoque', cor: 'blue', prio: ['Alta', 'red'], desc: 'Versão Android para conferência em campo.', capa: '', anexos: [], checklists: [
    { titulo: 'Telas', itens: [{ t: 'Login', done: true }, { t: 'Lista de produtos', done: true }, { t: 'Leitor de código', done: false }, { t: 'Sincronização offline', done: false }] },
    { titulo: 'API', itens: [{ t: 'Endpoint de auth', done: true }, { t: 'Endpoint de estoque', done: false }] },
  ] },
  { id: 'pj2', nome: 'Integração NF-e v2', cor: 'green', prio: ['Média', 'amber'], desc: 'Sincronização automática de notas com o estoque.', capa: '', anexos: [], checklists: [
    { titulo: 'Backend', itens: [{ t: 'Parser de XML', done: true }, { t: 'Match por SKU', done: true }, { t: 'Job agendado', done: false }] },
  ] },
  { id: 'pj3', nome: 'Dashboard 3D Analytics', cor: 'amber', prio: ['Baixa', 'blue'], desc: 'Relatórios avançados da fábrica 3D.', capa: '', anexos: [], checklists: [
    { titulo: 'Métricas', itens: [{ t: 'Consumo de filamento', done: true }, { t: 'OEE por impressora', done: false }, { t: 'Exportar PDF', done: false }] },
  ] },
];
const DV_PRIOS = [['Alta', 'red'], ['Média', 'amber'], ['Baixa', 'blue']];

function DevProjetoModal({ t, proj, onClose, onUpdate, onDelete }) {
  const [edit, setEdit] = useStateDV(false);
  const toggle = (ci, ii) => onUpdate(proj.id, (p) => ({ ...p, checklists: p.checklists.map((c, j) => (j === ci ? { ...c, itens: c.itens.map((it, k) => (k === ii ? { ...it, done: !it.done } : it)) } : c)) }));
  const addItem = (ci, txt) => { if (!txt.trim()) return; onUpdate(proj.id, (p) => ({ ...p, checklists: p.checklists.map((c, j) => (j === ci ? { ...c, itens: [...c.itens, { t: txt.trim(), done: false }] } : c)) })); };
  const addChecklist = (titulo) => { if (!titulo.trim()) return; onUpdate(proj.id, (p) => ({ ...p, checklists: [...p.checklists, { titulo: titulo.trim(), itens: [] }] })); };
  const delChecklist = (ci) => onUpdate(proj.id, (p) => ({ ...p, checklists: p.checklists.filter((_, j) => j !== ci) }));
  const setField = (k, v) => onUpdate(proj.id, (p) => ({ ...p, [k]: v }));
  const onCapa = (file) => { if (!file) return; const r = new FileReader(); r.onload = () => setField('capa', r.result); r.readAsDataURL(file); };
  const onAnexos = (files) => { [...files].slice(0, 8).forEach((f) => { const r = new FileReader(); r.onload = () => onUpdate(proj.id, (p) => ({ ...p, anexos: [...(p.anexos || []), { nome: f.name, tipo: f.type, url: r.result }] })); r.readAsDataURL(f); }); };
  const delAnexo = (i) => onUpdate(proj.id, (p) => ({ ...p, anexos: p.anexos.filter((_, j) => j !== i) }));
  const total = proj.checklists.reduce((a, c) => a + c.itens.length, 0);
  const done = proj.checklists.reduce((a, c) => a + c.itens.filter((i) => i.done).length, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const field = { boxSizing: 'border-box', width: '100%', borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 66, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(920px,97vw)', maxHeight: '95vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        {/* cover */}
        <div style={{ position: 'relative', height: 200, background: proj.capa ? '#000' : `linear-gradient(135deg, ${uiTone(t, proj.cor).fg}, ${frHexToRgba(uiTone(t, proj.cor).fg, 0.55)})` }}>
          {proj.capa && <img src={proj.capa} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,10,16,.55), transparent 60%)' }} />
          <label style={{ position: 'absolute', bottom: 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', height: 34, padding: '0 13px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: 'rgba(8,10,16,.6)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onCapa(e.target.files[0])} />
            <Icon name="upload" size={14} /> {proj.capa ? 'Trocar capa' : 'Definir capa'}
          </label>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(8,10,16,.5)', color: '#fff' }}><Icon name="x" size={16} /></button>
          <div style={{ position: 'absolute', left: 18, bottom: 12, display: 'flex', alignItems: 'center', gap: 9 }}>
            <Badge t={t} kind={proj.prio[1]} dot>{proj.prio[0]}</Badge>
          </div>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* title + meta */}
          <div>
            {edit ? <input value={proj.nome} onChange={(e) => setField('nome', e.target.value)} style={{ ...field, fontSize: 18, fontWeight: 800 }} />
              : <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><div style={{ flex: 1, fontSize: 20, fontWeight: 850, color: t.text }}>{proj.nome}</div><button onClick={() => setEdit(true)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: t.accentText, padding: '6px 10px', borderRadius: 8, background: t.accentSoft }}><Icon name="pencil" size={13} /> Editar</button></div>}
            {edit ? <textarea value={proj.desc} onChange={(e) => setField('desc', e.target.value)} rows={2} placeholder="Descrição do projeto…" style={{ ...field, marginTop: 10, resize: 'vertical' }} />
              : <div style={{ fontSize: 13.5, color: t.muted, marginTop: 6, lineHeight: 1.5 }}>{proj.desc}</div>}
          </div>
          {/* prioridade + progresso */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 7 }}>Prioridade</div>
              <div style={{ display: 'flex', gap: 7 }}>{DV_PRIOS.map(([label, k]) => { const on = proj.prio[0] === label; return <button key={label} onClick={() => setField('prio', [label, k])} style={{ all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, background: on ? uiTone(t, k).fg : t.elevated, color: on ? '#fff' : t.muted, border: `1px solid ${on ? 'transparent' : t.border}` }}>{label}</button>; })}</div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: t.faint, textTransform: 'uppercase', marginBottom: 7 }}><span>Progresso</span><span style={{ color: pct === 100 ? uiTone(t, 'green').fg : t.accentText }}>{pct}%</span></div>
              <div style={{ height: 7, borderRadius: 5, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 5, background: pct === 100 ? uiTone(t, 'green').fg : t.accent }} /></div>
            </div>
          </div>
          {/* anexos */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase' }}>Anexos ({(proj.anexos || []).length})</span>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: t.accentText, padding: '6px 10px', borderRadius: 8, background: t.accentSoft }}><input type="file" multiple style={{ display: 'none' }} onChange={(e) => onAnexos(e.target.files)} /><Icon name="upload" size={13} /> Anexar</label>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(proj.anexos || []).map((a, i) => { const isImg = (a.tipo || '').indexOf('image') === 0; return (
                <div key={i} style={{ position: 'relative', width: 88 }}>
                  <div style={{ width: 88, height: 70, borderRadius: 10, overflow: 'hidden', border: `1px solid ${t.border}`, background: t.elevated, display: 'grid', placeItems: 'center' }}>
                    {isImg ? <img src={a.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="file" size={26} style={{ color: t.muted }} />}
                  </div>
                  <div style={{ fontSize: 10, color: t.muted, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nome}</div>
                  <button onClick={() => delAnexo(i)} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(8,10,16,.7)', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="x" size={11} /></button>
                </div>
              ); })}
              {(proj.anexos || []).length === 0 && <div style={{ fontSize: 12.5, color: t.faint }}>Nenhum anexo. Adicione imagens ou arquivos.</div>}
            </div>
          </div>
          {/* checklists */}
          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 12 }}>Checklists</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {proj.checklists.map((cl, ci) => (
                <div key={ci}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>{cl.titulo}</span>
                    <span style={{ fontSize: 11.5, color: t.muted, fontWeight: 600 }}>· {cl.itens.filter((i) => i.done).length}/{cl.itens.length}</span>
                    <button onClick={() => delChecklist(ci)} title="Excluir checklist" style={{ all: 'unset', cursor: 'pointer', marginLeft: 'auto', width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="trash" size={14} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {cl.itens.map((it, ii) => (
                      <button key={ii} onClick={() => toggle(ci, ii)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 10, background: it.done ? t.elevated : 'transparent', border: `1px solid ${t.border}` }}>
                        <span style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0, background: it.done ? uiTone(t, 'green').fg : 'transparent', color: '#fff', border: `1.5px solid ${it.done ? 'transparent' : t.borderStrong}` }}>{it.done && <Icon name="check" size={13} />}</span>
                        <span style={{ fontSize: 13.5, color: it.done ? t.muted : t.text, textDecoration: it.done ? 'line-through' : 'none' }}>{it.t}</span>
                      </button>
                    ))}
                    <DevAddItem t={t} onAdd={(txt) => addItem(ci, txt)} />
                  </div>
                </div>
              ))}
              <DevAddChecklist t={t} onAdd={addChecklist} />
            </div>
          </div>
          <button onClick={() => { onDelete(proj.id); onClose(); }} style={{ all: 'unset', cursor: 'pointer', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg, padding: '8px 12px', borderRadius: 9, border: `1px solid ${t.border}` }}><Icon name="trash" size={14} /> Excluir projeto</button>
        </div>
      </div>
    </div>
  );
}
function DevAddChecklist({ t, onAdd }) {
  const [v, setV] = useStateDV('');
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { onAdd(v); setV(''); } }} placeholder="+ Novo checklist…" style={{ flex: 1, height: 40, borderRadius: 10, border: `1px dashed ${t.borderStrong}`, background: 'transparent', color: t.text, padding: '0 12px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none' }} />
      <button onClick={() => { onAdd(v); setV(''); }} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: t.accent, color: '#fff' }}><Icon name="plus" size={15} /> Checklist</button>
    </div>
  );
}
function DevAddItem({ t, onAdd }) {
  const [v, setV] = useStateDV('');
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { onAdd(v); setV(''); } }} placeholder="Adicionar item…" style={{ flex: 1, height: 36, borderRadius: 9, border: `1px dashed ${t.borderStrong}`, background: 'transparent', color: t.text, padding: '0 11px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
      <button onClick={() => { onAdd(v); setV(''); }} style={{ all: 'unset', cursor: 'pointer', width: 36, height: 36, borderRadius: 9, display: 'grid', placeItems: 'center', color: t.accentText, border: `1px solid ${t.border}` }}><Icon name="plus" size={15} /></button>
    </div>
  );
}

function DevProjetos({ t, projetos, setProjetos }) {
  const [open, setOpen] = useStateDV(null);
  const update = (id, fn) => setProjetos((xs) => xs.map((p) => (p.id === id ? fn(p) : p)));
  const del = (id) => setProjetos((xs) => xs.filter((p) => p.id !== id));
  const cur = projetos.find((p) => p.id === open);
  const pct = (p) => { const tot = p.checklists.reduce((a, c) => a + c.itens.length, 0); const dn = p.checklists.reduce((a, c) => a + c.itens.filter((i) => i.done).length, 0); return tot ? Math.round((dn / tot) * 100) : 0; };
  return (
    <div>
      <PageHeader t={t} title="Projetos" subtitle="Acompanhe seus projetos e checklists."
        actions={<Btn t={t} icon="plus" onClick={() => { const id = 'pj' + Date.now(); setProjetos((xs) => [...xs, { id, nome: 'Novo projeto', cor: 'accent', prio: ['Média', 'amber'], desc: 'Descrição do projeto.', capa: '', anexos: [], checklists: [{ titulo: 'Tarefas', itens: [] }] }]); setOpen(id); }}>Novo projeto</Btn>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
        {projetos.map((p) => { const v = pct(p); const tot = p.checklists.reduce((a, c) => a + c.itens.length, 0); return (
          <Card t={t} key={p.id} hover style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
            <div onClick={() => setOpen(p.id)}>
              <div style={{ position: 'relative', height: 150, background: p.capa ? '#000' : `linear-gradient(135deg, ${uiTone(t, p.cor).fg}, ${frHexToRgba(uiTone(t, p.cor).fg, 0.5)})` }}>
                {p.capa && <img src={p.capa} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                <div style={{ position: 'absolute', top: 10, left: 10 }}><Badge t={t} kind={p.prio[1]} dot>{p.prio[0]}</Badge></div>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>{p.nome}</div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{p.checklists.length} checklists · {tot} itens{(p.anexos || []).length ? ` · ${p.anexos.length} anexos` : ''}</div>
                <div style={{ fontSize: 12.5, color: t.muted, marginTop: 10, lineHeight: 1.45, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 14 }}>
                  <div style={{ flex: 1, height: 7, borderRadius: 5, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${v}%`, borderRadius: 5, background: v === 100 ? uiTone(t, 'green').fg : t.accent }} /></div>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: v === 100 ? uiTone(t, 'green').fg : t.text }}>{v}%</span>
                </div>
              </div>
            </div>
          </Card>
        ); })}
      </div>
      {cur && <DevProjetoModal t={t} proj={cur} onClose={() => setOpen(null)} onUpdate={update} onDelete={del} />}
    </div>
  );
}

// ---------- Agenda (mês, estilo Google Agenda) ----------
const DV_AGENDA_SEED = [
  { id: 'a1', dia: 3, allday: true, titulo: 'Atividade: T2', cor: 'blue' },
  { id: 'a2', dia: 4, allday: true, titulo: 'Corpo de Deus', cor: 'green' },
  { id: 'a3', dia: 8, allday: true, titulo: 'Entrega Final NF-e', cor: 'blue' },
  { id: 'a4', dia: 12, allday: true, titulo: 'Dia dos Namorados', cor: 'green' },
  { id: 'a5', dia: 12, hora: '20:59', titulo: 'Deploy P2', cor: 'blue' },
  { id: 'a6', dia: 16, allday: true, titulo: 'Review App Mobile', cor: 'blue' },
  { id: 'a7', dia: 17, hora: '10:30', titulo: 'Corrigir export PDF', cor: 'red' },
  { id: 'a8', dia: 17, hora: '14:00', titulo: 'Reunião com Estoque', cor: 'amber' },
];
const DV_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DV_WD = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'];

function DevAgenda({ t, agenda, setAgenda }) {
  const HOJE = 17;
  const [mesRef, setMesRef] = useStateDV({ ano: 2026, mes: 5 }); // junho = 5
  const [add, setAdd] = useStateDV(null);
  const [selDia, setSelDia] = useStateDV(null);
  const [form, setForm] = useStateDV({ hora: '09:00', titulo: '', cor: 'blue', allday: false });
  const [viewOpen, setViewOpen] = useStateDV(false);
  const cores = [['blue', 'Azul'], ['green', 'Verde'], ['amber', 'Âmbar'], ['red', 'Vermelho'], ['accent', 'Ciano']];

  const first = new Date(mesRef.ano, mesRef.mes, 1);
  const startDow = first.getDay();
  const diasNoMes = new Date(mesRef.ano, mesRef.mes + 1, 0).getDate();
  const prevDias = new Date(mesRef.ano, mesRef.mes, 0).getDate();
  const isJunho2026 = mesRef.ano === 2026 && mesRef.mes === 5;
  // build 6 weeks grid
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startDow + 1;
    if (dayNum < 1) cells.push({ dia: prevDias + dayNum, out: true });
    else if (dayNum > diasNoMes) cells.push({ dia: dayNum - diasNoMes, out: true });
    else cells.push({ dia: dayNum, out: false });
  }
  const weeks = cells.length / 7;
  const evDay = (d) => agenda.filter((a) => a.dia === d).sort((a, b) => (a.allday ? -1 : 1) - (b.allday ? -1 : 1) || (a.hora || '').localeCompare(b.hora || ''));
  const nav = (dir) => setMesRef((m) => { let mes = m.mes + dir, ano = m.ano; if (mes < 0) { mes = 11; ano--; } if (mes > 11) { mes = 0; ano++; } return { ano, mes }; });
  const submit = () => { if (!form.titulo.trim()) return; setAgenda((xs) => [...xs, { id: 'a' + Date.now(), dia: add, hora: form.allday ? '' : form.hora, allday: form.allday, titulo: form.titulo.trim(), cor: form.cor }]); setSelDia(add); setForm({ hora: '09:00', titulo: '', cor: 'blue', allday: false }); setAdd(null); };
  const del = (id) => setAgenda((xs) => xs.filter((x) => x.id !== id));
  const clickDia = (dia) => { if (evDay(dia).length > 0) setSelDia(dia); else { setAdd(dia); setForm({ hora: '09:00', titulo: '', cor: 'blue', allday: false }); } };

  return (
    <div>
      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 22, fontWeight: 850, color: t.text }}><Icon name="calendar" size={24} style={{ color: t.accentText }} /> Agenda</span>
        <button onClick={() => setMesRef({ ano: 2026, mes: 5 })} style={{ all: 'unset', cursor: 'pointer', height: 38, padding: '0 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, color: t.text, border: `1px solid ${t.border}` }}>Hoje</button>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => nav(-1)} style={{ all: 'unset', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', color: t.muted }} onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="chevronLeft" size={20} /></button>
          <button onClick={() => nav(1)} style={{ all: 'unset', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', color: t.muted }} onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="chevronRight" size={20} /></button>
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, color: t.text }}>{DV_MESES[mesRef.mes]} de {mesRef.ano}</span>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <button onClick={() => setViewOpen((o) => !o)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: t.text, border: `1px solid ${t.border}` }}>Mês <Icon name="chevronDown" size={15} style={{ color: t.muted }} /></button>
          {viewOpen && (
            <React.Fragment>
              <div onClick={() => setViewOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
              <div style={{ position: 'absolute', zIndex: 10, top: 'calc(100% + 6px)', right: 0, width: 200, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6 }}>
                {[['Dia', 'D'], ['Semana', 'W'], ['Mês', 'M'], ['Ano', 'Y'], ['Programação', 'A']].map(([l, k]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 11px', borderRadius: 9, fontSize: 13.5, color: l === 'Mês' ? t.accentText : t.text, fontWeight: l === 'Mês' ? 700 : 500, background: l === 'Mês' ? t.accentSoft : 'transparent', cursor: 'pointer' }}
                    onMouseEnter={(e) => { if (l !== 'Mês') e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { if (l !== 'Mês') e.currentTarget.style.background = 'transparent'; }}>{l}<span style={{ fontSize: 11, color: t.faint }}>{k}</span></div>
                ))}
              </div>
            </React.Fragment>
          )}
        </div>
      </div>

      {/* calendar grid + side panel */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <Card t={t} style={{ padding: 0, overflow: 'hidden', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${t.border}` }}>
          {DV_WD.map((w) => <div key={w} style={{ padding: '10px 0', textAlign: 'center', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase' }}>{w}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: `repeat(${weeks}, minmax(110px, 1fr))` }}>
          {cells.map((c, i) => {
            const isToday = !c.out && isJunho2026 && c.dia === HOJE;
            const evs = c.out ? [] : evDay(c.dia);
            return (
              <div key={i} onClick={() => !c.out && clickDia(c.dia)} style={{ borderRight: (i % 7 === 6) ? 'none' : `1px solid ${t.border}`, borderBottom: i < cells.length - 7 ? `1px solid ${t.border}` : 'none', padding: 6, minHeight: 110, cursor: c.out ? 'default' : 'pointer', background: c.out ? t.elevated : (!c.out && c.dia === selDia ? t.accentSoft : 'transparent'), opacity: c.out ? 0.5 : 1, overflow: 'hidden' }}>
                <div style={{ textAlign: 'center', marginBottom: 4 }}>
                  <span style={{ display: 'inline-grid', placeItems: 'center', width: 24, height: 24, borderRadius: '50%', fontSize: 12.5, fontWeight: isToday ? 800 : 600, background: isToday ? t.accent : 'transparent', color: isToday ? '#fff' : t.text }}>{c.dia}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {evs.slice(0, 3).map((a) => a.allday ? (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 7px', borderRadius: 5, background: uiTone(t, a.cor).fg, color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.titulo}</div>
                  ) : (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 5px', fontSize: 11, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: uiTone(t, a.cor).fg, flexShrink: 0 }} /><span style={{ fontWeight: 700, color: t.muted }}>{a.hora}</span> {a.titulo}</div>
                  ))}
                  {evs.length > 3 && <div style={{ fontSize: 10.5, fontWeight: 700, color: t.muted, padding: '0 5px' }}>+{evs.length - 3} mais</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* side panel — detalhes do dia */}
      {selDia !== null && (
        <Card t={t} style={{ padding: 0, overflow: 'hidden', width: 320, flexShrink: 0, alignSelf: 'stretch' }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase' }}>{DV_WD[new Date(mesRef.ano, mesRef.mes, selDia).getDay()].replace('.', '')}</div>
              <div style={{ fontSize: 30, fontWeight: 850, color: t.accentText, lineHeight: 1 }}>{selDia}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{DV_MESES[mesRef.mes]}</div><div style={{ fontSize: 12, color: t.muted }}>{evDay(selDia).length} {evDay(selDia).length === 1 ? 'evento' : 'eventos'}</div></div>
            <button onClick={() => { setAdd(selDia); setForm({ hora: '09:00', titulo: '', cor: 'blue', allday: false }); }} title="Adicionar evento" style={{ all: 'unset', cursor: 'pointer', width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: t.accent, color: '#fff', flexShrink: 0 }}><Icon name="plus" size={18} /></button>
            <button onClick={() => setSelDia(null)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}><Icon name="x" size={16} /></button>
          </div>
          <div className="fr-scroll" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto' }}>
            {evDay(selDia).length === 0 && <div style={{ fontSize: 13, color: t.faint, textAlign: 'center', padding: '24px 0' }}>Nenhum evento neste dia.</div>}
            {evDay(selDia).map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 13px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}`, borderLeft: `3px solid ${uiTone(t, a.cor).fg}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{a.titulo}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: t.muted, marginTop: 4 }}><Icon name={a.allday ? 'calendar' : 'clock'} size={12} /> {a.allday ? 'Dia todo' : a.hora}</div>
                </div>
                <button onClick={() => del(a.id)} title="Excluir" style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = uiTone(t, 'red').bg; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
              </div>
            ))}
            <button onClick={() => { setAdd(selDia); setForm({ hora: '09:00', titulo: '', cor: 'blue', allday: false }); }} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 40, borderRadius: 10, fontSize: 13, fontWeight: 700, color: t.accentText, border: `1px dashed ${t.borderStrong}` }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.accentSoft; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="plus" size={15} /> Adicionar evento</button>
          </div>
        </Card>
      )}
      </div>

      {add !== null && (
        <div onClick={() => setAdd(null)} style={{ position: 'fixed', inset: 0, zIndex: 66, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(440px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: t.accent, color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="calendar" size={18} /></span>
              <div style={{ flex: 1, fontSize: 17, fontWeight: 850, color: t.text }}>Novo evento · {add} {DV_MESES[mesRef.mes].slice(0, 3)}</div>
              <button onClick={() => setAdd(null)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: t.muted, textTransform: 'uppercase', marginBottom: 7 }}>Título</label><input value={form.titulo} onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))} placeholder="Ex: Reunião de planejamento" style={{ boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} /></div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <button onClick={() => setForm((s) => ({ ...s, allday: !s.allday }))} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 13px', borderRadius: 11, fontSize: 13, fontWeight: 700, background: form.allday ? t.accentSoft : t.elevated, color: form.allday ? t.accentText : t.muted, border: `1px solid ${form.allday ? frHexToRgba(t.accent, 0.4) : t.border}` }}><span style={{ width: 18, height: 18, borderRadius: 5, display: 'grid', placeItems: 'center', background: form.allday ? t.accent : 'transparent', color: '#fff', border: `1.5px solid ${form.allday ? 'transparent' : t.borderStrong}` }}>{form.allday && <Icon name="check" size={12} />}</span> Dia todo</button>
                {!form.allday && <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: t.muted, textTransform: 'uppercase', marginBottom: 7 }}>Hora</label><input type="time" value={form.hora} onChange={(e) => setForm((s) => ({ ...s, hora: e.target.value }))} style={{ boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} /></div>}
              </div>
              <div><label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: t.muted, textTransform: 'uppercase', marginBottom: 8 }}>Cor</label>
                <div style={{ display: 'flex', gap: 8 }}>{cores.map(([k, label]) => { const on = form.cor === k; return <button key={k} onClick={() => setForm((s) => ({ ...s, cor: k }))} title={label} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, background: uiTone(t, k).fg, outline: on ? `2px solid ${t.text}` : 'none', outlineOffset: 2 }} />; })}</div>
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Btn t={t} kind="ghost" onClick={() => setAdd(null)}>Cancelar</Btn>
              <Btn t={t} icon="check" onClick={submit}>Criar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DevModule(props) {
  const t = frTokens(props.theme, DV_ACCENT, DV_ACCENT_T);
  const [chamados, setChamados] = useStateDV(DV_CHAMADOS_SEED);
  const [projetos, setProjetos] = useStateDV(DV_PROJ_SEED);
  const [agenda, setAgenda] = useStateDV(DV_AGENDA_SEED);
  const [scripts, setScripts] = useStateDV([{ titulo: 'Reset cache do estoque', code: 'php artisan cache:clear\nphp artisan config:clear' }, { titulo: 'Query produtos críticos', code: 'SELECT sku, nome FROM produtos WHERE disponivel <= minimo;' }]);
  const p = { ...props, t, chamados, setChamados, projetos, setProjetos, agenda, setAgenda, scripts, setScripts };
  if (props.active === 'dev-chamados') return <DevChamados {...p} />;
  if (props.active === 'dev-chat') return <DevChat {...p} />;
  if (props.active === 'dev-projetos') return <DevProjetos {...p} />;
  if (props.active === 'dev-agenda') return <DevAgenda {...p} />;
  return <DevPainel {...p} />;
}

// persistent module wrapper so chamados state survives page switches
function renderPageDev(active, props) {
  return <DevModule active={active} {...props} />;
}
window.renderPageDev = renderPageDev;
