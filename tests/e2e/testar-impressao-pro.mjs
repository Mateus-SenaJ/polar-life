/* D-174: «Impressão profissional · cores fiéis». Uma foto com perfil Display P3 (como as do iPhone) e outra sem perfil:
   no PDF profissional, a P3 vai como o JPEG original com o PRÓPRIO perfil (ICCBased), a outra com sRGB, e o documento
   declara sRGB como condição de saída (OutputIntent), «tamanho real» e papel pelo tamanho da página; sem EXIF.
   O PDF comum (Pro) continua como era (sem OutputIntent). Perfis: Compact-ICC-Profiles (CC0). */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { PDFDocument, PDFName, PDFRawStream, PDFArray } from 'pdf-lib';
import { servir } from '../helpers/servidor.mjs';

let falhas = 0;
const ok = (m) => console.log('  ✔ ' + m);
const ruim = (m) => { falhas++; console.log('  ✘ ' + m); };
const P3 = await readFile(new URL('../fixtures/displayp3-v4.icc', import.meta.url));
const JPG = await readFile(new URL('../../site/assets/img/fotos/praia.jpg', import.meta.url));
/* JPEG com perfil P3 (APP2 «ICC_PROFILE», 1 de 1) e um comentário com «GPSsegredo» para conferir a limpeza */
function semApp2(jpg) {   /* tira um perfil que a foto já tenha, para ela ficar só com o P3 */
  const out = [jpg.subarray(0, 2)]; let p = 2;
  while (p + 4 <= jpg.length) { const m = jpg[p + 1], n = jpg.readUInt16BE(p + 2); if (m === 0xda) { out.push(jpg.subarray(p)); break; } if (m !== 0xe2) out.push(jpg.subarray(p, p + 2 + n)); p += 2 + n; }
  return Buffer.concat(out);
}
function comPerfil(jpg, icc) {
  jpg = semApp2(jpg);
  const cab = Buffer.from('ICC_PROFILE\0', 'latin1'), seg = Buffer.concat([Buffer.from([0xff, 0xe2]), Buffer.alloc(2), cab, Buffer.from([1, 1]), icc]);
  seg.writeUInt16BE(seg.length - 2, 2);
  const txt = Buffer.from('GPSsegredo', 'latin1'), ex = Buffer.concat([Buffer.from([0xff, 0xfe, 0, txt.length + 2]), txt]);   /* comentário JPEG: também tem de sumir */
  return Buffer.concat([jpg.subarray(0, 2), ex, seg, jpg.subarray(2)]);
}
const fotoP3 = comPerfil(JPG, P3);
const srv = await servir();
const nav = await chromium.launch();
const SCRIPTS = ['assets/vendor/pdf-lib.min.js', 'assets/vendor/fontkit.umd.min.js', 'assets/js/nucleo/legenda-texto.js', 'assets/js/nucleo/icc.js', 'assets/js/nucleo/gerador.js'];

