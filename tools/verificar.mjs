#!/usr/bin/env node
// Verificação estática do site (sem dependências). Uso: node tools/verificar.mjs
// Erros (saída 1): link ou ativo quebrado, âncora ausente, CDN/terceiro não permitido, noindex ausente em /app,
// peso tipográfico > 500 (T1), fonte não autohospedada (T6, TP-06). Avisos: cor fora da paleta (T2).
// Recurso externo é procurado em HTML, CSS e JS (P-FONTES fechada na etapa 29: Google Fonts agora é erro).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const SITE = fileURLToPath(new URL('../site', import.meta.url));
const erros = [], avisos = [];
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const arquivos = walk(SITE), htmls = arquivos.filter(f => f.endsWith('.html'));
const rel = p => relative(SITE, p);
const PALETA = new Set(['#ffffff', '#000000', '#006194', '#fd761a', '#f8f9fa']);

function alvo(base, ref) {                       // resolve link relativo; devolve [caminho, hash] ou null
  if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(ref) || ref === '') return null;
  const [cam, hash = ''] = ref.split('#'); const sem = cam.split('?')[0];
  let p = sem === '' ? base : resolve(dirname(base), sem);
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  return [p, hash];
}
function usaHash(p) {                            // página que lê location.hash trata #x como estado/rota, não como id
  const s = readFileSync(p, 'utf8');
  return /location\.hash/.test(s) || [...s.matchAll(/<script[^>]*src=["']([^"']+)["']/g)]
    .some(m => { const j = resolve(dirname(p), m[1]); return existsSync(j) && /location\.hash/.test(readFileSync(j, 'utf8')); });
}
function conferir(origem, ref) {
  const a = alvo(origem, ref); if (!a) return;
  const [p, hash] = a;
  if (!existsSync(p)) return erros.push(`${rel(origem)}: ativo ou link quebrado → ${ref}`);
  if (hash && p.endsWith('.html') && !usaHash(p) && !new RegExp(`id=["']${hash}["']`).test(readFileSync(p, 'utf8')))
    erros.push(`${rel(origem)}: âncora inexistente → ${ref}`);
}
const SITECFG = JSON.parse(readFileSync(fileURLToPath(new URL('./site.json', import.meta.url)), 'utf8'));
function externos(origem, txt) {
  // o canonical é o endereço do próprio site (tools/site.json), não recurso de terceiro (T6)
  const semCanonical = txt.replace(/<link rel="canonical" href="[^"]*">/g, '');
  for (const m of semCanonical.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)/g)) {
    erros.push(`${rel(origem)}: recurso externo proibido (T6) → ${m[1]}`);
  }
}
function seo(h, s) {                                            // 35: SEO e semântica das páginas públicas
  const r = rel(h).split('\\').join('/'), pub = SITECFG.paginas.find(p => p.arquivo === r);
  if (r.startsWith('app/')) { if (/rel="canonical"|property="og:/.test(s)) erros.push(`${r}: página noindex não leva canonical nem Open Graph`); return; }
  if (!pub) return;
  const h1 = (s.match(/<h1[ >]/g) || []).length;
  if (h1 !== 1) erros.push(`${r}: deve ter exatamente um <h1> (tem ${h1})`);
  const can = (s.match(/<link rel="canonical" href="([^"]*)">/) || [])[1];
  if (can !== SITECFG.url + pub.rota) erros.push(`${r}: canonical deve ser ${SITECFG.url + pub.rota} (está ${can || 'ausente'})`);
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image']) if (!s.includes(`property="${p}"`)) erros.push(`${r}: falta ${p}`);
  if (!existsSync(join(SITE, SITECFG.og))) erros.push(`imagem de compartilhamento ausente: ${SITECFG.og} (npm run og)`);
}
const VENDOR = join(SITE, 'assets', 'vendor');
// D-147: endereços de NAVEGAÇÃO (a pessoa vai ao Google e volta), não recursos carregados pela página (T6)
const NAVEGACAO = { 'assets/js/nucleo/google.js': ['https://accounts.google.com/o/oauth2/v2/auth', 'https://accounts.google.com', 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly'],
  // D-168: API REST do seletor do Google Fotos (chamada só quando a pessoa escolhe fotos do Google; CSP connect-src)
  'assets/js/nucleo/google-fotos.js': ['https://photospicker.googleapis.com/v1/'],
  // D-208: abrir o Instagram ou o WhatsApp para anexar o arquivo baixado (navegação, sem nada carregado pela página)
  'assets/js/ui/enviar-apps.js': ['https://www.instagram.com/', 'https://web.whatsapp.com/', 'https://wa.me/'] };
for (const f of arquivos.filter(f => /\.(js|css)$/.test(f) && !f.startsWith(VENDOR))) {  // vendor: URLs só em comentários internos, sem requisição (T6)
  const s = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const nav = NAVEGACAO[rel(f).split('\\').join('/')] || [];
  for (const m of s.matchAll(/(?:url\(\s*['"]?|['"])(https?:\/\/[^'")\s]+)/g))
    if (!/^http:\/\/www\.w3\.org\//.test(m[1]) && !nav.includes(m[1])) erros.push(`${rel(f)}: recurso externo proibido (T6) → ${m[1]}`);
}

// 30a: um mesmo window.PLxxx não pode ser definido por dois arquivos (colisão de módulos)
const plDono = new Map();
for (const f of arquivos.filter(f => f.endsWith('.js') && f.startsWith(join(SITE, 'assets', 'js')))) {
  const s = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of s.matchAll(/window\.(PL[A-Za-z0-9_]+)\s*=/g)) {
    const nome = m[1];
    if (!plDono.has(nome)) plDono.set(nome, new Set());
    plDono.get(nome).add(rel(f));
  }
}
for (const [nome, donos] of plDono)
  if (donos.size > 1) erros.push(`window.${nome} definido em mais de um arquivo: ${[...donos].join(', ')}`);

for (const h of htmls) {
  const s = readFileSync(h, 'utf8');
  for (const m of s.matchAll(/(?:src|href)=["']([^"']+)["']/g)) conferir(h, m[1]);
  externos(h, s);
  seo(h, s);
  if (rel(h).startsWith('app') && !/noindex/.test(s)) erros.push(`${rel(h)}: falta <meta name="robots" content="noindex"> (DOC-08 §7)`);
  const js = [...s.matchAll(/<script[^>]*src=["']([^"']+)["']/g)].map(m => resolve(dirname(h), m[1]));
  for (const j of js) if (existsSync(j))                       // navegação feita em JS vale a partir da página
    for (const m of readFileSync(j, 'utf8').matchAll(/location\.(?:href|assign|replace)\s*[=(]\s*['"]([^'"]+)['"]/g)) conferir(h, m[1]);
}
for (const c of arquivos.filter(f => extname(f) === '.css')) {
  const s = readFileSync(c, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');   // ignora comentários
  for (const m of s.matchAll(/url\(\s*['"]?([^'")]+)/g)) conferir(c, m[1]);
  // D-148: o peso 700 só vale em @font-face (negrito real do texto da legenda, conteúdo da pessoa); a interface segue em ≤ 500 (T1)
  for (const m of s.replace(/@font-face\s*\{[^}]*\}/g, '').matchAll(/font-weight\s*:\s*(\d+|bold|bolder)/g))
    if (+m[1] > 500 || /bold/.test(m[1])) erros.push(`${rel(c)}: font-weight ${m[1]} (T1: máx. 500)`);
  for (const m of s.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
    let h = m[1].toLowerCase(); if (h.length === 3) h = [...h].map(x => x + x).join('');
    if (h.length === 6 && !PALETA.has('#' + h)) {
      if (h === 'd7263d' && rel(c).split('\\').join('/') === 'assets/css/ui/qualidade.css') continue; /* D-130 */
      avisos.push(`${rel(c)}: cor fora da paleta (T2) → #${h}`);
    }
  }
}
// 36: a lista de arquivos do service worker precisa estar em dia (arquivo novo de /app/ sem entrar no cache)
try { execFileSync(process.execPath, [fileURLToPath(new URL('./gerar-sw.mjs', import.meta.url)), '--checar'], { stdio: 'pipe' }); }
catch (e) { erros.push('site/app/sw-arquivos.js desatualizado: rode npm run sw'); }
// 42: a lista de mídias realistas (D-140) precisa refletir os arquivos que existem em site/assets/
try { execFileSync(process.execPath, [fileURLToPath(new URL('./gerar-midia.mjs', import.meta.url)), '--checar'], { stdio: 'pipe' }); }
catch (e) { erros.push('site/assets/js/ui/midia-arquivos.js desatualizado: rode npm run midia'); }
/* 41 · T2 também nas ilustrações vetoriais: só a paleta (com opacidade), sem texto e sem recurso externo */
for (const f of arquivos.filter(f => f.endsWith('.svg') && f.includes(join('img', 'ilustracoes')))) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    let h = m[1].toLowerCase(); if (h.length === 3) h = [...h].map(x => x + x).join('');
    if (!PALETA.has('#' + h)) erros.push(`${rel(f)}: cor fora da paleta (T2) → #${h}`);
  }
  if (/\b(?:rgb|hsl)a?\(/.test(s)) erros.push(`${rel(f)}: cor em rgb()/hsl() — use a paleta em hex (T2)`);
  if (/<text[\s>]/.test(s)) erros.push(`${rel(f)}: texto dentro da ilustração (o texto fica no HTML)`);
  if (/href=["'](?!#)/.test(s)) erros.push(`${rel(f)}: referência externa na ilustração (T6)`);
  if (s.length > 25 * 1024) erros.push(`${rel(f)}: ${(s.length / 1024).toFixed(1)} KB (máx. 25 KB)`);
}
const unicos = a => [...new Set(a)];
console.log(`Páginas: ${htmls.length} · Arquivos: ${arquivos.length}`);
unicos(avisos).forEach(a => console.log('AVISO ', a));
unicos(erros).forEach(e => console.log('ERRO  ', e));
console.log(erros.length ? `\n✖ ${unicos(erros).length} erro(s)` : '\n✔ Sem erros');
process.exit(erros.length ? 1 : 0);
