---
id: DOC-11
titulo: PolarLive · Bloco mestre, prompts por etapa e checklist anti-desvio
edicao: 2
data: 2026-11-07
status: vigente
depende_de: [DOC-01, DOC-02, DOC-04, DOC-05, DOC-06, DOC-07]
---

# Prompts de telas

> **TL;DR para humanos.** Em todo projeto novo de IA de design anexe **DOC-00, 01, 02** e os dois HTMLs, cole o **Bloco Mestre** (§1) e depois o prompt da etapa (§3). **1 etapa = 1 assunto = 4 a 6 telas.** Tela aprovada não se regenera: usa-se o prompt de revisão (§5). No fim de cada etapa, rode o checklist (§4).

## 1. Bloco Mestre (colar no início de TODO prompt)

```
PAPEL: Você é designer de produto sênior do PolarLive, um editor web local-first para criar
polaroids, imprimi-las em folhas e compartilhá-las como colagens e lembranças.

FONTES DE VERDADE (anexas): DOC-01 design, DOC-02 tipografia, DOC-04 telas, e os HTMLs E1
(componentes) e E4b (layout). Cite o ID da regra quando decidir (ex.: DS-04).

FIXO — não altere:
1. 4 cores: #FFFFFF, #000000, #006194, #FD761A; exceção #F8F9FA. Sem outros cinzas, sem
   vermelho nem verde. Bordas = preto 4% ou 8%.
2. Fundo branco; elevação por sombras (subtle, card, floating, polaroid, lifted). Raios 14/12/8.
3. Tipografia LEVE: Inter 300–500, Cormorant Garamond (títulos editoriais), IBM Plex Mono
   (medidas, 11 px, caixa alta). NUNCA peso 600/700. Peso 300 só em ≥ 16 px.
4. Fontes expressivas SÓ em 5 zonas: banners, legendas das polaroids (várias opções do
   catálogo), frases de sugestão de design, frase da tela de apresentação, banners do login.
5. LED (laranja→branco→azul): 1 botão principal por tela, pop-ups (inclui menu, tooltip,
   toast) e até 2 caixas de decisão. Nunca em controles.
6. Seleção e foco = anel azul 2 px. Toggle e checkbox ligados = azul, thumb e ✓ brancos.
7. Nada só por cor: ícone + rótulo + valor. Erro = borda preta 2 px + ✕. Sucesso = borda
   preta 1 px + ✓ azul + «Concluído».
8. Alvos ≥ 44 px; grade de 8 px; português do Brasil simples.
9. Nada impresso sobre a foto. Moldura sempre branca; assinatura (logo horizontal) no canto
   inferior esquerdo da faixa inferior.
10. Chip de escopo visível em toda edição. Guias de corte e contorno: dois interruptores;
    guias ligadas ⇒ contorno desabilitado.
11. Vocabulário: Recorte (foto) ≠ Guias de corte (papel); Folha ≠ Colagem ≠ Lembrança.
12. Layout: cabeçalho 64, trilho 256, mesa 7/12, inspetor 5/12 (desktop 1440); inspetor
    deslizante (tablet 834); prévia primeiro e painel inferior (celular 390).

GUIADO: escolha composição, ordem de blocos e microinterações dentro dessas regras.
LIVRE: ilustração, microcopy, ritmo visual, layouts de colagem e páginas públicas.

NÃO FAÇA: inventar telas, modelos, textos de marca ou funções fora do pedido; usar dados
diferentes dos de exemplo (DOC-04 §6); regenerar telas aprovadas.

ENTREGA: as telas pedidas, uma lista de 3 a 6 linhas com suposições e, ao fim, as violações
do checklist (só se houver).
```

## 2. Como escrever bem um prompt de etapa (modelo)

