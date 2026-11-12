---
id: DOC-01
titulo: PolarLife · Sistema de design
edicao: 2.1
data: 2026-11-07
status: vigente
depende_de: [DOC-02]
referencia_html: [biblioteca E1 (componentes), inspetor E4b (layout)]
referencia_css: [polar-led.css v4]
referencia_imagens: [4 logos PNG, 2 capturas de tela do Figma]
mudancas_da_2_1: [§0 novo, DS-15 a DS-17, §4 e §5 detalhados com as medidas dos HTMLs, §11 LED (receita do CSS), §12 páginas de apresentação e login, §13 mapa de logos]
---

# Sistema de design

> **TL;DR para IA.** Estúdio fotográfico tátil: fundo branco, elevação por sombras suaves, 4 cores, ícones finos, texto leve. O LED (laranja → branco → azul) marca **decisão**, nunca decoração, e é construído **só** com o `polar-led.css` (§11). O layout do editor segue o HTML E4b (§4); a anatomia dos componentes segue o HTML E1 (§5). As páginas de apresentação e login seguem as duas capturas do Figma (§12). Cada logo tem um lugar fixo, chamado pelo **nome exato do arquivo** (§13). Tipografia: DOC-02.
>
> **Numeração estável.** As seções §1 a §10 mantêm os números da edição 2 (outros documentos citam «DOC-01 §4.1», «§9» etc.). As novidades estão em §0 e §11 a §14.

## 0. Arquivos de referência (nomes exatos, para a IA reconhecer)

Anexe estes arquivos **com estes nomes**. Quando este documento citar o nome, é este arquivo.

| Nome do arquivo | O que é | Autoridade |
| --- | --- | --- |
| `polar_life_inspetor_legendas_fotogr_ficas_e4b.html` | **E4b** · layout de tela do editor em 1440 | Layout, composição, proporções (DOC-12 §1.3, nível 1) |
| `polar_life_biblioteca_can_nica_de_componentes_do_editor_e1_definitivo.html` | **E1** · prancha de componentes | Anatomia e estados de componente |
| `polar-led.css` | **Sistema LED v4** (botões, caixas, pop-ups, barras) | Mecânica do LED (§11) |
| `Screenshot_20261106_150659_Figma.jpg` | Referência da **página de apresentação** em celular 390 (hero claro) | §12.1 |
| `Screenshot_20261106_150718_Figma.jpg` | Referência da **página de login**, faixa de banner escura em celular 390 | §12.2 |
| `Logo_tipografia_lateral.png` · `logo_oficial_PolarLife.png` · `Logo_favicon_PolarLife.png` · `logo_tipografia_PolarLife.png` | Os 4 logos | §13 |

Os HTMLs e o CSS são **protótipos com dívida de produção**: copie estrutura e medidas, corrija o que o §9 manda. As capturas são **referência de composição**, não de peso tipográfico (§12).

## 1. FIXO (contrato; não alterar)

| ID | Regra |
| --- | --- |
| DS-01 | **4 cores:** `#FFFFFF`, `#000000`, `#006194` (azul), `#FD761A` (laranja). Única exceção de superfície: `#F8F9FA`. Sem outros cinzas, sem vermelho nem verde, sem tons claros de azul ou laranja |
| DS-02 | Bordas = preto a **4%** (`outline-micro`) ou **8%** (`outline-subtle`). Nada de divisor preto pleno |
| DS-03 | Fundo branco. Elevação por sombras (§2). Sem divisores pesados. Única exceção: faixa escura das páginas públicas (DS-17) |
| DS-04 | **LED** só em: 1 botão principal por tela · pop-ups (inclui menu, popover, tooltip, toast) · até 2 caixas de decisão nível 2. Nunca em controles (toggle, checkbox, slider, segmentado). Como construir: §11 |
| DS-05 | Seleção e foco = anel azul 2 px. Toggle e checkbox **ligados = azul** `#006194`, thumb e ✓ brancos |
| DS-06 | Nenhuma informação só por cor: ícone + rótulo + valor. Erro = borda preta 2 px + ✕ + texto. Sucesso = borda preta 1 px + ✓ azul + «Concluído». Atenção = ícone de aviso laranja + texto |
| DS-07 | Alvo mínimo 44×44 px. Grade de 8 px. Português do Brasil, linguagem simples |
| DS-08 | Nada impresso **nem sobreposto** à foto: numeração, código de arquivo, coordenadas, selos, marcas de canto |
| DS-09 | Escopo sempre visível em toda edição: chip «Alterando: só esta foto» ou «Todas as fotos · 24» |
| DS-10 | Moldura da polaroid **sempre branca**. Assinatura = `Logo_tipografia_lateral.png` no canto inferior esquerdo da faixa inferior, dentro da moldura |
| DS-11 | Guias de corte e contorno: dois interruptores; guias ligadas ⇒ contorno desabilitado (DOC-05 FN-02) |
| DS-12 | Mesma hierarquia em desktop, tablet e celular |
| DS-13 | Cores de **conteúdo impresso** (legenda, guia de corte, fundo de colagem) não são texto de interface: seguem DOC-02 e DOC-06 |
| DS-14 | Ícones: Material Symbols Outlined em peso fino (200–300), hospedados por nós. Sem emoji em controles |
| **DS-15** | **Logos:** só os 4 arquivos do §0, chamados pelo nome exato, no lugar definido em §13. Nunca recolorir, esticar, girar, aplicar sombra ou trocar o arquivo por redesenho |
| **DS-16** | **LED:** implementado só com as classes do `polar-led.css` (§11). Proibido recriar o anel com `outline`, `box-shadow` ou Tailwind `bg-gradient` (como fazem os HTMLs) |
| **DS-17** | **Faixa escura:** `#000000` pode ser fundo de **bloco inteiro** em páginas públicas e no login (§12), com texto branco e fotos reais. Não vale no editor, nos pop-ups nem nas telas legais |

## 2. Tokens

**Sombras** (do HTML E1): `subtle` 0 2 10 / 3% + 0 1 3 / 2% · `card` 0 4 20 / 4% + 0 1 4 / 2% · `floating` 0 4 16 / 6% · `polaroid` 0 16 36 / 8% + 0 2 8 / 4% · `lifted` 0 12 32 -4 / 8% + 0 4 12 -2 / 4% (polaroid levantada ao arrastar). **Hairline** do cabeçalho e do trilho: 0 1 8 / 3–4% (fica).

