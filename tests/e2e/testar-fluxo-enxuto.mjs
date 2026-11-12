/* D-181 · D-183: fluxo mais enxuto e sem promessa falsa (T7).
   Adicionar fotos: uma caixa só, «Escolha suas fotos» (aparelho, câmera e Google Fotos), sem «Outros lugares» e sem prometer
   conversão de HEIC. Processando: com fotos de verdade, lê cada foto no aparelho («Preparando N de M»), sem a animação de
   conversão de 0,3 s por foto. Quadro: só abas que fazem algo (Ajustes, Legendas, Molduras). */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (v, m) => { console.log((v ? '  ✔ ' : '  ✘ ') + m); if (!v) falhas++; };
const srv = await servir(), nav = await chromium.launch();
const foto = (await readFile(new URL('../../site/assets/img/fotos/praia.jpg', import.meta.url))).toString('base64');
try {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
    const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
    console.log(`\n${w}×${h} · Adicionar fotos:`);
    await p.goto(srv.url + 'app/adicionar-fotos/', { waitUntil: 'networkidle' });
    const a = await p.evaluate(() => ({ h2: [...document.querySelectorAll('main h2')].map((e) => e.textContent.trim()), outros: /Outros lugares/.test(document.body.innerText), heic: /convertidas para JPEG/.test(document.body.innerText),
      botoes: [...document.querySelectorAll('.drop__act button')].filter((b) => !b.hidden).map((b) => b.textContent.trim()), ajuda: !!document.querySelector('.pick .pick__con a[href="../conexoes/"]'), alto: document.documentElement.scrollHeight <= innerHeight + 1 }));
    ok(a.h2.join() === 'Escolha suas fotos' && !a.outros, 'uma caixa só, «Escolha suas fotos», sem «Outros lugares» (' + a.h2.join(' · ') + ')');
    ok(a.botoes.join(' | ') === 'Escolher do aparelho | Usar a câmera | Do Google Fotos', 'origens dentro da caixa: ' + a.botoes.join(' | '));
    ok(!a.heic && a.ajuda, 'sem prometer conversão de HEIC; «Verificar conexões» como ajuda abaixo da caixa');
    ok(a.alto, 'a tela inteira cabe sem rolar');

    console.log('Processando com 24 fotos reais:');
    await p.evaluate(async (d) => {
      localStorage.removeItem('pl-projeto-atual'); sessionStorage.clear();
      const pr = await PLPROJETOS.criar('Fluxo'), ids = [];
      for (let i = 1; i <= 24; i++) { await PLFOTOS.salvar(i, new File([Uint8Array.from(atob(d), (c) => c.charCodeAt(0))], 'f.jpg', { type: 'image/jpeg' }), pr.id); ids.push(i); }
      sessionStorage.setItem('pl-fotos', JSON.stringify(ids)); await PLPROJETOS.salvarEstado();
    }, foto);
    const t0 = Date.now(), rotulos = new Set();
    await p.goto(srv.url + 'app/processando/');
    while (Date.now() - t0 < 15000) { const l = await p.textContent('#lbl').catch(() => ''); if (l) rotulos.add(l.replace(/\d+/g, 'N')); if (!(await p.isDisabled('#go'))) break; await p.waitForTimeout(50); }
    const ms = Date.now() - t0, go = await p.textContent('#go');
    ok(/Continuar com 24 fotos/.test(go) && ms < 4000, `24 fotos conferidas em ${(ms / 1000).toFixed(1)} s (antes, ~8 s de animação)`);
    ok(![...rotulos].some((r) => /Convertendo/.test(r)) && [...rotulos].some((r) => /Preparando N de N|Concluído/.test(r)), 'a barra diz «Preparando», nunca «Convertendo» (' + [...rotulos].join(' / ') + ')');

    console.log('Quadro:');
    await p.goto(srv.url + 'app/editor/quadro/'); await p.waitForFunction(() => !!window.PLQ);
    const abas = await p.evaluate(() => [...document.querySelectorAll('[role=tab]')].map((t) => t.textContent.trim()));
    ok(abas.join() === 'Ajustes,Legendas,Molduras', 'abas do Quadro: ' + abas.join(', ') + ' (Papel e Fotos eram só avisos)');
    await p.focus('#tab-ajustes'); await p.keyboard.press('ArrowLeft');
    ok(await p.evaluate(() => document.activeElement.id === 'tab-molduras' && !document.getElementById('p-molduras').hidden), 'setas do teclado andam entre as 3 abas');
    ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros.join(' | ') : ''));
    await ctx.close();
  }
} catch (e) { ok(false, 'exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ fluxo enxuto: ${falhas} falha(s)` : '\n✔ fluxo enxuto: sem falhas');
process.exit(falhas ? 1 : 0);
