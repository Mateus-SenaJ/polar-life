/* Fotos e arquivos ficam somente no IndexedDB do aparelho (T5, BR-01, MT-06). */
(function(){
var DB='polar-life',VERS=3;
function abrirDB(){return new Promise(function(ok,no){var r=indexedDB.open(DB,VERS);r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains('fotos'))d.createObjectStore('fotos');if(!d.objectStoreNames.contains('arquivos'))d.createObjectStore('arquivos');if(!d.objectStoreNames.contains('fotosProjeto'))d.createObjectStore('fotosProjeto');if(!d.objectStoreNames.contains('projetos'))d.createObjectStore('projetos',{keyPath:'id'})};r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}})}
function tx(loja,modo,fn){return abrirDB().then(function(db){return new Promise(function(ok,no){var t=db.transaction(loja,modo),s=t.objectStore(loja),v;try{v=fn(s,t)}catch(e){db.close();no(e);return}t.oncomplete=function(){db.close();ok(v)};t.onerror=function(){db.close();no(t.error)}})})}
function pedido(r){return new Promise(function(ok,no){r.onsuccess=function(){ok(r.result||null)};r.onerror=function(){no(r.error)}})}
/* D-210: no celular, decodificar a foto inteira (50 MP ou mais) para saber o tamanho estourava a memória e todas falhavam.
   Agora o tamanho vem do cabeçalho (JPEG, PNG, WebP), sem decodificar; a orientação do EXIF troca largura e altura (5 a 8).
   Só os outros formatos (HEIC no Safari, AVIF, TIFF) ainda passam pelo createImageBitmap. */
function cabecalho(file){return new Promise(function(ok){
  if(!file||!file.slice){ok(null);return}
  var r=new FileReader();r.onerror=function(){ok(null)};
  r.onload=function(){try{ok(medir(new Uint8Array(r.result)))}catch(e){ok(null)}};
  r.readAsArrayBuffer(file.slice(0,1024*1024))})}
function medir(a){
  if(a[0]===255&&a[1]===216){var p=2;
    while(p+9<a.length){if(a[p]!==255){p++;continue}var m=a[p+1];
      if(m===255){p++;continue}
      if(m===216||m===1||(m>=208&&m<=215)){p+=2;continue}
      var n=a[p+2]<<8|a[p+3];
      if(m>=192&&m<=207&&m!==196&&m!==200&&m!==204){var h=a[p+5]<<8|a[p+6],w=a[p+7]<<8|a[p+8];return w&&h?{w:w,h:h}:null}
      if(m===218||n<2)return null;p+=2+n}
    return null}
  if(a[0]===137&&a[1]===80&&a[2]===78&&a[3]===71){var dv=new DataView(a.buffer,a.byteOffset);return{w:dv.getUint32(16),h:dv.getUint32(20)}}
  if(a[0]===82&&a[1]===73&&a[2]===70&&a[3]===70&&a[8]===87&&a[9]===69&&a[10]===66&&a[11]===80){var t=String.fromCharCode(a[12],a[13],a[14],a[15]);
    if(t==='VP8 ')return{w:(a[26]|a[27]<<8)&16383,h:(a[28]|a[29]<<8)&16383};
    if(t==='VP8L'){var b=a[21]|a[22]<<8|a[23]<<16|a[24]<<24;return{w:(b&16383)+1,h:((b>>>14)&16383)+1}}
    if(t==='VP8X')return{w:1+(a[24]|a[25]<<8|a[26]<<16),h:1+(a[27]|a[28]<<8|a[29]<<16)}}
  return null}
function dimensoes(file,orient){return cabecalho(file).then(function(d){
  if(d){if(orient>=5&&orient<=8)d={w:d.h,h:d.w};return d}
  if(!window.createImageBitmap)return Promise.reject(new Error('Imagem não suportada'));
  return createImageBitmap(file,{imageOrientation:'from-image'}).then(function(b){var r={w:b.width,h:b.height};b.close();return r})})}
function meta(file){return /^image\/jpe?g$/i.test(file.type||'')&&window.PLEXIF?PLEXIF.ler(file):Promise.resolve({})}
function registro(file){return meta(file).then(function(mt){mt=mt||{};return dimensoes(file,mt.orientacao).then(function(d){return{blob:file,w:d.w,h:d.h,nome:file.name||'',meta:mt}})})}
function salvar(src,file,pid){delete LUGAR[Number(src)];return registro(file).then(function(v){return abrirDB().then(function(db){return new Promise(function(ok,no){ /* 44: decodifica uma vez; com projeto, grava também a cópia (mesma transação) */
  var t=db.transaction(pid?['fotos','fotosProjeto']:['fotos'],'readwrite');t.objectStore('fotos').put(v,Number(src));if(pid)t.objectStore('fotosProjeto').put(v,String(pid)+':'+Number(src));
  t.oncomplete=function(){db.close();if(window.PLPWA)PLPWA.persistir();ok({w:v.w,h:v.h,meta:v.meta})};t.onerror=function(){db.close();no(t.error)}})})})}
