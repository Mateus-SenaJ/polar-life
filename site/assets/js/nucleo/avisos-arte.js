/* PLAVISOSARTE · colagem dos avisos (D-208): 3 a 5 fotos da própria pessoa como polaroids brancas, com cantos levemente
   arredondados, sombra suave e leve rotação, sobre um degradê claro. Nunca contorno preto (D-207).
   Tudo no aparelho (T5): lê as cópias das fotos no IndexedDB («fotosProjeto»), reduz antes de desenhar e não envia nada.
   Serve à página (canvas) e ao service worker (OffscreenCanvas): por isso não usa document nem localStorage fora de teste. */
(function(){
'use strict';
var G=typeof window!=='undefined'?window:self;
var ANG=[-7,5,-3,7,-5],SOBE=[10,-6,4,-8,8];              /* rotação (graus) e desnível (‰ da altura) de cada polaroid */

function abrir(){ /* sem versão: só lê; se o banco ainda não existe, não cria as lojas de ninguém */
  return new Promise(function(ok){
    var r;try{r=indexedDB.open('polar-life')}catch(e){ok(null);return}
    r.onsuccess=function(){var d=r.result;if(!d.objectStoreNames.contains('fotosProjeto')){d.close();ok(null)}else ok(d)};
    r.onerror=function(){ok(null)}
  })
}
function lerFotos(chaves){ /* → [{blob,w,h}] na ordem pedida; a que faltar é pulada */
  return abrir().then(function(d){
    if(!d)return [];
    return new Promise(function(ok){
      var out=[],t=d.transaction('fotosProjeto','readonly'),s=t.objectStore('fotosProjeto');
      chaves.forEach(function(k,i){var g=s.get(k);g.onsuccess=function(){if(g.result&&g.result.blob)out[i]=g.result}});
      t.oncomplete=function(){d.close();ok(out.filter(Boolean))};
      t.onerror=t.onabort=function(){d.close();ok([])}
    })
  })
}
/* reduz na decodificação (lado maior ~ px): a foto de 12 MP nunca é desenhada inteira */
function decodificar(reg,px){
  var w=reg.w||0,h=reg.h||0,op={imageOrientation:'from-image'};
  if(w&&h){if(w>=h)op.resizeWidth=Math.max(1,Math.round(px*w/h));else op.resizeHeight=Math.max(1,Math.round(px*h/w));op.resizeQuality='medium'}
  if(G.createImageBitmap)return G.createImageBitmap(reg.blob,op).catch(function(){return G.createImageBitmap(reg.blob)}).catch(function(){return viaImg(reg.blob)});
  return viaImg(reg.blob)
}
function viaImg(blob){ /* navegador sem createImageBitmap: <img> com endereço temporário, liberado logo depois */
  return new Promise(function(ok){
    if(typeof Image==='undefined'||!G.URL){ok(null);return}
    var u=G.URL.createObjectURL(blob),im=new Image();
    im.onload=function(){G.URL.revokeObjectURL(u);ok(im)};
    im.onerror=function(){G.URL.revokeObjectURL(u);ok(null)};
    im.src=u
  })
}
function tela(w,h){
  if(typeof document!=='undefined'){var c=document.createElement('canvas');c.width=w;c.height=h;return c}
  return G.OffscreenCanvas?new G.OffscreenCanvas(w,h):null
}
function caixa(x,X,Y,W,H,r){
  x.beginPath();x.moveTo(X+r,Y);x.lineTo(X+W-r,Y);x.arcTo(X+W,Y,X+W,Y+r,r);x.lineTo(X+W,Y+H-r);x.arcTo(X+W,Y+H,X+W-r,Y+H,r);
  x.lineTo(X+r,Y+H);x.arcTo(X,Y+H,X,Y+H-r,r);x.lineTo(X,Y+r);x.arcTo(X,Y,X+r,Y,r);x.closePath()
}
function fundo(x,w,h){ /* degradê suave: claro, com um respiro de azul e de laranja da marca */
  var g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#FFFFFF');g.addColorStop(1,'#F8F9FA');x.fillStyle=g;x.fillRect(0,0,w,h);
  var a=x.createRadialGradient(w*0.12,h*0.1,0,w*0.12,h*0.1,Math.max(w,h)*0.7);a.addColorStop(0,'rgba(253,118,26,0.16)');a.addColorStop(1,'rgba(253,118,26,0)');x.fillStyle=a;x.fillRect(0,0,w,h);
  var b=x.createRadialGradient(w*0.9,h*0.95,0,w*0.9,h*0.95,Math.max(w,h)*0.75);b.addColorStop(0,'rgba(0,97,148,0.16)');b.addColorStop(1,'rgba(0,97,148,0)');x.fillStyle=b;x.fillRect(0,0,w,h)
}
function polaroid(x,img,cx,cy,pw,ang){ /* 88 × 107 (Clássico): foto quadrada, margem maior embaixo; nada por cima da foto (T4) */
  var ph=pw*107/88,m=pw*4.5/88,lado=pw-2*m,r=pw*0.035;
  x.save();x.translate(cx,cy);x.rotate(ang*Math.PI/180);
  x.shadowColor='rgba(0,0,0,0.20)';x.shadowBlur=pw*0.14;x.shadowOffsetY=pw*0.05;
  x.fillStyle='#FFFFFF';caixa(x,-pw/2,-ph/2,pw,ph,r);x.fill();
  x.shadowColor='rgba(0,0,0,0)';x.shadowBlur=0;x.shadowOffsetY=0;
  var iw=img.width,ih=img.height,s=Math.min(iw,ih),sx=(iw-s)/2,sy=(ih-s)/2;
  x.save();caixa(x,-pw/2+m,-ph/2+m,lado,lado,r*0.5);x.clip();
  x.drawImage(img,sx,sy,s,s,-pw/2+m,-ph/2+m,lado,lado);
  x.restore();x.restore()
}
/* escolhe até «max» chaves bem espalhadas pela lista (não só as primeiras) */
function escolher(chaves,max){
  var n=chaves.length,out=[],i;
  if(n<=max)return chaves.slice();
  for(i=0;i<max;i++)out.push(chaves[Math.round(i*(n-1)/(max-1))]);
  return out
}
/* desenha a colagem em w × h. Quadrada (miniatura da lista): até 3 fotos; 2:1 (notificação do sistema): até 5.
   Devolve a tela, ou null quando não há foto para mostrar. */
function desenhar(chaves,w,h){
  var larga=w>=h*1.5,max=larga?5:3,lista=escolher(chaves||[],max);
  if(!lista.length)return Promise.resolve(null);
  var ph=h*(larga?0.68:0.64),pw=ph*88/107;
  return lerFotos(lista).then(function(regs){
    return Promise.all(regs.map(function(r){return decodificar(r,Math.ceil(pw*1.5))}))
  }).then(function(imgs){
    imgs=imgs.filter(Boolean);
    var n=imgs.length,c,x,i,ordem=[],meio,passo;
    if(!n)return null;
    c=tela(w,h);if(!c)return null;
    x=c.getContext('2d');if(!x)return null;
    x.imageSmoothingQuality='high';
    fundo(x,w,h);
    meio=(n-1)/2;passo=n>1?Math.min(pw*0.74,(w-pw*1.4)/(n-1)):0;
    for(i=0;i<n;i++)ordem.push(i);
    ordem.sort(function(a,b){return Math.abs(b-meio)-Math.abs(a-meio)});     /* as de fora primeiro; a do meio fica por cima */
    ordem.forEach(function(k){
      polaroid(x,imgs[k],w/2+(k-meio)*passo,h/2+h*SOBE[k%5]/1000*(larga?2:3),pw,n===1?-3:ANG[k%5]);
    });
    imgs.forEach(function(im){if(im&&im.close)try{im.close()}catch(e){}});
    return c
  }).catch(function(){return null})
}
function paraBlob(c,tipo,q){
  if(!c)return Promise.resolve(null);
  if(c.convertToBlob)return c.convertToBlob({type:tipo||'image/jpeg',quality:q||0.85}).catch(function(){return null});
  return new Promise(function(ok){try{c.toBlob(function(b){ok(b)},tipo||'image/jpeg',q||0.85)}catch(e){ok(null)}})
}
/* endereço data: para a opção «image» da notificação (não depende de um blob: que pode ser liberado antes de o sistema ler) */
function paraDataUrl(c,q){
  if(!c)return Promise.resolve(null);
  if(c.toDataURL){try{return Promise.resolve(c.toDataURL('image/jpeg',q||0.82))}catch(e){return Promise.resolve(null)}}
  return paraBlob(c,'image/jpeg',q||0.82).then(function(b){
    if(!b)return null;
    return b.arrayBuffer().then(function(buf){
      var a=new Uint8Array(buf),s='',i;for(i=0;i<a.length;i+=8192)s+=String.fromCharCode.apply(null,a.subarray(i,i+8192));
      return 'data:image/jpeg;base64,'+btoa(s)})
  }).catch(function(){return null})
}
G.PLAVISOSARTE={desenhar:desenhar,paraBlob:paraBlob,paraDataUrl:paraDataUrl,escolher:escolher,LARGA:{w:720,h:360},MINI:{w:192,h:192}};
})();
