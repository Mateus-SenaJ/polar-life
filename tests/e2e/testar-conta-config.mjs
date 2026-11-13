#!/usr/bin/env node
// Conta como página de configurações (T-27): Perfil, Plano e uso, Códigos de impressão, Pagamentos, Segurança, Preferências e
// Privacidade, com as contas Grátis, Folha avulsa e Pro e com a sessão por código de impressão, em 1440 × 900 e 390 × 844.
// Confere também as Travas na tela: paleta (T2), peso ≤ 500 (T1), alvos ≥ 44 px (T3), um LED por tela (T8), sem rolagem lateral,
// «demonstração» dito onde é demonstração (T7) e nenhum campo de cartão. Capturas em tests/saida/conta/.
// Uso: npm run testar:conta-config  (Chromium do Playwright)
import { chromium } from 'playwright';
import { mkdir, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; return v; };
const srv = await servir(), nav = await chromium.launch();
const saida = fileURLToPath(new URL('../saida/conta/', import.meta.url));
await rm(saida, { recursive: true, force: true }); await mkdir(saida, { recursive: true });
const erros = [];
const TODAS = ['perfil', 'plano', 'codigos', 'pagamentos', 'seguranca', 'preferencias', 'privacidade'];
const DO_CODIGO = ['perfil', 'plano', 'codigos', 'preferencias', 'privacidade'];
const mascara = cod => cod.slice(0, 2) + '-' + cod.slice(2, 6) + '-' + cod.slice(6); /* PL-XXXX-XXXX */

