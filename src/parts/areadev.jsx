// areadev.jsx — "Área Dev": agenda, tarefas, notas e snippets do desenvolvedor.
//
// LIGAÇÃO REAL ao backend (Fase 4 — migration 019), page_key 'dev_area':
//   GET/POST/PUT/DELETE  /dev-area/blocks    (?from=&to= — a visão mês pede o range REAL)
//   GET/POST/PUT/DELETE  /dev-area/notes
//   GET/POST/DELETE      /dev-area/snippets  (?q= server-side + limit/offset)
//
// EVENTO E TAREFA SÃO O MESMO RECURSO: `kind` separa. Foi a decisão de schema da Fase 4 e ela
// aparece aqui como economia real — uma busca por período traz as duas coisas, e a tela só
// escolhe onde desenhar cada uma.
//
// O QUE MORREU DO MOCK (e por quê):
//   • AD_EVENTS_SEED / AD_WK / AD_SEMANA / AD_AGENDA_MES_SEED / AD_TAREFAS_SEED /
//     AD_NOTAS_SEED / AD_SNIPPETS_SEED — todos. Nenhum número desta tela é estimado: a semana
//     conta blocos REAIS do período, não a legenda "8 blocos · sem espaços livres" do mock.
//   • adGoogleSync + o chip "Google Agenda conectado" — LÁPIDE. Era SIMULADO: cada save
//     disparava um toast dizendo que sincronizou com o Google, e nada saía do navegador.
//     Afirmar conexão que não existe é pior que não ter o botão. A integração real é missão
//     própria e, quando vier, segue o padrão do dev-repos: o Google é a FONTE, o nosso banco é
//     o ESPELHO, e falha lá fora vira carimbo na tela — nunca tela quebrada.
//   • 'leitura' como categoria de tarefa — o mock usava, o CHECK do banco não tem
//     (reuniao|estudo|trabalho|foco). Em vez de inventar uma quinta categoria no schema por
//     causa de uma linha de seed, a tela oferece as quatro que existem.
//
// TEMPO REAL: nenhum. Esta tela é de uso pessoal e single-writer — socket aqui seria peso sem
// ganho. Toda ação recarrega o que mudou.
const { useState: useStateAD } = React;

// CAT — FONTE ÚNICA da apresentação de categoria. A legenda do rodapé, os pontinhos do mês, o
// ponto das tarefas e os chips de filtro leem TODOS daqui. É o que impede o bug clássico de a
// legenda dizer uma cor e o ponto pintar outra: existindo um mapa só, divergir é impossível.
// São exatamente as 4 do CHECK do banco — 'leitura', que o mock usava, não existe.
const AD_CATS = {
  reuniao:  { label: 'REUNIÃO', fg: '#7c5cfc', bg: 'rgba(124,92,252,.12)' },
  estudo:   { label: 'ESTUDO', fg: '#d97706', bg: 'rgba(245,158,11,.14)' },
  trabalho: { label: 'TRABALHO', fg: '#6b7280', bg: 'rgba(120,130,140,.14)' },
  foco:     { label: 'FOCO', fg: '#16a34a', bg: 'rgba(34,197,94,.13)' },
};
const adCat = (k) => AD_CATS[k] || AD_CATS.trabalho;

// Copiar sem depender do clipboard moderno: navigator.clipboard SÓ existe em contexto seguro,
// e o nosso caso conhecido é justamente o inseguro (HTTP por IP de LAN). Fallback com textarea
// temporário + execCommand, e o resultado — os dois caminhos — sempre vira feedback visível.
function adCopiar(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texto).then(() => true).catch(() => adCopiarFallback(texto));
  }
  return Promise.resolve(adCopiarFallback(texto));
}
function adCopiarFallback(texto) {
  try {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) { return false; }
}
const AD_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const AD_DIAS_CURTOS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const AD_NOTA_CORES = ['', '#fdf0b3', '#cdf2da', '#d6e4fc', '#fcdcdc', '#fde3c3'];

const adErr = (e) => { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; };

