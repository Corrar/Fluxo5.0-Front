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

## (i) Falha de impressão SILENCIOSA na Entrada

**Causa**: `cfPrintIdentificacao` (`conferencia.jsx:614`) captura a exceção INTERNAMENTE e reporta
por `notify`. A Entrada por NF (`pages_admin.jsx:180`) e o Reaproveitamento (`pages_admin.jsx:210`)
passam `onFlash = null`, que vira `function () {}` no-op (`conferencia.jsx:615`). Como o erro é
engolido lá dentro, o `await` completa normalmente, o `catch` de `handleEntradaImprimir` não vê
nada, e o fluxo segue para `setDone(true)`.

**Consequência operacional**: com o agente fora do ar ou a impressora desligada, **nenhuma
etiqueta sai E a tela confirma sucesso**. A mercadoria vai para a prateleira sem identificação e
o erro só aparece na contagem seguinte — quando ninguém mais liga o sumiço à impressão daquele
dia. É a pior forma de falhar: silenciosa, com confirmação positiva por cima.

**Não ocorre na Conferência**, que passa `onFlash` real e mostra até a contagem parcial
("Impressão falhou (3/7): … Browser Print rodando e a ZD220 ligada?").

**Conserto**: a Entrada precisa do MESMO retorno de erro visível da Conferência — o tratamento já
existe e está provado, falta ligá-lo nos dois call sites.
**Escopo**: pequeno — dois call sites, sem mudança de contrato.
**Prioridade**: ALTA. Escopo pequeno não é o critério aqui; é caminho crítico de operação.

### STATUS — consertada em `3fc809b`, com COBERTURA PARCIAL

Consertada e no ar em 05/08/2026 (`3fc809b`, confirmado no bundle de
`https://fluxo-royale50.vercel.app`).

**Medido** no smoke local contra a validação (`ep-summer-wave`), Browser Print comprovadamente
fora do ar antes E depois de cada entrada (HTTP 000 nas duas leituras, para excluir a janela em
que o serviço sobe sozinho):

- Falha exibida nos DOIS call sites — entrada por NF e reaproveitamento
- Contagem parcial `(0/3)` com denominador real, vindo das 3 etiquetas pedidas
- Aviso sobrevive a 6s — sem o timer de 4s dos toasts da tela
- Badge âmbar no lugar do verde que dizia "etiquetas enviadas!"
- Transação preservada: `on_hand` 5→8→11, com `xml_logs`, `xml_items` e `stock_ledger` gravados
  nos dois casos. Revertido depois por `reverseReceive`, saldo de volta a 5.00

**POR MEDIR — não fingir que está fechado**:

- O caminho de SUCESSO da impressão (nenhuma etiqueta saiu por este código ainda)
- O botão "Reimprimir etiquetas" funcionando de fato

Nenhum dos dois é testável em máquina sem impressora alcançável: o clique só reproduz a mesma
falha. **Fecham na máquina com a ZD220.** Até lá, o que está provado é que o erro deixou de ser
silencioso — não que a reimpressão resolve.

## (j) Gate de segredo é disciplina, não garantia

**Causa**: não existe script de gate de segredo no `package.json` de NENHUM dos dois repos (o front
tem só `dev`/`build`/`preview`). O gate tem sido varredura manual sobre o diff, refeita a cada
commit por hábito. Funcionou até hoje — mas por disciplina, não por mecanismo.

**Consequência**: um commit apressado passa sem verificação e ninguém percebe. Diferente de quase
toda dívida desta lista, esta não é reversível pelo caminho normal: segredo que entra no histórico
git não se apaga, só se reescreve com força (`filter-repo`/`push --force`) — e, se o repo já foi
clonado ou o push já saiu, a rotação da credencial vira obrigatória de qualquer jeito. O custo não
está em consertar o commit; está em trocar o que vazou.

**Conserto**: script npm que roda a varredura de padrões sobre o diff STAGED e sai com código != 0
ao encontrar qualquer um:

    senha|password|secret|token|api_key|bearer|JWT|private_key|postgres://|sk-|ghp_|AKIA

Opcionalmente pendurado num hook de `pre-commit`. Vale nos DOIS repos — o backend, que é onde
moram `JWT_SECRET` e `DATABASE_URL`, tem mais a perder que o front.

**Escopo**: pequeno — um script por repo, sem dependência nova.
**Prioridade**: MÉDIA-ALTA. Barato de fazer, caro de não ter: o preço não é o bug, é a credencial
queimada e o histórico reescrito.

## (k) `PageEntradaNova` compartilha estado entre as variants NF e Reaproveitamento

**Causa**: "Por NF-e" e "Entrada por Reaproveitamento" são o MESMO componente
(`PageEntradaNova`, `pages_admin.jsx:87`) com `variant` diferente. Trocar de aba muda a prop, não
o componente — o React preserva a instância, e com ela `rows`, `done` e `avisoEtiqueta`.

