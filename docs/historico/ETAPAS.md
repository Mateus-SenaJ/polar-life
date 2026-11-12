# Histórico das etapas 1 a 28

Movido do `STATUS.md` na etapa 30 (reorganização), sem alteração de texto. O estado atual fica no `STATUS.md`.
Caminhos citados aqui são os da época (antes de `tools/`, `tests/` e das pastas `nucleo/`, `ui/` e `editor/` em `site/assets/`).

## Etapa 28 · «Valores diferentes» dentro dos campos (T-11 · FN-00a)

- **Decisão (D-110 `[RECOMENDADO]`):** com escopo de várias fotos (Selecionadas, Esta folha, Todas), cada campo da aba AJUSTES que difere em ao menos uma foto do escopo mostra a etiqueta **«Valores diferentes»** (ícone de info + texto, borda 1 px, sem cor) no cabeçalho. A ajuda abaixo diz quantas fotos diferem («23 outras fotos do escopo têm valor diferente.») e que «Aplicar às demais» iguala à foto aberta. Em «Somente esta» nada aparece. O campo continua mostrando o valor da foto aberta.
- **Onde vale:** Brilho, Contraste, Saturação, Temperatura, Realces, Sombras, Nitidez, Vinheta e Intensidade do filtro. O **Filtro** (qual) tem linha própria (`#flt-dif`) abaixo da grade: «Valores diferentes: 1 foto do escopo usa outro filtro.» A linha de resumo do escopo (etapa 9) continua.
- **Código:** `lote.js` ganhou `dif(id)` (fotos do escopo cujo valor difere), exportada em `PLLOTE`; `diff()` passou a usá-la. `quadro.js`: o construtor dos campos cria a etiqueta `.mix`, `sincronizar()` a liga e desliga e acrescenta a contagem à ajuda (`aria-describedby` agora liga o campo à ajuda); `PLQ.sinc` foi exportado para o `lote.js` atualizar os campos quando o escopo ou a seleção mudam. CSS em `lote.css`.
- **Teste:** `npm run testar:valores` (Chromium, 28 conferências): Somente esta, Todas, singular e plural, Selecionadas com e sem marcação, «Aplicar às demais» (com «Substituir ajustes individuais»), desfazer, filtro e intensidade, troca de foto aberta e 390 px. `verificar`, `testar` e os outros 14 testes de navegador passam.
- **Fora de propósito:** **Zoom, Endireitar e posição não ganham etiqueta**, porque o escopo em lote só propaga ajustes e filtro (`apply` e `colar`); mostrar a etiqueta ali prometeria uma igualização que o botão não faz.
- **`[VALIDAR]` com o dono:** hoje a etiqueta fica no cabeçalho e o campo mostra o número da foto aberta. Se o dono quer o texto «Valores diferentes» **dentro do campo**, no lugar do número, é uma mudança maior: o campo precisa de um estado «misto» que não grava até o usuário digitar.
- **Ainda em aberto no E4:** orientação por foto e seleção por folha na T-07.
- **Observação de teste:** o `#foto-N` da URL só é lido ao abrir a página; trocar o hash depois não muda a foto (a troca de foto usa a faixa). Não é erro, mas vale saber ao escrever testes.

## Etapa 27 · Orientação da polaroid (T-12)

- **Decisão (D-109, opção A `[RECOMENDADO]`):** seção «Orientação» na aba MOLDURAS com dois botões, **Vertical** (em pé, faixa grossa embaixo) e **Horizontal** (deitada, faixa grossa à esquerda). Gira a polaroid inteira, com a legenda e a assinatura. Atalho **R** alterna (não vale em campos de texto nem com pop-up aberto). Selecionado = borda azul 2 px + check.
- **Modelo:** `fr.ori` (`v` ou `h`; projeto antigo vira `v`). As medidas de `fr` ficam sempre da moldura em pé. `aplicar()` entrega a `Q.FR` a versão girada (`w`, `h`, `lado`, `ladoD`, `topo`, `jw`, `jh`) e a em pé (`cw`, `ch`, `cl`, `ct`, `cjw`, `cjh`). `ladoD` é a margem direita, que passa a ser diferente da esquerda. Motor de recorte, régua, Folhas (`contar`) e `medida()` usam a orientação.
- **Tela:** `#pq-leg` envolve a legenda; em pé usa `display:contents` (nada muda), deitada vira uma camada do tamanho da moldura em pé girada 90°. `legendas.js` (Ajustar para caber e área segura) converte as caixas de volta para a moldura em pé. Cota: «Passe-partout lateral».
- **Teste:** `npm run testar:janela` ganhou 16 conferências (medidas, faixa à esquerda, legenda, cota, cobertura, R, desfazer, Instax Wide, 390 px). Todos os 15 testes passam.
- **Em aberto:** orientação por foto (hoje vale para o projeto todo), «Valores diferentes» nos campos e seleção por folha na T-07.

## Etapa 26 · Medidas das janelas e atalhos de personalização (T-12)

- **Medidas conferidas com a Fujifilm** (filme × imagem): Instax Mini 54 × 86 / **46 × 62**; Instax Wide 108 × 86 / **99 × 62**; Instax Square 72 × 86 / **62 × 62**. Mini e Wide já estavam certos desde a etapa 25. **Corrigido o Instax Square:** margem lateral 6 → 5 mm, janela 60 → **62 × 62** (faixa inferior 19 mm).
- **Atalhos de medida (aba MOLDURAS, seção «Personalizar»)** `[RECOMENDADO]` (D-108): 4 grupos de botões que só preenchem os campos de «Medidas» (que seguem editáveis). **Proporção da janela** (1:1, 4:5, 3:4, 2:3, 5:4, 4:3, 3:2, 16:9: mantém a largura e muda a altura; a faixa inferior se mantém). **Faixa inferior** (Fina 12, Média 19, Clássica 25, Extra 32 mm). **Margens** (Fina 3, Instax 4,5, Clássica 6, Larga 9 mm: lateral e superior juntas). **Cantos** (Reto 0, Fino 0,4, Suave 1,5, Redondo 3 mm). Escolher qualquer um vira «Personalizado» (menos Cantos, que não muda o formato).
- **Regras mantidas:** atalho que quebra um limite (faixa inferior < 10 mm, janela fora de 2,5 : 1, altura > 250 mm) não grava e mostra o erro no campo afetado (borda preta 2 px + ✕). Selecionado = borda azul 2 px + ícone de check (nunca só cor). Alvos de 44 px. Sem LED, sem cinza, sem cor de moldura (a moldura segue branca). Entra no desfazer e refazer. Depois do atalho, `acertar` recoloca a foto em todas as fotos (a janela continua coberta).
- **Teste:** `npm run testar:janela` ganhou o Square e 12 conferências dos atalhos (proporção, faixa, margens com erro e sem erro, cantos, cobertura, desfazer, 390 px). `verificar`, `testar` e os outros 13 testes passam.

### Medidas de referência e o que ficou em aberto (etapa 26)

| Formato | Filme (mm) | Janela (mm) | Faixas (lateral · topo · base) | Situação |
| --- | --- | --- | --- | --- |
| Clássico | 88 × 107 | 76 × 76 | 6 · 6 · 25 | DOC-05 fixa 76; o filme Polaroid real tem imagem de ~79 × 79 `[VALIDAR]` com o dono |
| Mini quadrado | 60 × 73 | 48 × 48 | 6 · 6 · 19 | `[RECOMENDADO]` |
| Retro Pocket | 60 × 80 | 48 × 60 | 6 · 6 · 14 | Sem referência oficial; base de 14 mm é curta para legenda `[VALIDAR]` |
| Instax Mini | 54 × 86 | **46 × 62** | 4 · 5 · 19 | Janela oficial; faixa superior `[VALIDAR]` (medir filme real) |
| Instax Square | 72 × 86 | **62 × 62** | 5 · 5 · 19 | Janela oficial (corrigida); faixa superior `[VALIDAR]` |
| Instax Wide | 108 × 86 | **99 × 62** | 4,5 · 5 · 19 | Janela oficial; a Fujifilm não publica as faixas, então topo 5 e base 19 são `[VALIDAR]` |

- **Não implementado de propósito:** orientação Vertical/Horizontal e atalho `R`. O modelo guarda margem lateral igual nos dois lados; girar a moldura 90° faz a faixa grossa ir para um lado e exige margens assimétricas. Precisa de decisão do dono (ver `PROXIMOS_PASSOS.md`).
- **Proposta de próxima personalização** `[RECOMENDADO]`: «Meus formatos» (guardar até 5 medidas com nome em `localStorage`, só no aparelho) e «Copiar medidas de outro formato» (começar do Instax Wide e ajustar).

## Etapa 25 · Janela não quadrada (Retro Pocket, Instax Mini e Wide)

