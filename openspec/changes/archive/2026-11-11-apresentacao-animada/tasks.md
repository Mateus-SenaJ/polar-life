## 1. Apresentação (T-28)

- [x] 1.1 `site/index.html` + `site/assets/css/pages/apresentacao.css`: nova ordem do brief §5.2 (hero claro com a câmera embutida e A2; faixa preta com `banner-imprimir.svg`; «Como fica na mesa» com a mesa embutida e A1 por rolagem; fatos em três colunas), sem mexer no bloco `seo:inicio…seo:fim`, um `<h1>` e um LED

## 2. Como funciona (T-29)

- [x] 2.1 `site/como-funciona/index.html` + `site/assets/css/pages/como-funciona.css`: ordem do brief §5.3 (`rolo-filme.svg` com A4 na introdução; uma ilustração de 96 px por passo; A3 onde o brief indicar)

## 3. Movimento e banners de simulação

- [x] 3.1 Animações A1–A6 (§5.4) usando `PLMOV`; classes que escondem só com `html.mov-ok`; movimento reduzido = estado final
- [x] 3.2 `site/app/inicio/`: dois banners de simulação («Adicionar fotos» e «Editar») na rotação de `PLBANNERS`, SVG embutido + `@keyframes` (loop ≤ 6 s), pausa com hover/foco, quadro final com movimento reduzido

## 4. Verificação

- [x] 4.1 `tests/e2e/testar-apresentacao.mjs` (Playwright): os cenários da spec `apresentacao` (inclusive JavaScript desligado e movimento reduzido); capturas 1440 e 390 em `tests/saida/apresentacao/`; acrescentar ao `testar:node`; ajustar `testar-inicio.mjs` para 5 banners
- [x] 4.2 Rodar `npm run sw`, `npm run verificar` (inclui SEO) e `npm run testar:node` (saída 0) e registrar a saída real

## Saída real (4.2)

- `npm run sw` → `✔ sw-arquivos.js: 118 arquivos, versão 53f47849349d`
- `npm run verificar` → `Páginas: 24 · Arquivos: 206` · `✔ Sem erros` · `✔ SEO em dia`
- `node tests/e2e/testar-apresentacao.mjs` → `✔ Apresentação e Como funciona: sem falhas`
- `node tests/e2e/testar-inicio.mjs` → `✔ Página Início: sem falhas`
- `npm run testar:node` → sai com 0 (nenhuma falha)
