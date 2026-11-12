/* D-172: «mais ajustes» — cada seção mostra só o básico; a seta mostra/oculta os avançados, lembra a escolha
   e avisa (ponto) quando um ajuste escondido foi alterado. */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (m) => console.log('  ✔ ' + m);
const ruim = (m) => { falhas++; console.log('  ✘ ' + m); };
const srv = await servir();
const nav = await chromium.launch();
try {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  const b = (await readFile(new URL('../../site/assets/img/fotos/praia.jpg', import.meta.url))).toString('base64');
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.evaluate(async (b) => { localStorage.removeItem('pl-projeto-atual'); localStorage.removeItem('pl-mais'); const pr = await PLPROJETOS.criar('Mais'); for (let i = 1; i <= 2; i++) await PLFOTOS.salvar(i, new File([Uint8Array.from(atob(b), (c) => c.charCodeAt(0))], 'f' + i + '.jpg', { type: 'image/jpeg' }), pr.id); sessionStorage.setItem('pl-fotos', '[1,2]'); await PLPROJETOS.salvarEstado(); }, b);
  await p.goto(srv.url + 'app/editor/quadro/', { waitUntil: 'networkidle' }); await p.click('#tab-ajustes'); await p.waitForTimeout(400);
  const sec = () => p.evaluate(() => {
    const s = [...document.querySelectorAll('#insp .mod')].find((x) => /Luz e cor/.test(x.querySelector('.mod__h').textContent));
    const vis = (t) => { const k = [...s.children].find((c) => c.textContent.includes(t)); return !!k && getComputedStyle(k).display !== 'none'; };
    const bt = s.querySelector('.mais');
    return { seta: !!bt, exp: bt && bt.getAttribute('aria-expanded'), rot: bt && bt.getAttribute('aria-label'), alvo: bt && Math.round(bt.getBoundingClientRect().height), brilho: vis('Brilho'), temp: vis('Temperatura'), ponto: bt && bt.classList.contains('mais--mudou') };
  });
  let s = await sec();
  s.seta && s.exp === 'false' && s.brilho && !s.temp ? ok('Luz e cor: básico à vista (Brilho), Temperatura atrás da seta') : ruim('estado inicial: ' + JSON.stringify(s));
  s.alvo >= 44 && /Mostrar mais ajustes de Luz e cor/.test(s.rot) ? ok('seta com alvo ≥ 44 px e rótulo acessível') : ruim('seta: ' + JSON.stringify(s));
  await p.click('#insp .mod:has(.mod__h:text("Luz e cor")) .mais').catch(async () => p.evaluate(() => [...document.querySelectorAll('#insp .mod')].find((x) => /Luz e cor/.test(x.textContent)).querySelector('.mais').click()));
  await p.waitForTimeout(200); s = await sec();
  s.temp && s.exp === 'true' ? ok('a seta mostra os ajustes avançados') : ruim('não abriu: ' + JSON.stringify(s));
  /* altera a Temperatura, fecha: o ponto avisa que há ajuste escondido */
  await p.evaluate(() => { const i = document.getElementById('temp-r') || document.querySelector('#insp input[type=range][id*=temp]'); i.value = 30; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(300);
  await p.evaluate(() => [...document.querySelectorAll('#insp .mod')].find((x) => /Luz e cor/.test(x.textContent)).querySelector('.mais').click());
  await p.waitForTimeout(300); s = await sec();
  !s.temp && s.ponto && /alterados escondidos/.test(s.rot) ? ok('ajuste escondido alterado: ponto na seta e aviso no rótulo') : ruim('sem aviso: ' + JSON.stringify(s));
  /* lembra a escolha ao recarregar */
  await p.evaluate(() => [...document.querySelectorAll('#insp .mod')].find((x) => /Luz e cor/.test(x.textContent)).querySelector('.mais').click());
  await p.reload({ waitUntil: 'networkidle' }); await p.click('#tab-ajustes'); await p.waitForTimeout(400); s = await sec();
  s.temp && s.exp === 'true' ? ok('a seção continua aberta depois de recarregar') : ruim('não lembrou: ' + JSON.stringify(s));
  const filt = await p.evaluate(() => { const l = [...document.querySelectorAll('#flt-grid > li')]; return { total: l.length, vis: l.filter((x) => getComputedStyle(x).display !== 'none').length }; });
  filt.total >= 12 && filt.vis <= 8 ? ok(`Filtro recolhido: ${filt.vis} de ${filt.total} à vista (o escolhido e o sugerido sempre)`) : ruim('filtros: ' + JSON.stringify(filt));
  await p.goto(srv.url + 'app/editor/', { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
  const fol = await p.evaluate(() => { const s = [...document.querySelectorAll('#insp .mod')].find((x) => /Linhas de corte/.test(x.textContent)); const v = (t) => { const k = [...s.children].find((c) => c.textContent.includes(t)); return !!k && getComputedStyle(k).display !== 'none'; }; return { seta: !!s.querySelector('.mais'), guias: v('Guia'), cor: v('Cor da guia') }; });
  fol.seta && fol.guias && !fol.cor ? ok('Folhas: «Linhas de corte» com Guias à vista e o resto atrás da seta') : ruim('folhas: ' + JSON.stringify(fol));
  erros.length === 0 ? ok('nenhum erro de página') : ruim('erros: ' + erros.join(' | '));
  await ctx.close();
} catch (e) { ruim('exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ mais ajustes: ${falhas} falha(s)` : '\n✔ mais ajustes: sem falhas');
process.exit(falhas ? 1 : 0);