**Raios:** `card` **14** (mesa, inspetor, cartões, caixas LED nível 2 e 3) · `button` e campos **12** · `sm` 8 (menus, tooltips, toast, caixas LED nível 1) · `full` 999 (chips, toggle, barras).

**LED:** gradiente `linear-gradient(90deg, #FD761A 0%, #FFFFFF 50%, #006194 100%)` (horizontal, botões) e `135deg` (caixas). Anéis: nível 1 = 1 px · nível 2 = 1,5 px · nível 3 = 2,5 px. Halo laranja à esquerda e azul à direita, 14–20% de opacidade. Receita completa: §11.

**Movimento:** 150 ms em toques, 200–350 ms em sombras e névoa, curva `cubic-bezier(.2,.7,.2,1)`. Com `prefers-reduced-motion`, sem animação (a névoa fica estática).

**Espaço:** grade de 8 px; gutter 16; margem 32 desktop, 24 tablet, 16 celular (páginas públicas: 24 no celular, §12). Larguras máximas: editor 1720; prancha de componentes 1440.

**Variáveis CSS de produção** (compilar no lugar dos tokens Material do Tailwind):

```css
:root{
  --white:#FFFFFF; --black:#000000; --blue:#006194; --orange:#FD761A; --surface-subtle:#F8F9FA;
  --outline-micro:rgb(0 0 0/.04); --outline-subtle:rgb(0 0 0/.08);
  --shadow-subtle:0 2px 10px rgb(0 0 0/.03),0 1px 3px rgb(0 0 0/.02);
  --shadow-card:0 4px 20px rgb(0 0 0/.04),0 1px 4px rgb(0 0 0/.02);
  --shadow-floating:0 4px 16px rgb(0 0 0/.06);
  --shadow-polaroid:0 16px 36px rgb(0 0 0/.08),0 2px 8px rgb(0 0 0/.04);
  --shadow-lifted:0 12px 32px -4px rgb(0 0 0/.08),0 4px 12px -2px rgb(0 0 0/.04);
  --r-card:14px; --r-button:12px; --r-sm:8px; --r-full:999px;
  --ease:cubic-bezier(.2,.7,.2,1);
}
```

## 3. Botões

| Tipo | Aparência | Uso |
| --- | --- | --- |
| **Principal LED** | Miolo preto, texto branco, anel LED 2,5 px, altura **52** (compacto 42, área de toque 44), raio 12, ícone opcional à direita (`arrow_forward`, `download`) ou à esquerda em laranja (`print`, `check`) | 1 por tela. Ex.: «Revisar impressão», «Gerar PDF (6 folhas)» |
| **Principal claro** | Miolo branco, texto preto, anel LED, halo suave. É a variante `.led-btn--light` | Pop-up, faixa escura (§12), «Começar agora» |
| **Secundário tátil** | Branco, `shadow-subtle`, borda **8%**, raio 12, altura 48 (E1) ou 44 compacto, ícone 18 à esquerda | «Salvar .polarlife», «+ Adicionar fotos», «Copiar estilo», «Voltar e ajustar», «Centralizar quadro» |
| **Terciário** | Texto preto sublinhado | «Ver detalhes» |
| **Destrutivo** | Secundário com ícone de lixeira, nunca LED, nunca vermelho | «Excluir 2 fotos» |
| **Estados** | Hover/foco: névoa líquida 6 s e texto preto · carregando: `aria-busy`, miolo branco e barra deslizante · desabilitado: tracejado 1 px, sem anel | Ver §11.4 |

Peso do texto do botão: **500** (não 600 nem 700). Rótulo com verbo: «Gerar PDF», não «OK». Os HTMLs e o CSS usam 600/700: corrigir (DV-09, DV-39).

## 4. Layout canônico do editor (HTML E4b)

Medidas em px; classes Tailwind do HTML já convertidas. **Corrigir** indica dívida do HTML (§9).

### 4.1 Desktop 1440

**Estrutura geral.** Cabeçalho fixo (64) · trilho fixo à esquerda (256) · conteúdo com `padding-left: 256` e `padding-top: 64` · container interno `max-width 1720`, centralizado, `padding 24`. Fundo da página `#F8F9FA`; cartões `#FFFFFF`.

```
┌──────────────────────── CABEÇALHO 64 (fixo, branco 90% + desfoque) ────────────────────────┐
├─TRILHO 256──┬───────────────── CONTEÚDO (pl-256, pt-64, max 1720, p-24) ───────────────────┤
│ NAVEGAÇÃO   │ FAIXA DE CONTEXTO (chips)                                                   │
│ DE MESA     │ ┌─────────── MESA 7/12 ──────────────┐ ┌──── INSPETOR 5/12 ────┐ gap 32    │
│ ▸ Folhas    │ │ HUD (2 pílulas) · grade de pontos  │ │ «Inspetor» + abas     │            │
│ ▸ Quadro    │ │ polaroid centralizada (máx. 420)   │ │ chip de escopo        │            │
│ ▸ Colagem   │ │ ações + cota                       │ │ estilos prontos       │            │
│ ▸ Lembranças│ └────────────────────────────────────┘ │ módulos em cartões    │            │
│ [cartão     │ ┌─ FAIXA DO LOTE (cartão branco) ────┐ │ posição · lote        │            │
│  guias]     │ └────────────────────────────────────┘ │ pé: ações do escopo   │            │
└─────────────┴─────────────────────────────────────────┴───────────────────────┴────────────┘
```

