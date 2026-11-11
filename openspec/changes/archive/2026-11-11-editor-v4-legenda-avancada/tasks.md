## 1. Fontes

- [x] 1.1 `tools/baixar-fontes.mjs` (famílias novas do GitHub google/fonts, variantes, licenças) e `site/assets/css/base/fonts.css` (teste: `tests/e2e/testar-edicao-v4.mjs` seção 5, `tests/e2e/testar-fontes.mjs`)
- [x] 1.2 `PLTEXTO.VAR`, `famLG`, `variante`, `estilosDe`; `gerador.arquivoFonte` (teste: `testar-edicao-v4.mjs` seção 5, PDF com `Lora-700-Italico`)
- [x] 1.3 `tools/verificar.mjs`: `font-weight: 700` só em `@font-face` (teste: `npm run verificar`)

## 2. Legenda avançada

- [x] 2.1 `leg.av`, `FMTD[13..14]`, `fmtLocal`, `cxMeta`, `comPadrao` (teste: `testar-edicao-v4.mjs` seções 3 e 4)
- [x] 2.2 `editor/legendas.js`: Configurações avançadas, botões Itálico e Negrito, inclinação −8..8 (teste: `testar-edicao-v4.mjs` seções 1, 3 a 5)
- [x] 2.3 `editor/metadados.js` vira seção de Avançado; remove a aba do Quadro e das Folhas (teste: `testar-legendas-reais.mjs`, `testar-editor.mjs`, `testar-edicao-v4.mjs` seções 1 e 2)
- [x] 2.4 `pages/editor.js` e `gerador.js` aplicam caixa e espaçamento (teste: `testar-edicao-v4.mjs` seção 3)

- [x] 2.5 Painel de 2 linhas do projeto real, um conjunto de estilo com alvo, Avançado com `<select>`, migração (teste: `testar-edicao-v4.mjs` seções 1, 3, 4, 5 e 8; `testar-legenda-padroes.mjs`; `testar-legendas-reais.mjs`)

## 3. Quadro

- [x] 3.1 `PLFOTOS.removerFoto` e `restaurarFoto`, `excluirFoto`, `sincBlobs`, botão e menu da miniatura (teste: `testar-edicao-v4.mjs` seção 6)
- [x] 3.2 Arrasto: rAF + transform, limite por bisseção, elástico no sentido do gesto (teste: `testar-edicao-v4.mjs` seção 7)

## 4. Registro e verificação

- [x] 4.1 D-148 e D-149 em `docs/10_LOG_DECISOES.md`
- [x] 4.2 Rodar `npm run sw`, `npm run verificar` e `npm run testar:node` e registrar a saída real
