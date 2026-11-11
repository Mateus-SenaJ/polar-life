/* Fotos e arquivos ficam somente no IndexedDB do aparelho (T5, BR-01, MT-06). */
(function(){
var DB='polar-life',VERS=3;
function abrirDB(){return new Promise(function(ok,no){var r=indexedDB.open(DB,VERS);r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains('fotos'))d.createObjectStore('fotos');if(!d.objectStoreNames.contains('arquivos'))d.createObjectStore('arquivos');if(!d.objectStoreNames.contains('fotosProjeto'))d.createObjectStore('fotosProjeto');if(!d.objectStoreNames.contains('projetos'))d.createObjectStore('projetos',{keyPath:'id'})};r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}})}
function tx(loja,modo,fn){return abrirDB().then(function(db){return new Promise(function(ok,no){var t=db.transaction(loja,modo),s=t.objectStore(loja),v;try{v=fn(s,t)}catch(e){db.close();no(e);return}t.oncomplete=function(){db.close();ok(v)};t.onerror=function(){db.close();no(t.error)}})})}
function pedido(r){return new Promise(function(ok,no){r.onsuccess=function(){ok(r.result||null)};r.onerror=function(){no(r.error)}})}
function dimensoes(file){if(!window.createImageBitmap)return Promise.reject(new Error('Imagem não suportada'));return createImageBitmap(file,{imageOrientation:'from-image'}).then(function(b){var r={w:b.width,h:b.height};b.close();return r})}
function meta(file){return /^image\/jpe?g$/i.test(file.type||'')&&window.PLEXIF?PLEXIF.ler(file):Promise.resolve({})}
function registro(file){return Promise.all([dimensoes(file),meta(file)]).then(function(r){return{blob:file,w:r[0].w,h:r[0].h,nome:file.name||'',meta:r[1]||{}}})}
function salvar(src,file,pid){return registro(file).then(function(v){return abrirDB().then(function(db){return new Promise(function(ok,no){ /* 44: decodifica uma vez; com projeto, grava também a cópia (mesma transação) */
  var t=db.transaction(pid?['fotos','fotosProjeto']:['fotos'],'readwrite');t.objectStore('fotos').put(v,Number(src));if(pid)t.objectStore('fotosProjeto').put(v,String(pid)+':'+Number(src));
  t.oncomplete=function(){db.close();if(window.PLPWA)PLPWA.persistir();ok({w:v.w,h:v.h,meta:v.meta})};t.onerror=function(){db.close();no(t.error)}})})})}
function salvarProjeto(id,src,file){return registro(file).then(function(v){return tx('fotosProjeto','readwrite',function(s){s.put(v,String(id)+':'+Number(src))}).then(function(){if(window.PLPWA)PLPWA.persistir();return{w:v.w,h:v.h,meta:v.meta}})})}
function ler(src){return tx('fotos','readonly',function(s){return pedido(s.get(Number(src)))})}
function todos(){return tx('fotos','readonly',function(s){return pedido(s.getAllKeys()).then(function(a){return a.map(Number)})})}
function limpar(){return tx('fotos','readwrite',function(s){s.clear()})}function limparArquivos(){return tx('arquivos','readwrite',function(s){s.clear()})}
function guardarArquivos(k,lista){return limparArquivos().then(function(){return tx('arquivos','readwrite',function(s){lista.forEach(function(a){s.put({bytes:a.bytes,tipo:a.tipo||'application/pdf',k:k},a.nome)})})})}
function lerArquivos(k){return tx('arquivos','readonly',function(s){var r=s.getAll(),q=s.getAllKeys();return new Promise(function(ok,no){var a=null,b=null;function fim(){if(a&&b)ok(a.map(function(v,i){v.nome=b[i];return v}).filter(function(v){return v.k===k}))}r.onsuccess=function(){a=r.result||[];fim()};q.onsuccess=function(){b=q.result||[];fim()};r.onerror=q.onerror=function(){no(r.error||q.error)}})})}
/* D-149: excluir uma foto apaga só a cópia dela (lojas fotos e fotosProjeto, chave do projeto atual) e devolve os registros, para o Desfazer. */
function removerFoto(src,pid){return abrirDB().then(function(db){return new Promise(function(ok,no){
  var t=db.transaction(pid?['fotos','fotosProjeto']:['fotos'],'readwrite'),a=t.objectStore('fotos'),r={fotos:null,proj:null},g=a.get(Number(src));
  g.onsuccess=function(){r.fotos=g.result||null;a.delete(Number(src))};
  if(pid){var b=t.objectStore('fotosProjeto'),k=String(pid)+':'+Number(src),g2=b.get(k);g2.onsuccess=function(){r.proj=g2.result||null;b.delete(k)}}
  t.oncomplete=function(){db.close();ok(r)};t.onerror=function(){db.close();no(t.error)}})})}
function restaurarFoto(src,pid,r){return abrirDB().then(function(db){return new Promise(function(ok,no){
  var t=db.transaction(pid?['fotos','fotosProjeto']:['fotos'],'readwrite');
  if(r&&r.fotos)t.objectStore('fotos').put(r.fotos,Number(src));
  if(pid&&r&&r.proj)t.objectStore('fotosProjeto').put(r.proj,String(pid)+':'+Number(src));
  t.oncomplete=function(){db.close();ok()};t.onerror=function(){db.close();no(t.error)}})})}
window.PLFOTOS={removerFoto:removerFoto,restaurarFoto:restaurarFoto,abrirDB:abrirDB,salvar:salvar,salvarProjeto:salvarProjeto,ler:ler,limpar:limpar,todos:todos,limparArquivos:limparArquivos,guardarArquivos:guardarArquivos,lerArquivos:lerArquivos};
})();