| Região | Medidas e conteúdo |
| --- | --- |
| **Cabeçalho** | `fixed top-0`, altura **64**, branco 90%, `backdrop-blur`, hairline, `padding-x 24`, `z-50`. **Esquerda:** `Logo_tipografia_lateral.png` altura **32** · divisor vertical 1×20 (preto 8%) · «POLAR LIFE STUDIO» (Inter 12/500, caixa alta). Em ≥ 768: nome do projeto «Viagem · Serra 2026» (Inter 14/500) + chip «Salvo neste dispositivo» (fundo `#F8F9FA`, raio 999, `padding 4×10`, ponto azul 6 px + Plex Mono 11). **Direita (gap 16):** grupo desfazer/refazer (fundo `#F8F9FA`, raio 8, `padding 4`, ícones 18, **área de toque 44**) · «Salvar .polarlife» (secundário, ícone `download` azul 18) · **Revisar impressão** (LED nível 3, ícone `print` laranja 18, `padding 10×20`) · divisor 1×24 · avatar 32 (círculo preto, ícone `person` branco 18) |
| **Trilho** | `fixed left-0 top-64 bottom-0`, largura **256** (recolhível a **72** só com ícones; no recolhido, o topo usa `Logo_favicon_PolarLife.png` a 32), branco, hairline, `padding 24×16`, `flex-col justify-between`. **Topo:** linha «NAVEGAÇÃO DE MESA» (Plex Mono 11, caixa alta, espaçamento largo) + ponto laranja 8 px · lista `gap 6`: itens `padding 12×14`, raio 12, ícone 20 + Inter 14. Inativo: texto preto. **Ativo:** fundo `#F8F9FA`, texto preto 500, sombra 0 2 8 / 4%. Itens: **Folhas** (`layers`) · **Quadro** (`grid_view`) · **Colagem** · **Lembranças** (os dois últimos só com a 1.1 ativa, DV-01). **Pé:** cartão `#F8F9FA`, raio 12, `padding 14`: «GUIA DE CORTE» (mono 11) + «0,1 mm» (mono azul) · ícone `content_cut` 16 + «Guias ligadas · linha contínua» (Inter 13). **Corrigir:** remover «Ferramentas», «Alinhamento de Guilhotina Ativo», «ETAPA E4 · MOTOR FOTO» e «V2.4» (DV-01, DV-24) |
| **Faixa de contexto** | Acima da grade, `margin-bottom 24`, `flex between`. **Esquerda:** chip branco raio 999, `padding 4×12`, sombra `subtle`: ícone `photo_camera` azul 16 + «Modo Quadro · Foto 03 de 24» (mono 11). **Direita:** chip raio 8, `padding 6×12`: ícone `zoom_in` + «Escala 100%» (mono 11). **Corrigir:** remover o rótulo «Etapa E4b · Inspetor de Legendas» e «Preview 1:1 Passe-Partout» (DV-24, DV-25) |
| **Grade** | 12 colunas, `gap 32`, `align-items start`. **Mesa = 7** · **Inspetor = 5**. Abaixo de 1024, uma coluna |
| **Mesa** | Cartão branco, raio **14**, sombra `subtle`, `padding 32` (48 em ≥ 1024), **altura mínima 720**, conteúdo centralizado. Fundo decorativo: grade de pontos pretos de 0,75 px a cada 24 px, opacidade 40%, sem eventos de ponteiro. **HUD** (`top 24, left 24, right 24`, `flex between`): duas pílulas brancas 90% com desfoque, raio 999, `padding 6×14`: esquerda «Guias · 0,1 mm» (ícone `aspect_ratio` azul), direita selo «Boa · 326 PPI» (DV-26). **Polaroid:** branca, `max-width 420`, `padding 20 20 28`, raio 2, sombra `polaroid`; foto `aspect-ratio 1/1`, raio 2; faixa inferior (passe-partout) `padding-top 24`: linha 1 = texto da legenda; linha 2 = data • local (mono 11, `margin-top 8`); **assinatura** (`Logo_tipografia_lateral.png`) no canto inferior esquerdo da faixa (DS-10; o HTML não a mostra). **Corrigir:** remover as marcas de canto sobre a foto e o selo «#03 · 14.07.26» (DS-08, DV-23); sombra `polaroid` no lugar de `shadow-2xl` (DV-16) |
| **Ações da mesa** | Abaixo da polaroid, `margin-top 40`, `flex gap 24`: secundário «Centralizar quadro» (`crop_free`, `padding 8×16`, raio 12) · divisor 1×16 · cota «Passe-partout inferior: 24,5 mm» (ícone `straighten` azul + mono 11) |
| **Faixa do lote** | Cartão branco, raio 12, `padding 16`, sombra `subtle`, `flex between`. Esquerda (rola **dentro** do contêiner, DV-33): «LOTE 24» (mono 11) + miniaturas. Inativa **48×56**: fundo `#F8F9FA`, raio 4, `padding 4`, opacidade 70%, imagem 32 de altura + rótulo «#01» (mono **11**; o HTML usa 9). **Ativa 56×64:** fundo branco, raio 8, sombra, **anel azul 2 px** (o HTML usa laranja: DV-19), rótulo «#03» (sem «ATIVA»). Direita: «Foto 03 / 24» (mono 11) |
| **Inspetor** | Cartão branco, raio **14**, sombra `card`, `padding 24`, `flex-col gap 24`, rolável. Detalhado em §4.1.1 |

#### 4.1.1 Inspetor (aba LEGENDAS, T-10)

Ordem fixa dos blocos (de cima para baixo):

