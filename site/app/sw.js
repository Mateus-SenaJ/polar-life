/* Service worker do editor (DOC-08 §7). Escopo /app/. Só guarda o código do app: páginas, CSS, JS, fontes e logos.
   Nenhuma foto, legenda ou projeto passa por aqui (ficam no IndexedDB, T5). Não toca em blob:, data: nem em outra origem. */
importScripts('sw-arquivos.js'); /* self.PL_VERSAO e self.PL_ARQUIVOS, gerados por tools/gerar-sw.mjs */
(function(){
'use strict';
var PREFIXO='polar-life-',NOME=PREFIXO+self.PL_VERSAO;
var RAIZ=new URL('../',self.registration.scope).href,ESCOPO=self.registration.scope;

function url(p){return new URL(p,ESCOPO).href}
function chave(u){var x=new URL(u);x.search='';x.hash='';return x.href}
function guardar(req,res){ /* só resposta boa da própria origem */
  if(!res||!res.ok||res.type!=='basic')return res;
  var c=res.clone();caches.open(NOME).then(function(ca){return ca.put(chave(req.url),c)}).catch(function(){});
  return res
}
function permitido(u){ /* só código do app: páginas de /app/ e ativos de /assets/ (css, js, img, fonts, vendor) */
  if(u.origin!==location.origin)return false;
  if(u.href.indexOf(ESCOPO)===0)return !/\/sw(-arquivos)?\.js$/.test(u.pathname);
  return u.href.indexOf(RAIZ+'assets/')===0&&/\.(css|js|png|svg|woff2?|ttf)$/.test(u.pathname)
}

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(NOME).then(function(ca){
    return Promise.all(self.PL_ARQUIVOS.map(function(a){
      var u=url(a);return fetch(new Request(u,{cache:'reload'})).then(function(r){if(r.ok)return ca.put(chave(u),r)}).catch(function(){})
    }))
  }))
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k.indexOf(PREFIXO)===0&&k!==NOME}).map(function(k){return caches.delete(k)}))
  }).then(function(){return self.clients.claim()}))
});
self.addEventListener('message',function(e){if(e.data&&e.data.tipo==='pular')self.skipWaiting()});

self.addEventListener('fetch',function(e){
  var req=e.request;if(req.method!=='GET')return;
  var u;try{u=new URL(req.url)}catch(x){return}
  if(u.protocol!=='http:'&&u.protocol!=='https:')return; /* blob:, data: */
  if(!permitido(u))return;
  if(req.headers.has('range')||/\.(mp4|webm)$/.test(u.pathname))return; /* vídeo (D-140): direto da rede, com pedidos parciais; não entra no cache */
  if(req.mode==='navigate'){ /* rede primeiro; offline abre a última versão */
    e.respondWith(fetch(req).then(function(r){return guardar(req,r)}).catch(function(){
      return caches.match(chave(req.url)).then(function(c){return c||caches.match(chave(url('./')))}).then(function(c){return c||Response.error()})
    }));return
  }
  if(req.destination==='script'||req.destination==='style'||/\.(js|css)$/.test(u.pathname)){ /* código: rede primeiro, como a página —
      senão, logo depois de publicar, a página nova rodaria com o JS/CSS antigo do cache; offline usa o cache */
    e.respondWith(fetch(req).then(function(r){return guardar(req,r)}).catch(function(){return caches.match(chave(req.url)).then(function(c){return c||Response.error()})}));return
  }
  e.respondWith(caches.match(chave(req.url)).then(function(c){ /* imagens e fontes: stale-while-revalidate; fonte/TTF não precarregada entra sob demanda */
    var rede=fetch(req).then(function(r){return guardar(req,r)}).catch(function(){return c||Response.error()});
    if(c)e.waitUntil(rede.catch(function(){}));
    return c||rede
  }))
});
})();
