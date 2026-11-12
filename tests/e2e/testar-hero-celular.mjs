/* D-155 · D-180 (o botão principal na primeira tela, sem rolar): no celular e em telas menores o vídeo do herói vem antes da frase; no desktop fica ao lado.
   Botões LED feitos com <a> não têm sublinhado. */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';
let falhas = 0;
const ok = (m) => console.log('  ✔ ' + m), ruim = (m) => { falhas++; console.log('  ✘ ' + m); };
const srv = await servir(); const nav = await chromium.launch();
try {
  for (const [w, h] of [[390, 844], [375, 667], [360, 740], [412, 915], [768, 1024], [1280, 720], [1440, 900]]) {
    const p = await nav.newPage({ viewport: { width: w, height: h } });
    await p.goto(srv.url, { waitUntil: 'networkidle' });
    /* mede depois da entrada (a frase sobe 28 px em 0,8 s): no CI a medida no meio da animação dava falso «abaixo da dobra» */
    await p.evaluate(() => Promise.all([...document.querySelectorAll('.hero__copy > *, .hero__title .hl')].flatMap((e) => e.getAnimations()).map((a) => a.finished.catch(() => {}))));
    const m = await p.evaluate(() => {
      const a = document.querySelector('.hero__arte').getBoundingClientRect(), t = document.getElementById('titulo').getBoundingClientRect();
      const leds = [...document.querySelectorAll('a.led-btn')].map(e => getComputedStyle(e).textDecorationLine + getComputedStyle(e.querySelector('.btn-content') || e).textDecorationLine);
      return { arteBase: a.bottom, arteEsq: a.left, tituloTopo: t.top, tituloEsq: t.left, leds };
    });
    if (w < 1024) { const base = await p.evaluate(() => document.getElementById('titulo').getBoundingClientRect().bottom); base <= h ? ok(`${w}px: a frase aparece já na primeira tela (${Math.round(base)} px)`) : ruim(`${w}px: frase abaixo da dobra (${Math.round(base)} px)`); }
    if (w < 1024) m.arteBase - 40 <= m.tituloTopo ? ok(`${w}px: vídeo antes da frase`) : ruim(`${w}px: frase antes do vídeo ${JSON.stringify(m)}`);
    else m.arteEsq > m.tituloEsq && m.tituloTopo < m.arteBase ? ok(`${w}px: vídeo ao lado da frase`) : ruim(`${w}px: vídeo fora do lugar ${JSON.stringify(m)}`);
    { const c = await p.evaluate(() => { const b = document.querySelector('.hero__cta .led-btn').getBoundingClientRect(), l = document.querySelector('.hero__lead'), lh = parseFloat(getComputedStyle(l).lineHeight); return { base: b.bottom, linhas: Math.round(l.getBoundingClientRect().height / lh) }; });   /* D-180 */
      c.base <= h ? ok(`${w}×${h}: «Criar minhas polaroids» visível sem rolar (${Math.round(c.base)} px)`) : ruim(`${w}×${h}: botão abaixo da dobra (${Math.round(c.base)} px)`);
      if (w <= 412) c.linhas <= 2 ? ok(`${w}px: texto de apoio em até 2 linhas (${c.linhas})`) : ruim(`${w}px: texto de apoio com ${c.linhas} linhas`); }
    m.leds.length && m.leds.every(s => s === 'nonenone') ? ok(`${w}px: botões LED sem sublinhado (${m.leds.length})`) : ruim(`${w}px: sublinhado no LED ${m.leds}`);
    await p.close();
  }
} catch (e) { ruim('exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ herói no celular: ${falhas} falha(s)` : '\n✔ herói no celular: sem falhas');
process.exit(falhas ? 1 : 0);
