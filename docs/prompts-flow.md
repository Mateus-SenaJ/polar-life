# Prompts para o Google Flow (Veo / Imagen) · mídia realista do PolarLife

Decisões: D-140 a D-145. O site já está pronto para receber estes arquivos: enquanto eles não existem, cada lugar mostra a
reserva (poster local, desenho da câmera, fotos CC0). **Você só precisa gerar, baixar e salvar com o nome certo**; conversão,
otimização, poster e recorte de fundo ficam com o orquestrador.

## Como entregar

1. Gere no Flow com o prompt em inglês (a tradução é só para conferência).
2. Baixe na maior qualidade disponível (vídeo: 1080p; imagem: original). Não precisa converter nem cortar.
3. Renomeie exatamente como na tabela e salve na pasta indicada **dentro do worktree** (`.trabalho/midia/`).
4. Avise o orquestrador. Ele roda `npm run midia && npm run sw` e os testes; o site troca as reservas sozinho.

| # | Arquivo (nome exato) | Pasta | O que é | Formato a gerar |
|---|---|---|---|---|
| 1 | `mesa-polaroids.mp4` | `site/assets/video/` | Vídeo 1, horizontal | 16:9 · 1920×1080 · 8 s · sem áudio |
| 2 | `mesa-polaroids-vertical.mp4` | `site/assets/video/` | Vídeo 1, em pé (celular) | 4:5 (ou 9:16 se o Flow não der 4:5) · 1080 px de largura · 8 s |
| 3 | `varal-polaroids.mp4` | `site/assets/video/` | Vídeo 2, varal iluminado | 16:9 · 1920×1080 · 8 s · sem áudio |
| 4 | `camera-perfil.png` | `site/assets/img/fotos/` | Câmera, 3/4 de perfil | 1:1 · ≥ 2048 px · fundo branco puro |
| 5 | `camera-frente.png` | `site/assets/img/fotos/` | Câmera, de frente · **dispensada (D-146)**: o site usa só a `camera-perfil.png` e o vídeo `camera-foto` | 1:1 · ≥ 2048 px · fundo branco puro |
| 6 | `amigos-praia.jpg` | `site/assets/img/fotos/` | Legenda «Praia com a turma · 12/01/2025» | 1:1 · ≥ 1024 px |
| 7 | `amigos-trilha.jpg` | `site/assets/img/fotos/` | «Trilha na serra» | 1:1 · ≥ 1024 px |
| 8 | `casal-cidade.jpg` | `site/assets/img/fotos/` | «Nós dois no Rio · 08/06/2024» | 1:1 · ≥ 1024 px |
| 9 | `casal-por-do-sol.jpg` | `site/assets/img/fotos/` | «Fim de tarde a dois» | 1:1 · ≥ 1024 px |
| 10 | `amigos-viagem.jpg` | `site/assets/img/fotos/` | «Pé na estrada · 03/2025» | 1:1 · ≥ 1024 px |
| 11 | `familia-aniversario.jpg` | `site/assets/img/fotos/` | «Parabéns, vó! · 21/09/2024» | 1:1 · ≥ 1024 px |
| 12 | `casal-cafe.jpg` | `site/assets/img/fotos/` | «Café de domingo» | 1:1 · ≥ 1024 px |
| 13 | `familia-parque.jpg` | `site/assets/img/fotos/` | Foto que sai da câmera no topo | 1:1 · ≥ 1024 px |

Gerados depois pelo orquestrador (não precisa fazer): `*-poster.jpg` de cada vídeo (primeiro quadro), versões `.webm`, câmeras
com fundo transparente e fotos reduzidas. Se o Flow baixar a imagem em PNG e o nome pedir `.jpg` (ou o contrário), salve como
veio, com o nome da tabela e a extensão que veio: o orquestrador converte.

## Regras para todos os prompts

