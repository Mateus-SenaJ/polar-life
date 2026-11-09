# Status do projeto

Atualizado na **etapa 30a** (motor real do gerador de PDF). Antes: etapa 29 (fontes autohospedadas: P-FONTES fechada), etapa 28 («Valores diferentes» dentro dos campos da aba Ajustes), etapa 27 (orientação Vertical/Horizontal da polaroid), etapa 26 (medidas oficiais das janelas e atalhos de personalização da moldura), etapa 25 (janela não quadrada: Retro Pocket, Instax Mini e Wide). Antes: etapa 24 (esqueleto de carregamento na T-01 e no editor; fecha a T-31), etapa 23 (falha de leitura na T-04 no padrão da T-31). Antes: etapa 22 (arquivo inválido da T-03). Antes: etapa 21 (T-31 Estados vazios e erros, 404; E12; ligas soltas de conexões). Antes: etapa 20 (T-23 Central de conexões e T-24 Verificação; E7), etapa 19 (T-22 Compartilhar; fecha o E6), etapa 18 (T-21 Imprimir e calibração), etapa 17 (T-20 Gerando), etapa 16 (T-19 Exportar), etapa 15 (T-18 Pré-voo), etapa 14 (pendências da legenda nas folhas: metadados por foto, «Ajustar para caber» e área segura). Antes: etapa 13 (formato da data e posição da legenda). Antes: etapa 12 (estilo e fonte da legenda nas folhas). Antes: etapa 11 (pop-ups de confirmação, T-07 com o formato e a legenda do Quadro). A etapa 1 organizou o repositório e migrou as 7 telas existentes; a etapa 2 fez T-05 e T-06; a etapa 3 fez a T-07; a etapa 4 fez a T-08; a etapa 5 fez a T-10; a etapa 6 fez a T-11; a etapa 7 fez a T-12 (parcial); a etapa 8 fez a T-13; a etapa 9 fez a T-14 (parcial); a etapa 10 fechou a T-14 (lote dinâmico); a etapa 11 ligou a T-12 às Folhas (pop-up de formato) e guardou o estado entre os modos.

## Telas (DOC-04 §4)

| ID | Tela | Rota em `site/` | Etapa (DOC-11) | Estado |
| --- | --- | --- | --- | --- |
| T-28 | Apresentação | `/` | E10 | ✔ feita |
| T-29 | Como funciona | `/como-funciona/` | E10 | ✔ feita |
| T-30 | Privacidade, termos e cookies | `/legal/` | E11 | ✔ feita |
| T-01 | Home de projetos | `/app/` | E9 | ✔ feita |
| T-02 | Novo projeto e formato | `/app/novo-projeto/` | E9 | ✔ feita |
| T-03 | Adicionar fotos | `/app/adicionar-fotos/` | E5 | ✔ feita |
| T-04 | Processando | `/app/processando/` | E5 | ✔ feita |
| T-05 | Resumo da importação | `/app/resumo/` | E5 | ✔ feita (etapa 2) |
| T-06 | Pergunta de orientação | `/app/orientacao/` | E5 | ✔ feita (etapa 2) |
| T-07 | Editor · Modo Folhas (aba Papel) | `/app/editor/` | E2 | ✔ feita (etapa 3) |
| T-08 | Editor · Modo Quadro (aba Ajustes) | `/app/editor/quadro/` | E3 | ✔ feita (etapa 4) |
| T-09 | Inspetor · Papel e guias | `/app/editor/` (aba Papel) | E4 | ✔ já existia na T-07 (falta conferir os 3 estados do grupo) |
| T-10 | Inspetor · Legendas | `/app/editor/quadro/` (aba Legendas) | E4 | ✔ feita (etapa 5) |
| T-11 | Inspetor · Ajustes e filtros | `/app/editor/quadro/` (aba Ajustes) | E4 | ✔ feita (etapa 6; «Valores diferentes» nos campos na etapa 28) |
| T-12 | Inspetor · Molduras e medidas | `/app/editor/quadro/` (aba Molduras) | E4 | ✔ feita (etapa 7; pop-up de troca e Folhas na etapa 11; janela não quadrada na etapa 25; orientação na etapa 27) |
| T-13 | Inspetor · Metadados | `/app/editor/quadro/` (aba Metadados) | E4 | ✔ feita (etapa 8) |
| T-14 | Lote e seleção | `/app/editor/quadro/` | E4 | ✔ feita (etapa 9; Duplicar e Remover na etapa 10) |
| T-15 a T-17 | Colagem e lembranças (1.1) | — | E8 | ◻ |
| T-18 | Pré-voo «Tudo pronto para o papel?» | pop-up em `/app/editor/` | E6 | ✔ feita (etapa 15) |
| T-19 | Exportar | `/app/editor/exportar/` | E6 | ✔ feita (etapa 16) |
| T-20 | Gerando · recuperação · concluído | `/app/editor/gerar/` | E6 | ✔ feita (etapa 17), progresso simulado |
| T-21 | Imprimir agora e calibração | `/app/editor/imprimir/` | E6 | ✔ feita (etapa 18) |
| T-22 | Compartilhar | `/app/editor/compartilhar/` | E6 | ✔ feita (etapa 19), arquivo de exemplo |
| T-23 | Central de conexões | `/app/conexoes/` | E7 | ✔ feita (etapa 20) |
| T-24 | Verificação de conexão | folha em `/app/conexoes/` | E7 | ✔ feita (etapa 20) |
| T-25 | Entrar (2.0) | — | E10 | ◻ |
| T-26, T-27 | Direito de uso e conta (2.0) | — | — | ◻ |
| T-31 | Estados vazios e erros | `/app/estados/` e `404.html` | E12 | ✔ feita (etapa 21), página de catálogo |

