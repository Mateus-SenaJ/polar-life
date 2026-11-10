#!/usr/bin/env node
// Teste do recorte no Modo Quadro (T-08 · FN-04, FN-12): arrastar 1:1, roda ancorada no cursor, pinça,
// duplo clique/toque, teclado em mm, histórico por gesto e cobertura da janela (sem fundo branco).
// Uso: npm run testar:recorte  (Chromium do Playwright)
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

const falhas = [];
const ok = (c, m) => { if (c) console.log('  ✔ ' + m); else { falhas.push(m); console.log('  ✘ ' + m); } };
const perto = (a, b, e) => Math.abs(a - b) <= e;

const srv = await servir();
const nav = await chromium.launch();
const page = await nav.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() }))); // guarda de /app/ exige conta (D-123)
page.setDefaultTimeout(30000);
const errosPg = [];
page.on('pageerror', e => errosPg.push(String(e)));

const ler = () => page.evaluate(() => {
  const w = document.getElementById('win').getBoundingClientRect();
  const ph = document.querySelector('#clip .ph').getBoundingClientRect();
  const s = PLQ.ST()[PLQ.cur()];
  let salvo = null;
  try { const q = JSON.parse(sessionStorage.getItem('pl-quadro') || 'null'); salvo = q && q[PLQ.cur()] ? { z: q[PLQ.cur()].z, px: q[PLQ.cur()].px, py: q[PLQ.cur()].py } : null; } catch (e) { }
  return {
    win: { x: w.x, y: w.y, w: w.width, h: w.height },
    ph: { x: ph.x, y: ph.y, w: ph.width, h: ph.height },
    st: { z: s.z, px: s.px, py: s.py, modo: s.modo, ex: s.ex || 0, ey: s.ey || 0 },
    campo: document.getElementById('zoom').value,
    sel: document.getElementById('zoom-r').value,
    salvo
  };
});
const zoom = v => page.evaluate(v => { const r = document.getElementById('zoom-r'); r.value = String(v); r.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const central = () => page.evaluate(() => { const b = document.getElementById('win').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });

try {
  await page.goto(srv.url + 'app/editor/quadro/#foto-3', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.PLQ && PLQ.N > 0);
  await page.waitForTimeout(300);

  console.log('Roda do mouse: 10% por passo, ancorada no ponto do cursor:');
  const a0 = await ler();
  ok(a0.st.z === 100 && a0.st.modo === 'preencher', 'a Foto 03 abre com zoom 100% no modo Preencher (' + a0.st.z + '%)');
  const c0 = await central();
  await page.mouse.move(c0.x - a0.win.w * 0.2, c0.y - a0.win.h * 0.2);   /* cursor longe do centro: o ancoramento aparece */
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(60); }
  await page.waitForTimeout(150);
  const a1 = await ler();
  ok(perto(a1.st.z, 133, 3), '3 passos de roda levam a 133% (' + a1.st.z + '%)');
  const ax = (c0.x - a0.win.w * 0.2 - a0.win.x) / a0.win.w, ay = (c0.y - a0.win.h * 0.2 - a0.win.y) / a0.win.h;
  const f = a1.st.z / a0.st.z;
  ok(perto(a1.st.px, a0.st.px + (1 - f) * (ax - .5 - a0.st.px), 0.01) && perto(a1.st.py, a0.st.py + (1 - f) * (ay - .5 - a0.st.py), 0.01),
    'o ponto sob o cursor fica parado no zoom (px ' + a1.st.px.toFixed(4) + ' · py ' + a1.st.py.toFixed(4) + ')');
  ok(a1.campo === String(a1.st.z) && a1.sel === String(a1.st.z), 'o campo e o deslizador de zoom acompanham o gesto (' + a1.campo + '%)');
  ok(a1.st.ex === 0 && a1.st.ey === 0, 'sem elástico fora da borda');

  console.log('Desfazer devolve o gesto inteiro de uma vez:');
  await page.click('#undo');
  await page.waitForTimeout(150);
  const a2 = await ler();
  ok(a2.st.z === 100 && perto(a2.st.px, a0.st.px, 1e-6), 'um só desfazer volta o zoom para 100% e a posição ao ponto de partida');

  console.log('Selo de qualidade ao vivo (BR-12):');
  const c0b = await central();
  await page.mouse.move(c0b.x, c0b.y);
  for (let i = 0; i < 16; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(40); }
  await page.waitForTimeout(200);
  const selo = await page.evaluate(() => ({ n: document.getElementById('seal').getAttribute('data-n'), t: document.getElementById('seal-level').textContent }));
  const a3 = await ler();
  ok(a3.st.z === 400, 'a roda leva o zoom até 400% (' + a3.st.z + '%)');
  ok(selo.n === 'borrada' && /borrada/i.test(selo.t), 'o selo avisa ao vivo que a foto pode sair borrada (' + selo.t + ')');
  await page.click('#undo');
  await page.waitForTimeout(200);
  const a4 = await ler();
  ok(a4.st.z === 100, 'um só desfazer volta do zoom máximo (' + a4.st.z + '%)');

  console.log('Arrastar 1:1 com o mouse:');
  await zoom(150);
  await page.waitForTimeout(150);
  const b0 = await ler();
  ok(b0.st.z === 150, 'zoom 150% pelo deslizador (' + b0.st.z + '%)');
  const c1 = await central();
  await page.mouse.move(c1.x, c1.y);
  await page.mouse.down();
  await page.mouse.move(c1.x + 30, c1.y, { steps: 6 });
  await page.mouse.move(c1.x + 60, c1.y, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  const b1 = await ler();
  ok(perto(b1.ph.x - b0.ph.x, 60, 2), 'arrastar 60 px move a imagem 60 px (' + (b1.ph.x - b0.ph.x).toFixed(1) + ' px)');
  ok(b1.st.px > b0.st.px && b1.st.z === 150, 'o estado guarda o novo deslocamento (px ' + b1.st.px.toFixed(4) + ')');
  ok(b1.st.ex === 0 && b1.st.ey === 0, 'o elástico volta a zero ao soltar');
  ok(b1.salvo && perto(b1.salvo.px, b1.st.px, 1e-9) && b1.salvo.z === b1.st.z, 'o PDF lê o mesmo estado da prévia (MT-02)');

  console.log('Desfazer volta o arrasto inteiro:');
  await page.click('#undo');
  await page.waitForTimeout(150);
  const b2 = await ler();
  ok(perto(b2.ph.x, b0.ph.x, 0.5) && b2.st.z === 150, 'um só desfazer volta a foto ao lugar antes do arrasto');
  await page.click('#redo');
  await page.waitForTimeout(150);
  const b3 = await ler();
  ok(perto(b3.ph.x, b1.ph.x, 0.5), 'refazer volta ao lugar depois do arrasto');

  console.log('Pinça de dois dedos (toque):');
  const antesP = await ler();
  const pinca = await page.evaluate(() => {
    const win = document.getElementById('win'), b = win.getBoundingClientRect();
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    const ev = (tipo, id, x, y) => win.dispatchEvent(new PointerEvent(tipo, { pointerId: id, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: id === 1 }));
    ev('pointerdown', 1, cx - 40, cy); ev('pointerdown', 2, cx + 40, cy);
    ev('pointermove', 1, cx - 80, cy); ev('pointermove', 2, cx + 80, cy);
    ev('pointerup', 1, cx - 80, cy); ev('pointerup', 2, cx + 80, cy);
    return true;
  });
  await page.waitForTimeout(200);
  const d1 = await ler();
  ok(pinca && d1.st.z > antesP.st.z, 'a pinça amplia a foto (' + antesP.st.z + '% → ' + d1.st.z + '%)');
  ok(d1.campo === String(d1.st.z), 'o campo de zoom acompanha a pinça (' + d1.campo + '%)');

  console.log('Duplo clique/toque: 200% no ponto e volta ao zoom anterior:');
  await page.click('#undo');
  await page.waitForTimeout(150);
  const e0 = await ler();
  const c2 = await central();
  await page.mouse.dblclick(c2.x - e0.win.w * 0.15, c2.y - e0.win.h * 0.15);
  await page.waitForTimeout(250);
  const e1 = await ler();
  ok(e1.st.z === 200, 'o duplo clique leva a 200% (' + e1.st.z + '%)');
  ok(Math.abs(e1.st.px - e0.st.px) > 1e-6, 'o zoom ancorou no ponto do clique (px ' + e1.st.px.toFixed(4) + ')');
  await page.mouse.dblclick(c2.x - e0.win.w * 0.15, c2.y - e0.win.h * 0.15);
  await page.waitForTimeout(250);
  const e2 = await ler();
  ok(e2.st.z === e0.st.z && perto(e2.st.px, e0.st.px, 1e-6), 'o segundo duplo clique volta ao zoom anterior (' + e2.st.z + '%)');

  console.log('Teclado: setas em mm, + e − em 10%, 0 centraliza:');
  await zoom(150);
  await page.waitForTimeout(150);
  const f0 = await ler();
  await page.focus('#win');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  const f1 = await ler();
  ok(perto(f1.st.px - f0.st.px, 1 / 76, 1e-4), 'a seta para a direita move 1 mm (' + ((f1.st.px - f0.st.px) * 76).toFixed(2) + ' mm)');
  ok(perto(f1.ph.x - f0.ph.x, f0.win.w / 76, 1), 'na tela, 1 mm = ' + (f0.win.w / 76).toFixed(2) + ' px (' + (f1.ph.x - f0.ph.x).toFixed(2) + ' px)');
  await page.keyboard.press('Shift+ArrowRight');
  await page.waitForTimeout(150);
  const f2 = await ler();
  ok(perto((f2.st.px - f1.st.px) * 76, 5, 0.02), 'com Shift a seta move 5 mm (' + ((f2.st.px - f1.st.px) * 76).toFixed(2) + ' mm)');
  await page.keyboard.press('+');
  await page.waitForTimeout(150);
  const f3 = await ler();
  ok(perto(f3.st.z, Math.round(f2.st.z * 1.1), 1), 'o + amplia 10% (' + f2.st.z + '% → ' + f3.st.z + '%)');
  await page.keyboard.press('-');
  await page.waitForTimeout(150);
  const f4 = await ler();
  ok(f4.st.z < f3.st.z, 'o − reduz o zoom (' + f3.st.z + '% → ' + f4.st.z + '%)');
  await page.keyboard.press('0');
  await page.waitForTimeout(150);
  const f5 = await ler();
  ok(f5.st.px === 0 && f5.st.py === 0, 'o 0 centraliza a foto');

  console.log('A janela nunca fica sem foto no modo Preencher:');
  await zoom(150);
  await page.waitForTimeout(150);
  const g0 = await ler();
  const c3 = await central();
  await page.mouse.move(c3.x, c3.y);
  await page.mouse.down();
  await page.mouse.move(c3.x + 500, c3.y, { steps: 10 });
  const gMeio = await ler();                        /* durante o gesto: a foto recua da beirada (elástico) */
  await page.mouse.up();
  await page.waitForTimeout(300);
  const g1 = await ler();
  const cobre = g1.ph.x <= g1.win.x + 0.5 && g1.ph.y <= g1.win.y + 0.5 && g1.ph.x + g1.ph.w >= g1.win.x + g1.win.w - 0.5 && g1.ph.y + g1.ph.h >= g1.win.y + g1.win.h - 0.5;
  ok(cobre, 'a foto cobre a janela depois de arrastar para fora do limite');
  ok(gMeio.st.ex < 0 && Math.abs(gMeio.st.ex) <= 0.06, 'durante o gesto a foto recua da beirada (elástico ' + gMeio.st.ex.toFixed(4) + ')');
  const fundo = await page.evaluate(async b64 => {
    const img = new Image();
    await new Promise((ok2, no) => { img.onload = ok2; img.onerror = no; img.src = 'data:image/png;base64,' + b64; });
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
    let n = 0;                                   /* #F8F9FA é a cor da janela vazia (--surface-subtle) */
    for (let i = 0; i < d.length; i += 4) if (d[i] === 248 && d[i + 1] === 249 && d[i + 2] === 250) n++;
    return n;
  }, (await page.locator('#win').screenshot()).toString('base64'));
  ok(fundo === 0, 'nenhum pixel da janela ficou com a cor do fundo vazio (' + fundo + ' px)');
  ok(g1.st.ex === 0 && g1.st.ey === 0, 'o elástico da borda volta a zero ao soltar');
  ok(g1.st.px !== g0.st.px, 'o arrasto para fora do limite mexeu a foto (' + g1.st.px.toFixed(4) + ')');

  console.log('Sem elástico animado com prefers-reduced-motion:');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.click('[data-act="centralizar"]');
  await zoom(150);
  await page.waitForTimeout(150);
  const r0 = await ler();
  const c4 = await central();
  await page.mouse.move(c4.x, c4.y);
  await page.mouse.down();
  await page.mouse.move(c4.x + 500, c4.y, { steps: 8 });
  const rMeio = await ler();
  await page.mouse.up();
  await page.waitForTimeout(120);
  const r1 = await ler();
  ok(rMeio.st.ex === 0 && rMeio.st.ey === 0, 'com movimento reduzido a foto não recua da beirada');
  ok(r1.st.ex === 0 && r1.st.ey === 0 && r1.st.px !== r0.st.px, 'a foto para no limite e o estado fica limpo (' + r1.st.px.toFixed(4) + ')');
  await page.emulateMedia({ reducedMotion: null });

  console.log('Roda com Ctrl (pinça do trackpad): passo proporcional ao deltaY:');
  await zoom(100);
  await page.waitForTimeout(150);
  const w0 = await ler();
  await page.keyboard.down('Control');
  await page.mouse.move(c0.x, c0.y);
  await page.mouse.wheel(0, -50);
  await page.keyboard.up('Control');
  await page.waitForTimeout(150);
  const w1 = await ler();
  ok(perto(w1.st.z, Math.round(w0.st.z * Math.pow(1.1, .5)), 1), 'Ctrl + roda de 50 dá um passo menor (' + w0.st.z + '% → ' + w1.st.z + '%)');

  console.log('Modo Encaixar: a foto inteira dentro da janela:');
  await page.click('.cbar input[data-modo][value="encaixar"]');
  await page.waitForTimeout(250);
  const i0 = await ler();
  ok(i0.st.modo === 'encaixar' && i0.st.z === 100, 'o modo Encaixar mostra a foto inteira (' + i0.st.modo + ')');
  const c5 = await central();
  await page.mouse.move(c5.x, c5.y);
  await page.mouse.down();
  await page.mouse.move(c5.x + 500, c5.y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  const i1 = await ler();
  ok(i1.st.px <= .5 + 1e-6 && i1.st.px > 0, 'no modo Encaixar a foto para dentro da janela (px ' + i1.st.px.toFixed(3) + ')');
  await page.click('.cbar input[data-modo][value="preencher"]');
  await page.waitForTimeout(250);
  const i2 = await ler();
  ok(i2.st.modo === 'preencher', 'volta para o modo Preencher');

  console.log('Botões e alvos (T3 · 44 px):');
  const alvos = await page.evaluate(() => {
    const r = sel => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { w: b.width, h: b.height }; };
    const campo = document.querySelector('#zoom');
    const cx = campo ? campo.closest('.num').getBoundingClientRect() : null;
    return { centralizar: r('[data-act="centralizar"]'), rfoto: r('[data-act="rfoto"]'), zoom: r('#zoom-r'), campo: cx ? { w: cx.width, h: cx.height } : null };
  });
  ok(alvos.centralizar && alvos.centralizar.h >= 44, '«Centralizar» com alvo de ' + (alvos.centralizar ? alvos.centralizar.h : 0) + ' px');
  ok(alvos.rfoto && alvos.rfoto.h >= 44, '«Resetar foto» com alvo de ' + (alvos.rfoto ? alvos.rfoto.h : 0) + ' px');
  ok(alvos.zoom && alvos.zoom.h >= 44 && alvos.campo && alvos.campo.h >= 44, 'deslizador e campo de zoom com 44 px de altura');

  console.log('Botões Centralizar e Resetar foto:');
  await page.click('[data-act="centralizar"]');
  await page.waitForTimeout(150);
  const h1 = await ler();
  ok(h1.st.px === 0 && h1.st.py === 0, '«Centralizar» volta a foto ao centro');
  await page.click('[data-act="rfoto"]');
  await page.waitForTimeout(200);
  const h2 = await ler();
  ok(h2.st.z === 100 && h2.st.px === 0 && h2.st.py === 0, '«Resetar foto» volta o recorte ao padrão');

  ok(errosPg.length === 0, 'nenhum erro de página durante o teste' + (errosPg.length ? ': ' + errosPg[0] : ''));
} finally {
  await nav.close();
  srv.fechar();
}
console.log(falhas.length ? `\n✖ ${falhas.length} falha(s)` : '\n✔ Recorte no Quadro: sem falhas');
process.exit(falhas.length ? 1 : 0);
