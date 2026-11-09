/* Texto da legenda · T-10 → T-07/T-30a · mesmos formatos e estilos do editor (FN-07, DV-05) */
(function(){
var LEG=['Dias de sol','Nós dois','Dia de rolê','Meu parceiro'];
function z2(n){return(n<10?"0":"")+n}
var MESX=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"],SEMX=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
var FMTD=[ /* 13 formatos de data (FN-07, DV-05), os mesmos da T-10 */
 function(d){return z2(d.getDate())+'.'+z2(d.getMonth()+1)+'.'+String(d.getFullYear()).slice(2)},
 function(d){return z2(d.getDate())+'/'+z2(d.getMonth()+1)+'/'+d.getFullYear()},
 function(d){return z2(d.getDate())+'-'+z2(d.getMonth()+1)+'-'+d.getFullYear()},
 function(d){return z2(d.getDate())+'/'+z2(d.getMonth()+1)+'/'+String(d.getFullYear()).slice(2)},
 function(d){return d.getFullYear()+'-'+z2(d.getMonth()+1)+'-'+z2(d.getDate())},
 function(d){return z2(d.getMonth()+1)+'/'+d.getFullYear()},
 function(d){return z2(d.getMonth()+1)+'.'+String(d.getFullYear()).slice(2)},
 function(d){return d.getDate()+' de '+MESX[d.getMonth()]+' de '+d.getFullYear()},
 function(d){return d.getDate()+' '+MESX[d.getMonth()].slice(0,3)+' '+d.getFullYear()},
 function(d){return d.getDate()+' de '+MESX[d.getMonth()]},
 function(d){return MESX[d.getMonth()][0].toUpperCase()+MESX[d.getMonth()].slice(1)+' de '+d.getFullYear()},
 function(d){return MESX[d.getMonth()].slice(0,3)+'/'+String(d.getFullYear()).slice(2)},
 function(d){return SEMX[d.getDay()]+', '+d.getDate()+' de '+MESX[d.getMonth()]}
];
var COR_LG={preto:'#000',azul:'#006194',laranja:'#FD761A'};
var FONT_LG={'Cormorant Garamond Itálico':["'Cormorant Garamond',serif",1,300],'Playfair Display Itálico':["'Playfair Display',serif",1,400],'Inter Light':["'Inter',sans-serif",0,300],'Inter Regular':["'Inter',sans-serif",0,400],'IBM Plex Mono':["'IBM Plex Mono',ui-monospace,monospace",0,400],'Courier Prime':["'Courier Prime',monospace",0,400],'Cutive Mono':["'Cutive Mono',monospace",0,400],'Special Elite':["'Special Elite',monospace",0,400],'EB Garamond':["'EB Garamond',serif",0,400],'Libre Baskerville':["'Libre Baskerville',serif",0,400],'Dancing Script':["'Dancing Script',cursive",0,400],'Satisfy':["'Satisfy',cursive",0,400],'Sacramento':["'Sacramento',cursive",0,400],'Allura':["'Allura',cursive",0,400],'Parisienne':["'Parisienne',cursive",0,400]};
function famLG(n){var f=FONT_LG[n];return f?{f:f[0],i:f[1],w:f[2]}:{f:"'"+n+"',cursive",i:0,w:400}}
function caixaLG(t,c){return c==='maiusc'?t.toUpperCase():c==='cap'?t.replace(/(^|\s)(\S)/g,function(m,a,b){return a+b.toUpperCase()}):t}
function estLG(o,mm,px,extra){                               /* só a fonte e a cor; o corpo vem em pt reais (1 pt = 0,3528 mm) */
  var fm=famLG(o.font);return'font-family:'+fm.f+';font-style:'+(fm.i?'italic':'normal')+';font-weight:'+fm.w+';color:'+(COR_LG[o.cor]||'#000')+';font-size:'+(o.pt*.3528*px)+'px'+(extra||'')
}
var LOC0={uf:'sigla',pais:'oculto',ocBR:true,sep:', ',ordem:'cidade'};
function dadosFoto(f){
  var m=f.m,iso=m?m.iso:'2026-07-14T08:00',cid=m?m.c:'Campos do Jordão',a=String(iso||'').match(/^(\d+)-(\d+)-(\d+)/);
  return{d:a?new Date(+a[1],+a[2]-1,+a[3]):null,iso:a?a[0]:'',c:cid||''}
}
function localLG(l,cid){
  var e=l.uf==='oculto'?'':l.uf==='sigla'?'SP':'São Paulo',pa=l.pais==='oculto'||l.ocBR?'':l.pais==='nome'?'Brasil':'BR';
  var arr=l.ordem==='cidade'?[cid,e,pa]:[e,cid,pa],sep=l.sep===' '?' ':l.sep===', '?', ':' '+l.sep.trim()+' ';
  return arr.filter(Boolean).join(sep)
}
window.PLTEXTO={LEG:LEG,MESX:MESX,SEMX:SEMX,FMTD:FMTD,COR_LG:COR_LG,FONT_LG:FONT_LG,z2:z2,famLG:famLG,caixaLG:caixaLG,estLG:estLG,LOC0:LOC0,dadosFoto:dadosFoto,localLG:localLG};
})();
