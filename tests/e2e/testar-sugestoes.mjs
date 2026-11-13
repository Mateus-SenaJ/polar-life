/* D-198 · «O que vamos criar hoje?» (tela de Projetos): 24 sugestões (15 da D-198 e mais 9 de temas populares nas redes:
   photo dump, retrospectiva, aniversário, melhores amigas, antes e depois…), 6 delas colagens em pé (9:16) para status e reels,
   cartões mais altos, passagem automática para o lado com pausa (cursor, «Pausar») e a sugestão em pé abrindo a Colagem no
   tamanho Stories (1080 × 1920). As prévias são feitas pelo próprio PolarLife (tools/gerar-vitrine.mjs). */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
try {
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 860 } });
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(srv.url + 'app/'); await p.waitForSelector('#sugs .sug');
  const c = await p.evaluate(() => { const s = [...document.querySelectorAll('#sugs .sug')], im = s[0].querySelector('.sug__img').getBoundingClientRect();
    return { n: s.length, status: s.filter((b) => /^status-/.test(b.dataset.sug)).length, h: Math.round(im.height), w: Math.round(s[0].getBoundingClientRect().width), quebradas: [...document.querySelectorAll('#sugs img')].filter((i) => i.complete && !i.naturalWidth).length }; });
  ok(c.n === 24 && c.status === 6, `24 sugestões, 6 delas colagens em pé para status e reels (${c.n}, ${c.status})`);
  ok(c.h >= 200 && c.w >= 270, `cartões mais altos: prévia de ${c.w} × ${c.h} px (antes 236 × 136)`);
  await p.evaluate(() => Promise.all([...document.querySelectorAll('#sugs img')].map((i) => { i.loading = 'eager'; return i.decode().catch(() => null); })));
  ok((await p.evaluate(() => [...document.querySelectorAll('#sugs img')].filter((i) => !i.naturalWidth).length)) === 0, 'todas as 24 prévias carregam');

  const x0 = await p.evaluate(() => document.querySelector('.sugs').scrollLeft);
  await p.waitForTimeout(4300);
  const x1 = await p.evaluate(() => document.querySelector('.sugs').scrollLeft);
  ok(x1 > x0 + 100, `passam sozinhas para o lado (${Math.round(x0)} → ${Math.round(x1)} px)`);
  await p.hover('#sugs .sug'); const x2 = await p.evaluate(() => document.querySelector('.sugs').scrollLeft);
  await p.waitForTimeout(4300);
  ok(Math.abs((await p.evaluate(() => document.querySelector('.sugs').scrollLeft)) - x2) < 2, 'com o cursor em cima, param');
  await p.mouse.move(5, 5);
  await p.click('#sugs-pausa');
  ok((await p.textContent('#sugs-pausa')).trim() === 'Retomar' && (await p.evaluate(() => !PLSUGS.ligado())), '«Pausar» para a passagem (e vira «Retomar»)');
  await p.click('#sugs-pausa');
  ok((await p.textContent('#sugs-pausa')).trim() === 'Pausar', '«Retomar» volta a passar');

  await p.evaluate(() => { const b = document.querySelector('[data-sug="status-tira"]'); b.scrollIntoView({ inline: 'center' }); });
  await p.click('[data-sug="status-tira"]'); await p.waitForURL('**/app/editor/**', { timeout: 15000 });
  await p.waitForFunction(() => window.PLEDITOR && PLEDITOR.ctx().C && PLEDITOR.ctx().col, null, { timeout: 15000 });
  const ed = await p.evaluate(() => { const x = PLEDITOR.ctx(); return { peca: x.C.peca, lay: x.C.layout, rede: x.rede, vazias: document.querySelectorAll('#sheet .pol-vazia').length }; });
  ok(ed.peca === 'r916' && ed.lay === 'cabine' && ed.rede && ed.rede.h === 1920 && ed.vazias > 0, '«Tira para o status» abre a Colagem em Stories 9:16 (1080 × 1920), pronta para as fotos');
  /* as 9 novas: cada cartão abre a Colagem no tamanho e no layout da imagem, com as molduras vazias à espera das fotos */
  const NOVAS = [['dump', 'r45', 'mural', 1350], ['retrospectiva', 'r11', 'mural', 1080], ['aniversario', 'r45', 'capa', 1350], ['amigas', 'r11', 'espalhadas', 1080], ['historia', 'r45', 'tempo', 1350],
    ['antes-depois', 'r916', 'cabine', 1920], ['virada', 'r45', 'varal', 1350], ['ferias', 'A4', 'mosaico', 0, 'mini'], ['poster', '20x30', 'grade', 0, 'mini']];
  for (const [id, peca, lay, alt, fmt] of NOVAS) {
    await p.goto(srv.url + 'app/'); await p.waitForSelector('#sugs .sug');
    const txt = await p.evaluate((id) => { const b = document.querySelector('[data-sug="' + id + '"]'); if (!b) return null; b.scrollIntoView({ inline: 'center' }); return b.querySelector('strong').textContent + ' · ' + b.querySelector('small').textContent; }, id);
    if (!txt) { ok(false, 'falta o cartão ' + id); continue; }
    await p.click('[data-sug="' + id + '"]'); await p.waitForURL('**/app/editor/**', { timeout: 15000 });
    await p.waitForFunction(() => window.PLEDITOR && PLEDITOR.ctx().C && PLEDITOR.ctx().col, null, { timeout: 15000 });
    const e = await p.evaluate(async () => { const x = PLEDITOR.ctx(); return { peca: x.C.peca, lay: x.C.layout, alt: x.rede ? x.rede.h : 0, fmt: x.FR.fmt, vazias: document.querySelectorAll('#sheet .pol-vazia').length, nome: (await PLPROJETOS.listar()).find((y) => y.id === PLPROJETOS.atual()).nome }; });
    ok(e.peca === peca && e.lay === lay && e.alt === alt && e.vazias > 0 && (!fmt || e.fmt === fmt) && txt.indexOf(e.nome) === 0, `«${txt}» abre a Colagem ${peca} em «${lay}»${alt ? ' (1080 × ' + alt + ')' : ' para imprimir'}, com ${e.vazias} molduras à espera das fotos` + (e.peca === peca && e.lay === lay && e.alt === alt && e.vazias > 0 && (!fmt || e.fmt === fmt) && txt.indexOf(e.nome) === 0 ? '' : ' ' + JSON.stringify(e)));
  }
  ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await ctx.close();
} catch (e) { ok(false, 'exceção: ' + e.message.split(/\r?\n/)[0]); }
await nav.close(); srv.fechar?.();
console.log(falhas ? `\n✘ sugestões: ${falhas} falha(s)` : '\n✔ sugestões: sem falhas');
process.exit(falhas ? 1 : 0);
