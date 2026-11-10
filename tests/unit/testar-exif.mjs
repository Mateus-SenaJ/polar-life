import assert from 'node:assert/strict';
import fs from 'node:fs'; import vm from 'node:vm';
const code=fs.readFileSync('site/assets/js/nucleo/exif.js','utf8');let P;
class FR { readAsArrayBuffer(f){this.result=f.bytes.buffer.slice(f.bytes.byteOffset,f.bytes.byteOffset+f.bytes.byteLength);this.onload()} }
vm.runInNewContext(code,{window:{},FileReader:FR},{filename:'exif.js'});P=vm.runInNewContext('window.PLEXIF',{window:{}});
// Recarrega mantendo a janela do módulo.
const box={};vm.runInNewContext(code,{window:box,FileReader:FR});P=box.PLEXIF;
function jpeg(le){let b=new Uint8Array(140),d=10,w16=(o,v)=>{b[o]=le?v&255:v>>8;b[o+1]=le?v>>8:v&255},w32=(o,v)=>{for(let i=0;i<4;i++)b[o+i]=le?(v>>>(8*i))&255:(v>>>(8*(3-i)))&255};b.set([255,216,255,225,0,136,69,120,105,102,0,0],0);b.set(le?[73,73]:[77,77],12);w16(14,42);w32(16,8);w16(20,3);w16(22,0x0112);w16(24,3);w32(26,1);w16(30,6);w16(34,0x8769);w16(36,4);w32(38,1);w32(42,50);w16(46,0x8825);w16(48,4);w32(50,1);w32(54,90);w32(58,0);w16(62,1);w16(64,0x9003);w16(66,2);w32(68,20);w32(72,70);w32(76,0);b.set([...Buffer.from('2026:07:14 08:05:00\0')],82);return b}
for(const le of [true,false]){const x=await P.ler({slice(){return {bytes:jpeg(le)}}});assert.deepEqual(JSON.parse(JSON.stringify(x)),{orientacao:6,temGps:true,iso:'2026-07-14T08:05:00'})}
assert.deepEqual(JSON.parse(JSON.stringify(await P.ler({slice(){return {bytes:new Uint8Array([255,216,255,217])}}}))),{});
console.log('✔ EXIF: data, orientação e presença de GPS');