- **Motor (`quadro.js`):** novo `jq()` = `FR.jw ÷ FR.jh`. `base`, `zmin(s,n)`, cobertura (`cabe`), arraste e setas usam a proporção; `px` e `py` são frações da largura e da altura da janela. O zoom mínimo ao endireitar vem da caixa da janela girada. `acertar` passou a ser exportado em `PLQ`. `render()` agora chama `PLMOL.render()` (desfazer e refazer atualizam campos e mesa). CSS: `.win{aspect-ratio:var(--wa,1)}`.
- **Molduras (`molduras.js`):** `FMT` ganhou margem lateral, faixa superior e altura da janela; os três formatos antes bloqueados ficam ativos. Novo campo «Altura da janela» (`jh`); «Janela da foto (quadrada)» virou «Largura da janela». Editar `jh` muda a altura externa e mantém a faixa inferior. Janela abaixo de 20 ou fora de 2,5 : 1 a 1 : 2,5 mostra erro. Ao trocar o formato, `acertar` roda em todas as fotos. O aviso «janela não quadrada chega depois» saiu.
- **T-07 (`editor.js`):** `FR.jh = fr.jh` (ou quadrada, em projetos salvos antes).
- **Medidas:** `[RECOMENDADO]` (D-107). Mini quadrado ficou com janela 48 (antes 48 pela conta 60 − 2×6).
- **Testes:** `testar` (16 000 estados em 4 janelas, PPI pela largura, zoom mínimo) e `npm run testar:janela` (Chromium: 3 formatos, campos, cobertura, endireitar, setas, resetar, erro de altura, T-07). `verificar` e os outros 12 testes passam.
- **Ainda fora do E4:** orientação por foto (horizontal/vertical dentro da moldura), «Valores diferentes» dentro dos campos e seleção por folha na T-07. A polaroid larga entra girada na folha A4 em pé `[VALIDAR]`.

## Etapa 24 · Esqueleto de carregamento na T-01 e no editor (fecha a T-31)

- **O que mudou:** módulo compartilhado `assets/css/esqueleto.css` + `assets/js/esqueleto.js` (síncrono no `<head>`, para ligar antes da primeira pintura). Sem JS o esqueleto nunca aparece.
- **T-01:** `.esq-sk--home` (`role="status"`) com título e botão, um cartão de projeto e a mensagem de informação «Processamento 100% local…» (cadeado azul, borda 1 px). Enquanto ligado, escondem-se `#lista`, `#top`, `#vazio` e a nota fixa (para não repetir a frase). `aria-busy` no `main`.
- **T-07 e T-08:** `.esq-sk--ed` cobre só a mesa e o inspetor (fixo abaixo do cabeçalho e à direita do trilho; no celular fica abaixo da barra de modos e acima da barra fixa). Blocos **brancos com borda e brilho azul, sem cinza**. Tablet e celular: coluna única, sem o inspetor.
- **Quando aparece:** liga ao carregar e some ~450 ms depois do `DOMContentLoaded` (sem atraso artificial além disso). `#carregando` na URL mantém ligado (estado de revisão), também em troca de hash. `#vazia` continua mostrando o vazio depois do carregamento.
- **Movimento:** com `prefers-reduced-motion` o brilho fica parado.
- **Teste:** `npm run testar:esqueleto` (Chromium, 18 conferências: T-01 a 390, T-07 e T-08 a 1440 e 390, movimento reduzido). `verificar`, `testar` e os outros 11 testes seguem passando.
- **Ainda fora:** tablet 834 sem captura; o esqueleto não segue o tamanho real do projeto (cartões e folhas são fixos) `[RECOMENDADO]`; o catálogo da T-31 (`/app/estados/`) mantém o seu esqueleto próprio de 3 linhas `[VALIDAR]` se deve usar o mesmo; com Dexie (leitura real) o tempo passa a vir do carregamento do projeto, não de um mínimo fixo `[HIPÓTESE]`.

## Etapa 23 · Estado «falha de leitura» dentro da T-04

- **O que mudou:** o erro por arquivo da T-04 segue o padrão da T-31 (DOC-04 §5): borda preta 2 px + ✕ + texto, `role="alert"` só quando o processamento termina. Título «Não foi possível ler 2 fotos» (singular quando resta uma), frase «As fotos 7 e 19 estão danificadas ou ficaram indisponíveis. As outras 22 seguem prontas.» e, em cada foto, **Tentar de novo** e **Trocar foto** (FL-02, FL-07).
- **Trocar foto:** abre o seletor do aparelho (um arquivo). JPEG, PNG, WebP ou HEIC substitui a foto com falha; outro tipo é recusado com toast «não é uma foto» e a lista não muda. O arquivo escolhido não sai do aparelho (BR-01).
- **Dados de exemplo:** foto 7 (memória) recupera ao tentar de novo; foto 19 (danificada) continua falhando. «Continuar com N fotos» segue ativo com as que estão prontas.
- **Teste:** `npm run testar:processando` (Chromium, 13 conferências, 390 px). `testar:adicionar`, `testar:estados` e `verificar` sem erros.
- **Ainda fora:** esqueleto de carregamento na T-01 (abrir projeto) e no editor. A foto trocada é marcada como pronta sem leitura real; a leitura de verdade entra com o worker (DOC-08) `[HIPÓTESE]`.

## Etapa 22 · Estado «arquivo inválido» dentro da T-03

- **O que mudou:** o aviso de arquivo não aceito na T-03 deixou de ser laranja e passou ao padrão de erro da T-31: borda preta 2 px + ✕ + texto, `role="alert"`. Com um arquivo: «Este arquivo não é uma foto. «nome.pdf» não pôde ser usado. Escolha JPEG, PNG, WebP ou HEIC.» Com vários: «N arquivos não são fotos.». Fotos aceitas seguem na lista («N fotos escolhidas»).
- **Teste:** `npm run testar:adicionar` (Chromium, 6 conferências, 390 px, link para a Central). `verificar` sem erros.
- **Ainda fora:** falha de leitura na T-04 (fotos 7 e 19) com «Tentar de novo» e «Trocar foto»; esqueleto de carregamento na T-01 e no editor; «sem suporte» já existe na T-22.

## Etapa 21 · T-31 Estados vazios e erros (E12) e ligas soltas

- **Ligas soltas (etapa 20):** a T-03 ganhou o link «Verificar conexão» (`../conexoes/`) sob o título; a T-01 ganhou «Conexões» no cabeçalho, ao lado de «Abrir backup». Não existe avatar de pessoa na 1.0 (só o ícone do card do projeto), então ele não aponta para nada `[VALIDAR]`.
- **T-31 (DOC-04 §5, DOC-11 E12):** `/app/estados/` (`estados.html`, `css/pages/estados.css`) reúne os 6 estados: **Vazio** (logo vertical + LED «Novo projeto»), **Arquivo inválido**, **Falha de leitura** (fotos 7 e 19, com «Tentar de novo» e «Trocar foto»), **A polaroid não cabe neste papel**, **Sem suporte a compartilhar** e **Carregando** (esqueleto com borda e brilho azul, sem cinza; `aria-busy`; sem movimento com `prefers-reduced-motion`). Erro = borda preta 2 px + ✕ + texto; atenção = ícone laranja + texto; informação = cadeado azul, borda 1 px.
- **`404.html`** na raiz de `site/` com o logo vertical (LOGO-V) e um LED «Ir para o início».
- **Teste:** `npm run testar:estados` (Chromium, 11 conferências, incluindo 390 px). `verificar` sem erros.

### Limites e `[HIPÓTESE]` da etapa 21

| Item | Situação |
| --- | --- |
| **Estados dentro das telas** | A página é um catálogo de revisão: as telas existentes ainda usam as mensagens próprias. Ligar cada estado onde ele ocorre (ex.: T-03 com arquivo inválido) é o próximo passo `[RECOMENDADO]` |
| **404 e subcaminho** | O link «Ir para o início» é relativo (`./`); em `usuario.github.io/repositorio/` e URL aninhada pode errar o destino `[VALIDAR]` |
| **Textos** | Mensagens do vazio, inválido, leitura e sem suporte são `[RECOMENDADO]` (LIVRE); só «A polaroid não cabe neste papel» vem do DOC-04 |
| **Tablet 834** | Não conferido por captura nesta etapa |

## Etapa 20 · T-23 Central de conexões e T-24 Verificação

