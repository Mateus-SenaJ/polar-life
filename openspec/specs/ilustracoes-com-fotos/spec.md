# ilustracoes-com-fotos Specification

## Purpose
TBD - created by archiving change ilustracoes-com-fotos. Update Purpose after archive.

## Requirements

### Requirement: Polaroids animadas com fotografias reais
As polaroids da mesa animada (tela de entrar e apresentação), a foto que sai da câmera e as polaroids pousadas do hero, e as polaroids do banner da faixa preta da apresentação SHALL mostrar fotografias reais de `site/assets/img/fotos/`, carregadas do próprio site, mantendo as animações e o estado final com movimento reduzido.

#### Scenario: Fotos carregadas na tela de entrar e na apresentação
- **WHEN** `app/entrar/` e `/` são abertas em 1440×900 e 390×844
- **THEN** cada `mesa-cena-*` contém uma `<image>` de `assets/img/fotos/`, todas as imagens de foto carregam com sucesso (nenhuma requisição falha), não há erro de página, e o `npm run verificar` termina sem erros

#### Scenario: Movimento reduzido mantém as fotos
- **WHEN** as páginas abrem com movimento reduzido
- **THEN** as polaroids aparecem na posição final já com as fotos

### Requirement: Fundo fotográfico da mesa
A cena da mesa SHALL ter como fundo a foto `mesa.jpg` com um véu claro que preserva o contraste, em vez do fundo liso.

#### Scenario: Fundo presente
- **WHEN** a tela de entrar é aberta
- **THEN** a mesa tem uma `<image>` de `mesa.jpg` atrás das polaroids

### Requirement: Créditos das imagens
A página Legal SHALL ter uma seção «Créditos das imagens» com link para `assets/img/fotos/CREDITOS.md`.

#### Scenario: Link de créditos
- **WHEN** `legal/` é aberta
- **THEN** existe o link «Créditos das imagens» que leva a um arquivo que responde 200

### Requirement: Polaroids com legenda e data manuscritas
As polaroids da mesa (apresentação e tela de entrar), do banner da faixa preta e do hero da apresentação SHALL mostrar uma legenda manuscrita ligada à foto e, em algumas, uma data, em texto real (Caveat), e MUST NOT usar rabiscos ondulados no lugar do texto.

#### Scenario: Legendas no lugar dos rabiscos
- **WHEN** `/` e `app/entrar/` são abertas
- **THEN** cada uma das sete polaroids da mesa tem um `text.pol-leg`, pelo menos três têm `text.pol-data` no formato de data, as duas polaroids do hero têm legenda com data, e nenhuma polaroid tem traço de rabisco

### Requirement: Lugares para fotos de pessoas
Cada foto das polaroids SHALL ter um lugar reservado (`data-midia-foto`) para uma foto de pessoas (amigos, casais, família); quando o arquivo existe, ele MUST entrar no lugar da foto de reserva, e sem ele a foto atual continua.

#### Scenario: Troca pelas fotos de pessoas
- **WHEN** a lista de mídias contém as oito fotos de pessoas
- **THEN** toda imagem com `data-midia-foto` aponta para `assets/img/fotos/<slot>.jpg`
