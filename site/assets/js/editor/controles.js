/* FN-00: número com unidade usa campo e −/+; faixa usa deslizador e campo; 2–4 opções usam segmentado; 5+ usam seleção/cartões; interruptor declara Ligado ou Desligado. */
(function(){
window.PLCTRL={
  numero:function(id,rot,v,min,max,step,u){return '<div class="f"><div class="f__top"><label class="f__l" for="'+id+'">'+rot+'</label></div><div class="num"><button type="button" class="num__b" data-step="-'+step+'" aria-label="Diminuir '+rot+'">−</button><input id="'+id+'" data-min="'+min+'" data-max="'+max+'" inputmode="decimal" value="'+v+'"><span class="num__u mono">'+u+'</span><button type="button" class="num__b" data-step="'+step+'" aria-label="Aumentar '+rot+'">+</button></div></div>'},
  escopo:function(){return '<div class="f"><label class="f__l" for="escopo-folhas">Aplicar alterações a</label><div class="sel"><select id="escopo-folhas"><option value="todas">Todas as fotos</option><option value="folha">Esta folha</option></select></div><p class="f__h" id="escopo-ajuda"></p></div>'}
};
})();
