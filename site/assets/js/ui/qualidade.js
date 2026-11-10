/* Indicador de qualidade · D-130, BR-12. Palavras simples na interface (sem PPI); o número só nas telas de
   impressão, entre parênteses (opção numero). Ponto de 8 px na MOLDURA, nunca sobre a foto (T4); forma diferente
   em cada nível e texto no balão/aria-label (T3: nada só por cor). Fonte única dos limites: tela, folhas e PDF. */
(function(){
function nivel(ppi){return ppi>=300?'excelente':ppi>=150?'boa':'borrada'}
function dados(ppi,numero){
  var n=nivel(ppi);
  var t=n==='excelente'?'Excelente':n==='boa'?'Boa':'Pode sair borrada';
  var a=n==='excelente'?'A foto deve sair nítida neste tamanho.':n==='boa'?'Sai bem. Para ficar ainda mais nítida, diminua o zoom ou use uma foto maior.':'Diminua o zoom, escolha um formato menor ou use uma foto maior.';
  return{nivel:n,texto:t,ajuda:a,aria:t+'. '+a+(numero?' ('+Math.round(ppi)+' PPI)':'')};
}
/* opcoes.decorativo: dentro de uma figura com role="img" (folhas) vira só desenho; o resumo vai no rótulo da folha */
function ponto(ppi,opcoes){
  var d=dados(ppi,opcoes&&opcoes.numero),dec=opcoes&&opcoes.decorativo,e=document.createElement(dec?'span':'button');
  if(!dec){e.type='button';e.setAttribute('aria-label','Qualidade: '+d.aria)}else e.setAttribute('aria-hidden','true');
  e.className='pl-qualidade pl-qualidade--'+d.nivel+(dec?' pl-qualidade--folha':'');
  e.innerHTML='<span class="pl-qualidade__p" aria-hidden="true"></span><span class="pl-qualidade__bal"'+(dec?'':' role="tooltip"')+'><strong>'+d.texto+'</strong> '+d.ajuda+'</span>';
  return e}
/* resumo para o rótulo da folha: «2 fotos podem sair borradas» */
function resumo(lista){var b=0,o=0;lista.forEach(function(p){var n=nivel(p);if(n==='borrada')b++;else if(n==='boa')o++});
  return b?(b===1?'1 foto pode sair borrada':b+' fotos podem sair borradas'):o?(o===1?'1 foto com qualidade boa':o+' fotos com qualidade boa'):'todas com qualidade excelente'}
window.PLQUALIDADE={nivel:nivel,dados:dados,ponto:ponto,resumo:resumo};
})();
