## 1. Ilustração

- [x] 1.1 `site/app/entrar/index.html`: substituir o `<svg class="mesa">` provisório pelo conteúdo de `site/assets/img/ilustracoes/mesa-polaroids.svg` (manter `class="mesa"`, `preserveAspectRatio="xMidYMid slice"`, `focusable="false"`; comentário apontando a fonte); acrescentar `class="mesa-p"` em `#mesa-p1`…`#mesa-p7`
- [x] 1.2 `site/assets/css/pages/entrar.css`: remover regras do SVG provisório que não servem mais; `aspect-ratio:16/10` na mesa; `@keyframes mesa-foto-sai` em `#mesa-cam-foto` depois das polaroids; `reduced-motion` desliga as duas animações

## 2. Verificação

- [x] 2.1 `tests/e2e/testar-entrar-mesa.mjs` (Playwright): os dois cenários da spec `tela-entrar` (desktop e celular; reduced-motion), sem erro de página; acrescentar ao `testar:node`
- [x] 2.2 Rodar `npm run sw`, `npm run verificar` e `npm run testar:node` (saída 0) e registrar a saída real
