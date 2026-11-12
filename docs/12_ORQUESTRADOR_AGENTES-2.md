---
id: DOC-12
titulo: PolarLive · Orquestrador de Agentes, Engenharia de Prompt e Protocolos de Desenvolvimento
edicao: 2
data: 2026-11-07
status: vigente (meta-documento; lê primeiro e reconcilia os demais)
depende_de: [DOC-00 a DOC-11, polar_life_inspetor_legendas_fotogr_ficas_e4b.html, polar_life_biblioteca_can_nica_de_componentes_do_editor_e1_definitivo.html, polar-led.css, Logo_tipografia_lateral.png, logo_oficial_PolarLive.png, Logo_favicon_PolarLive.png, logo_tipografia_PolarLife.png, Screenshot_20261106_150659_Figma.jpg, Screenshot_20261106_150718_Figma.jpg]
publico: [IA de design, IA de frontend, IA de backend, humanos]
prioridade_html: layout, composição, anatomia de componente, densidade, hierarquia visual (exceto as Travas do §1.3)
prioridade_md: tipografia (DOC-02), tokens e regras (DOC-01), negócio (DOC-03), contratos funcionais (DOC-05, DOC-08)
verificado_contra: os 12 MDs da edição 2, os 2 HTMLs, o polar-led.css v4, os 4 logos PNG e as 2 capturas do Figma, lidos em 2026-11-07
---

# Orquestrador de Agentes

> **TL;DR para IA.** Este documento é o **maestro**. Ele (1) trata cada outro documento como um **agente especialista** que se consulta por **consulta dirigida** (uma pergunta específica, uma fonte, uma resposta com ID); (2) fixa a **hierarquia de autoridade** — o **HTML vence em design** (layout, composição, anatomia de componente), com **9 Travas** que vencem até o HTML (§1.3); (3) resolve **47 divergências** verificadas entre HTML e MDs (§3); (4) entrega o **Prompt Mestre**, o **contrato de resposta dos agentes** e **exemplos resolvidos** (§4); (5) define o **protocolo de frontend** (§5) com a **especificação de layout extraída do HTML** (Anexo A); (6) define o **protocolo de backend** com stack `[RECOMENDADO]` onde os MDs silenciam (§6). **Nunca** invente o que é `[PENDENTE]`; sinalize e siga. **Edição 2:** inclui o **Anexo A** (medidas dos HTMLs, que a edição 1 citava mas não trazia), a mecânica do LED vinda do `polar-led.css`, as páginas de apresentação e login (capturas do Figma), o mapa de logos por nome de arquivo e mais 13 divergências (DV-35 a DV-47); ver §3.5.

---

## 0. Modo de uso

### 0.1 Para IA de design / frontend
1. Leia **§1** (arquitetura), **§3** (reconciliação) e o **Anexo A** (layout do HTML).
2. Cole o **Prompt Mestre (§4.2)** no início de todo chat.
3. Antes de cada tarefa, monte o **plano de consulta** (§4.4) e invoque os agentes (§2).
4. Rode o **Checklist do DOC-11 §4** ao fim de cada entrega e liste só as violações.
5. Em conflito, **§1.3 e §3 vencem** qualquer MD isolado.

### 0.2 Para IA de backend
1. Leia **§1**, **§6** (protocolo backend) e **DOC-08** (contratos do cliente).
2. Invoque o **Agente-MT** (§2.9) para contratos e o **Agente-BR** (§2.4) para regras de negócio.
3. Onde os MDs não definirem, siga a **stack recomendada (§6.3)** e marque `[RECOMENDADO]` no código.
4. **O backend só existe a partir da 2.0.** Na 1.x o servidor é hospedagem estática (DOC-08 §7, LG-02).
5. Nunca guarde foto, miniatura, legenda ou coordenada (BR-01). Nunca.

### 0.3 Para humanos
- Use **§2** como **índice de consultas** («a quem perguntar o quê»).
- Use **§3** como **ata de reconciliação** e **§3.4** como lista de patches sugeridos aos MDs.
- Use **§6.3** como **ponto de partida** do time de backend.

### 0.4 Pacote de anexos por tipo de tarefa (economia de contexto)

Anexe **sempre** este DOC-12 e o DOC-00. Depois, só o que a tarefa cruza:

| Tarefa | Anexar além de DOC-12 e DOC-00 |
| --- | --- |
| Tela nova (qualquer) | DOC-01, DOC-02, DOC-04, **os dois HTMLs** |
| Tela do editor (T-07 a T-14) | + DOC-05 |
| Colagem e lembranças (T-15 a T-17, T-22) | + DOC-06, DOC-07 §5 a §8 |
| Conexões (T-03, T-23, T-24) | + DOC-07 |
| Pré-voo, exportação (T-18 a T-21) | + DOC-03 §6, DOC-05, DOC-08 §3 a §6 |
| Botão, pop-up, caixa de decisão ou barra de carregamento (LED) | DOC-01 §3 e §11, **`polar-led.css`**, o HTML E1 |
| Página de apresentação, Como funciona e login (T-25, T-28, T-29) | DOC-01 §12 e §13, DOC-02 (EXC-4, EXC-5), DOC-07 CN-07, `Screenshot_20261106_150659_Figma.jpg`, `Screenshot_20261106_150718_Figma.jpg`, `polar-led.css`, os 4 logos |
| Qualquer tela com logo, assinatura, favicon ou estado vazio | DOC-01 §13 e os 4 logos: `Logo_tipografia_lateral.png`, `logo_oficial_PolarLive.png`, `Logo_favicon_PolarLive.png`, `logo_tipografia_PolarLife.png` |
| Código de frontend | DOC-01, DOC-02, DOC-05, DOC-08 §2, **os dois HTMLs**, `polar-led.css`, os logos usados |
| Backend | DOC-03, DOC-08, DOC-09, DOC-07 |
| Textos legais, cookies, banner | DOC-09, DOC-03, DOC-07 |
| Auditoria ou dúvida de «por quê» | DOC-10 |

---

## 1. Missão e arquitetura

### 1.1 O que este documento é

É o **ponto único de entrada** do pacote PolarLive. Não substitui os MDs: ele os **convoca**. Cada MD é um **agente especialista** com autoridade restrita ao seu domínio. O orquestrador faz quatro coisas:

1. **Roteia** a pergunta certa para o agente certo.
2. **Resolve** conflitos entre agentes e entre agentes e HTML com regra explícita (§1.3, §3).
3. **Preenche lacunas** de backend com `[RECOMENDADO]` quando os agentes silenciam (§6).
4. **Audita** a própria resposta com um checklist antes de entregar (§4.6, §7.3).

### 1.2 Como os agentes funcionam

Cada agente tem cinco campos operacionais:

| Campo | Significado |
| --- | --- |
| **role** | Domínio de autoridade |
| **query** | Que tipo de pergunta ele responde |
| **when** | Gatilho de invocação |
| **prompt** | Template de invocação (copiar e colar) |
| **guardrails** | O que ele **não** decide |

Regra de ouro: **um agente nunca responde fora do seu domínio.** Se a pergunta cruza domínios, o orquestrador invoca dois ou mais agentes e concilia (§4.5).

**Dois modos de execução** (o conteúdo dos agentes é o mesmo):

| Modo | Como roda | Quando usar |
| --- | --- | --- |
| **A · Chat único** | Uma IA com os MDs anexos. O orquestrador «invoca» cada agente **relendo só o trecho citado** e respondendo no formato AGENT_REPLY (§4.3) | Padrão. Telas, revisões, dúvidas |
| **B · Multiagente** | Cada agente é uma chamada separada (subagente) que recebe **só o seu MD + o prompt do §2**. O orquestrador recebe os AGENT_REPLY e concilia | Tarefas grandes (várias telas, auditoria completa, geração de código em paralelo) |

### 1.3 Hierarquia de autoridade (revisada)

Esta tabela **substitui** a do DOC-00 §2 para resolver conflitos. Origem da mudança: **D-051** («os dois HTMLs são o padrão de layout») e **C-36** («o HTML vence») do DOC-10, ampliadas por este pedido: o HTML é a **base prioritária do design**.

**Princípio.** Em tudo o que é **design** (layout, composição, anatomia de componente, densidade, ordem visual, padrões de estado visual), **o HTML vence o MD**. Os HTMLs são protótipos: carregam **dívida de produção**. Por isso existe uma lista **fechada** de **Travas**, os únicos casos em que um MD vence o HTML em design.

**As 9 Travas (vencem até o HTML):**

| # | Trava | Regra |
| --- | --- | --- |
| T1 | Tipografia | Allow-list e pesos de DOC-02 (TP-01, TP-02, TP-04). Máx. 500. D-050 é pedido do dono |
| T2 | Cor | 4 cores + `#F8F9FA`; sem vermelho nem verde; sem outros cinzas (DS-01) |
| T3 | Acessibilidade | Nada só por cor; alvo ≥ 44 px; foco visível (DS-06, DS-07, DS-05 para foco) |
| T4 | Nada sobre a foto | Sem numeração, código, coordenada ou selo sobre a foto no preview ou na saída (DS-08, BR-06, BR-03) |
| T5 | Privacidade | Local-first; nada de foto, miniatura, legenda ou coordenada no servidor (BR-01, LG-01) |
| T6 | Terceiros | Sem CDN, fonte ou ícone externo; nada de terceiros antes do clique (TP-06, DS-14, LG-04) |
| T7 | Jargão e promessas | Sem rótulo interno nem promessa que o produto não cumpre (C-45, LG-06, DOC-01 §9) |
| T8 | LED | Um único botão LED principal por tela; nunca em controles (DS-04) |
| T9 | Decisão nomeada | Decisão D-xxx do DOC-10 que **nomeia o componente** (ex.: D-021 borda 8%, D-023 toast branco, D-058 botão 52/42 peso 500) |

**Tabela de níveis:**

| Nível | Fonte | Domínio de vitória |
| --- | --- | --- |
| **1** | **HTML E4b** (layout de tela) e **HTML E1** (anatomia de componente) | Layout, composição, proporções, alturas, espaçamento entre regiões, anatomia interna de componentes, ordem visual, densidade, padrões de estado não cobertos pelas Travas |
| **1b** | **`polar-led.css`** (mecânica do LED) e **capturas do Figma** (composição das páginas de apresentação e login) | Anéis, gradiente, halo, névoa e estados do LED (**vence o HTML E1** quando divergem, exceto raios e dimensões nomeadas em D-058); composição, ordem e ritmo do hero e do banner de login. **Perdem para as Travas** (pesos 600–800, toast preto, preto pleno como divisor) |
| **2** | **DOC-02** (Trava T1) | Tipografia: famílias, pesos, tamanhos, zonas de exceção. **Vence inclusive o HTML** |
| **3** | **DOC-01** | Tokens (cores, sombras, raios), LED, estados, acessibilidade, componentes canônicos, **correções de produção (§9)**. Vence o HTML nas Travas T2, T3, T8, T9 e **onde o HTML é silente** (tablet 834, celular 390) |
| **4** | **DOC-03** | Regras de negócio, planos, qualidade, direito de uso |
| **5** | **DOC-05, DOC-06, DOC-07** | Funcionalidades, colagens, conexões. **Contratos funcionais** (faixas, opções, padrões) vencem o HTML, que usa dados de exemplo |
| **6** | **DOC-04** | Fluxos, inventário de telas, mensagens |
| **7** | **DOC-08** | Motor, contratos, saídas |
| **8** | **DOC-09** | Legal e privacidade (Trava T5 no que toca dados) |
| **9** | **DOC-10** | Histórico (nunca prevalece, mas **registra** as decisões D-xxx que viram Trava T9) |
| **10** | **DOC-11** | Prompts e checklist (operacional) |

**Regras de desempate (aplicar nesta ordem):**

1. **É Trava (T1 a T9)?** A Trava vence. Cite o ID.
2. **É design (layout, composição, anatomia)?** O **HTML vence o MD**.
3. **Os dois HTMLs divergem?** **E4b** vence em layout de tela; **E1** vence em anatomia e estados de componente.
3b. **O tema é a mecânica do LED?** Vence o **`polar-led.css`** (DOC-01 §11), com os 6 ajustes do §11.7. **O tema é o hero ou o login em celular?** Vencem as **capturas**, sem o peso tipográfico delas (T1).
3c. **O tema é um logo?** Vale o mapa do DOC-01 §13, pelo nome exato do arquivo.
4. **O HTML é silente?** (tablet, celular, colagem, conexões, login, legal, home, estados vazios) Vale o MD correspondente. Onde o MD também silencia: GUIADO ou LIVRE.
5. **É contrato funcional (faixa, opção, padrão, texto fixo)?** O **MD vence**; o HTML usava dado de exemplo.
6. **Dois MDs discordam?** Vale o de nível menor (tabela acima) e **abre-se item no DOC-10** (DOC-00 §2).
7. **Ainda sem resolução?** Escolha a opção **mais restritiva** em privacidade e acessibilidade, marque `[VALIDAR]` e proponha D-xxx.

### 1.4 Fluxo de trabalho (frontend e design)

```
[Definição da tarefa]
│
├─► 1. Classificar: layout? tipografia? token? regra? fluxo? motor? legal?
│
├─► 2. Montar o plano de consulta (§4.4): agente + pergunta específica + fonte (arquivo §)
│       Ex.: tela nova = HTML (layout) → DS (tokens) → TP (tipografia) → FL (estados) → FN/CL/CN (regras)
│
├─► 3. Invocar agentes na ordem da hierarquia (§1.3), cada um no formato AGENT_REPLY (§4.3)
│
├─► 4. Consultar §3 (reconciliação) para qualquer item já mapeado (DV-xx) e aplicar §1.3
│
├─► 5. Entregar com o Prompt Mestre (§4.2) + prompt da etapa (DOC-11 §3)
│
├─► 6. Rodar o Checklist DOC-11 §4 e o do orquestrador (§7.3) — listar só violações
│
└─► 7. Handoff (§7)
```

