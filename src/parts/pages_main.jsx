// pages_main.jsx — Catálogo (Produtos) and Visão Geral (Dashboard).
const { useState: useStateM, useRef: useRefM } = React;

// Paginação client-side da galeria de Produtos e da Movimentação.
// A lista completa fica em memória (busca/filtro operam sobre o TODO); só a página atual é renderizada,
// evitando travar a tela ao pintar ~2000 cards de uma vez. 48 = múltiplo de 2/3/4/6/8 colunas (fecha a grid auto-fill).
// Trocar aqui muda quantos itens aparecem por página em ambas as telas.
const PAGE_SIZE = 48;

const PRODUTOS = [
  { sku: '9.99.0238', nome: 'Parafuso Sextavado M8', tag: 'HOMOLOG',   kind: 'amber', disp: 320, estoque: 400, un: 'un', preco: 'R$ 0,85', img: 'assets/parafuso-sextavado.png', imgFit: 'contain' },
  { sku: '1.02.0044', nome: 'Chapa Aço 1020 2mm',    tag: 'USINAGEM',  kind: 'blue',  disp: 12, estoque: 18, un: 'ch', preco: 'R$ 145,00', img: 'assets/chapa-aco.png', imgFit: 'contain' },
  { sku: '3.00.0101', nome: 'Filamento PLA Azul 1kg', tag: '3D',        kind: 'accent', disp: 8, estoque: 10, un: 'un', preco: 'R$ 89,90' },
  { sku: '4.10.0233', nome: 'Rolamento 6204ZZ',      tag: 'MECÂNICA',  kind: 'gray',  disp: 54, estoque: 60, un: 'un', preco: 'R$ 12,40' },
  { sku: '5.20.0099', nome: 'Cabo Flexível 2,5mm',   tag: 'ELÉTRICA',  kind: 'amber', disp: 240, estoque: 300, un: 'm',  preco: 'R$ 3,20' },
  { sku: '6.30.0012', nome: 'Tinta Epóxi Cinza 3,6L', tag: 'ACABAMENTO', kind: 'green', disp: 5, estoque: 12, un: 'lt', preco: 'R$ 210,00' },
  { sku: '2.11.0080', nome: 'Porca Sextavada M8',    tag: 'HOMOLOG',   kind: 'amber', disp: 410, estoque: 500, un: 'un', preco: 'R$ 0,40', img: 'assets/porca-m8.png', imgFit: 'contain' },
  { sku: '7.40.0150', nome: 'Arruela Lisa 8mm',      tag: 'HOMOLOG',   kind: 'amber', disp: 880, estoque: 1000, un: 'un', preco: 'R$ 0,20', img: 'assets/arruela-8mm.png', imgFit: 'contain' },
  { sku: '5.31.0022', nome: 'Conector RJ45',         tag: 'ELÉTRICA',  kind: 'amber', disp: 0, estoque: 0, un: 'un', preco: 'R$ 2,50' },
  { sku: '3.11.0027', nome: 'Abraçadeira Inox 2"',   tag: 'FERRAMENTAS', kind: 'blue', disp: 36, estoque: 40, un: 'un', preco: 'R$ 9,90' },
  { sku: '3.11.0028', nome: 'Abraçadeira Inox 4"',   tag: 'FERRAMENTAS', kind: 'blue', disp: 22, estoque: 30, un: 'un', preco: 'R$ 14,50' },
  { sku: '3.00.0102', nome: 'Filamento PETG Preto 1kg', tag: '3D',     kind: 'accent', disp: 14, estoque: 20, un: 'un', preco: 'R$ 109,90' },
  { sku: '3.00.0103', nome: 'Filamento ABS Cinza 1kg', tag: '3D',      kind: 'accent', disp: 6, estoque: 15, un: 'un', preco: 'R$ 94,90' },
  { sku: '5.20.0100', nome: 'Cabo Flexível 4,0mm',   tag: 'ELÉTRICA',  kind: 'amber', disp: 180, estoque: 240, un: 'm', preco: 'R$ 5,10' },
  { sku: '5.32.0040', nome: 'Terminal Ilhós 2,5mm',  tag: 'ELÉTRICA',  kind: 'amber', disp: 1200, estoque: 1500, un: 'un', preco: 'R$ 0,12', img: 'assets/terminal-ilhos.png', imgFit: 'contain' },
  { sku: '9.99.0240', nome: 'Parafuso Allen M6',     tag: 'HOMOLOG',   kind: 'amber', disp: 540, estoque: 600, un: 'un', preco: 'R$ 0,65' },
  { sku: '1.02.0045', nome: 'Chapa Inox 304 1,5mm',  tag: 'USINAGEM',  kind: 'blue',  disp: 9, estoque: 14, un: 'ch', preco: 'R$ 320,00' },
  { sku: '1.02.0046', nome: 'Barra Redonda 1020 1"', tag: 'USINAGEM',  kind: 'blue',  disp: 18, estoque: 25, un: 'br', preco: 'R$ 78,00' },
  { sku: '4.10.0234', nome: 'Rolamento 6205ZZ',      tag: 'MECÂNICA',  kind: 'gray',  disp: 40, estoque: 50, un: 'un', preco: 'R$ 16,80' },
  { sku: '4.10.0235', nome: 'Correia A-32',          tag: 'MECÂNICA',  kind: 'gray',  disp: 12, estoque: 16, un: 'un', preco: 'R$ 28,00' },
  { sku: '6.30.0013', nome: 'Verniz PU 900ml',       tag: 'ACABAMENTO', kind: 'green', disp: 7, estoque: 10, un: 'lt', preco: 'R$ 85,00' },
  { sku: '6.30.0014', nome: 'Massa Plástica 1kg',    tag: 'ACABAMENTO', kind: 'green', disp: 20, estoque: 24, un: 'un', preco: 'R$ 32,00' },
  { sku: '2.11.0081', nome: 'EPI Luva Nitrílica',    tag: 'EPI',       kind: 'red',   disp: 60, estoque: 80, un: 'par', preco: 'R$ 4,80' },
  { sku: '2.11.0082', nome: 'EPI Óculos de Proteção', tag: 'EPI',      kind: 'red',   disp: 35, estoque: 50, un: 'un', preco: 'R$ 12,00' },
  { sku: '3.11.0030', nome: 'Abraçadeira Nylon 200mm', tag: 'FERRAMENTAS', kind: 'blue', disp: 900, estoque: 1000, un: 'un', preco: 'R$ 0,40' },
];
const PRODUTO_TAGS = [...new Map(PRODUTOS.map((p) => [p.tag, p.kind])).entries()].map(([tag, kind]) => ({ tag, kind }));
const UNIDADES = ['un', 'm', 'ch', 'lt', 'kg', 'par', 'br', 'cx', 'pç', 'rolo'];
function parsePreco(s) { return parseFloat(String(s).replace(/[^0-9,]/g, '').replace(',', '.')) || 0; }

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
  return (
    <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', minHeight: 460, display: 'flex', alignItems: 'flex-end', background: '#05070d' }}>
      <style>{`@keyframes frHeroZoom{from{transform:scale(1.1)}to{transform:scale(1)}}@keyframes frHeroRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}@keyframes frGlow{0%,100%{opacity:.5}50%{opacity:.85}}@keyframes frSheen{0%{background-position:-160% 0}55%,100%{background-position:260% 0}}`}</style>
      <div style={{ position: 'absolute', inset: 0, animation: 'frHeroZoom 18s ease-out both' }}>
        <img src={window.__asset('assets/mascote.png')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center' }} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(95deg, rgba(3,5,10,.95) 0%, rgba(3,5,10,.64) 40%, transparent 80%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(3,5,10,.98) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 160px rgba(0,0,0,.7)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-30%', right: '8%', width: 520, height: 520, background: 'radial-gradient(circle, rgba(255,255,255,.1) 0%, transparent 62%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: -40, bottom: 30, width: 380, height: 220, borderRadius: '50%', background: frHexToRgba(brand.accent, 0.45), filter: 'blur(110px)', animation: 'frGlow 7s ease-in-out infinite', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', left: 48, top: 36, display: 'flex', alignItems: 'center', gap: 10, animation: 'frHeroRise .7s ease-out both' }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: brand.accent, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 13, boxShadow: `0 4px 14px ${frHexToRgba(brand.accent, 0.5)}` }}>FR</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.04em', color: 'rgba(255,255,255,.85)' }}>Fluxo Royale · Estoque</span>
      </div>

      <div style={{ position: 'relative', width: '100%', padding: '0 48px 46px', animation: 'frHeroRise .8s ease-out both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
          <span style={{ width: 22, height: 3, borderRadius: 3, background: brand.yellow }} />
          <span style={{ fontSize: 11, letterSpacing: '.24em', fontWeight: 800, color: brand.yellow, textTransform: 'uppercase' }}>Patrimônio em Estoque</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,.6)', marginTop: 18 }}>R$</span>
          <span style={{ position: 'relative', fontSize: 100, fontWeight: 850, letterSpacing: '-.05em', lineHeight: .78, fontVariantNumeric: 'tabular-nums', color: '#fff',
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

function NovoProdutoForm({ t, brand }) {
  const field = { width: '100%', boxSizing: 'border-box', height: 42, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' };
  const lab = { fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7, display: 'block' };
  const [unidade, setUnidade] = useStateM('un');
  const [tags, setTags] = useStateM([]);
  const toggleTag = (tg) => setTags((xs) => (xs.includes(tg) ? xs.filter((x) => x !== tg) : [...xs, tg]));
  return (
    <Card t={t} style={{ padding: 22, width: 340, flexShrink: 0, alignSelf: 'flex-start', position: 'sticky', top: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center' }}><Icon name="plus" size={20} /></span>
        <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Novo Produto</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div><label style={lab}>Nome do produto</label><input placeholder="Ex: Parafuso Sextavado M8" style={field} /></div>
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
          <div style={{ width: 96 }}><label style={lab}>Mínimo</label><input placeholder="0" inputMode="numeric" style={field} /></div>
        </div>
        <div>
          <label style={lab}>Categorias e etiquetas</label>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
            {PRODUTO_TAGS.map(({ tag, kind }) => {
              const on = tags.includes(tag);
              const c = uiTone(t, kind);
              return (
                <button key={tag} onClick={() => toggleTag(tag)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, letterSpacing: '.02em', padding: '5px 10px', borderRadius: 8, background: on ? c.fg : c.bg, color: on ? '#fff' : c.fg, border: `1px solid ${on ? c.fg : 'transparent'}` }}>
                  {on && <Icon name="check" size={11} />}{tag}
                </button>
              );
            })}
          </div>
          <input placeholder="Criar nova etiqueta…" style={field} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
          <div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: t.muted }}>CÓDIGO SKU</div><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>9.99.0239</div></div>
          <Badge t={t} kind="accent" dot>AUTO</Badge>
        </div>
        <Btn t={t} icon="plus">Cadastrar Produto</Btn>
      </div>
    </Card>
  );
}

function EditProdutoModal({ t, prod, onClose, onSave }) {
  const [f, setF] = useStateM({ nome: prod.nome, tag: prod.tag, disp: String(prod.disp), estoque: String(prod.estoque), un: prod.un, preco: prod.preco });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const field = { boxSizing: 'border-box', width: '100%', height: 42, borderRadius: 11, border: `1px solid ${t.border}`, background: t.elevated, color: t.text, padding: '0 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const lab = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase', marginBottom: 7 };
  const tagKind = (PRODUTO_TAGS.find((x) => x.tag === f.tag) || {}).kind || 'gray';
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
            <label style={lab}>Categoria</label>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {PRODUTO_TAGS.map(({ tag, kind }) => { const on = f.tag === tag; const c = uiTone(t, kind); return (
                <button key={tag} onClick={() => set('tag', tag)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, padding: '6px 11px', borderRadius: 8, background: on ? c.fg : c.bg, color: on ? '#fff' : c.fg }}>{on && <Icon name="check" size={11} />}{tag}</button>
              ); })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={lab}>Disponível</label><input value={f.disp} onChange={(e) => set('disp', e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" style={field} /></div>
            <div style={{ flex: 1 }}><label style={lab}>Física</label><input value={f.estoque} onChange={(e) => set('estoque', e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" style={field} /></div>
            <div style={{ width: 90 }}>
              <label style={lab}>Unidade</label>
              <div style={{ position: 'relative' }}><select value={f.un} onChange={(e) => set('un', e.target.value)} style={{ ...field, appearance: 'none', WebkitAppearance: 'none', paddingRight: 28, cursor: 'pointer' }}>{UNIDADES.map((u) => <option key={u}>{u}</option>)}</select><Icon name="chevronDown" size={14} style={{ position: 'absolute', right: 10, top: 14, color: t.muted, pointerEvents: 'none' }} /></div>
            </div>
          </div>
          <div><label style={lab}>Valor unitário</label><input value={f.preco} onChange={(e) => set('preco', e.target.value)} style={field} /></div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn t={t} icon="check" onClick={() => onSave({ ...prod, nome: f.nome, tag: f.tag, kind: tagKind, disp: parseInt(f.disp) || 0, estoque: parseInt(f.estoque) || 0, un: f.un, preco: f.preco })}>Salvar</Btn>
        </div>
      </div>
    </div>
  );
}

function ProdutoCard({ t, p, onEdit, onDelete }) {
  const [editing, setEditing] = useStateM(false);
  const [hover, setHover] = useStateM(false);
  const [menu, setMenu] = useStateM(false);
  const [confirm, setConfirm] = useStateM(false);
  return (
    <Card t={t} hover style={{ padding: 22, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <Badge t={t} kind="gray">{p.sku}</Badge>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenu((m) => !m)} title="Opções" style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color: t.muted }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="dots" size={17} /></button>
          {menu && (
            <>
              <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
              <div style={{ position: 'absolute', zIndex: 20, top: 'calc(100% + 4px)', right: 0, width: 168, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 12, boxShadow: t.shadow, padding: 6 }}>
                <button onClick={() => { setMenu(false); onEdit(p); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, fontSize: 13, fontWeight: 600, color: t.text }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="pencil" size={15} /> Editar produto</button>
                <button onClick={() => { setMenu(false); setConfirm(true); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, fontSize: 13, fontWeight: 600, color: uiTone(t, 'red').fg }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = uiTone(t, 'red').bg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="trash" size={15} /> Excluir item</button>
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ fontSize: 19, fontWeight: 850, color: t.text, margin: '14px 0 11px', letterSpacing: '-.01em', lineHeight: 1.25 }}>{p.nome}</div>
      {p.tag && <Badge t={t} kind={p.kind}>{p.tag}</Badge>}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <div style={{ flex: 1, padding: '13px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 9.5, letterSpacing: '.06em', fontWeight: 700, color: t.faint }}>DISPONÍVEL</div>
          <div style={{ fontSize: 24, fontWeight: 850, color: t.accentText, marginTop: 4 }}>{p.disp} <span style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>{p.un}</span></div>
        </div>
        <div style={{ flex: 1, padding: '13px 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 9.5, letterSpacing: '.06em', fontWeight: 700, color: t.faint }}>FÍSICA</div>
          <div style={{ fontSize: 24, fontWeight: 850, color: t.text, marginTop: 4 }}>{p.estoque} <span style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>{p.un}</span></div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 15, borderTop: `1px solid ${t.border}` }}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, letterSpacing: '.06em', fontWeight: 700, color: t.faint }}>
          VALOR UNITÁRIO
          {/* leva 1: edição de preço inerte (não persiste) — botão não entra em modo edição */}
          {!editing && (
            <button onClick={(e) => e.preventDefault()} title="Editar valor" style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 20, height: 20, borderRadius: 5, color: t.accentText, opacity: hover ? 1 : 0, transition: 'opacity .15s' }}><Icon name="pencil" size={13} /></button>
          )}
        </div>
        {editing ? (
          <input autoFocus value={p.preco} onChange={(e) => onEdit({ ...p, preco: e.target.value }, true)} onBlur={() => setEditing(false)} onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            style={{ width: 110, height: 32, textAlign: 'right', borderRadius: 8, border: `1px solid ${t.accent}`, background: t.panel, color: t.text, fontSize: 16, fontWeight: 850, fontFamily: 'inherit', outline: 'none', padding: '0 8px' }} />
        ) : (
          <div style={{ fontSize: 20, fontWeight: 850, color: t.text }}>{p.preco}</div>
        )}
      </div>

      {confirm && (
        <div onClick={() => setConfirm(false)} style={{ position: 'absolute', inset: 0, zIndex: 25, borderRadius: 16, background: frHexToRgba(t.panel === '#ffffff' ? '#ffffff' : '#0e0f12', 0.96), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, textAlign: 'center', border: `1px solid ${t.borderStrong}` }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, background: uiTone(t, 'red').bg, color: uiTone(t, 'red').fg, display: 'grid', placeItems: 'center' }}><Icon name="trash" size={22} /></span>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>Excluir “{p.nome}”?</div>
          <div style={{ display: 'flex', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <Btn t={t} kind="ghost" onClick={() => setConfirm(false)}>Cancelar</Btn>
            {/* leva 1: exclusão inerte (não remove do backend) — apenas fecha a confirmação */}
            <button onClick={() => setConfirm(false)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: uiTone(t, 'red').fg, color: '#fff' }}><Icon name="trash" size={16} /> Excluir</button>
          </div>
        </div>
      )}
    </Card>
  );
}

function InventarioModal({ t, onClose }) {
  const [drag, setDrag] = useStateM(false);
  const [file, setFile] = useStateM(null);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,10,16,.6)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(620px,96vw)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="clipboard" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 850, color: t.text }}>Fazer Inventário</div><div style={{ fontSize: 12.5, color: t.muted }}>Importe a planilha com a contagem dos itens.</div></div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: t.muted }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 14, background: t.accentSoft, border: `1px solid ${frHexToRgba(t.accent, 0.25)}`, marginBottom: 18 }}>
            <Icon name="sheet" size={22} style={{ color: t.accentText, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>Modelo de planilha</div><div style={{ fontSize: 11.5, color: t.muted }}>Colunas: SKU · Nome · Quantidade Contada</div></div>
            <button onClick={() => { const csv = 'SKU,Nome,Quantidade Contada\\n9.99.0238,Parafuso Sextavado M8,\\n1.02.0044,Chapa Aço 1020 2mm,'; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'modelo-inventario.csv'; a.click(); }}
              style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: t.panel, color: t.accentText, border: `1px solid ${t.border}` }}><Icon name="download" size={15} /> Baixar modelo</button>
          </div>
          <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); setFile((e.dataTransfer.files[0] || {}).name || 'planilha.xlsx'); }}
            style={{ display: 'block', cursor: 'pointer', borderRadius: 16, padding: '34px 20px', textAlign: 'center', border: `2px dashed ${drag ? t.accent : t.borderStrong}`, background: drag ? t.accentSoft : t.elevated, transition: 'all .15s' }}>
            <input type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={(e) => setFile((e.target.files[0] || {}).name)} />
            <div style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: 15, display: 'grid', placeItems: 'center', background: t.accentSoft, color: t.accentText }}><Icon name="upload" size={26} /></div>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{file || 'Arraste a planilha ou clique para selecionar'}</div>
            <div style={{ fontSize: 12.5, color: t.muted, marginTop: 5 }}>Formatos aceitos: .xlsx, .csv</div>
          </label>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn t={t} kind="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn t={t} icon="check" onClick={onClose}>Processar inventário</Btn>
        </div>
      </div>
    </div>
  );
}

