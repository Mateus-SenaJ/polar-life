## Context
Brief `docs/14_BRIEF_DESIGN_R2.md` §5.1–§5.5 (ordem das seções da T-28 e da T-29, as seis animações A1–A6 com `--ease: cubic-bezier(.2,.7,.2,1)`, travas). Componentes da parte A: `ui/faixa-escura.css`, `ui/banners.js` (PLBANNERS), `ui/movimento.css` + `ui/movimento.js` (PLMOV). Ilustrações em `site/assets/img/ilustracoes/` (grupos prontos para animar: `cam-foto`, `mesa-p1…p7`).

## Decisions
1. **Animação por partes**: onde a animação mexe em grupos do desenho (A1 mesa, A2 câmera), o SVG é embutido no HTML (como na tela de entrar); nos demais, `<img>` com `width`/`height` e `loading="lazy"` fora da primeira dobra.
2. **Sem JS, tudo aparece**: o estado inicial visível é o final; as classes que escondem para animar só entram quando `PLMOV` carrega (`html.mov-ok`), então a página continua legível e com o botão principal sem JavaScript.
3. **Banners de simulação**: SVG embutido com animação CSS em `@keyframes` (loop ≤ 6 s), dentro da mesma estrutura de slide da faixa; pausa via a classe que `PLBANNERS` já aplica ao pausar; com movimento reduzido mostram o quadro final.
4. **SEO intocado**: `<title>`, descrição, canonical e Open Graph não mudam; um único `<h1>` por página; o bloco `seo:inicio…seo:fim` não é editado à mão.

## Risks / Trade-offs
- [Peso das páginas públicas] → SVGs leves (≤ 25 KB cada), carregamento preguiçoso fora da primeira dobra.
- [Movimento demais] → animações curtas, só uma vez ao entrar na tela (exceto os banners de simulação, que param com hover/foco e com movimento reduzido).
