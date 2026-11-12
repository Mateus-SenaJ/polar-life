/* T-05 · resumo da importação · DOC-04 FL-02 · DOC-05 FN-10 · dados de exemplo: DOC-04 §6 */
(function(){
var $=function(i){return document.getElementById(i)},tm;
function toast(m,undo){clearTimeout(tm);$('toast-t').textContent=m;$('toast-undo').hidden=!undo;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
/* Estados de revisão do protótipo: #estado-duplicadas · #estado-sem-data */
var est=(location.hash.match(/^#estado-([\w-]+)$/)||[])[1];
/* 44: com fotos escolhidas (pl-fotos), a contagem e a orientação são reais; sem elas,
   mostra o exemplo (DOC-04 §6). */
function listaReal(){try{var a=JSON.parse(sessionStorage.getItem('pl-fotos')||'null');
  if(Array.isArray(a)&&a.length>=1&&a.length<=400&&a.every(function(x){return x>=1&&x%1===0}))return a}catch(e){}return null}
var REAL=listaReal();
var D=REAL
  ?{total:REAL.length,land:0,port:0,dups:0,nodate:0,warn:0,perSheet:4,real:true}
  :{total:24,land:18,port:6,dups:est==='duplicadas'?2:0,nodate:est==='sem-data'?3:0,warn:1,perSheet:4,real:false};
var undoN=null,byDate=false;
function plural(n,s,p){return n+' '+(n===1?s:p)}
function sheets(){return Math.ceil(D.total/D.perSheet)}
/* D-159: em projeto real, a previsão usa o formato e o papel escolhidos (mesma conta do editor, MT-02) */
var PREV={papel:'A4',fmt:'Clássico 88 × 107 mm'};
if(REAL&&window.PLFOLHAS){(function(){var s=PLFOLHAS.ler(),f=PLFOLHAS.formatoInicial()||PLFOLHAS.FORMATOS.classico,g=PLFOLHAS.melhor(s,PLFOLHAS.papel(s),f);
  var NOMES={mini:'Mini quadrado',pocket:'Retro Pocket',imini:'Instax Mini',isq:'Instax Square',iwide:'Instax Wide'};
  if(g.n>0)D.perSheet=g.n;PREV.papel=PLFOLHAS.papel(s).n;PREV.fmt=(NOMES[f.fmt]||'Clássico')+' '+String(f.w).replace('.',',')+' × '+String(f.h).replace('.',',')+' mm'})()}
function cell(l,v,s){return '<div><dt class="rotulo">'+l+'</dt><dd>'+v+(s?'<span>'+s+'</span>':'')+'</dd></div>'}
/* Lê as dimensões reais do IndexedDB e conta horizontais × verticais (sem EXIF ainda). */
function medirReais(){
  if(!REAL||!window.PLFOTOS)return;
  Promise.all(REAL.map(function(id){return PLFOTOS.ler(id).catch(function(){return null})})).then(function(fs){
    var land=0,port=0;fs.forEach(function(r){if(!r)return;if((r.w||0)>=(r.h||0))land++;else port++});
    D.land=land;D.port=port;D.nodate=fs.filter(function(r){return !r||!r.meta||!r.meta.iso}).length;paint();
  });
}
function paint(){
  var dateCell=D.real
    ?cell('Datas','A data da foto','aparece na legenda; edite em Legendas › Avançado')
    :cell('Datas',D.nodate?(D.total-D.nodate)+' com data':'14.07.26',D.nodate?plural(D.nodate,'sem data','sem data'):'a 16.07.26');
  var localCell=D.real?cell('Local','Você escolhe','em Legendas › Avançado'):cell('Local','Campos do Jordão, SP','');
  var qualCell=D.real?cell('Qualidade',plural(D.total,'foto pronta','fotos prontas'),'o ponto de qualidade aparece em cada polaroid'):cell('Qualidade',(D.total-D.warn)+' boas','1 com ressalvas · 140 PPI');
  $('stats').innerHTML=
    cell('Fotos',D.total,'')+
    cell('Orientação',D.land+' horizontais','e '+D.port+' verticais')+
    dateCell+localCell+qualCell+
    cell('Folhas previstas',sheets()+' '+PREV.papel,D.perSheet+' por folha · '+PREV.fmt);
  $('q-txt').textContent=D.real?'O ponto de qualidade em cada polaroid mostra se a foto vai sair nítida no tamanho escolhido.':'Foto 12 com resolução de 140 PPI. Reduza o zoom ou escolha um formato menor depois, no editor.';
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
paint();medirReais();
})();