```
ETAPA: [código e nome]
TELAS: [IDs do DOC-04, dispositivos]
OBJETIVO DO USUÁRIO: [1 frase]
USE: [componentes e IDs de regra]
ESTADOS: [lista do DOC-04 §4]
DADOS: exemplo fixo
ACEITE: [3 a 5 critérios verificáveis]
```

Boas práticas: **uma intenção por prompt**; critérios **verificáveis** (número, estado, regra); **referências por ID** em vez de repetir texto; **o que fazer** antes de o que evitar; liberdade explícita onde ela existe.

## 3. Roteiro por etapa

| Etapa | Assunto | Telas | Depende de |
| --- | --- | --- | --- |
| E0 | Preparação | 0 | — |
| E1 | Componentes (incl. novos) | 1 prancha | E0 |
| E2 | Editor · Modo Folhas | T-07 (D T C) | E1 |
| E3 | Editor · Modo Quadro | T-08 (D C) | E2 |
| E4 | Inspetor: Papel, Legendas, Ajustes, Molduras/Medidas, Metadados, Lote | T-09 a T-14 | E3 |
| E5 | Importação e resumo | T-03 a T-06 | E2 |
| E6 | Pré-voo e saída | T-18 a T-22 | E4 |
| E7 | Conexões | T-23, T-24 | E5 |
| E8 | Colagem, sugestões e lembranças | T-15 a T-17 | E4 |
| E9 | Home e novo projeto | T-01, T-02 | E3 |
| E10 | Marketing e login | T-25, T-28, T-29 | E1 |
| E11 | Legal | T-30 | E1 |
| E12 | Estados | T-31 | E2 |
| E13 | Verificação final | 0 | todas |

**E0 · Preparação (sem telas)**
```
Leia DOC-00, 01, 02 e os dois HTMLs. Confirme em 8 linhas: as 4 cores e a exceção #F8F9FA;
onde o LED entra; a regra guias × contorno; toggle azul; tipografia leve e as 5 zonas
expressivas; layout 64/256/7-5; moldura branca com assinatura; vocabulário Recorte × Guias.
Não gere telas.
```
**Aceite:** repete as regras corretamente; se errar, reenviar os anexos.

**E1 · Componentes (1 prancha 1440)**
```
Prancha «Componentes do editor» com repouso, hover, foco, selecionado, desabilitado e erro:
campo numérico com unidade, select, interruptor e caixa (azuis), segmentado, deslizador, chip
de escopo, selos de qualidade e neutros, abas mono, sanfona, seletor de fonte de legenda com
categorias, busca, favoritas e amostra, seletor de formato de data, mensagens (4 tipos),
toast, tooltip, item de pré-voo (3 severidades), polaroid com assinatura, botões (todos os
estados), barras de carregamento, E OS NOVOS: cartão de conexão (todos os estados do DOC-07),
linha de verificação, cartão de sugestão com frase de design (fonte expressiva), cartão de
lembrança. LED só no botão principal, num pop-up de exemplo e em 1 caixa.
```
**Aceite:** nenhum peso > 500; interruptores azuis; erro sem vermelho; fonte expressiva só na amostra de legenda e na frase do cartão de sugestão.

**E2 · Editor · Modo Folhas (3 telas)**
```
«Editor · Modo Folhas» em 1440, 834 e 390 (projeto Viagem · Serra 2026), conforme E4b e
DOC-01 §4. Aba PAPEL com os campos do DOC-05 FN-01; Guias LIGADO e Contorno DESABILITADO
com a linha de apoio; Assinatura LIGADA; chip «Alterando: Todas as fotos · 24»; botão
«Aplicar ao lote · 24 fotos». Folha A4 com 4 polaroids brancas, assinatura e guias até a
borda. Único LED: «Revisar impressão».
```
**Aceite:** 4 por folha; guias passam das polaroids; contorno desabilitado; trilho com 4 itens.

