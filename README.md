# PolarLife

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
    css/base/           fonts.css · tokens.css · led.css (LED v4, DOC-01 §11) — valem em todas as telas
    css/ui/             componentes compartilhados (esqueleto de carregamento)
    css/editor/         módulos do inspetor e pop-ups do editor (legendas, lote, metadados, molduras, prevoo)
    css/pages/          um arquivo por tela
    js/nucleo/          domínio, sem DOM de tela: motor-folhas (PLFOLHAS), legenda-texto (PLTEXTO), gerador (PLGERADOR)
    js/ui/              componentes compartilhados (esqueleto)
    js/editor/          módulos do inspetor e do pré-voo (filtros, legendas, lote, metadados, molduras, prevoo)
    js/pages/           um script por rota (home, editor, quadro, gerar, …)
    vendor/             pdf-lib e fontkit locais (T6) + LICENCAS.txt
    fonts/              fontes autohospedadas (WOFF2), pdf/ (TTF para o PDF) e LICENCAS.txt
    img/logos/          nomes oficiais do DOC-01 §13
docs/                 ← especificação (DOC-00 a DOC-12). O DOC-12 é o orquestrador
  historico/ETAPAS.md   histórico das etapas 1 a 28
design/
  referencias/          HTMLs canônicos E1 e E4b + polar-led.css (LED v4 canônico)
  prototipos-originais/ HTMLs de origem, intocados (auditoria)
tools/                ← manutenção: verificar.mjs (checagem estática), baixar-fontes.mjs, copiar-vendor.mjs
tests/
  unit/                 sem navegador (motor do Quadro)
  e2e/                  Playwright em Node (fontes, PDF, …)
  e2e-py/               Playwright em Python (etapas 1 a 28)
  helpers/servidor.mjs  servidor estático dos testes
  saida/                capturas e PDFs gerados pelos testes (fora do git)
AGENTS.md             ← regras para agentes de código (Travas, estilo, verificação, fotos de teste)
STATUS.md             ← estado atual, última etapa e pendências
PROXIMOS_PASSOS.md    ← o que vem a seguir
```

## Rodar e verificar

Os testes `testar:*` em Python usam Playwright para Python; os novos (`.mjs`) usam o Playwright do Node: `npm install` e `npx playwright install chromium` uma vez.

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
npm run testar:fontes  # Chromium (Node): nenhuma página pede nada de fora; catálogo de fontes local e com acentos
npm run fontes         # (com rede) baixa as fontes, gera o subconjunto pt-BR e as licenças
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