**Consequência**: ao ir de uma aba para a outra, a tela nova aparece com as linhas, o badge e o
painel de aviso da entrada ANTERIOR. O painel afirma "Entrada registrada, mas a etiqueta NÃO saiu"
numa tela onde nada foi registrado. Observado no smoke da dívida (i) em 05/08/2026: depois da
entrada por NF, o Reaproveitamento abriu já mostrando o aviso e o badge âmbar da NF.

**Pré-existente**: já valia para `rows` e `done` desde sempre. O painel novo da (i) não criou o
problema — tornou visível, porque texto afirmativo mente mais alto que uma lista de linhas.

**Conserto**: forçar remontagem por variant (`key={variant}` no ponto de uso) ou limpar o estado
num efeito que observe `variant`. A primeira é one-liner e não deixa estado sobrando.
**Escopo**: pequeno.
**Prioridade**: MÉDIA. Não corrompe dado — o backend nunca vê esse estado —, mas mente na tela, e
tela que mente é o que esta lista aprendeu a não tolerar na (i).

## (l) Dois fronts diferentes no ar com nomes parecidos e domínios cruzados no CORS

**Causa**: `https://fluxo-royale.vercel.app` NÃO serve este repositório. O bundle publicado ali é
React + Tailwind + TSX com biblioteca de toast (`_e.success("Entrada registrada com sucesso!")`,
`className="absolute inset-0 bg-[url(...)]"`) — é o **`Frontend-5.0-App`**, outra aplicação, com
um "Reportar Erro" que já carregava os contatos reais do Bruno. Este repo
(`Corrar/Fluxo5.0-Front`, base com `cfPrintIdentificacao`/`FRApi`) mora em
`https://fluxo-royale50.vercel.app` (projeto `fluxo-royale5.0`).

### AGRAVANTE — o fallback do CORS autoriza os estranhos e esquece o nosso

Esta é a parte perigosa, e não é cosmética. O fallback de `CORS_ORIGINS`
(`src/config/cors.ts:17-20`) está assim:

```
'https://fluxo-royale.vercel.app',      ← NÃO é nosso (Frontend-5.0-App)
'https://fluxoroyale21.vercel.app',     ← NÃO é nosso
'https://fluxo-royale.com.br',
'https://www.fluxo-royale.com.br',
```

**`https://fluxo-royale50.vercel.app` — o front REAL deste sistema — não está na lista.**

O front só funciona hoje porque a env `CORS_ORIGINS` do Render supre a ausência (o log do boot
distingue "fonte: fallback" de "fonte: env"). **Se essa env sumir, for reescrita ou vier vazia num
redeploy, o backend cai para o fallback: o front real perde acesso ao backend — indisponibilidade
TOTAL, todo request bloqueado pelo navegador — enquanto os dois fronts estranhos seguem
autorizados.** É uma variável de ambiente de distância.

**Conserto**: `https://fluxo-royale50.vercel.app` entra no fallback; os dois domínios do 2.0 saem,
se não houver razão para estarem lá.
**Escopo**: uma linha.
**Prioridade**: MÉDIA-ALTA — uma linha que evita indisponibilidade total do front.

### Consequência do lado humano

Em go-live alguém vai abrir o app errado, testar, e reportar bug fantasma — ou pior, achar que um
conserto não subiu porque olhou no domínio vizinho. Aconteceu nesta sessão em 05/08/2026: a
confirmação do deploy do `3fc809b` foi buscada em `fluxo-royale.vercel.app` e deu falso negativo,
com o agravante de que o outro app tinha `royaleavicultura` no bundle por conta própria — o
marcador que deveria distinguir os dois estava presente nos dois.

**Conserto** (além da linha do CORS, acima): aposentar ou renomear o app vizinho. Enquanto os dois
viverem, documentar em ambos os READMEs qual domínio serve qual repo — e nunca confirmar deploy
por marcador que os dois possam ter.
**Escopo**: decisão de produto.
**Prioridade**: MÉDIA — o custo aparece na hora pior, o go-live, mas não derruba nada sozinho.

---

# Decisões fechadas

Isto **não são dívidas**. São assuntos encerrados por decisão de produto, registrados aqui para
que não voltem à mesa como se estivessem em aberto. Uma dívida pede conserto; uma decisão só é
revista se a premissa mudar — e cada entrada abaixo diz qual é a premissa.

## Idioma — sem i18n, seletor removido

**Decisão (05/08/2026)**: o seletor de idioma sai de vez. Já havia sido removido do rodapé de
login em `2931cbc` por ser inerte (span "Português" com chevron, sem handler, sem estado, sem
lista de opções); agora fica registrado que a ausência é **deliberada**, não uma pendência.

**Base**: a Royale não tem demanda de outro idioma, e i18n real não é o seletor — é extrair
~1.222 strings da UI mais as mensagens da API, e mantê-las sincronizadas para sempre. O custo é
permanente; a demanda, inexistente.

**Premissa que reabriria**: demanda real de cliente estrangeiro. Só isso. Tela em português com
usuário que lê português não é problema a resolver.

**Consequência prática**: `pt-BR` é a única língua do produto. Textos podem ser escritos direto no
JSX, sem camada de tradução e sem `t()` — que é como o código já é hoje, agora com respaldo.
