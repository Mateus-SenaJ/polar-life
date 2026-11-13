/* D-208 · Editor: colagem Personalizada (arrastar, girar, mudar o tamanho, incluir e tirar polaroids), bolinhas de cor e de
   degradê (com cor do meio) iguais na tela e no PDF, Lucida Handwriting no catálogo, Conexões só com o que funciona e
   «Enviar para» Instagram e WhatsApp depois de gerar. Projeto de exemplo do site (nenhuma foto pessoal). */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0, n = 0;
const ok = (v, m) => { n++; console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/icc.js', 'assets/js/nucleo/gerador.js'];
const col = (p) => p.evaluate(() => JSON.parse(sessionStorage.getItem('pl-colagem') || '{}'));
try {
  const ctx = await nav.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(srv.url + 'app/editor/#colagem'); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol[data-ci]').length > 0); await p.waitForTimeout(300);

  console.log('\nColagem Personalizada:');
  const c0 = await col(p);
  ok(c0.layout !== 'livre', 'a colagem começa num layout automático (' + c0.layout + ')');
  const r0 = await p.evaluate(() => { const f = document.querySelector('#sheet .pol[data-ci="0"]'), r = f.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(r0.x, r0.y); await p.mouse.down(); await p.mouse.move(r0.x + 50, r0.y + 40, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(300);
  let c1 = await col(p);
  ok(c1.layout === 'livre' && Array.isArray(c1.livre) && c1.livre.length >= 1, 'arrastar uma polaroid passa a colagem para a Personalizada');
  ok(/Personalizada/.test(await p.textContent('#toast-t')), 'o aviso explica a mudança e como voltar ao automático');
  ok(await p.evaluate(() => !!document.querySelector('#sheet .pol.is-sel')), 'a polaroid arrastada fica selecionada (anel só na tela, fora da foto)');
  await p.click('#tab-colagem'); await p.waitForTimeout(200);
  const ult = (c) => c.livre[0][c.livre[0].length - 1];
  const a0 = ult(c1);
  await p.click('[data-livre="girar+"]'); await p.click('[data-livre="maior"]'); await p.waitForTimeout(200);
  let c2 = await col(p), a1 = ult(c2);
  ok(Math.abs(a1.rot - a0.rot - 5) < 0.01 && Math.abs(a1.s - a0.s - 0.1) < 0.001, 'girar e «Maior» mudam só a polaroid selecionada (giro +5°, tamanho +10%)');
  await p.keyboard.press('Escape'); await p.click('#sheet .pol[data-ci="0"]', { position: { x: 20, y: 20 } }); await p.waitForTimeout(200);
  const antesT = await col(p);
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('Shift+ArrowDown'); await p.waitForTimeout(200);
  const depT = await col(p);
  const i0 = (await p.evaluate(() => { const s = document.querySelector('#sheet .pol.is-sel'); return s ? +s.getAttribute('data-ci') : -1; }));
  ok(i0 >= 0 && JSON.stringify(antesT.livre) !== JSON.stringify(depT.livre), 'no teclado, as setas movem a polaroid selecionada (1 mm; com Shift, 5 mm)');
  const nAntes = depT.livre[0].length;
  const fora = await p.evaluate(() => { const b = document.querySelector('[data-liv-foto][aria-pressed="false"]'); return b ? b.getAttribute('data-liv-foto') : null; });
  if (fora) { await p.click('[data-liv-foto="' + fora + '"]'); await p.waitForTimeout(200); }
  const c3 = await col(p);
  ok(fora && c3.livre[0].length === nAntes + 1 && c3.livre[0].some((q) => q.src === +fora), 'incluir uma polaroid nesta folha (Foto ' + fora + ')');
  await p.click('[data-livre="tirar"]').catch(() => {}); await p.waitForTimeout(200);
  const c4 = await col(p);
  ok(c4.livre[0].length === nAntes, '«Tirar desta folha» tira a polaroid selecionada');
  /* a polaroid nunca sai da área impressa, mesmo arrastada para fora */
  const r1 = await p.evaluate(() => { const f = document.querySelector('#sheet .pol[data-ci="0"]'), r = f.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(r1.x, r1.y); await p.mouse.down(); await p.mouse.move(r1.x - 2000, r1.y - 2000, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(300);
  for (const s of SCRIPTS) await p.addScriptTag({ url: srv.url + s });
  const geo = await p.evaluate(() => { const proj = PLGERADOR.projeto(), R = PLFOLHAS.paginar(proj.s, proj.fr, proj.fotos), m = proj.s.margem;
    return { livre: !!R.livre, dentro: R.sheets.every((sh) => sh.cells.every((c) => PLCOLAGEM.dentro(c, R.p, m))), n: R.sheets[0].cells.length }; });
  ok(geo.livre && geo.dentro, 'arrastada para fora, a polaroid para na margem: todas dentro da área impressa (tela = PDF)');
  await p.selectOption('#col-layout', 'grade'); await p.waitForTimeout(200);
  ok((await col(p)).layout === 'grade' && !!(await col(p)).livre, 'escolher outro layout volta ao automático (a Personalizada fica guardada)');
  await p.selectOption('#col-layout', 'livre'); await p.waitForTimeout(200);
  ok((await col(p)).layout === 'livre', 'e dá para voltar à Personalizada pelo mesmo seletor');

  console.log('\nFundo em bolinhas:');
  await p.check('input[name=col-tipo][value=cor]', { force: true }); await p.waitForTimeout(200);
  const nb = await p.locator('[data-bola-cor]').count();
  await p.click('[data-bola-cor="#FADADD"]'); await p.waitForTimeout(200);
  ok(nb >= 12 && (await col(p)).fundo.cor === '#FADADD' && await p.getAttribute('[data-bola-cor="#FADADD"]', 'aria-checked') === 'true', nb + ' cores em bolinhas; tocar escolhe (marcada com ✓ e aria-checked, não só pela cor)');
  await p.check('input[name=col-tipo][value=gradiente]', { force: true }); await p.waitForTimeout(200);
  const ng = await p.locator('[data-bola-grad]').count();
  await p.click('[data-bola-grad="0"]'); await p.waitForTimeout(200);
  let f = (await col(p)).fundo;
  ok(ng >= 10 && f.cor3 && f.tipo === 'gradiente', ng + ' degradês prontos; o «Pôr do sol» tem 3 cores');
  await p.click('[data-dir="90"]'); await p.click('#col-inv'); await p.waitForTimeout(200);
  const f2 = (await col(p)).fundo;
  ok(f2.ang === 90 && f2.cor === f.cor2 && f2.cor2 === f.cor, 'direção em um toque e «Inverter as cores»');
  const bg = await p.evaluate(() => document.getElementById('sheet').style.background);
  ok((bg.match(/rgb\(/g) || []).length === 3 && /90deg/.test(bg), 'a tela pinta o degradê de 3 cores na direção escolhida');
  const item = await p.evaluate(() => { const L = PLGERADOR.lista(PLGERADOR.projeto()); const it = L.paginas[0].itens.find((x) => x.t === 'fundo'); return it && { cor: it.cor, cor2: it.cor2, cor3: it.cor3 }; });
  ok(item && item.cor3 === f2.cor3 && item.cor === f2.cor, 'o PDF leva as mesmas 3 cores (MT-02)');
  const pdf = await p.evaluate(async () => { const r = await PLGERADOR.pdf(PLGERADOR.projeto(), {}); return r.arquivos.length; });
  ok(pdf === 1, 'o PDF da colagem Personalizada com degradê de 3 cores sai');
  ok(!erros.length, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await ctx.close();

  console.log('\nLucida Handwriting no catálogo:');
  const ctx2 = await nav.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx2.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const q = await ctx2.newPage();
  await q.goto(srv.url + 'app/editor/'); await q.waitForTimeout(800);
  const cat = await q.evaluate(async () => { await PLFONTESLOCAIS.pronto; return { pc: PLTEXTO.CAT.pc, fontes: PLTEXTO.FONTES.filter((x) => x.c === 'pc').map((x) => x.n), pocket: PLTEXTO.legPocket(PLTEXTO.LEG0).data.font, est: PLFONTESLOCAIS.estado('Lucida Handwriting'), txt: PLFONTESLOCAIS.texto('Lucida Handwriting') }; });
  ok(cat.pc === 'Do seu computador' && cat.fontes.includes('Lucida Handwriting') && cat.fontes.includes('Lucida Calligraphy'), 'Lucida Handwriting e Lucida Calligraphy no grupo «Do seu computador»');
  ok(cat.pocket === 'Lucida Handwriting', 'o Retro Pocket nasce com a Lucida Handwriting');
  ok(/Courgette/.test(cat.txt) && cat.est !== 'ok', 'sem acesso à fonte do aparelho, o texto diz que entra a Courgette (' + cat.est + ')');
  const semArq = await q.evaluate(async () => (await fetch('../../assets/fonts/pdf/pl-lucida-handwriting-400-italico.ttf')).status);
  ok(semArq === 404, 'o site não distribui o arquivo da Lucida (fonte paga)');

  console.log('\nConexões e «Enviar para»:');
  await q.goto(srv.url + 'app/conexoes/'); await q.waitForTimeout(500);
  const cx = await q.evaluate(() => ({ t: document.body.textContent, cards: [...document.querySelectorAll('.cx__nome')].map((e) => e.textContent) }));
  ok(!/Pronto para usar/.test(cx.t), 'nenhum «Pronto para usar» nas Conexões');
  ok(!cx.cards.some((x) => /iCloud Fotos \(web\)|^Instagram$|^Facebook$/.test(x)), 'saíram iCloud (web), Instagram e Facebook, que não importam nada (' + cx.cards.join(', ') + ')');
  await ctx2.close();
  const ctx3 = await nav.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx3.addInitScript(() => { localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() }));
    window.__share = []; navigator.canShare = () => true; navigator.share = (d) => { window.__share.push(d.files.map((f) => f.name + '|' + f.type)); return Promise.resolve(); }; });
  const g = await ctx3.newPage();
  await g.goto(srv.url + 'app/editor/'); await g.waitForTimeout(800);
  await g.evaluate(() => { const k = (function () { let t = ''; try { t = (sessionStorage.getItem('pl-quadro') || '') + '|' + (sessionStorage.getItem('pl-folhas') || '') + '|' + (sessionStorage.getItem('pl-colagem') || ''); } catch (e) {} let h = 5381; for (let i = 0; i < t.length; i++)h = ((h << 5) + h + t.charCodeAt(i)) | 0; return String(h); })();
    sessionStorage.setItem('pl-prevoo', JSON.stringify({ ok: true, k, n: 1, fotos: 4, w: 210, h: 297 })); sessionStorage.setItem('pl-exportar', JSON.stringify({ f: 'polaroids', tipo: 'png', ppi: 150 })); });
  await g.goto(srv.url + 'app/editor/gerar/'); await g.waitForSelector('#fase-ok:not([hidden])', { timeout: 90000 }).catch(() => {});
  const env = await g.evaluate(() => ({ b: [...document.querySelectorAll('#enviar [data-app]')].map((x) => x.getAttribute('data-app')), h: (document.getElementById('enviar-h') || {}).textContent || '' }));
  ok(env.b.join() === 'instagram,whatsapp', 'depois de gerar as imagens: botões Instagram e WhatsApp');
  ok(/menu do aparelho/.test(env.h) && /Instagram/.test(env.h), 'o texto diz que o menu do aparelho abre com o arquivo (sem prometer abrir o app sozinho, T7)');
  await g.click('#enviar [data-app="instagram"]'); await g.waitForTimeout(300);
  const sh = await g.evaluate(() => window.__share);
  ok(sh.length === 1 && sh[0].length >= 1 && sh[0].every((x) => /\|image\//.test(x)), 'Instagram: o menu de compartilhar recebe as imagens (' + (sh[0] || []).length + ')');
  const alvo = await g.evaluate(() => [...document.querySelectorAll('#enviar .enviar__app')].map((b) => Math.round(b.getBoundingClientRect().height)));
  ok(alvo.every((h) => h >= 44), 'botões com 44 px ou mais (' + alvo.join(', ') + ')');
  await ctx3.close();
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.fechar();
console.log('\n' + (falhas ? '✘ ' + falhas + ' de ' + n + ' falharam' : '✔ ' + n + ' conferências'));
process.exit(falhas ? 1 : 0);
