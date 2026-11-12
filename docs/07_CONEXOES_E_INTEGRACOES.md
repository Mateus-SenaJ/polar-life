---
id: DOC-07
titulo: PolarLife · Conexões e integrações (Google Fotos, Apple, Instagram e outros)
edicao: 2
data: 2026-11-07
status: vigente
depende_de: [DOC-01, DOC-03, DOC-06]
fatos_verificados_em: 2026-11-07 (segundo os documentos de origem; reconfirmar antes de implementar)
---

# Conexões e integrações

> **TL;DR para IA.** Cada serviço externo aparece como **cartão de conexão** com um estado honesto: *Disponível, Conectado, Precisa reautorizar, Em breve, Indisponível por regra da plataforma*. Há um **teste de conexão** que verifica sem ler nenhuma foto. **Não prometa** o que a plataforma não permite: Instagram não tem importação por API; Apple não tem API web de leitura de fotos. Nesses casos a tela oferece o **caminho que funciona**.

## 1. FIXO

| ID | Regra |
| --- | --- |
| CN-01 | A foto vai **da origem direto ao navegador**. Nenhum servidor do PolarLife toca nela (BR-01) |
| CN-02 | O usuário **escolhe** as fotos no seletor oficial do serviço. O app nunca lista a biblioteca inteira |
| CN-03 | **Instagram e Facebook: sem integração por API** (D-002). O app oferece caminho guiado de entrada e de saída (§4) |
| CN-04 | Endereços temporários de fotos (ex.: `baseUrl` do Google) **nunca são persistidos** |
| CN-05 | Estado de conexão sempre em **ícone + texto**, nunca só por cor (DS-06) |
| CN-06 | O teste de conexão **não lê, baixa nem envia fotos** |
| CN-07 | Botões «Continuar com Apple» e «Continuar com Google» usam **ativos oficiais**, com o mesmo peso visual entre si (exceção D-044). Todo o resto segue o DOC-01 |
| CN-08 | Cada conexão tem um **plano B visível**: sempre «Escolher do aparelho» |
| CN-09 | Consentimento de login (e-mail) é **separado** do consentimento do seletor de fotos (outro escopo, outra tela) |

## 2. Matriz de integrações

| Serviço | Entrada | Saída | Caminho técnico | Versão | Estado na interface |
| --- | --- | --- | --- | --- | --- |
| **Do aparelho** | Sim | — | `<input type=file multiple accept="image/*,.heic,.heif">`, arrastar, colar | 1.0 | Disponível |
| **Câmera** (celular) | Sim | — | `capture` do input | 1.0 | Disponível |
| **Galeria do iPhone/iPad (Apple Fotos)** | Sim, **pelo seletor do sistema** | Sim (menu Compartilhar) | O seletor de arquivos do iOS já abre «Biblioteca de Fotos» | 1.0 | Disponível |
| **iCloud Fotos (web)** | Sem API pública `[VALIDAR]` | — | Não há; usar o seletor do sistema ou exportar do aparelho | — | Indisponível por regra da plataforma |
| **Entrar com Apple** | Só login | — | Identidade; devolve e-mail verificado; não dá acesso a fotos | 2.0 | Em breve |
| **Google Fotos** | Sim | — | **Picker API**, escopo `photospicker.mediaitems.readonly` | 2.0 | Em breve → Disponível |
| **Entrar com Google** | Só login | — | Identidade separada do Picker (CN-09) | 2.0 | Em breve |
| **Instagram** | **Não por API** | Sim, por compartilhar/baixar | Entrada: salvar no aparelho ou importar ZIP `[VALIDAR]`. Saída: Web Share ou download | 1.0 (guiado) | Indisponível por regra da plataforma + caminho guiado |
| **Facebook** | Idem Instagram | Idem | Idem | 1.0 (guiado) | Idem |
| **Drive, Dropbox, OneDrive** | Sim | — | Seletores oficiais; ordem por pesquisa (D-014). Dropbox: link direto expira em 4 h | 3.0 | Em breve |
| **Compartilhar (saída)** | — | Sim | Web Share com `canShare({files})`; senão baixar | 1.1 | Disponível se suportado |
| **Importar ZIP** (Takeout, backup de redes) `[RECOMENDADO]` | Sim | — | Descompactar no aparelho, validar cada imagem pelo pipeline | 2.0 | Em breve |

