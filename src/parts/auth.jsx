// auth.jsx — login screen + post-login module selector.
const { useState: useStateAuth } = React;

// Hook de viewport compartilhado (mobile ≤640, tablet ≤960).
function useFRViewport() {
  const [vp, setVp] = React.useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return { w, mobile: w <= 640, tablet: w <= 960 };
  });
  React.useEffect(() => {
    const on = () => { const w = window.innerWidth; setVp({ w, mobile: w <= 640, tablet: w <= 960 }); };
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return vp;
}
window.useFRViewport = useFRViewport;

const AUTH_BRAND = '#2e3192';      // Azul Royale (logo)
const AUTH_BRAND_D = '#1f2170';
const AUTH_INK = '#0e0f12';

// ---------- Login ----------
function LoginScreen({ onLogin }) {
  const [userId, setUserId] = useStateAuth('');
  const [senha, setSenha] = useStateAuth('');
  const [show, setShow] = useStateAuth(false);
  const [err, setErr] = useStateAuth('');
  const [busy, setBusy] = useStateAuth(false);

  // Login REAL: código de usuário + senha -> window.FRAuth.login (POST /auth/login).
  // O FRAuth concatena codigo -> codigo@fluxoroyale.local e DESCARTA encrypted_password.
  // Erros exibidos são a mensagem tratada do backend (usuário não encontrado,
  // senha incorreta, conta suspensa) ou a de rede (normalizeError).
  const submit = async (e) => {
    e && e.preventDefault();
    setErr('');
    const codigo = userId.trim();
    if (!codigo || !senha) { setErr('Informe o código de usuário e a senha.'); return; }
    setBusy(true);
    const { error } = await window.FRAuth.login(codigo, senha);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    // Sucesso: monta o usuário a partir do profile REAL e segue o fluxo do design.
    const prof = window.FRAuth.profile || {};
    const acc = window.FRAuth.user || {};
    onLogin({ id: acc.id, email: acc.email, name: prof.name, role: prof.role, setor: prof.sector });
  };

  const field = {
    boxSizing: 'border-box', width: '100%', height: 56, padding: '0 20px', borderRadius: 999,
    border: '1px solid #e3e5ea', background: '#fff', fontSize: 15, fontFamily: 'inherit', color: AUTH_INK, outline: 'none',
  };
  const onFocus = (e) => { e.target.style.borderColor = AUTH_BRAND; e.target.style.boxShadow = `0 0 0 4px rgba(46,49,146,.14)`; };
  const onBlur = (e) => { e.target.style.borderColor = '#e3e5ea'; e.target.style.boxShadow = 'none'; };

  const { mobile, tablet } = useFRViewport();
  const stack = tablet; // empilha painéis em tablet e celular

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: stack ? 'column' : 'row', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: '#fff' }}>

      {/* Brand panel (left on desktop / top band on mobile) */}
      <div style={{ position: 'relative', flex: stack ? '0 0 auto' : '0 0 47%', minHeight: stack ? (mobile ? 320 : 360) : 'auto', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: stack ? (mobile ? '28px 24px 52px' : '32px 40px 48px') : '40px 48px', color: '#fff',
        backgroundImage: `url(${window.__asset('assets/login-factory.png')})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(165deg, rgba(32,35,95,.82) 0%, ${frHexToRgba(AUTH_BRAND_D, .8)} 45%, rgba(20,22,63,.92) 100%)` }} />
        <div style={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', right: -200, bottom: -180, background: 'radial-gradient(circle, rgba(255,212,0,.14), transparent 68%)' }} />

        <p style={{ position: 'relative', margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}></p>

        <h1 style={{ position: 'relative', margin: '0 0 0', fontSize: mobile ? 32 : stack ? 42 : 54, fontWeight: 850, lineHeight: 1.02, letterSpacing: '-.035em' }}>Central de<br />operações<br /><span style={{ color: 'rgba(255,255,255,.62)' }}>Royale</span></h1>

        <div style={{ position: 'relative', display: stack ? 'none' : 'flex', alignItems: 'center', gap: 9 }}>
          <img src={window.__asset('assets/logo-royale.png')} alt="" style={{ width: 26, height: 26, objectFit: 'contain', opacity: .85 }} />
        </div>
      </div>

      {/* Form panel (right, white, curved seam on desktop) */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1, marginLeft: stack ? 0 : -52, marginTop: stack ? -28 : 0, background: '#fff', borderTopLeftRadius: stack ? 28 : 52, borderTopRightRadius: stack ? 28 : 0, borderBottomLeftRadius: stack ? 0 : 52, display: 'flex', flexDirection: 'column', padding: mobile ? '26px 22px 24px' : stack ? '34px 40px 28px' : '40px 64px 32px', minWidth: 0 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={window.__asset('assets/logo-royale.png')} alt="Fluxo Royale" style={{ width: 30, height: 30, objectFit: 'contain' }} />
            <div style={{ fontSize: 19, fontWeight: 850, letterSpacing: '-.02em', color: AUTH_INK }}>Fluxo Royale</div>
          </div>
        </div>

        {/* Centered form */}
        <form onSubmit={submit} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: mobile ? 'flex-start' : 'center', maxWidth: 400, width: '100%', margin: '0 auto', paddingTop: mobile ? 24 : 0 }}>
          <h2 style={{ margin: '0 0 26px', fontSize: mobile ? 34 : 44, fontWeight: 800, color: AUTH_INK, letterSpacing: '-.03em' }}>Entrar</h2>

          <input type="text" inputMode="numeric" value={userId} onChange={(e) => setUserId(e.target.value)} onFocus={onFocus} onBlur={onBlur}
            placeholder="Código de usuário (ex.: 007)" autoComplete="username" style={{ ...field, marginBottom: 14 }} />

          <div style={{ position: 'relative' }}>
            <input type={show ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} onFocus={onFocus} onBlur={onBlur}
              placeholder="Senha" autoComplete="current-password" style={{ ...field, paddingRight: 52 }} />
            <button type="button" onClick={() => setShow((s) => !s)} title={show ? 'Ocultar' : 'Mostrar'}
              style={{ all: 'unset', cursor: 'pointer', position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'grid', placeItems: 'center' }}>
              <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </div>

          <button type="button" onClick={(e) => e.preventDefault()} style={{ all: 'unset', cursor: 'pointer', alignSelf: 'flex-start', marginTop: 12, fontSize: 13.5, fontWeight: 700, color: AUTH_BRAND }}>
            Esqueceu a senha?
          </button>

          {err && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#dc2626', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 12, padding: '10px 14px', marginTop: 14 }}>
              <Icon name="alert" size={16} /> {err}
            </div>
          )}

          <button type="submit" disabled={busy} style={{ all: 'unset', boxSizing: 'border-box', cursor: busy ? 'default' : 'pointer', width: '100%', height: 56, borderRadius: 999, marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 16, fontWeight: 800, color: '#fff', background: busy ? AUTH_BRAND_D : `linear-gradient(90deg, ${AUTH_BRAND}, #4348c4)`, boxShadow: '0 14px 30px rgba(46,49,146,.4)', transition: 'filter .15s, transform .1s' }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(.99)')} onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
            onMouseEnter={(e) => { if (!busy) e.currentTarget.style.filter = 'brightness(1.06)'; }} onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}>
            {busy ? <><span className="fr-spin" style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%' }} /> Entrando…</> : <><Icon name="arrowRight" size={18} /> Entrar</>}
          </button>
        </form>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: '#9ca3af' }}>
          <span>© {new Date().getFullYear()} Fluxo Royale</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ fontWeight: 600, color: '#6b7280' }}>Contato</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, color: '#6b7280' }}>Português <Icon name="chevronDown" size={13} /></span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ---------- Module selector ----------
