## 1. Padrões de Folhas

- [x] 1.1 `PLFOLHAS.PADRAO` 3/0, `MARGEM_MIN`, editor, cotas, ajudas, «Novo projeto» e pré-voo (`motor-folhas.js`, `pages/editor.js`, `pages/novo-projeto.js`, `editor/prevoo.js`; teste: `testar-colagem.mjs` e `testar-colagem-pdf.mjs`)
- [x] 1.2 Projetos existentes mantêm 10/4 (`v:2` em `projetos.js` e `inicio.js`; teste: `testar-colagem-pdf.mjs`)
- [x] 1.3 Ajustar `testar-pocket.mjs` aos números de 3/0 (teste: `testar-pocket.mjs`)

## 2. Modo Colagem

- [x] 2.1 `nucleo/colagem.js` (layouts, paginação, fundo, `eixoGrad`) e delegação em `PLFOLHAS.paginar` e `contar` (teste: `tests/unit/testar-colagem.mjs`)
- [x] 2.2 Aba «Colagem», fundo e rotação na tela (`pages/editor.js`, `app/editor/index.html`, `css/pages/editor.css`; teste: `testar-colagem-pdf.mjs`)
- [x] 2.3 Persistência em `pl-folhas` e `colagem.js` nas páginas que usam `motor-folhas.js` (`npm run sw`; teste: `testar-colagem-pdf.mjs`)

## 3. PDF

- [x] 3.1 Item `fundo` (cor, sombreamento axial, JPEG cover), rotação e contorno por polaroid em `nucleo/gerador.js` (teste: tela = PDF em `testar-colagem-pdf.mjs`)
- [x] 3.2 Original sem recompressão, DPI efetivo, 300 a 600 PPI, `qualidade` e `grande` e aviso em `gerador.js` e `pages/gerar.js` (teste: medições com fotos reais em `testar-colagem-pdf.mjs`)

## 4. Registro e verificação

- [x] 4.1 D-150, D-151 e D-152 em `docs/10_LOG_DECISOES.md`
- [x] 4.2 Rodar `npm run sw`, `npm run verificar` e `npm run testar:node` e registrar a saída real
