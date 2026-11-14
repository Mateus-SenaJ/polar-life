---
id: DOC-00
titulo: PolarLife · Índice, protocolo de leitura e glossário
edicao: 2
data: 2026-11-07
status: vigente
substitui: [Guia_Mestre_v1_2, Patches_Guia_v1_5_Fluxos, Auditoria_e_Patches_Guia_v1_3, Revisao_de_Fluxos_e_Resolucoes_v1, Planos_e_Pagamentos_v1, Log_de_Decisoes_e_Benchmark, Legal_LGPD_Termos_Cookies_v1]
publico: [IA de design, IA de código, humanos]
---

# PolarLife · Edição 2 da documentação

> **TL;DR para IA.** PolarLife é um editor web, local-first, para criar polaroids, imprimi-las em folhas e compartilhá-las como colagens e lembranças. As fotos **nunca** saem do aparelho. O visual é um «estúdio fotográfico tátil branco» com 4 cores e tipografia **leve e elegante**. Fontes expressivas só aparecem nas 5 zonas de exceção (DOC-02). Leia o que é **FIXO**, explore o que é **GUIADO**, crie livremente no que é **LIVRE**.

## 1. Mapa dos documentos

| Doc | Arquivo | Responde a… | Quando ler |
| --- | --- | --- | --- |
| 00 | `00_INDEX.md` | Onde está cada coisa, como ler, glossário | Sempre primeiro |
| 01 | `01_DESIGN_SISTEMA.md` | Cores, LED, sombras, layout, componentes | Qualquer tela |
| 02 | `02_TIPOGRAFIA.md` | Quais fontes, onde, com que peso | Qualquer texto |
| 03 | `03_REGRAS_DE_NEGOCIO.md` | Planos, limites, qualidade, privacidade, assinatura | Decisões de produto |
| 04 | `04_FLUXOS_E_TELAS.md` | Jornadas, inventário de telas e estados | Desenhar ou testar fluxos |
| 05 | `05_FUNCIONALIDADES_EDITOR.md` | Filtros, ajustes, recortes, medidas, legendas, posição, metadados | Telas do editor |
| 06 | `06_COLAGENS_E_LEMBRANCAS.md` | Colagens, sugestões, lembranças, compartilhamento | Modo Colagem e Lembranças |
| 07 | `07_CONEXOES_E_INTEGRACOES.md` | Google Fotos, Apple, Instagram, verificação de conexão | Importar e compartilhar |
| 08 | `08_MOTOR_E_DADOS.md` | Paginação, contratos de dados, PDF, pré-voo, stack | Implementação |
| 09 | `09_LEGAL_PRIVACIDADE.md` | Privacidade, termos, cookies (texto-base) | Páginas legais |
| 10 | `10_LOG_DECISOES.md` | Decisões, conflitos resolvidos, pendências | Auditar ou contestar |
| 15 | `15_DADOS_E_POSTGRESQL.md` | Dados no servidor: inventário, LGPD, segurança, esquema do banco e mapa para a API | Quando houver servidor ou dado novo |
| 16 | `16_NOTIFICACOES.md` | Notificações (lembranças com colagem, prazos, campanhas do admin), cupons e códigos em Folhas e planos | Ao mexer em avisos, cupons ou no envio por push |

**Referências visuais canônicas (HTML):** `polar_life_biblioteca_can_nica_de_componentes_do_editor_e1_definitivo.html` (componentes) e `polar_life_inspetor_legendas_fotogr_ficas_e4b.html` (layout do editor). Em conflito de **layout**, o HTML vence. Em conflito de **tipografia**, o DOC-02 vence (os HTMLs ainda usam Inter 700; veja DOC-01 §9).

## 2. Hierarquia de autoridade

1. **DOC-01 e DOC-02** (aparência) · e os dois HTMLs (layout)
2. **DOC-03** (regras de negócio)
3. **DOC-05, 06, 07** (funcionalidades)
4. **DOC-04** (fluxos) · **DOC-08** (motor)
5. **DOC-09** (legal) · **DOC-10** (histórico, nunca prevalece sobre os anteriores)

