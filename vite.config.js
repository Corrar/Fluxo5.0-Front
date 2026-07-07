import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fluxo Royale ERP — Vite + React.
// Os componentes ficam em src/parts/*.jsx e compartilham símbolos via `window`
// (padrão original do protótipo). src/main.jsx injeta React global e importa
// os parts na ordem correta. Ver README.md.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
});
