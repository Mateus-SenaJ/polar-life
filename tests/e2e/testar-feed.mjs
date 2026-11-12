/* D-195 · Colagens para as redes e imagens de verdade.
   Início → «Usar este modelo» → Colagem no tamanho da rede (sem fotos, o modelo aparece vazio, D-188) → fotos → pré-voo
   «Tudo pronto para compartilhar?» → Exportar só com «Imagem para as redes» → PNG/JPEG no tamanho exato, sem EXIF e sem gastar
   folha. Folhas em imagem e polaroids avulsas saem de verdade, com o DPI gravado e num ZIP. Fotos de exemplo do site (CC0). */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const saida = new URL('../saida/', import.meta.url); await mkdir(saida, { recursive: true });
const srv = await servir(), nav = await chromium.launch();
const FOTOS = ['casal-por-do-sol', 'amigos-praia', 'cidade-luzes', 'montanha', 'amigas-praia', 'casal-ponte', 'amigos-trilha', 'cidade-rua', 'casal-campo'];

/* PNG: largura/altura no IHDR, pHYs (pixels por metro) e se há bloco EXIF */
function png(b) {
  const u = new Uint8Array(b), dv = new DataView(u.buffer, u.byteOffset, u.byteLength), r = { w: dv.getUint32(16), h: dv.getUint32(20), ppm: 0, exif: false };
  for (let i = 8; i + 8 <= u.length;) { const n = dv.getUint32(i), t = String.fromCharCode(...u.subarray(i + 4, i + 8)); if (t === 'pHYs') r.ppm = dv.getUint32(i + 8); if (t === 'eXIf') r.exif = true; if (t === 'IEND') break; i += 12 + n; }
  return r;
}
/* JPEG: dimensões no SOF e densidade do JFIF */
function jpg(b) {
  const u = new Uint8Array(b), r = { w: 0, h: 0, dpi: 0, exif: false };
  if (u[6] === 74 && u[7] === 70 && u[11 + 2] === 1) r.dpi = (u[14] << 8) | u[15];
  for (let p = 2; p + 4 < u.length;) { if (u[p] !== 255) { p++; continue; } const m = u[p + 1], n = (u[p + 2] << 8) | u[p + 3];
    if (m === 225 && u[p + 4] === 69 && u[p + 5] === 120) r.exif = true;
    if (m >= 192 && m <= 194) { r.h = (u[p + 5] << 8) | u[p + 6]; r.w = (u[p + 7] << 8) | u[p + 8]; break; } p += 2 + n; }
  return r;
}
/* ZIP sem compressão: nomes e bytes de cada arquivo */
function unzip(b) {
  const u = new Uint8Array(b), dv = new DataView(u.buffer, u.byteOffset, u.byteLength), out = [];
  for (let p = 0; p + 30 <= u.length && dv.getUint32(p, true) === 0x04034b50;) { const n = dv.getUint32(p + 18, true), nl = dv.getUint16(p + 26, true), xl = dv.getUint16(p + 28, true);
    out.push({ nome: new TextDecoder().decode(u.subarray(p + 30, p + 30 + nl)), bytes: u.subarray(p + 30 + nl + xl, p + 30 + nl + xl + n), metodo: dv.getUint16(p + 8, true) }); p += 30 + nl + xl + n; }
  return out;
}
async function baixar(p, nome) {
  await p.getByText('Seu arquivo está pronto').waitFor({ timeout: 90000 });
  const dl = p.waitForEvent('download'); await p.locator('#b-baixar').click(); const d = await dl;
  const f = fileURLToPath(new URL(nome, saida)); await d.saveAs(f); return { nome: d.suggestedFilename(), bytes: await (await import('node:fs/promises')).readFile(f) };
}
/* fotos de exemplo do site no armazenamento local, como se viessem do aparelho */
async function porFotos(p, n) {
  await p.evaluate(async (L) => { await PLFOTOS.limpar(); let i = 1; for (const f of L) { const b = await (await fetch('../../assets/img/fotos/' + f + '.jpg')).blob(); await PLFOTOS.salvar(i++, new File([b], f + '.jpg', { type: 'image/jpeg' })); }
    sessionStorage.setItem('pl-fotos', JSON.stringify(L.map((_, k) => k + 1))); sessionStorage.removeItem('pl-quadro'); }, FOTOS.slice(0, n));
}
async function revisarEExportar(p) {
  await p.locator('#go').click(); await p.locator('#pv-dlg').waitFor({ state: 'visible' });
  const pv = await p.evaluate(() => ({ t: document.getElementById('pv-t').textContent, g: document.getElementById('pv-gt').textContent, txt: document.getElementById('pv-dlg').innerText }));
  if (await p.locator('#pv-okl').isVisible()) await p.locator('#pv-okl').click();
  await p.locator('#pv-g').click(); await p.waitForURL('**/editor/exportar/');
  return pv;
}

