## ADDED Requirements

### Requirement: Padrões de margem e espaço
O sistema SHALL abrir projetos novos com margem de folha de 3 mm e espaço entre polaroids de 0 mm (`PLFOLHAS.PADRAO`), tanto no editor de Folhas quanto em «Novo projeto». Projetos cujo estado já contém `pl-folhas` MUST manter os valores salvos, e projetos anteriores a esta mudança (sem o marcador `v:2`) e sem `pl-folhas` MUST abrir com margem 10 mm e espaço 4 mm.

#### Scenario: Projeto novo
- **WHEN** a pessoa cria um projeto e abre as Folhas
- **THEN** os campos mostram margem 3 e espaço 0, as cotas dizem «3 mm» e «0 mm» e as polaroids vizinhas se encostam

#### Scenario: Projeto salvo
- **WHEN** o projeto foi salvo com margem 10 e espaço 4
- **THEN** o editor abre com 10 e 4, e um projeto antigo sem Folhas salvas também abre com 10 e 4

### Requirement: Margem mínima
O sistema SHALL avisar, no pré-voo e na ajuda do campo, quando a margem for menor que `PLFOLHAS.MARGEM_MIN` (3 mm), e MUST NOT avisar com a margem padrão.

#### Scenario: Margem abaixo do mínimo
- **WHEN** a margem é trocada para 2 mm
- **THEN** o pré-voo pede confirmação sobre a área não imprimível e a ajuda do campo diz «Abaixo de 3 mm…»; com 3 mm nenhum aviso aparece
