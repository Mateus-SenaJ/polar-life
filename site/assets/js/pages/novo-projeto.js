/* T-02 · novo-projeto · comportamento da página */
(function(){
var $=function(i){return document.getElementById(i)};
var SVGNS='http://www.w3.org/2000/svg';

/* ===== Dados · DOC-05 FN-01 e FN-03; paginação · DOC-08 §3 ===== */
var FORMATS=[
 {id:'classico',name:'Clássico',w:88,h:107},
 {id:'mini',name:'Mini quadrado',w:60,h:73},
 {id:'pocket',name:'Retro Pocket',w:66,h:99},
 {id:'imini',name:'Instax Mini',w:54,h:86},
 {id:'isquare',name:'Instax Square',w:72,h:86},
 {id:'iwide',name:'Instax Wide',w:108,h:86}
];
var PAPERS=[
 {id:'A3',name:'A3',w:297,h:420},
 {id:'A4',name:'A4',w:210,h:297,rec:true},
 {id:'A5',name:'A5',w:148,h:210},
 {id:'13x18',name:'13 × 18 cm',w:130,h:180},
 {id:'10x15',name:'10 × 15 cm',w:100,h:150}
];
var BYSIZE=['10x15','A5','13x18','A4','A3'];
var S={fmt:'classico',fw:88,fh:107,ww:76,wh:76,paper:'A4',pori:'portrait',pw:210,ph:297,rot:true,margin:10,gap:4};

function fmtById(id){for(var i=0;i<FORMATS.length;i++)if(FORMATS[i].id===id)return FORMATS[i]}
function paperById(id){for(var i=0;i<PAPERS.length;i++)if(PAPERS[i].id===id)return PAPERS[i]}
function nf(n){return String(Math.round(n*10)/10).replace('.',',')}
function winOf(w,h){
  if(w===66&&h===99)return [60,79];            /* Pocket: janela 60 × 79 (etapa 34, D-113) */
  if(w===88&&h===107)return [76,76];            /* Clássico: DOC-05 FN-03 */
  var side=w*0.068;return [w-2*side,h-side-h*0.234]; /* ilustrativo: janela dos demais [PENDENTE] */
}
function um(x){return Math.round(x*1000)}      /* MT-01: µm inteiros */

/* Paginação determinística (DOC-08 §3): empate = sem giro; nunca folha vazia */
function fit(W,H,fw,fh,m,g,allowRot){
  var aw=um(W)-2*um(m),ah=um(H)-2*um(m),G=um(g),res=null,base=0;
  [false,true].forEach(function(r){
    if(r&&!allowRot)return;
    var a=um(r?fh:fw),b=um(r?fw:fh);
    var c=Math.max(0,Math.floor((aw+G)/(a+G))),ro=Math.max(0,Math.floor((ah+G)/(b+G))),n=c*ro;
    if(!r){base=n;res={n:n,rot:false,cols:c,rows:ro}}
    else if(n>res.n){res={n:n,rot:true,cols:c,rows:ro}}
  });
  res.gain=res.rot?res.n-base:0;
  return res;
}
function sheetDims(){
  var p=S.paper==='custom'?{w:S.pw,h:S.ph}:paperById(S.paper);
  var lo=Math.min(p.w,p.h),hi=Math.max(p.w,p.h);
  return S.pori==='portrait'?{w:lo,h:hi}:{w:hi,h:lo};
}
function sheetDimsOf(p){var lo=Math.min(p.w,p.h),hi=Math.max(p.w,p.h);return S.pori==='portrait'?{w:lo,h:hi}:{w:hi,h:lo}}

/* ===== Validação ===== */
function errors(){
  var e={},f=S.fmt==='custom';
  function bad(k,v,min,max,msg){if(!(v>=min&&v<=max))e[k]=msg}
  if(f){
    var m1='Digite um valor maior que 0 mm.';
    ['fw','fh','ww','wh'].forEach(function(k){
      var v=S[k];
      if(!(v>0))e[k]=m1;else if(v>1000)e[k]='O limite é 1000 mm.';
    });
    if(!e.ww&&!e.fw&&S.ww>=S.fw)e.ww='A janela precisa ser menor que a moldura.';
    if(!e.wh&&!e.fh&&S.wh>=S.fh)e.wh='A janela precisa ser menor que a moldura.';
  }
  if(S.paper==='custom'){
    var m2='Digite um valor entre 50 e 1000 mm.';
    bad('pw',S.pw,50,1000,m2);bad('ph',S.ph,50,1000,m2);
  }
  return e;
}

/* ===== Formato: cartões ===== */
function polHTML(w,h,max){
  var k=max/Math.max(w,h),W=w*k,H=h*k,win=winOf(w,h),l=(w-win[0])/2,t=Math.min(l,(h-win[1])/2);
  return '<span class="pol" style="width:'+W.toFixed(1)+'px;height:'+H.toFixed(1)+'px"><i style="left:'+(l*k).toFixed(1)+'px;top:'+(t*k).toFixed(1)+'px;width:'+(win[0]*k).toFixed(1)+'px;height:'+(win[1]*k).toFixed(1)+'px"></i></span>';
}
function buildCards(){
  var g=$('fmt-grid'),h='';
  FORMATS.forEach(function(f){
    h+='<label class="fmt-card"><input type="radio" name="fmt" value="'+f.id+'" aria-label="'+f.name+', '+f.w+' por '+f.h+' milímetros"><span class="fmt-card__in"><span class="chk"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg></span><span class="fmt-art" aria-hidden="true">'+polHTML(f.w,f.h,72)+'</span><span class="fmt-name">'+f.name+'</span><span class="mono" aria-hidden="true">'+f.w+' × '+f.h+' mm</span></span></label>';
  });
  h+='<label class="fmt-card"><input type="radio" name="fmt" value="custom" aria-label="Personalizado, você define as medidas"><span class="fmt-card__in"><span class="chk"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg></span><span class="fmt-art" aria-hidden="true"><span class="pol pol--custom" style="width:56px;height:68px"><svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></span></span><span class="fmt-name">Personalizado</span><span class="mono" aria-hidden="true">Suas medidas</span></span></label>';
  g.innerHTML=h;
}

/* ===== Campo numérico (DOC-01 §5) ===== */
var fields={};
function numField(host,o){
  var w=document.createElement('div');w.className='fld';
  w.innerHTML='<label class="lbl" for="'+o.id+'">'+o.label+'</label>'+
  '<div class="num"><button type="button" class="num__b" data-d="-1" aria-label="Diminuir '+o.label.toLowerCase()+'"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button>'+
  '<div class="num__v"><input id="'+o.id+'" type="text" inputmode="decimal" autocomplete="off" aria-describedby="'+o.id+'-h"><span class="num__u mono" aria-hidden="true">mm</span></div>'+
  '<button type="button" class="num__b" data-d="1" aria-label="Aumentar '+o.label.toLowerCase()+'"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></div>'+
  '<p class="help" id="'+o.id+'-h"></p>';
  host.appendChild(w);
  var inp=w.querySelector('input');
  fields[o.id]={wrap:w,inp:inp,help:w.querySelector('.help'),text:o.help};
  inp.addEventListener('input',function(){
    var t=inp.value.replace(',','.').trim(),v=t===''?NaN:Number(t);
    S[o.key]=v;update();
  });
  inp.addEventListener('blur',function(){if(!isNaN(S[o.key]))inp.value=nf(S[o.key])});
  w.addEventListener('click',function(e){
    var b=e.target.closest('.num__b');if(!b)return;
    var d=Number(b.dataset.d),v=isNaN(S[o.key])?0:S[o.key];
    S[o.key]=Math.max(0,Math.round((v+d)*10)/10);inp.value=nf(S[o.key]);update();
  });
}
function buildFields(){
  var f=$('custom-frame-fields'),p=$('custom-paper-fields');
  numField(f,{id:'fw',key:'fw',label:'Largura da moldura',help:'A polaroid inteira.'});
  numField(f,{id:'fh',key:'fh',label:'Altura da moldura',help:'A polaroid inteira.'});
  numField(f,{id:'ww',key:'ww',label:'Largura da janela',help:'Onde a foto aparece.'});
  numField(f,{id:'wh',key:'wh',label:'Altura da janela',help:'Onde a foto aparece.'});
  numField(p,{id:'pw',key:'pw',label:'Largura do papel',help:'Entre 50 e 1000 mm.'});
  numField(p,{id:'ph',key:'ph',label:'Altura do papel',help:'Entre 50 e 1000 mm.'});
}
function syncInputs(){
  Object.keys(fields).forEach(function(k){
    var F=fields[k];if(document.activeElement!==F.inp&&!isNaN(S[k]))F.inp.value=nf(S[k]);
  });
}

/* ===== Prévia da folha ===== */
function el(n,a){var e=document.createElementNS(SVGNS,n);for(var k in a)e.setAttribute(k,a[k]);return e}
function drawSheet(P,r,fits){
  var svg=el('svg',{viewBox:'0 0 '+P.w+' '+P.h,preserveAspectRatio:'xMidYMid meet'});
  svg.appendChild(el('rect',{x:0,y:0,width:P.w,height:P.h,fill:'#FFFFFF',stroke:'#000000','stroke-opacity':'.16','stroke-width':1}));
  var l=(S.fw-S.ww)/2,t=Math.min(l,(S.fh-S.wh)/2),bm=S.fh-t-S.wh;
  function cell(x,y,w,h,wl,wt,ww,wh){
    svg.appendChild(el('rect',{x:x,y:y,width:w,height:h,fill:'#FFFFFF',stroke:'#000000','stroke-opacity':'.35','stroke-width':1}));
    svg.appendChild(el('rect',{x:x+wl,y:y+wt,width:ww,height:wh,fill:'#F8F9FA'}));
  }
  if(fits){
    var a=r.rot?S.fh:S.fw,b=r.rot?S.fw:S.fh,g=S.gap,m=S.margin;
    var bw=r.cols*a+(r.cols-1)*g,bh=r.rows*b+(r.rows-1)*g;
    var x0=m+((P.w-2*m)-bw)/2,y0=m+((P.h-2*m)-bh)/2;
    var wl=r.rot?bm:l,wt=r.rot?l:t,ww=r.rot?S.wh:S.ww,wh=r.rot?S.ww:S.wh;
    for(var i=0;i<r.rows;i++)for(var j=0;j<r.cols;j++)cell(x0+j*(a+g),y0+i*(b+g),a,b,wl,wt,ww,wh);
  }else{
    svg.appendChild(el('rect',{x:(P.w-S.fw)/2,y:(P.h-S.fh)/2,width:S.fw,height:S.fh,fill:'none',stroke:'#000000','stroke-width':1.5,'stroke-dasharray':'6 4'}));
  }
  var box=$('sheet');box.innerHTML='';box.appendChild(svg);
}

/* ===== Texto do resultado ===== */
function oriName(o){return o==='portrait'?'retrato':'paisagem'}
function paperName(){return S.paper==='custom'?'Personalizado':paperById(S.paper).name}
function fmtName(){return S.fmt==='custom'?'Personalizado':fmtById(S.fmt).name}
function plural(n){return n+' por folha'}

var tm;
function toast(msg){clearTimeout(tm);$('toast-t').textContent=msg;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},4000)}

