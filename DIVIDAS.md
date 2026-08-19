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

## ~~Socket morre depois da reconexão esgotada e nada o re-arma~~ — CONSERTADA em 06/08/2026, COM COBERTURA PARCIAL DECLARADA

**Conserto no commit `1cd54ca` (front).** As três camadas foram implementadas: (a) backoff que
nunca desiste, (b) re-arme na volta do foco/visibilidade, (c) terceiro estado honesto na faixa. A
descrição do defeito fica abaixo, preservada, porque é o registro de como ele foi medido.

**Fica FECHADA, não apagada, e com a cobertura declarada** — parte do conserto foi medida, parte
não. Ver "Pendência de verificação" logo abaixo. Fechar uma dívida escondendo o que não foi medido
seria trocar um defeito por uma mentira mais cara.

### O que FOI medido, ponta a ponta (smoke de 06/08/2026, 7 provas)

- **Re-arme por backoff**: `reconnect_failed` (no **Manager**, `s.io` — no socket nunca dispararia)
  às 39,8s; tentativas às 70,4s, 129,1s e 250,1s. Escada 30s → 60s → 120s respeitada, sem martelar.
- **Reconexão quando o backend volta**: reconectou às 251,1s e o âmbar sumiu.
- **Identidade respeitada no re-arme** (a prova negativa, a mais importante): com re-arme pendente e
  token de outro usuário gravado no storage da própria aba, **não abriu socket** — `validarSessao()`
  devolveu divergente, a sessão caiu com `motivoSaida: 'substituida'`. Reconectar com token
  divergente seria pior que não reconectar.
- **Sem listener duplicado e sem timer empilhado**: os listeners de foco/visibilidade são
  registrados uma vez no módulo; `agendarRearme` tem guarda de um timer pendente por vez.
- **Timer cancelado no logout**: `disconnect()` cancela o re-arme antes de soltar a referência, e
  desliga o `reconnect_failed` no **manager** (que `removeAllListeners()` do socket não alcança).
- **Volta ao foco com socket morto reconecta na hora** — medido com aba genuinamente oculta,
  backend de volta (HTTP 200 e socket morto no mesmo instante) e o degrau seguinte a 39s de
  distância: reconectou no instante da volta, não no vencimento do timer. ⚠️ **Este verde é do
  build ANTERIOR à janela anti-duplo** — ver a pendência.

### ⚠️ PENDÊNCIA DE VERIFICAÇÃO — a janela anti-duplo não foi medida

`JANELA_ANTI_DUPLO` (3s, `socket.js`) **não foi medida de ponta a ponta**. A prova da volta ao foco
que está verde é do build **anterior** à correção.

O que sustenta a mudança é a **medição do defeito**, não a medição do conserto: no instante da volta
ao foco saíram **4 notificações**, não 2 — `visibilitychange` e `focus` são a mesma transição e
disparavam duas tentativas, com a segunda derrubando o socket que a primeira acabara de abrir.

**Por que não foi medido**: o gatilho real de troca de aba nesta máquina só existe por teclado do
SO. `SetForegroundWindow` foi bloqueado pelo Windows e o atalho vazou para uma janela de terceiro
(uma planilha do Excel, em Modo de Exibição Protegido). E só há **uma** janela do Chrome na máquina
— a de trabalho do Bruno. Insistir significaria sequestrar o foco dele. O instrumento foi parado.

**Como fechar, numa sessão com navegador livre**: socket morto, aba oculta, backend no ar, degrau
longe de vencer; trazer a aba ao foco e **contar as notificações — tem que ser 1, não 2 nem 4**.

### O defeito original, como foi medido

Medido em 06/08/2026, no smoke da fase 3 da dívida (f). **Pré-existente** — o `if (socket) return`
antigo tinha exatamente o mesmo efeito. Não é regressão da fase 3.

**O mecanismo**: `io()` sobe com `reconnectionAttempts: 5` (`socket.js`), que esgota em ~17s de
backend fora. Depois disso o Socket.IO desiste **permanentemente** daquela instância, e **nada
re-arma**: `FRAuth.subscribe` só chama `connect()` numa transição de autenticação, que não ocorre
numa sessão já logada. Medido: derrubei o backend por ~15s, ele voltou, e o socket ficou
`isConnected: false` indefinidamente. Só um F5 ou um novo login trazem o tempo real de volta.

**A consequência operacional**: separação confirmada não aparece, chamado novo não notifica, fila
não acorda. O dado continua correto — todo GET é autoritativo —, mas a tela para de se mexer
sozinha e o operador segue trabalhando achando que nada aconteceu.

### CORREÇÃO ao que eu havia reportado: NÃO é silencioso na tela

Ao levantar o conserto candidato (c) verifiquei o `FrNetBanner` e ele **já é dirigido pelo socket**
(`erpframe.jsx:277-296` assina `FRSocket.subscribe` e lê `isConnected`, com debounce de 2s) — não
pelo `navigator.onLine`. Então a faixa vermelha **aparece e fica**.

O defeito é outro, e é mais sutil: a faixa diz **"Sem conexão — verifique a rede"**, e a rede está
ótima — quem desistiu foi o cliente. O operador confere a rede, encontra tudo funcionando, conclui
que a faixa é frescura da tela e **aprende a ignorá-la**. Um aviso que ensina a ser ignorado é pior
que a ausência de aviso. E ele não diz a única coisa que resolveria: recarregue a página.

### Consertos candidatos — os TRÊS foram aplicados

- **(a) Re-arme por evento**: `reconnect_failed` dispara nova tentativa com backoff longo. ✔
- **(b) Re-arme na volta do foco/visibilidade da aba** — barato e cobre o caso real (o operador
  volta para a aba depois de um tempo). ✔
- **(c) Texto honesto na faixa** quando o socket desistiu: distinguir "sem rede" de "tempo real
  parado". ✔ — com uma correção do desenho original: a faixa **não** manda recarregar a página,
  porque o re-arme já está tentando. Mandar F5 seria empurrar para o operador um trabalho que o
  código passou a fazer sozinho.

### ⚠️ Cuidado que o conserto respeitou

Re-arme tem que passar pelo detector da fase 4: **reconectar com token divergente é pior que não
reconectar**. Um re-arme cego depois de um segundo login em outra aba abriria socket novo com a
identidade errada — exatamente a classe (f) que estas fases fecham. `tentarRearme()` chama
`FRAuth.validarSessao()` antes de tocar no socket, e foi essa a prova negativa do smoke.

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

