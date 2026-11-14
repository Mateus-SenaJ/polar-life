/* Importação de arquivos compactados e de câmera · D-132, T5 (tudo no aparelho), T6 (sem biblioteca externa).
   - .zip: lê o diretório central (os tamanhos do cabeçalho local podem vir zerados) e extrai as fotos;
     «armazenado» (0) direto e «deflate» (8) com DecompressionStream.
   - RAW (DNG, Canon, Nikon, Sony, Fuji, Olympus, Panasonic): usa a MAIOR prévia JPEG embutida.
   - Cada arquivo falha sozinho: os outros seguem e a pessoa recebe a lista do que ficou de fora. */
(function(){
var IMG={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',avif:'image/avif',tif:'image/tiff',tiff:'image/tiff',heic:'image/heic',heif:'image/heif'};
var RAW=/\.(dng|cr2|cr3|nef|arw|raf|orf|rw2)$/i;
function u16(a,p){return a[p]|a[p+1]<<8}
function u32(a,p){return (a[p]|a[p+1]<<8|a[p+2]<<16|a[p+3]<<24)>>>0}
function ext(n){return ((n.match(/\.([^.\/]+)$/)||[])[1]||'').toLowerCase()}

/* Um RAW guarda várias prévias JPEG (miniatura de ~160 px e a prévia grande). Percorre cada JPEG pelos segmentos
   (os APPn com miniaturas dentro são pulados pelo tamanho) até o fim real (FFD9 depois do SOS) e fica com a maior. */
function previa(a){var melhor=null,i,p,m,len,fim;
  for(i=0;i+3<a.length;i++){
    if(a[i]!==255||a[i+1]!==216||a[i+2]!==255)continue;
    p=i+2;fim=-1;
    while(p+3<a.length&&a[p]===255){m=a[p+1];
      if(m===216||(m>=208&&m<=215)||m===1){p+=2;continue}
      len=a[p+2]<<8|a[p+3];if(len<2)break;
      if(m===218){p+=2+len;while(p+1<a.length&&!(a[p]===255&&a[p+1]===217))p++;if(p+1<a.length)fim=p+2;break}
      p+=2+len}
    if(fim>0){if(!melhor||fim-i>melhor[1]-melhor[0])melhor=[i,fim];i=fim-1}
  }
  return melhor?a.slice(melhor[0],melhor[1]):null}
function raw(f){return f.arrayBuffer().then(function(b){
  var j=previa(new Uint8Array(b));
  if(!j)throw new Error('«'+f.name+'» não tem uma prévia que possa ser usada.');
  return new File([j],f.name.replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg'})})}

/* entradas do .zip pelo diretório central (EOCD → registros 0x02014b50) */
function entradas(a){
  var e=-1,i,lista=[],p,n;
  for(i=a.length-22;i>=Math.max(0,a.length-65557);i--)if(u32(a,i)===0x06054b50){e=i;break}
  if(e<0)return null;
  n=u16(a,e+10);p=u32(a,e+16);
  for(i=0;i<n&&p+46<=a.length&&u32(a,p)===0x02014b50;i++){
    var metodo=u16(a,p+10),tam=u32(a,p+20),ln=u16(a,p+28),le=u16(a,p+30),lc=u16(a,p+32),loc=u32(a,p+42);
    var nome=new TextDecoder().decode(a.subarray(p+46,p+46+ln));
    if(u32(a,loc)===0x04034b50){var ini=loc+30+u16(a,loc+26)+u16(a,loc+28);lista.push({nome:nome,metodo:metodo,dados:a.subarray(ini,ini+tam)})}
    p+=46+ln+le+lc}
  return lista}
function zip(f){return f.arrayBuffer().then(function(b){
  var lista=entradas(new Uint8Array(b));
  if(!lista)throw new Error('«'+f.name+'» não é um .zip válido.');
  var saidas=[],erros=[];
  return lista.reduce(function(ant,en){return ant.then(function(){
    var base=en.nome.split('/').pop();
    if(!base||/^\./.test(base)||/(^|\/)__MACOSX\//.test(en.nome))return;               /* pastas e arquivos do sistema */
    var x=ext(base),tipo=IMG[x];if(!tipo&&!RAW.test(base))return;                       /* só fotos */
    var bruto;
    if(en.metodo===0)bruto=Promise.resolve(new Blob([en.dados]));
    else if(en.metodo===8&&typeof DecompressionStream!=='undefined')bruto=new Response(new Blob([en.dados]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
    else{erros.push('«'+base+'» usa uma compressão que este navegador não lê.');return}
    return bruto.then(function(bl){var arq=new File([bl],base,{type:tipo||''});
      if(RAW.test(base))return raw(arq).then(function(j){saidas.push(j)});
      saidas.push(arq)}).catch(function(e){erros.push(e&&e.message||('«'+base+'» não pôde ser lido.'))})
  })},Promise.resolve()).then(function(){
    if(!saidas.length&&!erros.length)erros.push('«'+f.name+'» não tem fotos.');
    return {arquivos:saidas,erros:erros}})
})}

/* HEIC e TIFF só abrem onde o navegador decodifica (Safari); nos outros, aviso claro em vez de falha muda */
function decodifica(f){
  var x=ext(f.name);if(!/^(heic|heif|tiff?)$/.test(x)&&!/^image\/(heic|heif|tiff)$/i.test(f.type||''))return Promise.resolve(true);   /* D-210: o HEIC também pelo tipo (no Android o nome pode vir sem extensão) */
  if(!window.createImageBitmap)return Promise.resolve(false);
  return createImageBitmap(f).then(function(b){b.close();return true},function(){return false})}

/* expandir(lista) → {arquivos:[File], erros:[texto]} (nunca rejeita) */
function expandir(arqs){
  var out=[],erros=[];
  return [].slice.call(arqs||[]).reduce(function(ant,f){return ant.then(function(){
    var nome=f.name||'';
    if(/\.zip$/i.test(nome))return zip(f).then(function(r){out=out.concat(r.arquivos);erros=erros.concat(r.erros)});
    if(RAW.test(nome))return raw(f).then(function(j){out.push(j)});
    return decodifica(f).then(function(ok){if(ok)out.push(f);else erros.push('«'+nome+'»: este navegador não abre '+(ext(nome)||String(f.type||'').replace('image/','')).toUpperCase()+'. Converta para JPEG no aparelho ou use o Safari.')})
  }).catch(function(e){erros.push(e&&e.message||('«'+(f.name||'arquivo')+'» não pôde ser lido.'))})},Promise.resolve())
  .then(function(){return {arquivos:out,erros:erros}})}

window.PLIMPORTAR={expandir:expandir,zip:zip,raw:raw,previa:previa};
})();
