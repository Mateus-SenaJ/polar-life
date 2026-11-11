# locais Specification

## Purpose
TBD - created by archiving change legendas-locais-e-padroes. Update Purpose after archive.

## Requirements

### Requirement: Dados de lugares locais
O sistema SHALL ler municípios do Brasil, pontos turísticos por UF e países de arquivos em `site/assets/dados/locais/`, carregados só quando necessários e sem consulta a serviços externos em tempo de uso. O arquivo de municípios MUST ter menos de 200 KB e os créditos e licenças MUST estar em `CREDITOS.md`, com link na página Legal.

#### Scenario: Tamanho e créditos
- **WHEN** os dados são gerados por `tools/gerar-locais.mjs`
- **THEN** `municipios.json` tem menos de 200 KB, `CREDITOS.md` cita MIT, CC0 e domínio público, e a página Legal liga para ele

### Requirement: Busca de cidade com acentos
`PLLOCAIS.buscar(texto)` SHALL devolver `[{cidade, uf}]` ignorando acentos e caixa, aceitar «Cidade - UF» e listar homônimos um por UF.

#### Scenario: Acentos e homônimos
- **WHEN** a busca recebe «itacare» e depois «Bom Jesus»
- **THEN** a primeira contém «Itacaré - BA» e a segunda traz «Bom Jesus» em UFs diferentes, uma entrada por UF

### Requirement: Cidade, estado e país a partir de coordenadas
`PLLOCAIS.deCoordenadas(lat, lon)` SHALL devolver `{cidade, uf, pais}`: no Brasil, o município cujo polígono (malha do IBGE) contém o ponto, ou o de borda mais próxima se nenhum contiver; fora, só o país, com cidade e UF vazios.

#### Scenario: Coordenadas conhecidas
- **WHEN** as coordenadas de Salvador, Itacaré e Recife são consultadas
- **THEN** o resultado é Salvador - BA, Itacaré - BA e Recife - PE, a Praia de Itapuã dá Salvador (não Lauro de Freitas), Petrolina e Juazeiro ficam em PE e BA, e as de Lisboa dão país «Portugal» sem cidade

### Requirement: Pontos turísticos próximos
`PLLOCAIS.pontosProximos(lat, lon, uf, raioKm)` SHALL devolver os pontos do raio (padrão 2 km) ordenados por distância.

#### Scenario: Praia de Itapuã
- **WHEN** a posição da Praia de Itapuã é consultada na UF BA
- **THEN** o primeiro ponto é «Praia de Itapuã»
