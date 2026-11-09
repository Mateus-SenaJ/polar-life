/* T-31 «Carregando» · liga o esqueleto antes da primeira pintura e o tira quando a página está pronta.
   #carregando na URL mantém o esqueleto ligado (estado de revisão). Sem JS, o esqueleto nunca aparece. */
(function(){
  var d=document.documentElement,t0=Date.now(),timer,MIN=450;
  function pedido(){return location.hash==='#carregando'}
  function marca(on){
    var m=document.getElementById('main')||document.querySelector('main');
    if(!m)return;
    if(on)m.setAttribute('aria-busy','true');else m.removeAttribute('aria-busy');
  }
  function liga(){d.classList.add('esq-on');marca(true)}
  function desliga(){d.classList.remove('esq-on');marca(false)}
  liga();
  document.addEventListener('DOMContentLoaded',function(){
    marca(d.classList.contains('esq-on'));
    if(!pedido())timer=setTimeout(desliga,Math.max(0,MIN-(Date.now()-t0)));
  });
  window.addEventListener('hashchange',function(){
    clearTimeout(timer);
    if(pedido())liga();else desliga();
  });
})();
