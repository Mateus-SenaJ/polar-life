/* Fotos reais na tela (Quadro e Folhas) · T5 (tudo no aparelho) · MT-02 (o mesmo recorte do PDF) · T4 (nada sobre a foto).
   JPEGs gerados por canvas dentro do navegador: nenhuma foto pessoal entra no teste. */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SAIDA = fileURLToPath(new URL('../saida/fotos-tela/', import.meta.url));
mkdirSync(SAIDA, { recursive: true });
const JS = fileURLToPath(new URL('../../site/assets/js/', import.meta.url));
const srv = await servir(), nav = await chromium.launch({ headless: true });
const falhas = [], errosPg = [];
function ok(v, m) { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas.push(m); }
function titulo(t) { console.log('\n' + t); }

const LEG = { original: false, al: 'esq', preset: 'simples', dy: 0, inc: 0,
  txt: { on: true, font: 'Caveat', pt: 16, fit: false, caixa: 'normal', esp: 0, cor: 'preto' },
  data: { on: true, font: 'IBM Plex Mono', pt: 8, fmt: 0, cor: 'preto' },
  loc: { on: true, font: 'IBM Plex Mono', pt: 8, cor: 'preto', uf: 'sigla', pais: 'oculto', ocBR: true, sep: ', ', ordem: 'cidade' } };
const AJ0 = { brilho: 0, contraste: 0, saturacao: 0, temp: 0, realces: 0, sombras: 0, nitidez: 0, vinheta: 0 };

async function ctxNovo(vp) {
  const c = await nav.newContext({ viewport: vp || { width: 1440, height: 900 } });
  await c.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  return c;
}
/* cria um projeto no aparelho com fotos de duas cores (metade esquerda #C00000, metade direita #0000C0) */
async function criar(p, nome, n, opcoes) {
  opcoes = opcoes || {};
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.waitForFunction(() => !!window.PLFOTOS && !!window.PLPROJETOS && !!window.PLSESSAO);
  return p.evaluate(async o => {
    localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
    function exif(data) {
      const b = [], u16 = v => b.push(v & 255, v >> 8 & 255), u32 = v => { u16(v & 65535); u16(v >>> 16 & 65535); };
      b.push(73, 73); u16(42); u32(8); u16(2); u16(0x8769); u16(4); u32(1); u32(38); u16(0x8825); u16(4); u32(1); u32(76); u32(0);
      u16(1); u16(0x9003); u16(2); u32(20); u32(56); u32(0);
      for (const ch of data) b.push(ch.charCodeAt(0)); b.push(0); u16(0); u32(0);
      const corpo = [69, 120, 105, 102, 0, 0].concat(b), len = corpo.length + 2;
      return [255, 225, len >> 8, len & 255].concat(corpo);
    }
    const pr = await PLPROJETOS.criar(o.nome), ids = [];
    for (let i = 0; i < o.n; i++) {
      const c = document.createElement('canvas'); c.width = o.w; c.height = o.h;
      const x = c.getContext('2d');
      if (o.bicolor) { x.fillStyle = '#C00000'; x.fillRect(0, 0, c.width / 2, c.height); x.fillStyle = '#0000C0'; x.fillRect(c.width / 2, 0, c.width / 2, c.height); }
      else { x.fillStyle = ['#C00000', '#0000C0', '#006194', '#FD761A'][i % 4]; x.fillRect(0, 0, c.width, c.height); }
      let bytes = new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/jpeg', o.q || .9))).arrayBuffer());
      if (o.datas && o.datas[i]) {
        const a = exif(o.datas[i]), n2 = new Uint8Array(bytes.length + a.length);
        n2.set(bytes.slice(0, 2)); n2.set(a, 2); n2.set(bytes.slice(2), 2 + a.length); bytes = n2;
      }
      await PLFOTOS.salvar(i + 1, new File([bytes], 'foto-' + (i + 1) + '.jpg', { type: 'image/jpeg' }), pr.id);
      ids.push(i + 1);
    }
    sessionStorage.setItem('pl-fotos', JSON.stringify(ids));
    await PLSESSAO.salvarJa();
    return { id: pr.id };
  }, { nome, n, w: opcoes.w || 1600, h: opcoes.h || 1200, datas: opcoes.datas || null, bicolor: opcoes.bicolor !== false, q: opcoes.q });
}
/* estado do Quadro gravado antes de abrir a página (o PDF lê o mesmo estado · MT-02) */
async function estado(p, est) {
  await p.evaluate(est => {
    const base = { modo: 'preencher', z: 100, ang: 0, px: 0, py: 0, ex: 0, ey: 0, rot: 0, flip: false, adj: {}, flt: { id: 'original', int: 100 }, txt: null };
    const q = [{ leg: null, fr: { fmt: 'classico', w: 88, h: 107, jh: 76, lado: 6, topo: 6, rad: .4, ori: 'v' } }];
    q.push(Object.assign({ src: 1 }, base, est));
    q.push(Object.assign({ src: 2 }, base));
    sessionStorage.setItem('pl-quadro', JSON.stringify(q));
  }, est);
}
/* lê pixels de uma captura (a foto real desenhada na tela) */
async function pixels(page, sel, pontos) {
  const alvo = page.locator(sel).first();
  const b64 = (await alvo.screenshot()).toString('base64');
  return page.evaluate(async o => {
    const img = new Image();
    await new Promise((r, n) => { img.onload = r; img.onerror = n; img.src = 'data:image/png;base64,' + o.b64; });
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
    return o.pontos.map(q => {
      const d = g.getImageData(Math.min(img.width - 1, Math.round(q[0] * (img.width - 1))), Math.min(img.height - 1, Math.round(q[1] * (img.height - 1))), 1, 1).data;
      return [d[0], d[1], d[2]];
    });
  }, { b64, pontos });
}
const vermelho = p => p[0] > 110 && p[1] < 90 && p[2] < 90;
const azul = p => p[2] > 110 && p[0] < 90 && p[1] < 90;
const cinza = p => Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]) <= 6;