| # | Bloco | Anatomia |
| --- | --- | --- |
| 1 | **Cabeçalho + abas** | «Inspetor» (Inter 22/300) à esquerda. Abas em Plex Mono 11 caixa alta: **PAPEL · FOTOS · AJUSTES · LEGENDAS · MOLDURAS · METADADOS**. Ativa: texto azul + sublinhado azul 2 px (E1). **Corrigir:** o HTML tem 3 pílulas (Quadro, Legendas, Corte) e o chip «PROCESSO E4» (DV-02, DV-24); «Corte» vira «Recorte» ou «Guias» |
| 2 | **Chip de escopo** | `padding 12`, raio 12, fundo `#F8F9FA`, `flex between`. Esquerda: ponto 10 px (laranja, pulsa; sem pulso com `prefers-reduced-motion`) + «Alterando: só esta foto · Foto 03» (Inter 12/500). Direita: link «Modificar escopo» (mono 11, azul). No lote: fundo branco, ponto laranja e tag «LOTE» (anatomia E1) |
| 3 | **Estilos prontos** | Título «ESTILOS PRONTOS DE LEGENDA» (mono 11 caixa alta) + contador gerado pelo tamanho da lista («8 estilos»). Carrossel `gap 8`, rola **dentro do contêiner** no desktop; chips `padding 8×14`, raio 12, Inter 14/500. **Ativo:** fundo preto + texto branco (DV-20). Inativo: fundo `#F8F9FA`. 8 estilos (DV-03) |
| 4 | **Módulo 1 · Texto livre** | Cartão `#F8F9FA`, raio 14, `padding 16`, `gap 16`. Cabeçalho: ícone 18 + «1. TEXTO LIVRE» (Inter 12/500, caixa alta) + **interruptor** à direita. Corpo: rótulo «Inscrição personalizada» + contador «11 / 80» · campo (`padding 10×14`, raio 12, fundo branco, sombra `subtle`, foco azul 2 px, botão ✕ à direita) · **seletor de fonte** (grade de **cartões** `gap 8`, `padding 8`, raio 12, branco; amostra **na própria fonte** + categoria em mono 10→11; escolhido = anel azul 2 px) · tamanho (− valor + `pt`, botões 28→44) + «Ajustar para caber» · alinhamento (3 ícones) e caixa (Aa · AA · A-z) em `grid 2 colunas gap 12` · cor da inscrição: bolinhas **preto, azul, laranja** (sem branco, DV-21; 28 de desenho, 44 de toque) |
| 5 | **Módulo 2 · Data** | Mesmo cartão. Cartão de origem (`padding 12`, raio 12, branco): ícone `database` azul + «Origem: Data da foto (EXIF)» + selo «Válido». «Formato de carimbo» em **grade de 2 colunas** `gap 8`, botões `padding 10`, raio 12, mono 11, ativo preto/branco (13 formatos, DV-05). Separador `. / -` segmentado. Caixa «Ocultar se ausente» |
| 6 | **Módulo 3 · Local** | Mesmo cartão. Origem: ícone `my_location` + «GPS local no aparelho» + selo «Automático · Aproximado». Componentes Cidade / Estado / País em 3 linhas (rótulo mono caixa alta + valor). «Formato de saída: “Cidade, Estado”». Aviso de privacidade (ícone `shield` azul + «Cidade identificada, nunca coordenadas brutas. Processamento 100% no seu dispositivo.») |
| 7 | **Posição no quadro** | Título mono 11 caixa alta + segmentado de 3 colunas: Abaixo · Acima · Ambas (ícone 16 + texto, `padding 10×12`, raio 12) |
| 8 | **Proteção de lote** | Caixa `#F8F9FA`, raio 12, `padding 14`: caixa de marcar 20×20 **desmarcada** + «Replicar estilo para as demais 23 fotos» (Inter 12/500) + ajuda «Mantém textos individuais, padroniza fonte e posição» (**13**, não 10) |
| 9 | **Pé de ação** | `padding-top 12`, `flex gap 12`: «Copiar estilo» (secundário, ícone `content_copy`) + «Aplicar legendas» (**secundário**; o único LED da tela é «Revisar impressão», DV-18) |

Os blocos 4 a 6 se repetem em desenho nas outras abas: cartão `#F8F9FA` com cabeçalho (ícone + título + interruptor), campos de 44 de altura e ajuda abaixo.

### 4.2 Tablet 834
Trilho vira coluna de ícones (72). Inspetor desliza da direita, recolhível, ≈360 px, cobrindo no máximo 40% da folha. Faixa do lote embaixo. Margens 24. (HTML silente: vale este texto.)

### 4.3 Celular 390
Sem trilho. No topo: `Logo_tipografia_lateral.png` e «⋯»; abaixo, **pílula de modos** (Folhas · Quadro · Colagem). Prévia primeiro; painel inferior arrastável (25%, 50%, 85%) com as abas do inspetor. Barra fixa «Revisar impressão» dentro da área segura. Legendas e Local em folha de ações em tela cheia («Concluir»). **A página nunca rola na horizontal**; a faixa do lote e o carrossel de estilos rolam só dentro do seu contêiner, e os estilos prontos quebram em 2 linhas (DV-33 `[VALIDAR]`). (HTML silente: vale este texto.)

## 5. Componentes (lista canônica; anatomia do E1)

**Prancha E1:** cabeçalho em cartão branco (raio 14, `card`, borda 4%, `padding 24–32`) seguido de grade de 12 colunas `gap 32` com 7 módulos: 01 Botões e LED · 02 Caixas de decisão e pop-ups · 03 Controles numéricos e seletores · 04 Interruptores e caixas · 05 Chips de escopo e selos · 06 Navegação e fontes · 07 Feedback e barras. Cada módulo é um cartão branco, raio 14, `card`, `padding 24–32`, com número, título e linha de apoio. **Corrigir:** títulos e rótulos de prancha em Inter 400–500; sem «Etapa E1», «Regra Imutável», «Sombras Táteis Orgânicas» (DV-24).

| Componente | Anatomia (E1) |
| --- | --- |
| **Campo numérico** | Altura **44**, raio 12; botões − e + 44; unidade («mm») dentro do campo; botão ✕ opcional; ajuda abaixo («O valor não pode ser negativo. Limite físico mínimo: 0 mm.»); erro = borda preta 2 px + ✕ |
| **Select** | Altura 44, ícone `expand_more`; item no padrão «A4 (210 × 297 mm) — Recomendado (4 por folha)» (DV-06) |
| **Segmentado (2 e 3)** | Trilho `#F8F9FA`, raio 12, `padding 4`; opção com ícone + texto; **ativa = preto + branco** (DV-20) |
| **Formato da polaroid** | Opções com nome pt-BR (Clássico, Mini quadrado…), não «Pocket / Classic / Square» (DV-08) |
| **Deslizador** | Valor digitável; marcas 100% · 165% · **400%** (o E1 mostra 300, DV-07) |
| **Interruptor** | **44×24**, raio 999, `padding 2`. Ligado: fundo `#006194`, thumb 20 branco com sombra 0 2 6 / 18%, justificado à direita, sombra interna 0 1 3 / 12%. Desligado: fundo `#F8F9FA` com borda 8%. Desabilitado: branco, tracejado 1 px, opacidade 60%, thumb 18 |
| **Caixa de marcar** | 20×20, raio 4; ligada = azul com ✓ branco; começa **desmarcada** em «Replicar» e «Substituir ajustes individuais» |
| **Chip de escopo** | §4.1.1 bloco 2 |
| **Selos de qualidade** | Cartão com ícone + selo + frase: ✓ Boa · 326 PPI (`verified`) · ! Abaixo do ideal (`warning`) · ▲ Com ressalvas (`report_problem`) · ✕ Ruim (`cancel`). Sem cor de estado (DS-06) |
| **Selos neutros** | Pílulas `#F8F9FA`, mono 11: Automático · Aproximado · Misto · Ajustada · Convertida |
| **Abas mono** | Plex Mono 11 caixa alta; ativa = azul + sublinhado 2 px |
| **Sanfona** | Cabeçalho 44 + `expand_more`; no E1 chama-se «Parâmetros de Lâmina e Guilhotina»: renomear **«Guias»** (extensão para margens 5,00 mm; espessura 0,10 mm) |
| **Seletor de fonte de legenda** | Cartões com amostra na própria fonte + categoria em mono; busca, abas, favoritas, recentes (DOC-02 §4) |
| **Mensagens** | **Informação:** cadeado azul, borda 1 px · **Atenção:** barra lateral laranja 4 px + ícone `priority_high` + texto · **Erro:** borda preta 2 px + ✕ + texto · **Sucesso:** borda preta 1 px + ✓ azul + «Concluído» (DS-06) |
| **Toast** | Fundo **branco**, texto preto, anel LED nível 1, `shadow-floating`: ícone + «6 folhas → 5 folhas» + «Desfazer». O E1 mostra toast preto: corrigir (DV-17, D-023) |
| **Tooltip, menu, popover** | Branco, anel LED nível 1, raio 8 |
| **Caixa de decisão (nível 2)** | Raio 14, anel 1,5 px. Estrutura: ícone `verified` + título «Tudo pronto para o papel?» (Inter 22/300) + frase + **grade de 3 dados** separados por divisores 8% (Total de folhas · Disposição · Aproveitamento) + ações («Voltar e ajustar» secundário, «Gerar PDF (6 folhas)» LED). Acrescentar as severidades do BR-13 (DV-32). Remover o selo «Nível 2 · Resumo de Produção» |
| **Pop-up (nível 3)** | Raio 14, anel 2,5 px, película branca 80% + desfoque. Ex.: «Ativar guias desliga o contorno?» com ações «Manter contorno» e «Ativar guias» (LED). Remover «Regra de Produção 4.4» e «Invariante garantido» |
| **Barras de carregamento** | Indeterminada («Aguarde…») e determinada («18 de 24 fotos · 75% concluído»); receita no §11.5 |
| **Polaroid de exemplo** | Branca, assinatura no canto inferior esquerdo da faixa inferior, legenda em fonte do catálogo |
| **Cartão de conexão** | Branco, `shadow-card`, ícone do serviço + nome, selo de estado (ícone + texto), ação à direita |
| **Linha de verificação** | Ícone (✓, !, ✕, relógio) + rótulo + detalhe curto, 44 px |
| **Cartão de sugestão** | Prévia + **frase de design** (EXC-3) + «Usar esta» (secundário) |
| **Cartão de lembrança** | Prévia no formato final (9:16, 4:5, 1:1) + legenda do post + «Compartilhar» / «Baixar imagem» |

