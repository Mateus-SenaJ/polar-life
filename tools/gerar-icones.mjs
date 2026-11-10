#!/usr/bin/env node
// Ícones quadrados do PWA e favicons (P28, DOC-01 §13 LOGO-E) a partir do emblema original em alta resolução.
// Regras (DS-15): nunca esticar nem recolorir; proporção preservada, centralizado, fundo branco.
// Uso: npm run icones [-- caminho/do/emblema.png]   (padrão: design/referencias/logos-originais/LOGO-E_emblema_4372x3904.png)
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const FONTE = process.argv[2] || process.env.PL_EMBLEMA || RAIZ + 'design/referencias/logos-originais/LOGO-E_emblema_4372x3904.png';
const SAIDA = RAIZ + 'site/assets/img/icones/';
const png = readFileSync(FONTE), w = png.readUInt32BE(16), h = png.readUInt32BE(20);
if (Math.min(w, h) < 512) { console.error(`✘ Emblema com ${w}×${h}: o lado menor precisa ter ao menos 512 px (DS-15 não permite ampliar).`); process.exit(1); }

// [arquivo, lado, fração do lado ocupada pelo emblema]
const ICONES = [
  ['icone-192.png', 192, .80], ['icone-512.png', 512, .80],
  ['icone-maskable-512.png', 512, .64],          // dentro da zona segura de 80% do maskable
  ['apple-touch-icon-180.png', 180, .80],
  ['favicon-48.png', 48, .92], ['favicon-32.png', 32, .94], ['favicon-16.png', 16, .96],
];

mkdirSync(SAIDA, { recursive: true });
const nav = await chromium.launch(), pagina = await nav.newPage();
const dados = 'data:image/png;base64,' + png.toString('base64');
for (const [nome, lado, frac] of ICONES) {
  const b64 = await pagina.evaluate(async ({ dados, lado, frac }) => {
    const img = new Image(); img.src = dados; await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = lado;
    const g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, lado, lado);
    // recorta a margem transparente do emblema para centralizar o desenho de verdade
    const t = document.createElement('canvas'); t.width = img.width; t.height = img.height;
    const tg = t.getContext('2d'); tg.drawImage(img, 0, 0);
    const d = tg.getImageData(0, 0, t.width, t.height).data; let x0 = t.width, y0 = t.height, x1 = 0, y1 = 0;
    for (let y = 0; y < t.height; y += 2) for (let x = 0; x < t.width; x += 2) if (d[(y * t.width + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, k = (lado * frac) / Math.max(bw, bh), dw = bw * k, dh = bh * k;
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, x0, y0, bw, bh, (lado - dw) / 2, (lado - dh) / 2, dw, dh);
    return c.toDataURL('image/png').split(',')[1];
  }, { dados, lado, frac });
  writeFileSync(SAIDA + nome, Buffer.from(b64, 'base64'));
  console.log(`  ✔ ${nome.padEnd(26)} ${lado}×${lado}`);
}
await nav.close();
console.log(`\n✔ Ícones gerados de ${w}×${h} em site/assets/img/icones/`);
