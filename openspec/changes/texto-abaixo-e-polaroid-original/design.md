## Context

O texto da polaroid é calculado em dois lugares que precisam concordar ao décimo de milímetro (MT-02): a tela (`editor/legendas.js` no Quadro, `pages/editor.js` nas folhas) e o PDF (`nucleo/gerador.js`, `layoutLegenda`). As medidas de linha vêm de `PLTEXTO` (`nucleo/legenda-texto.js`). Hoje existem ramos para `pos` («abaixo», «acima», «ambas»), deslocamento `dx` e a chave `leg.limpa` (D-119). Referência completa: docs/13_EDITOR_V3.md §4.

## Goals / Non-Goals

**Goals:** um único cálculo de x para todas as linhas; «Polaroid original» lida pela mesma chave em tela, folhas, pré-voo e PDF; migração idempotente; nenhuma regressão no Pocket (D-113) nem na assinatura (D-128).

**Non-Goals:** casca nova do editor; stickers/emojis; mudar fontes, corpos ou a vertical das linhas.

## Decisions

1. **Modelo de dados (`ST[0].leg`, projeto todo)**: acrescenta `original:false`, `al:'esq'`, `assin:'auto'`; remove `pos`, `dx`, `limpa`. Medidas em mm; o gerador converte para µm inteiros (MT-01).
2. **`PLTEXTO.alinharX(al, L, JW, w)`** → mm: `L` (esq), `L + (JW − w)/2` (centro), `L + JW − w` (dir); `w` nunca maior que `JW` (o texto já é cortado com «…» pela caixa da figcaption, 30a/T4).
3. **Gerador**: `layoutLegenda` perde os ramos acima/ambas e `GAP_ACIMA`; `capItems(top, x)` e `metaItems(ln, x)` recebem `x = alinharX(...)` com `w = capBoxW` (texto) ou a soma dos segmentos da linha (meta). `leg.original` → retorna `[]` (como `limpa` hoje). `clip` continua `{x:L, w:JW}`.
4. **Tela**: a polaroid recebe `--al: left|center|right` (`text-align` na faixa e nas linhas absolutas do Pocket `.lg-xl`); `text-rendering:geometricPrecision` já está aplicado (CI Linux).
5. **Assinatura**: `assinaturaPos(leg, fr)` → `'esq'|'centro'|'dir'`; `auto` = canto oposto; centro → o lado com mais folga. Substitui `assinaturaDir` (o retorno booleano antigo vira `assinaturaPos(...) === 'dir'` nos chamadores).
6. **Migração**: `PLTEXTO.migrar(leg)` chamada por `legendas.js` (ao ler `ST[0].leg`), `pages/editor.js`, `gerador.projeto()` e `projetos.importar`. Idempotente; nunca lança erro com dados parciais.

## Risks / Trade-offs

- [Projetos com «acima» mudam de aparência] → é a decisão D-136; a migração preserva conteúdo, só muda o lugar.
- [Divergência tela × PDF no alinhamento] → teste Playwright mede as duas bordas (± 1 px na tela, ± 0,2 mm no PDF, tolerância do DOC-08).
- [Testes antigos de MT-02 «acima»/«ambas»] → reescritos para Esquerda/Centro/Direita no mesmo arquivo `testar-pdf.mjs`.
