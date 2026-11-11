# legenda-polaroid Specification

## Purpose
TBD - created by archiving change texto-abaixo-e-polaroid-original. Update Purpose after archive.

## Requirements

### Requirement: Sem legendas (Polaroid original)
O sistema SHALL oferecer, como primeiro controle do painel de texto, o interruptor «Sem legendas» (`leg.original`), que vale para o projeto todo. Ligado, legenda, data e local MUST deixar de aparecer na tela do Quadro, nas folhas e no PDF, sem apagar nenhum dado; a assinatura MUST seguir o plano.

#### Scenario: Ligar esconde todo texto na tela e no PDF
- **WHEN** a pessoa liga «Sem legendas» num projeto com legenda «Dias de sol», data e local
- **THEN** nenhum `.lg-txt`, `.lg-dt` ou `.lg-lc` fica visível no Quadro e nas folhas, e o texto extraído do PDF não contém «Dias de sol» nem a data

#### Scenario: Desligar devolve tudo
- **WHEN** a pessoa desliga «Sem legendas»
- **THEN** legenda, data e local voltam exatamente como estavam e `ST[0].leg` é igual ao de antes de ligar (exceto `original`)

#### Scenario: Pré-voo respeita o Sem legendas
- **WHEN** «Sem legendas» está ligada e uma legenda estaria fora da área segura
- **THEN** o pré-voo não bloqueia por texto fora da área segura

### Requirement: Texto sempre abaixo da foto
O sistema SHALL posicionar legenda, data e local somente na faixa inferior da polaroid. As posições «acima» e «ambas» e o deslocamento horizontal manual MUST NOT existir na interface nem nos dados novos.

#### Scenario: Não há opção acima nem ambas
- **WHEN** a pessoa abre a seção Posição do painel de texto
- **THEN** só existem os botões de seleção Esquerda, Centro e Direita, e nenhum controle «Acima», «Ambas» ou «Deslocar na horizontal»

### Requirement: Alinhamento Esquerda, Centro e Direita nas margens da foto
O sistema SHALL alinhar cada linha de texto dentro da faixa horizontal da janela da foto (de `L` a `L + JW`), com `x = L` (Esquerda), `x = L + (JW − w) / 2` (Centro) ou `x = L + JW − w` (Direita), calculado por uma única função `PLTEXTO.alinharX` usada pela tela e pelo PDF (MT-02).

#### Scenario: Direita encosta na borda direita da foto
- **WHEN** o alinhamento é Direita
- **THEN** no PDF a borda direita do texto da legenda fica a `L + JW` ± 0,2 mm, e no Quadro a borda direita do texto coincide com a borda direita da janela ± 1 px

#### Scenario: Centro centraliza na foto
- **WHEN** o alinhamento é Centro
- **THEN** o centro horizontal do texto coincide com o centro da janela ± 0,2 mm no PDF e ± 1 px na tela

#### Scenario: Função única
- **WHEN** `PLTEXTO.alinharX('centro', 6, 76, 20)` é chamada
- **THEN** o resultado é 34

### Requirement: Migração de projetos antigos
O sistema SHALL converter, ao abrir um projeto e ao importar um `.polarlife`, os dados antigos de legenda com `PLTEXTO.migrar(leg)`, que MUST ser idempotente: `pos` e `dx` são removidos (com `dx > 1` virando `al:'dir'`), `limpa` vira `original`, e `al` ausente vira `'esq'`.

#### Scenario: Projeto com legenda acima abre com o texto abaixo
- **WHEN** um projeto salvo com `leg.pos = 'acima'` é aberto
- **THEN** o editor abre sem erro de página e o texto aparece na faixa inferior

#### Scenario: Conversões
- **WHEN** `migrar({pos:'acima', dx:3})` e `migrar({limpa:true})` são chamadas
- **THEN** o primeiro resultado tem `al:'dir'` sem `pos` nem `dx`, o segundo tem `original:true` sem `limpa`, e chamar `migrar` de novo no resultado não muda nada

### Requirement: Assinatura no canto oposto ao texto
O sistema SHALL, com a assinatura em modo automático, colocá-la no canto oposto ao alinhamento do texto (Esquerda → direita; Direita → esquerda; Centro → canto com mais folga), calculado por `PLTEXTO.assinaturaPos` para tela e PDF.

#### Scenario: Texto à esquerda, assinatura à direita
- **WHEN** o alinhamento é Esquerda e a assinatura está em automático
- **THEN** `assinaturaPos` devolve `'dir'` e a assinatura aparece no canto inferior direito na tela e no PDF, sem interseção com o texto

#### Scenario: Pocket continua igual
- **WHEN** o formato é Retro Pocket com as duas linhas da D-113
- **THEN** local e data mantêm 4 mm e 2 mm de distância (teste `testar-pocket` verde) e a assinatura fica à direita

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

