// pages_admin.jsx — Entradas, Saídas, Usuários, Relatórios, Placeholder + router.
import * as XLSX from 'xlsx';   // leitura de planilha .xlsx na Entrada por NF (import de itens)
const { useState: useStateA } = React;

// MATERIAIS (mock por SKU) removido: a busca de material agora usa window.useFRProducts() (GET /products
// adaptado), com a row carregando product_id REAL + sku + nome. Ver PageEntradaNova / PageMeusPedidosLegacy.
const ARMAZENS = ['Almoxarifado Central', 'Usinagem', 'Produção 3D', 'Elétrica', 'Montagem', 'Expedição'];
// Setores de destino da SAÍDA manual. FONTE DA VERDADE: VALID_SECTORS no backend
// (Backend-Fluxo2.0/src/controllers/stock.controller.ts → manualWithdrawal). Precisa bater 1:1,
// senão o POST /stock/manual-withdrawal toma 400 "Setor de destino inválido". NÃO reusar ARMAZENS.
const SETORES_SAIDA = ['Elétrica', 'Flow', 'Esteira', 'Lavadora', 'Usinagem', 'Desenvolvimento', 'Protótipo', 'Engenharia', 'Outros', 'Viagem', 'Terceiros', 'Acumulador', 'Reposição'];

