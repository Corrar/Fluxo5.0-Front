// lib/products.js — carregador de produtos REAIS (GET /products) para as telas de Estoque.
//
// Hook window.useFRProducts(): consome o cliente axios já pronto (window.FRApi, com Bearer
// e 401→logout resolvidos), adapta cada linha via window.FRAdapters.productToCard, e devolve
// { items, loading, error, reload }. Em erro, expõe mensagem tratada (window.FRApiUtil).
//
// Dedup defensivo por product_id: o GET /products faz LEFT JOIN em stock; se um produto
// tiver mais de uma linha de stock (armazém×op), poderia repetir — mantemos 1 card por produto.

(function () {
  async function fetchProductsAdapted() {
    // skipLoading: usamos nosso próprio skeleton, não o loader global anti-flicker.
    const res = await window.FRApi.get('/products', { skipLoading: true });
    const rows = Array.isArray(res && res.data) ? res.data : [];
    const seen = new Set();
    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const card = window.FRAdapters.productToCard(rows[i]);
      const key = card.product_id || card.sku || ('idx:' + i);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(card);
    }
    return out;
  }

  function useFRProducts() {
    const R = window.React;
    const [items, setItems] = R.useState([]);
    const [loading, setLoading] = R.useState(true);
    const [error, setError] = R.useState(null);
    const mounted = R.useRef(true);

    const load = R.useCallback(function () {
      setLoading(true);
      setError(null);
      fetchProductsAdapted()
        .then(function (list) {
          if (!mounted.current) return;
          setItems(list);
          setLoading(false);
        })
        .catch(function (e) {
          if (!mounted.current) return;
          const getMsg = window.FRApiUtil && window.FRApiUtil.getErrorMessage;
          setError(getMsg ? getMsg(e) : 'Não foi possível carregar os produtos.');
          setLoading(false);
        });
    }, []);

    R.useEffect(function () {
      mounted.current = true;
      load();
      return function () { mounted.current = false; };
    }, [load]);

    return { items: items, loading: loading, error: error, reload: load };
  }

  window.useFRProducts = useFRProducts;
})();
