## Why

O dono pediu uma auditoria do sistema inteiro atrás de erros de navegação e de fluxo. A varredura (Playwright, 23 rotas, 5 perfis, 390/768/1024/1440 px) achou uma perda de dados e vários pontos em que a tela mostrava o projeto de exemplo no lugar do projeto real ou descartava escolhas da pessoa. O relatório completo está em `docs/AUDITORIA_FLUXOS.md`.

## What Changes

- **Estado do projeto por aba (D-157):** a aba passa a marcar de qual projeto é o estado em `sessionStorage`. Aba nova ou reaberta recarrega o projeto atual do aparelho antes de qualquer gravação; nunca mais o exemplo é salvo por cima de um projeto real. Excluir o projeto aberto limpa o estado dele na aba.
- **Projeto sem fotos (D-158):** aberto pela lista ou pelo Início, continua em «Adicionar fotos» (antes abria o exemplo de 24 fotos). «Novo projeto» reaproveita o projeto ainda vazio em vez de criar outro a cada «Continuar».
- **Escolhas de «Novo projeto» chegam ao editor e ao PDF (D-159):** os seis formatos fixos e o papel (tamanho e orientação). Antes só o Retro Pocket chegava (D-113). O resumo da importação usa a mesma conta do editor (MT-02).
- **Pergunta de orientação com números reais (D-160):** em projeto real, nunca «24 fotos · 6 verticais · 18 horizontais».
- **«Colagem» no Quadro (D-161):** deixa de dizer «Em breve» e leva às Folhas no modo Colagem (D-150). Os textos do Início deixam claro que as colagens em imagem para as redes ainda não existem (T7).
- **Entrar e voltar (D-162):** depois de entrar, «Voltar» não devolve à tela de entrar; a Conta sem sessão guarda o destino certo.
- **Portão de folhas com mensagens verdadeiras (D-163):** só diz «Sua folha grátis foi usada» quando foi; com a folha do mês livre cobra só as que faltam; código que não cobre o arquivo não é chamado de «já usado» (T7).
- **Acertos de layout e de texto (D-164):** cabeçalho e botões do inspetor do editor entre 1024 e 1199 px sem rolagem lateral; «pré-voo» sai da interface; «N por folha» no lugar de «N clássicas por folha»; caminho de volta às folhas na tela do arquivo pronto; links vazios corrigidos; backup inválido avisa.
- **Teste novo:** `tests/e2e/testar-navegacao.mjs`, incluído em `testar:node`.

Respeita T1 a T8, D-113, D-116, D-118, D-123, D-124, D-133, D-150 e MT-02. Não muda regra de plano (DOC-03): o portão continua consumindo só na geração concluída (BR-10).

## Fora do escopo

- Formato «Personalizado» e polaroid na horizontal escolhidos em «Novo projeto» (as regras de medida de lá e da aba Molduras são diferentes; fica registrado como pendência).
- Página 404 em subpastas (depende de como cada hospedagem resolve a raiz; a CSP proíbe script embutido).
- Páginas de apresentação offline no app instalado (fora do alcance do service worker de `/app/`).
- Separar projetos por conta no mesmo aparelho (decisão de produto).
- `<h1>` no editor e alvos de 42 px (ajuste de sistema visual, D-134).

## Capabilities

### New Capabilities
- `navegacao`: regras de navegação e de continuidade do projeto entre telas, abas e recarregamentos.

### Modified Capabilities
- (nenhuma: os requisitos existentes não mudam de comportamento)

## Impact

`site/assets/js/nucleo/projetos.js`, `nucleo/motor-folhas.js`, `nucleo/gerador.js`, `editor/molduras.js`, `ui/portao.js`, `pages/{home,inicio,novo-projeto,adicionar-fotos,resumo,orientacao,editor,exportar,entrar,conta}.js`, `site/assets/css/pages/editor.css`, HTML de `app/`, `app/inicio/`, `app/resumo/`, `app/orientacao/`, `app/editor/quadro/`, `app/editor/gerar/`, `prototipo/editor-v3/`; `tests/e2e/testar-navegacao.mjs`; `package.json`; `docs/10_LOG_DECISOES.md` e `docs/AUDITORIA_FLUXOS.md`.
