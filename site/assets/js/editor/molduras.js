/* T-12 · Inspetor · aba MOLDURAS · DOC-05 FN-03 · estado do projeto em ST[0].fr (entra no histórico do quadro.js)
   Moldura sempre branca: não há seletor de cor. Janela com proporção própria (etapa 25): fr.jh é a altura da janela; o motor de recorte usa FR.jw ÷ FR.jh.
   Orientação (etapa 27, D-109): fr.ori = 'v' (em pé, faixa grossa embaixo) ou 'h' (girada 90° no sentido horário, faixa grossa à esquerda). As medidas de fr ficam sempre da moldura em pé; Q.FR recebe a versão já girada (w, h, lado, ladoD, topo, jw, jh) e a versão em pé (cw, ch, cl, ct, cjw, cjh) para a legenda. */
(function(){
var Q=window.PLQ;if(!Q)return;
var $=function(i){return document.getElementById(i)};
/* [id, nome, largura, altura, ativo, margem lateral, faixa superior, altura da janela]
   Pocket 66×99 com janela 60×79 (etapa 34, D-113). Janelas oficiais da Fujifilm: Mini 46×62, Square 62×62, Wide 99×62 (etapa 26, D-108).
   Faixa superior do Mini, Square e Wide: [RECOMENDADO] (medir filme real). */
var FMT=[['classico','Clássico',88,107,1,6,6,76],['mini','Mini quadrado',60,73,1,6,6,48],['pocket','Retro Pocket',66,99,1,3,3,79],['imini','Instax Mini',54,86,1,4,5,62],['isq','Instax Square',72,86,1,5,5,62],['iwide','Instax Wide',108,86,1,4.5,5,62],['pers','Personalizado',88,107,1,6,6,76]];
var UN={mm:{f:1,d:1,u:'mm'},cm:{f:10,d:2,u:'cm'},pol:{f:25.4,d:3,u:'pol'}};
var un='mm',err=null,built=false;
try{un=sessionStorage.getItem('pl-unidade')||(window.PLCONTA&&PLCONTA.preferencias?PLCONTA.preferencias().unidade:'mm')}catch(e){}   /* sem escolha na aba, vale a preferência da Conta */
if(!UN[un])un='mm';
var CAMPOS=[['w','Largura externa'],['h','Altura externa'],['jw','Largura da janela'],['jh','Altura da janela'],['lado','Margem lateral'],['topo','Faixa superior'],['bt','Faixa inferior (passe-partout)'],['rad','Cantos arredondados']];

function F(){var s=Q.ST()[0];if(!s.fr)s.fr={fmt:'classico',w:88,h:107,jh:76,lado:6,topo:6,rad:.4,man:false,lock:true,ori:'v'};
  if(s.fr.ori!=='h')s.fr.ori='v';                                      /* projeto salvo antes da etapa 27: em pé */
  if(!(s.fr.jh>0))s.fr.jh=r2(s.fr.w-2*s.fr.lado);                    /* projeto salvo antes da etapa 25: janela quadrada */
  return s.fr}
function der(f){var jw=r2(f.w-2*f.lado);return{jw:jw,jh:f.jh,bt:r2(f.h-f.topo-f.jh)}}
function quad(f){return Math.abs(f.jh-(f.w-2*f.lado))<.005}      /* janela quadrada acompanha a largura */
function r2(v){return Math.round(v*100)/100}
function v2s(mm){var u=UN[un],p=Math.pow(10,u.d);return String(Math.round(mm/u.f*p)/p).replace('.',',')}
function s2mm(t){var n=parseFloat(String(t).trim().replace(',','.'));return isFinite(n)?n*UN[un].f:NaN}
function faixa(a,b){return'Use entre '+v2s(a)+' e '+v2s(b)+' '+UN[un].u+'.'}
function chk(f){var d=der(f);
  if(f.w<30||f.w>200)return['w',faixa(30,200)];
  if(f.h<40||f.h>250)return['h',faixa(40,250)];
  if(f.lado<2||f.lado>20)return['lado',faixa(2,20)];
  if(f.topo<2||f.topo>20)return['topo',faixa(2,20)];
  if(d.jw<20)return['jw','A janela precisa de pelo menos '+v2s(20)+' '+UN[un].u+'.'];
  if(d.jh<20)return['jh','A janela precisa de pelo menos '+v2s(20)+' '+UN[un].u+'.'];
  if(d.jh>d.jw*2.5||d.jw>d.jh*2.5)return['jh','A proporção da janela vai de 2,5 : 1 a 1 : 2,5.'];
  if(d.bt<10)return['bt','A faixa inferior precisa de pelo menos '+v2s(10)+' '+UN[un].u+'.'];
  if(f.rad<0||f.rad>6)return['rad',faixa(0,6)];
  return null}
function mutar(f,k,v){var g=JSON.parse(JSON.stringify(f)),s,sq=quad(f);
  if(k==='w'||k==='h'){s=f.man?v/f[k]:1;if(f.man){g.w=r2(f.w*s);g.h=r2(f.h*s);g.lado=r2(f.lado*s);g.topo=r2(f.topo*s);g.jh=r2(f.jh*s)}else g[k]=v}
  else if(k==='jw'){g.lado=r2((f.w-v)/2);if(f.lock)g.topo=g.lado}
  else if(k==='lado'){g.lado=v;if(f.lock)g.topo=v}
  else if(k==='topo'){g.topo=v;if(f.lock)g.lado=v}
  else if(k==='jh'){g.jh=v;g.h=r2(f.topo+v+der(f).bt)}      /* a faixa inferior se mantém; a altura externa acompanha */
  else if(k==='bt'){g.h=r2(f.topo+f.jh+v)}
  else if(k==='rad'){g.rad=v}
  if(sq&&k!=='jh'&&k!=='h'&&k!=='bt'&&k!=='rad')g.jh=r2(g.w-2*g.lado);
  if(k!=='rad')g.fmt='pers';
  return g}

/* atalhos de medida (etapa 26, D-108 · [RECOMENDADO]): cada atalho só preenche campos que a pessoa também pode digitar */
var PRE=[['prop','Proporção da janela',[['1:1',1,1],['4:5',4,5],['3:4',3,4],['2:3',2,3],['5:4',5,4],['4:3',4,3],['3:2',3,2],['16:9',16,9]],'largura × altura'],
  ['bt','Faixa inferior',[['Fina',12],['Média',19],['Clássica',25],['Extra',32]],'espaço para a legenda'],
  ['mg','Margens',[['Fina',3],['Instax',4.5],['Clássica',6],['Larga',9]],'lateral e superior'],
  ['rad','Cantos',[['Reto',0],['Fino',.4],['Suave',1.5],['Redondo',3]],'arredondamento']];
function preOn(n,f){var g=PRE[n][0],d=der(f),a=PRE[n][2];return a.map(function(x){
  if(g==='prop')return Math.abs(d.jh-d.jw*x[2]/x[1])<.06;
  if(g==='bt')return Math.abs(d.bt-x[1])<.06;
  if(g==='mg')return Math.abs(f.lado-x[1])<.01&&Math.abs(f.topo-x[1])<.01;
  return Math.abs(f.rad-x[1])<.001})}
function preMut(n,i,f){var g=PRE[n][0],x=PRE[n][2][i],d=der(f);
  if(g==='prop')return mutar(f,'jh',r2(d.jw*x[2]/x[1]));
  if(g==='bt')return mutar(f,'bt',x[1]);
  if(g==='mg'){var h=JSON.parse(JSON.stringify(f));h.lock=true;var r=mutar(h,'lado',x[1]);r.lock=f.lock;return r}
  return mutar(f,'rad',x[1])}
function preHtml(){var h='<section class="mod" aria-labelledby="mo-h3"><h3 class="mod__h rotulo rotulo--m" id="mo-h3">Personalizar</h3><p class="f__h"><svg class="ico sm"><use href="#i-info"/></svg><span>Atalhos de medida. Você pode digitar qualquer valor em Medidas.</span></p>';
  PRE.forEach(function(g,k){h+='<fieldset class="pre"><legend>'+g[1]+' <span class="mono">'+g[3]+'</span></legend><div class="pre__g'+(g[0]==='prop'?' pre__g--8':'')+'">';
    g[2].forEach(function(x,i){h+='<button type="button" class="pre__b" data-pre="'+k+'" data-i="'+i+'" aria-pressed="false"><svg class="ico sm" aria-hidden="true"><use href="#i-check"/></svg><span>'+x[0]+'</span>'+(g[0]==='bt'||g[0]==='mg'||g[0]==='rad'?'<span class="mono">'+(x[1]).toString().replace('.',',')+' mm</span>':'')+'</button>'});
    h+='</div></fieldset>'});
  return h+'</section>'}
/* orientação (etapa 27, D-109 · [RECOMENDADO]): gira a moldura inteira 90°; a faixa grossa vai para a esquerda e a legenda gira junto */
var ORI=[['v','Vertical','em pé · faixa grossa embaixo'],['h','Horizontal','deitada · faixa grossa à esquerda']];
function oriHtml(){var h='<section class="mod" aria-labelledby="mo-ho"><h3 class="mod__h rotulo rotulo--m" id="mo-ho">Orientação</h3><div class="pre__g pre__g--2" id="mo-ori" role="group" aria-label="Orientação da polaroid">';
  ORI.forEach(function(o){h+='<button type="button" class="pre__b pre__b--ori" data-ori="'+o[0]+'" aria-pressed="false"><svg class="ico sm" aria-hidden="true"><use href="#i-check"/></svg><span class="ori__i ori__i--'+o[0]+'" aria-hidden="true"></span><span>'+o[1]+'</span><span class="mono">'+o[2]+'</span></button>'});
  return h+'</div><p class="f__h"><svg class="ico sm"><use href="#i-info"/></svg><span>Gira a polaroid inteira, com a legenda. As medidas abaixo continuam as da polaroid em pé. Atalho: R.</span></p></section>'}
function girar(o){var f=JSON.parse(JSON.stringify(F()));if(f.ori===o)return;f.ori=o;err=null;grava(f,'mo:ori');
  Q.toast('Orientação: '+(o==='h'?'Horizontal':'Vertical')+' · '+folhasDe(f)+' · Desfazer',true)}
function nome(id){return FMT.filter(function(x){return x[0]===id})[0][1]}

function aplicar(){var f=F(),d=der(f),R=Q.FR,h=f.ori==='h';
  R.ori=f.ori;R.cw=f.w;R.ch=f.h;R.cl=f.lado;R.ct=f.topo;R.cjw=d.jw;R.cjh=d.jh;      /* moldura em pé (a legenda é desenhada nela e girada junto) */
  if(h){R.w=f.h;R.h=f.w;R.lado=d.bt;R.ladoD=f.topo;R.topo=f.lado;R.jw=d.jh;R.jh=d.jw}  /* girada 90° no sentido horário: a faixa grossa vai para a esquerda */
  else{R.w=f.w;R.h=f.h;R.lado=f.lado;R.ladoD=f.lado;R.topo=f.topo;R.jw=d.jw;R.jh=d.jh}
  R.rad=f.rad}
function cota(){var f=F();return(f.ori==='h'?'Passe-partout lateral: ':'Passe-partout inferior: ')+v2s(der(f).bt)+' '+UN[un].u}

/* réguas na mesa: só com a aba Molduras aberta */
function ligada(){var t=$('tab-molduras');return!!t&&t.getAttribute('aria-selected')==='true'}
function regua(){var pq=Q.pw(),on=ligada();pq.classList.toggle('has-rg',on);
  [].slice.call(pq.querySelectorAll('.rg')).forEach(function(n){n.remove()});
  if(!on)return;
  var f=F(),maj=un==='pol'?25.4:10,mnr=un==='pol'?6.35:5;
  pq.appendChild(reg('x',Q.FR.w,pq.clientWidth,maj,mnr));pq.appendChild(reg('y',Q.FR.h,pq.clientHeight,maj,mnr))}
function reg(ax,mm,px,maj,mnr){
  var x=ax==='x',s=document.createElementNS('http://www.w3.org/2000/svg','svg'),n=Math.floor(mm/mnr+1e-6),h='',i,v,p,g,m;
  s.setAttribute('class','rg rg--'+ax);s.setAttribute('aria-hidden','true');
  s.setAttribute('width',x?px:36);s.setAttribute('height',x?18:px);
  for(i=0;i<=n;i++){v=i*mnr;p=v/mm*px;m=Math.abs(v/maj-Math.round(v/maj))<1e-6;g=m?10:5;
    h+=x?'<path d="M'+p+' 18V'+(18-g)+'" stroke="currentColor" stroke-width="1"/>':'<path d="M36 '+p+'H'+(36-g)+'" stroke="currentColor" stroke-width="1"/>';
    if(m)h+=x?'<text x="'+(p+3)+'" y="9" fill="currentColor">'+v2s(v)+'</text>':'<text x="0" y="'+(p+12)+'" fill="currentColor">'+v2s(v)+'</text>'}
  s.innerHTML=h;return s}

/* painel */
function montar(){
  var p=$('p-molduras'),h='';
  h+='<section class="mod" aria-labelledby="mo-h1"><h3 class="mod__h rotulo rotulo--m" id="mo-h1">Formato</h3><ul class="fmt" id="mo-fmt">';
  FMT.forEach(function(x){h+='<li><button type="button" class="fmt__b" data-fmt="'+x[0]+'"'+(x[4]?'':' disabled')+'><span>'+x[1]+'</span>'+(x[0]==='pers'?'<span class="rotulo">Medidas livres</span>':'<span class="mono">'+x[2]+' × '+x[3]+' mm</span>')+(x[4]?'':'<em class="rotulo">Em breve</em>')+'</button></li>'});
  h+='</ul></section>';
  h+=oriHtml();
  h+=preHtml();
  h+='<section class="mod" aria-labelledby="mo-h2"><h3 class="mod__h rotulo rotulo--m" id="mo-h2">Medidas</h3>';
  h+='<div class="seg" role="radiogroup" aria-label="Unidade das medidas">';
  Object.keys(UN).forEach(function(k){h+='<label class="seg__o"><input type="radio" name="mo-un" value="'+k+'"><span>'+UN[k].u+'</span></label>'});
  h+='</div>';
  CAMPOS.forEach(function(c){h+='<div class="f" data-k="'+c[0]+'"><div class="f__top"><label class="f__l" for="mo-'+c[0]+'">'+c[1]+'</label></div><div class="num"><input id="mo-'+c[0]+'" inputmode="decimal" autocomplete="off"><span class="num__u mono" data-u></span></div><p class="f__h" hidden><svg class="ico sm"><use href="#i-cancel"/></svg><span></span></p></div>'});
  h+='<label class="mo-chk"><input type="checkbox" id="mo-lock"><span>Margem uniforme (cadeado): lateral e superior andam juntas</span></label>';
  h+='<label class="mo-chk"><input type="checkbox" id="mo-man"><span>Manter proporções do formato</span></label>';
  h+='<p class="f__h"><svg class="ico sm"><use href="#i-info"/></svg><span>A moldura é sempre branca e pertence à foto: não muda o papel nem o espaço entre polaroids.</span></p>';
  h+='<button type="button" class="btn2" id="mo-reset">Resetar formato</button></section>';
  p.innerHTML=h;built=true;
  p.addEventListener('change',function(e){var t=e.target;
    if(t.name==='mo-un'){un=t.value;try{sessionStorage.setItem('pl-unidade',un)}catch(x){}err=null;render();return}
    if(t.id==='mo-lock'||t.id==='mo-man'){var f=JSON.parse(JSON.stringify(F()));if(t.id==='mo-lock'){f.lock=t.checked;if(f.lock)f.topo=f.lado}else f.man=t.checked;grava(f,'mo:opt');return}
    var k=t.id.slice(3),mm=s2mm(t.value);
    if(!isFinite(mm)){err={k:k,m:'Digite um número.'};render();return}
    var g=mutar(F(),k,mm),e2=chk(g);
    if(e2){err={k:k,m:e2[1]};render();return}
    err=null;grava(g,'mo:'+k)});
  p.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-fmt')&&!b.disabled){var id=b.getAttribute('data-fmt'),x=FMT.filter(function(y){return y[0]===id})[0],g=JSON.parse(JSON.stringify(F()));
      if(F().fmt===id)return;                                  /* já é este formato */
      g.fmt=id;if(id!=='pers'){g.w=x[2];g.h=x[3];g.lado=x[5];g.topo=x[6];g.jh=x[7]}
      confirmarFormato(g,x,b)}
    if(b.hasAttribute('data-ori')){girar(b.getAttribute('data-ori'));return}
    if(b.hasAttribute('data-pre')){var k=+b.getAttribute('data-pre'),i=+b.getAttribute('data-i'),g2=preMut(k,i,F()),e3=chk(g2);
      if(e3){err={k:e3[0],m:e3[1]};render();return}
      err=null;grava(g2,'mo:pre');return}
    if(b.id==='mo-reset'){err=null;grava({fmt:'classico',w:88,h:107,jh:76,lado:6,topo:6,rad:.4,man:false,lock:true,ori:'v'},'mo:reset')}})}

