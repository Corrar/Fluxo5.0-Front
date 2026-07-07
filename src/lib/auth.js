// lib/auth.js — camada de autenticação real, exposta como GLOBAL window.FRAuth.
//
// PORTADO de Frontend-5.0-App/src/providers/AuthProvider.tsx, ADAPTADO à
// arquitetura window-globals do design: como aqui NÃO há um root React com
// providers aninhados, o auth vira um objeto global com estado próprio
// (localStorage + pub/sub) que as telas consultam/assinam. Ligado ao
// POST /auth/login REAL (descarta encrypted_password). Nada aqui renderiza UI.
//
// Contrato de POST /auth/login (docs/API_CONTRACT.md §1):
//   body { email, password } -> { token, user, profile{id,name,role,sector}, permissions[] }
//   ID sem "@" vira "id@fluxoroyale.local".
import { api, AUTH_KEYS, clearAuthStorage, getErrorMessage } from './api.js';
import { roleCanAccessModule } from './access.js';

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 min

function readJson(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---- estado do módulo ----
let _user = null;        // { id, email } | null   (encrypted_password NUNCA entra aqui)
let _profile = null;     // { id, name, role, sector } | null
let _permissions = [];   // string[]
let _loading = true;

// ---- pub/sub: as telas (Etapa 1+) assinam para re-renderizar quando o auth muda ----
const subs = new Set();
function snapshot() {
  return {
    user: _user,
    profile: _profile,
    permissions: _permissions.slice(),
    isAuthenticated: _user !== null,
    loading: _loading,
  };
}
function notify() {
  const snap = snapshot();
  subs.forEach((fn) => {
    try { fn(snap); } catch (e) { /* assinante não pode derrubar o auth */ }
  });
}

// ---- inatividade + heartbeat (INERTES até haver usuário logado) ----
let idleTimer = null;
let heartbeatId = null;
let heartbeatRunning = false;
let lastActivity = 0;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

function stopIdle() {
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
}
function resetIdle() {
  stopIdle();
  if (_user) idleTimer = setTimeout(() => logout(), INACTIVITY_LIMIT);
}
function onActivity() {
  const now = Date.now();
  if (now - lastActivity > 1000) { lastActivity = now; resetIdle(); }
}
function startActivityWatch() {
  ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity));
}
function stopActivityWatch() {
  ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
}

function stopHeartbeat() {
  if (heartbeatId) { clearInterval(heartbeatId); heartbeatId = null; }
}
function startHeartbeat() {
  stopHeartbeat();
  const send = async () => {
    if (heartbeatRunning || !_profile) return;
    heartbeatRunning = true;
    try {
      await api.put(`/users/${_profile.id}/heartbeat`, {}, { skipLoading: true });
    } catch (e) {
      // erro silencioso: heartbeat não deve incomodar o usuário
    } finally {
      heartbeatRunning = false;
    }
  };
  void send();
  heartbeatId = setInterval(() => void send(), 300000); // 5 min
}

function applyAuthedSideEffects() {
  if (_user) {
    resetIdle();
    startActivityWatch();
    startHeartbeat();
  } else {
    stopIdle();
    stopActivityWatch();
    stopHeartbeat();
  }
}

// ---- ações ----
async function login(idOuEmail, senha) {
  _loading = true;
  notify();
  try {
    const raw = String(idOuEmail || '').trim().toLowerCase();
    const email = raw.includes('@') ? raw : `${raw}@fluxoroyale.local`;

    const { data } = await api.post('/auth/login', { email, password: senha });

    // DESCARTA encrypted_password: guardamos só id/email do usuário.
    const safeUser = { id: data.user.id, email: data.user.email };
    const perms = data.permissions ?? [];

    localStorage.setItem(AUTH_KEYS.token, data.token);
    localStorage.setItem(AUTH_KEYS.user, JSON.stringify(safeUser));
    localStorage.setItem(AUTH_KEYS.profile, JSON.stringify(data.profile));
    localStorage.setItem(AUTH_KEYS.permissions, JSON.stringify(perms));

    _user = safeUser;
    _profile = data.profile;
    _permissions = perms;
    _loading = false;
    applyAuthedSideEffects();
    notify();
    return { error: null };
  } catch (err) {
    _loading = false;
    notify();
    return { error: { message: getErrorMessage(err) } };
  }
}

function logout() {
  clearAuthStorage();
  _user = null;
  _profile = null;
  _permissions = [];
  applyAuthedSideEffects();
  notify();
}

// RBAC de UI: admin = tudo; match exato OU por módulo (`chave:`).
function canAccess(pageKey) {
  if (_profile?.role === 'admin') return true;
  if (_permissions.includes(pageKey)) return true;
  return _permissions.some((p) => p.startsWith(`${pageKey}:`));
}

// Gate de MÓDULOS (seletor de módulos). FONTE PROVISÓRIA: mapa role->módulos
// AUTORAL em access.js. Será substituída por permissão efetiva do backend
// (painel de permissões do admin) SEM alterar esta assinatura. admin = tudo.
function canAccessModule(moduleId) {
  return roleCanAccessModule(_profile?.role, moduleId);
}

function hasRole(roles) {
  const r = _profile?.role?.toLowerCase().trim();
  if (!r) return false;
  return (roles || []).map((x) => String(x).toLowerCase().trim()).includes(r);
}

// admin || almoxarife — espelha a TRAVA DUPLA de cargo do backend (API_CONTRACT §2).
function computeIsMaster() {
  const r = _profile?.role?.toLowerCase().trim();
  return r === 'admin' || r === 'almoxarife';
}

function updatePermissions(perms) {
  _permissions = perms || [];
  localStorage.setItem(AUTH_KEYS.permissions, JSON.stringify(_permissions));
  notify();
}

function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

// ---- restaura sessão no load (F5). O token é reenviado pelo interceptor. ----
function restore() {
  const token = localStorage.getItem(AUTH_KEYS.token);
  const savedUser = readJson(AUTH_KEYS.user);
  const savedProfile = readJson(AUTH_KEYS.profile);
  const savedPerms = readJson(AUTH_KEYS.permissions);
  if (token && savedUser && savedProfile) {
    _user = savedUser;
    _profile = savedProfile;
    _permissions = savedPerms ?? [];
    applyAuthedSideEffects();
  }
  _loading = false;
  notify();
}

// 401 vindo do interceptor -> logout (só se havia sessão, evita loop).
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    if (_user) logout();
  });
}

// ---- objeto global consumível pelas telas ----
const FRAuth = {
  // estado (getters — sempre refletem o estado atual)
  get user() { return _user; },
  get profile() { return _profile; },
  get permissions() { return _permissions.slice(); },
  get isAuthenticated() { return _user !== null; },
  get isMaster() { return computeIsMaster(); },
  get loading() { return _loading; },
  // ações
  login,
  logout,
  canAccess,
  canAccessModule,
  hasRole,
  updatePermissions,
  // reatividade p/ as telas
  subscribe,
  getSnapshot: snapshot,
};

if (typeof window !== 'undefined') {
  window.FRAuth = FRAuth;
}

restore();

export { FRAuth };
