#!/usr/bin/env node
// D-191 · Vitrine com fotos reais. As imagens das sugestões (tela de Projetos), dos modelos e das colagens para as redes
// (Início) e dos banners do Início são feitas pelo próprio PolarLive: moldura, fonte, legenda, filtro e colagem de verdade,
// com as fotos CC0 de site/assets/img/fotos (créditos em CREDITOS.md; pessoas só de costas, em silhueta ou de longe).
// Uso (precisa do Chromium do Playwright): npm run vitrine  → site/assets/img/vitrine/*.jpg
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { servir } from '../tests/helpers/servidor.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url)), OUT = RAIZ + 'site/assets/img/vitrine/';
mkdirSync(OUT, { recursive: true });
const so = process.argv.slice(2);                       /* npm run vitrine -- sug modelo  (só alguns grupos) */
const quer = (g) => !so.length || so.includes(g);

const FOTOS = ['amigos-viagem', 'paisagem-lago', 'amigos-estrada', 'cidade-rua', 'cidade-grafite', 'cidade-luzes', 'casal-por-do-sol', 'casal-cidade',
  'casal-serra', 'amigas-praia', 'familia-por-do-sol', 'amigos-abraco', 'casal-bicicletas', 'casal-praia', 'amigos-praia', 'amigos-trilha',
  'casal-noite', 'casal-ponte', 'casal-campo', 'amigos-cidade', 'amigos-acampamento', 'amigos-skate', 'paisagem-mar', 'paisagem-rochas',
  'paisagem-estrelas', 'paisagem-pier', 'cidade-multidao', 'cidade-porto', 'cidade-mochila', 'praia', 'montanha', 'por-do-sol', 'cidade', 'viagem'];
const ID = Object.fromEntries(FOTOS.map((n, i) => [n, i + 1]));
const FMT = { classico: { w: 88, h: 107, jh: 76, lado: 6, topo: 6 }, mini: { w: 60, h: 73, jh: 48, lado: 6, topo: 6 }, pocket: { w: 66, h: 99, jh: 79, lado: 3, topo: 3 },
  imini: { w: 54, h: 86, jh: 62, lado: 4, topo: 5 }, isq: { w: 72, h: 86, jh: 62, lado: 5, topo: 5 }, iwide: { w: 108, h: 86, jh: 62, lado: 4.5, topo: 5 } };
const frDe = (k) => Object.assign({ fmt: k, rad: 0.4, man: false, lock: true, ori: 'v' }, FMT[k]);

const srv = await servir(), nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })); localStorage.setItem('pl-mais', '{}'); });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('  erro de página:', e.message));

/* ---------- projeto com todas as fotos (ids 1…N) ---------- */
await p.goto(srv.url + 'app/adicionar-fotos/');
await p.evaluate(async (nomes) => {
  localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
  const pr = await PLPROJETOS.criar('Vitrine');
  for (let i = 0; i < nomes.length; i++) { const b = await (await fetch('../../assets/img/fotos/' + nomes[i] + '.jpg')).blob(); await PLFOTOS.salvar(i + 1, new File([b], nomes[i] + '.jpg', { type: 'image/jpeg' }), pr.id); }
  sessionStorage.setItem('pl-fotos', JSON.stringify(nomes.map((n, i) => i + 1))); await PLPROJETOS.salvarEstado();
}, FOTOS);
const ENTRADAS = FOTOS.map((n, i) => ({ src: i + 1, modo: 'preencher', z: 100, ang: 0, px: 0, py: 0, rot: 0, flip: false, adj: { brilho: 0, contraste: 0, saturacao: 0, temp: 0, realces: 0, sombras: 0, nitidez: 0, vinheta: 0 }, txt: null, flt: { id: 'original', int: 100 } }));

