---
id: DOC-03
titulo: PolarLife · Regras de negócio
edicao: 2
data: 2026-11-07
status: vigente
depende_de: [DOC-01]
nota: planos e preços são HIPÓTESES; backend de pagamentos fica fora (§8)
---

# Regras de negócio

> **TL;DR para IA.** O produto é gratuito para editar e ver o preview. O que se limita é **exportar folhas** (2.0). As fotos nunca vão ao servidor. Este documento descreve **o que o usuário vê e o que a regra exige**; como cobrar, conciliar e emitir recibo é com o time de backend (§8).

## 1. Princípios inegociáveis (FIXO)

| ID | Regra |
| --- | --- |
| BR-01 | **Local-first em todas as versões.** Fotos, miniaturas, legendas e coordenadas nunca saem do aparelho (F-25). Não há sincronização nem link público de projeto |
| BR-02 | **Originais intactos.** Ajustes e filtros são instruções; só na exportação o quadro é renderizado |
| BR-03 | **O que se vê é o que sai.** Tela, preview e PDF usam a mesma display list (DOC-08) |
| BR-04 | **Moldura sempre branca.** Sem escolha de cor de moldura |
| BR-05 | **Assinatura PolarLife** (logo horizontal, canto inferior esquerdo da faixa inferior) ligada por padrão; desligar é benefício do Pro (2.0) |
| BR-06 | Nada impresso sobre a foto (numeração, código, coordenadas) |
| BR-07 | O arquivo exportado **não leva** EXIF, GPS, XMP nem IPTC |
| BR-08 | Editar e ver o preview **nunca** exigem conta nem pagamento |
| BR-09 | Nada falha em silêncio: nenhuma polaroid em branco impressa; erro por foto, não do lote |
| BR-10 | Exportação **cancelável** a qualquer momento; arquivo parcial nunca é entregue |
| BR-11 | Nomes de arquivo **neutros** (`polarlife-AAAAMMDD-…`), sem nome de foto, pessoa ou lugar |

## 2. Planos (2.0) `[HIPÓTESE]`

| | **Grátis** | **Folha avulsa** | **Pro** |
| --- | --- | --- | --- |
| Preço | R$ 0 | R$ 2,90 (padrão) · R$ 5,50 (grande) | R$ 14,90/mês |
| Editar, preview, calibrar | Ilimitado | Ilimitado | Ilimitado |
| Folhas exportadas | 1 por mês | As compradas | Ilimitadas, uso razoável (100/mês) |
| Fotos por projeto | até 24 | até 24 | até 200 |
| Assinatura PolarLife | Ligada, sem opção | Ligada | Pode desligar |
| Modelos | De fábrica | De fábrica | Extras `[PENDENTE]` |
| Fontes de legenda, filtros, colagens, lembranças | **Todos** | **Todos** | **Todos** |
| Perfil «Gráfica» e TIFF | Todos os planos, consomem folhas | | |

`[RECOMENDADO]` manter fontes, filtros, colagens e lembranças **fora** das travas: são o que faz o usuário voltar e compartilhar (e a lembrança leva a assinatura, que divulga o produto). Na 1.x **não há limite comercial**; teto técnico de 200 fotos por projeto (D-026).

**Classes de folha:** padrão (A5, 10×15, 13×18, A4, personalizado até a área de A4) · grande (A3 e personalizado maior que A4).

## 3. O que é uma «folha» (para limite e compra)

- Uma página de saída, de qualquer papel. A mesma folha (mesmo conteúdo) reexportada em até 24 h conta **uma vez**.
- Página de teste, calibração, falha e cancelamento **não** consomem.
- Polaroids avulsas em imagem (PNG, JPEG, ZIP) contam `ceil(N ÷ 4)` folhas padrão. **Lembranças e colagens compartilhadas em imagem não consomem folha** `[RECOMENDADO]`: o limite protege a impressão, não a rede social.
- Plano grátis: mês-calendário no fuso de Brasília, sem acúmulo; a tela mostra «Renova em 1º de [mês]».

## 4. Portão «Direito de uso» (2.0)

Ordem fixa: **pré-voo → conta → direito → compra → gerar**. Pré-voo trata só de qualidade (§6); conta e folhas ficam no portão.

| Situação | O usuário vê |
| --- | --- |
| Sem conta | Pop-up «Entrar»: código por e-mail, Apple ou Google. E-mail só é pedido ao tocar em «Gerar», depois do preview completo |
| Folha grátis disponível | Segue; mostra «Esta exportação usa sua folha grátis» |
| Faltam folhas | Pop-up «Sua folha grátis foi usada» com **Comprar N folhas** (LED), **Assinar o Pro**, **Voltar** |
| Pagamento pendente (Pix, boleto) | «Aguardando pagamento»; projeto salvo; ao confirmar: «Pagamento confirmado: continuar a exportação» |
| Pagamento recusado | Erro com ✕ e «Tentar de novo» |
| Pro em 80/100 folhas | Aviso em 80; em 100, aviso e análise, sem bloqueio automático `[VALIDAR Termos]` |

