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
 function(d){return SEMX[d.getDay()]+', '+d.getDate()+' de '+MESX[d.getMonth()]},
 function(d){return MESX[d.getMonth()].slice(0,3)+'/'+d.getFullYear()},   /* 13 · D-148: nov/2026 */
 function(d){return String(d.getFullYear())}                                     /* 14 · D-148: 2026 */
];
var COR_LG={preto:'#000',azul:'#006194',laranja:'#FD761A'};
/* Catálogo EXC-2 (DOC-02 §4): 24 fontes, 5 categorias (Nanum Pen Script e Gaegu saíram: sem acentos, D-111). fb = fallback genérico da categoria. */
var CAT={man:'Manuscrita',cal:'Caligráfica',dat:'Datilografada',edi:'Editorial',lim:'Limpa'};
var FB={man:'cursive',cal:'cursive',dat:'monospace',edi:'serif',lim:'sans-serif'};
var FONTES=[
 ['Caveat','man'],['Reenie Beanie','man'],['Shadows Into Light','man'],['Kalam','man'],['Patrick Hand','man'],['Covered By Your Grace','man'],['Zeyada','man'],['Homemade Apple','man'],['Over the Rainbow','man'],['La Belle Aurore','man'],
 ['Dancing Script','cal'],['Satisfy','cal'],['Sacramento','cal'],['Allura','cal'],['Parisienne','cal'],
 ['Special Elite','dat'],['Courier Prime','dat'],['Cutive Mono','dat'],
 ['Indie Flower','man'],['Handlee','man'],['Amatic SC','man'],   /* D-148: novas manuscritas */
 /* D-179: a letra das fotos do Retro Pocket (Lucida Calligraphy, proprietária) → Fondamento Itálico, a livre mais parecida, e 10 da mesma família */
 ['Fondamento Itálico','cal','Fondamento',1],['Fondamento','cal'],['Quintessential','cal'],['Felipa','cal'],['Marck Script','cal'],['Niconne','cal'],
 ['Bilbo Swash Caps','cal'],['Almendra','cal'],['Courgette','cal'],['Oregano','cal'],['Merienda','cal'],['Sofia','cal'],
 ['Cormorant Garamond Itálico','edi','Cormorant Garamond',1],['Playfair Display Itálico','edi','Playfair Display',1],['EB Garamond','edi'],['Libre Baskerville','edi'],['Lora','edi'],['Crimson Pro','edi'],
 ['Inter Light','lim','Inter',0,300],['Inter Regular','lim','Inter',0,400],['Nunito','lim'],['DM Sans','lim']
].map(function(f){return{n:f[0],c:f[1],fam:f[2]||f[0],it:!!f[3],w:f[4]||400,css:"'"+(f[2]||f[0])+"',"+FB[f[1]]}});
function fonte(n){return FONTES.filter(function(f){return f.n===n})[0]||FONTES[0]}
var FONT_LG={};
FONTES.forEach(function(f){FONT_LG[f.n]=[f.css,f.it?1:0,f.w]});
FONT_LG['IBM Plex Mono']=["'IBM Plex Mono',ui-monospace,monospace",0,400];
/* D-148: variantes que existem como arquivo (site/assets/fonts/ e fonts/pdf/). '700i' = negrito itálico. Nada é sintetizado:
   a tela e o PDF só usam uma variante que existe; sem ela, o botão fica desabilitado e o resto cai na mais próxima. */
var VAR={'Inter':['300','400','500'],'Cormorant Garamond':['300','400','500','700','300i','400i','700i'],'Caveat':['400','500','700'],'Kalam':['400','700'],
 'Courier Prime':['400','700','400i','700i'],'EB Garamond':['400','700','400i','700i'],'Libre Baskerville':['400','700','400i'],'Playfair Display':['400i'],
 'Amatic SC':['400','700'],'Fondamento':['400','400i'],'Almendra':['400','700','400i','700i'],'Oregano':['400','400i'],'Merienda':['400','700'],'Lora':['400','700','400i','700i'],'Crimson Pro':['400','700','400i','700i'],'Nunito':['400','700','400i','700i'],'DM Sans':['400','700','400i','700i']};
