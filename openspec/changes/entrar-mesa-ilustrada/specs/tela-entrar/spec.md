## ADDED Requirements

### Requirement: Mesa ilustrada na tela de entrar
A tela de entrar SHALL mostrar a ilustração definitiva da mesa com sete polaroids e a câmera instantânea (fonte `site/assets/img/ilustracoes/mesa-polaroids.svg`), sem polaroids pontilhadas provisórias, sem distorção (proporção 16:10 com corte central) e sem recursos externos.

#### Scenario: Ilustração definitiva no lugar da provisória
- **WHEN** a tela `app/entrar/` é aberta em 1440×900 e em 390×844
- **THEN** a `.ent__mesa` contém os grupos `#mesa-p1` a `#mesa-p7` e `#mesa-camera`, não contém o padrão pontilhado provisório (`#mesa-dot`), e a página não tem rolagem lateral

### Requirement: Animação de entrada respeitando movimento reduzido
As polaroids SHALL pousar uma após a outra e a foto SHALL sair da câmera; com `prefers-reduced-motion: reduce` nada MUST animar e tudo MUST aparecer na posição final.

#### Scenario: Movimento reduzido
- **WHEN** a página é aberta com `reducedMotion: 'reduce'`
- **THEN** cada `.mesa-p` e `#mesa-cam-foto` tem `animation-name` igual a `none` e opacidade 1