Se dois documentos discordam, vale o de número de hierarquia menor e abre-se um item no DOC-10.

## 3. Protocolo de leitura para IA (obrigatório)

1. Leia o **TL;DR** e as seções **FIXO** do documento. São contrato: não altere, não «melhore».
2. Em **GUIADO**, decida dentro dos limites declarados e cite o ID da regra que sustenta a decisão.
3. Em **LIVRE**, crie. A ausência de regra é liberdade, não lacuna a ser preenchida com invenção.
4. **Não invente** o que está marcado `[PENDENTE]` (ex.: os 25 modelos do Roteiro v4, telas S0–S31). Sinalize e siga.
5. Use os **dados de exemplo** do DOC-04 §6 em todas as telas.
6. Ao entregar, rode o **Checklist Anti-Desvio** (DOC-11 §4) e liste só as violações.
7. Cada regra tem ID estável (`DS-`, `TP-`, `BR-`, `FL-`, `FN-`, `CL-`, `CN-`, `MT-`, `LG-`). Cite o ID em vez de copiar o texto.

**Marcadores:** `[PENDENTE]` falta insumo do dono · `[VALIDAR]` fato ou teste a confirmar · `[HIPÓTESE]` valor escolhido sem pesquisa · `[RECOMENDADO]` decisão do analista, vigente até veto do dono.

## 4. Glossário (termos fixos; não usar sinônimos na interface)

| Termo | Significa | Não confundir com |
| --- | --- | --- |
| **Polaroid** | Foto + moldura branca + legenda, como objeto | Folha |
| **Folha** | Uma página de saída (papel) com 1 ou mais polaroids | Colagem |
| **Modo Folhas** | Organiza polaroids no papel para imprimir | |
| **Modo Quadro** | Edita uma polaroid por vez | |
| **Modo Colagem** | Compõe várias polaroids num canvas para compartilhar ou arquivar | Modo Folhas |
| **Lembrança** | Imagem pronta para redes, gerada a partir de um projeto | Backup |
| **Recorte** | Enquadrar a **foto** dentro da janela da polaroid | Guia de corte |
| **Guias de corte** | Linhas finas no papel para cortar com tesoura ou guilhotina | Recorte |
| **Contorno** | Linha na borda da polaroid, alternativa às guias | |
| **Escopo** | Quantas fotos uma edição altera (chip sempre visível) | |
| **Pré-voo** | Checagem de qualidade antes de gerar o arquivo | Direito de uso |
| **Direito de uso** | Portão de conta/plano/folhas (2.0) | Pré-voo |
| **Assinatura** | Logo horizontal no canto inferior esquerdo da faixa inferior | Rodapé da folha |
| **Display list** | Lista única de desenho (µm) usada por tela, preview e PDF | |
| **Conexão** | Caminho de entrada ou saída de fotos com um serviço externo | |

## 5. Versões do produto (fatiamento)

| Versão | Entra |
| --- | --- |
| **1.0** | Importação local (+HEIC), Modo Folhas e Quadro, cálculo reativo, guias/contorno, legendas com catálogo de fontes, recorte, ajustes, 12 filtros, lote, pré-voo, PDF, impressão direta, calibração, PNG/JPEG avulso, backup, **Central de conexões (estado «Em breve»)**, páginas legais |
| **1.1** | **Modo Colagem com sugestões e Lembranças [RECOMENDADO]**, Web Share, perfil «Gráfica», calibração de tela, modelos [PENDENTE], galeria pública |
| **2.0** | Google Fotos (Picker), Entrar com Apple/Google, conta e planos, adesivos e colagem livre avançada, ajuste automático de recorte, TIFF 8 bits |
| **3.0** | Drive, Dropbox, OneDrive (ordem por pesquisa) |

## 6. Como esta edição foi feita

Consolidou 9 arquivos (7 `.md` e 2 `.html`) em 12. Aplicou os patches 1.3, 1.4 e 1.5 sobre o Guia 1.2; resolveu 21 atritos novos (DOC-10 §3); moveu o detalhe de backend de pagamentos para fora (DOC-03 §8) e deixou só o que muda a tela ou a regra de produto.