function update(){
  var e=errors(),ok=Object.keys(e).length===0;
  /* campos: mensagens */
  Object.keys(fields).forEach(function(k){
    var F=fields[k],msg=e[k];
    F.wrap.classList.toggle('fld--err',!!msg);
    F.inp.setAttribute('aria-invalid',msg?'true':'false');
    F.help.innerHTML=msg?'<span class="err"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg><span>'+msg+'</span></span>':F.text;
  });
  syncInputs();
  /* orientações */
  if(S.fmt!=='custom'||!isNaN(S.fw)&&!isNaN(S.fh)){
    var cur=S.fw>S.fh?'landscape':'portrait';
    document.querySelector('input[name=ori][value='+cur+']').checked=true;
  }
  document.querySelector('input[name=pori][value='+S.pori+']').checked=true;
  document.querySelector('input[name=fmt][value='+S.fmt+']').checked=true;
  $('custom-frame').hidden=S.fmt!=='custom';
  $('custom-paper').hidden=S.paper!=='custom';

  /* select de papel com contagem */
  var sel=$('paper'),h='';
  var frameOk=!e.fw&&!e.fh&&!e.ww&&!e.wh;
  PAPERS.forEach(function(p){
    var d=sheetDimsOf(p),txt=p.name+' ('+p.w+' × '+p.h+' mm)';
    if(p.rec)txt+=' — Recomendado';
    if(frameOk){var n=fit(d.w,d.h,S.fw,S.fh,S.margin,S.gap,S.rot).n;txt+=n>0?' ('+plural(n)+')':' — não cabe'}
    h+='<option value="'+p.id+'">'+txt+'</option>';
  });
  h+='<option value="custom">Personalizado (50–1000 mm)</option>';
  sel.innerHTML=h;sel.value=S.paper;

  var msg=$('msg-err'),pill=$('pill'),btn=$('continuar');
  msg.hidden=true;pill.hidden=true;$('err-fix').hidden=true;
  if(!ok){
    $('sheet').innerHTML='';
    $('count').innerHTML='<span class="count__n">—</span>';
    $('meta').textContent='Corrija as medidas destacadas para ver o resultado.';
    btn.disabled=true;
    return;
  }
  var P=sheetDims(),r=fit(P.w,P.h,S.fw,S.fh,S.margin,S.gap,S.rot);
  var orient=S.fw>S.fh?'landscape':'portrait';
  var dims=nf(S.fw)+' × '+nf(S.fh)+' mm';
  $('meta').innerHTML=paperName()+' '+oriName(S.pori)+' · '+fmtName()+' <span class="mono">'+dims+'</span>';
  if(r.n===0){
    drawSheet(P,r,false);
    $('count').innerHTML='<span class="count__n">0</span> por folha';
    msg.hidden=false;
    $('err-t').textContent='A polaroid não cabe neste papel';
    var sug=null;
    for(var i=0;i<BYSIZE.length;i++){var p=paperById(BYSIZE[i]),d=sheetDimsOf(p);if(fit(d.w,d.h,S.fw,S.fh,S.margin,S.gap,S.rot).n>0){sug=p;break}}
    if(sug){
      $('err-d').textContent='Troque para um papel maior ou escolha um formato menor.';
      var b=$('err-fix');b.textContent='Usar '+sug.name;b.dataset.paper=sug.id;b.hidden=false;
    }else{
      $('err-d').textContent='Escolha um formato menor ou outro papel.';
    }
    btn.disabled=true;
    return;
  }
  drawSheet(P,r,true);
  $('count').innerHTML='<span class="count__n">'+r.n+'</span> por folha';
  if(r.rot&&r.gain>0){pill.textContent='Girada para caber mais: +'+r.gain+' por folha';pill.hidden=false}
  btn.disabled=false;
}

