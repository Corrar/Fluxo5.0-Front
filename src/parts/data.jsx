// data.jsx — modules + navigation model for the Fluxo Royale ERP sidebar.

// Each module carries its own accent hue (used in Variation C, ignored elsewhere).
const MODULES = [
  { id: 'estoque',  name: 'Estoque ERP',  subtitle: 'Controle de inventário', icon: 'box',     accent: '#2563eb', accentText: '#7aa2ff' },
  { id: 'producao', name: 'Produção 3D',  subtitle: 'Fila de impressão',       icon: 'printer', accent: '#6366f1', accentText: '#818cf8' },
  { id: 'rh',       name: 'RH',           subtitle: 'Pessoas & ponto',         icon: 'users',   accent: '#f59e0b', accentText: '#fbbf24', locked: true },
  { id: 'compras',  name: 'Compras',      subtitle: 'Cotações & pedidos',      icon: 'cart',    accent: '#ec4899', accentText: '#f472b6', locked: true },
  { id: 'dev',      name: 'Desenvolvedor', subtitle: 'Suporte & chamados',       icon: 'terminal', accent: '#0891b2', accentText: '#22d3ee', locked: true },
  { id: 'producaoger', name: 'Produção', subtitle: 'Ordens de produção',       icon: 'zap',     accent: '#7c3aed', accentText: '#a78bfa' },
  { id: 'assistencia', name: 'Assistência Técnica', subtitle: 'OS & equipamentos',   icon: 'wrench',  accent: '#0d9488', accentText: '#2dd4bf', locked: true },
  { id: 'financeiro', name: 'Financeiro', subtitle: 'Contas & fluxo de caixa', icon: 'dollar', accent: '#16a34a', accentText: '#4ade80', locked: true },
];

// Navigation for the Estoque module — reorganized into sections (MAIN/FAV pattern,
// no FAV). One expandable item with nested children, like the Figma reference.
const NAV = [
  {
    label: 'Estoque',
    items: [
      {
        id: 'catalogo', name: 'Catálogo', icon: 'box',
        children: [
          { id: 'cat-produtos',     name: 'Produtos' },
          { id: 'cat-movimentacao', name: 'Movimentação' },
        ],
      },
      {
        id: 'entradas', name: 'Entradas', icon: 'entrar',
        children: [
          { id: 'ent-nfe',           name: 'Por NF-e' },
          { id: 'ent-reaproveitamento', name: 'Reaproveitamento' },
        ],
      },
      { id: 'saidas', name: 'Saídas',      icon: 'out' },
      { id: 'conferencia', name: 'Conferência de Envio', icon: 'barcode' },
    ],
  },
  {
    label: 'Operacional',
    items: [
      {
        id: 'requisicao', name: 'Requisição', icon: 'file',
        children: [
          { id: 'solicitacoes', name: 'Solicitações' },
          { id: 'pedidos',      name: 'Meus Pedidos' },
          { id: 'encomendar',   name: 'Encomendar 3D' },
        ],
      },
      { id: 'quadrogestao', name: 'Quadro Gestão', icon: 'barChart2' },
      { id: 'reposicoes',   name: 'Reposições',    icon: 'refresh',   locked: true },
      { id: 'confronto',    name: 'Confronto',     icon: 'clipboard', locked: true },
    ],
  },
  {
    label: 'Gestão Admin',
    items: [
      { id: 'controlesaida', name: 'Controle de Saída', icon: 'briefcase', locked: true },
      { id: 'criticos',      name: 'Críticos',          icon: 'alert' },
      { id: 'relatorios',    name: 'Relatórios',        icon: 'barChart' },
      { id: 'clientes',      name: 'Clientes e OPs',    icon: 'users' },
      { id: 'painelti',      name: 'Painel TI',         icon: 'terminal',  locked: true },
    ],
  },
];

const USER = { name: 'Bruno', role: 'ADMIN', setor: 'Diretoria', funcao: 'Administrador', email: 'bruno@fluxoroyale.com' };

// Demo accounts + per-credential module access. modules:'all' = full access.
const USERS = [
  { id: 'ADM001', email: 'admin@fluxoroyale.com',    senha: 'admin', name: 'Bruno Teixeira', role: 'Administrador',    setor: 'Diretoria',    funcao: 'Administrador',  modules: 'all' },
  { id: 'ALM010', email: 'almox@fluxoroyale.com',    senha: '123',   name: 'Marina Alves',   role: 'Almoxarife',       setor: 'Almoxarifado', funcao: 'Gestor Estoque', modules: ['estoque', 'compras', 'producaoger'] },
  { id: 'RH020',  email: 'rh@fluxoroyale.com',       senha: '123',   name: 'Patrícia Lima',  role: 'Analista de RH',   setor: 'RH',           funcao: 'Analista',       modules: ['rh', 'financeiro'] },
  { id: 'DEV030', email: 'dev@fluxoroyale.com',      senha: '123',   name: 'Igor Salles',    role: 'Desenvolvedor',    setor: 'TI',           funcao: 'Dev',            modules: ['dev', 'assistencia'] },
  { id: 'PRD040', email: 'producao@fluxoroyale.com', senha: '123',   name: 'Carlos Nunes',   role: 'Op. de Produção',  setor: 'Produção',     funcao: 'Operador',       modules: ['producaoger', 'producao', 'assistencia'] },
];
function userCanAccess(user, modId) { return !!user && (user.modules === 'all' || (user.modules || []).includes(modId)); }