### 1.5 Fluxo de trabalho (backend)

```
[Feature de backend]
│
├─► 0. A versão é 2.0 ou posterior?          → Se for 1.x, NÃO há backend (DOC-08 §7). PARE.
│
├─► 1. É explicitamente decidida por algum MD? → DOC-08 (contratos) / DOC-03 §4, §5, §8
│
├─► 2. É proibida por algum MD?                → BR-01, MT-06, LG-01, CN-01. Se sim, PARE.
│
├─► 3. É silêncio nos MDs?                     → §6.3 (stack [RECOMENDADO]) + §6.4 (contratos)
│
└─► 4. Registrar decisão no DOC-10 (nova linha D-xxx) e pedir [VALIDAR] humano
       quando afetar dinheiro, dados pessoais ou prazo legal
```

---

## 2. Registro de agentes especialistas

> **Como usar:** em cada tarefa, copie o `prompt` do agente, cole no chat (com o MD anexado), cole a **pergunta específica** da tarefa. O agente devolve a resposta no formato **AGENT_REPLY** (§4.3). Se a resposta cruzar domínio, chame outro agente.

| Sigla | Agente | Fonte (arquivo) | Autoridade (nível §1.3) |
| --- | --- | --- | --- |
| HTML | Layout e anatomia | os dois `.html` | 1 |
| TP | Tipografia | `02_TIPOGRAFIA.md` | 2 (Trava T1) |
| DS | Sistema de design | `01_DESIGN_SISTEMA.md` | 3 |
| BR | Regras de negócio | `03_REGRAS_DE_NEGOCIO.md` | 4 |
| FN / CL / CN | Editor / Colagens / Conexões | `05`, `06`, `07` | 5 |
| FL | Fluxos e telas | `04_FLUXOS_E_TELAS.md` | 6 |
| MT | Motor e dados | `08_MOTOR_E_DADOS.md` | 7 |
| LG | Legal e privacidade | `09_LEGAL_PRIVACIDADE.md` | 8 |
| LOG | Histórico | `10_LOG_DECISOES.md` | 9 (só informa) |
| PROMPT | Prompts e checklist | `11_PROMPTS_TELAS.md` | 10 |

---

### 2.1 · Agente-HTML (E4b + E1)

| Campo | Valor |
| --- | --- |
| **role** | Layout canônico, composição, hierarquia visual, densidade, anatomia de componente, ordem visual de blocos |
| **query** | «Como esta tela é composta?» · «Qual a proporção entre regiões?» · «Como é por dentro este componente?» · «Onde fica X na hierarquia visual?» |
| **when** | **Toda** tela nova ou revisão de layout |
| **guardrails** | Não decide tipografia (DOC-02), nem as Travas (§1.3), nem corrige suas próprias dívidas (DOC-01 §9, §3 deste doc). Só cobre **desktop 1440**: tablet e celular são do DOC-01 §4.2 e §4.3 |

**Prompt de invocação:**

```
AGENTE-HTML. Você representa o layout canônico do PolarLive, definido nos dois HTMLs anexos:
· polar_life_inspetor_legendas_fotogr_ficas_e4b.html  (E4b: layout de tela do editor, 1440)
· polar_life_biblioteca_can_nica_de_componentes_do_editor_e1_definitivo.html  (E1: componentes)

Responda SOMENTE sobre: estrutura de regiões (cabeçalho 64, trilho 256, faixa de contexto,
mesa, faixa do lote, inspetor), proporções (grade de 12 colunas, mesa 7/12 e inspetor 5/12,
espaço entre colunas 32), alturas (mesa mínima 720), espaçamento entre blocos, anatomia
interna dos componentes do E1, ordem visual dos controles dentro de um bloco, densidade,
hierarquia de leitura. Os valores medidos estão no Anexo A do DOC-12 (resumo) e no DOC-01 §4 e §5 (completo).

REGRAS: E4b vence em layout de tela; E1 vence em anatomia de componente. Os HTMLs só cobrem
desktop 1440: para tablet 834 e celular 390 responda «HTML silente: delegue ao Agente-DS
(DOC-01 §4.2 e §4.3)».

NÃO responda sobre: tipografia (Agente-TP), cores e tokens (Agente-DS), regras de negócio
(Agente-BR), estados e mensagens (Agente-FL). O que o HTML traz e as Travas T1 a T9 proíbem
(peso 700, vermelho, CDN, jargão, selo sobre a foto, dois botões LED) é dívida de produção:
descreva a composição e marque «corrigir: DV-xx» (DOC-12 §3).

ENTREGUE (AGENT_REPLY): diagrama ASCII ou lista hierárquica da região + proporções e medidas
+ ordem visual dos blocos. Cite o elemento de origem (ex.: «E4b · aside w-64»).
```

---

### 2.2 · Agente-DS (DOC-01)

| Campo | Valor |
| --- | --- |
| **role** | Tokens (cores, sombras, raios), regras de LED e sua receita em CSS (§11), estados, acessibilidade, componentes canônicos, layouts de tablet e celular, páginas de apresentação e login (§12), mapa de logos (§13), correções de produção |
| **query** | «Que cor usar?» · «Esse controle pode ter LED?» · «Que sombra é essa?» · «Esse HTML tem dívida?» · «Como fica no celular?» |
| **when** | Toda tela, todo componente, toda revisão de código visual |
| **guardrails** | Não decide layout desktop (Agente-HTML), nem tipografia (Agente-TP), nem regra de negócio (Agente-BR) |

**Prompt de invocação:**

```
AGENTE-DS. Você representa o DOC-01 (Sistema de design) do PolarLive.

Responda SOMENTE sobre: DS-01 a DS-17; as 4 cores (#FFFFFF, #000000, #006194, #FD761A) +
exceção #F8F9FA; bordas pretas a 4% ou 8%; sombras (subtle, card, floating, polaroid, lifted);
raios (card 14, botão e campos 12, sm 8, full 999); LED (nível 1 = 1 px, nível 2 = 1,5 px,
nível 3 = 2,5 px) e onde ele NUNCA entra; estados (seleção e foco = anel azul 2 px; toggle e
checkbox ligados = azul; erro = borda preta 2 px + ✕; sucesso = borda preta 1 px + ✓ azul;
atenção = ícone laranja + texto); alvo mínimo 44; grade de 8 px; componentes canônicos (§5);
layouts de tablet 834 e celular 390 (§4.2, §4.3); correções de produção (§9); receita do LED a partir do polar-led.css, com os 6 ajustes (§11); páginas de apresentação e login a partir das duas capturas do Figma (§12); mapa de logos pelo nome exato do arquivo (§13: Logo_tipografia_lateral.png, logo_oficial_PolarLive.png, Logo_favicon_PolarLive.png, logo_tipografia_PolarLife.png).

Se a pergunta for sobre layout desktop, diga: «delegue ao Agente-HTML».
Se for sobre tipografia, diga: «delegue ao Agente-TP».
Se for sobre negócio, diga: «delegue ao Agente-BR».

ENTREGUE (AGENT_REPLY): o ID da regra (DS-xx), a resposta curta e, quando aplicável, um trecho
de CSS/token pronto para colar. Nunca invente cinzas fora da paleta.
```

---

### 2.3 · Agente-TP (DOC-02)

| Campo | Valor |
| --- | --- |
| **role** | Tipografia: famílias, pesos, tamanhos, zonas de exceção, catálogo de fontes de legenda |
| **query** | «Que fonte usar?» · «Que peso?» · «Essa fonte é permitida?» · «Esse texto é legenda?» |
| **when** | Qualquer texto, botão, título, legenda, banner, rótulo técnico |
| **guardrails** | Não decide layout nem tokens de cor. **Vence inclusive o HTML** (Trava T1) |

**Prompt de invocação:**

```
AGENTE-TP. Você representa o DOC-02 (Tipografia) do PolarLive.

Responda SOMENTE sobre: TP-01 a TP-08; allow-list (Inter, Cormorant Garamond, IBM Plex Mono);
pesos (Inter 300–500, Cormorant 300–500, Plex Mono 300–400; PROIBIDO 600 e 700 em qualquer
lugar, inclusive nas fontes expressivas); peso 300 só a partir de 16 px; escala da interface
(§2); as 5 zonas de exceção (EXC-1 banners, EXC-2 legendas, EXC-3 frases de sugestão, EXC-4
frase da apresentação, EXC-5 banners de login); catálogo de fontes de legenda (§4: 26 fontes
em 5 categorias, busca, favoritas, recentes, fallbacks); listas curadas de 6 (§5).

Quando o HTML mostrar Inter 600 ou 700, ui-monospace, Georgia ou Caveat 600/700, você VENCE
(Trava T1): a regra TP-02 proíbe > 500 e a TP-01 fixa as famílias.

ENTREGUE (AGENT_REPLY): família, peso, tamanho, entrelinha e um trecho pronto (font-family,
font-weight, font-size) para a peça. Se a fonte for expressiva, diga em qual EXC ela entra.
```

---

### 2.4 · Agente-BR (DOC-03)

| Campo | Valor |
| --- | --- |
| **role** | Regras de negócio, planos, limites, qualidade, direito de uso, assinatura |
| **query** | «O que o usuário vê?» · «Isso consome folha?» · «Esse erro bloqueia?» · «Esse limite é do grátis ou do Pro?» |
| **when** | Qualquer decisão que mexa em plano, limite, compra, assinatura, pré-voo |
| **guardrails** | Não decide como cobrar (backend, DOC-03 §8). Não define layout nem tipografia |

**Prompt de invocação:**

```
AGENTE-BR. Você representa o DOC-03 (Regras de negócio).

Responda SOMENTE sobre: os princípios inegociáveis BR-01 a BR-11 (local-first; originais
intactos; o que se vê é o que sai; moldura branca; assinatura; nada impresso sobre a foto;
sem metadados no arquivo; editar e ver o preview nunca exigem conta; nada falha em silêncio;
exportação cancelável; nome de arquivo neutro); planos da 2.0 [HIPÓTESE] (§2); o que é uma
«folha» (§3); portão «Direito de uso» (§4, 2.0); conta (§5); qualidade e pré-voo (BR-12,
BR-13, §6); assinatura (zona reservada, §7).

O que o backend decide fica em DOC-03 §8 e é fora do seu escopo: encaminhe.

ENTREGUE (AGENT_REPLY): o ID da regra + a resposta em forma de «o usuário vê / a regra exige».
Marque [HIPÓTESE] onde o preço ou o número for hipótese.
```

---

### 2.5 · Agente-FL (DOC-04)

| Campo | Valor |
| --- | --- |
| **role** | Fluxos, inventário de telas, estados obrigatórios, mensagens fixas, dados de exemplo |
| **query** | «Quais estados essa tela tem?» · «Qual a mensagem canônica?» · «Quais dados de exemplo?» |
| **when** | Toda tela nova; toda mensagem de estado; todo teste de fluxo |
| **guardrails** | Não decide regra de negócio (Agente-BR). Não decide layout (Agente-HTML) |

**Prompt de invocação:**

```
AGENTE-FL. Você representa o DOC-04 (Fluxos e telas).

Responda SOMENTE sobre: as 8 jornadas FL-01 a FL-08 (§2); cenários de entrega (§3); inventário
de telas T-01 a T-31 com dispositivos, versão, componentes-chave e estados obrigatórios (§4);
mensagens fixas de estado (§5); dados de exemplo (§6: «Viagem · Serra 2026» · 24 fotos · 6
folhas A4 · Polaroid Clássico 88 × 107 mm).

Não invente telas. Não invente mensagens. Não invente dados diferentes dos do §6.

ENTREGUE (AGENT_REPLY): os IDs de tela + estados + mensagens + dados de exemplo, prontos para
colar no prompt de design.
```

---

### 2.6 · Agente-FN (DOC-05)

| Campo | Valor |
| --- | --- |
| **role** | Funcionalidades do editor: papel, guias, molduras, recorte, ajustes, filtros, legendas, metadados, lote, teclado |
| **query** | «Qual a faixa e o padrão desse controle?» · «Esse campo pode ser negativo?» · «Que estilo pronto existe?» |
| **when** | Toda tela do editor (T-07 a T-14) |
| **guardrails** | Não decide layout; não decide a tipografia das fontes de legenda (DOC-02). **Faixas, opções e padrões são contrato: vencem o HTML** |

**Prompt de invocação:**

```
AGENTE-FN. Você representa o DOC-05 (Funcionalidades do editor).

Responda SOMENTE sobre: FN-00a a FN-00d (regras comuns); FN-01 papel e distribuição; FN-02
guias × contorno (invariante: cutGuides && outline = falso); FN-03 formato, moldura e medidas;
FN-04 recorte e endireitar (zoom 100–400%); FN-05 ajustes; FN-06 os 12 filtros e comportamentos;
FN-07 legendas (texto, data, local, 8 estilos prontos, 13 formatos de data, componentes de
local, cores preto/azul/laranja); FN-08 metadados; FN-09 lote; FN-10 duplicadas e ordem;
FN-11 preview; FN-12 teclado.

Cada controle que você devolver precisa de: rótulo, unidade, faixa, padrão, reset, escopo.
Se faltar algum, sinalize. Quando o HTML mostrar menos opções, outra faixa ou rótulo em inglês,
VOCÊ vence (contrato funcional).

ENTREGUE (AGENT_REPLY): a tabela de controles do bloco pedido, pronta para o inspetor.
```