function temVar(fam,w,i){return(VAR[fam]||['400']).indexOf(w+(i?'i':''))>=0}
function variante(fam,w,i){                                    /* {w,i} existente mais próximo (mesmo itálico primeiro) */
  var l=(VAR[fam]||['400']).map(function(v){return{w:parseInt(v,10),i:/i$/.test(v)}}),r=null,d=1e9;
  [!!i,!i].forEach(function(it){if(r)return;l.forEach(function(v){var x=Math.abs(v.w-w);if(v.i===it&&x<d){d=x;r=v}})});
  return r||{w:400,i:false}
}
function famLG(n,o){                                           /* o = {b,it}: negrito e itálico escolhidos para o texto (D-148) */
  var f=FONT_LG[n];if(!f)return{f:"'"+n+"',cursive",i:0,w:400};
  var i=!!f[1]||!!(o&&o.it),w=o&&o.b?700:f[2],v=variante(String(f[0]).split("'")[1],w,i);
  return{f:f[0],i:v.i?1:0,w:v.w}
}
/* UI: o que a família oferece para o texto da legenda (botões Itálico e Negrito) */
function estilosDe(n,o){
  var f=FONT_LG[n]||[null,0,400],fam=f[0]?String(f[0]).split("'")[1]:n,bi=!!f[1],b=!!(o&&o.b),i=bi||!!(o&&o.it);
  return{it:{on:i,ok:!bi&&temVar(fam,b?700:f[2],true),natural:bi},b:{on:b,ok:temVar(fam,700,i)}}
}
function caixaLG(t,c){return c==='maiusc'?t.toUpperCase():c==='cap'?t.replace(/(^|\s)(\S)/g,function(m,a,b){return a+b.toUpperCase()}):t}
function estLG(o,mm,px,extra){                               /* só a fonte e a cor; o corpo vem em pt reais (1 pt = 0,3528 mm) */
  var fm=famLG(o.font,o);return'font-family:'+fm.f+';font-style:'+(fm.i?'italic':'normal')+';font-weight:'+fm.w+';color:'+(COR_LG[o.cor]||'#000')+';font-size:'+(o.pt*.3528*px)+'px'+(o.esp!=null?';letter-spacing:'+o.esp+'em':'')+(extra||'')
}
/* D-148 · ajustes avançados da legenda (leg.av): fonte única para tela, Folhas e PDF (MT-02).
   df = formato da data sugerida (índice de FMTD) · lf = formato da localização sugerida · cx = caixa das linhas de data e local ·
   esp = espaçamento entre letras dessas linhas (em). A inclinação continua em leg.inc (agora de −8° a +8°, passo 1°). */
