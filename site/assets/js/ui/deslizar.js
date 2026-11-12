/* PLDESLIZAR · controles deslizantes que só mudam quando a pessoa arrasta (D-171, D-185).
   O controle nativo pulava para onde o dedo ou o mouse encostava na trilha: rolar o painel, tocar ou dar um clique na barra
   mudava o ajuste sem querer. Aqui o input[type=range] não recebe o ponteiro (CSS: pointer-events:none; no toque o
   contêiner fica com touch-action:pan-y) e este módulo decide pelo gesto, para mouse, caneta e toque:
   - clicar ou tocar, na bolinha ou na trilha, não muda nada: só dá o foco, para seguir com as setas do teclado;
   - arrastar na horizontal ajusta a partir do valor atual, na mesma distância do gesto (a bolinha acompanha, sem salto);
   - no toque, gesto vertical rola a tela.
   Teclado continua nativo (setas, Home, End, PageUp e PageDown). */
(function(){
'use strict';
if(!window.PointerEvent){window.PLDESLIZAR={ativo:false};return}
var LIMIAR_TOQUE=8,LIMIAR_MOUSE=3,POLEGAR=24;  /* px até decidir que é arrasto; largura do polegar (quadro.css: 24 px) */
document.documentElement.classList.add('desl');

var g=null;                                    /* gesto em andamento */
function visivel(el){var r=el.getBoundingClientRect();return r.width>0&&r.height>0&&!el.disabled}
function acharRange(x,y){
  var l=document.querySelectorAll('input[type=range]'),hit=document.elementFromPoint(x,y);
  for(var i=0;i<l.length;i++){var r=l[i].getBoundingClientRect();
    if(visivel(l[i])&&x>=r.left-4&&x<=r.right+4&&y>=r.top-8&&y<=r.bottom+8){
      /* outro controle por cima (lista aberta, botão, diálogo): o clique é dele */
      if(hit&&!l[i].parentNode.contains(hit)&&hit.closest('button,a,input,select,textarea,label,[role=option],[role=listbox],[role=menu],[role=dialog]'))return null;
      return l[i]}}
  return null
}
function num(v,d){v=parseFloat(v);return isNaN(v)?d:v}
/* valor depois de arrastar dx px a partir de v0: a trilha útil (largura menos o polegar) vale de min a max */
function ajustar(el,v0,dx){
  var r=el.getBoundingClientRect(),min=num(el.min,0),max=num(el.max,100),st=el.step==='any'?0:num(el.step,1);
  var v=v0+dx/Math.max(1,r.width-POLEGAR)*(max-min);
  if(st>0)v=min+Math.round((v-min)/st)*st;
  v=Math.max(min,Math.min(max,v));
  var casas=String(st).split('.')[1];return casas?v.toFixed(casas.length):String(Math.round(v))
}
function emitir(el,tipo){el.dispatchEvent(new Event(tipo,{bubbles:true}))}

document.addEventListener('pointerdown',function(e){
  if(g||(e.pointerType==='mouse'&&e.button!==0))return;
  var el=acharRange(e.clientX,e.clientY);if(!el)return;
  var toque=e.pointerType==='touch';
  if(!toque){e.preventDefault();try{el.focus({preventScroll:true})}catch(x){el.focus()}}   /* mouse e caneta: só o foco, sem selecionar texto */
  g={el:el,id:e.pointerId,x:e.clientX,y:e.clientY,v0:num(el.value,0),toque:toque,alvo:e.target,arrastando:false,mudou:false}
},true);
document.addEventListener('pointermove',function(e){
  if(!g||e.pointerId!==g.id)return;
  var dx=e.clientX-g.x,dy=e.clientY-g.y,lim=g.toque?LIMIAR_TOQUE:LIMIAR_MOUSE;
  if(!g.arrastando){
    if(g.toque&&Math.abs(dy)>lim&&Math.abs(dy)>=Math.abs(dx)){g=null;return}   /* vertical no toque: é rolagem */
    if(Math.abs(dx)<=lim)return;                                                /* ainda é um clique ou toque parado */
    g.arrastando=true;document.documentElement.classList.add('desl-arrasto');
    try{g.alvo.setPointerCapture&&g.alvo.setPointerCapture(e.pointerId)}catch(x){}
  }
  e.preventDefault();
  var v=ajustar(g.el,g.v0,dx);
  if(v!==g.el.value){g.el.value=v;g.mudou=true;emitir(g.el,'input')}
},{capture:true,passive:false});
function fim(e){
  if(!g||e.pointerId!==g.id)return;
  if(g.arrastando&&g.mudou)emitir(g.el,'change');
  document.documentElement.classList.remove('desl-arrasto');g=null
}
document.addEventListener('pointerup',fim,true);
document.addEventListener('pointercancel',function(e){if(g&&e.pointerId===g.id){document.documentElement.classList.remove('desl-arrasto');g=null}},true);

window.PLDESLIZAR={ativo:true,ajustar:ajustar};
})();
