## Context
A `.ent__mesa` tem um `<svg class="mesa" viewBox="0 0 390 244">` provisório com grupos `.mesa-p` animados por `@keyframes mesa-pousa` em `entrar.css` (atrasos por id, `reduced-motion` desliga).

## Decisions
1. **Embutir** o conteúdo de `mesa-polaroids.svg` (viewBox 0 0 1200 750) no lugar do SVG provisório, mantendo `class="mesa"`, `preserveAspectRatio="xMidYMid slice"`, `focusable="false"`, `aria-hidden` herdado da seção. Os ids já têm prefixo `mesa-` (sem colisão na página).
2. **Animação**: cada `<g id="mesa-pN">` ganha `class="mesa-p"` para reaproveitar `mesa-pousa` e os atrasos existentes; `#mesa-cam-foto` ganha `@keyframes mesa-foto-sai` (translateY de −90 para 0, 900 ms, depois das polaroids). `transform-box:fill-box; transform-origin:center` nos grupos.
3. **Arquivo-fonte único**: a ilustração continua em `site/assets/img/ilustracoes/` (o HTML é uma cópia embutida; comentário aponta a fonte).

## Risks / Trade-offs
- [HTML ~20 KB maior] → aceitável (uma página, sem requisição extra, cache do SW).
- [Animação pesada em celular fraco] → só transform/opacity; reduced-motion desliga.
