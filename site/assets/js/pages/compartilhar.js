/* T-22 · Compartilhar · DOC-06 §8 (prepararLembranca: arquivo pronto ANTES do clique; «Compartilhar» só com canShare({files}); senão «Baixar»)
   Os arquivos são os que a T-20 acabou de gerar (PDF, imagens ou ZIP), guardados no aparelho com a chave do projeto.
   AbortError (a pessoa cancelou) não mostra nada; outro erro troca para «Baixar».
   Estados de revisão por hash: #estado-sem-suporte · #estado-erro · #estado-baixado */
(function(){
var $=function(i){return document.getElementById(i)},tm;
function toast(m){clearTimeout(tm);$('toast-t').textContent=m;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
function pl(n,s,p){return n+' '+(n===1?s:p)}
function fmt(m){return m>=1000?(m/1000).toFixed(1).replace('.',',')+' GB':m>=10?Math.round(m)+' MB':(Math.max(.1,Math.round(m*10)/10)+'').replace('.',',')+' MB'}
function chave(){var t='';try{t=(sessionStorage.getItem('pl-quadro')||'')+'|'+(sessionStorage.getItem('pl-folhas')||'')+'|'+(sessionStorage.getItem('pl-colagem')||'')}catch(e){}
  for(var h=5381,i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return String(h)}
var estado=(location.hash.match(/^#estado-([\w-]+)$/)||[])[1];
var A=null;try{A=JSON.parse(sessionStorage.getItem('pl-arquivos')||'null')}catch(e){}
if(!A&&estado)A={k:chave(),L:[{n:'PolarLife.pdf',mb:9}]};
if(!A||!A.L||!A.L.length||A.k!==chave()){
  $('corpo').hidden=true;$('trava').hidden=false;$('sub').textContent='';
  if(A&&A.k!==chave()){$('trava').querySelector('strong').textContent='O projeto mudou depois de gerar o arquivo.';$('trava').querySelector('p').textContent='Gere de novo para compartilhar a versão atual.';$('trava-a').href='../#revisar';$('trava-a').textContent='Revisar impressão'}
  return
}
var L=A.L,ext=L[0].n.split('.').pop(),MIME={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',zip:'application/zip'};
var arquivos=[],modo='baixar',falhou=false;

$('resumo').textContent=pl(L.length,'arquivo','arquivos')+' · '+fmt(L.reduce(function(a,x){return a+x.mb},0));
$('arqs').innerHTML=L.slice(0,6).map(function(x){return'<li><span class="nm">'+x.n+'</span><span class="mono">'+fmt(x.mb)+'</span></li>'}).join('')+(L.length>6?'<li><span class="nm">e mais '+(L.length-6)+' arquivos</span><span></span></li>':'');

function rotuloBaixar(){return ext==='pdf'?'Baixar PDF':ext==='zip'?'Baixar ZIP':L.length>1?'Baixar imagens':'Baixar imagem'}
function destino(){return ext==='pdf'?'Abra o aplicativo de impressão ou de mensagens e escolha o PDF na pasta de downloads.':ext==='zip'?'Abra o aplicativo e escolha o arquivo ZIP na pasta de downloads.':'Abra o aplicativo e escolha a imagem na galeria.'}
function pinta(){
  var s=modo==='compartilhar';
  $('ir').disabled=false;$('ir').setAttribute('aria-disabled','false');
  $('ir-t').textContent=s?'Compartilhar':rotuloBaixar();
  $('i-share').style.display=s?'':'none';$('i-baixa').style.display=s?'none':'';
  $('aviso').hidden=s;
  if(!s){$('aviso-t').textContent=falhou?'Não foi possível abrir o menu de compartilhar.':'Este navegador não compartilha arquivos.';
    $('aviso-d').textContent='Baixe o arquivo e envie pelo aplicativo que você quiser.'}
}
function baixa(){
  arquivos.forEach(function(f,i){setTimeout(function(){
    var u=URL.createObjectURL(f),a=document.createElement('a');a.href=u;a.download=f.name;a.style.display='none';
    document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000)},i*300)});
  mostraBaixado()
}
function mostraBaixado(){$('baixado-d').textContent=destino();$('baixado').hidden=false;$('baixado').focus()}

$('ir').onclick=function(){
  if(this.disabled)return;
  if(modo==='compartilhar'){
    var p;try{p=navigator.share({files:arquivos})}catch(e){p=Promise.reject(e)}      /* na thread principal, dentro do clique */
    p.then(function(){toast('Pronto. Você escolheu para onde o arquivo foi.')},function(e){
      if(e&&e.name==='AbortError')return;                                           /* cancelou: sem mensagem */
      falhou=true;modo='baixar';pinta()
    })
  }else baixa()
};

function prepara(a){
  arquivos=a.map(function(x){return new File([x.bytes],x.nome,{type:x.tipo||MIME[(x.nome||'').split('.').pop()]||'application/octet-stream'})});
  var ok=false;try{ok=!!(window.isSecureContext&&navigator.canShare&&navigator.canShare({files:arquivos}))}catch(e){}
  if(estado==='sem-suporte'||estado==='erro'||estado==='baixado')ok=false;
  falhou=estado==='erro';modo=ok?'compartilhar':'baixar';pinta();
  if(estado==='baixado')mostraBaixado()
}
/* A tela de revisao preserva seus estados sem inventar um arquivo fora da geracao real. */
if(window.PLFOTOS)PLFOTOS.lerArquivos(chave()).then(function(a){if(a.length)prepara(a);else if(estado)prepara([{nome:L[0].n,bytes:new Uint8Array(0),tipo:MIME[ext]}]);else{$('corpo').hidden=true;$('trava').hidden=false}},function(){$('corpo').hidden=true;$('trava').hidden=false});
})();