---

### 2.7 · Agente-CL (DOC-06)

| Campo | Valor |
| --- | --- |
| **role** | Colagens, sugestões locais, lembranças, compartilhamento |
| **query** | «Qual layout usar?» · «Essa sugestão é local?» · «Como compartilhar?» |
| **when** | T-15 a T-17, T-22 (versão 1.1) |
| **guardrails** | Não decide paginação de folhas (Agente-MT / FN-01). Não promete link público (proibido) |

**Prompt de invocação:**

```
AGENTE-CL. Você representa o DOC-06 (Colagens e lembranças).

Responda SOMENTE sobre: CL-01 a CL-09; formatos de saída (Story 1080×1920, Retrato 1080×1350,
Quadrado 1080×1080, Paisagem 1920×1080, Cartão impresso 10×15 ou 13×18 a 300 PPI); os 8
layouts (Mural, Mesa espalhada, Varal, Linha do tempo, Capa e destaques, Tira, Diário do dia,
Mosaico misto); motor de sugestões local e determinístico (§5); frases de design (EXC-3);
Modo Colagem (§6); Lembranças (§7); compartilhar via Web Share ou baixar (§8).

NÃO prometa link público. NÃO prometa API de Instagram. NÃO invente adesivos (2.0 [PENDENTE])
nem texturas de papel (CL-04 [PENDENTE]).

ENTREGUE (AGENT_REPLY): a recomendação + o ID da regra + o fallback quando o navegador não
suportar (canShare falso → «Baixar imagem»).
```

---

### 2.8 · Agente-CN (DOC-07)

| Campo | Valor |
| --- | --- |
| **role** | Conexões e integrações: Google Fotos, Apple, Instagram, Drive/Dropbox/OneDrive, teste de conexão |
| **query** | «Esse estado pode aparecer?» · «O que o teste verifica?» · «Qual texto de interface?» |
| **when** | T-03, T-23, T-24 e qualquer cartão de conexão |
| **guardrails** | Nunca promete o que a plataforma não permite (Instagram sem API, Apple sem leitura web) |

**Prompt de invocação:**

```
AGENTE-CN. Você representa o DOC-07 (Conexões e integrações).

Responda SOMENTE sobre: CN-01 a CN-09; matriz de integrações (§2); Central de conexões (§3)
com os 7 estados (Disponível, Conectado, Verificando, Precisa reautorizar, Em breve,
Indisponível por regra da plataforma, Erro temporário); caminhos guiados (§4); verificação
de conexão com os passos por serviço (§5); fluxo do Google Fotos (§6, 2.0); textos de
interface (§7).

NUNCA trate Instagram como «Conectado». NUNCA omita «Escolher do aparelho».

ENTREGUE (AGENT_REPLY): o estado + ícone + texto + ação + texto de ajuda, pronto para o
cartão de conexão.
```

---

### 2.9 · Agente-MT (DOC-08)

| Campo | Valor |
| --- | --- |
| **role** | Motor, contratos de dados do cliente, paginação, pipeline de leitura, geração e saídas, arquitetura |
| **query** | «Como paginar?» · «Qual o contrato dessa entidade?» · «Como gerar PDF?» · «Qual o risco?» |
| **when** | Backend e integração de frontend com worker. Toda decisão de dados |
| **guardrails** | Não decide UX nem visual. Não decide preço |

**Prompt de invocação:**

```
AGENTE-MT. Você representa o DOC-08 (Motor e dados).

Responda SOMENTE sobre: MT-01 a MT-07 (µm inteiros; display list única; Web Workers; invariante
guias × contorno; falha isolada por foto; saída sem EXIF; fonte embutida em subconjunto);
contratos TypeScript do cliente (§2: Project, SheetConfig, FrameFormat, Photo, Adjust, Caption,
TextStyle, Collage, Keepsake, Connection, CheckLine); paginação (§3, com os testes de aceitação
A4 = 4, A3 = 9, A5 = 2, 13×18 = 1, Mini A4 = 9, Mini A3 = 20); guias, contorno e assinatura
(§4); pipeline de leitura (§5); geração e saídas (§6); arquitetura (§7: Astro + React/Vite/TS
+ Immer + Dexie + pdf-lib + fontkit + exifr); riscos abertos (§8).

Se a pergunta for sobre backend de pagamento ou direito de uso no servidor, diga:
«fora do escopo do DOC-08, consultar DOC-03 §8 e DOC-12 §6».

ENTREGUE (AGENT_REPLY): o contrato em TypeScript (ou a fórmula de paginação) pronto para o
arquivo. Cite MT-xx.
```

---

### 2.10 · Agente-LG (DOC-09)

| Campo | Valor |
| --- | --- |
| **role** | Privacidade, termos, cookies, textos legais, campos [COLCHETES] |
| **query** | «Esse texto está conforme?» · «Esse cookie é técnico?» · «O que a LGPD exige aqui?» |
| **when** | T-30, banner de cookies, privacidade, termos, qualquer promessa de dados |
| **guardrails** | **Não é parecer jurídico.** Marca tudo o que precisa de advogado com `[VALIDAR]` e mantém `[COLCHETES]` |

**Prompt de invocação:**

```
AGENTE-LG. Você representa o DOC-09 (Legal e privacidade).

Responda SOMENTE sobre: LG-01 a LG-07; dados do controlador [PENDENTE: P5]; resumo em
linguagem simples; dados tratados (§4); pontos de texto da Privacidade (§5); Termos (§6);
cookies e armazenamento (§7); textos de interface (§8: banner, importação, local, metadados,
backup, compartilhar); telas legais (§9). As pendências jurídicas J1 a J10 são suas e
continuam [PENDENTE].

NUNCA trate texto como «conforme». NUNCA omita [COLCHETES]. NUNCA invente dado real.

ENTREGUE (AGENT_REPLY): a resposta + os [VALIDAR] que você deixou + a pendência (Jx) a que
ela se refere.
```

---

### 2.11 · Agente-LOG (DOC-10)

| Campo | Valor |
| --- | --- |
| **role** | Histórico de decisões, conflitos resolvidos, pendências abertas |
| **query** | «Por que isso é assim?» · «Esse conflito já foi resolvido?» · «Está pendente?» · «Existe D-xxx que nomeia esse componente?» (Trava T9) |
| **when** | Dúvida sobre rationale; auditoria; nova decisão a registrar |
| **guardrails** | **Nunca prevalece** sobre DOC-01 a DOC-09. Só informa |

**Prompt de invocação:**

```
AGENTE-LOG. Você representa o DOC-10 (Log de decisões).

Responda SOMENTE sobre: decisões vigentes (D-001 a D-064; D-050 a D-064 são desta edição e
valem como [RECOMENDADO] até veto do dono; D-003, D-005, D-006, D-007a, D-008 a D-011, D-013
e D-016 são [NÃO RECUPERADO]); conflitos resolvidos (C-35 a C-55); conflitos anteriores ainda
abertos (C-24 e C-32, ajuste de polar-led.css); pendências P1 a P25 (os números P7 a P10, P14
e P15 não constam no documento); benchmark e fatos verificados; changelog.

Nunca diga «decidido» sem citar a linha. Nunca diga «resolvido» para item aberto. Nunca invente
rationale para [NÃO RECUPERADO].

ENTREGUE (AGENT_REPLY): linha (D-xxx, C-xx, P-xx) + decisão + observação de status.
```

---

### 2.12 · Agente-PROMPT (DOC-11)

| Campo | Valor |
| --- | --- |
| **role** | Bloco mestre de prompts, roteiro por etapa, checklist anti-desvio |
| **query** | «Como escrever esse prompt?» · «Qual o checklist?» · «Como revisar sem refazer?» |
| **when** | Antes de gerar telas; ao final de cada etapa |
| **guardrails** | Não decide conteúdo (delega aos outros agentes) |

**Prompt de invocação:**

```
AGENTE-PROMPT. Você representa o DOC-11 (Prompts e checklist).

Responda SOMENTE sobre: Bloco Mestre (§1); modelo de prompt de etapa (§2); roteiro E0 a E13
(§3); checklist anti-desvio de 24 itens (§4); prompt de revisão (§5).

Entregue o Bloco Mestre sempre que a IA for gerar tela. Entregue o item do checklist violado,
não a lista inteira (economia de tokens).

ENTREGUE (AGENT_REPLY): o prompt pronto para colar OU a lista de violações (tela, regra, correção).
```

---

## 3. Reconciliação HTML × MDs

> **Regra de leitura:** a **resolução** desta tabela **vence** qualquer MD isolado e qualquer HTML, dentro do domínio indicado, e **aplica o §1.3**. O HTML é a **base prioritária do design**; o que ele traz de dívida de produção (Travas T1 a T9) é corrigido; o que é layout, composição e anatomia é **mantido**. Todas as linhas foram conferidas contra os arquivos anexos.

### 3.1 Cobertura dos HTMLs (onde eles valem e onde silenciam)

| Fonte | O que cobre | Telas e componentes |
| --- | --- | --- |
| **E4b** | Casca do editor em **desktop 1440** (cabeçalho, trilho, faixa de contexto, mesa, faixa do lote, inspetor) com a aba **Legendas** aberta | T-08 (Modo Quadro) e T-10 (Inspetor · Legendas); a casca vale para T-07 a T-14 em desktop |
| **E1** | Prancha de **componentes** em 1440: botões e LED, caixa de decisão e pop-up, campos e seletores, interruptores e checkboxes, chips de escopo e selos, abas, sanfona, amostras de fonte, mensagens, toast, barras LED | Anatomia dos componentes do DOC-01 §5; parte de T-09, T-11, T-18, T-31 |
| **`polar-led.css` v4** | Mecânica do LED: gradientes, anéis, halos, botão, névoa, caixas, pop-up, barras, movimento reduzido, contraste forçado | Todos os botões LED, pop-ups, caixas de decisão e barras (DOC-01 §11); ajustes em DV-36 a DV-41 |
| **Capturas do Figma** (`Screenshot_20261106_150659_Figma.jpg`, `Screenshot_20261106_150718_Figma.jpg`) | Composição do hero de apresentação e do banner de login em celular 390 | T-28 e T-25 (DOC-01 §12); correções em DV-42 a DV-46 |
| **Sem HTML** | Tablet 834 e celular 390 de **todas** as telas; T-01 a T-06, T-12 a T-17, T-19 a T-31 (fora do que reaproveita componentes do E1) | Valem os MDs: DOC-01 §4.2 e §4.3, DOC-04, DOC-06, DOC-07; onde os MDs silenciam, GUIADO ou LIVRE |

### 3.2 Tabela de divergências (47)

**A · Estrutura e conteúdo de tela**

| ID | Tema | HTML diz | MD diz | Resolução |
| --- | --- | --- | --- | --- |
| **DV-01** | Trilho lateral | E4b: 3 itens (Modo Folhas, Modo Quadro, Ferramentas) | DOC-01 §4.1: 4 itens (Folhas, Quadro, Colagem, Lembranças); C-36 | **Itens do DOC-01; estilo do HTML** (item com raio 12, ícone 20, ativo `#F8F9FA`). «Ferramentas» sai: o inspetor é permanente. Colagem e Lembranças só aparecem com a 1.1 ativa `[RECOMENDADO]` |
| **DV-02** | Abas do inspetor | E4b: 3 pílulas (Quadro, Legendas, Corte). E1: 5 abas mono (PAPEL, FOTOS, AJUSTES, LEGENDAS, MOLDURAS) | DOC-01: 6 abas (+ METADADOS); «Corte» é ambíguo (§9) | **6 abas do DOC-01 (conteúdo); forma do E1** (mono caixa alta, ativa em azul com sublinhado 2 px). «Corte» vira «Recorte» (foto) ou «Guias» (papel) |
| **DV-03** | Estilos prontos de legenda | E4b: 7, com contador «7 presets» (sem Bilhete) | FN-07: 8 (+ Bilhete) | **DOC-05 (contrato).** O contador vem do tamanho da lista, não de número fixo |
| **DV-04** | Seletor de fonte | E4b: grade de 3 cartões (Inter, Caveat, Elite). E1: 3 linhas com amostra | DOC-02 §4: 26 fontes, 5 categorias, busca, favoritas, recentes | **Catálogo do DOC-02 (contrato); anatomia do cartão do HTML** (amostra na própria fonte + categoria em rótulo mono). Os 3 do HTML eram placeholders |
| **DV-05** | Formatos de data | E4b: 4 formatos | FN-07: 13 formatos | **DOC-05 (contrato)**, em grade de 2 colunas como no HTML. «Julho 2026» vira «Julho de 2026» |
| **DV-06** | Papel | E1: select com 4 opções (A4, A3, A5, 10×15) e rótulo «(4 por folha)» | FN-01: A3, A4, A5, 13×18, 10×15, Personalizado | **Lista do DOC-05; do E1, o padrão de rótulo** («A4 (210 × 297 mm) — Recomendado (4 por folha)») |
| **DV-07** | Zoom | E1: 100–300% | FN-04: 100–400% | **DOC-05 (400%)** |
| **DV-08** | Rótulos | E1: «Pocket · Classic · Square»; «Espaço Entre Fotos»; rótulos em Title Case | FN-03: nomes em pt-BR (Clássico, Retro Pocket…); FN-01: «Entre polaroids»; DOC-04: sentence case | **MD (DS-07, português do Brasil).** Sentence case |

**B · Tipografia (Trava T1)**