## Etapa 30 · Reorganização das pastas (sem mudança de comportamento)

- `scripts/` virou `tools/` (manutenção) e `tests/` (`unit/`, `e2e/` em Node, `e2e-py/` legado, `helpers/`, `saida/` fora do git).
- `site/assets/js` em camadas: `nucleo/` (domínio), `ui/`, `editor/` (módulos do inspetor e pré-voo), `pages/` (uma por rota). `css` igual: `base/`, `ui/`, `editor/`, `pages/`. Rotas públicas iguais.
- Histórico das etapas 1 a 28 em `docs/historico/ETAPAS.md`. `.editorconfig` (UTF-8, LF). CI roda `npm ci`, `verificar` e `testar:node` (Playwright) antes de publicar.
- Conferido: `verificar` sem erros, `testar:node` passa (MT-02 0,014 mm), Quadro e Folhas abrem sem erro de JS.

## Etapa 30a · Motor do gerador de PDF (DOC-08 §6, MT-01 a MT-07)

- **Bibliotecas locais (T6):** pdf-lib 1.17.1 e @pdf-lib/fontkit 1.1.1 em `site/assets/vendor/` (`npm run vendor`, licenças em `vendor/LICENCAS.txt`).
- **Uma conta só (MT-02):** `PLFOLHAS.paginar` (motor-folhas.js) serve a T-07 e o PDF; `PLFOLHAS.ler()` também aplica a escolha da T-06 (`pl-orientacao`). Formatos e textos da legenda saíram do `editor.js` para `legenda-texto.js` (`window.PLTEXTO`). O `verificar` agora acusa dois arquivos definindo o mesmo `window.PLxxx`.
- **`gerador.js` (`window.PLGERADOR`):** `projeto()` lê o estado; `lista()` monta a display list em **µm inteiros** (polaroid, janela, legenda abaixo/acima/ambas, estilos etiqueta/bilhete/carimbo/calendário/contornada, `dx/dy/inc`, «Ajustar para caber», assinatura, guias contínuas ou de canto deslocadas 0,05 mm para fora, contorno 0,25 pt, rodapé); `foto()` rasteriza a janela com recorte, ajustes, filtro, vinheta e nitidez (≥ 300 PPI); `pdf()` gera alta (326 PPI, JPEG .92) e leve (300 PPI, .72), páginas no tamanho exato, fontes em subconjunto, sem metadados, `/PrintScaling /None`, volumes por limite de MB, falha isolada por foto, cancelamento e avisos.
- **Orientação Horizontal (D-109):** moldura, legenda e assinatura giram 90°; a foto fica de pé na janela girada.
- **Teste:** `npm run testar:pdf`: páginas, metadados, fontes, imagens, leve, falhas, `sem`, MT-04, Mini, separar, volumes, cancelar, legenda longa (T4), avisos e **fidelidade MT-02 contra o DOM da T-07** em 9 casos (desvio máximo 0,014 mm; tolerância 0,05 mm).
- **Folhas (T-07):** estilos etiqueta/bilhete/carimbo/calendário com borda e raio proporcionais à escala da folha (`var(--mm)`), para a tela mostrar o que sai no papel.
- **Revisão:** OpenCode (big-pickle) implementou; orquestrador reprovou 2 rodadas pela imagem (legenda sobre a foto por mistura mm/µm; foto deitada na Horizontal); DeepSeek achou colisão de `window.PLLEG` e `pl-orientacao` ignorado; Copilot corrigiu o desvio do calendário.
- **Ainda simulado:** T-20/T-21/T-22 (tarefa 30b), imagens PNG/JPEG (32). A T-07 ainda não desenha a polaroid Horizontal girada (bug da etapa 27, entra na 30b).

