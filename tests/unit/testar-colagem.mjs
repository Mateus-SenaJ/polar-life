// Motor da Colagem e padrões de Folhas (D-150 a D-152): geometria determinística, dentro da margem, sem navegador.
// Carrega os arquivos ES5 do site num contexto vazio (window = o próprio contexto).
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../../site/assets/js/nucleo/', import.meta.url));
const w = {}; w.window = w; vm.createContext(w);
for (const f of ['motor-folhas', 'colagem']) vm.runInContext(readFileSync(raiz + f + '.js', 'utf8'), w, { filename: f });
const FL = w.PLFOLHAS, C = w.PLCOLAGEM, falhas = [];
const ok = (c, m) => { console.log((c ? '✔ ' : '✘ ') + m); if (!c) falhas.push(m); };
const fotos = n => Array.from({ length: n }, (_, i) => ({ n: i + 1, src: i + 1 }));
const FR = { w: 88, h: 107 };

console.log('Padrões de Folhas (D-150):');
ok(FL.PADRAO.margem === 3 && FL.PADRAO.gap === 0, 'projeto novo: margem 3 mm e espaço entre polaroids 0 mm');
ok(FL.MARGEM_MIN === 3, 'margem mínima sem aviso = 3 mm');
const a4 = FL.paginar(FL.PADRAO, FR, fotos(24));
ok(!a4.erro && a4.g.n === 4 && a4.sheets.length === 6, 'A4 com 3/0: 4 polaroids por folha, 6 folhas para 24');
const x0 = a4.sheets[0].cells.map(c => c.x).sort((p, q) => p - q);
ok(Math.abs(x0[2] - x0[0] - 88) < 1e-9, 'espaço 0: as polaroids vizinhas se encostam (88 mm de passo)');
const velho = FL.paginar(Object.assign({}, FL.PADRAO, { margem: 10, gap: 4 }), FR, fotos(24));
ok(velho.g.n === 4 && velho.sheets.length === 6 && Math.abs(velho.sheets[0].cells[1].x - velho.sheets[0].cells[0].x - 92) < 1e-9, 'projeto salvo com 10/4 segue com 10 mm e 4 mm (92 mm de passo)');

console.log('Layouts da Colagem (D-150):');
ok(C.LAYOUTS.map(l => l.id).join() === 'grade,mosaico,espalhadas,tira,coracao,mural,capa,tempo,varal,cabine', '10 layouts (5 + os 5 das redes, D-195): ' + C.LAYOUTS.map(l => l.id).join(', '));
let combos = 0, fora = 0, nao = 0, difer = 0, cob = 0, pior = 0;
for (const papel of ['A4', 'A3', 'A5', '13x18'])
  for (const orient of ['retrato', 'paisagem'])
    for (const l of C.LAYOUTS)
      for (const n of [1, 2, 3, 5, 7, 12, 24]) {
        const s = Object.assign({}, FL.PADRAO, { papel, orient, colagem: { ativo: true, layout: l.id } });
        const R = FL.paginar(s, FR, fotos(n));
        if (R.erro) continue;
        combos++;
        const total = R.sheets.reduce((t, sh) => t + sh.cells.length, 0);
        if (total !== n) nao++;
        R.sheets.forEach(sh => sh.cells.forEach(c => { if (!C.dentro(c, R.p, s.margem)) fora++; }));
        R.sheets.forEach(sh => { const c = C.cobertura(sh.cells, FR.w, FR.h); pior = Math.max(pior, c); if (c > 0.2 + 0.001) cob++; });
        const R2 = FL.paginar(s, FR, fotos(n));
        if (JSON.stringify(R.sheets.map(sh => sh.cells.map(c => [c.x, c.y, c.w, c.h, c.rot]))) !== JSON.stringify(R2.sheets.map(sh => sh.cells.map(c => [c.x, c.y, c.w, c.h, c.rot])))) difer++;
        if (R.sheets.length !== Math.ceil(n / R.g.n)) nao++;
      }
