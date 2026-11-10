#!/usr/bin/env node
// SEO das páginas públicas a partir de UMA fonte (tools/site.json): canonical, Open Graph, Twitter Card,
// favicons quadrados (P28), JSON-LD na inicial, sitemap.xml e robots.txt. Escreve entre os marcadores
// <!-- seo:inicio --> … <!-- seo:fim --> no <head>. Uso: npm run seo   ·   Checagem (sem escrever): node tools/seo.mjs --checar
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../', import.meta.url)), SITE = RAIZ + 'site/';
const cfg = JSON.parse(readFileSync(RAIZ + 'tools/site.json', 'utf8'));
const checar = process.argv.includes('--checar');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const INI = '<!-- seo:inicio (gerado por tools/seo.mjs a partir de tools/site.json; não edite à mão) -->', FIM = '<!-- seo:fim -->';
let difere = 0;

for (const p of cfg.paginas) {
  const caminho = SITE + p.arquivo, html = readFileSync(caminho, 'utf8');
  const titulo = (html.match(/<title>([^<]*)<\/title>/) || [])[1], desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!titulo || !desc) throw new Error(`${p.arquivo}: falta <title> ou description`);
  const url = cfg.url + p.rota, prof = p.arquivo.split('/').length - 1, rel = '../'.repeat(prof), img = cfg.url + cfg.og;
  const tituloOg = titulo.replace(/^Polar Life · /, '');                 // o site_name já diz «Polar Life»
  const linhas = [
    INI,
    `<link rel="canonical" href="${url}">`,
    `<link rel="icon" type="image/png" sizes="32x32" href="${rel}assets/img/icones/favicon-32.png">`,
    `<link rel="icon" type="image/png" sizes="16x16" href="${rel}assets/img/icones/favicon-16.png">`,
    `<link rel="apple-touch-icon" href="${rel}assets/img/icones/apple-touch-icon-180.png">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(cfg.nome)}">`,
    `<meta property="og:locale" content="${cfg.locale}">`,
    `<meta property="og:title" content="${esc(tituloOg)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${img}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(cfg.ogAlt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ];
  if (p.rota === '') linhas.push('<script type="application/ld+json">' + JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebApplication', name: cfg.nome, url, inLanguage: 'pt-BR',
    applicationCategory: 'DesignApplication', operatingSystem: 'Web', description: desc,
    // offers omitido: preços do DOC-03 §2 ainda são [HIPÓTESE] (T7) — [VALIDAR] com o dono antes de publicar preço
  }) + '</script>');
  linhas.push(FIM);
  const bloco = linhas.join('\n');
  let novo;
  if (html.includes('<!-- seo:inicio')) novo = html.replace(/<!-- seo:inicio[\s\S]*?<!-- seo:fim -->/, bloco);
  else novo = html.replace(/<link rel="icon"[^>]*>\n?/, '').replace('</title>', '</title>\n' + bloco);
  if (novo !== html) { difere++; if (!checar) writeFileSync(caminho, novo); }
  console.log(`  ${novo === html ? '✔' : checar ? '✘' : '↻'} ${p.arquivo} → ${url}`);
}

const hoje = new Date().toISOString().slice(0, 10);
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  cfg.paginas.map(p => `  <url><loc>${cfg.url + p.rota}</loc><priority>${p.prioridade}</priority></url>`).join('\n') + '\n</urlset>\n';
const robots = `# Polar Life\n# No GitHub Pages em subcaminho os buscadores só leem o robots.txt da raiz do domínio;\n# quem protege /app/ é o <meta name="robots" content="noindex"> de cada página (o verificar confere).\nUser-agent: *\nDisallow: /app/\n\nSitemap: ${cfg.url}sitemap.xml\n`;
for (const [arq, txt] of [['sitemap.xml', sitemap], ['robots.txt', robots]]) {
  let atual = ''; try { atual = readFileSync(SITE + arq, 'utf8'); } catch { }
  if (atual !== txt) { difere++; if (!checar) writeFileSync(SITE + arq, txt); }
  console.log(`  ${atual === txt ? '✔' : checar ? '✘' : '↻'} ${arq}`);
}
void hoje;
if (checar && difere) { console.log(`\n✘ SEO desatualizado em ${difere} arquivo(s): rode npm run seo`); process.exit(1); }
console.log(checar ? '\n✔ SEO em dia' : '\n✔ SEO gerado');
