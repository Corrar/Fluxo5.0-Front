// pages_clientes.jsx — "Clientes e OPs": KPIs, novo cliente, busca, grade de cards com OPs.
// LIGADO ao backend real (GET/POST/PUT/PATCH/DELETE /clients). A chave de React/estado é o UUID do
// backend (não o code). code/op_code são só DISPLAY. Status canônico do backend: em_andamento/concluido
// (largamos 'pausada'). O conteúdo da OP é o total_cost real (largamos a antiga ficção de itens por OP).
const { useState: useStateC } = React;

// Status CANÔNICO do backend (updateServiceStatus grava 'em_andamento'/'concluido').
const OP_STATUS = {
  'em_andamento': { label: 'Em andamento', badge: 'EM ANDAMENTO', kind: 'blue' },
  'concluido':    { label: 'Finalizada',   badge: 'FINALIZADA',   kind: 'green' },
};
// Fallback defensivo p/ qualquer status legado que ainda vier do banco (ex.: 'em-andamento' com hífen).
function opStatusOf(s) {
  if (OP_STATUS[s]) return OP_STATUS[s];
  if (s === 'finalizada' || s === 'done') return OP_STATUS['concluido'];
  return OP_STATUS['em_andamento'];
}
function isConcluido(s) { return s === 'concluido' || s === 'finalizada' || s === 'done'; }

// ☠️ CLIENTES_SEED, window.FR_OPS_ATIVAS, window.FR_OP_CLIENTE e window.frClienteDaOP MORRERAM AQUI.
//
// Eram 20 clientes ESTÁTICOS montados no load deste módulo, e a dívida estava documentada desde
// 24/07: "uma OP real criada na tela Clientes NÃO aparece nos dropdowns das telas mock". Com os
// 30 clientes / 44 OPs reais que o corte 2.0→5.0 traz, o seed deixaria de ser desatualizado e
// passaria a ser MENTIRA — nomes de cliente que não existem, OPs que o backend recusa.
//
// Quem consumia, e para onde foi (todos para a MESMA fonte, GET /clients):
//   • Meus Pedidos  -> migrado antes deste lote (useFRClients + frIsOpConcluida)
//   • Montagem      -> migrado antes deste lote (useFRClients + pgOpsAbertas)
//   • Produção/Devolução -> nasceram já ligados
//   • Conferência   -> a leitora (cfClienteDaOP) já estava MORTA; removida neste lote
//   • Separações    -> o último consumidor vivo; migrado NESTE lote
//
// NÃO virou fachada de propósito: sem consumidor, uma fachada seria um segundo caminho para o
// mesmo dado — e a lição desta dívida é que fonte duplicada diverge. O ponto compartilhado é
// `window.useFRClients` (hook, aqui embaixo) + `window.pgOpsAbertas` (filtro por frIsOpConcluida).

// ---- Formatação BRL (reusa o adapter dos produtos; fallback simples) ----
function frBRL(v) {
  const f = window.FRAdapters && window.FRAdapters.formatBRL;
  return f ? f(v) : ('R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}
function frCliErr(e) {
  const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
  return g ? g(e) : (e && e.message) || 'Erro inesperado.';
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// EXPORTAR PDF DA OP — lote PDF1
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Layout do ref21 (`ref21/pages_clientes.jsx:58`), DADOS do banco. O protótipo mostrava a OP
// 26202 com "2 itens / 41 un / R$ 3.104,90"; a mesma OP em produção tem 21 linhas e
// R$ 58.694,44. Aproveita-se o desenho, nunca os números.
//
// O caminho é o MESMO dos dois documentos que já rodam em produção (romaneio de viagem e
// relatório de confronto, pages_rest.jsx): window.open + document.write + print(). ZERO
// biblioteca nova — o projeto não tem nenhuma de PDF, e não é este lote que traz a primeira.
//
// ⚠ A JANELA ABRE ANTES DO FETCH, e isso é de propósito. Os dois documentos antigos já tinham
// os dados em mãos e podiam abrir a janela depois. Aqui os itens vêm de uma rota nova, e
// `window.open` depois de um `await` perde o gesto do usuário: o navegador bloqueia o popup.
// Então abre-se primeiro (dentro do clique), escreve-se um "Gerando…", e o conteúdo real
// substitui aquilo quando a resposta chega. Erro também é escrito NA JANELA — deixá-la em
// branco seria a falha silenciosa que o resto da casa não aceita.
const pdfBRL = (v) => {
  const n = Number(v || 0);
  return Number.isFinite(n) ? 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
};
// `frEscHtml` é o `cfEsc` de pages_rest.jsx promovido a global no PDF1 — nome de produto vem do
// banco e entra num document.write. O fallback existe só para o caso de ordem de carga; ele
// escapa igual, não é versão fraca.
const pdfEsc = (s) => (window.frEscHtml
  ? window.frEscHtml(s)
  : String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])));
