/* Fotos e arquivos ficam somente no IndexedDB do aparelho (T5, BR-01, MT-06). */
(function(){
var DB='polar-life',VERS=2;
function abrir(){return new Promise(function(ok,no){
  var r=indexedDB.open(DB,VERS);
  r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains('fotos'))d.createObjectStore('fotos');if(!d.objectStoreNames.contains('arquivos'))d.createObjectStore('arquivos')};
  r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}
})}
function tx(loja,modo,fn){return abrir().then(function(db){return new Promise(function(ok,no){var t=db.transaction(loja,modo),s=t.objectStore(loja),v;try{v=fn(s)}catch(e){db.close();no(e);return}t.oncomplete=function(){db.close();ok(v)};t.onerror=function(){db.close();no(t.error)}})})}
function dimensoes(file){
  if(!window.createImageBitmap)return Promise.reject(new Error('Imagem não suportada'));
  return createImageBitmap(file,{imageOrientation:'from-image'}).then(function(b){var r={w:b.width,h:b.height};b.close();return r})
}
function salvar(src,file){return dimensoes(file).then(function(d){return tx('fotos','readwrite',function(s){s.put({blob:file,w:d.w,h:d.h,nome:file.name||''},Number(src))}).then(function(){return d})})}
function ler(src){return tx('fotos','readonly',function(s){var r=s.get(Number(src));r.onsuccess=function(){return r.result};return new Promise(function(ok,no){r.onsuccess=function(){ok(r.result||null)};r.onerror=function(){no(r.error)}})})}
function todos(){return tx('fotos','readonly',function(s){var r=s.getAllKeys();return new Promise(function(ok,no){r.onsuccess=function(){ok(r.result.map(Number))};r.onerror=function(){no(r.error)}})})}
function limpar(){return tx('fotos','readwrite',function(s){s.clear()})}
function limparArquivos(){return tx('arquivos','readwrite',function(s){s.clear()})}
function guardarArquivos(k,lista){return limparArquivos().then(function(){return tx('arquivos','readwrite',function(s){lista.forEach(function(a){s.put({bytes:a.bytes,tipo:a.tipo||'application/pdf',k:k},a.nome)})})})}
function lerArquivos(k){return tx('arquivos','readonly',function(s){var r=s.getAll(),q=s.getAllKeys();return new Promise(function(ok,no){var a=null,b=null;function fim(){if(a&&b)ok(a.map(function(v,i){v.nome=b[i];return v}).filter(function(v){return v.k===k}))}r.onsuccess=function(){a=r.result||[];fim()};q.onsuccess=function(){b=q.result||[];fim()};r.onerror=q.onerror=function(){no(r.error||q.error)}})})}
window.PLFOTOS={salvar:salvar,ler:ler,limpar:limpar,todos:todos,limparArquivos:limparArquivos,guardarArquivos:guardarArquivos,lerArquivos:lerArquivos};
})();
