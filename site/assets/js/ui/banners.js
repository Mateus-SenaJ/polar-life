/* PLBANNERS · banners da faixa preta (brief §2.3 · D-118 · T-32)
   Rotação a cada 8 s (mesma duração do anel LED, D-112), pausa com o cursor em cima, com o
   foco dentro, no toque e quando a aba não está visível; para depois de uma ação manual.
   Com movimento reduzido: sem rotação automática (troca instantânea pelos pontos) e sem botão de pausa. */
(function(){
'use strict';
var ROTA=5000,ROTA_CEL=4000,PLBANNERS;   /* D-190: passa mais rápido (antes 8 s) · D-199: 4 s em telas menores que 1024 px */
function intervalo(){try{return window.matchMedia&&window.matchMedia('(max-width:1023px)').matches?ROTA_CEL:ROTA}catch(e){return ROTA}}

function semMovimento(){try{return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)}catch(e){return false}}

function Banners(el,aoMudar){
  var self=this;
  this.el=el;
  this.aoMudar=aoMudar||null;
  this.pistas=el.querySelector('.faixa__pistas')||el;
  this.slides=[].slice.call(this.pistas.querySelectorAll('.faixa__slide'));
  this.pontos=[].slice.call(el.querySelectorAll('.faixa__ponto'));
  this.botao=el.querySelector('.faixa__pausa');
  this.i=0;this.auto=true;this.tmr=null;this.suspenso=false;
  if(!this.slides.length)return;
  this.mq=semMovimento();
  this.mostrar(0,false);
  this.ligar();
  if(this.mq)this.pararBotao();else this.rotar();
}
/* ---------- troca de banner ---------- */
Banners.prototype.mostrar=function(i,manual){
  if(i<0||i>=this.slides.length)return;
  this.i=i;
  for(var k=0;k<this.slides.length;k++){
    var on=k===i;
    this.slides[k].classList.toggle('is-active',on);
    if(on)this.slides[k].removeAttribute('aria-hidden');else this.slides[k].setAttribute('aria-hidden','true');
  }
  for(var j=0;j<this.pontos.length;j++){
    var sel=j===i;
    this.pontos[j].setAttribute('aria-selected',sel?'true':'false');
    this.pontos[j].setAttribute('tabindex',sel?'0':'-1');
  }
  if(this.pistas)this.pistas.setAttribute('aria-live',manual?'polite':'off');   /* polido só depois da ação manual */
  if(this.aoMudar)try{this.aoMudar(i,manual)}catch(e){}
};
/* ---------- relógio ---------- */
Banners.prototype.rotar=function(){
  var self=this;
  this.parar();
  if(!this.auto||this.mq)return;
  this.tmr=setTimeout(function(){self.mostrar((self.i+1)%self.slides.length,false);self.rotar()},intervalo());
};
Banners.prototype.parar=function(){if(this.tmr){clearTimeout(this.tmr);this.tmr=null}};
Banners.prototype.suspender=function(ligado){        /* hover, foco, toque e aba escondida */
  this.suspenso=ligado;
  if(this.el.classList){                              /* a simulação dos banners congela junto */
    if(ligado)this.el.classList.add('is-pausa');else this.el.classList.remove('is-pausa');
  }
  if(ligado)this.parar();else if(this.auto)this.rotar();
};
/* ---------- botão pausar/retomar ---------- */
Banners.prototype.rotuloBotao=function(texto){
  if(!this.botao)return;
  var t=this.botao.querySelector('span');
  if(t)t.textContent=texto;
  this.botao.setAttribute('aria-label',texto==='Pausar'?'Pausar a rotação dos banners':'Retomar a rotação dos banners');
};
Banners.prototype.pararBotao=function(){               /* movimento reduzido: o botão some (brief §2.3) */
  if(this.botao)this.botao.hidden=true;
};
Banners.prototype.mostrarBotao=function(){
  if(this.botao)this.botao.hidden=false;
};
/* ---------- eventos ---------- */
Banners.prototype.ligar=function(){
  var self=this;
  if(this.pontos.length){
    for(var k=0;k<this.pontos.length;k++)(function(k){
      self.pontos[k].addEventListener('click',function(){self.auto=false;self.parar();self.rotuloBotao('Retomar');self.mostrar(k,true)});
    })(k);
    this.pontos.forEach(function(p){p.addEventListener('keydown',function(ev){
      if(ev.key!=='ArrowRight'&&ev.key!=='ArrowLeft')return;
      ev.preventDefault();
      var n=(self.i+(ev.key==='ArrowRight'?1:-1)+self.slides.length)%self.slides.length;
      self.auto=false;self.parar();self.rotuloBotao('Retomar');self.mostrar(n,true);
      if(self.pontos[n])self.pontos[n].focus();
    })});
  }
  if(this.botao)this.botao.addEventListener('click',function(){
    self.auto=!self.auto;
    self.rotuloBotao(self.auto?'Pausar':'Retomar');
    if(self.auto)self.rotar();else self.parar();
  });
  /* D-199: só o cursor de verdade pausa (no celular o toque gerava um «mouseenter» que nunca saía e a rotação parava) */
  this.el.addEventListener('pointerenter',function(ev){if(ev.pointerType==='mouse')self.suspender(true)});
  this.el.addEventListener('pointerleave',function(ev){if(ev.pointerType==='mouse')self.suspender(false)});
  this.el.addEventListener('focusin',function(){self.suspender(true)});
  this.el.addEventListener('focusout',function(){setTimeout(function(){if(!self.el.contains(document.activeElement))self.suspender(false)},0)});
  /* D-199: o toque pausa só enquanto o dedo está na faixa e volta 2,5 s depois; deslizar para o lado troca o banner e a rotação segue */
  var t0=null,volta=null;
  this.el.addEventListener('touchstart',function(ev){clearTimeout(volta);var t=ev.touches&&ev.touches[0];t0=t?{x:t.clientX,y:t.clientY}:null;self.suspender(true)},{passive:true});
  var solta=function(ev){
    var t=ev.changedTouches&&ev.changedTouches[0];
    if(t0&&t){var dx=t.clientX-t0.x,dy=t.clientY-t0.y;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.3)self.mostrar((self.i+(dx<0?1:-1)+self.slides.length)%self.slides.length,false)}
    t0=null;clearTimeout(volta);volta=setTimeout(function(){if(!self.el.contains(document.activeElement))self.suspender(false)},2500)
  };
  this.el.addEventListener('touchend',solta,{passive:true});this.el.addEventListener('touchcancel',solta,{passive:true});
  document.addEventListener('visibilitychange',function(){self.suspender(document.hidden)});
  if(window.matchMedia){
    var mq=window.matchMedia('(prefers-reduced-motion: reduce)');
    var ouv=function(){self.mq=semMovimento();if(self.mq){self.auto=false;self.parar();self.pararBotao()}else{self.mostrarBotao();self.auto=true;self.rotar()}};
    if(mq.addEventListener)mq.addEventListener('change',ouv);else if(mq.addListener)mq.addListener(ouv);
  }
};

PLBANNERS={
  /* monta o carrossel de banners dentro de um elemento .faixa; aoMudar(i) roda a cada troca */
  montar:function(el,aoMudar){
    if(!el)return null;
    return new Banners(el,aoMudar);
  },
  ROTA:ROTA
};
window.PLBANNERS=PLBANNERS;
})();
