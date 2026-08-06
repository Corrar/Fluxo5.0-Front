// data.jsx — modules + navigation model for the Fluxo Royale ERP sidebar.

// Each module carries its own accent hue (used in Variation C, ignored elsewhere).
const MODULES = [
  { id: 'estoque',  name: 'Estoque ERP',  subtitle: 'Controle de inventário', icon: 'box',     accent: '#2563eb', accentText: '#7aa2ff' },
  { id: 'producao', name: 'Produção 3D',  subtitle: 'Fila de impressão',       icon: 'printer', accent: '#6366f1', accentText: '#818cf8' },
  { id: 'rh',       name: 'RH',           subtitle: 'Pessoas & ponto',         icon: 'users',   accent: '#f59e0b', accentText: '#fbbf24', locked: true },
  { id: 'compras',  name: 'Compras',      subtitle: 'Cotações & pedidos',      icon: 'cart',    accent: '#ec4899', accentText: '#f472b6', locked: true },
  // DESTRAVADO (decisão do Bruno, 29/07/2026): administração de permissões é controle
  // exclusivo do Dev — o módulo precisa abrir pra tela viver aqui. Quem o ENXERGA segue
  // sendo o access.js (hoje só admin, via bypass 'all'); as abas mock (dev-*) continuam
  // cadeadas via FR_LOCKED_MODULE_PREFIXES — abrir o módulo NÃO abre os mocks.
  { id: 'dev',      name: 'Desenvolvedor', subtitle: 'Suporte & chamados',       icon: 'terminal', accent: '#0891b2', accentText: '#22d3ee' },
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
          { id: 'meuschamados', name: 'Meus Chamados' },
          { id: 'encomendar',   name: 'Encomendar 3D' },
        ],
      },
      { id: 'quadrogestao', name: 'Quadro Gestão', icon: 'barChart2' },
      { id: 'reposicoes',   name: 'Reposições',    icon: 'refresh' },
      { id: 'confronto',    name: 'Confronto',     icon: 'clipboard' },
    ],
  },
  {
    label: 'Gestão Admin',
    items: [
      { id: 'controlesaida', name: 'Controle de Saída', icon: 'briefcase', locked: true },
      { id: 'criticos',      name: 'Críticos',          icon: 'alert' },
      { id: 'relatorios',    name: 'Relatórios',        icon: 'barChart' },
      { id: 'clientes',      name: 'Clientes e OPs',    icon: 'users' },
      // AUDITORIA, PERMISSÕES E USUÁRIOS SAÍRAM DAQUI — fim do provisório. Administração do
      // sistema é território do módulo Dev (decisão do Bruno, 31/07/2026); as três moram no
      // NAV_DEV › Configurações. 'permissoes' foi na frente (29/07); 'auditoria' e 'usuarios'
      // fecham o movimento. As telas NÃO mudaram de lugar no código — são rotas sem prefixo
      // que o renderPage resolve pelo id, então quem chegar por link velho ou por
      // fr_active_page antigo continua abrindo normal. O que mudou foi só o MENU.
    ],
  },
];

