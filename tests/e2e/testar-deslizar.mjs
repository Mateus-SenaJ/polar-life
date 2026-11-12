/* D-171 · D-185: controles deslizantes só mudam com arrasto, no toque e no mouse.
   Clicar ou tocar na barra (na bolinha ou longe dela) não muda o ajuste; arrastar muda a partir do valor atual, sem salto;
   no toque, rolar por cima não muda nada; o teclado continua funcionando. Quadro com projeto de 3 fotos CC0. */
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
/* o brilho (−100 a +100, começa em 0): a bolinha fica no meio da trilha */
const SEL = '#brilho-r';
const caixa = (p) => p.evaluate((s) => { const el = document.querySelector(s); el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width, v: el.value, pe: getComputedStyle(el).pointerEvents }; }, SEL);
const valor = (p) => p.evaluate((s) => document.querySelector(s).value, SEL);
/* gesto de toque sintético (pointerType «touch»), passo a passo, a partir de (fx da largura) */
async function gesto(p, fx, passos) {
  return p.evaluate(({ s, fx, passos }) => {
    const el = document.querySelector(s); el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect(), x0 = r.left + r.width * fx, y0 = r.top + r.height / 2;
    const alvo = document.elementFromPoint(x0, y0) || document.body;
    let n = 0; el.addEventListener('input', () => n++);
    const ev = (t, x, y) => alvo.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y }));
    const antes = el.value; ev('pointerdown', x0, y0);
    for (const [dx, dy] of passos) ev('pointermove', x0 + dx, y0 + dy);
    const ult = passos[passos.length - 1] || [0, 0]; ev('pointerup', x0 + ult[0], y0 + ult[1]);
    return { antes, depois: el.value, inputs: n, w: r.width };
  }, { s: SEL, fx, passos });
}
const esperado = (w, dx) => Math.round(dx / (w - 24) * 200);   /* −100…+100: 200 unidades na trilha útil */
try {
  console.log('Celular (toque):');
  const ctx = await nav.newContext({ ...devices['Pixel 7'] });
  const p = await preparar(ctx);
  (await p.evaluate(() => window.PLDESLIZAR && PLDESLIZAR.ativo)) ? ok('módulo ativo') : ruim('módulo inativo no celular');
  const v = await gesto(p, .5, [[2, 12], [3, 30], [4, 60]]);
  v.antes === v.depois && v.inputs === 0 ? ok(`rolar por cima (gesto vertical) não muda o ajuste (${v.antes})`) : ruim('rolagem mudou o valor: ' + JSON.stringify(v));
  (await caixa(p)).pe === 'none' ? ok('o controle nativo não recebe o dedo direto (sem pulo ao encostar)') : ruim('pointer-events no toque');
  const t = await gesto(p, .9, [[1, 1]]);
  t.antes === t.depois ? ok('tocar na barra, longe da bolinha, não muda o ajuste') : ruim('toque mudou o valor: ' + JSON.stringify(t));
  const h = await gesto(p, .9, [[12, 1], [30, 2], [40, 3]]);
  const dh = +h.depois - +h.antes;
  h.inputs > 0 && Math.abs(dh - esperado(h.w, 40)) <= 2 ? ok(`arrastar 40 px a partir da ponta da barra muda o mesmo que 40 px (${h.antes} → ${h.depois}), sem pular para onde o dedo encostou`) : ruim('arraste no toque: ' + JSON.stringify(h));
  await ctx.close();

  console.log('Desktop (mouse):');
  const d = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const pd = await preparar(d);
  const b = await caixa(pd);
  b.pe === 'none' && (await pd.evaluate(() => PLDESLIZAR.ativo)) ? ok('mouse também passa pelo módulo (o controle nativo não recebe o clique)') : ruim('desktop: ' + JSON.stringify(b));
  await pd.mouse.click(b.x + b.w * .88, b.y);
  (await valor(pd)) === b.v ? ok(`clique na barra, longe da bolinha, não muda nada (${b.v})`) : ruim('clique na trilha mudou: ' + (await valor(pd)));
  await pd.mouse.click(b.x + b.w * .5, b.y);
  const foco = await pd.evaluate((s) => document.activeElement === document.querySelector(s), SEL);
  (await valor(pd)) === b.v && foco ? ok('clique na bolinha não muda nada e deixa o controle com o foco') : ruim('clique na bolinha: ' + (await valor(pd)) + ' foco=' + foco);
  await pd.keyboard.press('ArrowRight');
  (await valor(pd)) === String(+b.v + 1) ? ok('seta → do teclado continua ajustando de 1 em 1') : ruim('teclado: ' + (await valor(pd)));
  const v1 = +(await valor(pd));
  await pd.mouse.move(b.x + b.w * .5, b.y); await pd.mouse.down(); await pd.mouse.move(b.x + b.w * .5 + 20, b.y, { steps: 4 }); await pd.mouse.move(b.x + b.w * .5 + 60, b.y, { steps: 6 }); await pd.mouse.up();
  const v2 = +(await valor(pd));
  Math.abs((v2 - v1) - esperado(b.w, 60)) <= 2 ? ok(`arrastar a bolinha 60 px muda o equivalente (${v1} → ${v2})`) : ruim(`arraste da bolinha: ${v1} → ${v2} (esperado +${esperado(b.w, 60)})`);
  await pd.mouse.move(b.x + b.w * .1, b.y); await pd.mouse.down(); await pd.mouse.move(b.x + b.w * .1 + 30, b.y, { steps: 5 }); await pd.mouse.up();
  const v3 = +(await valor(pd));
  Math.abs((v3 - v2) - esperado(b.w, 30)) <= 2 ? ok(`arrastar a partir da ponta da barra não salta: só os 30 px contam (${v2} → ${v3})`) : ruim(`arraste da trilha: ${v2} → ${v3}`);
  const st = await pd.evaluate(() => { const q = JSON.parse(sessionStorage.getItem('pl-quadro') || 'null'), c = PLQ.cur(); return q && q[c] && q[c].adj && q[c].adj.brilho; });
  st === v3 ? ok('o valor arrastado é o que fica salvo na foto') : ruim('salvo: ' + st + ' na tela: ' + v3);
  await d.close();
} catch (e) { ruim('exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ deslizar: ${falhas} falha(s)` : '\n✔ deslizar: sem falhas');
process.exit(falhas ? 1 : 0);
