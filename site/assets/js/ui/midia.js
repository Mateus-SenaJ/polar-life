/* PLMIDIA · vídeos e imagens realistas com reserva (D-140, D-141, D-142)
   Só pede ao servidor o que está em window.PLMIDIA_ARQUIVOS (gerado por tools/gerar-midia.mjs):
   arquivo ausente nunca vira erro, a página fica com o poster e o desenho.
   Vídeo ([data-midia]): decorativo, mudo e em loop; carrega só quando entra na tela (IntersectionObserver)
   e pausa fora dela. Com movimento reduzido ou economia de dados, fica só o poster (T3).
   Com [data-midia-vez] toca uma vez só e para no último quadro (D-146).
   Câmera ([data-midia-camera]) e fotos de pessoas ([data-midia-foto]): trocam o desenho/foto de reserva
   pelo arquivo definitivo quando ele existe. Tudo local (T5, T6). */
(function(){
'use strict';
var LISTA=window.PLMIDIA_ARQUIVOS||[],PLMIDIA;
function tem(c){return LISTA.indexOf(c)>=0}
function reduzido(){try{return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)}catch(e){return false}}
function economia(){ /* Save-Data ou rede muito lenta: só o poster */
  var c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  return !!(c&&(c.saveData||/(^|-)2g$/.test(c.effectiveType||'')))}
function estreito(){try{return !!(window.matchMedia&&window.matchMedia('(max-width: 599px)').matches)}catch(e){return false}}
function base(el){return el.getAttribute('data-midia-base')||''}
function todos(sel){return [].slice.call(document.querySelectorAll(sel))}

/* ---------- vídeo ---------- */
function variante(nome){ /* no celular, a versão em pé (4:5) quando existir */
  return estreito()&&tem('video/'+nome+'-vertical.mp4')?nome+'-vertical':nome}
function fonte(v,src,tipo){var s=document.createElement('source');s.src=src;s.type=tipo;v.appendChild(s)}
function carregar(cx,v,nome){
  if(cx.getAttribute('data-midia-estado'))return;
  cx.setAttribute('data-midia-estado','carregando');
  var b=base(cx);
  if(tem('video/'+nome+'.webm'))fonte(v,b+'video/'+nome+'.webm','video/webm');
  fonte(v,b+'video/'+nome+'.mp4','video/mp4');
  v.addEventListener('playing',function(){cx.setAttribute('data-midia-estado','tocando');cx.classList.add('is-tocando')});
  if(cx.hasAttribute('data-midia-vez')){v.loop=false;v.addEventListener('ended',function(){cx.setAttribute('data-midia-estado','fim')})}
  v.muted=true;v.load();tocar(v)
}
function tocar(v){if(v.ended)return;try{var p=v.play();if(p&&p.catch)p.catch(function(){})}catch(e){}}
/* D-207 · movimento de câmera preso ao tempo do vídeo: [fração da duração, x %, y %, escala]. object-position x y põe o
   ponto (x, y) do vídeo no mesmo ponto do quadro, então a escala em torno dele aproxima exatamente ali. Suave nos dois
   sentidos (smoothstep), volta ao começo no fim do laço. Com movimento reduzido nem chega aqui (só o poster). */
function percurso(cx,v,nome){
  var k=cx.getAttribute('data-midia-percurso'+(/-vertical$/.test(nome)?'-vertical':'')),P;
  try{P=JSON.parse(k||'null')}catch(e){P=null}
  if(!P||P.length<2||!window.requestAnimationFrame)return;
  function em(t){var i=0;while(i<P.length-2&&t>P[i+1][0])i++;var a=P[i],b=P[i+1],u=b[0]>a[0]?Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0]))):1;u=u*u*(3-2*u);
    return[a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u,a[3]+(b[3]-a[3])*u]}
  var p0=em(0),pos=p0[0].toFixed(2)+'% '+p0[1].toFixed(2)+'%',poster=cx.querySelector('.midia__poster');
  if(poster)poster.style.objectPosition=pos;
  v.style.objectPosition=pos;
  function passo(){
    if(!v.paused&&v.duration>0){var q=em((v.currentTime%v.duration)/v.duration),s=q[0].toFixed(2)+'% '+q[1].toFixed(2)+'%';
      v.style.objectPosition=s;v.style.transformOrigin=s;v.style.transform='scale('+q[2].toFixed(4)+')'}
    requestAnimationFrame(passo)}
  requestAnimationFrame(passo)
}
function video(cx){
  var v=cx.querySelector('video');if(!v)return;
  var nome=variante(cx.getAttribute('data-midia')),b=base(cx);
  if(cx.querySelector('.midia__poster'))cx.classList.add('tem-poster');   /* D-207: o poster já está no HTML (<picture>), certo para cada tela */
  else if(tem('video/'+nome+'-poster.jpg')){v.setAttribute('poster',b+'video/'+nome+'-poster.jpg');cx.classList.add('tem-poster')}
  if(!tem('video/'+nome+'.mp4'))return;                    /* ainda sem vídeo: poster e desenho */
  if(reduzido()||economia())return;                        /* só o poster */
  percurso(cx,v,nome);
  if(!window.IntersectionObserver){carregar(cx,v,nome);return}
  var io=new IntersectionObserver(function(es){
    es.forEach(function(en){
      if(en.isIntersecting){if(cx.getAttribute('data-midia-estado'))tocar(v);else carregar(cx,v,nome)}
      else if(cx.getAttribute('data-midia-estado'))try{v.pause()}catch(e){}
    })
  },{rootMargin:'200px 0px'});
  io.observe(cx)
}

/* ---------- câmera realista e fotos de pessoas ---------- */
function trocar(el,src){ /* <img> usa src; <image> do SVG usa href */
  if(el.namespaceURI==='http://www.w3.org/2000/svg'){el.setAttribute('href',src);el.removeAttribute('display')}
  else{el.src=src;el.hidden=false}
}
function camera(el){
  var arq='img/fotos/camera-'+el.getAttribute('data-midia-camera')+'.png';
  if(!tem(arq))return;
  trocar(el,base(el)+arq);
  var cx=el.closest?el.closest('[data-midia-cam]'):null;
  if(cx)cx.classList.add('tem-camera')                     /* o CSS esconde o desenho */
}
function foto(el){
  var arq='img/fotos/'+el.getAttribute('data-midia-foto')+'.jpg';
  if(tem(arq))trocar(el,base(el)+arq)
}
function montar(){
  todos('[data-midia-camera]').forEach(camera);
  todos('[data-midia-foto]').forEach(foto);
  todos('[data-midia]').forEach(video)
}

PLMIDIA={tem:tem,montar:montar,reduzido:reduzido,economia:economia};
window.PLMIDIA=PLMIDIA;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',montar);else montar();
})();