ok(combos > 200, combos + ' combinações de papel × orientação × layout × nº de fotos conferidas');
ok(nao === 0, 'toda foto aparece uma vez e o nº de folhas é ⌈fotos ÷ capacidade⌉');
ok(fora === 0, 'toda polaroid (já girada) fica dentro da margem da folha');
ok(cob === 0, `regra de sobreposição (D-153): nenhuma foto fica com mais de 20% coberta por outra polaroid (pior caso ${(pior * 100).toFixed(1)}%)`);
ok(difer === 0, 'determinístico: o mesmo projeto dá sempre as mesmas posições (CL-07)');
const s5 = l => Object.assign({}, FL.PADRAO, { colagem: { ativo: true, layout: l } });
ok(C.LAYOUTS.every(l => FL.paginar(s5(l.id), FR, fotos(24)).g.n >= 3), 'A4: todos os layouts comportam 3 ou mais polaroids por folha');
const esp = FL.paginar(s5('espalhadas'), FR, fotos(5)).sheets[0].cells;
const e6 = FL.paginar(s5('espalhadas'), FR, fotos(6)).sheets[0].cells;
ok(FL.paginar(s5('espalhadas'), FR, fotos(24)).g.cap >= 5 && e6.length === 6, 'espalhadas: 5 ou 6 polaroids numa folha A4, bem distribuídas');
const ocupa = cs => { const xs = cs.flatMap(c => [c.x, c.x + c.w]), ys = cs.flatMap(c => [c.y, c.y + c.h]); return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)) / (210 * 297); };
ok(ocupa(e6) > 0.7, 'espalhadas: as 6 polaroids ocupam mais de 70% da folha (' + Math.round(ocupa(e6) * 100) + '%)');
const hc = FL.paginar(s5('coracao'), FR, fotos(10)).sheets[0].cells;
ok(hc.length === 10 && hc.every(c => c.s < 1 && c.s >= 0.3), 'coração: 10 polaroids menores (' + Math.round(hc[0].s * 100) + '% do tamanho) numa folha A4');
const xs = hc.map(c => c.x + c.w / 2), ys = hc.map(c => c.y + c.h / 2), cxm = (Math.min(...xs) + Math.max(...xs)) / 2;
const baixo = hc.filter(c => c.y + c.h / 2 > Math.max(...ys) - 20);
ok(baixo.length >= 1 && Math.abs(baixo[0].x + baixo[0].w / 2 - cxm) < 5 && Math.max(...xs) - Math.min(...xs) > 0.9 * (Math.max(...ys) - Math.min(...ys)), 'coração: ponta embaixo no centro e conjunto mais largo que alto (formato de coração)');
ok(esp.some(c => c.rot !== 0) && esp.every(c => Math.abs(c.rot) <= 6), 'espalhadas: leve rotação, no máximo 6°');
const med = FL.paginar(s5('espalhadas'), FR, fotos(24)).sheets[0].cells;
ok(['grade', 'mosaico', 'espalhadas', 'tira'].every(l => FL.paginar(s5(l), FR, fotos(24)).sheets.every(sh => sh.cells.every(c => c.s === 1 && ((c.w === 88 && c.h === 107) || (c.w === 107 && c.h === 88))))), 'a medida da polaroid não muda nos layouts de papel (só o Coração e os das redes ajustam a escala) — Coração (D-133, D-153)');
ok(FL.contar(s5('coracao'), FR, 24, 0).folhas === FL.paginar(s5('coracao'), FR, fotos(24)).sheets.length, 'contar() e paginar() concordam com a Colagem ligada');
ok(FL.paginar(s5('grade'), FR, fotos(24)).colagem === true && !FL.paginar(FL.PADRAO, FR, fotos(24)).colagem, 'sem Colagem ligada, vale a grade de Folhas');
ok(FL.paginar(Object.assign({}, FL.PADRAO, { papel: '10x15', orient: 'retrato', colagem: { ativo: true, layout: 'espalhadas' } }), FR, fotos(3)).erro === true, 'papel pequeno demais: erro claro, sem posição inválida');

