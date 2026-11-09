#!/usr/bin/env node
// CSP do vercel.json (T6, segurança): as páginas e o gerador de PDF funcionam sem nenhuma violação.
// Uso: npm run testar:csp
import { chromium } from 'playwright';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir, SITE } from '../helpers/servidor.mjs';

const cfg = JSON.parse(readFileSync(fileURLToPath(new URL('../../vercel.json', import.meta.url)), 'utf8'));
const csp = cfg.headers[0].headers.find(h => h.key === 'Content-Security-Policy').value
  .replace('; upgrade-insecure-requests', '');                 // o servidor de teste é http
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const paginas = walk(SITE).filter(f => f.endsWith('.html')).map(f => relative(SITE, f).split('\\').join('/').replace(/index\.html$/, ''));

const srv = await servir(), nav = await chromium.launch(), ctx = await nav.newContext();
await ctx.route('**/*', async r => { const res = await r.fetch(); await r.fulfill({ response: res, headers: { ...res.headers(), 'content-security-policy': csp } }); });
const falhas = [];
const vigiar = p => { const v = []; p.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) v.push(m.text().slice(0, 200)); }); p.on('pageerror', e => v.push('erro: ' + e.message)); return v; };
try {
  for (const pg of paginas) {
    const p = await ctx.newPage(), v = vigiar(p);
    await p.goto(srv.url + pg, { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
    if (v.length) { falhas.push(pg); console.log('  ✘ ' + (pg || '/'), v); } else console.log('  ✔ ' + (pg || '/'));
    await p.close();
  }
  const p = await ctx.newPage(), v = vigiar(p);
  await p.goto(srv.url + 'app/editor/', { waitUntil: 'networkidle' });
  for (const f of ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/gerador.js']) await p.addScriptTag({ url: srv.url + f });
  const tam = await p.evaluate(async () => (await PLGERADOR.pdf(PLGERADOR.projeto(), { f: 'leve' })).arquivos.map(a => a.bytes.length));
  if (v.length || !tam.length) { falhas.push('pdf'); console.log('  ✘ PDF sob CSP', v); } else console.log('  ✔ PDF gerado sob CSP (' + Math.round(tam[0] / 1024) + ' KB)');
} finally { await nav.close(); srv.fechar(); }
console.log(falhas.length ? `\n✘ CSP: ${falhas.length} falha(s)` : '\n✔ CSP: sem violações');
process.exit(falhas.length ? 1 : 0);
