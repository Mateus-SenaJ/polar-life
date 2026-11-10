/* Texto da legenda · T-10 → T-07/T-30a · mesmos formatos e estilos do editor (FN-07, DV-05)
   D-113: linhas() é o único cálculo de posição da data e do local (Quadro, T-07 e PDF · MT-02). */
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
/* Catálogo EXC-2 (DOC-02 §4): 24 fontes, 5 categorias (Nanum Pen Script e Gaegu saíram: sem acentos, D-111). fb = fallback genérico da categoria. */
var CAT={man:'Manuscrita',cal:'Caligráfica',dat:'Datilografada',edi:'Editorial',lim:'Limpa'};
var FB={man:'cursive',cal:'cursive',dat:'monospace',edi:'serif',lim:'sans-serif'};
var FONTES=[
 ['Caveat','man'],['Reenie Beanie','man'],['Shadows Into Light','man'],['Kalam','man'],['Patrick Hand','man'],['Covered By Your Grace','man'],['Zeyada','man'],['Homemade Apple','man'],['Over the Rainbow','man'],['La Belle Aurore','man'],
 ['Dancing Script','cal'],['Satisfy','cal'],['Sacramento','cal'],['Allura','cal'],['Parisienne','cal'],
 ['Special Elite','dat'],['Courier Prime','dat'],['Cutive Mono','dat'],
 ['Cormorant Garamond Itálico','edi','Cormorant Garamond',1],['Playfair Display Itálico','edi','Playfair Display',1],['EB Garamond','edi'],['Libre Baskerville','edi'],
 ['Inter Light','lim','Inter',0,300],['Inter Regular','lim','Inter',0,400]
].map(function(f){return{n:f[0],c:f[1],fam:f[2]||f[0],it:!!f[3],w:f[4]||400,css:"'"+(f[2]||f[0])+"',"+FB[f[1]]}});
function fonte(n){return FONTES.filter(function(f){return f.n===n})[0]||FONTES[0]}
var FONT_LG={};
FONTES.forEach(function(f){FONT_LG[f.n]=[f.css,f.it?1:0,f.w]});
FONT_LG['IBM Plex Mono']=["'IBM Plex Mono',ui-monospace,monospace",0,400];
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
/* ---------- padrões de legenda (mesma ordem de chaves do PADRAO da T-10: projetos salvos comparam por JSON) ---------- */
var LEG0={pos:'abaixo',preset:'simples',dx:0,dy:0,inc:0,
 txt:{on:true,font:'Caveat',pt:16,fit:false,caixa:'normal',esp:0,cor:'preto'},
 data:{on:true,font:'IBM Plex Mono',pt:8,fmt:0,cor:'preto'},
 loc:{on:true,font:'IBM Plex Mono',pt:8,cor:'preto',uf:'sigla',pais:'oculto',ocBR:true,sep:', ',ordem:'cidade'}};
function copia(o){return JSON.parse(JSON.stringify(o))}
function legPocket(b){ /* D-113: padrão do Retro Pocket — duas linhas (local e data) ancoradas ao topo das maiúsculas */
  var l=copia(b||LEG0);
  l.txt.on=false;l.meta='linhas';l.ordem='loc-data';l.medida='letras';
  l.loc.sep=' - ';l.loc.uf='sigla';l.loc.pais='oculto';l.loc.ocBR=true;
  l.data.fmt=3;
  return l
}
function assinaturaDir(leg,fr){ /* D-128: Pocket D-113 em duas linhas alinhadas à esquerda → assinatura no canto direito */
  return !!(fr&&fr.w===66&&fr.h===99&&leg&&leg.meta==='linhas'&&leg.pos!=='acima')
}
/* ---------- medição na tela: métricas por fonte (1 medida por combinação; LG-04) ---------- */
var cacheM={},ctxT=null;
function medTela(est){
  var fm=famLG(est.font),nome=String(fm.f).split("'")[1]||est.font,it=fm.i?1:0,w=fm.w||400,key=nome+'|'+it+'|'+w;
  if(cacheM[key])return cacheM[key];
  var m={asc:.8,desc:.2,cap:.7};
  if(document.fonts&&document.fonts.check&&document.fonts.check((it?'italic ':'')+w+' 100px "'+nome+'"')){
    if(!ctxT)ctxT=document.createElement('canvas').getContext('2d');
    ctxT.font=(it?'italic ':'')+w+' 100px '+fm.f;
    var mm=ctxT.measureText('H');
    m={asc:(mm.fontBoundingBoxAscent||80)/100,desc:(mm.fontBoundingBoxDescent||20)/100,cap:(mm.actualBoundingBoxAscent||70)/100,ok:true}
  }
  if(m.ok)cacheM[key]=m; /* sem @font-face carregada repete o fallback; não trava em métrica provisória */
  return m
}
function limparMedTela(){cacheM={}}
/* ---------- cálculo único das linhas da data e do local (Quadro, T-07 e PDF · MT-02, D-113) ----------
   Cada linha vem com: k ('data' | 'loc' | 'meta'), est (dono da linha), corpo (mm),
   asc/desc/capMax (mm), lh (multiplicador do corpo), base (mm da borda de cima da moldura à linha de base),
   top (mm ao topo da caixa da linha) e letrasTop (mm ao topo das maiúsculas). */
