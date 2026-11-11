# qualidade-pdf Specification

## Purpose
TBD - created by archiving change folhas-colagem-pdf-v4. Update Purpose after archive.

## Requirements

### Requirement: Resolução efetiva do PDF
O PDF de alta qualidade SHALL entregar cada foto com pelo menos `min(PPI nativo, 300)` PPI efetivos na janela. Nos planos Grátis e Folha avulsa a imagem é reamostrada de 300 a 600 PPI (ou no PPI nativo, se menor) com JPEG de qualidade 0,95; no Pro, de 326 a 1200 PPI com JPEG 0,97 quando não puder usar o original. `PLGERADOR.pdf` MUST devolver `qualidade` com o DPI efetivo de cada foto.

#### Scenario: Fotos reais de 12 MP
- **WHEN** 6 fotos reais de cerca de 12 MP são exportadas em A4 com 3/0 mm no Pro e no plano Grátis
- **THEN** cada foto sai com 856 a 1011 PPI no Pro e 600 PPI no Grátis, e nenhuma fica nos 326 PPI de antes

### Requirement: Original sem recompressão no Pro
No Pro, a foto sem ajustes, em JPEG sRGB (ou sem perfil), 8 bits e orientação EXIF 1, 3, 6 ou 8 SHALL entrar no PDF como o JPEG original, sem recompressão, com recorte, rotação e espelho por matriz e `clip` na janela, e sem EXIF, GPS, XMP, IPTC nem comentários. Fotos com ajuste, outro perfil de cor, CMYK ou orientação com espelho MUST passar pelo canvas. A mesma foto em várias polaroids SHALL ocupar um objeto só.

#### Scenario: Original igual ao canvas
- **WHEN** o mesmo projeto é gerado pelo caminho do original e pelo caminho do canvas
- **THEN** a página 1 renderizada difere menos de 7 em 255 em média e o arquivo do Pro não contém `Exif`, `<x:xmpmeta` nem `http://ns.adobe.com/xap`

### Requirement: Aviso de PDF grande
`PLGERADOR.pdf` SHALL marcar `grande` quando os arquivos somam mais de 150 MB e a tela de geração MUST dizer o tamanho e sugerir o formato leve. A leitura de originais MUST parar em 700 MB por geração, voltando a reamostrar.

#### Scenario: Tamanho
- **WHEN** o PDF passa de 150 MB
- **THEN** o resultado traz `grande: true` e a tela mostra o aviso com o tamanho
