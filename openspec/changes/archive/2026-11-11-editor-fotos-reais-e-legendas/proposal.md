# Proposal

## Why

Relato do dono: «depois de selecionar as fotos, elas não aparecem nem no modo individual (Quadro) nem no modo folha» e «verifique os bugs principalmente nas legendas da edição». A reprodução com projeto real (JPEGs gerados por canvas, com EXIF; roteiro em `tests/saida/bugs/repro.mjs`, capturas em `tests/saida/bugs/*.png`) confirmou:

**Fotos (P0)** — em projeto real, nenhum `<img src="blob:…">` existe no editor:
- F1 · Quadro, janela: `pintaMain()` chama sempre `cena()` (SVG de exemplo) — `site/assets/js/pages/quadro.js`.
- F2 · Quadro, faixa de miniaturas: `thumb()` usa `cena()` — mesmo arquivo.
- F3 · Quadro, quadradinhos de filtro, «Comparar» e «Sugerido»: `grade()`, `comparar()`, `sugerir()` usam `Q.cena` — `site/assets/js/editor/filtros.js`.
- F4 · Folhas, mesa e faixa: `polaroid()` desenha só o ícone em `.pol__ph` — `site/assets/js/pages/editor.js`.
- F5 · Folhas, aba Fotos: `.foto-mini` é só o texto «Foto N» — `painelExtra()` em `editor.js`.
Só o PDF (`nucleo/gerador.js`, `rasterizar`) usa a foto real.

**Legendas (P1/P2)** — projeto real «Praia 2025», 4 fotos (3 com data EXIF):
- L1 (P1) · Texto de exemplo em foto real. Passos: abrir o Quadro sem digitar nada → a polaroid mostra «Dias de sol» / «Nós dois» e o campo «Texto desta foto» vem preenchido; nas Folhas e no PDF a mesma foto sai sem texto. Causa: `T()` em `editor/legendas.js` devolve a lista de exemplo quando `txt` é `null`, sem olhar `PLTEXTO.ehReal()`.
- L2 (P1) · Data e cidade digitadas somem. Passos: Metadados → Cidade «Recife», Data «09/03/2025» → recarregar o Quadro (ou reabrir o projeto) → cidade e data manuais sumiram no Quadro, nas Folhas e no PDF. Causa: `quadro.js` linha 68, `ST[i+1].meta=r.meta||{}` sobrescreve o que a pessoa editou com o EXIF bruto a cada carga.
- L3 (P1) · A data real (EXIF) nunca aparece no Quadro, mas aparece nas Folhas e no PDF (quebra MT-02); no Pocket o Quadro mostra só o local. Causa: o EXIF grava `AAAA-MM-DDTHH:MM:SS` e `pd()` em `editor/metadados.js` só aceita `…THH:MM`; `Q.meta()` devolve `data:null`.
- L4 (P1) · Estado «SP» inventado. Passos: Cidade «Recife» → legenda «Recife, SP» (tela e PDF). Causa: `localLG()` em `nucleo/legenda-texto.js` e `localTxt()` em `editor/legendas.js` usam UF/país fixos do exemplo (e são duas funções para a mesma conta).
- L5 (P2) · Painel Metadados de foto real: «Origem undefined», «Sem data na foto» mesmo com EXIF, campo Data vazio. Causa: o `meta` bruto do EXIF não tem `o`, `ds`, `c` (mesma origem do L2/L3).
- L6 (P2) · Nome de exemplo «Viagem · Serra 2026» no título da aba do Quadro (`render()` em `quadro.js` reescreve `document.title`), no rodapé da folha (`desenhar()` em `editor.js`) e no rodapé do PDF (`rodape()` em `gerador.js`).
Conferido e sem defeito: alinhamento E/C/D (D-136), «Sem legendas» ligado nas Folhas e lido no Quadro (D-135), estilos prontos, fonte, texto digitado e alinhamento persistem ao recarregar e ao reabrir; Pocket (D-113) entra em duas linhas nas Folhas antes e depois do Quadro.

## What Changes

- Novo componente compartilhado `window.PLFOTOTELA` (`site/assets/js/ui/foto-tela.js`): único lugar que cria e revoga object URLs das fotos, gera miniaturas reduzidas, calcula o estilo de recorte e o filtro de tela.
- Quadro (janela, faixa, filtros, comparar, sugestão), Folhas (mesa, faixa de folhas, aba Fotos) passam a mostrar a foto real com o mesmo recorte e os mesmos ajustes do PDF (z, px, py, ang, rot, flip, modo, adj, flt, vinheta).
- No exemplo (`PLTEXTO.ehReal()` falso) nada muda: cena de exemplo no Quadro, ícone nas Folhas.
- Correções de legenda L1–L6: sem texto de exemplo em projeto real; metadados editados preservados; data EXIF igual no Quadro, nas Folhas e no PDF; local sem estado/país inventados em projeto real (uma função só); nome real do projeto no título e no rodapé.

## Capabilities

### New Capabilities
- `editor-fotos-reais`: exibição das fotos reais do projeto no editor (Quadro e Folhas), fonte única de object URLs, miniaturas e recorte na tela igual ao do PDF.

### Modified Capabilities
- `legenda-polaroid`: novos requisitos para projeto real — sem dados de exemplo, metadados editados persistem, data e local iguais em Quadro, Folhas e PDF.

## Impact

- Código: `site/assets/js/ui/foto-tela.js` (novo), `pages/quadro.js`, `pages/editor.js`, `editor/filtros.js`, `editor/legendas.js`, `editor/metadados.js`, `nucleo/legenda-texto.js`, `nucleo/gerador.js` (só o nome no rodapé), `site/app/editor/index.html`, `site/app/editor/quadro/index.html`, `site/app/sw-arquivos.js` (gerado por `npm run sw`), `package.json` (testes novos em `testar:node`).
- Testes novos: `tests/e2e/testar-fotos-tela.mjs`, `tests/e2e/testar-legendas-reais.mjs`.
- Respeita: T4 (nada sobre a foto), T5 (tudo no aparelho; object URL é local), T6 (nenhum recurso externo), T2 (sem cor nova), MT-02 (mesma conta de recorte e de texto na tela e no PDF), D-113, D-123, D-130, D-135, D-136, BR-06 (nunca coordenada), chave do IndexedDB `Number(src)` intacta, CSP atual (`img-src 'self' data: blob:`).
- Pede decisão nova ao orquestrador (sugestão D-138): «em projeto real o local da legenda é só o texto digitado em Cidade; estado e país não são acrescentados» (corrige L4; os controles Estado/País/Ordem ficam só no exemplo).
- Fora do escopo: guardar miniaturas no IndexedDB (sem mudar `VERS`); estilo padrão das Folhas/PDF antes da primeira visita ao Quadro (5,2 mm × 16 pt); seletor «Filtro» da aba Ajustes das Folhas (sem ação hoje); unificar a lista de filtros do `gerador.js`; telas fora do editor (resumo, pré-voo, exportar).