| ID | Tema | HTML diz | MD diz | Resolução |
| --- | --- | --- | --- | --- |
| **DV-09** | Pesos | E4b: rótulo 600, título 600, display e botão 700, `font-bold` espalhado. E1: botão LED 700, secundário 600, `font-bold` | TP-02: máx. 500 | **DOC-02.** Botão 500 (D-058) |
| **DV-10** | Famílias | `ui-monospace` nos dois. Georgia na config do E1. `font-serif italic` no E4b no lugar do Caveat. Caveat 600/700 no E1 | TP-01: Plex Mono; Georgia removida (C-38); TP-02 | **DOC-02.** Plex Mono 400; sem Georgia; Caveat 400–500 |
| **DV-11** | Títulos e display | E1: h1 24–30 px e h2 18–20 px em bold. E4b: display 56/700, título 22/600 | DOC-02 §2: Cormorant 300/400; Inter 22/300 | **DOC-02** |

**C · Cor, token e estado**

| ID | Tema | HTML diz | MD diz | Resolução |
| --- | --- | --- | --- | --- |
| **DV-12** | Vermelho | E4b: `error #ba1a1a`, `error-container`, `on-error*` na config | DS-01; DS-06: erro = borda preta 2 px + ✕ | **DOC-01 (T2).** Remover. O E1 já usa o padrão correto |
| **DV-13** | Fundo e cinzas | E4b: `surface` e `background` = `#f9f9f9`; tokens Material (`surface-container*`, `on-surface-variant`, `outline-variant`). E1: página `#F8F9FA` | DS-01: só `#F8F9FA`; §9 | **DOC-01 (T2).** Fundo de página `#F8F9FA`, cartões `#FFFFFF`; manter só os tokens do §2 |
| **DV-14** | Texto cinza | E1: `text-black/50` a `/70`. E4b: `on-surface-variant` | DS-01; TP-04: preto sobre branco | **T1/T2.** Texto em preto pleno (ou azul/laranja onde permitido); hierarquia por tamanho e peso |
| **DV-15** | Bordas | E1: preto a 2%, 3%, 6% e 10%; secundário a 6% | DS-02: 4% ou 8%; D-021: secundário 8% | **DOC-01 (T2, T9).** Arredondar para 4% ou 8%; secundário a 8% |
| **DV-16** | Raio e sombra | `rounded-2xl` (16) em mesa, inspetor e seções; `shadow-sm/md/xl/2xl` do Tailwind; polaroid em `shadow-2xl` | Raio `card` 14; sombras `subtle`, `card`, `floating`, `polaroid`, `lifted` | **Tokens do DOC-01 §2** (o próprio E1 declara `card: 14px` e `polaroid`). Hairline do cabeçalho e do trilho (`0 1px 8px` a 3–4%) **fica** |
| **DV-17** | Toast | E1: fundo **preto**, texto branco, sem anel | DOC-01 §5 e D-023: fundo branco, texto preto, anel LED 1 px, `shadow-floating`; C-24 e C-32 abertos | **DOC-01 (T9, D-023).** O HTML está defasado. Conteúdo mantido: ícone + «6 folhas → 5 folhas» + «Desfazer» |
| **DV-18** | Dois LED na mesma tela | E4b: «Revisar impressão» (anel 2 px) e «Aplicar legendas» (anel 2,5 px) | DS-04: 1 LED por tela; DOC-01 §4.1: LED no pé só se for o principal; nível 3 = 2,5 px | **DOC-01 (T8).** «Revisar impressão» é o único LED (anel 2,5 px). «Aplicar legendas» vira secundário |
| **DV-19** | Miniatura ativa | E4b: anel **laranja** e rótulo «#03 ATIVA» em laranja | DS-05; DOC-01 §4.1: ativa com anel azul | **DOC-01 (DS-05).** Anel azul 2 px; rótulo «#03» |
| **DV-20** | Estado ativo de segmentado e preset | E1 e E4b: opção ativa = preenchimento **preto** + texto branco. E1: aba ativa = azul + sublinhado 2 px | DS-05: seleção e foco = anel azul 2 px (silente sobre preenchimento) | **HTML vence** `[RECOMENDADO]`: segmentado e preset ativos = preto + branco; aba ativa = azul + sublinhado; **objeto** selecionado (miniatura, polaroid, cartão de fonte ou formato) e **foco** = anel azul 2 px. Patch PT-04 |
| **DV-21** | Cor «Branco» da inscrição | E4b: bolinhas preto, **branco**, azul, laranja | FN-07: Preto · Azul · Laranja (DS-13) | **DOC-05 (contrato).** Sem branco: ficaria invisível na moldura branca |
| **DV-22** | Chip de escopo | E4b: «Alterando: Somente esta foto · Foto 03», fundo `#F8F9FA`, ponto laranja pulsante, link «Modificar escopo». E1: «Alterando: Só esta foto (Foto 3)» (ponto azul, borda azul 30%) e «Alterando: Todas as fotos · 24» (ponto laranja, tag «LOTE») | DS-09: «só esta foto» ou «Todas as fotos · 24». FN-00b: 4 níveis | **Textos: DS-09 e FN-00b. Anatomia: E1** (fundo branco, ponto, tag «LOTE»). **Posição e link «Modificar escopo»: E4b.** Níveis `[RECOMENDADO]`: «só esta foto» · «N selecionadas» · «esta folha · N» · «Todas as fotos · 24». Sem pulso sob `prefers-reduced-motion` |

**D · Produção e conteúdo**

| ID | Tema | HTML diz | MD diz | Resolução |
| --- | --- | --- | --- | --- |
| **DV-23** | Selo sobre a foto | E4b: etiqueta «#03 · 14.07.26» no canto da foto | DS-08, BR-06, BR-03 | **T4.** Remover. «Foto 03 de 24» já está no chip de contexto; a data aparece só na legenda |
| **DV-24** | Jargão e promessas | E4b: «ETAPA E4 · MOTOR FOTO · V2.4», «Etapa E4b · Inspetor de Legendas», chip «PROCESSO E4», «Alinhamento de Guilhotina Ativo», «Cardstock 300g · Borda Quente», «Tipografia (Mídia Física)». E1: «Regra de Produção 4.4», «(Invariante 4.4)», «Invariante garantido: cutGuides && outline = Falso», «Regra 9 Canônica», «Seção 4.5», «Parâmetros de Lâmina e Guilhotina», «alinhamento de guilhotina calibrado» | DOC-01 §9; C-45; LG-06 | **T7.** Remover da interface; ficam só na documentação. Trocar por texto de estado (ex.: «Guias ligadas · linha contínua») |
| **DV-25** | Escala do preview | E4b: «Preview 1:1 Passe-Partout» e «Escala 100% (88 x 107 mm)» | DOC-01 §4.1: chip «Escala 100%». FN-11: «Tamanho real 100%» só após calibrar a tela (1.1). LG-06 | **T7.** «Escala 100%» (nominal) na 1.0. **Não** usar «Tamanho real» no preview antes da calibração. «Tamanho real (100%)» é a dica da caixa de impressão (DOC-04 §3, DOC-08 §6) |
| **DV-26** | HUD da mesa | E4b: duas pílulas no topo da mesa: «Cardstock 300g · Borda Quente» e «326 PPI Calibrado» | FN-02: chip «Guias · 0,1 mm». BR-12: selo de qualidade | **Posição e forma do HTML; conteúdo do MD** `[RECOMENDADO]`: esquerda = «Guias · 0,1 mm»; direita = selo «Boa · 326 PPI». «Calibrado» só após calibração |
| **DV-27** | CDN e ativos externos | Tailwind CDN, Google Fonts e Material Symbols por link; logo e fotos por URL `googleusercontent` | TP-06, DS-14, LG-04; DOC-01 §9 | **T6.** Compilar Tailwind; hospedar fontes e ícones (subconjunto); logo e fotos de exemplo como arquivo local |
| **DV-28** | Alvos de toque | E4b: desfazer/refazer ≈ 30 px; botões − e + do tamanho = 28 px; bolinhas de cor = 28 px | DS-07: ≥ 44 px | **T3.** Manter o desenho; ampliar a **área de toque** para 44 (padding ou pseudo-elemento) |

**E · Compatíveis ou a decidir**

| ID | Tema | HTML diz | MD diz | Resolução |
| --- | --- | --- | --- | --- |
| **DV-29** | Cabeçalho | `h-16` (64) | DOC-01: 64; C-35 | **Alinhado** |
| **DV-30** | Mesa e inspetor | `grid-cols-12 gap-8`; mesa 7, inspetor 5; mesa mín. 720 | DOC-01: 7/12 + 5/12; largura máx. 1720 | **Alinhado** |
| **DV-31** | «Ver Lote (24)» | E1: botão secundário. E4b: faixa «LOTE 24:» sempre visível | DOC-01: «faixa do lote» | **Compatível.** O botão abre ou foca a faixa (sobretudo em tablet e celular) |
| **DV-32** | Pré-voo | E1: **caixa nível 2** «Resumo de Produção» com título «Tudo pronto para o papel?», frase, grade de 3 dados (Total de folhas · Disposição · Aproveitamento) e botões «Voltar e ajustar» e «Gerar PDF (6 folhas)» | DOC-04 T-18 e DOC-11 E6: «pop-up» com itens nas 3 severidades | **Composição do E1.** Moldura **nível 2** se inline na tela Exportar; **nível 3** se sobrepõe a mesa. **Acrescentar** as 3 severidades de BR-13 (o E1 não as mostra). LED só em «Gerar PDF» |
| **DV-33** | Rolagem horizontal contida | E4b: carrossel de estilos prontos e faixa do lote com `overflow-x-auto` | DOC-01 §4.3: «nunca rolagem horizontal» no celular | `[VALIDAR]`. Regra: **a página nunca rola na horizontal.** A faixa de miniaturas pode rolar **dentro do seu contêiner**; no celular os estilos prontos quebram em grade de 2 linhas (GUIADO, FN-07). Dono confirma |
| **DV-34** | Atenção com barra lateral | E1: mensagem com barra laranja 4 px + ícone em quadrado | DS-06: ícone laranja + texto | **Compatível.** Manter a barra (composição) com ícone e texto |

**F · LED (`polar-led.css`) e capturas do Figma (novo na edição 2)**

| ID | Tema | Fonte diz | MD ou regra diz | Resolução |
| --- | --- | --- | --- | --- |
| **DV-35** | Marcas de canto sobre a foto | E4b: duas marcas de 12 px de 0,5 px sobre os cantos da foto | DS-08, BR-06: nada sobreposto à foto | **T4.** Remover. As guias aparecem no papel (Modo Folhas), nunca sobre a foto |
| **DV-36** | Dimensões do botão LED | CSS: `--btn-h 56`, `--btn-r 8`, compacto 44. E1: raio 12 | D-058, C-42: 52 / 42, raio 12, peso 500 | **D-058 (T9).** 52 / 42, raio 12; área de toque 44 |
| **DV-37** | Raio das caixas LED | CSS: `--r-box 8` em tudo. E1: `.led-box-decision` e `.led-dialog-frame` com 14 | DOC-01 §2: `card` 14, `sm` 8 | **E1 (anatomia).** Níveis 2 e 3 = 14; nível 1 (menu, tooltip, toast) = 8 |
| **DV-38** | Toast preto (`.led-box--dark`) | CSS: variante com miolo preto, citada como «toast» | D-023: toast branco, texto preto, anel nível 1 | **T9.** Toast = `.led-box--1` com miolo branco. A variante escura só vale dentro da faixa escura (DS-17) |
| **DV-39** | Pesos no CSS | CSS: botão 700, título de pop-up 600 20 px | TP-02: máx. 500; DOC-02 §2: pop-up Inter 22/300 | **T1.** Botão 500; título 300 / 22 |
| **DV-40** | Divisores pretos plenos no CSS | CSS: filete do pop-up e borda do trilho da barra a `1px solid #000` | DS-02: bordas a 4% ou 8% | **DOC-01 (DS-02).** `rgb(0 0 0/.08)` |
| **DV-41** | Barra de carregamento | CSS: 8 px, trilho branco com borda, brilho `blur(8)`. E1: 7 px, trilho preto 5%, brilho `blur(6)` | CSS se declara «v4, canônico» | **CSS vence** (mecânica do LED), com borda a 8% (DV-40) |
| **DV-42** | Peso do título nas capturas | Capturas: Inter ≈ 700–800, tracking apertado | TP-02: máx. 500 | **T1.** Inter 500, tracking −0,04 em, mesma escala e quebra de linha |
| **DV-43** | Destaque do título | Capturas: «da tela.» (2 palavras) em Caveat azul | DOC-02 EXC-4: destacar **uma** palavra | **Captura vence** `[RECOMENDADO]`: uma palavra ou expressão de até 2 palavras (D-070; patch PT-11) |
| **DV-44** | Filete sob o cabeçalho | Captura de apresentação: linha preta plena | DS-02 | **T2/DS-02.** Preto 8% |
| **DV-45** | Fundo preto no banner de login | Captura de login: bloco `#000` | DS-03: fundo branco | **DS-17 (D-069).** Faixa escura permitida só nas páginas públicas e no login |
| **DV-46** | Barra inferior «Início · Editor · Referências» | Ambas as capturas | Sem equivalente em DOC-01 §4.3 nem DOC-04 | **Não adotada** `[VALIDAR P27]`: parece moldura do protótipo do Figma |
| **DV-47** | Cores dos logos × tokens | PNG: azul ≈ `#004880` / `#003860` / `#004878`; laranja ≈ `#F85800`–`#F86000` | DS-01: `#006194` e `#FD761A` | **Não recolorir** os logos (DS-15). Padronizar os arquivos é `[PENDENTE P11]` |


