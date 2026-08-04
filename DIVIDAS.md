# Dívidas técnicas — Fluxo Royale 5.0 (Front)

Registro nomeado das dívidas aceitas conscientemente, com o porquê e o caminho de saída.
(Dívidas menores vivem como comentários no ponto exato do código; aqui ficam as que precisam
de decisão ou de trabalho estrutural futuro.)

## Permissões v1 — universo do checklist é a união das chaves em uso

Universo do checklist de Permissões = união das chaves em uso: chave que perder o último
papel some da UI das DUAS abas (Exceções inclusa) e só volta por SQL. Risco concreto:
`permissoes`/`logs`/`usuarios`/`tarefas_eletrica` têm papel único — um desmarque de distância.

- **Mitigação v2 barata**: confirm avisa quando o desmarque remove o último papel de uma chave.
- **Solução estrutural**: registro estático de chaves válidas = mesma decisão adiada da
  normalização da convenção mista flat×namespaced — tratar juntas.

Registrado em 28/07/2026 (aprovação do commit 2 da tela Permissões).

## (a) `day` de dev_area_blocks volta como timestamp, não como data — repo do BACKEND

**Causa**: `dev_area_blocks.day` é `DATE`, e o `SELECT` de `listBlocks`
(`devArea.controller.ts:71`) devolve a coluna sem cast. O driver do Postgres entrega um objeto
`Date` com fuso, e o dia pode andar ±1 dependendo de onde o valor for formatado. Medido na
validação em 04/08/2026: a MESMA linha, lida com `day::text`, sai `"2026-08-03"` limpo.
**Escopo**: um `SELECT` no backend, mais a conferência de quem consome o campo no front (a Área
Dev monta a semana e o mês a partir dele).
**Prioridade**: média — erra data, não quebra tela. Off-by-one de dia é o tipo de erro que o
usuário atribui a si mesmo antes de reportar.

## (b) `cors()` registrado depois do rate limit e do parser — repo do BACKEND

**Causa**: em `server.ts` a ordem é `helmet` → `express.json({limit:'50mb'})` → `globalLimiter`
→ `cors(corsOptions)` (linha 108). Toda resposta gerada ANTES do `cors` sai sem os cabeçalhos de
CORS — o 429 do limiter e o 413 do parser chegam ao navegador como "erro de CORS", escondendo a
causa real.
**Escopo**: mover um `app.use`. O risco é de ordem, não de lógica: `cors` antes do limiter muda
quem responde ao preflight, então a troca pede um teste de preflight (mesma régua do smoke com
header customizado).
**Prioridade**: média-baixa — não derruba nada em operação normal, mas troca dois erros
diagnosticáveis por um erro enganoso.

## (c) Detalhe do chamado ficou sem o traje da 2f

**Causa**: a 2f vestiu o hero e a lista da fila do Dev, mas o detalhe é o `TicketDetail`
COMPARTILHADO (`pages_rest.jsx:2346`), consumido por Meus Chamados e pela fila do atendente
(`dev.jsx:435`, com `atendente={true}`). Ficou no visual anterior.
**Escopo**: front, um componente com DOIS consumidores — qualquer traje novo aparece nas duas
telas ao mesmo tempo, e é isso que decide se o retrabalho é barato ou caro.
**Prioridade**: baixa — cosmética, sem efeito em dado nem em permissão.

## (d) Perda de token — REBAIXADA, provável duplicata da (f)

**Causa provável**: o caso 1 da (f) — o token vive por ORIGEM, e um segundo login sobrescreve o
token de todas as abas daquela origem. O que foi lido como "a sessão caiu sozinha" tem explicação
mais simples que expiração ou bug de refresh.
**Escopo**: investigação, não conserto. **TESTE PENDENTE**: deixar UMA aba parada 20 min, sem
nenhum segundo login em lugar nenhum, e ver se a sessão cai. Se não cair, a (d) morre dentro da
(f).
**Prioridade**: baixa enquanto não reproduzir. O teste NÃO vale com duas abas abertas — essa é
exatamente a condição que produz o falso positivo.

## (e) Página hospedeira sem gate de front (família)

**Causa**: `RelatoriosBI` tem gate próprio (`relatorios.jsx:112` — sem `canAccess('relatorios')`
nem monta, zero rede), mas a `PageRelatorios` que a hospeda NÃO: ela dispara `/dashboard/stats`,
`/reports/managerial` e afins para quem não tem a chave, e leva 403. Anotado no ponto exato em
`relatorios.jsx:107-109`. Pré-existente à fase.
**Escopo**: a família das páginas hospedeiras, não só Relatórios. O padrão de gate por CASCA (sem
hook antes do `return null`) já existe e é replicável.
**Prioridade**: média. **Não é furo de segurança** — o backend nega. É barulho de rede e um erro
visível que o usuário não tem como resolver.