## Etapa 29 · Fontes autohospedadas (P-FONTES · T6, TP-06, TP-08)

- **O que mudou:** nenhuma página chama mais o Google Fonts. As fontes do sistema (Inter 300/400/500, Cormorant Garamond 300/400 e itálico 300/400, Caveat 400/500, IBM Plex Mono 400) e as do catálogo de legendas estão em `site/assets/fonts/` em **subconjunto latino + pt-BR** (WOFF2, 5 a 60 KB cada). `fonts.css` declara todas; o navegador só baixa a que algum texto usa, então o carregamento continua sob demanda (DOC-02 §4). `legendas.js` deixou de montar o `<link>` do Google e só pede, com `document.fonts.load`, as fontes visíveis no seletor.
- **Para o PDF (TP-08, MT-07):** a mesma fonte também sai em **TTF** em `site/assets/fonts/pdf/`, pronta para o gerador embutir em subconjunto (etapa 30).
- **Reprodutível:** `npm run fontes` (`scripts/baixar-fontes.mjs`, precisa de rede) baixa, gera o subconjunto, confere os acentos e junta as licenças em `site/assets/fonts/LICENCAS.txt` (OFL 1.1; Apache 2.0 para Homemade Apple, Satisfy e Special Elite).
- **Teste de acentuação (DOC-02 §4):** **Nanum Pen Script e Gaegu falharam** (nenhum acento do pt-BR) e **saíram do catálogo**, que passa a ter **24 fontes** (D-111). Projeto que já usava uma delas cai no padrão Caveat. `[VALIDAR]` com o dono se quer substitutas manuscritas.
- **Verificador:** recurso externo em HTML, **CSS e JS** agora é **erro** (antes o Google Fonts era só aviso e o JS não era lido).
- **Teste:** `npm run testar:fontes` (Node + Playwright, Chromium): as 18 páginas sem nenhum pedido fora do site; as 30 combinações de família e peso carregam dos arquivos locais com `á ã ç é ê í ó õ ú`. `verificar` e `testar` passam.
- **Ambiente:** os testes `testar:*` em Python não rodaram nesta máquina (sem Python). Os testes novos passam a ser em Node (`tests/helpers/servidor.mjs` serve o `site/`); `npm install` e `npx playwright install chromium` antes do primeiro uso.
- **Correção:** `verificar.mjs` resolvia `site/` como `C:\C:\…` no Windows; agora usa `fileURLToPath`.

## Etapas 1 a 28

Histórico completo em [`docs/historico/ETAPAS.md`](docs/historico/ETAPAS.md).

## Pontas soltas nas telas existentes

- `#projetos` (T-01): o card e o logo apontam para um destino provisório. Passa a ser o editor quando a T-07 existir.
- Estado das telas por hash (`#vazia`, `#estado-…`): é só para revisão do protótipo. `[VALIDAR]` se continua no produto.
- **Não testado em navegador real nesta etapa.** Foram feitas: verificação estática (`npm run verificar`), checagem de sintaxe dos scripts e conferência de que não restou `claude.ai` nem `data:` nas páginas. Falta abrir cada tela em desktop e celular e comparar com o original.

## Pendências

| ID | Item | Origem |
| --- | --- | --- |
| P28 | Favicon quadrado (512, 192, 180, 48, 32, 16) | DOC-12 §3.5 |
| P29 / P30 | Logo monocromático e logos em SVG | DOC-12 §3.5 |
| P31 | Foto de capa do hero (licença, J4) | DOC-12 §3.5 |
| J1 a J10 | Dados do controlador e demais itens jurídicos da T-30 continuam `[COLCHETES]` | DOC-09 |

## Próxima etapa (30b)

Ver `PROXIMOS_PASSOS.md`.
