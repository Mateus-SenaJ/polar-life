#!/usr/bin/env node
/* T-32 · Início depois do login (openspec «inicio-depois-do-login» · spec inicio):
   guarda de sessão, faixa preta com banners (rotação de 8 s, pausa com o cursor e movimento reduzido),
   «Continue de onde parou», 8 modelos, 6 colagens «Em breve», um único LED e a aplicação de um modelo.
   Uso: node tests/e2e/testar-inicio.mjs  (Chromium do Playwright) */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from '../helpers/servidor.mjs';

const falhas = [], ok = m => console.log('  ✔ ' + m), ruim = m => { falhas.push(m); console.log('  ✘ ' + m); };
const saida = fileURLToPath(new URL('../saida/inicio/', import.meta.url));
await mkdir(saida, { recursive: true });

const SESSAO = email => `localStorage.setItem('pl-conta', JSON.stringify({ email: '${email}', entrouEm: Date.now() }))`;
const vigiar = p => {
  const v = [];
  p.on('pageerror', e => v.push('erro: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') v.push('console: ' + m.text().slice(0, 160)); });
  return v;
};
const urlAbs = p => { const u = new URL(p.url()); return u.pathname + u.search; };
const bannerAtivo = p => p.evaluate(() => {
  const s = document.querySelector('.faixa__slide.is-active');
  return s ? s.getAttribute('aria-label') : '';
});
async function contexto(email, opts = {}) {
  const c = await nav.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  if (email) await c.addInitScript(SESSAO(email));
  return c;
}