// Janela de páginas com reticências: 1 … 4 5 [6] 7 8 … 44 — não estoura a barra em muitas páginas.
function frPageList(current, total) {
  const delta = 2, range = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  range.push(1);
  if (left > 2) range.push('…');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push('…');
  if (total > 1) range.push(total);
  return range;
}

// Controle de paginação — usa os mesmos tokens (navy/gold via t.accent) e o mesmo idioma visual dos botões existentes.
function Paginacao({ t, page, totalPages, total, start, end, onPage, unidade = 'itens' }) {
  if (total <= 0) return null;
  const cell = (extra) => ({ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 40, height: 40, padding: '0 12px', borderRadius: 11, fontSize: 13, fontWeight: 700, background: t.panel, color: t.text, border: `1px solid ${t.border}`, transition: 'background .14s, border-color .14s, filter .14s', ...extra });
  const step = (n) => { if (n < 1 || n > totalPages || n === page) return; onPage(n); };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginTop: 22 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: t.muted }}>
        <b style={{ color: t.text, fontWeight: 800 }}>{start.toLocaleString('pt-BR')}–{end.toLocaleString('pt-BR')}</b> de <b style={{ color: t.text, fontWeight: 800 }}>{total.toLocaleString('pt-BR')}</b> {unidade}
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <button aria-label="Página anterior" onClick={() => step(page - 1)}
            style={cell(page <= 1 ? { opacity: .45, cursor: 'not-allowed' } : {})}
            onMouseEnter={(e) => { if (page > 1) e.currentTarget.style.background = t.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = t.panel; }}>
            <Icon name="chevronLeft" size={16} />
          </button>
          {frPageList(page, totalPages).map((n, i) => {
            if (n === '…') return <span key={`gap${i}`} style={{ minWidth: 22, textAlign: 'center', color: t.faint, fontSize: 13, fontWeight: 700 }}>…</span>;
            const on = n === page;
            return (
              <button key={n} aria-current={on ? 'page' : undefined} onClick={() => step(n)}
                style={cell(on ? { background: t.accent, color: t.onAccent, border: `1px solid ${t.accent}`, boxShadow: `0 4px 12px ${frHexToRgba(t.accent, 0.28)}` } : {})}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = t.hover; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = t.panel; }}>
                {n}
              </button>
            );
          })}
          <button aria-label="Próxima página" onClick={() => step(page + 1)}
            style={cell(page >= totalPages ? { opacity: .45, cursor: 'not-allowed' } : {})}
            onMouseEnter={(e) => { if (page < totalPages) e.currentTarget.style.background = t.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = t.panel; }}>
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function PageCatalogo({ t, brand }) {
  const [inv, setInv] = useStateM(false);
  const [edit, setEdit] = useStateM(null);
  const [page, setPage] = useStateM(1);
  const topRef = useRefM(null);
  // Fonte REAL: GET /products adaptado. Escrita (novo/editar/excluir/inventário) fica para a próxima leva.
  const { items, loading, error, reload } = window.useFRProducts();
  // Paginação: aqui a busca é inerte (homolog), então paginamos a lista completa direto.
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, total);
  const pageItems = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const goToPage = (n) => { setPage(n); if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <div ref={topRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 850, letterSpacing: '-.02em', color: t.text }}>Movimentação</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: t.muted }}>Cadastre produtos, ajuste valores e faça o inventário do estoque.</p>
        </div>
        <Btn t={t} icon="clipboard" onClick={() => setInv(true)}>Fazer Inventário</Btn>
      </div>
      <HeroPatrimonio t={t} brand={brand} produtos={items} />
      <div style={{ display: 'flex', gap: 20, marginTop: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <NovoProdutoForm t={t} brand={brand} />
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', borderRadius: 13, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, marginBottom: 16 }}>
            <Icon name="search" size={17} /><span style={{ fontSize: 13.5 }}>Busque por nome, SKU ou tag…</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 11, fontWeight: 700, color: t.muted }}>FILTROS:</span><Badge t={t} kind="amber">HOMOLOG</Badge></div>
          </div>
          {error ? (
            <ProdutoErro t={t} message={error} onRetry={reload} />
          ) : (
            <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <ProdutoCardSkeleton key={`sk${i}`} t={t} />)
                : items.length === 0
                ? <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhum produto" sub="Nenhum produto ativo no catálogo." /></Card></div>
                : pageItems.map((p) => <ProdutoCard key={p.product_id || p.sku} t={t} p={p} onEdit={(np) => setEdit(np)} onDelete={() => {}} />)}
            </div>
            {!loading && total > 0 && <Paginacao t={t} page={safePage} totalPages={totalPages} total={total} start={start} end={end} onPage={goToPage} unidade="produtos" />}
            </>
          )}
        </div>
      </div>
      {inv && <InventarioModal t={t} onClose={() => setInv(false)} />}
      {edit && <EditProdutoModal t={t} prod={edit} onClose={() => setEdit(null)} onSave={() => setEdit(null)} />}
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
    const csv = [head, ...rows].join('\\n');
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

