/* Lugares locais (D-139): municípios do Brasil, pontos turísticos por UF e países, tudo em arquivos do próprio site
   (site/assets/dados/locais/), carregados só quando preciso. Nada sai do aparelho (T5, CSP connect-src 'self'). */
(function(){
var SC=document.currentScript,BASE=SC&&SC.src?SC.src.replace(/js\/nucleo\/locais\.js[^\/]*$/,'dados/locais/'):'/assets/dados/locais/',cache={},carregando={};
var CFG={base:BASE,ler:null};   /* ler(nome) → Promise do JSON; os testes em Node trocam por leitura de disco */
function pegar(nome){
  if(cache[nome])return Promise.resolve(cache[nome]);
  if(carregando[nome])return carregando[nome];
  var p=(CFG.ler?CFG.ler(nome):fetch(CFG.base+nome,{credentials:'same-origin'}).then(function(r){if(!r.ok)throw new Error('sem '+nome);return r.json()}))
    .then(function(j){cache[nome]=j;delete carregando[nome];return j},function(){delete carregando[nome];return null});
  carregando[nome]=p;return p
}
function norm(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim()}
var IDX=null;
function municipios(){
  return pegar('municipios.json').then(function(d){
    if(!d)return null;
    if(!IDX)IDX={ufs:d.ufs,lista:d.m.map(function(m){return{c:m[0],uf:d.ufs[m[1]],lat:m[2],lon:m[3],n:norm(m[0])}})};
    return IDX
  })
}
/* buscar('bom jes') → [{cidade,uf}] · começa com o digitado primeiro, depois contém; homônimos aparecem um por UF */
function buscar(txt,max){
  var q=norm(txt),uf='';
  var mm=String(txt||'').match(/^(.*?)\s*[-,/]\s*([A-Za-z]{2})\s*$/);
  if(mm){q=norm(mm[1]);uf=mm[2].toUpperCase()}
  if(q.length<2)return Promise.resolve([]);
  return municipios().then(function(I){
    if(!I)return[];
    var a=[],b=[];
    I.lista.forEach(function(m){
      if(uf&&m.uf!==uf)return;
      if(m.n===q||m.n.indexOf(q)===0)a.push(m);else if(m.n.indexOf(q)>0)b.push(m)
    });
    a.sort(function(x,y){return(x.n===q?0:1)-(y.n===q?0:1)});
    return a.concat(b).slice(0,max||8).map(function(m){return{cidade:m.c,uf:m.uf}})
  })
}
function rotulo(r){return r?r.cidade+' - '+r.uf:''}
function dentro(x,y,ring){      /* ray casting; ring plano em décimos de grau */
  var ok=false,n=ring.length,i,j;
  for(i=0,j=n-2;i<n;j=i,i+=2){
    var xi=ring[i],yi=ring[i+1],xj=ring[j],yj=ring[j+1];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)ok=!ok
  }
  return ok
}
function paisDe(lat,lon){
  return pegar('paises.json').then(function(P){
    if(!P)return null;
    var x=lon*10,y=lat*10,i,k;
    for(i=0;i<P.length;i++)for(k=0;k<P[i].p.length;k++)if(dentro(x,y,P[i].p[k]))return{nome:P[i].n,cod:P[i].c};
    return null
  })
}
function dist(lat,lon,a,b){var x=(lat-a)*Math.PI/180,y=(lon-b)*Math.PI/180*Math.cos((lat+a)*Math.PI/360);return 6371*Math.sqrt(x*x+y*y)}
/* malha municipal (IBGE) por UF, em deltas de 1e-4 grau: decodifica uma vez e guarda em memória */
var MALHA={};
function malha(uf){
  if(MALHA[uf])return Promise.resolve(MALHA[uf]);
  return pegar('malha-'+uf+'.json').then(function(d){
    if(!d)return null;
    MALHA[uf]=d.m.map(function(m){return{c:m[0],uf:uf,polis:m[1].map(function(p){return p.map(function(a){var r=[],x=0,y=0,i;for(i=0;i<a.length;i+=2){x=i?x+a[i]:a[i];y=i?y+a[i+1]:a[i+1];r.push([x/1e4,y/1e4])}return r})})}});
    return MALHA[uf]
  })
}
function noAnel(x,y,r){var ok=false,i,j,a,b;for(i=0,j=r.length-1;i<r.length;j=i++){a=r[i];b=r[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])ok=!ok}return ok}
function contem(m,lat,lon){return m.polis.some(function(p){return noAnel(lon,lat,p[0])&&!p.slice(1).some(function(h){return noAnel(lon,lat,h)})})}
function distMalha(m,lat,lon){var d=1e9;m.polis.forEach(function(p){p[0].forEach(function(c){var k=dist(lat,lon,c[1],c[0]);if(k<d)d=k})});return d}
/* deCoordenadas → {cidade,uf,pais}: no Brasil, o município que contém o ponto (polígono do IBGE, só nas 3 UFs de centroide mais próximo);
   sem polígono que o contenha (costa, arredondamento), o município de borda mais próximo; fora do Brasil, só o país */
function deCoordenadas(lat,lon){
  lat=Number(lat);lon=Number(lon);
  if(!isFinite(lat)||!isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return Promise.resolve(null);
  return Promise.all([paisDe(lat,lon),municipios()]).then(function(r){
    var pais=r[0],I=r[1],br=pais&&pais.cod==='BRA',ord=[],ufs=[],m0=null,d0=1e9;
    if(I){ord=I.lista.map(function(c){return{c:c,d:dist(lat,lon,c.lat,c.lon)}}).sort(function(a,b){return a.d-b.d});
      if(ord.length){m0=ord[0].c;d0=ord[0].d}
      ord.slice(0,25).forEach(function(o){if(ufs.length<3&&ufs.indexOf(o.c.uf)<0)ufs.push(o.c.uf)})}
    if(!br&&!pais&&m0&&d0<=25)br=true;        /* costa: o polígono de 110 m é grosso; perto de município = Brasil */
    if(!(br&&m0))return{cidade:'',uf:'',pais:pais?pais.nome:''};
    return Promise.all(ufs.map(malha)).then(function(ms){
      var todos=[].concat.apply([],ms.filter(Boolean)),h=todos.filter(function(m){return contem(m,lat,lon)})[0];
      if(!h&&todos.length){var d=1e9;todos.forEach(function(m){var k=distMalha(m,lat,lon);if(k<d){d=k;h=m}})}
      return h?{cidade:h.c,uf:h.uf,pais:'Brasil'}:{cidade:m0.c,uf:m0.uf,pais:'Brasil'}
    })
  })
}
function pontosProximos(lat,lon,uf,raioKm){
  var raio=raioKm==null?2:raioKm;
  if(!uf)return Promise.resolve([]);
  return pegar('pontos-'+String(uf).toUpperCase()+'.json').then(function(L){
    if(!L)return[];
    return L.map(function(p){return{nome:p[0],lat:p[1],lon:p[2],municipio:p[3]||'',km:dist(lat,lon,p[1],p[2])}})
      .filter(function(p){return p.km<=raio}).sort(function(a,b){return a.km-b.km})
  })
}
window.PLLOCAIS={buscar:buscar,rotulo:rotulo,deCoordenadas:deCoordenadas,pontosProximos:pontosProximos,paisDe:paisDe,norm:norm,config:CFG};
})();
