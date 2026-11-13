/* Entrar com Google (D-147g): fluxo por redirecionamento, sem script do Google (T6).
   Simula a ida (intercepta accounts.google.com) e a volta (id_token no fragmento) com um ID de cliente de teste. */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (m) => console.log('  ✔ ' + m);
const ruim = (m) => { falhas++; console.log('  ✘ ' + m); };
const ID = '123-teste.apps.googleusercontent.com';
const fonte = await readFile(new URL('../../site/assets/js/nucleo/google.js', import.meta.url), 'utf8');
const comId = fonte.replace(/var CLIENT_ID='[^']*';/, "var CLIENT_ID='" + ID + "';");
const semId = fonte.replace(/var CLIENT_ID='[^']*';/, "var CLIENT_ID='';");
const real = (fonte.match(/var CLIENT_ID='([^']*)';/) || [])[1] || '';
if (comId === fonte) { console.log('✘ não achei CLIENT_ID em google.js'); process.exit(1); }

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = (c) => b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64(c) + '.assinatura';

const srv = await servir();
const nav = await chromium.launch();
const U = srv.url + 'app/entrar/';
try {
  /* 0) ID publicado: formato de ID de cliente web do Google (D-167) */
  /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(real) ? ok('ID do cliente Google configurado') : ruim('ID do cliente ausente ou inválido: ' + real);
  /* 1) sem ID configurado: continua demonstração (T7) */
  {
    const p = await nav.newPage();
    await p.route('**/assets/js/nucleo/google.js', (r) => r.fulfill({ contentType: 'application/javascript', body: semId }));
    await p.goto(U);
    await p.getByText('Continuar com o Google').click();
    await p.locator('#f-dados').waitFor({ timeout: 5000 });
    /Demonstração/.test(await p.locator('#caixa').textContent()) ? ok('sem ID: Google segue em demonstração, com aviso') : ruim('sem ID: aviso de demonstração ausente');
    await p.close();
  }
  const ctx = await nav.newContext();
  await ctx.route('**/assets/js/nucleo/google.js', (r) => r.fulfill({ contentType: 'application/javascript', body: comId }));
  let pedidoUrl = null;
  await ctx.route('https://accounts.google.com/**', (r) => { pedidoUrl = r.request().url(); r.fulfill({ contentType: 'text/html', body: '<p>google</p>' }); });
  const scripts = [];
  const p = await ctx.newPage();
  p.on('request', (q) => { if (q.resourceType() === 'script' && !q.url().startsWith(srv.url)) scripts.push(q.url()); });

  /* 2) ida: URL de autorização correta */
  await p.goto(U);
  await p.getByText('Continuar com o Google').click();
  await p.waitForURL('https://accounts.google.com/**', { timeout: 5000 });
  const q = new URL(pedidoUrl).searchParams;
  q.get('client_id') === ID && q.get('response_type') === 'id_token' && q.get('scope') === 'openid email profile' && q.get('redirect_uri') === U && q.get('state') && q.get('nonce')
    ? ok('ida: client_id, redirect_uri, id_token, escopo, state e nonce') : ruim('ida: parâmetros ' + pedidoUrl);
  const state = q.get('state'), nonce = q.get('nonce');
  const agora = Math.floor(Date.now() / 1000);
  const claims = { iss: 'https://accounts.google.com', aud: ID, exp: agora + 600, iat: agora, nonce, email: 'Ana.Google@Gmail.com', email_verified: true, name: 'Ana Souza' };

  /* 3) volta com conta nova: «Seus dados» com nome e e-mail do Google, sem aviso de demonstração */
  await p.goto(U + '#state=' + state + '&id_token=' + token(claims));
  await p.locator('#f-dados').waitFor({ timeout: 5000 });
  const v = await p.evaluate(() => ({ nome: document.getElementById('d-nome').value, email: document.getElementById('d-email').value, ro: document.getElementById('d-email').readOnly, txt: document.getElementById('caixa').textContent, hash: location.hash }));
  v.nome === 'Ana Souza' && v.email === 'ana.google@gmail.com' && v.ro && /Conta Google confirmada/.test(v.txt) && !/Demonstração/.test(v.txt)
    ? ok('volta: nome e e-mail do Google, e-mail fixo, sem «Demonstração»') : ruim('volta: ' + JSON.stringify(v));
  v.hash === '' ? ok('volta: token some da barra de endereço') : ruim('volta: token ficou na URL');
  await p.locator('#d-aceite').check();
  await p.locator('#b-dados').click();
  await p.waitForURL('**/app/inicio/', { timeout: 5000 });
  const s = await p.evaluate(() => PLCONTA.sessao());
  s && s.email === 'ana.google@gmail.com' && s.provedor === 'google' ? ok('aceite: entrou com provedor google') : ruim('aceite: sessão ' + JSON.stringify(s));

  /* 4) segunda vez: conta já aceita entra direto */
  await p.evaluate(() => PLCONTA.sair());
  await p.goto(U);
  await p.getByText('Continuar com o Google').click();
  await p.waitForURL('https://accounts.google.com/**', { timeout: 5000 });
  const q2 = new URL(pedidoUrl).searchParams;
  await p.goto(U + '#state=' + q2.get('state') + '&id_token=' + token({ ...claims, nonce: q2.get('nonce') }));
  await p.waitForURL('**/app/inicio/', { timeout: 5000 });
  ok('segunda vez: entra direto, sem «Seus dados»');

  /* 5) state errado, aud errado, expirado e cancelado: não entram */
  for (const [rot, hash] of [
    ['state errado', (st, no) => '#state=outro&id_token=' + token({ ...claims, nonce: no })],
    ['aud errado', (st, no) => '#state=' + st + '&id_token=' + token({ ...claims, nonce: no, aud: 'outro' })],
    ['expirado', (st, no) => '#state=' + st + '&id_token=' + token({ ...claims, nonce: no, exp: agora - 10 })],
    ['nonce errado', (st) => '#state=' + st + '&id_token=' + token({ ...claims, nonce: 'x' })],
    ['cancelado', (st) => '#state=' + st + '&error=access_denied'],
  ]) {
    await p.evaluate(() => PLCONTA.sair());
    await p.goto(U);
    await p.getByText('Continuar com o Google').click();
    await p.waitForURL('https://accounts.google.com/**', { timeout: 5000 });
    const qq = new URL(pedidoUrl).searchParams;
    await p.goto(U + hash(qq.get('state'), qq.get('nonce')));
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => ({ sess: PLCONTA.temSessao(), url: location.pathname, toast: (document.getElementById('toast-t') || {}).textContent || '' }));
    !r.sess && /\/app\/entrar\/$/.test(r.url) && /Google/.test(r.toast) ? ok(rot + ': não entra e avisa') : ruim(rot + ': ' + JSON.stringify(r));
  }
  scripts.length === 0 ? ok('nenhum script de terceiros carregado (T6)') : ruim('scripts externos: ' + scripts.join(', '));
  await ctx.close();
} catch (e) { ruim('exceção: ' + e.message); }
await nav.close(); await srv.fechar?.(); srv.close?.();
console.log(falhas ? '\n✘ Google: ' + falhas + ' falha(s)' : '\n✔ Google: sem falhas');
process.exit(falhas ? 1 : 0);
