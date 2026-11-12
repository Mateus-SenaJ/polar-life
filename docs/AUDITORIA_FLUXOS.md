# Auditoria de navegação e fluxos

**Data:** 2026-11-11 · **Ramo:** `etapa-auditoria-fluxos` · **Change:** `openspec/changes/auditoria-navegacao-fluxos` · **Decisões:** D-157 a D-164

## 1. Resumo

| Severidade | Achados | Corrigidos | Pendentes |
| --- | --- | --- | --- |
| Crítico | 1 | 1 | 0 |
| Alto | 5 | 5 (um deles em parte) | 0 |
| Médio | 12 | 9 | 3 |
| Baixo | 12 | 5 | 7 |
| **Total** | **30** | **20** | **10** |

O achado crítico era perda de dados: abrir o editor numa aba nova (ou reabrir o app) mostrava o projeto de exemplo e a primeira mudança gravava esse estado por cima do projeto real, que perdia a lista de fotos. Está corrigido e coberto por teste.

Os pendentes são decisão de produto, dependem da hospedagem ou são ajustes do sistema visual. Cada um traz recomendação na seção 4.

## 2. Como foi feito

Varredura por script (Playwright, Chromium), sem leitura manual exaustiva. Os scripts e as capturas ficam em `tests/saida/auditoria/` (fora do git).

- **Rastreio** (`varrer.mjs`): 23 rotas + um endereço inexistente, nos perfis sem sessão, Grátis, Folha avulsa, Pro e Admin, em 1440 × 900 e 390 × 844 (Pro também em 768 e 1024). Por tela: destino final, erros de página e de console, respostas 4xx, links internos, LEDs visíveis, rolagem lateral, `<h1>`, alvos menores que 44 px e rótulos «Em breve».
- **Estático** (`estatico.mjs`): `href`/`src` de todo HTML e destinos de navegação nos scripts.
- **Fluxos** (`fluxo1` a `fluxo4`): apresentação → entrar → Início → novo projeto → fotos → processando → resumo → orientação → Folhas → Quadro → revisão → exportar → gerar → imprimir → compartilhar, com Voltar/Avançar, recarregar e aba nova; contas de teste, e-mail + senha, «Esqueci a senha», código de impressão, `?voltar=`, sair, trocar e excluir projeto, excluir foto, limite do Grátis, teclado e PWA offline.
- **Fotos:** só as CC0 de `site/assets/img/fotos/` e imagens geradas em canvas. Nenhuma foto pessoal foi lida.

Não foram verificados: Safari e Firefox; o login real com Google (depende de credencial); a polaroid na horizontal comparando Folhas e PDF; a instalação real do PWA num celular.

## 3. Achados corrigidos

### Crítico

**A-01 · Aba nova grava o exemplo por cima do projeto real.**
Reprodução: criar um projeto com 3 fotos; abrir `app/editor/` em outra aba; a aba mostra «Viagem · Serra 2026» com o exemplo; mudar qualquer controle (por exemplo «Guias»); o registro do projeto passa a ter só `pl-folhas` e, ao reabri-lo pela lista, aparece o exemplo. As fotos continuavam no aparelho, mas o projeto não as listava mais.
Correção (D-157): marca `pl-projeto-sessao` por aba; sem ela, o projeto atual é recarregado do aparelho antes de qualquer gravação e `salvarEstado` não grava. Arquivo: `nucleo/projetos.js`.

### Alto

**A-02 · A pergunta de orientação mostrava os números do exemplo.** Projeto real com 3 horizontais e 2 verticais → `app/orientacao/` dizia «Há 6 verticais e 18 horizontais entre as 24 fotos» e, no fundo, «24 fotos · 6 folhas». Correção (D-160): `pages/orientacao.js` lê as fotos do projeto.

**A-03 · Formato e papel escolhidos em «Novo projeto» eram descartados.** Escolher «Instax Mini» e papel A5 → o resumo dizia «A4 · Clássico 88 × 107 mm» e o editor abria em Clássico A4. Só o Retro Pocket chegava. Havia ainda um segundo defeito: ao voltar para «Novo projeto», o navegador devolvia as escolhas ao formulário, mas o script seguia com o padrão. Correção (D-159): `PLFOLHAS.formatoInicial()` para os seis formatos fixos, semente de `pl-folhas` para o papel, sincronia no `pageshow`. **Em parte:** «Personalizado» e polaroid horizontal escolhidos nessa tela continuam sem chegar ao editor (ver P-04).

