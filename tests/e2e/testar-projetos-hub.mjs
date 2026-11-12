/* D-177: Projetos como tela central — sugestões com foto real no topo, opções de criar logo abaixo SEM ROLAR (390×844,
   412×915, 375×667, 768×1024, 1440×900) e, rolando, os projetos. Cada sugestão cria o projeto no formato/modo certo. */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (m) => console.log('  ✔ ' + m);
const ruim = (m) => { falhas++; console.log('  ✘ ' + m); };
const srv = await servir();
const nav = await chromium.launch();
const foto = (await readFile(new URL('../../site/assets/img/fotos/praia.jpg', import.meta.url))).toString('base64');
async function contexto(w, h, comProjeto) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  if (comProjeto) {
    await p.goto(srv.url + 'app/adicionar-fotos/');
    await p.evaluate(async (d) => { localStorage.removeItem('pl-projeto-atual'); const pr = await PLPROJETOS.criar('Viagem com a turma'); await PLFOTOS.salvar(1, new File([Uint8Array.from(atob(d), (c) => c.charCodeAt(0))], 'f.jpg', { type: 'image/jpeg' }), pr.id); sessionStorage.setItem('pl-fotos', '[1]'); await PLPROJETOS.salvarEstado(); }, foto);
  }
  await p.goto(srv.url + 'app/', { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
  return { ctx, p, erros };
}
try {
  for (const [w, h] of [[390, 844], [412, 915], [375, 667], [768, 1024], [1440, 900]]) {
    const { ctx, p, erros } = await contexto(w, h, true);
    const m = await p.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect(), barra = document.querySelector('.app-barra');
      const limite = innerHeight - (barra && getComputedStyle(barra).display !== 'none' ? barra.getBoundingClientRect().height : 0);
      const imgs = [...document.querySelectorAll('.sug__img')];
      return { criar: Math.round(r('.criar').bottom), limite: Math.round(limite), sugTopo: Math.round(r('.sugs').top), projs: Math.round(r('#t-projs').top), imgs: imgs.length, ok: imgs.filter((i) => i.complete && i.naturalWidth > 0).length, card: !!document.querySelector('#lista .card'), led: document.querySelectorAll('.led-btn').length };
    });
    m.criar <= m.limite ? ok(`${w}×${h}: sugestões e opções de criar visíveis sem rolar (até ${m.criar} px de ${m.limite})`) : ruim(`${w}×${h}: opções abaixo da dobra ${JSON.stringify(m)}`);
    m.sugTopo < m.criar && m.criar < m.projs && m.card ? ok(`${w}×${h}: ordem sugestões → criar → seus projetos`) : ruim(`${w}×${h}: ordem ${JSON.stringify(m)}`);
    if (w === 390) {
      m.imgs === 6 && m.ok === 6 ? ok('6 sugestões, todas com foto real carregada') : ruim(`fotos das sugestões: ${m.ok}/${m.imgs}`);
      m.led === 1 ? ok('um único botão LED na tela: «Polaroids para imprimir» (T8)') : ruim('LEDs na tela: ' + m.led);
    }
    erros.length === 0 || ruim('erros: ' + erros.join(' | '));
    await ctx.close();
  }
  /* cada sugestão cria o projeto certo */
  for (const [sug, conf] of [['coracao', (s) => s.col && s.col.ativo && s.col.layout === 'coracao' && !s.fmt], ['casal', (s) => s.fmt === 'pocket' && !s.col], ['viagem', (s) => !s.fmt && !s.col]]) {
    const { ctx, p } = await contexto(390, 844, false);
    await p.click(`[data-sug="${sug}"]`);
    await p.waitForURL('**/app/adicionar-fotos/', { timeout: 8000 });
    const s = await p.evaluate(async () => ({ fmt: sessionStorage.getItem('pl-fmt'), col: JSON.parse(sessionStorage.getItem('pl-colagem') || 'null'), nome: (await PLPROJETOS.listar()).find((x) => x.id === PLPROJETOS.atual()).nome }));
    conf(s) ? ok(`sugestão «${s.nome}»: projeto criado e segue para escolher as fotos`) : ruim(`sugestão ${sug}: ${JSON.stringify(s)}`);
    await ctx.close();
  }
  {
    const { ctx, p } = await contexto(390, 844, false);
    const vazio = await p.evaluate(() => ({ txt: !document.getElementById('vazio').hidden, lista: document.getElementById('lista').hidden, hub: !!document.querySelector('.sug') }));
    vazio.txt && vazio.lista && vazio.hub ? ok('sem projetos: sugestões e opções continuam no topo e aparece o aviso «Nenhum projeto ainda»') : ruim('estado vazio: ' + JSON.stringify(vazio));
    await p.click('#criar-colagem'); await p.waitForURL('**/app/adicionar-fotos/', { timeout: 8000 });
    const c = await p.evaluate(() => JSON.parse(sessionStorage.getItem('pl-colagem') || 'null'));
    c && c.ativo ? ok('«Colagem» cria um projeto já no Modo Colagem') : ruim('Colagem: ' + JSON.stringify(c));
    await p.goto(srv.url + 'app/'); await p.click('#novo1'); await p.waitForURL('**/app/novo-projeto/', { timeout: 8000 });
    ok('«Polaroids para imprimir» abre «Novo projeto» (formato e papel)');
    await ctx.close();
  }
} catch (e) { ruim('exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ projetos (tela central): ${falhas} falha(s)` : '\n✔ projetos (tela central): sem falhas');
process.exit(falhas ? 1 : 0);
