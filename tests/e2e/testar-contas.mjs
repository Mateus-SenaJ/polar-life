#!/usr/bin/env node
// Contas em modo demonstração (D-116, D-123, D-124): guarda de /app/, entrar por e-mail/código,
// portão de exportação, planos, painel do admin e códigos de impressão. Selo e um LED por tela (T3/T8).
// Uso: npm run testar:contas  (Chromium do Playwright)
import { chromium } from 'playwright';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from '../helpers/servidor.mjs';
import { maisAbertos } from '../helpers/mais.mjs';

const falhas = [], ok = m => console.log('  ✔ ' + m), ruim = m => { falhas.push(m); console.log('  ✘ ' + m); };
const srv = await servir();
const nav = await chromium.launch();
const _novoCtx = nav.newContext.bind(nav);
nav.newContext = async (o) => { const c = await _novoCtx(o); await c.addInitScript(() => { try { localStorage.setItem('pl-ver-contas-teste', '1'); } catch (e) {} }); return c; };   /* D-194: contas de teste à vista só com a marca do aparelho */
const saida = fileURLToPath(new URL('../saida/contas/', import.meta.url));
await mkdir(saida, { recursive: true });

/* pré-voo válido (mesma chave() de exportar.js/gerar.js): djb2 de pl-quadro|pl-folhas vazios */
const PREVOO = n => `(() => {
  let t = (sessionStorage.getItem('pl-quadro') || '') + '|' + (sessionStorage.getItem('pl-folhas') || '') + '|' + (sessionStorage.getItem('pl-colagem') || ''), x = 5381;
  for (let i = 0; i < t.length; i++) x = ((x << 5) + x + t.charCodeAt(i)) | 0;
  sessionStorage.setItem('pl-prevoo', JSON.stringify({ ok: true, k: String(x), n: ${n}, fotos: 24, por: 4, papel: 'A4', w: 210, h: 297, orient: 'retrato' }));
  sessionStorage.setItem('pl-exportar', JSON.stringify({ f: 'pdf', lim: 150 }));
})()`;
const SESSAO = email => `localStorage.setItem('pl-conta', JSON.stringify({ email: '${email}', entrouEm: Date.now() }))`;
const mascara = cod => cod.slice(0, 2) + '-' + cod.slice(2, 6) + '-' + cod.slice(6); /* PL-XXXX-XXXX */

/* contexto com sessão (e pré-voo opcional) já prontos */
async function contexto(email, nFolhas) {
  const c = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await maisAbertos(c);   /* D-172: ajustes avançados à vista */
  /* D-167: com o ID do Google publicado o botão vai ao Google de verdade (coberto em testar-google);
     aqui o fluxo de demonstração continua coberto servindo o google.js sem ID */
  const g = (await readFile(new URL('../../site/assets/js/nucleo/google.js', import.meta.url), 'utf8')).replace(/var CLIENT_ID='[^']*';/, "var CLIENT_ID='';");
  await c.route('**/assets/js/nucleo/google.js', (r) => r.fulfill({ contentType: 'application/javascript', body: g }));
  if (email) await c.addInitScript(SESSAO(email));
  if (nFolhas) await c.addInitScript(PREVOO(nFolhas));
  return c;
}
const ledsVisiveis = p => p.evaluate(() => [...document.querySelectorAll('.led-btn')].filter(el => {
  const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
}).length);
const urlAbs = p => { const u = new URL(p.url()); return u.pathname + u.search; };

/* fotos sintéticas para a T-03 (nunca as fotos pessoais; T5) */
const dirFotos = join(saida, 'fotos');
await rm(dirFotos, { recursive: true, force: true }); await mkdir(dirFotos, { recursive: true });
const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD//gAFFTVBWk4nSUpJLklNUVVJTEFEBQGCCAsQ//8A', 'base64');
const fotos = [];
for (let i = 1; i <= 11; i++) { const f = join(dirFotos, `f${i}.jpg`); await writeFile(f, jpeg); fotos.push(f); }

/* ===================== A · guarda de /app/ (D-123) ===================== */
{
  const c = await contexto(null);
  const p = await c.newPage();
  await p.goto(srv.url + 'app/');
  urlAbs(p) === '/app/entrar/?voltar=%2Fapp%2F' && await p.locator('#caixa').isVisible()
    ? ok('sem sessão: /app/ vai para entrar com ?voltar') : ruim(`sem sessão: foi para ${urlAbs(p)}`);
  await p.goto(srv.url + 'app/editor/exportar/');
  urlAbs(p) === '/app/entrar/?voltar=' + encodeURIComponent('/app/editor/exportar/')
    ? ok('sem sessão: página profunda guarda o caminho em ?voltar') : ruim(`página profunda: foi para ${urlAbs(p)}`);
  await p.goto(srv.url + 'app/entrar/');
  urlAbs(p) === '/app/entrar/' && await p.locator('#caixa').isVisible()
    ? ok('entrar/ é isenta da guarda') : ruim(`entrar/ redirecionou para ${urlAbs(p)}`);
  await p.close(); await c.close();

  const c2 = await contexto('pro@polarlife.test');
  const p2 = await c2.newPage();
  await p2.goto(srv.url + 'app/');
  urlAbs(p2) === '/app/' && await p2.locator('.app-header').isVisible()
    ? ok('com sessão: /app/ fica em /app/') : ruim(`com sessão: foi para ${urlAbs(p2)}`);
  await p2.close(); await c2.close();
}