// Navigation for the Produção 3D module — "Fábrica 3D".
const NAV_3D = [
  {
    label: 'Fábrica 3D',
    items: [
      { id: 'p3d-dashboard', name: 'Dashboard Operacional', icon: 'barChart2' },
      { id: 'p3d-producao',  name: 'Histórico de Produção', icon: 'printer' },
      { id: 'p3d-demandas',  name: 'Quadro de Demandas',    icon: 'kanban' },
      { id: 'p3d-catalogo',  name: 'Catálogo de Peças',     icon: 'box' },
    ],
  },
];

// Simple placeholder nav for modules not yet built.
const NAV_SOON = [{ label: 'Em breve', items: [{ id: 'soon', name: 'Em construção', icon: 'clock' }] }];

// Navigation for the Desenvolvedor module.
const NAV_DEV = [
  {
    label: 'Desenvolvimento',
    items: [
      { id: 'dev-painel',    name: 'Painel', icon: 'barChart2' },
      { id: 'dev-chamados',  name: 'Chamados', icon: 'file', badge: 3 },
      { id: 'dev-chat',      name: 'Chat', icon: 'bell' },
      { id: 'dev-projetos',  name: 'Projetos', icon: 'kanban' },
      { id: 'dev-agenda',    name: 'Agenda', icon: 'calendar' },
      { id: 'pedidos',       name: 'Meus Pedidos', icon: 'cart' },
      {
        id: 'configuracoes', name: 'Configurações', icon: 'gear',
        children: [
          { id: 'permissoes', name: 'Permissões' },
          { id: 'auditoria',  name: 'Auditoria' },
          { id: 'usuarios',   name: 'Usuários' },
          { id: 'clientes',   name: 'Clientes e OPs' },
        ],
      },
    ],
  },
];

// Navigation for the RH module.
const NAV_RH = [
  {
    label: 'RH',
    items: [
      { id: 'rh-painel', name: 'Painel', icon: 'barChart2' },
      { id: 'rh-colab',  name: 'Colaboradores', icon: 'users' },
      { id: 'rh-ponto',  name: 'Ponto & Frequência', icon: 'clock' },
      { id: 'rh-ferias', name: 'Férias & Ausências', icon: 'calendar' },
      { id: 'rh-advert', name: 'Advertências', icon: 'bell' },
      { id: 'rh-debitos', name: 'Débitos', icon: 'out' },
      { id: 'rh-folha',  name: 'Folha de Pagamento', icon: 'barChart' },
    ],
  },
];

// Navigation for the Produção (geral) module.
const NAV_COMPRAS = [
  {
    label: 'Compras',
    items: [
      { id: 'cp-painel',       name: 'Painel', icon: 'barChart2' },
      { id: 'cp-sc',           name: 'Solicitações', icon: 'file' },
      { id: 'cp-cotacoes',     name: 'Cotações', icon: 'clipboard' },
      { id: 'cp-pedidos',      name: 'Pedidos de Compra', icon: 'cart' },
      { id: 'cp-contratos',    name: 'Contratos', icon: 'file' },
      { id: 'cp-recebimento',  name: 'Recebimento', icon: 'entrar' },
      { id: 'cp-rastreio',     name: 'Rastreio', icon: 'search' },
      { id: 'cp-aprovacoes',   name: 'Aprovações', icon: 'check', badge: 3 },
      { id: 'cp-fornecedores', name: 'Fornecedores', icon: 'building' },
      { id: 'clientes',        name: 'Clientes e OPs', icon: 'users' },
    ],
  },
];
const NAV_PROD = [
  {
    label: 'Produção',
    items: [
      { id: 'prod-painel',  name: 'Painel', icon: 'barChart2', locked: true },
      { id: 'prod-montagem', name: 'Montagem de Máquinas', icon: 'settings', locked: true },
      { id: 'prod-armazem', name: 'Armazém', icon: 'box' },
      { id: 'prod-receb',   name: 'Recebimento', icon: 'download' },
      { id: 'prod-aponta',  name: 'Apontamentos', icon: 'clipboard' },
      { id: 'pedidos',      name: 'Meus Pedidos', icon: 'cart' },
      { id: 'clientes',     name: 'Clientes e OPs', icon: 'users' },
      { id: 'devolucaoop',  name: 'Devolução por OP', icon: 'exchange' },
    ],
  },
];