- **Onde:** `/app/conexoes/` (`conexoes.html`, `css/pages/conexoes.css`, `js/pages/conexoes.js`). A T-24 é a folha «Verificar: serviço» aberta pelo «Testar conexão» de cada cartão (nível 3, foco preso, Esc e Cancelar fecham).
- **T-23 (DOC-07 §3):** texto fixo «Suas fotos continuam no seu aparelho. Você escolhe o que trazer.», LED único «Escolher do aparelho» (CN-08) e 9 cartões em 2 seções. **Trazer fotos:** Do aparelho, Câmera, Apple Fotos, iCloud Fotos (web), Google Fotos (em breve 2.0), Drive/Dropbox/OneDrive (em breve 3.0). **Levar para as redes:** Compartilhar o arquivo, Instagram, Facebook. Selo sempre ícone + texto (CN-05).
- **Instagram e Facebook:** só «Indisponível por regra da plataforma» com «Ver como fazer» (3 passos, ícone neutro, sem marca); nunca «Conectado» nem «Importar» (CN-03). iCloud web usa o mesmo caminho guiado (Biblioteca de Fotos).
- **T-24 (DOC-07 §5):** linhas por serviço, em ordem fixa, com barra contínua e resumo em texto. Aparelho e Apple: seletor, HEIC, espaço (`storage.estimate()`, atenção a 80%). Compartilhar: HTTPS, `canShare` com 1 px, baixar imagem. Redes: API (indisponível), pelo aparelho, `canShare`. Estados ✓ Tudo certo, ▲ Atenção, ✕ Falhou (borda 2 px), ⓘ Indisponível. «Tentar de novo» só quando algo falha. **O teste não lê, baixa nem envia fotos** (CN-06).
- **Estados de revisão por hash:** `#estado-verificando` (para no meio do teste de Compartilhar) e `#estado-erro` (cartão em «Não foi possível verificar agora» + «Tentar de novo»).
- **Teste:** `npm run testar:conexoes` (Chromium, 19 conferências, incluindo 390 px). `verificar`, `testar:compartilhar` e `testar:formato` seguem passando.

### Limites e `[HIPÓTESE]` da etapa 20

| Item | Situação |
| --- | --- |
| **Entradas na T-03 e no avatar** | A rota existe, mas o link «Verificar conexão» da T-03 e o avatar ainda **não** apontam para ela `[VALIDAR]` |
| **Estados «Conectado», «Verificando» no cartão e «Reautorizar»** | Só existem com conta e Google (2.0); na 1.0 nenhum serviço fica conectado. Falta o desenho no cartão quando chegarem |
| **«Leitura de HEIC»** | Mostra «Conversão no aparelho» fixo; não testa o suporte nativo do navegador `[HIPÓTESE]` |
| **Atraso de 450 ms por linha** | Só para a pessoa ver a barra andar `[RECOMENDADO]` |
| **Câmera, Google e nuvens** | Sem teste: câmera depende do aparelho; Google e nuvens só na 2.0/3.0 |
| **Safari e Firefox** | `canShare` e `storage.estimate` só testados em Chromium `[VALIDAR]` |

## Etapa 19 · T-22 Compartilhar

- **Onde:** `/app/editor/compartilhar/` (`compartilhar.html`, `css/pages/compartilhar.css` sobre `processando.css` e `gerar.css`, `js/pages/compartilhar.js`). O «Compartilhar» do concluído (T-20) leva até ela; a T-20 passa a gravar `pl-arquivos` (nomes e tamanhos) com a chave do projeto.
- **Fluxo (DOC-06 §8):** o arquivo é preparado **antes** do clique; o botão só diz «Compartilhar» quando `navigator.canShare({files})` confirma (e há HTTPS). `navigator.share` roda dentro do clique. `AbortError` (a pessoa cancelou) não mostra nada. Qualquer outro erro troca o botão para «Baixar» com o aviso «Não foi possível abrir o menu de compartilhar».
- **Sem suporte:** botão «Baixar PDF», «Baixar ZIP», «Baixar imagem» ou «Baixar imagens», com aviso (ícone + texto). Depois de baixar, aparece a instrução do destino (PDF: app de impressão ou mensagens; imagem: «escolha a imagem na galeria»), com foco.
- **Conteúdo:** lista dos arquivos com nomes neutros (BR-11), tabela «Para onde o arquivo vai» (celular com menu, computador, Instagram sem integração) e a frase do DOC-09: «Você escolhe para onde o arquivo vai. O PolarLife não recebe nada.»
- **Trava:** sem arquivo gerado, ou com o projeto alterado depois de gerar, mostra a trava com o caminho de volta (Exportar ou Revisar impressão).
- **Estados de revisão por hash:** `#estado-sem-suporte`, `#estado-erro`, `#estado-baixado`.
- **Design:** um só LED por tela. No celular os botões têm 44 px ou mais de altura (corrigido: abaixo de 600 px o `gerar.css` colapsava botões sem altura definida).
- **Teste:** `npm run testar:compartilhar` (Chromium, 24 conferências, com `canShare` e `share` simulados nos 4 caminhos: compartilha, cancela, erro, sem suporte) e todos os demais passam. Visual conferido por captura a 1440 e 390.

### Limites e `[HIPÓTESE]` da etapa 19

| Item | Situação |
| --- | --- |
| **Conteúdo do arquivo** | É um **exemplo** (PDF mínimo, PNG ou JPEG com a frase «arquivo de exemplo», ZIP vazio): o gerador real (DOC-08 §6) ainda não existe. O mecanismo de compartilhar e baixar é o final; só o conteúdo troca |
| **Vários arquivos** | `canShare` e `share` recebem todos os arquivos da lista; o limite real de cada sistema (iOS e Android) `[VALIDAR]` em aparelho |
| **ZIP** | Muitos navegadores não compartilham `application/zip`; nesse caso cai em «Baixar ZIP» sozinho `[VALIDAR]` |
| **Vários downloads** | Baixados com 300 ms entre eles; alguns navegadores pedem permissão para baixar vários arquivos `[VALIDAR]` |
| **Safari e Firefox** | Só testado em Chromium com simulação; o comportamento real de `canShare` com arquivos `[VALIDAR]` |
| **Lembranças e colagens (T-15 a T-17)** | Fora: a T-22 compartilha o arquivo de saída do E6; o cartão de lembrança com legenda do post e «Copiar texto» chega com o E8 |
| **Persistência** | `pl-arquivos` só na sessão |

## Etapa 18 · T-21 Imprimir agora e calibração

- **Onde:** `/app/editor/imprimir/` (`imprimir.html`, `css/pages/imprimir.css` sobre `processando.css` e `gerar.css`, `js/pages/imprimir.js`). O «Imprimir agora» do concluído (T-20) leva até ela. Só desktop: no celular aparece «A impressão direta só existe no computador» e o caminho de baixar o PDF.
- **Dicas antes da caixa (DOC-04 FL-07):** Tamanho real (100%), margens Nenhuma, sem cabeçalhos e rodapés, gráficos de fundo ligados. Mostra papel, folhas e orientação; avisa quando a impressora ainda não foi calibrada para o papel.
- **Calibração em 3 passos numerados (número + texto, nunca só cor):** **1** imprime a **página de teste de verdade** (iframe oculto + `window.print()` por clique, tamanho do papel, margem 0, dois traços de 100 mm com marcas a cada 10 mm); **2** mede e escreve X e Y em mm (vírgula aceita, 80 a 120 mm, erro com ✕ e `aria-invalid`); **3** mostra a escala (`fx = 100/X`, `fy = 100/Y`) e guarda com o nome da impressora.
- **Perfil:** `localStorage` `pl-calib`, chave «impressora|papel», com «Calibrado em DD/MM/AAAA». Também grava `pl-calibrou` na sessão. O pré-voo (T-18) deixa de pedir calibração quando há perfil do papel.
- **Bloqueio de pop-up:** se o navegador não abre a janela de impressão, aparece «O navegador bloqueou a janela de impressão» (borda preta 2 px + ✕), com a instrução e foco no aviso; o botão tenta de novo. Estados de revisão: `#estado-bloqueio` e `#estado-calibrado`.
- **Design:** um só LED por tela («Imprimir agora»); «Guardar calibração» é secundário.
- **Teste:** `npm run testar:imprimir` (Chromium, 17 conferências) e todos os demais passam. Visual conferido por captura.

### Limites e `[HIPÓTESE]` da etapa 18

| Item | Situação |
| --- | --- |
| **«Imprimir agora» das folhas** | Só responde com aviso: depende do PDF do gerador (iframe + print). A página de teste já é real |
| **Aplicar a escala no PDF** | `fx` e `fy` ficam guardados; quem aplica é o gerador (DOC-08 §6), ainda não ligado |
| **Detecção do bloqueio** | O navegador não informa o bloqueio de forma uniforme; tratamos erro ao abrir/imprimir. Falta testar em Safari e Firefox `[VALIDAR]` |
| **Faixa 80–120 mm** | Limite de bom senso para evitar erro de digitação `[HIPÓTESE]` |
| **Perfil por impressora** | O navegador não revela qual impressora foi usada; o nome é digitado pela pessoa. Vale um perfil por nome e papel |
| **Calibração de tela** (1.1) | Fora desta etapa |

## Etapa 17 · T-20 Gerando · recuperação · concluído

