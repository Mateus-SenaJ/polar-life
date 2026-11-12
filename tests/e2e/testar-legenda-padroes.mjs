/* Legenda avançada (D-139): padrão de 2 linhas, sugestões do EXIF, exceção por foto, texto manual, «Sugestões de legendas».
   JPEGs gerados por canvas com EXIF montado aqui (data e GPS): nenhuma foto pessoal. Tela = Folhas = PDF (MT-02). */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';
import { maisAbertos } from '../helpers/mais.mjs';

const srv = await servir(), nav = await chromium.launch({ headless: true });
const falhas = [], errosPg = [];
function ok(v, m) { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas.push(m); }
function titulo(t) { console.log('\n' + t); }

async function criar(p, nome, fotos) {
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.waitForFunction(() => !!window.PLFOTOS && !!window.PLPROJETOS && !!window.PLSESSAO);
  return p.evaluate(async o => {
    localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
    function exif(data, gps) {
      const b = [], u16 = v => b.push(v & 255, v >> 8 & 255), u32 = v => { u16(v & 65535); u16(v >>> 16 & 65535); };
      const rat = g => { const d = Math.floor(Math.abs(g)), m = Math.floor((Math.abs(g) - d) * 60), s = Math.round(((Math.abs(g) - d) * 60 - m) * 60 * 100); u32(d); u32(1); u32(m); u32(1); u32(s); u32(100); };
      b.push(73, 73); u16(42); u32(8);
      u16(2); u16(0x8769); u16(4); u32(1); u32(38); u16(0x8825); u16(4); u32(1); u32(76); u32(0);    /* IFD0 → Exif em 38, GPS em 76 */
      u16(1); u16(0x9003); u16(2); u32(20); u32(56); u32(0);                                          /* Exif: data em 56 */
      for (const ch of data) b.push(ch.charCodeAt(0)); b.push(0);
      u16(4); u16(1); u16(2); u32(2); b.push(gps[0] < 0 ? 83 : 78, 0, 0, 0);                         /* GPS em 76 */
      u16(2); u16(5); u32(3); u32(130); u16(3); u16(2); u32(2); b.push(gps[1] < 0 ? 87 : 69, 0, 0, 0);
      u16(4); u16(5); u32(3); u32(154); u32(0); rat(gps[0]); rat(gps[1]);
      const corpo = [69, 120, 105, 102, 0, 0].concat(b), len = corpo.length + 2;
      return [255, 225, len >> 8, len & 255].concat(corpo);
    }
    const pr = await PLPROJETOS.criar(o.nome), ids = [];
    for (let i = 0; i < o.fotos.length; i++) {
      const c = document.createElement('canvas'); c.width = 1200; c.height = 900;
      const x = c.getContext('2d'); x.fillStyle = ['#C00000', '#0000C0', '#006194'][i % 3]; x.fillRect(0, 0, 1200, 900);
      let bytes = new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/jpeg', .9))).arrayBuffer());
      const f = o.fotos[i];
      if (f) { const a = exif(f.d, f.g), n2 = new Uint8Array(bytes.length + a.length); n2.set(bytes.slice(0, 2)); n2.set(a, 2); n2.set(bytes.slice(2), 2 + a.length); bytes = n2; }
      await PLFOTOS.salvar(i + 1, new File([bytes], 'foto-' + (i + 1) + '.jpg', { type: 'image/jpeg' }), pr.id);
      ids.push(i + 1);
    }
    sessionStorage.setItem('pl-fotos', JSON.stringify(ids));
    await PLSESSAO.salvarJa();
    return { id: pr.id };
  }, { nome, fotos });
}
const abrirQuadro = async (p, n) => {
  await p.goto(srv.url + 'app/editor/quadro/#foto-' + (n || 1));
  await p.reload();
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  await p.waitForTimeout(500);
};
const abrirAv = async p => {
  await p.click('#tab-legendas'); await p.waitForSelector('#lg-av-t');
  if (await p.locator('#lg-av').isHidden()) await p.click('#lg-av-t');
};
const st = (p, n) => p.evaluate(n => { const e = PLQ.ST()[n]; return JSON.parse(JSON.stringify({ pad: e.pad || null, pl: e.pl || null })); }, n);
const linhasQuadro = p => p.evaluate(() => [].map.call(document.querySelectorAll('#cap-meta .lg-m'), e => e.textContent));
const esperaPl = (p, n, i, v) => p.waitForFunction(a => { const e = PLQ.ST()[a[0]]; return e.pl && e.pl[a[1]] && e.pl[a[1]].v === a[2]; }, [n, i, v], { timeout: 15000 });
const folhas = p => p.evaluate(() => [].map.call(document.querySelectorAll('#sheet .pol'), e => ({ n: e.getAttribute('data-n'), ml: [].map.call(e.querySelectorAll('.pol__mline'), m => m.textContent) })));
async function pdfTxt(p) {
  await p.goto(srv.url + 'app/editor/gerar/');
  await p.waitForFunction(() => !!window.PLGERADOR);
  return p.evaluate(async () => {
    const pr = PLGERADOR.projeto(); try { await PLGERADOR.preparar(pr, []) } catch (e) { }
    const txt = [];
    (function w(o) { if (!o) return; if (Array.isArray(o)) return o.forEach(w); if (typeof o === 'object') { if (typeof o.txt === 'string' && o.t) txt.push(o.txt); Object.keys(o).forEach(k => { if (o[k] && typeof o[k] === 'object') w(o[k]) }) } })(PLGERADOR.lista(pr));
    return txt;
  });
}

