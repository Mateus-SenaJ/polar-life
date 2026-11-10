/* T-11 · Inspetor · Ajustes e filtros · DOC-05 FN-06 · DOC-12 DV-20 (selecionado = anel azul 2 px), BR-03 (sem aleatoriedade)
   12 filtros = matriz de cor 4×5 (mesma conta na tela e no export, DOC-08). Estado por foto em ST[n].flt; favoritos em ST[0].fav. */
(function(){
var Q=window.PLQ;if(!Q)return;
var $=function(i){return document.getElementById(i)};
var ID=[1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,1,0];
function mat(sat,con,br,rgb,off){ /* saturação → contraste → brilho → tom por canal */
  var lr=.2126,lg=.7152,lb=.0722,s=sat,rows=[[lr*(1-s)+s,lg*(1-s),lb*(1-s)],[lr*(1-s),lg*(1-s)+s,lb*(1-s)],[lr*(1-s),lg*(1-s),lb*(1-s)+s]],o=[];
  rgb=rgb||[1,1,1];off=off||0;
  for(var c=0;c<3;c++){var k=con*rgb[c];o=o.concat([rows[c][0]*k,rows[c][1]*k,rows[c][2]*k,0,.5*(1-con)*rgb[c]+br+off])}
  return o.concat([0,0,0,1,0])
}
var FILTROS=[
 {id:'original',n:'Original',m:ID},
 {id:'pb',n:'P&B',m:mat(0,1.05,0)},
 {id:'noir',n:'Noir',m:mat(0,1.5,-.05)},
 {id:'retro',n:'Retrô',m:mat(.8,.95,0,[1.08,1,.88],.02)},
 {id:'antiga',n:'Foto Antiga',m:mat(.45,.9,0,[1.1,1,.8],.04)},
 {id:'praia',n:'Praia',m:mat(1.2,1.05,0,[.97,1.03,1.08])},
 {id:'pastel',n:'Pastel',m:mat(.7,.8,.1)},
 {id:'polaroid',n:'Polaroid Clássico',m:mat(.9,.9,0,[1.05,1.02,.95],.03)},
 {id:'instantanea',n:'Instantânea',m:mat(1.15,1.15,0,[1.03,1,.97])},
 {id:'verao',n:'Verão',m:mat(1.2,1.05,0,[1.08,1.02,.9])},
 {id:'desbotado',n:'Desbotado',m:mat(.6,.8,.08)},
 {id:'cinema',n:'Cinema',m:mat(.85,1.2,-.03,[.95,1,1.08])}
];
function por(id){return FILTROS.filter(function(f){return f.id===id})[0]||FILTROS[0]}
function lerp(m,t){return m.map(function(v,i){return+(ID[i]+(v-ID[i])*t).toFixed(4)})}
var UI={fav:false,cmp:false,orig:false},SUG={},tileKey='';
function S0(){var s=Q.ST()[0];if(!s.fav)s.fav=[];return s}
function F(){var s=Q.S();if(!s.flt)s.flt={id:'original',int:100};return s.flt}

/* filtros dos 12 quadradinhos (intensidade cheia) */
var defs='<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'+FILTROS.map(function(f){return'<filter id="tf-'+f.id+'" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="'+f.m.join(' ')+'"/></filter>'}).join('')+'</defs></svg>';
document.body.insertAdjacentHTML('afterbegin',defs);

/* aplica o filtro e a intensidade da foto à foto da mesa */
function aplicar(s){
  var f=s.flt||{id:'original',int:100},el=$('f-flt');if(!el)return;
  el.setAttribute('values',lerp(por(f.id).m,f.int/100).join(' '))
}

/* «Sugerido para esta foto»: histograma simples no aparelho (luz média e cor média), sem aleatoriedade */
function sugerir(n,cb){
  if(SUG[n]){cb(SUG[n]);return}
  try{
    var svg=Q.cena(n,0).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" '),img=new Image();
    img.onload=function(){
      var c=document.createElement('canvas');c.width=c.height=40;var x=c.getContext('2d');x.drawImage(img,0,0,40,40);
      var d=x.getImageData(0,0,40,40).data,L=0,Sa=0,k=d.length/4;
      for(var i=0;i<d.length;i+=4){var r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b);L+=.2126*r+.7152*g+.0722*b;Sa+=mx?(mx-mn)/mx:0}
      L/=k;Sa/=k;
      SUG[n]=L<.38?'cinema':Sa<.12?'noir':L>.62?'pastel':Sa>.35?'polaroid':'retro';cb(SUG[n])
    };
    img.onerror=function(){};img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)
  }catch(e){}
}

