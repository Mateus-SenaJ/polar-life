## MODIFIED Requirements

### Requirement: Metadados editados persistem
A data e a cidade digitadas na seção «Data e cidade desta foto», em Legendas › Configurações avançadas, SHALL continuar valendo depois de recarregar o Quadro e de reabrir o projeto. A leitura do EXIF MUST NOT sobrescrever um `ST[n].meta` que a pessoa já editou; ela só preenche fotos ainda sem registro, no formato `{iso:'AAAA-MM-DDTHH:MM', ds, dh, c, cs, o, conv}`. A aba «Metadados» MUST NOT existir no Quadro nem nas Folhas.

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
- **WHEN** a seção «Data e cidade desta foto» é aberta numa foto com data EXIF `2025:03:09 10:11:12` (a aba Metadados não existe mais: `#tab-metadados` e `#p-metadados` ausentes)
- **THEN** `#md-info` mostra «09.03.25 · 10:11 · data lida da foto», o campo Data traz «09/03/2025» e o texto «undefined» não aparece

## ADDED Requirements

### Requirement: Legenda em 2 linhas com um único conjunto de estilo
No projeto real, o painel de legendas SHALL ter a Linha 1 e a Linha 2, cada uma com seletor de tipo (Localização, Data, Ponto turístico, Texto livre, Nenhum) e texto editável, ligadas por padrão como Localização e Data. O painel MUST ter um único conjunto de Fonte, Itálico/Negrito, Tamanho e Cor com alvo Linha 1, Linha 2 ou Ambas, sem seções separadas Texto livre, Data e Local nem «Padrão de 2 linhas». Projetos antigos MUST migrar sem perder texto nem estilo.

#### Scenario: Painel compacto e sem repetição
- **WHEN** a aba Legendas é aberta num projeto real
- **THEN** há uma única lista de fonte, um único Tamanho e uma única Cor, nenhum botão de formato de data, o alvo marcado é «Ambas», e o painel recolhido tem no máximo 1550 px de altura

#### Scenario: Padrão Localização e Data
- **WHEN** um projeto real é aberto com fotos de data e GPS no EXIF
- **THEN** a Linha 1 é Localização («Salvador - BA») e a Linha 2 é Data («23/11/26») no Quadro, nas Folhas e no PDF

#### Scenario: Migração
- **WHEN** abre um projeto salvo com legenda antiga (texto livre «Dia de praia» em Kalam azul 14 pt)
- **THEN** a Linha 1 vira Texto livre com a mesma fonte, cor e tamanho, e o texto da foto aparece nela

### Requirement: Configurações avançadas da legenda
O painel de legendas SHALL ter «Configurações avançadas», recolhidas por padrão, com: inclinação do texto (−8° a +8°, passo 1°, em `leg.inc`), formato da data e da localização em `<select>`, caixa (normal/MAIÚSCULAS), espaçamento entre letras, duas linhas separadas ou na mesma linha (com separador), ordem, medir espaços por, data e cidade da foto e correção de horas, com espaço entre os campos e sem repetir controle do painel. O resultado MUST ser igual no Quadro, nas Folhas e no PDF (MT-02).

#### Scenario: Recolhidas por padrão e sem repetição
- **WHEN** a aba Legendas é aberta
- **THEN** `#lg-av` está oculto, existe um único `[data-lk="inc"]`, dentro de `#lg-av`, com mínimo −8, máximo 8 e passo 1, e os campos de `#lg-av` têm pelo menos 12 px entre si

#### Scenario: Inclinação, caixa e espaçamento no PDF
- **WHEN** inclinação 5°, caixa MAIÚSCULAS e espaçamento 0,1 em são aplicados com a cidade «recife»
- **THEN** o Quadro mostra «RECIFE - PE» com 0,1 em e `--inc: 5deg`, as Folhas mostram «RECIFE - PE», e a display list do PDF tem «RECIFE - PE» com `esp` 0,1 e o grupo girado 5°

#### Scenario: Formatos de data e localização
- **WHEN** a cidade é «Recife - PE» e a data 09/03/2025
- **THEN** com data «23 de novembro de 2026» e local «Cidade · Estado por extenso» as linhas são «9 de março de 2025» e «Recife · Pernambuco»; com «nov/2026» e «Cidade, País», «mar/2025» e «Recife, Brasil»; com «2026» e «Cidade, UF», «2025» e «Recife, PE»; texto digitado à mão não muda

### Requirement: Fontes locais com Normal, Itálico e Negrito reais
O catálogo de legendas SHALL incluir Indie Flower, Handlee, Amatic SC, Lora, Crimson Pro, Nunito e DM Sans, locais (T6) e OFL, com licenças em `LICENCAS.txt`. O estilo de qualquer linha MUST ter os botões Itálico e Negrito, desabilitados com explicação quando a família não tem a variante, e o sistema MUST NOT sintetizar itálico ou negrito, na tela nem no PDF. A T1 (peso máx. 500) vale para a interface (D-148).

#### Scenario: Lora em negrito itálico
- **WHEN** a fonte do texto é Lora e Itálico e Negrito estão ligados
- **THEN** a tela e as Folhas mostram peso 700 e estilo itálico, a display list do PDF tem `Lora` 700 itálico e o PDF contém a fonte embutida `Lora-700-Italico` sem aviso de fonte reserva

#### Scenario: Família sem variante
- **WHEN** a fonte é Indie Flower
- **THEN** Itálico e Negrito ficam desabilitados com «Indie Flower não tem itálico. Indie Flower não tem negrito.», e `PLTEXTO.famLG('Amatic SC', {it:true}).i` é 0

#### Scenario: Arquivos existem
- **WHEN** cada variante de `PLTEXTO.VAR` é pedida
- **THEN** existem o `.woff2` em `assets/fonts/` e o `.ttf` em `assets/fonts/pdf/`
