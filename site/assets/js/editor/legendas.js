/* T-10 · Inspetor · aba LEGENDAS · DOC-05 FN-07 · DOC-02 §4 (EXC-2) · DOC-12 DV-03/04/05/18/21/23/28
   Estilo dos 3 tipos = projeto todo (ST[0].leg). Texto livre = por foto (ST[n].txt). Histórico vem do quadro.js.
   D-113: «linhas» do Pocket — posições da data e do local vêm de PLTEXTO.linhas (MT-02).
   D-149: no projeto real o painel é o modelo de 2 linhas (Linha 1 e Linha 2, cada uma com tipo e texto), um único conjunto de estilo com alvo e Avançado sem repetir controle;
   o exemplo mantém o painel antigo (montarEx). D-148: fontes novas, Itálico/Negrito reais e Configurações avançadas (inclinação, formatos, caixa, espaçamento, data e cidade da foto).
   D-135: «Sem legendas» (só a foto e a moldura) é o primeiro controle · D-136: o texto fica só abaixo, alinhado esq|centro|dir. */
(function(){
var Q=window.PLQ;if(!Q)return;
var LT=window.PLTEXTO;if(!LT)return;
var $=function(i){return document.getElementById(i)};
var DATA=new Date(2026,6,14),LOCAL={cidade:'Campos do Jordão',uf:'SP',estado:'São Paulo',pais:'Brasil',cod:'BR'};
var ROT=['14.07.26','14/07/2026','14-07-2026','14/07/26','2026-07-14','07/2026','07.26','14 de julho de 2026','14 jul 2026','14 de julho','Julho de 2026','jul/26','terça, 14 de julho','jul/2026','2026'];
var FMT=ROT.map(function(r,i){return[r,LT.FMTD[i]]}); /* 13 formatos do FN-07 (DV-05) */
var CAT=LT.CAT,FONTES=LT.FONTES;
var ALCSS={esq:'left',centro:'center',dir:'right'},JC={esq:'flex-start',centro:'center',dir:'flex-end'}; /* D-136: alinhamento na tela */
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
var UI={sel:null,cat:'todas',busca:'',aberto:{},conf:false,err:null};
var COR={preto:'#000',azul:'#006194',laranja:'#FD761A'};
function copia(o){return JSON.parse(JSON.stringify(o))}
function real(){return LT.ehReal()}
function L(){var S=Q.ST()[0];if(!S.leg)S.leg=real()?LT.legInicial():copia(PADRAO);return LT.migrar(S.leg)}   /* D-135/D-136: dados antigos viram os novos ao ler */
function T(){var s=Q.S();return s.txt===null||s.txt===undefined?(LT.ehReal()?'':['Dias de sol','Nós dois','Dia de rolê','Meu parceiro'][(Q.src(Q.cur())-1)%4]):s.txt}   /* projeto real: sem texto de exemplo */
function getp(o,k){if(k.indexOf('ln.')===0)return estLn()[k.slice(3)];return k.split('.').reduce(function(a,b){return a==null?a:a[b]},o)}
function setp(o,k,v){if(k.indexOf('ln.')===0){setLn(k.slice(3),v);return}var a=k.split('.');a.slice(0,-1).forEach(function(x){if(o[x]==null)o[x]={};o=o[x]});o[a[a.length-1]]=v}
function getv(o,k){var v=getp(o,k);return v==null?defv(k):v}
function val(k){return getv(L(),k)}
function defv(k){if(k==='ln.pt')return 8;if(k.indexOf('ln.')===0)return undefined;return k.indexOf('av.')===0?LT.AV0[k.slice(3)]:DEFL[k]!==undefined?DEFL[k]:getp(PADRAO,k)}
/* ---------- D-149 · modelo de 2 linhas (projeto real) ---------- */
UI.alvo='a';                                   /* a quem o estilo vale: '0' Linha 1 · '1' Linha 2 · 'a' Ambas */
function alvosLn(){return UI.alvo==='0'?[0]:UI.alvo==='1'?[1]:[0,1]}
function estLn(){var c=LT.comPadrao(L(),Q.S()),o=UI.alvo==='1'?c.loc:c.data;return{font:o.font,pt:o.pt,cor:o.cor,b:!!o.b,it:!!o.it}}   /* estilo mostrado: o da primeira linha-alvo */
function setLn(k,v){
  var pd=L().pad;if(!pd)return;
  alvosLn().forEach(function(i){var ln=pd.l[i];if(!ln)return;if(v===undefined||v===false)delete ln[k];else ln[k]=v})
}
function stF(o){var f=LT.famLG(o.font,o);return';font-style:'+(f.i?'italic':'normal')+';font-weight:'+f.w}
function fam(nome){return nome==='IBM Plex Mono'?"'IBM Plex Mono',ui-monospace,monospace":fonte(nome).css}
function caixa(t,c){return c==='maiusc'?t.toUpperCase():c==='cap'?t.replace(/(^|\s)(\S)/g,function(m,a,b){return a+b.toUpperCase()}):t}
function localTxt(l,c){return LT.localLG(l,c==null?LOCAL.cidade:c)}   /* MT-02: uma conta só (a do PDF e a das Folhas) */
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
  var l=LT.ajustarCorpo(LT.comPadrao(L(),Q.S()),Q.FR,LT.larguraTela),   /* D-192 */
      pq=$('pq'),top=$('cap-top'),band=$('cap-band'),meta=$('cap-meta'),cap=$('cap');
  var orig=!!l.original,al=l.al||'esq';
  top.hidden=orig;band.hidden=orig;
  [].slice.call(pq.querySelectorAll('.lg-xl')).forEach(function(n){n.parentNode.removeChild(n)}); /* sai antes: o .lg-lc do fluxo continua achável */
  pq.setAttribute('data-preset',l.preset);
  pq.style.setProperty('--al',ALCSS[al]);pq.style.setProperty('--jc',JC[al]);   /* D-136: alinhamento da faixa */
  pq.style.setProperty('--dy',l.dy);pq.style.setProperty('--inc',l.inc+'deg');
  var sigE=pq.querySelector('.pq__sig');
  if(sigE){var sp=LT.assinaturaPos(l,Q.FR);sigE.classList.toggle('pq__sig--dir',sp==='dir');sigE.classList.toggle('pq__sig--centro',sp==='centro')} /* D-129/D-136 */
  if(orig){                              /* D-135: só a foto e a moldura; nada é apagado */
    if(top)top.innerHTML='';if(cap)cap.innerHTML='';if(meta)meta.innerHTML='';return
  }
  if(!l.txt)return;
  var cor=function(k){return COR[l[k].cor]||'#000'};
  var M=Q.meta?Q.meta(Q.cur()):{data:DATA,cidade:LOCAL.cidade,iso:'2026-07-14T08:00'};
  var dt=l._pad?l._dt:(l.data.on&&M.data?LT.cxMeta(l,FMT[l.data.fmt][1](M.data)):''),lc=l._pad?l._lc:(l.loc.on&&M.cidade?LT.cxMeta(l,localTxt(l.loc,M.cidade)):'');   /* D-139: padrão de 2 linhas */
  var txt=l.txt.on?caixa(T(),l.txt.caixa):'';
  var junto=(l.meta||'junto')!=='linhas',ordem=l.ordem||'data-loc',letras=(l.medida==='letras'||!!l._pad)&&!!(dt||lc);   /* D-192: projeto real sempre nas posições de PLTEXTO.linhas */
  var fe=LT.famLG(l.txt.font,l.txt),espM=function(o){return o.esp!=null?';letter-spacing:'+o.esp+'em':''};   /* D-148 */
  var capHTML=txt?'<span class="lg-txt" id="lg-txt" style="font-family:'+fam(l.txt.font)+';font-style:'+(fe.i?'italic':'normal')+';font-weight:'+fe.w+';--pt:'+l.txt.pt+';letter-spacing:'+l.txt.esp+'em;color:'+cor('txt')+'"></span>':'';
  var dtH=dt?'<time class="lg-dt" datetime="'+M.iso.slice(0,10)+'" style="font-family:'+fam(l.data.font)+stF(l.data)+';--pt:'+l.data.pt+';color:'+cor('data')+espM(l.data)+'"></time>':'';
  var lcH=lc?'<span class="lg-lc" style="font-family:'+fam(l.loc.font)+stF(l.loc)+';--pt:'+l.loc.pt+';color:'+cor('loc')+espM(l.loc)+'">'+(l.preset==='pin'?'<svg class="ico lg-pin"><use href="#i-pin"/></svg>':'')+'</span>':'';
  var sepH=(dt&&lc)?'<span class="lg-sep" aria-hidden="true">'+LT.sepMeta(l)+'</span>':'';
  var metaHTML=junto?(ordem==='loc-data'?lcH+sepH+dtH:dtH+sepH+lcH)
   :'<span class="lg-ms">'+(ordem==='loc-data'?[lcH,dtH]:[dtH,lcH]).filter(Boolean).map(function(r){return'<span class="lg-m">'+r+'</span>'}).join('')+'</span>';
  /* D-136: o texto é sempre abaixo da foto; a faixa de cima fica vazia */
  top.innerHTML='';
  cap.outerHTML='<span class="pq__cap" id="cap">'+capHTML+'</span>';
  meta.innerHTML=letras?'':metaHTML;   /* letras: o fluxo fica vazio (só as absolutas do .lg-xl contam, senão o fora() lê rects zerados) */
  meta.hidden=!metaHTML||letras;
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
      var sX=(dt&&lc)?'<span class="lg-sep" aria-hidden="true" style="'+estXL({font:'IBM Plex Mono',pt:Math.max(l.data.pt,l.loc.pt),cor:'preto'},';line-height:0')+'">'+LT.sepMeta(l)+'</span>':'';
      /* D-179 · MT-02: o bloco é absoluto em relação à moldura inteira (canto externo), então leva o topo e a lateral da moldura;
         sem isso a tela ficava 3 mm acima e à esquerda do PDF no Pocket */
      var xl='<div class="lg-xl" style="top:calc(var(--pmm)*'+num(figTop)+');left:calc(var(--pmm)*'+num(fr.cl||0)+');width:calc(var(--pmm)*'+num(fr.cjw||0)+');height:calc(var(--pmm)*'+num(figH)+')">';
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
/* ---------- D-186: Fonte em lista suspensa, com Itálico e Negrito ao lado ----------
   Lista: busca; Todas · Favoritas · Recentes · Itálico e negrito; grupos por categoria; coração para favoritar; I e N mostram
   as variantes reais da família. Favoritas e recentes ficam no aparelho (pl-fontes) e valem em todos os projetos.
   Os dois botões ficam sempre à vista, ao lado da fonte; sem a variante real, ficam desabilitados e o texto explica. */
var PREF=(function(){try{var o=JSON.parse(localStorage.getItem('pl-fontes')||'null');if(o&&Array.isArray(o.fav)&&Array.isArray(o.rec))return o}catch(e){}return{fav:['Fondamento Itálico','Caveat'],rec:[]}})();
function guardaPref(){try{localStorage.setItem('pl-fontes',JSON.stringify(PREF))}catch(e){}}
function escH(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fontePor(n){return FONTES.filter(function(x){return x.n===n})[0]||null}
function varDe(x){var v=LT.VAR[x.fam]||['400'];return{it:x.it||v.some(function(y){return/i$/.test(y)}),b:v.indexOf('700')>=0||v.indexOf('700i')>=0}}
function ambos(x){var v=varDe(x);return v.it&&v.b}
var FCATS=[['todas','Todas'],['fav','Favoritas'],['rec','Recentes'],['in','Itálico e negrito']];
function itemFonte(x,atual,amo){
  var on=x.n===atual,fv=PREF.fav.indexOf(x.n)>=0,v=varDe(x);
  return'<li class="fitem'+(on?' is-on':'')+'"><button type="button" class="fitem__b" data-pick="'+x.n+'" aria-pressed="'+on+'"><span class="fitem__s" style="font-family:'+x.css+';font-style:'+(x.it?'italic':'normal')+';font-weight:'+x.w+'">'+escH(amo)+'</span>'
   +'<span class="fitem__n"><span class="rotulo">'+x.n+'</span>'+(v.it?'<span class="fvar fvar--i" title="Tem itálico">I</span>':'')+(v.b?'<span class="fvar fvar--b" title="Tem negrito">N</span>':'')+'</span></button>'
   +'<button type="button" class="ib" data-fav="'+x.n+'" aria-pressed="'+fv+'" aria-label="'+(fv?'Tirar de':'Pôr em')+' favoritas: '+x.n+'"><svg class="ico sm"><use href="#i-heart"/></svg></button></li>'
}
function listaFontes(atual,amo){
  var q=UI.busca.toLowerCase(),cat=UI.cat,gr=[],vistas=[];
  function passa(x){return!!x&&x.n.toLowerCase().indexOf(q)>=0}
  if(cat==='fav')gr.push(['Favoritas',PREF.fav.map(fontePor).filter(passa)]);
  else if(cat==='rec')gr.push(['Recentes',PREF.rec.map(fontePor).filter(passa)]);
  else if(cat==='in')gr.push(['Com itálico e negrito',FONTES.filter(function(x){return ambos(x)&&passa(x)})]);
  else{if(!q){if(PREF.rec.length)gr.push(['Recentes',PREF.rec.map(fontePor).filter(Boolean)]);if(PREF.fav.length)gr.push(['Favoritas',PREF.fav.map(fontePor).filter(Boolean)])}
    Object.keys(CAT).forEach(function(c){gr.push([CAT[c],FONTES.filter(function(x){return x.c===c&&passa(x)})])})}
  gr=gr.filter(function(g){return g[1].length});
  gr.forEach(function(g){vistas=vistas.concat(g[1])});carregar(vistas);
  var vazio=cat==='fav'?'Nenhuma favorita ainda. Toque no coração de uma fonte para guardá-la aqui.':cat==='rec'?'As fontes que você usar aparecem aqui.':'Nenhuma fonte encontrada. Limpe a busca ou escolha outro filtro.';
  return'<div class="fpick" id="fpick"><label class="fbusca"><svg class="ico sm"><use href="#i-search"/></svg><input type="search" id="fbusca" placeholder="Buscar fonte" aria-label="Buscar fonte por nome" value="'+escH(UI.busca)+'" autocomplete="off"></label>'
   +'<div class="fcats" role="tablist" aria-label="Mostrar">'+FCATS.map(function(c){return'<button type="button" role="tab" class="fcat rotulo" data-fcat="'+c[0]+'" aria-selected="'+(cat===c[0])+'">'+c[1]+'</button>'}).join('')+'</div>'
   +'<ul class="flist" aria-label="Fontes">'+(gr.length?gr.map(function(g){return'<li class="fgrp rotulo" aria-hidden="true">'+g[0]+'</li>'+g[1].map(function(x){return itemFonte(x,atual,amo)}).join('')}).join(''):'<li class="f__h">'+vazio+'</li>')+'</ul>'
   +'<p class="f__h">I = tem itálico · N = tem negrito. Se uma fonte não carregar, entra a padrão da categoria e a revisão de impressão avisa.</p></div>'
}
var ICO_IT='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5h8M6 19h8M14.5 5l-5 14"/></svg>',
    ICO_N='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" style="stroke-width:3"><path d="M7 19V5l10 14V5"/></svg>';
function botoesEst(x){
  function bt(k,rot,ic,y){return'<button type="button" class="est-ico" data-est="'+k+'" aria-pressed="'+y.on+'"'+(y.ok?'':' disabled')+'>'+ic+'<span class="est-ico__t">'+rot+'</span></button>'}
  return'<div class="fdd__est" id="f-est" role="group" aria-label="Estilo do texto">'+bt('it','Itálico',ICO_IT,x.it)+bt('b','Negrito',ICO_N,x.b)+'</div>'
}
function msgEst(x,fm){var m=[];if(x.it.natural)m.push('Esta fonte já é itálica.');else if(!x.it.ok)m.push(fm+' não tem itálico'+(x.b.on?' em negrito':'')+'.');if(!x.b.ok&&!x.b.on)m.push(fm+' não tem negrito'+(x.it.on?' em itálico':'')+'.');return m.join(' ')||'Itálico e negrito usam as variantes reais da fonte.'}
/* campo «Fonte»: [lista suspensa] [Itálico] [Negrito]; o = estilo da linha (com b e it) ou null quando a linha não tem os botões */
function campoFonte(k,atual,o,amo,extra){
  var abre=UI.sel===k,fe=LT.famLG(atual,o||{}),x=o?LT.estilosDe(atual,o):null,ft=fontePor(atual),fm=ft?ft.fam:atual;
  return'<div class="f fdd"><div class="f__top"><span class="f__l" id="l-f-'+k+'">Fonte'+(x?' e estilo':'')+'</span>'+(extra||'')+'</div>'
   +'<div class="fdd__row"><button type="button" class="fsel" data-fsel="'+k+'" aria-haspopup="true" aria-expanded="'+abre+'" aria-labelledby="l-f-'+k+' fv-'+k+'"><span id="fv-'+k+'" class="fsel__s" style="font-family:'+fam(atual)+';font-style:'+(fe.i?'italic':'normal')+';font-weight:'+fe.w+'">'+escH(amo)+'</span><span class="rotulo fsel__n">'+atual+'</span><svg class="ico sm"><use href="#i-down"/></svg></button>'
   +(x?botoesEst(x):'')+'</div>'
   +(x?'<p class="f__h" id="lg-est-h">'+msgEst(x,fm)+'</p>':'')
   +(abre?listaFontes(atual,amo):'')+'</div>'
}
function seletor(k){var l=L()[k];return campoFonte(k,l.font,k==='txt'?l:null,amostra(k),rst(k+'.font'))}
function sw(k,rot,on,off){return'<div class="sw-row"><div><span class="f__l" id="s-'+k+'">'+rot+'</span></div><button type="button" class="sw" data-sw="'+k+'" role="switch" aria-checked="'+on+'"'+(off?' aria-disabled="true"':'')+' aria-labelledby="s-'+k+'"><span></span></button></div>'}
/* ---------- D-139 · Avançado: padrão de 2 linhas, sugestões e exceção por foto ---------- */
var TIPOS=[['loc','Localização'],['data','Data'],['pt','Ponto turístico'],['txt','Texto livre'],['nenhum','Nenhum']],TAMS=[[7,'P'],[8,'M'],[10,'G'],[12,'GG']];
function sugOn(){return L().sug!==false&&!L().original}
function padAlvo(){return real()?(L().pad||LT.padNovo()):(Q.S().pad||L().pad||LT.padNovo())}
function tipoNome(t){return TIPOS.filter(function(x){return x[0]===t})[0][1]}
function ajustesAv(l,on){                       /* D-148: tudo que não se repete em outras seções */
  var a=LT.av(l),h='<div class="mod__sub" id="lg-av-aj">'
   +sld('inc','Inclinação do texto','°',-8,8,1,0,'De −8° a +8°, de 1 em 1°. Gira o bloco de texto sob a foto.');
  if(on){
    h+='<div class="f"><div class="f__top"><label class="f__l" for="av-df">Formato da data</label>'+rst('av.df')+'</div><div class="num num--l"><select id="av-df" data-av="df">'+LT.DATA_AV.map(function(x){return'<option value="'+x[0]+'"'+(a.df===x[0]?' selected':'')+'>'+x[1]+'</option>'}).join('')+'</select></div><p class="f__h">Vale para as datas sugeridas; o que você digitou não muda.</p></div>'
     +'<div class="f"><div class="f__top"><label class="f__l" for="av-lf">Formato da localização</label>'+rst('av.lf')+'</div><div class="num num--l"><select id="av-lf" data-av="lf">'+LT.LOC_AV.map(function(x){return'<option value="'+x[0]+'"'+(a.lf===x[0]?' selected':'')+'>'+x[1]+'</option>'}).join('')+'</select></div><p class="f__h">Vale para as localizações sugeridas; o que você digitou não muda.</p></div>'
  }else h+='<p class="f__h">O formato da data e o da localização aparecem aqui com o padrão de 2 linhas; sem ele, a data se escolhe na seção Data.</p>';
  h+=seg('avcx','Caixa de data e local',[['normal','Normal'],['maiusc','MAIÚSCULAS']],a.cx,'av.cx')
   +sld('av.esp','Espaçamento entre letras (data e local)','em',0,0.2,0.01,2,'De 0 a 0,2 em.');
  return h+'</div>'
}
function avancado(l,dis){
  var on=!!(l.pad&&l.pad.on),h='<section class="mod mod--av" aria-labelledby="lmav"'+dis+'><h3 class="mod__h rotulo rotulo--m" id="lmav">Avançado</h3>'
   +'<button type="button" class="btn2 btn2--sm" id="lg-av-t" aria-expanded="'+(!!UI.aberto.av)+'" aria-controls="lg-av">'+(UI.aberto.av?'Recolher':'Configurações avançadas')+'</button>'
   +'<div id="lg-av"'+(UI.aberto.av?'':' hidden')+'>'
   +ajustesAv(l,on)
   +(window.PLMET?PLMET.html():'')
   +sw('padon','Padrão de 2 linhas',on)
   +'<p class="f__h">Cada linha mostra localização («Itacaré - BA»), data («23/11/26»), ponto turístico, texto livre ou nada.</p>';
  if(on){
    var pd=padAlvo();
    for(var i=0;i<2;i++){
      var ln=LT.padLinha(pd.l[i]);
      h+='<div class="f pad-l" data-pl="'+i+'"><div class="f__top"><label class="f__l" for="pad-t-'+i+'">Legenda '+(i+1)+'</label></div>'
       +'<div class="num num--l"><select id="pad-t-'+i+'" data-padt="'+i+'">'+TIPOS.map(function(t){return'<option value="'+t[0]+'"'+(t[0]===ln.t?' selected':'')+'>'+t[1]+'</option>'}).join('')+'</select></div>'
       +'<div class="seg" role="radiogroup" aria-label="Tamanho da legenda '+(i+1)+'">'+TAMS.map(function(t){return'<label class="seg__o"><input type="radio" name="pad-p-'+i+'" value="'+t[0]+'" data-padp="'+i+'"'+(t[0]===ln.pt?' checked':'')+'><span>'+t[1]+'</span></label>'}).join('')+'</div>'
       +'<div class="num lg-num"><input id="pl-in-'+i+'" maxlength="60" autocomplete="off" list="pl-dl-'+i+'" aria-label="Texto da legenda '+(i+1)+' desta foto" style="text-align:left;padding-left:12px"><datalist id="pl-dl-'+i+'"></datalist></div>'
       +'<button type="button" class="lk" data-restaurar="'+i+'" hidden>Restaurar sugestão</button></div>'
    }
    h+='<label class="chk"><input type="checkbox" id="pad-own"'+(Q.S().pad?' checked':'')+'><span class="chk__b" aria-hidden="true"><svg class="ico"><use href="#i-check"/></svg></span><span><strong>Padrão próprio para esta foto</strong><span class="f__h">As outras fotos não mudam.</span></span></label>'
     +'<button type="button" class="btn2" id="pad-todas">Aplicar a todas</button>'
     +'<p class="f__h">Textos que você escreveu à mão nunca são trocados ao reaplicar.</p>'
  }
  return h+'</div></section>'
}
function sincPad(){
  var l=L(),on=!!(l.pad&&l.pad.on);if(!on||!$('pl-in-0'))return;
  var pd=padAlvo(),pl=Q.S().pl||[];
  for(var i=0;i<2;i++){
    var ln=LT.padLinha(pd.l[i]),p=pl[i]||{v:'',m:false},inp=$('pl-in-'+i),b=document.querySelector('[data-restaurar="'+i+'"]');
    $('pad-t-'+i).value=ln.t;
    [].forEach.call(document.querySelectorAll('input[name="pad-p-'+i+'"]'),function(r){r.checked=+r.value===ln.pt});
    inp.disabled=ln.t==='nenhum';if(document.activeElement!==inp)inp.value=ln.t==='nenhum'?'':p.v;
    b.hidden=!(sugOn()&&p.m&&(ln.t==='loc'||ln.t==='data'||ln.t==='pt'))
  }
  if($('pad-own'))$('pad-own').checked=!!Q.S().pad
}
/* D-178: o lugar do GPS vem de PLFOTOS.lugar (calculado uma vez e guardado na foto): Quadro, Folhas e PDF mostram o mesmo.
   Fica também em ST[n].meta.lugar, para a seção «Data e cidade desta foto» saber que há um local lido da foto. */
function lugarDe(n){
  var e=Q.ST()[n],m=e&&e.meta,k=Q.src(n);
  if(m&&m.lugar)return Promise.resolve(m.lugar);
  if(!Q.real||!window.PLFOTOS||!PLFOTOS.lugar)return Promise.resolve(null);
  return PLFOTOS.lugar(k).then(function(g){var e2=Q.ST()[n];if(g&&e2&&e2.src===k&&e2.meta&&!e2.meta.lugar)e2.meta.lugar=g;return g},function(){return null})
}
function sugestao(n,t){
  var M=Q.meta(n),PL=window.PLLOCAIS;
  if(t==='data')return Promise.resolve(M.data?LT.FMTD[LT.av(L()).df](M.data):'');
  if((t==='loc'||t==='pt')&&M.cs==='sem')return Promise.resolve('');   /* «Sem local» nesta foto */
  if(t==='loc'){
    var c=(M.cidade||'').trim();
    if(c)return!PL?Promise.resolve(c):PL.buscar(c,40).then(function(r){var q=PL.norm(c.replace(/\s*[-,\/]\s*[A-Za-z]{2}$/,'')),ex=r.filter(function(x){return PL.norm(x.cidade)===q});return ex.length===1?LT.fmtLocal(ex[0],LT.av(L()).lf):c});
    return lugarDe(n).then(function(g){return LT.lugarTxt(g,L())})
  }
  if(t==='pt')return lugarDe(n).then(function(g){return g&&g.ponto||''});
  return Promise.resolve('')
}
/* preenche as linhas ainda não digitadas à mão (m=false); com «Sugestões de legendas» desligado não mexe em nada */
function preencher(ns,so){
  var S=Q.ST(),pad=L().pad;
  if(!sugOn()||!pad||!pad.on)return Promise.resolve();
  return Promise.all(ns.map(function(n){
    var e=S[n],pd=e.pad||pad;
    return Promise.all([0,1].map(function(i){
      if(so!=null&&so!==i)return null;
      var tp=LT.padLinha(pd.l[i]).t,p=e.pl&&e.pl[i];
      if(p&&p.m)return null;
      return(tp==='loc'||tp==='data'||tp==='pt'?sugestao(n,tp):Promise.resolve('')).then(function(v){return[i,v]})
    })).then(function(rs){rs.forEach(function(r){if(!r)return;e.pl=e.pl||[{v:'',m:false},{v:'',m:false}];e.pl[r[0]]={v:r[1],m:false}})})
  }))
}
function todasFotos(){var a=[],j;for(j=1;j<=Q.N;j++)a.push(j);return a}
function afetadas(){var S=Q.ST(),a=[],j;if(real())return todasFotos();if(Q.S().pad)return[Q.cur()];for(j=1;j<=Q.N;j++)if(!S[j].pad)a.push(j);return a}
function depois(p,k){p.then(function(){Q.commit(k);sincPad()})}
function acaoPad(e){
  var t=e.target,l=L();
  if(t.hasAttribute('data-av')){var ka=t.getAttribute('data-av');setp(l,'av.'+ka,ka==='df'?+t.value:t.value);Q.commit('lg:av');depois(preencher(todasFotos()),'lg:av2');return true}   /* D-148: reaplica só nas linhas não digitadas */
  if(t.hasAttribute('data-padt')){var i=+t.getAttribute('data-padt'),pd=padAlvo();pd.l[i].t=t.value;
    if(real())Q.ST().slice(1).forEach(function(e){if(e.pl&&e.pl[i])e.pl[i]={v:'',m:false}});   /* D-149: o texto à mão pertencia ao tipo antigo */
    Q.commit('lg:padt');depois(preencher(afetadas(),i),'lg:padt2');return true}
  if(t.hasAttribute('data-padp')){padAlvo().l[+t.getAttribute('data-padp')].pt=+t.value;Q.commit('lg:padp');return true}
  if(t.id==='pad-own'){var e1=Q.S();if(t.checked)e1.pad=copia({on:true,l:L().pad.l});else delete e1.pad;Q.commit('lg:padown');montar();depois(preencher([Q.cur()]),'lg:padown2');return true}
  return false
}
/* ---------- painel do projeto real ---------- */
function topoPainel(l){
  return'<section class="mod mod--orig" aria-labelledby="lm0"><h3 class="mod__h rotulo rotulo--m" id="lm0">Legendas</h3>'
   +sw('original','Sem legendas',!!l.original)
   +sw('sug','Sugestões de legendas',l.sug!==false,!!l.original)
   +(l.original?'<div class="msg msg--warn lg__aviso"><svg class="ico"><use href="#i-warn"/></svg><div class="msg__body"><p>Desligue «Sem legendas» para editar.</p></div></div>':'')
   +'</section>'
}
function secLinhas(l,dis){
  var pd=l.pad,h='<section class="mod" aria-labelledby="lm-lin"'+dis+'><h3 class="mod__h rotulo rotulo--m" id="lm-lin">Textos</h3><div class="lg-col" id="lg-lin">';
  for(var i=0;i<2;i++){
    var ln=LT.padLinha(pd.l[i]);
    h+='<div class="f pad-l" data-pl="'+i+'"><div class="f__top"><label class="f__l" for="pad-t-'+i+'">Legenda '+(i+1)+'</label><button type="button" class="lk" data-restaurar="'+i+'" hidden>Restaurar sugestão</button></div>'
     +'<div class="lg-ln"><div class="num num--l"><select id="pad-t-'+i+'" data-padt="'+i+'" aria-label="Tipo da legenda '+(i+1)+'">'+TIPOS.map(function(t){return'<option value="'+t[0]+'"'+(t[0]===ln.t?' selected':'')+'>'+t[1]+'</option>'}).join('')+'</select></div>'
     +'<div class="num lg-num"><input id="pl-in-'+i+'" maxlength="60" autocomplete="off" list="pl-dl-'+i+'" aria-label="Texto da legenda '+(i+1)+' desta foto" style="text-align:left;padding-left:12px"><datalist id="pl-dl-'+i+'"></datalist></div></div></div>'
  }
  return h+'</div></section>'
}
function seletorLn(){var e=estLn(),amo=(function(){var c=LT.comPadrao(L(),Q.S());return(c._dt||c._lc||'Itacaré - BA')})();return campoFonte('ln',e.font,e,amo)}
function secEstilo(l,dis){
  var e=estLn();
  return'<section class="mod" aria-labelledby="lm-est"'+dis+'><h3 class="mod__h rotulo rotulo--m" id="lm-est">Estilo</h3>'
   +'<div class="f"><div class="seg seg--3" role="radiogroup" aria-label="Aplicar o estilo a">'
   +[['0','Legenda 1'],['1','Legenda 2'],['a','Ambas']].map(function(o){return'<label class="seg__o"><input type="radio" name="alvo" value="'+o[0]+'"'+(UI.alvo===o[0]?' checked':'')+'><span>'+o[1]+'</span></label>'}).join('')+'</div></div>'
   +seletorLn()
   +sld('ln.pt','Tamanho','pt',6,32,1,0,'')
   +cores('ln',e.cor)+'</section>'
}
function secPosicao(l,dis){
  return'<section class="mod" aria-labelledby="lm5"'+dis+'><h3 class="mod__h rotulo rotulo--m" id="lm5">Posição</h3>'
   +seg('al','Alinhamento',[['esq','Esquerda'],['centro','Centro'],['dir','Direita']],l.al||'esq','al')
   +sld('dy','Deslocar para baixo','mm',0,5,0.1,1,'A legenda começa 3 mm abaixo da foto; daqui ela só desce.')+'</section>'
}
function secPresets(l,dis){
  return'<section class="mod" aria-labelledby="lm6"'+dis+'><h3 class="mod__h rotulo rotulo--m" id="lm6">Estilos prontos</h3><div class="presets" role="radiogroup" aria-label="Estilos prontos">'
   +Object.keys(PRESETS).map(function(k){return'<label class="preset"><input type="radio" name="preset" value="'+k+'"'+(l.preset===k?' checked':'')+'><span>'+PRESETS[k].t+'</span></label>'}).join('')+'</div></section>'
}
function secAvancado(l,dis){
  var a=LT.av(l),jt=(l.meta||'linhas')!=='linhas',ab=!!UI.aberto.av;
  var h='<section class="mod mod--av" aria-labelledby="lmav"'+dis+'><h3 class="mod__h rotulo rotulo--m" id="lmav">Avançado</h3>'
   +'<button type="button" class="btn2 btn2--sm" id="lg-av-t" aria-expanded="'+ab+'" aria-controls="lg-av">'+(ab?'Recolher':'Configurações avançadas')+'</button>'
   +'<div class="lg-col" id="lg-av"'+(ab?'':' hidden')+'>'
   +sld('inc','Inclinação do texto','°',-8,8,1,0,'')
   +'<div class="f"><div class="f__top"><label class="f__l" for="av-df">Formato da data</label>'+rst('av.df')+'</div><div class="num num--l"><select id="av-df" data-av="df">'+LT.DATA_AV.map(function(x){return'<option value="'+x[0]+'"'+(a.df===x[0]?' selected':'')+'>'+x[1]+'</option>'}).join('')+'</select></div></div>'
   +'<div class="f"><div class="f__top"><label class="f__l" for="av-lf">Formato da localização</label>'+rst('av.lf')+'</div><div class="num num--l"><select id="av-lf" data-av="lf">'+LT.LOC_AV.map(function(x){return'<option value="'+x[0]+'"'+(a.lf===x[0]?' selected':'')+'>'+x[1]+'</option>'}).join('')+'</select></div></div>'
   +seg('avcx','Caixa',[['normal','Normal'],['maiusc','MAIÚSCULAS']],a.cx,'av.cx')
   +sld('av.esp','Espaçamento entre letras','em',0,0.2,0.01,2,'')
   +seg('lmeta','Duas linhas',[['linhas','Separadas'],['junto','Na mesma linha']],l.meta||'linhas','meta')
   +(jt?seg('avsep','Separador',[['•','•'],['·','·'],['–','–'],['/','/']],a.sep,'av.sep'):'')
   +seg('lordem','Ordem',[['data-loc','Legenda 1 primeiro'],['loc-data','Legenda 2 primeiro']],l.ordem||'data-loc','ordem')
   +seg('lmedida','Medir espaços por',[['caixa','Caixa do texto'],['letras','Topo das letras']],l.medida||'caixa','medida')
   +(window.PLMET?PLMET.html():'')
   +'</div></section>';
  return h
}
function montarReal(){
  var l=L(),dis=l.original?' aria-disabled="true"':'',h=topoPainel(l);
  h+='<div class="lg__rest'+(l.original?' is-off':'')+'" id="lg-rest">'+secLinhas(l,dis)+secEstilo(l,dis)+secPosicao(l,dis)+secPresets(l,dis)+secAvancado(l,dis)+'</div>';
  h+='<div id="lg-fora" class="msg msg--warn" hidden><svg class="ico"><use href="#i-warn"/></svg><div class="msg__body"><p>A legenda passa da área segura e bloqueia a impressão. Reduza o tamanho ou encurte o texto.</p></div></div>';
  h+='<div class="pe"><button type="button" class="btn2 btn2--lg pe__b" id="lg-rtudo">Resetar legendas</button><button type="button" class="btn2 btn2--lg pe__b" id="lg-apply">Aplicar legendas</button></div>';
  $('p-legendas').innerHTML=h;
  sincronizar()
}
/* migração (projeto real): a legenda antiga vira as 2 linhas equivalentes; o texto livre de cada foto vai para a linha de texto livre */
function iniciarReal(){
  if(!real())return;
  var S=Q.ST(),lg=L();
  if(!(lg.pad&&lg.pad.on)){
    LT.migrarPad(lg,S.slice(1).map(function(e){return e.txt}));
    lg.pad.l.forEach(function(ln,i){if(ln.t==='txt')S.slice(1).forEach(function(e){if(typeof e.txt==='string'&&e.txt){e.pl=e.pl||[{v:'',m:false},{v:'',m:false}];e.pl[i]={v:e.txt,m:true}}})})
  }
  S.slice(1).forEach(function(e){delete e.pad});
  DEFL.meta='linhas'
}
function montar(){if(real())montarReal();else montarEx()}
function montarEx(){
  var l=L(),h='',dis=l.original?' aria-disabled="true"':'',real=LT.ehReal();   /* D-135: com a Polaroid original as outras seções ficam apagadas */
  /* 1 · Polaroid original (D-135): primeiro controle do painel */
  h+='<section class="mod mod--orig" aria-labelledby="lm0"><h3 class="mod__h rotulo rotulo--m" id="lm0">Legendas</h3>'
   +sw('original','Sem legendas',!!l.original)
   +sw('sug','Sugestões de legendas',l.sug!==false,!!l.original)
   +'<p class="f__h" id="lg-sug-est">'+(l.original?'Não se aplica com «Sem legendas» ligado.':l.sug!==false?'Ligado · cidade, data e ponto vêm sugeridos da foto e você pode editar.':'Desligado · você escreve tudo; nada é preenchido sozinho.')+'</p>'
   +'<p class="f__h" id="lg-orig-est">'+(l.original?'Ligado · só a foto e a moldura. Desligue para editar os textos.':'Desligado · textos e stickers visíveis')+'</p>'
   +(l.original?'<div class="msg msg--warn lg__aviso"><svg class="ico"><use href="#i-warn"/></svg><div class="msg__body"><p>Desligue «Sem legendas» para editar.</p></div></div>':'')
   +'</section>';
  h+='<div class="lg__rest'+(l.original?' is-off':'')+'" id="lg-rest">';
  /* 2 · Posição (D-136): o texto é sempre abaixo, alinhado entre as margens da foto */
  h+='<section class="mod" aria-labelledby="lm5"'+dis+'><h3 class="mod__h rotulo rotulo--m" id="lm5">Posição</h3>'
   +seg('al','Alinhamento',[['esq','Esquerda'],['centro','Centro'],['dir','Direita']],l.al||'esq','al','O texto fica entre as mesmas margens laterais da foto.')
   +sld('dy','Deslocar para baixo','mm',0,5,0.1,1,'De 0 a 5 mm: a legenda começa 3 mm abaixo da foto e só desce.')+'</section>';
  /* 3 · Estilos prontos */
  h+='<section class="mod" aria-labelledby="lm6"'+dis+'><h3 class="mod__h rotulo rotulo--m" id="lm6">Estilos prontos <span class="mono" style="float:right">'+Object.keys(PRESETS).length+'</span></h3><div class="presets" role="radiogroup" aria-label="Estilos prontos">'
   +Object.keys(PRESETS).map(function(k){return'<label class="preset"><input type="radio" name="preset" value="'+k+'"'+(l.preset===k?' checked':'')+'><span>'+PRESETS[k].t+'</span></label>'}).join('')+'</div></section>';
  /* 4 · Texto livre */
  h+='<section class="mod" aria-labelledby="lm1"'+dis+'><h3 class="mod__h rotulo rotulo--m" id="lm1">Texto livre</h3>'+sw('txt.on','Mostrar texto livre',l.txt.on)
   +'<div class="f" id="f-texto"><div class="f__top"><label class="f__l" for="lg-in">Texto desta foto</label><span class="mono f__h" id="lg-cnt">0/80</span></div><div class="num lg-num"><input id="lg-in" maxlength="80" autocomplete="off" style="text-align:left;padding-left:12px"></div><p class="f__h" id="lg-h">Até 80 caracteres.</p><div id="lg-conf" hidden></div></div>'
   +seletor('txt')
   +sld('txt.pt','Tamanho','pt',8,32,1,0,'De 8 a 32 pt.')
   +'<label class="chk"><input type="checkbox" data-chk="txt.fit"'+(l.txt.fit?' checked':'')+'><span class="chk__b" aria-hidden="true"><svg class="ico"><use href="#i-check"/></svg></span><span><strong>Ajustar para caber</strong><span class="f__h">Reduz o tamanho até o texto caber na área segura.</span></span></label>'
   +seg('caixa','Caixa',[['normal','Normal'],['maiusc','Maiúsc.'],['cap','Capitalizada']],l.txt.caixa,'txt.caixa')
   +sld('txt.esp','Espaçamento','em',-0.05,0.3,0.01,2,'De −0,05 a 0,3 em.')
   +cores('txt',l.txt.cor)+'</section>';
  var hs=h;
  h+='<section class="mod" aria-labelledby="lm2"'+dis+'><h3 class="mod__h rotulo rotulo--m" id="lm2">Data</h3>'+sw('data.on','Mostrar data',l.data.on)
   +'<div class="f"><div class="f__top"><span class="f__l" id="l-fmt">Formato</span>'+rst('data.fmt')+'</div><div class="fmts" role="radiogroup" aria-labelledby="l-fmt">'+FMT.map(function(f,i){return'<label class="preset preset--s"><input type="radio" name="fmt" value="'+i+'"'+(l.data.fmt===i?' checked':'')+'><span>'+f[1](DATA)+'</span></label>'}).join('')+'</div><p class="f__h">Origem: data da foto. Sem data, a legenda não mostra data.</p></div>'
   +seletor('data')
   +sld('data.pt','Tamanho','pt',8,32,1,0,'De 8 a 32 pt.')+cores('data',l.data.cor)+'</section>';
  h+='<section class="mod" aria-labelledby="lm3"'+dis+'><h3 class="mod__h rotulo rotulo--m" id="lm3">Local</h3>'+sw('loc.on','Mostrar local',l.loc.on)
   +(real?'<p class="f__h">Escreva a cidade como quer ver na legenda (ex.: Recife, PE) em Configurações avançadas, mais abaixo.</p>':'<p class="f__h">Cidade, nunca coordenadas. A cidade é lida no aparelho.</p>')
   +(real?'':seg('uf','Estado',[['sigla','Sigla'],['nome','Nome'],['oculto','Oculto']],l.loc.uf,'loc.uf'))
   +(real?'':seg('pais','País',[['oculto','Oculto'],['nome','Nome'],['cod','Código']],l.loc.pais,'loc.pais'))
   +seg('sep','Separador',[[', ','Vírgula'],['·','Ponto'],['–','Traço'],['/','Barra'],[' - ','Hífen']],l.loc.sep,'loc.sep')
   +(real?'':seg('ordem','Ordem',[['cidade','Cidade, Estado'],['estado','Estado, Cidade']],l.loc.ordem,'loc.ordem'))
   +seletor('loc')
   +sld('loc.pt','Tamanho','pt',8,32,1,0,'De 8 a 32 pt.')+cores('loc',l.loc.cor)+'</section>';
  h+='<section class="mod" aria-labelledby="lm4"'+dis+'><h3 class="mod__h rotulo rotulo--m" id="lm4">Linhas</h3>' /* D-113 */
   +seg('lmeta','Data e local',[['junto','Na mesma linha'],['linhas','Em linhas separadas']],val('meta'),'meta')
   +seg('lordem','Ordem',[['data-loc','Data primeiro'],['loc-data','Local primeiro']],val('ordem'),'ordem')
   +seg('lmedida','Medir espaços por',[['caixa','Caixa do texto'],['letras','Topo das letras']],val('medida'),'medida','Com «topo das letras», a primeira maiúscula fica a 4 mm da foto e a segunda linha, 2 mm abaixo da base da primeira.')
   +'</section>';
  if(l.pad&&l.pad.on)h=hs;                /* D-139: o padrão de 2 linhas assume Data, Local e Linhas (sem controle repetido) */
  h+=avancado(l,dis);
  h+='</div>';
  h+='<div id="lg-fora" class="msg msg--warn" hidden><svg class="ico"><use href="#i-warn"/></svg><div class="msg__body"><p>A legenda passa da área segura e bloqueia a impressão. Reduza o tamanho, encurte o texto ou use «Ajustar para caber».</p><div class="qmsg__act"><button type="button" class="btn2 btn2--sm" data-lfit>Ajustar para caber</button></div></div></div>';
  h+='<div class="pe"><button type="button" class="btn2 btn2--lg pe__b" id="lg-rtudo">Resetar legendas</button><button type="button" class="btn2 btn2--lg pe__b" id="lg-apply">Aplicar legendas</button></div>';
  $('p-legendas').innerHTML=h;
  $('lg-in').value=T();
  sincronizar()
}
function sincronizar(){
  var l=L();
  [].forEach.call(document.querySelectorAll('[data-lk]'),function(f){
    var k=f.getAttribute('data-lk'),v=getp(l,k),r=$('r-'+k),n=$('n-'+k),dec=(k==='txt.esp'||k==='av.esp'?2:k.indexOf('pt')>0||k==='inc'?0:1);
    if(v==null)v=defv(k);
    r.value=v;if(document.activeElement!==n)n.value=String(dec?Number(v).toFixed(dec):v).replace('.',',');
    f.querySelector('[data-lreset]').hidden=v===defv(k)
  });
  [].forEach.call(document.querySelectorAll('[data-lreset]'),function(b){var k=b.getAttribute('data-lreset');if(b.closest('[data-lk]'))return;
    if(k.indexOf('ln.')===0){var pdl=l.pad;b.hidden=!(pdl&&alvosLn().some(function(i){return pdl.l[i]&&pdl.l[i][k.slice(3)]!==undefined}));return}b.hidden=JSON.stringify(getv(l,k))===JSON.stringify(defv(k))});
  [].forEach.call(document.querySelectorAll('[data-sw]'),function(b){var k=b.getAttribute('data-sw');b.setAttribute('aria-checked',k==='sug'?l.sug!==false:k==='padon'?!!(l.pad&&l.pad.on):getp(l,k));if(k==='sug')b.setAttribute('aria-disabled',l.original?'true':'false')});
  [].forEach.call(document.querySelectorAll('input[data-k]'),function(i){i.checked=String(getv(l,i.getAttribute('data-k')))===i.value});
  [].forEach.call(document.querySelectorAll('input[name=preset]'),function(i){i.checked=i.value===l.preset});
  [].forEach.call(document.querySelectorAll('input[name=fmt]'),function(i){i.checked=+i.value===l.data.fmt});
  [].forEach.call(document.querySelectorAll('[data-chk]'),function(i){i.checked=!!getp(l,i.getAttribute('data-chk'))});
  var inp=$('lg-in');if(inp&&document.activeElement!==inp)inp.value=T();
  if($('lg-cnt'))$('lg-cnt').textContent=(inp?inp.value.length:0)+'/80';
  var oe=$('lg-orig-est');if(oe)oe.textContent=l.original?'Ligado · só a foto e a moldura. Desligue para editar os textos.':(real()?'Desligado · textos visíveis':'Desligado · textos e stickers visíveis');
  var se=$('lg-sug-est');if(se)se.textContent=l.original?'Não se aplica com «Sem legendas» ligado.':l.sug!==false?'Ligado · cidade, data e ponto vêm sugeridos da foto e você pode editar.':'Desligado · você escreve tudo; nada é preenchido sozinho.';
  sincPad();
  [].forEach.call(document.querySelectorAll('[data-av]'),function(e){e.value=String(LT.av(l)[e.getAttribute('data-av')])});
  var et=$('f-est');if(et){var oe2=real()?estLn():l.txt,fn2=oe2.font,xe=LT.estilosDe(fn2,oe2);et.outerHTML=botoesEst(xe);var mh=$('lg-est-h');if(mh)mh.textContent=msgEst(xe,(fontePor(fn2)||{fam:fn2}).fam)}
  [].forEach.call(document.querySelectorAll('input[name=alvo]'),function(i){i.checked=i.value===UI.alvo});
  var fl=$('fv-ln');if(fl){var ee=estLn(),ff=LT.famLG(ee.font,ee);fl.style.fontFamily=fam(ee.font);fl.style.fontStyle=ff.i?'italic':'normal';fl.style.fontWeight=ff.w}
  if(window.PLMET)PLMET.render();
  $('lg-fora').hidden=!fora()
}
function render(){
  L();pintar();
  if(!$('p-legendas').hidden){if(!$(real()?'lg-lin':'lg-in'))montar();else{sincronizar();['txt','data','loc'].forEach(function(k){var e=$('fv-'+k);if(e)e.textContent=amostra(k)})}}
}
function mudar(k,v,chave){setp(L(),k,v);Q.commit(chave||('lg:'+k))}
function preset(k){
  var l=L();l.preset=k;var p=PRESETS[k].p;
  Object.keys(p).forEach(function(x){
    if(real()){var o=UI.alvo;UI.alvo='a';if(x==='txt.font')setLn('font',p[x]);else if(x==='txt.caixa')setp(l,'av.cx',p[x]);else if(x==='txt.esp')setp(l,'av.esp',Math.max(0,Math.min(.2,p[x])));UI.alvo=o}
    else setp(l,x,p[x])});
  if(k==='pin')l.loc.on=true;if(k==='calendario')l.data.on=true;
  UI.sel=null;Q.commit('lg:preset');montar()
}
/* padrão do Retro Pocket (D-113): duas linhas, local primeiro, ancoradas no topo das maiúsculas.
   Só troca quando a legenda ainda está no padrão — personalizações ficam de fora. */
function padraoPocket(){
  var s=Q.ST()[0],cur=s.leg;
  if(cur&&JSON.stringify(cur)!==JSON.stringify(real()?LT.legInicial():PADRAO))return false;
  s.leg=LT.legPocket(PADRAO);
  return true
}
/* ---------- eventos (delegação) ---------- */
var P=$('p-legendas');
/* D-186: a lista suspensa de fontes fecha com Esc ou com um toque fora; as setas ↑ e ↓ andam pelas fontes */
document.addEventListener('click',function(e){if(UI.sel&&!(e.target.closest&&e.target.closest('.fdd'))){UI.sel=null;UI.busca='';montar()}});
document.addEventListener('keydown',function(e){
  if(!UI.sel)return;
  if(e.key==='Escape'){var k=UI.sel;UI.sel=null;UI.busca='';montar();var bt=document.querySelector('[data-fsel="'+k+'"]');if(bt)bt.focus();e.preventDefault();return}
  if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
  var it=[].slice.call(document.querySelectorAll('#fpick .fitem__b')),i=it.indexOf(document.activeElement);if(!it.length)return;
  if(e.target.id==='fbusca'){if(e.key==='ArrowDown'){it[0].focus();e.preventDefault()}return}
  if(i<0)return;var j=e.key==='ArrowDown'?Math.min(it.length-1,i+1):i-1;
  if(j<0)$('fbusca').focus();else it[j].focus();e.preventDefault()
});
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
  if(t.id==='pl-in-0'||t.id==='pl-in-1'){var ii=+t.id.slice(-1),e2=Q.S();e2.pl=e2.pl||[{v:'',m:false},{v:'',m:false}];e2.pl[ii]={v:t.value,m:true};Q.commit('lg:pl');  /* digitou: vira manual */
    var dl=$('pl-dl-'+ii);if(dl&&sugOn()&&window.PLLOCAIS&&LT.padLinha(padAlvo().l[ii]).t==='loc')PLLOCAIS.buscar(t.value,8).then(function(r){dl.innerHTML=r.map(function(x){return'<option value="'+PLLOCAIS.rotulo(x)+'"></option>'}).join('')});
    var rb=document.querySelector('[data-restaurar="'+ii+'"]');if(rb)rb.hidden=!sugOn()||LT.padLinha(padAlvo().l[ii]).t==='txt';return}
  if(t.id==='fbusca'){UI.busca=t.value;if(t.value)UI.cat='todas';   /* D-186: a busca procura em todas */
    var pos=t.selectionStart;montar();var n=$('fbusca');n.focus();n.setSelectionRange(pos,pos);return}
});
P.addEventListener('change',function(e){
  var t=e.target;
  if(acaoPad(e))return;
  if(t.name==='alvo'){UI.alvo=t.value;UI.sel=null;montar();return}
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
  if(b.hasAttribute('data-sw')&&b.getAttribute('data-sw')==='sug'){if(L().original)return;var Ls=L();if(Ls.sug===false)delete Ls.sug;else Ls.sug=false;Q.commit('lg:sug');montar();return}
  if(b.hasAttribute('data-sw')&&b.getAttribute('data-sw')==='padon'){var Lp=L();if(!Lp.pad){Lp.pad=LT.padNovo();Lp.pad.on=false}Lp.pad.on=!Lp.pad.on;UI.aberto.av=true;Q.commit('lg:padon');montar();if(Lp.pad.on)depois(preencher(todasFotos()),'lg:padon2');return}
  if(b.id==='lg-av-t'){UI.aberto.av=!UI.aberto.av;montar();return}
  if(b.hasAttribute('data-restaurar')){var ri=+b.getAttribute('data-restaurar'),er=Q.S();if(er.pl&&er.pl[ri])er.pl[ri]={v:'',m:false};Q.commit('lg:restaurar');depois(preencher([Q.cur()],ri),'lg:restaurar2');return}
  if(b.id==='pad-todas'){var Lt=L(),alvo=padAlvo(),S3=Q.ST(),j3;Lt.pad={on:true,l:copia(alvo.l)};for(j3=1;j3<=Q.N;j3++)delete S3[j3].pad;Q.commit('lg:padtodas');montar();depois(preencher(todasFotos()),'lg:padtodas2');Q.toast('Padrão aplicado a todas as fotos',true);return}
  if(b.hasAttribute('data-sw')){var k=b.getAttribute('data-sw');mudar(k,!getp(L(),k));if(k==='original')montar();return}
  if(b.hasAttribute('data-est')){var ke=b.getAttribute('data-est'),ch=ke==='it'?'it':'b';
    if(real()){setLn(ch,!estLn()[ch]);Q.commit('lg:est');montar();return}
    var tx=L().txt;if(tx[ch])delete tx[ch];else tx[ch]=true;Q.commit('lg:est');montar();return}   /* D-148 */
  if(b.hasAttribute('data-fsel')){var kk=b.getAttribute('data-fsel');UI.sel=UI.sel===kk?null:kk;UI.busca='';UI.cat='todas';montar();var c0=UI.sel&&document.querySelector('#fpick .fitem.is-on');if(c0){var fl0=c0.parentNode,y0=c0.offsetTop-fl0.offsetTop;if(y0+c0.offsetHeight>fl0.clientHeight)fl0.scrollTop=y0-fl0.clientHeight/3}return}   /* abre mostrando a fonte atual, sem esconder os primeiros grupos à toa */
  if(b.hasAttribute('data-fcat')){var fc=b.getAttribute('data-fcat');UI.cat=fc;montar();var nb=document.querySelector('[data-fcat="'+fc+'"]');if(nb)nb.focus();return}
  if(b.hasAttribute('data-pick')){var n=b.getAttribute('data-pick');PREF.rec=[n].concat(PREF.rec.filter(function(x){return x!==n})).slice(0,6);guardaPref();UI.busca='';var s=UI.sel;UI.sel=null;var Lf=L();
    if(s==='ln'){setLn('font',n);alvosLn().forEach(function(i){var ln=Lf.pad.l[i],ee=LT.estilosDe(n,ln);if(ln.b&&!ee.b.ok)delete ln.b;ee=LT.estilosDe(n,ln);if(ln.it&&!ee.it.ok)delete ln.it});Q.commit('lg:font');montar();return}
    Lf[s].font=n;if(s==='txt'){var ee=LT.estilosDe(n,Lf.txt);if(Lf.txt.b&&!ee.b.ok)delete Lf.txt.b;ee=LT.estilosDe(n,Lf.txt);if(Lf.txt.it&&!ee.it.ok)delete Lf.txt.it}Q.commit('lg:font');montar();return}
  if(b.hasAttribute('data-fav')){var f=b.getAttribute('data-fav'),i=PREF.fav.indexOf(f);if(i>=0)PREF.fav.splice(i,1);else PREF.fav.push(f);guardaPref();montar();var fb=document.querySelector('[data-fav="'+f+'"]');if(fb)fb.focus();return}
  if(b.hasAttribute('data-lreset')){var kr=b.getAttribute('data-lreset');
    if(DEFL[kr]!==undefined){delete L()[kr];Q.commit('lg:'+kr);montar();return} /* D-113: resetar = tirar a chave */
    if(kr.indexOf('ln.')===0){setLn(kr.slice(3),undefined);Q.commit('lg:'+kr);montar();return}
    if(kr.indexOf('av.')===0){var Lr=L();if(Lr.av){delete Lr.av[kr.slice(3)];if(!Object.keys(Lr.av).length)delete Lr.av}Q.commit('lg:'+kr);montar();if(kr==='av.df'||kr==='av.lf')depois(preencher(todasFotos()),'lg:avr');return}
    setp(L(),kr,getp(PADRAO,kr));Q.commit('lg:'+kr);montar();return}
  if(b.hasAttribute('data-usar')){Q.S().txt=UI.pend;$('lg-conf').hidden=true;$('lg-h').textContent='Até 80 caracteres.';Q.commit('lg:txt');return}
  if(b.hasAttribute('data-limpar')){Q.S().txt='';$('lg-in').value='';$('lg-conf').hidden=true;$('lg-h').textContent='Até 80 caracteres.';Q.commit('lg:txt');return}
  if(b.hasAttribute('data-lfit')){L().txt.fit=true;Q.commit('lg:fit');montar();return}
  if(b.id==='lg-rtudo'){var fr0=Q.ST()[0].fr;Q.ST()[0].leg=fr0&&fr0.fmt==='pocket'?LT.legPocket(PADRAO):real()?LT.legInicial():copia(PADRAO);   /* D-179: no Pocket, o padrão é o do Pocket */if(real())depois(preencher(todasFotos()),'lg:tudo2');Q.commit('lg:tudo');UI.sel=null;montar();Q.toast('Legendas voltaram ao padrão',true);return}
  if(b.id==='lg-apply'&&real()){var pdA=L().pad,SA=Q.ST(),ca=0,cur=Q.S().pl||[];[0,1].forEach(function(i){if(pdA.l[i].t!=='txt'||!cur[i])return;for(var j=1;j<=Q.N;j++)if(j!==Q.cur()){SA[j].pl=SA[j].pl||[{v:'',m:false},{v:'',m:false}];SA[j].pl[i]={v:cur[i].v,m:true};ca++}});
    Q.commit('lg:aplicar');Q.toast(ca?'Texto aplicado às outras fotos':'Nenhuma linha de texto livre para aplicar',!!ca);return}
  if(b.id==='lg-apply'){var tx=Q.S().txt,S=Q.ST(),c=0;if(tx===null)tx=T();for(var j=1;j<=Q.N;j++){if(j!==Q.cur()){S[j].txt=tx;c++}}Q.commit('lg:aplicar');Q.toast('Texto aplicado às outras '+c+' fotos',true)}
});
function iniciar(){if(!real()||!Q.meta)return Promise.resolve();return preencher(todasFotos()).then(function(){if(Q.rebase)Q.rebase();sincPad()})}
iniciarReal();
window.PLLEG={iniciar:iniciar,render:render,padraoPocket:padraoPocket,refazer:function(ns){depois(preencher(ns||[Q.cur()]),'lg:md')}};   /* D-148: a cidade ou a data da foto mudou: refaz as linhas não digitadas */
document.fonts&&document.fonts.addEventListener&&document.fonts.addEventListener('loadingdone',function(){LT.limparMedTela();render()}); /* métricas mudaram: recalcula as linhas (D-113) */
render();iniciar()
})();
