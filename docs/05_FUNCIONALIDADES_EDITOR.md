---
id: DOC-05
titulo: PolarLife · Funcionalidades do editor
edicao: 2
data: 2026-11-07
status: vigente
depende_de: [DOC-01, DOC-02, DOC-03]
---

# Funcionalidades do editor

> **TL;DR para IA.** Doze ferramentas, todas com **rótulo persistente, unidade dentro do campo, ajuda abaixo, «Resetar» por controle e escopo visível**. Defaults e faixas abaixo são contrato (FIXO); a **organização visual** das abas é GUIADA. Vocabulário: **Recorte** (foto) ≠ **Guias de corte** (papel).

## Regras comuns (FIXO)

| ID | Regra |
| --- | --- |
| FN-00a | Campo de 44 px; unidade dentro do campo; ajuda abaixo; «Valores diferentes» em lote: etiqueta no cabeçalho do campo e ajuda com a contagem de fotos (D-110) `[RECOMENDADO]` |
| FN-00b | Escopo em 4 níveis: **Somente esta · Selecionadas · Esta folha · Todas**. Ajustes individuais ficam protegidos (caixa «Substituir ajustes individuais» desmarcada) |
| FN-00c | Desfazer/refazer ilimitado na sessão; debounce de 80 ms em campos numéricos, imediato em interruptores |
| FN-00d | Original nunca é alterado; tudo é instrução, renderizada só na exportação (BR-02) |

## FN-01 · Papel e distribuição (aba PAPEL)

| Campo | Tipo | Valores | Padrão |
| --- | --- | --- | --- |
| Papel | select | A3, A4, A5, 13×18, 10×15, Personalizado (50–1000 mm) | A4 |
| Orientação da folha | segmentado | Retrato · Paisagem | Retrato |
| Margem da folha | numérico | 0–50 mm | 10 |
| Entre polaroids | numérico | 0–30 mm | 4 |
| Girar para caber mais | interruptor | on/off | on (mostra «+1 por folha») |
| Alinhamento do bloco | segmentado | Centralizado · Topo-esquerda | Centralizado |
| Separar por orientação | interruptor | on/off | on |
| **Guias de corte** | interruptor | on/off | on |
| **Contorno da polaroid** | interruptor | on/off | off |
| Comprimento das guias | segmentado | Linha contínua · Marcas de canto | Contínua |
| Cor da guia | segmentado | Preto · Azul · Laranja | Preto |
| Rodapé da folha | interruptor | on/off | off |
| Assinatura PolarLife | interruptor | on/off | on (no grátis, desabilitado com rótulo «Pro», 2.0) |

Painel de resultado: «4 por folha · 6 folhas · aproveitamento 78%».

## FN-02 · Guias de corte × contorno (FIXO)

Dois interruptores independentes. **Invariante: `cutGuides && outline = falso`.**
- Guias ligadas ⇒ contorno **desabilitado** (borda tracejada) com «ⓘ Desative as guias de corte para usar contorno».
- Contorno ligado e o usuário liga as guias ⇒ pop-up «Ativar guias desliga o contorno?» (**Manter contorno** · **Ativar guias**).
- Guia: 0,1 mm contínua, sem transparência, 0,05 mm para fora da aresta, vai até a borda da folha sem cruzar o interior de nenhuma polaroid. Com espaço 0, linha única compartilhada. Recomendar espaço ≥ 2 mm com guias.
- Contorno: 0,25 pt (0,1–1 pt), preto ou azul, na aresta externa.
- No preview, espessura proporcional ao zoom; chip «Guias · 0,1 mm».

## FN-03 · Formato da polaroid, moldura e medidas (abas MOLDURAS)

