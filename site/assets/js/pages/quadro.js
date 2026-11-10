/* T-08 · Editor · Modo Quadro · DOC-05 FN-04 (recorte), FN-05 (ajustes), FN-09 (lote), FN-12 (teclado) · BR-12 (PPI) · dados de exemplo: DOC-04 §6 */
(function(){
/*MOTOR*/
var FR={w:88,h:107,jw:76,jh:76,lado:6,ladoD:6,topo:6,rad:.4,ori:'v',cw:88,ch:107,cl:6,ct:6,cjw:76,cjh:76};   /* Clássico 88 × 107 · janela 76 × 76 · w, h, lado, ladoD, topo, jw, jh já na orientação escolhida (etapa 27); cw… são da moldura em pé */
var VERT={2:1,6:1,9:1,13:1,17:1,21:1};                             /* 6 verticais (T-05) */
var SRCMAP=function(n){return n};                                  /* posição → foto de origem (muda com Duplicar e Remover) */
var ADJ0={brilho:0,contraste:0,saturacao:0,temp:0,realces:0,sombras:0,nitidez:0,vinheta:0};
function copia(o){return JSON.parse(JSON.stringify(o))}
function novo(){return{modo:'preencher',z:100,ang:0,px:0,py:0,rot:0,flip:false,adj:copia(ADJ0),txt:null,flt:{id:'original',int:100}}}
function nat(n){return VERT[SRCMAP(n)]?{w:976,h:1300}:{w:1300,h:976}}      /* pixels da foto de exemplo [HIPÓTESE]: dá 326 PPI a 100% */
function efet(n,s){var a=nat(n);return s.rot%180?{w:a.h,h:a.w}:a}
function jq(){return FR.jw/FR.jh}                                   /* proporção da janela (largura ÷ altura); 1 = quadrada */
function base(n,s){var e=efet(n,s),a=1/e.w,b=1/(jq()*e.h);return s.modo==='encaixar'?Math.min(a,b):Math.max(a,b)}   /* largura da janela por pixel, com zoom 100% (px e py são frações da largura e da altura da janela) */
function zmin(s,n){if(s.modo==='encaixar')return 100;var t=Math.abs(s.ang)*Math.PI/180,c=Math.cos(t),sn=Math.sin(t),q=jq(),e=efet(n,s),
  X=.5*c+sn/(2*q),Y=.5*sn+c/(2*q),k=Math.max(2*X/e.w,2*Y/e.h);        /* caixa da janela girada, em unidades da largura */
  return Math.max(100,Math.ceil(k/base(n,s)*100-1e-9))}   /* endireitar sobe o zoom mínimo */
function aEl(s,x,y){                                               /* vetor da janela → eixos da foto */
  var t=s.ang*Math.PI/180,c=Math.cos(t),sn=Math.sin(t),a=x*c+y*sn,b=-x*sn+y*c;
  if(s.flip)a=-a;
  var r=s.rot*Math.PI/180,cr=Math.cos(r),sr=Math.sin(r);
  return[a*cr+b*sr,-a*sr+b*cr]
}
function cabe(n,s,px,py){                                          /* a janela continua coberta pela foto? */
  if(s.modo==='encaixar')return Math.abs(px)<=.5&&Math.abs(py)<=.5;
  var a=nat(n),k=base(n,s)*s.z/100,hw=a.w*k/2,hh=a.h*k/2,q=jq(),i,j,v;
  for(i=-1;i<=1;i+=2)for(j=-1;j<=1;j+=2){v=aEl(s,i*.5-px,j/(2*q)-py/q);if(Math.abs(v[0])>hw+1e-6||Math.abs(v[1])>hh+1e-6)return false}
  return true
}
function acertar(n,s){                                             /* zoom, ângulo e posição sempre válidos */
  s.ang=Math.round(Math.max(-15,Math.min(15,s.ang))*10)/10;
  s.z=Math.round(Math.min(400,Math.max(zmin(s,n),s.z)));
  if(!cabe(n,s,s.px,s.py)){var lo=0,hi=1,m,i;for(i=0;i<14;i++){m=(lo+hi)/2;if(cabe(n,s,s.px*m,s.py*m))lo=m;else hi=m}s.px*=lo;s.py*=lo}
  return s
}
function ppi(n,s){return Math.round(1/(base(n,s)*s.z/100)/FR.jw*25.4)}   /* BR-12 */
function nivel(p){return p>=240?'boa':p>=180?'abaixo':p>=120?'ressalvas':'ruim'}
function zmaxPara(n,s,alvo){return Math.floor((1/base(n,s))/(alvo*FR.jw/25.4)*100)}
function ajustou(s){return JSON.stringify(s.adj)!==JSON.stringify(ADJ0)||(s.flt&&s.flt.id!=='original')}
function mudou(s){var c=JSON.parse(JSON.stringify(s));delete c.meta;delete c.src;return JSON.stringify(c)!==JSON.stringify(novo())}   /* metadados não contam como ajuste */
/*FIM MOTOR*/

var $=function(i){return document.getElementById(i)},tm;
function toast(m,undo){clearTimeout(tm);$('toast-t').textContent=m;$('toast-undo').hidden=!undo;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
function nf(n,d){return (Math.round(n*(d?10:1))/(d?10:1)).toString().replace('.',',')}
function p2(n){return(n<10?'0':'')+n}
var LEG=['Dias de sol','Nós dois','Dia de rolê','Meu parceiro'];
var N=24,ST=[{}],cur=3,UI={grade:'nenhuma',inteira:false};
function lerLista(){try{var a=JSON.parse(sessionStorage.getItem('pl-fotos')||'null');if(Array.isArray(a)&&a.length>=1&&a.length<=400&&a.every(function(x){return x>=1&&x<=24&&x%1===0}))return a}catch(e){}return null}
var LISTA0=lerLista()||(function(){var a=[];for(var i=1;i<=24;i++)a.push(i);return a})();
function lerQuadro(){                                              /* estado completo guardado ao sair para as Folhas (D-085) */
  try{var o=JSON.parse(sessionStorage.getItem('pl-quadro')||'null');
    if(Array.isArray(o)&&o.length>=2&&o.length<=401&&o[0]&&typeof o[0]==='object'&&o.slice(1).every(function(e){return e&&e.src>=1&&e.src<=24&&e.src%1===0&&e.adj&&e.flt&&typeof e.z==='number'}))return o}catch(e){}
  return null}
var SALVO=lerQuadro();
if(SALVO){ST=SALVO}
else{LISTA0.forEach(function(sr){var e=novo();e.src=sr;
  if(sr===3){e.adj.realces=-20;e.adj.sombras=25;e.adj.vinheta=15}   /* Foto 3 «Ajustada» (DOC-04 §6) */
  if(sr===12)e.z=233;                                               /* Foto 12 «Com ressalvas · 140 PPI» */
  ST.push(e)})}
N=ST.length-1;
SRCMAP=function(n){return ST[n]&&ST[n].src||n};
function src(n){return SRCMAP(n)}
function guardarLista(){try{sessionStorage.setItem('pl-fotos',JSON.stringify(ST.slice(1).map(function(e){return e.src})));sessionStorage.setItem('pl-quadro',JSON.stringify(ST));sessionStorage.setItem('pl-ppi',JSON.stringify(ST.slice(1).map(function(e,i){return ppi(i+1,e)})))}catch(e){}}
var h0=(location.hash.match(/^#foto-(\d+)$/)||[])[1];cur=Math.min(cur,N);if(h0&&+h0>=1&&+h0<=N)cur=+h0;
function S(){return ST[cur]}

/* ---------- ajustes de imagem → filtro (DOC-05 FN-05) ---------- */
function filtro(a){
  var f=1+(a.contraste>=0?a.contraste/100:a.contraste/125),bo=a.brilho/100*.3,tr=1+a.temp/100*.15,tb=1-a.temp/100*.15,ic=.5*(1-f)+bo;
  $('f-sat').setAttribute('values',1+a.saturacao/100);
  var l=$('f-lin').children;l[0].setAttribute('slope',f*tr);l[1].setAttribute('slope',f);l[2].setAttribute('slope',f*tb);
  for(var i=0;i<3;i++)l[i].setAttribute('intercept',ic);
  var g=$('f-gam').children,A=1+a.realces/100*.25,E=1-a.sombras/100*.35;
  for(i=0;i<3;i++){g[i].setAttribute('amplitude',A);g[i].setAttribute('exponent',E)}
}

/* ---------- foto de exemplo (ilustração na paleta; sem rostos nem marcas) ---------- */
function cena(n,vin){
  var sr=src(n),v=VERT[sr],o='<svg viewBox="0 0 '+(v?'300 400':'400 300')+'" preserveAspectRatio="none" aria-hidden="true"><rect width="'+(v?300:400)+'" height="'+(v?400:300)+'" fill="#fff"/>';
  if(v){var sx=60+(sr*47)%180;
    o+='<rect width="300" height="270" fill="#006194" opacity=".14"/><circle cx="'+sx+'" cy="110" r="28" fill="#FD761A"/><path d="M0 270L60 170L110 230L170 130L230 245L300 180V400H0Z" fill="#006194" opacity=".55"/><path d="M0 320L80 240L150 300L220 230L300 310V400H0Z" fill="#000" opacity=".85"/><rect y="362" width="300" height="38" fill="#000"/>'}
  else{var sx2=70+(sr*53)%260;
    o+='<rect width="400" height="200" fill="#006194" opacity=".14"/><circle cx="'+sx2+'" cy="92" r="26" fill="#FD761A"/><path d="M0 205L70 120L120 175L190 95L270 190L330 135L400 200V300H0Z" fill="#006194" opacity=".55"/><path d="M0 240L90 170L160 225L250 160L330 230L400 195V300H0Z" fill="#000" opacity=".85"/><rect y="262" width="400" height="38" fill="#000"/>'}
  if(vin>0)o+='<rect width="'+(v?300:400)+'" height="'+(v?400:300)+'" fill="url(#vg)" opacity="'+(vin/100*.55)+'"/>';
  return o+'</svg>'
}
function estilo(n,s){
  var a=nat(n),k=base(n,s)*s.z/100;
  return 'width:'+a.w*k*100+'%;height:'+a.h*k*jq()*100+'%;left:'+(50+s.px*100)+'%;top:'+(50+s.py*100)+'%;transform:translate(-50%,-50%) rotate('+s.ang+'deg) scaleX('+(s.flip?-1:1)+') rotate('+s.rot+'deg)'
}
var keyMain='';
function pintaMain(){
  var s=S(),key=cur+'|'+s.adj.vinheta;
  if(key!==keyMain){keyMain=key;var c=cena(cur,s.adj.vinheta);$('clip').innerHTML='<div class="ph">'+c+'</div>';$('ghost').innerHTML='<div class="ph">'+c+'</div>'}
  var st=estilo(cur,s);[].forEach.call(document.querySelectorAll('#clip .ph,#ghost .ph'),function(e){e.setAttribute('style',st)});
  filtro(s.adj);if(window.PLFLT)PLFLT.aplicar(s)
}

/* ---------- grade de composição (só na tela) ---------- */
function pintaGrade(){
  var g=UI.grade,fine=document.body.classList.contains('is-endireitando'),L=[];
  if(fine)for(var i=1;i<10;i++){L.push([i*10,0,i*10,100],[0,i*10,100,i*10])}
  else if(g==='tercos')L=[[33.33,0,33.33,100],[66.67,0,66.67,100],[0,33.33,100,33.33],[0,66.67,100,66.67]];
  else if(g==='diagonais')L=[[0,0,100,100],[100,0,0,100],[50,0,50,100],[0,50,100,50]];
  var h='';['gk','gw'].forEach(function(c){L.forEach(function(l){h+='<line class="'+c+'" x1="'+l[0]+'" y1="'+l[1]+'" x2="'+l[2]+'" y2="'+l[3]+'"/>'})});
  $('gradeov').innerHTML=h
}

/* ---------- controles ---------- */
var SL=[
 {id:'zoom',t:'Zoom',u:'%',min:100,max:400,step:1,dec:0,def:100,get:function(s){return s.z},set:function(s,v){s.z=v},h:function(s){var m=zmin(s,cur);return m>100?'De '+m+' a 400%. O mínimo sobe para cobrir a janela.':'De 100 a 400%.'}},
 {id:'ang',t:'Endireitar',u:'°',min:-15,max:15,step:.1,dec:1,def:0,get:function(s){return s.ang},set:function(s,v){s.ang=v},h:function(){return'De −15° a +15°. A grade fina aparece enquanto você ajusta.'}},
 {id:'fint',t:'Intensidade do filtro',u:'%',min:0,max:100,step:1,dec:0,def:100,get:function(s){return s.flt.int},set:function(s,v){s.flt.int=v},h:function(s){return s.flt.id==='original'?'Escolha um filtro para ajustar a intensidade.':'De 0 a 100%. Em 100% o filtro age por inteiro.'}},
 {id:'brilho',t:'Brilho',u:'',min:-100,max:100,step:1,dec:0,def:0,adj:1,h:function(){return'De −100 a +100.'}},
 {id:'contraste',t:'Contraste',u:'',min:-100,max:100,step:1,dec:0,def:0,adj:1,h:function(){return'De −100 a +100.'}},
 {id:'saturacao',t:'Saturação',u:'',min:-100,max:100,step:1,dec:0,def:0,adj:1,h:function(){return'De −100 a +100.'}},
 {id:'temp',t:'Temperatura',u:'',min:-100,max:100,step:1,dec:0,def:0,adj:1,h:function(){return'De −100 (azulado) a +100 (alaranjado).'}},
 {id:'realces',t:'Realces',u:'',min:-100,max:100,step:1,dec:0,def:0,adj:1,h:function(){return'De −100 a +100. Recupera céu estourado.'}},
 {id:'sombras',t:'Sombras',u:'',min:-100,max:100,step:1,dec:0,def:0,adj:1,h:function(){return'De −100 a +100. Abre áreas escuras.'}},
 {id:'nitidez',t:'Nitidez',u:'',min:0,max:100,step:1,dec:0,def:0,adj:1,h:function(s){var p=ppi(cur,s);return p>=300?'De 0 a 100. Aplicada só ao exportar (esta foto: '+p+' PPI).':'De 0 a 100. Só vale a partir de 300 PPI; esta foto tem '+p+' PPI.'}},
 {id:'vinheta',t:'Vinheta',u:'',min:0,max:100,step:1,dec:0,def:0,adj:1,h:function(){return'De 0 a 100. Escurece as bordas, sem cor.'}}
];
SL.forEach(function(c){
  c.get=c.get||function(s){return s.adj[c.id]};
  c.set=c.set||function(s,v){s.adj[c.id]=v};
});
function minDe(c){return c.id==='zoom'?zmin(S(),cur):c.min}
function construir(){
  SL.forEach(function(c){
    var slot=document.querySelector('[data-sl='+c.id+']');
    slot.className='f';slot.setAttribute('data-k',c.id);
    slot.innerHTML='<div class="f__top"><label class="f__l" for="'+c.id+'">'+c.t+'</label>'+((c.adj||c.id==='fint')?'<span class="mix mono" hidden><svg class="ico sm" aria-hidden="true"><use href="#i-info"/></svg>Valores diferentes</span>':'')+'<button type="button" class="rst mono" data-reset="'+c.id+'" hidden><svg class="ico sm"><use href="#i-reset"/></svg>Resetar</button></div>'
     +'<div class="sl"><input type="range" id="'+c.id+'-r" min="'+c.min+'" max="'+c.max+'" step="'+c.step+'" aria-label="'+c.t+'"><div class="num num--s"><input id="'+c.id+'" inputmode="decimal" autocomplete="off"'+(c.u?'':' aria-label="'+c.t+'"')+'><span class="num__u mono">'+(c.u||'')+'</span></div></div>'
     +'<p class="f__h" id="'+c.id+'-h"></p>';
    var r=$(c.id+'-r'),n=$(c.id),f=slot,h=$(c.id+'-h'),tmr;
    n.setAttribute('aria-describedby',c.id+'-h');
    function ler(){return parseFloat(n.value.replace(',','.'))}
    function ok(v){return!isNaN(v)&&v>=minDe(c)&&v<=c.max}
    function por(v,k){c.set(S(),c.dec?Math.round(v*10)/10:Math.round(v));commit(k||c.id)}
    r.addEventListener('input',function(){f.classList.remove('is-err');por(parseFloat(r.value))});
    if(c.id==='ang'){var on=function(){document.body.classList.add('is-endireitando');pintaGrade()},off=function(){document.body.classList.remove('is-endireitando');pintaGrade()};
      r.addEventListener('pointerdown',on);r.addEventListener('focus',on);r.addEventListener('blur',off);r.addEventListener('pointerup',off);r.addEventListener('pointercancel',off);n.addEventListener('focus',on);n.addEventListener('blur',off)}
    n.addEventListener('input',function(){clearTimeout(tmr);tmr=setTimeout(function(){var v=ler();if(!ok(v)){f.classList.add('is-err');h.innerHTML='✕ Use um valor de '+nf(minDe(c),c.dec)+' a '+nf(c.max,c.dec)+(c.u?c.u:'')+'.';return}f.classList.remove('is-err');por(v)},80)});
    n.addEventListener('blur',function(){clearTimeout(tmr);f.classList.remove('is-err');sincronizar()});
    n.addEventListener('keydown',function(e){if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();var v=(ok(ler())?ler():c.get(S()))+(e.key==='ArrowUp'?1:-1)*(e.shiftKey?10:c.step);v=Math.min(c.max,Math.max(minDe(c),v));por(v)}});
  })
}
function sincronizar(){
  var s=S();
  SL.forEach(function(c){
    var r=$(c.id+'-r'),n=$(c.id),f=n.closest('.f'),v=c.get(s),mn=minDe(c);
    r.min=mn;r.value=v;
    if(document.activeElement!==n)n.value=nf(v,c.dec);
    var dk=(c.adj||c.id==='fint')&&window.PLLOTE&&PLLOTE.dif?PLLOTE.dif(c.id):[],mx=f.querySelector('.mix');
    if(mx){mx.hidden=!dk.length;f.classList.toggle('is-mix',dk.length>0)}
    if(!f.classList.contains('is-err'))$(c.id+'-h').textContent=c.h(s)+(dk.length?' '+(dk.length===1?'1 outra foto do escopo tem valor diferente.':dk.length+' outras fotos do escopo têm valor diferente.')+' «Aplicar às demais» iguala à Foto '+p2(cur)+'.':'');
    f.querySelector('[data-reset]').hidden=v===c.def
  });
  [].forEach.call(document.querySelectorAll('[data-modo]'),function(i){i.checked=i.value===s.modo});
  [].forEach.call(document.getElementsByName('grade'),function(i){i.checked=i.value===UI.grade});
  document.querySelector('[data-reset=modo]').hidden=s.modo==='preencher';
  $('modo-h').textContent=s.modo==='preencher'?'A foto cobre toda a janela. Nunca é esticada.':'A foto inteira cabe na janela; o que sobrar fica branco.';
  [].forEach.call(document.querySelectorAll('[data-act=espelhar]'),function(b){b.setAttribute('aria-pressed',s.flip)});
  [].forEach.call(document.querySelectorAll('[data-act=inteira]'),function(b){b.setAttribute(b.getAttribute('role')==='switch'?'aria-checked':'aria-pressed',UI.inteira)});
  $('win').classList.toggle('is-all',UI.inteira)
}

/* ---------- desenho ---------- */
function dimensionar(){
  var st=$('stage'),w=st.clientWidth,h=st.clientHeight,rg=$('pq').classList.contains('has-rg')?40:0,pw=Math.max(120,Math.min(420,w-rg,(h-rg)*FR.w/FR.h));
  if(!(pw>0))pw=420;
  var pq=$('pq'),u=pw/FR.w,cwp=FR.cw*u;                                 /* u = px por mm; cwp = largura da moldura em pé (a legenda é desenhada nela) */
  pq.style.setProperty('--pmm',u+'px');                                  /* D-113: legendas da tela em mm reais (linhas absolutas do Pocket) */
  pq.classList.toggle('is-h',FR.ori==='h');
  pq.style.setProperty('--pqw',pw+'px');pq.style.setProperty('--pw',cwp+'px');pq.style.setProperty('--k',cwp/420);
  pq.style.setProperty('--ar',FR.w+'/'+FR.h);pq.style.setProperty('--wa',FR.jw+'/'+FR.jh);pq.style.setProperty('--pl',(FR.lado*u)+'px');pq.style.setProperty('--pr',(FR.ladoD*u)+'px');pq.style.setProperty('--pt',(FR.topo*u)+'px');pq.style.setProperty('--rd',Math.max(0,FR.rad*u)+'px');
  pq.style.setProperty('--lw',cwp+'px');pq.style.setProperty('--lh',(FR.ch*u)+'px');pq.style.setProperty('--cpl',(FR.cl*u)+'px');pq.style.setProperty('--cpt',(FR.ct*u)+'px');pq.style.setProperty('--cwa',FR.cjw+'/'+FR.cjh);
  if(window.PLMOL)PLMOL.regua();
  $('ctx-scale').textContent='Escala '+Math.round(pw/(FR.w*96/25.4)*100)+'%'
}
var ROT={boa:'Boa',abaixo:'Abaixo do ideal',ressalvas:'Com ressalvas',ruim:'Ruim'},ICO={boa:'verified',abaixo:'alert',ressalvas:'warn',ruim:'cancel'};
function qualidade(){
  var s=S(),p=ppi(cur,s),nv=nivel(p),sl=$('seal');
  sl.setAttribute('data-n',nv);sl.querySelector('use').setAttribute('href','#i-'+ICO[nv]);$('seal-t').textContent=ROT[nv]+' · '+p+' PPI';
  var m=$('qmsg'),b=$('qmsg-b');m.hidden=nv==='boa';
  if(nv!=='boa'){
    b.className='msg '+(nv==='ruim'?'msg--err':'msg--warn');
    $('qmsg-i').querySelector('use').setAttribute('href',nv==='ruim'?'#i-x':'#i-warn');
    $('qmsg-t').textContent='Resolução de '+p+' PPI na janela. '+(nv==='abaixo'?'Revise o recorte antes de imprimir.':nv==='ressalvas'?'Reduza o zoom ou escolha um formato menor.':'Troque a foto ou escolha um formato menor.')
  }
  return nv
}
function thumb(i){
  var b=$('faixa').children[i-1].firstChild,s=ST[i],t=b.querySelector('.tq');
  t.innerHTML='<div class="ph" style="'+estilo(i,s)+';filter:none">'+cena(i,0)+'</div>';
  b.classList.toggle('th--alert',nivel(ppi(i,s))!=='boa');
  var nv=nivel(ppi(i,s));
  b.setAttribute('aria-label','Foto '+p2(i)+' de '+N+(mudou(s)?', ajustada':'')+(nv!=='boa'?', '+ROT[nv].toLowerCase():'')+(window.PLLOTE&&PLLOTE.sel(i)?', selecionada':''));
  if(i===cur)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')
}
function faixa(){
  var ol=$('faixa');ol.innerHTML='';
  for(var i=1;i<=N;i++){
    var li=document.createElement('li'),b=document.createElement('button');
    b.type='button';b.className='th';b.innerHTML='<span class="tq"></span><span class="th__n mono">#'+p2(i)+'</span>';
    (function(k){b.onclick=function(){ir(k)}})(i);
    li.appendChild(b);ol.appendChild(li)
  }
  for(i=1;i<=N;i++)thumb(i)
}
function ir(n){
  if(n<1||n>N||n===cur)return;
  var a=cur;cur=n;try{history.replaceState(null,'','#foto-'+n)}catch(e){}
  thumb(a);render();var c=document.querySelector('.th[aria-current]');if(c&&c.scrollIntoView)c.scrollIntoView({block:'nearest',inline:'nearest'})
}

/* ---------- histórico (FN-00c) ---------- */
var hist=[JSON.stringify(ST)],hi=0,lastK='',lastT=0;
function commit(k){
  acertar(cur,S());
  render();
  var s=JSON.stringify(ST),now=Date.now();
  if(s===hist[hi])return;
  guardarLista();
  if(k&&k===lastK&&now-lastT<700&&hi>0)hist[hi]=s;else{hist=hist.slice(0,hi+1);hist.push(s);hi++}
  lastK=k;lastT=now;render()
}
function assin(){return ST.slice(1).map(function(e){return e.src}).join(',')}
function aplicarHist(j){
  var antes=assin();hi=j;ST=JSON.parse(hist[hi]);N=ST.length-1;if(cur>N)cur=N;lastK='';keyMain='';
  if(assin()!==antes){faixa();if(window.PLLOTE)PLLOTE.limpar();try{history.replaceState(null,'','#foto-'+cur)}catch(e){}}
  guardarLista();render();for(var i=1;i<=N;i++)thumb(i)}
function desfazer(){if(hi>0){aplicarHist(hi-1);toast('Alteração desfeita')}}
function refazer(){if(hi<hist.length-1){aplicarHist(hi+1);toast('Alteração refeita')}}
$('undo').onclick=desfazer;$('redo').onclick=refazer;
$('toast-undo').onclick=function(){desfazer()};


/* ---------- estrutura do lote: Duplicar e Remover (FN-09) · entram no histórico ---------- */
function reindexar(novoST,atual){ST=novoST;N=ST.length-1;cur=Math.max(1,Math.min(N,atual));faixa();try{history.replaceState(null,'','#foto-'+cur)}catch(e){}if(window.PLLOTE)PLLOTE.limpar();commit()}
function duplicar(lista){                      /* cópia logo depois da original; a foto aberta continua a mesma */
  lista=lista.filter(function(i){return i>=1&&i<=N});if(!lista.length)return 0;
  var out=[{}],at=cur,k=0;
  for(var i=1;i<=N;i++){out.push(ST[i]);if(i===cur)at=out.length-1;
    if(lista.indexOf(i)>=0){var c=copia(ST[i]);out.push(c);k++}}
  reindexar(out,at);return k}
function remover(lista){                       /* só sai do projeto; o arquivo continua no aparelho (BR-01) */
  lista=lista.filter(function(i){return i>=1&&i<=N});
  if(!lista.length||lista.length>=N)return 0;
  var out=[{}],novoCur=null,i;
  for(i=1;i<=N;i++)if(lista.indexOf(i)<0){out.push(ST[i]);if(i===cur)novoCur=out.length-1}
  if(novoCur===null){var depois=0;for(i=cur;i<=N;i++)if(lista.indexOf(i)<0){depois=i;break}
    var ate=depois||N,q=0;for(i=1;i<=ate;i++)if(lista.indexOf(i)<0)q++;novoCur=q}
  reindexar(out,novoCur);return lista.length}

/* ---------- lote (FN-09) ---------- */
function outrosIndividuais(){var c=0,a=window.PLLOTE?PLLOTE.conj():null;for(var i=1;i<=N;i++)if(i!==cur&&(!a||a.indexOf(i)>=0)&&ajustou(ST[i]))c++;return c}
function lote(){
  var on=$('replicar').checked,ind=outrosIndividuais(),sub=$('subst').checked,P=window.PLLOTE,nT=P?P.conj().length:N-1;
  if(ABA==='tab-legendas'){$('scope').classList.remove('is-lote');$('scope-tag').hidden=true;$('scope-t').textContent='Alterando: texto só desta foto · Foto '+p2(cur)+' · estilo em todas as '+N;return}
  $('scope').classList.toggle('is-lote',on);$('scope-tag').hidden=!on;
  $('scope-t').textContent=P?P.texto():on?'Alterando: Todas as fotos · '+N:'Alterando: só esta foto · Foto '+p2(cur);
  $('replicar-t').textContent='Replicar para as demais '+nT+(nT===1?' foto':' fotos');
  $('apply').disabled=!on||nT===0;$('apply-t').textContent='Aplicar às demais · '+nT+(nT===1?' foto':' fotos');
  $('subst-h').textContent=ind&&!sub?(ind===1?'1 foto tem ajuste individual e será mantida.':ind+' fotos têm ajuste individual e serão mantidas.'):'Desmarcada, as fotos com ajuste próprio ficam como estão.'
}
$('replicar').onchange=lote;$('subst').onchange=lote;
$('apply').onclick=function(){
  if($('apply').disabled)return;
  var sub=$('subst').checked,a=S().adj,n=0,keep=0,al=window.PLLOTE?PLLOTE.conj():null;
  for(var i=1;i<=N;i++){if(i===cur||(al&&al.indexOf(i)<0))continue;if(ajustou(ST[i])&&!sub){keep++;continue}ST[i].adj=copia(a);ST[i].flt=copia(S().flt);n++}
  commit('lote');for(i=1;i<=N;i++)thumb(i);
  if(window.PLLOTE)PLLOTE.aviso(keep);
  toast('Ajustes aplicados a '+n+(n===1?' foto':' fotos')+(keep?' · '+keep+(keep===1?' foi mantida':' foram mantidas'):''),true)
};

/* ---------- ações ---------- */
var ACT={
  girar:function(){var s=S();s.rot=(s.rot+90)%360;s.px=s.py=0;commit('girar')},
  espelhar:function(){var s=S();s.flip=!s.flip;commit('espelhar')},
  inteira:function(){UI.inteira=!UI.inteira;sincronizar()},
  centralizar:function(){var s=S();s.px=s.py=0;commit('centralizar')},
  rfoto:function(){var s=S(),a=s.adj,fl=s.flt,mt=s.meta;ST[cur]=novo();ST[cur].adj=a;ST[cur].flt=fl;if(mt)ST[cur].meta=mt;commit('rfoto');toast('Recorte da foto restaurado',true)},
  reduzir:function(){
    var s=S(),mx=zmaxPara(cur,s,240),z=Math.max(zmin(s,cur),Math.min(s.z,mx));s.z=z;commit('reduzir');
    toast('Zoom em '+S().z+'% · '+ppi(cur,S())+' PPI',true)
  }
};
[].forEach.call(document.querySelectorAll('[data-act]'),function(b){b.onclick=function(){ACT[b.getAttribute('data-act')]()}});
[].forEach.call(document.querySelectorAll('[data-modo]'),function(i){i.onchange=function(){var s=S();s.modo=this.value;s.z=100;s.px=s.py=0;commit('modo')}});
[].forEach.call(document.getElementsByName('grade'),function(i){i.onchange=function(){UI.grade=this.value;pintaGrade();sincronizar()}});
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-reset]');if(!b)return;
  var k=b.getAttribute('data-reset'),s=S();
  if(k==='modo'){s.modo='preencher';s.z=100;s.px=s.py=0}else{var c=SL.filter(function(x){return x.id===k})[0];c.set(s,c.def)}
  commit(k)
});
$('rtudo').onclick=function(){if(!ajustou(S()))return;S().adj=copia(ADJ0);S().flt={id:'original',int:100};commit('rtudo');toast('Ajustes e filtro da foto zerados',true)};
$('fprev').onclick=function(){ir(cur-1)};$('fnext').onclick=function(){ir(cur+1)};
$('save').onclick=function(){toast('Próxima etapa: salvar o projeto em arquivo.')};
$('go').onclick=$('go2').onclick=function(){location.href='../#revisar'};   /* o pré-voo (T-18) abre nas Folhas, onde a medida da folha existe */

/* ---------- posicionar a foto: arrastar, pinça, roda e setas (FN-04, FN-12) ---------- */
var win=$('win'),pts={},last=null,d0=0,z0=100;
function tam(){return win.getBoundingClientRect().width||380}
function tamH(){return win.getBoundingClientRect().height||380}
win.addEventListener('pointerdown',function(e){
  pts[e.pointerId]={x:e.clientX,y:e.clientY};try{win.setPointerCapture(e.pointerId)}catch(x){}
  win.classList.add('is-drag');var k=Object.keys(pts);
  if(k.length===2){var a=pts[k[0]],b=pts[k[1]];d0=Math.hypot(a.x-b.x,a.y-b.y);z0=S().z}
});
win.addEventListener('pointermove',function(e){
  var p=pts[e.pointerId];if(!p)return;var k=Object.keys(pts),s=S();
  if(k.length>=2){
    pts[e.pointerId]={x:e.clientX,y:e.clientY};var a=pts[k[0]],b=pts[k[1]],d=Math.hypot(a.x-b.x,a.y-b.y);
    if(d0>0){s.z=Math.round(z0*d/d0);acertar(cur,s);render()}
  }else{
    var dx=e.clientX-p.x,dy=e.clientY-p.y;pts[e.pointerId]={x:e.clientX,y:e.clientY};
    s.px+=dx/tam();s.py+=dy/tamH();acertar(cur,s);render()
  }
});
function solta(e){
  if(!pts[e.pointerId])return;delete pts[e.pointerId];
  if(!Object.keys(pts).length){win.classList.remove('is-drag');commit('pos')}
}
win.addEventListener('pointerup',solta);win.addEventListener('pointercancel',solta);
win.addEventListener('wheel',function(e){e.preventDefault();var s=S();s.z+=e.deltaY<0?3:-3;commit('zoom')},{passive:false});
function mover(dx,dy){var s=S();s.px+=dx/tam();s.py+=dy/tamH();commit('pos')}
function zoomPor(d){S().z+=d;commit('zoom')}
document.addEventListener('keydown',function(e){
  var m=e.ctrlKey||e.metaKey,t=e.target,tag=t&&t.tagName;
  if(m&&!e.shiftKey&&e.key.toLowerCase()==='z'&&tag!=='INPUT'){e.preventDefault();desfazer();return}
  if(m&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toLowerCase()==='z'))&&tag!=='INPUT'){e.preventDefault();refazer();return}
  if(m||e.altKey)return;
  var livre=t===win||t===document.body;
  if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')return;
  if(e.key==='['){ir(cur-1);return}
  if(e.key===']'){ir(cur+1);return}
  if(!livre)return;
  var st=e.shiftKey?10:1;
  if(e.key==='ArrowLeft'){mover(-st,0);e.preventDefault()}
  else if(e.key==='ArrowRight'){mover(st,0);e.preventDefault()}
  else if(e.key==='ArrowUp'){mover(0,-st);e.preventDefault()}
  else if(e.key==='ArrowDown'){mover(0,st);e.preventDefault()}
  else if(e.key==='+'||e.key==='='){zoomPor(1);e.preventDefault()}
  else if(e.key==='-'||e.key==='_'){zoomPor(-1);e.preventDefault()}
});

