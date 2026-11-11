## Context
As ilustrações animadas estão embutidas no HTML. A mesa usa cenas reutilizáveis nas `<defs>` (`mesa-cena-praia`, `-montanha`, `-cidade`, `-sol`, `-festa`, `-viagem`, `-noite`), cada uma desenhada numa caixa 0 0 76 76 (janela da polaroid) e usada por `<use href="#mesa-cena-…">` dentro de cada polaroid. A câmera do hero tem o grupo `cam-foto` com sua própria cena.

## Decisions
1. **Trocar a cena na fonte**: dentro de cada `<g id="mesa-cena-*">`, substituir o desenho por `<image href="<caminho relativo>/assets/img/fotos/<foto>.jpg" x="0" y="0" width="76" height="76" preserveAspectRatio="xMidYMid slice"/>` (mantendo o `<g>` e o id). Assim todas as polaroids da mesa mudam sem tocar nas polaroids. Caminhos relativos à página (entrar: `../../assets/…`; apresentação: `assets/…`).
2. **Fundo**: um `<image>` de `mesa.jpg` cobrindo o quadro inteiro, antes das polaroids, com um `<rect>` branco a 35–45% por cima (véu) para manter contraste; sem novas cores (T2: a foto é conteúdo).
3. **Hero**: `cam-foto` recebe a foto `montanha.jpg` do mesmo modo; as duas polaroids pousadas (`hero__pol`) viram `<figure class="hero__pol">` com moldura HTML (borda branca e faixa inferior larga, sombra de papel) e `<img src="assets/img/fotos/praia.jpg|viagem.jpg" width height alt="">` decorativo.
4. **Banner da faixa**: embutir o conteúdo de `banner-imprimir.svg` e trocar as cenas das polaroids por `<image>` das fotos (ids continuam com prefixo `bimp-`).
5. **Acessibilidade e SEO**: imagens decorativas (`aria-hidden` herdado ou `alt=""`); um `<h1>` por página; nada de recurso externo (T6: as fotos são arquivos do próprio site).

## Risks / Trade-offs
- [Peso] → fotos de 31–120 KB, `loading="lazy"` nas que ficam abaixo da primeira dobra.
- [Contraste do texto sobre a mesa] → véu branco e texto fora da área da foto.
