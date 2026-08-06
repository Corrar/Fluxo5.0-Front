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
// O TOKEN QUE ABRIU ESTE SOCKET — dívida (f), fase 3.
//
// INVARIANTE DESTE ARQUIVO: **um socket = um token**. Não existe socket que troque de identidade
// no meio da vida. É por isso que guardamos o token da conexão em vez de reler o localStorage a
// cada evento: assim dá para DETECTAR a troca e derrubar, em vez de descobrir tarde.
let socketToken = null;

const tokenAtual = () => { try { return localStorage.getItem(AUTH_KEYS.token) || null; } catch (e) { return null; } };
// Identidade CORRENTE, lida no momento do evento — nunca a capturada na closure do connect.
const idCorrente = () => (FRAuth.user && FRAuth.user.id) || null;
const roleCorrente = () => (FRAuth.profile && FRAuth.profile.role) || null;

// ===== RE-ARME APÓS A RECONEXÃO NATIVA ESGOTAR =====
//
// O DEFEITO (medido em 06/08/2026): `reconnectionAttempts: 5` com os defaults do socket.io-client
// 4.8.3 (`reconnectionDelay` 1s, `reconnectionDelayMax` 5s, jitter 0.5) esgota em ~17s de backend
// fora. Depois disso o Socket.IO desiste PARA SEMPRE daquela instância, e nada re-arma: o
// `FRAuth.subscribe` só chama `connect()` numa transição de autenticação, que não acontece numa
// sessão já logada. O operador segue trabalhando sem tempo real por tempo indefinido.
//
// POR QUE ISSO É O CASO COMUM, NÃO O EXÓTICO: o Render free-tier hiberna. Numa volta de cold start
// o servidor demora dezenas de segundos para aceitar conexão — mais do que os ~17s do orçamento.
// Ou seja, o cenário que mais acontece em produção é exatamente o que estoura as 5 tentativas.
//
// A ESCADA É LONGA DE PROPÓSITO: 30s, 1min, 2min, 5min e daí 5min fixo. NUNCA desiste. Curto
// demais martelaria um serviço hibernando (e são N abas por operador); desistir seria repetir o
// defeito com outro nome.
const REARME_ESCADA = [30000, 60000, 120000, 300000];   // e depois 5min fixo, para sempre
let rearmeTimer = null;
let rearmeDegrau = 0;
let ultimaTentativaMs = 0;   // quando o re-arme tentou pela última vez (ver JANELA_ANTI_DUPLO)
let semTempoReal = false;   // reconexão nativa esgotou -> a tela precisa dizer isso

function cancelarRearme() {
  if (rearmeTimer) { clearTimeout(rearmeTimer); rearmeTimer = null; }
  rearmeDegrau = 0;
}

function agendarRearme() {
  if (rearmeTimer) return;   // guarda de idempotência: UM timer pendente, nunca empilhado
  const espera = REARME_ESCADA[Math.min(rearmeDegrau, REARME_ESCADA.length - 1)];
  rearmeDegrau += 1;
  rearmeTimer = setTimeout(() => { rearmeTimer = null; tentarRearme(); }, espera);
}

/**
 * A tentativa em si. Passa pelas MESMAS travas do resto do arquivo:
 *
 * ⚠️ IDENTIDADE ANTES DE TUDO — dívida (f). Reconectar com token divergente é PIOR que não
 * reconectar: abriria um socket com a identidade errada, que é exatamente a classe que as quatro
 * fases fecharam. `FRAuth.validarSessao()` é o mesmo conferidor do interceptor; se ele derrubar a
 * sessão, o re-arme morre junto e não agenda de novo.
 */
function tentarRearme() {
  ultimaTentativaMs = Date.now();
  if (!FRAuth.isAuthenticated) { cancelarRearme(); return; }
  if (typeof FRAuth.validarSessao === 'function' && !FRAuth.validarSessao()) {
    cancelarRearme();   // sessão divergente/ausente: quem sai de cena não reconecta
    return;
  }
  // O socket morto ainda ocupa a variável, e `connect()` é no-op com o MESMO token — por isso o
  // descarte explícito antes. É troca de instância, não reconexão da antiga (que já desistiu).
  //
  // `manterSinal` = true: o descarte aqui é MEIO do re-arme, não fim do problema. Sem isso o
  // `semTempoReal` zerava a cada tentativa e a faixa piscava entre âmbar e vermelho a cada ciclo
  // — duas mensagens diferentes alternando enquanto nada mudou para o operador. Medido.
  disconnect(true);
  connect();
  // Não conectou de imediato? Reagenda no próximo degrau. O 'connect' cancela quando vier.
  if (!isConnected) agendarRearme();
}

