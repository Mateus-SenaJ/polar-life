#!/usr/bin/env node
// Teste do motor do Modo Quadro (T-08): PPI (BR-12), zoom mínimo ao endireitar, cobertura da janela (FN-04). Uso: node scripts/testar-quadro.mjs
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../site/assets/js/pages/quadro.js', import.meta.url), 'utf8');
const motor = src.split('/*MOTOR*/')[1].split('/*FIM MOTOR*/')[0];
const M = new Function(motor + '; return {FR,VERT,novo,nat,base,zmin,jq,cabe,acertar,ppi,nivel,zmaxPara,ajustou,mudou,setSrc:f=>{SRCMAP=f;}};')();
let falhas = 0; const ok = (c, m) => { if (!c) { falhas++; console.log('FALHA', m); } };

// DOC-04 §6: «Boa · 326 PPI», «Com ressalvas · 140 PPI»
let s = M.novo(); ok(M.ppi(3, s) === 326 && M.nivel(326) === 'boa', 'padrão = 326 PPI Boa');
s = M.novo(); s.z = 233; ok(M.ppi(12, s) === 140 && M.nivel(140) === 'ressalvas', 'foto 12 = 140 PPI Com ressalvas');
s = M.novo(); s.z = 400; ok(M.ppi(3, s) === 82 && M.nivel(82) === 'ruim', 'zoom 400% = Ruim');
s = M.novo(); s.z = 150; ok(M.nivel(M.ppi(3, s)) === 'abaixo', 'zoom 150% = Abaixo do ideal (' + M.ppi(3, s) + ')');
[[239, 'abaixo'], [240, 'boa'], [180, 'abaixo'], [179, 'ressalvas'], [120, 'ressalvas'], [119, 'ruim']].forEach(([p, n]) => ok(M.nivel(p) === n, 'faixa ' + p));
// Reduzir recorte leva a ≥ 240 PPI
s = M.novo(); s.z = 233; s.z = M.zmaxPara(12, s, 240); ok(M.ppi(12, s) >= 240, 'reduzir recorte ≥ 240 (zoom ' + s.z + ')');
// Encaixar mostra a foto inteira: mais pixels na janela
s = M.novo(); s.modo = 'encaixar'; ok(M.ppi(3, s) > 326, 'encaixar > preencher');
// Endireitar: zoom mínimo sobe (cos+sen) e a janela segue coberta
s = M.novo(); s.ang = 15; M.acertar(3, s); ok(s.z === 123, 'zoom mínimo a 15° = 123 (' + s.z + ')');
s = M.novo(); s.ang = 0.1; M.acertar(3, s); ok(s.z === 101, 'zoom mínimo a 0,1° = 101');
// Verificação independente: polígono da foto (transformação direta) contém os 4 cantos e amostras da janela
function cobre(n, s) {
  const a = M.nat(n), k = M.base(n, s) * s.z / 100, hw = a.w * k / 2, hh = a.h * k / 2;
  const rad = d => d * Math.PI / 180, R = (t, x, y) => [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)];
  const P = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => {
    [x, y] = R(rad(s.rot), x, y); if (s.flip) x = -x; [x, y] = R(rad(s.ang), x, y); return [x + s.px, y + s.py / M.jq()];
  });
  const dentro = (x, y) => { let sg = 0; for (let i = 0; i < 4; i++) { const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % 4], c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1); if (Math.abs(c) < 1e-5) continue; const sn = Math.sign(c); if (sg && sn !== sg) return false; sg = sn; } return true; };
  for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) if (!dentro(-.5 + i / 10 - 1e-7 * (i === 10) + 1e-7 * (i === 0), (-.5 + j / 10 - 1e-7 * (j === 10) + 1e-7 * (j === 0)) / M.jq())) return false;
  return true;
}
// janelas: quadrada, 4:5 (Retro Pocket), 46 × 62 (Instax Mini), 99 × 62 (Instax Wide)
const JANELAS = [[76, 76], [48, 60], [46, 62], [99, 62]];
let n = 0, ruins = 0, seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let t = 0; t < 16000; t++) {
  const jan = JANELAS[t % 4]; M.FR.jw = jan[0]; M.FR.jh = jan[1];
  const foto = 1 + Math.floor(rnd() * 24), st = M.novo();
  st.rot = [0, 90, 180, 270][Math.floor(rnd() * 4)]; st.flip = rnd() < .5; st.ang = Math.round((rnd() * 30 - 15) * 10) / 10;
  st.z = 100 + Math.floor(rnd() * 301); st.px = rnd() - .5; st.py = rnd() - .5;
  M.acertar(foto, st); n++;
  if (!cobre(foto, st)) { ruins++; if (ruins < 4) console.log('descoberto', foto, JSON.stringify(st)); }
  const dx = M.cabe(foto, st, st.px, st.py); if (!dx) ruins++;
}
M.FR.jw = 76; M.FR.jh = 76;
ok(ruins === 0, `janela coberta em ${n} estados aleatórios (${ruins} falhas)`);
// janela não quadrada: proporção, PPI e zoom mínimo
M.FR.jw = 48; M.FR.jh = 60; s = M.novo(); ok(Math.abs(M.jq() - .8) < 1e-9, 'proporção 4:5');
s = M.novo(); M.acertar(3, s); ok(s.z === 100, 'janela 4:5, sem endireitar: zoom mínimo 100 (' + s.z + ')');
s = M.novo(); s.ang = 15; M.acertar(3, s); ok(s.z > 100, 'janela 4:5 a 15°: zoom mínimo sobe (' + s.z + ')');
M.FR.jw = 99; M.FR.jh = 62; s = M.novo(); M.acertar(3, s); ok(M.ppi(3, s) === Math.round(1300 / 99 * 25.4), 'janela larga: PPI usa a largura (' + M.ppi(3, s) + ')');
M.FR.jw = 76; M.FR.jh = 76;
// ajustes individuais
s = M.novo(); ok(!M.ajustou(s) && !M.mudou(s), 'estado padrão'); s.adj.vinheta = 10; ok(M.ajustou(s) && M.mudou(s), 'ajuste detectado');
// Duplicar e Remover (T-14): a orientação segue a foto de origem, não a posição; «src» não conta como ajuste
M.setSrc(n => ({ 1: 2, 2: 2 }[n] || n));
ok(M.nat(1).h === 1300 && M.nat(2).h === 1300 && M.nat(3).w === 1300, 'orientação segue a origem (cópia de vertical continua vertical)');
M.setSrc(n => n);
s = M.novo(); s.src = 5; ok(!M.mudou(s), 'src não marca a foto como Ajustada');
console.log(falhas ? `\n✖ ${falhas} falha(s)` : '✔ Motor do Quadro: sem falhas'); process.exit(falhas ? 1 : 0);
