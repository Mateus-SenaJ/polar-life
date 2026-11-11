/* Tela de entrar sem rolagem no desktop e faixa preta que se dissolve sobre o vídeo (D-154). */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (m) => console.log('  ✔ ' + m);
const ruim = (m) => { falhas++; console.log('  ✘ ' + m); };
const srv = await servir();
const nav = await chromium.launch();
try {
  for (const [w, h] of [[1920, 1080], [1440, 900], [1366, 768], [1280, 720]]) {
    const p = await nav.newPage({ viewport: { width: w, height: h } });
    await p.goto(srv.url + 'app/entrar/', { waitUntil: 'networkidle' });
    const m = await p.evaluate(() => {
      const r = document.querySelector('.ent__r'), cx = document.getElementById('caixa'), head = document.querySelector('.ent__head');
      return { doc: document.documentElement.scrollHeight, col: r.scrollHeight - r.clientHeight,
        cxTopo: cx.getBoundingClientRect().top, headBase: head.getBoundingClientRect().bottom, cxBase: cx.getBoundingClientRect().bottom };
    });
    m.doc <= h && m.col <= 1 && m.cxBase <= h ? ok(`${w}×${h}: sem rolagem (página e coluna)`) : ruim(`${w}×${h}: rola ${JSON.stringify(m)}`);
    m.cxTopo >= m.headBase ? ok(`${w}×${h}: a caixa não sobe por cima do logo`) : ruim(`${w}×${h}: caixa sobre o cabeçalho ${JSON.stringify(m)}`);
    await p.close();
  }
  const p = await nav.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(srv.url + 'app/entrar/', { waitUntil: 'networkidle' });
  const g = await p.evaluate(() => {
    const f = document.querySelector('.ent__faixa'), md = document.querySelector('.ent__midia');
    const fr = f.getBoundingClientRect(), mr = md.getBoundingClientRect();
    return { bg: getComputedStyle(f).backgroundImage, sobre: mr.top <= fr.top + 1 && mr.bottom >= fr.bottom };
  });
  /linear-gradient/.test(g.bg) && /rgba\(0, 0, 0, 0\)/.test(g.bg) && g.sobre
    ? ok('faixa preta em degradê até transparente, por cima do vídeo') : ruim('transição da faixa: ' + JSON.stringify(g));
  const links = await p.evaluate(() => [...document.querySelectorAll('#caixa .cx-links a')].map(a => a.textContent));
  links.join('|') === 'Privacidade|Termos|Cookies' ? ok('links legais na caixa (rodapé oculto no desktop)') : ruim('links: ' + links);
  await p.close();
} catch (e) { ruim('exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? '\n✘ entrar sem rolagem: ' + falhas + ' falha(s)' : '\n✔ entrar sem rolagem: sem falhas');
process.exit(falhas ? 1 : 0);
