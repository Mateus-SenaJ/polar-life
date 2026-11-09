# Próximos passos (a partir da etapa 29)

**Estado:** etapas 1 a 28 prontas. Telas feitas: T-01 a T-14, T-18 a T-24, T-28 a T-31. Testes: `verificar`, `testar`, `testar:lote|formato|prevoo|exportar|gerar|imprimir|compartilhar|conexoes|estados|adicionar|processando|esqueleto|janela|valores` passam.

## Ordem sugerida
1. ~~Ligar o que falta da T-31~~ **feito na etapa 24** (esqueleto na T-01 e no editor). A T-31 está fechada.
2. **Gerador real de PDF e imagens** (DOC-08 §6). Hoje T-20, T-21 e T-22 usam arquivo de exemplo. Precisa de dependências de rede (ex.: jsPDF/pdf-lib) que este ambiente não tem; fazer onde houver rede.
3. **P-FONTES:** baixar as `.woff2` (Cormorant Garamond 300/400, Caveat 500, IBM Plex Mono 400 e as 22 do catálogo), descomentar `fonts.css` e remover os `<link>` do Google Fonts. Exige rede.
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
Subir `polar-life-etapa28.zip`, ler `STATUS.md` (seção da etapa 28 e esta lista) e seguir o item 2 (ou o 4, se ainda não houver rede).