/* ===================== B · sem a faixa «Ambiente de teste» (D-170: o dono pediu para retirar) ===================== */
{
  const c = await contexto('pro@polarlife.test');
  const p = await c.newPage();
  const paginas = ['', 'novo-projeto/', 'orientacao/', 'processando/', 'resumo/', 'adicionar-fotos/', 'conexoes/', 'estados/',
    'editor/', 'editor/quadro/', 'editor/exportar/', 'editor/gerar/', 'editor/imprimir/', 'editor/compartilhar/',
    'entrar/', 'conta/', 'conta/planos/', 'admin/'];
  let tudo = true;
  for (const pg of paginas) {
    await p.goto(srv.url + 'app/' + pg, { waitUntil: 'domcontentloaded' });
    const selo = await p.evaluate(() => {
      const s = document.querySelector('.selo-teste');
      return !s && !/Ambiente de teste/.test(document.body.textContent.slice(0, 400));
    });
    if (!selo) { tudo = false; ruim('faixa «Ambiente de teste» ainda aparece em /app/' + pg); }
  }
  if (tudo) ok(`sem a faixa «Ambiente de teste» nas ${paginas.length} páginas de /app/`);
  await p.close(); await c.close();

  /* um LED por tela (T8; Pro sem LED na Conta é regra do brief §3.2, pop-ups à parte) */
  const led1 = async (email, pg) => {
    const c = await contexto(email);
    const p = await c.newPage();
    await p.goto(srv.url + 'app/' + pg, { waitUntil: 'networkidle' });
    const n = await ledsVisiveis(p);
    await p.close(); await c.close();
    return n;
  };
  (await led1(null, 'entrar/')) === 1 ? ok('entrar/: um LED («Entrar»)') : ruim('entrar/: LEDs divergem do T8');
  (await led1('gratis@polarlife.test', 'conta/')) === 1 ? ok('conta/ (Grátis): um LED («Ver folhas e planos»)') : ruim('conta/: LEDs divergem do T8');
  (await led1('pro@polarlife.test', 'conta/planos/')) === 1 ? ok('planos/: um LED («Continuar»)') : ruim('planos/: LEDs divergem do T8');
  (await led1('admin@polarlife.test', 'admin/')) === 1 ? ok('admin/: um LED («Salvar alterações»)') : ruim('admin/: LEDs divergem do T8');
}

