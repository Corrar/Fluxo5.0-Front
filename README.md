# Fluxo Royale 5.0 — Frontend

Interface web do ERP **Fluxo Royale 5.0** — multi-módulo: Estoque, Produção, Produção 3D,
RH, Compras, Assistência Técnica e Financeiro. Empacotado como **React + Vite** e consome a
API do [Fluxo5.0-Backend](https://github.com/Corrar/Fluxo5.0-Backend).

## Stack
- **React 18**
- **Vite 5** (dev server + build)
- **Axios** (HTTP) e **Socket.IO client** (tempo real)
- UI própria: componentes com estilos inline (arquitetura window-globals; sem framework CSS)

## Pré-requisitos
- **Node.js 18+** e npm
- O **backend rodando** (por padrão em `http://localhost:3000`) — sem ele o login não conecta

## Setup
1. Clone e entre na pasta:
   ```bash
   git clone https://github.com/Corrar/Fluxo5.0-Front.git
   cd Fluxo5.0-Front
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Aponte para a API criando **`.env.local`** na raiz:
   ```env
   VITE_API_URL=http://localhost:3000
   ```
   > `.env.local` é **gitignored** (via `*.local`) — não vai para o repositório.
   > `VITE_API_URL` não é segredo, mas fica fora do versionamento. Se omitido, o app usa
   > o fallback `http://localhost:3000` quando aberto em `localhost`.
4. Rode em desenvolvimento:
   ```bash
   npm run dev      # http://localhost:5173
   ```

Build de produção:
```bash
npm run build    # gera ./dist
npm run preview  # serve o build para conferência
```

> ⚠️ Garanta que o **backend esteja rodando na porta 3000** (ou ajuste `VITE_API_URL`)
> **antes de fazer login** — caso contrário as requisições de login/dados falham.

## Scripts
| Comando | O que faz |
|---|---|
| `npm run dev` | Vite dev server (porta **5173**) |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve localmente o build de produção |

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
   ├─ lib/               # api.js (axios/FRApi), auth.js (FRAuth), socket.js, adapters, products…
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
- Por isso `src/main.jsx` importa os parts **em ordem** (utilitários → integração → telas →
  `app.jsx`). `app.jsx` é o último: ele monta a raiz com `ReactDOM.createRoot`.
- `src/globals.js` é o **primeiro** import e define `window.React`/`window.ReactDOM`
  antes dos parts (imports ESM são avaliados em ordem).
- A camada de integração fica em `src/lib/`: `api.js` expõe `window.FRApi` (axios com Bearer
  e tratamento de 401) e `auth.js` expõe `window.FRAuth` (login/logout reais via `POST /auth/login`).

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

## Notas
- O `@vitejs/plugin-react` usa o *automatic JSX runtime*, então o JSX é transpilado sem
  precisar de `import React` em cada arquivo — mas as chamadas explícitas (`React.useState`,
  `React.useRef`) usam o `window.React` definido em `globals.js`.
- Sessão e navegação persistem em `localStorage` (token/perfil da sessão, módulo e página ativos).
