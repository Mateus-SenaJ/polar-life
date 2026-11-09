---
id: DOC-09
titulo: Polar Life · Privacidade, termos e cookies (texto-base)
edicao: 2
data: 2026-11-07
status: rascunho para revisão jurídica
depende_de: [DOC-01, DOC-02, DOC-03, DOC-07]
---

# Privacidade, termos e cookies

> **Aviso.** Redação-base, **não é parecer jurídico**. Tudo em **[COLCHETES]** precisa de dado real. Um advogado deve validar antes de publicar, e os artigos da LGPD citados devem ser conferidos na redação vigente.
>
> **TL;DR para IA.** A promessa central é: **fotos, miniaturas, legendas e coordenadas nunca saem do aparelho.** Na 1.0 não há conta nem coleta de e-mail. Na 2.0 o e-mail passa a existir para quem exporta. Só armazenamento técnico; banner de cookies **informativo**; nada de terceiros antes do clique.

## 1. FIXO

| ID | Regra |
| --- | --- |
| LG-01 | Fotos, miniaturas, legendas, ajustes e coordenadas **nunca** são enviados ao servidor (BR-01) |
| LG-02 | Na 1.0 não há conta, e-mail nem análise de uso. A frase «não coletamos e-mail» vale **só na 1.0** |
| LG-03 | Cookies e armazenamento **técnicos** apenas. Banner informativo («Entendi», «Ver detalhes»), sem parede de consentimento (C11) |
| LG-04 | Fontes, ícones e scripts são **hospedados por nós**; nada de terceiros carrega antes de um clique do usuário (TP-06) |
| LG-05 | Rodapé global nas páginas públicas: Privacidade · Termos · Cookies · Preferências · Contato do encarregado |
| LG-06 | Sem promessa de «garantia de impressão em tamanho real»; o PDF carrega só uma **dica** |
| LG-07 | Páginas legais indexáveis (HTML completo sem JS); o app em `/app` é `noindex, nofollow` |

## 2. Dados do controlador `[PENDENTE: P5]`

Razão social [RAZÃO SOCIAL] · CNPJ [CNPJ] · Endereço [ENDEREÇO] · Encarregado [NOME] · E-mail do encarregado [E-MAIL DO ENCARREGADO] · Foro [FORO] · Idade mínima [IDADE MÍNIMA] · Prazo de resposta ao titular [PRAZO].

## 3. Resumo em linguagem simples (topo da Privacidade)

- Suas fotos ficam **no seu aparelho**. O Polar Life não as recebe, não as guarda e não as vê.
- A **localização** da foto, quando existe, é lida no aparelho só para sugerir a cidade. Coordenadas nunca são impressas nem enviadas.
- O arquivo que você gera (PDF, imagem, lembrança) **não leva** os dados escondidos da foto original.
- Usamos só armazenamento **técnico**. Não usamos cookies de publicidade.
- Quando você compartilha uma imagem, ela vai do seu aparelho ao aplicativo que **você** escolher.
- Você apaga tudo limpando os dados do site no navegador.

## 4. Dados tratados

| Dado | Onde fica | Sai do aparelho? | Finalidade |
| --- | --- | --- | --- |
| Fotos que você escolhe | IndexedDB e memória | **Não** | Editar e gerar |
| Miniaturas, legendas, ajustes, projetos, colagens, lembranças | Armazenamento do navegador | **Não** | Salvar seu trabalho |
| Data e GPS da foto | Memória; GPS nunca impresso | **Não** | Sugerir legenda e cidade |
| Preferências (data, papel, unidade, fontes favoritas) | localStorage | **Não** | Lembrar escolhas |
| Registros técnicos de acesso (IP, data, página) | Hospedagem [PROVEDOR] | Sim, ao site | Segurança `[CONFIRMAR retenção]` |
| **2.0:** e-mail, créditos, assinatura, recibos | Servidor | Sim | Conta e cobrança |
| **2.0:** login Apple ou Google | Provedor de identidade | Só e-mail verificado | Entrar |
| **2.0:** fotos escolhidas no Google Fotos | Do Google direto ao navegador | **Não passam por nós** | Importar |

Não coletamos na 1.0: nome, e-mail, telefone, contatos, conteúdo das fotos.

## 5. Pontos de texto da Privacidade (resumo por seção)