function linhas(leg,fr,medir,opts){
  opts=opts||{};
  var f=fr&&fr.cw?{topo:fr.ct,jh:fr.cjh,jw:fr.cjw,lado:fr.cl}:fr||{};
  var wb=(f.topo||0)+(f.jh||0),T=f.topo||0;
  var pos=opts.pos||leg.pos||'abaixo';
  var junto=(leg.meta||'junto')!=='linhas';       /* meta: junto (padrão) | linhas */
  var ordem=leg.ordem||'data-loc';                 /* ordem das duas linhas */
  var medida=leg.medida||'caixa';                  /* caixa | letras */
  var temD=opts.temData!=null?!!opts.temData:!!(leg.data&&leg.data.on);
  var temL=opts.temLoc!=null?!!opts.temLoc:!!(leg.loc&&leg.loc.on);
  if(!temD&&!temL)return[];
  function MM(o){var m={};try{m=medir?medir(o):{}}catch(e){}
    if(m.asc==null)m.asc=.8;if(m.desc==null)m.desc=.2;if(m.cap==null)m.cap=.7;return m}
  function corpo(o){return((o&&o.pt)||9)*.3528}
  var mL=MM(leg.loc),mD=MM(leg.data),cL=corpo(leg.loc),cD=corpo(leg.data);
  var L=[];
  if(junto||!temD||!temL){                        /* numa linha só: a maior fonte estrutura a linha, igual ao PDF */
    var gov=cD>=cL?leg.data:leg.loc,mG=MM(gov);
    L.push({k:'meta',est:gov,corpo:corpo(gov),asc:mG.asc,desc:mG.desc,
      capMax:Math.max(temD?mD.cap*cD:0,temL?mL.cap*cL:0)})
  }else{
    var par=ordem==='loc-data'?[['loc',leg.loc,mL,cL],['data',leg.data,mD,cD]]:[['data',leg.data,mD,cD],['loc',leg.loc,mL,cL]];
    par.forEach(function(p){L.push({k:p[0],est:p[1],corpo:p[3],asc:p[2].asc,desc:p[2].desc,capMax:p[2].cap*p[3]})})
  }
  if(medida==='letras'&&pos!=='acima'){            /* MT-02: 1ª maiúscula a 4 mm da foto; a 2ª, 2 mm abaixo da base da 1ª */
    var b=wb+4+L[0].capMax;
    L.forEach(function(ln,i){if(i)b+=2+ln.capMax;
      ln.lh=ln.asc+ln.desc;ln.base=b;ln.top=b-ln.asc*ln.corpo;ln.letrasTop=b-ln.capMax})
  }else{                                          /* caixa: linha de 1,2 corpo (mesma conta do PDF) */
    var y;
    if(pos==='acima'){var tot=0;L.forEach(function(ln){tot+=1.2*ln.corpo});y=(T-tot)/2}
    else y=wb+2.2+1.2+(opts.capTxt&&opts.capBoxH?opts.capBoxH:0);
    L.forEach(function(ln){
      ln.lh=1.2;ln.top=y;ln.base=y+((1.2-(ln.asc+ln.desc))/2+ln.asc)*ln.corpo;ln.letrasTop=ln.base-ln.capMax;
      y+=1.2*ln.corpo})
  }
  return L
}
window.PLTEXTO={LEG:LEG,MESX:MESX,SEMX:SEMX,FMTD:FMTD,COR_LG:COR_LG,CAT:CAT,FB:FB,FONTES:FONTES,FONT_LG:FONT_LG,z2:z2,famLG:famLG,caixaLG:caixaLG,estLG:estLG,fonte:fonte,LOC0:LOC0,dadosFoto:dadosFoto,localLG:localLG,LEG0:LEG0,legPocket:legPocket,assinaturaDir:assinaturaDir,medTela:medTela,limparMedTela:limparMedTela,linhas:linhas};
})();
