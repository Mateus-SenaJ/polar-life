/* D-169: varredura de usabilidade — rotas principais × 6 tamanhos (320 a 2560 px), com conta Pro e projeto de 6 fotos CC0.
   Falha com rolagem lateral, botão/link fora da tela ou cortado, texto de botão cortado, alvo < 44 px, imagem quebrada ou distorcida, letra < 12 px.
   O painel inferior do editor no celular (#insp) recolhe por desenho e não conta como corte. */
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';
const ROTAS = (process.env.ROTAS || 'index.html,como-funciona/,legal/,app/,app/entrar/,app/inicio/,app/novo-projeto/,app/adicionar-fotos/,app/resumo/,app/editor/,app/editor/quadro/,app/editor/gerar/,app/conta/,app/conta/planos/,app/conexoes/').split(',');
const LARG = (process.env.LARG || '320x640,390x844,768x1024,1024x768,1440x900,2560x1440').split(',').map(s => s.split('x').map(Number));
const CAP = process.env.CAP === '1';
const srv = await servir(); const nav = await chromium.launch();
const ctx = await nav.newContext({ serviceWorkers: 'block' });
await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
const p = await ctx.newPage(); p.setDefaultTimeout(20000);
const nomes = ['praia', 'montanha', 'cidade', 'por-do-sol', 'casal', 'viagem'];
const dados = {}; for (const n of nomes) dados[n] = (await readFile(new URL('../../site/assets/img/fotos/' + n + '.jpg', import.meta.url))).toString('base64');
await p.goto(srv.url + 'app/adicionar-fotos/');
await p.evaluate(async ({ nomes, dados }) => {
  localStorage.removeItem('pl-projeto-atual');
  const pr = await PLPROJETOS.criar('Viagem com a turma'); let i = 0;
  for (const n of nomes) { i++; const b = Uint8Array.from(atob(dados[n]), c => c.charCodeAt(0)); await PLFOTOS.salvar(i, new File([b], n + '.jpg', { type: 'image/jpeg' }), pr.id); }
  sessionStorage.setItem('pl-fotos', JSON.stringify(nomes.map((_, k) => k + 1)));
  await PLPROJETOS.salvarEstado();
}, { nomes, dados });
const achados = [];
for (const rota of ROTAS) {
  for (const [w, h] of LARG) {
    await p.setViewportSize({ width: w, height: h });
    try { await p.goto(srv.url + rota, { waitUntil: 'networkidle', timeout: 20000 }); } catch { }
    await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const out = [], W = innerWidth;
      const rola = el => { let a = el.parentElement; while (a && a !== document.body) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll') return true; a = a.parentElement; } return false; };
      const sr = el => { const s2 = getComputedStyle(el); return s2.position === 'absolute' && (s2.clip !== 'auto' || parseFloat(s2.width) <= 1); };
      const vis = el => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !el.closest('[hidden],[aria-hidden="true"]:not(svg)'); };
      const nome = el => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) + ' «' + (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30) + '»';
      if (document.documentElement.scrollWidth > W + 1) {
        let pior = null; for (const el of document.querySelectorAll('body *')) { if (!vis(el)) continue; const b = el.getBoundingClientRect(); if (b.right > W + 1 && (!pior || b.right > pior.r)) pior = { r: b.right, el }; }
        out.push(['rolagem-horizontal', (document.documentElement.scrollWidth - W) + 'px' + (pior ? ' · ' + nome(pior.el) : '')]);
      }
      for (const el of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab]')) {
        if (!vis(el)) continue; const b = el.getBoundingClientRect(), s = getComputedStyle(el);
        if ((b.left < -1 || b.right > W + 1) && !rola(el)) out.push(['fora-da-tela', nome(el)]);
        let a = el.parentElement; while (a && a !== document.body) { const sa = getComputedStyle(a); if (!(a.id === 'insp' && innerWidth < 1024) && /(hidden|clip|auto|scroll)/.test(sa.overflowX + sa.overflowY) && !/(auto|scroll)/.test(sa.overflowX + sa.overflowY)) { const ba = a.getBoundingClientRect(); if (b.left < ba.left - 2 || b.right > ba.right + 2 || b.top < ba.top - 2 || b.bottom > ba.bottom + 2) { out.push(['cortado-pelo-pai', nome(el) + ' em ' + nome(a).split(' «')[0]]); break; } } a = a.parentElement; }
        if (!el.closest('.led-btn') && (el.tagName === 'BUTTON' || (el.tagName === 'A' && s.display !== 'inline')) && el.scrollWidth > el.clientWidth + 2 && s.overflow !== 'visible') out.push(['texto-cortado', nome(el)]);
        const alvo = el.closest('.num') || el; const ba2 = alvo.getBoundingClientRect(); if (s.display !== 'inline' && !el.closest('p,li') && (ba2.width < 43.5 || ba2.height < 43.5) && !(el.type === 'checkbox' || el.type === 'radio' || el.type === 'range')) out.push(['alvo-pequeno', Math.round(b.width) + '×' + Math.round(b.height) + ' ' + nome(el)]);
      }
      for (const el of document.querySelectorAll('button,a')) { if (!vis(el)) continue; for (const c of el.querySelectorAll('*')) { const sc = getComputedStyle(c); if (!sr(c) && !c.matches('.smoke-layer,.led-btn__bar,.btn-content') && /(hidden|clip)/.test(sc.overflow) && c.scrollWidth > c.clientWidth + 2 && c.clientWidth > 0) { out.push(['texto-cortado', nome(el)]); break; } } }
      for (const im of document.querySelectorAll('img,video')) {
        if (!vis(im)) continue; const b = im.getBoundingClientRect();
        if (im.tagName === 'IMG' && im.complete && im.naturalWidth === 0 && im.getAttribute('src')) out.push(['imagem-quebrada', im.getAttribute('src')]);
        const nw = im.naturalWidth || im.videoWidth, nh = im.naturalHeight || im.videoHeight, of = getComputedStyle(im).objectFit;
        if (nw && nh && (of === 'fill' || !of) && Math.abs((b.width / b.height) / (nw / nh) - 1) > 0.04) out.push(['distorcida', (im.getAttribute('src') || 'video') + ' ' + Math.round(b.width) + '×' + Math.round(b.height)]);
        if ((b.right > W + 1 || b.left < -1) && !rola(im)) { if (!im.closest('[class*=midia],.hero__arte,.ent__midia')) out.push(['midia-fora', im.getAttribute('src') || 'video']); }
      }
      for (const el of document.querySelectorAll('p,li,label,span,a,button,small,dd,dt,td,th,h1,h2,h3,h4')) {
        if (!vis(el) || !Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 2)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 11.5 && !el.closest('svg,.mono,.lk--mono,.selo-teste,.mdl__prev,.colag__prev,[aria-hidden=true]') && !sr(el)) out.push(['letra-pequena', fs + 'px ' + nome(el)]);
      }
      return out;
    });
    const uniq = [...new Set(r.map(x => x.join(' | ')))];
    for (const u of uniq) achados.push({ rota, tela: w + 'x' + h, p: u });
    if (CAP) await p.screenshot({ path: `tests/saida/usab/cap-${rota.replace(/\W+/g, '_')}-${w}.png`, fullPage: false });
  }
}
for (const a of achados) console.log('  ✘ ' + a.rota + ' ' + a.tela + ' · ' + a.p);
const porTipo = {}; for (const a of achados) { const t = a.p.split(' | ')[0]; porTipo[t] = (porTipo[t] || 0) + 1; }
console.log(achados.length ? '\n✘ usabilidade: ' + achados.length + ' problema(s) ' + JSON.stringify(porTipo) : '\n✔ usabilidade: ' + ROTAS.length + ' telas × ' + LARG.length + ' tamanhos sem rolagem lateral, corte, alvo pequeno, imagem quebrada ou distorcida, letra miúda');
await nav.close(); process.exit(achados.length ? 1 : 0);
