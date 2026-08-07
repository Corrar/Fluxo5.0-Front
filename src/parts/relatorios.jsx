// relatorios.jsx — Painel BI dos Relatórios (Fase 3a).
//
// LIGAÇÃO REAL: GET /reports/bi?from=&to= (page_key 'relatorios'), agregação toda em SQL —
// o cliente NUNCA baixa linha para somar. Cinco blocos numa chamada só, com o MESMO WHERE de
// período: é isso que impede dois cards de falarem de janelas diferentes.
//
// O RL_DATA DO DESENHO MORREU INTEIRO. Ele trazia três variantes cravadas ('Este mês',
// 'Trimestre', 'Ano') com 40+ números inventados — R$ 148.230 de capital entrado, 97,4% de
// acurácia, giro 4,6×. Nenhum sobreviveu, nem como placeholder.
//
// ─── OS QUATRO CARDS DO DESENHO QUE NÃO NASCERAM ────────────────────────────────────────────
// Acurácia de Inventário, Lead Time, Giro de Estoque, Taxa de Ruptura e Recebimento &
// Conferência ficaram de fora por AUSÊNCIA DE INSTRUMENTAÇÃO, não por escopo:
//   • acurácia exige contagem física × sistema — não existe tabela de inventário;
//   • lead time exige ciclo fechado (solicitação → entrega) — nenhum ciclo se fechou ainda;
//   • giro exige consumo sobre estoque médio — o razão tem 2 consumos;
//   • ruptura exige registrar "quis e não tinha" — nada grava stockout;
//   • recebimento exige o par carimbo-de-entrada + carimbo-de-conferência — não existe.
// Viram missão própria de backend. Enquanto não existirem, a tela não os desenha.
//
// SPARKLINES E DELTAS também saíram: série pede pontos ao longo do tempo e delta pede período
// anterior comparável. Medido em 03/08/2026: o razão tem 5 dias distintos de movimento. Os dois
// voltam SOBRE AS MESMAS QUERIES quando houver profundidade — nada precisa ser refeito.
//
// PRESET É AÇÚCAR DE TELA: o backend só conhece intervalo (?from=&to=). Os três botões apenas
// calculam datas — mesmo precedente do relatório de commits do dev-repos.
const { useState: useStateRL } = React;

const RL = { navy: '#1e3a8a', blue: '#2563eb', sky: '#38bdf8', light: '#bfdbfe' };

const rlBRL = (n) => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rlErr = (e) => { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; };
// Data por componentes LOCAIS. toISOString() devolveria o dia anterior das 21h às 23h59 no
// Brasil — a mesma armadilha que já mordeu o next_billing do Custos.
const rlYmd = (d) => { const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const rlData = (iso) => { const s = String(iso || '').slice(0, 10); return s ? s.split('-').reverse().join('/') : ''; };

// Os três presets, calculados no FRONT sobre o relógio local. O backend recebe só o intervalo.
const RL_PERIODOS = [
  ['mes', 'Este mês', () => { const h = new Date(); return [new Date(h.getFullYear(), h.getMonth(), 1), new Date(h.getFullYear(), h.getMonth() + 1, 0)]; }],
  ['tri', 'Trimestre', () => { const h = new Date(); return [new Date(h.getFullYear(), h.getMonth() - 2, 1), new Date(h.getFullYear(), h.getMonth() + 1, 0)]; }],
  ['ano', 'Ano', () => { const h = new Date(); return [new Date(h.getFullYear(), 0, 1), new Date(h.getFullYear(), 11, 31)]; }],
];

function RlCard({ t, title, sub, right, children, span }) {
  return (
    <Card t={t} style={{ padding: 20, margin: 0, gridColumn: span ? `span ${span}` : 'auto' }}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: sub ? 4 : 14 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{title}</div>{right}
        </div>
      )}
      {sub && <div style={{ fontSize: 12, color: t.muted, marginBottom: 14 }}>{sub}</div>}
      {children}
    </Card>
  );
}

