// lib/audit_format.js — formatador PURO do livro de auditoria (tela Auditoria v1).
//
// Mapa das 33 actions CONHECIDAS (22 do recon do banco de validação de 27/07 +
// UPDATE_ROLE_PERMISSIONS da tela de Permissões + SUSPEND_USER/REACTIVATE_USER/
// REDEFINIR_SENHA da tela de Usuários + as 7 *_CHAMADO do helpdesk v1) →
// { verbo, kind (cor do uiTone), icon (icons.jsx), alvo(details), frase(details) }.
//
// CONTRATO DE RESILIÊNCIA (inegociável): o backend emite actions que este mapa não conhece
// (e vai emitir mais no futuro — STOCK_ENTRY, CRIAR_PRODUTO...). Action fora
// do mapa ou payload fora do esperado NUNCA quebra a tela: o fallback devolve a action CRUA
// como verbo + details em JSON legível como frase. Campo ausente vira '—'.
//
// Puro/sem UI (mesma classe de adapters.js): precisa ser importado no main.jsx DEPOIS de
// api.js e ANTES das telas. Exposto em window.FRAuditFormat.

// UUIDs inteiros não cabem na linha — 8 chars identificam o registro pro olho humano.
const shortId = (v) => (v == null || v === '' ? '—' : String(v).slice(0, 8));

const ou = (v, alt = '—') => (v == null || v === '' ? alt : String(v));

// details -> "chave: valor · chave: valor" legível (base do fallback).
function legivel(details) {
  if (details == null) return '—';
  if (typeof details !== 'object') return String(details);
  try {
    const parts = Object.entries(details).map(
      ([k, v]) => `${k}: ${v != null && typeof v === 'object' ? JSON.stringify(v) : ou(v)}`,
    );
    return parts.length > 0 ? parts.join(' · ') : '—';
  } catch (_) {
    return '—';
  }
}

// Frase dos UPDATE_*_PERMISSIONS: o details NOVO traz o diff (added/removed, do endurecimento
// dos POSTs da matriz); logs HISTÓRICOS só têm count — o fallbackAntigo cobre esses.
function fraseDiffPermissoes(d, fallbackAntigo) {
  const tem = (a) => Array.isArray(a) && a.length > 0;
  if (tem(d.added) || tem(d.removed)) {
    const partes = [];
    if (tem(d.added)) partes.push(`concedeu ${d.added.join(', ')}`);
    if (tem(d.removed)) partes.push(`revogou ${d.removed.join(', ')}`);
    return partes.join(' e ');
  }
  if (Array.isArray(d.added) && Array.isArray(d.removed)) return 'salvo sem mudanças';
  return fallbackAntigo;
}

// Os 3 CONFRONTO_* compartilham o payload {id_viagem, id_produto, quantidade, tipo_confronto}.
const alvoViagem = (d) => `Viagem · ${shortId(d.id_viagem)}`;
const fraseConfronto = (rotulo) => (d) =>
  `${rotulo} de ${ou(d.quantidade)} un (${ou(d.tipo_confronto)}) · produto ${shortId(d.id_produto)}`;