const NAV_AT = [
  {
    label: 'Field Service',
    items: [
      { id: 'at-painel',  name: 'Painel', icon: 'barChart2' },
      { id: 'at-os',      name: 'Atendimentos', icon: 'clipboard', badge: 4 },
      { id: 'at-agenda',  name: 'Agenda Técnica', icon: 'calendar' },
      { id: 'at-contratos', name: 'Contratos & SLA', icon: 'file' },
      { id: 'at-equip',   name: 'Equipamentos', icon: 'cpu' },
      { id: 'at-tecnicos', name: 'Técnicos', icon: 'users' },
      { id: 'clientes',   name: 'Clientes e OPs', icon: 'building' },
    ],
  },
];

const NAV_FIN = [
  {
    label: 'Financeiro',
    items: [
      { id: 'fin-painel',   name: 'Painel', icon: 'barChart2' },
      { id: 'fin-pagar',    name: 'Contas a Pagar', icon: 'arrowUp', badge: 3 },
      { id: 'fin-receber',  name: 'Contas a Receber', icon: 'arrowDown' },
      { id: 'fin-fluxo',    name: 'Fluxo de Caixa', icon: 'barChart' },
      { id: 'fin-bancos',   name: 'Bancos & Conciliação', icon: 'wallet' },
      { id: 'fin-dre',      name: 'DRE & Centro de Custo', icon: 'clipboard' },
      { id: 'clientes',     name: 'Clientes e OPs', icon: 'users' },
    ],
  },
];

MODULES[0].nav = NAV;
MODULES[1].nav = NAV_3D;
MODULES[2].nav = NAV_RH;
MODULES[3].nav = NAV_COMPRAS;
MODULES[4].nav = NAV_DEV;
MODULES[5].nav = NAV_PROD;
MODULES[6].nav = NAV_AT;
MODULES[7].nav = NAV_FIN;
MODULES[0].home = 'cat-produtos';
MODULES[1].home = 'p3d-dashboard';
MODULES[2].home = 'rh-painel';
MODULES[3].home = 'cp-painel';
MODULES[4].home = 'dev-painel';
MODULES[5].home = 'prod-painel';
MODULES[6].home = 'at-painel';
MODULES[7].home = 'fin-painel';

// CADEADO — rotas cujo conteúdo é mock/incompleto e NÃO deve renderizar (nem seed, nem rede).
// O roteador (renderPage, pages_admin.jsx) intercepta estas rotas ANTES de montar a página e
// devolve <EmDesenvolvimento/> no lugar. Fonte única da verdade do cadeado por-página/rota.
const FR_LOCKED_PAGES = new Set([
  // Estoque — telas mock/incompletas (ficam visíveis no menu com ícone de cadeado)
  // 'criticos' SAIU: ligada ao GET /products/low-stock (RBAC 'estoque_critico'), sem mock.
  // 'encomendar' SAIU: vitrine em GET /producao-3d/parts + envio real via POST /requests (split
  //   separar/produzir feito pelo backend). Trilhas por categoria removidas (sem fonte de dado).
  // 'relatorios' SAIU: ligada aos 5 endpoints de sistema (RBAC 'relatorios'). Só KPIs com lastro —
  //   giro, cobertura-em-dias e rupturas-no-trimestre ficaram de fora por falta de série histórica.
  'reposicoes', 'confronto', 'controlesaida', 'painelti',
  // Estoque — rotas-pai mock (não navegam pelo menu aberto, mas caem por busca / menu recolhido)
  'entradas', 'requisicao',
  // Produção — telas mock/incompletas (visíveis no menu com cadeado)
  'prod-painel', 'prod-montagem',
  // Config do módulo Dev (mock) — Dev é não-navegável, mas trava defensiva se a rota for atingida
  'usuarios', 'permissoes', 'auditoria',
  // Rotas mortas (fora de qualquer menu) — link direto vê o cadeado, não a tela mock
  'tarefas', 'eletrica', 'avisos', 'calculadora',
]);

// Módulos inteiramente mock: ficam VISÍVEIS no seletor com cadeado (não-selecionáveis via
// `locked:true` no MODULE), mas as rotas prefixadas deles também são travadas por defesa —
// se qualquer id do módulo for atingido (localStorage velho etc.), cai no <EmDesenvolvimento>,
// nunca na tela mock. As rotas compartilhadas funcionais (clientes, pedidos) NÃO têm prefixo
// e por isso continuam livres (resolvem nos componentes reais do Estoque).
const FR_LOCKED_MODULE_PREFIXES = ['rh-', 'cp-', 'dev-', 'at-', 'fin-'];
function frIsLocked(id) {
  if (!id) return false;
  if (FR_LOCKED_PAGES.has(id)) return true;
  return FR_LOCKED_MODULE_PREFIXES.some((p) => id.indexOf(p) === 0);
}

Object.assign(window, { MODULES, NAV, NAV_3D, NAV_DEV, NAV_PROD, NAV_RH, NAV_COMPRAS, NAV_AT, NAV_FIN, USER, USERS, userCanAccess, FR_LOCKED_PAGES, FR_LOCKED_MODULE_PREFIXES, frIsLocked });