function salvarProjeto(id,src,file){return registro(file).then(function(v){return tx('fotosProjeto','readwrite',function(s){s.put(v,String(id)+':'+Number(src))}).then(function(){if(window.PLPWA)PLPWA.persistir();return{w:v.w,h:v.h,meta:v.meta}})})}
function ler(src){return tx('fotos','readonly',function(s){return pedido(s.get(Number(src)))})}
function todos(){return tx('fotos','readonly',function(s){return pedido(s.getAllKeys()).then(function(a){return a.map(Number)})})}
function limpar(){LUGAR={};return tx('fotos','readwrite',function(s){s.clear()})}function limparArquivos(){return tx('arquivos','readwrite',function(s){s.clear()})}
function guardarArquivos(k,lista){return limparArquivos().then(function(){return tx('arquivos','readwrite',function(s){lista.forEach(function(a){s.put({bytes:a.bytes,tipo:a.tipo||'application/pdf',k:k},a.nome)})})})}
function lerArquivos(k){return tx('arquivos','readonly',function(s){var r=s.getAll(),q=s.getAllKeys();return new Promise(function(ok,no){var a=null,b=null;function fim(){if(a&&b)ok(a.map(function(v,i){v.nome=b[i];return v}).filter(function(v){return v.k===k}))}r.onsuccess=function(){a=r.result||[];fim()};q.onsuccess=function(){b=q.result||[];fim()};r.onerror=q.onerror=function(){no(r.error||q.error)}})})}
/* D-149: excluir uma foto apaga só a cópia dela (lojas fotos e fotosProjeto, chave do projeto atual) e devolve os registros, para o Desfazer. */
function removerFoto(src,pid){delete LUGAR[Number(src)];return abrirDB().then(function(db){return new Promise(function(ok,no){
  var t=db.transaction(pid?['fotos','fotosProjeto']:['fotos'],'readwrite'),a=t.objectStore('fotos'),r={fotos:null,proj:null},g=a.get(Number(src));
  g.onsuccess=function(){r.fotos=g.result||null;a.delete(Number(src))};
  if(pid){var b=t.objectStore('fotosProjeto'),k=String(pid)+':'+Number(src),g2=b.get(k);g2.onsuccess=function(){r.proj=g2.result||null;b.delete(k)}}
  t.oncomplete=function(){db.close();ok(r)};t.onerror=function(){db.close();no(t.error)}})})}
function restaurarFoto(src,pid,r){delete LUGAR[Number(src)];return abrirDB().then(function(db){return new Promise(function(ok,no){
  var t=db.transaction(pid?['fotos','fotosProjeto']:['fotos'],'readwrite');
  if(r&&r.fotos)t.objectStore('fotos').put(r.fotos,Number(src));
  if(pid&&r&&r.proj)t.objectStore('fotosProjeto').put(r.proj,String(pid)+':'+Number(src));
  t.oncomplete=function(){db.close();ok()};t.onerror=function(){db.close();no(t.error)}})})}
/* D-178: lugar da foto (cidade, UF, país e o ponto turístico mais próximo, até 2 km) a partir do GPS do EXIF. Calculado uma vez
   no aparelho (PLLOCAIS, arquivos do próprio site) e guardado no registro da foto e na cópia do projeto: o Quadro, as Folhas e
   o PDF leem o mesmo valor, sem depender de qual tela abriu primeiro. As coordenadas continuam só no registro local (D-139). */
var LUGAR={};
function gravarLugar(k,L){var pid=window.PLPROJETOS&&PLPROJETOS.atual?PLPROJETOS.atual():'';
  return abrirDB().then(function(db){return new Promise(function(ok,no){
    var t=db.transaction(pid?['fotos','fotosProjeto']:['fotos'],'readwrite');
    function marca(s,chave){var g=s.get(chave);g.onsuccess=function(){var v=g.result;if(v&&v.meta&&!v.meta.lugar){v.meta.lugar=L;s.put(v,chave)}}}
    marca(t.objectStore('fotos'),k);if(pid)marca(t.objectStore('fotosProjeto'),String(pid)+':'+k);
    t.oncomplete=function(){db.close();ok()};t.onerror=function(){db.close();no(t.error)}})})}
function lugar(src){
  var k=Number(src);if(LUGAR[k])return LUGAR[k];
  var p=ler(k).then(function(r){
    var m=r&&r.meta;if(!m)return null;
    if(m.lugar)return m.lugar;
    if(m.lat==null||m.lon==null||!window.PLLOCAIS)return null;
    return PLLOCAIS.deCoordenadas(m.lat,m.lon).then(function(g){
      if(!g||!(g.cidade||g.pais))return null;      /* sem os dados do site (offline): tenta de novo na próxima vez */
      return(g.uf?PLLOCAIS.pontosProximos(m.lat,m.lon,g.uf,2):Promise.resolve([])).then(function(pt){
        var L={cidade:g.cidade||'',uf:g.uf||'',pais:g.pais||'',ponto:pt&&pt.length?pt[0].nome:''};
        return gravarLugar(k,L).then(function(){return L},function(){return L})})})
  }).catch(function(){return null});
  LUGAR[k]=p;p.then(function(v){if(!v&&LUGAR[k]===p)delete LUGAR[k]});
  return p
}
function esquecerLugar(src){if(src==null)LUGAR={};else delete LUGAR[Number(src)]}
window.PLFOTOS={medir:medir,lugar:lugar,esquecerLugar:esquecerLugar,removerFoto:removerFoto,restaurarFoto:restaurarFoto,abrirDB:abrirDB,salvar:salvar,salvarProjeto:salvarProjeto,ler:ler,limpar:limpar,todos:todos,limparArquivos:limparArquivos,guardarArquivos:guardarArquivos,lerArquivos:lerArquivos};
})();