// Datas SEM fuso: 'YYYY-MM-DD' montado à mão. new Date(iso).toISOString() empurraria o dia
// pra trás em fuso negativo — e "hoje" viraria ontem depois das 21h em São Paulo.
function adYmd(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function adHoje() { return adYmd(new Date()); }
// O `day` do backend chega como ISO; só o pedaço da data interessa (é DATE, sem hora).
function adDia(iso) { return String(iso || '').slice(0, 10); }
function adHora(t) { return t ? String(t).slice(0, 5) : ''; }
// Segunda-feira da semana que contém `d`.
function adSegunda(d) {
  const x = new Date(d);
  const dow = x.getDay();
  x.setDate(x.getDate() - (dow === 0 ? 6 : dow - 1));
  return x;
}
// "há 2h", "há 3d" — do updated_at REAL da nota, que já vinha no SELECT do controller.
function adQuando(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}
function adCalCells(ano, mes) {
  const first = new Date(ano, mes, 1).getDay();
  const dias = new Date(ano, mes + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= dias; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function DevAreaDevReal({ t }) {
  const R = window.React;
  const grn = uiTone(t, 'green');

  const [view, setView] = useStateAD('dia');
  const [ref, setRef] = useStateAD(() => new Date());   // âncora das três visões
  const [blocos, setBlocos] = useStateAD([]);
  const [notas, setNotas] = useStateAD([]);
  const [snips, setSnips] = useStateAD({ items: [], total: 0 });
  const [loading, setLoading] = useStateAD(true);
  const [error, setError] = useStateAD(null);

  const [criar, setCriar] = useStateAD(null);           // { day } — modal de evento
  const [novaTarefa, setNovaTarefa] = useStateAD(false);
  const [ntTxt, setNtTxt] = useStateAD('');
  const [ntCat, setNtCat] = useStateAD('estudo');
  const [ntDia, setNtDia] = useStateAD(adHoje());
  const [fTar, setFTar] = useStateAD('todas');
  const [fNota, setFNota] = useStateAD(null);
  const [tagEdit, setTagEdit] = useStateAD(null);
  const [tagVal, setTagVal] = useStateAD('');
  const [snBusca, setSnBusca] = useStateAD('');
  const [snPage, setSnPage] = useStateAD(0);
  const [novoSnip, setNovoSnip] = useStateAD(false);
  const [snLabel, setSnLabel] = useStateAD('');
  const [snCode, setSnCode] = useStateAD('');
  // Rascunho do textarea da nota: estado LOCAL de digitação. Não muda contrato nenhum — o
  // salvamento continua sendo o mesmo PUT no blur, só quando o texto mudou de fato.
  const [rascunho, setRascunho] = useStateAD({});
  // Relógio de minuto SÓ para a badge "AGORA". Sem ele a marca congela na virada do minuto e
  // passa a afirmar um "agora" que já passou. Limpo no unmount.
  const [, setTick] = useStateAD(0);
  R.useEffect(function () {
    const id = setInterval(function () { setTick((n) => n + 1); }, 60000);
    return function () { clearInterval(id); };
  }, []);

  // ── O PERÍODO DE CADA VISÃO ────────────────────────────────────────────────
  // Uma função só decide o range das três visões, e é ela que vai pro ?from=&to=. O mock tinha
  // três estruturas separadas (eventos do dia, AD_WK da semana, AD_AGENDA_MES do mês) que
  // podiam divergir entre si; aqui as três leem a MESMA coleção.
  const periodo = R.useMemo(function () {
    if (view === 'dia') { const d = adYmd(ref); return { from: d, to: d }; }
    if (view === 'semana') {
      const seg = adSegunda(ref);
      const sex = new Date(seg); sex.setDate(seg.getDate() + 4);
      return { from: adYmd(seg), to: adYmd(sex) };
    }
    const ini = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const fim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return { from: adYmd(ini), to: adYmd(fim) };
  }, [view, ref]);

  const carregarBlocos = R.useCallback(function () {
    return window.FRApi.get(`/dev-area/blocks?from=${periodo.from}&to=${periodo.to}`, { skipLoading: true })
      .then(function (r) { setBlocos((r.data && r.data.items) || []); setError(null); })
      .catch(function (e) { setError(adErr(e)); });
  }, [periodo.from, periodo.to]);

  const carregarNotas = R.useCallback(function () {
    return window.FRApi.get('/dev-area/notes', { skipLoading: true })
      .then(function (r) { setNotas((r.data && r.data.items) || []); })
      .catch(function (e) { setError(adErr(e)); });
  }, []);

  // Busca e paginação de snippets são SERVER-SIDE (?q=&limit=&offset=) — o mock filtrava e
  // paginava em memória, o que só funciona enquanto a lista cabe na tela.
  const SN_POR_PAG = 3;
  const carregarSnips = R.useCallback(function () {
    const q = snBusca.trim() ? `q=${encodeURIComponent(snBusca.trim())}&` : '';
    return window.FRApi.get(`/dev-area/snippets?${q}limit=${SN_POR_PAG}&offset=${snPage * SN_POR_PAG}`, { skipLoading: true })
      .then(function (r) { setSnips({ items: (r.data && r.data.items) || [], total: (r.data && r.data.total) || 0 }); })
      .catch(function (e) { setError(adErr(e)); });
  }, [snBusca, snPage]);

  R.useEffect(function () { carregarBlocos(); }, [carregarBlocos]);
  R.useEffect(function () { carregarNotas(); }, [carregarNotas]);
  // Debounce da busca: um GET por tecla estouraria o servidor sem melhorar nada.
  R.useEffect(function () {
    const id = setTimeout(function () { carregarSnips(); }, 250);
    return function () { clearTimeout(id); };
  }, [carregarSnips]);
  R.useEffect(function () {
    Promise.all([carregarBlocos(), carregarNotas()]).then(function () { setLoading(false); });
  }, []); // eslint-disable-line

  // ── DERIVADOS (todos de dado real) ─────────────────────────────────────────
  const eventos = blocos.filter(function (b) { return b.kind === 'evento'; });
  const tarefasPeriodo = blocos.filter(function (b) { return b.kind === 'tarefa'; });
  const abertas = tarefasPeriodo.filter(function (b) { return !b.done; }).length;

  const porDia = R.useMemo(function () {
    const m = {};
    blocos.forEach(function (b) { const d = adDia(b.day); (m[d] = m[d] || []).push(b); });
    return m;
  }, [blocos]);

  // A semana com CONTAGEM DERIVADA REAL — o mock cravava "8 blocos · sem espaços livres".
  const semana = R.useMemo(function () {
    const seg = adSegunda(ref);
    return Array.from({ length: 5 }, function (_, i) {
      const d = new Date(seg); d.setDate(seg.getDate() + i);
      const ymd = adYmd(d);
      const lista = porDia[ymd] || [];
      return { ymd, n: d.getDate(), d: AD_DIAS_CURTOS[d.getDay()], hoje: ymd === adHoje(), itens: lista, qtd: lista.length };
    });
  }, [ref, porDia]);

  // Chips por CATEGORIA (as 4 reais do CAT), como no desenho — ele filtrava por
  // Estudo/Trabalho/Leitura; 'leitura' não existe, então entram as quatro que existem.
  const tarefasView = fTar === 'todas' ? tarefasPeriodo : tarefasPeriodo.filter(function (x) { return x.category === fTar; });

  // Badge "AGORA": exige start_t E end_t (sem fim não há intervalo que contenha o instante) e
  // o dia igual a hoje. ARMADILHA DE DATA: `day` é DATE e `start_t` é TIME, ambos SEM fuso —
  // new Date('2026-08-03') seria lido como UTC e deslocaria o dia inteiro no Brasil. Por isso
  // a comparação é de STRING local: 'YYYY-MM-DD' contra adHoje(), e 'HH:MM' contra o relógio.
  const agoraHHMM = (function () { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}`; })();
  const estaAgora = function (b) {
    if (!b.start_t || !b.end_t) return false;
    if (adDia(b.day) !== adHoje()) return false;
    return adHora(b.start_t) <= agoraHHMM && agoraHHMM < adHora(b.end_t);
  };

  // Resumo da semana — DERIVADO do array já carregado, nunca uma segunda request e nunca os
  // "8 blocos · sem espaços livres" cravados do mock. Semana vazia mostra zero, que é legítimo.
  const resumoSemana = React.useMemo(function () {
    const todos = semana.reduce(function (acc, d) { return acc.concat(d.itens); }, []);
    return {
      total: todos.length,
      eventos: todos.filter(function (b) { return b.kind === 'evento'; }).length,
      tarefas: todos.filter(function (b) { return b.kind === 'tarefa'; }).length,
      feitas: todos.filter(function (b) { return b.kind === 'tarefa' && b.done; }).length,
    };
  }, [semana]);
  const notasView = fNota ? notas.filter(function (n) { return (n.tags || []).includes(fNota); }) : notas;
  const allTags = [...new Set(notas.flatMap(function (n) { return n.tags || []; }))].slice(0, 6);
  const snPags = Math.max(1, Math.ceil(snips.total / SN_POR_PAG));

  // ── AÇÕES ──────────────────────────────────────────────────────────────────
  const criarBloco = function (payload, rotulo) {
    return window.FRApi.post('/dev-area/blocks', payload)
      .then(function () {
        if (window.frNotify) window.frNotify({ icon: 'calendar', tone: 'green', titulo: payload.kind === 'evento' ? 'Horário marcado' : 'Tarefa criada', txt: rotulo });
        return carregarBlocos();
      })
      .catch(function (e) { setError(adErr(e)); });
  };
  const removerBloco = function (b) {
    return window.FRApi.delete('/dev-area/blocks/' + b.id)
      .then(function () { return carregarBlocos(); })
      .catch(function (e) { setError(adErr(e)); });
  };
  const alternarFeita = function (b) {
    return window.FRApi.put('/dev-area/blocks/' + b.id, { done: !b.done })
      .then(function () { return carregarBlocos(); })
      .catch(function (e) { setError(adErr(e)); });
  };

  const addTarefa = function () {
    if (!ntTxt.trim()) return;
    criarBloco({ kind: 'tarefa', day: ntDia, category: ntCat, title: ntTxt.trim() }, ntTxt.trim())
      .then(function () { setNtTxt(''); setNovaTarefa(false); });
  };

  const salvarNota = function (n, patch) {
    return window.FRApi.put('/dev-area/notes/' + n.id, patch)
      .then(function () { return carregarNotas(); })
      .catch(function (e) { setError(adErr(e)); });
  };
  const novaNota = function () {
    return window.FRApi.post('/dev-area/notes', { body: 'Nova anotação…', tags: [], color: '#fdf0b3' })
      .then(function () { if (window.frNotify) window.frNotify({ icon: 'pencil', tone: 'blue', titulo: 'Nota criada', txt: 'Clique no texto para editar.' }); return carregarNotas(); })
      .catch(function (e) { setError(adErr(e)); });
  };
  const removerNota = function (n) {
    return window.FRApi.delete('/dev-area/notes/' + n.id)
      .then(function () { return carregarNotas(); })
      .catch(function (e) { setError(adErr(e)); });
  };

  const addSnip = function () {
    if (!snLabel.trim() || !snCode.trim()) return;
    window.FRApi.post('/dev-area/snippets', { label: snLabel.trim(), code: snCode })
      .then(function () {
        if (window.frNotify) window.frNotify({ icon: 'terminal', tone: 'green', titulo: 'Snippet salvo', txt: snLabel.trim() });
        setSnLabel(''); setSnCode(''); setNovoSnip(false); setSnPage(0);
        return carregarSnips();
      })
      .catch(function (e) { setError(adErr(e)); });
  };
  const removerSnip = function (s) {
    window.FRApi.delete('/dev-area/snippets/' + s.id)
      .then(function () { return carregarSnips(); })
      .catch(function (e) { setError(adErr(e)); });
  };
  // Copiar NUNCA falha em silêncio: os dois caminhos (clipboard moderno e fallback do
  // execCommand) desembocam num feedback visível. Fora de contexto seguro — HTTP por IP de
  // LAN, o nosso caso — o navigator.clipboard nem existe, e sem o fallback o botão seria um
  // clique que não faz nada e não avisa.
  const copiar = function (s) {
    adCopiar(s.code).then(function (ok) {
      if (!window.frNotify) return;
      if (ok) window.frNotify({ icon: 'copy', tone: 'green', titulo: 'Snippet copiado', txt: s.label });
      else window.frNotify({ icon: 'alert', tone: 'amber', titulo: 'Não consegui copiar', txt: 'Selecione o texto do bloco e copie manualmente.' });
    });
  };

  // Navegação: um passo por visão (dia → 1 dia, semana → 7, mês → 1 mês).
  const andar = function (dir) {
    setRef(function (r) {
      const d = new Date(r);
      if (view === 'dia') d.setDate(d.getDate() + dir);
      else if (view === 'semana') d.setDate(d.getDate() + dir * 7);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  const rotuloPeriodo = view === 'mes'
    ? `${AD_MESES[ref.getMonth()]} · ${ref.getFullYear()}`
    : view === 'semana'
      ? `${semana[0] ? semana[0].n : ''} — ${semana[4] ? semana[4].n : ''} ${AD_MESES[ref.getMonth()].slice(0, 3).toLowerCase()}`
      : `${AD_DIAS_CURTOS[ref.getDay()]} ${ref.getDate()} de ${AD_MESES[ref.getMonth()].toLowerCase()}`;

  const cabecalho = (
    <div style={{ borderRadius: 22, padding: '28px 30px', marginBottom: 18, background: t.panel, border: `1px solid ${t.border}`, boxShadow: t.shadow, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 260 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: grn.fg, marginBottom: 10 }}>Área Dev</div>
        <h2 style={{ margin: 0, fontSize: 32, fontWeight: 850, letterSpacing: '-.03em', color: t.text, lineHeight: 1.05 }}>Seu espaço de trabalho.</h2>
        <p style={{ margin: '9px 0 0', fontSize: 13.5, color: t.muted, maxWidth: 480, lineHeight: 1.55 }}>Agenda, tarefas, anotações e snippets. Tudo fora dos chamados.</p>
      </div>
      {/* O chip "Google Agenda conectado" do desenho NÃO entrou — ver a lápide no cabeçalho do
          arquivo. O que fica é uma contagem que sai dos blocos reais do período. */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 15px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: grn.bg, color: grn.fg }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: grn.fg }} /> {abertas} {abertas === 1 ? 'tarefa aberta' : 'tarefas abertas'} no período
      </span>
    </div>
  );

  if (loading) {
    return <div><PageHeader t={t} title="Área Dev" subtitle="Agenda, tarefas, anotações e snippets." />
      <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando sua área…</Card></div>;
  }

  const btnNav = { all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 999, display: 'grid', placeItems: 'center', color: t.text, border: `1px solid ${t.border}` };

  return (
    <div>
      {cabecalho}
      {error && (
        <Card t={t} style={{ padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: uiTone(t, 'red').fg, fontSize: 12.5, fontWeight: 700, flex: 1 }}>{error}</span>
          <Btn t={t} kind="ghost" icon="refresh" onClick={() => { setError(null); carregarBlocos(); }}>Tentar de novo</Btn>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* ── COLUNA ESQUERDA: agenda + tarefas ── */}
        <div style={{ flex: '2 1 480px', minWidth: 320 }}>
          <Card t={t} style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: grn.fg, textTransform: 'uppercase' }}>{rotuloPeriodo}</div>
                <div style={{ fontSize: 21, fontWeight: 850, color: t.text, marginTop: 3, letterSpacing: '-.01em' }}>
                  {view === 'mes' ? 'Visão do mês' : view === 'semana' ? 'Sua semana' : 'Sua agenda do dia'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', gap: 4 }}>
                  <button title="Anterior" onClick={() => andar(-1)} style={btnNav}><Icon name="chevronLeft" size={14} /></button>
                  <button onClick={() => setRef(new Date())} style={{ all: 'unset', cursor: 'pointer', height: 34, padding: '0 14px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', fontSize: 12.5, fontWeight: 800, color: t.text, border: `1px solid ${t.border}` }}>hoje</button>
                  <button title="Próximo" onClick={() => andar(1)} style={btnNav}><Icon name="chevronRight" size={14} /></button>
                </span>
                <div style={{ display: 'inline-flex', gap: 3, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}` }}>
                  {['dia', 'semana', 'mes'].map((v) => (
                    <button key={v} onClick={() => setView(v)} style={{ all: 'unset', cursor: 'pointer', height: 30, padding: '0 13px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: view === v ? t.text : 'transparent', color: view === v ? t.panel : t.muted }}>{v === 'mes' ? 'mês' : v}</button>
                  ))}
                </div>
              </div>
            </div>

            {view === 'dia' && (
              <div style={{ padding: '18px 24px 8px' }}>
                {eventos.length === 0 && <div style={{ padding: '18px 0', fontSize: 13, color: t.muted }}>Nenhum horário marcado neste dia.</div>}
                {eventos.map((e, i) => {
                  const c = adCat(e.category);
                  const agora = estaAgora(e);
                  return (
                    <div key={e.id} style={{ display: 'flex', gap: 14, alignItems: 'stretch', padding: '7px 0', borderBottom: i < eventos.length - 1 ? `1px dashed ${t.border}` : 'none' }}>
                      <div style={{ width: 52, flexShrink: 0, paddingTop: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 850, color: t.text, fontFamily: 'ui-monospace, monospace' }}>{adHora(e.start_t) || '—'}</div>
                        {e.end_t && <div style={{ fontSize: 10, color: t.faint, fontFamily: 'ui-monospace, monospace' }}>até {adHora(e.end_t)}</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, borderRadius: 12, padding: '11px 15px', background: c.bg, border: agora ? `1.5px solid ${c.fg}` : '1.5px solid transparent', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 850, letterSpacing: '.08em', color: c.fg }}>{c.label}</span>
                            {agora && <span style={{ fontSize: 9.5, fontWeight: 850, letterSpacing: '.05em', padding: '2px 8px', borderRadius: 999, background: c.fg, color: '#fff' }}>AGORA</span>}
                          </div>
                          <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text, marginTop: 3 }}>{e.title}</div>
                        </div>
                        {agora && <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.fg, flexShrink: 0 }} />}
                        <button title="Remover" onClick={() => removerBloco(e)} style={{ all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.faint, flexShrink: 0 }}
                          onMouseEnter={(ev) => { ev.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(ev) => { ev.currentTarget.style.color = t.faint; }}><Icon name="x" size={13} /></button>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => setCriar({ day: adYmd(ref) })} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', margin: '10px 0 6px', height: 42, borderRadius: 12, border: `1.5px dashed ${t.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: t.muted }}><Icon name="plus" size={13} /> Marcar um horário neste dia</button>
              </div>
            )}

            {view === 'semana' && (
              <div className="fr-scroll" style={{ padding: '18px 24px 8px', overflowX: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))', gap: 10, minWidth: 640 }}>
                  {semana.map((d) => (
                    <div key={d.ymd}>
                      <button onClick={() => setCriar({ day: d.ymd })} title="Marcar neste dia" style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', textAlign: 'center', padding: '9px 0', borderRadius: 11, marginBottom: 8, background: d.hoje ? grn.fg : t.elevated, color: d.hoje ? '#fff' : t.text, border: `1px solid ${d.hoje ? grn.fg : t.border}` }}>
                        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em', opacity: .75 }}>{d.d}</div>
                        <div style={{ fontSize: 17, fontWeight: 850 }}>{d.n}</div>
                      </button>
                      {/* CONTAGEM DERIVADA REAL — o mock escrevia "8 blocos · sem espaços livres". */}
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: t.faint, textAlign: 'center', marginBottom: 8 }}>
                        {d.qtd === 0 ? 'livre' : `${d.qtd} ${d.qtd === 1 ? 'bloco' : 'blocos'}`}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {d.itens.map((b) => {
                          const c = AD_CATS[b.category] || AD_CATS.trabalho;
                          return (
                            <div key={b.id} title={b.title} style={{ borderRadius: 9, padding: '7px 9px', background: c.bg, borderLeft: `3px solid ${c.fg}` }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: c.fg, fontFamily: 'ui-monospace, monospace' }}>{adHora(b.start_t) || (b.kind === 'tarefa' ? 'tarefa' : '—')}</div>
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'mes' && (
              <div style={{ padding: '18px 24px 14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                  {AD_DIAS_CURTOS.map((d) => <div key={d} style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em', color: t.faint }}>{d}</div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                  {adCalCells(ref.getFullYear(), ref.getMonth()).map((d, i) => {
                    if (d === null) return <div key={'v' + i} />;
                    const ymd = adYmd(new Date(ref.getFullYear(), ref.getMonth(), d));
                    const itens = porDia[ymd] || [];
                    const hoje = ymd === adHoje();
                    return (
                      <button key={ymd} onClick={() => setCriar({ day: ymd })} title={itens.length ? itens.map((x) => `${adHora(x.start_t) || '—'} ${x.title}`).join('\n') : 'Marcar neste dia'}
                        style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', minHeight: 62, padding: '7px 8px', borderRadius: 10, background: hoje ? grn.bg : t.elevated, border: `1px solid ${hoje ? grn.fg : t.border}`, display: 'flex', flexDirection: 'column', transition: 'border-color .12s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = grn.fg; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = hoje ? grn.fg : t.border; }}>
                        <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12.5, fontWeight: 850, color: hoje ? grn.fg : t.text }}>{d}</span>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: t.faint }}>{itens.length || ''}</span>
                        </span>
                        {/* Pontinhos coloridos, não chips de texto: em célula pequena o ponto
                            informa a categoria sem truncar o título. A cor sai do CAT — a mesma
                            que a legenda do rodapé decodifica. */}
                        <span style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 5 }}>
                          {itens.slice(0, 8).map((b) => <span key={b.id} style={{ width: 6, height: 6, borderRadius: '50%', background: adCat(b.category).fg }} />)}
                        </span>
                        {hoje && <span style={{ fontSize: 8.5, fontWeight: 850, letterSpacing: '.08em', color: grn.fg, marginTop: 4 }}>HOJE</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LEGENDA — é ela que decodifica a cor dos pontos do mês, das faixas da semana e
                do ponto das tarefas. Fica no rodapé do card e vale para as três visões. */}
            <div style={{ padding: '12px 24px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', borderTop: `1px solid ${t.border}`, marginTop: 10 }}>
              {Object.values(AD_CATS).map((c) => (
                <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: '.06em', color: t.muted }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.fg }} /> {c.label}
                </span>
              ))}
            </div>
          </Card>

          {/* RESUMO DA SEMANA — derivado do MESMO array já carregado (zero request extra). Os
              números do mock ("8 blocos · 1h livre") eram legenda; estes são contagem. */}
          <Card t={t} style={{ padding: '18px 22px', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15.5, fontWeight: 850, color: t.text }}>Sua semana</span>
              <span style={{ fontSize: 11.5, color: t.muted, fontWeight: 700 }}>
                {resumoSemana.total} {resumoSemana.total === 1 ? 'bloco' : 'blocos'} · {resumoSemana.eventos} evento(s) · {resumoSemana.tarefas} tarefa(s), {resumoSemana.feitas} concluída(s)
              </span>
              {view !== 'semana' && <button onClick={() => setView('semana')} style={{ all: 'unset', cursor: 'pointer', fontSize: 12.5, fontWeight: 800, color: grn.fg }}>ver agenda completa →</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 10 }}>
              {semana.map((d) => (
                <div key={d.ymd} style={{ textAlign: 'center', padding: '13px 8px', borderRadius: 13, background: d.hoje ? grn.fg : t.elevated, color: d.hoje ? '#fff' : t.text, border: `1px solid ${d.hoje ? grn.fg : t.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', opacity: .75 }}>{d.d}</div>
                  <div style={{ fontSize: 21, fontWeight: 850, margin: '2px 0' }}>{d.n}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, opacity: .85 }}>{d.qtd} {d.qtd === 1 ? 'bloco' : 'blocos'}</div>
                  <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4, minHeight: 6 }}>
                    {d.itens.slice(0, 6).map((b) => <span key={b.id} style={{ width: 5, height: 5, borderRadius: '50%', background: d.hoje ? 'rgba(255,255,255,.85)' : adCat(b.category).fg }} />)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* TAREFAS */}
          <Card t={t} style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: '.12em', color: t.faint, textTransform: 'uppercase' }}>Desenvolvimento contínuo</div>
                <div style={{ fontSize: 17, fontWeight: 850, color: t.text, marginTop: 2 }}>Suas tarefas do dev</div>
              </div>
              {/* Chips por CATEGORIA, do CAT — o desenho filtrava por Estudo/Trabalho/Leitura. */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[['todas', 'Todas']].concat(Object.keys(AD_CATS).map((k) => [k, AD_CATS[k].label.charAt(0) + AD_CATS[k].label.slice(1).toLowerCase()])).map(([k, lb]) => (
                  <button key={k} onClick={() => setFTar(k)} style={{ all: 'unset', cursor: 'pointer', height: 28, padding: '0 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: fTar === k ? t.text : t.panel, color: fTar === k ? t.panel : t.muted, border: `1px solid ${fTar === k ? t.text : t.border}` }}>{lb}</button>
                ))}
              </div>
            </div>

            {tarefasView.length === 0 && <div style={{ fontSize: 13, color: t.muted, padding: '10px 0' }}>Nenhuma tarefa neste período.</div>}
            {tarefasView.map((x) => {
              const c = adCat(x.category);
              return (
                <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 2px', borderBottom: `1px solid ${t.border}` }}>
                  <button onClick={() => alternarFeita(x)} title={x.done ? 'Reabrir' : 'Concluir'} style={{ all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 8, border: `2px solid ${x.done ? grn.fg : t.borderStrong}`, background: x.done ? grn.fg : 'transparent', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>{x.done && <Icon name="check" size={14} />}</button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.text, textDecoration: x.done ? 'line-through' : 'none', opacity: x.done ? .55 : 1 }}>{x.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, marginTop: 2 }}>
                      {/* ponto + nome, do CAT — mesma cor da legenda da agenda */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 800, color: c.fg }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.fg }} /> {c.label.toLowerCase()}
                      </span>
                      <span style={{ color: t.faint }}>· {adDia(x.day).slice(8)}/{adDia(x.day).slice(5, 7)}</span>
                    </div>
                  </div>
                  <button onClick={() => removerBloco(x)} style={{ all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.faint, flexShrink: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.faint; }}><Icon name="x" size={13} /></button>
                </div>
              );
            })}

            {novaTarefa ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12, padding: '12px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                <input autoFocus value={ntTxt} onChange={(e) => setNtTxt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTarefa()} placeholder="Descreva a tarefa…"
                  style={{ flex: '1 1 200px', minWidth: 0, boxSizing: 'border-box', height: 40, borderRadius: 10, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }} />
                <div style={{ position: 'relative' }}>
                  <select value={ntCat} onChange={(e) => setNtCat(e.target.value)} style={{ appearance: 'none', WebkitAppearance: 'none', height: 40, padding: '0 28px 0 13px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: t.text, background: t.panel, border: `1px solid ${t.border}`, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                    {Object.keys(AD_CATS).map((k) => <option key={k} value={k}>{AD_CATS[k].label.toLowerCase()}</option>)}
                  </select>
                  <Icon name="chevronDown" size={13} style={{ position: 'absolute', right: 10, top: 14, color: t.muted, pointerEvents: 'none' }} />
                </div>
                <input type="date" value={ntDia} onChange={(e) => setNtDia(e.target.value)}
                  style={{ boxSizing: 'border-box', width: 150, height: 40, borderRadius: 10, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 13px', fontSize: 12.5, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={addTarefa} disabled={!ntTxt.trim()} style={{ all: 'unset', boxSizing: 'border-box', cursor: ntTxt.trim() ? 'pointer' : 'not-allowed', height: 40, padding: '0 18px', borderRadius: 999, fontSize: 12.5, fontWeight: 800, background: ntTxt.trim() ? grn.fg : grn.bg, color: ntTxt.trim() ? '#fff' : grn.fg, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: ntTxt.trim() ? 1 : .7 }}><Icon name="check" size={13} /> Salvar</button>
                <button onClick={() => setNovaTarefa(false)} style={{ all: 'unset', cursor: 'pointer', width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={15} /></button>
              </div>
            ) : (
              <button onClick={() => { setNtDia(adYmd(ref)); setNovaTarefa(true); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', marginTop: 12, height: 44, borderRadius: 12, border: `1.5px dashed ${t.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: t.muted }}><Icon name="plus" size={14} /> Adicionar tarefa</button>
            )}
          </Card>
        </div>

        {/* ── COLUNA DIREITA: notas + snippets ── */}
        <div style={{ flex: '1 1 320px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card t={t} style={{ padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: '.12em', color: t.faint, textTransform: 'uppercase' }}>Livre, sem dono</div>
                <div style={{ fontSize: 17, fontWeight: 850, color: t.text, marginTop: 2 }}>Anotações</div>
              </div>
              <button onClick={novaNota} style={{ all: 'unset', cursor: 'pointer', height: 36, padding: '0 15px', borderRadius: 999, fontSize: 12.5, fontWeight: 800, background: t.text, color: t.panel, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="plus" size={13} /> Nova</button>
            </div>
            {notasView.length === 0 && <div style={{ fontSize: 13, color: t.muted, padding: '6px 0' }}>Nenhuma anotação ainda.</div>}
            {/* MURAL: grade de 2 colunas que colapsa para 1 em 390 — auto-fit com minmax faz
                isso sozinho, sem media query nem viewport hook. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 10 }}>
              {notasView.map((n) => (
                <div key={n.id} style={{ position: 'relative', borderRadius: 13, padding: '12px 13px', background: n.color || '#fdf0b3', color: '#1c1c1e', outline: n.pinned ? '2px solid #1c1c1e' : 'none', outlineOffset: -1 }}>
                  {/* PIN: badge circular rotacionado no canto — mesmo PATCH de sempre. */}
                  <button title={n.pinned ? 'Desafixar' : 'Fixar no topo'} onClick={() => salvarNota(n, { pinned: !n.pinned })}
                    style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: -7, right: -6, width: 22, height: 22, borderRadius: '50%', background: n.pinned ? '#1c1c1e' : 'rgba(0,0,0,.18)', color: '#fff', display: 'grid', placeItems: 'center', transform: 'rotate(35deg)', transition: 'background .14s' }}><Icon name="mapPin" size={11} /></button>
                  {/* textarea CONTROLADO por estado local (rascunho) — o caminho de persistência
                      é o MESMO de antes: PUT /dev-area/notes/:id no blur, só quando mudou. */}
                  <textarea
                    value={rascunho[n.id] !== undefined ? rascunho[n.id] : n.body}
                    onChange={(e) => setRascunho((r) => ({ ...r, [n.id]: e.target.value }))}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      setRascunho((r) => { const c = { ...r }; delete c[n.id]; return c; });
                      if (v && v !== n.body) salvarNota(n, { body: v });
                    }}
                    placeholder="escreva sua nota…" rows={4}
                    style={{ boxSizing: 'border-box', width: '100%', border: 'none', background: 'transparent', color: '#1c1c1e', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.45 }} />
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
                    {(n.tags || []).map((tg) => (
                      <span key={tg} title="Clique para remover" onClick={() => salvarNota(n, { tags: n.tags.filter((x) => x !== tg) })}
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(0,0,0,.1)' }}>{tg} <Icon name="x" size={8} style={{ opacity: .5 }} /></span>
                    ))}
                    {tagEdit === n.id ? (
                      <input autoFocus value={tagVal} onChange={(e) => setTagVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && tagVal.trim()) { salvarNota(n, { tags: [...(n.tags || []), tagVal.trim()] }); setTagVal(''); setTagEdit(null); } if (e.key === 'Escape') { setTagVal(''); setTagEdit(null); } }}
                        onBlur={() => { if (tagVal.trim()) salvarNota(n, { tags: [...(n.tags || []), tagVal.trim()] }); setTagVal(''); setTagEdit(null); }} placeholder="tag + Enter"
                        style={{ boxSizing: 'border-box', width: 84, height: 20, borderRadius: 6, border: '1.5px dashed rgba(0,0,0,.35)', background: 'rgba(255,255,255,.4)', color: '#1c1c1e', padding: '0 7px', fontSize: 9.5, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                    ) : (
                      <button onClick={() => { setTagEdit(n.id); setTagVal(''); }} title="Adicionar tag" style={{ all: 'unset', cursor: 'pointer', fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 6, border: '1.5px dashed rgba(0,0,0,.3)', color: 'rgba(0,0,0,.55)' }}>+ tag</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                    {/* Timestamp REAL: updated_at já vinha no SELECT do controller — nada inventado. */}
                    <span style={{ fontSize: 9.5, fontWeight: 700, opacity: .55, fontFamily: 'ui-monospace, monospace' }}>{adQuando(n.updated_at || n.created_at)}</span>
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 3 }}>
                      {AD_NOTA_CORES.map((cor) => (
                        <button key={cor || 'none'} onClick={() => salvarNota(n, { color: cor })} title={cor || 'sem cor'}
                          style={{ all: 'unset', cursor: 'pointer', width: 11, height: 11, borderRadius: '50%', background: cor || '#fff', border: `1.5px solid ${(n.color || '') === cor ? '#1c1c1e' : 'rgba(0,0,0,.2)'}` }} />
                      ))}
                    </span>
                    <button onClick={() => removerNota(n)} title="Remover" style={{ all: 'unset', cursor: 'pointer', opacity: .45, display: 'grid', placeItems: 'center' }}><Icon name="trash" size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
            {/* Filtro no RODAPÉ, como no desenho. */}
            {allTags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 11.5, color: t.faint, fontWeight: 700 }}>filtrar:</span>
                {allTags.map((tg) => (
                  <button key={tg} onClick={() => setFNota(fNota === tg ? null : tg)} style={{ all: 'unset', cursor: 'pointer', height: 28, padding: '0 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: fNota === tg ? t.text : t.panel, color: fNota === tg ? t.panel : t.muted, border: `1px solid ${fNota === tg ? t.text : t.border}` }}>{tg}</button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: t.faint }}>{notasView.length} mostradas</span>
              </div>
            )}
          </Card>

          {/* PAINEL ESCURO — não é Card: o desenho trata os snippets como um terminal embutido,
              e o contraste é o que faz o bloco de código ler como código. */}
          <div style={{ borderRadius: 18, padding: '20px 22px', background: '#101418', border: '1px solid #232a32' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: '.14em', color: '#4ade80', textTransform: 'uppercase' }}>Cola e usa</div>
                <div style={{ fontSize: 17, fontWeight: 850, color: '#fff', marginTop: 2 }}>Snippets fixos</div>
              </div>
              <button onClick={() => setNovoSnip((v) => !v)} style={{ all: 'unset', cursor: 'pointer', height: 30, padding: '0 13px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: 'rgba(255,255,255,.12)', color: '#fff' }}>+ snippet</button>
            </div>

            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Icon name="search" size={14} style={{ position: 'absolute', left: 13, top: 11, color: 'rgba(255,255,255,.4)' }} />
              {/* Busca SERVER-SIDE com debounce — INTOCADA: só o traje do input mudou. */}
              <input value={snBusca} onChange={(e) => { setSnBusca(e.target.value); setSnPage(0); }} placeholder="Buscar snippet…"
                style={{ boxSizing: 'border-box', width: '100%', height: 36, borderRadius: 999, border: '1px solid #2e3742', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '0 14px 0 36px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
            </div>

            {snips.items.length === 0 && <div style={{ padding: '14px 0', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.45)' }}>{snBusca.trim() ? 'Nenhum snippet encontrado.' : 'Nenhum snippet guardado.'}</div>}
            {snips.items.map((s) => (
              <div key={s.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.8)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                  <span style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => copiar(s)} style={{ all: 'unset', cursor: 'pointer', height: 24, padding: '0 11px', borderRadius: 7, fontSize: 10.5, fontWeight: 800, background: 'rgba(255,255,255,.12)', color: '#fff' }}>copiar</button>
                    <button title="Remover" onClick={() => removerSnip(s)} style={{ all: 'unset', cursor: 'pointer', width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.4)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.4)'; }}><Icon name="x" size={12} /></button>
                  </span>
                </div>
                {/* Bloco de terminal. Cor UNIFORME e sem tokenizer: colorir sintaxe exigiria
                    parsear conteúdo arbitrário (é lógica, não pintura) ou uma dependência nova. */}
                <div className="fr-noscroll" style={{ padding: '10px 13px', borderRadius: 10, background: '#000', color: '#4ade80', fontSize: 11.5, fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap', overflowX: 'auto' }}>{s.code}</div>
              </div>
            ))}

            {snPags > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '4px 0 10px', flexWrap: 'wrap' }}>
                <button onClick={() => setSnPage((p) => Math.max(0, p - 1))} disabled={snPage === 0} style={{ all: 'unset', cursor: snPage === 0 ? 'not-allowed' : 'pointer', width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.1)', color: '#fff', opacity: snPage === 0 ? .4 : 1 }}><Icon name="chevronLeft" size={13} /></button>
                {Array.from({ length: snPags }, (_, p) => (
                  <button key={p} onClick={() => setSnPage(p)} style={{ all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 800, background: p === snPage ? '#22c55e' : 'rgba(255,255,255,.08)', color: p === snPage ? '#06130c' : 'rgba(255,255,255,.7)' }}>{p + 1}</button>
                ))}
                <button onClick={() => setSnPage((p) => Math.min(snPags - 1, p + 1))} disabled={snPage >= snPags - 1} style={{ all: 'unset', cursor: snPage >= snPags - 1 ? 'not-allowed' : 'pointer', width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.1)', color: '#fff', opacity: snPage >= snPags - 1 ? .4 : 1 }}><Icon name="chevronRight" size={13} /></button>
                <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,.45)', marginLeft: 4 }}>{snips.total} snippets</span>
              </div>
            )}

            {novoSnip && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <input autoFocus value={snLabel} onChange={(e) => setSnLabel(e.target.value)} placeholder="nome do snippet"
                  style={{ boxSizing: 'border-box', height: 36, borderRadius: 9, border: '1px solid #2e3742', background: 'transparent', color: '#fff', padding: '0 12px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
                <input value={snCode} onChange={(e) => setSnCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSnip()} placeholder="comando ou link"
                  style={{ boxSizing: 'border-box', height: 36, borderRadius: 9, border: '1px solid #2e3742', background: '#000', color: '#4ade80', padding: '0 12px', fontSize: 12, fontFamily: 'ui-monospace, monospace', outline: 'none' }} />
                <button onClick={addSnip} style={{ all: 'unset', cursor: 'pointer', height: 36, borderRadius: 999, fontSize: 12, fontWeight: 800, background: '#22c55e', color: '#06130c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Salvar snippet</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {criar && <AdCriarModal t={t} day={criar.day} onClose={() => setCriar(null)}
        onSave={(ev) => { criarBloco({ kind: 'evento', day: ev.day, category: ev.category, title: ev.title, start_t: ev.start_t, end_t: ev.end_t || null }, `${ev.title} · ${ev.start_t}`).then(() => setCriar(null)); }} />}
    </div>
  );
}

function AdCriarModal({ t, day, onClose, onSave }) {
  const [title, setTitle] = useStateAD('');
  const [category, setCategory] = useStateAD('reuniao');
  const [start, setStart] = useStateAD('09:00');
  const [end, setEnd] = useStateAD('10:00');
  const [erro, setErro] = useStateAD(null);
  const field = { boxSizing: 'border-box', width: '100%', height: 42, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' };
  const salvar = () => {
    if (!title.trim()) return setErro('Dê um título ao horário.');
    // Mesma regra do CHECK do banco, checada aqui só pra dar erro legível antes da viagem.
    if (end && end <= start) return setErro('O fim precisa ser depois do início.');
    onSave({ day, title: title.trim(), category, start_t: start, end_t: end });
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,10,16,.55)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(420px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center' }}><Icon name="calendar" size={18} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 850, color: t.text }}>Marcar horário</div>
            <div style={{ fontSize: 12, color: t.muted }}>{String(day).split('-').reverse().join('/')}</div>
          </div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={15} /></button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salvar()} placeholder="Título · ex: Daily da squad" style={field} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={field} />
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={field} />
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {Object.keys(AD_CATS).map((k) => {
              const c = AD_CATS[k], on = category === k;
              return <button key={k} onClick={() => setCategory(k)} style={{ all: 'unset', cursor: 'pointer', height: 32, padding: '0 12px', borderRadius: 999, fontSize: 11, fontWeight: 850, letterSpacing: '.05em', background: on ? c.fg : c.bg, color: on ? '#fff' : c.fg }}>{c.label}</button>;
            })}
          </div>
          {erro && <div style={{ fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{erro}</div>}
        </div>
        <div style={{ padding: '13px 22px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn t={t} icon="check" onClick={salvar}>Marcar</Btn>
        </div>
      </div>
    </div>
  );
}

// Wrapper de gate — 'dev_area' é chave-FOLHA e o canAccess casa por igualdade.
function DevAreaDev({ t }) {
  const A = window.FRAuth;
  if (!A || typeof A.canAccess !== 'function' || !A.canAccess('dev_area')) {
    return (
      <div>
        <PageHeader t={t} title="Área Dev" subtitle="Agenda, tarefas, anotações e snippets." />
        <Card t={t} style={{ padding: 40, textAlign: 'center' }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'inline-grid', placeItems: 'center', marginBottom: 14 }}><Icon name="lock" size={24} /></span>
          <div style={{ fontSize: 15.5, fontWeight: 850, color: t.text }}>Acesso restrito</div>
          <div style={{ fontSize: 13, color: t.muted, marginTop: 6 }}>Você não tem a permissão <b>dev_area</b>. Peça ao administrador pela tela de Permissões.</div>
        </Card>
      </div>
    );
  }
  return <DevAreaDevReal t={t} />;
}

Object.assign(window, { DevAreaDev });