1. **Quem somos:** editor web de polaroids; controlador [RAZÃO SOCIAL].
2. **Bases legais:** execução do serviço e legítimo interesse para segurança `[VALIDAR LGPD art. 7]`.
3. **Compartilhamento:** não compartilhamos fotos (nunca as recebemos); hospedagem [PROVEDOR]; compartilhar imagem é por escolha do usuário; Google Fotos e login na 2.0 conforme DOC-07; provedor de pagamento na 2.0 `[atualizar]`.
4. **Transferência internacional:** possível pela hospedagem e, na 2.0, Google `[VALIDAR arts. 33 e seguintes]`.
5. **Retenção:** dados no aparelho até o usuário apagar; registros do servidor [PRAZO]; dados fiscais pelo prazo legal na 2.0 [PRAZO].
6. **Direitos (art. 18):** confirmação, acesso, correção, anonimização/bloqueio/eliminação, portabilidade, informação sobre compartilhamento, revogação. Pedidos: [E-MAIL DO ENCARREGADO], resposta em [PRAZO].
7. **Segurança:** HTTPS, CSP restritiva, processamento local `[conferir medidas]`.
8. **Incidentes:** aviso à ANPD e aos titulares `[VALIDAR art. 48]`.
9. **Crianças e adolescentes:** serviço a partir de [IDADE MÍNIMA]; supervisão de responsável `[VALIDAR art. 14]`.
10. **Fotos de terceiros:** o usuário é responsável por ter o direito de usá-las.
11. **Mudanças e contato.**

## 6. Termos de Uso (pontos)

Serviço (processamento local) · aceitação e idade · conteúdo é do usuário · uso aceitável `[DETALHAR]` · **Impressão:** resultado depende da impressora, do papel e do visualizador; os selos de qualidade são orientações · **Assinatura Polar Life** no canto inferior esquerdo; desligar é do Pro na 2.0 · **Lembranças e colagens** levam a assinatura quando ligada · marca e fontes (licenças próprias `[VALIDAR cada fonte do catálogo]`) · disponibilidade e limitação de responsabilidade `[REDIGIR com advogado, CDC]` · **Planos (2.0):** preços finais `[PENDENTE]`, cancelamento em 2 toques, arrependimento de 7 dias `[VALIDAR]`, uso razoável, nota fiscal e reembolso `[VALIDAR]` · lei brasileira e foro [FORO].

## 7. Cookies e armazenamento

| Item | Tipo | Finalidade | Duração | Enviado ao servidor? |
| --- | --- | --- | --- | --- |
| Projetos e fotos | IndexedDB | Guardar seu trabalho | Até você apagar | Não |
| Preferências | localStorage | Papel, unidade, formato de data, fontes favoritas | Até você apagar | Não |
| Cache do app | Service worker (só `/app`) | Abrir mais rápido | [DURAÇÃO] | Não |
| Ciência do aviso | [cookie ou localStorage: DEFINIR] | Não repetir o aviso | [DURAÇÃO] | [CONFIRMAR] |
| **2.0:** sessão de conta | Cookie técnico | Manter você logado (30 dias `[HIPÓTESE]`) | [DURAÇÃO] | Sim |
| **2.0:** pagamento | Do provedor, só na tela de compra | Concluir a compra | [DURAÇÃO] | Sim |

**Análise de uso:** não existe na 1.0. Se ativada, será opt-in, desligada por padrão, atrás de feature flag (C11), com o pop-up «Preferências de cookies» já preparado.

## 8. Textos de interface (pt-BR)

| Elemento | Texto |
| --- | --- |
| Banner de cookies | «Usamos só o que o editor precisa para funcionar. Suas fotos não saem do seu aparelho.» Botões: **Entendi** (secundário) · **Ver detalhes** (terciário) |
| Pop-up Preferências (flag) | «Necessários» ligado e travado («Sempre ativo»); «Análise» desligada; sem «Marketing»; botões *Cancelar* · *Salvar preferências* (LED) |
| Importação | «Suas fotos continuam no seu aparelho.» |
| Local | «Cidade, nunca coordenadas.» |
| Metadados | «O arquivo gerado não leva os metadados originais da foto.» |
| Backup | «Você alterou este projeto. Salve um backup `.polarlife` antes de fechar?» |
| Compartilhar | «Você escolhe para onde a imagem vai. O Polar Life não recebe nada.» |

## 9. Telas legais (visual)

Banner: fundo branco, borda 8%, `shadow-floating`, sem LED, alvos ≥ 44. Pop-up de preferências: LED nível 3, toggle azul. Privacidade e Termos: `<h1>` único (Cormorant Garamond, DOC-02), corpo Inter 400, sem texto colorido. Cookies: tabela branca com bordas 4% e cabeçalho em rótulo mono; sem zebrado cinza. Erro, sucesso e informação seguem DOC-04 §5.

## 10. Pendências jurídicas

J1 dados do controlador · J2 hospedagem, registros e retenção · J3 transferência internacional · J4 licenças (foto do hero, emoji, **cada fonte do catálogo**) · J5 planos e assinatura · J6 nomes e durações técnicas do armazenamento · J7 limitação de responsabilidade e CDC · J8 revisão final por advogado · **J9 (novo)** termos das plataformas para importar e compartilhar (Google, Apple, Instagram) · **J10 (novo)** texto de compartilhamento de lembranças e uso de imagem de terceiros.
