## 1. Contratos e migração (sem UI)

- [ ] 1.1 `site/assets/js/nucleo/legenda-texto.js`: acrescentar `alinharX(al, L, JW, w)`, `assinaturaPos(leg, fr)` e `migrar(leg)` (idempotente) e expor em `window.PLTEXTO`; manter `assinaturaDir` como atalho para `assinaturaPos(...) === 'dir'` até a tarefa 3.3
- [ ] 1.2 `tests/unit/testar-legenda-migracao.mjs` (Node + vm, sem navegador): `migrar({pos:'acima',dx:3})` → `{al:'dir'}` sem pos/dx; `migrar({limpa:true})` → `{original:true}`; idempotência; `alinharX('centro',6,76,20)` = 34; `assinaturaPos({al:'esq',assin:'auto'}, frPocket)` = `'dir'`
- [ ] 1.3 Chamar `PLTEXTO.migrar` em `editor/legendas.js` (ao ler `ST[0].leg`), `pages/editor.js`, `gerador.projeto()` e `nucleo/projetos.js` (`importar`)

## 2. Motor do PDF (MT-02)

- [ ] 2.1 `site/assets/js/nucleo/gerador.js` `layoutLegenda`: remover ramos `pos==='acima'`/`ambas`, `GAP_ACIMA` e `dx`; usar `alinharX` para a caixa do texto e para cada linha de meta; `leg.original` → `[]`
- [ ] 2.2 `tests/e2e/testar-pdf.mjs`: trocar os casos MT-02 «acima» e «ambas» por «esquerda», «centro» e «direita» (desvio ≤ 0,2 mm), mantendo o caso padrão e o horizontal

## 3. Tela e controles

- [ ] 3.1 `site/assets/js/editor/legendas.js`: «Polaroid original» como primeiro controle (interruptor, textos da docs/13 §4.2; demais seções com `aria-disabled` e véu quando ligado); seção Posição vira botões de seleção Esquerda · Centro · Direita; remover Acima, Ambas e «Deslocar na horizontal»; aplicar `--al` na polaroid
- [ ] 3.2 CSS (`site/assets/css/editor/legendas.css`, `site/assets/css/pages/quadro.css`, `site/assets/css/pages/editor.css`): `text-align: var(--al)` na faixa e nas linhas do Pocket
- [ ] 3.3 `site/assets/js/pages/editor.js` (folhas) e `site/assets/js/pages/quadro.js`: ler `leg.original`/`leg.al` e usar `assinaturaPos`; remover `leg.limpa`
- [ ] 3.4 `site/assets/js/editor/prevoo.js`: com `leg.original`, não acusar área segura do texto

## 4. Verificação

- [ ] 4.1 `tests/e2e/testar-texto-alinhado.mjs` (Playwright, login de teste no addInitScript): os cenários da spec `legenda-polaroid` (original na tela/folhas/PDF; direita e centro na tela e no PDF; projeto com `pos:'acima'` abre com o texto abaixo e sem erro)
- [ ] 4.2 Acrescentar os dois testes novos ao `testar:node` em `package.json`
- [ ] 4.3 Rodar `npm run sw`, `npm run verificar` (✔ Sem erros) e `npm run testar:node` (saída 0) e registrar a saída real
