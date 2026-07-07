// erpframe.jsx — app shell: sidebar + routed content with topbar (brand toggle, search, bell).
const { useState: useStateF } = React;

const BRANDS = {
  azul:  { accent: '#2563eb', accentText: '#7aa2ff', accentDark: '#1b2f7a', yellow: '#ffd400' },
  verde: { accent: '#10b981', accentText: '#34d399', accentDark: '#065f46', yellow: '#ffd400' },
};

function BrandToggle({ t, brand, setBrand }) {
  const opt = (val, color, label) => {
    const on = brand === val;
    return (
      <button onClick={() => setBrand(val)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
        height: 32, padding: '0 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 700,
        background: on ? t.panel : 'transparent', color: on ? t.text : t.muted, boxShadow: on ? '0 1px 3px rgba(0,0,0,.12)' : 'none', transition: 'all .15s' }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: color }} />{label}
      </button>
    );
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 4, borderRadius: 999, background: t.elevated, border: `1px solid ${t.border}`, flexShrink: 0 }}>
      {opt('azul', '#2563eb', 'Azul')}
      {opt('verde', '#10b981', 'Verde')}
    </div>
  );
}

const FR_NOTIFS = [
  { id: 1, icon: 'truck', tone: 'blue', titulo: 'Separação enviada', txt: 'OP 73001 · Granja Paraíso saiu para entrega.', time: 'há 5 min' },
  { id: 2, icon: 'alert', tone: 'amber', titulo: 'Estoque baixo', txt: 'Tinta Epóxi Cinza 3,6L · 7 un. restantes.', time: 'há 22 min' },
  { id: 3, icon: 'clipboard', tone: 'green', titulo: 'Nova solicitação', txt: 'William Souza solicitou materiais p/ OP 88210.', time: 'há 1 h' },
  { id: 4, icon: 'box', tone: 'gray', titulo: 'Recebimento confirmado', txt: 'Setor Esteira confirmou o recebimento da OP 12010.', time: 'há 3 h' },
];

