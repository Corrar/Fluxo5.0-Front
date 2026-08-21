// pages_main.jsx — Catálogo UNIFICADO (rodada 16) e Visão Geral (Dashboard).
//
// A galeria 'Produtos' (PageProdutos) e a 'Movimentação' (PageCatalogo) viraram UMA página:
// hero de patrimônio + form de novo produto + busca/filtro/grid + modais de edição,
// inventário e relatório — tudo sobre useFRProducts (GET /products real). O seed PRODUTOS
// do protótipo MORREU: as tags dos chips agora derivam dos produtos carregados.

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

import * as XLSX from 'xlsx';   // SheetJS (já usado na Entrada por NF): modelo e parse do inventário
const { useState: useStateM, useRef: useRefM, useMemo: useMemoM } = React;

// ⚰️ PAGE_SIZE=48 morreu na fidelidade 21: o Catálogo pagina 24/página no desktop e 10 no
// celular (ref21), com a barra numerada inline da PageCatalogo. A lista completa segue em
// memória (busca/filtro operam sobre o TODO); só a página atual é renderizada.

// ⚰️ LÁPIDE — o seed PRODUTOS (26 itens do protótipo) morreu aqui na rodada 16. Ele já não
// rendia card nenhum (as telas leem useFRProducts desde a leva 1), mas seguia vivo como fonte
// de PRODUTO_TAGS — os chips de categoria mostravam etiquetas que talvez nem existissem no
// banco. Agora as tags derivam dos produtos CARREGADOS (frTagsDe, abaixo); a cor continua no
// mesmo mapa de sempre (FRAdapters.tagToKind).
const UNIDADES = ['un', 'm', 'ch', 'lt', 'kg', 'par', 'br', 'cx', 'pç', 'rolo'];
function parsePreco(s) { return parseFloat(frSanQtd(s).replace(',', '.')) || 0; }

// Tags REAIS: todas as etiquetas dos produtos carregados (não só a 1ª de cada um), únicas,
// maiúsculas, com a cor do mapa canônico. Fonte única dos chips do form e do modal de edição.
function frTagsDe(produtos) {
  const m = new Map();
  (produtos || []).forEach((p) => (p.tags || []).forEach((tg) => {
    const up = String(tg).toUpperCase().trim();
    if (up && !m.has(up)) m.set(up, window.FRAdapters.tagToKind(up));
  }));
  return [...m.entries()].map(([tag, kind]) => ({ tag, kind }));
}

// --- Estados de dados reais (Etapa 2 · leva 1): skeleton discreto, vazio e erro ---
// Coerentes com os tokens do tema; não inventam layout novo.
function SkelBlock({ t, h, w, r }) {
  return <div style={{ height: h, width: w || '100%', borderRadius: r == null ? 8 : r, background: t.elevated, animation: 'frSkel 1.4s ease-in-out infinite' }} />;
}
function ProdutoCardSkeleton({ t, media }) {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${t.border}`, background: t.panel }}>
      <style>{`@keyframes frSkel{0%,100%{opacity:.5}50%{opacity:.85}}`}</style>
      {media && <SkelBlock t={t} h={200} r={0} />}
      <div style={{ padding: media ? 16 : 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkelBlock t={t} h={12} w="40%" />
        <SkelBlock t={t} h={18} w="80%" />
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <SkelBlock t={t} h={54} /><SkelBlock t={t} h={54} />
        </div>
        <SkelBlock t={t} h={16} w="50%" />
      </div>
    </div>
  );
}
function ProdutoErro({ t, message, onRetry }) {
  const c = uiTone(t, 'red');
  return (
    <Card t={t} style={{ padding: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
      <span style={{ width: 48, height: 48, borderRadius: 13, background: c.bg, color: c.fg, display: 'grid', placeItems: 'center' }}><Icon name="alert" size={24} /></span>
      <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text }}>Não foi possível carregar os produtos</div>
      <div style={{ fontSize: 13, color: t.muted, maxWidth: 440 }}>{message || 'Verifique a conexão e tente novamente.'}</div>
      {onRetry && <Btn t={t} icon="refresh" onClick={onRetry}>Tentar de novo</Btn>}
    </Card>
  );
}

function HeroPatrimonio({ t, brand, produtos }) {
  const { mobile } = (window.useFRViewport ? window.useFRViewport() : { mobile: false });
  const lista = produtos || [];
  const totalVal = lista.reduce((a, p) => a + parsePreco(p.preco) * p.estoque, 0);
  const unidades = lista.reduce((a, p) => a + p.estoque, 0);
  const fmt = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const emFalta = lista.filter((p) => p.disp <= 0).length;
  const saude = lista.length ? Math.round(((lista.length - emFalta) / lista.length) * 100) : 100;
  const [shown, setShown] = useStateM(0);
  React.useEffect(() => {
    let raf, start;
    const dur = 1100;
    const tick = (ts) => { if (!start) start = ts; const p = Math.min(1, (ts - start) / dur); const e = 1 - Math.pow(1 - p, 3); setShown(totalVal * e); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [totalVal]);

  // VARIANTE MOBILE (redesign): o hero de 460px com número de 100px não cabe num 390 — a
  // foto de fundo empurrava o valor pra fora e os chips saíam da tela. Aqui vira um cartão
  // compacto sem foto, com os MESMOS números — que continuam saindo de `lista` (produtos
  // REAIS via useFRProducts), nunca do PRODUTOS mock que o design lia.
  if (mobile) {
    return (
      <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', padding: '22px 20px 24px', background: `linear-gradient(160deg, ${brand.accent} 0%, #05070d 130%)` }}>
        <div style={{ position: 'absolute', top: '-40%', right: '-20%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,255,255,.14) 0%, transparent 62%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Icon name="barChart2" size={13} style={{ color: brand.yellow }} />
          <span style={{ fontSize: 10.5, letterSpacing: '.2em', fontWeight: 850, color: brand.yellow, textTransform: 'uppercase' }}>Patrimônio em Estoque</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,.6)' }}>R$</span>
          <span style={{ fontSize: 'clamp(30px, 9.5vw, 44px)', fontWeight: 850, letterSpacing: '-.04em', color: '#fff', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmt(shown)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 16 }}>
          <div style={{ padding: '11px 14px', borderRadius: 13, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)' }}>
            <div style={{ fontSize: 9.5, fontWeight: 850, letterSpacing: '.1em', color: 'rgba(255,255,255,.65)', textTransform: 'uppercase' }}>Itens no catálogo</div>
            <div style={{ fontSize: 16, fontWeight: 850, color: '#fff', marginTop: 3 }}>{lista.length} itens · {unidades.toLocaleString('pt-BR')} un</div>
          </div>
          <div style={{ padding: '11px 14px', borderRadius: 13, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)' }}>
            <div style={{ fontSize: 9.5, fontWeight: 850, letterSpacing: '.1em', color: 'rgba(255,255,255,.65)', textTransform: 'uppercase' }}>Saúde do estoque</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 16, fontWeight: 850, color: '#fff', marginTop: 3 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 0 3px rgba(52,211,153,.3)' }} /> {saude}%</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 14 }}>Controle absoluto sobre {unidades.toLocaleString('pt-BR')} unidades.</div>
      </div>
    );
  }

  return (
    // containerType: 'inline-size' habilita a unidade `cqw` usada no tamanho do número —
    // ele passa a escalar pela largura do PRÓPRIO hero, não da janela.
    <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', minHeight: 'clamp(320px, 55vw, 460px)', display: 'flex', alignItems: 'flex-end', background: '#05070d', containerType: 'inline-size' }}>
      <style>{`@keyframes frHeroZoom{from{transform:scale(1.1)}to{transform:scale(1)}}@keyframes frHeroRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}@keyframes frGlow{0%,100%{opacity:.5}50%{opacity:.85}}@keyframes frSheen{0%{background-position:-160% 0}55%,100%{background-position:260% 0}}`}</style>
      <div style={{ position: 'absolute', inset: 0, animation: 'frHeroZoom 18s ease-out both' }}>
        <img src={window.__asset('assets/mascote.png')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center' }} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(95deg, rgba(3,5,10,.95) 0%, rgba(3,5,10,.64) 40%, transparent 80%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(3,5,10,.98) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 160px rgba(0,0,0,.7)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-30%', right: '8%', width: 520, height: 520, background: 'radial-gradient(circle, rgba(255,255,255,.1) 0%, transparent 62%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: -40, bottom: 30, width: 380, height: 220, borderRadius: '50%', background: frHexToRgba(brand.accent, 0.45), filter: 'blur(110px)', animation: 'frGlow 7s ease-in-out infinite', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', left: 'clamp(20px, 5vw, 48px)', top: 'clamp(22px, 4vw, 36px)', display: 'flex', alignItems: 'center', gap: 10, animation: 'frHeroRise .7s ease-out both' }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: brand.accent, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 13, boxShadow: `0 4px 14px ${frHexToRgba(brand.accent, 0.5)}` }}>FR</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.04em', color: 'rgba(255,255,255,.85)' }}>Fluxo Royale · Estoque</span>
      </div>

      <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box', padding: '0 clamp(20px, 5vw, 48px) clamp(28px, 5vw, 46px)', animation: 'frHeroRise .8s ease-out both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
          <span style={{ width: 22, height: 3, borderRadius: 3, background: brand.yellow }} />
          <span style={{ fontSize: 11, letterSpacing: '.24em', fontWeight: 800, color: brand.yellow, textTransform: 'uppercase' }}>Patrimônio em Estoque</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(6px, 1.5vw, 12px)' }}>
          <span style={{ fontSize: 'clamp(18px, 4vw, 32px)', fontWeight: 700, color: 'rgba(255,255,255,.6)', marginTop: 'clamp(8px, 2vw, 18px)' }}>R$</span>
          <span style={{ position: 'relative', fontSize: 'clamp(34px, 15cqw, 100px)', fontWeight: 850, letterSpacing: '-.05em', lineHeight: .78, fontVariantNumeric: 'tabular-nums', color: '#fff', whiteSpace: 'nowrap',
            background: 'linear-gradient(100deg, #fff 0%, #fff 38%, rgba(255,255,255,.55) 50%, #fff 62%, #fff 100%)', backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', animation: 'frSheen 5.5s ease-in-out 1.1s infinite', textShadow: '0 8px 50px rgba(0,0,0,.65)' }}>{fmt(shown)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 26, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'rgba(255,255,255,.82)', fontWeight: 600, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', padding: '7px 13px', borderRadius: 999 }}><Icon name="box" size={14} /> {lista.length} itens · {unidades.toLocaleString('pt-BR')} un</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: '#fff', fontWeight: 700, background: frHexToRgba('#10b981', 0.16), border: `1px solid ${frHexToRgba('#10b981', 0.4)}`, padding: '7px 14px', borderRadius: 999 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,.3)' }} /> Saúde do estoque {saude}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Máscara do SKU: o usuário digita só números; os pontos entram sozinhos → C.SS.NNNN (ex.: 3.08.0114).
const maskSku = (raw) => {
  const d = String(raw).replace(/\D/g, '').slice(0, 7);   // só dígitos, máx 7
  if (d.length <= 1) return d;                              // "3"
  if (d.length <= 3) return d[0] + '.' + d.slice(1);        // "3.08"
  return d[0] + '.' + d.slice(1, 3) + '.' + d.slice(3);     // "3.08.0114"
};

function NovoProdutoForm({ t, brand, onCreated, produtos = [], flat }) {
  const field = { width: '100%', boxSizing: 'border-box', height: 42, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' };
  const lab = { fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7, display: 'block' };
  const [nome, setNome] = useStateM('');
  const [sku, setSku] = useStateM('');
  const [unidade, setUnidade] = useStateM('un');
  const [minimo, setMinimo] = useStateM('');
  const [tags, setTags] = useStateM([]);
  const [novaTag, setNovaTag] = useStateM('');
  const [salvando, setSalvando] = useStateM(false);   // guard anti-duplo-clique + estado de loading
  const [feedback, setFeedback] = useStateM(null);     // { type: 'ok' | 'error', msg }

  // SKU: formato C.SS.NNNN (1º dígito de 1 a 9). skuValido libera o envio;
  // skuDuplicado checa contra a lista JÁ carregada (defesa imediata — o backend revalida, inclusive arquivados).
  const SKU_REGEX = /^[1-9]\.\d{2}\.\d{4}$/;
  const skuValido = SKU_REGEX.test(sku);
  const skuDuplicado = skuValido && (produtos || []).some((p) => p.sku === sku);
  const skuHint = sku === '' ? null
    : skuDuplicado ? { type: 'error', msg: 'SKU já cadastrado.' }
    : !skuValido ? { type: 'warn', msg: 'SKU incompleto — formato C.SS.NNNN (ex.: 3.08.0114).' }
    : null;
  const bloqueado = salvando || !skuValido || skuDuplicado;

  // Chips de categoria: derivados dos produtos REAIS carregados (o seed PRODUTO_TAGS morreu).
  const tagsReais = useMemoM(() => frTagsDe(produtos), [produtos]);

  const toggleTag = (tg) => { setFeedback(null); setTags((xs) => (xs.includes(tg) ? xs.filter((x) => x !== tg) : [...xs, tg])); };
  const addNovaTag = () => {
    const tg = novaTag.trim();
    setNovaTag('');
    if (!tg) return;
    setTags((xs) => (xs.includes(tg) ? xs : [...xs, tg]));
  };
  const limpar = () => { setNome(''); setSku(''); setUnidade('un'); setMinimo(''); setTags([]); setNovaTag(''); };

  const handleCadastrar = async () => {
    if (salvando) return;   // guard anti-duplo-clique
    const nomeLimpo = nome.trim();
    // Validação no front (feedback imediato). O backend é a fonte da verdade e revalida formato/duplicata/obrigatórios.
    if (!nomeLimpo) { setFeedback({ type: 'error', msg: 'Informe o nome do produto.' }); return; }
    if (!skuValido) { setFeedback({ type: 'error', msg: 'SKU incompleto — formato C.SS.NNNN (ex.: 3.08.0114).' }); return; }
    if (skuDuplicado) { setFeedback({ type: 'error', msg: 'SKU já cadastrado.' }); return; }
    setSalvando(true);
    setFeedback(null);
    try {
      // NÃO enviamos image_url (sem upload — dívida adiada) nem saldo inicial (produto nasce 0; saldo LAZY no backend).
      await window.FRApi.post('/products', {
        name: nomeLimpo,
        sku,
        unit: unidade,
        min_stock: minimo.trim() === '' ? 0 : Number(minimo),
        tags,
      });
      setFeedback({ type: 'ok', msg: 'Produto cadastrado com sucesso.' });
      limpar();
      if (onCreated) onCreated();   // recarrega a lista — o produto novo aparece
    } catch (e) {
      // Backend retorna 400 com mensagem clara (SKU duplicado, SKU de arquivado, campos faltando).
      // NÃO limpamos o form no erro — o usuário não perde o que digitou.
      const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
      setFeedback({ type: 'error', msg: gm ? gm(e) : 'Não foi possível cadastrar o produto.' });
    } finally {
      setSalvando(false);
    }
  };

  const fb = feedback ? uiTone(t, feedback.type === 'ok' ? 'green' : 'red') : null;

  return (
    // `flat` (redesign): dentro da folha do celular o formulário perde moldura, sombra e
    // largura fixa — quem faz o papel de cartão ali é a própria folha. No desktop nada muda.
    <Card t={t} style={flat
      ? { padding: '14px 20px calc(20px + env(safe-area-inset-bottom))', width: '100%', boxSizing: 'border-box', border: 'none', borderRadius: 0, boxShadow: 'none', background: 'transparent' }
      : { padding: 22, width: 340, flexShrink: 0, alignSelf: 'flex-start', position: 'sticky', top: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center' }}><Icon name="plus" size={20} /></span>
        <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Novo Produto</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div><label style={lab}>Nome do produto</label><input value={nome} onChange={(e) => { setNome(e.target.value); setFeedback(null); }} placeholder="Ex: Parafuso Sextavado M8" style={field} /></div>
        <div>
          <label style={lab}>Código SKU</label>
          <input value={sku} onChange={(e) => { setSku(maskSku(e.target.value)); setFeedback(null); }} inputMode="numeric" placeholder="3.08.0114" style={field} />
          {skuHint && (
            <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: uiTone(t, skuHint.type === 'error' ? 'red' : 'amber').fg }}>{skuHint.msg}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={lab}>Unidade</label>
            <div style={{ position: 'relative' }}>
              <select value={unidade} onChange={(e) => setUnidade(e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' }}>
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 11, top: 13, color: t.muted, pointerEvents: 'none' }} />
            </div>
          </div>
          <div style={{ width: 96 }}><label style={lab}>Mínimo</label><input value={minimo} onChange={(e) => setMinimo(frSanQtd(e.target.value))} placeholder="0" inputMode="numeric" style={field} /></div>
        </div>
        <div>
          <label style={lab}>Categorias e etiquetas</label>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
            {tagsReais.map(({ tag, kind }) => {
              const on = tags.includes(tag);
              const c = uiTone(t, kind);
              return (
                <button key={tag} onClick={() => toggleTag(tag)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, letterSpacing: '.02em', padding: '5px 10px', borderRadius: 8, background: on ? c.fg : c.bg, color: on ? '#fff' : c.fg, border: `1px solid ${on ? c.fg : 'transparent'}` }}>
                  {on && <Icon name="check" size={11} />}{tag}
                </button>
              );
            })}
            {tags.filter((tg) => !tagsReais.some((x) => x.tag === tg)).map((tg) => {
              const c = uiTone(t, 'accent');
              return (
                <button key={tg} onClick={() => toggleTag(tg)} title="Remover etiqueta" style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, letterSpacing: '.02em', padding: '5px 10px', borderRadius: 8, background: c.fg, color: '#fff', border: `1px solid ${c.fg}` }}>
                  <Icon name="check" size={11} />{tg}
                </button>
              );
            })}
          </div>
          <input value={novaTag} onChange={(e) => setNovaTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNovaTag(); } }} onBlur={addNovaTag} placeholder="Criar nova etiqueta…" style={field} />
        </div>
        {feedback && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, background: fb.bg, color: fb.fg, border: `1px solid ${frHexToRgba(fb.fg, 0.25)}` }}>
            <Icon name={feedback.type === 'ok' ? 'check' : 'alert'} size={15} /> {feedback.msg}
          </div>
        )}
        <button onClick={handleCadastrar} disabled={bloqueado}
          style={{ all: 'unset', boxSizing: 'border-box', cursor: bloqueado ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', height: 42, borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: t.accent, color: t.onAccent, border: `1px solid ${t.accent}`, boxShadow: `0 4px 12px ${frHexToRgba(t.accent, 0.28)}`, opacity: bloqueado ? 0.6 : 1, transition: 'opacity .14s' }}>
          <Icon name={salvando ? 'refresh' : 'plus'} size={17} /> {salvando ? 'Cadastrando…' : 'Cadastrar Produto'}
        </button>
      </div>
    </Card>
  );
}

