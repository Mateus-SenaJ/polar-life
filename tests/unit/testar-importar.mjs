/* D-132 · importar.js sem navegador: maior prévia do RAW, .zip pelo diretório central (tamanhos locais zerados,
   como nos .zip do Windows e do macOS), deflate, arquivos do sistema ignorados e falha isolada por arquivo. */
import { readFileSync } from 'node:fs';
import { deflateRawSync, crc32 } from 'node:zlib';
import vm from 'node:vm';

const src = readFileSync(new URL('../../site/assets/js/nucleo/importar.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(src, { window, TextDecoder, File, Blob, Response, DecompressionStream, Promise, Uint8Array, ArrayBuffer, navigator: { userAgent: 'node' } }); // mesmo realm dos Blob/File do Node
const I = window.PLIMPORTAR;
let falhas = 0; const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) falhas++; };

/* JPEG mínimo: SOI, APPn opcional, SOS e dados entropia de n bytes, EOI */
function jpeg(n, app = []) {
  const corpo = new Array(n).fill(0x11);
  return [0xFF, 0xD8, ...app, 0xFF, 0xDA, 0x00, 0x08, 1, 2, 3, 4, 5, 6, ...corpo, 0xFF, 0xD9];
}
const mini = jpeg(40);
const appComMini = (() => { const conteudo = [0x45, 0x78, 0x69, 0x66, 0, 0, ...jpeg(30)]; const len = conteudo.length + 2; return [0xFF, 0xE1, len >> 8, len & 255, ...conteudo]; })();
const grande = jpeg(5000, appComMini);
const rawBytes = new Uint8Array([...new Array(300).fill(7), ...mini, ...new Array(200).fill(9), ...grande, ...new Array(100).fill(3)]);
const p = I.previa(rawBytes);
ok(p && p.length === grande.length, `RAW: usa a maior prévia (${p && p.length} bytes, esperado ${grande.length}), pulando a miniatura dentro do APP1`);
const rawFile = new File([rawBytes], 'IMG_0001.CR2');
const jr = await I.raw(rawFile);
ok(jr.name === 'IMG_0001.jpg' && jr.type === 'image/jpeg' && jr.size === grande.length, 'RAW vira IMG_0001.jpg com a prévia');

/* .zip com bit 3 (tamanhos no descritor): o cabeçalho local diz 0 */
function zipar(itens) {
  const partes = [], central = []; let off = 0;
  const le16 = v => [v & 255, v >> 8 & 255], le32 = v => [v & 255, v >> 8 & 255, v >> 16 & 255, v >>> 24 & 255];
  for (const it of itens) {
    const nome = [...Buffer.from(it.nome)], dados = it.metodo === 8 ? [...deflateRawSync(Buffer.from(it.bytes))] : it.bytes;
    const crc = crc32(Buffer.from(it.bytes));
    const local = [...le32(0x04034b50), ...le16(20), ...le16(8), ...le16(it.metodo), 0, 0, 0, 0, ...le32(0), ...le32(0), ...le32(0), ...le16(nome.length), ...le16(0), ...nome, ...dados,
      ...le32(0x08074b50), ...le32(crc), ...le32(dados.length), ...le32(it.bytes.length)];
    central.push([...le32(0x02014b50), ...le16(20), ...le16(20), ...le16(8), ...le16(it.metodo), 0, 0, 0, 0, ...le32(crc), ...le32(dados.length), ...le32(it.bytes.length),
      ...le16(nome.length), ...le16(0), ...le16(0), ...le16(0), ...le16(0), ...le32(0), ...le32(off), ...nome]);
    partes.push(...local); off += local.length;
  }
  const cd = central.flat();
  return new Uint8Array([...partes, ...cd, ...le32(0x06054b50), 0, 0, 0, 0, ...le16(itens.length), ...le16(itens.length), ...le32(cd.length), ...le32(off), 0, 0]);
}
const fotoA = jpeg(100), fotoB = jpeg(3000);
const z = zipar([
  { nome: 'viagem/praia.jpg', metodo: 0, bytes: fotoA },
  { nome: 'viagem/serra.jpg', metodo: 8, bytes: fotoB },
  { nome: 'leia-me.txt', metodo: 0, bytes: [...Buffer.from('oi')] },
  { nome: '__MACOSX/viagem/._praia.jpg', metodo: 0, bytes: [1, 2, 3] },
  { nome: 'camera/DSC_9.NEF', metodo: 0, bytes: [...rawBytes] },
]);
const r = await I.zip(new File([z], 'fotos.zip'));
const nomes = r.arquivos.map(f => f.name).sort().join(',');
ok(nomes === 'DSC_9.jpg,praia.jpg,serra.jpg', '.zip: 3 fotos (o RAW dentro vira JPEG), sem .txt nem __MACOSX → ' + nomes);
const serra = r.arquivos.find(f => f.name === 'serra.jpg');
ok(serra && serra.size === fotoB.length && serra.type === 'image/jpeg', '.zip: «deflate» descomprimido com o tamanho certo');
ok(r.erros.length === 0, '.zip: sem erros' + (r.erros.length ? ' — ' + r.erros.join(' | ') : ''));

/* lote: um HEIC (sem decodificador aqui) e um arquivo inválido não derrubam os outros */
const lote = await I.expandir([new File([z], 'fotos.zip'), new File([1, 2, 3], 'casa.heic'), new File([9], 'quebrado.zip'), new File(fotoA, 'solta.jpg')]);
ok(lote.arquivos.length === 4, 'lote: as 4 fotos boas seguem (' + lote.arquivos.length + ')');
ok(lote.erros.length === 2 && /HEIC/.test(lote.erros.join(' ')) && /quebrado\.zip/.test(lote.erros.join(' ')), 'lote: HEIC e .zip inválido viram aviso, um por arquivo');

console.log(falhas ? `\n✘ importar: ${falhas} falha(s)` : '\n✔ importar: sem falhas');
process.exit(falhas ? 1 : 0);