- Nenhuma marca, logotipo, texto, legenda, marca-d'água ou interface legível em nenhum quadro (nada de Fujifilm, Instax, Polaroid, Apple, Samsung).
- Pessoas comuns e diversas, naturais, sem parecer celebridade; nada de rosto em close extremo.
- Luz quente, cores naturais, sem filtro pesado, sem HDR exagerado.
- Vídeos: câmera quase parada, movimento lento, **primeiro e último quadro quase iguais** (o site toca em loop), sem cortes, sem áudio.
- Se o resultado tiver texto ou marca visível, gere de novo ou acrescente o trecho «negative» ao pedido.

Trecho negativo comum (cole no campo de negative prompt, ou no fim do prompt depois de `Avoid:`):

```
text, captions, subtitles, watermark, logo, brand name, Fujifilm, Instax, Polaroid logo, UI overlays, readable phone screen text,
distorted hands, extra fingers, fast motion, camera shake, quick cuts, zoom, lens flare, oversaturated colors, cartoon, illustration
```

## Vídeo 1 · mesa: do celular para as polaroids

Onde aparece: ao lado do título «Algumas memórias merecem sair da tela» (apresentação). No desktop o quadro é 4:3 e some no
branco pela esquerda; no celular é 4:5. **Deixe a ação no centro do quadro e o terço esquerdo calmo** (só a mesa).

**`mesa-polaroids.mp4` (16:9, 8 s)**

```
Photorealistic, cozy, slow cinematic shot, 8 seconds, 16:9, 1080p, 24 fps. Top-down three-quarter view of a warm light-oak wooden
table by a window in late golden-hour afternoon light, soft long shadows, shallow depth of field. A person's hands (only hands and
forearms visible, casual knit sweater sleeves) finish scrolling through a photo gallery on a smartphone, the screen softly glowing
and out of focus with no readable content. The hands calmly lock the phone and place it face down at the edge of the table, then
reach to the center and gently pick up one of several white-bordered instant photos scattered on the table. The instant photos show
friends laughing together, a beach trip, a mountain landscape and a city at sunset. A ceramic cup of coffee and a small plant sit
softly blurred in the background. Camera almost static with a barely perceptible slow push-in. Calm, nostalgic, intimate mood,
natural warm color grading, fine film grain. The first and last frames look nearly identical (hands resting near the photos, phone
face down) so the clip loops seamlessly. Keep the main action in the center of the frame and the left third of the frame calm and
uncluttered (only the wooden table). No text, no logos, no brand names, no captions written on the photos.
Avoid: text, watermark, logo, brand name, readable phone screen, distorted hands, extra fingers, fast motion, camera shake, cuts.
```

Tradução curta: plano lento e aconchegante, mesa de madeira clara ao fim da tarde; as mãos terminam de ver fotos no celular
(tela desfocada, sem nada legível), bloqueiam e deixam o celular virado para baixo, e pegam uma das polaroids espalhadas (amigos,
praia, montanha, cidade ao pôr do sol). Câmera quase parada; início e fim parecidos; ação no centro, terço esquerdo calmo; sem
texto nem marcas.

**`mesa-polaroids-vertical.mp4` (4:5, 8 s)**: mesmo prompt, trocando a primeira linha por:

```
Photorealistic, cozy, slow cinematic shot, 8 seconds, vertical 4:5 aspect ratio, 1080 px wide, 24 fps. Same scene framed vertically:
the instant photos in the lower two thirds, the phone placed face down near the top edge, the top 15% and bottom 15% of the frame
calm and uncluttered (only the wooden table).
```

Tradução curta: a mesma cena em pé; polaroids nos dois terços de baixo, celular perto da borda de cima, faixas de cima e de baixo calmas.
Dica: se o Flow permitir, use o primeiro quadro do vídeo horizontal como imagem de referência para manter a mesma mesa e a mesma luz.

**`mesa-polaroids-vertical.mp4` · versão 2 (D-207)**: o vídeo atual mostra só a mão segurando o celular; o dono quer ver também
a pessoa pegando uma polaroid. Use este roteiro e salve com o mesmo nome (o site já faz o movimento de câmera do celular até a polaroid):