/* pop-up «Trocar formato» com antes e depois e o novo número de folhas (FN-03) · foco preso · Esc mantém */
var fV,fG=null,fX=null;
function folhasDe(f){var o=(PLFOLHAS.lerFolhas||PLFOLHAS.ler)(),n=Q.N,v=0,i;for(i=1;i<=n;i++)if(Q.vert(i))v++;
  var h=f.ori==='h',r=PLFOLHAS.contar(o,{w:h?f.h:f.w,h:h?f.w:f.h},n,v),p=PLFOLHAS.papel(o);
  return r.naoCabe?'não cabe em '+p.n:r.folhas+(r.folhas===1?' folha':' folhas')+' em '+p.n}
function medida(f){var h=f.ori==='h';return v2s(h?f.h:f.w)+' × '+v2s(h?f.w:f.h)+' '+UN[un].u}
function dialogoFmt(){
  if($('fmt-dlg'))return;
  var sc=document.createElement('div');sc.className='scrim';sc.id='fmt-scrim';sc.hidden=true;
  var d=document.createElement('div');d.className='dialog';d.id='fmt-dlg';d.setAttribute('role','alertdialog');d.setAttribute('aria-modal','true');
  d.setAttribute('aria-labelledby','fmt-t');d.setAttribute('aria-describedby','fmt-d');d.hidden=true;
  d.innerHTML='<h2 id="fmt-t"></h2><p id="fmt-d">A moldura vale para todas as fotos do projeto. O papel e o espaço entre polaroids não mudam.</p>'
    +'<div class="antdep" role="group" aria-label="Antes e depois"><div><span class="rotulo antdep__k">Antes</span><strong id="fmt-a1"></strong><span class="mono" id="fmt-a2"></span><span class="mono" id="fmt-a3"></span></div>'
    +'<div><span class="rotulo antdep__k">Depois</span><strong id="fmt-d1"></strong><span class="mono" id="fmt-d2"></span><span class="mono" id="fmt-d3"></span></div></div>'
    +'<div class="dialog__act"><button type="button" class="btn2 btn2--lg" id="fmt-nao">Manter formato atual</button>'
    +'<button type="button" class="led-btn led-btn--light" id="fmt-sim"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content"><span>Trocar formato</span></span></button></div>';
  document.body.appendChild(sc);document.body.appendChild(d);
  $('fmt-nao').onclick=function(){fechaFmt()};sc.onclick=function(){fechaFmt()};
  $('fmt-sim').onclick=function(){var g=fG,x=fX;fechaFmt(true);err=null;
    if(x[0]==='pocket'&&window.PLLEG)PLLEG.padraoPocket();   /* D-113: entra no Pocket com a legenda em duas linhas */
    grava(g,'mo:fmt');Q.toast('Formato: '+x[1]+' · '+folhasDe(g)+' · Desfazer',true)};
  document.addEventListener('keydown',function(e){
    if(d.hidden)return;
    if(e.key==='Escape'){e.preventDefault();fechaFmt();return}
    if(e.key!=='Tab')return;
    var a=$('fmt-nao'),z=$('fmt-sim');
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
    else if(document.activeElement!==a&&document.activeElement!==z){e.preventDefault();a.focus()}
  })}
