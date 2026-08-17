// lib/access.js — GATE DE MÓDULOS da camada de fundação.
//
// A SUBSTITUIÇÃO FUTURA prometida no cabeçalho antigo ACONTECEU AQUI (rodada módulos-por-
// classe): a fonte do gate agora é a família de chaves `modulo:<id>` em role_permissions,
// lida das PERMISSÕES EFETIVAS do usuário (role ∪ exceções, o array do login) — nenhuma
// migration, é page_key como as outras, configurada na tela Permissões (faixa "Acesso aos
// módulos"). Assinatura consumida pelas telas (window.FRAuth.canAccessModule) intacta.
//
// REGRA (canAccessModuleEfetivo):
//   • admin → tudo (bypass como sempre foi);
//   • QUALQUER chave modulo:* presente nas permissões efetivas liga o MODO ESTRITO:
//     módulo acende SÓ com a chave dele (fail-closed — sem chave, não acende);
//   • NENHUMA chave modulo:* → FALLBACK TRANSITÓRIO no mapa autoral ROLE_MODULES abaixo,
//     para ninguém perder acesso no deploy (transição sem apagão: a tela Permissões
//     pré-marca os chips pelo mapa e o admin confirma salvando — o papel ganha as chaves).
//
// ⚠️ REMOÇÃO PLANEJADA DO FALLBACK (e do mapa ROLE_MODULES): 30/09/2026, ou assim que os
// 15 papéis tiverem chaves modulo:* salvas — o que vier primeiro. Até lá o mapa é só rede
// de transição, não fonte.
//
// IDs de módulo = exatamente os de parts/data.jsx (MODULES[].id).

// Lista canônica dos módulos do design (ordem = MODULES em data.jsx).
export const ALL_MODULE_IDS = [
  'estoque',      // Estoque ERP
  'producao',     // Produção 3D
  'rh',           // RH
  'compras',      // Compras
  'dev',          // Desenvolvedor
  'producaoger',  // Produção (geral)
  'assistencia',  // Assistência Técnica
  'financeiro',   // Financeiro
];

// Família de chaves de módulo em role_permissions/user_permissions (sem migration —
// é page_key normal). 'modulo:estoque' presente = módulo Estoque acende no login.
export const MODULE_KEY_PREFIX = 'modulo:';
/** Ids de módulo presentes num array de permissões efetivas (['modulo:estoque',...] -> ['estoque']). */
export function moduleIdsFromPermissions(permissions) {
  return (Array.isArray(permissions) ? permissions : [])
    .filter((p) => typeof p === 'string' && p.indexOf(MODULE_KEY_PREFIX) === 0)
    .map((p) => p.slice(MODULE_KEY_PREFIX.length));
}

// Mapa AUTORAL role(profiles.role) -> módulos visíveis. HOJE É SÓ FALLBACK DE TRANSIÇÃO
// (ver cabeçalho — remoção planejada 30/09/2026); a fonte real é modulo:<id>.
// 'all' = bypass (todos os módulos). [] = nenhum módulo (oculto).
export const ROLE_MODULES = {
  // --- acesso total ---
  admin: 'all', // bypass — admin enxerga todos os módulos

  // --- Estoque (com fatia 3D no almoxarifado) ---
  almoxarife: ['estoque', 'producao'], // master do estoque + fila de impressão 3D
  chefe: ['estoque'],                  // PROVISÓRIO: consulta ampla, default até o painel de permissões
  setor: ['estoque'],
  usinagem_lider: ['estoque'],
  usinagem_operador: ['estoque'],

  // --- módulos com role dedicada (semântica clara) ---
  compras: ['compras'],
  financeiro: ['financeiro'],
  assistente_tecnico: ['assistencia'],

  // --- roles órfãs: acesso MÍNIMO ao Estoque (decisão do Bruno). O "só consulta"
  //     fino é resolvido pelas page_keys/canAccess, não por este gate de módulo. ---
  escritorio: ['estoque'],      // PROVISÓRIO: acesso mínimo até o painel de permissões
  gerente: ['estoque'],         // PROVISÓRIO: acesso mínimo até o painel de permissões
  desenvolvimento: ['estoque'], // PROVISÓRIO: acesso mínimo até o painel de permissões
  engenharia: ['estoque'],      // PROVISÓRIO: acesso mínimo até o painel de permissões
  prototipo: ['estoque'],       // PROVISÓRIO: acesso mínimo até o painel de permissões
  obras: ['estoque'],           // PROVISÓRIO: acesso mínimo até o painel de permissões

  // --- módulos sem NENHUMA role que os conceda hoje (chaves prontas p/ o futuro) ---
  // (nenhum usuário tem profiles.role = 'rh' | 'producaoger' na 002-FR5.0)
  rh: [],          // aguardando role/permissão de RH no backend
  producaoger: [], // aguardando role/permissão de Produção (geral) no backend — hoje só existe a 3D
};

