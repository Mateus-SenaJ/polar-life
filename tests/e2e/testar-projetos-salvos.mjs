/* 44 · Projetos salvos no aparelho, datas reais das fotos (EXIF) e privacidade (T5, BR-06).
   JPEGs gerados por canvas no navegador, com um bloco EXIF montado aqui (sem fotos pessoais). */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

const srv = await servir(), nav = await chromium.launch({ headless: true });
const ctx = await nav.newContext(), falhas = [], errosPg = [];
function ok(v, m) { console.log((v ? '✔ ' : '✘ ') + m); if (!v) falhas.push(m); }
await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() }))); // D-123

/* escolhe n JPEGs na T-03 (via DataTransfer no input real). data = 'AAAA:MM:DD hh:mm:ss' ou null */
async function escolher(p, lista) {
  await p.evaluate(async lista => {
    function exif(data) {                              // APP1 «Exif\0\0» + TIFF II (deslocamentos a partir do início do TIFF)
      const b = [], u16 = v => b.push(v & 255, v >> 8 & 255), u32 = v => { u16(v & 65535); u16(v >>> 16 & 65535); };
      b.push(73, 73); u16(42); u32(8);                   // 0..7   cabeçalho; IFD0 em 8
      u16(3);                                            // 8      IFD0 com 3 entradas (até 50)
      u16(0x0112); u16(3); u32(1); u16(6); u16(0);       //        Orientation = 6
      u16(0x8769); u16(4); u32(1); u32(50);              //        Exif IFD em 50
      u16(0x8825); u16(4); u32(1); u32(88);              //        GPS IFD em 88 (vazio: só a presença)
      u32(0);                                            //        sem IFD seguinte
      u16(1); u16(0x9003); u16(2); u32(20); u32(68); u32(0);       // 50 Exif IFD: DateTimeOriginal em 68 (até 68)
      for (const ch of data) b.push(ch.charCodeAt(0)); b.push(0);  // 68 «AAAA:MM:DD hh:mm:ss\0» (20 bytes, até 88)
      u16(0); u32(0);                                    // 88 GPS IFD vazio
      const corpo = [69, 120, 105, 102, 0, 0].concat(b), len = corpo.length + 2;
      return [255, 225, len >> 8, len & 255].concat(corpo);
    }
    const files = [];
    for (let i = 0; i < lista.length; i++) {
      const c = document.createElement('canvas'); c.width = 1200; c.height = 900;
      const x = c.getContext('2d'); x.fillStyle = i % 2 ? '#006194' : '#FD761A'; x.fillRect(0, 0, 1200, 900);
      let bytes = new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/jpeg', .9))).arrayBuffer());
      if (lista[i]) { const a = exif(lista[i]); const n = new Uint8Array(bytes.length + a.length); n.set(bytes.slice(0, 2)); n.set(a, 2); n.set(bytes.slice(2), 2 + a.length); bytes = n; }
      files.push(new File([bytes], 'foto-' + (i + 1) + '.jpg', { type: 'image/jpeg' }));
    }
    const dt = new DataTransfer(); files.forEach(f => dt.items.add(f));
    const inp = document.getElementById('f-device'); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
  }, lista);
}

