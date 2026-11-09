# Próximos passos (a partir da etapa 30)

**Estado:** etapas 1 a 29 prontas. Telas feitas: T-01 a T-14, T-18 a T-24, T-28 a T-31. Testes: `verificar`, `testar`, `testar:lote|formato|prevoo|exportar|gerar|imprimir|compartilhar|conexoes|estados|adicionar|processando|esqueleto|janela|valores` passam (os de Python, até a etapa 28) e `testar:fontes` (Node) passa.

## Ordem sugerida
1. ~~Ligar o que falta da T-31~~ **feito na etapa 24** (esqueleto na T-01 e no editor). A T-31 está fechada.
2. **Gerador real de PDF e imagens** (DOC-08 §6). Hoje T-20, T-21 e T-22 usam arquivo de exemplo. pdf-lib + fontkit (DOC-08 §7), copiados para `site/assets/vendor/` (sem CDN, T6), com as fontes TTF da etapa 29.
3. ~~**P-FONTES**~~ **feito na etapa 29**: fontes em `site/assets/fonts/` (WOFF2 para o site, TTF em `pdf/` para o gerador). Nanum Pen Script e Gaegu saíram do catálogo (sem acentos, D-111).
4. **Fechar o E4:** ~~janela não quadrada~~ **feito na etapa 25**; ~~medidas oficiais e atalhos de personalização~~ **feito na etapa 26**. **orientação feita na etapa 27** (projeto todo, opção A); ~~«Valores diferentes» dentro dos campos~~ **feito na etapa 28** (etiqueta no cabeçalho, D-110). Falta: orientação por foto e seleção por folha na T-07.
5. **E8 (1.1):** Colagem e Lembranças, T-15 a T-17.
6. **E13 · Verificação final:** revisar todas as telas contra o checklist do DOC-11 §4 (só violações) e conferir tablet 834.

## Decisões com o dono
- **Orientação da polaroid:** implementada a opção **A** na etapa 27 (D-109, `[RECOMENDADO]`). Confirmar com o dono ou trocar por B/C.
- **«Valores diferentes» (D-110):** hoje é uma etiqueta no cabeçalho do campo, com a contagem na ajuda; o campo mostra o número da foto aberta. Confirmar com o dono ou pedir o texto dentro do próprio campo (estado «misto», mudança maior).
- Janela do Clássico: 76 × 76 (DOC-05) × ~79 × 79 (filme Polaroid real).
- Faixas superior e inferior do Mini, Square, Wide e Pocket: medir um filme real.
- Cota do passe-partout: 24,5 mm (docs) × 25 mm (cálculo) · D-067.
- Folhas: 6 (DOC-04 §6) × 7 (separar por orientação).
- 404 em subcaminho do GitHub Pages; avatar na 1.0.
- Pendências P1 a P25 e J1 a J10 seguem em `docs/10_LOG_DECISOES.md` e `STATUS.md`.

## Como continuar
Ler `STATUS.md` (seção da última etapa e esta lista) e seguir o item 2. Testes novos em Node: `npm install`, `npx playwright install chromium`, `npm run testar:fontes`.
