/* T-08 · Editor · Modo Quadro · DOC-05 FN-04 (recorte), FN-05 (ajustes), FN-09 (lote), FN-12 (teclado) · BR-12 (PPI) · dados de exemplo: DOC-04 §6 */
(function(){
/*MOTOR*/
var FR={w:88,h:107,jw:76,jh:76,lado:6,ladoD:6,topo:6,rad:.4,ori:'v',cw:88,ch:107,cl:6,ct:6,cjw:76,cjh:76};   /* Clássico 88 × 107 · janela 76 × 76 · w, h, lado, ladoD, topo, jw, jh já na orientação escolhida (etapa 27); cw… são da moldura em pé */
var VERT={2:1,6:1,9:1,13:1,17:1,21:1};                             /* 6 verticais (T-05) */
var SRCMAP=function(n){return n};                                  /* posição → foto de origem (muda com Duplicar e Remover) */
var ADJ0={brilho:0,contraste:0,saturacao:0,temp:0,realces:0,sombras:0,nitidez:0,vinheta:0};
function copia(o){return JSON.parse(JSON.stringify(o))}
function novo(){return{modo:'preencher',z:100,ang:0,px:0,py:0,ex:0,ey:0,rot:0,flip:false,adj:copia(ADJ0),txt:null,flt:{id:'original',int:100}}}
var REAL_DIM={};   /* D-130 · BR-12: pixels reais de cada foto (src → {w,h}), lidos do IndexedDB */
function nat(n){var r=REAL_DIM[SRCMAP(n)];if(r)return r;return VERT[SRCMAP(n)]?{w:976,h:1300}:{w:1300,h:976}}      /* sem foto real: pixels da foto de exemplo [HIPÓTESE], 326 PPI a 100% */
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
function nivel(p){return typeof window!=='undefined'&&window.PLQUALIDADE?PLQUALIDADE.nivel(p):p>=300?'excelente':p>=150?'boa':'borrada'}   /* D-130: fonte única em PLQUALIDADE */
function zmaxPara(n,s,alvo){return Math.floor((1/base(n,s))/(alvo*FR.jw/25.4)*100)}
function ajustou(s){return JSON.stringify(s.adj)!==JSON.stringify(ADJ0)||(s.flt&&s.flt.id!=='original')}
function mudou(s){var c=JSON.parse(JSON.stringify(s)),d=novo();delete c.meta;delete c.src;delete c.ex;delete c.ey;delete d.ex;delete d.ey;return JSON.stringify(c)!==JSON.stringify(d)}   /* metadados e elástico não contam como ajuste */
/*FIM MOTOR*/

var $=function(i){return document.getElementById(i)},tm;
function toast(m,undo){clearTimeout(tm);$('toast-t').textContent=m;$('toast-undo').hidden=!undo;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
function nf(n,d){return (Math.round(n*(d?10:1))/(d?10:1)).toString().replace('.',',')}
function p2(n){return(n<10?'0':'')+n}
var LEG=['Dias de sol','Nós dois','Dia de rolê','Meu parceiro'];
var N=24,ST=[{}],cur=3,UI={grade:'nenhuma',inteira:false};
function lerLista(){try{var a=JSON.parse(sessionStorage.getItem('pl-fotos')||'null');if(Array.isArray(a)&&a.length>=1&&a.length<=400&&a.every(function(x){return x>=1&&x<=400&&x%1===0}))return a}catch(e){}return null}
var LISTA_REAL=lerLista(),DEMO=!(LISTA_REAL&&window.PLTEXTO&&PLTEXTO.ehReal());   /* 44: ajustes de exemplo só no projeto demo */
var LISTA0=LISTA_REAL||(function(){var a=[];for(var i=1;i<=24;i++)a.push(i);return a})();
var NOME='Viagem · Serra 2026';   /* nome do projeto: no exemplo, o nome de exemplo (DOC-04 §6) */
if(!DEMO&&window.PLPROJETOS&&PLPROJETOS.atual())PLPROJETOS.listar().then(function(a){var p=a.filter(function(x){return x.id===PLPROJETOS.atual()})[0];if(p){NOME=p.nome;ST[0].nome=p.nome;document.title='Polar Life · '+p.nome+' · Quadro';var e=document.querySelector('.eh__name');if(e)e.textContent=p.nome;guardarLista()}});
function lerQuadro(){                                              /* estado completo guardado ao sair para as Folhas (D-085) */
  try{var o=JSON.parse(sessionStorage.getItem('pl-quadro')||'null');
    if(Array.isArray(o)&&o.length>=2&&o.length<=401&&o[0]&&typeof o[0]==='object'&&o.slice(1).every(function(e){return e&&e.src>=1&&e.src<=400&&e.src%1===0&&e.adj&&e.flt&&typeof e.z==='number'})){
      if(o[0].leg&&window.PLTEXTO)PLTEXTO.migrar(o[0].leg);   /* D-135/D-136: projeto antigo abre com os dados novos */
      return o}}catch(e){}
  return null}
var SALVO=lerQuadro();
if(SALVO){ST=SALVO}
else{LISTA0.forEach(function(sr){var e=novo();e.src=sr;
  if(DEMO&&sr===3){e.adj.realces=-20;e.adj.sombras=25;e.adj.vinheta=15}   /* Foto 3 «Ajustada» (DOC-04 §6) */
  if(DEMO&&sr===12)e.z=233;                                               /* Foto 12 «Com ressalvas · 140 PPI» */
  ST.push(e)})}
N=ST.length-1;
SRCMAP=function(n){return ST[n]&&ST[n].src||n};
/* Metadados da foto real ficam no aparelho; GPS só sinaliza existência (BR-06). */
if(!DEMO&&window.PLFOTOS)Promise.all(ST.slice(1).map(function(e){return PLFOTOS.ler(e.src).catch(function(){return null})})).then(function(a){a.forEach(function(r,i){if(!r)return;var e=ST[i+1],m=e.meta;
  if(!m||(!m.ds&&!m.cs)){var iso=(r.meta&&r.meta.iso||'').slice(0,16);e.meta={iso:iso,ds:iso?'exif':'none',dh:0,c:'',cs:'none',o:'Do aparelho',conv:false}}   /* não sobrescreve o que a pessoa editou */
  if(r.w&&r.h){VERT[e.src]=r.h>r.w?1:0;REAL_DIM[e.src]={w:r.w,h:r.h}}});if(window.PLLEG)PLLEG.render();render();faixa();guardarLista()});   /* qualidade e miniaturas com os pixels reais */
function src(n){return SRCMAP(n)}
function guardarLista(){try{var s=ST.map(function(e,i){if(!i)return e;var o=copia(e);o.ex=0;o.ey=0;return o});   /* o elástico é do gesto: some quando a foto é guardada (MT-02) */
  sessionStorage.setItem('pl-fotos',JSON.stringify(ST.slice(1).map(function(e){return e.src})));sessionStorage.setItem('pl-quadro',JSON.stringify(s));sessionStorage.setItem('pl-ppi',JSON.stringify(ST.slice(1).map(function(e,i){return ppi(i+1,e)})));if(window.PLSESSAO)PLSESSAO.agendar()}catch(e){}}
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
  return PLFOTOTELA.estilo(nat(n),s,jq())   /* MT-02: o recorte da tela é o mesmo do PDF (PLFOTOTELA) */
}
/* ---------- foto na tela: a real em projeto real, a cena de exemplo no exemplo ---------- */
var PEDIU={};                              /* src → pedido em andamento (evita pedir duas vezes) */
function pedirCheia(n,sr){
  if(PEDIU[sr])return;PEDIU[sr]=1;
  PLFOTOTELA.url(sr).then(function(u){
    PEDIU[sr]=0;
    if(!u||!PLFOTOTELA.tem(sr,false))return;   /* a URL pode ter sido revogada no caminho */
    if(ST[n]&&src(n)===sr){keyMain='';pintaMain()}
  })
}
function pedirMini(n,sr){
  var k='m'+sr;if(PEDIU[k])return;PEDIU[k]=1;
  PLFOTOTELA.mini(sr,n===cur).then(function(u){
    PEDIU[k]=0;
    if(!u)return;
    if(ST[n]&&src(n)===sr)thumb(n)
  })
}
function midia(n,vin,mini,encaixe,podePedir){
  if(DEMO)return cena(n,vin);
  var sr=src(n),u=PLFOTOTELA.tem(sr,mini);
  if(!u&&!mini)u=PLFOTOTELA.tem(sr,true);   /* a janela espera a cheia; enquanto isso, a mini se existir */
  if(u){
    if(!mini&&!PLFOTOTELA.tem(sr,false))pedirCheia(n,sr);
    return PLFOTOTELA.html(u,vin,encaixe)
  }
  if(podePedir!==false&&!PLFOTOTELA.falhou(sr)){
    if(!mini)pedirCheia(n,sr);   /* a janela pede a foto cheia; a mini entra como reserva */
    pedirMini(n,sr)
  }
  return ''
}
var keyMain='';
function pintaMain(){
  var s=S(),m=midia(cur,s.adj.vinheta,false),key=cur+'|'+s.adj.vinheta+'|'+m;   /* a URL em uso entra na chave */
  if(key!==keyMain){keyMain=key;$('clip').innerHTML='<div class="ph">'+m+'</div>';$('ghost').innerHTML='<div class="ph">'+m+'</div>';var cmp=$('cmp');if(cmp)cmp.innerHTML='<div class="ph">'+m+'</div><i class="win__cut"></i>'}
  var st=estilo(cur,s);[].forEach.call(document.querySelectorAll('#clip .ph,#ghost .ph,#cmp .ph'),function(e){e.setAttribute('style',st)});
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
 {id:'nitidez',t:'Nitidez',u:'',min:0,max:100,step:1,dec:0,def:0,adj:1,h:function(s){return nivel(ppi(cur,s))==='excelente'?'De 0 a 100. Aplicada só ao exportar.':'De 0 a 100. Melhora fotos com qualidade excelente.'}},
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
    slot.innerHTML='<div class="f__top"><label class="f__l" for="'+c.id+'">'+c.t+'</label>'+((c.adj||c.id==='fint')?'<span class="mix rotulo" hidden><svg class="ico sm" aria-hidden="true"><use href="#i-info"/></svg>Valores diferentes</span>':'')+'<button type="button" class="rst mono" data-reset="'+c.id+'" hidden><svg class="ico sm"><use href="#i-reset"/></svg>Resetar</button></div>'
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
  $('ctx-scale').textContent=Math.round(pw/(FR.w*96/25.4)*100)+'%'
}
var ROT={excelente:'Excelente',boa:'Boa',borrada:'Pode sair borrada'},ICO={excelente:'verified',boa:'alert',borrada:'cancel'};
function qualidade(){
  var s=S(),p=ppi(cur,s),nv=nivel(p),sl=$('seal');
  sl.setAttribute('data-n',nv);sl.querySelector('use').setAttribute('href','#i-'+ICO[nv]);$('seal-level').textContent=ROT[nv];
  var m=$('qmsg'),b=$('qmsg-b');m.hidden=nv==='excelente';
  if(nv!=='excelente'){
    b.className='msg '+(nv==='borrada'?'msg--err':'msg--warn');
    $('qmsg-i').querySelector('use').setAttribute('href',nv==='borrada'?'#i-x':'#i-warn');
    $('qmsg-t').textContent=nv==='boa'?'Boa para este tamanho. Use uma foto maior ou diminua o zoom para melhorar.':'Pode sair borrada. Use uma foto maior ou diminua o zoom.'
  }
  var mold=$('pq'),ant=mold&&mold.querySelector('.pl-qualidade');if(ant)ant.remove();if(mold&&window.PLQUALIDADE)mold.appendChild(PLQUALIDADE.ponto(p));
  return nv
}
function thumb(i){
  var b=$('faixa').children[i-1].firstChild,s=ST[i],t=b.querySelector('.tq');
  t.innerHTML='<div class="ph" style="'+estilo(i,s)+';filter:none">'+midia(i,0,true,null,PERTO[i]||i===cur)+'</div>';
  b.classList.toggle('th--alert',nivel(ppi(i,s))!=='excelente');
  var nv=nivel(ppi(i,s));
  b.setAttribute('aria-label','Foto '+p2(i)+' de '+N+(mudou(s)?', ajustada':'')+(nv!=='boa'?', '+ROT[nv].toLowerCase():'')+(window.PLLOTE&&PLLOTE.sel(i)?', selecionada':''));
  if(i===cur)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')
}
var PERTO={},OBS=null;                   /* miniaturas pedidas só perto da área visível (200 fotos não travam) */
function observar(){
  var ol=$('faixa');
  if(!window.IntersectionObserver){      /* sem observador: todas, em ordem a partir da atual */
    for(var i=cur;i<=N;i++){PERTO[i]=1;pedirMini(i)}
    for(i=1;i<cur;i++){PERTO[i]=1;pedirMini(i)}
    return
  }
  if(OBS)OBS.disconnect();
  OBS=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      var i=+e.target.getAttribute('data-i');
      OBS.unobserve(e.target);
      PERTO[i]=1;pedirMini(i)
    })
  },{root:ol,rootMargin:'200px'});
  [].forEach.call(ol.children,function(li){var b=li.firstChild;if(b)OBS.observe(b)})
}
function faixa(){
  var ol=$('faixa');ol.innerHTML='';
  for(var i=1;i<=N;i++){
    var li=document.createElement('li'),b=document.createElement('button');
    b.type='button';b.className='th';b.setAttribute('data-i',i);
    b.innerHTML='<span class="tq"></span><span class="th__n mono">#'+p2(i)+'</span>';
    (function(k){b.onclick=function(){ir(k)}})(i);
    li.appendChild(b);ol.appendChild(li)
  }
  for(i=1;i<=N;i++)thumb(i)
  observar()
}
function ir(n){
  if(n<1||n>N||n===cur)return;
  var a=cur;cur=n;dbl=null;PERTO[n]=1;try{history.replaceState(null,'','#foto-'+n)}catch(e){}
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
function manterFotos(){try{PLFOTOTELA.manter(ST.slice(1).map(function(e){return e.src}))}catch(e){}}
function aplicarHist(j){
  var antes=assin();hi=j;ST=JSON.parse(hist[hi]);N=ST.length-1;if(cur>N)cur=N;lastK='';keyMain='';
  if(assin()!==antes){faixa();if(window.PLLOTE)PLLOTE.limpar();try{history.replaceState(null,'','#foto-'+cur)}catch(e){}}
  manterFotos();
  guardarLista();render();for(var i=1;i<=N;i++)thumb(i)}
function desfazer(){if(hi>0){aplicarHist(hi-1);toast('Alteração desfeita')}}
function refazer(){if(hi<hist.length-1){aplicarHist(hi+1);toast('Alteração refeita')}}
$('undo').onclick=desfazer;$('redo').onclick=refazer;
$('toast-undo').onclick=function(){desfazer()};


/* ---------- estrutura do lote: Duplicar e Remover (FN-09) · entram no histórico ---------- */
function reindexar(novoST,atual){ST=novoST;N=ST.length-1;cur=Math.max(1,Math.min(N,atual));PERTO={};faixa();try{history.replaceState(null,'','#foto-'+cur)}catch(e){}if(window.PLLOTE)PLLOTE.limpar();manterFotos();commit()}
function limiteFotos(){ /* D-027: o teto de fotos vem do plano (PLCONTA), nunca copiado em código */
  var P=window.PLCONTA&&PLCONTA.plano?PLCONTA.plano():null;
  return P&&P.fotosPorProjeto?P.fotosPorProjeto:24
}
function duplicar(lista){                      /* cópia logo depois da original; a foto aberta continua a mesma */
  lista=lista.filter(function(i){return i>=1&&i<=N});if(!lista.length)return 0;
  var max=limiteFotos(),cabem=Math.max(0,max-N);          /* duplicar respeita o plano (D-027) */
  if(lista.length>cabem){
    if(!cabem){toast('O plano leva até '+max+' fotos por projeto.');return 0}
    lista=lista.slice(0,cabem);
    setTimeout(function(){toast('O plano leva até '+max+' fotos por projeto. Só '+cabem+(cabem===1?' foto foi duplicada':' fotos foram duplicadas')+'.')},400)
  }
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
  centralizar:function(){var s=S();s.px=s.py=0;dbl=null;commit('centralizar')},
  rfoto:function(){var s=S(),a=s.adj,fl=s.flt,mt=s.meta;dbl=null;ST[cur]=novo();ST[cur].adj=a;ST[cur].flt=fl;if(mt)ST[cur].meta=mt;commit('rfoto');toast('Recorte da foto restaurado',true)},
  reduzir:function(){
    var s=S(),mx=zmaxPara(cur,s,240),z=Math.max(zmin(s,cur),Math.min(s.z,mx));s.z=z;commit('reduzir');
    toast('Zoom em '+S().z+'% · '+ROT[nivel(ppi(cur,S()))],true)
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
$('save').onclick=function(){if(!window.PLPROJETOS||!PLPROJETOS.atual()){toast('Abra um projeto para salvar o backup.');return}PLPROJETOS.exportar(PLPROJETOS.atual()).then(function(o){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download=o.projeto.nome+'.polarlife';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},0)})};
$('go').onclick=$('go2').onclick=function(){location.href='../#revisar'};   /* o pré-voo (T-18) abre nas Folhas, onde a medida da folha existe */

/* ---------- posicionar a foto: arrastar 1:1, pinça, roda e teclado (FN-04, FN-12) ---------- */
var win=$('win'),pts={},gst=null,dbl=null,ultTap=0,ultX=0,ultY=0,rafE=null;
function tam(){return win.getBoundingClientRect().width||380}
function tamH(){return win.getBoundingClientRect().height||380}
function parado(){try{return!!window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}}
function naJanela(e){var r=win.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]}   /* 0 a 1 em cada eixo */
function dist(a,b){return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y))}
function meio(a,b){var r=win.getBoundingClientRect();return[((a.x+b.x)/2-r.left)/r.width,((a.y+b.y)/2-r.top)/r.height]}

