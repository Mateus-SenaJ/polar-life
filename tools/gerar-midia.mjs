#!/usr/bin/env node
// Lista das mídias realistas que já existem no site (D-140). Escreve site/assets/js/ui/midia-arquivos.js:
//   window.PLMIDIA_ARQUIVOS=[…] (caminhos relativos a site/assets/). O PLMIDIA só pede ao servidor o que está
//   nessa lista, então arquivo ausente nunca vira erro 404: a página fica com a reserva (poster e desenho).
// Uso: npm run midia          (gera)   ·   node tools/gerar-midia.mjs --checar   (falha se desatualizado; roda no verificar)
// Os nomes definitivos estão em docs/prompts-flow.md. Depois de salvar arquivos novos: npm run midia && npm run sw.
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSETS = fileURLToPath(new URL('../site/assets', import.meta.url));
const SAIDA = join(ASSETS, 'js', 'ui', 'midia-arquivos.js');
export const ESPERADOS = [
  // vídeo 1 · mesa: celular → polaroids (apresentação) · 16:9 e 4:5
  'video/mesa-polaroids.mp4', 'video/mesa-polaroids.webm', 'video/mesa-polaroids-poster.jpg',
  'video/mesa-polaroids-vertical.mp4', 'video/mesa-polaroids-vertical.webm', 'video/mesa-polaroids-vertical-poster.jpg',
  // vídeo 2 · varal iluminado com polaroids (tela de entrar)
  'video/varal-polaroids.mp4', 'video/varal-polaroids.webm', 'video/varal-polaroids-poster.jpg',
  // câmera instantânea realista, sem marca
  'img/fotos/camera-perfil.png',
  // vídeo 3 · a câmera solta a foto (como funciona, passo 1) · fundo quase branco, fundido por multiply (D-146)
  'video/camera-foto.mp4', 'video/camera-foto.webm', 'video/camera-foto-poster.jpg',
  // fotos de pessoas para as polaroids
  'img/fotos/amigos-praia.jpg', 'img/fotos/amigos-trilha.jpg', 'img/fotos/casal-cidade.jpg', 'img/fotos/casal-por-do-sol.jpg',
  'img/fotos/amigos-viagem.jpg', 'img/fotos/familia-aniversario.jpg', 'img/fotos/casal-cafe.jpg', 'img/fotos/familia-parque.jpg'
];
const tem = ESPERADOS.filter(a => { const p = join(ASSETS, a); return existsSync(p) && statSync(p).size > 0; });
const texto = `/* Gerado por tools/gerar-midia.mjs (npm run midia). Não edite à mão. */\nwindow.PLMIDIA_ARQUIVOS=${JSON.stringify(tem)};\n`;
if (process.argv.includes('--checar')) {
  const atual = existsSync(SAIDA) ? readFileSync(SAIDA, 'utf8') : '';
  if (atual !== texto) { console.error('✖ site/assets/js/ui/midia-arquivos.js está desatualizado (rode: npm run midia)'); process.exit(1); }
  console.log(`✔ Mídias em dia (${tem.length} de ${ESPERADOS.length} arquivos presentes)`);
} else if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(SAIDA, texto);
  console.log(`✔ midia-arquivos.js: ${tem.length} de ${ESPERADOS.length} arquivos presentes`);
  ESPERADOS.filter(a => !tem.includes(a)).forEach(a => console.log('  falta  site/assets/' + a));
}
