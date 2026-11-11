# inicio Specification

## Purpose
TBD - created by archiving change inicio-depois-do-login. Update Purpose after archive.

## Requirements

### Requirement: Página Início depois do login
O sistema SHALL oferecer a página `app/inicio/` (T-32), que exige sessão (sem sessão MUST ir para a tela de entrar) e que é o destino padrão depois de entrar. Ela SHALL mostrar a faixa preta com banners, «Continue de onde parou», «Sugestões de design» com 8 modelos e «Colagens para as redes» com 6 sugestões marcadas «Em breve».

#### Scenario: Sem sessão vai para entrar
- **WHEN** alguém sem sessão abre `app/inicio/`
- **THEN** é levado para `app/entrar/` com o destino guardado

#### Scenario: Com sessão mostra as seções
- **WHEN** a conta de teste Pro abre `app/inicio/` em 1440×900 e em 390×844
- **THEN** existem a faixa preta com banner, 8 cartões de modelo, 6 colagens com «Em breve», um único botão LED, nenhuma rolagem lateral e nenhum erro de página

### Requirement: Banners com rotação acessível
Os banners SHALL girar a cada 8 s, MUST pausar com o cursor em cima ou com foco dentro, MUST ter controles acessíveis (anterior, próximo e indicadores com nome) e MUST NOT girar com `prefers-reduced-motion: reduce`.

#### Scenario: Pausa com o cursor
- **WHEN** o cursor fica sobre o banner por 9 s
- **THEN** o banner visível não muda

#### Scenario: Movimento reduzido
- **WHEN** a página abre com movimento reduzido e passam 9 s
- **THEN** o banner visível não muda e nenhuma animação roda

### Requirement: Aplicar um modelo pronto
Aplicar um modelo SHALL gravar o formato e o estilo da legenda no projeto atual (criando um projeto se não houver) e abrir o editor com esse estilo. O emoji do modelo MUST aparecer no cartão e MUST NOT ser inserido no texto da legenda nesta versão.

#### Scenario: Modelo Praia
- **WHEN** a pessoa aplica o modelo «Praia 🌊»
- **THEN** o editor abre com o formato e o preset de legenda do modelo em `ST[0]`, e o texto da legenda não contém o emoji
