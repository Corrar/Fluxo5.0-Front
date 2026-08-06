# Relatório da missão — redesign do Fluxo Royale 5.0

Consolidado em 06/08/2026. Cobre de `4545586` (front, 31/07) e `7116d03` (backend, 03/08) até
`a387c17` (front) / `de0abc0` (backend).

Este arquivo é o registro durável da missão: o que ela virou, o que subiu, o que foi recusado, o
que ficou devendo e o que ainda não foi provado. As dívidas com detalhe técnico continuam em
`DIVIDAS.md` (front) e `Backend-Fluxo2.0/DIVIDAS.md` — aqui ficam o índice, a prioridade e o que
cada uma bloqueia.

---

## 1. Escopo

**No início:** aplicar o visual do handoff (`design-export-9`) sobre o front existente. Redesign,
nada mais.

**No que virou:** redesign **+ três features reais** (Área Dev, Custos & Serviços, Relatórios BI)
**+ toasts de chamado** **+ endurecimento** (cadastro por código, impressão que não falha calada,
etiqueta que não sobrepõe, cancelamento de solicitação que cancela de verdade).

A diferença entre as duas frases é a régua mestra, e ela é a razão de o escopo ter crescido:

> **Só design. Zero dados do design, zero lógica do design. Nenhum seed em tela real.
> Número sem fonte SAI. Botão sem função não entra.**

Aplicar a régua transformou "vestir a tela" em "descobrir o que a tela estava fingindo". Cada
número inventado que saiu abriu a pergunta *"e qual é a fonte real disto?"* — e três vezes a
resposta foi uma feature que precisava nascer. As outras vezes a resposta foi "não existe fonte",
e o item foi descartado com o motivo escrito (§5).

Corolário que apareceu no caminho e virou régua própria: **tela que mente é pior que tela
inacabada**. Um vazio honesto ("sem entradas no período") é informação; um placeholder com cara
de dado é um erro que o usuário atribui a si mesmo.

---

## 2. Fases e commits

### Backend — `Corrar/Fluxo5.0-Backend`

| SHA | Data | Assunto |
|---|---|---|
| `7116d03` | 03/08 | Área Dev e Custos & Serviços — migration 019, `/dev-area` e `/dev-costs`, total mensal server-side, smoke 56/56 |
| `cca9e98` | 03/08 | `GET /reports/bi` — 5 blocos numa janela, agregação server-side |
| `31b9443` | 04/08 | `actor_id` nos eventos de chamado (corte por ator no toast) |
| `4b4483b` | 05/08 | `register` só aceita `NNN@fluxoroyale.local`, três dígitos, 001–999 |
| `7b6298d` | 06/08 | Libera reserva ao cancelar solicitação **conferida** (+ comentário falso da rota corrigido) |
| `22c636e` | 06/08 | Dívida registrada: `DELETE /requests/:id` devolve 500 em estado bloqueado |
| `9363d2a` | 06/08 | **Fecha a (l)**: fallback do CORS passa a listar o front real; domínios do 2.0 saem |
| `de0abc0` | 06/08 | **(f) fase 2**: `POST /requests` deriva o setor do token em vez de aceitá-lo do corpo |

### Front — `Corrar/Fluxo5.0-Front`

