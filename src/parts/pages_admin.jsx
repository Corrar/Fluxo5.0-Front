// pages_admin.jsx — Entradas, Saídas, Usuários, Relatórios, Placeholder + router.
const { useState: useStateA } = React;

const MATERIAIS = [
  { sku: '9.99.0238', nome: 'Parafuso Sextavado M8', disp: '320 un' },
  { sku: '1.02.0044', nome: 'Chapa Aço 1020 2mm',    disp: '12 ch' },
  { sku: '3.00.0101', nome: 'Filamento PLA Azul 1kg', disp: '8 un' },
  { sku: '4.10.0233', nome: 'Rolamento 6204ZZ',      disp: '54 un' },
  { sku: '5.20.0099', nome: 'Cabo Flexível 2,5mm',   disp: '240 m' },
  { sku: '6.30.0012', nome: 'Tinta Epóxi Cinza 3,6L', disp: '5 lt' },
  { sku: '2.11.0080', nome: 'Porca Sextavada M8',    disp: '410 un' },
  { sku: '7.40.0150', nome: 'Arruela Lisa 8mm',      disp: '880 un' },
];
const ARMAZENS = ['Almoxarifado Central', 'Usinagem', 'Produção 3D', 'Elétrica', 'Montagem', 'Expedição'];

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
// Abre janela de impressão com N etiquetas por item.
function frPrintEtiquetas(items, nf) {
  const data = new Date().toLocaleDateString('pt-BR');
  const logo = (window.__asset ? window.__asset('assets/logo-royale.png') : 'assets/logo-royale.png');
  const labels = [];
  items.forEach((it) => {
    const n = parseInt(it.etiq != null && it.etiq !== '' ? it.etiq : it.qtd) || 0;
    for (let k = 0; k < n; k++) {
      const bars = frBarcode128(it.sku).map((b) => `<i style="display:inline-block;width:${b.w * 1.6}px;height:50px;background:${b.on ? '#000' : '#fff'}"></i>`).join('');
      labels.push(`<div class="lbl"><div class="frame">
        <div class="brand"><img src="${logo}" alt=""/><span>Fluxo Royale</span></div>
        <div class="code">${it.sku}</div>
        <div class="desc">${(it.nome || 'Material').replace(/</g, '&lt;')}</div>
        <div class="meta">NF ${nf || '—'} &nbsp;·&nbsp; ${data}</div>
        <div class="bars">${bars}</div>
        <div class="bcode">${it.sku}</div>
      </div></div>`);
    }
  });
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Etiquetas · NF ${nf || ''}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;background:#eee;padding:10px}
    .sheet{display:flex;flex-wrap:wrap;gap:8px}
    .lbl{width:280px;height:168px;background:#fff;border-radius:6px;padding:8px;page-break-inside:avoid}
    .frame{width:100%;height:100%;border:1px solid #222;border-radius:5px;padding:10px 12px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center}
    .brand{display:flex;align-items:center;gap:6px;opacity:.85}
    .brand img{width:16px;height:16px;object-fit:contain}
    .brand span{font-size:10px;font-weight:700;letter-spacing:.5px;color:#222}
    .code{font-size:23px;font-weight:800;letter-spacing:.5px;line-height:1}
    .desc{font-size:12.5px;font-weight:600;line-height:1.25;max-height:32px;overflow:hidden}
    .meta{font-size:11px;color:#444}
    .bars{display:flex;align-items:flex-end;justify-content:center;flex-wrap:nowrap;height:52px;overflow:hidden;background:#fff;padding:0 10px}
    .bcode{font-size:11px;letter-spacing:3px;font-family:monospace}
    @media print{body{background:#fff;padding:0}.frame{border:1px solid #000}}
  </style></head><body>
  <div class="sheet">${labels.join('')}</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},350)}<\/script>
  </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.open(); w.document.write(html); w.document.close(); }
}

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
  const [rows, setRows] = useStateA([{ sku: '', qtd: '', etiq: '', etiqT: false }, { sku: '', qtd: '', etiq: '', etiqT: false }, { sku: '', qtd: '', etiq: '', etiqT: false }]);
  const [drag, setDrag] = useStateA(false);
  const [done, setDone] = useStateA(false);
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
  const importSample = () => { setRows([['9.99.0238', 320], ['1.02.0044', 12], ['4.10.0233', 54], ['5.20.0099', 240], ['3.00.0101', 8]].map(([sku, qtd]) => ({ sku, qtd: String(qtd), etiq: String(qtd), etiqT: false }))); setDone(false); };
  const [q, setQ] = useStateA('');
  const [review, setReview] = useStateA(false);
  const nameForSku = (sku) => (MATERIAIS.find((m) => m.sku === sku) || {}).nome;
  const filtered = q.trim() ? MATERIAIS.filter((m) => m.nome.toLowerCase().includes(q.toLowerCase()) || m.sku.includes(q)) : [];
  const addMaterial = (sku) => {
    setRows((rs) => {
      if (rs.some((r) => r.sku === sku)) return rs;
      const idx = rs.findIndex((r) => !r.sku.trim());
      if (idx >= 0) return rs.map((r, j) => (j === idx ? { ...r, sku } : r));
      return [...rs, { sku, qtd: '' }];
    });
    setQ(''); setDone(false);
  };
  const inp = { boxSizing: 'border-box', height: 40, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', width: '100%' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <PageHeader t={t} title={L.title} subtitle={L.sub}
        actions={<Btn t={t} icon="download" kind="ghost">Baixar modelo</Btn>} />

      {saida && (
        <Card t={t} style={{ padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lab}>Ordem de Produção (OP)</label>
              <input value={op} onChange={(e) => setOp(e.target.value)} placeholder="Ex: OP-2025-0412" style={inp} />
            </div>
            <div>
              <label style={lab}>Armazém de destino</label>
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

      {isNF && (
        <Card t={t} style={{ padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lab}>Nota Fiscal (NF)</label>
              <input value={nf} onChange={(e) => setNf(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Ex: 004471" inputMode="numeric" style={inp} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '15px 20px', borderRadius: 16, marginBottom: 22,
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
      <div onClick={importSample}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); importSample(); }}
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
        <div style={{ flex: 1, height: 1, background: t.border }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: t.faint }}>ou adicione manualmente</span>
        <div style={{ flex: 1, height: 1, background: t.border }} />
      </div>

      <Card t={t} style={{ padding: 8 }}>
        <div style={{ position: 'relative', padding: '6px 6px 8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 14px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
            <Icon name="search" size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar material no estoque por nome ou SKU…"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
          </label>
          {filtered.length > 0 && (
            <div style={{ position: 'absolute', zIndex: 30, top: '100%', left: 6, right: 6, marginTop: 4, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6, maxHeight: 280, overflowY: 'auto' }} className="fr-scroll">
              {filtered.map((m) => {
                const added = rows.some((r) => r.sku === m.sku);
                return (
                  <button key={m.sku} disabled={added} onClick={() => addMaterial(m.sku)} style={{
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
            const nm = nameForSku(r.sku);
            return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: isNF ? '1fr 120px 120px 44px' : '1fr 160px 44px', gap: 10, alignItems: 'center' }}>
              <div>
                {nm && <div style={{ fontSize: 13, fontWeight: 700, color: t.text, margin: '0 2px 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm}</div>}
                <input value={r.sku} onChange={(e) => update(i, 'sku', e.target.value)} placeholder="9.99.0000" style={inp} />
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
            ? <Btn t={t} icon="barcode" onClick={() => { if (filled.length) { frPrintEtiquetas(filled.map((r) => ({ ...r, nome: nameForSku(r.sku) })), nf); setDone(true); } }}>Entrada / Imprimir</Btn>
            : <Btn t={t} icon="eye" onClick={() => filled.length && setReview(true)}>Revisar e Confirmar</Btn>}
      </div>

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
                <div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>DESTINO</div><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, marginTop: 2 }}>{armazem}</div></div>
              </div>
            )}
            <div className="fr-scroll" style={{ overflowY: 'auto', padding: '8px 14px', flex: 1 }}>
              {filled.map((r, i) => {
                const nm = nameForSku(r.sku);
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
                <Btn t={t} icon="check" onClick={() => { setDone(true); setReview(false); }}>{L.confirmar}</Btn>
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

const USUARIOS_SEED = [
  { id: '027', nome: 'Valdecir Bonatto', cargo: 'Operador / Funcionário', setor: 'Usinagem', online: false, tempo: '0h', acao: 'há 1 dia' },
  { id: '026', nome: 'Torneiros', cargo: 'Operador / Funcionário', setor: 'Usinagem', online: false, tempo: '0h', acao: 'há cerca de 21 horas' },
  { id: '025', nome: 'Rafael Russo', cargo: 'Operador / Funcionário', setor: 'Usinagem', online: false, tempo: '0h', acao: 'há cerca de 21 horas' },
  { id: '024', nome: 'Leo Monteiro', cargo: 'Operador / Funcionário', setor: 'Usinagem', online: false, tempo: '1h', acao: 'há cerca de 2 horas' },
  { id: '023', nome: 'Mirela Fantim', cargo: 'Operador / Funcionário', setor: 'Montagem', online: true, tempo: '4h', acao: 'há 6 min' },
  { id: '022', nome: 'Ana Esteves', cargo: 'Escritório', setor: 'Qualidade', online: false, tempo: '2h', acao: 'há 3 horas' },
  { id: '021', nome: 'Lincoln Gomes', cargo: 'Chefe', setor: 'Produção 3D', online: true, tempo: '6h', acao: 'agora' },
  { id: '020', nome: 'Vitor Ladeia', cargo: 'Operador / Funcionário', setor: 'Elétrica', online: true, tempo: '3h', acao: 'há 12 min' },
  { id: '019', nome: 'Bruno Teixeira', cargo: 'Administrador Global', setor: 'Diretoria', online: true, tempo: '8h', acao: 'agora' },
  { id: '018', nome: 'Carlos Moura', cargo: 'Líder de Usinagem', setor: 'Usinagem', online: false, tempo: '5h', acao: 'ontem' },
  { id: '017', nome: 'Júlia Ramos', cargo: 'Gerente', setor: 'Qualidade', online: true, tempo: '7h', acao: 'há 1 h' },
  { id: '016', nome: 'Davi Miranda', cargo: 'Operador / Funcionário', setor: 'Produção 3D', online: false, tempo: '2h', acao: 'há 4 horas' },
];
const CARGO_GROUPS = [
  { grupo: 'Setor: Usinagem', cargos: ['Líder de Usinagem', 'Operador / Funcionário'] },
  { grupo: 'Administração e Gerência', cargos: ['Administrador Global', 'Gerente', 'Escritório', 'Financeiro', 'Chefe'] },
  { grupo: 'Logística e Almoxarifado', cargos: ['Almoxarife', 'Conferente', 'Motorista'] },
  { grupo: 'Produção', cargos: ['Operador 3D', 'Eletricista', 'Montador'] },
];
const genPw = (u) => 'FR-' + u.id + (u.nome.split(' ')[0] || '').toLowerCase();

function PageUsuarios({ t }) {
  const [users, setUsers] = useStateA(USUARIOS_SEED);
  const [q, setQ] = useStateA('');
  const [menuId, setMenuId] = useStateA(null);
  const [cargoId, setCargoId] = useStateA(null);
  const [pwUser, setPwUser] = useStateA(null);
  const [pwShow, setPwShow] = useStateA(false);
  const [pwMap, setPwMap] = useStateA({});
  const [toast, setToast] = useStateA(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };
  const pwOf = (u) => pwMap[u.id] || genPw(u);

  const setCargo = (id, cargo) => { setUsers((xs) => xs.map((u) => (u.id === id ? { ...u, cargo } : u))); setCargoId(null); };
  const suspender = (u) => { setUsers((xs) => xs.map((x) => (x.id === u.id ? { ...x, online: false, suspenso: !x.suspenso } : x))); setMenuId(null); flash(u.suspenso ? 'Acesso reativado' : 'Acesso suspenso'); };
  const excluir = (u) => { setUsers((xs) => xs.filter((x) => x.id !== u.id)); setMenuId(null); flash('Conta excluída'); };
  const copiarId = (u) => { try { navigator.clipboard && navigator.clipboard.writeText(u.id); } catch (e) {} setMenuId(null); flash('ID ' + u.id + ' copiado'); };
  const redefinir = (u) => { const np = 'FR-' + Math.random().toString(36).slice(2, 8); setPwMap((m) => ({ ...m, [u.id]: np })); setMenuId(null); setPwUser(u); setPwShow(true); flash('Senha redefinida'); };
  const verSenha = (u) => { setMenuId(null); setPwUser(u); setPwShow(false); };

  const ql = q.trim().toLowerCase();
  const view = users.filter((u) => !ql || u.nome.toLowerCase().includes(ql) || u.id.includes(ql) || u.cargo.toLowerCase().includes(ql) || u.setor.toLowerCase().includes(ql));
  const online = users.filter((u) => u.online).length;
  const av = (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
  const field = { boxSizing: 'border-box', height: 38, borderRadius: 9, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 12px', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', outline: 'none', width: '100%' };

  const menuItem = (icon, label, onClick, danger) => (
    <button onClick={onClick} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 9, fontSize: 13, fontWeight: 600, color: danger ? uiTone(t, 'red').fg : t.text }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? uiTone(t, 'red').bg : t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
      <Icon name={icon} size={16} /> {label}
    </button>
  );

  return (
    <div onClick={() => { setMenuId(null); setCargoId(null); }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ width: 48, height: 48, borderRadius: 14, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="users" size={24} /></span>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 850, letterSpacing: '-.02em', color: t.text }}>Gestão de Equipe</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13.5, color: t.muted, maxWidth: 460 }}>Controle acessos, defina permissões e acompanhe a atividade dos colaboradores em tempo real.</p>
          </div>
        </div>
        <Btn t={t} icon="userPlus">Novo Colaborador</Btn>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <KPI t={t} mini icon="users" label="Total de membros" value={users.length} kind="accent" />
        <KPI t={t} mini icon="barChart2" label="Online agora" value={online} kind="green" />
        <KPI t={t} mini icon="clock" label="Horas úteis totais" value="2747h" kind="blue" />
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '2 1 280px', minWidth: 240, padding: '0 16px', borderRadius: 16, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, id ou cargo…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit', padding: '18px 0' }} />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
        {view.map((u) => (
          <Card t={t} key={u.id} hover style={{ padding: 18, display: 'flex', flexDirection: 'column', position: 'relative', opacity: u.suspenso ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ width: 54, height: 54, borderRadius: '50%', background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 17 }}>{av(u.nome)}</span>
                {u.online && <span style={{ position: 'absolute', bottom: 2, right: 2, width: 13, height: 13, borderRadius: '50%', background: uiTone(t, 'green').fg, border: `2.5px solid ${t.panel}` }} />}
              </div>
              <div style={{ position: 'relative' }}>
                <button onClick={(e) => { e.stopPropagation(); setCargoId(null); setMenuId(menuId === u.id ? null : u.id); }} title="Opções" style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="dots" size={18} /></button>
                {menuId === u.id && (
                  <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', zIndex: 40, top: 'calc(100% + 6px)', right: 0, width: 220, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 14, boxShadow: t.shadow, padding: 6 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', color: t.faint, padding: '8px 10px 6px' }}>AÇÕES DO MEMBRO</div>
                    {menuItem('copy', 'Copiar ID', () => copiarId(u))}
                    {menuItem('eye', 'Ver senha', () => verSenha(u))}
                    {menuItem('key', 'Redefinir Senha', () => redefinir(u))}
                    {menuItem('ban', u.suspenso ? 'Reativar Acesso' : 'Suspender Acesso', () => suspender(u))}
                    <div style={{ height: 1, background: t.border, margin: '6px 4px' }} />
                    {menuItem('trash', 'Excluir Conta', () => excluir(u), true)}
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 850, color: t.text, marginTop: 14, letterSpacing: '-.01em' }}>{u.nome}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.muted, marginTop: 4 }}><Icon name="lock" size={12} /> {u.id}{u.suspenso && <Badge t={t} kind="red">Suspenso</Badge>}</div>

            {/* cargo dropdown agrupado */}
            <div style={{ position: 'relative', marginTop: 14 }}>
              <button onClick={(e) => { e.stopPropagation(); setMenuId(null); setCargoId(cargoId === u.id ? null : u.id); }} style={{ ...field, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textTransform: 'uppercase', letterSpacing: '.02em', textAlign: 'left' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.cargo}</span>
                <Icon name="chevronDown" size={15} style={{ color: t.muted, flexShrink: 0, transform: cargoId === u.id ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
              </button>
              {cargoId === u.id && (
                <div onClick={(e) => e.stopPropagation()} className="fr-scroll" style={{ position: 'absolute', zIndex: 40, top: 'calc(100% + 6px)', left: 0, right: 0, maxHeight: 280, overflowY: 'auto', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 14, boxShadow: t.shadow, padding: 6 }}>
                  {CARGO_GROUPS.map((g) => (
                    <div key={g.grupo}>
                      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em', color: t.faint, padding: '9px 10px 5px', textTransform: 'uppercase' }}>{g.grupo}</div>
                      {g.cargos.map((c) => {
                        const on = u.cargo === c;
                        return (
                          <button key={c} onClick={() => setCargo(u.id, c)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, fontSize: 13, fontWeight: on ? 800 : 600, color: on ? t.accentText : t.text, background: on ? t.accentSoft : 'transparent' }}
                            onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                            <Icon name="check" size={14} style={{ opacity: on ? 1 : 0, color: t.accentText }} /> {c}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: t.muted, marginTop: 12 }}><Icon name="building" size={13} /> SETOR: <span style={{ color: t.text, textTransform: 'uppercase' }}>{u.setor}</span></div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>TEMPO ÚTIL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 800, color: t.text, marginTop: 3 }}><Icon name="clock" size={13} style={{ color: t.muted }} /> {u.tempo}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>ÚLTIMA AÇÃO</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: u.online ? uiTone(t, 'green').fg : t.text, marginTop: 4 }}>{u.acao}</div>
              </div>
            </div>
          </Card>
        ))}
        {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhum colaborador" sub="Ajuste a busca." /></Card></div>}
      </div>

      {/* modal ver senha */}
      {pwUser && (
        <div onClick={() => setPwUser(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(420px,96vw)', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 18, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="key" size={19} /></span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 850, color: t.text }}>Senha de acesso</div><div style={{ fontSize: 12.5, color: t.muted }}>{pwUser.nome} · {pwUser.id}</div></div>
              <button onClick={() => setPwUser(null)} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
                <span style={{ flex: 1, fontSize: 18, fontWeight: 800, letterSpacing: pwShow ? '.02em' : '.18em', color: t.text, fontFamily: pwShow ? 'monospace' : 'inherit' }}>{pwShow ? pwOf(pwUser) : '•'.repeat(pwOf(pwUser).length)}</span>
                <button onClick={() => setPwShow((s) => !s)} title={pwShow ? 'Ocultar' : 'Mostrar'} style={{ all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}` }}><Icon name={pwShow ? 'eyeOff' : 'eye'} size={17} /></button>
                <button onClick={() => { try { navigator.clipboard && navigator.clipboard.writeText(pwOf(pwUser)); } catch (e) {} flash('Senha copiada'); }} title="Copiar" style={{ all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}` }}><Icon name="copy" size={16} /></button>
              </div>
              <button onClick={() => redefinir(pwUser)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 44, marginTop: 14, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13.5, fontWeight: 800, background: t.accent, color: t.onAccent }}><Icon name="key" size={16} /> Redefinir senha</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 70, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderRadius: 13, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 10px 30px rgba(0,0,0,.3)' }}>
          <Icon name="check" size={18} /> {toast}
        </div>
      )}
    </div>
  );
}


function PageRelatorios({ t }) {
  const cat = [
    { label: 'Usinagem', v: 86, accent: true }, { label: 'Elétrica', v: 64 }, { label: '3D', v: 48, accent: true },
    { label: 'Mecânica', v: 72 }, { label: 'Acab.', v: 38 }, { label: 'Outros', v: 28 },
  ];
  return (
    <div>
      <PageHeader t={t} title="Relatórios" subtitle="Indicadores de estoque, consumo e custos."
        actions={<><Btn t={t} icon="file" kind="ghost">PDF</Btn><Btn t={t} icon="download">Exportar Excel</Btn></>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} icon="barChart" label="Giro de estoque" value="4,8x" sub="ao ano" kind="accent" />
        <KPI t={t} icon="out" label="Consumo médio" value="R$ 18,9k" sub="por mês" kind="amber" />
        <KPI t={t} icon="box" label="Cobertura" value="32 dias" sub="estoque atual" kind="green" />
        <KPI t={t} icon="alert" label="Rupturas" value="3" sub="no trimestre" kind="red" />
      </div>
      <Card t={t} style={{ padding: 22 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 22 }}>Consumo por categoria (R$ mil)</div>
        <BarChart t={t} data={cat} height={200} />
      </Card>
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
  const av = s.sol.split(' ').map((x) => x[0]).slice(0, 2).join('');
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
  const pct = { 'em-analise': 25, 'a-separar': 55, 'em-transito': 80, 'concluido': 100, 'recusado': 30 }[s.status];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(900px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ position: 'relative', flexShrink: 0, padding: '24px 26px', background: `linear-gradient(135deg, ${h1}, ${h2})`, color: '#fff', overflow: 'hidden' }}>
          <Icon name="box" size={160} style={{ position: 'absolute', right: -26, top: -26, opacity: 0.12 }} />
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 16, right: 18, width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.18)', color: '#fff' }}><Icon name="x" size={16} /></button>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16, paddingRight: 44 }}>
              <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{av}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.7)', textTransform: 'uppercase' }}>Solicitante</div>
                <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.sol} <span style={{ fontWeight: 600, color: 'rgba(255,255,255,.8)' }}>· {s.setor}</span></div>
              </div>
            </div>
            <div style={{ fontSize: 23, fontWeight: 850, letterSpacing: '-.02em' }}>{m.title}</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.92)', marginTop: 5 }}>{m.sub}</div>
            <div style={{ marginTop: 16 }}>
              <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,.22)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: '#fff', transition: 'width .5s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: 'rgba(255,255,255,.85)' }}>
                <span>{s.req} · OP-{s.op}</span><span>{s.status === 'recusado' ? 'Recusado' : `${pct}% concluído`}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="fr-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '22px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0 16px' }}>
            <Icon name="clock" size={15} style={{ color: t.accentText }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: t.faint }}>Acompanhamento do pedido</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(s.status === 'recusado'
              ? [{ ...STEP_DEFS[0], state: 'done', when: stepWhen(s, 0) }, { t: 'Recusada', icon: 'x', when: (s.recusa && s.recusa.em) || '', d: 'A solicitação foi recusada pelo almoxarifado.', state: 'rejected' }]
              : STEP_DEFS.map((d, i) => {
                  let dd = d.d;
                  if (i === 1 && s.aprovacao) dd = `Aprovada por ${s.aprovacao.por}.`;
                  if (i === 2 && s.envio) dd = `Itens bipados por ${s.bipagem ? s.bipagem.por : s.envio.por} e enviados ao setor.`;
                  if (i === 3 && s.recebimento) dd = `Recebida por ${s.recebimento.por}${s.recebimento.divergencia ? ' · com divergência' : ' · sem divergência'}.`;
                  return { ...d, d: dd, state: STEP_STATES[s.status][i], when: stepWhen(s, i) };
                })
            ).map((step, i, arr) => {
              const last = i === arr.length - 1;
              const done = step.state === 'done', current = step.state === 'current', rej = step.state === 'rejected';
              const filled = done || current || rej;
              const nodeBg = rej ? uiTone(t, 'red').fg : done ? uiTone(t, 'green').fg : current ? t.accent : t.elevated;
              return (
                <div key={i} style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                      background: nodeBg, color: filled ? '#fff' : t.faint, border: filled ? 'none' : `2px solid ${t.border}`,
                      boxShadow: 'none' }}>
                      <Icon name={done ? 'check' : rej ? 'x' : step.icon} size={done || rej ? 16 : 17} />
                    </span>
                    {!last && <span style={{ width: 3, flex: 1, minHeight: 42, borderRadius: 3, background: done ? uiTone(t, 'green').fg : t.border, margin: '4px 0' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: filled ? t.text : t.muted }}>{step.t}</span>
                      {current && <Badge t={t} kind="accent" dot>Em andamento</Badge>}
                      {rej && <Badge t={t} kind="red" dot>Recusado</Badge>}
                      {step.state !== 'future' && step.when && <span style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 600, color: t.muted, display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}><Icon name="clock" size={12} /> {step.when}</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: t.muted, marginTop: 5, lineHeight: 1.5 }}>{step.d}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 0', marginTop: 6, borderTop: `1px solid ${t.border}` }}>
            <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="mapPin" size={19} /></span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: t.faint, textTransform: 'uppercase' }}>Local de entrega</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginTop: 2 }}>{s.sol}</div>
              <div style={{ fontSize: 12.5, color: t.muted }}>{s.setor}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 14px' }}>
            <Icon name="box" size={15} style={{ color: t.accentText }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: t.faint }}>Produtos solicitados</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: t.text }}>{s.itens.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {s.itens.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 13, background: t.elevated, border: `1px solid ${t.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, textTransform: 'uppercase' }}>{it.nome}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 7, flexWrap: 'wrap' }}><Badge t={t} kind="gray">SKU {it.sku}</Badge><Badge t={t} kind="accent">OP {s.op}</Badge></div>
                </div>
                {canConfer ? (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>PEDIDO: {pedidaOf(it)} {it.un || 'un'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 7, marginTop: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: t.muted }}>Conferido</span>
                      <input value={confRaw(it, i)} onChange={(e) => setConfVal(it, i)(e.target.value)} inputMode="numeric" disabled={enviando}
                        style={{ width: 62, height: 34, textAlign: 'center', borderRadius: 9, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 15, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
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
                      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>QTD PEDIDA</div>
                      <div style={{ fontSize: 19, fontWeight: 850, color: t.text }}>{pedidaOf(it)} <span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{it.un || 'un'}</span></div>
                      {showEnviado && (
                        <React.Fragment>
                          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: falta ? amber.fg : t.faint, marginTop: 7 }}>ENVIADO</div>
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
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '13px 16px', borderRadius: 12, background: t.accentSoft }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: t.accentText }}>Total do pedido</span>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>{s.itens.length} itens · {totalUn} un</span>
          </div>
        </div>
        {pending && (
          <div style={{ flexShrink: 0, padding: '16px 26px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mine ? (
              <button onClick={onCancel} style={{ all: 'unset', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 13, fontSize: 14, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="x" size={17} /> Cancelar pedido</button>
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
                      <button onClick={() => { if (!enviando) { setRejectOpen(false); setErro(''); } }} disabled={enviando} style={{ all: 'unset', cursor: enviando ? 'not-allowed' : 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 13, fontSize: 14, fontWeight: 700, color: t.muted, border: `1px solid ${t.border}`, opacity: enviando ? 0.6 : 1 }}>Voltar</button>
                      <button onClick={handleReject} disabled={enviando || !motivo.trim()} style={{ all: 'unset', cursor: (enviando || !motivo.trim()) ? 'not-allowed' : 'pointer', flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 13, fontSize: 14, fontWeight: 800, background: (enviando || !motivo.trim()) ? t.elevated : uiTone(t, 'red').fg, color: (enviando || !motivo.trim()) ? t.faint : '#fff' }}><Icon name="x" size={17} /> {enviando ? 'Recusando…' : 'Confirmar recusa'}</button>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <button onClick={() => { if (!enviando) { setErro(''); setRejectOpen(true); } }} disabled={enviando} style={{ all: 'unset', cursor: enviando ? 'not-allowed' : 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 13, fontSize: 14, fontWeight: 700, color: uiTone(t, 'red').fg, border: `1px solid ${t.border}`, opacity: enviando ? 0.6 : 1 }}
                        onMouseEnter={(e) => { if (!enviando) e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="x" size={17} /> Recusar</button>
                      <button onClick={handleApprove} disabled={enviando} style={{ all: 'unset', cursor: enviando ? 'not-allowed' : 'pointer', flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, height: 46, borderRadius: 13, fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', background: t.accent, color: t.onAccent, boxShadow: `0 6px 16px ${frHexToRgba(t.accent, 0.3)}`, opacity: enviando ? 0.7 : 1 }}><Icon name="check" size={18} /> {enviando ? 'Aprovando…' : 'Conferir & Aprovar'}</button>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nada por aqui" sub="Não há solicitações neste filtro." /></Card></div>}
        {view.filter((s) => s.tipo !== 'devolucao').map((s) => {
          const av = s.sol.split(' ').map((x) => x[0]).slice(0, 2).join('');
          return (
            <Card t={t} key={s.id} hover style={{ padding: 16, cursor: 'pointer' }}>
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
  const nameForSku = (sku) => (MATERIAIS.find((mt) => mt.sku === sku) || {}).nome;
  const filtered = q.trim() ? MATERIAIS.filter((mt) => mt.nome.toLowerCase().includes(q.toLowerCase()) || mt.sku.includes(q)) : [];
  const addMaterial = (sku) => { setRows((rs) => (rs.some((r) => r.sku === sku) ? rs : [...rs, { sku, qtd: '1' }])); setQ(''); setSent(false); };
  const updateQ = (i, v) => { setRows((rs) => rs.map((r, j) => (j === i ? { ...r, qtd: v } : r))); setSent(false); };
  const removeRow = (i) => setRows((rs) => rs.filter((_, j) => j !== i));
  const filledNew = rows.filter((r) => parseInt(r.qtd) > 0);
  const totalNew = filledNew.reduce((a, r) => a + (parseInt(r.qtd) || 0), 0);
  const submit = () => {
    if (!filledNew.length) return;
    const novo = { id: Date.now(), req: 'REQ-PED-' + (7700 + Math.floor(Math.random() * 200)), sol: 'Bruno Teixeira', setor: 'Diretoria', op: op.trim() || 's/ OP', status: 'em-analise', time: 'agora', itens: filledNew.map((r) => ({ nome: nameForSku(r.sku) || 'Material', sku: r.sku, qtd: parseInt(r.qtd) })) };
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
          {filtered.length > 0 && (
            <div className="fr-scroll" style={{ position: 'absolute', zIndex: 30, top: '100%', left: 0, right: 0, marginTop: 4, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6, maxHeight: 260, overflowY: 'auto' }}>
              {filtered.map((mt) => {
                const added = rows.some((r) => r.sku === mt.sku);
                return (
                  <button key={mt.sku} disabled={added} onClick={() => addMaterial(mt.sku)} style={{ all: 'unset', boxSizing: 'border-box', cursor: added ? 'default' : 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 9, opacity: added ? 0.55 : 1 }}
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
              const nm = nameForSku(r.sku);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="box" size={16} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm || 'Material'}</div><div style={{ fontSize: 11, color: t.muted }}>SKU {r.sku}</div></div>
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
  permissoes: 'Permissões', auditoria: 'Auditoria', clientes: 'Clientes e OPs', painelti: 'Painel TI',
};

function renderPage(active, props) {
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
  if (active === 'painelti') return <PagePainelTI {...props} />;
  return <PagePlaceholder t={props.t} title={PAGE_TITLES[active] || 'Página'} />;
}

// PageMeusPedidos NÃO é exposta aqui de propósito: a tela ativa é a elaborada (window.PageMeusPedidos,
// definida em pedidos.jsx, que carrega depois). MEUS_PEDIDOS/SOL_STATUS/SolicitacaoDetail passam a ser
// globais para a elaborada conseguir lê-las em tempo de render (eram privadas deste módulo).
Object.assign(window, { PageEntradas, PageSaidas, PageUsuarios, PageRelatorios, PageEntradaNova, PageSolicitacoes, PagePlaceholder, renderPage, MEUS_PEDIDOS, SOL_STATUS, SolicitacaoDetail });
