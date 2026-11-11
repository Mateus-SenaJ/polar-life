## 1. Componentes compartilhados

- [ ] 1.1 `site/assets/css/ui/faixa-escura.css` (brief §0.2): faixa preta com sobretítulo laranja em caixa alta precedido de traço, título Inter branco grande, texto branco, botão `led-btn--light`
- [ ] 1.2 `site/assets/js/ui/banners.js` (`window.PLBANNERS`): rotação 8 s, pausa em hover e foco, botões anterior/próximo e indicadores com `aria-label`, sem rotação com movimento reduzido
- [ ] 1.3 `site/assets/css/ui/movimento.css` + `site/assets/js/ui/movimento.js` (`window.PLMOV`): entradas ao rolar (`animation-timeline: view()` com alternativa `IntersectionObserver`), View Transitions entre páginas do app; movimento reduzido = estado final

## 2. Página Início (T-32)

- [ ] 2.1 `site/app/inicio/index.html` + `site/assets/css/pages/inicio.css` + `site/assets/js/pages/inicio.js` seguindo o brief §2 (estrutura, textos, banners com os SVG do Fable, «Continue de onde parou» com PLPROJETOS, 8 modelos §2.4, 6 colagens «Em breve» §2.5, estados §2.6); `noindex`; guarda de sessão
- [ ] 2.2 Aplicar modelo: grava `ST[0].fr` e `ST[0].leg` (via `PLTEXTO.migrar`) no projeto atual ou novo e abre `../editor/quadro/`; emoji só no cartão
- [ ] 2.3 Destino padrão depois de entrar = `app/inicio/`; «Início» no cabeçalho do app (barra inferior no celular, brief §2.2)

## 3. Verificação

- [ ] 3.1 `tests/e2e/testar-inicio.mjs` (Playwright, login de teste no addInitScript): todos os cenários da spec `inicio`; capturas 1440 e 390 em `tests/saida/inicio/`; acrescentar ao `testar:node`
- [ ] 3.2 Rodar `npm run sw`, `npm run verificar` e `npm run testar:node` (saída 0) e registrar a saída real
