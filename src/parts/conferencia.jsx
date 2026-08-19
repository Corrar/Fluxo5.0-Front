// conferencia.jsx — Estoque › Conferência de Envio (bipagem por leitor de código).
// Cada item de uma ordem de separação gera uma etiqueta com código para colar no
// material; no almoxarifado o leitor (keyboard-wedge) preenche o campo e dá a baixa,
// trazendo destino, OP e armazém na hora.

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

const { useState: useStateCf, useRef: useRefCf, useEffect: useEffectCf, useMemo: useMemoCf } = React;

const CF_ACCENT = '#2563eb';

// Unidades que aceitam quantidade fracionada (metro, litro, quilo). Qualquer outra → inteiro
// (default seguro p/ unidades novas/desconhecidas). Espelha DECIMAL_UNITS do backend (requests.controller.ts).
// UNIFICADO no lote V: a régua por unidade vive em `window.FRAdapters.isDecimalUnit`
// (lib/adapters.js), que por sua vez espelha DECIMAL_UNITS do backend. Havia TRÊS cópias deste
// Set no front — esta era uma delas. Fallback local no padrão da casa: se a lib não carregou,
// ninguém quebra, e o default é CONTAGEM (o seguro).
const isDecimalUnit = (un) => {
  const f = window.FRAdapters && window.FRAdapters.isDecimalUnit;
  return f ? f(un) : false;
};
// Alvo da conferência = quantidade APROVADA (delivered ?? requested), já resolvida em `it.qtd`
// pelo adapter. O nome antigo (`pedidaOf`) passou a mentir quando a conferência virou passo da
// aprovação: o teto do conferente é o que foi aprovado, não o que o setor pediu.
const alvoOf = (it) => Number(it && it.qtd) || 0;

// Ordens de separação aprovadas (status a-separar), com armazém de destino.
const CONF_SEED = [
  { id: 5,  req: 'REQ-44C9F210', sol: 'William Souza',  setor: 'Montagem',     op: '88210', armazem: 'Montagem',
    itens: [{ nome: 'Parafuso Sextavado M8', sku: '9.99.0238', qtd: 80, un: 'un' }, { nome: 'Arruela Lisa 8mm', sku: '7.40.0150', qtd: 80, un: 'un' }, { nome: 'Porca Sextavada M8', sku: '2.11.0080', qtd: 80, un: 'un' }] },
  { id: 6,  req: 'REQ-1A8B7C33', sol: 'Davi Miranda',   setor: 'Produção 3D',  op: '54120', armazem: 'Produção 3D',
    itens: [{ nome: 'Filamento PLA Azul 1kg', sku: '3.00.0101', qtd: 4, un: 'un' }] },
  { id: 9,  req: 'REQ-C12F0A92', sol: 'Osmar Ribeiro',  setor: 'Flow',         op: '901001', armazem: 'Usinagem',
    itens: [{ nome: 'Rolamento 6204ZZ', sku: '4.10.0233', qtd: 6, un: 'un' }, { nome: 'Cabo Flexível 2,5mm', sku: '5.20.0099', qtd: 30, un: 'm' }, { nome: 'Arruela Lisa 8mm', sku: '7.40.0150', qtd: 50, un: 'un' }] },
  { id: 10, req: 'REQ-7F30D118', sol: 'Leo Monteiro',   setor: 'Usinagem',     op: '73001', armazem: 'Usinagem',
    itens: [{ nome: 'Chapa Aço 1020 2mm', sku: '1.02.0044', qtd: 3, un: 'ch' }, { nome: 'Tinta Epóxi Cinza 3,6L', sku: '6.30.0012', qtd: 1, un: 'lt' }] },
];

function cfItemCode(req, idx) {
  return 'FR-' + req.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase() + '-' + String(idx + 1).padStart(2, '0');
}

// ===== ALERTA DE CONFERIDO PARADO (decisão e=2) ==============================================
// Ordem em 'conferido' (aqui: 'em-transito') já foi separada e está no balcão esperando o envio.
// Enquanto ela não sai, SEGURA RESERVA: o material aparece indisponível para todo mundo e
// ninguém é avisado. Isto é SÓ VISIBILIDADE — não expira nada, não chama backend, não cria ação.
//
// ⚠⚠ PROXY DECLARADO — LEIA ANTES DE CONFIAR NO NÚMERO ⚠⚠
// N é contado a partir de `requests.created_at`, NÃO do momento em que a ordem entrou em
// 'conferido'. Esse carimbo NÃO EXISTE: `requests` tem exatamente id, requester_id, sector,
// status, rejection_reason, created_at, op_id, client_service_id, version, warehouse_id
// (conferido no catálogo da validação em 12/08/2026). Não há `updated_at` nem `conferred_at`.
// A transição só deixa rastro em `audit_logs`, que esta tela não consome — puxá-lo exigiria
// endpoint novo e a permissão 'logs', que o almoxarife não tem. Ou seja: backend, fora do lote.
//
// A DIREÇÃO DO ERRO É SEGURA, e é por isso que o proxy serve. Toda ordem percorre
// aberto → aprovado → conferido ANTES de chegar aqui, logo `created_at` <= entrada em conferido,
// SEMPRE. Então N(proxy) >= N(real): o aviso pode acender CEDO demais, nunca tarde demais. Para
// um alerta de "isto está parado segurando reserva", falso positivo custa um olhar; falso
// negativo custa reserva presa sem ninguém saber. O erro está do lado certo de propósito.
// No dia em que existir carimbo da transição, troca-se SÓ a fonte de `criadaEm` no adapter —
// nada mais nesta tela precisa mudar.
//
// BORDA: "mais de 7 dias" é ESTRITAMENTE MAIOR. 7 dias exatos NÃO alertam; 8 alertam. A escolha
// é literal ao enunciado da decisão, e está asserida no harness para não virar acidente.
const CF_DIAS_PARADO = 7;

// Dias inteiros decorridos desde `iso`. `agora` é injetável para o harness poder fixar o relógio
// (sem isso, uma prova de "8 dias" seria um teste que depende do dia em que roda).
// Aceita tanto ISO com Z quanto o formato 'YYYY-MM-DD HH:MM:SS' que um `timestamp without time
// zone` pode chegar cru: sem o tratamento, o segundo vira NaN em parte dos motores.
// Skew de fuso é IRRELEVANTE aqui e isso é medido, não torcido: o proxy já erra em dias inteiros
// (created_at vs. transição), então ±3h não move um limiar de 7 dias — mas ainda assim
// normalizamos para não depender do fuso da máquina de quem abre a tela.
function cfDiasDesde(iso, agora) {
  if (!iso) return null;
  let s = iso;
  if (typeof s === 'string' && !/[Tt]/.test(s)) s = s.replace(' ', 'T');
  if (typeof s === 'string' && !/[Zz]|[+-]\d{2}:?\d{2}$/.test(s)) s += 'Z';
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  const base = (agora == null ? Date.now() : agora);
  const dias = Math.floor((base - t) / 86400000);
  // Relógio adiantado no cliente daria negativo; 0 é o piso honesto ("hoje"), nunca um número
  // negativo aparecendo como "parado há -1 dias".
  return dias < 0 ? 0 : dias;
}

// Devolve N (dias) quando a ordem está PARADA, ou null quando não está. Null é o "não alerte":
// quem renderiza pergunta uma coisa só e não repete a regra.
// Só 'em-transito' (backend 'conferido') entra: 'a-separar' ainda está na fila de trabalho e
// 'concluido' já saiu — nenhum dos dois segura reserva no balcão.
function cfParadoDias(o, agora) {
  if (!o || o.status !== 'em-transito') return null;
  const d = cfDiasDesde(o.criadaEm, agora);
  return (d != null && d > CF_DIAS_PARADO) ? d : null;
}

// ---- Barcode (Code128-look, CSS bars) ----
function CfBarcode({ code, height = 56 }) {
  // Padrão denso de barras finas (visual Code 128): ~6 barras por caractere.
  const seq = ('\u0000' + code + code.length + '\u0000');
  const bars = [];
  bars.push({ w: 1, on: true }, { w: 1, on: false }); // quiet/start
  for (let i = 0; i < seq.length; i++) {
    const v = seq.charCodeAt(i) + i * 7;
    for (let k = 0; k < 3; k++) {
      bars.push({ w: ((v >> (k * 2)) & 3) + 1, on: true });
      bars.push({ w: ((v >> (k * 2 + 1)) & 3) + 1, on: false });
    }
  }
  bars.push({ w: 2, on: true }, { w: 1, on: false }, { w: 1, on: true });
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', height, width: '100%', gap: 0, background: '#fff' }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: b.w + ' 0 0', background: b.on ? '#0b0b0b' : 'transparent' }} />
      ))}
    </div>
  );
}

// ===== Integração REAL da Conferência — GET /requests (status backend 'aprovado') =====
// Troca só a FONTE (antes: useFRSolic mock) mantendo o contrato do 'pend' intacto — o scanner
// (codeMap/reqMap/cfItemCode/SKU) casa por o.req e it.sku, que agora vêm do real. Helper de
// rótulo espelhado do pages_admin (local; não exposto no window). store.jsx fica INTOCADO.
function frReqLabelLocal(id) { return 'PED-' + String(id || '').replace(/-/g, '').slice(0, 6).toUpperCase(); }

// Backend status → vocabulário da tela: aprovado = fila de conferência (pend); conferido = aguardando envio (Enviadas, Passo D).
const FR_CONF_STATUS_MAP = { aprovado: 'a-separar', conferido: 'em-transito', entregue: 'concluido' };

