// lib/zpl-texto.js — MEDIDA DE TEXTO EM ZPL (fonte 0) e o algoritmo de quebra do lote ET1.
//
// POR QUE ESTE ARQUIVO EXISTE
// ───────────────────────────
// Até o ET1 o único número de largura de fonte no repo era uma ESTIMATIVA em comentário
// (conferencia.jsx:795, "3 linhas de ~53 no ^A0N,26,26" ⇒ r ≈ 0,58). Com estimativa o
// algoritmo de quebra chuta, e chute em etiqueta vira nome empilhado sobre si mesmo.
//
// A TABELA ABAIXO É MEDIDA, glifo a glifo, contra um renderizador de ZPL (Labelary,
// 8dpmm = 203 dpi), em 21/08/2026. Método: para cada caractere, duas sondas de N=8 e
// N=24 repetições; avanço = (W24 − W8) / 16 — as sobras laterais do primeiro e do último
// glifo são idênticas nas duas sondas e se cancelam na subtração.
//
// ⚠ SOMENTE TEXTO SINTÉTICO FOI ENVIADO: repetição de um glifo e cadeias de alfabeto/
//   dígitos. Nenhum nome de produto, cliente, SKU ou solicitação saiu para o serviço.
//
// r MEDIDO DO CORPUS = 0,499 (avanço médio 12,97 dots a h=26, sobre os 82.431 caracteres
// dos 2.360 nomes de produção). A estimativa do repo (0,58) era 16,2% PESSIMISTA: cabem
// 62 caracteres por linha em 800 dots, não 53.
//
// TRÊS CONTROLES, TODOS VERDES (ver DIVIDAS.md · ET1):
//   1. W(N) é LINEAR em N — regressão com R² = 1,00000 nos casos que "pareciam" errados
//      (o hífen mede 23,5 dots, mais largo que o "M"; a linearidade confirma que é o
//      modelo de fonte, não erro de medição).
//   2. O avanço ESCALA LINEARMENTE com o parâmetro de largura do ^A0N — dispersão de
//      0,3–0,4% entre h=14 e h=36. Por isso UMA tabela a h=26 serve para TODOS os
//      tamanhos, por regra de três.
//   3. CONTROLE DE PREVISÃO: a tabela prevê a largura de cadeias mistas com erro máximo
//      de +0,8%, e SEMPRE para mais (a soma dos avanços ignora a sobra lateral). O viés
//      é conservador — erra prevendo mais largo, que é o lado que não sobrepõe.
//
// ⚠ O QUE ISTO PROVA E O QUE NÃO PROVA
//   PROVA: as métricas do MODELO de fonte do renderizador.
//   NÃO PROVA: o firmware da ZD220. O renderizador é um modelo, não o aparelho.
//   Se algum número ficar marginal em campo, a etiqueta de calibração física está
//   transcrita no DIVIDAS.md (§ ET1) e é o instrumento de desempate.
//   FR_ZPL_MARGEM abaixo existe exatamente para cobrir essa distância.

