#!/usr/bin/env node
// Teste do motor do gerador de PDF (T-30a): display list, fontes, imagens, volumes e renderização.
// Uso: npm run testar:pdf  (Chromium do Playwright + pdfjs-dist)
import { chromium } from 'playwright';
import { PDFDocument, PDFDict, PDFName, PDFRawStream } from 'pdf-lib';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from '../helpers/servidor.mjs';

const falhas = [];
const ok = (c, m) => { if (c) console.log('  ✔ ' + m); else { falhas.push(m); console.log('  ✘ ' + m); } };
const b64ToBytes = b64 => Uint8Array.from(Buffer.from(b64, 'base64'));
const perto = (a, b, e = 0.01) => Math.abs(a - b) < e;
const A4 = [210 * 72 / 25.4, 297 * 72 / 25.4];

const srv = await servir();
const pdfjsDir = fileURLToPath(new URL('../../node_modules/pdfjs-dist/build/', import.meta.url));
const srvPdfjs = createServer(async (req, res) => {
  try {
    const p = join(pdfjsDir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    res.writeHead(200, { 'content-type': 'text/javascript', 'access-control-allow-origin': '*' }).end(await readFile(p));
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => srvPdfjs.listen(0, '127.0.0.1', r));
const pdfjsUrl = `http://127.0.0.1:${srvPdfjs.address().port}/`;

const nav = await chromium.launch();
const page = await (await nav.newContext({ serviceWorkers: 'block' })).newPage(); // sem SW: o teste intercepta a rede com page.route (o SW do editor serviria do cache)
await page.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() }))); // sessão de teste: a guarda de /app/ exige conta (D-123)
page.setDefaultTimeout(240000);
const errosPg = [];
page.on('pageerror', e => errosPg.push(String(e)));
try {
  await page.goto(srv.url + 'app/editor/', { waitUntil: 'networkidle' });
  for (const src of ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/legenda-texto.js', 'assets/js/nucleo/gerador.js'])
    await page.addScriptTag({ url: srv.url + src });
  ok(await page.evaluate(() => !!(window.PDFLib && window.fontkit && window.PLTEXTO && window.PLGERADOR)), 'bibliotecas e módulos carregados');
  ok(errosPg.length === 0, 'editor carrega sem erro de página' + (errosPg.length ? ': ' + errosPg[0] : ''));

  const gerar = (op, mod) => page.evaluate(async ({ op, mod }) => {
    const b64 = u8 => { let s = '', c = 0x8000; for (let i = 0; i < u8.length; i += c) s += String.fromCharCode.apply(null, u8.subarray(i, i + c)); return btoa(s); };
    const p = PLGERADOR.projeto();
    if (mod && mod.s) for (const k in mod.s) p.s[k] = mod.s[k];
    if (mod && mod.fr) for (const k in mod.fr) p.fr[k] = mod.fr[k];
    try {
      const r = await PLGERADOR.pdf(p, op || {});
      return { ok: true, falhas: r.falhas, avisos: r.avisos || [], arquivos: r.arquivos.map(a => ({ nome: a.nome, b64: b64(a.bytes) })) };
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }, { op: op || {}, mod: mod || null });

  const contarImagens = doc => {
    let jpg = 0, png = 0;
    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      if (!(obj instanceof PDFRawStream)) continue;
      const sub = obj.dict.lookup(PDFName.of('Subtype'));
      if (!sub || sub.toString() !== '/Image') continue;
      const filtro = obj.dict.lookup(PDFName.of('Filter'));
      const s = filtro ? filtro.toString() : '';
      if (s.includes('DCTDecode')) jpg++; else png++;
    }
    return { jpg, png };
  };
  const dimsJpeg = doc => {
    const out = [];
    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      if (!(obj instanceof PDFRawStream)) continue;
      const sub = obj.dict.lookup(PDFName.of('Subtype'));
      if (!sub || sub.toString() !== '/Image') continue;
      const filtro = obj.dict.lookup(PDFName.of('Filter'));
      if (!filtro || !filtro.toString().includes('DCTDecode')) continue;
      out.push({ w: obj.dict.lookup(PDFName.of('Width')).asNumber(), h: obj.dict.lookup(PDFName.of('Height')).asNumber() });
    }
    return out;
  };
  const nomesFonte = doc => {
    const nomes = [];
    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      if (!(obj instanceof PDFDict)) continue;
      const bf = obj.lookup(PDFName.of('BaseFont'));
      if (bf) nomes.push(bf.toString());
    }
    return nomes;
  };

  const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/legenda-texto.js', 'assets/js/nucleo/gerador.js'];
  async function carregarEditor({ leg = null, fr = null, folhas = null, txt = null, orientacao = null } = {}) {
    await page.evaluate(({ leg, fr, folhas, txt, orientacao }) => {
      const f = fr || { w: 88, h: 107, jh: 76, lado: 6, topo: 6, rad: 0.4, ori: 'v' };
      const q = [{ fr: f }];
      if (leg) q[0].leg = leg;
      for (let i = 1; i <= 24; i++) q.push(txt ? { src: i, txt } : { src: i });
      sessionStorage.setItem('pl-quadro', JSON.stringify(q));
      if (folhas) sessionStorage.setItem('pl-folhas', JSON.stringify(folhas)); else sessionStorage.removeItem('pl-folhas');
      if (orientacao) sessionStorage.setItem('pl-orientacao', orientacao); else sessionStorage.removeItem('pl-orientacao');
    }, { leg, fr, folhas, txt, orientacao });
    await page.reload({ waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts ? document.fonts.ready.then(() => true) : true);
    await page.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0);
    for (const src of SCRIPTS) await page.addScriptTag({ url: srv.url + src });
  }

  async function fidelidade(opcoes) {
    await carregarEditor(opcoes);
    return page.evaluate(async () => {
      const p = PLGERADOR.projeto();
      await PLGERADOR.preparar(p);
      const L = PLGERADOR.lista(p);
      const pg = L.paginas[0];
      const sheet = document.getElementById('sheet');
      const sr = sheet.getBoundingClientRect();
      const pxmm = sr.width / (pg.w / 1000);
      const rel = el => { const r = el.getBoundingClientRect(); return { x: (r.left - sr.left) / pxmm, y: (r.top - sr.top) / pxmm, w: r.width / pxmm, h: r.height / pxmm }; };
      const dom = Array.from(sheet.querySelectorAll('.pol')).map(pol => {
        const q = sel => pol.querySelector(sel);
        return { n: +pol.dataset.n, in: rel(q('.pol__in')), ph: rel(q('.pol__ph')),
          cap: q('.pol__cap') ? rel(q('.pol__cap')) : null,
          meta: q('.pol__meta') ? rel(q('.pol__meta')) : null,
          sig: q('.pol__sig') ? rel(q('.pol__sig')) : null };
      });
      const mul = (A, B) => ({ a: A.a * B.a + A.c * B.b, b: A.b * B.a + A.d * B.b, c: A.a * B.c + A.c * B.d, d: A.b * B.c + A.d * B.d, e: A.a * B.e + A.c * B.f + A.e, f: A.b * B.e + A.d * B.f + A.f });
      const I = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
      const box = (x, y, w, h, M) => {
        const pts = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([px, py]) => ({ x: M.a * px + M.c * py + M.e, y: M.b * px + M.d * py + M.f }));
        const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
        return { x: Math.min(...xs) / 1000, y: Math.min(...ys) / 1000, w: (Math.max(...xs) - Math.min(...xs)) / 1000, h: (Math.max(...ys) - Math.min(...ys)) / 1000 };
      };
      const findFoto = items => {
        for (const it of items) {
          if (it.t === 'foto') return it.n;
          if (it.t === 'grupo') { const n = findFoto(it.itens); if (n) return n; }
        }
        return 0;
      };
      const flat = (items, M, out) => {
        for (const it of items) {
          if (it.t === 'grupo') {
            const m = it.m;
            flat(it.itens, mul(M, { a: m[0], b: m[1], c: m[2], d: m[3], e: m[4], f: m[5] }), out);
          } else if (it.t === 'foto') out.push({ t: 'foto', n: it.n, ...box(it.x, it.y, it.w, it.h, M) });
          else if (it.t === 'texto') {
            const f = { fam: it.fonte.fam, peso: it.fonte.peso, it: it.fonte.it, pt: it.pt, esp: it.esp };
            const w = PLGERADOR.medir(it.txt, f), m = PLGERADOR.metricas(f), size = it.pt * 25.4 * 1000 / 72;
            const lh = it.lh || 1.2, top = it.top == null ? it.y - ((lh - (m.asc + m.desc)) / 2 + m.asc) * size : it.top;
            /* getBoundingClientRect() devolve a caixa de linha; o topo é comparado com a linha e a T4 com o glifo. */
            out.push({ t: 'texto', txt: it.txt, ...box(it.x, top, w, lh * size, M), glyph: box(it.x, it.y - m.asc * size, w, (m.asc + m.desc) * size, M) });
          } else if (it.t === 'img') out.push({ t: 'img', ...box(it.x, it.y, it.w, it.h, M) });
          else if (it.t === 'ret') out.push({ t: 'ret', ...box(it.x, it.y, it.w, it.h, M) });
        }
      };
      const byN = {}, frames = {}, bandas = {};
      pg.itens.forEach(it => {
        if (it.t !== 'grupo') return;
        const n = findFoto(it.itens);
        if (!n) return;
        const out = [];
        flat([it], I, out);
        byN[n] = out;
        const m = it.m, M = { a: m[0], b: m[1], c: m[2], d: m[3], e: m[4], f: m[5] };
        frames[n] = box(0, 0, p.fr.w * 1000, p.fr.h * 1000, M);
        const bx = p.fr.w / 2 * 1000, by = p.fr.h * 1000;
        bandas[n] = { x: (M.a * bx + M.c * by + M.e) / 1000, y: (M.b * bx + M.d * by + M.f) / 1000 };
      });
      const capTxts = {};
      p.fotos.forEach(f => { capTxts[f.n] = p.leg ? (p.leg.txt.on ? PLTEXTO.caixaLG(f.leg, p.leg.txt.caixa) : '') : (f.leg || ''); });
      const ext = p.fr.ori === 'h' ? { w: p.fr.h, h: p.fr.w } : { w: p.fr.w, h: p.fr.h };
      const R = PLFOLHAS.paginar(p.s, ext, p.fotos);
      const cells = R.sheets[0].cells.map(c => ({ n: c.f.n, x: c.x, y: c.y, w: c.w, h: c.h, giro: c.giro }));
      return { pxmm, dom, cells, frames, bandas, byN, capTxts, fr: p.fr, page: { w: pg.w / 1000, h: pg.h / 1000 } };
    });
  }

  async function fidelidadeFoto(n) {
    await page.evaluate(() => {
      sessionStorage.removeItem('pl-quadro');
      sessionStorage.removeItem('pl-fotos');
      sessionStorage.removeItem('pl-folhas');
    });
    /* O Quadro só lê #foto-N ao abrir a página (etapa 28): trocar só o hash não recarrega, então passa por about:blank. */
    await page.goto('about:blank');
    await page.goto(srv.url + 'app/editor/quadro/#foto-' + n, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#clip .ph svg'));
    for (const src of SCRIPTS) await page.addScriptTag({ url: srv.url + src });
    const foto = await page.evaluate(async fotoN => {
      const p = PLGERADOR.projeto();
      const r = await PLGERADOR.foto(p, fotoN, 300, 0.9);
      let s = '';
      for (let i = 0; i < r.bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, r.bytes.subarray(i, i + 0x8000));
      return { b64: btoa(s), w: r.wpx, h: r.hpx };
    }, n);
    /* Só a janela da foto: o cabeçalho fixo do editor e o esqueleto cobriam parte do #clip e entravam na comparação. */
    await page.addStyleTag({ content: 'body *{visibility:hidden!important}#clip,#clip *{visibility:visible!important}' });
    await page.locator('#clip').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const captura = (await page.locator('#clip').screenshot({ type: 'png' })).toString('base64');
    const resultado = await page.evaluate(async ({ captura, foto }) => {
      const carregar = src => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
      const quadro = await carregar('data:image/png;base64,' + captura);
      const raster = await carregar('data:image/jpeg;base64,' + foto.b64);
      const cv = document.createElement('canvas'), g = cv.getContext('2d');
      cv.width = foto.w; cv.height = foto.h;
      g.imageSmoothingQuality = 'high';
      g.drawImage(quadro, 0, 0, quadro.width, quadro.height, 0, 0, cv.width, cv.height);
      const a = g.getImageData(0, 0, cv.width, cv.height).data;
      g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(raster, 0, 0, raster.width, raster.height, 0, 0, cv.width, cv.height);
      const b = g.getImageData(0, 0, cv.width, cv.height).data;
      const soma = [0, 0, 0], q = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], cont = [0, 0, 0, 0];
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
        const i = (y * cv.width + x) * 4, k = (y < cv.height / 2 ? 0 : 2) + (x < cv.width / 2 ? 0 : 1);
        cont[k]++;
        for (let c = 0; c < 3; c++) { const d = Math.abs(a[i + c] - b[i + c]); soma[c] += d; q[k][c] += d; }
      }
      return { media: soma.map(v => v / (cv.width * cv.height)), quadrantes: q.map((v, i) => v.map(x => x / cont[i])) };
    }, { captura, foto });
    /* carregarEditor() recarrega a página atual: volta ao editor para os próximos testes. */
    await page.goto(srv.url + 'app/editor/', { waitUntil: 'networkidle' });
    return resultado;
  }

  const uniao = boxes => {
    const v = boxes.filter(Boolean);
    if (!v.length) return null;
    const x1 = Math.min(...v.map(b => b.x)), y1 = Math.min(...v.map(b => b.y));
    const x2 = Math.max(...v.map(b => b.x + b.w)), y2 = Math.max(...v.map(b => b.y + b.h));
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  };
  const contem = (a, b) => !!a && !!b && b.x >= a.x - 1e-6 && b.y >= a.y - 1e-6 && b.x + b.w <= a.x + a.w + 1e-6 && b.y + b.h <= a.y + a.h + 1e-6;
  const cruza = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.01 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.01;
  let desvio = 0, desvioMax = 0;
  const marca = d => { if (d > desvio) desvio = d; if (d > desvioMax) desvioMax = d; };
  const comparaBox = (rotulo, a, b, tol) => {
    if (!a || !b) return rotulo + ': caixa ausente';
    const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y), dw = Math.abs(a.w - b.w), dh = Math.abs(a.h - b.h);
    marca(Math.max(dx, dy, dw, dh));
    return (dx > tol || dy > tol || dw > tol || dh > tol)
      ? rotulo + ': Δx=' + dx.toFixed(3) + ' Δy=' + dy.toFixed(3) + ' Δw=' + dw.toFixed(3) + ' Δh=' + dh.toFixed(3) + ' > ' + tol
      : null;
  };
  const comparaTexto = (rotulo, a, b) => {
    if (!a || !b) return rotulo + ': caixa ausente';
    const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
    marca(Math.max(dx, dy));
    return (dx > 0.2 || dy > 0.2) ? rotulo + ': Δx=' + dx.toFixed(3) + ' Δy=' + dy.toFixed(3) : null;   // DOC-08 MT-02: texto ±0,2 mm (o rasterizador de cada sistema varia)
  };

  const conferirFidelidade = async (nome, opcoes) => {
    desvio = 0;
    const r = await fidelidade(opcoes);
    const erros = [];
    if (r.dom.length !== 4) erros.push('T-07 tem ' + r.dom.length + ' polaroids, esperado 4');
    for (const d of r.dom) {
      const boxes = r.byN[d.n] || [];
      const foto = boxes.find(b => b.t === 'foto');
      const img = boxes.find(b => b.t === 'img');
      const texts = boxes.filter(b => b.t === 'texto');
      const rets = boxes.filter(b => b.t === 'ret');
      const capText = texts.find(b => b.txt === r.capTxts[d.n]);
      const capRet = rets.find(b => capText && contem(b, capText));
      const cap = capRet || capText;
      const metaTexts = texts.filter(b => b !== capText);
      const metaRets = rets.filter(b => metaTexts.some(t => contem(b, t)));
      const meta = uniao(metaTexts.concat(metaRets));
      const e = [
        comparaBox('moldura ' + d.n, d.in, r.frames[d.n], 0.05),
        comparaBox('janela ' + d.n, d.ph, foto, 0.05),
        comparaBox('assinatura ' + d.n, d.sig, img, 0.1),
        comparaTexto('legenda ' + d.n, d.cap, cap),
        comparaTexto('meta ' + d.n, d.meta, meta)
      ].filter(Boolean);
      erros.push(...e);
      for (const t of texts) if (foto && cruza(t.glyph, foto)) erros.push('T4: texto «' + t.txt + '» cruza a foto ' + d.n);
    }
    ok(!erros.length, 'MT-02 ' + nome + (erros.length ? ' — ' + erros[0] : '') + ' · desvio ' + desvio.toFixed(3) + ' mm');
    if (erros.length > 1) console.log('       ' + erros.slice(1, 4).join(' · '));
  };

  const conferirHorizontal = async () => {
    desvio = 0;
    const r = await fidelidade({ fr: { w: 88, h: 107, jh: 76, lado: 6, topo: 6, rad: 0.4, ori: 'h' }, folhas: { papel: 'A4', girar: false } });
    const erros = [];
    if (!r.cells.length) erros.push('sem células');
    for (const c of r.cells) {
      const f = r.frames[c.n], b = r.bandas[c.n], boxes = r.byN[c.n] || [];
      const foto = boxes.find(x => x.t === 'foto'), texts = boxes.filter(x => x.t === 'texto');
      if (!f) { erros.push('sem moldura ' + c.n); continue; }
      if (f.x < c.x - 0.01 || f.y < c.y - 0.01 || f.x + f.w > c.x + c.w + 0.01 || f.y + f.h > c.y + c.h + 0.01) erros.push('moldura ' + c.n + ' fora da célula');
      if (Math.abs(f.w - r.fr.h) > 0.01 || Math.abs(f.h - r.fr.w) > 0.01) erros.push('moldura ' + c.n + ' não está girada');
      if (!(b && b.x < c.x + c.w / 2)) erros.push('faixa grossa ' + c.n + ' não está à esquerda');
      for (const t of texts) if (foto && cruza(t, foto)) erros.push('T4: texto «' + t.txt + '» cruza a foto ' + c.n);
    }
    ok(!erros.length, 'MT-02 Horizontal (girada, dentro da célula, faixa à esquerda)' + (erros.length ? ' — ' + erros[0] : ''));
    if (erros.length > 1) console.log('       ' + erros.slice(1, 4).join(' · '));
    return r;
  };

  console.log('PDF padrão:');
  const r1 = await gerar({ f: 'pdf' });
  ok(r1.ok && r1.arquivos.length === 1 && r1.arquivos[0].nome === 'Polar-Life.pdf', 'gera Polar-Life.pdf');
  ok(r1.ok && r1.avisos.length === 0, 'sem avisos de encodeText' + (r1.avisos.length ? ': ' + JSON.stringify(r1.avisos.slice(0, 2)) : ''));
  const b1 = b64ToBytes(r1.arquivos[0].b64), doc1 = await PDFDocument.load(b1, { updateMetadata: false });
  ok(doc1.getPageCount() === 6, '24 fotos em A4 = 6 páginas (' + doc1.getPageCount() + ')');
  const pg1 = doc1.getPage(0);
  ok(perto(pg1.getWidth(), A4[0]) && perto(pg1.getHeight(), A4[1]), 'página A4 595,28 × 841,89 pt');

  console.log('Metadados e impressão:');
  const info = doc1.getInfoDict();
  const chavesInfo = info.keys().map(k => k.toString());
  ok(['Producer', 'Creator', 'Title', 'Author'].every(k => info.lookup(PDFName.of(k)) === undefined), 'Info sem Producer/Creator/Title/Author' + (chavesInfo.length ? ' (resta ' + chavesInfo.join(', ') + ')' : ''));
  const vp = doc1.catalog.lookup(PDFName.of('ViewerPreferences'));
  const ps = vp && vp.lookup(PDFName.of('PrintScaling'));
  ok(ps && ps.toString() === '/None', 'ViewerPreferences /PrintScaling /None');

  console.log('Fontes e imagens:');
  const nomes = nomesFonte(doc1);
  ok(nomes.some(n => /^\/[A-Z]{6}\+.*Caveat/.test(n)), 'Caveat em subconjunto (' + (nomes.find(n => n.includes('Caveat')) || 'ausente') + ')');
  ok(nomes.some(n => /^\/[A-Z]{6}\+.*IBMPlexMono/.test(n)), 'IBM Plex Mono em subconjunto (' + (nomes.find(n => n.includes('IBMPlexMono')) || 'ausente') + ')');
  const imgs = contarImagens(doc1);
  ok(imgs.jpg === 24, '24 imagens JPEG de foto (' + imgs.jpg + ')');
  ok(imgs.png >= 1, 'assinatura PNG embutida (' + imgs.png + ' imagem(ns) PNG)');

  console.log('Versão leve:');
  const r2 = await gerar({ f: 'leve' });
  const b2 = b64ToBytes(r2.arquivos[0].b64);
  ok(r2.ok && b2.length < b1.length, 'leve menor que pdf (' + Math.round(b2.length / 1024) + ' KB < ' + Math.round(b1.length / 1024) + ' KB)');

  console.log('Falhas e fotos de fora:');
  const r3 = await gerar({ f: 'pdf', falhar: [7] });
  const doc3 = await PDFDocument.load(b64ToBytes(r3.arquivos[0].b64), { updateMetadata: false });
  ok(r3.ok && JSON.stringify(r3.falhas) === '[7]' && doc3.getPageCount() === 6, 'falhar:[7] → falhas [7] e 6 páginas');
  const r4 = await gerar({ f: 'pdf', sem: [7, 19] });
  const doc4 = await PDFDocument.load(b64ToBytes(r4.arquivos[0].b64), { updateMetadata: false });
  ok(r4.ok && doc4.getPageCount() === 6 && contarImagens(doc4).jpg === 22, 'sem:[7,19] → 22 fotos e 6 páginas (páginas ' + doc4.getPageCount() + ', JPEG ' + contarImagens(doc4).jpg + ', falhas ' + JSON.stringify(r4.falhas) + ')');

  console.log('Invariante de guias/contorno:');
  const r5 = await gerar({ f: 'pdf' }, { s: { guias: true, contorno: true } });
  ok(!r5.ok && /InvariantError/.test(r5.erro), 'guias + contorno rejeita InvariantError');

  console.log('Formato Mini:');
  const r6 = await gerar({ f: 'pdf' }, { fr: { w: 60, h: 73, jw: 48, jh: 48, lado: 6, topo: 6, rad: 0.4, ori: 'v' } });
  const doc6 = await PDFDocument.load(b64ToBytes(r6.arquivos[0].b64), { updateMetadata: false });
  ok(r6.ok && doc6.getPageCount() === 3 && perto(doc6.getPage(0).getWidth(), A4[0]) && perto(doc6.getPage(0).getHeight(), A4[1]), 'Mini 60 × 73 → 9 por folha e 3 páginas A4');

  console.log('Fidelidade MT-02:');
  const LEG0 = {
    pos: 'abaixo', preset: 'simples', dx: 0, dy: 0, inc: 0,
    txt: { on: true, font: 'Caveat', pt: 16, fit: false, caixa: 'normal', esp: 0, cor: 'preto' },
    data: { on: true, font: 'IBM Plex Mono', pt: 8, fmt: 0, cor: 'preto' },
    loc: { on: true, font: 'IBM Plex Mono', pt: 8, cor: 'preto', uf: 'sigla', pais: 'oculto', ocBR: true, sep: ', ', ordem: 'cidade' }
  };
  const leg = (m = {}) => {
    const l = JSON.parse(JSON.stringify(LEG0));
    for (const k in m) {
      if (k === 'txt' || k === 'data' || k === 'loc') Object.assign(l[k], m[k]);
      else l[k] = m[k];
    }
    return l;
  };
  await conferirFidelidade('padrão', { leg: null, fr: null, folhas: {} });
  await conferirFidelidade('acima', { leg: leg({ pos: 'acima', txt: { pt: 10 } }), fr: null, folhas: {} });
  await conferirFidelidade('ambas', { leg: leg({ pos: 'ambas', txt: { pt: 10 } }), fr: null, folhas: {} });
  await conferirFidelidade('etiqueta', { leg: leg({ preset: 'etiqueta' }), fr: null, folhas: {} });
  await conferirFidelidade('bilhete', { leg: leg({ preset: 'bilhete' }), fr: null, folhas: {} });
  await conferirFidelidade('carimbo', { leg: leg({ preset: 'carimbo' }), fr: null, folhas: {} });
  await conferirFidelidade('contornada', { leg: leg({ preset: 'contornada' }), fr: null, folhas: {} });
  await conferirFidelidade('calendario', { leg: leg({ preset: 'calendario' }), fr: null, folhas: {} });
  await conferirFidelidade('inc 5 dx 1', { leg: leg({ dx: 1, inc: 5 }), fr: null, folhas: {} });
  console.log('Fidelidade de raster MT-02:');
  for (const n of [3, 12]) {
    const r = await fidelidadeFoto(n);
    const maxMedia = Math.max(...r.media), maxQuadrante = Math.max(...r.quadrantes.flat());
    ok(maxMedia <= 6 && maxQuadrante <= 12,
      'foto ' + n + ': média por canal ≤ 6 (' + r.media.map(x => x.toFixed(2)).join(', ') + ') e quadrante ≤ 12 (' + maxQuadrante.toFixed(2) + ')');
  }
  const horiz = await conferirHorizontal();
  console.log('  desvio máximo MT-02: ' + desvioMax.toFixed(3) + ' mm');

  console.log('Renderização da página 1:');
  await mkdir(new URL('../saida/', import.meta.url), { recursive: true });
  const renderPdf = (b64, amostras = []) => page.evaluate(async ({ pdfjsUrl, b64, amostras }) => {
    const pdfjs = await import(pdfjsUrl + 'pdf.min.mjs');
    const worker = await (await fetch(pdfjsUrl + 'pdf.worker.min.mjs')).text();
    pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([worker], { type: 'text/javascript' }));
    const bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const doc = await pdfjs.getDocument({ data: u8 }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let naoBrancos = 0;
    for (let i = 0; i < px.length; i += 4) if (px[i] < 250 || px[i + 1] < 250 || px[i + 2] < 250) naoBrancos++;
    const cores = amostras.map(a => {
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = Math.max(0, Math.round(a.y)); y < Math.min(canvas.height, Math.round(a.y + a.h)); y++)
        for (let x = Math.max(0, Math.round(a.x)); x < Math.min(canvas.width, Math.round(a.x + a.w)); x++) {
          const i = (y * canvas.width + x) * 4; r += px[i]; g += px[i + 1]; b += px[i + 2]; n++;
        }
      return { r: n ? r / n : 0, g: n ? g / n : 0, b: n ? b / n : 0 };
    });
    const tc = await page.getTextContent();
    const texto = tc.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
    return { png: canvas.toDataURL('image/png').split(',')[1], naoBrancos, texto, cores };
  }, { pdfjsUrl, b64, amostras });

  const render1 = await renderPdf(r1.arquivos[0].b64);
  const saida = fileURLToPath(new URL('../saida/pdf-pagina-1.png', import.meta.url));
  await writeFile(saida, Buffer.from(render1.png, 'base64'));
  ok(render1.png.length > 1000 && render1.naoBrancos > 1000, 'página 1 renderizada com conteúdo em tests/saida/pdf-pagina-1.png (' + render1.naoBrancos + ' px não brancos)');
  ok(render1.texto.includes('Dias de sol'), 'texto extraído contém «Dias de sol»');
  ok(render1.texto.includes('14.07.26'), 'texto extraído contém «14.07.26»');
  ok(render1.texto.includes('Campos do Jordão, SP'), 'texto extraído contém «Campos do Jordão, SP»');

  console.log('Renderização Horizontal:');
  await carregarEditor({ leg: null, fr: { w: 88, h: 107, jh: 76, lado: 6, topo: 6, rad: 0.4, ori: 'h' }, folhas: { papel: 'A4', girar: false } });
  const rh = await gerar({ f: 'pdf' });
  ok(rh.ok && rh.avisos.length === 0, 'PDF Horizontal gerado sem avisos');
  /* MT-02/D-109: a foto fica de pé no papel. Na cena horizontal a faixa preta fica embaixo da janela. */
  const fbox = (horiz.byN[1] || []).find(b => b.t === 'foto');
  const pxmm = 72 / 25.4 * 2;
  const amostras = fbox ? [
    { x: (fbox.x + fbox.w / 2) * pxmm - 3, y: (horiz.page.h - (fbox.y + fbox.h * 0.92)) * pxmm - 3, w: 6, h: 6 },
    { x: (fbox.x + fbox.w / 2) * pxmm - 3, y: (horiz.page.h - (fbox.y + fbox.h * 0.08)) * pxmm - 3, w: 6, h: 6 }
  ] : [];
  const renderH = await renderPdf(rh.arquivos[0].b64, amostras);
  const saidaH = fileURLToPath(new URL('../saida/pdf-horizontal-p1.png', import.meta.url));
  await writeFile(saidaH, Buffer.from(renderH.png, 'base64'));
  ok(renderH.png.length > 1000 && renderH.naoBrancos > 1000, 'página 1 horizontal em tests/saida/pdf-horizontal-p1.png (' + renderH.naoBrancos + ' px não brancos)');
  const lum = c => (c.r + c.g + c.b) / 3;
  ok(renderH.cores.length === 2 && lum(renderH.cores[1]) < 70 && lum(renderH.cores[0]) > 150,
    'foto horizontal de pé: faixa preta embaixo da janela (topo ' + Math.round(lum(renderH.cores[0])) + ', fundo ' + Math.round(lum(renderH.cores[1])) + ')');

  console.log('Foto 2 · janela orientada:');
  await carregarEditor({ leg: null, fr: { w: 88, h: 107, jh: 62, lado: 6, topo: 6, rad: 0.4, ori: 'h' }, folhas: { papel: 'A4', girar: false } });
  const rp = await page.evaluate(async () => {
    const p = PLGERADOR.projeto();
    const r = await PLGERADOR.foto(p, 2, 326, 0.92);
    const j = p.fr.ori === 'h' ? { jw: p.fr.jh, jh: p.fr.jw } : { jw: p.fr.jw, jh: p.fr.jh };
    return { wpx: r.wpx, hpx: r.hpx, jw: j.jw, jh: j.jh };
  });
  const expW = Math.round(rp.jw / 25.4 * 326), expH = Math.round(rp.jh / 25.4 * 326);
  ok(rp.wpx === expW && rp.hpx === expH, 'foto 2 (vertical): imagem ' + rp.wpx + '×' + rp.hpx + ' px = janela orientada ' + rp.jw + '×' + rp.jh + ' mm a 326 PPI');
  ok(perto(rp.wpx * 25.4 / rp.jw, 326, 0.6), 'PPI da foto 2 na janela orientada = ' + (rp.wpx * 25.4 / rp.jw).toFixed(1));
  const rpDoc = await gerar({ f: 'pdf' }, { fr: { w: 88, h: 107, jh: 62, lado: 6, topo: 6, rad: 0.4, ori: 'h' } });
  const dims = rpDoc.ok ? dimsJpeg(await PDFDocument.load(b64ToBytes(rpDoc.arquivos[0].b64), { updateMetadata: false })) : [];
  ok(dims.some(d => d.w === expW && d.h === expH), 'imagem embutida no PDF tem ' + expW + '×' + expH + ' px (janela orientada)');

  console.log('Renderização com legenda acima:');
  await carregarEditor({ leg: leg({ pos: 'acima', txt: { pt: 10 } }), fr: null, folhas: {} });
  const ra = await gerar({ f: 'pdf' });
  ok(ra.ok && ra.avisos.length === 0, 'PDF com legenda acima gerado sem avisos');
  const renderA = await renderPdf(ra.arquivos[0].b64);
  const saidaA = fileURLToPath(new URL('../saida/pdf-acima-p1.png', import.meta.url));
  await writeFile(saidaA, Buffer.from(renderA.png, 'base64'));
  ok(renderA.png.length > 1000 && renderA.naoBrancos > 1000, 'página 1 com legenda acima em tests/saida/pdf-acima-p1.png (' + renderA.naoBrancos + ' px não brancos)');

  console.log('Renderização com legenda bilhete:');
  await carregarEditor({ leg: leg({ preset: 'bilhete' }), fr: null, folhas: {} });
  const rb = await gerar({ f: 'pdf' });
  ok(rb.ok && rb.avisos.length === 0, 'PDF com legenda bilhete gerado sem avisos');
  const renderB = await renderPdf(rb.arquivos[0].b64);
  const saidaB = fileURLToPath(new URL('../saida/pdf-estilos-p1.png', import.meta.url));
  await writeFile(saidaB, Buffer.from(renderB.png, 'base64'));
  ok(renderB.png.length > 1000 && renderB.naoBrancos > 1000, 'página 1 com legenda bilhete em tests/saida/pdf-estilos-p1.png (' + renderB.naoBrancos + ' px não brancos)');
  console.log('Orientação da T-06 (pl-orientacao):');
  await carregarEditor({ orientacao: 'separar' });
  const rsep = await page.evaluate(async () => {
    const p = PLGERADOR.projeto();
    const ext = p.fr.ori === 'h' ? { w: p.fr.h, h: p.fr.w } : { w: p.fr.w, h: p.fr.h };
    const t07 = PLFOLHAS.paginar(p.s, ext, p.fotos).sheets.length;
    const L = PLGERADOR.lista(p);
    return { separar: p.s.separar, t07, paginas: L.paginas.length };
  });
  ok(rsep.separar === true && rsep.paginas === rsep.t07, 'pl-orientacao=separar sem pl-folhas → PDF com ' + rsep.paginas + ' folhas = T-07 (' + rsep.t07 + ')');
  const rsepPdf = await gerar({ f: 'pdf' });
  const docSep = rsepPdf.ok ? await PDFDocument.load(b64ToBytes(rsepPdf.arquivos[0].b64), { updateMetadata: false }) : null;
  ok(!!docSep && docSep.getPageCount() === rsep.t07, 'PDF separado tem ' + (docSep ? docSep.getPageCount() : 0) + ' páginas');

  console.log('Volumes por limite de tamanho:');
  await carregarEditor({});
  const rv = await gerar({ f: 'pdf', lim: 0.3 });
  let paginasVol = 0, nomesVol = true;
  if (rv.ok) for (const a of rv.arquivos) {
    const d = await PDFDocument.load(b64ToBytes(a.b64), { updateMetadata: false });
    paginasVol += d.getPageCount();
    nomesVol = nomesVol && /^Polar-Life-\d{3}\.pdf$/.test(a.nome);
  }
  ok(rv.ok && rv.arquivos.length > 1 && nomesVol && paginasVol === 6, 'lim 0,3 MB → ' + (rv.ok ? rv.arquivos.length : 0) + ' arquivos Polar-Life-001… e 6 páginas no total');

  console.log('Cancelar:');
  await carregarEditor({});
  const rab = await page.evaluate(async () => {
    const ctrl = new AbortController();
    const p = PLGERADOR.projeto();
    try {
      const r = await PLGERADOR.pdf(p, { sinal: ctrl.signal }, i => { if (i.folha === i.total) ctrl.abort(); });
      return { ok: true, n: r.arquivos.length };
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  });
  ok(!rab.ok && rab.erro === 'abortado', 'abortar após a última foto rejeita «abortado» e não devolve arquivos');

  console.log('Sem folhas:');
  const rsf = await page.evaluate(async () => {
    const p = PLGERADOR.projeto(); p.fotos = [];
    try { await PLGERADOR.pdf(p, {}); return { ok: true }; }
    catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  });
  ok(!rsf.ok && rsf.erro === 'SemFolhas', 'pdf() sem páginas rejeita Error(\'SemFolhas\')');

  console.log('Ajustes e filtros parciais:');
  await page.evaluate(() => {
    const q = JSON.parse(sessionStorage.getItem('pl-quadro'));
    q[1].adj = { brilho: 20 };
    q[2].flt = { id: 'pb' };
    sessionStorage.setItem('pl-quadro', JSON.stringify(q));
  });
  const radj = await page.evaluate(() => {
    const p = PLGERADOR.projeto(), f = p.fotos[0], g = p.fotos[1];
    const okAdj = f.adj.brilho === 20 && f.adj.contraste === 0 && f.adj.saturacao === 0 && f.adj.temp === 0 &&
      f.adj.realces === 0 && f.adj.sombras === 0 && f.adj.nitidez === 0 && f.adj.vinheta === 0;
    return { okAdj, okFlt: g.flt.id === 'pb' && g.flt.int === 100 };
  });
  ok(radj.okAdj && radj.okFlt, 'adj {brilho:20} e flt {id:pb} completam com o padrão (sem NaN)');
  const radjPdf = await gerar({ f: 'pdf' });
  ok(radjPdf.ok && radjPdf.falhas.length === 0, 'PDF com ajustes parciais gera sem falhas');

  const TXT80 = 'Sol, estrada, família e amigos: uma tarde inteira para lembrar. '.repeat(2).slice(0, 80);
  const TXT49 = 'Sol, estrada, família e amigos: uma tarde inteira';
  console.log('Legenda longa (T4):');
  await carregarEditor({ leg: leg({}), txt: TXT80 });
  const rlong = await page.evaluate(async () => {
    const p = PLGERADOR.projeto();
    await PLGERADOR.preparar(p);
    const L = PLGERADOR.lista(p), fr = p.fr, lm = Math.round(fr.lado * 1000), jw = Math.round(fr.jw * 1000), topo = Math.round(fr.topo * 1000), jh = Math.round(fr.jh * 1000);
    const errs = [];
    let cortou = false;
    const medir = it => PLGERADOR.medir(it.txt, { fam: it.fonte.fam, peso: it.fonte.peso, it: it.fonte.it, pt: it.pt, esp: it.esp });
    function findFoto(items) {
      for (const it of items) { if (it.t === 'foto') return true; if (it.t === 'grupo' && findFoto(it.itens)) return true; }
      return false;
    }
    function walk(items, dentro) {
      for (const it of items) {
        if (it.t === 'grupo') walk(it.itens, dentro || findFoto(it.itens));
        else if (it.t === 'texto' && dentro) {
          const w = medir(it);
          if (it.x < lm - 0.01 || it.x + w > lm + jw + 0.01) errs.push('fora da largura: ' + it.txt);
          if (!it.clip || Math.abs(it.clip.x - lm) > 0.01 || Math.abs(it.clip.w - jw) > 0.01) errs.push('sem recorte: ' + it.txt);
          if (it.top != null && it.top < topo + jh - 0.01) errs.push('sobre a foto: ' + it.txt);
          if (/…$/.test(it.txt)) cortou = true;
        }
      }
    }
    L.paginas.forEach(pg => walk(pg.itens, false));
    return { errs, cortou };
  });
  ok(rlong.errs.length === 0 && rlong.cortou, 'legenda de 80 caracteres fica na janela da figcaption, corta com «…» e não cruza a foto' + (rlong.errs.length ? ' — ' + rlong.errs[0] : ''));

  console.log('Ajustar para caber (fit):');
  await carregarEditor({ leg: leg({ txt: { pt: 16, fit: true } }), txt: TXT49 });
  const rfit = await page.evaluate(async () => {
    const p = PLGERADOR.projeto();
    await PLGERADOR.preparar(p);
    const L = PLGERADOR.lista(p);
    let cap = null;
    function walk(items) {
      for (const it of items) {
        if (it.t === 'texto' && it.clip && it.fonte.fam === 'Caveat') cap = it;
        else if (it.t === 'grupo') walk(it.itens);
      }
    }
    walk(L.paginas[0].itens);
    const w = cap ? PLGERADOR.medir(cap.txt, { fam: cap.fonte.fam, peso: cap.fonte.peso, it: cap.fonte.it, pt: cap.pt, esp: cap.esp }) : 0;
    return { pt: cap ? cap.pt : 0, w, jw: Math.round(p.fr.jw * 1000), cortou: cap ? /…$/.test(cap.txt) : false };
  });
  ok(rfit.pt > 8 && rfit.pt < 16 && rfit.w <= rfit.jw + 0.01 && !rfit.cortou, '«Ajustar para caber» reduz o corpo (' + rfit.pt.toFixed(2) + ' pt) e a legenda cabe sem «…»');

  console.log('Rodapé (linha de base):');
  await carregarEditor({ folhas: { papel: 'A4', rodape: true } });
  const rrod = await page.evaluate(async () => {
    const p = PLGERADOR.projeto();
    await PLGERADOR.preparar(p);
    const L = PLGERADOR.lista(p), pg = L.paginas[0];
    let it = null;
    function walk(items) { for (const x of items) { if (x.t === 'texto' && /^VIAGEM/.test(x.txt)) it = x; else if (x.t === 'grupo') walk(x.itens); } }
    walk(pg.itens);
    const f = { fam: 'IBM Plex Mono', peso: 400, it: false, pt: 2.2 * 72 / 25.4, esp: .04 };
    const m = PLGERADOR.metricas(f), size = 2.2 * 1000, base = Math.max(1, p.s.margem / 2 - 1.2);
    const yEsp = pg.h - base * 1000 - m.desc * size, w = it ? PLGERADOR.medir(it.txt, f) : 0, xEsp = it ? (pg.w - w) / 2 : 0;
    return { tem: !!it, dy: it ? Math.abs(it.y - yEsp) : 1e9, dx: it ? Math.abs(it.x - xEsp) : 1e9 };
  });
  ok(rrod.tem && rrod.dy <= 2 && rrod.dx <= 2, 'rodapé na linha de base certa (Δy ' + rrod.dy.toFixed(2) + ' µm, Δx ' + rrod.dx.toFixed(2) + ' µm)');

  console.log('Calendário (caixa da data):');
  await carregarEditor({ leg: leg({ preset: 'calendario' }) });
  const rcal = await page.evaluate(async () => {
    const p = PLGERADOR.projeto();
    await PLGERADOR.preparar(p);
    const L = PLGERADOR.lista(p);
    let box = null;
    function walk(items) { for (const it of items) { if (it.t === 'ret' && it.traco && it.traco.larg === 260 && it.rx === 260) { box = it; return; } if (it.t === 'grupo') walk(it.itens); } }
    walk(L.paginas[0].itens);
    const size = p.leg.data.pt * 25.4 * 1000 / 72;
    return { tem: !!box, h: box ? box.h : 0, hEsp: 1.2 * size + 520, larg: box ? box.traco.larg : 0 };
  });
  ok(rcal.tem && rcal.larg === 260 && perto(rcal.h, rcal.hEsp, 2), 'caixa da data: borda 260 µm e altura da própria data (' + rcal.h + ' µm ≈ ' + Math.round(rcal.hEsp) + ')');

  console.log('Avisos:');
  await carregarEditor({ leg: leg({ txt: { font: 'Foo Bar' } }) });
  const rfb = await gerar({ f: 'pdf' });
  ok(rfb.ok && rfb.avisos.some(a => a.motivo === 'FonteReserva'), 'fonte inexistente cai em Inter e entra em avisos');
  await carregarEditor({});
  await page.route('**/Logo_tipografia_lateral.png', r => r.abort());
  const rsig = await gerar({ f: 'pdf' });
  await page.unroute('**/Logo_tipografia_lateral.png');
  ok(rsig.ok && rsig.avisos.some(a => a.motivo === 'AssinaturaIndisponivel'), 'assinatura que não carrega entra em avisos');
} finally {
  await nav.close();
  srv.fechar();
  srvPdfjs.close();
}
console.log(falhas.length ? `\n✖ ${falhas.length} falha(s)` : '\n✔ PDF: sem falhas');
process.exit(falhas.length ? 1 : 0);
