# Tarefa 53 · Editor v3 · arquitetura de informação, controles, «Polaroid original», texto só abaixo, stickers e emojis

> **Nome final (dono, 2026-11-10):** o interruptor «Polaroid original» da D-135 se chama **«Sem legendas»** na interface; a chave de dados continua `leg.original`. Onde este documento diz «Polaroid original», leia «Sem legendas».

Autor: Fable (arquiteto de software e design do projeto), 2026-11-10. Fase 1: especificação + protótipo navegável (`design/prototipos/editor-v3/`). Status: `[RECOMENDADO]` até o dono vetar; as propostas de mudança de regra (§7) ficam `[VALIDAR]` até virarem decisão no `docs/10_LOG_DECISOES.md`.

Leitura obrigatória antes de implementar qualquer fase: `AGENTS.md` (T1–T8), `docs/10_LOG_DECISOES.md` D-107 a D-137 (sobretudo D-113, D-119, D-121, D-128, D-129, D-130, D-133, D-134, **D-135, D-136, D-137**), `.tarefas/37b-editor-celular.md`, `.tarefas/brief-visual-v2.md`, `.tarefas/52-catalogos.md` (em implementação paralela: o catálogo de formatos e as frases sugeridas entram aqui como dependência, não são refeitos), `design/referencias/E5-editor-layout.pdf`.
Código de referência: `site/app/editor/quadro/index.html`, `js/pages/quadro.js`, `js/editor/{legendas,filtros,molduras,metadados,lote,prevoo,controles}.js`, `js/nucleo/legenda-texto.js` (PLTEXTO), `js/nucleo/gerador.js` (layoutLegenda, MT-02).
Capturas do editor atual que fundamentam o diagnóstico: `tests/saida/editor-atual/*.png` (gerado por `tests/saida/editor-atual/capturar.mjs`).

---

## 0. Diagnóstico do editor atual (o que a v3 corrige)

| # | Sintoma medido (capturas) | Causa | Correção na v3 |
| --- | --- | --- | --- |
| 1 | A aba **Legendas** tem 4 272 px de altura no desktop (`quadro-desktop-legendas.png`): 3 seletores de fonte, 3 deslizadores de tamanho, 3 seletores de cor, 13 botões de formato de data, 5 de separador… tudo aberto de uma vez | Cada opção virou um grupo de botões; nada é progressivo | Painel **Texto** com o essencial aberto e o resto em «Mais opções»; formato de data e separador viram **caixa de seleção** (5+ opções); fonte/tamanho/cor da data e do local ficam numa só linha compacta |
| 2 | A aba **Ajustes** mistura filtro, recorte, luz, detalhe e lote (3 664 px) | O recorte não tem lugar próprio; o lote é um apêndice | **Recorte** passa para a barra flutuante do palco (contextual, ao selecionar a foto) e um painel próprio; Ajustes fica só com filtro + luz e cor + detalhe; o lote vira **chip de escopo** na barra de contexto |
| 3 | No celular (`quadro-celular*.png`), o painel inferior abre a 25 % e a primeira coisa visível é «Alterando: só esta foto… Modificar escopo», não um controle | Ordem do painel pensada para desktop | Celular na ordem do Stitch (37b): chip de contexto → faixa → polaroid → **abas com ícone** → painel; o escopo sai do topo do painel e vai para o chip de contexto |
| 4 | Posição da legenda «Acima / Ambas» + deslocar X/Y + inclinação ocupam uma seção inteira e contradizem a D-136 | Regras anteriores | Bloco **Alinhamento Esquerda · Centro · Direita** (D-136); «Acima» e «Ambas» saem; deslocamento horizontal sai (o alinhamento é a posição); sobra **Ajuste fino** com deslocamento vertical e inclinação |
| 5 | «Polaroid sem textos» está no meio da aba Legendas, abaixo dos estilos prontos | D-119 | **«Polaroid original»** é o **primeiro** controle do painel Texto, no celular e no desktop, com estado em texto (D-135) |
| 6 | A barra de recorte flutua **sobre a mesa**, mas no celular fica colada em cima da polaroid e os botões têm 40 px | Barra fixa | Barra contextual de 44 px abaixo da moldura (fora da janela da foto, T4) |
| 7 | Seis abas de texto no celular não cabem (a 6ª é cortada: «M…») | Abas só com texto | 7 abas com **ícone + rótulo curto** em rolagem horizontal com indicação de continuação |
| 8 | Não há stickers nem emojis (D-137); «Modelos prontos com emoji» (D-120) dependem de a legenda levar o emoji como texto | — | Elementos livres por foto (`el[]`) arrastáveis na polaroid, com catálogo de stickers em SVG próprio e emojis rasterizados no aparelho (§5) |
| 9 | Metadados é uma aba de primeira classe com 6 linhas de leitura e 3 campos | — | Vira **Dados da foto** (último item do trilho), mesmo conteúdo, sem perder nada |

Princípios que organizam a v3 (os mesmos do Canva, adaptados às travas):

1. **Selecionar no palco abre o painel certo.** Tocar na foto → Recorte; no texto → Texto; num sticker → Sticker; no branco da moldura → Moldura. O trilho é a outra porta para os mesmos painéis. Uma só verdade, dois caminhos.
2. **O essencial aberto, o resto a um toque.** Cada painel mostra no máximo ~6 controles acima da dobra (390 × 844); o restante fica em «Mais opções» (disclosure com estado persistido por sessão).
3. **O controle certo para cada decisão** (§3): interruptor, segmentado, caixa de seleção, cartões, deslizador com campo, campo −/+.
4. **Escopo visível sem ocupar o painel:** um chip na barra de contexto («Só esta foto ▾») troca o escopo em qualquer painel.
5. **Nada do sistema sobre a foto** (T4 revista em §7.1): barras, selos e alças ficam fora da janela; só o que a pessoa escolhe (sticker/emoji) pode entrar nela.

---

## 1. Arquitetura de informação

