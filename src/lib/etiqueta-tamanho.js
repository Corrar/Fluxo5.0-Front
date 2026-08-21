// lib/etiqueta-tamanho.js — o TOGGLE GLOBAL de tamanho de etiqueta (lote ET1, decisão D3).
//
// "Aparece em TODAS as telas que imprimem etiqueta, e mudar numa muda em todas."
// São TRÊS telas, medidas na recon (git grep de ^XA no front, base a94038a):
//   conferencia            → CfLabelsModal, passo "ident"
//   ent-nfe                → PageEntradaNova (variante nova)
//   ent-reaproveitamento   → PageEntradaNova (variante reaproveitamento)
// (a variante "saida" NÃO imprime; 'cat-etiquetas' é alias morto → PageCatalogo.)
//
// DUAS CAMADAS, e as duas são necessárias:
//   1. localStorage → sobrevive ao F5. Padrão da casa, receita copiada de
//      pedidos.jsx:8-13 e erpframe.jsx:249-262: chave constante + getItem no init com
//      GUARDA DE VALOR VÁLIDO + setItem na troca, tudo em try/catch que devolve o default.
//   2. subscribe/notify → propaga SEM F5. Sozinho o localStorage não entrega o D3: as três
//      telas são ramos distintos do renderPage e montam separado, então quem escreve não
//      re-renderiza quem lê. Precedentes da casa: FRAuth.subscribe (auth.js:380-383) e
//      subscribeToLoading (api.js:39-44).
//
// ⚠ POR QUE NÃO A TABELA `settings` DO BACKEND: `PUT /admin/settings` é requireAdmin
//   (system.routes.ts:46) e quem imprime é conferente/almoxarife, não admin. E seria
//   configuração DA EMPRESA, não do operador. Fora, por decisão do lote.
//
// Forma de entrega no molde de lib/products.js:64 — IIFE + hook exposto em window.

(function () {
  const CHAVE = 'fr_etiqueta_tamanho';

  // As três de D1. `mm` é só rótulo de tela; a geometria em dots mora no ZPL
  // (conferencia.jsx · ET_LAYOUT), porque é lá que ela é usada.
  const TAMANHOS = [
    { id: 'grande',  rotulo: 'Grande',  mm: '100 × 60 mm', nota: 'com código de barras' },
    { id: 'media',   rotulo: 'Média',   mm: '100 × 30 mm', nota: 'com código de barras' },
    { id: 'pequena', rotulo: 'Pequena', mm: '33 × 17 mm',  nota: 'bobina 3 colunas · SEM código de barras' },
  ];
  const IDS = TAMANHOS.map(function (t) { return t.id; });

  // ⚠ DEFAULT 'grande' — é a etiqueta de HOJE. Quem nunca tocar no toggle imprime
  //   exatamente o que imprime antes deste lote. O default não é escolha estética.
  const PADRAO = 'grande';

  const valido = function (v) { return IDS.indexOf(v) >= 0 ? v : null; };

  function ler() {
    try { return valido(localStorage.getItem(CHAVE)) || PADRAO; } catch (e) { return PADRAO; }
  }
  function gravar(v) {
    try { localStorage.setItem(CHAVE, v); } catch (e) { /* quota/modo privado: estado em memória segue valendo */ }
  }

  let atual = ler();
  const subs = new Set();

  function get() { return atual; }
  function set(v) {
    const novo = valido(v);
    if (!novo || novo === atual) return atual;   // valor inválido ou repetido não notifica
    atual = novo;
    gravar(novo);
    subs.forEach(function (fn) { try { fn(novo); } catch (e) { /* um assinante quebrado não derruba os outros */ } });
    return atual;
  }
  function subscribe(fn) { subs.add(fn); return function () { subs.delete(fn); }; }

  // Outra ABA do mesmo navegador mudou o toggle. Barato e correto: o evento `storage`
  // só dispara em abas que NÃO fizeram a escrita, então não há eco.
  try {
    window.addEventListener('storage', function (e) {
      if (e.key !== CHAVE) return;
      const novo = valido(e.newValue);
      if (novo && novo !== atual) { atual = novo; subs.forEach(function (fn) { try { fn(novo); } catch (_) {} }); }
    });
  } catch (e) { /* sem window.addEventListener não há sincronia entre abas — o resto segue */ }

  // Hook React, no molde de window.useFRProducts (lib/products.js:64).
  function useFREtiquetaTamanho() {
    const [tam, setTam] = React.useState(get);
    React.useEffect(function () { return subscribe(setTam); }, []);
    return [tam, set];
  }

  window.FREtiquetaTamanho = { CHAVE: CHAVE, TAMANHOS: TAMANHOS, PADRAO: PADRAO, get: get, set: set, subscribe: subscribe };
  window.useFREtiquetaTamanho = useFREtiquetaTamanho;
})();
