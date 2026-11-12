#!/usr/bin/env node
import { maisAbertos } from '../helpers/mais.mjs';
/* 36 · PWA do editor: manifesto, service worker só em /app/, offline, cache sem dados do usuário (T5),
   aviso de versão nova, instalar (botão secundário, T8), dica do iPhone, armazenamento e CSP do vercel.json.
   Uso: npm run testar:pwa */
import { chromium, devices } from 'playwright';
import { createServer, request } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { servir, SITE } from '../helpers/servidor.mjs';

const falhas = [];
const ok = (v, m) => { console.log((v ? '✔ ' : '✘ ') + m); if (!v) falhas.push(m); };
const cfg = JSON.parse(readFileSync(fileURLToPath(new URL('../../vercel.json', import.meta.url)), 'utf8'));
const hdr = (src, k) => ((cfg.headers.find(h => h.source === src) || { headers: [] }).headers.find(h => h.key === k) || {}).value;
const csp = hdr('/(.*)', 'Content-Security-Policy').replace('; upgrade-insecure-requests', '');

// Proxy do servidor de teste: aplica o CSP do vercel.json em tudo (inclusive no sw.js) e deixa trocar a versão do SW.
const base = await servir();
let versaoFalsa = null;
const prox = createServer((req, res) => {
  const o = request(base.url.replace(/\/$/, '') + req.url, { method: req.method }, r => {
    const h = { ...r.headers, 'content-security-policy': csp, 'cache-control': 'no-cache' };
    if (versaoFalsa && /\/app\/sw-arquivos\.js$/.test(req.url)) {
      const ch = []; r.on('data', c => ch.push(c)); r.on('end', () => {
        const t = Buffer.from(Buffer.concat(ch).toString('utf8').replace(/PL_VERSAO='[^']*'/, `PL_VERSAO='${versaoFalsa}'`));
        delete h['content-length']; res.writeHead(r.statusCode, h); res.end(t);
      }); return;
    }
    res.writeHead(r.statusCode, h); r.pipe(res);
  });
  o.on('error', () => { res.writeHead(502); res.end(); }); o.end();
});
await new Promise(r => prox.listen(0, '127.0.0.1', r));
const URL0 = `http://127.0.0.1:${prox.address().port}/`;
const nav = await chromium.launch();
const ctx = await nav.newContext();
await maisAbertos(ctx);   /* D-172: ajustes avançados à vista */
const CONTA = () => { try { localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })); } catch (e) { /* about:blank */ } };
await ctx.addInitScript(CONTA);
const violacoes = [], erros = [];
const vigiar = p => { p.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) violacoes.push(m.text().slice(0, 200)); }); p.on('pageerror', e => erros.push(e.message + ' @ ' + p.url())); };
ctx.on('page', vigiar);
const novaFoto = () => { const c = document.createElement('canvas'); c.width = 40; c.height = 30; c.getContext('2d').fillRect(0, 0, 40, 30); return new Promise(r => c.toBlob(r, 'image/jpeg')); };