/* limite da posição: a janela continua coberta pela foto (FN-04 · nunca aparece fundo no modo Preencher) */
function limX(n,s,py){
  if(s.modo==='encaixar')return Math.abs(py)<=.5?0.5:0;
  var lo=0,hi=1,m,i;if(cabe(n,s,0,py))return 1;
  for(i=0;i<14;i++){m=(lo+hi)/2;if(cabe(n,s,m,py))lo=m;else hi=m}
  return lo
}
function limY(n,s,px){
  if(s.modo==='encaixar')return Math.abs(px)<=.5?0.5:0;
  var lo=0,hi=1,m,i;if(cabe(n,s,px,0))return 1;
  for(i=0;i<14;i++){m=(lo+hi)/2;if(cabe(n,s,px,m))lo=m;else hi=m}
  return lo
}
function prender(n,s,px,py){                     /* posição mais próxima dentro da cobertura */
  var i,lx,ly,lo=0,hi=1,m;
  for(i=0;i<3;i++){lx=limX(n,s,py);if(Math.abs(px)>lx)px=px<0?-lx:lx;ly=limY(n,s,px);if(Math.abs(py)>ly)py=py<0?-ly:ly}
  if(!cabe(n,s,px,py)){for(i=0;i<14;i++){m=(lo+hi)/2;if(cabe(n,s,px*m,py*m))lo=m;else hi=m}px*=lo;py*=lo}
  return[px,py]
}
function ancorar(s,ax,ay,f){                    /* o ponto sob o ponteiro fica parado (roda, pinça, duplo clique) */
  var W=tam(),H=tamH(),L=aEl(s,ax-.5-s.px,(ay-.5-s.py)*(H/W));
  s.px=s.px+(1-f)*L[0];s.py=s.py+(1-f)*L[1]*(W/H)
}
function zoomPara(s,z,ax,ay){                   /* zoom final (absoluto) ancorado no ponto (ax,ay) */
  var z0=s.z,z1=Math.max(zmin(s,cur),Math.min(400,Math.round(z)));
  if(z1===z0)return;
  ancorar(s,ax,ay,z1/z0);s.z=z1
}
function pintar(){pintaMain();qualidade()}      /* durante o gesto: a foto e o selo de qualidade (BR-12) */