// ⚠️ LÁPIDE (06/08/2026, dívida (f) fase 1) — `USER` NÃO É MAIS FONTE DE EXIBIÇÃO DE IDENTIDADE.
//
// Este objeto é MOCK. Ele era lido pelo rodapé da sidebar e mutado por `syncGlobalUser`
// (app.jsx) dentro de um useEffect — mutação não re-renderiza e o efeito roda depois do primeiro
// render, então num F5 dentro de um módulo o rodapé mostrava "Bruno / ADMIN" para QUALQUER
// usuário logado. Num terminal compartilhado, o operador confia no nome da tela e atribui a ação
// a quem está escrito. O rodapé agora usa `window.useFRIdentidade()` (sidebar.jsx), que é estado
// React assinado ao FRAuth.
//
// NÃO FOI REMOVIDO nesta fase por escopo, não por necessidade: sobraram três leituras, todas em
// telas MOCK de módulos com `locked: true` — compras.jsx (166, 716, 724) e rh.jsx (1286). O recon
// provou que nenhuma delas depende de MUTAÇÃO (leem no render ou no evento), então o objeto pode
// virar constante morta ou sumir junto com esses mocks, sem cerimônia.
//
// REGRA: nenhuma tela nova lê `USER`. Identidade exibida vem de `window.useFRIdentidade()` ou de
// `FRAuth.profile` direto — nunca de cópia global mutada.
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
      // Expansão 3D (migration 017): as duas abas de custo. O gate é na própria tela e exige a
      // page_key 'producao_3d' EXATA (P3TemProducao3D) — a chave que já existia no universo e
      // não gateava nada até a 017. Aparecer no NAV e negar na tela é de propósito: quem tem o
      // módulo enxerga que a aba existe e lê o motivo, em vez de o item sumir sem explicação.
      { id: 'p3d-valores',       name: 'Registro de Valores', icon: 'dollar' },
      { id: 'p3d-precificacao',  name: 'Precificação',        icon: 'barChart' },
      // PREPARAÇÃO DO PILOTO (31/07/2026): abrir chamado é caminho de TODO logado, e o
      // almoxarife (única role além do admin que enxerga este módulo) podia ficar preso aqui
      // sem porta pro helpdesk — a rota só existia no Estoque/Requisição, no NAV_DEV e no
      // NAV_PROD. Fecha o último buraco: agora o item está nos QUATRO módulos navegáveis.
      // Padrão do precedente 'pedidos': rota SEM PREFIXO, MESMO componente resolvido pelo
      // renderPage a partir do id, e SEM canAccess de propósito — POST /tickets e
      // GET /tickets/my são authenticate puro, sem page_key, e a lista já vem filtrada pelo
      // token. O NAV aqui é navegação, não permissão.
      //
      // 'pedidos' entra junto (31/07/2026): tinha EXATAMENTE o mesmo buraco — estava no
      // Estoque/Requisição, no NAV_DEV e no NAV_PROD, e faltava só aqui. Ficou de fora do
      // c128366 porque aquele commit era de chamados; a dívida foi anotada e agora fecha.
      // Mesma natureza de rota (sem prefixo, mesmo componente pelo renderPage).
      { id: 'pedidos',           name: 'Meus Pedidos',        icon: 'cart' },
      { id: 'meuschamados',      name: 'Meus Chamados',       icon: 'clipboard' },
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
      // SEM badge de contagem: o número teria que vir de um GET que o NAV não faz, e um badge
      // chumbado é a mentira mais barata de todas. A contagem real vive no painel e na fila.
      { id: 'dev-chamados',  name: 'Chamados', icon: 'file' },
      // Área Dev e Custos & Serviços (migration 019 + Fase 4): as duas últimas telas do módulo
      // deixaram de ser mock cadeado e ganharam banco. Gate nas próprias telas por
      // canAccess('dev_area') / canAccess('dev_custos').
      { id: 'dev-area',      name: 'Área Dev', icon: 'calendar' },
      { id: 'dev-custos',    name: 'Custos & Serviços', icon: 'wallet' },
      // dev-chat MORREU DE VEZ (decisão do Bruno, 01/08/2026): era mock cadeado sem backend
      // nenhum, e o helpdesk (Chamados + Meus Chamados) já cobre a conversa com o dev. Item,
      // mock e cadeado removidos inteiros — não há o que reativar.
      //
      // dev-projetos SEM PORTA DE MENU por decisão de NAV 01/08/2026 — a rota real e a
      // migration 013 continuam DORMENTES e intactas: /dev-projects responde, DevProjetos
      // segue montável pelo renderPage, e reativar é UMA LINHA (devolver o item aqui).
      // Não é remoção: é fechar a porta sem demolir o cômodo.
      //
      // dev-repos v1 (migration 018): espelho dos commits do GitHub + relatório por período.
      // Gate na própria tela por canAccess('dev_repos'), padrão das irmãs.
      { id: 'dev-repos',     name: 'Repositórios', icon: 'terminal' },
      // dev-agenda MORREU (decisão C do Bruno, 30/07/2026): zero dado futuro no universo do
      // Dev — agenda manual competia com o calendário pessoal e nasceria vazia. A faixa
      // temporal honesta (últimos 7 dias, em andamento) vive no dev-painel. Reabre SE
      // due_date em tickets nascer e pegar como disciplina (prazo primeiro, agenda depois).
      // O id NÃO entra em FR_LOCKED_PAGES — rota inexistente cai no fallback do boot
      // (padrão provado: descarta e vai pra home).
      { id: 'pedidos',       name: 'Meus Pedidos', icon: 'cart' },
      { id: 'meuschamados',  name: 'Meus Chamados', icon: 'clipboard' },
      {
        id: 'configuracoes', name: 'Configurações', icon: 'gear',
        // Casa definitiva (decisão do Bruno, 31/07/2026): administração do sistema —
        // Auditoria, Permissões, Usuários — é território do módulo Dev. Acesso fino continua
        // nas próprias telas (canAccess + 403 do backend); o NAV é navegação, não segurança.
        // 'permissoes' chegou primeiro (29/07); 'auditoria' e 'usuarios' vieram em 31/07 e
        // NÃO estão mais na Gestão Admin do Estoque — o movimento acabou, não há provisório.
        // Os quatro são rotas SEM PREFIXO: o renderPage resolve pelo id e devolve o MESMO
        // componente real, venha o clique de qual módulo vier.
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
      { id: 'prod-painel',  name: 'Painel', icon: 'barChart2' },
      { id: 'prod-montagem', name: 'Montagem de Máquinas', icon: 'settings' },
      { id: 'prod-armazem', name: 'Armazém', icon: 'box' },
      { id: 'prod-receb',   name: 'Recebimento', icon: 'download' },
      { id: 'prod-aponta',  name: 'Apontamentos', icon: 'clipboard' },
      { id: 'pedidos',      name: 'Meus Pedidos', icon: 'cart' },
      { id: 'meuschamados', name: 'Meus Chamados', icon: 'clipboard' },
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
  // 'reposicoes' SAIU: ligada a /replenishments (criar/editar/separar/enviar-parcial/reverter/
  //   cancelar) + rastreio via GET /tracking/:code. Lifecycle da tela = o do backend.
  // 'confronto' SAIU: ligada a /travel-orders (registrar saída = POST c/ X-Idempotency-Key +
  //   reserva; confronto = POST /:id/reconcile). 4 estágios do mock colapsados nos 2 do backend
  //   (pending/reconciled); origem e confronto-de-ajuste ficaram de fora (sem fonte/sem endpoint).
  'controlesaida',
  // 'painelti' MORREU DE VEZ (decisão do Bruno): o helpdesk vive no módulo Dev — a abertura
  //   de chamado é a tela compartilhada Meus Chamados ('meuschamados', em todos os módulos
  //   navegáveis) e o atendimento é o dev-chamados real. O id fica AQUI como rota morta:
  //   localStorage velho apontando 'painelti' vê o cadeado, nunca uma tela.
  'painelti',
  // Estoque — rotas-pai mock (não navegam pelo menu aberto, mas caem por busca / menu recolhido)
  'entradas', 'requisicao',
  // Produção — telas mock/incompletas (visíveis no menu com cadeado)
  // 'prod-painel' SAIU: OPs do GET /clients + KPIs do GET /op-materials/summary; os 5
  //   indicadores sem fonte (lead time, atrasadas, gráfico...) foram removidos da tela.
  // 'prod-montagem' SAIU: tela real desde a migration 016 (caminho B) — /assembly-machines com
  //   gate por canAccess('montagem') na própria tela, checklists dirty-save e a árvore do produto
  //   como PROJEÇÃO do razão (consumo etiquetado com machine_id na tela Apontamentos). O mock
  //   inteiro morreu junto com a ponte de browser FR_MAQUINAS/__frMaqQueue/'fr-maq-consumo'.
  // Config do módulo Dev (mock) — Dev é não-navegável, mas trava defensiva se a rota for atingida
  // 'auditoria' SAIU: ligada ao GET /admin/logs real (contrato v1 — envelope {logs,total,limit,
  //   offset}, filtros e paginação 100% server-side, formatador com fallback em audit_format.js,
  //   gate por page_key 'logs' na própria tela). KPIs/Exportar/pagina/sku cortados da v1.
  // 'permissoes' SAIU: ligada a GET/POST /admin/permissions/{roles,users} reais (matriz papel ×
  //   chaves + exceções por usuário, replace-all com confirm de logout forçado, gate por
  //   page_key 'permissoes' na própria tela). Mock setor/classes morreu inteiro; criar/remover
  //   papel e normalização da convenção mista ficaram FORA da v1 (decisão travada).
  // 'usuarios' SAIU: ligada a GET /users cheio + PUT /status (ação primária: suspender preserva
  //   histórico) + DELETE (409 → modal oferece suspender) + PUT /role (papéis reais de
  //   GET /admin/permissions/roles) + POST /auth/register + POST /reset-password, gate por
  //   page_key 'usuarios' na própria tela. Mock USUARIOS_SEED/CARGO_GROUPS/"Ver senha" morreu
  //   inteiro (senha em claro nunca existiu no backend — só hash bcrypt).
  // Rotas mortas (fora de qualquer menu) — link direto vê o cadeado, não a tela mock
  'tarefas', 'eletrica', 'avisos', 'calculadora',
]);