// RE-ARME POR FOCO/VISIBILIDADE — registrado UMA VEZ, no módulo, nunca por conexão.
//
// Cobre o caso real: o operador sai da aba, volta, e quer o tempo real de volta AGORA, sem esperar
// o degrau. Registrar dentro de `connect()` acumularia um listener por reconexão — o defeito que a
// fase 3 fechou no socket e que aqui seria reintroduzido pela porta dos fundos.
//
// `visibilitychange` cobre troca de aba e de aplicativo; `focus` cobre voltar para a janela sem que
// a aba tenha ficado oculta.
//
// ⚠️ OS DOIS DISPARAM NA MESMA TRANSIÇÃO. Medido no smoke (Ctrl+9 real, não evento sintético): ao
// voltar para a aba saíram QUATRO notificações no mesmo instante, não duas — ou seja, duas
// tentativas. A guarda `isConnected` não segura a segunda porque `connect()` é assíncrono: quando o
// `focus` chega, o socket criado pelo `visibilitychange` ainda está em handshake. O resultado era a
// segunda tentativa DERRUBAR o socket que a primeira acabou de abrir, e abrir outro no lugar.
//
// Nada quebrava (uma instância só sobrevivia), mas era uma conexão desperdiçada e uma sessão órfã
// no servidor a cada volta de aba. A janela colapsa o par em UMA tentativa: dois eventos, uma
// transição, uma reconexão.
const JANELA_ANTI_DUPLO = 3000;
function aoVoltarParaFrente() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
  if (!semTempoReal || isConnected) return;      // só age quando há o que consertar
  if (!FRAuth.isAuthenticated) return;
  if (Date.now() - ultimaTentativaMs < JANELA_ANTI_DUPLO) return;   // o par já foi atendido
  cancelarRearme();                              // mata o timer longo: a tentativa é agora
  tentarRearme();
}
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', aoVoltarParaFrente);
  window.addEventListener('focus', aoVoltarParaFrente);
}

const subs = new Set();
function notify() {
  const snap = { socket, isConnected, semTempoReal };
  subs.forEach((fn) => {
    try { fn(snap); } catch (e) { /* assinante não pode derrubar o socket */ }
  });
}

