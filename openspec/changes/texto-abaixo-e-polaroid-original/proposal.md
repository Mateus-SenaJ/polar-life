## Why

O dono decidiu (D-135, D-136, 2026-11-10) que a edição começa com um interruptor «Polaroid original» (só a foto e a moldura) e que todo texto fica **abaixo** da foto, alinhado à Esquerda, ao Centro ou à Direita, nas mesmas margens laterais da foto. Hoje o motor ainda aceita as posições «acima» e «ambas», o deslocamento horizontal manual (`dx`) e a chave antiga `leg.limpa` (D-119). Esta mudança é a fundação do Editor v3 (docs/13_EDITOR_V3.md, Fases 0 e 1): muda dados e motor sem trocar a casca do editor.

## What Changes

- Novo campo do projeto `leg.original` (substitui `leg.limpa`): ligado, a polaroid mostra só foto + moldura na tela, nas folhas, no pré-voo e no PDF; desligar devolve tudo (nada é apagado). A assinatura segue o plano.
- Novo campo `leg.al` = `'esq' | 'centro' | 'dir'`; nova função única `PLTEXTO.alinharX(al, L, JW, w)` usada pela tela e pelo gerador do PDF (MT-02).
- **BREAKING (dados)**: removidos `leg.pos` («acima», «ambas») e `leg.dx`; o texto sempre sai na faixa inferior. `PLTEXTO.migrar(leg)` converte projetos antigos (idempotente) ao abrir e ao importar `.polarlife`.
- `PLTEXTO.assinaturaPos(leg, fr)` substitui `assinaturaDir`: no modo automático a assinatura vai para o canto oposto ao texto (D-129 reduzida pela D-136).
- Aba Legendas atual: «Polaroid original» como primeiro controle; seção Posição vira botões de seleção Esquerda · Centro · Direita; somem «Acima», «Ambas» e «Deslocar na horizontal».
- Pré-voo não acusa área segura de texto com «Polaroid original» ligada.

## Capabilities

### New Capabilities
- `legenda-polaroid`: texto da polaroid (legenda, data, local), sua posição, alinhamento, a «Polaroid original» e a posição da assinatura, iguais na tela e no PDF.

### Modified Capabilities
(nenhuma — ainda não há specs registradas em openspec/specs/)

## Impact

- Código: `site/assets/js/nucleo/legenda-texto.js` (PLTEXTO), `site/assets/js/nucleo/gerador.js` (layoutLegenda), `site/assets/js/editor/legendas.js`, `site/assets/js/editor/prevoo.js`, `site/assets/js/pages/editor.js`, `site/assets/js/pages/quadro.js`, `site/assets/js/nucleo/projetos.js` (importar), CSS de legendas/quadro.
- Testes: novo `tests/unit/testar-legenda-migracao.mjs` (Node) e `tests/e2e/testar-texto-alinhado.mjs` (Playwright); os testes de PDF/MT-02 com «acima»/«ambas» (`testar-pdf.mjs`) passam a cobrir os três alinhamentos.
- Decisões: D-135, D-136; revoga as posições da D-129 e a chave da D-119; propõe registrar a remoção de `dx` (FN-07) como decisão.
- Fora do escopo: a casca nova do Editor v3 (Fase 2), stickers e emojis (Fase 4), renomear abas (proposta 7.5 do Fable).
