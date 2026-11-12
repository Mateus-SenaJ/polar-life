#!/usr/bin/env node
// P-FONTES (T6, TP-06, TP-08): nenhuma página pede nada fora do próprio site, e as fontes do sistema
// e do catálogo de legendas (DOC-02 §4) carregam dos arquivos locais, com os acentos do pt-BR.
// Uso: npm run testar:fontes  (Chromium do Playwright)
import { chromium } from 'playwright';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { servir, SITE } from '../helpers/servidor.mjs';

const falhas = [], ok = m => console.log('  ✔ ' + m), ruim = m => { falhas.push(m); console.log('  ✘ ' + m); };
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const paginas = walk(SITE).filter(f => f.endsWith('.html')).map(f => relative(SITE, f).replace(/\\/g, '/').replace(/index\.html$/, ''));

const CATALOGO = [ // [família, estilo, peso] · 24 fontes de legenda + as do sistema
  ['Caveat', 'normal', 400], ['Caveat', 'normal', 500], ['Reenie Beanie'], ['Shadows Into Light'], ['Kalam'], ['Patrick Hand'],
  ['Covered By Your Grace'], ['Zeyada'], ['Homemade Apple'], ['Over the Rainbow'], ['La Belle Aurore'],
  ['Dancing Script'], ['Satisfy'], ['Sacramento'], ['Allura'], ['Parisienne'],
  ['Special Elite'], ['Courier Prime'], ['Cutive Mono'],
  ['Cormorant Garamond', 'italic', 300], ['Cormorant Garamond', 'italic', 400], ['Cormorant Garamond', 'normal', 300], ['Cormorant Garamond', 'normal', 400],
  ['Playfair Display', 'italic', 400], ['EB Garamond'], ['Libre Baskerville'],
  ['Inter', 'normal', 300], ['Inter', 'normal', 400], ['Inter', 'normal', 500], ['IBM Plex Mono'],
  // D-179: a letra das fotos do Retro Pocket (Fondamento Itálico) e as 10 caligráficas parecidas, com as variantes reais
  ['Fondamento', 'italic', 400], ['Fondamento'], ['Quintessential'], ['Felipa'], ['Marck Script'], ['Niconne'], ['Bilbo Swash Caps'],
  ['Almendra'], ['Almendra', 'normal', 700], ['Almendra', 'italic', 400], ['Almendra', 'italic', 700], ['Courgette'],
  ['Oregano'], ['Oregano', 'italic', 400], ['Merienda'], ['Merienda', 'normal', 700], ['Sofia'],
  // D-186: com itálico e negrito reais
['IBM Plex Mono', 'normal', 700], ['IBM Plex Mono', 'italic', 400], ['IBM Plex Mono', 'italic', 700], ['Space Mono', 'normal', 400], ['Space Mono', 'normal', 700], ['Space Mono', 'italic', 400], ['Space Mono', 'italic', 700], ['Playfair Display', 'normal', 400], ['Playfair Display', 'normal', 700], ['Playfair Display', 'italic', 700], ['Dancing Script', 'normal', 700], ['Josefin Sans', 'normal', 400], ['Josefin Sans', 'normal', 700], ['Josefin Sans', 'italic', 400], ['Josefin Sans', 'italic', 700], ['Merriweather', 'normal', 400], ['Merriweather', 'normal', 700], ['Merriweather', 'italic', 400], ['Merriweather', 'italic', 700], ['Alegreya', 'normal', 400], ['Alegreya', 'normal', 700], ['Alegreya', 'italic', 400], ['Alegreya', 'italic', 700], ['IBM Plex Mono', 'normal', 400], ['Playfair Display', 'italic', 400], ['Cormorant Garamond', 'normal', 700], ['Cormorant Garamond', 'italic', 700],
];

const srv = await servir();
const nav = await chromium.launch();
try {
  console.log(`Páginas sem pedidos externos (${paginas.length}):`);
  const sessao = () => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })); // sessão de teste: a guarda de /app/ exige conta (D-123)
  for (const pg of paginas) {
    const page = await nav.newPage(), fora = [];
    await page.addInitScript(sessao);
    page.on('request', r => { if (!r.url().startsWith(srv.url) && !/^(data|blob|about):/.test(r.url())) fora.push(r.url()); });
    await page.goto(srv.url + pg, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    fora.length ? ruim(`${pg || '/'} pediu ${fora.join(', ')}`) : ok(pg || '/');
    await page.close();
  }

  console.log('\nCatálogo carregado dos arquivos locais, com acentos:');
  const page = await nav.newPage(), fora = [];
  await page.addInitScript(sessao);
  page.on('request', r => { if (!r.url().startsWith(srv.url)) fora.push(r.url()); });
  await page.goto(srv.url + 'app/editor/quadro/', { waitUntil: 'networkidle' });
  const res = await page.evaluate(async lista => {
    const out = [];
    for (const [fam, est = 'normal', w = 400] of lista) {
      const css = `${est} ${w} 40px '${fam}'`, fs = await document.fonts.load(css, 'áãçéêíóõú');
      const c = document.createElement('canvas').getContext('2d'), mede = f => { c.font = f; return c.measureText('Dia de rolê · ação São João').width; };
      out.push({ fam, est, w, carregou: fs.length > 0 && document.fonts.check(css, 'áãçéêíóõú'), difere: Math.abs(mede(css) - mede(`${est} ${w} 40px monospace`)) > .5 });
    }
    return out;
  }, CATALOGO);
  for (const r of res) (r.carregou && r.difere ? ok : ruim)(`${r.fam} ${r.est === 'italic' ? 'itálico ' : ''}${r.w}`);
  fora.length ? ruim('o catálogo pediu ' + fora.join(', ')) : ok('nenhum pedido externo ao carregar o catálogo');
} finally { await nav.close(); srv.fechar(); }

console.log(falhas.length ? `\n✘ ${falhas.length} falha(s)` : '\n✔ Fontes: sem falhas');
process.exit(falhas.length ? 1 : 0);