| SHA | Data | Assunto |
|---|---|---|
| `4545586` | 31/07 | **f1** — fundação responsiva + shell: CSS global, 6 ícones, NotifMenu, FrNotifToast/FrNetBanner com estado real |
| `13b28ad` | 31/07 | **2b** — catálogo: hero responsivo com KPIs reais, card mobile, FAB e folha de criação |
| `9129dad` | 31/07 | **2c** — entradas em duas colunas, cartões de solicitação com faixa de status, gaveta compartilhada |
| `6f08406` | 03/08 | **2d** — TripDetail e SaidaModal como folha inferior no mobile, arrasto com limiar, safe-area |
| `b2e2bb8` | 03/08 | **2e** — conferência responsiva, folha de bipagem mobile, contrato de hardware intacto por contagem |
| `d67d8e8` | 03/08 | **2f** — painel e fila do Dev: 70% do design descartado pela régua, DvBars recusado por defeito provado |
| `95ef01a` | 03/08 | Área Dev e Custos & Serviços no front + NAV_DEV final |
| `1b35c63` | 03/08 | Painel BI com fonte real e filtro de período; `RL_DATA` removido inteiro |
| `f8c8c2d` | 04/08 | Toasts de chamado com corte por ator |
| `2133710` | 04/08 | Remove seed `FR_NOTIFS` do sino |
| `e0305ff` | 04/08 | docs: dívida (i) |
| `2931cbc` | 04/08 | Remove seletor de idioma inerte do rodapé de login |
| `7210188` | 05/08 | Popover de contato no rodapé do login |
| `a8172df` | 05/08 | docs: dívida (j) |
| `3fc809b` | 05/08 | Erro de impressão deixa de ser silencioso |
| `379a17e` | 05/08 | docs: dívidas (k) e (l) |
| `8d753cd` | 05/08 | Etiqueta: nome longo quebra em 3 linhas em vez de sobrepor |
| `28a5c9a` | 05/08 | docs: dívida (m) + levantamento da trava de push |
| `6ae1554` | 05/08 | Cadastro por **código** de acesso e login sem porta lateral |
| `822ee41` | 05/08 | docs: (o) vira fato medido; régua do smoke com login |
| `d8e22c6` | 06/08 | Liga o cancelamento de solicitação com confirmação e toast |
| `d1e2a1b` | 06/08 | Este relatório |
| `327bb6d` | 06/08 | Seletor de OP lê do banco (`useFRClients`) e esconde as concluídas; `OPS_FALLBACK` morto |
| `706d8fe` | 06/08 | docs: 390 com diagnóstico preciso, (l) fechada, régua do marcador único |
| `efb8273` | 06/08 | **(f) fase 1**: rodapé lê da sessão, não do mock global (`useFRIdentidade`) |
| `9646900` | 06/08 | **(f) fase 2**: Meus Pedidos para de enviar `sector` no corpo |
| `2430ac6` | 06/08 | **(f) fase 3**: a sessão nova não herda o socket da antiga |
| `aaad1ba` | 06/08 | **(f) fase 4/etapa 0**: coerência no `restore()`; token vira marcador de commit |
| `a387c17` | 06/08 | **(f) fase 4/etapa 1**: detector de divergência — a ação errada não parte |
| `1cd54ca` | 06/08 | **Re-arme do socket**: backoff que nunca desiste, volta do foco, e a faixa passa a distinguir "sem tempo real" de "sem conexão" |

---

## 3. O que está no ar

| | SHA | Onde |
|---|---|---|
| Backend | `de0abc0` | `https://fluxo5-0-backend.onrender.com` — Render |
| Front | `1cd54ca` | `https://fluxo-royale50.vercel.app` — Vercel, projeto `fluxo-royale5.0` |
| Banco | — | Neon, branch **`ep-summer-wave`** (validação) |

O SHA do front aponta para o **último commit que muda o bundle**. Commits só de documentação (como
este) vão junto no mesmo push e viram o `HEAD`, mas não alteram uma linha do que é servido — por
isso não substituem o SHA da tabela.

**Nada pendente.** Os dois repositórios estão em `main`, limpos, com `origin/main` igual ao local.

Cuidados que já custaram tempo e precisam ficar escritos:

- **O domínio do front é `fluxo-royale50.vercel.app`.** `fluxo-royale.vercel.app` é OUTRO
  aplicativo (`Frontend-5.0-App`) e já produziu falso negativo de deploy. Ver dívida (l).
- **Confirmação de deploy é por CONTEÚDO.** O nome do bundle que a Vercel gera **não** bate com o
  do build local para o mesmo commit, e a CDN responde `HIT` mesmo com cache-buster. A prova é o
  par: string nova presente + string velha ausente, com marcadores **exclusivos** do trecho
  alterado (§8, régua 2).
- **Produção é outro banco** (`ep-mute-feather`). Tudo neste relatório foi medido contra
  validação. Conferir o host antes de qualquer SQL.

---

## 4. Features novas

| Feature | O que faz | Fonte do dado |
|---|---|---|
| **Área Dev** | Blocos de agenda, tarefas, notas e snippets do desenvolvedor | Tabelas da migration 019 via `/dev-area` |
| **Custos & Serviços** | Cadastro de serviços pagos com valor e total mensal | `dev_costs` via `/dev-costs`; total mensal calculado **no servidor** (fonte única) |
| **Relatórios BI** | 5 blocos com filtro de período: capital entrado/saído, reposições e solicitações por status, capital por setor, cobertura | `GET /reports/bi` — `stock_ledger` × preço, `requests`, `replenishments`; cobertura por `MIN()/MAX()` real |
| **Toasts de chamado** | Aviso em tela quando um chamado nasce ou muda, com corte por ator | Socket `ticket_created`/`ticket_updated` com `actor_id` (backend `31b9443`) |
| **Popover de contato** | Rodapé do login abre os contatos reais em vez de um `<span>` morto | Conteúdo estático, declarado como tal |
| **Cadastro por código** | Conta criada e login feitos por código numérico de 3 dígitos (001–999), não por e-mail digitado | `users.email` = `NNN@fluxoroyale.local`, montado em uma única função |
| **Cancelamento de solicitação** | Lixeira das Solicitações e "Cancelar pedido" do Meus Pedidos cancelam de verdade, com modal de confirmação, toast e sino | `PUT /requests/:id/status` → `rejeitado`; libera a reserva de estoque |

