/* D-188: Colagem — modelo primeiro, fotos depois. A sugestão abre a colagem com as molduras vazias do modelo e
   «Adicionar fotos» (o LED da tela); a escolha volta direto para a colagem, e dá para acrescentar mais fotos depois.
   Projeto real sem fotos nunca mostra o exemplo de 24 fotos. Fotos de exemplo do site (CC0). */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
const arq = async (n) => ({ name: n + '.jpg', mimeType: 'image/jpeg', buffer: await readFile(new URL('../../site/assets/img/fotos/' + n + '.jpg', import.meta.url)) });
const mesa = (p) => p.evaluate(() => ({ vazias: document.querySelectorAll('#sheet .pol-vazia').length, pols: document.querySelectorAll('#sheet .pol').length, cta: !!document.querySelector('#sheet [data-add-fotos].led-btn'),
  go: !document.getElementById('go').hidden, leds: [...document.querySelectorAll('.led-btn')].filter((b) => b.offsetParent).length, modo: (document.getElementById('ctx-modo') || {}).textContent, col: JSON.parse(sessionStorage.getItem('pl-colagem') || 'null'), demo: /Campos do Jordão|Dias de sol/.test(document.body.innerText) }));
try {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    console.log(`\n${w}×${h}:`);
    const ctx = await nav.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
    const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
    await p.goto(srv.url + 'app/'); await p.evaluate(() => { localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear(); }); await p.reload();
    await p.click('[data-sug="coracao"]');
    await p.waitForURL('**/app/editor/**'); await p.waitForSelector('#sheet .pol-vazia');
    let m = await mesa(p);
    ok(m.vazias >= 6 && m.pols === 0 && m.col && m.col.ativo && m.col.layout === 'coracao' && /Colagem/.test(m.modo || ''), 'a sugestão abre a colagem «Coração» com ' + m.vazias + ' molduras vazias, antes de escolher fotos');
    ok(m.cta && !m.go && m.leds === 1 && !m.demo, '«Adicionar fotos» é o único LED da tela; sem «Revisar impressão» e sem o exemplo de 24 fotos');
    await p.click('#sheet [data-add-fotos].led-btn');
    await p.waitForURL('**/app/adicionar-fotos/**');
    ok(/vão direto para a sua colagem/.test(await p.textContent('.head')) && (await p.getAttribute('.app-header a.btn2', 'href')) === '../editor/#colagem', 'a tela de fotos avisa que elas vão para a colagem; «Voltar» volta para ela');
    await p.setInputFiles('#f-device', [await arq('amigas-praia'), await arq('casal-por-do-sol'), await arq('paisagem-mar')]);
    await p.waitForFunction(() => /Continuar com 3/.test(document.getElementById('btn-device-t').textContent));
    await p.waitForTimeout(500); await p.click('#btn-device');
    await p.waitForURL('**/app/editor/**'); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 3);
    m = await mesa(p);
    ok(m.pols === 3 && m.vazias === 0 && m.col.layout === 'coracao' && m.go, 'volta direto para a colagem, com as 3 fotos no coração (sem passar por Processando e Resumo)');
    /* acrescentar depois, pelo painel da Colagem */
    if (w === 1440) {
      await p.click('#tab-colagem').catch(() => {});
      await p.click('button[data-add-fotos]:has-text("Adicionar fotos à colagem")');
      await p.waitForURL('**/app/adicionar-fotos/**');
      await p.setInputFiles('#f-device', [await arq('amigos-trilha'), await arq('casal-noite')]);
      await p.waitForFunction(() => /Continuar com 2/.test(document.getElementById('btn-device-t').textContent));
      await p.waitForTimeout(500); await p.click('#btn-device');
      await p.waitForURL('**/app/editor/**'); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 5);
      ok(true, '«Adicionar fotos à colagem» acrescenta mais 2: 5 fotos na colagem');
    }
    /* projeto de colagem vazio, aberto pela lista, vai para o modelo (e o Quadro não mostra o exemplo) */
    await p.goto(srv.url + 'app/'); await p.click('#criar-colagem');
    await p.waitForURL('**/app/editor/**'); await p.waitForSelector('#sheet .pol-vazia');
    const idVazio = await p.evaluate(() => PLPROJETOS.atual());
    await p.goto(srv.url + 'app/'); await p.waitForSelector('#lista .card');
    await p.click('[data-open="' + idVazio + '"]');
    await p.waitForURL('**/app/editor/**'); await p.waitForSelector('#sheet .pol-vazia');
    ok(true, 'colagem vazia aberta pela lista de projetos volta para o modelo com as molduras vazias');
    const q = await p.$(w < 1024 ? '#modes-q' : '#rail-q');
    if (q && await q.isVisible()) { await q.click(); await p.waitForURL('**/app/adicionar-fotos/**'); ok(true, 'sem fotos, «Quadro» leva para escolher as fotos (não para o exemplo)'); }
    ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
    await ctx.close();
  }
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ colagem pelo modelo: ${falhas} falha(s)` : '\n✔ colagem pelo modelo: sem falhas');
process.exit(falhas ? 1 : 0);