**A-04 · Projeto sem fotos abria o exemplo.** Criar um projeto, sair antes de escolher fotos e abri-lo pela lista → editor com 24 fotos de exemplo sob o nome «Viagem · Serra 2026», e as edições eram gravadas nesse projeto. Correção (D-158): vai para «Adicionar fotos».

**A-05 · O Quadro dizia «Colagem · Em breve».** A Colagem existe nas Folhas desde a D-150. Correção (D-161): link para as Folhas no modo Colagem.

**A-06 · Excluir o projeto aberto deixava o estado dele na aba.** Depois de excluir, `app/editor/` mostrava as fotos que sobraram na sessão sob o nome do exemplo. Correção (D-157): `excluir` limpa a aba.

### Médio

| ID | Achado | Reprodução | Correção |
| --- | --- | --- | --- |
| A-07 | «Novo projeto» criava um projeto vazio a cada «Continuar» | Continuar → Voltar → Continuar: dois «Projeto de 11/11/2026» com 0 fotos | Reaproveita o projeto vazio (D-158) |
| A-08 | Portão do Grátis dizia «Sua folha grátis foi usada» sem ter sido, e oferecia comprar todas as folhas | Grátis, nenhuma folha usada, PDF de 2 folhas → Exportar → Gerar | Título e quantidade corretos: «Comprar 1 folha» (D-163) |
| A-09 | Código de impressão que não cobre o arquivo recebia «Seu código já foi usado» | Código válido com menos folhas que o arquivo | «O código não cobre este arquivo» (D-163) |
| A-10 | Resumo com «4 por folha · Clássico · A4» fixos | Qualquer projeto real em outro formato ou papel | Mesma conta do editor (D-159) |
| A-11 | Rolagem lateral no Quadro entre 1024 e 1199 px | Abrir `app/editor/quadro/` em 1024 × 768: página com 1093 px | Cabeçalho mais enxuto e botões do inspetor com quebra (D-164) |
| A-12 | Backup inválido não dava retorno | «Abrir backup» com um JSON qualquer: nada acontecia | Aviso «Não foi possível abrir este backup.» |
| A-13 | «Voltar» depois de entrar devolvia à tela de entrar | Entrar → Início → Voltar | `location.replace` (D-162) |
| A-14 | Banner do Início prometia colagem em imagem que ainda não existe | Início, banner 3 | Texto com «Em breve» e indicação da Colagem do editor (D-161) |
| A-15 | Tela do arquivo pronto sem caminho de volta às folhas | Gerar PDF: só o logo levava a algum lugar | Link «Voltar às folhas» |

### Baixo

| ID | Achado | Correção |
| --- | --- | --- |
| A-16 | «Pré-voo» (termo interno) no aviso da tela Exportar | «A revisão confere…» |
| A-17 | Linha de estado das Folhas dizia «N clássicas por folha» em qualquer formato e «1 folhas» | «N por folha · 1 folha no total» |
| A-18 | Logo da lista de projetos apontava para `#projetos`, que não existe; logo do protótipo com `href="#"` | `./` e `../../app/` |
| A-19 | Conta aberta sem conta de e-mail mandava `?voltar=conta`, que a tela de entrar ignora | Guarda o endereço completo |
| A-20 | Aba Molduras das Folhas só listava 3 dos 6 formatos | Lista os seis |

## 4. Pendentes

