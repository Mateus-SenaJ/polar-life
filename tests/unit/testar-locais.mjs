/* PLLOCAIS (D-139): busca com acentos, homônimos, coordenadas → cidade/UF/país, pontos próximos. Dados lidos do disco. */
import assert from 'node:assert/strict';
import fs from 'node:fs'; import vm from 'node:vm';
const DIR = 'site/assets/dados/locais/';
const box = {};
vm.runInNewContext(fs.readFileSync('site/assets/js/nucleo/locais.js', 'utf8'), { window: box, document: { currentScript: null }, fetch: () => Promise.reject(new Error('sem rede')) }, { filename: 'locais.js' });
const L = box.PLLOCAIS;
const J = o => JSON.parse(JSON.stringify(o));   /* objetos do vm são de outro realm */
L.config.ler = async n => JSON.parse(fs.readFileSync(DIR + n, 'utf8'));

assert.equal(L.norm('São Paulo'), 'sao paulo');
assert.equal(L.rotulo({ cidade: 'Itacaré', uf: 'BA' }), 'Itacaré - BA');

let r = await L.buscar('itacare');
assert.ok(r.some(x => x.cidade === 'Itacaré' && x.uf === 'BA'), 'busca sem acento acha Itacaré - BA');
r = await L.buscar('SAO PAULO');
assert.equal(r[0].cidade, 'São Paulo'); assert.equal(r[0].uf, 'SP');
r = await L.buscar('Bom Jesus');
const bj = r.filter(x => x.cidade === 'Bom Jesus'); assert.ok(bj.length >= 4, 'homônimos «Bom Jesus»: ' + bj.length);
assert.equal(new Set(bj.map(x => x.uf)).size, bj.length, 'um por UF');
r = await L.buscar('Bom Jesus - RS'); assert.deepEqual(J(r[0]), { cidade: 'Bom Jesus', uf: 'RS' });
assert.deepEqual(J(await L.buscar('x')), [], 'menos de 2 letras não busca');
assert.deepEqual(J(await L.buscar('zzzzqq')), []);

const sal = await L.deCoordenadas(-12.9714, -38.5014); assert.deepEqual(J(sal), { cidade: 'Salvador', uf: 'BA', pais: 'Brasil' });
const ita = await L.deCoordenadas(-14.2778, -38.9969); assert.equal(ita.cidade, 'Itacaré'); assert.equal(ita.uf, 'BA');
const rec = await L.deCoordenadas(-8.0476, -34.877); assert.equal(rec.cidade, 'Recife'); assert.equal(rec.uf, 'PE');
const itp = await L.deCoordenadas(-12.955, -38.36); assert.deepEqual(J(itp), { cidade: 'Salvador', uf: 'BA', pais: 'Brasil' }, 'Itapuã é Salvador (polígono, não centroide)');
const itp2 = await L.deCoordenadas(-12.9535, -38.3635); assert.equal(itp2.cidade, 'Salvador');
const pet = await L.deCoordenadas(-9.3891, -40.5027); assert.equal(pet.cidade, 'Petrolina'); assert.equal(pet.uf, 'PE');   /* divisa PE/BA */
const jua = await L.deCoordenadas(-9.4163, -40.5025); assert.equal(jua.cidade, 'Juazeiro'); assert.equal(jua.uf, 'BA');
const udi = await L.deCoordenadas(-18.9186, -48.2772); assert.equal(udi.cidade, 'Uberlândia'); assert.equal(udi.uf, 'MG');   /* interior */
const lis = await L.deCoordenadas(38.7223, -9.1393); assert.equal(lis.cidade, ''); assert.equal(lis.uf, ''); assert.equal(lis.pais, 'Portugal');
const ba = await L.deCoordenadas(-34.6037, -58.3816); assert.equal(ba.cidade, ''); assert.equal(ba.pais, 'Argentina');
assert.equal(await L.deCoordenadas('a', 1), null);

const p = await L.pontosProximos(-12.9535, -38.3635, 'BA', 2);
assert.ok(p.length >= 1 && /Itapuã/.test(p[0].nome), 'ponto próximo: ' + (p[0] && p[0].nome));
assert.equal(p[0].nome, 'Praia de Itapuã'); assert.equal(p[0].municipio, 'Salvador');
for (const n of ['Farol da Barra', 'Pelourinho']) assert.ok((await L.pontosProximos(-12.97, -38.51, 'BA', 30)).some(x => x.nome === n), n + ' em BA');
for (const [n, uf] of [['Praia do Forte', 'BA'], ['Cristo Redentor', 'RJ'], ['Copacabana', 'RJ'], ['Boa Viagem', 'PE'], ['Lençóis Maranhenses', 'MA'], ['Jalapão', 'TO']]) {
  const lst = JSON.parse(fs.readFileSync(DIR + 'pontos-' + uf + '.json', 'utf8'));
  assert.ok(lst.some(x => x[0].indexOf(n) >= 0), n + ' em ' + uf);
}
for (const uf of ['AC', 'TO']) assert.ok(JSON.parse(fs.readFileSync(DIR + 'pontos-' + uf + '.json', 'utf8')).length >= 3, uf + ' não fica vazio');
assert.ok(p.every((x, i) => i === 0 || p[i - 1].km <= x.km), 'ordenado por distância');
assert.deepEqual(J(await L.pontosProximos(-23, -46, 'SP', 0.01)), [], 'raio pequeno sem pontos');
assert.deepEqual(J(await L.pontosProximos(0, 0, '', 2)), []);

const tam = f => fs.statSync(DIR + f).size;
assert.ok(tam('municipios.json') < 200 * 1024, 'municípios < 200 KB (' + tam('municipios.json') + ')');
assert.ok(tam('paises.json') < 150 * 1024);
const mal = fs.readdirSync(DIR).filter(f => /^malha-/.test(f)), totMal = mal.reduce((s, f) => s + tam(f), 0);
assert.equal(mal.length, 27); assert.ok(totMal < 3 * 1024 * 1024, 'malhas < 3 MB (' + totMal + ')');
assert.ok(mal.every(f => tam(f) < 300 * 1024), 'cada malha < 300 KB');
assert.ok(fs.readdirSync(DIR).filter(f => /^pontos-/.test(f)).every(f => tam(f) < 40 * 1024), 'cada pontos-UF < 40 KB');
console.log('✔ PLLOCAIS: busca, homônimos, coordenadas, país e pontos próximos');
