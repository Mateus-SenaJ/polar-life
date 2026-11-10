#!/usr/bin/env node
/* D-135/D-136 · PLTEXTO sem navegador: alinhamento (alinharX), assinatura (assinaturaPos)
   e migração dos dados antigos (migrar, idempotente). Uso: node tests/unit/testar-legenda-migracao.mjs */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../../site/assets/js/nucleo/legenda-texto.js', import.meta.url), 'utf8');
const janela = {};
vm.runInNewContext(src, { window: janela });
const T = janela.PLTEXTO;

let falhas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) falhas++; };
const copia = o => JSON.parse(JSON.stringify(o));

console.log('Alinhamento (alinharX · MT-02):');
ok(!!T.alinharX, 'PLTEXTO.alinharX existe');
ok(T.alinharX('centro', 6, 76, 20) === 34, 'alinharX(centro, 6, 76, 20) = 34');
ok(T.alinharX('esq', 6, 76, 20) === 6, 'alinharX(esq) = L');
ok(T.alinharX('dir', 6, 76, 20) === 62, 'alinharX(dir) = L + JW − w');
ok(T.alinharX('dir', 6, 76, 999) === 6, 'alinharX nunca passa da borda direita da janela');
ok(T.alinharX('esq', 3, 60, 20) === 3, 'alinharX do Pocket usa a margem lateral de 3 mm');

console.log('Migração (migrar · D-135/D-136):');
const m1 = T.migrar({ pos: 'acima', dx: 3 });
ok(m1.al === 'dir' && !('pos' in m1) && !('dx' in m1), 'migrar({pos:acima, dx:3}) → al:dir, sem pos nem dx');
const m2 = T.migrar({ limpa: true });
ok(m2.original === true && !('limpa' in m2), 'migrar({limpa:true}) → original:true, sem limpa');
const m3 = T.migrar({ limpa: false });
ok(m3.original === false && !('limpa' in m3), 'migrar({limpa:false}) → original:false');
const m4 = T.migrar({ pos: 'ambas' });
ok(m4.al === 'esq' && !('pos' in m4), 'migrar({pos:ambas}) → al:esq (o texto sempre fica abaixo)');
const m5 = T.migrar({ dx: -3 });
ok(m5.al === 'esq' && !('dx' in m5), 'migrar({dx:-3}) → al:esq');
const m6 = T.migrar({ al: 'centro' });
ok(m6.al === 'centro', 'migrar mantém o alinhamento já salvo');
const m7 = T.migrar({ al: 'lixo' });
ok(m7.al === 'esq', 'migrar de um alinhamento inválido volta para esq');
ok(T.migrar({}) !== null && T.migrar({}).al === 'esq', 'migrar({}) deixa o alinhamento em esq');
ok(T.migrar(null) === null && T.migrar(undefined) === undefined, 'migrar não quebra com dados vazios');
const antes = copia(m1);
T.migrar(m1);
ok(JSON.stringify(m1) === JSON.stringify(antes), 'migrar é idempotente (chamar de novo não muda nada)');
const antes2 = copia(m2);
T.migrar(m2);
ok(JSON.stringify(m2) === JSON.stringify(antes2), 'migrar é idempotente com limpa → original');

console.log('Assinatura (assinaturaPos · D-129/D-136):');
const frPocket = { w: 66, h: 99, jw: 60, jh: 79, lado: 3, topo: 3 };
ok(T.assinaturaPos({ al: 'esq', assin: 'auto' }, frPocket) === 'dir', 'texto à esquerda → assinatura à direita');
ok(T.assinaturaPos({ al: 'dir', assin: 'auto' }, frPocket) === 'esq', 'texto à direita → assinatura à esquerda');
ok(T.assinaturaPos({ al: 'esq', assin: 'dir' }, frPocket) === 'dir', 'posição fixa da assinatura vale');
ok(T.assinaturaPos(null, frPocket) === 'dir', 'sem legenda a assinatura vai para a direita');
ok(T.assinaturaDir({ al: 'esq', assin: 'auto' }, frPocket) === true, 'assinaturaDir continua como atalho');

console.log(falhas ? `\n✘ legenda-migracao: ${falhas} falha(s)` : '\n✔ legenda-migracao: sem falhas');
process.exit(falhas ? 1 : 0);
