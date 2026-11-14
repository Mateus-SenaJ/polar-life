/* PLSINO · sino do cabeçalho e painel de avisos (D-208, DOC-16 §4). Discreto: nada abre sozinho, nada pisca, nenhum som.
   O sino (<button id="sino">) já está no cabeçalho da página, escondido; aparece para quem entrou. O painel é um diálogo:
   foco preso dentro dele, Esc fecha e o foco volta ao sino (T3). Miniaturas das colagens geradas na hora, no aparelho (T5). */
(function(){
'use strict';
var A=window.PLAVISOS,C=window.PLCONTA,bt=document.getElementById('sino');
if(!A||!C||!bt||!C.temSessao())return;
var veu=null,pn=null,ul=null,vivo=null,aberto=false;
var I={x:'<path d="M6 6l12 12M18 6L6 18"/>',ajustes:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  lembranca:'<rect x="5" y="3" width="14" height="18" rx="1.5"/><rect x="7.5" y="5.5" width="9" height="9"/>',
  sugestao:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  codigo:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  promocao:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="8" cy="8" r="1.5"/>',
  anuncio:'<path d="M4 10v4h3l7 4V6l-7 4z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
  sistema:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function svg(n){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+n+'</svg>'}
function focar(el){if(!el)return;try{el.focus({preventScroll:true})}catch(e){el.focus()}}
function ajustes(){var u=new URL(A.urlDe({id:'x',url:'conta/'}));u.search='';u.hash='notificacoes';return u.href}

function ponto(){
  var n=A.naoLidos(),p=bt.querySelector('.sino__p');
  if(p)p.hidden=!n;
  bt.setAttribute('aria-label',n?'Avisos: '+n+(n===1?' novo':' novos'):'Avisos')
}
function montar(){
  if(pn)return;
  veu=document.createElement('div');veu.className='avs-veu';veu.hidden=true;
  pn=document.createElement('aside');pn.className='avs';pn.id='avisos-painel';pn.hidden=true;
  pn.setAttribute('role','dialog');pn.setAttribute('aria-modal','true');pn.setAttribute('aria-labelledby','avs-t');
  pn.innerHTML='<div class="avs__top"><h2 class="avs__t" id="avs-t">Avisos</h2><button type="button" class="avs__x" id="avs-fechar" aria-label="Fechar avisos">'+svg(I.x)+'</button></div>'+
    '<ul class="avs__l" id="avs-lista"></ul><p class="avs__vazio" id="avs-vazio" hidden>Nenhum aviso por aqui. Lembranças das suas fotos, prazos e novidades aparecem neste painel, sem interromper.</p>'+
    '<div class="avs__pe"><a class="avs__aj" id="avs-ajustar" href="'+esc(ajustes())+'">'+svg(I.ajustes)+'Ajustar notificações</a></div>'+
    '<p class="avs__vivo" id="avs-vivo" role="status" aria-live="polite"></p>';
  document.body.appendChild(veu);document.body.appendChild(pn);
  ul=pn.querySelector('#avs-lista');vivo=pn.querySelector('#avs-vivo');
  veu.addEventListener('click',fechar);
  pn.querySelector('#avs-fechar').addEventListener('click',fechar);
  pn.querySelector('#avs-ajustar').addEventListener('click',function(){fechar()});
  pn.addEventListener('keydown',function(e){
    if(e.key==='Escape'){e.stopPropagation();fechar();return}
    if(e.key!=='Tab')return;                                /* foco preso no painel */
    var f=[].slice.call(pn.querySelectorAll('a[href],button:not([disabled])')).filter(function(x){return x.offsetParent!==null});
    if(!f.length)return;
    var a=document.activeElement,pri=f[0],ult=f[f.length-1];
    if(e.shiftKey&&(a===pri||!pn.contains(a))){e.preventDefault();focar(ult)}
    else if(!e.shiftKey&&(a===ult||!pn.contains(a))){e.preventDefault();focar(pri)}
  });
  ul.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-av]');if(!b)return;
    var id=b.getAttribute('data-av'),que=b.getAttribute('data-que'),li=b.closest('.av'),prox=li&&(li.nextElementSibling||li.previousElementSibling);
    if(que==='ir'){A.abrir(id);fechar();return}             /* o link segue sozinho para a ação */
    if(que==='dispensar'){A.dispensar(id);vivo.textContent='Aviso dispensado.'}
    if(que==='adiar'){A.adiar(id);vivo.textContent='Combinado: este aviso volta amanhã.'}
    var pid=prox&&prox.getAttribute('data-id');
    listar();
    focar(pid&&ul.querySelector('.av[data-id="'+pid+'"] .av__ir, .av[data-id="'+pid+'"] .av__b')||pn.querySelector('#avs-fechar'))
  })
}
function listar(){
  var l=A.lista(),h='',i,x;
  for(i=0;i<l.length;i++){x=l[i];
    h+='<li class="av'+(x.temImagem?'':' av--semimg')+'" data-id="'+esc(x.id)+'" data-tipo="'+esc(x.tipo)+'">'+
      (x.temImagem?'<img class="av__img" data-img="'+esc(x.id)+'" alt="Colagem com as suas fotos" width="720" height="360" hidden>':'')+
      '<div class="av__q"><p class="av__tipo">'+svg(I[x.tipo]||I.sistema)+esc(x.tipoNome)+'</p><h3 class="av__n">'+esc(x.titulo)+'</h3><p class="av__x">'+esc(x.texto)+'</p></div>'+
      '<div class="av__act">'+(x.acao?'<a class="av__ir" href="'+esc(A.urlDe(x))+'" data-av="'+esc(x.id)+'" data-que="ir">'+esc(x.acao)+'</a>':'')+
      '<button type="button" class="av__b" data-av="'+esc(x.id)+'" data-que="adiar">Lembrar amanhã</button>'+
      '<button type="button" class="av__b" data-av="'+esc(x.id)+'" data-que="dispensar">Dispensar</button></div></li>'
  }
  ul.innerHTML=h;ul.hidden=!l.length;pn.querySelector('#avs-vazio').hidden=!!l.length;
  l.forEach(function(x){
    if(!x.temImagem)return;
    A.miniatura(x.id,'larga').then(function(u){
      var im=ul.querySelector('img[data-img="'+x.id+'"]'),li=im&&im.closest('.av');
      if(!im)return;
      if(u){im.src=u;im.hidden=false}else if(li){li.classList.add('av--semimg');im.remove()}   /* as fotos saíram do aparelho: fica só o texto */
    })
  })
}
function abrir(){
  montar();
  if(aberto)return;
  aberto=true;listar();
  veu.hidden=false;pn.hidden=false;bt.setAttribute('aria-expanded','true');
  A.marcarLidos();ponto();
  focar(pn.querySelector('#avs-fechar'))
}
function fechar(){
  if(!aberto)return;
  aberto=false;veu.hidden=true;pn.hidden=true;bt.setAttribute('aria-expanded','false');
  ul.innerHTML='';A.liberar();focar(bt)
}

/* veio de uma notificação do aparelho (…?aviso=id): conta como aberto e limpa o endereço */
(function(){
  var m=/[?&]aviso=([^&#]+)/.exec(location.search);
  if(!m)return;
  A.abrir(decodeURIComponent(m[1]));
  try{var u=new URL(location.href);u.searchParams.delete('aviso');history.replaceState(null,'',u.pathname+u.search+u.hash)}catch(e){}
})();

bt.hidden=false;bt.setAttribute('aria-haspopup','dialog');bt.setAttribute('aria-expanded','false');
bt.addEventListener('click',function(){if(aberto)fechar();else abrir()});
A.aoMudar(function(){ponto();if(aberto)listar()});
ponto();
/* depois que a página assentou: confere os avisos de hoje e, se a pessoa permitiu, a notificação do aparelho (no máximo 1 por dia) */
var pronto=new Promise(function(ok){setTimeout(function(){A.atualizar().then(function(){ponto();return A.enviarSistema()}).then(ok,ok)},400)});
window.PLSINO={abrir:abrir,fechar:fechar,pronto:pronto};
})();