## 6. GUIADO (decida dentro dos limites)

- **Composição das telas:** pode reordenar seções do inspetor, desde que as abas, o chip de escopo e o pé de ação existam.
- **Ilustração e imagens:** fotos reais de exemplo (sem rostos sobre texto) ou polaroids em branco; sem ilustrações coloridas fora da paleta.
- **Microinteração:** pode propor animações de 150–350 ms que respeitem `prefers-reduced-motion`.
- **Densidade:** pode compactar o inspetor no celular desde que os alvos fiquem ≥ 44 px.
- **Páginas públicas:** espaços e tamanhos dentro das faixas do §12.

## 7. LIVRE

Composição do lado direito do hero em desktop, ilustração de estados vazios, textos de marketing além dos fornecidos pelo dono (§12), ritmo visual, enquadramento das fotos de exemplo, estados vazios com personalidade. Tudo respeitando DS-01 a DS-17 e DOC-02.

## 8. Acessibilidade

WCAG 2.2 AA. Foco por teclado em tudo, ordem lógica, atalhos documentados (DOC-05 FN-12). Contraste: texto preto sobre branco (ou branco sobre preto na faixa escura); texto leve (peso 300) só a partir de 16 px (TP-04). `aria-live` para toasts e contador de folhas. Cada polaroid é `<figure>` com `<figcaption>`; data em `<time>`. `forced-colors`: caixas e botões LED viram borda sólida do sistema (já no CSS).

## 9. Do protótipo para a produção (conserte ao implementar)

| Item no HTML ou CSS | Problema | Correção |
| --- | --- | --- |
| Tailwind CDN, Google Fonts e Material Symbols por link | Contraria «nada de terceiros antes do clique» (DOC-09) e a CSP | Compilar Tailwind; **hospedar** fontes e ícones (subconjunto) |
| Inter 500–700, botões 700, título de pop-up 600 (CSS) | Fora da tipografia leve | Aplicar DOC-02 |
| `error: #ba1a1a` e `error-container` no Tailwind | Vermelho proibido (DS-01) | Remover; erro = borda preta 2 px + ✕ |
| Rótulos «ETAPA E4 · MOTOR FOTO · V2.4», «Regra de Produção 4.4», «Cardstock 300g · Borda Quente», «alinhamento de guilhotina calibrado» | Jargão interno ou promessa que o produto não cumpre | Remover da interface; ficam só na documentação |
| Aba «Corte» no inspetor | Ambígua | «Recorte» (foto) e «Guias» (papel) |
| Tokens Material (`surface-container-high` etc.) | Cinzas fora da paleta | Manter só os tokens do §2 |
| Logo por URL externa | Dependência de terceiro | Arquivos locais do §13 |
| Marcas de canto e selo «#03 · 14.07.26» sobre a foto | Viola DS-08 | Remover |
| Anel LED feito com `bg-gradient` + `p-[2px]` | Duplica e diverge do CSS | Usar `.led-btn` / `.led-box` (§11) |
| Ajustes do `polar-led.css` v4 | Ver §11.7 | Aplicar os 6 ajustes |

## 10. Aceite do documento

Uma tela está conforme quando: usa só as 4 cores (+ `#F8F9FA`); tem no máximo 1 botão LED feito com `polar-led.css`; toggles ligados são azuis; chip de escopo visível; moldura branca com assinatura fora da foto; alvos ≥ 44; sem rolagem horizontal da página no celular; logos só pelo mapa do §13. Checklist completo: DOC-11 §4.

---

## 11. Sistema LED (receita do `polar-led.css` v4)

> **Regra.** O LED é um **anel de gradiente** (laranja → branco → azul) em volta de um **miolo sólido**. Existem 3 níveis e 2 variantes de botão. Tudo sai das classes abaixo; nada é desenhado à mão (DS-16). O arquivo `polar-led.css` é a fonte; este capítulo é a receita e as correções de produção.

### 11.1 Técnica (como o anel é feito)

Duas camadas de fundo com a borda transparente:

```css
border: var(--ring) solid transparent;
background-image: linear-gradient(var(--core), var(--core)), var(--grad);
background-origin: border-box;
background-clip: padding-box, border-box;   /* miolo no padding, gradiente na borda */
box-shadow: var(--halo);
```

