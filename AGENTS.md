# PolarLife · instruções para agentes de código

Editor web **local-first** de polaroids. Site estático em `site/` (HTML, CSS e JS sem build), publicado no GitHub Pages.
Leia `README.md`, `STATUS.md` (seção da última etapa) e `PROXIMOS_PASSOS.md` antes de mudar algo.
A especificação está em `docs/` (o `docs/12_ORQUESTRADOR_AGENTES-2.md` §1.3 é a fonte de autoridade).

## Travas (nunca quebrar)
- T1 Tipografia: só as famílias e pesos do DOC-02; peso máximo 500.
- T2 Cor: só `#FFFFFF`, `#000000`, `#006194`, `#FD761A` e `#F8F9FA`. Sem vermelho, verde ou outro cinza.
- T3 Acessibilidade: nada só por cor (ícone + texto); alvos ≥ 44 px; foco visível.
- T4 Nada sobre a foto: sem número, código, coordenada ou selo sobre a foto, na tela ou no arquivo.
- T5 Privacidade: tudo roda no aparelho; nenhuma foto, legenda ou dado sai para servidor.
- T6 Terceiros: **nenhum** CDN, fonte, script ou ícone externo. Bibliotecas ficam em `site/assets/vendor/`; fontes em `site/assets/fonts/`.
- T7 Sem jargão interno nem promessa que o produto não cumpre.
- T8 Um único botão LED principal por tela.

## Estilo de código
- JS do site: ES5 em IIFE (`(function(){ ... })();`), sem módulos, sem build, igual aos arquivos existentes em `site/assets/js/`. Expor APIs em `window.PLxxx`.
- Textos de interface em **português do Brasil**, com o vocabulário do DOC-00 §4 (Folha ≠ Colagem ≠ Lembrança; Recorte ≠ Guias de corte).
- Comentários curtos citando a regra (ex.: `DOC-08 §6`, `MT-02`, `BR-13`).
- Unidades internas em mm (o DOC-08 MT-01 pede µm inteiros na display list: converta com `Math.round(mm*1000)`).
- Links sempre relativos (o site roda em `usuario.github.io/polar-life/`).
- Scripts de teste e ferramentas em `tools/*.mjs` e `tests/**/*.mjs` (Node ≥ 20, ESM). **Não há Python nesta máquina**: testes novos em Node com `playwright` e `tests/helpers/servidor.mjs`.

## Onde fica cada coisa
- `site/assets/js/nucleo/` domínio sem DOM de tela (`PLFOLHAS`, `PLTEXTO`, `PLGERADOR`) · `js/ui/` componentes compartilhados · `js/editor/` módulos do inspetor e do pré-voo · `js/pages/` um script por rota.
- `site/assets/css/base/` (fontes, tokens, LED) · `css/ui/` · `css/editor/` · `css/pages/` (um por tela).
- `tools/` manutenção · `tests/unit/`, `tests/e2e/` (Node), `tests/e2e-py/` (legado) · saídas em `tests/saida/` (fora do git).
- Um nome `window.PLxxx` por arquivo (o `verificar` acusa colisão). Arquivo novo vai na camada certa; não crie pasta nova sem motivo.

## Verificação obrigatória antes de entregar
```
npm run verificar      # tem de terminar com "✔ Sem erros"
npm run testar:node    # motor do Quadro, fontes e PDF
```
Mais o teste específico da tarefa. Não faça `git commit` nem `git push`: o orquestrador revisa e faz o commit.
Não apague arquivos fora do escopo da tarefa. Não mexa em `docs/` (só o orquestrador atualiza STATUS e o log de decisões).

## Fotos reais de teste (privacidade, T5)
As fotos pessoais do dono ficam em `.local/fotos-de-teste/` dentro do repositório (pasta **ignorada pelo git**; 69 JPEGs de ~12 MP).
Testes podem **ler** essa pasta (variável `PL_FOTOS`, padrão `.local/fotos-de-teste/`), mas **nunca** copiar, recortar, redimensionar
ou salvar essas fotos (nem derivados) dentro do repositório. Saídas de teste vão para `tests/saida/` (ignorada no git).
Se a pasta não existir, o teste pula as conferências com foto real e avisa.