(function () {
  // ── avanço em dots por caractere, a ^A0N,26,26 ────────────────────────────────────
  // Agrupado por valor medido. 111 glifos: ASCII imprimível (menos ^ e ~, que o
  // sanitiza() remove) + os 18 não-ASCII que ocorrem no catálogo real.
  const AV26 = Object.create(null);
  [
    [6.69,  'ijl'],
    [7.19,  'IftÍ'],
    [7.63,  '!\'(),./:;[]`'],
    [7.65,  ' '],
    [8.69,  'r'],
    [9.56,  '²'],
    [10.13, 'z'],
    [11.00, 's'],
    [11.50, '?Jckvxy'],
    [12.00, 'a'],
    [12.50, '"#$*0123456789L\\eo°'],
    [12.94, 'EFTZ_bdghnpqu{|}Ê'],
    [13.94, 'CSV'],
    [14.38, 'ABKPXYÇÃÁÂºÀ'],
    [14.88, 'OQÉÓØ´ÕÔ'],
    [15.38, 'DGR'],
    [15.81, '&HNU'],
    [17.25, 'w'],
    [19.63, 'Mm'],
    [21.06, 'W'],
    [23.50, '%+-=@—–'],
    [25.88, '<>'],
  ].forEach(function (par) { for (const c of par[1]) AV26[c] = par[0]; });

  // Glifo fora da tabela (caractere que o catálogo ainda não tem): cobra o do "W", o mais
  // largo do alfabeto. Desconhecido paga caro DE PROPÓSITO — subestimar largura sobrepõe.
  const AV_DESCONHECIDO = 21.06;

  // ⚠ MARGEM DE SEGURANÇA — a distância entre o renderizador e o firmware.
  // 4% custa ~2 caracteres por linha a h=26 e cobre um firmware até 4% mais largo que o
  // modelo medido. NÃO é um número inventado: é o único parâmetro deste arquivo que a
  // etiqueta de calibração física pode CONFIRMAR ou SUBSTITUIR. Se o Bruno imprimir a
  // calibração e o r bater, este número pode cair para 1,00.
  const FR_ZPL_MARGEM = 1.04;

  // Sanitiza texto para campo ^FD.
  //  • ^ e ~ são control chars do ZPL — viram espaço (regra que já existia no frZplField);
  //  • NBSP (U+00A0) vira espaço normal: ele NÃO quebra linha e não está na tabela de
  //    avanço. Medido: 1 ocorrência no catálogo de produção. Sem esta linha, esse nome
  //    seria tratado como uma palavra única gigante.
  function sanitiza(s) {
    return String(s == null ? '' : s).replace(/[\^~]/g, ' ').replace(/ /g, ' ').trim();
  }

  function avanco(ch, h) {
    const base = AV26[ch] === undefined ? AV_DESCONHECIDO : AV26[ch];
    return base * h / 26 * FR_ZPL_MARGEM;
  }
  function largura(s, h) { let t = 0; for (const c of String(s)) t += avanco(c, h); return t; }

  // ── QUEBRA ────────────────────────────────────────────────────────────────────────
  // Gulosa por palavra, como o ^FB do firmware. Palavra maior que a linha inteira é
  // partida no seco (o ^FB também parte; e sem partir, um código longo colado travaria).
  //
  // ⚠ QUEM QUEBRA É ESTE CÓDIGO, NÃO O ^FB. Cada linha vira um campo próprio com
  //   ^FB<largura>,1,0,C — o ^FB fica só com a CENTRALIZAÇÃO. É o que elimina o
  //   mecanismo (iii) da recon (o ^FB sobrepõe o excesso em vez de cortar): ele nunca
  //   mais recebe mais texto do que cabe em uma linha.
  function quebra(texto, larguraDots, h) {
    const linhas = [];
    let cur = '', curW = 0;
    const wEsp = avanco(' ', h);
    for (const bruta of String(texto).split(/ +/)) {
      if (!bruta) continue;
      let palavra = bruta;
      // palavra que não cabe nem sozinha na linha
      while (largura(palavra, h) > larguraDots) {
        let i = 0, acc = 0;
        while (i < palavra.length && acc + avanco(palavra[i], h) <= larguraDots) { acc += avanco(palavra[i], h); i++; }
        if (i === 0) i = 1;                       // largura menor que um glifo: não trava
        if (cur) { linhas.push(cur); cur = ''; curW = 0; }
        linhas.push(palavra.slice(0, i));
        palavra = palavra.slice(i);
      }
      const w = largura(palavra, h);
      if (!cur) { cur = palavra; curW = w; }
      else if (curW + wEsp + w <= larguraDots) { cur += ' ' + palavra; curW += wEsp + w; }
      else { linhas.push(cur); cur = palavra; curW = w; }
    }
    if (cur) linhas.push(cur);
    return linhas.length ? linhas : [''];
  }

  // ── O ALGORITMO DO D4 ─────────────────────────────────────────────────────────────
  // "Reduzir a fonte até caber, com piso de legibilidade; reticências só quando a
  //  redução passar do piso."
  //
  // PISOS DECLARADOS (a 203 dpi, 1 pt = 2,82 dots):
  //   17 dots (6 pt) = piso ABSOLUTO — abaixo disso o traço da fonte cai para 2 pontos
  //                    de impressão e o erro de posicionamento do cabeçote (±1 dot) vira
  //                    ±50% do traço.
  //   20 dots (7 pt) = piso OPERACIONAL — etiqueta lida de braço estendido, amassada
  //                    dentro do plástico. Vale para a GRANDE e para a MÉDIA.
  //   18 dots        = piso da PEQUENA, decisão do Bruno. Fica 2 dots ABAIXO do piso
  //                    operacional, e é aceitável porque a 33×17 vai COLADA NA PEÇA e é
  //                    lida de perto — não é o caso do braço estendido que motivou o 20.
  //
  // Devolve { h, linhas, truncou }. O passo é de 1 dot: a fonte 0 é escalável e contínua
  // (foi um dos três motivos de ela ter vencido o passo fixo — ver DIVIDAS § ET1).
  //
  // opts.alturaMax (opcional) é a BANDA VERTICAL disponível. Sem ela a escada só olha a
  // largura, e um campo pode caber em N linhas que não cabem na altura reservada —
  // invadindo o campo de baixo. É a forma vertical do mesmo defeito.
  function ajusta(texto, opts) {
    const larguraDots = opts.largura;
    const maxLinhas = opts.maxLinhas;
    const hMin = opts.hMin;
    const t = sanitiza(texto);
    if (!t) return { h: opts.hIni, linhas: [''], truncou: false };

    for (let h = opts.hIni; h >= hMin; h--) {
      const ls = quebra(t, larguraDots, h);
      if (ls.length > maxLinhas) continue;
      if (opts.alturaMax && (ls.length - 1) * passo(h) + h > opts.alturaMax) continue;
      return { h: h, linhas: ls, truncou: false };
    }
    // Chegou ao piso e ainda não cabe → TRUNCA.
    // ⚠ O teto é DERIVADO da capacidade calculada, nunca uma constante. O teto antigo
    //   (FR_ZPL_NOME_MAX = 150) era guard MORTO: o maior nome do catálogo tem 139
    //   caracteres, então ele nunca disparou uma vez — e estava amarrado à amostra
    //   de hoje. Aqui o corte sai da geometria, e acompanha qualquer catálogo.
    let corte = quebra(t, larguraDots, hMin).slice(0, maxLinhas).join(' ');
    while (corte && quebra(corte + '...', larguraDots, hMin).length > maxLinhas) corte = corte.slice(0, -1);
    const esp = corte.lastIndexOf(' ');
    if (esp > corte.length * 0.6) corte = corte.slice(0, esp);
    // Reticências em ASCII ('...', não '…'): a fonte residente 0 não garante o glifo U+2026.
    corte = corte.replace(/[\s.,;:/-]+$/, '') + '...';
    return { h: hMin, linhas: quebra(corte, larguraDots, hMin).slice(0, maxLinhas), truncou: true };
  }

  // ── ENTRELINHA ────────────────────────────────────────────────────────────────────
  // MEDIDO: a entrelinha do ^FB é EXATAMENTE h (passo/h = 1,000 de h=14 a h=36).
  // ⚠ E o comentário antigo em conferencia.jsx:781 supõe 32 dots para fonte 26 (fator
  //   1,23). Os dois números NÃO batem — e a divergência deixou de importar, porque a
  //   partir do ET1 CADA LINHA SAI COM SEU PRÓPRIO ^FO. O passo vertical passou a ser
  //   escolha deste arquivo, não do firmware; o ^FB de cada campo tem maxlines=1 e só
  //   centraliza. Era esse acoplamento que fazia a etiqueta depender de um número do
  //   firmware que ninguém tinha medido.
  //
  // 1,15 dá ~0,30·h de branco entre as linhas (a tinta ocupa 0,81–0,86·h, medido).
  const ET_ENTRELINHA = 1.15;
  const passo = function (h) { return Math.round(h * ET_ENTRELINHA); };

  // Emite as linhas já quebradas como campos ZPL independentes, centralizados.
  // O ^FB de UMA linha aqui só CENTRALIZA — a quebra já aconteceu no ajusta().
  function campos(res, x, y, larguraDots) {
    const p = passo(res.h);
    return res.linhas
      .map(function (linha, i) {
        return '^FO' + x + ',' + (y + i * p) + '^A0N,' + res.h + ',' + res.h +
               '^FB' + larguraDots + ',1,0,C^FD' + linha + '^FS';
      })
      .join('\n');
  }

  // Altura ocupada, do topo da 1ª linha à base da última.
  function alturaDe(res) { return (res.linhas.length - 1) * passo(res.h) + res.h; }

  window.FRZplTexto = {
    AV26: AV26, MARGEM: FR_ZPL_MARGEM, AV_DESCONHECIDO: AV_DESCONHECIDO, ENTRELINHA: ET_ENTRELINHA,
    sanitiza: sanitiza, avanco: avanco, largura: largura, passo: passo,
    quebra: quebra, ajusta: ajusta, campos: campos, alturaDe: alturaDe,
  };
})();
