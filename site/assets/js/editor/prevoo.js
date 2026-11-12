/* T-18 · Pré-voo «Tudo pronto para o papel?» · DOC-03 BR-12 e BR-13 · DOC-01 (caixa de decisão) · DV-32
   Pop-up nível 3 sobre a mesa do Modo Folhas. Três severidades, sempre com ícone + texto (nunca só cor):
   Bloqueia (✕) · Pede confirmação (▲) · Informa (i). Lê o estado pelo gancho window.PLEDITOR (editor.js). */
(function(){
var $=function(i){return document.getElementById(i)};
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function pl(n,s,p){return n+' '+(n===1?s:p)}
function nf(n){return String(Math.round(n*10)/10).replace('.',',')}
var COORD=/-?\d{1,3}[.,]\d{3,}\s*[,;]\s*-?\d{1,3}[.,]\d{3,}/,ARQ=/^(IMG|DSC|DSCN|PXL|MVIMG)[_-]?\d+|\.(jpe?g|png|heic|webp)$/i;
var MB_FOLHA=1.5;                                   /* [HIPÓTESE] ~1,5 MB por folha a 300 PPI; o estimador real vem com o PDF (T-19) */
var NAO_IMPRIMIVEL=window.PLFOLHAS?PLFOLHAS.MARGEM_MIN:3;                               /* D-150: padrão 3 mm; abaixo disso avisa (a área não imprimível depende da impressora) */
function chave(){var t='';try{t=(sessionStorage.getItem('pl-quadro')||'')+'|'+(sessionStorage.getItem('pl-folhas')||'')+'|'+(sessionStorage.getItem('pl-colagem')||'')}catch(e){}
  for(var h=5381,i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return String(h)}
var disparo=null,confirmou=false,itens=null;

function ppiDe(F,k){                                /* PPI por posição, gravado pelo Quadro; sem visita ao Quadro vale o exemplo (foto 12 = 140) */
  try{var a=JSON.parse(sessionStorage.getItem('pl-ppi')||'null');if(Array.isArray(a)&&a.length===F.length&&typeof a[k]==='number')return a[k]}catch(e){}
  return F[k].src===12?140:326}

function analisar(){
  var C=window.PLEDITOR.ctx(),R=C.R,D=C.D,S=C.S||C.D,RD=C.rede||null,F=C.FOTOS,LG=C.LG,bl=[],pe=[],inf=[];   /* D-195: S = o que está na tela (Folhas ou Colagem) */
  var data=LG?LG.data.on:true,loc=LG?LG.loc.on:true;
  /* ---- Bloqueia (BR-13) ---- */
  if(D.guias&&D.contorno)bl.push('Guias e contorno estão ligados ao mesmo tempo. Desligue um deles na aba Papel.');
  if(!F.length)bl.push('O projeto não tem fotos. Adicione ao menos uma foto.');
  else if(R.erro)bl.push(RD?'As polaroids não cabem neste tamanho. Reduza a margem ou escolha outro layout.':'A polaroid não cabe neste papel. Escolha um papel maior ou reduza as margens.');
  else if(!R.sheets.length)bl.push('Nenhuma folha tem fotos.');
  var fora=R.erro||C.LG&&C.LG.original?0:C.foraTodas(); /* D-135: com a Polaroid original não há texto fora da área segura */
  if(fora)bl.push('A legenda sai da área segura em '+pl(fora,'polaroid','polaroids')+' (inclui a zona da assinatura). Reduza o corpo, use «Ajustar para caber» ou mude a posição na aba Legendas.');
  var coord=F.filter(function(f){return COORD.test(f.leg||'')});
  if(coord.length)bl.push('O texto da '+(coord.length===1?'foto ':'s fotos ')+coord.map(function(f){return f.n}).join(', ')+' tem coordenadas. Troque por uma cidade.');
  /* ---- Pede confirmação ---- */
  /* D-130: mesmo cálculo das folhas (C.ppi) e mesmo limite do ponto de qualidade; o número só aqui, entre parênteses */
  var ru=[];F.forEach(function(f,k){var p=C.ppi&&C.ppi(f);if(!p&&!(window.PLTEXTO&&PLTEXTO.ehReal()))p=ppiDe(F,k);if(p&&(window.PLQUALIDADE?PLQUALIDADE.nivel(p)==='borrada':p<150))ru.push({n:f.n,p:p})});
  if(ru.length&&!RD)pe.push((ru.length===1?'A foto ':'As fotos ')+ru.slice(0,6).map(function(x){return x.n+' ('+x.p+' PPI)'}).join(', ')+(ru.length>6?' e mais '+(ru.length-6):'')+(ru.length===1?' pode sair borrada':' podem sair borradas')+'. Diminua o zoom, escolha um formato menor ou use uma foto maior.');
  var arq=F.filter(function(f){return ARQ.test(String(f.leg||'').trim())});
  if(arq.length)pe.push('O texto da '+(arq.length===1?'foto ':'s fotos ')+arq.map(function(f){return f.n}).join(', ')+' parece um nome de arquivo (como IMG_0234).');
  var sd=data?F.filter(function(f){return f.m&&!f.m.iso}).length:0,sl=loc?F.filter(function(f){return f.m&&!f.m.c}).length:0;
  if(sd)pe.push(pl(sd,'foto está','fotos estão')+' sem data, com a linha de data ligada.');
  if(sl)pe.push(pl(sl,'foto está','fotos estão')+' sem local, com a linha de local ligada.');
  var cal=false;try{cal=sessionStorage.getItem('pl-calibrou')==='1'||Object.keys(JSON.parse(localStorage.getItem('pl-calib')||'{}')).some(function(k){return k.split('|')[1]===window.PLFOLHAS.papel(D).n})}catch(e){}
  if(!cal&&!RD)pe.push('Sua impressora ainda não foi calibrada. Imprima a página de teste antes do lote.');
  if(S.margem<NAO_IMPRIMIVEL&&!RD)pe.push('A margem de '+nf(D.margem)+' mm pode ser menor que a área não imprimível da sua impressora.');
  /* ---- Informa ---- */
  var n=R.erro?0:R.sheets.length,ant=null;try{ant=+sessionStorage.getItem('pl-prevoo-folhas')||null}catch(e){}
  if(RD)inf.push(pl(Math.max(1,n),'imagem','imagens')+' de '+RD.w+' × '+RD.h+' px, sem gastar folha.');
  else inf.push('Tamanho estimado: cerca de '+nf(Math.max(1,n)*MB_FOLHA)+' MB em 1 arquivo.');
  if(ant&&ant!==n&&n&&!RD)inf.push(pl(ant,'folha','folhas')+' → '+pl(n,'folha','folhas')+' desde a última revisão.');
  inf.push(D.assin?'A assinatura PolarLife está ligada.':'A assinatura PolarLife está desligada.');
  return{bl:bl,pe:pe,inf:inf,n:n,por:R.erro?0:R.g.n,papel:window.PLFOLHAS.papel(S),aprov:R.erro?0:C.aprov(R),orient:S.orient,rede:RD}
}

function lista(cls,ico,rot,arr){
  if(!arr.length)return'';
  return'<section class="pv__g pv__g--'+cls+'" aria-label="'+rot+'"><h3 class="pv__h"><svg class="ico sm" aria-hidden="true"><use href="#'+ico+'"/></svg><span>'+rot+'</span><span class="mono pv__n">'+arr.length+'</span></h3><ul class="pv__l">'
   +arr.map(function(t){return'<li><svg class="ico sm" aria-hidden="true"><use href="#'+ico+'"/></svg><span>'+esc(t)+'</span></li>'}).join('')+'</ul></section>'
}
function monta(){
  if($('pv-dlg'))return;
  var sc=document.createElement('div');sc.className='scrim led-scrim';sc.id='pv-scrim';sc.hidden=true;
  var d=document.createElement('div');d.className='dialog pv led-dialog led-box led-box--3';d.id='pv-dlg';d.setAttribute('role','alertdialog');d.setAttribute('aria-modal','true');
  d.setAttribute('aria-labelledby','pv-t');d.setAttribute('aria-describedby','pv-d');d.hidden=true;
  d.innerHTML='<div class="pv__top"><svg class="ico pv__ico" aria-hidden="true"><use href="#i-verified"/></svg><h2 class="led-dialog__title" id="pv-t">Tudo pronto para o papel?</h2></div><p id="pv-d"></p>'
   +'<dl class="pv__grid"><div><dt class="rotulo">Total de folhas</dt><dd id="pv-f"></dd></div><div><dt class="rotulo">Disposição</dt><dd id="pv-p"></dd></div><div><dt class="rotulo">Aproveitamento</dt><dd id="pv-a"></dd></div></dl>'
   +'<div id="pv-l"></div>'
   +'<label class="chk pv__ok" id="pv-okl" hidden><input type="checkbox" id="pv-ok"><span class="chk__b" aria-hidden="true"><svg class="ico"><use href="#i-check"/></svg></span><span>Revisei e quero continuar</span></label>'
   +'<p class="pv__why mono" id="pv-w" hidden></p>'
   +'<div class="dialog__act led-dialog__actions"><button type="button" class="btn2 btn2--lg" id="pv-v">Voltar e ajustar</button>'
   +'<button type="button" class="led-btn led-btn--light" id="pv-g"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content"><span id="pv-gt">Gerar PDF</span></span></button></div>';
  document.body.appendChild(sc);document.body.appendChild(d);
  $('pv-v').onclick=sc.onclick=function(){fecha()};
  $('pv-ok').onchange=function(){confirmou=this.checked;estado()};
  $('pv-g').onclick=function(){
    if(this.disabled)return;
    var C=window.PLEDITOR.ctx(),S=C.S||C.D,pp=window.PLFOLHAS.papel(S);
    try{sessionStorage.setItem('pl-prevoo-folhas',String(itens.n));
      sessionStorage.setItem('pl-prevoo',JSON.stringify({ok:true,k:chave(),n:itens.n,fotos:C.FOTOS.length,papel:pp.n,w:pp.w,h:pp.h,orient:S.orient,por:itens.por,col:!!C.col,rede:itens.rede||null}))}catch(e){}   /* D-195: a exportação sabe se é colagem e se é imagem para as redes */
    fecha(true);location.href='exportar/'                 /* T-19: escolher o formato; o rótulo «Gerar PDF» já vem marcado lá */
  };
  document.addEventListener('keydown',function(e){
    if(d.hidden)return;
    if(e.key==='Escape'){e.preventDefault();fecha();return}
    if(e.key!=='Tab')return;
    var f=[].filter.call(d.querySelectorAll('button,input'),function(x){return!x.disabled&&x.offsetParent!==null||x===document.activeElement});
    if(!f.length)return;var a=f[0],z=f[f.length-1];
    if(e.shiftKey&&(document.activeElement===a||!d.contains(document.activeElement))){e.preventDefault();z.focus()}
    else if(!e.shiftKey&&(document.activeElement===z||!d.contains(document.activeElement))){e.preventDefault();a.focus()}
  })
}
function estado(){
  var b=itens.bl.length,c=itens.pe.length,g=$('pv-g'),w=$('pv-w');
  $('pv-okl').hidden=!c||!!b;
  var ok=!b&&(!c||confirmou);g.disabled=!ok;g.setAttribute('aria-disabled',String(!ok));
  w.hidden=ok;
  var arq=itens.rede?'as imagens':'o PDF';
  w.textContent=b?'Resolva '+pl(b,'item que bloqueia','itens que bloqueiam')+' para gerar '+arq+'.':!ok?'Marque «Revisei e quero continuar» para gerar '+arq+'.':''
}
function abrir(origem){
  monta();disparo=origem||document.activeElement;confirmou=false;
  itens=analisar();var n=itens.n,b=itens.bl.length,c=itens.pe.length;
  var arq=itens.rede?'as imagens':'o PDF';
  $('pv-t').textContent=itens.rede?'Tudo pronto para compartilhar?':'Tudo pronto para o papel?';
  $('pv-d').textContent=b?(b===1?'1 item impede de gerar '+arq+'.':b+' itens impedem de gerar '+arq+'.')+' Ajuste e revise de novo.'
    :c?'Está quase. '+pl(c,'item pede','itens pedem')+' a sua confirmação antes de gerar.'
    :'Nada impede a geração. Revise o resumo e gere '+arq+'.';
  $('pv-f').textContent=b&&!n?'—':String(n);
  $('pv-p').textContent=itens.por?(itens.rede?itens.por+' por imagem · '+itens.papel.n:pl(itens.por,'por folha','por folha')+' · '+itens.papel.n+' '+(itens.orient==='paisagem'?'paisagem':'retrato')):'—';
  $('pv-f').previousElementSibling.textContent=itens.rede?'Total de imagens':'Total de folhas';
  $('pv-a').textContent=itens.por&&itens.aprov!=null?itens.aprov+'%':'—';
  $('pv-l').innerHTML=lista('bl','i-x','Bloqueia',itens.bl)+lista('pe','i-warn','Pede confirmação',itens.pe)+lista('in','i-info','Informa',itens.inf);
  $('pv-ok').checked=false;
  $('pv-gt').textContent=itens.rede?'Gerar imagens'+(n?' ('+pl(n,'imagem','imagens')+')':''):'Gerar PDF'+(n?' ('+pl(n,'folha','folhas')+')':'');
  estado();
  $('pv-scrim').hidden=$('pv-dlg').hidden=false;
  (b?$('pv-v'):($('pv-ok').offsetParent?$('pv-ok'):$('pv-g'))).focus()
}
function fecha(semFoco){
  $('pv-scrim').hidden=$('pv-dlg').hidden=true;
  if(semFoco!==true&&disparo&&disparo.focus)disparo.focus()
}
window.PLPREVOO={abrir:abrir,analisar:function(){return analisar()}};
if(location.hash==='#revisar')setTimeout(function(){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}abrir($('go'))},0)   /* abre uma vez; recarregar não reabre */
})();