function confirmarFormato(g,x,origem){
  dialogoFmt();fG=g;fX=x;fV=origem;var f=F();
  $('fmt-t').textContent='Trocar para '+x[1]+'?';
  $('fmt-a1').textContent=nome(f.fmt);$('fmt-a2').textContent=medida(f);$('fmt-a3').textContent=folhasDe(f);
  $('fmt-d1').textContent=x[1];$('fmt-d2').textContent=medida(g);$('fmt-d3').textContent=folhasDe(g);
  $('fmt-scrim').hidden=$('fmt-dlg').hidden=false;$('fmt-nao').focus()}
function fechaFmt(semFoco){
  $('fmt-scrim').hidden=$('fmt-dlg').hidden=true;
  if(semFoco!==true&&fV&&fV.focus)fV.focus()}
function grava(g,k){var st=Q.ST(),i;st[0].fr=g;aplicar();
  for(i=1;i<st.length;i++)Q.acertar(i,st[i]);                 /* a nova janela precisa continuar coberta em todas as fotos */
  Q.commit(k)}

function render(){
  aplicar();if(!built)montar();
  var f=F(),d=der(f),v={w:f.w,h:f.h,jw:d.jw,jh:d.jh,lado:f.lado,topo:f.topo,bt:d.bt,rad:f.rad},p=$('p-molduras');
  CAMPOS.forEach(function(c){var k=c[0],box=p.querySelector('[data-k="'+k+'"]'),inp=$('mo-'+k),bad=err&&err.k===k,m=box.querySelector('p');
    box.classList.toggle('is-err',!!bad);m.hidden=!bad;if(bad)m.lastChild.textContent=err.m;
    inp.setAttribute('aria-invalid',bad?'true':'false');
    box.querySelector('[data-u]').textContent=UN[un].u;
    if(document.activeElement!==inp&&!bad)inp.value=v2s(v[k])});
  [].slice.call(p.querySelectorAll('[data-fmt]')).forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-fmt')===f.fmt)});
  [].slice.call(p.querySelectorAll('[data-ori]')).forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-ori')===f.ori)});
  [].slice.call(p.querySelectorAll('[data-pre]')).forEach(function(b){var k=+b.getAttribute('data-pre');b.setAttribute('aria-pressed',preOn(k,f)[+b.getAttribute('data-i')])});
  [].slice.call(p.querySelectorAll('[name="mo-un"]')).forEach(function(r){r.checked=r.value===un});
  $('mo-lock').checked=!!f.lock;$('mo-man').checked=!!f.man;
  var cotaEl=$('cota'),cotaLabel=$('cota-label'),cotaValue=$('cota-value'),cotaTexto=cota(),cotaSeparador=cotaTexto.indexOf(':');
  if(cotaEl&&cotaLabel&&cotaValue){cotaLabel.textContent=cotaTexto.slice(0,cotaSeparador+1);cotaValue.textContent=cotaTexto.slice(cotaSeparador+1).trim()}
  else if(cotaEl)cotaEl.textContent=cotaTexto;
  Q.pw().classList.toggle('has-rg',ligada());Q.dim()}

