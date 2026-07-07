// lib/access.js — GATE DE MÓDULOS (PROVISÓRIO) da camada de fundação.
//
// ⚠️ FONTE PROVISÓRIA E AUTORAL. O backend (branch 002-FR5.0) NÃO tem conceito
// de "módulo" — só `page_keys` de Estoque. Então, enquanto não existe o painel
// de permissões do admin (grupos/cargos/módulos), o acesso aos módulos é
// resolvido por este mapa role -> módulos, mantido AQUI e em nenhum outro lugar.
//
// SUBSTITUIÇÃO FUTURA: quando o backend expuser módulos por cargo/usuário, troca-se
// SÓ este arquivo (o mapa e/ou as funções). A assinatura consumida pelas telas
// (window.FRAuth.canAccessModule / window.FRAccess) NÃO muda. Não tocar nas telas.
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

// Mapa AUTORAL role(profiles.role) -> módulos visíveis.
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

/** true se a role enxerga o módulo. Role/entrada desconhecida -> false (fail-safe). */
export function roleCanAccessModule(role, moduleId) {
  const entry = ROLE_MODULES[normalizeRole(role)];
  if (entry === 'all') return true;
  return Array.isArray(entry) && entry.includes(moduleId);
}

// Exposição p/ testes/painel futuro (as telas usam window.FRAuth.canAccessModule).
if (typeof window !== 'undefined') {
  window.FRAccess = { ALL_MODULE_IDS, ROLE_MODULES, ROLE_LABELS, modulesForRole, roleCanAccessModule, roleLabel };
}
