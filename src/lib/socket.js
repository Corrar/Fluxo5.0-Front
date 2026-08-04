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
    // TOAST (3c): o repasse acima continua intacto — as telas montadas seguem recarregando.
    // O aviso é uma CAMADA A MAIS, e só para quem não agiu.
    toastDeTicket(data, 'updated');
  });

  // Chamado NOVO (31/07/2026): o backend emite 'ticket_created' pra sala 'admin' — quem
  // escuta é a FILA do atendente, não o dono. Repasse no MESMO padrão do ticket_updated:
  // evento de janela, SEM toast global. Quem estiver com a fila montada recarrega; quem não
  // estiver refaz o GET ao abrir a tela (o dado autoritativo continua sendo o GET).
  // Evento SEPARADO de propósito — se caísse em 'fr:ticket_updated', a tela Meus Chamados do
  // dono recarregaria a cada chamado aberto por qualquer pessoa da empresa.
  s.on('ticket_created', (data) => {
    try { window.dispatchEvent(new CustomEvent('fr:ticket_created', { detail: data })); } catch (e) { /* ignora */ }
    toastDeTicket(data, 'created');
  });
}

// ── TOAST DE CHAMADO (fase 3c) ──────────────────────────────────────────────────────────────
// Dois gatilhos plugados no carteiro que já existia. NADA de socket novo: são os MESMOS
// eventos, com uma camada de aviso por cima do repasse que já acontecia.
//
// REGRA CENTRAL — O ATOR NÃO SE NOTIFICA. Os dois casos abaixo são reais e é para eles que
// esta fase existe:
//   • o dono comenta no próprio chamado → o backend emite para `user:${requesterId}`, que é
//     ele mesmo; sem o corte, ele veria um toast do que acabou de escrever;
//   • um admin abre o próprio chamado → 'ticket_created' vai para a sala 'admin', da qual ele
//     faz parte; sem o corte, veria o aviso da própria criação.
//
// FALHA FECHADA: sem `actor_id` no payload (evento antigo em voo, ou front novo contra backend
// velho num deploy fora de ordem) NÃO emite. Preferimos perder um aviso a notificar o ator —
// o repasse acima já garante que a tela montada se atualize de qualquer jeito.
//
// SEM DEDUPE EXPLÍCITO: cada emissão do servidor chega uma vez por conexão, e o toast é
// consequência do EVENTO, não de estado. F5 não ressuscita nada — a fila do FrNotifHost nasce
// vazia a cada carga, e um evento já entregue não é reenviado pelo socket.
function toastDeTicket(data, tipo) {
  try {
    const meuId = (window.FRAuth && window.FRAuth.user && window.FRAuth.user.id) || null;
    const ator = data && data.actor_id;
    if (!meuId || !ator) return;      // falha fechada
    if (ator === meuId) return;       // o ator não se notifica
    if (typeof window.frNotify !== 'function') return;

    const n = data.display_no != null ? `TI-${data.display_no}` : 'Chamado';
    if (tipo === 'created') {
      // Só chega a quem está na sala 'admin' — a fila do atendente.
      window.frNotify({
        icon: 'file', tone: 'blue', titulo: 'Novo chamado na fila',
        txt: `${n}${data.title ? ' · ' + data.title : ''}${data.requester_name ? ' · ' + data.requester_name : ''}`,
      });
      return;
    }
    // 'updated' chega ao DONO do chamado (e à sala admin quando quem comentou foi o dono —
    // nesse caso o admin não é o ator, então recebe corretamente).
    const porEvento = {
      comentario: ['bell', 'blue', 'Resposta no seu chamado'],
      status: ['refresh', 'amber', 'Seu chamado mudou de status'],
      prioridade: ['alert', 'amber', 'Prioridade do seu chamado mudou'],
    };
    const [icon, tone, titulo] = porEvento[data.event] || ['bell', 'blue', 'Atualização no seu chamado'];
    window.frNotify({ icon, tone, titulo, txt: n });
  } catch (e) { /* aviso é cortesia: nunca derruba o socket */ }
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