Estados sempre em **ícone + texto**, nunca só por cor. Um botão LED por tela na compra. Créditos só após confirmação.

## 5. Conta (2.0): tela «Conta»

Plano e renovação · folhas grátis e créditos · recibos · entrar e sair · **Cancelar assinatura** (2 toques, vale até o fim do período) · **Exportar meus dados** · **Excluir conta** (aviso: créditos se perdem). Cancelar e excluir são secundários, nunca LED.

Arrependimento: reembolso integral em 7 dias corridos da contratação do Pro `[VALIDAR com advogado]`.

**Migração 1.0 → 2.0:** aviso prévio de 30 dias `[HIPÓTESE]`; projetos antigos continuam abrindo; sem Pro e com assinatura desligada, ela volta a ligar na exportação com o aviso «Desligar a assinatura é do Pro»; acima de 24 fotos no grátis: «Escolher quais manter» ou «Assinar o Pro»; rebaixar do Pro segue a mesma regra.

## 6. Qualidade e pré-voo (FIXO)

**BR-12 · PPI efetivo** = (pixels da área recortada ÷ largura da janela em mm) × 25,4, depois de recorte e zoom.

| Selo | PPI | Ação sugerida |
| --- | --- | --- |
| ✓ Boa | ≥ 240 | Pronta |
| ! Abaixo do ideal | 180–239 | Revisar |
| ▲ Com ressalvas | 120–179 | «Reduzir recorte» ou «Trocar foto» |
| ✕ Ruim | < 120 | Sugerir outra foto ou formato menor |

Faixas são do PolarLife; o mercado sustenta só o alvo de ~300 PPI `[VALIDAR com impressões]`.

**BR-13 · Pré-voo classificado**

| Severidade | Itens |
| --- | --- |
| **Bloqueia** | Guias × contorno violado · folha com 0 fotos · polaroid não cabe no papel · legenda fora da área segura (inclui a zona da assinatura) · texto com coordenadas · foto com falha sem decisão |
| **Pede confirmação** (caixa «Revisei e quero continuar») | Foto «Com ressalvas» ou «Ruim» · texto com padrão de arquivo (`IMG_0234`) · data ou local vazio com linha ligada · fonte indisponível · impressora sem calibração · margem menor que a não imprimível |
| **Informa** | Tamanho estimado e volumes · «6 folhas → 5 folhas» · assinatura ligada ou desligada |

## 7. Assinatura (zona reservada)

Logo horizontal, fundo transparente, proporção ≈ 2,9:1, altura = `k × altura da faixa` (`k` `[PENDENTE]` teste de impressão). A área segura da legenda **desconta** a zona. Legenda que invade a zona: pré-voo **Bloqueia**. Desligada, a zona deixa de existir. Aparece em todas as saídas (PDF, PNG, JPEG, Web Share, lembranças e colagens). `[VALIDAR]` legibilidade em Mini 60×73 e Instax Mini 54×86.

## 8. O que o backend decide (fora deste documento)

Provedor de pagamento, métodos, recorrência e renovação, webhooks, idempotência, tentativas e carência de cartão recusado, token de direito de uso e validade offline, antifraude, retenção fiscal, nota fiscal e unificação de contas. **Exigências de produto sobre isso:** (a) créditos só após confirmação; (b) cartão como padrão do Pro e Pix/boleto aceitos; (c) o servidor guarda apenas e-mail, créditos, assinatura e recibos, **nunca** foto; (d) dados de cartão nunca passam por nós; (e) botões Apple e Google usam ativos oficiais (exceção D-044); (f) a limitação do navegador é honesta: o direito de uso é assinado pelo servidor.

**Teste de preço (2.0):** duas variantes por conta, nunca trocar o preço de quem já comprou; mostrar sempre o preço final antes de pagar; métricas só agregadas, sem foto, miniatura ou legenda `[VALIDAR advogado]`.

## 9. GUIADO e LIVRE

- **GUIADO:** textos de planos e compra em português simples, com valores entre colchetes enquanto forem hipótese.
- **LIVRE:** a forma de apresentar vantagens do Pro (sem pressão, sem contagem regressiva).

## 10. Pendências

P1 25 modelos e telas S0–S31 · P2 valor `k` da assinatura · P5 dados jurídicos · P13 provedor de pagamento · P17 variante B do teste de preço · P18 revisão jurídica (Termos, cancelamento, uso razoável) e contador · P19 confirmar hipóteses numéricas (24 h, 30 dias, 100 folhas). Lista completa no DOC-10.