/* ---------- legenda: a mesma do editor (PLTEXTO), com fonte, cor, corpo e alinhamento escolhidos ---------- */
async function legenda(o) {
  if (o.leg) return o.leg;
  if (!p.url().includes('/app/editor/quadro/')) { await p.goto(srv.url + 'app/editor/quadro/'); await p.waitForFunction(() => !!window.PLTEXTO); }
  return p.evaluate((o) => {
    const T = PLTEXTO, l = o.pocket ? T.legPocket(T.LEG0) : T.legInicial();
    if (o.fonte) { l.data.font = o.fonte; l.loc.font = o.fonte; }
    if (o.cor) { l.data.cor = o.cor; l.loc.cor = o.cor; }
    if (o.al) l.al = o.al;
    if (o.pt && l.pad) { l.pad.l[0].pt = o.pt[0]; l.pad.l[1].pt = o.pt[1]; }
    return l;
  }, o);
}
/* ---------- uma polaroid (PNG com fundo transparente), pelo Quadro ---------- */
const OCULTA = '#pq .pl-qualidade,#pq .win__grid,#pq .win__ghost{display:none!important}#pq{box-shadow:none!important;border-radius:0!important}html,body{background:transparent!important}';
async function polaroid(o) {
  const leg = await legenda(o), fr = o.fr || frDe(o.fmt), k = ID[o.foto];
  const q = [{ leg, fr, nome: 'Vitrine' }].concat(ENTRADAS.map((e) => Object.assign({}, e)));
  const e = q[k]; e.flt = { id: o.flt || 'original', int: o.int || 100 }; if (o.z) e.z = o.z; if (o.py) e.py = o.py; if (o.px) e.px = o.px;
  if (o.linhas) e.pl = o.linhas.map((v) => ({ v, m: true }));
  if (o.txt) e.txt = o.txt;
  if (o.meta) e.meta = o.meta;
  await p.evaluate((q) => { sessionStorage.removeItem('pl-fmt'); sessionStorage.setItem('pl-quadro', JSON.stringify(q)); }, q);
  await p.goto(srv.url + 'app/editor/quadro/#foto-' + k); await p.reload();
  await p.waitForFunction(() => { const i = document.querySelector('#pq .ph img'); return window.PLQ && i && i.complete && i.naturalWidth > 0; }, null, { timeout: 20000 });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.addStyleTag({ content: OCULTA });
  return (await p.locator('#pq').screenshot({ omitBackground: true, animations: 'disabled' })).toString('base64');
}
/* ---------- uma colagem (a folha inteira), pelas Folhas no modo Colagem ---------- */
async function colagem(o) {
  const leg = await legenda(o.legenda || { fonte: 'Caveat', pt: [12, 10] });
  const q = [{ leg, fr: frDe(o.fmt || 'classico'), nome: 'Vitrine' }].concat(ENTRADAS.map((e) => Object.assign({}, e)));
  (o.fotos || []).forEach((n, i) => { const e = q[ID[n]]; e.flt = { id: (o.flts && o.flts[i]) || 'original', int: 100 }; e.pl = [{ v: (o.linhas && o.linhas[i]) || '', m: true }, { v: '', m: true }]; });
  const C = { ativo: true, layout: o.layout, peca: o.peca || 'A4', orient: o.orient || 'retrato', margem: o.margem || 8, fotos: o.fotos.map((n) => ID[n]), fundo: o.fundo || { tipo: 'cor', cor: '#FFFFFF', cor2: '#F8F9FA', ang: 135, foto: null, px: 50, py: 50, suave: 40 } };
  if (C.fundo.tipo === 'foto' && o.fundoFoto) C.fundo.foto = ID[o.fundoFoto];
  await p.evaluate(({ q, C }) => { sessionStorage.removeItem('pl-fmt'); sessionStorage.setItem('pl-quadro', JSON.stringify(q)); sessionStorage.setItem('pl-colagem', JSON.stringify(C)); }, { q, C });
  await p.goto(srv.url + 'app/editor/'); await p.reload();
  await p.waitForFunction(() => { const ps = [...document.querySelectorAll('#sheet .pol')]; return ps.length > 0 && ps.every((x) => { const i = x.querySelector('.pol__ph img'); return i && i.complete && i.naturalWidth > 0; }); }, null, { timeout: 30000 });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
  await p.addStyleTag({ content: '#sheet .guides,#sheet .pl-qualidade,#sheet .sheet__sel,#sheet .is-sel::after{display:none!important}#sheet .pol{outline:none!important}#sheet .pol__in{box-shadow:0 1px 4px rgba(0,0,0,.28)!important}#sheet{box-shadow:none!important;outline:none!important}' });
  const b64 = (await p.locator('#sheet').screenshot({ animations: 'disabled' })).toString('base64');
  await p.evaluate(() => sessionStorage.removeItem('pl-colagem'));
  return b64;
}
/* ---------- composição: as polaroids (PNG) sobre uma superfície, com sombra e leve giro ---------- */
async function compor(nome, w, h, fundo, itens, q, extra) {
  const cp = await ctx.newPage(); await cp.setViewportSize({ width: w, height: h });
  const el = itens.map((it) => '<img src="data:image/png;base64,' + it.png + '" style="position:absolute;left:' + it.x + 'px;top:' + it.y + 'px;width:' + it.w + 'px;transform:rotate(' + (it.r || 0) + 'deg);filter:drop-shadow(0 ' + (it.s || 10) + 'px ' + (it.s || 10) * 1.8 + 'px rgba(0,0,0,' + (it.so || .28) + '))">').join('');
  await cp.setContent('<html><head><style>html,body{margin:0;width:' + w + 'px;height:' + h + 'px;overflow:hidden}</style></head><body style="position:relative;background:' + fundo + '">' + (extra || '') + el + '</body></html>');
  await cp.waitForTimeout(400);
  const buf = await cp.screenshot({ type: 'jpeg', quality: q || 80 });
  writeFileSync(OUT + nome, buf); await cp.close();
  console.log('  ✔ vitrine/' + nome + ' (' + Math.round(buf.length / 1024) + ' KB)');
}
const MESA = 'url(' + srv.url + 'assets/img/fotos/mesa.jpg) center/cover';

