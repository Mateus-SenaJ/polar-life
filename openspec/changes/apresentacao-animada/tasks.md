## 1. Apresentação (T-28)

- [ ] 1.1 `site/index.html` + `site/assets/css/pages/apresentacao.css`: nova ordem do brief §5.2 (hero claro com a câmera embutida e A2; faixa preta com `banner-imprimir.svg`; «Como fica na mesa» com a mesa embutida e A1 por rolagem; fatos em três colunas), sem mexer no bloco `seo:inicio…seo:fim`, um `<h1>` e um LED

## 2. Como funciona (T-29)

- [ ] 2.1 `site/como-funciona/index.html` + `site/assets/css/pages/como-funciona.css`: ordem do brief §5.3 (`rolo-filme.svg` com A4 na introdução; uma ilustração de 96 px por passo; A3 onde o brief indicar)

## 3. Movimento e banners de simulação

- [ ] 3.1 Animações A1–A6 (§5.4) usando `PLMOV`; classes que escondem só com `html.mov-ok`; movimento reduzido = estado final
- [ ] 3.2 `site/app/inicio/`: dois banners de simulação («Adicionar fotos» e «Editar») na rotação de `PLBANNERS`, SVG embutido + `@keyframes` (loop ≤ 6 s), pausa com hover/foco, quadro final com movimento reduzido

## 4. Verificação

- [ ] 4.1 `tests/e2e/testar-apresentacao.mjs` (Playwright): os cenários da spec `apresentacao` (inclusive JavaScript desligado e movimento reduzido); capturas 1440 e 390 em `tests/saida/apresentacao/`; acrescentar ao `testar:node`; ajustar `testar-inicio.mjs` para 5 banners
- [ ] 4.2 Rodar `npm run sw`, `npm run verificar` (inclui SEO) e `npm run testar:node` (saída 0) e registrar a saída real
