// sidebar.jsx — Fluxo Royale ERP sidebar, faithful to the Figma model.
const { useState, useRef, useEffect } = React;

function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function shade(hex) {
  const h = hex.replace('#', '');
  const r = Math.round(parseInt(h.slice(0,2),16)*0.78), g = Math.round(parseInt(h.slice(2,4),16)*0.72), b = Math.round(parseInt(h.slice(4,6),16)*0.72);
  return `rgb(${r},${g},${b})`;
}

function tokens(theme, accent, accentText) {
  if (theme === 'light') {
    return {
      panel: '#ffffff', hover: '#f5f5f3', elevated: '#fafaf9',
      border: '#ededeb', borderStrong: '#e2e2df',
      text: '#1a1b1d', muted: '#9a9da3', faint: '#b7bac0',
      accent, accentText: shade(accentText), accentSoft: hexToRgba(accent, 0.12), onAccent: '#ffffff',
      activeShadow: `0 4px 12px ${hexToRgba(accent, 0.28)}`,
      shadow: '0 1px 2px rgba(20,20,25,.05), 0 10px 30px rgba(20,20,25,.08)',
    };
  }
  return {
    panel: '#0e0f12', hover: 'rgba(255,255,255,.05)', elevated: '#16181d',
    border: 'rgba(255,255,255,.07)', borderStrong: 'rgba(255,255,255,.12)',
    text: '#ededee', muted: '#8b8f98', faint: '#5c606a',
    accent, accentText, accentSoft: hexToRgba(accent, 0.16), onAccent: '#04130d',
    activeShadow: `0 4px 14px ${hexToRgba(accent, 0.4)}`,
    shadow: '0 1px 2px rgba(0,0,0,.4), 0 14px 36px rgba(0,0,0,.5)',
  };
}