function frConfRequestToCard(r) {
  const its = Array.isArray(r.request_items) ? r.request_items : [];
  return {
    id: r.id,
    req: frReqLabelLocal(r.id),
    sol: (r.requester && r.requester.name) || '—',
    setor: r.sector || '—',
    op: r.op_code || '—',
    cliente: r.client_name || 'Sem cliente',   // real: getRequests JOIN clients (NULL → 'Sem cliente')
    armazem: '',                       // /requests não fornece o nome do armazém por ora
    status: FR_CONF_STATUS_MAP[r.status] || 'a-separar',   // aprovado→a-separar (pend); conferido→em-transito (Enviadas/Passo D)
    // PROXY do "parado desde" — ver o bloco CF_DIAS_PARADO. É `created_at` da solicitação, e não
    // a entrada em 'conferido', porque esse carimbo não existe no banco. Já vem no payload do
    // GET /requests (o SELECT é `r.*`), então nada de backend muda por causa disto.
    criadaEm: r.created_at || null,
    itens: its.map((ri) => {
      const qtdPedida = Number(ri.quantity_requested) || 0;
      // Guarda de finitude que o adapter irmão (pages_admin) não precisa ter: LÁ o `enviada` só
      // pinta texto; AQUI ele vira o TETO do clamp de digitação. Um NaN escapando faria
      // Math.min(NaN, n) devolver NaN e o teto sumir. Valor não-numérico → trata como sem ajuste
      // (comportamento de hoje), nunca como zero.
      const dRaw = ri.quantity_delivered;
      const enviada = (dRaw == null || !Number.isFinite(Number(dRaw))) ? null : Number(dRaw);
      return {
        id: ri.id,                       // ri.id REAL — chave do conference_notes
        nome: (ri.products && ri.products.name) || ri.custom_product_name || 'Item',
        sku: (ri.products && ri.products.sku) || '',
        qtdPedida,                       // o que o setor pediu — só contexto, não é mais o alvo
        enviada,                         // null = aprovado integral | número (incl. 0) = cortado na aprovação
        // ALVO DA CONFERÊNCIA. Continua se chamando `qtd` de propósito: TODOS os consumidores
        // desta tela já leem deste campo (teto do clamp, parcial/completo, feed, exibição e o
        // fillAll das etiquetas), então passam a operar sobre a quantidade APROVADA por cascata,
        // sem uma linha de lógica editada.
        // Ler `quantity_requested` aqui era o bug: pedido cortado 4→2 na aprovação chegava na
        // bipagem pedindo 4; o conferente digitava 4 de boa-fé e o concluir regravava
        // delivered=4, RE-RESERVANDO o que a aprovação tinha acabado de liberar.
        qtd: enviada != null ? enviada : qtdPedida,
        un: (ri.products && ri.products.unit) || 'un',
      };
    }),
  };
}

// GET /requests adaptado; mantém 'aprovado' (fila de conferência → pend) e 'conferido' (aguardando envio → Enviadas/Passo D).
function useFRConferencia() {
  const [items, setItems] = useStateCf([]);
  const [loading, setLoading] = useStateCf(true);
  const [error, setError] = useStateCf(null);
  const mounted = useRefCf(true);
  const load = React.useCallback(function () {
    setLoading(true); setError(null);
    window.FRApi.get('/requests', { skipLoading: true })
      .then(function (res) {
        if (!mounted.current) return;
        const rows = Array.isArray(res && res.data) ? res.data : [];
        setItems(rows.filter(function (r) { return r && (r.status === 'aprovado' || r.status === 'conferido'); }).map(frConfRequestToCard));
        setLoading(false);
      })
      .catch(function (e) {
        if (!mounted.current) return;
        const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
        setError(gm ? gm(e) : 'Não foi possível carregar as ordens para conferência.');
        setLoading(false);
      });
  }, []);
  useEffectCf(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);
  // Tempo real: 'request_updated'/'new_request' → recarrega (aprovado novo aparece, concluído sai);
  // e 'stock_updated', porque o ALVO da conferência é a quantidade aprovada e ela vive no saldo.
  // Os três no MESMO scheduleReload: janela única de debounce = 1 GET mesmo quando chegam juntos.
  // O handler ignora o payload (vem com e sem `changedProducts`) — ver lib/stock-refresh.js.
  useEffectCf(function () {
    const FRS = window.FRSocket;
    if (!FRS) return undefined;
    let lastRun = 0; let timer = null;
    const scheduleReload = function () {
      if (!mounted.current || timer) return;
      const since = Date.now() - lastRun;
      const wait = since >= 500 ? 0 : 500 - since;
      timer = setTimeout(function () { timer = null; lastRun = Date.now(); if (mounted.current) load(); }, wait);
    };
    let attached = null;
    const attach = function (sock) {
      if (sock === attached) return;
      if (attached) { attached.off('new_request', scheduleReload); attached.off('request_updated', scheduleReload); attached.off('stock_updated', scheduleReload); }
      attached = sock || null;
      if (attached) { attached.on('new_request', scheduleReload); attached.on('request_updated', scheduleReload); attached.on('stock_updated', scheduleReload); }
    };
    attach(FRS.socket);
    const unsub = FRS.subscribe(function (snap) { attach(snap && snap.socket); });
    return function () {
      if (timer) clearTimeout(timer);
      if (attached) { attached.off('new_request', scheduleReload); attached.off('request_updated', scheduleReload); attached.off('stock_updated', scheduleReload); }
      if (typeof unsub === 'function') unsub();
    };
  }, [load]);
  return { items: items, loading: loading, error: error, reload: load };
}

