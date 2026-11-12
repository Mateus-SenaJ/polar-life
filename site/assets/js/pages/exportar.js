/* T-19 · Exportar · DOC-08 §6 (saídas, volumes) · DOC-03 BR-13 · estimativas são [HIPÓTESE] até existir o gerador (T-20) */
(function(){
var $=function(i){return document.getElementById(i)},tm;
function toast(m){clearTimeout(tm);$('toast-t').textContent=m;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
function pl(n,s,p){return n+' '+(n===1?s:p)}
function chave(){                                     /* mesma chave do pré-voo: se o projeto mudou depois da revisão, a revisão perde a validade */
  var s='';try{s=(sessionStorage.getItem('pl-quadro')||'')+'|'+(sessionStorage.getItem('pl-folhas')||'')}catch(e){}
  for(var h=5381,i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return String(h)
}
var P=null;try{P=JSON.parse(sessionStorage.getItem('pl-prevoo')||'null')}catch(e){}
var ok=P&&P.ok&&P.k===chave();
var cel=window.matchMedia('(max-width:767px)').matches||('ontouchstart' in window&&window.matchMedia('(pointer:coarse)').matches);
var LIM=cel?60:150;$('est-lim').textContent=LIM;

if(!ok){
  $('corpo').hidden=true;$('trava').hidden=false;
  $('trava-d').textContent=P?'O projeto mudou depois da última revisão. Revise de novo para gerar um arquivo certo.':'A revisão confere se tudo cabe e se as legendas estão na área segura. Ela vem antes de exportar.';
  $('resumo').textContent='Falta revisar a impressão.';
  return
}
$('resumo').textContent=pl(P.n,'folha','folhas')+' · '+pl(P.fotos,'foto','fotos')+' · '+P.papel+' '+(P.orient==='paisagem'?'paisagem':'retrato');

/* ---- estimador [HIPÓTESE]: MB por unidade ---- */
var MB_ORIG=2.4,MB_LEVE=.7,MB_SOBRA=.05;              /* PDF: por foto (JPEG original ≈ 12 MP) e por folha */
var A4=210*297;
function mb(f,o){
  var area=P.w*P.h,esc=(o.ppi/300)*(o.ppi/300);
  if(f==='pdf')return P.fotos*MB_ORIG+P.n*MB_SOBRA;
  if(f==='leve')return P.fotos*MB_LEVE+P.n*MB_SOBRA;
  var un=f==='folhas'?area/A4:(88*107)/A4,n=f==='folhas'?P.n:P.fotos;     /* A4 a 300 PPI: PNG ≈ 9 MB, JPEG ≈ 1,8 MB */
  return n*un*esc*(o.tipo==='png'?9:1.8)*(o.zip?.97:1)
}
function fmt(m){return m>=1000?(m/1000).toFixed(1).replace('.',',')+' GB':m>=10?Math.round(m)+' MB':(Math.max(.1,Math.round(m*10)/10)+'').replace('.',',')+' MB'}
function lerOpc(){
  var f=document.querySelector('input[name=fmt]:checked').value,img=f==='folhas'||f==='polaroids';
  return{f:f,img:img,tipo:document.querySelector('input[name=tipo]:checked').value,ppi:+document.querySelector('input[name=ppi]:checked').value,zip:$('zip').checked}
}
var ROT={pdf:'Gerar PDF',leve:'Gerar PDF leve',folhas:'Gerar imagens',polaroids:'Gerar imagens'};
function atualiza(){
  var o=lerOpc(),m=mb(o.f,o),v=Math.max(1,Math.ceil(m/LIM));
  $('opts').hidden=!o.img;$('aviso-100').hidden=o.img;
  $('est-v').textContent='≈ '+fmt(m);
  var un=o.img&&!o.zip?(o.f==='folhas'?P.n:P.fotos):v;
  $('est-s').textContent=o.img&&!o.zip?pl(un,'arquivo','arquivos')+' separados.'
    :v===1?'1 arquivo.':pl(v,'volume','volumes')+' de até '+LIM+' MB, para caber no '+(cel?'celular':'computador')+'.';
  var n=o.f==='folhas'||o.f==='pdf'||o.f==='leve'?P.n:P.fotos;
  $('go-t').textContent=ROT[o.f]+' ('+(o.f==='polaroids'?pl(P.fotos,'polaroid','polaroids'):pl(P.n,'folha','folhas'))+')'
}
document.addEventListener('change',function(e){if(e.target.closest&&e.target.closest('.card')){atualiza();atualizaInfo()}});

/* ---- linha Informação do portão (DOC-03 §4, brief §3.6): só nos formatos de impressão ---- */
function classeFolha(){return P.w*P.h>210*297?'grande':'padrao'} /* acima de A4 = folha grande */
function atualizaInfo(){
  var o=lerOpc(),box=$('info-conta');
  if(window.PLCONTA&&(o.f==='pdf'||o.f==='leve')&&PLCONTA.temSessao()){
    var g=PLCONTA.direito(P.n,classeFolha()),t='';
    if(g.ok){
      var pl=PLCONTA.plano()||{},MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      if(pl.id==='gratis')t=g.usaGratis?'Esta exportação usa sua folha grátis de '+MESES[new Date().getMonth()]+'.':'Esta exportação usa '+P.n+' folha'+(P.n>1?'s':'')+' comprada'+(P.n>1?'s':'')+'.';
      else if(pl.id==='avulsa')t='Esta exportação usa '+P.n+' das suas '+(classeFolha()==='grande'?pl.folhasCompradas.grande:pl.folhasCompradas.padrao)+(classeFolha()==='grande'?' folhas grandes':' folhas compradas')+'.';
      else if(pl.codigo)t='Esta exportação usa as '+pl.folhas+' folhas do seu código de impressão.';
      else t='Esta exportação usa o uso razoável do Pro.';
    }else t='Esta exportação precisa de '+P.n+' folha'+(P.n>1?'s':'')+'.';
    $('info-conta-t').textContent=t;box.hidden=false
  }else box.hidden=true
}

/* ---- portão entre a T-19 e a T-20 (DOC-03 §4, D-123/D-124) ---- */
function seguir(){
  var o=lerOpc(),m=mb(o.f,o);o.mb=m;o.v=Math.max(1,Math.ceil(m/LIM));o.lim=LIM;
  try{sessionStorage.setItem('pl-exportar',JSON.stringify(o))}catch(e){}
  location.href='../gerar/'                                /* T-20 */
}
$('go').onclick=function(){
  var o=lerOpc();
  if((o.f==='pdf'||o.f==='leve')&&window.PLPORTAO){       /* imagens: prévia simulada, sem portão (T7) */
    var classe=classeFolha();
    PLPORTAO.pedir(P.n,classe).then(function(r){
      if(r.ok)seguir();
      else if(r.motivo==='semConta'){/* o pop-up já encaminhou para a T-25 com ?voltar */}
      /* semFolhas/cancelado/pendente/recusado: fica na T-19 */
    })
  }else seguir();
};
atualiza();atualizaInfo();
})();
