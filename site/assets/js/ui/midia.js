/* PLMIDIA · vídeos e imagens realistas com reserva (D-140, D-141, D-142)
   Só pede ao servidor o que está em window.PLMIDIA_ARQUIVOS (gerado por tools/gerar-midia.mjs):
   arquivo ausente nunca vira erro, a página fica com o poster e o desenho.
   Vídeo ([data-midia]): decorativo, mudo e em loop; carrega só quando entra na tela (IntersectionObserver)
   e pausa fora dela. Com movimento reduzido ou economia de dados, fica só o poster (T3).
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
function estreito(){try{return !!(window.matchMedia&&window.matchMedia('(max-width: 1023px)').matches)}catch(e){return false}}
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
  v.muted=true;v.load();tocar(v)
}
function tocar(v){try{var p=v.play();if(p&&p.catch)p.catch(function(){})}catch(e){}}
function video(cx){
  var v=cx.querySelector('video');if(!v)return;
  var nome=variante(cx.getAttribute('data-midia')),b=base(cx);
  if(tem('video/'+nome+'-poster.jpg')){v.setAttribute('poster',b+'video/'+nome+'-poster.jpg');cx.classList.add('tem-poster')}
  if(!tem('video/'+nome+'.mp4'))return;                    /* ainda sem vídeo: poster e desenho */
  if(reduzido()||economia())return;                        /* só o poster */
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
