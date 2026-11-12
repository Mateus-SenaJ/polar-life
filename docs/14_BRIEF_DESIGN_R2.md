# Brief de design · rodada 2 · seis telas novas

PolarLive · editor web local-first de polaroids. Brief para implementação em HTML/CSS/JS estático (ES5 em IIFE, `window.PLxxx`, sem build, sem CDN).
Autor: design de produto. Data: 2026-11-09. Status: `[RECOMENDADO]` até veto do dono. Nenhum arquivo do projeto foi alterado por este brief.

Leitura obrigatória antes de codar: `AGENTS.md` (Travas T1–T8), `docs/10_LOG_DECISOES.md` D-112 a D-121, `docs/01_DESIGN_SISTEMA.md` §11–§13, `docs/02_TIPOGRAFIA.md`, `docs/03_REGRAS_DE_NEGOCIO.md` §2–§5, `docs/04_FLUXOS_E_TELAS.md`, `docs/06_COLAGENS_E_LEMBRANCAS.md`, e as páginas `site/index.html`, `site/como-funciona/index.html`, `site/app/index.html`, `site/app/editor/index.html`, `site/app/editor/quadro/index.html`.

---

## 0. O que vale para todas as telas deste brief

### 0.1 Fundamentos (não negociáveis)

| Trava | Como se traduz aqui |
| --- | --- |
| T1 | Inter 300/400/500 (300 só ≥ 16 px), Cormorant Garamond 300/400/500, IBM Plex Mono 400. Fontes expressivas só nas zonas EXC-1 (banners), EXC-3 (frases de sugestão), EXC-4/EXC-5 (apresentação e login), sempre uma da lista curada (Caveat, Reenie Beanie, Shadows Into Light, Cormorant Garamond Itálico, Sacramento, Special Elite), **uma por composição**. Nunca em botão, rótulo, campo, erro, preço, selo. |
| T2 | `#FFFFFF`, `#000000`, `#006194`, `#FD761A`, `#F8F9FA`, e essas mesmas com opacidade. Sobre a faixa preta: texto branco; destaque em laranja; **azul nunca como texto sobre preto** (contraste 3,1:1). Laranja sobre preto tem 7,8:1 e serve até para 12 px. |
| T3 | Todo estado com ícone + texto. Alvos ≥ 44 × 44. `:focus-visible` = anel azul 2 px, offset 3 px (sobre preto, anel branco 2 px). |
| T4 | Nada sobre a foto nas miniaturas de projeto, prévias de modelos e colagens (nem número, nem selo, nem emoji). |
| T5 | Tudo em `localStorage`/`IndexedDB`. O «login» não envia nada. Textos dizem isso sem rodeios. |
| T6 | Ilustrações em `site/assets/img/ilustracoes/` (tarefa 41), ícones em SVG inline (traço 1,5), fontes de `site/assets/fonts/`. |
| T7 | Nenhum «enviamos um e-mail» quando não enviamos; nenhum «pagamento aprovado» sem dizer «simulado»; nenhum «Em breve» sem ser verdade. |
| T8 | **Um** `.led-btn` por tela. Pop-up aberto é outra camada e pode ter o seu. Caixas nível 2: até duas. Toasts/menus nível 1. |

### 0.2 Componentes compartilhados que este brief cria (nomes para o agente de código)

| Peça | Arquivo | Exposição | Uso |
| --- | --- | --- | --- |
| **Faixa escura** (banner preto com texto à esquerda e ilustração) | `css/ui/faixa-escura.css` + `js/ui/banners.js` | `window.PLBANNERS` | T-25, T-28, T-29, T-32 |
| **Selo «Ambiente de teste»** (tira fixa no topo das páginas do app enquanto não há servidor) | `css/ui/selo-teste.css` (sem JS) | — | T-25, T-26, T-27, T-32, T-33 e demais páginas de `/app/` |
| **Conta simulada** | `js/nucleo/conta.js` | `window.PLCONTA` | tudo que lê sessão, plano, folhas, limites |
| **Movimento** (classes utilitárias e fallback por `IntersectionObserver`) | `css/base/movimento.css` + `js/ui/movimento.js` | `window.PLMOVIMENTO` | T-25, T-28, T-29, T-32 |
| **Cabeçalho do app com navegação** (Início · Projetos · Conta) | estende `.app-header` de `home.css` → mover para `css/ui/app-header.css` | — | T-01, T-27, T-32, T-33 |

### 0.3 Selo «Ambiente de teste» (D-116)

- **Forma:** tira de 32 px no topo da página (acima do cabeçalho), fundo `#F8F9FA`, filete inferior 8%, conteúdo centralizado: ícone de frasco de laboratório (SVG inline, traço 1,5, azul) + texto Inter 12/500 preto: **«Ambiente de teste · nada sai deste aparelho»**. No celular 390: **«Ambiente de teste»** (o restante vai para `title` e `aria-description`).
- `role="status"`, não dispensável (é um fato do produto, não um aviso).
- Nunca sobre a faixa preta (DS-17 sem logo e sem pílulas claras). Na T-25 a tira fica acima do cabeçalho branco, como nas demais.
- Sai inteira quando `PLCONTA.modo() === 'servidor'` (uma linha de JS; nenhuma outra tela muda).

### 0.4 Interface `window.PLCONTA` (contrato mínimo; a implementação é simulada hoje e troca por servidor depois)

```js
PLCONTA.modo()                      // 'demo' | 'servidor'
PLCONTA.sessao()                    // null | {email, perfil:'admin'|'gratis'|'avulsa'|'pro', entrouEm}
PLCONTA.pedirCodigo(email)          // Promise<{codigo, expiraEm}>  — no modo demo devolve o código para a tela mostrar
PLCONTA.confirmarCodigo(email, cod) // Promise<sessao> ; rejeita com {tipo:'incorreto'|'expirado'|'tentativas'}
PLCONTA.entrarComo(perfil)          // contas de teste (D-116), sem código
PLCONTA.sair()
PLCONTA.plano()                     // {id:'gratis'|'avulsa'|'pro', nome, preco, fotosPorProjeto, folhasMes, folhasCompradas:{padrao,grande}, usadasMes, renovaEm, assinaturaPodeDesligar}
PLCONTA.direito(nFolhas, classe)    // {ok:true, usaGratis:bool} | {ok:false, motivo:'semConta'|'semFolhas', faltam}
PLCONTA.consumir(nFolhas, classe)   // debita (chamado só após a geração concluída, BR-10)
PLCONTA.comprar(n, classe, metodo)  // Promise<{estado:'confirmado'|'pendente'|'recusado', recibo}>  (simulado; o pop-up tem botões «Simular…»)
PLCONTA.assinarPro(metodo) / PLCONTA.cancelarPro() / PLCONTA.excluirConta() / PLCONTA.exportarDados()  // Blob JSON
PLCONTA.limites() / PLCONTA.admin.salvarLimites(obj) / PLCONTA.admin.restaurarPadroes()
PLCONTA.contasTeste()               // lista para T-25 e T-33
```

Chaves no navegador: `pl-conta` (sessão), `pl-planos` (limites editados pelo admin, `{v:1,…}`), `pl-contas-teste` (estado de cada conta de teste: folhas, usadas, recibos). Padrões em código, nunca inventados na tela: **Grátis** R$ 0 · 1 folha/mês · 24 fotos · assinatura fixa; **Folha avulsa** R$ 2,90 padrão / R$ 5,50 grande · as compradas · 24 fotos · assinatura fixa; **Pro** R$ 14,90/mês · uso razoável 100/mês · 200 fotos · pode desligar a assinatura (DOC-03 §2, `[HIPÓTESE]`).

Contas de teste (e-mails em domínio reservado `.test`, que nunca resolve):

| Perfil | E-mail | Estado inicial `[HIPÓTESE]` |
| --- | --- | --- |
| Admin | `admin@polarlife.test` | Plano Pro + acesso à T-33 |
| Grátis | `gratis@polarlife.test` | 0 de 1 folha usada no mês |
| Folha avulsa | `folha@polarlife.test` | 3 folhas padrão compradas, 0 grandes |
| Pro | `pro@polarlife.test` | 12 de 100 folhas usadas no mês |

### 0.5 Rotas novas

| Tela | Rota | CSS/JS |
| --- | --- | --- |
| T-25 Entrar | `/app/entrar/` | `pages/entrar.css`, `pages/entrar.js` |
| T-32 Início | `/app/inicio/` | `pages/inicio.css`, `pages/inicio.js` |
| T-27 Conta | `/app/conta/` | `pages/conta.css`, `pages/conta.js` |
| T-26 Planos e compra (página) + pop-up do portão | `/app/conta/planos/` e componente `js/ui/portao.js` (`window.PLPORTAO`) | `pages/planos.css`, `ui/portao.css` |
| T-33 Painel do admin | `/app/admin/` | `pages/admin.css`, `pages/admin.js` |

