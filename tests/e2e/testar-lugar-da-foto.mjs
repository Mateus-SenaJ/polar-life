/* D-178: o lugar lido do GPS chega às Folhas e ao PDF mesmo sem abrir o Quadro, e não se perde ao sair do Quadro.
   Fluxo real (Adicionar fotos → Processando → Resumo → Folhas) com JPEGs montados aqui: foto de exemplo do site + EXIF com
   data e GPS (Salvador e Praia de Itapuã). Nenhuma foto pessoal. «Sem local» tira a cidade; «Usar o local da foto» devolve. */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';
import { maisAbertos } from '../helpers/mais.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
const base = await readFile(new URL('../../site/assets/img/fotos/praia.jpg', import.meta.url));

function exif(data, gps) {   /* TIFF little-endian: IFD0 → Exif (DateTimeOriginal) e GPS (lat/lon em graus, minutos, segundos) */
  const b = [], u16 = (v) => b.push(v & 255, v >> 8 & 255), u32 = (v) => { u16(v & 65535); u16(v >>> 16 & 65535); };
  const rat = (g) => { const d = Math.floor(Math.abs(g)), m = Math.floor((Math.abs(g) - d) * 60), s = Math.round(((Math.abs(g) - d) * 60 - m) * 60 * 100); u32(d); u32(1); u32(m); u32(1); u32(s); u32(100); };
  b.push(73, 73); u16(42); u32(8);
  u16(2); u16(0x8769); u16(4); u32(1); u32(38); u16(0x8825); u16(4); u32(1); u32(76); u32(0);
  u16(1); u16(0x9003); u16(2); u32(20); u32(56); u32(0);
  for (const ch of data) b.push(ch.charCodeAt(0)); b.push(0);
  u16(4); u16(1); u16(2); u32(2); b.push(gps[0] < 0 ? 83 : 78, 0, 0, 0);
  u16(2); u16(5); u32(3); u32(130); u16(3); u16(2); u32(2); b.push(gps[1] < 0 ? 87 : 69, 0, 0, 0);
  u16(4); u16(5); u32(3); u32(154); u32(0); rat(gps[0]); rat(gps[1]);
  const corpo = [69, 120, 105, 102, 0, 0].concat(b), len = corpo.length + 2;
  return Buffer.from([255, 225, len >> 8, len & 255].concat(corpo));
}
const comExif = (d, g) => Buffer.concat([base.subarray(0, 2), exif(d, g), base.subarray(2)]);
const ARQS = [
  { name: 'salvador.jpg', mimeType: 'image/jpeg', buffer: comExif('2026:11:23 10:00:00', [-12.9714, -38.5014]) },
  { name: 'itapua.jpg', mimeType: 'image/jpeg', buffer: comExif('2026:11:24 11:00:00', [-12.9535, -38.3635]) },
  { name: 'sem-exif.jpg', mimeType: 'image/jpeg', buffer: base },
];
const folhas = (p) => p.evaluate(() => [].map.call(document.querySelectorAll('#sheet .pol'), (e) => [].map.call(e.querySelectorAll('.pol__mline'), (m) => m.textContent)));
const esperaFolha = (p, i, txt) => p.waitForFunction((a) => { const e = document.querySelectorAll('#sheet .pol')[a[0]]; return !!e && [].map.call(e.querySelectorAll('.pol__mline'), (m) => m.textContent).join('|') === a[1]; }, [i, txt], { timeout: 15000 }).then(() => true, () => false);
async function pdfTxt(p) {
  await p.goto(srv.url + 'app/editor/gerar/');
  await p.waitForFunction(() => !!window.PLGERADOR);
  return p.evaluate(async () => {
    const pr = PLGERADOR.projeto(); await PLGERADOR.preparar(pr, []);
    const txt = [];
    (function w(o) { if (!o) return; if (Array.isArray(o)) return o.forEach(w); if (typeof o === 'object') { if (typeof o.txt === 'string' && o.t) txt.push(o.txt); Object.keys(o).forEach((k) => { if (o[k] && typeof o[k] === 'object') w(o[k]); }); } })(PLGERADOR.lista(pr));
    return txt;
  });
}
const abrirFolhas = async (p) => { await p.goto(srv.url + 'app/editor/'); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 3); };
const abrirQuadro = async (p, n) => {
  await p.goto(srv.url + 'app/editor/quadro/#foto-' + n); await p.reload();
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  await p.click('#tab-legendas'); await p.waitForSelector('#lg-av-t');
  if (await p.locator('#lg-av').isHidden()) await p.click('#lg-av-t');
};
const linhasQuadro = (p) => p.evaluate(() => [].map.call(document.querySelectorAll('#cap-meta .lg-m'), (e) => e.textContent).filter(Boolean).join('|'));

