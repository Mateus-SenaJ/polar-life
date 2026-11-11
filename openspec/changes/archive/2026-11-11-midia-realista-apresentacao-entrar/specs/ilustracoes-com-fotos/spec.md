## ADDED Requirements

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