Os botões «Criar minhas polaroids →» (T-28) e «Começar agora →» (T-29) passam a apontar para `/app/inicio/` (hoje: `app/#vazia`). A T-01 continua em `/app/` como lista completa de projetos.

---

## 1. T-25 · Entrar (modo demonstração)

### 1.1 Objetivo
Entrar sem servidor, sem senha e sem mentir sobre isso. A pessoa escolhe uma conta de teste em um toque ou passa pelo fluxo real de e-mail + código (com o código mostrado na tela). Quem não quer conta segue editando (BR-08).

### 1.2 Estrutura

**Celular 390** (de cima para baixo, margens laterais 24):

| # | Bloco | Especificação |
| --- | --- | --- |
| 0 | Selo «Ambiente de teste» | tira 32 (§0.3) |
| 1 | Cabeçalho | 72, branco, `Logo_tipografia_lateral.png` altura 40 à esquerda (link para `/`), filete 8% |
| 2 | Topo ilustrado | `mesa-polaroids.svg` em largura total, sem raio, proporção 16:10 (≈ 390 × 244), fundo `#F8F9FA`. Animação A1 (polaroids pousando) ao carregar. Substitui a foto real enquanto P31/J4 não sai |
| 3 | **Faixa preta (EXC-5, DS-17)** | fundo `#000`, `padding 56 24 40`. Rótulo: traço laranja 24 × 2 + Inter 12/500 caixa alta, espaçamento 0,2 em, **laranja** `#FD761A`: «NÃO DEIXE PARA DEPOIS». Título `margin-top 32`, Inter 500 44/44, −0,04 em, branco: «Seu rolo de câmera está cheio de histórias.» Apoio `margin-top 32`, Inter 400 18/1,6, branco: «Escolha algumas hoje. Um dia, segurar essas fotos vai significar ainda mais.» Link terciário `margin-top 40`, branco sublinhado, Inter 500 18, ícone seta 20, alvo 44: **«Continuar sem conta →»** (vai para `/app/inicio/`). **Sem LED e sem logo na faixa** |
| 4 | **Formulário** | bloco branco `padding 24`, caixa nível 2 (`.led-box.led-box--2`, raio 14, `padding 24`) com, em ordem: título Inter 22/300 «Entrar»; parágrafo Inter 14/400: «Enquanto o PolarLive não tem servidor, a entrada funciona só neste navegador. Não há senha, e nada sai do seu aparelho.»; **rótulo persistente** «E-mail» (Inter 12/500) + campo 44 (`type=email`, `autocomplete=email`, `inputmode=email`); ajuda 13: «Vamos gerar um código de 6 dígitos para você.»; **botão LED** `.led-btn.led-btn--block` «Enviar código» (único LED da tela); linha de links terciários «Privacidade · Termos» |
| 5 | **Contas de teste** | título de seção Cormorant Garamond 400 17: «Contas de teste»; texto 14: «Entre com um toque para ver cada plano.»; 4 botões secundários (`.btn2`, 48, largura total, `gap 12`), cada um com ícone à esquerda + nome + plano em mono 11: «Entrar como Admin» · «Entrar como Grátis» · «Entrar como Folha avulsa» · «Entrar como Pro». Abaixo de cada rótulo, linha mono 11: `admin@polarlife.test · Pro + painel` etc. |
| 6 | Nota de privacidade | caixa Informação (cadeado azul, borda 1 px): «Processamento 100% local. Suas fotos não sobem para nenhum servidor.» |
| 7 | Rodapé | `logo_oficial_PolarLive.png` altura 96 + Privacidade · Termos · Cookies |

**Desktop 1440:** divisão 50/50 em altura total abaixo do selo. **Esquerda** = coluna preta (`#000`) de ponta a ponta: `mesa-polaroids.svg` ocupando os 60% superiores (`object-fit: cover`, animação A1), texto da faixa nos 40% inferiores (`padding 64`), link «Continuar sem conta →». **Direita** = coluna branca: `Logo_tipografia_lateral.png` altura 40 no topo (`padding 32`), caixa nível 2 de **440 px** centralizada verticalmente (formulário + «Contas de teste» dentro da mesma caixa, separados por filete 8% com a palavra «ou» centrada), rodapé legal na base. Só uma caixa nível 2 na tela.

### 1.3 Etapa do código (substitui o conteúdo do formulário, sem trocar de página)

1. Após «Enviar código»: o LED entra em `aria-busy` por 600 ms simulados (rótulo «Enviando…»; T7: o texto da caixa de informação abaixo deixa claro que nada foi enviado).
2. O formulário troca para: título «Confira o código»; texto: «Digitamos para `nome@exemplo.com`.» (link terciário «Trocar e-mail»); **caixa Informação** (cadeado azul, borda 1 px) com o código: «**Ambiente de teste:** seu código é **482 913**. Nada foi enviado; em produção, ele chegaria por e-mail e valeria por 10 minutos.»; rótulo «Código de 6 dígitos» + campo 44 único (`inputmode=numeric`, `autocomplete=one-time-code`, `maxlength=7` aceitando o espaço do meio, mono 18 `tabular-nums`); ajuda 13: «Expira em 9:58» (contagem `aria-live=polite` a cada 30 s, não a cada segundo); LED «Confirmar código»; terciário «Enviar novo código» (ativo após 30 s; antes, desabilitado tracejado com «Disponível em 0:22»).
3. Sucesso: toast nível 1 «Você entrou como Grátis · Ambiente de teste» e redireciona para `/app/inicio/` (ou para a página que pediu login, via `?voltar=`).

### 1.4 Estados

| Estado | O que aparece |
| --- | --- |
| E-mail inválido | Erro sob o campo (borda preta 2 px + ✕ + texto): «Digite um e-mail válido, como nome@exemplo.com.» O LED não fica desabilitado; o erro aparece ao tentar |
| Código incorreto | Erro: «Código incorreto. Confira os 6 dígitos e tente de novo.» Campo mantém o valor, foco volta nele |
| 5 tentativas erradas | Erro: «Muitas tentativas. Peça um novo código para continuar.» LED troca para «Enviar novo código» |
| Código expirado (10 min `[HIPÓTESE]`) | Erro: «Este código expirou. Peça um novo para continuar.» LED troca para «Enviar novo código»; ajuda da expiração some |
| Já entrou e abre a T-25 | Caixa nível 2 mostra: «Você já entrou como `gratis@polarlife.test` (Grátis).» com «Ir para o Início» (LED) e «Sair» (secundário) |
| Vindo do portão (`?voltar=exportar`) | Mesmo formulário; após entrar volta ao pré-voo/exportação |
| Sem suporte a `localStorage` | Erro no topo da caixa: «Este navegador não guarda dados locais, então a entrada de teste não funciona aqui. Você ainda pode editar e ver o preview.» + link «Continuar sem conta →» |
| Movimento reduzido | `mesa-polaroids.svg` já pousada; nenhum crossfade |

### 1.5 Textos finais (pt-BR)
Listados acima. Microcopy do formulário era `[PENDENTE]` no DOC-01 §12.2; estas frases fecham a pendência `[RECOMENDADO]` até o dono revisar.

### 1.6 Travas e decisões que afetam a tela
T1 (título Inter 500, nunca 700 da captura), T2 (rótulo laranja sobre preto), T3, T5, T7 («nada foi enviado»), T8 (único LED «Enviar código»), DS-17, D-112 (anel da caixa nível 2 gira a 10 s), D-115 (hover do LED), D-116, D-117, DOC-01 §12.2 e §12.3, DOC-02 EXC-5 (sem destaque expressivo no título desta tela: igual à referência do dono; destacar é `[LIVRE]`), DOC-03 §4, CN-07 (ver conflito C-d).

---

## 2. T-32 · Início (depois do login, e também sem login)

### 2.1 Objetivo
Primeira página do app. Em dez segundos: um empurrão emocional (faixa preta), o caminho de volta ao que a pessoa estava fazendo, ideias prontas para começar (modelos com emoji) e o que dá para fazer com as fotos além do papel (colagens). A página é a mesma com ou sem conta (BR-08); só o cabeçalho muda.

### 2.2 Estrutura

**Desktop 1440** (largura máxima 1280, margem 32, grade de 8):