// Edição REAL (rodada 16): PUT /products/:id (parcial, COALESCE no backend). O modal edita só o
// que o produto TEM — nome, etiquetas (multi, como no cadastro), unidade, mínimo e valor unitário.
// Os campos Disponível/Física do desenho SAÍRAM de propósito: a edição de produto NÃO toca stock
// no backend (products.controller: "Edição não mexe no estoque") — saldo muda por entrada/saída/
// ajuste, nunca por aqui. Ao salvar, `onSaved` recarrega a lista (o dado volta do servidor;
// nada de setState-como-fonte).
function EditProdutoModal({ t, prod, produtos, onClose, onSaved }) {
  const [f, setF] = useStateM({
    nome: prod.nome || '',
    un: prod.un || 'un',
    minimo: String(prod.min_stock != null ? prod.min_stock : 0),
    preco: (prod.precoNum != null ? prod.precoNum : parsePreco(prod.preco)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    tags: (prod.tags || []).map((x) => String(x).toUpperCase().trim()).filter(Boolean),
  });
  const [novaTag, setNovaTag] = useStateM('');
  const [salvando, setSalvando] = useStateM(false);
  const [erro, setErro] = useStateM(null);
  const set = (k, v) => { setErro(null); setF((s) => ({ ...s, [k]: v })); };
  const tagsReais = useMemoM(() => frTagsDe(produtos), [produtos]);
  const toggleTag = (tg) => set('tags', f.tags.includes(tg) ? f.tags.filter((x) => x !== tg) : [...f.tags, tg]);
  const addNovaTag = () => {
    const tg = novaTag.trim().toUpperCase();
    setNovaTag('');
    if (tg && !f.tags.includes(tg)) set('tags', [...f.tags, tg]);
  };
  const salvar = async () => {
    if (salvando) return;   // guard anti-duplo-clique
    const nomeLimpo = f.nome.trim();
    if (!nomeLimpo) { setErro('Informe o nome do produto.'); return; }
    if (!prod.product_id) { setErro('Produto sem id — recarregue a lista e tente de novo.'); return; }
    setSalvando(true);
    setErro(null);
    try {
      await window.FRApi.put(`/products/${prod.product_id}`, {
        name: nomeLimpo,
        unit: f.un,
        min_stock: f.minimo.trim() === '' ? 0 : Number(f.minimo),
        unit_price: parsePreco(f.preco),
        tags: f.tags,
      });
      if (onSaved) onSaved();   // recarrega a lista — a tela mostra o que o servidor gravou
    } catch (e) {
      const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
      setErro(gm ? gm(e) : 'Não foi possível salvar o produto.');
      setSalvando(false);       // no erro o modal fica aberto com o que foi digitado
    }
  };
  const field = { boxSizing: 'border-box', width: '100%', height: 42, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 };
  const cErr = uiTone(t, 'red');
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="pencil" size={18} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Editar produto</div><div style={{ fontSize: 12.5, color: t.muted }}>{prod.sku}</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={lab}>Nome</label><input value={f.nome} onChange={(e) => set('nome', e.target.value)} style={field} /></div>
          <div>
            <label style={lab}>Categorias e etiquetas</label>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
              {tagsReais.map(({ tag, kind }) => { const on = f.tags.includes(tag); const c = uiTone(t, kind); return (
                <button key={tag} onClick={() => toggleTag(tag)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, padding: '6px 11px', borderRadius: 8, background: on ? c.fg : c.bg, color: on ? '#fff' : c.fg, border: `1px solid ${on ? c.fg : 'transparent'}` }}>{on && <Icon name="check" size={11} />}{tag}</button>
              ); })}
              {f.tags.filter((tg) => !tagsReais.some((x) => x.tag === tg)).map((tg) => { const c = uiTone(t, 'accent'); return (
                <button key={tg} onClick={() => toggleTag(tg)} title="Remover etiqueta" style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, padding: '6px 11px', borderRadius: 8, background: c.fg, color: '#fff', border: `1px solid ${c.fg}` }}><Icon name="check" size={11} />{tg}</button>
              ); })}
            </div>
            <input value={novaTag} onChange={(e) => setNovaTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNovaTag(); } }} onBlur={addNovaTag} placeholder="Criar nova etiqueta…" style={field} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={lab}>Unidade</label>
              <div style={{ position: 'relative' }}><select value={f.un} onChange={(e) => set('un', e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 28, cursor: 'pointer' }}>{UNIDADES.map((u) => <option key={u}>{u}</option>)}</select><Icon name="chevronDown" size={14} style={{ position: 'absolute', right: 10, top: 14, color: t.muted, pointerEvents: 'none' }} /></div>
            </div>
            <div style={{ width: 96 }}><label style={lab}>Mínimo</label><input value={f.minimo} onChange={(e) => set('minimo', frSanQtd(e.target.value))} inputMode="numeric" style={field} /></div>
            <div style={{ flex: 1 }}><label style={lab}>Valor unitário</label><input value={f.preco} onChange={(e) => set('preco', e.target.value)} inputMode="decimal" placeholder="0,00" style={field} /></div>
          </div>
          <div style={{ fontSize: 11.5, color: t.faint }}>Saldo (disponível/física) não se edita aqui: estoque muda por entrada, saída ou ajuste — nunca pelo cadastro.</div>
          {erro && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, background: cErr.bg, color: cErr.fg, border: `1px solid ${frHexToRgba(cErr.fg, 0.25)}` }}>
              <Icon name="alert" size={15} /> {erro}
            </div>
          )}
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <button onClick={salvar} disabled={salvando}
            style={{ all: 'unset', boxSizing: 'border-box', cursor: salvando ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: t.accent, color: t.onAccent, opacity: salvando ? 0.6 : 1, transition: 'opacity .14s' }}>
            <Icon name={salvando ? 'refresh' : 'check'} size={16} /> {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Badge de crítico do card: o status vem do adapter (disp<=0 esgotado; disp<=min_stock baixo).
function ProdutoStatusBadge({ t, p }) {
  if (p.status === 'esgotado') return <Badge t={t} kind="red" dot>Esgotado</Badge>;
  if (p.status === 'baixo') return <Badge t={t} kind="amber" dot>Baixo</Badge>;
  return null;
}

// Menu ⋯ do card — Editar (modal real) e Arquivar (DELETE real). Extraído porque agora o
// celular também o mostra: os dois controles deixaram de ser inertes nesta rodada, então
// escondê-los do mobile seria negar função viva, não poupar de botão morto.
function ProdutoMenu({ t, p, onEdit, onConfirmArchive, onVerReservas, onImprimirEtiqueta }) {
  const [menu, setMenu] = useStateM(false);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setMenu((m) => !m)} title="Opções" style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted }}
        onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="dots" size={17} /></button>
      {menu && (
        <>
          <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
          <div style={{ position: 'absolute', zIndex: 20, top: 'calc(100% + 4px)', right: 0, width: 180, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6 }}>
            <button onClick={() => { setMenu(false); onEdit(p); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, fontSize: 13, fontWeight: 600, color: t.text }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="pencil" size={15} /> Editar produto</button>
            {/* CONSULTA DE RESERVA (D-B4): ver quanto está preso e por quem SEM tentar a saída e
                tomar erro. É leitura pura — não há "liberar" aqui, por decisão (D-B5). */}
            {onVerReservas && (
              <button data-fr="menu-ver-reservas" onClick={() => { setMenu(false); onVerReservas(p); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, fontSize: 13, fontWeight: 600, color: t.text }}
                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="lock" size={15} /> Ver reservas</button>
            )}
            {/* CAT-ET: imprimir etiqueta SEM movimento de estoque. Até aqui a impressão só
                acontecia atrelada a um documento (Conferência, Entrada por NF-e, Entrada por
                Reaproveitamento). Sem gate de tela, pelo mesmo motivo do "Ver reservas": não
                move saldo, não expõe custo e não chama backend nenhum — o ZPL sai do dado que
                a grade já tem e vai direto para a impressora local. Fechar isto com
                `estoque:edit` seria mais restritivo que "Arquivar produto", que é destrutivo
                e não tem gate. */}
            {onImprimirEtiqueta && (
              <button data-fr="menu-imprimir-etiqueta" onClick={() => { setMenu(false); onImprimirEtiqueta(p); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, fontSize: 13, fontWeight: 600, color: t.text }}
                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="printer" size={15} /> Imprimir etiqueta</button>
            )}
            <button onClick={() => { setMenu(false); onConfirmArchive(); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, fontSize: 13, fontWeight: 600, color: uiTone(t, 'red').fg }}
              onMouseEnter={(e) => { e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="trash" size={15} /> Arquivar produto</button>
          </div>
        </>
      )}
    </div>
  );
}

// Sobreposição de confirmação do arquivamento — DELETE /products/:id REAL (rodada 16). No
// backend isso é active=false ("Excluir" seria mentira: o produto vai pra lista de inativos e
// tem rota de reativação). `onArchive` é async: o botão trava enquanto envia e o erro aparece
// aqui dentro, sem fechar a confirmação.
function ProdutoConfirmArquivar({ t, p, onArchive, onClose }) {
  const [enviando, setEnviando] = useStateM(false);
  const [erro, setErro] = useStateM(null);
  const c = uiTone(t, 'red');
  const confirmar = async () => {
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    try { await onArchive(p); } catch (e) {
      const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
      setErro(gm ? gm(e) : 'Não foi possível arquivar.');
      setEnviando(false);
    }
  };
  return (
    <div onClick={() => !enviando && onClose()} style={{ position: 'absolute', inset: 0, zIndex: 25, borderRadius: 16, background: frHexToRgba(t.panel === '#ffffff' ? '#ffffff' : '#0e0f12', 0.96), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, textAlign: 'center', border: `1px solid ${t.borderStrong}` }}>
      <span style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, color: c.fg, display: 'grid', placeItems: 'center' }}><Icon name="trash" size={22} /></span>
      <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>Arquivar “{p.nome}”?</div>
      <div style={{ fontSize: 12, color: t.muted }}>Sai do catálogo; reativável pela lista de inativos.</div>
      {erro && <div style={{ fontSize: 12, fontWeight: 700, color: c.fg }}>{erro}</div>}
      <div style={{ display: 'flex', gap: 10 }} onClick={(e) => e.stopPropagation()}>
        <Btn t={t} kind="ghost" onClick={() => !enviando && onClose()}>Cancelar</Btn>
        <button onClick={confirmar} disabled={enviando} style={{ all: 'unset', cursor: enviando ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: c.fg, color: '#fff', opacity: enviando ? 0.6 : 1 }}>
          <Icon name={enviando ? 'refresh' : 'trash'} size={16} /> {enviando ? 'Arquivando…' : 'Arquivar'}
        </button>
      </div>
    </div>
  );
}