document.addEventListener('keydown',function(e){                  /* R gira a moldura (FN-03); não vale dentro de campos nem com pop-up aberto */
  if(e.key!=='r'&&e.key!=='R')return;if(e.ctrlKey||e.metaKey||e.altKey)return;
  var t=e.target,tg=t&&t.tagName;if(tg==='INPUT'||tg==='SELECT'||tg==='TEXTAREA'||(t&&t.isContentEditable))return;
  var d=$('fmt-dlg');if(d&&!d.hidden)return;if(document.querySelector('.dialog:not([hidden])'))return;
  e.preventDefault();girar(F().ori==='h'?'v':'h')});
window.PLMOL={aplicar:aplicar,render:render,regua:regua,cota:cota,ligada:ligada};
aplicar();
/* projeto novo que veio de «Retro Pocket» (T-02 grava pl-fmt · D-113): aplica a moldura e o padrão de legenda de uma vez */
var pf=window.PLFOLHAS&&PLFOLHAS.formatoInicial?PLFOLHAS.formatoInicial():null;   /* D-159: vale para todos os formatos da T-02 */
if(pf){try{sessionStorage.removeItem('pl-fmt')}catch(e){}
  var sp=Q.ST()[0];
  if(!sp.fr||sp.fr.fmt!==pf.fmt){
    if(pf.fmt==='pocket'&&window.PLLEG)PLLEG.padraoPocket();
    grava(pf,'mo:fmt')}}
render();Q.render()
})();
