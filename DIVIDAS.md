# Dívidas técnicas — Fluxo Royale 5.0 (Front)

Registro nomeado das dívidas aceitas conscientemente, com o porquê e o caminho de saída.
(Dívidas menores vivem como comentários no ponto exato do código; aqui ficam as que precisam
de decisão ou de trabalho estrutural futuro.)

## "Cancelar pedido" do Meus Pedidos só existe para admin/almoxarife — DECISÃO DE PRODUTO

Registrada em 06/08/2026, ao ligar o cancelamento real nas duas portas (Solicitações e Meus
Pedidos). **Não é regressão: é a primeira vez que o botão diz a verdade.**

Antes ele era falso — dava `filter` no estado da tela, o card sumia e voltava no F5, sem nada ter
acontecido no servidor. Ligado de verdade, ele passou a obedecer ao backend, e o backend NÃO
deixa o solicitante comum cancelar: `updateRequestStatus` e `deleteRequest` exigem cargo `admin`
ou `almoxarife`, sem nenhuma checagem de dono. Logo, o botão agora **não nasce** para quem levaria
403 — que é a maioria de quem usa a tela.

O buraco de produto é do backend e está registrado lá ("Cancelamento de solicitação não tem
ownership"). Enquanto o Bruno não decidir, o front fica assim de propósito: **não mostrar botão
que só produz 403** vale mais do que manter uma ilusão que já enganava.

Saída, se a decisão for "cada um cancela o seu": o gate `frSolPodeCancelar()` (pages_admin.jsx)
ganha o ramo do dono, na MESMA linha do que o backend passar a aceitar — nunca antes.

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

## (m) Etiqueta: layout de 3 linhas NO AR e SEM PROVA NO PAPEL

**O que era**: o campo do nome usava `^FB800,1,0,C` (máximo de UMA linha) e nada no JS limitava
comprimento. O excesso voltava sobre a mesma linha — etiqueta com o texto empilhado sobre si
mesmo, ilegível. A base tinha mudado sem ninguém notar: o pior caso era ~43 chars no recon
anterior e virou **112** (SKU `3.01.0271`), com a entrada de um bloco Siemens/elétrica que traz a
descrição técnica completa no campo nome. Dos 59 produtos ativos, 14 passam de 43 chars; e dos 27
que já tiveram entrada — logo, já geraram etiqueta — **11 são longos**.

**Consertado em `8d753cd`** (05/08/2026): `^FB800,3,0,C` com fonte 26, layout recalculado fechando
em 480 dots sem colisão, barcode mantido em h=120, e teto de 150 chars no JS com corte explícito
em `...` ASCII. Ver `conferencia.jsx` — o mapa vertical e o alerta do `^FB` moram lá.

### TRAVA DE PUSH LEVANTADA — e o que isso muda no risco

O commit `8d753cd` subiu com `NAO PUSHAR ATE A PROVA NO PAPEL` no corpo. **Essa trava foi
levantada por decisão do Bruno em 05/08/2026**, e o motivo é bom: a máquina que tem a ZD220 não
roda ambiente local, então a prova no papel **só é possível com o código em nuvem**. A trava
estava impedindo a própria prova que ela exigia.

Consequência — e é ela que precisa ficar escrita, porque o corpo do `8d753cd` ainda diz o
contrário: **os quatro itens da fila continuam pendentes, e agora estão pendentes COM O CÓDIGO NO
AR.** Antes, um layout errado morria no repositório local. Agora, se o layout falhar no papel, ele
falha em nuvem, na validação, com o operador na frente da impressora.

### Fila da ZD220 — etiqueta IMPRESSA e ESCANEADA, não simulação

1. **Nome em 3 linhas** legível, sem sobreposição e sem encostar no `NF · data`
   (pior caso: SKU `3.01.0271`, 112 chars)
2. **Barcode h=120 em y=266** escaneando com a etiqueta amassada dentro do plástico — a condição
   real de bipagem, não de bancada
3. **Caminho de sucesso da impressão** — herdado da dívida (i), pendente desde `3fc809b`
4. **Botão "Reimprimir etiquetas"** — herdado da dívida (i), pendente desde `3fc809b`

Os quatro fecham na mesma sessão de impressora, com um único lote de etiquetas.

**Por que ainda não está provado**: os ~53 chars/linha do `^A0N,26,26` são estimativa de fonte
proporcional. Capacidade real de fonte proporcional só o papel confirma.

**Se o item 1 falhar**: o ajuste é o TERCEIRO parâmetro do `^FB` (espaçamento entre linhas, aceita
negativo), NÃO reposicionar campo — as posições saem de uma conta com 4 dots de folga de cada lado
do barcode e 7 dots entre o banner do reuse e a borda do papel. O alerta está no código, no ponto
onde alguém com pressa iria mexer.

**Prioridade**: ALTA até a prova sair. Não é dívida de código — é dívida de VERIFICAÇÃO, e some
sozinha no dia em que uma etiqueta correta for impressa e escaneada.

## (n) Falta o CHECK no banco sobre o formato do e-mail de acesso

**Causa**: a identidade de login é `NNN@fluxoroyale.local` e o "código" é o local-part, mas
`users` só tem `email TEXT` com `UNIQUE (email)` e `PRIMARY KEY (id)` — **nenhum CHECK de
formato**. A convenção passou a ser sustentada em quatro camadas (modal, validação do front,
`POST /auth/register`, `FRAuth.login`), todas em código de aplicação. O banco continua aceitando
qualquer string.

**Consequência**: um INSERT direto, um script de seed, uma migration futura ou um endpoint novo
que esqueça a regra recria contas inalcançáveis pelo login por código — exatamente o buraco que as
quatro camadas fecharam por cima.

**Conserto proposto** (migration, repo do BACKEND):

```sql
ALTER TABLE users ADD CONSTRAINT users_email_codigo_chk
  CHECK (email ~ '^[0-9]{3}@fluxoroyale\.local$');
```

Verificado em 05/08/2026 na validação: os 7 usuários existentes passam no CHECK, então ele entra
sem `NOT VALID` e sem limpeza prévia. **Conferir de novo no host de produção antes de aplicar** —
lá o conjunto de usuários é outro.

Nota: o CHECK aceita `000@fluxoroyale.local`, que as camadas de aplicação rejeitam (faixa 1–999).
Fechar isso em SQL exige `substring(...)::int BETWEEN 1 AND 999`; a versão simples já cobre o caso
real, e o zero é barrado antes de chegar ao banco.
**Escopo**: uma migration.
**Prioridade**: MÉDIA — as quatro camadas de cima cobrem o caminho normal; isto é a rede embaixo.

## (o) `users.role` (enum) coexiste com `profiles.role` (text)

**Causa**: `users` tem uma coluna `role` de tipo USER-DEFINED (enum do Postgres) e `profiles` tem
`role TEXT`. O `POST /auth/register` grava **só** `profiles.role`; o `login` lê **só**
`profiles.role` (`auth.controller.ts:43`) e é dela que sai a `role` do JWT. A coluna `users.role`
não é escrita por esse caminho.

### MEDIDO no smoke de 05/08/2026 — não é mais suspeita

O registro anterior dizia "provavelmente parada no tempo". **É pior que isso, e agora está
medido**:

```
users.role    = 'setor'   em TODOS os 8 usuários, INCLUSIVE no admin 001
profiles.role = 'admin' | 'almoxarife' | 'desenvolvimento' | 'gerente' | ...
```

**Causa da uniformidade**: o `INSERT` do `register` lista apenas
`(email, encrypted_password, is_active)` — `users.role` nunca é escrita e fica no **DEFAULT do
enum**. Não é dado desatualizado, que ao menos já foi verdade um dia: é **constante e errada**.

**Quem manda, provado**: o JWT do usuário 003 (criado no smoke com cargo `desenvolvimento`) veio
com `role: 'desenvolvimento'`. Se o login lesse `users.role`, teria vindo `'setor'`. A fonte de
verdade é `profiles.role`, sem ambiguidade.

**Consequência**: qualquer código futuro que leia `users.role` como fonte de verdade **trata o
admin como `setor`**. Dependendo do sentido do gate, isso é negação de acesso a quem tem direito ou
concessão a quem não tem. Parente direta da dívida (f) — RBAC lendo a role errada é furo de
permissão, não detalhe cosmético.

**Conserto candidato**: ou `users.role` sai do schema, ou passa a ser preenchida corretamente e uma
das duas vira derivada da outra. **Exige recon antes de tocar**: quem lê a coluna hoje, se há
trigger, view ou código legado dependendo dela, e se o enum ainda casa com a matriz RBAC. Dropar
coluna que alguém lê em silêncio troca uma dívida por um incidente.
**Escopo**: recon primeiro; a correção depende do que ele achar.
**Prioridade**: MÉDIA — não morde hoje porque ninguém lê a coluna; morde no dia em que alguém ler.

## (p) `POST /auth/login` não normaliza o e-mail no servidor

**Causa**: `auth.controller.ts:23` faz `SELECT * FROM users WHERE email = $1` com o valor cru do
body. Quem normaliza é o front (`FRAuth.login` monta o e-mail a partir do código, sempre em
minúsculas). O `register` grava `trim().toLowerCase()`, então o dado no banco é minúsculo.

**Consequência**: hoje **não morde** — o único cliente é o nosso front, que sempre manda
normalizado, e agora o e-mail nem vem mais do usuário: é montado a partir de um código numérico.
Morderia um cliente novo (script, integração, app) que mandasse `001@FLUXOROYALE.LOCAL`: o login
falharia com "Usuário não encontrado", mensagem que aponta pro lugar errado.

**Conserto**: `LOWER(email) = LOWER($1)` na query, ou `trim().toLowerCase()` na borda do
controller — a segunda é mais barata e não atrapalha o índice `users_email_key`.
**Escopo**: uma linha.
**Prioridade**: BAIXA — depende de um cliente que ainda não existe.

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

## Régua — smoke que exige provar login deixa resíduo permanente

**Descoberto em 05/08/2026**, no smoke do cadastro por código. O critério de aceite era "criar o
usuário e provar que ele loga". O cleanup planejado era hard-delete por id. **Os dois são
incompatíveis por construção**: o login grava um `audit_logs` com `user_id` do novo usuário, e a FK
`audit_logs.user_id → users.id` é `NO ACTION`. O `DELETE /users/:id` devolveu **409** — como o
próprio backend documenta: *"Usuário tem histórico vinculado e não pode ser excluído. Use a
suspensão da conta."*

Não é bug. É a auditoria funcionando: **`audit_logs` é append-only e não se edita por conveniência
de limpeza.** Apagar o registro de LOGIN para viabilizar o hard-delete seria destruir a trilha para
esconder o rastro de um teste — exatamente o que a auditoria existe para impedir.

**A régua**: quando o smoke precisa provar autenticação, o cleanup **não é** hard-delete — é
**suspensão** (`is_active = false`). O usuário de teste fica, suspenso e nomeado, e a trilha fica
inteira. Planejar hard-delete nesses casos é planejar um cleanup que vai falhar no fim, quando o
dado já está gravado.

**Aplicado**: o `003@fluxoroyale.local` (nome "Smoke Codigo 003") vive na validação com
`is_active = false` e um `audit_logs` de LOGIN preservado. Estado final: 8 usuários, 1 ativo.