try {
  /* ---- unidade: o leitor EXIF dentro do navegador ---- */
  const p = await ctx.newPage(); p.on('pageerror', e => errosPg.push(String(e)));
  await p.goto(srv.url + 'app/novo-projeto/');
  await p.evaluate(() => { localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear(); });
  await p.evaluate(() => PLPROJETOS.criar('Viagem de teste'));
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await escolher(p, ['2025:03:09 10:11:12', '2025:03:10 18:00:00', null]);
  await p.locator('#btn-device').click();
  await p.waitForURL('**/processando/**', { timeout: 15000 });
  await p.goto(srv.url + 'app/resumo/'); await p.waitForFunction(() => !!window.PLFOTOS);
  const f1 = await p.evaluate(() => PLFOTOS.ler(1));
  ok(f1 && f1.meta && f1.meta.iso === '2025-03-09T10:11:12', 'EXIF: data original da foto 1 (' + (f1 && f1.meta && f1.meta.iso) + ')');
  ok(f1 && f1.meta && f1.meta.orientacao === 6 && f1.meta.temGps === true, 'EXIF: orientação 6 e GPS só como presença');
  const f3 = await p.evaluate(() => PLFOTOS.ler(3));
  ok(f3 && f3.meta && !f3.meta.iso, 'foto sem EXIF fica sem data');

  /* legendas reais: data da foto, nada de exemplo */
  await p.goto(srv.url + 'app/editor/');
  await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 3);
  const leg = await p.locator('#sheet').innerText();
  ok(/09\/03\/25/.test(leg), 'legenda usa a data real da foto (09/03/25)');
  ok(!/Campos do Jordão|Dias de sol|Nós dois|14\.07\.26/.test(leg), 'nenhum texto de exemplo nas fotos reais');
  ok(/Viagem de teste/.test(await p.title()) || /Viagem de teste/.test(await p.locator('body').innerText()), 'nome real do projeto na tela');

  /* ajuste na foto 1, depois «fechar a aba» */
  await p.goto(srv.url + 'app/editor/quadro/'); await p.waitForFunction(() => !!window.PLQ && !!window.PLSESSAO);
  await p.evaluate(async () => { const q = JSON.parse(sessionStorage.getItem('pl-quadro')); q[1].adj.brilho = 37; sessionStorage.setItem('pl-quadro', JSON.stringify(q)); await PLSESSAO.salvarJa(); });
  await p.close();

  /* ---- reabrir: T-01 lista e abre o projeto com as mesmas fotos ---- */
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errosPg.push(String(e)));
  await p2.goto(srv.url + 'app/');
  await p2.locator('.card').first().waitFor({ timeout: 10000 });
  const cartao = await p2.locator('.card').first().innerText();
  ok(/Viagem de teste/.test(cartao) && /3 fotos/.test(cartao), 'T-01 lista o projeto salvo (nome e 3 fotos)');
  await p2.evaluate(() => PLFOTOS.limpar());                  // garante que «abrir» recopia as fotos do projeto
  await p2.locator('.card__name a').first().click();          // tocar no nome abre de verdade
  await p2.waitForURL('**/editor/**', { timeout: 10000 });
  await p2.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 3);
  const reab = await p2.evaluate(async () => ({ f1: await PLFOTOS.ler(1), q: JSON.parse(sessionStorage.getItem('pl-quadro') || 'null') }));
  ok(reab.f1 && reab.f1.blob && reab.f1.meta.iso === '2025-03-09T10:11:12', 'reaberto: a foto 1 volta para o arquivo do PDF');
  ok(reab.q && reab.q[1] && reab.q[1].adj && reab.q[1].adj.brilho === 37, 'reaberto: o ajuste salvo volta (brilho 37)');

  /* ---- acrescentar fotos num projeto aberto: entram no fim, nada se perde ---- */
  await p2.goto(srv.url + 'app/adicionar-fotos/');
  await escolher(p2, ['2025:04:01 09:00:00', null]);
  await p2.locator('#btn-device').click();
  await p2.waitForURL('**/processando/**', { timeout: 15000 });
  await p2.goto(srv.url + 'app/resumo/'); await p2.waitForFunction(() => !!window.PLFOTOS);
  const ap = await p2.evaluate(async () => ({ lista: JSON.parse(sessionStorage.getItem('pl-fotos')), q: JSON.parse(sessionStorage.getItem('pl-quadro') || 'null'), f1: await PLFOTOS.ler(1), f4: await PLFOTOS.ler(4) }));
  ok(JSON.stringify(ap.lista) === '[1,2,3,4,5]', 'acrescentar: lista 1..5 (as novas no fim)');
  ok(ap.f1 && ap.f1.meta.iso === '2025-03-09T10:11:12' && ap.f4 && ap.f4.meta.iso === '2025-04-01T09:00:00', 'acrescentar: foto 1 intacta e foto 4 nova');
  ok(ap.q && ap.q.length === 6 && ap.q[1].adj.brilho === 37, 'acrescentar: quadro mantém os ajustes e ganha 2 polaroids');

  /* ---- renomear, duplicar, excluir, .polarlife ---- */
  await p2.goto(srv.url + 'app/editor/'); await p2.waitForFunction(() => !!window.PLPROJETOS);
  const r = await p2.evaluate(async () => {
    const id = PLPROJETOS.atual();
    if (window.PLSESSAO && PLSESSAO.salvarJa) await PLSESSAO.salvarJa();
    await PLPROJETOS.renomear(id, 'Serra 2025');
    const dup = await PLPROJETOS.duplicar(id);
    let lista = await PLPROJETOS.listar();
    const nomes = lista.map(x => x.nome + ':' + x.fotos);
    const pacote = await PLPROJETOS.exportar(id), json = JSON.stringify(pacote);
    const imp = await PLPROJETOS.importar(JSON.parse(json));
    lista = await PLPROJETOS.listar();
    const impL = lista.find(x => x.id === (imp && imp.id));
    await PLPROJETOS.excluir(dup && dup.id ? dup.id : dup);
    const depois = (await PLPROJETOS.listar()).length;
    return { nomes, json, versao: pacote.versao, nFotos: pacote.fotos.length, imp: impL && impL.fotos, total: lista.length, depois,
      sess: JSON.stringify(Object.assign({}, sessionStorage)) };
  });
  ok(r.nomes.some(n => n.startsWith('Serra 2025:')) && r.nomes.some(n => /\(cópia\):5$/.test(n)), 'renomear e duplicar (a cópia leva as 5 fotos)');
  ok(r.versao === 1 && r.nFotos === 5 && r.imp === 5, '.polarlife exporta e reimporta as 5 fotos com checksum');
  ok(r.depois === r.total - 1, 'excluir remove só o projeto escolhido');
  const semCoord = !/latitude|longitude|GPSLat|GPSLong|"lat"|"lng"/i.test(r.json + r.sess);
  ok(semCoord, 'nenhuma coordenada no .polarlife nem no sessionStorage (BR-06)');
  ok(!errosPg.length, 'nenhum erro de página' + (errosPg.length ? ': ' + errosPg[0] : ''));
} catch (e) { ok(false, 'exceção: ' + e.message); }
finally { await nav.close(); srv.fechar(); }
console.log(falhas.length ? `\n✘ projetos salvos: ${falhas.length} falha(s)` : '\n✔ projetos salvos: sem falhas');
process.exit(falhas.length ? 1 : 0);