## 3. Central de conexões (T-23)

**Onde aparece:** passo «Adicionar fotos» (T-03), avatar → «Conexões», e aviso quando uma importação falha por autorização.

**Estrutura:** cartões brancos `shadow-card`, um por serviço, em duas seções: **Trazer fotos** e **Levar para as redes**. Cada cartão: ícone do serviço · nome · **selo de estado** · uma frase de ajuda · ação.

| Estado | Ícone + texto | Ação |
| --- | --- | --- |
| Disponível | ✓ «Pronto para usar» | «Escolher fotos» |
| Conectado | ✓ «Conectado» | «Testar conexão» · «Desconectar» |
| Verificando | relógio «Verificando…» (barra contínua) | «Cancelar» |
| Precisa reautorizar | ! «Precisa entrar de novo» | «Reautorizar» |
| Em breve | relógio «Em breve (versão 2.0)» | «Avisar quando chegar» *(desabilitado até haver conta; só texto na 1.0)* |
| Indisponível por regra da plataforma | ⓘ «Esta plataforma não permite importar por aqui» | «Ver como fazer» |
| Erro temporário | ✕ «Não foi possível verificar agora» | «Tentar de novo» |

Texto fixo no topo: «Suas fotos continuam no seu aparelho. Você escolhe o que trazer.»

## 4. Caminhos guiados (quando a plataforma não permite)

**Instagram / Facebook → entrada.** Cartão «Ver como fazer» abre uma folha com 3 passos curtos: 1) salve a foto no aparelho pelo próprio app; 2) volte e escolha **Do aparelho**; 3) opcional: importar o **ZIP** do arquivo de dados baixado da conta `[VALIDAR]`. Sem captura de tela nem marca de terceiro na ilustração (use ícone neutro).

**Instagram / Facebook → saída.** Em lembranças e colagens: **Compartilhar** (menu do sistema, celular) ou **Baixar imagem** com a instrução «Abra o aplicativo e escolha a imagem na galeria». Mostrar o formato recomendado (9:16 Story, 4:5 Feed).

**Apple / iCloud.** Mensagem: «No iPhone ou iPad, toque em **Do aparelho** e escolha **Biblioteca de Fotos**. As fotos do iCloud que já aparecem na galeria funcionam.» Aviso de HEIC: «Convertendo para JPEG no aparelho» (selo «Convertida»).

**Google Fotos (2.0).** Aviso antes: «Você escolhe as fotos no Google. O PolarLife só recebe as selecionadas.» Fotos do Google chegam **sem localização**: «Escolha a cidade à mão» (FN-07).

## 5. Verificação de conexão (T-24)

Cada serviço tem uma lista curta de **linhas de verificação**. O botão **Testar conexão** as roda em ordem, com barra contínua, e termina com um resumo em texto.

```
verificarConexao(servico):
  linhas = []
  para cada passo em servico.passos:            // ordem fixa por serviço
     r = passo.executar()                        // nunca lê nem envia fotos (CN-06)
     linhas += { rótulo, estado: ok | atenção | falha | indisponível, detalhe, ação? }
     se r.falha e passo.bloqueante: parar
  resumo = pior estado entre as linhas
  retornar linhas, resumo
```

