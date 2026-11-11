#!/usr/bin/env node
/* Mídia realista (openspec «midia-realista-apresentacao-entrar» · D-140 a D-145):
   vídeo decorativo com poster local e reserva na apresentação (ao lado do título, com máscara) e na
   tela de entrar (abaixo da faixa preta); câmera realista e fotos de pessoas entram no lugar das
   reservas quando os arquivos existem; nada é pedido ao servidor antes disso; movimento reduzido e
   economia de dados ficam só com o poster; o quadro não muda de tamanho; legendas e datas manuscritas.
   A parte A confere os arquivos reais já entregues (vídeos da mesa, do varal e da câmera; câmera de perfil): vídeo
   com fonte WebM → MP4 e poster definitivo, câmera PNG visível com o desenho escondido, movimento reduzido só com
   o poster (D-146). A parte B simula a chegada dos que faltam (lista + respostas interceptadas), sem gravar nada no site.
   Uso: node tests/e2e/testar-midia.mjs  (Chromium do Playwright) */
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir, SITE } from '../helpers/servidor.mjs';
import { ESPERADOS } from '../../tools/gerar-midia.mjs';

const falhas = [], ok = m => console.log('  ✔ ' + m), ruim = m => { falhas.push(m); console.log('  ✘ ' + m); };
const saida = fileURLToPath(new URL('../saida/midia/', import.meta.url));
await mkdir(saida, { recursive: true });

const srv = await servir();
const nav = await chromium.launch();
const vigiar = p => {
  const v = { erros: [], pedidos: [], ruins: [], fora: [] };
  p.on('pageerror', e => v.erros.push('erro: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') v.erros.push('console: ' + m.text().slice(0, 160)); });
  p.on('request', r => { v.pedidos.push(r.url()); if (!r.url().startsWith(srv.url)) v.fora.push(r.url()); });
  p.on('response', r => { if (r.status() >= 400) v.ruins.push(r.status() + ' ' + r.url()); });
  return v;
};
const TELAS = [
  { rota: '', nome: 'apresentacao', video: 'mesa-polaroids' },
  { rota: 'app/entrar/', nome: 'entrar', video: 'varal-polaroids' }
];
const quadro = p => p.evaluate(() => {
  const cx = document.querySelector('[data-midia]'), v = cx.querySelector('video'), b = cx.getBoundingClientRect(), r = cx.querySelector('.midia__reserva');
  return {
    x: Math.round(b.left), y: Math.round(b.top + scrollY), w: Math.round(b.width), h: Math.round(b.height),
    oculto: cx.getAttribute('aria-hidden'), estado: cx.getAttribute('data-midia-estado'), classes: cx.className,
    attrs: { muted: v.muted || v.hasAttribute('muted'), loop: v.loop, inline: v.playsInline, autoplay: v.autoplay, preload: v.getAttribute('preload'), controls: v.controls, tab: v.getAttribute('tabindex') },
    poster: v.getAttribute('poster'), fontes: [...v.querySelectorAll('source')].map(s => s.getAttribute('src')), pausado: v.paused, src: v.currentSrc,
    ajuste: getComputedStyle(v).objectFit, mascara: getComputedStyle(v).maskImage || getComputedStyle(v).webkitMaskImage,
    reserva: r ? { op: getComputedStyle(r).opacity, vis: getComputedStyle(r).visibility } : null
  };
});

