# Créditos dos dados de lugares

Gerados em tempo de build por `tools/gerar-locais.mjs`. O site não consulta nada de terceiros em tempo de uso: tudo é lido destes arquivos, no aparelho.

| Arquivo | Conteúdo | Fonte | Licença |
|---|---|---|---|
| municipios.json | Municípios do Brasil (nome, UF, latitude e longitude com 3 casas) | kelvins/municipios-brasileiros (https://github.com/kelvins/municipios-brasileiros), dados do IBGE | MIT |
| malha-UF.json | Contornos dos municípios, um arquivo por UF (qualidade mínima do IBGE, 4 casas decimais, em deltas), para achar o município que contém a posição da foto | IBGE, API de malhas e de localidades (https://servicodados.ibge.gov.br) | Dados públicos (IBGE) |
| pontos-UF.json | Praias, monumentos, atrações, parques nacionais, cachoeiras, faróis, sítios arqueológicos e fortificações do Brasil, um arquivo por UF (rótulo em português, com o município; pontos mais conhecidos primeiro) | Wikidata (https://www.wikidata.org) | CC0 |
| paises.json | Contornos simplificados dos países (Natural Earth 110m, 1 casa decimal), nomes em português | Natural Earth (https://www.naturalearthdata.com), repositório nvkelso/natural-earth-vector | Domínio público |

A cidade e o ponto sugeridos a partir da posição de uma foto são aproximados e sempre editáveis. As coordenadas da foto ficam só no aparelho e nunca entram na legenda nem no PDF.
