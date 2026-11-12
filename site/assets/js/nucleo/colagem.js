/* PLCOLAGEM · Modo Colagem · DOC-06 §1/§4/§6, D-150 a D-152 · MT-01, MT-02
   Fonte única (tela = PDF) das posições das polaroids na Colagem e do fundo da folha. Tudo determinístico:
   mesmo projeto, mesma colagem (CL-07). Unidades em mm; a polaroid mantém a medida (D-133) em todos os layouts, exceto o Coração (D-153).
   Cada célula: {f, x, y, w, h, giro, rot, s}: caixa sem rotação (w × h), giro de 90° da grade, rot em graus e escala s (1; só o Coração reduz) em torno do centro. */
(function(){
var LAYOUTS=[
  {id:'grade',n:'Grade justa',d:'Polaroids encostadas, em linhas e colunas, no centro da folha.'},
  {id:'mosaico',n:'Mosaico em tijolo',d:'Linhas encaixadas, cada uma deslocada meia polaroid.'},
  {id:'espalhadas',n:'Espalhadas',d:'Polaroids soltas, com leve rotação e sobreposição.'},
  {id:'tira',n:'Tira',d:'Faixas de polaroids lado a lado, como uma tira de fotos.'},
  {id:'coracao',n:'Coração',d:'Polaroids menores formando um coração.',esc:true},
  /* D-195: layouts das colagens para as redes (DOC-06 §4). As polaroids diminuem por igual para caber (como no Coração, D-153) */
  {id:'mural',n:'Mural',d:'Grade com respiro entre as polaroids.',esc:true},
  {id:'capa',n:'Capa e destaques',d:'Uma polaroid grande e as outras menores embaixo.',esc:true},
  {id:'tempo',n:'Linha do tempo',d:'Uma polaroid de cada lado de um traço, na ordem das datas.',esc:true},
  {id:'varal',n:'Varal',d:'Polaroids penduradas num fio, presas com pregadores.',esc:true},
  {id:'cabine',n:'Tira vertical',d:'Polaroids empilhadas numa coluna, como na cabine de fotos.',esc:true}
];
var PADRAO={ativo:false,layout:'espalhadas',fundo:{tipo:'foto',cor:'#FFFFFF',cor2:'#F8F9FA',ang:135,foto:null,px:50,py:50,suave:40},peca:'A4',orient:'retrato',margem:3,fotos:null};
/* D-176: a Colagem tem tamanho próprio, separado do papel das Folhas de polaroids.
   D-195: tamanhos para as redes (DOC-06 §3): a imagem sai com os pixels de «rede», 4,5 px por mm (240 mm = 1080 px), sempre em pé */
var PECAS={A4:{n:'A4',w:210,h:297},A3:{n:'A3',w:297,h:420},A5:{n:'A5',w:148,h:210},'13x18':{n:'13 × 18 cm',w:130,h:180},'10x15':{n:'10 × 15 cm',w:100,h:150},'20x30':{n:'20 × 30 cm',w:200,h:300},'20x20':{n:'20 × 20 cm',w:200,h:200},
  r11:{n:'Quadrado 1:1',w:240,h:240,rede:{w:1080,h:1080}},r45:{n:'Retrato 4:5',w:240,h:300,rede:{w:1080,h:1350}},r916:{n:'Stories 9:16',w:240,h:1920/4.5,rede:{w:1080,h:1920}}};
var EPS=1e-6,G=4,SMIN=.25;     /* G: respiro entre polaroids nos layouts das redes (mm); SMIN: menor escala aceita */
function copia(o){return JSON.parse(JSON.stringify(o))}
function num(v,min,max,d){v=parseFloat(v);return isNaN(v)?d:Math.max(min,Math.min(max,v))}
function hex(v,d){return /^#[0-9a-f]{6}$/i.test(String(v||''))?String(v).toUpperCase():d}   /* a cor é conteúdo: qualquer #RRGGBB (DS-13) */
function norm(c){
  var d=copia(PADRAO),o=c&&typeof c==='object'?c:{},f=o.fundo&&typeof o.fundo==='object'?o.fundo:{};
  d.ativo=!!o.ativo;
  d.layout=LAYOUTS.some(function(l){return l.id===o.layout})?o.layout:d.layout;
  d.fundo.tipo=f.tipo==='cor'||f.tipo==='gradiente'||f.tipo==='foto'?f.tipo:d.fundo.tipo;
  d.fundo.cor=hex(f.cor,d.fundo.cor);d.fundo.cor2=hex(f.cor2,d.fundo.cor2);
  d.fundo.ang=Math.round(num(f.ang,0,360,d.fundo.ang))%360;
  d.fundo.foto=f.foto!=null&&f.foto%1===0&&f.foto>=1?+f.foto:null;
  d.fundo.px=num(f.px,0,100,50);d.fundo.py=num(f.py,0,100,50);d.fundo.suave=Math.round(num(f.suave,0,100,d.fundo.suave));
  d.peca=PECAS.hasOwnProperty(o.peca)?o.peca:'A4';d.orient=o.orient==='paisagem'&&!PECAS[d.peca].rede?'paisagem':'retrato';d.margem=num(o.margem,3,25,3);   /* D-195: imagem para as redes é sempre em pé */
  d.fotos=Array.isArray(o.fotos)?o.fotos.map(Number).filter(function(n,i,a){return n%1===0&&n>=1&&a.indexOf(n)===i}):null;   /* null = todas as fotos */
  return d
}
/* foto do fundo: a escolhida, se ainda estiver no projeto; senão a primeira (D-151) */
function fotoDeFundo(c,fotos){
  fotos=fotos||[];if(!fotos.length)return null;
  var a=norm(c).fundo.foto;
  for(var i=0;i<fotos.length;i++)if(fotos[i].src===a)return a;
  return fotos[0].src
}
/* fundo efetivo: foto sem foto no projeto vira branco */
function fundo(c,fotos,real){
  var f=norm(c).fundo,src=null;
  if(f.tipo==='foto'){if(real===false)return{tipo:'cor',cor:'#F8F9FA'};   /* projeto de exemplo não tem foto real */
    src=fotoDeFundo(c,fotos);if(src==null)return{tipo:'cor',cor:'#FFFFFF'}}
  return Object.assign({},f,{src:src})
}
/* gradiente de 2 cores com ângulo CSS (0° = para cima, 90° = para a direita): o mesmo eixo na tela (linear-gradient) e no PDF */
function eixoGrad(W,H,ang){
  var a=ang*Math.PI/180,sx=Math.sin(a),sy=-Math.cos(a),L=Math.abs(W*sx)+Math.abs(H*sy),cx=W/2,cy=H/2;
  return{x0:cx-sx*L/2,y0:cy-sy*L/2,x1:cx+sx*L/2,y1:cy+sy*L/2}
}
function blurMm(suave){return Math.round(suave)/100*3}        /* desfoque em mm de papel */
function clareia(suave){return Math.round(suave)/100*.55}     /* véu branco, 0 a 0,55 */

/* ---------- geometria ---------- */
/* Regra de sobreposição (D-153): nenhuma polaroid pode ter mais de 20% da área da FOTO coberta por outra que fique por cima.
   A janela da foto, sem conhecer a moldura, é estimada pela fração da polaroid que cobre as molduras do app (a do Pocket é a maior). */
var JAN={x0:.045,x1:.955,y0:.03,y1:.83},LIM=.2,KMAX=40;
function hash(i,s){var x=Math.imul(i+1,0x9E3779B1)^Math.imul(s+7,0x85EBCA6B);x^=x>>>15;x=Math.imul(x,0x2C1B3C6D);x^=x>>>12;x=Math.imul(x,0x297A2D39);x^=x>>>15;return(x>>>0)/4294967296}
function meia(w,h,g){var a=Math.abs(g)*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a);return{x:(w*ca+h*sa)/2,y:(w*sa+h*ca)/2}}   /* meia-caixa do retângulo girado */
function limita(cx,cy,w,h,g,A){var e=meia(w,h,g);return{cx:Math.max(A.x0+e.x,Math.min(A.x1-e.x,cx)),cy:Math.max(A.y0+e.y,Math.min(A.y1-e.y,cy))}}
function celula(cx,cy,w,h,rot,A,s){s=s||1;rot=Math.round(rot*100)/100;var q=limita(cx,cy,w*s,h*s,rot,A);return{x:q.cx-w/2,y:q.cy-h/2,w:w,h:h,giro:false,rot:rot,s:s}}
function dist(k,n){var b=Math.floor(k/n),e=k%n,o=[],i;for(i=0;i<n;i++)o.push(b+(i<e?1:0));return o}   /* k itens em n grupos, os primeiros um a mais */
function ang(c){return((c.giro?90:0)+(c.rot||0))*Math.PI/180}
function dentroDe(c,A,t){var e=meia((c.giro?c.h:c.w)*(c.s||1),(c.giro?c.w:c.h)*(c.s||1),(c.giro?90:0)+(c.rot||0))   /* a caixa da grade girada já vem trocada: a moldura é o inverso */,cx=c.x+c.w/2,cy=c.y+c.h/2;t=t||1e-6;
  return cx-e.x>=A.x0-t&&cx+e.x<=A.x1+t&&cy-e.y>=A.y0-t&&cy+e.y<=A.y1+t}
function noRet(px,py,c,fw,fh){                       /* o ponto está dentro da polaroid c (girada e reduzida)? */
  var s=c.s||1,a=ang(c),dx=px-(c.x+c.w/2),dy=py-(c.y+c.h/2),u=dx*Math.cos(a)+dy*Math.sin(a),v=-dx*Math.sin(a)+dy*Math.cos(a);
  return Math.abs(u)<=fw*s/2&&Math.abs(v)<=fh*s/2}
/* maior fração da foto coberta por polaroids que ficam por cima (as seguintes na lista). jan: janela em frações da polaroid */
function cobertura(cells,fw,fh,jan){
  jan=jan||JAN;var N=10,pior=0,i,j,a,b,n,cob;
  for(i=0;i<cells.length-1;i++){
    var c=cells[i],s=c.s||1,an=ang(c),ca=Math.cos(an),sa=Math.sin(an),cx=c.x+c.w/2,cy=c.y+c.h/2;n=0;cob=0;
    for(a=0;a<N;a++)for(b=0;b<N;b++){
      var u=(jan.x0+(jan.x1-jan.x0)*(a+.5)/N-.5)*fw*s,v=(jan.y0+(jan.y1-jan.y0)*(b+.5)/N-.5)*fh*s,px=cx+u*ca-v*sa,py=cy+u*sa+v*ca;n++;
      for(j=i+1;j<cells.length;j++)if(noRet(px,py,cells[j],fw,fh)){cob++;break}
    }
    pior=Math.max(pior,cob/n)
  }
  return pior}
function valido(cells,k,fw,fh,A){
  if(cells.length!==k)return false;
  var i;for(i=0;i<k;i++)if(!dentroDe(cells[i],A))return false;
  return cobertura(cells,fw,fh)<=LIM+.001}

var GR={ /* pos(k, A, fw, fh) devolve k células; a capacidade de cada layout é o maior k válido (cap, abaixo) */
grade:{
  melhor:function(A,fw,fh){
    var aw=A.x1-A.x0,ah=A.y1-A.y0;
    function g(giro){var w=giro?fh:fw,h=giro?fw:fh,c=Math.floor((aw+EPS)/w),r=Math.floor((ah+EPS)/h);return{c:c,r:r,n:c*r,w:w,h:h,giro:giro}}
    var a=g(false),b=g(true);return b.n>a.n?b:a},
  pos:function(k,A,fw,fh){
    var m=this.melhor(A,fw,fh);if(m.c<1)return[];
    var cols=Math.min(m.c,k),rows=Math.ceil(k/cols),o=[],i,cx=(A.x0+A.x1)/2,cy=(A.y0+A.y1)/2;
    for(i=0;i<k;i++){
      var r=Math.floor(i/cols),c=i%cols,n=r===rows-1?k-cols*(rows-1):cols;
      o.push({x:cx-n*m.w/2+c*m.w,y:cy-rows*m.h/2+r*m.h,w:m.w,h:m.h,giro:m.giro,rot:0,s:1})
    }
    return o}
},
mosaico:{
  pos:function(k,A,fw,fh){
    var aw=A.x1-A.x0,c=Math.floor((aw+EPS)/fw),r=Math.floor((A.y1-A.y0+EPS)/fh),larga=c>=1&&aw+EPS>=(c+.5)*fw;
    if(c<1||r<1)return[];
    function nl(i){return larga||c<2?c:(i%2===0?c:c-1)}
    var o=[],li,rest=k,cx=(A.x0+A.x1)/2,cy=(A.y0+A.y1)/2,lin=[];
    for(li=0;li<r&&rest>0;li++){var n=Math.min(nl(li),rest);lin.push(n);rest-=n}
    lin.forEach(function(n,l){
      var desl=larga&&c>=2?(l%2===0?-fw/4:fw/4):0,y=cy-lin.length*fh/2+l*fh,j;
      for(j=0;j<n;j++)o.push({x:cx+desl-n*fw/2+j*fw,y:y,w:fw,h:fh,giro:false,rot:0,s:1})
    });
    return o}
},
espalhadas:{
  MAXR:6,
  pos:function(k,A,fw,fh){
    var e=meia(fw,fh,this.MAXR),rx=(A.x1-A.x0)-2*e.x,ry=(A.y1-A.y0)-2*e.y,self=this,res=[];
    if(rx<0||ry<0)return[];
    var c0=Math.max(1,Math.min(k,Math.round(Math.sqrt(k*Math.max(rx,1)/Math.max(ry,1))))),opc=[c0,c0+1,c0-1].filter(function(c){return c>=1&&c<=k});
    opc.some(function(cols){
      var rows=Math.ceil(k/cols);
      return[1,.6,.3,0].some(function(jit){
        var px=cols>1?rx/(cols-1):0,py=rows>1?ry/(rows-1):0,mx=(A.x0+A.x1)/2,my=(A.y0+A.y1)/2,o=[],i;
        for(i=0;i<k;i++){
          var r=Math.floor(i/cols),c=i%cols,n=r===rows-1?k-cols*(rows-1):cols;
          var x=cols>1?A.x0+e.x+(c+(cols-n)/2)*px:mx,y=rows>1?A.y0+e.y+r*py:my;
          o.push(celula(x+(hash(i,5)-.5)*.22*(px||fw*.3)*jit,y+(hash(i,9)-.5)*.22*(py||fh*.3)*jit,fw,fh,(hash(i,3)-.5)*2*self.MAXR*(jit?1:.5),A))
        }
        res=o;return valido(o,k,fw,fh,A)
      })
    });
    return res}
},
tira:{
  MAXR:2,
  pos:function(k,A,fw,fh){
    var e=meia(fw,fh,this.MAXR),rx=(A.x1-A.x0)-2*e.x,ry=(A.y1-A.y0)-2*e.y,mx=(A.x0+A.x1)/2,my=(A.y0+A.y1)/2,res=[],t,self=this;
    if(rx<0||ry<0)return[];
    for(t=1;t<=k;t++){
      var ns=dist(k,t);
      var ok=[1,0].some(function(zz){
        var o=[],i=0,stepY=t>1?Math.min(fh*1.02,ry/(t-1)):0;
        ns.forEach(function(n,ti){
          var y=my+(ti-(t-1)/2)*stepY,stepX=n>1?Math.min(fw*1.02,rx/(n-1)):0,j;
          for(j=0;j<n;j++){var z=(i%2?1:-1);o.push(celula(mx+(j-(n-1)/2)*stepX,y+z*3*zz,fw,fh,z*self.MAXR*(zz?1:0),A));i++}
        });
        res=o;return valido(o,k,fw,fh,A)
      });
      if(ok)return res
    }
    return res}
},
coracao:{
  N:720,equilibrar:true,
  curva:function(){                       /* coração paramétrico: da ponta de baixo e de volta a ela, com comprimento de arco acumulado */
    if(this._c)return this._c;
    var P=[],L=[0],i,t;
    for(i=0;i<=this.N;i++){t=Math.PI+i/this.N*2*Math.PI;P.push([16*Math.pow(Math.sin(t),3),13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t)]);if(i)L.push(L[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]))}
    return this._c={P:P,L:L,total:L[this.N]}},
  monta:function(k,A,fw,fh,s){
    var cv=this.curva(),e=meia(fw*s,fh*s,3),rx=(A.x1-A.x0)-2*e.x,ry=(A.y1-A.y0)-2*e.y;if(rx<0||ry<0)return[];
    var u=Math.min(rx/32,ry/29),cx=(A.x0+A.x1)/2,cy=(A.y0+A.y1)/2,o=[],i,j=0;      /* u: mm por unidade da curva */
    for(i=0;i<k;i++){
      var alvo=cv.total*i/k;while(j<this.N-1&&cv.L[j+1]<alvo)j++;
      var f=(alvo-cv.L[j])/Math.max(1e-9,cv.L[j+1]-cv.L[j]),X=cv.P[j][0]+(cv.P[j+1][0]-cv.P[j][0])*f,Y=cv.P[j][1]+(cv.P[j+1][1]-cv.P[j][1])*f;
      o.push(celula(cx+u*X,cy-u*(Y+2.5),fw,fh,i%2?3:-3,A,s))
    }
    return o},
  pos:function(k,A,fw,fh){
    if(k===1)return[celula((A.x0+A.x1)/2,(A.y0+A.y1)/2,fw,fh,0,A,1)];
    /* o coração só é reconhecível com as polaroids menores que o papel: reduz (de 70% a 30%) até a regra de sobreposição fechar */
    var s,o=[];
    for(s=.7;s>=.3-1e-9;s-=.02){o=this.monta(k,A,fw,fh,s);if(valido(o,k,fw,fh,A))return o}
    return o}
},
/* ---- D-195 · layouts das redes. A.smax: até quanto a polaroid pode crescer (2 nas imagens para as redes, 1 no papel) ---- */
mural:{max:16,equilibrar:true,
  pos:function(k,A,fw,fh){
    var aw=A.x1-A.x0,ah=A.y1-A.y0,sm=A.smax||1,b=null,c,r,s;
    for(c=1;c<=k;c++){r=Math.ceil(k/c);s=Math.min(sm,(aw-(c-1)*G)/(c*fw),(ah-(r-1)*G)/(r*fh));if(!b||s>b.s+1e-9)b={c:c,r:r,s:s}}
    if(!b||b.s<SMIN)return[];
    var W=fw*b.s,H=fh*b.s,cx=(A.x0+A.x1)/2,cy=(A.y0+A.y1)/2,tH=b.r*H+(b.r-1)*G,o=[],i;
    for(i=0;i<k;i++){var l=Math.floor(i/b.c),j=i%b.c,n=l===b.r-1?k-b.c*(b.r-1):b.c,tW=n*W+(n-1)*G;
      o.push({x:cx-tW/2+j*(W+G)+W/2-fw/2,y:cy-tH/2+l*(H+G)+H/2-fh/2,w:fw,h:fh,giro:false,rot:0,s:b.s})}
    return o}
},
capa:{max:9,equilibrar:true,
  pos:function(k,A,fw,fh){
    var aw=A.x1-A.x0,ah=A.y1-A.y0,sm=A.smax||1,cx=(A.x0+A.x1)/2,cy=(A.y0+A.y1)/2,o=[],i;
    if(k===1){var s1=Math.min(sm,aw/fw,ah/fh)*.97;return s1<SMIN?[]:[celula(cx,cy,fw,fh,0,A,s1)]}
    var n=k-1,rs=n<=4?1:2,cs=Math.ceil(n/rs),ss=Math.min(1,(aw-(cs-1)*G)/(cs*fw)*.94,(ah*.36-(rs-1)*G)/(rs*fh)),hs=rs*fh*ss+(rs-1)*G;
    var sb=Math.min(sm,aw/fw*.96,(ah-hs-2*G)/fh*.98);
    if(sb<SMIN||ss<SMIN*.6)return[];
    var hb=fh*sb,y0=cy-(hb+2*G+hs)/2;
    o.push(celula(cx,y0+hb/2,fw,fh,-1,A,sb));                         /* a capa primeiro: as menores não ficam por baixo dela */
    for(i=0;i<n;i++){var l=Math.floor(i/cs),j=i%cs,m=l===rs-1?n-cs*(rs-1):cs,W=fw*ss,tW=m*W+(m-1)*G;
      o.push(celula(cx-tW/2+j*(W+G)+W/2,y0+hb+2*G+l*(fh*ss+G)+fh*ss/2,fw,fh,[-4,3,5,-2,4,-3,2,-5][i%8],A,ss))}
    return o}
},
tempo:{max:12,equilibrar:true,data:true,
  pos:function(k,A,fw,fh){
    var aw=A.x1-A.x0,ah=A.y1-A.y0,sm=A.smax||1,cx=(A.x0+A.x1)/2,cy=(A.y0+A.y1)/2,g=2*G,o=[],i;
    if(k===1){var s1=Math.min(sm,aw/fw,ah/fh)*.97;return s1<SMIN?[]:[celula(cx,cy,fw,fh,0,A,s1)]}
    /* em zigue-zague: vizinhas de lados opostos do traço; as do mesmo lado não se encostam (2 passos ≥ altura + 1,5 mm) */
    var s=Math.min(sm,(aw-g)/(2*fw)*.95,(ah-(k-1)*1.5)/(fh*(1+(k-1)/2))*.97);
    if(s<SMIN)return[];
    var W=fw*s,H=fh*s,st=Math.min((ah-H)/(k-1),H*.8),y0=cy-(H+(k-1)*st)/2;
    for(i=0;i<k;i++)o.push(celula(cx+(i%2?1:-1)*(g/2+W/2),y0+i*st+H/2,fw,fh,i%2?3:-3,A,s));
    return o}
},
varal:{max:8,equilibrar:true,
  pos:function(k,A,fw,fh){
    var aw=A.x1-A.x0,ah=A.y1-A.y0,sm=A.smax||1,b=null,t,n,s,FIO=6,SAG=4;
    for(t=1;t<=k;t++){n=Math.ceil(k/t);s=Math.min(sm,(aw-(n+1)*G)/(n*fw)*.95,(ah-t*(FIO+SAG)-(t-1)*G)/(t*fh)*.97);if(!b||s>b.s+1e-9)b={t:t,s:s}}
    if(!b||b.s<SMIN)return[];
    var H=fh*b.s,rowH=FIO+SAG+H,y=(A.y0+A.y1)/2-(b.t*rowH+(b.t-1)*G)/2,o=[],fios=[],i=0;
    dist(k,b.t).forEach(function(m,r){
      var f={y:y+r*(rowH+G)+FIO,sag:SAG,x0:A.x0,x1:A.x1},j;fios.push(f);
      for(j=0;j<m;j++){var x=A.x0+(j+.5)*aw/m;o.push(celula(x,yFio(f,x)-1.5+H/2,fw,fh,i%2?3:-3,A,b.s));i++}   /* o fio passa 1,5 mm abaixo da borda de cima, por trás da moldura */
    });
    o.fios=fios;return o}
},
cabine:{max:5,equilibrar:true,
  pos:function(k,A,fw,fh){
    var aw=A.x1-A.x0,ah=A.y1-A.y0,sm=A.smax||1,g=3,s=Math.min(sm,aw/fw*.98,(ah-(k-1)*g)/(k*fh)*.99);
    if(s<SMIN)return[];
    var H=fh*s,cx=(A.x0+A.x1)/2,y0=(A.y0+A.y1)/2-(k*H+(k-1)*g)/2,o=[],i;
    for(i=0;i<k;i++)o.push({x:cx-fw/2,y:y0+i*(H+g)+H/2-fh/2,w:fw,h:fh,giro:false,rot:0,s:s});
    return o}
}};
/* fio do varal: leve barriga no meio (parábola) */
function yFio(f,x){var c=(f.x0+f.x1)/2,u=(x-c)/((f.x1-f.x0)/2);return f.y+f.sag*(1-u*u)}
/* D-195: traços e pregadores da colagem (mm), na tela, no PDF e na imagem. «atras»: antes das polaroids; «frente»: depois.
   Nada passa sobre a foto (T4): o fio corre por trás das molduras; o pregador fica só na borda branca de cima. */
