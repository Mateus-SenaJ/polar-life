---
id: DOC-08
titulo: PolarLife · Motor, contratos de dados e saídas
edicao: 2
data: 2026-11-07
status: vigente
depende_de: [DOC-03, DOC-05, DOC-06, DOC-07]
publico: IA de código e desenvolvedores
---

# Motor, contratos e saídas

> **TL;DR para IA de código.** Tudo roda no aparelho. Uma **display list em µm inteiros** alimenta tela, preview e PDF. Originais nunca mudam. O motor de paginação é determinístico e testável com 6 números. Este documento é o contrato técnico; a aparência é do DOC-01/02.

## 1. FIXO

| ID | Regra |
| --- | --- |
| MT-01 | Unidade interna: **µm inteiros** (1 mm = 1000 µm). Arredonda só na saída visual |
| MT-02 | **Fonte única:** preview, tela e PDF usam a mesma display list. Tolerância: geometria 0,01 mm; texto ±0,2 mm com folga de 3% na área segura |
| MT-03 | Trabalho pesado em **Web Workers** (Comlink, `OffscreenCanvas`), com fila e `AbortController` |
| MT-04 | Invariante `cutGuides && outline = falso`; viola ⇒ `InvariantError` bloqueia preview e export |
| MT-05 | Falha de uma foto isola a foto (`status: 'failed'`), nunca derruba o lote |
| MT-06 | Saída **sem** EXIF/GPS/XMP/IPTC; hora do EXIF é local, sem fuso |
| MT-07 | Fontes embutidas em subconjunto no PDF; fonte sem licença de embutir ⇒ fallback + «Pede confirmação» |

## 2. Contratos de dados (TypeScript)

```ts
type Unit = 'mm' | 'cm' | 'in';
type FontId = string;               // id do catálogo (DOC-02 §4), ex.: 'caveat', 'special-elite'

interface Project {
  id: string; name: string; schemaVersion: number;
  sheet: SheetConfig; frame: FrameFormat; photos: Photo[];
  cutGuides: boolean; outline: boolean;      // nunca ambos true (MT-04)
  groupByOrientation: boolean;               // padrão true
  signature: boolean;                        // padrão true
  outputProfile: 'casa' | 'grafica';         // 'grafica' só na 1.1
  batchStyle: PhotoStyle; defaults: UserPrefs;
  collages?: Collage[]; keepsakes?: Keepsake[];       // 1.1
}

interface SheetConfig {
  paper: 'A3'|'A4'|'A5'|'13x18'|'10x15'|{ w_mm: number; h_mm: number };
  orientation: 'portrait'|'landscape';
  margin_mm: number; gap_mm: number;                  // padrões 10 e 4
  allowRotateFrames: boolean; alignment: 'center'|'top-left';
  footer: boolean; guideLength: 'continuous'|'cornerMarks';
  guideColor: '#000000'|'#006194'|'#FD761A';
}

interface FrameFormat {            // dado versionado; moldura SEMPRE #FFFFFF
  id: string; name: string; outer_mm: [number, number]; window_mm: [number, number];
  windowOffset_mm: { top: number; left: number };
  orientation: 'portrait'|'landscape';
  captionBands: { above: boolean; below: boolean }; corner_mm: number;   // 0–6
}

interface Photo {
  id: string; fileRef: string; width: number; height: number;
  exifOrientation: 1|2|3|4|5|6|7|8; capturedAt?: string;                 // ISO 8601 local
  gps?: { lat: number; lon: number };                                    // só em memória
  source: 'device'|'camera'|'google'|'zip'|'drive'|'dropbox'|'onedrive'; // origem (selo)
  frameOrientationOverride?: 'portrait'|'landscape';
  fit: 'fill'|'contain'; zoom: number; pan: { x: number; y: number };
  rotate: 0|90|180|270; straighten_deg: number;                          // −15..+15
  mirror: boolean; adjust: Adjust; filter: { id: string; intensity: number };
  caption: Caption; hasIndividualOverride: boolean; status: 'ok'|'failed';
}

interface Adjust { brightness: number; contrast: number; saturation: number; temperature: number;
                   highlights: number; shadows: number; sharpen: number; vignette: number; }  // ver faixas no DOC-05 FN-05

interface Caption {
  text?:  { value: string; max: 80; style: TextStyle };
  date?:  { source: 'exif'|'manual'|'file'|'none'; value?: string; format: DateFormatId; style: TextStyle };
  place?: { source: 'auto'|'manual'|'none'; city?: string; uf?: string; country?: string; format: PlaceFormat; style: TextStyle };
  layout: 'above'|'below'|'both';
}

interface TextStyle {
  family: FontId; size_pt: number; weight: number; italic: boolean;
  case: 'normal'|'upper'|'capitalize'; tracking_em: number;
  align: 'left'|'center'|'right';
  color: '#000000'|'#006194'|'#FD761A';
  offset_mm: { x: number; y: number };         // −5..+5
  rotate_deg: number;                          // −5..+5
}

// 1.1
interface Collage {
  id: string; layoutId: string; canvas: 'story'|'portrait'|'square'|'landscape'|'card10x15'|'card13x18';
  background: '#FFFFFF'|'#F8F9FA'|'#000000'|'#006194'|'#FD761A'|'led-soft';
  items: { photoId: string; x_um: number; y_um: number; rotate_deg: number; scale: number; z: number; locked: boolean }[];
  designPhrase?: { text: string; fontId: FontId };   // zona EXC-3
  signature: boolean;
}
interface Keepsake { id: string; kind: 'day'|'trip'|'thisDay'|'beforeAfter'|'card'; collageId: string;
                     format: Collage['canvas']; postText?: string; }

// 1.0 (estado), 2.0 (ativação)
interface Connection {
  id: 'device'|'camera'|'applePhotos'|'google'|'instagram'|'facebook'|'drive'|'dropbox'|'onedrive'|'share';
  state: 'available'|'connected'|'checking'|'needsReauth'|'comingSoon'|'platformBlocked'|'tempError';
  lastCheck?: { at: string; summary: 'ok'|'attention'|'fail'|'unavailable'; lines: CheckLine[] };
}
interface CheckLine { label: string; state: 'ok'|'attention'|'fail'|'unavailable'; detail?: string; action?: string; }
```

