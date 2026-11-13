/* D-197 · «Fazer uma polaroid» (DOC-04: «Uma polaroid» abre o atalho foto → legenda → baixar).
   Novo projeto → «Fazer uma polaroid» → uma foto só (a segunda fica de fora; escolher de novo troca) → Processando → direto
   ao Quadro → o LED vira «Baixar polaroid» → PNG de verdade a 300 DPI, com a legenda, passando pelo portão (polaroid avulsa
   conta 1 folha a cada 4, DOC-03 §3). Projeto comum com uma foto continua com «Revisar impressão». Fotos de exemplo do site (CC0). */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const foto = (n) => fileURLToPath(new URL('../../site/assets/img/fotos/' + n + '.jpg', import.meta.url));
function png(b) { const u = new Uint8Array(b), dv = new DataView(u.buffer, u.byteOffset, u.byteLength), r = { w: dv.getUint32(16), h: dv.getUint32(20), ppm: 0 };
  for (let i = 8; i + 8 <= u.length;) { const n = dv.getUint32(i), t = String.fromCharCode(...u.subarray(i + 4, i + 8)); if (t === 'pHYs') r.ppm = dv.getUint32(i + 8); if (t === 'IEND') break; i += 12 + n; } return r; }
const srv = await servir(), nav = await chromium.launch();
try {
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); globalThis.__pagina = p; const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(srv.url + 'app/entrar/'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await p.waitForFunction(() => !!window.PLCONTA); await p.evaluate(() => PLCONTA.entrarComo('gratis'));

  console.log('Novo projeto → «Fazer uma polaroid»:');
  await p.goto(srv.url + 'app/novo-projeto/');
  ok(await p.locator('#uma').isVisible() && /Fazer uma polaroid/.test(await p.textContent('#uma')), 'o atalho «Fazer uma polaroid» está na tela');
  await p.click('#uma'); await p.waitForURL('**/app/adicionar-fotos/**');
  const ad = await p.evaluate(() => ({ multi: document.getElementById('f-device').hasAttribute('multiple'), h1: document.querySelector('.head h1').textContent, uma: sessionStorage.getItem('pl-uma') }));
  ok(!ad.multi && ad.h1 === 'Escolha a foto' && ad.uma === '1', 'Adicionar fotos pede uma foto só («Escolha a foto»)');
  /* duas fotos de uma vez só chegam arrastando (o seletor do atalho já pede uma): fica a primeira */
  await p.evaluate(async (L) => { const dt = new DataTransfer(); for (const n of L) { const b = await (await fetch('../../assets/img/fotos/' + n + '.jpg')).blob(); dt.items.add(new File([b], n + '.jpg', { type: 'image/jpeg' })); }
    document.getElementById('drop').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); }, ['casal-por-do-sol', 'amigos-praia']);
  await p.waitForFunction(() => /1 foto escolhida/.test(document.getElementById('got').textContent));
  ok(/uma foto só/.test(await p.textContent('#toast-t')), 'com duas fotos, fica a primeira e o aviso explica');
  await p.setInputFiles('#f-device', [foto('montanha')]);
  await p.waitForFunction(() => /Foto trocada/.test(document.getElementById('toast-t').textContent));
  ok(/1 foto escolhida/.test(await p.textContent('#got')), 'escolher de novo troca a foto (continua 1)');
  await p.click('#btn-device'); await p.waitForURL('**/app/processando/**');
  await p.waitForSelector('#go:not([disabled])', { timeout: 30000 }); await p.click('#go');
  await p.waitForURL('**/app/editor/quadro/**', { timeout: 15000 });
  ok(/#foto-1$/.test(p.url()), 'depois de processar, vai direto ao Quadro da foto (sem resumo nem folhas)');

  console.log('Quadro: escrever a legenda e baixar:');
  await p.waitForFunction(() => document.querySelector('#go .btn-content > span') && document.querySelector('#go .btn-content > span').textContent === 'Baixar polaroid', null, { timeout: 15000 });
  const lb = await p.evaluate(() => ({ go: document.querySelector('#go .btn-content > span').textContent, go2: document.querySelector('#go2 .btn-content > span').textContent, ic: document.querySelector('#go use').getAttribute('href'), leds: document.querySelectorAll('.led-btn').length }));
  ok(lb.go === 'Baixar polaroid' && lb.go2 === 'Baixar polaroid' && lb.ic === '#i-download', 'o botão principal vira «Baixar polaroid» (no topo e na barra do celular)');
  await p.evaluate(() => { const q = JSON.parse(sessionStorage.getItem('pl-quadro') || 'null'); if (q && q[1]) { q[1].pl = [{ v: 'Fim de tarde', m: true }, { v: '', m: true }]; sessionStorage.setItem('pl-quadro', JSON.stringify(q)); } });
  const antes = await p.evaluate(() => PLCONTA.direito(1, 'padrao').usaGratis);
  const dl = p.waitForEvent('download', { timeout: 60000 }); await p.click('#go'); const d = await dl;
  const arq = fileURLToPath(new URL('../saida/uma-polaroid.png', import.meta.url)); await d.saveAs(arq);
  const im = png(await readFile(arq));
  ok(/^polarlife-\d{8}-polaroid\.png$/.test(d.suggestedFilename()), 'nome neutro: ' + d.suggestedFilename() + ' (BR-11)');
  ok(im.w === 1039 && im.h === 1264 && im.ppm === 11811, 'PNG da polaroid Clássica (88 × 107 mm) a 300 DPI gravados (' + im.w + ' × ' + im.h + ')');
  await p.waitForFunction(() => /Polaroid baixada/.test(document.getElementById('toast-t').textContent));
  const depois = await p.evaluate(() => ({ g: PLCONTA.direito(1, 'padrao').ok, t: document.getElementById('toast-t').textContent, go: document.querySelector('#go .btn-content > span').textContent }));
  ok(antes === true && depois.g === false && /folha grátis/.test(depois.t), 'a polaroid usou a folha grátis do mês, e o aviso diz isso' + (antes === true && depois.g === false ? '' : ' ' + JSON.stringify({ antes, depois })));
  ok(depois.go === 'Baixar polaroid', 'o botão volta ao normal depois de baixar');
  const dl2 = p.waitForEvent('download', { timeout: 60000 }); await p.click('#go'); await dl2;
  await p.waitForFunction(() => /de novo/.test(document.getElementById('toast-t').textContent));
  ok(true, 'baixar de novo a mesma polaroid em 24 h passa pelo portão sem pedir outra folha (DOC-03 §3)');

  console.log('Projeto comum com uma foto:');
  await p.evaluate(() => sessionStorage.removeItem('pl-uma')); await p.reload();
  await p.waitForFunction(() => document.querySelector('#go .btn-content > span').textContent === 'Revisar impressão', null, { timeout: 15000 });
  ok(true, 'sem o atalho, o Quadro continua com «Revisar impressão»');
  ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await ctx.close();
} catch (e) { ok(false, 'exceção: ' + e.message.split(/\r?\n/)[0] + ' (em ' + (globalThis.__pagina ? globalThis.__pagina.url() : '?') + ')'); }
await nav.close(); srv.fechar?.();
console.log(falhas ? `\n✘ uma polaroid: ${falhas} falha(s)` : '\n✔ uma polaroid: sem falhas');
process.exit(falhas ? 1 : 0);
