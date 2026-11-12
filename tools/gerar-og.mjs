#!/usr/bin/env node
// Imagem de compartilhamento (Open Graph, 1200 × 630) do PolarLife. Só a paleta (T2), fontes locais (T6),
// logo oficial sem esticar (DS-15), sem fotos de terceiros (P31/J4). Uso: npm run og
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { servir } from '../tests/helpers/servidor.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url)), SITE = RAIZ + 'site/';
const srv = await servir(), base = srv.url;           // servidor local: página em memória não carrega file://
// cena plana, a mesma linguagem da cena de exemplo do gerador
const cena = (sx, v) => `<svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice"><rect width="300" height="300" fill="#fff"/>
<rect width="300" height="190" fill="#006194" opacity=".14"/><circle cx="${sx}" cy="${v ? 88 : 96}" r="30" fill="#FD761A"/>
<path d="M0 190L60 110L110 160L170 80L240 170L300 120V300H0Z" fill="#006194" opacity=".55"/>
<path d="M0 230L80 170L150 220L220 160L300 225V300H0Z" fill="#000" opacity=".85"/><rect y="268" width="300" height="32" fill="#000"/></svg>`;
const pol = (x, y, r, sx, legenda, z) => `<figure class="pol" style="left:${x}px;top:${y}px;transform:rotate(${r}deg);z-index:${z}">
<div class="jan">${cena(sx)}</div><figcaption>${legenda}</figcaption></figure>`;
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><base href="${base}">
<link rel="stylesheet" href="assets/css/base/fonts.css"><style>
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#fff;font-family:'Inter',sans-serif;overflow:hidden;position:relative}
.texto{position:absolute;left:72px;top:110px;width:560px}
.logo{height:56px;width:auto;display:block;margin-bottom:56px}
h1{margin:0;font-weight:500;font-size:62px;line-height:1.04;letter-spacing:-.015em;color:#000}
h1 span{display:block;font-family:'Caveat',cursive;font-weight:500;color:#006194;font-size:78px;margin-top:6px}
p{margin:26px 0 0;font-size:22px;line-height:1.4;color:#000;font-weight:400}
.fundo{position:absolute;right:0;top:0;width:520px;height:630px;background:#F8F9FA}
.pol{position:absolute;width:236px;height:287px;margin:0;background:#fff;padding:16px 16px 0;box-shadow:0 18px 40px rgb(0 0 0/.12),0 2px 6px rgb(0 0 0/.08)}
.jan{width:204px;height:204px;overflow:hidden}.jan svg{width:100%;height:100%;display:block}
figcaption{font-family:'Caveat',cursive;font-weight:400;font-size:30px;margin-top:14px;color:#000}
.traco{position:absolute;left:72px;top:92px;width:48px;height:4px;background:#FD761A}
</style></head><body>
<div class="fundo"></div>
<div class="texto"><img class="logo" src="assets/img/logos/Logo_tipografia_lateral.png" alt="">
<h1>Algumas memórias merecem sair <span>da tela.</span></h1>
<p>Suas fotos do celular viram polaroids para imprimir em casa.</p></div>
${pol(726, 26, -8, 210, 'Dias de sol', 1)}${pol(918, 190, 6, 90, 'Nós dois', 3)}${pol(704, 330, 4, 150, 'Dia de rolê', 2)}
</body></html>`;

mkdirSync(SITE + 'assets/img/og', { recursive: true });
const nav = await chromium.launch(), p = await nav.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto(base + 'robots.txt'); await p.setContent(html, { waitUntil: 'networkidle' });
await p.evaluate(async () => { await document.fonts.load("500 62px 'Inter'"); await document.fonts.load("500 78px 'Caveat'"); await document.fonts.load("400 30px 'Caveat'"); await document.fonts.ready; });
await p.screenshot({ path: SITE + 'assets/img/og/polar-life-og.png' });
await nav.close(); srv.fechar();
console.log('✔ site/assets/img/og/polar-life-og.png (1200 × 630)');
