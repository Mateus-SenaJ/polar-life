# Tasks

Regras: ES5 em IIFE; não mexer no bloco `/*MOTOR*/…/*FIM MOTOR*/` de `quadro.js`; não mexer em `docs/`; sem commit. Roteiro de reprodução pronto: `node tests/saida/bugs/repro.mjs` (antes: bugs; depois: tudo corrigido).

## 1. Componente compartilhado PLFOTOTELA

- [x] 1.1 Criar `site/assets/js/ui/foto-tela.js` com `window.PLFOTOTELA` e os membros `url`, `mini`, `tem`, `falhou`, `html`, `estilo`, `manter`, `limpar`, `ativos`, `LADO_MINI=512`, `MAX_CHEIAS=6`, exatamente como na tabela do design §1 (fila de 2, `urgente` na frente, descarte da cheia mais antiga). Teste: `tests/e2e/testar-fotos-tela.mjs` bloco «API» (URL responde a `fetch`; mini com lado maior ≤ 512; `limpar()` revoga; `ativos()`).
- [x] 1.2 No mesmo arquivo: revogar em `pagehide`, recarregar em `pageshow` persistido depois de `limpar()`, e `limpar()` quando `PLPROJETOS.atual()` muda entre chamadas. Teste: bloco «troca de projeto» de `testar-fotos-tela.mjs`.
- [x] 1.3 Mover `ID`, `mat`, `FILTROS`, `por`, `lerp` de `site/assets/js/editor/filtros.js` para `PLFOTOTELA` (mesmos números) e criar `ajustou(s)` e `filtro(id,s)` (design §1). Em `filtros.js`, ler de `window.PLFOTOTELA`. Teste: `npm run testar:editor` continua passando; bloco «Filtro P&B» de `testar-fotos-tela.mjs`.
- [x] 1.4 Incluir `<script src="…/assets/js/ui/foto-tela.js" defer></script>` depois de `projetos.js` e antes do script da página em `site/app/editor/index.html` e `site/app/editor/quadro/index.html`; rodar `npm run sw`. Teste: `npm run verificar` (✔ Sem erros).

## 2. Quadro

- [x] 2.1 `site/assets/js/pages/quadro.js`: `estilo(n,s)` passa a devolver `PLFOTOTELA.estilo(nat(n),s,jq())`. Teste: `npm run testar` e `npm run testar:recorte` sem mudança de resultado.
- [x] 2.2 `quadro.js`: criar `midia(n,vin,mini,encaixe)` (design §2) e usar em `pintaMain()` (janela: cheia; enquanto não chega, a mini se existir) incluindo a URL em `keyMain`. Teste: cenários «Janela mostra a foto escolhida» e «Trocar de foto troca a imagem».
- [x] 2.3 `quadro.js`: `thumb(i)` usa `midia(i,0,true)`; pedir a mini só perto da área visível (`IntersectionObserver` em `#faixa`, margem 200 px; sem ele, todas em ordem a partir da atual). Teste: cenários «Faixa mostra as fotos» e «Desempenho com 200 fotos».
- [x] 2.4 `quadro.js`: chamar `PLFOTOTELA.manter(srcs)` em `reindexar()` e em `aplicarHist()` quando a lista muda; exportar `midia` e `real` em `window.PLQ`. Teste: cenário «Remover foto».
- [x] 2.5 `site/assets/js/editor/filtros.js`: em projeto real (`Q.real`), `grade()` usa `Q.midia(n,0,true,'cover')` e põe `PLFOTOTELA.tem(Q.src(n),true)` em `tileKey`; `sugerir()` carrega a mini no `Image` (sem foto: `cb('')`). Teste: cenário «Filtros, comparar e sugestão usam a foto».

## 3. Folhas