function ModuleSelector({ user, onEnter, onLogout }) {
  const [sel, setSel] = useStateAuth(null);
  // Fonte REAL: nome/cargo vêm de window.FRAuth.profile; o gate de módulos vem de
  // window.FRAuth.canAccessModule (mapa role->módulos, PROVISÓRIO). Módulos sem
  // acesso simplesmente NÃO aparecem (design mostrava apagados — ver relatório).
  const prof = (window.FRAuth && window.FRAuth.profile) || {};
  const dispName = prof.name || (user && user.name) || '';
  const rawRole = prof.role || (user && user.role) || '';
  const dispRole = (window.FRAccess && window.FRAccess.roleLabel) ? window.FRAccess.roleLabel(rawRole) : rawRole;
  const dispSector = prof.sector || (user && user.setor) || '';
  // Módulos mock/incompletos (`locked:true`) aparecem no seletor VISÍVEIS com cadeado, porém
  // NÃO são selecionáveis (allowed=false lá embaixo → card bloqueado "Em Desenvolvimento").
  // As rotas compartilhadas funcionais (Clientes e OPs, Meus Pedidos) seguem acessíveis pelos
  // módulos livres (Estoque, Produção). allowedCount conta só os que dá pra entrar.
  const visibleModules = MODULES.filter((m) => window.FRAuth.canAccessModule(m.id));
  const allowedCount = visibleModules.filter((m) => !m.locked).length;
  const first = dispName.split(' ')[0] || '';
  const { mobile } = useFRViewport();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: AUTH_INK }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: mobile ? '16px 20px' : '20px 40px', borderBottom: '1px solid #f0f0ef' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: mobile ? 36 : 42, height: mobile ? 36 : 42, display: 'grid', placeItems: 'center' }}><img src={window.__asset('assets/logo-royale.png')} alt="Fluxo Royale" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
          <div style={{ fontSize: 16, fontWeight: 850, letterSpacing: '-.01em' }}>Fluxo Royale</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 10 : 14 }}>
          <div style={{ textAlign: 'right', display: mobile ? 'none' : 'block' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{dispName}</div>
            <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{dispRole} · {dispSector}</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: AUTH_BRAND, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15 }}>{dispName[0] || '?'}</div>
          <button onClick={onLogout} title="Sair da conta" style={{ all: 'unset', cursor: 'pointer', width: 40, height: 40, borderRadius: 11, border: '1px solid #ececec', display: 'grid', placeItems: 'center', color: '#6b7280', transition: 'color .14s, border-color .14s, background .14s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.background = 'rgba(239,68,68,.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#ececec'; e.currentTarget.style.background = 'transparent'; }}>
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: mobile ? 'flex-start' : 'center', padding: mobile ? '28px 18px 40px' : '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 1080 }}>
          <div style={{ textAlign: 'center', marginBottom: 6, fontSize: 13, fontWeight: 700, color: AUTH_BRAND_D, letterSpacing: '.02em' }}>Olá, {first} 👋</div>
          <h1 style={{ margin: 0, textAlign: 'center', fontSize: mobile ? 24 : 30, fontWeight: 850, letterSpacing: '-.025em' }}>Selecione um módulo</h1>
          <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: mobile ? 13.5 : 14.5, color: '#6b7280' }}>
            Você tem acesso a <b style={{ color: AUTH_INK }}>{allowedCount}</b> de {MODULES.length} módulos.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(auto-fill, minmax(150px, 1fr))' : 'repeat(auto-fill, minmax(232px, 1fr))', gap: mobile ? 12 : 18, margin: mobile ? '26px 0 0' : '36px 0 0' }}>
            {visibleModules.map((m) => {
              const allowed = window.FRAuth.canAccessModule(m.id) && !m.locked; // módulo mock (locked) fica visível mas bloqueado
              const selected = sel === m.id;
              return (
                <button key={m.id} disabled={!allowed} onClick={() => allowed && setSel(m.id)}
                  onDoubleClick={() => allowed && onEnter(m)}
                  style={{ all: 'unset', boxSizing: 'border-box', cursor: allowed ? 'pointer' : 'not-allowed', position: 'relative', display: 'flex', flexDirection: 'column', gap: mobile ? 10 : 14, padding: mobile ? 16 : 22, borderRadius: mobile ? 16 : 20, minHeight: mobile ? 130 : 168,
                    background: allowed ? '#fff' : '#f7f7f6',
                    border: `2px solid ${selected ? m.accent : '#ededec'}`,
                    boxShadow: selected ? `0 14px 32px ${frHexToRgba(m.accent, 0.26)}` : (allowed ? '0 1px 2px rgba(0,0,0,.04)' : 'none'),
                    opacity: allowed ? 1 : 0.55, filter: allowed ? 'none' : 'grayscale(1)',
                    transform: selected ? 'translateY(-3px)' : 'none', transition: 'transform .16s, box-shadow .16s, border-color .16s' }}
                  onMouseEnter={(e) => { if (allowed && !selected) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 26px rgba(0,0,0,.1)'; e.currentTarget.style.borderColor = frHexToRgba(m.accent, 0.5); } }}
                  onMouseLeave={(e) => { if (allowed && !selected) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,.04)'; e.currentTarget.style.borderColor = '#ededec'; } }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ width: mobile ? 44 : 52, height: mobile ? 44 : 52, borderRadius: mobile ? 13 : 15, display: 'grid', placeItems: 'center', color: allowed ? '#fff' : '#9ca3af',
                      background: allowed ? `linear-gradient(140deg, ${m.accent}, ${frHexToRgba(m.accent, 0.7)})` : '#e7e7e6',
                      boxShadow: allowed ? `0 8px 18px ${frHexToRgba(m.accent, 0.32)}` : 'none' }}>
                      <Icon name={m.icon} size={mobile ? 22 : 26} stroke={2} />
                    </span>
                    {allowed
                      ? <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center', border: `2px solid ${selected ? m.accent : '#dcdcdb'}`, background: selected ? m.accent : 'transparent', color: '#fff', transition: 'all .15s' }}>{selected && <Icon name="check" size={14} stroke={3} />}</span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#9ca3af' }}><Icon name="lock" size={13} /> {mobile ? '' : (m.locked ? 'Em Desenvolvimento' : 'Sem acesso')}</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: mobile ? 15 : 17, fontWeight: 800, letterSpacing: '-.01em' }}>{m.name}</div>
                    <div style={{ fontSize: mobile ? 11.5 : 12.5, color: '#8a8f98', marginTop: 3 }}>{m.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: mobile ? 26 : 38 }}>
            <div style={{ fontSize: 13.5, color: '#6b7280', minHeight: 20, textAlign: 'center' }}>
              {sel ? <>Módulo selecionado: <b style={{ color: AUTH_INK }}>{MODULES.find((m) => m.id === sel).name}</b></> : 'Escolha um módulo para continuar'}
            </div>
            <button disabled={!sel} onClick={() => onEnter(MODULES.find((m) => m.id === sel))}
              style={{ all: 'unset', boxSizing: 'border-box', cursor: sel ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, height: 50, padding: '0 30px', width: mobile ? '100%' : 'auto', borderRadius: 13, fontSize: 15, fontWeight: 800,
                color: '#fff', background: sel ? AUTH_BRAND : '#cfd2d6', boxShadow: sel ? '0 10px 24px rgba(46,49,146,.36)' : 'none', transition: 'background .15s, box-shadow .15s' }}>
              Entrar <Icon name="arrowRight" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, ModuleSelector });
