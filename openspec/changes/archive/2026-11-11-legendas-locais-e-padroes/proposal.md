## Why

O dono quer legendas mais rápidas: cidade e data já sugeridas a partir da foto, num padrão de 2 linhas que se aplica a todas e continua editável. Isso revoga em parte a D-138 (o app nunca preenche): o sistema passa a poder sugerir, sempre editável e desligável. Registrado como D-139.

## What Changes

- Dados locais de lugares (municípios do Brasil, pontos turísticos por UF, países) gerados em build e lidos sob demanda; `window.PLLOCAIS` com `buscar`, `deCoordenadas` e `pontosProximos`.
- O EXIF passa a ler latitude/longitude (só no registro local da foto, para sugerir).
- Seção «Avançado» no painel de legendas: padrão de 2 linhas (Localização, Data, Ponto turístico, Texto livre, Nenhum), tamanho por linha, «Aplicar a todas», exceção por foto, texto manual preservado, «Restaurar sugestão» e autocomplete «Cidade - UF».
- Interruptor «Sugestões de legendas» (ligado por padrão, por projeto) logo abaixo de «Sem legendas»; desabilitado quando «Sem legendas» está ligado.
- `PLTEXTO.comPadrao` como fonte única para Quadro, Folhas e PDF (MT-02).

## Capabilities

### New Capabilities
- `locais`: dados e consultas de lugares no aparelho.

### Modified Capabilities
- `legenda-polaroid`: padrão de 2 linhas, sugestões e interruptor «Sugestões de legendas».

## Impact

Decisões: cria D-139; altera D-138 (pré-preenchimento permitido); respeita D-135, D-136, MT-02, T5 (tudo no aparelho, CSP `connect-src 'self'`), T3 e T4 (nada sobre a foto; ícone + texto). Código: `site/assets/js/nucleo/{locais,exif,legenda-texto,gerador}.js`, `site/assets/js/editor/{legendas,metadados}.js`, `site/assets/js/pages/{editor,quadro}.js`, `tools/gerar-locais.mjs`, `site/assets/dados/locais/`.

Fora do escopo: geocodificação por rede, mapa, polígonos municipais (a cidade sugerida é o município de centro mais próximo, aproximado), escolha de fonte e cor por linha do padrão avançado, importação de legendas de outros apps.