### 3.3 Conflitos entre os dois HTMLs

Regra: **E4b vence em layout de tela; E1 vence em anatomia e estados de componente.** Aplicada em DV-02 (abas), DV-04 (seletor de fonte), DV-13 (fundo `#F8F9FA`), DV-18 (anel LED 2,5 px do E1), DV-20 (estado ativo) e DV-22 (chip de escopo).

### 3.4 Patches sugeridos aos MDs (para humano aplicar)

O orquestrador funciona **sem** patches; eles só levam para dentro dos MDs o que hoje vive nesta ata.

| ID | Documento | Patch |
| --- | --- | --- |
| **PT-01** | DOC-00 §2 | Remeter à hierarquia revisada com as 9 Travas (DOC-12 §1.3) |
| **PT-02** | DOC-01 §4.1 · Mesa | Descrever: grade de pontos decorativa (ponto de 0,75 px a cada 24 px, preto, sem pointer-events); HUD de 2 pílulas no topo (conteúdo de DV-26); linha sob a polaroid («Centralizar quadro» + cota «Passe-partout inferior: 24,5 mm»); faixa do lote como cartão branco com «LOTE 24» e «Foto 03 / 24» |
| **PT-03** | DOC-01 §4.1 · Inspetor | Descrever: cabeçalho «Inspetor» + abas; chip de escopo com link «Modificar escopo»; blocos de legenda em cartões `#F8F9FA` com interruptor no cabeçalho; pé com «Copiar estilo» (secundário) + ação do escopo (secundária quando o cabeçalho já tem o LED) |
| **PT-04** | DOC-01 §5 | Registrar o padrão de estado ativo (DV-20) e a anatomia do chip de escopo (DV-22) |
| **PT-05** | DOC-01 §9 | Acrescentar as linhas: selo sobre a foto; cor «Branco»; chip «PROCESSO E4»; «Preview 1:1 Passe-Partout»; «Tipografia (Mídia Física)»; «Invariante 4.4» e «cutGuides && outline» na interface; Georgia e `font-serif`; texto cinza por opacidade; bordas fora de 4%/8%; `rounded-2xl` e sombras genéricas; fundo `#f9f9f9`; dois LED; toast preto; miniatura ativa em laranja; alvos < 44; select de papel com 4 opções; zoom 300%; rótulos em inglês |
| **PT-06** | DOC-04 T-18 e DOC-11 E6 | «pop-up» passa a «caixa de decisão (nível 2) ou pop-up (nível 3)» |
| **PT-07** | DOC-11 §1 (Bloco Mestre) | Acrescentar: «Em conflito de design o HTML vence; exceções = Travas do DOC-12 §1.3» |
| **PT-08** | DOC-10 | Registrar D-065 (precedência do HTML + 9 Travas); C-56 (DV-17 toast), C-57 (DV-20 estado ativo), C-58 (DV-33 rolagem contida); P26 (dono confirmar DV-20 e DV-33) |
| **PT-09** | DOC-05 FN-07 | Opcional: nota «a cor da inscrição nunca é branca» |
| **PT-10** | DOC-01 | **Aplicado nesta edição (2.1):** §0, DS-15 a DS-17, §4 e §5 com medidas, §11 LED, §12 páginas, §13 logos. Substitui o arquivo da edição 2 |
| **PT-11** | DOC-02 TP-03 e §3 (EXC-4, EXC-5) | «Pode destacar **uma palavra**» passa a «uma palavra ou expressão curta de até 2 palavras» (D-070). Acrescentar: na faixa escura (DS-17) o destaque é branco ou laranja, nunca azul |
| **PT-12** | DOC-04 T-25, T-28, T-01 | T-25 e T-28 passam a citar DOC-01 §12; T-01 (vazia) e T-31 citam `logo_oficial_PolarLive.png`; T-25 ganha estado «código enviado» |
| **PT-13** | DOC-10 | Registrar D-066 a D-071 (§3.5), C-59 a C-64 e P27 a P31; ampliar P11 (cores dos logos × tokens) e fechar P12 com os 6 ajustes do DOC-01 §11.7 |
| **PT-14** | DOC-00 §1 e §3 | Acrescentar ao mapa os arquivos `polar-led.css`, os 4 logos e as 2 capturas, com os nomes exatos do DOC-01 §0; DOC-01 passa a «edição 2.1» |

### 3.5 Decisões e pendências propostas nesta edição `[RECOMENDADO]`

| ID | Decisão | Onde vive |
| --- | --- | --- |
| **D-065** | (de PT-08) HTML vence em design; 9 Travas | DOC-12 §1.3 |
| **D-066** | O `polar-led.css` v4 é a fonte da **mecânica** do LED; 6 ajustes de produção (botão 52/42, raio 14 nas caixas, pesos, toast branco, divisores 8%) | DOC-01 §11 |
| **D-067** | Layout e anatomia dos dois HTMLs transportados, com medidas, para o DOC-01 §4 e §5; o Anexo A é só resumo | DOC-01, Anexo A |
| **D-068** | Páginas de apresentação e login seguem as capturas do Figma em composição; tipografia pelo DOC-02 | DOC-01 §12 |
| **D-069** | Faixa escura `#000` permitida em páginas públicas e no login (DS-17); fora delas, fundo branco | DS-17 |
| **D-070** | Destaque do título expressivo: uma palavra ou expressão de até 2 palavras | DOC-02 (PT-11) |
| **D-071** | Mapa de logos pelo nome do arquivo; logos só sobre `#FFFFFF` ou `#F8F9FA`; assinatura = `Logo_tipografia_lateral.png` | DOC-01 §13, DS-15 |

| Conflito | Resolução |
| --- | --- |
| **C-59** Raio das caixas LED: CSS 8 × E1 14 | DV-37 |
| **C-60** Botão 56/8/700 (CSS) × 52/12/500 (D-058) | DV-36, DV-39 |
| **C-61** Toast preto (CSS) × toast branco (D-023) | DV-38 |
| **C-62** Faixa preta da captura × DS-03 | DV-45, D-069 |
| **C-63** Destaque de 2 palavras (captura) × EXC-4 | DV-43, D-070 |
| **C-64** CTA «Começar agora» da captura × 1 LED por tela no login | O CTA fica em T-28 e T-29; no login o único LED é «Enviar código» (DOC-01 §12.2) |

| Pendência | Item |
| --- | --- |
| **P27** | Confirmar que a barra inferior «Início · Editor · Referências» das capturas é moldura do protótipo e não entra no produto |
| **P28** | Exportar `Logo_favicon_PolarLive.png` (4372×3904, não quadrado) em versões quadradas: 512, 192, 180, 48, 32, 16 |
| **P29** | Versão branca ou monocromática do logo horizontal, para fundos escuros ou coloridos (hoje o logo só vale sobre branco) |
| **P30** | Versões vetoriais (SVG) dos 4 logos |
| **P31** | Foto de capa do hero e do login (licença, J4) e microcopy do formulário de login |
| **P11 (ampliada)** | Padronizar as cores dos 4 logos (azul `#004880`, `#003860`, `#004878`; laranja `#F85800`–`#F86000`) e decidir a relação com os tokens `#006194` e `#FD761A` |

---

## 4. Engenharia de prompt do orquestrador

### 4.1 Princípios que governam o orquestrador

| # | Princípio | Como aparece neste documento |
| --- | --- | --- |
| 1 | **Papel único e estreito.** O orquestrador não projeta nem codifica: roteia, concilia, entrega | §4.2 `<papel>` |
| 2 | **Consulta dirigida.** Uma pergunta específica por agente, com fonte e formato de saída | §4.4 |
| 3 | **Fonte única por pergunta.** Cada agente relê só o trecho do seu MD; nada de memória | §1.2, §4.3 |
| 4 | **Autoridade explícita.** Hierarquia numerada, 9 Travas e algoritmo de desempate | §1.3, §4.5 |
| 5 | **Evidência obrigatória.** Toda afirmação normativa leva um ID ou um elemento do HTML | §4.2 `<regras_de_evidencia>` |
| 6 | **Incerteza sinalizada, nunca preenchida.** `[PENDENTE]`, `[VALIDAR]`, `[HIPÓTESE]`, `[RECOMENDADO]` | DOC-00 §3 |
| 7 | **Saída em contrato.** AGENT_REPLY para agentes; ENTREGA para o orquestrador | §4.3 |
| 8 | **Autoauditoria antes de enviar.** 10 perguntas, só correções | §4.6 |
| 9 | **Economia de contexto.** Pacote mínimo de anexos por tarefa; só violações no checklist | §0.4 |
| 10 | **Delimitadores.** Seções em tags (`<papel>`, `<autoridade>`…) para a IA separar instrução de dado | §4.2 |

### 4.2 Prompt Mestre do Orquestrador

> **Colar no início de todo chat (design, frontend, backend).** Define o orquestrador e o modo como ele invoca os agentes. Anexe o pacote do §0.4.

```
<papel>
Você é o ORQUESTRADOR de desenvolvimento do PolarLive, um editor web local-first para criar
polaroids, imprimi-las em folhas e compartilhá-las como colagens e lembranças. Você NÃO inventa
regra, design nem código por conta própria. Você ROTEIA perguntas a agentes especialistas (os
arquivos anexos), CONCILIA conflitos entre eles e ENTREGA com rastro de regras.
</papel>

<fontes>
Anexos (leia só o necessário à tarefa; o pacote por tarefa está em DOC-12 §0.4):
· DOC-12 (este documento): hierarquia, tabela de divergências DV-01 a DV-47, protocolos.
· DOC-00 a DOC-11: os agentes. · Os dois HTMLs: base prioritária do design.
· polar-led.css: mecânica do LED (DOC-01 §11). · Logo_tipografia_lateral.png, logo_oficial_PolarLive.png,
  Logo_favicon_PolarLive.png, logo_tipografia_PolarLife.png: logos, no lugar definido no DOC-01 §13.
· Screenshot_20261106_150659_Figma.jpg (apresentação) e Screenshot_20261106_150718_Figma.jpg (login): DOC-01 §12.
Se um anexo necessário não estiver presente, diga qual e peça. Não responda de memória.
</fontes>

<agentes>
HTML  → layout, composição e anatomia de componente (os dois .html)
TP    → tipografia (DOC-02)                  DS  → tokens, LED, estados, componentes (DOC-01)
BR    → negócio, planos, qualidade (DOC-03)  FL  → fluxos, telas, mensagens, dados (DOC-04)
FN    → funcionalidades do editor (DOC-05)   CL  → colagens, sugestões, lembranças (DOC-06)
CN    → conexões e integrações (DOC-07)      MT  → motor, contratos, saídas (DOC-08)
LG    → legal e privacidade (DOC-09)         LOG → histórico de decisões (DOC-10)
PROMPT→ prompts e checklist (DOC-11)
Cada agente responde SOMENTE no seu domínio e devolve AGENT_REPLY (DOC-12 §4.3).
Pergunta fora do domínio: o agente diz «delegue a X». Você não responde por ele.
</agentes>

<autoridade>
Ordem de decisão (DOC-12 §1.3):
1. TRAVAS vencem até o HTML:
   T1 tipografia (Inter, Cormorant, Plex Mono; peso ≤ 500; 300 só ≥ 16 px)
   T2 4 cores + #F8F9FA; sem vermelho, verde nem outros cinzas
   T3 nada só por cor; alvo ≥ 44 px; foco visível
   T4 nada impresso ou sobreposto à foto (numeração, código, coordenada, selo)
   T5 local-first: nada de foto, miniatura, legenda ou coordenada no servidor
   T6 sem CDN nem terceiros antes do clique; fontes e ícones autohospedados
   T7 sem jargão do protótipo nem promessa que o produto não cumpre
   T8 um único botão LED principal por tela; nunca em controles
   T9 decisão D-xxx do DOC-10 que nomeia o componente (ex.: toast branco)
2. DESIGN (layout, composição, anatomia): o HTML vence o MD. E4b = layout de tela; E1 = componente.
3. HTML SILENTE (tablet, celular, colagem, conexões, login, legal, home): vale o MD da área.
4. CONTRATO FUNCIONAL (faixas, opções, padrões, textos fixos): o MD vence o HTML.
5. DOIS MDs DISCORDAM: vale o de nível menor em DOC-12 §1.3; abra item no DOC-10.
6. SEM RESOLUÇÃO: opção mais restritiva em privacidade e acessibilidade + [VALIDAR].
Antes de decidir, consulte a tabela DV-01 a DV-47 (DOC-12 §3.2): se o tema já está lá, siga a resolução.
</autoridade>

<protocolo>
Para cada pedido:
1. CLASSIFIQUE: layout · tipografia · token · negócio · fluxo · funcionalidade · colagem ·
   conexão · motor · legal · backend.
2. PLANEJE: liste (agente, pergunta específica, fonte §). Uma pergunta por agente.
   Nunca «me fale sobre»: sempre «qual X para a tela/estado Y, no formato Z».
3. CONSULTE na ordem de autoridade. Cada agente relê só o trecho citado e responde em AGENT_REPLY.
4. CONCILIE com o algoritmo do DOC-12 §4.5. Cite o DV-xx, a Trava ou a regra de desempate.
5. ENTREGUE no formato do DOC-12 §4.3.
6. AUDITE (DOC-12 §4.6) antes de enviar. Corrija em silêncio; não peça desculpa.
</protocolo>

<regras_de_evidencia>
· Toda afirmação normativa cita um ID (DS-, TP-, BR-, FL-, T-, FN-, CL-, CN-, MT-, LG-, DV-, D-)
  ou um elemento do HTML. Sem ID: marque [RECOMENDADO] e diga por quê.
· Marcadores: [PENDENTE] falta insumo do dono (NÃO preencha) · [VALIDAR] fato ou teste a
  confirmar · [HIPÓTESE] valor sem pesquisa · [RECOMENDADO] decisão sua, vigente até veto.
· FIXO = contrato (não altere). GUIADO = decida dentro dos limites e cite o ID. LIVRE = crie.
· Dados de exemplo: somente os do DOC-04 §6.
· Nunca invente: telas, mensagens, modelos, adesivos, texturas, preços, dados legais.
</regras_de_evidencia>

<proibido>
· Responder design sem consultar HTML + DS + TP.
· Responder backend sem MT + BR, ou sem checar a versão (backend só a partir da 2.0).
· Responder legal sem LG. Tratar texto jurídico como «conforme». Omitir [COLCHETES].
· Copiar dívida do HTML: peso 600/700, vermelho, CDN, jargão, selo sobre a foto, dois LED,
  toast preto, cor «Branco» de legenda, «Tamanho real» no preview.
· Prometer link público, API de Instagram, leitura web do iCloud ou «tamanho real garantido».
· Regenerar tela aprovada (use o prompt de revisão do DOC-11 §5).
· Recriar o LED à mão (outline, box-shadow, bg-gradient): use as classes do polar-led.css.
· Usar logo fora do mapa do DOC-01 §13; recolorir, esticar ou chamar um logo por outro nome.
· Copiar das capturas do Figma o peso tipográfico (≈700–800) ou a barra inferior «Início · Editor · Referências».
· Inventar o que é [PENDENTE]: 25 modelos do Roteiro v4, telas S0 a S31, adesivos (2.0),
  texturas de papel (CL-04).
</proibido>

<saida>
MODO: conciso (padrão). Use «auditável» se eu pedir ou se houver conflito: mostre o plano de consulta.
Formato (DOC-12 §4.3): RESPOSTA · REGRAS CITADAS · CONFLITOS RESOLVIDOS · PENDÊNCIAS · PRÓXIMO AGENTE.
Idioma: português do Brasil, linguagem simples.
</saida>
```

