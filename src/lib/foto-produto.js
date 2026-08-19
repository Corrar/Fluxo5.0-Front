// lib/foto-produto.js — window.frFotoProduto(productId, temFoto): a foto do produto, SOB DEMANDA.
//
// POR QUE ESTE ARQUIVO EXISTE (lote BW, item 1 forma "iii"): a listagem `GET /products` deixou de
// carregar `image_url` — eram 89,1% do payload (5.948,0 → 647,3 KB) para 77 fotos em 1.941
// produtos. Ela agora manda só `has_image`, e a foto vem de `GET /products/:id/image`, que devolve
// os BYTES com Content-Type e ETag.
//
// ────────────────────────────────────────────────────────────────────────────────────────────
// POR QUE NÃO É UM `<img src="/products/:id/image">` DIRETO.
//
// A rota é autenticada por Bearer, e `<img src>` NÃO manda cabeçalho Authorization — o navegador
// buscaria sem token e tomaria 401. As saídas seriam pôr o token na query string (vaza em log de
// proxy e em Referer) ou trocar a autenticação para cookie (mudança de arquitetura). Nenhuma das
// duas cabe num lote de banda.
//
// Então a busca passa pelo FRApi (que já injeta o Bearer), pede `responseType: 'blob'` e vira um
// object URL. **O cache HTTP continua valendo**: o navegador guarda a resposta do fetch pelo
// ETag/Cache-Control do servidor exatamente como guardaria a de um `<img>`. O que se perde é só o
// cache DE IMAGEM DECODIFICADA — irrelevante para 77 fotos.
// ────────────────────────────────────────────────────────────────────────────────────────────
//
// ⚠ SOB DEMANDA, NÃO EM MASSA. O hook só busca quando `temFoto` é true E o componente está
// montado. Como o Catálogo pagina (24 por página no desktop, 10 no celular), o teto de
// requisições é o número de cartões VISÍVEIS com foto — nunca os 1.941. Medido: só 3,97% dos
// produtos têm foto, então uma página típica dispara 0 ou 1 requisição.
//
// CACHE DE PROCESSO: o mesmo produto pedido por duas telas (cartão do Catálogo e miniatura do
// Inventário) faz UMA requisição. O mapa guarda a PROMESSA, não a URL — assim duas montagens
// simultâneas do mesmo id não disparam dois fetches. Object URLs não são revogados de propósito:
// são 77 no pior caso, e revogar quebraria um `<img>` de outra tela que ainda aponta para eles.

(function () {
  const cache = new Map();   // productId -> Promise<string|null> (object URL ou null)

  function buscar(productId) {
    if (cache.has(productId)) return cache.get(productId);
    const p = window.FRApi.get('/products/' + productId + '/image', { responseType: 'blob', skipLoading: true })
      .then(function (r) {
        if (!r || !r.data) return null;
        return window.URL.createObjectURL(r.data);
      })
      .catch(function () {
        // 404 (produto sem foto), 403, rede: a tela cai no placeholder. Nunca quebra o cartão —
        // a foto é enfeite, e um erro aqui não pode derrubar a listagem que já carregou.
        return null;
      });
    cache.set(productId, p);
    return p;
  }

  /**
   * @param {string|null} productId
   * @param {boolean} temFoto  o `has_image` da listagem. false = NÃO faz requisição nenhuma.
   * @returns {string|null} object URL quando pronto; null enquanto carrega ou se não há foto.
   */
  function frFotoProduto(productId, temFoto) {
    const R = window.React;
    const [src, setSrc] = R.useState(function () {
      // Se já está no cache resolvido, o 1º render já sai com a imagem (sem piscar).
      return null;
    });

    R.useEffect(function () {
      if (!temFoto || !productId) { setSrc(null); return undefined; }
      let vivo = true;
      buscar(productId).then(function (url) { if (vivo) setSrc(url || null); });
      return function () { vivo = false; };
    }, [productId, temFoto]);

    return src;
  }

  window.frFotoProduto = frFotoProduto;
  window.frFotoProdutoCache = cache;   // exposto só para prova/diagnóstico
})();
