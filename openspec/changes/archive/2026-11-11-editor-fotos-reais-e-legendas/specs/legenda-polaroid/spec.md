## ADDED Requirements

### Requirement: Projeto real sem texto de exemplo
Em projeto real (`PLTEXTO.ehReal()` verdadeiro), uma foto sem texto digitado SHALL ficar sem legenda no Quadro, nas Folhas e no PDF. Os textos de exemplo («Dias de sol», «Nós dois», «Dia de rolê», «Meu parceiro») MUST NOT aparecer na polaroid nem no campo «Texto desta foto».

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
