# editor-fotos-reais Specification

## Purpose
TBD - created by archiving change editor-fotos-reais-e-legendas. Update Purpose after archive.

## Requirements

### Requirement: Foto real no Quadro
Em projeto real (`PLTEXTO.ehReal()` verdadeiro), a janela do Quadro e a faixa de miniaturas SHALL mostrar a foto escolhida pela pessoa, lida do IndexedDB do aparelho. A cena de exemplo MUST NOT aparecer em projeto real.

#### Scenario: Janela mostra a foto escolhida
- **WHEN** um projeto real com 4 fotos é aberto em `app/editor/quadro/#foto-1` (1440 × 900 e 390 × 844)
- **THEN** `#clip` contém um `img` com `src` começando por `blob:` e `naturalWidth > 0`, e `#clip svg` não existe

#### Scenario: Faixa mostra as fotos
- **WHEN** o mesmo projeto está aberto no Quadro
- **THEN** em até 5 s os 4 botões de `#faixa` têm `img[src^="blob:"]` dentro de `.tq` e nenhum tem `svg`

#### Scenario: Trocar de foto troca a imagem
- **WHEN** a pessoa clica na miniatura #02
- **THEN** o `src` do `img` de `#clip` muda e a captura de `#win` mostra as cores da foto 2

#### Scenario: Filtros, comparar e sugestão usam a foto
- **WHEN** a aba Ajustes está aberta num projeto real
- **THEN** cada `.ft__ph` contém `img[src^="blob:"]` e, com «Comparar» ligado, `#cmp` contém `img[src^="blob:"]`

### Requirement: Foto real nas Folhas
Em projeto real, cada polaroid da mesa, da faixa de folhas e cada item da aba Fotos SHALL mostrar a foto escolhida. Enquanto a miniatura não está pronta, ou se a foto não existir no aparelho, MUST aparecer o ícone neutro atual, nunca a cena de exemplo.

#### Scenario: Mesa mostra as fotos
- **WHEN** um projeto real com 4 fotos é aberto em `app/editor/` (1440 × 900 e 390 × 844)
- **THEN** em até 5 s cada `#sheet .pol__ph` contém `img[src^="blob:"]` e nenhum `svg` de ícone

#### Scenario: Aba Fotos mostra miniaturas
- **WHEN** a pessoa abre a aba Fotos nas Folhas
- **THEN** cada `.foto-mini` contém `img[src^="blob:"]` e o rótulo «Foto N»

#### Scenario: Foto ausente
- **WHEN** `pl-fotos` lista um `src` que não existe na loja `fotos`
- **THEN** a polaroid correspondente mostra o ícone neutro, as outras mostram a foto e nenhum erro de página ocorre

### Requirement: Recorte e ajustes na tela iguais aos do PDF
A foto na tela SHALL obedecer ao mesmo estado do PDF — `modo`, `z`, `px`, `py`, `ang`, `rot`, `flip`, `adj` (incluindo vinheta) e `flt` — tanto no Quadro quanto nas Folhas. O estilo de recorte MUST sair de uma única função, `PLFOTOTELA.estilo(dim, s, q)`, usada pelo Quadro, pela faixa e pelas Folhas.

#### Scenario: Preencher centralizado
- **WHEN** a foto 1600 × 1200 (metade esquerda vermelha, metade direita azul) está com `z:100, px:0` na janela quadrada do Clássico
- **THEN** na captura de `#win` o ponto a 25 % da largura é vermelho e o ponto a 75 % é azul, e o mesmo vale para a captura do `.pol__ph` dessa foto nas Folhas

#### Scenario: Zoom e posição
- **WHEN** o estado salvo da foto é `z:200, px:0.5, py:0`
- **THEN** os pontos a 25 % e a 75 % da largura são vermelhos no Quadro e nas Folhas

#### Scenario: Espelhar
- **WHEN** o estado salvo é `z:100, px:0, flip:true`
- **THEN** o ponto a 25 % é azul e o ponto a 75 % é vermelho no Quadro e nas Folhas

#### Scenario: Girar 90°
- **WHEN** o estado salvo é `rot:90`
- **THEN** o ponto a 50 % da largura e 25 % da altura é vermelho e o ponto a 50 % da largura e 75 % da altura é azul, no Quadro e nas Folhas