// Foto do produto (capability herdada da galeria 'Produtos'): image_url REAL via adapter.
// Só aparece quando o produto TEM foto — sem placeholder cinza ocupando 200px de nada.
function ProdutoFoto({ t, p }) {
  // BW: a listagem não traz mais a imagem — só `has_image`. A foto vem SOB DEMANDA, e só para
  // este cartão (que só existe se estiver na página visível). `p.img` continua sendo respeitado
  // se vier de outra fonte.
  const buscada = window.frFotoProduto ? window.frFotoProduto(p.product_id_foto || p.product_id, !p.img && !!p.has_image) : null;
  const fonte = p.img ? window.__asset(p.img) : buscada;
  if (!p.has_image && !p.img) return null;   // sem foto: nada (idêntico ao comportamento anterior)
  if (!fonte) return null;                   // ainda carregando: não ocupa espaço, como antes
  const out = p.disp <= 0;
  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 14, border: `1px solid ${t.border}` }}>
      <img src={fonte} alt={p.nome} style={{ display: 'block', width: '100%', height: 150, objectFit: p.imgFit || 'cover', padding: p.imgFit === 'contain' ? 16 : 0, boxSizing: 'border-box', background: '#ffffff' }} />
      <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 11, fontWeight: 800, padding: '5px 11px', borderRadius: 999, color: '#fff', background: out ? '#ef4444' : '#10b981', boxShadow: '0 4px 10px rgba(0,0,0,.25)' }}>{out ? 'Esgotado' : `${p.disp} ${p.un}`}</span>
    </div>
  );
}

function ProdutoCard({ t, p, onEdit, onArchive, mobile, onVerReservas, onImprimirEtiqueta }) {
  const [confirm, setConfirm] = useStateM(false);
  const out = p.disp <= 0;

  // CARTÃO COMPACTO (redesign, variante mobile): coluna com disponível/físico/unitário e
  // tipografia menor. Ganhou o menu ⋯ nesta rodada — editar/arquivar agora são VIVOS.
  if (mobile) {
    return (
      <Card t={t} style={{ padding: '18px 18px 16px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <Badge t={t} kind="gray">{p.sku}</Badge>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ProdutoStatusBadge t={t} p={p} />
            {p.tag && <Badge t={t} kind={p.kind}>{p.tag}</Badge>}
            <ProdutoMenu t={t} p={p} onEdit={onEdit} onConfirmArchive={() => setConfirm(true)} onVerReservas={onVerReservas} onImprimirEtiqueta={onImprimirEtiqueta} />
          </div>
        </div>
        <div style={{ fontSize: 15.5, fontWeight: 850, color: t.text, margin: '10px 0 14px', letterSpacing: '-.01em', lineHeight: 1.3 }}>{p.nome}</div>
        <ProdutoFoto t={t} p={p} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
          <div>
            <div style={{ fontSize: 9.5, letterSpacing: '.08em', fontWeight: 800, color: t.faint }}>DISPONÍVEL</div>
            <div style={{ fontSize: 20, fontWeight: 850, color: out ? uiTone(t, 'red').fg : t.accentText, lineHeight: 1.15 }}>{p.disp} <span style={{ fontSize: 11, color: t.muted, fontWeight: 700 }}>{p.un}</span></div>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', color: t.faint, marginTop: 3 }}>FÍSICA: <span style={{ color: t.muted }}>{p.estoque} {p.un}</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9.5, letterSpacing: '.08em', fontWeight: 800, color: t.faint, marginBottom: 4 }}>UNITÁRIO</div>
            <div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>{p.preco}</div>
          </div>
        </div>
        {confirm && <ProdutoConfirmArquivar t={t} p={p} onArchive={onArchive} onClose={() => setConfirm(false)} />}
      </Card>
    );
  }

  return (
    <Card t={t} hover style={{ padding: 22, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <Badge t={t} kind="gray">{p.sku}</Badge>
        <ProdutoMenu t={t} p={p} onEdit={onEdit} onConfirmArchive={() => setConfirm(true)} onVerReservas={onVerReservas} onImprimirEtiqueta={onImprimirEtiqueta} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 850, color: t.text, margin: '14px 0 11px', letterSpacing: '-.01em', lineHeight: 1.25 }}>{p.nome}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: p.img ? 14 : 0 }}>
        {p.tag && <Badge t={t} kind={p.kind}>{p.tag}</Badge>}
        <ProdutoStatusBadge t={t} p={p} />
      </div>
      <ProdutoFoto t={t} p={p} />
      <div style={{ display: 'flex', gap: 10, marginTop: p.img ? 0 : 20 }}>
        <div style={{ flex: 1, padding: '13px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 9.5, letterSpacing: '.06em', fontWeight: 700, color: t.faint }}>DISPONÍVEL</div>
          <div style={{ fontSize: 24, fontWeight: 850, color: out ? uiTone(t, 'red').fg : t.accentText, marginTop: 4 }}>{p.disp} <span style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>{p.un}</span></div>
        </div>
        <div style={{ flex: 1, padding: '13px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 9.5, letterSpacing: '.06em', fontWeight: 700, color: t.faint }}>FÍSICA</div>
          <div style={{ fontSize: 24, fontWeight: 850, color: t.text, marginTop: 4 }}>{p.estoque} <span style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>{p.un}</span></div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 15, borderTop: `1px solid ${t.border}` }}>
        {/* Edição de valor: só pelo modal (PUT real). O lápis inline inerte da leva 1 morreu. */}
        <div style={{ fontSize: 10, letterSpacing: '.06em', fontWeight: 700, color: t.faint }}>VALOR UNITÁRIO</div>
        <div style={{ fontSize: 20, fontWeight: 850, color: t.text }}>{p.preco}</div>
      </div>
      {confirm && <ProdutoConfirmArquivar t={t} p={p} onArchive={onArchive} onClose={() => setConfirm(false)} />}
    </Card>
  );
}

// SKU canônico d.dd.dddd — MESMO normalizador do import da Entrada por NF (pages_admin.jsx):
// tolera zero à esquerda e segmento curto; sem os 2 pontos devolve cru (não casa → "desconhecido" honesto).
function frNormSku(v) {
  const s = String(v == null ? '' : v).trim();
  const m = s.match(/^0*(\d)\.0*(\d{1,2})\.0*(\d{1,4})$/);
  if (!m) return s;
  return `${m[1]}.${m[2].padStart(2, '0')}.${m[3].padStart(4, '0')}`;
}

// ============================================================================================
// INVENTÁRIO — modal de DUAS VIAS (lote R2), sobre o POST /stock/recount (lote R1, backend).
// ============================================================================================
// Aba "Recontagem rápida": busca item -> confere o que o sistema diz -> digita o que contou ->
// registra. Uma chamada por item, cada uma com a sua âncora de idempotência.
// Aba "Em massa (planilha)": o preview que já existia, agora LIGADO — processa em lotes de 500.
//
// "NO SISTEMA" é sempre o FÍSICO (`estoque` = quantity_on_hand), nunca o disponível: inventário
// conta o que está na prateleira, e o material reservado está fisicamente lá.
//
// Unidades que aceitam fração — CÓPIA EXATA do Set do servidor (stock.controller.ts, RECOUNT_
// DECIMAL_UNITS, que por sua vez espelha requests.controller.ts:15). 'UND' fica FORA (é sinônimo
// de unidade, não medida contínua) e 'MT' fica DENTRO (fidelidade à lista, embora o catálogo só
// use 'M'). A TELA NUNCA PODE SER MAIS PERMISSIVA QUE O SERVIDOR: divergir aqui faria o operador
// digitar um valor que a tela aceita e a API recusa com 400. Quarta cópia da mesma lista no
// projeto — unificação registrada no DIVIDAS.md.
// UNIFICADO no lote V: a régua por unidade vive em `window.FRAdapters.isDecimalUnit`
// (lib/adapters.js), que por sua vez espelha DECIMAL_UNITS do backend. Havia TRÊS cópias deste
// Set no front — esta era uma delas. Fallback local no padrão da casa: se a lib não carregou,
// ninguém quebra, e o default é CONTAGEM (o seguro).
const invIsDecimalUnit = (un) => {
  const f = window.FRAdapters && window.FRAdapters.isDecimalUnit;
  return f ? f(un) : false;
};
// Espelha MAX_ITENS do POST /stock/recount. O servidor devolve 400 acima disso; o fatiamento é
// responsabilidade DESTA tela (decisão do R1).
const INV_MAX_LOTE = 500;

// POST /stock/recount — X-Idempotency-Key é OBRIGATÓRIO (400 sem ele).
function frStockRecount(items, idemKey) {
  return window.FRApi.post('/stock/recount', { items: items }, { headers: { 'X-Idempotency-Key': idemKey } });
}

// Erro do backend em texto (o 400 do AJUSTE_ABAIXO_RESERVA já vem com os dois números prontos).
function invErr(e) {
  const g = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
  return g ? g(e) : (e && e.message) || 'Erro inesperado.';
}

// Aba em pill — cópia local do padrão do Confronto (pages_rest.jsx). A casa copia helper de
// layout em vez de promover a lib; são 4 cópias hoje (Confronto, Dev, Montagem, Permissões).
function InvTabBtn({ t, id, atual, onSel, icon, children }) {
  const on = atual === id;
  return (
    <button onClick={() => onSel(id)} type="button"
      style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: on ? t.accent : 'transparent', color: on ? t.onAccent : t.muted, border: `1px solid ${on ? t.accent : t.border}` }}>
      <Icon name={icon} size={15} /> {children}
    </button>
  );
}