```
Photorealistic, cozy, slow cinematic shot, 8 seconds, vertical 4:5, 1080 px wide, 24 fps. Warm light-oak table by a window in
golden-hour light, shallow depth of field. A woman's hands (knit sweater sleeves) scroll photos on a smartphone for two seconds,
lock it and set it face down near the top edge, then pick up one white-bordered instant photo from the scattered pile in the
lower half and lift it toward the camera, holding it fully inside the frame (all four borders visible) while the camera slowly
pushes in and focuses on the photo, which shows friends laughing at the beach. Keep the held photo and both hands entirely inside
the central 70% of the frame at all times. First and last frames nearly identical for a seamless loop. No text, no logos.
```

Tradução curta: as mãos mexem no celular, deixam o celular virado e pegam uma polaroid, que fica inteira no quadro, com a câmera
aproximando devagar; tudo no centro do quadro; começo e fim iguais.

## Vídeo 2 · varal iluminado com polaroids

Onde aparece: tela de entrar, abaixo da faixa preta «Não deixe para depois». O quadro é 16:10 no celular e mais alto no desktop
(corte central): **mantenha o assunto no centro**.

**`varal-polaroids.mp4` (16:9, 8 s)**

```
Photorealistic, cozy, slow cinematic shot, 8 seconds, 16:9, 1080p, 24 fps. A warm off-white bedroom wall at dusk, decorated with
three gently sagging rows of string fairy lights with small warm-white bulbs. Dozens of white-bordered instant photos hang from the
strings with tiny wooden clothespins. The photos show groups of friends hugging and laughing, road trips, beach days, birthday
parties, couples and landscapes. The bulbs glow softly with creamy bokeh and a very subtle flicker; a light breeze makes a few
photos sway slightly. Very slow sideways parallax dolly move from left to right, shallow depth of field, photos in the center in
sharp focus. Warm amber light, deep soft shadows, intimate and nostalgic mood, natural color grading, fine film grain. The first and
last frames look nearly identical so the clip loops seamlessly. Keep the most detailed photos in the center of the frame. No text,
no logos, no brand names, no handwriting on the photos.
Avoid: text, watermark, logo, brand name, handwriting, people in the room, fast motion, camera shake, cuts, zoom, flashing lights.
```

Tradução curta: parede clara ao anoitecer com três fileiras de luzinhas quentes e dezenas de polaroids presas com mini
pregadores (amigos, viagens, praia, aniversários, casais, paisagens); luzes com brilho suave, leve brisa; parallax lateral bem
lento; início e fim parecidos; assunto no centro; sem texto nem marcas.

## Câmera instantânea realista, sem marca

Onde aparece: topo da apresentação, mesa de polaroids, banner da faixa preta e passo 1 do «Como funciona» (no lugar do desenho).
Referência: câmera instantânea retrô marrom e prata com a foto saindo pela lateral. **Genérica**: nenhum nome, logotipo ou
inscrição no corpo, na lente ou na alça.

**`camera-perfil.png` (3/4 de perfil)**

```
Photorealistic studio product photograph, 1:1, high resolution. A generic retro instant film camera, unbranded, seen in three-quarter
profile view turned about 35 degrees to the right. Body wrapped in warm brown textured leatherette with brushed silver metal top
and bottom plates, a large round lens with a silver ring, a small rectangular flash and viewfinder window on the front, an orange
shutter button on top. A blank white-bordered instant photo is halfway out of a slot on the side of the camera, its picture area
still a soft undeveloped grey-beige. Pure white seamless background (#FFFFFF), soft even studio lighting, a faint soft contact
shadow under the camera, the whole camera and the photo fully inside the frame with generous margins, centered. Absolutely no brand
name, no logo, no letters, no numbers, no engraved text anywhere on the camera, lens or strap lugs.
Avoid: text, letters, numbers, logo, brand name, Fujifilm, Instax, Polaroid, watermark, colored background, props, hands, strap.
```