function ConferenciaEnvioTab({ t, setActive }) {
  const { mobile: cfMob } = (window.useFRViewport ? window.useFRViewport() : { mobile: false });
  const { items: solic, loading, error, reload } = useFRConferencia();
  const [enviando, setEnviando] = useStateCf(false);
  const [enviandoEnvio, setEnviandoEnvio] = useStateCf(null);   // id da solicitação em ENVIO (conferido→entregue), separado do 'enviando' da conferência
  const [biped, setBiped] = useStateCf({});       // { 'id:idx': { qtd:'', just:'' } }
  const [feed, setFeed] = useStateCf([]);
  const [last, setLast] = useStateCf(null);
  const [flash, setFlash] = useStateCf(null);
  const [scanVal, setScanVal] = useStateCf('');
  const [query, setQuery] = useStateCf('');
  const [labelsId, setLabelsId] = useStateCf(null);
  const [activeId, setActiveId] = useStateCf(null);   // solicitação em conferência (bipada primeiro)
  const inputRef = useRefCf(null);
  const flashTimer = useRefCf(null);

  const focusInput = () => { if (inputRef.current) inputRef.current.focus(); };
  useEffectCf(() => { focusInput(); }, []);

  // Captura global do leitor Elgin (keyboard-wedge): o aparelho digita o código
  // em rajada e finaliza com Enter. Detectamos a rajada mesmo sem o campo focado.
  const wedge = useRefCf({ buf: '', last: 0 });

  // Ordens aprovadas aguardando conferência (status a-separar), com bipado derivado do estado local.
  const pend = solic.filter((o) => o.status === 'a-separar' && o.tipo !== 'devolucao')
    .map((o) => ({ ...o, itens: o.itens.map((it, idx) => {
      const b = biped[o.id + ':' + idx];
      const confQtd = b ? b.qtd : '';
      const nq = parseFloat(confQtd);
      const parcial = b && confQtd !== '' && nq < it.qtd;
      const completo = !!b && confQtd !== '' && (nq >= it.qtd || (nq >= 0 && (b.just || '').trim().length > 0));
      return { ...it, bipado: !!b, confQtd, just: b ? b.just : '', parcial, completo, key: o.id + ':' + idx };
    }) }));

  const codeMap = useMemoCf(() => {
    const m = {};
    pend.forEach((o) => o.itens.forEach((it, idx) => { m[cfItemCode(o.req, idx)] = { orderId: o.id, idx }; }));
    return m;
  }, [solic, biped]);

  // mapa de etiquetas de solicitação (volume) → bipar primeiro para escolher a solicitação
  const reqMap = useMemoCf(() => {
    const m = {};
    pend.forEach((o) => { m[String(o.req).toUpperCase()] = o.id; });
    return m;
  }, [solic]);

  useEffectCf(() => {
    const onKey = (e) => {
      const el = e.target;
      const tag = (el && el.tagName || '').toLowerCase();
      if (el === inputRef.current) return;                 // o campo trata o seu Enter
      if (tag === 'input' || tag === 'textarea' || (el && el.isContentEditable)) return; // não atrapalha outros campos
      const w = wedge.current;
      const now = Date.now();
      if (now - w.last > 60) w.buf = '';                    // intervalo grande = digitação humana, reseta
      w.last = now;
      if (e.key === 'Enter') {
        if (w.buf.length >= 3) { handleScan(w.buf); e.preventDefault(); }
        w.buf = '';
        return;
      }
      if (e.key && e.key.length === 1) w.buf += e.key;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [codeMap, reqMap, activeId]);

  const enviadas = solic.filter((o) => o.status === 'em-transito' || o.status === 'concluido');

  // Qtd conferida: clampa 0 ≤ n ≤ ALVO (quantidade aprovada); unidade decimal (M/MT/L/KG) aceita até 2
  // casas, resto é inteiro. O backend revalida (fonte da verdade), mas aqui já bloqueamos na UX.
  // Vazio é permitido (item não tocado) — e é ele que impede o item de entrar em adjusted_items.
  const setConfQtd = (key, raw, it) => {
    const max = alvoOf(it);
    let s = String(raw);
    if (isDecimalUnit(it.un)) {
      s = s.replace(',', '.').replace(/[^0-9.]/g, '');
      const parts = s.split('.');
      s = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('').slice(0, 2) : '');
    } else {
      s = frSanQtd(s);
    }
    const store = (qtd) => setBiped((b) => ({ ...b, [key]: { ...(b[key] || { just: '' }), qtd } }));
    if (s === '' || s === '.') { store(''); return; }
    if (s.endsWith('.')) { store(s); return; }   // estado intermediário "N." — usuário ainda vai digitar a casa
    let n = parseFloat(s);
    if (Number.isNaN(n)) { store(''); return; }
    n = Math.max(0, Math.min(max, n));            // CLAMP 0 ≤ n ≤ pedido
    store(String(n));
  };
  const setJustB = (key, v) => setBiped((b) => ({ ...b, [key]: { ...(b[key] || { qtd: '' }), just: v } }));

  const doFlash = (type, msg) => {
    setFlash({ type, msg });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 2600);
  };

  const handleScan = (raw) => {
    const code = (raw || '').trim().toUpperCase();
    if (!code) return;

    // 1) Bipou a etiqueta de uma SOLICITAÇÃO → seleciona-a para conferência
    if (reqMap[code] != null) {
      const o = pend.find((x) => x.id === reqMap[code]);
      setActiveId(o.id);
      setLast({ order: o, item: null, code, kind: 'order' });
      doFlash('ok', 'Solicitação selecionada: ' + o.req + ' · ' + o.sol);
      return;
    }

    // 2) Bipou um MATERIAL — exige solicitação ativa
    if (activeId == null) {
      doFlash('warn', 'Bipe primeiro a etiqueta da solicitação.');
      return;
    }
    const order = pend.find((o) => o.id === activeId);
    if (!order) { setActiveId(null); doFlash('warn', 'Bipe primeiro a etiqueta da solicitação.'); return; }

    // tenta casar por código de item (FR-…-NN) OU por SKU dentro da solicitação ativa
    const byItem = codeMap[code];
    let idx = byItem && byItem.orderId === order.id ? byItem.idx : order.itens.findIndex((it) => String(it.sku).toUpperCase() === code);

    if (idx < 0) {
      // material existe em outra solicitação? avisa que não condiz
      const elsewhere = pend.some((o) => o.id !== order.id && o.itens.some((it) => String(it.sku).toUpperCase() === code)) || (byItem && byItem.orderId !== order.id);
      doFlash('error', elsewhere ? 'Material não pertence à solicitação atual (' + order.req + ').' : 'Código não reconhecido: ' + code);
      return;
    }
    const item = order.itens[idx];
    const key = order.id + ':' + idx;
    if (biped[key]) { doFlash('warn', 'Item já bipado: ' + item.nome + ' · informe a quantidade conferida'); setLast({ order, item: { ...item, bipado: true }, code, focusKey: key }); return; }
    setBiped((b) => ({ ...b, [key]: { qtd: '', just: '' } }));
    setLast({ order, item: { ...item, bipado: true }, code, focusKey: key });
    setFeed((f) => [{ code, nome: item.nome, sku: item.sku, qtd: item.qtd, un: item.un, setor: order.setor, op: order.op, armazem: order.armazem, ts: nowHm() }, ...f].slice(0, 30));
    doFlash('ok', 'Bipado: ' + item.nome + ' · informe a quantidade conferida');
  };

  const submitScan = () => { handleScan(scanVal); setScanVal(''); focusInput(); };

  const concluir = async (o) => {
    if (enviando) return;   // guard: o PUT muda status no backend
    // Justificativas por item já coletadas inline (setJustB) — envia só as preenchidas.
    const conference_notes = (o.itens || [])
      .filter((it) => (it.just || '').trim() !== '')
      .map((it) => ({ id: it.id, note: it.just.trim() }));
    // Qtd conferida por item (cenário 2): só os itens efetivamente tocados. Já validada no setConfQtd
    // (0 ≤ q ≤ pedido, decimais por unidade); o backend revalida e ajusta a reserva no status 'conferido'.
    const adjusted_items = (o.itens || []).map((it, idx) => {
      const b = biped[o.id + ':' + idx];
      if (!b || b.qtd === '' || b.qtd == null) return null;   // item não conferido → não força ajuste
      const q = parseFloat(b.qtd);
      return Number.isNaN(q) ? null : { id: it.id, quantity_delivered: q };
    }).filter(Boolean);
    setEnviando(true);
    try {
      await window.FRApi.put(`/requests/${o.id}/status`, { status: 'conferido', conference_notes, adjusted_items });
      if (activeId === o.id) setActiveId(null);
      doFlash('ok', 'Conferência concluída · ' + o.req);
      reload();   // sai da lista (deixa de ser 'aprovado'); o socket também recarrega
    } catch (e) {
      const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
      doFlash('error', gm ? gm(e) : 'Não foi possível concluir a conferência.');
    } finally {
      setEnviando(false);
    }
  };

  // Passo D — ENVIO REAL (conferido → entregue → consume/baixa física no backend).
  // Guard anti-duplo-clique OBRIGATÓRIO: mexe em ESTOQUE FÍSICO; duplo envio = baixa dobrada.
  const confirmarEnvio = async (o) => {
    if (enviandoEnvio) return;
    setEnviandoEnvio(o.id);
    try {
      // INVARIANTE: só { status: 'entregue' } — SEM adjusted_items. A qtd finalizou na conferência;
      // o backend lê quantity_delivered do banco e faz o consume (baixa físico + libera reserva).
      await window.FRApi.put(`/requests/${o.id}/status`, { status: 'entregue' });
      doFlash('ok', 'Envio confirmado · ' + o.req);
      reload();   // card sai de 'conferido' → vira entregue/concluído; o socket request_updated também recarrega
    } catch (e) {
      const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
      doFlash('error', gm ? gm(e) : 'Não foi possível confirmar o envio.');
    } finally {
      setEnviandoEnvio(null);
    }
  };

  const totalItens = pend.reduce((s, o) => s + o.itens.length, 0);
  const bipados = pend.reduce((s, o) => s + o.itens.filter((it) => it.completo).length, 0);
  const prontas = pend.filter((o) => o.itens.every((it) => it.completo)).length;
  const view = pend.filter((o) => !query || (o.req + o.sol + o.setor + o.op + o.armazem + o.itens.map((i) => i.nome + i.sku).join(' ')).toLowerCase().includes(query.toLowerCase()));

  const flashTone = flash ? (flash.type === 'ok' ? ['#0b5e3f', '#10b981', 'check'] : flash.type === 'warn' ? ['#7a4e16', '#f59e0b', 'alert'] : ['#7a1f1f', '#ef4444', 'x']) : null;
  const labelOrder = pend.find((o) => o.id === labelsId);

  return (
    <div>
      <style>{`@keyframes cfpop{0%{transform:scale(.96);opacity:.4}60%{transform:scale(1.02)}100%{transform:scale(1);opacity:1}}
        @keyframes cfbeam{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}`}</style>

      <PageHeader t={t} title="Conferência de Envio" subtitle="Bipe a etiqueta de cada material com o leitor Elgin para dar baixa e registrar o envio. O leitor digita o código e confirma automaticamente."
        actions={<Btn t={t} icon="file" variant="ghost" onClick={() => setActive && setActive('solicitacoes')}>Ver solicitações</Btn>} />

      {/* Scan bar */}
      <div onClick={focusInput} style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, padding: 18, marginBottom: 16, cursor: 'text',
        background: `linear-gradient(135deg, #0f1230, #1a1f4d)`, border: `1px solid ${t.border}` }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .5, background: 'linear-gradient(90deg, transparent, rgba(99,160,255,.18), transparent)', width: '40%', animation: 'cfbeam 2.6s linear infinite' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: cfMob ? 10 : 14, flexWrap: cfMob ? 'wrap' : 'nowrap' }}>
          <span style={{ width: cfMob ? 42 : 50, height: cfMob ? 42 : 50, borderRadius: 13, background: 'rgba(99,160,255,.16)', display: 'grid', placeItems: 'center', flexShrink: 0, color: '#9cc0ff' }}>
            <Icon name="barcode" size={cfMob ? 21 : 26} />
          </span>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 0 3px rgba(52,211,153,.25)' }} /> Leitor Elgin conectado · pronto
            </div>
            {/* SÓ PINTURA: o contrato de bipagem (ref/onChange/onKeyDown/submitScan/autoComplete)
                não muda. O 16px no mobile é o limiar que evita o auto-zoom do iOS ao focar. */}
            <input ref={inputRef} value={scanVal} onChange={(e) => setScanVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitScan(); }}
              placeholder="Bipe a etiqueta com o leitor Elgin (ou digite o código)…" autoComplete="off" spellCheck={false}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: cfMob ? 16 : 22, fontWeight: 700, fontFamily: 'ui-monospace, monospace', letterSpacing: '.04em' }} />
          </div>
          <button onClick={(e) => { e.stopPropagation(); submitScan(); }} style={{ all: 'unset', cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 11, fontWeight: 800, fontSize: 14, color: '#0f1230', background: '#9cc0ff', width: cfMob ? '100%' : 'auto', boxSizing: 'border-box' }}>
            <Icon name="check" size={17} /> Conferir
          </button>
        </div>
        {flash && (
          <div style={{ position: 'relative', marginTop: 13, display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', borderRadius: 11, fontWeight: 700, fontSize: 13.5,
            color: '#fff', background: flashTone[1], animation: 'cfpop .22s ease-out' }}>
            <Icon name={flashTone[2]} size={17} /> {flash.msg}
          </div>
        )}
      </div>

      {/* Solicitação ativa em conferência */}
      {(() => {
        const act = pend.find((o) => o.id === activeId);
        if (!act) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: 16, borderRadius: 13, background: 'rgba(245,158,11,.08)', border: `1px solid rgba(245,158,11,.28)`, color: t.text }}>
              <Icon name="barcode" size={18} style={{ color: '#d97706', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Bipe primeiro a <b>etiqueta da solicitação</b> para iniciar a conferência dos materiais.</span>
            </div>
          );
        }
        const tot = act.itens.length, ok = act.itens.filter((it) => it.completo).length, ready = act.itens.every((it) => it.completo);
        const pct = tot ? Math.round((ok / tot) * 100) : 0;
        return (
          <div style={{ padding: '14px 18px', marginBottom: 16, borderRadius: 14, background: t.elevated, border: `1px solid ${ready ? 'rgba(16,185,129,.4)' : CF_ACCENT}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(37,99,235,.14)', color: CF_ACCENT, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="clipboard" size={20} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: t.faint }}>Conferindo agora</div>
                <div style={{ fontSize: 15.5, fontWeight: 850, color: t.text }}>{act.req} <span style={{ fontWeight: 600, color: t.muted, fontSize: 13 }}>· {act.sol} · OP {act.op}</span></div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: ready ? '#10b981' : t.text }}>{ok}/{tot} itens</div>
              <button onClick={() => concluir(act)} disabled={!ready} style={{ all: 'unset', boxSizing: 'border-box', cursor: ready ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, background: ready ? '#10b981' : t.hover, color: ready ? '#fff' : t.faint, boxShadow: ready ? '0 6px 16px rgba(16,185,129,.3)' : 'none', width: cfMob ? 'calc(100% - 52px)' : 'auto' }}>
                <Icon name="truck" size={16} /> Confirmar conferência
              </button>
              <button onClick={() => setActiveId(null)} title="Trocar solicitação" style={{ all: 'unset', cursor: 'pointer', width: 42, height: 42, borderRadius: 11, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}` }}><Icon name="x" size={16} /></button>
            </div>
            <div style={{ height: 6, borderRadius: 6, background: t.hover, overflow: 'hidden', marginTop: 12 }}><div style={{ height: '100%', width: pct + '%', background: ready ? '#10b981' : CF_ACCENT, transition: 'width .3s' }} /></div>
          </div>
        );
      })()}

      {/* KPIs */}
      {/* minmax(0,1fr) e não o 'repeat(2, 1fr)' cru do desenho: com 1fr o mínimo é min-content e os
          nossos rótulos ("Ordens pendentes") estouravam a coluna em 390 — medido 190px de coluna
          num container de 353. Mesmo padrão do grid principal logo abaixo. */}
      <div style={{ display: 'grid', gridTemplateColumns: cfMob ? 'repeat(2, minmax(0,1fr))' : 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <KPI t={t} icon="box" label="Itens a enviar" value={String(totalItens - bipados)} />
        <KPI t={t} icon="check" label="Bipados" value={String(bipados)} tone="green" />
        <KPI t={t} icon="truck" label="Ordens prontas" value={String(prontas)} tone="blue" />
        <KPI t={t} icon="clipboard" label="Ordens pendentes" value={String(pend.length)} tone="amber" />
      </div>

      {/* mesmo motivo do grid dos KPIs: o '1fr' cru do desenho tem mínimo = min-content e o cartão
          "Itens da solicitação" abria a coluna em 452px dentro de 353 (43 elementos fora da tela). */}
      <div style={{ display: 'grid', gridTemplateColumns: cfMob ? 'minmax(0,1fr)' : 'minmax(0,1.05fr) minmax(0,.95fr)', gap: 16, alignItems: 'start' }}>
        {/* Left — itens da solicitação ativa (destaque) + feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(() => {
            const act = pend.find((o) => o.id === activeId);
            if (act) {
              const done = act.itens.filter((it) => it.completo).length, tot = act.itens.length, ready = act.itens.every((it) => it.completo);
              return (
                <Card t={t} style={{ padding: 0, overflow: 'hidden', borderColor: ready ? '#10b981' : CF_ACCENT }}>
                  <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(37,99,235,.14)', color: CF_ACCENT, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="clipboard" size={18} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: t.faint }}>Itens da solicitação</div>
                      <div style={{ fontSize: 15, fontWeight: 850, color: t.text, fontFamily: 'ui-monospace, monospace' }}>{act.req}</div>
                    </div>
                    <Badge t={t} kind={ready ? 'green' : 'blue'}>{done}/{tot} conferido{tot > 1 ? 's' : ''}</Badge>
                  </div>
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {act.itens.map((it, idx) => {
                      const isLast = last && last.focusKey === it.key;
                      const stateColor = it.parcial ? '#f59e0b' : it.completo ? '#10b981' : null;
                      const bg = it.parcial ? 'rgba(245,158,11,.10)' : it.completo ? 'rgba(16,185,129,.10)' : t.subtle;
                      const bd = isLast ? CF_ACCENT : it.parcial ? 'rgba(245,158,11,.5)' : it.completo ? 'rgba(16,185,129,.4)' : t.border;
                      return (
                        <div key={idx} style={{ borderRadius: 13, background: bg, border: `1.5px solid ${bd}`, boxShadow: isLast ? `0 0 0 3px rgba(37,99,235,.16)` : 'none', transition: 'all .2s', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px' }}>
                            <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center', background: stateColor || 'transparent', border: stateColor ? 'none' : `2px solid ${t.faint}`, color: '#fff' }}>{it.completo ? <Icon name="check" size={17} /> : it.parcial ? <Icon name="alert" size={16} /> : <span style={{ fontSize: 13, fontWeight: 800, color: t.faint }}>{idx + 1}</span>}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 15, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.nome}</div>
                              {/* "pedido" virou "a enviar": o número é o APROVADO, e chamá-lo de
                                  pedido é justamente o que fazia o conferente digitar o valor
                                  antigo. Quando houve corte, o pedido original vira hint âmbar. */}
                              <div style={{ fontSize: 12.5, color: t.muted, fontFamily: 'ui-monospace, monospace' }}>
                                {it.sku} · a enviar {it.qtd} {it.un}
                                {it.enviada != null && it.enviada !== it.qtdPedida && (
                                  <span style={{ color: '#b45309', fontWeight: 700 }}> (ajustado de {it.qtdPedida})</span>
                                )}
                              </div>
                            </div>
                            {it.bipado ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                <input value={it.confQtd} onChange={(e) => setConfQtd(it.key, e.target.value, it)} inputMode={isDecimalUnit(it.un) ? 'decimal' : 'numeric'} placeholder="Qtd" autoFocus={isLast}
                                  style={{ width: 64, height: 40, textAlign: 'center', borderRadius: 10, border: `1.5px solid ${it.parcial ? '#f59e0b' : it.completo ? '#10b981' : CF_ACCENT}`, background: t.panel, color: t.text, fontSize: 16, fontWeight: 850, fontFamily: 'inherit', outline: 'none' }} />
                                <span style={{ fontSize: 12, color: t.faint, width: 28 }}>/{it.qtd}</span>
                              </div>
                            ) : (
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>{it.qtd}</div>
                                <div style={{ fontSize: 10.5, fontWeight: 700, color: t.faint, textTransform: 'uppercase' }}>{it.un}</div>
                              </div>
                            )}
                          </div>
                          {it.parcial && (
                            <div style={{ padding: '0 15px 13px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#b45309', marginBottom: 6 }}><Icon name="alert" size={13} /> Quantidade abaixo da aprovada ({it.confQtd} de {it.qtd}). Justifique:</div>
                              <input value={it.just} onChange={(e) => setJustB(it.key, e.target.value)} placeholder="Motivo (ex: estoque insuficiente, avaria…)"
                                style={{ boxSizing: 'border-box', width: '100%', height: 38, borderRadius: 9, border: `1px solid ${(it.just || '').trim() ? t.border : '#f59e0b'}`, background: t.panel, color: t.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', padding: '0 12px' }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderTop: `1px solid ${t.border}` }}>
                    {[['mapPin', act.setor], ['briefcase', 'OP ' + act.op], ['box', act.armazem]].map(([ic, v]) => (
                      <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: t.muted }}><Icon name={ic} size={13} /> {v}</span>
                    ))}
                    <button disabled={!ready} onClick={() => concluir(act)} style={{ all: 'unset', marginLeft: 'auto', cursor: ready ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 11, fontWeight: 800, fontSize: 13.5, color: '#fff', background: ready ? '#10b981' : t.faint, opacity: ready ? 1 : .55 }}>
                      <Icon name="truck" size={16} /> Confirmar conferência
                    </button>
                  </div>
                </Card>
              );
            }
            return (
              <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '13px 18px', borderBottom: `1px solid ${t.border}`, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: t.faint }}>Conferência</div>
                <div style={{ padding: '34px 18px' }}><EmptyState t={t} icon="barcode" title="Aguardando solicitação" sub="Bipe a etiqueta da solicitação para ver e conferir os materiais aqui." /></div>
              </Card>
            );
          })()}

          <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '13px 18px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: t.faint }}>Leituras recentes</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: t.muted }}>{feed.length}</span>
            </div>
            {feed.length === 0 ? <div style={{ padding: '22px 18px', fontSize: 13, color: t.faint, textAlign: 'center' }}>Nenhuma leitura ainda.</div> : (
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {feed.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 18px', borderTop: i ? `1px solid ${t.border}` : 'none' }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,.14)', color: '#10b981', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="check" size={15} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nome} · <span style={{ fontWeight: 800 }}>{f.qtd} {f.un}</span></div>
                      <div style={{ fontSize: 11.5, color: t.faint }}>→ {f.setor} · OP {f.op} · {f.armazem}</div>
                    </div>
                    <span style={{ fontSize: 11.5, color: t.faint, fontFamily: 'ui-monospace, monospace', flexShrink: 0 }}>{f.ts}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right — ordens de separação */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, marginBottom: 14 }}>
            <Icon name="search" size={17} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por OP, setor, material…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {loading && <Card t={t} style={{ padding: 22, textAlign: 'center' }}><div style={{ fontSize: 13, fontWeight: 600, color: t.muted }}>Carregando ordens…</div></Card>}
            {!loading && error && (
              <Card t={t} style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Não foi possível carregar</div>
                    <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{error}</div>
                  </div>
                  <Btn t={t} icon="refresh" onClick={reload}>Tentar novamente</Btn>
                </div>
              </Card>
            )}
            {!loading && !error && view.length === 0 && <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada por aqui" sub="Nenhuma ordem pendente neste filtro." /></Card>}
            {view.map((o) => {
              const done = o.itens.filter((it) => it.completo).length;
              const ready = o.itens.every((it) => it.completo);
              const pct = Math.round((done / o.itens.length) * 100);
              return (
                <Card t={t} key={o.id} style={{ padding: 0, overflow: 'hidden', borderColor: ready ? '#10b981' : t.border }}>
                  <div style={{ padding: '14px 16px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5, fontWeight: 800, color: t.text }}>{o.req}</span>
                      <Badge t={t} kind={ready ? 'green' : 'blue'}>{done}/{o.itens.length} conferido{o.itens.length > 1 ? 's' : ''}</Badge>
                      <span style={{ marginLeft: 'auto', fontSize: 12.5, color: t.muted }}>{o.sol}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {[['mapPin', o.setor], ['briefcase', 'OP ' + o.op], ['box', o.armazem]].map(([ic, v]) => (
                        <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: t.muted, background: t.subtle, border: `1px solid ${t.border}`, borderRadius: 999, padding: '4px 10px' }}><Icon name={ic} size={12} /> {v}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {o.itens.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', borderRadius: 10, background: it.parcial ? 'rgba(245,158,11,.08)' : it.completo ? 'rgba(16,185,129,.08)' : t.subtle, border: `1px solid ${it.parcial ? 'rgba(245,158,11,.4)' : it.completo ? 'rgba(16,185,129,.35)' : t.border}` }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.nome}</div>
                            <div style={{ fontSize: 11, color: t.faint, fontFamily: 'ui-monospace, monospace' }}>{it.sku}</div>
                          </div>
                          {/* Enquanto NÃO se está conferindo, esta linha é a que o Bruno viu mentir
                              na validação (mostrava 4 num item cortado para 2). Com ajuste ela vira
                              o riscado do drawer — mesmo padrão, mesma leitura. Já conferindo,
                              `{digitado}/{alvo}` continua como hoje. */}
                          {(() => {
                            const conferindo = it.bipado && it.confQtd !== '';
                            const temAjuste = it.enviada != null && it.enviada !== it.qtdPedida;
                            return (
                              <span style={{ fontSize: 13, fontWeight: 800, color: it.parcial ? '#b45309' : t.text, flexShrink: 0, display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                                {conferindo ? `${it.confQtd}/${it.qtd}` : temAjuste ? (
                                  <React.Fragment>
                                    <span style={{ fontWeight: 700, color: t.muted, textDecoration: 'line-through' }}>{it.qtdPedida}</span>
                                    <span style={{ color: t.faint }}>→</span>
                                    <span style={{ color: '#b45309' }}>{it.qtd}</span>
                                  </React.Fragment>
                                ) : it.qtd} {it.un}
                              </span>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: 4, background: t.subtle }}><div style={{ height: '100%', width: pct + '%', background: ready ? '#10b981' : CF_ACCENT, transition: 'width .3s' }} /></div>
                  <div style={{ display: 'flex', gap: 8, padding: '11px 16px', borderTop: `1px solid ${t.border}`, flexWrap: 'wrap' }}>
                    <Btn t={t} variant="ghost" icon="barcode" onClick={() => setLabelsId(o.id)}>Etiquetas</Btn>
                    <button disabled={!ready || enviando} onClick={() => concluir(o)} style={{ all: 'unset', marginLeft: 'auto', cursor: (ready && !enviando) ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px', borderRadius: 10, fontWeight: 800, fontSize: 13.5, color: '#fff', background: ready ? '#10b981' : t.faint, opacity: (ready && !enviando) ? 1 : .55 }}>
                      <Icon name="truck" size={16} /> {enviando ? 'Concluindo…' : 'Concluir conferência'}
                    </button>
                  </div>
                </Card>
              );
            })}

            {enviadas.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: t.faint, margin: '6px 2px 8px' }}>Enviadas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {enviadas.map((o) => {
                  // Um cálculo por linha, respondendo "está parado? há quantos dias?". `null` =
                  // segue o visual verde de sempre — o alerta é EXCEÇÃO, não estado padrão.
                  const paradoDias = cfParadoDias(o);
                  return (
                    <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, flexWrap: 'wrap',
                      // Âmbar SUBSTITUI o verde: as duas cores juntas na mesma linha diriam
                      // "concluído" e "atenção" ao mesmo tempo, e a linha perderia as duas leituras.
                      background: paradoDias != null ? 'rgba(245,158,11,.10)' : 'rgba(16,185,129,.07)',
                      border: paradoDias != null ? '1px solid rgba(245,158,11,.45)' : '1px solid rgba(16,185,129,.3)' }}>
                      <span style={{ width: 28, height: 28, borderRadius: 8, background: paradoDias != null ? '#f59e0b' : '#10b981', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Icon name={paradoDias != null ? 'clock' : 'check'} size={15} />
                      </span>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 800, color: t.text }}>{o.req}</span>
                      {paradoDias != null && (
                        // Plural correto: "parado há 1 dia" nunca aparece (o limiar é > 7), mas a
                        // guarda fica porque o limiar é uma constante e pode mudar sem que ninguém
                        // volte aqui para revisar a gramática.
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 9px', borderRadius: 999, background: 'rgba(245,158,11,.18)', border: '1px solid rgba(245,158,11,.45)', color: '#b45309', fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap' }}>
                          <Icon name="clock" size={12} /> parado há {paradoDias} {paradoDias === 1 ? 'dia' : 'dias'}
                        </span>
                      )}
                      <span style={{ fontSize: 12.5, color: t.muted, marginLeft: 'auto' }}>→ {o.armazem} · OP {o.op}</span>
                      {o.status === 'em-transito' && (
                        <button disabled={enviandoEnvio === o.id} onClick={() => confirmarEnvio(o)} style={{ all: 'unset', cursor: enviandoEnvio === o.id ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 14px', borderRadius: 9, fontWeight: 800, fontSize: 12.5, color: '#fff', background: '#10b981', opacity: enviandoEnvio === o.id ? .6 : 1 }}>
                          <Icon name="truck" size={14} /> {enviandoEnvio === o.id ? 'Enviando…' : 'Confirmar envio'}
                        </button>
                      )}
                    </div>
                  );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {labelOrder && <CfLabelsModal t={t} order={labelOrder} onClose={() => { setLabelsId(null); focusInput(); }} onSim={(code) => handleScan(code)} onFlash={doFlash} />}
    </div>
  );
}

// chefe responsável por setor (destino da etiqueta)
const CF_CHEFES = { 'Usinagem': 'Carlos Moura', 'Produção 3D': 'Rafael Souza', 'Elétrica': 'Igor Salles', 'Montagem': 'Ana Paula', 'Desenvolvimento': 'Diego Alves', 'Acabamento': 'Júlia Ramos', 'Almoxarifado': 'Bruno Teixeira' };
function cfChefe(setor) { return CF_CHEFES[setor] || 'Chefe do setor'; }
// cfClienteDaOP REMOVIDA neste lote. Era a última leitora de window.frClienteDaOP/FR_OPS_ATIVAS
// aqui dentro e já estava MORTA: nenhuma chamada no arquivo desde que a etiqueta passou a usar
// `order.cliente` (client_name real, via adapter do GET /requests) — ver o comentário no ponto de
// uso. Mantê-la era guardar um caminho que resolvia cliente pelo seed de 20 nomes fixos.
// Teto do NOME na etiqueta de identificação. Ver frZplTeto: o ^FB sobrepõe, não corta.
const FR_ZPL_NOME_MAX = 150;

// Etiqueta de MATERIAL (identificação) — ZPL 100x60mm @203dpi (800x480), impressão AUTOMÁTICA na ZD220.
// Migrada de window.print()/HTML → Browser Print/ZPL (mesmo caminho do cfPrintVolumes, reusando frSendZplBrowserPrint).
// Layout do Bruno: cabeçalho, SKU grande em destaque, nome do produto, "NF ${nf} · ${data}", barcode Code 128 e SKU legível.
// ^BC codifica o it.sku LITERAL (com pontos) — é exatamente o valor que o handleScan de ITEM casa
// (String(it.sku).toUpperCase() === code). N cópias por item = it.faltam (1 device.send por etiqueta).
// Na Conferência: nf='-' e data=hoje (dd/mm/aaaa, padrão do app).
//
// MAPA VERTICAL (dots; ^LL480 é o limite FÍSICO — 60mm @203dpi = 479, não dá pra aumentar):
//    25..51   cabeçalho "Fluxo Royale"    (A0N,26)
//    70..134  SKU grande                  (A0N,64)   ← identificador primário, intocado
//   142..238  NOME, ATÉ 3 LINHAS          (A0N,26)   ← 96 dots p/ 3 linhas = 32/linha
//   238..262  "NF … · data"               (A0N,24)
//   266..386  barcode Code 128, h=120                ← altura NÃO reduzida de propósito:
//                                                      é tolerância de leitura em ângulo ruim,
//                                                      e a bipagem real é com etiqueta amassada
//                                                      dentro do plástico
//   390..418  SKU legível                 (A0N,28)   ← intocado
//   425..473  banner REAPROVEITADO (só no reuse)     ← sobram 7 dots; NÃO há espaço pra descer nada
//
// ⚠ SE A TERCEIRA LINHA DO NOME ENCOSTAR NO "NF · data": a entrelinha do firmware passou de
// 32 dots. O ajuste é o TERCEIRO parâmetro do ^FB (espaçamento entre linhas, hoje 0 — aceita
// valor negativo pra apertar). NÃO reposicione campo: o ^FO0,238 do NF·data e o ^FO,266 do
// barcode saem de uma conta que já está no limite (4 dots de folga de cada lado do barcode),
// e o banner do reuse termina em 473, a 7 dots do papel. Mexer em ^FO aqui quebra outra coisa.
async function cfPrintIdentificacao(items, onFlash, nf = '-', data = new Date().toLocaleDateString('pt-BR'), opts = {}) {
  const notify = onFlash || function () {};
  // nf e data agora vêm por PARÂMETRO (defaults '-'/hoje preservam a chamada interna da Conferência :735).
  const jobs = [];
  items.forEach((it) => {
    const n = parseInt(it.faltam) || 0;
    if (n <= 0) return;
    const sku = frZplField(it.sku);          // literal, mantém os pontos (só remove ^ e ~)
    if (!sku) return;                        // item sem SKU (custom) → sem barcode válido, pula
    // Teto de 150 chars: 3 linhas de ~53 no ^A0N,26,26 dão ~159 de capacidade. Vale para os DOIS
    // modos do template (NF e reaproveitado) porque `nome` é montado uma vez, aqui.
    const nome = frZplTeto(frZplField(it.nome), FR_ZPL_NOME_MAX);
    // Largura do Code 128 (subset B, cota superior) = (11*len+35)*módulo. Escolhe o MAIOR módulo (4→2)
    // que ainda cabe em 800 com margem (útil 760) e centraliza. Não pode cortar → senão não escaneia.
    const bLen = sku.length;
    let barBY = 4;
    while (barBY > 2 && (11 * bLen + 35) * barBY > 760) barBY--;
    const barW = (11 * bLen + 35) * barBY;
    const barX = Math.max(20, Math.round((800 - barW) / 2));
    // Reaproveitamento (opts.reaproveitado): omite "NF …" (reuse não tem NF) e imprime só a data;
    // adiciona banner reverse-video "REAPROVEITADO" na zona livre y=418-480. Sem opts → NF-mode INALTERADO.
    const linhaInfo = opts.reaproveitado
      ? `^FO0,238^A0N,24,24^FB800,1,0,C^FD${data}^FS`
      : `^FO0,238^A0N,24,24^FB800,1,0,C^FDNF ${nf} · ${data}^FS`;
    const bannerReuse = opts.reaproveitado
      ? `\n^FO0,425^GB800,48,48^FS\n^FO0,432^A0N,30,30^FB800,1,0,C^FR^FDREAPROVEITADO^FS`
      : '';
    const zpl = `^XA
^PW800
^LL480
^CI28
^FO0,25^A0N,26,26^FB800,1,0,C^FDFluxo Royale^FS
^FO0,70^A0N,64,64^FB800,1,0,C^FD${sku}^FS
^FO0,142^A0N,26,26^FB800,3,0,C^FD${nome}^FS
${linhaInfo}
^FO${barX},266^BY${barBY}^BCN,120,N,N,N^FD${sku}^FS
^FO0,390^A0N,28,28^FB800,1,0,C^FD${sku}^FS${bannerReuse}
^XZ`;
    for (let k = 0; k < n; k++) jobs.push(zpl);
  });
  if (!jobs.length) return;
  let printed = 0;
  try {
    for (let i = 0; i < jobs.length; i++) { await frSendZplBrowserPrint(jobs[i]); printed++; }   // 1 send por etiqueta
    notify('ok', printed + (printed === 1 ? ' etiqueta de material enviada' : ' etiquetas de material enviadas') + ' à impressora');
  } catch (e) {
    notify('error', 'Impressão falhou (' + printed + '/' + jobs.length + '): ' + (e && e.message ? e.message : String(e)) + '. Browser Print rodando e a ZD220 ligada?');
  }
}

// Sanitiza texto p/ campo ^FD (remove os control chars ^ e ~ do ZPL).
function frZplField(s) { return String(s == null ? '' : s).replace(/[\^~]/g, ' ').trim(); }

// Teto de comprimento para campo de texto do ZPL. EXISTE PORQUE O ^FB SOBREPÕE O EXCESSO EM VEZ
// DE CORTAR — remover este teto reintroduz a etiqueta ilegível com o nome empilhado sobre si mesmo.
// Corta no último espaço ANTES do limite; nome de palavra única corta no seco, as reticências avisam.
// Reticências em ASCII ('...', não '…'): a fonte residente 0 não garante o glifo U+2026.
function frZplTeto(s, max) {
  const t = String(s == null ? '' : s);
  if (t.length <= max) return t;
  const corte = t.slice(0, max);
  const esp = corte.lastIndexOf(' ');
  return (esp > 0 ? corte.slice(0, esp) : corte).replace(/[\s.,;:/-]+$/, '') + '...';
}

// Envia UM ZPL pro Browser Print (SDK window.BrowserPrint se presente; senão fallback serviço local 9100). Retorna Promise.
function frSendZplBrowserPrint(zpl) {
  return new Promise(function (resolve, reject) {
    const BP = window.BrowserPrint;
    if (BP && typeof BP.getDefaultDevice === 'function') {
      BP.getDefaultDevice('printer',
        function (device) {
          if (!device) { reject(new Error('nenhuma impressora padrão no Browser Print')); return; }
          device.send(zpl, function () { resolve(); }, function (err) { reject(new Error(err || 'falha no envio (SDK)')); });
        },
        function (err) { reject(new Error(err || 'Browser Print indisponível (o serviço está rodando?)')); }
      );
      return;
    }
    var base = 'http://127.0.0.1:9100';
    fetch(base + '/default?type=printer')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status + ' em /default'); return r.json(); })
      .then(function (device) {
        if (!device || (!device.uid && !device.name)) throw new Error('nenhuma impressora padrão no Browser Print');
        return fetch(base + '/write', { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify({ device: device, data: zpl }) })
          .then(function (w) { if (!w.ok) throw new Error('HTTP ' + w.status + ' em /write'); });
      })
      .then(resolve)
      .catch(function (e) { reject(new Error((e && e.message ? e.message : String(e)) + ' (serviço local 9100)')); });
  });
}

// Etiqueta da SOLICITAÇÃO (volumes) — ZPL 100x60mm @203dpi, impressão AUTOMÁTICA na ZD220.
// Migrado de window.print()/HTML: mesmo layout provado no teste, com dados REAIS.
// N cópias: 1 device.send por volume, com VOLUME variando (k/n).
// ^BC codifica order.req COMPLETO ('PED-XXXXXX') — é o valor que o reqMap da Conferência casa.
async function cfPrintVolumes(order, qtd, onFlash) {
  const notify = onFlash || function () {};
  const n = Math.max(1, parseInt(qtd) || 1);
  const cliente = frZplField(order.cliente || 'Sem cliente');
  const destino = frZplField(order.sol) || '—';   // DESTINO = nome do solicitante (requester.name); vazio → '—'
  const op = frZplField(order.op);
  const armazem = frZplField(order.setor);
  const req = frZplField(order.req);
  // Centraliza o Code 128 em ^PW800 e garante que CABE (a ^BY5 o req completo 'PED-XXXXXX' estourava
  // os 800 dots e era cortado → ilegível). Largura Code128 (subset B, cota superior) = (11*len+35)*módulo.
  const barBY = 4;
  const barW = (11 * req.length + 35) * barBY;
  const barX = Math.max(20, Math.round((800 - barW) / 2));
  const zplVolume = (k) => `^XA
^PW800
^LL480
^CI28
^FO0,20^A0N,26,26^FB800,1,0,C^FDFLUXO ROYALE - SEPARACAO^FS
^FO0,65^A0N,58,58^FB800,1,0,C^FD${cliente}^FS
^FO40,150^A0N,20,20^FDOP^FS
^FO40,178^A0N,32,32^FD${op}^FS
^FO230,150^A0N,20,20^FDDESTINO^FS
^FO230,178^A0N,28,28^FD${destino}^FS
^FO460,150^A0N,20,20^FDARMAZEM^FS
^FO460,178^A0N,28,28^FD${armazem}^FS
^FO680,150^A0N,20,20^FDVOLUME^FS
^FO680,178^A0N,32,32^FD${k} / ${n}^FS
^FO${barX},240^BY${barBY}^BCN,120,N,N,N^FD${req}^FS
^FO0,380^A0N,28,28^FB800,1,0,C^FD${req}^FS
^XZ`;
  try {
    for (let k = 1; k <= n; k++) {
      await frSendZplBrowserPrint(zplVolume(k));   // 1 send por volume
    }
    notify('ok', n + (n === 1 ? ' etiqueta enviada' : ' etiquetas enviadas') + ' à impressora · ' + order.req);
  } catch (e) {
    notify('error', 'Impressão falhou: ' + (e && e.message ? e.message : String(e)) + '. Browser Print rodando e a ZD220 ligada?');
  }
}

function CfLabelsModal({ t, order, onClose, onSim, onFlash }) {
  const [step, setStep] = useStateCf('ident');
  const [faltam, setFaltam] = useStateCf(() => order.itens.map(() => ''));
  const [vol, setVol] = useStateCf(String(order.itens.length || 1));
  const setQ = (i, v) => setFaltam((xs) => xs.map((x, j) => (j === i ? frSanQtd(v) : x)));
  const fillAll = () => setFaltam(order.itens.map((it) => String(it.qtd)));
  const clearAll = () => setFaltam(order.itens.map(() => '0'));
  const total = faltam.reduce((s, v) => s + (parseInt(v) || 0), 0);
  const n = Math.max(1, parseInt(vol) || 1);
  const cliente = order.cliente || 'Sem cliente';   // real (client_name via adapter); sem mock cfClienteDaOP
  const chefe = order.sol || '—';   // DESTINO na prévia = solicitante (igual ao ZPL impresso)
  const code = order.req;
  const avancar = () => {
    const items = order.itens.map((it, i) => ({ ...it, faltam: parseInt(faltam[i]) || 0 })).filter((it) => it.faltam > 0);
    if (items.length) cfPrintIdentificacao(items, onFlash);
    setStep('volume');
  };
  const inp = { width: 76, height: 40, textAlign: 'center', borderRadius: 10, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 16, fontWeight: 800, fontFamily: 'inherit', outline: 'none' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,10,24,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(620px, 96vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.border}`, borderRadius: 18, boxShadow: '0 30px 70px -20px rgba(0,0,0,.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(37,99,235,.14)', color: CF_ACCENT, display: 'grid', placeItems: 'center' }}><Icon name="barcode" size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text }}>{step === 'ident' ? 'Etiquetas de identificação' : 'Etiqueta da solicitação · Volumes'}</div>
            <div style={{ fontSize: 12.5, color: t.muted }}>{order.req} · {cliente} · OP {order.op}</div>
          </div>
          {/* steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, background: step === 'ident' ? CF_ACCENT : 'rgba(37,99,235,.16)', color: step === 'ident' ? '#fff' : CF_ACCENT }}>1</span>
            <span style={{ width: 16, height: 2, background: t.border }} />
            <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, background: step === 'volume' ? CF_ACCENT : 'rgba(37,99,235,.16)', color: step === 'volume' ? '#fff' : CF_ACCENT }}>2</span>
          </div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={18} /></button>
        </div>

        {step === 'ident' ? (
          <>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,.1)', border: `1px solid rgba(245,158,11,.3)` }}>
                <Icon name="alert" size={17} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12.5, color: t.text, lineHeight: 1.5 }}>Todos os produtos já possuem <b>etiqueta de identificação</b>? Informe, em cada item, <b>quantas etiquetas faltam</b>. As que faltam serão impressas no padrão de entrada (sem NF).</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={fillAll} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: CF_ACCENT, padding: '7px 11px', borderRadius: 9, background: 'rgba(37,99,235,.1)' }}><Icon name="copy" size={13} /> Nenhum tem etiqueta (1 por unidade)</button>
                <button onClick={clearAll} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: t.muted, padding: '7px 11px', borderRadius: 9, background: t.elevated, border: `1px solid ${t.border}` }}><Icon name="check" size={13} /> Todos já identificados</button>
              </div>
            </div>
            <div className="fr-scroll" style={{ overflowY: 'auto', flex: 1, padding: '12px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10, padding: '6px 4px 10px', fontSize: 10.5, fontWeight: 800, letterSpacing: '.05em', color: t.faint, textTransform: 'uppercase' }}>
                <div>Produto</div><div style={{ textAlign: 'center' }}>Faltam</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {order.itens.map((it, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10, alignItems: 'center', padding: '11px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.nome}</div>
                      <div style={{ fontSize: 11.5, color: t.muted }}>SKU {it.sku} · {it.qtd} {it.un || 'un'}</div>
                    </div>
                    <input value={faltam[i]} onChange={(e) => setQ(i, e.target.value)} inputMode="numeric" placeholder="0" style={{ ...inp, justifySelf: 'center' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 12.5, color: t.muted }}>{total > 0 ? <>Serão impressas <b style={{ color: t.text }}>{total}</b> {total === 1 ? 'etiqueta' : 'etiquetas'} de identificação.</> : 'Todos os itens já identificados.'}</div>
              <button onClick={avancar} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, height: 46, padding: '0 22px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: CF_ACCENT, color: '#fff', boxShadow: '0 6px 16px rgba(37,99,235,.3)' }}>
                <Icon name={total > 0 ? 'barcode' : 'chevronRight'} size={17} /> {total > 0 ? 'Imprimir e avançar' : 'Avançar'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="fr-scroll" style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 18, padding: '14px 16px', borderRadius: 13, background: t.elevated, border: `1px solid ${t.border}` }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>Quantidade de volumes</div>
                  <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Define quantas etiquetas serão impressas · preenche o campo Volume.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setVol(String(Math.max(1, n - 1)))} style={{ all: 'unset', cursor: 'pointer', width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', fontSize: 20, color: t.text, border: `1px solid ${t.border}` }}>–</button>
                  <input value={vol} onChange={(e) => setVol(frSanQtd(e.target.value))} inputMode="numeric" style={{ width: 70, height: 44, textAlign: 'center', borderRadius: 11, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 20, fontWeight: 850, fontFamily: 'inherit', outline: 'none' }} />
                  <button onClick={() => setVol(String(n + 1))} style={{ all: 'unset', cursor: 'pointer', width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', fontSize: 20, color: CF_ACCENT, border: `1px solid ${t.border}` }}>+</button>
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase', marginBottom: 8 }}>Pré-visualização</div>
              <div style={{ margin: '0 auto', width: 300, maxWidth: '100%', boxSizing: 'border-box', background: '#fff', borderRadius: 8, padding: 8 }}>
                <div style={{ border: '1px solid #222', borderRadius: 6, padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src={window.__asset ? window.__asset('assets/logo-royale.png') : 'assets/logo-royale.png'} alt="" style={{ width: 15, height: 15, objectFit: 'contain' }} onError={(e) => (e.target.style.display = 'none')} />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: '#1a1f4d', textTransform: 'uppercase' }}>Fluxo Royale · Separação</span>
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 850, color: '#0b0b0b', lineHeight: 1.1 }}>{cliente}</div>
                  <div style={{ display: 'flex', gap: 13, fontSize: 11, color: '#444' }}>
                    <div><div style={{ fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: '#888' }}>OP</div><b style={{ fontSize: 13, color: '#0b0b0b' }}>{order.op}</b></div>
                    <div><div style={{ fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: '#888' }}>Destino</div><b style={{ fontSize: 13, color: '#0b0b0b' }}>{chefe}</b></div>
                    <div><div style={{ fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: '#888' }}>Armazém</div><b style={{ fontSize: 13, color: '#0b0b0b' }}>{order.setor}</b></div>
                    <div><div style={{ fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: '#888' }}>Volume</div><b style={{ fontSize: 13, color: '#0b0b0b' }}>1 / {n}</b></div>
                  </div>
                  <CfBarcode code={code} height={48} />
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.2em', color: '#0b0b0b', fontFamily: 'ui-monospace, monospace' }}>{code}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <button onClick={() => setStep('ident')} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: t.muted }}><Icon name="chevronLeft" size={16} /> Voltar</button>
              <Btn t={t} icon="barcode" onClick={() => { cfPrintVolumes(order, n, onFlash); onClose(); }}>Imprimir {n} etiqueta{n === 1 ? '' : 's'} de volume</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function nowHm() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// ==========================================================================================
// ABA DEVOLUÇÕES (peça 3) — fila de conferência dos pedidos de devolução (op_returns_pending).
// Conferir credita os 3 livros (per-OP, físico central POOLED, op_returns) e abate o custo da OP;
// rejeitar não credita nada. GET /stock/returns/pending · PUT .../:id/confer · PUT .../:id/reject.
// ==========================================================================================
const dvErr = (e) => { const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage; return g ? g(e) : (e && e.message) || 'Erro inesperado.'; };
const dvNotify = (titulo, txt, tone, icon) => window.dispatchEvent(new CustomEvent('fr-notify', { detail: { titulo, txt, tone, icon } }));
const dvDate = (iso) => { if (!iso) return ''; try { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };

function useDvPending() {
  const [items, setItems] = useStateCf([]);
  const [loading, setLoading] = useStateCf(true);
  const [error, setError] = useStateCf(null);
  const mounted = useRefCf(true);
  const load = React.useCallback(function () {
    setError(null);
    window.FRApi.get('/stock/returns/pending', { skipLoading: true })
      .then(function (res) { if (!mounted.current) return; setItems(Array.isArray(res && res.data) ? res.data : []); setLoading(false); })
      .catch(function (e) { if (!mounted.current) return; setError(dvErr(e)); setLoading(false); });
  }, []);
  useEffectCf(function () { mounted.current = true; load(); return function () { mounted.current = false; }; }, [load]);
  return { items: items, loading: loading, error: error, reload: load };
}

// Linha de um item pendente: conferir (qtd editável pra menos, 1..enviada) ou rejeitar (com motivo).
function DvConfItemRow({ t, it, busy, onConfer, onReject }) {
  const [qty, setQty] = useStateCf(String(it.quantity));
  const [rejecting, setRejecting] = useStateCf(false);
  const [reason, setReason] = useStateCf('');
  const clampQty = (raw) => {
    let s = String(raw).replace(',', '.').replace(/[^0-9.]/g, '');
    if (s === '' || s === '.') return '';
    let n = parseFloat(s);
    if (Number.isNaN(n)) return '';
    n = Math.max(0, Math.min(Number(it.quantity) || 0, n));
    return String(n);
  };
  const confVal = parseFloat(qty);
  const canConfer = !busy && confVal > 0 && confVal <= (Number(it.quantity) || 0);
  return (
    <div style={{ borderRadius: 12, background: t.subtle, border: `1px solid ${t.border}`, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 170 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{it.name}</div>
          <div style={{ fontSize: 11.5, color: t.faint, fontFamily: 'ui-monospace, monospace' }}>{it.sku} · enviada {it.quantity} {it.unit || ''}{it.requested_by_name ? ' · ' + it.requested_by_name : ''}{it.created_at ? ' · ' + dvDate(it.created_at) : ''}</div>
          {it.observation && <div style={{ fontSize: 11.5, color: t.muted, marginTop: 3 }}>“{it.observation}”</div>}
        </div>
        {!rejecting && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: t.faint }}>Conferir</span>
            <input value={qty} onChange={(e) => setQty(clampQty(e.target.value))} inputMode="decimal"
              style={{ width: 58, height: 38, textAlign: 'center', borderRadius: 9, border: `1.5px solid ${canConfer ? '#10b981' : t.border}`, background: t.panel, color: t.text, fontSize: 15, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
            <span style={{ fontSize: 12, color: t.faint, width: 30 }}>/{it.quantity}</span>
            <button disabled={!canConfer} onClick={() => onConfer(it, confVal)} style={{ all: 'unset', cursor: canConfer ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px', borderRadius: 9, fontWeight: 800, fontSize: 12.5, color: '#fff', background: '#10b981', opacity: canConfer ? 1 : 0.5 }}>
              <Icon name="check" size={15} /> {busy ? '…' : 'Conferir'}
            </button>
            <button disabled={busy} onClick={() => setRejecting(true)} title="Rejeitar" style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', width: 38, height: 38, borderRadius: 9, display: 'grid', placeItems: 'center', color: '#ef4444', border: `1px solid ${t.border}`, opacity: busy ? 0.5 : 1 }}><Icon name="ban" size={16} /></button>
          </div>
        )}
      </div>
      {rejecting && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo da rejeição (ex.: material não chegou, avariado…)" autoFocus
            style={{ flex: 1, minWidth: 200, height: 38, borderRadius: 9, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', padding: '0 12px' }} />
          <button disabled={busy} onClick={() => onReject(it, reason.trim())} style={{ all: 'unset', cursor: busy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px', borderRadius: 9, fontWeight: 800, fontSize: 12.5, color: '#fff', background: '#ef4444', opacity: busy ? 0.6 : 1 }}><Icon name="ban" size={15} /> Confirmar rejeição</button>
          <button disabled={busy} onClick={() => { setRejecting(false); setReason(''); }} style={{ all: 'unset', cursor: 'pointer', height: 38, padding: '0 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: t.muted, border: `1px solid ${t.border}` }}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

function DevolucoesConfTab({ t }) {
  const { items, loading, error, reload } = useDvPending();
  const [busyId, setBusyId] = useStateCf(null);

  const confer = async (it, conferredQty) => {
    if (busyId) return;
    setBusyId(it.id);
    try {
      await window.FRApi.put('/stock/returns/' + it.id + '/confer', { conferredQty });
      dvNotify('Devolução conferida', 'Estoque creditado, custo da OP abatido', 'green', 'check');
      reload();
    } catch (e) { dvNotify('Erro ao conferir', dvErr(e), 'red', 'x'); }
    finally { setBusyId(null); }
  };
  const reject = async (it, reason) => {
    if (busyId) return;
    setBusyId(it.id);
    try {
      await window.FRApi.put('/stock/returns/' + it.id + '/reject', { reason });
      dvNotify('Devolução rejeitada', reason || '—', 'red', 'x');
      reload();
    } catch (e) { dvNotify('Erro ao rejeitar', dvErr(e), 'red', 'x'); }
    finally { setBusyId(null); }
  };

  // Agrupa os pendentes por OP (um card por OP, listando os itens).
  const groups = {};
  items.forEach((it) => { const k = it.op_code || '—'; (groups[k] = groups[k] || []).push(it); });
  const opCodes = Object.keys(groups);

  return (
    <div>
      <PageHeader t={t} title="Devoluções — Conferência" subtitle="Confira ou rejeite o material devolvido pelos setores. Conferir credita o estoque central e abate o custo da OP; rejeitar não credita nada."
        actions={<Btn t={t} icon="refresh" onClick={reload}>Atualizar</Btn>} />
      {loading && <Card t={t} style={{ padding: 22, textAlign: 'center' }}><div style={{ fontSize: 13, fontWeight: 600, color: t.muted }}>Carregando devoluções…</div></Card>}
      {!loading && error && (
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Não foi possível carregar</div><div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{error}</div></div>
            <Btn t={t} icon="refresh" onClick={reload}>Tentar novamente</Btn>
          </div>
        </Card>
      )}
      {!loading && !error && opCodes.length === 0 && <Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhuma devolução pendente" sub="Quando um setor registrar uma devolução, ela aparece aqui para conferência." /></Card>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {opCodes.map((op) => {
          const rows = groups[op];
          return (
            <Card t={t} key={op} style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: uiTone(t, 'amber').bg, color: uiTone(t, 'amber').fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="exchange" size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: t.faint }}>Devolução · OP</div>
                  <div style={{ fontSize: 15, fontWeight: 850, color: t.text, fontFamily: 'ui-monospace, monospace' }}>{op}</div>
                </div>
                <Badge t={t} kind="amber">{rows.length} {rows.length === 1 ? 'item' : 'itens'}</Badge>
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rows.map((it) => <DvConfItemRow key={it.id} t={t} it={it} busy={busyId === it.id} onConfer={confer} onReject={reject} />)}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Wrapper com abas: "Conferência de Envio" (tela original, intocada) | "Devoluções" (nova).
function PageConferencia({ t, setActive }) {
  const [tab, setTab] = useStateCf('envio');
  const [pendCount, setPendCount] = useStateCf(null);
  useEffectCf(function () {
    let alive = true;
    window.FRApi.get('/stock/returns/pending', { skipLoading: true })
      .then(function (res) { if (alive) setPendCount(Array.isArray(res && res.data) ? res.data.length : 0); })
      .catch(function () { if (alive) setPendCount(null); });
    return function () { alive = false; };
  }, [tab]);
  const TABS = [['envio', 'Conferência de Envio'], ['devolucoes', 'Devoluções']];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map(function (pair) {
          const k = pair[0], label = pair[1], on = tab === k, n = k === 'devolucoes' ? pendCount : null;
          return (
            <button key={k} onClick={() => setTab(k)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 11, fontSize: 13.5, fontWeight: 700, background: on ? t.accent : t.elevated, color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>
              {label}{n != null && n > 0 && <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 7, background: on ? 'rgba(255,255,255,.25)' : uiTone(t, 'amber').bg, color: on ? '#fff' : uiTone(t, 'amber').fg }}>{n}</span>}
            </button>
          );
        })}
      </div>
      {tab === 'envio' ? <ConferenciaEnvioTab t={t} setActive={setActive} /> : <DevolucoesConfTab t={t} />}
    </div>
  );
}

// cfPrintIdentificacao/frSendZplBrowserPrint/frZplField exportados p/ a Entrada por NF reusar o caminho ZPL
// (PageEntradaNova em pages_admin.jsx). São module-level: a Conferência continua chamando os locais — sem mudança.
//
// cfDiasDesde/cfParadoDias/CF_DIAS_PARADO saem para o WINDOW por um motivo só: são a REGRA do
// alerta de parado, e regra sem prova é opinião. Expostos, o harness assere a borda (7 não, 8 sim)
// com o relógio FIXO — o que um teste que dependesse do dia de execução não conseguiria fazer.
// São funções PURAS e sem estado; nada nesta tela lê do window (a renderização chama as locais).
Object.assign(window, { PageConferencia, cfPrintIdentificacao, frSendZplBrowserPrint, frZplField, cfDiasDesde, cfParadoDias, CF_DIAS_PARADO });
