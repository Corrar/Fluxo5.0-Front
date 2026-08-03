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

  // HERO do redesign — só o traje. A saudação sai do relógio local e o nome do perfil REAL
  // (FRAuth.profile.name, não o window.USER do mock). A linha de baixo repete números que já
  // vieram do /dev-dashboard: nenhum número novo nasce aqui. As "orientações diárias", os
  // atalhos p/ dev-area/dev-custos e os KPIs cravados do desenho ficaram de fora — sem fonte.
  const dpHoraAgora = new Date().getHours();
  const dpSaudacao = dpHoraAgora < 12 ? 'Bom dia' : dpHoraAgora < 18 ? 'Boa tarde' : 'Boa noite';
  const dpNome = (((window.FRAuth && window.FRAuth.profile && window.FRAuth.profile.name) || '').trim().split(' ')[0]) || 'Dev';

  return (
    <div>
      {cabecalho}

      <div style={{ borderRadius: 22, padding: '26px 28px', marginBottom: 18, background: t.panel, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: t.accentText, marginBottom: 8 }}>Painel do desenvolvedor</div>
        <h2 style={{ margin: 0, fontSize: 30, fontWeight: 850, letterSpacing: '-.03em', color: t.text, lineHeight: 1.1 }}>{dpSaudacao}, {dpNome}</h2>
        <p style={{ margin: '8px 0 0', fontSize: 13.5, color: t.muted }}>
          {fila.fila_total || 0} na fila · {fila.em_desenvolvimento || 0} em desenvolvimento · {fila.sem_atendente || 0} sem atendente.
        </p>
      </div>

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
// falta, volta como feature própria). O dev-chat, que aqui ainda era "mock cadeado", MORREU
// DE VEZ em 01/08 — ver a lápide mais abaixo neste arquivo.
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
  // KPIs do hero — só o que sai do MESMO GET que monta a fila, nada estimado.
  const ativosN = groups.novos.length + groups.dev.length;
  const urgentesN = groups.novos.concat(groups.dev).filter(function (x) { return x.priority === 'alta'; }).length;

  return (
    <div>
      <PageHeader t={t} title="Chamados" subtitle="Fila única de suporte — todos os chamados abertos pelos setores, direto do banco." />

      {/* HERO do redesign — traje. O subtítulo do desenho ("ordenados por prioridade real: SLA,
          urgência e tempo") foi RECUSADO: não existe score nem SLA no nosso contrato e a ordem é
          a do GET. Dos 5 KPIs do desenho sobraram 2: "aguardando user" não tem status no backend,
          "fechados (7d)" era fechados.length + 10 (número inflado no mock) e "SLA 92%" é cravado. */}
      <div style={{ borderRadius: 22, padding: '24px 26px', marginBottom: 18, background: t.panel, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: t.accentText, marginBottom: 8 }}>Fila de suporte</div>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 850, letterSpacing: '-.03em', color: t.text, lineHeight: 1.1 }}>Chamados do time</h2>
        <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginTop: 16 }}>
          {[['ABERTOS', ativosN, t.text], ['URGENTES', urgentesN, urgentesN > 0 ? uiTone(t, 'red').fg : t.text]].map(function (kv) {
            return (
              <div key={kv[0]}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.08em', color: t.faint }}>{kv[0]}</div>
                <div style={{ fontSize: 26, fontWeight: 850, color: kv[2], letterSpacing: '-.02em', marginTop: 2 }}>{kv[1]}</div>
              </div>
            );
          })}
        </div>
      </div>
      {loading ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando a fila…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => carregar(true)}>Tentar novamente</Btn>
        </Card>
      ) : (
        <React.Fragment>
          {/* chips do redesign (pílula sólida no ativo) — mesmo estado `tab`, mesmos contadores */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            {tabs.map(function ([k, label]) {
              const on = tab === k;
              return (
                <button key={k} onClick={() => setTab(k)} style={{ all: 'unset', cursor: 'pointer', height: 38, padding: '0 16px', borderRadius: 999, fontSize: 12.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', background: on ? t.text : t.panel, color: on ? t.panel : t.muted, border: `1px solid ${on ? t.text : t.border}`, transition: 'all .14s' }}>{label} ({groups[k].length})</button>
              );
            })}
          </div>
          {/* LISTA EM LINHAS (traje do redesign) — as colunas `score`, `tag` e `extra` do desenho
              não entraram: não existem no contrato /tickets. Cada campo abaixo vem do MESMO GET
              que a grade de cards usava; o wiring (setAberto) é o mesmo. */}
          <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
            {view.length === 0 && <div style={{ padding: 10 }}><EmptyState t={t} title="Nada por aqui" sub="Nenhum chamado neste grupo." /></div>}
            {view.map(function (c, i) {
              const st = Tk.TK_STATUS[c.status] || Tk.TK_STATUS.aberto;
              const prio = Tk.TK_PRIO[c.priority] || [c.priority, 'gray'];
              return (
                <div key={c.id} onClick={() => setAberto(c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer', flexWrap: 'wrap', borderTop: i ? `1px solid ${t.border}` : 'none', transition: 'background .14s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5, fontWeight: 850, color: t.muted }}>TI-{c.display_no}</span>
                      <Badge t={t} kind={prio[1]} dot>{prio[0]}</Badge>
                      <Badge t={t} kind={st.kind} dot>{st.label}</Badge>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginTop: 8, letterSpacing: '-.01em' }}>{c.title}</div>
                    <div style={{ fontSize: 12.5, color: t.muted, marginTop: 4 }}>
                      {c.requester_name} · {c.requester_sector}{c.assignee_name ? ` · atendente: ${c.assignee_name}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, marginLeft: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 34, height: 34, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 11.5 }}>{String(c.requester_name || '?').split(' ').map(function (x) { return x[0]; }).filter(Boolean).slice(0, 2).join('').toUpperCase()}</span>
                      <span style={{ fontSize: 11.5, color: t.faint, whiteSpace: 'nowrap' }}>{Tk.tkQuando(c.created_at)}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setAberto(c.id); }} style={{ all: 'unset', cursor: 'pointer', height: 40, padding: '0 18px', borderRadius: 999, fontSize: 13, fontWeight: 800, color: t.text, background: t.panel, border: `1px solid ${t.borderStrong}`, display: 'inline-flex', alignItems: 'center', gap: 7 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = t.panel; }}>Abrir <Icon name="chevronRight" size={14} /></button>
                  </div>
                </div>
              );
            })}
          </Card>
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

// ---------- dev-chat: MORREU DE VEZ (decisão do Bruno, 01/08/2026) ----------
// O DevChat era mock cadeado: uma tela de conversa alimentada por estado local que nunca teve
// backend. O helpdesk real cobre o que ele prometia — o solicitante fala em Meus Chamados, o
// atendente responde na fila, e a timeline do TicketDetail É a conversa, persistida no banco.
// Removido INTEIRO (item de menu, componente e cadeado): não é rota dormente como o
// dev-projetos — é feature que não existe mais. Se o chat voltar um dia, nasce com backend.


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

// ---------- Repositórios + Relatório de código (REAL — dev-repos v1, migration 018) ----------
// LIGAÇÃO REAL: /dev-repos (router inteiro atrás de requirePermission('dev_repos')).
//
// O CONTRATO QUE A TELA PRECISA HONRAR: o backend serve um ESPELHO local dos commits, não o
// GitHub ao vivo. Por isso o carimbo "sincronizado em X" fica SEMPRE visível — sem ele o
// usuário leria dado de ontem achando que é de agora, que é o único jeito de este relatório
// mentir. A tela nunca esconde a idade do dado.
const DR_PAGE = 25;

// Presets = AÇÚCAR: viram from/to antes de sair da tela. O backend só conhece intervalo.
const DR_PRESETS = [['7', '7 dias'], ['30', '30 dias'], ['60', '60 dias']];

function drYmd(d) { return d.toISOString().slice(0, 10); }
function drHojeYmd() { return drYmd(new Date()); }
function drDesdeYmd(dias) { const d = new Date(); d.setDate(d.getDate() - Number(dias)); return drYmd(d); }

// Data+hora do commit em PT-BR. O relatório é sobre trabalho — o dia importa e a hora ajuda a
// entender a sequência do que foi feito.
function drDataHora(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
// "há 3 minutos" — o carimbo do espelho é sobre RECÊNCIA; a data absoluta vai no title.
function drRelativo(iso) {
  if (!iso) return 'nunca';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'agora mesmo';
  if (s < 3600) { const m = Math.floor(s / 60); return `há ${m} ${m === 1 ? 'minuto' : 'minutos'}`; }
  if (s < 86400) { const h = Math.floor(s / 3600); return `há ${h} ${h === 1 ? 'hora' : 'horas'}`; }
  const dd = Math.floor(s / 86400);
  if (dd < 30) return `há ${dd} ${dd === 1 ? 'dia' : 'dias'}`;
  return drDataHora(iso);
}
// O interceptor do FRApi NORMALIZA o erro para { status, message, raw } — não existe
// `e.response` do lado de cá. Ler `e.response.data.error` (reflexo de axios cru) faz TODA
// mensagem do backend virar o fallback genérico: foi assim que o 409 do DELETE, que já vem
// com a saída escrita ("desative-o"), aparecia como "não foi possível falar com o servidor"
// — o pior tipo de erro, o que troca uma instrução por um beco. Mesmo helper das telas
// irmãs (tkFilaErr/pjErr).
function drErro(e) {
  const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
  return g ? g(e) : (e && e.message) || 'Erro inesperado.';
}
// Status normalizado — é `e.status`, não `e.response.status`.
function drStatus(e) { return e && e.status; }

// Badge de status do repo. Três estados, três FRASES — 'nunca' não é erro, e tratar os dois
// igual (um "!" vermelho pra ambos) faria o usuário procurar defeito onde só falta apertar.
function DrStatusRepo({ t, repo }) {
  const st = repo.last_sync_status;
  if (st === 'erro') {
    return (
      <span title={repo.last_sync_error || 'Falha na última sincronização'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'help', fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg }}>
        <Icon name="alert" size={12} /> Falhou
      </span>
    );
  }
  if (st === 'ok') {
    return (
      <span title={drDataHora(repo.last_synced_at)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: uiTone(t, 'green').bg, color: uiTone(t, 'green').fg }}>
        <Icon name="check" size={12} /> {drRelativo(repo.last_synced_at)}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: t.elevated, color: t.muted, border: `1px solid ${t.border}` }}>
      <Icon name="clock" size={12} /> Sincronize primeiro
    </span>
  );
}

function DevReposReal({ t }) {
  const R = React;
  const [aba, setAba] = useStateDV('relatorio');

  // ── Repositórios ──
  const [repos, setRepos] = useStateDV([]);
  const [loadingRepos, setLoadingRepos] = useStateDV(true);
  const [erroRepos, setErroRepos] = useStateDV(null);
  const [novo, setNovo] = useStateDV(null);
  const [confirmando, setConfirmando] = useStateDV(null);
  const [agindo, setAgindo] = useStateDV(false);
  // Progresso da sincronização: qual repo está rodando AGORA e o que já terminou. As syncs são
  // sequenciais no backend e podem demorar — sem isso a tela pareceria congelada e o usuário
  // apertaria o botão de novo, dobrando a chamada numa API com rate limit.
  const [sincronizando, setSincronizando] = useStateDV(null);   // id do repo em andamento
  const [progresso, setProgresso] = useStateDV(null);           // {feitos, total, resultados[]}
  const [feedback, setFeedback] = useStateDV(null);

  const carregarRepos = R.useCallback(function (inicial) {
    if (inicial) setLoadingRepos(true);
    return window.FRApi.get('/dev-repos', { skipLoading: true })
      .then(function (r) { setRepos((r.data && r.data.repos) || []); setErroRepos(null); if (inicial) setLoadingRepos(false); })
      .catch(function (e) { setErroRepos(drErro(e)); if (inicial) setLoadingRepos(false); });
  }, []);
  R.useEffect(function () { carregarRepos(true); }, [carregarRepos]);

  // ── Relatório ──
  const [preset, setPreset] = useStateDV('7');
  const [de, setDe] = useStateDV(drDesdeYmd(7));
  const [ate, setAte] = useStateDV(drHojeYmd());
  const [repoFiltro, setRepoFiltro] = useStateDV('');
  const [offset, setOffset] = useStateDV(0);
  const [rel, setRel] = useStateDV(null);
  const [loadingRel, setLoadingRel] = useStateDV(true);
  const [erroRel, setErroRel] = useStateDV(null);
  const [erroPeriodo, setErroPeriodo] = useStateDV(null);

  const aplicarPreset = function (p) {
    setPreset(p);
    setErroPeriodo(null);
    setOffset(0);
    if (p !== 'custom') { setDe(drDesdeYmd(p)); setAte(drHojeYmd()); }
  };

  const carregarRel = R.useCallback(function () {
    // Validação NA BORDA da tela, espelhando a do backend: from > to é 400 lá, e mandar pra
    // tomar 400 seria pedir ao servidor que corrija o que a tela já sabe.
    if (de && ate && de > ate) {
      setErroPeriodo('A data inicial é posterior à final.');
      setLoadingRel(false);
      return Promise.resolve();
    }
    setErroPeriodo(null);
    setLoadingRel(true);
    const p = new URLSearchParams();
    if (de) p.set('from', de);
    if (ate) p.set('to', ate);
    if (repoFiltro) p.set('repo_id', repoFiltro);
    p.set('limit', String(DR_PAGE));
    p.set('offset', String(offset));
    return window.FRApi.get(`/dev-repos/report?${p.toString()}`, { skipLoading: true })
      .then(function (r) { setRel(r.data); setErroRel(null); setLoadingRel(false); })
      .catch(function (e) { setErroRel(drErro(e)); setLoadingRel(false); });
  }, [de, ate, repoFiltro, offset]);
  R.useEffect(function () { carregarRel(); }, [carregarRel]);

  // ── Ações ──
  const sincronizarUm = function (repo) {
    if (sincronizando) return;
    setSincronizando(repo.id); setFeedback(null);
    window.FRApi.post(`/dev-repos/${repo.id}/sync`, {})
      .then(function (r) {
        const n = (r.data && r.data.novos) || 0;
        setFeedback({ tom: 'green', txt: `${repo.owner}/${repo.name}: ${n} commit(s) novo(s) — total ${r.data && r.data.total}.` });
      })
      .catch(function (e) { setFeedback({ tom: 'red', txt: `${repo.owner}/${repo.name}: ${drErro(e)}` }); })
      // O finally recarrega SEMPRE: no erro, o que mudou é o carimbo (status/erro), e o
      // usuário precisa vê-lo tanto quanto veria o sucesso.
      .finally(function () { setSincronizando(null); carregarRepos(false); carregarRel(); });
  };

  const sincronizarTodos = function () {
    if (sincronizando || progresso) return;
    const ativos = repos.filter(function (r) { return r.active; });
    if (ativos.length === 0) return;
    setFeedback(null);
    setProgresso({ feitos: 0, total: ativos.length, resultados: [] });
    // Sequencial NO FRONT também, um POST /:id/sync por repo, em vez do /sync-all: o sync-all
    // resolve tudo numa requisição só e a tela ficaria muda até o fim. Aqui cada repo que
    // termina aparece na hora — mesmo custo no servidor, e o usuário vê o trabalho andando.
    let i = 0;
    const proximo = function () {
      if (i >= ativos.length) {
        setProgresso(null);
        setSincronizando(null);
        carregarRepos(false);
        carregarRel();
        return;
      }
      const repo = ativos[i];
      setSincronizando(repo.id);
      window.FRApi.post(`/dev-repos/${repo.id}/sync`, {})
        .then(function (r) {
          setProgresso(function (p) { return { feitos: i + 1, total: ativos.length, resultados: (p ? p.resultados : []).concat([{ repo: `${repo.owner}/${repo.name}`, ok: true, novos: (r.data && r.data.novos) || 0 }]) }; });
        })
        .catch(function (e) {
          // A falha de um NÃO interrompe a fila — mesmo contrato do /sync-all no backend.
          setProgresso(function (p) { return { feitos: i + 1, total: ativos.length, resultados: (p ? p.resultados : []).concat([{ repo: `${repo.owner}/${repo.name}`, ok: false, erro: drErro(e) }]) }; });
        })
        .finally(function () { i += 1; carregarRepos(false); proximo(); });
    };
    proximo();
  };

  const criar = function () {
    const n = novo || {};
    const owner = String(n.owner || '').trim();
    const name = String(n.name || '').trim();
    const RE = /^[A-Za-z0-9_.-]+$/;
    if (!owner) return setNovo({ ...n, erro: 'Informe o owner (usuário ou organização).' });
    if (!name) return setNovo({ ...n, erro: 'Informe o nome do repositório.' });
    if (owner.length > 100 || name.length > 100) return setNovo({ ...n, erro: 'Owner e nome devem ter no máximo 100 caracteres.' });
    if (!RE.test(owner) || !RE.test(name)) return setNovo({ ...n, erro: 'Use apenas letras, números, ponto, hífen e underscore.' });
    setAgindo(true);
    window.FRApi.post('/dev-repos', { owner, name })
      .then(function () { setNovo(null); setAgindo(false); carregarRepos(false); setFeedback({ tom: 'green', txt: `${owner}/${name} cadastrado. Sincronize para trazer os commits.` }); })
      .catch(function (e) { setNovo({ ...n, erro: drErro(e) }); setAgindo(false); });
  };

  const alternarAtivo = function (repo) {
    window.FRApi.put(`/dev-repos/${repo.id}`, { active: !repo.active })
      .then(function () { carregarRepos(false); carregarRel(); })
      .catch(function (e) { setFeedback({ tom: 'red', txt: drErro(e) }); });
  };

  const excluir = function (repo) {
    setAgindo(true);
    window.FRApi.delete(`/dev-repos/${repo.id}`)
      .then(function () { setConfirmando(null); setAgindo(false); carregarRepos(false); carregarRel(); })
      .catch(function (e) {
        // 409 = tem histórico. A mensagem do backend JÁ traz a saída (desativar) — repassar a
        // frase dele evita duas versões da mesma regra vivendo em lugares diferentes.
        setConfirmando({ ...confirmando, erro: drErro(e), ofereceDesativar: drStatus(e) === 409 });
        setAgindo(false);
      });
  };

  const commits = (rel && rel.commits) || [];
  const total = (rel && rel.total) || 0;
  const porRepo = (rel && rel.por_repo) || [];
  const temAnterior = offset > 0;
  const temProxima = offset + commits.length < total;
  const primeiro = total === 0 ? 0 : offset + 1;
  const ultimo = offset + commits.length;
  const nuncaSync = (rel && rel.nunca_sincronizados) || 0;
  const ativos = (rel && rel.repos_ativos) || 0;
  const pageBtn = (ativo) => ({
    all: 'unset', boxSizing: 'border-box', cursor: ativo ? 'pointer' : 'not-allowed',
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
    borderRadius: 10, fontSize: 13, fontWeight: 700,
    background: ativo ? t.elevated : 'transparent', color: ativo ? t.text : t.faint,
    border: `1px solid ${ativo ? t.border : 'transparent'}`,
  });

  return (
    <div>
      <PageHeader t={t} title="Repositórios" subtitle="O trabalho em código do time, espelhado do GitHub e consultável por período." />

      {/* Abas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['relatorio', 'Relatório'], ['repos', `Repositórios (${repos.length})`]].map(function ([k, label]) {
          const on = aba === k;
          return (
            <button key={k} onClick={() => setAba(k)} style={{
              all: 'unset', cursor: 'pointer', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 999,
              background: on ? t.accent : t.elevated, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? 'transparent' : t.border}`,
            }}>{label}</button>
          );
        })}
      </div>

      {feedback && (
        <Card t={t} style={{ padding: '10px 14px', marginBottom: 14, background: uiTone(t, feedback.tom).bg, borderColor: uiTone(t, feedback.tom).fg }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: uiTone(t, feedback.tom).fg }}>{feedback.txt}</span>
        </Card>
      )}

      {/* ══════════ RELATÓRIO ══════════ */}
      {aba === 'relatorio' && (
        <>
          {/* Controles do período */}
          <Card t={t} style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              {DR_PRESETS.map(function ([k, label]) {
                const on = preset === k;
                return (
                  <button key={k} onClick={() => aplicarPreset(k)} style={{
                    all: 'unset', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, padding: '7px 14px', borderRadius: 999,
                    background: on ? t.accent : t.elevated, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? 'transparent' : t.border}`,
                  }}>{label}</button>
                );
              })}
              <button onClick={() => aplicarPreset('custom')} style={{
                all: 'unset', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, padding: '7px 14px', borderRadius: 999,
                background: preset === 'custom' ? t.accent : t.elevated, color: preset === 'custom' ? t.onAccent : t.muted,
                border: `1px solid ${preset === 'custom' ? 'transparent' : t.border}`,
              }}>Personalizado</button>

              {preset === 'custom' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="date" value={de} max={ate || undefined}
                    onChange={(e) => { setDe(e.target.value); setOffset(0); }}
                    style={{ height: 34, padding: '0 10px', borderRadius: 9, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 13, fontFamily: 'inherit' }} />
                  <span style={{ color: t.faint, fontSize: 13 }}>até</span>
                  <input type="date" value={ate} min={de || undefined} max={drHojeYmd()}
                    onChange={(e) => { setAte(e.target.value); setOffset(0); }}
                    style={{ height: 34, padding: '0 10px', borderRadius: 9, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 13, fontFamily: 'inherit' }} />
                </div>
              )}

              <select value={repoFiltro} onChange={(e) => { setRepoFiltro(e.target.value); setOffset(0); }}
                style={{ height: 34, padding: '0 10px', borderRadius: 9, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 13, fontFamily: 'inherit', marginLeft: 'auto' }}>
                <option value="">Todos os repositórios</option>
                {repos.map((r) => <option key={r.id} value={r.id}>{r.owner}/{r.name}</option>)}
              </select>
            </div>

            {erroPeriodo && (
              <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{erroPeriodo}</div>
            )}

            {/* O CARIMBO — sempre visível, mesmo carregando. É a honestidade do espelho: sem
                ele o usuário leria dado velho como se fosse de agora. */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.border}`, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: 12, color: t.muted }}>
              <Icon name="refresh" size={13} />
              <span>
                Espelho sincronizado <strong style={{ color: t.text }} title={drDataHora(rel && rel.ultima_sync)}>{drRelativo(rel && rel.ultima_sync)}</strong>
                {ativos > 0 && ` · ${ativos} ${ativos === 1 ? 'repositório ativo' : 'repositórios ativos'}`}
              </span>
              {nuncaSync > 0 && (
                <span style={{ color: uiTone(t, 'amber').fg, fontWeight: 700 }}>
                  · {nuncaSync} nunca {nuncaSync === 1 ? 'sincronizado' : 'sincronizados'}
                </span>
              )}
            </div>
          </Card>

          {loadingRel && <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13 }}>Carregando…</Card>}

          {!loadingRel && erroRel && (
            <Card t={t} style={{ padding: 30, textAlign: 'center' }}>
              <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{erroRel}</div>
              <Btn t={t} kind="ghost" onClick={() => carregarRel()}>Tentar novamente</Btn>
            </Card>
          )}

          {!loadingRel && !erroRel && (
            <>
              {/* Resumo por repo do PERÍODO (não da página) */}
              {porRepo.length > 0 && (
                <Card t={t} style={{ padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 10 }}>
                    {total} {total === 1 ? 'commit' : 'commits'} no período
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {porRepo.map((p) => (
                      <span key={p.repo_id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, padding: '5px 11px', borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}`, color: t.text }}>
                        <strong>{p.count}</strong> <span style={{ color: t.muted }}>{p.repo}</span>
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {/* Vazios HONESTOS por caso — são dois fatos diferentes e merecem dois textos. */}
              {commits.length === 0 && (
                <Card t={t} style={{ padding: 44, textAlign: 'center' }}>
                  {nuncaSync > 0 && total === 0 && ativos === nuncaSync ? (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 6 }}>Nenhum repositório sincronizado ainda</div>
                      <div style={{ fontSize: 13, color: t.muted, marginBottom: 16 }}>O espelho está vazio porque a sincronização nunca rodou — não porque não houve trabalho.</div>
                      <Btn t={t} icon="refresh" onClick={() => setAba('repos')}>Ir para Repositórios e sincronizar</Btn>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 6 }}>Nenhum commit no período</div>
                      <div style={{ fontSize: 13, color: t.muted }}>
                        Nada foi commitado entre {de ? drDataHora(`${de}T12:00:00Z`).slice(0, 10) : '—'} e {ate ? drDataHora(`${ate}T12:00:00Z`).slice(0, 10) : '—'}
                        {repoFiltro ? ' neste repositório' : ''}. Experimente um período maior.
                      </div>
                    </>
                  )}
                </Card>
              )}

              {/* A LISTA. A mensagem vem ÍNTEGRA (inclusive multilinha) — é o dado central do
                  relatório: truncar a mensagem seria jogar fora exatamente o que se veio ler. */}
              {commits.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {commits.map((c) => (
                    <Card key={`${c.repo_id}-${c.sha_curto}`} t={t} style={{ padding: 14 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: t.accentSoft, color: t.accentText }}>{c.sha_curto}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: t.text }}>{c.repo}</span>
                        <span style={{ fontSize: 12, color: t.muted }}>· {c.author_name || 'autor não identificado'}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: t.faint }} title={c.author_date}>{drDataHora(c.author_date)}</span>
                      </div>
                      {/* A mensagem vem ÍNTEGRA — nada é escondido. O que muda é só o PESO da
                          primeira linha (o assunto do commit): as mensagens desta casa têm corpo
                          longo, e sem esse destaque a lista vira um paredão onde não se acha o
                          que se veio ler. Truncar resolveria a altura jogando fora o dado
                          central; destacar resolve sem perder uma letra. */}
                      {(function () {
                        const txt = String(c.message || '');
                        const quebra = txt.indexOf('\n');
                        const assunto = quebra === -1 ? txt : txt.slice(0, quebra);
                        const corpo = quebra === -1 ? '' : txt.slice(quebra + 1).replace(/^\n+/, '');
                        return (
                          <>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, lineHeight: 1.45, wordBreak: 'break-word' }}>{assunto}</div>
                            {corpo && (
                              <div style={{ fontSize: 12.5, color: t.muted, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 6 }}>{corpo}</div>
                            )}
                          </>
                        );
                      })()}
                    </Card>
                  ))}
                </div>
              )}

              {/* Controles SÓ com mais de uma página (padrão Precificação) */}
              {(temAnterior || temProxima) && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                  <button disabled={!temAnterior} onClick={() => temAnterior && setOffset(Math.max(0, offset - DR_PAGE))} style={pageBtn(temAnterior)}>
                    <Icon name="chevronLeft" size={15} /> Anterior
                  </button>
                  <span style={{ fontSize: 12.5, color: t.muted }}>{primeiro}–{ultimo} de {total}</span>
                  <button disabled={!temProxima} onClick={() => temProxima && setOffset(offset + DR_PAGE)} style={pageBtn(temProxima)}>
                    Próxima <Icon name="chevronRight" size={15} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════ REPOSITÓRIOS ══════════ */}
      {aba === 'repos' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <Btn t={t} icon="plus" onClick={() => setNovo({})}>Cadastrar repositório</Btn>
            <Btn t={t} kind="ghost" icon="refresh" onClick={sincronizarTodos}>
              {progresso ? `Sincronizando ${progresso.feitos}/${progresso.total}…` : 'Sincronizar todos'}
            </Btn>
          </div>

          {/* Progresso POR REPO — a sync é sequencial e demora; a tela mostra o que já
              terminou em vez de um spinner mudo. */}
          {progresso && (
            <Card t={t} style={{ padding: 14, marginBottom: 14 }}>
              <div style={{ height: 6, borderRadius: 999, background: t.elevated, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', width: `${Math.round((progresso.feitos / progresso.total) * 100)}%`, background: t.accent, transition: 'width .25s' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {progresso.resultados.map((r, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: r.ok ? t.muted : uiTone(t, 'red').fg }}>
                    {r.ok ? `✓ ${r.repo}: ${r.novos} novo(s)` : `✕ ${r.repo}: ${r.erro}`}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {loadingRepos && <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13 }}>Carregando…</Card>}

          {!loadingRepos && erroRepos && (
            <Card t={t} style={{ padding: 30, textAlign: 'center' }}>
              <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{erroRepos}</div>
              <Btn t={t} kind="ghost" onClick={() => carregarRepos(true)}>Tentar novamente</Btn>
            </Card>
          )}

          {!loadingRepos && !erroRepos && repos.length === 0 && (
            <Card t={t} style={{ padding: 44, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 6 }}>Nenhum repositório cadastrado</div>
              <div style={{ fontSize: 13, color: t.muted }}>Cadastre um repositório do GitHub para começar a espelhar os commits.</div>
            </Card>
          )}

          {!loadingRepos && !erroRepos && repos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {repos.map((r) => (
                <Card key={r.id} t={t} style={{ padding: 14, opacity: r.active ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{r.owner}/{r.name}</span>
                        <DrStatusRepo t={t} repo={r} />
                        {!r.active && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: t.elevated, color: t.faint, border: `1px solid ${t.border}` }}>Inativo</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>
                        {r.commits} commit(s) no espelho
                        {r.last_sync_status === 'erro' && r.last_sync_error && (
                          <span style={{ color: uiTone(t, 'red').fg }}> · {r.last_sync_error}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => sincronizarUm(r)} disabled={!!sincronizando || !!progresso}
                        title={r.active ? 'Sincronizar este repositório' : 'Repositório inativo — sincronize mesmo assim'}
                        style={{ all: 'unset', boxSizing: 'border-box', cursor: (sincronizando || progresso) ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: t.elevated, color: t.text, border: `1px solid ${t.border}`, opacity: (sincronizando || progresso) ? 0.5 : 1 }}>
                        <Icon name="refresh" size={14} /> {sincronizando === r.id ? 'Sincronizando…' : 'Sincronizar'}
                      </button>
                      <button onClick={() => alternarAtivo(r)} title={r.active ? 'Desativar (sai do relatório e do sincronizar todos)' : 'Reativar'}
                        style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: 'transparent', color: t.muted, border: `1px solid ${t.border}` }}>
                        {r.active ? 'Desativar' : 'Reativar'}
                      </button>
                      <button onClick={() => setConfirmando({ repo: r })} title="Excluir"
                        style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 9, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}>
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal: cadastrar */}
      {novo && (
        <div onClick={() => !agindo && setNovo(null)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,10,16,.6)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(460px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, boxShadow: t.shadow, padding: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 850, color: t.text, marginBottom: 14 }}>Cadastrar repositório</div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.05em', color: t.faint, textTransform: 'uppercase', marginBottom: 6 }}>Owner (usuário ou organização)</div>
            <input autoFocus value={novo.owner || ''} onChange={(e) => setNovo({ ...novo, owner: e.target.value, erro: null })} placeholder="Ex.: Corrar"
              style={{ width: '100%', boxSizing: 'border-box', height: 40, padding: '0 12px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 13.5, fontFamily: 'inherit', marginBottom: 12 }} />
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.05em', color: t.faint, textTransform: 'uppercase', marginBottom: 6 }}>Nome do repositório</div>
            <input value={novo.name || ''} onChange={(e) => setNovo({ ...novo, name: e.target.value, erro: null })} placeholder="Ex.: Fluxo5.0-Front"
              onKeyDown={(e) => { if (e.key === 'Enter') criar(); }}
              style={{ width: '100%', boxSizing: 'border-box', height: 40, padding: '0 12px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 13.5, fontFamily: 'inherit' }} />
            <div style={{ fontSize: 12, color: t.faint, marginTop: 8 }}>O repositório precisa ser acessível pelo token configurado no servidor.</div>
            {novo.erro && <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{novo.erro}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn t={t} kind="ghost" onClick={() => !agindo && setNovo(null)}>Cancelar</Btn>
              <Btn t={t} onClick={criar}>{agindo ? 'Salvando…' : 'Cadastrar'}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal: excluir (409 vira orientação, não beco sem saída) */}
      {confirmando && (
        <div onClick={() => !agindo && setConfirmando(null)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,10,16,.6)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(470px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, boxShadow: t.shadow, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'grid', placeItems: 'center' }}><Icon name="alert" size={18} /></span>
              <div style={{ fontSize: 15, fontWeight: 850, color: t.text }}>Excluir repositório</div>
            </div>
            <div style={{ fontSize: 13.5, color: t.text, lineHeight: 1.5 }}>
              {confirmando.erro
                ? confirmando.erro
                : `Excluir ${confirmando.repo.owner}/${confirmando.repo.name} do cadastro? O histórico espelhado dele sai do relatório.`}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn t={t} kind="ghost" onClick={() => !agindo && setConfirmando(null)}>Voltar</Btn>
              {confirmando.ofereceDesativar ? (
                <Btn t={t} onClick={() => { alternarAtivo(confirmando.repo); setConfirmando(null); }}>Desativar em vez de excluir</Btn>
              ) : (
                <button onClick={() => !agindo && excluir(confirmando.repo)}
                  style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: uiTone(t, 'red').fg, color: '#fff', opacity: agindo ? 0.6 : 1 }}>
                  {agindo ? 'Excluindo…' : 'Excluir'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Gate padrão da casa: sem a page_key 'dev_repos' a tela interna NEM MONTA (zero rede).
// Admin passa pelo bypass; a chave nasceu na migration 018 e é concedível a outros papéis
// pela tela Permissões.
function DevRepos({ t }) {
  const A = window.FRAuth;
  if (!A || typeof A.canAccess !== 'function' || !A.canAccess('dev_repos')) {
    return (
      <div>
        <PageHeader t={t} title="Repositórios" subtitle="O trabalho em código do time, espelhado do GitHub." />
        <Card t={t} style={{ padding: 40, textAlign: 'center' }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'inline-grid', placeItems: 'center', marginBottom: 14 }}><Icon name="lock" size={24} /></span>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700 }}>
            Acesso bloqueado. Não possui o nível de permissão necessário (dev_repos) para ver o relatório de código.
          </div>
        </Card>
      </div>
    );
  }
  return <DevReposReal t={t} />;
}

function DevModule(props) {
  const t = frTokens(props.theme, DV_ACCENT, DV_ACCENT_T);
  const p = { ...props, t };
  if (props.active === 'dev-chamados') return <DevChamados {...p} />;
  // dev-projetos continua ROTEADO de propósito: perdeu a porta do menu (decisão de NAV
  // 01/08), mas a rota e a migration 013 seguem vivas. Quem chegar por localStorage antigo,
  // busca do topbar ou link direto encontra a tela funcionando — dormente não é morto.
  if (props.active === 'dev-projetos') return <DevProjetos {...p} />;
  if (props.active === 'dev-repos') return <DevRepos {...p} />;
  if (props.active === 'dev-area') return <DevAreaDev {...p} />;
  if (props.active === 'dev-custos') return <DevCustos {...p} />;
  return <DevPainel {...p} />;
}

// persistent module wrapper so chamados state survives page switches
function renderPageDev(active, props) {
  return <DevModule active={active} {...props} />;
}
window.renderPageDev = renderPageDev;