async function ler(b64) {
  const bytes = Buffer.from(b64, 'base64'), doc = await PDFDocument.load(bytes);
  const oi = doc.catalog.lookup(PDFName.of('OutputIntents'));
  const vp = doc.catalog.lookup(PDFName.of('ViewerPreferences'));
  const imgs = [];
  for (const [, o] of doc.context.enumerateIndirectObjects()) {
    if (!(o instanceof PDFRawStream) || String(o.dict.get(PDFName.of('Subtype'))) !== '/Image') continue;
    const cs = o.dict.lookup(PDFName.of('ColorSpace')); let icc = null;
    if (cs instanceof PDFArray && String(cs.get(0)) === '/ICCBased') { const s = cs.lookup(1); icc = String(s.dict.get(PDFName.of('Filter'))) === '/FlateDecode' ? inflateSync(Buffer.from(s.contents)) : Buffer.from(s.contents); }
    imgs.push({ w: +String(o.dict.get(PDFName.of('Width'))), cs: cs instanceof PDFArray ? String(cs.get(0)) : String(cs), icc });
  }
  return { bytes, oi, vp, imgs, s: oi ? String(oi.lookup(0).get(PDFName.of('S'))) : '' };
}
try {
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem('pl-conta', JSON.stringify({ email: 'pro@polarlife.test', entrouEm: Date.now() })));
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(srv.url + 'app/adicionar-fotos/');
  const nat = await p.evaluate(async ({ a, b }) => {
    localStorage.removeItem('pl-projeto-atual');
    const u = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    const pr = await PLPROJETOS.criar('Impressão profissional');
    const r1 = await PLFOTOS.salvar(1, new File([u(a)], 'p3.jpg', { type: 'image/jpeg' }), pr.id);
    await PLFOTOS.salvar(2, new File([u(b)], 'srgb.jpg', { type: 'image/jpeg' }), pr.id);
    sessionStorage.setItem('pl-fotos', '[1,2]'); await PLPROJETOS.salvarEstado();
    return { w: r1.w, h: r1.h };
  }, { a: fotoP3.toString('base64'), b: JPG.toString('base64') });
  await p.goto(srv.url + 'app/editor/', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.querySelectorAll('#sheet .pol').length > 0);
  for (const s of SCRIPTS) await p.addScriptTag({ url: srv.url + s });
  const gerar = (f) => p.evaluate(async (f) => {
    const b64 = (u8) => { let s = '', c = 0x8000; for (let i = 0; i < u8.length; i += c) s += String.fromCharCode.apply(null, u8.subarray(i, i + c)); return btoa(s); };
    const r = await PLGERADOR.pdf(PLGERADOR.projeto(), { f });
    return { b64: b64(r.arquivos[0].bytes), q: r.qualidade };
  }, f);
  const g = await ler((await gerar('grafica')).b64);
  g.oi && g.s === '/GTS_PDFX' ? ok('PDF profissional declara sRGB como condição de saída (OutputIntent)') : ruim('sem OutputIntent: ' + g.s);
  g.vp && String(g.vp.get(PDFName.of('PrintScaling'))) === '/None' ? ok('marcado para imprimir em tamanho real (sem «ajustar à página»)') : ruim('ViewerPreferences ausente');
  const comP3 = g.imgs.find((i) => i.icc && i.icc.length === P3.length && i.icc.equals(P3));
  const comSrgb = g.imgs.find((i) => i.icc && !i.icc.equals(P3));
  comP3 ? ok('a foto Display P3 leva o próprio perfil de cor (não é convertida)') : ruim('perfil P3 não foi embutido: ' + JSON.stringify(g.imgs.map((i) => [i.cs, i.icc && i.icc.length])));
  comSrgb ? ok('a foto sem perfil leva sRGB explícito') : ruim('foto sem perfil não ganhou sRGB');
  const cores = g.imgs.filter((i) => i.cs !== '/DeviceGray');   /* máscaras de transparência (SMask) são sempre cinza */
  cores.every((i) => i.cs === '/ICCBased') ? ok(`todas as ${cores.length} imagens coloridas com perfil de cor (nenhuma «DeviceRGB» solta)`) : ruim('imagem sem perfil: ' + g.imgs.map((i) => i.cs).join(','));
  comP3 && comP3.w === nat.w ? ok(`foto P3 em resolução total (${comP3.w} px de largura, original)`) : ruim('resolução da P3: ' + (comP3 && comP3.w) + ' vs ' + nat.w);
  !g.bytes.includes(Buffer.from('GPSsegredo')) && !g.bytes.includes(Buffer.from('Exif\0')) ? ok('sem EXIF nem GPS no arquivo') : ruim('EXIF vazou no PDF');
  const c = await ler((await gerar('pdf')).b64);
  !c.oi && c.imgs.every((i) => i.cs === '/DeviceRGB' || i.cs === '/DeviceGray') ? ok('o PDF comum continua como era (sem OutputIntent, sRGB implícito)') : ruim('PDF comum mudou: ' + JSON.stringify({ oi: !!c.oi, cs: c.imgs.map((i) => i.cs) }));
  erros.length === 0 ? ok('nenhum erro de página') : ruim('erros: ' + erros.join(' | '));

  /* tela de exportar: a opção existe, mostra o roteiro de impressão e leva até o botão de gerar */
  await p.evaluate(() => { const k = (() => { let s = (sessionStorage.getItem('pl-quadro') || '') + '|' + (sessionStorage.getItem('pl-folhas') || ''); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); })(); sessionStorage.setItem('pl-prevoo', JSON.stringify({ ok: true, k, n: 1, fotos: 2, papel: 'A4', orient: 'retrato', w: 210, h: 297 })); });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(srv.url + 'app/editor/exportar/', { waitUntil: 'networkidle' });
  const antes = await p.evaluate(() => { const r = document.getElementById('go').getBoundingClientRect(); return r.top > innerHeight; });
  await p.click('label.fmt:has(input[value=grafica])');
  await p.waitForTimeout(1200);
  const depois = await p.evaluate(() => { const r = document.getElementById('go').getBoundingClientRect(); return { visivel: r.top >= 0 && r.bottom <= innerHeight, rot: document.getElementById('go-t').textContent, aviso: !document.getElementById('aviso-pro').hidden, a100: document.getElementById('aviso-100').hidden }; });
  antes && depois.visivel ? ok('ao tocar na qualidade, a tela desce até «Gerar»') : ruim('não desceu até o botão: ' + JSON.stringify({ antes, depois }));
  /profissional/.test(depois.rot) && depois.aviso && depois.a100 ? ok('«Gerar PDF profissional» com o roteiro de impressão (papel, perfil, 100%, quem gerencia as cores)') : ruim('tela: ' + JSON.stringify(depois));
  await ctx.close();
} catch (e) { ruim('exceção: ' + e.message); }
await nav.close(); srv.close?.();
console.log(falhas ? `\n✘ impressão profissional: ${falhas} falha(s)` : '\n✔ impressão profissional: sem falhas');
process.exit(falhas ? 1 : 0);
