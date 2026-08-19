// devcustos.jsx — "Custos & Serviços": o que se paga hoje pra manter o sistema de pé.
//
// LIGAÇÃO REAL ao backend (Fase 4 — migration 019):
//   GET    /dev-costs      → { items, total_mensal, por_categoria }  (page_key 'dev_custos')
//   POST   /dev-costs      → criar serviço
//   PUT    /dev-costs/:id  → parcial (a edição inline do valor cai aqui)
//   DELETE /dev-costs/:id  → remover
//
// O TOTAL NÃO É SOMADO AQUI. Vem pronto do GET, calculado no servidor (mensal cheio +
// anual/12 + variável cheio) por uma expressão SQL única que também alimenta o por_categoria.
// O mock somava no front (`servicos.reduce`) e por isso tratava "anual (÷12)" como um RÓTULO
// de texto — um serviço anual de 264 entrava no total como 264. Aqui o ciclo é dado, não
// legenda: quem divide é o banco, e a tela só exibe.
//
// TRÊS COISAS DO DESENHO QUE NÃO NASCERAM (decisão do Bruno, registradas no DIVIDAS.md do
// backend — nenhuma é esquecimento; as três voltam quando houver fonte):
//   • GRÁFICO DE HISTÓRICO / delta "↑x% vs jun" — o mock tinha DC_HIST com seis meses
//     cravados. `dev_costs` é a FOTO do que se paga hoje, sem competência: o primeiro gráfico
//     seria ficção com cara de dado.
//   • MONITORAMENTO VIVO ("CPU 34% · RAM 61%", "2,4M tokens") — não há coletor. Virou
//     `usage_note`, texto livre escrito por gente, editável e honesto sobre ser uma anotação.
//   • O CARD "Monitoramento" com "próx. cobrança 01/08" cravado — a data agora sai de
//     next_billing, e quando não houver nenhuma a tela diz isso em vez de inventar.

// ── PARSE NUMÉRICO (lote V) ──────────────────────────────────────────────────────────────────
// Alias locais para os helpers únicos de `window.FRAdapters` (lib/adapters.js), no mesmo padrão de
// fallback do resto da casa: se a lib não carregou, ninguém quebra.
//   frSanQtd  mantém dígitos + separador enquanto o operador digita ("2," é intermediário legítimo)
//   frNumQtd  string -> número, vírgula OU ponto; recusa dois separadores em vez de "consertar"
//   frInt     contagem: TRUNCA a fração, nunca multiplica; piso configurável
const frSanQtd = (v) => (window.FRAdapters && window.FRAdapters.sanitizeQtd
  ? window.FRAdapters.sanitizeQtd(v)
  : String(v === null || v === undefined ? '' : v).replace(/[^0-9.,]/g, ''));
const frNumQtd = (v) => (window.FRAdapters && window.FRAdapters.parseQtd
  ? window.FRAdapters.parseQtd(v)
  : parseFloat(String(v === null || v === undefined ? '' : v).replace(',', '.')));
const frInt = (v, piso) => (window.FRAdapters && window.FRAdapters.parseContagem
  ? window.FRAdapters.parseContagem(v, piso)
  : Math.max(piso === undefined ? 1 : piso, Math.trunc(parseFloat(String(v === null || v === undefined ? '' : v).replace(',', '.')) || 0)));

const { useState: useStateDC } = React;

const DC_CATS = {
  infra:  { label: 'Infra / VPS', cor: '#7c5cfc' },
  banco:  { label: 'Banco de dados', cor: '#0891b2' },
  ia:     { label: 'IA / Tokens', cor: '#f59e0b' },
  saas:   { label: 'SaaS / Ferramentas', cor: '#10b981' },
  outros: { label: 'Outros', cor: '#6b7280' },
};
// Os rótulos do ciclo são de TELA; o valor enviado é sempre a chave do CHECK do banco.
const DC_CICLOS = [['mensal', 'mensal'], ['anual', 'anual (÷12)'], ['variavel', 'variável']];
const DC_CICLO_LABEL = { mensal: 'mensal', anual: 'anual (÷12)', variavel: 'variável' };