/* ===================== C · entrar por e-mail + código de 6 dígitos ===================== */
{
  const c = await contexto(null);
  const p = await c.newPage();

  /* contas de teste */
  await p.goto(srv.url + 'app/entrar/');
  await p.locator('[data-perfil=admin]').click();
  await p.waitForURL('**/app/inicio/', { timeout: 5000 });
  (await p.evaluate(() => PLCONTA.plano().id)) === 'admin' ? ok('conta de teste: entrou como Admin') : ruim('conta de teste: Admin não entrou');

  /* «Esqueci a senha» → e-mail → código certo e errado → senha nova (D-144) */
  const pedirCodigo = async email => {
    await p.locator('#b-esqueci').click();
    await p.locator('#rec-email').fill(email);
    await p.locator('#b-rec').click();
    await p.locator('text=Confira o código').waitFor({ timeout: 5000 });
  };
  await p.evaluate(() => PLCONTA.sair());
  await p.goto(srv.url + 'app/entrar/');
  await pedirCodigo('dona@exemplo.com');
  const cod = (await p.locator('.cx-info .cod').textContent()).replace(/\D/g, '');
  const errado = cod === '000000' ? '111111' : '000000';
  await p.locator('#cod').fill(errado);
  await p.locator('#b-confirmar').click();
  (await p.locator('#erro-cod').isVisible()) && /Código incorreto/.test(await p.locator('#erro-cod').textContent())
    ? ok('código errado: erro em tela, sem entrar') : ruim('código errado: erro esperado');
  await p.locator('#cod').fill(cod);
  await p.locator('#b-confirmar').click();
  await p.locator('#f-nova').waitFor({ timeout: 5000 });
  ok('código certo: pede a senha nova');
  await p.locator('#n-senha').fill('curta'); await p.locator('#b-nova').click();
  (await p.locator('#erro-n-senha').isVisible()) && /8 caracteres/.test(await p.locator('#erro-n-senha').textContent())
    ? ok('senha nova curta: erro em tela') : ruim('senha nova curta aceita');
  await p.locator('#n-senha').fill('senha-da-dona-1'); await p.locator('#b-nova').click();
  await p.locator('#f-dados').waitFor({ timeout: 5000 });
  ok('e-mail novo confirmado: pede «Seus dados» antes de entrar');
  await p.locator('#d-nome').fill('Dona Teste'); await p.locator('#d-aceite').check(); await p.locator('#b-dados').click();
  await p.waitForURL('**/app/inicio/', { timeout: 5000 });
  const pl = await p.evaluate(() => PLCONTA.plano());
  pl.id === 'gratis' && pl.email === 'dona@exemplo.com'
    ? ok('código certo: entrou (plano Grátis para e-mail novo)') : ruim('código certo: ' + JSON.stringify(pl.id));

  /* a senha definida pelo «Esqueci a senha» vale na entrada; a senha nunca fica em texto puro (D-144) */
  await p.evaluate(() => PLCONTA.sair());
  await p.goto(srv.url + 'app/entrar/');
  await p.locator('#email').fill('Dona@Exemplo.com'); await p.locator('#senha').fill('senha-errada-9'); await p.locator('#b-enviar').click();
  await p.locator('#erro-senha').waitFor({ timeout: 5000 });
  /E-mail ou senha incorretos/.test(await p.locator('#erro-senha').textContent()) && !(await p.evaluate(() => PLCONTA.temSessao()))
    ? ok('senha errada: «E-mail ou senha incorretos», sem entrar') : ruim('senha errada: mensagem esperada');
  await p.locator('#email').fill('ninguem@exemplo.com'); await p.locator('#senha').fill('senha-da-dona-1'); await p.locator('#b-enviar').click();
  await p.locator('#erro-senha').waitFor({ timeout: 5000 });
  /E-mail ou senha incorretos/.test(await p.locator('#erro-senha').textContent())
    ? ok('e-mail sem conta: mesma mensagem (não revela se o e-mail existe)') : ruim('e-mail sem conta: mensagem diferente');
  await p.locator('#email').fill('Dona@Exemplo.com'); await p.locator('#senha').fill('senha-da-dona-1'); await p.locator('#b-enviar').click();
  await p.waitForURL('**/app/inicio/', { timeout: 5000 });
  const ss = await p.evaluate(() => ({ s: PLCONTA.sessao(), bruto: Object.keys(localStorage).map(k => localStorage.getItem(k)).join('\n'), reg: JSON.parse(localStorage.getItem('pl-contas-teste'))['dona@exemplo.com'].senha, exp: JSON.stringify(PLCONTA.plano()) }));
  ss.s.email === 'dona@exemplo.com' && ss.s.provedor === 'senha' ? ok('e-mail + senha certos: entrou') : ruim('sessão por senha: ' + JSON.stringify(ss.s));
  ss.bruto.indexOf('senha-da-dona-1') < 0 && ss.reg.alg === 'PBKDF2-SHA256' && /^[0-9a-f]{32}$/.test(ss.reg.sal) && /^[0-9a-f]{64}$/.test(ss.reg.hash) && ss.reg.it >= 100000
    ? ok('a senha não fica em texto puro: só sal aleatório + derivação PBKDF2-SHA-256') : ruim('armazenamento da senha: ' + JSON.stringify(ss.reg));
  ss.exp.indexOf(ss.reg.hash) < 0 ? ok('o plano da sessão não carrega a derivação da senha') : ruim('a derivação da senha vazou no plano');

  /* «Criar nova conta»: nome, e-mail, senha e aceite; e-mail repetido é recusado */
  await p.evaluate(() => PLCONTA.sair());
  await p.goto(srv.url + 'app/entrar/');
  await p.locator('#b-criar').click();
  await p.locator('#c-nome').fill('Bia Nova'); await p.locator('#c-email').fill('bia@exemplo.com'); await p.locator('#c-senha').fill('1234567'); await p.locator('#c-aceite').check();
  await p.locator('#b-criar-conta').click();
  await p.locator('#erro-c-senha').waitFor({ timeout: 5000 });
  ok('criar conta: senha com menos de 8 caracteres é recusada');
  await p.locator('#c-senha').fill('senha-da-bia-22'); await p.locator('#c-aceite').uncheck(); await p.locator('#b-criar-conta').click();
  await p.locator('#erro-c-aceite').waitFor({ timeout: 5000 });
  ok('criar conta: aceite obrigatório');
  (await p.locator('.led-btn').count()) === 1 ? ok('criar conta: um único LED (T8)') : ruim('criar conta: mais de um LED');
  await p.locator('#c-aceite').check(); await p.locator('#b-criar-conta').click();
  await p.waitForURL('**/app/inicio/', { timeout: 5000 });
  const sb = await p.evaluate(() => ({ s: PLCONTA.sessao(), pend: PLCONTA.cadastroPendente(), pl: PLCONTA.plano().id }));
  sb.s.email === 'bia@exemplo.com' && sb.s.nome === 'Bia Nova' && !sb.pend && sb.pl === 'gratis' ? ok('criar conta: entrou no plano Grátis, sem etapa extra') : ruim('criar conta: ' + JSON.stringify(sb));
  const rep = await p.evaluate(async () => { PLCONTA.sair(); const r = []; for (const em of ['BIA@exemplo.com', 'pro@polarlife.test']) { try { await PLCONTA.criarConta({ nome: 'Outra', email: em, senha: 'outra-senha-33', aceite: true }); r.push('criou'); } catch (e) { r.push(e.erro); } } return r.join('|') + '|' + PLCONTA.temSessao(); });
  const nomeS = await p.evaluate(async () => { const c = await PLCONTA.criarConta({ nome: '  Mateus   Sena ', email: 'sss@exemplo.com', senha: 'senha-sss-123', aceite: true }); const n = PLCONTA.sessao().nome; PLCONTA.sair(); return n; });
  nomeS === 'Mateus Sena' ? ok('criar conta: nome normalizado sem perder letras «s»') : ruim('criar conta: nome virou ' + JSON.stringify(nomeS));
  rep === 'existe|existe|false' ? ok('criar conta: e-mail já usado (ou de conta de teste) é recusado') : ruim('criar conta repetida: ' + rep);

  /* 5 senhas erradas → espera de 30 s com contagem no botão */
  await p.goto(srv.url + 'app/entrar/');
  for (let i = 0; i < 5; i++) { await p.locator('#email').fill('bia@exemplo.com'); await p.locator('#senha').fill('errada-' + i + '-xyz'); await p.locator('#b-enviar').click(); await p.locator('#b-enviar[aria-busy=false]').waitFor({ timeout: 5000 }); }
  /Muitas tentativas/.test(await p.locator('#erro-senha').textContent()) && await p.locator('#b-enviar').isDisabled()
    ? ok('5 senhas erradas: «Muitas tentativas» e LED em espera') : ruim('bloqueio por senha errada ausente');

  /* entrada: 1º bloco e-mail + senha («Esqueci a senha», «Criar nova conta»); 2º bloco Google e Apple; código discreto abaixo */
  await p.evaluate(() => PLCONTA.sair());
  await p.goto(srv.url + 'app/entrar/');
  const provs = await p.locator('[data-prov]').allTextContents();
  provs.join('|') === 'Continuar com Google' ? ok('segundo bloco: só o Google (D-194: a Apple, que só simulava, saiu)') : ruim('provedores: ' + provs.join('|'));
  const ordem = await p.evaluate(() => {
    const q = s => document.querySelector(s), antes = (a, b) => !!(a.compareDocumentPosition(b) & 4);
    const em = q('#email'), se = q('#senha'), esq = q('#b-esqueci'), led = q('#b-enviar'), criar = q('#b-criar'), prov = q('[data-prov]'), cod = q('#b-via-codigo');
    return {
      bloco1: antes(em, se) && antes(se, esq) && antes(esq, led) && antes(led, criar),
      bloco2: antes(criar, prov) && antes(prov, cod),
      senha: se.type === 'password' && se.autocomplete === 'current-password',
      discretos: [esq, cod].every(b => !b.classList.contains('led-btn') && !b.classList.contains('btn2')),
      alvos: [esq, criar, cod].every(b => b.getBoundingClientRect().height >= 44),
      led: led.textContent.trim()
    };
  });
  ordem.bloco1 ? ok('primeiro bloco: e-mail, senha, «Esqueci a senha», «Entrar» e «Criar nova conta»') : ruim('ordem do primeiro bloco');
  ordem.bloco2 ? ok('segundo bloco (Google) vem depois; «Entrar com código» fica abaixo') : ruim('ordem do segundo bloco');
  ordem.senha ? ok('campo de senha mascarado, com autocomplete correto') : ruim('campo de senha');
  ordem.discretos && ordem.alvos ? ok('«Esqueci a senha» e «Entrar com código» são links discretos com alvo ≥ 44 px (T3)') : ruim('peso/alvo dos links discretos');
  (await p.locator('.led-btn').count()) === 1 && ordem.led === 'Entrar' ? ok('um único LED na entrada: «Entrar» (T8)') : ruim('LED da entrada: ' + ordem.led);
  await p.locator('[data-prov=google]').click();
  /Demonstração/.test(await p.locator('#caixa').textContent()) ? ok('Google: aviso honesto de demonstração (T7)') : ruim('sem aviso de demonstração');
  await p.locator('#d-nome').fill('Ana Google'); await p.locator('#d-email').fill('ana@exemplo.com'); await p.locator('#d-aceite').check(); await p.locator('#b-dados').click();
  await p.waitForURL('**/app/inicio/', { timeout: 5000 });
  const sg = await p.evaluate(() => PLCONTA.sessao());
  sg.nome === 'Ana Google' && sg.provedor === 'google' && sg.email === 'ana@exemplo.com' ? ok('Google (demo): entrou com nome e e-mail') : ruim('sessão google: ' + JSON.stringify(sg));

  /* 5 tentativas erradas bloqueiam e trocam o LED (brief §2.4: a 6ª vê o bloqueio) */
  await p.evaluate(() => PLCONTA.sair());
  await p.goto(srv.url + 'app/entrar/');
  await pedirCodigo('outro@exemplo.com');
  for (let i = 0; i < 6; i++) { await p.locator('#cod').fill('000000'); await p.locator('#b-confirmar').click(); await p.waitForTimeout(100); }
  (await p.locator('#erro-cod').isVisible()) && /Muitas tentativas/.test(await p.locator('#erro-cod').textContent())
    ? ok('5 tentativas: «Muitas tentativas» e pede código novo') : ruim('5 tentativas: mensagem esperada');
  /Enviar novo código/.test(await p.locator('#b-confirmar .btn-content').textContent())
    ? ok('5 tentativas: LED vira «Enviar novo código»') : ruim('LED após tentativas divergente');

  /* estados de revisão (checklist §8.5); hash muda sem recarregar, então força o reload */
  await p.goto(srv.url + 'app/entrar/#estado-email-invalido'); await p.reload();
  (await p.locator('#erro-email').isVisible()) && /e-mail válido/.test(await p.locator('#erro-email').textContent())
    ? ok('estado #estado-email-invalido') : ruim('#estado-email-invalido sem erro');
  for (const [hash, texto] of [['#estado-incorreto', 'Código incorreto'], ['#estado-expirado', 'expirou'], ['#estado-tentativas', 'Muitas tentativas']]) {
    await p.goto(srv.url + 'app/entrar/' + hash); await p.reload();
    await pedirCodigo('revisao@exemplo.com');
    const achou = await p.locator('#erro-cod').textContent().catch(() => '');
    new RegExp(texto).test(achou || '') ? ok('estado ' + hash) : ruim(`estado ${hash} sem «${texto}»`);
  }
  await p.close(); await c.close();
}

