// lib/stock-refresh.js — window.frUseStockReload(load): a tela recarrega quando o SALDO muda.
//
// POR QUE EXISTE: o backend emite `stock_updated` em todo caminho que move estoque (entrada NF,
// saída manual, ajuste de inventário, separações, produção 3D, devoluções e o cron de expiração),
// mas NENHUMA tela do front assinava o evento — o saldo só mudava no F5. Este hook é o outro lado
// do fio.
//
// ────────────────────────────────────────────────────────────────────────────────────────────
// REGRA DURA: O HANDLER NÃO LÊ O PAYLOAD.
//
// O evento chega em DOIS formatos, porque o backend tem dois grupos de emissores:
//   • `{ changedProducts: [id, ...] }` — os caminhos novos e os do requests.controller;
//   • SEM PAYLOAD (`undefined`)        — os 5 emits legados de travels/replenishments.
//
// `recarregar` é declarada SEM PARÂMETRO de propósito: o socket.io passa o payload como 1º
// argumento e nós o ignoramos por construção, não por checagem. Assim `changedProducts`
// undefined não tem como quebrar nem desviar nada — os dois formatos produzem exatamente o
// mesmo efeito, um reload. Patch cirúrgico por produto (usar `changedProducts` para atualizar
// só as linhas afetadas em vez de refazer o GET) fica FORA deste lote: é otimização, e depende
// de os 5 emits legados passarem a mandar payload. Ver DIVIDAS.md.
// ────────────────────────────────────────────────────────────────────────────────────────────
//
// Espelha o padrão já provado do `useFRRequests` (pages_admin.jsx):
//   • `FRSocket` pode ser null no mount (conecta async) e TROCAR de instância na reconexão —
//     por isso `subscribe()` re-anexa os listeners ao socket vigente, em vez de guardar um;
//   • debounce de 500ms com chamada de arrasto: rajada de eventos = 1 reload;
//   • sem socket, retorna sem fazer nada — o app segue funcionando por F5.
//
// `load` entra por REF, não pela lista de dependências: várias telas recriam a função a cada
// render (fetch inline, ou `useCallback` que depende do período selecionado). Se ela entrasse
// no array de deps, o efeito desmontaria e remontaria a assinatura a cada render — churn de
// listener e, no limite, evento perdido na troca. Com a ref, a assinatura é montada UMA vez e
// o handler sempre chama a versão MAIS RECENTE de `load` (com o filtro/período atual).

(function () {
  const EVENTO_PADRAO = ['stock_updated'];

  function frUseStockReload(load, opts) {
    const R = window.React;
    const eventos = (opts && Array.isArray(opts.events) && opts.events.length) ? opts.events : EVENTO_PADRAO;
    const debounceMs = (opts && Number(opts.debounceMs)) || 500;

    const loadRef = R.useRef(load);
    loadRef.current = load;                    // sempre a última versão, sem re-assinar

    // `eventos` vira string estável para o array de deps (array literal muda de identidade
    // a cada render e reassinaria tudo sem necessidade).
    const chaveEventos = eventos.join(',');

    R.useEffect(function () {
      const FRS = window.FRSocket;
      if (!FRS) return undefined;              // sem tempo real: app segue por F5, sem quebrar

      const nomes = chaveEventos.split(',');
      let lastRun = 0;
      let timer = null;
      let vivo = true;

      // SEM PARÂMETRO: ver "REGRA DURA" no topo. O payload chega e é descartado por construção.
      const recarregar = function () {
        if (!vivo || timer) return;            // já há reload agendado → coalesce (1 por janela)
        const since = Date.now() - lastRun;
        const wait = since >= debounceMs ? 0 : debounceMs - since;
        timer = setTimeout(function () {
          timer = null;
          lastRun = Date.now();
          if (vivo && typeof loadRef.current === 'function') loadRef.current();
        }, wait);
      };

      let attached = null;                     // socket que está com os listeners no momento
      const attach = function (sock) {
        if (sock === attached) return;
        if (attached) nomes.forEach(function (ev) { attached.off(ev, recarregar); });
        attached = sock || null;
        if (attached) nomes.forEach(function (ev) { attached.on(ev, recarregar); });
      };

      attach(FRS.socket);                      // socket já conectado (ex.: sessão restaurada no F5)
      const unsub = FRS.subscribe(function (snap) { attach(snap && snap.socket); });

      return function () {
        vivo = false;
        if (timer) clearTimeout(timer);
        if (attached) nomes.forEach(function (ev) { attached.off(ev, recarregar); });
        if (typeof unsub === 'function') unsub();
      };
    }, [chaveEventos, debounceMs]);
  }

  window.frUseStockReload = frUseStockReload;
})();
