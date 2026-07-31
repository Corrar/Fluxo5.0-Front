// dev.jsx — módulo Desenvolvedor: Painel (agregado REAL, migration 015), Chamados (fila REAL
// do helpdesk) e Projetos (grade REAL, migration 013). Sobra UM mock cadeado: o Chat (tempo
// real é v2). A Agenda MORREU na decisão C do Bruno (30/07/2026) — a lápide com o motivo e o
// critério de reabertura mora no NAV_DEV (data.jsx).
const { useState: useStateDV } = React;
const DV_ACCENT = '#0891b2', DV_ACCENT_T = '#22d3ee';

// ---------- Painel (tela REAL — GET /dev-dashboard) ----------
// LIGAÇÃO REAL: GET /dev-dashboard (chamada ÚNICA; o painel não faz 5 GETs), router inteiro
// atrás de requirePermission('dev_dashboard') — chave PRÓPRIA porque o painel cruza chamados
// E projetos (migration 015). Gate canAccess na própria tela: sem a chave nem monta.
//
// O MOCK MORREU INTEIRO — era ~90% teatro e a régua do Bruno é "nenhum número sem SQL
// demonstrável": "Resolvidos no mês = 31" (string chumbada), "Tempo médio = 1,8 d"
// (chumbado), BarChart com Seg–Sex fixos [4,7,5,9,6], badge "+15% vs. anterior" (comparação
// inventada), e o "Trabalhando agora" com `c.prog`% — progresso de CHAMADO nunca existiu no
// banco. O que tinha fonte renasceu com a query que o sustenta; o resto não voltou.
//
// N=0 mostra "—" + a frase honesta, NUNCA placeholder: painel de time novo é vazio mesmo, e
// inventar número aqui seria a mentira que matou a agenda.