Tradução curta: foto de estúdio, câmera instantânea retrô genérica em 3/4 de perfil, couro marrom e metal prateado, lente
grande com anel prata, botão laranja, uma foto em branco saindo pela lateral; fundo branco puro, sombra suave, câmera inteira
dentro do quadro com margem; nenhuma marca, letra ou número.

**`camera-frente.png` (frontal)**: mesmo prompt, trocando a segunda frase por:

```
A generic retro instant film camera, unbranded, seen straight from the front at eye level, perfectly centered and symmetrical.
```

Tradução curta: a mesma câmera vista de frente, centralizada. Dica: use a imagem de perfil como referência de estilo para as duas
ficarem iguais. Fundo transparente não é necessário: branco puro basta, o orquestrador recorta.

## Fotos de pessoas para as polaroids (8)

Todas 1:1, estilo foto de celular bem tirada (espontânea, luz natural), assunto centralizado com folga nas bordas (a polaroid
corta em quadrado). Comece cada prompt com o prefixo comum e termine com o sufixo comum.

Prefixo comum:

```
Candid, natural smartphone-style photograph, square 1:1, realistic skin tones, soft natural light, slight film warmth, subject
centered with some space around it.
```

Sufixo comum:

```
Ordinary everyday people, diverse, not resembling any celebrity, genuine relaxed expressions. No text, no logos, no brand names
on clothing or objects, no watermark. Avoid: text, logo, watermark, distorted faces, extra fingers, studio look, heavy filter.
```

| Arquivo | Prompt (miolo, em inglês) | Tradução curta |
|---|---|---|
| `amigos-praia.jpg` | `Five friends in their twenties of different ethnicities laughing with arms around each other on a sunny Brazilian beach in summer, turquoise sea and a few palm trees behind them, wet hair, casual swimwear and light shirts.` | Cinco amigos rindo abraçados numa praia ensolarada. |
| `amigos-trilha.jpg` | `Three friends with small backpacks resting on a rock at a mountain viewpoint, green valleys and misty hills behind them, early morning light, one of them pointing at the view.` | Três amigos num mirante de serra, de manhã cedo. |
| `casal-cidade.jpg` | `A young couple taking a selfie-style photo at a lookout over a coastal city with a bay, hills and boats at sunset, wind in their hair, warm orange sky.` | Casal num mirante de cidade litorânea ao pôr do sol. |
| `casal-por-do-sol.jpg` | `A couple seen from behind sitting close together on a lakeside wooden pier, watching an orange and pink sunset reflected on the calm water, silhouettes softly lit.` | Casal de costas num píer vendo o pôr do sol. |
| `amigos-viagem.jpg` | `Four friends on a road trip standing beside a parked car on an empty countryside road, open fields and big clouds, one sitting on the car hood, everyone laughing, travel bags visible.` | Quatro amigos numa parada de viagem de carro, estrada vazia. |
| `familia-aniversario.jpg` | `A family gathered around a homemade birthday cake with lit candles at a dining table, a smiling grandmother in the center about to blow the candles, children and adults clapping, warm indoor evening light.` | Família em volta do bolo, avó no centro prestes a soprar as velas. |
| `casal-cafe.jpg` | `A couple in their thirties having coffee at a small cafe table by a window on a lazy Sunday morning, two ceramic cups, both smiling at each other, soft window light.` | Casal tomando café numa manhã de domingo, perto da janela. |
| `familia-parque.jpg` | `Parents and two young children having a picnic on a blanket in a green city park, the father lifting the smallest child in the air, trees and dappled sunlight in the background.` | Pais e dois filhos num piquenique no parque. |

## Conferência antes de salvar

- Há alguma letra, número ou marca visível? Se sim, gere de novo.
- Vídeo: o começo e o fim são parecidos? A câmera está quase parada? Dura cerca de 8 s?
- Câmera: está inteira no quadro, com fundo branco e sem nada escrito?
- Fotos: as pessoas estão no centro, com folga nas bordas?
- O nome do arquivo e a pasta batem com a tabela do início?