- **Onde:** `/app/editor/gerar/` (`gerar.html`, `css/pages/gerar.css` sobre a base de `processando.css`, `js/pages/gerar.js`). O LED «Gerar …» da Exportar leva até ela e grava `mb`, `v` e `lim` em `pl-exportar`.
- **Gerando:** barra determinada com «Folha 1 de 6» (ou «Polaroid 1 de 24»), porcentagem, frase do que está sendo feito e aviso de que nada sobe para servidor. A região `aria-live` anuncia cada folha. **Cancelar** abre «Parar a geração?» (Continuar gerando é o LED, foco inicial; Esc também continua).
- **Recuperação (DOC-08 §6):** «N fotos não puderam ser lidas», cada foto com ✕ e o motivo, e as 4 opções: **Tentar de novo** (LED; a foto «transitória» volta, a outra continua), **Trocar foto** (abre o Quadro na foto), **Gerar sem elas** (repagina com menos fotos, reinicia e avisa em faixa laranja) e **Cancelar**.
- **Concluído (DS-06):** borda preta 1 px + ✓ azul + «Concluído · 1 arquivo · 58 MB», lista de arquivos com nomes neutros (`PolarLife.pdf`, `Folha-01.png`…), Baixar (ou «Baixar todos»), Baixar novamente, Imprimir agora (só desktop e só PDF) e Compartilhar. **Não existe «Abrir pasta».**
- **Estados de revisão por hash:** `#estado-gerando` (parada na folha 3), `#estado-falha` e `#estado-concluido`.
- **Teste:** `npm run testar:gerar` (Chromium, 21 conferências) e todos os demais passam. Visual conferido por captura a 1440 e 390.

### O que é simulado, `[HIPÓTESE]` e fora de escopo da etapa 17

| Item | Situação |
| --- | --- |
| **Geração** | O progresso é simulado (650 ms por folha): ainda não existe o gerador de PDF. «Baixar» e «Baixar novamente» só avisam isso. O arquivo real é a próxima peça técnica (DOC-08 §6) |
| **Falhas** | Aparecem só em `#estado-falha` (fotos 7 e 19, motivos de exemplo); em uso normal nada falha |
| **«Imprimir agora» e «Compartilhar»** | Avisam que chegam na T-21 e na T-22 |
| **Fim da aba** | Fechar a aba no meio descarta tudo; não há retomada `[RECOMENDADO]` |
| **iOS** | O limite de 2 imagens em resolução total (DOC-08 §6) é do gerador, não desta tela |

## Etapa 16 · T-19 Exportar

- **Onde:** `/app/editor/exportar/` (`exportar.html`, `css/pages/exportar.css`, `js/pages/exportar.js`). O LED «Gerar PDF (6 folhas)» do pré-voo leva até ela.
- **Trava:** só abre depois do pré-voo. O pré-voo grava `pl-prevoo` com uma chave do projeto; se o projeto mudar depois, a tela pede nova revisão («O projeto mudou depois da última revisão»).
- **Cartões de formato (radio, estado por borda de 2 px + ícone «check», nunca só cor):** PDF alta qualidade (Recomendado, marcado), PDF leve (Recomprimido), Imagens das folhas, Polaroids avulsas. Os dois últimos abrem as opções: PNG ou JPEG, 300 ou 600 PPI, «Reunir em ZIP». PDF mostra o aviso obrigatório «Tamanho real (100%) e margens Nenhuma».
- **Estimador:** tamanho em MB ou GB, número de arquivos e volumes com limite de 150 MB no computador e 60 MB no celular (DOC-08 §6). Rótulo «Estimativa»; o real vem depois de gerar.
- **Botão:** «Gerar PDF (6 folhas)», «Gerar PDF leve (…)», «Gerar imagens (6 folhas)» ou «(24 polaroids)». Hoje só guarda as opções em `pl-exportar` e avisa que a geração é da T-20.
- **Teste:** `npm run testar:exportar` (Chromium, 19 conferências). Todos os demais testes passam. Visual conferido por captura a 1440 e 390.

### `[HIPÓTESE]` e fora de escopo da etapa 16

| Item | Situação |
| --- | --- |
| **Estimativa de tamanho** | 2,4 MB por foto no PDF alto, 0,7 MB no leve, A4 a 300 PPI ≈ 9 MB em PNG e 1,8 MB em JPEG; some quando o gerador real existir (T-20) |
| **Volumes de imagem** | A divisão em volumes vale também para ZIP e imagens; o DOC-08 só a cita para PDF `[RECOMENDADO]` |
| **`.polarlife`** | Fora: salvar o projeto completo fica para o E8, junto do arquivamento |
| **Perfil «Gráfica»** (1.1) e **TIFF** (2.0) | Fora, como o DOC-08 §6 define |
| **Imagens a 600 PPI no celular** | Não limitado; o aviso de memória (iOS) fica para a T-20 |
| **Fluxo** | Pré-voo → Exportar → Gerando: o rótulo do LED no pré-voo (DV-32) segue «Gerar PDF» mesmo levando à Exportar |

## Etapa 15 · T-18 Pré-voo «Tudo pronto para o papel?»

- **Onde:** pop-up nível 3 nas Folhas (`assets/js/pages/prevoo.js` + `css/pages/prevoo.css`). «Revisar impressão» abre na T-07; no Quadro leva à T-07 e abre o pop-up lá (`#revisar`, abre uma vez), porque só as Folhas medem a legenda em todas as folhas.
- **Caixa de decisão (DV-32):** ícone `verified`, título, frase que muda com o resultado, grade de 3 dados (Total de folhas · Disposição · Aproveitamento), «Voltar e ajustar» e LED «Gerar PDF (N folhas)». O LED fica desativado enquanto houver bloqueio ou falta a confirmação.
- **3 severidades (BR-13), sempre ícone + texto:** **Bloqueia** (✕, borda preta 2 px): guias × contorno, projeto sem fotos, polaroid que não cabe, legenda fora da área segura em qualquer folha (desenha todas as folhas fora da tela e mede), texto com coordenadas. **Pede confirmação** (▲), com caixa «Revisei e quero continuar»: foto abaixo de 180 PPI, texto com nome de arquivo, data ou local vazio com linha ligada, impressora sem calibração, margem menor que 5 mm. **Informa** (i): tamanho estimado, «N folhas → M folhas» desde a última revisão, assinatura ligada ou desligada.
- **PPI:** o Quadro grava o PPI de cada foto em `pl-ppi`; sem visita ao Quadro vale o exemplo (foto 12 = 140, demais 326).
- **Teste:** `npm run testar:prevoo` (Chromium, 13 conferências) e os demais passam. Conferi o visual em 1440 e 390 por captura.

### `[VALIDAR]` e `[RECOMENDADO]` da etapa 15

| Item | Situação |
| --- | --- |
| **«Gerar PDF»** | Hoje só mostra um aviso (a geração é da T-20). Falta a T-19 Exportar entre os dois |
| **Tamanho estimado** | 1,5 MB por folha `[HIPÓTESE]`; o estimador real vem com o PDF |
| **Margem não imprimível** | Limite de 5 mm `[HIPÓTESE]`; depende da impressora |
| **Impressora sem calibração** | Vale até a T-21 gravar `pl-calibrou` `[RECOMENDADO]` |
| **Fonte indisponível** | Fora: o navegador não diz com segurança se uma fonte carregou. Entra com as fontes autohospedadas (P-FONTES) |
| **«Foto com falha sem decisão»** | Fora: ainda não existe o estado de falha de foto (T-31) |
| **Abaixo do ideal (180–239)** | Só aparece nas fotos; o pré-voo pede confirmação a partir de «Com ressalvas», como no BR-13 |
| **Persistência** | `pl-ppi` e `pl-prevoo-folhas` só na sessão |

## Etapa 14 · Pendências da legenda nas folhas (T-07)

- **Metadados por foto (T-13):** a folha usa a data e a cidade editadas em cada foto (`meta` do `pl-quadro`). Cidade vazia faz o local sumir; data vazia faz a data sumir. O local segue as regras da T-10 (estado, país, separador, ordem). Sem edição vale o exemplo do DOC-04 §6.
- **«Ajustar para caber»:** a T-07 mede a folha já desenhada e reduz o corpo da legenda até caber na largura, no mínimo 8 pt (com Acima, desconta a largura de data e local).
- **Área segura (BR-13):** aviso fixo sob a folha, «A legenda sai da área segura em N polaroids desta folha», quando o texto, a data ou o local passam da largura, da margem de cima ou da base. Só a folha aberta é medida.
- **Correção:** a linha de data e local herdava o corpo da página (a altura ficava inflada); agora usa o corpo da própria data.
- **Teste:** `testar:formato` ganhou 5 conferências (dados por foto, cidade vazia, aviso, «Ajustar para caber»). Todos os testes passam.
- **Ainda fora:** o aviso não bloqueia a impressão (o bloqueio vem no pré-voo, E6); a data e o local de uma foto muito estreita (Mini) podem exigir formato curto ou desligar o local; fontes do catálogo seguem dependendo do carregamento pelo Quadro `[VALIDAR]`.

