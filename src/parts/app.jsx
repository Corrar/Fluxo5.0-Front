// app.jsx — auth flow (login → module selector → ERP) wrapping the ERP shell.
const { useState: useStateApp, useEffect: useEffectApp } = React;

// Sessão do app governada pelo window.FRAuth REAL (token no localStorage).
// O mock 'fr_session_v1'/USERS NÃO decide mais a sessão (USERS só permanece em
// data.jsx para outras telas). Helpers: profile real -> objeto de usuário do design.
function frUserFromAuth() {
  const A = (typeof window !== 'undefined' && window.FRAuth) || {};
  const p = A.profile || {};
  const acc = A.user || {};
  return { id: acc.id, email: acc.email, name: p.name, role: p.role, setor: p.sector };
}
function syncGlobalUser(u) {
  Object.assign(USER, { name: u.name, role: u.role, setor: u.setor, funcao: u.funcao, email: u.email });
}

// Memória do MÓDULO ATIVO — chave PRÓPRIA e nova, separada do mock de sessão.
// Guarda só o id do módulo aberto para o F5 reabrir direto no ERPFrame.
// NÃO usa fr_session_v1 nem USERS. Limpa ao voltar ao seletor e no logout.
const FR_ACTIVE_MODULE_KEY = 'fr_active_module';
function saveActiveModule(id) { try { localStorage.setItem(FR_ACTIVE_MODULE_KEY, id); } catch (e) {} }
function clearActiveModule() { try { localStorage.removeItem(FR_ACTIVE_MODULE_KEY); } catch (e) {} }
// No boot logado: objeto do módulo salvo SE ainda for permitido (canAccessModule); senão null.
// Protege contra um módulo cujo acesso o usuário perdeu.
function bootActiveModule() {
  try {
    const id = localStorage.getItem(FR_ACTIVE_MODULE_KEY);
    if (!id) return null;
    const A = window.FRAuth;
    if (!A || typeof A.canAccessModule !== 'function' || !A.canAccessModule(id)) return null;
    const m = MODULES.find((x) => x.id === id);
    return (m && !m.locked) ? m : null;   // módulo mock cadeado não reabre no F5
  } catch (e) { return null; }
}

function IntroScreen({ onDone }) {
  const [fade, setFade] = useStateApp(false);
  const [isMobile, setIsMobile] = useStateApp(typeof window !== 'undefined' && window.innerWidth <= 640);
  const videoRef = React.useRef(null);
  const finish = React.useRef(false);
  const end = () => {
    if (finish.current) return; finish.current = true;
    setFade(true);
    setTimeout(() => onDone(), 620);
  };
  useEffectApp(() => {
    const v = videoRef.current;
    const tryPlay = () => { if (v && v.play) v.play().catch(() => {}); };
    tryPlay();
    // alguns navegadores móveis só liberam o autoplay após interação — força no primeiro toque
    const onFirst = () => { tryPlay(); };
    window.addEventListener('touchstart', onFirst, { once: true, passive: true });
    window.addEventListener('pointerdown', onFirst, { once: true });
    const onR = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onR);
    const safety = setTimeout(end, 7000); // garante a transição mesmo se o vídeo não disparar os eventos
    return () => { clearTimeout(safety); window.removeEventListener('resize', onR); window.removeEventListener('touchstart', onFirst); window.removeEventListener('pointerdown', onFirst); };
  }, []);
  const REVEAL = 5.6; // momento em que a marca "Fluxo Royale" termina de aparecer
  const onTime = () => { const v = videoRef.current; if (v && v.currentTime >= REVEAL) end(); };
  const src = window.__asset ? window.__asset('assets/intro-logo.mp4') : 'assets/intro-logo.mp4';
  return (
    <div onClick={() => { const v = videoRef.current; if (v && v.paused) v.play && v.play().catch(() => {}); }}
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: '#0a0e29', display: 'grid', placeItems: 'center', overflow: 'hidden',
      opacity: fade ? 0 : 1, transition: 'opacity .6s ease' }}>
      <video ref={videoRef} src={src} autoPlay muted playsInline webkit-playsinline="true" preload="auto" onEnded={end} onTimeUpdate={onTime}
        style={{ width: '100%', height: '100%', objectFit: isMobile ? 'cover' : 'contain' }} />
      <button onClick={end} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', bottom: 28, right: 30,
        display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', borderRadius: 999,
        fontSize: 13.5, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.18)' }}>
        Pular ›
      </button>
    </div>
  );
}

function App() {
  // screen: 'intro' | 'login' | 'selector' | 'erp'
  // Boot: a sessão vem do FRAuth real (token). Logado -> pula intro/login direto ao seletor.
  const bootAuthed = typeof window !== 'undefined' && !!(window.FRAuth && window.FRAuth.isAuthenticated);
  // F5 logado: se havia módulo aberto E ainda permitido, reabre direto nele; senão seletor.
  const bootMod = bootAuthed ? bootActiveModule() : null;
  const [screen, setScreen] = useStateApp(bootAuthed ? (bootMod ? 'erp' : 'selector') : 'intro');
  const [user, setUser] = useStateApp(bootAuthed ? frUserFromAuth() : null);
  const [startMod, setStartMod] = useStateApp(bootMod);

  // F5 logado: sincroniza o global USER (topbar/telas) a partir do profile real.
  useEffectApp(() => {
    if (bootAuthed) syncGlobalUser(frUserFromAuth());
  }, []);

  // Fim de sessão em qualquer ponto — logout explícito OU 401 do interceptor do FRApi
  // (dispara 'auth:unauthorized' -> FRAuth.logout) — devolve o app ao login.
  useEffectApp(() => {
    const A = window.FRAuth;
    if (!A || !A.subscribe) return;
    return A.subscribe((snap) => {
      if (!snap.isAuthenticated) { clearActiveModule(); setUser(null); setStartMod(null); setScreen('login'); }
    });
  }, []);

  const handleLogin = (u) => {
    clearActiveModule(); // login sempre cai no seletor -> nenhum módulo ativo pendente
    syncGlobalUser(u);
    setUser(u);
    setScreen('selector');
  };

  const handleEnter = (m) => { saveActiveModule(m.id); setStartMod(m); setScreen('erp'); };

  const goToSelector = () => { clearActiveModule(); setScreen('selector'); };

  const handleLogout = () => {
    clearActiveModule();
    if (window.FRAuth) window.FRAuth.logout(); // limpa o token real + dispara a assinatura acima
    setUser(null); setStartMod(null); setScreen('login');
  };

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {screen === 'intro' && <IntroScreen onDone={() => setScreen('login')} />}
      {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
      {screen === 'selector' && <ModuleSelector user={user} onEnter={handleEnter} onLogout={handleLogout} />}
      {screen === 'erp' && (
        <ERPFrame user={user} initialMod={startMod} allowedModules={MODULES.filter((m) => !m.locked && window.FRAuth.canAccessModule(m.id))}
          onLogout={handleLogout} onSwitchModule={goToSelector} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