---

## 5. O que foi descartado, e por quê

Descarte com razão vale mais que feature entregue sem lastro. Cada item abaixo tem a premissa que
o reabriria.

| Descartado | Motivo | Reabre quando |
|---|---|---|
| **5 cards do BI** — acurácia de inventário, lead time, giro, taxa de ruptura, tempo de recebimento | **Não há instrumentação.** Não existe tabela de contagem física; nenhum ciclo solicitação→entrega fechado; 2 consumos no razão; nada grava stockout; não existe o par carimbo-de-entrada + carimbo-de-conferência | Houver a instrumentação. Voltam **sobre as mesmas queries** |
| **Sparklines e deltas** do BI | Exigem série e período anterior. O razão tem **5 dias distintos** de movimento | Houver profundidade de série |
| **`RL_DATA`** (Relatórios) | Três variantes cravadas no desenho com **40+ números inventados** (R$ 148.230 de capital, 97,4% de acurácia, giro 4,6×). Nenhum sobreviveu, nem como placeholder | Nunca — é dado falso, não feature |
| **`FR_NOTIFS`** (sino) | 4 avisos do handoff entravam como NÃO LIDOS no estado inicial: o sino nascia em 4 para todo usuário, em todo módulo, sem nenhum evento. O seed ainda se contradizia (OP 73001 com dois clientes diferentes) | Nunca |
| **Sync com Google Agenda** | No design era **simulado** — mexia só no estado da tela. Integração real tem OAuth, refresh, conflito dos dois lados e um modelo de "quem ganha" que ninguém decidiu | Virar missão própria |
| **Monitoramento vivo de uso** (CPU/RAM/tokens) | **Não há coletor** — nem agente nas máquinas, nem integração com billing. Sobrou `usage_note`, texto livre escrito por gente, honesto sobre ser anotação | Houver coletor |
| **Histórico mensal / delta do Custos** | `dev_costs` é a FOTO do que se paga hoje, sem competência. "Subiu 32% no mês" exige dois meses fechados; a tabela nasceu agora | Houver meses. Nasce tabela de competência |
| **Seletor de idioma** | Inerte no handoff (sem handler, sem estado, sem lista). i18n real é extrair ~1.222 strings + mensagens da API e manter sincronizado para sempre; a demanda é inexistente | Demanda real de cliente estrangeiro |
| **`DvBars`** (componente do handoff) | Recusado **por evidência**: série única e `NaN`/`Infinity` em semana zerada. `DpBarras7` mantido, com escala compartilhada | — |
| **~70% do DevPainel do desenho** | Régua "nenhum número sem SQL": "Resolvidos no mês = 31" e "Tempo médio = 1,8 d" eram strings chumbadas; BarChart com Seg–Sex fixos; badge "+15% vs. anterior" (comparação inventada); "Trabalhando agora" com progresso de chamado — campo que nunca existiu no banco | — |
| **`dev-chat`** | Mock sem backend nenhum. Morreu de vez: mock, item de menu e cadeado removidos | — |
| **`dev-agenda`** | Enterrada com lápide (migration 014, `dev_tasks` dropada) | `due_date` em `tickets` nascer e pegar |

---

## 6. Dívidas

### Bloqueiam piloto ou go-live

| # | Dívida | Causa | Escopo | Prioridade |
|---|---|---|---|---|
*(A dívida **(f)** — identidade exibida ≠ identidade que age — estava aqui e **foi FECHADA em
06/08/2026**, em quatro fases: `efb8273`, `de0abc0`+`9646900`, `2430ac6`, `aaad1ba`+`a387c17`.
Ver "Fechadas nesta missão", abaixo.)*
| **(m)** | **Etiqueta 3 linhas no ar sem prova no papel** | Consertada em `8d753cd`, mas os ~53 chars/linha do `^A0N,26,26` são estimativa de fonte proporcional | Dívida de **verificação**, não de código | **ALTA** até a prova sair. Ver §7 |
*(A dívida **(l)** — fallback do CORS sem o front real — estava aqui e **foi fechada em `9363d2a`**,
06/08/2026. Ver "Fechadas nesta missão", abaixo.)*

### Não bloqueiam nada hoje

