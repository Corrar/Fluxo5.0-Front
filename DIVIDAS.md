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

## Rodapé com USER mock pós-F5 (cosmética pré-existente)

`syncGlobalUser` (app.jsx) roda em `useEffect` pós-render e MUTA o objeto `USER` global sem
disparar re-render — num F5 logado, o rodapé do ERPFrame renderiza uma vez com o mock
("Bruno / ADMIN") e fica assim até o próximo re-render natural. Pré-existente à tela de
Permissões; observada durante o smoke de 28/07/2026.
