/* T-19 · Exportar · DOC-08 §6 (saídas, volumes) · DOC-03 BR-13 · estimativas são [HIPÓTESE]
   D-195: imagens de verdade. Folhas em imagem contam as folhas; polaroids avulsas contam ⌈N ÷ 4⌉ folhas padrão (DOC-03 §3);
   a colagem para as redes sai em imagem e não gasta folha (D-054, D-125). */
(function(){
var $=function(i){return document.getElementById(i)},tm;
function toast(m){clearTimeout(tm);$('toast-t').textContent=m;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
function pl(n,s,p){return n+' '+(n===1?s:p)}
function chave(){                                     /* mesma chave do pré-voo: se o projeto mudou depois da revisão, a revisão perde a validade */
  var s='';try{s=(sessionStorage.getItem('pl-quadro')||'')+'|'+(sessionStorage.getItem('pl-folhas')||'')+'|'+(sessionStorage.getItem('pl-colagem')||'')}catch(e){}
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
var REDE=P.rede||null,COL=!!P.col,VIS=REDE?['rede']:COL?['pdf','grafica','leve','folhas']:['pdf','grafica','leve','folhas','polaroids'];
[].forEach.call(document.querySelectorAll('input[name=fmt]'),function(r){var on=VIS.indexOf(r.value)>=0,l=r.closest('.fmt');if(l)l.hidden=!on;r.disabled=!on;r.checked=false});
document.querySelector('input[name=fmt][value='+VIS[0]+']').checked=true;
$('resumo').textContent=REDE?pl(P.n,'imagem','imagens')+' · '+pl(P.fotos,'foto','fotos')+' · '+P.papel+' ('+REDE.w+' × '+REDE.h+' px)'
  :pl(P.n,'folha','folhas')+' · '+pl(P.fotos,'foto','fotos')+' · '+P.papel+' '+(P.orient==='paisagem'?'paisagem':'retrato');

/* ---- estimador [HIPÓTESE]: MB por unidade ---- */
var MB_ORIG=2.4,MB_LEVE=.7,MB_SOBRA=.05,MB_FIEL=3.6;              /* PDF: por foto (JPEG original ≈ 12 MP) e por folha */
var A4=210*297;
function mb(f,o){
  var area=P.w*P.h,esc=(o.ppi/300)*(o.ppi/300);
  if(f==='pdf')return P.fotos*MB_ORIG+P.n*MB_SOBRA;
  if(f==='leve')return P.fotos*MB_LEVE+P.n*MB_SOBRA;
  if(f==='grafica')return P.fotos*MB_FIEL+P.n*MB_SOBRA;               /* D-174: originais + perfis de cor */
  if(f==='rede')return P.n*(o.tipo==='png'?2.2:.45)*(REDE?REDE.h/1080:1);   /* 1080 px de largura */
  var un=f==='folhas'?area/A4:(88*107)/A4,n=f==='folhas'?P.n:P.fotos;     /* A4 a 300 PPI: PNG ≈ 9 MB, JPEG ≈ 1,8 MB */
  return n*un*esc*(o.tipo==='png'?9:1.8)*(o.zip?.97:1)
}
function fmt(m){return m>=1000?(m/1000).toFixed(1).replace('.',',')+' GB':m>=10?Math.round(m)+' MB':(Math.max(.1,Math.round(m*10)/10)+'').replace('.',',')+' MB'}
function lerOpc(){
  var f=document.querySelector('input[name=fmt]:checked').value,img=f==='folhas'||f==='polaroids'||f==='rede';
  return{f:f,img:img,tipo:document.querySelector('input[name=tipo]:checked').value,ppi:+document.querySelector('input[name=ppi]:checked').value,zip:$('zip').checked}
}
var ROT={pdf:'Gerar PDF',grafica:'Gerar PDF profissional',leve:'Gerar PDF leve',folhas:'Gerar imagens',polaroids:'Gerar imagens',rede:'Gerar imagens'};
/* folhas que a exportação conta (DOC-03 §3): a colagem para as redes não conta */
function folhasDe(o){return o.f==='rede'?0:o.f==='polaroids'?Math.ceil(P.fotos/4):P.n}
function arquivosDe(o){return o.f==='polaroids'?P.fotos:P.n}
function atualiza(){
  var o=lerOpc(),m=mb(o.f,o),v=Math.max(1,Math.ceil(m/LIM));
  $('opts').hidden=!o.img;$('o-ppi').hidden=o.f==='rede';$('zip-l').hidden=arquivosDe(o)<2;$('aviso-100').hidden=o.img||o.f==='grafica';$('aviso-pro').hidden=o.f!=='grafica';
  $('est-v').textContent='≈ '+fmt(m);
  var zipa=o.zip&&arquivosDe(o)>1,un=o.img&&!zipa?arquivosDe(o):v;
  $('est-s').textContent=o.img&&!zipa?(un>1?pl(un,'arquivo','arquivos')+' separados.':'1 arquivo.')
    :v===1?'1 arquivo.':pl(v,'volume','volumes')+' de até '+LIM+' MB, para caber no '+(cel?'celular':'computador')+'.';
  var n=o.f==='folhas'||o.f==='pdf'||o.f==='leve'||o.f==='grafica'?P.n:P.fotos;
  $('go-t').textContent=ROT[o.f]+' ('+(o.f==='polaroids'?pl(P.fotos,'polaroid','polaroids'):o.f==='rede'?pl(P.n,'imagem','imagens'):pl(P.n,'folha','folhas'))+')'
}
document.addEventListener('change',function(e){if(e.target.closest&&e.target.closest('.card')){atualiza();atualizaInfo()}});

/* ---- linha Informação do portão (DOC-03 §4, brief §3.6): só nos formatos de impressão ---- */
function classeFolha(){return P.w*P.h>210*297?'grande':'padrao'} /* acima de A4 = folha grande */
function atualizaInfo(){
  var o=lerOpc(),box=$('info-conta'),N=folhasDe(o),cl=o.f==='polaroids'?'padrao':classeFolha();
  if(o.f==='rede'){$('info-conta-t').textContent='Imagem para compartilhar: não gasta folha.';box.hidden=false;return}
  if(window.PLCONTA&&N&&PLCONTA.temSessao()){
    var g=PLCONTA.direito(N,cl,chave()),t='';
    if(g.ok&&g.jaContado)t='Este arquivo já foi exportado nas últimas 24 horas: não gasta outra folha.';
    else if(g.ok){
      var pl=PLCONTA.plano()||{},MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      if(pl.id==='gratis')t=g.usaGratis?'Esta exportação usa sua folha grátis de '+MESES[new Date().getMonth()]+'.':'Esta exportação usa '+N+' folha'+(N>1?'s':'')+' comprada'+(N>1?'s':'')+'.';
      else if(pl.id==='avulsa')t='Esta exportação usa '+N+' das suas '+(cl==='grande'?pl.folhasCompradas.grande:pl.folhasCompradas.padrao)+(cl==='grande'?' folhas grandes':' folhas compradas')+'.';
      else if(pl.codigo)t='Esta exportação usa as '+pl.folhas+' folhas do seu código de impressão.';
      else t='Esta exportação usa o uso razoável do Pro.';
    }else t='Esta exportação precisa de '+N+' folha'+(N>1?'s':'')+'.';
    if(o.f==='polaroids')t+=' Polaroids avulsas contam 1 folha a cada 4 polaroids.';
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
  var N=folhasDe(o);
  if(N&&window.PLPORTAO){                                                  /* D-195: imagens de folhas e polaroids também passam pelo portão; a imagem para as redes, não */
    var classe=o.f==='polaroids'?'padrao':classeFolha();
    PLPORTAO.pedir(N,classe,chave()).then(function(r){
      if(r.ok)seguir();
      else if(r.motivo==='semConta'){/* o pop-up já encaminhou para a T-25 com ?voltar */}
      /* semFolhas/cancelado/pendente/recusado: fica na T-19 */
    })
  }else seguir();
};
/* D-173: ao escolher a qualidade com toque ou clique, a tela desce até o botão de gerar (que fica bem abaixo) e o
   destaca; pelo teclado (setas no grupo de opções) nada se move, para não tirar a pessoa do lugar. */
$('fmts').addEventListener('click',function(e){
  if(!e.detail||!e.target.closest||!e.target.closest('.fmt'))return;
  setTimeout(function(){
    var g=$('go'),r=g.getBoundingClientRect(),calmo=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(r.top<0||r.bottom>innerHeight-16)g.scrollIntoView({behavior:calmo?'auto':'smooth',block:'center'});
    if(!calmo){g.classList.remove('led-btn--chama');void g.offsetWidth;g.classList.add('led-btn--chama')}
  },80)
});
atualiza();atualizaInfo();
})();