/* ---------- render ---------- */
function render(){
  if(window.PLMOL)PLMOL.render();                                  /* aplica a moldura, atualiza os campos e redimensiona a mesa (inclusive em desfazer e refazer) */
  var s=S(),nv;
  $('ctx-foto').textContent='Modo Quadro · Foto '+p2(cur)+' de '+N;
  $('faixa-r').textContent='Foto '+p2(cur)+' / '+N;
  var lt=document.querySelector('#faixa-w .faixa__t span');if(lt)lt.textContent=N;
  $('cap').textContent=LEG[(src(cur)-1)%4];
  $('cota').textContent=window.PLMOL?PLMOL.cota():'Passe-partout inferior: '+nf(FR.ch-FR.ct-FR.cjh)+' mm';
  $('nb').hidden=!mudou(s);
  $('fprev').disabled=cur<=1;$('fnext').disabled=cur>=N;
  $('undo').disabled=hi<=0;$('redo').disabled=hi>=hist.length-1;
  document.title='Polar Life · Viagem · Serra 2026 · Quadro · Foto '+p2(cur);
  pintaMain();pintaGrade();nv=qualidade();sincronizar();lote();if(window.PLLEG)PLLEG.render();if(window.PLFLT)PLFLT.render();if(window.PLMET)PLMET.render();if(window.PLLOTE)PLLOTE.render();
  if($('faixa').children.length===N)thumb(cur)
}

