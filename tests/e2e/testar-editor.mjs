import { abrirTudo, SECOES } from '../helpers/mais.mjs';
/* 37 · Editor no modo Folhas (T-07): abas funcionando, «Polaroid original» (D-135),
   formato com as medidas do catálogo (D-113) e guias de 0,15 mm no arquivo (D-121). */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

const srv = await servir(), nav = await chromium.launch({ headless: true }), page = await nav.newPage();
await page.addInitScript(abrirTudo, SECOES);   /* D-172: ajustes avançados à vista */
const falhas = [], errosPg = [];
function ok(v, m) { console.log((v ? '✔ ' : '✘ ') + m); if (!v) falhas.push(m); }
page.on('pageerror', e => errosPg.push(String(e)));
await page.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() }))); // D-123
const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/legenda-texto.js', 'assets/js/nucleo/gerador.js'];
const quadro = () => page.evaluate(() => JSON.parse(sessionStorage.getItem('pl-quadro') || 'null'));
async function listaPdf() {                                     // display list do arquivo (MT-02), achatada
  return page.evaluate(async () => {
    const p = PLGERADOR.projeto(); await PLGERADOR.preparar(p);
    const pg = PLGERADOR.lista(p).paginas[0], out = [];
    (function anda(xs) { xs.forEach(i => { out.push(i); if (i.itens) anda(i.itens); }); })(pg.itens || []);
    return out.map(i => ({ t: i.t, larg: i.larg, src: i.src, txt: i.txt }));
  });
}

try {
  await page.goto(srv.url + 'app/editor/');
  await page.evaluate(() => { sessionStorage.clear(); sessionStorage.setItem('pl-fotos', JSON.stringify([1, 2, 3, 4, 5, 6])); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0);
  for (const s of SCRIPTS) await page.addScriptTag({ url: srv.url + s });

  for (const id of ['tab-fotos', 'tab-ajustes', 'tab-legendas', 'tab-molduras']) {
    await page.click('#' + id);
    const txt = await page.locator('#p-outra').innerText();
    ok(!/não está disponível/i.test(txt) && txt.trim().length > 20, `aba ${id.slice(4)} funciona no modo Folhas`);
  }
  ok(!(await page.locator('#p-outra').innerText()).includes('Campos do Jordão'), 'painéis sem cidade de exemplo pré-preenchida (T7)');
  ok((await page.locator('#tab-metadados').count()) === 0, 'D-148: a aba Metadados não existe mais (Folhas)');

  /* D-121: guias de 0,15 mm no arquivo */
  const l0 = await listaPdf(), guias = l0.filter(i => i.t === 'linha');
  ok(guias.length > 0 && guias.every(i => i.larg === 150), `guias de corte com 150 µm no arquivo (${guias.length} linhas)`);
  ok(l0.some(i => i.t === 'texto'), 'com textos: legenda entra no arquivo');

  /* D-135: Polaroid original — some na tela e no arquivo, assinatura fica */
  await page.click('#tab-legendas'); await page.click('#ef-original');
  const tela = await page.evaluate(() => ({
    cap: [...document.querySelectorAll('#sheet .pol__cap, #sheet .pol__meta')].filter(e => e.offsetParent).length,
    sig: document.querySelectorAll('#sheet .pol__sig').length,
  }));
  ok(tela.cap === 0, 'Polaroid original: nenhuma legenda visível nas folhas');
  const l1 = await listaPdf();
  ok(!l1.some(i => i.t === 'texto'), 'Polaroid original: nenhum texto no arquivo');
  ok(tela.sig === 0 || l1.some(i => i.src === 'assinatura'), 'Polaroid original: a assinatura segue o plano (tela e arquivo)');
  ok((await quadro())[0].leg.original === true, 'a Polaroid original fica salva no projeto (desliga sem perder os dados)');
  await page.click('#ef-original');
  ok((await listaPdf()).some(i => i.t === 'texto'), 'desligar a Polaroid original devolve as legendas');

  /* D-113 · formato com as medidas do catálogo */
  await page.click('#tab-molduras');
  await page.selectOption('#ef-formato', 'mini');
  let fr = (await quadro())[0].fr;
  ok(fr.fmt === 'mini' && fr.w === 60 && fr.h === 73 && fr.lado === 6 && fr.jh === 48, `Mini 60 × 73 com janela 48 mm (${fr.w}×${fr.h}, lado ${fr.lado}, janela ${fr.jh})`);
  await page.selectOption('#ef-formato', 'pocket');
  const q = await quadro(); fr = q[0].fr;
  ok(fr.fmt === 'pocket' && fr.w === 66 && fr.h === 99 && fr.jh === 79 && fr.lado === 3, 'Pocket 66 × 99 com janela 60 × 79 (D-113)');
  ok(q[0].leg && q[0].leg.meta === 'linhas', 'Pocket entra com a legenda em duas linhas (D-113)');
  ok(q.slice(1).every(e => e.adj && 'temp' in e.adj && !('temperatura' in e.adj)), 'ajustes com as mesmas chaves do Quadro (temp)');

  /* limites dos ajustes */
  await page.click('#tab-ajustes');
  await page.fill('#ef-brilho', '250'); await page.dispatchEvent('#ef-brilho', 'change');
  ok((await quadro())[1].adj.brilho === 100, 'brilho limitado a +100');
  ok(!errosPg.length, 'nenhum erro de página' + (errosPg.length ? ': ' + errosPg[0] : ''));
} catch (e) { ok(false, 'exceção: ' + e.message); }
finally { await nav.close(); srv.fechar(); }
console.log(falhas.length ? `\n✘ editor: ${falhas.length} falha(s)` : '\n✔ editor: sem falhas');
process.exit(falhas.length ? 1 : 0);
