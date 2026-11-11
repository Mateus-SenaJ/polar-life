# Design

## Context

- Fotos: IndexedDB `polar-life`, loja `fotos`, chave `Number(src)`; `PLFOTOS.ler(src)` → `{blob,w,h,nome,meta}` (`w,h` já com a orientação EXIF aplicada; `meta` = `{iso:'AAAA-MM-DDTHH:MM:SS', orientacao, temGps}` ou `{}`).
- Estado: `sessionStorage['pl-quadro']` = `[ {leg,fr,fav}, {src,modo,z,ang,px,py,ex,ey,rot,flip,adj,flt,txt,meta}… ]`; `pl-fotos` = lista de `src`.
- Projeto real: `PLTEXTO.ehReal()` (há `pl-fotos` e `pl-projeto-atual`). No Quadro, `DEMO=!real`.
- PDF (`gerador.js`, `rasterizar`): `k=base*z/100; bw=a.w*k*W; bh=a.h*k*W; centro=(W*(.5+px), H*(.5+py)); rotate(ang) → scale(flip?-1:1,1) → rotate(rot)`; vinheta; depois ajustes (saturação → linear → gama → matriz do filtro). `createImageBitmap(blob,{imageOrientation:'from-image'})`.
- Tela do Quadro: `estilo(n,s)` já faz a mesma conta em % da janela e `.ph{filter:url(#adj)}` aplica a mesma cadeia (ids `f-sat`, `f-lin`, `f-gam`, `f-flt`). Falta só a imagem.
- JS ES5 em IIFE, um `window.PLxxx` por arquivo, sem build. Cada rota é um documento (trocar de página destrói os object URLs do documento anterior).

## Goals / Non-Goals

**Goals:** foto real em todo o editor com o recorte do PDF; uma função só para URLs; sem travar com 200 fotos; exemplo intacto; legendas reais corretas e iguais em Quadro, Folhas e PDF.

**Non-Goals:** mexer em `rasterizar`, no esquema do IndexedDB, no motor de folhas, no bloco `/*MOTOR*/…/*FIM MOTOR*/` do `quadro.js` (lido por `tests/unit/testar-quadro.mjs`), em `docs/`.

## Decisions

### 1. `window.PLFOTOTELA` em `site/assets/js/ui/foto-tela.js` (fonte única)

Carregado depois de `fotos-locais.js`/`projetos.js` e antes de `quadro.js`/`editor.js`/`filtros.js`, com `defer`. Contrato:

| Membro | Retorno | Regra |
|---|---|---|
| `url(src)` | `Promise<string>` | Object URL do blob original. `''` se `PLFOTOS.ler` devolver nulo ou falhar. Guarda no máximo `MAX_CHEIAS = 6` (a menos recente é revogada). |
| `mini(src, urgente)` | `Promise<string>` | Object URL de um JPEG reduzido: lado maior `LADO_MINI = 512` px (nunca amplia), qualidade 0,8. Fila com no máximo 2 gerações ao mesmo tempo; `urgente` verdadeiro entra na frente. |
| `tem(src, mini)` | `string` | Síncrono: URL já pronta (cheia ou mini) ou `''`. Renova a posição da cheia na fila de descarte. |
| `falhou(src)` | `boolean` | Verdadeiro depois de uma tentativa sem foto; evita laço de repetição. |
| `html(url, vin, encaixe)` | `string` | `<img src alt="" draggable="false" decoding="async" style="display:block;width:100%;height:100%[;object-fit:cover]">` + (se `vin>0`) `<i aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 75% 75% at 50% 50%,rgba(0,0,0,0) 45%,#000 100%);opacity:{vin/100*.55}"></i>`. `encaixe==='cover'` só para quadradinhos. |
| `estilo(dim, s, q)` | `string` | Recorte em CSS (abaixo). `dim={w,h}` px da foto; `s` = estado da foto; `q` = largura ÷ altura da janela. |
| `FILTROS`, `por(id)`, `lerp(m,t)` | — | Movidos de `editor/filtros.js` sem mudar números. |
| `ajustou(s)` | `boolean` | `adj` diferente de zero ou `flt.id!=='original'`. |
| `filtro(id, s)` | `string` | `''` se `!ajustou(s)`; senão `<filter id="{id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">` com os 4 passos do `#adj` do Quadro, na mesma ordem e com os mesmos números de `filtro(a)` (quadro.js) e `lerp(por(flt.id).m, flt.int/100)`. |
| `manter(srcs)` | — | Revoga cheias e minis de qualquer `src` fora da lista. |
| `limpar()` | — | Revoga tudo e esvazia fila e marcas de falha. |
| `ativos()` | `{cheias:n, minis:n}` | Para testes. |

