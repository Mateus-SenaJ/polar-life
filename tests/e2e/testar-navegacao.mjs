#!/usr/bin/env node
/* Navegação e fluxos (openspec «auditoria-navegacao-fluxos» · spec navegacao · D-157 a D-164).
   1) Rastreia todas as rotas, sem sessão e com conta: nenhuma página com erro de script, recurso 404 ou link interno quebrado;
      sem sessão, toda rota de /app/ vai para «Entrar» guardando o destino (D-123); no máximo um LED visível por tela (T8).
   2) Fluxo ponta a ponta com fotos CC0 do próprio site e duas fotos verticais geradas em canvas (nenhuma foto pessoal):
      apresentação → entrar → Início → novo projeto → fotos → processando → resumo → orientação → Folhas → Quadro →
      revisão → exportar → gerar → imprimir → compartilhar, com Voltar/Avançar, recarregar e aba nova no caminho.
   3) Estados: projeto sem fotos, excluir o projeto aberto, sair da conta, ?voltar= e limite do plano Grátis.
   Uso: node tests/e2e/testar-navegacao.mjs  (Chromium do Playwright) */
import { chromium } from 'playwright';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { servir, SITE } from '../helpers/servidor.mjs';

const falhas = [], ok = m => console.log('  ✔ ' + m), ruim = m => { falhas.push(m); console.log('  ✘ ' + m); };
const confere = (v, m, extra) => v ? ok(m) : ruim(m + (extra ? ' — ' + extra : ''));
const srv = await servir(), nav = await chromium.launch({ headless: true });
const rel = u => u.replace(srv.url, '/');
const FOTOS = ['praia.jpg', 'montanha.jpg', 'cidade.jpg'].map(f => ({ name: f, mimeType: 'image/jpeg', buffer: readFileSync(join(SITE, 'assets/img/fotos', f)) }));   // fotos CC0 do site
const ROTAS_APP = ['app/', 'app/inicio/', 'app/novo-projeto/', 'app/adicionar-fotos/', 'app/processando/', 'app/resumo/', 'app/orientacao/', 'app/estados/', 'app/editor/', 'app/editor/quadro/',
  'app/editor/gerar/', 'app/editor/imprimir/', 'app/editor/exportar/', 'app/editor/compartilhar/', 'app/conta/', 'app/conta/planos/', 'app/conexoes/', 'app/admin/'];
const ROTAS = ['', 'como-funciona/', 'legal/', 'app/entrar/', ...ROTAS_APP, 'prototipo/editor-v3/'];
const SESSAO = email => `localStorage.setItem('pl-conta', JSON.stringify({ email: '${email}', entrouEm: Date.now() }))`;