/* ---------- abas do inspetor ---------- */
var ABA='tab-ajustes',tabs=[].slice.call(document.querySelectorAll('.tab'));
function aba(t){
  tabs.forEach(function(x){var on=x===t;x.classList.toggle('is-on',on);x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1});
  var id=t.id,esc=$('scope');ABA=id;
  $('p-ajustes').hidden=id!=='tab-ajustes';$('p-papel').hidden=id!=='tab-papel';$('p-legendas').hidden=id!=='tab-legendas';$('p-molduras').hidden=id!=='tab-molduras';$('p-metadados').hidden=id!=='tab-metadados';
  $('p-outra').hidden=['tab-ajustes','tab-papel','tab-legendas','tab-molduras','tab-metadados'].indexOf(id)>=0;$('p-outra').setAttribute('aria-labelledby',id);
  esc.hidden=id!=='tab-ajustes'&&id!=='tab-legendas';lote();if(window.PLLEG)PLLEG.render();if(window.PLMOL)PLMOL.render();if(window.PLMET)PLMET.render()
}
tabs.forEach(function(t,i){t.onclick=function(){aba(t)};t.onkeydown=function(e){var j=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:-1;if(j<0)return;j=(j+tabs.length)%tabs.length;tabs[j].focus();aba(tabs[j]);e.preventDefault()}});

