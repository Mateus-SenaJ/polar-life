# Polar Life

Editor web **local-first** para criar polaroids, imprimi-las em folhas e compartilhá-las. As fotos nunca saem do aparelho (BR-01).

## Estrutura

```
site/                 ← tudo o que é publicado (raiz do GitHub Pages)
  index.html            T-28 Apresentação
  como-funciona/        T-29
  legal/                T-30 Privacidade, termos e cookies
  app/                  T-01 Home · noindex
    novo-projeto/       T-02
    adicionar-fotos/    T-03
    processando/        T-04
    resumo/             T-05
    orientacao/         T-06
    editor/             T-07 Modo Folhas (aba Papel) + T-18 Pré-voo (pop-up de «Revisar impressão»)
    editor/exportar/    T-19 Exportar
    editor/gerar/       T-20 Gerando · recuperação · concluído
    estados/            T-31 Estados vazios e erros (404.html na raiz)
    conexoes/           T-23 Central de conexões + T-24 Verificação (folha)
    editor/imprimir/    T-21 Imprimir agora e calibração
    editor/compartilhar/ T-22 Compartilhar (Web Share ou «Baixar»)
      quadro/           T-08 Modo Quadro (aba Ajustes) + T-10 (Legendas) + T-11 (filtros) + T-12 (Molduras) + T-13 (Metadados) + T-14 (Lote e seleção) · #foto-N
  assets/
    css/  fonts.css · tokens.css · led.css (compartilhados) · pages/<tela>.css
    js/motor-folhas.js  papel, grade e contagem de folhas (T-07 e pop-up de formato)
    js/pages/           comportamento de cada tela
    fonts/              Inter 400 e 500 (autohospedadas)
    img/logos/          nomes oficiais do DOC-01 §13
docs/                 ← especificação (DOC-00 a DOC-12). O DOC-12 é o orquestrador
design/
  referencias/          HTMLs canônicos E1 (componentes) e E4b (layout do editor)
  prototipos-originais/ HTMLs de origem, intocados (auditoria)
scripts/verificar.mjs ← checagem estática (links, ativos, T1, T2, T6)
scripts/testar-*.{mjs,py} ← motor do Quadro e teste de navegador do lote
STATUS.md             ← telas feitas, próximas etapas, pendências
```

## Rodar e verificar

```bash
npm run serve        # abre site/ em http://localhost:3000
npm run verificar    # links, ativos, noindex em /app, peso ≤ 500, paleta
npm run testar       # motor do Quadro: PPI (BR-12), endireitar, cobertura da janela
npm run testar:lote  # Chromium (Playwright): Duplicar, Remover (com pop-up), desfazer e a T-07 com o lote real
npm run testar:formato # Chromium: pop-up Trocar formato, T-07 com o formato e a legenda do Quadro, ida e volta
npm run testar:prevoo  # Chromium: T-18 pré-voo (3 severidades, bloqueio, confirmação, celular)
npm run testar:exportar # Chromium: T-19 Exportar (trava, cartões, estimador, volumes, celular)
npm run testar:gerar    # Chromium: T-20 Gerando, recuperação em 4 opções, concluído, celular
npm run testar:imprimir # Chromium: T-21 Imprimir agora, página de teste real, calibração em 3 passos
npm run testar:compartilhar # Chromium: T-22 Compartilhar, 4 caminhos (compartilha, cancela, erro, sem suporte), celular
npm run testar:estados # Chromium: T-31 Estados e 404 (erro com ✕ e 2 px, esqueleto, celular)
npm run testar:adicionar # Chromium: T-03 arquivo inválido no padrão T-31
npm run testar:processando # Chromium: T-04 falha de leitura (fotos 7 e 19), Tentar de novo e Trocar foto
npm run testar:conexoes # Chromium: T-23 Central de conexões e T-24 Verificação (estados, teste sem tocar em foto, celular)
npm run testar:janela # Chromium: janela não quadrada (Pocket, Instax Mini e Wide) no Quadro e na T-07
npm run testar:valores # Chromium: «Valores diferentes» nos campos da aba Ajustes (escopo, aplicar, desfazer, filtro, celular)
```

Todos os links são **relativos**: o site funciona na raiz de um domínio ou em `usuario.github.io/repositorio/`.

## Publicar

1. Crie o repositório e envie o conteúdo desta pasta (branch `main`).
2. Em **Settings → Pages → Source**, escolha **GitHub Actions**.
3. Cada push em `main` roda `verificar` e publica `site/`.

## Regras que valem em toda tela

Fonte da verdade: `docs/12_ORQUESTRADOR_AGENTES-2.md` (§1.3, as 9 Travas). Em resumo: 4 cores + `#F8F9FA`; Inter, Cormorant Garamond, IBM Plex Mono com peso ≤ 500; um único botão LED por tela; nada sobre a foto; sem CDN nem terceiros; dados de exemplo do DOC-04 §6.

## Decisão de arquitetura (etapa 1)

O DOC-08 §7 prevê Astro (site) + React/Vite/TS (app em `/app`). Nesta etapa as telas são HTML/CSS/JS estáticos, sem build, para publicar já e manter fidelidade ao design aprovado. Quando o editor (T-07 já existe em HTML estático) exigir estado, Dexie e workers, `site/app/` passa a ser gerado por Vite. As rotas e os assets não mudam.
