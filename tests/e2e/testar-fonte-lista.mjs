/* D-186: Fonte da legenda em lista suspensa (busca; Todas · Favoritas · Recentes · Itálico e negrito; grupos por categoria),
   com os botões Itálico e Negrito sempre à vista, ao lado da fonte. Favoritas e recentes ficam no aparelho (pl-fontes).
   Famílias novas com itálico e negrito reais, iguais na tela e no PDF. Projeto com fotos de exemplo do site (CC0). */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
const foto = (await readFile(new URL('../../site/assets/img/fotos/praia.jpg', import.meta.url))).toString('base64');
const COM_IN = ['IBM Plex Mono', 'Space Mono', 'Playfair Display', 'Merriweather', 'Alegreya', 'Cormorant Garamond', 'Josefin Sans'];
const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/icc.js', 'assets/js/nucleo/gerador.js'];

async function abrir(p) {
  await p.goto(srv.url + 'app/editor/quadro/#foto-1'); await p.reload();
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[1]);
  await p.click('#tab-legendas'); await p.waitForSelector('[data-fsel="ln"]');
  await p.fill('#pl-in-0', 'Itacaré - BA'); await p.waitForTimeout(150);
}
const linha = (p) => p.evaluate(() => { const l = PLQ.ST()[0].leg.pad.l[0]; return { font: l.font || PLQ.ST()[0].leg.loc.font, b: !!l.b, it: !!l.it }; });
const lista = (p) => p.evaluate(() => [...document.querySelectorAll('#fpick .fitem__b')].map((b) => b.getAttribute('data-pick')));
try {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    console.log(`\n${w}×${h}:`);
    const ctx = await nav.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
    const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
    await p.goto(srv.url + 'app/adicionar-fotos/');
    await p.evaluate(async (d) => {
      localStorage.removeItem('pl-projeto-atual'); localStorage.removeItem('pl-fontes'); localStorage.removeItem('pl-mais'); sessionStorage.clear();
      const pr = await PLPROJETOS.criar('Fontes');
      for (let i = 1; i <= 2; i++) await PLFOTOS.salvar(i, new File([Uint8Array.from(atob(d), (c) => c.charCodeAt(0))], 'f.jpg', { type: 'image/jpeg' }), pr.id);
      sessionStorage.setItem('pl-fotos', '[1,2]'); await PLPROJETOS.salvarEstado();
    }, foto);
    await abrir(p);

    const linhaUI = await p.evaluate(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, vis: !!e.offsetParent }; };
      return { sel: r('[data-fsel="ln"]'), it: r('[data-est="it"]'), b: r('[data-est="b"]'), rotIt: (document.querySelector('[data-est="it"]') || {}).textContent, rotB: (document.querySelector('[data-est="b"]') || {}).textContent, larg: document.documentElement.scrollWidth <= innerWidth }; });
    ok(linhaUI.sel && linhaUI.it && linhaUI.b && linhaUI.it.vis && linhaUI.b.vis && Math.abs(linhaUI.it.y - linhaUI.sel.y) < 4 && linhaUI.it.x > linhaUI.sel.x, 'Itálico e Negrito à vista, na mesma linha da fonte (sem abrir «mais ajustes»)');
    ok(/Itálico/.test(linhaUI.rotIt) && /Negrito/.test(linhaUI.rotB) && linhaUI.it.h >= 44 && linhaUI.b.h >= 44 && linhaUI.larg, 'um botão para cada, com ícone e nome, 44 px ou mais, sem rolagem lateral');

    await p.click('[data-fsel="ln"]');
    const ab = await p.evaluate(() => ({ chips: [...document.querySelectorAll('#fpick [data-fcat]')].map((b) => b.textContent), grupos: [...document.querySelectorAll('#fpick .fgrp')].map((g) => g.textContent), busca: !!document.getElementById('fbusca'), exp: document.querySelector('[data-fsel="ln"]').getAttribute('aria-expanded') }));
    ok(ab.exp === 'true' && ab.busca && ab.chips.join() === 'Todas,Favoritas,Recentes,Itálico e negrito', 'lista suspensa com busca e filtros: ' + ab.chips.join(' · '));
    ok(ab.grupos.includes('Favoritas') && ['Manuscrita', 'Caligráfica', 'Datilografada', 'Editorial', 'Limpa'].every((g) => ab.grupos.includes(g)), 'grupos: ' + ab.grupos.join(', '));

    await p.click('[data-fcat="in"]');
    const inl = await lista(p);
    const badges = await p.evaluate(() => [...document.querySelectorAll('#fpick .fitem')].every((li) => li.querySelector('.fvar--i') && li.querySelector('.fvar--b')));
    ok(COM_IN.every((n) => inl.includes(n)) && badges, '«Itálico e negrito» mostra só as que têm os dois (' + inl.length + '), com as 7 novas');
    await p.click('[data-pick="Merriweather"]'); await p.waitForTimeout(200);
    let L = await linha(p);
    ok(L.font === 'Merriweather' && !(await p.$('#fpick')), 'escolher fecha a lista e aplica Merriweather');
    await p.click('[data-est="it"]'); await p.waitForTimeout(150); await p.click('[data-est="b"]'); await p.waitForTimeout(250);
    L = await linha(p);
    const cs = await p.evaluate(() => { const e = document.querySelector('#pq .lg-l--x, #cap-meta .lg-m, #pq .lg-lc, #pq .lg-dt'); const c = getComputedStyle(e.querySelector('*') || e); return { f: c.fontFamily, s: c.fontStyle, w: c.fontWeight }; });
    ok(L.it && L.b && /Merriweather/.test(cs.f) && cs.s === 'italic' && +cs.w === 700, 'Itálico e Negrito ligados: a linha sai em Merriweather itálico negrito (' + JSON.stringify(cs) + ')');
    ok((await p.getAttribute('[data-est="it"]', 'aria-pressed')) === 'true' && (await p.getAttribute('[data-est="b"]', 'aria-pressed')) === 'true', 'os dois botões mostram que estão ligados');

    await p.click('[data-fsel="ln"]'); await p.click('[data-fcat="todas"]');
    await p.click('[data-fav="Space Mono"]'); await p.waitForTimeout(100);
    await p.click('[data-fcat="fav"]');
    const fav = await lista(p);
    await p.click('[data-fcat="rec"]');
    const rec = await lista(p);
    ok(fav.includes('Space Mono') && rec[0] === 'Merriweather', 'favoritar põe em «Favoritas»; a escolhida vai para o topo de «Recentes»');
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    ok(!(await p.$('#fpick')) && await p.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-fsel') === 'ln'), 'Esc fecha a lista e volta o foco para o campo');
    await p.click('[data-fsel="ln"]'); await p.focus('#fbusca'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
    const foco = await p.evaluate(() => document.activeElement && document.activeElement.className);
    await p.mouse.click(5, 5); await p.waitForTimeout(100);
    ok(/fitem__b/.test(foco) && !(await p.$('#fpick')), 'setas ↓ andam pelas fontes; tocar fora fecha');
    await p.click('[data-fsel="ln"]'); await p.fill('#fbusca', 'sacra'); await p.waitForTimeout(150);
    await p.click('[data-pick="Sacramento"]'); await p.waitForTimeout(200);
    const dis = await p.evaluate(() => ({ it: document.querySelector('[data-est="it"]').disabled, b: document.querySelector('[data-est="b"]').disabled, msg: document.getElementById('lg-est-h').textContent }));
    ok(dis.it && dis.b && /não tem itálico/.test(dis.msg) && /não tem negrito/.test(dis.msg), 'fonte sem variantes: os dois botões desabilitados e explicam («' + dis.msg + '»)');

    await p.reload(); await p.waitForFunction(() => window.PLQ && PLQ.ST()[1]); await p.click('#tab-legendas'); await p.click('[data-fsel="ln"]'); await p.click('[data-fcat="fav"]');
    const fav2 = await lista(p); await p.click('[data-fcat="rec"]'); const rec2 = await lista(p);
    ok(fav2.includes('Space Mono') && rec2[0] === 'Sacramento' && rec2.includes('Merriweather'), 'favoritas e recentes continuam depois de recarregar (ficam no aparelho)');
    await p.keyboard.press('Escape');

    if (w === 1440) {
      /* PDF: cada família nova em itálico negrito, embutida de verdade */
      for (const s of SCRIPTS) await p.addScriptTag({ url: srv.url + s });
      const pdf = await p.evaluate(async (nomes) => {
        const out = [];
        for (const n of nomes) {
          const q = JSON.parse(sessionStorage.getItem('pl-quadro')); q[0].leg.pad.l[0] = Object.assign({}, q[0].leg.pad.l[0], { font: n, b: true, it: true }); sessionStorage.setItem('pl-quadro', JSON.stringify(q));
          const pr = PLGERADOR.projeto(), r = await PLGERADOR.pdf(pr, {});
          const reserva = (r.avisos || []).filter((a) => /Reserva/.test(JSON.stringify(a)));
          const fs = []; (function wk(o) { if (!o) return; if (Array.isArray(o)) return o.forEach(wk); if (typeof o === 'object') { if (o.t === 'texto' && o.txt === 'Itacaré - BA') fs.push(o.fonte.fam + ' ' + o.fonte.peso + (o.fonte.it ? 'i' : '')); Object.keys(o).forEach((k) => { if (o[k] && typeof o[k] === 'object') wk(o[k]); }); } })(PLGERADOR.lista(pr));
          out.push({ n, ok: r.arquivos.length === 1 && !reserva.length, f: fs[0] });
        }
        return out;
      }, COM_IN);
      const ruins = pdf.filter((x) => !x.ok || !new RegExp('700i$').test(x.f || ''));
      ok(!ruins.length, 'PDF: as 7 famílias novas saem em itálico negrito, embutidas sem fonte reserva' + (ruins.length ? ' · ' + JSON.stringify(ruins) : ''));
    }
    ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
    await ctx.close();
  }
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ lista de fontes: ${falhas} falha(s)` : '\n✔ lista de fontes: sem falhas');
process.exit(falhas ? 1 : 0);