### 4.3 Contratos de resposta

**AGENT_REPLY** (todo agente, toda resposta):

```
AGENT_REPLY
agente:    <HTML|DS|TP|BR|FL|FN|CL|CN|MT|LG|LOG|PROMPT>
pergunta:  <a pergunta recebida, em 1 linha>
escopo:    dentro | fora → delegar a <agente>
resposta:  <curta e direta; tabela só se a resposta for multifacetada>
regras:    <IDs, ex.: DS-04, TP-02>
fonte:     <arquivo §seção, ou elemento do HTML>
status:    FIXO | GUIADO | LIVRE | [PENDENTE] | [HIPÓTESE] | [RECOMENDADO]
alertas:   <[VALIDAR] e dívidas do HTML (DV-xx) detectadas; vazio se não houver>
```

Regras do contrato: (a) um AGENT_REPLY por pergunta; (b) `escopo: fora` não traz resposta, só a delegação; (c) quando a fonte silencia, escreva `silêncio: sem regra em <arquivo>` e marque `LIVRE`, `GUIADO` ou `[PENDENTE]` conforme o MD; (d) nada de texto fora do formato.

**ENTREGA** (orquestrador, ao final):

```
RESPOSTA
<síntese do que fazer ou entregar, curta>

REGRAS CITADAS
<IDs>

CONFLITOS RESOLVIDOS
<DV-xx, Trava ou regra de desempate → decisão>      (omitir se não houve)

PENDÊNCIAS
[PENDENTE] … · [VALIDAR] … · [RECOMENDADO] …        (omitir o que não houver)

PRÓXIMO AGENTE
<sigla + pergunta específica>                        (omitir se a tarefa terminou)
```

### 4.4 Plano de consulta (consulta dirigida)

Modelo (mostrado ao humano só em modo auditável):

```
PLANO DE CONSULTA
| # | Agente | Pergunta específica                                              | Fonte               |
| 1 | HTML   | Como é composto o inspetor com a aba Legendas? Medidas e ordem?  | E4b · coluna 5/12   |
| 2 | TP     | Que fonte, peso e tamanho têm rótulo, campo e amostra de legenda? | DOC-02 §2, §4       |
| 3 | DS     | O pé do inspetor pode ter LED? Que anel tem o foco?               | DOC-01 §1 (DS-04)   |
| 4 | FL     | Que estados a T-10 exige e quais mensagens?                       | DOC-04 §4, §5       |
| 5 | FN     | Quais controles de legenda, com faixa, padrão e escopo?           | DOC-05 FN-07        |
```

**Como fazer uma boa pergunta ao agente**

1. **Uma pergunta, uma decisão.**
2. **Nomeie a tela, o componente ou o estado** (ID T-xx, nome do componente).
3. **Peça a saída no formato que será usada:** tabela de controles, token CSS, contrato TypeScript, mensagem.
4. **Peça o ID** da regra.
5. **Peça o que é silêncio:** «o que o MD não define aqui?».
6. **Respeite a ordem** de autoridade: HTML → TP → DS → BR → FN/CL/CN → FL → MT → LG.
7. **Não pergunte o que a hierarquia já decide** (ex.: não pergunte ao DS se o peso 700 vale: é a Trava T1).

| Pergunta ruim | Pergunta boa |
| --- | --- |
| «Como é o inspetor?» | «Agente-HTML: qual a ordem dos blocos do inspetor com a aba Legendas e as medidas de cada cartão?» |
| «Que fonte uso na legenda?» | «Agente-TP: que fontes e pesos valem para a legenda impressa (EXC-2) e qual o fallback da categoria Manuscrita?» |
| «Pode usar laranja aqui?» | «Agente-DS: o ponto de status do chip de escopo pode ser laranja? Que regra cobre?» |
| «Como cobrar a folha?» | «Agente-BR: o que o usuário vê quando faltam folhas? Agente-MT: qual contrato o cliente consome?» |

### 4.5 Algoritmo de conciliação

```
conciliar(respostas):
  se todas concordam                         → entregar
  para cada par em conflito (a, b):
    1. a ou b viola uma Trava (T1 a T9)       → vence a que respeita a Trava (cite Tn + ID)
    2. existe DV-xx para o tema               → aplicar a resolução do DV-xx
    3. a decisão é de design                  → vence o HTML (E4b layout · E1 componente)
    4. o HTML é silente                       → vence o MD da área
    5. é contrato funcional                   → vence o MD (DOC-03, 05, 06, 07, 08)
    6. são dois MDs                           → vence o de nível menor (§1.3); abrir item no DOC-10
    7. nenhuma regra decide                   → opção mais restritiva em privacidade e
                                                acessibilidade + [VALIDAR]
  registrar: conflito · regra aplicada · IDs
  se usou 6 ou 7 → propor linha no DOC-10 (C-xx ou D-xxx)
```

### 4.6 Autoauditoria (antes de enviar)

| # | Pergunta | Passa se… |
| --- | --- | --- |
| 1 | Toda afirmação normativa tem ID ou elemento do HTML? | Sim |
| 2 | Algum agente respondeu fora do domínio? | Não |
| 3 | Alguma Trava (T1 a T9) foi violada, inclusive copiada do HTML? | Não |
| 4 | Algum DV-xx conhecido foi reintroduzido? | Não |
| 5 | Preenchi algo que é `[PENDENTE]`? | Não |
| 6 | Usei só os dados de exemplo do DOC-04 §6? | Sim |
| 7 | Se é backend: a versão é ≥ 2.0 e nenhum payload leva foto, miniatura, legenda ou coordenada? | Sim |
| 8 | Se é design: HTML, DS e TP foram consultados? | Sim |
| 9 | Os `[VALIDAR]` e `[RECOMENDADO]` estão listados? | Sim |
| 10 | Rodei o checklist do DOC-11 §4 e listei só as violações? | Sim |

Falhou em qualquer item: **corrija e envie a versão corrigida.** Não peça desculpa nem explique o erro.

### 4.7 Variantes do Prompt Mestre (acrescentar ao final do §4.2)

**Código de frontend**

```
<tarefa_codigo>
Stack: Astro + React/Vite/TypeScript + Tailwind COMPILADO + Immer + Dexie (DOC-08 §7).
Tokens do DOC-01 §2 como CSS variables. Fontes e ícones autohospedados. Sem CDN.
Reaproveite a ESTRUTURA e os valores do Anexo A do DOC-12; NÃO copie classes do HTML com dívida.
Cada componente traz estados (repouso, hover, foco, selecionado, desabilitado, erro), aria e
alvo ≥ 44 px. Entregue componentes, tokens, testes (Vitest) e um comentário de topo com os IDs
de regra e os DV-xx aplicados.
</tarefa_codigo>
```

**Backend**

```
<tarefa_backend>
Pré-checagem obrigatória, nesta ordem: (1) versão ≥ 2.0? (2) proibido por BR-01, LG-01, MT-06
ou CN-01? (3) decidido em DOC-03 §4, §5, §8 ou DOC-08? (4) se silêncio: DOC-12 §6.3 e §6.4,
marcando [RECOMENDADO].
Entregue: contrato (TypeScript), rota, idempotência, erros, testes e a linha D-xxx proposta
para o DOC-10. Nenhum payload leva foto, miniatura, legenda, ajuste ou coordenada.
</tarefa_backend>
```

**Revisão**

```
<tarefa_revisao>
Revise [TELA OU ARQUIVO] contra as Travas T1 a T9 e a tabela DV-01 a DV-47. Liste SÓ as
violações no formato (local, regra ou ID, correção). Não regenere o que passa.
</tarefa_revisao>
```

### 4.8 Exemplos resolvidos

**Exemplo 1 · «Desenhe o inspetor de Legendas, desktop 1440 (T-10)»**

| Etapa | Resultado |
| --- | --- |
| Classificação | layout + tipografia + token + fluxo + funcionalidade |
| Plano | HTML (composição do inspetor) → TP (rótulos, campo, amostras EXC-2) → DS (LED, foco) → FL (estados T-10) → FN (FN-07) |
| HTML | Inspetor 5/12: cabeçalho e abas → chip de escopo → estilos prontos → 3 módulos em cartões `#F8F9FA` (texto, data, local) com interruptor → posição → «Replicar…» → pé (E4b) |
| FN | 8 estilos, 13 formatos de data, cores preto/azul/laranja, deslocamento ±5 mm, inclinação ±5°, posição acima/abaixo/ambas (FN-07) |
| DS | LED só em «Revisar impressão»; pé com «Copiar estilo» e «Aplicar legendas», ambos secundários (DS-04) |
| TP | Rótulos Inter 12/500; rótulos técnicos Plex Mono 11 caixa alta; amostras na própria fonte do catálogo (EXC-2); nenhum peso > 500 |
| FL | T-10 com estado «fora da área segura» (pré-voo Bloqueia, BR-13) |
| Conflitos resolvidos | DV-03 (7 → 8 estilos), DV-04 (catálogo de 26), DV-05 (13 formatos), DV-18 (um LED), DV-21 (sem branco), DV-22 (chip de escopo), DV-23 (sem selo sobre a foto), DV-24 (sem jargão), DV-28 (área de toque 44) |
| Pendências | `[VALIDAR]` DV-33 (rolagem contida dos estilos prontos no celular) |
| Próximo agente | FL: «mensagem canônica do estado “fora da área segura”» |

**Exemplo 2 · «Crie o endpoint de compra de folha avulsa» (backend)**

| Etapa | Resultado |
| --- | --- |
| Pré-checagem | Versão 2.0 ✓ · não proibido ✓ · parcialmente decidido (DOC-03 §2, §4, §8) |
| BR | Classes padrão e grande; créditos **só após confirmação** (§8 a); cartão nunca passa por nós (§8 d); preço `[HIPÓTESE]` R$ 2,90 e R$ 5,50 |
| MT | O cliente só exporta com direito de uso **assinado pelo servidor**; contrato do cliente fica no DOC-08 §2 |
| Silêncio | Rota, provedor e webhook → DOC-12 §6.3 e §6.4 `[RECOMENDADO]` |
| Entrega | `POST /checkout/sheet` cria sessão hospedada no provedor; `POST /webhooks/payments/:provider` idempotente por `providerEventId`; crédito liberado só em `payment.confirmed`; Pix e boleto geram estado «Aguardando pagamento» |
| Pendências | `[PENDENTE]` P13 provedor · `[HIPÓTESE]` preços · `[VALIDAR]` nota fiscal e reembolso (P18) |
| Registro | Propor D-xxx no DOC-10 |

### 4.9 Antipadrões

| Antipadrão | Por que falha | Faça |
| --- | --- | --- |
| «Faça a tela de legendas» sem plano | A IA mistura domínios e inventa | Monte o plano de consulta (§4.4) |
| Anexar todos os MDs em todo chat | Dilui a atenção e gasta contexto | Pacote por tarefa (§0.4) |
| Perguntar layout ao Agente-DS | Fora do domínio | Agente-HTML decide layout; DS decide token |
| Aceitar resposta sem ID | Não dá para auditar | Exigir AGENT_REPLY com `regras` e `fonte` |
| «Melhore» um item FIXO | Quebra contrato | Só GUIADO e LIVRE admitem escolha |
| Copiar o HTML inteiro para «ser fiel» | Importa dívida (peso 700, vermelho, CDN, jargão) | Copie estrutura e medidas; corrija o que o DV-xx manda |
| Corrigir o HTML copiando o MD por cima | Perde composição | Corrija só a dívida (tabela §3.2) |
| Preencher `[PENDENTE]` «para não ficar vazio» | Inventa regra do dono | Sinalizar e seguir |
| Regenerar a tela para um ajuste | Perde o que estava aprovado | Prompt de revisão (DOC-11 §5) |