### Requirement: Metadados editados persistem
A data e a cidade digitadas na aba Metadados SHALL continuar valendo depois de recarregar o Quadro e de reabrir o projeto. A leitura do EXIF MUST NOT sobrescrever um `ST[n].meta` que a pessoa já editou; ela só preenche fotos ainda sem registro, no formato `{iso:'AAAA-MM-DDTHH:MM', ds, dh, c, cs, o, conv}`.

#### Scenario: Recarregar mantém cidade e data
- **WHEN** a pessoa digita Cidade «Recife» e Data «09/03/2025» na foto 1 e recarrega o Quadro
- **THEN** `PLQ.ST()[1].meta.c` é «Recife», `meta.iso` começa por `2025-03-09`, e a legenda mostra a data e «Recife»

#### Scenario: Reabrir o projeto mantém cidade e data
- **WHEN** depois disso a sessão é limpa e o projeto é reaberto com `PLPROJETOS.abrir(id)`
- **THEN** Folhas, Quadro e PDF mostram a mesma data e «Recife» na foto 1

#### Scenario: «Sem data» fica sem data
- **WHEN** a pessoa clica «Sem data» numa foto com data EXIF e recarrega o Quadro
- **THEN** a foto continua sem data no Quadro, nas Folhas e no PDF

#### Scenario: Projeto salvo com registro antigo
- **WHEN** um `pl-quadro` salvo tem `meta:{temGps:true,iso:'2025-03-09T10:11:12'}` (sem `ds` nem `cs`)
- **THEN** ao abrir o Quadro o registro vira `{iso:'2025-03-09T10:11', ds:'exif', …}` e a data aparece

#### Scenario: Painel Metadados de foto real
- **WHEN** a aba Metadados é aberta numa foto com data EXIF `2025:03:09 10:11:12`
- **THEN** o painel mostra «09.03.25 · 10:11», «Data da foto (EXIF)», Origem «Do aparelho» e o campo Data com «09/03/2025»; o texto «undefined» não aparece

### Requirement: Data e local iguais no Quadro, nas Folhas e no PDF
Para cada foto de um projeto real, o texto da data e o texto do local SHALL ser os mesmos no Quadro, nas Folhas e no PDF (MT-02), inclusive no Retro Pocket (D-113). O local MUST ser calculado por uma única função, `PLTEXTO.localLG`, e em projeto real MUST conter só a cidade digitada, sem estado nem país acrescentados e nunca coordenadas (BR-06).

#### Scenario: Data EXIF aparece no Quadro
- **WHEN** a foto 1 tem data EXIF `2025:03:09 10:11:12`, sem edição, com o formato de data padrão
- **THEN** o Quadro mostra «09.03.25», igual ao `.pol__meta` da foto 1 nas Folhas e ao texto do PDF

#### Scenario: Foto sem data
- **WHEN** a foto 3 não tem EXIF nem data digitada
- **THEN** nenhuma data aparece para ela no Quadro, nas Folhas e no PDF

#### Scenario: Local sem estado inventado
- **WHEN** a pessoa digita Cidade «Recife» num projeto real
- **THEN** o local é exatamente «Recife» no Quadro, nas Folhas e no PDF, e «SP» não aparece

#### Scenario: Controles de estado e país só no exemplo
- **WHEN** a seção Local da aba Legendas é aberta num projeto real
- **THEN** os grupos Estado, País e Ordem não são exibidos e há a orientação de escrever a cidade na aba Metadados; no exemplo os três grupos continuam

#### Scenario: Pocket em duas linhas
- **WHEN** um projeto real Retro Pocket tem a foto 1 com data EXIF `2025:03:09 10:11:12` e Cidade «Olinda»
- **THEN** as linhas da legenda são «Olinda» e «09/03/25», nesta ordem, no Quadro (`.lg-xl .lg-l`), nas Folhas (`.pol__ml`) e no PDF

### Requirement: Nome real do projeto
Em projeto real, o título da aba do navegador e o rodapé da folha (tela e PDF) SHALL usar o nome do projeto aberto. O nome de exemplo «Viagem · Serra 2026» MUST NOT aparecer em projeto real.

#### Scenario: Título do Quadro
- **WHEN** o projeto real «Praia 2025» está aberto no Quadro na foto 1
- **THEN** `document.title` contém «Praia 2025» e não contém «Serra 2026», também depois de trocar de foto

#### Scenario: Rodapé da folha e do PDF
- **WHEN** «Rodapé» está ligado nas Folhas do projeto «Praia 2025»
- **THEN** `.sheet__foot` e o texto do rodapé do PDF começam por «Praia 2025 · Folha 1 de»

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
