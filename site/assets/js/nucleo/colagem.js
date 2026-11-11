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
  {id:'coracao',n:'Coração',d:'Polaroids menores formando um coração.'}
];
var PADRAO={ativo:false,layout:'espalhadas',fundo:{tipo:'foto',cor:'#FFFFFF',cor2:'#F8F9FA',ang:135,foto:null,px:50,py:50,suave:40}};
var EPS=1e-6;
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
}};

var MEMO={};
function area(s,p){var m=s.margem;return{x0:m,y0:m,x1:p.w-m,y1:p.h-m}}
function papel(s){return window.PLFOLHAS.papel(s)}
/* capacidade = maior k tal que todos os k' ≤ k têm posição válida (dentro da margem e com a regra de sobreposição) */
function capDe(id,A,fw,fh){
  var key=[id,fw,fh,A.x0,A.y0,A.x1,A.y1].join('|');if(MEMO[key]!=null)return MEMO[key];
  var k=0,n;for(n=1;n<=KMAX;n++){var c=GR[id].pos(n,A,fw,fh);if(valido(c,n,fw,fh,A))k=n;else break}
  return MEMO[key]=k}
function capacidade(s,fr){var c=norm(s.colagem),p=papel(s);return capDe(c.layout,area(s,p),fr.w,fr.h)}
function contar(s,fr,total){var cap=capacidade(s,fr);return cap<1?{folhas:0,porFolha:0,naoCabe:true}:{folhas:total>0?Math.ceil(total/cap):0,porFolha:cap,naoCabe:false}}
function paginar(s,fr,fotos){
  fotos=fotos||[];
  var c=norm(s.colagem),p=papel(s),A=area(s,p),L=GR[c.layout],cap=capDe(c.layout,A,fr.w,fr.h);
  if(cap<1)return{p:p,sheets:[],erro:true,g:{n:0,c:0,r:0,fw:fr.w,fh:fr.h,giro:false,cap:0},colagem:true};
  var n=fotos.length,pg=n?Math.ceil(n/cap):0,sheets=[],k=0,ns=[],i;
  if(L.equilibrar)ns=pg?dist(n,pg):[];else for(i=0;i<pg;i++)ns.push(Math.min(cap,n-i*cap));   /* coração: folhas equilibradas; os demais enchem uma folha antes da outra */
  ns.forEach(function(m){
    var cells=L.pos(m,A,fr.w,fr.h).map(function(q,i){q.f=fotos[k+i];return q});k+=m;
    sheets.push({cells:cells,grupo:'',per:cap,parcial:m<cap})
  });
  var maior=ns.reduce(function(t,m){return Math.max(t,m)},0);
  return{p:p,sheets:sheets,erro:false,g:{n:maior,c:maior,r:1,fw:fr.w,fh:fr.h,giro:false,cap:cap},colagem:true}
}
/* a caixa girada de cada célula está dentro da área impressa? (para os testes e para o pré-voo) */
function dentro(cell,p,margem){return dentroDe(cell,{x0:margem,y0:margem,x1:p.w-margem,y1:p.h-margem})}
window.PLCOLAGEM={LAYOUTS:LAYOUTS,PADRAO:PADRAO,norm:norm,fotoDeFundo:fotoDeFundo,fundo:fundo,eixoGrad:eixoGrad,blurMm:blurMm,clareia:clareia,
  capacidade:capacidade,contar:contar,paginar:paginar,dentro:dentro,cobertura:cobertura,JAN:JAN,LIM:LIM,ativa:function(s){return!!(s&&s.colagem&&s.colagem.ativo)}};
})();