/* arrastar 1:1 com o mouse e com o dedo (Pointer Events + setPointerCapture) */
win.addEventListener('pointerdown',function(e){
  if(e.button!=null&&e.button>0)return;
  var s=S();
  pts[e.pointerId]={x:e.clientX,y:e.clientY};
  var k=Object.keys(pts);
  try{win.setPointerCapture(e.pointerId)}catch(x){}
  try{win.focus()}catch(x){}
  if(k.length===1){gst={tipo:'arrasto',id:e.pointerId,x:e.clientX,y:e.clientY,px:s.px,py:s.py};win.classList.add('is-drag')}
  else if(k.length===2){var a=pts[k[0]],b=pts[k[1]];gst={tipo:'pinca',d0:dist(a,b),z0:s.z}}
  e.preventDefault()
});
win.addEventListener('pointermove',function(e){
  var p=pts[e.pointerId];if(!p||!gst)return;
  var s=S(),k=Object.keys(pts);
  if(gst.tipo==='pinca'&&k.length>=2){          /* pinça de dois dedos: zoom ancorado no ponto médio */
    pts[e.pointerId]={x:e.clientX,y:e.clientY};
    var a=pts[k[0]],b=pts[k[1]],d=dist(a,b),md=meio(a,b);
    if(gst.d0>8&&d>8){dbl=null;zoomPara(s,gst.z0*d/gst.d0,md[0],md[1]);acertar(cur,s);pintar();sincronizar()}
    return
  }
  if(gst.tipo!=='arrasto')return;
  var dx=e.clientX-gst.x,dy=e.clientY-gst.y;
  if(!dx&&!dy)return;
  ultTap=0;                                                /* arrastar cancela o duplo toque */
  dbl=null;
  var rawx=gst.px+dx/tam(),rawy=gst.py+dy/tamH(),pp=prender(cur,s,rawx,rawy);
  s.px=pp[0];s.py=pp[1];
  /* elástico na borda: a foto recua um pouco da beirada e volta ao soltar (FN-04) */
  var rec=parado()?0:.28;
  s.ex=Math.max(-.06,Math.min(.06,-(rawx-s.px)*rec));
  s.ey=Math.max(-.06,Math.min(.06,-(rawy-s.py)*rec));
  pintar()
});
function solta(e){
  if(!pts[e.pointerId])return;
  var s=S(),id=e.pointerId,agora=Date.now();
  delete pts[id];
  if(gst&&gst.tipo==='arrasto'&&gst.id===id){
    win.classList.remove('is-drag');
    if(e.type==='pointerup'&&agora-ultTap<320&&Math.abs(e.clientX-ultX)<32&&Math.abs(e.clientY-ultY)<32){ultTap=0;gst=null;alternaZoom(e);return}   /* duplo clique/toque */
    ultTap=agora;ultX=e.clientX;ultY=e.clientY;
    voltarElastica(s);gst=null;return
  }
  if(gst&&gst.tipo==='pinca'){
    var restam=Object.keys(pts);
    if(restam.length===1){var q=pts[restam[0]];gst={tipo:'arrasto',id:restam[0],x:q.x,y:q.y,px:s.px,py:s.py}}   /* sobra um dedo: continua arrastando */
    else gst=null;
    commit('zoom');return
  }
  if(!Object.keys(pts).length){gst=null;win.classList.remove('is-drag')}
}
win.addEventListener('pointerup',solta);win.addEventListener('pointercancel',solta);
function voltarElastica(s){                     /* a mola volta ao lugar: uma entrada no histórico por gesto */
  if(parado()||(!s.ex&&!s.ey)){s.ex=s.ey=0;pintar();commit('pos');return}
  var x0=s.ex,y0=s.ey,t0=window.performance?performance.now():Date.now(),D=200;
  if(rafE)cancelAnimationFrame(rafE);
  (function passo(t){
    var k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,3);
    s.ex=x0*(1-e);s.ey=y0*(1-e);pintar();
    if(k<1)rafE=requestAnimationFrame(passo);else{rafE=null;s.ex=s.ey=0;commit('pos')}
  })(t0)
}
function alternaZoom(e){                         /* duplo clique/toque: 200% no ponto; de novo volta ao zoom anterior */
  var s=S(),m=naJanela(e);
  if(dbl&&dbl.n===cur){s.z=dbl.z;s.px=dbl.px;s.py=dbl.py;dbl=null}
  else{dbl={n:cur,z:s.z,px:s.px,py:s.py};zoomPara(s,200,m[0],m[1])}
  acertar(cur,s);commit('zoom')
}
/* roda: 10% por passo, ancorada no cursor; ctrlKey (pinça do trackpad): passo proporcional ao deltaY */
win.addEventListener('wheel',function(e){
  if(!e.deltaY)return;
  e.preventDefault();
  var s=S(),m=naJanela(e),f=e.ctrlKey?Math.pow(1.1,-e.deltaY/100):(e.deltaY<0?1.1:1/1.1);
  dbl=null;zoomPara(s,s.z*f,m[0],m[1]);acertar(cur,s);commit('zoom')
},{passive:false});
function mover(dx,dy){                           /* dx e dy em mm (FN-12: 1 mm, Shift 5 mm) */
  var s=S(),p=prender(cur,s,s.px+dx/FR.jw,s.py+dy/FR.jh);
  dbl=null;s.px=p[0];s.py=p[1];s.ex=s.ey=0;commit('pos')
}
function zoomPor(f){var s=S();dbl=null;zoomPara(s,s.z*f,.5,.5);acertar(cur,s);commit('zoom')}
document.addEventListener('keydown',function(e){
  var m=e.ctrlKey||e.metaKey,t=e.target,tag=t&&t.tagName;
  if(m&&!e.shiftKey&&e.key.toLowerCase()==='z'&&tag!=='INPUT'){e.preventDefault();desfazer();return}
  if(m&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toLowerCase()==='z'))&&tag!=='INPUT'){e.preventDefault();refazer();return}
  if(m||e.altKey)return;
  var livre=t===win||t===document.body||!t;
  if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')return;
  if(e.key==='['){ir(cur-1);return}
  if(e.key===']'){ir(cur+1);return}
  if(!livre)return;
  var st=e.shiftKey?5:1;
  if(e.key==='ArrowLeft'){mover(-st,0);e.preventDefault()}
  else if(e.key==='ArrowRight'){mover(st,0);e.preventDefault()}
  else if(e.key==='ArrowUp'){mover(0,-st);e.preventDefault()}
  else if(e.key==='ArrowDown'){mover(0,st);e.preventDefault()}
  else if(e.key==='+'||e.key==='='){zoomPor(1.1);e.preventDefault()}
  else if(e.key==='-'||e.key==='_'){zoomPor(1/1.1);e.preventDefault()}
  else if(e.key==='0'){ACT.centralizar();e.preventDefault()}
});

