---
id: DOC-06
titulo: Polar Life · Colagens, sugestões, lembranças e compartilhamento
edicao: 2
data: 2026-11-07
status: vigente [RECOMENDADO: entra na 1.1; adesivos e colagem livre avançada na 2.0]
depende_de: [DOC-01, DOC-02, DOC-05, DOC-07]
---

# Colagens e lembranças

> **TL;DR para IA.** O **Modo Colagem** monta várias polaroids num canvas para **compartilhar ou arquivar** (o Modo Folhas continua sendo o de imprimir). O app **sugere** layouts e frases de design calculados **no aparelho**. A **Lembrança** é a imagem final, pronta para redes. Nada sobe a servidor; compartilhar é entregar um arquivo ao app que o usuário escolher. A IA de design tem **liberdade visual** dentro das regras de §2.

## 1. Conceito e escopo

| Item | Modo Folhas | Modo Colagem | Lembrança |
| --- | --- | --- | --- |
| Objetivo | Imprimir e cortar | Compor e compartilhar | Entregar pronta |
| Canvas | Papel (A4…) | Formato social ou cartão | Saída da colagem |
| Posição das polaroids | Grade automática | Automática + livre | Já resolvida |
| Conta o limite de folhas | Sim | **Não** (imagem) | **Não** |

`[RECOMENDADO]` Lembranças e colagens em imagem não consomem folha (DOC-03 §3, D-054). Colagem também exporta **PDF para imprimir** em A4, A5 ou 10×15, e nesse caso conta como folha.

## 2. FIXO

| ID | Regra |
| --- | --- |
| CL-01 | A polaroid dentro da colagem **mantém moldura branca** e a legenda (DS-10, BR-04) |
| CL-02 | Mínimo de fotos por colagem: 1. Máximo: 24 no grátis, 200 no Pro (2.0) |
| CL-03 | **Assinatura** ligada por padrão em toda imagem compartilhada (BR-05) |
| CL-04 | **Fundos:** `#FFFFFF`, `#F8F9FA`, `#000000`, `#006194`, `#FD761A` ou o degradê LED suave. Fundo é **conteúdo**, como a cor de legenda (DS-13). Texturas de papel ficam `[PENDENTE]` até o dono decidir se abre exceção de cor |
| CL-05 | Fotos e metadados **não saem do aparelho**; saída sem EXIF, GPS, XMP (BR-07) |
| CL-06 | **Sem link público.** Compartilhar = arquivo de imagem pelo menu do sistema ou download (BR-01) |
| CL-07 | Sugestões e frases são **locais e determinísticas**: mesmo projeto, mesma sugestão; sem IA em nuvem, sem análise de rosto |
| CL-08 | Fontes expressivas só em legendas (EXC-2) e na frase da sugestão (EXC-3); texto da lembrança em Inter ou Cormorant (DOC-02) |
| CL-09 | A frase de design **nunca** vira texto impresso sobre a foto sem confirmação do usuário |

## 3. Formatos de saída

| Nome na interface | Pixels | Uso |
| --- | --- | --- |
| Story / Reels | 1080 × 1920 (9:16) | Stories, status |
| Retrato | 1080 × 1350 (4:5) | Feed |
| Quadrado | 1080 × 1080 (1:1) | Feed, mensagens |
| Paisagem | 1920 × 1080 (16:9) | Telas, apresentação |
| Cartão impresso | 10×15 cm ou 13×18 cm a 300 PPI | Imprimir ou gráfica |

PNG (padrão) ou JPEG q90–100. Tamanhos de pixel de redes `[VALIDAR]` periodicamente, pois mudam.

## 4. Layouts de colagem

Chamados **«Layouts de colagem»** (não confundir com os «25 modelos» do Roteiro v4, que continuam `[PENDENTE]`). Lista inicial **guiada**: a IA de design pode propor variações visuais, mantendo estes comportamentos.

| Layout | Fotos | Comportamento |
| --- | --- | --- |
| **Mural** | 4–24 | Grade regular; espaço e margem ajustáveis |
| **Mesa espalhada** | 3–12 | Polaroids sobrepostas, rotação −6° a +6°, sombra `polaroid`; ordem de camadas editável |
| **Varal** | 3–8 | Fio fino horizontal com pregadores; polaroids penduradas, balanço sutil só estático |
| **Linha do tempo** | 3–12 | Ordenado por data; marcas de data entre as polaroids |
| **Capa e destaques** | 4–9 | 1 polaroid grande + pequenas ao redor |
| **Tira** | 3–4 | Fotos verticais empilhadas, estilo cabine de fotos |
| **Diário do dia** | 2–6 | Polaroids de um mesmo dia com título e local |
| **Mosaico misto** | 5–15 | Verticais e horizontais encaixadas sem sobrar espaço |

## 5. Motor de sugestões (local)

**Entradas** (todas já existentes no projeto): número de fotos, orientações, datas (EXIF), cidades, qualidade (PPI), legendas.

**Regras** (ordem de prioridade; devolve **até 3** sugestões):