#### Scenario: Filtro P&B
- **WHEN** o estado salvo tem `flt:{id:'pb',int:100}`
- **THEN** os pontos lidos no Quadro e na mesa das Folhas têm R, G e B com diferença máxima de 6 entre si

#### Scenario: Função única
- **WHEN** o código é inspecionado
- **THEN** a expressão de `width/height/left/top/transform` da foto só existe em `PLFOTOTELA.estilo`, e `quadro.js` e `editor.js` a chamam

### Requirement: Fonte única de object URLs com revogação
Todo object URL de foto usado no editor SHALL ser criado por `window.PLFOTOTELA` (`site/assets/js/ui/foto-tela.js`). O componente MUST revogar os URLs ao sair da página, ao trocar de projeto, ao tirar a foto do projeto e ao passar de 6 fotos cheias abertas.

#### Scenario: Só um lugar cria URL de foto
- **WHEN** se procura `createObjectURL` em `pages/quadro.js`, `pages/editor.js` e `editor/*.js`
- **THEN** só aparecem os usos de «Salvar .polarlife» (backup), nenhum para foto

#### Scenario: Limpar revoga
- **WHEN** o teste guarda o `src` do `img` de `#clip`, chama `PLFOTOTELA.limpar()` e faz `fetch` desse URL
- **THEN** o `fetch` falha e `PLFOTOTELA.ativos()` devolve `{cheias:0, minis:0}`

#### Scenario: Troca de projeto
- **WHEN** `PLPROJETOS.definirAtual()` passa a apontar para outro projeto e `PLFOTOTELA.mini(1)` é chamado
- **THEN** os URLs do projeto anterior deixam de responder a `fetch`

#### Scenario: Remover foto
- **WHEN** a pessoa remove a foto 2 no Quadro
- **THEN** o URL da miniatura da foto 2 deixa de responder a `fetch`, e desfazer volta a mostrar a foto

#### Scenario: Limite de fotos cheias
- **WHEN** a pessoa passa por 10 fotos seguidas no Quadro
- **THEN** `PLFOTOTELA.ativos().cheias` é menor ou igual a 6

### Requirement: Desempenho com 200 fotos
Com 200 fotos, o editor SHALL continuar respondendo: as miniaturas MUST ser reduzidas (lado maior de até 512 px) com `createImageBitmap`/canvas, geradas em fila de no máximo 2 por vez, com prioridade para o que está visível.

#### Scenario: Quadro abre e responde
- **WHEN** um projeto real com 200 fotos é aberto no Quadro
- **THEN** o `img` da janela carrega em até 3 s, e durante os 2 s seguintes o maior intervalo entre quadros de `requestAnimationFrame` é menor que 300 ms

#### Scenario: Miniaturas são pequenas
- **WHEN** uma miniatura da faixa termina de carregar
- **THEN** `Math.max(naturalWidth, naturalHeight)` do `img` é menor ou igual a 512

#### Scenario: Ir para uma foto distante
- **WHEN** a pessoa abre `#foto-150` com 200 fotos
- **THEN** a janela mostra a foto 150 em até 3 s, sem esperar as 149 anteriores

#### Scenario: Folhas com 200 fotos
- **WHEN** o mesmo projeto é aberto nas Folhas
- **THEN** todas as polaroids da folha visível mostram a foto em até 5 s

### Requirement: Exemplo continua igual
Sem projeto real (`PLTEXTO.ehReal()` falso), o editor SHALL manter a cena de exemplo no Quadro e o ícone nas Folhas, e MUST NOT criar object URLs de foto.

#### Scenario: Quadro de exemplo
- **WHEN** o Quadro é aberto sem `pl-projeto-atual`
- **THEN** `#clip svg` existe, não há `img[src^="blob:"]` na página e `PLFOTOTELA.ativos()` devolve `{cheias:0, minis:0}`

#### Scenario: Folhas de exemplo
- **WHEN** as Folhas são abertas sem `pl-projeto-atual`
- **THEN** há 24 polaroids com o ícone em `.pol__ph` e nenhum `img[src^="blob:"]`