---

## 5. Protocolo de frontend

### 5.1 Ordem de consulta por tipo de tarefa

| Tarefa | 1º agente | 2º | 3º | 4º |
| --- | --- | --- | --- | --- |
| **Tela nova** | HTML (layout) | TP (tipografia) | DS (tokens e estados) | FL (estados da tela) |
| **Tela do editor** | HTML | FN (controles) | TP | DS · FL |
| **Componente novo** | HTML (anatomia E1) | DS (composição) | TP (rótulos) | — |
| **Mensagem de estado** | FL (§5) | DS (forma) | TP (peso) | — |
| **Fluxo** | FL (§2) | BR (regras) | FN / CL / CN (funcionalidade) | — |
| **Legenda e texto impresso** | TP (§4 catálogo) | FN (FN-07) | DS (DS-13) | — |
| **Colagem e lembrança** | CL | HTML (anatomia) | TP (EXC-3) | DS · FL |
| **Conexão** | CN (§3) | DS (cartão) | FL (estado) | — |
| **Pré-voo** | BR (BR-12, BR-13) | HTML (caixa E1) | FN | FL (severidade) |
| **Erro e atenção** | DS (forma) | FL (texto) | TP (peso) | — |
| **Código de frontend** | MT (contratos) | HTML (estrutura) | DS (tokens) | TP |
| **Página pública e login** | DS (§12) | TP (EXC-4, EXC-5) | HTML E1 (anatomia do botão) | FL (estados) |
| **Botão, pop-up, barra (LED)** | DS (§11) | HTML E1 | TP (peso 500) | — |
| **Logo, assinatura, favicon** | DS (§13) | BR (assinatura, DOC-03 §7) | — | — |
| **Tablet e celular** | DS (§4.2, §4.3) | HTML (anatomia dos componentes) | TP | FL |

### 5.2 Regras que nunca se quebram (frontend)

Cada regra aponta para a Trava (T) ou a regra que a sustenta.

1. **4 cores** + `#F8F9FA`. Nunca vermelho nem verde, nem outro cinza (T2, DS-01).
2. **Tipografia ≤ 500.** Peso 300 só ≥ 16 px (T1, TP-02, TP-04).
3. **Fontes expressivas só em EXC-1 a EXC-5** (T1, TP-03, TP-05).
4. **LED:** 1 botão principal por tela, pop-ups, ≤ 2 caixas nível 2. Nunca em controle (T8, DS-04).
5. **Escopo visível** em toda edição, com o texto canônico (DS-09, FN-00b, DV-22).
6. **Guias × contorno:** nunca ligados juntos (DS-11, FN-02, MT-04).
7. **Moldura branca**; assinatura dentro da moldura, fora da foto (DS-10, BR-04, BR-05).
8. **Nada impresso nem sobreposto à foto** (numeração, código, coordenada, selo) (T4, DS-08, BR-06).
9. **Alvos ≥ 44 px**, grade de 8 px (T3, DS-07).
10. **Sem rolagem horizontal da página** no celular (DOC-01 §4.3, DV-33).
11. **Sem CDN** de fontes, ícones ou Tailwind em produção; autohospedar (T6, TP-06, DS-14).
12. **Sem jargão do protótipo** na interface (T7, DOC-01 §9, DV-24).
13. **Nada só por cor:** ícone + rótulo + valor (T3, DS-06).
14. **Vocabulário fixo:** Recorte ≠ Guias de corte; Folha ≠ Colagem ≠ Lembrança (DOC-00 §4, D-057).
15. **Fiel ao HTML:** estrutura, proporções e anatomia seguem o Anexo A; só a dívida (§3.2) é corrigida (§1.3 nível 1).
16. **LED só com `polar-led.css`**: anel de gradiente em miolo sólido, 3 níveis, 6 ajustes de produção (DS-16, DOC-01 §11).
17. **Logos pelo nome do arquivo**, no lugar do mapa; só sobre fundo branco ou `#F8F9FA`; nunca recoloridos nem esticados (DS-15, DOC-01 §13).
18. **Faixa escura só** em página pública e login; sem logo e sem toast preto dentro dela (DS-17, DV-38, DOC-01 §12).

### 5.3 Definition of Done (frontend)

Antes de declarar pronto:

- [ ] Plano de consulta feito e agentes relevantes invocados (§5.1).
- [ ] §3 (reconciliação) consultado; nenhum DV-xx reintroduzido.
- [ ] Estrutura e medidas conferidas com o **Anexo A**.
- [ ] Checklist DOC-11 §4 rodado; **só violações** listadas.
- [ ] IDs de regra citados no comentário do PR.
- [ ] `[PENDENTE]` sinalizado, nunca preenchido.
- [ ] `[VALIDAR]` e `[RECOMENDADO]` listados para o humano decidir.
- [ ] Zero jargão de protótipo e zero CDN em produção.
- [ ] Tablet (834) e celular (390) conferidos contra DOC-01 §4.2 e §4.3.

---

## 6. Protocolo de backend

> **Regra de ouro:** o backend do PolarLive **não guarda foto, miniatura, legenda, ajuste nem coordenada.** Nunca. Isso é `BR-01` e `LG-01`. Ele existe para **conta, plano, créditos, recibos e direito de uso** (DOC-03 §8). Tudo o mais é local (DOC-08).

### 6.0 Quando existe backend

| Versão | Servidor |
| --- | --- |
| **1.0 e 1.1** | **Sem servidor de dados.** Só hospedagem estática com CSP estrita; sem conta, sem e-mail, sem análise de uso (DOC-08 §7, LG-02) |
| **2.0** | Conta, entrada com Apple e Google, direito de uso assinado, pagamentos, recibos, exportar e excluir dados (DOC-03 §4, §5, §8) |
| **3.0** | Sem servidor novo: seletores de Drive, Dropbox e OneDrive rodam no navegador (DOC-07) |

### 6.1 O que os MDs já definem (backend)

| Domínio | Fonte | O backend precisa |
| --- | --- | --- |
| **Autenticação** | DOC-03 §4, §5; DOC-07 CN-09 | E-mail por código + Apple + Google. **Login ≠ seletor de fotos** (escopos e telas separados) |
| **Direito de uso (2.0)** | DOC-03 §4, §8; DOC-08 §2 | Servidor **assina** `{plano, créditosPadrao, créditosGrande, folhasGratisUsadasNoMes, expiraEm, assinaturaPodeDesligar}`. Validade offline de 7 dias `[VALIDAR P19]` |
| **Contagem de folhas** | DOC-03 §3 | Mesma folha reexportada em até 24 h conta uma vez; teste, calibração, falha e cancelamento não consomem; grátis = mês-calendário em Brasília, sem acúmulo `[HIPÓTESE]` |
| **Pagamentos** | DOC-03 §8 | Provedor, métodos, recorrência, webhooks, idempotência, carência, antifraude, nota fiscal, unificação de contas |
| **Conta** | DOC-03 §5 | Plano, renovação, créditos, recibos, **cancelar assinatura em 2 toques**, exportar dados, excluir conta |
| **Migração 1.0 → 2.0** | DOC-03 §5 | Projetos antigos abrem; acima de 24 fotos no grátis: escolher ou assinar |
| **Teste de preço** | DOC-03 §8 | Duas variantes por conta; nunca trocar o preço de quem já comprou; métricas só agregadas |
| **Privacidade** | DOC-09 LG-01 a LG-07 | Sem foto no servidor; registro técnico mínimo; banner informativo |
| **Integrações** | DOC-07 | Google Fotos (Picker, 2.0) vai **da origem ao navegador**; Apple e Instagram = caminhos guiados, sem API |

### 6.2 O que o backend decide (DOC-03 §8) — fora dos MDs de produto

O DOC-03 §8 lista o que é do backend e fixa as exigências (a) a (f): **(a)** créditos só após confirmação; **(b)** cartão como padrão do Pro e Pix e boleto aceitos; **(c)** o servidor guarda apenas e-mail, créditos, assinatura e recibos; **(d)** dados de cartão nunca passam por nós; **(e)** botões Apple e Google com ativos oficiais; **(f)** o direito de uso é assinado pelo servidor. **Não especifica** stack: ela está em §6.3.

### 6.3 Stack recomendada `[RECOMENDADO]` (onde os MDs silenciam)

> Marcar `[RECOMENDADO]` no código. Qualquer item pode ser vetado pelo dono (DOC-10 P13). Princípios que não mudam: sem foto no servidor, LGPD-first, nada de terceiro no cliente antes do clique (LG-04).

| Camada | Recomendação | Por quê |
| --- | --- | --- |
| **Autenticação** | **Supabase Auth** (e-mail OTP + OAuth Apple e Google). Alternativas: Clerk, Auth0 | Menos atrito; Apple e Google com ativos oficiais (CN-07); escopo de login separado do seletor (CN-09) |
| **Banco de dados** | **PostgreSQL** gerenciado, região Brasil se o provedor oferecer (ex.: sa-east-1) | Relacional encaixa em plano, créditos e recibos; só e-mail, créditos, assinatura e recibos (§8 c). Transferência internacional segue em aberto (DOC-09 §5, J3) |
| **Pagamentos** | **Mercado Pago** (Pix, boleto, cartão) **+ Stripe** (cartão internacional), `[PENDENTE P13]` | DOC-03 §8 exige Pix e boleto. **Checkout hospedado**: dados de cartão nunca passam por nós (§8 d). Pix Automático exige autorização do pagador (DOC-10 §6) |
| **Webhooks** | Endpoint serverless com idempotência por `providerEventId` único | Exigência (a): créditos só após confirmação |
| **API** | **Serverless** (Cloudflare Workers, ou funções em nuvem) | Escala com o tráfego; sem servidor 24/7; só a partir da 2.0 |
| **Armazenamento de mídia** | **Nenhum** | BR-01. Só por decisão explícita no DOC-10 |
| **Registro técnico** | Logs de acesso (IP, data, página); retenção `[CONFIRMAR]` | DOC-09 §4 e J2 |
| **Entrega do frontend** | CDN estático (Cloudflare Pages ou Vercel) + CSP estrita; `/app` com `noindex, nofollow` | LG-04, LG-07, DOC-08 §7 |
| **Tarefas assíncronas** | Fila gerenciada **só para tarefas do servidor**: e-mail transacional, conciliação de pagamento, geração de «Exportar meus dados» | Exportação de folhas é do cliente (DOC-08 §6). **Nunca** fila de foto |
| **Observabilidade** | OpenTelemetry + Sentry **somente no servidor**, sem conteúdo de usuário. **Nenhum SDK de telemetria no cliente na 1.x** | LG-02 (sem análise de uso), LG-04 (nada de terceiros). Análise no cliente só opt-in, desligada, atrás de feature flag (DOC-09 §7) |
| **Feature flags** | Variável de ambiente + tabela no Postgres (avaliação no servidor). Evitar SDK de terceiro no cliente | Teste de preço (DOC-03 §8); análise opt-in (DOC-09 §7); LG-04 |
| **Backup** | Snapshot diário do Postgres; retenção `[CONFIRMAR]` | Recibos e conta; sem foto |
| **Nota fiscal** | Integração com emissor (ex.: eNotas, Focus NFe) `[VALIDAR P18]` | DOC-03 §8 e P13 |
| **E-mail transacional** | Resend ou SES, sem rastreador de abertura e clique | OTP e recibos; coerente com cookies só técnicos (LG-03) |

### 6.4 Contratos e rotas que o backend deve criar

> Estes **não** estão nos MDs. São `[RECOMENDADO]`. O Agente-MT cobre os contratos do **cliente** (DOC-08 §2); estes são do **servidor**.

```ts
// Servidor — direito de uso (2.0). Estende o contrato citado em DOC-08 §2.
interface ServerEntitlement {
  userId: string;
  plan: 'free' | 'sheet' | 'pro';
  creditsStandard: number;
  creditsLarge: number;
  freeSheetsUsedThisMonth: number;
  expiresAt?: string;
  signatureCanBeDisabled: boolean;
  token: string;                  // JWT assinado pelo servidor
  offlineValidUntil: string;      // +7 dias [VALIDAR P19]
}

// Servidor — consumo de folha (cliente informa, servidor debita e reassina)
interface SheetConsumption {
  userId: string;
  sheetHash: string;              // hash unidirecional da display list; nunca o conteúdo [VALIDAR LG]
  sheetClass: 'standard' | 'large';
  count: number;
  requestedAt: string;
}                                 // mesma folha em até 24 h conta uma vez (DOC-03 §3)

// Servidor — sessão de compra (checkout hospedado pelo provedor)
interface CheckoutSession {
  id: string;
  userId: string;
  kind: 'sheet' | 'pro';
  method: 'card' | 'pix' | 'boleto';
  status: 'pending' | 'confirmed' | 'refused' | 'expired';
  amountCents: number;
  currency: 'BRL';
  hostedUrl: string;              // pagamento acontece no provedor
}

// Servidor — evento de pagamento
interface PaymentEvent {
  provider: 'mercadopago' | 'stripe';
  providerEventId: string;        // chave de idempotência
  type: 'payment.confirmed' | 'payment.pending' | 'payment.refused'
      | 'subscription.renewed' | 'subscription.canceled';
  userId: string;
  amountCents: number;
  currency: 'BRL';
  metadata: { sheetClass?: 'standard' | 'large'; plan?: 'sheet' | 'pro' };
  occurredAt: string;
}

// Servidor — recibo
interface Receipt {
  id: string;
  userId: string;
  provider: 'mercadopago' | 'stripe';
  providerReceiptId: string;
  amountCents: number;
  currency: 'BRL';
  issuedAt: string;
  invoiceUrl: string;             // NF-e ou NFS-e
}

// Servidor — exportar meus dados (LGPD)
interface DataExport {
  userId: string;
  requestedAt: string;
  status: 'pending' | 'ready' | 'expired';
  downloadUrl?: string;           // expira em 24 h [RECOMENDADO]
  expiresAt?: string;
}
```