| # | Bloco | Especificação |
| --- | --- | --- |
| 0 | Selo «Ambiente de teste» | §0.3 |
| 1 | **Cabeçalho do app** 64 | `Logo_tipografia_lateral.png` 32 à esquerda; navegação central: «Início» (ativa: azul + sublinhado 2 px + ícone casa), «Projetos» (`/app/`); à direita: «Conexões» (secundário, já existe) e **«Conta · Grátis»** (secundário com ícone de cartão de identificação; sem avatar de pessoa, D-104) ou **«Entrar»** quando não há sessão |
| 2 | **Faixa preta com banners (EXC-1, DS-17)** | altura 520 desktop; grade 12 colunas: texto nas colunas 1–5 (`padding 64 0`), ilustração `banner-*.svg` (1200 × 500) preenchendo as colunas 5–12 pela direita com `object-fit: cover` e `object-position: right center`. Dentro do texto: rótulo (traço laranja + Inter 12/500 caixa alta laranja), título Inter 500 48/1,05 −0,03 em branco com **uma expressão em Caveat 500 laranja** (a fonte expressiva desta composição), apoio Inter 400 18/1,6 branco, **botão LED claro** `.led-btn.led-btn--light` «Começar agora →» (único LED da página; rótulo e destino **não mudam** com o banner), link terciário branco próprio de cada banner. Na base da faixa, à esquerda: 3 pontos de navegação (alvo 44 cada, `role=tablist`, rótulos «Banner 1 de 3: Imprimir»…) e botão «Pausar/Retomar» (ícone + texto, 44). Ritmo: §2.3 |
| 3 | **«Continue de onde parou»** | título de seção Cormorant Garamond 400 **28** (desktop) / 24 (celular) + à direita link terciário «Ver todos os projetos →» (`/app/`). Até **3 cartões** (`shadow-card`, raio 14, `padding 16`), em linha: prévia 96 × 116 (polaroid branca em miniatura com a primeira foto do projeto, nada sobre a foto; sem foto, janela `#F8F9FA` pontilhada como no hero), nome (Inter 16/500), meta mono 11 «24 fotos · 6 folhas A4 · Clássico 88 × 107 mm», «Editado há 2 dias» (Inter 13), botão secundário «Abrir» (44). Ordem: mais recente primeiro |
| 4 | **«Sugestões de design»** | título 28 + apoio Inter 16: «Modelos prontos: formato, fonte e estilo da legenda já combinados. Troque o que quiser depois.» Grade de **4 × 2** cartões (celular: rolagem horizontal com `scroll-snap`, 2 por tela). Anatomia do cartão: §2.4 |
| 5 | **«Colagens para as redes»** | título 28 + apoio: «As mesmas polaroids, em imagem para compartilhar. Não gastam folha.» 3 colunas por formato (Feed 1:1 · Retrato 4:5 · Stories 9:16), 2 cartões em cada. Anatomia: §2.5 |
| 6 | Nota de privacidade | caixa Informação: «Processamento 100% local. Suas fotos não sobem para nenhum servidor.» |
| 7 | Rodapé do app | Privacidade · Termos · Cookies (igual à T-01) |

**Celular 390:** mesma ordem. Cabeçalho 64 com logo + «Conta»/«Entrar»; a navegação «Início · Projetos · Conta» vira **barra inferior fixa** de 56 px + `safe-area-inset-bottom` (3 itens, ícone 24 + rótulo Inter 12/500, ativo = azul + sublinhado 2 px, alvos 44, só nas páginas T-01, T-27, T-32, T-33; nunca no editor nem nas públicas). Faixa preta: ilustração no topo (altura 200, `object-position: 70% center`) e texto abaixo (`padding 40 24 40`), título 36/1,05, LED `--block`. Seções com `padding 48 24`. Cartões de projeto empilhados; modelos e colagens em carrossel horizontal com `scroll-snap` e indicação de «arraste» pelo próprio corte do segundo cartão.

### 2.3 Banners da faixa preta (3, rotação)

| # | Ilustração | Rótulo | Título (expressão em Caveat laranja em **negrito**) | Apoio | Link terciário do banner |
| --- | --- | --- | --- | --- | --- |
| 1 | `banner-imprimir.svg` | NÃO DEIXE PARA DEPOIS | Seu rolo de câmera está cheio de **histórias.** | Escolha algumas hoje. Um dia, segurar essas fotos vai significar ainda mais. | «Como imprimir em casa →» (`/como-funciona/`) |
| 2 | `banner-design.svg` | PRONTO PARA USAR | Um modelo para cada **ocasião.** | Praia, aniversário, viagem: fonte, formato e legenda já combinados. É só trocar as fotos. | «Ver sugestões de design ↓» (rola até a seção 4) |
| 3 | `banner-colagem.svg` | PARA COMPARTILHAR | As mesmas fotos, prontas para o **feed.** | Monte uma colagem com suas polaroids e compartilhe em imagem. Não gasta folha. | «Ver colagens ↓» (rola até a seção 5) |

- **Ritmo:** troca automática a cada **8 s** (mesma duração do anel LED, D-112, para não criar dois pulsos); transição `crossfade` 500 ms com `--ease`, a ilustração entra com `translateX(16px → 0)`. Pausa com `:hover`, `:focus-within`, toque e quando a aba não está visível (`document.hidden`). Para de girar depois de uma interação manual (pontos ou «Pausar»). Com `prefers-reduced-motion`: **sem rotação automática**, troca instantânea pelos pontos; o botão «Pausar» não aparece.
- `aria-roledescription="carrossel"`, `aria-live="off"` enquanto gira sozinho e `polite` após ação manual.
- O LED «Começar agora →» leva a `/app/novo-projeto/` (T-02). Com zero projetos, o rótulo é o mesmo.

### 2.4 Sugestões de design: os 8 modelos (D-120)

Anatomia do cartão (`shadow-card`, raio 14, `padding 16`, largura 280 desktop / 240 celular): prévia da polaroid (ilustração `polaroid-*.svg` 88 : 107 com a **legenda renderizada em HTML por cima da faixa branca, nunca sobre a janela**, na fonte do modelo e com o emoji como texto); nome do modelo com o emoji (Inter 16/500; o emoji é parte do nome, não ícone de controle); linha mono 11: formato + estilo; frase de uso (Inter 13): ocasião; botão secundário 44 «Usar este modelo» (sem emoji no botão, DS-14). Ao usar: cria projeto na T-02 com formato pré-selecionado e grava em `pl-quadro` o estilo pronto, a fonte, a cor e o texto sugerido de cada linha; a pessoa ainda escolhe papel e fotos.

| # | Nome · emoji | Formato (FN-03) | Fonte da legenda (catálogo EXC-2) | Estilo pronto | Cor | Texto sugerido | Para quê |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **Praia 🌊** | Clássico 88 × 107 | Shadows Into Light | Manuscrito | Azul | «Dias de sol 🌊» · data `jul/26` | Férias, verão, mar |
| 2 | **Serra 🏔️** | Retro Pocket 66 × 99 | Special Elite | Bilhete | Preto | linha 1 «Campos do Jordão - SP» · linha 2 «14/07/26» · texto «Ar da serra 🏔️» (3 linhas, D-113 permite) | Montanha, frio, estrada |
| 3 | **Cidade 🌆** | Instax Mini 54 × 86 | Courier Prime | Etiqueta | Preto | «Noite na cidade 🌆» | Rolê urbano, viagem a capitais |
| 4 | **Pôr do sol 🌅** | Instax Wide 108 × 86 | Sacramento | Simples | Laranja | «Fim de tarde 🌅» | Paisagens horizontais, céu |
| 5 | **Aniversário 🎂** | Instax Square 72 × 86 | Dancing Script | Contornada | Azul | «Mais um ano 🎂» · data `14 de julho` | Festa, presente de aniversário |
| 6 | **Viagem ✈️** | Clássico 88 × 107 | Caveat | Pin de local | Preto | local «Campos do Jordão, SP» em destaque · texto «Até a próxima ✈️» | Roteiro com várias cidades |
| 7 | **Nós dois ❤️** | Mini quadrado 60 × 73 | Allura | Simples | Preto | «Nós dois ❤️» | Casal, presente a dois |
| 8 | **Neste dia 📅** | Clássico 88 × 107 | Cutive Mono | Calendário | Azul | data `14.07.26` em destaque · texto «Pra lembrar 📅» | Aniversário de data, retrospectiva |