| Condição | Sugestão |
| --- | --- |
| 1 foto | «Polaroid avulsa» (vai ao Quadro) |
| 2–6 fotos de um mesmo dia | Diário do dia; Mesa espalhada |
| 3–4 fotos verticais | Tira |
| 4–9 fotos, cidade em comum | Capa e destaques |
| 6–24 fotos | Mural; Mosaico misto |
| Datas em 3+ dias distintos | Linha do tempo |
| Fotos de verão (mês 12–2 no BR) ou legenda com «sol», «praia» | Varal |

**Saída de cada sugestão:** prévia, nome do layout, **frase de design** (zona EXC-3), legenda sugerida, botão **«Usar esta»**. Sempre há «Ver outras» e «Começar do zero».

**Frases de design** (modelos com campos; exemplos, a IA pode criar outros no mesmo tom: curto, acolhedor, sem exagero):
- «Um varal para os dias de {estação}.»
- «{Cidade}, em {mês}.»
- «Tudo o que cabe em {N} quadros.»
- «O dia {dia} contado em polaroids.»
- «Cada foto no seu lugar.»

**Sugestões de legenda** (nunca preenchem sozinhas; o usuário toca para aplicar): «{Cidade} · {mês/ano}», «{Dia da semana}, {dia} de {mês}», texto de legenda já usado no projeto.

**Sugestão de ajuste:** quando o conjunto tem temperaturas muito diferentes, oferecer «Uniformizar o tom» (aplica o mesmo filtro com escopo visível).

## 6. Modo Colagem (T-15)

- **Mesa:** canvas no formato escolhido, polaroids arrastáveis com alças (mover, girar, escalar proporcional).
- **Inspetor** (abas): **LAYOUT · FUNDO · POLAROIDS · LEGENDAS · EXPORTAR**.
- **Camadas:** trazer à frente, enviar atrás, travar, ocultar.
- **Alinhar e distribuir:** esquerda, centro, direita, topo, meio, base, distribuir horizontal/vertical; encaixe com guias magnéticas em 8 px.
- **Medidas:** posição X/Y e ângulo digitáveis; unidades como no editor (FN-03).
- **Desfazer/refazer** compartilhado com o projeto.
- **Escopo:** chip «Alterando: esta polaroid / selecionadas / todas».
- **Adesivos e colagem livre avançada:** 2.0 `[PENDENTE]` biblioteca; não inventar.

## 7. Lembranças (T-17)

**Tipos gerados a partir do projeto:**

| Tipo | Conteúdo |
| --- | --- |
| **Lembrança do dia** | Fotos de uma data escolhida |
| **Resumo da viagem** | Fotos agrupadas por cidade e período |
| **Neste dia** | Fotos de projetos salvos com a mesma data de anos anteriores; aparece ao abrir o app, sem notificação |
| **Antes e depois** | Mesma foto com e sem ajuste |
| **Cartão para enviar** | 1 polaroid grande com texto curto |

**Cartão de lembrança:** prévia no formato final, legenda do post (editável), «Copiar texto», «Compartilhar», «Baixar imagem». Hashtags **não** são adicionadas.

## 8. Compartilhar (T-22)

```
prepararLembranca(l):
  blob = renderizarPNG(l) em worker            // antes do clique, nunca depois
  arquivo = File([blob], nomeNeutro('png'))
  suporta = navigator.canShare?.({ files: [arquivo] })
  botão = suporta ? «Compartilhar» : «Baixar imagem»   // detecção de recurso
aoClicar:
  se suporta: navigator.share({ files }) na thread principal
     AbortError (usuário cancelou) → sem mensagem
     outro erro → trocar para «Baixar imagem»
  senão: baixar(arquivo) e mostrar instrução do destino
```

| Destino | Caminho |
| --- | --- |
| Celular com menu de compartilhar | Compartilhar → escolher Instagram, WhatsApp, Mensagens… |
| Desktop ou sem suporte | «Baixar imagem» → «Abra o aplicativo e escolha a imagem na galeria» |
| Instagram | Sem integração por API (DOC-07, CN-03); o caminho é o menu do sistema ou o download |
| Salvar na galeria (iOS) | «Salvar imagem» pelo menu do sistema `[VALIDAR]` |

Requisitos técnicos (verificados na documentação MDN, 07/11/2026): HTTPS, ação do usuário, indisponível em Web Workers, disponibilidade limitada, testar com `canShare({ files })`. Nome neutro de arquivo (BR-11).

## 9. GUIADO e LIVRE

- **GUIADO:** o conjunto de layouts (8 acima é o mínimo), proporções das polaroids em cada layout, ordem de sugestões dentro das regras do §5.
- **LIVRE:** o desenho de cada layout (espaçamentos, rotações, composição), o tom das frases além dos exemplos, a animação de entrada das sugestões (respeitando `prefers-reduced-motion`), cenários de fundo dentro de CL-04.

## 10. Aceite

Passa se: moldura branca em todas as polaroids; assinatura presente por padrão; frase de design em EXC-3 e nada mais em fonte expressiva fora de legendas; sem link público; botão «Compartilhar» só aparece quando `canShare` confirma; sugestão idêntica para o mesmo projeto; sem EXIF/GPS no arquivo.

## 11. Pendências

Biblioteca de adesivos (2.0) · texturas de papel (CL-04) · confirmar que lembranças não consomem folha (D-054) · tamanhos de pixel das redes (revisar a cada release).
