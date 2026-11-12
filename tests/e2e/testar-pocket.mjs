#!/usr/bin/env node
import { abrirTudo, SECOES } from '../helpers/mais.mjs';
// Teste do formato Retro Pocket e da legenda em duas linhas (etapa 34, D-113): T-02 → Quadro (T-12) → T-07 → PDF.
// Uso: npm run testar:pocket  (Chromium do Playwright + pdfjs-dist)
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

/* Pocket (D-113): moldura 66 × 99, janela 60 × 79, lateral 3, topo 3, base 17 */
const FR_POCKET = { fmt: 'pocket', w: 66, h: 99, jh: 79, lado: 3, topo: 3, rad: 0.4, man: false, lock: true, ori: 'v' };
const LEG_POCKET = {
  pos: 'abaixo', preset: 'simples', dx: 0, dy: 0, inc: 0,
  txt: { on: false, font: 'Caveat', pt: 16, fit: false, caixa: 'normal', esp: 0, cor: 'preto' },
  data: { on: true, font: 'IBM Plex Mono', pt: 8, fmt: 3, cor: 'preto' },
  loc: { on: true, font: 'IBM Plex Mono', pt: 8, cor: 'preto', uf: 'sigla', pais: 'oculto', ocBR: true, sep: ' - ', ordem: 'cidade' },
  meta: 'linhas', ordem: 'loc-data', medida: 'letras'
};
const LEG0 = { /* Clássico: continua sem as chaves novas (meta/ordem/medida) */
  pos: 'abaixo', preset: 'simples', dx: 0, dy: 0, inc: 0,
  txt: { on: true, font: 'Caveat', pt: 16, fit: false, caixa: 'normal', esp: 0, cor: 'preto' },
  data: { on: true, font: 'IBM Plex Mono', pt: 8, fmt: 0, cor: 'preto' },
  loc: { on: true, font: 'IBM Plex Mono', pt: 8, cor: 'preto', uf: 'sigla', pais: 'oculto', ocBR: true, sep: ', ', ordem: 'cidade' }
};
const legPocket = (m = {}) => {
  const l = JSON.parse(JSON.stringify(LEG_POCKET));
  for (const k in m) { if (k === 'txt' || k === 'data' || k === 'loc') Object.assign(l[k], m[k]); else l[k] = m[k]; }
  return l;
};

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
const page = await nav.newPage();
await page.addInitScript(abrirTudo, SECOES);   /* D-172: ajustes avançados à vista */
await page.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() }))); // guarda de /app/ exige conta (D-123)
page.setDefaultTimeout(240000);
const errosPg = [];
page.on('pageerror', e => errosPg.push(String(e)));

const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/legenda-texto.js', 'assets/js/nucleo/gerador.js'];

const limpar = () => page.evaluate(() => { ['pl-quadro', 'pl-fotos', 'pl-folhas', 'pl-orientacao', 'pl-fmt'].forEach(k => { try { sessionStorage.removeItem(k) } catch (e) { } }); try { localStorage.removeItem('pl-projeto-atual') } catch (e) { } }); // volta ao projeto de exemplo (44: o T-02 cria projeto real)
const guardarQuadro = (fr, leg, n, cidade) => page.evaluate(({ fr, leg, n, cidade }) => {
  const q = [{ fr }];
  if (leg) q[0].leg = leg;
  for (let i = 1; i <= n; i++) q.push({ src: i, ...( cidade && i === 1 ? { meta: { iso: '2026-07-14T08:00', c: cidade } } : {}) });
  sessionStorage.setItem('pl-quadro', JSON.stringify(q));
  ['pl-fmt', 'pl-fotos', 'pl-orientacao'].forEach(k => { try { sessionStorage.removeItem(k) } catch (e) { } });
  sessionStorage.setItem('pl-folhas', JSON.stringify({ papel: 'A4', margem: 10, gap: 4 }));   // projeto salvo com 10/4: as conferências de legenda abaixo valem para ele (D-150)
}, { fr, leg, n, cidade });
const abrirEditor = async () => {
  await page.goto(srv.url + 'app/editor/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0);
  for (const src of SCRIPTS) await page.addScriptTag({ url: srv.url + src });
  await page.evaluate(() => document.fonts ? document.fonts.ready.then(() => true) : true);
  await page.waitForTimeout(400); /* loadingdone redesenha as linhas com as métricas da fonte (D-113) */
};
const gerar = op => page.evaluate(async op => {
  const b64 = u8 => { let s = '', c = 0x8000; for (let i = 0; i < u8.length; i += c) s += String.fromCharCode.apply(null, u8.subarray(i, i + c)); return btoa(s); };
  const p = PLGERADOR.projeto();
  const r = await PLGERADOR.pdf(p, op || {});
  return { ok: true, arquivos: r.arquivos.map(a => ({ nome: a.nome, b64: b64(a.bytes) })) };
}, op || {});
const nomesFonte = doc => {
  const nomes = [];
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFDict)) continue;
    const bf = obj.lookup(PDFName.of('BaseFont'));
    if (bf) nomes.push(bf.toString());
  }
  return nomes;
};
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

