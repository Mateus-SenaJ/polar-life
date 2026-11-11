/* Legendas de projeto real (L1–L6) · MT-02 (Quadro, Folhas e PDF iguais) · D-138 (o local é o texto digitado).
   JPEGs gerados por canvas dentro do navegador, com um bloco EXIF montado aqui: nenhuma foto pessoal. */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SAIDA = fileURLToPath(new URL('../saida/legendas-reais/', import.meta.url));
mkdirSync(SAIDA, { recursive: true });
const srv = await servir(), nav = await chromium.launch({ headless: true });
const falhas = [], errosPg = [];
function ok(v, m) { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas.push(m); }
function titulo(t) { console.log('\n' + t); }

async function ctxNovo() {
  const c = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await c.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  return c;
}
async function criar(p, nome, datas, pocket) {
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.waitForFunction(() => !!window.PLFOTOS && !!window.PLPROJETOS && !!window.PLSESSAO);
  return p.evaluate(async o => {
    localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
    if (o.pocket) sessionStorage.setItem('pl-fmt', 'pocket');
    function exif(data) {
      const b = [], u16 = v => b.push(v & 255, v >> 8 & 255), u32 = v => { u16(v & 65535); u16(v >>> 16 & 65535); };
      b.push(73, 73); u16(42); u32(8); u16(2); u16(0x8769); u16(4); u32(1); u32(38); u16(0x8825); u16(4); u32(1); u32(76); u32(0);
      u16(1); u16(0x9003); u16(2); u32(20); u32(56); u32(0);
      for (const ch of data) b.push(ch.charCodeAt(0)); b.push(0); u16(0); u32(0);
      const corpo = [69, 120, 105, 102, 0, 0].concat(b), len = corpo.length + 2;
      return [255, 225, len >> 8, len & 255].concat(corpo);
    }
    const pr = await PLPROJETOS.criar(o.nome), ids = [];
    for (let i = 0; i < o.datas.length; i++) {
      const c = document.createElement('canvas'); c.width = 1200; c.height = 900;
      const x = c.getContext('2d');
      x.fillStyle = ['#C00000', '#0000C0', '#006194', '#FD761A'][i % 4]; x.fillRect(0, 0, 1200, 900);
      let bytes = new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/jpeg', .9))).arrayBuffer());
      if (o.datas[i]) {
        const a = exif(o.datas[i]), n2 = new Uint8Array(bytes.length + a.length);
        n2.set(bytes.slice(0, 2)); n2.set(a, 2); n2.set(bytes.slice(2), 2 + a.length); bytes = n2;
      }
      await PLFOTOS.salvar(i + 1, new File([bytes], 'foto-' + (i + 1) + '.jpg', { type: 'image/jpeg' }), pr.id);
      ids.push(i + 1);
    }
    sessionStorage.setItem('pl-fotos', JSON.stringify(ids));
    await PLSESSAO.salvarJa();
    return { id: pr.id };
  }, { nome, datas, pocket: !!pocket });
}
/* texto do PDF (a lista de exibição) e o estado do projeto */
async function pdfInfo(p) {
  await p.goto(srv.url + 'app/editor/gerar/');
  await p.waitForFunction(() => !!window.PLGERADOR);
  return p.evaluate(async () => {
    const pr = PLGERADOR.projeto();
    try { await PLGERADOR.preparar(pr, []) } catch (e) { }
    let txt = [];
    try {
      const l = PLGERADOR.lista(pr);
      (function w(o) {
        if (!o) return;
        if (Array.isArray(o)) return o.forEach(w);
        if (typeof o === 'object') { if (typeof o.txt === 'string' && o.t) txt.push(o.txt); Object.keys(o).forEach(k => { if (o[k] && typeof o[k] === 'object') w(o[k]) }) }
      })(l);
    } catch (e) { txt = ['ERRO ' + e] }
    return { fotos: pr.fotos.map(f => ({ n: f.n, leg: f.leg, m: f.m })), nome: pr.nome, txt };
  });
}
const capQuadro = p => p.evaluate(() => ({
  cap: (document.getElementById('cap') || {}).textContent,
  meta: (document.getElementById('cap-meta') || {}).textContent,
  xl: [].map.call(document.querySelectorAll('.lg-xl .lg-l'), e => e.textContent),
  meta1: PLQ.ST()[1] ? PLQ.ST()[1].meta : null,
  metaAtual: PLQ.ST()[PLQ.cur()] ? PLQ.ST()[PLQ.cur()].meta : null,
  titulo: document.title,
  nome: (document.querySelector('.eh__name') || {}).textContent
}));
const polFolhas = p => p.evaluate(() => [].map.call(document.querySelectorAll('#sheet .pol'), e => ({
  n: e.getAttribute('data-n'),
  cap: (e.querySelector('.pol__cap') || {}).textContent || '',
  meta: (e.querySelector('.pol__meta') || {}).textContent || '',
  ml: [].map.call(e.querySelectorAll('.pol__ml'), m => m.textContent),
  foot: (document.querySelector('.sheet__foot') || {}).textContent || ''
})));

