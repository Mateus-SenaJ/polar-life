/* D-208 · Notificações (DOC-16): lembrança «Neste dia» com a colagem das fotos da própria conta (desenhada no aparelho),
   prazo de código, campanha do admin só para o público certo, dispensar e lembrar amanhã, preferências, horário silencioso,
   painel discreto e acessível (foco preso, Esc, alvos ≥ 44 px, peso ≤ 500, um LED por tela) e nada pedido a outra origem (T5/T6).
   Fotos de demonstração do próprio site com data EXIF montada aqui (nenhuma foto pessoal). */
import { chromium } from 'playwright';
import { readFile, mkdir } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0, n = 0;
const ok = (v, m) => { n++; console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const SAIDA = new URL('../saida/avisos/', import.meta.url); await mkdir(SAIDA, { recursive: true });
const srv = await servir(), nav = await chromium.launch();
const NOMES = ['amigas-praia', 'amigos-abraco', 'amigos-cidade', 'amigos-trilha'];
const bases = await Promise.all(NOMES.map((x) => readFile(new URL('../../site/assets/img/fotos/' + x + '.jpg', import.meta.url))));
function exif(data) {
  const b = [], u16 = (v) => b.push(v & 255, v >> 8 & 255), u32 = (v) => { u16(v & 65535); u16(v >>> 16 & 65535); };
  b.push(73, 73); u16(42); u32(8); u16(1); u16(0x8769); u16(4); u32(1); u32(26); u32(0);
  u16(1); u16(0x9003); u16(2); u32(20); u32(44); u32(0); for (const ch of data) b.push(ch.charCodeAt(0)); b.push(0);
  const corpo = [69, 120, 105, 102, 0, 0].concat(b), len = corpo.length + 2; return Buffer.from([255, 225, len >> 8, len & 255].concat(corpo));
}
const hoje = new Date(), z = (v) => String(v).padStart(2, '0');
const DATA = (hoje.getFullYear() - 1) + ':' + z(hoje.getMonth() + 1) + ':' + z(hoje.getDate());   /* este dia, no ano passado */
const FOTOS = bases.map((b, i) => Buffer.concat([b.subarray(0, 2), exif(DATA + ' 1' + i + ':00:00'), b.subarray(2)]).toString('base64'));
const fora = [];
async function contexto(email, w, h) {
  const ctx = await nav.newContext({ viewport: { width: w || 1366, height: h || 900 } });
  await ctx.addInitScript((e) => localStorage.setItem('pl-conta', JSON.stringify({ email: e, entrouEm: Date.now() })), email);
  await ctx.addInitScript(() => { window.__pedidos = 0; if (window.Notification) { const o = Notification.requestPermission.bind(Notification); Notification.requestPermission = function () { window.__pedidos++; return o.apply(null, arguments); }; } });
  await ctx.route('**/*', (r) => { const u = new URL(r.request().url()); if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && !/^(data|blob):/.test(r.request().url())) { fora.push(u.href); return r.abort(); } return r.continue(); });
  const p = await ctx.newPage(); p._erros = []; p.on('pageerror', (e) => p._erros.push(e.message));
  return { ctx, p };
}
async function semear(p) {
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.evaluate(async (F) => { localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
    const pr = await PLPROJETOS.criar('Viagem do ano passado'), bin = (d) => Uint8Array.from(atob(d), (c) => c.charCodeAt(0));
    for (let i = 1; i <= F.length; i++) await PLFOTOS.salvar(i, new File([bin(F[i - 1])], 'f' + i + '.jpg', { type: 'image/jpeg' }), pr.id);
    sessionStorage.setItem('pl-fotos', JSON.stringify(F.map((_, i) => i + 1))); await PLPROJETOS.salvarEstado(); }, FOTOS);
}
const espera = (p) => p.waitForFunction(() => window.PLAVISOS && PLAVISOS.lista().length > 0, null, { timeout: 15000 }).catch(() => null);

