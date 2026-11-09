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
function paginar(s,fr,fotos){                                     /* mesma conta da T-07, agora também para o PDF */
  fotos=fotos||[];
  var p=papel(s),grupos=s.separar?[fotos.filter(function(f){return f.v}),fotos.filter(function(f){return!f.v})]:[fotos],sheets=[],erro=false,g0=melhor(s,p,fr);
  if(g0.n===0)return{p:p,sheets:[],erro:true,g:g0};
  grupos.forEach(function(g,gi){
    if(!g.length)return;
    var gr=melhor(s,p,fr),bw=gr.c*gr.fw+(gr.c-1)*s.gap,bh=gr.r*gr.fh+(gr.r-1)*s.gap,aw=p.w-2*s.margem,ah=p.h-2*s.margem;
    var x0=s.align==='center'?s.margem+(aw-bw)/2:s.margem,y0=s.align==='center'?s.margem+(ah-bh)/2:s.margem;
    for(var k=0;k<g.length;k+=gr.n){
      var cells=g.slice(k,k+gr.n).map(function(f,i){var c=i%gr.c,r=Math.floor(i/gr.c);return{f:f,x:x0+c*(gr.fw+s.gap),y:y0+r*(gr.fh+s.gap),w:gr.fw,h:gr.fh,giro:gr.giro}});
      sheets.push({cells:cells,grupo:s.separar?(gi===0?'Verticais':'Horizontais'):'',per:gr.n,parcial:cells.length<gr.n})
    }
  });
  return{p:p,sheets:sheets,erro:false,g:g0}
}
window.PLFOLHAS={PAPEIS:PAPEIS,PADRAO:PADRAO,papel:papel,grade:grade,melhor:melhor,contar:contar,paginar:paginar,
  ler:function(){                                   /* 30a: orientação da T-06 e, por cima, o que o editor salvou */
    var d=Object.assign({},PADRAO);
    try{if(sessionStorage.getItem('pl-orientacao')==='separar')d.separar=true}catch(e){}
    try{var o=JSON.parse(sessionStorage.getItem('pl-folhas')||'null');if(o&&(PAPEIS[o.papel]||o.papel==='custom'))d=Object.assign(d,o)}catch(e){}
    return d}};
})();
