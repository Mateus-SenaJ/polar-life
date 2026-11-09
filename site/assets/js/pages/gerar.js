/* T-20 · Gerando · recuperação (4 opções) · concluído · DOC-08 §6 (gerarPDF) · DOC-04 FL-07
   O progresso é SIMULADO (ainda não há gerador de PDF); a tela, os estados e o fluxo são os finais.
   Estados de revisão por hash: #estado-gerando (parado na folha 3) · #estado-falha · #estado-concluido */
(function(){
var $=function(i){return document.getElementById(i)},tm,tick=null;
function toast(m){clearTimeout(tm);$('toast-t').textContent=m;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
function pl(n,s,p){return n+' '+(n===1?s:p)}
function chave(){var t='';try{t=(sessionStorage.getItem('pl-quadro')||'')+'|'+(sessionStorage.getItem('pl-folhas')||'')}catch(e){}
  for(var h=5381,i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return String(h)}
function fmt(m){return m>=1000?(m/1000).toFixed(1).replace('.',',')+' GB':m>=10?Math.round(m)+' MB':(Math.max(.1,Math.round(m*10)/10)+'').replace('.',',')+' MB'}
var P=null,O=null;try{P=JSON.parse(sessionStorage.getItem('pl-prevoo')||'null');O=JSON.parse(sessionStorage.getItem('pl-exportar')||'null')}catch(e){}
if(!P||!P.ok||P.k!==chave()||!O){
  $('corpo').hidden=true;$('trava').hidden=false;$('h1').textContent='Falta escolher o formato';$('sub').textContent='';
  if(P&&P.ok&&P.k!==chave()){$('trava').querySelector('strong').textContent='O projeto mudou depois da revisão.';$('trava').querySelector('p').textContent='Revise a impressão de novo para gerar.';$('trava').querySelector('a').href='../#revisar';$('trava').querySelector('a').textContent='Revisar impressão'}
  return
}
var cel=window.matchMedia('(max-width:767px)').matches;
var estado=(location.hash.match(/^#estado-([\w-]+)$/)||[])[1];
var porFolha=P.por||4,fotos=P.fotos,imagem=O.f==='polaroids',total=0,feito=0,pausado=false,cancelando=false;
var FALHAS=[{n:7,why:'o arquivo está corrompido',tenta:true},{n:19,why:'o formato não foi reconhecido',tenta:false}],falhasAtivas=estado==='falha'?FALHAS.slice():[],jaFalhou=false;
function calc(){total=imagem?fotos:Math.ceil(fotos/porFolha)}
var U=function(){return imagem?'Polaroid':'Folha'};
function nomes(){
  var L=[],e=O.f==='pdf'||O.f==='leve'?'pdf':O.tipo==='jpeg'?'jpg':'png';
  if(O.f==='pdf'||O.f==='leve'||O.zip){
    var v=Math.max(1,O.v||1),ex=O.zip&&O.f!=='pdf'&&O.f!=='leve'?'zip':'pdf';
    for(var i=1;i<=v;i++)L.push({n:'Polar-Life'+(v>1?'-'+('00'+i).slice(-3):'')+'.'+ex,mb:(O.mb||0)/v})
  }else{for(var j=1;j<=total;j++)L.push({n:(imagem?'Polaroid-':'Folha-')+('0'+j).slice(-2)+'.'+e,mb:(O.mb||0)/total})}
  return L
}
function pinta(){
  var pc=total?Math.round(feito/total*100):0,p=$('prog');
  $('lbl').textContent=U()+' '+Math.min(feito+1,total)+' de '+total;$('pct').textContent=pc+'%';
  p.style.setProperty('--v',pc+'%');p.setAttribute('aria-valuenow',pc);
  $('det').textContent=imagem?'Cada polaroid vira uma imagem de '+O.ppi+' PPI.':O.f==='leve'?'Reamostrando as fotos, sem ficar abaixo de 300 PPI.':O.f==='pdf'?'Guias, legendas e fotos entram na medida exata do papel.':'Cada folha vira uma imagem de '+O.ppi+' PPI.'
}
function anuncia(){$('live').textContent=$('lbl').textContent}
function concluir(){
  clearInterval(tick);tick=null;
  var L=nomes(),soma=L.reduce(function(a,x){return a+x.mb},0);
  $('fase-gerando').hidden=true;$('fase-ok').hidden=false;$('h1').textContent='Seu arquivo está pronto';
  $('sub').textContent='Baixe agora, imprima ou compartilhe. Se precisar, é só gerar de novo.';
  $('ok-r').textContent=pl(L.length,'arquivo','arquivos')+' · '+fmt(soma);
  $('ok-d').textContent=imagem||O.f==='folhas'?pl(total,imagem?'polaroid':'folha',imagem?'polaroids':'folhas')+' em '+(O.tipo==='jpeg'?'JPEG':'PNG')+' a '+O.ppi+' PPI.':pl(total,'folha','folhas')+' · '+pl(fotos,'foto','fotos')+(O.f==='leve'?' · recomprimido':'')+'.';
  $('arqs').innerHTML=L.slice(0,8).map(function(x){return'<li><span class="nm">'+x.n+'</span><span class="mono">'+fmt(x.mb)+'</span></li>'}).join('')+(L.length>8?'<li><span class="nm">e mais '+(L.length-8)+' arquivos</span><span></span></li>':'');
  try{sessionStorage.setItem('pl-arquivos',JSON.stringify({k:chave(),L:L}))}catch(e){}            /* a T-22 compartilha estes arquivos */
  $('b-baixar-t').textContent=L.length>1&&!(O.zip)?'Baixar todos':'Baixar';
  $('b-imprimir').hidden=cel||imagem||O.f==='folhas'||O.f==='polaroids';          /* impressão direta: só desktop e só PDF (DOC-08 §6) */
  $('ok-box').focus()
}
function falha(){
  clearInterval(tick);tick=null;pausado=true;
  var n=falhasAtivas.length;$('df-t').textContent=n===1?'1 foto não pôde ser lida':n+' fotos não puderam ser lidas';
  $('df-l').innerHTML=falhasAtivas.map(function(f){return'<li><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg><span><strong>Foto '+f.n+'</strong>: '+f.why+'.</span></li>'}).join('');
  $('df-troca').href='../quadro/#foto-'+falhasAtivas[0].n;
  abre('dl-falha','df-tenta')
}
var disparo=null;
function abre(id,foco){$('sc').hidden=$(id).hidden=false;$(foco).focus()}
function fecha(id){$('sc').hidden=$(id).hidden=true}
function passo(){
  if(pausado||cancelando)return;
  if(falhasAtivas.length&&!jaFalhou&&feito>=Math.ceil(total*.5)){jaFalhou=true;falha();return}
  feito++;pinta();
  if(feito>=total){feito=total;$('lbl').textContent=U()+' '+total+' de '+total;$('pct').textContent='100%';$('prog').style.setProperty('--v','100%');setTimeout(concluir,350);clearInterval(tick);return}
  anuncia()
}
function inicia(de){clearInterval(tick);pausado=false;feito=de||0;calc();pinta();anuncia();tick=setInterval(passo,estado==='gerando'?1e9:650)}

/* ---- ações ---- */
$('cancel').onclick=function(){disparo=this;pausado=true;abre('dl-cancel','dc-nao')};
$('dc-nao').onclick=function(){fecha('dl-cancel');pausado=false;if(disparo&&disparo.focus)disparo.focus()};
$('dc-sim').onclick=function(){cancelando=true;clearInterval(tick);location.href='../exportar/'};
$('df-cancel').onclick=function(){cancelando=true;location.href='../exportar/'};
$('df-tenta').onclick=function(){
  fecha('dl-falha');falhasAtivas=falhasAtivas.filter(function(f){return!f.tenta});     /* a foto 7 volta; a 19 continua falhando */
  if(falhasAtivas.length){falha();return}
  pausado=false;tick=setInterval(passo,650)
};
$('df-sem').onclick=function(){                                                             /* repagina e reinicia (DOC-08 §6) */
  var q=falhasAtivas.length;fotos-=q;falhasAtivas=[];fecha('dl-falha');
  $('nota-t').textContent=pl(q,'foto ficou','fotos ficaram')+' de fora. O arquivo foi paginado de novo com '+pl(fotos,'foto','fotos')+'.';$('nota').hidden=false;
  inicia(0)
};
$('b-baixar').onclick=$('b-novo').onclick=function(){toast('O arquivo de verdade sai quando o gerador de PDF for ligado. Esta tela já tem o fluxo final.')};
$('b-imprimir').onclick=function(){location.href='../imprimir/'};
$('b-compart').onclick=function(){location.href='../compartilhar/'};
document.addEventListener('keydown',function(e){
  var a=!$('dl-cancel').hidden?'dl-cancel':!$('dl-falha').hidden?'dl-falha':null;if(!a)return;
  if(e.key==='Escape'&&a==='dl-cancel'){e.preventDefault();$('dc-nao').click();return}
  if(e.key!=='Tab')return;
  var f=[].filter.call($(a).querySelectorAll('button,a[href]'),function(x){return!x.disabled&&x.offsetParent!==null});if(!f.length)return;
  var p=f[0],z=f[f.length-1];
  if(e.shiftKey&&(document.activeElement===p||!$(a).contains(document.activeElement))){e.preventDefault();z.focus()}
  else if(!e.shiftKey&&(document.activeElement===z||!$(a).contains(document.activeElement))){e.preventDefault();p.focus()}
});
window.addEventListener('hashchange',function(){location.reload()});

calc();
if(estado==='concluido'){feito=total;concluir()}else if(estado==='gerando'){feito=Math.min(2,total-1);pinta();anuncia()}
else inicia(0)
})();