**E3 · Editor · Modo Quadro (2 telas)**
```
«Editor · Modo Quadro» Foto 3 de 24 (Dia de rolê, ajustada), desktop e celular. Barra de
recorte, selo «Boa · 326 PPI», polaroid grande com legenda, data/local e assinatura, faixa do
lote (#01…#24), aba AJUSTES com recorte, endireitar, realces, sombras, nitidez e vinheta.
Chip «Alterando: só esta foto»; «Replicar para as demais» DESMARCADA.
```

**E4 · Inspetor (uma tela por prompt)**
```
E4a PAPEL e linhas (FN-01, FN-02): 3 estados do grupo (guias / contorno / sem linhas), pop-up
«Ativar guias desliga o contorno?», toast «6 folhas → 5 folhas · Desfazer».
E4b LEGENDAS (FN-07): 3 seções (texto, data, local); SELETOR DE FONTE com categorias, busca,
favoritas, recentes e amostra na própria fonte; posição acima/abaixo/ambas; deslocamento
fino e inclinação; 8 estilos prontos; cores preto, azul, laranja; «Aplicar legendas».
E4c AJUSTES e FILTROS (FN-05, FN-06): 12 filtros com a foto atual, «Sugerido para esta foto»,
Favoritos, Comparar, «Ver original».
E4d MOLDURAS e MEDIDAS (FN-03): réguas, unidades mm/cm/pol, cota do passe-partout, cadeado;
sem cor de moldura.
E4e METADADOS (FN-08): leitura, 3 campos, «somar/subtrair horas», caixa «Só o que você quer lembrar».
E4f LOTE (FN-09): «2 fotos selecionadas», «Valores diferentes», aviso de ajuste individual.
```

**E5 · Importação (4 telas, D e C)**
```
T-03 «Adicionar fotos» com cartões Do aparelho, Câmera, Apple Fotos (Biblioteca de Fotos),
Google Fotos (Em breve), Instagram (Indisponível por regra da plataforma + «Ver como fazer»),
Drive/Dropbox/OneDrive (Em breve) e link «Verificar conexões». T-04 processando com erro por
arquivo. T-05 resumo. T-06 pop-up de orientação. Texto «Suas fotos continuam no seu aparelho.»
```

**E6 · Pré-voo e saída (5 telas)**
```
T-18 pop-up «Tudo pronto para o papel?» com as 3 severidades. T-19 Exportar. T-20 Gerando,
Recuperação (4 opções) e Concluído (sem «Abrir pasta»). T-21 Imprimir agora e calibração
em 3 passos. T-22 Compartilhar e estado sem suporte («Baixar imagem»).
```

**E7 · Conexões (2 telas, D T C)**
```
T-23 Central de conexões em duas seções (Trazer fotos / Levar para as redes), um cartão por
serviço, cada estado do DOC-07 §3. T-24 Verificação por serviço: linhas de verificação, barra
contínua, resumo em texto e falha com recuperação. Estados em ícone + texto. Instagram nunca
«Conectado».
```
**Aceite:** nenhum estado só por cor; teste não menciona baixar fotos; sempre há «Escolher do aparelho».

**E8 · Colagem, sugestões e lembranças (3 telas)**
```
T-15 Modo Colagem (D, T, C): canvas, alças, camadas, inspetor LAYOUT·FUNDO·POLAROIDS·
LEGENDAS·EXPORTAR. T-16 Sugestões: 3 cartões, cada um com prévia, nome do layout, FRASE DE
DESIGN em fonte expressiva curada (DOC-02 §5) e «Usar esta». T-17 Lembranças: formatos
9:16, 4:5, 1:1, legenda do post, «Compartilhar» e «Baixar imagem». Crie os layouts do
DOC-06 §4 com liberdade visual, respeitando CL-01 a CL-09.
```
**Aceite:** moldura branca em tudo; assinatura presente; frase de design em EXC-3; fundos só da paleta.

**E9 · Home (2 telas)** — Home vazia e com projetos; novo projeto com 6 formatos + Personalizado e atalho «Uma polaroid».