`estilo` (cópia exata da conta atual do Quadro; todos os campos ausentes valem o padrão `z:100, ang:0, px:0, py:0, ex:0, ey:0, rot:0, flip:false, modo:'preencher'`):

```
e = rot%180 ? {w:dim.h,h:dim.w} : dim
base = modo==='encaixar' ? min(1/e.w, 1/(q*e.h)) : max(1/e.w, 1/(q*e.h))
k = base*z/100
'width:'+dim.w*k*100+'%;height:'+dim.h*k*q*100+'%;left:'+(50+(px+ex)*100)+'%;top:'+(50+(py+ey)*100)+'%;transform:translate(-50%,-50%) rotate('+ang+'deg) scaleX('+(flip?-1:1)+') rotate('+rot+'deg)'
```

Miniatura: `createImageBitmap(blob,{imageOrientation:'from-image',resizeWidth,resizeHeight,resizeQuality:'medium'})` com o alvo calculado de `r.w,r.h`; se lançar erro, `createImageBitmap(blob,{imageOrientation:'from-image'})` + `drawImage` reduzido; `canvas.toBlob('image/jpeg',.8)`; `bitmap.close()`. O `<img>` da foto cheia usa a orientação EXIF do navegador (padrão `from-image`), igual ao PDF.

Revogação: (a) `pagehide` → `limpar()`; `pageshow` com `event.persisted` depois de um `limpar()` → `location.reload()`; (b) toda chamada pública compara `PLPROJETOS.atual()` com o projeto guardado e chama `limpar()` se mudou; (c) `manter()` quando a lista de fotos muda (Duplicar, Remover, desfazer); (d) descarte da cheia mais antiga acima de 6. Ninguém fora deste arquivo chama `URL.createObjectURL` para foto do editor.

Alternativas descartadas: `<canvas>` por foto com `PLGERADOR.aplicarAjustes` (pesado, o gerador não carrega no editor); guardar miniaturas no IndexedDB (muda o esquema; fica para depois); data URL (memória).

### 2. Quadro (`pages/quadro.js`)

- `estilo(n,s)` vira `return PLFOTOTELA.estilo(nat(n),s,jq())`.
- Nova `midia(n,vin,mini,encaixe)`: se `DEMO` → `cena(n,vin)`; senão `u=PLFOTOTELA.tem(src(n),mini)`; com `u` → `PLFOTOTELA.html(u,vin,encaixe)`; sem `u` → devolve `''` (fundo neutro da janela) e, se `!PLFOTOTELA.falhou(src(n))`, pede `PLFOTOTELA[mini?'mini':'url'](src(n), n===cur)` e ao resolver repinta (`keyMain='';pintaMain()` para a janela; `thumb(i)` para a faixa, conferindo que o índice ainda existe e ainda aponta para o mesmo `src`).
- `pintaMain()` e `thumb()` trocam `cena(…)` por `midia(…)`; a chave `keyMain` passa a incluir a URL em uso. A faixa usa sempre `mini`; a janela usa a cheia e, enquanto ela não chega, a mini se já existir.
- Faixa com muitas fotos: `thumb(i)` só pede a mini quando o botão está perto da área visível (`IntersectionObserver` em `#faixa`, margem 200 px); sem `IntersectionObserver`, pede todas em ordem a partir da foto atual.
- `reindexar()` e `aplicarHist()` (quando a lista muda) chamam `PLFOTOTELA.manter(lista de src)`.
- `PLQ` ganha `midia` e `real` (`!DEMO`); `PLQ.cena` continua existindo.

### 3. Filtros (`editor/filtros.js`)

`ID`, `mat`, `FILTROS`, `por`, `lerp` passam a vir de `PLFOTOTELA`. Em projeto real: quadradinhos usam `Q.midia(n,0,true,'cover')` (a chave `tileKey` inclui `PLFOTOTELA.tem(Q.src(n),true)`); `sugerir()` carrega a mini (`PLFOTOTELA.mini`) no `Image` em vez do SVG e, sem foto, chama `cb('')`. «Comparar» copia `#clip` e já funciona.

### 4. Folhas (`pages/editor.js`)

