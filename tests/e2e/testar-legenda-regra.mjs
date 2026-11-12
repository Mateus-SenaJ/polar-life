/* D-192: regra fixa da legenda (pedido do dono), igual no Quadro e no PDF (MT-02):
   - vai de onde a foto começa até onde ela termina (mesma margem lateral da moldura);
   - o topo das maiúsculas da 1ª linha fica 3 mm abaixo da foto e não sobe (deslocar só para baixo);
   - texto maior que a foto diminui o corpo até caber (o Quadro e o PDF chegam ao mesmo corpo). */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
const FMT = { classico: { w: 88, h: 107, jh: 76, lado: 6, topo: 6 }, pocket: { w: 66, h: 99, jh: 79, lado: 3, topo: 3 }, imini: { w: 54, h: 86, jh: 62, lado: 4, topo: 5 } };
const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/icc.js', 'assets/js/nucleo/gerador.js'];
const TEXTOS = { curto: ['Pipa - RN', '20/04/23'], longo: ['Praia de Taipú de Fora, Maraú - Bahia', 'Farol e piscinas naturais no fim da tarde'] };
try {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.evaluate(async () => { localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear(); const pr = await PLPROJETOS.criar('Regra da legenda');
    const b = await (await fetch('../../assets/img/fotos/casal-por-do-sol.jpg')).blob(); await PLFOTOS.salvar(1, new File([b], 'a.jpg', { type: 'image/jpeg' }), pr.id);
    sessionStorage.setItem('pl-fotos', '[1]'); await PLPROJETOS.salvarEstado(); });
  for (const fmt of Object.keys(FMT)) for (const [nomeT, txt] of Object.entries(TEXTOS)) {
    const F = FMT[fmt], wb = F.topo + F.jh;
    await p.goto(srv.url + 'app/editor/quadro/'); await p.waitForFunction(() => !!window.PLTEXTO);
    await p.evaluate(({ fmt, F, txt }) => {
      const l = fmt === 'pocket' ? PLTEXTO.legPocket(PLTEXTO.LEG0) : PLTEXTO.legInicial(); l.dy = -3;   /* tentou subir: não pode */
      const e = { src: 1, modo: 'preencher', z: 100, ang: 0, px: 0, py: 0, rot: 0, flip: false, adj: { brilho: 0, contraste: 0, saturacao: 0, temp: 0, realces: 0, sombras: 0, nitidez: 0, vinheta: 0 }, txt: null, flt: { id: 'original', int: 100 }, pl: [{ v: txt[0], m: true }, { v: txt[1], m: true }] };
      sessionStorage.setItem('pl-quadro', JSON.stringify([{ leg: l, fr: Object.assign({ fmt, rad: .4, man: false, lock: true, ori: 'v' }, F) }, e])); sessionStorage.removeItem('pl-fmt');
    }, { fmt, F, txt });
    await p.goto(srv.url + 'app/editor/quadro/#foto-1'); await p.reload();
    await p.waitForFunction(() => document.querySelectorAll('#pq .lg-l--x').length === 2); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    const Q = await p.evaluate(() => {
      const pq = document.getElementById('pq'), R = pq.getBoundingClientRect(), mm = R.width / PLQ.FR.cw, w = pq.querySelector('.win').getBoundingClientRect();
      const l = PLTEXTO.ajustarCorpo(PLTEXTO.comPadrao(PLQ.ST()[0].leg, PLQ.S()), PLQ.FR, PLTEXTO.larguraTela), LNS = PLTEXTO.linhas(l, PLQ.FR, PLTEXTO.medTela, { temData: true, temLoc: true });
      return { dy: PLQ.ST()[0].leg.dy, linhas: [...pq.querySelectorAll('.lg-l--x')].map((e, i) => { const rg = document.createRange(); rg.selectNodeContents(e.firstElementChild || e); const b = rg.getBoundingClientRect();
        return { esq: (b.left - w.left) / mm, dir: (w.right - b.right) / mm, top: (e.getBoundingClientRect().top - R.top) / mm, lnTop: LNS[i].top, letras: LNS[i].letrasTop, pt: parseFloat(getComputedStyle(e.firstElementChild || e).fontSize) / mm / .3528 }; }) };
    });
    for (const s of SCRIPTS) await p.addScriptTag({ url: srv.url + s });
    const P = await p.evaluate(async () => {
      const pr = PLGERADOR.projeto(); await PLGERADOR.preparar(pr); const L = PLGERADOR.lista(pr), out = [];
      (function wk(o) { if (!o) return; if (Array.isArray(o)) return o.forEach(wk); if (typeof o === 'object') { if (o.t === 'texto') out.push(o); Object.keys(o).forEach((k) => { if (o[k] && typeof o[k] === 'object' && k !== 'fonte') wk(o[k]); }); } })(L.paginas[0].itens);
      return out.slice(0, 2).map((t) => { const m = PLGERADOR.metricas({ fam: t.fonte.fam, peso: t.fonte.peso, it: t.fonte.it, pt: t.pt }); const w = PLGERADOR.medir(t.txt, { fam: t.fonte.fam, peso: t.fonte.peso, it: t.fonte.it, pt: t.pt, esp: t.esp });
        return { txt: t.txt, x: t.x / 1000, dir: (t.x + w) / 1000, letras: (t.y - m.cap * t.pt * .3528 * 1000) / 1000, pt: t.pt }; });
    });
    const q0 = Q.linhas[0], q1 = Q.linhas[1], p0 = P[0];
    const rotulo = fmt + ' · texto ' + nomeT;
    ok(Q.dy === 0, rotulo + ': deslocar para cima volta a 0 (a legenda não sobe)');
    ok(Math.abs(q0.letras - wb - 3) < .05 && Math.abs(q0.top - q0.lnTop) <= .3 && Math.abs(p0.letras - wb - 3) <= .1, rotulo + ': maiúsculas da 1ª linha a 3 mm da foto (Quadro ' + (q0.letras - wb).toFixed(2) + ' mm · PDF ' + (p0.letras - wb).toFixed(2) + ' mm)');
    ok(Q.linhas.every((l) => l.esq >= -.3 && l.dir >= -.3) && P.every((t) => t.x >= F.lado - .01 && t.dir <= F.lado + (F.w - 2 * F.lado) + .05), rotulo + ': as duas linhas dentro da largura da foto, no Quadro e no PDF');
    if (nomeT === 'longo') ok((fmt !== 'imini' || q0.pt < 7) && q0.pt <= 8.05 && Math.abs(q0.pt - p0.pt) <= .25 && Math.abs(q1.pt - P[1].pt) <= .25, rotulo + ': o corpo diminui só o necessário para caber, igual no Quadro e no PDF (Quadro ' + q0.pt.toFixed(1) + '/' + q1.pt.toFixed(1) + ' pt · PDF ' + p0.pt.toFixed(1) + '/' + P[1].pt.toFixed(1) + ' pt)');
    else ok(Math.abs(q0.pt - 8) < .15, rotulo + ': texto que cabe fica no corpo escolhido (' + q0.pt.toFixed(1) + ' pt)');
  }
  ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await ctx.close();
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ regra da legenda: ${falhas} falha(s)` : '\n✔ regra da legenda: sem falhas');
process.exit(falhas ? 1 : 0);
