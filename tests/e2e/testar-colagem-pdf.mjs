// Folhas 3/0 mm, Modo Colagem (layouts e fundos: tela = PDF) e qualidade do PDF (DPI efetivo) · D-150 a D-152.
// As fotos pessoais do dono só são LIDAS (PL_FOTOS ou .local/fotos-de-teste/); nada é copiado ou derivado para o repositório (T5).
import { chromium } from 'playwright';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { createServer } from 'node:http';
import { readFile, readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from '../helpers/servidor.mjs';

const falhas = [];
const ok = (c, m) => { console.log((c ? '✔ ' : '✘ ') + m); if (!c) falhas.push(m); };
const info = m => console.log('  · ' + m);
const srv = await servir();
const pdfjsDir = fileURLToPath(new URL('../../node_modules/pdfjs-dist/build/', import.meta.url));
const srvPdfjs = createServer(async (req, res) => {
  try { res.writeHead(200, { 'content-type': 'text/javascript', 'access-control-allow-origin': '*' }).end(await readFile(join(pdfjsDir, decodeURIComponent(new URL(req.url, 'http://x').pathname)))); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => srvPdfjs.listen(0, '127.0.0.1', r));
const pdfjsUrl = `http://127.0.0.1:${srvPdfjs.address().port}/`;
const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/legenda-texto.js', 'assets/js/nucleo/gerador.js'];
const nav = await chromium.launch({ headless: true });
const erros = [];

async function novaPagina(conta = 'pro@polarlife.test') {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block', acceptDownloads: true });
  await ctx.addInitScript(c => localStorage.setItem('pl-conta', JSON.stringify({ email: c, entrouEm: Date.now() })), conta);
  const p = await ctx.newPage(); p.setDefaultTimeout(240000); p.on('pageerror', e => erros.push(String(e)));
  return p;
}
/* projeto real com 6 fotos geradas por canvas (sem fotos pessoais): cada uma com uma cor e um degradê próprios */
async function projetoGerado(p) {
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.evaluate(async () => {
    localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
    const pr = await PLPROJETOS.criar('Teste de colagem');
    for (let n = 1; n <= 6; n++) {
      const c = document.createElement('canvas'); c.width = 1200; c.height = 800; const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 1200, 0); g.addColorStop(0, `hsl(${n * 55},85%,45%)`); g.addColorStop(1, `hsl(${n * 55 + 140},85%,60%)`);
      x.fillStyle = g; x.fillRect(0, 0, 1200, 800);
      const v = x.createLinearGradient(0, 0, 0, 800); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); x.fillStyle = v; x.fillRect(0, 0, 1200, 800);
      const f = new File([await new Promise(r => c.toBlob(r, 'image/jpeg', .9))], 'g' + n + '.jpg', { type: 'image/jpeg' });
      await PLFOTOS.salvar(n, f, pr.id);
    }
    sessionStorage.setItem('pl-fotos', '[1,2,3,4,5,6]');
  });
}
async function abrirEditor(p, folhas) {
  await p.goto(srv.url + 'app/editor/');
  await p.evaluate(f => { if (f) sessionStorage.setItem('pl-folhas', JSON.stringify(f)); else sessionStorage.removeItem('pl-folhas'); }, folhas);
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0 && !!window.PLEDITOR);
  await p.waitForTimeout(250);
  for (const s of SCRIPTS) await p.addScriptTag({ url: srv.url + s });
}
const colagem = (layout, fundo) => ({ papel: 'A4', margem: 3, gap: 0, colagem: { ativo: true, layout, fundo } });