| # | Dívida | Causa | Escopo | Prioridade |
|---|---|---|---|---|
| (a) | `day` de `dev_area_blocks` volta como timestamp | `SELECT` sem cast; driver entrega `Date` com fuso, dia anda ±1 | Um `SELECT` + conferir consumidores | Média |
| (b) | `cors()` depois do rate limit e do parser | 429 e 413 chegam ao browser como "erro de CORS" | Mover um `app.use` (pede teste de preflight) | Média-baixa |
| (c) | Detalhe do chamado sem o traje da 2f | `TicketDetail` é compartilhado por duas telas | Um componente, dois consumidores | Baixa |
| (d) | Perda de token | Provável duplicata da (f), caso 1 | Investigação. **Teste pendente**: 1 aba parada 20 min, sem segundo login | Baixa |
| (e) | Página hospedeira sem gate de front | `RelatoriosBI` tem gate; a `PageRelatorios` que a hospeda não — dispara 4 chamadas e leva 403 | Família das hospedeiras; padrão já existe | Média (barulho, não furo — o backend nega) |
| (g) | Kanban com controles decorativos | "+ Adicionar" sem handler, cards com `cursor: grab` sem drag. Vieram do handoff | Telas mock pré-existentes | Baixa |
| (i) | Impressão silenciosa na Entrada | **Consertada em `3fc809b`, cobertura parcial** — os dois itens que faltam estão na fila da ZD220 | — | Ver §7 |
| (j) | Gate de segredo é disciplina, não garantia | — | — | Baixa |
| (k) | `PageEntradaNova` compartilha estado entre variants | Mesmo componente nas duas abas, só muda a prop; React preserva a instância e leva `rows`/`done` junto | `key={variant}` | Média — mente na tela, não corrompe dado |
| (n) | Falta CHECK do formato do e-mail no banco | Convenção sustentada em 4 camadas de aplicação; o banco aceita qualquer string | Uma migration (SQL pronto na dívida) | Média |
| (o) | `users.role` (enum) coexiste com `profiles.role` | **Medido**: `users.role = 'setor'` nos 8 usuários, inclusive no admin. O `INSERT` do register nunca escreve a coluna | Recon antes de tocar | Média — morde no dia em que alguém ler a coluna |
| (p) | `login` não normaliza e-mail no servidor | Query com valor cru; quem normaliza é o front | Uma linha | Baixa |
| — | `DELETE /requests/:id` devolve **500** em estado bloqueado | Guard lança `Error` comum e cai no catch genérico; mensagem certa, status errado. O `PUT` faz certo com sentinela | Uma linha | Baixa — a UI usa o `PUT`; a rota é admin-only na prática |
| — | **Cancelamento sem ownership** | Nem `deleteRequest` nem `updateRequestStatus` olham o dono: exigem cargo admin/almoxarife e nada mais. Qualquer um dos dois cancela o pedido de qualquer pessoa; o solicitante comum não cancela nem o próprio | **Decisão de produto**, não conserto | Aguarda o Bruno |
| — | `FR_OPS_ATIVAS` / `frClienteDaOP` vêm do seed mock | `pages_clientes.jsx:53` monta os globais do `CLIENTES_SEED`. **Meus Pedidos saiu em `327bb6d`** (usa `useFRClients`); **Conferência e Separações continuam consumindo**. Uma OP criada de verdade não aparece nos dropdowns delas | Trocar pela fonte real ao ligar as telas restantes | Média |
| — | **Vocabulário de status de OP diverge entre 2.0 e 5.0** | 2.0: `pendente` = ativo (18 OPs). 5.0: `em_andamento` = ativo (5), e `pendente` é o DEFAULT de "não começou". Cópia crua na carga esconderia 18 OPs vivas de todo filtro por igualdade | Script de carga + decisão de vocabulário + eventual migration | **ALTA** — não morde hoje, **bloqueia a carga**. Ver §10.8 |

### Fechadas nesta missão

| # | Dívida | Fechada em | O que sobrou |
|---|---|---|---|
| **(f)** | **Identidade exibida ≠ identidade que age** — a única bloqueante de piloto. Três casos, uma causa; `audit_logs` gravava o ator do token, num livro append-only | **`efb8273`** (exibição) · **`de0abc0`+`9646900`** (dado gravado) · **`2430ac6`** (socket) · **`aaad1ba`+`a387c17`** (coerência + detector), todos 06/08 | Uma **nota** dentro da dívida: o detector compara por `jwt.id`, então token antigo do mesmo usuário com role diferente passaria — hoje inofensivo, porque troca de cargo força logout pelo socket. **A mitigação operacional (uma aba por operador) deixou de ser necessária** |
| **(l)** | Fallback do CORS autorizava dois apps que não são nossos e **não listava** `fluxo-royale50.vercel.app` — indisponibilidade total a uma variável de ambiente de distância | **`9363d2a`** (06/08) | Só a **convivência dos dois apps** com nomes parecidos: prioridade **média**, **decisão de produto** (aposentar ou renomear o vizinho). O risco de infraestrutura acabou |
| **(i)** | Falha de impressão silenciosa na Entrada | `3fc809b` (05/08) | Cobertura **parcial**: dois itens herdados seguem na fila da ZD220 (§7) |
| **(m)** | Etiqueta: nome longo sobrepunha em vez de quebrar | `8d753cd` (05/08) | Dívida de **verificação**, não de código — a prova no papel está na fila da ZD220 (§7) |
| — | **Socket morre depois da reconexão esgotada e nada o re-arma** — era ALTA. As três camadas entraram: backoff que nunca desiste (30s→1min→2min→5min), re-arme na volta do foco, e terceiro estado honesto na faixa ("sem tempo real" ≠ "sem conexão") | **`1cd54ca`** (06/08) | Cobertura **parcial declarada**: 6 das 7 provas medidas ponta a ponta, inclusive a negativa de identidade. A **janela anti-duplo de 3s não foi medida** — pendência em §7 |