try {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await maisAbertos(ctx);   /* D-172: ajustes avançados à vista */
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage();
  p.on('pageerror', e => errosPg.push(String(e)));
  p.setDefaultTimeout(30000);
  await criar(p, 'Padrões 2026', [
    { d: '2026:11:23 10:00:00', g: [-12.9714, -38.5014] },   /* Salvador */
    { d: '2026:11:24 11:00:00', g: [-12.9535, -38.3635] },   /* Praia de Itapuã */
    null]);

  titulo('D-139 · «Sugestões de legendas» abaixo de «Sem legendas», ligado por padrão:');
  await abrirQuadro(p, 1);
  await p.click('#tab-legendas'); await p.waitForSelector('#lg-av-t');
  const ordem = await p.evaluate(() => [].map.call(document.querySelectorAll('.mod--orig [data-sw]'), b => b.getAttribute('data-sw')));
  ok(ordem.join() === 'original,sug', 'a ordem dos interruptores é original, sug (' + ordem + ')');
  ok((await p.getAttribute('[data-sw=sug]', 'aria-checked')) === 'true', 'vem ligado');

  titulo('D-149 · modelo de 2 linhas já ligado: localização + data a partir do EXIF:');
  await abrirAv(p);
  ok(await p.locator('[data-sw=padon]').count() === 0, 'não há o interruptor «Padrão de 2 linhas»');
  await esperaPl(p, 1, 0, 'Salvador - BA'); await esperaPl(p, 1, 1, '23/11/26');
  await esperaPl(p, 2, 1, '24/11/26');
  let s3 = await st(p, 3);
  ok(!s3.pl || (s3.pl[0].v === '' && s3.pl[1].v === ''), 'a foto 3 (sem EXIF) fica com as linhas vazias, sem inventar');
  await p.waitForTimeout(300);
  const lq = await linhasQuadro(p);
  ok(lq.join('|') === 'Salvador - BA|23/11/26', 'Quadro: «Salvador - BA» e «23/11/26» (' + lq + ')');
  const tipos = await p.evaluate(() => [document.getElementById('pad-t-0').value, document.getElementById('pad-t-1').value]);
  ok(tipos[0] === 'loc' && tipos[1] === 'data', 'padrão inicial: linha 1 Localização, linha 2 Data');
  ok(await p.evaluate(() => !document.getElementById('lm2') && !document.getElementById('lm3') && !document.getElementById('lm1')), 'não há seções separadas Texto livre, Data e Local');
  ok(await p.evaluate(() => document.querySelectorAll('[data-lk="ln.pt"]').length === 1 && document.querySelectorAll('#cap-meta, #p-legendas .fsel').length >= 1 && document.querySelectorAll('.fsel').length === 1), 'um único conjunto de Fonte, Tamanho e Cor');

  titulo('Tamanho por linha:');
  await p.click('label.seg__o:has(input[name=alvo][value="0"])');
  await p.evaluate(() => { const r = document.getElementById('r-ln.pt'); r.value = 12; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.waitForTimeout(300);
  const tam = await p.evaluate(() => [document.querySelector('#cap-meta .lg-dt'), document.querySelector('#cap-meta .lg-lc')].map(e => parseFloat(getComputedStyle(e).fontSize)));
  ok(tam[0] > tam[1], 'a linha 1 (12) fica maior que a linha 2 (8): ' + tam);

  titulo('Tela = Folhas = PDF:');
  await p.evaluate(() => PLSESSAO.salvarJa());
  await p.goto(srv.url + 'app/editor/');
  await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length === 3);
  await p.waitForTimeout(800);
  const fl = await folhas(p);
  ok(fl[0].ml.join('|') === 'Salvador - BA|23/11/26', 'Folhas foto 1: ' + fl[0].ml);
  const pdf = await pdfTxt(p);
  ok(pdf.includes('Salvador - BA') && pdf.includes('23/11/26') && pdf.includes('24/11/26'), 'PDF: ' + JSON.stringify(pdf));

  titulo('O tipo da linha vale para o projeto; o texto é de cada foto:');
  await abrirQuadro(p, 2);
  await abrirAv(p);
  await p.selectOption('#pad-t-0', 'pt');
  await esperaPl(p, 2, 0, 'Praia de Itapuã');
  const a1 = await st(p, 1), a2 = await st(p, 2);
  ok(a1.pad === null && a2.pad === null, 'nenhuma foto tem padrão próprio');
  ok((await p.evaluate(() => PLQ.ST()[0].leg.pad.l[0].t)) === 'pt', 'o tipo da linha 1 é do projeto (ponto turístico)');
  ok((await linhasQuadro(p))[0] === 'Praia de Itapuã', 'Quadro foto 2: «Praia de Itapuã»');
  await p.selectOption('#pad-t-0', 'loc');
  await esperaPl(p, 2, 0, 'Salvador - BA'); await esperaPl(p, 1, 0, 'Salvador - BA');

  titulo('Texto manual preservado ao reaplicar; Restaurar sugestão:');
  await abrirQuadro(p, 1);
  await abrirAv(p);
  await p.fill('#pl-in-0', 'Meu cantinho');
  await p.waitForTimeout(300);
  ok((await st(p, 1)).pl[0].m === true, 'digitar marca a linha como manual');
  await p.selectOption('#av-lf', 'cv');
  await esperaPl(p, 2, 0, 'Salvador, BA');
  s3 = await st(p, 1);
  ok(s3.pl[0].v === 'Meu cantinho' && s3.pl[0].m === true, 'reaplicar (novo formato) não sobrescreve o texto manual');
  await p.click('[data-restaurar="0"]');
  await esperaPl(p, 1, 0, 'Salvador, BA');
  ok((await st(p, 1)).pl[0].m === false, 'Restaurar sugestão volta ao valor da foto');
  await p.selectOption('#av-lf', 'cu'); await esperaPl(p, 1, 0, 'Salvador - BA');

  titulo('Autocomplete «Cidade - UF»:');
  await p.fill('#pl-in-0', 'bom jes');
  await p.waitForFunction(() => document.querySelectorAll('#pl-dl-0 option').length > 0);
  const ops = await p.evaluate(() => [].map.call(document.querySelectorAll('#pl-dl-0 option'), o => o.value));
  ok(ops.includes('Bom Jesus - RS') && ops.every(o => /^.+ - [A-Z]{2}$/.test(o)), 'sugere «Bom Jesus - RS» etc. (' + ops.slice(0, 3) + ')');
  await p.selectOption('#pad-t-0', 'loc'); await p.fill('#pl-in-0', ''); await p.waitForTimeout(200); await p.click('[data-restaurar="0"]'); await esperaPl(p, 1, 0, 'Salvador - BA');

  titulo('«Sugestões de legendas» desligado: nada é preenchido; o que existe não some:');
  const antes = await st(p, 2);
  await p.click('[data-sw=sug]');
  await p.waitForTimeout(200);
  ok((await p.evaluate(() => PLQ.ST()[0].leg.sug)) === false, 'persiste no projeto (leg.sug = false)');
  ok(JSON.stringify((await st(p, 2)).pl) === JSON.stringify(antes.pl), 'textos existentes continuam');
  await p.fill('#pl-in-0', 'itacar'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => ![].some.call(document.querySelectorAll('#pl-dl-0 option'), o => o.value === 'Itacaré - BA')), 'sem novo autocomplete');
  await p.selectOption('#pad-t-0', 'pt'); await p.waitForTimeout(800);
  ok((await st(p, 2)).pl[0].v === '', 'trocar o tipo da linha não pré-preenche (o texto antigo era do tipo anterior)');
  await p.selectOption('#pad-t-0', 'loc'); await p.fill('#pl-in-0', 'Salvador - BA'); await p.waitForTimeout(300);

  titulo('«Sem legendas» desabilita o interruptor de sugestões:');
  await p.click('[data-sw=original]'); await p.waitForTimeout(300);
  ok((await p.getAttribute('[data-sw=sug]', 'aria-disabled')) === 'true', 'aria-disabled = true');
  await p.click('[data-sw=sug]', { force: true }); await p.waitForTimeout(200);
  ok((await p.evaluate(() => PLQ.ST()[0].leg.sug)) === false, 'o clique não muda nada');
  ok((await linhasQuadro(p)).length === 0, 'sem legendas: nenhum texto na polaroid');
  await p.click('[data-sw=original]'); await p.waitForTimeout(300);

  titulo('Persistência (IndexedDB) ao recarregar:');
  await p.evaluate(() => PLSESSAO.salvarJa()); await p.waitForTimeout(200);
  await p.reload();
  await p.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  const re = await p.evaluate(() => ({ sug: PLQ.ST()[0].leg.sug, pad: PLQ.ST()[0].leg.pad, pl: PLQ.ST()[1].pl }));
  ok(re.sug === false && re.pad.on && re.pad.l[0].pt === 12 && re.pl[0].v === 'Salvador - BA', 'sug, padrão, tamanho e textos voltam');

  titulo('Projeto exemplo (ehReal falso) não quebra:');
  const ctx2 = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await maisAbertos(ctx2);   /* D-172: ajustes avançados à vista */
  await ctx2.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errosPg.push(String(e)));
  await p2.goto(srv.url + 'app/editor/quadro/#foto-1');
  await p2.waitForFunction(() => window.PLQ && PLQ.ST()[1]);
  await p2.click('#tab-legendas'); await p2.waitForSelector('#lg-av-t'); await p2.click('#lg-av-t');
  await p2.click('[data-sw=padon]');
  await p2.waitForFunction(() => PLQ.ST()[1].pl && PLQ.ST()[1].pl.length === 2, null, { timeout: 15000 });
  const ex = await p2.evaluate(() => ({ pl: PLQ.ST()[1].pl.map(x => x.v), n: document.querySelectorAll('#cap-meta .lg-m').length }));
  ok(ex.pl.length === 2 && ex.pl.every(v => typeof v === 'string'), 'exemplo: o padrão liga sem erro e as linhas são texto (' + JSON.stringify(ex.pl) + ')');
} catch (e) { console.log('  ✘ erro: ' + e.stack); falhas.push(String(e)); }

ok(errosPg.length === 0, 'sem erro de página' + (errosPg.length ? ': ' + errosPg.join(' ; ') : ''));
await nav.close(); srv.fechar();
if (falhas.length) { console.log('\n✘ ' + falhas.length + ' falha(s)'); process.exit(1); }
console.log('\n✔ Legenda avançada (D-139) OK');
process.exit(0);
