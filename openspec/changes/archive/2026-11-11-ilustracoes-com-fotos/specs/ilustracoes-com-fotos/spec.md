## ADDED Requirements

### Requirement: Polaroids animadas com fotografias reais
As polaroids da mesa animada (tela de entrar e apresentação), a foto que sai da câmera e as polaroids pousadas do hero, e as polaroids do banner da faixa preta da apresentação SHALL mostrar fotografias reais de `site/assets/img/fotos/`, carregadas do próprio site, mantendo as animações e o estado final com movimento reduzido.

#### Scenario: Fotos carregadas na tela de entrar e na apresentação
- **WHEN** `app/entrar/` e `/` são abertas em 1440×900 e 390×844
- **THEN** cada `mesa-cena-*` contém uma `<image>` de `assets/img/fotos/`, todas as imagens de foto carregam com sucesso (nenhuma requisição falha), não há erro de página, e o `npm run verificar` termina sem erros

#### Scenario: Movimento reduzido mantém as fotos
- **WHEN** as páginas abrem com movimento reduzido
- **THEN** as polaroids aparecem na posição final já com as fotos

### Requirement: Fundo fotográfico da mesa
A cena da mesa SHALL ter como fundo a foto `mesa.jpg` com um véu claro que preserva o contraste, em vez do fundo liso.

#### Scenario: Fundo presente
- **WHEN** a tela de entrar é aberta
- **THEN** a mesa tem uma `<image>` de `mesa.jpg` atrás das polaroids

### Requirement: Créditos das imagens
A página Legal SHALL ter uma seção «Créditos das imagens» com link para `assets/img/fotos/CREDITOS.md`.

#### Scenario: Link de créditos
- **WHEN** `legal/` é aberta
- **THEN** existe o link «Créditos das imagens» que leva a um arquivo que responde 200