// Miniatura do produto. `image_url` é opcional no catálogo e o card devolve `img: undefined`
// quando não há foto — o ícone genérico NÃO existia no projeto (nenhuma tela desenhava
// placeholder; o ProdutoCard só ajustava espaçamento). Nasce aqui.
// BW: aceita `p` (o card) e busca a foto sob demanda; `img` direto continua funcionando para
// quem já tem a URL. Sem foto → o mesmo ícone genérico de antes, e ZERO requisição.
function InvMiniatura({ t, img, p, size = 40 }) {
  const buscada = window.frFotoProduto
    ? window.frFotoProduto(p ? (p.product_id_foto || p.product_id) : null, !img && !!(p && p.has_image))
    : null;
  const fonte = img || buscada;
  const base = { width: size, height: size, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', overflow: 'hidden' };
  if (fonte) return <div style={{ ...base, background: t.elevated, border: `1px solid ${t.border}` }}><img src={fonte} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>;
  return <div style={{ ...base, background: t.hover, border: `1px dashed ${t.border}`, color: t.faint }}><Icon name="box" size={Math.round(size * 0.5)} /></div>;
}

// Linha de resultado da busca. O SLOT DO BADGE TEM LARGURA FIXA: 62% dos produtos não têm tag
// (`p.tag` vem null e o Badge não renderiza) — sem o slot reservado a linha pula de largura
// conforme o item tenha ou não etiqueta.
function InvLinhaProduto({ t, p, onSel }) {
  const zerado = window.FRAdapters.parseNumber(p.estoque) === 0;
  const reservado = window.FRAdapters.parseNumber(p.reserved);
  return (
    <button onClick={() => onSel(p)} type="button"
      style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '9px 11px', borderRadius: 12, border: `1px solid ${t.border}`, background: t.elevated }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = t.hover; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.elevated; }}>
      <InvMiniatura t={t} img={p.img} p={p} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</div>
        <div style={{ fontSize: 11.5, color: t.muted, fontFamily: 'ui-monospace, monospace' }}>{p.sku}</div>
      </div>
      <span style={{ width: 82, flexShrink: 0, display: 'inline-flex', justifyContent: 'flex-end' }}>
        {p.tag ? <Badge t={t} kind={p.kind}>{p.tag}</Badge> : null}
      </span>
      {/* Coluna do saldo com ALTURA e LARGURA fixas: a 2ª linha (reservado ou "zerado") existe só
          para alguns itens, e sem a reserva de espaço a lista pularia entre um item e o seguinte —
          mesmo cuidado do slot do badge acima. O reservado aparece DISCRETO e só quando > 0; é
          parte do saldo exibido, nunca subtraído dele. */}
      <div style={{ width: 116, flexShrink: 0, textAlign: 'right', minHeight: 34 }}>
        <div style={{ fontSize: 15, fontWeight: 850, color: zerado ? t.faint : t.text, whiteSpace: 'nowrap' }}>{p.estoque} <span style={{ fontSize: 10.5, fontWeight: 700, color: t.muted }}>{p.un}</span></div>
        {zerado
          ? <div style={{ fontSize: 10, fontWeight: 800, color: uiTone(t, 'amber').fg }}>ZERADO NO SISTEMA</div>
          : reservado > 0
            ? <div style={{ fontSize: 10.5, fontWeight: 700, color: t.muted, whiteSpace: 'nowrap' }}>· {reservado} reservado{reservado === 1 ? '' : 's'}</div>
            : null}
      </div>
    </button>
  );
}

