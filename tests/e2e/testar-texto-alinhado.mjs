#!/usr/bin/env node
import { abrirTudo, SECOES } from '../helpers/mais.mjs';
/* D-135/D-136 · «Polaroid original» e o alinhamento Esquerda · Centro · Direita:
   o mesmo texto na tela (Quadro e Folhas) e no PDF (MT-02) · migração dos projetos antigos.
   Uso: node tests/e2e/testar-texto-alinhado.mjs  (Chromium do Playwright + pdfjs-dist) */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from '../helpers/servidor.mjs';

const falhas = [];
const ok = (c, m) => { if (c) console.log('  ✔ ' + m); else { falhas.push(m); console.log('  ✘ ' + m); } };
const perto = (a, b, e) => Math.abs(a - b) <= e;

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
const addScripts = async () => { for (const src of SCRIPTS) await page.addScriptTag({ url: srv.url + src }); };
const textoDoPdf = async (b64) => page.evaluate(async ({ pdfjsUrl, b64 }) => {
  const pdfjs = await import(pdfjsUrl + 'pdf.min.mjs');
  const worker = await (await fetch(pdfjsUrl + 'pdf.worker.min.mjs')).text();
  pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([worker], { type: 'text/javascript' }));
  const bin = atob(b64), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const doc = await pdfjs.getDocument({ data: u8 }).promise;
  const pg = await doc.getPage(1);
  const tc = await pg.getTextContent();
  return tc.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
}, { pdfjsUrl, b64 });
const gerarPdf = () => page.evaluate(async () => {
  const b64 = u8 => { let s = '', c = 0x8000; for (let i = 0; i < u8.length; i += c) s += String.fromCharCode.apply(null, u8.subarray(i, i + c)); return btoa(s); };
  const p = PLGERADOR.projeto();
  const r = await PLGERADOR.pdf(p, { f: 'pdf' });
  return { b64: b64(r.arquivos[0].bytes), avisos: r.avisos || [] };
});
/* a posição do texto na tela: a caixa da fonte (avanço), não a do bloco */
const caixaDoTexto = (sel) => page.evaluate(sel => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const rg = document.createRange(); rg.selectNodeContents(el);
  const rs = Array.from(rg.getClientRects()).filter(b => b.width > 0);
  if (!rs.length) return null;
  const l = Math.min(...rs.map(b => b.left)), r = Math.max(...rs.map(b => b.right));
  const t = Math.min(...rs.map(b => b.top)), b2 = Math.max(...rs.map(b => b.bottom));
  return { left: l, right: r, top: t, bottom: b2, centro: (l + r) / 2 };
}, sel);
const janelaDoQuadro = () => page.evaluate(() => {
  const w = document.getElementById('win').getBoundingClientRect();
  return { left: w.left, right: w.right, top: w.top, bottom: w.bottom, centro: (w.left + w.right) / 2 };
});