try {
  // 1. manifesto
  const mf = JSON.parse(readFileSync(SITE + 'app/manifest.webmanifest', 'utf8'));
  ok(mf.name === 'PolarLive' && mf.short_name === 'PolarLive' && mf.lang === 'pt-BR' && mf.dir === 'ltr', 'manifesto: nome, short_name, lang e dir');
  ok(mf.start_url === './inicio/' && mf.scope === './' && mf.display === 'standalone' && mf.orientation === 'any', 'manifesto: start_url, scope, display e orientation');
  ok(mf.background_color === '#FFFFFF' && mf.theme_color === '#FFFFFF' && !!mf.description, 'manifesto: cores e descrição');
  ok(['photo', 'design', 'productivity'].every(c => (mf.categories || []).includes(c)), 'manifesto: categorias');
  ok(mf.shortcuts && mf.shortcuts[0].name === 'Novo projeto' && mf.shortcuts[0].url === './novo-projeto/', 'manifesto: atalho «Novo projeto»');
  let iconesOk = mf.icons.length >= 3, mask = false;
  for (const i of mf.icons) {
    const f = SITE + 'app/' + i.src;
    if (!existsSync(f)) { iconesOk = false; continue; }
    const b = readFileSync(f), w = b.readUInt32BE(16), h = b.readUInt32BE(20);
    if (i.sizes !== `${w}x${h}`) iconesOk = false;
    if (i.purpose === 'maskable' && w === 512) mask = true;
  }
  ok(iconesOk, 'manifesto: ícones existem e têm o tamanho declarado'); ok(mask, 'manifesto: ícone maskable 512');
  ok(hdr('/app/sw.js', 'Service-Worker-Allowed') === '/app/' && /no-cache/.test(hdr('/app/sw.js', 'Cache-Control')), 'vercel.json: cabeçalhos do sw.js');
  ok(/application\/manifest\+json/.test(hdr('/(.*)\\.webmanifest', 'Content-Type')), 'vercel.json: tipo do .webmanifest');
  ok(/worker-src 'self'/.test(csp) && /script-src 'self'(;|$)/.test(csp), 'CSP mantém script-src e worker-src em self');

  // 2. páginas públicas sem service worker
  const pub = await ctx.newPage();
  for (const rota of ['', 'legal/', 'como-funciona/']) {
    await pub.goto(URL0 + rota, { waitUntil: 'load' }); await pub.waitForTimeout(500);
    const r = await pub.evaluate(async () => ({ ctl: !!navigator.serviceWorker.controller, reg: !!(await navigator.serviceWorker.getRegistration(location.href)), pwa: !!window.PLPWA, man: !!document.querySelector('link[rel=manifest]') }));
    ok(!r.ctl && !r.reg && !r.pwa && !r.man, `/${rota} sem service worker nem manifesto`);
  }

  // 3. SW ativo em /app/ com escopo /app/
  const page = await ctx.newPage();
  await page.goto(URL0 + 'app/', { waitUntil: 'load' });
  const esc = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  ok(esc === URL0 + 'app/', 'service worker ativo com escopo /app/ (' + esc + ')');
  await page.waitForFunction(async () => (await caches.keys()).length > 0 && !!navigator.serviceWorker.controller, null, { timeout: 15000 });
  ok(await page.evaluate(() => document.querySelector('link[rel=manifest]').href) === URL0 + 'app/manifest.webmanifest', 'página do app aponta para o manifesto');
  ok(await page.evaluate(() => !!document.querySelector('meta[name=theme-color][content="#FFFFFF"]') && !!document.querySelector('link[rel=apple-touch-icon]') && !!document.querySelector('meta[name=apple-mobile-web-app-title]')), 'theme-color, apple-touch-icon e título no iOS');
  const esperado = await page.evaluate(async () => (await fetch('sw-arquivos.js').then(x => x.text()).then(t => t.match(/\n"/g) || [])).length);
  await page.waitForFunction(async n => { const k = (await caches.keys())[0]; return k && (await (await caches.open(k)).keys()).length >= n; }, esperado, { timeout: 30000 });
  ok(true, `pré-cache completo (${esperado} arquivos)`);

  // 4. offline: páginas abrem e funcionam
  await page.reload({ waitUntil: 'load' });                      // já controlada pelo SW
  await ctx.setOffline(true);
  for (const r of ['app/', 'app/editor/', 'app/editor/quadro/', 'app/editor/gerar/']) {
    const p = await ctx.newPage(), antes = erros.length;
    try {
      await p.goto(URL0 + r, { waitUntil: 'load', timeout: 15000 });
      await p.waitForTimeout(600);
      const t = await p.evaluate(() => ({ h: !!document.querySelector('h1,h2'), fonte: document.fonts.size > 0, url: location.pathname }));
      ok(t.h && t.fonte && t.url === '/' + r, `offline abre /${r}`);
    } catch (e) { ok(false, `offline abre /${r} (${e.message.split('\n')[0]})`); }
    ok(erros.length === antes, `offline sem erro de script em /${r}`);
    if (r === 'app/editor/gerar/') {
      const bytes = await p.evaluate(async () => (await PLGERADOR.pdf(PLGERADOR.projeto(), { f: 'leve' })).arquivos.map(a => a.bytes.length));
      ok(bytes.length > 0 && bytes[0] > 1000, `offline gera PDF da cena de exemplo (${Math.round(bytes[0] / 1024)} KB)`);
    }
    await p.close();
  }
  await ctx.setOffline(false);

  // 5. cache sem fotos, blob:, data: ou dados de projeto (T5)
  const home = await ctx.newPage();
  await home.goto(URL0 + 'app/', { waitUntil: 'load' });
  await home.evaluate(async novaFoto => {                        // guarda uma foto no IndexedDB, abre um blob: e grava uma legenda
    const b = await (0, eval)('(' + novaFoto + ')')();
    await PLFOTOS.salvar(1, new File([b], 'minha-foto.jpg', { type: 'image/jpeg' }));
    await fetch(URL.createObjectURL(b)).then(r => r.blob());
    sessionStorage.setItem('pl-quadro', JSON.stringify({ legenda: 'segredo-da-legenda' }));
  }, novaFoto.toString());
  await home.reload({ waitUntil: 'load' }); await home.waitForTimeout(500);
  const chaves = await home.evaluate(async () => { const o = []; for (const k of await caches.keys()) { const c = await caches.open(k); for (const r of await c.keys()) o.push(r.url); } return o; });
  const ruim = chaves.filter(u => !u.startsWith(URL0) || /^(blob|data):/.test(u) || /\.(jpe?g|heic|webp|polarlife)(\?|$)/i.test(u) || !/^\/(app|assets)\//.test(new URL(u).pathname));
  ok(chaves.length > 50 && ruim.length === 0, `cache só com código do app (${chaves.length} entradas, ${ruim.length} indevidas)`);
  const vazou = await home.evaluate(async () => { let t = ''; for (const k of await caches.keys()) { const c = await caches.open(k); for (const r of await c.keys()) { const x = await c.match(r); if (/text|javascript|json/.test(x.headers.get('content-type') || '')) t += await x.text(); } } return t.includes('segredo-da-legenda') || t.includes('minha-foto.jpg'); });
  ok(!vazou, 'nenhum dado de projeto, foto ou legenda no texto do cache');
  ok(await home.evaluate(async () => (await PLFOTOS.ler(1)) !== null), 'a foto continua só no IndexedDB');

  // 6. nova versão → toast «Atualizar»
  const antigo = await home.evaluate(async () => (await caches.keys()).filter(k => k.startsWith('polar-life-')));
  versaoFalsa = 'versao-nova-teste';
  await home.evaluate(async () => { window.__marca = 1; await (await navigator.serviceWorker.getRegistration()).update(); });
  await home.waitForSelector('#pwa-aviso button', { timeout: 15000 });
  const txt = await home.textContent('#pwa-aviso');
  ok(/Há uma versão nova do PolarLive\./.test(txt) && /Atualizar/.test(txt), 'aviso de versão nova com botão «Atualizar»');
  await home.waitForTimeout(800);
  ok(await home.evaluate(() => window.__marca === 1), 'não recarrega sozinho');
  await Promise.all([home.waitForEvent('load', { timeout: 15000 }), home.click('#pwa-aviso button')]);
  await home.waitForFunction(async () => (await caches.keys()).join() === 'polar-life-versao-nova-teste', null, { timeout: 15000 });
  ok(!antigo.includes('polar-life-versao-nova-teste') && antigo.length === 1, 'Atualizar recarrega e o cache antigo polar-life-* é apagado');
  versaoFalsa = null;

  // 7. instalar (Android/desktop): botão secundário, não LED (T8)
  const inst = await ctx.newPage();
  await inst.goto(URL0 + 'app/', { waitUntil: 'load' });
  ok(await inst.evaluate(() => document.getElementById('pwa-instalar').hidden), 'botão «Instalar» escondido sem o evento do navegador');
  const evento = r => { window.__prompts = window.__prompts || 0; const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => { window.__prompts++; return Promise.resolve(); }; e.userChoice = Promise.resolve({ outcome: r }); window.dispatchEvent(e); };
  await inst.evaluate(evento, 'accepted');
  const b = inst.locator('#pwa-instalar');
  ok(await b.isVisible() && /Instalar o PolarLive/.test(await b.textContent()), 'botão «Instalar o PolarLive» aparece com o evento');
  ok(await b.evaluate(x => x.classList.contains('btn2') && !x.classList.contains('led-btn') && !x.closest('.led-btn')), 'botão Instalar é secundário (btn2), não LED (T8)');
  ok((await b.boundingBox()).height >= 44, 'alvo do botão Instalar ≥ 44 px (T3)');
  ok(await inst.evaluate(() => document.querySelectorAll('.led-btn').length === 1   /* D-177: a tela central tem um só LED («Polaroids para imprimir») */ && !document.querySelector('#pwa-barra .led-btn')), 'T-01 não ganhou botão LED');
  await b.click(); await inst.waitForTimeout(200);
  ok(await inst.evaluate(() => window.__prompts === 1 && document.getElementById('pwa-instalar').hidden), 'clicar chama o prompt e o botão some');
  await inst.evaluate(evento, 'dismissed');
  ok(await inst.locator('#pwa-instalar').isVisible(), 'botão volta com novo evento');
  await inst.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  ok(await inst.evaluate(() => document.getElementById('pwa-instalar').hidden), 'some depois de instalado (appinstalled)');
  ok(await inst.evaluate(() => document.getElementById('pwa-dica-ios').hidden), 'dica do iPhone não aparece fora do iPhone');

  // 8. armazenamento: persist uma vez e aviso acima de 80%
  const arm = await ctx.newPage();
  await arm.addInitScript(() => {
    window.__persist = 0;
    navigator.storage.persist = () => { window.__persist++; return Promise.resolve(true); };
    navigator.storage.estimate = () => Promise.resolve({ usage: 85, quota: 100 });
  });
  await arm.goto(URL0 + 'app/', { waitUntil: 'load' });
  await arm.evaluate(async novaFoto => {
    localStorage.removeItem('pl-persist');
    const b = await (0, eval)('(' + novaFoto + ')')();
    await PLFOTOS.salvar(1, new File([b], 'a.jpg', { type: 'image/jpeg' })); await PLFOTOS.salvar(2, new File([b], 'b.jpg', { type: 'image/jpeg' }));
  }, novaFoto.toString());
  ok(await arm.evaluate(() => window.__persist === 1), 'storage.persist() é pedido uma única vez, na primeira foto');
  await arm.reload({ waitUntil: 'load' });
  const av = arm.locator('#aviso-espaco');
  await av.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}); // a estimativa é assíncrona: espera o aviso em vez de um tempo fixo (CI mais lento)
  ok(await av.isVisible() && /80%/.test(await av.textContent()) && (await av.locator('svg').count()) === 1, 'acima de 80%: aviso na T-01 com ícone e texto');
  ok(await arm.evaluate(async () => { const e = await PLPWA.espaco(); return e.cheio && Math.abs(e.fracao - 0.85) < 1e-9; }), 'PLPWA.espaco() calcula a fração usada');

  // 9. dica do iPhone (Safari): fechável e lembrada
  const ic = await nav.newContext({ ...devices['iPhone 13'] });
  await maisAbertos(ic);   /* D-172: ajustes avançados à vista */
  await ic.addInitScript(CONTA);
  const ip = await ic.newPage(); vigiar(ip);
  await ip.goto(URL0 + 'app/', { waitUntil: 'load' });
  const dica = ip.locator('#pwa-dica-ios');
  ok(await dica.isVisible() && /No iPhone: Compartilhar → Adicionar à Tela de Início/.test(await dica.textContent()) && (await dica.locator('svg').count()) >= 1, 'iPhone: dica com ícone de compartilhar');
  ok(!(await ip.locator('#pwa-instalar').isVisible()), 'iPhone: sem botão de prompt');
  ok((await ip.locator('#pwa-dica-fechar').boundingBox()).height >= 44, 'dica fechável com alvo ≥ 44 px');
  await ip.click('#pwa-dica-fechar');
  ok(!(await dica.isVisible()), 'dica fecha');
  await ip.reload({ waitUntil: 'load' }); await ip.waitForTimeout(300);
  ok(!(await dica.isVisible()), 'dica não volta depois de fechada (localStorage)');
  await ic.close();

  // 10. CSP do vercel.json (aplicado a tudo pelo proxy, inclusive ao sw.js) sem violações
  ok(violacoes.length === 0, 'CSP do vercel.json sem violações com o service worker' + (violacoes.length ? ': ' + violacoes[0] : ''));
  ok(erros.length === 0, 'sem erros de script' + (erros.length ? ': ' + erros[0] : ''));
} catch (e) { ok(false, 'exceção: ' + (e.stack || e)); }
finally { await nav.close(); prox.close(); base.fechar(); }
console.log(falhas.length ? `\n✘ PWA: ${falhas.length} falha(s)` : '\n✔ PWA: tudo certo');
process.exit(falhas.length ? 1 : 0);