- Ilustrações: 1 → `polaroid-praia.svg`, 2 → `polaroid-montanha.svg`, 3 → `polaroid-cidade.svg`, 4 → `polaroid-por-do-sol.svg`, 5 → `polaroid-aniversario.svg`, 6 → `polaroid-viagem.svg`. **7 e 8 não têm ilustração na tarefa 41**: usar a janela `#F8F9FA` pontilhada (padrão do hero) ou pedir à tarefa 41 `polaroid-casal.svg` (duas xícaras/dois guarda-sóis, sem pessoas) e `polaroid-calendario.svg` (folha de calendário plana). Ver conflito C-p.
- Emoji na tela: fonte de emoji do sistema (`font-family` da legenda, depois `'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji'`). No PDF: imagem rasterizada ≥ 600 PPI (D-120, MT-07). Licença do glifo do sistema `[VALIDAR P3]`; alternativa sem risco: empacotar os 8 emojis como SVG do Noto Emoji (Apache 2.0) em `assets/img/emoji/`.
- Determinismo: os 8 modelos são dados versionados em `js/nucleo/modelos.js` (`window.PLMODELOS`), não inventados na tela; D-061.

### 2.5 Colagens para as redes: 6 sugestões

Anatomia do cartão: prévia na proporção do formato (`colagem-feed.svg` 1:1, `colagem-retrato.svg` 4:5, `colagem-stories.svg` 9:16; altura comum 240 desktop), **frase EXC-3 em Caveat 500 22 px preto** (uma fonte para a seção inteira), nome do layout (Inter 14/500) + mono 11 com pixels, botão secundário «Montar colagem». Todas as frases são curtas e acolhedoras (DOC-06 §5).

| Formato | Nome (layout DOC-06 §4) | Frase EXC-3 | Pixels |
| --- | --- | --- | --- |
| Feed 1:1 | Mural do mês | «Tudo o que cabe em nove quadros.» | 1080 × 1080 |
| Feed 1:1 | Mesa espalhada | «Do jeito que ficaram na mesa.» | 1080 × 1080 |
| Retrato 4:5 | Capa e destaques | «Uma foto grande e as que vieram junto.» | 1080 × 1350 |
| Retrato 4:5 | Linha do tempo | «O mês, na ordem em que aconteceu.» | 1080 × 1350 |
| Stories 9:16 | Varal | «Um varal para os dias de sol.» | 1080 × 1920 |
| Stories 9:16 | Tira | «Quatro fotos, uma história só.» | 1080 × 1920 |

Enquanto a T-15 (Modo Colagem, 1.1) não existir: cada cartão mostra selo neutro «Em breve» (pílula `#F8F9FA`, ícone relógio + texto) **no lugar do botão**, e o apoio da seção ganha a frase «Em preparação: a colagem chega na próxima versão.» Nada de botão que não faz nada (T7).

### 2.6 Estados

| Estado | O que aparece |
| --- | --- |
| Sem projetos | A seção 3 vira um único cartão largo: ícone + «Nenhum projeto ainda» + «Escolha um modelo abaixo ou toque em Começar agora.» (sem botão: o LED já está na faixa) |
| 1–3 projetos | Cartões; sem o link «Ver todos» quando ≤ 3 |
| > 3 projetos | 3 cartões + «Ver todos os projetos →» |
| Sem sessão | Cabeçalho com «Entrar»; faixa, modelos e colagens iguais. Nenhum convite agressivo: a conta só importa ao exportar (BR-08) |
| Admin | Cabeçalho ganha o link «Painel» (`/app/admin/`) ao lado de «Conta · Admin» |
| Carregando | Esqueleto `esqueleto.css` (branco com brilho azul, nunca cinza) para os cartões de projeto; faixa e modelos são estáticos e aparecem de imediato |
| Movimento reduzido | Sem rotação automática; sem revelação por rolagem; prévias já no estado final |

### 2.7 Travas e decisões
T1 (Caveat só na expressão do título do banner e nas frases EXC-3), T2, T3 (pontos do carrossel com rótulo), T4 (prévias dos projetos sem nada sobre a foto), T5, T7 («Em breve» honesto; «não gasta folha» é regra D-054), T8 (único LED «Começar agora →» na faixa), DS-14 (emoji só como texto de nome e legenda), DS-17/D-117, D-118, D-120, D-104 (sem avatar), D-054 (colagens não consomem folha), D-061 (sugestões determinísticas), DOC-02 EXC-1 e EXC-3, DOC-06 §3–§5.

---

## 3. T-27 · Conta e T-26 · Direito de uso e compra (simulados)

### 3.1 T-27 Conta · objetivo
Ver o plano, as folhas e os recibos; sair; cancelar; exportar e excluir. Sem pressão de venda (DOC-03 §9).

### 3.2 T-27 · estrutura (desktop: coluna única de 720 centralizada; celular: largura total, `padding 24`)

| # | Bloco | Conteúdo |
| --- | --- | --- |
| 0–1 | Selo + cabeçalho do app | «Conta» ativa na navegação |
| 2 | Título | h1 igual ao da T-01 («Seus projetos»): «Conta» |
| 3 | **Cartão «Você»** | e-mail (Inter 16/500) · «Entrou em 9 de novembro de 2026» · pílula do perfil «Conta de teste · Grátis» · botão secundário «Sair» |
| 4 | **Cartão «Plano»** | nome + preço (Inter 22/300 «Grátis · R$ 0» / «Pro · R$ 14,90 por mês»); linha de folhas em mono 11 + Inter 14: Grátis «1 de 1 folha grátis disponível em novembro · Renova em 1º de dezembro»; Folha avulsa «3 folhas padrão · 0 folhas grandes»; Pro «12 de 100 folhas usadas em novembro · uso razoável»; linha de fotos «Até 24 fotos por projeto»; assinatura: «Assinatura PolarLive nas polaroids: sempre ligada» (Grátis/Avulsa) ou interruptor «Desligar a assinatura PolarLive» (Pro; muda o padrão de novos projetos). **Botão LED** (único da tela) só para Grátis e Folha avulsa: «Ver folhas e planos →» (`/app/conta/planos/`). Pro: sem LED; botão secundário «Cancelar assinatura» (§3.4) |
| 5 | **Cartão «Recibos»** | lista (data mono 11 · descrição Inter 14 · valor mono): «09/11/2026 · 3 folhas padrão · R$ 8,70» … Botão terciário por linha «Ver recibo» (abre caixa nível 2 com os dados e a frase «Recibo de teste. Em produção, o recibo chega por e-mail e pode ser baixado aqui.»). Vazio: «Nenhum recibo ainda.» |
| 6 | **Cartão «Seus dados»** | «Exportar meus dados» (secundário, baixa `polarlife-conta-AAAAMMDD.json` com e-mail, plano, folhas e recibos; ajuda: «Suas fotos e projetos já estão no seu aparelho e não entram neste arquivo.») · «Excluir conta» (secundário com lixeira, nunca LED) |
| 7 | Rodapé do app | Privacidade · Termos · Cookies |

Admin: cartão extra «Painel do admin» com texto «Limites de plano e contas de teste.» e botão secundário «Abrir painel».

### 3.3 T-27 · pop-ups (nível 3, cada um com o seu LED na opção segura, padrão D-082)

| Pop-up | Título (Inter 22/300) | Texto | Ações |
| --- | --- | --- | --- |
| Cancelar o Pro (1º toque abre; 2º confirma) | «Cancelar o Pro?» | «Você continua com o Pro até 9 de dezembro. Depois, a conta volta ao plano Grátis e a assinatura PolarLive volta a aparecer nas polaroids.» Se contratou há < 7 dias: linha extra «Como você assinou há menos de 7 dias, o valor é devolvido por inteiro. `[VALIDAR com advogado]`» | **LED «Manter o Pro»** · secundário «Cancelar assinatura» |
| Excluir conta | «Excluir sua conta de teste?» | «Folhas, créditos e recibos desta conta serão apagados deste navegador. Seus projetos e fotos continuam no aparelho.» | **LED «Manter conta»** · secundário com lixeira «Excluir conta» |
| Sair | sem pop-up | toast «Você saiu. Seus projetos continuam neste aparelho.» | — |

### 3.4 T-27 · estados
Grátis com folha usada: «0 de 1 folha grátis · Renova em 1º de dezembro» + mensagem Atenção (ícone laranja + texto) «Sua folha grátis deste mês já foi usada.» · Pro em 80/100: Atenção «Você usou 80 das 100 folhas do uso razoável deste mês.» · Pro em 100: Atenção «Você chegou às 100 folhas deste mês. Pode continuar exportando; vamos olhar o uso com calma.» (sem bloqueio, DOC-03 §4) · Pro cancelado: «Pro até 9 de dezembro · depois, Grátis» + secundário «Reativar o Pro» · Sem sessão: redireciona para `/app/entrar/?voltar=conta`.

### 3.5 T-26 · Direito de uso e compra · objetivo
Portão **pré-voo → conta → direito → compra → gerar** (DOC-03 §4), sem travar quem só edita. Existe como **pop-up** (`PLPORTAO.abrir(nFolhas, classe)`, chamado pelo LED do pré-voo/exportação) e como **página** `/app/conta/planos/` (chegada pela T-27).

