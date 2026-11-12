/* D-193: os projetos são da conta (decisão do dono). Cada conta vê e abre só os próprios projetos neste aparelho; sair ou
   trocar de conta fecha o projeto aberto e tira as fotos de trabalho; voltar com a mesma conta traz os projetos dela.
   Projeto antigo sem dono fica com a primeira conta que o vê. O backup não leva o e-mail. Foto de exemplo do site (CC0). */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
const nomes = (p) => p.evaluate(async () => (await PLPROJETOS.listar()).map((x) => x.nome).sort());
async function entrar(p, perfil) { await p.goto(srv.url + 'app/entrar/'); await p.waitForFunction(() => !!window.PLCONTA); await p.evaluate((x) => PLCONTA.entrarComo(x), perfil); }
const fotosDeTrabalho = (p) => p.evaluate(() => new Promise((ok) => { const r = indexedDB.open('polar-life'); r.onsuccess = () => { const d = r.result; if (!d.objectStoreNames.contains('fotos')) { d.close(); ok(0); return; } const c = d.transaction('fotos').objectStore('fotos').count(); c.onsuccess = () => { d.close(); ok(c.result); }; }; r.onerror = () => ok(-1); }));
try {
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 860 } });
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(srv.url + 'app/entrar/'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

  console.log('Conta Pro cria um projeto:');
  await entrar(p, 'pro');
  await p.goto(srv.url + 'app/adicionar-fotos/'); await p.waitForFunction(() => !!window.PLPROJETOS && !!window.PLFOTOS);
  const idPro = await p.evaluate(async () => { const pr = await PLPROJETOS.criar('Viagem do Pro'); const b = await (await fetch('../../assets/img/fotos/casal-por-do-sol.jpg')).blob();
    await PLFOTOS.salvar(1, new File([b], 'a.jpg', { type: 'image/jpeg' }), pr.id); sessionStorage.setItem('pl-fotos', '[1]'); await PLPROJETOS.salvarEstado(); return pr.id; });
  await p.goto(srv.url + 'app/'); await p.waitForSelector('#lista .card');
  ok((await nomes(p)).join() === 'Viagem do Pro', 'a conta Pro vê o projeto dela');
  const bk = await p.evaluate(async (id) => JSON.stringify(await PLPROJETOS.exportar(id)), idPro);
  ok(!/polarlife\.test/.test(bk) && !/"dono"/.test(bk), 'o backup (.polarlife) não leva o e-mail nem a marca da conta');

  console.log('Sair fecha o projeto aberto:');
  await p.evaluate(() => PLCONTA.sair()); await p.waitForTimeout(400);
  const fechado = await p.evaluate(() => ({ atual: localStorage.getItem('pl-projeto-atual'), sess: Object.keys(sessionStorage).filter((k) => /^pl-/.test(k)) }));
  ok(!fechado.atual && !fechado.sess.length && (await fotosDeTrabalho(p)) === 0, 'ao sair: sem projeto aberto, sem estado na aba e sem fotos de trabalho');

  console.log('Outra conta não vê nem abre:');
  await entrar(p, 'gratis');
  await p.goto(srv.url + 'app/'); await p.waitForFunction(() => !!window.PLPROJETOS);
  await p.waitForFunction(() => !document.getElementById('vazio').hidden);
  ok((await nomes(p)).length === 0, 'a conta Grátis não vê o projeto da Pro («Nenhum projeto ainda»)');
  const tenta = await p.evaluate(async (id) => { let abriu = true; try { await PLPROJETOS.abrir(id); } catch (e) { abriu = false; } await PLPROJETOS.renomear(id, 'Mexido'); await PLPROJETOS.excluir(id); return abriu; }, idPro);
  ok(!tenta, 'nem pelo endereço do projeto: abrir o projeto de outra conta não funciona');
  await p.evaluate(async () => { await PLPROJETOS.criar('Projeto Grátis'); });

  console.log('Trocar de conta direto (sem sair):');
  await entrar(p, 'pro');
  const trocou = await p.evaluate(() => localStorage.getItem('pl-projeto-atual'));
  ok(!trocou, 'entrar com outra conta fecha o projeto que estava aberto');
  await p.goto(srv.url + 'app/'); await p.waitForSelector('#lista .card');
  ok((await nomes(p)).join() === 'Viagem do Pro', 'a Pro volta a ver só o projeto dela, com o nome intacto (renomear e excluir da outra conta não valeram)');
  const ab = await p.evaluate(async (id) => (await PLPROJETOS.abrir(id)).fotos, idPro);
  ok(ab === 1, 'e abre com a foto de volta');

  console.log('Projeto antigo, sem dono:');
  await p.evaluate(() => PLFOTOS.abrirDB().then((d) => new Promise((ok) => { const t = d.transaction('projetos', 'readwrite'); t.objectStore('projetos').put({ id: 'pAntigo', nome: 'Projeto antigo', criadoEm: 1, atualizadoEm: 1, exemplo: false, v: 2, estado: {} }); t.oncomplete = () => { d.close(); ok(); }; })));
  ok((await nomes(p)).includes('Projeto antigo'), 'aparece para a conta que entra (fica com ela)');
  await p.waitForTimeout(300);
  await entrar(p, 'gratis'); await p.goto(srv.url + 'app/'); await p.waitForFunction(() => !!window.PLPROJETOS);
  const g = await nomes(p);
  ok(g.join() === 'Projeto Grátis', 'e não aparece para a outra conta (' + g.join(', ') + ')');
  ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await ctx.close();
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ projetos da conta: ${falhas} falha(s)` : '\n✔ projetos da conta: sem falhas');
process.exit(falhas ? 1 : 0);