**Contrato novo de direito de uso (2.0)** fica no documento do backend: `{ plano, creditosPadrao, creditosGrande, folhasGratisUsadasNoMes, expiraEm?, assinaturaPodeDesligar }`. Não faz parte do projeto salvo.

## 3. Paginação

```
paginate(sheet, frame, photos):
  validas = photos onde status == 'ok'
  grupos = groupByOrientation ? [verticais, horizontais] (ordem preservada) : [todas]
  para cada grupo g com n = |g| > 0:
    W,H = papel considerando orientação; area_w = W-2*margin; area_h = H-2*margin
    para giro em {0°, 90° se allowRotateFrames}:
      fw,fh = frame.outer (trocados se giro 90° ou polaroid do grupo for 'landscape')
      cols = floor((area_w+gap)/(fw+gap)); rows = floor((area_h+gap)/(fh+gap))
      porFolha[giro] = cols*rows
    giro = maior porFolha (empate: sem giro)
    se porFolha == 0 → ERRO «A polaroid não cabe neste papel» + sugestão
    folhas(g) = ceil(n/porFolha)        // nunca existe folha vazia
    origem = alignment == 'center' ? centralizar bloco : topo-esquerda
    células sem foto NÃO imprimem
  total = soma das folhas
```

**Testes de aceitação** (margem 10, espaço 4): A4 + 88×107 = **4** · A3 = **9** · A5 = **2** (girado) · 13×18 = **1** · Mini 60×73 em A4 = **9** · em A3 = **20**.

**Reatividade:** gatilhos = adicionar, remover, duplicar, reordenar foto; trocar papel, orientação, formato, margem, espaço, giro, agrupamento, unidade; foto marcada como falha. Debounce 80 ms em numéricos. Remover a última foto de uma folha elimina a folha; se a atual some, foco vai à anterior. Rodapé de status: «A4 retrato · 4 clássicas por folha · 6 folhas no total».

## 4. Guias, contorno, assinatura

- **Guia:** 100 µm contínua, 50 µm para fora da aresta; «Linha contínua» até a borda da folha (só margens e vãos, nunca o interior); «Marcas de canto» 5 mm para fora. Folha parcial: só onde há polaroid.
- **Contorno:** 0,25 pt (0,1–1 pt) dentro da aresta.
- **Assinatura:** retângulo reservado na display list; a área segura da legenda o desconta; legenda invadindo ⇒ pré-voo Bloqueia.
- **Legenda inclinada:** a caixa **rotacionada** entra no teste da área segura.

## 5. Pipeline de leitura (por foto, em worker)

1. Validar pela assinatura do arquivo (JPEG, PNG, WebP, HEIC/HEIF; TIFF opcional); limite de 100 MP.
2. Ler EXIF (`exifr`) **antes** de converter HEIC.
3. Converter HEIC para JPEG no aparelho (nativo no Safari, WASM nos demais); selo «Convertida».
4. Normalizar orientação.
5. Miniatura 512 px e proxy 2048 px; original só na exportação.
6. Detectar duplicatas (hash perceptual + tamanho/data).
7. Calcular PPI efetivo depois de recorte e zoom.
8. Descartar metadados na saída.
Falha em um arquivo não derruba os demais.

## 6. Geração e saídas

