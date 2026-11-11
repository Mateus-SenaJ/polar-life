## Why

O dono pediu uma edição mais direta: sem a aba «Metadados» (as «Sugestões de legendas» já usam a data e a cidade), ajustes finos de texto em «Configurações avançadas», mais fontes com estilo Normal/Itálico/Negrito reais, um «Excluir foto» à mão e um arrasto da foto na janela que acompanhe o dedo. Ao investigar o arrasto, apareceram dois defeitos do código: o limite de pan era fixo em 1 janela (com zoom alto a foto não chegava às bordas) e o «elástico» na borda empurrava a foto no sentido contrário ao gesto.

## What Changes

- Remove a aba «Metadados» do Quadro e das Folhas. Data e cidade de cada foto, a correção de horas em lote e o autocomplete «Cidade - UF» passam para Legendas › Configurações avançadas (nada se perde; Origem, Dimensões e Perfil de cor, sem uso na legenda, saem).
- Painel Legendas do projeto real refeito, compacto e sem controle repetido: Linha 1 (Localização) e Linha 2 (Data) como padrão ligado, cada uma com seletor de tipo (Localização, Data, Ponto turístico, Texto livre, Nenhum) e texto editável; **um** conjunto de Fonte, Itálico/Negrito, Tamanho e Cor com alvo Linha 1, Linha 2 ou Ambas; Posição e Estilos prontos; Configurações avançadas recolhidas (inclinação −8° a +8°, formato de data e de localização em `<select>`, caixa, espaçamento entre letras, duas linhas separadas ou juntas com separador, ordem, medir espaços por, data e cidade da foto, correção de horas). Saem as seções Texto livre, Data e Local e o interruptor «Padrão de 2 linhas». Projetos antigos migram (`PLTEXTO.migrarPad`). O exemplo mantém o painel antigo.
- Fontes: 7 famílias novas (Indie Flower, Handlee, Amatic SC, Lora, Crimson Pro, Nunito, DM Sans) e variantes reais de negrito e itálico para famílias existentes, só locais (T6), OFL, baixadas por `npm run fontes` do repositório google/fonts. Botões Itálico e Negrito para qualquer linha; sem a variante, o botão fica desabilitado com explicação (nada sintético). O PDF embute a variante exata.
- «Excluir foto» (ícone de lixeira + texto) na barra da foto e no menu da miniatura, com «Desfazer»; remove só aquela foto do projeto, das Folhas, do PDF e do IndexedDB.
- Enquadramento: arrasto 1:1 via transform em `requestAnimationFrame`, limite de pan corrigido, elástico no sentido do gesto com resistência suave e sem zona morta.

Decisões: D-148 (T1 vale para a interface; a legenda é conteúdo e pode ter negrito; fontes novas e estilos) e D-149 (edição v4: Metadados sai, painel de 2 linhas, avançadas, excluir foto, pan). A D-147 está reservada para outra etapa. Respeita T2 a T8; esclarece a leitura da T1 (peso máx. 500 só na interface) e muda de lugar o autocomplete de cidade da D-139.

Fora do escopo: Folhas, Colagem e qualidade do PDF (outra etapa); stickers.

## Capabilities

### Modified Capabilities
- `legenda-polaroid`: Configurações avançadas, fontes e estilos, data e cidade dentro de Legendas.

### New Capabilities
- `edicao-quadro`: Excluir foto e enquadramento 1:1.

## Impact

`site/assets/js/nucleo/legenda-texto.js`, `gerador.js`, `editor/legendas.js`, `editor/metadados.js`, `pages/quadro.js`, `pages/editor.js`, `ui/foto-tela.js`, `nucleo/fotos-locais.js`, `css/base/fonts.css`, `tools/baixar-fontes.mjs`, `tools/verificar.mjs`, `site/assets/fonts/`.
