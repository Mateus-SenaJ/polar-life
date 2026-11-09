/* T-30a · Motor do gerador de PDF · DOC-08 §6, MT-01 a MT-07
   Lê o projeto do sessionStorage, monta a display list em µm e desenha no PDF com pdf-lib + fontkit. */
(function(){
var FL=window.PLFOLHAS, LT=window.PLTEXTO, PDF=window.PDFLib, FK=window.fontkit;
var BASE=(function(){
  try{var u=new URL(document.currentScript.src);return u.origin+u.pathname.replace(/assets\/js\/gerador\.js$/,'')}catch(e){}
  return location.href.replace(/\/app\/.*$/,'/').replace(/[^/]*$/,'')
})();
var SIG='assets/img/logos/Logo_tipografia_lateral.png', SIGURL=BASE+SIG;
var VERT={2:1,6:1,9:1,13:1,17:1,21:1};
var ADJ0={brilho:0,contraste:0,saturacao:0,temp:0,realces:0,sombras:0,nitidez:0,vinheta:0};
var ID=[1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,1,0];
var FILTROS=[
 {id:'original',n:'Original',m:ID},
 {id:'pb',n:'P&B',m:mat(0,1.05,0)},
 {id:'noir',n:'Noir',m:mat(0,1.5,-.05)},
 {id:'retro',n:'Retrô',m:mat(.8,.95,0,[1.08,1,.88],.02)},
 {id:'antiga',n:'Foto Antiga',m:mat(.45,.9,0,[1.1,1,.8],.04)},
 {id:'praia',n:'Praia',m:mat(1.2,1.05,0,[.97,1.03,1.08])},
 {id:'pastel',n:'Pastel',m:mat(.7,.8,.1)},
 {id:'polaroid',n:'Polaroid Clássico',m:mat(.9,.9,0,[1.05,1.02,.95],.03)},
 {id:'instantanea',n:'Instantânea',m:mat(1.15,1.15,0,[1.03,1,.97])},
 {id:'verao',n:'Verão',m:mat(1.2,1.05,0,[1.08,1.02,.9])},
 {id:'desbotado',n:'Desbotado',m:mat(.6,.8,.08)},
 {id:'cinema',n:'Cinema',m:mat(.85,1.2,-.03,[.95,1,1.08])}
];
var cacheBytes={},cacheFontes={},cacheFoto={},fonteReserva={};

function copia(o){return JSON.parse(JSON.stringify(o))}
function novo(src){return{src:src,modo:'preencher',z:100,ang:0,px:0,py:0,rot:0,flip:false,adj:copia(ADJ0),txt:null,flt:{id:'original',int:100}}}
function mm(v){return Math.round(v*1000)}
function r6(v){return Math.round(v*1e6)/1e6}
function pad(n,l){var s=String(n);while(s.length<l)s='0'+s;return s}
function tamUm(pt){return pt*25.4*1000/72}
function mm2pt(v){return v*72/25.4}
function cancelado(sinal){return !!(sinal&&sinal.aborted)}      /* 30a: cancelar vale no documento e em cada página */

function mat(sat,con,br,rgb,off){ /* mesma conta de filtros.js (T-11) */
  var lr=.2126,lg=.7152,lb=.0722,s=sat,rows=[[lr*(1-s)+s,lg*(1-s),lb*(1-s)],[lr*(1-s),lg*(1-s)+s,lb*(1-s)],[lr*(1-s),lg*(1-s),lb*(1-s)+s]],o=[];
  rgb=rgb||[1,1,1];off=off||0;
  for(var c=0;c<3;c++){var k=con*rgb[c];o=o.concat([rows[c][0]*k,rows[c][1]*k,rows[c][2]*k,0,.5*(1-con)*rgb[c]+br+off])}
  return o.concat([0,0,0,1,0])
}
function por(id){return FILTROS.filter(function(f){return f.id===id})[0]||FILTROS[0]}
function lerp(m,t){return m.map(function(v,i){return+(ID[i]+(v-ID[i])*t).toFixed(4)})}

function nat(src){return VERT[src]?{w:976,h:1300}:{w:1300,h:976}}
function efet(src,s){var a=nat(src);return s.rot%180?{w:a.h,h:a.w}:a}
function janela(fr){return fr.ori==='h'?{jw:fr.jh,jh:fr.jw}:{jw:fr.jw,jh:fr.jh}}   /* MT-02/D-109: janela já girada */
function jq(fr){var j=janela(fr);return j.jw/j.jh}
function base(src,s,fr){var e=efet(src,s),a=1/e.w,b=1/(jq(fr)*e.h);return s.modo==='encaixar'?Math.min(a,b):Math.max(a,b)}
function ppiFoto(src,s,fr){var j=janela(fr);return Math.round(1/(base(src,s,fr)*s.z/100)/j.jw*25.4)}

function filtroParams(a){
  var f=1+(a.contraste>=0?a.contraste/100:a.contraste/125),bo=a.brilho/100*.3,tr=1+a.temp/100*.15,tb=1-a.temp/100*.15,ic=.5*(1-f)+bo;
  return{sat:1+a.saturacao/100,slopes:[f*tr,f,f*tb],ic:ic,amp:1+a.realces/100*.25,exp:1-a.sombras/100*.35}
}
function cena(sr,vin){ /* mesma cena de exemplo do quadro.js (T-08) */
  var v=VERT[sr],o='<svg viewBox="0 0 '+(v?'300 400':'400 300')+'" preserveAspectRatio="none" aria-hidden="true"><rect width="'+(v?300:400)+'" height="'+(v?400:300)+'" fill="#fff"/>';
  if(v){var sx=60+(sr*47)%180;
    o+='<rect width="300" height="270" fill="#006194" opacity=".14"/><circle cx="'+sx+'" cy="110" r="28" fill="#FD761A"/><path d="M0 270L60 170L110 230L170 130L230 245L300 180V400H0Z" fill="#006194" opacity=".55"/><path d="M0 320L80 240L150 300L220 230L300 310V400H0Z" fill="#000" opacity=".85"/><rect y="362" width="300" height="38" fill="#000"/>'}
  else{var sx2=70+(sr*53)%260;
    o+='<rect width="400" height="200" fill="#006194" opacity=".14"/><circle cx="'+sx2+'" cy="92" r="26" fill="#FD761A"/><path d="M0 205L70 120L120 175L190 95L270 190L330 135L400 200V300H0Z" fill="#006194" opacity=".55"/><path d="M0 240L90 170L160 225L250 160L330 230L400 195V300H0Z" fill="#000" opacity=".85"/><rect y="262" width="400" height="38" fill="#000"/>'}
  if(vin>0)o+='<rect width="'+(v?300:400)+'" height="'+(v?400:300)+'" fill="url(#vg)" opacity="'+(vin/100*.55)+'"/>';
  return o+'</svg>'
}

function svgFoto(f,fr,W,H){
  var a=nat(f.src),k=base(f.src,f,fr)*f.z/100,bw=a.w*k*W,bh=a.h*k*W,cx=W*(.5+f.px),cy=H*(.5+f.py);
  var adj=Object.assign({},ADJ0,f.adj||{}),flt=Object.assign({id:'original',int:100},f.flt||{}),fp=filtroParams(adj),fm=lerp(por(flt.id).m,(flt.int==null?100:flt.int)/100);
  var filtro='<filter id="adj" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">'
    +'<feColorMatrix type="saturate" values="'+fp.sat+'"/>'
    +'<feComponentTransfer><feFuncR type="linear" slope="'+fp.slopes[0]+'" intercept="'+fp.ic+'"/><feFuncG type="linear" slope="'+fp.slopes[1]+'" intercept="'+fp.ic+'"/><feFuncB type="linear" slope="'+fp.slopes[2]+'" intercept="'+fp.ic+'"/></feComponentTransfer>'
    +'<feComponentTransfer><feFuncR type="gamma" amplitude="'+fp.amp+'" exponent="'+fp.exp+'" offset="0"/><feFuncG type="gamma" amplitude="'+fp.amp+'" exponent="'+fp.exp+'" offset="0"/><feFuncB type="gamma" amplitude="'+fp.amp+'" exponent="'+fp.exp+'" offset="0"/></feComponentTransfer>'
    +'<feColorMatrix type="matrix" values="'+fm.join(' ')+'"/>';
  if((adj.nitidez||0)>0&&ppiFoto(f.src,f,fr)>=300){
    var n=adj.nitidez/100*.5,kern='0 '+(-n)+' 0 '+(-n)+' '+(1+4*n)+' '+(-n)+' 0 '+(-n)+' 0';
    filtro+='<feConvolveMatrix order="3" kernelMatrix="'+kern+'" divisor="1" edgeMode="duplicate"/>'
  }
  filtro+='</filter>';
  var scene=cena(f.src,adj.vinheta||0).replace('<svg ','<svg x="'+(-bw/2)+'" y="'+(-bh/2)+'" width="'+bw+'" height="'+bh+'" ');
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'
    +'<defs><radialGradient id="vg" cx=".5" cy=".5" r=".75"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="1"/></radialGradient>'+filtro+'</defs>'
    +'<rect width="'+W+'" height="'+H+'" fill="#FFFFFF"/>'
    +'<g transform="translate('+cx+' '+cy+') rotate('+(f.ang||0)+') scale('+(f.flip?-1:1)+' 1) rotate('+(f.rot||0)+')" filter="url(#adj)">'+scene+'</g></svg>'
}

function projeto(){
  var q=null;try{q=JSON.parse(sessionStorage.getItem('pl-quadro')||'null')}catch(e){}
  if(!(Array.isArray(q)&&q.length>=2&&q.slice(1).every(function(e){return e&&e.src>=1&&e.src<=24&&e.src%1===0})))q=null;
  var lista=[],txt={},meta={},leg=null,fr={w:88,h:107,jh:76,lado:6,topo:6,rad:.4,ori:'v'};
  if(q){
    var g=q[0]||{},f0=g.fr;
    if(f0&&f0.w>0&&f0.h>0&&f0.lado>0&&f0.w-2*f0.lado>0){fr={w:f0.w,h:f0.h,jh:f0.jh>0?f0.jh:f0.w-2*f0.lado,lado:f0.lado,topo:f0.topo==null?6:f0.topo,rad:f0.rad==null?.4:f0.rad,ori:f0.ori==='h'?'h':'v'}}
    if(g.leg&&g.leg.txt&&g.leg.data&&g.leg.loc)leg=g.leg;
    q.slice(1).forEach(function(e,k){lista.push(e);if(typeof e.txt==='string')txt[k+1]=e.txt;if(e.meta&&typeof e.meta==='object')meta[k+1]=e.meta});
  }else{
    var l=null;try{l=JSON.parse(sessionStorage.getItem('pl-fotos')||'null')}catch(e){}
    if(!(Array.isArray(l)&&l.length>=1&&l.length<=400&&l.every(function(x){return x>=1&&x<=24&&x%1===0}))){l=[];for(var i=1;i<=24;i++)l.push(i)}
    l.forEach(function(sr){var e=novo(sr);if(sr===3){e.adj.realces=-20;e.adj.sombras=25;e.adj.vinheta=15}if(sr===12)e.z=233;lista.push(e)})
  }
  var fotos=lista.map(function(e,k){
    var src=e.src;
    return{n:k+1,src:src,v:!!VERT[src],leg:txt[k+1]!==undefined?txt[k+1]:(e.txt!=null?e.txt:LT.LEG[(src-1)%4]),m:meta[k+1]||e.meta||null,
      modo:e.modo||'preencher',z:e.z==null?100:e.z,ang:e.ang||0,px:e.px||0,py:e.py||0,rot:e.rot||0,flip:!!e.flip,
      adj:Object.assign({},ADJ0,e.adj||{}),flt:Object.assign({id:'original',int:100},e.flt||{})}
  });
  fr.jw=fr.w-2*fr.lado;fr.jh=fr.jh>0?fr.jh:fr.jw;
  return{s:FL.ler(),fr:fr,fotos:fotos,leg:leg}
}

function mul(A,B){return{a:A.a*B.a+A.c*B.b,b:A.b*B.a+A.d*B.b,c:A.a*B.c+A.c*B.d,d:A.b*B.c+A.d*B.d,e:A.a*B.e+A.c*B.f+A.e,f:A.b*B.e+A.d*B.f+A.f}}
function matrizPolaroid(c,fr){
  /* MT-02/D-109: uma única rotação em torno do centro da célula; medidas da moldura em pé. */
  var cx=c.x+c.w/2,cy=c.y+c.h/2,ang=fr.ori==='h'?(c.giro?0:Math.PI/2):(c.giro?Math.PI/2:0),ca=Math.cos(ang),sa=Math.sin(ang);
  var M=mul(mul({a:1,b:0,c:0,d:1,e:cx*1000,f:cy*1000},{a:ca,b:sa,c:-sa,d:ca,e:0,f:0}),{a:1,b:0,c:0,d:1,e:-fr.w/2*1000,f:-fr.h/2*1000});
  return[r6(M.a),r6(M.b),r6(M.c),r6(M.d),Math.round(M.e),Math.round(M.f)]
}

/* ---------- fontes ---------- */
var SLUG={'Cormorant Garamond':'cormorant-garamond','Playfair Display':'playfair-display','IBM Plex Mono':'ibm-plex-mono','Courier Prime':'courier-prime','EB Garamond':'eb-garamond','Libre Baskerville':'libre-baskerville','Dancing Script':'dancing-script','Special Elite':'special-elite','Cutive Mono':'cutive-mono','Reenie Beanie':'reenie-beanie','Shadows Into Light':'shadows-into-light','Covered By Your Grace':'covered-by-your-grace','Over the Rainbow':'over-the-rainbow','La Belle Aurore':'la-belle-aurore','Homemade Apple':'homemade-apple','Patrick Hand':'patrick-hand'};
var PESOS={'caveat':[400,500],'ibm-plex-mono':[400],'inter':[300,400,500],'cormorant-garamond':[300,400],'playfair-display':[400]};
var ITAL={'cormorant-garamond':[300,400],'playfair-display':[400]};
var SO_ITAL={'playfair-display':1};
function slug(fam){if(SLUG[fam])return SLUG[fam];return String(fam).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function maisProximo(a,p){var b=a[0],d=1e9;a.forEach(function(v){var x=Math.abs(v-p);if(x<d){d=x;b=v}});return b}
function arquivoFonte(fam,peso,it){
  var s=slug(fam),disp=PESOS[s]||[400],ital=ITAL[s]||[],useIt=!!it;
  if(SO_ITAL[s])useIt=true;
  if(useIt&&!ital.length)useIt=false;
  var p=maisProximo(useIt?ital:disp,peso);
  return s+'-'+p+(useIt?'-italico':'')+'.ttf'
}
function carregarBytes(url){
  if(cacheBytes[url])return Promise.resolve(cacheBytes[url]);
  return fetch(url).then(function(r){if(!r.ok)throw new Error('404');return r.arrayBuffer()}).then(function(ab){var u=new Uint8Array(ab);cacheBytes[url]=u;return u})
}
function carregarFonte(fam,peso,it,avisos){
  var arq=arquivoFonte(fam,peso,it),url=BASE+'assets/fonts/pdf/'+arq;
  if(cacheFontes[arq]){if(fonteReserva[arq])registrarAviso(avisos,'FonteReserva',arq,fam);return Promise.resolve(cacheFontes[arq])}
  return carregarBytes(url).catch(function(){
    if(arq==='inter-400.ttf')throw new Error('FonteIndisponivel');
    fonteReserva[arq]=1;registrarAviso(avisos,'FonteReserva',arq,fam);
    return carregarBytes(BASE+'assets/fonts/pdf/inter-400.ttf')
  }).then(function(bytes){
    /* MT-07: alguns TTF do catálogo têm o último glifo em comprimento zero; fontkit lê
       além do fim e falha em encodeText. O padding não altera as tabelas da fonte. */
    var b=new Uint8Array(bytes.length+16);b.set(bytes);cacheBytes[url]=b;
    var f=FK.create(b);cacheFontes[arq]=f;return f
  })
}
function fonteDe(f){return cacheFontes[arquivoFonte(f.fam,f.peso,f.it)]||null}
function estiloObj(o){
  var fm=LT.famLG(o.font),fam=String(fm.f).split("'")[1]||o.font;
  return{fam:fam,peso:fm.w,it:!!fm.i,pt:o.pt||9,cor:LT.COR_LG[o.cor]||'#000',esp:o.esp||0,contorno:false}
}
function metricas(f){var ft=fonteDe(f);if(ft&&ft.unitsPerEm)return{asc:ft.ascent/ft.unitsPerEm,desc:Math.abs(ft.descent)/ft.unitsPerEm};return{asc:.8,desc:.2}}
function medir(txt,f){
  if(!txt)return 0;
  var size=tamUm(f.pt),ft=fonteDe(f),w;
  if(ft){try{w=ft.layout(txt).advanceWidth/ft.unitsPerEm*size}catch(e){w=txt.length*size*.55}}
  else w=txt.length*size*.55;
  return w+(f.esp||0)*size*txt.length
}
function linhaBase(top,size,f,lh){var m=metricas(f);return top+size*((lh-(m.asc+m.desc))/2+m.asc)}
function cortar(txt,f,maxW){                                /* 30a/T4: corta como o text-overflow:ellipsis do CSS */
  if(!txt||maxW<=0)return'';
  if(medir(txt,f)<=maxW)return txt;
  var t=txt;
  while(t.length>0&&medir(t+'…',f)>maxW)t=t.slice(0,-1);
  return t+'…'
}

/* ---------- display list ---------- */
function texto(txt,x,y,f,contorno,top,lh,clip){return{t:'texto',x:Math.round(x),y:Math.round(y),txt:txt,fonte:{fam:f.fam,peso:f.peso,it:!!f.it},pt:f.pt,cor:f.cor,esp:f.esp||0,contorno:!!contorno,top:top==null?null:Math.round(top),lh:lh||0,clip:clip||null}}
function ret(x,y,w,h,rx,cor,larg,tracejado){return{t:'ret',x:Math.round(x),y:Math.round(y),w:Math.round(w),h:Math.round(h),rx:Math.round(rx||0),traco:{cor:cor,larg:Math.round(larg),tracejado:!!tracejado}}}
function linha(x1,y1,x2,y2,cor,larg){return{t:'linha',x1:Math.round(x1),y1:Math.round(y1),x2:Math.round(x2),y2:Math.round(y2),cor:cor,larg:larg}}
function grupoRot(itens,cx,cy,graus){
  var a=graus*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a);
  return{t:'grupo',m:[r6(ca),r6(sa),r6(-sa),r6(ca),Math.round(cx-ca*cx+sa*cy),Math.round(cy-sa*cx-ca*cy)],itens:itens}
}

function layoutLegenda(f,fr,leg,s){
  var preset=leg?leg.preset:'simples',pos=leg?leg.pos||'abaixo':'abaixo',DF=LT.dadosFoto(f),capTxt,capEst,metaSegs=[],metaMax;
  /* MT-01/MT-02: tudo em µm dentro desta função; fr e constantes entram em mm. */
  var L=mm(fr.lado),T=mm(fr.topo),JW=mm(fr.jw),JH=mm(fr.jh),GAP_FOTO=mm(2.2),GAP_META=mm(1.2),GAP_ACIMA=mm(2);
  if(leg){
    capTxt=leg.txt.on?LT.caixaLG(f.leg,leg.txt.caixa):'';
    capEst=estiloObj(leg.txt);capEst.esp=leg.txt.esp||0;
    var dataEst=estiloObj(leg.data),locEst=estiloObj(leg.loc);dataEst.esp=.02;locEst.esp=.02;
    var dataTxt=leg.data.on&&DF.d?LT.FMTD[leg.data.fmt||0](DF.d):'',locTxt=leg.loc.on&&DF.c?LT.localLG(leg.loc,DF.c):'';
    var sepEst={fam:'IBM Plex Mono',peso:400,it:false,pt:Math.max(dataEst.pt,locEst.pt),cor:'#000000',esp:.02,contorno:false};
    if(dataTxt)metaSegs.push({txt:dataTxt,est:dataEst,box:preset==='calendario'});
    if(dataTxt&&locTxt)metaSegs.push({txt:' • ',est:sepEst,box:false});
    if(locTxt)metaSegs.push({txt:locTxt,est:locEst,box:false});
    metaMax=dataEst.pt>=locEst.pt?dataEst:locEst;
  }else{
    capTxt=f.leg||'';
    capEst={fam:'Caveat',peso:500,it:false,pt:5.2*72/25.4,cor:'#000000',esp:0,contorno:false};
    var metaEst={fam:'IBM Plex Mono',peso:400,it:false,pt:2.5*72/25.4,cor:'#000000',esp:.02,contorno:false};
    var dTxt=DF.d?LT.FMTD[0](DF.d):'',lTxt=DF.c?LT.localLG(LT.LOC0,DF.c):'';
    if(dTxt)metaSegs.push({txt:dTxt,est:metaEst,box:false});
    if(dTxt&&lTxt)metaSegs.push({txt:' • ',est:metaEst,box:false});
    if(lTxt)metaSegs.push({txt:lTxt,est:metaEst,box:false});
    metaMax=metaEst;
  }
  var metaWidth=0;
  metaSegs.forEach(function(seg){var w=medir(seg.txt,seg.est);if(seg.box)w+=2*.4*tamUm(seg.est.pt)+520;seg.w=w;metaWidth+=w});
  var capBox=preset==='etiqueta'||preset==='bilhete'||preset==='carimbo',capBorder=capBox?(preset==='carimbo'?530:260):0;
  var capSize,capPadX,capPadY,capTextW,capBoxW,capBoxH;
  function medirCap(){
    capSize=tamUm(capEst.pt);capPadX=capBox?.4*capSize:0;capPadY=capBox?.05*capSize:0;
    capTextW=capTxt?medir(capTxt,capEst):0;capBoxW=capTxt?capTextW+2*capPadX+2*capBorder:0;capBoxH=capTxt?1.1*capSize+2*capPadY+2*capBorder:0
  }
  medirCap();
  var capAvail=pos==='acima'?JW-(metaWidth?metaWidth+GAP_ACIMA:0):JW;
  if(leg&&leg.txt.fit&&capTxt){
    while(capBoxW>capAvail&&capEst.pt>8){capEst.pt=Math.max(8,capEst.pt-.25);medirCap()}
  }
  if(capTxt){                                                /* 30a/T4: não passa da figcaption; corta com «…» */
    var capMaxW=Math.max(0,capAvail-2*(capBorder+capPadX));
    if(medir(capTxt,capEst)>capMaxW+.01){capTxt=cortar(capTxt,capEst,capMaxW);medirCap()}
  }
  var metaSize=tamUm(metaMax.pt),metaLineH=1.2*metaSize;
  function capItems(top,x){
    var arr=[],clip={x:Math.round(L),w:Math.round(JW)};
    if(capTxt){
      arr.push(texto(capTxt,x+capBorder+capPadX,linhaBase(top+capBorder+capPadY,capSize,capEst,1.1),capEst,preset==='contornada',top+capBorder+capPadY,1.1,clip));
      if(capBox)arr.push(ret(x,top,capBoxW,capBoxH,260,capEst.cor,capBorder,preset==='bilhete'));
    }
    return arr
  }
  function metaItems(top,x){
    var arr=[],b=linhaBase(top,metaSize,metaMax,1.2),mx=x,maxRight=L+JW,clip={x:Math.round(L),w:Math.round(JW)};
    metaSegs.forEach(function(seg){
      if(mx>=maxRight)return;
      var avail=maxRight-mx,txt=seg.txt;
      if(seg.box){
        var size=tamUm(seg.est.pt),pad=2*.4*size+520,maxTxt=Math.max(0,avail-pad);
        if(medir(txt,seg.est)>maxTxt+.01)txt=cortar(txt,seg.est,maxTxt);
        var tw=medir(txt,seg.est),bw=Math.min(avail,tw+pad),bh=1.2*size+520,m=metricas(seg.est);
        var bTop=b-((1.2-(m.asc+m.desc))/2+m.asc)*size;       /* MT-02: borda inline compartilha o topo da caixa de linha */
        arr.push(ret(mx,bTop,bw,bh,260,seg.est.cor,260,false));
        arr.push(texto(txt,mx+260+.4*size,b,seg.est,false,top,1.2,clip));
        mx+=bw
      }else{
        var w=medir(txt,seg.est);
        if(w>avail+.01){txt=cortar(txt,seg.est,avail);w=medir(txt,seg.est)}
        arr.push(texto(txt,mx,b,seg.est,false,top,1.2,clip));
        mx+=w
      }
    });
    return arr
  }
  var grupos=[];
  if(pos==='abaixo'){
    var figTop=T+JH+GAP_FOTO,items=capItems(figTop,L),figH=capTxt?capBoxH:0;
    var metaTop=figTop+(capTxt?capBoxH+GAP_META:GAP_META),mItems=metaItems(metaTop,L);
    if(metaSegs.length)figH=metaTop+metaLineH-figTop;
    if(preset==='carimbo'&&capTxt)items=[grupoRot(items,L+capBoxW/2,figTop+capBoxH/2,-3)];
    grupos.push({itens:items.concat(mItems),figTop:figTop,figH:figH})
  }else if(pos==='acima'){
    var gap2=capBoxW&&metaWidth?GAP_ACIMA:0,totalW=capBoxW+gap2+metaWidth,startX=Math.max(L,L+(JW-totalW)/2),capTop=(T-capBoxH)/2,items2=capItems(capTop,startX);
    var metaX=startX+capBoxW+gap2,mItems2=metaItems((T-metaLineH)/2,metaX);
    if(preset==='carimbo'&&capTxt)items2=[grupoRot(items2,startX+capBoxW/2,capTop+capBoxH/2,-3)];
    grupos.push({itens:items2.concat(mItems2),figTop:0,figH:T})
  }else{
    var startX3=L+(JW-capBoxW)/2,capTop3=(T-capBoxH)/2,items3=capItems(capTop3,startX3);
    if(preset==='carimbo'&&capTxt)items3=[grupoRot(items3,startX3+capBoxW/2,capTop3+capBoxH/2,-3)];
    grupos.push({itens:items3,figTop:0,figH:T});
    var figTop4=T+JH+GAP_FOTO,metaTop4=figTop4+GAP_META,mItems4=metaItems(metaTop4,L);
    grupos.push({itens:mItems4,figTop:figTop4,figH:metaSegs.length?metaTop4+metaLineH-figTop4:0})
  }
  var out=[];
  grupos.forEach(function(g){
    if(!leg||(!leg.dx&&!leg.dy&&!leg.inc)){out=out.concat(g.itens);return}
    var ox=L,oy=g.figTop+g.figH/2,dx=(leg.dx||0)*1000,dy=(leg.dy||0)*1000,inc=(leg.inc||0)*Math.PI/180,ca=Math.cos(inc),sa=Math.sin(inc);
    out.push({t:'grupo',m:[r6(ca),r6(sa),r6(-sa),r6(ca),Math.round(ox+dx-ca*ox+sa*oy),Math.round(oy+dy-sa*ox-ca*oy)],itens:g.itens})
  });
  return out
}

function itensPolaroid(c,proj){
  var fr=proj.fr,s=proj.s,f=c.f,itens=[];
  /* MT-02/D-109: foto() rasteriza a janela orientada; na horizontal o item gira −90° no grupo em pé
     para a imagem ficar de pé no papel. O grupo aplica giro da grade/orientação. */
  itens.push({t:'foto',n:f.n,x:mm(fr.lado),y:mm(fr.topo),w:mm(fr.jw),h:mm(fr.jh),rot:fr.ori==='h'?-90:0});
  itens=itens.concat(layoutLegenda(f,fr,proj.leg,s));
  if(s.assin){var w=3.9*2.9,h=w*96/279;itens.push({t:'img',x:mm(fr.lado),y:mm(fr.h-3-h),w:mm(w),h:mm(h),src:'assinatura'})}
  return itens
}
function corLinha(c){return c==='azul'?'#006194':c==='laranja'?'#FD761A':'#000000'}
function linhas(sh,p,s){
  var arr=[],W=mm(p.w),H=mm(p.h),cor=corLinha(s.cor);
  if(s.compr==='continua'){
    var xs={},ys={};
    sh.cells.forEach(function(c){var a=Math.round(c.x*100)/100,b=Math.round((c.x+c.w)*100)/100,d=Math.round(c.y*100)/100,e=Math.round((c.y+c.h)*100)/100;xs[a]=xs[a]||{l:0,r:0};xs[a].l=1;xs[b]=xs[b]||{l:0,r:0};xs[b].r=1;ys[d]=ys[d]||{t:0,b:0};ys[d].t=1;ys[e]=ys[e]||{t:0,b:0};ys[e].b=1});
    Object.keys(xs).forEach(function(x){var v=+x,o=xs[x].l&&!xs[x].r?-.05:xs[x].r&&!xs[x].l?.05:0;arr.push(linha(mm(v+o),0,mm(v+o),H,cor,100))});
    Object.keys(ys).forEach(function(y){var v=+y,o=ys[y].t&&!ys[y].b?-.05:ys[y].b&&!ys[y].t?.05:0;arr.push(linha(0,mm(v+o),W,mm(v+o),cor,100))})
  }else sh.cells.forEach(function(c){
    [[c.x,c.y,-1,-1],[c.x+c.w,c.y,1,-1],[c.x,c.y+c.h,-1,1],[c.x+c.w,c.y+c.h,1,1]].forEach(function(q){
      var ax=Math.min(5,q[2]<0?q[0]:p.w-q[0]),ay=Math.min(5,q[3]<0?q[1]:p.h-q[1]);
      sh.cells.forEach(function(d){
        if(d===c)return;
        if(d.y<c.y+c.h-.01&&d.y+d.h>c.y+.01){
          if(q[2]<0&&d.x+d.w<=c.x+.01)ax=Math.min(ax,c.x-(d.x+d.w));
          if(q[2]>0&&d.x>=c.x+c.w-.01)ax=Math.min(ax,d.x-(c.x+c.w))
        }
        if(d.x<c.x+c.w-.01&&d.x+d.w>c.x+.01){
          if(q[3]<0&&d.y+d.h<=c.y+.01)ay=Math.min(ay,c.y-(d.y+d.h));
          if(q[3]>0&&d.y>=c.y+c.h-.01)ay=Math.min(ay,d.y-(c.y+c.h))
        }
      });
      var x=q[0]+.05*q[2],y=q[1]+.05*q[3];
      if(q[2]<0)arr.push(linha(mm(x-ax),mm(y),mm(x),mm(y),cor,100));else arr.push(linha(mm(x),mm(y),mm(x+ax),mm(y),cor,100));
      if(q[3]<0)arr.push(linha(mm(x),mm(y-ay),mm(x),mm(y),cor,100));else arr.push(linha(mm(x),mm(y),mm(x),mm(y+ay),cor,100))
    })
  });
  return arr
}
function contornos(sh,fr){
  return sh.cells.map(function(c){return{t:'grupo',m:matrizPolaroid(c,fr),itens:[ret(44,44,mm(fr.w)-88,mm(fr.h)-88,0,'#000000',88,false)]}})
}
function rodape(i,N,p,s){
  var txt='Viagem · Serra 2026 · Folha '+(i+1)+' de '+N,f={fam:'IBM Plex Mono',peso:400,it:false,pt:2.2*72/25.4,cor:'#000000',esp:.04,contorno:false};
  var w=medir(txt.toUpperCase(),f),base=Math.max(1,s.margem/2-1.2),size=tamUm(f.pt),m=metricas(f),lh=m.asc+m.desc;
  /* MT-02: bottom é o fim da caixa de linha; a linha de base desconta meia-entrelinha e descendente. */
  var y=p.h*1000-mm(base)-(lh-(m.asc+m.desc))/2*size-m.desc*size;
  return texto(txt.toUpperCase(),(p.w*1000-w)/2,y,f,false)
}

function lista(proj){
  var s=proj.s,fr=proj.fr;
  if(s.guias&&s.contorno)throw new Error('InvariantError');
  var ext={w:fr.ori==='h'?fr.h:fr.w,h:fr.ori==='h'?fr.w:fr.h},R=FL.paginar(s,ext,proj.fotos);
  if(R.erro)return{paginas:[],erro:true,p:R.p};
  var paginas=R.sheets.map(function(sh,i){
    var itens=[];
    sh.cells.forEach(function(c){itens.push({t:'grupo',m:matrizPolaroid(c,fr),itens:itensPolaroid(c,proj)})});
    if(s.guias)itens=itens.concat(linhas(sh,R.p,s));else if(s.contorno)itens=itens.concat(contornos(sh,fr));
    if(s.rodape)itens.push(rodape(i,R.sheets.length,R.p,s));
    return{w:mm(R.p.w),h:mm(R.p.h),itens:itens}
  });
  return{paginas:paginas,erro:false,p:R.p}
}

/* ---------- foto ---------- */
function foto(proj,n,ppi,qualidade){
  var f=null;
  for(var i=0;i<proj.fotos.length;i++)if(proj.fotos[i].n===n){f=proj.fotos[i];break}
  if(!f)return Promise.reject({n:n,motivo:'Foto não encontrada'});
  var fr=proj.fr,j=janela(fr),W=Math.round(j.jw/25.4*ppi),H=Math.round(j.jh/25.4*ppi);
  if(W<1||H<1)return Promise.reject({n:n,motivo:'Formato inválido'});
  var chave=[ppi,qualidade,W,H,JSON.stringify(f)].join('|');
  if(cacheFoto[chave])return Promise.resolve(cacheFoto[chave]);
  var svg=svgFoto(f,fr,W,H);
  return new Promise(function(ok,no){
    var url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),img=new Image();
    img.onload=function(){
      try{
        var cv=document.createElement('canvas');cv.width=W;cv.height=H;
        var g=cv.getContext('2d');g.fillStyle='#FFFFFF';g.fillRect(0,0,W,H);g.drawImage(img,0,0,W,H);
        URL.revokeObjectURL(url);
        cv.toBlob(function(b){
          if(!b){no({n:n,motivo:'Falha ao gerar a imagem'});return}
          b.arrayBuffer().then(function(ab){var r={n:n,bytes:new Uint8Array(ab),wpx:W,hpx:H};cacheFoto[chave]=r;ok(r)},function(){no({n:n,motivo:'Falha ao ler a imagem'})})
        },'image/jpeg',qualidade)
      }catch(e){URL.revokeObjectURL(url);no({n:n,motivo:'Falha ao desenhar a foto'})}
    };
    img.onerror=function(){URL.revokeObjectURL(url);no({n:n,motivo:'Falha ao desenhar a foto'})};
    img.src=url
  })
}

/* ---------- PDF ---------- */
function rgb(hex){
  hex=String(hex||'#000000').replace('#','');
  if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return[parseInt(hex.slice(0,2),16)/255,parseInt(hex.slice(2,4),16)/255,parseInt(hex.slice(4,6),16)/255]
}
function roundRectOps(x,y,w,h,r){
  r=Math.min(r,w/2,h/2);var k=.5522847498;
  return[PDF.moveTo(x+r,y),PDF.lineTo(x+w-r,y),PDF.appendBezierCurve(x+w-r+k*r,y,x+w,y+r-k*r,x+w,y+r),
    PDF.lineTo(x+w,y+h-r),PDF.appendBezierCurve(x+w,y+h-r+k*r,x+w-r+k*r,y+h,x+w-r,y+h),
    PDF.lineTo(x+r,y+h),PDF.appendBezierCurve(x+r-k*r,y+h,x,y+h-r+k*r,x,y+h-r),
    PDF.lineTo(x,y+r),PDF.appendBezierCurve(x,y+r-k*r,x+r-k*r,y,x+r,y),PDF.closePath()]
}
function fontePDF(ctx,f){return ctx.fontCache[f.fam+'|'+f.peso+'|'+(f.it?1:0)]||null}
function registrarAviso(avisos,motivo,txt,fonte){
  if(!avisos)return;
  for(var i=0;i<avisos.length;i++)if(avisos[i].motivo===motivo&&avisos[i].txt===txt&&avisos[i].fonte===fonte)return;
  avisos.push({motivo:motivo,txt:txt,fonte:fonte})
}
function aviso(ctx,motivo,txt,fonte){registrarAviso(ctx.avisos,motivo,txt,fonte)}
function desenharTexto(ctx,it){
  var fp=fontePDF(ctx,it.fonte);if(!fp)return;
  var enc;try{enc=fp.font.encodeText(it.txt)}catch(e){aviso(ctx,'encodeText',it.txt,it.fonte.fam);return}
  var key=ctx.pageIndex+'|'+fp.key,name=ctx.fontNames[key];
  if(!name){name=ctx.page.node.newFontDictionary(fp.font.name,fp.font.ref);ctx.fontNames[key]=name}
  var size=tamUm(it.pt),c=rgb(it.cor),ops=[PDF.pushGraphicsState()];
  if(it.clip&&it.top!=null){                                 /* 30a/T4: recorta a linha na caixa da figcaption */
    var lh=it.lh||1.2;
    ops.push(PDF.rectangle(it.clip.x,it.top,it.clip.w,lh*size),PDF.clip(),PDF.endPath())
  }
  ops.push(PDF.beginText(),PDF.setFillingRgbColor(c[0],c[1],c[2]),PDF.setFontAndSize(name,size),PDF.setCharacterSpacing((it.esp||0)*size),PDF.setTextMatrix(1,0,0,-1,it.x,it.y));
  if(it.contorno)ops.push(PDF.setTextRenderingMode(PDF.TextRenderingMode.FillAndOutline),PDF.setStrokingRgbColor(c[0],c[1],c[2]),PDF.setLineWidth(100));
  ops.push(PDF.showText(enc),PDF.endText(),PDF.popGraphicsState());
  ctx.page.pushOperators.apply(ctx.page,ops)
}
function desenharRet(ctx,it){
  var t=it.traco||{},c=rgb(t.cor||'#000000'),larg=t.larg||100,ops=[PDF.pushGraphicsState(),PDF.setStrokingRgbColor(c[0],c[1],c[2]),PDF.setLineWidth(larg),PDF.setLineCap(PDF.LineCapStyle.Butt)];
  if(t.tracejado)ops.push(PDF.setDashPattern([larg*2,larg*2],0));else ops.push(PDF.restoreDashPattern());
  if(it.rx>0)ops=ops.concat(roundRectOps(it.x,it.y,it.w,it.h,it.rx));else ops.push(PDF.rectangle(it.x,it.y,it.w,it.h));
  ops.push(PDF.stroke(),PDF.popGraphicsState());ctx.page.pushOperators.apply(ctx.page,ops)
}
function desenharLinha(ctx,it){
  var c=rgb(it.cor||'#000000');
  ctx.page.pushOperators(PDF.pushGraphicsState(),PDF.setStrokingRgbColor(c[0],c[1],c[2]),PDF.setLineWidth(it.larg||100),PDF.setLineCap(PDF.LineCapStyle.Butt),PDF.moveTo(it.x1,it.y1),PDF.lineTo(it.x2,it.y2),PDF.stroke(),PDF.popGraphicsState())
}
function desenharImg(ctx,it){
  if(!ctx.sig)return;
  var key=ctx.pageIndex+'|sig',name=ctx.sigNames[key];
  if(!name){name=ctx.page.node.newXObject('Signature',ctx.sig.ref);ctx.sigNames[key]=name}
  ctx.page.pushOperators(PDF.pushGraphicsState(),PDF.translate(it.x,it.y+it.h),PDF.scale(it.w,-it.h),PDF.drawObject(name),PDF.popGraphicsState())
}
function desenharFoto(ctx,it){
  var img=ctx.photoCache[it.n];if(!img)return;
  var key=ctx.pageIndex+'|'+it.n,name=ctx.photoNames[key];
  if(!name){name=ctx.page.node.newXObject('Photo'+it.n,img.ref);ctx.photoNames[key]=name}
  if(it.rot){
    /* MT-02/D-109: a imagem foi rasterizada na janela girada; no grupo em pé gira −90° em torno do centro. */
    var a=it.rot*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),cx=it.x+it.w/2,cy=it.y+it.h/2,iw=it.h,ih=it.w;
    ctx.page.pushOperators(PDF.pushGraphicsState(),
      PDF.concatTransformationMatrix(1,0,0,1,cx,cy),
      PDF.concatTransformationMatrix(ca,sa,-sa,ca,0,0),
      PDF.concatTransformationMatrix(1,0,0,1,-iw/2,ih/2),
      PDF.scale(iw,-ih),PDF.drawObject(name),PDF.popGraphicsState())
  }else ctx.page.pushOperators(PDF.pushGraphicsState(),PDF.translate(it.x,it.y+it.h),PDF.scale(it.w,-it.h),PDF.drawObject(name),PDF.popGraphicsState())
}
function desenharItens(ctx,itens){
  itens.forEach(function(it){
    if(it.t==='grupo'){ctx.page.pushOperators(PDF.pushGraphicsState(),PDF.concatTransformationMatrix(it.m[0],it.m[1],it.m[2],it.m[3],it.m[4],it.m[5]));desenharItens(ctx,it.itens);ctx.page.pushOperators(PDF.popGraphicsState())}
    else if(it.t==='texto')desenharTexto(ctx,it);
    else if(it.t==='ret')desenharRet(ctx,it);
    else if(it.t==='linha')desenharLinha(ctx,it);
    else if(it.t==='img')desenharImg(ctx,it);
    else if(it.t==='foto')desenharFoto(ctx,it)
  })
}
function fontesUsadas(paginas,a,b){
  var vistos={},arr=[];
  function walk(itens){itens.forEach(function(it){if(it.t==='texto'){var k=it.fonte.fam+'|'+it.fonte.peso+'|'+(it.fonte.it?1:0);if(!vistos[k]){vistos[k]=1;arr.push(it.fonte)}}else if(it.t==='grupo')walk(it.itens)})}
  for(var i=a;i<b;i++)walk(paginas[i].itens);
  return arr
}
function fotosUsadas(paginas,a,b){
  var vistos={},arr=[];
  function walk(itens){itens.forEach(function(it){if(it.t==='foto'&&!vistos[it.n]){vistos[it.n]=1;arr.push(it.n)}else if(it.t==='grupo')walk(it.itens)})}
  for(var i=a;i<b;i++)walk(paginas[i].itens);
  return arr
}
function construirDoc(paginas,p,jpegs,a,b,avisos,sinal){
  if(cancelado(sinal))return Promise.reject('abortado');
  return PDF.PDFDocument.create({updateMetadata:false}).then(function(doc){
    doc.registerFontkit(FK);
    doc.catalog.set(PDF.PDFName.of('ViewerPreferences'),doc.context.obj({PrintScaling:PDF.PDFName.of('None')}));
    var info=doc.getInfoDict();
    ['Producer','Creator','Title','Author','Subject','Keywords','CreationDate','ModDate'].forEach(function(k){info.delete(PDF.PDFName.of(k))});
    var ctx={doc:doc,photoCache:{},fontCache:{},fontNames:{},photoNames:{},sig:null,sigNames:{},avisos:avisos},jobs=[];
    fontesUsadas(paginas,a,b).forEach(function(f){
      var arq=arquivoFonte(f.fam,f.peso,f.it),url=BASE+'assets/fonts/pdf/'+arq,bytes=cacheBytes[url];
      if(!bytes)return;
      var nome=f.fam.replace(/[^A-Za-z0-9]/g,'')+'-'+f.peso+(f.it?'-Italico':''),h=0,k=nome;
      for(var i=0;i<k.length;i++)h=(h*33+k.charCodeAt(i))>>>0;
      var tag='';for(var j=0;j<6;j++){tag+=String.fromCharCode(65+h%26);h=Math.floor(h/26)}
      jobs.push(doc.embedFont(bytes,{subset:true,customName:tag+'+'+nome}).then(function(font){ctx.fontCache[f.fam+'|'+f.peso+'|'+(f.it?1:0)]={font:font,key:f.fam+'|'+f.peso+'|'+(f.it?1:0)}}))
    });
    fotosUsadas(paginas,a,b).forEach(function(n){var bytes=jpegs[n];if(bytes)jobs.push(doc.embedJpg(bytes).then(function(img){ctx.photoCache[n]=img}))});
    if(p.s.assin&&cacheBytes[SIGURL])jobs.push(doc.embedPng(cacheBytes[SIGURL]).then(function(img){ctx.sig=img}).catch(function(){ctx.sig=null;registrarAviso(ctx.avisos,'AssinaturaIndisponivel',null,null)}));
    return Promise.all(jobs).then(function(){
      for(var i=a;i<b;i++){
        if(cancelado(sinal))return Promise.reject('abortado');
        var pg=paginas[i],page=doc.addPage([mm2pt(pg.w/1000),mm2pt(pg.h/1000)]),S=72/25.4/1000,H=mm2pt(pg.h/1000);
        page.pushOperators(PDF.pushGraphicsState(),PDF.concatTransformationMatrix(S,0,0,-S,0,H));
        ctx.page=page;ctx.pageIndex=i;desenharItens(ctx,pg.itens);
        page.pushOperators(PDF.popGraphicsState())
      }
      return doc.save()
    })
  })
}
function construirVolumes(L,p,jpegs,lim,avisos,sinal){
  var limB=lim>0?lim*1024*1024:0;
  function faixa(a,b){
    if(cancelado(sinal))return Promise.reject('abortado');
    return construirDoc(L.paginas,p,jpegs,a,b,avisos,sinal).then(function(bytes){
      if(cancelado(sinal))return Promise.reject('abortado');
      if(limB&&bytes.length>limB&&b-a>1){var m=Math.floor((a+b)/2);return Promise.all([faixa(a,m),faixa(m,b)]).then(function(ps){return ps[0].concat(ps[1])})}
      return[{a:a,b:b,bytes:bytes}]
    })
  }
  return faixa(0,L.paginas.length).then(function(fs){return fs.map(function(x,i){return{nome:fs.length===1?'Polar-Life.pdf':'Polar-Life-'+pad(i+1,3)+'.pdf',bytes:x.bytes}})})
}
function preparar(p,avisos){
  var jobs=[],vistos={};
  function add(fam,peso,it){var k=fam+'|'+peso+'|'+(it?1:0);if(vistos[k])return;vistos[k]=1;jobs.push(carregarFonte(fam,peso,it,avisos))}
  if(p.leg){var a=estiloObj(p.leg.txt);add(a.fam,a.peso,a.it);var b=estiloObj(p.leg.data);add(b.fam,b.peso,b.it);var c=estiloObj(p.leg.loc);add(c.fam,c.peso,c.it);add('IBM Plex Mono',400,false)}
  else{add('Caveat',500,false);add('IBM Plex Mono',400,false)}
  if(p.s.rodape)add('IBM Plex Mono',400,false);
  if(p.s.assin)jobs.push(carregarBytes(SIGURL).catch(function(){registrarAviso(avisos,'AssinaturaIndisponivel',null,null);return null}));
  return Promise.all(jobs)
}
function pdf(proj,opcoes,cb){
  opcoes=opcoes||{};
  var f=opcoes.f==='leve'?'leve':'pdf',ppi=f==='leve'?300:326,q=f==='leve'?.72:.92,lim=opcoes.lim==null?150:opcoes.lim,sem=opcoes.sem||[],falhar=opcoes.falhar||[],sinal=opcoes.sinal;
  var p=JSON.parse(JSON.stringify(proj));
  if(sem.length)p.fotos=p.fotos.filter(function(x){return sem.indexOf(x.n)<0});
  var falhasSet={},falhas=[],avisos=[];falhar.forEach(function(n){falhasSet[n]=1});
  function abortado(){return sinal&&sinal.aborted}
  return preparar(p,avisos).then(function(){
    if(abortado())return Promise.reject('abortado');
    var L=lista(p);if(L.erro)return Promise.reject(new Error('NaoCabe'));
    if(!L.paginas.length)return Promise.reject(new Error('SemFolhas'));
    var N=L.paginas.length,jpegs={},idx=0;
    function coleta(itens,arr){itens.forEach(function(it){if(it.t==='foto'&&arr.indexOf(it.n)<0)arr.push(it.n);else if(it.t==='grupo')coleta(it.itens,arr)})}
    function folha(){
      if(abortado())return Promise.reject('abortado');
      if(idx>=N)return Promise.resolve();
      var ns=[];coleta(L.paginas[idx].itens,ns);
      var j=0;
      function prox(){
        if(abortado())return Promise.reject('abortado');
        if(j>=ns.length)return Promise.resolve();
        var n=ns[j++];
        if(falhasSet[n]){if(falhas.indexOf(n)<0)falhas.push(n);return prox()}
        return foto(p,n,ppi,q).then(function(r){jpegs[n]=r.bytes;return prox()},function(){if(falhas.indexOf(n)<0)falhas.push(n);return prox()})
      }
      return prox().then(function(){if(cb)cb({folha:idx+1,total:N,foto:ns.length});idx++;return folha()})
    }
    return folha().then(function(){if(abortado())return Promise.reject('abortado');falhas.sort(function(a,b){return a-b});return construirVolumes(L,p,jpegs,lim,avisos,sinal)})
  }).then(function(arquivos){return{arquivos:arquivos,falhas:falhas,avisos:avisos}})
}

window.PLGERADOR={projeto:projeto,lista:lista,foto:foto,pdf:pdf,preparar:preparar,medir:medir,metricas:metricas};
})();
