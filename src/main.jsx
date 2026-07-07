// main.jsx — ponto de entrada do Fluxo Royale ERP.
//
// Arquitetura (herdada do protótipo): cada arquivo em ./parts/*.jsx define seus
// componentes e os expõe no `window` (ex.: `window.Icon`, `Object.assign(window,
// {Card, Btn, ...})`). Os demais arquivos referenciam esses símbolos como globais.
// Por isso a ORDEM dos imports abaixo importa e espelha o protótipo original:
// utilitários e dados primeiro, telas depois, e app.jsx por último (ele monta a raiz
// via ReactDOM.createRoot). Não reordene sem checar as dependências.
//
// globals.js precisa ser o 1º import — injeta window.React/window.ReactDOM antes
// dos parts (imports ESM são avaliados em ordem, cada um por completo).

import './globals.js';
import './image-slot.js';            // web component <image-slot>

// --- fundação de dados (Estratégia A2 · Etapa 0): API + Auth + Socket reais ---
// Camada de integração portada do Frontend-5.0-App, adaptada à arquitetura
// window-globals do design. NÃO altera nenhuma tela — só expõe os globais
// window.FRApi / window.FRAuth / window.FRSocket para as telas consumirem
// nas próximas etapas. Ordem: api -> auth -> socket (dependências em cadeia).
import './lib/api.js';               // window.FRApi + window.FRApiUtil (axios único)
import './lib/auth.js';              // window.FRAuth (login/logout/canAccess reais)
import './lib/socket.js';            // window.FRSocket (tempo real opcional; app roda sem ele)

// --- adaptadores + carregadores de dados reais (Etapa 2 · leva 1) ---
// Puros/sem UI. Precisam vir DEPOIS de api.js e ANTES das telas que os consomem.
import './lib/adapters.js';          // window.FRAdapters (productToCard, formatBRL, ...)
import './lib/products.js';          // window.useFRProducts() → GET /products adaptado

// --- núcleo compartilhado ---
import './parts/icons.jsx';          // window.Icon
import './parts/data.jsx';           // MODULES, NAV*, USERS, userCanAccess
import './parts/store.jsx';          // FRStore, useFRSolic, FRSolicActions
import './parts/ui.jsx';             // Card, Btn, Badge, KPI, uiTone, charts...
import './parts/sidebar.jsx';        // Sidebar, frTokens, frHexToRgba

// --- módulo Estoque ---
import './parts/pages_main.jsx';     // Catálogo, Dashboard, Produtos
import './parts/pages_admin.jsx';    // Entradas, Saídas, Usuários, Solicitações, roteador
import './parts/conferencia.jsx';    // Conferência de Envio (bipagem)
import './parts/pedidos.jsx';        // Meus Pedidos
import './parts/pages_clientes.jsx'; // Clientes e OPs
import './parts/pages_rest.jsx';     // Reposições, Confronto, Encomendar 3D...
import './parts/separacoes.jsx';     // Quadro de Gestão
import './parts/devolucao.jsx';      // Devolução por OP

// --- outros módulos ---
import './parts/producao3d.jsx';     // Produção 3D
import './parts/dev.jsx';            // Desenvolvedor (chat, chamados, projetos, agenda)
import './parts/producaoger.jsx';    // Produção (armazém, apontamento)
import './parts/montagem.jsx';       // Montagem de Máquinas
import './parts/recebimento.jsx';    // Recebimento (Produção)
import './parts/rh.jsx';             // RH
import './parts/compras.jsx';        // Compras
import './parts/assistencia.jsx';    // Assistência Técnica
import './parts/financeiro.jsx';     // Financeiro

// --- shell + bootstrap (monta a raiz) ---
import './parts/auth.jsx';           // LoginScreen, ModuleSelector
import './parts/erpframe.jsx';       // ERPFrame (sidebar + topbar + roteamento)
import './parts/app.jsx';            // App + ReactDOM.createRoot(...).render(<App/>)