try {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await maisAbertos(ctx);
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  p.setDefaultTimeout(30000);

  console.log('\nFluxo real, sem abrir o Quadro:');
  await p.goto(srv.url + 'app/adicionar-fotos/', { waitUntil: 'networkidle' });
  await p.setInputFiles('#f-device', ARQS);
  await p.waitForFunction(() => /Continuar com 3/.test(document.getElementById('btn-device-t').textContent));
  await p.waitForTimeout(800);
  await p.click('#btn-device'); await p.waitForURL('**/processando/**');
  await p.waitForFunction(() => !document.getElementById('go').disabled);
  await p.click('#go'); await p.waitForURL('**/resumo/**'); await p.waitForTimeout(400);
  await p.click('#go'); await p.waitForURL(/orientacao|editor\/$/);
  if (/orientacao/.test(p.url())) { await p.click('#go'); await p.waitForURL('**/app/editor/'); }
  await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 3);
  ok(await esperaFolha(p, 0, 'Salvador - BA|23/11/26'), 'Folhas, foto 1: «Salvador - BA» e «23/11/26» lidos da foto (' + JSON.stringify((await folhas(p))[0]) + ')');
  ok(await esperaFolha(p, 1, 'Salvador - BA|24/11/26'), 'Folhas, foto 2: a cidade de Itapuã é Salvador - BA');
  const f3 = (await folhas(p))[2];
  ok(f3.join('') === '', 'Folhas, foto 3 (sem EXIF): nenhuma linha inventada');
  const cache = await p.evaluate(async () => { const a = await PLFOTOS.ler(1), b = await PLFOTOS.ler(2), c = await PLFOTOS.ler(3); return [a.meta.lugar, b.meta.lugar, c.meta.lugar || null]; });
  ok(cache[0] && cache[0].cidade === 'Salvador' && cache[0].uf === 'BA' && cache[1].ponto === 'Praia de Itapuã' && cache[2] === null, 'o lugar fica guardado na foto (cidade, UF e ponto mais próximo): ' + JSON.stringify(cache.map((c) => c && [c.cidade, c.uf, c.ponto])));
  const semCoords = await p.evaluate(() => !/-12\.9|-38\.5/.test(sessionStorage.getItem('pl-quadro') || '') && !/-12\.9|-38\.5/.test(document.body.innerText));
  ok(semCoords, 'as coordenadas não aparecem na tela nem no estado do projeto (D-139)');
  let pdf = await pdfTxt(p);
  ok(pdf.includes('Salvador - BA') && pdf.includes('23/11/26') && pdf.includes('24/11/26'), 'PDF sem passar pelo Quadro: ' + JSON.stringify(pdf));

  console.log('\nQuadro aberto e fechado sem mexer em nada:');
  await abrirQuadro(p, 1);
  await p.waitForFunction(() => /Salvador - BA/.test([].map.call(document.querySelectorAll('#cap-meta .lg-m'), (e) => e.textContent).join('|')));
  ok((await linhasQuadro(p)) === 'Salvador - BA|23/11/26', 'Quadro mostra «Salvador - BA|23/11/26»');
  await abrirFolhas(p);
  ok(await esperaFolha(p, 0, 'Salvador - BA|23/11/26'), 'de volta às Folhas, o local continua (antes sumia)');

  console.log('\n«Sem local» e «Usar o local da foto»:');
  await abrirQuadro(p, 1);
  await p.waitForSelector('[data-clr="c"]:not([hidden])');
  const ph = await p.getAttribute('#md-c', 'placeholder');
  ok(ph === 'Salvador - BA (da foto)', 'o campo Cidade mostra de onde vem o local: «' + ph + '»');
  await p.click('[data-clr="c"]');
  await p.waitForFunction(() => [].map.call(document.querySelectorAll('#cap-meta .lg-m'), (e) => e.textContent).filter(Boolean).join('|') === '23/11/26');
  ok(true, 'Quadro: só a data fica');
  ok((await p.textContent('[data-clr="c"]')) === 'Usar o local da foto', 'o botão vira «Usar o local da foto»');
  await abrirFolhas(p);
  ok(await esperaFolha(p, 0, '23/11/26'), 'Folhas: a foto 1 fica sem local');
  pdf = await pdfTxt(p);
  ok(pdf.filter((t) => t === 'Salvador - BA').length === 1 && pdf.includes('23/11/26'),'PDF: só a foto 2 tem «Salvador - BA» ' + JSON.stringify(pdf));
  await abrirQuadro(p, 1);
  await p.click('[data-clr="c"]');
  await p.waitForFunction(() => /Salvador - BA/.test([].map.call(document.querySelectorAll('#cap-meta .lg-m'), (e) => e.textContent).join('|')));
  ok(true, '«Usar o local da foto» devolve «Salvador - BA»');

  console.log('\nCidade digitada vale mais que a do GPS:');
  await p.fill('#md-c', 'Itacaré - BA'); await p.press('#md-c', 'Tab');
  await p.waitForFunction(() => /Itacaré - BA/.test([].map.call(document.querySelectorAll('#cap-meta .lg-m'), (e) => e.textContent).join('|')));
  ok(true, 'Quadro: «Itacaré - BA»');
  await abrirFolhas(p);
  ok(await esperaFolha(p, 0, 'Itacaré - BA|23/11/26'), 'Folhas: «Itacaré - BA|23/11/26»');
  erros.length === 0 ? ok(true, 'nenhum erro de página') : ok(false, 'erros: ' + erros.join(' | '));
  await ctx.close();
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ lugar da foto: ${falhas} falha(s)` : '\n✔ lugar da foto: sem falhas');
process.exit(falhas ? 1 : 0);