/* ===================== D · código de impressão (D-124) ===================== */
{
  const c = await contexto(null, 1);
  const p = await c.newPage();
  await p.goto(srv.url + 'app/entrar/');
  const { codigo, hash } = (await p.evaluate(() => PLCONTA.admin.gerarCodigos('avulso-basico', 1, 30)))[0];
  const { codigo: codigo2, hash: hash2 } = (await p.evaluate(() => PLCONTA.admin.gerarCodigos('avulso-basico', 1, 30)))[0];

  const digitar = cod => p.locator('#imp').fill(mascara(cod)); /* a máscara normaliza para PL-XXXX-XXXX */
  await p.locator('#b-via-codigo').click();
  await p.locator('#imp-email').fill('codigo@exemplo.com');

  /* DV errado não gasta tentativa */
  const trocado = await p.evaluate(cod => { for (const ch of '23456789ABCDEFGHJKLMNPQRSTUVWXYZ') { const t = cod.slice(0, 9) + ch; if (t !== cod && !PLCONTA.dvOk(t)) return t; } return null; }, codigo); /* um dígito que o dvOk recusa de fato (ele aceita duas leituras) */
  await digitar(trocado);
  await p.locator('#b-imp').click();
  (await p.locator('#erro-imp').isVisible()) && /dígito de conferência/.test(await p.locator('#erro-imp').textContent())
    ? ok('DV errado: «O dígito de conferência não bate»') : ruim('DV errado: mensagem esperada');
  (await p.evaluate(() => PLCONTA.tentativasCodigo().n)) === 0 ? ok('DV errado: não gasta tentativa') : ruim('DV errado gastou tentativa');

  /* 5 códigos válidos na forma, mas desconhecidos → bloqueio de 30 s */
  await p.evaluate(h => { const db = JSON.parse(localStorage.getItem('pl-codigos') || '{}'); delete db[h]; localStorage.setItem('pl-codigos', JSON.stringify(db)); }, hash2);
  for (let i = 0; i < 5; i++) { await digitar(codigo2); await p.locator('#b-imp').click(); await p.waitForTimeout(100); }
  (await p.locator('#erro-imp').isVisible()) && /Muitas tentativas/.test(await p.locator('#erro-imp').textContent())
    ? ok('5 códigos inválidos: bloqueio por 30 s') : ruim('bloqueio de tentativas ausente');
  (await p.locator('#b-imp').isDisabled()) ? ok('bloqueio desabilita o LED com contagem') : ruim('LED não bloqueado');

  /* vencido e revogado (pela API; a tela já mostrou os erros de forma) */
  await p.reload(); /* TENTA é em memória: recarregar libera as tentativas */
  const vencido = await p.evaluate(async cod => {
    const db = JSON.parse(localStorage.getItem('pl-codigos') || '{}');
    let h = null; for (const k in db) if (!db[k].revogado && !db[k].usadoEm) { h = k; break; }
    const antes = db[h].criadoEm; db[h].criadoEm = Date.now() - 400 * 86400000;
    localStorage.setItem('pl-codigos', JSON.stringify(db));
    let out; try { await PLCONTA.verificarCodigo(cod); out = 'aceito'; } catch (e) { out = e.tipo; }
    db[h].criadoEm = antes; localStorage.setItem('pl-codigos', JSON.stringify(db));
    return out;
  }, codigo);
  vencido === 'vencido' ? ok('código vencido é recusado') : ruim('vencido: ' + vencido);
  const revogado = await p.evaluate(async cod => {
    const db = JSON.parse(localStorage.getItem('pl-codigos') || '{}');
    let h = null; for (const k in db) if (!db[k].revogado && !db[k].usadoEm) { h = k; break; }
    PLCONTA.admin.revogarCodigo(h);
    let out; try { await PLCONTA.verificarCodigo(cod); out = 'aceito'; } catch (e) { out = e.tipo; }
    return out;
  }, codigo);
  revogado === 'revogado' ? ok('código revogado é recusado') : ruim('revogado: ' + revogado);

  /* código certo cria sessão de impressão */
  await p.evaluate(() => { const db = JSON.parse(localStorage.getItem('pl-codigos') || '{}'); for (const k in db) db[k].revogado = false; localStorage.setItem('pl-codigos', JSON.stringify(db)); });
  await p.goto(srv.url + 'app/entrar/');
  await p.locator('#b-via-codigo').click();
  await p.locator('#b-imp').click();
  (await p.locator('#erro-imp-email').isVisible()) ? ok('código sem e-mail: pede o e-mail') : ruim('código sem e-mail aceito');
  await p.locator('#imp-email').fill('codigo@exemplo.com');
  await digitar(codigo);
  await p.locator('#b-imp').click();
  await p.locator('#f-dados').waitFor({ timeout: 5000 });
  (await p.locator('#d-email').inputValue()) === 'codigo@exemplo.com' && (await p.locator('#d-email').getAttribute('readonly')) !== null
    ? ok('código conferido → «Seus dados» com o e-mail preenchido') : ruim('dados: e-mail não veio do código');
  await p.goto(srv.url + 'app/');
  /entrar/.test(p.url()) ? ok('sem «Seus dados» o app continua bloqueado') : ruim('entrou sem completar os dados');
  await p.locator('#f-dados').waitFor({ timeout: 5000 });
  await p.locator('#d-email').fill('codigo@exemplo.com');
  await p.locator('#b-dados').click();
  (await p.locator('#erro-d-nome').isVisible()) ? ok('dados: nome obrigatório') : ruim('dados sem nome aceitos');
  await p.locator('#d-nome').fill('Cliente Avulso'); await p.locator('#b-dados').click();
  (await p.locator('#erro-d-aceite').isVisible()) ? ok('dados: aceite obrigatório') : ruim('dados sem aceite');
  await p.locator('#d-aceite').check(); await p.locator('#b-dados').click();
  await p.waitForURL('**/app/inicio/', { timeout: 5000 });   /* veio de ?voltar=%2Fapp%2F: a raiz do app leva ao Início (D-118) */
  const sc = await p.evaluate(() => ({ sc: PLCONTA.sessaoCodigo(), pl: PLCONTA.plano() }));
  sc.sc && sc.sc.folhas === 8 && sc.pl.id === 'codigo' && sc.pl.fotosPorProjeto === 24
    ? ok('código certo: sessão de impressão (8 folhas, 24 fotos)') : ruim('sessão de código: ' + JSON.stringify(sc));

  /* código usado: consumo marca e o portão avisa */
  await p.evaluate(() => PLCONTA.consumir(1, 'padrao', 'k-teste'));
  const dir = await p.evaluate(() => PLCONTA.direito(1, 'padrao'));
  dir.ok === false && dir.codigoUsado ? ok('código usado: direito nega com codigoUsado') : ruim('código usado: ' + JSON.stringify(dir));
  await p.goto(srv.url + 'app/editor/exportar/');
  await p.locator('#go').click();
  await p.locator('.plportao:not([hidden])').waitFor({ timeout: 5000 });
  /Seu código já foi usado/.test(await p.locator('.plportao .led-dialog__title').textContent())
    ? ok('portão: «Seu código já foi usado» para código gasto') : ruim('portão código usado: título errado');
  await p.close(); await c.close();
}