A remoção dos dois domínios do 2.0 no fechamento da (l) foi **verificada, não presumida**: o bundle
publicado de cada um aponta para backend próprio (`fluxo-royale-backend.onrender.com` e
`fluxo-royale-backend2-1.onrender.com`) e nenhum contém a string `fluxo5-0-backend`.
| — | Permissões v1: universo do checklist é a união das chaves em uso | Chave que perde o último papel some da UI e só volta por SQL | Registro estático de chaves | Média |

---

## 7. Pendências de verificação

**Está no ar e NÃO está provado.** Nenhum destes é verde.

### Fila da ZD220 — fecha em uma sessão de impressora, com um lote de etiquetas

1. **Nome em 3 linhas** legível, sem sobreposição e sem encostar no `NF · data` — pior caso real:
   SKU `3.01.0271`, 112 chars
2. **Barcode `h=120` em `y=266`** escaneando com a etiqueta **amassada dentro do plástico** — a
   condição real de bipagem, não de bancada
3. **Caminho de sucesso da impressão** — herdado da (i), pendente desde `3fc809b`
4. **Botão "Reimprimir etiquetas"** — herdado da (i), pendente desde `3fc809b`

Se o item 1 falhar, o ajuste é o **terceiro parâmetro do `^FB`** (espaçamento entre linhas, aceita
negativo) — **não** reposicionar campo. As posições saem de uma conta com 4 dots de folga de cada
lado do barcode e 7 dots entre o banner e a borda. O alerta está no código, no ponto onde alguém
com pressa iria mexer.

### Viewport 390 — modal de cancelamento e seletor de OP

**NÃO MEDIDO** — e o mecanismo do impedimento está nomeado, que é diferente de "não deu".

**Não é que 390 seja inalcançável.** Com um botão injetado e **clique de mouse real** (gesto do
usuário, que é o que o bloqueio de popup exige), `window.open(…, 'width=390,height=844')` abre uma
janela em **390×787 de verdade** — medido em 06/08/2026.

**O que impede é a simultaneidade**: a janela vai a segundo plano assim que a extensão age na
aba-mãe, e nesse estado o Chrome reporta `visibilityState: "hidden"` com `innerWidth`,
`clientWidth` e `outerWidth` todos **0** — janela ocluída não tem layout computado. Ou a janela
está visível e eu não consigo medi-la, ou eu meço e ela já não está. **Qualquer número lido dali
seria ficção**, e é por isso que nenhum foi registrado.

As outras duas vias, testadas e descartadas na mesma sessão: o device mode não engata pelo teclado
da extensão (`F12` + `Ctrl+Shift+M` não chegam ao chrome do navegador, só à página), e
`resize_window` **reporta sucesso com o viewport imóvel** em 1920×889 — o no-op já documentado.

O que existe hoje é análise estática — a caixa é `min(480px,96vw)` sem largura mínima —, e isso
**não é medição**. Precedente de que a medição é possível por outra via: a medição em 391 do painel
BI (`1b35c63`) pegou uma regressão real (cards estourando a tela, `right 455` num viewport de 391).

**Medido e verde**, para não confundir: 1920×889 — modal de cancelamento 480px centrado e dropdown
de OP 480×288 (esq 1391 / dir 1871), os dois dentro da tela, sem overflow horizontal.

### Janela anti-duplo do re-arme do socket — fecha numa sessão com navegador livre

**NÃO MEDIDA.** `JANELA_ANTI_DUPLO` (3s, `socket.js`), do commit `1cd54ca`. A prova da volta ao foco
que está verde é do build **anterior** à correção.