O miolo (`--core`) é **sólido** (branco ou preto). O gradiente aparece só na espessura da borda. Não usar `outline` nem `box-shadow` para o anel.

### 11.2 Variáveis

| Variável | Valor | Papel |
| --- | --- | --- |
| `--led-gradient-h` | `linear-gradient(90deg, #FD761A 0%, #FFF 50%, #006194 100%)` | Botões e caixas largas e baixas (`.led-box--wide`) |
| `--led-gradient-d` | mesmo, a `135deg` | Caixas, pop-ups, menus |
| `--led-ring-1 / -2 / -3` | 1 px · 1,5 px · 2,5 px | Espessura por nível |
| `--led-halo-1` | nenhum | Nível 1 |
| `--led-halo-2` | `-4px 3px 10px rgb(253 118 26/.14), 4px -2px 10px rgb(0 97 148/.14)` | Nível 2 |
| `--led-halo-3` | `-6px 4px 14px rgb(253 118 26/.20), 6px -3px 14px rgb(0 97 148/.20)` | Nível 3 |
| `--btn-h` / `--btn-r` | **52** / **12** (produção; o CSS traz 56 / 8) | Botão |
| `--r-box` | **14** para níveis 2 e 3; **8** para nível 1 (o CSS traz 8 para todos) | Caixas |

### 11.3 Os 3 níveis

| Nível | Anel | Halo | Raio | Classe | Uso |
| --- | --- | --- | --- | --- | --- |
| **1** | 1 px | nenhum | 8 | `.led-box--1`, `.led-pop`, `.led-menu` | Menus, popovers, tooltips, **toast** |
| **2** | 1,5 px | leve | 14 | `.led-box--2` (padrão de `.led-box`) | Caixas de decisão: resumo de pré-voo, decisão em lote, opção recomendada, **login** (até 2 por tela) |
| **3** | 2,5 px | completo | 14 (pop-up) · 12 (botão) | `.led-dialog` + `.led-scrim`, `.led-btn` | Pop-ups e botão principal |

**Pop-up:** `.led-scrim` (película branca 80% + desfoque 2 px, `z-index 900`) + `.led-dialog` (`z-index 901`, centralizado, `width min(560px, 100vw − 32px)`, `max-height 100vh − 48px`, `padding 24`, entrada 200 ms de `scale(.98)`). Título Inter 22/300 (`.led-dialog__title`). Ações à direita, `gap 12`, `margin-top 24`, filete superior **a 8%** (`.led-dialog__actions`).

### 11.4 Botão LED

```html
<button class="led-btn">
  <span class="smoke-layer" aria-hidden="true"></span>
  <span class="btn-content">Gerar PDF</span>
  <span class="led-btn__bar" aria-hidden="true"></span>
</button>
```

| Classe | Efeito |
| --- | --- |
| (padrão) | Miolo preto, texto branco, anel 2,5 px com gradiente horizontal, halo nível 3, `padding 0 28`, Inter **500** 15, espaçamento 0,01 em |
| `.led-btn--light` | Miolo branco, texto preto (pop-up, faixa escura, «Começar agora») |
| `.led-btn--sm` | Altura 42 (produção; o CSS traz 44), `padding 0 20`; área de toque 44 |
| `.led-btn--block` | Largura total (celular) |

| Estado | Comportamento |
| --- | --- |
| **Repouso** | Como acima |
| **Hover** (só `@media (hover:hover)`), **foco** (`:focus-visible`) e `.is-hover` | **Névoa líquida** (`.smoke-layer`): fundo laranja + 5 camadas (véu branco 30%, três manchas brancas e uma azul 65%, mancha laranja 95%), `background-blend-mode: screen`, opacidade 0→1 em 350 ms, movimento `smoke-move` de **6 s** em *alternate*; texto passa para **preto**. O anel externo é preservado |
| **Foco** | Além da névoa: `outline 2px solid #006194`, `offset 3px` |
| **Ativo** | `scale(.98)` |
| **Carregando** (`aria-busy="true"`) | Sem névoa e sem halo; miolo branco, texto preto; `pointer-events: none`; barra de 3 px (`.led-btn__bar`) deslizando na base, `left/right 16`, `bottom 6` |
| **Desabilitado** (`:disabled` / `aria-disabled`) | Sem anel LED, sem névoa, borda **tracejada 1 px preta**, fundo branco, `cursor: not-allowed` |
| **Movimento reduzido** | Sem transição; névoa estática (`background-position: 50% 50%`); barras cheias, sem animar |
| **Contraste forçado** | Borda sólida `ButtonText`, sem névoa |

### 11.5 Barras de carregamento

```html
<div class="led-progress" role="progressbar" aria-label="Carregando">
  <span class="led-progress__glow"></span>
  <span class="led-progress__track"><span class="led-progress__fill"></span></span>
</div>
```

Altura 8 (`--thin` 4). Trilho branco, raio 999, borda (8%, ver §11.7). Preenchimento com `--led-gradient-h`, `width 40%`, animação `led-slide` 1,4 s. Brilho (`__glow`) com `blur(8px)` e opacidade 55%. **Determinada:** `.led-progress--determinate` + `style="--value:75"` + `aria-valuenow/min/max`; a largura anima em 300 ms. **Página:** `.led-progress--page` (fixa no topo, 3 px, sem brilho, sem borda).

### 11.6 Onde o LED entra (resumo do DS-04)

| Entra | Não entra |
| --- | --- |
| 1 botão principal por tela (`.led-btn`) | Interruptor, caixa de marcar, deslizador, segmentado, aba, chip, campo |
| Pop-ups, menus, popovers, tooltips, **toast** | Botão secundário, terciário, destrutivo |
| Até 2 caixas nível 2 por tela | Cartões comuns, mesa, inspetor, cabeçalho, trilho |
| Barras de carregamento | Selos de qualidade, mensagens |

Dois botões LED na mesma tela são violação (o E4b tem dois: DV-18). No editor, o único LED fixo é «Revisar impressão».

### 11.7 Ajustes de produção no `polar-led.css` v4 (fecham P12, C-24, C-32, C-42)

