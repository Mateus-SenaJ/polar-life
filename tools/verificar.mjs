#!/usr/bin/env node
// Verificação estática do site (sem dependências). Uso: node tools/verificar.mjs
// Erros (saída 1): link ou ativo quebrado, âncora ausente, CDN/terceiro não permitido, noindex ausente em /app,
// peso tipográfico > 500 (T1), fonte não autohospedada (T6, TP-06). Avisos: cor fora da paleta (T2).
// Recurso externo é procurado em HTML, CSS e JS (P-FONTES fechada na etapa 29: Google Fonts agora é erro).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
function externos(origem, txt) {
  for (const m of txt.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)/g)) {
    erros.push(`${rel(origem)}: recurso externo proibido (T6) → ${m[1]}`);
  }
}
const VENDOR = join(SITE, 'assets', 'vendor');
for (const f of arquivos.filter(f => /\.(js|css)$/.test(f) && !f.startsWith(VENDOR))) {  // vendor: URLs só em comentários internos, sem requisição (T6)
  const s = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of s.matchAll(/(?:url\(\s*['"]?|['"])(https?:\/\/[^'")\s]+)/g))
    if (!/^http:\/\/www\.w3\.org\//.test(m[1])) erros.push(`${rel(f)}: recurso externo proibido (T6) → ${m[1]}`);
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
  if (rel(h).startsWith('app') && !/noindex/.test(s)) erros.push(`${rel(h)}: falta <meta name="robots" content="noindex"> (DOC-08 §7)`);
  const js = [...s.matchAll(/<script[^>]*src=["']([^"']+)["']/g)].map(m => resolve(dirname(h), m[1]));
  for (const j of js) if (existsSync(j))                       // navegação feita em JS vale a partir da página
    for (const m of readFileSync(j, 'utf8').matchAll(/location\.(?:href|assign|replace)\s*[=(]\s*['"]([^'"]+)['"]/g)) conferir(h, m[1]);
}
for (const c of arquivos.filter(f => extname(f) === '.css')) {
  const s = readFileSync(c, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');   // ignora comentários
  for (const m of s.matchAll(/url\(\s*['"]?([^'")]+)/g)) conferir(c, m[1]);
  for (const m of s.matchAll(/font-weight\s*:\s*(\d+|bold|bolder)/g))
    if (+m[1] > 500 || /bold/.test(m[1])) erros.push(`${rel(c)}: font-weight ${m[1]} (T1: máx. 500)`);
  for (const m of s.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
    let h = m[1].toLowerCase(); if (h.length === 3) h = [...h].map(x => x + x).join('');
    if (h.length === 6 && !PALETA.has('#' + h)) avisos.push(`${rel(c)}: cor fora da paleta (T2) → #${h}`);
  }
}
const unicos = a => [...new Set(a)];
console.log(`Páginas: ${htmls.length} · Arquivos: ${arquivos.length}`);
unicos(avisos).forEach(a => console.log('AVISO ', a));
unicos(erros).forEach(e => console.log('ERRO  ', e));
console.log(erros.length ? `\n✖ ${unicos(erros).length} erro(s)` : '\n✔ Sem erros');
process.exit(erros.length ? 1 : 0);