/* ===================== 1 · sugestões do topo (tela de Projetos) · 400 × 240 ===================== */
if (quer('sug')) {
  console.log('Sugestões (Projetos):');
  const viagem = [
    await polaroid({ foto: 'amigos-viagem', fmt: 'classico', fonte: 'Caveat', pt: [12, 10], linhas: ['Sydney com a turma', '03/2025'], flt: 'cinema' }),
    await polaroid({ foto: 'paisagem-lago', fmt: 'classico', fonte: 'Caveat', pt: [12, 10], linhas: ['O lago mais azul', '04/2025'], flt: 'original' }),
    await polaroid({ foto: 'amigos-estrada', fmt: 'classico', fonte: 'Caveat', pt: [12, 10], linhas: ['Pé na estrada', '03/2025'], flt: 'retro' })];
  await compor('sug-viagem.jpg', 400, 240, MESA, [{ png: viagem[1], x: 16, y: 20, w: 150, r: -7 }, { png: viagem[2], x: 236, y: 26, w: 150, r: 6 }, { png: viagem[0], x: 122, y: 14, w: 156, r: -1 }]);
  const cidade = [
    await polaroid({ foto: 'cidade-rua', fmt: 'imini', fonte: 'Special Elite', pt: [10, 8], linhas: ['Centro, 18h', '22/08/25'], flt: 'pb' }),
    await polaroid({ foto: 'cidade-grafite', fmt: 'imini', fonte: 'Special Elite', pt: [10, 8], linhas: ['Beco das cores', '23/08/25'], flt: 'original' }),
    await polaroid({ foto: 'cidade-luzes', fmt: 'imini', fonte: 'Special Elite', pt: [10, 8], linhas: ['Noite na cidade', '23/08/25'], flt: 'cinema' })];
  await compor('sug-cidade.jpg', 400, 240, MESA, [{ png: cidade[0], x: 40, y: 18, w: 106, r: -8 }, { png: cidade[2], x: 254, y: 22, w: 106, r: 7 }, { png: cidade[1], x: 147, y: 12, w: 106, r: 1 }]);
  const casal = [
    await polaroid({ foto: 'casal-por-do-sol', fmt: 'pocket', pocket: true, linhas: ['Pipa - RN', '20/04/23'], flt: 'polaroid' }),
    await polaroid({ foto: 'casal-cidade', fmt: 'pocket', pocket: true, linhas: ['Salvador - BA', 'Pelourinho'], flt: 'desbotado' }),
    await polaroid({ foto: 'casal-serra', fmt: 'pocket', pocket: true, linhas: ['Itacaré - BA', '15/06/19'], flt: 'verao' })];
  await compor('sug-casal.jpg', 400, 240, MESA, [{ png: casal[1], x: 40, y: 16, w: 110, r: -9 }, { png: casal[2], x: 250, y: 20, w: 110, r: 8 }, { png: casal[0], x: 145, y: 10, w: 112, r: -1 }]);
  const coracao = await colagem({ layout: 'coracao', orient: 'paisagem', margem: 8, fmt: 'classico', fotos: ['amigas-praia', 'casal-por-do-sol', 'amigos-praia', 'paisagem-mar', 'casal-bicicletas', 'familia-por-do-sol', 'amigos-abraco', 'casal-praia', 'paisagem-rochas', 'casal-campo', 'amigos-skate', 'casal-noite'], flts: ['verao', 'polaroid', 'original', 'praia', 'retro', 'original', 'verao', 'pb', 'cinema', 'pastel', 'noir', 'original'] });
  await compor('sug-coracao.jpg', 400, 240, MESA, [{ png: coracao, x: 52, y: 14, w: 296, r: -2, s: 8 }]);
  const varal = await colagem({ layout: 'tira', orient: 'paisagem', margem: 8, fmt: 'classico', fotos: ['amigos-trilha', 'amigos-acampamento', 'paisagem-estrelas', 'amigos-viagem', 'casal-ponte', 'cidade-porto', 'amigos-cidade', 'casal-noite'], flts: ['retro', 'cinema', 'original', 'pastel', 'antiga', 'noir', 'instantanea', 'original'], linhas: ['Trilha', 'Fogueira', 'Céu', 'Sydney', 'Florença', 'Porto', 'Picnic', 'Noite'] });
  await compor('sug-varal.jpg', 400, 240, MESA, [{ png: varal, x: 52, y: 14, w: 296, r: 2, s: 8 }]);
  const mesa = await colagem({ layout: 'espalhadas', orient: 'paisagem', margem: 8, fmt: 'classico', fotos: ['casal-ponte', 'amigos-cidade', 'cidade-multidao', 'paisagem-lago', 'amigos-skate', 'casal-campo', 'cidade-mochila'], flts: ['polaroid', 'original', 'retro', 'verao', 'noir', 'pastel', 'desbotado'], fundo: { tipo: 'foto', cor: '#FFFFFF', cor2: '#F8F9FA', ang: 135, foto: null, px: 50, py: 50, suave: 40 }, fundoFoto: 'paisagem-mar', linhas: ['Florença', 'Picnic', 'Centro', 'Lago', 'Skate', 'Campo', 'Rolê'] });
  await compor('sug-mesa.jpg', 400, 240, MESA, [{ png: mesa, x: 52, y: 14, w: 296, r: -1, s: 8 }]);
}