> ### ✅ FECHADA em 06/08/2026 — quatro fases, dois repositórios
>
> | Fase | SHA | O que cobriu |
> |---|---|---|
> | 1 | `efb8273` (front) | A **exibição**. O rodapé deixou de ler o global `USER` (mock mutado em `useEffect`) e passou a ser estado React assinado ao `FRAuth` (`useFRIdentidade`). O chip `"Geral"` chumbado do Meus Pedidos saiu. **Fecha os casos 2 e 4.** |
> | 2 | `de0abc0` (backend) + `9646900` (front) | O **dado gravado**. `POST /requests` deriva `profiles.sector` do token; Meus Pedidos parou de mandar identidade no corpo. Era a única das quatro que **gravava** errado, não só exibia. |
> | 3 | `2430ac6` (front) | O **socket**. `connect()` deixou de ser no-op cego (early-return só com o MESMO token), `login()` desconecta antes, e os 3 listeners de segurança comparam com a identidade **corrente**, não a da closure. **Fecha o caso 3.** |
> | 4 | `aaad1ba` + `a387c17` (front) | A **classe inteira**. Etapa 0: `restore()` confere coerência (`jwt.id` × `user_data` × `user_profile` + `exp`) e o token virou o **último** write do `login()`, como marcador de commit. Etapa 1: o **detector** — interceptor (garantia: a request divergente não parte) + listener de `storage` (imediatez: as abas obsoletas caem na hora). **Fecha o caso 1.** |
>
> **Provado em nuvem** (06/08, `fluxo-royale50.vercel.app` + Render `de0abc0`): login e F5 não derrubam
> nada e o console fica mudo; com duas abas e atores diferentes, a primeira cai com
> `FR_SESSAO_DIVERGENTE`, `status: null` (a request **não virou tráfego**) e a mensagem nomeada na
> tela. A aba legítima segue intacta.
>
> **NOTA — limitação conhecida, e é nota, não dívida nova:** o detector compara por `jwt.id`. Dois
> tokens do MESMO usuário não disparam divergência — isso é **desejado** (é o caminho de renovação
> legítima). Mas o JWT também carrega `role`: se um dia o cargo puder mudar **sem re-login**, um
> token antigo do mesmo usuário com role diferente passaria pelo detector. Hoje não morde — trocar
> cargo emite `role_permissions_updated`/`user_permissions_updated` e o socket força logout. Comparar
> `role` no detector criaria falso positivo no caminho legítimo, e por isso não foi feito.
>
> **O que a mitigação operacional deixa de ser necessária:** "uma aba por operador e logout explícito
> ao trocar de pessoa" era a regra de contenção enquanto isto não fechava. O segundo login agora
> derruba a aba antiga sozinho, com aviso.
>
> O texto abaixo é o registro original do que foi encontrado, mantido como está.

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

> ### ✅ PARTE PERIGOSA FECHADA em `9363d2a` (backend, 06/08/2026)
>
> O **agravante do CORS acabou**: `https://fluxo-royale50.vercel.app` entrou no fallback e os dois
> domínios do 2.0 saíram. Não depende mais da env `CORS_ORIGINS` para o front real funcionar —
> o cenário "a env some num redeploy e o sistema fica indisponível" deixou de existir.
>
> A remoção dos dois vizinhos foi **verificada, não presumida**: o bundle publicado de cada um
> aponta para backend próprio (`fluxo-royale-backend.onrender.com` e
> `fluxo-royale-backend2-1.onrender.com`) e **nenhum contém a string `fluxo5-0-backend`**.
>
> **O QUE RESTA** é só a convivência dos dois apps de nome parecido, descrita em "Consequência do
> lado humano" abaixo: **prioridade MÉDIA, decisão de produto** (aposentar, renomear, ou documentar
> em ambos os READMEs qual domínio serve qual repo). Risco de infraestrutura: zero. Risco humano:
> o mesmo de sempre — alguém abre o app errado e reporta bug fantasma.
>
> O texto abaixo é mantido como estava, para registro do que foi encontrado e por quê.

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

**Conserto**: ~~`https://fluxo-royale50.vercel.app` entra no fallback; os dois domínios do 2.0 saem,
se não houver razão para estarem lá.~~ **FEITO em `9363d2a`** — a "razão para estarem lá" foi
investigada e não existia (cada vizinho tem backend próprio). O trecho de código citado acima é o
estado ANTIGO do `cors.ts`, preservado para explicar o que se encontrou; o arquivo atual já lista
o front real.
**Escopo**: uma linha. **Prioridade**: ~~MÉDIA-ALTA~~ — **resolvido**.

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

## Reposições — aviso ao fechar detalhe cujo status migrou de aba (recusado na rodada do fix de montagem)

**Registrado em 17/08/2026** (decisão do arquiteto, C4 da rodada "detalhe sobrepondo a lista").
Medição provou que o detalhe SOBREVIVE ao refetch (o `cur` ancora no array completo, o filtro por
aba é só de exibição) — nenhum fix foi necessário; virou prova de regressão no harness. O que ficou
como dívida é o polimento recusado: **ao fechar um detalhe cujo status mudou** (ex.: salvou
separação e o pedido migrou de Pendentes para Em preparo), o operador cai na aba antiga e o pedido
"sumiu" dela. Desenho aprovado para quando for implementar: **toast no ramo da LISTA** (estado no
pai, render nos dois ramos — o `toastEl` já existe) informando o novo estado do pedido. Explicitamente
recusado: `setTab` automático ao fechar (troca um susto por outro). Sem prova sem operador — não
implementar até haver rodada com validação de uso real.

## Reposições/Separações — contagens de disponibilidade leem o rascunho VIVO (decisão de produto, não dívida)

**Decidido em 17/08/2026** (veredito do arquiteto no P-TETO da rodada "detalhe sobrepondo a
lista"). As contagens de disponibilidade (`separaveis`/`bloqueados` nas Reposições, `dispCount`
nas Separações — separacoes.jsx:534) **leem o rascunho corrente por design**: rascunhar um item
até o teto o tira de "disponível p/ separar" e o resto sem estoque vira "bloqueado" na hora,
porque é a verdade do AGORA do rascunho. O que é IMÓVEL é o **TETO**: ancorado em
`rep.itens[i].sep` (o salvo do servidor, via `repTetoDe`), re-ancorado SÓ no refetch pós-save —
provado sob incrementos sucessivos (18 cliques, clamp de 999 no teto original, `+` morto no
limite, zero rede). **Divergir disso — congelar as flags no salvo ou realimentar o teto do
stepper — reintroduz a divergência que o C2 matou.** A sub-asserção "flags não mudam sob
incremento não salvo" foi descartada pelo próprio arquiteto: ela descrevia a assinatura do teto
móvel, não a régua das flags.

## Confronto — "Confronto de ajuste" é a única peça do ref21 deliberadamente ausente

**Registrado em 17/08/2026** (D-C1 da rodada de transplante visual do Confronto). O ref21
desenha um segundo confronto pós-finalização ("ajuste", com badge AJUSTADO no card). O backend
rejeita por construção (`VIAGEM_JA_RECONCILIADA`, travels.controller.ts:133/:252) e o botão já
havia sido REMOVIDO na rodada de 24/07/2026 que colapsou os 4 estágios do mock nos 2 reais.
Decisão do arquiteto nesta rodada: **não volta nem desligado** — não há motivo novo. Reabrir é
peça própria (rota de reabertura no backend + trilha no ledger), não um botão de front.