### 3.6 T-26 · pop-ups do portão (`.led-dialog`, 560)

| Situação (`PLCONTA.direito`) | Título | Texto | Ações |
| --- | --- | --- | --- |
| `semConta` | «Entrar para gerar o arquivo» | «Editar e ver o preview são sempre livres. Para gerar as folhas, entre com sua conta.» | **LED «Entrar»** (→ T-25 com `?voltar=exportar`) · secundário «Voltar» |
| `ok, usaGratis` | sem pop-up | linha Informação na T-19 Exportar: «Esta exportação usa sua folha grátis de novembro.» | — |
| `ok` com créditos | sem pop-up | linha: «Esta exportação usa 6 das suas 8 folhas compradas.» | — |
| `semFolhas` (Grátis) | «Sua folha grátis foi usada» | «Este arquivo tem 6 folhas. Compre as folhas de que precisa ou assine o Pro.» | **LED «Comprar 6 folhas · R$ 17,40»** · secundário «Assinar o Pro · R$ 14,90/mês» · terciário «Voltar» |
| `semFolhas` (Avulsa, faltam N) | «Faltam 3 folhas» | «Você tem 3 folhas e este arquivo precisa de 6.» | **LED «Comprar 3 folhas · R$ 8,70»** · secundário «Assinar o Pro» · terciário «Voltar» |

Pagamento (segunda etapa do mesmo pop-up): rótulo «Como pagar» + lista de rádio (Cartão · Pix · Boleto), **sem nenhum campo de cartão**; caixa Informação: «Ambiente de teste: nenhum dado de pagamento é pedido. Escolha abaixo o que simular.»; três botões secundários «Simular pagamento aprovado» · «Simular Pix pendente» · «Simular pagamento recusado». **LED «Pagar R$ 17,40 (teste)»** só fica ativo quando um dos três é escolhido (até aí: tracejado). Estados:

| Estado | Forma |
| --- | --- |
| Confirmado | Sucesso (borda preta 1 px + ✓ azul): «Pagamento confirmado · 6 folhas na conta» + LED «Continuar a exportação» |
| Pendente (Pix/boleto) | Informação com relógio: «Aguardando pagamento. Seu projeto está salvo; você pode voltar depois.» + código Pix fictício em mono (claramente «código de teste») + secundário «Simular confirmação» · terciário «Voltar ao projeto». Ao confirmar: toast «Pagamento confirmado: continuar a exportação» com ação |
| Recusado | Erro (borda preta 2 px + ✕): «O pagamento não foi aprovado.» + secundário «Tentar de novo» |

Créditos só entram após «confirmado» (DOC-03 §8 a). `PLCONTA.consumir` roda só quando a T-20 conclui (BR-10).

### 3.7 T-26 · página `/app/conta/planos/`
Título «Folhas e planos»; apoio «Editar e ver o preview são sempre livres. O que se compra são as folhas exportadas.»; 3 cartões em linha (celular: empilhados) lendo `PLCONTA.limites()`: **Grátis** (R$ 0 · 1 folha por mês · até 24 fotos por projeto · assinatura PolarLive ligada), **Folha avulsa** (R$ 2,90 a folha padrão · R$ 5,50 a grande · até 24 fotos · assinatura ligada; campo numérico «Quantas folhas» 1–50 com +/-; segmentado «Padrão · Grande»; total em mono «5 folhas padrão · R$ 14,50»), **Pro** (R$ 14,90 por mês · folhas à vontade, uso razoável de 100 por mês · até 200 fotos · pode desligar a assinatura · arrependimento em 7 dias). O cartão do plano atual ganha chip «Seu plano». Os cartões são `radio` grandes (um grupo); **um só LED** na base: «Continuar» → abre a etapa de pagamento do §3.6. Chip de ajuda «Valores de teste» ao lado do título enquanto `modo === 'demo'`.

### 3.8 Travas e decisões
T2 (sem vermelho no «recusado»), T3, T5, T7 («(teste)», «Simular…», nunca «aprovado» sem adjetivo), T8 (T-27: LED só para não-Pro; pop-ups com LED na opção segura), DS-04, DS-06, D-035 a D-049 (portão e conta), D-054, D-082 (padrão destrutivo), D-093 (T-19 só com pré-voo válido), D-116, DOC-03 §2–§5 e §8, BR-08, BR-10.

---

## 4. T-33 · Painel do admin

### 4.1 Objetivo
Editar os limites dos planos (fotos por projeto, folhas, preços) e o estado das contas de teste, tudo guardado neste navegador, para o dono testar o portão e a Conta com números diferentes sem mexer no código.

### 4.2 Acesso
Só `perfil === 'admin'`. Outro perfil ou sem sessão: página mostra estado vazio «Só a conta Admin abre este painel.» com secundário «Entrar como Admin» (chama `PLCONTA.entrarComo('admin')`). Rota `noindex` como todo `/app/`.

### 4.3 Estrutura (desktop: 1120 centralizado, 3 colunas para os planos; celular: empilhado)

| # | Bloco | Conteúdo |
| --- | --- | --- |
| 0–1 | Selo + cabeçalho | «Painel» ativo |
| 2 | Título + apoio | «Painel do admin» · «Os valores abaixo valem só neste navegador e alimentam a Conta, o portão de exportação e o aviso de fotos na importação.» · chip «Alterações não salvas» (ícone + texto) aparece quando há edição pendente |
| 3 | **Três cartões de plano** (Grátis · Folha avulsa · Pro) | Cada cartão: título Cormorant 400 17 com o nome; campos abaixo |
| 4 | **Contas de teste** | tabela (desktop) / cartões (celular): Nome · E-mail (mono) · Plano (select; Admin fixo em Pro, desabilitado com explicação) · Folhas padrão compradas (numérico 0–99) · Folhas grandes compradas (numérico 0–99) · Usadas no mês (numérico 0–999) · botão secundário «Zerar mês» · «Entrar como» (secundário) |
| 5 | **Pé de ação fixo** (`position: sticky; bottom`) | secundário «Restaurar padrões» · **LED «Salvar alterações»** (único) |

Campos por plano (tipo de controle escolhido pela regra do §6):

| Campo | Grátis | Folha avulsa | Pro | Controle |
| --- | --- | --- | --- | --- |
| Fotos por projeto | 24 | 24 | 200 | numérico +/- · 1–500 · passo 1 (Shift: 10) · unidade «fotos» |
| Folhas grátis por mês | 1 | — | — | numérico +/- · 0–10 |
| Folhas por compra (pacotes oferecidos) | — | «1, 5, 10» | — | campo de texto com lista de números separados por vírgula, validação «Use números inteiros de 1 a 50 separados por vírgula.» `[RECOMENDADO]`; alternativa: 3 numéricos |
| Preço da folha padrão (R$) | — | 2,90 | — | numérico +/- · 0,00–99,90 · passo 0,10 · prefixo «R$» dentro do campo · `inputmode=decimal` · vírgula como separador |
| Preço da folha grande (R$) | — | 5,50 | — | idem |
| Preço mensal (R$) | — | — | 14,90 | idem |
| Uso razoável (folhas por mês) | — | — | 100 | numérico +/- · 10–1000 · passo 10 |
| Avisar em (% do uso razoável) | — | — | 80 | select: 50 % · 70 % · 80 % · 90 % |
| Pode desligar a assinatura PolarLive | desligado | desligado | ligado | interruptor |
| Dia de renovação do grátis | «1º do mês» | — | — | texto fixo (DOC-03 §3), não editável; mostra «Renova em 1º de cada mês (fuso de Brasília)» |

### 4.4 Comportamento
- Edição não aplica nada até «Salvar alterações» (LED). Salvar grava `pl-planos` e mostra toast «Limites salvos neste navegador · Desfazer» (desfazer restaura o estado anterior por 8 s).
- Sair da página com alterações pendentes: pop-up «Sair sem salvar?» com **LED «Continuar editando»** e secundário «Sair sem salvar».
- «Restaurar padrões»: pop-up «Restaurar os valores padrão?» · «Os números do DOC-03 voltam para os três planos e as contas de teste voltam ao estado inicial. Nada muda nos seus projetos.» · **LED «Manter como está»** · secundário «Restaurar padrões».
- Validação ao vivo (debounce 80 ms, FN-00c): erro = borda preta 2 px + ✕ + texto («Use um número inteiro entre 1 e 500.»). Atenção (ícone laranja) quando Pro < Grátis em fotos: «O Pro tem menos fotos por projeto que o Grátis. Tem certeza?» (não bloqueia).
- Tudo que a T-27, a T-26 e o aviso de limite na importação (T-03/T-05, D-027) mostram vem de `PLCONTA.limites()`; nada é copiado em código de tela.

