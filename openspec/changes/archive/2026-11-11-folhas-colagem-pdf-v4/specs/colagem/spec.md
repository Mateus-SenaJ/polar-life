## ADDED Requirements

### Requirement: Layouts da Colagem
O sistema SHALL oferecer de 4 a 6 layouts determinísticos (grade justa, mosaico em tijolo, espalhadas, tira e coração), escolhidos numa lista na aba «Colagem». Cada layout MUST manter a medida da polaroid, posicionar cada polaroid (já girada) dentro da margem da folha e repartir as fotos em `⌈fotos ÷ capacidade⌉` folhas. O mesmo projeto MUST gerar sempre as mesmas posições.

#### Scenario: Posições iguais na tela e no PDF
- **WHEN** cada layout é aplicado a um projeto de 6 fotos e a display list do PDF é comparada com a folha na tela
- **THEN** o centro de cada polaroid difere menos de 0,08 mm e o ângulo menos de 0,05°, todas ficam dentro da margem, não há guias de corte e cada polaroid tem contorno

#### Scenario: Papel pequeno
- **WHEN** o papel não comporta a polaroid no layout escolhido
- **THEN** a folha mostra o erro «A polaroid não cabe neste papel» e nenhuma posição inválida é gerada

### Requirement: Fundo da folha
A Colagem SHALL ter fundo escolhido pela pessoa: cor sólida (qualquer `#RRGGBB`), degradê de 2 cores com ângulo, ou foto. O padrão MUST ser foto, usando a primeira foto do projeto; um seletor de miniaturas MUST permitir escolher outra foto específica. A foto cobre a folha (cover) com posição horizontal e vertical e a opção «Suavizar o fundo» (desfoque leve e clareamento). A escolha MUST persistir no projeto e sair no PDF.

#### Scenario: Cor e degradê iguais na tela e no PDF
- **WHEN** o fundo é a cor `#D84B20` e depois um degradê `#112233` para `#FFCC00` a 135°
- **THEN** os cantos e as bordas da folha na tela e da página do PDF têm a mesma cor (diferença de até 10 em 255)

#### Scenario: Foto de fundo
- **WHEN** o fundo é a foto padrão, depois a 3ª foto, depois a 3ª com posição 100%/0% e com suavização 100%
- **THEN** a tela e o PDF mostram o mesmo recorte em cada caso, trocar de foto ou de posição muda as cores nos dois, e suavizar deixa o fundo mais claro nos dois

#### Scenario: Persistência
- **WHEN** a Colagem é configurada e o projeto é salvo e reaberto (ou exportado e importado)
- **THEN** `pl-folhas` traz `colagem` e o editor reabre com o mesmo layout e fundo

### Requirement: Sobreposição máxima e Coração
Nenhuma polaroid SHALL ter mais de 20% da área da foto coberta por outra que fique por cima, em qualquer layout; a capacidade por folha de cada layout MUST ser o maior número que respeita essa regra e a margem. O layout Coração MAY reduzir as polaroids (de 70% a 30% do tamanho) para que o contorno de coração seja reconhecível; os demais layouts MUST manter a medida. A moldura da polaroid MUST ser branca sobre o fundo, na tela e no PDF.

#### Scenario: Regra de sobreposição
- **WHEN** qualquer layout é aplicado, em qualquer papel e quantidade de fotos
- **THEN** a cobertura máxima de uma foto por outra polaroid é de no máximo 20%, e espalhadas comporta 5 ou 6 polaroids numa folha A4

### Requirement: Cartão de resumo e barra lateral
Com a Colagem ligada, o cartão de resumo do Inspetor SHALL mostrar a contagem real do layout («6 polaroids por folha · 2 folhas») e MUST NOT mostrar «aproveitamento». A barra lateral MUST ter «Colagem» ativa, que liga o Modo Colagem (e «Folhas» o desliga); «Lembranças» continua «Em breve».

#### Scenario: Cartão e barra
- **WHEN** o layout espalhadas está ligado com 8 fotos em A4 e a pessoa clica em «Folhas»
- **THEN** o cartão dizia «6 polaroids por folha · 2 folhas» e, depois do clique, o modo volta a Folhas com o aproveitamento da grade