## Etapa 13 · Data e posição da legenda nas folhas (T-07)

- **Data:** a folha usa os 13 formatos da T-10 (`FMTD` no `editor.js`, mesmos da `legendas.js`).
- **Posição:** Abaixo, Acima (texto, data e local na margem de cima) e Ambas (texto em cima, data e local embaixo), com deslocamento X/Y e inclinação.
- **Teste:** `testar:formato` ganhou 4 conferências (formato, Ambas, Acima, data desligada). Todos os testes passam.
- **Ainda fora:** «Ajustar para caber» nas folhas; a data e o local seguem os de exemplo (14.07.26, Campos do Jordão) e não os metadados por foto (T-13); texto maior que a margem de cima pode invadir a foto, sem o aviso da área segura `[VALIDAR]`. Falta: janela não quadrada, orientação, «Valores diferentes», seleção por folha, P-FONTES.

## Etapa 12 · Estilo e fonte da legenda nas folhas (T-07)

- **O que mudou:** a T-07 lê `ST[0].leg` do `pl-quadro` e aplica nas folhas a **fonte, a cor, o corpo em pt reais, a caixa (normal, MAIÚSCULAS, Capitular), o espaçamento**, os interruptores de texto, data e local e o **estilo pronto** (Contornada, Etiqueta, Carimbo, Bilhete, Calendário). Sem estado do Quadro, vale o visual antigo.
- **Teste:** `npm run testar:formato` ganhou 3 conferências (fonte e cor, caixa alta e Carimbo, data desligada). `testar`, `testar:lote` e `verificar` passam.
- **Ainda fora (E4):** formato da data (a folha mostra sempre 14.07.26), posição Acima/Ambas e deslocamento, «Ajustar para caber», janela não quadrada, orientação, «Valores diferentes» nos campos, seleção por folha, P-FONTES (precisa de rede). Fontes do catálogo só aparecem nas folhas se já tiverem sido carregadas pelo seletor do Quadro `[VALIDAR]`; senão cai no fallback da categoria.
- **Não visto em navegador por imagem:** só por teste automatizado; falta conferir o visual lado a lado.

## Etapa 11 · Confirmações, T-12 nas Folhas e estado entre os modos

- **Pop-up «Remover N fotos do projeto?»** (T-14): nível 3, foco preso, Esc e «Manter fotos» mantêm. O LED fica em «Manter fotos»; «Remover N fotos» é secundário com lixeira (DS: destrutivo nunca LED nem vermelho). Continua desfazível por Ctrl+Z e pelo toast.
- **Pop-up «Trocar para X?»** (T-12, FN-03): antes e depois (nome, medidas, folhas no papel atual), LED em «Trocar formato», «Manter formato atual» e Esc mantêm. Clicar no formato já ativo não abre nada.
- **`motor-folhas.js` (novo):** papel, grade, melhor giro e contagem de folhas num só lugar; a T-07 delega a ele e o pop-up usa a mesma conta (D-087).
- **T-07 com o formato do Quadro:** Mini quadrado dá 9 por folha e 3 folhas em A4 (Clássico: 4 por folha, 6 folhas). A legenda própria de cada foto aparece na folha.
- **Ida e volta:** o Quadro grava o estado inteiro (`pl-quadro`) e a T-07 grava papel e espaço (`pl-folhas`). Voltar ao Quadro mantém ajustes, filtros, legendas e formato; voltar às Folhas mantém o papel (D-085). Projeto novo (T-02) limpa tudo.
- **Teste:** `npm run testar:formato` (Chromium) passa, junto com `testar`, `testar:lote` e `verificar`. Conferi o visual do pop-up em 390 e da T-07 em 1440.

### `[VALIDAR]` e `[RECOMENDADO]` da etapa 11

| Item | Situação |
| --- | --- |
| **Orientação Vertical/Horizontal e atalho `R`** | Fora. O DOC-05 não diz o que muda com a janela quadrada (a moldura só gira); a folha já gira a polaroid sozinha (FN-01) `[VALIDAR]` |
| **Janela não quadrada** | Fora. Pede generalizar `cabe()`, `zmin()` e `base()` do motor de recorte (Retro Pocket, Instax Mini e Wide seguem «Em breve») |
| **Filtro nas folhas** | Fora. A T-07 desenha um quadro neutro no lugar da foto; sem a cena, o filtro não tem o que mostrar. Só a legenda entrou |
| **Estilo da legenda nas folhas** | A folha usa o texto da foto, mas não o estilo pronto (contorno, etiqueta etc.) nem a fonte escolhida |
| **Folhas do pop-up** | Usa papel e espaço guardados da T-07; sem visita prévia à T-07, vale o padrão (A4, 10 mm, 4 mm, girar) |
| **«Valores diferentes» dentro dos campos** | Segue como linha de resumo |
| **Fontes (P-FONTES)** | Segue aberta: baixar as `.woff2` exige rede, que este ambiente não tem |
| **Persistência** | Só `sessionStorage` (some ao fechar a aba); Dexie depois |

## Etapa 10 · T-14 fechada: Duplicar e Remover (lote dinâmico)

- **Modelo:** cada foto guarda a origem em `ST[n].src` (1 a 24); a posição é só a ordem. Orientação, cena de exemplo, legenda padrão e data/hora de exemplo seguem a origem (`SRCMAP` no motor, `PLQ.src`). `src` não conta como «Ajustada» (`mudou`).
- **Duplicar:** a cópia entra logo depois da original e herda ajustes, filtro, legenda e metadados; a foto aberta continua a mesma. **Remover:** tira do projeto, nunca zera o lote (mínimo 1) e mostra «A foto continua no seu aparelho.» Ambos agem nas fotos marcadas na faixa; sem marcação, na foto aberta. Botões secundários com ícone (cópia, lixeira), sem LED e sem vermelho.
- **Histórico:** as duas ações entram no desfazer e refazer (Ctrl+Z/Y e toast «Desfazer»); a faixa é refeita, a seleção é limpa e o contador («Lote N», «Foto 03 / N», «Todas as fotos · N») acompanha.
- **T-07:** lê a lista `pl-fotos` (sessionStorage, gravada pelo Quadro) e pagina com o número real de fotos; «Todas as fotos · N» e «Aplicar ao lote · N fotos» acompanham.
- **Teste:** `npm run testar` (motor, +2 conferências) e `npm run testar:lote` (Chromium: duplicar, remover, desfazer, refazer, T-07, 390 sem rolagem horizontal) passam; `verificar` sem erros. Conferi o visual em 1440 e 390 (captura de tela). **Falta** conferir o toque em aparelho real.

### `[VALIDAR]` e `[RECOMENDADO]` da etapa 10

| Item | Situação |
| --- | --- |
| **Remover sem pop-up** | Só toast com «Desfazer» e Ctrl+Z. Se o dono quiser confirmação, entra um pop-up (D-082) `[VALIDAR]` |
| **Rótulo «Remover» × «Excluir»** | FN-09 diz «Remover»; o exemplo do DOC-01 diz «Excluir 2 fotos». Usei «Remover» |
| **Sem teto de fotos** | Duplicar não tem limite (o plano prevê 100 folhas, hipótese P19). Limite chega com o plano `[VALIDAR]` |
| **Persistência** | A lista de origens vive em `sessionStorage`; ajustes por foto ainda só na sessão da página (Dexie depois) |
| **T-05 e Home** | O resumo e o card da Home seguem com 24 (são o momento da importação) |
| **Seleção na T-07** | Continua fora (só a faixa do Quadro) |

## Etapa 9 · T-14 Lote e seleção

- **Onde:** módulo novo `assets/js/pages/lote.js` + `css/pages/lote.css`, no chip de escopo do Quadro: link **«Modificar escopo»** abre a caixa de lote. Ganchos em `quadro.js` (`PLLOTE`, `lote()`, «Aplicar às demais», rótulo das miniaturas) e em `metadados.js` (ajuste de horas).
- **Escopo em 4 níveis (FN-00b):** Somente esta · Selecionadas · Esta folha · Todas. A caixa «Replicar para as demais N fotos» segue valendo e fica sincronizada (marcada = qualquer escopo exceto «Somente esta»). Chip: «só esta foto · Foto 03», «3 fotos selecionadas», «esta folha · Folha 1 · 4 fotos», «Todas as fotos · 24». «Aplicar às demais» e as contagens usam só o escopo escolhido.
- **Seleção (FN-09):** Ctrl ou ⌘ + clique marca uma foto na faixa, Shift + clique marca um intervalo; no toque, «Marcar na faixa» troca o clique por marcar. «Selecionar todas», «Só esta folha», «Limpar» e contador «N fotos selecionadas». Selecionada = anel azul 2 px, número azul e «, selecionada» no rótulo de acesso.
- **«Valores diferentes» (FN-00a):** com escopo de várias fotos, a caixa lista os ajustes (e o Filtro) que diferem entre a foto atual e as de destino.
- **Ajuste individual protegido:** o aviso fixo diz «3 fotos têm ajuste individual e foram mantidas.» (singular tratado) depois de aplicar ou colar; «Substituir ajustes individuais» desmarcada mantém a proteção.
- **Copiar e colar estilo:** copia ajustes e filtro da foto atual; cola nesta foto e nas do escopo, respeitando a proteção.
- **Teste:** `verificar` e `testar` passam; a lógica de escopo, folha, seleção e «Valores diferentes» foi conferida em simulação. **Não foi aberta em navegador**: faixa, caixa de lote e toque sem conferência visual.