/* tablet: inspetor deslizante · celular: painel inferior com 25%, 50% e 85% (como na T-07) */
var insp=$('insp'),content=$('main'),SN=[25,50,85],sn=0,mt=window.matchMedia('(min-width:768px) and (max-width:1023.98px)');
function snap(i){sn=i;document.documentElement.style.setProperty('--panel',SN[i]);$('grab').setAttribute('aria-label','Tamanho do painel: '+SN[i]+'%. Toque para alterar.');setTimeout(dimensionar,260)}
$('grab').onclick=function(){snap((sn+1)%SN.length)};
$('grab').onkeydown=function(e){if(e.key==='ArrowUp'){snap(Math.min(2,sn+1));e.preventDefault()}if(e.key==='ArrowDown'){snap(Math.max(0,sn-1));e.preventDefault()}};
var y0,hh0,moved=false;
$('grab').addEventListener('pointerdown',function(e){y0=e.clientY;hh0=insp.getBoundingClientRect().height;moved=false;insp.classList.add('is-drag');this.setPointerCapture(e.pointerId)});
$('grab').addEventListener('pointermove',function(e){if(y0==null)return;var dy=y0-e.clientY;if(Math.abs(dy)>4)moved=true;if(moved)insp.style.height=Math.max(120,Math.min(innerHeight*.85,hh0+dy))+'px'});
$('grab').addEventListener('pointerup',function(){if(y0==null)return;insp.classList.remove('is-drag');if(moved){var pct=insp.getBoundingClientRect().height/innerHeight*100,k=0;SN.forEach(function(v,i){if(Math.abs(v-pct)<Math.abs(SN[k]-pct))k=i});insp.style.height='';snap(k);$('grab').onclick=null;setTimeout(function(){$('grab').onclick=function(){snap((sn+1)%SN.length)}},0)}y0=null});
$('insp-toggle').onclick=function(){var sh=insp.classList.toggle('is-shut');content.classList.toggle('has-insp',!sh);this.setAttribute('aria-expanded',!sh);setTimeout(dimensionar,260)};
function modo(){if(mt.matches){insp.classList.remove('is-shut');content.classList.add('has-insp');$('insp-toggle').setAttribute('aria-expanded','true')}else{content.classList.remove('has-insp');insp.classList.remove('is-shut')}}
mt.addListener?mt.addListener(modo):mt.addEventListener('change',modo);modo();snap(0);

window.PLQ={sinc:sincronizar,lote:lote,thumb:thumb,ajustou:ajustou,nat:nat,vert:function(n){return!!VERT[src(n)]},src:src,duplicar:duplicar,remover:remover,FR:FR,dim:dimensionar,render:render,cena:cena,acertar:acertar,ST:function(){return ST},S:S,cur:function(){return cur},commit:commit,toast:toast,p2:p2,pw:function(){return $('pq')}};
Object.defineProperty(window.PLQ,'N',{get:function(){return N}});
/* ---------- partida ---------- */
construir();faixa();
if(window.ResizeObserver){new ResizeObserver(dimensionar).observe($('stage'))}else window.addEventListener('resize',dimensionar);
dimensionar();render();
var c0=document.querySelector('.th[aria-current]');if(c0&&c0.scrollIntoView)c0.scrollIntoView({block:'nearest',inline:'center'});
})();
