## 1. Estado do projeto

- [x] 1.1 `nucleo/projetos.js`: marca `pl-projeto-sessao`, `sincronizado()`, `pronto`, `salvarEstado` protegido, `abrir` devolve dados, `excluir` limpa a aba — teste: «aba nova…» e «excluir o projeto aberto…» em `testar-navegacao.mjs`
- [x] 1.2 `pages/home.js` e `pages/inicio.js`: projeto sem fotos vai para «Adicionar fotos»; backup inválido avisa — teste: «projeto sem fotos…»
- [x] 1.3 `pages/novo-projeto.js`: reaproveita o projeto vazio; acerta o estado no `pageshow` — teste: «não cria projeto repetido»
- [x] 1.4 `app/resumo/` e `app/orientacao/`: carregam `projetos.js` (e `fotos-locais.js`, `motor-folhas.js`)

## 2. Escolhas que chegam à tela seguinte

- [x] 2.1 `nucleo/motor-folhas.js`: `FORMATOS` e `formatoInicial()`
- [x] 2.2 `pages/editor.js`, `editor/molduras.js`, `nucleo/gerador.js`: usam `formatoInicial()`; Folhas com os seis formatos; «N por folha» — teste: «papel A5 e moldura Instax Mini…»
- [x] 2.3 `pages/novo-projeto.js` e `pages/adicionar-fotos.js`: gravam e preservam `pl-fmt` e a semente de `pl-folhas`
- [x] 2.4 `pages/resumo.js`: previsão com formato e papel reais — teste: «resumo: folhas previstas…»
- [x] 2.5 `pages/orientacao.js`: números reais; mantém o papel — teste: «orientação: números do projeto real…»

## 3. Navegação e textos

- [x] 3.1 `app/editor/quadro/index.html` + `pages/editor.js`: «Colagem» vira link — teste: «Quadro → Colagem…»
- [x] 3.2 `pages/entrar.js` (`location.replace`), `pages/conta.js` (destino guardado) — teste: «Voltar depois de entrar…»
- [x] 3.3 `ui/portao.js`: mensagens e quantidade — teste: «Grátis com a folha do mês livre…» e `testar-contas.mjs`
- [x] 3.4 `css/pages/editor.css`: 1024 a 1199 px sem rolagem lateral (medido em 1024, 1100, 1199, 1200 e 1280)
- [x] 3.5 Textos e links: `pages/exportar.js`, `app/editor/gerar/`, `app/index.html`, `app/inicio/`, `prototipo/editor-v3/`

## 4. Teste, registro e verificação

- [x] 4.1 `tests/e2e/testar-navegacao.mjs` em `testar:node` (`package.json`)
- [x] 4.2 `docs/10_LOG_DECISOES.md` (D-157 a D-164) e `docs/AUDITORIA_FLUXOS.md`
- [x] 4.3 `npm run sw`, `npm run verificar` e `npm run testar:node` com a saída real registrada no relatório
