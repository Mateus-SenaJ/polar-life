/* PLPWA · PWA do editor (DOC-08 §7): registro do service worker, aviso de versão nova, instalar, espaço e armazenamento persistente.
   Carregado só nas páginas de /app/. Registra depois do load e só em https: ou localhost. Nada de foto passa por aqui (T5). */
(function(){
'use strict';
var PLPWA,adiado=null,ouvintes=[],feito=false,recarregar=false;
var LOCAL=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

function ler(k){try{return localStorage.getItem(k)}catch(e){return null}}
function gravar(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function standalone(){
  try{if(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)return true}catch(e){}
  return navigator.standalone===true
}
function ios(){
  var ua=navigator.userAgent||'';
  var ap=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  return ap&&/Safari/.test(ua)&&!/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
}
function avisar(){ouvintes.forEach(function(f){try{f()}catch(e){}})}

/* ---- aviso de versão nova: toast de nível 1 (D-023) com «Atualizar»; nunca recarrega sozinho ---- */
function aviso(reg){
  if(document.getElementById('pwa-aviso')||!reg.waiting)return;
  var d=document.createElement('div');d.className='pwa-aviso led-box led-box--1';d.id='pwa-aviso';d.setAttribute('role','status');d.setAttribute('aria-live','polite');
  d.innerHTML='<span>Há uma versão nova do PolarLive.</span><button type="button">Atualizar</button>';
  d.querySelector('button').onclick=function(){recarregar=true;reg.waiting.postMessage({tipo:'pular'})};
  document.body.appendChild(d)
}
function vigiar(reg){
  if(reg.waiting&&navigator.serviceWorker.controller)aviso(reg);
  reg.addEventListener('updatefound',function(){
    var n=reg.installing;if(!n)return;
    n.addEventListener('statechange',function(){if(n.state==='installed'&&navigator.serviceWorker.controller)aviso(reg)})
  })
}
function registrar(){
  if(feito||!('serviceWorker' in navigator)||(location.protocol!=='https:'&&!LOCAL))return;
  feito=true;
  navigator.serviceWorker.addEventListener('controllerchange',function(){if(recarregar){recarregar=false;location.reload()}});
  navigator.serviceWorker.register(raiz()+'sw.js',{scope:raiz()}).then(vigiar).catch(function(){})
}
function raiz(){ /* URL da raiz de /app/ (funciona em subpasta, ex.: /polar-life/app/) */
  var p=location.pathname,i=p.indexOf('/app/');return location.origin+(i<0?'/':p.slice(0,i+5))
}

/* ---- instalar (Android/desktop) e dica do iPhone ---- */
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();adiado=e;avisar()});
window.addEventListener('appinstalled',function(){adiado=null;avisar()});
function podeInstalar(){return !!adiado&&!standalone()}
function instalar(){
  if(!adiado)return Promise.resolve(false);
  var e=adiado;adiado=null;avisar();
  return e.prompt().then(function(){return e.userChoice}).then(function(r){return r&&r.outcome==='accepted'}).catch(function(){return false})
}
function dicaIos(){return ios()&&!standalone()&&ler('pl-dica-ios')!=='1'}
function fecharDica(){gravar('pl-dica-ios','1');avisar()}

/* ---- armazenamento (DOC-08 §7) ---- */
function persistir(){ /* pede uma vez, na primeira foto guardada */
  if(ler('pl-persist')==='1')return Promise.resolve(false);
  gravar('pl-persist','1');
  if(!navigator.storage||!navigator.storage.persist)return Promise.resolve(false);
  return navigator.storage.persist().catch(function(){return false})
}
function espaco(){ /* {usado, quota, fracao, cheio} ou null; cheio = acima de 80% */
  if(!navigator.storage||!navigator.storage.estimate)return Promise.resolve(null);
  return navigator.storage.estimate().then(function(r){
    if(!r||!r.quota)return null;
    var f=(r.usage||0)/r.quota;return{usado:r.usage||0,quota:r.quota,fracao:f,cheio:f>0.8}
  }).catch(function(){return null})
}

if(document.readyState==='complete')registrar();else window.addEventListener('load',registrar);
window.PLPWA=PLPWA={registrar:registrar,standalone:standalone,podeInstalar:podeInstalar,instalar:instalar,dicaIos:dicaIos,fecharDica:fecharDica,
  persistir:persistir,espaco:espaco,aoMudar:function(f){ouvintes.push(f)}};
})();