/* ===================== 2 · modelos do Início (cada um como o «Usar este modelo» aplica) ===================== */
if (quer('modelo')) {
  console.log('Modelos (Início):');
  await p.goto(srv.url + 'app/inicio/'); await p.waitForFunction(() => !!window.PLINICIO);
  const M = await p.evaluate(() => PLINICIO.MODELOS.map((m) => ({ id: m.id, fmt: m.fmt, texto: m.texto, leg: PLINICIO.legDe(m), fr: PLINICIO.frDe(m), dataOn: m.dataOn, locOn: m.locOn })));
  const FOTO = { praia: ['amigas-praia', 'praia'], serra: ['casal-serra', 'retro'], cidade: ['cidade-luzes', 'cinema'], 'por-do-sol': ['familia-por-do-sol', 'verao'], turma: ['amigos-abraco', 'verao'], viagem: ['amigos-estrada', 'antiga'], 'nos-dois': ['casal-bicicletas', 'polaroid'], 'neste-dia': ['casal-praia', 'pb'] };
  for (const m of M) {
    const f = FOTO[m.id] || ['paisagem-mar', 'original'];
    const png = await polaroid({ foto: f[0], leg: m.leg, fr: m.fr, flt: f[1], txt: m.texto, meta: { iso: '2026-07-14T10:00', ds: 'manual', dh: 0, c: 'Campos do Jordão - SP', cs: 'manual', o: 'Do aparelho', conv: false } });
    const r = FMT[m.fmt], H = 244, larg = Math.round(Math.min(184, (H - 20) * r.w / r.h));
    await compor('modelo-' + m.id + '.jpg', 200, H, '#FFFFFF', [{ png, x: Math.round((200 - larg) / 2), y: 8, w: larg, r: 0, s: 4, so: .16 }], 84);
  }
}

