// Servidor estático mínimo para os testes de navegador em Node (sem dependências).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = fileURLToPath(new URL('../../site/', import.meta.url));
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

export function servir(porta = 0) {
  const srv = createServer(async (req, res) => {
    let p = normalize(join(SITE, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!p.startsWith(normalize(SITE))) { res.writeHead(403).end(); return; }
    try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); res.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }).end(await readFile(p)); }
    catch { res.writeHead(404, { 'content-type': TIPOS['.html'] }).end(await readFile(join(SITE, '404.html'))); }
  });
  return new Promise(ok => srv.listen(porta, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${srv.address().port}/`, fechar: () => srv.close() })));
}