// ── ABA 1: RECONTAGEM RÁPIDA ────────────────────────────────────────────────────────────────
// Ciclo do Apontamentos (producaoger.jsx): a âncora de idempotência NASCE NA SELEÇÃO do item,
// SOBREVIVE ao erro (o retry reusa a mesma chave e o servidor responde replay em vez de aplicar
// de novo) e é QUEIMADA só no sucesso. Uma chave POR ITEM registrado — "sessão" é agrupamento
// visual, não escopo de chave.
function InvRecontagem({ t, produtos, podeEscrever, motivoSemPermissao, onRegistrado }) {
  const [q, setQ] = useStateM('');
  const [sel, setSel] = useStateM(null);
  const [idemKey, setIdemKey] = useStateM(null);
  const [contado, setContado] = useStateM('');
  const [busy, setBusy] = useStateM(false);
  const [erro, setErro] = useStateM(null);
  const [aviso, setAviso] = useStateM(null);
  const buscaRef = useRefM(null);
  const qtdRef = useRefM(null);

  const ql = q.trim().toLowerCase();
  // Busca client-side sobre o catálogo JÁ CARREGADO (useFRProducts traz tudo; o Catálogo faz
  // igual). SKU EXATO PRIMEIRO — é o que o leitor de código de barras entrega — e só então nome.
  const resultados = useMemoM(() => {
    if (!ql) return [];
    const exato = (produtos || []).filter((p) => String(p.sku).toLowerCase() === ql);
    const resto = (produtos || []).filter((p) => String(p.sku).toLowerCase() !== ql
      && (String(p.sku).toLowerCase().includes(ql) || String(p.nome).toLowerCase().includes(ql)));
    return [...exato, ...resto].slice(0, 8);
  }, [produtos, ql]);

  const selecionar = (p) => {
    setSel(p);
    setQ('');
    setErro(null);
    setAviso(null);
    setIdemKey(window.pgGenKey());          // âncora nasce aqui e sobrevive ao erro
    setContado(String(p.estoque));
    setTimeout(() => qtdRef.current && qtdRef.current.select(), 0);
  };

  const buscarEnter = () => {
    if (!ql) return;
    const exato = (produtos || []).find((p) => String(p.sku).toLowerCase() === ql);
    if (exato) return selecionar(exato);
    if (resultados.length === 1) return selecionar(resultados[0]);
    if (resultados.length === 0) setAviso(`"${q.trim()}" não está no catálogo ativo.`);
  };

  const cancelar = () => { setSel(null); setContado(''); setIdemKey(null); setErro(null); setTimeout(() => buscaRef.current && buscaRef.current.focus(), 0); };

  // Entrada por unidade: inteira aceita só dígitos; decimal aceita UMA vírgula/ponto. Filtrar na
  // digitação é REJEITAR, não truncar — o Recebimento truncava com parseInt e comia a fração.
  const aceitaFracao = sel ? invIsDecimalUnit(sel.un) : false;
  const setQtd = (v) => {
    // LOTE V: o ramo de CONTAGEM usava /[^0-9]/ e comia a vírgula — "2,5" virava "25". Agora os
    // DOIS ramos mantêm o separador visível; quem decide se a fração vale é o parse, não o teclado.
    let s = frSanQtd(v);
    if (aceitaFracao) {
      s = s.replace(',', '.');
      const partes = s.split('.');
      if (partes.length > 2) s = `${partes[0]}.${partes.slice(1).join('')}`;
    }
    setContado(s);
  };

  const nContado = contado === '' ? null : Number(contado);
  const contadoValido = nContado != null && Number.isFinite(nContado) && nContado >= 0
    && (aceitaFracao || Number.isInteger(nContado));
  const fracaoInvalida = nContado != null && Number.isFinite(nContado) && !aceitaFracao && !Number.isInteger(nContado);
  const noSistema = sel ? window.FRAdapters.parseNumber(sel.estoque) : 0;
  const reservado = sel ? window.FRAdapters.parseNumber(sel.reserved) : 0;
  const delta = contadoValido ? nContado - noSistema : null;
  // Piso do servidor: contagem abaixo do reservado volta 400 (AJUSTE_ABAIXO_RESERVA). Avisamos
  // ANTES do envio — sem isto o operador só descobre depois de mandar.
  const abaixoDoReservado = contadoValido && reservado > 0 && nContado < reservado;

  const registrar = async () => {
    if (busy || !sel || !contadoValido || abaixoDoReservado || !podeEscrever) return;
    setBusy(true);
    setErro(null);
    try {
      const res = await frStockRecount([{ product_id: sel.product_id, counted_qty: nContado }], idemKey);
      const item = (res.data && res.data.items && res.data.items[0]) || null;
      // A linha da sessão é ESTADO CONGELADO DA RESPOSTA (nunca derivada de `produtos`: o hook
      // refaz o fetch a cada stock_updated e o "antes" seria reescrito pelo saldo novo).
      // ⚠ A resposta do POST /stock/recount NÃO traz `reserved` — e a linha fica SEM ele de
      // propósito. Buscar o reservado em `produtos` para completar reintroduziria exatamente o
      // bug que esta régua evita: o valor viria do saldo de AGORA, não do instante da contagem,
      // e a linha passaria a mentir sobre o que foi contado.
      onRegistrado({
        key: `${idemKey}:${sel.product_id}`,
        product_id: sel.product_id,
        sku: item ? item.sku : sel.sku,
        nome: sel.nome,
        img: sel.img,
        un: sel.un,
        active: item ? item.active : sel.active,
        antes: item ? item.antes : noSistema,
        depois: item ? item.depois : nContado,
        delta: item ? item.delta : (nContado - noSistema),
        status: item ? item.status : 'aplicado',
        hora: new Date(),
      });
      setSel(null); setContado(''); setIdemKey(null);   // só o SUCESSO queima a chave
      setTimeout(() => buscaRef.current && buscaRef.current.focus(), 0);
    } catch (e) {
      // NO ERRO: seleção e MESMA chave ficam de pé (o retry é idempotente). A mensagem do 400 vai
      // CRUA para a tela — ela já traz os dois números do piso de reserva.
      setErro(invErr(e));
    } finally { setBusy(false); }
  };

  const field = { boxSizing: 'border-box', height: 46, borderRadius: 12, border: `1px solid ${t.border}`, background: t.panel, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const cRed = uiTone(t, 'red');
  const cAmb = uiTone(t, 'amber');

  if (!sel) {
    return (
      <div>
        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 }}>Bipe o código ou busque por nome</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 220, ...field }}>
            <Icon name="search" size={17} style={{ color: t.muted, flexShrink: 0 }} />
            <input ref={buscaRef} value={q} onChange={(e) => { setQ(e.target.value); setAviso(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarEnter(); } }}
              placeholder="SKU ou nome do produto" autoFocus
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
          </div>
        </div>
        {aviso && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 12px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, background: cAmb.bg, color: cAmb.fg }}>
            <Icon name="alert" size={15} /> {aviso}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {resultados.map((p) => <InvLinhaProduto key={p.product_id || p.sku} t={t} p={p} onSel={selecionar} />)}
        </div>
        {!ql && (
          <div style={{ marginTop: 16, fontSize: 12.5, color: t.muted, lineHeight: 1.5 }}>
            A contagem corrige o <b style={{ color: t.text }}>saldo físico</b> do almoxarifado. Item reservado continua na prateleira: o sistema recusa contagem abaixo do que está reservado.
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 14, border: `1px solid ${t.border}`, background: t.elevated, marginBottom: 16 }}>
        <InvMiniatura t={t} img={sel.img} p={sel} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{sel.nome}</span>
            {sel.tag && <Badge t={t} kind={sel.kind}>{sel.tag}</Badge>}
            {/* Produto ARQUIVADO é contável (decisão do R1: a prateleira não sabe do catálogo) —
                sinaliza, não bloqueia. */}
            {sel.active === false && <Badge t={t} kind="amber">FORA DO CATÁLOGO</Badge>}
          </div>
          <div style={{ fontSize: 12, color: t.muted, fontFamily: 'ui-monospace, monospace' }}>{sel.sku}</div>
        </div>
        <Btn t={t} kind="ghost" icon="x" onClick={cancelar}>Trocar item</Btn>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160, padding: '13px 15px', borderRadius: 13, border: `1px solid ${t.border}`, background: t.panel }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', color: t.faint, textTransform: 'uppercase' }}>No sistema</div>
          <div style={{ fontSize: 26, fontWeight: 850, color: t.text, lineHeight: 1.2, marginTop: 4 }}>{noSistema} <span style={{ fontSize: 12, fontWeight: 700, color: t.muted }}>{sel.un}</span></div>
          {/* DECOMPOSIÇÃO do saldo, não subtração: o reservado é uma PARTE do que está na
              prateleira. Aqui NUNCA se exibe "disponível" (on_hand − reserved) — a contagem
              física compara com o que EXISTE, não com o que está livre, e mostrar o disponível
              induziria o operador a contar menos. Por isso `disp` é proibido neste fluxo. */}
          {reservado > 0 && (
            <div style={{ fontSize: 11.5, color: t.muted, fontWeight: 700, marginTop: 5 }}>dos quais <b style={{ color: cAmb.fg }}>{reservado} {sel.un}</b> reservado{reservado === 1 ? '' : 's'}</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 160, padding: '13px 15px', borderRadius: 13, border: `1px solid ${t.accent}`, background: t.accentSoft }}>
          <label htmlFor="inv-contagem" style={{ display: 'block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', color: t.accentText, textTransform: 'uppercase' }}>Contagem física</label>
          <input id="inv-contagem" ref={qtdRef} value={contado} onChange={(e) => setQtd(e.target.value)}
            inputMode={aceitaFracao ? 'decimal' : 'numeric'}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); registrar(); } }}
            style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 26, fontWeight: 850, fontFamily: 'inherit' }} />
          <div style={{ fontSize: 11.5, color: t.muted, fontWeight: 700 }}>{aceitaFracao ? `em ${sel.un} — aceita fração` : `em ${sel.un} — número inteiro`}</div>
        </div>
      </div>

      {/* MICROCOPY OBRIGATÓRIA — é o erro que este lote existe para evitar: o operador vê "1
          reservado" e desconta da contagem, achando que reservado é material que saiu. Não saiu:
          está na prateleira, com dono. Contar sem ele produz uma falta que não existe. Discreta
          de propósito (não é alerta — é instrução), e sempre presente, não só quando há reserva. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 10, fontSize: 11.5, color: t.muted, lineHeight: 1.45 }}>
        <Icon name="box" size={13} style={{ flexShrink: 0, marginTop: 2, color: t.faint }} />
        <span>Material reservado está na prateleira: conte tudo o que encontrar, inclusive o reservado.</span>
      </div>

      {fracaoInvalida && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 12px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, background: cRed.bg, color: cRed.fg }}>
          <Icon name="alert" size={15} /> A unidade "{sel.un}" não aceita casas decimais.
        </div>
      )}
      {abaixoDoReservado && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 12px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, background: cRed.bg, color: cRed.fg }}>
          <Icon name="alert" size={15} /> Contagem ({nContado}) menor que o reservado ({reservado}). O sistema não permite ajustar abaixo do que está reservado.
        </div>
      )}
      {delta != null && delta !== 0 && !abaixoDoReservado && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12, padding: '11px 13px', borderRadius: 12, fontSize: 12.5, fontWeight: 700, background: cAmb.bg, color: cAmb.fg }}>
          <Icon name="alert" size={15} style={{ flexShrink: 0 }} />
          <span>{delta < 0 ? `Falta de ${Math.abs(delta)} ${sel.un}` : `Sobra de ${delta} ${sel.un}`} — o estoque será ajustado para <b>{nContado} {sel.un}</b>.</span>
        </div>
      )}
      {delta === 0 && (
        <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: uiTone(t, 'green').fg }}>Contagem bate com o sistema — o registro confirma o saldo.</div>
      )}
      {erro && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 12, padding: '9px 11px', borderRadius: 10, background: cRed.bg, color: cRed.fg, fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
          <Icon name="alert" size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {erro}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <span title={podeEscrever ? undefined : motivoSemPermissao} style={{ display: 'inline-flex' }}>
          <button onClick={registrar} disabled={!podeEscrever || busy || !contadoValido || abaixoDoReservado} type="button"
            style={{ all: 'unset', boxSizing: 'border-box', cursor: (!podeEscrever || busy || !contadoValido || abaixoDoReservado) ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: t.accent, color: t.onAccent, opacity: (!podeEscrever || busy || !contadoValido || abaixoDoReservado) ? 0.45 : 1 }}>
            <Icon name={busy ? 'refresh' : 'check'} size={16} style={busy ? { animation: 'fr-spin .7s linear infinite' } : undefined} /> {busy ? 'Registrando…' : 'Registrar contagem'}
          </button>
        </span>
      </div>
    </div>
  );
}

// ── ABA 2: PLANILHA ─────────────────────────────────────────────────────────────────────────
function InvPlanilha({ t, produtos, podeEscrever, motivoSemPermissao, onLote }) {
  const [drag, setDrag] = useStateM(false);
  const [fileName, setFileName] = useStateM(null);
  const [linhas, setLinhas] = useStateM(null);   // null = sem arquivo; [] = arquivo sem linha válida
  const [parseErro, setParseErro] = useStateM(null);
  const [busy, setBusy] = useStateM(false);
  const [erroEnvio, setErroEnvio] = useStateM(null);
  const [resumo, setResumo] = useStateM(null);

  const baixarModelo = () => {
    // Modelo pré-preenchido com o catálogo REAL carregado: SKU + Nome, contagem em branco.
    const dados = [['SKU', 'Nome', 'Quantidade Contada'], ...(produtos || []).map((p) => [p.sku, p.nome, ''])];
    const ws = XLSX.utils.aoa_to_sheet(dados);
    // Blindagem anti-colapso (mesma da Entrada por NF): SKU como TEXTO explícito, senão o
    // Excel reinterpreta "9.99.0238" como número/data e o re-upload não casa mais.
    (produtos || []).forEach((p, i) => {
      const addr = XLSX.utils.encode_cell({ c: 0, r: i + 1 });
      ws[addr] = { t: 's', v: String(p.sku), z: '@' };
    });
    ws['!cols'] = [{ wch: 14 }, { wch: 40 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventário');
    XLSX.writeFile(wb, 'modelo-inventario.xlsx');
  };

  const lerArquivo = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setParseErro(null);
    setLinhas(null);
    setResumo(null);
    setErroEnvio(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });   // XLSX.read cobre .xlsx e .csv
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) { setParseErro('Não foi possível ler a planilha (sem abas).'); return; }
      const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
      if (!matriz.length) { setParseErro('Planilha vazia.'); return; }
      const porSku = new Map((produtos || []).map((p) => [frNormSku(p.sku), p]));
      // Contado: coluna C do modelo; se a linha só tem 2 colunas (A=SKU, B=qtd), aceita B.
      const contadoDe = (linha) => {
        const c = String(linha[2] == null ? '' : linha[2]).trim();
        if (c !== '') return c;
        return String(linha[1] == null ? '' : linha[1]).trim();
      };
      // Cabeçalho: 1ª linha sem contagem numérica → pula (mesma heurística da Entrada).
      const inicio = (matriz[0] && !Number.isFinite(Number(contadoDe(matriz[0]).replace(',', '.')))) ? 1 : 0;
      const vistos = new Set();
      const out = [];
      for (let i = inicio; i < matriz.length; i++) {
        const linha = matriz[i] || [];
        const skuRaw = String(linha[0] == null ? '' : linha[0]).trim();
        if (!skuRaw) continue;                                   // linha vazia
        const contadoRaw = contadoDe(linha);
        if (contadoRaw === '') continue;                          // sem contagem → item não contado, fora do preview
        const contado = Number(contadoRaw.replace(',', '.'));
        const chave = frNormSku(skuRaw);
        // DUPLICATA É SINALIZADA, NÃO DEDUPLICADA (antes: `vistos.has -> continue`, e a 2ª
        // contagem sumia em silêncio). Duas contagens do mesmo SKU são discordância física do
        // operador, não empate a resolver por regra — e o servidor recusa o lote com 400 pelo
        // mesmo motivo. Quem decide qual vale é quem contou.
        const duplicada = vistos.has(chave);
        vistos.add(chave);
        const prod = porSku.get(chave) || null;
        const contadoOk = Number.isFinite(contado) && contado >= 0;
        // Fração em unidade inteira é recusada AQUI, com o mesmo Set do servidor.
        const fracaoRuim = contadoOk && prod && !invIsDecimalUnit(prod.un) && !Number.isInteger(contado);
        out.push({
          sku: prod ? prod.sku : skuRaw,
          nome: prod ? prod.nome : null,
          product_id: prod ? prod.product_id : null,   // a lacuna do preview antigo: sem isto não dá para POSTar
          un: prod ? prod.un : '',
          contado: contadoOk ? contado : null,
          sistema: prod ? prod.estoque : null,
          delta: prod && contadoOk ? contado - prod.estoque : null,
          desconhecido: !prod,
          invalido: !contadoOk || fracaoRuim,
          fracaoRuim: !!fracaoRuim,
          duplicada: duplicada,
        });
      }
      setLinhas(out);
    } catch (e) {
      setParseErro('Não foi possível ler a planilha. Confirme que é um .xlsx ou .csv válido.');
    }
  };

  const desconhecidos = (linhas || []).filter((l) => l.desconhecido).length;
  const invalidos = (linhas || []).filter((l) => l.invalido).length;
  const duplicadas = (linhas || []).filter((l) => l.duplicada).length;
  const comDelta = (linhas || []).filter((l) => l.delta != null && l.delta !== 0).length;
  const cAmb = uiTone(t, 'amber');
  const cRed = uiTone(t, 'red');
  const deltaCor = (d) => (d > 0 ? uiTone(t, 'green').fg : d < 0 ? cRed.fg : t.muted);
  const fmtDelta = (d) => (d > 0 ? `+${d}` : String(d));

  const podeProcessar = !!linhas && linhas.length > 0 && invalidos === 0 && desconhecidos === 0 && duplicadas === 0 && !busy && podeEscrever;

  const processar = async () => {
    if (!podeProcessar) return;
    setBusy(true);
    setErroEnvio(null);
    setResumo(null);
    // FATIAMENTO em blocos de <=500 (o servidor recusa acima disso). UMA CHAVE POR LOTE, não uma
    // para a planilha inteira: se o lote 3 falhar, o retry precisa reenviar SÓ o 3 — com chave de
    // planilha o reenvio inteiro viraria replay e os lotes que faltavam nunca entrariam.
    const lotes = [];
    for (let i = 0; i < linhas.length; i += INV_MAX_LOTE) lotes.push(linhas.slice(i, i + INV_MAX_LOTE));
    let aplicados = 0;
    const registrados = [];
    try {
      for (const lote of lotes) {
        const chaveDoLote = window.pgGenKey();
        const res = await frStockRecount(lote.map((l) => ({ product_id: l.product_id, counted_qty: l.contado })), chaveDoLote);
        const itens = (res.data && res.data.items) || [];
        itens.forEach((it) => registrados.push(it));
        aplicados += 1;
      }
      setResumo({ ok: true, aplicados, total: lotes.length, itens: registrados.length });
      onLote(registrados, linhas);
      setLinhas(null);
      setFileName(null);
    } catch (e) {
      // O erro PARA a sequência: os lotes já aplicados estão no banco (cada um é atômico em si),
      // e dizer "aplicados N de M" é o único relato honesto — nem "deu certo" nem "falhou tudo".
      setErroEnvio(`${invErr(e)} — aplicados ${aplicados} de ${lotes.length} lote(s).`);
      setResumo({ ok: false, aplicados, total: lotes.length, itens: registrados.length });
      if (registrados.length) onLote(registrados, linhas);
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 14, background: t.accentSoft, border: `1px solid ${frHexToRgba(t.accent, 0.25)}`, marginBottom: 18 }}>
        <Icon name="sheet" size={22} style={{ color: t.accentText, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>Modelo de planilha</div><div style={{ fontSize: 11.5, color: t.muted }}>Colunas: SKU · Nome · Quantidade Contada — já vem com o catálogo atual.</div></div>
        <button onClick={baixarModelo} type="button"
          style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: t.panel, color: t.accentText, border: `1px solid ${t.border}` }}><Icon name="download" size={15} /> Baixar modelo</button>
      </div>
      <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); lerArquivo(e.dataTransfer.files[0]); }}
        style={{ display: 'block', cursor: 'pointer', borderRadius: 16, padding: '28px 20px', textAlign: 'center', border: `2px dashed ${drag ? t.accent : t.borderStrong}`, background: drag ? t.accentSoft : t.elevated, transition: 'all .15s' }}>
        <input type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={(e) => { lerArquivo(e.target.files[0]); e.target.value = ''; }} />
        <div style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: 15, display: 'grid', placeItems: 'center', background: t.accentSoft, color: t.accentText }}><Icon name="upload" size={24} /></div>
        <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{fileName || 'Arraste a planilha ou clique para selecionar'}</div>
        <div style={{ fontSize: 12.5, color: t.muted, marginTop: 5 }}>Formatos aceitos: .xlsx, .csv</div>
      </label>
      {parseErro && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 12px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, background: cRed.bg, color: cRed.fg, border: `1px solid ${frHexToRgba(cRed.fg, 0.25)}` }}>
          <Icon name="alert" size={15} /> {parseErro}
        </div>
      )}
      {resumo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 12px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, background: resumo.ok ? uiTone(t, 'green').bg : cAmb.bg, color: resumo.ok ? uiTone(t, 'green').fg : cAmb.fg }}>
          <Icon name={resumo.ok ? 'check' : 'alert'} size={15} /> {resumo.ok ? `Inventário processado: ${resumo.itens} item(ns) em ${resumo.total} lote(s).` : `Parcial: aplicados ${resumo.aplicados} de ${resumo.total} lote(s) · ${resumo.itens} item(ns).`}
        </div>
      )}
      {erroEnvio && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 12, padding: '9px 11px', borderRadius: 10, background: cRed.bg, color: cRed.fg, fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
          <Icon name="alert" size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {erroEnvio}
        </div>
      )}
      {linhas && !parseErro && (
        linhas.length === 0 ? (
          <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, background: cAmb.bg, color: cAmb.fg }}>Nenhuma linha com contagem preenchida na planilha.</div>
        ) : (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <Badge t={t} kind="accent" dot>{linhas.length} {linhas.length === 1 ? 'item contado' : 'itens contados'}</Badge>
              <Badge t={t} kind={comDelta ? 'amber' : 'green'} dot>{comDelta} com diferença</Badge>
              {desconhecidos > 0 && <Badge t={t} kind="red" dot>{desconhecidos} SKU desconhecido{desconhecidos > 1 ? 's' : ''}</Badge>}
              {invalidos > 0 && <Badge t={t} kind="red" dot>{invalidos} contagem inválida</Badge>}
              {duplicadas > 0 && <Badge t={t} kind="red" dot>{duplicadas} SKU repetido</Badge>}
            </div>
            {duplicadas > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12, padding: '10px 12px', borderRadius: 11, fontSize: 12, fontWeight: 600, lineHeight: 1.45, background: cRed.bg, color: cRed.fg }}>
                <Icon name="alert" size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>O mesmo SKU aparece com mais de uma contagem. Isso é discordância física, não empate: corrija a planilha deixando um valor por item e importe de novo.</span>
              </div>
            )}
            <div style={{ borderRadius: 14, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto' }} className="fr-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480, fontSize: 13 }}>
                  <thead><tr>
                    {['SKU', 'Produto', 'Contado', 'Sistema', 'Delta'].map((h, k) => <th key={h} style={{ position: 'sticky', top: 0, textAlign: k >= 2 ? 'right' : 'left', padding: '10px 14px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: t.faint, borderBottom: `1px solid ${t.border}`, background: t.elevated, whiteSpace: 'nowrap' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {linhas.map((l, i) => (
                      <tr key={`${l.sku}-${i}`}>
                        <td style={{ padding: '9px 14px', fontWeight: 700, color: l.duplicada ? cRed.fg : t.text, whiteSpace: 'nowrap', borderBottom: i === linhas.length - 1 ? 'none' : `1px solid ${t.border}` }}>{l.sku}</td>
                        <td style={{ padding: '9px 14px', color: l.desconhecido || l.duplicada ? cRed.fg : t.text, borderBottom: i === linhas.length - 1 ? 'none' : `1px solid ${t.border}` }}>
                          {l.desconhecido
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><Icon name="alert" size={13} /> SKU desconhecido</span>
                            : l.duplicada
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><Icon name="alert" size={13} /> repetido na planilha</span>
                              : l.nome}
                        </td>
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: l.invalido ? cRed.fg : t.text, borderBottom: i === linhas.length - 1 ? 'none' : `1px solid ${t.border}` }}>{l.invalido ? (l.fracaoRuim ? `${l.contado} (${l.un} não aceita fração)` : 'inválida') : l.contado}</td>
                        <td style={{ padding: '9px 14px', textAlign: 'right', color: t.muted, borderBottom: i === linhas.length - 1 ? 'none' : `1px solid ${t.border}` }}>{l.sistema == null ? '—' : l.sistema}</td>
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 800, color: l.delta == null ? t.faint : deltaCor(l.delta), whiteSpace: 'nowrap', borderBottom: i === linhas.length - 1 ? 'none' : `1px solid ${t.border}` }}>{l.delta == null ? '—' : fmtDelta(l.delta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              <span style={{ marginRight: 'auto', fontSize: 11.5, color: t.faint }}>
                {linhas.length > INV_MAX_LOTE ? `Serão ${Math.ceil(linhas.length / INV_MAX_LOTE)} lotes de até ${INV_MAX_LOTE} itens.` : 'O preview não altera o estoque.'}
              </span>
              <span title={podeEscrever ? undefined : motivoSemPermissao} style={{ display: 'inline-flex' }}>
                <button onClick={processar} disabled={!podeProcessar} type="button"
                  style={{ all: 'unset', boxSizing: 'border-box', cursor: podeProcessar ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: t.accent, color: t.onAccent, opacity: podeProcessar ? 1 : 0.45 }}>
                  <Icon name={busy ? 'refresh' : 'check'} size={16} style={busy ? { animation: 'fr-spin .7s linear infinite' } : undefined} /> {busy ? 'Processando…' : 'Processar inventário'}
                </button>
              </span>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ── O MODAL ─────────────────────────────────────────────────────────────────────────────────
function InventarioModal({ t, onClose, produtos }) {
  const [aba, setAba] = useStateM('rapida');       // 'rapida' | 'planilha'
  // LISTA DA SESSÃO: estado CONGELADO das respostas do POST. Nunca derivada de `produtos` — o
  // useFRProducts refaz o fetch a cada `stock_updated` (inclusive o que ESTA tela dispara), e o
  // "antes" de cada linha seria reescrito pelo saldo novo, apagando justamente o que ela prova.
  const [sessao, setSessao] = useStateM([]);
  const registrar = (linha) => setSessao((s) => [linha, ...s]);
  const registrarLote = (itens, preview) => {
    const porId = new Map((preview || []).map((l) => [l.product_id, l]));
    setSessao((s) => [
      ...itens.map((it) => {
        const l = porId.get(it.product_id) || {};
        return { key: `${it.product_id}:${it.antes}:${it.depois}:${s.length}`, product_id: it.product_id, sku: it.sku, nome: l.nome || it.sku, img: undefined, un: l.un || '', active: it.active, antes: it.antes, depois: it.depois, delta: it.delta, status: it.status, hora: new Date() };
      }),
      ...s,
    ]);
  };

  // RBAC de tela: a chave é `estoque:edit` EXATA. Nunca `canAccess('estoque')` — o helper expande
  // por prefixo (`chave:`), então 'estoque' casaria com quem só tem `estoque:view`.
  const podeEscrever = !!(window.FRAuth && window.FRAuth.canAccess && window.FRAuth.canAccess('estoque:edit'));
  const motivoSemPermissao = 'Requer a permissão "estoque:edit" — fale com o administrador.';

  const cAmb = uiTone(t, 'amber');

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(720px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="clipboard" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Fazer Inventário</div><div style={{ fontSize: 12.5, color: t.muted }}>Reconte um item na hora ou importe a planilha da contagem.</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <InvTabBtn t={t} id="rapida" atual={aba} onSel={setAba} icon="search">Recontagem rápida</InvTabBtn>
            <InvTabBtn t={t} id="planilha" atual={aba} onSel={setAba} icon="sheet">Em massa (planilha)</InvTabBtn>
          </div>

          {!podeEscrever && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 12px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, background: cAmb.bg, color: cAmb.fg }}>
              <Icon name="alert" size={15} style={{ flexShrink: 0 }} /> Você pode conferir a contagem, mas não registrar: {motivoSemPermissao}
            </div>
          )}

          {aba === 'rapida'
            ? <InvRecontagem t={t} produtos={produtos} podeEscrever={podeEscrever} motivoSemPermissao={motivoSemPermissao} onRegistrado={registrar} />
            : <InvPlanilha t={t} produtos={produtos} podeEscrever={podeEscrever} motivoSemPermissao={motivoSemPermissao} onLote={registrarLote} />}

          {sessao.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.08em', color: t.faint, textTransform: 'uppercase' }}>Recontados nesta sessão</span>
                <Badge t={t} kind="accent" dot>{sessao.length}</Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessao.map((r) => (
                  <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 12, border: `1px solid ${t.border}`, background: t.elevated }}>
                    <InvMiniatura t={t} img={r.img} p={r} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nome}</div>
                      <div style={{ fontSize: 11, color: t.muted, fontFamily: 'ui-monospace, monospace' }}>{r.sku}{r.active === false ? ' · fora do catálogo' : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 12.5, color: t.muted }}>{r.antes} → <b style={{ color: t.text }}>{r.depois}</b> <span style={{ fontSize: 10.5, color: t.faint }}>{r.un}</span></div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: r.delta === 0 ? t.faint : r.delta > 0 ? uiTone(t, 'green').fg : uiTone(t, 'red').fg }}>
                        {r.status === 'replay' ? 'JÁ REGISTRADO' : r.delta === 0 ? 'CONFIRMADO' : r.delta > 0 ? `SOBRA +${r.delta}` : `FALTA ${r.delta}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          <span style={{ marginRight: 'auto', fontSize: 11.5, color: t.faint }}>
            {sessao.length > 0 ? `${sessao.length} item(ns) recontado(s) nesta sessão.` : 'A contagem corrige o saldo físico do almoxarifado.'}
          </span>
          <Btn t={t} kind="ghost" onClick={onClose}>Fechar</Btn>
        </div>
      </div>
    </div>
  );
}

// ⚰️ frPageList/Paginacao morreram na fidelidade 21 — a barra numerada da ref21 vive inline na
// PageCatalogo (pagbar). O Meus Pedidos tem a própria cópia (PedPaginacao, pedidos.jsx), intocada.

// PÁGINA UNIFICADA (rodada 16): a antiga 'Movimentação' + a galeria 'Produtos' numa aba só.
// Tudo sobre useFRProducts (GET /products real, reload em stock_updated). O que cada peça faz:
//   • header: título + subtítulo + Relatório (herdado da galeria) + Fazer Inventário;
//   • HeroPatrimonio: números do dado carregado (unit_price real × estoque físico);
//   • esquerda: NovoProdutoForm (POST real) — no celular vira FAB + folha;
//   • direita: busca nome/SKU/tag + filtro por etiqueta + grid paginada de ProdutoCard
//     (com foto image_url e badge de crítico, herdados da galeria);
//   • modais: edição (PUT real), inventário (preview; processar aguarda endpoint), relatório (CSV).
// ─────────────────────────────────────────────────────────────────────────────────────────────
// ReservaDoProduto — conteúdo do painel lateral da CONSULTA DE RESERVA (D-B4).
//
// GET /stock/reservations/product/:productId — o MESMO helper de servidor que alimenta a recusa
// da saída manual. Se o que aparece aqui divergir do que a recusa mostra, há query duplicada no
// backend (é o que a PB9 mede).
//
// ⚠ D-B5 — SEM AÇÃO, DE PROPÓSITO. Não há botão de liberar reserva nem de reservar mais. A
// reserva é a promessa de um DOCUMENTO; soltá-la por fora deixaria o documento sem lastro, que é
// a doença que este lote mata. O que existe é o LINK: a ação (cancelar/reduzir a solicitação,
// cancelar a separação, reconciliar a viagem) acontece no documento, onde ela significa algo.
function ReservaDoProduto({ t, produto, onFechar, onIr }) {
  const [dados, setDados] = useStateM(null);
  const [carregando, setCarregando] = useStateM(true);
  const [erro, setErro] = useStateM(null);

  React.useEffect(() => {
    let vivo = true;
    setCarregando(true); setErro(null);
    window.FRApi.get('/stock/reservations/product/' + produto.product_id, { skipLoading: true })
      .then((r) => { if (vivo) { setDados(r.data); setCarregando(false); } })
      .catch((e) => {
        if (!vivo) return;
        const gm = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
        setErro(gm ? gm(e) : 'Não foi possível consultar as reservas.');
        setCarregando(false);
      });
    return () => { vivo = false; };
  }, [produto.product_id]);

  return (
    <>
      <div style={{ flexShrink: 0, padding: '20px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'flex-start', gap: 13 }}>
        <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accentSoft, color: t.accentText, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="lock" size={19} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 850, color: t.text, letterSpacing: '-.01em' }}>Reservas do produto</div>
          <div style={{ fontSize: 12.5, color: t.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{produto.nome} · SKU {produto.sku}</div>
        </div>
        <button onClick={onFechar} title="Fechar" style={{ all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', color: t.muted, flexShrink: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="x" size={16} /></button>
      </div>
      <div className="fr-scroll" style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', padding: '18px 22px 24px' }}>
        {carregando ? (
          <div style={{ fontSize: 13, color: t.muted }}>Consultando reservas…</div>
        ) : erro ? (
          <div style={{ padding: '14px 16px', borderRadius: 12, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, fontSize: 13, fontWeight: 700 }}>{erro}</div>
        ) : (
          <>
            <window.FRReservaOrigens t={t} dados={dados} onIr={onIr} />
            <div style={{ marginTop: 18, fontSize: 11.5, color: t.faint, lineHeight: 1.6 }}>
              A reserva pertence ao documento que a levantou. Para soltá-la, abra o documento e
              cancele ou reduza por lá — não há como liberar por aqui.
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════════════
// IMPRIMIR ETIQUETA DIRETO DO CATÁLOGO (lote CAT-ET)
// ══════════════════════════════════════════════════════════════════════════════════════
// Até aqui a impressão só existia ATRELADA A UM MOVIMENTO: Conferência de Envio, Entrada
// por NF-e e Entrada por Reaproveitamento. O Catálogo imprime SEM movimento nenhum — não
// chama backend, não toca saldo, não gera evento. O ZPL sai do dado que a grade já tem.
//
// ⚠ ZERO LÓGICA DE ETIQUETA AQUI, E ISSO É O PONTO DO LOTE.
//   A régua (f) do CO1 diz: onde há comentário afirmando "a MESMA lógica de X", procure a
//   cópia. Aqui o movimento é o inverso — o que este arquivo NÃO tem:
//     · não monta ZPL            → window.cfPrintIdentificacao (conferencia.jsx)
//     · não mede texto nem quebra → window.FRZplTexto (a tabela MEDIDA do ET1)
//     · não escolhe tamanho       → window.EtiquetaTamanhoToggle + o toggle global lido
//                                   pelo próprio cfPrintIdentificacao
//     · não decide barcode        → o D2 (pequena sem código) vive em etColunaIdent
//     · não fala com a impressora → frSendZplBrowserPrint, por dentro do cfPrint
//   Se um dia divergir do ZPL da Conferência para o mesmo produto e tamanho, é porque
//   alguém criou a cópia. A prova de fonte única do CAT-ET existe para acusar isso.
//
// ⚠ SEM SELEÇÃO MÚLTIPLA, por decisão do lote. Um produto por vez cobre o pedido; N
//   produtos × M etiquetas cria a superfície exata do incidente das 160 do Lote V, e a
//   pergunta "M é por produto ou global?" não tem resposta óbvia. Ver DIVIDAS § CAT-ET.
function EtiquetaDoProduto({ t, produto, onFechar }) {
  // CONTAGEM DE REPETIÇÃO, não quantidade de material (Lote V): nasce '1', o operador
  // altera se quiser, e NÃO há de onde espelhar — no Catálogo não existe documento nem
  // movimento. `parseContagem` trunca a fração e tem piso 1 (foi assim que "16,0" virou
  // 160 etiquetas na Entrada, e o helper existe exatamente para isso não se repetir).
  const [qtd, setQtd] = useStateM('1');
  const [enviando, setEnviando] = useStateM(false);
  const [aviso, setAviso] = useStateM(null);    // falha de impressão — PERSISTENTE, sem timer
  const [okMsg, setOkMsg] = useStateM(null);
  const contagem = (v) => (window.FRAdapters && window.FRAdapters.parseContagem
    ? window.FRAdapters.parseContagem(v, 1)
    : Math.max(1, Math.trunc(parseInt(v, 10) || 1)));
  const n = contagem(qtd);
  const semSku = !String(produto.sku || '').trim();
  const cAmb = uiTone(t, 'amber');

  // ⚠ O AVISO DE FALHA NÃO TEM TIMER, e é a mesma decisão da Entrada por NF-e: um toast que
  //   some sozinho é exatamente o que deixa a peça ir para a prateleira sem identificação e
  //   ninguém ver. Ele só sai quando o operador tenta de novo ou fecha a folha.
  const onFlash = (kind, msg) => { if (kind === 'error') setAviso(msg); else setOkMsg(msg); };

  const imprimir = async () => {
    if (enviando || semSku) return;
    setEnviando(true); setAviso(null); setOkMsg(null);
    try {
      await window.cfPrintIdentificacao(
        [{ sku: produto.sku, nome: produto.nome, faltam: n }],
        onFlash,
        null,                                       // NÃO HÁ NF. O modo abaixo é quem manda.
        new Date().toLocaleDateString('pt-BR'),
        { semDocumento: true },                     // linha de info = só a data
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div data-fr="etiqueta-folha" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="printer" size={19} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 850, color: t.text }}>Imprimir etiqueta</div>
          <div style={{ fontSize: 12.5, color: t.muted, marginTop: 2 }}>Não movimenta estoque — só manda a etiqueta para a impressora.</div>
        </div>
        <button onClick={onFechar} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
      </div>

      <div style={{ padding: '13px 15px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 750, color: t.text, lineHeight: 1.35 }}>{produto.nome}</div>
        <div style={{ fontSize: 12, color: t.faint, fontFamily: 'ui-monospace, monospace', marginTop: 3 }}>{produto.sku || '— sem SKU —'}</div>
      </div>

      {semSku && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, background: cAmb.bg, color: cAmb.fg }}>
          <Icon name="alert" size={15} style={{ flexShrink: 0 }} /> Produto sem SKU — a etiqueta não tem identificador para imprimir.
        </div>
      )}

      {/* O TOGGLE GLOBAL do ET1. Mudar aqui muda na Conferência e nas duas Entradas. */}
      <EtiquetaTamanhoToggle t={t} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>Quantas etiquetas</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Serão impressas <b style={{ color: t.text }}>{n}</b> {n === 1 ? 'etiqueta' : 'etiquetas'}.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setQtd(String(Math.max(1, n - 1)))} style={{ all: 'unset', cursor: 'pointer', width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', fontSize: 20, color: t.text, border: `1px solid ${t.border}` }}>–</button>
          <input value={qtd} onChange={(e) => setQtd(e.target.value)} inputMode="numeric" aria-label="Quantas etiquetas"
            style={{ width: 74, height: 44, textAlign: 'center', borderRadius: 11, border: `1px solid ${t.border}`, background: t.panel, color: t.text, fontSize: 19, fontWeight: 850, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={() => setQtd(String(n + 1))} style={{ all: 'unset', cursor: 'pointer', width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', fontSize: 20, color: t.accentText, border: `1px solid ${t.border}` }}>+</button>
        </div>
      </div>

      {aviso && (
        <div data-fr="etiqueta-aviso-falha" style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 15px', borderRadius: 12, background: cAmb.bg, border: `1px solid ${cAmb.fg}` }}>
          <span style={{ color: cAmb.fg, display: 'flex', paddingTop: 1 }}><Icon name="alert" size={17} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 850, color: cAmb.fg }}>A etiqueta NÃO saiu</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text, marginTop: 4 }}>{aviso}</div>
          </div>
        </div>
      )}
      {okMsg && (
        <div data-fr="etiqueta-ok" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderRadius: 12, fontSize: 12.5, fontWeight: 700, background: uiTone(t, 'green').bg, color: uiTone(t, 'green').fg }}>
          <Icon name="check" size={15} /> {okMsg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button data-fr="etiqueta-imprimir" onClick={imprimir} disabled={enviando || semSku} type="button"
          style={{ all: 'unset', boxSizing: 'border-box', cursor: (enviando || semSku) ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, height: 46, padding: '0 22px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: t.accent, color: t.onAccent, opacity: (enviando || semSku) ? 0.45 : 1 }}>
          <Icon name="printer" size={17} /> {enviando ? 'Enviando…' : aviso ? 'Reimprimir' : `Imprimir ${n} ${n === 1 ? 'etiqueta' : 'etiquetas'}`}
        </button>
      </div>
    </div>
  );
}

function PageCatalogo({ t, brand, setActive }) {
  const [inv, setInv] = useStateM(false);
  // CONSULTA DE RESERVA (D-B4): produto aberto no painel lateral. `null` = fechado.
  const [reservaDe, setReservaDe] = useStateM(null);
  const focoReserva = useRefM(null);
  // CAT-ET: produto aberto na folha de impressão de etiqueta. `null` = fechada.
  const [etiquetaDe, setEtiquetaDe] = useStateM(null);
  const focoEtiqueta = useRefM(null);
  const [rel, setRel] = useStateM(false);
  const [edit, setEdit] = useStateM(null);
  const [page, setPage] = useStateM(1);
  const [q, setQ] = useStateM('');
  const [tagFiltro, setTagFiltro] = useStateM(null);   // etiqueta ativa (null = todas)
  const [novoOpen, setNovoOpen] = useStateM(false);    // folha de novo produto (celular)
  const topRef = useRefM(null);
  const { mobile } = (window.useFRViewport ? window.useFRViewport() : { mobile: false });
  const { items, loading, error, reload } = window.useFRProducts();
  const tagsReais = useMemoM(() => frTagsDe(items), [items]);
  // Ordem obrigatória: busca + filtro sobre a lista COMPLETA; só então pagina a fatia visível.
  const ql = q.trim().toLowerCase();
  const view = items.filter((p) => {
    if (tagFiltro && !(p.tags || []).some((tg) => String(tg).toUpperCase() === tagFiltro)) return false;
    return !ql
      || (p.nome || '').toLowerCase().includes(ql)
      || (p.sku || '').toLowerCase().includes(ql)
      || (p.tags || []).some((tg) => String(tg).toLowerCase().includes(ql));
  });
  // Paginação da ref21: 24/página no desktop, 10 no celular (useFRViewport existe no repo).
  const ps = mobile ? 10 : 24;
  const total = view.length;
  const totalPages = Math.max(1, Math.ceil(total / ps));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * ps + 1;
  const end = Math.min(safePage * ps, total);
  const pageItems = view.slice((safePage - 1) * ps, safePage * ps);
  const goToPage = (n) => { setPage(Math.max(1, Math.min(totalPages, n))); if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  // Barra numerada da ref21 (janela 1 … pg−1 pg pg+1 … N + "X–Y de Z"), adaptada ao page 1-based nosso.
  const pagbar = !loading && !error && totalPages > 1 && (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22, flexWrap: 'wrap' }}>
      <button aria-label="Página anterior" onClick={() => goToPage(safePage - 1)} disabled={safePage === 1} style={{ all: 'unset', cursor: safePage === 1 ? 'not-allowed' : 'pointer', width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: t.panel, border: `1px solid ${t.border}`, color: t.muted, opacity: safePage === 1 ? 0.4 : 1 }}><Icon name="chevronLeft" size={16} /></button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).filter((i) => i === 1 || i === totalPages || Math.abs(i - safePage) <= 1).reduce((acc, i, k, arr) => { if (k > 0 && i - arr[k - 1] > 1) acc.push('…'); acc.push(i); return acc; }, []).map((i, k) => (
        i === '…'
          ? <span key={'e' + k} style={{ color: t.faint, fontWeight: 800, padding: '0 2px' }}>…</span>
          : <button key={i} aria-current={i === safePage ? 'page' : undefined} onClick={() => goToPage(i)} style={{ all: 'unset', cursor: 'pointer', minWidth: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, background: i === safePage ? t.accent : t.panel, color: i === safePage ? t.onAccent : t.text, border: `1px solid ${i === safePage ? t.accent : t.border}` }}>{i}</button>
      ))}
      <button aria-label="Próxima página" onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages} style={{ all: 'unset', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: t.panel, border: `1px solid ${t.border}`, color: t.muted, opacity: safePage === totalPages ? 0.4 : 1 }}><Icon name="chevronRight" size={16} /></button>
      <span style={{ fontSize: 12, color: t.faint, marginLeft: 8 }}>{start}–{end} de {total}</span>
    </div>
  );
  // Busca/filtro mudou → página 1 (senão ficaria numa página inexistente no resultado filtrado).
  const onBusca = (e) => { setQ(e.target.value); setPage(1); };
  const onTag = (tg) => { setTagFiltro((cur) => (cur === tg ? null : tg)); setPage(1); };
  // Arquivar REAL: DELETE /products/:id (active=false no backend) e a lista volta do servidor.
  const arquivar = async (p) => {
    await window.FRApi.delete(`/products/${p.product_id}`);
    reload();
  };
  return (
    <div ref={topRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 850, letterSpacing: '-.02em', color: t.text }}>Catálogo</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: t.muted }}>Cadastre produtos, ajuste valores e faça o inventário do estoque.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn t={t} icon="barChart" kind="ghost" onClick={() => setRel(true)}>Relatório</Btn>
          <Btn t={t} icon="clipboard" kind="ghost" onClick={() => setInv(true)}>Fazer Inventário</Btn>
          {/* ref21: o form saiu da coluna fixa — este botão abre o painel lateral (no celular o FAB abre a folha). */}
          {!mobile && <Btn t={t} icon="plus" onClick={() => setNovoOpen(true)}>Novo Produto</Btn>}
        </div>
      </div>
      <HeroPatrimonio t={t} brand={brand} produtos={items} />
      {/* ref21: o form saiu da coluna fixa — a grade ocupa a LARGURA TODA e o cadastro vive no
          painel lateral (desktop) / folha (celular), ambos pelo mesmo novoOpen. */}
      <div style={{ marginTop: 22 }}>
        <div className={mobile ? 'fr-noscroll' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: mobile ? 'nowrap' : 'wrap', overflowX: mobile ? 'auto' : 'visible', paddingBottom: mobile ? 4 : 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 11, flex: '1 1 260px', maxWidth: 420, minWidth: 200, height: 46, padding: '0 16px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text', flexShrink: 0 }}>
            <Icon name="search" size={17} />
            <input value={q} onChange={onBusca} placeholder="Busque por nome, SKU ou tag…" style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
            {q && <button onClick={() => onBusca({ target: { value: '' } })} style={{ all: 'unset', cursor: 'pointer', color: t.muted, display: 'grid', placeItems: 'center' }}><Icon name="x" size={14} /></button>}
          </label>
          {/* chips de etiqueta REAIS (frTagsDe) no estilo pill da ref21 */}
          {tagsReais.map(({ tag }) => {
            const on = tagFiltro === tag;
            return <button key={tag} onClick={() => onTag(tag)} style={{ all: 'unset', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', fontSize: 11, fontWeight: 800, padding: '8px 14px', borderRadius: 999, background: on ? t.accent : t.panel, color: on ? t.onAccent : t.text, border: `1px solid ${on ? t.accent : t.border}` }}>{tag}</button>;
          })}
          <span style={{ marginLeft: 'auto', fontSize: 12.5, color: t.muted, flexShrink: 0 }}>{total} {total === 1 ? 'item' : 'itens'}</span>
        </div>
        {error ? (
          <ProdutoErro t={t} message={error} onRetry={reload} />
        ) : (
          <>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: mobile ? 14 : 18 }}>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ProdutoCardSkeleton key={`sk${i}`} t={t} />)
              : total === 0
              ? <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title={ql || tagFiltro ? 'Nenhum resultado' : 'Nenhum produto'} sub={ql || tagFiltro ? 'Ajuste a busca ou o filtro de etiqueta.' : 'Nenhum produto ativo no catálogo.'} /></Card></div>
              : pageItems.map((p) => <ProdutoCard key={p.product_id || p.sku} t={t} p={p} mobile={mobile} onEdit={(np) => setEdit(np)} onArchive={arquivar} onVerReservas={(np) => setReservaDe(np)} onImprimirEtiqueta={(np) => setEtiquetaDe(np)} />)}
          </div>
          {pagbar}
          </>
        )}
      </div>
      {/* CONSULTA DE RESERVA (D-B4) — painel LATERAL, reusando a casca FRDrawer que o C4 extraiu.
          ESCOLHA DECLARADA: a apresentação é lateral (é consulta de contexto, o operador quer
          voltar à grade), então a casca serve tal como está e NÃO se escreve overlay novo — seria
          a quarta cópia do mesmo ESC + foco + trava de scroll. Só o CONTEÚDO é novo. */}
      {reservaDe && window.FRDrawer && (
        <window.FRDrawer t={t} aoFechar={() => setReservaDe(null)} origemFoco={focoReserva} largura="min(560px,94vw)">
          <ReservaDoProduto t={t} produto={reservaDe} onFechar={() => setReservaDe(null)}
            onIr={(pagina) => { setReservaDe(null); if (setActive) setActive(pagina); }} />
        </window.FRDrawer>
      )}

      {/* IMPRIMIR ETIQUETA (CAT-ET) — MESMA casca FRDrawer, pela MESMA razão que está escrita
          logo acima: escrever overlay novo aqui seria a QUINTA cópia do mesmo ESC + foco +
          trava de scroll. Só o conteúdo é novo. */}
      {etiquetaDe && window.FRDrawer && (
        <window.FRDrawer t={t} aoFechar={() => setEtiquetaDe(null)} origemFoco={focoEtiqueta} largura="min(520px,94vw)">
          <EtiquetaDoProduto t={t} produto={etiquetaDe} onFechar={() => setEtiquetaDe(null)} />
        </window.FRDrawer>
      )}

      {/* painel lateral do cadastro (desktop) — o form REAL de sempre (POST /products, máscara de
          SKU, duplicata, feedback) como conteúdo; `flat` tira a moldura de Card, o painel é a moldura. */}
      {novoOpen && !mobile && (
        <div onClick={() => setNovoOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 66, background: 'rgba(8,10,16,.55)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(440px, 100vw)', height: '100%', display: 'flex', flexDirection: 'column', background: t.panel, borderLeft: `1px solid ${t.borderStrong}`, boxShadow: '-18px 0 44px rgba(0,0,0,.25)', boxSizing: 'border-box' }}>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '12px 14px 0' }}>
              <button onClick={() => setNovoOpen(false)} style={{ all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', color: t.muted, background: t.elevated, border: `1px solid ${t.border}` }}><Icon name="x" size={16} /></button>
            </div>
            <div className="fr-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <NovoProdutoForm t={t} brand={brand} produtos={items} flat
                onCreated={() => { reload(); setNovoOpen(false); }} />
            </div>
          </div>
        </div>
      )}
      {/* FAB + folha de criação (redesign) — VIVOS: o form bate no POST /products real, com
          as validações atuais (SKU C.SS.NNNN, duplicata, guard anti-duplo-clique). Ao criar,
          `reload` recarrega a lista e a folha fecha, então o produto novo aparece atrás dela. */}
      {mobile && (
        <button onClick={() => setNovoOpen(true)} title="Novo produto"
          style={{ all: 'unset', cursor: 'pointer', position: 'fixed', right: 18, bottom: 20, zIndex: 40, width: 58, height: 58, borderRadius: '50%', display: 'grid', placeItems: 'center', background: t.accent, color: t.onAccent, boxShadow: `0 10px 26px ${frHexToRgba(t.accent, 0.5)}` }}>
          <Icon name="plus" size={24} />
        </button>
      )}
      {mobile && novoOpen && (
        <div onClick={() => setNovoOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 66, background: 'rgba(8,10,16,.55)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', animation: 'frFadeIn .2s ease-out' }}>
          <div onClick={(e) => e.stopPropagation()} className="fr-scroll" style={{ width: '100%', maxHeight: '92vh', overflowY: 'auto', background: t.panel, borderRadius: '24px 24px 0 0', boxSizing: 'border-box', animation: 'frSheetUp .34s cubic-bezier(.22,1,.36,1)' }}>
            <style>{`@keyframes frSheetUp{from{transform:translateY(100%)}to{transform:none}}@keyframes frFadeIn{from{opacity:0}to{opacity:1}}`}</style>
            <div style={{ position: 'sticky', top: 0, zIndex: 2, background: t.panel, padding: '12px 0 8px', display: 'grid', placeItems: 'center' }}>
              <span style={{ width: 40, height: 4, borderRadius: 3, background: t.border }} />
            </div>
            <NovoProdutoForm t={t} brand={brand} produtos={items} flat
              onCreated={() => { reload(); setNovoOpen(false); }} />
          </div>
        </div>
      )}
      {inv && <InventarioModal t={t} onClose={() => setInv(false)} produtos={items} />}
      {rel && <RelatorioModal t={t} onClose={() => setRel(false)} produtos={items} />}
      {edit && <EditProdutoModal t={t} prod={edit} produtos={items} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
    </div>
  );
}

