// lib/socket.js — cliente Socket.IO em tempo real, exposto como GLOBAL window.FRSocket.
//
// PORTADO de Frontend-5.0-App/src/providers/SocketProvider.tsx, ADAPTADO à
// arquitetura window-globals: em vez de um provider React, é um objeto global
// que segue o estado do window.FRAuth (conecta ao logar, desconecta ao sair).
//
// REGRA DE OURO: o app funciona MESMO SEM socket. Toda a inicialização é
// best-effort e envolvida em try/catch — falha de socket nunca quebra a UI.
//
// URL = (VITE_API_URL).replace('/api','') ; token no handshake (auth.token).
import { io } from 'socket.io-client';
import { AUTH_KEYS } from './api.js';
import { FRAuth } from './auth.js';

function getSocketUrl() {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return base.replace('/api', '');
}

let socket = null;
let isConnected = false;

const subs = new Set();
function notify() {
  const snap = { socket, isConnected };
  subs.forEach((fn) => {
    try { fn(snap); } catch (e) { /* assinante não pode derrubar o socket */ }
  });
}

function connect() {
  const user = FRAuth.user;
  const profile = FRAuth.profile;
  if (!user || !profile) return;
  if (socket) return; // já conectado/conectando

  const token = localStorage.getItem(AUTH_KEYS.token) || undefined;

  let s;
  try {
    s = io(getSocketUrl(), {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      // Salas derivadas do TOKEN (produção). Local sem JWT_SECRET -> anônimo (usa join_room).
      auth: { token },
    });
  } catch (err) {
    // Nunca quebrar a UI por falta de socket — o app funciona sem tempo real.
    console.error('Falha ao iniciar o socket (seguindo sem tempo real):', err);
    return;
  }

  socket = s;
  notify();

  s.on('connect', () => {
    isConnected = true;
    // Fallback legado: se o servidor não autenticou (anônimo), entra na sala pelo cargo.
    const role = profile.role;
    if (role) {
      s.emit('join_room', role);
      if (role === 'admin') {
        s.emit('join_room', 'almoxarife');
        s.emit('join_room', 'compras');
      }
    }
    notify();
  });

  s.on('disconnect', () => {
    isConnected = false;
    notify();
  });

  s.on('connect_error', (err) => {
    console.warn('Socket connect_error (seguindo sem tempo real):', err?.message);
    isConnected = false;
    notify();
  });

  // --- Segurança em tempo real (nomes CORRETOS — nunca 'permissions_updated') ---
  s.on('user_status_changed', (data) => {
    if (data?.userId === user.id && data?.is_active === false) {
      console.info('Sessão encerrada: conta suspensa pelo administrador.');
      FRAuth.logout();
    }
  });
  s.on('role_permissions_updated', (data) => {
    if (profile.role && data?.role === profile.role) {
      console.info('Permissões do cargo atualizadas. Refaça o login.');
      setTimeout(() => FRAuth.logout(), 3000);
    }
  });
  s.on('user_permissions_updated', (data) => {
    if (data?.userId === user.id) {
      console.info('Suas permissões foram atualizadas. Refaça o login.');
      setTimeout(() => FRAuth.logout(), 3000);
    }
  });

  // --- Helpdesk (cortesia, não garantia): o backend emite ticket_updated pra sala do
  // requester (e pra 'admin' quando o requester comenta). Aqui só REPASSA como evento de
  // janela — SEM toast global: quem estiver com Meus Chamados/fila montada recarrega;
  // quem não estiver, refaz o GET quando abrir a tela (o dado autoritativo é sempre o GET).
  s.on('ticket_updated', (data) => {
    try { window.dispatchEvent(new CustomEvent('fr:ticket_updated', { detail: data })); } catch (e) { /* ignora */ }
  });

  // Chamado NOVO (31/07/2026): o backend emite 'ticket_created' pra sala 'admin' — quem
  // escuta é a FILA do atendente, não o dono. Repasse no MESMO padrão do ticket_updated:
  // evento de janela, SEM toast global. Quem estiver com a fila montada recarrega; quem não
  // estiver refaz o GET ao abrir a tela (o dado autoritativo continua sendo o GET).
  // Evento SEPARADO de propósito — se caísse em 'fr:ticket_updated', a tela Meus Chamados do
  // dono recarregaria a cada chamado aberto por qualquer pessoa da empresa.
  s.on('ticket_created', (data) => {
    try { window.dispatchEvent(new CustomEvent('fr:ticket_created', { detail: data })); } catch (e) { /* ignora */ }
  });
}

function disconnect() {
  if (!socket) return;
  try { socket.disconnect(); } catch (e) { /* ignore */ }
  socket = null;
  isConnected = false;
  notify();
}

// Liga o ciclo de vida do socket ao estado de auth.
FRAuth.subscribe((s) => {
  if (s.isAuthenticated) connect();
  else disconnect();
});

// Caso a sessão já esteja restaurada no load (F5), conecta agora.
if (FRAuth.isAuthenticated) connect();

const FRSocket = {
  get socket() { return socket; },
  get isConnected() { return isConnected; },
  connect,
  disconnect,
  subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
};

if (typeof window !== 'undefined') {
  window.FRSocket = FRSocket;
}

export { FRSocket };