### 4.5 Travas e decisões
T2 (nenhuma cor de estado; interruptor ligado azul), T3 (44 px nos +/-; «Zerar mês» é botão com texto), T5, T7 (texto do apoio deixa claro o alcance), T8 (LED «Salvar alterações»; pop-ups com LED na opção segura), DS-04 (LED nunca em controle), DS-05, D-082, D-116, DOC-03 §2–§3 (padrões), FN-00a/FN-00c (campo 44, unidade dentro, debounce).

---

## 5. Revisão da T-28 Apresentação e da T-29 Como funciona

### 5.1 Princípio
As faixas pretas entram como **pausas de intenção**, nunca como fundo geral: uma por página, com texto curto e uma ilustração grande à direita (referência: a captura do dono e a tela inicial do Claude, em que o preto delimita um bloco e o resto respira em branco). O hero da T-28 segue claro (DOC-01 §12.1). O editor continua 100% claro.

### 5.2 T-28 · nova ordem

| # | Bloco | Desktop 1440 | Celular 390 |
| --- | --- | --- | --- |
| 1 | Cabeçalho 72 | logo 40 à esquerda; à direita «Entrar» (terciário, → `/app/entrar/`) e «Criar minhas polaroids» é só no hero (não repetir no cabeçalho para manter um LED) | só o logo |
| 2 | **Hero claro** (como hoje) | texto 7/12; coluna 5/12 recebe `camera-instantanea.svg` (largura 420) com **A2** (a polaroid sai da fenda) e, pousadas ao lado, `polaroid-praia.svg` e `polaroid-viagem.svg` em `shadow-polaroid`/`lifted`, giradas −5° e 4°. Substitui o `.stack` de 3 polaroids pontilhadas | câmera abaixo do link «Ver como funciona», altura 220, centralizada |
| 3 | **Faixa preta 1** (nova, DS-17) | grade 12: texto 1–5 (`padding 96 0`), `banner-imprimir.svg` 6–12. Rótulo laranja «NÃO DEIXE PARA DEPOIS», título Inter 500 48 branco «Seu rolo de câmera está cheio de histórias.», apoio «Escolha algumas hoje. Um dia, segurar essas fotos vai significar ainda mais.», **link terciário branco** «Começar agora →» (→ `/app/inicio/`). Sem LED aqui (T8: o LED da página é o do hero). Parallax **A4** na ilustração | ilustração no topo (altura 200), texto abaixo, `padding 40 24` |
| 4 | **«Como fica na mesa»** (nova, branca) | título Cormorant 400 32 + `mesa-polaroids.svg` em largura total (máx. 1120) com **A1** por rolagem; abaixo, três colunas de fatos (ícone + Inter 16): «Seis formatos de polaroid, do Clássico ao Instax Wide» · «Legenda, data e local em fontes feitas para o papel» · «PDF em tamanho real para imprimir em casa ou na gráfica» | mesa em 16:10, fatos empilhados |
| 5 | Nota de privacidade | caixa Informação (cadeado): «Processamento 100% local. Suas fotos não sobem para nenhum servidor.» | igual |
| 6 | Rodapé | `logo_oficial_PolarLive.png` 96 + Privacidade · Termos · Cookies | igual |

### 5.3 T-29 · nova ordem

| # | Bloco | Mudança |
| --- | --- | --- |
| 1 | Cabeçalho | igual |
| 2 | Intro (coluna esquerda fixa no desktop) | abaixo do apoio, `rolo-filme.svg` decorativo (largura 240, opacidade 100%, `aria-hidden`), com **A4** leve |
| 3 | Passos 1–4 | cada passo ganha uma ilustração de 96 px à direita do texto (desktop) / acima (celular): 1 `camera-instantanea.svg` · 2 trio `polaroid-cidade.svg` + `polaroid-montanha.svg` + `polaroid-praia.svg` em escala (formatos) · 3 `polaroid-aniversario.svg` com a legenda «Dia de rolê» em Caveat renderizada em HTML na faixa branca (**A3** revelação da foto ao entrar na tela) · 4 `polaroid-viagem.svg` com guias de corte tracejadas finas em volta (D-121: 1 px, 4/3, 45%). Revelação **A6** em cascata |
| 4 | Nota de privacidade | igual |
| 5 | **Faixa preta de fechamento** (nova) | é a tradução direta da captura do dono: rótulo laranja «NÃO DEIXE PARA DEPOIS», título «Seu rolo de câmera está cheio de histórias.», apoio «Escolha algumas hoje. Um dia, segurar essas fotos vai significar ainda mais.», **botão LED claro «Começar agora →»** (`.led-btn--light`; é o único LED da T-29, movido de onde está hoje), ilustração `banner-design.svg` à direita. O botão «Começar agora» branco de hoje sai do bloco branco |
| 6 | Rodapé | igual |

### 5.4 Movimento (6 animações; todas com `--ease: cubic-bezier(.2,.7,.2,1)`, nunca bloqueiam leitura, nunca passam de 1,5 s, nunca se repetem em loop)

| ID | Animação | Onde | Gatilho | Duração · easing | Implementação | `prefers-reduced-motion` |
| --- | --- | --- | --- | --- | --- | --- |
| **A1** | **Polaroids pousando na mesa** | `mesa-polaroids.svg` (`#mesa-p1`…`#mesa-p7`) na T-28 §4, T-25 topo | entrar na tela (rolagem) ou carregar (T-25) | 600 ms cada, escalonadas 90 ms (p1→p7); `translateY(−40px) rotate(±8° a mais que o final) opacity 0 → estado final` | `@supports (animation-timeline: view())`: `animation-timeline: view(); animation-range: entry 10% entry 70%`. Fallback: `IntersectionObserver` (limiar 0,3) adiciona `.is-in` uma vez. As transformações usam `transform-box: fill-box; transform-origin: center` em cada `<g>` | estado final desde o início; nenhuma transformação |
| **A2** | **Câmera soltando a polaroid** | `camera-instantanea.svg` (`#cam-foto`) no hero da T-28 e passo 1 da T-29 | 400 ms após `DOMContentLoaded` (hero) ou ao entrar na tela (T-29) | flash: `#cam-flash` opacity 0→1→0 em 120 ms; polaroid: `translateY(0 → 58% da própria altura)` em 1 400 ms, `cubic-bezier(.2,.7,.2,1)`; uma vez por carregamento | classe `.is-out` no SVG inline (o SVG precisa estar inline ou em `<object>` para animar partes; recomendação: **inline via `fetch` local** em `movimento.js`, com cache em `sessionStorage`) | polaroid já para fora; sem flash |
| **A3** | **Revelação como filme instantâneo** | janela de qualquer `polaroid-*.svg` (`<g id="…-cena">`) | entrar na tela, uma vez | 2 400 ms, `ease-out`; cena começa com `opacity 0.08; filter: blur(6px) brightness(1.6)` sobre janela `#F8F9FA` e vai a `opacity 1; filter: none`. Nada de sépia (T2): só opacidade, desfoque e brilho | classe `.is-dev` via IO; `will-change: opacity, filter` só durante a animação | cena revelada |
| **A4** | **Parallax leve** | ilustração das faixas pretas e `rolo-filme.svg` | rolagem contínua | deslocamento total 24 px (`translateY(12px → −12px)`) ao longo da passagem do bloco pela viewport | `animation-timeline: view(); animation-range: cover 0% cover 100%; animation-timing-function: linear`. Sem fallback (quem não suporta não vê parallax) | sem parallax |
| **A5** | **Transição entre páginas** | T-28 ↔ T-29 ↔ T-25 ↔ T-32 (navegação MPA) | clique em link interno | 220 ms; `::view-transition-old(root)` fade-out e `::view-transition-new(root)` fade-in + `translateY(8px → 0)`; o logo do cabeçalho recebe `view-transition-name: logo` (fica parado); o botão LED, `view-transition-name: cta` (desliza para a nova posição) | `@view-transition { navigation: auto; }` no CSS de todas essas páginas; só um elemento por nome em cada página (na T-25 o `cta` é «Enviar código»). Navegadores sem suporte: navegação normal | `::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none }` |
| **A6** | **Revelação de seções por rolagem** | títulos, cartões de modelo/colagem (T-32), passos (T-29), fatos (T-28) | entrar na tela | 450 ms; `opacity 0 → 1; translateY(16px → 0)`; irmãos escalonados 60 ms (máx. 6, depois sem atraso) | `animation-timeline: view(); animation-range: entry 0% entry 40%` + fallback IO; classe utilitária `.mov-rise` | sem animação (conteúdo visível) |

