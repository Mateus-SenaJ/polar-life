# DOC-16 · Notificações, cupons e códigos na página de planos (D-208)

As notificações do PolarLife lembram a pessoa das próprias fotos, avisam prazos e contam novidades, sem atrapalhar.
Hoje tudo roda no aparelho (local-first, T5): os avisos automáticos são gerados no navegador e as campanhas do admin
valem no navegador onde foram lançadas («Demonstração · sem servidor», T7). O banco (`db/migracoes/0009_avisos_cupons.sql`)
e o service worker já estão prontos para o envio real.

## 1. Tipos

| Tipo | De onde vem | Exemplo | Imagem |
| --- | --- | --- | --- |
| Lembrança | Fotos dos projetos da conta, no aparelho | «Há 1 ano: 6 fotos de 13 de novembro» | Colagem das fotos da pessoa |
| Sugestão | Fotos da conta (mês cheio, fim de ano) | «Você tem 24 fotos de outubro» | Colagem das fotos da pessoa |
| Prazo | Códigos de impressão com saldo e validade; plano perto de renovar | «Seu código vence em 3 dias» | — |
| Promoção, anúncio, aviso do sistema | Campanha lançada pelo admin | «Folhas em dobro no fim de semana» | — |

Os textos automáticos são modelos com variáveis (`{anos}`, `{fotos}`, `{data}`, `{mes}`, `{dias}`, `{codigo}`, `{folhas}`)
que o admin edita no painel; cada tipo automático pode ser pausado.

## 2. Discrição

- Nada abre sozinho nem pisca. O sino do cabeçalho mostra um ponto parado (não é LED, T8) e o painel abre por toque.
- No máximo 1 lembrança por dia e 1 sugestão por semana. Um prazo novo substitui o anterior do mesmo código.
- A notificação do aparelho é opcional: só pede permissão por um toque em Conta › Notificações, nunca ao abrir o app.
  É sem som (`silent`), uma por tipo (`tag`), no máximo 1 por dia e nunca no horário silencioso (padrão 22h–8h).
- Cada tipo liga e desliga na Conta. «Lembrar amanhã» e «Dispensar» em todo aviso.

## 3. Privacidade

- A colagem é desenhada no aparelho (canvas) com as fotos que já estão nele (`PLAVISOSARTE`). Nenhuma foto, miniatura,
  legenda ou data de foto sai do aparelho; o banco não tem coluna para isso (conferido pelo teste do banco).
- Com servidor, ele manda só o gatilho («há lembrança hoje»); o service worker monta a colagem a partir do IndexedDB
  quando o navegador deixa (OffscreenCanvas) e, senão, mostra só o texto.
- Ao sair da conta, a agenda local de avisos do aparelho é apagada.

## 4. Onde fica cada coisa

| Parte | Arquivo |
| --- | --- |
| Núcleo (modelo, caixa por conta, preferências, geradores, campanhas, modelos) | `site/assets/js/nucleo/avisos.js` (`PLAVISOS`) |
| Colagem do aviso (miniatura quadrada e imagem 2:1 para a notificação) | `site/assets/js/nucleo/avisos-arte.js` (`PLAVISOSARTE`) |
| Sino e painel | `site/assets/js/ui/avisos-painel.js`, `site/assets/css/ui/avisos.css` |
| Conta › Notificações | `site/assets/js/pages/conta.js` |
| Admin › Notificações e Cupons | `site/assets/js/pages/admin.js` |
| Service worker: `notificationclick`, `push`, `periodicsync` | `site/app/sw.js` |
| Banco | `avisos.campanhas`, `modelos`, `preferencias`, `inscricoes_push`, `entregas`, `resumo_campanhas` |

## 5. Fluxo do admin

Criar campanha (tipo, título até 60, texto até 160, botão para uma tela do app, público, início e fim, onde aparece) →
prévia no painel e na notificação → salvar rascunho, agendar ou lançar → pausar, retomar, encerrar, duplicar ou excluir.
Públicos: todas as contas, Grátis, Folha avulsa, assinantes do Pro, quem tem código perto de vencer (este último é
conferido no aparelho, que conhece a validade). «Exportar JSON» entrega o feed no formato que o servidor vai usar.
No banco, a máquina de estados fica em `avisos.mudar_campanha` e os contadores (entregues, abertas, dispensadas) em
`avisos.resumo_campanhas`, sem dado pessoal.

## 6. Cupons e códigos em Folhas e planos

- **Código de folhas avulsas**: o mesmo resgate da Conta (`PLCONTA.resgatarCodigo` → `comercial.resgatar_codigo`).
- **Cupom promocional**: o admin cria (porcentagem ou valor fixo, produtos, validade, limite de usos, uma vez por conta);
  só o hash fica guardado (no banco, `comercial.cupons.codigo_hmac`, oculto na trilha de auditoria). A página mostra o
  preço antes e depois; o cupom só conta o uso com o pagamento aprovado e entra no recibo.
- Erros: não encontrado (`PL007`); vencido, esgotado, pausado, revogado ou já usado (`PL008`); não vale para o produto (`PL009`).

## 7. O que falta para o envio real

1. Chaves VAPID (pública no app, privada no cofre de segredos) e o envio Web Push no servidor.
2. Ao permitir notificações, o app chama `avisos.inscrever_push`; ao bloquear ou sair, `avisos.cancelar_push`.
3. Job diário (papel `pl_manutencao`): para cada conta com o canal «também no aparelho», fora do horário silencioso,
   manda o gatilho e grava em `avisos.entregas` (idempotente pela chave); remove inscrições que o push recusar (410).
4. As campanhas passam a vir de `avisos.caixa(usuario)`; abrir e dispensar viram `avisos.marcar`.
5. Cupons: `comercial.conferir_cupom` na tela e `comercial.usar_cupom` na criação do checkout.