## Overlays — o drawer do Confronto inaugura ESC + gestão de foco + trava de scroll de trás

**Registrado em 17/08/2026** (C6, decisão do arquiteto). O TripDetail-drawer do Confronto é o
PRIMEIRO overlay da casa com os três comportamentos: fechar por Escape, foco no painel ao abrir
com devolução ao card acionador ao fechar, e trava do scroll de trás (wheel/touchmove com
preventDefault no backdrop — listener nativo com passive:false, porque o onWheel sintético do
React é passivo — mais overscrollBehavior:'contain' no scroll interno). **RepPickerDrawer e os
demais overlays da casa NÃO têm esses comportamentos — divergência consciente, sem plano de
conserto nesta entrada.** O padrão vigente para overlays novos passa a ser o deste drawer.


## `DECIMAL_UNITS` — quatro cópias da mesma lista, e nenhuma é fonte

**Registrado em 17/08/2026** (lote R2, Inventário). A lista de unidades que aceitam fração
(`M`, `MT`, `L`, `KG`) existe hoje em **quatro** lugares, cada um com o seu comentário dizendo que
espelha outro:

| onde | quem usa |
|---|---|
| `src/parts/conferencia.jsx:11` | validação e `inputMode` da Conferência de Envio |
| `src/parts/pages_main.jsx` (`INV_DECIMAL_UNITS`, lote R2) | Inventário: recontagem rápida e planilha |
| backend `requests.controller.ts:15` | teto/validação da conferência de solicitação |
| backend `stock.controller.ts` (`RECOUNT_DECIMAL_UNITS`, lote R1) | `POST /stock/recount` |

Copiar foi decisão do lote (padrão da casa para helper local; promover a lib no meio do lote
criaria uma quinta convenção). **O risco é real e nomeado**: se as listas divergirem, a tela passa
a aceitar um valor que a API recusa — ou pior, a recusar um que a API aceitaria. A régua enquanto
não houver fonte única: **a tela nunca pode ser mais permissiva que o servidor**.

Duas decisões de vocabulário que as quatro cópias hoje respeitam e que precisam continuar juntas:
`UND` (36 produtos ativos) fica **FORA** — é sinônimo de unidade, não medida contínua; `MT` fica
**DENTRO** por fidelidade à lista original, embora o catálogo só use `M` (192 produtos).

**Saída**: um único módulo (`src/lib/units.js` + o espelho no backend) exportando o Set e o
`isDecimalUnit`, com um smoke que compara as duas pontas. Lote próprio.

## Geradores de chave de idempotência — cinco cópias, todas com fallback

**Registrado em 17/08/2026** (lote R2); **atualizado em 18/08/2026** (lote F1). O front tem **cinco**
geradores locais da âncora `X-Idempotency-Key`: `devGenKey` (`devolucao.jsx:31`), `genKey`
(`pages_admin.jsx:127`), `p3GenKey` (`producao3d.jsx:176`), `pgGenKey` (`producaoger.jsx:29`) e
`tsGenKey` (`pages_rest.jsx:1403`, criado pelo F1) — `pgGenKey` é o **único exposto no `window`**, e é
o que o Inventário e o Recebimento reusam. Todos fazem
`crypto.randomUUID?.() ?? 'prefixo-' + Date.now() + random`, com o fallback existindo por um motivo
concreto: **`crypto.randomUUID` é `[SecureContext]` e não existe em contexto não-seguro**
(`http://IP-LAN`), que é exatamente como o chão de fábrica acessa o sistema.

Uma divergência de forma que sobra: `devGenKey` usa o ternário antigo
(`crypto.randomUUID ? crypto.randomUUID() : ...`), sem o comentário que nomeia o motivo; as outras
quatro usam `?.() ?? `. Equivalentes na prática — o `crypto` em si existe em qualquer contexto, só
`randomUUID`/`subtle` são gated —, mas é uma forma a menos para a unificação padronizar.

### ✅ RESOLVIDO em 18/08/2026 (lote F1) — `pages_rest.jsx:2088`: a saída de material morria em `http://IP-LAN`

**Ficava aqui como AÇÃO PRIORITÁRIA. Foi consertado; o registro fica pelo aprendizado.**

`pages_rest.jsx:2088` chamava **`crypto.randomUUID()` CRU**, sem fallback, para gerar a chave do modal
de **saída de material** (`POST /travel-orders`, a rota que RESERVA estoque):
`onClick={() => { setErroModal(null); setSaida({ key: crypto.randomUUID() }); }}`. Como `saida` é o
próprio interruptor de montagem do modal (`{saida && <SaidaModal …/>}`), o `TypeError` no handler
deixava a tela **muda**: o operador clicava e não acontecia nada — sem toast, sem erro, sem saída.
Não era chave degradada; era a operação inteira que não começava.

**Conserto**: `tsGenKey`, cópia local em escopo de módulo (`pages_rest.jsx:1403`), forma
`crypto.randomUUID?.() ?? 'ts-' + Date.now() + random`. **Cópia local, não `window.pgGenKey`** —
`pgGenKey` é membro da família `pg*` da Produção (mesmo `Object.assign` de
`pgOpsAbertas`/`pgErr`/`pgDateTime`/`pgNum`), não helper geral: usá-lo no Confronto acrescentaria
acoplamento de DOMÍNIO por cima do de ORDEM (`main.jsx` importa `pages_rest` :45 ANTES de
`producaoger` :55 — funcionaria só porque o `onClick` difere a leitura). É o mesmo argumento que
barrou o compartilhamento de `sepItemFlags` no C2 das Reposições.

**O que a prova mediu** (jsdom sobre o `dist` real, clique no botão renderizado, nos dois estados):
ANTES → `Uncaught [TypeError: crypto.randomUUID is not a function]`, modal não monta, zero chaves.
DEPOIS → modal monta, 1000/1000 chaves únicas no formato de fallback, zero vazias. Em `https` o
caminho normal segue sendo o `randomUUID` (1002 chamadas, nenhuma chave `ts-`).

**A lição que fica**: o defeito era invisível em qualquer teste feito por `https`. Toda tela que
nasce com âncora de idempotência precisa ser exercitada **também** em contexto não-seguro, porque
`http://IP-LAN` é o acesso real do chão de fábrica — não um cenário de borda.

**Saída da unificação (ainda pendente)**: promover um `frGenIdemKey` único ao `window` e trocar as
**cinco** cópias por ele. Continua sendo lote próprio: agora é dívida de forma, não tela morta.

## Inventário — o que o lote R2 deixou de fora, de propósito

**Registrado em 17/08/2026.** A tela nova cobre recontagem de um item e planilha em lotes de 500.
Três coisas ficaram nomeadas e fora:

1. **Sem desfazer.** Recontagem errada se corrige recontando de novo (o `POST /stock/recount` é
   absoluto e cada sessão tem chave própria, então a segunda contagem vale). Não há botão de
   reversão porque não há rota de reversão — e inventar uma no front seria mentira de UI.
2. **A lista "recontados nesta sessão" morre ao fechar o modal.** É estado de sessão, não
   histórico: o histórico verdadeiro é o `audit_logs` (`STOCK_RECOUNT`) e o `stock_ledger`. Uma
   aba de histórico de contagens é peça de produto, não detalhe desta tela.
3. **A action `STOCK_RECOUNT` aparece CRUA na Auditoria** — pendência herdada do lote R1 (o mapa
   `AUDIT_ACTIONS` de `src/lib/audit_format.js` não tem a entrada). O `details` já vem no formato
   que a narrativa precisa: `{ idem_key, total_itens, aplicados, replays, com_diferenca, itens: [{ product_id, sku, old_qty, new_qty }] }`.

## PROCEDIMENTO — desmonte de worktree com junction de `node_modules`

**Promovido de régua a PROCEDIMENTO em 17/08/2026, depois de falhar DUAS VEZES no mesmo dia**
(worktree do backend no lote W1 e worktree do front no R2), **estando já registrada**. Registrar
não bastou: o que faltava era o passo 4.

O worktree usa uma **junction** para reaproveitar o `node_modules` do repositório original. Junction
não é cópia: quem apaga o link *seguindo-o* apaga **as dependências do repo de verdade**. O dano é
silencioso — só aparece no lote seguinte, quando o build não acha o `vite`.

```
1. cd para FORA do worktree
2. cmd /c rmdir "<worktree>\node_modules"      # remove o LINK, nunca o alvo
3. git worktree remove <worktree>              # (ou rmdir sem -Recurse)
4. VERIFICAR antes de declarar desmonte concluído:
   ls <repo-original>/node_modules | wc -l     # tem de continuar na casa das dezenas
```

**Por que o passo 2 é literalmente esse comando** — as três alternativas óbvias estão erradas:

| tentativa | o que acontece |
|---|---|
| `rm -rf <wt>/node_modules` (bash) | **SEGUE a junction e apaga o alvo** — foi assim que o `node_modules` do front morreu |
| `Remove-Item -Recurse -Force` | idem: recursivo entra no alvo |
| `Remove-Item -Force` (sem `-Recurse`) | pede confirmação para diretório não vazio e **FALHA em modo NonInteractive** — a junction fica de pé, e o `rm -rf` seguinte (que "só limpa o resto") destrói o alvo. Foi a causa da SEGUNDA ocorrência |

**O passo 4 é o que faltou nas duas vezes.** Sem a contagem, o desmonte é declarado concluído com
o repositório original já quebrado, e o custo cai no próximo lote — que perde tempo diagnosticando
um build quebrado que não tem nada a ver com o trabalho dele.

**Reparo, quando acontecer**: `npm ci` no repositório original (o `package-lock.json` é versionado,
então a restauração é idêntica) e reinstalar as dependências efêmeras não salvas — no front, o
`jsdom` do harness, que entra com `--no-save` e por isso não volta no `npm ci`.

## Confronto: o campo de quantidade MULTIPLICAVA POR 10 (corrigido no lote C1)

Registrado em 18/08/2026, ao ligar unidade decimal no Confronto de Viagens.

**Não era truncamento — era corrupção por fator 10.** Os três campos de quantidade da tela
(`setQtd` do SaidaModal, `setVoltou` e `setExtraQtd` do ConfrontoEditor) faziam
`.replace(/[^0-9]/g,'')` **antes** do `parseInt`. A vírgula não era arredondada nem cortada: era
**apagada**, e os dígitos colavam.

Controle negativo, rodado na mesma fixture do harness do C1 (`prova_c1.mjs`):

```
ANTIGO: digitar "2,5" -> campo "25" -> envia 25
NOVO:   digitar "2,5" -> campo "2,5" -> envia 2.5
```

O que fazia disso um problema de SALDO e não de UX: no ramo `extra` do confronto
(`travels.controller.ts:184-189`) o valor vira `StockService.receive(...)`. Informar que voltaram
2,5 m de cabo criava **25 m** no `stock_ledger` — 22,5 m de estoque nascidos do nada, num razão
append-only que não tem UPDATE de correção. No ramo `consumed` a mesma entrada vira
`reverseReceive`, e o guard `on_hand - qty >= reserved` recusaria a baixa inflada — falha barulhenta,
que é a metade sortuda. O `extra` é a metade silenciosa.

**Por que ninguém viu antes**: nenhum confronto do 5.0 chegou a rodar em produção. As 43 viagens
`reconciled` do banco vêm do corte 2.0→5.0 e têm ZERO linha em `stock_ledger` (medido em
`ep-steep-breeze`, 18/08). O bug estava armado, não disparado.

### As 4 linhas fracionárias que o 5.0 não conseguia reproduzir

Medido em produção no mesmo dia, `travel_order_items` tem 4 linhas com `quantity_returned`
fracionário — todas unidade `M`, todas `extra`, todas em viagens sem razão (isto é: **dados
herdados do 2.0**):

| SKU | Produto | unit | returned |
|---|---|---|---|
| 3.04.0076 | CORRENTE ASA 40 PASSO 1/2 DUPLA SEM PINO | M | 3.9 |
| 3.03.0001 | ESTEIRA AZUL E25C 2.2 L - 330,2MM | M | 13.5 |
| 3.03.0004 | ESTEIRA AZUL E25C 2.2 L - 419,1MM | M | 8.6 |
| 3.03.0098 | ESTEIRA UNIRONS E15 VAZADA ACETAL L=280MM POR METRO | M | 7.1 |

O 2.0 conseguia gravar 3,9 m; o 5.0, não. **A capacidade foi perdida na portação**, e este lote a
devolve. As colunas nunca foram o limite: `quantity_out` e `quantity_returned` são `numeric` sem
escala, sem CHECK, e o backend só recusa negativo.

### Regra adotada, e o que ela NÃO faz

Unidade decimal (`M`/`MT`/`L`/`KG`) aceita fração; unidade de contagem segue inteira. Fração em
unidade de contagem é **recusada, não arredondada** — mesma escolha do backend
(`requests.controller.ts:482` lança `VALIDACAO_QTD` em vez de arredondar): arredondar decide pelo
operador uma quantidade que ele não digitou. Dois separadores (`"2,5,3"`) também são recusados, e
pela mesma razão — reescrever para `2,53` seria a corrupção silenciosa de novo, com outra cara.

Piso: `> 0` para unidade decimal (levar 0,5 m de cabo é legítimo) e `>= 1` para contagem. O piso
saiu do `onChange` e virou validação de envio — antes o `Math.max(1, …)` por tecla impedia
**apagar o campo** para redigitar.

### DECIMAL_UNITS: a 4ª cópia foi evitada, DUAS continuam de pé