export const AUDIT_ACTIONS = {
  // ── Sessão ──
  LOGIN: { verbo: 'Login', kind: 'gray', icon: 'lock',
    alvo: () => 'Sessão', frase: (d) => ou(d.message, 'Login realizado') },

  // ── Viagens / Confronto ──
  CRIAR_VIAGEM: { verbo: 'Criou', kind: 'green', icon: 'truck',
    alvo: (d) => `Viagem · ${ou(d.cidade, shortId(d.id_viagem))}`,
    frase: (d) => `Técnicos: ${Array.isArray(d.tecnicos) ? d.tecnicos.join(', ') : ou(d.tecnicos)}` },
  EDITAR_VIAGEM: { verbo: 'Editou', kind: 'blue', icon: 'truck',
    alvo: alvoViagem, frase: (d) => ou(d.edicoes, 'Dados da viagem alterados') },
  APAGAR_VIAGEM: { verbo: 'Excluiu', kind: 'red', icon: 'truck',
    alvo: alvoViagem, frase: (d) => `Status anterior: ${ou(d.status_anterior)}` },
  FINALIZAR_CONFRONTO_VIAGEM: { verbo: 'Finalizou', kind: 'green', icon: 'check',
    alvo: alvoViagem, frase: () => 'Confronto da viagem encerrado' },
  CONFRONTO_SAIDA: { verbo: 'Confrontou', kind: 'amber', icon: 'out',
    alvo: alvoViagem, frase: fraseConfronto('Saída') },
  CONFRONTO_ENTRADA: { verbo: 'Confrontou', kind: 'green', icon: 'entrar',
    alvo: alvoViagem, frase: fraseConfronto('Retorno') },
  CONFRONTO_ENTRADA_EXTRA: { verbo: 'Confrontou', kind: 'blue', icon: 'plus',
    alvo: alvoViagem, frase: fraseConfronto('Entrada extra') },

  // ── Solicitações ──
  CRIAR_SOLICITACAO: { verbo: 'Criou', kind: 'green', icon: 'cart',
    alvo: (d) => `Solicitação · ${shortId(d.id_solicitacao)}`,
    frase: (d) => `Setor ${ou(d.setor)} · ${ou(d.total_itens)} item(ns)` },
  ATUALIZAR_STATUS_SOLICITACAO: { verbo: 'Atualizou', kind: 'blue', icon: 'refresh',
    alvo: (d) => `Solicitação · ${shortId(d.id_solicitacao)}`,
    frase: (d) => `Novo status: ${ou(d.novo_status)}${d.motivo && d.motivo !== 'N/A' ? ` · Motivo: ${d.motivo}` : ''}` },
  TIMEOUT_REQUEST: { verbo: 'Expirou', kind: 'amber', icon: 'clock',
    alvo: (d) => `Solicitação · ${shortId(d.requestId)}`,
    frase: (d) => ou(d.reason, 'Expiração automática') },

  // ── Reposições ──
  CRIAR_REPOSICAO: { verbo: 'Criou', kind: 'green', icon: 'box',
    alvo: (d) => `Reposição · ${shortId(d.id_reposicao)}`,
    frase: (d) => `NF/Pedido: ${ou(d.nf_pedido)}` },
  EDITAR_REPOSICAO: { verbo: 'Editou', kind: 'blue', icon: 'pencil',
    alvo: (d) => `Reposição · ${shortId(d.id_reposicao)}`,
    frase: (d) => ou(d.edicoes, 'Dados atualizados') },
  AUTORIZAR_REPOSICAO: { verbo: 'Autorizou', kind: 'green', icon: 'check',
    alvo: (d) => `Reposição · ${shortId(d.id_reposicao)}`,
    frase: (d) => `${ou(d.acao)} · Rastreio: ${ou(d.codigo_rastreio, 'Não informado')}` },
  CANCELAR_REPOSICAO: { verbo: 'Cancelou', kind: 'red', icon: 'ban',
    alvo: (d) => `Reposição · ${shortId(d.id_reposicao)}`,
    frase: () => 'Reposição cancelada' },

  // ── Usuários / Permissões ──
  CREATE_USER: { verbo: 'Criou', kind: 'green', icon: 'userPlus',
    alvo: (d) => `Usuário · ${ou(d.name, shortId(d.target_user_id))}`,
    frase: (d) => `Cargo: ${ou(d.role)}` },
  DELETE_USER: { verbo: 'Excluiu', kind: 'red', icon: 'trash',
    alvo: (d) => `Usuário · ${ou(d.target_email, shortId(d.target_user_id))}`,
    frase: () => 'Usuário removido' },
  UPDATE_ROLE: { verbo: 'Alterou', kind: 'blue', icon: 'users',
    alvo: (d) => `Usuário · ${shortId(d.target_user_id)}`,
    frase: (d) => `Novo cargo: ${ou(d.new_role)}${d.new_sector ? ` · Setor: ${d.new_sector}` : ''}` },
  SUSPEND_USER: { verbo: 'Suspendeu', kind: 'red', icon: 'ban',
    alvo: (d) => `Usuário · ${shortId(d.target_user_id)}`,
    frase: () => 'Acesso bloqueado na hora (conta suspensa; sessões e socket derrubados)' },
  REACTIVATE_USER: { verbo: 'Reativou', kind: 'green', icon: 'check',
    alvo: (d) => `Usuário · ${shortId(d.target_user_id)}`,
    frase: () => 'Acesso restabelecido (a conta volta a logar com a senha atual)' },
  REDEFINIR_SENHA: { verbo: 'Redefiniu', kind: 'amber', icon: 'key',
    alvo: (d) => `Usuário · ${shortId(d.target_user_id)}`,
    frase: () => 'Senha trocada pelo administrador (a anterior deixou de valer)' },
  UPDATE_USER_PERMISSIONS: { verbo: 'Permissões', kind: 'blue', icon: 'key',
    alvo: (d) => `Usuário · ${shortId(d.user_target)}`,
    frase: (d) => fraseDiffPermissoes(d, `${ou(d.count, '0')} exceção(ões) de permissão`) },
  UPDATE_ROLE_PERMISSIONS: { verbo: 'Permissões', kind: 'blue', icon: 'key',
    alvo: (d) => `Cargo · ${ou(d.role_target)}`,
    frase: (d) => fraseDiffPermissoes(d, `${ou(d.count, '0')} permissão(ões) no conjunto`) },

  // ── Helpdesk (chamados) ──
  // Alvo padrão: "Chamado · TI-42" (display_no humano); transições carregam {de, para}.
  CRIAR_CHAMADO: { verbo: 'Abriu', kind: 'green', icon: 'file',
    alvo: (d) => `Chamado · TI-${ou(d.display_no)}`,
    frase: (d) => `Chamado aberto com prioridade ${ou(d.priority)}` },
  INICIAR_ANALISE_CHAMADO: { verbo: 'Assumiu', kind: 'blue', icon: 'eye',
    alvo: (d) => `Chamado · TI-${ou(d.display_no)}`,
    frase: (d) => `Análise iniciada (${ou(d.de)} → ${ou(d.para)})` },
  INICIAR_DEV_CHAMADO: { verbo: 'Desenvolvendo', kind: 'accent', icon: 'terminal',
    alvo: (d) => `Chamado · TI-${ou(d.display_no)}`,
    frase: (d) => `Desenvolvimento iniciado (${ou(d.de)} → ${ou(d.para)})` },
  CONCLUIR_CHAMADO: { verbo: 'Concluiu', kind: 'green', icon: 'check',
    alvo: (d) => `Chamado · TI-${ou(d.display_no)}`,
    frase: () => 'Chamado resolvido e encerrado (timeline bloqueada)' },
  CANCELAR_CHAMADO: { verbo: 'Cancelou', kind: 'red', icon: 'ban',
    alvo: (d) => `Chamado · TI-${ou(d.display_no)}`,
    frase: () => 'Cancelado pelo solicitante (só possível com o chamado ainda aberto)' },
  COMENTAR_CHAMADO: { verbo: 'Comentou', kind: 'gray', icon: 'send',
    alvo: (d) => `Chamado · TI-${ou(d.display_no)}`,
    frase: () => 'Novo comentário na timeline' },
  RECLASSIFICAR_CHAMADO: { verbo: 'Reclassificou', kind: 'amber', icon: 'refresh',
    alvo: (d) => `Chamado · TI-${ou(d.display_no)}`,
    frase: (d) => `Prioridade ${ou(d.de)} → ${ou(d.para)}` },

  // ── Sistema ──
  UPDATE_SETTING: { verbo: 'Configurou', kind: 'amber', icon: 'gear',
    alvo: (d) => `Config · ${ou(d.key)}`, frase: (d) => `Valor: ${ou(d.value)}` },

  // ── Produção 3D ──
  ANOTACAO_DEMANDA_3D: { verbo: 'Anotou', kind: 'blue', icon: 'pencil',
    alvo: (d) => `Demanda 3D · ${shortId(d.demand_id)}`, frase: () => 'Anotação atualizada' },
  CANCELAR_DEMANDA_3D: { verbo: 'Cancelou', kind: 'red', icon: 'x',
    alvo: (d) => `Demanda 3D · ${shortId(d.demand_id)}`,
    frase: (d) => `Status anterior: ${ou(d.status_anterior)}` },
};

/**
 * (action, details) -> { conhecida, verbo, kind, icon, alvo, frase }.
 * NUNCA lança: action desconhecida OU payload fora do esperado caem no fallback.
 */
export function formatAudit(action, details) {
  const d = details != null && typeof details === 'object' ? details : {};
  const def = AUDIT_ACTIONS[action];
  if (def) {
    try {
      return { conhecida: true, verbo: def.verbo, kind: def.kind, icon: def.icon, alvo: def.alvo(d), frase: def.frase(d) };
    } catch (_) {
      // payload não bateu com o esperado — cai no fallback abaixo, tela segue de pé
    }
  }
  return { conhecida: false, verbo: ou(action), kind: 'gray', icon: 'clipboard', alvo: 'Ação não mapeada', frase: legivel(details) };
}

// Exposição p/ a arquitetura window-globals (padrão do adapters.js).
if (typeof window !== 'undefined') {
  window.FRAuditFormat = { AUDIT_ACTIONS, formatAudit, legivel, shortId };
}
