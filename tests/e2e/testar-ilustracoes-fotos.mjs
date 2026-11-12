#!/usr/bin/env node
/* Ilustrações com fotos reais (openspec «ilustracoes-com-fotos» · spec ilustracoes-com-fotos):
   as polaroids animadas da mesa (tela de entrar e apresentação), a foto que sai da câmera do
   hero, as polaroids pousadas e o banner da faixa preta mostram fotografias de
   site/assets/img/fotos/; a mesa tem fundo de mesa.jpg com um véu claro; a página Legal tem o
   link «Créditos das imagens». Tudo do próprio site (T6), sem erro de página, e com movimento
   reduzido as polaroids já ficam na posição final com as fotos.
   Uso: node tests/e2e/testar-ilustracoes-fotos.mjs  (Chromium do Playwright) */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from '../helpers/servidor.mjs';

const falhas = [], ok = m => console.log('  ✔ ' + m), ruim = m => { falhas.push(m); console.log('  ✘ ' + m); };
const saida = fileURLToPath(new URL('../saida/ilustracoes-fotos/', import.meta.url));
await mkdir(saida, { recursive: true });

const CENAS = {                                   // cena da mesa → foto real (CC0, D-191; sem aniversário)
  'mesa-cena-praia': 'amigos-praia.jpg',
  'mesa-cena-montanha': 'amigos-trilha.jpg',
  'mesa-cena-cidade': 'casal-cidade.jpg',
  'mesa-cena-sol': 'casal-por-do-sol.jpg',
  'mesa-cena-fogueira': 'amigos-acampamento.jpg',
  'mesa-cena-viagem': 'amigos-estrada.jpg',
  'mesa-cena-noite': 'casal-noite.jpg'
};
const TELAS = [{ rota: 'app/entrar/', nome: 'entrar' }, { rota: '', nome: 'apresentacao' }];
const TAMANHOS = [[1440, 900], [390, 844]];

const srv = await servir();
const nav = await chromium.launch();

/* Foto viva: toda <image>/<img> que aponta para assets/img/fotos/ tem que ter sido pedida ao
   servidor e respondida com 200 (nenhuma requisição falha). As <image> do SVG são carregadas
   pelo próprio desenho (mesmo dentro de <defs>, quando o <use> as chama); os <img> só são
   exigidos quando estão visíveis (no celular as polaroids do hero ficam escondidas). */
const fotosDoSite = page => page.evaluate(() => {
  const vis = el => {
    const b = el.getBoundingClientRect();
    return b.width > 0 && b.height > 0 && getComputedStyle(el).display !== 'none';
  };
  const itens = [];
  document.querySelectorAll('image').forEach(el => {
    const h = el.getAttribute('href') || '';
    if (h.indexOf('assets/img/fotos/') < 0) return;
    itens.push({ url: new URL(h, location.href).href, tipo: 'svg' });
  });
  document.querySelectorAll('img').forEach(el => {
    const s = el.getAttribute('src') || '';
    if (s.indexOf('assets/img/fotos/') < 0) return;
    itens.push({ url: new URL(s, location.href).href, tipo: 'img', vis: vis(el), carregada: el.complete && el.naturalWidth > 0 });
  });
  return itens;
});