### `[VALIDAR]` e `[RECOMENDADO]` da etapa 9

| Item | Situação |
| --- | --- |
| **Duplicar e Remover** | Resolvido na etapa 10 (lote dinâmico, D-080 a D-083) |
| **Folha da foto** | 4 polaroids por folha em ordem (foto 9 = folha 3) `[RECOMENDADO]`; a T-07 paginada (separar por orientação) pode divergir |
| **Selecionadas inclui a foto atual** | «3 fotos selecionadas» = marcadas + a que está aberta, porque a edição sempre alcança a atual `[RECOMENDADO]` |
| **Cópia do estilo** | Só ajustes e filtro; legenda (estilo é do projeto) e recorte não entram (D-068) |
| **«Valores diferentes»** | Aparece como linha de resumo, não dentro de cada campo; mostrar nos campos exige mexer no construtor dos deslizadores `[VALIDAR]` |
| **Seleção na T-07** | A seleção por folha na tela de Folhas não entrou; só a faixa do Quadro |
| **Persistência** | Seleção e área de transferência só na sessão da página |

## Etapa 8 · T-13 Inspetor · Metadados

- **Onde:** aba METADADOS do Quadro. Novo: `assets/js/pages/metadados.js` e `css/pages/metadados.css`; ganchos em `quadro.js` (`PLMET`, `PLQ.nat/vert`, `mudou` ignora `meta`, «Resetar recorte» preserva `meta`) e em `legendas.js` (data e local agora vêm da foto atual: `PLQ.meta(n)`).
- **Estado:** por foto em `ST[n].meta` (só existe depois de uma edição), no histórico: desfazer e refazer valem. Metadados não marcam a foto como «Ajustada».
- **Leitura (FN-08):** data e hora com origem («Data da foto (EXIF)», «Digitada por você», «Sem data na foto», «corrigida +3 h»), orientação, dimensões em px, perfil de cor, origem, local. Selos neutros «Aproximado» (local vindo do GPS) e «Convertida» (quando `conv` for verdadeiro).
- **3 campos:** data (`dd/mm/aaaa`; não aceita data inexistente nem futura), cidade (até 60 caracteres) e origem (lista). «Sem data» e «Sem local» limpam o campo. Cidade vazia faz o local sumir da legenda; data vazia faz a data sumir. Erro = borda preta 2 px + ✕ + mensagem.
- **Corrigir várias:** «Somar ou subtrair horas às datas» (−48 a +48, inteiro) com prévia desta foto e botão «Aplicar em N fotos com data»; toast «Datas corrigidas em +3 h · 24 fotos · Desfazer».
- **Caixa fixa** com o texto do FN-08. Um LED por tela: nenhum LED novo (botão secundário).
- **Teste:** `verificar` e `testar` passam; a lógica de datas foi conferida (31/02, futuro, +14 h passando da meia-noite). **Não foi aberta em navegador**: visual e celular sem conferência.

### `[VALIDAR]` e `[RECOMENDADO]` da etapa 8

| Item | Situação |
| --- | --- |
| **Horas de exemplo** | O DOC-04 §6 só dá a data. Hora = 08:00 + 30 min por foto `[HIPÓTESE]`, para o ajuste de horas ter efeito visível |
| **«Origem»** | O FN-08 só diz «origem». Lista: Do aparelho, Câmera, Apple Fotos, Não informada (fontes da T-03) `[RECOMENDADO]` |
| **«Das selecionadas»** | Resolvido na etapa 9: com fotos marcadas na faixa, o ajuste de horas vale só para elas; sem seleção, vale para todas com data `[RECOMENDADO]` |
| **Perfil de cor** | Fixo «sRGB» (BR de saída); o real vem do motor (`exifr`) `[HIPÓTESE]` |
| **«Convertida»** | Corrigido na etapa 9: usa as mesmas fotos HEIC da T-04 (5, 7, 12, 13, 18 e 22). A conversão real vem com o motor |
| **Sem data / sem local** | Estados alcançados pelos botões, sem foto de exemplo sem data (DOC-04 §6 não prevê) |
| **Hora não editável** | Só data, cidade e origem (FN-08). A hora muda só pelo ajuste de horas |
| **Persistência** | Só na sessão da página (Dexie depois) |

## Etapa 7 · T-12 Inspetor · Molduras e medidas

- **Onde:** aba MOLDURAS do Quadro. Novo: `assets/js/pages/molduras.js` e `css/pages/molduras.css`; ganchos em `quadro.js` (`PLMOL`, `FR` mutável, `PLQ.dim/render`) e o `.pq` passou a usar `--ar`, `--pl`, `--pt`, `--rd`.
- **Estado:** `ST[0].fr` (projeto todo), no histórico: desfazer e refazer valem.
- **Formato:** 7 itens do FN-03. Valem agora os de **janela quadrada**: Clássico 88×107, Mini quadrado 60×73, Instax Square 72×86 e Personalizado. Retro Pocket, Instax Mini e Instax Wide aparecem «Em breve» (janela não quadrada).
- **Medidas:** largura e altura externas, janela, margem lateral, faixa superior, faixa inferior, cantos 0–6 mm. **Cadeado** liga margem lateral e superior; **Manter proporções** escala as medidas. Unidades **mm · cm · pol** (preferência na sessão). Erro de campo = borda preta 2 px + ✕ + mensagem.
- **Na mesa:** réguas (Plex Mono 11 px) só com a aba aberta, polaroid e PPI recalculados, cota «Passe-partout inferior» na unidade escolhida. Moldura sempre branca.
- **Teste:** `verificar` e `testar` passam; as contas das medidas foram conferidas (Clássico = 25 mm de faixa inferior). **Não foi aberta em navegador**: réguas, tamanho da polaroid e layout em 390 sem conferência visual.

### `[VALIDAR]` e `[RECOMENDADO]` da etapa 7

| Item | Situação |
| --- | --- |
| **Polaroid agora em mm exatos** | Antes a margem era 20 px a 420 px de largura (4,2 mm); agora 6 mm → janela menor e visual do Clássico levemente diferente da T-08 aprovada. Decidir |
| **Janela quadrada** | O motor de recorte (cobertura da janela) assume 1:1. Formatos não quadrados dependem de generalizar `cabe()` e `zmin()` |
| **Medidas dos outros formatos** | O DOC-05 só dá as externas (e a janela do Clássico). Margens de 6 mm e janela = largura − 12 `[RECOMENDADO]` |
| **Limites dos campos** | Largura 30–200, altura 40–250, margens 2–20, janela ≥ 20, faixa inferior ≥ 10 mm `[RECOMENDADO]` |
| **Cantos** | Padrão 0,4 mm (≈ os 2 px antigos) `[RECOMENDADO]` |
| **Formato é do projeto** | O DOC-05 diz que a moldura pertence à foto; aqui vale para todas (como o papel) `[VALIDAR]` |
| **Ainda fora** | Orientação Vertical/Horizontal e atalho `R`; pop-up antes/depois com novo número de folhas; distância entre polaroids ao arrastar (Colagem); a T-07 ainda pagina com o Clássico fixo; «Modelos» (1.1, PENDENTE) |

## Etapa 6 · T-11 Inspetor · Ajustes e filtros

- **Onde:** módulo «Filtro» no topo da aba AJUSTES do Quadro (os 8 controles de ajuste da T-08 seguem abaixo). Novo: `assets/js/pages/filtros.js`; ganchos em `quadro.js` (`PLFLT`, `flt` por foto) e CSS em `quadro.css`.
- **12 filtros (FN-06):** Original, P&B, Noir, Retrô, Foto Antiga, Praia, Pastel, Polaroid Clássico, Instantânea, Verão, Desbotado, Cinema. Cada um é uma matriz de cor 4×5, sem aleatoriedade (BR-03); a intensidade 0–100% mistura com a matriz identidade. Miniaturas com **a foto atual**; selecionado = anel azul 2 px (DV-20).
- **Sugerido para esta foto:** calculado no aparelho a partir de luz e cor médias da foto; a miniatura ganha a tag «Sugerido».
- **Favoritos:** coração em cada filtro (projeto todo) e visão «Favoritos». **Comparar:** divide a foto, original à esquerda e filtro à direita (só na tela). **Ver original:** manter pressionado (mouse, toque, Espaço ou Enter) mostra a foto sem filtro nem ajustes.
- **Escopo e histórico:** o filtro é por foto (chip «só esta foto»); «Replicar» e «Aplicar às demais» agora copiam também o filtro; «Resetar tudo» e «Resetar foto» o incluem; desfazer e refazer valem. Foto com filtro conta como «ajustada».
- **Testado em Chromium (1440 e 390):** sem erro de script nem rolagem horizontal; escolha, intensidade, favoritos, comparar e desfazer exercitados. Não comparado lado a lado com o E4b.