| ID | Sev. | Achado | Por que ficou | Recomendação |
| --- | --- | --- | --- | --- |
| P-01 | Médio | Página 404 em subpasta (`/qualquer/coisa/`) sai sem estilo e «Ir para o início» aponta para a própria pasta inexistente | Os caminhos são relativos; a raiz é `/polar-life/` no GitHub Pages e `/` no Vercel; a CSP não deixa usar script embutido | Gerar o `404.html` em build com a raiz de cada hospedagem, ou acrescentar regra de reescrita no Vercel e aceitar o GitHub Pages como está |
| P-02 | Médio | No app instalado e offline, os links para a apresentação, «Como imprimir em casa» e Legal dão o erro do navegador | O service worker cobre só `/app/` | Incluir as três páginas no cache (service worker na raiz) ou desligar esses links quando offline |
| P-03 | Médio | Sair da conta não fecha os projetos: outra conta no mesmo aparelho vê e abre os mesmos | Decisão de produto (tudo é local, D-116) | Decidir entre «projetos são do aparelho» (dizer isso na Conta) ou separar por e-mail |
| P-04 | Baixo | «Personalizado» e polaroid horizontal escolhidos em «Novo projeto» não chegam ao editor | As regras de medida dessa tela (até 1000 mm) e da aba Molduras (30 a 200 mm) são diferentes | Unificar as regras e então levar a escolha; até lá, tirar as duas opções da T-02 ou avisar |
| P-05 | Baixo | Folhas e Quadro não têm `<h1>` | Ajuste de estrutura do editor | Tornar o nome do projeto um `<h1>` |
| P-06 | Baixo | Alvos de 42 px (LED pequeno do cabeçalho do editor, campos numéricos) e abas com 36 a 38 px de largura | Sistema visual (D-134) | Subir para 44 px (T3) |
| P-07 | Baixo | Com a revisão aberta há dois LEDs visíveis (o da tela, atrás do véu, e o do pop-up) | Interpretação da T8 | Registrar que o pop-up conta como tela própria, ou apagar o LED de trás |
| P-08 | Baixo | «Fazer uma polaroid» em «Novo projeto» responde «Este atalho ainda não está disponível» | Recurso não existe | Rótulo «Em breve» ou tirar o botão |
| P-09 | Baixo | Em Planos, o `<h1>` inclui o selo «Valores de teste»; em Orientação, o `<h1>` do fundo é «Resumo da importação» | Só leitores de tela | Tirar o selo do título; título próprio no pop-up |
| P-10 | Baixo | `app/editor/` sem projeto aberto mostra o exemplo editável | Por desenho (DOC-04 §6) | Avisar na tela que é um exemplo |

## 5. O que passou sem achado

- Guarda de sessão: toda rota de `/app/` sem sessão vai para «Entrar» com `?voltar=`; destino externo ou `//host` é ignorado; o fragmento (`#foto-2`) é preservado.
- Entrar: contas de teste, criar conta, senha errada e certa, «Esqueci a senha», código de impressão (erros com texto).
- Nenhum erro de página, de console ou recurso 404 nas 23 rotas, em nenhum perfil ou largura.
- Um LED por tela fora de pop-ups; foco visível com Tab; Esc fecha a revisão e devolve o foco.
- Recarregar em resumo, Folhas, Exportar e Gerar mantém o estado (no Quadro não foi testado).
- PWA: `start_url` `./inicio/` e o atalho respondem; offline, as telas de `/app/` abrem.
- Admin aberto por outra conta mostra aviso e o caminho para trocar.

## 6. Arquivos alterados

`site/assets/js/nucleo/{projetos,motor-folhas,gerador}.js` · `site/assets/js/editor/molduras.js` · `site/assets/js/ui/portao.js` · `site/assets/js/pages/{home,inicio,novo-projeto,adicionar-fotos,resumo,orientacao,editor,exportar,entrar,conta}.js` · `site/assets/css/pages/editor.css` · `site/app/index.html` · `site/app/{inicio,resumo,orientacao}/index.html` · `site/app/editor/{quadro,gerar}/index.html` · `site/prototipo/editor-v3/index.html` · `site/app/sw-arquivos.js` (gerado) · `tests/e2e/testar-navegacao.mjs` (novo) · `tests/e2e/testar-legendas-reais.mjs` (espera a sincronia da aba) · `package.json` · `openspec/changes/auditoria-navegacao-fluxos/` · `docs/10_LOG_DECISOES.md`.

## 7. Testes

Rodados em sequência em 2026-11-11, depois das correções (registro em `tests/saida/auditoria/final.log`):

| Comando | Código de saída | Observação |
| --- | --- | --- |
| `npm run sw` | 0 | `sw-arquivos.js` regenerado |
| `npm run verificar` | 0 | «✔ Sem erros» e «✔ SEO em dia» |
| `npm run testar:node` | 0 | os 34 testes da cadeia rodaram até o último (`testar-navegacao.mjs`: «✔ Navegação e fluxos: tudo certo»); 1312 linhas ✔ e 0 linhas ✘ |
| `npx openspec validate auditoria-navegacao-fluxos --strict` | 0 | change válida |

Na primeira execução a cadeia parou em `testar-legendas-reais.mjs`: o teste abria uma aba nova e mexia no armazenamento enquanto a página recarregava o projeto (comportamento novo da D-157). O teste passou a esperar a sincronia (`PLPROJETOS.sincronizado()`); nenhuma conferência dele foi retirada.

