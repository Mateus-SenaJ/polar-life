/* Service worker do editor (DOC-08 §7). Escopo /app/. Só guarda o código do app: páginas, CSS, JS, fontes e logos.
   Nenhuma foto, legenda ou projeto passa por aqui (ficam no IndexedDB, T5). Não toca em blob:, data: nem em outra origem. */
importScripts('sw-arquivos.js'); /* self.PL_VERSAO e self.PL_ARQUIVOS, gerados por tools/gerar-sw.mjs */
try{importScripts('../assets/js/nucleo/avisos-arte.js')}catch(e){} /* self.PLAVISOSARTE: a colagem das lembranças, montada no aparelho (D-208) */
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

/* ---------- avisos (D-208, DOC-16) ----------
   A página (PLAVISOS) deixa no IndexedDB «polar-life-avisos» as preferências e os avisos dos próximos dias; aqui só se mostra.
   Regras: sem som (silent), fora do horário silencioso, no máximo 1 por dia, uma etiqueta por tipo. A colagem da lembrança é
   desenhada aqui mesmo, com as fotos do IndexedDB do aparelho: nenhuma foto vem do servidor nem vai para ele (T5). */
function agenda(gravar){
  return new Promise(function(ok){
    var r;try{r=indexedDB.open('polar-life-avisos',1)}catch(x){ok(null);return}
    r.onupgradeneeded=function(){r.result.createObjectStore('kv')};
    r.onerror=function(){ok(null)};
    r.onsuccess=function(){
      var d=r.result,t=d.transaction('kv',gravar?'readwrite':'readonly'),s=t.objectStore('kv'),g=gravar?s.put(gravar,'agenda'):s.get('agenda');
      t.oncomplete=function(){d.close();ok(gravar||g.result||null)};t.onerror=function(){d.close();ok(null)}
    }
  })
}
function hoje(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function silencio(p){var h=new Date().getHours(),a=p&&p.silencio?p.silencio.ini:22,b=p&&p.silencio?p.silencio.fim:8;return a===b?false:a<b?(h>=a&&h<b):(h>=a||h<b)}
function dentro(u){try{var x=new URL(u,ESCOPO).href;return x.indexOf(ESCOPO)===0?x:ESCOPO}catch(e){return ESCOPO}}
function mostrar(av,ag){ /* av: {id,tipo,titulo,texto,urlAbs,fotos?} */
  var ic=(ag&&ag.icone)||new URL('../assets/img/icones/icone-192.png',ESCOPO).href,A=self.PLAVISOSARTE;
  var op={body:av.texto||'',tag:'pl-'+(av.tipo||'sistema'),silent:true,icon:ic,badge:ic,lang:'pt-BR',data:{url:dentro(av.urlAbs||av.url||''),id:av.id||''}};
  var arte=av.fotos&&av.fotos.length&&A?A.desenhar(av.fotos,A.LARGA.w,A.LARGA.h).then(function(c){return A.paraDataUrl(c)}).catch(function(){return null}):Promise.resolve(null);
  return arte.then(function(img){if(img)op.image=img;return self.registration.showNotification(av.titulo||'PolarLife',op)})
}
function marcar(ag,av){ag.mostrados=ag.mostrados||{};ag.mostrados[av.id]=Date.now();ag.sisDia=hoje();return agenda(ag)}
/* periodicsync «pl-avisos» (app instalado, quando o navegador oferece): o aviso de hoje que ainda não apareceu */
function avisoDoDia(){
  return agenda().then(function(ag){
    if(!ag||!ag.prefs||!ag.prefs.ligado||ag.prefs.canal!=='sistema')return;
    if(!self.Notification||self.Notification.permission!=='granted')return;
    if(silencio(ag.prefs)||ag.sisDia===hoje())return;
    var h=hoje(),ordem=['codigo','lembranca','sistema','sugestao','anuncio','promocao'];
    var l=(ag.itens||[]).filter(function(i){return i.dia===h&&!(ag.mostrados&&ag.mostrados[i.id])&&ag.prefs.tipos[i.tipo]!==false&&(!i.validoAte||i.validoAte>Date.now())});
    l.sort(function(a,b){return ordem.indexOf(a.tipo)-ordem.indexOf(b.tipo)});
    if(!l.length)return;
    return mostrar(l[0],ag).then(function(){return marcar(ag,l[0])})
  })
}
self.addEventListener('periodicsync',function(e){if(e.tag==='pl-avisos')e.waitUntil(avisoDoDia().catch(function(){}))});
/* push (preparo para o servidor, DOC-16 §8): o servidor manda só JSON {tipo,id,titulo,texto,url}, nunca imagem.
   Para «lembranca» basta o gatilho {tipo:'lembranca'}: o aparelho procura a lembrança de hoje na agenda e monta a colagem com as
   fotos do IndexedDB; se não achar, mostra o texto que veio (ou um texto padrão), sem imagem. */
self.addEventListener('push',function(e){
  var d={};try{d=e.data?e.data.json():{}}catch(x){d={}}
  e.waitUntil(agenda().then(function(ag){
    var av={id:String(d.id||''),tipo:String(d.tipo||'sistema'),titulo:String(d.titulo||'').slice(0,60),texto:String(d.texto||'').slice(0,160),url:String(d.url||'')},loc=null;
    if(ag&&av.tipo==='lembranca')(ag.itens||[]).forEach(function(i){if(!loc&&i.tipo==='lembranca'&&i.dia===hoje())loc=i});
    if(loc)return mostrar(loc,ag).then(function(){return marcar(ag,loc)});
    if(!av.titulo){av.titulo='PolarLife';av.texto=av.texto||(av.tipo==='lembranca'?'Você tem fotos deste dia para rever.':'Há um aviso novo para você.')}
    return mostrar(av,ag)
  }))
});
/* toque na notificação: foca a janela do app que já está aberta (e leva ao endereço) ou abre uma nova, sempre dentro de /app/ */
self.addEventListener('notificationclick',function(e){
  var u=dentro(e.notification.data&&e.notification.data.url||'');
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    var i,c=null;
    for(i=0;i<cs.length;i++)if(cs[i].url.indexOf(ESCOPO)===0){c=cs[i];break}
    if(!c)return self.clients.openWindow(u);
    return c.focus().then(function(f){f=f||c;return f.navigate?f.navigate(u).catch(function(){return self.clients.openWindow(u)}):null},function(){return self.clients.openWindow(u)})
  }))
});

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