`conferencia.jsx:11` e `pages_main.jsx:567` (`INV_DECIMAL_UNITS`) declaram o mesmo
`new Set(['M','MT','L','KG'])` como const de arquivo — a arquitetura window-globals do design não
deixa um `part` importar do outro. Em vez de plantar uma terceira cópia dentro de
`pages_rest.jsx`, a régua foi para **`src/lib/adapters.js`** (`window.FRAdapters.isDecimalUnit`),
que é a camada que os parts já consomem — `pages_rest.jsx` chama `FRAdapters.parseNumber` via
`repNum` desde sempre.

**Fica a dívida**: migrar `conferencia.jsx` e `pages_main.jsx` para `FRAdapters.isDecimalUnit`.
São 3 definições do mesmo Set no front e mais uma no backend (`requests.controller.ts:16`); hoje
todas concordam, e o dia em que uma mudar sozinha a tela vai aceitar fração que o servidor recusa.

⚠ A comparação normaliza com `trim()` + `toUpperCase()` e isso **não é cosmética**: produção tem
`'UND '` **com espaço no fim** em `products.unit` (texto livre, 1 produto, 2 linhas de item).
Comparação crua joga o item no ramo errado em silêncio. Há prova dedicada para esse caso (P2).

## Confronto: teto de estoque na saída, e de onde ele bebe (lote C2)

Registrado em 18/08/2026.

**O backend nunca esteve desprotegido**: `createTravelOrder` passa por `StockService.reserve`, que
compara contra `available = on_hand − reserved` **sob `FOR UPDATE`** e lança `RESERVA_INSUFICIENTE`,
mapeado para 400. O furo era só de tela: o `setQtd` do SaidaModal tinha piso e nenhum teto, e o
`valid` do botão não olhava estoque. O operador montava a saída, clicava, e só então descobria.

### A fonte do teto, e por que ela é legítima

`GET /products` (`products.controller.ts:64-68`, medido em `b114199`):

```sql
WITH pooled AS (
  SELECT product_id, SUM(quantity_on_hand) AS on_hand, SUM(quantity_reserved) AS reserved
    FROM stock WHERE op_id IS NULL AND warehouse_id = $1 GROUP BY product_id
)
```

com `$1 = getAlmoxId`. É **exatamente a linha que o motor trava** — mesmo produto, mesmo armazém,
mesmo `op_id IS NULL`. Por isso este teto vale: ele não é uma estimativa parecida, é o mesmo
número. Vale registrar o contraste: há **5 leitores de disponível que NÃO filtram armazém**
(`products.controller.ts:115`, `producao3d:34`, `system:28`, `system:241`,
`replenishments:25`) — se a tela do Confronto bebesse de um deles, o teto inflaria assim que
houvesse saldo em armazém de setor. Não é o caso; **é o caso das Reposições**, que leem de
`/replenishments`. Fica anotado para quem for mexer lá.

### O disponível é lido do `produtos`, NUNCA do item

`addItem` faz `{ ...c, levou: '1' }` — `it.disponivel` é **cópia congelada** do instante em que o
item entrou na lista. `produtos` é revalidado por `stock_updated` (`frUseStockReload`). O teto lê
de `produtos` por `product_id`; ler do item deixaria o teto preso no valor velho enquanto uma NF
ou outra tela mexe no saldo. Há prova dedicada (P4) que dispara o `stock_updated` pelo socket real
e confirma que 3 passa antes e trava depois, com controle negativo mostrando que a cópia
congelada teria deixado passar.

**Fail-closed aceito**: produto que sumiu de `produtos` (inativado, ou o `.catch` do fetch que zera
a lista) tem disponível 0 e trava o envio. Barrar é melhor que liberar contra um saldo que a tela
não consegue mais afirmar.

### Folga de ponto flutuante — 1e-9

`disponivel` nasce de uma subtração em JS (`on_hand - reserved`), e `10.3 - 7.8` dá
`2.500000000000001`. Sem folga, o operador que lê "livre 2,5" e digita 2,5 tomaria recusa por erro
de binário. O backend compara em `NUMERIC` exato e não tem esse problema; a folga é só do lado de
cá, e é 1e-9 — muito abaixo de qualquer granularidade real (o menor passo plausível é 0,001).

### Item esgotado: DESABILITA, não esconde

Decisão do lote. Esconder faria o operador concluir que o produto não existe no catálogo e ir
procurá-lo em outro lugar; desabilitado com o rótulo **"sem saldo"** diz a verdade — existe e está
zerado. O `addItem` também recusa por dentro, para o caso de clique em card com estado velho.

### Recusar, não clampar

O teto **não reescreve** o número digitado. Mesma doutrina do C1: quem digitou 15 vê
`pediu 15, disponível 3 M` e corrige; não vê o 15 virar 3 pelas costas. A mensagem cita os DOIS
números de propósito — só "inválido" diz ao operador que ele errou, mas não para quanto corrigir.

### E o TOCTOU continua existindo, por construção

Entre a tela ler o disponível e o clique chegar ao servidor, outra pessoa pode consumir o saldo. O
teto do front reduz a frequência do 400; não o elimina, e não deveria. Quem decide é o
`FOR UPDATE` do motor. O 400 já chega legível à tela pelo `repErr`/`getErrorMessage`.

### ⚠ Defeito que o C1 introduziu e a prova dele não pegou

O C1 passou `levou` de número para **string** (para guardar o "2," intermediário) e converteu o
payload do **ConfrontoEditor** — mas deixou o do **SaidaModal** mandando `quantity: it.levou`, isto
é, a string crua. `createTravelOrder:68` faz `Number(item.quantity)`, e `Number("2,5")` é **NaN**.

Ou seja: o C1 consertou o ×10 do confronto e, no mesmo passo, quebrou a saída decimal — que estava
quebrada de outro jeito antes, então ninguém notou. Corrigido aqui (`quantity: saQtdDe(it.levou)`)
com prova de corpo própria (P8), que lê o objeto que seria enviado e exige `typeof === 'number'`
em todos os itens.

Este regresso esteve **no ar**, entre `679a8ed` e o commit deste lote.

### RÉGUA — prova de corpo nos DOIS formulários

> **Tela com DOIS formulários exige prova de corpo nos DOIS.** O C1 provou o payload do
> `ConfrontoEditor` e ASSUMIU o do `SaidaModal` — mesma classe de erro que fixture pulando o
> adaptador. **Provar uma via e inferir a outra não é prova.**

O `PageConfronto` tem dois modais que escrevem (`SaidaModal` → `POST /travel-orders`,
`ConfrontoEditor` → `POST /:id/reconcile`). Uma mudança de tipo no state (número → string) atinge
os dois, e cobrir um deu falsa confiança sobre o outro. Quando um lote mexer em algo compartilhado
pelos dois formulários, a prova tem de ler **os dois corpos**.