### `[VALIDAR]` e `[RECOMENDADO]` da etapa 6

| Item | Situação |
| --- | --- |
| **Matrizes dos 12 filtros** | O DOC-05 dá os nomes, não os valores. Receitas `[RECOMENDADO]` (LIVRE); o dono vê e veta. Não há LUT nesta etapa |
| **Regra do «Sugerido»** | Luz < 38% → Cinema; cor < 12% → Noir; luz > 62% → Pastel; cor > 35% → Polaroid Clássico; senão Retrô `[RECOMENDADO]`. Com fotos reais usa o histograma de verdade (DOC-08) |
| **Ordem** | Filtro é aplicado depois de brilho, contraste, saturação, temperatura, realces e sombras |
| **«Ver original»** | Mostra a foto sem filtro **e** sem ajustes. O DOC-05 só diz «ver original» |
| **Selecionadas** | «Aplicar o mesmo filtro nas selecionadas» usa o «Replicar» (todas as demais). Seleção parcial chega com a T-14 |
| **Granulação** | Fora (só na 1.1, com semente fixa por foto) |
| **Favoritos** | Só na sessão da página (Dexie depois) |
| **Miniaturas da faixa do lote** | Ainda sem filtro aplicado |

## Etapa 5 · T-10 Inspetor · Legendas

- **Onde:** aba LEGENDAS do inspetor do Quadro (`/app/editor/quadro/`, E4b em desktop; tablet e celular pelo painel inferior). Arquivos novos: `assets/js/pages/legendas.js` e `assets/css/pages/legendas.css`; `quadro.js` ganhou só ganchos (`window.PLQ`, `PLLEG.render()`, aba ativa).
- **Modelo:** o estilo dos 3 tipos vale para o projeto (`ST[0].leg`); o texto livre é por foto (`ST[n].txt`). Entra no histórico existente (Ctrl+Z/Y, toast «Desfazer»). Chip: «Alterando: texto só desta foto · Foto 03 · estilo em todas as 24».
- **Seções (FN-07):** Estilos prontos (8, DV-03; ativo = preto + branco, DV-20) · Texto livre (interruptor, até 80 caracteres «11/80», fonte, 8–32 pt, «Ajustar para caber», caixa, espaçamento −0,05 a 0,3 em, cor) · Data (13 formatos, DV-05, corpo, cor) · Local (estado, país, separador, ordem; «Cidade, nunca coordenadas») · Posição (abaixo, acima, ambas; deslocamento X e Y ±5 mm passo 0,1; inclinação ±5°). «Resetar» por controle, «Resetar legendas», «Aplicar legendas» (secundário; copia o texto desta foto às demais, DV-18).
- **Seletor de fonte (DOC-02 §4, DV-04):** 26 fontes em 5 categorias, busca, Favoritas (coração), Recentes (5), amostra na própria fonte com o texto real. Cor da inscrição só Preto, Azul, Laranja, com nome (DV-21, T3).
- **Validação do texto:** coordenadas **bloqueiam** (borda preta 2 px + ✕); código de arquivo pede «Usar mesmo assim».
- **Área segura (BR-13):** mede a caixa já deslocada e inclinada; fora da área (4 mm de respiro e zona da assinatura) aparece a mensagem com «Ajustar para caber».
- **Nada sobre a foto (T4):** a inscrição fica só na moldura; «Acima» usa a margem de cima.
- **Testado em Chromium (1440 e 390):** sem erro de script, sem rolagem horizontal; estilos, formatos, validações, fontes e desfazer exercitados. **Não** comparado lado a lado com o E4b.

### `[VALIDAR]` e `[RECOMENDADO]` da etapa 5

| Item | Situação |
| --- | --- |
| **Fontes do catálogo (T6)** | As 22 fontes novas carregam do Google Fonts **só depois que a pessoa abre o seletor** (clique, LG-04). Continua violando T6 até autohospedar (P-FONTES): baixar as 26 `.woff2` |
| **Sem rede** | Cai no fallback genérico da categoria. Ainda falta o aviso «Pede confirmação» no pré-voo (E6) e o teste de acentuação por fonte |
| **Data e local** | Têm interruptor, formato, corpo e cor, mas fonte fixa em IBM Plex Mono `[RECOMENDADO]`. FN-07 pede fonte própria por tipo |
| **Posição «Acima» e «Ambas»** | O DOC-05 não define o que sobe. Adotado: Acima = tudo na margem de cima; Ambas = texto em cima, data e local embaixo |
| **Estilos prontos** | Só mudam a aparência (contorno, etiqueta, carimbo, bilhete, calendário, pin); os desenhos são `[RECOMENDADO]` (LIVRE). «Pin de local» usa ícone próprio, não emoji |
| **Aplicar legendas** | Copia só o texto livre; o estilo já vale para todas as fotos |
| **Origem da data e do local** | Dado de exemplo (14.07.26, Campos do Jordão, SP). Origem EXIF, manual e «sem data» chegam com o motor real |
| **Ainda fora** | Ícone inicial, Replicar com «textos individuais», Copiar estilo, rolagem horizontal dos estilos no celular (DV-33) e a mesma legenda nas folhas da T-07 |

## Etapa 4 · T-08 Modo Quadro

- **Rota:** `/app/editor/quadro/#foto-N` (padrão `#foto-3`; `#foto-12` mostra «Com ressalvas · 140 PPI»). Na T-07, clicar numa polaroid da folha abre o Quadro nessa foto (FL-04) e o trilho «Quadro» (e a pílula no celular) leva à 1ª foto da folha atual.
- **Mesa (DOC-01 §4.1):** HUD com «Guias · 0,1 mm» e selo de qualidade (ícone + texto, BR-12), barra de recorte (Preencher/Encaixar, girar, espelhar, foto inteira), polaroid de até 420 (padding 20 20 28, foto 1:1, passe-partout 24, legenda, data • local, assinatura dentro da moldura, nada sobre a foto), ações «Foto anterior», «Centralizar quadro», cota «Passe-partout inferior» e selo neutro «Ajustada», faixa do lote #01…#24 (48×56; ativa 56×64 com anel azul 2).
- **Posicionar (FN-04):** arrastar, roda do mouse, pinça, setas (1 px; Shift 10 px) e `+ −`; `[` `]` trocam de foto. Preencher nunca estica e **a janela fica sempre coberta**: o zoom mínimo sobe ao endireitar (a 15° = 123%) e a posição é limitada. Encaixar deixa sobra branca. Grade de composição (nenhuma, terços, diagonais) só na tela; grade fina enquanto se ajusta «Endireitar». «Mostrar a foto inteira» desenha a foto esmaecida e um traço fino na janela.
- **Qualidade em tempo real (BR-12):** 4 selos (Boa ≥ 240, Abaixo do ideal, Com ressalvas, Ruim). Abaixo de 240 aparece a mensagem de atenção com «Reduzir recorte» (leva o zoom ao maior valor com ≥ 240 PPI) e «Trocar foto» (abre a T-03). Miniaturas com ponto laranja quando a foto está abaixo de 240.
- **Aba AJUSTES (FN-05):** Recorte e posição, Luz e cor (brilho, contraste, saturação, temperatura), Detalhe (realces, sombras, nitidez, vinheta); campo de 44 com unidade, deslizador, «Resetar» por controle (só aparece se mudou), «Resetar tudo», «Resetar foto». Erro de campo = borda preta 2 px + ✕.
- **Escopo e lote (FN-00b, FN-09):** chip «Alterando: só esta foto · Foto 03»; «Replicar para as demais 23 fotos» **desmarcada**; ao marcar, o chip vira «Todas as fotos · 24» com tag LOTE e libera «Aplicar às demais». Fotos com ajuste individual ficam protegidas («Substituir ajustes individuais» desmarcada) e a contagem aparece.
- **Desfazer e refazer** ilimitados (Ctrl+Z / Ctrl+Y), com toast «Desfazer». Estado por foto na sessão.
- **Um LED por tela:** só «Revisar impressão» (cabeçalho em D e T; barra fixa em C). Nenhum pop-up nesta tela.
- **Testes:** `npm run testar` confere o motor: 326 e 140 PPI, faixas do BR-12, zoom mínimo ao endireitar e cobertura da janela em 4 000 estados aleatórios (girar, espelhar, endireitar, zoom, posição, fotos verticais e horizontais). A página também rodou sem exceções em simulação de DOM. **Não foi aberta em navegador real**: o visual (1440, 834, 390) e o toque (arrastar, pinça) seguem sem conferência lado a lado com o design aprovado.

