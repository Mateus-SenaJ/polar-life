/* T-10 · Inspetor · aba LEGENDAS · DOC-05 FN-07 · DOC-02 §4 (EXC-2) · DOC-12 DV-03/04/05/18/21/23/28
   Estilo dos 3 tipos = projeto todo (ST[0].leg). Texto livre = por foto (ST[n].txt). Histórico vem do quadro.js.
   D-113: «linhas» do Pocket — posições da data e do local vêm de PLTEXTO.linhas (MT-02). */
(function(){
var Q=window.PLQ;if(!Q)return;
var LT=window.PLTEXTO;if(!LT)return;
var $=function(i){return document.getElementById(i)};
var DATA=new Date(2026,6,14),LOCAL={cidade:'Campos do Jordão',uf:'SP',estado:'São Paulo',pais:'Brasil',cod:'BR'};
var ROT=['14.07.26','14/07/2026','14-07-2026','14/07/26','2026-07-14','07/2026','07.26','14 de julho de 2026','14 jul 2026','14 de julho','Julho de 2026','jul/26','terça, 14 de julho'];
var FMT=ROT.map(function(r,i){return[r,LT.FMTD[i]]}); /* 13 formatos do FN-07 (DV-05) */
var CAT=LT.CAT,FONTES=LT.FONTES;
function fonte(n){return LT.fonte(n)}
var carregadas={};
function carregar(lista){ /* sob demanda (LG-04): as fontes são nossas (fonts.css, P-FONTES fechada); só pede as visíveis na lista */
  if(!document.fonts||!document.fonts.load)return;
  lista.forEach(function(f){if(carregadas[f.n])return;carregadas[f.n]=1;
    document.fonts.load((f.it?'italic ':'')+f.w+" 16px '"+f.fam+"'").catch(function(){})})
}
var PRESETS={ /* 8 estilos prontos (DV-03); cada um muda o look, não o texto */
  simples:{t:'Simples',p:{}},
  contornada:{t:'Contornada',p:{}},
  etiqueta:{t:'Etiqueta',p:{'txt.caixa':'normal'}},
  carimbo:{t:'Carimbo',p:{'txt.caixa':'maiusc','txt.esp':.1}},
  pin:{t:'Pin de local',p:{}},
  calendario:{t:'Calendário',p:{}},
  bilhete:{t:'Bilhete',p:{'txt.font':'Special Elite'}},
  manuscrito:{t:'Manuscrito',p:{'txt.font':'Caveat','txt.caixa':'normal','txt.esp':0}}
};
var PADRAO=LT.LEG0; /* mesmo conteúdo do padrão antigo, na mesma ordem de chaves: projetos salvos comparam por JSON */
var DEFL={meta:'junto',ordem:'data-loc',medida:'caixa'}; /* chaves novas (D-113): ausentes no projeto = padrão */
var UI={sel:null,cat:'todas',busca:'',fav:['Caveat'],rec:[],aberto:{},conf:false,err:null};
var COR={preto:'#000',azul:'#006194',laranja:'#FD761A'};
function copia(o){return JSON.parse(JSON.stringify(o))}
function L(){var S=Q.ST()[0];if(!S.leg)S.leg=copia(PADRAO);return S.leg}
function T(){var s=Q.S();return s.txt===null||s.txt===undefined?['Dias de sol','Nós dois','Dia de rolê','Meu parceiro'][(Q.src(Q.cur())-1)%4]:s.txt}
function getp(o,k){return k.split('.').reduce(function(a,b){return a[b]},o)}
function setp(o,k,v){var a=k.split('.');a.slice(0,-1).forEach(function(x){o=o[x]});o[a[a.length-1]]=v}
function getv(o,k){var v=getp(o,k);return v==null&&DEFL[k]!==undefined?DEFL[k]:v}
function val(k){return getv(L(),k)}
function defv(k){return DEFL[k]!==undefined?DEFL[k]:getp(PADRAO,k)}
function fam(nome){return nome==='IBM Plex Mono'?"'IBM Plex Mono',ui-monospace,monospace":fonte(nome).css}
function caixa(t,c){return c==='maiusc'?t.toUpperCase():c==='cap'?t.replace(/(^|\s)(\S)/g,function(m,a,b){return a+b.toUpperCase()}):t}
function localTxt(l,c){var cid=c==null?LOCAL.cidade:c;
  var e=l.uf==='oculto'?'':l.uf==='sigla'?LOCAL.uf:LOCAL.estado,p=l.pais==='oculto'||(l.ocBR&&l.pais!=='oculto')?'':l.pais==='nome'?LOCAL.pais:LOCAL.cod;
  var a=l.ordem==='cidade'?[cid,e,p]:[e,cid,p];
  var sep=l.sep===' '?' ':l.sep===', '?', ':' '+l.sep.trim()+' ';
  return a.filter(Boolean).join(sep)
}
function amostra(k){return k==='txt'?(T()||'Dia de rolê'):k==='data'?FMT[L().data.fmt][1](DATA):localTxt(L().loc)}
function num(v){return Math.round(v*100)/100}
function estXL(o,extra){ /* linha absoluta: corpo em mm reais via --pmm, reescala junto com a mesa (D-113) */
  return LT.estLG(o,0,1,extra).replace(/font-size:([\d.]+)px/,'font-size:calc(var(--pmm)*$1)')}
/* ---------- validação do texto livre (FN-07): código de arquivo pede confirmação; coordenadas bloqueiam ---------- */
function checar(v){
  if(/-?\d{1,3}[.,]\d{3,}\s*[,;]\s*-?\d{1,3}[.,]\d{3,}/.test(v))return'coord';
  if(/^(IMG|DSC|DSCN|PXL|MVIMG)[_-]?\d+|\.(jpe?g|png|heic|webp)$/i.test(v.trim()))return'arquivo';
  return''
}

/* ---------- desenho na polaroid ---------- */
function pintar(){
  var l=L(),pq=$('pq'),top=$('cap-top'),band=$('cap-band'),meta=$('cap-meta'),cap=$('cap');
  [].slice.call(pq.querySelectorAll('.lg-xl')).forEach(function(n){n.parentNode.removeChild(n)}); /* sai antes: o .lg-lc do fluxo continua achável */
  if(!l.txt)return;
  var cor=function(k){return COR[l[k].cor]||'#000'};
  var M=Q.meta?Q.meta(Q.cur()):{data:DATA,cidade:LOCAL.cidade,iso:'2026-07-14T08:00'};
  var dt=l.data.on&&M.data?FMT[l.data.fmt][1](M.data):'',lc=l.loc.on&&M.cidade?localTxt(l.loc,M.cidade):'';
  var txt=l.txt.on?caixa(T(),l.txt.caixa):'';
  var junto=(l.meta||'junto')!=='linhas',ordem=l.ordem||'data-loc',letras=l.medida==='letras'&&l.pos!=='acima'&&!!(dt||lc);
  pq.setAttribute('data-preset',l.preset);
  var sigE=pq.querySelector('.pq__sig');if(sigE)sigE.classList.toggle('pq__sig--dir',LT.assinaturaDir(l,Q.FR)); /* D-128 */
  pq.style.setProperty('--dx',l.dx);pq.style.setProperty('--dy',l.dy);pq.style.setProperty('--inc',l.inc+'deg');
  var capHTML=txt?'<span class="lg-txt" id="lg-txt" style="font-family:'+fam(l.txt.font)+';font-style:'+(fonte(l.txt.font).it?'italic':'normal')+';font-weight:'+fonte(l.txt.font).w+';--pt:'+l.txt.pt+';letter-spacing:'+l.txt.esp+'em;color:'+cor('txt')+'"></span>':'';
  var dtH=dt?'<time class="lg-dt" datetime="'+M.iso.slice(0,10)+'" style="font-family:'+fam(l.data.font)+';--pt:'+l.data.pt+';color:'+cor('data')+'"></time>':'';
  var lcH=lc?'<span class="lg-lc" style="font-family:'+fam(l.loc.font)+';--pt:'+l.loc.pt+';color:'+cor('loc')+'">'+(l.preset==='pin'?'<svg class="ico lg-pin"><use href="#i-pin"/></svg>':'')+'</span>':'';
  var sepH=(dt&&lc)?'<span class="lg-sep" aria-hidden="true"> • </span>':'';
  var metaHTML=junto?(ordem==='loc-data'?lcH+sepH+dtH:dtH+sepH+lcH)
   :'<span class="lg-ms">'+(ordem==='loc-data'?[lcH,dtH]:[dtH,lcH]).filter(Boolean).map(function(r){return'<span class="lg-m">'+r+'</span>'}).join('')+'</span>';
  /* posição: abaixo (tudo embaixo) · acima (tudo na margem de cima) · ambas (texto em cima, data e local embaixo) */
  var acima=l.pos==='acima',ambas=l.pos==='ambas';
  top.innerHTML=(acima||ambas)?capHTML:'';
  top.innerHTML+=acima?'<span class="lg-m">'+metaHTML+'</span>':'';
  cap.outerHTML=(acima||ambas)?'<span class="pq__cap" id="cap" hidden></span>':'<span class="pq__cap" id="cap">'+capHTML+'</span>';
  meta.innerHTML=acima||letras?'':metaHTML;   /* letras: o fluxo fica vazio (só as absolutas do .lg-xl contam, senão o fora() lê rects zerados) */
  meta.hidden=acima||!metaHTML||letras;
  var t1=$('lg-txt');if(t1)t1.textContent=txt;
  var dtE=pq.querySelector('.lg-dt');if(dtE)dtE.textContent=dt;
  var lcEl=pq.querySelector('.lg-lc');if(lcEl)lcEl.appendChild(document.createTextNode(lc));
  /* «Ajustar para caber»: reduz o corpo até a legenda caber na largura útil */
  if(l.txt.fit&&t1){var lyr=pq.querySelector('.pq__leg'),cw0=pq.classList.contains('is-h')&&lyr?lyr.offsetWidth:pq.getBoundingClientRect().width,max=cw0-2*20*(cw0/420)*1.0-8,pt=l.txt.pt;
    while(t1.scrollWidth>max&&pt>8){pt-=.5;t1.style.setProperty('--pt',pt)}}
  /* topo das letras (D-113 · MT-02): linhas absolutas medidas por PLTEXTO.linhas, em mm reais */
  if(letras){
    var fr=Q.FR,figTop=(fr.ct||0)+(fr.cjh||0)+2.2,LNS=LT.linhas(l,fr,LT.medTela,{temData:!!dt,temLoc:!!lc});
    if(LNS.length){
      var ult=LNS[LNS.length-1],figH=Math.max(0,ult.top+ult.lh*ult.corpo-figTop);
      var dX=dt?'<time class="lg-dt" datetime="'+M.iso.slice(0,10)+'" style="'+estXL(l.data,';line-height:0')+'"></time>':'';
      var lX=lc?'<span class="lg-lc" style="'+estXL(l.loc,';line-height:0')+'">'+(l.preset==='pin'?'<svg class="ico lg-pin"><use href="#i-pin"/></svg>':'')+'</span>':'';
      var sX=(dt&&lc)?'<span class="lg-sep" aria-hidden="true" style="'+estXL({font:'IBM Plex Mono',pt:Math.max(l.data.pt,l.loc.pt),cor:'preto'},';line-height:0')+'"> • </span>':'';
      var xl='<div class="lg-xl" style="top:calc(var(--pmm)*'+num((fr.cjh||0)+2.2)+');width:calc(var(--pmm)*'+num(fr.cjw||0)+');height:calc(var(--pmm)*'+num(figH)+')">';
      LNS.forEach(function(ln){
        var dentro=ln.k==='data'?dX:ln.k==='loc'?lX:(ordem==='loc-data'?lX+sX+dX:dX+sX+lX);
        xl+='<div class="lg-l lg-l--x" style="top:calc(var(--pmm)*'+num(ln.top-figTop)+');'+estXL(ln.est,';line-height:'+ln.lh+'em')+'">'+dentro+'</div>'
      });
      band.insertAdjacentHTML('beforeend',xl+'</div>');
      var xdt=band.querySelector('.lg-xl .lg-dt');if(xdt)xdt.textContent=dt;
      var xlc=band.querySelector('.lg-xl .lg-lc');if(xlc)xlc.appendChild(document.createTextNode(lc))
    }
  }
}
/* área segura: cada texto dentro da folha com 4 mm de respiro e acima da assinatura (BR-13 «Bloqueia») */
function fora(){
  var pq=$('pq'),r=pq.getBoundingClientRect(),sigE=pq.querySelector('.pq__sig'),lyr=pq.querySelector('.pq__leg'),h=pq.classList.contains('is-h')&&lyr,out=[];
  var sr=sigE.getBoundingClientRect(),rc,cvt=function(b){return b};
  if(h){                                                    /* deitada: leva cada caixa da tela para a moldura em pé (giro de 90° no sentido horário) */
    var lr=lyr.getBoundingClientRect(),cx=lr.left+lr.width/2,cy=lr.top+lr.height/2,W=lyr.offsetWidth,H=lyr.offsetHeight;
    cvt=function(b){var us=[b.left,b.right],vs=[b.top,b.bottom],uu=[],vv=[];                     /* u = W/2 + (y − cy) · v = H/2 − (x − cx) */
      us.forEach(function(x){vs.forEach(function(y){uu.push(W/2+(y-cy));vv.push(H/2-(x-cx))})});
      return{left:Math.min.apply(null,uu),right:Math.max.apply(null,uu),top:Math.min.apply(null,vv),bottom:Math.max.apply(null,vv)}};
    rc={left:0,top:0,right:W,bottom:H,width:W};sr=cvt(sr)
  }else rc=r;
  var m=rc.width/(Q.FR.cw||Q.FR.w||88)*4;
  [].forEach.call(pq.querySelectorAll('.lg-txt,.lg-dt,.lg-lc'),function(e){
    var b=cvt(e.getBoundingClientRect()),cruza=b.right>sr.left&&b.left<sr.right;
    if(b.left<rc.left+m-.5||b.right>rc.right-m+.5||b.top<rc.top+m*.2-.5||(cruza?b.bottom>sr.top+.5:b.bottom>rc.bottom-m*.5))out.push(e)
  });
  return out.length>0
}

/* ---------- inspetor ---------- */
function seg(nome,rot,ops,v,k,h){
  return'<div class="f"><div class="f__top"><span class="f__l" id="l-'+nome+'">'+rot+'</span>'+rst(k)+'</div><div class="seg'+(ops.length===3?' seg--3':'')+'" role="radiogroup" aria-labelledby="l-'+nome+'">'
   +ops.map(function(o){return'<label class="seg__o"><input type="radio" name="'+nome+'" value="'+o[0]+'" data-k="'+k+'"'+(o[0]===v?' checked':'')+'><span>'+o[1]+'</span></label>'}).join('')+'</div>'+(h?'<p class="f__h">'+h+'</p>':'')+'</div>'
}
function rst(k){return'<button type="button" class="rst mono" data-lreset="'+k+'" hidden><svg class="ico sm"><use href="#i-reset"/></svg>Resetar</button>'}
function sld(k,rot,u,min,max,step,dec,h){
  return'<div class="f" data-lk="'+k+'"><div class="f__top"><label class="f__l" for="n-'+k+'">'+rot+'</label>'+rst(k)+'</div><div class="sl"><input type="range" id="r-'+k+'" min="'+min+'" max="'+max+'" step="'+step+'" aria-label="'+rot+'" data-s="'+k+'"><div class="num num--s"><input id="n-'+k+'" inputmode="decimal" autocomplete="off" data-n="'+k+'"><span class="num__u mono">'+u+'</span></div></div><p class="f__h" id="h-'+k+'">'+h+'</p></div>'
}
function cores(k,v){
  return'<div class="f"><div class="f__top"><span class="f__l" id="l-c-'+k+'">Cor da inscrição</span>'+rst(k+'.cor')+'</div><div class="cores" role="radiogroup" aria-labelledby="l-c-'+k+'">'
   +[['preto','Preto'],['azul','Azul'],['laranja','Laranja']].map(function(c){return'<label class="cor"><input type="radio" name="cor-'+k+'" value="'+c[0]+'" data-k="'+k+'.cor"'+(v===c[0]?' checked':'')+'><span class="cor__b"><i style="background:'+COR[c[0]]+'"></i>'+c[1]+'</span></label>'}).join('')+'</div></div>'
}
function seletor(k){
  var l=L()[k],f=fonte(l.font),abre=UI.sel===k;
  var h='<div class="f"><div class="f__top"><span class="f__l" id="l-f-'+k+'">Fonte</span>'+rst(k+'.font')+'</div>'
   +'<button type="button" class="fsel" data-fsel="'+k+'" aria-expanded="'+abre+'" aria-labelledby="l-f-'+k+' fv-'+k+'"><span id="fv-'+k+'" class="fsel__s" style="font-family:'+fam(l.font)+';font-style:'+(f.it?'italic':'normal')+'">'+amostra(k)+'</span><span class="rotulo fsel__n">'+l.font+'</span><svg class="ico sm"><use href="#i-down"/></svg></button>';
  if(abre){
    var lista=FONTES.filter(function(x){return(UI.cat==='todas'||(UI.cat==='fav'?UI.fav.indexOf(x.n)>=0:UI.cat==='rec'?UI.rec.indexOf(x.n)>=0:x.c===UI.cat))&&x.n.toLowerCase().indexOf(UI.busca.toLowerCase())>=0});
    carregar(lista);
    h+='<div class="fpick"><label class="fbusca"><svg class="ico sm"><use href="#i-search"/></svg><input type="search" id="fbusca" placeholder="Buscar fonte" aria-label="Buscar fonte por nome" value="'+UI.busca.replace(/"/g,'&quot;')+'" autocomplete="off"></label>'
     +'<div class="fcats" role="tablist" aria-label="Categorias de fonte">'+[['todas','Todas'],['fav','Favoritas'],['rec','Recentes']].concat(Object.keys(CAT).map(function(c){return[c,CAT[c]]})).map(function(c){return'<button type="button" role="tab" class="fcat rotulo" data-fcat="'+c[0]+'" aria-selected="'+(UI.cat===c[0])+'">'+c[1]+'</button>'}).join('')+'</div>'
     +'<ul class="flist" aria-label="Fontes">'+(lista.length?lista.map(function(x){var on=x.n===l.font,fv=UI.fav.indexOf(x.n)>=0;
       return'<li class="fitem'+(on?' is-on':'')+'"><button type="button" class="fitem__b" data-pick="'+x.n+'" aria-pressed="'+on+'"><span class="fitem__s" style="font-family:'+x.css+';font-style:'+(x.it?'italic':'normal')+';font-weight:'+x.w+'">'+amostra(k)+'</span><span class="rotulo fitem__n">'+x.n+' · '+CAT[x.c]+'</span></button><button type="button" class="ib" data-fav="'+x.n+'" aria-pressed="'+fv+'" aria-label="'+(fv?'Tirar de':'Pôr em')+' favoritas: '+x.n+'"><svg class="ico sm"><use href="#i-heart"/></svg></button></li>'}).join(''):'<li class="f__h">Nenhuma fonte encontrada. Limpe a busca ou escolha outra categoria.</li>')+'</ul>'
     +'<p class="f__h">Se uma fonte não carregar, entra a padrão da categoria e a revisão de impressão avisa.</p></div>'
  }
  return h+'</div>'
}
function sw(k,rot,on){return'<div class="sw-row"><div><span class="f__l" id="s-'+k+'">'+rot+'</span></div><button type="button" class="sw" data-sw="'+k+'" role="switch" aria-checked="'+on+'" aria-labelledby="s-'+k+'"><span></span></button></div>'}
function montar(){
  var l=L(),h='';
  h+='<section class="mod" aria-labelledby="lm0"><h3 class="mod__h rotulo rotulo--m" id="lm0">Estilos prontos <span class="mono" style="float:right">'+Object.keys(PRESETS).length+'</span></h3><div class="presets" role="radiogroup" aria-label="Estilos prontos">'
   +Object.keys(PRESETS).map(function(k){return'<label class="preset"><input type="radio" name="preset" value="'+k+'"'+(l.preset===k?' checked':'')+'><span>'+PRESETS[k].t+'</span></label>'}).join('')+'</div></section>';
  h+='<section class="mod" aria-labelledby="lm1"><h3 class="mod__h rotulo rotulo--m" id="lm1">Texto livre</h3>'+sw('txt.on','Mostrar texto livre',l.txt.on)
   +'<div class="f" id="f-texto"><div class="f__top"><label class="f__l" for="lg-in">Texto desta foto</label><span class="mono f__h" id="lg-cnt">0/80</span></div><div class="num lg-num"><input id="lg-in" maxlength="80" autocomplete="off" style="text-align:left;padding-left:12px"></div><p class="f__h" id="lg-h">Até 80 caracteres.</p><div id="lg-conf" hidden></div></div>'
   +seletor('txt')
   +sld('txt.pt','Tamanho','pt',8,32,1,0,'De 8 a 32 pt.')
   +'<label class="chk"><input type="checkbox" data-chk="txt.fit"'+(l.txt.fit?' checked':'')+'><span class="chk__b" aria-hidden="true"><svg class="ico"><use href="#i-check"/></svg></span><span><strong>Ajustar para caber</strong><span class="f__h">Reduz o tamanho até o texto caber na área segura.</span></span></label>'
   +seg('caixa','Caixa',[['normal','Normal'],['maiusc','Maiúsc.'],['cap','Capitalizada']],l.txt.caixa,'txt.caixa')
   +sld('txt.esp','Espaçamento','em',-0.05,0.3,0.01,2,'De −0,05 a 0,3 em.')
   +cores('txt',l.txt.cor)+'</section>';
  h+='<section class="mod" aria-labelledby="lm2"><h3 class="mod__h rotulo rotulo--m" id="lm2">Data</h3>'+sw('data.on','Mostrar data',l.data.on)
   +'<div class="f"><div class="f__top"><span class="f__l" id="l-fmt">Formato</span>'+rst('data.fmt')+'</div><div class="fmts" role="radiogroup" aria-labelledby="l-fmt">'+FMT.map(function(f,i){return'<label class="preset preset--s"><input type="radio" name="fmt" value="'+i+'"'+(l.data.fmt===i?' checked':'')+'><span>'+f[1](DATA)+'</span></label>'}).join('')+'</div><p class="f__h">Origem: data da foto. Sem data, a legenda não mostra data.</p></div>'
   +seletor('data')
   +sld('data.pt','Tamanho','pt',8,32,1,0,'De 8 a 32 pt.')+cores('data',l.data.cor)+'</section>';
  h+='<section class="mod" aria-labelledby="lm3"><h3 class="mod__h rotulo rotulo--m" id="lm3">Local</h3>'+sw('loc.on','Mostrar local',l.loc.on)
   +'<p class="f__h">Cidade, nunca coordenadas. A cidade é lida no aparelho.</p>'
   +seg('uf','Estado',[['sigla','Sigla'],['nome','Nome'],['oculto','Oculto']],l.loc.uf,'loc.uf')
   +seg('pais','País',[['oculto','Oculto'],['nome','Nome'],['cod','Código']],l.loc.pais,'loc.pais')
   +seg('sep','Separador',[[', ','Vírgula'],['·','Ponto'],['–','Traço'],['/','Barra'],[' - ','Hífen']],l.loc.sep,'loc.sep')
   +seg('ordem','Ordem',[['cidade','Cidade, Estado'],['estado','Estado, Cidade']],l.loc.ordem,'loc.ordem')
   +seletor('loc')
   +sld('loc.pt','Tamanho','pt',8,32,1,0,'De 8 a 32 pt.')+cores('loc',l.loc.cor)+'</section>';
  h+='<section class="mod" aria-labelledby="lm4"><h3 class="mod__h rotulo rotulo--m" id="lm4">Linhas</h3>' /* D-113 */
   +seg('lmeta','Data e local',[['junto','Na mesma linha'],['linhas','Em linhas separadas']],val('meta'),'meta')
   +seg('lordem','Ordem',[['data-loc','Data primeiro'],['loc-data','Local primeiro']],val('ordem'),'ordem')
   +seg('lmedida','Medir espaços por',[['caixa','Caixa do texto'],['letras','Topo das letras']],val('medida'),'medida','Com «topo das letras», a primeira maiúscula fica a 4 mm da foto e a segunda linha, 2 mm abaixo da base da primeira.')
   +'</section>';
  h+='<section class="mod" aria-labelledby="lm5"><h3 class="mod__h rotulo rotulo--m" id="lm5">Posição</h3>'
   +seg('pos','Onde fica',[['abaixo','Abaixo'],['acima','Acima'],['ambas','Ambas']],l.pos,'pos','Abaixo: tudo embaixo. Acima: tudo na margem de cima. Ambas: texto em cima, data e local embaixo.')
   +sld('dx','Deslocar na horizontal','mm',-5,5,0.1,1,'De −5 a +5 mm.')+sld('dy','Deslocar na vertical','mm',-5,5,0.1,1,'De −5 a +5 mm.')+sld('inc','Inclinação','°',-5,5,0.1,1,'De −5° a +5°.')+'</section>';
  h+='<div id="lg-fora" class="msg msg--warn" hidden><svg class="ico"><use href="#i-warn"/></svg><div class="msg__body"><p>A legenda passa da área segura e bloqueia a impressão. Reduza o tamanho, encurte o texto ou use «Ajustar para caber».</p><div class="qmsg__act"><button type="button" class="btn2 btn2--sm" data-lfit>Ajustar para caber</button></div></div></div>';
  h+='<div class="pe"><button type="button" class="btn2 btn2--lg pe__b" id="lg-rtudo">Resetar legendas</button><button type="button" class="btn2 btn2--lg pe__b" id="lg-apply">Aplicar legendas</button></div>';
  $('p-legendas').innerHTML=h;
  $('lg-in').value=T();
  sincronizar()
}
function sincronizar(){
  var l=L();
  [].forEach.call(document.querySelectorAll('[data-lk]'),function(f){
    var k=f.getAttribute('data-lk'),v=getp(l,k),r=$('r-'+k),n=$('n-'+k),dec=(k==='txt.esp'?2:k.indexOf('pt')>0?0:1);
    r.value=v;if(document.activeElement!==n)n.value=String(dec?Number(v).toFixed(dec):v).replace('.',',');
    f.querySelector('[data-lreset]').hidden=v===defv(k)
  });
  [].forEach.call(document.querySelectorAll('[data-lreset]'),function(b){var k=b.getAttribute('data-lreset');if(b.closest('[data-lk]'))return;b.hidden=JSON.stringify(getv(l,k))===JSON.stringify(defv(k))});
  [].forEach.call(document.querySelectorAll('[data-sw]'),function(b){b.setAttribute('aria-checked',getp(l,b.getAttribute('data-sw')))});
  [].forEach.call(document.querySelectorAll('input[data-k]'),function(i){i.checked=String(getv(l,i.getAttribute('data-k')))===i.value});
  [].forEach.call(document.querySelectorAll('input[name=preset]'),function(i){i.checked=i.value===l.preset});
  [].forEach.call(document.querySelectorAll('input[name=fmt]'),function(i){i.checked=+i.value===l.data.fmt});
  [].forEach.call(document.querySelectorAll('[data-chk]'),function(i){i.checked=!!getp(l,i.getAttribute('data-chk'))});
  var inp=$('lg-in');if(inp&&document.activeElement!==inp)inp.value=T();
  $('lg-cnt').textContent=(inp?inp.value.length:0)+'/80';
  $('lg-fora').hidden=!fora()
}
function render(){
  L();pintar();
  if(!$('p-legendas').hidden){if(!$('lg-in'))montar();else{sincronizar();['txt','data','loc'].forEach(function(k){var e=$('fv-'+k);if(e)e.textContent=amostra(k)})}}
}
function mudar(k,v,chave){setp(L(),k,v);Q.commit(chave||('lg:'+k))}
function preset(k){
  var l=L();l.preset=k;var p=PRESETS[k].p;Object.keys(p).forEach(function(x){setp(l,x,p[x])});
  if(k==='pin')l.loc.on=true;if(k==='calendario')l.data.on=true;
  UI.sel=null;Q.commit('lg:preset');montar()
}
/* padrão do Retro Pocket (D-113): duas linhas, local primeiro, ancoradas no topo das maiúsculas.
   Só troca quando a legenda ainda está no padrão — personalizações ficam de fora. */
function padraoPocket(){
  var s=Q.ST()[0],cur=s.leg;
  if(cur&&JSON.stringify(cur)!==JSON.stringify(PADRAO))return false;
  s.leg=LT.legPocket(PADRAO);
  return true
}
/* ---------- eventos (delegação) ---------- */
var P=$('p-legendas');
P.addEventListener('input',function(e){
  var t=e.target,k;
  if(t.id==='lg-in'){
    var v=t.value,c=checar(v),h=$('lg-h'),f=$('f-texto');$('lg-cnt').textContent=v.length+'/80';
    f.classList.toggle('is-err',c==='coord');$('lg-conf').hidden=true;UI.conf=false;
    if(c==='coord'){h.textContent='✕ Coordenadas não podem virar legenda. Escreva o nome do lugar.';return}
    if(c==='arquivo'){h.textContent='Parece um código de arquivo.';var b=$('lg-conf');b.hidden=false;b.innerHTML='<div class="qmsg__act"><button type="button" class="btn2 btn2--sm" data-usar>Usar mesmo assim</button><button type="button" class="btn2 btn2--sm" data-limpar>Limpar</button></div>';UI.pend=v;return}
    h.textContent='Até 80 caracteres.';Q.S().txt=v;Q.commit('lg:txt');return
  }
  if(t.hasAttribute('data-s')){k=t.getAttribute('data-s');mudar(k,parseFloat(t.value));return}
  if(t.hasAttribute('data-n')){k=t.getAttribute('data-n');var r=$('r-'+k),v2=parseFloat(t.value.replace(',','.')),f2=t.closest('.f');
    if(isNaN(v2)||v2<+r.min||v2>+r.max){f2.classList.add('is-err');$('h-'+k).textContent='✕ Use um valor de '+r.min.replace('.',',')+' a '+r.max.replace('.',',')+'.';return}
    f2.classList.remove('is-err');mudar(k,v2);return}
  if(t.id==='fbusca'){UI.busca=t.value;var pos=t.selectionStart;montar();var n=$('fbusca');n.focus();n.setSelectionRange(pos,pos);return}
});
P.addEventListener('change',function(e){
  var t=e.target;
  if(t.name==='preset'){preset(t.value);return}
  if(t.name==='fmt'){mudar('data.fmt',+t.value);return}
  if(t.hasAttribute('data-chk')){mudar(t.getAttribute('data-chk'),t.checked);return}
  if(t.hasAttribute('data-k')){var k=t.getAttribute('data-k'),v=t.value;
    if(DEFL[k]!==undefined){ /* chaves novas do Pocket: voltar ao padrão remove a chave do projeto */
      if(v===DEFL[k])delete L()[k];else setp(L(),k,v);
      Q.commit('lg:'+k);return}
    if(v==='true')v=true;mudar(k,v)}
});
P.addEventListener('focusout',function(e){if(e.target.hasAttribute&&e.target.hasAttribute('data-n')){e.target.closest('.f').classList.remove('is-err');sincronizar()}});
P.addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-sw')){var k=b.getAttribute('data-sw');mudar(k,!getp(L(),k));return}
  if(b.hasAttribute('data-fsel')){var kk=b.getAttribute('data-fsel');UI.sel=UI.sel===kk?null:kk;UI.busca='';montar();return}
  if(b.hasAttribute('data-fcat')){UI.cat=b.getAttribute('data-fcat');montar();return}
  if(b.hasAttribute('data-pick')){var n=b.getAttribute('data-pick');UI.rec=[n].concat(UI.rec.filter(function(x){return x!==n})).slice(0,5);var s=UI.sel;UI.sel=null;L()[s].font=n;Q.commit('lg:font');montar();return}
  if(b.hasAttribute('data-fav')){var f=b.getAttribute('data-fav'),i=UI.fav.indexOf(f);if(i>=0)UI.fav.splice(i,1);else UI.fav.push(f);montar();return}
  if(b.hasAttribute('data-lreset')){var kr=b.getAttribute('data-lreset');
    if(DEFL[kr]!==undefined){delete L()[kr];Q.commit('lg:'+kr);montar();return} /* D-113: resetar = tirar a chave */
    setp(L(),kr,getp(PADRAO,kr));Q.commit('lg:'+kr);montar();return}
  if(b.hasAttribute('data-usar')){Q.S().txt=UI.pend;$('lg-conf').hidden=true;$('lg-h').textContent='Até 80 caracteres.';Q.commit('lg:txt');return}
  if(b.hasAttribute('data-limpar')){Q.S().txt='';$('lg-in').value='';$('lg-conf').hidden=true;$('lg-h').textContent='Até 80 caracteres.';Q.commit('lg:txt');return}
  if(b.hasAttribute('data-lfit')){L().txt.fit=true;Q.commit('lg:fit');montar();return}
  if(b.id==='lg-rtudo'){Q.ST()[0].leg=copia(PADRAO);Q.commit('lg:tudo');UI.sel=null;montar();Q.toast('Legendas voltaram ao padrão',true);return}
  if(b.id==='lg-apply'){var tx=Q.S().txt,S=Q.ST(),c=0;if(tx===null)tx=T();for(var j=1;j<=Q.N;j++){if(j!==Q.cur()){S[j].txt=tx;c++}}Q.commit('lg:aplicar');Q.toast('Texto aplicado às outras '+c+' fotos',true)}
});
window.PLLEG={render:render,padraoPocket:padraoPocket};
document.fonts&&document.fonts.addEventListener&&document.fonts.addEventListener('loadingdone',function(){LT.limparMedTela();render()}); /* métricas mudaram: recalcula as linhas (D-113) */
render()
})();
