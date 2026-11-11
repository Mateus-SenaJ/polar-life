## 1. Dados e PLLOCAIS

- [x] 1.1 `tools/gerar-locais.mjs`, `site/assets/dados/locais/`, `CREDITOS.md` e link na Legal (teste: `tests/unit/testar-locais.mjs`, tamanhos)
- [x] 1.2 `site/assets/js/nucleo/locais.js` com `buscar`, `deCoordenadas`, `pontosProximos` (teste: `tests/unit/testar-locais.mjs`)
- [x] 1.3 `site/assets/js/nucleo/exif.js` lê latitude e longitude (teste: `tests/unit/testar-exif.mjs`, `tests/e2e/testar-legenda-padroes.mjs`)

## 2. Legenda avançada

- [x] 2.1 `PLTEXTO.comPadrao` e uso em `gerador.js`, `pages/editor.js` e `legendas.js` (teste: `testar-legenda-padroes.mjs`, tela = Folhas = PDF)
- [x] 2.2 Seção «Avançado», exceção por foto, manual, «Restaurar sugestão», «Aplicar a todas» (teste: `testar-legenda-padroes.mjs`)
- [x] 2.3 Interruptor «Sugestões de legendas» e autocomplete em `legendas.js` e `metadados.js` (teste: `testar-legenda-padroes.mjs`)

## 3. Registro e verificação

- [x] 3.1 D-139 em `docs/10_LOG_DECISOES.md`
- [x] 3.2 Rodar `npm run sw`, `npm run verificar` e `npm run testar:node` e registrar a saída real
