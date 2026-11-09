// Renderiza uma página de um PDF em PNG (pdf.js no Chromium), para revisão visual. Uso: node tools/renderizar-pdf.mjs arquivo.pdf saida.png
import { chromium } from 'playwright'; import { createServer } from 'node:http'; import { readFile } from 'node:fs/promises'; import { join } from 'node:path';
const dir = 'node_modules/pdfjs-dist/build/', pdf = process.argv[2], out = process.argv[3];
const srv = createServer(async (q, r) => { try { const b = q.url === '/doc.pdf' ? await readFile(pdf) : await readFile(join(dir, q.url)); r.writeHead(200, { 'content-type': q.url.endsWith('mjs') ? 'text/javascript' : 'application/pdf', 'access-control-allow-origin': '*' }).end(b); } catch { r.writeHead(404).end(); } }).listen(0);
const u = `http://127.0.0.1:${srv.address().port}/`, b = await chromium.launch(), p = await b.newPage(); await p.goto(u + 'x');
const png = await p.evaluate(async u => { const pj = await import(u + 'pdf.min.mjs'); pj.GlobalWorkerOptions.workerSrc = u + 'pdf.worker.min.mjs';
  const d = await pj.getDocument(u + 'doc.pdf').promise, pg = await d.getPage(1), v = pg.getViewport({ scale: 1.4 }), c = document.createElement('canvas'); c.width = v.width; c.height = v.height;
  await pg.render({ canvasContext: c.getContext('2d'), viewport: v }).promise; return c.toDataURL('image/png').split(',')[1]; }, u);
(await import('node:fs')).writeFileSync(out, Buffer.from(png, 'base64')); await b.close(); srv.close();
