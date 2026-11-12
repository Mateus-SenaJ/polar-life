/* D-179: a letra das fotos do Retro Pocket. As polaroids do dono usam Lucida Calligraphy (proprietária, sem licença para embutir);
   o Pocket nasce com Fondamento Itálico, a livre mais parecida, e o catálogo ganha 10 caligráficas da mesma família (só legendas).
   Confere: padrão do Pocket na tela, nas Folhas e no PDF; «Voltar ao padrão» no Pocket; as 11 no seletor e embutidas no PDF sem
   fonte reserva; e as linhas do Pocket no Quadro nas mesmas medidas do PDF (antes ficavam 3 mm acima e à esquerda). */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';
import { maisAbertos } from '../helpers/mais.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
const foto = (await readFile(new URL('../../site/assets/img/fotos/praia.jpg', import.meta.url))).toString('base64');
const NOVAS = ['Fondamento Itálico', 'Fondamento', 'Quintessential', 'Felipa', 'Marck Script', 'Niconne', 'Bilbo Swash Caps', 'Almendra', 'Courgette', 'Oregano', 'Merienda', 'Sofia'];
const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/icc.js', 'assets/js/nucleo/gerador.js'];

async function projetoPocket(p) {
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.evaluate(async (d) => {
    localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
    const pr = await PLPROJETOS.criar('Pocket de viagem');
    for (let i = 1; i <= 2; i++) await PLFOTOS.salvar(i, new File([Uint8Array.from(atob(d), (c) => c.charCodeAt(0))], 'f.jpg', { type: 'image/jpeg' }), pr.id);
    sessionStorage.setItem('pl-fotos', '[1,2]'); sessionStorage.setItem('pl-fmt', 'pocket');
    await PLPROJETOS.salvarEstado();
  }, foto);
}
async function abrirQuadro(p) {
  await p.goto(srv.url + 'app/editor/quadro/#foto-1'); await p.reload();
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[0] && PLQ.ST()[0].fr && PLQ.ST()[0].fr.fmt === 'pocket');
  await p.click('#tab-legendas'); await p.waitForSelector('#pl-in-0');
}
const linhasQ = (p) => p.evaluate(() => {
  const pq = document.getElementById('pq'), R = pq.getBoundingClientRect(), FR = PLQ.FR, pmm = R.width / FR.cw;
  const l = PLTEXTO.comPadrao(PLQ.ST()[0].leg, PLQ.S()), LNS = PLTEXTO.linhas(l, FR, PLTEXTO.medTela, { temData: true, temLoc: true });
  return [...pq.querySelectorAll('.lg-l--x')].map((e, i) => { const b = e.getBoundingClientRect(), t = e.firstElementChild || e, cs = getComputedStyle(t);
    return { txt: e.textContent, dTop: Math.abs((b.top - R.top) / pmm - LNS[i].top), dLeft: Math.abs((b.left - R.left) / pmm - FR.cl), fam: cs.fontFamily, it: cs.fontStyle }; });
});

