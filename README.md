# PolarLife

Editor web **local-first** para criar polaroids, imprimi-las em folhas e compartilhá-las. As fotos nunca saem do aparelho (BR-01).

## Estrutura

```
site/                  ← tudo o que é publicado (GitHub Pages e Vercel)
  index.html             Apresentação · como-funciona/ · legal/ (privacidade, termos e cookies)
  app/                   aplicativo (noindex): entrar/, inicio/, projetos (index), novo-projeto/, adicionar-fotos/,
                         processando/, resumo/, orientacao/, editor/ (Folhas e Colagem), editor/quadro/ (Quadro),
                         editor/exportar/, editor/gerar/, editor/imprimir/, editor/compartilhar/, conexoes/,
                         conta/, conta/planos/, admin/, estados/ (catálogo de estados vazios e erros)
  assets/
    css/base/            fonts.css · tokens.css · led.css (LED v4)
    css/ui/ · css/editor/ · css/pages/ (um arquivo por tela)
    js/nucleo/           domínio sem DOM de tela: PLFOLHAS, PLCOLAGEM, PLTEXTO, PLGERADOR (PDF e imagens), PLFOTOS, PLPROJETOS, PLCONTA…
    js/ui/ · js/editor/ · js/pages/ (um script por rota)
    vendor/              pdf-lib e fontkit locais (T6) + LICENCAS.txt
    fonts/               fontes autohospedadas (WOFF2) e pdf/ (TTF para o PDF e as imagens)
    img/                 logos, fotos CC0 (fotos/CREDITOS.md), vitrine/ (prévias geradas pelo próprio PolarLife)
docs/                  ← especificação (DOC-00 a DOC-14); decisões em 10_LOG_DECISOES.md; historico/ (etapas e auditorias)
design/referencias/    ← logos originais (fonte dos ícones), LED v4 e HTMLs de referência
openspec/              ← propostas e especificações das mudanças (OpenSpec)
tools/                 ← manutenção: verificar, seo, sw, og, ícones, mídia, vitrine, fontes, vendor
tests/
  unit/                  sem navegador (motor do Quadro, Colagem, EXIF, locais…)
  e2e/                   Playwright em Node, uma tela ou regra por arquivo
  helpers/servidor.mjs   servidor estático dos testes
  saida/                 capturas, PDFs e imagens gerados pelos testes (fora do git)
AGENTS.md              ← regras para agentes de código (Travas, estilo, verificação, fotos de teste)
STATUS.md              ← o que está no ar, como publicar e o que falta
```

## Rodar e verificar

Uma vez: `npm ci` e `npx playwright install chromium`. Não há Python na máquina: todos os testes são em Node.

```bash
npm run serve        # abre site/ em http://localhost:3000
npm run verificar    # links, ativos, noindex em /app, peso ≤ 500, paleta, SEO, lista do service worker
npm run testar:node  # a suíte inteira (unidade + navegador), a mesma do CI
npm run testar:feed  # um teste só (cada tela ou regra tem o seu testar:*)
npm run sw           # depois de mudar arquivos do site: atualiza a lista do service worker
npm run vitrine      # refaz as prévias das sugestões, modelos, colagens para as redes e banners
```

Todos os links são **relativos**: o site funciona na raiz de um domínio ou em `usuario.github.io/repositorio/`.

## Publicar

- **GitHub Pages:** cada push em `main` roda o CI (verificar + testes) e publica `site/` em https://mateus-senaj.github.io/polar-life/.
- **Vercel:** `vercel deploy --prod --yes` a partir da cópia de deploy (destacada em `origin/main`) publica em https://polar-life.vercel.app.

## Regras que valem em toda tela

Fonte da verdade: `docs/12_ORQUESTRADOR_AGENTES-2.md` (§1.3, as 9 Travas). Em resumo: 4 cores + `#F8F9FA`; Inter, Cormorant Garamond, IBM Plex Mono com peso ≤ 500; um único botão LED por tela; nada sobre a foto; sem CDN nem terceiros; dados de exemplo do DOC-04 §6.