## (f) Identidade exibida ≠ identidade que age

UMA CLASSE, TRÊS CASOS. O nome que a tela mostra pode divergir de quem a sessão realmente é —
e quem age é a sessão. Num terminal compartilhado o operador confia no nome que está na tela e
atribui a ação a quem está escrito.

**CLASSIFICAÇÃO (04/08/2026): BLOQUEANTE DE PILOTO em terminal compartilhado.** Não bloqueia o
merge — é pré-existente e nada do redesign a introduziu. Bloqueia o **go-live sem mitigação**.

**Caso 1 — localStorage por origem.** O token vive por ORIGEM, não por aba: um segundo login
sobrescreve o token de todas as abas de `localhost:5173`. A aba antiga continua exibindo o
usuário antigo (estado React já montado) e AGE como o novo (o interceptor manda o token novo).
Nenhum aviso, nenhuma tela muda.

**Caso 2 — rodapé com USER mock pós-F5.** `sidebar.jsx:289-292` lê o global `USER`
(`data.jsx:77` = `{ name: 'Bruno', role: 'ADMIN' }`); `syncGlobalUser` (`app.jsx:14`) MUTA esse
objeto dentro de um `useEffect` — mutação não dispara re-render, e o efeito roda DEPOIS do
primeiro render. Num F5 direto dentro de um módulo, o rodapé mostra "Bruno / ADMIN" para
qualquer usuário logado, e fica assim até um re-render natural. Entrando pelo seletor de
módulos o nome sai certo — por isso passa despercebido.
Registrado em 28/07/2026 como "cosmética pré-existente" (smoke da tela Permissões); MEDIDO DE
NOVO na passada 2 da fase 3c em 04/08/2026, com a sessão do 005 íntegra por baixo (token,
`FRAuth.user`, `FRAuth.profile` e permissões todos 005) — só o texto na tela mentia.

**Caso 3 — token e socket divergindo DENTRO da mesma sessão.** Medido ao vivo em 04/08/2026,
durante o smoke da fase de fechamento. Na MESMA aba, ao mesmo tempo:
- `FRAuth.user` dizia **005** (é o que a tela exibia);
- o `auth_token` do `localStorage` era do **001** — e é ele que o interceptor manda em todo request;
- o **socket** estava na sala do **005** (recebeu o `ticket_updated` de um chamado do 005);
- `GET /tickets/my` devolveu um chamado do **001**.

Confirmado por TRÊS fontes independentes: o banco (dono real de cada ticket), o JWT decodificado
do `localStorage`, e a resposta do endpoint. **O backend respondeu corretamente ao token que
recebeu — o defeito é integralmente do cliente.** O caso 3 é o caso 1 levado ao limite: não é só
o nome no rodapé que mente, é a própria sessão que se parte em duas (HTTP de um usuário, tempo
real de outro) sem nenhum sinal em tela.

**CONSEQUÊNCIA QUE PRECISA ESTAR ESCRITA**: `audit_logs` grava o ator do **TOKEN** — os
controllers chamam `createLog(req.user.id, ...)` e o `logger.ts` insere esse id em
`audit_logs.user_id`. Logo, uma ação executada por um operador pode ficar **atribuída a outro no
livro**, sem nenhum sinal em tela para qualquer um dos dois. O livro é append-only: uma
atribuição errada não se corrige depois, só se anota. É por isso que esta dívida deixou de ser
"prioridade alta" e virou bloqueante de piloto.

**Conserto da classe inteira**: a identidade exibida vem do token / `FRAuth` por ESTADO React,
nunca de cópia global mutada — e o token que o interceptor usa tem que ser o MESMO que montou a
sessão em memória e o socket (divergiu, derruba a sessão e manda refazer o login). Missão
própria, pós-merge. Consertar só o caso 2 (trocar a leitura do rodapé) deixa 1 e 3 de pé — são a
mesma causa vista de três lados.

**Mitigação mínima para liberar piloto**, enquanto o conserto não vem: uma aba por operador e
logout explícito ao trocar de pessoa no terminal — o que hoje não é imposto nem avisado por nada
na tela.

## (g) Kanban compartilhado com controles decorativos

**Causa**: o botão "+ Adicionar" (`pages_rest.jsx:32`) tem `cursor: pointer` e hover completo, e
NENHUM handler; os cards do mesmo `Kanban` têm `cursor: 'grab'` e nenhum drag. Vieram assim do
handoff.
**Escopo**: telas MOCK pré-existentes (`PageTarefas` e `PageEletrica`) — fora do alcance de toda
a missão do redesign, que não tocou nenhuma das duas. O arquivo entrou no diff por outro motivo
(o helpdesk mora nele).
**Prioridade**: baixa — sai quando o Quadro de Tarefas for atacado de verdade, que é quando as
dívidas de `tasks` do backend (guard de OP fantasma, `completed` inexistente) também vencem.