- `EST_Q` deixa de ser constante: `salvarQuadro(q)` faz `EST_Q=q` (hoje os ajustes da aba Ajustes não chegam à mesa).
- Em `polaroid(c,s,px,det)`, quando `REAL_ED` e `c.f.px` e `PLFOTOTELA.tem(c.f.src,true)`: dentro de `.pol__ph` entra `<div style="position:absolute;{estilo}{;filter:url(#pf-N) se det e ajustou}">{html(url, vinheta)}</div>` com `estilo=PLFOTOTELA.estilo(c.f.px, EST_Q[c.f.n]||{}, FR.jw/FR.jh)`; o ícone não é desenhado. Sem URL: ícone atual e pedido `PLFOTOTELA.mini(src, det)`; ao resolver, um redesenho agrupado (um `setTimeout` de 60 ms compartilhado) chama `desenharMesa()` e `faixa()`.
- Os `<filter id="pf-N">` da folha visível vão num único `<svg width="0" height="0" aria-hidden="true">` no início de `#sheet` (`PLFOTOTELA.filtro('pf-'+n, estado)`); a faixa de folhas (`det` falso) mostra a foto sem filtro.
- Aba Fotos: cada `.foto-mini` mostra a mini (`html(url,0,'cover')`, altura 30 px) no lugar do `<span>Foto N</span>`; o `<small>Foto N</small>` fica.
- Exemplo: tudo como hoje (ícone).

### 5. Legendas e metadados (contrato de `ST[n].meta` em projeto real)

`meta = {iso:'AAAA-MM-DDTHH:MM'|'' , ds:'exif'|'manual'|'none', dh:int, c:string, cs:'manual'|'none', o:'Do aparelho', conv:false}` — nunca `temGps`, `orientacao` nem segundos.

- `quadro.js` (carga das fotos reais): **não sobrescrever**. Se `ST[i].meta` já tem `ds` ou `cs`, fica como está. Senão cria o registro acima a partir do EXIF: `iso = (r.meta.iso||'').slice(0,16)`, `ds = iso?'exif':'none'`, `c:''`, `cs:'none'`, `dh:0`.
- `metadados.js`: `pd()` aceita segundos opcionais (`/^(\d+)-(\d+)-(\d+)T(\d+):(\d+)(?::\d+)?$/`).
- `legendas.js`: `T()` devolve `''` quando `txt` é nulo e `LT.ehReal()`; `localTxt(l,c)` passa a chamar `LT.localLG(l, cidade)` (uma conta só, MT-02); em projeto real a seção Local esconde Estado, País e Ordem e mostra «Escreva a cidade como quer ver na legenda (ex.: Recife, PE) na aba Metadados.».
- `legenda-texto.js`: `localLG(l,cid)` em projeto real devolve só `cid` (sem UF, sem país); no exemplo fica igual.
- Nome do projeto: `quadro.js` guarda o nome lido de `PLPROJETOS.listar()` e `render()` monta `document.title` com ele (exemplo: «Viagem · Serra 2026»); `editor.js` idem no rodapé da folha; `gerador.js`: `preparar()` lê o nome em `p.nome` e `lista()` passa `proj.nome` para `rodape()` (padrão do exemplo quando ausente).

### 6. Testes (Node 22 + Playwright, `tests/helpers/servidor.mjs`, JPEGs de canvas com EXIF montado como em `testar-projetos-salvos.mjs`)

- `tests/e2e/testar-fotos-tela.mjs`: fotos de duas cores (metade esquerda `#C00000`, metade direita `#0000C0`, 1600 × 1200) para ler pixels de capturas de `#win` e `.pol__ph`; estado posto em `pl-quadro` antes de abrir a página; bloco de 200 fotos (800 × 600) para desempenho.
- `tests/e2e/testar-legendas-reais.mjs`: roteiro L1–L6 em Quadro, Folhas e PDF (`PLGERADOR.projeto()` + `preparar` + `lista`, em `app/editor/gerar/`).
- Preparação: abrir `app/adicionar-fotos/` (tem `PLEXIF`), `PLPROJETOS.criar`, `PLFOTOS.salvar(n,file,id)`, `sessionStorage['pl-fotos']`, `PLSESSAO.salvarJa()`.

## Risks / Trade-offs

- [Miniaturas refeitas a cada troca Quadro ↔ Folhas] → fila com prioridade para o que está visível; guardar em IndexedDB fica para outra mudança.
- [Um `<filter>` por foto ajustada nas Folhas] → só para fotos com ajuste e só na folha visível.
- [`createImageBitmap` com `resize*` ausente em navegador antigo] → caminho alternativo com `drawImage`.
- [Projetos já salvos com `meta` bruto do EXIF] → a regra «sem `ds`/`cs` → recria do EXIF» conserta ao abrir; nada é apagado.
- [L4 muda o texto do local em projeto real] → decisão nova (D-138) registrada pelo orquestrador ao arquivar; exemplo intacto.
- [`gerador.js` mantém cópia própria de `FILTROS`] → fora do escopo; números não mudam.
