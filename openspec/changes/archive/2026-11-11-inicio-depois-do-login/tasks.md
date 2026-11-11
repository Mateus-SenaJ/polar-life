## 1. Componentes compartilhados

- [x] 1.1 `site/assets/css/ui/faixa-escura.css` (brief §0.2): faixa preta com sobretítulo laranja em caixa alta precedido de traço, título Inter branco grande, texto branco, botão `led-btn--light`
- [x] 1.2 `site/assets/js/ui/banners.js` (`window.PLBANNERS`): rotação 8 s, pausa em hover e foco, botões anterior/próximo e indicadores com `aria-label`, sem rotação com movimento reduzido
- [x] 1.3 `site/assets/css/ui/movimento.css` + `site/assets/js/ui/movimento.js` (`window.PLMOV`): entradas ao rolar (`animation-timeline: view()` com alternativa `IntersectionObserver`), View Transitions entre páginas do app; movimento reduzido = estado final

## 2. Página Início (T-32)

- [x] 2.1 `site/app/inicio/index.html` + `site/assets/css/pages/inicio.css` + `site/assets/js/pages/inicio.js` seguindo o brief §2 (estrutura, textos, banners com os SVG do Fable, «Continue de onde parou» com PLPROJETOS, 8 modelos §2.4, 6 colagens «Em breve» §2.5, estados §2.6); `noindex`; guarda de sessão
- [x] 2.2 Aplicar modelo: grava `ST[0].fr` e `ST[0].leg` (via `PLTEXTO.migrar`) no projeto atual ou novo e abre `../editor/quadro/`; emoji só no cartão
- [x] 2.3 Destino padrão depois de entrar = `app/inicio/`; «Início» no cabeçalho do app (barra inferior no celular, brief §2.2)

## 3. Verificação

- [x] 3.1 `tests/e2e/testar-inicio.mjs` (Playwright, login de teste no addInitScript): todos os cenários da spec `inicio`; capturas 1440 e 390 em `tests/saida/inicio/`; acrescentar ao `testar:node`
- [x] 3.2 Rodar `npm run sw`, `npm run verificar` e `npm run testar:node` (saída 0) e registrar a saída real

### Notas da implementação

- **Faixa e banners** (`ui/faixa-escura.css` + `ui/banners.js`): a faixa tem 520 px no desktop (ilustração `object-fit: cover` à direita, texto nas colunas 1–5) e, no celular, ilustração em cima (200 px) e texto abaixo; os 3 banners ficam na mesma célula da grade (crossfade de 500 ms). O LED «Começar agora →» é **um elemento só** (T8): ele é movido para o banner visível, e o rótulo/destino não mudam com a rotação. A rotação para com o cursor em cima, com o foco dentro, no toque e com a aba escondida; depois de uma ação manual (ponto ou «Pausar») ela não volta sozinha. Com movimento reduzido: sem rotação, botão de pausa escondido e troca instantânea pelos pontos.
- **Movimento** (`ui/movimento.css` + `ui/movimento.js`): `.mov-rise` revela as seções ao rolar (450 ms, escalonado 60 ms) com `animation-timeline: view()` e, onde o navegador não suporta, com `IntersectionObserver` (`.is-in`); com movimento reduzido nenhuma classe é aplicada. O opt-in de View Transitions (`@view-transition { navigation: auto; }`) foi ligado nas páginas do app e nas públicas para a transição de 220 ms não deixar erro de navegação quando o destino também participa.
- **Cabeçalho do app**: `ui/app-header.css` (novo) traz a navegação «Início · Projetos» no centro do cabeçalho e a barra inferior de 56 px do celular (T-01, T-27, T-32 e T-33). O cabeçalho da T-32 mostra «Conta · <plano>» (ou «Entrar») e o link «Painel» para a conta Admin.
- **Aplicar um modelo**: grava `ST[0].fr` (formato do catálogo de molduras) e `ST[0].leg` (preset, fonte, cor, texto e linhas de data/local do modelo, com `PLTEXTO.migrar`) no `pl-quadro` do projeto atual — ou cria um projeto novo com o modelo — e abre `../editor/quadro/`. O emoji fica no nome do modelo; o texto da legenda (estilo e texto sugerido) nunca leva emoji (D-120: a saída de emoji no PDF só chega na fase 4 do Editor v3).
- **Testes**: `tests/e2e/testar-contas.mjs` passou a esperar `/app/inicio/` como destino padrão depois de entrar (o fluxo com `?voltar=` continua voltando para o caminho guardado).
- **Botões públicos**: por causa do brief §0.5, «Criar minhas polaroids →» (T-28) e «Começar agora →» (T-29) passaram a apontar para `app/inicio/` (antes `app/#vazia`).
