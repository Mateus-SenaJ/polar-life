/* D-182: «Aplicar às demais» em um toque e em mais lugares. Os ajustes mexem só na foto aberta (e a barra diz isso, T7);
   «Aplicar às demais» copia filtro + luz, cor e detalhe; cada parte tem o seu «… nas demais» (filtro, modo do recorte, luz e cor,
   detalhe), que respeita o escopo (Selecionadas, Esta folha, Todas) e desfaz; em Legendas, a cidade digitada vai para as fotos
   sem local. Fotos de exemplo do site + EXIF montado aqui (nenhuma foto pessoal). */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';
import { maisAbertos } from '../helpers/mais.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
const base = await readFile(new URL('../../site/assets/img/fotos/praia.jpg', import.meta.url));
function exif(data, gps) {
  const b = [], u16 = (v) => b.push(v & 255, v >> 8 & 255), u32 = (v) => { u16(v & 65535); u16(v >>> 16 & 65535); };
  const rat = (g) => { const d = Math.floor(Math.abs(g)), m = Math.floor((Math.abs(g) - d) * 60), s = Math.round(((Math.abs(g) - d) * 60 - m) * 60 * 100); u32(d); u32(1); u32(m); u32(1); u32(s); u32(100); };
  b.push(73, 73); u16(42); u32(8);
  u16(2); u16(0x8769); u16(4); u32(1); u32(38); u16(0x8825); u16(4); u32(1); u32(76); u32(0);
  u16(1); u16(0x9003); u16(2); u32(20); u32(56); u32(0);
  for (const ch of data) b.push(ch.charCodeAt(0)); b.push(0);
  u16(4); u16(1); u16(2); u32(2); b.push(gps[0] < 0 ? 83 : 78, 0, 0, 0);
  u16(2); u16(5); u32(3); u32(130); u16(3); u16(2); u32(2); b.push(gps[1] < 0 ? 87 : 69, 0, 0, 0);
  u16(4); u16(5); u32(3); u32(154); u32(0); rat(gps[0]); rat(gps[1]);
  const corpo = [69, 120, 105, 102, 0, 0].concat(b), len = corpo.length + 2;
  return Buffer.from([255, 225, len >> 8, len & 255].concat(corpo));
}
const comGps = Buffer.concat([base.subarray(0, 2), exif('2026:11:23 10:00:00', [-12.9714, -38.5014]), base.subarray(2)]);
const ADJ = (p) => p.evaluate(() => PLQ.ST().slice(1).map((e) => ({ b: e.adj.brilho, c: e.adj.contraste, v: e.adj.vinheta, f: e.flt.id, m: e.modo })));
const slider = (p, id, v) => p.evaluate(([id, v]) => { const r = document.querySelector('[data-sl="' + id + '"] input[type=range]'); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);

try {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await maisAbertos(ctx);
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.evaluate(async ([a, g]) => {
    localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
    const pr = await PLPROJETOS.criar('Aplicar às demais'), bin = (d) => Uint8Array.from(atob(d), (c) => c.charCodeAt(0));
    for (let i = 1; i <= 4; i++) await PLFOTOS.salvar(i, new File([bin(i === 3 ? g : a)], 'f' + i + '.jpg', { type: 'image/jpeg' }), pr.id);
    sessionStorage.setItem('pl-fotos', '[1,2,3,4]'); await PLPROJETOS.salvarEstado();
  }, [base.toString('base64'), comGps.toString('base64')]);
  await p.goto(srv.url + 'app/editor/quadro/#foto-1'); await p.reload();
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[4] && PLQ.ST()[4].meta);
  await p.waitForTimeout(600);

  console.log('\nUm toque, sem «Replicar»:');
  ok(await p.locator('#replicar').count() === 0, 'não existe mais a caixa «Replicar para as demais»');
  ok(!(await p.isDisabled('#apply')) && /Aplicar às demais · 3 fotos/.test(await p.textContent('#apply')), '«Aplicar às demais · 3 fotos» já vem ativo');
  await slider(p, 'brilho', 30); await p.waitForTimeout(150);
  let a = await ADJ(p);
  ok(a.map((x) => x.b).join() === '30,0,0,0' && /^Alterando: só esta foto/.test(await p.textContent('#scope-t')), 'mexer no brilho muda só a foto aberta, e a barra diz «Alterando: só esta foto»');

  console.log('\nCada parte nas demais:');
  await slider(p, 'contraste', 12); await p.click('[data-apl="luz"]'); await p.waitForTimeout(200);
  a = await ADJ(p);
  ok(a.every((x) => x.b === 30 && x.c === 12) && a.every((x) => x.f === 'original'), '«Aplicar luz e cor às demais»: brilho e contraste nas 4; o filtro das outras não muda');
  ok(/Luz e cor aplicado a 3 fotos/.test(await p.textContent('#toast-t')) && await p.isVisible('#toast-undo'), 'aviso «Luz e cor aplicado a 3 fotos» com Desfazer');
  await slider(p, 'vinheta', 40); await p.click('[data-apl="det"]'); await p.waitForTimeout(200);
  a = await ADJ(p);
  ok(a.every((x) => x.v === 40), '«Aplicar detalhe às demais»: vinheta 40 nas 4');
  const filtro = await p.evaluate(() => { document.querySelector('#flt-grid button[data-f]:not([data-f=original])').click(); return PLQ.S().flt.id; });
  await p.waitForTimeout(150); await p.click('[data-apl="flt"]'); await p.waitForTimeout(200);
  a = await ADJ(p);
  ok(filtro !== 'original' && a.every((x) => x.f === filtro), '«Usar este filtro nas demais»: filtro «' + filtro + '» nas 4');
  await p.click('#toast-undo'); await p.waitForTimeout(200);
  a = await ADJ(p);
  ok(a[0].f === filtro && a.slice(1).every((x) => x.f === 'original'), 'Desfazer volta o filtro das outras (a foto aberta continua com o dela)');
  await p.check('input[name=modo][value=encaixar]', { force: true }); await p.waitForTimeout(150);
  await p.click('[data-apl="modo"]'); await p.waitForTimeout(200);
  a = await ADJ(p);
  ok(a.every((x) => x.m === 'encaixar'), '«Usar este modo nas demais»: Encaixar nas 4');

  console.log('\nEscopo:');
  await p.click('#scope-mod'); await p.check('input[name=escopo][value=sel]', { force: true });
  await p.click('#faixa > :nth-child(3) .th', { modifiers: ['Control'] }); await p.waitForTimeout(150);
  const st = await p.textContent('#scope-t');
  ok(/só esta foto/.test(st) && /«Aplicar» vai para 1 selecionada/.test(st), 'com «Selecionadas», a barra diz para onde o «Aplicar» vai: «' + st + '»');
  await slider(p, 'brilho', 55); await p.click('[data-apl="luz"]'); await p.waitForTimeout(200);
  a = await ADJ(p);
  ok(a.map((x) => x.b).join() === '55,30,55,30', '«… nas demais» respeita o escopo: só a foto 3 marcada recebe o brilho 55');
  await p.check('input[name=escopo][value=todas]', { force: true }); await p.waitForTimeout(100);
  await p.click('#apply'); await p.waitForTimeout(200);
  a = await ADJ(p);
  ok(a.every((x) => x.b === 55 && x.f === filtro), '«Aplicar às demais» (Todas) copia luz, cor, detalhe e filtro (o que veio de outro «Aplicar» não conta como ajuste individual)');
  /* ajuste feito na própria foto continua protegido, a menos que «Substituir ajustes individuais» esteja marcada */
  await p.click('#faixa > :nth-child(2) .th'); await p.waitForFunction(() => PLQ.cur() === 2);
  await slider(p, 'brilho', -20); await p.waitForTimeout(150);
  await p.click('#faixa > :nth-child(1) .th'); await p.waitForFunction(() => PLQ.cur() === 1);
  await slider(p, 'brilho', 70); await p.click('#apply'); await p.waitForTimeout(200);
  a = await ADJ(p);
  ok(a.map((x) => x.b).join() === '70,-20,70,70' && /1 foi mantida/.test(await p.textContent('#toast-t')), 'a foto 2, ajustada nela mesma, fica como estava (aviso «1 foi mantida»)');
  await p.check('#subst', { force: true }); await p.click('#apply'); await p.waitForTimeout(200);
  a = await ADJ(p);
  ok(a.every((x) => x.b === 70), 'com «Substituir ajustes individuais», a foto 2 também recebe');

  console.log('\nLegendas: cidade digitada nas fotos sem local:');
  await p.click('#tab-legendas'); await p.waitForSelector('#lg-av-t');
  if (await p.locator('#lg-av').isHidden()) await p.click('#lg-av-t');
  await p.waitForSelector('#md-c');
  await p.fill('#md-c', 'Itacaré - BA'); await p.press('#md-c', 'Tab'); await p.waitForTimeout(300);
  const bt = await p.textContent('#md-c-todas');
  ok(/Usar «Itacaré - BA» nas fotos sem local · 2/.test(bt), 'aparece «' + bt.trim() + '» (a foto 3 tem GPS e fica de fora)');
  await p.click('#md-c-todas');
  await p.waitForFunction(() => { const s = PLQ.ST(); return s[2].pl && s[2].pl[0].v === 'Itacaré - BA' && s[4].pl && s[4].pl[0].v === 'Itacaré - BA'; }, null, { timeout: 15000 }).catch(() => {});
  const pl = await p.evaluate(() => PLQ.ST().slice(1).map((e) => e.pl && e.pl[0].v));
  ok(pl[1] === 'Itacaré - BA' && pl[3] === 'Itacaré - BA' && pl[2] === 'Salvador - BA', 'fotos 2 e 4 ganham «Itacaré - BA»; a 3 continua «Salvador - BA» (' + pl.join(' · ') + ')');

  console.log('\nCelular:');
  await p.setViewportSize({ width: 390, height: 844 });
  await p.click('#tab-ajustes'); await p.waitForTimeout(300);
  const alt = await p.evaluate(() => [...document.querySelectorAll('[data-apl]')].map((b) => Math.round(b.getBoundingClientRect().height)));
  ok(alt.length === 4 && alt.every((h) => h >= 44), 'os 4 botões «… nas demais» com 44 px ou mais (' + alt.join(', ') + ')');
  ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await ctx.close();
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ aplicar às demais: ${falhas} falha(s)` : '\n✔ aplicar às demais: sem falhas');
process.exit(falhas ? 1 : 0);