/* ===================== E · admin muda o limite e a T-03 recusa (D-116, D-027) ===================== */
{
  /* sem init-script de sessão: o teste troca de conta in-page (entrarComo) e a guarda respeita */
  const c = await contexto(null);
  const p = await c.newPage();
  await p.goto(srv.url + 'app/entrar/');
  await p.evaluate(() => PLCONTA.entrarComo('admin'));
  await p.goto(srv.url + 'app/admin/');
  await p.locator('#g-fotos').waitFor({ timeout: 5000 });
  await p.locator('#g-fotos').fill('10');
  await p.waitForTimeout(300); /* debounce 80 ms */
  (await p.locator('#chip-pend').isVisible()) ? ok('editar acende «Alterações não salvas»') : ruim('chip de pendências não apareceu');
  await p.locator('#b-salvar').click();
  (await p.evaluate(() => PLCONTA.limites().planos.gratis.fotos)) === 10 ? ok('admin salva: Grátis passa a 10 fotos') : ruim('limite não salvou');
  (await p.locator('#toast-desfazer').isVisible()) ? ok('salvar oferece Desfazer') : ruim('Desfazer ausente');

  /* a T-03 recusa a 11ª foto */
  await p.evaluate(() => { PLCONTA.sair(); PLCONTA.entrarComo('gratis'); });
  await p.goto(srv.url + 'app/adicionar-fotos/');
  await p.locator('#f-device').setInputFiles(fotos);
  await p.locator('.msg--warn').waitFor({ timeout: 5000 });
  const aviso = await p.locator('#got').textContent();
  /10 fotos escolhidas/.test(aviso) && /1 foto a mais/.test(aviso) && /leva até 10 fotos/.test(aviso)
    ? ok('T-03: 11 fotos → 10 escolhidas + aviso do plano') : ruim('T-03: ' + aviso);

  /* restaurar padrões volta ao DOC-03 */
  await p.evaluate(() => { PLCONTA.sair(); PLCONTA.entrarComo('admin'); });
  await p.goto(srv.url + 'app/admin/');
  await p.locator('#b-restaurar').click();
  await p.locator('#dlg-act').getByRole('button', { name: 'Restaurar padrões' }).click();
  await p.waitForTimeout(300);
  (await p.evaluate(() => PLCONTA.limites().planos.gratis.fotos)) === 24 ? ok('restaurar padrões volta a 24 fotos') : ruim('restaurar não voltou ao padrão');
  await p.close(); await c.close();
}

