/* 50 · Qualidade em palavras e ponto na moldura (D-130), margens sem mudar a polaroid, sugestão de orientação e
   navegação entre folhas (D-133), Pro na resolução nativa (D-131). Fotos geradas por canvas (sem fotos pessoais). */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

const srv = await servir(), nav = await chromium.launch({ headless: true });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } }), falhas = [], errosPg = [];
function ok(v, m) { console.log((v ? '✔ ' : '✘ ') + m); if (!v) falhas.push(m); }
await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() }))); // Pro (D-123)
const cruza = (a, b) => a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/legenda-texto.js', 'assets/js/nucleo/gerador.js'];

try {
  const p = await ctx.newPage(); p.on('pageerror', e => errosPg.push(String(e)));
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.evaluate(async () => {                           // projeto real com 3 fotos de tamanhos conhecidos
    localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
    const pr = await PLPROJETOS.criar('Teste de qualidade');
    for (const [n, w, h] of [[1, 4000, 3000], [2, 1000, 750], [3, 400, 300]]) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      x.fillStyle = '#006194'; x.fillRect(0, 0, w, h);
      const f = new File([await new Promise(r => c.toBlob(r, 'image/jpeg', .8))], 'f' + n + '.jpg', { type: 'image/jpeg' });
      await PLFOTOS.salvar(n, f, pr.id);
    }
    sessionStorage.setItem('pl-fotos', '[1,2,3]');
  });

  /* ---- folhas: ponto por foto, na moldura, decorativo; resumo no rótulo da folha ---- */
  await p.goto(srv.url + 'app/editor/');
  await p.waitForFunction(() => document.querySelectorAll('#sheet .pl-qualidade').length === 3, null, { timeout: 15000 });
  const fol = await p.evaluate(() => [...document.querySelectorAll('#sheet .pol')].map(pol => {
    const q = pol.querySelector('.pl-qualidade'), r = e => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
    const pt = q.querySelector('.pl-qualidade__p');
    return { cls: q.className, hid: q.getAttribute('aria-hidden'), tag: q.tagName, ponto: r(pt), foto: r(pol.querySelector('.pol__ph')) };
  }));
  ok(/excelente/.test(fol[0].cls) && /boa/.test(fol[1].cls) && /borrada/.test(fol[2].cls), 'folhas: 4000 px excelente · 1000 px boa · 400 px pode sair borrada');
  ok(fol.every(f => f.hid === 'true' && f.tag === 'SPAN'), 'folhas: ponto decorativo dentro da folha (role="img")');
  ok(fol.every(f => !cruza(f.ponto, f.foto)), 'folhas: o ponto fica na moldura, fora da foto (T4)');
  const rotulo = await p.locator('#sheet').getAttribute('aria-label');
  ok(/1 foto pode sair borrada/.test(rotulo), 'folhas: o rótulo da folha resume a qualidade («' + rotulo + '»)');
  ok(!/\b(PPI|DPI)\b/.test(await p.locator('body').innerText()), 'folhas: nenhum «PPI/DPI» na interface (D-130)');
  const pv = await p.evaluate(() => PLPREVOO.analisar().pe.join(' | '));
  ok(/A foto 3 \(\d+ PPI\) pode sair borrada/.test(pv) && !/foto 2|foto 1 /i.test(pv), 'pré-voo: só a foto de 400 px, em palavras e com o número entre parênteses («' + pv.slice(0, 60) + '…»)');

  /* ---- margens: a polaroid nunca muda de medida (D-133) ---- */
  const antes = await p.evaluate(() => { const c = PLEDITOR.ctx(); return { cel: c.R.sheets[0].cells.map(x => [x.w, x.h]).flat(), fr: [c.FR.w, c.FR.h] }; });
  for (const m of ['20', '3', '12.5']) {
    await p.fill('#margem', m); await p.dispatchEvent('#margem', 'change'); await p.waitForTimeout(150);
    const d = await p.evaluate(() => { const c = PLEDITOR.ctx(); return { margem: c.D.margem, cel: c.R.sheets.flatMap(s => s.cells.map(x => [x.w, x.h])) }; });
    const fixa = d.cel.every(([w, h]) => (Math.abs(w - antes.fr[0]) < .001 && Math.abs(h - antes.fr[1]) < .001) || (Math.abs(w - antes.fr[1]) < .001 && Math.abs(h - antes.fr[0]) < .001));
    ok(fixa, `margem ${m} mm: todas as polaroids continuam ${antes.fr[0]} × ${antes.fr[1]} mm (margem aplicada ${d.margem})`);
  }

  /* ---- sugestão de orientação: aparece só quando a outra economiza folhas, e aplica ---- */
  const caso = await p.evaluate(() => {
    const c = PLEDITOR.ctx(), fotos = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, src: 1, v: false }));
    const fmts = [[88, 107, 6, 6, 76], [60, 73, 6, 6, 48], [66, 99, 3, 3, 79], [108, 86, 4.5, 5, 62], [54, 86, 4, 5, 62]];
    for (const [w, h, l, t, jh] of fmts) for (const girar of [true, false]) {
      const fr = { w, h, lado: l, topo: t, jw: w - 2 * l, jh }, d = Object.assign({}, c.D, { girar, orient: 'retrato', margem: 10 });
      const a = PLFOLHAS.paginar(d, fr, fotos), b = PLFOLHAS.paginar(Object.assign({}, d, { orient: 'paisagem' }), fr, fotos);
      if (!a.erro && !b.erro && b.sheets.length < a.sheets.length) return { fr, girar, a: a.sheets.length, b: b.sheets.length };
    }
    return null;
  });
  if (caso) {
    await p.evaluate(caso => {
      const q = [{ fr: Object.assign({ fmt: 'pers', rad: .4, ori: 'v' }, caso.fr) }];
      for (let i = 1; i <= 12; i++) q.push({ src: (i - 1) % 3 + 1, modo: 'preencher', z: 100, ang: 0, px: 0, py: 0, rot: 0, flip: false, adj: {}, flt: { id: 'original', int: 100 }, txt: '' });
      sessionStorage.setItem('pl-quadro', JSON.stringify(q)); sessionStorage.setItem('pl-fotos', JSON.stringify(q.slice(1).map(e => e.src)));
      sessionStorage.setItem('pl-folhas', JSON.stringify({ papel: 'A4', w: 210, h: 297, orient: 'retrato', girar: caso.girar, margem: 10, gap: 4, align: 'center', separar: false, guias: true, contorno: false, compr: 'continua', cor: 'preto', rodape: false, assin: true })); // objeto completo, como o app grava sessionStorage.removeItem('pl-ppi');
    }, caso);
    await p.reload(); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0);
    const vis = await p.locator('#sug-orient').isVisible();
    ok(vis && /economiza/.test(await p.locator('#sug-orient').innerText()), `sugestão aparece: paisagem usa ${caso.b} folhas em vez de ${caso.a}`);
    await p.click('#sug-orient-b'); await p.waitForTimeout(200);
    const dep = await p.evaluate(() => { const c = PLEDITOR.ctx(); return { o: c.D.orient, n: c.R.sheets.length, vis: !document.getElementById('sug-orient').hidden }; });
    ok(dep.o === 'paisagem' && dep.n === caso.b && !dep.vis, 'aplicar a sugestão vira paisagem e recalcula as folhas ao vivo');

    /* ---- navegação entre folhas: setas do teclado ---- */
    const n1 = await p.locator('#ctx-sheet').innerText();
    await p.locator('body').press('ArrowRight'); await p.waitForTimeout(150);
    const n2 = await p.locator('#ctx-sheet').innerText();
    await p.locator('body').press('ArrowLeft'); await p.waitForTimeout(150);
    ok(n1 !== n2 && (await p.locator('#ctx-sheet').innerText()) === n1, `setas passam de folha (${n1.trim()} → ${n2.trim()} → volta)`);
  } else ok(false, 'nenhum formato do catálogo economiza folhas em paisagem (caso de teste não encontrado)');

  /* ---- Quadro: selo em palavras e ponto com balão ---- */
  await p.evaluate(() => { sessionStorage.removeItem('pl-quadro'); sessionStorage.removeItem('pl-folhas'); sessionStorage.setItem('pl-fotos', '[1,2,3]'); });
  await p.goto(srv.url + 'app/editor/quadro/#foto-3');
  await p.waitForFunction(() => /borrada/.test((document.querySelector('#pq .pl-qualidade') || {}).className || ''), null, { timeout: 15000 });
  const qd = await p.evaluate(() => {
    const b = document.querySelector('#pq .pl-qualidade'), r = e => { const x = e.getBoundingClientRect(); return { x: x.x, y: x.y, w: x.width, h: x.height }; };
    return { selo: document.getElementById('seal-level').textContent, aria: b.getAttribute('aria-label'), alvo: r(b), ponto: r(b.querySelector('.pl-qualidade__p')), foto: r(document.getElementById('clip')) };
  });
  ok(qd.selo === 'Pode sair borrada' && /^Qualidade: Pode sair borrada/.test(qd.aria), 'Quadro: foto de 400 px «Pode sair borrada» no selo e no aria-label');
  ok(qd.alvo.w >= 44 && qd.alvo.h >= 44, 'Quadro: alvo de toque de 44 px (T3)');
  ok(!cruza(qd.ponto, qd.foto), 'Quadro: o ponto fica na moldura, fora da foto (T4)');
  await p.locator('#pq .pl-qualidade').focus();
  ok(await p.locator('#pq .pl-qualidade__bal').isVisible(), 'Quadro: tocar/focar o ponto abre o balão com a recomendação');
  ok(!/\b(PPI|DPI)\b/.test(await p.locator('body').innerText()), 'Quadro: nenhum «PPI/DPI» na interface (D-130)');
  await p.goto(srv.url + 'app/editor/quadro/#foto-1'); await p.reload();
  await p.waitForFunction(() => document.getElementById('seal-level').textContent === 'Excelente', null, { timeout: 15000 });
  ok(true, 'Quadro: foto de 4000 px «Excelente» (pixels reais, não os da foto de exemplo)');

  /* ---- Pro: a foto sai na resolução nativa (D-131) ---- */
  await p.goto(srv.url + 'app/editor/'); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0);
  for (const s of SCRIPTS) await p.addScriptTag({ url: srv.url + s });
  const pro = await p.evaluate(async () => {
    const pj = PLGERADOR.projeto(); await PLGERADOR.preparar(pj);
    const a = await PLGERADOR.foto(pj, 1, 326, .92), b = await PLGERADOR.foto(pj, 1, 'nativo', .95);
    return { a: a.bytes.length, b: b.bytes.length };
  });
  ok(pro.b > pro.a, `Pro: foto de 4000 px sai maior que a de 326 PPI (${pro.a} → ${pro.b} bytes)`);
  ok(!errosPg.length, 'nenhum erro de página' + (errosPg.length ? ': ' + errosPg[0] : ''));
} catch (e) { ok(false, 'exceção: ' + e.message); }
finally { await nav.close(); srv.fechar(); }
console.log(falhas.length ? `\n✘ qualidade e folhas: ${falhas.length} falha(s)` : '\n✔ qualidade e folhas: sem falhas');
process.exit(falhas.length ? 1 : 0);