| Serviço | Passos (rótulos na interface) |
| --- | --- |
| **Aparelho / Apple Fotos** | 1. «Seletor de fotos do aparelho» (sempre ok) · 2. «Leitura de HEIC» (nativo, conversão local ou indisponível) · 3. «Espaço de armazenamento» (`storage.estimate()`; atenção em 80%) |
| **Google Fotos (2.0)** | 1. «Disponível nesta versão» · 2. «Sessão do Google válida» (existência e validade do acesso; senão «Reautorizar») · 3. «Permissão do seletor» (escopo `photospicker.mediaitems.readonly`) · 4. «Seletor do Google acessível» (cria a sessão do seletor, sem abrir) `[VALIDAR]` |
| **Instagram / Facebook** | 1. «Importar por API» → **indisponível por regra da plataforma** · 2. «Importar pelo aparelho» (ok) · 3. «Compartilhar arquivo» (`canShare`) |
| **Compartilhar (saída)** | 1. «Conexão segura (HTTPS)» · 2. «Compartilhar arquivo» (`canShare({files:[teste de 1 px]})`) · 3. «Baixar imagem» (sempre ok) |
| **Drive / Dropbox / OneDrive (3.0)** | Mesmas 4 linhas do Google, com os escopos de cada seletor |

**Resumo em texto** (exemplos): «Tudo pronto. Você pode trazer fotos do Google.» · «Precisa entrar de novo no Google. Suas fotos não foram tocadas.» · «Esta plataforma não permite importar por API. Use Do aparelho.»

**Falha → recuperação:**

| Falha | O que a tela oferece |
| --- | --- |
| Sessão expirada | «Reautorizar» e depois «Escolher fotos» |
| Seletor do Google indisponível | «Tentar de novo» e «Escolher do aparelho» |
| `baseUrl` expirado durante a importação (≈60 min) | «Reabrir seletor do Google»; fotos já importadas permanecem |
| Compartilhar sem suporte | «Baixar imagem» com instrução do destino |
| Navegador bloqueou pop-up do seletor | «Permitir pop-up e tentar de novo» ou «Escolher do aparelho» |
| Limite de itens por sessão `[VALIDAR]` | «Escolha até N por vez; repita para mais» |

## 6. Fluxo de importação do Google Fotos (2.0, resumido)

```
Aviso → Entrar/autorizar (Google Identity, escopo do Picker)
→ Criar sessão do seletor → Abrir seletor do Google (clique do usuário)
→ Aguardar «itens escolhidos» → Listar itens (paginado) → Baixar cada item no navegador (concorrência 2)
→ Pipeline de leitura (DOC-08) → Esquecer endereços temporários → Encerrar sessão
```

Fatos verificados: o usuário escolhe no seletor; endereço de mídia vale 60 minutos; o sufixo de download baixa com EXIF **sem localização**; resultados paginados. `[VALIDAR]` campos exatos da sessão, exigência de verificação do app e limite de itens.

## 7. Texto de interface (pt-BR)

| Onde | Texto |
| --- | --- |
| Topo da Central | «Suas fotos continuam no seu aparelho. Você escolhe o que trazer.» |
| Instagram | «O Instagram não permite importar por aqui. Salve a foto no aparelho e escolha **Do aparelho**.» |
| Apple | «No iPhone, escolha **Biblioteca de Fotos** no seletor.» |
| Google | «Você escolhe as fotos no Google. O PolarLife só recebe as selecionadas.» |
| Sem localização | «Fotos do Google Fotos não trazem a localização. Escolha a cidade.» |
| Compartilhar | «Baixe a imagem e escolha-a na galeria do aplicativo.» |

## 8. GUIADO e LIVRE

- **GUIADO:** ordem dos cartões; ícones neutros de cada serviço (respeitar as diretrizes de marca dos botões de login; para os demais, ícone genérico se não houver ativo oficial); forma da folha «Ver como fazer» (passos numerados, curta).
- **LIVRE:** ilustração dos passos, microcopy de ajuda, animação do teste (barra contínua LED).

## 9. Aceite

Passa se: nenhum estado depende só de cor; Instagram nunca aparece como «Conectado» nem com botão «Importar»; o teste não baixa foto; há sempre «Escolher do aparelho»; textos do §7 usados sem prometer o que a plataforma não permite; botões Apple e Google com ativos oficiais.

## 10. Pendências

Verificação do app Google (console e prazo) · limite de itens por sessão · regras da Apple para e-mail de retransmissão · importação de ZIP de redes · ordem de Drive/Dropbox/OneDrive (pesquisa de demanda, P4) · termos de cada plataforma para ícones e nomes.