/* ===================== F · portão de exportação (DOC-03 §4, T-26) ===================== */
{
  /* Grátis: 1ª geração usa a folha grátis; 2ª vê o portão */
  const c = await contexto('gratis@polarlife.test', 1);
  const p = await c.newPage();
  await p.goto(srv.url + 'app/editor/exportar/');
  /folha grátis/.test(await p.locator('#info-conta').textContent())
    ? ok('T-19: linha da folha grátis do mês') : ruim('linha da conta errada');
  await p.locator('#go').click();
  await p.waitForURL('**/app/editor/gerar/', { timeout: 5000 });
  await p.locator('text=Seu arquivo está pronto').waitFor({ timeout: 90000 });
  (await p.evaluate(() => PLCONTA.plano().usadasMes)) === 1 ? ok('geração concluída consome a folha grátis (BR-10)') : ruim('folha grátis não foi consumida');
  await p.goto(srv.url + 'app/editor/exportar/');
  /precisa de 1 folha/.test(await p.locator('#info-conta').textContent())
    ? ok('2ª exportação: linha avisa que precisa de folha') : ruim('linha da 2ª exportação');

  /* pop-up «Sua folha grátis foi usada» */
  await p.locator('#go').click();
  await p.locator('.plportao:not([hidden])').waitFor({ timeout: 5000 });
  let t = await p.locator('.plportao .led-dialog__title').textContent();
  /Sua folha grátis foi usada/.test(t) ? ok('portão: «Sua folha grátis foi usada»') : ruim('portão grátis: ' + t);

  /* Pix pendente não libera */
  await p.locator('.plportao').getByRole('button', { name: /Comprar 1 folhas?/ }).click();
  await p.locator('.plportao').getByRole('button', { name: 'Simular Pix pendente' }).click();
  await p.locator('.plportao').getByRole('button', { name: /Pagar R\$ 2,90/ }).click();
  /Aguardando pagamento/.test(await p.locator('.plportao .led-dialog__title').textContent())
    ? ok('Pix pendente: «Aguardando pagamento»') : ruim('pendente: título errado');
  await p.locator('.plportao').getByRole('button', { name: 'Voltar ao projeto' }).click();
  await p.waitForTimeout(200);
  (await p.evaluate(() => PLCONTA.direito(1, 'padrao').ok)) === false ? ok('Pix pendente: folha não liberada') : ruim('pendente liberou folha');

  /* pagamento aprovado libera e segue para gerar */
  await p.locator('#go').click();
  await p.locator('.plportao:not([hidden])').waitFor({ timeout: 5000 });
  await p.locator('.plportao').getByRole('button', { name: /Comprar 1 folhas?/ }).click();
  await p.locator('.plportao').getByRole('button', { name: 'Simular pagamento aprovado' }).click();
  await p.locator('.plportao').getByRole('button', { name: /Pagar R\$ 2,90/ }).click();
  /Pagamento confirmado/.test(await p.locator('.plportao .led-dialog__title').textContent())
    ? ok('pagamento aprovado: confirmado na tela') : ruim('aprovado: título errado');
  (await p.evaluate(() => PLCONTA.plano().folhasCompradas.padrao)) === 1 ? ok('compra aprovada credita a folha') : ruim('folha não creditada');
  await p.locator('.plportao').getByRole('button', { name: 'Continuar' }).click();
  await p.waitForURL('**/app/editor/gerar/', { timeout: 10000 });
  ok('aprovado: segue para gerar');
  await p.close(); await c.close();

  /* Avulsa sem folhas: «Faltam N folhas» */
  const ca = await contexto('folha@polarlife.test', 4);
  const pa = await ca.newPage();
  await pa.goto(srv.url + 'app/editor/exportar/');
  await pa.locator('#go').click();
  await pa.locator('.plportao:not([hidden])').waitFor({ timeout: 5000 });
  /Faltam 1 folhas?/.test(await pa.locator('.plportao .led-dialog__title').textContent())
    ? ok('portão Avulsa: «Faltam 1 folhas»') : ruim('portão Avulsa errado');
  await pa.close(); await ca.close();

  /* Pro não é barrado */
  const cp = await contexto('pro@polarlife.test', 1);
  const pp = await cp.newPage();
  await pp.goto(srv.url + 'app/editor/exportar/');
  /uso razoável/.test(await pp.locator('#info-conta').textContent()) ? ok('Pro: linha do uso razoável') : ruim('linha Pro errada');
  await pp.locator('#go').click();
  await pp.waitForURL('**/app/editor/gerar/', { timeout: 5000 });
  (await pp.locator('.plportao').count()) === 0 ? ok('Pro: gera sem portão') : ruim('Pro foi barrado');
  await pp.close(); await cp.close();
}