function PageProdutos({ t, theme }) {
  const [q, setQ] = useStateM('');
  const [rel, setRel] = useStateM(false);
  const [page, setPage] = useStateM(1);
  const topRef = useRefM(null);
  // Fonte REAL: GET /products adaptado.
  const { items, loading, error, reload } = window.useFRProducts();
  const ql = q.trim().toLowerCase();
  // Ordem obrigatória: filtrar/buscar sobre a lista COMPLETA primeiro; só então paginar a fatia visível.
  const view = items.filter((p) => !ql || (p.nome || '').toLowerCase().includes(ql) || (p.sku || '').toLowerCase().includes(ql) || (p.tag || '').toLowerCase().includes(ql));
  const total = view.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, total);
  const pageItems = view.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const goToPage = (n) => { setPage(n); if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  // Ao mudar a busca, volta para a página 1 (senão ficaria numa página inexistente no resultado filtrado).
  const onBusca = (e) => { setQ(e.target.value); setPage(1); };
  return (
    <div ref={topRef}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 850, letterSpacing: '-.02em', color: t.text, display: 'flex', alignItems: 'center', gap: 11 }}><Icon name="box" size={25} style={{ color: t.accentText }} /> Produtos</h1>
          <p style={{ margin: '7px 0 0', fontSize: 13.5, color: t.muted }}>Visualize os materiais do estoque com foto, disponibilidade e valor.</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, width: 320, maxWidth: '100%', height: 46, padding: '0 14px', borderRadius: 12, background: t.panel, border: `1px solid ${t.border}`, color: t.muted, cursor: 'text' }}>
          <Icon name="search" size={18} />
          <input value={q} onChange={onBusca} placeholder="Buscar por nome, SKU ou tag…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
        </label>
        <Btn t={t} icon="barChart" onClick={() => setRel(true)}>Relatório</Btn>
      </div>

      {error ? (
        <ProdutoErro t={t} message={error} onRetry={reload} />
      ) : (
      <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
        {loading && Array.from({ length: 10 }).map((_, i) => <ProdutoCardSkeleton key={`sk${i}`} t={t} media />)}
        {!loading && pageItems.map((p) => {
          const out = p.disp <= 0;
          return (
            <div key={p.sku} style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${t.border}`, background: t.panel, transition: 'transform .18s ease, box-shadow .18s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = t.shadow; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ position: 'relative' }}>
                {p.img
                  ? <img src={window.__asset(p.img)} alt={p.nome} style={{ display: 'block', width: '100%', height: 200, objectFit: p.imgFit || 'cover', padding: p.imgFit === 'contain' ? 22 : 0, boxSizing: 'border-box', background: '#ffffff' }} />
                  : <image-slot id={`prod-${p.sku}`} shape="rect" placeholder="Foto do material" style={{ display: 'block', width: '100%', height: 200, background: '#e9ebf0' }}></image-slot>}
                {p.tag && <span style={{ position: 'absolute', top: 0, left: 0, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', padding: '7px 14px', borderTopLeftRadius: 16, borderBottomRightRadius: 12, color: '#fff', background: uiTone(t, p.kind).fg, boxShadow: '0 3px 10px rgba(0,0,0,.22)' }}><Icon name="box" size={13} /> {p.tag}</span>}
                <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 800, padding: '5px 11px', borderRadius: 999, color: '#fff', background: out ? '#ef4444' : '#10b981', boxShadow: '0 4px 10px rgba(0,0,0,.25)' }}>{out ? 'Esgotado' : `${p.disp} ${p.un}`}</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: t.muted, letterSpacing: '.02em' }}>{p.sku}</div>
                <div style={{ fontSize: 15.5, fontWeight: 850, color: t.text, margin: '6px 0 14px', lineHeight: 1.3, letterSpacing: '-.01em' }}>{p.nome}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, padding: '10px 12px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>DISPONÍVEL</div>
                    <div style={{ fontSize: 16, fontWeight: 850, color: out ? uiTone(t, 'red').fg : t.accentText, marginTop: 3 }}>{p.disp} <span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{p.un}</span></div>
                  </div>
                  <div style={{ flex: 1, padding: '10px 12px', borderRadius: 11, background: t.elevated, border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', color: t.faint }}>EM ESTOQUE</div>
                    <div style={{ fontSize: 16, fontWeight: 850, color: t.text, marginTop: 3 }}>{p.estoque} <span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{p.un}</span></div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.faint, letterSpacing: '.04em' }}>VALOR UNITÁRIO</span>
                  <span style={{ fontSize: 17, fontWeight: 850, color: t.text }}>{p.preco}</span>
                </div>
              </div>
            </div>
          );
        })}
        {!loading && view.length === 0 && <div style={{ gridColumn: '1/-1' }}><Card t={t} style={{ padding: 10 }}><EmptyState t={t} title="Nenhum produto" sub={q ? 'Ajuste a busca.' : 'Nenhum produto ativo no catálogo.'} /></Card></div>}
      </div>
      {!loading && total > 0 && <Paginacao t={t} page={safePage} totalPages={totalPages} total={total} start={start} end={end} onPage={goToPage} unidade="produtos" />}
      </>
      )}
      {rel && <RelatorioModal t={t} onClose={() => setRel(false)} produtos={items} />}
    </div>
  );
}

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

Object.assign(window, { PageCatalogo, PageDashboard, PageProdutos });
