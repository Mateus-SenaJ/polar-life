## Why

A tela de entrar (T-25) ainda mostra uma mesa provisória com polaroids pontilhadas (placeholders). O Fable desenhou a ilustração definitiva `site/assets/img/ilustracoes/mesa-polaroids.svg` (sete polaroids `mesa-p1…mesa-p7` e a câmera com a foto saindo, prontas para animar). O dono confirmou que a tela de entrar precisa de ajustes; este é o primeiro.

## What Changes

- Trocar o SVG provisório da `.ent__mesa` pela ilustração `mesa-polaroids.svg`, embutida no HTML (para animar cada grupo pelo CSS, sem requisição extra e sem JS).
- Manter a animação de «pousar» das polaroids (`mesa-pousa`, uma após a outra) e acrescentar a foto saindo da câmera (`mesa-cam-foto`, translateY), ambas desligadas com `prefers-reduced-motion`.
- Enquadramento: a mesa preenche o painel esquerdo no desktop e a faixa superior no celular, sem distorcer (proporção 16:10, corte central).

## Capabilities

### New Capabilities
- `tela-entrar`: apresentação visual da tela de entrar (ilustração e animação).

### Modified Capabilities
(nenhuma)

## Impact

- `site/app/entrar/index.html` (troca o `<svg class="mesa">`), `site/assets/css/pages/entrar.css` (animações), `npm run sw` (lista do service worker).
- Fora do escopo: textos, botões e fluxo de login (já entregues); outros ajustes que o dono ainda vai descrever.