// Rótulos de exibição por cargo — COSMÉTICO (não afeta nenhuma lógica de acesso).
// Fallback: role fora desta lista é exibida CRUA (não inventar cargo, não quebrar).
export const ROLE_LABELS = {
  admin: 'Administrador',
  almoxarife: 'Almoxarife',
  chefe: 'Chefia',
  setor: 'Operador',
  usinagem_lider: 'Líder de Usinagem',
  usinagem_operador: 'Operador de Usinagem',
  compras: 'Compras',
  financeiro: 'Financeiro',
  assistente_tecnico: 'Assistente Técnico',
  escritorio: 'Escritório',
  gerente: 'Gerente',
  desenvolvimento: 'Desenvolvimento',
  engenharia: 'Engenharia',
  prototipo: 'Protótipo',
  obras: 'Obras',
};

/** Rótulo legível do cargo. Role desconhecida -> o próprio valor (cru). */
export function roleLabel(role) {
  if (typeof role !== 'string') return '';
  return ROLE_LABELS[role.toLowerCase().trim()] || role;
}

function normalizeRole(role) {
  return typeof role === 'string' ? role.toLowerCase().trim() : '';
}

/** Módulos visíveis para uma role. Role desconhecida -> [] (fail-safe). */
export function modulesForRole(role) {
  const entry = ROLE_MODULES[normalizeRole(role)];
  if (entry === 'all') return ALL_MODULE_IDS.slice();
  return Array.isArray(entry) ? entry.slice() : [];
}

/** true se a role enxerga o módulo PELO MAPA DE FALLBACK. Role desconhecida -> false (fail-safe). */
export function roleCanAccessModule(role, moduleId) {
  const entry = ROLE_MODULES[normalizeRole(role)];
  if (entry === 'all') return true;
  return Array.isArray(entry) && entry.includes(moduleId);
}

/**
 * GATE REAL de módulo — a função que window.FRAuth.canAccessModule consome.
 * admin = tudo; qualquer modulo:* nas permissões efetivas = modo ESTRITO (fail-closed:
 * módulo só acende com a chave dele); zero modulo:* = fallback transitório no mapa.
 */
export function canAccessModuleEfetivo(role, permissions, moduleId) {
  if (normalizeRole(role) === 'admin') return true;
  const ids = moduleIdsFromPermissions(permissions);
  if (ids.length > 0) return ids.includes(moduleId);
  return roleCanAccessModule(role, moduleId); // TRANSIÇÃO SEM APAGÃO — remoção 30/09/2026
}

// Exposição p/ testes/painel (as telas usam window.FRAuth.canAccessModule; a tela de
// Permissões usa modulesForRole p/ pré-marcar chips na migração).
if (typeof window !== 'undefined') {
  window.FRAccess = { ALL_MODULE_IDS, MODULE_KEY_PREFIX, ROLE_MODULES, ROLE_LABELS, modulesForRole, roleCanAccessModule, canAccessModuleEfetivo, moduleIdsFromPermissions, roleLabel };
}