Também valem, já decididas: anel LED girando (8 s botão, 10 s caixa/pop-up; D-112), «brilho que atravessa» no hover (D-115), rotação dos banners (§2.3). Regra geral: ao mesmo tempo, no máximo **uma** animação de cena (A1/A2/A3) e **um** anel girando por viewport; o resto é micro (≤ 350 ms).

Critérios de implementação: `movimento.css` define as `@keyframes` e as classes `.mov-*`; `movimento.js` (`window.PLMOVIMENTO`) faz o `IntersectionObserver` e o inline dos SVGs. Sem bibliotecas (T6). Testar em Chromium com `--force-prefers-reduced-motion` e conferir que nenhuma classe `.is-*` é aplicada.

### 5.5 Travas e decisões
T1, T2 (ilustrações já na paleta; A3 sem cor), T3 (nada depende de animação para ser entendido), T6 (SVGs locais), T7 (fatos da §5.2 só dizem o que o 1.0 faz), T8 (T-28: LED no hero; T-29: LED na faixa de fechamento), DS-17/D-117, D-112, D-115, D-118, D-121 (guias na ilustração do passo 4), DOC-01 §12.1 (hero claro mantido), §12.3 (sem logo na faixa), §2 movimento (150–350 ms para UI; as cenas são exceção GUIADA, 600–1 400 ms), §6 (ilustrações sem cor fora da paleta).

---

## 6. Princípios para os controles do inspetor (Papel · Fotos · Ajustes · Legendas · Molduras · Metadados)

### 6.1 Regra de escolha (decida nesta ordem)

| Pergunta | Se sim → controle | Anatomia (DOC-01 §5) |
| --- | --- | --- |
| 1. É **ligar/desligar** algo que já está descrito pelo rótulo e tem efeito imediato e reversível? | **Interruptor** (`.sw`, 44 × 24, ligado azul). O rótulo é um substantivo ou uma frase verdadeira quando ligado («Guias de corte», «Mostrar data»). Nunca para ação (isso é botão), nunca para 3 estados | `.sw-row` com rótulo + ajuda à esquerda |
| 2. São **2 a 4 opções excludentes**, todas cabem numa linha (rótulo ≤ 14 caracteres) e a troca muda a prévia na hora? | **Segmentado** (`.seg`, trilho `#F8F9FA`, ativo preto/branco). No celular 390: até 3 por linha; 4 opções viram duas linhas de 2 ou um select | `role=radiogroup` |
| 3. São **5 ou mais opções**, ou cada opção precisa de descrição («A4 (210 × 297 mm) — Recomendado (4 por folha)»), ou a lista pode crescer? | **Seleção** (`.sel` + `<select>`, 44, ícone `expand_more`) | item no padrão DV-06 |
| 4. É um **número que a pessoa conhece ou quer digitar com exatidão**, com unidade física (mm, pt, °, em, horas, R$) e passo definido? | **Campo numérico com +/-** (`.num`, 44, unidade dentro do campo, botões 44, ajuda com a faixa) | `inputmode=decimal`; passo do +/- = o menor passo útil; Shift × 10 |
| 5. É um **valor perceptivo** que se ajusta olhando a foto, em faixa contínua simétrica (−100…+100) ou 0…100, em que o número é secundário? | **Deslizador com valor digitável** (`.sl`, marcas nos pontos úteis, duplo clique no cursor = padrão, setas ±1, Shift ±10) | sempre acompanhado do número e de «Resetar» |
| 6. É **escolher uma fonte**? | Seletor de fonte do catálogo (DOC-02 §4), nunca select simples | amostra na própria fonte |
| 7. É **marcar várias** ou **confirmar** dentro de um formulário? | Caixa de marcar (20 × 20, azul com ✓) | «Replicar», «Substituir ajustes individuais», «Revisei e quero continuar» |
| 8. É uma **ação**? | Botão secundário (ou terciário «Resetar» no cabeçalho do campo) | nunca interruptor |

Regras transversais: rótulo persistente (nunca placeholder); unidade dentro do campo; ajuda abaixo com a faixa («De 8 a 32 pt.»); «Resetar» por controle aparece só quando o valor difere do padrão; etiqueta «Valores diferentes» no cabeçalho em escopo múltiplo (D-110); debounce 80 ms em numéricos, imediato em interruptores e segmentados (FN-00c); LED nunca em controle (DS-04); rótulos das abas e títulos de seção em Cormorant Garamond 400, 15 e 17 px, caixa normal; números e medidas em IBM Plex Mono (D-114).

### 6.2 Aplicação por aba

| Aba | Interruptor | Segmentado | Seleção | Numérico +/- | Deslizador |
| --- | --- | --- | --- | --- | --- |
| **Papel** (T-07) | Girar para caber mais · Separar por orientação · Guias de corte · Contorno da polaroid (desabilitado com guias ligadas, FN-02) · Rodapé da folha · Assinatura PolarLive · **Polaroid sem textos (atalho, D-119)** | Orientação da folha (Retrato · Paisagem) · Alinhamento do bloco · Comprimento das guias (Contínua · Marcas de canto) · Cor da guia (Preto · Azul · Laranja) | Papel (A3…Personalizado, com descrição) | Largura e Altura do papel personalizado (mm, passo 10) · Margem da folha (mm) · Entre polaroids (mm) | — |
| **Fotos** (faixa do lote, T-14) | — | Ordenar (Data · Nome · Manual) se ≤ 3; senão select | «Mostrar» (Todas · Esta folha · Selecionadas · Com ressalvas · Ajustadas) → select | — | — |
| **Ajustes** (T-08/T-11) | Mostrar a foto inteira · Comparar antes/depois | Modo (Preencher · Encaixar) · Grade (Nenhuma · Terços · Diagonais) · Filtros (Todos · Favoritos) | — | — (o zoom é híbrido: deslizador com número digitável) | Zoom 100–400 % com marcas 100 · 165 · 400 · Endireitar −15°…+15° (passo 0,1; número digitável obrigatório) · Brilho, Contraste, Saturação, Temperatura, Realces, Sombras (−100…+100, marca em 0) · Nitidez, Vinheta (0…100) · Intensidade do filtro (0…100 %) |
| **Legendas** (T-10) | **Polaroid sem textos (D-119, no topo)** · Mostrar texto livre · Mostrar data · Mostrar local · Ajustar para caber | Caixa (Normal · MAIÚSC. · Capitalizada) · Onde fica (Abaixo · Acima · Ambas) · Estado (Sigla · Nome · Oculto) · País (Oculto · Nome · Código) · Ordem (Cidade, Estado · Estado, Cidade) · Data e local (Na mesma linha · Em linhas separadas) · Ordem das linhas (Data primeiro · Local primeiro) · Medir espaços por (Caixa do texto · Topo das letras) · Cor da inscrição (Preto · Azul · Laranja) | Formato da data (13 opções) · Origem da data · Origem do local · **Separador** (Vírgula · Ponto · Traço · Barra · Hífen = 5 → select) · Estilo pronto (8 → grade de cartões com miniatura, não select; cabe como «segmentado em grade» 2 × 4) · Fonte → seletor do catálogo | Tamanho (pt, 8–32, passo 1) · Espaçamento (em, −0,05…0,3, passo 0,01) · Deslocar na horizontal e na vertical (mm, −5…+5, passo 0,1) · Inclinação (°, −5…+5, passo 0,5) | — (a inclinação é pequena e exata: numérico, não deslizador) |
| **Molduras** (T-12) | Manter proporções do formato · Margem uniforme (cadeado) · Réguas na mesa | Orientação da polaroid (Vertical · Horizontal) · Unidade (mm · cm · pol) · atalhos Faixa inferior (Fina · Média · Clássica · Extra), Margens (Fina · Instax · Clássica · Larga), Cantos (Reto · Fino · Suave · Redondo) — 4 opções: no celular, 2 linhas | Formato (7 opções com medidas → select; a troca abre o pop-up D-086) · Proporção da janela (1:1 … 16:9, 6+ → select) | Largura/altura externa · Largura/altura da janela · Margem lateral · Faixa superior · Faixa inferior · Cantos arredondados (todos em mm, passo 0,5; cantos 0–6) | — |
| **Metadados** (T-13) | — | — | Origem (Do aparelho · Câmera · Apple Fotos · Não informada → select, lista cresce) | Somar ou subtrair horas (h, −48…+48, passo 1) | — |

### 6.3 Interruptor «Polaroid sem textos» (D-119)