async function novo(w, h) {
  const c = await nav.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', acceptDownloads: true });
  await c.addInitScript(() => { try { localStorage.setItem('pl-ver-contas-teste', '1'); } catch (e) {} });   /* D-194 */
  const p = await c.newPage();
  p.on('pageerror', e => erros.push(e.message));
  return { c, p };
}
async function entrar(p, perfil) {
  await p.goto(srv.url + 'app/entrar/'); await p.waitForFunction(() => !!window.PLCONTA);
  await p.evaluate(x => PLCONTA.entrarComo(x), perfil);
}
async function conta(p, hash = '') {
  await p.goto(srv.url + 'app/conta/' + hash, { waitUntil: 'networkidle' });
  await p.reload({ waitUntil: 'networkidle' });   /* o mesmo endereço com a mesma âncora não recarrega sozinho */
  await p.waitForSelector('.cfg'); await p.evaluate(() => document.fonts.ready);
}
const noDesktop = p => p.evaluate(() => matchMedia('(min-width:900px)').matches);
async function abrir(p, id) {
  if (await noDesktop(p)) await p.locator(`.cfg__l[data-ir="${id}"]`).click();
  else if (!(await p.locator(`#sec-${id}`).evaluate(e => e.classList.contains('is-on')))) await p.locator(`.sec__cab[data-abre="${id}"]`).click();
  await p.locator(`#sec-${id}.is-on #c-${id}`).waitFor({ state: 'visible', timeout: 5000 });
}
const texto = (p, id) => p.locator(`#c-${id}`).innerText().then((t) => t.replace(/\s+/g, " "));   /* rótulo e valor em linhas separadas (dl): compara com espaços */
const leds = p => p.evaluate(() => [...document.querySelectorAll('.led-btn')].filter(el => {
  const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
}).length);
async function foto(p, nome) {   /* página inteira, com a barra fixa no lugar dela */
  await p.evaluate(() => { document.getElementById('toast').hidden = true; window.scrollTo(0, 0); });
  const vp = p.viewportSize(), alt = await p.evaluate(() => document.documentElement.scrollHeight);
  if (alt > vp.height) await p.setViewportSize({ width: vp.width, height: alt });
  await p.screenshot({ path: join(saida, nome + '.png') });
  if (alt > vp.height) await p.setViewportSize(vp);
}
/* Travas na tela, na seção aberta */
async function travas(p, rotulo) {
  const r = await p.evaluate(() => {
    const out = [], W = innerWidth;
    const vis = el => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !el.closest('[hidden],[aria-hidden="true"]:not(svg)'); };
    const nome = el => (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className.baseVal ?? el.className).split(/\s+/)[0]) + ' «' + (el.textContent || '').trim().slice(0, 24) + '»';
    if (document.documentElement.scrollWidth > W + 1) out.push('rolagem lateral de ' + (document.documentElement.scrollWidth - W) + ' px');
    const ids = {}; for (const el of document.querySelectorAll('[id]')) ids[el.id] = (ids[el.id] || 0) + 1;
    for (const k in ids) if (ids[k] > 1) out.push('id repetido: ' + k);
    for (const el of document.querySelectorAll('#corpo a[href], #corpo button, #corpo input:not([type=radio]), #corpo .opc__o span')) {
      if (!vis(el) || getComputedStyle(el).pointerEvents === 'none') continue;
      const b = el.getBoundingClientRect();
      if (b.width < 43.5 || b.height < 43.5) out.push('alvo < 44 px: ' + Math.round(b.width) + '×' + Math.round(b.height) + ' ' + nome(el));
      if (b.left < -1 || b.right > W + 1) out.push('fora da tela: ' + nome(el));
    }
    const PALETA = ['0, 0, 0', '255, 255, 255', '0, 97, 148', '253, 118, 26', '248, 249, 250'];
    const cor = v => { const m = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(v); return !m || +m[4] === 0 || PALETA.includes(m[1] + ', ' + m[2] + ', ' + m[3]); };
    for (const el of document.querySelectorAll('#corpo *')) {
      if (!vis(el)) continue; const s = getComputedStyle(el), b = el.getBoundingClientRect();
      if (+s.fontWeight > 500) out.push('peso ' + s.fontWeight + ': ' + nome(el));
      for (const k of ['color', 'backgroundColor', 'borderTopColor', 'borderLeftColor']) if (!cor(s[k])) out.push('cor fora da paleta (' + k + ' ' + s[k] + '): ' + nome(el));
      if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2)) {
        if (parseFloat(s.fontSize) < 12 && !el.closest('.mono')) out.push('letra de ' + s.fontSize + ': ' + nome(el));
        if (b.right > W + 1 || b.left < -1) out.push('texto fora da tela: ' + nome(el));
        if (!el.closest('.so-leitor') && /(hidden|clip)/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 2) out.push('texto cortado: ' + nome(el));
      }
    }
    return out;
  });
  const n = await leds(p);
  if (n > 1) r.push(n + ' LEDs visíveis (T8)');
  ok(r.length === 0, rotulo + ': Travas na tela (paleta, peso, alvos, sem rolagem lateral, até um LED)' + (r.length ? ' → ' + [...new Set(r)].slice(0, 6).join(' | ') : ''));
}
/* abre cada seção, confere as Travas e fotografa */
async function percorrer(p, w, quem, ids, extra = {}) {
  for (const id of ids) {
    await abrir(p, id);
    if (extra[id]) await extra[id]();
    await travas(p, `${w} ${quem} · ${id}`);
    await foto(p, `${w}-${quem}-${id}`);
  }
}

