/* Gera os dados de lugares em site/assets/dados/locais/ (D-139). Roda só em tempo de build, com internet;
   o site não consulta nada de terceiros em tempo de uso (CSP connect-src 'self').
   Fontes: municípios e estados (kelvins/municipios-brasileiros, MIT) · malhas municipais (IBGE, dados públicos) · pontos turísticos (Wikidata, CC0)
   · países (Natural Earth 110m, domínio público). Uso: node tools/gerar-locais.mjs */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, 'site', 'assets', 'dados', 'locais');
const UA = { 'User-Agent': 'PolarLiveBuild/1.0' };
const BASE = 'https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/';
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
const r3 = (n) => Math.round(n * 1000) / 1000;
async function pegar(url, opc = {}, tent = 4) {
  for (let i = 0; i < tent; i++) {
    try {
      const r = await fetch(url, { headers: { ...UA, ...(opc.headers || {}) } });
      if (r.ok) return await r.json();
    } catch (e) { /* tenta de novo */ }
    await new Promise((ok) => setTimeout(ok, 2500 * (i + 1)));
  }
  throw new Error('Falhou: ' + url.slice(0, 120));
}
function rad(g) { return g * Math.PI / 180; }
function km(a, b, c, d) { const x = rad(c - a), y = rad(d - b) * Math.cos(rad((a + c) / 2)); return 6371 * Math.sqrt(x * x + y * y); }

const estados = await pegar(BASE + 'estados.json');
const ufDe = {}; estados.forEach((e) => { ufDe[e.codigo_uf] = e.uf; });
const UFS = estados.map((e) => e.uf).sort();
const mun = await pegar(BASE + 'municipios.json');
const M = mun.map((m) => [m.nome, UFS.indexOf(ufDe[m.codigo_uf]), r3(m.latitude), r3(m.longitude)]);
M.sort((a, b) => a[0].localeCompare(b[0], 'pt'));
mkdirSync(SAIDA, { recursive: true });
writeFileSync(join(SAIDA, 'municipios.json'), JSON.stringify({ ufs: UFS, m: M }));
console.log('municipios.json', M.length);

/* malhas municipais do IBGE (dados públicos), uma por UF: polígonos quantizados em 1e-4 grau, anéis em deltas.
   Formato: {"m":[[nome,[polígono,...]],...]} · polígono = [anel externo, buracos...] · anel = [x0,y0,dx,dy,...] (inteiros ×1e4, x = lon, y = lat). */
const IBGE = 'https://servicodados.ibge.gov.br/api/';
const MALHAS = {};   /* uf → [{nome, polis:[[anel absoluto em graus]]}] (só em memória, para dar município e UF aos pontos) */
function codificarAnel(r) {
  const out = []; let ux = 0, uy = 0, prim = true;
  for (const c of r) {
    const x = Math.round(c[0] * 1e4), y = Math.round(c[1] * 1e4);
    if (prim) { out.push(x, y); prim = false; } else { if (x === ux && y === uy) continue; out.push(x - ux, y - uy); }
    ux = x; uy = y;
  }
  return out;
}
function decodificarAnel(a) { const r = []; let x = 0, y = 0; for (let i = 0; i < a.length; i += 2) { x = i ? x + a[i] : a[i]; y = i ? y + a[i + 1] : a[i + 1]; r.push([x / 1e4, y / 1e4]); } return r; }
function dentroAnel(x, y, r) { let ok = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) ok = !ok; } return ok; }
function municipioDe(lat, lon) {
  for (const uf of Object.keys(MALHAS)) for (const m of MALHAS[uf]) for (const poli of m.polis) {
    if (!dentroAnel(lon, lat, poli[0])) continue;
    if (poli.slice(1).some((b) => dentroAnel(lon, lat, b))) continue;
    return { uf, nome: m.nome };
  }
  return null;
}
function municipioPerto(lat, lon, maxKm = 6) {   /* costa: a malha mínima não cobre toda a faixa de areia; vale o município de borda mais próximo */
  let melhor = null, d0 = maxKm;
  for (const uf of Object.keys(MALHAS)) for (const m of MALHAS[uf]) for (const poli of m.polis) for (const c of poli[0]) {
    const d = km(lat, lon, c[1], c[0]); if (d < d0) { d0 = d; melhor = { uf, nome: m.nome }; }
  }
  return melhor;
}
let tamMalhas = 0;
for (const uf of UFS) {
  const nomes = {};
  (await pegar(IBGE + 'v1/localidades/estados/' + uf + '/municipios')).forEach((m) => { nomes[String(m.id)] = m.nome; });
  const g = await pegar(IBGE + 'v3/malhas/estados/' + uf + '?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio');
  const lista = [], mem = [];
  for (const f of g.features) {
    const nome = nomes[String(f.properties.codarea)]; if (!nome || !f.geometry) continue;
    const polis = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    lista.push([nome, polis.map((p) => p.map(codificarAnel))]);
    mem.push({ nome, polis: polis.map((p) => p.map((r) => decodificarAnel(codificarAnel(r)))) });
  }
  MALHAS[uf] = mem;
  const txt = JSON.stringify({ m: lista });
  writeFileSync(join(SAIDA, 'malha-' + uf + '.json'), txt);
  tamMalhas += Buffer.byteLength(txt);
  console.log('malha-' + uf + '.json', lista.length, Buffer.byteLength(txt));
}
console.log('malhas total', tamMalhas);