| # | Linha do CSS | Hoje | Passa a ser | Motivo |
| --- | --- | --- | --- | --- |
| 1 | `--btn-h`, `--btn-r`, `.led-btn--sm` | 56 · 8 · 44 | **52 · 12 · 42** | D-058, C-42, DV-36 |
| 2 | `--r-box` | 8 | **14** (níveis 2 e 3) e 8 (nível 1) | E1: `.led-box-decision` e `.led-dialog-frame` usam 14 (DV-37) |
| 3 | `.led-btn` `font` | `700` | **`500`** | TP-02, D-058 (DV-39) |
| 4 | `.led-dialog__title` | `600 20px` | **`300 22px`** | TP-02, DOC-02 §2 (DV-39) |
| 5 | `.led-box--dark` (toast preto) | existe | **Não usar no toast**: toast = `.led-box--1` com miolo branco. A variante só vale dentro da faixa escura (§12) | D-023 (DV-38) |
| 6 | `.led-dialog__actions` e `.led-progress__track` | borda `1px solid #000` | **`1px solid rgb(0 0 0/.08)`** | DS-02 (DV-40) |

Resto do arquivo (gradientes, anéis, halos, névoa, barra, `prefers-reduced-motion`, `forced-colors`) vale sem mudança.

---

## 12. Páginas de apresentação e login (referência: capturas do Figma)

Aplica-se a **T-28 Apresentação** e **T-25 Entrar** (e, por herança, T-29 Como funciona). As capturas definem **composição, ritmo e hierarquia**. Os pesos tipográficos das capturas (≈700–800) **não valem**: usar DOC-02 (Inter ≤ 500). O texto das capturas foi fornecido pelo dono e é o texto de referência `[RECOMENDADO]` até ele revisar.

### 12.1 Apresentação (T-28) · `Screenshot_20261106_150659_Figma.jpg`

**Celular 390** (fundo branco, margens laterais **24**):

| Ordem | Elemento | Especificação |
| --- | --- | --- |
| 1 | **Cabeçalho** | Altura **72**, branco, `Logo_tipografia_lateral.png` altura **40** à esquerda, filete inferior **8%** (a captura mostra preto pleno: DV-44) |
| 2 | **Respiro** | 80 px entre o cabeçalho e o rótulo |
| 3 | **Rótulo (eyebrow)** | Traço laranja 24×2, `gap 12`, texto Inter 12/500, caixa alta, espaçamento 0,2 em, preto: «SUAS FOTOS MERECEM O MUNDO REAL» |
| 4 | **Título (EXC-4)** | `margin-top 32`. Inter **500**, 52/52 (faixa 44–56 no celular), espaçamento −0,04 em, preto, 4 linhas: «Algumas memórias merecem sair **da tela.**». A expressão destacada vai em **Caveat 500, azul `#006194`**, mesmo corpo, incluindo o ponto final. Só **uma** palavra ou expressão curta (até 2 palavras) em azul (DV-43) |
| 5 | **Texto de apoio** | `margin-top 32`. Inter 400, 18/1,6, preto: «Transforme os momentos que vivem no seu celular em polaroids feitas para tocar, presentear e guardar por muitos anos.» |
| 6 | **Chamada principal** | `margin-top 40`. **Botão principal claro** (`.led-btn--light .led-btn--block`), altura 52: «Criar minhas polaroids →» (`arrow_forward`). É o **único LED** da tela |
| 7 | **Link** | `margin-top 48`. Terciário (preto, sublinhado), Inter 500 18, ícone `arrow_downward` 20: «Ver como funciona» (rola até T-29) |

A barra inferior da captura («Início · Editor · Referências» com sublinhado azul) **não** é adotada: é a moldura do protótipo, e «Referências» não existe no produto (DV-46, `[VALIDAR P27]`).

**Desktop 1440** `[RECOMENDADO]`: cabeçalho 72 com `Logo_tipografia_lateral.png` à esquerda e, à direita, «Entrar» (terciário, 2.0) + botão principal claro compacto; hero em duas colunas (texto 7/12 · composição de polaroids em `shadow-polaroid` e `lifted` 5/12, LIVRE); título 72–96 px; largura máxima 1280.

### 12.2 Login (T-25) · `Screenshot_20261106_150718_Figma.jpg`

A captura é o **banner de login (EXC-5)**: faixa escura sobre foto. O formulário vem logo abaixo.

**Celular 390** (de cima para baixo):

| Ordem | Elemento | Especificação |
| --- | --- | --- |
| 1 | **Foto de topo** | Largura total, sem raio, proporção **3:2** (≈ 390×260). Foto real de polaroids sobre mesa, **sem rostos** (só mãos). `[PENDENTE J4]` licença; a foto da captura é só referência |
| 2 | **Faixa escura (DS-17)** | Fundo `#000000`, `padding 56 24 40`, texto branco |
| 3 | **Rótulo** | Traço laranja 24×2 + Inter 12/500 caixa alta, 0,2 em, **branco**: «NÃO DEIXE PARA DEPOIS» |
| 4 | **Título (EXC-5)** | `margin-top 32`. Inter **500**, 44/44, −0,04 em, branco: «Seu rolo de câmera está cheio de histórias.» Pode destacar uma expressão em fonte expressiva curada (DOC-02 §5), na cor branca ou laranja `#FD761A` (azul `#006194` não tem contraste sobre preto) |
| 5 | **Apoio** | `margin-top 32`. Inter 400 18/1,6, branco: «Escolha algumas hoje. Um dia, segurar essas fotos vai significar ainda mais.» |
| 6 | **Formulário** | Bloco branco logo abaixo da faixa, `padding 24`: **caixa de decisão nível 2** (`.led-box--2`, raio 14) com, em ordem: «Continuar com Apple» · «Continuar com Google» (**ativos oficiais**, mesmo peso visual, CN-07) · divisor «ou» (filete 8%) · campo **E-mail** (rótulo persistente, 44) · **botão LED** «Enviar código» (`.led-btn--block`) · linha com «Privacidade» e «Termos» (terciário). Etapa seguinte: campo do código de 6 dígitos |
| 7 | **Estados** | Código errado e código expirado: mensagem de erro (borda preta 2 px + ✕ + texto) abaixo do campo; envio em curso: botão `aria-busy` |

**A chamada «Começar agora →» da captura NÃO fica na faixa escura do login**: ali ela seria um segundo LED (DS-04). Ela existe como principal claro nas páginas T-28 e T-29. No login, o único LED é «Enviar código».

**Desktop 1440** `[RECOMENDADO]`: divisão 50/50. Esquerda: faixa escura em altura total, com a foto no topo (60%) e o texto sobre `#000`. Direita: coluna branca com `Logo_tipografia_lateral.png` no topo, a caixa nível 2 centralizada (largura 440) e o rodapé legal. **Pop-up «Entrar»** do portão (DOC-03 §4): mesmo formulário, dentro de `.led-dialog`, **sem** a faixa escura.

