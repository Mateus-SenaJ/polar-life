/* D-200 a D-202 · Telas grandes e detalhes de uso (pedidos do dono em 2026-11-12):
   - Novo projeto: o painel «Como fica a folha» cabe inteiro na janela e o «Continuar» fica sempre à vista, sem rolar o painel;
   - Adicionar fotos: cabe numa tela só (sem rolagem), antes e depois de escolher as fotos; enquanto as fotos são guardadas,
     o LED mostra «Carregando…» com a barra de carregamento;
   - Folhas: o alinhamento da legenda (Esquerda · Centro · Direita) muda a tela e o PDF igual (D-201).
   Fotos de exemplo do site (CC0). */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const FOTOS = ['casal-por-do-sol', 'amigos-praia', 'montanha', 'cidade-luzes'];
const srv = await servir(), nav = await chromium.launch();
async function pagina(w, h) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage(); p.on('pageerror', (e) => { ok(false, 'erro de página: ' + e.message); });
  return { ctx, p };
}
try {
  console.log('Novo projeto: o «Continuar» sempre à vista:');
  for (const [w, h] of [[1280, 640], [1366, 700], [1440, 900]]) {
    const { ctx, p } = await pagina(w, h);
    await p.goto(srv.url + 'app/novo-projeto/'); await p.waitForSelector('#continuar');
    const r = [];
    for (const y of [0, 400, 100000]) {
      await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(150);
      r.push(await p.evaluate(() => { const a = document.querySelector('.aside').getBoundingClientRect(), b = document.getElementById('continuar').getBoundingClientRect(); return { aside: Math.round(a.bottom), bot: Math.round(b.bottom), topo: Math.round(b.top), h: innerHeight }; }));
    }
    ok(r.every((x) => x.bot <= x.h && x.topo >= 64 && x.aside <= x.h), `${w}×${h}: painel inteiro na janela e «Continuar» visível no topo, no meio e no fim da página (${r.map((x) => x.bot + '/' + x.h).join(', ')})`);
    await ctx.close();
  }

  console.log('Adicionar fotos: uma tela só e «Carregando…»:');
  for (const [w, h] of [[1280, 640], [1366, 700], [1440, 900]]) {
    const { ctx, p } = await pagina(w, h);
    await p.goto(srv.url + 'app/adicionar-fotos/'); await p.waitForSelector('#btn-device');
    const a = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    await p.evaluate(async (L) => { const dt = new DataTransfer(); for (const n of L) { const b = await (await fetch('../../assets/img/fotos/' + n + '.jpg')).blob(); dt.items.add(new File([b], n + '.jpg', { type: 'image/jpeg' })); }
      document.getElementById('drop').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); }, FOTOS);
    await p.waitForFunction(() => /Continuar com 4 fotos/.test(document.getElementById('btn-device-t').textContent), null, { timeout: 20000 });
    const b = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    ok(a <= 1 && b <= 1, `${w}×${h}: sem rolagem antes (${a} px) e depois de escolher as fotos (${b} px)`);
    await ctx.close();
  }
  {
    const { ctx, p } = await pagina(1280, 800);
    await p.goto(srv.url + 'app/adicionar-fotos/'); await p.waitForSelector('#btn-device');
    /* deixa a gravação lenta de propósito para ver o estado de carregando (o resto do fluxo é o de sempre) */
    await p.evaluate(() => { const s = PLFOTOS.salvar; PLFOTOS.salvar = function () { const a = arguments; return new Promise((ok) => setTimeout(ok, 1500)).then(() => s.apply(PLFOTOS, a)); }; });
    await p.evaluate(async (L) => { const dt = new DataTransfer(); for (const n of L) { const b = await (await fetch('../../assets/img/fotos/' + n + '.jpg')).blob(); dt.items.add(new File([b], n + '.jpg', { type: 'image/jpeg' })); }
      document.getElementById('drop').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); }, FOTOS.slice(0, 2));
    await p.waitForTimeout(600);
    const c = await p.evaluate(() => { const b = document.getElementById('btn-device'), bar = b.querySelector('.led-btn__bar'); return { t: b.textContent.trim(), busy: b.getAttribute('aria-busy'), barra: bar && getComputedStyle(bar).display }; });
    ok(c.t === 'Carregando…' && c.busy === 'true' && c.barra === 'block', 'enquanto as fotos são guardadas: «Carregando…» com a barra do LED (' + JSON.stringify(c) + ')');
    await p.waitForFunction(() => /Continuar com 2 fotos/.test(document.getElementById('btn-device-t').textContent), null, { timeout: 20000 });
    ok((await p.getAttribute('#btn-device', 'aria-busy')) === 'false', 'terminou: volta «Continuar com 2 fotos» e aceita o clique');
    await ctx.close();
  }

  console.log('Resumo da importação: uma tela só e números em Inter (D-203):');
  for (const [w, h] of [[1280, 640], [1366, 700], [1440, 900]]) {
    const { ctx, p } = await pagina(w, h);
    await p.goto(srv.url + 'app/adicionar-fotos/'); await p.waitForFunction(() => !!window.PLPROJETOS && !!window.PLFOTOS);
    await p.evaluate(async (L) => { localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear(); const pr = await PLPROJETOS.criar('Resumo'); let i = 1;
      for (const n of L) { const b = await (await fetch('../../assets/img/fotos/' + n + '.jpg')).blob(); await PLFOTOS.salvar(i++, new File([b], n + '.jpg', { type: 'image/jpeg' }), pr.id); }
      sessionStorage.setItem('pl-fotos', '[1,2,3,4]'); await PLPROJETOS.salvarEstado(); }, FOTOS);
    await p.goto(srv.url + 'app/resumo/'); await p.waitForFunction(() => document.querySelectorAll('#stats dd').length >= 4); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ sobra: document.documentElement.scrollHeight - innerHeight, fonte: getComputedStyle(document.querySelector('#stats dd')).fontFamily, go: Math.round(document.getElementById('go').getBoundingClientRect().bottom), h: innerHeight }));
    ok(r.sobra <= 1 && r.go <= r.h && /Inter/.test(r.fonte), w + '×' + h + ': cabe sem rolagem (' + r.sobra + ' px), «Continuar» à vista e números em ' + r.fonte.split(',')[0]);
    await ctx.close();
  }

  console.log('Quadro e Folhas: a mesa não rola, só o inspetor (D-204):');
  for (const [w, h] of [[1280, 640], [1440, 900], [834, 1112]]) {
    const { ctx, p } = await pagina(w, h);
    for (const [rota, nome] of [['app/editor/quadro/#foto-3', 'Quadro'], ['app/editor/', 'Folhas']]) {
      await p.goto(srv.url + rota); await p.waitForSelector('#stage'); await p.waitForTimeout(800);
      const r = await p.evaluate(() => { const alvo = (document.getElementById('pq') || document.getElementById('sheet')).getBoundingClientRect(), ins = document.getElementById('insp'), st = document.getElementById('stage').getBoundingClientRect();
        return { rola: document.scrollingElement.scrollHeight - innerHeight, topo: alvo.top, fundo: alvo.bottom, h: innerHeight, palco: Math.round(st.height), insp: ins.scrollHeight > ins.clientHeight }; });
      ok(r.rola <= 1 && r.topo >= 56 && r.fundo <= r.h && r.palco >= 230 && r.insp, nome + ' ' + w + '×' + h + ': página parada, ' + (nome === 'Quadro' ? 'polaroid' : 'folha') + ' inteira na tela (palco de ' + r.palco + ' px) e o inspetor rola');
    }
    await ctx.close();
  }

  console.log('Folhas: alinhamento da legenda na tela e no PDF (D-201):');
  {
    const { ctx, p } = await pagina(1440, 900);
    await p.goto(srv.url + 'app/adicionar-fotos/'); await p.waitForFunction(() => !!window.PLPROJETOS && !!window.PLFOTOS);
    await p.evaluate(async (L) => { localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear(); const pr = await PLPROJETOS.criar('Alinhar'); let i = 1;
      for (const n of L) { const b = await (await fetch('../../assets/img/fotos/' + n + '.jpg')).blob(); await PLFOTOS.salvar(i++, new File([b], n + '.jpg', { type: 'image/jpeg' }), pr.id); }
      sessionStorage.setItem('pl-fotos', '[1,2,3,4]'); await PLPROJETOS.salvarEstado(); }, FOTOS);
    await p.goto(srv.url + 'app/editor/quadro/#foto-1'); await p.waitForFunction(() => window.PLQ && PLQ.ST && PLQ.ST().length === 5);
    await p.evaluate(() => { const q = JSON.parse(sessionStorage.getItem('pl-quadro')); for (let k = 1; k < q.length; k++) q[k].pl = [{ v: 'Itacaré - BA', m: true }, { v: '20/04/23', m: true }]; sessionStorage.setItem('pl-quadro', JSON.stringify(q)); });
    await p.goto(srv.url + 'app/editor/'); await p.waitForFunction(() => document.querySelectorAll('#sheet .pol .pol__ml').length >= 4);
    await p.click('#tab-legendas'); await p.waitForSelector('#ef-al');
    await p.evaluate(async () => { for (const s of ['../../assets/vendor/fontkit.umd.min.js', '../../assets/js/nucleo/gerador.js']) { const e = document.createElement('script'); e.src = s; document.head.appendChild(e); await new Promise((ok) => e.onload = ok); } });
    for (const v of ['esq', 'centro', 'dir']) {
      await p.click('#ef-al label:has(input[value=' + v + '])'); await p.waitForTimeout(300);
      const r = await p.evaluate(async () => {
        const sh = document.getElementById('sheet'), pxmm = parseFloat(getComputedStyle(sh).getPropertyValue('--mm'));
        const fig = sh.querySelector('.pol figcaption'), fb = fig.getBoundingClientRect(), ml = fig.querySelector('.pol__ml'), g = document.createRange(); g.selectNodeContents(ml); const t = g.getBoundingClientRect();
        const tela = [(t.left - fb.left) / pxmm, (fb.right - t.right) / pxmm];
        const proj = PLGERADOR.projeto(); await PLGERADOR.preparar(proj); const L = PLGERADOR.lista(proj), fr = proj.fr;
        const gr = L.paginas[0].itens.find((i) => i.t === 'grupo' && i.itens.some((x) => x.t === 'foto')), x = gr.itens.find((i) => i.t === 'texto'), w = PLGERADOR.medir(x.txt, Object.assign({}, x.fonte, { pt: x.pt, esp: x.esp }));
        return { tela, pdf: [(x.x - fr.lado * 1000) / 1000, ((fr.lado + fr.jw) * 1000 - x.x - w) / 1000] };
      });
      const [te, td] = r.tela, [pe, pd] = r.pdf, alinhado = v === 'esq' ? te < .3 && pe < .3 : v === 'dir' ? td < .3 && pd < .3 : Math.abs(te - td) < .4 && Math.abs(pe - pd) < .4;
      ok(alinhado && Math.abs(te - pe) < .6 && Math.abs(td - pd) < .6, `«${v}»: tela ${te.toFixed(1)} / ${td.toFixed(1)} mm · PDF ${pe.toFixed(1)} / ${pd.toFixed(1)} mm das bordas da foto`);
    }
    /* D-205: no arquivo, as guias de corte saem tracejadas e suaves, como na tela; a decoração da colagem segue contínua */
    const gu = await p.evaluate(async () => { const proj = PLGERADOR.projeto(); await PLGERADOR.preparar(proj); const L = PLGERADOR.lista(proj); const ls = L.paginas[0].itens.filter((i) => i.t === 'linha'); return { n: ls.length, tr: ls.filter((l) => l.tracejado && l.tracejado[0] === 2000 && l.tracejado[1] === 1500 && l.alfa === .45).length, guias: proj.s.guias }; });
    ok(gu.guias && gu.n > 0 && gu.tr === gu.n, 'guias de corte no PDF: tracejadas (2 mm / 1,5 mm) e suaves (45%), como na tela (' + gu.tr + ' de ' + gu.n + ')');
    await ctx.close();
  }
} catch (e) { ok(false, 'exceção: ' + e.message.split(/\r?\n/)[0]); }
await nav.close(); srv.fechar?.();
console.log(falhas ? `\n✘ telas grandes: ${falhas} falha(s)` : '\n✔ telas grandes: sem falhas');
process.exit(falhas ? 1 : 0);