const pdfData = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
};

// O CSS é o do romaneio/confronto que já sobrevive ao print em produção, mais o <tfoot> de
// TOTAL do ref21. `@media print` reduz a margem; `thead{display:table-header-group}` repete o
// cabeçalho a cada página — as OPs grandes passam de 200 linhas (a maior tem 238).
const PDF_CSS = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#14161c;padding:34px 38px;display:flex;flex-direction:column;min-height:96vh}
  .top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:3px solid #2e3192;padding-bottom:16px;margin-bottom:20px}
  .badge{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.06em;padding:5px 12px;border-radius:999px;color:#fff}
  h1{font-size:22px;letter-spacing:-.02em;margin-top:8px}
  .sub{font-size:13px;color:#5a5f6b;margin-top:3px}
  .tot{text-align:right}
  .tot .lbl{font-size:10px;font-weight:800;letter-spacing:.1em;color:#5a5f6b}
  .tot .val{font-size:24px;font-weight:850;color:#2e3192;margin-top:3px;white-space:nowrap}
  table{width:100%;border-collapse:collapse;font-size:12.5px}
  thead{display:table-header-group}
  th{text-align:left;font-size:10px;letter-spacing:.08em;color:#5a5f6b;border-bottom:2px solid #d8dbe4;padding:8px 10px}
  td{padding:10px;border-bottom:1px solid #e8eaf0;vertical-align:top}
  tr{break-inside:avoid;page-break-inside:avoid}
  tbody tr:nth-child(even) td{background:#f7f8fb}
  .num{text-align:right;white-space:nowrap}
  .sku{font-size:10.5px;color:#8a8f9c;font-family:ui-monospace,monospace}
  .fund{font-size:10px;color:#8a8f9c}
  tfoot td{border-top:2px solid #2e3192;border-bottom:none;font-weight:850;font-size:14px;background:none!important}
  .nota{margin-top:14px;font-size:10.5px;color:#5a5f6b;line-height:1.55;border-left:3px solid #d8dbe4;padding-left:10px}
  .rodape{margin-top:auto;padding-top:26px;display:flex;align-items:center;justify-content:center;gap:10px;border-top:1px solid #e8eaf0}
  .rodape img{height:28px}
  .rodape span{font-size:10.5px;color:#8a8f9c}
  @media print{body{padding:18px 22px}}
`;

function pdfDocumentoOP(dados) {
  const op = dados.op || {};
  const itens = Array.isArray(dados.items) ? dados.items : [];
  const st = opStatusOf(op.status);
  const corBadge = st.kind === 'green' ? '#0b8a4d' : '#2563eb';
  const logo = window.__asset ? window.__asset('assets/logo-royale.png') : '/assets/logo-royale.png';
  const emitido = dados.emitido_em ? new Date(dados.emitido_em) : new Date();
  const emitidoTxt = emitido.toLocaleDateString('pt-BR') + ' às ' +
    emitido.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const unidades = itens.reduce((a, x) => a + Number(x.quantidade || 0), 0);

  const rows = itens.map((x, i) => {
    // `movimentos > 1` = esta linha FUNDIU mais de um documento e a data mostrada é a do
    // movimento MAIS RECENTE. Dizer isso na própria linha é o que impede o leitor de tomar
    // a data por "a data da solicitação" — medido: 437 das 1.841 linhas fundem, até 20 docs.
    const fundida = Number(x.movimentos || 1) > 1
      ? ` <span class="fund">(${x.movimentos} mov.)</span>` : '';
    return `<tr>
      <td class="num">${i + 1}</td>
      <td><b>${pdfEsc(x.produto)}</b><br><span class="sku">SKU ${pdfEsc(x.sku || '—')}</span></td>
      <td class="num">${Number(x.quantidade || 0).toLocaleString('pt-BR')} ${pdfEsc(x.unit || 'un')}</td>
      <td>${pdfData(x.movido_em)}${fundida}</td>
      <td class="num">${pdfBRL(x.unit_price)}</td>
      <td class="num"><b>${pdfBRL(x.subtotal)}</b></td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
    <title>OP ${pdfEsc(op.op_code)} — ${pdfEsc(op.client_name || '')}</title><style>${PDF_CSS}</style></head><body>
    <div class="top">
      <div>
        <div class="sub" style="font-size:15px;font-weight:800;color:#14161c">${pdfEsc(op.client_name || 'Sem cliente')}</div>
        <h1>OP ${pdfEsc(op.op_code)}</h1>
        <div class="sub"><span class="badge" style="background:${corBadge}">${pdfEsc(st.badge)}</span> · Emitido em ${pdfEsc(emitidoTxt)}</div>
        ${op.description ? `<div class="sub">${pdfEsc(op.description)}</div>` : ''}
      </div>
      <div class="tot">
        <div class="lbl">VALOR TOTAL DA OP</div>
        <div class="val">${pdfBRL(op.total_cost)}</div>
        <div class="sub">${itens.length} ${itens.length === 1 ? 'item' : 'itens'} · ${unidades.toLocaleString('pt-BR')} un</div>
      </div>
    </div>
    <table>
      <thead><tr><th class="num">#</th><th>MATERIAL</th><th class="num">QTD</th><th>MOVIMENTO EM</th><th class="num">VALOR UNIT.</th><th class="num">SUBTOTAL</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#8a8f9c;padding:26px">Esta OP ainda não teve material entregue.</td></tr>'}</tbody>
      ${itens.length ? `<tfoot><tr><td colspan="5" style="text-align:right">TOTAL</td><td class="num">${pdfBRL(op.total_cost)}</td></tr></tfoot>` : ''}
    </table>
    <!-- AS DUAS FRASES SÃO INCONDICIONAIS (decisão do Bruno, 21/08). A segunda não depende de
         haver item a zero NESTE documento: ela ensina a convenção, e uma OP sem item a zero
         hoje ganha um amanhã sem que ninguém reemita a regra. Medido: 542 de 2.611 linhas
         (20,8%) saem a R$ 0,00, em 34 das 46 OPs.
         A terceira frase é do grão agrupado — ver DIVIDAS. -->
    <div class="nota">
      Valores calculados com o preço de cadastro vigente em ${pdfEsc(emitidoTxt)}.
      Itens sem preço cadastrado aparecem como R$&nbsp;0,00.
      <br>Cada linha agrupa todas as movimentações do mesmo material nesta OP; onde há mais de uma (&ldquo;n&nbsp;mov.&rdquo;), a data exibida é a do movimento mais recente.
    </div>
    <div class="rodape"><img src="${logo}" alt="Fluxo Royale"><span>Fluxo Royale ERP · documento gerado automaticamente</span></div>
  <\/body></html>`;
}

// ---- Adapter: cliente REAL (GET /clients) -> shape da tela ----
// Backend: { id(uuid), code, name, services:[{ id(uuid), op_code, description, status, total_cost }] }
// A tela usa: chave = UUID; code/op_code = display; status canônico; total_cost real.
function adaptClient(c) {
  c = c || {};
  return {
    id: c.id,                                   // UUID — chave de React + path das rotas
    code: c.code || '',                         // display "ID do cliente"
    nome: c.name || '',
    ops: (c.services || []).map((s) => ({
      id: s.id,                                 // UUID do service — path das rotas /services/:id
      op_code: s.op_code || '',
      n: 'OP ' + (s.op_code || ''),             // display re-prefixado
      s: s.status || 'em_andamento',            // canônico
      total_cost: Number(s.total_cost || 0),
    })),
  };
}

// ---- Hook de dados: GET /clients adaptado (padrão do useFRProducts) ----
function useFRClients() {
  const R = window.React;
  const [items, setItems] = R.useState([]);
  const [loading, setLoading] = R.useState(true);
  const [error, setError] = R.useState(null);
  const mounted = R.useRef(true);
  const load = R.useCallback(function () {
    setError(null);
    window.FRApi.get('/clients', { skipLoading: true })
      .then(function (res) {
        if (!mounted.current) return;
        const rows = Array.isArray(res && res.data) ? res.data : [];
        setItems(rows.map(adaptClient));
        setLoading(false);
      })
      .catch(function (e) {
        if (!mounted.current) return;
        setError(frCliErr(e));
        setLoading(false);
      });
  }, []);
  R.useEffect(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);
  return { items: items, loading: loading, error: error, reload: load };
}

function PageClientes({ t, readOnly }) {
  const { items: clientes, loading, error, reload } = useFRClients();
  const [xfer, setXfer] = useStateC(null);   // { srcId, srcLabel } origem da transferência
  const [toast, setToast] = useStateC(null);
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);
  const [expanded, setExpanded] = useStateC([]);
  const [q, setQ] = useStateC('');
  const [filtro, setFiltro] = useStateC('todos');
  const [nid, setNid] = useStateC('');
  const [nnome, setNnome] = useStateC('');
  const [novaOp, setNovaOp] = useStateC({});
  const [busy, setBusy] = useStateC(false);

  const errToast = (e) => setToast({ kind: 'err', msg: frCliErr(e) });
  const okToast = (msg) => setToast({ kind: 'ok', msg });

  const finalizadas = (c) => c.ops.filter((o) => isConcluido(o.s)).length;
  const progresso = (c) => (c.ops.length ? Math.round((finalizadas(c) / c.ops.length) * 100) : 0);
  const opsTotais = clientes.reduce((a, c) => a + c.ops.length, 0);
  const opsFin = clientes.reduce((a, c) => a + finalizadas(c), 0);

  const ql = q.trim().toLowerCase();
  const view = clientes.filter((c) => {
    const match = !ql || c.nome.toLowerCase().includes(ql) || (c.code || '').toLowerCase().includes(ql) || c.ops.some((o) => o.n.toLowerCase().includes(ql));
    const pr = progresso(c);
    const fmatch = filtro === 'todos' || (filtro === 'andamento' && pr < 100) || (filtro === 'finalizadas' && pr === 100);
    return match && fmatch;
  });

  const toggle = (id) => setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  // ---- Handlers REAIS (FRApi + reload após sucesso) ----
  const addCliente = async () => {
    if (!nid.trim() || !nnome.trim()) { setToast({ kind: 'err', msg: 'Informe o ID/código e o nome do cliente.' }); return; }
    if (busy) return; setBusy(true);
    try {
      await window.FRApi.post('/clients', { code: nid.trim(), name: nnome.trim().toUpperCase() });
      setNid(''); setNnome(''); await reloadAsync();
    } catch (e) { errToast(e); } finally { setBusy(false); }
  };
  const renameCliente = async (c) => {
    const novo = window.prompt('Novo nome do cliente:', c.nome);
    if (novo == null) return;
    const name = novo.trim().toUpperCase();
    if (!name || name === c.nome) return;
    if (busy) return; setBusy(true);
    try { await window.FRApi.put('/clients/' + c.id, { name }); await reloadAsync(); }
    catch (e) { errToast(e); } finally { setBusy(false); }
  };
  const delCliente = async (id) => {
    if (busy) return; setBusy(true);
    try { await window.FRApi.delete('/clients/' + id); await reloadAsync(); }
    catch (e) { errToast(e); } finally { setBusy(false); }   // 400 FK-guard -> toast, NÃO remove
  };
  const addOp = async (cid) => {
    const label = (novaOp[cid] || '').trim();
    const op_code = label.replace(/^op\s*/i, '').toUpperCase().trim();
    if (!op_code) { setToast({ kind: 'err', msg: 'Informe o número da OP.' }); return; }
    if (busy) return; setBusy(true);
    try {
      await window.FRApi.post('/clients/' + cid + '/services', { op_code });
      setNovaOp((m) => ({ ...m, [cid]: '' }));
      setExpanded((e) => (e.includes(cid) ? e : [...e, cid]));
      await reloadAsync();
    } catch (e) { errToast(e); } finally { setBusy(false); }
  };
  const setOpStatus = async (serviceId, status) => {
    if (busy) return; setBusy(true);
    try { await window.FRApi.patch('/clients/services/' + serviceId + '/status', { status }); await reloadAsync(); }
    catch (e) { errToast(e); } finally { setBusy(false); }
  };
  const delOp = async (serviceId, label) => {
    if (busy) return; setBusy(true);
    try { await window.FRApi.delete('/clients/services/' + serviceId); await reloadAsync(); okToast(`${label} excluída.`); }
    catch (e) { errToast(e); } finally { setBusy(false); }   // 400 -> tem movimentações -> toast, NÃO remove
  };
  const doTransfer = async (destServiceId, destLabel) => {
    if (!xfer) return;
    if (busy) return; setBusy(true);
    try {
      await window.FRApi.post('/clients/services/' + xfer.srcId + '/transfer', { targetServiceId: destServiceId });
      const from = xfer.srcLabel; setXfer(null); await reloadAsync();
      setToast({ kind: 'ok', msg: `Movimentações de ${from} transferidas para ${destLabel}.` });
    } catch (e) { setXfer(null); errToast(e); } finally { setBusy(false); }
  };
  // reload retorna void; embrulho em Promise pra dar await (a UI atualiza quando os items chegam)
  const reloadAsync = () => { reload(); return Promise.resolve(); };

  // Exportar PDF da OP (lote PDF1). A janela abre DENTRO do clique — ver a nota longa em
  // `pdfDocumentoOP`, acima: abrir depois do await perde o gesto e o popup é bloqueado.
  const [pdfBusy, setPdfBusy] = useStateC(null);   // id da OP em geração (trava só aquele botão)
  const exportarPDF = async (op) => {
    if (pdfBusy) return;
    const w = window.open('', '_blank');
    if (!w) { setToast({ kind: 'err', msg: 'O navegador bloqueou a janela do PDF — libere pop-ups para este site e tente de novo.' }); return; }
    w.document.write('<!DOCTYPE html><meta charset="utf-8"><title>Gerando…</title>'
      + '<body style="font-family:\'Segoe UI\',Arial,sans-serif;color:#5a5f6b;padding:40px">Montando o documento da ' + pdfEsc(op.n) + '…</body>');
    w.document.close();
    setPdfBusy(op.id);
    try {
      const res = await window.FRApi.get('/clients/services/' + op.id + '/items', { skipLoading: true });
      w.document.open();
      w.document.write(pdfDocumentoOP(res && res.data));
      w.document.close();
      // Mesmo compasso dos dois documentos que já rodam em produção (pages_rest.jsx): dar ao
      // layout o tempo de assentar antes de chamar o print.
      w.onload = () => setTimeout(() => w.print(), 350);
    } catch (e) {
      // O erro vai PARA A JANELA e não só para o toast: uma aba em branco é falha silenciosa.
      // O 403 é o caso esperado de quem não tem `clientes:edit` — a mensagem vem do backend.
      const msg = frCliErr(e);
      w.document.open();
      w.document.write('<!DOCTYPE html><meta charset="utf-8"><title>Não foi possível gerar</title>'
        + '<body style="font-family:\'Segoe UI\',Arial,sans-serif;color:#14161c;padding:40px">'
        + '<h2 style="margin-bottom:8px">Não foi possível gerar o PDF</h2>'
        + '<p style="color:#5a5f6b">' + pdfEsc(msg) + '</p></body>');
      w.document.close();
      setToast({ kind: 'err', msg: msg });
    } finally { setPdfBusy(null); }
  };

  const field = { boxSizing: 'border-box', height: 44, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const initials = (n) => (n || '').replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const [hA1, hA2] = ['#0b3a8f', '#2563eb'];

  return (
    <div>
      {/* hero */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '26px 28px', marginBottom: 22, background: `linear-gradient(135deg, ${hA1}, ${hA2})`, color: '#fff' }}>
        <Icon name="users" size={180} style={{ position: 'absolute', right: -30, top: -38, opacity: 0.1 }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 850, letterSpacing: '-.02em', display: 'flex', alignItems: 'center', gap: 11 }}><Icon name="users" size={24} /> Painel de Clientes</h1>
            <p style={{ margin: '7px 0 0', fontSize: 13.5, color: 'rgba(255,255,255,.85)' }}>Gestão de Clientes e Ordens de Produção (OP).</p>
          </div>
        </div>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 22 }}>
          {[['users', 'Clientes', clientes.length], ['clipboard', 'OPs totais', opsTotais], ['check', 'OPs finalizadas', opsFin]].map(([ic, lab, val]) => (
            <div key={lab} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.18)' }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,.18)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={ic} size={19} /></span>
              <div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(255,255,255,.8)', textTransform: 'uppercase' }}>{lab}</div><div style={{ fontSize: 24, fontWeight: 850, lineHeight: 1.1 }}>{val}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* novo cliente */}
      {!readOnly && (
      <Card t={t} style={{ padding: 18, marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="userPlus" size={17} /></span>
          <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Novo cliente</span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: 150 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.muted, marginBottom: 7 }}>ID do cliente</label>
            <input value={nid} onChange={(e) => setNid(e.target.value)} placeholder="Ex: 001" style={field} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.muted, marginBottom: 7 }}>Nome do cliente</label>
            <input value={nnome} onChange={(e) => setNnome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCliente()} placeholder="Ex: Indústria Alfa Ltda" style={field} />
          </div>
          <Btn t={t} icon="userPlus" onClick={addCliente}>Adicionar cliente</Btn>
        </div>
      </Card>
      )}

      {readOnly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: t.accentSoft, color: t.accentText, fontSize: 12.5, fontWeight: 600, marginBottom: 22 }}>
          <Icon name="eye" size={16} /> Modo somente leitura — visualização de clientes e OPs.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: t.text, letterSpacing: '-.01em' }}>Lista de clientes</span>
        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: t.accentSoft, color: t.accentText }}>{view.length} de {clientes.length}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 220, height: 46, padding: '0 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, ID ou número da OP…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
        </label>
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
          {[['todos', 'Todos'], ['andamento', 'Em andamento'], ['finalizadas', 'Finalizadas']].map(([k, label]) => {
            const on = filtro === k;
            return <button key={k} onClick={() => setFiltro(k)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', height: 38, padding: '0 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? t.onAccent : t.muted, whiteSpace: 'nowrap' }}>{label}</button>;
          })}
        </div>
      </div>

      {loading && !clientes.length ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando clientes…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => reload()}>Tentar novamente</Btn>
        </Card>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
        {view.map((c) => {
          const open = expanded.includes(c.id);
          const pr = progresso(c);
          return (
            <Card t={t} key={c.id} hover style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: pr === 100 ? uiTone(t, 'green').bg : t.accentSoft, color: pr === 100 ? uiTone(t, 'green').fg : t.accentText, display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 14, flexShrink: 0 }}>{initials(c.nome)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 16.5, fontWeight: 850, color: t.text, letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</span>
                    {!readOnly && (
                      <button title="Renomear cliente" onClick={() => renameCliente(c)} style={{ all: 'unset', cursor: 'pointer', width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.faint, flexShrink: 0 }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = t.accentText; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.faint; }}><Icon name="pencil" size={13} /></button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: t.hover, color: t.muted, whiteSpace: 'nowrap' }}>ID {c.code}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: pr === 100 ? uiTone(t, 'green').fg : t.muted, whiteSpace: 'nowrap' }}>{finalizadas(c)}/{c.ops.length} finalizadas</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                  {!readOnly && (
                    <button onClick={() => delCliente(c.id)} title="Excluir cliente" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={16} /></button>
                  )}
                  <button onClick={() => toggle(c.id)} title={open ? 'Recolher' : 'Expandir'} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="chevronDown" size={18} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 0 8px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: t.faint }}>PROGRESSO</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: pr === 100 ? uiTone(t, 'green').fg : t.accentText }}>{pr}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 6, background: t.hover, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pr}%`, borderRadius: 6, background: pr === 100 ? `linear-gradient(90deg, ${uiTone(t, 'green').fg}, ${frHexToRgba(uiTone(t, 'green').fg, 0.7)})` : `linear-gradient(90deg, ${t.accent}, ${frHexToRgba(t.accent, 0.65)})`, transition: 'width .45s ease' }} />
              </div>

              {open && (
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
                  {!readOnly && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, height: 40, padding: '0 12px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
                      <Icon name="briefcase" size={15} />
                      <input value={novaOp[c.id] || ''} onChange={(e) => setNovaOp((m) => ({ ...m, [c.id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addOp(c.id)} placeholder="Adicionar nova OP…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 13, fontFamily: 'inherit' }} />
                    </label>
                    <button onClick={() => addOp(c.id)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: t.text, border: `1px solid ${t.border}`, background: t.panel }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = t.panel; }}><Icon name="plus" size={15} /> Nova OP</button>
                  </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {c.ops.map((o) => {
                      const st = opStatusOf(o.s); const col = uiTone(t, st.kind);
                      return (
                        <div key={o.id} style={{ borderRadius: 12, padding: 14, background: t.elevated, border: `1px solid ${t.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <span style={{ width: 9, height: 9, borderRadius: '50%', background: col.fg, flexShrink: 0 }} />
                            <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{o.n}</span>
                          </div>
                          <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.04em', padding: '4px 9px', borderRadius: 7, background: col.bg, color: col.fg }}>{st.badge}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: o.total_cost !== 0 ? t.muted : t.faint }}>
                              <Icon name="dollar" size={13} /> {o.total_cost !== 0 ? frBRL(o.total_cost) : 'Sem custo'}
                            </span>
                          </div>
                          {!readOnly && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                            <div style={{ position: 'relative' }}>
                              <select value={isConcluido(o.s) ? 'concluido' : 'em_andamento'} onChange={(e) => setOpStatus(o.id, e.target.value)} style={{ boxSizing: 'border-box', width: '100%', height: 38, borderRadius: 9, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 32px 0 12px', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', appearance: 'none', WebkitAppearance: 'none', outline: 'none', cursor: 'pointer' }}>
                                <option value="em_andamento">Em andamento</option>
                                <option value="concluido">Finalizada</option>
                              </select>
                              <Icon name="chevronDown" size={14} style={{ position: 'absolute', right: 11, top: 12, color: t.muted, pointerEvents: 'none' }} />
                            </div>
                            {/* EXPORTAR PDF — lote PDF1.
                                ⚠ Fica DENTRO do !readOnly de propósito, e isso é decisão do Bruno
                                (21/08), não descuido: exportar exige `clientes:edit`, a mesma chave
                                do Transferir e do Excluir logo abaixo. Consequência declarada — quem
                                entra pela aba do módulo PRODUÇÃO não vê este botão, porque aquele
                                módulo monta a tela em readOnly (pages_admin.jsx:2576). A exportação
                                acontece pelo Estoque / Compras / Dev / Assistência / Financeiro.
                                O botão sumir é conveniência; a trava de verdade é o
                                requirePermission('clientes:edit') na rota. */}
                            <button onClick={() => exportarPDF(o)} disabled={pdfBusy === o.id} title="Exportar a lista de materiais desta OP em PDF"
                              style={{ all: 'unset', boxSizing: 'border-box', cursor: pdfBusy === o.id ? 'progress' : 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 38, borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: pdfBusy === o.id ? t.faint : t.accentText, border: `1px solid ${t.border}`, background: t.panel }}
                              onMouseEnter={(e) => { if (pdfBusy !== o.id) e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = t.panel; }}>
                              <Icon name="download" size={15} /> {pdfBusy === o.id ? 'Gerando…' : 'Exportar PDF'}
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button onClick={() => setXfer({ srcId: o.id, srcLabel: o.n })} title="Transferir todas as movimentações para outra OP"
                                style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 38, borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: t.accentText, border: `1px solid ${t.border}`, background: t.panel }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = t.panel; }}>
                                <Icon name="swap" size={15} /> Transferir movimentações
                              </button>
                              <button onClick={() => delOp(o.id, o.n)} title="Excluir OP" style={{ all: 'unset', cursor: 'pointer', width: 38, height: 38, borderRadius: 9, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}`, flexShrink: 0 }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={15} /></button>
                            </div>
                          </div>
                          )}
                        </div>
                      );
                    })}
                    {c.ops.length === 0 && <div style={{ padding: '14px', textAlign: 'center', fontSize: 12.5, color: t.muted, border: `1px dashed ${t.border}`, borderRadius: 10 }}>Nenhuma OP cadastrada.</div>}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {view.length === 0 && <Card t={t} style={{ padding: 24, textAlign: 'center', color: t.muted, fontSize: 13.5, gridColumn: '1/-1' }}>Nenhum cliente encontrado.</Card>}
      </div>
      )}

      {/* Modal: transferir movimentações da OP */}
      {xfer && (() => {
        const dests = clientes.flatMap((c) => c.ops.map((o) => ({ c, o })).filter((x) => x.o.id !== xfer.srcId));
        return (
          <div onClick={() => setXfer(null)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8,10,20,.55)', display: 'grid', placeItems: 'center', padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 96vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: t.panel, borderRadius: 18, border: `1px solid ${t.borderStrong}`, boxShadow: t.shadow, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: t.accentSoft, color: t.accentText, flexShrink: 0 }}><Icon name="swap" size={19} /></div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Transferir movimentações</div>
                    <div style={{ fontSize: 12.5, color: t.muted }}>De <b style={{ color: t.text }}>{xfer.srcLabel}</b> para a OP escolhida</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: t.muted, lineHeight: 1.5 }}>Todas as movimentações (pedidos, saídas, devoluções) vinculadas a esta OP serão reatribuídas à OP de destino.</div>
              </div>
              <div className="fr-scroll" style={{ padding: 12, overflowY: 'auto' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', color: t.faint, padding: '4px 8px 8px' }}>ESCOLHA A OP DE DESTINO</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dests.map(({ c, o }) => (
                    <button key={o.id} onClick={() => doTransfer(o.id, o.n)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.elevated; }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>{o.n}</div>
                        <div style={{ fontSize: 11.5, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome} · {opStatusOf(o.s).label}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: t.faint, flexShrink: 0 }}>{o.total_cost !== 0 ? frBRL(o.total_cost) : '—'}</span>
                      <Icon name="chevronRight" size={16} style={{ color: t.muted, flexShrink: 0 }} />
                    </button>
                  ))}
                  {dests.length === 0 && <div style={{ padding: 16, textAlign: 'center', fontSize: 12.5, color: t.muted }}>Nenhuma outra OP disponível.</div>}
                </div>
              </div>
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setXfer(null)} style={{ all: 'unset', cursor: 'pointer', height: 38, padding: '0 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: t.text, border: `1px solid ${t.border}` }}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', zIndex: 90, bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderRadius: 13, background: toast.kind === 'err' ? uiTone(t, 'red').fg : t.text, color: '#fff', boxShadow: '0 18px 40px rgba(0,0,0,.3)', maxWidth: '92vw' }}>
          <Icon name={toast.kind === 'err' ? 'alert' : toast.kind === 'ok' ? 'check' : 'swap'} size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ all: 'unset', cursor: 'pointer', opacity: 0.7, flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>
      )}
    </div>
  );
}

window.PageClientes = PageClientes;

// Expostos p/ TODAS as telas que escolhem OP (Produção, Montagem, Meus Pedidos, Devolução e,
// desde este lote, Separações). Fonte única: GET /clients. Não há mais alternativa mock — o
// seed que competia com esta fonte morreu no topo do arquivo.
// isConcluido vai junto de propósito: é o normalizador de status da casa, e é ele que define
// "OP aberta" — por EXCLUSÃO do que terminou, nunca por igualdade com 'em_andamento'.
// (Correção 07/08/2026: o texto antigo aqui afirmava "16 OPs legadas em 'pendente' + 1 em
// 'em_andamento'". Esse número nunca conferiu com a validação — medido: 5 em_andamento, 2
// concluido, ZERO pendente. A migration 021 fechou o vocabulário do banco em em_andamento|
// concluido, com NOT NULL e CHECK, então 'pendente' não volta. O normalizador continua sendo
// por exclusão de propósito: é o que mantém as telas concordando entre si e o que absorve o
// vocabulário do 2.0 no dia da carga sem esconder OP viva.)
window.useFRClients = useFRClients;
window.frIsOpConcluida = isConcluido;