**Textos que o dono não forneceu** (títulos do formulário, ajuda do código, mensagens de erro): `[PENDENTE microcopy]`; não inventar, usar as mensagens do DOC-04 §5.

### 12.3 Regras comuns às duas páginas

1. Margens laterais **24** no celular; grade de 8 px (80 · 32 · 32 · 40 · 48 entre blocos).
2. Hierarquia fixa: rótulo → título → apoio → chamada → link. Nada fora dessa ordem.
3. Títulos: Inter 500 (nunca 600/700); a expressão destacada em fonte curada (TP-03, EXC-4/5).
4. LED: um por tela (DS-04). Na faixa escura, o botão é `.led-btn--light`.
5. Logos só sobre fundo branco ou `#F8F9FA` (§13). Na faixa escura **não há logo**.
6. Foto de capa: real, sem rostos sobre texto, sem marca de terceiro, sem ilustração colorida (§6).
7. Nada de CDN, nada de terceiros antes do clique (T6).

---

## 13. Logos: onde cada arquivo entra (usar o nome exato)

| ID | Nome do arquivo | Conteúdo | Pixels · proporção | Onde entra |
| --- | --- | --- | --- | --- |
| **LOGO-H** | `Logo_tipografia_lateral.png` | Emblema (flor laranja em quadrado azul) **à esquerda** + «POLAR / LIFE» empilhado à direita. É o **logo horizontal** | 2137×736 · 2,90:1 | **(1)** Cabeçalho do editor, altura 32 (§4.1). **(2)** Cabeçalho das páginas públicas e do login, altura 40 (§12). **(3)** **Assinatura PolarLife** dentro da moldura, canto inferior esquerdo da faixa inferior, em polaroid, colagem, lembrança, PDF, PNG e JPEG (DS-10, BR-05; a proporção 2,9:1 do DOC-03 §7 é a deste arquivo). **(4)** Cabeçalho no celular (§4.3). **(5)** Topo da coluna do formulário de login em desktop |
| **LOGO-V** | `logo_oficial_PolarLife.png` | Emblema **no alto** + «POLAR / LIFE» empilhado **embaixo**. É o **logo vertical** | 1353×1163 · 1,16:1 | Estados vazios grandes: Home vazia (T-01), T-31, página 404 · rodapé das páginas públicas e legais (altura 96) · tela de abertura do app (carregando) · e-mails transacionais (2.0). **Nunca** no cabeçalho nem como assinatura |
| **LOGO-E** | `Logo_favicon_PolarLife.png` | **Só o emblema** (flor em quadrado azul), sem texto | 4372×3904 · 1,12:1 | Favicon e ícone de «Adicionar à Tela de Início» (exportar quadrado, `[PENDENTE P28]`) · trilho recolhido de 72 px (altura 32) · avatar do projeto em cartões da Home · selo de carregamento pequeno (≤ 48). **Nunca** ao lado do texto «PolarLife» (já está no LOGO-H) |
| **LOGO-T** | `logo_tipografia_PolarLife.png` | **Só o texto** «POLAR / LIFE» empilhado (azul e laranja), sem emblema | 4226×2198 · 1,92:1 | Composição em que o emblema já aparece grande ao lado ou acima (ex.: rodapé com `Logo_favicon_PolarLife.png` + este texto, capa de «Como funciona»). Não substitui o logo horizontal em nenhum cabeçalho nem como assinatura |

**Regras de uso (DS-15):**

1. **Escolha pelo lugar, não pelo gosto.** Cabeçalho = LOGO-H. Assinatura = LOGO-H. Estado vazio e rodapé = LOGO-V. Favicon e trilho recolhido = LOGO-E. LOGO-T só em composição.
2. **Fundo:** só sobre `#FFFFFF` ou `#F8F9FA`. Sobre faixa escura, foto, azul ou laranja: **não usar** (não há versão branca ou monocromática, `[PENDENTE P29]`). A assinatura nunca tem esse problema porque fica dentro da moldura branca.
3. **Proporção:** sempre a original; definir só a altura e `width: auto`. Nunca esticar, cortar, girar, recolorir, aplicar sombra ou contorno.
4. **Altura mínima na tela:** LOGO-H 24 · LOGO-V 56 · LOGO-E 16 · LOGO-T 32 `[RECOMENDADO]`. Na impressão, a assinatura segue o `k` do DOC-03 §7 `[PENDENTE P2]`.
5. **Área livre** em volta: ¼ da altura do logo, sem texto nem borda.
6. **Hospedagem:** copiar os arquivos para o projeto **com o mesmo nome** (ex.: `/assets/brand/Logo_tipografia_lateral.png`). Nunca por URL externa (T6, DV-27). Os arquivos são PNG com transparência; `[PENDENTE P30]` versão vetorial (SVG).
7. **Texto alternativo:** `alt="PolarLife"` nos LOGO-H, LOGO-V e LOGO-T; o LOGO-E é decorativo (`alt=""`) quando acompanhado do nome.
8. **Cores dos arquivos ≠ tokens.** Medido nos PNG: azul ≈ `#004880` (LOGO-E, LOGO-V), `#003860` (LOGO-H, mais escuro), `#004878` (LOGO-T); laranja ≈ `#F85800`–`#F86000`. Os tokens da interface são `#006194` e `#FD761A`. **Não recolorir os logos para casar**, e não usar a cor do logo na interface. `[PENDENTE P11]` padronizar as cores dos 4 arquivos.

---

## 14. Fontes de cada decisão deste documento

| Decisão | Origem |
| --- | --- |
| Medidas do §4 e §5 | E4b e E1, convertidas de Tailwind para px; correções = DOC-12 §3 (DV-xx) |
| Receita do LED (§11) | `polar-led.css` v4 + E1 (raios e `led-box-decision`); ajustes = DV-36 a DV-41 |
| Páginas do §12 | `Screenshot_20261106_150659_Figma.jpg` e `Screenshot_20261106_150718_Figma.jpg`; correções = DV-42 a DV-46 |
| Mapa de logos (§13) | Nome do arquivo no `alt` do E4b (`Logo_tipografia_lateral.png` no cabeçalho), DOC-03 §7 (proporção 2,9:1), DS-10; demais usos = `[RECOMENDADO]` |
| Novas decisões D-066 a D-071 | DOC-12 §3.5 |
