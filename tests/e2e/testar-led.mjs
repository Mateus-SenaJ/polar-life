#!/usr/bin/env node
// P-LED (DOC-01 §11 · D-112): o LED v4 é o mesmo em todas as páginas — botão 52/42, peso 500,
// raio 12, anel em movimento, névoa no hover, desabilitado tracejado preto, barra carregando,
// pop-up nível 3 e barra de progresso. Também confere a paleta T2 dentro dos componentes LED.
// Uso: npm run testar:led  (Chromium do Playwright)
import { chromium } from 'playwright';
import { readdirSync, statSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir, SITE } from '../helpers/servidor.mjs';

const falhas = [], ok = m => console.log('  ✔ ' + m), ruim = m => { falhas.push(m); console.log('  ✘ ' + m); };
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const paginas = walk(SITE).filter(f => f.endsWith('.html')).map(f => relative(SITE, f).replace(/\\/g, '/').replace(/index\.html$/, ''));
const PALETA = new Set(['rgb(255, 255, 255)', 'rgb(0, 0, 0)', 'rgb(0, 97, 148)', 'rgb(253, 118, 26)', 'rgb(248, 249, 250)']);
const foraDaPaleta = c => {
  if (!c || c === 'none' || c === 'transparent') return false;
  const m = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!m) return true;
  if (m[4] !== undefined && Number(m[4]) < 1) return false;   /* sombras/transparências não entram na T2 */
  return !PALETA.has(`rgb(${m[1]}, ${m[2]}, ${m[3]})`);
};

const srv = await servir();
const nav = await chromium.launch();
const saida = fileURLToPath(new URL('../saida/led/', import.meta.url));
await mkdir(saida, { recursive: true });

const retrato = async page => page.evaluate(() => {
  const vis = el => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  };
  return [...document.querySelectorAll('.led-btn')].map((el, i) => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    const svgs = [...el.querySelectorAll('.btn-content svg')].map(s => {
      const c = getComputedStyle(s);
      const texto = getComputedStyle(el.querySelector('.btn-content')).color;
      return { stroke: c.stroke, fill: c.fill, texto };
    });
    return {
      i, visivel: vis(el), desabilitado: el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true',
      ocupado: el.getAttribute('aria-busy') === 'true', sm: el.classList.contains('led-btn--sm'),
      peso: cs.fontWeight, altura: r.height, raio: cs.borderTopLeftRadius,
      animacao: cs.animationName, svgs
    };
  });
});

