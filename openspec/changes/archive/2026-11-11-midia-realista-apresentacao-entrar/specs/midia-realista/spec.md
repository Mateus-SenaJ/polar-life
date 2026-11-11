## ADDED Requirements

### Requirement: Vídeo decorativo com poster e reserva
A apresentação (`/`, ao lado do título) e a tela de entrar (`app/entrar/`, abaixo da faixa preta) SHALL ter um `<video>` decorativo, mudo, em loop, `playsinline`, `preload="none"`, com poster local e contêiner `aria-hidden="true"`, num quadro de proporção fixa. O site MUST NOT pedir ao servidor nenhum arquivo de mídia que não esteja na lista `PLMIDIA_ARQUIVOS`, e MUST NOT usar recurso de outro domínio.

#### Scenario: Antes de os arquivos chegarem
- **WHEN** `/` e `app/entrar/` são abertas em 1440×900, 1024×768 e 390×844 sem os arquivos definitivos
- **THEN** o vídeo não tem fonte, o poster local carrega, a reserva desenhada fica visível, nenhum arquivo ausente é pedido, e não há resposta de erro, erro de página, recurso externo nem rolagem lateral

#### Scenario: Quando os arquivos existem
- **WHEN** a lista contém o vídeo e a mídia entra na tela
- **THEN** o vídeo recebe as fontes WebM e MP4 nessa ordem, toca, o poster passa a ser o definitivo, a reserva sai de cena e o quadro mantém posição e tamanho

#### Scenario: Carregamento sob demanda
- **WHEN** a mídia está fora da tela
- **THEN** nenhum vídeo é pedido; ao rolar até ela o vídeo é pedido, e ao sair da tela ele pausa

### Requirement: Respeito a movimento reduzido e economia de dados
Com `prefers-reduced-motion: reduce` ou economia de dados (`Save-Data`), o site MUST mostrar só o poster e MUST NOT pedir o vídeo.

#### Scenario: Só o poster
- **WHEN** as páginas abrem com movimento reduzido ou com `navigator.connection.saveData` verdadeiro e os arquivos existem
- **THEN** nenhum vídeo é pedido, o `<video>` fica sem fonte e o poster definitivo aparece

### Requirement: Transição suave entre o texto e o vídeo
Na apresentação, o vídeo SHALL sumir no branco por máscara em degradê, sem corte duro, e o texto do hero MUST continuar sobre fundo praticamente branco.

#### Scenario: Máscara e texto legível
- **WHEN** `/` é aberta em 1440×900 e 1024×768
- **THEN** o vídeo tem `mask-image` com degradê linear e a parte do quadro que fica sob o texto tem opacidade de no máximo 25%

### Requirement: Câmera realista sem marca
Onde o desenho da câmera aparece (hero, mesa e banner da apresentação, passo 1 do «Como funciona», mesa da tela de entrar), o site SHALL mostrar a câmera realista `camera-perfil.png` ou `camera-frente.png` quando o arquivo existir, escondendo o desenho; sem o arquivo, o desenho continua.

#### Scenario: Troca do desenho pela câmera
- **WHEN** a lista contém as duas câmeras e as páginas são abertas
- **THEN** cada lugar de câmera aponta para o arquivo definitivo, está visível e o desenho correspondente tem `display: none`

### Requirement: Lista de mídias em dia
O `npm run verificar` MUST falhar quando `midia-arquivos.js` não refletir os arquivos esperados que existem em `site/assets/`.

#### Scenario: Lista conferida
- **WHEN** `node tools/gerar-midia.mjs --checar` roda logo depois de `npm run midia`
- **THEN** termina com saída 0
