/* PLGUARDA · D-123: todas as páginas de /app/ exigem sessão (conta ou código de impressão).
   Sem sessão → /app/entrar/ guardando o destino (?voltar=). A página de entrar é isenta.
   Também esconde o selo «Ambiente de teste» quando PLCONTA.modo() === 'servidor'.
   Roda síncrono no <head>, depois de nucleo/conta.js, antes de qualquer script de página.
   Obs.: os scripts das páginas de /app/ resolvem para a raiz do site (../assets), então
   a raiz de /app/ sai de location.pathname — funciona no GitHub Pages com subpath. */
(function(){
'use strict';
var PLGUARDA;

function prefixo(){ /* esquema+host+subpath, ex.: https://usuario.github.io/polar-life */
  var n=location.pathname.length+location.search.length+location.hash.length;
  return n?location.href.slice(0,location.href.length-n):location.href
}
function raiz(){ /* URL da raiz de /app/ com barra final */
  var p=location.pathname,i=p.indexOf('/app/');
  if(i<0)return null;
  return prefixo()+p.slice(0,i+5)
}
function caminho(){ /* caminho da página atual relativo à raiz de /app/ */
  var p=location.pathname,i=p.indexOf('/app/');
  if(i<0)return '';
  return p.substring(i+5)
}
function isenta(){return caminho().indexOf('entrar/')===0}
function temSessao(){
  return !!(window.PLCONTA&&PLCONTA.temSessao&&PLCONTA.temSessao()&&!(PLCONTA.cadastroPendente&&PLCONTA.cadastroPendente()))   /* sem «Seus dados», ainda não entrou */
}
function urlEntrar(voltar){
  var r=raiz();if(!r)return null;
  return r+'entrar/?voltar='+encodeURIComponent(voltar||'/app/')
}
function destino(){ /* URL atual completa (caminho + busca + fragmento) para voltar depois */
  return location.pathname+location.search+location.hash
}

function esconderSelo(){ /* o selo é HTML fixo (sem JS); some quando houver servidor de verdade */
  var s=document.querySelector('.selo-teste');
  if(s)s.hidden=true
}
function vigiar(){
  if(!window.PLCONTA){esconderSelo();return}          /* sem PLCONTA não há como conferir sessão */
  if(PLCONTA.modo&&PLCONTA.modo()!=='demo')esconderSelo();
  if(isenta())return;
  if(!temSessao()){
    var u=urlEntrar(destino());
    if(u){location.replace(u);return}                  /* sem sessão: entrada obrigatória (D-123) */
  }
}

PLGUARDA={raiz:raiz,caminho:caminho,isenta:isenta,temSessao:temSessao,urlEntrar:urlEntrar};
window.PLGUARDA=PLGUARDA;
vigiar();
})();
