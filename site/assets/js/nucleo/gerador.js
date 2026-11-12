/* T-30a · Motor do gerador de PDF · DOC-08 §6, MT-01 a MT-07
   Lê o projeto do sessionStorage, monta a display list em µm e desenha no PDF com pdf-lib + fontkit. */
(function(){
var FL=window.PLFOLHAS, LT=window.PLTEXTO, PDF=window.PDFLib, FK=window.fontkit;
var BASE=(function(){
  try{var u=new URL(document.currentScript.src);return u.origin+u.pathname.replace(/assets\/js\/nucleo\/gerador\.js$/,'')}catch(e){}
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
var LIMITE_AVISO=150*1024*1024;              /* D-152: acima disso o PDF é «grande» e a tela avisa */
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

function nat(src,real){return real?{w:real.w,h:real.h}:VERT[src]?{w:976,h:1300}:{w:1300,h:976}}
function efet(src,s,real){var a=nat(src,real);return s.rot%180?{w:a.h,h:a.w}:a}
function janela(fr){return fr.ori==='h'?{jw:fr.jh,jh:fr.jw}:{jw:fr.jw,jh:fr.jh}}   /* MT-02/D-109: janela já girada */
function jq(fr){var j=janela(fr);return j.jw/j.jh}
function base(src,s,fr,real){var e=efet(src,s,real),a=1/e.w,b=1/(jq(fr)*e.h);return s.modo==='encaixar'?Math.min(a,b):Math.max(a,b)}
function ppiFoto(src,s,fr,real){var j=janela(fr);return Math.round(1/(base(src,s,fr,real)*s.z/100)/j.jw*25.4)}

function filtroParams(a){
  var f=1+(a.contraste>=0?a.contraste/100:a.contraste/125),bo=a.brilho/100*.3,tr=1+a.temp/100*.15,tb=1-a.temp/100*.15,ic=.5*(1-f)+bo;
  return{sat:1+a.saturacao/100,slopes:[f*tr,f,f*tb],ic:ic,amp:1+a.realces/100*.25,exp:1-a.sombras/100*.35}
}
function cena(sr,vin){ /* mesma cena de exemplo do quadro.js (T-08) */
  var v=VERT[sr],a=nat(sr),o='<svg xmlns="http://www.w3.org/2000/svg" width="'+a.w+'" height="'+a.h+'" viewBox="0 0 '+(v?'300 400':'400 300')+'" preserveAspectRatio="none" aria-hidden="true"><rect width="'+(v?300:400)+'" height="'+(v?400:300)+'" fill="#fff"/>';
  if(v){var sx=60+(sr*47)%180;
    o+='<rect width="300" height="270" fill="#006194" opacity=".14"/><circle cx="'+sx+'" cy="110" r="28" fill="#FD761A"/><path d="M0 270L60 170L110 230L170 130L230 245L300 180V400H0Z" fill="#006194" opacity=".55"/><path d="M0 320L80 240L150 300L220 230L300 310V400H0Z" fill="#000" opacity=".85"/><rect y="362" width="300" height="38" fill="#000"/>'}
  else{var sx2=70+(sr*53)%260;
    o+='<rect width="400" height="200" fill="#006194" opacity=".14"/><circle cx="'+sx2+'" cy="92" r="26" fill="#FD761A"/><path d="M0 205L70 120L120 175L190 95L270 190L330 135L400 200V300H0Z" fill="#006194" opacity=".55"/><path d="M0 240L90 170L160 225L250 160L330 230L400 195V300H0Z" fill="#000" opacity=".85"/><rect y="262" width="400" height="38" fill="#000"/>'}
  if(vin>0)o+='<rect width="'+(v?300:400)+'" height="'+(v?400:300)+'" fill="url(#vg)" opacity="'+(vin/100*.55)+'"/>';
  return o+'</svg>'
}

/* Canvas reproduz a cadeia SVG uma unica vez para cena e foto real (MT-02). */
function aplicarAjustes(data,adj,flt){
  var p=data.data,fp=filtroParams(adj),m=lerp(por(flt.id).m,(flt.int==null?100:flt.int)/100),i,r,g,b,l,nr,ng,nb;
  for(i=0;i<p.length;i+=4){r=p[i]/255;g=p[i+1]/255;b=p[i+2]/255;l=.2126*r+.7152*g+.0722*b;r=l+(r-l)*fp.sat;g=l+(g-l)*fp.sat;b=l+(b-l)*fp.sat;r=Math.pow(Math.max(0,r*fp.slopes[0]+fp.ic),fp.exp)*fp.amp;g=Math.pow(Math.max(0,g*fp.slopes[1]+fp.ic),fp.exp)*fp.amp;b=Math.pow(Math.max(0,b*fp.slopes[2]+fp.ic),fp.exp)*fp.amp;nr=r*m[0]+g*m[1]+b*m[2]+m[4];ng=r*m[5]+g*m[6]+b*m[7]+m[9];nb=r*m[10]+g*m[11]+b*m[12]+m[14];p[i]=Math.max(0,Math.min(255,Math.round(nr*255)));p[i+1]=Math.max(0,Math.min(255,Math.round(ng*255)));p[i+2]=Math.max(0,Math.min(255,Math.round(nb*255)))}return data
}
function nitidez(data,valor){var s=data.data,o=new Uint8ClampedArray(s),w=data.width,h=data.height,n=valor/100*.5,x,y,c,i,a,b,d,e;for(y=0;y<h;y++)for(x=0;x<w;x++){i=(y*w+x)*4;for(c=0;c<3;c++){a=o[((y?y-1:0)*w+x)*4+c];b=o[(y*w+(x?x-1:0))*4+c];d=o[(y*w+(x<w-1?x+1:x))*4+c];e=o[((y<h-1?y+1:y)*w+x)*4+c];s[i+c]=Math.max(0,Math.min(255,o[i+c]*(1+4*n)-n*(a+b+d+e)))}}return data}
function imagemCena(src){return new Promise(function(ok,no){var u=URL.createObjectURL(new Blob([cena(src,0)],{type:'image/svg+xml'})),im=new Image();im.onload=function(){URL.revokeObjectURL(u);ok(im)};im.onerror=function(){URL.revokeObjectURL(u);no(new Error('Cena indisponivel'))};im.src=u})}
function semAjuste(adj,flt){var k;for(k in adj)if(adj[k])return false;return !(flt&&flt.id&&flt.id!=='original'&&(flt.int==null||flt.int>0))}
function rasterizar(f,fr,W,H,real,qualidade){
  var adj=Object.assign({},ADJ0,f.adj||{}),flt=Object.assign({id:'original',int:100},f.flt||{}),a=nat(f.src,real),k=base(f.src,f,fr,real)*f.z/100,bw=a.w*k*W,bh=a.h*k*W,cx=W*(.5+f.px),cy=H*(.5+f.py),fonte=real?createImageBitmap(real.blob,{imageOrientation:'from-image'}):imagemCena(f.src);
  return fonte.then(function(im){var cv=document.createElement('canvas');cv.width=W;cv.height=H;var g=cv.getContext('2d');g.fillStyle='#FFFFFF';g.fillRect(0,0,W,H);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.save();g.translate(cx,cy);g.rotate((f.ang||0)*Math.PI/180);g.scale(f.flip?-1:1,1);g.rotate((f.rot||0)*Math.PI/180);g.drawImage(im,-bw/2,-bh/2,bw,bh);if(adj.vinheta){/* MT-02: a vinheta acompanha o recorte, a rotação e a escala da foto. */g.save();g.scale(bw/2,bh/2);var gr=g.createRadialGradient(0,0,.675,0,0,1.5);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.45,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,'+(adj.vinheta/100*.55)+')');g.fillStyle=gr;g.fillRect(-1,-1,2,2);g.restore()}g.restore();if(!semAjuste(adj,flt)){var d=aplicarAjustes(g.getImageData(0,0,W,H),adj,flt);if((adj.nitidez||0)>0&&ppiFoto(f.src,f,fr,real)>=300)d=nitidez(d,adj.nitidez);g.putImageData(d,0,0)}   /* D-152: sem ajuste não há passada de pixels (sem perda extra) */if(im.close)im.close();return new Promise(function(ok,no){cv.toBlob(function(b){if(!b){no({n:f.n,motivo:'Falha ao gerar a imagem'});return}b.arrayBuffer().then(function(ab){ok({n:f.n,bytes:new Uint8Array(ab),wpx:W,hpx:H})},no)},'image/jpeg',qualidade)})})
}

function projeto(){
  var q=null;try{q=JSON.parse(sessionStorage.getItem('pl-quadro')||'null')}catch(e){}
  if(!(Array.isArray(q)&&q.length>=2&&q.slice(1).every(function(e){return e&&e.src>=1&&e.src<=400&&e.src%1===0})))q=null;
  var lista=[],txt={},meta={},leg=null,nome=null,fr={w:88,h:107,jh:76,lado:6,topo:6,rad:.4,ori:'v'};
  var real=LT.ehReal();   /* 44: projeto real → nada de exemplo */
  if(q){
    var g=q[0]||{},f0=g.fr;
    if(real)nome=g.nome||null;   /* o nome real do projeto no rodapé (L6) */
    if(f0&&f0.w>0&&f0.h>0&&f0.lado>0&&f0.w-2*f0.lado>0){fr={w:f0.w,h:f0.h,jh:f0.jh>0?f0.jh:f0.w-2*f0.lado,lado:f0.lado,topo:f0.topo==null?6:f0.topo,rad:f0.rad==null?.4:f0.rad,ori:f0.ori==='h'?'h':'v'}}
    if(g.leg&&g.leg.txt&&g.leg.data&&g.leg.loc)leg=LT.migrar(g.leg);   /* D-135/D-136: projeto antigo abre com os dados novos */
    q.slice(1).forEach(function(e,k){lista.push(e);if(typeof e.txt==='string')txt[k+1]=e.txt;if(e.meta&&typeof e.meta==='object')meta[k+1]=e.meta});
  }else{
    var l=null;try{l=JSON.parse(sessionStorage.getItem('pl-fotos')||'null')}catch(e){}
    if(!(Array.isArray(l)&&l.length>=1&&l.length<=400&&l.every(function(x){return x>=1&&x<=400&&x%1===0}))){l=[];for(var i=1;i<=24;i++)l.push(i)}   /* sem lista: projeto de exemplo (DOC-04 §6) */
    l.forEach(function(sr){var e=novo(sr);if(!real&&sr===3){e.adj.realces=-20;e.adj.sombras=25;e.adj.vinheta=15}if(!real&&sr===12)e.z=233;lista.push(e)})
  }
  var f1=!q&&window.PLFOLHAS&&PLFOLHAS.formatoInicial?PLFOLHAS.formatoInicial():null,pocket=!!f1&&f1.fmt==='pocket'; /* D-159/D-113: saiu do T-02 sem gravar a moldura */
  if(f1)fr={w:f1.w,h:f1.h,jh:f1.jh,lado:f1.lado,topo:f1.topo,rad:f1.rad,ori:'v'};
  if(pocket&&!leg)leg=LT.legPocket(LT.LEG0);
  if(!leg&&real)leg=LT.legInicial();   /* D-149: projeto real sem legenda salva = Localização · Data */
  var fotos=lista.map(function(e,k){
    var src=e.src;
    return{n:k+1,src:src,v:real?false:!!VERT[src],leg:txt[k+1]!==undefined?txt[k+1]:(e.txt!=null?e.txt:(real?'':LT.LEG[(src-1)%4])),m:meta[k+1]||e.meta||null,pad:e.pad||null,pl:e.pl||null,
      modo:e.modo||'preencher',z:e.z==null?100:e.z,ang:e.ang||0,px:e.px||0,py:e.py||0,rot:e.rot||0,flip:!!e.flip,
      adj:Object.assign({},ADJ0,e.adj||{}),flt:Object.assign({id:'original',int:100},e.flt||{})}
  });
  fr.jw=fr.w-2*fr.lado;fr.jh=fr.jh>0?fr.jh:fr.jw;
  return{s:FL.ler(),fr:fr,fotos:fotos,leg:leg,real:real,nome:nome}
}

function rot2(g){var a=g*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return{a:c,b:s,c:-s,d:c,e:0,f:0}}
function mul(A,B){return{a:A.a*B.a+A.c*B.b,b:A.b*B.a+A.d*B.b,c:A.a*B.c+A.c*B.d,d:A.b*B.c+A.d*B.d,e:A.a*B.e+A.c*B.f+A.e,f:A.b*B.e+A.d*B.f+A.f}}
function matrizPolaroid(c,fr){
  /* MT-02/D-109: uma única rotação em torno do centro da célula; medidas da moldura em pé. */
  var cx=c.x+c.w/2,cy=c.y+c.h/2,ang=(fr.ori==='h'?(c.giro?0:Math.PI/2):(c.giro?Math.PI/2:0))+(c.rot||0)*Math.PI/180,ca=Math.cos(ang),sa=Math.sin(ang);
  var k=c.s||1,M=mul(mul(mul({a:1,b:0,c:0,d:1,e:cx*1000,f:cy*1000},{a:ca,b:sa,c:-sa,d:ca,e:0,f:0}),{a:k,b:0,c:0,d:k,e:0,f:0}),{a:1,b:0,c:0,d:1,e:-fr.w/2*1000,f:-fr.h/2*1000});   /* s: só o Coração reduz a polaroid (D-153) */
  return[r6(M.a),r6(M.b),r6(M.c),r6(M.d),Math.round(M.e),Math.round(M.f)]
}

/* ---------- fontes ---------- */
var SLUG={'Cormorant Garamond':'cormorant-garamond','Playfair Display':'playfair-display','IBM Plex Mono':'ibm-plex-mono','Courier Prime':'courier-prime','EB Garamond':'eb-garamond','Libre Baskerville':'libre-baskerville','Dancing Script':'dancing-script','Special Elite':'special-elite','Cutive Mono':'cutive-mono','Reenie Beanie':'reenie-beanie','Shadows Into Light':'shadows-into-light','Covered By Your Grace':'covered-by-your-grace','Over the Rainbow':'over-the-rainbow','La Belle Aurore':'la-belle-aurore','Homemade Apple':'homemade-apple','Patrick Hand':'patrick-hand'};
function slug(fam){if(SLUG[fam])return SLUG[fam];return String(fam).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function arquivoFonte(fam,peso,it){                      /* D-148: só variantes que existem (PLTEXTO.variante), nunca itálico ou negrito sintético */
  var v=LT.variante(fam,peso,!!it);
  return slug(fam)+'-'+v.w+(v.i?'-italico':'')+'.ttf'
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
  var fm=LT.famLG(o.font,o),fam=String(fm.f).split("'")[1]||o.font;
  return{fam:fam,peso:fm.w,it:!!fm.i,pt:o.pt||9,cor:LT.COR_LG[o.cor]||'#000',esp:o.esp||0,contorno:false}
}
function metricas(f){var ft=fonteDe(f);if(ft&&ft.unitsPerEm)return{asc:ft.ascent/ft.unitsPerEm,desc:Math.abs(ft.descent)/ft.unitsPerEm,cap:ft.capHeight!=null?Math.abs(ft.capHeight)/ft.unitsPerEm:.7};return{asc:.8,desc:.2,cap:.7}}
function medirLeg(o){return metricas(estiloObj(o))}          /* D-113 · MT-02: métricas do PDF para PLTEXTO.linhas */
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
  var preset=leg?leg.preset:'simples',DF=LT.dadosFoto(f),capTxt,capEst,metaSegs=[],legOu,sepEst,dataTxt,locTxt;
  /* MT-01/MT-02: tudo em µm dentro desta função; fr e constantes entram em mm. */
  var L=mm(fr.lado),T=mm(fr.topo),JW=mm(fr.jw),JH=mm(fr.jh),GAP_FOTO=mm(2.2),GAP_META=mm(1.2);
  if(leg)leg=LT.comPadrao(leg,f);   /* D-139: padrão de 2 linhas (mesma função da tela e das Folhas) */
  if(leg&&leg.original){return []} /* D-135: só a foto e a moldura (sem apagar nada) */
  if(leg){
    legOu=leg;
    capTxt=leg.txt.on?LT.caixaLG(f.leg,leg.txt.caixa):'';
    capEst=estiloObj(leg.txt);capEst.esp=leg.txt.esp||0;
    var dataEst=estiloObj(leg.data),locEst=estiloObj(leg.loc);dataEst.esp=leg.data.esp!=null?leg.data.esp:.02;locEst.esp=leg.loc.esp!=null?leg.loc.esp:.02;   /* D-148: espaçamento avançado */
    dataTxt=leg._pad?leg._dt:(leg.data.on&&DF.d?LT.cxMeta(leg,LT.FMTD[leg.data.fmt||0](DF.d)):'');locTxt=leg._pad?leg._lc:(leg.loc.on&&DF.c?LT.cxMeta(leg,LT.localLG(leg.loc,DF.c)):'');
    sepEst={fam:'IBM Plex Mono',peso:400,it:false,pt:Math.max(dataEst.pt,locEst.pt),cor:'#000000',esp:.02,contorno:false};
    var segD={k:'data',txt:dataTxt,est:dataEst,box:preset==='calendario'},segL={k:'loc',txt:locTxt,est:locEst,box:false};
    metaSegs=((leg.ordem||'data-loc')==='loc-data'?[segL,segD]:[segD,segL]).filter(function(sg){return sg.txt})
  }else{
    legOu={original:false,al:'esq',meta:'junto',ordem:'data-loc',medida:'caixa',txt:{on:false},data:{on:true,font:'IBM Plex Mono',pt:2.5*72/25.4,fmt:0,cor:'preto'},loc:{on:true,font:'IBM Plex Mono',pt:2.5*72/25.4,cor:'preto',uf:'sigla',pais:'oculto',ocBR:true,sep:', ',ordem:'cidade'}};
    capTxt=f.leg||'';
    capEst={fam:'Caveat',peso:500,it:false,pt:5.2*72/25.4,cor:'#000000',esp:0,contorno:false};
    var metaEst={fam:'IBM Plex Mono',peso:400,it:false,pt:2.5*72/25.4,cor:'#000000',esp:.02,contorno:false};
    dataTxt=DF.d?LT.FMTD[0](DF.d):'';locTxt=DF.c?LT.localLG(LT.LOC0,DF.c):'';
    sepEst=metaEst;
    metaSegs=[{k:'data',txt:dataTxt,est:metaEst,box:false},{k:'loc',txt:locTxt,est:metaEst,box:false}].filter(function(sg){return sg.txt})
  }
  var SEP=LT.sepMeta(legOu);                                    /* D-149: separador escolhido */
  var junto=(legOu.meta||'junto')!=='linhas';                  /* D-113: juntas numa linha ou em linhas separadas */
  metaSegs.forEach(function(seg){var w=medir(seg.txt,seg.est);if(seg.box)w+=2*.4*tamUm(seg.est.pt)+520;seg.w=w});
  var capBox=preset==='etiqueta'||preset==='bilhete'||preset==='carimbo',capBorder=capBox?(preset==='carimbo'?530:260):0;
  var capSize,capPadX,capPadY,capTextW,capBoxW,capBoxH;
  function medirCap(){
    capSize=tamUm(capEst.pt);capPadX=capBox?.4*capSize:0;capPadY=capBox?.05*capSize:0;
    capTextW=capTxt?medir(capTxt,capEst):0;capBoxW=capTxt?capTextW+2*capPadX+2*capBorder:0;capBoxH=capTxt?1.1*capSize+2*capPadY+2*capBorder:0
  }
  medirCap();
  var capAvail=JW;                                        /* D-136: o texto é sempre abaixo, na largura da janela */
  if(leg&&leg.txt.fit&&capTxt){
    while(capBoxW>capAvail&&capEst.pt>8){capEst.pt=Math.max(8,capEst.pt-.25);medirCap()}
  }
  if(capTxt){                                                /* 30a/T4: não passa da figcaption; corta com «…» */
    var capMaxW=Math.max(0,capAvail-2*(capBorder+capPadX));
    if(medir(capTxt,capEst)>capMaxW+.01){capTxt=cortar(capTxt,capEst,capMaxW);medirCap()}
  }
  /* D-113 · MT-02: PLTEXTO.linhas é o único cálculo da posição da data e do local (lin em mm, sai em µm) */
  var LNS=LT.linhas(legOu,fr,medirLeg,{capTxt:!!capTxt,capBoxH:capBoxH/1000,temData:!!dataTxt,temLoc:!!locTxt});
  /* D-136 · MT-02: o alinhamento (esq|centro|dir) sai sempre de PLTEXTO.alinharX — a mesma função da tela */
  var al=legOu.al||'esq';
  function ax(wmm){return mm(LT.alinharX(al,fr.lado,fr.jw,wmm))}
  function segsDe(ln){return ln.k==='meta'?metaSegs:metaSegs.filter(function(sg){return sg.k===ln.k})}
  function largMeta(ln){                                     /* soma dos segmentos da linha (o « • » entra na conta) */
    var segs=segsDe(ln),w=0;
    segs.forEach(function(sg){w+=sg.w});
    if(junto&&ln.k==='meta'&&segs.length>1)w+=medir(SEP,sepEst);
    return w
  }
  function capItems(top,x){
    var arr=[],clip={x:Math.round(L),w:Math.round(JW)};
    if(capTxt){
      arr.push(texto(capTxt,x+capBorder+capPadX,linhaBase(top+capBorder+capPadY,capSize,capEst,1.1),capEst,preset==='contornada',top+capBorder+capPadY,1.1,clip));
      if(capBox)arr.push(ret(x,top,capBoxW,capBoxH,260,capEst.cor,capBorder,preset==='bilhete'));
    }
    return arr
  }
  function metaItems(ln,x){
    var arr=[],b=Math.round(ln.base*1000),topU=Math.round(ln.top*1000),mx=x,maxRight=L+JW,clip={x:Math.round(L),w:Math.round(JW)};
    var segs=segsDe(ln);
    segs.forEach(function(seg,i){
      if(mx>=maxRight)return;
      var avail=maxRight-mx,txt=seg.txt;
      if(seg.box){
        var size=tamUm(seg.est.pt),pad=2*.4*size+520,maxTxt=Math.max(0,avail-pad);
        if(medir(txt,seg.est)>maxTxt+.01)txt=cortar(txt,seg.est,maxTxt);
        var tw=medir(txt,seg.est),bw=Math.min(avail,tw+pad),bh=ln.lh*size+520,m=metricas(seg.est);
        var bTop=b-((ln.lh-(m.asc+m.desc))/2+m.asc)*size;       /* MT-02: borda inline compartilha o topo da caixa de linha */
        arr.push(ret(mx,bTop,bw,bh,260,seg.est.cor,260,false));
        arr.push(texto(txt,mx+260+.4*size,b,seg.est,false,topU,ln.lh,clip));
        mx+=bw
      }else{
        var w=medir(txt,seg.est);
        if(w>avail+1){txt=cortar(txt,seg.est,avail+1);w=medir(txt,seg.est)}   /* +1 µm: o arredondamento do x em µm não corta o texto */
        arr.push(texto(txt,mx,b,seg.est,false,topU,ln.lh,clip));
        mx+=w
      }
      if(junto&&ln.k==='meta'&&i<segs.length-1){                /* « • » só entre as duas partes da linha única */
        var sw=medir(SEP,sepEst);
        if(mx+sw<=maxRight){arr.push(texto(SEP,mx,b,sepEst,false,topU,ln.lh,clip));mx+=sw}
      }
    });
    return arr
  }
  var fim=function(){var u=LNS[LNS.length-1];return u?Math.round((u.top+u.lh*u.corpo)*1000):0}; /* fim da última caixa de linha */
  var grupos=[];
  var figTop=T+JH+GAP_FOTO,capX=ax(capBoxW/1000),items=capItems(figTop,capX),mItems=[];
  LNS.forEach(function(ln){mItems=mItems.concat(metaItems(ln,ax(largMeta(ln)/1000)))});
  if(preset==='carimbo'&&capTxt)items=[grupoRot(items,capX+capBoxW/2,figTop+capBoxH/2,-3)];
  grupos.push({itens:items.concat(mItems),figTop:figTop,figH:Math.max(capTxt?capBoxH:0,fim()-figTop)});
  var out=[];
  grupos.forEach(function(g){
    if(!leg||(!leg.dy&&!leg.inc)){out=out.concat(g.itens);return}
    var ox=L,oy=g.figTop+g.figH/2,dy=(leg.dy||0)*1000,inc=(leg.inc||0)*Math.PI/180,ca=Math.cos(inc),sa=Math.sin(inc);
    out.push({t:'grupo',m:[r6(ca),r6(sa),r6(-sa),r6(ca),Math.round(ox-ca*ox+sa*oy),Math.round(oy-sa*ox-ca*oy)],itens:g.itens})
  });
  return out
}

function itensPolaroid(c,proj){
  var fr=proj.fr,s=proj.s,f=c.f,itens=[];
  /* MT-02/D-109: foto() rasteriza a janela orientada; na horizontal o item gira −90° no grupo em pé
     para a imagem ficar de pé no papel. O grupo aplica giro da grade/orientação. */
  if(window.PLCOLAGEM&&PLCOLAGEM.ativa(s))itens.push({t:'cheio',x:0,y:0,w:mm(fr.w),h:mm(fr.h),cor:'#FFFFFF'});   /* na Colagem a moldura é branca sobre o fundo (CL-01) */
  itens.push({t:'foto',n:f.n,x:mm(fr.lado),y:mm(fr.topo),w:mm(fr.jw),h:mm(fr.jh),rot:fr.ori==='h'?-90:0});
  itens=itens.concat(layoutLegenda(f,fr,proj.leg,s));
  if(s.assin){var w=3.9*2.9,h=w*96/279,dir=LT.assinaturaPos(proj.leg,fr)==='dir'; /* D-129/D-136: canto oposto ao texto */
    itens.push({t:'img',x:mm(dir?fr.w-fr.lado-w:fr.lado),y:mm(fr.h-3-h),w:mm(w),h:mm(h),src:'assinatura'})}
  return itens
}
function corLinha(c){return c==='azul'?'#006194':c==='laranja'?'#FD761A':'#000000'}
function linhas(sh,p,s){
  var arr=[],W=mm(p.w),H=mm(p.h),cor=corLinha(s.cor);
  if(s.compr==='continua'){
    var xs={},ys={};
    sh.cells.forEach(function(c){var a=Math.round(c.x*100)/100,b=Math.round((c.x+c.w)*100)/100,d=Math.round(c.y*100)/100,e=Math.round((c.y+c.h)*100)/100;xs[a]=xs[a]||{l:0,r:0};xs[a].l=1;xs[b]=xs[b]||{l:0,r:0};xs[b].r=1;ys[d]=ys[d]||{t:0,b:0};ys[d].t=1;ys[e]=ys[e]||{t:0,b:0};ys[e].b=1});
    Object.keys(xs).forEach(function(x){var v=+x,o=xs[x].l&&!xs[x].r?-.075:xs[x].r&&!xs[x].l?.075:0;arr.push(linha(mm(v+o),0,mm(v+o),H,cor,150))});
    Object.keys(ys).forEach(function(y){var v=+y,o=ys[y].t&&!ys[y].b?-.075:ys[y].b&&!ys[y].t?.075:0;arr.push(linha(0,mm(v+o),W,mm(v+o),cor,150))})
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
      var x=q[0]+.075*q[2],y=q[1]+.075*q[3];
      if(q[2]<0)arr.push(linha(mm(x-ax),mm(y),mm(x),mm(y),cor,150));else arr.push(linha(mm(x),mm(y),mm(x+ax),mm(y),cor,150));
      if(q[3]<0)arr.push(linha(mm(x),mm(y-ay),mm(x),mm(y),cor,150));else arr.push(linha(mm(x),mm(y),mm(x),mm(y+ay),cor,150))
    })
  });
  return arr
}
function contornos(sh,fr){
  return sh.cells.map(function(c){return{t:'grupo',m:matrizPolaroid(c,fr),itens:[ret(44,44,mm(fr.w)-88,mm(fr.h)-88,0,'#000000',88,false)]}})
}
function rodape(i,N,p,s,nome){
  var txt=(nome||'Viagem · Serra 2026')+' · Folha '+(i+1)+' de '+N,f={fam:'IBM Plex Mono',peso:400,it:false,pt:2.2*72/25.4,cor:'#000000',esp:.04,contorno:false};
  var w=medir(txt.toUpperCase(),f),base=Math.max(1,s.margem/2-1.2),size=tamUm(f.pt),m=metricas(f),lh=m.asc+m.desc;
  /* MT-02: bottom é o fim da caixa de linha; a linha de base desconta meia-entrelinha e descendente. */
  var y=p.h*1000-mm(base)-(lh-(m.asc+m.desc))/2*size-m.desc*size;
  return texto(txt.toUpperCase(),(p.w*1000-w)/2,y,f,false)
}

function fundoItem(fd,p){
  var W=mm(p.w),H=mm(p.h),o={t:'fundo',tipo:fd.tipo,W:W,H:H};
  if(fd.tipo==='cor')o.cor=fd.cor;
  else if(fd.tipo==='gradiente'){var e=PLCOLAGEM.eixoGrad(p.w,p.h,fd.ang);o.cor=fd.cor;o.cor2=fd.cor2;o.eixo=[mm(e.x0),mm(e.y0),mm(e.x1),mm(e.y1)]}
  else{o.src=fd.src;o.px=fd.px;o.py=fd.py;o.suave=fd.suave}
  return o
}
function lista(proj){
  var s=proj.s,fr=proj.fr;
  if(s.guias&&s.contorno)throw new Error('InvariantError');
  var ext={w:fr.ori==='h'?fr.h:fr.w,h:fr.ori==='h'?fr.w:fr.h},R=FL.paginar(s,ext,proj.fotos);
  if(R.erro)return{paginas:[],erro:true,p:R.p};
  var col=!!(window.PLCOLAGEM&&PLCOLAGEM.ativa(s)),fd=col?PLCOLAGEM.fundo(s.colagem,proj.fotos,proj.real):null;
  var paginas=R.sheets.map(function(sh,i){
    var itens=[];
    if(col)itens.push(fundoItem(fd,R.p));   /* D-150: o fundo vem antes de tudo */
    sh.cells.forEach(function(c){itens.push({t:'grupo',m:matrizPolaroid(c,fr),itens:itensPolaroid(c,proj)});if(col)itens=itens.concat(contornos({cells:[c]},fr))});   /* Colagem: contorno de cada polaroid logo depois dela (sobreposição) */
    if(col){}else if(s.guias)itens=itens.concat(linhas(sh,R.p,s));else if(s.contorno)itens=itens.concat(contornos(sh,fr));
    if(s.rodape)itens.push(rodape(i,R.sheets.length,R.p,s,proj.nome));
    return{w:mm(R.p.w),h:mm(R.p.h),itens:itens}
  });
  return{paginas:paginas,erro:false,p:R.p}
}

/* ---------- foto · D-152: qualidade do PDF ---------- */
/* Lê só os cabeçalhos do JPEG (até o início dos dados): orientação EXIF, perfil ICC e componentes.
   O original só entra no PDF quando o PDF o mostra igual ao canvas: orientação 1, 3, 6 ou 8 (giros puros, pela matriz), sRGB (ou sem perfil), 8 bits, cinza ou RGB. */
function lerJpeg(a){
  var r={jpeg:false,orient:1,icc:false,srgb:true,comps:0,prec:8},p=2,m,n;
  if(!(a.length>4&&a[0]===255&&a[1]===216))return r;
  r.jpeg=true;
  while(p+4<=a.length){
    if(a[p]!==255){p++;continue}
    m=a[p+1];if(m===255){p++;continue}
    if(m===216||m===1||(m>=208&&m<=215)){p+=2;continue}
    n=(a[p+2]<<8)+a[p+3];if(n<2)break;
    if(m===225&&a[p+4]===69&&a[p+5]===120&&a[p+6]===105&&a[p+7]===102){      /* Exif: tag 0x0112 */
      var t=p+10,le=a[t]===73,u16=function(o){return le?a[o]|a[o+1]<<8:a[o]<<8|a[o+1]},u32=function(o){return le?(a[o]|a[o+1]<<8|a[o+2]<<16|a[o+3]<<24)>>>0:((a[o]<<24|a[o+1]<<16|a[o+2]<<8|a[o+3])>>>0)};
      if(u16(t+2)===42){var o=t+u32(t+4),c=u16(o),i;for(i=0;i<c;i++){var q=o+2+i*12;if(u16(q)===274){var v=u16(q+8);if(v>=1&&v<=8)r.orient=v}}}
    }
    if(m===226&&a[p+4]===73&&a[p+5]===67&&a[p+6]===67){                        /* ICC_PROFILE */
      r.icc=true;
      var desc='',k;for(k=p+18;k<Math.min(p+2+n,p+18+4096);k++)desc+=String.fromCharCode(a[k]);
      r.srgb=r.srgb&&/sRGB/i.test(desc)
    }
    if(m>=192&&m<=207&&m!==196&&m!==200&&m!==204){r.prec=a[p+4];r.comps=a[p+9];r.sof=m;break}
    if(m===218)break;
    p+=2+n
  }
  return r
}
/* BR-07/T5: o original vai sem EXIF, GPS, XMP, IPTC nem comentário. Mantém só o que decodifica a imagem (JFIF, Adobe, tabelas, quadro, dados); os dados da imagem seguem byte a byte (sem recompressão). */
function limparJpeg(a){
  var out=[a.subarray(0,2)],p=2,m,n;
  while(p+4<=a.length){
    if(a[p]!==255){p++;continue}
    m=a[p+1];if(m===255){p++;continue}
    if(m===216||m===1||(m>=208&&m<=215)){out.push(a.subarray(p,p+2));p+=2;continue}
    n=(a[p+2]<<8)+a[p+3];
    if(m===218){out.push(a.subarray(p));p=a.length;break}
    if(!((m>=225&&m<=237)||m===239||m===254))out.push(a.subarray(p,p+2+n));   /* some APP1 a APP13, APP15 e COM; fica APP0 e APP14 */
    p+=2+n
  }
  var t=0,i;out.forEach(function(x){t+=x.length});var r=new Uint8Array(t),o=0;out.forEach(function(x){r.set(x,o);o+=x.length});return r
}
/* D-174: perfil ICC do original (segmentos APP2 «ICC_PROFILE», em ordem). Na impressão profissional ele vai junto da foto no PDF. */
function iccDe(a){
  var partes=[],p=2,m,n;
  while(p+4<=a.length){
    if(a[p]!==255){p++;continue}
    m=a[p+1];if(m===255){p++;continue}
    if(m===216||m===1||(m>=208&&m<=215)){p+=2;continue}
    n=(a[p+2]<<8)+a[p+3];if(n<2||m===218)break;
    if(m===226&&n>16&&a[p+4]===73&&a[p+5]===67&&a[p+6]===67&&a[p+7]===95)partes.push({s:a[p+16],d:a.subarray(p+18,p+2+n)});
    p+=2+n
  }
  if(!partes.length)return null;
  var vistos={};partes=partes.filter(function(x){if(vistos[x.s])return false;vistos[x.s]=1;return true});   /* só o primeiro perfil completo, se houver mais de um */
  partes.sort(function(x,y){return x.s-y.s});
  var t=0;partes.forEach(function(x){t+=x.d.length});var r=new Uint8Array(t),o=0;partes.forEach(function(x){r.set(x.d,o);o+=x.d.length});
  return r.length>128&&r[36]===97&&r[37]===99&&r[38]===115&&r[39]===112?r:null      /* assinatura «acsp» */
}
var ORIG_MAX=700*1024*1024;                  /* teto de memória para originais lidos numa geração; acima disso reamostra */
function elegivelOriginal(f,real){
  if(!real||!real.blob||!/^image\/jpe?g$/i.test(real.blob.type||''))return false;
  return semAjuste(Object.assign({},ADJ0,f.adj||{}),Object.assign({id:'original',int:100},f.flt||{}))
}
function matOrig(f,fr,real,orient){                  /* pixel do original (y para baixo) → mm da janela (MT-02: o mesmo recorte do canvas) */
  var j=janela(fr),a=nat(f.src,real),k=base(f.src,f,fr,real)*f.z/100,sc=k*j.jw,r=function(g){var x=g*Math.PI/180;return{a:Math.cos(x),b:Math.sin(x),c:-Math.sin(x),d:Math.cos(x),e:0,f:0}};
  var M={a:1,b:0,c:0,d:1,e:j.jw*(.5+f.px),f:j.jh*(.5+f.py)};
  M=mul(M,r(f.ang||0));M=mul(M,{a:f.flip?-1:1,b:0,c:0,d:1,e:0,f:0});M=mul(M,r(f.rot||0));M=mul(M,{a:sc,b:0,c:0,d:sc,e:0,f:0});M=mul(M,{a:1,b:0,c:0,d:1,e:-a.w/2,f:-a.h/2});
  /* orientação EXIF 3, 6 e 8 são giros puros: o pixel cru (i,j) vai para o pixel orientado; 1 = identidade */
  var RW=orient===6||orient===8?a.h:a.w,RH=orient===6||orient===8?a.w:a.h,O=orient===6?{a:0,b:1,c:-1,d:0,e:RH,f:0}:orient===8?{a:0,b:-1,c:1,d:0,e:0,f:RW}:orient===3?{a:-1,b:0,c:0,d:-1,e:RW,f:RH}:{a:1,b:0,c:0,d:1,e:0,f:0};
  M=mul(M,O);
  return[M.a,M.b,M.c,M.d,M.e,M.f]
}
function foto(proj,n,ppi,qualidade){
  var f=null;
  for(var i=0;i<proj.fotos.length;i++)if(proj.fotos[i].n===n){f=proj.fotos[i];break}
  if(!f)return Promise.reject({n:n,motivo:'Foto não encontrada'});
  var fr=proj.fr,j=janela(fr);
  function raster(real){
    /* 'nativo' (Pro, D-131): na densidade do original, de 326 a 1200 PPI. 'alta': de 300 a 600 PPI, sem inventar pixel que o original não tem.
       número: PPI fixo (formato leve). */
    var nat=real?ppiFoto(f.src,f,fr,real):0,alvo;
    if(ppi==='nativo')alvo=real?Math.max(326,Math.min(nat,1200)):326;
    else if(ppi==='alta')alvo=real?(nat>=300?Math.min(nat,600):Math.max(nat,72)):326;
    else if(ppi==='fiel')alvo=real?Math.max(300,Math.min(nat,1200)):326;          /* D-174: impressão profissional */
    else alvo=ppi;
    var W=Math.round(j.jw/25.4*alvo),H=Math.round(j.jh/25.4*alvo);
    if(W<1||H<1)return Promise.reject({n:n,motivo:'Formato inválido'});
    var chave=[ppi,qualidade,W,H,JSON.stringify(f),real?real.w+'x'+real.h:'cena'].join('|');if(cacheFoto[chave])return Promise.resolve(cacheFoto[chave]);
    return rasterizar(f,fr,W,H,real,qualidade).then(function(r){r.dpi=Math.round(W/(j.jw/25.4));r.orig=null;cacheFoto[chave]=r;return r})}
  function gera(real){
    if((ppi==='nativo'||ppi==='fiel')&&elegivelOriginal(f,real)&&(proj._origBytes||0)<ORIG_MAX){
      var cab=real.blob.slice(0,262144);
      return cab.arrayBuffer().then(function(ab){
        var info=lerJpeg(new Uint8Array(ab));
        var perfilOk=info.srgb||(ppi==='fiel'&&info.comps===3);   /* D-174: no modo fiel o perfil amplo vai junto em vez de ser convertido */
        if(!info.jpeg||[1,3,6,8].indexOf(info.orient)<0||!perfilOk||(info.comps!==3&&info.comps!==1)||info.prec!==8)return raster(real);   /* outro perfil, orientação ou CMYK: o canvas converte */
        return real.blob.arrayBuffer().then(function(all){
          var cru=new Uint8Array(all),icc=ppi==='fiel'&&info.icc&&!info.srgb?iccDe(cru):null;
          if(ppi==='fiel'&&info.icc&&!info.srgb&&!icc)return raster(real);                 /* perfil ilegível: o canvas converte para sRGB */
          var lim=limparJpeg(cru);proj._origBytes=(proj._origBytes||0)+lim.length;
          return{n:f.n,bytes:lim,icc:icc,wpx:real.w,hpx:real.h,dpi:ppiFoto(f.src,f,fr,real),orig:{src:f.src,m:matOrig(f,fr,real,info.orient),w:info.orient===6||info.orient===8?real.h:real.w,h:info.orient===6||info.orient===8?real.w:real.h,orient:info.orient}}
        })
      })
    }
    return raster(real)
  }
  /* A foto local e decodificada uma por vez; o bitmap e fechado em rasterizar (DOC-08 §6). */
  if(window.PLFOTOS&&window.PLFOTOS.ler)return window.PLFOTOS.ler(f.src).then(function(real){return gera(real)});
  return gera(null)
}

/* fundo em foto da Colagem: cobre a folha (cover), com a posição escolhida; suavizar desfoca e clareia (D-151) */
function rasterFundo(it,pw,ph,real,qualidade){
  var B=PLCOLAGEM.blurMm(it.suave),Wc=pw+2*B,Hc=ph+2*B;
  var fonte=real?createImageBitmap(real.blob,{imageOrientation:'from-image'}):imagemCena(it.src);
  return fonte.then(function(im){
    var iw=im.width,ih=im.height,sw=Math.min(iw,ih*Wc/Hc),sh=sw*Hc/Wc,sx=(iw-sw)*it.px/100,sy=(ih-sh)*it.py/100;
    var dpi=Math.min(it.suave>0?150:300,sw/(Wc/25.4)),W=Math.max(1,Math.round(Wc/25.4*dpi)),H=Math.max(1,Math.round(Hc/25.4*dpi)),bpx=B/25.4*dpi;
    var cv=document.createElement('canvas');cv.width=W;cv.height=H;var g=cv.getContext('2d');
    g.fillStyle='#FFFFFF';g.fillRect(0,0,W,H);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    if(bpx>0&&'filter' in g){g.filter='blur('+bpx+'px)';g.drawImage(im,sx,sy,sw,sh,0,0,W,H);g.filter='none'}
    else if(bpx>0){var f=Math.max(1,bpx/2),t=document.createElement('canvas');t.width=Math.max(1,Math.round(W/f));t.height=Math.max(1,Math.round(H/f));t.getContext('2d').drawImage(im,sx,sy,sw,sh,0,0,t.width,t.height);g.drawImage(t,0,0,W,H)}
    else g.drawImage(im,sx,sy,sw,sh,0,0,W,H);
    if(it.suave>0){g.fillStyle='rgba(255,255,255,'+PLCOLAGEM.clareia(it.suave)+')';g.fillRect(0,0,W,H)}
    if(im.close)im.close();
    var ox=Math.round(bpx),oy=Math.round(bpx),Wp=Math.max(1,W-2*ox),Hp=Math.max(1,H-2*oy),o=document.createElement('canvas');o.width=Wp;o.height=Hp;o.getContext('2d').drawImage(cv,ox,oy,Wp,Hp,0,0,Wp,Hp);
    return new Promise(function(ok,no){o.toBlob(function(b){if(!b){no(new Error('Fundo indisponivel'));return}b.arrayBuffer().then(function(ab){ok({bytes:new Uint8Array(ab),wpx:Wp,hpx:Hp,dpi:Math.round(Wp/(pw/25.4))})},no)},'image/jpeg',qualidade)})
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
  var og=ctx.photoOrig[it.n];
  if(og){   /* D-152: JPEG original sem recomprimir; o recorte, a rotação e o espelho vão na matriz, com clip na janela (MT-02) */
    var B=it.rot?mul(mul({a:1,b:0,c:0,d:1,e:it.x+it.w/2,f:it.y+it.h/2},rot2(it.rot)),{a:1,b:0,c:0,d:1,e:-it.h/2,f:-it.w/2}):{a:1,b:0,c:0,d:1,e:it.x,f:it.y},iw=it.rot?it.h:it.w,ih=it.rot?it.w:it.h;
    var G=og.m,M=mul(mul({a:1000,b:0,c:0,d:1000,e:0,f:0},{a:G[0],b:G[1],c:G[2],d:G[3],e:G[4],f:G[5]}),{a:og.w,b:0,c:0,d:-og.h,e:0,f:og.h});
    ctx.page.pushOperators(PDF.pushGraphicsState(),PDF.concatTransformationMatrix(B.a,B.b,B.c,B.d,B.e,B.f),PDF.setFillingRgbColor(1,1,1),PDF.rectangle(0,0,iw,ih),PDF.clip(),PDF.endPath(),PDF.rectangle(0,0,iw,ih),PDF.fill(),
      PDF.concatTransformationMatrix(M.a,M.b,M.c,M.d,M.e,M.f),PDF.drawObject(name),PDF.popGraphicsState());
    return
  }
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
function desenharFundo(ctx,it){
  var W=it.W,H=it.H,c;
  if(it.tipo==='cor'){c=rgb(it.cor);ctx.page.pushOperators(PDF.pushGraphicsState(),PDF.setFillingRgbColor(c[0],c[1],c[2]),PDF.rectangle(0,0,W,H),PDF.fill(),PDF.popGraphicsState());return}
  if(it.tipo==='gradiente'){   /* sombreamento axial nativo: vetorial, sem faixas (D-152) */
    var cx=ctx.doc.context,a=rgb(it.cor),b=rgb(it.cor2),fn=cx.obj({FunctionType:2,Domain:[0,1],C0:a,C1:b,N:1});
    var sh=cx.obj({ShadingType:2,ColorSpace:PDF.PDFName.of('DeviceRGB'),Coords:it.eixo,Function:fn,Extend:[true,true]});
    var R=ctx.page.node.normalizedEntries().Resources,tab=R.lookupMaybe(PDF.PDFName.of('Shading'),PDF.PDFDict);
    if(!tab){tab=cx.obj({});R.set(PDF.PDFName.of('Shading'),tab)}
    var nome='Fundo'+ctx.pageIndex;tab.set(PDF.PDFName.of(nome),cx.register(sh));
    ctx.page.pushOperators(PDF.pushGraphicsState(),PDF.rectangle(0,0,W,H),PDF.clip(),PDF.endPath(),PDF.PDFOperator.of('sh',[PDF.PDFName.of(nome)]),PDF.popGraphicsState());return}
  if(!ctx.fundoImg)return;
  var nm=ctx.page.node.newXObject('Fundo',ctx.fundoImg.ref);
  ctx.page.pushOperators(PDF.pushGraphicsState(),PDF.translate(0,H),PDF.scale(W,-H),PDF.drawObject(nm),PDF.popGraphicsState())
}
function desenharItens(ctx,itens){
  itens.forEach(function(it){
    if(it.t==='fundo'){desenharFundo(ctx,it);return}
    if(it.t==='grupo'){ctx.page.pushOperators(PDF.pushGraphicsState(),PDF.concatTransformationMatrix(it.m[0],it.m[1],it.m[2],it.m[3],it.m[4],it.m[5]));desenharItens(ctx,it.itens);ctx.page.pushOperators(PDF.popGraphicsState())}
    else if(it.t==='texto')desenharTexto(ctx,it);
    else if(it.t==='cheio'){var cc=rgb(it.cor);ctx.page.pushOperators(PDF.pushGraphicsState(),PDF.setFillingRgbColor(cc[0],cc[1],cc[2]),PDF.rectangle(it.x,it.y,it.w,it.h),PDF.fill(),PDF.popGraphicsState())}
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
/* D-174: impressão profissional — cada foto leva o próprio perfil de cor (ICCBased): o original com o perfil da câmera
   (Display P3, Adobe RGB) e o restante com sRGB; o documento declara sRGB como condição de saída (OutputIntent). */
function somaIcc(u){for(var h=2166136261,i=0;i<u.length;i++){h^=u[i];h=Math.imul(h,16777619)}return (h>>>0).toString(16)+':'+u.length}
function marcarCor(doc,img,G,icc){
  if(!G)return Promise.resolve(img);
  return img.embed().then(function(){
    var x=doc.context.lookup(img.ref);if(!x||!x.dict)return img;
    if(String(x.dict.get(PDF.PDFName.of('ColorSpace')))!=='/DeviceRGB')return img;     /* cinza ou CMYK: como está */
    var cs=G.srgb;
    if(icc){var k=somaIcc(icc);if(!G.perfis[k])G.perfis[k]=doc.context.obj([PDF.PDFName.of('ICCBased'),doc.context.register(doc.context.flateStream(icc,{N:3}))]);cs=G.perfis[k]}
    x.dict.set(PDF.PDFName.of('ColorSpace'),cs);return img
  })
}
function construirDoc(paginas,p,jpegs,a,b,avisos,sinal,escala){
  if(cancelado(sinal))return Promise.reject('abortado');
  return PDF.PDFDocument.create({updateMetadata:false}).then(function(doc){
    doc.registerFontkit(FK);
    doc.catalog.set(PDF.PDFName.of('ViewerPreferences'),doc.context.obj({PrintScaling:PDF.PDFName.of('None'),PickTrayByPDFSize:true}));   /* tamanho real, papel pelo tamanho da página */
    var G=null;
    if(p._graf&&window.PLICC){
      var sref=doc.context.register(doc.context.flateStream(PLICC.srgb(),{N:3}));
      G={srgb:doc.context.obj([PDF.PDFName.of('ICCBased'),sref]),perfis:{}};
      doc.catalog.set(PDF.PDFName.of('OutputIntents'),doc.context.obj([doc.context.obj({Type:'OutputIntent',S:'GTS_PDFX',OutputConditionIdentifier:PDF.PDFString.of(PLICC.nome),Info:PDF.PDFString.of(PLICC.nome),DestOutputProfile:sref})]))
    }
    var info=doc.getInfoDict();
    ['Producer','Creator','Title','Author','Subject','Keywords','CreationDate','ModDate'].forEach(function(k){info.delete(PDF.PDFName.of(k))});
    var ctx={doc:doc,photoCache:{},photoOrig:{},fontCache:{},fontNames:{},photoNames:{},sig:null,sigNames:{},avisos:avisos,fundoImg:null},jobs=[],origEmb={};
    fontesUsadas(paginas,a,b).forEach(function(f){
      var arq=arquivoFonte(f.fam,f.peso,f.it),url=BASE+'assets/fonts/pdf/'+arq,bytes=cacheBytes[url];
      if(!bytes)return;
      var nome=f.fam.replace(/[^A-Za-z0-9]/g,'')+'-'+f.peso+(f.it?'-Italico':''),h=0,k=nome;
      for(var i=0;i<k.length;i++)h=(h*33+k.charCodeAt(i))>>>0;
      var tag='';for(var j=0;j<6;j++){tag+=String.fromCharCode(65+h%26);h=Math.floor(h/26)}
      jobs.push(doc.embedFont(bytes,{subset:true,customName:tag+'+'+nome}).then(function(font){ctx.fontCache[f.fam+'|'+f.peso+'|'+(f.it?1:0)]={font:font,key:f.fam+'|'+f.peso+'|'+(f.it?1:0)}}))
    });
    fotosUsadas(paginas,a,b).forEach(function(n){var r=jpegs[n];if(!r)return;
      if(r.orig){var k=r.orig.src;if(!origEmb[k])origEmb[k]=doc.embedJpg(r.bytes).then(function(img){return marcarCor(doc,img,G,r.icc||null)});jobs.push(origEmb[k].then(function(img){ctx.photoCache[n]=img;ctx.photoOrig[n]=r.orig}));return}   /* mesma foto em várias polaroids: um objeto só */
      jobs.push(doc.embedJpg(r.bytes).then(function(img){return marcarCor(doc,img,G,null)}).then(function(img){ctx.photoCache[n]=img}))});
    if(jpegs.fundo&&paginas.slice(a,b).some(function(pg){return pg.itens.some(function(it){return it.t==='fundo'&&it.tipo==='foto'})}))jobs.push(doc.embedJpg(jpegs.fundo.bytes).then(function(img){return marcarCor(doc,img,G,null)}).then(function(img){ctx.fundoImg=img}));
    if(p.s.assin&&cacheBytes[SIGURL])jobs.push(doc.embedPng(cacheBytes[SIGURL]).then(function(img){return marcarCor(doc,img,G,null)}).then(function(img){ctx.sig=img}).catch(function(){ctx.sig=null;registrarAviso(ctx.avisos,'AssinaturaIndisponivel',null,null)}));
    return Promise.all(jobs).then(function(){
      for(var i=a;i<b;i++){
        if(cancelado(sinal))return Promise.reject('abortado');
        var pg=paginas[i],page=doc.addPage([mm2pt(pg.w/1000),mm2pt(pg.h/1000)]),S=72/25.4/1000,H=mm2pt(pg.h/1000);
        page.pushOperators(PDF.pushGraphicsState(),PDF.concatTransformationMatrix(S,0,0,-S,0,H));
        if(escala)page.pushOperators(PDF.concatTransformationMatrix(escala.fx||1,0,0,escala.fy||1,0,0)); /* DOC-08 §6: origem da pagina */
        ctx.page=page;ctx.pageIndex=i;desenharItens(ctx,pg.itens);
        page.pushOperators(PDF.popGraphicsState())
      }
      return doc.save()
    })
  })
}
function construirVolumes(L,p,jpegs,lim,avisos,sinal,escala){
  var limB=lim>0?lim*1024*1024:0;
  function faixa(a,b){
    if(cancelado(sinal))return Promise.reject('abortado');
    return construirDoc(L.paginas,p,jpegs,a,b,avisos,sinal,escala).then(function(bytes){
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
  if(!p.nome&&p.real&&window.PLPROJETOS&&window.PLPROJETOS.atual&&window.PLPROJETOS.listar)   /* o nome do projeto no rodapé (L6) */
    jobs.push(PLPROJETOS.listar().then(function(a){var id=PLPROJETOS.atual();for(var i=0;i<a.length;i++)if(a[i].id===id){p.nome=a[i].nome;break}},function(){}));
  if(p.leg){var a=estiloObj(p.leg.txt);add(a.fam,a.peso,a.it);var b=estiloObj(p.leg.data);add(b.fam,b.peso,b.it);var c=estiloObj(p.leg.loc);add(c.fam,c.peso,c.it);add('IBM Plex Mono',400,false);
    (p.fotos||[]).forEach(function(f){var d=LT.comPadrao(p.leg,f);if(d&&d.data){[d.txt,d.data,d.loc].forEach(function(o){var e=estiloObj(o);add(e.fam,e.peso,e.it)})}})   /* D-149: o estilo de cada linha (fonte, negrito, itálico) também precisa estar carregado */
  }
  else{add('Caveat',500,false);add('IBM Plex Mono',400,false)}
  if(p.s.rodape)add('IBM Plex Mono',400,false);
  if(p.real&&window.PLFOTOS)jobs.push(Promise.all(p.fotos.map(function(f){return PLFOTOS.ler(f.src).catch(function(){return null})})).then(function(rs){ /* 44 · MT-02: mesma orientação e data reais que a tela */
    rs.forEach(function(r,i){if(!r)return;var f=p.fotos[i],iso=r.meta&&r.meta.iso||'';f.v=(r.h||0)>(r.w||0);if(!f.m)f.m={iso:iso,c:''};else if(!f.m.iso&&iso)f.m.iso=iso})}));
  if(p.s.assin)jobs.push(carregarBytes(SIGURL).catch(function(){registrarAviso(avisos,'AssinaturaIndisponivel',null,null);return null}));
  return Promise.all(jobs)
}
function pdf(proj,opcoes,cb){
  opcoes=opcoes||{};
  var plano=window.PLCONTA&&PLCONTA.plano?PLCONTA.plano():null,pro=!!(plano&&plano.id==='pro');
  var graf=opcoes.f==='grafica',f=opcoes.f==='leve'?'leve':'pdf',ppi=f==='leve'?300:graf?'fiel':(pro?'nativo':'alta'),q=f==='leve'?.72:graf?.98:(pro?.97:.95),lim=opcoes.lim==null?(pro?0:150):opcoes.lim,sem=opcoes.sem||[],falhar=opcoes.falhar||[],sinal=opcoes.sinal,escala=opcoes.escala;
  var p=JSON.parse(JSON.stringify(proj));p._graf=graf;
  if(sem.length)p.fotos=p.fotos.filter(function(x){return sem.indexOf(x.n)<0});
  var falhasSet={},falhas=[],avisos=[];falhar.forEach(function(n){falhasSet[n]=1});
  function abortado(){return sinal&&sinal.aborted}
  return preparar(p,avisos).then(function(){
    if(abortado())return Promise.reject('abortado');
    var L=lista(p);if(L.erro)return Promise.reject(new Error('NaoCabe'));
    if(!L.paginas.length)return Promise.reject(new Error('SemFolhas'));
    var N=L.paginas.length,jpegs={},idx=0,relat=[];
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
        return foto(p,n,ppi,q).then(function(r){jpegs[n]=r;relat.push({n:n,dpi:r.dpi,original:!!r.orig,wpx:r.wpx,hpx:r.hpx,bytes:r.bytes.length});return prox()},function(){if(falhas.indexOf(n)<0)falhas.push(n);return prox()})
      }
      return prox().then(function(){if(cb)cb({folha:idx+1,total:N,foto:ns.length});idx++;return folha()})
    }
    function fundoFoto(){
      var it=null;L.paginas.some(function(pg){return pg.itens.some(function(x){if(x.t==='fundo'&&x.tipo==='foto'){it=x;return true}})});
      if(!it)return Promise.resolve();
      var rd=window.PLFOTOS&&PLFOTOS.ler?PLFOTOS.ler(it.src):Promise.resolve(null);
      return rd.then(function(real){return rasterFundo(it,L.p.w,L.p.h,real,q)}).then(function(r){jpegs.fundo=r;relat.push({n:'fundo',dpi:r.dpi,original:false,wpx:r.wpx,hpx:r.hpx,bytes:r.bytes.length})},function(){avisos.push({motivo:'FundoIndisponivel',txt:null,fonte:null})})
    }
    return fundoFoto().then(folha).then(function(){if(abortado())return Promise.reject('abortado');falhas.sort(function(a,b){return a-b});return construirVolumes(L,p,jpegs,lim,avisos,sinal,escala)}).then(function(arq){return{arq:arq,relat:relat}})
  }).then(function(o){var tot=o.arq.reduce(function(t,x){return t+x.bytes.length},0);return{arquivos:o.arq,falhas:falhas,avisos:avisos,qualidade:o.relat,bytes:tot,grande:tot>LIMITE_AVISO}})
}

window.PLGERADOR={limparJpeg:limparJpeg,lerJpeg:lerJpeg,matOrig:matOrig,LIMITE_AVISO:LIMITE_AVISO,projeto:projeto,lista:lista,foto:foto,pdf:pdf,preparar:preparar,medir:medir,metricas:metricas,aplicarAjustes:aplicarAjustes};
})();
