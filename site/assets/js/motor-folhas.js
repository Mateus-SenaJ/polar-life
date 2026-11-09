/* Motor de folhas compartilhado · DOC-08 §3 (grade, melhor giro, contagem de folhas)
   Usado pela T-07 (paginar) e pelo pop-up «Trocar formato» do Quadro (T-12), para a conta ser uma só. */
(function(){
var PAPEIS={A3:{n:'A3',w:297,h:420},A4:{n:'A4',w:210,h:297},A5:{n:'A5',w:148,h:210},'13x18':{n:'13 × 18 cm',w:130,h:180},'10x15':{n:'10 × 15 cm',w:100,h:150}};
var PADRAO={papel:'A4',w:210,h:297,orient:'retrato',margem:10,gap:4,girar:true,align:'center',separar:false,guias:true,contorno:false,compr:'continua',cor:'preto',rodape:false,assin:true};
function papel(s){var p=s.papel==='custom'?{n:'Personalizado',w:s.w,h:s.h}:PAPEIS[s.papel];return s.orient==='paisagem'?{n:p.n,w:p.h,h:p.w}:p}
function grade(s,p,giro,fr){                                     /* colunas × linhas para um giro */
  var aw=p.w-2*s.margem,ah=p.h-2*s.margem,fw=giro?fr.h:fr.w,fh=giro?fr.w:fr.h;
  var c=Math.max(0,Math.floor((aw+s.gap)/(fw+s.gap))),r=Math.max(0,Math.floor((ah+s.gap)/(fh+s.gap)));
  return{c:c,r:r,n:c*r,fw:fw,fh:fh,giro:giro}
}
function melhor(s,p,fr){var a=grade(s,p,false,fr),b=s.girar?grade(s,p,true,fr):a;return b.n>a.n?b:a}
function contar(s,fr,total,verticais){                            /* nº de folhas sem desenhar nada */
  var g=melhor(s,papel(s),fr);if(g.n===0)return{folhas:0,porFolha:0,naoCabe:true};
  var grupos=s.separar?[verticais,total-verticais]:[total],f=0;
  grupos.forEach(function(n){if(n>0)f+=Math.ceil(n/g.n)});
  return{folhas:f,porFolha:g.n,naoCabe:false}
}
window.PLFOLHAS={PAPEIS:PAPEIS,PADRAO:PADRAO,papel:papel,grade:grade,melhor:melhor,contar:contar,
  ler:function(){try{var o=JSON.parse(sessionStorage.getItem('pl-folhas')||'null');if(o&&PAPEIS[o.papel]||o&&o.papel==='custom')return Object.assign({},PADRAO,o)}catch(e){}return Object.assign({},PADRAO)}};
})();