- [x] 3.1 `site/assets/js/pages/editor.js`: `EST_Q` vira variável e `salvarQuadro(q)` faz `EST_Q=q`. Teste: bloco «Folhas» de `testar-fotos-tela.mjs` (brilho mudado na aba Ajustes muda o pixel lido).
- [x] 3.2 `editor.js`, `polaroid()`: em projeto real com `c.f.px` e mini pronta, desenhar a foto dentro de `.pol__ph` com `PLFOTOTELA.estilo(c.f.px, EST_Q[c.f.n]||{}, FR.jw/FR.jh)` e `PLFOTOTELA.html(url, vinheta)`; sem mini, ícone atual + pedido `PLFOTOTELA.mini(src, det)` + redesenho agrupado (um `setTimeout` de 60 ms → `desenharMesa()` e `faixa()`). Teste: cenários «Mesa mostra as fotos», «Foto ausente» e os de recorte nas Folhas.
- [x] 3.3 `editor.js`, `desenhar()`: com `det`, juntar `PLFOTOTELA.filtro('pf-'+n, estado)` das fotos ajustadas num `<svg width="0" height="0" aria-hidden="true">` no início da folha e aplicar `filter:url(#pf-n)` no bloco da foto. Teste: cenário «Filtro P&B» nas Folhas.
- [x] 3.4 `editor.js`, `painelExtra('tab-fotos')`: mini em cada `.foto-mini` (`html(url,0,'cover')`, 30 px de altura), mantendo «Foto N». Teste: cenário «Aba Fotos mostra miniaturas».

## 4. Legendas e metadados

- [x] 4.1 `site/assets/js/editor/legendas.js`: `T()` devolve `''` quando `txt` é nulo e `LT.ehReal()`. Teste: `tests/e2e/testar-legendas-reais.mjs` bloco L1.
- [x] 4.2 `site/assets/js/pages/quadro.js` (carga das fotos reais, hoje `ST[i+1].meta=r.meta||{}`): manter `meta` que já tem `ds` ou `cs`; senão criar `{iso:(r.meta.iso||'').slice(0,16), ds:iso?'exif':'none', dh:0, c:'', cs:'none', o:'Do aparelho', conv:false}`. Teste: bloco L2 (recarregar e reabrir) e «Projeto salvo com registro antigo».
- [x] 4.3 `site/assets/js/editor/metadados.js`: `pd()` aceita segundos opcionais. Teste: bloco L3 (data EXIF no Quadro = Folhas = PDF) e «Painel Metadados de foto real».
- [x] 4.4 `site/assets/js/nucleo/legenda-texto.js`: `localLG(l,cid)` devolve só `cid` em projeto real. `legendas.js`: `localTxt(l,c)` chama `LT.localLG(l, c==null?LOCAL.cidade:c)`; em projeto real a seção Local não desenha Estado, País e Ordem e mostra a orientação do design §5. Teste: bloco L4 («Recife» sem «SP» em Quadro, Folhas e PDF; Pocket «Olinda» / «09/03/25»); `npm run testar:pocket` e `npm run testar:texto-alinhado` continuam passando.
- [x] 4.5 Nome do projeto: `quadro.js` (`document.title` em `render()`), `editor.js` (rodapé em `desenhar()`), `site/assets/js/nucleo/gerador.js` (`preparar()` grava `p.nome`; `lista()` passa `proj.nome` a `rodape()`); no exemplo continua «Viagem · Serra 2026». Teste: bloco L6; `npm run testar:pdf` continua passando.

## 5. Testes e verificação

- [x] 5.1 Escrever `tests/e2e/testar-fotos-tela.mjs` cobrindo todos os cenários de `specs/editor-fotos-reais/spec.md` (1440 × 900 e 390 × 844; 200 fotos de 800 × 600), com capturas em `tests/saida/fotos-tela/`.
- [x] 5.2 Escrever `tests/e2e/testar-legendas-reais.mjs` cobrindo todos os cenários de `specs/legenda-polaroid/spec.md` desta mudança.
- [x] 5.3 `package.json`: scripts `testar:fotos-tela` e `testar:legendas-reais`, e os dois no fim de `testar:node`.
- [x] 5.4 Rodar `node tests/saida/bugs/repro.mjs` e conferir: `imgsBlob > 0`, `clipSvg 0`, `cap` vazio na foto sem texto, data igual em Quadro/Folhas/PDF, «Recife» sem «SP», cidade mantida depois de recarregar.
- [x] 5.5 Rodar `npm run verificar` (✔ Sem erros) e `npm run testar:node` (saída 0) e registrar a saída real.