/* ===================== G · planos (T-26) ===================== */
{
  const c = await contexto('gratis@polarlife.test');
  const p = await c.newPage();
  await p.goto(srv.url + 'app/conta/planos/');
  const cards = await p.locator('.pln').count();
  cards === 3 ? ok('planos: 3 cartões') : ruim('planos: ' + cards + ' cartões');
  /Seu plano/.test(await p.locator('#cartoes').textContent()) ? ok('planos: chip «Seu plano»') : ruim('chip «Seu plano» ausente');

  /* compra avulsa simulada */
  await p.locator('.pln input[value=avulsa]').check();
  await p.locator('#qtd').fill('5');
  await p.waitForTimeout(150);
  /5 folhas padrão · R\$ 14,50/.test(await p.locator('#tot').textContent())
    ? ok('planos: total 5 × R$ 2,90') : ruim('total errado');
  await p.locator('#b-continuar').click();
  await p.locator('.plportao:not([hidden])').waitFor({ timeout: 5000 });
  await p.locator('.plportao').getByRole('button', { name: 'Simular pagamento aprovado' }).click();
  await p.locator('.plportao').getByRole('button', { name: /Pagar R\$ 14,50/ }).click();
  await p.locator('.plportao').getByRole('button', { name: 'Continuar' }).click();
  await p.waitForTimeout(300);
  (await p.evaluate(() => PLCONTA.plano().folhasCompradas.padrao)) === 5 ? ok('planos: compra credita 5 folhas') : ruim('compra no planos não creditou');

  /* assinar o Pro pela página de planos */
  await p.locator('.pln input[value=pro]').check();
  await p.locator('#b-continuar').click();
  await p.locator('.plportao:not([hidden])').waitFor({ timeout: 5000 });
  await p.locator('.plportao').getByRole('button', { name: 'Simular pagamento aprovado' }).click();
  await p.locator('.plportao').getByRole('button', { name: /Pagar R\$ 14,90/ }).click();
  await p.locator('.plportao').getByRole('button', { name: 'Continuar' }).click();
  await p.waitForTimeout(300);
  (await p.evaluate(() => PLCONTA.plano().id)) === 'pro' ? ok('planos: assinatura Pro simulada ativa o Pro') : ruim('assinatura não ativou');
  await p.close(); await c.close();

  /* sessão de código na página de planos */
  const c2 = await contexto(null);
  const p2 = await c2.newPage();
  await p2.goto(srv.url + 'app/entrar/');
  const { codigo } = (await p2.evaluate(() => PLCONTA.admin.gerarCodigos('avulso-basico', 1, 30)))[0];
  await p2.locator('#b-via-codigo').click();
  await p2.locator('#imp-email').fill('cliente2@exemplo.com');
  await p2.locator('#imp').fill(mascara(codigo));
  await p2.locator('#b-imp').click();
  await p2.locator('#d-nome').fill('Cliente Dois'); await p2.locator('#d-aceite').check(); await p2.locator('#b-dados').click();
  await p2.waitForURL('**/app/inicio/', { timeout: 5000 });
  await p2.goto(srv.url + 'app/conta/planos/');
  await p2.locator('#b-continuar').click(); /* avulsa já vem marcada para sessão de código */
  await p2.locator('#dialog:not([hidden])').waitFor({ timeout: 5000 });
  /Entrar para comprar/.test(await p2.locator('#dlg-t').textContent())
    ? ok('sessão de código em planos: «Entrar para comprar»') : ruim('planos com código: pop-up errado');
  await p2.close(); await c2.close();
}

/* ===================== H · conta (T-27) e exportar dados ===================== */
{
  const c = await contexto('gratis@polarlife.test');
  const p = await c.newPage();
  await p.goto(srv.url + 'app/conta/');
  const corpo = await p.locator('#corpo').textContent();
  /Grátis/.test(corpo) && /folha grátis/.test(corpo) ? ok('conta: cartão do plano Grátis') : ruim('conta Grátis: ' + corpo.slice(0, 80));
  await p.locator('#b-planos').click();
  await p.waitForURL('**/app/conta/planos/', { timeout: 5000 });
  ok('conta: «Ver folhas e planos» navega para os planos');
  await p.goBack();
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('#b-exportar').click()]);
  const nome = dl.suggestedFilename();
  await dl.saveAs(join(saida, nome));
  const dados = JSON.parse(await readFile(join(saida, nome), 'utf8'));
  /^polarlife-conta-\d{8}\.json$/.test(nome) && dados.produto === 'PolarLife' && dados.conta.email === 'gratis@polarlife.test'
    ? ok('conta: exportar dados baixa JSON com a conta') : ruim('exportar dados: ' + nome);
  await p.close(); await c.close();

  /* Pro: interruptor de assinatura e cancelamento */
  const c2 = await contexto('pro@polarlife.test');
  const p2 = await c2.newPage();
  await p2.goto(srv.url + 'app/conta/');
  const corpo2 = await p2.locator('#corpo').textContent();
  /uso razoável/.test(corpo2) && /Desligar a assinatura PolarLife/.test(corpo2)
    ? ok('conta Pro: uso razoável + interruptor da assinatura') : ruim('conta Pro: ' + corpo2.slice(0, 80));
  await p2.locator('#b-cancelar').click();
  await p2.locator('#dialog:not([hidden])').waitFor({ timeout: 5000 });
  await p2.locator('#dlg-act').getByRole('button', { name: 'Cancelar assinatura' }).click();
  await p2.waitForTimeout(300);
  const cancelado = await p2.evaluate(() => PLCONTA.plano());
  cancelado.canceladoEm && cancelado.id === 'pro' ? ok('conta Pro: cancelar mantém o Pro até o fim do período') : ruim('cancelamento: ' + JSON.stringify(cancelado));
  await p2.close(); await c2.close();
}

