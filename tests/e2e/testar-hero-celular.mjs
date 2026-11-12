/* D-155: no celular e em telas menores o vídeo do herói vem antes da frase; no desktop fica ao lado.
   Botões LED feitos com <a> não têm sublinhado. */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';
let falhas = 0;
const ok = (m) => console.log('  ✔ ' + m), ruim = (m) => { falhas++; console.log('  ✘ ' + m); };
const srv = await servir(); const nav = await chromium.launch();
try {
  for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
    const p = await nav.newPage({ viewport: { width: w, height: h } });
    await p.goto(srv.url, { waitUntil: 'networkidle' });
    const m = await p.evaluate(() => {
      const a = document.querySelector('.hero__arte').getBoundingClientRect(), t = document.getElementById('titulo').getBoundingClientRect();
      const leds = [...document.querySelectorAll('a.led-btn')].map(e => getComputedStyle(e).textDecorationLine + getComputedStyle(e.querySelector('.btn-content') || e).textDecorationLine);
      return { arteBase: a.bottom, arteEsq: a.left, tituloTopo: t.top, tituloEsq: t.left, leds };
    });
    if (w < 1024) { const base = await p.evaluate(() => document.getElementById('titulo').getBoundingClientRect().bottom); base <= h ? ok(`${w}px: a frase aparece já na primeira tela (${Math.round(base)} px)`) : ruim(`${w}px: frase abaixo da dobra (${Math.round(base)} px)`); }
    if (w < 1024) m.arteBase - 40 <= m.tituloTopo ? ok(`${w}px: vídeo antes da frase`) : ruim(`${w}px: frase antes do vídeo ${JSON.stringify(m)}`);
    else m.arteEsq > m.tituloEsq && m.tituloTopo < m.arteBase ? ok(`${w}px: vídeo ao lado da frase`) : ruim(`${w}px: vídeo fora do lugar ${JSON.stringify(m)}`);
    m.leds.length && m.leds.every(s => s === 'nonenone') ? ok(`${w}px: botões LED sem sublinhado (${m.leds.length})`) : ruim(`${w}px: sublinhado no LED ${m.leds}`);
    await p.close();
  }
} catch (e) { ruim('exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ herói no celular: ${falhas} falha(s)` : '\n✔ herói no celular: sem falhas');
process.exit(falhas ? 1 : 0);