const srv = await servir();
const nav = await chromium.launch();
try {
  /* ---- A · sem sessão vai para a tela de entrar (com o destino guardado) ---- */
  {
    const c = await contexto(null);
    const p = await c.newPage();
    await p.goto(srv.url + 'app/inicio/', { waitUntil: 'networkidle' });
    urlAbs(p) === '/app/entrar/?voltar=' + encodeURIComponent('/app/inicio/') && await p.locator('#caixa').isVisible()
      ? ok('sem sessão: /app/inicio/ vai para entrar com ?voltar') : ruim(`sem sessão: foi para ${urlAbs(p)}`);
    await c.close();
  }

  /* ---- B · com sessão: todas as seções, em 1440×900 e 390×844 ---- */
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const c = await contexto('pro@polarlife.test', { viewport: { width: w, height: h } });
    const p = await c.newPage();
    const erros = vigiar(p), fora = [];
    p.on('request', r => { if (!r.url().startsWith(srv.url)) fora.push(r.url()); });
    await p.goto(srv.url + 'app/inicio/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => {
      const leds = [...document.querySelectorAll('.led-btn')];
      const visiveis = leds.filter(el => {
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0;
      });
      const faixa = document.querySelector('.faixa');
      const cs = faixa && getComputedStyle(faixa);
      const modelos = [...document.querySelectorAll('.mdl')];
      const breves = [...document.querySelectorAll('.selo-breve')];
      return {
        faixa: !!faixa, fundoFaixa: cs && cs.backgroundColor, alturaFaixa: faixa && Math.round(faixa.getBoundingClientRect().height),
        slides: document.querySelectorAll('.faixa__slide').length,
        modelos: modelos.length, nomes: modelos.map(m => (m.querySelector('.mdl__nome') || {}).textContent || ''),
        botoes: modelos.filter(m => { const b = m.querySelector('.mdl__b'); return b && b.textContent.trim() === 'Usar este modelo'; }).length,
        breves: breves.length, textoBreve: breves.map(b => b.textContent.trim()),
        colagens: document.querySelectorAll('.colag').length,
        leds: leds.length, ledsVisiveis: visiveis.length,
        rolagem: document.documentElement.scrollWidth - window.innerWidth,
        titulo: (document.querySelector('.faixa__tit') || {}).textContent || '',
        expressao: (document.querySelector('.faixa__expr') || {}).textContent || '',
        rodape: !!document.querySelector('.legal'),
        nota: !!document.querySelector('.note')
      };
    });
    const rot = `${w}×${h}`;
    r.faixa && r.fundoFaixa === 'rgb(0, 0, 0)' ? ok(`${rot}: a faixa preta está na tela`) : ruim(`${rot}: a faixa preta não apareceu (${r.fundoFaixa})`);
    r.slides === 3 ? ok(`${rot}: a faixa tem 3 banners`) : ruim(`${rot}: ${r.slides} banners`);
    r.titulo.includes('histórias') && r.expressao.includes('histórias') ? ok(`${rot}: o título do banner tem a expressão em destaque`) : ruim(`${rot}: título fora do esperado (${r.titulo})`);
    r.modelos === 8 ? ok(`${rot}: 8 cartões de modelo`) : ruim(`${rot}: ${r.modelos} cartões de modelo`);
    r.nomes.includes('Praia 🌊') ? ok(`${rot}: o nome do modelo traz o emoji`) : ruim(`${rot}: nomes sem emoji (${r.nomes.join(' | ')})`);
    r.botoes === 8 ? ok(`${rot}: cada modelo tem o botão «Usar este modelo» (sem emoji)`) : ruim(`${rot}: ${r.botoes} botões de modelo`);
    r.colagens === 6 ? ok(`${rot}: 6 cartões de colagem`) : ruim(`${rot}: ${r.colagens} cartões de colagem`);
    r.breves === 6 && r.textoBreve.every(t => t === 'Em breve') ? ok(`${rot}: as 6 colagens têm o selo «Em breve»`) : ruim(`${rot}: selos «Em breve» fora do esperado (${r.textoBreve.join(', ')})`);
    r.leds === 1 && r.ledsVisiveis === 1 ? ok(`${rot}: um único botão LED na tela (T8)`) : ruim(`${rot}: ${r.leds} botões LED (${r.ledsVisiveis} visíveis)`);
    r.rolagem <= 0 ? ok(`${rot}: sem rolagem lateral`) : ruim(`${rot}: rolagem lateral de ${r.rolagem} px`);
    r.nota && r.rodape ? ok(`${rot}: nota de privacidade e rodapé`) : ruim(`${rot}: faltam a nota ou o rodapé`);
    erros.length === 0 ? ok(`${rot}: página sem erro`) : ruim(`${rot}: ${erros[0]}`);
    fora.length === 0 ? ok(`${rot}: nenhum recurso externo (T6)`) : ruim(`${rot}: recurso externo → ${fora[0]}`);
    await p.screenshot({ path: join(saida, `inicio-${w}-faixa.png`) });   /* o topo, com a faixa */
    await c.close();

    /* a página inteira com movimento reduzido: as seções ficam no estado final (revisão do layout) */
    const cr = await contexto('pro@polarlife.test', { viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const pr = await cr.newPage();
    await pr.goto(srv.url + 'app/inicio/', { waitUntil: 'networkidle' });
    await pr.waitForTimeout(400);
    await pr.screenshot({ path: join(saida, `inicio-${w}.png`), fullPage: true });
    await cr.close();
  }

  /* ---- C · banners: rotação, pausa com o cursor e parada depois da ação manual ---- */
  {
    const c = await contexto('pro@polarlife.test');
    const p = await c.newPage();
    const erros = vigiar(p);
    await p.goto(srv.url + 'app/inicio/', { waitUntil: 'networkidle' });
    const primeiro = await bannerAtivo(p);
    await p.waitForTimeout(9000);                                   /* 8 s de rotação + folga */
    const depois = await bannerAtivo(p);
    primeiro !== depois ? ok('o banner gira sozinho (8 s)') : ruim(`o banner não girou (${primeiro})`);

    await p.hover('.faixa__slide.is-active');
    const pausado = await bannerAtivo(p);
    await p.waitForTimeout(9000);
    (await bannerAtivo(p)) === pausado ? ok('com o cursor em cima, o banner não muda') : ruim('o banner mudou com o cursor em cima');

    await p.mouse.move(0, 0);
    await p.click('#faixa-p3');
    const manual = await bannerAtivo(p);
    await p.waitForTimeout(9000);
    (await bannerAtivo(p)) === manual ? ok('depois do clique no ponto, a rotação para') : ruim('a rotação continuou depois do clique no ponto');
    const live = await p.getAttribute('.faixa__pistas', 'aria-live');
    live === 'polite' ? ok('após a ação manual, a região avisa com gentileza (aria-live=polite)') : ruim(`aria-live fora do esperado (${live})`);
    erros.length === 0 ? ok('banners: página sem erro') : ruim(`banners: ${erros[0]}`);
    await c.close();
  }

  /* ---- D · movimento reduzido: sem rotação e sem animação ---- */
  {
    const c = await contexto('pro@polarlife.test', { reducedMotion: 'reduce' });
    const p = await c.newPage();
    await p.goto(srv.url + 'app/inicio/', { waitUntil: 'networkidle' });
    const antes = await bannerAtivo(p);
    await p.waitForTimeout(9000);
    const depois = await bannerAtivo(p);
    antes === depois ? ok('movimento reduzido: o banner não gira') : ruim('movimento reduzido: o banner girou');
    const pausa = await p.locator('#faixa-pausa').isHidden();
    pausa ? ok('movimento reduzido: o botão de pausa some') : ruim('movimento reduzido: o botão de pausa continua');
    const marcas = await p.evaluate(() => document.querySelectorAll('.is-in,.is-out,.is-dev').length);
    marcas === 0 ? ok('movimento reduzido: nenhuma classe de animação é aplicada') : ruim(`movimento reduzido: ${marcas} classes aplicadas`);
    const vis = await p.evaluate(() => {
      const s = document.querySelector('#sec-modelos');
      return s ? getComputedStyle(s).opacity : '0';
    });
    vis === '1' ? ok('movimento reduzido: as seções já estão no estado final') : ruim(`movimento reduzido: seção com opacidade ${vis}`);
    await c.close();
  }

  /* ---- E · aplicar um modelo: o editor abre com o formato e o estilo do modelo ---- */
  {
    const c = await contexto('pro@polarlife.test');
    const p = await c.newPage();
    const erros = vigiar(p);
    await p.goto(srv.url + 'app/inicio/', { waitUntil: 'networkidle' });
    await p.click('.mdl[data-modelo="praia"] .mdl__b, li.mdl:has(.mdl__nome:text-is("Praia 🌊")) .mdl__b');
    await p.waitForURL('**/app/editor/quadro/**', { timeout: 15000 });
    await p.waitForTimeout(1200);
    const st = await p.evaluate(() => {
      const S = window.PLQ && PLQ.ST && PLQ.ST()[0];
      const textos = window.PLQ ? PLQ.ST().slice(1).map(e => e && e.txt || '') : [];
      return { st0: S || null, textos, titulo: document.title };
    });
    const st0 = st.st0 || {};
    st0.fr && st0.fr.fmt === 'classico' && st0.fr.w === 88 && st0.fr.h === 107
      ? ok('aplicar o modelo: o formato entra em ST[0].fr (Clássico 88 × 107)') : ruim(`formato fora do esperado: ${JSON.stringify(st0.fr)}`);
    st0.leg && st0.leg.preset === 'manuscrito' && st0.leg.txt && st0.leg.txt.font === 'Shadows Into Light' && st0.leg.txt.cor === 'azul'
      ? ok('aplicar o modelo: o estilo da legenda entra em ST[0].leg') : ruim(`estilo fora do esperado: ${JSON.stringify(st0.leg && {preset: st0.leg.preset, font: st0.leg.txt && st0.leg.txt.font, cor: st0.leg.txt && st0.leg.txt.cor})}`);
    const semEmoji = !JSON.stringify(st0.leg || {}).includes('🌊') && !st.textos.some(t => t.includes('🌊'));
    semEmoji ? ok('aplicar o modelo: o texto da legenda não tem emoji (D-120)') : ruim('o texto da legenda recebeu o emoji');
    st.textos[0] === 'Dias de sol' ? ok('aplicar o modelo: o texto sugerido entra na legenda') : ruim(`texto sugerido fora do esperado: ${st.textos[0]}`);
    erros.length === 0 ? ok('aplicar o modelo: página sem erro') : ruim(`aplicar o modelo: ${erros[0]}`);

    /* de volta no Início: o projeto aparece em «Continue de onde parou» */
    await p.goto(srv.url + 'app/inicio/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(700);
    const cart = await p.evaluate(() => {
      const c = document.querySelector('.proj');
      return c ? {
        nome: (c.querySelector('.proj__nome') || {}).textContent || '',
        meta: (c.querySelector('.proj__meta') || {}).textContent || '',
        quando: (c.querySelector('.proj__quando') || {}).textContent || '',
        botao: (c.querySelector('.proj__b') || {}).textContent || '',
        vazio: !document.getElementById('proj-vazio').hidden,
        todos: !document.getElementById('ver-todos').hidden
      } : null;
    });
    cart ? ok('de volta no Início: o projeto aparece em «Continue de onde parou»') : ruim('o projeto não apareceu na lista');
    cart && cart.nome === 'Praia' ? ok('o cartão mostra o nome do projeto') : ruim(`nome fora do esperado: ${cart && cart.nome}`);
    cart && /24 fotos · 6 folhas A4 · Clássico 88 × 107 mm/.test(cart.meta)
      ? ok('o cartão mostra fotos, folhas e formato') : ruim(`meta fora do esperado: ${cart && cart.meta}`);
    cart && /^Editado/.test(cart.quando) ? ok('o cartão mostra quando o projeto foi editado') : ruim(`quando fora do esperado: ${cart && cart.quando}`);
    cart && cart.botao.trim() === 'Abrir' ? ok('o cartão tem o botão «Abrir»') : ruim(`botão fora do esperado: ${cart && cart.botao}`);
    cart && cart.vazio === false && cart.todos === false ? ok('com 1 projeto, o estado vazio some e o link «Ver todos» fica escondido') : ruim('estados do cartão errados');
    await c.close();
  }

  /* ---- F · depois de entrar, a pessoa cai no Início ---- */
  {
    const c = await contexto(null);
    const p = await c.newPage();
    await p.goto(srv.url + 'app/entrar/', { waitUntil: 'networkidle' });
    await p.click('[data-perfil="pro"]');
    await p.waitForURL('**/app/inicio/**', { timeout: 15000 });
    ok('depois de entrar, o destino padrão é o Início');
    await c.close();
  }

  /* ---- G · cabeçalho: conta do plano e painel do admin ---- */
  {
    const c = await contexto('admin@polarlife.test');
    const p = await c.newPage();
    await p.goto(srv.url + 'app/inicio/', { waitUntil: 'networkidle' });
    const cab = await p.evaluate(() => ({
      conta: (document.getElementById('conta-t') || {}).textContent || '',
      painel: !document.getElementById('painel').hidden,
      contaHref: (document.getElementById('conta') || {}).getAttribute('href') || ''
    }));
    /Conta · /.test(cab.conta) ? ok('o cabeçalho mostra «Conta · <plano>»') : ruim(`cabeçalho fora do esperado: ${cab.conta}`);
    cab.painel ? ok('a conta Admin ganha o link «Painel»') : ruim('a conta Admin não ganhou o link «Painel»');
    cab.contaHref.endsWith('/conta/') ? ok('«Conta» leva para a tela da conta') : ruim(`destino da conta fora do esperado: ${cab.contaHref}`);
    await c.close();
  }
} catch (e) {
  ruim('exceção: ' + (e.stack || e));
} finally {
  await nav.close();
  srv.fechar();
}

console.log(falhas.length ? `\n✘ ${falhas.length} falha(s)` : '\n✔ Página Início: sem falhas');
process.exit(falhas.length ? 1 : 0);
