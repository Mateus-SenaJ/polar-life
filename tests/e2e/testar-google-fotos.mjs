/* Google Fotos pelo seletor oficial (D-168). Simula o Google inteiro (permissão, seletor e download) sem rede:
   pedido de permissão correto, volta pela tela de entrar, seletor numa janela, só as fotos escolhidas entram,
   token só na aba e nunca no projeto, cancelar/erro sem quebrar. */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (m) => console.log('  ✔ ' + m);
const ruim = (m) => { falhas++; console.log('  ✘ ' + m); };
const ESCOPO = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';
const JPG = await readFile(new URL('../../site/assets/img/fotos/praia.jpg', import.meta.url));
const srv = await servir();
const nav = await chromium.launch();
try {
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  let auth = null, autorizacao = [], apagou = 0, listou = 0;
  await ctx.route('https://accounts.google.com/**', (r) => { auth = r.request().url(); r.fulfill({ contentType: 'text/html', body: '<p>google</p>' }); });
  await ctx.route('https://photos.google.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p>seletor</p>' }));
  await ctx.route('https://photospicker.googleapis.com/**', (r) => {
    const q = r.request(), u = new URL(q.url());
    autorizacao.push(q.headers()['authorization'] || '');
    if (q.method() === 'POST' && u.pathname === '/v1/sessions') return r.fulfill({ json: { id: 's1', pickerUri: 'https://photos.google.com/picker/s1', pollingConfig: { pollInterval: '0.2s', timeoutIn: '60s' } } });
    if (q.method() === 'GET' && u.pathname === '/v1/sessions/s1') return r.fulfill({ json: { id: 's1', mediaItemsSet: true } });
    if (q.method() === 'GET' && u.pathname === '/v1/mediaItems') { listou++; return r.fulfill({ json: { mediaItems: [
      { id: 'a', type: 'PHOTO', mediaFile: { baseUrl: 'https://lh3.googleusercontent.com/f/a', mimeType: 'image/jpeg', filename: 'praia.jpg' } },
      { id: 'b', type: 'PHOTO', mediaFile: { baseUrl: 'https://lh3.googleusercontent.com/f/b', mimeType: 'image/jpeg', filename: 'mar.jpg' } },
      { id: 'c', type: 'VIDEO', mediaFile: { baseUrl: 'https://lh3.googleusercontent.com/f/c', mimeType: 'video/mp4', filename: 'v.mp4' } } ] } }); }
    if (q.method() === 'DELETE') { apagou++; return r.fulfill({ status: 200, json: {} }); }
    r.fulfill({ status: 404, body: '' });
  });
  const baixados = [];
  await ctx.route('https://lh3.googleusercontent.com/**', (r) => { baixados.push({ url: r.request().url(), auth: r.request().headers()['authorization'] || '' }); r.fulfill({ contentType: 'image/jpeg', body: JPG, headers: { 'access-control-allow-origin': '*' } }); });

  const p = await ctx.newPage();
  const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(srv.url + 'app/adicionar-fotos/', { waitUntil: 'networkidle' });
  (await p.locator('#btn-gfotos').isVisible()) ? ok('botão «Do Google Fotos» na tela de fotos') : ruim('botão do Google Fotos ausente');

  /* 1) sem acesso: pede só a permissão do seletor, voltando pela tela de entrar */
  await p.locator('#btn-gfotos').click();
  await p.waitForURL('https://accounts.google.com/**', { timeout: 8000 });
  const q = new URL(auth).searchParams;
  q.get('response_type') === 'token' && q.get('scope') === ESCOPO && q.get('redirect_uri') === srv.url + 'app/entrar/' && q.get('state')
    ? ok('permissão: só leitura das fotos escolhidas, volta por /app/entrar/') : ruim('pedido de permissão: ' + auth);

  /* 2) volta do Google: guarda o acesso na aba e segue para a tela de fotos */
  await p.goto(srv.url + 'app/entrar/#access_token=tk-123&token_type=Bearer&expires_in=3599&scope=' + encodeURIComponent(ESCOPO) + '&state=' + q.get('state'));
  await p.waitForURL('**/app/adicionar-fotos/', { timeout: 8000 });
  const v = await p.evaluate(() => ({ h: location.hash, a: JSON.parse(sessionStorage.getItem('pl-gfotos') || 'null'), toast: document.getElementById('toast-t').textContent }));
  v.a && v.a.token === 'tk-123' && v.h === '' && /conectado/.test(v.toast) ? ok('volta: acesso guardado só na aba, URL limpa, aviso «conectado»') : ruim('volta: ' + JSON.stringify(v));

  /* 3) seletor numa janela; só as fotos escolhidas (sem vídeo) entram */
  const [jan] = await Promise.all([ctx.waitForEvent('page'), p.locator('#btn-gfotos').click()]);
  await p.waitForFunction(() => /fotos do Google Fotos/.test(document.getElementById('toast-t').textContent), null, { timeout: 15000 });
  const t = await p.evaluate(() => document.getElementById('toast-t').textContent);
  /2 fotos do Google Fotos/.test(t) && /vídeos ficam de fora/.test(t) ? ok('2 fotos escolhidas entraram; vídeo fica de fora') : ruim('resultado: ' + t);
  baixados.length === 2 && baixados.every((b) => b.url.endsWith('=d') && b.auth === 'Bearer tk-123') ? ok('download só das fotos, com o token, na resolução original (=d)') : ruim('downloads: ' + JSON.stringify(baixados));
  autorizacao.every((a) => a === 'Bearer tk-123') && listou === 1 && apagou === 1 ? ok('sessão do seletor criada, lida e apagada no fim') : ruim(`api: ${JSON.stringify({ autorizacao, listou, apagou })}`);
  /picker\/s1\/autoclose$/.test(jan.url()) ? ok('janela do seletor oficial (photos.google.com) com fechamento automático') : ruim('janela: ' + jan.url());
  await p.waitForTimeout(800);
  const fotos = await p.evaluate(async () => (await PLFOTOS.todos()).length);
  fotos === 2 ? ok('as 2 fotos foram gravadas neste aparelho (IndexedDB)') : ruim('fotos gravadas: ' + fotos);
  const proj = await p.evaluate(async () => { const l = await PLPROJETOS.listar(); return JSON.stringify(l.map((x) => x.estado)); });
  !/tk-123/.test(proj) ? ok('o token nunca vai para o projeto salvo') : ruim('token vazou para o projeto');

  await jan.close();   /* o seletor real fecha sozinho (/autoclose) */
  /* 4) acesso expirado: o Google responde 401 → pede de novo, sem quebrar */
  await ctx.unroute('https://photospicker.googleapis.com/**');
  await ctx.route('https://photospicker.googleapis.com/**', (r) => r.fulfill({ status: 401, json: {} }));
  await Promise.all([ctx.waitForEvent('page'), p.locator('#btn-gfotos').click()]);
  await p.waitForFunction(() => /expirou/.test(document.getElementById('toast-t').textContent), null, { timeout: 8000 });
  (await p.evaluate(() => sessionStorage.getItem('pl-gfotos'))) === null ? ok('acesso expirado: avisa e esquece o token') : ruim('token expirado continuou guardado');

  /* 5) pessoa nega a permissão */
  await p.locator('#btn-gfotos').click();
  await p.waitForURL('https://accounts.google.com/**', { timeout: 8000 });
  const st = new URL(auth).searchParams.get('state');
  await p.goto(srv.url + 'app/entrar/#error=access_denied&state=' + st);
  await p.waitForURL('**/app/adicionar-fotos/', { timeout: 8000 });
  /não permitiu/.test(await p.evaluate(() => document.getElementById('toast-t').textContent)) ? ok('permissão negada: volta e explica') : ruim('negado sem aviso');
  erros.length === 0 ? ok('nenhum erro de página') : ruim('erros: ' + erros.join(' | '));

  /* 6) a central de conexões mostra o Google Fotos disponível */
  await p.goto(srv.url + 'app/conexoes/', { waitUntil: 'networkidle' });
  const card = await p.evaluate(() => { const n = document.getElementById('n-google'); const a = n && n.closest('article'); return a ? a.textContent : ''; });
  /Pronto para usar/.test(card) && !/Em breve/.test(card) ? ok('Conexões: Google Fotos «Pronto para usar»') : ruim('cartão: ' + card);
  await ctx.close();
} catch (e) { ruim('exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ Google Fotos: ${falhas} falha(s)` : '\n✔ Google Fotos: sem falhas');
process.exit(falhas ? 1 : 0);