- **Formatos de fábrica:** Clássico 88×107 (janela 76×76) · Mini quadrado 60×73 · Retro Pocket 66×99 (janela 60×79, D-113) · Instax Mini 54×86 · Instax Square 72×86 · Instax Wide 108×86 · Personalizado.
- **Orientação da polaroid:** Vertical · Horizontal (atalho `R`).
- **Medidas editáveis:** externa, janela, faixa superior, faixa inferior, cantos 0–6 mm, margem uniforme com cadeado, «Manter proporções do formato».
- **Moldura é sempre branca**; não há seletor de cor. Moldura pertence à foto, não altera papel nem espaço.
- **Medidas visíveis (novo):** réguas em mm na mesa, unidades **mm · cm · pol** (preferência global), cota «Passe-partout inferior: 24,5 mm» ao selecionar a faixa, distância entre polaroids ao arrastar. Medidas em Plex Mono 11 px (TP-07).
- **Janelas de fábrica (D-108):** Instax Mini 46 × 62 · Instax Square 62 × 62 · Instax Wide 99 × 62 (medidas Fujifilm) `[RECOMENDADO]` para as faixas.
- **Atalhos de medida (D-108) `[RECOMENDADO]`:** proporção da janela (1:1 a 16:9), faixa inferior, margens e cantos; só preenchem os campos editáveis.
- **Trocar formato** abre pop-up com antes/depois e novo número de folhas.
- **Modelos** (1.1) `[PENDENTE]`: não inventar; entram como dado versionado.

## FN-04 · Recorte e posicionamento da foto (aba AJUSTES, Quadro)

| Controle | Detalhe |
| --- | --- |
| Modo | **Preencher** (padrão) · **Encaixar** (foto inteira, sobra branca). Nunca esticar |
| Posição | Arrastar; setas 1 px, Shift 10 px; «Centralizar» |
| Zoom | 100–400%, digitável, passo 1%; roda do mouse; pinça |
| Girar / espelhar | 90° · horizontal · «Resetar foto» |
| **Endireitar (novo)** | −15° a +15°, passo 0,1°, com grade fina; o zoom mínimo sobe para cobrir a janela |
| **Proporção da janela** | Segue o formato (1:1, 4:5…); «Livre» só no Personalizado |
| **Grade de composição (novo)** | Terços, diagonais ou nenhuma; só na tela, nunca impressa |
| Indicador de qualidade | Selo em tempo real (BR-12) |
| «Mostrar a foto inteira» | Traço fino do que será cortado |
| Assunto principal | Ajuste automático no aparelho (2.0) |

## FN-05 · Ajustes de imagem

| Controle | Faixa | Padrão | Observação |
| --- | --- | --- | --- |
| Brilho | −100 a +100 | 0 | |
| Contraste | −100 a +100 | 0 | |
| Saturação | −100 a +100 | 0 | |
| Temperatura | −100 a +100 | 0 | Azulado ↔ alaranjado |
| **Realces (novo)** | −100 a +100 | 0 | Recupera céu estourado |
| **Sombras (novo)** | −100 a +100 | 0 | Abre áreas escuras |
| **Nitidez (novo)** | 0 a 100 | 0 | Só no export, a ≥ 300 PPI |
| **Vinheta (novo)** | 0 a 100 | 0 | Escurece bordas, sem cor |

«Resetar» por controle e «Resetar tudo». Escopo no pé da aba.

## FN-06 · Filtros

**12 filtros:** Original, P&B, Noir, Retrô, Foto Antiga, Praia, Pastel, Polaroid Clássico, Instantânea, Verão, Desbotado, Cinema. Intensidade 0–100%. Miniaturas com **a foto atual**. «Ver original» ao manter pressionado.

**Novos (comportamento, não novos filtros):** **Sugerido para esta foto** (1 filtro destacado, calculado do histograma no aparelho) · **Favoritos** · **Comparar** (divide a foto em antes/depois) · **Aplicar o mesmo filtro nas selecionadas** com escopo. Implementação: matriz de cor 4×5 + LUT, mesmo código na tela e no export, **sem aleatoriedade** (BR-03). Granulação só com semente fixa por foto (1.1).

## FN-07 · Legendas (aba LEGENDAS)

Três tipos independentes: **Texto livre**, **Data**, **Local**, cada um com interruptor, fonte e estilo próprios.

| Propriedade | Opções |
| --- | --- |
| **Fonte** | Catálogo de EXC-2 (DOC-02 §4): 5 categorias, busca, favoritas, recentes, amostra na própria fonte |
| Tamanho | 8–32 pt, «Ajustar para caber» |
| Peso / itálico | Conforme a fonte; desabilitado com explicação se não existir |
| Caixa | Normal · MAIÚSCULAS · Capitalizada |
| Espaçamento | −0,05 a 0,3 em |
| Cor | Preto (padrão) · Azul · Laranja (conteúdo impresso, DS-13) |
| **Posição** | Abaixo (padrão) · Acima · Ambas; até 3 linhas por faixa; alinhamento horizontal e vertical |
| **Deslocamento fino (novo)** | X e Y de −5 a +5 mm, passo 0,1, com encaixe na linha-base |
| **Inclinação (novo)** | −5° a +5°, padrão 0; o pré-voo mede a caixa **inclinada** na área segura |
| Estilo pronto | Simples · Contornada · Etiqueta · Carimbo · Pin de local · Calendário · Bilhete · Manuscrito |
| Ícone inicial | Nenhum · 📍 · 📅 · emoji `[VALIDAR]` licença e peso no PDF |