try {
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(srv.url + 'app/entrar/'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await p.waitForFunction(() => !!window.PLCONTA); await p.evaluate(() => PLCONTA.entrarComo('gratis'));

  console.log('Início: as colagens para as redes funcionam:');
  await p.goto(srv.url + 'app/inicio/'); await p.waitForSelector('#colags .colag__b');
  const ini = await p.evaluate(() => ({ b: document.querySelectorAll('#colags [data-colagem]').length, breve: /Em breve/i.test(document.body.innerText), banner: document.querySelector('#faixa-b3 .faixa__apoio').textContent }));
  ok(ini.b === 6 && !ini.breve, '6 colagens com «Usar este modelo» e nenhum «Em breve» na tela');
  ok(/sem gastar folha/.test(ini.banner) && !/breve/i.test(ini.banner), 'banner 3: «Monte uma colagem… sem gastar folha.»');
  await p.click('[data-colagem="mural"]'); await p.waitForURL('**/app/editor/'); await p.waitForFunction(() => window.PLEDITOR && PLEDITOR.ctx().R);
  const vz = await p.evaluate(() => { const c = PLEDITOR.ctx(), sh = document.getElementById('sheet'), r = sh.getBoundingClientRect(); return { col: c.col, peca: c.C.peca, lay: c.C.layout, rede: c.rede, vazias: sh.querySelectorAll('.pol-vazia').length, prop: r.width / r.height, modo: document.getElementById('ctx-modo').textContent }; });
  ok(vz.col && vz.peca === 'r11' && vz.lay === 'mural' && vz.rede && vz.rede.w === 1080, 'abre na Colagem, Quadrado 1:1 (1080 × 1080), layout Mural');
  ok(vz.vazias > 0 && Math.abs(vz.prop - 1) < .02, 'sem fotos: o modelo aparece com molduras vazias, na proporção 1:1 (' + vz.vazias + ')');

  console.log('Com 9 fotos, Mural do mês em uma imagem:');
  await porFotos(p, 9); await p.reload(); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 9, null, { timeout: 15000 });
  const mu = await p.evaluate(() => ({ res: document.getElementById('result-t').textContent, n: PLEDITOR.ctx().R.sheets.length, aba: document.getElementById('col-peca') ? document.getElementById('col-peca').value : null }));
  ok(mu.n === 1 && /9 polaroids por imagem · 1 imagem/.test(mu.res), 'resumo fala em imagem («' + mu.res + '»)');
  const gr0 = await p.evaluate(() => PLCONTA.direito(1, 'padrao'));
  const pv = await revisarEExportar(p);
  ok(pv.t === 'Tudo pronto para compartilhar?' && /Gerar imagens \(1 imagem\)/.test(pv.g) && !/calibrad|impressora/i.test(pv.txt), 'pré-voo para as redes: sem avisos de impressora (' + pv.g + ')');
  const ex = await p.evaluate(() => ({ vis: [...document.querySelectorAll('.fmt')].filter((l) => !l.hidden).map((l) => l.querySelector('input').value), info: document.getElementById('info-conta-t').textContent, go: document.getElementById('go-t').textContent, ppi: document.getElementById('o-ppi').hidden }));
  ok(ex.vis.join() === 'rede' && /não gasta folha/.test(ex.info) && ex.ppi, 'Exportar: só «Imagem para as redes», sem resolução e sem gastar folha');
  await p.locator('#go').click(); await p.waitForURL('**/editor/gerar/');
  const a1 = await baixar(p, 'feed-mural.png'), i1 = png(a1.bytes);
  ok(a1.nome === 'Colagem-01.png' && i1.w === 1080 && i1.h === 1080 && !i1.exif, 'PNG de 1080 × 1080, sem EXIF (' + a1.nome + ', ' + (a1.bytes.length / 1e6).toFixed(1) + ' MB)');
  const gr1 = await p.evaluate(() => PLCONTA.direito(1, 'padrao'));
  ok(gr0.usaGratis === true && gr1.usaGratis === true, 'a folha grátis do mês continua livre (imagem para as redes não gasta folha)');
  /* a imagem tem as fotos (não é um quadro branco): pixels variados no meio das polaroids */
  const var1 = await p.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = c.height = 108; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 108, 108); const d = g.getImageData(0, 0, 108, 108).data; const cores = new Set(); for (let i = 0; i < d.length; i += 16) cores.add((d[i] >> 4) + ',' + (d[i + 1] >> 4) + ',' + (d[i + 2] >> 4)); return cores.size; }, a1.bytes.toString('base64'));
  ok(var1 > 60, 'a imagem traz as fotos de verdade (' + var1 + ' tons)');
  await p.goto(srv.url + 'app/editor/compartilhar/'); await p.waitForSelector('#arqs li');
  ok(/Colagem-01\.png/.test(await p.textContent('#arqs')), 'Compartilhar recebe a imagem gerada');

  console.log('Tira em Stories 9:16, em JPEG, fundo preto:');
  await p.goto(srv.url + 'app/inicio/'); await p.waitForSelector('#colags .colag__b'); await p.click('[data-colagem="tira"]'); await p.waitForURL('**/app/editor/');
  await p.waitForFunction(() => window.PLEDITOR && PLEDITOR.ctx().C.layout === 'cabine' && document.querySelectorAll('#sheet .pol').length >= 3, null, { timeout: 15000 });
  const ti = await p.evaluate(() => ({ peca: PLEDITOR.ctx().C.peca, n: document.querySelectorAll('#sheet .pol').length, folhas: PLEDITOR.ctx().R.sheets.length }));
  ok(ti.peca === 'r916' && ti.n >= 3, 'as 9 fotos do projeto continuam e entram na Tira (' + ti.n + ' por imagem, ' + ti.folhas + ' imagens)');
  await revisarEExportar(p);
  await p.click('label:has(> input[name=tipo][value=jpeg])'); if (await p.isChecked('#zip')) await p.click('#zip-l');
  await p.locator('#go').click(); await p.waitForURL('**/editor/gerar/');
  await p.getByText('Seu arquivo está pronto').waitFor({ timeout: 90000 });
  const nArq = await p.locator('#arqs li').count();
  const dl2 = p.waitForEvent('download'); await p.locator('#b-baixar').click(); const d2 = await dl2; const f2 = fileURLToPath(new URL('feed-tira.jpg', saida)); await d2.saveAs(f2);
  const b2 = await (await import('node:fs/promises')).readFile(f2), j2 = jpg(b2);
  ok(nArq === ti.folhas && j2.w === 1080 && j2.h === 1920 && !j2.exif, nArq + ' JPEG(s) de 1080 × 1920, sem EXIF');
  const canto = await p.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/jpeg;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = 10; c.height = 10; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 1080, 1920); return [...g.getImageData(2, 2, 1, 1).data].slice(0, 3); }, b2.toString('base64'));
  ok(canto.every((v) => v < 24), 'o fundo preto do modelo está na imagem (' + canto.join(',') + ')');

  console.log('Varal: fio por trás, pregadores só na borda:');
  await p.goto(srv.url + 'app/inicio/'); await p.waitForSelector('#colags .colag__b'); await p.click('[data-colagem="varal"]'); await p.waitForURL('**/app/editor/');
  await p.waitForFunction(() => window.PLEDITOR && PLEDITOR.ctx().C.layout === 'varal' && document.querySelectorAll('#sheet .pol').length > 0, null, { timeout: 15000 });
  const va = await p.evaluate(() => { const sh = document.getElementById('sheet'), svgs = [...sh.querySelectorAll('.sheet__deco')], pol = [...sh.querySelectorAll('.pol')]; const iFio = [...sh.children].indexOf(svgs[0]), iPol = [...sh.children].indexOf(pol[0]), iPin = [...sh.children].indexOf(svgs[svgs.length - 1]);
    return { linhas: sh.querySelectorAll('.sheet__deco line').length, pinos: sh.querySelectorAll('.sheet__deco rect').length, pol: pol.length, atras: iFio < iPol, frente: iPin > iPol }; });
  ok(va.linhas > 0 && va.pinos === va.pol && va.atras && va.frente, 'o fio vem antes das polaroids e um pregador por polaroid vem depois (' + va.pinos + ')');

  console.log('Folhas em imagem e polaroids avulsas (de verdade):');
  await p.goto(srv.url + 'app/'); await p.evaluate(() => { sessionStorage.clear(); localStorage.removeItem('pl-projeto-atual'); });
  await p.evaluate(() => PLCONTA.entrarComo('pro'));
  async function exportarComo(o) {   /* pré-voo válido do projeto de exemplo (6 folhas A4), como no testar-gerar-real */
    await p.evaluate((o) => { let t = (sessionStorage.getItem('pl-quadro') || '') + '|' + (sessionStorage.getItem('pl-folhas') || '') + '|' + (sessionStorage.getItem('pl-colagem') || ''), x = 5381;
      for (let i = 0; i < t.length; i++) x = ((x << 5) + x + t.charCodeAt(i)) | 0;
      sessionStorage.setItem('pl-prevoo', JSON.stringify({ ok: true, k: String(x), n: 6, fotos: 24, por: 4, papel: 'A4', w: 210, h: 297 }));
      sessionStorage.setItem('pl-exportar', JSON.stringify(o)); }, o);
    await p.goto(srv.url + 'app/editor/gerar/');
  }
  await exportarComo({ f: 'folhas', tipo: 'png', ppi: 300, zip: true, lim: 150 });
  const z1 = await baixar(p, 'folhas.zip'), e1 = unzip(z1.bytes), f1 = e1.length ? png(e1[0].bytes) : {};
  ok(z1.nome === 'PolarLife-folhas.zip' && e1.length === 6 && e1.every((x) => x.metodo === 0 && /^Folha-0\d\.png$/.test(x.nome)), 'ZIP com 6 folhas em PNG, nomes neutros (' + e1.map((x) => x.nome).join(', ') + ')');
  ok(f1.w === 2480 && f1.h === 3508 && f1.ppm === 11811, 'cada folha A4 sai com 2480 × 3508 px e 300 DPI gravados no arquivo');
  await exportarComo({ f: 'polaroids', tipo: 'jpeg', ppi: 300, zip: true, lim: 150 });
  const z2 = await baixar(p, 'polaroids.zip'), e2 = unzip(z2.bytes), j1 = e2.length ? jpg(e2[0].bytes) : {};
  ok(e2.length === 24 && j1.w === 1039 && j1.h === 1264 && j1.dpi === 300 && !j1.exif, '24 polaroids avulsas em JPEG, 88 × 107 mm a 300 DPI (' + j1.w + ' × ' + j1.h + ')');
  await writeFile(new URL('feed-polaroid-01.jpg', saida), e2[0].bytes);
  ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await ctx.close();
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.fechar?.();
console.log(falhas ? `\n✘ feed: ${falhas} falha(s)` : '\n✔ feed: sem falhas');
process.exit(falhas ? 1 : 0);
