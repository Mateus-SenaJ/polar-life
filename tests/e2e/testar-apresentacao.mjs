#!/usr/bin/env node
/* T-28 e T-29 · Apresentação e Como funciona (openspec «apresentacao-animada» · spec apresentacao):
   páginas ilustradas na ordem do brief §5.2 e §5.3, um <h1> e um botão LED por tela, sem rolagem
   lateral, movimento A1–A6 (mesa, câmera, revelação, parallax) com `prefers-reduced-motion` e sem
   JavaScript. Capturas em tests/saida/apresentacao/.
   Uso: node tests/e2e/testar-apresentacao.mjs  (Chromium do Playwright) */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from '../helpers/servidor.mjs';

const falhas = [], ok = m => console.log('  ✔ ' + m), ruim = m => { falhas.push(m); console.log('  ✘ ' + m); };
const saida = fileURLToPath(new URL('../saida/apresentacao/', import.meta.url));
await mkdir(saida, { recursive: true });

const vigiar = p => {
  const v = [];
  p.on('pageerror', e => v.push('erro: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') v.push('console: ' + m.text().slice(0, 160)); });
  return v;
};
const TELAS = [
  { rota: '', nome: 'apresentacao', cam: true, mesa: true, rolo: false },
  { rota: 'como-funciona/', nome: 'como-funciona', cam: true, mesa: false, rolo: true }
];