const DP_DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
// 'YYYY-MM-DD' → 'Qui'. Ancorado ao MEIO-DIA UTC: o backend já fechou o dia em
// America/Sao_Paulo, então aqui só falta o nome — e meio-dia imuniza contra o fuso do
// navegador virar o dia pra trás/frente.
function dpDiaLabel(iso) {
  const p = String(iso || '').split('-');
  if (p.length !== 3) return '';
  const d = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12));
  return DP_DIAS_CURTOS[d.getUTCDay()] || '';
}
// Média de resolução: horas até 48h, dias acima disso (1,8 d lia melhor que 43,2 h).
function dpDuracao(horas) {
  const h = Number(horas);
  if (!Number.isFinite(h)) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1).replace('.', ',')} h`;
  return `${(h / 24).toFixed(1).replace('.', ',')} d`;
}
function dpHora(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Barras dos 7 dias com DUAS séries. Por que não o BarChart da casa: ele desenha UMA série
// (um `accent` por item) e duas séries comparáveis exigem ESCALA COMPARTILHADA — dois
// BarCharts lado a lado teriam max independentes e um dia com 1 concluído pareceria do mesmo
// tamanho de um dia com 4 abertos. Mesmo vocabulário visual do BarChart (altura relativa,
// minHeight 4, transição, label do dia embaixo), escala única. Série toda-zero é caso normal:
// max cai pra 1 e as barras ficam na linha de base — sem divisão por zero, sem gráfico falso.
function DpBarras7({ t, dias }) {
  const max = Math.max(1, ...dias.map((d) => Math.max(d.abertos, d.concluidos)));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 170, padding: '0 2px' }}>
        {dias.map((d) => (
          <div key={d.dia} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%', height: '100%', justifyContent: 'center' }}>
              <div title={`${d.abertos} aberto(s)`} style={{ width: '38%', maxWidth: 18, height: `${(d.abertos / max) * 100}%`, minHeight: 4, borderRadius: '5px 5px 2px 2px', background: t.hover, transition: 'height .4s cubic-bezier(.2,.8,.2,1)' }} />
              <div title={`${d.concluidos} concluído(s)`} style={{ width: '38%', maxWidth: 18, height: `${(d.concluidos / max) * 100}%`, minHeight: 4, borderRadius: '5px 5px 2px 2px', background: `linear-gradient(180deg, ${t.accent}, ${frHexToRgba(t.accent, 0.55)})`, transition: 'height .4s cubic-bezier(.2,.8,.2,1)' }} />
            </div>
            <div style={{ fontSize: 10.5, color: t.faint, fontWeight: 700 }}>{dpDiaLabel(d.dia)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11.5, color: t.muted }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: t.hover }} /> Abertos</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: t.accent }} /> Concluídos</span>
      </div>
    </div>
  );
}

function DevPainelReal({ t }) {
  const R = window.React;
  const [d, setD] = useStateDV(null);
  const [loading, setLoading] = useStateDV(true);
  const [error, setError] = useStateDV(null);
  const [atualizando, setAtualizando] = useStateDV(false);

  const carregar = R.useCallback(function (inicial) {
    if (inicial) setLoading(true); else setAtualizando(true);
    setError(null);
    return window.FRApi.get('/dev-dashboard', { skipLoading: true })
      .then(function (r) { setD(r.data || null); })
      .catch(function (e) { setError(pjErr(e)); })
      .then(function () { if (inicial) setLoading(false); else setAtualizando(false); });
  }, []);
  R.useEffect(function () { carregar(true); }, [carregar]);

  const cabecalho = (
    <PageHeader t={t} title="Painel do Desenvolvedor"
      subtitle="Fila, resolução e projetos — cada número sai de uma query, nada é estimado."
      actions={<Btn t={t} icon="refresh" kind="ghost" onClick={function () { if (!atualizando) carregar(false); }}>{atualizando ? 'Atualizando…' : 'Atualizar'}</Btn>} />
  );

  if (loading) {
    return <div>{cabecalho}<Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando o painel…</Card></div>;
  }
  if (error || !d) {
    return (
      <div>{cabecalho}
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error || 'Não foi possível montar o painel.'}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={function () { carregar(true); }}>Tentar novamente</Btn>
        </Card>
      </div>
    );
  }

  const fila = d.fila || {};
  const prio = d.prioridade_fila || {};
  const res = d.resolucao_30d || {};
  const dias = Array.isArray(d.sete_dias) ? d.sete_dias : [];
  const proj = d.projetos || {};
  const recentes = Array.isArray(proj.recentes) ? proj.recentes : [];
  const prioTotal = (prio.alta || 0) + (prio.media || 0) + (prio.baixa || 0);
  // null = fila vazia (não existe "mais antigo"); 0 = existe e entrou hoje. Coisas diferentes.
  const antigo = fila.mais_antigo_dias === null || fila.mais_antigo_dias === undefined
    ? '—' : (fila.mais_antigo_dias === 0 ? 'hoje' : `${fila.mais_antigo_dias} d`);

  return (
    <div>
      {cabecalho}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} icon="file" label="Na fila" value={fila.fila_total || 0} kind="accent"
          sub={`${fila.abertos || 0} aberto(s) · ${fila.em_analise || 0} em análise · ${fila.em_desenvolvimento || 0} em dev`} />
        <KPI t={t} icon="bell" label="Sem atendente" value={fila.sem_atendente || 0} kind={fila.sem_atendente > 0 ? 'red' : 'green'}
          sub={fila.sem_atendente > 0 ? 'ninguém pegou ainda' : 'todos com atendente'} />
        <KPI t={t} icon="clock" label="Mais antigo na fila" value={antigo} kind={fila.mais_antigo_dias >= 3 ? 'amber' : 'blue'}
          sub={fila.fila_total ? 'chamado vivo há mais tempo' : 'fila vazia'} />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch', marginBottom: 20 }}>
        <Card t={t} style={{ padding: 22, flex: 2, minWidth: 340 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 4 }}>Últimos 7 dias</div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 18 }}>Chamados abertos e concluídos por dia (fuso de São Paulo).</div>
          <DpBarras7 t={t} dias={dias} />
        </Card>

        <Card t={t} style={{ padding: 22, flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 4 }}>Resolução (30 dias)</div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 18 }}>Só chamados concluídos — cancelado não é resolução.</div>
          {res.n === 0 ? (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 40, fontWeight: 850, color: t.faint, lineHeight: 1 }}>—</div>
                <div style={{ fontSize: 12.5, color: t.muted, marginTop: 10 }}>sem chamado concluído nos últimos 30 dias</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase' }}>Resolvidos em 30d</div>
                <div style={{ fontSize: 28, fontWeight: 850, color: t.text, letterSpacing: '-.02em' }}>{res.n}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase' }}>Tempo médio</div>
                <div style={{ fontSize: 28, fontWeight: 850, color: t.accentText, letterSpacing: '-.02em' }}>{res.media_horas === null || res.media_horas === undefined ? '—' : dpDuracao(res.media_horas)}</div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>da abertura até concluir</div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <Card t={t} style={{ padding: 22, flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 18 }}>Prioridade na fila</div>
          {prioTotal === 0 ? (
            <div style={{ fontSize: 13, color: t.muted }}>Fila vazia — nada para priorizar.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['alta', 'Alta', 'red'], ['media', 'Média', 'amber'], ['baixa', 'Baixa', 'blue']].map(function ([k, label, kind]) {
                const n = prio[k] || 0;
                return (
                  <div key={k}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: t.text }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: t.muted }}>{n}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 5, background: t.hover, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${prioTotal ? (n / prioTotal) * 100 : 0}%`, borderRadius: 5, background: uiTone(t, kind).fg, transition: 'width .4s cubic-bezier(.2,.8,.2,1)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card t={t} style={{ padding: 22, flex: 2, minWidth: 340 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Projetos</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Badge t={t} kind="accent">{proj.ativos || 0} ativo(s)</Badge>
              <Badge t={t} kind="gray">{proj.arquivados || 0} arquivado(s)</Badge>
            </div>
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 18 }}>Mexidos mais recentemente — progresso derivado dos checklists.</div>
          {recentes.length === 0 ? (
            <div style={{ fontSize: 13, color: t.muted }}>Nenhum projeto ativo. A tela Projetos cria o primeiro.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {recentes.map(function (p) {
                const total = Number(p.itens_total) || 0;
                const done = Number(p.itens_done) || 0;
                const pct = total ? Math.round((done / total) * 100) : 0;
                const hex = PJ_COR_HEX[p.color] || PJ_COR_HEX.blue;
                const pr = PJ_PRIO[p.priority] || [p.priority, 'gray'];
                return (
                  <div key={p.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ width: 4, height: 16, borderRadius: 2, background: hex, flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                      <Badge t={t} kind={pr[1]}>{pr[0]}</Badge>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: t.muted, minWidth: 62, textAlign: 'right' }}>
                        {total ? `${done}/${total} · ${pct}%` : 'sem checklist'}
                      </span>
                    </div>
                    {total > 0 && (
                      <div style={{ height: 6, borderRadius: 5, background: t.hover, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 5, background: t.accent, transition: 'width .4s cubic-bezier(.2,.8,.2,1)' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 18, fontSize: 11.5, color: t.faint, textAlign: 'right' }}>
        Gerado em {dpHora(d.gerado_em)} · leitura direta do banco
      </div>
    </div>
  );
}

// Gate padrão da casa: sem a page_key 'dev_dashboard' a tela interna NEM MONTA (zero rede).
// Admin passa pelo bypass; a chave existe no universo (migration 015) e é concedível pela
// tela Permissões.
function DevPainel({ t }) {
  const A = window.FRAuth;
  if (!A || typeof A.canAccess !== 'function' || !A.canAccess('dev_dashboard')) {
    return (
      <div>
        <PageHeader t={t} title="Painel do Desenvolvedor" subtitle="Visão geral da fila, da resolução e dos projetos." />
        <Card t={t} style={{ padding: 40, textAlign: 'center' }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'inline-grid', placeItems: 'center', marginBottom: 14 }}><Icon name="lock" size={24} /></span>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700 }}>
            Acesso bloqueado. Não possui o nível de permissão necessário (dev_dashboard) para ver o painel.
          </div>
        </Card>
      </div>
    );
  }
  return <DevPainelReal t={t} />;
}

// ---------- Chamados (fila REAL do atendente — helpdesk v1) ----------
// LIGAÇÃO REAL: GET /tickets (fila única, requirePermission('chamados') no backend),
// PUT /tickets/:id/status (transições lineares), PUT /tickets/:id/priority, e o detalhe/
// timeline compartilhados de window.FRTicketDetail (pages_rest.jsx) com atendente=true.
// O MOCK MORREU: DV_CHAMADOS_SEED, DV_STATUS/DV_STEPS (substituídos pelos mapas reais de
// window.FRTk), o chat fake do detalhe, o DevTrabalhos (órfão, nunca roteado) e o
// "Meus Scripts" (anotação particular sem relação com tickets — morre com o mock; se fizer
// falta, volta como feature própria). dev-chat segue MOCK CADEADO (tempo real é v2).
//
// Gate canAccess('chamados') padrão da casa (tela interna nem monta). NOTA v1: a page_key
// 'chamados' não está concedida a NENHUM papel — o atendente de hoje é o admin (bypass).
// Conceder a chave pela tela de Permissões quando o papel de atendente nascer.
//
// Abas por GRUPO de status (padrão do mock): Novos = aberto+em_analise · Em desenvolvimento ·
// Concluídos = concluido+cancelado (cancelado com badge). O filtro ?status= do backend é de
// UM status — na aba de status único (Em desenvolvimento) o refetch usa o filtro server-side;
// nas abas compostas o agrupamento é local sobre o fetch cheio (que também alimenta os
// contadores). Filtro composto server-side é v2 se o volume um dia doer (envelope pronto).

function DevChamadosReal({ t }) {
  const R = window.React;
  const Tk = window.FRTk;
  const Detail = window.FRTicketDetail;
  const [tickets, setTickets] = useStateDV([]);
  const [loading, setLoading] = useStateDV(true);
  const [error, setError] = useStateDV(null);
  const [tab, setTab] = useStateDV('novos');
  const [aberto, setAberto] = useStateDV(null);

  const carregar = R.useCallback(function (inicial) {
    if (inicial) setLoading(true);
    setError(null);
    return window.FRApi.get('/tickets', { skipLoading: true })
      .then(function (r) { setTickets((r.data && r.data.tickets) || []); if (inicial) setLoading(false); })
      .catch(function (e) { setError(tkFilaErr(e)); if (inicial) setLoading(false); });
  }, []);
  R.useEffect(function () { carregar(true); }, [carregar]);

  // Cortesia do socket, DOIS eventos, mesma reação — recarrega a fila em silêncio:
  //   'fr:ticket_updated' → a sala 'admin' recebe comentário de requester;
  //   'fr:ticket_created' → chamado NOVO aberto por qualquer pessoa (31/07/2026). Sem isto a
  //     fila só acordava no F5 — medido no ar em 31/07 com a tela aberta e "Novos (0)" parado.
  // SEM toast global, coerente com o resto do helpdesk: a tela montada se atualiza sozinha e
  // quem não está nela refaz o GET quando abrir. O payload do evento traz título e solicitante,
  // mas a fila NÃO monta card com ele — recarrega e deixa o GET ser a verdade (o evento diz
  // "mudou alguma coisa", não "confie neste dado").
  R.useEffect(function () {
    const h = function () { carregar(false); };
    window.addEventListener('fr:ticket_updated', h);
    window.addEventListener('fr:ticket_created', h);
    return function () {
      window.removeEventListener('fr:ticket_updated', h);
      window.removeEventListener('fr:ticket_created', h);
    };
  }, [carregar]);

  // Prova do filtro server-side na aba de status único: refetch com ?status= e usa o
  // resultado como view da aba (os contadores seguem do fetch cheio em `tickets`).
  const [viewDev, setViewDev] = useStateDV(null);
  R.useEffect(function () {
    if (tab !== 'dev') { setViewDev(null); return; }
    window.FRApi.get('/tickets?status=em_desenvolvimento', { skipLoading: true })
      .then(function (r) { setViewDev((r.data && r.data.tickets) || []); })
      .catch(function () { setViewDev(null); }); // fallback: agrupamento local
  }, [tab, tickets]);

  const groups = {
    novos: tickets.filter(function (x) { return x.status === 'aberto' || x.status === 'em_analise'; }),
    dev: tickets.filter(function (x) { return x.status === 'em_desenvolvimento'; }),
    feitos: tickets.filter(function (x) { return x.status === 'concluido' || x.status === 'cancelado'; }),
  };
  const tabs = [['novos', 'Novos'], ['dev', 'Em desenvolvimento'], ['feitos', 'Concluídos']];
  const view = tab === 'dev' && viewDev !== null ? viewDev : groups[tab];

  return (
    <div>
      <PageHeader t={t} title="Chamados" subtitle="Fila única de suporte — todos os chamados abertos pelos setores, direto do banco." />
      {loading ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando a fila…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => carregar(true)}>Tentar novamente</Btn>
        </Card>
      ) : (
        <React.Fragment>
          <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}`, marginBottom: 22 }}>
            {tabs.map(function ([k, label]) {
              const on = tab === k;
              return (
                <button key={k} onClick={() => setTab(k)} style={{ all: 'unset', cursor: 'pointer', height: 38, padding: '0 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? '#fff' : t.muted }}>{label} <span style={{ opacity: .6, fontWeight: 800 }}>({groups[k].length})</span></button>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
            {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada por aqui" sub="Nenhum chamado neste grupo." /></Card></div>}
            {view.map(function (c) {
              const st = Tk.TK_STATUS[c.status] || Tk.TK_STATUS.aberto;
              const prio = Tk.TK_PRIO[c.priority] || [c.priority, 'gray'];
              return (
                <Card t={t} key={c.id} hover style={{ padding: 16, cursor: 'pointer' }}>
                  <div onClick={() => setAberto(c.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 800, color: t.muted }}>TI-{c.display_no}</span><Badge t={t} kind={prio[1]} dot>{prio[0]}</Badge></div>
                      <Badge t={t} kind={st.kind} dot>{st.label}</Badge>
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text, margin: '11px 0 10px', lineHeight: 1.3 }}>{c.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 10.5 }}>{String(c.requester_name || '?').split(' ').map(function (x) { return x[0]; }).filter(Boolean).slice(0, 2).join('').toUpperCase()}</span>
                      <span style={{ fontSize: 12, color: t.muted }}>{c.requester_name} · {c.requester_sector}</span>
                    </div>
                    {c.assignee_name && <div style={{ fontSize: 11.5, color: t.faint, marginTop: 8 }}>Atendente: {c.assignee_name}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
                    <span style={{ fontSize: 11.5, color: t.faint }}>{Tk.tkQuando(c.created_at)}</span>
                    <button onClick={() => setAberto(c.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: t.accentText, padding: '6px 10px', borderRadius: 9, background: t.accentSoft }}>Abrir <Icon name="chevronRight" size={14} /></button>
                  </div>
                </Card>
              );
            })}
          </div>
        </React.Fragment>
      )}
      {aberto && <Detail t={t} ticketId={aberto} atendente={true} onClose={() => setAberto(null)} onChanged={() => carregar(false)} />}
    </div>
  );
}
function tkFilaErr(e) { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; }

// Gate padrão da casa (mesmo desenho de Permissões/Auditoria/Usuários): sem a page_key
// 'chamados', a fila nem monta — zero rede. Admin passa pelo bypass do canAccess.
function DevChamados({ t }) {
  const A = window.FRAuth;
  if (!A || typeof A.canAccess !== 'function' || !A.canAccess('chamados')) {
    return (
      <div>
        <PageHeader t={t} title="Chamados" subtitle="Fila única de suporte do time de desenvolvimento." />
        <Card t={t} style={{ padding: 40, textAlign: 'center' }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'inline-grid', placeItems: 'center', marginBottom: 14 }}><Icon name="lock" size={24} /></span>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700 }}>
            Acesso bloqueado. Não possui o nível de permissão necessário (chamados) para atender a fila.
          </div>
        </Card>
      </div>
    );
  }
  return <DevChamadosReal t={t} />;
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

// ---------- Projetos (REAL — dev-projetos v1) ----------
// LIGAÇÃO REAL: GET /dev-projects (?status=ativo|arquivado, envelope {projects,total}),
// GET /:id, POST, PUT parcial (op_code:null desvincula), DELETE — tudo atrás de
// requirePermission('projetos') no backend (migration 013; a chave nasceu no universo da
// tela Permissões pela própria migration e é concedível por lá).
// O MOCK MORREU: DV_PROJ_SEED, o estado local do DevModule, e CAPA/ANEXOS na UI — dívida
// de storage (nada de DataURL); o campo `color` do card assume o papel visual da capa.
// Progresso % segue DERIVADO dos checklists (done/total) — nunca campo.
// Limites da borda do backend RESPEITADOS NA UI (≤20 checklists, ≤100 itens, títulos ≤200,
// itens ≤500): os inputs bloqueiam antes do 400.

const PJ_PRIOS = [['baixa', 'Baixa', 'blue'], ['media', 'Média', 'amber'], ['alta', 'Alta', 'red']];
const PJ_PRIO = { baixa: ['Baixa', 'blue'], media: ['Média', 'amber'], alta: ['Alta', 'red'] };
// Paleta LOCAL das 6 cores da allowlist do backend (uiTone não tem purple — aqui é hex puro).
const PJ_CORES = [
  ['blue', '#3b82f6'], ['green', '#10b981'], ['amber', '#d97706'],
  ['red', '#ef4444'], ['purple', '#8b5cf6'], ['gray', '#6b7280'],
];
const PJ_COR_HEX = Object.fromEntries(PJ_CORES);
function pjErr(e) { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; }
function pjProgresso(checklists) {
  const cls = Array.isArray(checklists) ? checklists : [];
  const total = cls.reduce((a, c) => a + ((c.itens || []).length), 0);
  const done = cls.reduce((a, c) => a + (c.itens || []).filter((i) => i.done).length, 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

// Inputs reutilizados do editor de checklists (limites aplicados pelos chamadores).
function DevAddChecklist({ t, onAdd, disabled }) {
  const [v, setV] = useStateDV('');
  const add = () => { if (disabled) return; onAdd(v); setV(''); };
  return (
    <div style={{ display: 'flex', gap: 8, opacity: disabled ? 0.5 : 1 }}>
      <input value={v} maxLength={200} disabled={disabled} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} placeholder={disabled ? 'Limite de 20 checklists atingido' : '+ Novo checklist…'} style={{ flex: 1, height: 40, borderRadius: 10, border: `1px dashed ${t.borderStrong}`, background: 'transparent', color: t.text, padding: '0 12px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none' }} />
      <button onClick={add} style={{ all: 'unset', cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: t.accent, color: '#fff' }}><Icon name="plus" size={15} /> Checklist</button>
    </div>
  );
}
function DevAddItem({ t, onAdd, disabled }) {
  const [v, setV] = useStateDV('');
  const add = () => { if (disabled) return; onAdd(v); setV(''); };
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 2, opacity: disabled ? 0.5 : 1 }}>
      <input value={v} maxLength={500} disabled={disabled} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} placeholder={disabled ? 'Limite de 100 itens atingido' : 'Adicionar item…'} style={{ flex: 1, height: 36, borderRadius: 9, border: `1px dashed ${t.borderStrong}`, background: 'transparent', color: t.text, padding: '0 11px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
      <button onClick={add} style={{ all: 'unset', cursor: disabled ? 'not-allowed' : 'pointer', width: 36, height: 36, borderRadius: 9, display: 'grid', placeItems: 'center', color: t.accentText, border: `1px solid ${t.border}` }}><Icon name="plus" size={15} /></button>
    </div>
  );
}

// Form compartilhado de nome/desc/prioridade/cor/OP (criação e edição usam o mesmo shape).
function PjCampos({ t, form, setForm }) {
  const inputM = { boxSizing: 'border-box', width: '100%', borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '10px 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' };
  const lblM = { display: 'block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.07em', color: t.faint, textTransform: 'uppercase', margin: '13px 0 6px' };
  return (
    <React.Fragment>
      <label style={lblM}>Nome (até 200 caracteres)</label>
      <input value={form.nome} maxLength={200} onChange={(e) => setForm({ ...form, nome: e.target.value, erro: null })} placeholder="Ex.: App Mobile do Estoque" style={inputM} />
      <label style={lblM}>Descrição</label>
      <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value, erro: null })} rows={2} placeholder="Do que se trata o projeto…" style={{ ...inputM, resize: 'vertical' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={lblM}>Prioridade</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {PJ_PRIOS.map(([k, label, tone]) => {
              const on = form.prioridade === k;
              return <button key={k} onClick={() => setForm({ ...form, prioridade: k, erro: null })} style={{ all: 'unset', cursor: 'pointer', flex: 1, textAlign: 'center', height: 38, lineHeight: '38px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: on ? uiTone(t, tone).fg : t.elevated, color: on ? '#fff' : t.muted, border: `1px solid ${on ? 'transparent' : t.border}` }}>{label}</button>;
            })}
          </div>
        </div>
        <div>
          <label style={lblM}>Cor do cartão</label>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', height: 38 }}>
            {PJ_CORES.map(([k, hex]) => {
              const on = form.cor === k;
              return <button key={k} title={k} onClick={() => setForm({ ...form, cor: k, erro: null })} style={{ all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 8, background: hex, outline: on ? `2px solid ${t.text}` : 'none', outlineOffset: 2 }} />;
            })}
          </div>
        </div>
      </div>
      <label style={lblM}>OP vinculada (opcional)</label>
      <input value={form.opCode} onChange={(e) => setForm({ ...form, opCode: e.target.value, erro: null })} placeholder="Ex.: 73001 — vazio = projeto livre" style={inputM} />
    </React.Fragment>
  );
}

function DevProjetosReal({ t }) {
  const R = window.React;
  const [projects, setProjects] = useStateDV([]);
  const [loading, setLoading] = useStateDV(true);
  const [error, setError] = useStateDV(null);
  const [aba, setAba] = useStateDV('ativo'); // 'ativo' | 'arquivado'
  const [novo, setNovo] = useStateDV(null);  // {nome, desc, prioridade, cor, opCode, erro}
  const [aberto, setAberto] = useStateDV(null); // id do projeto no modal
  const [agindo, setAgindo] = useStateDV(false);

  const carregar = R.useCallback(function (status, inicial) {
    if (inicial) setLoading(true);
    setError(null);
    return window.FRApi.get(`/dev-projects?status=${status}`, { skipLoading: true })
      .then(function (r) { setProjects((r.data && r.data.projects) || []); if (inicial) setLoading(false); })
      .catch(function (e) { setError(pjErr(e)); if (inicial) setLoading(false); });
  }, []);
  R.useEffect(function () { carregar(aba, true); }, [aba, carregar]);

  const criar = function () {
    const n = novo || {};
    const nome = String(n.nome || '').trim();
    if (!nome) return setNovo({ ...n, erro: 'Nome é obrigatório.' });
    setAgindo(true);
    const body = { name: nome, description: String(n.desc || '').trim(), priority: n.prioridade || 'media', color: n.cor || 'blue' };
    if (String(n.opCode || '').trim()) body.op_code = String(n.opCode).trim();
    window.FRApi.post('/dev-projects', body)
      .then(function () { setNovo(null); return carregar(aba, false); })
      .catch(function (e) { setNovo(function (m) { return { ...m, erro: pjErr(e) }; }); }) // 404 de OP fantasma cai aqui
      .then(function () { setAgindo(false); });
  };

  return (
    <div>
      <PageHeader t={t} title="Projetos" subtitle="Projetos internos do time — checklists e progresso, direto do banco."
        actions={<Btn t={t} icon="plus" onClick={() => setNovo({ nome: '', desc: '', prioridade: 'media', cor: 'blue', opCode: '' })}>Novo projeto</Btn>} />
      <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}`, marginBottom: 20 }}>
        {[['ativo', 'Ativos'], ['arquivado', 'Arquivados']].map(function ([k, label]) {
          const on = aba === k;
          return <button key={k} onClick={() => setAba(k)} style={{ all: 'unset', cursor: 'pointer', height: 38, padding: '0 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? '#fff' : t.muted }}>{label}</button>;
        })}
      </div>

      {loading ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando projetos…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => carregar(aba, true)}>Tentar novamente</Btn>
        </Card>
      ) : projects.length === 0 ? (
        <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title={aba === 'ativo' ? 'Nenhum projeto ativo' : 'Nada arquivado'} sub={aba === 'ativo' ? 'Crie o primeiro projeto do time.' : 'Projetos arquivados aparecem aqui.'} /></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {projects.map(function (p) {
            const prog = pjProgresso(p.checklists);
            const prio = PJ_PRIO[p.priority] || [p.priority, 'gray'];
            const hex = PJ_COR_HEX[p.color] || PJ_COR_HEX.blue;
            return (
              <Card t={t} key={p.id} hover style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
                <div onClick={() => setAberto(p.id)}>
                  <div style={{ height: 8, background: hex }} />
                  <div style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Badge t={t} kind={prio[1]} dot>{prio[0]}</Badge>
                      {p.op_code && <span style={{ fontSize: 10.5, fontWeight: 800, fontFamily: 'monospace', padding: '3px 9px', borderRadius: 8, background: t.hover, color: t.muted }}>OP {p.op_code}</span>}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 850, color: t.text, marginTop: 10 }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: 12.5, color: t.muted, marginTop: 6, lineHeight: 1.45, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 14 }}>
                      <div style={{ flex: 1, height: 7, borderRadius: 5, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${prog.pct}%`, borderRadius: 5, background: prog.pct === 100 ? uiTone(t, 'green').fg : t.accent }} /></div>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: prog.pct === 100 ? uiTone(t, 'green').fg : t.text }}>{prog.pct}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: t.faint, marginTop: 6 }}>{prog.done}/{prog.total} itens</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {novo && (
        <div onClick={() => !agindo && setNovo(null)} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="kanban" size={19} /></span>
              <div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>Novo projeto</div>
            </div>
            <PjCampos t={t} form={novo} setForm={setNovo} />
            {novo.erro && <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{novo.erro}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <Btn t={t} kind="ghost" onClick={() => !agindo && setNovo(null)}>Cancelar</Btn>
              <Btn t={t} icon="check" onClick={criar}>{agindo ? 'Criando…' : 'Criar projeto'}</Btn>
            </div>
          </div>
        </div>
      )}

      {aberto && <DevProjetoModal t={t} projetoId={aberto} onClose={() => setAberto(null)} onChanged={() => carregar(aba, false)} />}
    </div>
  );
}

// Modal do projeto — GET /:id ao abrir; edição com estado DIRTY (PUT só do que mudou).
function DevProjetoModal({ t, projetoId, onClose, onChanged }) {
  const R = window.React;
  const [proj, setProj] = useStateDV(null);   // snapshot do servidor
  const [form, setForm] = useStateDV(null);   // {nome, desc, prioridade, cor, opCode, erro}
  const [cls, setCls] = useStateDV([]);       // checklists editáveis (cópia profunda)
  const [erro, setErro] = useStateDV(null);
  const [agindo, setAgindo] = useStateDV(false);
  const [confirmando, setConfirmando] = useStateDV(null); // 'arquivar' | 'excluir'
  const [menuAberto, setMenuAberto] = useStateDV(false);

  const carregar = R.useCallback(function () {
    return window.FRApi.get(`/dev-projects/${projetoId}`, { skipLoading: true })
      .then(function (r) {
        setProj(r.data);
        setForm({ nome: r.data.name, desc: r.data.description || '', prioridade: r.data.priority, cor: r.data.color, opCode: r.data.op_code || '', erro: null });
        setCls(JSON.parse(JSON.stringify(r.data.checklists || [])));
        setErro(null);
      })
      .catch(function (e) { setErro(pjErr(e)); });
  }, [projetoId]);
  R.useEffect(function () { carregar(); }, [carregar]);

  // DIRTY por campo: o PUT leva SÓ o que mudou (op_code '' com vínculo anterior vira null).
  const mudancas = function () {
    if (!proj || !form) return {};
    const body = {};
    if (form.nome.trim() !== proj.name) body.name = form.nome.trim();
    if (form.desc.trim() !== (proj.description || '')) body.description = form.desc.trim();
    if (form.prioridade !== proj.priority) body.priority = form.prioridade;
    if (form.cor !== proj.color) body.color = form.cor;
    if (JSON.stringify(cls) !== JSON.stringify(proj.checklists || [])) body.checklists = cls;
    const opAtual = proj.op_code || '';
    const opNovo = String(form.opCode || '').trim();
    if (opNovo !== opAtual) body.op_code = opNovo === '' ? null : opNovo;
    return body;
  };
  const dirty = Object.keys(mudancas()).length > 0;

  const salvar = function () {
    const body = mudancas();
    if (Object.keys(body).length === 0 || agindo) return;
    if (body.name === '') { setForm({ ...form, erro: 'Nome é obrigatório.' }); return; }
    setAgindo(true);
    window.FRApi.put(`/dev-projects/${projetoId}`, body)
      .then(function () { return carregar(); })
      .then(function () { if (onChanged) onChanged(); })
      .catch(function (e) { setForm(function (m) { return { ...m, erro: pjErr(e) }; }); })
      .then(function () { setAgindo(false); });
  };
  const mudarStatus = function (alvo) {
    setAgindo(true);
    window.FRApi.put(`/dev-projects/${projetoId}`, { status: alvo })
      .then(function () { if (onChanged) onChanged(); onClose(); })
      .catch(function (e) { setErro(pjErr(e)); setConfirmando(null); setAgindo(false); });
  };
  const excluir = function () {
    setAgindo(true);
    window.FRApi.delete(`/dev-projects/${projetoId}`)
      .then(function () { if (onChanged) onChanged(); onClose(); })
      .catch(function (e) { setErro(pjErr(e)); setConfirmando(null); setAgindo(false); });
  };

  // Editor de checklists (limites da borda aplicados AQUI — a UI impede antes do 400).
  const addChecklist = function (titulo) { const v = String(titulo || '').trim(); if (!v || cls.length >= 20) return; setCls(cls.concat([{ titulo: v.slice(0, 200), itens: [] }])); };
  const renomear = function (ci, v) { setCls(cls.map(function (c, j) { return j === ci ? { ...c, titulo: v.slice(0, 200) } : c; })); };
  const delChecklist = function (ci) { setCls(cls.filter(function (_, j) { return j !== ci; })); };
  const addItem = function (ci, txt) { const v = String(txt || '').trim(); if (!v) return; setCls(cls.map(function (c, j) { return j === ci && c.itens.length < 100 ? { ...c, itens: c.itens.concat([{ t: v.slice(0, 500), done: false }]) } : c; })); };
  const toggleItem = function (ci, ii) { setCls(cls.map(function (c, j) { return j === ci ? { ...c, itens: c.itens.map(function (i, k) { return k === ii ? { ...i, done: !i.done } : i; }) } : c; })); };
  const delItem = function (ci, ii) { setCls(cls.map(function (c, j) { return j === ci ? { ...c, itens: c.itens.filter(function (_, k) { return k !== ii; }) } : c; })); };

  const prog = pjProgresso(cls);
  const arquivado = proj && proj.status === 'arquivado';

  return (
    <div onClick={() => { if (!agindo) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => { e.stopPropagation(); setMenuAberto(false); }} style={{ width: 'min(760px,97vw)', maxHeight: '94vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        {!proj ? (
          <div style={{ padding: 48, textAlign: 'center', color: erro ? uiTone(t, 'red').fg : t.muted, fontSize: 13.5, fontWeight: erro ? 700 : 400 }}>{erro || 'Carregando projeto…'}</div>
        ) : (
          <React.Fragment>
            <div style={{ height: 8, background: PJ_COR_HEX[form ? form.cor : proj.color] || PJ_COR_HEX.blue, flexShrink: 0 }} />
            <div style={{ padding: '14px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontSize: 16, fontWeight: 850, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.name}</div>
              {arquivado && <Badge t={t} kind="gray" dot>Arquivado</Badge>}
              <div style={{ position: 'relative' }}>
                <button onClick={(e) => { e.stopPropagation(); setMenuAberto(!menuAberto); }} title="Opções" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="dots" size={17} /></button>
                {menuAberto && (
                  <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', zIndex: 40, top: 'calc(100% + 6px)', right: 0, width: 200, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6 }}>
                    <button onClick={() => { setMenuAberto(false); setConfirmando('excluir'); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, fontSize: 13, fontWeight: 600, color: uiTone(t, 'red').fg }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <Icon name="trash" size={15} /> Excluir Projeto
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => !agindo && onClose()} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
            </div>
            <div className="fr-scroll" style={{ overflowY: 'auto', padding: '18px 22px', flex: 1 }}>
              {form && <PjCampos t={t} form={form} setForm={setForm} />}
              {/* progresso derivado — ao vivo, do estado editável */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 16 }}>
                <div style={{ flex: 1, height: 7, borderRadius: 5, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: `${prog.pct}%`, borderRadius: 5, background: prog.pct === 100 ? uiTone(t, 'green').fg : t.accent }} /></div>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: prog.pct === 100 ? uiTone(t, 'green').fg : t.text }}>{prog.pct}% · {prog.done}/{prog.total}</span>
              </div>
              {/* checklists */}
              <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14, marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', color: t.faint, textTransform: 'uppercase', marginBottom: 12 }}>Checklists ({cls.length}/20)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {cls.map(function (cl, ci) {
                    return (
                      <div key={ci}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <input value={cl.titulo} maxLength={200} onChange={(e) => renomear(ci, e.target.value)} style={{ flex: 1, minWidth: 0, height: 34, borderRadius: 8, border: `1px solid transparent`, background: 'transparent', color: t.text, padding: '0 8px', fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }}
                            onFocus={(e) => { e.target.style.border = `1px solid ${t.border}`; e.target.style.background = t.elevated; }} onBlur={(e) => { e.target.style.border = '1px solid transparent'; e.target.style.background = 'transparent'; }} />
                          <span style={{ fontSize: 11.5, color: t.muted, fontWeight: 600, flexShrink: 0 }}>{cl.itens.filter(function (i) { return i.done; }).length}/{cl.itens.length}</span>
                          <button onClick={() => delChecklist(ci)} title="Excluir checklist" style={{ all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}><Icon name="trash" size={14} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {cl.itens.map(function (it, ii) {
                            return (
                              <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: it.done ? t.elevated : 'transparent', border: `1px solid ${t.border}` }}>
                                <button onClick={() => toggleItem(ci, ii)} style={{ all: 'unset', cursor: 'pointer', width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0, background: it.done ? uiTone(t, 'green').fg : 'transparent', color: '#fff', border: `1.5px solid ${it.done ? 'transparent' : t.borderStrong}` }}>{it.done && <Icon name="check" size={13} />}</button>
                                <span style={{ flex: 1, fontSize: 13.5, color: it.done ? t.muted : t.text, textDecoration: it.done ? 'line-through' : 'none', overflowWrap: 'anywhere' }}>{it.t}</span>
                                <button onClick={() => delItem(ci, ii)} title="Remover item" style={{ all: 'unset', cursor: 'pointer', width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.faint, flexShrink: 0 }}><Icon name="x" size={13} /></button>
                              </div>
                            );
                          })}
                          <DevAddItem t={t} onAdd={(txt) => addItem(ci, txt)} disabled={cl.itens.length >= 100} />
                        </div>
                      </div>
                    );
                  })}
                  <DevAddChecklist t={t} onAdd={addChecklist} disabled={cls.length >= 20} />
                </div>
              </div>
              {form && form.erro && <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{form.erro}</div>}
              {erro && <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{erro}</div>}
            </div>
            <div style={{ padding: '13px 22px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Btn t={t} icon="check" kind={dirty ? 'primary' : 'ghost'} onClick={salvar}>{agindo ? 'Salvando…' : 'Salvar'}</Btn>
              {dirty && <span style={{ fontSize: 12, color: t.muted }}>Alterações não salvas</span>}
              <div style={{ marginLeft: 'auto' }}>
                {arquivado
                  ? <Btn t={t} icon="refresh" kind="soft" onClick={() => !agindo && mudarStatus('ativo')}>Reativar</Btn>
                  : <Btn t={t} icon="box" kind="ghost" onClick={() => setConfirmando('arquivar')}>Arquivar</Btn>}
              </div>
            </div>
          </React.Fragment>
        )}
      </div>

      {confirmando && (
        <div onClick={(e) => { e.stopPropagation(); if (!agindo) setConfirmando(null); }} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,10,16,.6)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(460px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, boxShadow: t.shadow, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: uiTone(t, confirmando === 'excluir' ? 'red' : 'amber').bg, color: uiTone(t, confirmando === 'excluir' ? 'red' : 'amber').fg, display: 'grid', placeItems: 'center' }}><Icon name="alert" size={18} /></span>
              <div style={{ fontSize: 15, fontWeight: 850, color: t.text }}>{confirmando === 'excluir' ? 'Excluir projeto' : 'Arquivar projeto'}</div>
            </div>
            <div style={{ fontSize: 13.5, color: t.text, lineHeight: 1.55 }}>
              {confirmando === 'excluir'
                ? 'Excluir apaga o projeto e os checklists definitivamente — para pausar, use Arquivar.'
                : 'Arquivar tira o projeto da grade ativa (reversível — ele fica na aba Arquivados).'}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn t={t} kind="ghost" onClick={() => !agindo && setConfirmando(null)}>Voltar</Btn>
              <button onClick={() => { if (agindo) return; confirmando === 'excluir' ? excluir() : mudarStatus('arquivado'); }}
                style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: confirmando === 'excluir' ? uiTone(t, 'red').fg : t.accent, color: '#fff', opacity: agindo ? 0.6 : 1 }}>
                {agindo ? 'Aplicando…' : confirmando === 'excluir' ? 'Excluir definitivamente' : 'Arquivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Gate padrão da casa: sem a page_key 'projetos' a tela interna NEM MONTA (zero rede).
// Admin passa pelo bypass; a chave existe no universo (migration 013) e é concedível
// a outros papéis pela tela Permissões.
function DevProjetos({ t }) {
  const A = window.FRAuth;
  if (!A || typeof A.canAccess !== 'function' || !A.canAccess('projetos')) {
    return (
      <div>
        <PageHeader t={t} title="Projetos" subtitle="Projetos internos do time de desenvolvimento." />
        <Card t={t} style={{ padding: 40, textAlign: 'center' }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'inline-grid', placeItems: 'center', marginBottom: 14 }}><Icon name="lock" size={24} /></span>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700 }}>
            Acesso bloqueado. Não possui o nível de permissão necessário (projetos) para ver os projetos.
          </div>
        </Card>
      </div>
    );
  }
  return <DevProjetosReal t={t} />;
}

function DevModule(props) {
  const t = frTokens(props.theme, DV_ACCENT, DV_ACCENT_T);
  // O seed de chamados MORREU com a fila real. Sobrou o dev-chat (mock, inalcançável pelo
  // cadeado de prefixo), que recebe lista vazia até o tempo real nascer. O Painel NÃO usa
  // mais este estado — ele lê GET /dev-dashboard direto do banco.
  const [chamados, setChamados] = useStateDV([]);
  const p = { ...props, t, chamados, setChamados };
  if (props.active === 'dev-chamados') return <DevChamados {...p} />;
  if (props.active === 'dev-chat') return <DevChat {...p} />;
  if (props.active === 'dev-projetos') return <DevProjetos {...p} />;
  return <DevPainel {...p} />;
}

// persistent module wrapper so chamados state survives page switches
function renderPageDev(active, props) {
  return <DevModule active={active} {...props} />;
}
window.renderPageDev = renderPageDev;