/* ===================== 3 · colagens para as redes (Início) ===================== */
if (quer('redes')) {
  console.log('Colagens para as redes (Início):');
  const P = async (foto, flt, fmt, linhas) => polaroid({ foto, fmt: fmt || 'classico', fonte: 'Caveat', pt: [12, 10], linhas: linhas || ['', ''], flt });
  const nove = [['paisagem-mar', 'praia'], ['amigas-praia', 'verao'], ['cidade-grafite', 'original'], ['casal-campo', 'pastel'], ['amigos-trilha', 'retro'], ['paisagem-estrelas', 'original'], ['amigos-cidade', 'instantanea'], ['casal-noite', 'cinema'], ['paisagem-rochas', 'desbotado']];
  const pn = []; for (const [f, t] of nove) pn.push(await P(f, t, 'mini'));
  await compor('rede-mural.jpg', 240, 240, '#FFFFFF', pn.map((png, i) => ({ png, x: 14 + (i % 3) * 72, y: 8 + Math.floor(i / 3) * 76, w: 68, r: [-3, 2, -1, 3, -2, 1, 2, -3, 1][i], s: 3, so: .2 })), 84);
  const mesaP = []; for (const [f, t, l] of [['casal-por-do-sol', 'polaroid', 'Fim de tarde'], ['amigos-praia', 'verao', 'Praia'], ['cidade-porto', 'cinema', 'Porto'], ['amigos-acampamento', 'retro', 'Fogueira'], ['paisagem-lago', 'original', 'Lago']]) mesaP.push(await P(f, t, 'classico', [l, '']));
  await compor('rede-mesa.jpg', 240, 240, MESA, [{ png: mesaP[0], x: 12, y: 14, w: 92, r: -9 }, { png: mesaP[1], x: 128, y: 8, w: 92, r: 7 }, { png: mesaP[2], x: 20, y: 120, w: 92, r: 6 }, { png: mesaP[3], x: 130, y: 118, w: 92, r: -6 }, { png: mesaP[4], x: 74, y: 62, w: 92, r: 2 }]);
  const capa = await P('amigos-abraco', 'verao', 'classico', ['Nossa turma', 'jul/26']);
  const cap = []; for (const [f, t] of [['amigos-trilha', 'retro'], ['amigos-praia', 'verao'], ['amigos-acampamento', 'cinema']]) cap.push(await P(f, t, 'mini'));
  await compor('rede-capa.jpg', 192, 240, '#FFFFFF', [{ png: capa, x: 26, y: 6, w: 140, r: -1, s: 5, so: .2 }, ...cap.map((png, i) => ({ png, x: 6 + i * 62, y: 168, w: 56, r: [-4, 2, 5][i], s: 3, so: .2 }))], 84);
  const tempo = []; for (const [f, t, l] of [['casal-serra', 'original', '02/07'], ['casal-campo', 'pastel', '09/07'], ['casal-ponte', 'antiga', '16/07'], ['casal-noite', 'cinema', '23/07']]) tempo.push(await P(f, t, 'mini', [l, '']));
  await compor('rede-tempo.jpg', 192, 240, '#FFFFFF', tempo.map((png, i) => ({ png, x: i % 2 ? 104 : 14, y: 4 + i * 50, w: 72, r: i % 2 ? 4 : -4, s: 3, so: .2 })), 84, '<svg style="position:absolute;inset:0" width="192" height="240"><path d="M96 8V232" stroke="#006194" stroke-width="1.5" stroke-dasharray="3 4"/></svg>');
  const varalP = []; for (const [f, t] of [['amigas-praia', 'verao'], ['casal-bicicletas', 'polaroid'], ['paisagem-mar', 'praia'], ['amigos-praia', 'original']]) varalP.push(await P(f, t, 'mini'));
  const fio = '<svg style="position:absolute;inset:0;z-index:2" width="135" height="240"><path d="M0 22Q67 40 135 22M0 136Q67 154 135 136" stroke="#000" stroke-width="1" fill="none"/><g fill="#FD761A"><rect x="31" y="23" width="5" height="13" rx="1" transform="rotate(-5 33 29)"/><rect x="96" y="27" width="5" height="13" rx="1" transform="rotate(4 98 33)"/><rect x="33" y="137" width="5" height="13" rx="1" transform="rotate(3 35 143)"/><rect x="96" y="141" width="5" height="13" rx="1" transform="rotate(-4 98 147)"/></g></svg>';
  await compor('rede-varal.jpg', 135, 240, '#FFFFFF', [{ png: varalP[0], x: 6, y: 30, w: 56, r: -5, s: 3, so: .2 }, { png: varalP[1], x: 71, y: 34, w: 56, r: 4, s: 3, so: .2 }, { png: varalP[2], x: 8, y: 144, w: 56, r: 3, s: 3, so: .2 }, { png: varalP[3], x: 71, y: 148, w: 56, r: -4, s: 3, so: .2 }], 84, fio);
  const tira = []; for (const [f, t] of [['amigos-skate', 'noir'], ['cidade-rua', 'pb'], ['cidade-mochila', 'pb'], ['cidade-multidao', 'antiga']]) tira.push(await P(f, t, 'mini'));
  await compor('rede-tira.jpg', 135, 240, '#FFFFFF', tira.map((png, i) => ({ png, x: 38, y: 4 + i * 58, w: 58, r: 0, s: 2, so: .18 })), 84);
}