try {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const desk = w >= 900;

    /* ===================== Grátis: todas as seções ===================== */
    console.log(`\n${w} × ${h} · conta Grátis`);
    {
      const { c, p } = await novo(w, h);
      await entrar(p, 'gratis'); await conta(p);
      const ids = await p.evaluate(() => [...document.querySelectorAll('.sec')].map(s => s.dataset.sec));
      ok(ids.join() === TODAS.join(), 'sete seções, nesta ordem: ' + ids.join(', '));
      if (desk) {
        const lay = await p.evaluate(() => ({ nav: document.querySelector('.cfg__nav').offsetWidth > 0, links: document.querySelectorAll('.cfg__l').length,
          abertas: [...document.querySelectorAll('.sec')].filter(s => s.offsetHeight > 0).map(s => s.dataset.sec), atual: document.querySelector('.cfg__l[aria-current]')?.dataset.ir,
          lado: document.querySelector('.cfg__lado').getBoundingClientRect().right <= document.querySelector('.cfg__secs').getBoundingClientRect().left }));
        ok(lay.nav && lay.links === 7 && lay.lado, 'desktop: navegação lateral com as sete seções, ao lado do painel');
        ok(lay.abertas.join() === 'perfil' && lay.atual === 'perfil', 'desktop: um painel por vez, começando por Perfil e cadastro (marcado na navegação)');
      } else {
        const lay = await p.evaluate(() => ({ nav: document.querySelector('.cfg__nav').offsetWidth > 0, abertas: document.querySelectorAll('.sec.is-on').length,
          cab: [...document.querySelectorAll('.sec__cab')].map(b => b.getAttribute('aria-expanded') + ':' + (b.offsetHeight >= 44)).join(), res: [...document.querySelectorAll('.sec__res')].every(e => e.textContent.trim().length > 3) }));
        ok(!lay.nav && lay.abertas === 0 && lay.cab === Array(7).fill('false:true').join() && lay.res, 'celular: lista de sete seções fechadas, cada uma com resumo, sem navegação lateral');
        await travas(p, `${w} gratis · lista`); await foto(p, `${w}-gratis-lista`);
        await abrir(p, 'plano');
        ok(await p.locator('.sec__cab[data-abre=plano]').getAttribute('aria-expanded') === 'true' && await p.locator('.sec.is-on').count() === 1, 'celular: tocar abre a seção (só uma aberta)');
        await p.locator('.sec__cab[data-abre=plano]').click();
        ok(await p.locator('.sec.is-on').count() === 0 && !(await p.locator('#c-plano').isVisible()), 'celular: tocar de novo fecha');
      }
      await conta(p, '#pagamentos');
      ok(await p.locator('#c-pagamentos').isVisible() && await p.locator('.sec.is-on').count() === 1, 'endereço com #pagamentos abre direto a seção');

      /* 1 · Perfil e cadastro */
      await abrir(p, 'perfil');
      let t = await texto(p, 'perfil');
      ok(/gratis@polarlife\.test/.test(t) && /Ainda não confirmado/.test(t) && /Forma de entrada/.test(t) && /Entrou neste navegador em \d+ de /.test(t), 'perfil: nome, e-mail com estado de confirmação, forma de entrada e data');
      ok(/Demonstração/.test(t), 'perfil: diz que é demonstração (T7)');
      await p.locator('#b-nome').click(); await p.locator('#in-nome').fill('A'); await p.locator('#b-nome-salvar').click();
      ok(await p.locator('#m-nome[role=alert]').isVisible(), 'perfil: nome curto demais dá erro com ícone e texto');
      await p.locator('#in-nome').fill('Maria Teste'); await p.locator('#b-nome-salvar').click();
      ok(await p.locator('#v-nome').innerText() === 'Maria Teste' && await p.locator('#quem-nome').innerText() === 'Maria Teste' && await p.evaluate(() => PLCONTA.perfil().nome) === 'Maria Teste', 'perfil: editar o nome grava e aparece no cartão da conta');

      /* 2 · Plano e uso */
      await abrir(p, 'plano');
      t = await texto(p, 'plano');
      ok(/Grátis · R\$ 0,00/.test(t) && /1 folha grátis por mês/.test(t) && /Até 24 fotos por projeto/.test(t) && /renova em 1º de /.test(t), 'plano Grátis: o que inclui e quando a folha grátis renova');
      ok(/1 de 1/.test(t) && /Agora dá para gerar até 1 folha padrão ou 1 folha grande\./.test(t), 'plano Grátis: folha grátis do mês e limite disponível agora');
      ok(await leds(p) === 1 && /planos\/$/.test(await p.locator('#b-planos').getAttribute('href')), 'plano Grátis: um LED («Ver folhas e planos»)');
      const du = await p.evaluate(() => PLCONTA.direitoDeUso());
      ok(Object.keys(du).join() === 'plano,creditosPadrao,creditosGrande,folhasGratisNoMes,folhasGratisUsadasNoMes,usoNoMes,usoRazoavel,fotosPorProjeto,assinaturaPodeDesligar,assinaturaDesligada,expiraEm,renovaEm' && du.plano === 'gratis' && du.folhasGratisNoMes === 1,
        'direitoDeUso(): mesmo JSON de direito_de_uso do banco');

      /* 3 · Códigos de impressão */
      await abrir(p, 'codigos');
      ok(await p.locator('#cod-vazio').isVisible(), 'códigos: estado vazio');
      await p.locator('#in-codigo').fill('ABC'); await p.locator('#b-resgatar').click();
      await p.locator('#m-codigo[role=alert]').waitFor({ timeout: 5000 });
      ok(/formato/.test(await p.locator('#m-codigo').innerText()), 'códigos: formato errado dá erro');
      const cods = await p.evaluate(() => PLCONTA.admin.gerarCodigos('avulso-basico', 2, 30));
      for (const k of cods) { await p.locator('#in-codigo').fill(mascara(k.codigo)); await p.locator('#b-resgatar').click(); await p.locator('#m-codigo[role=status]').waitFor({ timeout: 5000 }); await p.waitForTimeout(100); }
      t = await texto(p, 'codigos');
      ok(await p.locator('#cod-livres .cod').count() === 2 && /Restam 8 de 8 folhas padrão/.test(t) && /16 folhas de código disponíveis/.test(t) && t.toLowerCase().includes('final ' + cods[0].codigo.slice(-4).toLowerCase()),
        'códigos: dois códigos resgatados, com os 4 últimos caracteres e as folhas que restam');
      ok(await p.evaluate(() => PLCONTA.direito(17, 'padrao').ok && !PLCONTA.direito(18, 'padrao').ok), 'códigos: as 16 folhas entram no saldo (1 grátis + 16)');
      await p.locator('#in-codigo').fill(mascara(cods[0].codigo)); await p.locator('#b-resgatar').click();
      await p.locator('#m-codigo[role=alert]').waitFor({ timeout: 5000 });
      ok(/já foi usado/.test(await p.locator('#m-codigo').innerText()) && await p.evaluate(() => PLCONTA.plano().folhasCompradas.padrao) === 16, 'códigos: o mesmo código não vale duas vezes');
      ok(await p.evaluate(h2 => PLCONTA.admin.listarCodigos().find(x => x.hash === h2).situacao, cods[0].hash) === 'usado', 'códigos: o código resgatado fica como usado no painel do admin');
      /* consumo: grátis do mês primeiro; compradas antes das de código; código mais antigo primeiro */
      const r1 = await p.evaluate(() => { PLCONTA.consumir(3, 'padrao', 't1'); return PLCONTA.codigos().map(k => k.restam).join(); });
      const r2 = await p.evaluate(async () => { await PLCONTA.comprar(5, 'padrao', 'aprovado'); PLCONTA.consumir(5, 'padrao', 't2'); return PLCONTA.codigos().map(k => k.restam).join(); });
      const r3 = await p.evaluate(() => { PLCONTA.consumir(6, 'padrao', 't3'); return PLCONTA.codigos().map(k => k.restam + ':' + k.situacao).join(); });
      ok(r1 === '6,8' && r2 === '6,8' && r3 === '0:usado,8:disponivel', `códigos: saldo por código acompanha o uso (${r1} → ${r2} → ${r3})`);
      await conta(p, '#codigos');
      t = await texto(p, 'codigos');
      ok(await p.locator('#cod-livres .cod').count() === 1 && await p.locator('#cod-usados .cod').count() === 1 && /Ainda podem ser usados \(1\)/.test(t) && /Já usados \(1\)/.test(t) && /Restam 0 de 8/.test(t),
        'códigos: separa os que ainda podem ser usados dos já usados');
      ok(/demonstração/.test(t), 'códigos: diz que a conferência é de demonstração (T7)');

      /* 4 · Pagamentos */
      await abrir(p, 'pagamentos');
      ok((await p.locator('#pg-vazio').innerText()).trim() === 'Nenhuma forma de pagamento cadastrada. As compras desta versão são de demonstração e não cobram nada.', 'pagamentos: estado vazio honesto das formas de pagamento');
      ok(await p.locator('#sec-pagamentos input, #sec-pagamentos select, #sec-pagamentos textarea').count() === 0 && await p.locator('[autocomplete^=cc-], [name*=cartao], [name*=card]').count() === 0, 'pagamentos: nenhum campo de cartão');
      t = await texto(p, 'pagamentos');
      ok(await p.locator('#sec-pagamentos .rec').count() === 1 && /5 folhas padrão · R\$ 14,50/.test(t) && /Demonstração: nada foi cobrado/.test(t), 'pagamentos: histórico com a compra, marcada como demonstração');
      await p.locator('#sec-pagamentos .btn3').first().click();
      ok(await p.locator('#rec-dialog').isVisible() && /Recibo de demonstração: nenhuma cobrança foi feita/.test(await p.locator('#rec-corpo').innerText()), 'pagamentos: «Ver recibo» abre o recibo de demonstração');
      await foto(p, `${w}-gratis-recibo`);
      await p.locator('#rec-fechar').click();

      /* 5 · Segurança */
      await abrir(p, 'seguranca');
      t = await texto(p, 'seguranca');
      ok(/Senha definida/.test(t) && await p.locator('#aparelhos .apr').count() === 1 && /Este aparelho/.test(t) && /Demonstração/.test(t), 'segurança: senha definida e este aparelho na lista, dito que é demonstração');
      await p.locator('#b-senha').click();
      await p.locator('#in-senha-atual').fill('errada-123'); await p.locator('#in-senha-nova').fill('nova-senha-1'); await p.locator('#in-senha-rep').fill('outra-senha-1'); await p.locator('#b-senha-salvar').click();
      ok(/não são iguais/.test(await p.locator('#m-senha[role=alert]').innerText()), 'segurança: senhas novas diferentes dão erro');
      await p.locator('#in-senha-atual').fill('errada-123'); await p.locator('#in-senha-nova').fill('nova-senha-1'); await p.locator('#in-senha-rep').fill('nova-senha-1'); await p.locator('#b-senha-salvar').click();
      const confere = await p.waitForFunction(() => /senha atual não confere/.test(document.getElementById('m-senha').textContent), null, { timeout: 15000 }).then(() => true, () => false);   /* a conferência é assíncrona (hash): espera a mensagem nova */
      ok(confere, 'segurança: trocar a senha exige a senha atual certa');

      /* 6 · Preferências */
      await abrir(p, 'preferencias');
      ok(await p.locator('input[name=pref-un][value=mm]').isChecked(), 'preferências: unidade padrão em milímetros');
      await p.locator('.opc__o:has(input[value=cm])').click();   /* o rádio cobre o rótulo: clica no conjunto */
      ok(await p.evaluate(() => PLCONTA.preferencias().unidade === 'cm' && sessionStorage.getItem('pl-unidade') === 'cm'), 'preferências: unidade de medida guardada na conta e usada pelo editor');
      await p.locator('#pref-novidades').click();
      ok(await p.evaluate(() => PLCONTA.preferencias().emails.novidades === true) && await p.locator('#pref-novidades').getAttribute('aria-checked') === 'true' && /não envia e-mails/.test(await texto(p, 'preferencias')),
        'preferências: e-mails é só a escolha guardada, e a tela diz que nada é enviado');
      t = await p.locator('#app-bloco').innerText();
      ok(/Instalar é opcional/.test(t) && /Para desfazer/.test(t) && await p.locator('#app-sem').isVisible() && await p.locator('#b-instalar').count() === 0, 'aplicativo: explica que é opcional e como desfazer; sem botão quando o navegador não oferece');
      await p.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => Promise.resolve(); e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); });
      ok(await p.locator('#b-instalar').isVisible(), 'aplicativo: «Instalar o PolarLife» aparece quando o navegador oferece (PLPWA)');
      await travas(p, `${w} gratis · preferencias com instalar`); await foto(p, `${w}-gratis-preferencias-instalar`);
      await p.locator('#b-instalar').click();
      await p.locator('#toast:not([hidden])').waitFor({ timeout: 5000 });
      ok(/instalado/.test(await p.locator('#toast-t').innerText()) && await p.locator('#b-instalar').count() === 0, 'aplicativo: instalar chama o PLPWA e o botão sai');
      await conta(p, '#preferencias');
      ok(await p.locator('input[name=pref-un][value=cm]').isChecked() && await p.locator('#pref-novidades').getAttribute('aria-checked') === 'true', 'preferências: continuam depois de recarregar');

      /* 7 · Privacidade e dados */
      await abrir(p, 'privacidade');
      const links = await p.locator('#sec-privacidade .docs a').evaluateAll(as => as.map(a => a.getAttribute('href')).join());
      ok(links === '../../legal/#privacidade,../../legal/#termos,../../legal/#cookies', 'privacidade: links de Privacidade, Termos e Cookies');
      const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('#b-exportar').click()]);
      const arq = join(saida, `dados-${w}.json`); await dl.saveAs(arq);
      const dados = JSON.parse(await readFile(arq, 'utf8'));
      ok(dados.produto === 'PolarLife' && dados.perfil.nome === 'Maria Teste' && dados.preferencias.unidade === 'cm' && dados.codigos.length === 2 && dados.recibos.length === 1 && !JSON.stringify(dados).includes(cods[0].codigo),
        'privacidade: «Exportar meus dados» leva perfil, preferências, códigos (sem o código legível) e recibos');

      /* capturas de todas as seções, com as Travas conferidas em cada uma */
      await conta(p);
      await percorrer(p, w, 'gratis', TODAS, { seguranca: async () => { await p.locator('#b-senha').click(); } });
      ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));

      /* excluir conta: LED na opção segura; excluir apaga a conta deste navegador */
      await abrir(p, 'privacidade');
      await p.locator('#b-excluir').click();
      ok(await p.locator('#dlg-act .led-btn').innerText() === 'Manter conta', 'excluir conta: pop-up com o LED em «Manter conta»');
      await foto(p, `${w}-gratis-excluir`);
      await p.locator('#dlg-act .led-btn').click();
      ok(!(await p.locator('#dialog').isVisible()) && await p.evaluate(() => !!PLCONTA.sessao()), 'excluir conta: «Manter conta» fecha e nada muda');
      await p.locator('#b-excluir').click();
      await p.locator('#dlg-act').getByRole('button', { name: 'Excluir conta' }).click();
      await p.waitForURL('**/app/entrar/**', { timeout: 8000 });
      ok(await p.evaluate(() => !PLCONTA.sessao() && !(JSON.parse(localStorage.getItem('pl-contas-teste') || '{}'))['gratis@polarlife.test']), 'excluir conta: sai e apaga cadastro, preferências e códigos deste navegador');
      await c.close();
    }

    /* ===================== Folha avulsa ===================== */
    console.log(`\n${w} × ${h} · conta Folha avulsa`);
    {
      const { c, p } = await novo(w, h);
      await entrar(p, 'avulsa'); await conta(p);
      await abrir(p, 'plano');
      let t = await texto(p, 'plano');
      ok(/Folha avulsa/.test(t) && /sem mensalidade/.test(t) && /Agora dá para gerar até 3 folhas padrão\./.test(t) && await p.locator('#sec-plano .tile').count() === 2, 'plano Folha avulsa: folhas por classe (3 padrão, 0 grandes) e limite disponível');
      ok(await leds(p) === 1, 'plano Folha avulsa: um LED («Ver folhas e planos»)');
      await abrir(p, 'pagamentos');
      ok(await p.locator('#rec-vazio').isVisible() && await p.locator('#pg-vazio').isVisible(), 'pagamentos: sem compras, «Nenhuma compra ainda.»');
      await abrir(p, 'codigos');
      ok(await p.locator('#cod-vazio').isVisible() && await p.locator('#in-codigo').isVisible(), 'códigos: campo para resgatar e lista vazia');
      await percorrer(p, w, 'avulsa', ['plano', 'codigos', 'pagamentos']);
      await c.close();
    }

    /* ===================== Pro ===================== */
    console.log(`\n${w} × ${h} · conta Pro`);
    {
      const { c, p } = await novo(w, h);
      await entrar(p, 'pro'); await conta(p);
      await abrir(p, 'plano');
      let t = await texto(p, 'plano');
      ok(/Pro · R\$ 14,90 por mês/.test(t) && /Ativo/.test(t) && /\d+ de 100/.test(t) && /uso razoável/.test(t) && /Sem limite fixo/.test(t) && /Demonstração: nenhuma cobrança é feita/.test(t), 'plano Pro: preço, situação, uso do mês e uso razoável, dito que não cobra');
      let n = 0; for (const id of TODAS) { await abrir(p, id); n += await leds(p); }
      ok(n === 0, 'Pro: nenhuma seção tem LED (brief §3.2)');
      await abrir(p, 'plano');
      await p.locator('#assin').click();
      ok(await p.evaluate(() => PLCONTA.plano().assinaturaDesligada === true && PLCONTA.assinatura().assinaturaDesligada === true), 'plano Pro: interruptor da assinatura PolarLife');
      await p.locator('#b-cancelar').click();
      ok(await p.locator('#dlg-act .led-btn').innerText() === 'Manter o Pro', 'cancelar: pop-up com o LED em «Manter o Pro»');
      await p.locator('#dlg-act').getByRole('button', { name: 'Cancelar assinatura' }).click();
      await p.locator('#b-reativar').waitFor({ timeout: 5000 });
      t = await texto(p, 'plano');
      ok(/Cancelado/.test(t) && /Pro até \d+ de \S+ de \d{4} · depois, Grátis/.test(t) && await p.evaluate(() => PLCONTA.assinatura().situacao) === 'cancelada_no_fim', 'cancelar: Pro vale até o fim do período, com a data');
      await abrir(p, 'pagamentos');
      t = await p.locator('#sec-pagamentos [aria-labelledby=cc-assin]').innerText();
      ok(/Cancelada/.test(t) && /Vale até/.test(t) && /demonstração/.test(t), 'pagamentos Pro: cartão da assinatura com a situação');
      await travas(p, `${w} pro · pagamentos (cancelada)`); await foto(p, `${w}-pro-pagamentos-cancelada`);
      await abrir(p, 'plano');
      await foto(p, `${w}-pro-plano-cancelado`);
      await p.locator('#b-reativar').click();
      await p.locator('#b-cancelar').waitFor({ timeout: 5000 });
      t = await texto(p, 'plano');
      ok(/Ativo/.test(t) && /Renova em \d+ de \S+ de \d{4}\./.test(t) && await p.evaluate(() => PLCONTA.assinatura().situacao === 'ativa' && PLCONTA.recibos().length === 1), 'reativar: Pro ativo, com a data de renovação e o recibo de demonstração');
      await percorrer(p, w, 'pro', ['plano', 'pagamentos', 'seguranca']);
      /* sair de todos os aparelhos */
      await abrir(p, 'seguranca');
      await p.locator('#b-sair-todos').click();
      ok(await p.locator('#dlg-act .led-btn').innerText() === 'Continuar conectado' && /demonstração/.test(await p.locator('#dlg-corpo').innerText()), 'sair de todos: pop-up com o LED em «Continuar conectado»');
      await p.locator('#dlg-act').getByRole('button', { name: 'Sair de todos' }).click();
      await p.waitForURL('**/app/entrar/**', { timeout: 8000 });
      ok(await p.evaluate(() => !PLCONTA.temSessao()), 'sair de todos: encerra a sessão');
      await c.close();
    }

    /* ===================== sessão por código de impressão ===================== */
    console.log(`\n${w} × ${h} · sessão por código de impressão`);
    {
      const { c, p } = await novo(w, h);
      await p.goto(srv.url + 'app/entrar/'); await p.waitForFunction(() => !!window.PLCONTA);
      await p.evaluate(async () => {
        const k = (await PLCONTA.admin.gerarCodigos('avulso-basico', 1, 30))[0];
        await PLCONTA.verificarCodigo(k.codigo);
        PLCONTA.completarCadastro({ nome: 'Ana do Código', email: 'ana@exemplo.test', aceite: true, origem: 'codigo' });
      });
      await conta(p);
      const ids = await p.evaluate(() => [...document.querySelectorAll('.sec')].map(s => s.dataset.sec));
      ok(ids.join() === DO_CODIGO.join() && await p.locator('#quem-plano').innerText() === 'Pacote Avulso básico', 'código: cinco seções (sem Pagamentos nem Segurança) e o pacote no cartão');
      await abrir(p, 'perfil');
      let t = await texto(p, 'perfil');
      ok(/Ana do Código/.test(t) && /ana@exemplo\.test/.test(t) && /Código de impressão/.test(t), 'código · perfil: nome, e-mail e forma de entrada');
      await abrir(p, 'plano');
      t = await texto(p, 'plano');
      ok(/Avulso básico/.test(t) && /8 de 8/.test(t) && /Uma impressão de até 8 folhas/.test(t) && await leds(p) === 0, 'código · plano: pacote e folhas disponíveis, sem LED');
      await abrir(p, 'codigos');
      t = await texto(p, 'codigos');
      ok(/Código em uso/.test(await p.locator('#cc-codigos').innerText()) && /válido até \d{2}\/\d{2}\/\d{4}/.test(t) && /Disponível/.test(t) && await p.locator('#f-codigo').count() === 0, 'código · códigos: o código em uso, com validade, sem campo de resgate');
      await abrir(p, 'preferencias');
      await p.locator('.opc__o:has(input[value=pol])').click();
      ok(await p.locator('#pref-novidades').count() === 0 && await p.evaluate(() => JSON.parse(localStorage.getItem('pl-preferencias')).unidade) === 'pol', 'código · preferências: unidade guardada no aparelho; sem e-mails');
      await abrir(p, 'privacidade');
      ok(await p.locator('#b-exportar').count() === 0 && await p.locator('#b-excluir').count() === 0 && await p.locator('#sec-privacidade .docs a').count() === 3 && await p.locator('#v-aceite').isVisible(), 'código · privacidade: links legais e aceite; sem exportar nem excluir conta');
      await percorrer(p, w, 'codigo', DO_CODIGO);
      await p.evaluate(() => PLCONTA.consumir(8, 'padrao', 'c1'));
      await conta(p, '#plano');
      t = await texto(p, 'plano');
      ok(/Seu código já foi usado/.test(t) && /0 de 8/.test(t) && await p.evaluate(() => PLCONTA.codigos()[0].situacao) === 'usado', 'código usado: plano e código mostram que acabou');
      await travas(p, `${w} codigo · plano (usado)`); await foto(p, `${w}-codigo-plano-usado`);
      await p.locator('#b-sair').click();
      await p.waitForURL('**/app/entrar/**', { timeout: 8000 });
      ok(await p.evaluate(() => !PLCONTA.temSessao()), 'código: «Sair» encerra a sessão');
      await c.close();
    }
  }

  /* ===================== trocar a senha de verdade e admin (só desktop) ===================== */
  console.log('\nSenha e admin');
  {
    const { c, p } = await novo(1440, 900);
    await p.goto(srv.url + 'app/entrar/'); await p.waitForFunction(() => !!window.PLCONTA);
    await p.evaluate(() => PLCONTA.criarConta({ nome: 'Nova Pessoa', email: 'nova@exemplo.test', senha: 'senha-antiga-1', aceite: true }));
    await conta(p, '#seguranca');
    ok(/Conta criada em\s*\d+ de /.test(await p.locator('#c-perfil').textContent()), 'conta nova: mostra a data de criação');
    await p.locator('#b-senha').click();
    await p.locator('#in-senha-atual').fill('senha-antiga-1'); await p.locator('#in-senha-nova').fill('senha-nova-22'); await p.locator('#in-senha-rep').fill('senha-nova-22'); await p.locator('#b-senha-salvar').click();
    await p.locator('#m-senha[role=status]').waitFor({ timeout: 15000 });
    const troca = await p.evaluate(async () => {
      PLCONTA.sair(); let velha = 'entrou';
      try { await PLCONTA.entrarComSenha('nova@exemplo.test', 'senha-antiga-1'); } catch (e) { velha = e.tipo; }
      let nova = 'entrou'; try { await PLCONTA.entrarComSenha('nova@exemplo.test', 'senha-nova-22'); } catch (e) { nova = e.tipo; }
      return velha + '/' + nova;
    });
    ok(troca === 'incorreto/entrou', 'segurança: a senha nova passa a valer e a antiga deixa de valer (' + troca + ')');
    await entrar(p, 'admin'); await conta(p);
    ok(await p.locator('#b-admin').isVisible() && /admin\/$/.test(await p.locator('#b-admin').getAttribute('href')) && await leds(p) === 0, 'admin: a Conta leva ao painel do admin, que continua separado');
    await abrir(p, 'plano');
    ok(/conta de administração/.test(await texto(p, 'plano')) && await p.locator('#b-cancelar').count() === 0, 'admin: limites do Pro, sem assinatura para cancelar');
    await travas(p, '1440 admin · plano'); await foto(p, '1440-admin-plano');
    await c.close();
  }
  ok(erros.length === 0, 'nenhum erro de página no teste todo' + (erros.length ? ': ' + [...new Set(erros)].join(' | ') : ''));
} catch (e) { ok(false, 'exceção: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' ')); }

await nav.close(); srv.fechar();
console.log(falhas ? `\n✘ conta (configurações): ${falhas} falha(s)` : '\n✔ conta (configurações): sem falhas · capturas em tests/saida/conta/');
process.exit(falhas ? 1 : 0);