**E10 · Marketing e login (3 telas)**
```
Apresentação (hero com FRASE em fonte expressiva curada; 1 palavra em azul), Como funciona,
e Entrar (2.0) com banners EXC-5, botões «Continuar com Apple» e «Continuar com Google» com
ativos oficiais e mesmo peso, campo de e-mail e código.
```

**E11 · Legal** — banner informativo (D e C), pop-up de preferências (flag), Privacidade, Termos, Cookies (DOC-09). Preserve os campos [COLCHETES].

**E12 · Estados** — vazio, arquivo inválido, «A polaroid não cabe neste papel», falha de leitura, sem suporte a compartilhar, carregando (esqueleto sem cinza).

**E13 · Verificação final**
```
Revise TODAS as telas contra o checklist do DOC-11 §4. Liste só as violações
(tela, regra, correção). Não regenere telas sem violação.
```

## 4. Checklist anti-desvio (rodar ao fim de cada etapa)

| # | Verificação | Passa se… |
| --- | --- | --- |
| 1 | Cores | Só as 4 + `#F8F9FA`; sem outro cinza, vermelho ou verde |
| 2 | LED | ≤ 1 botão principal LED por tela; pop-ups livres; ≤ 2 caixas nível 2; nunca em controles |
| 3 | Seleção e foco | Anel azul 2 px |
| 4 | Controles ligados | Toggle e checkbox **azuis**, thumb e ✓ brancos |
| 5 | Exclusão | Guias ligadas ⇒ contorno desabilitado com apoio |
| 6 | Guia de corte | 0,1 mm, até a borda, sem cruzar o interior |
| 7 | Cálculo | Números coerentes com DOC-08 §3 |
| 8 | Escopo | Chip visível em toda edição |
| 9 | Legendas | Fonte do catálogo; cores preto/azul/laranja; dentro da área segura |
| 10 | Privacidade | Nenhuma coordenada, código ou nome de arquivo sobre a foto; nenhuma foto enviada |
| 11 | Moldura e assinatura | Moldura branca; logo no canto inferior esquerdo, fora da foto |
| 12 | Acessibilidade | Alvos ≥ 44; ícone + rótulo + valor; sem rolagem horizontal no celular |
| 13 | **Tipografia** | **Peso ≤ 500; só Inter, Cormorant e Plex Mono fora das 5 zonas; sem Georgia; peso 300 só ≥ 16 px** |
| 14 | **Zonas expressivas** | Fonte expressiva só em banner, legenda, frase de sugestão, frase da apresentação e banner de login |
| 15 | Textos | Português simples; dados de exemplo do DOC-04 §6 |
| 16 | Legal | Rodapé completo; banner informativo na 1.0 |
| 17 | Saída | Sucesso sem verde; sem «Abrir pasta» |
| 18 | Planos (2.0) | Limite e preço em texto + ícone; 1 LED na compra; sem vermelho/verde |
| 19 | Login (2.0) | Só Apple e Google com ativos oficiais, mesmo peso visual |
| 20 | **Layout** | Cabeçalho 64, trilho 256, mesa 7/12, inspetor 5/12; mobile sem trilho |
| 21 | **Conexões** | Estado em ícone + texto; Instagram sem «Importar»; sempre há «Escolher do aparelho» |
| 22 | **Colagem** | Moldura branca, assinatura, fundo da paleta, frase de design só em EXC-3 |
| 23 | **Vocabulário** | «Recorte» para a foto, «Guias de corte» para o papel |
| 24 | **Produção** | Sem rótulos internos («Etapa», «Regra 4.4», «V2.4»); sem CDN |

## 5. Prompt de revisão (corrigir sem refazer)

```
Na tela [NOME], altere SOMENTE: [lista curta]. Mantenha todo o resto idêntico.
Regras a respeitar: [IDs, ex.: DS-04, TP-02].
```
