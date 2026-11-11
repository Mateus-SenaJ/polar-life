## Context
Brief de design completo em `docs/14_BRIEF_DESIGN_R2.md` (§0 fundamentos e componentes; §2 T-32 com estrutura desktop e celular, textos finais, 8 modelos, 6 colagens e estados). Seguir o brief à risca; onde ele citar emoji na legenda, aplicar só no cartão (ver proposta).

## Decisions
1. **Ilustrações**: usar os SVG do Fable por `<img>` (banners e polaroids dos modelos) com `width`/`height` e `loading="lazy"` fora da primeira dobra. Só se uma animação precisar mexer em partes do desenho, embutir o SVG (como na tela de entrar).
2. **Modelos** (§2.4): dados num array em `pages/inicio.js` (formato do catálogo de molduras, preset, fonte e corpo da legenda, alinhamento `al`, texto sugerido, emoji). Aplicar = usar `PLPROJETOS.atual()` (ou `criar`), gravar `ST[0].fr` e `ST[0].leg` pelos mesmos dados de sessão que o editor já usa (`pl-quadro`/`pl-fmt`), passando por `PLTEXTO.migrar`, e abrir `../editor/quadro/`.
3. **Movimento**: só `transform`, `opacity` e `clip-path`; `prefers-reduced-motion` = estado final, sem rotação de banner; View Transitions só onde o navegador suporta (`@view-transition { navigation: auto; }`).
4. **T8**: um único botão LED por tela.

## Risks / Trade-offs
- [Muitas imagens] → `loading="lazy"` e tamanhos fixos; o service worker guarda os SVG.
- [View Transitions não suportadas] → navegação normal (melhoria progressiva).
