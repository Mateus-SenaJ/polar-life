/* T-25 · Entrar (modo demonstração, D-116/D-123/D-124).
   Duas vias: e-mail + código de 6 dígitos (mostrado na tela) e código de impressão PL-XXXX-XXXX.
   Um único LED por etapa (T8); estados de revisão via #estado-… (checklist §8.5). */
(function(){
var $=function(i){return document.getElementById(i)};
var C=window.PLCONTA,G=window.PLGUARDA;
var voltar=lerVoltar(),EMAIL='',ETAPA='email',tmExp=null,tmNovo=null,tmTenta=null,tmToast=null,tmIr=null;
var RE_EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function lerVoltar(){
  var q=null;try{q=new URLSearchParams(location.search).get('voltar')}catch(e){}
  if(!q||q.indexOf('/')!==0)return null;
  if(G&&G.raiz()){try{var rp=new URL(G.raiz()).pathname;if(q.indexOf(rp)===0&&q.indexOf(rp+'entrar/')!==0)return q}catch(e){}}
  return null
}
function irPara(){var d=voltar||(G?G.raiz():'../');if(d)location.href=d}

function led(btn,txt){var c=btn.querySelector('.btn-content');if(c)c.textContent=txt}
function focar(el){ /* foco sem arrastar a rolagem ao carregar (Chromium) */
  try{el.focus({preventScroll:true})}catch(e){el.focus()}
}
function ledBusy(btn,on,txt){btn.setAttribute('aria-busy',on?'true':'false');if(txt)led(btn,txt)}
function toast(msg){clearTimeout(tmToast);$('toast-t').textContent=msg;$('toast').hidden=false;tmToast=setTimeout(function(){$('toast').hidden=true},3400)}
function limpaTimers(){clearTimeout(tmExp);clearTimeout(tmNovo);clearTimeout(tmTenta)}
function mmss(ms){var s=Math.max(0,Math.ceil(ms/1000));var m=Math.floor(s/60);s=s%60;return m+':'+(s<10?'0':'')+s}
function er(msg){return '<p class="err" role="alert"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg><span>'+msg+'</span></p>'}
function cxInfo(html){return '<div class="cx-info"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><p>'+html+'</p></div>'}
function nomePerfil(p){return {admin:'Admin',gratis:'Grátis',avulsa:'Folha avulsa',pro:'Pro'}[p]||p}

/* ---------- etapa 1: e-mail ---------- */
function renderEmail(manter){
  limpaTimers();
  var cx=$('caixa');
  cx.innerHTML=
    '<h2 class="cx-t">Entrar</h2>'+
    '<p class="cx-lead">Enquanto o Polar Life não tem servidor, a entrada funciona só neste navegador. Não há senha, e nada sai do seu aparelho.</p>'+
    '<form id="f-email" class="cx-f" novalidate>'+
    '<div class="fld fld--first" id="g-email">'+
    '<label class="lab" for="email">E-mail</label>'+
    '<input class="txt" id="email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="nome@exemplo.com" value="'+(manter||'')+'">'+
    '<p class="help" id="ajuda-email">Vamos gerar um código de 6 dígitos para você.</p>'+
    '</div>'+
    '<button type="submit" class="led-btn led-btn--block" id="b-enviar"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Enviar código</span></button>'+
    '<p class="cx-links"><a href="../../legal/#privacidade">Privacidade</a> · <a href="../../legal/#termos">Termos</a></p>'+
    '</form>'+
    '<button type="button" class="cx-trocar" id="b-via-codigo">Tenho um código de impressão</button>'+
    '<div class="cx-div" aria-hidden="true"><span>ou</span></div>'+
    '<section class="cx-testes" aria-labelledby="t-testes">'+
    '<h3 class="cx-testes__t" id="t-testes">Contas de teste</h3>'+
    '<p class="cx-testes__p">Entre com um toque para ver cada plano.</p>'+
    '<ul class="cx-testes__lista">'+
    '<li><button type="button" class="btn2" data-perfil="admin"><svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></svg><span class="cx-testes__nome">Entrar como Admin<span class="mono">admin@polarlife.test · Pro + painel</span></span></button></li>'+
    '<li><button type="button" class="btn2" data-perfil="gratis"><svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span class="cx-testes__nome">Entrar como Grátis<span class="mono">gratis@polarlife.test · 1 folha por mês</span></span></button></li>'+
    '<li><button type="button" class="btn2" data-perfil="avulsa"><svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 4v16"/></svg><span class="cx-testes__nome">Entrar como Folha avulsa<span class="mono">folha@polarlife.test · 3 folhas compradas</span></span></button></li>'+
    '<li><button type="button" class="btn2" data-perfil="pro"><svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg><span class="cx-testes__nome">Entrar como Pro<span class="mono">pro@polarlife.test · uso razoável</span></span></button></li>'+
    '</ul></section>';
  $('f-email').addEventListener('submit',enviarCodigo);
  $('b-via-codigo').addEventListener('click',renderImpressao);
  var ls=[].slice.call(document.querySelectorAll('.cx-testes__lista .btn2'));
  for(var i=0;i<ls.length;i++)ls[i].addEventListener('click',entrarContaTeste);
  var em=$('email');focar(em);
  if(location.hash==='#estado-email-invalido')mostrarErroEmail();
}
function mostrarErroEmail(){
  var g=$('g-email');
  g.className='fld fld--err';
  if(!$('erro-email')){
    var d=document.createElement('div');
    d.innerHTML=er('Digite um e-mail válido, como nome@exemplo.com.');
    var p=d.firstChild;p.id='erro-email';
    g.insertBefore(p,$('ajuda-email'))
  }
  focar($('email'))
}
function enviarCodigo(ev){
  ev.preventDefault();
  var em=$('email').value.trim(),g=$('g-email');
  if(!RE_EMAIL.test(em)){mostrarErroEmail();return}
  g.className='fld fld--first';
  var e=$('erro-email');if(e)e.remove();
  EMAIL=em;
  var b=$('b-enviar');
  ledBusy(b,true,'Enviando…');
  C.pedirCodigo(em).then(function(r){
    renderCodigo(r,em) /* T7: a caixa de informação explica que nada foi enviado */
  },function(){ledBusy(b,false,'Enviar código')})
}

/* ---------- etapa 2: código de 6 dígitos (brief §1.3) ---------- */
function renderCodigo(r,email){
  limpaTimers();
  ETAPA='codigo';
  var cx=$('caixa');
  var cod=r.codigo.substr(0,3)+' '+r.codigo.substr(3);
  cx.innerHTML=
    '<h2 class="cx-t">Confira o código</h2>'+
    '<p class="cx-lead">Digitamos para <strong>'+email+'</strong> · <button type="button" class="cx-retro" id="b-trocar-email">Trocar e-mail</button></p>'+
    cxInfo('<strong>Ambiente de teste:</strong> seu código é <strong class="cod">'+cod+'</strong>. Nada foi enviado; em produção, ele chegaria por e-mail e valeria por 10 minutos.')+
    '<form id="f-cod" class="cx-f" novalidate>'+
    '<div class="fld fld--first" id="g-cod">'+
    '<label class="lab" for="cod">Código de 6 dígitos</label>'+
    '<input class="txt cx-cod" id="cod" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="000 000">'+
    '<p class="help" id="ajuda-cod" aria-live="polite">Expira em '+mmss(r.expiraEm-Date.now())+'</p>'+
    '</div>'+
    '<button type="submit" class="led-btn led-btn--block" id="b-confirmar"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Confirmar código</span></button>'+
    '</form>'+
    '<button type="button" class="cx-trocar" id="b-novo" disabled>Disponível em 0:30</button>';
  $('b-trocar-email').addEventListener('click',function(){renderEmail(email)});
  $('f-cod').addEventListener('submit',confirmar);
  focar($('cod'));

  var expiraEm=r.expiraEm;
  function ticaExpira(){ /* atualiza o texto a cada 30 s (não a cada segundo) */
    var resta=expiraEm-Date.now();
    if(resta<=0){
      $('ajuda-cod').textContent='';
      var g=$('g-cod');g.className='fld fld--err';
      if(!$('erro-cod')){var d=document.createElement('div');d.innerHTML=er('Este código expirou. Peça um novo para continuar.');var p=d.firstChild;p.id='erro-cod';g.insertBefore(p,$('ajuda-cod'))}
      led($('b-confirmar'),'Enviar novo código');trocaFluxoNovo();
      return
    }
    $('ajuda-cod').textContent='Expira em '+mmss(resta);
    tmExp=setTimeout(ticaExpira,30000)
  }
  ticaExpira();
  function liberaNovo(){
    var b=$('b-novo');b.disabled=false;b.textContent='Enviar novo código'
  }
  tmNovo=setTimeout(liberaNovo,30000);
  $('b-novo').addEventListener('click',function(){
    var b=this;b.disabled=true;
    C.pedirCodigo(email).then(function(r2){renderCodigo(r2,email)})
  });
  if(location.hash==='#estado-incorreto')erroCodigo('Código incorreto. Confira os 6 dígitos e tente de novo.');
  if(location.hash==='#estado-expirado')expiraAgora();
  if(location.hash==='#estado-tentativas'){erroCodigo('Muitas tentativas. Peça um novo código para continuar.');trocaFluxoNovo()}
}
function expiraAgora(){
  var g=$('g-cod');g.className='fld fld--err';
  if(!$('erro-cod')){var d=document.createElement('div');d.innerHTML=er('Este código expirou. Peça um novo para continuar.');var p=d.firstChild;p.id='erro-cod';g.insertBefore(p,$('ajuda-cod'))}
  if($('ajuda-cod'))$('ajuda-cod').textContent='';
  trocaFluxoNovo()
}
function trocaFluxoNovo(){ /* após expirar/5 tentativas, o LED pede um código novo (§1.4) */
  if(ETAPA==='novo')return;
  ETAPA='novo';
  var f=$('f-cod');if(!f)return;
  led($('b-confirmar'),'Enviar novo código');
  var b=$('b-novo');if(b){b.disabled=false;b.textContent='Enviar novo código'}
}
function erroCodigo(msg,semFoco){
  var g=$('g-cod');g.className='fld fld--err';
  var e=$('erro-cod');if(e)e.remove();
  var d=document.createElement('div');d.innerHTML=er(msg);var p=d.firstChild;p.id='erro-cod';
  g.insertBefore(p,$('ajuda-cod'));
  if(!semFoco)focar($('cod'))
}
function confirmar(ev){
  ev.preventDefault();
  if(ETAPA==='novo'){ /* expirado/5 tentativas: o LED envia um código novo */
    var bn=$('b-novo');
    if(bn&&!bn.disabled){bn.disabled=true;C.pedirCodigo(EMAIL).then(function(r2){renderCodigo(r2,EMAIL)})}
    return
  }
  var v=$('cod').value.replace(/\D/g,'');
  ledBusy($('b-confirmar'),true,'Conferindo…');
  C.confirmarCodigo(EMAIL,v).then(function(s){
    sucesso(nomePerfil(s.perfil))
  },function(erro){
    ledBusy($('b-confirmar'),false,'Confirmar código');
    if(erro&&erro.tipo==='expirado'){expiraAgora();return}
    if(erro&&erro.tipo==='tentativas'){erroCodigo('Muitas tentativas. Peça um novo código para continuar.');trocaFluxoNovo();return}
    erroCodigo('Código incorreto. Confira os 6 dígitos e tente de novo.')
  })
}
function sucesso(nome){
  toast('Você entrou como '+nome+' · Ambiente de teste');
  clearTimeout(tmIr);
  tmIr=setTimeout(irPara,900)
}

/* ---------- via código de impressão (D-124) ---------- */
function renderImpressao(){
  limpaTimers();
  var cx=$('caixa');
  cx.innerHTML=
    '<h2 class="cx-t">Entrar com o código</h2>'+
    '<p class="cx-lead">Digite o código de impressão do seu pacote de folhas. A conferência acontece neste navegador; nada é enviado.</p>'+
    '<form id="f-imp" class="cx-f" novalidate>'+
    '<div class="fld fld--first" id="g-imp">'+
    '<label class="lab" for="imp">Código de impressão</label>'+
    '<input class="txt cx-imp" id="imp" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="14" placeholder="PL-XXXX-XXXX">'+
    '<p class="help" id="ajuda-imp">Formato PL-XXXX-XXXX: 8 letras e números depois de PL.</p>'+
    '</div>'+
    '<button type="submit" class="led-btn led-btn--block" id="b-imp"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Entrar com o código</span></button>'+
    '</form>'+
    '<button type="button" class="cx-trocar" id="b-voltar-email">Voltar ao e-mail</button>';
  $('b-voltar-email').addEventListener('click',function(){renderEmail(EMAIL)});
  var imp=$('imp');
  imp.addEventListener('input',function(){ /* máscara PL-XXXX-XXXX */
    var v=imp.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(v.indexOf('PL')===0)v=v.slice(2);
    if(v.length>8)v=v.slice(0,8);
    var m='PL';
    if(v.length)m+='-'+v.slice(0,4);
    if(v.length>4)m+='-'+v.slice(4);
    if(imp.value!==m)imp.value=m;
    var c=imp.selectionStart,l=imp.value.length;
    imp.setSelectionRange(Math.min(c,l),Math.min(c,l));
  });
  focar(imp);
  $('f-imp').addEventListener('submit',verImpressao)
}
function erroImp(msg){
  var g=$('g-imp');g.className='fld fld--err';
  var e=$('erro-imp');if(e)e.remove();
  var d=document.createElement('div');d.innerHTML=er(msg);var p=d.firstChild;p.id='erro-imp';
  g.insertBefore(p,$('ajuda-imp'));
  focar($('imp'))
}
function verImpressao(ev){
  ev.preventDefault();
  var v=$('imp').value;
  ledBusy($('b-imp'),true,'Conferindo…');
  C.verificarCodigo(v).then(function(r){
    toast('Você entrou com um código de impressão · Ambiente de teste');
    clearTimeout(tmIr);
    tmIr=setTimeout(irPara,900)
  },function(erro){
    ledBusy($('b-imp'),false,'Entrar com o código');
    var t=erro&&erro.tipo;
    if(t==='dv')erroImp('O dígito de conferência não bate. Confira o código digitado.'); /* não gasta tentativa (D-124) */
    else if(t==='formato')erroImp('Confira o formato: PL seguido de 8 letras e números.');
    else if(t==='usado')erroImp('Este código já foi usado. Para imprimir de novo, use outro código ou entre com e-mail.');
    else if(t==='vencido')erroImp('Este código venceu. Use outro código ou entre com e-mail.');
    else if(t==='revogado')erroImp('Este código foi revogado. Use outro código ou entre com e-mail.');
    else if(t==='indisponivel')erroImp('Não foi possível conferir o código neste navegador.');
    else if(t==='tentativas'){
      erroImp('Muitas tentativas. Espere '+mmss(erro.esperaMs||30000)+' e tente de novo.');
      bloquearImp(erro.esperaMs||30000)
    }
    else erroImp('Código não encontrado. Confira os 8 caracteres depois de PL.')
  })
}
function bloquearImp(ms){ /* 5 tentativas → 30 s (D-124) */
  var b=$('b-imp'),fim=Date.now()+ms;
  b.disabled=true;
  function t(){
    var r=fim-Date.now();
    if(r<=0){b.disabled=false;led(b,'Entrar com o código');return}
    led(b,'Espere '+mmss(r));
    tmTenta=setTimeout(t,1000)
  }
  t()
}

/* ---------- contas de teste ---------- */
function entrarContaTeste(){
  var p=this.getAttribute('data-perfil');
  var s=C.entrarComo(p);
  if(s)sucesso(nomePerfil(p));
  else toast('Não foi possível entrar neste navegador')
}

/* ---------- estado «já entrou» (§1.4) ---------- */
function renderEntrou(){
  limpaTimers();
  var cx=$('caixa'),s=C.sessao(),sc=C.sessaoCodigo(),linha='';
  if(sc){
    var pc=(C.pacotes&&C.pacotes()[sc.pacote])||{nome:'Avulso básico'};
    linha='<p class="cx-lead">Você já entrou com um código de impressão ('+pc.nome+' · '+sc.folhas+' folhas).</p>';
    if(sc.usadoEm)linha+=cxInfo('<strong>Seu código já foi usado.</strong> Para imprimir de novo, compre outro código ou crie uma conta.')
  }else if(s){
    var pl=C.plano()||{};
    linha='<p class="cx-lead">Você já entrou como <strong>'+s.email+'</strong> ('+(pl.nome||'Grátis')+').</p>'
  }
  cx.innerHTML=
    '<h2 class="cx-t">Entrar</h2>'+linha+
    '<div class="cx-sessao">'+
    '<button type="button" class="led-btn led-btn--block" id="b-ir"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Ir para o Início</span></button>'+
    '<button type="button" class="btn2" id="b-sair"><svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h9v16H9M5 12h9M11 9l3 3-3 3"/></svg>Sair</button>'+
    '</div>';
  $('b-ir').addEventListener('click',irPara);
  $('b-sair').addEventListener('click',function(){
    C.sair();
    toast('Você saiu. Seus projetos continuam neste aparelho.');
    setTimeout(function(){renderEmail('')},600)
  })
}

/* ---------- montagem ---------- */
function semSuporte(){ /* §1.4: sem localStorage */
  $('sem-suporte').hidden=false;
  var b=$('b-enviar');if(b)b.disabled=true;
  var ls=[].slice.call(document.querySelectorAll('.cx-testes__lista .btn2'));
  for(var i=0;i<ls.length;i++)ls[i].disabled=true
}
if(C&&G){
  if(!C.temLocalStorage())semSuporte();
  else if(C.temSessao())renderEntrou();
  else renderEmail('');
}else{
  document.documentElement.className+=' sem-js'
}
})();