const srv = await servir();
const nav = await chromium.launch();
try {
  /* ---- A · as duas páginas em 1440×900 e 390×844 ---- */
  for (const t of TELAS) {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const c = await nav.newContext({ viewport: { width: w, height: h } });
      const p = await c.newPage();
      const erros = vigiar(p), fora = [];
      p.on('request', r => { if (!r.url().startsWith(srv.url)) fora.push(r.url()); });
      await p.goto(srv.url + t.rota, { waitUntil: 'networkidle' });
      await p.waitForTimeout(700);
      const r = await p.evaluate(() => {
        const leds = [...document.querySelectorAll('.led-btn')];
        const visiveis = leds.filter(el => {
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false;
          const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0;
        });
        const faixa = document.querySelector('.faixa');
        const cam = document.querySelector('.cam-svg');
        const mesa = document.querySelector('.mesa');
        const rolo = document.querySelector('.intro__rolo img');
        return {
          h1: document.querySelectorAll('h1').length,
          leds: leds.length, ledsVisiveis: visiveis.length,
          rolagem: document.documentElement.scrollWidth - window.innerWidth,
          fundoFaixa: faixa ? getComputedStyle(faixa).backgroundColor : '',
          faixaTemLink: !!faixa && (!!faixa.querySelector('.faixa__link') || !!faixa.querySelector('.faixa__cta .led-btn')),
          cam: !!cam, camLargura: cam ? Math.round(cam.getBoundingClientRect().width) : 0,
          mesa: !!mesa, mesaLargura: mesa ? Math.round(mesa.getBoundingClientRect().width) : 0,
          rolo: !!rolo,
          fatos: document.querySelectorAll('.fato').length,
          passos: document.querySelectorAll('.step').length,
          passosComArte: document.querySelectorAll('.step__arte').length,
          ledNoHero: !!document.querySelector('.hero__cta .led-btn'),
          ledNaFaixa: !!document.querySelector('.faixa__cta .led-btn'),
          titulo: (document.querySelector('h1') || {}).textContent || ''
        };
      });
      const rot = `${t.nome} ${w}×${h}`;
      r.h1 === 1 ? ok(`${rot}: exatamente um <h1> («${r.titulo.trim().slice(0, 40)}»)`) : ruim(`${rot}: ${r.h1} <h1>`);
      r.leds === 1 && r.ledsVisiveis === 1 ? ok(`${rot}: um único botão LED na tela (T8)`) : ruim(`${rot}: ${r.leds} botões LED (${r.ledsVisiveis} visíveis)`);
      r.rolagem <= 0 ? ok(`${rot}: sem rolagem lateral`) : ruim(`${rot}: rolagem lateral de ${r.rolagem} px`);
      r.fundoFaixa === 'rgb(0, 0, 0)' ? ok(`${rot}: a faixa preta está na tela`) : ruim(`${rot}: a faixa preta não apareceu (${r.fundoFaixa})`);
      r.faixaTemLink ? ok(`${rot}: a faixa tem o link terciário`) : ruim(`${rot}: a faixa está sem link`);
      r.cam ? ok(`${rot}: a câmera instantânea está na tela`) : ruim(`${rot}: a câmera não apareceu`);
      t.mesa
        ? (r.mesa ? ok(`${rot}: a mesa de polaroids está na tela`) : ruim(`${rot}: a mesa não apareceu`))
        : (r.mesa ? ruim(`${rot}: a mesa não devia aparecer nesta tela`) : ok(`${rot}: a mesa fica só na apresentação`));
      t.rolo ? (r.rolo ? ok(`${rot}: o rolo de filme está na introdução`) : ruim(`${rot}: o rolo de filme não apareceu`)) : null;
      t.mesa ? (r.fatos === 3 ? ok(`${rot}: os três fatos em colunas`) : ruim(`${rot}: ${r.fatos} fatos`)) : null;
      !t.mesa ? (r.passos === 4 && r.passosComArte === 4 ? ok(`${rot}: os quatro passos com uma ilustração cada`) : ruim(`${rot}: ${r.passos} passos (${r.passosComArte} com ilustração)`)) : null;
      r.ledNoHero || r.ledNaFaixa ? ok(`${rot}: o LED está no lugar do brief`) : ruim(`${rot}: o LED não está nem no hero nem na faixa`);
      erros.length === 0 ? ok(`${rot}: página sem erro`) : ruim(`${rot}: ${erros[0]}`);
      fora.length === 0 ? ok(`${rot}: nenhum recurso externo (T6)`) : ruim(`${rot}: recurso externo → ${fora[0]}`);

      /* a página inteira, depois de percorrer tudo (as animações de rolagem já chegaram ao fim) */
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await p.waitForTimeout(1200);
      await p.screenshot({ path: join(saida, `${t.nome}-${w}.png`), fullPage: true });
      await c.close();
    }
  }

  /* ---- B · funciona sem JavaScript: tudo visível e na posição final ---- */
  for (const t of TELAS) {
    const c = await nav.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const p = await c.newPage();
    await p.goto(srv.url + t.rota, { waitUntil: 'load' });
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const mesa = [...document.querySelectorAll('[id^="mesa-p"]')].filter(e => /^mesa-p[1-7]$/.test(e.id));
      const cam = document.getElementById('cam-foto');
      return {
        h1: (document.querySelector('h1') || {}).textContent || '',
        h1Visivel: (document.querySelector('h1') || {}).offsetParent !== null,
        led: document.querySelectorAll('.led-btn').length,
        ledVisivel: !!document.querySelector('.led-btn') && document.querySelector('.led-btn').getBoundingClientRect().height > 0,
        texto: (document.querySelector('.hero__lead') || document.querySelector('.page-lead') || {}).textContent || '',
        mesa: mesa.map(e => +getComputedStyle(e).opacity),
        cam: cam ? +getComputedStyle(cam).opacity : null,
        mov: document.documentElement.className
      };
    });
    r.h1Visivel && r.h1.trim().length > 10 ? ok(`${t.nome} sem JavaScript: o <h1> aparece`) : ruim(`${t.nome} sem JavaScript: o <h1> não aparece`);
    r.led === 1 && r.ledVisivel ? ok(`${t.nome} sem JavaScript: o botão principal aparece`) : ruim(`${t.nome} sem JavaScript: o botão principal sumiu`);
    r.texto.trim().length > 20 ? ok(`${t.nome} sem JavaScript: os textos aparecem`) : ruim(`${t.nome} sem JavaScript: os textos sumiram`);
    /mov-js/.test(r.mov) ? ruim(`${t.nome} sem JavaScript: a marca de movimento ficou no <html>`) : ok(`${t.nome} sem JavaScript: nada fica escondido por CSS`);
    if (t.mesa) {
      r.mesa.length === 7 && r.mesa.every(o => o === 1)
        ? ok(`${t.nome} sem JavaScript: as sete polaroids da mesa já aparecem`) : ruim(`${t.nome} sem JavaScript: mesa com opacidade ${r.mesa.join(',')}`);
      r.cam === 1 ? ok(`${t.nome} sem JavaScript: a foto da câmera aparece`) : ruim(`${t.nome} sem JavaScript: a foto da câmera está com opacidade ${r.cam}`);
    }
    await p.screenshot({ path: join(saida, `${t.nome}-sem-javascript.png`), fullPage: true });
    await c.close();
  }

  /* ---- C · movimento reduzido: estado final, nada anima (brief §5.4) ---- */
  for (const t of TELAS) {
    const c = await nav.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const p = await c.newPage();
    await p.goto(srv.url + t.rota, { waitUntil: 'networkidle' });
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const mesa = [...document.querySelectorAll('[id^="mesa-p"]')].filter(e => /^mesa-p[1-7]$/.test(e.id));
      const cam = document.getElementById('cam-foto');
      const animaNome = [...document.querySelectorAll('*')].filter(e => {
        const n = getComputedStyle(e).animationName; return n && n !== 'none';
      }).length;
      return {
        anims: document.getAnimations().length,
        animaNome,
        marcas: document.querySelectorAll('.is-in,.is-out,.is-dev').length,
        mesa: mesa.map(e => +getComputedStyle(e).opacity),
        cam: cam ? +getComputedStyle(cam).opacity : null
      };
    });
    r.anims === 0 ? ok(`${t.nome} movimento reduzido: nenhuma animação ativa`) : ruim(`${t.nome} movimento reduzido: ${r.anims} animações ativas`);
    r.animaNome === 0 ? ok(`${t.nome} movimento reduzido: nenhum elemento com animação`) : ruim(`${t.nome} movimento reduzido: ${r.animaNome} elementos animando`);
    r.marcas === 0 ? ok(`${t.nome} movimento reduzido: nenhuma classe de cena é aplicada`) : ruim(`${t.nome} movimento reduzido: ${r.marcas} classes aplicadas`);
    if (t.mesa) {
      r.mesa.length === 7 && r.mesa.every(o => o === 1)
        ? ok(`${t.nome} movimento reduzido: as sete polaroids da mesa na posição final`) : ruim(`${t.nome} movimento reduzido: mesa com opacidade ${r.mesa.join(',')}`);
      r.cam === 1 ? ok(`${t.nome} movimento reduzido: a foto da câmera na posição final`) : ruim(`${t.nome} movimento reduzido: a foto da câmera está com opacidade ${r.cam}`);
    }
    await p.screenshot({ path: join(saida, `${t.nome}-movimento-reduzido.png`), fullPage: true });
    await c.close();
  }

  /* ---- D · A1: as polaroids da mesa pousam quando a mesa entra na tela ---- */
  {
    const c = await nav.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    await p.goto(srv.url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    const antes = await p.evaluate(() => [...document.querySelectorAll('#mesa-p1,#mesa-p3,#mesa-p5,#mesa-p7')].map(e => +getComputedStyle(e).opacity));
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(1200);
    const depois = await p.evaluate(() => [...document.querySelectorAll('#mesa-p1,#mesa-p3,#mesa-p5,#mesa-p7')].map(e => +getComputedStyle(e).opacity));
    antes.every(o => o < 1) ? ok('A1: no topo, as polaroids da mesa ainda não apareceram') : ruim(`A1: a mesa já aparecia no topo (${antes.join(',')})`);
    depois.every(o => o === 1) ? ok('A1: ao rolar, as polaroids da mesa pousaram') : ruim(`A1: a mesa não pousou (${depois.join(',')})`);
    await c.close();
  }

  /* ---- E · A2: a câmera solta a polaroid uma vez por carregamento ---- */
  {
    const c = await nav.newContext({ viewport: { width: 1440, height: 900 } });
    /* a câmera desenhada é a reserva do vídeo do hero (D-140): com os arquivos reais ela fica escondida; aqui vale o estado sem os arquivos */
    await c.route('**/assets/js/ui/midia-arquivos.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.PLMIDIA_ARQUIVOS=[];' }));
    const p = await c.newPage();
    await p.goto(srv.url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    const durante = await p.evaluate(() => {
      const f = document.getElementById('cam-foto');
      return { classe: document.querySelector('.cam').className, translate: getComputedStyle(f).translate };
    });
    await p.waitForTimeout(2200);
    const depois = await p.evaluate(() => {
      const f = document.getElementById('cam-foto');
      return {
        classe: document.querySelector('.cam').className,
        translate: getComputedStyle(f).translate,
        estados: f.getAnimations().map(a => a.playState)
      };
    });
    /is-out/.test(durante.classe) || /is-out/.test(depois.classe)
      ? ok('A2: a câmera recebe a marca de cena (a polaroid sai da fenda)') : ruim('A2: a câmera nunca recebeu a marca de cena');
    depois.estados.length > 0 && depois.estados.every(s => s === 'finished')
      ? ok('A2: a animação da foto termina (uma vez por carregamento)') : ruim(`A2: a foto continua animando (${depois.estados.join(',') || 'sem animação'})`);
    depois.translate.indexOf('-') === -1 ? ok('A2: a foto termina fora da fenda') : ruim(`A2: a foto não chegou ao fim (${depois.translate})`);
    await c.close();
  }
} catch (e) {
  ruim('exceção: ' + (e.stack || e));
} finally {
  await nav.close();
  srv.fechar();
}

console.log(falhas.length ? `\n✘ ${falhas.length} falha(s)` : '\n✔ Apresentação e Como funciona: sem falhas');
process.exit(falhas.length ? 1 : 0);
