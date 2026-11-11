## Why

Parte B da tarefa 40 (D-117, D-118, D-122): a Apresentação (T-28, página inicial pública) e o Como funciona (T-29) ainda não usam as ilustrações do Fable nem o movimento combinado, e o dono pediu dois banners que **mostrem o produto funcionando** (adicionar fotos e editar).

## What Changes

- T-28 (`site/index.html`) na nova ordem do brief `docs/14_BRIEF_DESIGN_R2.md` §5.2: hero claro com `camera-instantanea.svg` soltando a polaroid (A2) e polaroids pousadas ao lado; faixa preta com `banner-imprimir.svg` (componente `faixa-escura` da parte A); seção «Como fica na mesa» com `mesa-polaroids.svg` e as polaroids pousando ao rolar (A1).
- T-29 (`site/como-funciona/index.html`) na ordem do §5.3: `rolo-filme.svg` na introdução (A4) e uma ilustração por passo; revelação tipo filme instantâneo (A3) onde o brief indicar.
- Animações A1–A6 do §5.4 pelo componente `movimento` (PLMOV) já existente; só `transform`, `opacity` e `clip-path`; `prefers-reduced-motion` = estado final estático.
- Dois banners novos de **simulação** na rotação do Início (`app/inicio/`): «Adicionar fotos» (miniaturas caindo numa folha e se encaixando nas polaroids) e «Editar» (uma polaroid com zoom/arraste, troca de filtro e a legenda sendo escrita). HTML/CSS/SVG, sem vídeo, loop de no máximo 6 s, pausa com hover/foco, quadro final estático com movimento reduzido.

## Capabilities

### New Capabilities
- `apresentacao`: páginas públicas T-28 e T-29 ilustradas e animadas, e os banners de simulação do produto.

### Modified Capabilities
(nenhuma)

## Impact

- `site/index.html`, `site/como-funciona/index.html`, `site/assets/css/pages/apresentacao.css`, `site/assets/css/pages/como-funciona.css`, `site/app/inicio/` (2 banners), componentes `movimento`/`banners` (só se precisar estender), `npm run seo` se mudar `<title>`/descrição (não deve mudar), `npm run sw`.
- SEO e semântica das páginas públicas devem continuar passando no `verificar` (um `<h1>`, canonical, Open Graph).
- Fora do escopo: textos jurídicos, preços, colagens funcionando (T-15).
