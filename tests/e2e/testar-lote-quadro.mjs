/* D-208 · Quadro: cidade em lista com busca e a pergunta «usar nas outras fotos do mesmo dia»; aba Lote (cidade por data,
   fonte, alinhamento e espaçamento para todas); «Só nesta foto» (estilo próprio) e o espaçamento entre as legendas indo
   iguais para o PDF (MT-02). Fotos de exemplo do site com data EXIF montada aqui (nenhuma foto pessoal). */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';
import { maisAbertos } from '../helpers/mais.mjs';

let falhas = 0, n = 0;
const ok = (v, m) => { n++; console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
const base = await readFile(new URL('../../site/assets/img/fotos/amigas-praia.jpg', import.meta.url));
function exif(data) {
  const b = [], u16 = (v) => b.push(v & 255, v >> 8 & 255), u32 = (v) => { u16(v & 65535); u16(v >>> 16 & 65535); };
  b.push(73, 73); u16(42); u32(8); u16(1); u16(0x8769); u16(4); u32(1); u32(26); u32(0);
  u16(1); u16(0x9003); u16(2); u32(20); u32(44); u32(0); for (const ch of data) b.push(ch.charCodeAt(0)); b.push(0);
  const corpo = [69, 120, 105, 102, 0, 0].concat(b), len = corpo.length + 2; return Buffer.from([255, 225, len >> 8, len & 255].concat(corpo));
}
const F = ['2025:11:23 10:00:00', '2025:11:23 11:00:00', '2025:11:23 12:00:00', '2025:11:24 09:00:00'].map((d) => Buffer.concat([base.subarray(0, 2), exif(d), base.subarray(2)]).toString('base64'));
const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/icc.js', 'assets/js/nucleo/gerador.js'];
try {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } }); await maisAbertos(ctx);
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.evaluate(async (F) => { localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
    const pr = await PLPROJETOS.criar('Lote'), bin = (d) => Uint8Array.from(atob(d), (c) => c.charCodeAt(0));
    for (let i = 1; i <= 4; i++) await PLFOTOS.salvar(i, new File([bin(F[i - 1])], 'f' + i + '.jpg', { type: 'image/jpeg' }), pr.id);
    sessionStorage.setItem('pl-fotos', '[1,2,3,4]'); await PLPROJETOS.salvarEstado(); }, F);
  await p.goto(srv.url + 'app/editor/quadro/#foto-1'); await p.reload();
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[4] && PLQ.ST()[4].meta && PLQ.ST()[4].meta.iso); await p.waitForTimeout(500);

  console.log('\nCidade em lista com busca:');
  await p.click('#tab-legendas'); await p.waitForTimeout(300);
  const li = (await p.evaluate(() => PLLEG.L().pad.l.map((x) => PLTEXTO.padLinha(x).t))).indexOf('loc');
  const cb = await p.evaluate((i) => { const e = document.getElementById('pl-in-' + i); return { role: e.getAttribute('role'), list: e.getAttribute('list') }; }, li);
  ok(cb.role === 'combobox' && cb.list === null, 'a linha de Localização é uma lista suspensa com busca (combobox)');
  await p.click('#pl-in-' + li); await p.waitForTimeout(200);
  ok(await p.evaluate(() => [...document.querySelectorAll('.cbx__lista:not([hidden]) .cbx__o')].some((o) => o.textContent === 'Salvador - BA')), 'aberta vazia, mostra capitais para escolher');
  await p.fill('#pl-in-' + li, 'itacar'); await p.waitForTimeout(600);
  const ops = await p.evaluate(() => [...document.querySelectorAll('.cbx__lista:not([hidden]) .cbx__o')].map((o) => o.textContent));
  ok(ops.includes('Itacaré - BA') && ops.some((o) => /^Usar «/.test(o)), 'a busca acha «Itacaré - BA» e oferece usar o texto digitado (' + ops.join(', ') + ')');
  await p.click('.cbx__lista:not([hidden]) .cbx__o >> text=Itacaré - BA'); await p.waitForTimeout(400);
  const dl = await p.evaluate(() => ({ vis: !document.getElementById('cid-dlg').hidden, t: document.getElementById('cid-t').textContent, d: document.getElementById('cid-d').textContent, foco: document.activeElement.id }));
  ok(dl.vis && /Itacaré - BA/.test(dl.t) && /23\/11\/2025/.test(dl.t) && /mais 2 fotos/.test(dl.d), 'pop-up: «' + dl.t + '» · ' + dl.d);
  ok(dl.foco === 'cid-sim', 'o foco vai para o botão do pop-up');
  await p.click('#cid-sim'); await p.waitForTimeout(600);
  let cid = await p.evaluate(() => PLQ.ST().slice(1).map((e) => e.meta.c));
  ok(cid.join('|') === 'Itacaré - BA|Itacaré - BA|Itacaré - BA|', 'aplicada nas 3 fotos de 23/11; a de 24/11 não muda');
  ok(await p.inputValue('#pl-in-' + li) === 'Itacaré - BA', 'a linha da foto mostra a cidade escolhida');

  console.log('\nAba Lote:');
  await p.click('#tab-lote'); await p.waitForTimeout(400);
  const tabs = await p.evaluate(() => [...document.querySelectorAll('[role=tab]')].map((t) => t.textContent));
  ok(tabs.join() === 'Ajustes,Legendas,Molduras,Lote', 'a aba Lote vem depois de Ajustes, Legendas e Molduras');
  const dias = await p.evaluate(() => [...document.querySelectorAll('.lt-dia strong')].map((e) => e.textContent));
  ok(dias.join() === '23/11/2025,24/11/2025', 'a aba Lote agrupa as fotos por data (' + dias.join(', ') + ')');
  await p.fill('#lt-cid-1', 'Salvad'); await p.waitForTimeout(600); await p.click('.cbx__lista:not([hidden]) .cbx__o >> text=Salvador - BA'); await p.waitForTimeout(400);
  cid = await p.evaluate(() => PLQ.ST().slice(1).map((e) => e.meta.c));
  ok(cid[3] === 'Salvador - BA' && cid[0] === 'Itacaré - BA', 'escolher a cidade de um dia aplica só nas fotos desse dia');
  await p.selectOption('#lt-font', 'Dancing Script'); await p.waitForTimeout(300);
  await p.check('input[name=lt-al][value=centro]', { force: true }); await p.waitForTimeout(300);
  await p.evaluate(() => { const r = document.getElementById('lt-lsp'); r.value = 2; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.waitForTimeout(300);
  const est = await p.evaluate(() => { const l = PLLEG.L(); return { f: l.pad.l.map((x) => x.font), al: l.al, lsp: l.lsp }; });
  ok(est.f.every((x) => x === 'Dancing Script') && est.al === 'centro' && est.lsp === 2, 'fonte, alinhamento e espaçamento para todas de uma vez (' + JSON.stringify(est) + ')');

  console.log('\nSó nesta foto (e no PDF):');
  await p.click('#tab-legendas'); await p.waitForTimeout(300);
  await p.click('[data-lgx-on]'); await p.waitForTimeout(300);
  await p.selectOption('#lgx-font', 'Caveat'); await p.waitForTimeout(200);
  await p.evaluate(() => { const r = document.getElementById('lgx-esc'); r.value = 130; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.waitForTimeout(300);
  const lgx = await p.evaluate(() => PLQ.ST().slice(1).map((e) => e.lgx ? JSON.stringify(e.lgx) : '-'));
  ok(lgx[0] === '{"font":"Caveat","esc":130}' && lgx.slice(1).every((x) => x === '-'), 'o estilo próprio fica só na Foto 01 (' + lgx[0] + ')');
  await p.goto(srv.url + 'app/editor/'); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length >= 4); await p.waitForTimeout(400);
  for (const s of SCRIPTS) await p.addScriptTag({ url: srv.url + s });
  const pdf = await p.evaluate(async () => { const pr = PLGERADOR.projeto(); await PLGERADOR.preparar(pr); const L = PLGERADOR.lista(pr), tx = [];
    (function wk(o) { if (Array.isArray(o)) return o.forEach(wk); if (o && o.t === 'grupo') return wk(o.itens); if (o && o.t === 'texto') tx.push({ txt: o.txt, fam: o.fonte.fam, pt: o.pt, y: o.y }); })(L.paginas[0].itens);
    return tx; });
  const f1 = pdf.filter((t) => t.fam === 'Caveat'), outras = pdf.filter((t) => t.fam === 'Dancing Script');
  ok(f1.length === 2 && outras.length >= 6, 'PDF: a Foto 01 sai em Caveat e as outras em Dancing Script (' + f1.length + ' + ' + outras.length + ' linhas)');
  const p1 = Math.max(...f1.map((t) => t.pt)), po = Math.max(...outras.map((t) => t.pt));
  ok(Math.abs(p1 / po - 1.3) < 0.03, 'PDF: o tamanho da Foto 01 é 130% do das outras (' + p1 + ' pt × ' + po + ' pt)');
  const dy = (L) => { const y = L.map((t) => t.y).sort((a, b) => a - b); return y.length >= 2 ? (y[1] - y[0]) / 1000 : 0; };
  ok(dy(outras.slice(0, 2)) > 2, 'PDF: com 2 mm a mais de espaçamento, a 2ª linha desce (' + dy(outras.slice(0, 2)).toFixed(2) + ' mm entre as bases)');
  ok(!erros.length, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await ctx.close();
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.fechar();
console.log('\n' + (falhas ? '✘ ' + falhas + ' de ' + n + ' falharam' : '✔ ' + n + ' conferências'));
process.exit(falhas ? 1 : 0);