try {
  console.log(`LED por página (${paginas.length}):`);
  for (const pg of paginas) {
    const page = await nav.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(srv.url + pg, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const itens = (await retrato(page)).filter(x => x.visivel);
    const problemas = [];
    for (const b of itens) {
      if (b.desabilitado) {
        if (b.animacao !== 'none') problemas.push(`botão ${b.i} desabilitado ainda anima (${b.animacao})`);
        continue;
      }
      if (b.ocupado) continue;
      if (b.peso !== '500') problemas.push(`botão ${b.i} com peso ${b.peso}`);
      const alvo = b.sm ? 42 : 52;
      if (Math.abs(b.altura - alvo) > .5) problemas.push(`botão ${b.i} com ${b.altura}px (esperado ${alvo})`);
      if (b.raio !== '12px') problemas.push(`botão ${b.i} com raio ${b.raio}`);
      if (b.animacao === 'none') problemas.push(`botão ${b.i} sem anel animado`);
    }
    /* hover: névoa visível e conteúdo preto, ícone herdando a cor do texto */
    const alvo = page.locator('.led-btn:visible:not(:disabled):not([aria-busy="true"])').first();
    if (await alvo.count()) {
      await alvo.hover();
      await page.waitForTimeout(500);
      const alvoEl = await alvo.elementHandle();
      const h = await page.evaluate(el => {
        const smoke = el.querySelector('.smoke-layer'), cont = el.querySelector('.btn-content');
        if (!smoke || !cont) return null;
        const sc = getComputedStyle(smoke), cc = getComputedStyle(cont);
        const svgs = [...cont.querySelectorAll('svg')].map(s => {
          const cs = getComputedStyle(s);
          return { stroke: cs.stroke, fill: cs.fill, texto: cc.color };
        });
        return { opacidade: sc.opacity, cor: cc.color, svgs };
      }, alvoEl);
      if (!h) problemas.push('botão sem .smoke-layer/.btn-content');
      else {
        if (parseFloat(h.opacidade) < 0.99) problemas.push(`névoa com opacidade ${h.opacidade} no hover`);   // a transição de 350 ms pode estar no último quadro
        if (h.cor !== 'rgb(0, 0, 0)') problemas.push(`conteúdo ${h.cor} no hover`);
        for (const s of h.svgs) {
          const aceita = c => c === 'none' || c === 'rgba(0, 0, 0, 0)' || c === s.texto;
          if (!aceita(s.stroke) || !aceita(s.fill)) problemas.push(`ícone com stroke ${s.stroke}/fill ${s.fill} no hover`);
        }
      }
    }
    /* cor fora da paleta nos componentes LED */
    const cores = await page.evaluate(() => {
      const alvos = document.querySelectorAll('.led-btn, .led-btn .btn-content, .led-btn .smoke-layer, .led-dialog, .led-dialog__title, .led-progress, .led-progress__track, .led-progress__fill, .led-progress__glow');
      const props = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor'];
      return [...alvos].flatMap(el => props.map(p => ({ el: el.className || el.tagName, p, v: getComputedStyle(el)[p] })));
    });
    for (const c of cores) if (foraDaPaleta(c.v)) problemas.push(`${c.el} · ${c.p} = ${c.v}`);
    problemas.length ? ruim(`${pg || '/'} — ${problemas.join('; ')}`) : ok(pg || '/');
    await page.close();
  }

  /* Desabilitado e carregando, na página que os exibe */
  const page = await nav.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(srv.url + 'app/editor/compartilhar/', { waitUntil: 'networkidle' });
  const des = await page.evaluate(() => {
    const el = document.querySelector('.led-btn:disabled, .led-btn[aria-disabled="true"]');
    if (!el) return null;
    const cs = getComputedStyle(el), cont = getComputedStyle(el.querySelector('.btn-content'));
    return { largura: cs.borderTopWidth, estilo: cs.borderTopStyle, cor: cs.borderTopColor, texto: cont.color, animacao: cs.animationName };
  });
  if (!des) ruim('nenhum botão desabilitado para conferir');
  else if (des.largura === '1px' && des.estilo === 'dashed' && des.cor === 'rgb(0, 0, 0)' && des.texto === 'rgb(0, 0, 0)' && des.animacao === 'none') ok('desabilitado: tracejado preto, texto preto, sem anel');
  else ruim(`desabilitado divergente: ${JSON.stringify(des)}`);

  await page.goto(srv.url + 'app/processando/', { waitUntil: 'networkidle' });
  const barra = await page.evaluate(() => {
    const b = document.querySelector('.led-btn__bar');
    if (!b) return null;
    const pai = b.closest('.led-btn'), cs = getComputedStyle(b), after = getComputedStyle(b, '::after');
    return { display: cs.display, visivel: b.getBoundingClientRect().height > 0 && getComputedStyle(pai).visibility !== 'hidden', animacao: after.animationName, sentido: after.animationDirection };
  });
  if (!barra) ruim('nenhum .led-btn__bar na página');
  else if (barra.display !== 'none' && barra.visivel && /led-slide/.test(barra.animacao) && barra.sentido !== 'alternate') ok('carregando: barra visível com led-slide sem alternate');
  else ruim(`barra de carregamento divergente: ${JSON.stringify(barra)}`);
  await page.close();

  /* Pop-up do pré-voo */
  const pop = await nav.newPage({ viewport: { width: 1440, height: 900 } });
  await pop.goto(srv.url + 'app/editor/#revisar', { waitUntil: 'networkidle' });
  await pop.waitForSelector('#pv-dlg:not([hidden])', { timeout: 5000 });
  const dlg = await pop.evaluate(() => {
    const d = document.querySelector('#pv-dlg'), cs = getComputedStyle(d), t = getComputedStyle(d.querySelector('.led-dialog__title'));
    return { animacao: cs.animationName, raio: cs.borderTopLeftRadius, titulo: `${t.fontWeight} ${t.fontSize}/${t.lineHeight}` };
  });
  if (/led-dialog-in/.test(dlg.animacao) && /led-spin/.test(dlg.animacao) && dlg.raio === '14px' && dlg.titulo.startsWith('300 22px')) ok(`pop-up: ${dlg.animacao} · raio ${dlg.raio} · título ${dlg.titulo}`);
  else ruim(`pop-up divergente: ${JSON.stringify(dlg)}`);
  await pop.close();

  /* Movimento reduzido */
  const ctx = await nav.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const rm = await ctx.newPage();
  await rm.goto(srv.url + 'app/novo-projeto/', { waitUntil: 'networkidle' });
  const quieto = await rm.evaluate(() => {
    const bs = [...document.querySelectorAll('.led-btn')];
    return bs.map(el => ({ btn: getComputedStyle(el).animationName, nevoa: getComputedStyle(el.querySelector('.smoke-layer')).animationName }));
  });
  const mexendo = quieto.filter(x => x.btn !== 'none' || x.nevoa !== 'none');
  mexendo.length ? ruim(`reduced-motion ainda anima: ${JSON.stringify(mexendo)}`) : ok('reduced-motion: anel e névoa parados');
  await ctx.close();

  /* Capturas para revisão visual */
  const principais = ['', 'app/', 'app/novo-projeto/', 'app/orientacao/', 'app/processando/', 'app/resumo/', 'app/adicionar-fotos/',
    'app/conexoes/', 'app/editor/', 'app/editor/quadro/', 'app/editor/exportar/', 'app/editor/imprimir/',
    'app/editor/compartilhar/', 'como-funciona/', 'legal/', 'app/estados/', '404.html'];
  let shots = 0;
  const shot = await nav.newPage();
  for (const pg of principais) {
    const nome = (pg || 'inicio').replace(/\/$/, '').replace(/[\/#.]/g, '-') || 'inicio';
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      await shot.setViewportSize({ width: w, height: h });
      await shot.goto(srv.url + pg, { waitUntil: 'networkidle' });
      await shot.evaluate(() => document.fonts.ready);
      await shot.screenshot({ path: join(saida, `${w}-${nome}.png`), fullPage: true });
      shots++;
    }
  }
  await shot.close();
  ok(`${shots} capturas em tests/saida/led/`);
} finally {
  await nav.close();
  srv.fechar();
}

console.log(falhas.length ? `\n✘ ${falhas.length} falha(s)` : '\n✔ LED: sem falhas');
process.exit(falhas.length ? 1 : 0);