function NotifMenu({ t, items, onRead, onReadAll, onClose }) {
  const toneFg = { blue: t.accent, amber: '#d97706', green: '#10b981', gray: t.muted };
  const toneBg = { blue: t.accentSoft, amber: 'rgba(245,158,11,.16)', green: 'rgba(16,185,129,.14)', gray: t.hover };
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
      <div style={{ position: 'absolute', top: 52, right: 0, zIndex: 50, width: 360, maxWidth: '92vw', background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 16, boxShadow: '0 20px 50px -12px rgba(0,0,0,.32)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Notificações</div>
          <button onClick={onReadAll} style={{ all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: t.accentText }}>Marcar todas como lidas</button>
        </div>
        <div className="fr-scroll" style={{ maxHeight: 380, overflowY: 'auto' }}>
          {items.length === 0
            ? <div style={{ padding: '40px 20px', textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Nenhuma notificação.</div>
            : items.map((n, i) => (
              <button key={n.id} onClick={() => onRead(n.id)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', display: 'flex', gap: 12, padding: '13px 16px', borderBottom: i < items.length - 1 ? `1px solid ${t.border}` : 'none', borderLeft: (n.highlight && !n.read) ? '3px solid #ef4444' : '3px solid transparent', background: (n.highlight && !n.read) ? frHexToRgba('#ef4444', 0.07) : n.read ? 'transparent' : frHexToRgba(t.accent, 0.05), transition: 'background .12s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = (n.highlight && !n.read) ? frHexToRgba('#ef4444', 0.07) : n.read ? 'transparent' : frHexToRgba(t.accent, 0.05); }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: toneBg[n.tone], color: toneFg[n.tone] }}><Icon name={n.icon} size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{n.titulo}</span>
                    {n.highlight && !n.read && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.04em', padding: '2px 6px', borderRadius: 6, background: '#ef4444', color: '#fff' }}>NOVA</span>}
                    {!n.read && !n.highlight && <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.accent, flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 12.5, color: t.muted, marginTop: 2, textWrap: 'pretty' }}>{n.txt}</div>
                  <div style={{ fontSize: 11, color: t.faint, marginTop: 4 }}>{n.time}</div>
                </div>
              </button>
            ))}
        </div>
      </div>
    </>
  );
}

function frFlattenNav(nav) {
  const out = [];
  (nav || []).forEach((sec) => (sec.items || []).forEach((it) => {
    out.push({ id: it.id, name: it.name, icon: it.icon, group: sec.label });
    (it.items || []).forEach((sub) => out.push({ id: sub.id, name: sub.name, icon: sub.icon || it.icon, group: it.name }));
  }));
  return out;
}

// Persistência da PÁGINA ATIVA dentro do módulo no F5 — MESMO padrão do fr_active_module (app.jsx):
// chave constante + getItem no init + setItem na troca, tudo em try/catch com guarda de validade.
// Guarda a DUPLA { mod, page } p/ a página NÃO vazar entre módulos: só restaura se o módulo do boot
// (startMod, vindo do fr_active_module) for o mesmo em que a página foi salva E a página existir na nav dele.
const FR_ACTIVE_PAGE_KEY = 'fr_active_page';
function frSaveActivePage(modId, pageId) { try { localStorage.setItem(FR_ACTIVE_PAGE_KEY, JSON.stringify({ mod: modId, page: pageId })); } catch (e) {} }
function frBootActivePage(startMod, home) {
  try {
    const raw = localStorage.getItem(FR_ACTIVE_PAGE_KEY);
    if (!raw) return home;
    const saved = JSON.parse(raw);
    if (!saved || saved.mod !== startMod.id) return home;                                       // página salva é de OUTRO módulo → home
    return frFlattenNav(startMod.nav).some((p) => p.id === saved.page) ? saved.page : home;      // página não existe na nav do módulo → home
  } catch (e) { return home; }
}

function Topbar({ t, brand, setBrand, mod, setActive, mobile, onMenu }) {
  const [notifs, setNotifs] = useStateF(FR_NOTIFS.map((n) => ({ ...n, read: false })));
  const [open, setOpen] = useStateF(false);
  const [q, setQ] = useStateF('');
  const [sOpen, setSOpen] = useStateF(false);
  const [flash, setFlash] = useStateF(false);
  React.useEffect(() => {
    const onNotify = (e) => {
      const d = e.detail || {};
      setNotifs((xs) => [{ id: 'ev' + Date.now(), icon: d.icon || 'bell', tone: d.tone || 'amber', titulo: d.titulo || 'Notificação', txt: d.txt || '', time: 'agora', read: false, highlight: true }, ...xs]);
      setFlash(true); setTimeout(() => setFlash(false), 2600);
    };
    window.addEventListener('fr-notify', onNotify);
    return () => window.removeEventListener('fr-notify', onNotify);
  }, []);
  const unread = notifs.filter((n) => !n.read).length;
  const readOne = (id) => setNotifs((xs) => xs.map((n) => n.id === id ? { ...n, read: true } : n));
  const readAll = () => setNotifs((xs) => xs.map((n) => ({ ...n, read: true })));
  const pages = frFlattenNav(mod.nav);
  const results = q.trim() ? pages.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];
  const go = (id) => { setActive(id); setQ(''); setSOpen(false); };
  return (
    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: mobile ? 10 : 14, padding: mobile ? '16px 14px 4px' : '20px 24px 4px', background: 'transparent' }}>
      {mobile
        ? <button onClick={onMenu} title="Menu" style={{ all: 'unset', cursor: 'pointer', flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: t.elevated, border: `1px solid ${t.border}`, display: 'grid', placeItems: 'center', color: t.text }}>
            <Icon name="menu" size={20} />
          </button>
        : <BrandToggle t={t} brand={brand} setBrand={setBrand} />}
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 14px', borderRadius: 12, background: t.elevated, border: `1px solid ${sOpen ? t.accent : t.border}`, boxShadow: sOpen ? `0 0 0 3px ${frHexToRgba(t.accent, 0.12)}` : 'none', color: t.muted, cursor: 'text', transition: 'border-color .15s, box-shadow .15s' }}>
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => { setQ(e.target.value); setSOpen(true); }} onFocus={() => setSOpen(true)} onBlur={() => setTimeout(() => setSOpen(false), 150)}
            placeholder={`Pesquisar no ${mod.name}…`} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 14, fontFamily: 'inherit' }} />
          {q
            ? <button onMouseDown={(e) => { e.preventDefault(); setQ(''); }} style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 6, color: t.faint }}><Icon name="x" size={15} /></button>
            : <kbd style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: t.faint, background: t.hover, borderRadius: 6, padding: '3px 7px', border: `1px solid ${t.border}`, fontFamily: 'inherit' }}>⌘K</kbd>}
        </label>
        {sOpen && q.trim() && (
          <div style={{ position: 'absolute', top: 52, left: 0, right: 0, zIndex: 50, background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 14, boxShadow: '0 20px 50px -12px rgba(0,0,0,.32)', overflow: 'hidden' }}>
            {results.length === 0
              ? <div style={{ padding: '22px 16px', textAlign: 'center', color: t.muted, fontSize: 13.5 }}>Nada encontrado para “{q}”.</div>
              : <div className="fr-scroll" style={{ maxHeight: 360, overflowY: 'auto', padding: 6 }}>
                  {results.map((p) => (
                    <button key={p.id} onMouseDown={(e) => { e.preventDefault(); go(p.id); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, transition: 'background .12s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center', background: t.accentSoft, color: t.accentText }}><Icon name={p.icon || 'grid'} size={17} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, color: t.faint }}>{p.group}</div>
                      </div>
                      <Icon name="chevronRight" size={16} />
                    </button>
                  ))}
                </div>}
          </div>
        )}
      </div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <style>{`@keyframes frPing{0%{transform:scale(1);opacity:.55}70%,100%{transform:scale(2.4);opacity:0}}@keyframes frBellShake{0%,100%{transform:rotate(0)}20%{transform:rotate(-16deg)}40%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}80%{transform:rotate(4deg)}}@keyframes frBellPulse{0%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}100%{box-shadow:0 0 0 14px rgba(239,68,68,0)}}`}</style>
        <button title="Notificações" onClick={() => setOpen((v) => !v)} style={{ all: 'unset', cursor: 'pointer', position: 'relative', width: 44, height: 44, borderRadius: 13, background: flash ? frHexToRgba('#ef4444', 0.14) : open ? t.hover : t.elevated, border: `1px solid ${flash ? '#ef4444' : open ? t.borderStrong : t.border}`, display: 'grid', placeItems: 'center', color: flash ? '#ef4444' : t.text, transition: 'background .14s, border-color .14s, color .14s', animation: flash ? 'frBellPulse 1.4s ease-out 2' : 'none' }}
          onMouseEnter={(e) => { if (!flash) { e.currentTarget.style.background = t.hover; e.currentTarget.style.borderColor = t.borderStrong; } }}
          onMouseLeave={(e) => { if (!open && !flash) { e.currentTarget.style.background = t.elevated; e.currentTarget.style.borderColor = t.border; } }}>
          <span style={{ display: 'grid', placeItems: 'center', animation: flash ? 'frBellShake .7s ease-in-out 2' : 'none', transformOrigin: 'top center' }}><Icon name="bell" size={19} stroke={1.75} /></span>
          {unread > 0 && <>
            <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 10.5, fontWeight: 800, display: 'grid', placeItems: 'center', border: `2px solid ${t.panel}`, boxSizing: 'content-box' }}>{unread}</span>
            <span style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: '#ef4444', animation: 'frPing 1.8s cubic-bezier(0,0,.2,1) infinite' }} />
          </>}
        </button>
        {open && <NotifMenu t={t} items={notifs} onRead={readOne} onReadAll={readAll} onClose={() => setOpen(false)} />}
      </div>
    </div>
  );
}

