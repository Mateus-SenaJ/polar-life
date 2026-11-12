import { abrirTudo, SECOES } from '../helpers/mais.mjs';
/* 44 · Contagem real das fotos ponta a ponta (bug «sempre aparecem 24 fotos»).
   Gera JPEGs de teste por canvas no próprio navegador — não usa as fotos pessoais do dono (T5).
   Confere: processando, resumo (contagem + orientação + folhas) e Quadro usam a seleção real;
   uma seleção nova não mistura fotos antigas; 30 fotos funcionam; nada de 24 fixo. */
import { chromium } from 'playwright';
import { servir } from '../helpers/servidor.mjs';

const srv = await servir(), base = srv.url, nav = await chromium.launch({ headless: true });
const page = await nav.newPage();
await page.addInitScript(abrirTudo, SECOES);   /* D-172: ajustes avançados à vista */
const falhas = [];
function ok(v, m) { console.log((v ? '✔ ' : '✘ ') + m); if (!v) falhas.push(m); }

await page.addInitScript(() => {
  localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })); // guarda de /app/ (D-123)
});

/* Semeia IndexedDB com `land` horizontais + `port` verticais e grava pl-fotos = [1..n]. */
async function semear(land, port) {
  await page.goto(base + 'app/adicionar-fotos/');
  await page.waitForFunction(() => !!window.PLFOTOS);
  await page.evaluate(async ({ land, port }) => {
    function gen(w, h, i) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.fillStyle = i % 2 ? '#006194' : '#FD761A'; x.fillRect(0, 0, w, h);
      return new Promise(r => c.toBlob(b => r(new File([b], 'foto-' + i + '.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.9));
    }
    await PLFOTOS.limpar();
    const n = land + port, ids = [];
    for (let i = 1; i <= n; i++) {
      const horizontal = i <= land;
      const f = await gen(horizontal ? 1600 : 1200, horizontal ? 1200 : 1600, i);
      await PLFOTOS.salvar(i, f); ids.push(i);
    }
    sessionStorage.setItem('pl-fotos', JSON.stringify(ids));
    ['pl-quadro', 'pl-folhas', 'pl-prevoo', 'pl-exportar'].forEach(k => sessionStorage.removeItem(k));
  }, { land, port });
}

try {
  /* ---- Projeto A: 5 fotos (3 horizontais, 2 verticais) ---- */
  await semear(3, 2);

  await page.goto(base + 'app/processando/');
  await page.getByText(/Continuar com 5 fotos|Concluído · 5 de 5/).first().waitFor({ timeout: 15000 });
  const det = await page.locator('#det-t').textContent();
  ok(/\(5\)/.test(det), 'processando: 5 arquivos reais (não 24) — «' + det.trim() + '»');

  await page.goto(base + 'app/resumo/');
  await page.waitForFunction(() => /\b5\b/.test(document.querySelector('#stats dd').textContent));
  const fotosVal = (await page.locator('#stats dd').first().textContent()).trim();
  ok(fotosVal === '5', 'resumo: Fotos = 5 (era 24 fixo)');
  await page.waitForFunction(() => /3 horizontais/.test(document.querySelector('#stats').textContent));
  const stats = await page.locator('#stats').textContent();
  ok(/3 horizontais/.test(stats) && /2 verticais/.test(stats), 'resumo: orientação real 3 horizontais e 2 verticais');
  ok(/2 A4/.test(stats), 'resumo: 5 fotos → 2 folhas A4 (4 + 1)');

  await page.goto(base + 'app/editor/quadro/');
  await page.locator('[aria-label*="de 5"]').first().waitFor({ timeout: 15000 });
  const nPol = await page.locator('[aria-label*="de 5"]').count();
  ok(nPol >= 5, 'Quadro: 5 polaroids da seleção real (' + nPol + ' alvos «de 5»)');
  const vinte4 = await page.locator('[aria-label*="de 24"]').count();
  ok(vinte4 === 0, 'Quadro: nenhuma referência a «de 24»');

  /* ---- Projeto B: nova seleção de 3 fotos não traz as 5 anteriores ---- */
  await semear(2, 1);
  const chaves = await page.evaluate(() => PLFOTOS.todos().then(a => a.length));
  ok(chaves === 3, 'nova seleção limpa o IndexedDB: 3 fotos guardadas (não 5+3)');
  await page.goto(base + 'app/resumo/');
  await page.waitForFunction(() => document.querySelector('#stats dd').textContent.trim() === '3');
  ok(true, 'resumo do projeto novo: Fotos = 3 (sem conflito com o anterior)');

  /* ---- 30 fotos funcionam (acima do antigo teto de 24) ---- */
  await semear(30, 0);
  await page.goto(base + 'app/resumo/');
  await page.waitForFunction(() => document.querySelector('#stats dd').textContent.trim() === '30');
  const s30 = await page.locator('#stats').textContent();
  ok(/8 A4/.test(s30), '30 fotos → 8 folhas A4 (sem o limite de 24)');
  await page.goto(base + 'app/editor/quadro/');
  await page.locator('[aria-label*="de 30"]').first().waitFor({ timeout: 15000 });
  ok((await page.locator('[aria-label*="de 30"]').count()) >= 30, 'Quadro: 30 polaroids');
} catch (e) {
  ok(false, 'exceção: ' + e.message);
} finally {
  await nav.close(); srv.fechar();
}
console.log(falhas.length ? `\n✘ projetos: ${falhas.length} falha(s)` : '\n✔ projetos: sem falhas');
process.exit(falhas.length ? 1 : 0);
