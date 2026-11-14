/* D-208 · Seta de voltar das telas da Conta: volta para a tela de antes quando ela é do próprio app; senão, segue o link
   (o destino lógico: Conta ou Projetos). Alvo de 44 px, ícone com texto (T3). */
(function(){
function ligar(a){
  if(!a||a._pl)return;a._pl=1;
  a.addEventListener('click',function(e){
    try{var r=document.referrer?new URL(document.referrer):null;
      if(r&&r.origin===location.origin&&r.pathname!==location.pathname&&history.length>1){e.preventDefault();history.back()}}catch(x){}
  })
}
[].forEach.call(document.querySelectorAll('a.voltar'),ligar);
window.PLVOLTAR={ligar:ligar};
})();
