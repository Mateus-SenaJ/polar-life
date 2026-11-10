/* T-05 · resumo da importação · DOC-04 FL-02 · DOC-05 FN-10 · dados de exemplo: DOC-04 §6 */
(function(){
var $=function(i){return document.getElementById(i)},tm;
function toast(m,undo){clearTimeout(tm);$('toast-t').textContent=m;$('toast-undo').hidden=!undo;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
/* Estados de revisão do protótipo: #estado-duplicadas · #estado-sem-data */
var est=(location.hash.match(/^#estado-([\w-]+)$/)||[])[1];
var D={total:24,land:18,port:6,dups:est==='duplicadas'?2:0,nodate:est==='sem-data'?3:0,warn:1,perSheet:4};
var undoN=null,byDate=false;
function plural(n,s,p){return n+' '+(n===1?s:p)}
function sheets(){return Math.ceil(D.total/D.perSheet)}
function cell(l,v,s){return '<div><dt class="rotulo">'+l+'</dt><dd>'+v+(s?'<span>'+s+'</span>':'')+'</dd></div>'}
function paint(){
  $('stats').innerHTML=
    cell('Fotos',D.total,'')+
    cell('Orientação',D.land+' horizontais','e '+D.port+' verticais')+
    cell('Datas',D.nodate?(D.total-D.nodate)+' com data':'14.07.26',D.nodate?plural(D.nodate,'sem data','sem data'):'a 16.07.26')+
    cell('Local','Campos do Jordão, SP','')+
    cell('Qualidade',(D.total-D.warn)+' boas','1 com ressalvas · 140 PPI')+
    cell('Folhas previstas',sheets()+' A4',D.perSheet+' por folha · Clássico 88 × 107 mm');
  $('q-txt').textContent='Foto 12 com resolução de 140 PPI. Reduza o zoom ou escolha um formato menor depois, no editor.';
  var nd=$('nd-note');nd.hidden=!D.nodate;
  if(D.nodate)$('nd-txt').textContent=plural(D.nodate,'foto está sem data','fotos estão sem data')+'. Ao ordenar por data, elas ficam no fim do grupo.';
  $('dup-d').textContent=D.dups?plural(D.dups,'foto parece repetida','fotos parecem repetidas')+'. Fica a primeira de cada grupo.':'Nenhuma foto repetida encontrada.';
  $('dup-b').disabled=!D.dups;
  $('ord-d').textContent=byDate?'Ordem pela data da foto, dentro de cada grupo de orientação.':'Ordem em que você escolheu as fotos.';
  $('ord').setAttribute('aria-checked',byDate);
}
$('dup-b').onclick=function(){
  undoN=D.dups;D.total-=D.dups;D.dups=0;paint();toast(plural(D.total,'foto','fotos')+' · '+sheets()+' folhas',true);$('ord').focus()
};
$('toast-undo').onclick=function(){if(undoN==null)return;D.total+=undoN;D.dups=undoN;undoN=null;paint();toast('Fotos repetidas de volta');$('dup-b').focus()};
$('ord').onclick=function(){byDate=!byDate;paint()};
$('go').onclick=function(){
  if(D.land&&D.port)location.href='../orientacao/';           /* há verticais e horizontais → T-06 (FL-02) */
  else location.href='../editor/';
};
paint();
})();
