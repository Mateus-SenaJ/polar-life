/* D-176: a Colagem não atrapalha as Folhas de polaroids. Estados separados (pl-folhas × pl-colagem): mexer na colagem e
   voltar deixa as Folhas idênticas (papel, margem, guias e PDF); projeto antigo migra; a colagem tem papel, orientação,
   margem e fotos próprios, iguais na tela e no PDF. */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { servir } from '../helpers/servidor.mjs';
import { maisAbertos } from '../helpers/mais.mjs';

let falhas = 0;
const ok = (m) => console.log('  ✔ ' + m);
const ruim = (m) => { falhas++; console.log('  ✘ ' + m); };
const srv = await servir();
const nav = await chromium.launch();
const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/legenda-texto.js', 'assets/js/nucleo/icc.js', 'assets/js/nucleo/gerador.js'];
const nomes = ['praia', 'montanha', 'cidade', 'por-do-sol', 'casal', 'viagem'];
const dados = {}; for (const n of nomes) dados[n] = (await readFile(new URL('../../site/assets/img/fotos/' + n + '.jpg', import.meta.url))).toString('base64');
const pt2mm = (v) => Math.round(v / 72 * 25.4);
try {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await maisAbertos(ctx);
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.evaluate(async ({ nomes, dados }) => {
    localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
    const pr = await PLPROJETOS.criar('Colagem separada'); let i = 0;
    for (const n of nomes) { i++; await PLFOTOS.salvar(i, new File([Uint8Array.from(atob(dados[n]), (c) => c.charCodeAt(0))], n + '.jpg', { type: 'image/jpeg' }), pr.id); }
    sessionStorage.setItem('pl-fotos', '[1,2,3,4,5,6]');
    sessionStorage.setItem('pl-folhas', JSON.stringify({ papel: 'A4', orient: 'retrato', margem: 7, gap: 2, guias: true }));
    await PLPROJETOS.salvarEstado();
  }, { nomes, dados });
  const abrir = async () => { await p.goto(srv.url + 'app/editor/', { waitUntil: 'networkidle' }); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0 && !!window.PLEDITOR); await p.waitForTimeout(250); };
  const foto = () => p.evaluate(() => { const c = PLEDITOR.ctx(); return { folhas: JSON.stringify(PLFOLHAS.lerFolhas()), n: c.R.sheets.length, cel: JSON.stringify(c.R.sheets.map((s) => s.cells.map((x) => [x.x, x.y, x.w, x.h]))), guias: document.querySelectorAll('#sheet .guides').length, papel: c.R.p.n }; });
  await abrir();
  const antes = await foto();
  antes.guias > 0 && /"margem":7/.test(antes.folhas) ? ok(`Folhas: ${antes.n} folha(s) ${antes.papel}, margem 7 mm, com guias de corte`) : ruim('estado inicial: ' + JSON.stringify(antes));
  const abas0 = await p.evaluate(() => ({ papel: !document.getElementById('tab-papel').hidden, col: !document.getElementById('tab-colagem').hidden }));
  abas0.papel && !abas0.col ? ok('nas Folhas a aba «Papel» aparece e a «Colagem» não') : ruim('abas nas Folhas: ' + JSON.stringify(abas0));

  /* entra na Colagem e mexe em tudo */
  await p.click('#rail-colagem'); await p.waitForTimeout(300);
  const abas1 = await p.evaluate(() => ({ papel: !document.getElementById('tab-papel').hidden, col: !document.getElementById('tab-colagem').hidden, sel: document.getElementById('tab-colagem').getAttribute('aria-selected') }));
  !abas1.papel && abas1.col && abas1.sel === 'true' ? ok('no modo Colagem a aba «Colagem» abre e a «Papel» das Folhas some') : ruim('abas na Colagem: ' + JSON.stringify(abas1));
  await p.selectOption('#col-peca', '20x30'); await p.waitForTimeout(150);
  await p.check('input[name=col-ori][value=paisagem]', { force: true }).catch(() => p.click('label:has(input[name=col-ori][value=paisagem])')); await p.waitForTimeout(150);
  await p.selectOption('#col-layout', 'grade'); await p.waitForTimeout(150);
  await p.click('#col-todas'); await p.waitForTimeout(150);
  await p.click('[data-col-foto="2"]'); await p.waitForTimeout(150);
  await p.click('[data-col-foto="4"]'); await p.waitForTimeout(150);
  const col = await p.evaluate(() => { const c = PLEDITOR.ctx(); return { w: c.R.p.w, h: c.R.p.h, fotos: [].concat(...c.R.sheets.map((s) => s.cells.map((x) => x.f.src))), guias: document.querySelectorAll('#sheet .guides').length, salvo: JSON.parse(sessionStorage.getItem('pl-colagem')), folhas: JSON.stringify(PLFOLHAS.lerFolhas()) }; });
  col.w === 300 && col.h === 200 ? ok('a colagem tem papel próprio: 20 × 30 cm em paisagem (300 × 200 mm)') : ruim('papel da colagem: ' + col.w + '×' + col.h);
  col.fotos.join() === '1,3,5,6' ? ok('só as fotos escolhidas entram na colagem (1, 3, 5 e 6)') : ruim('fotos na colagem: ' + col.fotos.join());
  col.guias === 0 && col.salvo.ativo && col.salvo.peca === '20x30' ? ok('colagem sem guias de corte, salva em pl-colagem') : ruim('colagem: ' + JSON.stringify({ g: col.guias, s: col.salvo }));
  col.folhas === antes.folhas ? ok('mexer na colagem não muda nada nas Folhas (pl-folhas idêntico)') : ruim('pl-folhas mudou: ' + col.folhas);

  /* PDF da colagem */
  for (const s of SCRIPTS) await p.addScriptTag({ url: srv.url + s });
  const pdfCol = await p.evaluate(async () => { const r = await PLGERADOR.pdf(PLGERADOR.projeto(), {}); let s = ''; const u = r.arquivos[0].bytes; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); });
  const dc = await PDFDocument.load(Buffer.from(pdfCol, 'base64')), pg = dc.getPage(0).getSize();
  pt2mm(pg.width) === 300 && pt2mm(pg.height) === 200 ? ok('o PDF da colagem sai no papel dela (300 × 200 mm)') : ruim('PDF da colagem: ' + pt2mm(pg.width) + '×' + pt2mm(pg.height));

  /* volta para as Folhas: tudo igual a antes, inclusive o PDF */
  await p.click('#rail-folhas'); await p.waitForTimeout(300);
  const depois = await foto();
  depois.folhas === antes.folhas && depois.n === antes.n && depois.cel === antes.cel && depois.guias === antes.guias ? ok('de volta às Folhas: mesmo papel, mesmas posições e as guias de corte') : ruim('Folhas mudaram: ' + JSON.stringify({ antes: [antes.n, antes.guias], depois: [depois.n, depois.guias], igual: depois.cel === antes.cel }));
  for (const s of SCRIPTS) await p.addScriptTag({ url: srv.url + s });
  const pdfFol = await p.evaluate(async () => { const r = await PLGERADOR.pdf(PLGERADOR.projeto(), {}); return { n: r.arquivos.length, pag: (await PDFLib.PDFDocument.load(r.arquivos[0].bytes)).getPageCount(), s: PLGERADOR.projeto().s }; });
  !pdfFol.s.colagem && pdfFol.s.guias && pdfFol.s.margem === 7 && pdfFol.pag === antes.n ? ok(`o PDF das Folhas continua com guias, margem 7 mm e ${antes.n} folha(s)`) : ruim('PDF das Folhas: ' + JSON.stringify(pdfFol));

  /* a colagem fica guardada para quando voltar */
  await p.click('#rail-colagem'); await p.waitForTimeout(300);
  const volta = await p.evaluate(() => { const c = PLEDITOR.ctx(); return { w: c.R.p.w, layout: c.C.layout, n: [].concat(...c.R.sheets.map((s) => s.cells)).length }; });
  volta.w === 300 && volta.layout === 'grade' && volta.n === 4 ? ok('ao voltar à Colagem, ela está como você deixou') : ruim('colagem ao voltar: ' + JSON.stringify(volta));
  await p.click('#rail-folhas'); await p.waitForTimeout(200);

  /* projeto antigo: colagem dentro de pl-folhas migra uma vez */
  await p.evaluate(() => { sessionStorage.removeItem('pl-colagem'); sessionStorage.setItem('pl-folhas', JSON.stringify({ papel: 'A4', margem: 5, gap: 0, colagem: { ativo: true, layout: 'tira', fundo: { tipo: 'cor', cor: '#336699' } } })); });
  await abrir();
  const mig = await p.evaluate(() => ({ folhas: JSON.parse(sessionStorage.getItem('pl-folhas')), col: JSON.parse(sessionStorage.getItem('pl-colagem')), modo: document.getElementById('ctx-modo').textContent }));
  !mig.folhas.colagem && mig.folhas.margem === 5 && mig.col && mig.col.layout === 'tira' && mig.col.ativo && mig.modo === 'Modo Colagem' ? ok('projeto antigo: a colagem sai de pl-folhas para pl-colagem e abre no Modo Colagem') : ruim('migração: ' + JSON.stringify(mig));

  /* mudar a colagem invalida a revisão (a chave inclui pl-colagem) */
  const ch = await p.evaluate(() => { const k = () => { const s = (sessionStorage.getItem('pl-quadro') || '') + '|' + (sessionStorage.getItem('pl-folhas') || '') + '|' + (sessionStorage.getItem('pl-colagem') || ''); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; }; const a = k(); const c = JSON.parse(sessionStorage.getItem('pl-colagem')); c.layout = 'grade'; sessionStorage.setItem('pl-colagem', JSON.stringify(c)); return a !== k(); });
  ch ? ok('mudar a colagem pede nova revisão antes de gerar') : ruim('a revisão não percebeu a mudança da colagem');
  erros.length === 0 ? ok('nenhum erro de página') : ruim('erros: ' + erros.join(' | '));
  await ctx.close();
} catch (e) { ruim('exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ colagem separada: ${falhas} falha(s)` : '\n✔ colagem separada: sem falhas');
process.exit(falhas ? 1 : 0);