function decoDe(id,cells,A,fr){
  var d=[];
  if(id==='tempo'&&cells.length>1){
    var cx=(A.x0+A.x1)/2,ys=cells.map(function(c){return c.y+c.h/2});
    d.push({t:'linha',x1:cx,y1:Math.min.apply(null,ys),x2:cx,y2:Math.max.apply(null,ys),larg:.5,cor:'#000000',z:'atras'});
    ys.forEach(function(y){d.push({t:'cheio',x:cx-1.4,y:y-1.4,w:2.8,h:2.8,cor:'#000000',z:'frente'})})
  }
  if(id==='varal'&&cells.fios){
    cells.fios.forEach(function(f){var N=24,i,xa,xb;for(i=0;i<N;i++){xa=f.x0+(f.x1-f.x0)*i/N;xb=f.x0+(f.x1-f.x0)*(i+1)/N;d.push({t:'linha',x1:xa,y1:yFio(f,xa),x2:xb,y2:yFio(f,xb),larg:.45,cor:'#000000',z:'atras'})}});
    cells.forEach(function(c){var s=c.s||1,a=(c.rot||0)*Math.PI/180,h=c.h*s/2,tx=c.x+c.w/2+h*Math.sin(a),ty=c.y+c.h/2-h*Math.cos(a),borda=Math.max(.8,((fr&&fr.topo)||6)*s-.4);
      d.push({t:'cheio',x:tx-1.6,y:ty-3.2,w:3.2,h:3.2+Math.min(3,borda),cor:'#FD761A',z:'frente'})})
  }
  return d
}
/* Linha do tempo: na ordem das datas (as sem data vão no fim, na ordem do projeto) */
function porData(f){return f.map(function(x,i){return{x:x,i:i,d:x&&x.m&&x.m.iso||''}}).sort(function(a,b){return a.d&&b.d?(a.d<b.d?-1:a.d>b.d?1:a.i-b.i):a.d?-1:b.d?1:a.i-b.i}).map(function(o){return o.x})}

