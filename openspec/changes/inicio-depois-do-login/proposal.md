## Why

O dono pediu (D-118, D-120, 2026-11-09) uma página «Início» depois do login, com banners em faixa preta, «Continue de onde parou», modelos prontos com emoji e colagens para as redes, com movimento discreto. As ilustrações do Fable já existem em `site/assets/img/ilustracoes/` e ainda não são usadas. Esta é a parte A da tarefa 40; a parte B (Apresentação e Como funciona animadas, banners que simulam o produto) vem depois.

## What Changes

- Componentes compartilhados (brief `docs/14_BRIEF_DESIGN_R2.md` §0.2): `site/assets/css/ui/faixa-escura.css`, `site/assets/js/ui/banners.js` (`window.PLBANNERS`: rotação a cada 8 s, pausa no hover e no foco, controles acessíveis, sem rotação com movimento reduzido), `site/assets/css/ui/movimento.css` + `site/assets/js/ui/movimento.js` (`window.PLMOV`: entradas com `animation-timeline: view()` e alternativa `IntersectionObserver`; View Transitions entre páginas do app).
- Nova rota `site/app/inicio/` (T-32), que exige sessão (D-123), seguindo o brief §2: banners da faixa preta com `banner-imprimir.svg`, `banner-design.svg` e `banner-colagem.svg`; «Continue de onde parou» com o projeto salvo mais recente (PLPROJETOS); 8 modelos prontos (§2.4); 6 colagens com selo «Em breve»; estados do §2.6; navegação Início · Projetos · Conta (barra inferior no celular).
- Aplicar um modelo grava formato e estilo da legenda no projeto atual (ou cria um projeto) e abre o editor. **O emoji do modelo aparece no cartão, mas não é inserido no texto da legenda** até existir a saída de emoji no PDF (Editor v3, Fase 4; D-120 completa).
- Depois de entrar, a pessoa cai no Início (não mais na lista de projetos).

## Capabilities

### New Capabilities
- `inicio`: página Início depois do login, banners, modelos prontos e movimento compartilhado.

### Modified Capabilities
(nenhuma)

## Impact

- Novos: `site/app/inicio/index.html`, `site/assets/css/pages/inicio.css`, `site/assets/js/pages/inicio.js`, os 4 componentes compartilhados, `tests/e2e/testar-inicio.mjs`.
- Alterados: destino padrão depois do login (`site/assets/js/ui/guarda.js` e `site/assets/js/pages/entrar.js`), cabeçalho das páginas do app com «Início», lista do service worker (`npm run sw`).
- Fora do escopo: T-28/T-29 animadas e banners de simulação (parte B); emoji dentro da legenda e no PDF; colagens funcionando (T-15).
