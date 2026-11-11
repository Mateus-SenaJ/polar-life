## 1. Mesa com fotos

- [x] 1.1 `site/app/entrar/index.html`: trocar o conteúdo de cada `<g id="mesa-cena-*">` por `<image>` da foto (design §1) e acrescentar o fundo `mesa.jpg` com véu (design §2)
- [x] 1.2 `site/index.html` (seção «Como fica na mesa»): a mesma troca na mesa embutida

## 2. Hero e faixa da apresentação

- [x] 2.1 `site/index.html`: `cam-foto` com `montanha.jpg`; as duas polaroids pousadas viram moldura HTML com `<img>` de `praia.jpg` e `viagem.jpg` (design §3), CSS em `site/assets/css/pages/apresentacao.css`
- [x] 2.2 `site/index.html`: embutir o banner da faixa preta (`banner-imprimir.svg`) e trocar as cenas das polaroids por fotos (design §4)

## 3. Créditos e verificação

- [x] 3.1 `site/legal/index.html`: seção «Créditos das imagens» com link para `../assets/img/fotos/CREDITOS.md`
- [x] 3.2 `tests/e2e/testar-ilustracoes-fotos.mjs` (Playwright): os cenários da spec (fotos carregadas sem requisição falha em entrar e apresentação, 1440 e 390; movimento reduzido; fundo da mesa; link de créditos 200); acrescentar ao `testar:node`
- [x] 3.3 Rodar `npm run sw`, `npm run verificar` e `npm run testar:node` (saída 0) e registrar a saída real