/* ===================== 4 · banners do Início (1200 × 500, fundo preto, conteúdo à direita) ===================== */
if (quer('banner')) {
  console.log('Banners (Início):');
  const camera = 'url(' + srv.url + 'assets/img/fotos/camera-perfil.png)';
  const b1 = [await polaroid({ foto: 'amigos-abraco', fmt: 'classico', fonte: 'Caveat', pt: [12, 10], linhas: ['A turma toda', '12/01/2025'], flt: 'verao' }),
    await polaroid({ foto: 'casal-por-do-sol', fmt: 'classico', fonte: 'Caveat', pt: [12, 10], linhas: ['Fim de tarde a dois', '03/2025'], flt: 'polaroid' })];
  {
    const cp = await ctx.newPage(); await cp.setViewportSize({ width: 1200, height: 500 });
    await cp.setContent('<html><body style="margin:0;width:1200px;height:500px;overflow:hidden;background:#000;position:relative">'
      + '<div style="position:absolute;left:520px;top:96px;width:330px;height:258px;background:' + camera + ' center/contain no-repeat"></div>'
      + '<img src="data:image/png;base64,' + b1[1] + '" style="position:absolute;left:790px;top:120px;width:210px;transform:rotate(-8deg);filter:drop-shadow(0 18px 30px rgba(0,0,0,.6))">'
      + '<img src="data:image/png;base64,' + b1[0] + '" style="position:absolute;left:930px;top:36px;width:240px;transform:rotate(6deg);filter:drop-shadow(0 18px 30px rgba(0,0,0,.6))">'
      + '</body></html>');
    await cp.waitForTimeout(500); const buf = await cp.screenshot({ type: 'jpeg', quality: 82 }); writeFileSync(OUT + 'banner-imprimir.jpg', buf); await cp.close();
    console.log('  ✔ vitrine/banner-imprimir.jpg (' + Math.round(buf.length / 1024) + ' KB)');
  }
  const b2 = [await polaroid({ foto: 'casal-por-do-sol', fmt: 'pocket', pocket: true, linhas: ['Pipa - RN', '20/04/23'], flt: 'polaroid' }),
    await polaroid({ foto: 'amigas-praia', fmt: 'classico', fonte: 'Shadows Into Light', pt: [12, 10], cor: 'azul', linhas: ['Dias de sol', 'jul/26'], flt: 'praia' }),
    await polaroid({ foto: 'cidade-luzes', fmt: 'imini', fonte: 'Courier Prime', pt: [10, 8], linhas: ['Noite na cidade', ''], flt: 'cinema' }),
    await polaroid({ foto: 'familia-por-do-sol', fmt: 'iwide', fonte: 'Sacramento', pt: [14, 10], cor: 'laranja', linhas: ['Fim de tarde', ''], flt: 'verao' })];
  await compor('banner-design.jpg', 1200, 500, '#000', [{ png: b2[3], x: 470, y: 236, w: 262, r: -6, s: 18, so: .6 }, { png: b2[2], x: 640, y: 50, w: 150, r: -5, s: 18, so: .6 }, { png: b2[1], x: 820, y: 40, w: 220, r: 4, s: 18, so: .6 }, { png: b2[0], x: 1040, y: 150, w: 150, r: 9, s: 18, so: .6 }], 82);
  const b3 = await colagem({ layout: 'grade', orient: 'retrato', margem: 10, fmt: 'mini', fotos: ['paisagem-mar', 'amigas-praia', 'cidade-grafite', 'casal-campo', 'amigos-trilha', 'cidade-porto', 'amigos-cidade', 'casal-noite', 'paisagem-rochas'], flts: ['praia', 'verao', 'original', 'pastel', 'retro', 'noir', 'polaroid', 'cinema', 'desbotado'] });
  await compor('banner-colagem.jpg', 1200, 500, '#000', [{ png: b3, x: 760, y: 20, w: 330, r: 3, s: 20, so: .6 }], 82);
}
await nav.close(); srv.close?.();
console.log('\n✔ vitrine pronta em site/assets/img/vitrine/');