### RÉGUA — instrumento mal mirado inverte o sinal das provas

No próprio C2, duas rodadas inteiras de prova deram resultado FALSO por erro do medidor, não do
código:

1. **`btnEnviar()` pegava o botão "Registrar saída" da PÁGINA**, não o SUBMIT do modal — os dois
   têm o mesmo texto, e o da página nunca desabilita. Resultado: **toda asserção de "TRAVA" passou
   batido** (verde sem o teto existir). Corrigido mirando o ÚLTIMO no DOM, com guarda que assere
   que existem exatamente 2 botões.
2. **`$('input')[0]` era a busca da PÁGINA**, não o campo Destino do modal. O destino ficava vazio,
   `valid` era falso por motivo alheio ao teto, e **toda asserção de "PASSA" falhou** (vermelho com
   o código certo). Corrigido mirando pelo `placeholder`, mais uma LINHA DE BASE que exige o submit
   habilitar com destino+equipe+1 item válido antes de qualquer asserção valer.

> **Instrumento mal mirado inverte o sinal das provas — e verde por instrumento errado é pior que
> vermelho.** Vermelho manda investigar; verde falso encerra o assunto. Toda prova de tela deve ter
> uma LINHA DE BASE que falha primeiro se o instrumento estiver mirando errado, e uma guarda de
> cardinalidade nos seletores que podem casar mais de um elemento.

## Editar viagem: o C3 liga o PUT, e SÓ para 'pending' com razão

Registrado em 18/08/2026.

`PUT /travel-orders/:id` existia desde sempre — com `FOR UPDATE`, movimento por DELTA e op_key
content-addressed pelo alvo — e **nenhuma tela o chamava**. O C3 é sobretudo trabalho de tela.

### O modal é BIMODAL, não duplicado

`SaidaModal` sem `trip` = registrar saída (POST); com `trip` = editar (PUT). Um caminho de código
só, de propósito: a edição herda **de graça** o decimal por unidade (C1), o teto reativo e o payload
numérico (C2). Duplicar o modal duplicaria as três regras — e a próxima correção teria de ser feita
em dois lugares, que foi exatamente o que produziu o regresso do C1 (payload convertido num modal e
esquecido no outro).

### O teto na edição soma o que a viagem JÁ segura

O backend reserva só o **delta** (`updateTravelOrder:276-285`), então o `quantity_out` atual
continua sendo desta viagem. Teto = **já reservado por ela + disponível de agora** — a mesma forma
do `min(qtd, sep + disponivel)` que Separações e Reposições já usavam. Sem essa parcela, editar
10 → 11 seria recusado pela tela sempre que o livre estivesse em 0, **mesmo com o backend
aceitando** (ele só precisa de 1 a mais). Na criação o mapa é vazio e a fórmula colapsa no teto do
C2, sem ramo extra.

### Viagem legada: botão DESABILITADO com tooltip, não escondido

Mesma doutrina do "esgotado" no C2. Esconder faria o operador concluir que a função não existe;
desabilitado com o motivo escrito diz a verdade. O sinal vem do `has_ledger` do backend — e a
composição `!done && hasLedger` mora no adaptador, visível, em vez de num booleano opaco do
servidor. **Ausência do campo (backend velho) é tratada como `false`**: fail-closed, o botão não
nasce habilitado contra um servidor que ainda não sabe responder.

O detalhe do porquê (o que quebra ao editar uma legada) está no DIVIDAS do backend, junto do guard.

### TOCTOU continua, por construção

O teto reduz a frequência do 400; não o elimina. Entre a tela ler o disponível e o PUT chegar,
outra pessoa pode consumir o saldo — e aí quem decide é o `FOR UPDATE` do motor. O
`RESERVA_INSUFICIENTE` chega pelo `repErr` → `getErrorMessage` e é pintado na faixa de erro do
modal, acima do botão. É a mesma porta por onde o `VIAGEM_LEGADA` apareceria se alguém driblasse o
botão desabilitado.

### Sem X-Idempotency-Key no PUT, de propósito

A op_key do backend é content-addressed pelo ALVO (`update:setqty:${newQty}`), então repetir o mesmo
alvo já é no-op por construção. Um header aqui não acrescentaria garantia — só uma segunda âncora
para manter em sincronia. Fica registrado o trade-off que vem junto e **já era conhecido**
(`travels.controller.ts:277-285`): a sequência 10 → 13 → 10 → 13 reusa a op_key `setqty:13`, então
a segunda subida grava `quantity_out = 13` e **o saldo não acompanha**. É edição interativa sob
`FOR UPDATE`, não rota de retry; aceito lá e continua aceito aqui. Provado no PB6 do backend.

## Drawer: a casca foi EXTRAÍDA, e sobraram 2 overlays por migrar (lote C4)

Registrado em 18/08/2026, ao trocar o modal de saída/edição por drawer lateral.

### Procedência da referência — resolvido ANTES de escrever

A tela pedida ("Editar viagem", com Materiais a levar / Catálogo / Selecionados / Salvar
alterações) **NÃO vem do ref21**. Medido:

- `grep "Editar viagem"` em `ref21/` e em `design-export-9/` → **zero ocorrências**. A string nasceu
  no C3 (9dd066c), é nossa.
- o `SaidaModal` do ref21 (`ref21/pages_rest.jsx:1734`) tem assinatura `({ t, onClose, onSave })` —
  **só criação, sem `trip`, sem edição** — e é modal CENTRALIZADO (`placeItems: 'center'`), igual ao
  que rodava aqui até este lote.
- "Materiais a levar" + Catálogo + Selecionados existem nos dois porque o layout do repo já
  descende do design.

Logo: **não é transplante do ref21, é o render do que o C3 pôs no ar.** O pedido é só trocar
modal centralizado por drawer — apresentação. A régua "repo lidera o ref" não chegou a ser
exercida porque não houve divergência a arbitrar.

### FRDrawer: extraído, não a terceira cópia

Este arquivo já tinha DOIS overlays laterais, e nenhum servia de casca:

| | ESC | foco | trava de scroll | reaproveitável? |
|---|---|---|---|---|
| `RepPickerDrawer` (:775) | ❌ | ❌ | ❌ | não — é uma TELA das Reposições |
| `TripDetail` (:1705) | ✅ | ✅ | ✅ | não — inline, preso ao conteúdo (inaugurou o padrão no C6) |
| **`FRDrawer` (novo)** | ✅ | ✅ | ✅ | **é só a casca** |

Copiar o `useEffect` do TripDetail para o SaidaModal seria a terceira cópia do mesmo comportamento
de acessibilidade. Agora ele tem UM lugar.

**⚠ FICA A DÍVIDA**: `TripDetail` e `RepPickerDrawer` **não foram migrados**. São telas que
funcionam, e este é lote de apresentação — migrá-las junto misturaria risco sem necessidade. Então
hoje há **3 overlays laterais e 2 implementações do comportamento** (a do `FRDrawer` e a do
`TripDetail`).