```
gerarPDF(projeto, opções):
  controle = AbortController()
  preVoo → se há BLOQUEIA, parar ; assertInvariante() ; folhas = paginate(...)
  volumes = dividir(folhas, limite = celular ? 60 MB : 150 MB) ; falhas = []
  para cada volume, para cada folha, para cada polaroid (uma por vez; ≤ 2 imagens em resolução total no iOS):
     se abortado → descartar parcial e encerrar
     tentar decodificar (em blocos se > 16 MP); com filtro/ajuste: renderizar ≥ 300 PPI; senão embutir JPEG original por matriz
     capturar erro: marcar 'failed' e seguir
     desenhar guias OU contorno, assinatura, textos
  se há falhas → diálogo «N fotos não puderam ser lidas»: Tentar de novo · Trocar foto · Gerar sem elas (repagina e reinicia) · Cancelar
  concluir → tela de sucesso
```

| Saída | Especificação | Versão |
| --- | --- | --- |
| **PDF alta qualidade** | Vetorial, página no tamanho exato; texto em vetor com fontes em subconjunto; JPEG original sem recompressão enquanto PPI ≤ 600 (acima, reamostra a 600); sRGB; guias em vetor 0,1 mm; assinatura incluída; sem metadados; `/ViewerPreferences /PrintScaling /None` (**dica**, não garantia; aviso «Tamanho real (100%)» continua obrigatório) | 1.0 |
| **PDF leve** | Reamostrado, nunca abaixo de 300 PPI efetivo; rótulo «recomprimido» | 1.0 |
| **Volumes** | Até 150 MB (desktop) ou 60 MB (celular) | 1.0 |
| **Impressão direta** | PDF em iframe oculto + `window.print()` por clique; só desktop; dicas antes da caixa | 1.0 |
| **PNG/JPEG da polaroid** | 300 PPI do tamanho externo (88×107 mm ≈ 1039×1264 px), opção 600 | 1.0 |
| **PNG/JPEG da folha** | 300 ou 600 PPI, DPI correto | 1.0 |
| **ZIP** | Folhas ou polaroids, nomes neutros | 1.0 |
| **`.polarlife`** | Projeto completo com checksum (Zod) | 1.0 |
| **Lembrança / Colagem** | Formatos do DOC-06 §3, PNG ou JPEG, sem metadados | 1.1 |
| **Perfil «Gráfica»** | Marcas de canto, sem rodapé, nome neutro, sem sangria | 1.1 |
| **TIFF 8 bits** | sRGB | 2.0 |

**Impressão e calibração:** `calibrarImpressora`: gera régua de 100 mm com PrintScaling None; usuário mede X e Y; `fx = 100/X`, `fy = 100/Y`; salva perfil por impressora e papel («Calibrado em DD/MM/AAAA»); o PDF aplica a escala, o preview mostra sempre medidas nominais. Calibração de tela (1.1): igualar um cartão de 85,6 mm → `pxPorMm`.

## 7. Arquitetura (sem servidor de dados na 1.x)

| Camada | Escolha |
| --- | --- |
| Site público | Astro (estático), HTML completo sem depender de JS |
| App | React + Vite + TypeScript em `/app`, `noindex` |
| Estado e desfazer | Store único com patches (Immer) |
| Armazenamento | IndexedDB (Dexie) + `storage.persist()`; alerta em 80% de `storage.estimate()` |
| Fontes e ícones | **Autohospedados** (TP-06, DS-14); sem Tailwind CDN em produção |
| EXIF / HEIC | `exifr` / nativo no Safari, WASM sob demanda |
| PDF | pdf-lib + fontkit |
| Testes | Vitest (cálculo), Playwright (fluxos), comparação PDF × display list, teste do invariante, teste de acentuação das fontes |
| Hospedagem | CDN estático, CSP estrita, service worker só em `/app` |

**Orçamentos (metas, não medições):** 24 fotos de 12 MP: miniaturas em < 3 s num Android intermediário; recalcular folhas < 5 ms; 24 fotos/6 folhas A4 em < 20 s no desktop e < 60 s no celular intermediário; pico < 400 MB no celular; 2 workers no celular, `min(4, núcleos−1)` no desktop; listas virtualizadas acima de 60 fotos.

## 8. Riscos abertos

pdf-lib em celular fraco com 100 fotos (prova técnica em 1 iPhone e 1 Android básico) · visualizadores que ignoram «sem escala» · verificação do app Google · base de cidades offline · margem não imprimível de impressoras reais · legibilidade da assinatura em formatos pequenos · peso total do catálogo de fontes (carregar sob demanda) · Safari/iOS limpando IndexedDB (`persist()`, backup lembrado, «Adicione à Tela de Início») · Web Share sem suporte (detecção de recurso).

## 9. GUIADO e LIVRE

- **GUIADO:** escolha de bibliotecas equivalentes desde que respeitem MT-01 a MT-07.
- **LIVRE:** organização de módulos e pastas, estratégia de cache, estratégia de testes além da lista.
