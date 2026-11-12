#!/usr/bin/env node
// Lista de arquivos e versão do service worker do editor (DOC-08 §7). Escreve site/app/sw-arquivos.js:
//   self.PL_ARQUIVOS=[…] (caminhos relativos a /app/) e self.PL_VERSAO='<hash de conteúdo>'.
// Uso: npm run sw            (gera)   ·   node tools/gerar-sw.mjs --checar   (falha se estiver desatualizado; roda no verificar)
// Entram: páginas de /app/, o que elas referenciam (CSS, JS, imagens, vendor), o que os CSS referenciam (fontes do sistema).
// Fontes de legenda e TTF de fonts/pdf/ não entram (exceto a Inter do PDF): o sw.js guarda sob demanda, só quando usadas.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SITE = fileURLToPath(new URL('../site', import.meta.url)), APP = join(SITE, 'app'), SAIDA = join(APP, 'sw-arquivos.js');
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const norm = p => relative(APP, p).split('\\').join('/');
const lista = new Set();
const fonteSistema = p => /assets\/fonts\/(inter-|cormorant-garamond-)/.test(p.split('\\').join('/'));

function local(base, ref) {                          // resolve referência relativa existente; ignora externos, data:, blob:, âncoras
  if (!ref || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref)) return null;
  let p = resolve(dirname(base), ref.split('#')[0].split('?')[0]);
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  return existsSync(p) && p.startsWith(SITE) ? p : null;
}
function css(arq) {
  const s = readFileSync(arq, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of s.matchAll(/url\(\s*['"]?([^'")]+)/g)) {
    const p = local(arq, m[1]);
    if (p && (!/assets[\\/]fonts[\\/]/.test(p) || fonteSistema(p))) lista.add(p);
  }
}
const paginas = walk(APP).filter(f => f.endsWith('.html'));
for (const h of paginas) {
  lista.add(h);
  for (const m of readFileSync(h, 'utf8').matchAll(/<(?:script|link|img)\b[^>]*?(?:src|href)=["']([^"']+)["']/g)) {
    const p = local(h, m[1]); if (!p || p.endsWith('.html')) continue;
    lista.add(p); if (p.endsWith('.css')) css(p);
  }
}
lista.add(join(APP, 'manifest.webmanifest'));
for (const f of ['inter-400.ttf']) lista.add(join(SITE, 'assets', 'fonts', 'pdf', f));  // PDF offline com a fonte padrão
lista.add(join(SITE, 'assets', 'img', 'icones', 'icone-192.png')); lista.add(join(SITE, 'assets', 'img', 'icones', 'icone-512.png'));

const arquivos = [...lista].filter(p => existsSync(p) && (!/[\\/]assets[\\/]/.test(p) || /\.(css|js|png|svg|woff2?|ttf)$/.test(p)))   /* D-169: mesmas extensões que o sw.js aceita (fotos .jpg nunca vão ao cache) */.map(norm).map(p => p.endsWith('index.html') ? p.slice(0, -10) || './' : p).sort();
const hash = createHash('sha256');
for (const a of arquivos) {
  const p = join(APP, a === './' ? 'index.html' : a.endsWith('/') ? a + 'index.html' : a);
  hash.update(a).update(readFileSync(p));
}
hash.update(readFileSync(join(APP, 'sw.js')));
const versao = hash.digest('hex').slice(0, 12);
const texto = `/* Gerado por tools/gerar-sw.mjs (npm run sw). Não edite à mão. */\nself.PL_VERSAO='${versao}';\nself.PL_ARQUIVOS=${JSON.stringify(arquivos, null, 1).replace(/\n\s*/g, '\n')};\n`;
if (process.argv.includes('--checar')) {
  const atual = existsSync(SAIDA) ? readFileSync(SAIDA, 'utf8') : '';
  if (atual !== texto) { console.error('✖ site/app/sw-arquivos.js está desatualizado (rode: npm run sw)'); process.exit(1); }
  console.log(`✔ Service worker em dia (${arquivos.length} arquivos, versão ${versao})`);
} else { writeFileSync(SAIDA, texto); console.log(`✔ sw-arquivos.js: ${arquivos.length} arquivos, versão ${versao}`); }
