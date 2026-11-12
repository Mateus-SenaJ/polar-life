# navegacao Specification

## Purpose
TBD - created by archiving change auditoria-navegacao-fluxos. Update Purpose after archive.

## Requirements

### Requirement: Estado do projeto pertence à aba que o abriu
O sistema SHALL marcar em cada aba de qual projeto é o estado de edição e MUST NOT gravar no projeto atual um estado que não seja dele. Uma aba sem a marca SHALL recarregar o projeto atual do aparelho antes de mostrar as telas que dependem dele.

#### Scenario: Aba nova abre o projeto real
- **WHEN** existe um projeto atual com 5 fotos e `app/editor/` é aberto numa aba nova
- **THEN** o título traz o nome do projeto (nunca «Viagem · Serra 2026»), as polaroids são as do projeto e, depois de mudar um controle das Folhas, o projeto salvo continua com `pl-fotos` = `[1,2,3,4,5]`

#### Scenario: Excluir o projeto aberto
- **WHEN** o projeto aberto é excluído na lista de projetos
- **THEN** `pl-projeto-atual`, `pl-fotos` e `pl-quadro` deixam de existir na aba

### Requirement: Projeto real nunca mostra dados do exemplo
Em projeto real, as telas de resumo, orientação, Folhas e Quadro SHALL mostrar só dados das fotos escolhidas. Um projeto sem fotos aberto pela lista ou pelo Início SHALL continuar em «Adicionar fotos».

#### Scenario: Pergunta de orientação
- **WHEN** um projeto com 3 fotos horizontais e 2 verticais chega a `app/orientacao/`
- **THEN** o texto diz «2 verticais», «3 horizontais» e «5 fotos», e «24 fotos» não aparece na página

#### Scenario: Projeto sem fotos
- **WHEN** um projeto sem fotos é aberto pela lista de projetos
- **THEN** a pessoa chega a `app/adicionar-fotos/`

#### Scenario: Voltar e continuar em «Novo projeto»
- **WHEN** a pessoa clica em «Continuar», volta pelo navegador e clica em «Continuar» de novo
- **THEN** existe um único projeto na lista

### Requirement: Escolhas de «Novo projeto» valem no editor e no PDF
O formato fixo e o papel (tamanho e orientação) escolhidos em `app/novo-projeto/` SHALL chegar ao resumo, às Folhas, ao Quadro e ao gerador pela mesma função (`PLFOLHAS.formatoInicial()` e `PLFOLHAS.ler()`), e MUST continuar valendo depois de recarregar ou reabrir o projeto.

#### Scenario: Instax Mini em A5
- **WHEN** a pessoa escolhe «Instax Mini» e papel A5, adiciona 5 fotos e segue até o editor
- **THEN** o resumo diz «Instax Mini 54 × 86 mm» e «A5», o editor mostra «A5 retrato», a polaroid tem proporção 54 ÷ 86 e isso se mantém ao recarregar e ao reabrir o projeto pela lista

### Requirement: Navegação sem links mortos e com retorno previsível
Todas as rotas SHALL abrir sem erro de página e sem recurso ausente; todo link interno SHALL responder; sem sessão, toda rota de `app/` (menos `app/entrar/`) SHALL ir para a tela de entrar guardando o destino. Depois de entrar, «Voltar» MUST NOT devolver à tela de entrar. Só o que ainda não existe SHALL trazer o rótulo «Em breve».

#### Scenario: Rastreio
- **WHEN** as 23 rotas são abertas sem sessão e com a conta Pro
- **THEN** nenhuma tem erro de página, resposta 4xx ou link vazio, os links internos respondem 200 e há no máximo um botão LED visível por tela

#### Scenario: Colagem pelo Quadro
- **WHEN** a pessoa clica em «Colagem» na barra lateral do Quadro
- **THEN** chega às Folhas com o modo Colagem ligado, e o item não traz «Em breve»

#### Scenario: Fluxo de impressão com voltar e recarregar
- **WHEN** a pessoa revisa, exporta, gera o PDF, abre «Imprimir agora», volta, abre «Compartilhar» e volta
- **THEN** cada passo chega à tela esperada, recarregar «Exportar» mantém a revisão válida e a tela do arquivo pronto tem um caminho de volta às folhas

### Requirement: Portão de folhas diz a verdade
O portão de folhas SHALL dizer que a folha grátis foi usada só quando ela foi; com a folha do mês ainda livre, SHALL informar quantas folhas o arquivo tem e oferecer a compra só das que faltam.

#### Scenario: Grátis com 2 folhas e nenhuma usada
- **WHEN** a conta Grátis, sem folha usada no mês, pede um PDF de 2 folhas
- **THEN** o título não contém «foi usada», cita «2 folhas» e o botão principal é «Comprar 1 folha»