try {
  console.log('\nLembrança «Neste dia» com a colagem das fotos da conta:');
  let { ctx, p } = await contexto('pro@polarlife.test', 390, 844);
  await semear(p);
  await p.goto(srv.url + 'app/'); await espera(p);
  let L = await p.evaluate(() => PLAVISOS.lista().map((i) => ({ tipo: i.tipo, t: i.titulo, img: i.temImagem })));
  const lem = L.find((x) => x.tipo === 'lembranca');
  ok(!!lem && /Há 1 ano/.test(lem.t) && /4 fotos/.test(lem.t), 'lembrança gerada no aparelho: «' + (lem && lem.t) + '»');
  ok(!!lem && lem.img, 'a lembrança traz a colagem das fotos da própria conta');
  const px = await p.evaluate(async () => { const it = PLAVISOS.lista().find((i) => i.tipo === 'lembranca'); const c = await PLAVISOS.imagem(it.id, 'larga'); if (!c) return null;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let mn = 255, mx = 0, cor = 0; for (let i = 0; i < d.length; i += 400) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3; mn = Math.min(mn, v); mx = Math.max(mx, v); if (Math.abs(d[i] - d[i + 2]) > 30) cor++; }
    return { w: c.width, h: c.height, faixa: mx - mn, cor }; });
  ok(px && px.w === px.h * 2 && px.faixa > 120 && px.cor > 20, 'a colagem 2:1 para a notificação tem as fotos de verdade (' + JSON.stringify(px) + ')');
  ok(await p.isVisible('#sino') && await p.isVisible('.sino__p'), 'o sino aparece no cabeçalho com um ponto parado (sem número, sem piscar)');
  const anim = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('.sino__p')); return s.animationName; });
  ok(anim === 'none', 'o ponto do sino não tem animação');
  await p.click('#sino'); await p.waitForTimeout(800);
  const pn = await p.evaluate(() => { const d = document.querySelector('.avs[role=dialog]'); const im = d && d.querySelector('.av__img'); return { dlg: !!d, modal: d && d.getAttribute('aria-modal'), foco: d && d.contains(document.activeElement), img: im && !im.hidden && im.naturalWidth, w: im && im.getBoundingClientRect().width }; });
  ok(pn.dlg && pn.modal === 'true' && pn.foco, 'o painel é um diálogo com o foco dentro');
  ok(pn.img > 0 && pn.w > 300, 'o cartão mostra a colagem grande, na largura do painel (' + Math.round(pn.w || 0) + ' px)');
  const med = await p.evaluate(() => { const d = document.querySelector('.avs[role=dialog]'), ruins = [], pesos = [];
    d.querySelectorAll('a,button').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width && (r.height < 44 || r.width < 44)) ruins.push(e.textContent.trim() + ' ' + Math.round(r.width) + '×' + Math.round(r.height)); });
    d.querySelectorAll('*').forEach((e) => { const w = +getComputedStyle(e).fontWeight; if (w > 500 && e.textContent.trim()) pesos.push(e.tagName + ':' + w); });
    return { ruins, pesos: [...new Set(pesos)] }; });
  ok(!med.ruins.length, 'alvos do painel com 44 px ou mais' + (med.ruins.length ? ' (' + med.ruins.join('; ') + ')' : ''));
  ok(!med.pesos.length, 'peso de fonte até 500 no painel' + (med.pesos.length ? ' (' + med.pesos.join(', ') + ')' : ''));
  await p.screenshot({ path: new URL('painel-celular.png', SAIDA).pathname.slice(1) });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'sino'), 'Esc fecha e o foco volta ao sino');
  ok(await p.evaluate(() => document.querySelectorAll('.led-btn').length) <= 1, 'um LED só na tela (T8)');

  console.log('\nLembrar amanhã, dispensar e preferências:');
  await p.evaluate(() => { const it = PLAVISOS.lista().find((i) => i.tipo === 'lembranca'); PLAVISOS.adiar(it.id); });
  ok(await p.evaluate(() => !PLAVISOS.lista().some((i) => i.tipo === 'lembranca')), '«Lembrar amanhã» tira a lembrança da lista de hoje');
  await p.evaluate(() => { localStorage.removeItem('pl-avisos'); });
  await p.evaluate(() => PLAVISOS.atualizar({ forcar: true })).catch(() => null); await espera(p);
  await p.evaluate(() => { const it = PLAVISOS.lista().find((i) => i.tipo === 'lembranca'); if (it) PLAVISOS.dispensar(it.id); });
  await p.evaluate(() => PLAVISOS.atualizar({ forcar: true })).catch(() => null); await p.waitForTimeout(800);
  ok(await p.evaluate(() => !PLAVISOS.lista().some((i) => i.tipo === 'lembranca')), '«Dispensar» não traz a mesma lembrança de volta');
  await p.evaluate(() => { localStorage.removeItem('pl-avisos'); PLAVISOS.salvarPrefs({ tipos: { lembranca: false } }); });
  await p.evaluate(() => PLAVISOS.atualizar({ forcar: true })).catch(() => null); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => !PLAVISOS.lista().some((i) => i.tipo === 'lembranca')), 'com «Lembranças» desligado na Conta, nenhuma lembrança aparece');
  const sil = await p.evaluate(() => { const pr = PLAVISOS.prefs(); return [PLAVISOS.silencioso(new Date(2026, 0, 1, 23, 0), pr), PLAVISOS.silencioso(new Date(2026, 0, 1, 7, 0), pr), PLAVISOS.silencioso(new Date(2026, 0, 1, 12, 0), pr)]; });
  ok(sil.join() === 'true,true,false', 'horário silencioso padrão de 22h às 8h (23h e 7h calam; 12h não)');
  await p.goto(srv.url + 'app/conta/#notificacoes'); await p.waitForTimeout(1000);
  const ct = await p.evaluate(() => { const s = document.getElementById('sec-notificacoes'); return { sec: !!s, sw: s ? s.querySelectorAll('[role=switch]').length : 0, txt: s ? s.textContent : '' }; });
  ok(ct.sec && ct.sw >= 6 && /Lembranças/.test(ct.txt) && /Prazos/.test(ct.txt), 'Conta › Notificações com um interruptor por tipo');
  ok(await p.evaluate(() => window.__pedidos === 0), 'abrir o app e a Conta não pede permissão de notificação sozinho');
  await ctx.close();

  console.log('\nPrazo de código perto de vencer:');
  ({ ctx, p } = await contexto('folha@polarlife.test'));
  await p.goto(srv.url + 'app/');
  await p.evaluate(() => { const t = JSON.parse(localStorage.getItem('pl-contas-teste') || '{}'), e = 'folha@polarlife.test', c = t[e] || { nome: 'Folha', perfil: 'avulsa', folhasPadrao: 0, folhasGrande: 0, usadasMes: 0, recibos: [] };
    c.codigos = [{ final: 'K7QX', pacote: 'p5', classe: 'padrao', folhas: 5, restam: 5, fotosMax: 24, resgatadoEm: Date.now() - 86400000, validoAte: Date.now() + 2.5 * 86400000 }]; c.folhasPadrao = 5; t[e] = c;
    localStorage.setItem('pl-contas-teste', JSON.stringify(t)); localStorage.removeItem('pl-avisos'); });
  await p.reload(); await espera(p);
  const pz = await p.evaluate(() => PLAVISOS.lista().filter((i) => i.tipo === 'codigo').map((i) => i.titulo + ' | ' + i.texto));
  ok(pz.length === 1 && /3 dias/.test(pz[0]) && /K7QX/.test(pz[0]), 'aviso de prazo: «' + pz[0] + '»');
  await ctx.close();

  console.log('\nCampanha do admin para o público certo:');
  ({ ctx, p } = await contexto('admin@polarlife.test'));
  await p.goto(srv.url + 'app/admin/'); await p.waitForFunction(() => !!document.getElementById('nt-form'));
  await p.selectOption('#nt-tipo', 'promocao'); await p.fill('#nt-titulo', 'Folhas em dobro no fim de semana'); await p.fill('#nt-texto', 'Na compra de 5 folhas, ganhe mais 5. Só até domingo.');
  await p.selectOption('#nt-publico', 'gratis'); await p.click('#nt-lancar'); await p.waitForTimeout(400);
  const camp = await p.evaluate(() => PLAVISOS.admin.campanhas().map((c) => c.titulo + '|' + c.estado));
  ok(camp.some((c) => /^Folhas em dobro.*\|ativa$/.test(c)), 'o admin lança a campanha (' + camp.join(', ') + ')');
  ok(await p.isVisible('#nt-demo') && /sem servidor/i.test(await p.textContent('#nt-demo')), 'o painel diz que é demonstração, sem servidor (T7)');
  await p.locator('#sec-notificacoes').scrollIntoViewIfNeeded(); await p.screenshot({ path: new URL('admin-notificacoes.png', SAIDA).pathname.slice(1) });
  const estado = await ctx.storageState();
  await ctx.close();
  for (const [email, deve] of [['gratis@polarlife.test', true], ['pro@polarlife.test', false]]) {
    const c2 = await nav.newContext({ viewport: { width: 1366, height: 900 }, storageState: estado });
    await c2.addInitScript((e) => localStorage.setItem('pl-conta', JSON.stringify({ email: e, entrouEm: Date.now() })), email);
    const p2 = await c2.newPage(); await p2.goto(srv.url + 'app/'); await p2.waitForTimeout(1500);
    const tem = await p2.evaluate(() => window.PLAVISOS && PLAVISOS.lista().some((i) => i.tipo === 'promocao' && /Folhas em dobro/.test(i.titulo)));
    ok(tem === deve, (deve ? 'a conta Grátis recebe' : 'a conta Pro não recebe') + ' a promoção feita para o plano Grátis');
    await c2.close();
  }

  console.log('\nService worker preparado para o servidor:');
  const sw = await readFile(new URL('../../site/app/sw.js', import.meta.url), 'utf8');
  ok(/addEventListener\('notificationclick'/.test(sw) && /addEventListener\('push'/.test(sw) && /addEventListener\('periodicsync'/.test(sw), 'sw.js trata notificationclick, push e periodicsync');
  ok(!fora.length, 'nenhum pedido a outra origem' + (fora.length ? ' (' + fora.slice(0, 3).join(', ') + ')' : ''));
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.fechar();
console.log('\n' + (falhas ? '✘ ' + falhas + ' de ' + n + ' falharam' : '✔ ' + n + ' conferências'));
process.exit(falhas ? 1 : 0);
