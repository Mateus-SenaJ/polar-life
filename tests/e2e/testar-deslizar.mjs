/* D-171: controles deslizantes no toque — rolar ou tocar não muda o ajuste; arrastar na horizontal muda.
   Celular emulado (toque, pointer:coarse) no Quadro com projeto de 3 fotos CC0; desktop segue nativo. */
import { chromium, devices } from 'playwright';
import { readFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (m) => console.log('  ✔ ' + m);
const ruim = (m) => { falhas++; console.log('  ✘ ' + m); };
const srv = await servir();
const nav = await chromium.launch();
const nomes = ['praia', 'montanha', 'cidade'];
const dados = {}; for (const n of nomes) dados[n] = (await readFile(new URL('../../site/assets/img/fotos/' + n + '.jpg', import.meta.url))).toString('base64');

async function preparar(ctx) {
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage();
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.evaluate(async ({ nomes, dados }) => {
    localStorage.removeItem('pl-projeto-atual');
    const pr = await PLPROJETOS.criar('Teste deslizar'); let i = 0;
    for (const n of nomes) { i++; const b = Uint8Array.from(atob(dados[n]), (c) => c.charCodeAt(0)); await PLFOTOS.salvar(i, new File([b], n + '.jpg', { type: 'image/jpeg' }), pr.id); }
    sessionStorage.setItem('pl-fotos', JSON.stringify([1, 2, 3])); await PLPROJETOS.salvarEstado();
  }, { nomes, dados });
  await p.goto(srv.url + 'app/editor/quadro/', { waitUntil: 'networkidle' });
  await p.click('#tab-ajustes').catch(() => {});
  await p.waitForTimeout(400);
  return p;
}
/* gesto de toque sintético (pointerType «touch»), passo a passo */
async function gesto(p, sel, passos) {
  return p.evaluate(({ sel, passos }) => {
    const el = document.querySelector(sel); el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect(), x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
    const alvo = document.elementFromPoint(x0, y0) || document.body;
    let n = 0; el.addEventListener('input', () => n++);
    const ev = (t, x, y) => alvo.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y }));
    const antes = el.value; ev('pointerdown', x0, y0);
    for (const [dx, dy] of passos) ev('pointermove', x0 + dx, y0 + dy);
    const ult = passos[passos.length - 1] || [0, 0]; ev('pointerup', x0 + ult[0], y0 + ult[1]);
    return { antes, depois: el.value, inputs: n, pe: getComputedStyle(el).pointerEvents };
  }, { sel, passos });
}
try {
  const ctx = await nav.newContext({ ...devices['Pixel 7'] });
  const p = await preparar(ctx);
  const sel = await p.evaluate(() => { const r = [...document.querySelectorAll('input[type=range]')].find((x) => x.getBoundingClientRect().width > 0 && !x.disabled); if (!r) return null; if (!r.id) r.id = 'teste-range'; return '#' + r.id; });
  if (!sel) throw new Error('nenhum controle deslizante visível no Quadro');
  (await p.evaluate(() => window.PLDESLIZAR && PLDESLIZAR.ativo)) ? ok('celular: módulo de toque ativo') : ruim('módulo de toque inativo no celular');
  const v = await gesto(p, sel, [[2, 12], [3, 30], [4, 60]]);
  v.antes === v.depois && v.inputs === 0 ? ok(`rolar por cima (gesto vertical) não muda o ajuste (${v.antes})`) : ruim('rolagem mudou o valor: ' + JSON.stringify(v));
  v.pe === 'none' ? ok('o controle nativo não recebe o dedo direto (sem pulo ao encostar)') : ruim('pointer-events: ' + v.pe);
  const t = await gesto(p, sel, [[1, 1]]);
  t.antes === t.depois ? ok('toque parado não muda o ajuste') : ruim('toque mudou o valor: ' + JSON.stringify(t));
  const h = await gesto(p, sel, [[12, 1], [30, 2], [70, 3]]);
  h.depois !== h.antes && h.inputs > 0 ? ok(`arrastar na horizontal ajusta (${h.antes} → ${h.depois})`) : ruim('arraste horizontal não ajustou: ' + JSON.stringify(h));
  await ctx.close();

  const d = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const pd = await preparar(d);
  const nat = await pd.evaluate(() => ({ ativo: window.PLDESLIZAR && PLDESLIZAR.ativo, pe: getComputedStyle(document.querySelector('input[type=range]')).pointerEvents }));
  !nat.ativo && nat.pe !== 'none' ? ok('desktop: controle nativo (mouse e teclado) sem mudança') : ruim('desktop alterado: ' + JSON.stringify(nat));
  await d.close();
} catch (e) { ruim('exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ deslizar: ${falhas} falha(s)` : '\n✔ deslizar: sem falhas');
process.exit(falhas ? 1 : 0);