/* ---------- render ---------- */
function render(){
  if(window.PLMOL)PLMOL.render();                                  /* aplica a moldura, atualiza os campos e redimensiona a mesa (inclusive em desfazer e refazer) */
  var s=S(),nv;
  $('ctx-foto').textContent=p2(cur)+' de '+N;
  $('faixa-current').textContent=p2(cur);$('faixa-total').textContent=N;$('faixa-n').textContent=N;
  $('cap').textContent=DEMO?LEG[(src(cur)-1)%4]:(s.txt||'');   /* 44: legenda de exemplo só no projeto demo */
  var cota=window.PLMOL?PLMOL.cota():'Passe-partout inferior: '+nf(FR.ch-FR.ct-FR.cjh)+' mm',separador=cota.indexOf(':');
  $('cota-label').textContent=cota.slice(0,separador+1);$('cota-value').textContent=cota.slice(separador+1).trim();
  $('nb').hidden=!mudou(s);
  $('fprev').disabled=cur<=1;$('fnext').disabled=cur>=N;
  $('undo').disabled=hi<=0;$('redo').disabled=hi>=hist.length-1;
  document.title='Polar Life · '+NOME+' · Quadro · Foto '+p2(cur);
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

window.PLQ={sinc:sincronizar,lote:lote,thumb:thumb,ajustou:ajustou,nat:nat,vert:function(n){return!!VERT[src(n)]},src:src,duplicar:duplicar,remover:remover,FR:FR,dim:dimensionar,render:render,cena:cena,midia:midia,real:!DEMO,acertar:acertar,ST:function(){return ST},S:S,cur:function(){return cur},commit:commit,toast:toast,p2:p2,pw:function(){return $('pq')}};
Object.defineProperty(window.PLQ,'N',{get:function(){return N}});
/* ---------- partida ---------- */
construir();faixa();
if(window.ResizeObserver){new ResizeObserver(dimensionar).observe($('stage'))}else window.addEventListener('resize',dimensionar);
dimensionar();render();
var c0=document.querySelector('.th[aria-current]');if(c0&&c0.scrollIntoView)c0.scrollIntoView({block:'nearest',inline:'center'});
})();
