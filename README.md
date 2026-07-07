# Fluxo Royale ERP — React (Vite)

Sistema ERP multi-módulo do Fluxo Royale, empacotado como um projeto **React + Vite** rodável.

## Como rodar

Requer **Node.js 18+**.

```bash
cd fluxo-royale-react
npm install
npm run dev      # abre http://localhost:5173
```

Build de produção:

```bash
npm run build    # gera ./dist
npm run preview  # serve o build para conferência
```

## Login (dados de exemplo)

O sistema abre com uma animação, depois a tela de login e o seletor de módulos.
Use as contas de exemplo listadas no próprio dropdown da tela de login (atalho "contas
demo"). Cada usuário enxerga apenas os módulos a que tem acesso.

## Estrutura

```
fluxo-royale-react/
├─ index.html            # shell: fontes, CSS global, window.__asset, #root
├─ vite.config.js        # Vite + @vitejs/plugin-react
├─ package.json
├─ public/
│  └─ assets/            # imagens, logo, vídeo de abertura (servidos em /assets/…)
└─ src/
   ├─ globals.js         # injeta window.React / window.ReactDOM (1º import)
   ├─ image-slot.js      # web component <image-slot>
   ├─ main.jsx           # ponto de entrada — importa os parts na ordem
   └─ parts/             # todos os componentes/telas (.jsx)
```

## Arquitetura — importante para dar manutenção

Este projeto foi convertido a partir de um protótipo que usava Babel no navegador.
Para manter a conversão **segura e fiel**, o padrão original foi preservado:

- Cada arquivo em `src/parts/*.jsx` **expõe seus símbolos no `window`** — por exemplo
  `window.Icon = Icon` (icons.jsx) e `Object.assign(window, { Card, Btn, Badge, ... })`
  (ui.jsx). Utilitários de tema vêm do `sidebar.jsx` (`window.frTokens`, `window.frHexToRgba`).
- Os demais arquivos **referenciam esses símbolos como variáveis globais** (ex.: `<Icon .../>`,
  `frTokens(...)`), resolvidos via `window`.
- Por isso `src/main.jsx` importa os parts **em ordem** (utilitários → telas → `app.jsx`).
  `app.jsx` é o último: ele monta a raiz com `ReactDOM.createRoot`.
- `src/globals.js` é o **primeiro** import e define `window.React`/`window.ReactDOM`
  antes dos parts (imports ESM são avaliados em ordem).

### Se você quiser modernizar para `import`/`export` idiomáticos

O caminho incremental, arquivo por arquivo, sem quebrar o resto:

1. Escolha um arquivo (ex.: `ui.jsx`). Troque `Object.assign(window, {...})` por `export`.
2. Nos arquivos que consomem esses símbolos, adicione `import { Card, Btn } from './ui.jsx'`.
3. Repita. Enquanto um símbolo ainda tiver consumidores por `window`, mantenha os dois
   (o `export` **e** o `window.x = x`) para não quebrar nada no meio da migração.
4. Ao final, `import React from 'react'` em cada arquivo e remova a dependência do
   `window.React` global (e o `globals.js`).

## Assets

Imagens/vídeo ficam em `public/assets/`. No código são referenciados por
`window.__asset('assets/arquivo.png')`, que resolve para `/assets/arquivo.png`
(o Vite serve `public/` na raiz). Para adicionar um asset novo: solte o arquivo em
`public/assets/` e use `window.__asset('assets/<nome>')` no `src`.

## Observações

- **O build não foi executado no ambiente onde este pacote foi gerado.** A conversão
  preserva 1:1 o runtime do protótipo (mesmos arquivos, mesma ordem, mesmo
  compartilhamento via `window`), mas rode `npm install && npm run dev` e confira o
  console na primeira execução.
- O `@vitejs/plugin-react` usa o *automatic JSX runtime*, então o JSX é transpilado
  sem precisar de `import React` em cada arquivo — mas as chamadas explícitas
  (`React.useState`, `React.useRef`) usam o `window.React` do `globals.js`.
- Persistência de sessão/estado usa `localStorage` (chave `fr_session_v1`).
- Pendência conhecida: havia um pedido para trocar a fonte do login para **Inter**
  (não aplicado — a conversão para React foi priorizada). Para aplicar: adicione a
  família Inter no `<link>` de fontes do `index.html` e ajuste a `fontFamily` em
  `src/parts/auth.jsx`.