var AV0={df:3,lf:'cu',cx:'normal',esp:.02,sep:'•'};   /* sep = separador das duas linhas quando ficam na mesma linha */
var DATA_AV=[[3,'23/11/26'],[1,'23/11/2026'],[8,'23 nov 2026'],[7,'23 de novembro de 2026'],[13,'nov/2026'],[14,'2026']];
var LOC_AV=[['cu','Cidade - UF'],['cv','Cidade, UF'],['ce','Cidade · Estado por extenso'],['cp','Cidade, País']];
var UF_NOME={AC:'Acre',AL:'Alagoas',AM:'Amazonas',AP:'Amapá',BA:'Bahia',CE:'Ceará',DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',MG:'Minas Gerais',MS:'Mato Grosso do Sul',MT:'Mato Grosso',PA:'Pará',PB:'Paraíba',PE:'Pernambuco',PI:'Piauí',PR:'Paraná',RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RO:'Rondônia',RR:'Roraima',RS:'Rio Grande do Sul',SC:'Santa Catarina',SE:'Sergipe',SP:'São Paulo',TO:'Tocantins'};
function av(leg){var a=(leg&&leg.av)||{},o={},k;for(k in AV0)o[k]=a[k]!=null?a[k]:AV0[k];return o}
function fmtLocal(r,t){                                         /* r = {cidade,uf,pais}; sem cidade, só o país */
  if(!r)return'';
  if(!r.cidade)return r.pais||'';
  var uf=r.uf||'';
  if(t==='cv')return r.cidade+(uf?', '+uf:'');
  if(t==='ce')return r.cidade+(uf?' · '+(UF_NOME[uf]||uf):'');
  if(t==='cp')return r.cidade+', '+(r.pais||'Brasil');
  return r.cidade+(uf?' - '+uf:'')
}
function sepMeta(leg){return' '+av(leg).sep+' '}
function cxMeta(leg,t){return(leg&&leg._cx||av(leg).cx)==='maiusc'?String(t||'').toUpperCase():t}   /* caixa das linhas de data e local */
var LOC0={uf:'sigla',pais:'oculto',ocBR:true,sep:', ',ordem:'cidade'};
/* 44: projeto real = fotos escolhidas (pl-fotos) num projeto salvo aberto. O exemplo também grava pl-fotos
   ao passar pelo Quadro, por isso só a lista não basta. Fonte única para tela, Quadro e PDF (MT-02). */
function ehReal(){try{return !!sessionStorage.getItem('pl-fotos')&&!!localStorage.getItem('pl-projeto-atual')}catch(e){return false}}
function dadosFoto(f){
  var real=ehReal();
  var m=f.m,iso=m?m.iso:(real?'':'2026-07-14T08:00'),cid=m?m.c:(real?'':'Campos do Jordão'),a=String(iso||'').match(/^(\d+)-(\d+)-(\d+)/);
  return{d:a?new Date(+a[1],+a[2]-1,+a[3]):null,iso:a?a[0]:'',c:cid||''}
}
function localLG(l,cid){
  if(ehReal())return cid||'';   /* D-138: em projeto real o local é exatamente o texto digitado (sem estado, sem país) */
  var e=l.uf==='oculto'?'':l.uf==='sigla'?'SP':'São Paulo',pa=l.pais==='oculto'||l.ocBR?'':l.pais==='nome'?'Brasil':'BR';
  var arr=l.ordem==='cidade'?[cid,e,pa]:[e,cid,pa],sep=l.sep===' '?' ':l.sep===', '?', ':' '+l.sep.trim()+' ';
  return arr.filter(Boolean).join(sep)
}
/* ---------- padrões de legenda (mesma ordem de chaves do PADRAO da T-10: projetos salvos comparam por JSON) ----------
   D-135: `original` substitui `limpa` · D-136: `al` (esq|centro|dir) substitui `pos` e `dx`. */
var LEG0={original:false,al:'esq',preset:'simples',dy:0,inc:0,
 txt:{on:true,font:'Caveat',pt:16,fit:false,caixa:'normal',esp:0,cor:'preto'},
 data:{on:true,font:'IBM Plex Mono',pt:8,fmt:0,cor:'preto'},
 loc:{on:true,font:'IBM Plex Mono',pt:8,cor:'preto',uf:'sigla',pais:'oculto',ocBR:true,sep:', ',ordem:'cidade'}};
function copia(o){return JSON.parse(JSON.stringify(o))}
var POCKET_FONTE='Fondamento Itálico';   /* D-179: Lucida Calligraphy das fotos do Pocket → a livre mais parecida */
function legPocket(b){ /* D-113: padrão do Retro Pocket — duas linhas (local e data) ancoradas ao topo das maiúsculas */
  var l=copia(b||LEG0);
  l.txt.on=false;l.meta='linhas';l.ordem='loc-data';l.medida='letras';
  if(ehReal()){l.pad=padNovo();delete l.ordem}   /* D-149: projeto real = Linha 1 Localização (em cima) e Linha 2 Data */
  l.loc.sep=' - ';l.loc.uf='sigla';l.loc.pais='oculto';l.loc.ocBR=true;
  l.data.fmt=3;
  l.data.font=l.loc.font=POCKET_FONTE;                           /* D-179: a letra caligráfica das polaroids do Pocket */
  return l
}
/* D-136 · MT-02: alinhamento Esquerda · Centro · Direita dentro das margens laterais da foto.
   Função única: a tela e o PDF chamam esta (a caixa de cada linha vai de L a L+JW). */
function alinharX(al,L,JW,w){
  var ww=Math.min(w||0,JW);        /* o texto nunca é mais largo que a janela (30a/T4 corta com «…») */
  if(al==='centro')return L+(JW-ww)/2;
  if(al==='dir')return L+JW-ww;
  return L
}
/* D-129 reduzida pela D-136: na automática a assinatura vai para o canto oposto ao texto. */
function assinaturaPos(leg,fr){
  var l=leg||{},fixo=l.assin,al=l.al||'esq';
  if(fixo==='esq'||fixo==='centro'||fixo==='dir')return fixo;
  if(al==='dir')return 'esq';
  if(al==='centro')return 'dir';   /* texto centrado deixa a mesma folga dos dois lados: vai para a direita */
  return 'dir'                      /* texto à esquerda → canto oposto (direita) */
}
function assinaturaDir(leg,fr){ /* atalho antigo (D-128): vale até a troca completa por assinaturaPos */
  return assinaturaPos(leg,fr)==='dir'
}
/* D-135/D-136: migração dos dados antigos. Idempotente; nunca lança erro com dados parciais. */
function migrar(leg){
  if(!leg||typeof leg!=='object')return leg;
  if(leg.limpa!=null){if(leg.original==null)leg.original=!!leg.limpa;delete leg.limpa}
  delete leg.pos;                    /* o texto é sempre abaixo (D-136) */
  var dx=typeof leg.dx==='number'?leg.dx:0;
  if(leg.al==null||leg.al==='')leg.al=dx<-1?'esq':dx>1?'dir':'esq';
  else if(leg.al!=='esq'&&leg.al!=='centro'&&leg.al!=='dir')leg.al='esq';
  delete leg.dx;                     /* o alinhamento assume a posição horizontal (FN-07) */
  return leg
}
/* ---------- D-139 · padrão avançado de 2 linhas (fonte única: tela, Folhas e PDF · MT-02) ----------
   leg.pad = {on,l:[{t,pt},{t,pt}]} no projeto; ST[n].pad (mesmo formato) é a exceção da foto; ST[n].pl = [{v,m},{v,m}] são os
   textos de cada linha (m = digitado à mão). Tipos: loc · data · pt (ponto turístico) · txt (texto livre) · nenhum.
   comPadrao devolve uma cópia da legenda em que a linha 1 ocupa o lugar da «data» e a linha 2 o do «local»,
   em linhas separadas, com o corpo de cada linha; _dt e _lc trazem os textos finais. Sem padrão ligado, devolve a própria legenda. */
var PAD_TIPOS=['loc','data','pt','txt','nenhum'],PAD_PT=[7,8,10,12];
function padNovo(){return{on:true,l:[{t:'loc',pt:8},{t:'data',pt:8}]}}   /* D-149: o modelo de 2 linhas é o padrão do projeto real */
function legInicial(){                                         /* legenda de um projeto novo: real = 2 linhas (Localização · Data); exemplo = a antiga */
  var l=copia(LEG0);
  if(ehReal()){l.meta='linhas';l.pad=padNovo();l.data.font='Courier Prime';l.loc.font='Courier Prime'}   /* mono de máquina de escrever com 400/700/itálicos reais: Itálico e Negrito nascem habilitados */
  return l
}
/* cada linha: tipo (t), corpo (pt, 6 a 40) e, se a pessoa mudou, fonte, cor, negrito (b) e itálico (it); sem eles vale o estilo base de leg.data / leg.loc */
function padLinha(l){
  var t=l&&PAD_TIPOS.indexOf(l.t)>=0?l.t:'nenhum',pt=l&&typeof l.pt==='number'&&l.pt>=6&&l.pt<=40?l.pt:8,o={t:t,pt:pt};
  if(l&&typeof l.font==='string')o.font=l.font;
  if(l&&COR_LG[l.cor])o.cor=l.cor;
  if(l&&l.b)o.b=true;
  if(l&&l.it)o.it=true;
  return o
}
/* migração (real): legenda antiga (texto livre + data + local) vira as 2 linhas equivalentes, com o estilo de cada origem */
function migrarPad(leg,txts){
  if(!leg||!leg.data||!leg.loc||(leg.pad&&leg.pad.on))return leg;
  var t=leg.txt||{},tem=!!(t.on&&txts&&txts.some(function(x){return x})),ord=[];
  function est(o,k){var r={t:k,pt:o.pt||8,font:o.font,cor:o.cor};if(o.b)r.b=true;if(o.it)r.it=true;return r}
  if(tem){ord.push(est(t,'txt'));if(leg.loc.on)ord.push(est(leg.loc,'loc'));else if(leg.data.on)ord.push(est(leg.data,'data'))}
  else{if(leg.loc.on)ord.push(est(leg.loc,'loc'));if(leg.data.on)ord.push(est(leg.data,'data'))}
  while(ord.length<2)ord.push({t:'nenhum',pt:8});
  leg.pad={on:true,l:ord.slice(0,2)};
  if(!leg.meta)leg.meta='linhas';
  return leg
}
function apaDe(m){return m&&(m.iso!==undefined?m:null)}
/* texto de uma linha: o guardado (pl) ou, sem ele, o que dá para derivar da foto (só projeto real e com «Sugestões de legendas» ligadas) */
function linhaTexto(leg,l,i,f){
  if(l.t==='nenhum')return'';
  var p=f&&f.pl&&f.pl[i];
  if(p&&typeof p.v==='string')return p.v;
  if(!ehReal())return'';
  if(l.t==='txt'){var s=f&&(f.leg!=null?f.leg:f.txt);return typeof s==='string'?s:''}
  if(leg.sug===false)return'';
  var m=f&&(f.m||(f.meta&&apaDe(f.meta)));if(!m)return'';
  if(l.t==='data'){var a=String(m.iso||'').match(/^(\d+)-(\d+)-(\d+)/);return a?FMTD[av(leg).df](new Date(+a[1],+a[2]-1,+a[3])):''}
  if(m.cs==='sem'&&(l.t==='loc'||l.t==='pt'))return'';           /* D-178: «Sem local» tira a cidade e o ponto */
  if(l.t==='loc')return m.c||lugarTxt(m.lugar,leg);
  if(l.t==='pt')return m.lugar&&m.lugar.ponto||'';
  return''
}
/* D-178: o lugar lido do GPS (PLFOTOS.lugar, guardado no registro da foto) no formato escolhido em Avançado */
function lugarTxt(g,leg){return!g?'':g.cidade?fmtLocal(g,av(leg).lf):g.pais||''}
function comAv(c){                                              /* D-148: espaçamento e caixa das linhas de data e local */
  if(!c||!c.data||!c.loc)return c;
  var a=av(c);c.data.esp=a.esp;c.loc.esp=a.esp;c._cx=a.cx;return c
}
function comPadrao(leg,f){
  if(!leg||!leg.data||!leg.loc)return leg;
  if(ehReal()&&!(leg.pad&&leg.pad.on))leg=migrarPad(copia(leg),f&&[f.leg!=null?f.leg:f.txt]);   /* projeto real: sempre 2 linhas */
  var a0=av(leg),padrao=a0.esp===AV0.esp&&a0.cx===AV0.cx;
  if(!leg.pad||!leg.pad.on)return padrao&&leg.data.esp==null?leg:comAv(copia(leg));
  return comAv(comPadrao0(leg,f))
}
function aplicaEst(dst,L){
  if(L.font)dst.font=L.font;
  if(L.cor)dst.cor=L.cor;
  if(L.b)dst.b=true;else delete dst.b;
  if(L.it)dst.it=true;else delete dst.it
}
function comPadrao0(leg,f){
  var pd=f&&f.pad&&f.pad.l?f.pad:leg.pad,a=padLinha(pd.l&&pd.l[0]),b=padLinha(pd.l&&pd.l[1]),c=copia(leg);
  c.meta=leg.meta||'linhas';c.ordem=leg.ordem||'data-loc';c.data.on=true;c.loc.on=true;c.data.pt=a.pt;c.loc.pt=b.pt;
  aplicaEst(c.data,a);aplicaEst(c.loc,b);
  c.txt.on=false;                                                /* D-149: não há mais legenda separada; o texto livre é uma das duas linhas */
  if(c.preset==='calendario'||c.preset==='pin')c.preset='simples';
  c._pad=true;c._dt=linhaTexto(leg,a,0,f);c._lc=linhaTexto(leg,b,1,f);
  c._dt=cxMeta(c,c._dt);c._lc=cxMeta(c,c._lc);
  return c
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
  var wb=(f.topo||0)+(f.jh||0);
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
  if(medida==='letras'){                          /* MT-02: 1ª maiúscula a 4 mm da foto; a 2ª, 2 mm abaixo da base da 1ª */
    var b=wb+4+L[0].capMax;
    L.forEach(function(ln,i){if(i)b+=2+ln.capMax;
      ln.lh=ln.asc+ln.desc;ln.base=b;ln.top=b-ln.asc*ln.corpo;ln.letrasTop=b-ln.capMax})
  }else{                                          /* caixa: linha de 1,2 corpo (mesma conta do PDF) */
    var y=wb+2.2+1.2+(opts.capTxt&&opts.capBoxH?opts.capBoxH:0);
    L.forEach(function(ln){
      ln.lh=1.2;ln.top=y;ln.base=y+((1.2-(ln.asc+ln.desc))/2+ln.asc)*ln.corpo;ln.letrasTop=ln.base-ln.capMax;
      y+=1.2*ln.corpo})
  }
  return L
}
window.PLTEXTO={ehReal:ehReal,LEG:LEG,MESX:MESX,SEMX:SEMX,FMTD:FMTD,COR_LG:COR_LG,CAT:CAT,FB:FB,FONTES:FONTES,FONT_LG:FONT_LG,z2:z2,famLG:famLG,VAR:VAR,temVar:temVar,variante:variante,estilosDe:estilosDe,AV0:AV0,DATA_AV:DATA_AV,LOC_AV:LOC_AV,UF_NOME:UF_NOME,av:av,fmtLocal:fmtLocal,lugarTxt:lugarTxt,cxMeta:cxMeta,caixaLG:caixaLG,estLG:estLG,fonte:fonte,LOC0:LOC0,dadosFoto:dadosFoto,localLG:localLG,LEG0:LEG0,legPocket:legPocket,alinharX:alinharX,assinaturaPos:assinaturaPos,assinaturaDir:assinaturaDir,migrar:migrar,padNovo:padNovo,legInicial:legInicial,migrarPad:migrarPad,sepMeta:sepMeta,padLinha:padLinha,PAD_PT:PAD_PT,PAD_TIPOS:PAD_TIPOS,comPadrao:comPadrao,medTela:medTela,limparMedTela:limparMedTela,linhas:linhas};
})();
