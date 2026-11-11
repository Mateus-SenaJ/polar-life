## Why

O dono quer que a apresentação e a tela de entrar mostrem, logo de cara, o que o produto entrega: memórias de pessoas em papel. Hoje há desenho de câmera, polaroids só de paisagem com rabiscos no lugar do texto e uma entrada «sem senha» que não é o que as pessoas esperam encontrar. Os vídeos e imagens realistas serão gerados pelo dono no Google Flow; o site precisa estar pronto para recebê-los sem quebrar enquanto não chegam.

## What Changes

- Vídeo realista, decorativo e em loop ao lado do título da apresentação (mesa: celular guardado, polaroids na mão), com transição por máscara para o branco; segundo vídeo (varal de luzinhas com polaroids) na tela de entrar, abaixo da faixa preta, que sobe para o topo da coluna.
- Componente `PLMIDIA` + lista gerada `PLMIDIA_ARQUIVOS` (`npm run midia`): só pede ao servidor arquivos que existem; poster local, carregamento ao entrar na tela, pausa fora dela, só poster com movimento reduzido ou economia de dados; quadro com proporção fixa.
- Câmera instantânea realista, sem marca, no lugar do desenho (hero, mesa, banner da faixa preta, passo 1 do «Como funciona»); o desenho fica como reserva até o arquivo chegar.
- Polaroids com legenda e data manuscritas (Caveat) no lugar dos rabiscos, e lugares reservados para 8 fotos de pessoas (amigos, casais, família).
- Tela de entrar: primeiro bloco e-mail + senha («Esqueci a senha», «Criar nova conta»); segundo bloco Google e Apple (sai o Facebook). Senha guardada só como derivação PBKDF2-SHA-256 com sal aleatório, neste aparelho. **BREAKING** para os testes: «Continuar com e-mail» (código direto) deixa de ser a entrada principal; o código de 6 dígitos passa a ser o caminho de «Esqueci a senha».
- `docs/prompts-flow.md` com os prompts e os nomes de arquivo definitivos.

Decisões novas: D-140 a D-145. Respeita T1 (Caveat 400, já do catálogo), T2 (CSS e SVG só com a paleta; fotografia e vídeo são conteúdo, como as fotos das ilustrações), T3 (vídeo decorativo com `aria-hidden`, movimento reduzido, alvos de 44 px ou mais), T5 (senha e conta só no aparelho), T6 e CSP `default-src 'self'` (vídeo e imagens locais), T7 (aviso de demonstração mantido; nenhuma promessa de segurança de servidor), T8 (um LED por etapa). Mantém D-116, D-123 e D-124 (modo demonstração, contas de teste, código de impressão).

Fora do escopo: gerar os vídeos e as imagens (dono, no Flow); converter, otimizar e criar posters e WebM (orquestrador); trocar a câmera e tirar os rabiscos nos SVG avulsos usados como `<img>` no Início do app (`banner-*.svg`, `colagem-*.svg`); autenticação real com servidor; login real com Google/Apple (P16).

## Capabilities

### New Capabilities
- `midia-realista`: vídeos decorativos com reserva, câmera realista e lista de arquivos presentes.

### Modified Capabilities
- `tela-entrar`: ordem da coluna de mídia (faixa preta em cima, mídia abaixo), proporção da mesa e nova entrada por e-mail e senha.
- `ilustracoes-com-fotos`: polaroids com legenda e data manuscritas e lugares para fotos de pessoas.

## Impact

- HTML: `site/index.html`, `site/como-funciona/index.html`, `site/app/entrar/index.html`.
- CSS: novo `site/assets/css/ui/midia.css`; `pages/apresentacao.css`, `pages/entrar.css`.
- JS: novos `site/assets/js/ui/midia.js` (`PLMIDIA`) e `midia-arquivos.js` (gerado); `nucleo/conta.js` (`criarConta`, `entrarComSenha`, `definirSenha`; provedores = Google e Apple); `pages/entrar.js`; `app/sw.js` (vídeo fora do cache).
- Ferramentas e testes: `tools/gerar-midia.mjs`, `tools/verificar.mjs`, `package.json`, `tests/helpers/servidor.mjs`, `tests/e2e/testar-midia.mjs` (novo), `testar-contas`, `testar-entrar-mesa`, `testar-ilustracoes-fotos`.
- Docs: `docs/prompts-flow.md`, `docs/10_LOG_DECISOES.md`.
