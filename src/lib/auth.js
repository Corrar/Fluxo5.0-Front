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
//   O login recebe CÓDIGO (1..999) e monta `NNN@fluxoroyale.local`. E-mail cru é REJEITADO —
//   ver o comentário em login(). O zero-padding acontece só ali.
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

// ===== COERÊNCIA DA SESSÃO GRAVADA — dívida (f), fase 4 / etapa 0 =====
//
// ⚠️ LEITURA DO PAYLOAD, NÃO AUTENTICAÇÃO. Não validamos assinatura nem confiamos no conteúdo:
// o SERVIDOR continua sendo a única autoridade sobre quem é quem (todo endpoint deriva o ator do
// token, e `authenticate` confere is_active a cada request). O que se faz aqui é COERÊNCIA LOCAL —
// perguntar "as quatro chaves gravadas neste navegador falam do mesmo usuário?". Um token forjado
// passaria nesta checagem e morreria no backend, como sempre morreu.
//
// POR QUE ISTO EXISTE: `login()` gravava as quatro chaves em quatro `setItem` separados. Um crash
// ou fechamento de aba no meio deixava token de um usuário com profile de outro — PERMANENTE,
// porque nada revisava depois. Medido em 06/08/2026 forjando o estado: o app bootava sem queixa,
// exibindo "Marina / almoxarife" com 2 módulos, AGINDO como admin, com o socket nas salas de admin
// e o GET /tickets/my devolvendo os chamados do outro. A causa raiz foi fechada na ordem dos
// writes (ver login()); esta checagem é a rede para o que já está gravado por aí.
function lerPayloadJwt(token) {
  try {
    const parte = String(token || '').split('.')[1];
    if (!parte) return null;
    let b64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';                       // base64url vem sem padding
    const bruto = atob(b64);
    // Percent-decoding para não corromper acento em nome/e-mail dentro do payload.
    const json = decodeURIComponent(bruto.split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

/** Retorna null se coerente; senão, o MOTIVO (string curta, para o console). */
function motivoDeIncoerencia(token, savedUser, savedProfile) {
  const p = lerPayloadJwt(token);
  if (!p || !p.id) return 'token ilegível ou sem id no payload';
  // exp vem em SEGUNDOS (padrão JWT), Date.now() em ms.
  if (p.exp && p.exp * 1000 <= Date.now()) return 'token expirado';
  if (savedUser.id !== p.id) return 'user_data é de outro usuário';
  if (savedProfile.id !== p.id) return 'user_profile é de outro usuário';
  return null;
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
async function login(codigo, senha) {
  // PORTA LATERAL FECHADA: antes, um input contendo '@' era usado como e-mail CRU. Isso deixava
  // entrar identidade que a própria tela nega — ela pede código de 3 dígitos, e um usuário criado
  // como joao@empresa.com logava digitando o e-mail inteiro. Agora só código numérico.
  // O padStart mora AQUI, no único ponto que monta a identidade: digitar 7 loga o 007.
  // Validação ANTES do _loading pra não deixar a UI em "Entrando…" num erro puramente local.
  const raw = String(codigo || '').trim();
  if (!/^\d{1,3}$/.test(raw) || parseInt(raw, 10) < 1) {
    return { error: { message: 'Informe o código de usuário: um número de 1 a 999 (ex.: 007).' } };
  }
  const email = `${String(parseInt(raw, 10)).padStart(3, '0')}@fluxoroyale.local`;

  _loading = true;
  notify();
  try {
    const { data } = await api.post('/auth/login', { email, password: senha });

    // DESCARTA encrypted_password: guardamos só id/email do usuário.
    const safeUser = { id: data.user.id, email: data.user.email };
    const perms = data.permissions ?? [];

    // A SESSÃO ANTERIOR MORRE ANTES DA NOVA NASCER — dívida (f), fase 3.
    //
    // Um login com socket vivo deixava o tempo real do usuário ANTERIOR de pé: o socket.js
    // detecta a troca de token e reconstrói sozinho, mas ele só é notificado DEPOIS que o estado
    // novo já está publicado. Derrubar aqui fecha a janela em que o token novo já está no
    // localStorage e o socket velho ainda está recebendo — janela curta, mas é exatamente onde a
    // divergência de sessão nasce.
    //
    // PELO GLOBAL, não por import: socket.js importa auth.js, e importar de volta criaria ciclo.
    // `window.FRSocket` é o idioma da casa e já existe quando um login acontece (main.jsx carrega
    // api -> auth -> socket antes de qualquer render). O optional-chaining cobre o caso de o
    // socket nunca ter subido — o app funciona sem tempo real, e isso não pode travar o login.
    try { window.FRSocket?.disconnect(); } catch (e) { /* socket é best-effort; nunca trava login */ }

    // ⚠️ O TOKEN É GRAVADO POR ÚLTIMO, E A ORDEM É A CORREÇÃO — não a estética.
    //
    // localStorage não tem transação: são quatro writes independentes. Com o token PRIMEIRO (como
    // era), um crash ou fechamento de aba no meio deixava token novo + profile velho, gravado e
    // PERMANENTE — sessão que exibe um usuário e age como outro. Com o token por ÚLTIMO ele vira
    // MARCADOR DE COMMIT: interrompeu antes, sobra storage sem token, que o app já trata como
    // deslogado. Troca estado inconsistente permanente por estado limpo recuperável.
    //
    // NÃO "ORGANIZE" ESTE BLOCO. Reordenar reintroduz a janela.
    localStorage.setItem(AUTH_KEYS.user, JSON.stringify(safeUser));
    localStorage.setItem(AUTH_KEYS.profile, JSON.stringify(data.profile));
    localStorage.setItem(AUTH_KEYS.permissions, JSON.stringify(perms));
    localStorage.setItem(AUTH_KEYS.token, data.token);   // ← commit da sessão

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
    // As três chaves estão presentes — mas presença não é correspondência. Ver o bloco de
    // coerência no topo do arquivo.
    const motivo = motivoDeIncoerencia(token, savedUser, savedProfile);
    if (motivo) {
      // SESSÃO INVÁLIDA, não "sessão substituída": não houve segundo login, houve storage
      // corrompido (ou token vencido). Limpa e segue deslogado — o app já sabe lidar com isso, e
      // é o caminho de MENOR alarde. Culpar um "outro usuário" aqui seria mentir sobre a causa.
      console.info(`Sessão gravada descartada (${motivo}). Faça login novamente.`);
      clearAuthStorage();
    } else {
      _user = savedUser;
      _profile = savedProfile;
      _permissions = savedPerms ?? [];
      applyAuthedSideEffects();
    }
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
