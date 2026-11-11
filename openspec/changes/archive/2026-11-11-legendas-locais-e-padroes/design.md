## Context

Legenda hoje: `ST[0].leg` (estilo do projeto), `ST[n].txt` (texto livre), `ST[n].meta` (`iso`, `c`). Quadro (`legendas.js`), Folhas (`pages/editor.js`) e PDF (`gerador.js`) desenham de `PLTEXTO` (MT-02).

## Decisions

- **Dados**: `site/assets/dados/locais/municipios.json` = `{ufs:[...], m:[[nome,iUF,lat,lon],...]}` (3 casas); `malha-UF.json` = `{m:[[nome,[polígono,...]],...]}` (malha municipal do IBGE, qualidade mínima, inteiros ×1e4 em deltas; polígono = anel externo + buracos); `pontos-UF.json` = `[[nome,lat,lon,municipio],...]` (até 650 por UF, mais conhecidos primeiro); `paises.json` = `[{n,c,p:[anel plano em décimos de grau]}]`. Gerados por `tools/gerar-locais.mjs` (MIT, CC0, domínio público); créditos em `CREDITOS.md`.
- **PLLOCAIS**: `fetch` same-origin sob demanda (base derivada de `document.currentScript`); `buscar(txt,max)` normaliza acentos e aceita «Cidade - UF»; `deCoordenadas(lat,lon)` devolve `{cidade,uf,pais}`: as 3 UFs de centroide mais próximo têm a malha carregada e vale o município cujo polígono contém o ponto (MultiPolygon e buracos); sem polígono que o contenha (costa), o município de borda mais próximo; fora do Brasil, só o país; `pontosProximos(lat,lon,uf,raioKm=2)` ordenado por distância.
- **Modelo**: `leg.pad = {on, l:[{t,pt},{t,pt}]}` (projeto); `ST[n].pad` = exceção da foto; `ST[n].pl = [{v,m},{v,m}]` com `m` verdadeiro para texto digitado; `leg.sug === false` desliga as sugestões (ausente = ligado). `t` é um de `loc`, `data`, `pt`, `txt`, `nenhum`; `pt` é 7, 8, 10 ou 12.
- **Fonte única (MT-02)**: `PLTEXTO.comPadrao(leg, foto)` devolve cópia da legenda em que a linha 1 ocupa o lugar da «data» e a linha 2 o do «local», em linhas separadas, com `_dt` e `_lc` já finais. Quadro, Folhas e PDF só leem essas duas strings; posições seguem `PLTEXTO.linhas` e `alinharX` (D-136).
- **Sugestão**: calculada ao aplicar (assíncrona) e gravada em `pl`; localização = cidade digitada em Metadados (resolvida para «Cidade - UF» se for única) ou GPS; data = `DD/MM/AA`; ponto = mais próximo em 2 km. Sem dado, linha vazia. Reaplicar só troca linhas com `m` falso. As coordenadas ficam no registro da foto (IndexedDB) e nunca no projeto.
- **UI**: «Avançado» recolhível; com o padrão ligado, as seções Data, Local e Linhas saem do painel (sem controle repetido). `datalist` nativo para o autocomplete.

## Risks / Trade-offs

- A malha «mínima» do IBGE é grossa (cerca de 25 vértices por município): perto de divisas pode errar poucas centenas de metros; sempre editável. Total das malhas ≈ 1,4 MB, no máximo 188 KB por UF, carregadas só para as UFs vizinhas do ponto.
- Fonte e cor das linhas seguem os estilos de Data e Local do projeto; sem controle próprio nesta etapa.
