// store.jsx — estado compartilhado das Solicitações entre Estoque (Solicitações,
// Conferência de Envio) e Produção (Recebimento). Fluxo único de ponta a ponta:
//   em-analise → a-separar (aprovada) → em-transito (bipada/enviada) → concluido (recebida)
// Cada etapa grava um registro (por quem, quando) dentro da própria solicitação.
const { useState: useStateStore, useEffect: useEffectStore } = React;

function frNowStamp() {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const FR_SOLIC_SEED = [
  { id: 1, req: 'REQ-B491B451', sol: 'Nemias Alves', setor: 'Desenvolvimento', op: '00005', armazem: 'Montagem', status: 'em-analise', time: 'há cerca de 1 hora',
    itens: [{ nome: 'Parafuso Allen Inox 3/16 x 1', sku: '3.14.0071', qtd: 50, un: 'un' }, { nome: 'Arruela Lisa 8mm', sku: '7.40.0150', qtd: 50, un: 'un' }] },
  { id: 2, req: 'REQ-C12F0A92', sol: 'Osmar Ribeiro', setor: 'Flow', op: '901001', armazem: 'Usinagem', status: 'em-analise', time: 'há cerca de 1 hora',
    itens: [{ nome: 'Rolamento 6204ZZ', sku: '4.10.0233', qtd: 6, un: 'un' }, { nome: 'Cabo Flexível 2,5mm', sku: '5.20.0099', qtd: 30, un: 'm' }] },
  { id: 5, req: 'REQ-44C9F210', sol: 'William Souza', setor: 'Montagem', op: '88210', armazem: 'Montagem', status: 'a-separar', time: 'há cerca de 3 horas',
    aprovacao: { por: 'Almoxarife', em: '18/06 · 09:10' },
    itens: [{ nome: 'Parafuso Sextavado M8', sku: '9.99.0238', qtd: 80, un: 'un' }, { nome: 'Arruela Lisa 8mm', sku: '7.40.0150', qtd: 80, un: 'un' }, { nome: 'Porca Sextavada M8', sku: '2.11.0080', qtd: 80, un: 'un' }] },
  { id: 6, req: 'REQ-1A8B7C33', sol: 'Davi Miranda', setor: 'Produção 3D', op: '54120', armazem: 'Produção 3D', status: 'a-separar', time: 'há cerca de 4 horas',
    aprovacao: { por: 'Almoxarife', em: '18/06 · 08:30' },
    itens: [{ nome: 'Filamento PLA Azul 1kg', sku: '3.00.0101', qtd: 4, un: 'un' }] },
  { id: 11, req: 'REQ-7F30D118', sol: 'Leo Monteiro', setor: 'Usinagem', op: '73001', armazem: 'Usinagem', status: 'em-transito', time: 'há 30 min',
    aprovacao: { por: 'Almoxarife', em: '18/06 · 07:40' },
    bipagem: { por: 'Almoxarife', em: '18/06 · 10:20' },
    envio: { por: 'Almoxarife', em: '18/06 · 10:25' },
    itens: [{ nome: 'Chapa Aço 1020 2mm', sku: '1.02.0044', qtd: 3, un: 'ch' }, { nome: 'Tinta Epóxi Cinza 3,6L', sku: '6.30.0012', qtd: 1, un: 'lt' }] },
  { id: 3, req: 'REQ-77A1D034', sol: 'Everton Lima', setor: 'Esteira', op: '12010', armazem: 'Montagem', status: 'concluido', time: 'ontem',
    aprovacao: { por: 'Almoxarife', em: '17/06 · 13:50' },
    bipagem: { por: 'Almoxarife', em: '17/06 · 14:30' },
    envio: { por: 'Almoxarife', em: '17/06 · 14:35' },
    recebimento: { por: 'Everton Lima', em: '17/06 · 15:10', divergencia: false, itens: [{ sku: '6.30.0012', recebida: 2, enviada: 2 }] },
    itens: [{ nome: 'Tinta Epóxi Cinza 3,6L', sku: '6.30.0012', qtd: 2, un: 'lt' }] },
  { id: 7, req: 'DEV-0501', sol: 'Bruno Teixeira', setor: 'Produção', op: '73001', status: 'em-analise', time: 'há 25 min', tipo: 'devolucao',
    itens: [{ nome: 'Cabo Flexível 2,5mm', sku: '5.20.0099', qtd: 18, un: 'm', cond: 'bom' }] },
  { id: 8, req: 'DEV-0498', sol: 'Carlos Moura', setor: 'Produção', op: '00021', status: 'em-analise', time: 'há 1 hora', tipo: 'devolucao',
    itens: [{ nome: 'Tinta Epóxi Cinza 3,6L', sku: '6.30.0012', qtd: 1, un: 'lt', cond: 'ruim' }] },
];

const FRStore = (function () {
  let solic = FR_SOLIC_SEED.map((s) => ({ ...s }));
  const subs = new Set();
  const notify = () => subs.forEach((fn) => fn());
  return {
    getSolic: () => solic,
    setSolic: (updater) => { solic = typeof updater === 'function' ? updater(solic) : updater; notify(); },
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
  };
})();

// Hook: lê e assina a lista de solicitações compartilhada.
function useFRSolic() {
  const [, force] = useStateStore(0);
  useEffectStore(() => FRStore.subscribe(() => force((n) => n + 1)), []);
  return [FRStore.getSolic(), FRStore.setSolic];
}

// Ações de ciclo de vida — gravam o registro dentro da solicitação.
const FRSolicActions = {
  aprovar(id, por) {
    FRStore.setSolic((xs) => xs.map((s) => s.id !== id ? s : (
      s.tipo === 'devolucao'
        ? { ...s, status: 'concluido' }
        : { ...s, status: 'a-separar', aprovacao: { por: por || 'Almoxarife', em: frNowStamp() } }
    )));
  },
  recusar(id) {
    FRStore.setSolic((xs) => xs.map((s) => s.id === id ? { ...s, status: 'recusado' } : s));
  },
  // Conferência de Envio confirma após bipar todos os itens.
  confirmarEnvio(id, por) {
    const stamp = frNowStamp();
    FRStore.setSolic((xs) => xs.map((s) => s.id === id ? {
      ...s, status: 'em-transito',
      bipagem: { por: por || 'Almoxarife', em: stamp },
      envio: { por: por || 'Almoxarife', em: stamp },
    } : s));
  },
  // Recebimento do setor confere o que chegou.
  confirmarRecebimento(id, por, recItens, divergencia) {
    FRStore.setSolic((xs) => xs.map((s) => s.id === id ? {
      ...s, status: 'concluido',
      recebimento: { por: por || 'Setor', em: frNowStamp(), divergencia: !!divergencia, itens: recItens },
    } : s));
  },
  remove(id) { FRStore.setSolic((xs) => xs.filter((s) => s.id !== id)); },
  add(novo) { FRStore.setSolic((xs) => [novo, ...xs]); },
};

Object.assign(window, { FRStore, useFRSolic, FRSolicActions, frNowStamp });