var MEMO={};
function rede(s){var c=s&&s.colagem?norm(s.colagem):s&&s.peca?norm(s):null;return c&&PECAS[c.peca].rede||null}   /* aceita a config da folha ou a da colagem */
function area(s,p){var m=s.margem;return{x0:m,y0:m,x1:p.w-m,y1:p.h-m,smax:rede(s)?2:1}}
function papel(s){return window.PLFOLHAS.papel(s)}
/* capacidade = maior k tal que todos os k' ≤ k têm posição válida (dentro da margem e com a regra de sobreposição) */
function capDe(id,A,fw,fh){
  var key=[id,fw,fh,A.x0,A.y0,A.x1,A.y1,A.smax||1].join('|');if(MEMO[key]!=null)return MEMO[key];
  var k=0,n,mx=Math.min(KMAX,GR[id].max||KMAX);for(n=1;n<=mx;n++){var c=GR[id].pos(n,A,fw,fh);if(valido(c,n,fw,fh,A))k=n;else break}
  return MEMO[key]=k}
function capacidade(s,fr){var c=norm(s.colagem),p=papel(s);return capDe(c.layout,area(s,p),fr.w,fr.h)}
function contar(s,fr,total){var c0=norm(s.colagem);if(c0.fotos)total=Math.min(total,c0.fotos.length);var cap=capacidade(s,fr);return cap<1?{folhas:0,porFolha:0,naoCabe:true}:{folhas:total>0?Math.ceil(total/cap):0,porFolha:cap,naoCabe:false}}
function paginar(s,fr,fotos){
  var c=norm(s.colagem);fotos=escolhidas(c,fotos||[]);
  var p=papel(s),A=area(s,p),L=GR[c.layout],cap=capDe(c.layout,A,fr.w,fr.h);
  if(cap<1)return{p:p,sheets:[],erro:true,g:{n:0,c:0,r:0,fw:fr.w,fh:fr.h,giro:false,cap:0},colagem:true};
  if(L.data)fotos=porData(fotos);
  var n=fotos.length,pg=n?Math.ceil(n/cap):0,sheets=[],k=0,ns=[],i;
  if(L.equilibrar)ns=pg?dist(n,pg):[];else for(i=0;i<pg;i++)ns.push(Math.min(cap,n-i*cap));   /* coração e os das redes: folhas equilibradas; os demais enchem uma folha antes da outra */
  ns.forEach(function(m){
    var raw=L.pos(m,A,fr.w,fr.h),dc=decoDe(c.layout,raw,A,fr),cells=raw.map(function(q,i){q.f=fotos[k+i];return q});k+=m;
    var sh={cells:cells,grupo:'',per:cap,parcial:m<cap};if(dc.length)sh.deco=dc;
    sheets.push(sh)
  });
  var maior=ns.reduce(function(t,m){return Math.max(t,m)},0);
  return{p:p,sheets:sheets,erro:false,g:{n:maior,c:maior,r:1,fw:fr.w,fh:fr.h,giro:false,cap:cap},colagem:true}
}
/* a caixa girada de cada célula está dentro da área impressa? (para os testes e para o pré-voo) */
function dentro(cell,p,margem){return dentroDe(cell,{x0:margem,y0:margem,x1:p.w-margem,y1:p.h-margem})}
/* D-176: só as fotos escolhidas para a colagem (null = todas), na ordem do projeto */
function escolhidas(c,fotos){if(!c.fotos)return fotos;return fotos.filter(function(f){var k=f&&typeof f==='object'?f.src:f;return c.fotos.indexOf(+k)>=0})}
/* D-176: a folha da Colagem sai da própria configuração, nunca do papel das Folhas (guias, rodapé e espaço não se aplicam) */
function config(d,c){
  c=norm(c);var P=window.PLFOLHAS&&PLFOLHAS.PAPEIS||{},q=PECAS[c.peca];
  var s={papel:P[c.peca]?c.peca:'custom',nome:q.n,w:q.w,h:q.h,orient:c.orient,margem:c.margem,gap:0,girar:false,align:'center',separar:false,guias:false,contorno:false,compr:d&&d.compr||'continua',cor:d&&d.cor||'preto',rodape:false,assin:d?d.assin!==false:true};
  s.colagem=Object.assign({},c,{ativo:true});return s
}
/* D-195 · «Colagens para as redes» (Início, DOC-06 §3/§4): cada modelo é uma configuração da Colagem; as fotos entram depois (D-188) */
var MODELOS=[
  {id:'mural',nome:'Mural do mês',frase:'Tudo o que cabe em nove quadros.',c:{peca:'r11',layout:'mural',margem:10,fundo:{tipo:'cor',cor:'#FFFFFF'}}},
  {id:'mesa',nome:'Mesa espalhada',frase:'Do jeito que ficaram na mesa.',c:{peca:'r11',layout:'espalhadas',margem:8,fundo:{tipo:'foto',suave:45}}},
  {id:'capa',nome:'Capa e destaques',frase:'Uma foto grande e as que vieram junto.',c:{peca:'r45',layout:'capa',margem:10,fundo:{tipo:'cor',cor:'#F8F9FA'}}},
  {id:'tempo',nome:'Linha do tempo',frase:'O mês, na ordem em que aconteceu.',c:{peca:'r45',layout:'tempo',margem:10,fundo:{tipo:'cor',cor:'#FFFFFF'}}},
  {id:'varal',nome:'Varal',frase:'Um varal para os dias de sol.',c:{peca:'r916',layout:'varal',margem:10,fundo:{tipo:'gradiente',cor:'#FFFFFF',cor2:'#F8F9FA',ang:180}}},
  {id:'tira',nome:'Tira',frase:'Quatro fotos, uma história só.',c:{peca:'r916',layout:'cabine',margem:14,fundo:{tipo:'cor',cor:'#000000'}}}
];
/* aplica um modelo sobre a colagem atual (mantém a escolha de fotos) e liga o Modo Colagem */
function comModelo(atual,id){
  var m=MODELOS.filter(function(x){return x.id===id})[0];if(!m)return norm(atual);
  var a=norm(atual),f=Object.assign({},PADRAO.fundo,m.c.fundo);
  return norm(Object.assign({},a,m.c,{ativo:true,fundo:f,fotos:a.fotos}))
}
window.PLCOLAGEM={PECAS:PECAS,config:config,escolhidas:escolhidas,LAYOUTS:LAYOUTS,PADRAO:PADRAO,norm:norm,fotoDeFundo:fotoDeFundo,fundo:fundo,eixoGrad:eixoGrad,blurMm:blurMm,clareia:clareia,
  capacidade:capacidade,contar:contar,paginar:paginar,dentro:dentro,cobertura:cobertura,JAN:JAN,LIM:LIM,ativa:function(s){return!!(s&&s.colagem&&s.colagem.ativo)},
  rede:rede,MODELOS:MODELOS,comModelo:comModelo};
})();
