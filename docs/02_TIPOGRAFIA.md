---
id: DOC-02
titulo: PolarLive · Tipografia (leve e elegante, com 5 zonas de exceção)
edicao: 2
data: 2026-11-07
status: vigente
depende_de: [DOC-01]
---

# Tipografia

> **TL;DR para IA.** Todo o sistema usa fontes **leves e elegantes**: Inter em pesos 300–500, Cormorant Garamond nos títulos editoriais e IBM Plex Mono nas medidas. Fontes expressivas (manuscritas, datilografadas, caligráficas) existem **somente** em 5 zonas. Fora delas, é proibido usá-las. Nenhum peso acima de 500.

## 1. FIXO

| ID | Regra |
| --- | --- |
| TP-01 | **Famílias do sistema (allow-list):** `Inter` (interface e corpo), `Cormorant Garamond` (títulos editoriais), `IBM Plex Mono` (medidas e rótulos técnicos). Mais nenhuma fora das zonas de exceção |
| TP-02 | **Pesos permitidos:** Inter 300, 400, 500 · Cormorant 300, 400, 500 (e itálico) · Plex Mono 300, 400. **Proibido 600 e 700** em qualquer lugar |
| TP-03 | **Zonas de exceção (as únicas com fontes expressivas):** EXC-1 banners · EXC-2 legendas das polaroids · EXC-3 frases de sugestão de design · EXC-4 frase da tela de apresentação · EXC-5 banners da área de login |
| TP-04 | Peso 300 só a partir de **16 px**. Abaixo de 14 px, mínimo 400. Contraste sempre preto sobre branco |
| TP-05 | Fontes expressivas **nunca** em: botões, rótulos, campos, erros, preços, medidas, textos legais, abas, menus |
| TP-06 | Todas as fontes são **hospedadas por nós** (subconjunto latino + pt-BR), `font-display: swap`. Nenhuma chamada a CDN de fontes em produção |
| TP-07 | Medidas e números técnicos: Plex Mono 400, caixa alta, 11 px, `tabular-nums`, espaçamento 0,04 em |
| TP-08 | Cada fonte de legenda tem **fallback** declarado (§4) e é **embutida em subconjunto** no PDF |

## 2. Escala da interface

| Papel | Fonte | Tamanho / peso | Uso |
| --- | --- | --- | --- |
| Display | Cormorant Garamond | 56 (mobile 36) · 300 | Só em páginas públicas e estados vazios |
| Título de página | Cormorant Garamond | 32 (mobile 26) · 400 | Privacidade, Termos, Como funciona |
| Título de pop-up e seção | Inter | 22 · 300 | «Tudo pronto para o papel?» |
| Subtítulo | Inter | 16 · 400 | |
| Corpo | Inter | 14–16 · 400 (300 ≥ 16) | |
| Corpo pequeno | Inter | 13 · 400 | Ajuda abaixo dos campos |
| Rótulo de campo | Inter | 12 · 500 | Persistente, nunca placeholder |
| Botão | Inter | 14 · 500 | |
| Rótulo técnico e abas | Plex Mono | 11 · 400 · caixa alta | PAPEL, FOTOS, medidas |

## 3. As 5 zonas de exceção

| Zona | O que é | Fontes permitidas | Observações |
| --- | --- | --- | --- |
| **EXC-1 Banners** | Faixas promocionais e de contexto em páginas e no app (ex.: banner de lembrança, destaque de plano) | Lista curada de 6 (§5) | Uma fonte expressiva por banner; texto curto (≤ 8 palavras) |
| **EXC-2 Legendas das polaroids** | Texto livre, data e local impressos dentro da moldura | **Catálogo completo (§4)**, várias opções | Escolha por foto, por lote ou por estilo pronto; entra no PDF |
| **EXC-3 Frases de sugestão de design** | Frase curta que acompanha cada sugestão de colagem ou lembrança (DOC-06) | Lista curada de 6 (§5) | Ex.: «Um varal para os dias de sol.» |
| **EXC-4 Frase da tela de apresentação** | Frase principal do hero | Lista curada de 6 (§5) | Pode destacar **uma palavra** em azul `#006194`; o restante em preto |
| **EXC-5 Banners da área de login** | Faixas na tela de entrada (2.0) | Lista curada de 6 (§5) | Mesmas regras de EXC-1; os botões Apple e Google seguem seus ativos oficiais (DOC-07) |

## 4. Catálogo de fontes de legenda (EXC-2)

Todas no Google Fonts, em geral sob licença OFL. `[VALIDAR]` a licença de cada uma antes de embutir; se alguma falhar, sai do catálogo sem afetar as demais. O catálogo é **gratuito para todos os planos** `[RECOMENDADO]` (menos atrito; a diferenciação do Pro está em outros itens, DOC-03).

| Categoria | Fontes | Caráter |
| --- | --- | --- |
| **Manuscrita** | **Caveat** (padrão), Reenie Beanie, Shadows Into Light, Kalam, Patrick Hand, Covered By Your Grace, Nanum Pen Script, Gaegu, Zeyada, Homemade Apple, Over the Rainbow, La Belle Aurore | Afetiva, informal, «caderno» |
| **Caligráfica** | Dancing Script, Satisfy, Sacramento, Allura, Parisienne | Elegante, convites e datas |
| **Datilografada** | Special Elite, Courier Prime, Cutive Mono | Vintage, «etiqueta» |
| **Editorial** | Cormorant Garamond Itálico, Playfair Display Itálico, EB Garamond, Libre Baskerville | Clássica, sóbria |
| **Limpa** | Inter Light (300), Inter Regular | Contemporânea |

**Substitui a Georgia** (que tinha dúvida de licença para embutir no PDF, C12): o papel serifado agora é das Editoriais, todas livres.

**Comportamento do seletor (`FN-07`):**
- Mini-amostra **na própria fonte** com o texto real da legenda («Dia de rolê»).
- Abas por categoria, **busca por nome**, **favoritas** (coração) e **recentes** (últimas 5).
- Carregamento sob demanda: só a fonte escolhida e as visíveis na lista; resto adiado.
- Fonte indisponível (rede, licença): troca automática pelo fallback da categoria com aviso no pré-voo («Pede confirmação»).
- Fallbacks: Manuscrita → Caveat · Caligráfica → Dancing Script · Datilografada → Courier Prime · Editorial → Cormorant Garamond Itálico · Limpa → Inter.

**Acentuação:** toda fonte do catálogo deve renderizar `á ã ç é ê í ó õ ú`; a que falhar no teste automático sai do catálogo (`[VALIDAR]` por fonte).

## 5. Listas curadas (EXC-1, 3, 4, 5)

Seis fontes, escolhidas para combinar com a polaroid e manter elegância: **Caveat**, **Reenie Beanie**, **Shadows Into Light**, **Cormorant Garamond Itálico**, **Sacramento**, **Special Elite**. A IA de design pode escolher entre elas por tela, **uma por composição**.

## 6. GUIADO e LIVRE

- **GUIADO:** tamanho das fontes expressivas em banners (entre 28 e 72 px no desktop; 24–44 no celular), cor do texto expressivo (preto, azul ou laranja), uso de itálico.
- **LIVRE:** o texto das frases, o ritmo entre fonte expressiva e Inter, a ordem dos elementos dentro do banner.

## 7. Aceite

Passa se: nenhum peso > 500; nenhuma fonte fora de TP-01 fora das 5 zonas; `Georgia` ausente; nenhuma chamada a CDN de fontes; legenda impressa usa fonte do catálogo e entra no PDF embutida; peso 300 só em ≥ 16 px.