// numeric chega do backend como STRING (o driver não converte) — e é assim que o total fica
// exato. Number() aqui é só para FORMATAR; nenhuma conta é refeita no front.
const dcBRL = (n) => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dcErr = (e) => { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; };
// next_billing é DATE — DIA DE CALENDÁRIO, não instante. O driver pg serializa como a
// meia-noite LOCAL DO SERVIDOR: no Render (UTC) o dia 05 vira "2026-08-05T00:00:00.000Z", e
// new Date(...).toLocaleDateString('pt-BR') num navegador em UTC-3 exibiria 04/08 — um dia
// ANTES, todo dia. Por isso a data nunca vira Date aqui: só o pedaço 'YYYY-MM-DD' importa,
// e ele é comparado e formatado como STRING. Mesma disciplina do adDia() da Área Dev.
const dcYmd = (iso) => String(iso || '').slice(0, 10);
const dcData = (iso) => { const s = dcYmd(iso); return s ? s.split('-').reverse().join('/') : null; };
// "hoje" por componentes LOCAIS — toISOString() daria o dia anterior das 21h às 23h59 no Brasil.
const dcHoje = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

function DevCustosReal({ t }) {
  const R = window.React;
  const [dados, setDados] = useStateDC(null);   // { items, total_mensal, por_categoria }
  const [loading, setLoading] = useStateDC(true);
  const [error, setError] = useStateDC(null);
  const [novo, setNovo] = useStateDC(false);
  const [salvando, setSalvando] = useStateDC(false);
  const [erroModal, setErroModal] = useStateDC(null);
  const [editId, setEditId] = useStateDC(null);
  const [editVal, setEditVal] = useStateDC('');
  const [form, setForm] = useStateDC({ name: '', category: 'infra', value: '', cycle: 'mensal', usage_note: '', next_billing: '' });
  const grn = uiTone(t, 'green'), amb = uiTone(t, 'amber');

  const carregar = R.useCallback(function (inicial) {
    if (inicial) setLoading(true);
    setError(null);
    return window.FRApi.get('/dev-costs', { skipLoading: true })
      .then(function (r) { setDados(r.data || null); if (inicial) setLoading(false); })
      .catch(function (e) { setError(dcErr(e)); if (inicial) setLoading(false); });
  }, []);
  R.useEffect(function () { carregar(true); }, [carregar]);

  const itens = (dados && dados.items) || [];
  const porCat = ((dados && dados.por_categoria) || [])
    .map(function (c) { return { ...c, ...(DC_CATS[c.category] || { label: c.category, cor: '#6b7280' }) }; })
    .sort(function (a, b) { return Number(b.total_mensal) - Number(a.total_mensal); });
  const maxCat = Math.max.apply(null, porCat.map(function (c) { return Number(c.total_mensal); }).concat([1]));
  const emAtencao = itens.filter(function (s) { return s.status === 'atencao'; });

  // Próxima cobrança REAL: a menor next_billing daqui pra frente. Sem nenhuma marcada, a tela
  // diz "nenhuma marcada" — o mock cravava "01/08".
  // Comparação de STRING 'YYYY-MM-DD': o formato é fixo e zero-padded, então a ordem
  // lexicográfica É a cronológica — e nenhum Date é construído, nenhum fuso entra na conta.
  const proxima = itens
    .map(function (s) { return dcYmd(s.next_billing); })
    .filter(Boolean)
    .sort()
    .find(function (d) { return d >= dcHoje(); });

  const salvarNovo = function () {
    const nome = String(form.name || '').trim();
    const valor = String(form.value || '').replace(',', '.').trim();
    if (!nome) return setErroModal('Informe o nome do serviço.');
    if (!(Number(valor) > 0)) return setErroModal('Informe um valor maior que zero.');
    setSalvando(true); setErroModal(null);
    const payload = { name: nome, category: form.category, value: valor, cycle: form.cycle };
    if (form.usage_note.trim()) payload.usage_note = form.usage_note.trim();
    if (form.next_billing) payload.next_billing = form.next_billing;
    window.FRApi.post('/dev-costs', payload)
      .then(function (r) {
        setNovo(false);
        setForm({ name: '', category: 'infra', value: '', cycle: 'mensal', usage_note: '', next_billing: '' });
        // Feedback local da ação — o toast permitido nesta fase. Mostra o equivalente MENSAL
        // devolvido pelo servidor, não o valor digitado: num serviço anual os dois diferem, e
        // repetir o digitado enganaria justamente no caso que a divisão existe pra resolver.
        if (window.frNotify) window.frNotify({
          icon: 'wallet', tone: 'blue', titulo: 'Serviço adicionado',
          txt: nome + ' · ' + dcBRL(r.data && r.data.value) + ' ' + DC_CICLO_LABEL[form.cycle],
        });
        return carregar(false);
      })
      .catch(function (e) { setErroModal(dcErr(e)); })
      .then(function () { setSalvando(false); });
  };

  const salvarEdit = function (s) {
    const v = String(editVal).replace(',', '.').trim();
    if (!(Number(v) > 0)) { setEditId(null); return; }
    window.FRApi.put('/dev-costs/' + s.id, { value: v })
      .then(function () {
        setEditId(null); setEditVal('');
        if (window.frNotify) window.frNotify({ icon: 'wallet', tone: 'green', titulo: 'Valor atualizado', txt: s.name + ' · ' + dcBRL(v) });
        return carregar(false);
      })
      .catch(function (e) { setEditId(null); setError(dcErr(e)); });
  };

  const remover = function (s) {
    if (!window.confirm('Remover "' + s.name + '" da lista de custos?')) return;
    window.FRApi.delete('/dev-costs/' + s.id)
      .then(function () {
        if (window.frNotify) window.frNotify({ icon: 'trash', tone: 'amber', titulo: 'Serviço removido', txt: s.name });
        return carregar(false);
      })
      .catch(function (e) { setError(dcErr(e)); });
  };

  const salvarNota = function (s, texto) {
    window.FRApi.put('/dev-costs/' + s.id, { usage_note: texto })
      .then(function () { return carregar(false); })
      .catch(function (e) { setError(dcErr(e)); });
  };

  const field = { boxSizing: 'border-box', height: 42, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' };

  const cabecalho = (
    <PageHeader t={t} title="Custos & Serviços"
      subtitle="Quanto custa manter o sistema de pé — o total mensal é calculado no servidor, com o anual dividido por 12."
      actions={<Btn t={t} icon="plus" onClick={() => { setErroModal(null); setNovo(true); }}>Adicionar serviço</Btn>} />
  );

  if (loading) return <div>{cabecalho}<Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando os custos…</Card></div>;
  if (error && !dados) {
    return (
      <div>{cabecalho}
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => carregar(true)}>Tentar novamente</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {cabecalho}
      {error && <Card t={t} style={{ padding: '10px 16px', marginBottom: 14, color: uiTone(t, 'red').fg, fontSize: 12.5, fontWeight: 700 }}>{error}</Card>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 18, marginBottom: 18 }}>
        <Card t={t} style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: t.muted }}>Gasto mensal total</div>
          <div style={{ fontSize: 30, fontWeight: 850, color: t.text, letterSpacing: '-.02em', margin: '6px 0 4px' }}>
            {dcBRL(dados && dados.total_mensal)}
          </div>
          <div style={{ fontSize: 12, color: t.muted }}>
            {itens.length} {itens.length === 1 ? 'serviço' : 'serviços'} · anual e variável já normalizados
          </div>
          {/* SEM gráfico de histórico: `dev_costs` é a foto de hoje, não tem competência. A
              dívida está registrada — o gráfico nasce quando houver meses de verdade. */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}`, fontSize: 11.5, color: t.faint }}>
            Projeção anual: <b style={{ color: t.text }}>{dcBRL(Number(dados && dados.total_mensal) * 12)}</b>
          </div>
        </Card>

        <Card t={t} style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: t.muted, marginBottom: 14 }}>Por categoria</div>
          {porCat.length === 0 ? (
            <div style={{ fontSize: 13, color: t.muted }}>Nenhum serviço cadastrado ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {porCat.map(function (c) {
                return (
                  <div key={c.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, gap: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: t.text, minWidth: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.cor, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 850, color: t.text, flexShrink: 0 }}>{dcBRL(c.total_mensal)}</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 6, background: t.hover, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(Number(c.total_mensal) / maxCat) * 100}%`, borderRadius: 6, background: c.cor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card t={t} style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: t.muted, marginBottom: 12 }}>Acompanhamento</div>
          {emAtencao.map(function (s) {
            return (
              <div key={s.id} style={{ display: 'flex', gap: 10, padding: '11px 13px', borderRadius: 12, background: amb.bg, border: `1px solid ${frHexToRgba('#f59e0b', .35)}`, marginBottom: 10 }}>
                <Icon name="alert" size={16} style={{ color: amb.fg, flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12.5, color: t.text, lineHeight: 1.5 }}>
                  <b>{s.name}</b> está marcado como <b style={{ color: amb.fg }}>atenção</b>{s.usage_note ? ` — ${s.usage_note}` : '.'}
                </div>
              </div>
            );
          })}
          {[
            ['Serviços ativos', String(itens.length)],
            ['Marcados como atenção', String(emAtencao.length)],
            // Data REAL ou a verdade de que não há nenhuma — nunca uma data cravada.
            ['Próxima cobrança', proxima ? dcData(proxima) : 'nenhuma marcada'],
          ].map(function (kv) {
            return (
              <div key={kv[0]} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: `1px solid ${t.border}`, fontSize: 12.5 }}>
                <span style={{ color: t.muted, fontWeight: 600 }}>{kv[0]}</span>
                <span style={{ color: t.text, fontWeight: 850 }}>{kv[1]}</span>
              </div>
            );
          })}
        </Card>
      </div>

      <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15.5, fontWeight: 850, color: t.text }}>Serviços contratados</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: t.faint }}>{itens.length} · {dcBRL(dados && dados.total_mensal)}/mês</span>
        </div>
        {itens.length === 0 && <div style={{ padding: 10 }}><EmptyState t={t} title="Nenhum serviço" sub="Cadastre o primeiro gasto recorrente para acompanhar o total." /></div>}
        {itens.map(function (s, i) {
          const c = DC_CATS[s.category] || { label: s.category, cor: '#6b7280' };
          const atencao = s.status === 'atencao';
          const anual = s.cycle === 'anual';
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderBottom: i < itens.length - 1 ? `1px solid ${t.border}` : 'none', flexWrap: 'wrap' }}>
              <span title={atencao ? 'Atenção — marcado por você' : 'Operacional'} style={{ width: 10, height: 10, borderRadius: '50%', background: atencao ? amb.fg : grn.fg, boxShadow: `0 0 0 4px ${atencao ? amb.bg : grn.bg}`, flexShrink: 0 }} />
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{s.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 999, background: frHexToRgba(c.cor, .13), color: c.cor }}>{c.label}</span>
                </div>
                <div style={{ fontSize: 11.5, color: t.muted, marginTop: 3 }}>
                  {DC_CICLO_LABEL[s.cycle] || s.cycle}
                  {s.next_billing ? ` · próx: ${dcData(s.next_billing)}` : ''}
                  {/* O equivalente mensal vem do servidor. Só aparece quando difere do valor
                      cheio (ou seja, no anual) — repetir "R$ 189,00 = R$ 189,00/mês" seria ruído. */}
                  {anual ? ` · ${dcBRL(s.mensal_equivalente)}/mês` : ''}
                </div>
                {/* usage_note editável: o que sobrou do "monitoramento vivo" do design, e é
                    honesto — anotação de gente, não medição de coletor que não existe. */}
                <input defaultValue={s.usage_note || ''} placeholder="anotação de uso (opcional)"
                  onBlur={(e) => { if (e.target.value !== (s.usage_note || '')) salvarNota(s, e.target.value); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                  style={{ marginTop: 6, boxSizing: 'border-box', width: '100%', maxWidth: 420, height: 30, borderRadius: 8, border: `1px dashed ${t.border}`, background: 'transparent', color: t.muted, padding: '0 9px', fontSize: 11.5, fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 'auto' }}>
                {editId === s.id ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <input autoFocus value={editVal} onChange={(e) => setEditVal(frSanQtd(e.target.value))}
                      onKeyDown={(e) => { if (e.key === 'Enter') salvarEdit(s); if (e.key === 'Escape') setEditId(null); }}
                      style={{ ...field, width: 110, height: 38, textAlign: 'right', fontWeight: 800 }} />
                    <button onClick={() => salvarEdit(s)} style={{ all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: grn.fg, color: '#fff' }}><Icon name="check" size={14} /></button>
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 17, fontWeight: 850, color: t.text }}>
                      {dcBRL(s.value)}<span style={{ fontSize: 10.5, fontWeight: 700, color: t.faint }}>/{s.cycle === 'anual' ? 'ano' : 'mês'}</span>
                    </span>
                    <button title="Editar valor" onClick={() => { setEditId(s.id); setEditVal(String(s.value).replace('.', ',')); }}
                      style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="pencil" size={13} /></button>
                  </span>
                )}
                <button title="Remover serviço" onClick={() => remover(s)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={14} /></button>
              </div>
            </div>
          );
        })}
      </Card>

      {novo && (
        <div onClick={() => !salvando && setNovo(false)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,10,16,.55)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(440px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center' }}><Icon name="wallet" size={18} /></span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 850, color: t.text }}>Adicionar serviço</div><div style={{ fontSize: 12, color: t.muted }}>Registre um gasto recorrente para monitorar.</div></div>
              <button onClick={() => !salvando && setNovo(false)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={15} /></button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 13 }}>
              <input autoFocus value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Nome do serviço · ex: VPS, Cloudflare, API…" style={field} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} style={{ ...field, width: '100%', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}>
                    {Object.entries(DC_CATS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
                  </select>
                  <Icon name="chevronDown" size={13} style={{ position: 'absolute', right: 11, top: 15, color: t.muted, pointerEvents: 'none' }} />
                </div>
                <div style={{ position: 'relative' }}>
                  {/* value = a chave do CHECK; o texto é só rótulo. O mock mandava "anual (÷12)"
                      como VALOR e por isso a divisão nunca acontecia. */}
                  <select value={form.cycle} onChange={(e) => setForm((s) => ({ ...s, cycle: e.target.value }))} style={{ ...field, width: '100%', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}>
                    {DC_CICLOS.map(([k, lb]) => <option key={k} value={k}>{lb}</option>)}
                  </select>
                  <Icon name="chevronDown" size={13} style={{ position: 'absolute', right: 11, top: 15, color: t.muted, pointerEvents: 'none' }} />
                </div>
              </div>
              <input value={form.value} onChange={(e) => setForm((s) => ({ ...s, value: frSanQtd(e.target.value) }))} onKeyDown={(e) => e.key === 'Enter' && salvarNovo()}
                placeholder={form.cycle === 'anual' ? 'Valor ANUAL · ex: 264,00' : 'Valor mensal · ex: 189,90'} inputMode="decimal" style={field} />
              <input type="date" value={form.next_billing} onChange={(e) => setForm((s) => ({ ...s, next_billing: e.target.value }))} style={field} />
              <input value={form.usage_note} onChange={(e) => setForm((s) => ({ ...s, usage_note: e.target.value }))} placeholder="Anotação de uso (opcional)" style={field} />
              {erroModal && <div style={{ fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{erroModal}</div>}
            </div>
            <div style={{ padding: '13px 22px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Btn t={t} kind="ghost" onClick={() => !salvando && setNovo(false)}>Cancelar</Btn>
              <Btn t={t} icon="check" onClick={salvarNovo}>{salvando ? 'Salvando…' : 'Salvar serviço'}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper de gate — mesmo padrão do DevPainel/DevChamados: a página só monta com a page_key.
// 'dev_custos' é chave-FOLHA e o canAccess casa por igualdade (a expansão por prefixo do front
// é delimitada por ':'), então ela não é aberta por nenhuma outra.
function DevCustos({ t }) {
  const A = window.FRAuth;
  if (!A || typeof A.canAccess !== 'function' || !A.canAccess('dev_custos')) {
    return (
      <div>
        <PageHeader t={t} title="Custos & Serviços" subtitle="Quanto custa manter o sistema de pé." />
        <Card t={t} style={{ padding: 40, textAlign: 'center' }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'inline-grid', placeItems: 'center', marginBottom: 14 }}><Icon name="lock" size={24} /></span>
          <div style={{ fontSize: 15.5, fontWeight: 850, color: t.text }}>Acesso restrito</div>
          <div style={{ fontSize: 13, color: t.muted, marginTop: 6 }}>Você não tem a permissão <b>dev_custos</b>. Peça ao administrador pela tela de Permissões.</div>
        </Card>
      </div>
    );
  }
  return <DevCustosReal t={t} />;
}

Object.assign(window, { DevCustos });