/* ===== Eventos ===== */
function setFactory(id){
  var f=fmtById(id),w=winOf(f.w,f.h);
  S.fmt=id;S.fw=f.w;S.fh=f.h;S.ww=w[0];S.wh=w[1];
}
function swapFrame(){var a=S.fw;S.fw=S.fh;S.fh=a;a=S.ww;S.ww=S.wh;S.wh=a}

$('fmt-grid').addEventListener('change',function(e){
  var v=e.target.value;if(!v)return;
  if(v==='custom'){S.fmt='custom'}else setFactory(v);
  update();
});
$('seg-ori').addEventListener('change',function(e){
  var want=e.target.value,cur=S.fw>S.fh?'landscape':'portrait';
  if(want!==cur)swapFrame();
  update();
});
$('seg-pori').addEventListener('change',function(e){S.pori=e.target.value;update()});
$('paper').addEventListener('change',function(){
  S.paper=this.value;
  if(S.paper==='custom'&&(isNaN(S.pw)||isNaN(S.ph))){S.pw=210;S.ph=297}
  update();
});
$('err-fix').addEventListener('click',function(){S.paper=this.dataset.paper;update();$('paper').focus()});
$('uma').addEventListener('click',function(){toast('Este atalho ainda não está disponível.')});
$('continuar').addEventListener('click',function(){
  if(this.disabled)return;
  try{['pl-quadro','pl-fotos','pl-folhas','pl-orientacao','pl-fmt'].forEach(function(k){sessionStorage.removeItem(k)})}catch(e){}   /* projeto novo começa limpo */
  if(S.fmt==='pocket'){try{sessionStorage.setItem('pl-fmt','pocket')}catch(e){}}   /* D-113: o Quadro aplica o padrão de legenda do Pocket */
  location.href='../adicionar-fotos/';
});

/* Estados pelo endereço, para revisão: #personalizado, #nao-cabe */
function init(){
  S.fmt='classico';setFactory('classico');S.paper='A4';S.pori='portrait';S.pw=210;S.ph=297;
  var h=location.hash;
  if(h==='#personalizado'){S.fmt='custom'}
  if(h==='#nao-cabe'){S.paper='10x15'}
  update();
}
buildCards();buildFields();init();
window.addEventListener('hashchange',init);
})();