O que sustenta a mudança é a **medição do defeito, não a do conserto**: no instante da volta ao foco
saíram **4 notificações**, não 2. `visibilitychange` e `focus` são a mesma transição, e a guarda
`isConnected` não segura a segunda porque `connect()` é assíncrono — quando o `focus` chega, o
socket aberto pelo `visibilitychange` ainda está em handshake. A segunda tentativa derrubava o
socket que a primeira acabara de abrir. Nada quebrava (sobrevivia uma instância só), mas era uma
conexão desperdiçada e uma sessão órfã no servidor a cada volta de aba.

**O mecanismo do impedimento**, que é o que importa registrar: o gatilho real de troca de aba nesta
máquina só existe por **teclado do SO**. `SetForegroundWindow` foi bloqueado pelo Windows
(foreground lock) e o `Ctrl+9` vazou para uma janela de terceiro — uma planilha do Excel, em Modo de
Exibição Protegido, que bloqueia edição. E existe **uma só** janela do Chrome na máquina: a de
trabalho do Bruno. Insistir significaria sequestrar o foco dele durante o trabalho. O instrumento
ganhou uma trava (não digita sem confirmar a janela em primeiro plano) e foi **parado**.

**Como fechar**: socket morto, aba oculta, backend no ar, degrau longe de vencer; trazer a aba ao
foco e **contar as notificações — tem que ser 1, não 2 nem 4.**

---

## 8. Réguas aprendidas

Valem para as próximas sessões, e cada uma custou tempo para ser descoberta.

1. **Prova de deploy é por CONTEÚDO, nunca por nome de arquivo nem por header.** Em 06/08 o poll
   perseguiu o hash do bundle do build local (`index-DHUuu-ZD.js`); a Vercel gerou outro nome para
   o mesmo commit (`index-6HyuljxA.js`) e o poll disse "ainda velho" 16 vezes com o código novo já
   servido. A CDN ainda respondia `X-Vercel-Cache: HIT` com cache-buster. O que provou foi a
   presença de uma string que só existe naquele commit. Em 05/08 a mesma classe de erro tinha
   custado um falso negativo pelo domínio errado (dívida (l)).

2. **Marcador de verificação precisa ser ÚNICO — e a prova é um PAR.** Terceira aparição da mesma
   classe de erro em um único dia, o que a promove de tropeço a régua. Ao confirmar a remoção do
   mock de OPs, usei `"Metalúrgica Andrade"` como marcador — e ele continuou aparecendo no bundle,
   porque vive em `compras.jsx` como **fornecedor de outra tela**. A presença não provava nada: o
   marcador não era exclusivo do que eu removi. O método correto é sempre o par —
   **string nova PRESENTE + string velha AUSENTE** —, e a string velha tem que existir **só** no
   trecho que morreu. Vale para bundle publicado, para `grep` em código e para qualquer prova por
   marcador. As duas aparições anteriores: o hash de arquivo que a Vercel gera diferente do build
   local, e o domínio vizinho que carregava o mesmo termo por conta própria.

3. **Probe de rota sem token não prova que a rota existe.** Um 401 vem do middleware de
   autenticação, antes do roteamento — responde igual para rota existente e inexistente.

4. **Instrumento que discorda do resto é suspeito ANTES do fenômeno.** Os screenshots chegam
   reduzidos a 1568 enquanto o viewport real é 1920 — quase virou um "1568 medido" no relatório.
   Confirmar QUE tela se está medindo antes de reportar qualquer número de viewport.

5. **Smoke que exige provar login deixa resíduo PERMANENTE, por construção.** O login grava
   `audit_logs` com o `user_id` novo e a FK é `NO ACTION` — o hard-delete devolve 409. O cleanup
   correto é **suspensão** (`is_active = false`), não exclusão.

6. **`audit_logs` é append-only e não se edita por conveniência de limpeza.** Apagar o LOGIN para
   viabilizar um hard-delete seria destruir a trilha para esconder o rastro de um teste —
   exatamente o que a auditoria existe para impedir.

7. **Medir viewport móvel neste ambiente esbarra em SIMULTANEIDADE, não em alcance.** `resize_window`
   reporta sucesso e não mexe no viewport; o device mode não engata pelo teclado da extensão;
   `window.open` com **gesto real de mouse** chega a 390×787 de verdade — mas a janela vai a
   segundo plano quando a extensão age na aba-mãe, e janela `hidden` devolve `innerWidth`,
   `clientWidth` e `outerWidth` **zerados**, sem layout computado. Ou está visível e não dá para
   medir, ou mede-se o zero. Não reportar número de viewport sem antes confirmar **qual tela** está
   sendo medida (§7).

8. **Contrato de hardware não se decide por captura de tela.** Layout de etiqueta se decide com a
   etiqueta impressa na mão.

