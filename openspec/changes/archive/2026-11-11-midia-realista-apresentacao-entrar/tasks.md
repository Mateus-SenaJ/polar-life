## 1. Base de mídia

- [x] 1.1 `tools/gerar-midia.mjs` + `npm run midia`: gera `site/assets/js/ui/midia-arquivos.js` com os arquivos esperados que existem; `--checar` no `tools/verificar.mjs` (teste: `npm run verificar`)
- [x] 1.2 `site/assets/js/ui/midia.js` (`window.PLMIDIA`): vídeo sob demanda, poster, movimento reduzido, economia de dados, câmera e fotos de pessoas (teste: `tests/e2e/testar-midia.mjs`, parte B)
- [x] 1.3 `site/assets/css/ui/midia.css`: quadro, reserva, câmera realista e legendas manuscritas (teste: `testar-midia.mjs`)
- [x] 1.4 `site/app/sw.js`: vídeo e pedidos parciais fora do cache; `npm run sw` (teste: `tests/e2e/testar-pwa.mjs`, `npm run verificar`)
- [x] 1.5 `tests/helpers/servidor.mjs`: tipos de `.jpg`, `.webp`, `.mp4`, `.webm` e `.md`

## 2. Apresentação e Como funciona

- [x] 2.1 `site/index.html` + `site/assets/css/pages/apresentacao.css`: vídeo ao lado do título com máscara, reserva com câmera e polaroids legendadas (teste: `testar-midia.mjs` parte A, `testar-apresentacao.mjs`)
- [x] 2.2 `site/index.html`: legendas e datas na mesa e no banner, sem rabiscos; lugares das fotos de pessoas e da câmera (teste: `testar-midia.mjs`, `testar-ilustracoes-fotos.mjs`)
- [x] 2.3 `site/como-funciona/index.html`: lugar da câmera de frente no passo 1 (teste: `testar-midia.mjs`, «como funciona com os arquivos»)

## 3. Tela de entrar

- [x] 3.1 `site/app/entrar/index.html` + `site/assets/css/pages/entrar.css`: faixa preta em cima, mídia abaixo (vídeo do varal; reserva = mesa), `<h1>` exposto, legendas na mesa (teste: `testar-entrar-mesa.mjs`, `testar-midia.mjs`)
- [x] 3.2 `site/assets/js/nucleo/conta.js`: `criarConta`, `entrarComSenha`, `definirSenha` com PBKDF2-SHA-256 e sal; provedores Google e Apple (teste: `testar-contas.mjs`, parte C)
- [x] 3.3 `site/assets/js/pages/entrar.js` + HTML sem JavaScript: primeiro bloco e-mail e senha, «Esqueci a senha», «Criar nova conta»; segundo bloco Google e Apple (teste: `testar-contas.mjs`, parte C)

## 4. Documentação

- [x] 4.1 `docs/prompts-flow.md`: prompts, nomes de arquivo, pastas e formatos
- [x] 4.2 `docs/10_LOG_DECISOES.md`: D-140 a D-145

## 5. Quando os arquivos do dono chegarem (orquestrador)

- [ ] 5.1 Salvar com os nomes do `docs/prompts-flow.md`; gerar posters (primeiro quadro), WebM e câmeras com fundo transparente; reduzir as fotos
- [ ] 5.2 `npm run midia && npm run sw`; conferir o MP4 num navegador comum (o Chromium de teste não toca H.264)
- [ ] 5.3 Acrescentar as novas imagens ao `site/assets/img/fotos/CREDITOS.md` (geradas no Google Flow)

## 6. Verificação

- [x] 6.1 `npx openspec validate midia-realista-apresentacao-entrar --strict`
- [x] 6.2 `npm run verificar` e `npm run testar:node` com a saída real registrada no relatório da etapa