// Módulos inteiramente mock: ficam VISÍVEIS no seletor com cadeado (não-selecionáveis via
// `locked:true` no MODULE), mas as rotas prefixadas deles também são travadas por defesa —
// se qualquer id do módulo for atingido (localStorage velho etc.), cai no <EmDesenvolvimento>,
// nunca na tela mock. As rotas compartilhadas funcionais (clientes, pedidos) NÃO têm prefixo
// e por isso continuam livres (resolvem nos componentes reais do Estoque).
// EXCEÇÃO 'dev-': o MÓDULO Dev foi destravado (Permissões mora lá em definitivo), mas o
// prefixo FICA nesta lista — sobrou UMA aba mock do Dev, o chat, e ela segue no cadeado até o
// tempo real nascer. Destravar o módulo ≠ destravar mock. (chamados, projetos e painel saíram
// pelas exceções abaixo; a agenda MORREU — ver a lápide no NAV_DEV.)
const FR_LOCKED_MODULE_PREFIXES = ['rh-', 'cp-', 'dev-', 'at-', 'fin-'];

// EXCEÇÕES PONTUAIS ao cadeado de prefixo: rotas dev-* que ganharam tela REAL e saem do
// bloqueio uma a uma (o prefixo continua valendo pras irmãs mock). Hoje só a fila do
// helpdesk: 'dev-chamados' virou tela real (gate por canAccess('chamados') na própria tela).
// dev-projetos: tela real desde a migration 013 (gate por canAccess('projetos') na própria tela).
// dev-painel: tela real desde a migration 015 (gate por canAccess('dev_dashboard')). PRECISA da
// exceção mesmo sendo a rota DEFAULT do módulo: o renderPage (pages_admin.jsx) consulta o
// frIsLocked ANTES de despachar pro renderPageDev, então sem a exceção o padrão do módulo
// cairia no <EmDesenvolvimento> e o DevPainel real nunca montaria.
// dev-repos: tela real desde a migration 018 (gate por canAccess('dev_repos') na própria tela).
// dev-area e dev-custos: telas reais desde a migration 019 (gate por canAccess('dev_area') e
// canAccess('dev_custos') nas próprias telas).
// dev-projetos CONTINUA na lista mesmo tendo perdido o item de menu: a rota é DORMENTE, não
// morta — sem a exceção, quem chegasse por localStorage antigo ou busca cairia no cadeado em
// vez da tela real que existe e responde.
// 'dev-chat' NÃO está aqui e nunca mais estará: a feature foi removida inteira em 01/08.
const FR_LOCKED_PREFIX_EXCECOES = new Set(['dev-chamados', 'dev-projetos', 'dev-painel', 'dev-repos', 'dev-area', 'dev-custos']);
function frIsLocked(id) {
  if (!id) return false;
  if (FR_LOCKED_PREFIX_EXCECOES.has(id)) return false;
  if (FR_LOCKED_PAGES.has(id)) return true;
  return FR_LOCKED_MODULE_PREFIXES.some((p) => id.indexOf(p) === 0);
}

Object.assign(window, { MODULES, NAV, NAV_3D, NAV_DEV, NAV_PROD, NAV_RH, NAV_COMPRAS, NAV_AT, NAV_FIN, USER, USERS, userCanAccess, FR_LOCKED_PAGES, FR_LOCKED_MODULE_PREFIXES, frIsLocked });