console.log('Colagens para as redes (D-195):');
const sr = (l, peca, extra) => C.config({}, Object.assign({ ativo: true, layout: l, peca }, extra || {}));
ok(['r11', 'r45', 'r916'].map(k => C.PECAS[k].rede.w + 'x' + C.PECAS[k].rede.h).join() === '1080x1080,1080x1350,1080x1920' && C.PECAS.r916.h * 4.5 === 1920, 'tamanhos para as redes: 1080 × 1080, 1080 × 1350 e 1080 × 1920 (4,5 px por mm)');
ok(C.rede(sr('mural', 'r11')).w === 1080 && C.rede({ peca: 'r45' }).h === 1350 && C.rede(sr('mural', 'A4')) === null, 'rede() vale para a configuração da folha e para a da colagem; papel não é rede');
ok(C.norm({ peca: 'r916', orient: 'paisagem' }).orient === 'retrato' && FL.papel(sr('mural', 'r45')).n === 'Retrato 4:5', 'imagem para as redes é sempre em pé e leva o nome do tamanho');
ok(C.MODELOS.length === 6 && C.MODELOS.every(m => C.LAYOUTS.some(l => l.id === m.c.layout) && C.PECAS[m.c.peca].rede), 'os 6 modelos do Início usam layouts e tamanhos que existem');
const cm = C.comModelo({ ativo: false, layout: 'grade', peca: 'A4', fotos: [3, 5] }, 'tempo');
ok(cm.ativo && cm.layout === 'tempo' && cm.peca === 'r45' && cm.fotos.join() === '3,5' && cm.fundo.tipo === 'cor', 'comModelo liga a Colagem, troca layout, tamanho e fundo e mantém as fotos escolhidas');
const um = l => C.paginar(sr(l, 'r11'), FR, fotos(1)).sheets[0].cells[0].s, umA4 = l => C.paginar(sr(l, 'A4'), FR, fotos(1)).sheets[0].cells[0].s;
ok(['mural', 'capa', 'tempo', 'varal', 'cabine'].every(l => um(l) > 1.5 && umA4(l) <= 1), 'nas redes a polaroid cresce para ocupar a imagem; no papel nunca passa da medida real');
const rT = C.paginar(sr('tempo', 'r45'), FR, [5, 3, 9, 1].map((d, i) => ({ n: i + 1, src: i + 1, m: { iso: '2026-07-0' + d } })));
ok(rT.sheets[0].cells.map(c => c.f.n).join() === '4,2,1,3', 'Linha do tempo: na ordem das datas');
ok(rT.sheets[0].deco.filter(d => d.t === 'linha').length === 1 && rT.sheets[0].deco.filter(d => d.t === 'cheio').length === 4, 'Linha do tempo: um traço e uma marca por polaroid');
const rV = C.paginar(sr('varal', 'r916'), Object.assign({ topo: 6 }, FR), fotos(6)), sv = rV.sheets[0];
const pinos = sv.deco.filter(d => d.t === 'cheio'), fio = sv.deco.filter(d => d.t === 'linha');
ok(pinos.length === 6 && fio.length > 0 && fio.every(d => d.z === 'atras') && pinos.every(d => d.z === 'frente'), 'Varal: fio por trás e um pregador por polaroid na frente');
ok(sv.cells.every((c, i) => { const s = c.s, a = c.rot * Math.PI / 180, h = c.h * s / 2, ty = c.y + c.h / 2 - h * Math.cos(a), pb = pinos[i].y + pinos[i].h; return pb <= ty + 6 * s + .01; }), 'Varal: o pregador fica só na borda branca de cima (T4: nada sobre a foto)');

const n1 = C.norm({ ativo: 1, layout: 'xx', fundo: { tipo: 'foto', cor: 'azul', ang: 725, px: 150, py: -3, suave: 200, foto: 'a' } });
ok(n1.layout === 'espalhadas' && n1.fundo.cor === '#FFFFFF' && n1.fundo.ang === 0 && n1.fundo.px === 100 && n1.fundo.py === 0 && n1.fundo.suave === 100 && n1.fundo.foto === null, 'norm() corrige layout, cor, ângulo, posição, suavização e foto inválidos');
ok(C.norm({ fundo: { cor: '#12ab9c' } }).fundo.cor === '#12AB9C', 'a cor é livre: qualquer #RRGGBB');
ok(C.PADRAO.fundo.tipo === 'foto' && C.PADRAO.fundo.foto === null, 'padrão: foto de fundo = a primeira do projeto');
ok(C.fotoDeFundo({ fundo: { foto: null } }, [{ src: 7 }, { src: 9 }]) === 7, 'sem escolha, a foto de fundo é a primeira');
ok(C.fotoDeFundo({ fundo: { foto: 9 } }, [{ src: 7 }, { src: 9 }]) === 9, 'escolha específica vale');
ok(C.fotoDeFundo({ fundo: { foto: 5 } }, [{ src: 7 }, { src: 9 }]) === 7, 'foto escolhida que saiu do projeto volta para a primeira');
ok(C.fundo({ fundo: { tipo: 'foto' } }, [], true).tipo === 'cor', 'sem fotos, o fundo em foto vira branco');
const e = C.eixoGrad(210, 297, 90);
ok(Math.abs(e.x0 - 0) < 1e-9 && Math.abs(e.x1 - 210) < 1e-9 && Math.abs(e.y0 - 148.5) < 1e-9, 'degradê a 90°: da esquerda para a direita, como o CSS');
const e2 = C.eixoGrad(200, 100, 180);
ok(Math.abs(e2.y0 - 0) < 1e-9 && Math.abs(e2.y1 - 100) < 1e-9, 'degradê a 180°: de cima para baixo');
ok(C.blurMm(0) === 0 && C.clareia(0) === 0 && C.blurMm(100) > 0 && C.clareia(100) > 0 && C.clareia(100) < 1, 'suavizar 0 não altera a foto; 100 desfoca e clareia sem apagar');

console.log(falhas.length ? `\n✘ colagem: ${falhas.length} falha(s)` : '\n✔ colagem: sem falhas');
process.exit(falhas.length ? 1 : 0);