function fmtMoeda(n) { return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function RelatorioModal({ t, onClose, produtos }) {
  const [ordem, setOrdem] = useStateM('valor');
  const [filtro, setFiltro] = useStateM('todos');
  const [tag, setTag] = useStateM('todas');
  const [busca, setBusca] = useStateM('');
  const bq = busca.trim().toLowerCase();
  const linhas = (produtos || []).map((p) => {
    const unit = p.precoNum != null ? p.precoNum : parsePreco(p.preco);
    return { ...p, unit, valorTotal: unit * p.estoque, status: p.status || (p.disp <= 0 ? 'esgotado' : p.disp <= (p.min_stock || 0) ? 'baixo' : 'ok') };
  });
  const tagsDisp = [...new Set(linhas.map((l) => l.tag).filter(Boolean))];
  const fil = linhas.filter((l) => (filtro === 'todos' || l.status === filtro) && (tag === 'todas' || l.tag === tag) && (!bq || l.nome.toLowerCase().includes(bq) || l.sku.includes(bq)));
  const ord = [...fil].sort((a, b) => ordem === 'valor' ? b.valorTotal - a.valorTotal : ordem === 'nome' ? a.nome.localeCompare(b.nome) : a.disp - b.disp);
  const totalSkus = linhas.length;
  const valorEstoque = linhas.reduce((a, l) => a + l.valorTotal, 0);
  const unidades = linhas.reduce((a, l) => a + l.estoque, 0);
  const baixos = linhas.filter((l) => l.status !== 'ok').length;
  const exportar = () => {
    const head = 'SKU,Nome,Categoria,Disponivel,Fisica,Unidade,Valor Unitario,Valor Total,Status';
    const rows = ord.map((l) => [l.sku, '"' + l.nome + '"', l.tag, l.disp, l.estoque, l.un, l.unit.toFixed(2), l.valorTotal.toFixed(2), l.status].join(','));
    // '\n' de verdade — o export herdado do protótipo juntava com a STRING "\n" (barra + n),
    // e o arquivo saía numa linha só. Nenhum leitor de CSV abria as linhas.
    const csv = [head, ...rows].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'relatorio-estoque.csv'; a.click();
  };
  const statusBadge = (s) => s === 'esgotado' ? <Badge t={t} kind="red" dot>Esgotado</Badge> : s === 'baixo' ? <Badge t={t} kind="amber" dot>Baixo</Badge> : <Badge t={t} kind="green" dot>OK</Badge>;
  const selStyle = { boxSizing: 'border-box', height: 38, borderRadius: 10, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 30px 0 12px', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', appearance: 'none', WebkitAppearance: 'none', outline: 'none', cursor: 'pointer' };
  const { mobile } = (window.useFRViewport ? window.useFRViewport() : { mobile: false });

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: mobile ? 'stretch' : 'center', padding: mobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: mobile ? '100%' : 'min(960px,96vw)', height: mobile ? '100%' : 'auto', maxHeight: mobile ? '100%' : '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: mobile ? 'none' : `1px solid ${t.borderStrong}`, borderRadius: mobile ? 0 : 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: mobile ? '16px 18px' : '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: mobile ? 10 : 13, flexWrap: mobile ? 'wrap' : 'nowrap' }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="barChart" size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: mobile ? 16 : 18, fontWeight: 850, color: t.text }}>Relatório de Estoque</div><div style={{ fontSize: 12.5, color: t.muted, display: mobile ? 'none' : 'block' }}>Visão geral do inventário e valor imobilizado.</div></div>
          <button onClick={exportar} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: t.accentSoft, color: t.accentText }}><Icon name="download" size={15} /> {mobile ? 'CSV' : 'Exportar CSV'}</button>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}`, flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>
        <div className="fr-scroll" style={{ overflowY: 'auto', padding: mobile ? 16 : 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
            {[['box', 'SKUs cadastrados', totalSkus, 'accent'], ['barChart', 'Valor em estoque', fmtMoeda(valorEstoque), 'green'], ['clipboard', 'Unidades físicas', unidades.toLocaleString('pt-BR'), 'blue'], ['alert', 'Itens críticos', baixos, 'red']].map(([ic, lab, val, kind]) => (
              <div key={lab} style={{ padding: 16, borderRadius: 14, background: t.elevated, border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', background: uiTone(t, kind).bg, color: uiTone(t, kind).fg }}><Icon name={ic} size={15} /></span><span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: t.muted, textTransform: 'uppercase' }}>{lab}</span></div>
                <div style={{ fontSize: 22, fontWeight: 850, color: t.text, marginTop: 9 }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px', minWidth: 160, height: 38, padding: '0 12px', borderRadius: 10, background: t.elevated, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
              <Icon name="search" size={16} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou SKU…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 13, fontFamily: 'inherit' }} />
            </label>
            <div style={{ position: 'relative' }}><select value={tag} onChange={(e) => setTag(e.target.value)} style={selStyle}><option value="todas">Todas as tags</option>{tagsDisp.map((tg) => <option key={tg} value={tg}>{tg}</option>)}</select><Icon name="chevronDown" size={14} style={{ position: 'absolute', right: 10, top: 12, color: t.muted, pointerEvents: 'none' }} /></div>
            <div style={{ position: 'relative' }}><select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={selStyle}><option value="todos">Todos os itens</option><option value="ok">Em dia</option><option value="baixo">Estoque baixo</option><option value="esgotado">Esgotados</option></select><Icon name="chevronDown" size={14} style={{ position: 'absolute', right: 10, top: 12, color: t.muted, pointerEvents: 'none' }} /></div>
            <div style={{ position: 'relative' }}><select value={ordem} onChange={(e) => setOrdem(e.target.value)} style={selStyle}><option value="valor">Ordenar: Maior valor</option><option value="nome">Ordenar: Nome</option><option value="disp">Ordenar: Menor disponível</option></select><Icon name="chevronDown" size={14} style={{ position: 'absolute', right: 10, top: 12, color: t.muted, pointerEvents: 'none' }} /></div>
            <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 12.5, color: t.muted }}>{ord.length} itens</span>
          </div>
          <div style={{ borderRadius: 14, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }} className="fr-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680, fontSize: 13 }}>
                <thead><tr>
                  {['Produto', 'Disp.', 'Física', 'Unitário', 'Valor total', 'Status'].map((h, k) => <th key={h} style={{ textAlign: k === 0 ? 'left' : k >= 1 && k <= 4 ? 'right' : 'center', padding: '12px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: t.faint, borderBottom: `1px solid ${t.border}`, background: t.elevated, whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {ord.map((l, i) => (
                    <tr key={l.sku}>
                      <td style={{ padding: '11px 16px', borderBottom: i === ord.length - 1 ? 'none' : `1px solid ${t.border}` }}><div style={{ fontWeight: 700, color: t.text }}>{l.nome}</div><div style={{ fontSize: 11, color: t.muted }}>{l.sku} · {l.tag}</div></td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: l.disp === 0 ? uiTone(t, 'red').fg : t.text, borderBottom: i === ord.length - 1 ? 'none' : `1px solid ${t.border}` }}>{l.disp}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', color: t.text, borderBottom: i === ord.length - 1 ? 'none' : `1px solid ${t.border}` }}>{l.estoque}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', color: t.muted, borderBottom: i === ord.length - 1 ? 'none' : `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{l.preco}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 800, color: t.text, borderBottom: i === ord.length - 1 ? 'none' : `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{fmtMoeda(l.valorTotal)}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'center', borderBottom: i === ord.length - 1 ? 'none' : `1px solid ${t.border}` }}>{statusBadge(l.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ⚰️ LÁPIDE — PageProdutos (a galeria 'Produtos', antiga sub-aba 'cat-produtos') morreu na
// rodada 16, unificada na PageCatalogo. O que ela tinha de VIVO migrou: foto image_url e chip
// Esgotado/disp (ProdutoFoto), busca nome/SKU/tag, paginação, RelatorioModal (agora no header
// do Catálogo), skeleton/vazio/erro. O id 'cat-produtos' segue como alias no renderPage.

function PageDashboard({ t, brand }) {
  const meses = [
    { label: 'Jan', v: 42 }, { label: 'Fev', v: 58 }, { label: 'Mar', v: 50 },
    { label: 'Abr', v: 74, accent: true }, { label: 'Mai', v: 66 }, { label: 'Jun', v: 88, accent: true },
  ];
  const atividade = [
    ['Entrada NF-e 4471', 'Aço Inox · +120 un', 'green', '2 min'],
    ['Saída · Setor Usinagem', 'Parafuso M8 · -40 un', 'amber', '18 min'],
    ['Novo produto', 'Filamento PLA Azul', 'accent', '1 h'],
    ['Reposição sugerida', 'Rolamento 6204ZZ', 'red', '3 h'],
  ];
  return (
    <div>
      <PageHeader t={t} title="Visão Geral" subtitle="Resumo do estoque e da operação em tempo real."
        actions={<Btn t={t} icon="download" kind="ghost">Exportar</Btn>} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI t={t} icon="box" label="Itens em estoque" value="1.284" sub="+32 esta semana" kind="accent" />
        <KPI t={t} icon="barChart" label="Patrimônio" value="R$ 184k" sub="+4,2% no mês" kind="green" />
        <KPI t={t} icon="alert" label="Abaixo do mínimo" value="17" sub="precisa atenção" kind="red" />
        <KPI t={t} icon="shuffle" label="Movimentações" value="342" sub="últimos 30 dias" kind="amber" />
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <Card t={t} style={{ padding: 22, flex: 2, minWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Movimentações por mês</div>
            <Badge t={t} kind="green" dot>+18% vs. semestre anterior</Badge>
          </div>
          <BarChart t={t} data={meses} />
        </Card>
        <Card t={t} style={{ padding: 22, flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 16 }}>Atividade recente</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {atividade.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 10 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: uiTone(t, a[2]).fg, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{a[0]}</div>
                  <div style={{ fontSize: 11.5, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a[1]}</div>
                </div>
                <span style={{ fontSize: 11, color: t.faint, flexShrink: 0 }}>{a[3]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { PageCatalogo, PageDashboard });