/* renderiza a página 1 do PDF e devolve as cores nos pontos (frações da folha) */
const renderizar = (p, b64, fracs, larg) => p.evaluate(async ({ pdfjsUrl, b64, fracs, larg }) => {
  const pdfjs = await import(pdfjsUrl + 'pdf.min.mjs');
  const w = await (await fetch(pdfjsUrl + 'pdf.worker.min.mjs')).text();
  pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([w], { type: 'text/javascript' }));
  const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const doc = await pdfjs.getDocument({ data: u8 }).promise, pg = await doc.getPage(1), v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: larg / v0.width });
  const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
  await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
  const g = cv.getContext('2d');
  return fracs.map(([fx, fy]) => { const d = g.getImageData(Math.round(fx * (cv.width - 1)), Math.round(fy * (cv.height - 1)), 1, 1).data; return [d[0], d[1], d[2]]; });
}, { pdfjsUrl, b64, fracs, larg });
const telaPixels = (p, png, fracs) => p.evaluate(async ({ b64, fracs }) => {
  const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const im = await createImageBitmap(new Blob([u8], { type: 'image/png' })), cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
  const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
  return fracs.map(([fx, fy]) => { const d = g.getImageData(Math.round(fx * (cv.width - 1)), Math.round(fy * (cv.height - 1)), 1, 1).data; return [d[0], d[1], d[2]]; });
}, { b64: png.toString('base64'), fracs });
const dist = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const gerarPdf = (p, mod) => p.evaluate(async mod => {
  const b64 = u8 => { let s = '', c = 0x8000; for (let i = 0; i < u8.length; i += c) s += String.fromCharCode.apply(null, u8.subarray(i, i + c)); return btoa(s); };
  const proj = PLGERADOR.projeto(); if (mod && mod.n) proj.fotos = proj.fotos.slice(0, mod.n);
  const r = await PLGERADOR.pdf(proj, {});
  return { b64: b64(r.arquivos[0].bytes), n: r.arquivos.length, bytes: r.bytes, qualidade: r.qualidade, grande: r.grande, avisos: r.avisos, falhas: r.falhas };
}, mod || null);