// ---------- Module switcher (Figma header) ----------
function ModuleSwitcher({ t, mod, collapsed, open, onToggle, onCollapse }) {
  const tile = (size) => (
    <div style={{
      width: size, height: size, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center',
      background: hexToRgba(t.accent, 0.14), color: t.accentText,
    }}>
      <Icon name={mod.icon} size={size * 0.5} />
    </div>
  );

  if (collapsed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <button onClick={onToggle} title={`Módulo: ${mod.name}`} style={{
          all: 'unset', cursor: 'pointer', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center',
          background: hexToRgba(t.accent, 0.14), color: t.accentText,
          outline: open ? `2px solid ${t.accent}` : 'none', outlineOffset: 2,
        }}>
          <Icon name={mod.icon} size={22} />
        </button>
        <button onClick={onCollapse} title="Expandir" style={{
          all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center',
          color: t.muted, border: `1px solid ${t.border}`,
        }}>
          <Icon name="chevronsRight" size={15} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button onClick={onToggle} style={{
        all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1, minWidth: 0,
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 12,
        background: open ? t.hover : 'transparent', transition: 'background .14s',
      }}
      onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = t.hover; }}
      onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}>
        {tile(36)}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', color: t.faint, lineHeight: 1.2 }}>MÓDULO</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-.01em', marginTop: 1 }}>{mod.name}</div>
        </div>
        <Icon name="chevronRight" size={15} style={{ color: t.faint, flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      <button onClick={onCollapse} title="Recolher" style={{
        all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        display: 'grid', placeItems: 'center', color: t.muted,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
        <Icon name="chevronsLeft" size={16} />
      </button>
    </div>
  );
}

// ---------- Module dropdown (flyout to the side) ----------
function ModuleDropdown({ t, modules, current, collapsed, onPick }) {
  const mobile = typeof window !== 'undefined' && window.innerWidth <= 860;
  const pos = mobile
    ? { top: 'calc(100% + 8px)', left: 12, right: 12, width: 'auto', maxHeight: '70vh', overflowY: 'auto' }
    : { top: collapsed ? 0 : 6, left: collapsed ? 'calc(100% + 12px)' : 'calc(100% + 14px)', width: 256 };
  return (
    <div className="fr-scroll" style={{
      position: 'absolute', zIndex: 40, ...pos,
      background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 14,
      boxShadow: t.shadow, padding: 6, opacity: 1,
    }}>
      <style>{`@keyframes frPop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ animation: 'frPop .15s ease-out' }}>
        <div style={{ fontSize: 9.5, letterSpacing: '.14em', color: t.faint, fontWeight: 700, padding: '7px 10px 5px' }}>TROCAR DE MÓDULO</div>
        {modules.map((m) => {
          const isCur = m.id === current.id;
          return (
            <button key={m.id} onClick={() => onPick(m)} style={{
              all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
              display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 10,
              background: isCur ? t.hover : 'transparent', transition: 'background .12s',
            }}
            onMouseEnter={(e) => { if (!isCur) e.currentTarget.style.background = t.hover; }}
            onMouseLeave={(e) => { if (!isCur) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', flexShrink: 0, background: hexToRgba(m.accent, 0.14), color: m.accentText }}>
                <Icon name={m.icon} size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 620, color: t.text }}>{m.name}</div>
                <div style={{ fontSize: 11, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.subtitle}</div>
              </div>
              {isCur && <Icon name="check" size={16} style={{ color: m.accentText }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Nav item ----------
function NavRow({ t, item, active, expanded, collapsed, onSelect, onToggleExpand }) {
  const hasChildren = !!item.children;
  const childActive = hasChildren && item.children.some((c) => c.id === active);
  const isActive = active === item.id || childActive;

  const rowStyle = {
    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    padding: collapsed ? 0 : '0 12px', height: 42, borderRadius: 10,
    justifyContent: collapsed ? 'center' : 'flex-start',
    transition: 'background .12s, color .12s', userSelect: 'none',
    color: isActive ? t.onAccent : t.text,
    background: isActive ? t.accent : 'transparent',
    boxShadow: isActive ? t.activeShadow : 'none',
  };

  return (
    <div>
      <div
        title={collapsed ? item.name : undefined}
        onClick={() => (hasChildren && !collapsed ? onToggleExpand(item.id) : onSelect(item.id))}
        style={rowStyle}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = t.hover; }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon name={item.icon} size={20} stroke={1.7} style={{ color: 'currentColor' }} />
        {!collapsed && <span style={{ flex: 1, fontSize: 14, fontWeight: isActive ? 650 : 500 }}>{item.name}</span>}
        {!collapsed && item.badge && (
          <span style={{ fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, display: 'grid', placeItems: 'center',
            background: isActive ? hexToRgba('#ffffff', 0.25) : t.accentSoft, color: isActive ? t.onAccent : t.accentText }}>{item.badge}</span>
        )}
        {!collapsed && hasChildren && (
          <Icon name="chevronDown" size={15} style={{ color: 'currentColor', opacity: .75, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        )}
      </div>

      {hasChildren && expanded && !collapsed && (
        <div style={{ marginTop: 2, marginBottom: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {item.children.map((c) => {
            const ca = active === c.id;
            return (
              <div key={c.id} onClick={() => onSelect(c.id)} style={{
                cursor: 'pointer', padding: '8px 12px 8px 44px', borderRadius: 9, fontSize: 13,
                color: ca ? t.accentText : t.muted, fontWeight: ca ? 600 : 500,
                transition: 'background .12s, color .12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; if (!ca) e.currentTarget.style.color = t.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; if (!ca) e.currentTarget.style.color = t.muted; }}>
                {c.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Theme toggle (Figma segmented) ----------
function ThemeToggle({ t, theme, setTheme, collapsed }) {
  if (collapsed) {
    return (
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Tema"
        style={{ all: 'unset', cursor: 'pointer', width: 40, height: 40, margin: '0 auto', borderRadius: 10,
          display: 'grid', placeItems: 'center', color: t.muted, border: `1px solid ${t.border}` }}>
        <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} />
      </button>
    );
  }
  const opt = (val, icon, label) => {
    const on = theme === val;
    return (
      <button onClick={() => setTheme(val)} style={{
        all: 'unset', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        height: 32, borderRadius: 999, fontSize: 12.5, fontWeight: 600,
        background: on ? t.panel : 'transparent', color: on ? t.text : t.muted,
        boxShadow: on ? '0 1px 3px rgba(0,0,0,.12)' : 'none', transition: 'all .15s',
      }}>
        <Icon name={icon} size={15} /> {label}
      </button>
    );
  };
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: t.hover }}>
      {opt('light', 'sun', 'Claro')}
      {opt('dark', 'moon', 'Escuro')}
    </div>
  );
}

// ---------- Sidebar shell ----------
function Sidebar({ theme, setTheme, collapsed, setCollapsed, accent, accentText, modules, onLogout, onSwitchModule, mod, setMod, active, setActive, expanded, setExpanded, dropOpen, setDropOpen }) {
  const t = tokens(theme, accent, accentText);
  const W = collapsed ? 80 : 288;
  const switcherRef = useRef(null);

  useEffect(() => {
    if (!dropOpen) return;
    const onDoc = (e) => { if (switcherRef.current && !switcherRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [dropOpen]);

  return (
    <div style={{
      width: W, flexShrink: 0, height: '100%', boxSizing: 'border-box',
      background: t.panel, borderRight: `1px solid ${t.border}`, color: t.text,
      display: 'flex', flexDirection: 'column', transition: 'width .22s cubic-bezier(.4,0,.2,1)', fontFamily: 'inherit',
    }}>
      {/* Header / module switcher */}
      <div ref={switcherRef} style={{ position: 'relative', padding: collapsed ? '16px 0 14px' : '14px 14px 12px', borderBottom: `1px solid ${t.border}` }}>
        <ModuleSwitcher t={t} mod={mod} collapsed={collapsed} open={dropOpen}
          onToggle={() => setDropOpen((o) => !o)} onCollapse={() => { setCollapsed(!collapsed); setDropOpen(false); }} />
        {dropOpen && (
          <ModuleDropdown t={t} modules={modules || MODULES} current={mod} collapsed={collapsed}
            onPick={(m) => { setMod(m); setDropOpen(false); }} />
        )}
      </div>

      {/* Nav */}
      <div className="fr-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '12px 16px' : '12px 16px' }}>
        {(mod.nav || NAV).map((sec, i) => (
          <div key={sec.label} style={{ marginTop: i === 0 ? 0 : 20 }}>
            {!collapsed
              ? <div style={{ fontSize: 10, letterSpacing: '.13em', color: t.faint, fontWeight: 700, padding: '0 12px 8px' }}>{sec.label.toUpperCase()}</div>
              : <div style={{ height: 1, background: t.border, margin: '14px 6px' }} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sec.items.map((item) => (
                <NavRow key={item.id} t={t} item={item} active={active}
                  expanded={expanded.includes(item.id)} collapsed={collapsed}
                  onSelect={(id) => setActive(id)}
                  onToggleExpand={(id) => setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]))} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: collapsed ? '12px 16px 16px' : '12px 16px 16px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ThemeToggle t={t} theme={theme} setTheme={setTheme} collapsed={collapsed} />
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button title="Trocar de módulo" onClick={onSwitchModule} style={{
              all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1, minWidth: 0,
              display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 12, transition: 'background .14s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{USER.name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 680, color: t.text }}>{USER.name}</div>
                <div style={{ fontSize: 11.5, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{USER.role || USER.funcao || 'Conta'}</div>
              </div>
            </button>
            <button title="Sair da conta" onClick={onLogout} style={{
              all: 'unset', cursor: 'pointer', flexShrink: 0, width: 38, height: 38, borderRadius: 11,
              display: 'grid', placeItems: 'center', color: t.muted, transition: 'background .14s, color .14s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.muted; }}>
              <Icon name="logout" size={17} />
            </button>
          </div>
        ) : (
          <div title={USER.name} style={{ width: 38, height: 38, margin: '0 auto', borderRadius: '50%', background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14 }}>{USER.name[0]}</div>
        )}
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.frTokens = tokens;
window.frHexToRgba = hexToRgba;
