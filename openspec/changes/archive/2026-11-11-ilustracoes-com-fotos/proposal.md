## Why

O dono pediu fotos de verdade nas polaroids animadas da apresentação e da tela de entrar, e um fundo de cena (hoje são desenhos planos sobre branco). As fotos CC0 já estão em `site/assets/img/fotos/` (praia, montanha, cidade, por-do-sol, aniversario, viagem, casal, mesa; créditos em `CREDITOS.md`).

## What Changes

- Mesa animada embutida (tela de entrar `site/app/entrar/index.html` e seção «Como fica na mesa» de `site/index.html`): cada `<g id="mesa-cena-*">` nas `<defs>` passa a conter uma `<image>` da foto correspondente (praia→praia.jpg, montanha→montanha.jpg, cidade→cidade.jpg, sol→por-do-sol.jpg, festa→aniversario.jpg, viagem→viagem.jpg, noite→casal.jpg) com `preserveAspectRatio="xMidYMid slice"` e recorte na janela da polaroid; o fundo da cena passa a ser `mesa.jpg` (com um véu branco leve para o desenho continuar legível).
- Hero da apresentação: a foto que sai da câmera e as duas polaroids pousadas mostram fotos reais (as polaroids pousadas viram molduras HTML com `<img>` da foto, porque um SVG carregado por `<img>` não carrega imagens externas).
- Faixa preta da apresentação: o banner passa a mostrar fotos reais nas polaroids (SVG embutido em vez de `<img>`, mesma composição).
- Página Legal: seção curta «Créditos das imagens» com link para `assets/img/fotos/CREDITOS.md` (boa prática, mesmo com CC0).
- Animações, movimento reduzido e funcionamento sem JavaScript continuam iguais.

## Capabilities

### New Capabilities
- `ilustracoes-com-fotos`: polaroids das ilustrações animadas mostram fotografias reais e a mesa tem fundo fotográfico.

### Modified Capabilities
(nenhuma)

## Impact

- `site/app/entrar/index.html`, `site/index.html`, CSS das duas páginas, `site/legal/index.html`, `npm run sw`.
- Fora do escopo: banners e modelos do Início (carregados por `<img>`; ficam para outra mudança), Como funciona.
