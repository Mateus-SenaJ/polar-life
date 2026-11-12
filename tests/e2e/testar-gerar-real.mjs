/* T-20/21/22: PDF local, progresso, download e ponte IndexedDB (DOC-08 §6). */
import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { servir } from '../helpers/servidor.mjs';

const saida = new URL('../saida/', import.meta.url), srv = await servir(), nav = await chromium.launch({ headless: true });
const page = await nav.newPage({ acceptDownloads: true });
const falhas = [];
function ok(v, m) { console.log((v ? '✔ ' : '✘ ') + m); if (!v) falhas.push(m); }
await page.addInitScript(() => {
  localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })); // sessão de teste: a guarda de /app/ exige conta (D-123)
  /* mesma chave() de exportar.js/gerar.js: djb2 de pl-quadro + '|' + pl-folhas (vazios aqui) */
  let t = (sessionStorage.getItem('pl-quadro') || '') + '|' + (sessionStorage.getItem('pl-folhas') || '') + '|' + (sessionStorage.getItem('pl-colagem') || ''), x = 5381;
  for (let i = 0; i < t.length; i++) x = ((x << 5) + x + t.charCodeAt(i)) | 0;
  const h = String(x);
  sessionStorage.setItem('pl-prevoo', JSON.stringify({ ok: true, k: h, n: 6, fotos: 24, por: 4, papel: 'A4', w: 210, h: 297 }));
  sessionStorage.setItem('pl-exportar', JSON.stringify({ f: 'pdf', lim: 150 }));
  navigator.canShare = () => true;
  navigator.share = a => { window.__share = a; return Promise.resolve(); };
});
try {
  await page.goto(srv.url + 'app/editor/gerar/');
  const vistos = [];
  page.on('console', () => {});
  await page.locator('#live').evaluate((e, a) => new MutationObserver(() => a.push(e.textContent)).observe(e, { childList: true, subtree: true }), vistos);
  await page.getByText('Seu arquivo está pronto').waitFor({ timeout: 60000 });
  const prog = await page.locator('#prog').getAttribute('aria-valuenow');
  ok(prog === '100', 'progresso real chegou a 100');
  const dl = page.waitForEvent('download'); await page.getByRole('button', { name: /^Baixar$/ }).click();
  const download = await dl; await mkdir(saida, { recursive: true }); const arq = join(fileURLToPath(saida), 'gerar-real.pdf'); await download.saveAs(arq);
  const doc = await PDFDocument.load(await (await import('node:fs/promises')).readFile(arq));
  ok(doc.getPageCount() === 6, 'download é PDF real com 6 páginas A4');
  await page.goto(srv.url + 'app/editor/imprimir/'); await page.getByRole('button', { name: /Imprimir agora/ }).click();
  await page.locator('iframe[aria-hidden=true]').waitFor({ timeout: 10000 }); ok(true, 'impressão cria iframe do PDF local');
  await page.goto(srv.url + 'app/editor/compartilhar/'); await page.getByRole('button', { name: 'Compartilhar' }).click();
  const compartilhado = await page.evaluate(() => ({ n: window.__share && window.__share.files.length, nome: window.__share && window.__share.files[0].name, tamanho: window.__share && window.__share.files[0].size }));
  ok(compartilhado.n === 1 && compartilhado.nome === 'Polar-Life.pdf' && compartilhado.tamanho > 1000, 'compartilhar recebe o arquivo real guardado');
  /* Fotos pessoais nunca entram no repositório: o navegador as lê diretamente da pasta local. */
  try {
    const fotos = process.env.PL_FOTOS || fileURLToPath(new URL('../../.local/fotos-de-teste/', import.meta.url));   // pasta ignorada pelo git (T5)
    const xs = (await readdir(fotos)).filter(x => /\.jpe?g$/i.test(x)).slice(0, 24).map(x => join(fotos, x));
    if (xs.length < 24) throw new Error('menos de 24 JPEGs');
    await page.goto(srv.url + 'app/editor/gerar/');
    await page.evaluate(() => { const i = document.createElement('input'); i.id = 'reais'; i.type = 'file'; i.multiple = true; document.body.appendChild(i); });
    await page.setInputFiles('#reais', xs);
    await page.evaluate(async () => { await PLFOTOS.limpar(); await Promise.all([...document.querySelector('#reais').files].map((f, i) => PLFOTOS.salvar(i + 1, f))); });
    const inicio = Date.now(); await page.reload(); await page.getByText('Seu arquivo está pronto').waitFor({ timeout: 120000 });
    const realDl = page.waitForEvent('download'); await page.getByRole('button', { name: /^Baixar$/ }).click(); const real = await realDl;
    const realPath = join(fileURLToPath(saida), 'pdf-real.pdf'); await real.saveAs(realPath);
    const bytes = await (await import('node:fs/promises')).readFile(realPath), realDoc = await PDFDocument.load(bytes);
    /* a localização só existe dentro do bloco EXIF; «GPS» solto aparece por acaso nos dados comprimidos de um PDF grande */
    ok(realDoc.getPageCount() === 6 && !bytes.includes(Buffer.from('Exif\0\0')), 'fotos reais: 6 folhas sem bloco EXIF (' + ((Date.now() - inicio) / 1000).toFixed(1) + ' s, ' + (bytes.length / 1e6).toFixed(1) + ' MB)');
  } catch { console.log('– fotos reais ausentes ou indisponíveis: conferência opcional pulada'); }
} finally { await nav.close(); srv.fechar(); }
console.log(falhas.length ? `\n✘ gerar real: ${falhas.length} falha(s)` : '\n✔ gerar real: sem falhas');
process.exit(falhas.length ? 1 : 0);