### `[VALIDAR]`, `[RECOMENDADO]` e `[HIPÓTESE]` da etapa 4

| Item | Situação |
| --- | --- |
| **Rota própria** | O Quadro é outra página, não outro painel da T-07 (D-065). Se o dono preferir o mesmo documento, a casca é a mesma |
| **Cota do passe-partout** | O DOC-01 e o DOC-05 dizem 24,5 mm; pelo formato Clássico (107 − 6 − 76) dá **25 mm** e a tela calcula (D-067). Decidir |
| **PPI de exemplo** | A foto de exemplo tem 976 px no lado menor para reproduzir 326 e 140 PPI do DOC-04 §6 (D-066, `[HIPÓTESE]`) |
| **Escala** | A pílula mostra a escala em relação a 96 ppi (a 420 px = 126%), não «100%» fixo; «Tamanho real» só após calibrar (FN-11, 1.1) |
| **Replicar** | Marcar muda o chip para «Todas as fotos · 24», mas a cópia só acontece em «Aplicar às demais». `[VALIDAR]` se deve valer ao vivo |
| **Ajustes agora, filtros na T-11** | Os 8 controles do FN-05 entraram juntos (a tabela é uma só). A T-11 traz os 12 filtros, «Sugerido para esta foto», Favoritos, Comparar e «Ver original» |
| **Prévia dos ajustes** | Brilho, contraste, saturação, temperatura, realces e sombras são aproximados por filtro de tela. **Nitidez não tem prévia** (só na exportação, a partir de 300 PPI, FN-05); a exportação usa a display list (DOC-08) |
| **Grade padrão** | O FN-04 não define o padrão; ficou «Nenhuma» `[RECOMENDADO]` |
| **Textos novos** | Mensagens «Abaixo do ideal» e «Ruim», «Replicar…», «Reduzir recorte» e a aba Papel no Quadro («Abra o modo Folhas») são `[RECOMENDADO]`. «Com ressalvas» usa o texto do DOC-04 §5 |
| **«Modificar escopo»** | O link do DOC-01 §4.1.1 não entrou; os 4 níveis do FN-00b chegam com a T-14 |
| **Teclado** | Feitos: setas, `+ −`, `[ ]`, Ctrl+Z/Y. Faltam `R` (girar moldura, vem com Molduras), `G` (guias) e Espaço (pan temporário) |
| **Persistência** | Os estados por foto vivem só na sessão da página; salvar no aparelho fica para o motor com Dexie (DOC-08 §7) |
| **Celular** | Painel a 25% deixa a polaroid pequena; a página rola até a faixa do lote. Conferir em aparelho |

## Etapa 3 · T-07 Modo Folhas

- **Fluxo ligado:** T-06 «Continuar» → editor (a escolha de orientação fica em `sessionStorage`, chave `pl-orientacao`); T-05 sem verticais e horizontais → editor; card da Home → editor.
- **Casca (E4b, DOC-01 §4):** cabeçalho 64, trilho 256 (4 itens), faixa de contexto, mesa 7/12, inspetor 5/12, faixa de folhas. Tablet 834: trilho de ícones 72 e inspetor deslizante (`min(360px, 40vw)`). Celular 390: sem trilho, pílula de modos, prévia primeiro, painel inferior arrastável (25, 50, 85%) e barra fixa «Revisar impressão».
- **Motor real (DOC-08 §3):** `paginar()` com margem, espaço, giro, orientação da folha, alinhamento e separação por orientação. Conferido nos testes de aceitação: A4 = 4, A3 = 9, A5 = 2 (girado), 10 × 15 = «não cabe».
- **Aba PAPEL (DOC-05 FN-01):** todos os campos, «Resetar» por controle (aparece só se o valor mudou), «Valores» com validação (erro = borda preta 2 px + ✕), papel Personalizado 50–1000 mm.
- **Guias × contorno (FN-02):** contorno desabilitado com apoio quando as guias estão ligadas; pop-up «Ativar guias desliga o contorno?» (foco preso, Esc fecha). Guias contínuas até a borda da folha, sem cruzar o interior; «Marcas de canto» limitadas ao vão.
- **Desfazer e refazer** ilimitados na sessão (Ctrl+Z / Ctrl+Y), toast «6 folhas → 7 folhas · Desfazer».
- **Estados de revisão por hash:** `#estado-parcial` (folhas parciais), `#estado-nao-cabe`, `#estado-contorno`, `#estado-sem-linhas`.
- **Um LED por tela:** só «Revisar impressão» (cabeçalho em D e T; barra fixa em C). O pop-up tem o seu próprio LED.
- Testado em Chromium (1440, 834, 390): sem erro de script e sem rolagem horizontal. **Não** comparado lado a lado com o design aprovado.

### `[VALIDAR]` e `[RECOMENDADO]` da etapa 3

| Item | Situação |
| --- | --- |
| **Folhas × orientação** | DOC-08 §3 (separar por orientação) com 18 horizontais e 6 verticais dá **7 folhas** (5 + 2), mas o DOC-04 §6 fixa **6 folhas**. O editor abre em 6 (separação desligada) e passa a 7 se a T-06 escolheu «Separar por orientação». O padrão ligado do FN-01 não foi aplicado por isso. Decidir |
| **Aproveitamento** | O DOC-05 dá «78%» sem fórmula. Foi calculado como área das polaroids ÷ área útil (dentro das margens): 72% no exemplo |
| **Trilho** | Colagem e Lembranças aparecem com «Em breve» (DOC-01 §4.1 lista 4 itens; DV-01 pede só com a 1.1). Quadro passou a funcionar na etapa 4 |
| **Chip de escopo** | Sem o link «Modificar escopo»: as definições de papel valem para o projeto todo. Entra com as abas por foto (E4) |
| **Outras abas** | FOTOS, AJUSTES, LEGENDAS, MOLDURAS e METADADOS mostram «Esta aba ainda não está disponível.» |
| **Legendas e assinatura na folha** | Caveat vem do Google Fonts (P-FONTES); sem rede cai para a fonte do sistema |
| **«Substituir ajustes individuais» e «Aplicar ao lote»** | Só visuais por enquanto (ainda não há ajustes por foto) |

## Etapa 2 · T-05 e T-06

- **Fluxo ligado:** T-03 → T-04 → T-05 → T-06. A T-04 agora segue para o resumo; a T-05 segue para a T-06 quando há fotos verticais e horizontais (FL-02); a T-06 volta para a T-05 (botão «Voltar» ou Esc).
- **T-05:** resumo com fotos, orientação, datas, local, qualidade e folhas previstas (calculadas: `ceil(fotos ÷ 4)`). «Manter uma de cada» com «Desfazer», interruptor «Ordenar por data da foto», texto fixo «Suas fotos continuam no seu aparelho.». Estados de revisão por hash: `#estado-duplicadas` e `#estado-sem-data`.
- **T-06:** pop-up LED nível 3 sobre o resumo, 3 opções (Separar por orientação, recomendada e pré-marcada; Todas no padrão; Decidir depois). Foco preso no pop-up.
- **Um LED por tela:** só «Continuar» (na T-06, o anel do pop-up e o botão). Nenhum LED em controles.
- `[RECOMENDADO]` (LIVRE nos MDs): contagem de exemplo de 18 horizontais e 6 verticais; frases de apoio das 3 opções; mensagem de «sem data» («ficam no fim do grupo»); «Esc» equivale a «Voltar».
- `[VALIDAR]` o que «Todas no padrão» faz com as verticais. O DOC-05 só define o interruptor «Separar por orientação» (FN-01, padrão ligado).
- Teste: a lógica do resumo foi exercitada em simulação (estados, desfazer, navegação). O visual **não** foi visto em navegador.

## Decisões da etapa 1

- **T-01 duplicada:** havia dois arquivos. Foi usado `polar-life-t01-home.html`, o mais recente (o botão «Novo projeto» já navega). O outro continua em `design/prototipos-originais/`.
- **Links entre telas:** os protótipos apontavam para URLs de artefatos do Claude; foram trocados por rotas relativas. Mapeamento inferido pelo contexto de cada link: T-01 → T-02 → T-03 → T-04, «Cancelar» e «Voltar» voltam um passo, logo → Home ou Apresentação. `[VALIDAR]` o destino do botão «Continuar» da T-03 (assumido T-04).
- **CSS:** `fonts.css`, `tokens.css` e `led.css` agora são compartilhados (eram copiados em cada página). O que sobrou fica em `css/pages/<tela>.css`, sem alteração visual.
- **Imagens e fontes** que estavam em base64 viraram arquivos. Os 3 logos usam os nomes oficiais do DOC-01 §13.
- **Favicon:** foi adicionado `Logo_favicon_PolarLife.png` (108×96, não quadrado) até resolver o P28.

