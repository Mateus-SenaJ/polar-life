#!/usr/bin/env node
/* D-148/D-149 · edição v4: Metadados sai, Configurações avançadas, fontes novas com Itálico/Negrito reais, Excluir foto, pan 1:1.
   Tela = Folhas = PDF (MT-02). JPEGs gerados por canvas (nenhuma foto pessoal). Uso: node tests/e2e/testar-edicao-v4.mjs */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

const srv = await servir(), nav = await chromium.launch({ headless: true });
const falhas = [], errosPg = [];
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas.push(m); };
const titulo = t => console.log('\n' + t);
const perto = (a, b, e) => Math.abs(a - b) <= e;
const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/legenda-texto.js', 'assets/js/nucleo/gerador.js'];

async function novaPagina() {
  const p = await nav.newPage();
  await p.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  p.on('pageerror', e => errosPg.push(String(e)));
  p.setDefaultTimeout(30000);
  return p;
}
async function criar(p, nome, n) {
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.waitForFunction(() => !!window.PLFOTOS && !!window.PLPROJETOS && !!window.PLSESSAO);
  return p.evaluate(async o => {
    localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
    const pr = await PLPROJETOS.criar(o.nome), ids = [];
    for (let i = 0; i < o.n; i++) {
      const c = document.createElement('canvas'); c.width = 1200; c.height = 900;
      const x = c.getContext('2d'); x.fillStyle = ['#C00000', '#0000C0', '#006194'][i % 3]; x.fillRect(0, 0, 1200, 900);
      x.fillStyle = '#fff'; x.fillRect(100 + 150 * i, 100, 200, 200);
      const bytes = new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/jpeg', .9))).arrayBuffer());
      await PLFOTOS.salvar(i + 1, new File([bytes], 'foto-' + (i + 1) + '.jpg', { type: 'image/jpeg' }), pr.id);
      ids.push(i + 1);
    }
    sessionStorage.setItem('pl-fotos', JSON.stringify(ids));
    await PLSESSAO.salvarJa();
    return { id: pr.id };
  }, { nome, n });
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
  await p.waitForSelector('#md-c');
};
const addScripts = async p => { for (const s of SCRIPTS) await p.addScriptTag({ url: srv.url + s }); };
const aguardarCommit = p => p.waitForTimeout(250);
/* itens da display list da 1ª página, achatados, com o ângulo dos grupos (inclinação) */
const listaPdf = p => p.evaluate(async () => {
  const pj = PLGERADOR.projeto(); await PLGERADOR.preparar(pj);
  const pg = PLGERADOR.lista(pj).paginas[0], out = [];
  (function anda(xs, ang) { xs.forEach(i => { if (i.t === 'grupo') anda(i.itens, Math.atan2(i.m[1], i.m[0]) * 180 / Math.PI); else out.push({ t: i.t, txt: i.txt, fonte: i.fonte, esp: i.esp, ang }); }); })(pg.itens || [], 0);
  return out.filter(i => i.t === 'texto');
});
const fontesNoPdf = p => p.evaluate(async () => {
  const b64 = u8 => { let s = '', c = 0x8000; for (let i = 0; i < u8.length; i += c) s += String.fromCharCode.apply(null, u8.subarray(i, i + c)); return btoa(s); };
  const r = await PLGERADOR.pdf(PLGERADOR.projeto(), { f: 'pdf' });
  const doc = await PDFLib.PDFDocument.load(r.arquivos[0].bytes), nomes = [];
  for (const [, o] of doc.context.enumerateIndirectObjects()) {
    if (o instanceof PDFLib.PDFDict) { const b = o.get(PDFLib.PDFName.of('BaseFont')); if (b) nomes.push(String(b).replace(/^\//, '')); }
  }
  return { nomes, avisos: r.avisos || [] };
});

try {
  const p = await novaPagina();
  await criar(p, 'Edição v4', 3);
  await abrirQuadro(p, 1);

  titulo('1 · A aba «Metadados» saiu (Quadro e Folhas):');
  ok(await p.locator('#tab-metadados').count() === 0 && await p.locator('#p-metadados').count() === 0, 'o Quadro não tem a aba nem o painel Metadados');
  await p.click('#tab-legendas'); await p.waitForSelector('#lg-av-t');
  ok(await p.locator('#lg-av').isHidden(), 'as «Configurações avançadas» começam recolhidas');
  ok((await p.textContent('#lg-av-t')).trim() === 'Configurações avançadas', 'o botão se chama «Configurações avançadas»');
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.waitForTimeout(300);
  const alt = await p.evaluate(() => document.getElementById('p-legendas').scrollHeight);
  ok(alt <= 1550, 'D-149: o painel Legendas recolhido cabe em ~1,5 tela de 1000 px (' + alt + ' px)');
  const rep = await p.evaluate(() => ({ fsel: document.querySelectorAll('.fsel').length, tam: document.querySelectorAll('[data-lk="ln.pt"]').length, cor: document.querySelectorAll('[name="cor-ln"]').length, fmt: document.querySelectorAll('input[name=fmt]').length, lg: !!document.getElementById('lg-in'), secoes: ['lm1', 'lm2', 'lm3', 'lm4'].filter(i => document.getElementById(i)).length, padon: !!document.querySelector('[data-sw=padon]'), alvo: (document.querySelector('input[name=alvo]:checked') || {}).value, linhas: document.querySelectorAll('select[data-padt]').length }));
  ok(rep.fsel === 1 && rep.tam === 1 && rep.cor === 3 && rep.fmt === 0, 'Fonte, Tamanho e Cor aparecem uma vez só e o formato de data não tem 19 botões (' + JSON.stringify(rep) + ')');
  ok(!rep.lg && rep.secoes === 0 && !rep.padon && rep.linhas === 2, 'sem Texto livre, Data e Local separados nem «Padrão de 2 linhas»; há Linha 1 e Linha 2');
  ok(rep.alvo === 'a', 'o alvo do estilo é «Ambas» por padrão');
  const espacos = await p.evaluate(() => { document.getElementById('lg-av').hidden = false; const f = [...document.querySelectorAll('#lg-av > .f')].map(e => e.getBoundingClientRect()); const g = []; for (let i = 1; i < f.length; i++) g.push(Math.round(f[i].top - f[i - 1].bottom)); document.getElementById('lg-av').hidden = true; return g; });
  ok(espacos.length > 5 && espacos.every(x => x >= 12), 'em Avançado há espaço entre os campos (≥ 12 px): ' + espacos.join(','));
  await p.click('#lg-av-t'); await p.waitForSelector('#md-c');
  ok(await p.locator('#lg-av [data-lk="inc"]').count() === 1 && await p.locator('[data-lk="inc"]').count() === 1, 'a inclinação existe uma única vez, dentro das configurações avançadas');
  const inc = await p.evaluate(() => { const r = document.getElementById('r-inc'); return { min: r.min, max: r.max, step: r.step }; });
  ok(inc.min === '-8' && inc.max === '8' && inc.step === '1', 'inclinação de −8° a +8° em passos de 1° (' + JSON.stringify(inc) + ')');
  ok(await p.locator('#lg-av input[name=avcx]').count() === 2 && await p.locator('#r-av\\.esp').count() === 1, 'há caixa (normal/MAIÚSCULAS) e espaçamento entre letras');
  ok(await p.locator('#md-d').count() === 1 && await p.locator('#md-c').count() === 1 && await p.locator('#md-apl').count() === 1, 'data e cidade da foto (e correção de horas) passaram para as configurações avançadas');

  titulo('2 · Data e cidade manuais continuam valendo (movidos da aba Metadados):');
  await p.fill('#md-d', '09/03/2025'); await p.dispatchEvent('#md-d', 'change');
  await p.fill('#md-c', 'recife'); await p.dispatchEvent('#md-c', 'change');
  await aguardarCommit(p);
  const m1 = await p.evaluate(() => PLQ.ST()[1].meta);
  ok(m1.c === 'recife' && m1.iso.startsWith('2025-03-09') && m1.ds === 'manual', 'o estado da foto guarda data e cidade digitadas (' + JSON.stringify({ c: m1.c, iso: m1.iso }) + ')');

  titulo('3 · Inclinação, caixa e espaçamento: tela = Folhas = PDF (MT-02):');
  await p.evaluate(() => { const r = document.getElementById('r-inc'); r.value = 5; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.check('input[name=avcx][value=maiusc]');
  await p.evaluate(() => { const r = document.getElementById('r-av.esp'); r.value = .1; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await aguardarCommit(p);
  const tela = await p.evaluate(() => {
    const lc = document.querySelector('#cap-meta .lg-m > *'), dt = document.querySelector('#cap-meta .lg-m:nth-child(2) > *');
    return { inc: document.getElementById('pq').style.getPropertyValue('--inc'), lc: lc && lc.textContent, ls: lc && parseFloat(getComputedStyle(lc).letterSpacing) / parseFloat(getComputedStyle(lc).fontSize), dt: dt && dt.textContent, leg: PLQ.ST()[0].leg };
  });
  ok(tela.inc === '5deg', 'a polaroid do Quadro gira 5° (' + tela.inc + ')');
  ok(tela.lc === 'RECIFE - PE' && tela.dt === '09/03/25', 'a localização sai em MAIÚSCULAS no Quadro (' + tela.lc + ')');
  ok(perto(tela.ls, 0.1, 0.005), 'o espaçamento das linhas de data e local é 0,1 em no Quadro (' + (tela.ls || 0).toFixed(3) + ')');
  ok(tela.leg.inc === 5 && tela.leg.av.cx === 'maiusc' && tela.leg.av.esp === 0.1, 'os ajustes ficam em leg.inc e leg.av');
  await addScripts(p);
  const itens = await listaPdf(p);
  const lcPdf = itens.find(i => i.txt === 'RECIFE - PE'), capPdf = itens.find(i => i.txt === '09/03/25');
  ok(!!lcPdf && perto(lcPdf.esp, 0.1, 1e-6), 'no PDF a localização sai «RECIFE - PE» com espaçamento 0,1 em');
  ok(!!capPdf && perto(capPdf.ang, 5, 0.01) && !!lcPdf && perto(lcPdf.ang, 5, 0.01), 'no PDF o bloco de texto gira 5° (' + (capPdf && capPdf.ang.toFixed(2)) + '°)');
  await p.goto(srv.url + 'app/editor/'); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length >= 3); await p.waitForTimeout(700);
  const folha = await p.evaluate(() => { const f = document.querySelector('#sheet .pol'); const m = f.querySelector('.pol__meta'); const c = f.querySelector('.pol__cap'); return { meta: m && m.textContent, cap: c && getComputedStyle(c).transform !== 'none', tr: (f.querySelector('figcaption') || f).getAttribute('data-preset') !== undefined, ls: m && m.querySelector('span,time') ? getComputedStyle(m.querySelector('span,time')).letterSpacing : '' }; });
  ok(/RECIFE - PE/.test(folha.meta || ''), 'nas Folhas a localização também sai em MAIÚSCULAS (' + folha.meta + ')');

  titulo('4 · Formatos de data e localização (selects em Avançado):');
  await abrirQuadro(p, 1); await abrirAv(p);
  await p.waitForSelector('#av-df');
  const opcoesDf = await p.$$eval('#av-df option', os => os.map(o => o.textContent)), opcoesLf = await p.$$eval('#av-lf option', os => os.map(o => o.textContent));
  ok(opcoesDf.join('|') === '23/11/26|23/11/2026|23 nov 2026|23 de novembro de 2026|nov/2026|2026', 'formatos de data: ' + opcoesDf.join(' · '));
  ok(opcoesLf.join('|') === 'Cidade - UF|Cidade, UF|Cidade · Estado por extenso|Cidade, País', 'formatos de localização: ' + opcoesLf.join(' · '));
  await p.fill('#md-c', 'Recife - PE'); await p.dispatchEvent('#md-c', 'change');
  await p.waitForTimeout(500);
  const linhas = () => p.evaluate(() => [].map.call(document.querySelectorAll('#cap-meta .lg-m, #pq .lg-xl .lg-l'), e => e.textContent));
  for (const [df, lf, esperado] of [['3', 'cu', ['RECIFE - PE', '09/03/25']], ['7', 'ce', ['RECIFE · PERNAMBUCO', '9 DE MARÇO DE 2025']], ['13', 'cp', ['RECIFE, BRASIL', 'MAR/2025']], ['14', 'cv', ['RECIFE, PE', '2025']], ['8', 'cu', ['RECIFE - PE', '9 MAR 2025']]]) {
    await p.selectOption('#av-df', df); await p.waitForTimeout(350);
    await p.selectOption('#av-lf', lf); await p.waitForTimeout(500);
    const l = await linhas();
    ok(JSON.stringify(l) === JSON.stringify(esperado), `data ${df} + local ${lf}: ${JSON.stringify(l)}`);
  }
  const itens2 = await listaPdf(p).catch(async () => { await addScripts(p); return listaPdf(p); });
  ok(itens2.some(i => i.txt === 'RECIFE - PE') && itens2.some(i => i.txt === '9 MAR 2025'), 'o PDF mostra as mesmas duas linhas (' + itens2.map(i => i.txt).join(' | ') + ')');

  titulo('5 · Fontes novas e estilos Normal · Itálico · Negrito:');
  const cat = await p.evaluate(() => PLTEXTO.FONTES.map(f => f.n));
  const novas = ['Indie Flower', 'Handlee', 'Amatic SC', 'Lora', 'Crimson Pro', 'Nunito', 'DM Sans'];
  ok(novas.every(n => cat.includes(n)), '7 fontes novas no catálogo (' + novas.join(', ') + ')');
  const arquivos = await p.evaluate(async srvUrl => {
    const falta = [], slug = f => f.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    for (const [fam, vs] of Object.entries(PLTEXTO.VAR)) for (const v of vs) {
      const w = parseInt(v, 10), it = /i$/.test(v), n = slug(fam) + '-' + w + (it ? '-italico' : '');
      for (const u of ['assets/fonts/' + n + '.woff2', 'assets/fonts/pdf/' + n + '.ttf']) if (n.indexOf('inter-4') !== 0 && n !== 'inter-500' && !(await fetch(srvUrl + u)).ok) falta.push(u);
    }
    return falta;
  }, srv.url);
  ok(arquivos.length === 0, 'toda variante declarada existe como WOFF2 (tela) e TTF (PDF)' + (arquivos.length ? ': faltam ' + arquivos.join(', ') : ''));
  await p.click('[data-fsel=ln]');
  await p.fill('#fbusca', 'Lora'); await p.click('[data-pick="Lora"]'); await aguardarCommit(p);
  const est = await p.evaluate(() => [...document.querySelectorAll('[data-est]')].map(b => ({ k: b.dataset.est, off: b.disabled })));
  ok(est.length === 2 && est.every(e => !e.off), 'Lora oferece Itálico e Negrito');
  await p.click('[data-est=b]'); await p.click('[data-est=it]'); await p.waitForTimeout(500);
  const loraTela = await p.evaluate(async () => { await document.fonts.load('italic 700 20px Lora'); const e = document.querySelector('#cap-meta .lg-m > *'), c = getComputedStyle(e); return { w: c.fontWeight, s: c.fontStyle, ok: document.fonts.check('italic 700 20px Lora') }; });
  ok(loraTela.w === '700' && loraTela.s === 'italic' && loraTela.ok, 'na tela: Lora em negrito itálico (' + JSON.stringify(loraTela) + ')');
  const itL = (await listaPdf(p)).find(i => i.txt === 'RECIFE - PE');
  ok((await listaPdf(p)).filter(i => /RECIFE|09\/03/.test(i.txt)).every(i => i.fonte.fam === 'Lora' && i.fonte.peso === 700 && i.fonte.it === true) && itL && itL.fonte.fam === 'Lora' && itL.fonte.peso === 700 && itL.fonte.it === true, 'na display list do PDF: as duas linhas em Lora 700 itálico');
  const fpdf = await fontesNoPdf(p);
  ok(fpdf.nomes.some(n => /LoraItalico|Lora-700-Italico/.test(n)), 'o PDF embute a Lora 700 itálica (' + fpdf.nomes.filter(n => /Lora/.test(n)).join(', ') + ')');
  ok(!fpdf.avisos.some(a => /FonteReserva/.test(a.motivo)), 'o PDF não usou fonte reserva');
  await p.goto(srv.url + 'app/editor/'); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length >= 3); await p.waitForTimeout(700);
  const capF = await p.evaluate(() => { const c = document.querySelector('#sheet .pol .pol__mline'), s = c && getComputedStyle(c); return s && { w: s.fontWeight, s: s.fontStyle, f: s.fontFamily }; });
  ok(capF && capF.w === '700' && capF.s === 'italic' && /Lora/.test(capF.f), 'nas Folhas: Lora em negrito itálico (' + JSON.stringify(capF) + ')');
  await abrirQuadro(p, 1); await p.click('#tab-legendas'); await p.waitForSelector('[data-fsel=ln]');
  const desabilita = async (fonte) => {
    await p.click('[data-fsel=ln]'); await p.fill('#fbusca', fonte); await p.click('[data-pick="' + fonte + '"]'); await aguardarCommit(p);
    return p.evaluate(() => ({ b: document.querySelector('[data-est=b]').disabled, it: document.querySelector('[data-est=it]').disabled, h: document.getElementById('lg-est-h').textContent, bp: document.querySelector('[data-est=b]').getAttribute('aria-pressed'), ip: document.querySelector('[data-est=it]').getAttribute('aria-pressed') }));
  };
  let d = await desabilita('Indie Flower');
  ok(d.b && d.it && /Indie Flower não tem itálico/.test(d.h) && /não tem negrito/.test(d.h) && d.bp === 'false' && d.ip === 'false', 'Indie Flower: Itálico e Negrito desabilitados, com explicação (' + d.h + ')');
  d = await desabilita('Amatic SC');
  ok(!d.b && d.it && /não tem itálico/.test(d.h), 'Amatic SC: só Negrito disponível (' + d.h + ')');
  ok(await p.evaluate(() => PLQ.ST()[0].leg.pad.l.every(l => !l.it && !l.b)), 'trocar para fonte sem a variante limpa o estilo que ela não tem (nada sintético)');
  d = await desabilita('Playfair Display Itálico');
  ok(d.it && /já é itálica/.test(d.h), 'Playfair Display Itálico: «já é itálica»');
  ok(await p.evaluate(() => { const f = PLTEXTO.famLG('Amatic SC', { it: true }); return f.i === 0; }), 'pedir itálico numa família sem itálico nunca vira itálico sintético');

  titulo('6 · Excluir foto (só aquela):');
  const q = await novaPagina();
  const proj = await criar(q, 'Excluir', 3);
  await abrirQuadro(q, 2);
  await q.evaluate(() => { const S = PLQ.ST(); S[1].adj.brilho = 10; S[2].adj.brilho = 20; S[3].adj.brilho = 30; S[1].z = 150; S[3].z = 220; S[3].px = .02; PLQ.commit('t'); });
  await q.waitForTimeout(300);
  const idb = (pg, pid) => pg.evaluate(async pid => {
    const db = await PLFOTOS.abrirDB();
    const ler = loja => new Promise(r => { const rq = db.transaction(loja, 'readonly').objectStore(loja).getAllKeys(); rq.onsuccess = () => r(rq.result.map(String)); });
    const o = { fotos: await ler('fotos'), proj: (await ler('fotosProjeto')).filter(k => k.indexOf(pid + ':') === 0) }; db.close(); return o;
  }, pid);
  const antes = await q.evaluate(() => JSON.stringify(PLQ.ST().slice(1).map(e => ({ s: e.src, adj: e.adj, z: e.z, px: e.px, flt: e.flt }))));
  const i0 = await idb(q, proj.id);
  ok(i0.proj.length === 3 && i0.fotos.length >= 3, 'antes: 3 cópias no aparelho');
  ok(await q.locator('#excluir').isVisible() && /Excluir foto/.test(await q.textContent('#excluir')) && await q.locator('#excluir svg use[href="#i-trash"]').count() === 1, 'há o botão «Excluir foto» com lixeira e texto na barra da foto');
  await q.click('#excluir'); await q.waitForTimeout(700);
  const dep = await q.evaluate(() => ({ N: PLQ.N, src: PLQ.ST().slice(1).map(e => e.src), lista: JSON.parse(sessionStorage.getItem('pl-fotos')), toast: document.getElementById('toast').hidden ? '' : document.getElementById('toast-t').textContent, undo: !document.getElementById('toast-undo').hidden, adj: PLQ.ST().slice(1).map(e => e.adj.brilho), z: PLQ.ST().slice(1).map(e => e.z), px: PLQ.ST().slice(1).map(e => e.px) }));
  ok(dep.N === 2 && dep.src.join() === '1,3' && dep.lista.join() === '1,3', 'sai só a foto 2 do projeto (fontes: ' + dep.src + ')');
  ok(/excluída/.test(dep.toast) && dep.undo, 'aparece «Foto 02 excluída · Desfazer»');
  ok(dep.adj.join() === '10,30' && dep.z.join() === '150,220' && dep.px[1] === .02, 'as outras duas mantêm os ajustes (brilho, zoom e posição)');
  const i1 = await idb(q, proj.id);
  ok(i1.proj.join() === proj.id + ':1,' + proj.id + ':3' && !i1.fotos.includes('2') && i1.fotos.includes('1') && i1.fotos.includes('3'), 'o IndexedDB perdeu só a cópia da foto 2 (fotosProjeto: ' + i1.proj.join(', ') + ')');
  await addScripts(q);
  ok(await q.evaluate(() => PLGERADOR.projeto().fotos.map(f => f.src).join()) === '1,3', 'o PDF só inclui as fotos 1 e 3');
  /* Desfazer (toast) traz a foto 2 de volta, com o ajuste dela e o arquivo */
  await q.click('#toast-undo'); await q.waitForTimeout(700);
  const d3 = await q.evaluate(() => ({ N: PLQ.N, src: PLQ.ST().slice(1).map(e => e.src).join(), adj: PLQ.ST().slice(1).map(e => e.adj.brilho).join() }));
  const i3 = await idb(q, proj.id);
  ok(d3.N === 3 && d3.src === '1,2,3' && d3.adj === '10,20,30' && i3.proj.length === 3 && i3.fotos.includes('2'), 'Desfazer traz de volta a foto 2 com o ajuste dela e o arquivo no IndexedDB (' + JSON.stringify(d3) + ')');
  ok(await q.evaluate(async () => { await new Promise(r => setTimeout(r, 500)); return !!document.querySelector('#clip img'); }), 'a foto devolvida volta a aparecer na janela');
  /* excluir de novo e conferir Folhas depois de recarregar */
  await q.click('#excluir'); await q.waitForTimeout(500);
  await q.goto(srv.url + 'app/editor/'); await q.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0); await q.waitForTimeout(500);
  ok(await q.locator('#sheet .pol').count() === 2, 'as Folhas mostram 2 polaroids');

  titulo('6b · Menu da miniatura:');
  await abrirQuadro(q, 1);
  await q.click('#faixa li:nth-child(1) .th', { button: 'right' });
  await q.waitForSelector('#th-menu:not([hidden])');
  ok((await q.textContent('#th-menu')).includes('Excluir foto') && (await q.textContent('#th-menu')).includes('Duplicar foto'), 'o botão direito na miniatura abre o menu com Duplicar e Excluir foto');
  await q.click('#th-menu-del'); await q.waitForTimeout(600);
  const d4 = await q.evaluate(() => ({ N: PLQ.N, src: PLQ.ST().slice(1).map(e => e.src).join(), adj: PLQ.ST().slice(1).map(e => e.adj.brilho).join() }));
  const i4 = await idb(q, proj.id);
  ok(d4.N === 1 && d4.src === '3' && d4.adj === '30' && i4.proj.join() === proj.id + ':3', 'pelo menu da miniatura 1 sai só a foto 1 (' + JSON.stringify(d4) + ')');
  ok(await q.evaluate(() => PLQ.N) === 1 && await q.locator('#excluir').isDisabled(), 'com 1 foto o botão fica desabilitado (o projeto precisa de ao menos 1)');

  titulo('7 · Enquadramento: arrastar a foto é 1:1 e suave:');
  const e = await novaPagina();
  await e.setViewportSize({ width: 1280, height: 900 });
  await criar(e, 'Pan', 2);
  await abrirQuadro(e, 1);
  await e.evaluate(() => { PLQ.ST()[1].z = 300; PLQ.commit('z'); });
  await e.waitForTimeout(500);
  await e.waitForFunction(() => document.querySelector('#clip img'));
  const rect = () => e.evaluate(() => { const r = document.querySelector('#clip .ph').getBoundingClientRect(), w = document.getElementById('win').getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, wl: w.left, wt: w.top, wr: w.right, wb: w.bottom, wc: [w.left + w.width / 2, w.top + w.height / 2] }; });
  const frame = () => e.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const r0 = await rect();
  await e.mouse.move(r0.wc[0], r0.wc[1]); await e.mouse.down();
  let anterior = await rect(), maxErro = 0, passos = 0;
  for (let i = 1; i <= 20; i++) {
    await e.mouse.move(r0.wc[0] + 3 * i, r0.wc[1] - 2 * i); await frame();
    const r = await rect();
    maxErro = Math.max(maxErro, Math.abs((r.l - anterior.l) - 3), Math.abs((r.t - anterior.t) + 2)); passos++; anterior = r;
  }
  ok(passos === 20 && maxErro <= 0.6, 'a foto anda 3 px e −2 px a cada passo do ponteiro (erro máximo ' + maxErro.toFixed(2) + ' px em 20 passos)');
  const r1 = await rect();
  ok(perto(r1.l - r0.l, 60, 0.6) && perto(r1.t - r0.t, -40, 0.6), 'deslocamento total 1:1 com o mouse: ' + (r1.l - r0.l).toFixed(1) + ' × ' + (r1.t - r0.t).toFixed(1) + ' px (esperado 60 × −40)');
  ok(await e.evaluate(() => PLQ.ST()[1].py !== 0 || PLQ.ST()[1].px !== 0), 'o estado interno acompanha o gesto');
  /* além da borda: resistência suave, sem travar, e inverter responde na hora */
  await e.mouse.move(r0.wc[0] + 1500, r0.wc[1]); await frame();
  const r2 = await rect();
  ok(r2.l - r2.wl > 0 && r2.l - r2.wl < 0.12 * (r2.wr - r2.wl), 'passando da borda a foto cede só um pouco (' + (r2.l - r2.wl).toFixed(1) + ' px de folga, com resistência)');
  await e.mouse.move(r0.wc[0] + 1500 - 25, r0.wc[1]); await frame();
  const r3 = await rect();
  ok(r3.l < r2.l - 1, 'inverter o sentido responde na hora, sem zona morta (' + (r2.l - r3.l).toFixed(1) + ' px)');
  await e.mouse.up(); await e.waitForTimeout(500);
  const r4 = await rect();
  ok(perto(r4.l, r4.wl, 1), 'com zoom 300% a foto chega até a borda da janela (limite só nas bordas: ' + (r4.l - r4.wl).toFixed(2) + ' px)');
  ok(r4.l <= r4.wl + 0.6 && r4.r >= r4.wr - 0.6 && r4.t <= r4.wt + 0.6 && r4.b >= r4.wb - 0.6, 'ao soltar, a foto cobre a janela inteira');
  const elas = await e.evaluate(() => ({ ex: PLQ.ST()[1].ex, ey: PLQ.ST()[1].ey }));
  ok(elas.ex === 0 && elas.ey === 0, 'o elástico volta a zero ao soltar');
  /* gesto de toque: o dedo move a foto sem rolar a página */
  ok(await e.evaluate(() => getComputedStyle(document.getElementById('win')).touchAction) === 'none', 'a janela tem touch-action: none (o dedo não rola a página)');

  titulo('8 · Projeto antigo migra para as duas linhas sem perder nada (D-149):');
  const m = await novaPagina();
  await criar(m, 'Antigo', 2);
  await abrirQuadro(m, 1);
  await m.evaluate(() => {
    const q = JSON.parse(sessionStorage.getItem('pl-quadro')), l = JSON.parse(JSON.stringify(PLTEXTO.LEG0));
    l.txt.font = 'Kalam'; l.txt.cor = 'azul'; l.txt.pt = 14; q[0].leg = l; q[1].txt = 'Dia de praia'; q[2].txt = 'Outro dia';
    delete q[1].pl; delete q[2].pl; sessionStorage.setItem('pl-quadro', JSON.stringify(q));
  });
  await m.reload();
  await m.waitForFunction(() => window.PLQ && PLQ.ST()[1] && PLQ.ST()[1].meta);
  await m.waitForTimeout(600);
  const mig = await m.evaluate(() => ({ pad: PLQ.ST()[0].leg.pad, p1: PLQ.ST()[1].pl, p2: PLQ.ST()[2].pl, lin: [].map.call(document.querySelectorAll('#cap-meta .lg-m'), e => e.textContent) }));
  ok(mig.pad && mig.pad.on && mig.pad.l[0].t === 'txt' && mig.pad.l[0].font === 'Kalam' && mig.pad.l[0].cor === 'azul' && mig.pad.l[0].pt === 14, 'a legenda antiga vira Linha 1 = Texto livre, com a fonte, a cor e o tamanho de antes (' + JSON.stringify(mig.pad && mig.pad.l[0]) + ')');
  ok(mig.p1[0].v === 'Dia de praia' && mig.p2[0].v === 'Outro dia', 'o texto livre de cada foto vira o texto da Linha 1');
  ok(mig.lin[0] === 'Dia de praia', 'a polaroid mostra o texto da foto (' + mig.lin + ')');

  ok(errosPg.length === 0, 'sem erro de página' + (errosPg.length ? ': ' + errosPg[0] : ''));
} catch (err) { ok(false, 'exceção: ' + err.message); console.log(err.stack); }
finally { await nav.close(); srv.fechar(); }
console.log(falhas.length ? `\n✘ Edição v4: ${falhas.length} falha(s)` : '\n✔ Edição v4: sem falhas');
process.exit(falhas.length ? 1 : 0);