### 1.1 Desktop (≥ 1024 px) · Modo Quadro

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ BARRA SUPERIOR  logo · Viagem · Serra 2026 · ● Salvo neste dispositivo   ↶ ↷  Salvar .polarlife  [LED Revisar impressão]  avatar │
├────┬─────────────────────────────────────────────────────────────────┬───────────────┤
│TRI-│ BARRA DE CONTEXTO  [Folhas | Quadro]  Foto 03 de 24 · Clássico 88 × 107 mm · ● Boa · Escopo: Só esta foto ▾ · Escala 100 % │
│LHO ├─────────────────────────────────────────────────────────────────┤ PAINEL        │
│    │                                                                 │ CONTEXTUAL    │
│Fo- │   PALCO                                                         │ (360 px)      │
│tos │   barra flutuante contextual (acima da polaroid)                │               │
│Re- │   ┌────────────┐                                                │ Título        │
│cor-│   │   foto     │  ← alças só no elemento selecionado           │ controles…    │
│te  │   │            │                                                │               │
│Aju-│   ├────────────┤                                                │               │
│stes│   │ texto  ☺   │  ← texto e stickers na faixa inferior         │               │
│Tex-│   └────────────┘                                                │               │
│to  │   ‹ Centralizar · Passe-partout 25 mm · Ajustada ›              │               │
│Sti-├─────────────────────────────────────────────────────────────────┤               │
│cker│ FAIXA DE FOTOS  Lote 24  [#01][#02][#03●]…[+ Adicionar]  Foto 03 / 24 │ Resetar · Aplicar às demais │
│Mol-│                                                                 │               │
│dura│                                                                 │               │
│Da- │                                                                 │               │
│dos │                                                                 │               │
└────┴─────────────────────────────────────────────────────────────────┴───────────────┘
```

* **Trilho de ferramentas** (72 px, ícone em cima + rótulo embaixo, Cormorant 500 15 px como D-114): **Fotos · Recorte · Ajustes · Texto · Stickers · Moldura · Dados**. No topo do trilho, o seletor de modo **Folhas | Quadro** (pílulas); «Colagem» e «Lembranças» ficam como itens apagados com «Em breve» no fim do trilho (como hoje). Item ativo = fundo `#F8F9FA` + fio 1 px azul à esquerda + `aria-current`.
* **Barra de contexto** (acima do palco): modo · «Foto 03 de 24» · chip do formato («Clássico · 88 × 107 mm», clique abre Moldura) · ponto de qualidade + palavra (D-130) · **chip de escopo** («Só esta foto ▾», popover nível 1 com Só esta · Selecionadas (n) · Esta folha · Todas) · Escala.
* **Palco**: polaroid centrada (sombra de papel do brief v2), fundo pontilhado. **Barra flutuante contextual** aparece acima da moldura, muda com a seleção (§2). Abaixo da moldura: ‹ › navegação, «Centralizar», cota do passe-partout, selo «Ajustada».
* **Painel contextual** (360 px, direita): título do painel + controles. Rodapé fixo do painel com as ações de lote do painel (ex.: «Resetar» · «Aplicar às demais · 23 fotos»), só quando o painel tem lote.
* **Faixa de fotos** (sob o palco): miniaturas 56 × 56 com número, marca de seleção (✓ + borda, não só cor), ponto de qualidade, selo «Ajustada»; último bloco «+ Adicionar». Ctrl/⌘ + clique marca, Shift + clique intervalo, botão «Marcar» entra no modo de toque (como hoje).
* **Tablet** (768–1023): trilho só com ícones (56 px), painel deslizante sobre o palco (como hoje `is-shut`).

### 1.2 Celular (< 768 px) · Modo Quadro (ordem do Stitch, adaptada em 37b)

```
┌────────────────────────────────────────┐
│ ‹ Viagem · Serra 2026        ↶ ↷  ⋯    │  barra superior compacta
│ [Folhas | Quadro]  Passo 2 de 3        │
│ Clássico · 8,8 × 10,7 cm · ● Boa  Só esta foto ▾ │  chip de contexto (rolagem horizontal)
│ [#01][#02][#03●][#04]…[+]  3/24        │  faixa de miniaturas (alvos 56 px)
│                                        │
│         ┌──────────────┐               │
│         │     foto     │               │  polaroid ao vivo (máx. 62 % da altura)
│         │              │               │
│         ├──────────────┤               │
│         │ texto     ☺  │               │
│         └──────────────┘               │
│   [barra contextual 44 px, fora da foto]│
│ ⟋ Fotos · Recorte · Ajustes · Texto · Stickers · Moldura · Dados │ abas ícone+rótulo
│ ━━━━ painel inferior (25 / 50 / 85 %) ━━━━ │
│   controles do painel ativo            │
│ ───────────────────────────────────── │
│ 24 fotos · A4 · 6 folhas  [LED Revisar impressão] │ barra fixa (safe-area)
└────────────────────────────────────────┘
```

* Um único LED na tela (T8): o da barra fixa. «Salvar .polarlife» vai para o menu «⋯».
* O painel inferior é o mesmo componente de hoje (`grab` com 3 paradas); a aba ativa se mantém ao trocar de foto.
* A barra contextual fica **entre** a moldura e as abas, nunca sobre a janela (T4).

### 1.3 Modo Folhas (desktop e celular)

Mesma casca: trilho (Fotos · Papel · Ajustes · Texto · Stickers · Moldura · Dados — «Papel» substitui «Recorte», que só faz sentido no Quadro), palco com a folha e a faixa de **folhas** (D-133), chip de escopo padrão «Todas as fotos». Tocar numa polaroid da folha abre-a no Quadro (`#foto-n`). Os painéis são os mesmos módulos (tarefa 37 §A). Esta tarefa não redesenha o conteúdo do painel Papel (já segue FN-00); só o move para a casca v3.

### 1.4 Tabela mestra sem repetição (comando → lugar principal → atalho opcional → motivo)

Legenda: **BS** barra superior · **BC** barra de contexto · **TR** trilho (desktop) ≡ **AB** abas do painel (celular) · **P:x** painel x · **BF** barra flutuante do palco · **SP** sob a polaroid · **FX** faixa de fotos · **M** menu «⋯» · **BX** barra fixa do celular · **TEC** teclado/gesto (não conta como repetição visual). Cada linha tem **um** lugar principal; a coluna «Atalho» só é preenchida para comandos de uso muito frequente.

| Comando | Lugar principal | Atalho opcional | Motivo |
| --- | --- | --- | --- |
| Desfazer · Refazer | BS (desktop e celular) | TEC Ctrl+Z/Y; «Desfazer» do toast (transitório) | Ação global |
| Salvar .polarlife | BS (desktop) · M (celular) | — | Global; raro no celular |
| Revisar impressão (LED) | BS (desktop) · BX (celular) | — | Global; único LED (T8) |
| Conta | BS avatar (desktop) · M (celular) | — | Global |
| Voltar aos projetos | BS (logo no desktop, ‹ no celular) | — | Global |
| Renomear projeto · Atalhos de teclado | M | — | Raros; não existem em outro lugar |
| Modo Folhas ⟷ Quadro | Topo do TR (desktop) · 2ª linha da BS (celular) | — | Navegação |
| Fotos · Recorte · Ajustes · Texto · Stickers · Moldura · Dados | TR (desktop) **ou** AB (celular), nunca os dois | TEC: clicar na foto abre Recorte, no texto abre Texto, no sticker abre Stickers | Navegação entre ferramentas |
| Escopo (Só esta · Selecionadas · Esta folha · Todas) | BC chip «Alterando» (popover) | — | Vale para todos os painéis; só escopo no popover |
| Foto n de N · formato · qualidade · escala · «Passo» | BC (informação, não é botão) | — | Chips informativos; o formato não abre mais o painel |
| Foto anterior · seguinte | SP ‹ › (desktop) · FX (toque na miniatura) | TEC ← → | Frequente |
| Adicionar fotos | FX «+ Adicionar» | — | Visível em qualquer ferramenta; some de P:Fotos |
| Marcar · Selecionar todas · Só esta folha · Limpar · reordenar | P:Fotos | TEC Ctrl/Shift + clique na FX | Seleção vive com as fotos |
| Copiar estilo · Colar estilo · Duplicar · Remover (fotos) | P:Fotos «Ações da seleção» | TEC Ctrl+Shift+C/V | Lote |
| Modo do recorte Preencher/Encaixar · Zoom · Endireitar | P:Recorte | TEC roda, pinça, duplo toque (zoom) | Opções da ferramenta |
| Centralizar · Resetar recorte | P:Recorte | — | Some de SP |
| Girar 90° · Espelhar · Grade de composição · Foto inteira | **BF** (foto selecionada; 4 ações) | — | Manipulação direta; somem de P:Recorte |
| Filtro · intensidade · Luz e cor · Detalhe · Substituir ajustes individuais | P:Ajustes | — | Opções da ferramenta |
| Comparar · Ver original | BF (P:Ajustes aberto; 2 ações) | — | Ação sobre o palco |
| Resetar · Aplicar às demais · n (por painel) | Rodapé do painel ativo | — | Uma vez por painel |
| «Sem legendas» (chave `leg.original`) | P:Texto, 1º controle | — | Some do popover de escopo |
| Alinhamento Esquerda · Centro · Direita (texto sempre abaixo) | P:Texto «Posição» | — | Some da BF |
| Estilos · Mostrar texto · Texto desta foto · Sugestões · Fonte · Tamanho · Cor · Mais opções · Data · Local · Linhas · Ajuste fino · Assinatura | P:Texto | — | Opções da ferramenta; Fonte e Tamanho somem da BF |
| Editar texto (focar o campo) | **BF** (texto selecionado; 1 ação) | TEC Enter / duplo toque na faixa | Atalho de manipulação direta, não repete controle |
| Inserir sticker / emoji · buscar · tipo | P:Stickers (catálogo) | — | Opções da ferramenta |
| Tamanho · Giro · Cor do sticker | P:Stickers «Elemento selecionado» | TEC alças (redimensionar, girar), setas (mover) | −/+ e girar somem da BF |
| Duplicar · Trazer para frente · Enviar para trás · Excluir (sticker) | **BF** (sticker selecionado; 4 ações) | TEC Ctrl+D, Delete | Manipulação direta; somem de P:Stickers |
| Formato · Orientação · Atalhos de medida · Medidas · Resetar formato | P:Moldura | TEC R (orientação) | Clicar na moldura abre o painel; **sem BF** |
| Metadados · Editar data/cidade/origem · Corrigir várias de uma vez | P:Dados | — | Opções da ferramenta |
| Papel e guias (Modo Folhas) | P:Papel | — | Fora do Quadro |
| Pré-voo | LED → Folhas `#revisar` | — | Igual |
| Lembranças · Colagem (Em breve) | Fim do TR | — | Item apagado |

Removidos por repetição em relação ao protótipo anterior: alinhamento, fonte e tamanho na BF do texto; Preencher/Encaixar e zoom na BF da foto; Girar/Espelhar/Foto inteira em P:Recorte; −/+ e girar na BF do sticker; Duplicar/Frente/Trás/Excluir em P:Stickers; BF da moldura inteira (formato, orientação, «Medidas»); «Centralizar» sob a polaroid; «Sem legendas» no popover de escopo; «Adicionar fotos» em P:Fotos; chip do formato como botão; contador «Foto 03 / 24» na faixa.

### 1.5 Regra anti-repetição

1. Cada comando tem **um lugar principal**. No máximo **um atalho adicional**, e só se o uso for muito frequente; atalho de teclado ou gesto não conta como repetição visual.
2. **Ações globais** (desfazer/refazer, salvar backup, revisar impressão, conta) ficam **só no cabeçalho** (no celular: LED na barra fixa, Salvar e Conta no «⋯»).
3. **Navegação entre ferramentas** só no trilho (desktop) **ou** nas abas do painel (celular), nunca nos dois ao mesmo tempo. Chips da barra de contexto informam; não navegam.
4. **Opções da ferramenta ativa** (interruptores, segmentados, deslizadores, listas) ficam **só no painel contextual**.
5. A **barra flutuante** sobre o palco mostra **no máximo 4 ações de manipulação direta** do objeto selecionado (girar, espelhar, duplicar, camada, excluir, editar) e **nunca repete** um controle do painel. Seleção sem ação direta (moldura) não tem barra.
6. O **menu «⋯»** guarda só ações raras que **não estão em nenhum outro lugar** (mais, no celular, o que saiu do cabeçalho).
7. **Celular:** as abas ficam **dentro** do painel inferior, e o palco **reserva a altura do painel** (painel e barra fixa no fluxo da grade), para a barra flutuante nunca ficar embaixo do painel.

Quando o §2 abaixo (conteúdo das BF) divergir desta tabela, a tabela prevalece.

---

## 2. Barras flutuantes contextuais do palco (BF)

A BF é uma pílula branca com sombra, 44 px de altura, centrada acima da moldura (desktop) ou abaixo dela (celular). Conteúdo por seleção:

| Seleção | Conteúdo (esquerda → direita) |
| --- | --- |
| Nenhuma (padrão) | igual a «Foto» |
| **Foto** (clique na janela) | `[Preencher · Encaixar]` seg · `−` `100 %` `+` zoom · Girar 90° · Espelhar (pressed) · Grade ▾ · Foto inteira (pressed) |
| **Texto** (clique na faixa de texto) | `[Esq · Centro · Dir]` seg (ícones + `aria-label`) · Fonte (nome, abre lista) · `−` `16 pt` `+` · Cor (3 amostras) · «Editar texto» (foca o campo do painel) |
| **Sticker / emoji** | `−` `12 mm` `+` tamanho · Girar (campo −/+ 15°) · Duplicar · Trazer para frente · Enviar para trás · Excluir (lixeira, secundário) |
| **Moldura** (clique no branco fora de texto/sticker) | Formato (nome, abre painel) · Orientação seg · «Medidas…» |
| Painel Ajustes aberto | acrescenta: Comparar (pressed) · Ver original (segurar) |

Regras: botões ≥ 44 px (T3); ícone + rótulo (rótulo pode ficar só em `aria-label` nos ícones universais: girar, espelhar, lixeira). A BF nunca cobre a janela da foto: se a moldura ocupar mais de 85 % da altura do palco, a BF vai para a parte inferior do palco. Teclado: `Esc` limpa a seleção; `Tab` percorre foto → texto → stickers (ordem de camada).

---

## 3. Escolha do controle (regra única, substitui o comentário do `controles.js`)

| Decisão | Controle | Estados e texto |
| --- | --- | --- |
| Ligado/desligado | **Interruptor** `role=switch` com rótulo à esquerda e **estado em texto** abaixo («Ligado · só a foto e a moldura» / «Desligado») | T3: nunca só a cor da pista |
| 2–4 opções exclusivas | **Segmentado** (`radiogroup`), opção ativa com fundo preto e texto branco + ícone ✓ no celular | rótulos de 1 palavra: Esquerda · Centro · Direita; Preencher · Encaixar |
| 5+ opções sem amostra visual | **Caixa de seleção** nativa (`<select>`), opção mostra o valor aplicado à foto atual («14/07/26», «Vírgula “Campos do Jordão, SP”») | formato de data (13), separador (5), origem (4 → também select por consistência com hoje) |
| 5+ opções com amostra visual | **Cartões/grade** (filtros, formatos, estilos prontos, stickers) ou **lista em folha** (fontes: busca + categorias) | nome sempre escrito; selecionado = anel azul 2 px + ✓ |
| Faixa contínua com prévia ao vivo | **Deslizador + campo numérico** (Enter/setas ±1, Shift ±10) com ajuda em uma linha («De −100 a +100») e «Resetar» quando ≠ padrão | brilho, zoom, tamanho, espaçamento, inclinação |
| Medida com unidade e passo | **Campo −/+** (alvo 44 px) com unidade em mono | margens, tamanho de sticker, giro de sticker, horas |
| Lista de inclusão (vários ao mesmo tempo) | **Caixas de seleção** | «Substituir ajustes individuais», «Ajustar para caber» |
| Ação | **Botão secundário** (`btn2`) com ícone azul; destrutiva com lixeira, nunca vermelha nem LED | Duplicar, Remover, Resetar |
| Ação principal da tela | **LED** (um por tela, T8) | Revisar impressão |

Rótulos: Inter 500 12 px; títulos de seção Cormorant 400 17 px (D-114); medidas em IBM Plex Mono. Ajuda: uma linha, Inter 13 px. Disclosures («Mais opções do texto», «Linhas», «Ajuste fino», «Medidas», «Atalhos de medida») usam `<details>` estilizado com chevron; estado guardado em `sessionStorage` `pl-v3-abertos`.

---

## 4. «Polaroid original» (D-135) e o bloco de texto (D-136)

### 4.1 Modelo de dados (`ST[0].leg`, projeto todo; texto livre por foto em `ST[n].txt`)

```js
leg = {
  original:false,            // D-135 · NOVO (substitui leg.limpa; migração: limpa → original)
  al:'esq',                  // D-136 · NOVO · 'esq' | 'centro' | 'dir' (alinhamento de todas as linhas)
  preset:'simples', dy:0, inc:0,          // pos e dx SAEM (§4.3)
  txt:{on:true,font:'Caveat',pt:16,fit:false,caixa:'normal',esp:0,cor:'preto'},
  data:{on:true,font:'IBM Plex Mono',pt:8,fmt:0,cor:'preto'},
  loc:{on:true,font:'IBM Plex Mono',pt:8,cor:'preto',uf:'sigla',pais:'oculto',ocBR:true,sep:', ',ordem:'cidade'},
  meta:'junto', ordem:'data-loc', medida:'caixa',   // D-113 (ausente = padrão, como hoje)
  assin:'auto'               // D-129 · 'auto' | 'esq' | 'centro' | 'dir'
}
```

### 4.2 Comportamento de «Polaroid original»

* Interruptor `role=switch`, rótulo «Polaroid original», ajuda: «Ligado · só a foto e a moldura. Desligue para editar os textos e stickers.» / «Desligado · textos e stickers visíveis».
* Ligado: a polaroid mostra **só foto + moldura**; `leg.original=true` esconde texto, data, local **e todos os elementos `el[]`** de todas as fotos do escopo (o estado é do projeto, como `leg`). A assinatura segue o plano (DOC-03 §2). **Nada é apagado**: desligar devolve tudo. Enquanto ligado, as demais seções do painel Texto e o painel Stickers ficam `aria-disabled` com véu (40 % opacidade) e um aviso «Desligue «Polaroid original» para editar». A BF do texto/sticker não aparece.
* Tela, folhas, pré-voo e PDF leem a mesma chave (`gerador.layoutLegenda` retorna `[]`; `itensPolaroid` não emite `el[]`; o pré-voo não acusa texto fora da área segura).
* Também aparece no popover do chip de contexto (atalho), como a D-119 previa na aba Papel.

### 4.3 Alinhamento Esquerda · Centro · Direita (D-136) — o que muda em PLTEXTO e no gerador (MT-02)

Regra geométrica: a caixa de cada linha de texto (texto livre, data, local, ou a linha única «data • local») tem largura máxima `JW` (largura da janela) e fica entre `x = L` e `x = L + JW` (as **mesmas margens laterais da foto**). O alinhamento desloca cada linha dentro dessa caixa:

```
x(linha) = L + (al === 'centro' ? (JW − w) / 2 : al === 'dir' ? JW − w : 0)      // w = largura medida da linha
```

1. **`PLTEXTO.alinharX(al, L, JW, w)`** — função nova, única para tela e PDF (MT-02). Devolve o `x` em mm.
2. **`PLTEXTO.linhas(leg, fr, medir, opts)`**: remove `opts.pos` e os ramos `pos==='acima'`; a assinatura `assinaturaDir(leg, fr)` passa a depender de `leg.al` (ver 4.4). Nenhuma outra conta muda (a vertical é a mesma).
3. **`gerador.layoutLegenda`**: removem-se os ramos `pos==='acima'` e `ambas` e `GAP_ACIMA`; `capItems(top, x)` e `metaItems(ln, x)` passam a receber `x = alinharX(leg.al, L, JW, w)` com `w` = `capBoxW` (texto) ou a soma dos segmentos da linha (meta). O grupo de ajuste fino (dy/inc) continua, sem `dx`. `clip` continua `{x:L, w:JW}`.
4. **Tela (`legendas.js`)**: `.pq__band{text-align:var(--al)}` com `--al` = `left|center|right`; as linhas absolutas do Pocket (`.lg-l--x`) ganham `text-align` igual; o `fora()` não muda (mede caixas reais).
5. **Folhas (`editor.js`)** e **T-02** usam a mesma variável `--al` nas miniaturas.
6. **Migração** (em `PLTEXTO.migrar(leg)`, chamada por `legendas.js` ao ler `ST[0].leg` e por `projetos.js` ao importar `.polarlife`): `pos` ∈ {acima, ambas, abaixo} → apaga `pos`; `dx` → apaga (o alinhamento assume; se `dx` ≠ 0 e `al` ausente, `al = dx < −1 ? 'esq' : dx > 1 ? 'dir' : 'esq'`); `limpa` → `original`; `al` ausente → `'esq'` (igual ao PDF de hoje: o texto nasce em `x = L`). Teste: projeto salvo com `pos:'acima'` abre com o texto abaixo e sem erro.
7. Padrão por formato: `'esq'` em todos (fidelidade com projetos existentes). Os modelos prontos (D-120) e o padrão Pocket (D-113) podem definir `al` explicitamente; a legenda do Pocket D-113 continua `esq`.

### 4.4 Assinatura automática com o alinhamento (D-129 reduzida pela D-136)

`assinaturaPos(leg, fr)` em PLTEXTO: `'auto'` → canto oposto ao texto: `al==='esq'` → direita; `al==='dir'` → esquerda; `al==='centro'` → canto com mais folga entre a última linha e a borda (se nenhuma, reduz a 80 % e o pré-voo avisa). Fixa (`esq|centro|dir`) → usa; colisão → pré-voo bloqueia com «Usar posição automática». Substitui `assinaturaDir` (D-128 vira caso particular: Pocket em duas linhas à esquerda → assinatura à direita).

### 4.5 Painel Texto · ordem final (desktop e celular)

1. **Polaroid original** (int + estado em texto)
2. **Posição** · Alinhamento `[Esquerda · Centro · Direita]` (seg, ícones de alinhamento + rótulo)
3. **Estilo** · chips roláveis dos 8 estilos prontos (+ «Modelos» com emoji, D-120, quando existirem)
4. **Texto** · int «Mostrar texto» · campo (0/80, validação) · «Sugestões» · linha Fonte (botão com amostra) · Tamanho (sld) · Cor (3) · `details` «Mais opções do texto»: Caixa (seg 3) · Espaçamento (sld) · Ajustar para caber (chk)
5. **Data** · int «Mostrar data» · Formato (**select**) · linha Fonte · Tamanho · Cor
6. **Local** · int «Mostrar local» · linha Fonte · Tamanho · Cor · `details` «Como escrever o local»: Estado (seg 3) · País (seg 3) · Separador (**select**) · Ordem (seg 2)
7. `details` **Linhas** (D-113): Data e local (seg 2) · Ordem (seg 2) · Medir por (seg 2)
8. `details` **Ajuste fino**: Deslocar na vertical (sld) · Inclinação (sld)
9. **Assinatura** · `[Automática · Esquerda · Centro · Direita]` (seg 4)
10. Rodapé: «Resetar textos» · «Aplicar texto às demais · 23 fotos»

---

## 5. Stickers e emojis (D-137)

### 5.1 Decisão sobre a Trava T4 («nada sobre a foto»)

**Proposta: elementos escolhidos pela pessoa podem entrar na janela da foto; o sistema continua proibido de pôr qualquer coisa lá.** Motivos: (a) a T4 nasceu para impedir números, códigos, coordenadas e selos **do app** sobre a foto — ruído que a pessoa não pediu; um coração que ela mesma arrastou é conteúdo, como a própria foto; (b) a referência do dono (Canva) e o uso real de scrapbook esperam isso; (c) proibir cria um limite invisível e frustrante ao arrastar. Salvaguardas: o sticker **nasce na faixa inferior** (ao lado do texto), há **guia de encaixe** na borda da janela (o elemento «gruda» na borda ao chegar a 1,5 mm) e o pré-voo **informa** («2 stickers cobrem parte da foto 03») sem bloquear. Alças, barras e o contorno de seleção continuam fora da janela sempre que possível (alças ficam nos cantos do próprio elemento; são da tela, nunca do arquivo). Redação proposta da T4 em §7.1.

### 5.2 Modelo de dados (por foto, `ST[n].el`)

```js
ST[n].el = [                         // ordem do array = ordem de camada (último = na frente)
  { id:'e1a2',                        // 4 chars aleatórios, único na foto (para desfazer e seleção)
    t:'sticker',                      // 'sticker' | 'emoji'
    v:'coracao',                      // id no catálogo PLSTICKERS (t==='sticker') | o próprio emoji, 1 grafema (t==='emoji')
    x:44, y:92,                       // centro do elemento, em mm, a partir do canto superior esquerdo da moldura EM PÉ (como fr.cw/ch · D-109)
    w:12,                             // largura em mm (4 a 40); altura = w / proporção do item (stickers 1:1; emoji 1:1)
    rot:0,                            // graus, −180 a 180, passo livre; alça gira em passos de 1°, Shift 15°
    cor:'laranja'                     // só stickers monocromáticos: 'preto' | 'azul' | 'laranja' | 'branco' (T2); stickers coloridos ignoram
  }
]
```

Limites: até **12** elementos por foto; `x,y` presos para o centro ficar dentro da moldura com 2 mm de respiro (o elemento pode ultrapassar a borda em até 50 % da própria largura? **não**: fica inteiro dentro da moldura, inclusive girado — a caixa girada é calculada e presa); `w` de 4 a 40 mm, também limitado a `min(fr.cw, fr.ch) − 4`. Não entram na área da assinatura (pré-voo bloqueia, mesma regra do texto). Com `leg.original` ligado, `el[]` não se desenha nem no PDF. Escopo: stickers são **por foto**; «Aplicar às demais» copia `el[]` para o escopo (mesma posição em mm; se não couber na moldura de outra orientação, prende).

### 5.3 Interação

| Gesto | Resultado |
| --- | --- |
| Toque/clique no item do catálogo | Adiciona ao centro da faixa inferior (x = cw/2, y = ct + cjh + (ch − ct − cjh)/2), `w` = 12 mm (emoji 10 mm); seleciona; toast «Sticker adicionado · Desfazer» |
| Arrastar (1 ponteiro) | Move 1:1 com o cursor/dedo; guias de encaixe (centro X da moldura, centro X/Y da faixa, bordas da janela) com linhas azuis finas só na tela; prende a 1,5 mm |
| Alças (4 cantos) | Redimensiona mantendo proporção, a partir do canto oposto; `Alt` = a partir do centro |
| Alça de giro (acima do item, 24 px) | Gira; `Shift` = passos de 15°; mostra o ângulo em pílula mono |
| Pinça (2 ponteiros) no celular | Escala + giro ao mesmo tempo (distância e ângulo entre dedos) |
| Setas | 0,5 mm (Shift 2 mm) |
| `Delete`/`Backspace` · botão Excluir | Remove (entra no desfazer; toast com Desfazer) |
| `Ctrl+D` · Duplicar | Cópia deslocada 3 mm para baixo e para a direita |
| `Ctrl+]` / `Ctrl+[` · Trazer para frente / Enviar para trás | Reordena no array |
| Duplo toque no emoji | Abre o painel Stickers na aba Emojis para trocar |
| `Esc` | Limpa seleção |

Tudo entra no histórico (`Q.commit('el:…')`, com coalescência de 700 ms durante o arraste, como os deslizadores).

### 5.4 Como saem no PDF sem bibliotecas externas (MT-02)

* **Stickers** = desenhos **próprios** em SVG (caminhos `path` numa caixa 0–100, sem gradientes nem texto; até 6 caminhos por sticker; cores só da paleta ou «cor do sticker»). No PDF, cada caminho vira `page.drawSvgPath(d, {x, y, scale, color, rotate})` (já existe no `pdf-lib` vendorizado) dentro de um grupo com a matriz do elemento. Item da display list: `{t:'svg', x,y,w,h (µm), rot, paths:[{d, fill:'#…'}]}` desenhado por `desenharSvg(ctx,it)`. Vetor: imprime nítido em qualquer tamanho e não pesa.
* **Emojis** = **rasterização local** com a fonte de emoji do sistema: `canvas` quadrado de `ceil(w_mm / 25.4 × 600)` px (≥ 600 PPI, D-120), `ctx.font = size + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'`, `fillText(emoji, …)`, PNG com alfa → `doc.embedPng` → item `{t:'img', src:'emoji:'+grafema, …}` (reaproveita `desenharImg`, com `rot`). Cache por grafema+tamanho na geração. Avaliação: (+) sem fonte de emoji embutida (as 24 do catálogo não têm emoji; embutir Noto Color Emoji são ~10 MB e licenciamento a confirmar, P3); (+) o PDF fica **idêntico ao que a pessoa viu** na tela do mesmo aparelho (MT-02); (−) abrir o projeto em outro sistema muda o desenho do emoji (aviso de «Informa» no pré-voo quando o projeto foi salvo em outro SO: campo `so` no `.polarlife`); (−) sem fonte de emoji (Linux mínimo) sai um retângulo: detectar com `measureText` + pixel-check e bloquear no pré-voo («O aparelho não tem fonte de emoji; troque por um sticker»).
* Na **tela**, stickers são `<svg>` inline com `<use>` do sprite do catálogo; emojis são `<span>` com a mesma pilha de fontes — por isso tela e PDF usam a mesma fonte do sistema.
* Nas **folhas** e na **T-02** o mesmo desenho (sprite + span), em `--pmm`.

### 5.5 Catálogo inicial (`site/assets/js/nucleo/stickers.js` → `window.PLSTICKERS`; sprite SVG em `site/assets/img/stickers.svg`, desenhado por mim na fase 2)

24 itens, 6 temas, traço 500-friendly (linhas de 6 unidades, cantos redondos), monocromáticos (cor escolhível) salvo onde indicado:

| Tema | Itens (id · nome) |
| --- | --- |
| Afeto | `coracao` Coração · `coracao-duplo` Dois corações · `beijo` Beijo (lábios) · `estrela` Estrela |
| Viagem | `aviao` Avião · `mala` Mala · `pin` Pin de mapa · `bussola` Bússola |
| Natureza | `sol` Sol · `onda` Onda · `folha` Folha · `montanha` Montanha |
| Festa | `balao` Balão · `bolo` Bolo · `confete` Confete (colorido: 3 cores da paleta) · `taca` Taça |
| Fita e papel | `fita` Fita adesiva (branco translúcido 70 %, 2 ângulos) · `clipe` Clipe · `carimbo-data` Carimbo «ANO» oval · `seta` Seta desenhada |
| Formas e frases | `circulo` Círculo · `nuvem` Nuvem de fala · `etiqueta` Etiqueta · `polaroid-mini` Mini polaroid |

Emojis: painel «Emojis» com busca por nome em pt-BR (lista estática de ~200 emojis com nomes: `nome → grafema`), categorias Rostos · Corações · Natureza · Viagem · Comida · Festa · Símbolos; «Recentes» (8) em `localStorage`. Fonte: a do sistema; nunca imagens externas (T6).

### 5.6 Painel Stickers (desktop e celular)

1. Abas internas `[Stickers · Emojis]` (seg) + busca.
2. Grade 4 colunas (desktop) / 5 (celular) de botões 56 px com nome em `aria-label` e tooltip; tema como título de seção; «Recentes» no topo quando houver.
3. Com um elemento selecionado, o topo do painel mostra **Elemento selecionado**: Tamanho (num −/+ mm) · Giro (num −/+ °) · Cor (seg 4, só se monocromático) · Ordem (Trazer para frente · Enviar para trás) · Duplicar · Excluir.
4. Rodapé: «Aplicar stickers às demais · n» (copia `el[]` ao escopo).

### 5.7 Tela: implementação

`site/assets/js/editor/elementos.js` → `window.PLEL` (camada `js/editor/`), ES5. Desenha `el[]` da foto atual dentro de `.pq__leg` (coordenadas em `--pmm`, mesma rotação de moldura da D-109), gerencia seleção, alças, arraste, pinça, teclado, guias, limites e `Q.commit`. API: `PLEL.render()`, `PLEL.sel(id|null)`, `PLEL.add(t,v)`, `PLEL.remover()`, `PLEL.duplicar()`, `PLEL.ordem(+1|-1)`, `PLEL.aplicarEscopo(lista)`. Reutilizado pelas folhas em modo só-leitura (`PLEL.pintar(container, el, fr, pmm)`).

### 5.8 Pré-voo (prevoo.js)

* **Bloqueia**: elemento invade a zona da assinatura (quando ligada) ou sai da moldura; emoji sem fonte no aparelho.
* **Pede confirmação**: elemento com `w` < 6 mm (pode sair ilegível).
* **Informa**: «n stickers cobrem parte da foto» (T4 revista); «os emojis foram desenhados com a fonte deste aparelho».

---

## 6. Outras funções propostas (valor ÷ esforço)

| Prioridade | Função | Valor | Esforço | Onde | Observação |
| --- | --- | --- | --- | --- | --- |
| **1** | **Copiar/colar estilo completo** (ajustes + filtro + texto da foto? não: estilo = ajustes, filtro, `el[]`; o texto livre segue «Aplicar texto») | Alto | Baixo | P:Fotos, Ctrl+Shift+C/V, menu ⋯ | Estende `lote.js` `clip` com `el` |
| **2** | **Guias de encaixe** (centro, bordas da janela, alinhamento com outro sticker) | Alto | Médio | Palco | Entra na fase 4; só tela |
| **3** | **Modelos prontos** (D-120: estilo + fonte + frase + emoji/sticker) | Alto | Médio | P:Texto «Estilo → Modelos» | Depende da tarefa 52 (frases) e do catálogo de stickers |
| **4** | **Sugestões de frases** por tema/mês/hora | Alto | Baixo (52 faz a base) | P:Texto | Dependência da 52 |
| **5** | **Camadas** (lista «Foto · Texto · Stickers (n)» com visibilidade e ordem) | Médio | Médio | P:Stickers → «Camadas» | Só quando houver ≥ 2 elementos |
| **6** | **Atalhos de teclado** (painel «?» com a lista) | Médio | Baixo | M / `?` | Já existem; só documentar na tela |
| **7** | **Pré-visualização «como fica na mesa»** (polaroid em escala 1:1 na tela com a calibração) | Médio | Baixo | BC «Escala → 1:1» | Usa `--pmm` real = 96/25,4 × fator de calibração |
| 8 | **Temas de moldura** (cor da moldura) | Baixo | Alto | — | Contra «moldura sempre branca» (FN-03) e T2; **não proposto** |
| 9 | **Texto curvo** | Baixo | Alto (PDF: `Tz`/rotação por glifo) | — | **Não proposto** nesta versão |
| 10 | **Carimbo de data impresso com fonte de câmera** (estilo «Calendário» já cobre) | Baixo | Baixo | — | Já existe como estilo pronto |

---

## 7. Regras estabelecidas que proponho mudar (cada uma para o dono registrar)

| # | Regra atual | Proposta | Motivo | Risco e mitigação |
| --- | --- | --- | --- | --- |
| 7.1 | **T4** «Nada sobre a foto: sem número, código, coordenada ou selo sobre a foto, na tela ou no arquivo» | **T4 (revista):** «Nada **do sistema** sobre a foto: nenhum número, código, coordenada, selo, assinatura, barra ou alça gerados pelo app sobre a janela, na tela ou no arquivo. Elementos **escolhidos e posicionados pela pessoa** (stickers, emojis) podem entrar na janela; nascem fora dela e o pré-voo informa quando a cobrem.» | §5.1 | Cobrir rostos sem querer: sticker nasce na faixa, encaixe na borda, aviso no pré-voo, e Desfazer |
| 7.2 | **D-129** (posição livre + alinhamento + assinatura automática) | Mantida **só** a parte da assinatura (Automática/E/C/D) e o alinhamento; a posição «Acima/Ambas» já foi revogada pela D-136 | Coerência | Nenhum |
| 7.3 | FN-07 deslocamento **horizontal** da legenda (`leg.dx`, −5 a +5 mm) | **Remover** `dx`; o alinhamento E/C/D é a única posição horizontal (D-136: «mesmas margens laterais da foto») | Um deslocamento manual quebraria a regra das margens | Projeto com `dx ≠ 0`: migração em §4.3; registrar na decisão |
| 7.4 | FN-00b/FN-09: caixa «Replicar para as demais» + «Substituir ajustes individuais» + botão «Aplicar às demais» dentro da aba | **Escopo só no chip da barra de contexto** (Só esta · Selecionadas · Esta folha · Todas); «Replicar» some; cada painel com lote mostra no rodapé «Aplicar às demais · n» + a caixa «Substituir ajustes individuais» | Hoje o lote ocupa o topo e o fim da aba e o escopo fica escondido atrás de «Modificar escopo» | Descoberta: o chip pulsa (ponto laranja) quando o escopo ≠ «Só esta», como hoje |
| 7.5 | Nomes das abas (D-114): Papel · Fotos · Ajustes · Legendas · Molduras · Metadados | **Fotos · Recorte · Ajustes · Texto · Stickers · Moldura · Dados** (+ Papel no Modo Folhas) | «Legendas» no plural confunde com «as legendas das 24 fotos»; «Metadados» é jargão (T7) | Vocabulário do DOC-00: manter «Legenda» no texto de ajuda («o texto da legenda») |
| 7.6 | D-119 «Polaroid sem textos» (aba Legendas + atalho em Papel) | Já substituída pela D-135; chave `leg.limpa` migra para `leg.original`; o atalho vai para o chip de escopo | D-135 | Nenhum |
| 7.7 | T2 (só 4 cores + #F8F9FA) aplicada a tudo | **Esclarecer** que T2 rege a **interface**; **conteúdo** da pessoa (foto, emoji colorido) não é limitado. Stickers monocromáticos usam só a paleta (preto/azul/laranja/branco); «Confete» usa as 3 cores | Emojis são coloridos por natureza; D-130 já abriu exceção pontual | Nenhum para a marca: o app continua nas 4 cores |
| 7.8 | FN-04 «Grade de composição» como campo da aba Ajustes | Vai para a BF do recorte («Grade ▾») | É um auxílio de tela, não um ajuste da foto | Nenhum |
| 7.9 | DOC-05 FN-07: formato de data como 13 botões | Caixa de seleção com a data da foto em cada opção | FN-00: 5+ opções → seleção | Nenhum |
| 7.10 | Tablet/desktop: cabeçalho com «Polar Life Studio» + nome + chip + 2 botões + avatar | Barra superior mais curta: nome do projeto e «Salvo neste dispositivo» viram um só grupo; «Polar Life Studio» sai (T7: não é um produto separado) | Espaço para a barra de contexto | Nenhum |

---

## 8. Plano de implementação em fases pequenas e testáveis

Regras gerais para quem implementar: ES5 em IIFE, um `window.PLxxx` por arquivo, mm internos, textos em pt-BR, comentários citando a regra, `npm run verificar` e `npm run testar:node` ao fim de cada fase; nada em `docs/`; sem commit. Cada fase tem de deixar o editor **atual** funcionando (as fases 0–1 e 4a mudam só dados e motor; a casca nova entra na 2 em rota paralela e só substitui a antiga na 3).

### Fase 0 · Contratos de dados e migração (sem UI)

* **Arquivos:** `js/nucleo/legenda-texto.js` (`alinharX`, `assinaturaPos`, `migrar`), `js/nucleo/stickers.js` (novo, `PLSTICKERS`: catálogo com `{id, nome, tema, mono:true|false, paths:[{d, fill}]}` dos 24 itens em caixa 0–100), `js/nucleo/projetos.js` (chama `PLTEXTO.migrar` ao importar), `js/pages/quadro.js` (`novo()` ganha `el:[]`; `lerQuadro` aceita `el`).
* **Contratos:** §4.1 e §5.2. `migrar(leg)` é idempotente.
* **Aceite:** `tests/unit/testar-legenda-migracao.mjs` (Node puro, carrega `legenda-texto.js` num `vm`): `{pos:'acima',dx:3}` → `{al:'dir'}` sem `pos/dx`; `{limpa:true}` → `{original:true}`; `alinharX('centro',6,76,20)` = 34; `assinaturaPos({al:'esq',assin:'auto'},frPocket)` = `'dir'`. Catálogo: 24 ids únicos, todo `d` só com comandos `M L H V C Q Z` e números (regex), nenhuma cor fora da paleta.

### Fase 1 · «Polaroid original» e alinhamento no editor atual (motor + PDF)

* **Arquivos:** `legenda-texto.js` (`linhas` sem `pos`), `gerador.js` (`layoutLegenda` com `alinharX`, sem ramos acima/ambas, sem `dx`; `leg.original` → `[]` e sem `el`), `editor/legendas.js` (1º controle «Polaroid original»; seção Posição vira `seg` Esquerda·Centro·Direita; remove Acima/Ambas e Deslocar horizontal; `--al` na polaroid), `editor/prevoo.js` (respeita `original`), `pages/editor.js` (folhas com `--al`), `css/editor/legendas.css`, `css/pages/quadro.css` (`text-align:var(--al)`).
* **Aceite / Playwright `tests/e2e/testar-texto-alinhado.mjs`:** (1) ligar «Polaroid original» some com `.lg-txt,.lg-dt,.lg-lc` no Quadro, nas folhas e no PDF (texto extraído sem «Dias de sol»); desligar volta tudo e `ST[0].leg` continua igual; (2) com `al:'dir'`, no PDF a borda direita do texto «Dias de sol» = `L + JW` ± 0,2 mm e no Quadro `getBoundingClientRect().right` do `.lg-txt` = borda direita da janela ± 1 px; com `centro`, centro do texto = centro da janela; (3) projeto antigo com `pos:'acima'` abre sem erro e com o texto abaixo; (4) Pocket D-113 continua com local/data a 4 mm e 2 mm (teste `testar-pocket` verde).

### Fase 2 · Casca do Editor v3 (desktop + celular) em rota nova, reusando os módulos

* **Arquivos:** `site/app/editor/quadro/index.html` reescrito sobre a estrutura do protótipo (`design/prototipos/editor-v3/index.html`): trilho, barra de contexto, palco com BF, painel contextual, faixa; `css/pages/quadro.css` (nova casca; `editor.css` segue com os controles), `js/pages/quadro.js` (seleção no palco: `Q.sel = 'foto'|'texto'|'moldura'|id`, BF, chip de escopo, trilho ↔ painéis; mantém o motor), `js/editor/lote.js` (escopo no chip, rodapés), `js/editor/filtros.js` (Comparar/Ver original na BF), `js/editor/molduras.js` (disclosures), `js/editor/metadados.js` (renomear para painel Dados), `js/editor/legendas.js` (ordem do §4.5, select de formato e separador, disclosures).
* **Aceite / Playwright `tests/e2e/testar-editor-v3.mjs`:** 1440 × 900: trilho com 7 itens, clique na janela mostra a BF com Preencher/Encaixar, clique no texto mostra a BF com Esq/Centro/Dir, Esc limpa; chip de escopo troca para «Todas» e o rodapé do painel Ajustes mostra «Aplicar às demais · 23 fotos»; painel Texto tem como **primeiro** `role=switch` «Polaroid original»; 390 × 844: sem rolagem horizontal, 7 abas com ícone, BF abaixo da moldura e não intersecta `#win`, um único `.led-btn` visível, alvos ≥ 44 px (varredura de todos os `button` visíveis); `prefers-reduced-motion` sem transição. Capturas em `tests/saida/editor-v3/`.

### Fase 3 · Modo Folhas na casca v3

* **Arquivos:** `site/app/editor/index.html`, `js/pages/editor.js`, `css/pages/editor.css`.
* **Aceite:** `testar-editor-abas` (tarefa 37) continua verde; trilho mostra «Papel» no lugar de «Recorte»; tocar numa polaroid da folha abre `quadro/#foto-n`.

### Fase 4a · Stickers e emojis na tela

* **Arquivos:** `js/editor/elementos.js` (novo, `PLEL`), `css/editor/elementos.css`, `site/assets/img/stickers.svg` (sprite), painel Stickers no `quadro/index.html`, `quadro.js` (seleção de elemento, commit), `legendas.js` (véu quando `original`).
* **Contratos:** §5.2, §5.3, §5.7.
* **Aceite / Playwright `tests/e2e/testar-stickers.mjs`:** adicionar «Coração» cria `ST[3].el[0]` com `w:12` e centro na faixa; arrastar 40 px move `x` em `40/pmm` mm ± 0,2; não sai da moldura (arrastar 2000 px prende); alça de canto muda `w`; `Delete` remove e Ctrl+Z devolve; pinça (dois `touch` com Playwright `page.touchscreen` ou `dispatchEvent` de `pointer`) muda `w` e `rot`; `original` ligado esconde `.el`; 13º sticker é recusado com toast; capturas com sticker arrastado.

### Fase 4b · Stickers e emojis no PDF e nas folhas

* **Arquivos:** `gerador.js` (`itensPolaroid` emite `svg`/`img` de `el[]`; `desenharSvg`; rasterizador de emoji; cache), `pages/editor.js` (folhas desenham `el[]` com `PLEL.pintar`), `prevoo.js` (§5.8), `projetos.js` (campo `so`).
* **Aceite / `tests/e2e/testar-stickers-pdf.mjs`:** PDF com um `coracao` a `x:44,y:92,w:12,rot:20` contém um caminho vetorial cujo bounding box = posição ± 0,2 mm (pdfjs `getOperatorList` ou inspeção dos ops); emoji «🌊» vira XObject PNG com alfa de ≥ 600 PPI (lado em px ≥ w_mm/25,4 × 600) na posição certa; com `original` o PDF não tem `svg`/`img` além da assinatura; pré-voo bloqueia sticker sobre a assinatura.

### Fase 5 · Copiar/colar estilo completo, guias de encaixe, sugestões e modelos

* **Arquivos:** `lote.js` (`clip.el`), `elementos.js` (guias), `legendas.js` (Sugestões → `PLFRASES` da 52; Modelos D-120 → `PLCATALOGO.modelos`).
* **Aceite:** colar estilo copia `el[]`; arrastar um sticker até 1 mm da borda da janela prende na borda e mostra `.guia`; «Sugestões» mostra 3 frases distintas e aplica com Desfazer.

### Fase 6 · Polimento e acessibilidade

* Varredura de alvos, `aria-*`, foco visível, View Transitions entre Folhas e Quadro (brief v2 §3.4), esqueleto de carregamento da nova casca, revisão de textos (T7). Teste: axe-core não está vendorizado → checagens manuais em Playwright (contraste das 4 cores já conhecido; nomes acessíveis de todos os botões não vazios).

---

## 9. Protótipo (fase 1 desta tarefa)

`design/prototipos/editor-v3/index.html` + `editor-v3.css` + `editor-v3.js` (ES5, sem CDN, fontes locais via `../../../site/assets/fonts/` e tokens/LED via `../../../site/assets/css/base/`). Mostra o Modo Quadro no desktop (≥ 1024) e no celular (< 768) por largura, com: trilho/abas, barra de contexto com chip de escopo, polaroid Clássico 88 × 107 em `--pmm`, painel **Texto** completo na ordem do §4.5 (interruptor «Polaroid original» funcional; alinhamento E/C/D funcional na polaroid e na BF), painel **Stickers** com catálogo (12 stickers desenhados + emojis) e um elemento arrastável com alças (arrastar, redimensionar, girar, duplicar, excluir, limites da moldura, guia de encaixe no centro), painéis Recorte/Ajustes/Moldura/Dados/Fotos em versão resumida para mostrar o lugar de cada função. Não gera PDF. Capturas em `tests/saida/editor-v3/` (script `tests/saida/editor-v3/capturar.mjs`).