**⚠⚠ E O QUE ISSO SIGNIFICA HOJE, DITO SEM EUFEMISMO: o `RepPickerDrawer` é uma REGRESSÃO DE
ACESSIBILIDADE VIVA.** Não é "ainda não adotou o padrão novo" — é um drawer em produção, na tela de
Reposições, **sem ESC, sem gestão de foco e sem trava de scroll**. Quem abre aquele drawer não
consegue fechá-lo pelo teclado, o foco fica na página de trás e a lista de trás rola por baixo.
Existe desde antes do C6; o C6 inaugurou o padrão sem migrá-lo, e o C4 extraiu a casca sem migrá-lo
também.

Migrar é barato agora: trocar o overlay dele pelo `FRDrawer` e ele ganha os três **de graça**. Está
escrito aqui porque "fica para depois" só não vira "ninguém sabe que falta" quando alguém escreve
que falta.

Mora em `pages_rest.jsx` e não em `ui.jsx` porque os três drawers da casa vivem neste arquivo. Se
aparecer um quarto em outro part, sobe para `ui.jsx` — mesmo critério do `isDecimalUnit` no C1.

### A casca PEDE, não fecha

`aoFechar` é chamado pelo ESC, pelo backdrop, pelo X e pelo arraste do sheet; quem decide é quem
usa. Foi o que permitiu a confirmação de descarte sem a casca saber o que é "sujo".

Diferença deliberada em relação ao `TripDetail`: lá o arraste do sheet some com a folha
(`translateY(100%)`) ANTES de fechar. Aqui a folha volta ao lugar e só então pede — porque o pedido
pode ser **recusado**, e uma folha que já saiu da tela com edição não salva seria mentira visual.

### Descarte: pergunta antes, e a pergunta é INLINE

Fechar drawer é um clique fora. Perder a montagem inteira de uma saída por um clique errado é caro
demais para ser silencioso, então: sem alteração pendente fecha direto (zero atrito); **com**
alteração pendente aparece uma barra de confirmação dentro do próprio drawer.

Inline e não `window.confirm`: o diálogo nativo trava a thread, não é estilizável e não sobrevive a
prova de tela. A barra não fecha nada sozinha — a saída é sempre por clique explícito em
"Descartar", e **nenhum dos dois botões dispara requisição** (provado no PD5).

O "sujo" é uma assinatura do que o operador pode PERDER: destino, equipe e a lista de itens com
quantidade. `roster` e a busca do catálogo ficam de fora — não são trabalho a salvar.

### O que NÃO mudou (e é o ponto do lote)

Nenhuma regra de C1/C2/C3 mudou de lugar: decimal por unidade, teto simples na criação, teto
composto (jáReservado + disponível) na edição, teto reativo por `stock_updated`, payload numérico,
esgotado desabilitado e guard de legada. Todas reprovadas DENTRO do drawer (PD2/PD3), e o modal
segue **bimodal** — drawer só na edição criaria dois caminhos de apresentação sobre a mesma lógica,
que é a duplicação que produziu o regresso do C1.

### RÉGUA — escopo de seletor com drawer sobre página

> **Com drawer sobre página, seletor sem raiz não é escopo, é ILUSÃO de escopo** — o helper caía no
> `document` sem painel aberto e o submit achava o gatilho da página. Quem pegou foi a linha de base
> (PD0), que existe exatamente para isso.

O helper era `(raiz || w.document).querySelectorAll(sel)`. Com o drawer fechado, `raiz` é `null`, o
`||` cai no documento inteiro e `btnSubmit()` encontrava o botão "Registrar saída" do CABEÇALHO da
página — que nunca desabilita. Toda asserção sobre o estado do submit teria medido o botão errado.
Corrigido para devolver **vazio** quando não há raiz. A asserção que pegou é literalmente
`ok('btnSubmit() é null sem painel — o escopo não vaza para a página', ...)`: uma linha de base que
falha ANTES das provas de conteúdo, exatamente o que o C2 mandou passar a fazer.

### RÉGUA — âncora de edição em arquivo com componentes parecidos

> **Busca por padrão genérico em arquivo com N componentes parecidos não é mira**: `s.index()`
> pegou a 1ª ocorrência e editou o `ConfrontoEditor`. Correção: reverter o arquivo inteiro e refazer
> com âncora **ÚNICA**, que **FALHA** quando o alvo não é único.

`pages_rest.jsx` tem três overlays com a mesma abertura (`position: 'fixed', inset: 0, zIndex: 65`).
O `s.index()` do primeiro corte casou o `ConfrontoEditor` e trocou a casca DELE. O erro não apareceu
como exceção — o arquivo continuou sintaticamente válido; só o componente errado tinha mudado.

Duas coisas fizeram a diferença:
- **reverter inteiro** (`git checkout -- <arquivo>`) em vez de tentar desfazer por cima. Edição
  errada sobre edição errada não converge;
- **refazer com `Edit` de âncora única**, que ERRA quando o alvo casa mais de uma vez. A ferramenta
  que falha alto vale mais que a que "dá certo" no lugar errado — é a mesma lógica do verde por
  instrumento errado ser pior que vermelho (régua do C2).

A âncora que serviu foi `display: saMob ? 'flex' : 'grid'` — presente só no `SaidaModal`. Antes de
editar, `grep -c` da âncora: se não der exatamente 1, a âncora não presta.

---

# LOTE B — teto do disponível na saída manual (19/08/2026)

## O input de quantidade é COMPARTILHADO pelos 3 modos

`pages_admin.jsx` usa o MESMO input de quantidade para Entrada NF, Reaproveitamento e Saída. Teto
no input **quebraria a Entrada**, que legitimamente lança mais do que há em estoque. Por isso:
o `onChange` ficou **idêntico**, o aviso na linha só existe quando `saida`, e quem barra o envio é
`handleSaidaConfirmar` — condicionado ao modo. Provado por controle (PF3): no modo NF a linha não
mostra disponível, aceita 9999 sem aviso, e o `POST /stock/entries` continua saindo.

## ⚠ DÍVIDA — o `.replace(/[^0-9]/g,'')` do input de quantidade (insumo da varredura)

`pages_admin.jsx`, input de quantidade das linhas: `e.target.value.replace(/[^0-9]/g, '')`.
**É o mesmo defeito que o C1 matou no Confronto** — o ponto e a vírgula são engolidos, então
quantidade decimal é **impossível de digitar** nesta tela, em qualquer um dos três modos.
**NÃO foi consertado neste lote**, por decisão: pertence à varredura pendente do `.replace`, que
tem de passar por todos os inputs numéricos de uma vez para não deixar a casa meio consertada.
Registrado aqui como insumo dessa varredura. O teto adicionado por este lote **convive** com o
defeito sem piorá-lo: ele lê `Number(r.qtd)`, não reescreve o valor, e não introduz máscara nova.

## Origem do número do disponível: sem rede