try {
  const ctx = await ctxNovo(), p = await ctx.newPage();
  p.on('pageerror', e => errosPg.push(String(e)));
  p.setDefaultTimeout(30000);
  const pr = await criar(p, 'Praia 2025', ['2025:03:09 10:11:12', '2025:03:10 18:00:00', null, '2024:12:25 09:00:00']);

  titulo('L1 · projeto real sem texto de exemplo:');
  await p.goto(srv.url + 'app/editor/quadro/#foto-1');
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  await p.waitForTimeout(600);
  const q0 = await capQuadro(p);
  ok(q0.cap === '', 'a legenda da foto 1 fica vazia no Quadro («' + q0.cap + '»)');
  await p.click('#tab-legendas');
  await p.waitForSelector('#lg-in');
  ok((await p.inputValue('#lg-in')) === '', 'o campo «Texto desta foto» vem vazio');
  await p.click('#fnext'); await p.waitForTimeout(250);
  const q1 = await capQuadro(p);
  ok(q1.cap === '' && (await p.inputValue('#lg-in')) === '', 'a foto 2 também fica sem legenda de exemplo');
  await p.click('#fprev'); await p.waitForTimeout(250);

  titulo('L1 · o texto digitado vale só para a foto:');
  await p.click('#tab-legendas');
  await p.waitForSelector('#lg-in');
  await p.fill('#lg-in', 'Praia do Forte');
  await p.waitForTimeout(300);
  const comTexto = await capQuadro(p);
  ok(comTexto.cap === 'Praia do Forte', 'a foto 1 mostra o texto digitado (' + comTexto.cap + ')');
  await p.click('#fnext'); await p.waitForTimeout(250);
  const outra = await capQuadro(p);
  ok(outra.cap === '', 'a foto 2 continua sem legenda');
  await p.click('#fprev'); await p.waitForTimeout(250);

  titulo('L2 · metadados editados persistem:');
  await p.click('#tab-metadados');
  await p.waitForSelector('#md-c');
  const painel = await p.evaluate(() => document.getElementById('md-rd').innerText.replace(/\n+/g, ' | '));
  ok(/09\.03\.25 · 10:11/.test(painel), 'o painel mostra a data da foto (' + painel.slice(0, 40) + ')');
  ok(/Data da foto \(EXIF\)/.test(painel), 'o painel diz «Data da foto (EXIF)»');
  ok(/Origem \| Do aparelho/.test(painel), 'a origem é «Do aparelho»');
  ok(!/undefined/.test(painel), 'o painel não mostra «undefined»');
  ok((await p.inputValue('#md-d')) === '09/03/2025', 'o campo Data vem com 09/03/2025');
  await p.fill('#md-c', 'Recife'); await p.dispatchEvent('#md-c', 'change');
  await p.waitForTimeout(300);
  const comCidade = await capQuadro(p);
  ok(comCidade.meta1.c === 'Recife', 'a cidade digitada fica no estado da foto');
  await p.fill('#md-d', '09/03/2025'); await p.dispatchEvent('#md-d', 'change');
  await p.waitForTimeout(300);
  await p.evaluate(() => PLSESSAO.salvarJa());
  await p.waitForTimeout(200);
  await p.reload();
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  await p.waitForTimeout(600);
  const recarregado = await capQuadro(p);
  ok(recarregado.meta1.c === 'Recife', 'recarregar mantém a cidade (' + recarregado.meta1.c + ')');
  ok(String(recarregado.meta1.iso).indexOf('2025-03-09') === 0, 'recarregar mantém a data (' + recarregado.meta1.iso + ')');
  ok(/Recife/.test(recarregado.meta) && /09\.03\.25/.test(recarregado.meta), 'a legenda mostra a data e «Recife» (' + recarregado.meta + ')');
  ok(!/SP/.test(recarregado.meta), 'a legenda não inventa o estado («' + recarregado.meta + '»)');

  titulo('L4 · o local é exatamente o texto digitado (D-138):');
  await p.goto(srv.url + 'app/editor/');
  await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 4);
  await p.waitForTimeout(900);
  let pols = await polFolhas(p);
  ok(pols[0].meta === '09.03.25 • Recife', 'nas Folhas o local é «Recife» (' + pols[0].meta + ')');
  ok(!/SP/.test(pols.map(x => x.meta).join('|')), 'nenhum «SP» nas Folhas');
  const info = await pdfInfo(p);
  ok(info.fotos[0].m.c === 'Recife', 'o PDF lê a cidade digitada');
  ok(info.txt.some(t => t === 'Recife'), 'o PDF escreve «Recife» (' + JSON.stringify(info.txt) + ')');
  ok(!info.txt.some(t => /SP/.test(t)), 'o PDF não acrescenta estado');
  ok(info.txt.some(t => t === '09.03.25'), 'o PDF escreve a data (' + JSON.stringify(info.txt) + ')');
  ok(info.fotos[0].leg === 'Praia do Forte', 'o PDF escreve o texto da foto 1');
  ok(info.fotos[1].leg === '', 'a foto 2 vai sem texto para o PDF');

  /* ============ reabrir o projeto (mesmo aparelho: o mesmo IndexedDB) ============ */
  titulo('L2 · reabrir o projeto mantém cidade e data:');
  const p2 = await ctx.newPage();
  p2.on('pageerror', e => errosPg.push(String(e)));
  p2.setDefaultTimeout(30000);
  await p2.goto(srv.url + 'app/adicionar-fotos/');
  await p2.waitForFunction(() => !!window.PLFOTOS && !!window.PLPROJETOS);
  await p2.evaluate(async id => { sessionStorage.clear(); localStorage.removeItem('pl-projeto-atual'); await PLPROJETOS.abrir(id) }, pr.id);
  await p2.goto(srv.url + 'app/editor/quadro/#foto-1');
  await p2.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  await p2.waitForTimeout(700);
  const reab = await capQuadro(p2);
  ok(reab.meta1.c === 'Recife', 'reaberto: a cidade continua (' + JSON.stringify(reab.meta1) + ')');
  ok(/09\.03\.25/.test(reab.meta), 'reaberto: a data continua (' + reab.meta + ')');
  await p2.goto(srv.url + 'app/editor/');
  await p2.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 4);
  await p2.waitForTimeout(800);
  const reabFolhas = await polFolhas(p2);
  ok(/Recife/.test(reabFolhas[0].meta), 'reaberto: as Folhas mostram «Recife» (' + reabFolhas[0].meta + ')');
  const reabPdf = await pdfInfo(p2);
  ok(reabPdf.txt.some(t => t === 'Recife'), 'reaberto: o PDF mostra «Recife»');
  await p2.close();

  titulo('L3 · a mesma data no Quadro, nas Folhas e no PDF:');
  await p.goto(srv.url + 'app/editor/quadro/#foto-1');
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  await p.waitForTimeout(600);
  const dataQuadro = (await capQuadro(p)).meta;
  ok(/09\.03\.25/.test(dataQuadro), 'o Quadro mostra a data EXIF (' + dataQuadro + ')');
  ok(/09\.03\.25/.test(pols[0].meta), 'as Folhas mostram a mesma data');
  ok(info.txt.some(t => t === '09.03.25'), 'o PDF mostra a mesma data');
  await p.click('#fnext'); await p.click('#fnext'); await p.waitForTimeout(400);
  const semData = await capQuadro(p);
  ok(semData.metaAtual.iso === '' && !/\d\d\.\d\d\.\d\d/.test(semData.meta), 'a foto 3 (sem EXIF) fica sem data no Quadro (' + semData.meta + ')');
  await p.click('#fprev'); await p.click('#fprev'); await p.waitForTimeout(300);

  titulo('L4 · os controles de estado e país ficam só no exemplo:');
  await p.click('#tab-legendas');
  await p.waitForSelector('#lg-in');
  const realGrupos = await p.evaluate(() => ({
    uf: !!document.getElementById('l-uf'), pais: !!document.getElementById('l-pais'), ordem: !!document.getElementById('l-ordem'),
    texto: (document.getElementById('p-legendas') || {}).innerText || ''
  }));
  ok(!realGrupos.uf && !realGrupos.pais && !realGrupos.ordem, 'em projeto real não há Estado, País nem Ordem');
  ok(/Escreva a cidade como quer ver na legenda/.test(realGrupos.texto), 'há a orientação de escrever a cidade na aba Metadados');

  titulo('L2 · «Sem data» fica sem data:');
  await p.click('#tab-metadados');
  await p.waitForSelector('#md-d');
  await p.click('[data-clr="d"]');
  await p.waitForTimeout(300);
  await p.reload();
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  await p.waitForTimeout(600);
  const semDataDef = await capQuadro(p);
  ok(!/09\.03\.25/.test(semDataDef.meta), 'a foto continua sem data no Quadro (' + semDataDef.meta + ')');
  ok(semDataDef.meta1.ds === 'none', 'o estado registra «sem data»');

  titulo('L2 · projeto salvo com registro antigo:');
  await p.evaluate(() => {
    const q = JSON.parse(sessionStorage.getItem('pl-quadro') || 'null');
    q[1].meta = { temGps: true, iso: '2025-03-09T10:11:12' };
    sessionStorage.setItem('pl-quadro', JSON.stringify(q));
  });
  await p.reload();
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  await p.waitForTimeout(700);
  const antigo = await capQuadro(p);
  ok(antigo.meta1.iso === '2025-03-09T10:11', 'o registro antigo vira iso sem segundos (' + antigo.meta1.iso + ')');
  ok(antigo.meta1.ds === 'exif', 'o registro antigo passa a ter ds=exif');
  ok(/09\.03\.25/.test(antigo.meta), 'a data volta a aparecer (' + antigo.meta + ')');

  titulo('L6 · o nome real do projeto:');
  await p.waitForTimeout(400);
  const tit = await capQuadro(p);
  ok(/Praia 2025/.test(tit.titulo), 'o título da aba traz o nome do projeto (' + tit.titulo + ')');
  ok(!/Serra 2026/.test(tit.titulo), 'o nome de exemplo sumiu do título');
  ok(tit.nome === 'Praia 2025', 'o cabeçalho mostra o nome do projeto');
  await p.click('#fnext'); await p.waitForTimeout(400);
  ok(/Praia 2025/.test((await capQuadro(p)).titulo), 'o título continua certo depois de trocar de foto');

  titulo('L6 · o rodapé da folha e do PDF:');
  await p.goto(srv.url + 'app/editor/');
  await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 4);
  await p.waitForTimeout(600);
  await p.click('#rodape');
  await p.waitForTimeout(900);
  const rodape = await p.evaluate(() => ({ foot: (document.querySelector('.sheet__foot') || {}).textContent || '' }));
  ok(/^Praia 2025 · Folha 1 de/.test(rodape.foot), 'o rodapé da folha usa o nome do projeto (' + rodape.foot + ')');
  const pdfRodape = await pdfInfo(p);
  ok(pdfRodape.txt.some(t => /^PRAIA 2025 · FOLHA 1 DE/.test(t)), 'o rodapé do PDF usa o nome do projeto (' + JSON.stringify(pdfRodape.txt.filter(t => /FOLHA/.test(t))) + ')');
  await p.screenshot({ path: SAIDA + '01-folhas-praia-2025.png' });
  await ctx.close();

  /* ============ Retro Pocket: duas linhas ============ */
  titulo('L4 · Pocket em duas linhas:');
  const ctx3 = await ctxNovo(), p3 = await ctx3.newPage();
  p3.on('pageerror', e => errosPg.push(String(e)));
  p3.setDefaultTimeout(30000);
  await criar(p3, 'Pocket', ['2025:03:09 10:11:12', null], true);
  await p3.goto(srv.url + 'app/editor/quadro/#foto-1');
  await p3.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  await p3.waitForTimeout(700);
  await p3.click('#tab-metadados');
  await p3.waitForSelector('#md-c');
  await p3.fill('#md-c', 'Olinda'); await p3.dispatchEvent('#md-c', 'change');
  await p3.waitForTimeout(400);
  const pk = await capQuadro(p3);
  ok(pk.xl.length === 2 && pk.xl[0] === 'Olinda' && pk.xl[1] === '09/03/25', 'no Quadro do Pocket as linhas são «Olinda» e «09/03/25» (' + JSON.stringify(pk.xl) + ')');
  await p3.goto(srv.url + 'app/editor/');
  await p3.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 2);
  await p3.waitForTimeout(900);
  const pkF = await polFolhas(p3);
  ok(pkF[0].ml.length === 2 && pkF[0].ml[0] === 'Olinda' && pkF[0].ml[1] === '09/03/25', 'nas Folhas do Pocket as linhas são «Olinda» e «09/03/25» (' + JSON.stringify(pkF[0].ml) + ')');
  const pkPdf = await pdfInfo(p3);
  ok(pkPdf.txt.some(t => t === 'Olinda') && pkPdf.txt.some(t => t === '09/03/25'), 'no PDF do Pocket saem «Olinda» e «09/03/25» (' + JSON.stringify(pkPdf.txt) + ')');
  await p3.screenshot({ path: SAIDA + '02-pocket.png' });
  await ctx3.close();

  /* ============ o exemplo continua com os textos de exemplo ============ */
  titulo('L1 · o exemplo continua com os textos de exemplo:');
  const ctx4 = await ctxNovo(), p4 = await ctx4.newPage();
  p4.on('pageerror', e => errosPg.push(String(e)));
  p4.setDefaultTimeout(30000);
  await p4.goto(srv.url + 'app/editor/quadro/');
  await p4.waitForFunction(() => !!window.PLQ);
  await p4.waitForTimeout(700);
  const demo = await capQuadro(p4);
  ok(/Dias de sol|Nós dois|Dia de rolê|Meu parceiro/.test(demo.cap), 'no exemplo a legenda é a de exemplo (' + demo.cap + ')');
  await p4.click('#tab-legendas');
  await p4.waitForSelector('#lg-in');
  const demoGrupos = await p4.evaluate(() => ({ uf: !!document.getElementById('l-uf'), pais: !!document.getElementById('l-pais'), ordem: !!document.getElementById('l-ordem') }));
  ok(demoGrupos.uf && demoGrupos.pais && demoGrupos.ordem, 'no exemplo os grupos Estado, País e Ordem continuam');
  await ctx4.close();

  ok(errosPg.length === 0, 'nenhum erro de página' + (errosPg.length ? ': ' + errosPg[0] : ''));
} catch (e) { ok(false, 'exceção: ' + (e.stack || e)); }
finally { await nav.close(); srv.fechar(); }
console.log(falhas.length ? `\n✘ Legendas reais: ${falhas.length} falha(s)` : '\n✔ Legendas reais: sem falhas');
process.exit(falhas.length ? 1 : 0);
