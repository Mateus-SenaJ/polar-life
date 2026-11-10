#!/usr/bin/env node
// P-FONTES (TP-06, TP-08, DS-14, Trava T6): baixa as fontes uma vez, gera o subconjunto latino + pt-BR
// e grava duas cópias: .woff2 para o site (site/assets/fonts/) e .ttf para embutir no PDF (site/assets/fonts/pdf/).
// Também confere a acentuação do DOC-02 §4 (á ã ç é ê í ó õ ú) e junta as licenças em LICENCAS.txt.
// Uso (precisa de rede; só quem atualiza as fontes roda): npm run fontes
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';
import * as fontkit from 'fontkit';

const FONTS = fileURLToPath(new URL('../site/assets/fonts/', import.meta.url));
const PDF = FONTS + 'pdf/';
mkdirSync(PDF, { recursive: true });

// [família, peso, itálico]. Inter 400 e 500 do site já existem (.woff); aqui entram só no PDF.
const LISTA = [
  ['Inter', 300], ['Inter', 400], ['Inter', 500],
  ['Cormorant Garamond', 300], ['Cormorant Garamond', 400], ['Cormorant Garamond', 500],   // 500: rótulos (D-114 revisto pelo brief visual v2, K-02)
  ['Cormorant Garamond', 300, 1], ['Cormorant Garamond', 400, 1],
  ['Caveat', 400], ['Caveat', 500],
  ['IBM Plex Mono', 400],
  ['Reenie Beanie', 400], ['Shadows Into Light', 400], ['Kalam', 400], ['Patrick Hand', 400],
  ['Covered By Your Grace', 400], ['Zeyada', 400],   // Nanum Pen Script e Gaegu saíram: sem acentos (DOC-02 §4, D-111)
  ['Homemade Apple', 400], ['Over the Rainbow', 400], ['La Belle Aurore', 400],
  ['Dancing Script', 400], ['Satisfy', 400], ['Sacramento', 400], ['Allura', 400], ['Parisienne', 400],
  ['Special Elite', 400], ['Courier Prime', 400], ['Cutive Mono', 400],
  ['Playfair Display', 400, 1], ['EB Garamond', 400], ['Libre Baskerville', 400],
];
const WEB_PULA = new Set(['inter-400', 'inter-500']);           // o site segue com os .woff atuais

// Latim básico + Latin-1 (todo o pt-BR) + pontuação tipográfica usada nas legendas e no rodapé.
const FAIXAS = [[0x20, 0x7e], [0xa0, 0xff], [0x131, 0x131], [0x152, 0x153], [0x2013, 0x2014], [0x2018, 0x201e],
  [0x2022, 0x2022], [0x2026, 0x2026], [0x2039, 0x203a], [0x20ac, 0x20ac], [0x2122, 0x2122]];
const TEXTO = FAIXAS.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i))).join('');
const ACENTOS = 'áãçéêíóõúÁÃÇÉÊÍÓÕÚàâô';

const slug = f => f.toLowerCase().replace(/ /g, '-');
const nome = (f, w, it) => `${slug(f)}-${w}${it ? '-italico' : ''}`;
const baixar = async (u, tipo = 'buffer') => { const r = await fetch(u); if (!r.ok) throw new Error(`${r.status} ${u}`); return tipo === 'text' ? r.text() : Buffer.from(await r.arrayBuffer()); };

const relatorio = [], faltam = [];
for (const [fam, w, it] of LISTA) {
  const n = nome(fam, w, it);
  const css = await baixar(`https://fonts.googleapis.com/css2?family=${fam.replace(/ /g, '+')}:ital,wght@${it ? 1 : 0},${w}&display=swap`, 'text');
  const url = (css.match(/url\((https:[^)]+\.ttf)\)/) || [])[1];
  if (!url) throw new Error(`Sem TTF para ${n}`);
  const ttf = await baixar(url);
  const sub = await subsetFont(ttf, TEXTO, { targetFormat: 'truetype' });
  writeFileSync(PDF + n + '.ttf', sub);
  if (!WEB_PULA.has(n)) writeFileSync(FONTS + n + '.woff2', await subsetFont(ttf, TEXTO, { targetFormat: 'woff2' }));
  const fk = fontkit.create(sub), sem = [...ACENTOS].filter(c => !fk.hasGlyphForCodePoint(c.codePointAt(0)));
  if (sem.length) faltam.push(`${fam} ${w}${it ? ' itálico' : ''}: ${sem.join(' ')}`);
  relatorio.push(`${n.padEnd(34)} ${(sub.length / 1024).toFixed(0).padStart(4)} KB (pdf)`);
}

// Licenças (OFL 1.1 ou Apache 2.0), lidas do repositório oficial google/fonts.
let lic = 'Licenças das fontes autohospedadas do Polar Life (subconjunto latino + pt-BR).\n' +
  'Fonte original: Google Fonts (https://fonts.google.com) e repositório google/fonts.\n';
for (const fam of [...new Set(LISTA.map(f => f[0]))]) {
  const d = fam.toLowerCase().replace(/ /g, '');
  let txt = null, tipo = '';
  for (const [pasta, arq, t] of [['ofl', 'OFL.txt', 'SIL Open Font License 1.1'], ['apache', 'LICENSE.txt', 'Apache License 2.0'], ['ufl', 'UFL.txt', 'Ubuntu Font Licence']]) {
    try { txt = await baixar(`https://raw.githubusercontent.com/google/fonts/main/${pasta}/${d}/${arq}`, 'text'); tipo = t; break; } catch { }
  }
  lic += `\n${'='.repeat(72)}\n${fam} · ${tipo || 'licença não encontrada [VALIDAR]'}\n${'='.repeat(72)}\n${txt ? txt.trim() + '\n' : ''}`;
  console.log(`${fam.padEnd(24)} ${tipo || 'licença não encontrada'}`);
}
writeFileSync(FONTS + 'LICENCAS.txt', lic);

console.log('\n' + relatorio.join('\n'));
console.log(faltam.length ? '\n✘ Sem acentuação completa:\n  ' + faltam.join('\n  ') : '\n✔ Todas as fontes têm á ã ç é ê í ó õ ú');