function vigiar(p, v) {
  p.on('pageerror', e => v.push('erro de página: ' + String(e.message).slice(0, 160)));
  p.on('console', m => { if (m.type() === 'error') v.push('console: ' + m.text().slice(0, 160)); });
  p.on('response', r => { if (r.status() >= 400) v.push('HTTP ' + r.status() + ' ' + rel(r.url())); });
}
async function contexto(email, larg = 1440, alt = 900) {
  const ctx = await nav.newContext({ viewport: { width: larg, height: alt }, serviceWorkers: 'block' });
  if (email) await ctx.addInitScript(SESSAO(email));
  return ctx;
}
const ledsVisiveis = p => p.evaluate(() => [...document.querySelectorAll('.led-btn')].filter(e => { const s = getComputedStyle(e), b = e.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && b.width > 0 && b.height > 0; }).length);
const projetos = p => p.evaluate(async () => (await PLPROJETOS.listar()).map(x => ({ id: x.id, fotos: x.fotos, plfotos: (x.estado || {})['pl-fotos'] || null, atual: x.id === PLPROJETOS.atual() })));
/* duas fotos verticais sintéticas (canvas), para a pergunta de orientação aparecer */
async function verticais(p) {
  const b64 = await p.evaluate(() => ['#006194', '#FD761A'].map(c => { const k = document.createElement('canvas'); k.width = 600; k.height = 800; const x = k.getContext('2d'); x.fillStyle = '#F8F9FA'; x.fillRect(0, 0, 600, 800); x.fillStyle = c; x.fillRect(150, 200, 300, 400); return k.toDataURL('image/jpeg', .9).split(',')[1]; }));
  return b64.map((d, i) => ({ name: 'vertical-' + (i + 1) + '.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(d, 'base64') }));
}
async function escolherFotos(p, arquivos) {
  await p.setInputFiles('#f-device', arquivos);
  await p.waitForFunction(n => new RegExp('Continuar com ' + n + ' foto').test(document.getElementById('btn-device').textContent), arquivos.length, { timeout: 15000 });
  await p.locator('#btn-device').click();
  await p.waitForURL('**/processando/**', { timeout: 15000 });
  await p.waitForFunction(() => !document.getElementById('go').disabled, null, { timeout: 30000 });
}

try {
  /* ================= 1 · rastreio de rotas e links ================= */
  console.log('1 · rotas e links internos');
  const links = new Map();                                    // url absoluta sem fragmento → rota de origem
  for (const [nome, email] of [['sem sessão', null], ['conta Pro', 'pro@polarlife.test']]) {
    const ctx = await contexto(email); let problemas = 0, ledsDemais = [];
    for (const rota of ROTAS) {
      const p = await ctx.newPage(), v = []; vigiar(p, v);
      await p.goto(srv.url + rota, { waitUntil: 'load' }); await p.waitForTimeout(350);
      const fim = rel(p.url());
      if (!email && ROTAS_APP.includes(rota)) {
        const esperado = '/app/entrar/?voltar=' + encodeURIComponent('/' + rota);
        if (fim !== esperado) { problemas++; ruim(`sem sessão: /${rota} deveria ir para ${esperado} (foi ${fim})`); }
      } else if (fim !== '/' + rota) { problemas++; ruim(`${nome}: /${rota} redirecionou para ${fim}`); }
      const erros = v.filter(x => !/Service Worker/.test(x));
      if (erros.length) { problemas++; ruim(`${nome}: /${rota} — ${[...new Set(erros)].join(' ; ').slice(0, 300)}`); }
      if (await ledsVisiveis(p) > 1) ledsDemais.push('/' + rota);
      for (const h of await p.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => [a.getAttribute('href'), a.href]))) {
        if (h[0] === '' || h[0] === '#') { problemas++; ruim(`${nome}: /${rota} tem link vazio («${h[0]}»)`); }
        if (h[1].startsWith(srv.url)) { const u = h[1].split('#')[0]; if (!links.has(u)) links.set(u, '/' + rota); }
      }
      await p.close();
    }
    confere(!problemas, `${nome}: ${ROTAS.length} rotas sem erro de página, sem recurso 404 e com o destino certo`);
    confere(!ledsDemais.length, `${nome}: no máximo um LED visível por tela (T8)`, ledsDemais.join(', '));
    await ctx.close();
  }
  const quebrados = [];
  for (const [u, de] of links) { const r = await fetch(u); if (r.status >= 400) quebrados.push(`${rel(u)} (em ${de}) → ${r.status}`); }
  confere(!quebrados.length, `${links.size} links internos distintos respondem 200`, quebrados.join(' ; '));
  { const r = await fetch(srv.url + 'nao-existe/'); const t = await r.text(); confere(r.status === 404 && /Página não encontrada/.test(t), 'endereço inexistente responde a página 404 do site'); }

  /* ================= 2 · fluxo ponta a ponta (Pro) ================= */
  console.log('2 · fluxo ponta a ponta');
  const ctx = await contexto(null), p = await ctx.newPage(), v = []; vigiar(p, v);
  await p.goto(srv.url);
  await p.locator('a[href="app/inicio/"]').first().click();
  await p.waitForURL('**/app/entrar/?voltar=**');
  ok('apresentação → «Criar minhas polaroids» sem sessão pede para entrar');
  await p.locator('[data-perfil="pro"]').click();
  await p.waitForURL('**/app/inicio/', { timeout: 8000 });
  ok('entrar → Início');
  await p.goBack(); await p.waitForTimeout(500);
  confere(!/\/app\/entrar\//.test(p.url()), 'Voltar depois de entrar não devolve à tela de entrar (D-162)', rel(p.url()));
  await p.goto(srv.url + 'app/inicio/');
  await p.locator('#led-comecar').click(); await p.waitForURL('**/app/novo-projeto/');
  await p.locator('label.fmt-card:has(input[value="imini"])').click();
  await p.selectOption('#paper', 'A5');
  await p.locator('#continuar').click(); await p.waitForURL('**/app/adicionar-fotos/');
  await p.goBack(); await p.waitForURL('**/app/novo-projeto/');
  await p.locator('label.fmt-card:has(input[value="imini"])').click(); await p.selectOption('#paper', 'A5');
  await p.locator('#continuar').click(); await p.waitForURL('**/app/adicionar-fotos/');
  let lista = await projetos(p);
  confere(lista.length === 1, 'voltar e continuar no «Novo projeto» não cria projeto repetido (D-158)', lista.length + ' projetos');
  await escolherFotos(p, [...FOTOS, ...await verticais(p)]);
  await p.locator('#go').click(); await p.waitForURL('**/app/resumo/');
  await p.waitForFunction(() => /2 verticais/.test(document.getElementById('stats').textContent), null, { timeout: 8000 });
  let t = await p.locator('#stats').innerText();
  confere(/Instax Mini/.test(t) && /A5/.test(t) && !/Clássico/.test(t), 'resumo: folhas previstas com o formato e o papel escolhidos (D-159)', t.replace(/\n/g, ' ').slice(-80));
  await p.reload(); await p.waitForFunction(() => /2 verticais/.test(document.getElementById('stats').textContent), null, { timeout: 8000 });
  ok('resumo: recarregar mantém as fotos do projeto');
  await p.locator('#go').click(); await p.waitForURL('**/app/orientacao/');
  await p.waitForFunction(() => /entre as 5 fotos/.test(document.getElementById('dlg-d').textContent), null, { timeout: 8000 }).catch(() => {});
  t = await p.locator('#dlg-d').innerText(); const fundo = await p.locator('#fundo').innerText();
  confere(/2 verticais/.test(t) && /3 horizontais/.test(t) && /5 fotos/.test(t) && !/24 fotos/.test(t + fundo), 'orientação: números do projeto real, nunca os do exemplo (D-160)', t);
  await p.locator('#back').click(); await p.waitForURL('**/app/resumo/'); ok('orientação: «Voltar» devolve ao resumo');
  await p.locator('#go').click(); await p.waitForURL('**/app/orientacao/');
  await p.locator('#go').click(); await p.waitForURL('**/app/editor/');
  await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0, null, { timeout: 10000 });
  const ed = async pg => pg.evaluate(() => ({ titulo: document.title, status: document.getElementById('status').textContent, pols: document.querySelectorAll('#sheet .pol').length,
    prop: (() => { const b = document.querySelector('#sheet .pol').getBoundingClientRect(); return Math.min(b.width, b.height) / Math.max(b.width, b.height); })() }));
  let e = await ed(p);
  confere(/^Polar Life · Projeto de /.test(e.titulo) && !/Serra 2026/.test(e.titulo), 'editor abre o projeto real (não o exemplo)', e.titulo);
  confere(/^A5 /.test(e.status) && Math.abs(e.prop - 54 / 86) < .02, 'editor: papel A5 e moldura Instax Mini 54 × 86 chegaram da tela «Novo projeto» (D-159)', e.status + ' · proporção ' + e.prop.toFixed(3));
  await p.reload(); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0, null, { timeout: 10000 });
  const e2 = await ed(p);
  confere(e2.status === e.status && e2.pols === e.pols && e2.titulo === e.titulo, 'editor: recarregar mantém projeto, papel e formato', e2.status);

  /* aba nova: o estado vem do aparelho e nunca o exemplo é salvo por cima (D-157) */
  const q = await ctx.newPage(), vq = []; vigiar(q, vq);
  await q.goto(srv.url + 'app/editor/');
  await q.waitForFunction(() => /Projeto de /.test(document.title) && document.querySelectorAll('#sheet .pol').length > 0, null, { timeout: 10000 }).catch(() => {});
  const eq = await ed(q);
  confere(/Projeto de /.test(eq.titulo) && eq.status === e.status, 'aba nova: o editor abre o projeto atual, não o exemplo (D-157)', eq.titulo + ' · ' + eq.status);
  await q.locator('#guias').click(); await q.waitForTimeout(1300);
  lista = await projetos(q);
  confere(lista.length === 1 && lista[0].plfotos === '[1,2,3,4,5]', 'aba nova: mexer no editor não apaga as fotos do projeto salvo (D-157)', JSON.stringify(lista));
  await q.locator('#guias').click(); await q.waitForTimeout(1300);
  confere(!vq.length, 'aba nova: sem erros', vq.join(' ; ')); await q.close();
  await p.reload(); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0, null, { timeout: 10000 });

  /* Quadro e volta */
  await p.locator('#rail-q').click(); await p.waitForURL('**/app/editor/quadro/**'); await p.waitForTimeout(900);
  confere(/Projeto de .* · Quadro/.test(await p.title()), 'Folhas → Quadro mantém o projeto', await p.title());
  const col = p.locator('a.rail__i[href="../#colagem"]');
  confere(await col.count() === 1 && !/Em breve/.test(await col.innerText()), 'Quadro: «Colagem» é um link, sem «Em breve» (D-161)');
  await col.click(); await p.waitForURL('**/app/editor/'); await p.waitForFunction(() => document.getElementById('rail-colagem').classList.contains('is-on'), null, { timeout: 5000 }).catch(() => {});
  confere(await p.evaluate(() => document.getElementById('rail-colagem').classList.contains('is-on')), 'Quadro → Colagem abre as Folhas no modo Colagem');
  await p.locator('#rail-folhas').click(); await p.waitForTimeout(400);
  await p.goBack(); await p.waitForURL('**/app/editor/quadro/**'); await p.goBack(); await p.waitForURL(u => /\/app\/editor\/$/.test(u.pathname));
  ok('Voltar do navegador: Colagem → Quadro → Folhas');
  await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0, null, { timeout: 10000 });

  /* revisão → exportar → gerar */
  await p.locator('#go').click(); await p.locator('#pv-ok').waitFor({ state: 'attached', timeout: 5000 });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  confere(await p.evaluate(() => document.activeElement && document.activeElement.id === 'go'), 'revisão: Esc fecha e devolve o foco ao botão (T3)');
  await p.locator('#go').click(); await p.locator('label:has(#pv-ok)').click(); await p.locator('#pv-g').click();
  await p.waitForURL('**/app/editor/exportar/');
  ok('revisão → exportar');
  await p.goBack(); await p.waitForURL(u => /\/app\/editor\/$/.test(u.pathname)); await p.goForward(); await p.waitForURL('**/app/editor/exportar/');
  confere(await p.locator('#go').isVisible(), 'exportar: voltar e avançar mantém a revisão válida');
  await p.reload(); confere(await p.locator('#go').isVisible(), 'exportar: recarregar mantém a revisão válida');
  await p.locator('#go').click(); await p.waitForURL('**/app/editor/gerar/', { timeout: 10000 });
  await p.locator('text=Seu arquivo está pronto').waitFor({ timeout: 90000 });
  ok('exportar → gerar → «Seu arquivo está pronto»');
  confere(await p.locator('#b-folhas').getAttribute('href') === '../', 'arquivo pronto: há caminho de volta às folhas');
  await p.locator('#b-imprimir').click(); await p.waitForURL('**/app/editor/imprimir/');
  confere(await p.locator('#imprimir').isVisible(), 'gerar → imprimir');
  await p.goBack(); await p.waitForURL('**/app/editor/gerar/'); await p.locator('text=Seu arquivo está pronto').waitFor({ timeout: 90000 });
  ok('Voltar do imprimir devolve ao arquivo pronto');
  await p.locator('#b-compart').click(); await p.waitForURL('**/app/editor/compartilhar/');
  await p.locator('#voltar').click(); await p.waitForURL('**/app/editor/gerar/**'); ok('gerar → compartilhar → «Voltar ao arquivo»');

  /* ================= 3 · estados ================= */
  console.log('3 · estados');
  await p.goto(srv.url + 'app/novo-projeto/'); await p.locator('#continuar').click(); await p.waitForURL('**/app/adicionar-fotos/');
  await p.goto(srv.url + 'app/'); await p.waitForFunction(() => document.querySelectorAll('[data-open]').length === 2);
  lista = await projetos(p); const vazio = lista.find(x => !x.fotos), cheio = lista.find(x => x.fotos === 5);
  await p.locator(`[data-open="${vazio.id}"]`).click(); await p.waitForURL('**/app/adicionar-fotos/', { timeout: 8000 }).catch(() => {});
  confere(/adicionar-fotos/.test(p.url()), 'projeto sem fotos aberto pela lista continua em «Adicionar fotos», não no exemplo (D-158)', rel(p.url()));
  await p.goto(srv.url + 'app/'); await p.waitForFunction(() => document.querySelectorAll('[data-open]').length === 2);
  await p.locator(`[data-open="${cheio.id}"]`).click(); await p.waitForURL('**/app/editor/');
  await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0, null, { timeout: 10000 });
  e = await ed(p); confere(/^A5 /.test(e.status) && Math.abs(e.prop - 54 / 86) < .02, 'trocar de projeto: reabre com papel e formato salvos', e.status);
  await p.goBack(); await p.waitForURL(u => /\/app\/$/.test(u.pathname)); await p.waitForFunction(() => document.querySelectorAll('[data-open]').length === 2);
  await p.locator(`[data-more="${cheio.id}"]`).click(); await p.locator(`[data-act="excluir"][data-id="${cheio.id}"]`).click(); await p.locator('#dlg-del').click();
  await p.waitForFunction(() => document.querySelectorAll('[data-open]').length === 1);
  const resto = await p.evaluate(() => ({ atual: localStorage.getItem('pl-projeto-atual'), fotos: sessionStorage.getItem('pl-fotos'), quadro: sessionStorage.getItem('pl-quadro') }));
  confere(!resto.atual && !resto.fotos && !resto.quadro, 'excluir o projeto aberto limpa o estado dele na aba (D-157)', JSON.stringify(resto));
  confere(!v.filter(x => !/Service Worker/.test(x)).length, 'fluxo inteiro sem erro de página, console ou recurso 404', [...new Set(v)].join(' ; ').slice(0, 400));

  /* sair e voltar */
  await p.goto(srv.url + 'app/conta/'); await p.locator('#b-sair').click(); await p.waitForURL('**/app/entrar/**', { timeout: 8000 });
  await p.goBack(); await p.waitForTimeout(700);
  confere(/\/app\/entrar\//.test(p.url()), 'depois de sair, Voltar não reabre a conta', rel(p.url()));
  await p.goto(srv.url + 'app/conexoes/'); await p.locator('[data-perfil="pro"]').click(); await p.waitForURL('**/app/conexoes/', { timeout: 8000 }).catch(() => {});
  confere(/\/app\/conexoes\/$/.test(p.url()), '?voltar= leva à tela pedida depois de entrar', rel(p.url()));
  await p.evaluate(() => { localStorage.removeItem('pl-conta'); });
  await p.goto(srv.url + 'app/entrar/?voltar=' + encodeURIComponent('https://exemplo.com/')); await p.locator('[data-perfil="pro"]').click(); await p.waitForURL('**/app/inicio/', { timeout: 8000 }).catch(() => {});
  confere(/\/app\/inicio\/$/.test(p.url()), '?voltar= para fora do site é ignorado', p.url());
  await ctx.close();

  /* limite do Grátis: 2 folhas com a folha do mês ainda livre */
  const cg = await contexto('gratis@polarlife.test'), g = await cg.newPage();
  await g.goto(srv.url + 'app/novo-projeto/'); await g.locator('#continuar').click(); await g.waitForURL('**/app/adicionar-fotos/');
  await escolherFotos(g, [...FOTOS, ...await verticais(g)]);
  await g.goto(srv.url + 'app/editor/'); await g.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0, null, { timeout: 10000 });
  await g.locator('#go').click(); await g.locator('label:has(#pv-ok)').click(); await g.locator('#pv-g').click(); await g.waitForURL('**/app/editor/exportar/');
  await g.locator('#go').click(); await g.locator('.plportao:not([hidden])').waitFor({ timeout: 5000 });
  t = await g.locator('.plportao .led-dialog__title').textContent(); const b = await g.locator('.plportao .led-btn').innerText();
  confere(!/foi usada/.test(t) && /2 folhas/.test(t) && /Comprar 1 folha$/.test(b.trim()), 'Grátis com a folha do mês livre: o portão não diz que ela foi usada e cobra só a que falta (D-163)', t + ' · ' + b.trim());
  await cg.close();
} catch (err) {
  ruim('exceção: ' + String(err && err.stack || err).split('\n').slice(0, 3).join(' | '));
} finally {
  await nav.close(); srv.fechar();
}
console.log(falhas.length ? `\n✘ ${falhas.length} falha(s):\n- ${falhas.join('\n- ')}` : '\n✔ Navegação e fluxos: tudo certo');
process.exit(falhas.length ? 1 : 0);