- **Onde:** primeira linha da aba **Legendas**, antes de «Estilos prontos», como `.sw-row` destacado com filete 8% abaixo. **Atalho** na aba **Papel**, dentro da seção «Rodapé e assinatura» (renomeada para **«Textos e assinatura»**), acima de «Assinatura PolarLive». Os dois são o mesmo estado (`leg.semTextos`, por foto, aplicado no escopo do chip).
- **Rótulo:** «Polaroid sem textos». **Ajuda:** «Esconde texto, data e local das polaroids deste escopo. Nada é apagado; desligue para trazer tudo de volta.»
- **Comportamento:** ligado ⇒ as seções Texto livre, Data e Local ficam recolhidas e desabilitadas (tracejado 1 px, opacidade 60%) com a linha «Textos escondidos por “Polaroid sem textos”.»; os interruptores «Mostrar…» mantêm o valor que tinham. Prévia, T-07 e PDF não desenham nenhuma linha. O pré-voo deixa de apontar «data ou local vazio com linha ligada» para essas fotos. A **assinatura segue a regra do plano** (não é texto da legenda).
- **Escopo:** respeita o chip (Somente esta · Selecionadas · Esta folha · Todas). Em escopo múltiplo com valores mistos, o interruptor mostra estado misto (`aria-checked="mixed"`, traço no lugar do círculo) + etiqueta «Valores diferentes»; um toque liga para todas, outro desliga.
- Entra no desfazer (FN-00c). Com o Retro Pocket (D-113), ligado some com as duas linhas padrão também.

---

## 7. Conflitos encontrados e solução proposta

| ID | Conflito | Solução `[RECOMENDADO]` |
| --- | --- | --- |
| **C-a** | Referência do dono (LED «Começar agora →» dentro da faixa preta + barra de abas «Início · Editor · Referências») × DOC-01 §12.2 e DV-46 (no login o LED é «Enviar código»; a barra não é adotada) × T8 | A composição da captura vira **a faixa de fechamento da T-29** (com o LED) e **a faixa da T-32** (com o LED). Na T-25 o LED segue «Enviar código» e a faixa leva o link «Continuar sem conta →». Na T-28 a faixa leva link (o LED é o do hero). A barra de abas entra **só dentro do app, no celular**, como «Início · Projetos · Conta» (nunca «Referências», que não existe) |
| **C-b** | §12.2 manda o rótulo da faixa em **branco**; a captura do dono mostra **laranja** | Laranja `#FD761A` sobre preto (7,8:1). Atualizar §12.2 |
| **C-c** | DS-17 e §12.3-6 falam em «fotos reais» na faixa e «sem ilustração colorida»; a tarefa 41 cria ilustrações na paleta para substituir a foto (P31/J4 pendente) | Ilustrações **na paleta** são permitidas nas faixas e no topo da T-25 (§6 só proíbe cor fora da paleta). Ampliar DS-17: «fotos reais ou ilustrações da paleta» |
| **C-d** | DOC-03 §4 e CN-07: login com Apple e Google × modo demonstração sem servidor (D-116) | Os botões Apple/Google **não aparecem** no modo demo (mostrá-los sem função viola T7). `PLCONTA.provedores()` devolve `[]`; quando devolver `['apple','google']`, a caixa os desenha acima do campo de e-mail com os ativos oficiais (slot já previsto no CSS) |
| **C-e** | DS-14 «sem emoji em controles» × D-120 (modelos com emoji) | Emoji só como **texto** (nome do modelo e legenda na prévia). Nenhum emoji em botão, aba ou chip. PDF: raster ≥ 600 PPI; licença do glifo `[VALIDAR P3]`, alternativa Noto Emoji (Apache 2.0) empacotado |
| **C-f** | DOC-03 §9: valores entre colchetes enquanto hipótese × interface com «R$ [14,90]» ilegível | O selo «Ambiente de teste» e o chip «Valores de teste» (T-26) substituem os colchetes na tela; os colchetes ficam na documentação |
| **C-g** | D-118 «Início depois do login» × BR-08 (editar nunca exige conta) | T-32 abre com ou sem sessão; só o cabeçalho muda («Entrar» ↔ «Conta · Plano») |
| **C-h** | T-01 «Seus projetos» × T-32 «Início» (duas homes) | T-32 é a chegada (CTAs públicos apontam para ela); T-01 fica como lista completa, acessível por «Projetos»/«Ver todos». O LED «Novo projeto» da T-01 continua (outra tela) |
| **C-i** | T-32 oferece colagens × T-15 só existe na 1.1 | Cartões com selo «Em breve» no lugar do botão; apoio explícito. Trocar por «Montar colagem» quando a T-15 existir |
| **C-j** | DOC-02 define EXC-5 como «banners da área de login»; os banners da T-32 estão no app | Banners da T-32 são **EXC-1** («no app»). Nada a mudar no DOC-02 |
| **C-k** | D-116 fala em «folhas por mês» para todos os planos; Folha avulsa não tem mês | Campos diferentes por plano (§4.3): Grátis «por mês», Avulsa «pacotes e preços», Pro «uso razoável» |
| **C-l** | DOC-02 §2 (abas em Plex Mono caixa alta) × D-114 (Cormorant 400) | Vale D-114; o orquestrador atualiza o DOC-02 §2 e TP-07 |
| **C-m** | DS-03 «fundo branco» no app × faixa preta na T-32 | D-117 já amplia DS-17 para a página Início; a faixa fica **só** na T-32 (nunca no editor, pop-ups ou Conta) |
| **C-n** | §13-2 proíbe logo sobre preto (sem versão branca, P29) × faixa de ponta a ponta na T-25 desktop | Logo fica na coluna branca (direita); a coluna preta não tem logo. No celular o cabeçalho branco fica acima da faixa |
| **C-o** | Mensagem «Informação» é FIXA com cadeado azul (DOC-04 §5); a caixa do código precisa de um «aviso de teste» | Usar o próprio cadeado: a mensagem reforça que nada saiu do aparelho. Sem ícone novo |
| **C-p** | Oito modelos × seis ilustrações `polaroid-*.svg` | Modelos 7 e 8 usam janela pontilhada `#F8F9FA` ou a tarefa 41 recebe `polaroid-casal.svg` e `polaroid-calendario.svg` (sem pessoas, só objetos planos) |
| **C-q** | §12.2 pede foto de topo 3:2 na T-25; `mesa-polaroids.svg` é 16:10 | Aceitar 16:10 (390 × 244); diferença de 16 px, sem recorte |
| **C-r** | DOC-01 §2 fixa movimento em 150–350 ms × animações de cena (A1–A3) de 600–1 400 ms | Tratar as cenas como exceção **GUIADA** (§6 permite «propor animações que respeitem reduced-motion»); registrar em decisão nova: UI ≤ 350 ms, cena ≤ 1 500 ms, nunca em loop |
| **C-s** | DOC-01 §3 define só «Principal claro» para a faixa escura; a T-28 precisa de uma ação secundária sobre preto | **Link terciário branco** (sublinhado 1 px, offset 5, alvo 44). Não criar botão secundário sobre preto |
| **C-t** | Expiração do código (10 min), 5 tentativas, 30 s para reenviar, 600 ms de «envio» | Todos `[HIPÓTESE]`; acrescentar à P19 |

---

## 8. Checklist de aceite (para o agente de código e para o orquestrador)

1. `npm run verificar` termina com «✔ Sem erros»; nenhum recurso externo (T6); nenhum hex fora da paleta.
2. Cada tela: **um** `.led-btn` (contar com `document.querySelectorAll('.led-btn:not([hidden])')` fora de pop-ups fechados); pesos ≤ 500; fontes expressivas só nos lugares deste brief.
3. Alvos ≥ 44 em: pontos do carrossel, +/- dos numéricos, links terciários, «Zerar mês», barra inferior do celular.
4. `prefers-reduced-motion: reduce`: nenhuma classe `.is-in/.is-out/.is-dev`, carrossel parado, sem view transitions.
5. T-25: código aparece na tela e o texto diz que nada foi enviado; estados «incorreto», «expirado», «tentativas» visíveis por `#estado-…` para revisão.
6. T-26: nenhum campo de cartão; botões «Simular…»; créditos só após «confirmado»; `PLCONTA.consumir` só após a T-20 concluir.
7. T-33: salvar grava `pl-planos`; T-27, T-26 e aviso de importação refletem a mudança sem recarregar o código.
8. Interruptor «Polaroid sem textos» igual nas abas Legendas e Papel; prévia, T-07 e PDF sem linhas; desfazer funciona; estado misto em escopo múltiplo.
9. Teste Node + Playwright `tests/e2e/testar-entrar.mjs`, `testar-inicio.mjs`, `testar-conta.mjs`, `testar-admin.mjs`, `testar-movimento.mjs` (com `--force-prefers-reduced-motion` numa das execuções). Saídas em `tests/saida/`.
10. Nada em `docs/` é alterado pelo agente de código; as mudanças de documento propostas (C-b, C-c, C-l, C-r) ficam para o orquestrador.