**Texto livre:** até 80 caracteres («11/80»). Código de arquivo → pede confirmação; coordenadas → bloqueia.

**Data** (padrão do usuário; sobrescreve por foto ou lote): origem Data da foto (EXIF) · Data do arquivo · Manual · Sem data. Formatos para 14/07/2026: `14.07.26` · `14/07/2026` · `14-07-2026` · `14/07/26` · `2026-07-14` · `07/2026` · `07.26` · `14 de julho de 2026` · `14 jul 2026` · `14 de julho` · `Julho de 2026` · `jul/26` · `terça, 14 de julho`. Mês número/abreviado/completo; separador `.` `/` `-` espaço; ano 2, 4 ou oculto; dia `1` `01` `1º`. Sem data na foto: Ocultar (padrão) · Data do projeto · Manual. Hora do EXIF é local, sem fuso.

**Local:** origem Automático e aproximado (GPS → cidade, **no aparelho**) · Manual (autocompletar) · Sem local. Componentes Cidade (sempre), Estado (sigla, nome, oculto), País (oculto, nome, código, «ocultar quando for Brasil»). Separador `,` `·` `–` `/`; ordem «Cidade, Estado» ou «Estado, Cidade». Texto fixo «Cidade, nunca coordenadas». Base de cidades offline `[VALIDAR tamanho]`. Fotos vindas do Google Fotos **não trazem GPS**: dica «Escolha a cidade» (DOC-07).

## FN-08 · Metadados (aba METADADOS)

Leitura (data, orientação, dimensões, perfil de cor, origem, selos «Convertida», «Aproximado») + 3 campos editáveis: **data, cidade, origem**. **Corrigir várias de uma vez:** «Somar/subtrair horas às datas das selecionadas» (fuso errado da câmera). Caixa fixa: «Só o que você quer lembrar. Coordenadas brutas não são exibidas. O arquivo gerado não leva os metadados originais.»

## FN-09 · Lote e seleção

Caixa de marcar, Shift/Ctrl/Cmd + clique, «Selecionar todas», «Só esta folha». Ações: Copiar/Colar estilo · Duplicar · Remover · Aplicar ao lote. «Replicar estilo para as demais N fotos» mantém textos individuais e padroniza fonte e posição. Aviso: «3 fotos têm ajuste individual e foram mantidas».

## FN-10 · Duplicadas, ordem e ações em massa

«Manter uma de cada» (hash perceptual + tamanho/data). «Ordenar por data da foto» (respeita a ordem dentro de cada grupo de orientação). Reordenar por arrastar; teclado com `Alt + ↑ ↓`.

## FN-11 · Pré-visualização

Mesma display list do PDF. Camadas ligáveis: Guias · Contorno · Área segura (com a zona da assinatura) · Margem · Régua · «Como imprime». Escala «Ajustar à mesa» com réguas; «Tamanho real 100%» só após calibrar a tela (1.1).

## FN-12 · Teclado

Foco lógico e atalhos documentados: `Ctrl/Cmd+Z` desfazer · `Ctrl/Cmd+Shift+Z` refazer · `R` girar moldura · `←↑→↓` mover foto · `+ −` zoom · `[` `]` foto anterior/seguinte · `G` guias · `Espaço` pan temporário.

## GUIADO e LIVRE

- **GUIADO:** agrupamento dos controles em sanfonas, ordem das abas no celular, forma do seletor de fonte (lista, grade ou carrossel).
- **LIVRE:** microinterações do arrastar, gestos no celular, textos de ajuda, ilustrações dos estilos prontos.

## Aceite

Cada controle: rótulo persistente, unidade, faixa e padrão do quadro acima, «Resetar», escopo; guias e contorno nunca ligados juntos; legenda fora da área segura bloqueia; fonte vem do catálogo; endireitar mantém a janela coberta.
