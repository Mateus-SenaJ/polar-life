/* T-18 · Pré-voo «Tudo pronto para o papel?» · DOC-03 BR-12 e BR-13 · DOC-01 (caixa de decisão) · DV-32
   Pop-up nível 3 sobre a mesa do Modo Folhas. Três severidades, sempre com ícone + texto (nunca só cor):
   Bloqueia (✕) · Pede confirmação (▲) · Informa (i). Lê o estado pelo gancho window.PLEDITOR (editor.js).
   D-207: o revisor mostra as folhas em miniatura (o que está cheio e o que falta), tem os interruptores do arquivo
   (guias, rodapé, assinatura; na Colagem, sombra) e avisos com ação: folha incompleta, foto sem legenda quando as outras
   têm, colagem com menos fotos que o tipo pede. analisar() continua devolvendo os textos (bl, pe, inf). */
(function(){
var $=function(i){return document.getElementById(i)};
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function pl(n,s,p){return n+' '+(n===1?s:p)}
function nf(n){return String(Math.round(n*10)/10).replace('.',',')}
function nums(a){return a.length===1?String(a[0]):a.slice(0,-1).join(', ')+' e '+a[a.length-1]}
var COORD=/-?\d{1,3}[.,]\d{3,}\s*[,;]\s*-?\d{1,3}[.,]\d{3,}/,ARQ=/^(IMG|DSC|DSCN|PXL|MVIMG)[_-]?\d+|\.(jpe?g|png|heic|webp)$/i;
var MB_FOLHA=1.5;                                   /* [HIPÓTESE] ~1,5 MB por folha a 300 PPI; o estimador real vem com o PDF (T-19) */
var NAO_IMPRIMIVEL=window.PLFOLHAS?PLFOLHAS.MARGEM_MIN:3;                               /* D-150: padrão 3 mm; abaixo disso avisa (a área não imprimível depende da impressora) */
function chave(){var t='';try{t=(sessionStorage.getItem('pl-quadro')||'')+'|'+(sessionStorage.getItem('pl-folhas')||'')+'|'+(sessionStorage.getItem('pl-colagem')||'')}catch(e){}
  for(var h=5381,i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return String(h)}
var disparo=null,confirmou=false,itens=null;
/* ações dos avisos (D-207): levam a pessoa direto ao ponto que resolve */
var ACAO={
  fotos:{rot:'Adicionar fotos',ir:function(){location.href='../adicionar-fotos/'}},
  legenda:{rot:'Escrever legenda',ir:function(){fecha();var t=$('tab-legendas');if(t)t.click()}},
  colagem:{rot:'Ver a colagem',ir:function(){fecha();var t=$('tab-colagem');if(t)t.click()}}
};

function ppiDe(F,k){                                /* PPI por posição, gravado pelo Quadro; sem visita ao Quadro vale o exemplo (foto 12 = 140) */
  try{var a=JSON.parse(sessionStorage.getItem('pl-ppi')||'null');if(Array.isArray(a)&&a.length===F.length&&typeof a[k]==='number')return a[k]}catch(e){}
  return F[k].src===12?140:326}

function analisar(){
  var C=window.PLEDITOR.ctx(),R=C.R,D=C.D,S=C.S||C.D,RD=C.rede||null,F=C.FOTOS,LG=C.LG,bl=[],pe=[],inf=[],blA=[],peA=[];   /* D-195: S = o que está na tela (Folhas ou Colagem) */
  function B(t,a){bl.push(t);blA.push(a||null)}
  function P(t,a){pe.push(t);peA.push(a||null)}
  var data=LG?LG.data.on:true,loc=LG?LG.loc.on:true;
  /* ---- Bloqueia (BR-13) ---- */
  if(D.guias&&D.contorno)B('Guias e contorno estão ligados ao mesmo tempo. Desligue um deles na aba Papel.');
  if(!F.length)B('O projeto não tem fotos. Adicione ao menos uma foto.','fotos');
  else if(R.erro)B(RD?'As polaroids não cabem neste tamanho. Reduza a margem ou escolha outro layout.':'A polaroid não cabe neste papel. Escolha um papel maior ou reduza as margens.');
  else if(!R.sheets.length)B('Nenhuma folha tem fotos.');
  if(C.col&&window.PLCOLAGEM&&F.length){             /* D-207: cada tipo de colagem pede um mínimo de fotos */
    var cc=PLCOLAGEM.norm(C.C),fal=PLCOLAGEM.faltam(cc,F.length),L0=PLCOLAGEM.LAYOUTS.filter(function(l){return l.id===cc.layout})[0];
    if(fal)B('A colagem «'+L0.n+'» pede pelo menos '+PLCOLAGEM.minimo(cc)+' fotos: '+(fal===1?'falta 1.':'faltam '+fal+'.')+' Adicione fotos ou escolha outro layout.','fotos');
  }
  var fora=R.erro||C.LG&&C.LG.original?0:C.foraTodas(); /* D-135: com a Polaroid original não há texto fora da área segura */
  if(fora)B('A legenda sai da área segura em '+pl(fora,'polaroid','polaroids')+' (inclui a zona da assinatura). Reduza o corpo, use «Ajustar para caber» ou mude a posição na aba Legendas.','legenda');
  var coord=F.filter(function(f){return COORD.test(f.leg||'')});
  if(coord.length)B('O texto da '+(coord.length===1?'foto ':'s fotos ')+coord.map(function(f){return f.n}).join(', ')+' tem coordenadas. Troque por uma cidade.','legenda');
  /* ---- Pede confirmação ---- */
  /* D-207: folha de polaroids incompleta (no Modo Folhas): quantas faltam para fechar a página */
  if(!C.col&&!R.erro&&R.sheets.length){var per=R.g.n||0;
    R.sheets.forEach(function(sh,i){var k=sh.cells.length;if(per&&k<per)P('Folha '+(i+1)+': '+k+' de '+per+' polaroids. '+(per-k===1?'Falta 1 foto':'Faltam '+(per-k)+' fotos')+' para completar a página. Deseja voltar e completar?','fotos')})}
  /* D-130: mesmo cálculo das folhas (C.ppi) e mesmo limite do ponto de qualidade; o número só aqui, entre parênteses */
  var ru=[];F.forEach(function(f,k){var p=C.ppi&&C.ppi(f);if(!p&&!(window.PLTEXTO&&PLTEXTO.ehReal()))p=ppiDe(F,k);if(p&&(window.PLQUALIDADE?PLQUALIDADE.nivel(p)==='borrada':p<150))ru.push({n:f.n,p:p})});
  if(ru.length&&!RD)P((ru.length===1?'A foto ':'As fotos ')+ru.slice(0,6).map(function(x){return x.n+' ('+x.p+' PPI)'}).join(', ')+(ru.length>6?' e mais '+(ru.length-6):'')+(ru.length===1?' pode sair borrada':' podem sair borradas')+'. Diminua o zoom, escolha um formato menor ou use uma foto maior.');
  /* D-207: uma ou poucas fotos sem legenda quando a maioria tem (com a legenda à vista em todas as polaroids) */
  var legVis=!(LG&&LG.original)&&!(LG&&LG.txt&&LG.txt.on===false)&&!(R.sheets||[]).some(function(s){return s.legendas&&s.legendas!=='todas'});
  if(legVis&&F.length>2){var sem=F.filter(function(f){return!String(f.leg||'').trim()}).map(function(f){return f.n});
    if(sem.length&&sem.length<F.length/2)P((sem.length===1?'A foto '+sem[0]+' está sem legenda':'As fotos '+nums(sem.slice(0,8))+(sem.length>8?' e mais '+(sem.length-8):'')+' estão sem legenda')+', e as outras têm. Deseja voltar e escrever?','legenda')}
  var arq=F.filter(function(f){return ARQ.test(String(f.leg||'').trim())});
  if(arq.length)P('O texto da '+(arq.length===1?'foto ':'s fotos ')+arq.map(function(f){return f.n}).join(', ')+' parece um nome de arquivo (como IMG_0234).','legenda');
  var sd=data?F.filter(function(f){return f.m&&!f.m.iso}).length:0,sl=loc?F.filter(function(f){return f.m&&!f.m.c}).length:0;
  if(sd)P(pl(sd,'foto está','fotos estão')+' sem data, com a linha de data ligada.','legenda');
  if(sl)P(pl(sl,'foto está','fotos estão')+' sem local, com a linha de local ligada.','legenda');
  var cal=false;try{cal=sessionStorage.getItem('pl-calibrou')==='1'||Object.keys(JSON.parse(localStorage.getItem('pl-calib')||'{}')).some(function(k){return k.split('|')[1]===window.PLFOLHAS.papel(D).n})}catch(e){}
  if(!cal&&!RD&&!C.col)P('Sua impressora ainda não foi calibrada. Imprima a página de teste antes do lote.');
  if(S.margem<NAO_IMPRIMIVEL&&!RD)P('A margem de '+nf(D.margem)+' mm pode ser menor que a área não imprimível da sua impressora.');
  /* ---- Informa ---- */
  var n=R.erro?0:R.sheets.length,ant=null;try{ant=+sessionStorage.getItem('pl-prevoo-folhas')||null}catch(e){}
  if(RD)inf.push(pl(Math.max(1,n),'imagem','imagens')+' de '+RD.w+' × '+RD.h+' px, sem gastar folha.');
  else inf.push('Tamanho estimado: cerca de '+nf(Math.max(1,n)*MB_FOLHA)+' MB em 1 arquivo.');
  if(ant&&ant!==n&&n&&!RD)inf.push(pl(ant,'folha','folhas')+' → '+pl(n,'folha','folhas')+' desde a última revisão.');
  if(C.col&&(R.sheets||[]).some(function(s){return s.legendas==='uma'}))inf.push('As polaroids se encostam na colagem: a legenda aparece só na de cima.');
  if(C.col&&(R.sheets||[]).some(function(s){return s.legendas==='caixa'}))inf.push('As legendas vão numa caixa de texto embaixo da colagem.');
  inf.push(D.assin?'A assinatura PolarLife está ligada.':'A assinatura PolarLife está desligada.');
  return{bl:bl,pe:pe,inf:inf,blA:blA,peA:peA,n:n,por:R.erro?0:R.g.n,papel:window.PLFOLHAS.papel(S),aprov:R.erro?0:C.aprov(R),orient:S.orient,rede:RD,col:!!C.col}
}

function lista(cls,ico,rot,arr,ac){
  if(!arr.length)return'';
  return'<section class="pv__g pv__g--'+cls+'" aria-label="'+rot+'"><h3 class="pv__h"><svg class="ico sm" aria-hidden="true"><use href="#'+ico+'"/></svg><span>'+rot+'</span><span class="mono pv__n">'+arr.length+'</span></h3><ul class="pv__l">'
   +arr.map(function(t,i){var a=ac&&ac[i]&&ACAO[ac[i]];return'<li><svg class="ico sm" aria-hidden="true"><use href="#'+ico+'"/></svg><span>'+esc(t)+(a?'<button type="button" class="btn2 btn2--sm pv__ac" data-pv-ac="'+ac[i]+'">'+a.rot+'</button>':'')+'</span></li>'}).join('')+'</ul></section>'
}
/* D-207: as folhas em miniatura (posição de cada polaroid, como na mesa) com o que está cheio e o que falta */
function visao(){
  var C=window.PLEDITOR.ctx(),R=C.R,FR=C.FR;if(R.erro||!R.sheets.length)return'';
  var p=window.PLFOLHAS.papel(C.S||C.D),W=58,k=W/p.w,H=Math.round(p.h*k),per=R.g.n||0,MX=12,fw=FR.ori==='h'?FR.h:FR.w,fh=FR.ori==='h'?FR.w:FR.h;
  var h=R.sheets.slice(0,MX).map(function(sh,i){
    var cel=sh.cells.map(function(c){var s=c.s||1,w=fw*s*k,hh=fh*s*k,cx=(c.x+c.w/2)*k,cy=(c.y+c.h/2)*k,a=(c.giro?90:0)+(c.rot||0);
      return'<i style="left:'+(cx-w/2).toFixed(1)+'px;top:'+(cy-hh/2).toFixed(1)+'px;width:'+w.toFixed(1)+'px;height:'+hh.toFixed(1)+'px;transform:rotate('+a+'deg)"></i>'}).join('');
    var falta=!C.col&&per&&sh.cells.length<per?per-sh.cells.length:0;
    return'<li class="pv__fo'+(falta?' is-falta':'')+'"><span class="pv__fp" style="width:'+W+'px;height:'+H+'px">'+cel+'</span><span class="pv__fl">'+(C.rede?'Imagem ':'Folha ')+(i+1)
      +(falta?'<em><svg class="ico sm" aria-hidden="true"><use href="#i-warn"/></svg>'+(falta===1?'falta 1':'faltam '+falta)+'</em>':'<small>'+pl(sh.cells.length,'polaroid','polaroids')+'</small>')+'</span></li>'}).join('');
  var mais=R.sheets.length>MX?'<li class="pv__fo pv__fo--mais"><span>e mais '+(R.sheets.length-MX)+'</span></li>':'';
  return'<section class="pv__vis" aria-label="Folhas em miniatura"><ul class="pv__fs">'+h+mais+'</ul></section>'
}
/* D-207: interruptores do arquivo, no mesmo estado das abas (PLEDITOR.opcao) */
function ajustes(){
  var C=window.PLEDITOR.ctx(),D=C.D,h='';
  function sw(id,rot,aj,on,fixo){return'<div class="pv__sw"><div><span class="pv__swt">'+rot+'</span><span class="pv__swh">'+aj+'</span></div><button type="button" class="sw" data-pv-op="'+id+'" role="switch" aria-checked="'+!!on+'"'+(fixo?' aria-disabled="true"':'')+' aria-label="'+rot+'"><span></span></button></div>'}
  if(!C.col){h+=sw('guias','Guias de corte','Linhas tracejadas e suaves para recortar.',D.guias);h+=sw('rodape','Rodapé','Nome do projeto e número da folha, na margem.',D.rodape)}
  else if(window.PLCOLAGEM)h+=sw('sombra','Sombra nas polaroids','Separa a polaroid do fundo, sem contorno.',PLCOLAGEM.norm(C.C).sombra);
  h+=sw('assin','Assinatura PolarLife','Marca discreta no canto da moldura.'+(C.podeAssin?'':' No Pro dá para tirar.'),D.assin,!C.podeAssin);
  return'<section class="pv__aj" aria-labelledby="pv-aj-t"><h3 class="pv__h" id="pv-aj-t"><svg class="ico sm" aria-hidden="true"><use href="#i-panel"/></svg><span>Ajustes do arquivo</span></h3>'+h+'</section>'
}
function monta(){
  if($('pv-dlg'))return;
  var sc=document.createElement('div');sc.className='scrim led-scrim';sc.id='pv-scrim';sc.hidden=true;
  var d=document.createElement('div');d.className='dialog pv led-dialog led-box led-box--3';d.id='pv-dlg';d.setAttribute('role','alertdialog');d.setAttribute('aria-modal','true');
  d.setAttribute('aria-labelledby','pv-t');d.setAttribute('aria-describedby','pv-d');d.hidden=true;
  d.innerHTML='<div class="pv__top"><svg class="ico pv__ico" aria-hidden="true"><use href="#i-verified"/></svg><h2 class="led-dialog__title" id="pv-t">Tudo pronto para o papel?</h2></div><p id="pv-d"></p>'
   +'<dl class="pv__grid"><div><dt class="rotulo">Total de folhas</dt><dd id="pv-f"></dd></div><div><dt class="rotulo">Disposição</dt><dd id="pv-p"></dd></div><div><dt class="rotulo">Aproveitamento</dt><dd id="pv-a"></dd></div></dl>'
   +'<div id="pv-vis"></div><div id="pv-l"></div><div id="pv-aj"></div><div id="pv-in"></div>'
   +'<div class="dialog__act led-dialog__actions">'   /* D-207: a confirmação fica na barra fixa, sempre à vista junto do botão */
   +'<label class="chk pv__ok" id="pv-okl" hidden><input type="checkbox" id="pv-ok"><span class="chk__b" aria-hidden="true"><svg class="ico"><use href="#i-check"/></svg></span><span>Revisei e quero continuar</span></label>'
   +'<p class="pv__why mono" id="pv-w" hidden></p>'
   +'<button type="button" class="btn2 btn2--lg" id="pv-v">Voltar e ajustar</button>'
   +'<button type="button" class="led-btn led-btn--light" id="pv-g"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content"><span id="pv-gt">Gerar PDF</span></span></button></div>';
  document.body.appendChild(sc);document.body.appendChild(d);
  $('pv-v').onclick=sc.onclick=function(){fecha()};
  $('pv-ok').onchange=function(){confirmou=this.checked;estado()};
  d.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-pv-ac],[data-pv-op]');if(!b)return;
    if(b.hasAttribute('data-pv-ac')){var a=ACAO[b.getAttribute('data-pv-ac')];if(a)a.ir();return}
    if(b.getAttribute('aria-disabled')==='true')return;
    var k=b.getAttribute('data-pv-op');if(window.PLEDITOR.opcao&&PLEDITOR.opcao(k)){setTimeout(function(){mostrar(true);var x=d.querySelector('[data-pv-op="'+k+'"]');if(x)x.focus()},0)}
  });
  $('pv-g').onclick=function(){
    if(this.disabled)return;
    var C=window.PLEDITOR.ctx(),S=C.S||C.D,pp=window.PLFOLHAS.papel(S);
    try{sessionStorage.setItem('pl-prevoo-folhas',String(itens.n));
      sessionStorage.setItem('pl-prevoo',JSON.stringify({ok:true,k:chave(),n:itens.n,fotos:C.FOTOS.length,papel:pp.n,w:pp.w,h:pp.h,orient:S.orient,por:itens.por,col:!!C.col,rede:itens.rede||null}))}catch(e){}   /* D-195: a exportação sabe se é colagem e se é imagem para as redes */
    fecha(true);location.href='exportar/'                 /* T-19: escolher o formato */
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
  var arq=itens.rede||itens.col?'a imagem':'o PDF';
  w.textContent=b?'Resolva '+pl(b,'item que bloqueia','itens que bloqueiam')+' para gerar '+arq+'.':!ok?'Marque «Revisei e quero continuar» para gerar '+arq+'.':''
}
function mostrar(mudou){
  itens=analisar();if(mudou)confirmou=false;var n=itens.n,b=itens.bl.length,c=itens.pe.length;
  var arq=itens.rede||itens.col?'a imagem':'o PDF';
  $('pv-t').textContent=itens.rede?'Tudo pronto para compartilhar?':'Tudo pronto para o papel?';
  $('pv-d').textContent=b?(b===1?'1 item impede de gerar '+arq+'.':b+' itens impedem de gerar '+arq+'.')+' Ajuste e revise de novo.'
    :c?'Está quase. '+pl(c,'item pede','itens pedem')+' a sua confirmação antes de gerar.'
    :'Nada impede a geração. Revise o resumo e gere '+arq+'.';
  $('pv-f').textContent=b&&!n?'—':String(n);
  $('pv-p').textContent=itens.por?(itens.rede?itens.por+' por imagem · '+itens.papel.n:pl(itens.por,'por folha','por folha')+' · '+itens.papel.n+' '+(itens.orient==='paisagem'?'paisagem':'retrato')):'—';
  $('pv-f').previousElementSibling.textContent=itens.rede?'Total de imagens':'Total de folhas';
  $('pv-a').textContent=itens.por&&itens.aprov!=null?itens.aprov+'%':'—';
  $('pv-vis').innerHTML=visao();
  $('pv-l').innerHTML=lista('bl','i-x','Bloqueia',itens.bl,itens.blA)+lista('pe','i-warn','Pede confirmação',itens.pe,itens.peA);   /* D-207: avisos, ajustes e só depois as informações */
  $('pv-aj').innerHTML=ajustes();
  $('pv-in').innerHTML=lista('in','i-info','Informa',itens.inf);
  $('pv-ok').checked=confirmou;
  $('pv-gt').textContent=itens.rede||itens.col?'Gerar imagem'+(n>1?'ns ('+n+')':''):'Gerar PDF'+(n?' ('+pl(n,'folha','folhas')+')':'');
  estado()
}
function abrir(origem){
  monta();disparo=origem||document.activeElement;confirmou=false;
  mostrar(false);
  $('pv-scrim').hidden=$('pv-dlg').hidden=false;
  var alvo=itens.bl.length?$('pv-v'):($('pv-ok').offsetParent?$('pv-ok'):$('pv-g'));try{alvo.focus({preventScroll:true})}catch(e){alvo.focus()}
  $('pv-dlg').scrollTop=0   /* D-207: abre no começo (resumo e miniaturas), não no fim */
}
function fecha(semFoco){
  $('pv-scrim').hidden=$('pv-dlg').hidden=true;
  if(semFoco!==true&&disparo&&disparo.focus)disparo.focus()
}
window.PLPREVOO={abrir:abrir,analisar:function(){return analisar()}};
if(location.hash==='#revisar')setTimeout(function(){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}abrir($('go'))},0)   /* abre uma vez; recarregar não reabre */
})();