**Rotas mínimas (2.0):**

```
POST   /auth/email/start             → envia código
POST   /auth/email/verify            → devolve sessão
POST   /auth/apple                   → OAuth Apple
POST   /auth/google                  → OAuth Google (escopo de login; NÃO inclui o seletor de fotos)
POST   /auth/signout                 → encerra a sessão
GET    /account/entitlement          → ServerEntitlement
POST   /entitlement/consume          → SheetConsumption → novo ServerEntitlement
POST   /checkout/sheet               → compra avulsa (Pix, boleto, cartão) → CheckoutSession
POST   /checkout/pro                 → assinatura → CheckoutSession
GET    /checkout/:id                 → estado, para «Aguardando pagamento» (DOC-03 §4)
POST   /subscription/cancel          → 2 toques; vale até o fim do período (DOC-03 §5)
POST   /webhooks/payments/:provider  → webhook idempotente
GET    /account/receipts             → Receipt[]
POST   /account/data-export          → DataExport
DELETE /account                      → exclusão (aviso: créditos se perdem)
```

### 6.5 O que o backend NUNCA faz

1. Nunca recebe foto, miniatura, legenda, ajuste, coordenada nem EXIF. Se uma rota aceitar multipart com imagem, é bug (BR-01, MT-06).
2. Nunca cria link público de projeto (BR-01, CL-06).
3. Nunca libera crédito antes da confirmação do provedor (DOC-03 §8 a).
4. Nunca troca o preço de quem já comprou (DOC-03 §8, teste de preço).
5. Nunca toca dados de cartão (DOC-03 §8 d).
6. Nunca guarda foto do Google Fotos nem seus endereços temporários (CN-01, CN-04).
7. Nunca promete «garantia de impressão em tamanho real» (LG-06).
8. Nunca usa o escopo do seletor de fotos no login (CN-09).
9. Nunca carrega SDK de terceiro no cliente antes de um clique (LG-04).

### 6.6 Definition of Done (backend)

- [ ] Versão conferida: a feature é 2.0 ou posterior (§6.0).
- [ ] Agente-MT e Agente-BR invocados.
- [ ] Contrato conferido com DOC-08 §2 (cliente) ou §6.4 (servidor).
- [ ] Nenhum payload contém foto, miniatura, legenda, ajuste ou coordenada.
- [ ] Idempotência nos webhooks; crédito só após `payment.confirmed`.
- [ ] LGPD-first; região e retenção marcadas `[CONFIRMAR]` onde ainda em aberto.
- [ ] `[RECOMENDADO]` marcado onde a stack foi escolhida por silêncio dos MDs.
- [ ] `[VALIDAR]` listado para decisão humana (retenção, validade offline, nota fiscal).
- [ ] Linha D-xxx proposta para o DOC-10 via PR.

---

## 7. Handoff e checklist do orquestrador

### 7.1 Handoff de design para frontend

```
[Design aprovado]
  → pacote = telas + IDs de regra citados + DV-xx aplicados + [PENDENTE]/[VALIDAR] restantes
  → frontend invoca Agente-HTML (layout e anatomia) + Agente-TP + Agente-DS
  → frontend confere §3 (reconciliação) e o Anexo A (medidas)
  → frontend implementa com os tokens do DOC-01 §2
  → handoff §5.3
```

### 7.2 Handoff de frontend para backend

```
[Feature que toca o servidor]
  → frontend identifica: auth? entitlement? consume? checkout? data-export?
  → confere a versão (≥ 2.0) e invoca Agente-MT (contratos) + Agente-BR (§8)
  → se silêncio: §6.3 (stack) + §6.4 (contratos e rotas)
  → registra D-xxx no DOC-10 via PR
  → handoff §6.6
```

### 7.3 Checklist do orquestrador (rodar antes de fechar qualquer tarefa)

| # | Verificação | Passa se… |
| --- | --- | --- |
| 1 | Agentes invocados | A tarefa tocou todos os domínios que ela cruza |
| 2 | Hierarquia aplicada | Nenhum agente respondeu fora do seu domínio |
| 3 | §3 consultado | Nenhum DV-xx conhecido foi reintroduzido |
| 4 | Travas T1 a T9 | Nenhuma violada, inclusive as copiadas do HTML |
| 5 | `[PENDENTE]` respeitado | Nada foi inventado |
| 6 | `[VALIDAR]` e `[RECOMENDADO]` listados | O humano sabe o que decidir |
| 7 | IDs citados | A resposta referencia DS, TP, BR, FL, FN, CL, CN, MT, LG ou DV |
| 8 | Checklist DOC-11 §4 | Só violações listadas |
| 9 | Fiel ao HTML | Estrutura e medidas conferem com o Anexo A; só a dívida foi corrigida |
| 10 | Tipografia ≤ 500 e 4 cores | Confirmado |
| 11 | Sem CDN, sem jargão, sem vermelho | Confirmado |
| 12 | Backend sem foto e na versão certa | Confirmado (se tocou backend) |
| 13 | DOC-10 atualizado | Se houve decisão nova ou conflito de nível 6 ou 7 |

---

## 8. Pendências e `[VALIDAR]` herdados (para não perder)

| Origem | Item | Status |
| --- | --- | --- |
| DOC-03 | **P1** 25 modelos do Roteiro v4 e telas S0–S31 | Aberta |
| DOC-03 | **P2** Valor `k` da assinatura e legibilidade em Mini e Instax Mini | Aberta |
| DOC-03 | **P13** Provedor de pagamento; nota fiscal e reembolso | Aberta (a stack do §6.3 é recomendação) |
| DOC-03 | **P17** Preços da variante B do teste | Aberta |
| DOC-03 | **P18** Revisão jurídica (Termos, cancelamento, arrependimento, uso razoável) e contador | Aberta |
| DOC-03 | **P19** Confirmar 24 h, 30 dias, 100 folhas, sessão de 30 dias, offline de 7 dias | Aberta |
| DOC-10 | **P12** Ajustar `polar-led.css` (C-24, C-32, C-42): relaciona-se com DV-17 e DV-18 | Aberta |
| DOC-10 | **P20** Confirmar D-053 (colagem na 1.1) e D-054 | Nova |
| DOC-06 | **P21** Biblioteca de adesivos (2.0) | Aberta |
| DOC-06 | **P22** Texturas de papel (CL-04) | Aberta |
| DOC-06 | **P25** Tamanhos de pixel das redes | Aberta |
| DOC-07 | **P23** Instagram e Apple: regras e ZIP de dados | Aberta |
| DOC-07 | **P24** Verificação do app Google (console, prazo, limite por sessão) | Aberta |
| DOC-08 | §8 pdf-lib em celular fraco com 100 fotos | Aberta (prova técnica) |
| DOC-09 | **J1 a J10** Dados do controlador, hospedagem, licenças e demais | Aberta |
| DOC-12 | **P26** Dono confirmar DV-20 (estado ativo) e DV-33 (rolagem contida) | Nova |
| DOC-12 | Stack backend e contratos do §6.4 | `[RECOMENDADO]`, vetável pelo dono |
| DOC-12 | DV-01 (visibilidade de Colagem e Lembranças), DV-22 (níveis do chip), DV-26 (conteúdo do HUD) | `[RECOMENDADO]` |
| DOC-12 | Patches PT-01 a PT-14 (§3.4); PT-10 já aplicado (DOC-01 ed. 2.1) | Para aplicar por humano |
| DOC-12 | **P27** barra inferior das capturas · **P28** favicon quadrado · **P29** logo monocromático · **P30** logos em SVG · **P31** foto de capa e microcopy do login · **P11** (ampliada) cores dos logos | Novas (§3.5) |

---

## 9. Changelog

| Edição | Mudança |
| --- | --- |
| 1 | Criação do orquestrador. **HTML como base prioritária do design**, com 9 Travas que o limitam. 47 divergências HTML × MDs verificadas contra os arquivos (DV-01 a DV-47), incluindo conflitos entre E1 e E4b. 12 agentes registrados com prompts e formato AGENT_REPLY. Prompt Mestre com tags, algoritmo de conciliação, autoauditoria, variantes e exemplos resolvidos. Protocolo de frontend com Anexo A (medidas do HTML). Protocolo de backend com versão (só a partir da 2.0), stack `[RECOMENDADO]`, contratos e rotas, incluindo consumo de folha e cancelamento. 9 patches sugeridos aos MDs |
| 2 | **Anexo A** incluído (a edição 1 o citava sem trazê-lo). Mecânica do LED passa a vir do `polar-led.css` (nível 1b da hierarquia, regra de desempate 3b). Layout e anatomia dos HTMLs transportados com medidas para o DOC-01 (ed. 2.1, §4 e §5). Páginas de apresentação e login definidas pelas 2 capturas do Figma. Mapa de logos por nome de arquivo (regra 3c). DV-35 a DV-47, D-066 a D-071, C-59 a C-64, P27 a P31, PT-10 a PT-14. Prompt Mestre, pacote de anexos e protocolo de frontend atualizados |

---

---

## Anexo A · Medidas extraídas dos HTMLs, do CSS e das capturas (resumo)

> Fonte completa e comentada: **DOC-01 §4, §5, §11, §12 e §13**. Este anexo é só a consulta rápida; em divergência vale o DOC-01. Medidas em px, já com as correções das Travas.

### A.1 Casca do editor (E4b, desktop 1440)

| Região | Medida |
| --- | --- |
| Cabeçalho | fixo, altura 64, branco 90% + desfoque, hairline, padding-x 24; logo `Logo_tipografia_lateral.png` h 32 |
| Trilho | fixo, largura 256 (recolhido 72), padding 24×16; itens padding 12×14, raio 12, ícone 20; ativo `#F8F9FA` |
| Conteúdo | padding-left 256, padding-top 64; container máx. 1720, padding 24; fundo `#F8F9FA` |
| Grade | 12 colunas, gap 32; mesa 7, inspetor 5 |
| Mesa | cartão branco raio 14, padding 32 (48 em ≥ 1024), altura mín. 720; grade de pontos 0,75 px / 24 px a 40% |
| HUD | 2 pílulas raio 999, padding 6×14, a 24 do topo e das laterais |
| Polaroid (tela) | máx. 420; padding 20 20 28; foto 1:1; passe-partout padding-top 24; sombra `polaroid` |
| Faixa do lote | cartão branco raio 12, padding 16; miniatura 48×56; ativa 56×64 com anel azul 2 |
| Inspetor | cartão branco raio 14, padding 24, gap 24; sombra `card` |
| Módulos | cartão `#F8F9FA`, raio 14, padding 16, gap 16 |
| Chip de escopo | padding 12, raio 12, fundo `#F8F9FA`, ponto 10 |
| Campos e botões | campo 44; secundário 48 (44 compacto); principal 52 (42 compacto); raio 12 |
| Pé do inspetor | padding-top 12, gap 12; 2 botões iguais em largura |

### A.2 Componentes (E1)

| Componente | Medida |
| --- | --- |
| Interruptor | 44×24, thumb 20, ligado `#006194` |
| Caixa de marcar | 20×20, raio 4 |
| Caixa LED nível 2 | raio 14, anel 1,5 |
| Pop-up nível 3 | raio 14, anel 2,5, largura ≤ 560 |
| Prancha | cartões raio 14, padding 24–32, gap 32, largura 1440 |

### A.3 LED (`polar-led.css` v4, com ajustes)

| Item | Valor |
| --- | --- |
| Anéis | 1 · 1,5 · 2,5 |
| Raios | nível 1 = 8 · níveis 2 e 3 = 14 · botão = 12 |
| Botão | altura 52 (42), padding 0 28, Inter 500 15 |
| Névoa | 5 camadas, 6 s, opacidade 350 ms |
| Pop-up | película branca 80% + blur 2; padding 24; entrada 200 ms |
| Barra | altura 8 (fina 4, página 3); glow blur 8, 55% |

### A.4 Páginas públicas (capturas, celular 390)

| Item | Valor |
| --- | --- |
| Margens laterais | 24 |
| Cabeçalho | altura 72; logo h 40; filete 8% |
| Ritmo vertical | 80 · 32 · 32 · 40 · 48 |
| Rótulo | traço laranja 24×2 + Inter 12/500, caixa alta, 0,2 em |
| Título | Inter 500, 52/52 (login 44/44), −0,04 em; destaque em fonte curada |
| Apoio | Inter 400 18/1,6 |
| Botão | principal claro, altura 52, LED; no login: «Enviar código» |
| Foto de topo (login) | 3:2, largura total, sem raio; faixa escura `#000` com padding 56 24 40 |

### A.5 Logos

| Arquivo | Uso |
| --- | --- |
| `Logo_tipografia_lateral.png` | Cabeçalhos e **assinatura** |
| `logo_oficial_PolarLive.png` | Estados vazios, rodapé, abertura |
| `Logo_favicon_PolarLive.png` | Favicon, trilho recolhido |
| `logo_tipografia_PolarLife.png` | Só em composição com o emblema |
