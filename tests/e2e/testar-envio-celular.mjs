/* D-210 · Envio de fotos no celular: o tamanho vem do cabeçalho (sem decodificar a foto inteira, que estourava a memória
   do celular com fotos de 50 MP ou mais), uma foto por vez, a que falha não derruba as outras, HEIC avisado também pelo
   tipo (nome sem extensão) e a tela «Preparando» com o motivo de verdade. Fotos de exemplo do site; as pessoais do dono
   (.local, só leitura) conferem a orientação quando existem. */
import { chromium, devices } from 'playwright';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0, n = 0;
const ok = (v, m) => { n++; console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
const DEMO = 'site/assets/img/fotos/', demo = readdirSync(DEMO).filter((f) => /\.jpg$/.test(f)).slice(0, 8);
const PES = process.env.PL_FOTOS || '.local/fotos-de-teste/';
try {
  const ctx = await nav.newContext({ ...devices['Pixel 7'] });
  await ctx.addInitScript(() => { localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() }));
    /* conta as decodificações cheias (sem redução) que acontecem enquanto as fotos são gravadas */
    const cib = window.createImageBitmap; window.__cheias = 0; window.__simult = 0; window.__max = 0;
    window.createImageBitmap = function (b, o) { const cheia = !(o && (o.resizeWidth || o.resizeHeight)) && !/heic|heif/i.test(b && b.type || ''); if (cheia) window.__cheias++;   /* o teste de HEIC não conta */ window.__simult++; window.__max = Math.max(window.__max, window.__simult);
      return cib.apply(this, arguments).finally(() => { window.__simult--; }); }; });
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(srv.url + 'app/adicionar-fotos/'); await p.waitForTimeout(500);
  const arquivos = demo.map((f) => ({ name: f, mimeType: 'image/jpeg', buffer: readFileSync(DEMO + f) }))
    .concat([{ name: 'IMG_0001.heic', mimeType: 'image/heic', buffer: Buffer.from('nao e uma imagem de verdade') }, { name: '1000012345', mimeType: 'image/heic', buffer: Buffer.from('tambem nao') }]);
  await p.setInputFiles('#f-device', arquivos);
  await p.waitForFunction(() => document.getElementById('btn-device') && document.getElementById('btn-device').getAttribute('aria-busy') !== 'true' && !!document.querySelector('#got .msg--ok'), null, { timeout: 30000 });
  await p.waitForTimeout(800);
  const r = await p.evaluate(async () => ({ todos: (await PLFOTOS.todos()).length, cheias: window.__cheias, toast: document.getElementById('toast').hidden ? '' : document.getElementById('toast-t').textContent,
    regs: await Promise.all((await PLFOTOS.todos()).map((k) => PLFOTOS.ler(k).then((x) => x.w + 'x' + x.h))) }));
  ok(r.todos === 8 && r.regs.every((x) => /^\d+x\d+$/.test(x) && !/^0x|x0$/.test(x)), 'as 8 fotos JPEG foram gravadas com largura e altura (' + r.regs.slice(0, 3).join(', ') + '…)');
  ok(r.cheias === 0, 'nenhuma foto foi decodificada inteira só para medir (decodificações cheias: ' + r.cheias + ')');
  ok(/HEIC/.test(r.toast), 'os dois HEIC (um sem extensão no nome) ficaram de fora com aviso claro: «' + r.toast + '»');
  await p.click('#btn-device').catch(() => {});
  const go = p.locator('#go'); if (await go.count()) { await p.waitForTimeout(300); }
  await p.goto(srv.url + 'app/processando/'); await p.waitForFunction(() => /Concluído/.test(document.body.innerText), null, { timeout: 30000 });
  const pr = await p.evaluate(() => document.body.innerText);
  ok(/8 fotos prontas/.test(pr) && !/com erro/.test(pr), '«Preparando suas fotos»: 8 prontas, nenhuma com erro');
  ok(!erros.length, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
  /* uma que falha no meio não derruba as outras e a tela diz o motivo */
  await p.goto(srv.url + 'app/adicionar-fotos/'); await p.evaluate(() => { localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear(); });
  await p.reload(); await p.waitForTimeout(400);
  await p.evaluate(() => { const s = PLFOTOS.salvar; PLFOTOS.salvar = function (n, f, pid) { return n === 2 ? Promise.reject(new Error('teste')) : s.apply(this, arguments); }; });
  await p.setInputFiles('#f-device', demo.slice(0, 4).map((f) => ({ name: f, mimeType: 'image/jpeg', buffer: readFileSync(DEMO + f) })));
  await p.waitForTimeout(2500);
  const r2 = await p.evaluate(async () => ({ todos: (await PLFOTOS.todos()).length, toast: document.getElementById('toast-t').textContent }));
  ok(r2.todos === 3 && /não abriu/.test(r2.toast) && /outras fotos seguem/.test(r2.toast), 'uma foto que falha não derruba as outras: 3 de 4 gravadas, com aviso («' + r2.toast + '»)');
  await Promise.all([p.waitForURL('**/app/processando/**', { timeout: 15000 }), p.click('#btn-device')]); await p.waitForFunction(() => /Concluído/.test(document.body.innerText), null, { timeout: 30000 });
  ok(/não conseguiu abrir a foto/.test(await p.evaluate(() => document.body.innerText)), '«Preparando»: a foto que falhou mostra o motivo de verdade (não «não está mais neste aparelho»)');
  await ctx.close();
  /* fotos de celular de verdade (do dono, só leitura): tamanho com a orientação certa */
  if (existsSync(PES)) {
    const reais = readdirSync(PES).filter((f) => /\.jpe?g$/i.test(f)).slice(0, 6);
    const c2 = await nav.newContext({ ...devices['Pixel 7'] });
    await c2.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
    const q = await c2.newPage(); await q.goto(srv.url + 'app/adicionar-fotos/'); await q.waitForTimeout(400);
    const dif = [];
    for (const f of reais) {
      const b64 = readFileSync(PES + f).toString('base64');
      const d = await q.evaluate(async ([b64, nome]) => { const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), file = new File([bin], nome, { type: 'image/jpeg' });
        await PLFOTOS.salvar(900, file, ''); const r = await PLFOTOS.ler(900), bm = await createImageBitmap(file, { imageOrientation: 'from-image' }), o = { reg: r.w + 'x' + r.h, real: bm.width + 'x' + bm.height }; bm.close(); return o; }, [b64, f]);
      if (d.reg !== d.real) dif.push(f + ' ' + d.reg + ' ≠ ' + d.real);
    }
    ok(!dif.length, reais.length + ' fotos de celular de verdade: o tamanho gravado bate com a foto girada pelo EXIF' + (dif.length ? ' · ' + dif.join('; ') : ''));
    await c2.close();
  } else console.log('  – sem .local/fotos-de-teste: conferência com fotos reais pulada');
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.fechar();
console.log('\n' + (falhas ? '✘ ' + falhas + ' de ' + n + ' falharam' : '✔ ' + n + ' conferências'));
process.exit(falhas ? 1 : 0);
