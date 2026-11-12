/* PLDESLIZAR · controles deslizantes que não mudam sem querer ao rolar (D-171).
   No toque, o controle nativo pulava de valor assim que o dedo encostava na trilha — rolar o painel mexia no ajuste.
   Aqui, em aparelhos de toque, o input[type=range] não recebe o dedo (CSS: pointer-events:none; o contêiner fica com
   touch-action:pan-y). Este módulo decide pelo gesto: arrastar na horizontal ajusta (1:1 com o dedo); gesto vertical
   rola a tela; toque parado não muda nada. Mouse, caneta e teclado continuam com o comportamento nativo. */
(function(){
'use strict';
var LIMIAR=8,POLEGAR=24;                       /* px até decidir o gesto; largura do polegar (quadro.css: 24 px) */
var toque=false;try{toque=window.matchMedia('(pointer:coarse)').matches}catch(e){}
if(!toque||!window.PointerEvent){window.PLDESLIZAR={ativo:false};return}
document.documentElement.classList.add('desl-toque');

var g=null;                                    /* gesto em andamento */
function visivel(el){var r=el.getBoundingClientRect();return r.width>0&&r.height>0&&!el.disabled}
function acharRange(x,y){
  var l=document.querySelectorAll('input[type=range]');
  for(var i=0;i<l.length;i++){var r=l[i].getBoundingClientRect();
    if(visivel(l[i])&&x>=r.left-4&&x<=r.right+4&&y>=r.top-8&&y<=r.bottom+8)return l[i]}
  return null
}
function valorEm(el,x){
  var r=el.getBoundingClientRect(),min=parseFloat(el.min||0),max=parseFloat(el.max||100),st=el.step==='any'?0:parseFloat(el.step||1);
  var f=(x-r.left-POLEGAR/2)/Math.max(1,r.width-POLEGAR);f=Math.max(0,Math.min(1,f));
  var v=min+f*(max-min);if(st>0)v=min+Math.round((v-min)/st)*st;
  v=Math.max(min,Math.min(max,v));
  var casas=String(st).split('.')[1];return casas?v.toFixed(casas.length):String(Math.round(v))
}
function emitir(el,tipo){el.dispatchEvent(new Event(tipo,{bubbles:true}))}

document.addEventListener('pointerdown',function(e){
  if(e.pointerType!=='touch'||g)return;
  var el=acharRange(e.clientX,e.clientY);if(!el)return;
  g={el:el,id:e.pointerId,x:e.clientX,y:e.clientY,arrastando:false,mudou:false}
},true);
document.addEventListener('pointermove',function(e){
  if(!g||e.pointerId!==g.id)return;
  var dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(!g.arrastando){
    if(Math.abs(dy)>LIMIAR&&Math.abs(dy)>=Math.abs(dx)){g=null;return}      /* vertical: é rolagem */
    if(Math.abs(dx)<=LIMIAR)return;
    g.arrastando=true;try{e.target.setPointerCapture&&e.target.setPointerCapture(e.pointerId)}catch(x){}
  }
  e.preventDefault();
  var v=valorEm(g.el,e.clientX);
  if(v!==g.el.value){g.el.value=v;g.mudou=true;emitir(g.el,'input')}
},{capture:true,passive:false});
function fim(e){
  if(!g||e.pointerId!==g.id)return;
  if(g.arrastando&&g.mudou)emitir(g.el,'change');
  g=null
}
document.addEventListener('pointerup',fim,true);
document.addEventListener('pointercancel',function(e){if(g&&e.pointerId===g.id)g=null},true);

window.PLDESLIZAR={ativo:true,valorEm:valorEm};
})();