try {
  console.log('Painel de texto (Quadro):');
  await page.goto(srv.url + 'app/editor/quadro/#foto-1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.PLQ);
  await page.click('#tab-legendas');
  await page.waitForSelector('#s-original');
  const painel = await page.evaluate(() => {
    const p = document.getElementById('p-legendas');
    const sw = p.querySelectorAll('[role=switch]');
    const primeiro = sw[0];
    return {
      primeiro: primeiro ? primeiro.getAttribute('aria-labelledby') : null,
      rotulo: primeiro ? (document.getElementById(primeiro.getAttribute('aria-labelledby')) || {}).textContent : null,
      estado: primeiro ? primeiro.getAttribute('aria-checked') : null,
      temEstado: !!p.querySelector('#lg-orig-est'),
      alinhamentos: [...p.querySelectorAll('input[name=al]')].map(i => i.value),
      acima: /Acima|Ambas|Deslocar na horizontal/.test(p.textContent),
      posicoes: [...p.querySelectorAll('input[name=pos],input[name=dx],#r-dx,#n-dx')].length
    };
  });
  ok(painel.primeiro === 's-original' && painel.rotulo === 'Sem legendas', '«Sem legendas» é o primeiro interruptor do painel');
  ok(painel.estado === 'false' && painel.temEstado, 'o interruptor começa desligado e mostra o estado em texto');
  ok(painel.alinhamentos.join(',') === 'esq,centro,dir', 'a seção Posição tem Esquerda · Centro · Direita (' + painel.alinhamentos.join(', ') + ')');
  ok(!painel.acima && painel.posicoes === 0, 'sem «Acima», «Ambas» nem «Deslocar na horizontal»');

  console.log('Alinhamento na tela (Quadro):');
  const medir = async (al, sel) => {
    await page.check('input[name=al][value=' + al + ']');
    await page.waitForTimeout(150);
    return { txt: await caixaDoTexto(sel), win: await janelaDoQuadro() };
  };
  let r = await medir('dir', '.lg-txt');
  ok(perto(r.txt.right, r.win.right, 1), 'à direita: a borda do texto encosta na borda da janela (' + (r.txt.right - r.win.right).toFixed(2) + ' px)');
  ok(await page.evaluate(() => document.getElementById('pq').style.getPropertyValue('--al')) === 'right', 'a polaroid recebe --al: right');
  r = await medir('centro', '.lg-txt');
  ok(perto(r.txt.centro, r.win.centro, 1), 'ao centro: o centro do texto bate com o centro da janela (' + (r.txt.centro - r.win.centro).toFixed(2) + ' px)');
  r = await medir('esq', '.lg-txt');
  ok(perto(r.txt.left, r.win.left, 1), 'à esquerda: a borda esquerda do texto bate com a janela (' + (r.txt.left - r.win.left).toFixed(2) + ' px)');

  console.log('Alinhamento no PDF (MT-02):');
  await addScripts();
  const pdfMedido = async al => {
    await page.check('input[name=al][value=' + al + ']');
    await page.waitForTimeout(150);
    return page.evaluate(() => {
      const p = PLGERADOR.projeto();
      const L = PLGERADOR.lista(p).paginas[0];
      let cap = null;
      (function anda(xs) { xs.forEach(it => { if (it.t === 'texto' && it.txt === 'Dias de sol' && !cap) cap = it; if (it.itens) anda(it.itens); }); })(L.itens);
      if (!cap) return null;
      const f = { fam: cap.fonte.fam, peso: cap.fonte.peso, it: cap.fonte.it, pt: cap.pt, esp: cap.esp };
      const w = PLGERADOR.medir(cap.txt, f);
      return { x: cap.x, w, direito: cap.x + w, centro: cap.x + w / 2, janela: (p.fr.lado + p.fr.jw) * 1000, meio: (p.fr.lado + p.fr.jw / 2) * 1000, al: p.leg ? p.leg.al : 'esq' };
    });
  };
  let m = await pdfMedido('dir');
  ok(perto(m.direito, m.janela, 200), 'no PDF à direita: a borda do texto fica na borda da janela (' + ((m.direito - m.janela) / 1000).toFixed(3) + ' mm)');
  m = await pdfMedido('centro');
  ok(perto(m.centro, m.meio, 200), 'no PDF ao centro: o centro do texto fica no centro da janela (' + ((m.centro - m.meio) / 1000).toFixed(3) + ' mm)');
  m = await pdfMedido('esq');
  ok(perto(m.x, m.janela - 76 * 1000, 200), 'no PDF à esquerda: o texto começa na margem da foto (' + ((m.x - 6000) / 1000).toFixed(3) + ' mm)');
  ok(await page.evaluate(() => PLTEXTO.alinharX('centro', 6, 76, 20)) === 34, 'PLTEXTO.alinharX(centro, 6, 76, 20) = 34 (função única)');

  console.log('Polaroid original (D-135):');
  await page.check('input[name=al][value=esq]');
  const antes = await page.evaluate(() => JSON.stringify(PLQ.ST()[0].leg));
  await page.click('[data-sw=original]');
  await page.waitForTimeout(200);
  const comOriginal = await page.evaluate(() => {
    const p = document.getElementById('p-legendas');
    const visivel = [...document.querySelectorAll('#pq .lg-txt,#pq .lg-dt,#pq .lg-lc')].filter(e => e.offsetParent !== null || e.getClientRects().length).length;
    const secoes = [...p.querySelectorAll('section.mod')].filter(s => s.getAttribute('aria-labelledby') !== 'lm0');
    return {
      visivel, banda: document.getElementById('cap-band').hidden,
      apagadas: secoes.filter(s => s.getAttribute('aria-disabled') === 'true').length, total: secoes.length,
      veu: getComputedStyle(document.getElementById('lg-rest')).opacity,
      aviso: /Desligue/.test(p.textContent),
      leg: JSON.parse(JSON.stringify(PLQ.ST()[0].leg))
    };
  });
  ok(comOriginal.visivel === 0 && comOriginal.banda, 'com a Polaroid original o texto some do Quadro');
  ok(comOriginal.apagadas === comOriginal.total && comOriginal.veu !== '1' && comOriginal.aviso,
    'as outras seções ficam apagadas (aria-disabled + véu) com o aviso em texto');
  ok(comOriginal.leg.original === true && comOriginal.leg.al === 'esq', 'o projeto guarda original:true');

  const pdfOriginal = await gerarPdf();
  const textoOriginal = await textoDoPdf(pdfOriginal.b64);
  ok(!/Dias de sol/.test(textoOriginal) && !/14\.07\.26/.test(textoOriginal), 'no PDF não sai «Dias de sol» nem a data');
  const displayOriginal = await page.evaluate(() => {
    const p = PLGERADOR.projeto();
    const L = PLGERADOR.lista(p).paginas[0];
    let n = 0;
    (function anda(xs) { xs.forEach(it => { if (it.t === 'texto') n++; if (it.itens) anda(it.itens); }); })(L.itens);
    return n;
  });
  ok(displayOriginal === 0, 'a display list do PDF fica sem nenhum texto');

  console.log('Polaroid original nas folhas:');
  await page.goto(srv.url + 'app/editor/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0);
  const folhas = await page.evaluate(() => {
    const visivel = [...document.querySelectorAll('#sheet .pol__cap,#sheet .pol__meta,#sheet .pol__ml')].filter(e => e.offsetParent !== null || e.getClientRects().length).length;
    return { visivel, textos: document.querySelectorAll('#sheet .pol__cap').length };
  });
  ok(folhas.visivel === 0, 'nenhuma legenda visível nas folhas');
  const pv = await page.evaluate(() => {
    const C = window.PLEDITOR.ctx();
    return { bl: window.PLPREVOO.analisar().bl, fora: C.foraTodas() };
  });
  ok(!pv.bl.some(t => /área segura/.test(t)), 'o pré-voo não bloqueia por texto fora da área segura');

  console.log('Desligar devolve tudo:');
  await page.goto(srv.url + 'app/editor/quadro/#foto-1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.PLQ);
  await page.click('#tab-legendas');
  await page.waitForSelector('[data-sw=original]');
  await page.click('[data-sw=original]');
  await page.waitForTimeout(200);
  const depois = await page.evaluate(() => ({
    leg: JSON.parse(JSON.stringify(PLQ.ST()[0].leg)),
    visivel: [...document.querySelectorAll('#pq .lg-txt,#pq .lg-dt,#pq .lg-lc')].filter(e => e.getClientRects().length).length
  }));
  ok(depois.visivel > 0, 'o texto volta a aparecer no Quadro');
  const antesObj = JSON.parse(antes), depoisObj = depois.leg;
  delete antesObj.original; delete depoisObj.original;
  ok(JSON.stringify(antesObj) === JSON.stringify(depoisObj), 'ST[0].leg fica igual ao de antes de ligar (exceto «original»)');

  console.log('Assinatura no canto oposto (D-129/D-136):');
  const sig = await page.evaluate(() => {
    const st = PLQ.ST()[0].leg, pq = document.getElementById('pq');
    const s = pq.querySelector('.pq__sig').getBoundingClientRect(), w = document.getElementById('win').getBoundingClientRect();
    return { pos: PLTEXTO.assinaturaPos(st, PLQ.FR), dir: s.left > w.left + w.width / 2, textoDireita: (document.querySelector('#pq .lg-txt') || {}).getBoundingClientRect ? document.querySelector('#pq .lg-txt').getBoundingClientRect().right : 0, sigLeft: s.left, sigRight: s.right };
  });
  ok(sig.pos === 'dir' && sig.dir, 'com o texto à esquerda a assinatura vai para a direita (' + sig.pos + ')');
  ok(sig.sigLeft >= sig.textoDireita - 1, 'a assinatura não cruza o texto');

  console.log('Migração de projeto antigo (pos: acima):');
  await page.evaluate(() => {
    const q = JSON.parse(sessionStorage.getItem('pl-quadro'));
    q[0].leg = { pos: 'acima', preset: 'simples', dx: 3, dy: 0, inc: 0, txt: { on: true, font: 'Caveat', pt: 16, fit: false, caixa: 'normal', esp: 0, cor: 'preto' }, data: { on: true, font: 'IBM Plex Mono', pt: 8, fmt: 0, cor: 'preto' }, loc: { on: true, font: 'IBM Plex Mono', pt: 8, cor: 'preto', uf: 'sigla', pais: 'oculto', ocBR: true, sep: ', ', ordem: 'cidade' } };
    sessionStorage.setItem('pl-quadro', JSON.stringify(q));
  });
  const errosAntes = errosPg.length;
  await page.reload({ waitUntil: 'networkidle' });   /* recarrega a página: só o hash não bastaria */
  await page.waitForFunction(() => window.PLQ);
  await page.waitForTimeout(300);
  const mig = await page.evaluate(() => {
    const leg = PLQ.ST()[0].leg, txt = document.querySelector('#pq .lg-txt'), win = document.getElementById('win').getBoundingClientRect();
    const t = txt ? txt.getBoundingClientRect() : null;
    return { pos: leg.pos, dx: leg.dx, al: leg.al, leg, abaixo: t ? t.top >= win.bottom - 1 : false, texto: txt ? txt.textContent : '' };
  });
  ok(errosPg.length === errosAntes, 'o projeto antigo abre sem erro de página');
  ok(mig.pos === undefined && mig.dx === undefined && mig.al === 'dir', 'o projeto antigo é migrado (sem pos/dx, alinhamento dir) — ' + JSON.stringify(mig.leg));
  ok(mig.abaixo && /Dias de sol/.test(mig.texto), 'o texto que estava «acima» aparece na faixa de baixo');

  ok(errosPg.length === 0, 'nenhum erro de página durante o teste' + (errosPg.length ? ': ' + errosPg[0] : ''));
} catch (e) { ok(false, 'exceção: ' + e.message); }
finally {
  await nav.close(); srv.fechar(); srvPdfjs.close();
}
console.log(falhas.length ? `\n✘ texto-alinhado: ${falhas.length} falha(s)` : '\n✔ texto-alinhado: sem falhas');
process.exit(falhas.length ? 1 : 0);
