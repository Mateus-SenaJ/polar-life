## Why

O dono pediu três coisas para as Folhas: (1) padrões de papel mais econômicos, margem de 3 mm e polaroids encostadas (0 mm); (2) um Modo Colagem com vários layouts e fundo escolhido pela pessoa (cor, degradê ou foto), que saia igual na tela e no PDF; (3) «a melhor qualidade possível» no PDF. Hoje o PDF reamostra toda foto para 326 PPI com JPEG 0,92 pelo canvas, mesmo quando o original tem mais de 800 PPI na janela. Registrado como D-150, D-151 e D-152.

## What Changes

- Padrão de projeto novo: margem 3 mm e espaço entre polaroids 0 mm (`PLFOLHAS.PADRAO`, editor, «Novo projeto»). Projetos existentes mantêm o que salvaram; projeto antigo que nunca salvou Folhas abre com 10/4. O aviso de margem mínima passa a valer abaixo de 3 mm (`PLFOLHAS.MARGEM_MIN`).
- Novo `window.PLCOLAGEM` (`site/assets/js/nucleo/colagem.js`): 5 layouts determinísticos (grade justa, mosaico em tijolo, espalhadas, tira, coração), paginação e fundo (cor livre, degradê de 2 cores com ângulo, foto cover com posição e suavização). `PLFOLHAS.paginar` e `PLFOLHAS.contar` delegam a ele quando a Colagem está ligada, então tela e PDF usam a mesma conta (MT-02).
- Aba «Colagem» no editor de Folhas (interruptor, layout, tipo de fundo, cor, degradê, seletor de miniaturas, posição, suavizar). A configuração vive em `D.colagem` dentro de `pl-folhas`: persiste no projeto (IndexedDB), entra no desfazer e no backup.
- PDF: item `fundo` na display list (retângulo, sombreamento axial nativo ou JPEG cover), rotação por polaroid e contorno vetorial em cada polaroid.
- Qualidade do PDF: o Pro embute o JPEG original sem recomprimir (sem EXIF, GPS ou XMP; recorte por matriz e clip); os demais planos reamostram de 300 a 600 PPI com JPEG 0,95; `PLGERADOR.pdf` devolve `qualidade` (DPI efetivo por foto), `bytes` e `grande` (acima de 150 MB).

## Capabilities

### New Capabilities
- `colagem`: layouts, fundo e saída da Colagem.
- `qualidade-pdf`: resolução efetiva, original sem recompressão e aviso de tamanho.
- `folhas-padroes`: margem 3 mm, espaço 0 mm e compatibilidade com projetos salvos.

### Modified Capabilities
Nenhuma.

## Impact

Decisões: cria D-150, D-151 e D-152; respeita D-130 (o indicador de qualidade continua calculado sobre o PPI nativo da foto), D-131 (Pro: original sem reamostrar), D-133 (a polaroid nunca muda de medida), D-135 e D-136 (legenda), MT-01 (µm inteiros), MT-02 (tela = PDF), T2 e T3 (a cor do fundo é conteúdo da pessoa, como a cor de legenda, DS-13; ícone + texto; alvos de 44 px ou mais), T4 (nada sobre a foto), T5 e T6 (tudo no aparelho, sem terceiros). Código: `nucleo/{colagem,motor-folhas,gerador,projetos,sessao}.js`, `pages/{editor,gerar,novo-projeto,inicio}.js`, `editor/prevoo.js`, `app/editor/index.html` e os demais HTMLs que carregam `motor-folhas.js`.

Fora do escopo: arrastar polaroids livremente na Colagem (DOC-06 §6, versão 2.0), adesivos, exportar a Colagem como imagem social (Lembrança), PNG original sem perda para fotos que não são JPEG, perfil ICC embutido no PDF (outros perfis passam pelo canvas, que converte para sRGB) e orientações EXIF com espelho.