// Gera um código de barras Code 128B REAL (escaneável) a partir do texto.
const FR_C128 = ['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];
function frBarcode128(text) {
  const s = String(text);
  const codes = [104]; // Start B
  for (let i = 0; i < s.length; i++) codes.push(s.charCodeAt(i) - 32);
  let sum = 104;
  for (let i = 1; i < codes.length; i++) sum += codes[i] * i;
  codes.push(sum % 103);  // checksum
  codes.push(106);        // Stop
  const bars = [];
  codes.forEach((c) => {
    const pat = FR_C128[c];
    for (let i = 0; i < pat.length; i++) bars.push({ w: parseInt(pat[i], 10), on: i % 2 === 0 });
  });
  return bars;
}
window.frBarcode128 = frBarcode128;
// frPrintEtiquetas (window.print + frBarcode128) REMOVIDO: a impressão da Entrada por NF agora usa o
// caminho ZPL/Browser Print da Conferência (window.cfPrintIdentificacao), disparado SÓ após o 201 do
// POST /stock/entries. Ver handleEntradaImprimir em PageEntradaNova. frBarcode128 (acima) mantido
// como util exposto em window.frBarcode128.

const SOLICITACOES = [
  { id: 1, req: 'REQ-B491B451', sol: 'Nemias',       setor: 'Desenvolvimento', op: '00005', status: 'em-analise', time: 'há cerca de 1 hora',  itens: [{ nome: 'Parafuso Allen Inox 3/16 x 1', sku: '3.09.0484', qtd: 20 }] },
  { id: 2, req: 'REQ-C12F0A92', sol: 'Osmar',        setor: 'Flow',            op: '901001', status: 'em-analise', time: 'há cerca de 1 hora',  itens: [{ nome: 'Rolamento 6204ZZ', sku: '4.10.0233', qtd: 6 }, { nome: 'Cabo Flexível 2,5mm', sku: '5.20.0099', qtd: 30 }, { nome: 'Arruela Lisa 8mm', sku: '7.40.0150', qtd: 50 }] },
  { id: 3, req: 'REQ-77A1D034', sol: 'Leo Monteiro', setor: 'Usinagem',        op: '73001', status: 'concluido',  time: 'há cerca de 2 horas', itens: [{ nome: 'Chapa Aço 1020 2mm', sku: '1.02.0044', qtd: 3 }] },
  { id: 4, req: 'REQ-90B2E551', sol: 'Everton',      setor: 'Esteira',         op: '12010', status: 'concluido',  time: 'há cerca de 2 horas', itens: [{ nome: 'Tinta Epóxi Cinza 3,6L', sku: '6.30.0012', qtd: 1 }] },
  { id: 5, req: 'REQ-44C9F210', sol: 'William',      setor: 'Montagem',        op: '88210', status: 'a-separar',  time: 'há cerca de 3 horas', itens: [{ nome: 'Parafuso Sextavado M8', sku: '9.99.0238', qtd: 80 }] },
  { id: 6, req: 'REQ-1A8B7C33', sol: 'Davi Miranda', setor: 'Produção 3D',     op: '54120', status: 'a-separar',  time: 'há cerca de 4 horas', itens: [{ nome: 'Filamento PLA Azul 1kg', sku: '3.00.0101', qtd: 4 }] },
  { id: 7, req: 'DEV-0501', sol: 'Bruno Teixeira', setor: 'Produção', op: '73001', status: 'em-analise', time: 'há 25 min', tipo: 'devolucao', itens: [{ nome: 'Cabo Flexível 2,5mm', sku: '5.20.0099', qtd: 38, un: 'm', cond: 'bom' }, { nome: 'Parafuso Sextavado M8', sku: '9.99.0238', qtd: 16, un: 'un', cond: 'ruim' }] },
  { id: 8, req: 'DEV-0498', sol: 'Carlos Moura', setor: 'Produção', op: '00021', status: 'em-analise', time: 'há 1 hora', tipo: 'devolucao', itens: [{ nome: 'Tinta Epóxi Cinza 3,6L', sku: '6.30.0012', qtd: 2, un: 'lt', cond: 'avariado' }] },
];
const DEV_COND = { bom: ['Bom', 'green'], ruim: ['Ruim', 'amber'], avariado: ['Avariado', 'red'] };
const MEUS_PEDIDOS = [
  { id: 101, req: 'REQ-PED-7781', sol: 'Bruno Teixeira', setor: 'Diretoria', op: '00021', status: 'a-separar',  time: 'há 20 min',  itens: [{ nome: 'Cabo Flexível 2,5mm', sku: '5.20.0099', qtd: 60 }] },
  { id: 102, req: 'REQ-PED-7765', sol: 'Bruno Teixeira', setor: 'Diretoria', op: '00018', status: 'em-analise', time: 'há 2 horas', itens: [{ nome: 'Parafuso Sextavado M8', sku: '9.99.0238', qtd: 100 }, { nome: 'Arruela Lisa 8mm', sku: '7.40.0150', qtd: 100 }] },
  { id: 103, req: 'REQ-PED-7702', sol: 'Bruno Teixeira', setor: 'Diretoria', op: '00009', status: 'concluido',  time: 'ontem',      itens: [{ nome: 'Filamento PLA Azul 1kg', sku: '3.00.0101', qtd: 5 }] },
  { id: 104, req: 'REQ-PED-7688', sol: 'Bruno Teixeira', setor: 'Diretoria', op: '00004', status: 'concluido',  time: 'há 2 dias',  itens: [{ nome: 'Chapa Aço 1020 2mm', sku: '1.02.0044', qtd: 4 }] },
  { id: 105, req: 'REQ-PED-7650', sol: 'Bruno Teixeira', setor: 'Diretoria', op: '00001', status: 'recusado',   time: 'há 3 dias',  itens: [{ nome: 'Tinta Epóxi Cinza 3,6L', sku: '6.30.0012', qtd: 2 }] },
];
const SOL_STATUS = {
  'em-analise': { label: 'Em Análise', kind: 'amber', icon: 'clipboard', title: 'Aguardando Análise', sub: 'A sua solicitação foi recebida e será analisada em breve.', step: 0 },
  'a-separar':  { label: 'A Separar', kind: 'blue', icon: 'box', title: 'Em Separação', sub: 'O almoxarifado aprovou e está separando/conferindo os materiais.', step: 1 },
  'em-transito':{ label: 'Em Trânsito', kind: 'blue', icon: 'truck', title: 'Em Trânsito', sub: 'Materiais conferidos (bipados) e enviados ao setor. Aguardando recebimento.', step: 2 },
  'concluido':  { label: 'Concluído', kind: 'green', icon: 'check', title: 'Pedido Concluído', sub: 'Materiais recebidos e conferidos pelo setor de destino.', step: 3 },
  'recusado':   { label: 'Recusado', kind: 'red', icon: 'x', title: 'Solicitação Recusada', sub: 'Esta solicitação foi recusada pelo almoxarifado.', step: 0 },
};
const SOL_HEAD = { amber: ['#7a4e16', '#b9772a'], blue: ['#16266b', '#2563eb'], green: ['#0b5e3f', '#10b981'], red: ['#7a1f1f', '#ef4444'] };
const SOL_TIMELINE = [
  { t: 'Pedido recebido', d: 'A sua solicitação foi registrada com sucesso.', when: '15 jun · 15:03' },
  { t: 'Em preparação', d: 'O almoxarifado aprovou e está separando os materiais.' },
  { t: 'Entregue', d: 'Materiais finalizados e entregues ao setor.' },
];
const STEP_DEFS = [
  { t: 'Solicitação recebida', icon: 'clipboard', d: 'A solicitação foi registrada com sucesso.' },
  { t: 'Aprovada pelo almoxarife', icon: 'check', d: 'O almoxarifado aprovou e iniciou a separação.' },
  { t: 'Conferida & enviada', icon: 'truck', d: 'Itens bipados na Conferência de Envio e despachados ao setor.' },
  { t: 'Recebida pelo setor', icon: 'mapPin', d: 'O setor de destino conferiu e registrou o recebimento.' },
];
const STEP_STATES = {
  'em-analise':  ['done', 'current', 'future', 'future'],
  'a-separar':   ['done', 'done', 'current', 'future'],
  'em-transito': ['done', 'done', 'done', 'current'],
  'concluido':   ['done', 'done', 'done', 'done'],
};
function stepWhen(s, i) {
  if (i === 0) return (s.time && s.time.indexOf('·') >= 0) ? s.time : (s.criadoEm || '');
  if (i === 1) return s.aprovacao && s.aprovacao.em;
  if (i === 2) return s.envio && s.envio.em;
  if (i === 3) return s.recebimento && s.recebimento.em;
  return '';
}

function PageEntradaNova({ t: tBase, theme, variant = 'nova' }) {
  const reuse = variant === 'reaproveitamento';
  const saida = variant === 'saida';
  const isNF = !reuse && !saida;
  const t = saida ? frTokens(theme, '#ef4444', '#f87171') : reuse ? frTokens(theme, '#f59e0b', '#fbbf24') : tBase;
  const accentKind = saida ? 'red' : reuse ? 'amber' : 'blue';
  const L = saida
    ? { title: 'Saída de Material', sub: 'Aponte a OP, escolha o armazém de destino e lance os materiais que saem do estoque.', confirmar: 'Confirmar saída', confirmado: 'Saída confirmada!', revisar: 'Revisar saída', revSub: 'Confira a OP, o destino e os itens antes de dar baixa no estoque.' }
    : reuse
    ? { title: 'Entrada por Reaproveitamento', sub: 'Dê entrada em massa de material reaproveitado importando uma planilha com as colunas SKU e Quantidade.', confirmar: 'Confirmar entrada', confirmado: 'Entrada confirmada!', revisar: 'Revisar entrada', revSub: 'Confira os materiais antes de confirmar no estoque.' }
    : { title: 'Entrada de Mercadoria Nova', sub: 'Informe a NF, lance os itens e as quantidades. Ao confirmar, dá entrada no estoque e imprime as etiquetas com código de barras.', confirmar: 'Confirmar entrada', confirmado: 'Entrada feita · etiquetas enviadas!', revisar: 'Revisar entrada', revSub: 'Confira os materiais antes de confirmar no estoque.' };
  const [op, setOp] = useStateA('');
  const [nf, setNf] = useStateA('');
  const [armazem, setArmazem] = useStateA(ARMAZENS[0]);
  const [setor, setSetor] = useStateA('');   // Setor de destino da SAÍDA (enum VALID_SECTORS do backend); '' obriga escolha explícita
  const [rows, setRows] = useStateA([{ sku: '', qtd: '', etiq: '', etiqT: false }, { sku: '', qtd: '', etiq: '', etiqT: false }, { sku: '', qtd: '', etiq: '', etiqT: false }]);
  const [drag, setDrag] = useStateA(false);
  const [done, setDone] = useStateA(false);
  // ≥980px: formulário + dropzone à esquerda (sticky) e itens à direita; abaixo disso empilha (mobile).
  const { w: vpw } = (window.useFRViewport ? window.useFRViewport() : { w: 1200 });
  const wide = vpw >= 980;
  // Catálogo REAL (GET /products adaptado) — mesmo hook/pattern do pedidos.jsx. Substitui o mock MATERIAIS.
  const { items: frProdutos, loading: catLoading, error: catError } = window.useFRProducts();
  const prodBySku = (sku) => frProdutos.find((p) => p.sku === sku);
  const filled = rows.filter((r) => r.sku.trim());
  const totalUn = filled.reduce((s, r) => s + (parseInt(r.qtd) || 0), 0);
  const totalEtiq = filled.reduce((s, r) => s + (parseInt(r.etiq != null && r.etiq !== '' ? r.etiq : r.qtd) || 0), 0);
  const update = (i, k, v) => { setRows((rs) => rs.map((r, j) => {
    if (j !== i) return r;
    if (k === 'qtd') return { ...r, qtd: v, etiq: r.etiqT ? r.etiq : v };   // etiquetas acompanham a quantidade até serem editadas
    if (k === 'etiq') return { ...r, etiq: v, etiqT: true };
    return { ...r, [k]: v };
  })); setDone(false); };
  const addRow = () => setRows((rs) => [...rs, { sku: '', qtd: '', etiq: '', etiqT: false }]);
  const removeRow = (i) => setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : rs));
  // importSample (mock que preenchia rows com SKUs fixos) REMOVIDO — a dropzone agora importa .xlsx real
  // via handleImportXlsx (casa código→product_id no catálogo). Ver dropzone abaixo.
  const [q, setQ] = useStateA('');
  const [review, setReview] = useStateA(false);
  const [idemKey, setIdemKey] = useStateA(null);              // âncora X-Idempotency-Key do reuse (gerada ao ABRIR o modal)
  const genKey = () => (crypto.randomUUID?.() ?? `r-${Date.now()}-${Math.random().toString(16).slice(2)}`); // fallback p/ contexto não-seguro (http://IP-LAN)
  const [enviando, setEnviando] = useStateA(false);   // anti duplo-clique no POST /stock/entries
  const [envErro, setEnvErro] = useStateA(null);      // erro do envio (inclui "Esta NF-e já foi cadastrada")
  // Toast de erro some sozinho em ~4s. cleanup evita timer duplicado se der 2 erros seguidos.
  React.useEffect(() => {
    if (!envErro) return;
    const id = setTimeout(() => setEnvErro(null), 4000);
    return () => clearTimeout(id);
  }, [envErro]);
  const [okMsg, setOkMsg] = useStateA(null);          // toast VERDE de sucesso (resultado do import de planilha)
  React.useEffect(() => {
    if (!okMsg) return;
    const id = setTimeout(() => setOkMsg(null), 4000);
    return () => clearTimeout(id);
  }, [okMsg]);
  const fileRef = React.useRef(null);                 // input .xlsx escondido, disparado pela dropzone
  // Nome da row: prioriza o que a busca gravou (r.nome); fallback por SKU no catálogo real (SKU digitado à mão).
  const rowName = (r) => r.nome || (prodBySku(r.sku) || {}).nome;
  // product_id REAL da row: da busca (r.product_id) ou resolvido pelo SKU no catálogo (SKU digitado válido).
  const resolvePid = (r) => r.product_id || (prodBySku(r.sku) || {}).product_id;
  const ql = q.trim().toLowerCase();
  const filtered = q.trim() ? frProdutos.filter((p) => (p.nome || '').toLowerCase().includes(ql) || (p.sku || '').includes(q.trim())) : [];
  const addMaterial = (p) => {
    setRows((rs) => {
      if (rs.some((r) => r.product_id && r.product_id === p.product_id)) return rs;   // dedup por product_id
      const idx = rs.findIndex((r) => !r.sku?.trim());
      const novaRow = { product_id: p.product_id, sku: p.sku, nome: p.nome, un: p.un, qtd: '', etiq: '', etiqT: false };
      if (idx >= 0) return rs.map((r, j) => (j === idx ? { ...r, ...novaRow } : r));
      return [...rs, novaRow];
    });
    setQ(''); setDone(false);
  };
  // POST /stock/entries -> só imprime (ZPL, via Conferência) se der 201. Ordem: entrada → sucesso → imprime.
  const handleEntradaImprimir = async () => {
    if (enviando) return;                              // anti duplo-clique (Btn não tem prop `disabled`)
    setEnvErro(null);
    if (!nf.trim()) { setEnvErro('Informe o número da NF.'); return; }
    if (!filled.length) { setEnvErro('Adicione ao menos um item.'); return; }
    const invalidRows = filled.filter((r) => !resolvePid(r));
    if (invalidRows.length) { setEnvErro('Há itens sem produto válido (SKU não encontrado). Remova ou corrija antes de dar entrada.'); return; }
    const qtdRuim = filled.filter((r) => !(Number(r.qtd) > 0));
    if (qtdRuim.length) { setEnvErro('Todos os itens precisam de quantidade maior que zero.'); return; }
    setEnviando(true);
    try {
      // 1. ENTRADA (backend) — agrega por produto, grava nf_number, bloqueia NF duplicada (400).
      await window.FRApi.post('/stock/entries', {
        nf_number: nf.trim(),
        type: 'NFe',
        entries: filled.map((r) => ({ product_id: resolvePid(r), quantity: Number(r.qtd) })),
      });
      // 2. IMPRESSÃO (só após 201) — etiqueta de material ZPL, com NF real + data de hoje.
      const dataEntrada = new Date().toLocaleDateString('pt-BR');
      const itensEtiqueta = filled.map((r) => ({ sku: r.sku, nome: rowName(r), faltam: parseInt(r.etiq !== '' && r.etiq != null ? r.etiq : r.qtd) || 0 }));
      await window.cfPrintIdentificacao(itensEtiqueta, null, nf.trim(), dataEntrada);
      setDone(true);
    } catch (e) {
      // 400 do backend ("Esta NF-e já foi cadastrada." / "Número da NF é obrigatório..." / furo) → mostra, NÃO imprime.
      const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
      setEnvErro(gm ? gm(e) : (e && e.message ? e.message : 'Erro ao dar entrada.'));
    } finally {
      setEnviando(false);
    }
  };
  // Submit do REAPROVEITAMENTO (confirm do modal). Espelha handleEntradaImprimir, SEM NF.
  // Idempotência: reusa idemKey (gerada ao abrir o modal) no header X-Idempotency-Key.
  const handleReuseConfirmar = async () => {
    if (enviando) return;                              // mesmo guard anti duplo-clique
    setEnvErro(null);
    if (!filled.length) { setEnvErro('Adicione ao menos um item.'); return; }
    const invalidRows = filled.filter((r) => !resolvePid(r));
    if (invalidRows.length) { setEnvErro('Há itens sem produto válido (SKU não encontrado). Remova ou corrija antes de dar entrada.'); return; }
    const qtdRuim = filled.filter((r) => !(Number(r.qtd) > 0));
    if (qtdRuim.length) { setEnvErro('Todos os itens precisam de quantidade maior que zero.'); return; }
    setEnviando(true);
    try {
      // ENTRADA de reaproveitamento — SEM nf_number; header carrega a âncora de idempotência.
      await window.FRApi.post('/stock/entries', {
        type: 'REAPROVEITAMENTO',
        entries: filled.map((r) => ({ product_id: resolvePid(r), quantity: Number(r.qtd) })),
      }, { headers: { 'X-Idempotency-Key': idemKey } });
      // IMPRESSÃO (só após 201) — mesma regra de etiqueta da NF; banner REAPROVEITADO, sem NF.
      const dataEntrada = new Date().toLocaleDateString('pt-BR');
      const itensEtiqueta = filled.map((r) => ({ sku: r.sku, nome: rowName(r), faltam: parseInt(r.etiq !== '' && r.etiq != null ? r.etiq : r.qtd) || 0 }));
      await window.cfPrintIdentificacao(itensEtiqueta, null, null, dataEntrada, { reaproveitado: true });
      setDone(true);
      setReview(false);                                // só no SUCESSO fecha o modal
    } catch (e) {
      // NO ERRO: mantém o modal aberto e a MESMA idemKey (retry idempotente). Só mostra o erro.
      const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
      setEnvErro(gm ? gm(e) : (e && e.message ? e.message : 'Erro ao dar entrada.'));
    } finally {
      setEnviando(false);
    }
  };
  // Submit da SAÍDA (confirm do modal). Espelha handleReuseConfirmar: guard + valida itens/SKU/qtd,
  // e ADICIONA validação de SETOR (VALID_SECTORS) e OP CONDICIONAL (regra por tag do backend), então
  // POST /stock/manual-withdrawal com X-Idempotency-Key (âncora do idemKey gerado ao abrir o modal).
  // SAÍDA NÃO imprime ZPL (baixa de estoque, não recebimento).
  const handleSaidaConfirmar = async () => {
    if (enviando) return;                              // anti duplo-clique (guard igual ao reuse)
    setEnvErro(null);
    if (!filled.length) { setEnvErro('Adicione ao menos um item.'); return; }
    const invalidRows = filled.filter((r) => !resolvePid(r));
    if (invalidRows.length) { setEnvErro('Há itens sem produto válido (SKU não encontrado). Remova ou corrija antes de dar saída.'); return; }
    const qtdRuim = filled.filter((r) => !(Number(r.qtd) > 0));
    if (qtdRuim.length) { setEnvErro('Todos os itens precisam de quantidade maior que zero.'); return; }
    // Setor obrigatório e dentro do enum do backend (senão o POST toma 400 "Setor inválido").
    if (!setor || !SETORES_SAIDA.includes(setor)) { setEnvErro('Selecione um setor de destino válido.'); return; }
    // OP condicional — espelha a regra do backend: item cujo produto NÃO tem tag isenta
    // (camisetas/epi/ferramentas) exige OP. Itens sem produto já foram barrados acima, então
    // basta olhar as tags reais (frProdutos vem do GET /products, traz tags por produto).
    const exemptTags = ['camisetas', 'epi', 'ferramentas'];
    const requiresOp = filled.some((r) => {
      const p = frProdutos.find((x) => x.product_id === resolvePid(r));
      const tags = ((p && p.tags) || []).map((tg) => String(tg).toLowerCase());
      return !tags.some((tg) => exemptTags.includes(tg));   // não isento → exige OP
    });
    if (requiresOp && !op.trim()) { setEnvErro('Informe o número da OP: há itens não isentos que exigem OP.'); return; }
    setEnviando(true);
    try {
      // Baixa física real. op_code opcional (só vai se preenchido); o header carrega a âncora de
      // idempotência que o backend 1A honra (op_key ancorado no X-Idempotency-Key).
      await window.FRApi.post('/stock/manual-withdrawal', {
        sector: setor,
        op_code: op.trim() || undefined,
        items: filled.map((r) => ({ product_id: resolvePid(r), quantity: Number(r.qtd) })),
      }, { headers: { 'X-Idempotency-Key': idemKey } });
      setDone(true);
      setReview(false);                                // só no SUCESSO fecha o modal
    } catch (e) {
      // NO ERRO: mantém o modal aberto e a MESMA idemKey (retry idempotente). O backend devolve msg
      // clara (setor inválido / OP obrigatória / OP não encontrada / OP finalizada / furo de estoque).
      const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
      setEnvErro(gm ? gm(e) : (e && e.message ? e.message : 'Erro ao dar saída.'));
    } finally {
      setEnviando(false);
    }
  };
  // Importa planilha .xlsx (A=código, B=quantidade, C=qtd etiqueta). Casa código→product_id no catálogo real;
  // ADICIONA as linhas válidas às existentes (não substitui). Toast de resultado (X/Y/Z). Erro de parse → envErro.
  const handleImportXlsx = async (file) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) { setEnvErro('Não foi possível ler a planilha (sem abas).'); return; }
      const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }); // matriz; raw:false = tudo string
      if (!linhas.length) { setEnvErro('Planilha vazia.'); return; }
      // Cabeçalho: se a coluna B da 1ª linha NÃO é número → é cabeçalho, pula.
      const inicio = (linhas[0] && !Number.isFinite(Number(String(linhas[0][1]).replace(',', '.')))) ? 1 : 0;
      let importados = 0, naoEncontrados = 0, qtdInvalida = 0, repetidos = 0;
      const skusVistos = new Set();
      const novas = [];
      // normaliza SKU p/ forma canônica d.dd.dddd (tolera zero à esquerda / segmentos curtos); colapsado (sem os 2 pontos) → devolve cru, hit=false honesto:
      const normSku = (v) => {
        const s = String(v ?? '').trim();
        const m = s.match(/^0*(\d)\.0*(\d{1,2})\.0*(\d{1,4})$/);
        if (!m) return s;
        return `${m[1]}.${m[2].padStart(2, '0')}.${m[3].padStart(4, '0')}`;
      };
      // Map pré-normalizado — mata o find O(n)/linha e o mismatch de formatação de uma vez:
      const skuIndex = new Map((frProdutos || []).map((p) => [normSku(p.sku), p]));
      for (let i = inicio; i < linhas.length; i++) {
        const linha = linhas[i] || [];
        const codigo = String(linha[0] ?? '').trim();               // normaliza (Excel pode dar número/espaços)
        if (!codigo) continue;                                       // linha vazia
        const qtd = Number(String(linha[1] ?? '').replace(',', '.'));
        if (!Number.isFinite(qtd) || qtd <= 0) { qtdInvalida++; continue; }
        const prod = skuIndex.get(normSku(codigo));                  // casa código→produto (normalizado d.dd.dddd)
        if (!prod) { naoEncontrados++; continue; }                   // SKU não existe → ignora
        if (skusVistos.has(prod.product_id)) { repetidos++; continue; } // repetido na planilha (por produto) → mantém o 1º
        const jaNaLista = rows.some((r) => r.product_id === prod.product_id); // já na lista → não duplica
        if (jaNaLista) { repetidos++; continue; }
        skusVistos.add(prod.product_id);
        const etiqRaw = String(linha[2] ?? '').trim();               // coluna C; vazia/inválida → usa qtd (B)
        const etiq = etiqRaw && Number(etiqRaw) > 0 ? etiqRaw : String(qtd);
        novas.push({ product_id: prod.product_id, sku: prod.sku, nome: prod.nome, un: prod.un, qtd: String(qtd), etiq, etiqT: true });
        importados++;
      }
      setRows((rs) => { const preenchidas = rs.filter((r) => r.sku?.trim()); return [...preenchidas, ...novas]; });
      setDone(false);
      const partes = [`${importados} importado(s)`];
      if (naoEncontrados) partes.push(`${naoEncontrados} não encontrado(s)`);
      if (qtdInvalida) partes.push(`${qtdInvalida} qtd inválida`);
      if (repetidos) partes.push(`${repetidos} repetido(s)`);
      setOkMsg(partes.join(' · '));
    } catch (e) {
      setEnvErro('Não foi possível ler a planilha. Confirme que é um .xlsx válido.');
    }
  };
  // Gera e baixa o .xlsx modelo (cabeçalho A/B/C idêntico ao que o handleImportXlsx lê) com 2 SKUs reais de exemplo.
  const baixarModelo = () => {
    const exemplos = (frProdutos || []).slice(0, 2);
    const ex1 = exemplos[0]?.sku || '3.08.0114';
    const ex2 = exemplos[1]?.sku || '5.20.0099';
    const dados = [
      ['Código', 'Quantidade', 'Qtd Etiqueta'],   // cabeçalho
      [ex1, 10, 10],                                // exemplo 1 (SKU real)
      [ex2, 25, 5],                                 // exemplo 2 (qtd etiqueta ≠ quantidade)
    ];
    const ws = XLSX.utils.aoa_to_sheet(dados);
    // Blindagem anti-colapso: força cada Código (coluna A das linhas de dados) como TEXTO explícito
    // — t:'s' (string) + z:'@' (número-formato texto) — pra Excel/Sheets NÃO reinterpretar o SKU como número/data.
    [ex1, ex2].forEach((sku, i) => {
      const addr = XLSX.utils.encode_cell({ c: 0, r: i + 1 }); // A2, A3 (header é r=0)
      ws[addr] = { t: 's', v: String(sku), z: '@' };
    });
    ws['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entrada');
    XLSX.writeFile(wb, 'modelo-entrada-nf.xlsx');   // dispara o download no browser
  };
  const inp = { boxSizing: 'border-box', height: 40, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 };

  return (
    <div style={{ width: '100%' }}>
      <PageHeader t={t} title={L.title} subtitle={L.sub}
        actions={<Btn t={t} icon="download" kind="ghost" onClick={baixarModelo}>Baixar modelo</Btn>} />

      <div style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(320px, 400px) 1fr' : '1fr', gap: 20, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: wide ? 'sticky' : 'static', top: 0 }}>
      {saida && (
        <Card t={t} style={{ padding: 18, margin: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div>
              <label style={lab}>Ordem de Produção (OP)</label>
              <input value={op} onChange={(e) => setOp(e.target.value)} placeholder="Ex: 12010" style={inp} />
            </div>
            <div>
              <label style={lab}>Setor de destino</label>
              <div style={{ position: 'relative' }}>
                <select value={setor} onChange={(e) => setSetor(e.target.value)} style={{ ...inp, appearance: 'none', WebkitAppearance: 'none', paddingRight: 34, cursor: 'pointer', color: setor ? t.text : t.muted }}>
                  <option value="" disabled>Selecione o setor…</option>
                  {SETORES_SAIDA.map((s) => <option key={s} value={s} style={{ color: t.text }}>{s}</option>)}
                </select>
                <Icon name="chevronDown" size={16} style={{ position: 'absolute', right: 12, top: 12, color: t.muted, pointerEvents: 'none' }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {isNF && (
        <Card t={t} style={{ padding: 18, margin: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div>
              <label style={lab}>Nota Fiscal (NF)</label>
              <input value={nf} onChange={(e) => setNf(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="Número da NF (ex.: 004471)" inputMode="numeric" style={inp} />
            </div>
            <div>
              <label style={lab}>Armazém de entrada</label>
              <div style={{ position: 'relative' }}>
                <select value={armazem} onChange={(e) => setArmazem(e.target.value)} style={{ ...inp, appearance: 'none', WebkitAppearance: 'none', paddingRight: 34, cursor: 'pointer' }}>
                  {ARMAZENS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <Icon name="chevronDown" size={16} style={{ position: 'absolute', right: 12, top: 12, color: t.muted, pointerEvents: 'none' }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {reuse && (
        <div style={{ display: 'flex', flexDirection: wide ? 'column' : 'row', alignItems: wide ? 'flex-start' : 'center', gap: wide ? 11 : 15, padding: '15px 20px', borderRadius: 16, margin: 0,
          background: uiTone(t, 'amber').bg, border: `1px solid ${frHexToRgba('#f59e0b', 0.32)}` }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: frHexToRgba('#f59e0b', 0.22), color: uiTone(t, 'amber').fg, flexShrink: 0 }}>
            <Icon name="refresh" size={22} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Material Reaproveitado</div>
            <div style={{ fontSize: 12.5, color: t.muted, marginTop: 4, lineHeight: 1.4 }}>Itens que voltaram ao estoque. É mercadoria nova? Use <b style={{ color: t.text }}>Entradas › Por NF-e</b>.</div>
          </div>
          <Badge t={t} kind="amber">RETORNO DE OP / PROJETO</Badge>
        </div>
      )}
      <input ref={fileRef} type="file" accept=".xlsx" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) handleImportXlsx(f); e.target.value = ''; }} />
      <div onClick={() => fileRef.current && fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) handleImportXlsx(f); }}
        style={{ cursor: 'pointer', borderRadius: 18, padding: '34px 24px', textAlign: 'center',
          border: `2px dashed ${drag ? t.accent : t.borderStrong}`, background: drag ? t.accentSoft : t.panel, transition: 'all .15s' }}>
        <div style={{ width: 60, height: 60, margin: '0 auto 16px', borderRadius: 16, display: 'grid', placeItems: 'center', background: t.accentSoft, color: t.accentText }}>
          <Icon name={saida ? 'out' : reuse ? 'refresh' : 'sheet'} size={28} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Arraste a planilha (.xlsx) ou clique para importar</div>
        <div style={{ fontSize: 13, color: t.muted, marginTop: 6 }}>Apenas duas colunas obrigatórias:</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
          <Badge t={t} kind="accent">SKU</Badge><Badge t={t} kind={accentKind}>Quantidade</Badge>
        </div>
      </div>
      </div>

      <div>
      {!wide && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '4px 0 20px' }}>
        <div style={{ flex: 1, height: 1, background: t.border }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: t.faint }}>ou adicione manualmente</span>
        <div style={{ flex: 1, height: 1, background: t.border }} />
      </div>
      )}
      {wide && <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', margin: '0 0 12px 2px' }}>Itens da entrada</div>}

      <Card t={t} style={{ padding: 8 }}>
        <div style={{ position: 'relative', padding: '6px 6px 8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 14px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
            <Icon name="search" size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar material no estoque por nome ou SKU…"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
          </label>
          {q.trim() && (
            <div style={{ position: 'absolute', zIndex: 30, top: '100%', left: 6, right: 6, marginTop: 4, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6, maxHeight: 280, overflowY: 'auto' }} className="fr-scroll">
              {catLoading ? (
                <div style={{ padding: '12px 12px', fontSize: 12.5, color: t.muted }}>Carregando produtos…</div>
              ) : catError ? (
                <div style={{ padding: '12px 12px', fontSize: 12.5, color: uiTone(t, 'red').fg }}>{catError}</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '12px 12px', fontSize: 12.5, color: t.muted }}>Nenhum produto encontrado.</div>
              ) : filtered.map((m) => {
                const added = rows.some((r) => r.product_id === m.product_id);
                return (
                  <button key={m.product_id || m.sku} disabled={added} onClick={() => addMaterial(m)} style={{
                    all: 'unset', boxSizing: 'border-box', cursor: added ? 'default' : 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 10px', borderRadius: 9, opacity: added ? 0.55 : 1 }}
                    onMouseEnter={(e) => { if (!added) e.currentTarget.style.background = t.hover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={16} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{m.nome}</div>
                      <div style={{ fontSize: 11.5, color: t.muted }}>SKU {m.sku} · {m.disp} disp.</div>
                    </div>
                    {added ? <Badge t={t} kind="green" dot>Na lista</Badge>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: t.accentText }}><Icon name="plus" size={15} /> Adicionar</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isNF ? '1fr 120px 120px 44px' : '1fr 160px 44px', gap: 10, padding: '10px 12px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase' }}>
          <div>SKU</div><div style={{ textAlign: 'center' }}>Quantidade</div>{isNF && <div style={{ textAlign: 'center' }}>Etiquetas</div>}<div></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 12px 8px' }}>
          {rows.map((r, i) => {
            const nm = rowName(r);
            const notFound = !catLoading && !catError && r.sku.trim() && !nm;   // SKU digitado que não casa com produto real
            return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: isNF ? '1fr 120px 120px 44px' : '1fr 160px 44px', gap: 10, alignItems: 'center' }}>
              <div>
                {nm && <div style={{ fontSize: 13, fontWeight: 700, color: t.text, margin: '0 2px 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm}</div>}
                <input value={r.sku} onChange={(e) => update(i, 'sku', e.target.value)} placeholder="9.99.0000" style={{ ...inp, ...(notFound ? { borderColor: '#ef4444' } : null) }} />
                {notFound && <div style={{ fontSize: 10.5, fontWeight: 700, color: uiTone(t, 'red').fg, margin: '5px 2px 0' }}>Produto não encontrado no estoque</div>}
              </div>
              <input value={r.qtd} onChange={(e) => update(i, 'qtd', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" inputMode="numeric" style={{ ...inp, textAlign: 'center', alignSelf: 'end' }} />
              {isNF && <input value={r.etiq != null && r.etiq !== '' ? r.etiq : (r.etiqT ? '' : r.qtd)} onChange={(e) => update(i, 'etiq', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" inputMode="numeric" title="Quantidade de etiquetas a imprimir" style={{ ...inp, textAlign: 'center', alignSelf: 'end', borderColor: t.accent, color: t.accentText, fontWeight: 800 }} />}
              <button onClick={() => removeRow(i)} title="Remover" style={{ all: 'unset', cursor: 'pointer', width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center', color: t.muted, alignSelf: 'end' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}>
                <Icon name="trash" size={17} />
              </button>
            </div>
            );
          })}
        </div>
        <button onClick={addRow} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, margin: '4px 12px 12px', padding: '9px 12px', borderRadius: 10, color: t.accentText, fontSize: 13, fontWeight: 700 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = t.accentSoft; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
          <Icon name="plus" size={16} /> Adicionar linha
        </button>
      </Card>
      </div>
      </div>

      <div style={{ position: 'sticky', bottom: 0, marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '14px 18px', borderRadius: 14, background: t.panel, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div><div style={{ fontSize: 10.5, fontWeight: 700, color: t.faint, letterSpacing: '.06em' }}>ITENS</div><div style={{ fontSize: 20, fontWeight: 850, color: t.text }}>{filled.length}</div></div>
          <div style={{ width: 1, height: 30, background: t.border }} />
          <div><div style={{ fontSize: 10.5, fontWeight: 700, color: t.faint, letterSpacing: '.06em' }}>UNIDADES</div><div style={{ fontSize: 20, fontWeight: 850, color: t.accentText }}>{totalUn}</div></div>
          {isNF && <><div style={{ width: 1, height: 30, background: t.border }} />
          <div><div style={{ fontSize: 10.5, fontWeight: 700, color: t.faint, letterSpacing: '.06em' }}>ETIQUETAS</div><div style={{ fontSize: 20, fontWeight: 850, color: t.accentText }}>{totalEtiq}</div></div></>}
        </div>
        {done
          ? <Badge t={t} kind="green" dot>{L.confirmado}</Badge>
          : isNF
            ? <Btn t={t} icon="barcode" onClick={handleEntradaImprimir}>{enviando ? 'Dando entrada…' : 'Entrada / Imprimir'}</Btn>
            : <Btn t={t} icon="eye" onClick={() => { if (filled.length) { setIdemKey(genKey()); setReview(true); } }}>Revisar e Confirmar</Btn>}
      </div>

      {envErro && (
        <div style={{ position: 'fixed', top: 84, right: 24, zIndex: 30, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderRadius: 13, maxWidth: 'min(380px,90vw)', background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, fontWeight: 700, fontSize: 13.5, boxShadow: '0 10px 30px rgba(0,0,0,.3)' }}>
          <Icon name="alert" size={18} />
          <span style={{ flex: 1 }}>{envErro}</span>
        </div>
      )}

      {okMsg && (
        <div style={{ position: 'fixed', top: envErro ? 144 : 84, right: 24, zIndex: 30, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderRadius: 13, maxWidth: 'min(380px,90vw)', background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 10px 30px rgba(0,0,0,.3)' }}>
          <Icon name="check" size={18} />
          <span style={{ flex: 1 }}>{okMsg}</span>
        </div>
      )}

      {review && (
        <div onClick={() => setReview(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(10,12,20,.55)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(720px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="clipboard" size={20} /></span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{L.revisar}</div>
                <div style={{ fontSize: 12.5, color: t.muted, marginTop: 2 }}>{L.revSub}</div>
              </div>
            </div>
            {saida && (
              <div style={{ display: 'flex', gap: 24, padding: '12px 22px', borderBottom: `1px solid ${t.border}`, background: t.elevated, flexWrap: 'wrap' }}>
                <div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>OP</div><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, marginTop: 2 }}>{op || '—'}</div></div>
                <div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>SETOR</div><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, marginTop: 2 }}>{setor || '—'}</div></div>
              </div>
            )}
            <div className="fr-scroll" style={{ overflowY: 'auto', padding: '8px 14px', flex: 1 }}>
              {filled.map((r, i) => {
                const nm = rowName(r);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 8px', borderBottom: i === filled.length - 1 ? 'none' : `1px solid ${t.border}` }}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={16} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{nm || 'Material avulso'}</div>
                      <div style={{ fontSize: 11.5, color: t.muted }}>SKU {r.sku}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{r.qtd || 0} <span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>un</span></div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '16px 22px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: t.muted }}><b style={{ color: t.text }}>{filled.length}</b> itens · <b style={{ color: t.text }}>{totalUn}</b> unidades</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn t={t} kind="ghost" onClick={() => setReview(false)}>Voltar</Btn>
                {/* Feedback visual de envio SÓ no ramo da saída (reuse/NF inalterados). Btn não tem prop
                    disabled → o wrapper aplica opacity + pointer-events enquanto envia; o guard
                    if(enviando) return no handleSaidaConfirmar continua sendo a proteção REAL. */}
                <span style={saida && enviando ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>
                  <Btn t={t} icon="check" onClick={reuse ? handleReuseConfirmar : saida ? handleSaidaConfirmar : () => { setDone(true); setReview(false); }}>{saida && enviando ? 'Dando saída…' : L.confirmar}</Btn>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageEntradas({ t }) {
  const rows = [
    { nf: '004471', forn: 'Aço Brasil Ltda',      data: '14/06', itens: 8,  valor: 'R$ 12.400,00', st: ['Conferido', 'green'] },
    { nf: '004468', forn: 'Parafusos União',       data: '13/06', itens: 24, valor: 'R$ 3.180,00',  st: ['Conferido', 'green'] },
    { nf: '004465', forn: 'Polímeros 3D Print',    data: '12/06', itens: 6,  valor: 'R$ 1.890,00',  st: ['Pendente', 'amber'] },
    { nf: '004460', forn: 'Tintas Premium SA',     data: '10/06', itens: 3,  valor: 'R$ 2.520,00',  st: ['Conferido', 'green'] },
    { nf: '004455', forn: 'Elétrica Total',        data: '09/06', itens: 15, valor: 'R$ 4.760,00',  st: ['Divergência', 'red'] },
  ];
  const cols = [
    { key: 'nf', label: 'NF-e', render: (r) => <span style={{ fontWeight: 700 }}>#{r.nf}</span> },
    { key: 'forn', label: 'Fornecedor' },
    { key: 'data', label: 'Data', align: 'center' },
    { key: 'itens', label: 'Itens', align: 'center' },
    { key: 'valor', label: 'Valor', align: 'right', render: (r) => <span style={{ fontWeight: 700 }}>{r.valor}</span> },
    { key: 'st', label: 'Status', align: 'center', render: (r) => <Badge t={t} kind={r.st[1]} dot>{r.st[0]}</Badge> },
  ];
  return (
    <div>
      <PageHeader t={t} title="Entradas de Material" subtitle="Notas fiscais e reaproveitamentos recebidos."
        actions={<><Btn t={t} icon="file" kind="ghost">Por NF-e</Btn><Btn t={t} icon="plus">Nova entrada</Btn></>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="download" label="Entradas no mês" value="38" kind="accent" />
        <KPI t={t} mini icon="barChart" label="Valor recebido" value="R$ 86,2k" kind="green" />
        <KPI t={t} mini icon="file" label="NF-es" value="31" kind="blue" />
        <KPI t={t} mini icon="alert" label="Pendências" value="2" kind="amber" />
      </div>
      <DataTable t={t} columns={cols} rows={rows} />
    </div>
  );
}

function PageSaidas({ t }) {
  const rows = [
    { sol: 'Carlos M.',  setor: 'Usinagem',   item: 'Parafuso M8',        qtd: '-40 un',  data: '14/06', st: ['Aprovado', 'green'] },
    { sol: 'Ana P.',     setor: 'Montagem',   item: 'Rolamento 6204ZZ',   qtd: '-6 un',   data: '14/06', st: ['Aprovado', 'green'] },
    { sol: 'Rafael S.',  setor: 'Produção 3D', item: 'Filamento PLA Azul', qtd: '-2 un',   data: '13/06', st: ['Pendente', 'amber'] },
    { sol: 'Bruno T.',   setor: 'Elétrica',   item: 'Cabo Flexível 2,5',  qtd: '-50 m',   data: '12/06', st: ['Aprovado', 'green'] },
    { sol: 'Júlia R.',   setor: 'Acabamento', item: 'Tinta Epóxi Cinza',  qtd: '-1 lt',   data: '11/06', st: ['Negado', 'red'] },
  ];
  const cols = [
    { key: 'sol', label: 'Solicitante', render: (r) => <span style={{ fontWeight: 700 }}>{r.sol}</span> },
    { key: 'setor', label: 'Setor', render: (r) => <Badge t={t} kind="gray">{r.setor}</Badge> },
    { key: 'item', label: 'Item' },
    { key: 'qtd', label: 'Qtd.', align: 'center', render: (r) => <span style={{ fontWeight: 700, color: uiTone(t, 'red').fg }}>{r.qtd}</span> },
    { key: 'data', label: 'Data', align: 'center' },
    { key: 'st', label: 'Status', align: 'center', render: (r) => <Badge t={t} kind={r.st[1]} dot>{r.st[0]}</Badge> },
  ];
  return (
    <div>
      <PageHeader t={t} title="Saídas de Material" subtitle="Retiradas e baixas por setor."
        actions={<Btn t={t} icon="out">Registrar saída</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="out" label="Saídas no mês" value="129" kind="accent" />
        <KPI t={t} mini icon="users" label="Setores ativos" value="6" kind="blue" />
        <KPI t={t} mini icon="alert" label="Aguardando" value="4" kind="amber" />
        <KPI t={t} mini icon="barChart" label="Custo total" value="R$ 21,4k" kind="green" />
      </div>
      <DataTable t={t} columns={cols} rows={rows} />
    </div>
  );
}

// ---------- Usuários (Gestão de Equipe) ----------
// LIGAÇÃO REAL ao backend — o mock inteiro morreu (USUARIOS_SEED, CARGO_GROUPS e o "Ver senha",
// que era impossível de ligar: o backend só guarda hash bcrypt, senha em claro não existe).
//   GET    /users                    → lista CHEIA (id/nome/email/is_active/cargo/setor/métricas).
//                                      A tela é gateada por 'usuarios' — exatamente o critério que
//                                      libera o payload cheio no backend; os dois andam juntos.
//   PUT    /users/:id/status         → suspender/reativar. AÇÃO PRIMÁRIA do card (com confirm):
//                                      é o caminho honesto pra bloquear acesso preservando histórico.
//   DELETE /users/:id                → excluir, ação SECUNDÁRIA no menu. 409 = tem histórico →
//                                      modal honesto oferece suspender no lugar (dispara o PUT).
//   PUT    /users/:id/role           → troca de cargo (confirm: desloga o alvo na hora — o token
//                                      dele carrega o cargo velho).
//   POST   /auth/register            → Novo Colaborador (senha inicial DIGITADA ≥6 + confirmação;
//                                      sem troca forçada no 1º login — dívida registrada no back).
//   POST   /users/:id/reset-password → Redefinir senha (modal; 404 do id fantasma → erro no Card).
//   GET    /admin/permissions/roles  → papéis REAIS atribuíveis (mesma fonte da tela Permissões).
//                                      A rota é gateada por 'permissoes' — hoje quem vê esta tela
//                                      também a tem; se divergir, o dropdown avisa em vez de quebrar.
// Busca LOCAL de propósito: GET /users não pagina (15 contas hoje) — filtrar em memória basta e
// evita inventar contrato de paginação/busca no backend só pra isto.
// Online DERIVADO: last_active há menos de 10min (heartbeat real bate a cada 5min — 2 batidas de
// folga). Tempo útil = total_minutes formatado. Nada disso existe como flag no backend.

const USR_ONLINE_MS = 10 * 60 * 1000;
function usrErr(e) { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; }
function usrTempo(min) {
  const m = Math.max(0, Math.round(Number(min) || 0));
  if (m < 60) return m + 'min';
  const h = Math.floor(m / 60);
  return m % 60 ? h + 'h ' + (m % 60) + 'min' : h + 'h';
}
function usrRelativo(iso) {
  if (!iso) return 'nunca entrou';
  const ms = Date.now() - new Date(iso).getTime();
  if (!isFinite(ms)) return '—';
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return 'há ' + min + ' min';
  const h = Math.floor(min / 60);
  if (h < 24) return 'há ' + h + ' h';
  const d = Math.floor(h / 24);
  return d === 1 ? 'ontem' : 'há ' + d + ' dias';
}
function usrOnline(u) { return u.is_active !== false && !!u.last_active && (Date.now() - new Date(u.last_active).getTime()) < USR_ONLINE_MS; }
function usrIniciais(nome) { return String(nome || '?').split(' ').map((x) => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase(); }

// Gate por permissão, padrão da Auditoria/Permissões: sem a page_key 'usuarios' a tela interna
// NEM MONTA (nenhuma chamada de rede). O backend espelha: sem 'usuarios' o GET vem magro e as
// ações devolvem 403 — a UI só não deixa chegar lá.
function PageUsuarios({ t }) {
  const A = window.FRAuth;
  if (!A || typeof A.canAccess !== 'function' || !A.canAccess('usuarios')) {
    return (
      <div>
        <PageHeader t={t} title="Gestão de Equipe" subtitle="Contas, acessos e atividade dos colaboradores." />
        <Card t={t} style={{ padding: 40, textAlign: 'center' }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'inline-grid', placeItems: 'center', marginBottom: 14 }}><Icon name="lock" size={24} /></span>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700 }}>
            Acesso bloqueado. Não possui o nível de permissão necessário (usuarios) para gerir a equipe.
          </div>
        </Card>
      </div>
    );
  }
  return <PageUsuariosReal t={t} />;
}

function PageUsuariosReal({ t }) {
  const meuId = (window.FRAuth.user && window.FRAuth.user.id) || null;
  const roleLabel = (window.FRAccess && window.FRAccess.roleLabel) || function (r) { return r; };

  const [usuarios, setUsuarios] = useStateA([]);
  const [papeis, setPapeis] = useStateA([]);           // chaves reais (GET /admin/permissions/roles)
  const [papeisErro, setPapeisErro] = useStateA(null);
  const [loading, setLoading] = useStateA(true);
  const [error, setError] = useStateA(null);
  const [q, setQ] = useStateA('');
  const [menuId, setMenuId] = useStateA(null);
  const [cargoId, setCargoId] = useStateA(null);
  const [confirmando, setConfirmando] = useStateA(null); // { tipo:'suspender'|'reativar'|'excluir'|'cargo', user, cargo? }
  const [modal409, setModal409] = useStateA(null);       // { user }
  const [novo, setNovo] = useStateA(null);               // { email, nome, cargo, setor, senha, senha2, erro }
  const [reset, setReset] = useStateA(null);             // { user, senha, senha2, erro }
  const [agindo, setAgindo] = useStateA(false);
  const [toast, setToast] = useStateA(null);             // { msg, kind:'ok'|'erro' }
  const flash = (msg, kind) => { setToast({ msg, kind: kind || 'ok' }); setTimeout(() => setToast(null), 2600); };

  const carregar = React.useCallback(function (inicial) {
    if (inicial) setLoading(true);
    setError(null);
    return Promise.all([
      window.FRApi.get('/users', { skipLoading: true }),
      // Papéis em chamada tolerante: alimentam recursos secundários (trocar cargo / criar conta);
      // se falhar (403 de quem não tem 'permissoes'), a LISTA continua de pé e o dropdown avisa.
      window.FRApi.get('/admin/permissions/roles', { skipLoading: true }).catch(function (e) { return { __erro: usrErr(e) }; }),
    ]).then(function (rs) {
      setUsuarios(Array.isArray(rs[0].data) ? rs[0].data : []);
      if (rs[1].__erro) { setPapeis([]); setPapeisErro(rs[1].__erro); }
      else { setPapeis(Object.keys(rs[1].data || {}).sort()); setPapeisErro(null); }
      if (inicial) setLoading(false);
    }).catch(function (e) { setError(usrErr(e)); if (inicial) setLoading(false); });
  }, []);
  React.useEffect(function () { carregar(true); }, [carregar]);

  // ── Ações reais (todas recarregam do servidor — a lista é a verdade autoritativa) ──
  const mudarStatus = function (u, ativo) {
    setAgindo(true);
    window.FRApi.put('/users/' + u.id + '/status', { is_active: ativo })
      .then(function () { return carregar(false); })
      .then(function () { flash(ativo ? 'Acesso reativado.' : 'Acesso suspenso — o usuário foi deslogado.'); })
      .catch(function (e) { flash(usrErr(e), 'erro'); })
      .then(function () { setAgindo(false); setConfirmando(null); setModal409(null); });
  };
  const excluir = function (u) {
    setAgindo(true);
    window.FRApi.delete('/users/' + u.id)
      .then(function () { return carregar(false); })
      .then(function () { flash('Conta excluída.'); })
      .catch(function (e) {
        // O interceptor do api.js normaliza o erro pra { status, message, raw } — sem .response.
        if (e && e.status === 409) { setModal409({ user: u }); }
        else { flash(usrErr(e), 'erro'); }
      })
      .then(function () { setAgindo(false); setConfirmando(null); });
  };
  const trocarCargo = function (u, cargo) {
    setAgindo(true);
    window.FRApi.put('/users/' + u.id + '/role', { role: cargo })
      .then(function () { return carregar(false); })
      .then(function () { flash('Cargo atualizado — o usuário foi deslogado.'); })
      .catch(function (e) { flash(usrErr(e), 'erro'); })
      .then(function () { setAgindo(false); setConfirmando(null); });
  };
  const criar = function () {
    const n = novo || {};
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(n.email || '').trim());
    if (!emailOk) return setNovo({ ...n, erro: 'E-mail inválido.' });
    if (!String(n.nome || '').trim()) return setNovo({ ...n, erro: 'Nome é obrigatório.' });
    if (!n.cargo) return setNovo({ ...n, erro: 'Escolha o cargo.' });
    if (String(n.senha || '').length < 6) return setNovo({ ...n, erro: 'A senha inicial deve ter pelo menos 6 caracteres.' });
    if (n.senha !== n.senha2) return setNovo({ ...n, erro: 'As senhas não conferem.' });
    setAgindo(true);
    window.FRApi.post('/auth/register', { email: String(n.email).trim(), password: n.senha, name: String(n.nome).trim(), role: n.cargo, sector: String(n.setor || '').trim() || undefined })
      .then(function () { return carregar(false); })
      .then(function () { setNovo(null); flash('Colaborador criado.'); })
      .catch(function (e) { setNovo(function (m) { return { ...m, erro: usrErr(e) }; }); })
      .then(function () { setAgindo(false); });
  };
  const redefinir = function () {
    const r = reset || {};
    if (String(r.senha || '').length < 6) return setReset({ ...r, erro: 'A nova senha deve ter pelo menos 6 caracteres.' });
    if (r.senha !== r.senha2) return setReset({ ...r, erro: 'As senhas não conferem.' });
    setAgindo(true);
    window.FRApi.post('/users/' + r.user.id + '/reset-password', { newPassword: r.senha })
      .then(function () { setReset(null); flash('Senha redefinida.'); })
      .catch(function (e) { setReset(function (m) { return { ...m, erro: usrErr(e) }; }); })
      .then(function () { setAgindo(false); });
  };
  const copiarId = function (u) { try { navigator.clipboard && navigator.clipboard.writeText(u.id); } catch (e) {} setMenuId(null); flash('ID copiado.'); };

  // ── Derivações (busca local + KPIs — ver nota de topo sobre paginação) ──
  const ql = q.trim().toLowerCase();
  const view = usuarios.filter(function (u) {
    if (!ql) return true;
    return [u.name, u.email, u.role, roleLabel(u.role), u.sector].some(function (v) { return String(v || '').toLowerCase().includes(ql); });
  });
  const onlineAgora = usuarios.filter(usrOnline).length;
  const minutosTotais = usuarios.reduce(function (s, u) { return s + (Number(u.total_minutes) || 0); }, 0);

  const field = { boxSizing: 'border-box', height: 38, borderRadius: 9, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const inputM = { boxSizing: 'border-box', height: 42, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lblM = { display: 'block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.07em', color: t.faint, textTransform: 'uppercase', margin: '14px 0 6px' };
  const menuItem = (icon, label, onClick, danger, disabled, title) => (
    <button onClick={disabled ? undefined : onClick} title={title} style={{ all: 'unset', boxSizing: 'border-box', cursor: disabled ? 'not-allowed' : 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 9, fontSize: 13, fontWeight: 600, color: disabled ? t.faint : danger ? uiTone(t, 'red').fg : t.text, opacity: disabled ? 0.7 : 1 }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = danger ? uiTone(t, 'red').bg : t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
      <Icon name={icon} size={16} /> {label}
    </button>
  );
  const modalShell = (onClose, children, width) => (
    <div onClick={() => !agindo && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: `min(${width || 460}px,96vw)`, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, padding: 24 }}>
        {children}
      </div>
    </div>
  );
  const modalTitulo = (icon, tone, titulo) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <span style={{ width: 40, height: 40, borderRadius: 11, background: uiTone(t, tone).bg, color: uiTone(t, tone).fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={icon} size={20} /></span>
      <div style={{ fontSize: 15.5, fontWeight: 850, color: t.text }}>{titulo}</div>
    </div>
  );
  const modalBotoes = (rotuloOk, onOk, perigoso) => (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
      <Btn t={t} kind="ghost" onClick={() => !agindo && (setConfirmando(null), setModal409(null), setNovo(null), setReset(null))}>Cancelar</Btn>
      <button onClick={() => !agindo && onOk()} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: perigoso ? uiTone(t, 'red').fg : t.accent, color: '#fff', opacity: agindo ? 0.6 : 1 }}>
        {agindo ? 'Aplicando…' : rotuloOk}
      </button>
    </div>
  );

  return (
    <div onClick={() => { setMenuId(null); setCargoId(null); }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ width: 48, height: 48, borderRadius: 14, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="users" size={24} /></span>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 850, letterSpacing: '-.02em', color: t.text }}>Gestão de Equipe</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13.5, color: t.muted, maxWidth: 460 }}>Contas reais do sistema — suspensão, cargo, senha e atividade, direto do banco.</p>
          </div>
        </div>
        <Btn t={t} icon="userPlus" onClick={() => setNovo({ email: '', nome: '', cargo: '', setor: '', senha: '', senha2: '' })}>Novo Colaborador</Btn>
      </div>

      {loading ? (
        <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando colaboradores…</Card>
      ) : error ? (
        <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>
          <Btn t={t} icon="refresh" kind="ghost" onClick={() => carregar(true)}>Tentar novamente</Btn>
        </Card>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <KPI t={t} mini icon="users" label="Total de membros" value={usuarios.length} kind="accent" />
            <KPI t={t} mini icon="barChart2" label="Online agora" value={onlineAgora} kind="green" />
            <KPI t={t} mini icon="clock" label="Horas úteis totais" value={usrTempo(minutosTotais)} kind="blue" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '2 1 280px', minWidth: 240, padding: '0 16px', borderRadius: 16, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
              <Icon name="search" size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, e-mail, cargo ou setor…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit', padding: '18px 0' }} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {view.map((u) => {
              const online = usrOnline(u);
              const suspenso = u.is_active === false;
              const souEu = u.id === meuId;
              return (
                <Card t={t} key={u.id} hover style={{ padding: 18, display: 'flex', flexDirection: 'column', position: 'relative', opacity: suspenso ? 0.62 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ width: 54, height: 54, borderRadius: '50%', background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 17 }}>{usrIniciais(u.name)}</span>
                      {online && <span style={{ position: 'absolute', bottom: 2, right: 2, width: 13, height: 13, borderRadius: '50%', background: uiTone(t, 'green').fg, border: `2.5px solid ${t.panel}` }} />}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button onClick={(e) => { e.stopPropagation(); setCargoId(null); setMenuId(menuId === u.id ? null : u.id); }} title="Opções" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="dots" size={18} /></button>
                      {menuId === u.id && (
                        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', zIndex: 40, top: 'calc(100% + 6px)', right: 0, width: 230, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 14, boxShadow: t.shadow, padding: 6 }}>
                          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', color: t.faint, padding: '8px 10px 6px' }}>AÇÕES DO MEMBRO</div>
                          {menuItem('copy', 'Copiar ID', () => copiarId(u))}
                          {menuItem('key', 'Redefinir Senha', () => { setMenuId(null); setReset({ user: u, senha: '', senha2: '' }); })}
                          <div style={{ height: 1, background: t.border, margin: '6px 4px' }} />
                          {menuItem('trash', 'Excluir Conta', () => { setMenuId(null); setConfirmando({ tipo: 'excluir', user: u }); }, true, souEu, souEu ? 'Não pode excluir a própria conta.' : undefined)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 850, color: t.text, marginTop: 14, letterSpacing: '-.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {u.name}{suspenso && <Badge t={t} kind="red" dot>Suspenso</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: t.muted, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={u.email}>{u.email}</div>

                  {/* cargo: papéis REAIS (allowlist do backend) — trocar confirma e desloga o alvo */}
                  <div style={{ position: 'relative', marginTop: 14 }}>
                    <button onClick={(e) => { e.stopPropagation(); setMenuId(null); setCargoId(cargoId === u.id ? null : u.id); }} style={{ ...field, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textTransform: 'uppercase', letterSpacing: '.02em', textAlign: 'left' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{roleLabel(u.role)}</span>
                      <Icon name="chevronDown" size={15} style={{ color: t.muted, flexShrink: 0, transform: cargoId === u.id ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                    </button>
                    {cargoId === u.id && (
                      <div onClick={(e) => e.stopPropagation()} className="fr-scroll" style={{ position: 'absolute', zIndex: 40, top: 'calc(100% + 6px)', left: 0, right: 0, maxHeight: 280, overflowY: 'auto', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 14, boxShadow: t.shadow, padding: 6 }}>
                        {papeis.length === 0 && (
                          <div style={{ padding: '10px 12px', fontSize: 12, color: uiTone(t, 'red').fg, fontWeight: 700 }}>
                            {papeisErro ? `Papéis indisponíveis: ${papeisErro}` : 'Nenhum papel carregado.'}
                          </div>
                        )}
                        {papeis.map((c) => {
                          const on = u.role === c;
                          const lbl = roleLabel(c);
                          return (
                            <button key={c} onClick={() => { setCargoId(null); if (!on) setConfirmando({ tipo: 'cargo', user: u, cargo: c }); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, fontSize: 13, fontWeight: on ? 800 : 600, color: on ? t.accentText : t.text, background: on ? t.accentSoft : 'transparent' }}
                              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                              <Icon name="check" size={14} style={{ opacity: on ? 1 : 0, color: t.accentText }} /> {lbl === c ? c : `${lbl} (${c})`}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: t.muted, marginTop: 12 }}><Icon name="building" size={13} /> SETOR: <span style={{ color: t.text, textTransform: 'uppercase' }}>{u.sector}</span></div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
                    <div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>TEMPO ÚTIL</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 800, color: t.text, marginTop: 3 }}><Icon name="clock" size={13} style={{ color: t.muted }} /> {usrTempo(u.total_minutes)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>ÚLTIMA AÇÃO</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: online ? uiTone(t, 'green').fg : t.text, marginTop: 4 }}>{usrRelativo(u.last_active)}</div>
                    </div>
                  </div>

                  {/* AÇÃO PRIMÁRIA do card — hierarquia invertida de propósito: suspender preserva
                      histórico e é reversível; excluir (raramente possível) vive no menu. */}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (!souEu) setConfirmando({ tipo: suspenso ? 'reativar' : 'suspender', user: u }); }}
                    title={souEu ? 'Não pode suspender a própria conta.' : undefined}
                    style={{ all: 'unset', boxSizing: 'border-box', cursor: souEu ? 'not-allowed' : 'pointer', width: '100%', height: 40, marginTop: 14, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 800, opacity: souEu ? 0.5 : 1,
                      background: suspenso ? uiTone(t, 'green').bg : uiTone(t, 'red').bg, color: suspenso ? uiTone(t, 'green').fg : uiTone(t, 'red').fg, border: `1px solid ${suspenso ? uiTone(t, 'green').fg : uiTone(t, 'red').fg}22` }}>
                    <Icon name={suspenso ? 'check' : 'ban'} size={16} /> {suspenso ? 'Reativar Acesso' : 'Suspender Acesso'}
                  </button>
                </Card>
              );
            })}
            {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhum colaborador" sub="Ajuste a busca." /></Card></div>}
          </div>
        </div>
      )}

      {/* confirm genérico (suspender/reativar/excluir/cargo) — nenhuma escrita sem confirmação */}
      {confirmando && modalShell(() => setConfirmando(null), (
        <div>
          {modalTitulo('alert', confirmando.tipo === 'reativar' ? 'green' : confirmando.tipo === 'cargo' ? 'amber' : 'red',
            confirmando.tipo === 'suspender' ? 'Suspender acesso' : confirmando.tipo === 'reativar' ? 'Reativar acesso' : confirmando.tipo === 'cargo' ? 'Trocar cargo' : 'Excluir conta')}
          <div style={{ fontSize: 13.5, color: t.text, lineHeight: 1.55 }}>
            {confirmando.tipo === 'suspender' && <span>Suspender <b>bloqueia o acesso imediatamente</b>: {confirmando.user.name} é deslogado na hora e não consegue entrar até ser reativado.</span>}
            {confirmando.tipo === 'reativar' && <span>{confirmando.user.name} volta a conseguir entrar <b>imediatamente</b>, com a senha atual.</span>}
            {confirmando.tipo === 'cargo' && <span>Trocar o cargo de {confirmando.user.name} para <b>{roleLabel(confirmando.cargo)}</b> desloga o usuário imediatamente (entra de novo já com os acessos do cargo novo).</span>}
            {confirmando.tipo === 'excluir' && <span>Excluir é <b>permanente</b> e só funciona para conta sem histórico. Se {confirmando.user.name} tiver auditoria ou solicitações vinculadas, a exclusão é bloqueada — o caminho é suspender.</span>}
          </div>
          {modalBotoes(
            confirmando.tipo === 'suspender' ? 'Suspender' : confirmando.tipo === 'reativar' ? 'Reativar' : confirmando.tipo === 'cargo' ? 'Trocar cargo' : 'Excluir',
            () => {
              if (confirmando.tipo === 'suspender') mudarStatus(confirmando.user, false);
              else if (confirmando.tipo === 'reativar') mudarStatus(confirmando.user, true);
              else if (confirmando.tipo === 'cargo') trocarCargo(confirmando.user, confirmando.cargo);
              else excluir(confirmando.user);
            },
            confirmando.tipo === 'suspender' || confirmando.tipo === 'excluir')}
        </div>
      ))}

      {/* 409 do DELETE: modal honesto — histórico impede exclusão; oferece a suspensão direto */}
      {modal409 && modalShell(() => setModal409(null), (
        <div>
          {modalTitulo('alert', 'amber', 'Este usuário tem histórico')}
          <div style={{ fontSize: 13.5, color: t.text, lineHeight: 1.55 }}>
            {modal409.user.name} tem histórico vinculado (auditoria/solicitações) e <b>não pode ser excluído</b> — o registro das ações dele precisa continuar de pé. Suspender em vez disso? O acesso é bloqueado na hora e o histórico fica preservado.
          </div>
          {modalBotoes('Suspender acesso', () => mudarStatus(modal409.user, false), true)}
        </div>
      ))}

      {/* Novo Colaborador — POST /auth/register (senha inicial digitada + confirmação) */}
      {novo && modalShell(() => setNovo(null), (
        <div>
          {modalTitulo('userPlus', 'accent', 'Novo Colaborador')}
          <label style={lblM}>E-mail de acesso</label>
          <input value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value, erro: null })} placeholder="nome@empresa.com" style={inputM} />
          <label style={lblM}>Nome completo</label>
          <input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value, erro: null })} placeholder="Nome e sobrenome" style={inputM} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lblM}>Cargo</label>
              <select value={novo.cargo} onChange={(e) => setNovo({ ...novo, cargo: e.target.value, erro: null })} style={{ ...inputM, cursor: 'pointer' }}>
                <option value="">{papeisErro ? 'Papéis indisponíveis' : 'Escolha…'}</option>
                {papeis.map((c) => { const lbl = roleLabel(c); return <option key={c} value={c}>{lbl === c ? c : `${lbl} (${c})`}</option>; })}
              </select>
            </div>
            <div>
              <label style={lblM}>Setor</label>
              <input value={novo.setor} onChange={(e) => setNovo({ ...novo, setor: e.target.value, erro: null })} placeholder="Ex.: Usinagem" style={inputM} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lblM}>Senha inicial (≥ 6)</label>
              <input type="password" value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value, erro: null })} style={inputM} />
            </div>
            <div>
              <label style={lblM}>Confirmar senha</label>
              <input type="password" value={novo.senha2} onChange={(e) => setNovo({ ...novo, senha2: e.target.value, erro: null })} style={inputM} />
            </div>
          </div>
          {novo.erro && <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{novo.erro}</div>}
          {modalBotoes('Criar colaborador', criar)}
        </div>
      ))}

      {/* Redefinir senha — POST /users/:id/reset-password (404 do id fantasma cai no erro abaixo) */}
      {reset && modalShell(() => setReset(null), (
        <div>
          {modalTitulo('key', 'amber', `Redefinir senha — ${reset.user.name}`)}
          <div style={{ fontSize: 12.5, color: t.muted, lineHeight: 1.5 }}>A senha atual deixa de valer no próximo login. Sessões abertas continuam até o token expirar.</div>
          <label style={lblM}>Nova senha (≥ 6)</label>
          <input type="password" value={reset.senha} onChange={(e) => setReset({ ...reset, senha: e.target.value, erro: null })} style={inputM} />
          <label style={lblM}>Confirmar nova senha</label>
          <input type="password" value={reset.senha2} onChange={(e) => setReset({ ...reset, senha2: e.target.value, erro: null })} style={inputM} />
          {reset.erro && (
            <Card t={t} style={{ marginTop: 14, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'red').fg }}>{reset.erro}</div>
            </Card>
          )}
          {modalBotoes('Redefinir', redefinir)}
        </div>
      ))}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 70, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderRadius: 13, background: toast.kind === 'erro' ? '#dc2626' : '#10b981', color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 10px 30px rgba(0,0,0,.3)' }}>
          <Icon name={toast.kind === 'erro' ? 'alert' : 'check'} size={18} /> {toast.msg}
        </div>
      )}
    </div>
  );
}


// ---------- Relatórios ----------
// LIGAÇÃO REAL aos 5 endpoints de sistema (RBAC 'relatorios'):
//   GET /dashboard/stats            -> valor do estoque, itens abaixo do mínimo
//   GET /reports/managerial         -> top 5 saídas, série 6 meses, status de compra
//   GET /reports/general?start&end  -> linhas cruas de entrada/saída + estoque (a tela agrega)
//   GET /reports/available-dates    -> limites do seletor de período
//   GET /transactions/recent        -> extrato dos 15 últimos movimentos
//
// KPIs QUE NÃO EXISTEM AQUI, e por quê (o stub os mostrava chumbados):
//   - GIRO DE ESTOQUE: precisa do estoque MÉDIO do período; nenhum endpoint expõe série histórica
//     de saldo (o `stock` é estado atual). O stock_ledger tem `on_hand_after` por movimento e
//     poderia sustentar isso no futuro, mas nenhuma rota o publica e o histórico começou agora.
//   - COBERTURA em dias "universal": só faz sentido em R$ e por período explícito; como número
//     único misturando kg/L/un seria ilusão.
//   - RUPTURAS "no trimestre": exige histórico de cruzamentos do zero. Ficou "em ruptura AGORA",
//     que é derivável do saldo atual.
//   - CONSUMO POR CATEGORIA: `products` não tem categoria. Substituído por consumo POR SETOR, que
//     tem lastro real (`destino_setor` vem nas linhas de saída).
const REL_PARADO_DIAS = 60;   // limiar de "item parado" (sem movimento há N dias)

function relMoney(v) {
  const n = Number(v) || 0;
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function relMoneyShort(v) {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1000) return 'R$ ' + (n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k';
  return relMoney(n);
}
function relErr(e) { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; }
function relISO(d) { return d.toISOString().slice(0, 10); }
function relDia(iso) { if (!iso) return '—'; const d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleDateString('pt-BR'); }
function relDiasDesde(iso) { if (!iso) return null; const d = new Date(iso); if (isNaN(d)) return null; return Math.floor((Date.now() - d.getTime()) / 86400000); }

// Baixa um CSV montado no cliente. Export REAL (não é "Excel"/xlsx — é CSV, que o Excel abre);
// o rótulo diz CSV de propósito, pra não prometer um formato que não geramos.
function relBaixarCSV(nome, colunas, linhas) {
  const esc = (v) => { const s = v == null ? '' : String(v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const csv = [colunas.map((c) => esc(c.label)).join(';')]
    .concat(linhas.map((r) => colunas.map((c) => esc(typeof c.get === 'function' ? c.get(r) : r[c.key])).join(';')))
    .join('\r\n');
  // BOM: sem ele o Excel abre acentuação quebrada em pt-BR.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function PageRelatorios({ t }) {
  const R = window.React;
  const [stats, setStats] = R.useState(null);
  const [ger, setGer] = R.useState(null);          // managerial
  const [geral, setGeral] = R.useState(null);      // general (depende do período)
  const [extrato, setExtrato] = R.useState([]);
  const [periodo, setPeriodo] = R.useState(null);  // { start, end }
  const [loading, setLoading] = R.useState(true);
  const [carregandoPeriodo, setCarregandoPeriodo] = R.useState(false);
  const [erro, setErro] = R.useState(null);
  const mounted = R.useRef(true);

  // 1ª carga: os 3 endpoints sem parâmetro + os limites de data pro seletor.
  R.useEffect(() => {
    mounted.current = true;
    Promise.all([
      window.FRApi.get('/dashboard/stats', { skipLoading: true }),
      window.FRApi.get('/reports/managerial', { skipLoading: true }),
      window.FRApi.get('/transactions/recent', { skipLoading: true }),
      window.FRApi.get('/reports/available-dates', { skipLoading: true }),
    ]).then(([a, b, c, d]) => {
      if (!mounted.current) return;
      setStats(a.data); setGer(b.data); setExtrato(Array.isArray(c.data) ? c.data : []);
      // available-dates volta {min_date:null,max_date:null} quando não há movimento nenhum —
      // nesse caso o seletor cai nos últimos 30 dias em vez de ficar sem intervalo.
      const hoje = new Date();
      const min = d.data && d.data.min_date ? String(d.data.min_date).slice(0, 10) : relISO(new Date(hoje.getTime() - 30 * 86400000));
      const max = d.data && d.data.max_date ? String(d.data.max_date).slice(0, 10) : relISO(hoje);
      setPeriodo({ start: min, end: max });
      setLoading(false);
    }).catch((e) => { if (mounted.current) { setErro(relErr(e)); setLoading(false); } });
    return () => { mounted.current = false; };
  }, []);

  // /reports/general exige startDate/endDate (400 sem) -> só dispara quando há período.
  R.useEffect(() => {
    if (!periodo) return;
    setCarregandoPeriodo(true);
    window.FRApi.get(`/reports/general?startDate=${periodo.start}&endDate=${periodo.end}`, { skipLoading: true })
      .then((r) => { if (mounted.current) { setGeral(r.data); setCarregandoPeriodo(false); } })
      .catch((e) => { if (mounted.current) { setErro(relErr(e)); setCarregandoPeriodo(false); } });
  }, [periodo && periodo.start, periodo && periodo.end]);

  // ---- derivações (só do que os endpoints realmente dão) ----
  const saidas = R.useMemo(() => {
    if (!geral) return [];
    return [].concat(geral.saidas_separacoes || [], geral.saidas_solicitacoes || [], geral.saidas_reposicoes || []);
  }, [geral]);

  // Consumo por SETOR em R$ — substituto honesto do "por categoria". `destino_setor` vem nas
  // linhas de separação e solicitação; reposição traz "Cliente: X".
  const porSetor = R.useMemo(() => {
    const m = {};
    saidas.forEach((s) => {
      const k = (s.destino_setor || 'Não informado').trim() || 'Não informado';
      m[k] = (m[k] || 0) + (Number(s.quantidade) || 0) * (Number(s.preco_unitario) || 0);
    });
    return Object.keys(m).map((k) => ({ label: k, v: m[k] })).sort((a, b) => b.v - a.v).slice(0, 8);
  }, [saidas]);

  const totalSaidaRS = R.useMemo(() => saidas.reduce((a, s) => a + (Number(s.quantidade) || 0) * (Number(s.preco_unitario) || 0), 0), [saidas]);

  const estoqueRows = (geral && geral.estoque) || [];
  const emRuptura = R.useMemo(() => estoqueRows.filter((r) => (Number(r.disponivel) || 0) <= 0).length, [estoqueRows]);
  const parados = R.useMemo(() => estoqueRows
    .map((r) => ({ ...r, dias: relDiasDesde(r.ultima_movimentacao) }))
    .filter((r) => (Number(r.quantidade) || 0) > 0 && (r.dias === null || r.dias >= REL_PARADO_DIAS))
    .sort((a, b) => (b.dias === null ? 1e9 : b.dias) - (a.dias === null ? 1e9 : a.dias)), [estoqueRows]);

  const hist = (ger && ger.history) || [];
  const temMovimentoHist = hist.some((h) => Number(h.entradas) > 0 || Number(h.saidas) > 0);
  const topProd = (ger && ger.topProducts) || [];
  const compra = (ger && ger.purchaseStatus) || [];

  if (loading) return <Card t={t} style={{ padding: 40, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Carregando relatórios…</Card>;
  if (erro) return (
    <Card t={t} style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ color: uiTone(t, 'red').fg, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{erro}</div>
      <div style={{ fontSize: 12.5, color: t.muted }}>Os relatórios exigem a permissão <b>relatorios</b>.</div>
    </Card>
  );

  const exportar = () => relBaixarCSV(
    `relatorio_saidas_${periodo.start}_a_${periodo.end}.csv`,
    [
      { label: 'Data', get: (r) => relDia(r.data) },
      { label: 'Tipo', key: 'tipo' }, { label: 'Produto', key: 'produto' }, { label: 'SKU', key: 'sku' },
      { label: 'Setor/Destino', key: 'destino_setor' }, { label: 'OP', key: 'op_code' },
      { label: 'Quantidade', key: 'quantidade' }, { label: 'Unidade', key: 'unidade' },
      { label: 'Preço unit.', key: 'preco_unitario' },
      { label: 'Total', get: (r) => ((Number(r.quantidade) || 0) * (Number(r.preco_unitario) || 0)).toFixed(2) },
    ],
    saidas,
  );

  const secao = (titulo, extra, children) => (
    <Card t={t} style={{ padding: 22, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{titulo}</div>
        {extra}
      </div>
      {children}
    </Card>
  );
  const vazio = (msg) => <div style={{ padding: '26px 0', textAlign: 'center', fontSize: 13, color: t.muted }}>{msg}</div>;

  return (
    <div>
      <PageHeader t={t} title="Relatórios" subtitle="Indicadores de estoque, consumo e custos."
        actions={<>
          {/* PDF fica INERTE: não há gerador no projeto e nenhuma lib de PDF no bundle. Prometer o
              botão sem gerar arquivo seria pior que dizer que ainda não existe. */}
          <span title="Exportação em PDF ainda não implementada — use o CSV." style={{ display: 'inline-flex', alignItems: 'center', gap: 9, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, background: t.panel, color: t.faint, border: `1px solid ${t.border}`, cursor: 'not-allowed' }}>
            <Icon name="file" size={17} /> PDF
          </span>
          <Btn t={t} icon="download" onClick={exportar}>Exportar CSV</Btn>
        </>} />

      {/* período — alimenta o /reports/general */}
      <Card t={t} style={{ padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Icon name="calendar" size={17} style={{ color: t.accentText }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: t.muted }}>Período</span>
        <input type="date" value={periodo.start} max={periodo.end} onChange={(e) => setPeriodo((p) => ({ ...p, start: e.target.value }))}
          style={{ height: 38, padding: '0 10px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        <span style={{ color: t.faint }}>até</span>
        <input type="date" value={periodo.end} min={periodo.start} onChange={(e) => setPeriodo((p) => ({ ...p, end: e.target.value }))}
          style={{ height: 38, padding: '0 10px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        {carregandoPeriodo && <span style={{ fontSize: 12, color: t.muted }}>atualizando…</span>}
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: t.muted }}>Saídas no período: <b style={{ color: t.text }}>{relMoney(totalSaidaRS)}</b></span>
      </Card>

      {/* KPIs — todos com lastro */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} icon="barChart" label="Valor do estoque" value={relMoneyShort(stats.totalValue)} sub="a preço de custo" kind="accent" />
        <KPI t={t} icon="alert" label="Abaixo do mínimo" value={stats.lowStock} sub="itens" kind="amber" />
        <KPI t={t} icon="box" label="Em ruptura" value={geral ? emRuptura : '—'} sub="agora" kind="red" />
        <KPI t={t} icon="clock" label="Itens parados" value={geral ? parados.length : '—'} sub={`sem saída há ${REL_PARADO_DIAS}+ dias`} kind="blue" />
      </div>

      {/* entradas × saídas — 6 meses (quantidade) */}
      {secao('Entradas × Saídas — últimos 6 meses',
        <span style={{ fontSize: 11.5, color: t.faint }}>em quantidade (o endpoint não devolve R$ nesta série)</span>,
        !temMovimentoHist ? vazio('Sem movimento registrado nos últimos 6 meses.') : (
          <>
            <AreaChart t={t} height={180} labels={hist.map((h) => h.name)}
              series={[
                { data: hist.map((h) => Number(h.entradas) || 0), color: uiTone(t, 'green').fg },
                { data: hist.map((h) => Number(h.saidas) || 0), color: uiTone(t, 'amber').fg, fill: false },
              ]} />
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.muted }}><span style={{ width: 16, height: 3, borderRadius: 2, background: uiTone(t, 'green').fg }} /> Entradas</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.muted }}><span style={{ width: 16, height: 3, borderRadius: 2, background: uiTone(t, 'amber').fg }} /> Saídas</span>
            </div>
          </>
        ))}

      {/* consumo por setor (R$) — substitui o "por categoria" */}
      {secao('Consumo por setor (R$) — no período',
        <span style={{ fontSize: 11.5, color: t.faint }}>substitui “por categoria”: o cadastro não tem categoria</span>,
        porSetor.length === 0 ? vazio('Sem saídas no período selecionado.')
          : <BarChart t={t} height={200} data={porSetor.map((s, i) => ({ label: s.label.length > 14 ? s.label.slice(0, 13) + '…' : s.label, v: s.v, accent: i < 3, label2: relMoneyShort(s.v) }))} />)}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginBottom: 18 }}>
        {/* top 5 produtos por saída */}
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 18 }}>Top 5 produtos por saída</div>
          {topProd.length === 0 ? vazio('Nenhuma saída concluída registrada.') : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {topProd.map((p, i) => {
                const max = Math.max(...topProd.map((x) => Number(x.total) || 0)) || 1;
                const pct = Math.round(((Number(p.total) || 0) / max) * 100);
                return (
                  <div key={p.name + i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, marginBottom: 5 }}>
                      <span style={{ color: t.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                      <span style={{ color: t.muted, fontWeight: 800, flexShrink: 0 }}>{Number(p.total) || 0}</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 6, background: t.hover, overflow: 'hidden' }}><div style={{ height: '100%', width: pct + '%', borderRadius: 6, background: t.accent }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* status de compra */}
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 18 }}>Status de compra</div>
          {compra.length === 0 ? vazio('Nenhum produto ativo com status de compra.') : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <RingChart t={t} size={140} thickness={16}
                center={{ value: compra.reduce((a, c) => a + (Number(c.value) || 0), 0), sub: 'produtos' }}
                segs={compra.map((c, i) => ({ label: c.name, value: Number(c.value) || 0, color: uiTone(t, ['accent', 'amber', 'green', 'blue', 'red'][i % 5]).fg }))} />
              <div style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {compra.map((c, i) => (
                  <div key={c.name + i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: uiTone(t, ['accent', 'amber', 'green', 'blue', 'red'][i % 5]).fg, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: t.text, flex: 1, textTransform: 'capitalize' }}>{c.name}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: t.text }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* itens parados */}
      {secao(`Itens parados — sem movimento há ${REL_PARADO_DIAS}+ dias`,
        parados.length > 0 ? <span style={{ fontSize: 11.5, color: t.faint }}>{parados.length} item(ns) · capital imobilizado {relMoneyShort(parados.reduce((a, r) => a + (Number(r.quantidade) || 0) * (Number(r.preco) || 0), 0))}</span> : null,
        !geral ? vazio('Carregando…') : parados.length === 0 ? vazio('Nenhum item parado — todo o estoque teve movimento recente.') : (
          <DataTable t={t}
            columns={[{ key: 'sku', label: 'SKU' }, { key: 'produto', label: 'Produto' }, { key: 'qtd', label: 'Em estoque', align: 'right' },
              { key: 'valor', label: 'Valor', align: 'right' }, { key: 'quando', label: 'Última movimentação', align: 'right' }]}
            rows={parados.slice(0, 20).map((r) => ({
              sku: r.sku || '—', produto: r.produto,
              qtd: Number(r.quantidade) || 0,
              valor: relMoney((Number(r.quantidade) || 0) * (Number(r.preco) || 0)),
              quando: r.dias === null ? 'nunca movimentou' : `${relDia(r.ultima_movimentacao)} (${r.dias}d)`,
            }))} />
        ))}

      {/* extrato */}
      {secao('Últimos 15 movimentos', null,
        extrato.length === 0 ? vazio('Nenhuma movimentação registrada no sistema.') : (
          <DataTable t={t}
            columns={[{ key: 'quando', label: 'Data' }, { key: 'tipo', label: 'Tipo' }, { key: 'sku', label: 'SKU' },
              { key: 'produto', label: 'Produto' }, { key: 'qtd', label: 'Qtd', align: 'right' }]}
            rows={extrato.map((m) => ({
              quando: relDia(m.created_at),
              tipo: <Badge t={t} kind={m.type === 'in' ? 'green' : 'amber'}>{m.type === 'in' ? 'Entrada' : 'Saída'}</Badge>,
              sku: m.product_sku || '—', produto: m.product_name || '—', qtd: Number(m.amount) || 0,
            }))} />
        ))}
    </div>
  );
}

function PagePlaceholder({ t, title }) {
  return (
    <div>
      <PageHeader t={t} title={title} subtitle="Esta página será reformulada na sequência." />
      <Card t={t} style={{ padding: 10 }}>
        <EmptyState t={t} title="Em construção" sub={`O módulo “${title}” entra na próxima leva de reformulação, seguindo o mesmo design das páginas já entregues.`} />
      </Card>
    </div>
  );
}

function SolicitacaoDetail({ t, s, onClose, onApprove, onReject, mine, onCancel }) {
  const m = SOL_STATUS[s.status];
  const [h1, h2] = SOL_HEAD[m.kind];
  const pending = s.status === 'em-analise';
  // qtd pedida robusta: dados reais usam qtdPedida; mock/'mine' ainda usam qtd.
  const pedidaOf = (it) => (it.qtdPedida != null ? it.qtdPedida : it.qtd) || 0;
  const canConfer = !mine && pending;   // fluxo do almoxarife: confere qtd por item + recusa com motivo
  const [conf, setConf] = useStateA(() => { const m = {}; s.itens.forEach((it, i) => { m[it.id != null ? it.id : i] = String(pedidaOf(it)); }); return m; });
  const [motivo, setMotivo] = useStateA('');
  const [rejectOpen, setRejectOpen] = useStateA(false);
  const [enviando, setEnviando] = useStateA(false);
  const [erro, setErro] = useStateA('');
  const confRaw = (it, i) => { const k = it.id != null ? it.id : i; return conf[k] != null ? conf[k] : String(pedidaOf(it)); };
  const setConfVal = (it, i) => (raw) => { const k = it.id != null ? it.id : i; const max = pedidaOf(it); const n = parseInt(String(raw).replace(/\D/g, ''), 10); const v = isNaN(n) ? 0 : Math.max(0, Math.min(max, n)); setConf((c) => ({ ...c, [k]: String(v) })); };
  const confVal = (it, i) => { const n = parseInt(confRaw(it, i), 10); return isNaN(n) ? 0 : n; };
  const handleApprove = async () => {
    if (enviando) return;
    // adjusted_items = SÓ os itens cuja qtd conferida difere da pedida (chaveado pelo ri.id REAL).
    const adjusted = s.itens.map((it, i) => ({ it: it, v: confVal(it, i) })).filter((x) => x.v !== pedidaOf(x.it)).map((x) => ({ id: x.it.id, quantity_delivered: x.v }));
    setErro(''); setEnviando(true);
    try { await onApprove(adjusted); }
    catch (e) { const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage; setErro(gm ? gm(e) : 'Não foi possível aprovar.'); setEnviando(false); }
  };
  const handleReject = async () => {
    if (enviando) return;
    if (!motivo.trim()) { setErro('Informe o motivo da recusa.'); return; }   // feedback imediato, não envia
    setErro(''); setEnviando(true);
    try { await onReject(motivo.trim()); }
    catch (e) { const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage; setErro(gm ? gm(e) : 'Não foi possível recusar.'); setEnviando(false); }
  };
  const totalUn = s.itens.reduce((a, it) => a + pedidaOf(it), 0);
  const light = t.panel === '#ffffff';
  const titleCor = light ? h1 : h2;
  const steps = (s.status === 'recusado'
    ? [{ ...STEP_DEFS[0], state: 'done', when: stepWhen(s, 0) }, { t: 'Recusada', icon: 'x', when: (s.recusa && s.recusa.em) || '', d: 'A solicitação foi recusada pelo almoxarifado.', state: 'rejected' }]
    : STEP_DEFS.map((d, i) => {
        let dd = d.d;
        if (i === 1 && s.aprovacao) dd = `Aprovada por ${s.aprovacao.por}.`;
        if (i === 2 && s.envio) dd = `Itens bipados por ${s.bipagem ? s.bipagem.por : s.envio.por} e enviados ao setor.`;
        if (i === 3 && s.recebimento) dd = `Recebida por ${s.recebimento.por}${s.recebimento.divergencia ? ' · com divergência' : ' · sem divergência'}.`;
        return { ...d, d: dd, state: STEP_STATES[s.status][i], when: stepWhen(s, i) };
      }));
  const chipDark = { display: 'inline-flex', alignItems: 'center', fontSize: 10.5, fontWeight: 850, letterSpacing: '.04em', padding: '5px 11px', borderRadius: 8, background: t.text, color: t.panel, fontFamily: 'ui-monospace, monospace' };
  const temOp = !!s.op && s.op !== '—';   // pedido isento (EPI/ferramenta/insumo) não tem OP: o chip some, nada de "OP-—"
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,10,16,.5)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,100%)', height: '100%', display: 'flex', flexDirection: 'column', background: t.panel, borderLeft: `1px solid ${t.borderStrong}`, boxShadow: t.shadow, animation: 'solDrawerIn .28s cubic-bezier(.22,1,.36,1)' }}>
        <style>{`@keyframes solDrawerIn{from{transform:translateX(70px);opacity:0}to{transform:none;opacity:1}}`}</style>

        {/* header degradê quente */}
        <div style={{ position: 'relative', flexShrink: 0, padding: '20px 24px 18px', background: `linear-gradient(115deg, ${frHexToRgba(h2, light ? 0.07 : 0.1)} 0%, ${frHexToRgba(h2, light ? 0.32 : 0.3)} 100%)`, overflow: 'hidden' }}>
          <Icon name="box" size={140} style={{ position: 'absolute', right: -18, top: -22, color: h2, opacity: 0.16, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={chipDark}>{s.req}</span>
              {temOp && <span style={chipDark}>OP-{s.op}</span>}
              <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', marginLeft: 'auto', width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', background: t.panel, color: t.text, border: `1px solid ${t.border}`, boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}><Icon name="x" size={15} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 13, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 24, fontWeight: 850, letterSpacing: '-.02em', color: titleCor }}>{m.title}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999, background: t.panel, color: t.text, border: `1px solid ${t.border}` }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: h2 }} /> {m.label.toLowerCase()}</span>
            </div>
            <div style={{ fontSize: 13, color: t.muted, marginTop: 6, maxWidth: 420 }}>{m.sub}</div>
          </div>
        </div>

        <div className="fr-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px', borderTop: `1px solid ${t.border}` }}>
          {/* acompanhamento */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
            <Icon name="clock" size={14} style={{ color: t.accentText }} />
            <span style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: '.1em', textTransform: 'uppercase', color: t.faint }}>Acompanhamento do pedido</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {steps.map((step, i, arr) => {
              const last = i === arr.length - 1;
              const done = step.state === 'done', current = step.state === 'current', rej = step.state === 'rejected';
              const filled = done || current || rej;
              const nodeBg = rej ? uiTone(t, 'red').fg : done ? uiTone(t, 'green').fg : 'transparent';
              const nodeBorder = current ? h2 : filled ? 'transparent' : t.border;
              return (
                <div key={i} style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, background: nodeBg, color: done || rej ? '#fff' : current ? h2 : t.faint, border: `2px solid ${nodeBorder}` }}>
                      <Icon name={done ? 'check' : rej ? 'x' : step.icon} size={15} />
                    </span>
                    {!last && <span style={{ width: 2.5, flex: 1, minHeight: 34, borderRadius: 3, background: done ? uiTone(t, 'green').fg : t.border, margin: '4px 0' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: filled ? t.text : t.muted }}>{step.t}</span>
                      {current && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: frHexToRgba(h2, .16), color: titleCor }}>em andamento</span>}
                      {rej && <Badge t={t} kind="red" dot>Recusado</Badge>}
                    </div>
                    <div style={{ fontSize: 12.5, color: filled ? t.muted : t.faint, marginTop: 4, lineHeight: 1.5 }}>{step.d}</div>
                    {step.state !== 'future' && step.when && <div style={{ fontSize: 11, fontWeight: 700, color: t.faint, marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>{step.when}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* local de entrega */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 17px', margin: '20px 0', borderRadius: 14, background: frHexToRgba(t.accent, 0.08), border: `1px solid ${frHexToRgba(t.accent, 0.25)}` }}>
            <span style={{ width: 42, height: 42, borderRadius: 12, background: t.panel, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}><Icon name="mapPin" size={19} /></span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 850, letterSpacing: '.1em', color: t.accentText, textTransform: 'uppercase' }}>Local de entrega</div>
              <div style={{ fontSize: 15, fontWeight: 850, color: t.text, marginTop: 2 }}>{s.sol}</div>
              <div style={{ fontSize: 12.5, color: t.muted }}>{s.setor}</div>
            </div>
          </div>

          {/* produtos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
            <Icon name="box" size={14} style={{ color: t.accentText }} />
            <span style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: '.1em', textTransform: 'uppercase', color: t.faint }}>Produtos solicitados</span>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 850, padding: '4px 10px', borderRadius: 7, background: t.text, color: t.panel }}>{s.itens.length} {s.itens.length === 1 ? 'ITEM' : 'ITENS'}</span>
          </div>
          <div style={{ borderRadius: 14, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
            {s.itens.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${t.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 850, color: t.text, textTransform: 'uppercase' }}>{it.nome}</div>
                  <div style={{ display: 'flex', gap: 7, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 850, padding: '3px 9px', borderRadius: 7, background: t.text, color: t.panel, fontFamily: 'ui-monospace, monospace' }}>SKU {it.sku}</span>
                    {temOp && <span style={{ fontSize: 10, fontWeight: 850, padding: '3px 9px', borderRadius: 7, background: t.accentSoft, color: t.accentText, fontFamily: 'ui-monospace, monospace' }}>OP {s.op}</span>}
                  </div>
                </div>
                {canConfer ? (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: t.faint }}>PEDIDO: {pedidaOf(it)} {(it.un || 'un').toUpperCase()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 7, marginTop: 7 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: '.06em', textTransform: 'uppercase', color: t.accentText }}>Conferido</span>
                      <input value={confRaw(it, i)} onChange={(e) => setConfVal(it, i)(e.target.value)} inputMode="numeric" disabled={enviando}
                        style={{ width: 64, height: 36, textAlign: 'center', borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, fontSize: 16, fontWeight: 850, fontFamily: 'inherit', outline: 'none' }} />
                      <span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{it.un || 'un'}</span>
                    </div>
                  </div>
                ) : (() => {
                  const posConf = s.status === 'em-transito' || s.status === 'concluido';   // pós-conferência (backend conferido/entregue)
                  const enviada = it.enviada;                          // null/undefined = sem ajuste (integral) | número (incl. 0)
                  const showEnviado = posConf && enviada != null;      // != null cobre null E undefined (mock/'mine')
                  const falta = showEnviado && enviada < pedidaOf(it);
                  const amber = uiTone(t, 'amber');
                  return (
                    <div style={{ textAlign: 'right', flexShrink: 0, maxWidth: 260 }}>
                      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: t.faint }}>QTD PEDIDA</div>
                      <div style={{ fontSize: 20, fontWeight: 850, color: t.text }}>{pedidaOf(it)} <span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{it.un || 'un'}</span></div>
                      {showEnviado && (
                        <React.Fragment>
                          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: falta ? amber.fg : t.faint, marginTop: 7 }}>ENVIADO</div>
                          <div style={{ fontSize: 16, fontWeight: 850, color: falta ? amber.fg : t.text }}>{enviada} <span style={{ fontSize: 11, fontWeight: 600, color: falta ? amber.fg : t.muted }}>{it.un || 'un'}</span></div>
                          {falta && (
                            <div style={{ marginTop: 7, display: 'inline-flex', alignItems: 'flex-start', gap: 5, textAlign: 'left', background: amber.bg, color: amber.fg, borderRadius: 8, padding: '6px 9px', maxWidth: 240 }}>
                              <Icon name="alert" size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                              <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.35 }}>{it.justificativa || 'Sem justificativa'}</span>
                            </div>
                          )}
                        </React.Fragment>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', background: t.elevated }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: t.muted }}>Total do pedido</span>
              <span style={{ fontSize: 13.5, fontWeight: 850, color: t.text }}>{s.itens.length} itens · {totalUn} un</span>
            </div>
          </div>
        </div>
        {pending && (
          <div style={{ flexShrink: 0, padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mine ? (
              <button onClick={onCancel} style={{ all: 'unset', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, fontSize: 14, fontWeight: 800, color: uiTone(t, 'red').fg, border: `1.5px solid ${frHexToRgba('#ef4444', .4)}` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="x" size={16} /> Cancelar pedido</button>
            ) : (
              <React.Fragment>
                {rejectOpen && (
                  <div>
                    <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 }}>Motivo da recusa <span style={{ color: uiTone(t, 'red').fg }}>*</span></label>
                    <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} disabled={enviando} placeholder="Explique por que a solicitação está sendo recusada…"
                      style={{ boxSizing: 'border-box', width: '100%', borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '11px 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
                  </div>
                )}
                {erro && <div style={{ fontSize: 12.5, fontWeight: 600, color: uiTone(t, 'red').fg, background: uiTone(t, 'red').bg, padding: '9px 12px', borderRadius: 10 }}>{erro}</div>}
                <div style={{ display: 'flex', gap: 12 }}>
                  {rejectOpen ? (
                    <React.Fragment>
                      <button onClick={() => { if (!enviando) { setRejectOpen(false); setErro(''); } }} disabled={enviando} style={{ all: 'unset', cursor: enviando ? 'not-allowed' : 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, fontSize: 14, fontWeight: 800, color: t.text, border: `1.5px solid ${t.borderStrong}`, opacity: enviando ? 0.6 : 1 }}>Voltar</button>
                      <button onClick={handleReject} disabled={enviando || !motivo.trim()} style={{ all: 'unset', cursor: (enviando || !motivo.trim()) ? 'not-allowed' : 'pointer', flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, fontSize: 14, fontWeight: 800, background: (enviando || !motivo.trim()) ? t.elevated : uiTone(t, 'red').fg, color: (enviando || !motivo.trim()) ? t.faint : '#fff' }}><Icon name="x" size={16} /> {enviando ? 'Recusando…' : 'Confirmar recusa'}</button>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <button onClick={() => { if (!enviando) { setErro(''); setRejectOpen(true); } }} disabled={enviando} style={{ all: 'unset', cursor: enviando ? 'not-allowed' : 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, fontSize: 14, fontWeight: 800, color: uiTone(t, 'red').fg, border: `1.5px solid ${frHexToRgba('#ef4444', .4)}`, opacity: enviando ? 0.6 : 1 }}
                        onMouseEnter={(e) => { if (!enviando) e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="x" size={16} /> Recusar</button>
                      <button onClick={handleApprove} disabled={enviando} style={{ all: 'unset', cursor: enviando ? 'not-allowed' : 'pointer', flex: 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, height: 50, borderRadius: 14, fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', background: t.accent, color: t.onAccent, boxShadow: `0 8px 20px ${frHexToRgba(t.accent, 0.35)}`, opacity: enviando ? 0.7 : 1 }}><Icon name="check" size={17} /> {enviando ? 'Aprovando…' : 'Conferir & aprovar'}</button>
                    </React.Fragment>
                  )}
                </div>
              </React.Fragment>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Integração REAL das Solicitações (Estoque) — GET /requests + PUT status =====
// Espelha 1:1 os helpers locais de pedidos.jsx (rótulo estável do uuid + mapa de status
// backend→vocabulário da tela). NÃO usa window.frReqLabel/window.frMapReqStatus porque
// esses helpers são locais do pedidos.jsx (não expostos no window) e o pedidos.jsx só
// carrega DEPOIS deste arquivo. store.jsx (useFRSolic) fica INTOCADO — é compartilhado
// por Conferência/Recebimento.
const FR_REQ_STATUS_MAP_ADMIN = { aberto: 'em-analise', aprovado: 'a-separar', conferido: 'em-transito', entregue: 'concluido', rejeitado: 'recusado', devolvido: 'concluido' };
function frMapReqStatusLocal(be) { return FR_REQ_STATUS_MAP_ADMIN[be] || 'em-analise'; }
function frReqLabelLocal(id) { return 'PED-' + String(id || '').replace(/-/g, '').slice(0, 6).toUpperCase(); }

// created_at → tempo relativo pt-BR, sem libs. Cópia verbatim do frRelTime de pedidos.jsx
// (helper local de lá, não exposto no window) — bate 1:1 com o histórico de Meus Pedidos.
function frRelTimeLocal(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const min = Math.floor((Date.now() - then) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  return `há ${d} dias`;
}

function frRequestToCard(r) {
  const its = Array.isArray(r.request_items) ? r.request_items : [];
  return {
    id: r.id,
    req: frReqLabelLocal(r.id),
    sol: (r.requester && r.requester.name) || '—',
    setor: r.sector || '—',
    op: r.op_code || '—',                    // null = isento (EPI/ferramenta/insumo)
    status: frMapReqStatusLocal(r.status),
    time: frRelTimeLocal(r.created_at),      // corrige o {s.time} do card (relógio ficava sem texto)
    itens: its.map((ri) => ({
      id: ri.id,                             // ri.id REAL — adjusted_items chaveia por ele
      sku: (ri.products && ri.products.sku) || '',
      nome: (ri.products && ri.products.name) || ri.custom_product_name || 'Item',
      qtdPedida: Number(ri.quantity_requested) || 0,
      enviada: ri.quantity_delivered == null ? null : Number(ri.quantity_delivered),  // null = nunca ajustado (foi tudo) | número = ajustado (incl. 0)
      justificativa: ri.conference_note || '',
      un: (ri.products && ri.products.unit) || 'un',
    })),
  };
}

// GET /requests adaptado; mantém a GESTÃO ATIVA — 'aberto' (pendente de aceite), 'aprovado'
// (aguardando conferência) e 'conferido' (pronto p/ enviar). Finalizados (entregue/rejeitado/
// devolvido) NÃO ficam nesta tela — isso é histórico, outra coisa.
function useFRRequests() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const mounted = React.useRef(true);
  const load = React.useCallback(function () {
    setLoading(true); setError(null);
    window.FRApi.get('/requests', { skipLoading: true })
      .then(function (res) {
        if (!mounted.current) return;
        const rows = Array.isArray(res && res.data) ? res.data : [];
        setItems(rows.filter(function (r) { return r && (r.status === 'aberto' || r.status === 'aprovado' || r.status === 'conferido' || r.status === 'entregue'); }).map(frRequestToCard));
        setLoading(false);
      })
      .catch(function (e) {
        if (!mounted.current) return;
        const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
        setError(gm ? gm(e) : 'Não foi possível carregar as solicitações.');
        setLoading(false);
      });
  }, []);
  React.useEffect(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);

  // Tempo real: nova solicitação ('new_request') ou mudança de status ('request_updated') → recarrega.
  // FRSocket pode estar null no mount (conecta async) e trocar de instância em reconexão — por isso
  // usamos subscribe() p/ (re)anexar os listeners ao socket vigente. Sem socket, app segue por F5.
  React.useEffect(function () {
    const FRS = window.FRSocket;
    if (!FRS) return undefined;

    // Throttle leve: no máx. 1 reload por janela de 500ms (coalesce de rajadas), com chamada de arrasto.
    let lastRun = 0;
    let timer = null;
    const scheduleReload = function () {
      if (!mounted.current || timer) return;
      const since = Date.now() - lastRun;
      const wait = since >= 500 ? 0 : 500 - since;
      timer = setTimeout(function () {
        timer = null;
        lastRun = Date.now();
        if (mounted.current) load();
      }, wait);
    };

    let attached = null;   // socket que está com os listeners no momento
    const attach = function (sock) {
      if (sock === attached) return;
      if (attached) { attached.off('new_request', scheduleReload); attached.off('request_updated', scheduleReload); }
      attached = sock || null;
      if (attached) { attached.on('new_request', scheduleReload); attached.on('request_updated', scheduleReload); }
    };

    attach(FRS.socket);   // socket já conectado (ex.: sessão restaurada no F5)
    const unsub = FRS.subscribe(function (snap) { attach(snap && snap.socket); });   // conexões/reconexões futuras

    return function () {
      if (timer) clearTimeout(timer);
      if (attached) { attached.off('new_request', scheduleReload); attached.off('request_updated', scheduleReload); }
      if (typeof unsub === 'function') unsub();
    };
  }, [load]);

  return { items: items, loading: loading, error: error, reload: load };
}

function PageSolicitacoes({ t }) {
  const { items, loading, error, reload } = useFRRequests();
  const [filter, setFilter] = useStateA('todas');
  const [search, setSearch] = useStateA('');
  const [openId, setOpenId] = useStateA(null);
  const [tipo, setTipo] = useStateA('todos');
  const [dismissed, setDismissed] = useStateA(() => new Set());   // dispensa LOCAL do botão "Remover" (sem endpoint de exclusão no escopo)
  const remove = (id) => setDismissed((h) => { const n = new Set(h); n.add(id); return n; });
  const setStatus = () => {};   // no-op: bloco de Devoluções é mock e não renderiza com dados reais (/requests não traz tipo devolução)
  // Passo D — ENVIO REAL (conferido → entregue → consume/baixa física no backend). Guard anti-duplo-clique OBRIGATÓRIO (estoque físico).
  const [enviandoId, setEnviandoId] = useStateA(null);
  const [envioErro, setEnvioErro] = useStateA('');
  const confirmarEnvio = async (s) => {
    if (enviandoId) return;
    setEnviandoId(s.id); setEnvioErro('');
    try {
      // INVARIANTE: só { status: 'entregue' } — SEM adjusted_items (a qtd finalizou na conferência; backend lê quantity_delivered do banco).
      await window.FRApi.put(`/requests/${s.id}/status`, { status: 'entregue' });
      reload();   // card vira 'concluido' (o filtro agora carrega 'entregue')
    } catch (e) {
      const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
      setEnvioErro(gm ? gm(e) : 'Não foi possível confirmar o envio.');   // NÃO baixou; card permanece em trânsito
    } finally { setEnviandoId(null); }
  };
  const tabs = [['todas', 'Todas'], ['em-analise', 'Em Análise'], ['a-separar', 'A Separar'], ['em-transito', 'Em Trânsito'], ['concluido', 'Concluído'], ['recusado', 'Recusado']];
  const count = (k) => (k === 'todas' ? items.length : items.filter((x) => x.status === k).length);
  const q = search.trim().toLowerCase();
  const view = items.filter((x) => !dismissed.has(x.id) && (tipo === 'todos' || (tipo === 'devolucao' ? x.tipo === 'devolucao' : x.tipo !== 'devolucao')) && (filter === 'todas' || x.status === filter) && (!q || x.sol.toLowerCase().includes(q) || x.setor.toLowerCase().includes(q) || x.op.includes(q) || x.itens.some((it) => it.sku.includes(q) || it.nome.toLowerCase().includes(q))));
  const cur = items.find((x) => x.id === openId);

  const Pill = ({ status }) => {
    const mm = SOL_STATUS[status]; const c = uiTone(t, mm.kind);
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', padding: '5px 10px', borderRadius: 8, background: c.bg, color: c.fg }}><Icon name={mm.icon} size={13} /> {mm.label}</span>;
  };

  return (
    <div>
      <PageHeader t={t} title="Solicitações" subtitle="O histórico arquiva automaticamente os pedidos já concluídos."
        actions={<Btn t={t} icon="plus">Nova solicitação</Btn>} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 13, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, marginBottom: 16 }}>
        <Icon name="search" size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Procurar por setor, OP, solicitante ou material…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[['todos', 'Tudo'], ['solicitacao', 'Solicitações'], ['devolucao', 'Devoluções']].map(([k, label]) => { const on = tipo === k; const n = k === 'todos' ? items.length : k === 'devolucao' ? items.filter((x) => x.tipo === 'devolucao').length : items.filter((x) => x.tipo !== 'devolucao').length; return (
          <button key={k} onClick={() => setTipo(k)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: on ? t.accent : t.elevated, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>{label}<span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 7, background: on ? 'rgba(255,255,255,.25)' : t.hover, color: on ? t.onAccent : t.muted }}>{n}</span></button>
        ); })}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {tabs.map(([k, label]) => {
          const on = filter === k;
          return (
            <button key={k} onClick={() => setFilter(k)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: on ? t.accent : t.panel, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>
              {label}<span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 7, background: on ? 'rgba(255,255,255,.25)' : t.hover, color: on ? t.onAccent : t.muted }}>{count(k)}</span>
            </button>
          );
        })}
      </div>

      {envioErro && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, marginBottom: 14, fontSize: 13, fontWeight: 700 }}>
          <Icon name="alert" size={16} />
          <span style={{ flex: 1, minWidth: 0 }}>{envioErro}</span>
          <button onClick={() => setEnvioErro('')} title="Fechar" style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 7, color: uiTone(t, 'red').fg }}><Icon name="x" size={15} /></button>
        </div>
      )}

      {/* Estados de carga da lista REAL (GET /requests) */}
      {loading && (
        <Card t={t} style={{ padding: 26, textAlign: 'center' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: t.muted }}>Carregando solicitações…</div>
        </Card>
      )}
      {!loading && error && (
        <Card t={t} style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>Não foi possível carregar</div>
              <div style={{ fontSize: 12.5, color: t.muted, marginTop: 2 }}>{error}</div>
            </div>
            <Btn t={t} icon="refresh" onClick={reload}>Tentar novamente</Btn>
          </div>
        </Card>
      )}

      {!loading && !error && (<React.Fragment>
      {/* Devoluções da Produção — destacadas e separadas */}
      {view.some((s) => s.tipo === 'devolucao') && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <Icon name="exchange" size={16} style={{ color: uiTone(t, 'amber').fg }} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>Devoluções da Produção</span>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 7, background: uiTone(t, 'amber').bg, color: uiTone(t, 'amber').fg }}>{view.filter((s) => s.tipo === 'devolucao').length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {view.filter((s) => s.tipo === 'devolucao').map((s) => {
              const av = s.sol.split(' ').map((x) => x[0]).slice(0, 2).join('');
              const pend = s.status === 'em-analise';
              return (
                <Card t={t} key={s.id} style={{ padding: 0, overflow: 'hidden', border: `1.5px solid ${frHexToRgba('#f59e0b', 0.5)}`, boxShadow: `0 0 0 4px ${uiTone(t, 'amber').bg}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: uiTone(t, 'amber').bg }}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, background: uiTone(t, 'amber').fg, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="exchange" size={17} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13.5, fontWeight: 850, color: t.text }}>Devolução</span><span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: uiTone(t, 'amber').fg }}>{s.req}</span></div>
                      <div style={{ fontSize: 11.5, color: t.muted }}>Retorno da OP {s.op}</div>
                    </div>
                    {pend ? <Badge t={t} kind="amber" dot>Aguardando</Badge> : <Pill status={s.status} />}
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                      <span style={{ width: 30, height: 30, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{av}</span>
                      <span style={{ fontSize: 12.5, color: t.muted }}><b style={{ color: t.text }}>{s.sol}</b> · {s.setor} · {s.time}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {s.itens.map((it, i) => { const cm = DEV_COND[it.cond] || DEV_COND.bom; return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
                          <span style={{ width: 32, height: 32, borderRadius: 8, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={15} /></span>
                          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{it.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {it.sku}</div></div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 7, background: uiTone(t, cm[1]).bg, color: uiTone(t, cm[1]).fg }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: uiTone(t, cm[1]).fg }} /> {cm[0]}</span>
                          <span style={{ fontSize: 14, fontWeight: 850, color: t.text }}>{it.qtd} <span style={{ fontSize: 11, fontWeight: 600, color: t.muted }}>{it.un || 'un'}</span></span>
                        </div>
                      ); })}
                    </div>
                    {pend ? (
                      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                        <button onClick={() => setStatus(s.id, 'recusado')} style={{ all: 'unset', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, fontSize: 13.5, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="x" size={16} /> Recusar</button>
                        <button onClick={() => setStatus(s.id, 'concluido')} style={{ all: 'unset', cursor: 'pointer', flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: uiTone(t, 'green').fg, color: '#fff', boxShadow: `0 4px 12px ${frHexToRgba('#10b981', 0.3)}` }}><Icon name="check" size={16} /> Aceitar devolução</button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, textAlign: 'center', fontSize: 12.5, fontWeight: 700, background: s.status === 'recusado' ? uiTone(t, 'red').bg : uiTone(t, 'green').bg, color: s.status === 'recusado' ? uiTone(t, 'red').fg : uiTone(t, 'green').fg }}>{s.status === 'recusado' ? 'Devolução recusada' : 'Devolução aceita ✓'}</div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {view.some((s) => s.tipo !== 'devolucao') && tipo !== 'devolucao' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
          <Icon name="file" size={15} style={{ color: t.accentText }} />
          <span style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>Solicitações de material</span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
        {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada por aqui" sub="Não há solicitações neste filtro." /></Card></div>}
        {view.filter((s) => s.tipo !== 'devolucao').map((s) => {
          const av = s.sol.split(' ').map((x) => x[0]).slice(0, 2).join('');
          const cor = uiTone(t, SOL_STATUS[s.status].kind).fg;   // faixa/gradiente na cor do status
          const forte = s.status === 'concluido';
          return (
            <Card t={t} key={s.id} hover style={{ padding: 16, cursor: 'pointer', borderLeft: `5px solid ${cor}`, background: `linear-gradient(90deg, ${frHexToRgba(cor, forte ? 0.2 : 0.07)} 0%, ${frHexToRgba(cor, forte ? 0.08 : 0)} 55%, ${t.panel} 100%)`, borderColor: frHexToRgba(cor, forte ? 0.6 : 0.3) }}>
              <div onClick={() => setOpenId(s.id)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Pill status={s.status} />
                  {s.tipo === 'devolucao' ? <Badge t={t} kind="amber" dot>Devolução</Badge> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.faint, whiteSpace: 'nowrap' }}><Icon name="clock" size={13} /> {s.time}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 14 }}>
                  <span style={{ width: 40, height: 40, borderRadius: '50%', background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{av}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{s.sol}</div>
                    <div style={{ fontSize: 12, color: t.muted }}>{s.setor}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Badge t={t} kind="gray">OP: {s.op}</Badge>
                  {s.status === 'em-transito' && (
                    <button disabled={enviandoId === s.id} onClick={(e) => { e.stopPropagation(); confirmarEnvio(s); }} style={{ all: 'unset', cursor: enviandoId === s.id ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 32, padding: '0 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 800, background: uiTone(t, 'green').fg, color: '#fff', opacity: enviandoId === s.id ? 0.6 : 1 }}>
                      <Icon name="truck" size={14} /> {enviandoId === s.id ? 'Enviando…' : 'Confirmar envio'}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 13, borderTop: `1px solid ${t.border}` }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: t.muted }}><Icon name={s.tipo === 'devolucao' ? 'exchange' : 'box'} size={15} /> {s.itens.length} {s.tipo === 'devolucao' ? (s.itens.length === 1 ? 'item devolvido' : 'itens devolvidos') : (s.itens.length === 1 ? 'item solicitado' : 'itens solicitados')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={(e) => { e.stopPropagation(); remove(s.id); }} title="Remover" style={{ all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={16} /></button>
                  <button onClick={() => setOpenId(s.id)} title="Ver detalhes" style={{ all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: t.accentSoft, color: t.accentText }}><Icon name="chevronRight" size={16} /></button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      </React.Fragment>)}

      {cur && <SolicitacaoDetail t={t} s={cur} onClose={() => setOpenId(null)}
        onApprove={async (adjustedItems) => {
          // status SEMPRE 'aprovado' (vocabulário do backend, não da tela). MEXE EM ESTOQUE.
          await window.FRApi.put(`/requests/${cur.id}/status`, { status: 'aprovado', adjusted_items: adjustedItems });
          setOpenId(null); reload();   // sai de 'aberto' → some daqui, vai p/ Conferência
        }}
        onReject={async (motivo) => {
          await window.FRApi.put(`/requests/${cur.id}/status`, { status: 'rejeitado', rejection_reason: motivo });
          setOpenId(null); reload();
        }} />}
    </div>
  );
}

// Versão SIMPLES histórica (fallback). Renomeada para não fazer sombra sobre a elaborada
// (window.PageMeusPedidos definida em pedidos.jsx). Mantida como referência; não roteada.
function PageMeusPedidosLegacy({ t }) {
  const [items, setItems] = useStateA(MEUS_PEDIDOS);
  const [filter, setFilter] = useStateA('todas');
  const [openId, setOpenId] = useStateA(null);
  const [op, setOp] = useStateA('');
  const [rows, setRows] = useStateA([]);
  const [q, setQ] = useStateA('');
  const [sent, setSent] = useStateA(false);
  const remove = (id) => setItems((xs) => xs.filter((x) => x.id !== id));
  // Catálogo REAL (GET /products adaptado) — substitui o mock MATERIAIS.
  const { items: frProdutos, loading: catLoading, error: catError } = window.useFRProducts();
  const prodBySku = (sku) => frProdutos.find((p) => p.sku === sku);
  const rowName = (r) => r.nome || (prodBySku(r.sku) || {}).nome;
  const ql = q.trim().toLowerCase();
  const filtered = q.trim() ? frProdutos.filter((p) => (p.nome || '').toLowerCase().includes(ql) || (p.sku || '').includes(q.trim())) : [];
  const addMaterial = (p) => { setRows((rs) => (rs.some((r) => r.product_id && r.product_id === p.product_id) ? rs : [...rs, { product_id: p.product_id, sku: p.sku, nome: p.nome, un: p.un, qtd: '1' }])); setQ(''); setSent(false); };
  const updateQ = (i, v) => { setRows((rs) => rs.map((r, j) => (j === i ? { ...r, qtd: v } : r))); setSent(false); };
  const removeRow = (i) => setRows((rs) => rs.filter((_, j) => j !== i));
  const filledNew = rows.filter((r) => parseInt(r.qtd) > 0);
  const totalNew = filledNew.reduce((a, r) => a + (parseInt(r.qtd) || 0), 0);
  const submit = () => {
    if (!filledNew.length) return;
    const novo = { id: Date.now(), req: 'REQ-PED-' + (7700 + Math.floor(Math.random() * 200)), sol: 'Bruno Teixeira', setor: 'Diretoria', op: op.trim() || 's/ OP', status: 'em-analise', time: 'agora', itens: filledNew.map((r) => ({ nome: rowName(r) || 'Material', sku: r.sku, qtd: parseInt(r.qtd) })) };
    setItems((xs) => [novo, ...xs]); setRows([]); setOp(''); setSent(true); setFilter('todas');
  };
  const inp = { boxSizing: 'border-box', height: 42, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 };
  const tabs = [['todas', 'Todos'], ['em-analise', 'Em Análise'], ['a-separar', 'A Separar'], ['concluido', 'Concluídos'], ['recusado', 'Recusados']];
  const count = (k) => (k === 'todas' ? items.length : items.filter((x) => x.status === k).length);
  const view = filter === 'todas' ? items : items.filter((x) => x.status === filter);
  const cur = items.find((x) => x.id === openId);
  const emAnd = items.filter((x) => x.status === 'em-analise' || x.status === 'a-separar').length;

  return (
    <div>
      <PageHeader t={t} title="Meus Pedidos" subtitle="Solicite materiais e acompanhe seus pedidos." />

      <Card t={t} style={{ padding: 22, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ width: 42, height: 42, borderRadius: 12, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="cart" size={21} /></span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>Novo pedido de material</div>
            <div style={{ fontSize: 12.5, color: t.muted }}>Informe a OP e adicione os itens que você precisa.</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lab}>Ordem de Produção (OP)</label>
          <input value={op} onChange={(e) => { setOp(e.target.value); setSent(false); }} placeholder="Ex: OP-00021" style={{ ...inp, maxWidth: 280 }} />
        </div>

        <div style={{ position: 'relative', marginBottom: 14 }}>
          <label style={lab}>Adicionar material</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 14px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
            <Icon name="search" size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar material por nome ou SKU…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
          </label>
          {q.trim() && (
            <div className="fr-scroll" style={{ position: 'absolute', zIndex: 30, top: '100%', left: 0, right: 0, marginTop: 4, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6, maxHeight: 260, overflowY: 'auto' }}>
              {catLoading ? (
                <div style={{ padding: '10px 12px', fontSize: 12, color: t.muted }}>Carregando produtos…</div>
              ) : catError ? (
                <div style={{ padding: '10px 12px', fontSize: 12, color: uiTone(t, 'red').fg }}>{catError}</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '10px 12px', fontSize: 12, color: t.muted }}>Nenhum produto encontrado.</div>
              ) : filtered.map((mt) => {
                const added = rows.some((r) => r.product_id === mt.product_id);
                return (
                  <button key={mt.product_id || mt.sku} disabled={added} onClick={() => addMaterial(mt)} style={{ all: 'unset', boxSizing: 'border-box', cursor: added ? 'default' : 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 9, opacity: added ? 0.55 : 1 }}
                    onMouseEnter={(e) => { if (!added) e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={16} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{mt.nome}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {mt.sku} · {mt.disp} disp.</div></div>
                    {added ? <Badge t={t} kind="green" dot>Adicionado</Badge> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: t.accentText }}><Icon name="plus" size={15} /></span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: '22px', textAlign: 'center', borderRadius: 12, border: `1px dashed ${t.borderStrong}`, color: t.muted, fontSize: 13 }}>Nenhum item adicionado ainda. Busque acima para incluir materiais.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map((r, i) => {
              const nm = rowName(r);
              const notFound = !catLoading && !catError && r.sku.trim() && !nm;   // SKU sem correspondência no catálogo real
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 11, background: t.elevated, border: `1px solid ${notFound ? '#ef4444' : t.border}` }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={16} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm || 'Produto não encontrado'}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {r.sku}</div></div>
                  <input value={r.qtd} onChange={(e) => updateQ(i, e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" style={{ ...inp, width: 76, height: 38, textAlign: 'center' }} />
                  <span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>un</span>
                  <button onClick={() => removeRow(i)} title="Remover" style={{ all: 'unset', cursor: 'pointer', width: 36, height: 36, borderRadius: 9, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}><Icon name="trash" size={16} /></button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: t.muted }}>{filledNew.length > 0 ? <span><b style={{ color: t.text }}>{filledNew.length}</b> itens · <b style={{ color: t.text }}>{totalNew}</b> un</span> : 'Adicione itens ao pedido'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {sent && <Badge t={t} kind="green" dot>Pedido enviado!</Badge>}
            <Btn t={t} icon="check" onClick={submit}>Enviar pedido</Btn>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '4px 0 16px' }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: t.text, letterSpacing: '-.01em' }}>Acompanhe seus pedidos</span>
        <span style={{ fontSize: 12.5, color: t.muted }}>{items.length} no total</span>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} mini icon="clock" label="Em andamento" value={emAnd} kind="amber" />
        <KPI t={t} mini icon="check" label="Concluídos" value={count('concluido')} kind="green" />
        <KPI t={t} mini icon="cart" label="Total de pedidos" value={items.length} kind="accent" />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {tabs.map(([k, label]) => {
          const on = filter === k;
          return (
            <button key={k} onClick={() => setFilter(k)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: on ? t.accent : t.panel, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>
              {label}<span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 7, background: on ? 'rgba(255,255,255,.25)' : t.hover, color: on ? t.onAccent : t.muted }}>{count(k)}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhum pedido" sub="Você ainda não tem pedidos neste filtro." /></Card></div>}
        {view.map((s) => {
          const mm = SOL_STATUS[s.status]; const c = uiTone(t, mm.kind);
          const totalUn = s.itens.reduce((a, it) => a + it.qtd, 0);
          const first = s.itens[0];
          return (
            <Card t={t} key={s.id} hover style={{ padding: 16, cursor: 'pointer' }}>
              <div onClick={() => setOpenId(s.id)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', padding: '5px 10px', borderRadius: 8, background: c.bg, color: c.fg }}><Icon name={mm.icon} size={13} /> {mm.label}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.faint, whiteSpace: 'nowrap' }}><Icon name="clock" size={13} /> {s.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
                  <span style={{ width: 42, height: 42, borderRadius: 12, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="cart" size={20} /></span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{first.nome}{s.itens.length > 1 ? ` +${s.itens.length - 1}` : ''}</div>
                    <div style={{ fontSize: 12, color: t.muted }}>OP {s.op} · {totalUn} un</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 13, borderTop: `1px solid ${t.border}` }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: t.muted }}><Icon name="box" size={15} /> {s.itens.length} {s.itens.length === 1 ? 'item' : 'itens'}</span>
                <button onClick={() => setOpenId(s.id)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: t.accentText, padding: '6px 10px', borderRadius: 9 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.accentSoft; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>Acompanhar <Icon name="chevronRight" size={15} /></button>
              </div>
            </Card>
          );
        })}
      </div>

      {cur && <SolicitacaoDetail t={t} s={cur} mine onClose={() => setOpenId(null)} onCancel={() => { remove(cur.id); setOpenId(null); }} />}
    </div>
  );
}

// Map a nav id to a page. Children ids resolve to their parent's page.
const PAGE_TITLES = {
  tarefas: 'Quadro de Tarefas', eletrica: 'Quadro Elétrica', avisos: 'Avisos', calculadora: 'Calculadora',
  requisicao: 'Requisição', solicitacoes: 'Solicitações', pedidos: 'Meus Pedidos', encomendar: 'Encomendar 3D',
  quadrogestao: 'Quadro Gestão', reposicoes: 'Reposições', confronto: 'Confronto',
  controlesaida: 'Controle de Saída', criticos: 'Críticos', configuracoes: 'Configurações',
  permissoes: 'Permissões', auditoria: 'Auditoria', clientes: 'Clientes e OPs',
  painelti: 'Painel TI', meuschamados: 'Meus Chamados',
  entradas: 'Entradas', relatorios: 'Relatórios', usuarios: 'Usuários',
  'prod-painel': 'Painel', 'prod-montagem': 'Montagem de Máquinas',
};

function renderPage(active, props) {
  // CADEADO (fonte da verdade: window.frIsLocked em data.jsx — FR_LOCKED_PAGES + prefixos dos
  // módulos mock). Intercepta ANTES de qualquer dispatch de módulo ou página, então a tela mock
  // NUNCA é instanciada — nenhum seed carrega, nenhuma chamada de rede dispara. Cobre as abas
  // mock do Estoque/Produção, os módulos mock inteiros (rh-/cp-/dev-/at-/fin-) e as rotas mortas.
  if (active && window.frIsLocked && window.frIsLocked(active)) {
    return <EmDesenvolvimento t={props.t} title={PAGE_TITLES[active] || 'Em Desenvolvimento'} />;
  }
  if (active && active.indexOf('p3d-') === 0) return renderPage3D(active, props);
  if (active && active.indexOf('dev-') === 0) return renderPageDev(active, props);
  if (active && active.indexOf('prod-') === 0) return renderPageProd(active, props);
  if (active && active.indexOf('rh-') === 0) return renderPageRH(active, props);
  if (active && active.indexOf('cp-') === 0) return renderPageCompras(active, props);
  if (active && active.indexOf('at-') === 0) return renderPageAT(active, props);
  if (active && active.indexOf('fin-') === 0) return renderPageFin(active, props);
  if (active === 'soon') return <PagePlaceholder t={props.t} title={props.mod ? props.mod.name : 'Módulo'} />;
  const catalogo = ['catalogo', 'cat-categorias', 'cat-etiquetas', 'cat-movimentacao'];
  if (active === 'cat-produtos') return <PageProdutos {...props} />;
  if (catalogo.includes(active)) return <PageCatalogo {...props} />;
  if (active === 'ent-nfe') return <PageEntradaNova {...props} />;
  if (active === 'ent-reaproveitamento') return <PageEntradaNova {...props} variant="reaproveitamento" />;
  if (active === 'entradas') return <PageEntradas {...props} />;
  if (active === 'saidas') return <PageEntradaNova {...props} variant="saida" />;
  if (active === 'conferencia') return <PageConferencia {...props} />;
  if (active === 'usuarios') return <PageUsuarios {...props} />;
  if (active === 'clientes') return <PageClientes {...props} readOnly={props.mod && props.mod.id === 'producaoger'} />;
  if (active === 'solicitacoes') return <PageSolicitacoes {...props} />;
  if (active === 'pedidos') return <PageMeusPedidos {...props} />;
  if (active === 'meuschamados') return <PageMeusChamados {...props} />;
  if (active === 'relatorios') return <PageRelatorios {...props} />;
  if (active === 'tarefas') return <PageTarefas {...props} />;
  if (active === 'eletrica') return <PageEletrica {...props} />;
  if (active === 'avisos') return <PageAvisos {...props} />;
  if (active === 'calculadora') return <PageCalculadora {...props} />;
  if (active === 'encomendar') return <PageEncomendar {...props} />;
  if (active === 'quadrogestao') return <PageQuadroGestao {...props} />;
  if (active === 'reposicoes') return <PageReposicoes {...props} />;
  if (active === 'devolucaoop') return <PageDevolucaoOP {...props} />;
  if (active === 'confronto') return <PageConfronto {...props} />;
  if (active === 'controlesaida') return <PageControleSaida {...props} />;
  if (active === 'criticos') return <PageCriticos {...props} />;
  if (active === 'permissoes') return <PagePermissoes {...props} />;
  if (active === 'auditoria') return <PageAuditoria {...props} />;
  return <PagePlaceholder t={props.t} title={PAGE_TITLES[active] || 'Página'} />;
}

// PageMeusPedidos NÃO é exposta aqui de propósito: a tela ativa é a elaborada (window.PageMeusPedidos,
// definida em pedidos.jsx, que carrega depois). MEUS_PEDIDOS/SOL_STATUS/SolicitacaoDetail passam a ser
// globais para a elaborada conseguir lê-las em tempo de render (eram privadas deste módulo).
Object.assign(window, { PageEntradas, PageSaidas, PageUsuarios, PageRelatorios, PageEntradaNova, PageSolicitacoes, PagePlaceholder, renderPage, MEUS_PEDIDOS, SOL_STATUS, SolicitacaoDetail });
