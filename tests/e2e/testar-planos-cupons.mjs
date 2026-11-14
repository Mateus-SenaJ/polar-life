/* D-208 · Folhas e planos: cartões alinhados, Pro com fundo preto e o único LED; código de folhas avulsas e cupom
   promocional (só o hash guardado; preço antes e depois; o cupom só é gasto com o pagamento aprovado; erros claros);
   cupons criados e revogados no Admin. Compra simulada (T7). */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0, n = 0;
const ok = (v, m) => { n++; console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
const pagar = async (p) => {
  await p.locator('.plportao:not([hidden])').waitFor({ timeout: 5000 });
  await p.locator('.plportao').getByRole('button', { name: 'Simular pagamento aprovado' }).click();
  await p.locator('.plportao .pp-act .led-btn').click();
  await p.locator('.plportao').getByRole('button', { name: 'Continuar' }).click(); await p.waitForTimeout(300);
};
try {
  console.log('\nAdmin cria o cupom:');
  const ca = await nav.newContext({ viewport: { width: 1366, height: 900 } });
  await ca.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'admin@polarlife.test', entrouEm: Date.now() })));
  const a = await ca.newPage(); await a.goto(srv.url + 'app/admin/'); await a.waitForSelector('#cup-form');
  await a.fill('#cup-texto', 'verao 10'); await a.fill('#cup-rot', 'Verão 2026'); await a.fill('#cup-val', '10');
  await a.uncheck('[name=cup-prod][value=folha_grande]', { force: true }); await a.fill('#cup-max', '5');
  await a.click('#cup-criar'); await a.waitForTimeout(400);
  const lista = await a.evaluate(() => PLCONTA.admin.listarCupons());
  ok(lista.length === 1 && lista[0].final === 'AO10' && lista[0].rotulo === 'Verão 2026' && lista[0].usosMax === 5, 'cupom criado: aparece pelo nome e pelo final (…' + (lista[0] || {}).final + ')');
  const guardado = await a.evaluate(() => localStorage.getItem('pl-cupons'));
  ok(!/VERAO10/.test(guardado), 'o texto do cupom não fica guardado, só o hash');
  await a.click('#cup-criar'); await a.waitForTimeout(200);
  ok(!(await a.isHidden('#cup-erro')), 'criar sem preencher mostra o erro do formulário');
  const estado = await ca.storageState(); await ca.close();

  console.log('\nFolhas e planos:');
  const cg = await nav.newContext({ viewport: { width: 1366, height: 900 }, storageState: estado });
  await cg.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'gratis@polarlife.test', entrouEm: Date.now() })));
  const p = await cg.newPage(); await p.goto(srv.url + 'app/conta/planos/'); await p.waitForSelector('#cartoes .pln');
  const lay = await p.evaluate(() => { const c = [...document.querySelectorAll('#cartoes .pln')].map((e) => e.getBoundingClientRect()); const pro = document.querySelector('.pln--pro');
    return { n: c.length, mesmaAltura: Math.max(...c.map((r) => r.height)) - Math.min(...c.map((r) => r.height)) < 2, mesmoTopo: Math.max(...c.map((r) => r.top)) - Math.min(...c.map((r) => r.top)) < 2, fundo: getComputedStyle(pro).backgroundColor, leds: document.querySelectorAll('.led-btn').length, ledNoPro: !!pro.querySelector('.led-btn') }; });
  ok(lay.n === 3 && lay.mesmaAltura && lay.mesmoTopo, 'no computador, 3 cartões lado a lado com a mesma altura');
  ok(lay.fundo === 'rgb(0, 0, 0)' && lay.leds === 1 && lay.ledNoPro, 'o Pro tem fundo preto e o único LED da tela (T8)');
  ok(await p.isVisible('a.voltar'), 'seta de voltar para a Conta');
  await p.fill('#in-cupom', 'naoexiste'); await p.click('#b-cupom'); await p.waitForTimeout(300);
  ok(/não encontrado/.test(await p.textContent('#m-cupom')) && (await p.getAttribute('#in-cupom', 'aria-invalid')) === 'true', 'cupom errado: «Cupom não encontrado» e o campo marcado');
  await p.fill('#in-cupom', 'Verao10'); await p.click('#b-cupom'); await p.waitForTimeout(300);
  const precos = await p.evaluate(() => ({ pro: document.querySelector('.pln--pro .pln__preco').textContent, avu: document.querySelector('#tot').textContent, ok: document.getElementById('cupom-ok').textContent }));
  ok(/R\$ 14,90\s*R\$ 13,41/.test(precos.pro) && /VERAO10/.test(precos.ok), 'cupom aplicado: o Pro mostra de R$ 14,90 por R$ 13,41 (' + precos.pro.replace(/\s+/g, ' ') + ')');
  ok(/R\$ 14,50\s*R\$ 13,05/.test(precos.avu), '5 folhas padrão com desconto: R$ 13,05 (' + precos.avu.replace(/\s+/g, ' ') + ')');
  await p.click('#b-pro'); await p.waitForTimeout(300);
  ok(/R\$ 13,41/.test(await p.locator('.plportao').textContent()), 'o pagamento simulado cobra o valor com o cupom');
  await pagar(p);
  const depois = await p.evaluate(() => ({ plano: PLCONTA.plano().id, rec: ((JSON.parse(localStorage.getItem('pl-contas-teste') || '{}')['gratis@polarlife.test'] || {}).recibos || []).map((r) => r.desc + ' ' + r.valor).join(' | '), usos: PLCONTA.admin.listarCupons()[0].usos }));
  ok(depois.plano === 'pro' && depois.usos === 1, 'assinou o Pro e o cupom contou 1 uso');
  ok(/cupom VERAO10/.test(depois.rec) && /13,41/.test(depois.rec), 'o recibo mostra o cupom e o valor pago (' + depois.rec.slice(0, 80) + ')');
  await p.fill('#in-cupom', 'VERAO10'); await p.click('#b-cupom'); await p.waitForTimeout(300);
  ok(/já usou/.test(await p.textContent('#m-cupom')), 'de novo na mesma conta: «Você já usou este cupom»');
  await cg.close();

  console.log('\nCódigo de folhas avulsas:');
  const cf = await nav.newContext({ viewport: { width: 390, height: 844 }, storageState: estado });
  await cf.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'folha@polarlife.test', entrouEm: Date.now() })));
  const f = await cf.newPage(); await f.goto(srv.url + 'app/conta/planos/'); await f.waitForSelector('#in-codigo');
  const cod = (await f.evaluate(() => PLCONTA.admin.gerarCodigos('avulso-basico', 1, 30)))[0].codigo;
  const antes = await f.evaluate(() => PLCONTA.plano().folhasCompradas.padrao);
  await f.fill('#in-codigo', 'PL12'); await f.click('#b-codigo'); await f.waitForTimeout(300);
  ok(/formato/.test(await f.textContent('#m-codigo')), 'formato errado: a mensagem diz como é o código');
  await f.fill('#in-codigo', cod); await f.click('#b-codigo'); await f.waitForTimeout(400);
  const dep = await f.evaluate(() => PLCONTA.plano().folhasCompradas.padrao);
  ok(/aceito/.test(await f.textContent('#m-codigo')) && dep > antes, 'código aceito: as folhas entram na conta (' + antes + ' → ' + dep + ')');
  await f.fill('#in-codigo', cod); await f.click('#b-codigo'); await f.waitForTimeout(300);
  ok(/já foi usado/.test(await f.textContent('#m-codigo')), 'o mesmo código de novo: «Este código já foi usado»');
  const cel = await f.evaluate(() => ({ larg: document.documentElement.scrollWidth <= innerWidth + 1, cols: new Set([...document.querySelectorAll('#cartoes .pln')].map((e) => Math.round(e.getBoundingClientRect().left))).size }));
  ok(cel.larg && cel.cols === 1, 'no celular, os cartões ficam um embaixo do outro, sem estourar para o lado');
  await cf.close();

  console.log('\nAdmin revoga:');
  const cr = await nav.newContext({ viewport: { width: 1366, height: 900 }, storageState: estado });
  await cr.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'admin@polarlife.test', entrouEm: Date.now() })));
  const r = await cr.newPage(); await r.goto(srv.url + 'app/admin/'); await r.waitForSelector('[data-cup][data-sit=revogado]');
  await r.click('[data-cup][data-sit=revogado]'); await r.waitForTimeout(200);
  ok((await r.evaluate(() => PLCONTA.admin.listarCupons()[0].situacao)) === 'revogado', 'cupom revogado no Admin');
  await r.evaluate(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const rr = await r.evaluate(() => PLCONTA.conferirCupom('VERAO10').then(() => 'ok', (e) => e.tipo));
  ok(rr === 'revogado', 'revogado, ninguém mais usa (' + rr + ')');
  await cr.close();
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.fechar();
console.log('\n' + (falhas ? '✘ ' + falhas + ' de ' + n + ' falharam' : '✔ ' + n + ' conferências'));
process.exit(falhas ? 1 : 0);
