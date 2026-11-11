## ADDED Requirements

### Requirement: Excluir foto
O Quadro SHALL ter o botão «Excluir foto» (lixeira e texto) na barra da foto e no menu da miniatura. Excluir MUST remover somente aquela foto do projeto, das Folhas, do PDF e do IndexedDB (`fotos` e `fotosProjeto`), sem alterar as outras fotos nem seus ajustes, e MUST oferecer «Desfazer», que devolve a foto, o ajuste e o arquivo. O projeto MUST ficar com ao menos 1 foto.

#### Scenario: Excluir a foto 2 de 3
- **WHEN** a foto 2 é aberta e «Excluir foto» é acionado
- **THEN** `PLQ.ST()` fica com as fontes 1 e 3, `pl-fotos` é `[1,3]`, os ajustes, zoom e posição das fotos 1 e 3 não mudam, `fotosProjeto` perde só `projeto:2`, o PDF inclui só as fotos 1 e 3 e as Folhas mostram 2 polaroids

#### Scenario: Desfazer
- **WHEN** «Desfazer» é acionado no aviso
- **THEN** a foto 2 volta com o ajuste dela, `fotosProjeto` e `fotos` voltam a ter a cópia e a imagem aparece na janela

#### Scenario: Menu da miniatura e mínimo
- **WHEN** o botão direito na miniatura 1 abre o menu, «Excluir foto» é acionado e sobra uma foto
- **THEN** sai só a foto 1 e `#excluir` fica desabilitado

### Requirement: Enquadramento fluido
Arrastar a foto na janela SHALL mover a foto 1:1 com o ponteiro (deslocamento em px igual ao do mouse ou dedo), aplicado no máximo uma vez por quadro, sem refazer filtro nem selo de qualidade a cada evento. O limite SHALL existir só nas bordas, onde a foto cobre a janela por inteiro, e passando dele a foto MUST ceder com resistência suave no sentido do gesto e voltar ao soltar, sem zona morta ao inverter o sentido. Com zoom alto a foto MUST poder chegar às quatro bordas.

#### Scenario: Deslocamento proporcional
- **WHEN** o mouse arrasta 3 px à direita e 2 px acima, 20 vezes, com zoom 300%
- **THEN** a foto se desloca 3 px e −2 px a cada passo (erro ≤ 0,6 px) e 60 × −40 px no total

#### Scenario: Borda e elástico
- **WHEN** o arrasto passa muito da borda
- **THEN** a foto cede menos de 12% da janela, inverter 25 px a move na hora, ao soltar a borda da foto coincide com a da janela (±1 px), o elástico (`ex`, `ey`) volta a 0 e a janela tem `touch-action: none`