9. **Gate de front espelha o backend letra por letra, e segue o ENDPOINT.** `canAccess` libera por
   prefixo; quem tem `x:view` passa em `canAccess('x')` e toma 403 na rota que exige a chave exata.
   E quando o endpoint muda, a chave do gate muda junto: no cancelamento, gatear por
   `minhas_solicitacoes:delete` (a chave do `DELETE`) teria escondido o botão **de quem pode agir**
   — medido: o almoxarife tem `solicitacoes:edit` e não tem a outra.

10. **Componente do handoff só substitui o nosso por EVIDÊNCIA.** `DvBars` foi recusado com defeito
   provado, não por gosto.

11. **Cleanup de smoke é cirúrgico, por id.** `UPDATE`/`DELETE` global já destruiu o seed de
    validação duas vezes.

12. **Instrumento de medição precisa de GUARDA DE IDEMPOTÊNCIA e página limpa.** Terceira aparição
    da classe num dia. Medindo se o socket duplicava listener, contei 3 e depois 2 disparos para
    **uma** emissão do servidor — e as duas vezes o defeito era do instrumento: na primeira eu
    havia registrado `addEventListener` em três instrumentações sucessivas na mesma página; na
    segunda, um bloco que lançou exceção **já tinha registrado os listeners antes de lançar**.
    Listener registrado duas vezes **conta a si mesmo**. Com página recarregada e
    `if (window.__armado) return`, o número saiu 1 — que era a verdade desde o começo. Instrumento
    que acumula estado entre execuções mede o instrumento, não o sistema.

13. **`TaskStop` não derruba dev server — matar por PID e CONFERIR a porta.** Terceira aparição do
    mesmo padrão: parar a tarefa de background mata o wrapper, não o processo filho. O vite
    continuou respondendo `200` na 8080 depois do stop. **Ambiente só está encerrado quando a porta
    parou de servir** — verificar (`Get-NetTCPConnection -LocalPort N -State Listen`), nunca
    presumir. Vale para o backend local (3000) tanto quanto para o front (8080). O padrão comum às
    três aparições é o mesmo das réguas 1 e 2: **a confirmação tem que medir o efeito, não o
    comando** — sha no `/health` em vez do push, conteúdo do bundle em vez do nome, porta calada em
    vez do stop aceito.

14. **Instrumento que precisa do FOCO DO SO não é utilizável nesta máquina.** Existe **uma** janela
    do Chrome aqui, e ela é a de trabalho do Bruno. Medir a volta ao foco de uma aba exige trocar a
    aba ativa **daquela** janela — e o único gatilho disponível, `SendKeys`, digita em quem estiver
    em primeiro plano. `SetForegroundWindow` é bloqueado pelo Windows sem aviso: a chamada retorna,
    a janela não vem, e a tecla vaza para o programa errado (em 06/08 foi um `Ctrl+9` numa planilha
    do Excel, salva pelo Modo de Exibição Protegido). Duas consequências, as duas obrigatórias:
    **(i)** todo instrumento que digita precisa **conferir a janela em primeiro plano imediatamente
    antes de cada tecla e abortar sem digitar** se não for a alvo; **(ii)** medição que exige troca
    de janela ou de aba fica para **ambiente dedicado** — não se sequestra o foco de quem está
    trabalhando para fechar uma prova. Registrar a pendência custa menos que atrapalhar o usuário.

---

## 9. Incidente — 06/08/2026

**Dois pedidos do seed foram cancelados por engano durante o smoke do cancelamento.**

| Registro | Setor | Item | Cancelado às | Por |
|---|---|---|---|---|
| `4c046413-aaf9-4ee6-967d-b75950a97cf9` | Diretoria | 3.01.0269 × 1 | 11:08:48 | `002@fluxoroyale.local`, pela tela |
| `416c4aad-7960-4c92-9cea-eb1751923310` | Elétrica | BOB-4005 × 8 | 11:08:56 | `002@fluxoroyale.local`, pela tela |

Os dois foram cliques meus em "Cancelar solicitação" onde a intenção era "Voltar". A auditoria e a
sequência não permitiram atribuir cada um a um passo específico do roteiro. **Não há caminho no
código que cancele solicitação diferente da do card clicado** — o modal alveja o `id` do card e
cada cancelamento exigiu uma confirmação; a causa foi erro de operação, não defeito.

**Recriados pela via da tela** em 06/08, como o solicitante original (001), levados a `aprovado`
pelo caminho normal:

| Novo | PED | Setor | OP | Item | Status |
|---|---|---|---|---|---|
| `85de955b-1374-4e23-b73c-efca3e9103a4` | PED-85DE95 | Diretoria | 73001 | BOB-4005 × 8 | `aprovado` |
| `63a35524-41c3-49c6-a883-bdcc2844b719` | PED-63A355 | Diretoria | 73002 | 3.01.0269 × 1 | `aprovado` |