/* ===================== I · painel do admin (T-33) ===================== */
{
  const c = await contexto('admin@polarlife.test');
  const p = await c.newPage();
  await c.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(srv.url).origin });
  await p.goto(srv.url + 'app/admin/');
  await p.locator('#b-salvar').waitFor({ timeout: 5000 });
  (await p.locator('.tbl').first().locator('tbody tr').count()) === 4 ? ok('admin: tabela das 4 contas de teste') : ruim('admin: contas ausentes');

  /* gerar códigos pelo painel */
  await p.locator('#cod-qtd').fill('2');
  await p.locator('#cod-gerar').click();
  await p.locator('.adm-cod__lista li').first().waitFor({ timeout: 5000 });
  const n = await p.locator('.adm-cod__lista li').count();
  n === 2 ? ok('admin: gera 2 códigos (lista mostrada uma vez)') : ruim('admin: ' + n + ' códigos');
  /^PL[A-HJ-NP-Z2-9]{8}$/.test((await p.locator('.adm-cod__lista li').first().textContent()))
    ? ok('admin: código no formato PL-XXXX-XXXX') : ruim('formato do código gerado');
  await p.locator('#cod-cop').click();
  await p.waitForTimeout(300);
  (await p.evaluate(() => navigator.clipboard.readText())).split('\n').length === 2
    ? ok('admin: «Copiar todos» copia a lista') : ruim('copiar falhou');
  (await p.evaluate(() => PLCONTA.admin.listarCodigos().filter(x => !x.revogado).length)) >= 2
    ? ok('admin: tabela de códigos com hashes') : ruim('listarCodigos vazio');
  await p.close(); await c.close();

  /* não-admin */
  const c2 = await contexto('gratis@polarlife.test');
  const p2 = await c2.newPage();
  await p2.goto(srv.url + 'app/admin/');
  (await p2.locator('text=Só a conta Admin abre este painel.').isVisible())
    ? ok('não-admin: «Só a conta Admin abre este painel.»') : ruim('não-admin entrou no painel');
  await p2.locator('#b-como-admin').click();
  await p2.locator('#b-salvar').waitFor({ timeout: 5000 });
  ok('não-admin: «Entrar como Admin» abre o painel');
  await p2.close(); await c2.close();
}

/* ===================== I2 · e-mail e senha das contas de teste (D-196) ===================== */
{
  const c = await contexto(null), p = await c.newPage();
  await p.goto(srv.url + 'app/entrar/'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await p.reload(); await p.waitForFunction(() => !!window.PLCONTA);
  (await p.evaluate(() => PLCONTA.entrarComSenha('admin@polarlife.test', 'senha-errada-123').then(() => 'entrou', (e) => e.tipo))) === 'incorreto'
    ? ok('senha errada numa conta de teste: recusada, sem dizer se o e-mail existe') : ruim('senha errada entrou numa conta de teste');
  /* o texto das senhas fica com o dono, fora do git: confere as 4 quando o arquivo existe (PL_CONTAS ou .local/contas-de-teste.txt) */
  let txt = null;
  try { txt = await readFile(process.env.PL_CONTAS || fileURLToPath(new URL('../../.local/contas-de-teste.txt', import.meta.url)), 'utf8'); } catch {}
  const pares = txt ? [...txt.matchAll(/^\S.*?(\S+@polarlife\.test)\s+(\S{8,})\s*$/gm)].map((m) => [m[1], m[2]]) : [];
  if (pares.length === 4) {
    const perfis = await p.evaluate(async (L) => { const r = []; for (const [e, sn] of L) { try { const x = await PLCONTA.entrarComSenha(e, sn); r.push(x.perfil + ':' + PLCONTA.sessao().email); } catch (er) { r.push('falhou:' + e); } PLCONTA.sair(); } return r.join(); }, pares);
    perfis === 'admin:admin@polarlife.test,gratis:gratis@polarlife.test,avulsa:folha@polarlife.test,pro:pro@polarlife.test'
      ? ok('as 4 contas de teste entram com e-mail e senha, cada uma no seu plano') : ruim('senhas das contas de teste: ' + perfis);
    const [ea, sa] = pares[0];
    await p.goto(srv.url + 'app/entrar/'); await p.fill('#email', ea); await p.fill('#senha', sa); await p.click('#b-enviar');
    await p.waitForURL('**/app/inicio/**', { timeout: 15000 }).then(() => ok('pela tela: a conta Admin entra com e-mail e senha e cai no Início'), () => ruim('pela tela: a conta Admin não entrou com e-mail e senha'));
  } else console.log('  – senhas das contas de teste fora deste computador: conferência das 4 senhas pulada');
  /* a senha criada neste aparelho («Esqueci a senha») vale no lugar da fixa */
  const r3 = await p.evaluate(async () => { PLCONTA.entrarComo('pro'); await PLCONTA.definirSenha('outra-senha-123'); PLCONTA.sair(); const x = await PLCONTA.entrarComSenha('pro@polarlife.test', 'outra-senha-123'); return x.perfil; });
  r3 === 'pro' ? ok('senha nova criada no aparelho vale no lugar da fixa') : ruim('senha nova no aparelho: ' + r3);
  await c.close();
}

/* ===================== J · movimento reduzido (checklist §8.9) ===================== */
{
  const c = await nav.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  await maisAbertos(c);   /* D-172: ajustes avançados à vista */
  const p = await c.newPage();
  await p.goto(srv.url + 'app/entrar/');
  const quieto = await p.evaluate(() => {
    const pol = document.querySelector('.mesa .mesa-p');
    const anim = pol ? getComputedStyle(pol).animationName : '?';
    return { anim, n: document.querySelectorAll('.is-in, .is-dev, .is-out').length, opacity: pol ? getComputedStyle(pol).opacity : '?' };
  });
  quieto.anim === 'none' && quieto.opacity === '1' && quieto.n === 0
    ? ok('reduced-motion: polaroids já pousadas, nenhuma classe .is-*') : ruim('reduced-motion: ' + JSON.stringify(quieto));
  await p.close(); await c.close();
}

/* ===================== K · capturas para revisão ===================== */
{
  const shot = async (email, pgs) => {
    const c = await contexto(email);
    const p = await c.newPage();
    for (const pg of pgs) {
      const nome = pg.replace(/\/$/, '');
      for (const [w, h] of [[1440, 900], [390, 844]]) {
        await p.setViewportSize({ width: w, height: h });
        await p.goto(srv.url + 'app/' + pg, { waitUntil: 'networkidle' });
        await p.evaluate(() => document.fonts.ready);
        await p.screenshot({ path: join(saida, `${w}-${nome}.png`), fullPage: true });
      }
    }
    await p.close(); await c.close();
  };
  await shot(null, ['entrar/']);
  await shot('pro@polarlife.test', ['conta/', 'conta/planos/']);
  await shot('admin@polarlife.test', ['admin/']);
  ok('capturas em tests/saida/contas/ (1440 e 390)');
}

await nav.close(); srv.fechar();
console.log(falhas.length ? `\n✘ contas: ${falhas.length} falha(s)` : '\n✔ contas: sem falhas');
process.exit(falhas.length ? 1 : 0);