try {
  console.log('Quadro (T-12) · trocar para o Pocket:');
  await limpar();
  await page.goto(srv.url + 'app/editor/quadro/#foto-3', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.PLQ);
  await page.click('#tab-molduras');
  await page.click('[data-fmt="pocket"]');
  await page.waitForFunction(() => { const d = document.getElementById('fmt-dlg'); return d && !d.hidden; });
  await page.click('#fmt-sim');
  const ra = await page.evaluate(() => {
    const st = PLQ.ST()[0], fr = PLQ.FR, v = id => document.getElementById(id).value;
    return {
      fr: st.fr, leg: st.leg,
      frQ: { w: fr.w, h: fr.h, jw: fr.jw, jh: fr.jh, lado: fr.lado, topo: fr.topo, cw: fr.cw, ch: fr.ch, cl: fr.cl, ct: fr.ct, cjw: fr.cjw, cjh: fr.cjh },
      mo: { w: v('mo-w'), h: v('mo-h'), jw: v('mo-jw'), jh: v('mo-jh'), lado: v('mo-lado'), topo: v('mo-topo'), bt: v('mo-bt') },
      cota: document.getElementById('cota').textContent,
      pressed: document.querySelector('[data-fmt="pocket"]').getAttribute('aria-pressed'),
      cartao: document.querySelector('[data-fmt="pocket"] .mono').textContent
    };
  });
  ok(ra.fr.fmt === 'pocket' && ra.fr.w === 66 && ra.fr.h === 99 && ra.fr.jh === 79 && ra.fr.lado === 3 && ra.fr.topo === 3,
    'moldura 66 × 99 gravada no projeto (janela 60 × 79, lateral 3, topo 3)');
  ok(ra.frQ.w === 66 && ra.frQ.h === 99 && ra.frQ.jw === 60 && ra.frQ.jh === 79 && ra.frQ.cjw === 60 && ra.frQ.cjh === 79 && ra.frQ.cl === 3 && ra.frQ.ct === 3,
    'PLQ.FR pocket com as chaves da moldura em pé (cw/ch/cl/ct/cjw/cjh)');
  ok(ra.mo.w === '66' && ra.mo.h === '99' && ra.mo.jw === '60' && ra.mo.jh === '79' && ra.mo.lado === '3' && ra.mo.topo === '3' && ra.mo.bt === '17',
    'campos de Medidas: 66/99/60/79/3/3/17 (passe-partout inferior 17)');
  ok(/Passe-partout inferior: 17 mm/.test(ra.cota) && ra.pressed === 'true' && ra.cartao === '66 × 99 mm',
    'cota «Passe-partout inferior: 17 mm», cartão pressionado e botão «66 × 99 mm»');
  ok(ra.leg.txt.on === false && ra.leg.meta === 'linhas' && ra.leg.ordem === 'loc-data' && ra.leg.medida === 'letras' && ra.leg.loc.sep === ' - ' && ra.leg.data.fmt === 3,
    'trocar para o Pocket aplica a legenda em duas linhas (local primeiro, topo das letras)');

  console.log('Contagem de folhas (motor compartilhado):');
  const rb = await page.evaluate(() => PLFOLHAS.contar(PLFOLHAS.ler(), { w: 66, h: 99 }, window.PLQ.N, 0));
  ok(rb.folhas === 3 && rb.porFolha === 8 && !rb.naoCabe,
    'A4 (padrão D-150: margem 3, espaço 0): 8 por folha e 3 folhas para 24 fotos (' + rb.porFolha + '/' + rb.folhas + ')');

  console.log('Fluxo T-02 → Quadro → T-07 (pl-fmt):');
  await limpar();
  await page.evaluate(() => { try { sessionStorage.setItem('pl-fmt', 'pocket') } catch (e) { } });
  await page.goto(srv.url + 'app/editor/quadro/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.PLQ);
  const rc1 = await page.evaluate(() => ({
    fmt: sessionStorage.getItem('pl-fmt'),
    fr: PLQ.ST()[0].fr, leg: PLQ.ST()[0].leg,
    frQ: { w: PLQ.FR.w, h: PLQ.FR.h, jw: PLQ.FR.jw, jh: PLQ.FR.jh }
  }));
  ok(rc1.fmt === null && rc1.fr.fmt === 'pocket' && rc1.frQ.jw === 60 && rc1.frQ.jh === 79 && rc1.leg.meta === 'linhas' && rc1.leg.medida === 'letras',
    'o Quadro consome pl-fmt=pocket (moldura + legenda aplicadas, pl-fmt removido)');
  await page.goto(srv.url + 'app/editor/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0);
  const rc2 = await page.evaluate(() => {
    const c = window.PLEDITOR.ctx();
    return {
      fr: { w: c.FR.w, h: c.FR.h, jw: c.FR.jw, jh: c.FR.jh }, folhas: c.R.sheets.length,
      leg: c.LG, ml: document.querySelectorAll('#sheet .pol__ml').length, meta: document.querySelectorAll('#sheet .pol__meta').length
    };
  });
  ok(rc2.fr.w === 66 && rc2.fr.h === 99 && rc2.fr.jw === 60 && rc2.fr.jh === 79 && rc2.folhas === 3
    && rc2.leg.meta === 'linhas' && rc2.leg.ordem === 'loc-data' && rc2.leg.medida === 'letras' && rc2.leg.txt.on === false,
    'a T-07 recebe o projeto Pocket do Quadro (66 × 99, 3 folhas, legenda em linhas)');
  ok(rc2.ml === 16 && rc2.meta === 0, 'T-07: 8 polaroids × 2 linhas .pol__ml na folha 1 e nada de .pol__meta');
  await page.evaluate(() => { try { sessionStorage.removeItem('pl-quadro') } catch (e) { } try { sessionStorage.setItem('pl-fmt', 'pocket') } catch (e) { } });
  await page.goto(srv.url + 'app/editor/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0);
  const rc3 = await page.evaluate(() => {
    const c = window.PLEDITOR.ctx();
    return { w: c.FR.w, h: c.FR.h, ml: document.querySelectorAll('#sheet .pol__ml').length, meta: c.LG.meta };
  });
  ok(rc3.w === 66 && rc3.h === 99 && rc3.ml === 16 && rc3.meta === 'linhas',
    'T-07 direto do T-02 (sem passar pelo Quadro) também entra no Pocket');

  console.log('Novo projeto (T-02):');
  await limpar();
  await page.goto(srv.url + 'app/novo-projeto/', { waitUntil: 'networkidle' });
  const rd1 = await page.evaluate(() => {
    const inp = document.querySelector('input[name="fmt"][value="pocket"]');
    const card = inp ? inp.closest('.fmt-card') : null;
    return { tem: !!inp, txt: card ? card.querySelector('.mono').textContent : '' };
  });
  ok(rd1.tem && rd1.txt === '66 × 99 mm', 'cartão Retro Pocket mostra «66 × 99 mm»');
  await page.check('input[name="fmt"][value="pocket"]');
  await page.click('#continuar');
  await page.waitForURL('**/app/adicionar-fotos/');
  const rd2 = await page.evaluate(() => sessionStorage.getItem('pl-fmt'));
  ok(rd2 === 'pocket', 'continuar com o Pocket grava pl-fmt=pocket para o Quadro aplicar');

  console.log('Display list do PDF (medidas D-113):');
  await page.evaluate(() => ['pl-quadro', 'pl-fotos', 'pl-folhas', 'pl-orientacao'].forEach(k => { try { sessionStorage.removeItem(k) } catch (e) { } }));
  await page.evaluate(() => sessionStorage.setItem('pl-folhas', JSON.stringify({ papel: 'A4', margem: 10, gap: 4 })));   // projeto salvo com 10/4: os números abaixo valem para ele (D-150)
  await abrirEditor();
  const re = await page.evaluate(async () => {
    const p = PLGERADOR.projeto();
    await PLGERADOR.preparar(p);
    const L = PLGERADOR.lista(p);
    const m = PLGERADOR.metricas({ fam: 'IBM Plex Mono', peso: 400, it: false, pt: 8, esp: .02 });
    const capU = m.cap * 8 * .3528 * 1000;  /* altura de versal da linha de 8 pt, em µm */
    const out = { fr: { w: p.fr.w, h: p.fr.h, jw: p.fr.jw, jh: p.fr.jh, lado: p.fr.lado, topo: p.fr.topo },
      paginas: L.paginas.length, loc: null, data: null, nLoc: 0, nData: 0, mono: true };
    function walk(items) {
      for (const it of items) {
        if (it.t === 'grupo') walk(it.itens);
        else if (it.t === 'texto') {
          if (it.fonte.fam !== 'IBM Plex Mono') out.mono = false;
          if (it.txt === 'Campos do Jordão - SP') { out.nLoc++; if (!out.loc) out.loc = it; }
          if (it.txt === '14/07/26') { out.nData++; if (!out.data) out.data = it; }
        }
      }
    }
    L.paginas.forEach(pg => walk(pg.itens));
    return { fr: out.fr, paginas: out.paginas, nLoc: out.nLoc, nData: out.nData, mono: out.mono,
      locY: out.loc ? out.loc.y : null, locX: out.loc ? out.loc.x : null,
      dataY: out.data ? out.data.y : null, dataX: out.data ? out.data.x : null, capU };
  });
  ok(re.fr.w === 66 && re.fr.h === 99 && re.fr.jw === 60 && re.fr.jh === 79 && re.fr.lado === 3 && re.fr.topo === 3,
    'PDF: moldura Pocket no projeto (66 × 99, janela 60 × 79)');
  ok(re.nLoc === 24 && re.nData === 24 && re.mono, 'PDF: 24 linhas de local e 24 de data, só IBM Plex Mono (texto livre ausente)');
  ok(re.locY !== null && re.dataY !== null && Math.abs((re.locY - re.capU) / 1000 - 86) <= 0.1,
    'PDF: topo das maiúsculas da 1ª linha a 4 mm da borda inferior da janela (' + ((re.locY - re.capU) / 1000).toFixed(3) + ' mm ≈ 86)');
  ok(re.dataY !== null && Math.abs((re.dataY - re.locY) / 1000 - (2 + re.capU / 1000)) <= 0.1,
    'PDF: topo das maiúsculas da 2ª linha = linha de base da 1ª + 2 mm (Δ ' + ((re.dataY - re.locY) / 1000).toFixed(3) + ' mm)');
  ok(re.locX === 3000 && re.dataX === 3000, 'PDF: as duas linhas coladas na margem lateral (x = 3 mm)');
  ok(re.paginas === 6, 'PDF: 24 fotos do Pocket em A4 (10/4) = 6 páginas (' + re.paginas + ')');

  console.log('T-07 DOM (mesma conferência, ±0,3 mm):');
  const rf = await page.evaluate(() => {
    const ctx = window.PLEDITOR.ctx();
    const sheet = document.getElementById('sheet');
    const pxmm = sheet.getBoundingClientRect().width / ctx.R.p.w;
    const LNS = PLTEXTO.linhas(ctx.LG, ctx.FR, PLTEXTO.medTela, { temData: true, temLoc: true });
    let pior = 0, n = 0, ordemOk = true;
    sheet.querySelectorAll('.pol').forEach(pol => {
      const inEl = pol.querySelector('.pol__in');
      if (!inEl || inEl.style.transform) return; /* só molduras em pé */
      const inR = inEl.getBoundingClientRect();
      const mls = pol.querySelectorAll('.pol__ml');
      n += mls.length;
      if (mls.length !== 2 || mls[0].textContent.trim() !== 'Campos do Jordão - SP' || mls[1].textContent.trim() !== '14/07/26') ordemOk = false;
      mls.forEach((ml, i) => { pior = Math.max(pior, Math.abs((ml.getBoundingClientRect().top - inR.top) / pxmm - LNS[i].top)); });
    });
    return { n, ordemOk, pior, l0: LNS[0].letrasTop, l1: LNS[1].letrasTop, b0: LNS[0].base };
  });
  ok(rf.n === 8 && rf.ordemOk, 'T-07 DOM: 8 linhas .pol__ml, «Campos do Jordão - SP» antes de «14/07/26»');
  ok(rf.pior <= 0.3, 'T-07 DOM: topo de cada linha bate com PLTEXTO.linhas (Δ ' + rf.pior.toFixed(3) + ' mm ≤ 0,3)');
  ok(Math.abs(rf.l0 - 86) < 1e-6 && Math.abs(rf.l1 - (rf.b0 + 2)) < 1e-6,
    'cálculo único: letrasTop da 1ª = 86 mm e da 2ª = linha de base da 1ª + 2 mm');

  console.log('Assinatura no canto inferior direito (D-128):');
  const rsig = await page.evaluate(async () => {
    const p = PLGERADOR.projeto();
    await PLGERADOR.preparar(p);
    const L = PLGERADOR.lista(p);
    let sig = null; const textos = [];
    function walk(items) {
      for (const it of items) {
        if (it.t === 'grupo') walk(it.itens);
        else if (it.t === 'img' && it.src === 'assinatura') { if (!sig) sig = it; }
        else if (it.t === 'texto' && it.top != null) textos.push(it);
      }
    }
    L.paginas.forEach(pg => walk(pg.itens));
    const inter = sig ? textos.filter(it => {
      const size = it.pt * 25.4 * 1000 / 72;
      const w = PLGERADOR.medir(it.txt, { fam: it.fonte.fam, peso: it.fonte.peso, it: it.fonte.it, pt: it.pt, esp: it.esp });
      const l = it.x, r = it.x + w, t = it.top, b = it.top + (it.lh || 1.2) * size;
      return r > sig.x && l < sig.x + sig.w && b > sig.y && t < sig.y + sig.h;
    }).length : 0;
    return sig ? { x: sig.x, y: sig.y, w: sig.w, h: sig.h, inter, n: textos.length } : { inter: 0, n: textos.length };
  });
  ok(rsig.x !== undefined && rsig.x + rsig.w > 60000 && Math.abs((rsig.y + rsig.h) / 1000 - 96) < 0.01,
    'PDF: assinatura no canto inferior direito (x ≈ 51,7–63 mm, base a 96 mm)');
  ok(rsig.inter === 0, 'PDF: a caixa da assinatura não intersecta nenhuma linha da legenda (' + rsig.n + ' linhas)');
  const rdomSig = await page.evaluate(() => {
    const pol = [].find.call(document.querySelectorAll('#sheet .pol'), p => !p.querySelector('.pol__in').style.transform);
    const inR = pol.querySelector('.pol__in').getBoundingClientRect();
    const sig = pol.querySelector('.pol__sig'), sr = sig.getBoundingClientRect();
    const mls = [].slice.call(pol.querySelectorAll('.pol__ml'));
    const inter = mls.filter(l => { const b = l.getBoundingClientRect(); return b.right > sr.left && b.left < sr.right && b.bottom > sr.top && b.top < sr.bottom; }).length;
    return { n: mls.length, inter, dir: sr.left > inR.left + inR.width / 2 };
  });
  ok(rdomSig.dir && rdomSig.inter === 0, 'T-07 DOM: assinatura à direita e sem cruzamento com as ' + rdomSig.n + ' linhas da legenda');
  const rpv = await page.evaluate(() => ({ fora: PLEDITOR.ctx().foraTodas(), bl: PLPREVOO.analisar().bl }));
  ok(rpv.fora === 0 && !rpv.bl.some(t => /área segura/.test(t)),
    'pré-voo do Pocket padrão: nenhum bloqueio de área segura');

  console.log('Local longo alcança a assinatura:');
  await guardarQuadro(FR_POCKET, legPocket({ ordem: 'data-loc' }), 4, 'São José do Vale do Rio Preto');
  await abrirEditor();
  const rlong = await page.evaluate(() => {
    const pol = [].find.call(document.querySelectorAll('#sheet .pol'), p => !p.querySelector('.pol__in').style.transform);
    const sr = pol.querySelector('.pol__sig').getBoundingClientRect();
    const ml = [].slice.call(pol.querySelectorAll('.pol__ml'))[1];
    const b = ml ? ml.getBoundingClientRect() : null;
    return { fora: PLEDITOR.ctx().foraTodas(), bl: PLPREVOO.analisar().bl,
      toca: !!(b && b.right > sr.left && b.left < sr.right && b.bottom > sr.top && b.top < sr.bottom) };
  });
  ok(rlong.fora > 0 && rlong.bl.some(t => /área segura/.test(t)) && rlong.toca,
    'um local muito longo que alcança a assinatura bloqueia a impressão');

  console.log('Ordem invertida e Caveat na data:');
  await guardarQuadro(FR_POCKET, legPocket({ ordem: 'data-loc', data: { font: 'Caveat' } }), 4);
  await abrirEditor();
  const rg1 = await page.evaluate(async () => {
    const pol = document.querySelector('#sheet .pol');
    const mls = pol.querySelectorAll('.pol__ml');
    const dom = { n: mls.length, primeiroData: !!(mls[0] && mls[0].querySelector('time')),
      primeiroTxt: mls[0] ? mls[0].textContent.trim() : '', fam1: mls[0] ? mls[0].style.fontFamily : '' };
    const p = PLGERADOR.projeto();
    await PLGERADOR.preparar(p);
    const L = PLGERADOR.lista(p);
    let d = null, l = null;
    function walk(items) {
      for (const it of items) {
        if (it.t === 'grupo') walk(it.itens);
        else if (it.t === 'texto') {
          if (it.txt === '14/07/26' && it.fonte.fam === 'Caveat' && !d) d = it;
          if (it.txt === 'Campos do Jordão - SP' && !l) l = it;
        }
      }
    }
    L.paginas.forEach(pg => walk(pg.itens));
    const mD = PLGERADOR.metricas({ fam: 'Caveat', peso: 400, it: false, pt: 8 });
    const mM = PLGERADOR.metricas({ fam: 'IBM Plex Mono', peso: 400, it: false, pt: 8 });
    return { dom, dY: d ? d.y : null, lY: l ? l.y : null, capD: mD.cap * 8 * .3528 * 1000, capM: mM.cap * 8 * .3528 * 1000 };
  });
  ok(rg1.dom.n === 2 && rg1.dom.primeiroData && rg1.dom.primeiroTxt === '14/07/26' && /Caveat/.test(rg1.dom.fam1),
    'T-07: data primeiro (em Caveat) e local depois');
  ok(rg1.dY !== null && Math.abs((rg1.dY - rg1.capD) / 1000 - 86) <= 0.1,
    'PDF: topo das maiúsculas da data (Caveat) a 4 mm da janela (' + ((rg1.dY - rg1.capD) / 1000).toFixed(3) + ' mm ≈ 86)');
  ok(rg1.lY !== null && Math.abs((rg1.lY - rg1.dY) / 1000 - (2 + rg1.capM / 1000)) <= 0.1,
    'PDF: local = linha de base da data + 2 mm (Δ ' + ((rg1.lY - rg1.dY) / 1000).toFixed(3) + ' mm)');
  const rg1p = await gerar({ f: 'pdf' });
  const docG1 = await PDFDocument.load(b64ToBytes(rg1p.arquivos[0].b64), { updateMetadata: false });
  const nomesG1 = nomesFonte(docG1);
  ok(nomesG1.some(n => /^\/[A-Z]{6}\+.*Caveat/.test(n)) && nomesG1.some(n => /^\/[A-Z]{6}\+.*IBMPlexMono/.test(n)),
    'PDF: Caveat (data) e IBM Plex Mono (local) embutidas em subconjunto');

  console.log('Linhas juntas (caixa):');
  await guardarQuadro(FR_POCKET, legPocket({ meta: 'junto', medida: 'caixa' }), 4);
  await abrirEditor();
  const rg2 = await page.evaluate(async () => {
    const pol = document.querySelector('#sheet .pol');
    const meta = pol.querySelector('.pol__meta');
    const dom = { txt: meta ? meta.textContent : '', ml: pol.querySelectorAll('.pol__ml').length };
    const p = PLGERADOR.projeto();
    await PLGERADOR.preparar(p);
    const L = PLGERADOR.lista(p);
    let loc = null, dat = null, sep = null;
    function walk(items) {
      for (const it of items) {
        if (it.t === 'grupo') walk(it.itens);
        else if (it.t === 'texto') {
          if (it.txt === 'Campos do Jordão - SP' && !loc) loc = it;
          if (it.txt === '14/07/26' && !dat) dat = it;
          if (it.txt === ' • ' && !sep) sep = it;
        }
      }
    }
    L.paginas.forEach(pg => walk(pg.itens));
    return { dom, tem: !!(loc && dat && sep), yIgual: !!(loc && dat && sep && loc.y === dat.y && dat.y === sep.y) };
  });
  ok(rg2.dom.txt === 'Campos do Jordão - SP • 14/07/26' && rg2.dom.ml === 0,
    'T-07: uma linha só .pol__meta «Campos do Jordão - SP • 14/07/26», sem .pol__ml');
  ok(rg2.tem && rg2.yIgual, 'PDF: local, « • » e data na mesma linha de base');
  const rg2p = await gerar({ f: 'pdf' });
  const r2 = await renderPdf(rg2p.arquivos[0].b64);
  ok(r2.texto.includes('Campos do Jordão - SP • 14/07/26'),
    'PDF renderizado: texto extraído contém a linha única «Campos do Jordão - SP • 14/07/26»');

  console.log('Aba Legendas (T-10) · seletor nas três linhas:');
  await limpar();
  await page.evaluate(() => { try { sessionStorage.setItem('pl-fmt', 'pocket') } catch (e) { } });
  await page.goto(srv.url + 'app/editor/quadro/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.PLQ);
  await page.click('#tab-legendas');
  await page.waitForSelector('#fv-loc');
  const rh1 = await page.evaluate(() => ({
    data: document.getElementById('fv-data') ? document.getElementById('fv-data').textContent : null,
    loc: document.getElementById('fv-loc') ? document.getElementById('fv-loc').textContent : null,
    selData: !!document.querySelector('[data-fsel="data"]'), selLoc: !!document.querySelector('[data-fsel="loc"]'),
    linhas: !!(document.querySelector('input[name="lmeta"][value="linhas"]') || {}).checked,
    ordem: !!(document.querySelector('input[name="lordem"][value="loc-data"]') || {}).checked,
    medida: !!(document.querySelector('input[name="lmedida"][value="letras"]') || {}).checked
  }));
  ok(rh1.selData && rh1.selLoc, 'T-10: seletor de fonte nas seções Data e Local');
  ok(rh1.data === '14/07/26' && rh1.loc === 'Campos do Jordão - SP',
    'amostras com o texto real das linhas («14/07/26» · «Campos do Jordão - SP»)');
  ok(rh1.linhas && rh1.ordem && rh1.medida, 'T-10: seção «Linhas» marcada com o padrão do Pocket (linhas · local primeiro · topo das letras)');
  await page.click('[data-fsel="loc"]');
  await page.waitForSelector('[data-pick="Special Elite"]');
  await page.click('[data-pick="Special Elite"]');
  const rh2 = await page.evaluate(() => ({
    font: PLQ.ST()[0].leg.loc.font,
    fam: document.getElementById('fv-loc') ? document.getElementById('fv-loc').style.fontFamily : '',
    txt: document.getElementById('fv-loc') ? document.getElementById('fv-loc').textContent : ''
  }));
  ok(rh2.font === 'Special Elite' && /Special Elite/.test(rh2.fam) && rh2.txt === 'Campos do Jordão - SP',
    'escolher «Special Elite» no Local muda a amostra');
  await page.goto(srv.url + 'app/editor/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0);
  const rh3 = await page.evaluate(() => {
    const mls = document.querySelector('#sheet .pol').querySelectorAll('.pol__ml');
    return { n: mls.length, f1: mls[0] ? mls[0].style.fontFamily : '', f2: mls[1] ? mls[1].style.fontFamily : '' };
  });
  ok(rh3.n === 2 && /Special Elite/.test(rh3.f1) && /IBM Plex Mono/.test(rh3.f2),
    'T-07: o local sai em Special Elite e a data em IBM Plex Mono');

  console.log('Clássico continua como era:');
  await guardarQuadro({ fmt: 'classico', w: 88, h: 107, jh: 76, lado: 6, topo: 6, rad: 0.4, man: false, lock: true, ori: 'v' }, LEG0, 24);
  await abrirEditor();
  const ri = await page.evaluate(async () => {
    const p = PLGERADOR.projeto();
    return {
      leg: p.leg, w: p.fr.w,
      ml: document.querySelectorAll('#sheet .pol__ml').length, meta: document.querySelectorAll('#sheet .pol__meta').length
    };
  });
  ok(!('meta' in ri.leg) && !('ordem' in ri.leg) && !('medida' in ri.leg) && ri.w === 88,
    'Clássico segue sem as chaves novas (meta/ordem/medida) no projeto e no PDF');
  ok(ri.ml === 0 && ri.meta > 0, 'T-07 Clássico: continua numa linha só (.pol__meta), sem .pol__ml');

  console.log('Saídas (tests/saida/):');
  await guardarQuadro(FR_POCKET, LEG_POCKET, 4);
  await abrirEditor();
  await mkdir(new URL('../saida/', import.meta.url), { recursive: true });
  const saidaT07 = fileURLToPath(new URL('../saida/pocket-t07.png', import.meta.url));
  await page.locator('#sheet').screenshot({ path: saidaT07 });
  const rj = await gerar({ f: 'pdf' });
  const docJ = await PDFDocument.load(b64ToBytes(rj.arquivos[0].b64), { updateMetadata: false });
  ok(docJ.getPageCount() === 1 && perto(docJ.getPage(0).getWidth(), A4[0]) && perto(docJ.getPage(0).getHeight(), A4[1]),
    'PDF Pocket: 4 fotos → 1 página A4');
  const rjR = await renderPdf(rj.arquivos[0].b64);
  const saidaPdf = fileURLToPath(new URL('../saida/pocket-pdf-p1.png', import.meta.url));
  await writeFile(saidaPdf, Buffer.from(rjR.png, 'base64'));
  ok(rjR.png.length > 1000 && rjR.naoBrancos > 1000,
    'página 1 renderizada em tests/saida/pocket-pdf-p1.png (' + rjR.naoBrancos + ' px não brancos)');
  ok(rjR.texto.includes('Campos do Jordão - SP') && rjR.texto.includes('14/07/26'),
    'PDF: as duas linhas «Campos do Jordão - SP» e «14/07/26» no texto extraído');
  ok(errosPg.length === 0, 'nenhum erro de página durante o teste' + (errosPg.length ? ': ' + errosPg[0] : ''));
} finally {
  await nav.close();
  srv.fechar();
  srvPdfjs.close();
}
console.log(falhas.length ? `\n✖ ${falhas.length} falha(s)` : '\n✔ Pocket: sem falhas');
process.exit(falhas.length ? 1 : 0);