try {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    console.log(`\n${w}×${h} · Pocket novo:`);
    const ctx = await nav.newContext({ viewport: { width: w, height: h } });
    await maisAbertos(ctx);
    await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
    const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
    await projetoPocket(p);
    await abrirQuadro(p);
    const leg = await p.evaluate(() => { const l = PLQ.ST()[0].leg; return [l.data.font, l.loc.font]; });
    ok(leg[0] === 'Fondamento Itálico' && leg[1] === 'Fondamento Itálico', 'o Pocket nasce com Fondamento Itálico nas duas linhas (' + leg + ')');
    await p.fill('#pl-in-0', 'Taipú de Fora - BA'); await p.fill('#pl-in-1', 'Farol de Taipú de Fora'); await p.waitForTimeout(500);
    const L = await linhasQ(p);
    ok(L.length === 2 && L[0].txt === 'Taipú de Fora - BA' && L[1].txt === 'Farol de Taipú de Fora', 'Quadro: as duas linhas digitadas');
    ok(L.every((x) => /Fondamento/.test(x.fam) && x.it === 'italic'), 'Quadro: as linhas saem em Fondamento itálico de verdade (' + L.map((x) => x.fam.split(',')[0] + ' ' + x.it).join(' · ') + ')');
    ok(L.every((x) => x.dTop <= 0.3 && x.dLeft <= 0.3), 'Quadro = PDF: topo e lateral de cada linha batem com PLTEXTO.linhas (Δ ≤ 0,3 mm: ' + L.map((x) => x.dTop.toFixed(2) + '/' + x.dLeft.toFixed(2)).join(', ') + ')');
    if (w === 1440) {
      /* seletor: a categoria Caligráfica tem as 11 */
      await p.click('[data-fsel="ln"]');
      const lista = await p.evaluate(() => [...document.querySelectorAll('[data-pick]')].map((b) => b.getAttribute('data-pick')));
      const faltam = NOVAS.filter((n) => !lista.includes(n));
      ok(!faltam.length, 'o seletor de fonte da legenda tem Fondamento e as 10 parecidas' + (faltam.length ? ' (faltam ' + faltam + ')' : ''));
      await p.keyboard.press('Escape');
      /* Folhas */
      await p.goto(srv.url + 'app/editor/'); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol .pol__ml').length >= 2);
      const fl = await p.evaluate(() => [...document.querySelectorAll('#sheet .pol')[0].querySelectorAll('.pol__ml')].map((e) => { const cs = getComputedStyle(e.firstElementChild || e); return e.textContent.trim() + '|' + cs.fontFamily.split(',')[0] + '|' + cs.fontStyle; }));
      ok(fl.length === 2 && fl.every((x) => /Fondamento/.test(x) && /italic$/.test(x)) && /Taipú de Fora - BA/.test(fl[0]), 'Folhas: as mesmas linhas em Fondamento itálico (' + fl.join(' · ') + ')');
      /* PDF com cada uma das 11 fontes: embutida de verdade, sem fonte reserva */
      for (const s of SCRIPTS) await p.addScriptTag({ url: srv.url + s });
      const pdfs = await p.evaluate(async (nomes) => {
        const out = [];
        for (const n of nomes) {
          const q = JSON.parse(sessionStorage.getItem('pl-quadro')); q[0].leg.data.font = n; q[0].leg.loc.font = n; sessionStorage.setItem('pl-quadro', JSON.stringify(q));
          const r = await PLGERADOR.pdf(PLGERADOR.projeto(), {});
          const reserva = (r.avisos || []).filter((a) => /Reserva/.test(JSON.stringify(a)));
          const txt = []; (function wk(o) { if (!o) return; if (Array.isArray(o)) return o.forEach(wk); if (typeof o === 'object') { if (typeof o.txt === 'string' && o.t === 'texto') txt.push(o.fonte.fam + (o.fonte.it ? ' i' : '')); Object.keys(o).forEach((k) => { if (o[k] && typeof o[k] === 'object') wk(o[k]); }); } })(PLGERADOR.lista(PLGERADOR.projeto()));
          out.push({ n, ok: r.arquivos.length === 1 && !reserva.length, fams: [...new Set(txt)].join(',') });
        }
        return out;
      }, NOVAS);
      const ruins = pdfs.filter((x) => !x.ok);
      ok(!ruins.length, 'PDF: as 12 opções novas (Fondamento, Fondamento Itálico e as 10 parecidas) embutidas no arquivo, sem fonte reserva' + (ruins.length ? ' · ' + JSON.stringify(ruins) : ''));
      const f0 = pdfs[0].fams;
      ok(/Fondamento i/.test(f0), 'PDF: Fondamento Itálico sai como Fondamento itálico (' + f0 + ')');
      /* «Voltar ao padrão» no Pocket volta para o padrão do Pocket */
      await abrirQuadro(p);
      await p.evaluate(() => { const l = PLQ.ST()[0].leg; l.data.font = 'Caveat'; l.loc.font = 'Caveat'; PLQ.commit('t'); });
      await p.evaluate(() => { const b = document.getElementById('lg-rtudo'); b.hidden = false; b.click(); });
      await p.waitForTimeout(300);
      const rt = await p.evaluate(() => { const l = PLQ.ST()[0].leg; return [l.data.font, l.loc.font, l.meta]; });
      ok(rt[0] === 'Fondamento Itálico' && rt[1] === 'Fondamento Itálico', '«Voltar ao padrão» num projeto Pocket volta ao Fondamento Itálico (' + rt + ')');
    }
    ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
    await ctx.close();
  }
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ fonte do Pocket: ${falhas} falha(s)` : '\n✔ fonte do Pocket: sem falhas');
process.exit(falhas ? 1 : 0);
