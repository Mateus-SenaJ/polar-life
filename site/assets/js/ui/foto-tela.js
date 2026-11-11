/* PLFOTOTELA · foto real na tela (Quadro e Folhas) · MT-02 (o mesmo recorte do PDF) · T5 (tudo no aparelho)
   Fonte única de object URLs: cria, guarda e revoga. Também concentra os miniaturas, o estilo de recorte e o filtro de tela. */
(function(){
var LADO_MINI=512,MAX_CHEIAS=6,MAX_FILA=2;   /* mini com lado maior de 512 px · 6 fotos cheias · 2 miniaturas por vez */

/* ---------- filtros: os mesmos números do editor e do PDF (MT-02) ---------- */
var ID=[1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,1,0];
function mat(sat,con,br,rgb,off){ /* saturação → contraste → brilho → tom por canal */
  var lr=.2126,lg=.7152,lb=.0722,s=sat,rows=[[lr*(1-s)+s,lg*(1-s),lb*(1-s)],[lr*(1-s),lg*(1-s)+s,lb*(1-s)],[lr*(1-s),lg*(1-s),lb*(1-s)+s]],o=[];
  rgb=rgb||[1,1,1];off=off||0;
  for(var c=0;c<3;c++){var k=con*rgb[c];o=o.concat([rows[c][0]*k,rows[c][1]*k,rows[c][2]*k,0,.5*(1-con)*rgb[c]+br+off])}
  return o.concat([0,0,0,1,0])
}
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
function por(id){return FILTROS.filter(function(f){return f.id===id})[0]||FILTROS[0]}
function lerp(m,t){return m.map(function(v,i){return+(ID[i]+(v-ID[i])*t).toFixed(4)})}

/* ---------- object URLs das fotos (T5: nada sai do aparelho) ---------- */
var CHEIA={},ORDEM=[],MINI={},FALHOU={},PROM={},PMINI={};
var FILA=[],GERANDO=0,GER=0,PROJ=null;
function revoga(u){try{URL.revokeObjectURL(u)}catch(e){}}
function renova(src){var i=ORDEM.indexOf(src);if(i>=0){ORDEM.splice(i,1);ORDEM.push(src)}}
function descarta(){while(ORDEM.length>MAX_CHEIAS){var s=ORDEM.shift();if(s&&CHEIA[s]){revoga(CHEIA[s]);delete CHEIA[s];delete PROM[s]}}}
function limpar(){                       /* revoga tudo: sai da página, troca de projeto ou some da lista */
  GER++;
  Object.keys(CHEIA).forEach(function(s){revoga(CHEIA[s])});
  Object.keys(MINI).forEach(function(s){revoga(MINI[s])});
  CHEIA={};ORDEM=[];MINI={};FALHOU={};PROM={};PMINI={};FILA=[]
}
function confereProj(){                 /* trocou de projeto: as URLs do outro não valem mais */
  var a=(window.PLPROJETOS&&PLPROJETOS.atual)?(PLPROJETOS.atual()||''):'';
  if(PROJ===null){PROJ=a;return}
  if(a!==PROJ){PROJ=a;limpar()}
}
function url(src){
  confereProj();src=Number(src);
  if(CHEIA[src]){renova(src);return Promise.resolve(CHEIA[src])}
  if(PROM[src])return PROM[src];
  if(!window.PLFOTOS||!PLFOTOS.ler){FALHOU[src]=1;return Promise.resolve('')}
  var g=GER;
  PROM[src]=PLFOTOS.ler(src).then(function(r){
    if(g!==GER)return '';
    if(!r||!r.blob){FALHOU[src]=1;return ''}
    var u=URL.createObjectURL(r.blob);
    CHEIA[src]=u;ORDEM.push(src);descarta();
    return u
  },function(){FALHOU[src]=1;return ''});
  return PROM[src]
}
function mini(src,urgente){            /* miniatura reduzida: lado maior de 512 px, nunca amplia */
  confereProj();src=Number(src);
  if(MINI[src])return Promise.resolve(MINI[src]);
  if(PMINI[src])return PMINI[src];
  if(!window.PLFOTOS||!PLFOTOS.ler){FALHOU[src]=1;return Promise.resolve('')}
  var g=GER;
  PMINI[src]=new Promise(function(resolve){
    var t={src:src,g:g,res:resolve};
    if(urgente)FILA.unshift(t);else FILA.push(t);
    bombeia()
  });
  return PMINI[src]
}
function bombeia(){                    /* no máximo 2 miniaturas por vez */
  while(GERANDO<MAX_FILA&&FILA.length){
    var t=FILA.shift();
    (function(t){
      GERANDO++;
      gerar(t).then(function(u){t.res(u)},function(){t.res('')}).then(function(){GERANDO--;bombeia()})
    })(t)
  }
}
function gerar(t){
  if(t.g!==GER)return Promise.resolve('');
  return PLFOTOS.ler(t.src).then(function(r){
    if(t.g!==GER)return '';
    if(!r||!r.blob){FALHOU[t.src]=1;return ''}
    return reduzir(r.blob,r.w,r.h).then(function(bl){
      if(t.g!==GER||!bl)return '';
      var u=URL.createObjectURL(bl);MINI[t.src]=u;return u
    })
  },function(){FALHOU[t.src]=1;return ''})
}
function reduzir(blob,w,h){
  var W=Math.max(1,Math.round(w||1)),H=Math.max(1,Math.round(h||1));
  var k=Math.max(W,H)>LADO_MINI?LADO_MINI/Math.max(W,H):1;
  var rw=Math.max(1,Math.round(W*k)),rh=Math.max(1,Math.round(H*k)),p;
  try{p=createImageBitmap(blob,{imageOrientation:'from-image',resizeWidth:rw,resizeHeight:rh,resizeQuality:'medium'})}
  catch(e){p=Promise.reject(e)}
  return p.catch(function(){                       /* navegador sem resize: reduz no canvas */
    try{return createImageBitmap(blob,{imageOrientation:'from-image'})}
    catch(e){return Promise.reject(e)}
  }).then(function(bmp){
    var cv=document.createElement('canvas');
    cv.width=Math.min(bmp.width||rw,rw);cv.height=Math.min(bmp.height||rh,rh);
    var g=cv.getContext('2d');
    g.drawImage(bmp,0,0,cv.width,cv.height);
    if(bmp.close)bmp.close();
    return new Promise(function(res){cv.toBlob(function(bl){res(bl)},'image/jpeg',.8)})
  })
}
function tem(src,mini){                /* URL já pronta (síncrono) */
  confereProj();src=Number(src);
  if(mini)return MINI[src]||'';
  if(CHEIA[src]){renova(src);return CHEIA[src]}
  return ''
}
function falhou(src){return !!FALHOU[Number(src)]}
function html(u,vin,encaixe){
  if(!u)return '';
  var s='display:block;width:100%;height:100%'+(encaixe==='cover'?';object-fit:cover':'');
  var h='<img src="'+u+'" alt="" draggable="false" decoding="async" style="'+s+'">';
  if(vin>0)h+='<i aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 75% 75% at 50% 50%,rgba(0,0,0,0) 45%,#000 100%);opacity:'+(vin/100*.55)+'"></i>';
  return h
}
function estilo(dim,s,q){              /* recorte na tela: a mesma conta do PDF (MT-02) */
  var d=dim||{w:1,h:1},S=s||{},rot=S.rot||0,modo=S.modo||'preencher',z=S.z==null?100:S.z;
  var e=rot%180?{w:d.h,h:d.w}:d;
  var a=1/e.w,b=1/(q*e.h),base=modo==='encaixar'?Math.min(a,b):Math.max(a,b);
  var k=base*z/100;
  return 'width:'+d.w*k*100+'%;height:'+d.h*k*q*100+'%;left:'+(50+((S.px||0)+(S.ex||0))*100)+'%;top:'+(50+((S.py||0)+(S.ey||0))*100)+'%;transform:translate(-50%,-50%) rotate('+(S.ang||0)+'deg) scaleX('+(S.flip?-1:1)+') rotate('+rot+'deg)'
}
function ajustou(s){                   /* a foto tem ajuste próprio? */
  var a=(s&&s.adj)||{},f=s&&s.flt,k;
  for(k in a)if(a[k])return true;
  return !!(f&&f.id&&f.id!=='original')
}
function filtro(id,s){                 /* o filtro da tela: os 4 passos do #adj do Quadro (MT-02) */
  if(!ajustou(s))return '';
  var a=s.adj||{},f=s.flt||{id:'original',int:100};
  var c=a.contraste||0,fc=1+(c>=0?c/100:c/125),bo=(a.brilho||0)/100*.3,tr=1+(a.temp||0)/100*.15,tb=1-(a.temp||0)/100*.15,ic=.5*(1-fc)+bo;
  var sat=1+(a.saturacao||0)/100,A=1+(a.realces||0)/100*.25,E=1-(a.sombras||0)/100*.35;
  var m=lerp(por(f.id).m,(f.int==null?100:f.int)/100).join(' ');
  return '<filter id="'+id+'" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">'
   +'<feColorMatrix type="saturate" values="'+sat+'"/>'
   +'<feComponentTransfer><feFuncR type="linear" slope="'+(fc*tr)+'" intercept="'+ic+'"/><feFuncG type="linear" slope="'+fc+'" intercept="'+ic+'"/><feFuncB type="linear" slope="'+(fc*tb)+'" intercept="'+ic+'"/></feComponentTransfer>'
   +'<feComponentTransfer><feFuncR type="gamma" amplitude="'+A+'" exponent="'+E+'"/><feFuncG type="gamma" amplitude="'+A+'" exponent="'+E+'"/><feFuncB type="gamma" amplitude="'+A+'" exponent="'+E+'"/></feComponentTransfer>'
   +'<feColorMatrix type="matrix" values="'+m+'"/></filter>'
}
function manter(lista){                /* some da lista: a URL é revogada na hora */
  confereProj();
  var ok={};(lista||[]).forEach(function(s){ok[Number(s)]=1});
  Object.keys(CHEIA).forEach(function(s){if(!ok[s]){revoga(CHEIA[s]);delete CHEIA[s];delete PROM[s];var i=ORDEM.indexOf(+s);if(i>=0)ORDEM.splice(i,1)}});
  Object.keys(MINI).forEach(function(s){if(!ok[s]){revoga(MINI[s]);delete MINI[s];delete PMINI[s];delete FALHOU[s]}});
  FILA=FILA.filter(function(t){return !!ok[t.src]});
}
function ativos(){return{cheias:Object.keys(CHEIA).length,minis:Object.keys(MINI).length}}

/* ---------- sai da página: nada fica pendurado (T5) ---------- */
var LIMPOU=false;
window.addEventListener('pagehide',function(){LIMPOU=true;limpar()});
window.addEventListener('pageshow',function(e){if(e.persisted&&LIMPOU){LIMPOU=false;location.reload()}});

window.PLFOTOTELA={LADO_MINI:LADO_MINI,MAX_CHEIAS:MAX_CHEIAS,url:url,mini:mini,tem:tem,falhou:falhou,html:html,estilo:estilo,
  ID:ID,mat:mat,FILTROS:FILTROS,por:por,lerp:lerp,ajustou:ajustou,filtro:filtro,manter:manter,limpar:limpar,ativos:ativos};
})();
