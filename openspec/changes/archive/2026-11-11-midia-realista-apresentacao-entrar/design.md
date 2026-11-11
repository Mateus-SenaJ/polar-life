## Context

Site estático ES5 sem build, CSP `default-src 'self'` (vale para `media-src`), sem ffmpeg na máquina. Os arquivos realistas chegam depois, pelo dono. Os testes existentes falham com qualquer resposta 404 ou erro de console, então nenhuma página pode apontar para arquivo que ainda não existe.

## Goals / Non-Goals

**Goals:** layout, CSS, JS e testes prontos com os nomes definitivos; troca automática quando os arquivos chegarem (`npm run midia && npm run sw`); nenhuma mudança de layout na troca; acessível e leve.

**Non-Goals:** gerar ou converter mídia; autenticação com servidor.

## Decisions

1. **Lista de arquivos presentes (D-140).** `tools/gerar-midia.mjs` confere os 19 nomes esperados em `site/assets/` e escreve `site/assets/js/ui/midia-arquivos.js` (`window.PLMIDIA_ARQUIVOS = ['video/mesa-polaroids.mp4', …]`, caminhos relativos a `assets/`). O `verificar` falha se a lista estiver desatualizada. Alternativas descartadas: `<source>` fixo no HTML (404 e erro de console até o arquivo chegar); `fetch HEAD` em tempo de execução (também registra erro).
2. **Contrato de marcação (D-140).** Contêiner `.midia[data-midia="<nome>"][data-midia-base="<prefixo até assets/>"][aria-hidden="true"]` com `<video class="midia__video" muted autoplay loop playsinline preload="none" poster tabindex="-1">` sem fonte e `.midia__reserva` (desenho). O `PLMIDIA` acrescenta `<source>` WebM (se existir) e MP4 quando o contêiner entra na tela (`IntersectionObserver`, margem de 200 px), marca `data-midia-estado` e `.is-tocando` no evento `playing`, e pausa fora da tela. No celular (até 1023 px) usa `<nome>-vertical` se existir. O poster definitivo `<nome>-poster.jpg` troca o atributo `poster` e marca `.tem-poster`. Com `prefers-reduced-motion: reduce` ou `navigator.connection.saveData` (ou rede 2g), nenhuma fonte é acrescentada.
3. **Sem salto de layout e transição por máscara (D-141).** O quadro tem proporção definida no CSS: hero 4:5 (celular) e 4:3 (a partir de 1024 px); entrar 16:10 (celular) e o resto da coluna fixa de 100svh (desktop). Vídeo e poster com `object-fit: cover`. No hero, `mask-image` com dois degradês lineares combinados (`mask-composite: intersect`) faz o vídeo sumir no branco; o texto fica acima (`z-index`) e a sobreposição só alcança a zona quase transparente.
4. **Câmera realista (D-142).** Lugares: `<img class="cam-real" data-midia-camera="perfil|frente" hidden>` (HTML) e `<image data-midia-camera display="none">` (SVG), dentro de um ancestral `[data-midia-cam]`. Quando `img/fotos/camera-<vista>.png` existe, o `PLMIDIA` põe o endereço e marca `.tem-camera`; o CSS esconde `.cam-svg` e `.cam-desenho`.
5. **Legendas e fotos de pessoas (D-143).** `<text class="pol-leg|pol-data">` nos SVG embutidos (os arquivos `.svg` avulsos continuam sem texto, regra do `verificar`) e `<figcaption>` nas polaroids em HTML. Cada foto tem `data-midia-foto="<slot>"`; se `img/fotos/<slot>.jpg` existe, entra no lugar da foto CC0.
6. **E-mail e senha (D-144).** Em `pl-contas-teste[email].senha = { alg: 'PBKDF2-SHA256', it: 150000, sal: <32 hex>, hash: <64 hex> }` (WebCrypto `deriveBits`, 256 bits). E-mail normalizado em minúsculas. `PLCONTA.criarConta({nome,email,senha,aceite})`, `entrarComSenha(email,senha)` (resposta igual para e-mail inexistente e senha errada; 5 erros → 30 s, em memória como o código de impressão) e `definirSenha(senha)` (exige a sessão aberta pelo código de 6 dígitos). Senha de 8 a 128 caracteres. Sem WebCrypto: erro «indisponível».
7. **Coluna de mídia da tela de entrar (D-145).** Faixa preta em cima, mídia abaixo; no desktop a coluna é `position: sticky` com 100svh. O `<h1>` deixa de ficar dentro de `aria-hidden`.
8. **Service worker.** Pedidos com `Range` ou de `.mp4`/`.webm` não passam pelo cache do `sw.js`; vídeos não entram em `sw-arquivos.js`.

## Risks / Trade-offs

- Sem JavaScript, a página fica sempre na reserva (poster CC0 + desenho), mesmo com os arquivos presentes → aceitável: é o estado atual, completo e sem erro.
- Modo demonstração: «Esqueci a senha» mostra o código na tela e a entrada por Google/Apple não confere identidade, então a senha não protege a conta de quem usa o mesmo navegador → coerente com o aviso «Ambiente de teste» (D-116); proteção real vem com o servidor.
- Câmera com fundo branco sobre a mesa de madeira ou o banner preto fica com caixa branca → o orquestrador recorta o fundo antes de publicar (PNG com transparência).
- Poster de reserva (`mesa.jpg`) diferente do primeiro quadro do vídeo → o poster definitivo deve ser extraído do vídeo antes de publicar.
- O Chromium do Playwright não toca H.264: o teste simula a chegada dos arquivos com um WebM gravado no próprio navegador; o MP4 real precisa de conferência manual num navegador comum.