function ERPFrame({ user, initialMod, allowedModules, onLogout, onSwitchModule }) {
  const mods = (allowedModules && allowedModules.length) ? allowedModules : MODULES;
  const startMod = initialMod || mods[0];
  const homeOf = (m) => m.home || (m.nav && m.nav[0].items[0].id) || (NAV[0] && NAV[0].items[0].id);
  const [theme, setTheme] = useStateF('light');
  const [collapsed, setCollapsed] = useStateF(false);
  const [mod, setMod] = useStateF(startMod);
  const [active, setActive] = useStateF(function () { return frBootActivePage(startMod, homeOf(startMod)); });   // F5: restaura a página salva SE for do módulo atual e existir na nav; senão home
  const [expanded, setExpanded] = useStateF([]);
  const [dropOpen, setDropOpen] = useStateF(false);
  const [brand, setBrand] = useStateF('azul');
  const [mobile, setMobile] = useStateF(typeof window !== 'undefined' && window.innerWidth <= 860);
  const [drawer, setDrawer] = useStateF(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)');
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on); };
  }, []);

  const pickMod = (m) => { setMod(m); setActive(homeOf(m)); frSaveActivePage(m.id, homeOf(m)); setExpanded([]); setDrawer(false); };   // troca de módulo: salva {novo mod, home dele} (não vaza a página do módulo antigo)
  const goActive = (id) => { setActive(id); frSaveActivePage(mod.id, id); if (mobile) setDrawer(false); };   // troca de página: persiste {mod atual, página}

  const b = BRANDS[brand];
  const t = frTokens(theme, b.accent, b.accentText);
  const pageBg = theme === 'dark' ? '#0a0a0c' : '#f4f4f3';

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: t.panel, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: t.text, position: 'relative' }}>
      {mobile && drawer && (
        <div onClick={() => setDrawer(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.5)', animation: 'frFade .18s ease-out' }}>
          <style>{`@keyframes frFade{from{opacity:0}to{opacity:1}}`}</style>
        </div>
      )}
      <div style={mobile ? { position: 'fixed', zIndex: 61, top: 0, bottom: 0, left: 0, transform: drawer ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .24s cubic-bezier(.4,0,.2,1)', boxShadow: drawer ? '0 0 40px rgba(0,0,0,.4)' : 'none' } : undefined}>
        <Sidebar
          theme={theme} setTheme={setTheme} collapsed={mobile ? false : collapsed} setCollapsed={setCollapsed}
          accent={b.accent} accentText={b.accentText} modules={mods} onLogout={onLogout} onSwitchModule={onSwitchModule}
          mod={mod} setMod={pickMod} active={active} setActive={goActive}
          expanded={expanded} setExpanded={setExpanded} dropOpen={dropOpen} setDropOpen={setDropOpen}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0, background: pageBg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar t={t} brand={brand} setBrand={setBrand} mod={mod} setActive={goActive} mobile={mobile} onMenu={() => setDrawer(true)} />
        <div className="fr-scroll" style={{ flex: 1, overflowY: 'auto', padding: mobile ? 14 : 24 }}>
          {renderPage(active, { t, theme, brand: b, mod, setActive: goActive })}
        </div>
      </div>
    </div>
  );
}

window.ERPFrame = ERPFrame;