function connect() {
  const user = FRAuth.user;
  const profile = FRAuth.profile;
  if (!user || !profile) return;

  const token = tokenAtual() || undefined;

  // ===== TROCA DE SESSÃO — dívida (f), fase 3 =====
  //
  // Aqui havia `if (socket) return;`, e era o defeito: o `FRAuth.subscribe` chama connect() a
  // cada login, mas com um socket vivo a chamada morria no early-return. Resultado medido: re-login
  // na MESMA aba mantinha o socket do usuário ANTERIOR, com o token anterior, nas salas anteriores
  // — HTTP de um usuário e tempo real de outro, sem sinal nenhum em tela.
  //
  // Agora o early-return é CONDICIONADO AO TOKEN: mesmo token segue no-op (nada de reconexão
  // gratuita a cada notify do FRAuth — o heartbeat e o updatePermissions também notificam);
  // token diferente derruba o antigo antes de abrir o novo.
  if (socket) {
    if (socketToken === token) return;   // mesma sessão: no-op, como antes
    disconnect();                        // sessão trocou: o socket velho não sobrevive a ela
  }

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
  socketToken = token ?? null;   // carimba a identidade desta conexão (ver invariante no topo)
  notify();

  // ⚠️ NO MANAGER (`s.io`), NÃO NO SOCKET. Conferido no código do socket.io-client 4.8.3
  // (`manager.js:368`): `reconnect_failed` é `emitReserved` do Manager. `s.on('reconnect_failed')`
  // NUNCA dispararia — é o tipo de gancho que parece instalado e não está.
  //
  // Aqui é o único ponto em que se sabe que a reconexão nativa DESISTIU. É o começo do re-arme.
  s.io.on('reconnect_failed', () => {
    semTempoReal = true;
    console.info('Tempo real perdido: a reconexão automática esgotou. Tentando de novo em segundo plano.');
    notify();          // a faixa da tela reage a isto
    agendarRearme();
  });

  s.on('connect', () => {
    isConnected = true;
    // Voltou: o re-arme perdeu a razão de existir e a escada zera (a próxima queda recomeça em 30s).
    semTempoReal = false;
    cancelarRearme();
    // Fallback legado: se o servidor não autenticou (anônimo), entra na sala pelo cargo.
    //
    // Lê a role CORRENTE, não a da closure: o handler roda de novo a cada reconexão nativa do
    // Socket.IO, e reler garante que as salas do fallback sejam as do cargo vigente. (Na prática
    // um cargo novo já força logout via role_permissions_updated, mas depender disso seria
    // depender de um evento chegar — a leitura direta não depende de nada.)
    const role = roleCorrente();
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
  //
  // OS TRÊS COMPARAM COM A IDENTIDADE CORRENTE, não com a capturada na closure do connect —
  // dívida (f), fase 3. Antes usavam `user.id`/`profile.role` do fechamento, e o efeito era o
  // oposto do pretendido: depois de uma troca de sessão, a suspensão do usuário CORRENTE não
  // derrubava nada (o socket ainda se achava o antigo), enquanto um evento do usuário ANTIGO
  // derrubaria a sessão de quem não tem nada a ver com ele.
  //
  // Com a invariante "um socket = um token" isto vira cinto e suspensório — mas é o cinto certo:
  // a decisão de derrubar sessão nunca deve depender de um valor capturado no passado.
  s.on('user_status_changed', (data) => {
    const meu = idCorrente();
    if (meu && data?.userId === meu && data?.is_active === false) {
      console.info('Sessão encerrada: conta suspensa pelo administrador.');
      FRAuth.logout();
    }
  });
  s.on('role_permissions_updated', (data) => {
    const meuCargo = roleCorrente();
    if (meuCargo && data?.role === meuCargo) {
      console.info('Permissões do cargo atualizadas. Refaça o login.');
      setTimeout(() => FRAuth.logout(), 3000);
    }
  });
  s.on('user_permissions_updated', (data) => {
    const meu = idCorrente();
    if (meu && data?.userId === meu) {
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

/**
 * @param {boolean} manterSinal - true só quando o descarte é PARTE de uma tentativa de re-arme:
 *   o problema continua de pé, então o sinal para a tela e o timer sobrevivem à troca de instância.
 *   Em qualquer outro caminho (logout, troca de sessão) o padrão `false` limpa tudo.
 */
function disconnect(manterSinal = false) {
  if (!socket) return;
  if (!manterSinal) {
    // Timer órfão reconectando depois do logout é bug novo — cancela ANTES de soltar a referência.
    cancelarRearme();
    semTempoReal = false;
  }
  // O listener de `reconnect_failed` mora no MANAGER, e `removeAllListeners()` do socket não o
  // alcança. Sem esta linha, um manager sobrevivente agendaria re-arme de uma sessão morta.
  try { socket.io.off('reconnect_failed'); } catch (e) { /* ignore */ }
  // removeAllListeners ANTES do disconnect: o objeto antigo não pode disparar mais nada depois
  // que soltamos a referência. `socket.disconnect()` já desliga a reconexão daquela instância,
  // mas um handler pendente entre o disconnect e o GC emitiria toast/ação de uma sessão morta —
  // e ação duplicada é o pior defeito possível num carteiro de tempo real.
  try { socket.removeAllListeners(); } catch (e) { /* ignore */ }
  try { socket.disconnect(); } catch (e) { /* ignore */ }
  socket = null;
  socketToken = null;
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
  /** true quando a reconexão NATIVA esgotou e só o re-arme longo está tentando. A tela usa isto
   *  para dizer a verdade: o HTTP funciona, o que parou foi o tempo real. */
  get semTempoReal() { return semTempoReal; },
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
