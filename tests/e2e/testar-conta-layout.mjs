/* D-208 · Varredura de layout da parte de contas (Conta e cada seção, Folhas e planos, Conexões, Admin) em 360, 390, 768 e
   1366 px: nada estoura para o lado, nenhum controle por cima de outro nem encostado (mínimo de 8 px entre controles de
   grupos diferentes), alvos com 44 px ou mais, texto de botão sem corte e a seta de voltar em toda tela. Capturas em
   tests/saida/conta-layout/. */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0, n = 0;
const ok = (v, m) => { n++; console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const SAIDA = 'tests/saida/conta-layout/'; await mkdir(SAIDA, { recursive: true });
const srv = await servir(), nav = await chromium.launch();
const LARG = [360, 390, 768, 1366];
const SECOES = ['perfil', 'plano', 'codigos', 'pagamentos', 'seguranca', 'preferencias', 'notificacoes', 'privacidade'];
async function medir(p) {
  return p.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('[hidden]'); };
    const nome = (e) => (e.getAttribute('aria-label') || e.textContent || e.id || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
    /* alvo = o elemento que a pessoa toca: botão, link, campo; rádio e caixa de seleção valem pelo rótulo */
    let alvos = [...document.querySelectorAll('main button, main a[href], main input, main select, main textarea, main [role=switch], .app-header a, .app-header button')]
      .map((e) => (e.type === 'radio' || e.type === 'checkbox') ? (e.closest('label') || e) : e)
      .filter((e, i, a) => a.indexOf(e) === i && vis(e) && e.type !== 'hidden' && !e.closest('.legal') && !e.closest('p') && !e.closest('table'));
    const pequenos = alvos.filter((e) => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map((e) => nome(e) + ' ' + Math.round(e.getBoundingClientRect().width) + '×' + Math.round(e.getBoundingClientRect().height));
    const grupo = (e) => e.closest('.seg, [role=radiogroup], [role=tablist], .num, .sw-row, .tc__row, .cod__row, .bolas, .adm-cup__d, .pln__q, .cx__acoes, .cfg, nav, .hnav, .act, .dialog__act') || e.parentElement;
    const perto = [];
    for (let i = 0; i < alvos.length; i++) for (let j = i + 1; j < alvos.length; j++) {
      const a = alvos[i], b = alvos[j]; if (a.contains(b) || b.contains(a)) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const dx = Math.max(rb.left - ra.right, ra.left - rb.right), dy = Math.max(rb.top - ra.bottom, ra.top - rb.bottom);
      if (dx < -1 && dy < -1) perto.push('sobrepostos: «' + nome(a) + '» × «' + nome(b) + '»');
      else if (grupo(a) !== grupo(b) && Math.max(dx, dy) < 8 && Math.max(dx, dy) > -1) perto.push('encostados (' + Math.round(Math.max(dx, dy)) + ' px): «' + nome(a) + '» × «' + nome(b) + '»');
    }
    const cortados = [...document.querySelectorAll('main button, main .btn2, main .led-btn')].filter(vis).filter((e) => e.scrollWidth > e.clientWidth + 2).map(nome);
    const estouro = document.documentElement.scrollWidth - innerWidth;
    const voltar = !!document.querySelector('a.voltar') && vis(document.querySelector('a.voltar'));
    return { pequenos, perto: perto.slice(0, 8), cortados, estouro, voltar };
  });
}
async function conferir(p, rot, arq) {
  const m = await medir(p);
  ok(m.estouro <= 1, rot + ': nada estoura para o lado' + (m.estouro > 1 ? ' (' + m.estouro + ' px)' : ''));
  ok(!m.perto.length, rot + ': controles com espaço entre si' + (m.perto.length ? ' · ' + m.perto.join(' | ') : ''));
  ok(!m.pequenos.length, rot + ': alvos com 44 px ou mais' + (m.pequenos.length ? ' · ' + m.pequenos.slice(0, 6).join(' | ') : ''));
  ok(!m.cortados.length, rot + ': texto dos botões inteiro' + (m.cortados.length ? ' · ' + m.cortados.join(' | ') : ''));
  ok(m.voltar, rot + ': seta de voltar');
  if (arq) await p.screenshot({ path: SAIDA + arq + '.png', fullPage: true });
}
try {
  for (const w of LARG) {
    console.log('\n' + w + ' px:');
    const ctx = await nav.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 } });
    await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'gratis@polarlife.test', entrouEm: Date.now() })));
    const p = await ctx.newPage();
    for (const s of SECOES) {
      await p.goto(srv.url + 'app/conta/#' + s); await p.waitForTimeout(350);
      if (w < 1024) { const cab = p.locator('.sec__cab[data-abre="' + s + '"]'); if (await cab.count() && (await cab.getAttribute('aria-expanded')) !== 'true') { await cab.click(); await p.waitForTimeout(250); } }
      await conferir(p, 'Conta › ' + s, 'conta-' + s + '-' + w);
    }
    await p.goto(srv.url + 'app/conta/planos/'); await p.waitForTimeout(400); await conferir(p, 'Folhas e planos', 'planos-' + w);
    await p.goto(srv.url + 'app/conexoes/'); await p.waitForTimeout(400); await conferir(p, 'Conexões', 'conexoes-' + w);
    await ctx.close();
    if (w === 390 || w === 1366) {
      const c2 = await nav.newContext({ viewport: { width: w, height: 900 } });
      await c2.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'admin@polarlife.test', entrouEm: Date.now() })));
      const a = await c2.newPage(); await a.goto(srv.url + 'app/admin/'); await a.waitForTimeout(600);
      await conferir(a, 'Admin', 'admin-' + w);
      await c2.close();
    }
  }
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.fechar();
console.log('\n' + (falhas ? '✘ ' + falhas + ' de ' + n + ' falharam' : '✔ ' + n + ' conferências'));
process.exit(falhas ? 1 : 0);