try {
  const presentes = JSON.parse((await readFile(join(SITE, 'assets/js/ui/midia-arquivos.js'), 'utf8')).match(/PLMIDIA_ARQUIVOS=(\[.*\]);/)[1]);
  console.log(`  · arquivos definitivos presentes: ${presentes.length} de ${ESPERADOS.length}`);
  const medidas = {};

  /* ---- A · estado real do site: estrutura, poster local, nada pedido que não exista ---- */
  for (const t of TELAS) {
    for (const [w, h] of [[1440, 900], [1024, 768], [390, 844]]) {
      const c = await nav.newContext({ viewport: { width: w, height: h } }), p = await c.newPage(), v = vigiar(p);
      await p.goto(srv.url + t.rota, { waitUntil: 'networkidle' });
      await p.waitForTimeout(900);
      const q = await quadro(p), rot = `${t.nome} ${w}×${h}`;
      medidas[rot] = q;
      const a = q.attrs;
      a.muted && a.loop && a.inline && a.autoplay && a.preload === 'none' && !a.controls && a.tab === '-1'
        ? ok(`${rot}: <video> mudo, em loop, playsinline, autoplay, preload="none", sem controles e fora da tabulação`) : ruim(`${rot}: atributos do vídeo ${JSON.stringify(a)}`);
      q.oculto === 'true' ? ok(`${rot}: mídia decorativa (aria-hidden)`) : ruim(`${rot}: a mídia não está com aria-hidden`);
      q.poster && !/^https?:/.test(q.poster) && v.pedidos.some(u => u.endsWith(q.poster.split('/').pop())) && q.ajuste === 'cover'
        ? ok(`${rot}: poster local carregado (${q.poster.split('/').pop()}), com corte central`) : ruim(`${rot}: poster ${q.poster} (object-fit ${q.ajuste})`);
      q.w > 200 && q.h > 150 ? ok(`${rot}: o quadro tem tamanho reservado (${q.w}×${q.h})`) : ruim(`${rot}: quadro ${q.w}×${q.h}`);
      const indevidos = v.pedidos.filter(u => ESPERADOS.some(e => u.endsWith('/assets/' + e) && !presentes.includes(e)));
      indevidos.length === 0 ? ok(`${rot}: nenhum arquivo ausente foi pedido ao servidor`) : ruim(`${rot}: pediu arquivo ausente → ${indevidos[0]}`);
      v.ruins.length === 0 && v.erros.length === 0 ? ok(`${rot}: sem resposta de erro e sem erro de página`) : ruim(`${rot}: ${v.ruins[0] || v.erros[0]}`);
      v.fora.length === 0 ? ok(`${rot}: nenhum recurso externo (T6, CSP)`) : ruim(`${rot}: recurso externo → ${v.fora[0]}`);
      const rolagem = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      rolagem <= 0 ? ok(`${rot}: sem rolagem lateral`) : ruim(`${rot}: rolagem lateral de ${rolagem} px`);
      if (presentes.includes(`video/${t.video}.mp4`)) {
        /* arquivo real presente: o vídeo ganha fonte e poster definitivos e toca (o Chromium de teste usa o WebM) */
        const nome = w < 600 && presentes.includes(`video/${t.video}-vertical.mp4`) ? t.video + '-vertical' : t.video;
        await p.locator('[data-midia]').scrollIntoViewIfNeeded();
        const tocou = await p.waitForFunction(() => { const c = document.querySelector('[data-midia]'), v = c.querySelector('video'); return c.classList.contains('is-tocando') && v.currentTime > 0 && v.videoWidth > 0; }, null, { timeout: 15000 }).then(() => true, () => false);
        const r = await quadro(p), pre = t.rota ? '../../assets/' : 'assets/';
        tocou && !r.pausado && r.src.endsWith(`video/${nome}.webm`) && r.fontes.join('|') === `${pre}video/${nome}.webm|${pre}video/${nome}.mp4`
          ? ok(`${rot}: vídeo real tocando (${nome}.webm; fontes WebM → MP4)`) : ruim(`${rot}: vídeo real não tocou (${JSON.stringify({ estado: r.estado, src: r.src, fontes: r.fontes })})`);
        r.poster === `${pre}video/${nome}-poster.jpg` && v.pedidos.some(u => u.endsWith(`/assets/video/${nome}-poster.jpg`)) && r.reserva.op === '0' && r.reserva.vis === 'hidden'
          ? ok(`${rot}: poster definitivo carregado e reserva desenhada fora de cena`) : ruim(`${rot}: poster ${r.poster} · reserva ${JSON.stringify(r.reserva)}`);
        r.w === q.w && r.h === q.h ? ok(`${rot}: o quadro não muda de tamanho com o vídeo (${r.w}×${r.h})`) : ruim(`${rot}: quadro mudou de ${q.w}×${q.h} para ${r.w}×${r.h}`);
      } else {
        q.fontes.length === 0 && q.reserva.op === '1' && q.reserva.vis === 'visible'
          ? ok(`${rot}: sem o vídeo definitivo, a reserva fica visível e o <video> não tem fonte`) : ruim(`${rot}: reserva ${JSON.stringify(q.reserva)} · fontes ${q.fontes.join(',')}`);
      }
      if (presentes.includes('img/fotos/camera-perfil.png')) {
        /* câmera real: o PNG aparece, o desenho some e a base clara do recorte é tirada pelo contorno (clip-path) */
        const cams = await p.evaluate(() => [...document.querySelectorAll('[data-midia-camera]')].map(el => {
          const cx = el.closest('[data-midia-cam]'), des = cx.querySelector('.cam-svg, .cam-desenho'), b = el.getBoundingClientRect();
          return { src: el.getAttribute('src') || el.getAttribute('href') || '', desenho: des ? getComputedStyle(des).display : '?', visivel: el.getAttribute('display') !== 'none' && !el.hidden,
            corte: getComputedStyle(el).clipPath, w: Math.round(b.width), escondida: !!el.closest('.midia__reserva') };
        }));
        cams.length >= 1 && cams.every(x => /camera-perfil\.png$/.test(x.src) && x.desenho === 'none' && x.visivel && /^polygon/.test(x.corte) && (x.escondida || x.w > 60))
          && v.pedidos.some(u => u.endsWith('/assets/img/fotos/camera-perfil.png'))
          ? ok(`${rot}: câmera real (camera-perfil.png) visível em ${cams.length} lugar(es), desenho escondido`) : ruim(`${rot}: câmera ${JSON.stringify(cams)}`);
      }
      if (t.nome === 'apresentacao') {
        /linear-gradient/.test(q.mascara) ? ok(`${rot}: o vídeo some no branco por máscara em degradê (sem corte duro)`) : ruim(`${rot}: sem máscara (${q.mascara})`);
        /* o texto fica sobre branco: a parte do vídeo que chega sob o texto ainda está quase transparente */
        const sobre = await p.evaluate(() => {
          const m = document.querySelector('.midia--hero').getBoundingClientRect();
          let dir = 0;
          for (const el of document.querySelectorAll('.hero__copy h1, .hero__copy p, .hero__copy a')) {
            const r = document.createRange(); r.selectNodeContents(el);
            for (const b of r.getClientRects()) if (b.bottom > m.top && b.top < m.bottom) dir = Math.max(dir, b.right);
          }
          return { invade: Math.max(0, Math.round(dir - m.left)), largura: Math.round(m.width), lado: m.left > 100 };
        });
        const fr = sobre.lado ? sobre.invade / sobre.largura : 0;                  // degradê do desktop: 6% aos 12% da largura, 45% aos 30%, cheio aos 48%
        const alfa = fr <= 0.12 ? fr / 0.12 * 0.06 : fr <= 0.3 ? 0.06 + (fr - 0.12) / 0.18 * 0.39 : Math.min(1, 0.45 + (fr - 0.3) / 0.18 * 0.55);
        const borda = await p.evaluate(() => { const m = document.querySelector('.midia--hero').getBoundingClientRect(), f = document.querySelector('.faixa').getBoundingClientRect(); return { dir: Math.round(innerWidth - m.right), faixa: Math.round(f.top - m.bottom) }; });
        borda.dir <= 0 && Math.abs(borda.faixa) <= 1 ? ok(`${rot}: o vídeo vai até a borda direita da tela e encosta na faixa preta (sem caixa solta)`) : ruim(`${rot}: sobra em volta do vídeo ${JSON.stringify(borda)}`);
        alfa <= 0.25 ? ok(`${rot}: o texto não fica sobre o vídeo (sobreposição ${sobre.invade} px, opacidade ≤ ${Math.round(alfa * 100)}%)`) : ruim(`${rot}: texto sobre o vídeo (${JSON.stringify(sobre)})`);
        const leg = await p.evaluate(() => ({
          hero: [...document.querySelectorAll('.hero__pol figcaption')].map(f => f.textContent.trim()),
          mesa: [...document.querySelectorAll('svg.mesa [id^="mesa-p"] text.pol-leg')].map(x => x.textContent),
          datas: [...document.querySelectorAll('svg.mesa [id^="mesa-p"] text.pol-data, .faixa__img--svg text.pol-data')].map(x => x.textContent),
          banner: [...document.querySelectorAll('.faixa__img--svg text.pol-leg')].map(x => x.textContent),
          rabiscos: document.querySelectorAll('svg.mesa [id^="mesa-p"] path, .faixa__img--svg > g[id^="bimp-p"] path').length,
          fonte: getComputedStyle(document.querySelector('svg.mesa text.pol-leg')).fontFamily
        }));
        leg.hero.length === 2 && leg.hero.every(x => /\d{4}$/.test(x)) ? ok(`${rot}: polaroids do hero com legenda e data («${leg.hero[0]}»)`) : ruim(`${rot}: legendas do hero ${JSON.stringify(leg.hero)}`);
        leg.mesa.length === 7 && leg.banner.length === 2 && leg.datas.length >= 4 ? ok(`${rot}: mesa (7) e banner (2) com legendas; ${leg.datas.length} com data`) : ruim(`${rot}: legendas ${JSON.stringify(leg)}`);
        leg.rabiscos === 0 && /Caveat/.test(leg.fonte) ? ok(`${rot}: letra manuscrita (Caveat) e nenhum rabisco`) : ruim(`${rot}: rabiscos ${leg.rabiscos} · fonte ${leg.fonte}`);
      }
      if (w !== 1024) await p.screenshot({ path: join(saida, `${t.nome}-${w}.png`) });
      await c.close();
    }
  }

  /* ---- como funciona com os arquivos reais: câmera de perfil no passo 1 e vídeo da câmera na abertura (D-146) ---- */
  if (presentes.includes('img/fotos/camera-perfil.png')) {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const c = await nav.newContext({ viewport: { width: w, height: h } }), p = await c.newPage(), v = vigiar(p), rot = `como funciona ${w}×${h}`;
      await p.goto(srv.url + 'como-funciona/', { waitUntil: 'networkidle' });
      const cam = await p.evaluate(() => { const i = document.querySelector('.step__arte--cam .cam-real'), s = document.querySelector('.step__arte--cam .cam-svg'); return { src: i.getAttribute('src'), w: Math.round(i.getBoundingClientRect().width), desenho: getComputedStyle(s).display, alt: i.getAttribute('alt') }; });
      /camera-perfil\.png$/.test(cam.src || '') && cam.w > 60 && cam.desenho === 'none' && cam.alt === ''
        ? ok(`${rot}: câmera real no passo 1 (${cam.w} px), desenho escondido`) : ruim(`${rot}: câmera ${JSON.stringify(cam)}`);
      if (presentes.includes('video/camera-foto.mp4')) {
        const q0 = await quadro(p);
        await p.locator('[data-midia]').scrollIntoViewIfNeeded();
        const fim = await p.waitForFunction(() => document.querySelector('[data-midia]').getAttribute('data-midia-estado') === 'fim', null, { timeout: 20000 }).then(() => true, () => false);
        const q = await quadro(p), est = await p.evaluate(() => { const x = document.querySelector('[data-midia] video'), s = getComputedStyle(x); return { fim: x.ended, t: x.currentTime, d: x.duration, mistura: s.mixBlendMode, filtro: s.filter, mascara: s.maskImage || s.webkitMaskImage }; });
        fim && est.fim && !q.attrs.loop && est.d > 3 && Math.abs(est.t - est.d) < 0.3 && q.src.endsWith('video/camera-foto.webm')
          ? ok(`${rot}: o vídeo da câmera toca uma vez e para no último quadro (${est.d.toFixed(1)} s)`) : ruim(`${rot}: vídeo da câmera ${JSON.stringify({ estado: q.estado, ...est, loop: q.attrs.loop, src: q.src })}`);
        q.attrs.muted && q.attrs.inline && !q.attrs.controls && q.attrs.tab === '-1' && q.oculto === 'true' && q.poster === '../assets/video/camera-foto-poster.jpg' && q.fontes.join('|') === '../assets/video/camera-foto.webm|../assets/video/camera-foto.mp4'
          ? ok(`${rot}: vídeo da câmera decorativo, mudo, com poster e fontes WebM → MP4`) : ruim(`${rot}: ${JSON.stringify({ a: q.attrs, poster: q.poster, fontes: q.fontes })}`);
        est.mistura === 'multiply' && /brightness/.test(est.filtro) && /gradient/.test(est.mascara) && q.reserva.op === '0' && q.w === q0.w && q.h === q0.h
          ? ok(`${rot}: o fundo do vídeo funde com o branco da página (sem caixa) e o quadro não muda (${q.w}×${q.h})`) : ruim(`${rot}: fusão ${JSON.stringify(est)} · quadro ${q0.w}×${q0.h} → ${q.w}×${q.h}`);
        await p.evaluate(() => scrollTo(0, 400)); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
        (await p.evaluate(() => document.querySelector('[data-midia] video').ended)) ? ok(`${rot}: depois de terminar, o vídeo não recomeça`) : ruim(`${rot}: o vídeo recomeçou`);
        await p.screenshot({ path: join(saida, `como-funciona-${w}.png`) });
      }
      v.ruins.length === 0 && v.erros.length === 0 && v.fora.length === 0 ? ok(`${rot}: sem resposta de erro, erro de página ou recurso externo`) : ruim(`${rot}: ${v.ruins[0] || v.erros[0] || v.fora[0]}`);
      (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 ? ok(`${rot}: sem rolagem lateral`) : ruim(`${rot}: rolagem lateral`);
      await c.close();
    }
  }

  /* ---- arquivos reais com movimento reduzido: nenhum vídeo é pedido, fica só o poster definitivo ---- */
  for (const t of [...TELAS, { rota: 'como-funciona/', nome: 'como funciona', video: 'camera-foto' }]) {
    if (!presentes.includes(`video/${t.video}.mp4`)) continue;
    const c = await nav.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), p = await c.newPage(), v = vigiar(p);
    await p.goto(srv.url + t.rota, { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);
    const q = await quadro(p), videos = v.pedidos.filter(u => /\.(webm|mp4)$/.test(u));
    videos.length === 0 && q.fontes.length === 0 && !/is-tocando/.test(q.classes) && q.poster.endsWith(`video/${t.video}-poster.jpg`) && v.pedidos.some(u => u.endsWith(`/assets/video/${t.video}-poster.jpg`)) && v.ruins.length === 0
      ? ok(`${t.nome} real com movimento reduzido: nenhum vídeo pedido; só o poster definitivo`) : ruim(`${t.nome} real com movimento reduzido: ${videos.length} vídeo(s) · ${q.poster} · ${q.classes} ${v.ruins[0] || ''}`);
    await c.close();
  }

  /* ---- sem JavaScript: poster e reserva visíveis, nada quebra ---- */
  for (const t of TELAS) {
    const c = await nav.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }), p = await c.newPage(), v = vigiar(p);
    await p.goto(srv.url + t.rota, { waitUntil: 'load' });
    await p.waitForTimeout(400);
    const q = await quadro(p);
    q.poster && q.reserva.op === '1' && v.ruins.length === 0 ? ok(`${t.nome} sem JavaScript: poster e reserva visíveis, sem resposta de erro`) : ruim(`${t.nome} sem JavaScript: ${JSON.stringify(q.reserva)} ${v.ruins[0] || ''}`);
    await c.close();
  }

  /* ---- B · chegada dos arquivos (simulada): lista completa + respostas interceptadas ---- */
  const webm = await (async () => {            // um vídeo pequeno de verdade, gravado no próprio navegador
    const c = await nav.newContext(), p = await c.newPage();
    await p.goto(srv.url + '404.html');
    const bytes = await p.evaluate(async () => {
      const cv = document.createElement('canvas'); cv.width = 160; cv.height = 90;
      const x = cv.getContext('2d'), rec = new MediaRecorder(cv.captureStream(12), { mimeType: 'video/webm' }), partes = [];
      rec.ondataavailable = e => partes.push(e.data);
      const fim = new Promise(o => { rec.onstop = o; });
      rec.start();
      for (let i = 0; i < 14; i++) { x.fillStyle = i % 2 ? '#006194' : '#FD761A'; x.fillRect(0, 0, 160, 90); await new Promise(o => setTimeout(o, 90)); }
      rec.stop(); await fim;
      return [...new Uint8Array(await new Blob(partes).arrayBuffer())];
    });
    await c.close();
    return Buffer.from(bytes);
  })();
  webm.length > 500 ? ok(`simulação: vídeo de teste gravado no navegador (${webm.length} bytes)`) : ruim('simulação: não foi possível gravar o vídeo de teste');
  const jpg = await readFile(join(SITE, 'assets/img/fotos/praia.jpg')), png = await readFile(join(SITE, 'assets/img/icones/icone-192.png'));
  const simular = async (opcoes, antes) => {
    const c = await nav.newContext(opcoes);
    if (antes) await c.addInitScript(antes);
    await c.route('**/assets/js/ui/midia-arquivos.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.PLMIDIA_ARQUIVOS=' + JSON.stringify(ESPERADOS) + ';' }));
    await c.route(/\/assets\/video\/[\w-]+\.(webm|mp4)$/, r => r.fulfill({ contentType: 'video/webm', body: webm }));
    await c.route(/\/assets\/video\/[\w-]+-poster\.jpg$/, r => r.fulfill({ contentType: 'image/jpeg', body: jpg }));
    await c.route(/\/assets\/img\/fotos\/camera-\w+\.png$/, r => r.fulfill({ contentType: 'image/png', body: png }));
    await c.route(/\/assets\/img\/fotos\/(amigos|casal|familia)-[\w-]+\.jpg$/, r => r.fulfill({ contentType: 'image/jpeg', body: jpg }));
    const p = await c.newPage();
    return { c, p, v: vigiar(p) };
  };
  const pediuVideo = v => v.pedidos.filter(u => /\/assets\/video\/[\w-]+\.(webm|mp4)$/.test(u));

  for (const t of TELAS) {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const { c, p, v } = await simular({ viewport: { width: w, height: h } });
      await p.goto(srv.url + t.rota, { waitUntil: 'load' });
      await p.locator('[data-midia]').scrollIntoViewIfNeeded();
      const tocou = await p.waitForFunction(() => document.querySelector('[data-midia]').classList.contains('is-tocando'), null, { timeout: 10000 }).then(() => true, () => false);
      await p.waitForTimeout(900);
      const q = await quadro(p), rot = `${t.nome} ${w}×${h} com os arquivos`, antes = medidas[`${t.nome} ${w}×${h}`];
      const nome = w < 600 && t.video === 'mesa-polaroids' ? t.video + '-vertical' : t.video;
      tocou && !q.pausado ? ok(`${rot}: o vídeo carrega ao entrar na tela e toca`) : ruim(`${rot}: o vídeo não tocou (${JSON.stringify({ estado: q.estado, fontes: q.fontes })})`);
      q.fontes.join('|') === [`video/${nome}.webm`, `video/${nome}.mp4`].map(f => (t.rota ? '../../' : '') + 'assets/' + f).join('|')
        ? ok(`${rot}: fontes na ordem WebM → MP4 (${nome}${nome !== t.video ? ', versão em pé no celular' : ''})`) : ruim(`${rot}: fontes ${q.fontes.join(' | ')}`);
      q.poster.endsWith(`video/${nome}-poster.jpg`) ? ok(`${rot}: o poster passa a ser o definitivo`) : ruim(`${rot}: poster ${q.poster}`);
      q.reserva.op === '0' && q.reserva.vis === 'hidden' ? ok(`${rot}: a reserva desenhada sai de cena`) : ruim(`${rot}: reserva ${JSON.stringify(q.reserva)}`);
      q.w === antes.w && q.h === antes.h && q.x === antes.x && q.y === antes.y ? ok(`${rot}: o quadro não mudou de lugar nem de tamanho (${q.w}×${q.h})`) : ruim(`${rot}: quadro mudou de ${antes.w}×${antes.h}@${antes.x},${antes.y} para ${q.w}×${q.h}@${q.x},${q.y}`);
      const troca = await p.evaluate(() => {
        const cam = [...document.querySelectorAll('[data-midia-camera]')].map(el => {
          const cx = el.closest('[data-midia-cam]'), des = cx.querySelector('.cam-svg, .cam-desenho');
          return { src: el.getAttribute('src') || el.getAttribute('href') || '', desenho: des ? getComputedStyle(des).display : '?', visivel: el.getAttribute('display') !== 'none' && !el.hidden };
        });
        const fotos = [...document.querySelectorAll('[data-midia-foto]')].map(el => [el.getAttribute('data-midia-foto'), el.getAttribute('src') || el.getAttribute('href') || '']);
        return { cam, fotos };
      });
      troca.cam.length >= 1 && troca.cam.every(x => /camera-(perfil|frente)\.png$/.test(x.src) && x.desenho === 'none' && x.visivel)
        ? ok(`${rot}: a câmera realista entra no lugar do desenho (${troca.cam.length} lugar(es))`) : ruim(`${rot}: câmera ${JSON.stringify(troca.cam)}`);
      troca.fotos.length >= 7 && troca.fotos.every(([s, u]) => u.endsWith('img/fotos/' + s + '.jpg'))
        ? ok(`${rot}: as ${troca.fotos.length} polaroids passam a mostrar as fotos de pessoas`) : ruim(`${rot}: fotos ${JSON.stringify(troca.fotos.filter(([s, u]) => !u.endsWith(s + '.jpg')))}`);
      v.ruins.length === 0 && v.erros.length === 0 ? ok(`${rot}: sem resposta de erro e sem erro de página`) : ruim(`${rot}: ${v.ruins[0] || v.erros[0]}`);
      await c.close();
    }
  }

  /* como funciona: a câmera no passo 1 */
  {
    const { c, p, v } = await simular({ viewport: { width: 1440, height: 900 } });
    await p.goto(srv.url + 'como-funciona/', { waitUntil: 'networkidle' });
    const cam = await p.evaluate(() => { const i = document.querySelector('.step__arte--cam .cam-real'), s = document.querySelector('.step__arte--cam .cam-svg'); return { src: i.getAttribute('src'), w: Math.round(i.getBoundingClientRect().width), desenho: getComputedStyle(s).display, alt: i.getAttribute('alt') }; });
    /camera-perfil\.png$/.test(cam.src || '') && cam.w > 40 && cam.desenho === 'none' && cam.alt === '' && v.erros.length === 0
      ? ok('como funciona com os arquivos: câmera realista no passo 1') : ruim('como funciona: ' + JSON.stringify(cam) + (v.erros[0] || ''));
    await c.close();
  }

  /* só carrega quando entra na tela */
  {
    const { c, p, v } = await simular({ viewport: { width: 390, height: 160 } });
    await p.goto(srv.url + 'app/entrar/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(700);
    const antes = pediuVideo(v).length, y = await p.evaluate(() => Math.round(document.querySelector('[data-midia]').getBoundingClientRect().top));
    antes === 0 && y > 360 ? ok(`carregamento sob demanda: com a mídia fora da tela (a ${y} px), nenhum vídeo é pedido`) : ruim(`carregamento sob demanda: ${antes} pedido(s) antes de rolar (mídia a ${y} px)`);
    await p.locator('[data-midia]').scrollIntoViewIfNeeded();
    await p.waitForFunction(() => document.querySelector('[data-midia]').classList.contains('is-tocando'), null, { timeout: 10000 }).catch(() => {});
    pediuVideo(v).length >= 1 ? ok('carregamento sob demanda: ao rolar até a mídia, o vídeo é pedido') : ruim('carregamento sob demanda: o vídeo não foi pedido ao rolar');
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);
    (await p.evaluate(() => document.querySelector('[data-midia] video').paused)) ? ok('fora da tela de novo, o vídeo pausa') : ruim('o vídeo continua tocando fora da tela');
    await c.close();
  }

  /* movimento reduzido e economia de dados: só o poster */
  for (const [rot, opcoes, antes] of [
    ['movimento reduzido', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, null],
    ['economia de dados (Save-Data)', { viewport: { width: 1440, height: 900 } }, () => { Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => ({ saveData: true, effectiveType: '4g' }) }); }]
  ]) {
    for (const t of TELAS) {
      const { c, p, v } = await simular(opcoes, antes);
      await p.goto(srv.url + t.rota, { waitUntil: 'networkidle' });
      await p.waitForTimeout(900);
      const q = await quadro(p);
      pediuVideo(v).length === 0 && q.fontes.length === 0 && !/is-tocando/.test(q.classes) && q.poster.endsWith(`video/${t.video}-poster.jpg`)
        ? ok(`${t.nome} com ${rot}: nenhum vídeo é pedido; fica o poster definitivo`) : ruim(`${t.nome} com ${rot}: ${pediuVideo(v).length} pedido(s) · ${q.poster} · ${q.classes}`);
      await c.close();
    }
  }
} catch (e) {
  ruim('exceção: ' + (e.stack || e));
} finally {
  await nav.close();
  srv.fechar();
}

console.log(falhas.length ? `\n✘ ${falhas.length} falha(s)` : '\n✔ Mídia realista: sem falhas');
process.exit(falhas.length ? 1 : 0);
