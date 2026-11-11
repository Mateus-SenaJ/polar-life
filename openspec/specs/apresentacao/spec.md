# apresentacao Specification

## Purpose
TBD - created by archiving change apresentacao-animada. Update Purpose after archive.

## Requirements

### Requirement: Apresentação e Como funciona ilustradas
A Apresentação (`/`) e o Como funciona (`/como-funciona/`) SHALL seguir a ordem de seções do brief §5.2 e §5.3, usando as ilustrações do Fable (câmera instantânea com a polaroid saindo, mesa com polaroids, rolo de filme e uma ilustração por passo), mantendo um único `<h1>`, um único botão LED, nenhuma rolagem lateral e o SEO atual.

#### Scenario: Páginas ilustradas no desktop e no celular
- **WHEN** `/` e `/como-funciona/` são abertas em 1440×900 e em 390×844
- **THEN** cada página tem exatamente um `<h1>`, um único `.led-btn`, a câmera e a mesa (na T-28) e o rolo de filme (na T-29), nenhuma rolagem lateral, nenhum erro de página e o `npm run verificar` termina sem erros

#### Scenario: Funciona sem JavaScript
- **WHEN** as páginas são abertas com JavaScript desligado
- **THEN** o `<h1>`, os textos e o botão principal estão visíveis e as ilustrações aparecem na posição final

### Requirement: Movimento discreto e respeitoso
As animações A1–A6 SHALL usar só `transform`, `opacity` e `clip-path`, acontecer ao entrar na tela, e MUST NOT rodar com `prefers-reduced-motion: reduce` (tudo na posição final).

#### Scenario: Movimento reduzido
- **WHEN** `/` é aberta com movimento reduzido e a página é rolada até o fim
- **THEN** nenhum elemento tem animação ativa (`animation-name` igual a `none` ou `getAnimations()` vazio) e todos os grupos `mesa-p*` e `cam-foto` estão com opacidade 1

### Requirement: Banners que simulam o produto
O Início SHALL incluir, na rotação da faixa preta, dois banners de simulação: «Adicionar fotos» e «Editar», feitos em HTML/CSS/SVG, com loop de no máximo 6 s, pausando com hover ou foco e mostrando o quadro final com movimento reduzido.

#### Scenario: Cinco banners e simulação parada com movimento reduzido
- **WHEN** a conta de teste abre `app/inicio/`
- **THEN** a faixa tem 5 banners (3 do brief + 2 de simulação), cada um com indicador acessível
- **WHEN** a página abre com movimento reduzido
- **THEN** os banners de simulação mostram o quadro final sem animação
