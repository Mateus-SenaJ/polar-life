#!/usr/bin/env node
/* T-25 · Mesa ilustrada da tela de entrar (openspec «entrar-mesa-ilustrada» · spec tela-entrar):
   a ilustração definitiva (assets/img/ilustracoes/mesa-polaroids.svg) embutida no HTML, sem as
   polaroids pontilhadas provisórias, sem rolagem lateral e sem recurso externo; as sete polaroids
   pousam uma após a outra e a foto sai da câmera — tudo parado quando o navegador pede
   movimento reduzido (prefers-reduced-motion).
   Uso: node tests/e2e/testar-entrar-mesa.mjs  (Chromium do Playwright) */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from '../helpers/servidor.mjs';

const falhas = [], ok = m => console.log('  ✔ ' + m), ruim = m => { falhas.push(m); console.log('  ✘ ' + m); };
const saida = fileURLToPath(new URL('../saida/mesa/', import.meta.url));
await mkdir(saida, { recursive: true });

const vigiar = p => {
  const v = [];
  p.on('pageerror', e => v.push('erro: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') v.push('console: ' + m.text().slice(0, 160)); });
  return v;
};

const srv = await servir();
const nav = await chromium.launch();
try {
  /* ---- 1 · ilustração definitiva no lugar da provisória (1440×900 e 390×844) ---- */
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const erros = vigiar(page), fora = [];
    page.on('request', r => { if (!r.url().startsWith(srv.url)) fora.push(r.url()); });
    await page.goto(srv.url + 'app/entrar/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);                       // deixa a animação terminar

    const mesa = await page.evaluate(() => {
      const caixa = document.querySelector('.ent__mesa');
      const svg = caixa && caixa.querySelector('svg.mesa');
      const dentro = id => { const el = document.getElementById(id); return !!(el && caixa.contains(el)); };
      const ids = ['mesa-p1', 'mesa-p2', 'mesa-p3', 'mesa-p4', 'mesa-p5', 'mesa-p6', 'mesa-p7', 'mesa-camera'];
      const b = svg && svg.getBoundingClientRect();
      return {
        ids: ids.filter(dentro), faltando: ids.filter(id => !dentro(id)),
        pontilhado: !!document.getElementById('mesa-dot'),
        viewBox: svg && svg.getAttribute('viewBox'),
        corte: svg && svg.getAttribute('preserveAspectRatio'),
        foco: svg && svg.getAttribute('focusable'),
        cenas: document.querySelectorAll('#mesa-p1 use, #mesa-p2 use, #mesa-p3 use, #mesa-p4 use, #mesa-p5 use, #mesa-p6 use, #mesa-p7 use').length,
        proporcao: b ? +(b.width / b.height).toFixed(2) : 0,
        rolagem: document.documentElement.scrollWidth - window.innerWidth,
        largura: document.documentElement.scrollWidth
      };
    });
    const rotulo = `${w}×${h}`;
    mesa.ids.length === 8 && mesa.faltando.length === 0
      ? ok(`${rotulo}: a mesa tem #mesa-p1…#mesa-p7 e #mesa-camera`)
      : ruim(`${rotulo}: faltam grupos na mesa (${mesa.faltando.join(', ') || mesa.ids.join(', ')})`);
    !mesa.pontilhado ? ok(`${rotulo}: sem o pontilhado provisório (#mesa-dot)`) : ruim(`${rotulo}: ainda tem o pontilhado provisório`);
    mesa.viewBox === '0 0 1200 750' && mesa.corte === 'xMidYMid slice'
      ? ok(`${rotulo}: ilustração definitiva (viewBox ${mesa.viewBox}, ${mesa.corte})`)
      : ruim(`${rotulo}: viewBox/corte fora do esperado (${mesa.viewBox} · ${mesa.corte})`);
    mesa.cenas >= 7 ? ok(`${rotulo}: as sete polaroids têm a cena desenhada (${mesa.cenas} usos)`) : ruim(`${rotulo}: polaroids sem cena (${mesa.cenas})`);
    Math.abs(mesa.proporcao - 1.6) < 0.02 ? ok(`${rotulo}: mesa em 16:10 (${mesa.proporcao})`) : ruim(`${rotulo}: mesa fora de 16:10 (${mesa.proporcao})`);
    mesa.rolagem <= 0 ? ok(`${rotulo}: sem rolagem lateral`) : ruim(`${rotulo}: rolagem lateral de ${mesa.rolagem} px`);
    mesa.foco === 'false' ? ok(`${rotulo}: SVG fora da tabulação (focusable=false)`) : ruim(`${rotulo}: focusable=${mesa.foco}`);
    erros.length === 0 ? ok(`${rotulo}: página sem erro`) : ruim(`${rotulo}: ${erros[0]}`);
    fora.length === 0 ? ok(`${rotulo}: nenhum recurso externo (T6)`) : ruim(`${rotulo}: recurso externo → ${fora[0]}`);
    await page.locator('.ent__mesa').screenshot({ path: join(saida, `mesa-${w}.png`) });
    await ctx.close();
  }

  /* ---- 2 · animação: polaroids uma após a outra e foto saindo da câmera ---- */
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const erros = vigiar(page);
  await page.goto(srv.url + 'app/entrar/', { waitUntil: 'networkidle' });
  const anim = await page.evaluate(() => {
    const nomes = [...document.querySelectorAll('.ent__mesa .mesa-p')].map(el => getComputedStyle(el).animationName);
    const atrasos = [1, 2, 3, 4, 5, 6, 7].map(n => getComputedStyle(document.getElementById('mesa-p' + n)).animationDelay);
    const foto = getComputedStyle(document.getElementById('mesa-cam-foto'));
    return { nomes, atrasos, fotoNome: foto.animationName, fotoAtraso: foto.animationDelay, fotoDuracao: foto.animationDuration };
  });
  anim.nomes.length === 7 && anim.nomes.every(n => n === 'mesa-pousa')
    ? ok('as sete polaroids animam (mesa-pousa)')
    : ruim(`animação das polaroids fora do esperado: ${anim.nomes.join(', ')}`);
  anim.atrasos.join(' ') === '0s 0.09s 0.18s 0.27s 0.36s 0.45s 0.54s'
    ? ok('as polaroids pousam uma após a outra (atrasos em escada)')
    : ruim(`atrasos das polaroids fora do esperado: ${anim.atrasos.join(', ')}`);
  anim.fotoNome === 'mesa-foto-sai' ? ok('a foto sai da câmera (mesa-foto-sai)') : ruim(`a foto não anima: ${anim.fotoNome}`);
  anim.fotoAtraso === '1.14s' ? ok('a foto sai depois das polaroids (1,14 s)') : ruim(`atraso da foto fora do esperado: ${anim.fotoAtraso}`);
  anim.fotoDuracao === '0.9s' ? ok('a foto sai em 900 ms') : ruim(`duração da foto fora do esperado: ${anim.fotoDuracao}`);

  await page.waitForTimeout(2600);
  const repouso = await page.evaluate(() => {
    const ps = [...document.querySelectorAll('.ent__mesa .mesa-p')];
    const foto = document.getElementById('mesa-cam-foto'), cam = document.getElementById('mesa-cam-corpo');
    const f = foto.getBoundingClientRect(), c = cam.getBoundingClientRect();
    return {
      opacidades: ps.map(p => getComputedStyle(p).opacity),
      translados: ps.map(p => getComputedStyle(p).translate),
      fotoOp: getComputedStyle(foto).opacity,
      foraDaCamera: +(f.bottom - c.bottom).toFixed(1)
    };
  });
  repouso.opacidades.every(o => o === '1') ? ok('no fim, as sete polaroids aparecem inteiras') : ruim(`opacidade final das polaroids: ${repouso.opacidades.join(', ')}`);
  repouso.translados.every(t => t === 'none' || t === '0px') ? ok('no fim, as polaroids estão na posição do arquivo') : ruim(`translado final das polaroids: ${repouso.translados.join(', ')}`);
  repouso.fotoOp === '1' ? ok('a foto aparece inteira') : ruim(`opacidade final da foto: ${repouso.fotoOp}`);
  repouso.foraDaCamera > 20 ? ok(`a foto fica para fora da câmera (+${repouso.foraDaCamera} px)`) : ruim(`a foto não saiu da câmera (${repouso.foraDaCamera} px)`);
  erros.length === 0 ? ok('página sem erro durante a animação') : ruim(`erro na animação: ${erros[0]}`);
  await ctx.close();

  /* ---- 3 · movimento reduzido: nada anima e tudo fica na posição final ---- */
  const ctxRM = await nav.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const rm = await ctxRM.newPage();
  const errosRM = vigiar(rm);
  await rm.goto(srv.url + 'app/entrar/', { waitUntil: 'networkidle' });
  await rm.waitForTimeout(600);
  const quieto = await rm.evaluate(() => {
    const ps = [...document.querySelectorAll('.ent__mesa .mesa-p')];
    const foto = document.getElementById('mesa-cam-foto');
    const f = foto.getBoundingClientRect(), c = document.getElementById('mesa-cam-corpo').getBoundingClientRect();
    return {
      animacoes: ps.map(p => getComputedStyle(p).animationName),
      opacidades: ps.map(p => getComputedStyle(p).opacity),
      fotoAnimacao: getComputedStyle(foto).animationName,
      fotoOp: getComputedStyle(foto).opacity,
      fotoTranslado: getComputedStyle(foto).translate,
      foraDaCamera: +(f.bottom - c.bottom).toFixed(1)
    };
  });
  quieto.animacoes.every(a => a === 'none') ? ok('movimento reduzido: as polaroids não animam') : ruim(`movimento reduzido: ${quieto.animacoes.join(', ')}`);
  quieto.opacidades.every(o => o === '1') ? ok('movimento reduzido: as polaroids aparecem inteiras') : ruim(`movimento reduzido: opacidade ${quieto.opacidades.join(', ')}`);
  quieto.fotoAnimacao === 'none' && quieto.fotoOp === '1'
    ? ok('movimento reduzido: a foto não anima e aparece inteira')
    : ruim(`movimento reduzido: foto ${quieto.fotoAnimacao} / opacidade ${quieto.fotoOp}`);
  quieto.fotoTranslado === 'none' || quieto.fotoTranslado === '0px'
    ? ok('movimento reduzido: a foto fica na posição final')
    : ruim(`movimento reduzido: foto transladada ${quieto.fotoTranslado}`);
  quieto.foraDaCamera > 20 ? ok(`movimento reduzido: a foto já aparece para fora da câmera (+${quieto.foraDaCamera} px)`) : ruim(`movimento reduzido: foto dentro da câmera (${quieto.foraDaCamera} px)`);
  errosRM.length === 0 ? ok('movimento reduzido: página sem erro') : ruim(`movimento reduzido: ${errosRM[0]}`);
  await rm.locator('.ent__mesa').screenshot({ path: join(saida, 'mesa-movimento-reduzido.png') });
  await ctxRM.close();
} catch (e) {
  ruim('exceção: ' + (e.stack || e));
} finally {
  await nav.close();
  srv.fechar();
}

console.log(falhas.length ? `\n✘ ${falhas.length} falha(s)` : '\n✔ Mesa da tela de entrar: sem falhas');
process.exit(falhas.length ? 1 : 0);