try {
  /* =============== 1) padrões 3/0, projetos existentes e margem mínima =============== */
  console.log('Padrões 3 mm / 0 mm (D-150):');
  const p = await novaPagina();
  await projetoGerado(p);
  await abrirEditor(p, null);
  const pad = await p.evaluate(() => ({ m: PLEDITOR.ctx().D.margem, g: PLEDITOR.ctx().D.gap, iM: document.getElementById('margem').value, iG: document.getElementById('gap').value, cM: document.getElementById('cota-margem').textContent, cG: document.getElementById('cota-gap').textContent, hg: document.getElementById('gap-h').textContent }));
  ok(pad.m === 3 && pad.g === 0 && pad.iM === '3' && pad.iG === '0' && /^3 mm$/.test(pad.cM) && /^0 mm$/.test(pad.cG), 'projeto novo: o editor abre com margem 3 mm e espaço 0 mm (campos e cotas)');
  ok(/encostadas/.test(pad.hg), 'a ajuda do espaço 0 explica que as polaroids ficam encostadas (sem o aviso antigo de 2 mm)');
  const av = await p.evaluate(() => { const a = PLPREVOO.analisar().pe.filter(t => /área não imprimível/.test(t)).length; return a; });
  ok(av === 0, 'pré-voo: margem de 3 mm (o padrão) não gera aviso de margem');
  await p.fill('#margem', '2'); await p.dispatchEvent('#margem', 'change'); await p.waitForTimeout(150);
  const av2 = await p.evaluate(() => ({ a: PLPREVOO.analisar().pe.filter(t => /área não imprimível/.test(t)).length, h: document.getElementById('margem-h').textContent }));
  ok(av2.a === 1 && /Abaixo de 3 mm/.test(av2.h), 'margem abaixo de 3 mm: aviso no pré-voo e na ajuda do campo');
  await abrirEditor(p, { papel: 'A4', margem: 10, gap: 4 });
  const sav = await p.evaluate(() => ({ m: PLEDITOR.ctx().D.margem, g: PLEDITOR.ctx().D.gap }));
  ok(sav.m === 10 && sav.g === 4, 'projeto salvo com 10/4 mantém 10 mm e 4 mm');
  const leg = await p.evaluate(async () => {
    const pr = await PLPROJETOS.criar('Antigo'); const antes = await PLPROJETOS.listar();
    const reg = antes.filter(x => x.id === pr.id)[0];
    const d = await PLFOTOS.abrirDB(); await new Promise(r => { const t = d.transaction('projetos', 'readwrite'); delete reg.v; reg.estado = { 'pl-fotos': '[1,2]' }; t.objectStore('projetos').put(reg); t.oncomplete = r; });
    sessionStorage.clear(); await PLPROJETOS.abrir(pr.id);
    const antigo = JSON.parse(sessionStorage.getItem('pl-folhas') || 'null');
    sessionStorage.clear();
    const novo = await PLPROJETOS.criar('Novo'); sessionStorage.setItem('pl-fotos', '[1,2]'); await PLPROJETOS.salvarEstado(); sessionStorage.clear(); await PLPROJETOS.abrir(novo.id);
    return { antigo, novo: sessionStorage.getItem('pl-folhas'), v: novo.v };
  });
  ok(leg.antigo && leg.antigo.margem === 10 && leg.antigo.gap === 4 && leg.novo === null && leg.v === 2, 'projeto antigo sem Folhas salvas abre com 10/4; projeto criado agora fica com o padrão novo');
  await projetoGerado(p);

  /* =============== 2) layouts da Colagem: a tela e o PDF usam as mesmas posições =============== */
  console.log('Colagem · layouts (tela = PDF, MT-02):');
  await abrirEditor(p, null);
  const layouts = await p.evaluate(() => PLCOLAGEM.LAYOUTS.map(l => l.id));
  ok(layouts.length >= 4 && layouts.length <= 6, 'o editor oferece ' + layouts.length + ' layouts: ' + layouts.join(', '));
  for (const lay of layouts) {
    await abrirEditor(p, colagem(lay, { tipo: 'cor', cor: '#336699' }));
    const r = await p.evaluate(async () => {
      const proj = PLGERADOR.projeto(); await PLGERADOR.preparar(proj); const L = PLGERADOR.lista(proj), pg = L.paginas[0], fr = proj.fr;
      const sheet = document.getElementById('sheet'), sr = sheet.getBoundingClientRect(), pxmm = sr.width / (pg.w / 1000);
      const grupos = pg.itens.filter(it => it.t === 'grupo' && it.itens.some(i => i.t === 'foto'));
      let pior = 0, ang = 0, n = 0, fora = 0;
      const M = proj.s.margem;
      grupos.forEach(g => {
        const f = g.itens.find(i => i.t === 'foto'), m = g.m;
        const cx = (m[0] * fr.w / 2 * 1000 + m[2] * fr.h / 2 * 1000 + m[4]) / 1000, cy = (m[1] * fr.w / 2 * 1000 + m[3] * fr.h / 2 * 1000 + m[5]) / 1000;
        const pol = sheet.querySelector('.pol[data-n="' + f.n + '"] .pol__in'); if (!pol) return;
        const b = pol.getBoundingClientRect(), dx = (b.left + b.width / 2 - sr.left) / pxmm - cx, dy = (b.top + b.height / 2 - sr.top) / pxmm - cy;
        pior = Math.max(pior, Math.hypot(dx, dy));
        const t = getComputedStyle(pol).transform, mm = t && t !== 'none' ? t.match(/-?[\d.e-]+/g).map(Number) : [1, 0], a1 = Math.atan2(mm[1], mm[0]) * 180 / Math.PI, a2 = Math.atan2(m[1], m[0]) * 180 / Math.PI;
        let da = Math.abs(a1 - a2) % 360; if (da > 180) da = 360 - da; ang = Math.max(ang, da); n++;
        const k = Math.hypot(m[0], m[1]), e = k * (Math.abs(fr.w * Math.cos(a2 * Math.PI / 180)) + Math.abs(fr.h * Math.sin(a2 * Math.PI / 180))) / 2, e2 = k * (Math.abs(fr.w * Math.sin(a2 * Math.PI / 180)) + Math.abs(fr.h * Math.cos(a2 * Math.PI / 180))) / 2;
        if (cx - e < M - .01 || cx + e > pg.w / 1000 - M + .01 || cy - e2 < M - .01 || cy + e2 > pg.h / 1000 - M + .01) fora++;
      });
      const C = PLEDITOR.ctx(), FRr = C.FR, cobr = Math.max(...C.R.sheets.map(sh => PLCOLAGEM.cobertura(sh.cells, FRr.w, FRr.h, { x0: FRr.lado / FRr.w, x1: (FRr.w - FRr.lado) / FRr.w, y0: FRr.topo / FRr.h, y1: (FRr.topo + FRr.jh) / FRr.h })));
      const cartao = document.getElementById('result-t').textContent, maxCel = Math.max(...C.R.sheets.map(sh => sh.cells.length));
      return { cobr, cartao, maxCel, nFolhas: C.R.sheets.length, n, total: grupos.length, pior, ang, fora, folhas: L.paginas.length, noDom: sheet.querySelectorAll('.pol').length, guias: pg.itens.filter(i => i.t === 'linha').length, fundo: pg.itens[0].t, contornos: pg.itens.filter(i => i.t === 'grupo' && i.itens.some(x => x.t === 'ret')).length };
    });
    ok(r.n === r.total && r.n > 0 && r.pior < 0.08 && r.ang < 0.05, `${lay}: ${r.n} polaroids, centro tela × PDF até ${r.pior.toFixed(3)} mm e ângulo até ${r.ang.toFixed(3)}°`);
    ok(r.cobr <= 0.21, `${lay}: com a janela real da foto, no máximo ${(r.cobr * 100).toFixed(1)}% de uma foto fica coberta por outra polaroid (limite de 20%)`);
    ok(r.cartao === `${r.maxCel} ${r.maxCel === 1 ? 'polaroid' : 'polaroids'} por folha · ${r.nFolhas} ${r.nFolhas === 1 ? 'folha' : 'folhas'}` && !/aproveitamento/.test(r.cartao), `${lay}: o cartão do Inspetor mostra a contagem real da Colagem («${r.cartao}»)`);
    ok(r.fora === 0 && r.guias === 0 && r.fundo === 'fundo' && r.contornos === r.n, `${lay}: dentro da margem, sem guias de corte, fundo antes de tudo e contorno em cada polaroid (${r.folhas} folha(s) para 6 fotos)`);
  }

  console.log('Colagem · barra lateral e moldura branca:');
  await abrirEditor(p, { papel: 'A4', margem: 3, gap: 0 });
  const bl0 = await p.evaluate(() => ({ colagem: document.getElementById('rail-colagem').disabled, em: !!document.querySelector('#rail-colagem em'), on: document.getElementById('rail-colagem').classList.contains('is-on'), fol: document.getElementById('rail-folhas').classList.contains('is-on'), memo: [...document.querySelectorAll('.rail__i')].filter(b => /Lembran/.test(b.textContent)).map(b => b.disabled && /Em breve/.test(b.textContent))[0], card: document.getElementById('result-t').textContent }));
  ok(bl0.colagem === false && !bl0.em && !bl0.on && bl0.fol && bl0.memo === true, 'barra lateral: «Colagem» ativa (sem «Em breve»), «Folhas» marcada, «Lembranças» continua «Em breve»');
  ok(/aproveitamento/.test(bl0.card), 'Folhas comuns: o cartão continua mostrando o aproveitamento da grade');
  await p.click('#rail-colagem'); await p.waitForTimeout(200);
  const bl1 = await p.evaluate(() => ({ on: document.getElementById('rail-colagem').classList.contains('is-on'), fol: document.getElementById('rail-folhas').classList.contains('is-on'), ativo: PLEDITOR.ctx().D.colagem.ativo, modo: document.getElementById('ctx-modo').textContent, saved: JSON.parse(sessionStorage.getItem('pl-folhas')).colagem.ativo }));
  ok(bl1.on && !bl1.fol && bl1.ativo === true && bl1.saved === true && bl1.modo === 'Modo Colagem', 'clicar em «Colagem» liga o Modo Colagem (e salva no projeto)');
  await p.click('#rail-folhas'); await p.waitForTimeout(200);
  const bl2 = await p.evaluate(() => ({ on: document.getElementById('rail-colagem').classList.contains('is-on'), fol: document.getElementById('rail-folhas').classList.contains('is-on'), ativo: PLEDITOR.ctx().D.colagem.ativo }));
  ok(!bl2.on && bl2.fol && bl2.ativo === false, 'clicar em «Folhas» desliga o Modo Colagem');
  await abrirEditor(p, colagem('grade', { tipo: 'cor', cor: '#D84B20' }));
  {
    const cel = await p.evaluate(() => { const c = PLEDITOR.ctx().R.sheets[0].cells[0], P = PLEDITOR.ctx().R.p; return [(c.x + 3) / P.w, (c.y + c.h - 3) / P.h]; });
    const png = await p.locator('#sheet').screenshot(), tl = (await telaPixels(p, png, [cel]))[0], g = await gerarPdf(p, { n: 4 }), pd = (await renderizar(p, g.b64, [cel], 420))[0];
    ok(tl.every(v => v >= 240) && pd.every(v => v >= 240), `a moldura da polaroid é branca sobre o fundo colorido, na tela (${tl}) e no PDF (${pd})`);
  }

  /* =============== 3) fundos: cor, degradê e foto, tela = PDF =============== */
  console.log('Colagem · fundos (tela = PDF):');
  const pts = [[.008, .006], [.992, .006], [.008, .994], [.992, .994], [.5, .006], [.5, .994]];
  async function confere(nome, fundo, tol) {
    await abrirEditor(p, colagem('grade', fundo));
    if (fundo.tipo === 'foto') await p.waitForFunction(() => !!document.querySelector('#sheet .sheet__fundo'), null, { timeout: 20000 });
    await p.waitForTimeout(400);
    const png = await p.locator('#sheet').screenshot();
    const tela = await telaPixels(p, png, pts), g = await gerarPdf(p, { n: 4 });
    const pdf = await renderizar(p, g.b64, pts, 420);
    const d = Math.max(...tela.map((t, i) => dist(t, pdf[i])));
    ok(d <= tol, `${nome}: cor nos cantos e bordas igual na tela e no PDF (maior diferença ${d} de 255)`);
    return { tela, pdf };
  }
  const c1 = await confere('cor sólida #D84B20 (livre, fora da paleta)', { tipo: 'cor', cor: '#D84B20' }, 6);
  ok(c1.pdf.every(c => dist(c, [216, 75, 32]) <= 6), 'cor sólida: o PDF pinta exatamente a cor escolhida');
  const g1 = await confere('degradê 2 cores a 135°', { tipo: 'gradiente', cor: '#112233', cor2: '#FFCC00', ang: 135 }, 10);
  ok(dist(g1.pdf[0], g1.pdf[3]) > 120, 'degradê: o PDF vai de uma cor a outra (canto a canto)');
  const f1 = await confere('foto padrão (a primeira do projeto)', { tipo: 'foto', foto: null, suave: 0 }, 28);
  const f3 = await confere('foto específica (a 3ª)', { tipo: 'foto', foto: 3, suave: 0 }, 28);
  ok(f1.pdf.some((c, i) => dist(c, f3.pdf[i]) > 40) && f1.tela.some((c, i) => dist(c, f3.tela[i]) > 40), 'escolher outra foto muda o fundo na tela e no PDF');
  const f4 = await confere('foto com posição 100% / 0%', { tipo: 'foto', foto: 3, suave: 0, px: 100, py: 0 }, 28);
  ok(f4.pdf.some((c, i) => dist(c, f3.pdf[i]) > 25), 'a posição da foto de fundo desloca o recorte (cover) no PDF');
  const f5 = await confere('foto suavizada (100%)', { tipo: 'foto', foto: 3, suave: 100 }, 40);
  const claro = a => a.reduce((t, c) => t + c[0] + c[1] + c[2], 0) / (a.length * 3);
  ok(claro(f5.pdf) > claro(f3.pdf) + 15 && claro(f5.tela) > claro(f3.tela) + 15, 'suavizar clareia o fundo na tela e no PDF');

  /* =============== 4) qualidade do PDF: DPI efetivo, original sem recompressão =============== */
  console.log('Qualidade do PDF (D-152):');
  const cands = [process.env.PL_FOTOS, fileURLToPath(new URL('../../.local/fotos-de-teste/', import.meta.url)), fileURLToPath(new URL('../../../../.local/fotos-de-teste/', import.meta.url))].filter(Boolean);
  let dir = null; for (const c of cands) { try { if ((await stat(c)).isDirectory()) { dir = c; break; } } catch { } }
  if (!dir) console.log('– fotos reais ausentes: medição com fotos pessoais pulada');
  else {
    const arqs = (await readdir(dir)).filter(x => /\.jpe?g$/i.test(x)).slice(0, 6).map(x => join(dir, x));
    const q = await novaPagina('pro@polarlife.test');
    await q.goto(srv.url + 'app/adicionar-fotos/');
    await q.evaluate(() => { const i = document.createElement('input'); i.id = 'reais'; i.type = 'file'; i.multiple = true; document.body.appendChild(i); });
    await q.setInputFiles('#reais', arqs);
    const orig = await q.evaluate(async () => {
      localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
      const pr = await PLPROJETOS.criar('Qualidade real'), fs = [...document.querySelector('#reais').files], out = [];
      for (let i = 0; i < fs.length; i++) { const r = await PLFOTOS.salvar(i + 1, fs[i], pr.id); out.push({ w: r.w, h: r.h, bytes: fs[i].size }); }
      sessionStorage.setItem('pl-fotos', JSON.stringify(fs.map((_, i) => i + 1))); return out;
    });
    await abrirEditor(q, null);
    const medir = (q, plano) => q.evaluate(async plano => {
      localStorage.setItem('pl-conta', JSON.stringify({ email: plano + '@polarlife.test', entrouEm: Date.now() }));
      const b64 = u8 => { let s = '', c = 0x8000; for (let i = 0; i < u8.length; i += c) s += String.fromCharCode.apply(null, u8.subarray(i, i + c)); return btoa(s); };
      const proj = PLGERADOR.projeto(); const t0 = performance.now();
      const r = await PLGERADOR.pdf(proj, {});
      return { b64: b64(r.arquivos[0].bytes), bytes: r.bytes, ms: performance.now() - t0, q: r.qualidade, grande: r.grande, n: r.arquivos.length, falhas: r.falhas };
    }, plano);
    /* antes (comportamento anterior): 326 PPI fixo, JPEG 0,92, sempre pelo canvas */
    const antes = await q.evaluate(async () => {
      const proj = PLGERADOR.projeto(), out = [];
      for (const f of proj.fotos) { const r = await PLGERADOR.foto(proj, f.n, 326, .92); out.push({ n: f.n, dpi: r.dpi, bytes: r.bytes.length }); }
      return out;
    });
    const pro = await medir(q, 'pro'), gr = await medir(q, 'gratis');
    const mb = n => (n / 1048576).toFixed(1) + ' MB', fo = x => x.q.filter(i => i.n !== 'fundo').sort((a, b) => a.n - b.n);
    const natv = i => orig[i - 1];
    console.log('  Foto | original px (MB) | ANTES dpi/MB | PRO dpi/MB (modo) | GRÁTIS dpi/MB');
    fo(pro).forEach((i, k) => { const g2 = fo(gr)[k], a = antes[k]; console.log(`  ${i.n}    | ${natv(i.n).w}×${natv(i.n).h} (${mb(natv(i.n).bytes)}) | ${a.dpi} / ${mb(a.bytes)} | ${i.dpi} / ${mb(i.bytes)} (${i.original ? 'original' : 'reamostrada'}) | ${g2.dpi} / ${mb(g2.bytes)}`); });
    info(`PDF inteiro, ${arqs.length} fotos, Folhas 3/0: ANTES ${mb(antes.reduce((t, x) => t + x.bytes, 0))} de imagens · PRO ${mb(pro.bytes)} (${(pro.ms / 1000).toFixed(1)} s) · GRÁTIS ${mb(gr.bytes)} (${(gr.ms / 1000).toFixed(1)} s)`);
    ok(pro.falhas.length === 0 && gr.falhas.length === 0 && pro.n === 1 && gr.n === 1, 'os dois PDFs saem completos, em um arquivo');
    ok(fo(pro).every(i => i.dpi >= 300), 'Pro: nenhuma foto abaixo de 300 PPI efetivos');
    ok(fo(gr).every(i => i.dpi >= 300 && i.dpi <= 600), 'Grátis: de 300 a 600 PPI efetivos (nunca abaixo de 300 quando o original permite)');
    ok(fo(pro).filter(i => i.original).length >= 1, 'Pro: pelo menos uma foto entra como JPEG original, sem recompressão (' + fo(pro).filter(i => i.original).length + ' de ' + fo(pro).length + ')');
    ok(fo(gr).every(i => !i.original), 'Grátis: reamostra (original inteiro seria grande demais para o limite de 150 MB)');
    /* dentro do PDF: dimensões das imagens e ausência de EXIF/GPS */
    const proBytes = Buffer.from(pro.b64, 'base64'), doc = await PDFDocument.load(proBytes), dims = [];
    for (const [, o] of doc.context.enumerateIndirectObjects()) { if (!(o instanceof PDFRawStream)) continue; const s = o.dict.lookup(PDFName.of('Subtype')); if (!s || s.toString() !== '/Image') continue; dims.push([o.dict.lookup(PDFName.of('Width')).asNumber(), o.dict.lookup(PDFName.of('Height')).asNumber()]); }
    const originais = fo(pro).filter(i => i.original);
    ok(originais.every(i => dims.some(([w, h]) => (w === orig[i.n - 1].w && h === orig[i.n - 1].h) || (w === orig[i.n - 1].h && h === orig[i.n - 1].w))), 'Pro: as imagens no PDF têm a resolução dos pixels do original (sem reduzir)');
    ok(!proBytes.includes(Buffer.from('Exif\0\0')) && !proBytes.includes(Buffer.from('<x:xmpmeta')) && !proBytes.includes(Buffer.from('http://ns.adobe.com/xap')), 'o original embutido vai sem EXIF, GPS nem XMP (BR-07, T5)');
    const dir2 = fileURLToPath(new URL('../saida/', import.meta.url)); await mkdir(dir2, { recursive: true });
    await writeFile(join(dir2, 'qualidade-pro.pdf'), proBytes); await writeFile(join(dir2, 'qualidade-gratis.pdf'), Buffer.from(gr.b64, 'base64'));
    /* o original (matriz + clip) e o canvas mostram a mesma coisa: diferença média pequena na página 1 */
    const dif = await q.evaluate(async ({ pdfjsUrl, a, b }) => {
      const pdfjs = await import(pdfjsUrl + 'pdf.min.mjs'); const w = await (await fetch(pdfjsUrl + 'pdf.worker.min.mjs')).text();
      pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([w], { type: 'text/javascript' }));
      const rend = async b64 => { const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); const d = await pdfjs.getDocument({ data: u8 }).promise, pg = await d.getPage(1), vp = pg.getViewport({ scale: 1.2 }); const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height); await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; };
      const A = await rend(a), B = await rend(b); let s = 0, n = 0; for (let i = 0; i < A.length; i += 16) { s += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]); n += 3; }
      return s / n;
    }, { pdfjsUrl, a: pro.b64, b: gr.b64 });
    ok(dif < 7, `JPEG original (matriz + recorte) × reamostrado pelo canvas: diferença média ${dif.toFixed(2)} de 255 na página 1 (MT-02)`);
    ok(pro.grande === (pro.bytes > 150 * 1048576) && gr.grande === (gr.bytes > 150 * 1048576), 'o resultado marca «grande» só acima de 150 MB (' + mb(pro.bytes) + ')');
    await q.context().close();
  }
  ok(erros.length === 0, 'nenhum erro de página durante o teste' + (erros.length ? ': ' + erros[0] : ''));
} finally { await nav.close(); srv.fechar(); srvPdfjs.close(); }
console.log(falhas.length ? `\n✘ colagem e qualidade: ${falhas.length} falha(s)` : '\n✔ colagem e qualidade: sem falhas');
process.exit(falhas.length ? 1 : 0);