try {
  /* ---- 1 · fotos nas polaroids e nas fotos da câmera, em 1440×900 e 390×844 ---- */
  for (const t of TELAS) {
    for (const [w, h] of TAMANHOS) {
      const ctx = await nav.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      const erros = [], quebradas = [], respostas = new Map(), comErro = [];
      page.on('pageerror', e => erros.push('erro: ' + e.message));
      page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text().slice(0, 160)); });
      page.on('requestfailed', r => quebradas.push(r.url()));
      page.on('response', r => { respostas.set(r.url(), r.status()); if (r.status() >= 400) comErro.push(r.status() + ' ' + r.url()); });
      await page.goto(srv.url + t.rota, { waitUntil: 'networkidle' });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1600);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);

      const rot = `${t.nome} ${w}×${h}`;
      const r = await page.evaluate(cenas => {
        const conta = {};
        for (const id of Object.keys(cenas)) {
          const g = document.getElementById(id);
          const ims = g ? [...g.querySelectorAll('image')] : [];
          conta[id] = ims.map(i => i.getAttribute('href') || '');
          /* D-143: quando a foto de pessoas do slot existe, o PLMIDIA troca a de reserva por ela */
          const slot = ims[0] && ims[0].getAttribute('data-midia-foto');
          if (slot && (window.PLMIDIA_ARQUIVOS || []).indexOf('img/fotos/' + slot + '.jpg') >= 0) cenas[id] = slot + '.jpg';
        }
        const cam = document.getElementById('cam-foto') || document.getElementById('mesa-cam-foto');
        const cenaCam = cam ? cam.querySelector('use') : null;
        const cenaCamId = cenaCam ? (cenaCam.getAttribute('href') || '').slice(1) : '';
        const cenaCamEl = cenaCamId ? document.getElementById(cenaCamId) : null;
        return {
          conta, certas: cenas,
          camTemFoto: !!(cenaCamEl && cenaCamEl.querySelector('image')),
          camHref: cenaCamEl && cenaCamEl.querySelector('image') ? cenaCamEl.querySelector('image').getAttribute('href') : '',
          h1: document.querySelectorAll('h1').length,
          leds: document.querySelectorAll('.led-btn').length
        };
      }, CENAS);

      const erradas = Object.keys(CENAS).filter(id => r.conta[id].length !== 1 || r.conta[id][0].indexOf('assets/img/fotos/') < 0);
      erradas.length === 0
        ? ok(`${rot}: as sete cenas da mesa são fotos de assets/img/fotos/`)
        : ruim(`${rot}: cenas sem foto ou com mais de uma imagem (${erradas.join(', ')})`);
      const fora = Object.keys(CENAS).filter(id => r.conta[id][0] && r.conta[id][0].indexOf('assets/img/fotos/' + r.certas[id]) < 0);
      fora.length === 0
        ? ok(`${rot}: cada cena aponta para a foto certa`)
        : ruim(`${rot}: foto errada em ${fora.join(', ')}`);
      const semFoto = Object.keys(CENAS).filter(id => !r.conta[id][0] || respostas.get(new URL(r.conta[id][0], srv.url + t.rota).href) !== 200);
      semFoto.length === 0
        ? ok(`${rot}: as sete fotos da mesa foram pedidas e responderam 200`)
        : ruim(`${rot}: fotos da mesa sem 200 (${semFoto.join(', ')})`);

      const itens = await fotosDoSite(page);
      const esperadas = itens.filter(i => i.tipo === 'svg' || i.vis);
      const semResposta = esperadas.filter(i => respostas.get(i.url) !== 200);
      semResposta.length === 0
        ? ok(`${rot}: as ${esperadas.length} fotos da página carregaram com 200`)
        : ruim(`${rot}: ${semResposta.length} foto(s) sem 200 (${semResposta[0].url})`);
      const semDecodificar = esperadas.filter(i => i.tipo === 'img' && i.vis && !i.carregada);
      semDecodificar.length === 0
        ? ok(`${rot}: as fotos em <img> estão decodificadas`)
        : ruim(`${rot}: ${semDecodificar.length} <img> sem imagem decodificada (${semDecodificar[0].url})`);
      quebradas.length === 0 ? ok(`${rot}: nenhuma requisição falhou`) : ruim(`${rot}: requisição falhou → ${quebradas[0]}`);
      comErro.length === 0 ? ok(`${rot}: nenhuma resposta deu erro`) : ruim(`${rot}: resposta com erro → ${comErro[0]}`);
      erros.length === 0 ? ok(`${rot}: página sem erro`) : ruim(`${rot}: ${erros[0]}`);
      r.h1 === 1 ? ok(`${rot}: um único <h1>`) : ruim(`${rot}: ${r.h1} <h1>`);
      r.leds === 1 ? ok(`${rot}: um único botão LED (T8)`) : ruim(`${rot}: ${r.leds} botões LED`);

      if (t.nome === 'apresentacao') {
        r.camTemFoto ? ok(`${rot}: a foto que sai da câmera é uma foto real`) : ruim(`${rot}: a foto da câmera não é uma foto real`);
        r.camHref.indexOf('assets/img/fotos/') >= 0 ? ok(`${rot}: a foto da câmera vem de assets/img/fotos/ (${r.camHref})`) : ruim(`${rot}: a foto da câmera não vem de assets/img/fotos/ (${r.camHref})`);
        const hero = await page.evaluate(() => [...document.querySelectorAll('.hero__pol')].map(f => ({
          tag: f.tagName,
          src: f.querySelector('img') ? f.querySelector('img').getAttribute('src') : null,
          w: f.querySelector('img') ? f.querySelector('img').naturalWidth : 0
        })));
        hero.length === 2 && hero.every(p => p.tag === 'FIGURE' && p.src && p.src.indexOf('assets/img/fotos/') >= 0)
          ? ok(`${rot}: as duas polaroids pousadas são molduras com foto (${hero.map(p => p.src.split('/').pop()).join(', ')})`)
          : ruim(`${rot}: as polaroids pousadas não viraram molduras com foto (${JSON.stringify(hero)})`);
        const banner = await page.evaluate(() => {
          const svg = document.querySelector('.faixa__img--svg');
          if (!svg) return { svg: false, cenas: [] };
          const cenas = [...svg.querySelectorAll('g[id^="bimp-cena-"]')].map(g => {
            const im = g.querySelector('image');
            return { id: g.id, href: im ? im.getAttribute('href') : null };
          });
          return { svg: true, cenas };
        });
        banner.svg ? ok(`${rot}: o banner da faixa preta está embutido`) : ruim(`${rot}: o banner da faixa preta não está embutido`);
        banner.cenas.length === 3 && banner.cenas.every(c => c.href && c.href.indexOf('assets/img/fotos/') >= 0)
          ? ok(`${rot}: as polaroids do banner mostram fotos reais`)
          : ruim(`${rot}: as polaroids do banner não mostram fotos (${JSON.stringify(banner.cenas)})`);
      }
      await page.screenshot({ path: join(saida, `${t.nome}-${w}.png`), fullPage: true });
      await ctx.close();
    }
  }

  /* ---- 2 · o fundo da mesa: mesa.jpg atrás das polaroids, com véu claro ---- */
  for (const t of TELAS) {
    const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(srv.url + t.rota, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const f = await page.evaluate(() => {
      const svg = document.querySelector('svg.mesa');
      if (!svg) return { mesa: false };
      const filhos = [...svg.children];
      const fundo = [...svg.querySelectorAll('image')].filter(i => (i.getAttribute('href') || '').indexOf('mesa.jpg') >= 0)[0];
      const pols = [...svg.querySelectorAll('#mesa-p1,#mesa-p2,#mesa-p3,#mesa-p4,#mesa-p5,#mesa-p6,#mesa-p7')];
      const veu = [...svg.children].find(e => e.tagName.toLowerCase() === 'rect' && (e.getAttribute('fill') || '').toLowerCase() === '#ffffff' && parseFloat(e.getAttribute('fill-opacity') || '0') > 0);
      return {
        mesa: true,
        fundo: fundo ? fundo.getAttribute('href') : null,
        atras: fundo ? filhos.indexOf(fundo) < filhos.indexOf(pols[0]) : false,
        veu: veu ? parseFloat(veu.getAttribute('fill-opacity')) : 0,
        fotos: [...svg.querySelectorAll('image')].filter(i => (i.getAttribute('href') || '').indexOf('assets/img/fotos/') >= 0).length
      };
    });
    const rot = t.nome;
    f.mesa ? ok(`${rot}: a mesa está na tela`) : ruim(`${rot}: a mesa não apareceu`);
    f.fundo ? ok(`${rot}: a mesa usa a foto ${f.fundo.split('/').pop()} como fundo`) : ruim(`${rot}: a mesa não tem a foto de fundo`);
    f.atras ? ok(`${rot}: o fundo da mesa fica atrás das polaroids`) : ruim(`${rot}: o fundo da mesa não fica atrás das polaroids`);
    f.veu > 0 ? ok(`${rot}: há um véu claro sobre o fundo (${f.veu})`) : ruim(`${rot}: falta o véu claro sobre o fundo da mesa`);
    await ctx.close();
  }

  /* ---- 3 · movimento reduzido: as polaroids já na posição final, com as fotos ---- */
  for (const t of TELAS) {
    const ctx = await nav.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const respostas = new Map();
    page.on('response', r => { if (r.status() >= 400) respostas.set(r.url(), r.status()); });
    await page.goto(srv.url + t.rota, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const q = await page.evaluate(() => {
      const ps = [...document.querySelectorAll('#mesa-p1,#mesa-p2,#mesa-p3,#mesa-p4,#mesa-p5,#mesa-p6,#mesa-p7')];
      const cam = document.getElementById('cam-foto') || document.getElementById('mesa-cam-foto');
      return {
        animacoes: ps.map(p => getComputedStyle(p).animationName),
        opacidades: ps.map(p => getComputedStyle(p).opacity),
        camOp: cam ? getComputedStyle(cam).opacity : null,
        fotos: [...document.querySelectorAll('svg.mesa image')].length
      };
    });
    const rot = t.nome;
    q.animacoes.every(a => a === 'none') ? ok(`${rot} movimento reduzido: as polaroids não animam`) : ruim(`${rot} movimento reduzido: ${q.animacoes.join(', ')}`);
    q.opacidades.every(o => o === '1') ? ok(`${rot} movimento reduzido: as polaroids aparecem inteiras`) : ruim(`${rot} movimento reduzido: opacidade ${q.opacidades.join(', ')}`);
    q.camOp === '1' ? ok(`${rot} movimento reduzido: a foto da câmera aparece inteira`) : ruim(`${rot} movimento reduzido: a foto da câmera está com opacidade ${q.camOp}`);
    q.fotos > 0 ? ok(`${rot} movimento reduzido: as fotos continuam na mesa (${q.fotos})`) : ruim(`${rot} movimento reduzido: a mesa ficou sem fotos`);
    respostas.size === 0 ? ok(`${rot} movimento reduzido: nenhuma foto deu erro`) : ruim(`${rot} movimento reduzido: foto com erro (${[...respostas.keys()][0]})`);
    await ctx.close();
  }

  /* ---- 4 · Legal: o link «Créditos das imagens» leva a um arquivo que responde 200 ---- */
  {
    const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    await page.goto(srv.url + 'legal/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const l = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a')].filter(x => x.textContent.trim() === 'Créditos das imagens')[0];
      const h2 = [...document.querySelectorAll('h2')].filter(x => x.textContent.trim() === 'Créditos das imagens')[0];
      return { link: a ? a.getAttribute('href') : null, titulo: !!h2 };
    });
    l.titulo ? ok('legal: existe a seção «Créditos das imagens»') : ruim('legal: falta a seção «Créditos das imagens»');
    l.link ? ok(`legal: o link «Créditos das imagens» aponta para ${l.link}`) : ruim('legal: falta o link «Créditos das imagens»');
    if (l.link) {
      const alvo = new URL(l.link, srv.url + 'legal/').href;
      const resp = await page.request.get(alvo);
      resp.status() === 200 ? ok(`legal: o arquivo de créditos responde 200 (${alvo.split('/').pop()})`) : ruim(`legal: o arquivo de créditos respondeu ${resp.status()}`);
    }
    erros.length === 0 ? ok('legal: página sem erro') : ruim('legal: ' + erros[0]);
    await page.locator('.creditos').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(saida, 'legal-creditos.png') });
    await ctx.close();
  }
} catch (e) {
  ruim('exceção: ' + (e.stack || e));
} finally {
  await nav.close();
  srv.fechar();
}

console.log(falhas.length ? `\n✘ ${falhas.length} falha(s)` : '\n✔ Ilustrações com fotos: sem falhas');
process.exit(falhas.length ? 1 : 0);
