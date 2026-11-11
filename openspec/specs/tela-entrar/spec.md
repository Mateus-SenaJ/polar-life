# tela-entrar Specification

## Purpose
TBD - created by archiving change entrar-mesa-ilustrada. Update Purpose after archive.

## Requirements

### Requirement: Mesa ilustrada na tela de entrar
A tela de entrar SHALL mostrar a faixa preta «Não deixe para depois» no topo da coluna de mídia e, abaixo dela, o quadro de mídia cuja reserva é a mesa com sete polaroids e a câmera instantânea (fonte `site/assets/img/ilustracoes/mesa-polaroids.svg`), sem polaroids pontilhadas provisórias, sem distorção (corte central; 16:10 no celular e o resto da coluna no desktop) e sem recursos externos. O `<h1>` da faixa MUST ficar exposto a leitores de tela.

#### Scenario: Ilustração definitiva no lugar da provisória
- **WHEN** a tela `app/entrar/` é aberta em 1440×900 e em 390×844
- **THEN** a `.ent__mesa` contém os grupos `#mesa-p1` a `#mesa-p7` e `#mesa-camera`, não contém o padrão pontilhado provisório (`#mesa-dot`), a faixa preta fica acima da mídia, e a página não tem rolagem lateral

### Requirement: Animação de entrada respeitando movimento reduzido
As polaroids SHALL pousar uma após a outra e a foto SHALL sair da câmera; com `prefers-reduced-motion: reduce` nada MUST animar e tudo MUST aparecer na posição final.

#### Scenario: Movimento reduzido
- **WHEN** a página é aberta com `reducedMotion: 'reduce'`
- **THEN** cada `.mesa-p` e `#mesa-cam-foto` tem `animation-name` igual a `none` e opacidade 1

### Requirement: Entrada por e-mail e senha
A tela de entrar SHALL ter, como primeiro bloco, e-mail e senha com o único botão LED «Entrar», o link discreto «Esqueci a senha» e o botão secundário «Criar nova conta»; como segundo bloco, «Continuar com Google» e «Continuar com Apple». «Entrar com código» e as contas de teste continuam abaixo. A senha MUST NOT ser guardada em texto puro: só a derivação PBKDF2-SHA-256 com sal aleatório por conta, no próprio aparelho.

#### Scenario: Ordem dos blocos
- **WHEN** `app/entrar/` é aberta sem sessão
- **THEN** a ordem é e-mail, senha, «Esqueci a senha», «Entrar», «Criar nova conta», Google, Apple, «Entrar com código»; há um único `.led-btn`; os links discretos têm alvo de pelo menos 44 px

#### Scenario: Criar conta e entrar com senha
- **WHEN** a pessoa cria uma conta com nome, e-mail, senha de 8 caracteres ou mais e aceite, sai e entra de novo com o mesmo e-mail e senha
- **THEN** ela entra no plano Grátis; o `localStorage` não contém a senha digitada e guarda `alg`, `it`, `sal` e `hash`

#### Scenario: Senha errada ou e-mail sem conta
- **WHEN** a senha está errada ou o e-mail não tem conta
- **THEN** aparece a mesma mensagem «E-mail ou senha incorretos», sem sessão; depois de 5 erros seguidos o botão fica em espera por 30 s

#### Scenario: Esqueci a senha
- **WHEN** a pessoa usa «Esqueci a senha», informa o e-mail e confirma o código de 6 dígitos
- **THEN** a tela pede uma senha nova (mínimo de 8 caracteres) e, salva a senha, segue para «Seus dados» (e-mail novo) ou entra
