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
