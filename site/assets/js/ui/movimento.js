/* PLMOV · movimento compartilhado (brief §0.2 e §5.4 · D-118)
   Revela as seções ao rolar (A6): `animation-timeline: view()` quando o navegador suporta;
   senão, um IntersectionObserver que acrescenta `.is-in` uma vez. Com movimento reduzido,
   nenhuma classe é aplicada e o conteúdo fica no estado final (brief §8.4). */
(function(){
'use strict';
var PLMOV;

function reduzido(){try{return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)}catch(e){return false}}
function suportaView(){try{return !!(window.CSS&&CSS.supports&&CSS.supports('animation-timeline','view()'))}catch(e){return false}}

function marcar(raiz){
  var els=[].slice.call((raiz||document).querySelectorAll('.mov-rise'));
  var pai={};
  els.forEach(function(el){
    var p=el.parentNode;
    if(!pai[p])pai[p]=0;
    el.style.setProperty('--mov-i',Math.min(pai[p],6));   /* escada de 60 ms, no máximo 6 */
    pai[p]=pai[p]+1;
  });
  return els;
}

function revelar(raiz){
  if(reduzido())return [];                    /* movimento reduzido: nada é animado nem marcado */
  var els=marcar(raiz);
  if(suportaView())return els;                /* o CSS cuida da revelação pela rolagem */
  if(!window.IntersectionObserver)return els;
  var io=new IntersectionObserver(function(entradas){
    entradas.forEach(function(en){
      if(en.isIntersecting){en.target.classList.add('is-in');io.unobserve(en.target)}
    });
  },{threshold:0.3});
  els.forEach(function(el){io.observe(el)});
  return els;
}

PLMOV={
  revelar:revelar,
  reduzido:reduzido,
  suportaView:suportaView
};
window.PLMOV=PLMOV;

/* a marca no <html> diz ao CSS que o JavaScript roda: sem ele, nada fica escondido */
try{document.documentElement.className+=(document.documentElement.className?' ':'')+'mov-js'}catch(e){}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){revelar(document)});
else revelar(document);
})();