function RelHBars({ t, data, fmt }) {
  const max = Math.max.apply(null, data.map((d) => Number(d.v)).concat([1]));
  const cols = [RL.navy, RL.blue, '#3b82f6', RL.sky, RL.light];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {data.map((d, i) => (
        <div key={d.l}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.text, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.l}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: t.muted, flexShrink: 0 }}>{fmt ? fmt(d.v) : d.v}</span>
          </div>
          <div style={{ height: 14, borderRadius: 8, background: t.hover, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(Number(d.v) / max) * 100}%`, borderRadius: 8, background: cols[i % cols.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RelDonut({ t, pct, size = 132, stroke = 16, color = RL.blue, sub, center }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.hover} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 850, color: t.text }}>{center != null ? center : pct + '%'}</div>
          {sub && <div style={{ fontSize: 10.5, fontWeight: 700, color: t.faint }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

// Vazio que NÃO MENTE: diz que não houve movimento, em vez de um traço que o usuário lê como
// erro de carregamento.
function RlVazio({ t, texto }) {
  return <div style={{ padding: '22px 4px', textAlign: 'center', fontSize: 12.5, color: t.muted }}>{texto}</div>;
}

// GATE DA PÁGINA — antes de qualquer estado ou efeito, para que a tela sem permissão NÃO
// dispare requisição nenhuma. Não é só cosmética de 403: sem isto, um usuário sem a chave
// abriria a tela e o navegador bateria no servidor para receber 403 — barulho inútil e um
// erro visível que ele não pode resolver.
// NOTA: a PageRelatorios que hospeda este bloco NÃO tem gate próprio (as chamadas dela ao
// /dashboard/stats, /reports/managerial e afins disparam e voltam 403). É lacuna PRÉ-EXISTENTE,
// anterior a esta fase — registrada, não corrigida aqui.
function RelatoriosBI({ t }) {
  const A = window.FRAuth;
  if (!A || typeof A.canAccess !== 'function' || !A.canAccess('relatorios')) return null;
  return <RelatoriosBIReal t={t} />;
}

function RelatoriosBIReal({ t }) {
  const R = window.React;
  const { mobile: mob } = (window.useFRViewport ? window.useFRViewport() : { mobile: false });
  const [per, setPer] = useStateRL('tri');
  const [d, setD] = useStateRL(null);
  const [loading, setLoading] = useStateRL(true);
  const [erro, setErro] = useStateRL(null);

  const intervalo = R.useMemo(function () {
    const def = RL_PERIODOS.find(function (x) { return x[0] === per; }) || RL_PERIODOS[1];
    const [ini, fim] = def[2]();
    return { from: rlYmd(ini), to: rlYmd(fim), label: def[1] };
  }, [per]);

  // Extraído do useEffect para virar chamável (mount E stock_updated usam a mesma função).
  // O `vivo` do fecho antigo virou a checagem do ref: sem ela, uma recarga disparada pelo
  // socket poderia setar estado depois da tela sair.
  const montado = R.useRef(true);
  R.useEffect(function () { montado.current = true; return function () { montado.current = false; }; }, []);
  const carregarBI = R.useCallback(function () {
    setLoading(true); setErro(null);
    window.FRApi.get(`/reports/bi?from=${intervalo.from}&to=${intervalo.to}`, { skipLoading: true })
      .then(function (r) { if (montado.current) { setD(r.data || null); setLoading(false); } })
      .catch(function (e) { if (montado.current) { setErro(rlErr(e)); setLoading(false); } });
  }, [intervalo.from, intervalo.to]);
  R.useEffect(function () { carregarBI(); }, [carregarBI]);
  // O BI agrega movimento de estoque: entrada, saída e consumo entram nos números daqui.
  window.frUseStockReload(carregarBI);

  const filtro = (
    <div style={{ display: 'inline-flex', gap: 3, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}` }}>
      {RL_PERIODOS.map(function (x) {
        const on = per === x[0];
        return <button key={x[0]} onClick={() => setPer(x[0])} style={{ all: 'unset', cursor: 'pointer', height: 30, padding: '0 14px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: on ? t.text : 'transparent', color: on ? t.panel : t.muted }}>{x[1]}</button>;
      })}
    </div>
  );

  const cabecalho = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: t.accentText }}>Visão gerencial</div>
        <div style={{ fontSize: 12.5, color: t.muted, marginTop: 3 }}>
          {rlData(intervalo.from)} — {rlData(intervalo.to)}
          {/* Profundidade REAL, vinda de MIN()/MAX() do razão. Sem dado, a frase não aparece —
              nada de "série desde 21/07" cravado no front. */}
          {d && d.cobertura && d.cobertura.desde
            ? ` · há movimentação registrada desde ${rlData(d.cobertura.desde)} (${d.cobertura.dias_com_movimento} ${d.cobertura.dias_com_movimento === 1 ? 'dia' : 'dias'})`
            : ''}
        </div>
      </div>
      {filtro}
    </div>
  );

  if (loading) return <div style={{ marginBottom: 22 }}>{cabecalho}<Card t={t} style={{ padding: 34, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando o painel…</Card></div>;
  if (erro) {
    return (
      <div style={{ marginBottom: 22 }}>{cabecalho}
        <Card t={t} style={{ padding: 22, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700 }}>{erro}</div>
        </Card>
      </div>
    );
  }
  if (!d) return null;

  const cap = d.capital || {};
  const reps = d.reposicoes_por_status || [];
  const sols = d.solicitacoes_por_status || [];
  const setores = d.capital_por_setor || [];

  const repTotal = reps.reduce(function (a, x) { return a + x.n; }, 0);
  const solTotal = sols.reduce(function (a, x) { return a + x.n; }, 0);
  const solAtend = sols.filter(function (x) { return x.status === 'aprovado' || x.status === 'entregue' || x.status === 'conferido'; })
    .reduce(function (a, x) { return a + x.n; }, 0);
  // GUARDA DE DIVISÃO: o desenho fazia (enviados / abertos) * 100 direto, e com a tabela
  // zerada isso é 0/0 = NaN na cara do usuário. Sem total, não há percentual a mostrar.
  const pctAtend = solTotal > 0 ? Math.round((solAtend / solTotal) * 100) : 0;

  const bigV = { fontSize: 26, fontWeight: 850, color: t.text, letterSpacing: '-.02em' };
  const lbl = { fontSize: 11.5, fontWeight: 700, color: t.faint };

  return (
    <div style={{ marginBottom: 22 }}>
      {cabecalho}
      {/* minmax(min(260px,100%), 1fr) e NÃO minmax(260px,1fr): o mínimo cru de 260px não
          encolhe, e num container estreito a faixa estoura em vez de quebrar. O min(...,100%)
          deixa a coluna colapsar para a largura disponível. Mesma classe do fix do 2e. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 16 }}>

        <RlCard t={t} title="Capital entrado" sub="Material recebido no período, a preço de custo">
          <div style={bigV}>{rlBRL(cap.entrado)}</div>
          <div style={{ ...lbl, marginTop: 4 }}>
            {cap.n_entradas > 0 ? `${cap.n_entradas} ${cap.n_entradas === 1 ? 'entrada' : 'entradas'} no razão` : 'sem entradas no período'}
          </div>
        </RlCard>

        <RlCard t={t} title="Capital saído" sub="Material consumido no período, a preço de custo">
          <div style={bigV}>{rlBRL(cap.saido)}</div>
          <div style={{ ...lbl, marginTop: 4 }}>
            {cap.n_saidas > 0 ? `${cap.n_saidas} ${cap.n_saidas === 1 ? 'baixa' : 'baixas'} no razão` : 'sem consumo no período'}
          </div>
        </RlCard>

        <RlCard t={t} title="Pedidos de Reposição" sub="Por status, no período">
          {repTotal === 0 ? (
            <RlVazio t={t} texto="Nenhum pedido de reposição no período." />
          ) : (
            <React.Fragment>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
                {reps.map(function (x) {
                  return (
                    <div key={x.status}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: t.faint, textTransform: 'uppercase' }}>{x.status}</div>
                      <div style={{ fontSize: 20, fontWeight: 850, color: t.text }}>{x.n}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', background: t.hover }}>
                {reps.map(function (x, i) {
                  // repTotal > 0 garantido pelo ramo — nenhuma divisão por zero possível aqui.
                  return <div key={x.status} style={{ width: `${(x.n / repTotal) * 100}%`, background: [RL.navy, '#10b981', RL.sky, RL.light][i % 4] }} />;
                })}
              </div>
            </React.Fragment>
          )}
        </RlCard>

        <RlCard t={t} title="Solicitações de Material" right={<span style={lbl}>{solTotal} no período</span>}>
          {solTotal === 0 ? (
            <RlVazio t={t} texto="Nenhuma solicitação no período." />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <RelDonut t={t} pct={pctAtend} sub="atendidas" color={RL.blue} size={124} />
              <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {sols.map(function (x) {
                  return (
                    <div key={x.status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: t.text, textTransform: 'capitalize' }}>{x.status}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 850, color: t.text }}>{x.n}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: t.faint, width: 36, textAlign: 'right' }}>{Math.round((x.n / solTotal) * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </RlCard>

        {/* span 2 SÓ no desktop: `span 2` OBRIGA a grade a ter 2 colunas para caber o item, e
            no mobile isso força 2×260px num container de ~363 — foi o que estourou em 391. */}
        <RlCard t={t} span={mob ? 1 : 2} title="Capital destinado por setor" sub="Valor dos materiais ENTREGUES a cada setor no período — pedido não entregue não conta">
          {setores.length === 0 ? (
            <RlVazio t={t} texto="Nenhum material entregue a setores no período." />
          ) : (
            <RelHBars t={t} fmt={rlBRL} data={setores.map(function (s) { return { l: s.setor, v: s.valor }; })} />
          )}
        </RlCard>

      </div>
    </div>
  );
}

Object.assign(window, { RelatoriosBI });