/* pontos: Wikidata (CC0). [caminho de classe, QID, mínimo de versões da Wikipédia] */
const CLASSES = [
  ['wdt:P31/wdt:P279*', 'Q40080', 0], ['wdt:P31/wdt:P279*', 'Q570116', 1], ['wdt:P31', 'Q4989906', 1], ['wdt:P31/wdt:P279*', 'Q46169', 1],
  ['wdt:P31/wdt:P279*', 'Q34038', 1], ['wdt:P31/wdt:P279*', 'Q39715', 1], ['wdt:P31/wdt:P279*', 'Q839954', 1], ['wdt:P31/wdt:P279*', 'Q57821', 1],
  ['wdt:P31', 'Q23397', 3], ['wdt:P31', 'Q25391', 1], ['wdt:P31', 'Q8502', 4], ['wdt:P31', 'Q16970', 3], ['wdt:P31', 'Q33506', 3],
  ['wdt:P31', 'Q22698', 3], ['wdt:P31', 'Q179700', 2], ['wdt:P31', 'Q473972', 3], ['wdt:P31', 'Q15089', 1]
];
const OBRIGATORIOS = ['Praia de Itapuã', 'Praia do Forte', 'Farol da Barra', 'Pelourinho', 'Cristo Redentor', 'Copacabana', 'Praia de Copacabana', 'Boa Viagem', 'Praia de Boa Viagem',
  'Baía do Sancho', 'Lençóis Maranhenses', 'Parque Nacional dos Lençóis Maranhenses', 'Jalapão', 'Parque Estadual do Jalapão', 'Pão de Açúcar', 'Praia de Ipanema', 'Elevador Lacerda', 'Maracanã', 'Praia de Jericoacoara', 'Fernando de Noronha', 'Chapada Diamantina', 'Parque Nacional da Chapada Diamantina', 'Ponta Negra', 'Praia de Ponta Negra', 'Praia de Pipa', 'Praia de Itacaré', 'Praia da Concha', 'Praia do Rosa', 'Praia dos Carneiros', 'Porto de Galinhas', 'Praia de Porto de Galinhas', 'Praia de Taipu de Fora', 'Lagoa do Abaeté'];
