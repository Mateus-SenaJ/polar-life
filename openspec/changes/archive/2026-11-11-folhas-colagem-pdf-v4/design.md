## Context

Folhas pagina em grade (`PLFOLHAS.paginar`); o PDF (`PLGERADOR.lista`) repagina com a mesma função (MT-02). O PDF rasterizava cada janela no canvas a 326 PPI (JPEG 0,92) e o indicador de qualidade (D-130) mede o PPI nativo da foto na janela (`ppiDe` e `ppiFoto`).

## Goals / Non-Goals

- Goals: padrões 3/0; 5 layouts de Colagem determinísticos; fundo cor, degradê e foto com tela = PDF; PDF com a maior qualidade que o plano permite, sem EXIF; indicador de qualidade coerente.
- Non-Goals: edição livre por arrasto, Lembrança em imagem, PNG sem perda, ICC no PDF.

## Decisions

### Contrato de dados (`D.colagem` dentro de `pl-folhas`)
`{ativo:bool, layout:'grade'|'mosaico'|'espalhadas'|'tira'|'coracao', fundo:{tipo:'cor'|'gradiente'|'foto', cor:'#RRGGBB', cor2:'#RRGGBB', ang:0..359 (graus CSS), foto:null|src, px:0..100, py:0..100, suave:0..100}}`. `PLCOLAGEM.norm` sanea tudo. `foto:null` significa a primeira foto do projeto; um `foto:src` que saiu do projeto volta para a primeira. Persiste junto com `pl-folhas` (IndexedDB, backup `.polarlife`, desfazer).

### Onde cada cálculo vive (MT-02)
- Posições: `PLCOLAGEM.paginar(s, fr, fotos)` devolve a mesma forma de `PLFOLHAS.paginar` (`sheets[].cells[]` com `x,y,w,h,giro,rot`, em mm; a caixa é sem rotação e `rot` gira, em graus, em torno do centro). A tela (`editor.js`, `polaroid()`) e o PDF (`gerador.js`, `matrizPolaroid`, µm inteiros) somam `rot` ao giro de 90°. Não há `Math.random`: um hash inteiro por índice dá o mesmo resultado em qualquer motor.
- Capacidade por folha: `cap` do layout; as fotos são repartidas por igual em `⌈n ÷ cap⌉` folhas. A polaroid mantém a medida (D-133). Toda célula (já girada) cabe na margem; papel pequeno demais dá `erro` e a tela mostra «A polaroid não cabe neste papel».
- Layouts: grade justa (encostada, centralizada, usa o melhor giro); mosaico em tijolo (linhas deslocadas meia polaroid); espalhadas (grade com sobreposição de 28%, jitter de até 12,5% do passo, rotação de até 6°); tira (faixas sobrepostas até 50%, zigue-zague de 3 mm e 2°); coração (centros espaçados por comprimento de arco ao longo de `x=16 sin³t`, `y=13 cos t − 5 cos 2t − 2 cos 3t − cos 4t`, rotação alternada de 3°).
- Sem guias de corte na Colagem (as polaroids se sobrepõem). Contorno de 0,088 mm em cada polaroid, desenhado logo depois dela para respeitar a ordem das camadas.
- Fundo: `PLCOLAGEM.fundo(c, fotos, real)`. Degradê: eixo em mm de `PLCOLAGEM.eixoGrad(W,H,ang)`, o mesmo de `linear-gradient(<ang>deg)`; no PDF vira sombreamento axial nativo (tipo 2, `Extend [true true]`). Foto: a tela usa `background-size:cover` e `background-position:px% py%` numa caixa ampliada pelo desfoque; o PDF rasteriza o mesmo recorte cover, aplica `PLCOLAGEM.blurMm` e o véu branco `PLCOLAGEM.clareia`, e corta a borda. O fundo em foto usa 300 PPI (150 se suavizado), nunca acima do original. O projeto de exemplo (sem foto real) usa `#F8F9FA` no lugar da foto.
- Padrões: `PLFOLHAS.PADRAO = {margem:3, gap:0}` e `PLFOLHAS.MARGEM_MIN = 3` (pré-voo e ajuda do campo). Os projetos de `PLPROJETOS` ganham o marcador `v:2`; ao abrir um projeto sem `v:2` e sem `pl-folhas`, grava-se `{margem:10, gap:4}` (o que ele tinha implicitamente). O cartão do Início aplica a mesma regra.

### Qualidade do PDF (`PLGERADOR.foto`)
| Plano | Modo | Resultado |
| --- | --- | --- |
| Pro | `nativo` | JPEG original sem recompressão quando elegível; senão canvas de 326 a 1200 PPI, JPEG 0,97 |
| Grátis e Folha avulsa | `alta` | canvas de 300 a 600 PPI (o nativo, se o original tiver menos), JPEG 0,95 |
| formato «leve» | 300 PPI | JPEG 0,72 (inalterado) |

Elegível significa: JPEG sem ajuste (brilho, contraste etc. zerados e filtro Original), orientação EXIF 1, 3, 6 ou 8, 8 bits, cinza ou RGB, perfil ausente ou sRGB e orçamento de memória (700 MB) não estourado. O JPEG é reescrito sem os segmentos APP1 a APP13, APP15 e COM (EXIF, GPS, XMP, IPTC), copiando os dados da imagem byte a byte. A matriz `G` leva o pixel do original para mm da janela com a mesma conta do canvas (centro em `0,5 + px/py`, giro, espelho, rotação e escala `k = base × zoom`), mais a matriz de orientação; `desenharFoto` aplica `B` (janela para µm), `clip` no retângulo da janela, fundo branco e a matriz da imagem. Fotos repetidas embutem um objeto só por documento. Sem ajuste, `rasterizar` não percorre os pixels, e a reamostragem usa `imageSmoothingQuality = 'high'`.

`PLGERADOR.pdf` devolve `qualidade: [{n, dpi, original, wpx, hpx, bytes}]`, `bytes` e `grande` (acima de 150 MB). `gerar.js` mostra o aviso com o tamanho. Trade-off: o original do Pro pesa o arquivo inteiro de cada foto (cerca de 2 a 5 MB por foto de 12 MP), sem teto de tamanho (D-131); nos demais planos o teto de 150 MB por arquivo (volumes) continua.

O indicador de qualidade (D-130) segue medindo o PPI nativo da foto na janela: o PDF nunca fica abaixo de `min(nativo, 300)`, então «Excelente» (300 ou mais) continua significando que o arquivo tem 300 PPI ou mais de verdade.

## Risks / Trade-offs

- Original de 12 MP por foto pode gerar PDFs grandes no Pro (24 fotos perto de 60 MB; 200 fotos perto de 0,5 GB): há aviso acima de 150 MB e teto de memória de 700 MB (acima disso, reamostra).
- O JPEG do canvas pode sair em 4:2:0; por isso o Pro prefere o original.
- `ctx.filter` não existe em alguns Safari: há reserva por redução e ampliação.
