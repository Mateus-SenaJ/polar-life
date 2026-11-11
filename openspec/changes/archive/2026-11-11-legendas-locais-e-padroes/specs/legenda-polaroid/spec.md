## ADDED Requirements

### Requirement: Padrão avançado de 2 linhas
O painel de legendas SHALL ter a seção recolhível «Avançado» com o padrão de 2 linhas: cada linha escolhe Localização («Itacaré - BA»), Data («23/11/26»), Ponto turístico, Texto livre ou Nenhum, e um tamanho (7, 8, 10 ou 12 pt). O padrão inicial MUST ser linha 1 Localização e linha 2 Data. Com o padrão ligado, as seções Data, Local e Linhas MUST sair do painel, e o texto MUST sair igual no Quadro, nas Folhas e no PDF por `PLTEXTO.comPadrao`.

#### Scenario: Tela igual ao PDF
- **WHEN** o padrão é ligado num projeto cujas fotos têm data e GPS no EXIF
- **THEN** o Quadro, as Folhas e o texto do PDF mostram as mesmas duas linhas, e a linha com 12 pt fica maior que a de 8 pt

### Requirement: Pré-preenchimento editável por foto
Ao aplicar, o sistema SHALL preencher cada foto a partir do EXIF (data e GPS via `PLLOCAIS`) e MUST deixar a linha vazia quando não houver dado. Cada foto pode ter padrão próprio sem afetar as outras; texto digitado à mão MUST ser marcado como manual e não ser sobrescrito ao reaplicar; «Restaurar sugestão» MUST voltar ao valor sugerido; «Aplicar a todas» MUST limpar as exceções e preencher as linhas não manuais.

#### Scenario: Exceção, manual e restaurar
- **WHEN** a foto 2 recebe padrão próprio, a foto 1 tem texto digitado e «Aplicar a todas» é acionado
- **THEN** a foto 1 mantém o texto manual, a exceção da foto 2 some, e «Restaurar sugestão» devolve a sugestão da foto 1

#### Scenario: Foto sem EXIF
- **WHEN** o padrão é aplicado a uma foto sem data nem GPS
- **THEN** as duas linhas ficam vazias

### Requirement: Autocomplete de cidade
Com as sugestões ligadas, o campo de localização da legenda e o campo Cidade de Metadados SHALL sugerir «Cidade - UF» enquanto a pessoa digita.

#### Scenario: Digitar parte do nome
- **WHEN** a pessoa digita «bom jes»
- **THEN** a lista traz entradas no formato «Bom Jesus - RS», uma por UF

### Requirement: Interruptor «Sugestões de legendas»
O sistema SHALL mostrar, logo abaixo de «Sem legendas», o interruptor «Sugestões de legendas», ligado por padrão e salvo por projeto (`leg.sug`). Desligado, nada MUST ser preenchido nem sugerido e os textos já existentes MUST permanecer. Com «Sem legendas» ligado, o interruptor MUST ficar com `aria-disabled="true"` e não mudar.

#### Scenario: Desligar não apaga
- **WHEN** as sugestões são desligadas e o tipo de uma linha é trocado
- **THEN** nenhum texto novo é preenchido, os textos existentes continuam e o autocomplete não sugere

#### Scenario: Sem legendas desabilita
- **WHEN** «Sem legendas» é ligado
- **THEN** «Sugestões de legendas» fica com `aria-disabled="true"` e o clique não altera `leg.sug`

## MODIFIED Requirements

### Requirement: Projeto real sem texto de exemplo
Em projeto real (`PLTEXTO.ehReal()` verdadeiro), uma foto sem texto digitado SHALL ficar sem legenda no Quadro, nas Folhas e no PDF, salvo o que o padrão avançado e as sugestões (D-139) preencherem a partir do EXIF, sempre editável. Os textos de exemplo («Dias de sol», «Nós dois», «Dia de rolê», «Meu parceiro») MUST NOT aparecer na polaroid nem no campo «Texto desta foto».

#### Scenario: Quadro sem texto digitado
- **WHEN** um projeto real recém-criado é aberto no Quadro e a aba Legendas é aberta
- **THEN** `#cap` tem texto vazio e `#lg-in` tem valor vazio, em todas as fotos

#### Scenario: Texto digitado vale só para a foto
- **WHEN** a pessoa digita «Praia do Forte» na foto 1 e vai para a foto 2
- **THEN** a foto 1 mostra «Praia do Forte» no Quadro, nas Folhas e no texto do PDF, e a foto 2 fica sem legenda nos três

#### Scenario: Exemplo continua com os textos de exemplo
- **WHEN** o Quadro é aberto sem projeto real
- **THEN** `#cap` mostra o texto de exemplo da foto, como hoje