try {
  /* ============ projeto real com 4 fotos ============ */
  const ctx = await ctxNovo(), p = await ctx.newPage();
  p.on('pageerror', e => errosPg.push(String(e)));
  p.setDefaultTimeout(30000);
  const pr = await criar(p, 'Praia 2025', 4, { datas: ['2025:03:09 10:11:12', '2025:03:10 18:00:00', null, '2024:12:25 09:00:00'] });

  titulo('API do PLFOTOTELA:');
  await p.goto(srv.url + 'app/editor/quadro/#foto-1');
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  await p.waitForTimeout(700);
  const api = await p.evaluate(async () => {
    const u = await PLFOTOTELA.url(1);
    let responde = false;
    try { const r = await fetch(u); responde = r.ok; } catch (e) { }
    const m = await PLFOTOTELA.mini(1, true);
    const img = new Image(); img.src = m;
    await new Promise(r => { img.onload = r; img.onerror = r; });
    const antes = PLFOTOTELA.ativos();
    PLFOTOTELA.limpar();
    let depois = false;
    try { const r = await fetch(u); depois = r.ok; } catch (e) { }
    return { u, responde, m, w: img.naturalWidth, h: img.naturalHeight, antes, depois, ativos: PLFOTOTELA.ativos() };
  });
  ok(api.responde, 'a URL da foto cheia responde a fetch');
  ok(api.m.startsWith('blob:'), 'a miniatura também é uma object URL');
  ok(Math.max(api.w, api.h) <= 512 && Math.max(api.w, api.h) > 0, 'a miniatura tem lado maior de até 512 px (' + api.w + ' × ' + api.h + ')');
  ok(!api.depois, 'limpar() revoga a URL: o fetch falha');
  ok(api.ativos.cheias === 0 && api.ativos.minis === 0, 'limpar() esvazia as URLs ativas');
  ok(api.antes.cheias >= 1, 'as URLs ativas são contadas (' + JSON.stringify(api.antes) + ')');
  await p.reload();
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  await p.waitForTimeout(700);

  titulo('Quadro: a janela e a faixa mostram a foto real:');
  const janela = await p.evaluate(() => {
    const im = document.querySelector('#clip img'), sv = document.querySelector('#clip svg');
    return { temImg: !!im, src: im ? im.src : '', w: im ? im.naturalWidth : 0, svg: !!sv };
  });
  ok(janela.temImg && janela.src.startsWith('blob:'), 'a janela tem um <img> com src blob:');
  ok(janela.w > 0, 'a foto carregou na janela (largura natural ' + janela.w + ' px)');
  ok(!janela.svg, 'a cena de exemplo sumiu da janela');
  await p.screenshot({ path: SAIDA + '01-quadro-janela.png' });
  const faixa = await p.evaluate(() => ({ botoes: document.querySelectorAll('#faixa .th').length, comImg: document.querySelectorAll('#faixa .tq img').length, comSvg: document.querySelectorAll('#faixa .tq svg').length }));
  ok(faixa.comImg === 4 && faixa.comSvg === 0, 'a faixa mostra as 4 fotos em miniatura (' + faixa.comImg + ' com img, ' + faixa.comSvg + ' com svg)');

  titulo('Trocar de foto troca a imagem:');
  const antesTroca = await p.evaluate(() => document.querySelector('#clip img').src);
  await p.click('#faixa li:nth-child(2) .th');
  await p.waitForTimeout(600);
  const depoisTroca = await p.evaluate(() => ({ src: document.querySelector('#clip img') ? document.querySelector('#clip img').src : '', w: document.querySelector('#clip img') ? document.querySelector('#clip img').naturalWidth : 0 }));
  ok(depoisTroca.src && depoisTroca.src !== antesTroca, 'o src da foto na janela muda ao trocar de foto');
  ok(depoisTroca.w > 0, 'a foto nova carregou (' + depoisTroca.w + ' px)');
  await p.screenshot({ path: SAIDA + '02-quadro-foto2.png' });

  titulo('Filtros, comparar e sugestão usam a foto:');
  const flt = await p.evaluate(async () => {
    await new Promise(r => setTimeout(r, 400));
    const tiles = document.querySelectorAll('.ft__ph');
    return { tiles: tiles.length, comImg: document.querySelectorAll('.ft__ph img').length, sug: (document.getElementById('flt-sug') || {}).textContent };
  });
  ok(flt.tiles === 12, 'a grade de filtros mostra 12 quadradinhos');
  ok(flt.comImg === 12, 'cada quadradinho tem a foto real (' + flt.comImg + ' com img)');
  ok(/Sugerido para esta foto|já usa o filtro|Calculando/.test(flt.sug || ''), 'a sugestão é calculada no aparelho (' + (flt.sug || '').slice(0, 40) + ')');
  await p.click('[data-flt=cmp]');
  await p.waitForTimeout(300);
  const cmp = await p.evaluate(() => ({ existe: !!document.getElementById('cmp'), imgs: document.querySelectorAll('#cmp img').length }));
  ok(cmp.existe && cmp.imgs > 0, '«Comparar» mostra a foto no quadro ao lado');
  await p.click('[data-flt=cmp]');

  titulo('Object URLs: fonte única e revogação:');
  const codigo = {
    quadro: readFileSync(JS + 'pages/quadro.js', 'utf8'),
    editor: readFileSync(JS + 'pages/editor.js', 'utf8'),
    filtros: readFileSync(JS + 'editor/filtros.js', 'utf8'),
    tela: readFileSync(JS + 'ui/foto-tela.js', 'utf8')
  };
  const criaUrl = [codigo.quadro, codigo.editor, codigo.filtros].map(t => (t.match(/createObjectURL/g) || []).length);
  ok(criaUrl.every(n => n <= 1), 'só o backup «Salvar .polarlife» cria object URL no editor (' + criaUrl.join(', ') + ')');
  ok(codigo.quadro.indexOf('translate(-50%,-50%)') < 0 && codigo.editor.indexOf('translate(-50%,-50%)') < 0, 'a expressão do recorte da foto só existe em PLFOTOTELA.estilo');
  ok(codigo.tela.indexOf("transform:translate(-50%,-50%)") >= 0, 'PLFOTOTELA.estilo tem a conta do recorte');
  ok(codigo.quadro.indexOf('PLFOTOTELA.estilo') >= 0 && codigo.editor.indexOf('PLFOTOTELA.estilo') >= 0, 'quadro.js e editor.js chamam PLFOTOTELA.estilo');

  titulo('Limite de fotos cheias:');
  const cheias = await p.evaluate(async () => {
    for (let i = 1; i <= 10; i++) { PLQ.cur(); }
    return PLFOTOTELA.ativos().cheias;
  });
  ok(cheias <= 6, 'no máximo 6 fotos cheias ficam abertas (' + cheias + ')');

  titulo('Remover foto revoga a URL e desfazer traz de volta:');
  const rem = await p.evaluate(async () => {
    const antes = PLFOTOTELA.tem(2, true);
    PLQ.remover([2]);
    await new Promise(r => setTimeout(r, 400));
    let ainda = false;
    try { const r = await fetch(antes); ainda = r.ok; } catch (e) { }
    const depois = PLFOTOTELA.tem(2, true);
    return { antes, ainda, depois };
  });
  ok(!rem.ainda && !rem.depois, 'a URL da foto removida deixa de responder');
  const desf = await p.evaluate(async () => {
    PLQ.ST(); document.getElementById('undo').click();
    await new Promise(r => setTimeout(r, 600));
    return { src: PLQ.ST()[2] ? PLQ.ST()[2].src : 0 };
  });
  ok(desf.src === 2, 'desfazer volta a foto 2 para o projeto');
  await p.waitForTimeout(800);
  const voltou = await p.evaluate(() => ({ mini: !!PLFOTOTELA.tem(2, true), imgs: document.querySelectorAll('#faixa .tq img').length }));
  ok(voltou.mini && voltou.imgs >= 3, 'a miniatura da foto volta a ser gerada (' + voltou.imgs + ' miniaturas na faixa)');

  titulo('Troca de projeto:');
  const troca = await p.evaluate(async () => {
    const u = PLFOTOTELA.tem(1, false) || PLFOTOTELA.tem(1, true);
    PLPROJETOS.definirAtual('p-outro-projeto');
    await PLFOTOTELA.mini(1, true);
    await new Promise(r => setTimeout(r, 200));
    let ainda = false;
    try { const r = await fetch(u); ainda = r.ok; } catch (e) { }
    return { ainda, ativos: PLFOTOTELA.ativos() };
  });
  ok(!troca.ainda, 'as URLs do projeto anterior deixam de responder');
  ok(troca.ativos.cheias === 0, 'a troca de projeto limpa as fotos cheias (' + JSON.stringify(troca.ativos) + ')');
  await ctx.close();

  /* ============ recorte igual ao do PDF (Quadro e Folhas) ============ */
  const ctx2 = await ctxNovo(), p2 = await ctx2.newPage();
  p2.on('pageerror', e => errosPg.push(String(e)));
  p2.setDefaultTimeout(30000);
  await criar(p2, 'Recorte 2025', 2, { bicolor: true });

  async function recorteQuadro(est) {
    await p2.goto(srv.url + 'app/editor/quadro/#foto-1');
    await p2.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
    await estado(p2, est);
    await p2.reload();
    await p2.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
    await p2.waitForFunction(() => { const i = document.querySelector('#clip img'); return i && i.naturalWidth > 0; }, null, { timeout: 15000 });
    await p2.waitForTimeout(400);
    return pixels(p2, '#win', [[.25, .5], [.75, .5], [.5, .25], [.5, .75]]);
  }
  async function recorteFolhas(est) {
    await p2.goto(srv.url + 'app/editor/');
    await p2.waitForFunction(() => document.querySelectorAll('#sheet .pol').length >= 1);
    await estado(p2, est);
    await p2.reload();
    await p2.waitForFunction(() => document.querySelectorAll('#sheet .pol').length >= 1);
    await p2.waitForFunction(() => { const i = document.querySelector('#sheet .pol__ph img'); return i && i.naturalWidth > 0; }, null, { timeout: 15000 });
    await p2.waitForTimeout(400);
    return pixels(p2, '#sheet .pol__ph', [[.25, .5], [.75, .5], [.5, .25], [.5, .75]]);
  }

  titulo('Preencher centralizado:');
  let q = await recorteQuadro({});
  let f = await recorteFolhas({});
  ok(vermelho(q[0]) && azul(q[1]), 'no Quadro o ponto a 25% é vermelho e o de 75% é azul (' + JSON.stringify(q) + ')');
  ok(vermelho(f[0]) && azul(f[1]), 'nas Folhas o recorte é o mesmo (' + JSON.stringify(f) + ')');
  await p2.screenshot({ path: SAIDA + '03-recorte-centralizado.png' });

  titulo('Zoom e posição:');
  q = await recorteQuadro({ z: 200, px: .5, py: 0 });
  f = await recorteFolhas({ z: 200, px: .5, py: 0 });
  ok(vermelho(q[0]) && vermelho(q[1]), 'com zoom 200% e posição 0,5 os dois pontos são vermelhos no Quadro (' + JSON.stringify(q) + ')');
  ok(vermelho(f[0]) && vermelho(f[1]), 'com zoom 200% e posição 0,5 os dois pontos são vermelhos nas Folhas (' + JSON.stringify(f) + ')');

  titulo('Espelhar:');
  q = await recorteQuadro({ flip: true });
  f = await recorteFolhas({ flip: true });
  ok(azul(q[0]) && vermelho(q[1]), 'espelhada, a foto troca os lados no Quadro (' + JSON.stringify(q) + ')');
  ok(azul(f[0]) && vermelho(f[1]), 'espelhada, a foto troca os lados nas Folhas (' + JSON.stringify(f) + ')');

  titulo('Girar 90°:');
  q = await recorteQuadro({ rot: 90 });
  f = await recorteFolhas({ rot: 90 });
  ok(vermelho(q[2]) && azul(q[3]), 'girada 90°, o alto é vermelho e a base azul no Quadro (' + JSON.stringify(q) + ')');
  ok(vermelho(f[2]) && azul(f[3]), 'girada 90°, o alto é vermelho e a base azul nas Folhas (' + JSON.stringify(f) + ')');

  titulo('Filtro P&B:');
  q = await recorteQuadro({ flt: { id: 'pb', int: 100 } });
  f = await recorteFolhas({ flt: { id: 'pb', int: 100 } });
  ok(cinza(q[0]) && cinza(q[1]), 'no Quadro o filtro P&B deixa os pixels cinza (' + JSON.stringify(q) + ')');
  ok(cinza(f[0]) && cinza(f[1]), 'nas Folhas o filtro P&B deixa os pixels cinza (' + JSON.stringify(f) + ')');
  await p2.screenshot({ path: SAIDA + '04-recorte-pb.png' });

  titulo('Folhas: mesa, aba Fotos e filtro:');
  await p2.goto(srv.url + 'app/editor/');
  await p2.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 2);
  await p2.waitForFunction(() => { const i = document.querySelector('#sheet .pol__ph img'); return i && i.naturalWidth > 0; }, null, { timeout: 15000 });
  const mesa = await p2.evaluate(() => ({ pols: document.querySelectorAll('#sheet .pol').length, imgs: document.querySelectorAll('#sheet .pol__ph img').length, svgs: document.querySelectorAll('#sheet .pol__ph svg').length }));
  ok(mesa.imgs === 2 && mesa.svgs === 0, 'cada polaroid da mesa mostra a foto (' + mesa.imgs + ' com img, ' + mesa.svgs + ' com svg)');
  await p2.screenshot({ path: SAIDA + '05-folhas-mesa.png' });
  await p2.click('#tab-fotos');
  await p2.waitForTimeout(900);
  const aba = await p2.evaluate(() => ({ minis: document.querySelectorAll('.foto-mini').length, imgs: document.querySelectorAll('.foto-mini img').length, rotulos: [].map.call(document.querySelectorAll('.foto-mini small'), e => e.textContent) }));
  ok(aba.imgs === aba.minis && aba.minis === 2, 'a aba Fotos mostra a miniatura de cada foto (' + aba.imgs + '/' + aba.minis + ')');
  ok(aba.rotulos.join() === 'Foto 1,Foto 2', 'o rótulo «Foto N» continua (' + aba.rotulos.join(', ') + ')');
  await p2.screenshot({ path: SAIDA + '06-folhas-aba-fotos.png' });

  titulo('Folhas: o brilho da aba Ajustes chega à mesa:');
  await p2.click('#tab-ajustes');
  await p2.waitForSelector('#ef-brilho');
  const antesBrilho = (await pixels(p2, '#sheet .pol__ph', [[.25, .5]]))[0];
  await p2.fill('#ef-brilho', '60');
  await p2.dispatchEvent('#ef-brilho', 'change');
  await p2.waitForTimeout(900);
  const depoisBrilho = (await pixels(p2, '#sheet .pol__ph', [[.25, .5]]))[0];
  ok(depoisBrilho[0] > antesBrilho[0] + 20, 'o brilho muda o pixel lido (' + antesBrilho[0] + ' → ' + depoisBrilho[0] + ')');
  const filtroFolhas = await p2.evaluate(() => ({ defs: document.querySelectorAll('#sheet svg filter').length, filtro: !!document.querySelector('#sheet [style*="url(#pf-"]') }));
  ok(filtroFolhas.defs >= 1 && filtroFolhas.filtro, 'o filtro da foto ajustada entra na folha (' + filtroFolhas.defs + ' filtro(s))');

  titulo('Foto ausente: o ícone neutro, sem erro:');
  const ausente = await p2.evaluate(async () => {
    const q = JSON.parse(sessionStorage.getItem('pl-quadro') || 'null');
    q[1].src = 399;                                  /* src que não existe na loja de fotos */
    sessionStorage.setItem('pl-quadro', JSON.stringify(q));
    return true;
  });
  ok(!!ausente, 'estado preparado');
  await p2.goto(srv.url + 'app/editor/');
  await p2.reload();
  await p2.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 2);
  await p2.waitForTimeout(1800);
  const semFoto = await p2.evaluate(() => ({ svgs: document.querySelectorAll('#sheet .pol__ph svg').length, imgs: document.querySelectorAll('#sheet .pol__ph img').length }));
  ok(semFoto.svgs >= 1, 'a foto que não existe mostra o ícone neutro (' + semFoto.svgs + ' ícones, ' + semFoto.imgs + ' fotos)');
  ok(semFoto.imgs >= 1, 'as outras fotos continuam aparecendo');
  await ctx2.close();

  /* ============ 200 fotos: o editor continua respondendo ============ */
  const ctx3 = await ctxNovo(), p3 = await ctx3.newPage();
  p3.on('pageerror', e => errosPg.push(String(e)));
  p3.setDefaultTimeout(60000);
  await criar(p3, 'Lote 200', 200, { w: 800, h: 600, q: .7, bicolor: false });
  await p3.goto(srv.url + 'app/editor/quadro/#foto-1');
  await p3.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  const t0 = Date.now();
  await p3.waitForFunction(() => { const i = document.querySelector('#clip img'); return i && i.naturalWidth > 0; }, null, { timeout: 20000 });
  const dt = Date.now() - t0;
  ok(dt < 3000, 'a janela carrega em até 3 s com 200 fotos (' + dt + ' ms)');
  const quadroLento = await p3.evaluate(() => new Promise(res => {
    let maior = 0, ultimo = performance.now();
    function passo(t) { maior = Math.max(maior, t - ultimo); ultimo = t; if (t - t0 < 2000) requestAnimationFrame(passo); else res(maior); }
    const t0 = performance.now(); requestAnimationFrame(passo);
  }));
  ok(quadroLento < 300, 'o maior intervalo entre quadros é menor que 300 ms (' + Math.round(quadroLento) + ' ms)');
  const tamMini = await p3.evaluate(() => {
    const i = document.querySelector('#faixa .tq img');
    return i ? { w: i.naturalWidth, h: i.naturalHeight } : null;
  });
  ok(tamMini && Math.max(tamMini.w, tamMini.h) <= 512, 'as miniaturas são reduzidas (' + (tamMini ? tamMini.w + ' × ' + tamMini.h : 'sem imagem') + ')');
  await p3.screenshot({ path: SAIDA + '07-quadro-200.png' });
  const t1 = Date.now();
  await p3.goto(srv.url + 'app/editor/quadro/#foto-150');
  await p3.reload();
  await p3.waitForFunction(() => window.PLQ && PLQ.cur() === 150, null, { timeout: 20000 });
  await p3.waitForFunction(() => { const i = document.querySelector('#clip img'); return i && i.naturalWidth > 0; }, null, { timeout: 20000 });
  ok(Date.now() - t1 < 3000, 'a foto 150 aparece em até 3 s, sem esperar as outras (' + (Date.now() - t1) + ' ms)');
  await p3.screenshot({ path: SAIDA + '08-quadro-200-foto150.png' });
  const t2 = Date.now();
  await p3.goto(srv.url + 'app/editor/');
  await p3.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0);
  await p3.waitForFunction(() => { const l = document.querySelectorAll('#sheet .pol__ph img').length, t = document.querySelectorAll('#sheet .pol__ph').length; return t > 0 && l >= t; }, null, { timeout: 25000 });
  ok(Date.now() - t2 < 5000, 'as Folhas mostram as fotos da folha visível em até 5 s (' + (Date.now() - t2) + ' ms)');
  await p3.screenshot({ path: SAIDA + '09-folhas-200.png' });
  await ctx3.close();

  /* ============ o exemplo continua igual ============ */
  titulo('Exemplo: a cena de exemplo e o ícone, sem object URLs:');
  const ctx4 = await ctxNovo(), p4 = await ctx4.newPage();
  p4.on('pageerror', e => errosPg.push(String(e)));
  p4.setDefaultTimeout(30000);
  await p4.goto(srv.url + 'app/editor/quadro/');
  await p4.waitForFunction(() => !!window.PLQ && !!window.PLFOTOTELA);
  await p4.waitForTimeout(800);
  const demo = await p4.evaluate(() => ({ svg: document.querySelectorAll('#clip svg').length, imgs: document.querySelectorAll('img[src^="blob:"]').length, ativos: PLFOTOTELA.ativos() }));
  ok(demo.svg > 0 && demo.imgs === 0, 'no exemplo a janela mostra a cena de exemplo e nenhuma foto real');
  ok(demo.ativos.cheias === 0 && demo.ativos.minis === 0, 'no exemplo nenhum object URL de foto é criado');
  await p4.goto(srv.url + 'app/editor/');
  await p4.waitForFunction(() => document.querySelectorAll('#sheet .pol').length >= 1);
  await p4.waitForTimeout(800);
  const demoF = await p4.evaluate(() => ({
    fotos: (window.PLEDITOR && PLEDITOR.ctx ? PLEDITOR.ctx().FOTOS.length : 0),
    icones: document.querySelectorAll('.pol__ph svg').length,
    imgs: document.querySelectorAll('img[src^="blob:"]').length
  }));
  ok(demoF.fotos === 24, 'no exemplo o projeto tem 24 fotos (' + demoF.fotos + ')');
  ok(demoF.icones > 0 && demoF.imgs === 0, 'no exemplo as polaroids mostram o ícone e nenhuma foto real (' + demoF.icones + ' ícones)');
  await p4.screenshot({ path: SAIDA + '10-exemplo-folhas.png' });
  await ctx4.close();

  ok(errosPg.length === 0, 'nenhum erro de página' + (errosPg.length ? ': ' + errosPg[0] : ''));
} catch (e) { ok(false, 'exceção: ' + (e.stack || e)); }
finally { await nav.close(); srv.fechar(); }
console.log(falhas.length ? `\n✘ Fotos na tela: ${falhas.length} falha(s)` : '\n✔ Fotos na tela: sem falhas');
process.exit(falhas.length ? 1 : 0);