/* grade de 12 */
function grade(){
  var n=Q.cur(),f=F(),fav=S0().fav,sug=SUG[n]||'',key=[n,f.id,fav.join(),UI.fav,sug].join('|');
  if(key===tileKey)return;tileKey=key;
  var mini=Q.cena(n,0).replace('preserveAspectRatio="none"','preserveAspectRatio="xMidYMid slice"'),h='';
  FILTROS.filter(function(x){return!UI.fav||fav.indexOf(x.id)>=0||x.id===f.id}).forEach(function(x){
    var on=x.id===f.id,fv=fav.indexOf(x.id)>=0;
    h+='<li class="ft"><button type="button" class="ft__b" role="radio" aria-checked="'+on+'" data-f="'+x.id+'"><span class="ft__ph" style="filter:url(#tf-'+x.id+')">'+mini+'</span><span class="ft__n">'+x.n+'</span>'+(x.id===sug?'<span class="ft__s rotulo">Sugerido</span>':'')+'</button>'
     +'<button type="button" class="ib ft__h" data-fav="'+x.id+'" aria-pressed="'+fv+'" aria-label="'+(fv?'Tirar dos favoritos: ':'Favoritar: ')+x.n+'"><svg class="ico sm"><use href="#i-heart"/></svg></button></li>'
  });
  $('flt-grid').innerHTML=h||'';
  $('flt-vazio').hidden=!!h;
  $('flt-sug').textContent=sug&&sug!==f.id?'Sugerido para esta foto: '+por(sug).n+'. Calculado no seu aparelho.':sug?'Esta foto já usa o filtro sugerido.':'Calculando uma sugestão para esta foto…'
}

/* comparar: esquerda = original, direita = com filtro (só na tela) */
function comparar(){
  var w=$('win'),c=$('cmp');
  if(!UI.cmp){if(c)c.remove();return}
  if(!c){c=document.createElement('div');c.id='cmp';c.className='win__cmp';c.setAttribute('aria-hidden','true');w.insertBefore(c,w.querySelector('.win__grid'))}
  c.innerHTML=$('clip').innerHTML+'<i class="win__cut"></i>'
}
function render(){
  var f=F();aplicar(Q.S());
  document.body.classList.toggle('is-orig',UI.orig);
  [].forEach.call(document.querySelectorAll('[data-flt=cmp]'),function(b){b.setAttribute('aria-pressed',UI.cmp)});
  [].forEach.call(document.querySelectorAll('[data-fview]'),function(i){i.checked=(i.value==='fav')===UI.fav});
  $('fint-r')&&($('fint-r').disabled=$('fint').disabled=f.id==='original');
  sugerir(Q.cur(),function(){grade()});grade();comparar()
}
var M=$('m-flt');
M.addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-f')){F().id=b.getAttribute('data-f');if(F().id!=='original'&&F().int===0)F().int=100;Q.commit('flt');return}
  if(b.hasAttribute('data-fav')){var id=b.getAttribute('data-fav'),a=S0().fav,i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.push(id);Q.commit('flt-fav');Q.toast(i>=0?'Tirado dos favoritos':'Filtro favoritado');return}
  if(b.getAttribute('data-flt')==='cmp'){UI.cmp=!UI.cmp;render()}
});
M.addEventListener('change',function(e){if(e.target.name==='fview'){UI.fav=e.target.value==='fav';tileKey='';render()}});
var vo=$('flt-orig');
function seg(on){UI.orig=on;vo.setAttribute('aria-pressed',on);document.body.classList.toggle('is-orig',on)}
vo.addEventListener('pointerdown',function(e){seg(true);try{vo.setPointerCapture(e.pointerId)}catch(x){}});
['pointerup','pointercancel','blur'].forEach(function(t){vo.addEventListener(t,function(){seg(false)})});
vo.addEventListener('keydown',function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();seg(true)}});
vo.addEventListener('keyup',function(e){if(e.key===' '||e.key==='Enter')seg(false)});
window.PLFLT={render:render,aplicar:aplicar};
render()
})();