const MANUAIS = [   /* coordenadas públicas conferidas à mão, só se o Wikidata não trouxer o nome */
  ['Jalapão', -10.5, -46.6], ['Parque Nacional da Serra do Divisor', -8.4, -73.2], ['Praia de Itapuã', -12.953, -38.363], ['Farol da Barra', -13.01, -38.533]
];
const MAX_UF = 650;
const pontos = new Map();   /* chave nome|lat|lon → [nome, lat, lon, versões] */
function guardar(rot, wkt, s) {
  const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(wkt); if (!m || /^Q\d+$/.test(rot)) return;
  const nome = rot.charAt(0).toUpperCase() + rot.slice(1), lat = r3(+m[2]), lon = r3(+m[1]), k = nome + '|' + lat.toFixed(2) + '|' + lon.toFixed(2);
  const ant = pontos.get(k); if (!ant || ant[3] < s) pontos.set(k, [nome, lat, lon, s]);
}
async function sparql(q) {
  return pegar('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q), { headers: { Accept: 'application/sparql-results+json' } });
}
for (const [cam, cls, min] of CLASSES) {
  const q = `SELECT ?i ?l ?c ?s WHERE { ?i ${cam} wd:${cls}; wdt:P17 wd:Q155; wdt:P625 ?c; wikibase:sitelinks ?s. FILTER(?s>=${min}) ?i rdfs:label ?l. FILTER(LANG(?l)="pt") } LIMIT 20000`;
  try { const j = await sparql(q); j.results.bindings.forEach((b) => guardar(b.l.value, b.c.value, +b.s.value)); console.log(cls, j.results.bindings.length); }
  catch (e) { console.warn('Aviso: classe ' + cls + ' ignorada (' + e.message + ')'); }
  await new Promise((ok) => setTimeout(ok, 1200));
}
const obrig = new Set();
try {
  const vals = OBRIGATORIOS.map((n) => '"' + n + '"@pt').join(' ');
  const j = await sparql(`SELECT ?i ?l ?c ?s WHERE { VALUES ?l { ${vals} } ?i rdfs:label ?l; wdt:P625 ?c; wikibase:sitelinks ?s. } LIMIT 500`);
  j.results.bindings.forEach((b) => { guardar(b.l.value, b.c.value, 999); obrig.add(b.l.value); });
} catch (e) { console.warn('Aviso: lista obrigatória por rótulo falhou (' + e.message + ')'); }
MANUAIS.forEach(([n, la, lo]) => { if (![...pontos.values()].some((p) => p[0] === n)) { pontos.set(n + '|m', [n, la, lo, 999]); } });
const porUf = {}; UFS.forEach((u) => { porUf[u] = []; });
for (const [nome, lat, lon, s] of pontos.values()) {
  const m = municipioDe(lat, lon) || municipioPerto(lat, lon);
  if (!m) continue;                      /* fora do Brasil ou no mar */
  porUf[m.uf].push([nome, lat, lon, m.nome, s]);
}
let tot = 0, tamP = 0;
UFS.forEach((u) => {
  const a = porUf[u].sort((x, y) => y[4] - x[4]).slice(0, MAX_UF).sort((x, y) => x[0].localeCompare(y[0], 'pt')).map((p) => p.slice(0, 4));
  const txt = JSON.stringify(a); tot += a.length; tamP += Buffer.byteLength(txt);
  writeFileSync(join(SAIDA, 'pontos-' + u + '.json'), txt);
  if (a.length < 3) console.warn('Aviso: poucos pontos em ' + u + ' (' + a.length + ')');
});
console.log('pontos', tot, tamP, 'bytes');
OBRIGATORIOS.forEach((n) => { if (![...pontos.values()].some((p) => p[0] === n)) console.warn('Aviso: sem ponto obrigatório «' + n + '»'); });

/* países: polígonos simplificados (inteiros em décimos de grau) */
const ne = await pegar(NE);
const P = [];
for (const f of ne.features) {
  const p = f.properties, g = f.geometry; if (!g) continue;
  const polis = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const aneis = [];
  polis.forEach((poli) => {
    const ring = poli[0], flat = []; let ux = null, uy = null;
    ring.forEach((c) => { const x = Math.round(c[0] * 10), y = Math.round(c[1] * 10); if (x === ux && y === uy) return; ux = x; uy = y; flat.push(x, y); });
    if (flat.length >= 6) aneis.push(flat);
  });
  const nome = p.NAME_PT || p.NAME_EN || p.NAME;
  P.push({ n: nome, c: p.ISO_A3 && p.ISO_A3 !== '-99' ? p.ISO_A3 : (p.ADM0_A3 || ''), p: aneis });
}
writeFileSync(join(SAIDA, 'paises.json'), JSON.stringify(P));
console.log('paises.json', P.length);