Equivalente, não idêntico — e as diferenças estão nomeadas: `id` e `created_at` são novos
(inevitável), e o **setor** do `416c4aad` era `Elétrica` mas saiu `Diretoria`, porque a tela deriva
o setor do perfil do solicitante (`pedidos.jsx:437`) e o 001 é Diretoria. Não foi mexido no perfil
para forjar o campo.

**Os registros cancelados permanecem em `rejeitado`, com a auditoria intacta. Não foram revertidos
por SQL** — cancelamento é soft-delete com trilha, e a trilha não se apaga por conveniência.

Saldo conferido depois: BOB-4005 `reserved 8.00` (disponível 0), 3.01.0269 `reserved 1.00`
(disponível 1), EPI-1001 `reserved 0.00` / `on_hand 199.00`. Seed em **4 `aprovado`**.

---

## 10. Próximos passos

### Antes do piloto

1. **Fechar a fila da ZD220** (§7) — quatro itens, uma sessão de impressora. **É o que resta antes
   do piloto.**
2. **Contar as notificações da volta ao foco** (§7) — a janela anti-duplo do re-arme do socket, num
   ambiente com navegador livre. Item de **verificação**, não de código: o re-arme já está no ar em
   `1cd54ca` e o defeito que a janela corrige é desperdício, não quebra.

*(Esta lista tinha três itens, e depois quatro. A **(f)** — a única bloqueante de piloto — **saiu,
fechada** em quatro fases (06/08); a **(l)** saiu antes, fechada em `9363d2a`; o **re-arme do
socket** era decisão pendente e **virou conserto no ar** (`1cd54ca`), deixando para trás só a
verificação acima. O que restou das duas primeiras são decisões de produto sem urgência, em "Na
mesa, sem data".)*

### Na mesa, sem data

3. **Convivência dos dois apps de nome parecido** — o que sobrou da (l) depois do conserto do CORS.
   `fluxo-royale.vercel.app` (`Frontend-5.0-App`) e `fluxoroyale21.vercel.app` seguem no ar, com
   backend próprio, e já causaram um falso negativo de deploy. **Prioridade média, decisão de
   produto**: aposentar, renomear, ou documentar em ambos os READMEs qual domínio serve qual repo.
   O risco de infraestrutura acabou; sobrou o risco humano.
4. **prod-montagem** — a peça que falta do módulo Produção.
5. **Módulos bloqueados: 4, não 5** — `rh`, `compras`, `assistencia`, `financeiro` estão com
   `locked: true` em `data.jsx`. Aparecem no seletor com cadeado e não abrem.
6. **Quem enxerga o módulo Dev** — hoje **só o admin**, e por bypass (`ROLE_MODULES.admin = 'all'`
   em `lib/access.js`). Nenhum papel concede `'dev'`. Precisa de decisão: fica só admin ou nasce um
   papel de desenvolvedor?
7. **Etiqueta 100×30 com toggle de tamanho** — **decisão travada**: não desenhar o toggle antes de
   responder se trocar o rolo 60↔30 exige recalibrar a ZD220 a cada troca. Se exigir, o controle na
   tela não é "escolha o que quer", é **"declare o que está carregado"** — desenho diferente, não
   só texto de botão diferente. Os dois ZPL de teste já estão prontos.
8. **Carga de dados 2.0 → 5.0** — migração do sistema antigo. **Já existe um item concreto e ele
   não é trivial: o vocabulário de status de OP diverge entre os dois bancos.** Medido em
   06/08/2026 — no 2.0 o estado ativo se chama `pendente` (18 OPs) e no 5.0 se chama
   `em_andamento` (5); `concluido` é comum aos dois. A carga exige **tradução
   `pendente` → `em_andamento`**: cópia crua traria 18 OPs vivas marcadas com a palavra que, no
   5.0, é o DEFAULT de "não começou" — e todo filtro por igualdade passaria a ignorá-las, sem erro
   e sem log. Fica de pé a decisão de produto: `pendente` continua no vocabulário do 5.0 ou sai?
   Detalhe completo em `Backend-Fluxo2.0/DIVIDAS.md` → "Vocabulário de status de OP divergente
   entre 2.0 e 5.0" (prioridade ALTA, bloqueia a carga). O seletor de OP já está imune por filtrar
   `!frIsOpConcluida`, mas isso protege a tela, não o dado.
9. **Ownership do cancelamento** — decisão de produto pendente (§6). É intencional que o
   almoxarifado cancele o pedido de qualquer um, ou é furo?
10. **`FR_OPS_ATIVAS` sai do seed** — junto com o wiring de Conferência, Montagem, Meus Pedidos e
    Separações.