`adapters.js` já calcula `disp = onHand − reserved` e já expõe `reserved` no card do produto. A
linha e a revisão da saída leem daí (`useFRProducts`, que a tela já consumia) — **nenhuma chamada
nova** para mostrar o disponível. Menos superfície e um número só na tela.

## FRDrawer subiu para o `window`

A consulta de reserva do Catálogo (`pages_main.jsx`) é o **primeiro consumidor da casca fora de
`pages_rest.jsx`**. Escrever um overlay lateral novo lá seria a **quarta** cópia do mesmo
ESC + foco + trava de scroll — exatamente o que o C4 extraiu para não acontecer. Cross-file só
funciona por `window` (os parts são módulos ESM; `function FRDrawer` é privada do módulo), e a
ordem de import não importa porque `pages_main` lê `window.FRDrawer` em tempo de RENDER.
Segue valendo a nota do C4: **se ela sair de `pages_rest.jsx` de vez, sobe para `ui.jsx`.**

## `FRReservaOrigens` é apresentação ÚNICA, e consome o shape CRU

O mesmo componente desenha a recusa da saída e o painel do Catálogo, a partir do MESMO payload do
MESMO helper de servidor. Ele consome **snake_case cru do endpoint** de propósito: adaptar ali
esconderia mudança de contrato. Se as duas telas divergirem, é porque alguém duplicou a query no
backend.

## D-B5 na tela: a ausência de ação é o desenho

Não há botão de liberar reserva nem de reservar mais — nem na recusa, nem no Catálogo. A reserva é
promessa de um DOCUMENTO; soltá-la por fora deixa o documento sem lastro. O que existe é o **link**
para o documento, onde a ação significa alguma coisa. Provado por ausência **com controle
positivo** (PF6): os links existem, logo o painel renderizou, logo a ausência dos botões é ausência
de verdade e não tela vazia.

## LOTE V — as 160 etiquetas: a quantidade ERA a contagem, por desenho

### O incidente

O Bruno mandou imprimir a identificação de um cabo em **metro** e a impressora cuspiu **160
etiquetas**. Não foi bug de impressora nem de driver. Foram duas decisões somadas:

1. **A etiqueta espelhava a quantidade por desenho.** Em `pages_admin.jsx`, o campo de etiqueta
   nascia com o valor da quantidade e era reescrito a cada digitação dela. Quem quisesse 1
   etiqueta de 16 metros não tinha como pedir.
2. **O saneamento do campo comia a vírgula.** `String(v).replace(/[^0-9]/g, '')` transforma
   `"16,0"` em `"160"`. Não é truncamento — é **multiplicação por 10**.

`16,0` metros → `160` → 160 etiquetas. As duas isoladas seriam suportáveis; juntas, viraram um
rolo de etiquetas.

**A etiqueta é CONTAGEM DE REPETIÇÃO**, não quantidade. Continua inteira, com piso 1, e nasce
`1` — desacoplada. Quem quer 160 digita 160.

### A varredura: 55 ocorrências, 4 regras, 3 formas do mesmo erro

A recon achou **55 ocorrências** de parse numérico em **13 arquivos**, em três variantes:

| forma | o que come | efeito em pt-BR |
|---|---|---|
| `[^0-9]` | vírgula **e** ponto | `"2,5"` → `25` — **×10** |
| `[^0-9.]` | só a vírgula | `"2,5"` → `25` — **×10** (idêntico, para quem digita com vírgula) |
| `[^0-9,]` | só o ponto | `"2.5"` → `25` — ×10 para quem digita com ponto |
| `[^0-9.,]` | nada | correto |

As quatro regras que substituíram isso vivem em `lib/adapters.js` e entram nos arquivos por alias
locais (`frSanQtd` / `frNumQtd` / `frInt`), no mesmo padrão de fallback do resto da casa.

**O comportamento do C1 foi preservado byte a byte: RECUSA, nunca arredonda nem reescreve.**
`"2,5,3"` devolve `NaN` — não `2.53`, não `25`. Arredondar em silêncio é o que transforma erro de
digitação em movimento de estoque errado.

### O que NÃO foi tocado

As **8 máscaras `\D`** (número de NF, código de usuário, hora) são de campos de **texto formatado**,
não de quantidade — nelas comer tudo que não é dígito é o comportamento certo. 6 estão em arquivos
que o lote tocou e ficaram byte a byte iguais ao HEAD; as outras 2 (`auth.jsx`, `pedidos.jsx`)
estão em arquivos que o lote nunca abriu. Há controle de regressão provando as duas coisas.

`conferencia.jsx:320` e `:1072` também ficaram: fazem `.replace(',', '.')` **antes** do
`[^0-9.]`, então a vírgula já virou ponto e nada se perde.

### O campo consertado e o payload esquecido

Depois do item 3 o campo aceitava `"16,0"` corretamente — e a prova V1 **regrediu para 0
etiquetas**. Causa: `handleEntradaImprimir` validava com `Number(r.qtd) > 0`, e `Number("16,0")`
é `NaN`. O submit morria antes de chegar à impressora.

O defeito trocou de forma em vez de morrer: de ×10 para submit travado. É exatamente a **régua do
C1**, e ela custou uma segunda rodada aqui:

**Consertar o campo sem converter o PAYLOAD não conserta nada. Toda tela tocada precisa de prova
de CORPO — o que chega ao servidor tem de ser número.** Há prova de payload nos três formulários
de `pages_admin.jsx`, com o controle negativo `Number("2,5") = NaN` explícito.

### DÍVIDA ABERTA — o banco sempre aceitou fração, e ainda há histórico

As colunas de quantidade são `numeric`: `2.5` parafusos sempre foi válido para o Postgres. A régua
de unidade agora existe nos 5 pontos de escrita do backend (ver `DIVIDAS.md` do backend), mas
**vale só para escrita nova**. O que já está gravado com fração em unidade de contagem continua lá.

**Não foi medido quanto é.** Medir e decidir (corrigir, arredondar com trilha, ou deixar como
registro histórico) é lote próprio — não se conserta dado antigo por efeito colateral de uma
guarda de entrada.

### RÉGUA — corrigir a entrada MOVE o problema para a validação a jusante

Vale além deste lote, e custou uma rodada inteira aqui.

Consertado o saneamento, o campo passou a aceitar `"16,0"` corretamente — e a V1 **regrediu de
1 job para 0**. `handleEntradaImprimir` validava com `Number(r.qtd) > 0`, e `Number("16,0")` é
`NaN`: o submit morria antes de chegar à impressora. O defeito não morreu, **trocou de forma** —
de ×10 para submit travado, e a segunda forma é mais silenciosa que a primeira.

**Toda correção de entrada exige prova das DUAS pontas: o que o campo aceita e o que o corpo
manda.** A prova de payload deste lote existe exatamente por causa disso, com o controle negativo
`Number("2,5") = NaN` escrito nela.
