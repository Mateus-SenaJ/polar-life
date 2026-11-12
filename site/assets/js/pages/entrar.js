/* T-25 · Entrar (modo demonstração, D-116/D-123/D-124/D-144).
   Vias: 1º bloco e-mail + senha («Esqueci a senha» leva ao código de 6 dígitos mostrado na tela; «Criar nova conta»);
   2º bloco Google e Apple (demonstração, sem acessar o provedor); e, num link discreto, «Entrar com código»
   (e-mail + código de impressão PL-XXXX-XXXX).
   Toda via nova termina em «Seus dados» (nome, e-mail, aceite) antes de entrar.
   Um único LED por etapa (T8); estados de revisão via #estado-… (checklist §8.5). */
(function(){
var $=function(i){return document.getElementById(i)};
var C=window.PLCONTA,G=window.PLGUARDA;
var voltar=lerVoltar(),EMAIL='',ETAPA='email',tmExp=null,tmNovo=null,tmTenta=null,tmToast=null,tmIr=null;
var MARCA={
 google:'<path d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.68 4.1-5.35 4.1a6.02 6.02 0 0 1 0-12.04c1.9 0 3.17.8 3.9 1.5l2.66-2.56A9.4 9.4 0 0 0 12 2.6a9.4 9.4 0 1 0 0 18.8c5.43 0 9.03-3.82 9.03-9.2 0-.62-.07-1.1-.18-1.1z"/>',
 apple:'<path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.86-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.5zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22z"/>'
};
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]})}
var RE_EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function lerVoltar(){
  var q=null;try{q=new URLSearchParams(location.search).get('voltar')}catch(e){}
  if(!q||q.indexOf('/')!==0)return null;
  if(G&&G.raiz()){try{var rp=new URL(G.raiz()).pathname;if(q.indexOf(rp)===0&&q.indexOf(rp+'entrar/')!==0&&q.split('?')[0].split('#')[0]!==rp)return q   /* a raiz do app (lista de projetos) não é destino: depois de entrar vai ao Início (D-118) */}catch(e){}}
  return null
}
/* D-118: depois de entrar, a pessoa cai no Início (a lista de projetos fica em «Projetos») */
function irPara(){var d=voltar||(G?G.raiz()+'inicio/':'../inicio/');if(d)location.replace(d)}   /* D-162: «Voltar» depois de entrar não devolve à tela de entrar */

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

/* ---------- etapa 1: entrada (D-144) ----------
   Primeiro bloco: e-mail e senha, «Esqueci a senha» discreto e «Criar nova conta».
   Segundo bloco: Google e Apple. Depois, discretos: código de impressão (D-124) e contas de teste (D-116). */
function campoSenha(id,auto,ajuda){
  return '<div class="fld" id="g-'+id+'">'+
    '<label class="lab" for="'+id+'">Senha</label>'+
    '<input class="txt" id="'+id+'" name="'+id+'" type="password" autocomplete="'+auto+'" maxlength="128" aria-describedby="ajuda-'+id+'">'+
    '<p class="help" id="ajuda-'+id+'">'+ajuda+'</p>'+
    '</div>'
}
function erroCampo(k,msg){ /* ids: g-k (grupo), k (campo), erro-k e ajuda-k */
  var g=$('g-'+k);g.classList.add('fld--err');
  var e=$('erro-'+k);if(e)e.remove();
  var d=document.createElement('div');d.innerHTML=er(msg);var pe=d.firstChild;pe.id='erro-'+k;
  g.insertBefore(pe,$('ajuda-'+k));
  var c=$(k);if(c){c.setAttribute('aria-invalid','true');focar(c)}
}
function limpaErro(k){var e=$('erro-'+k);if(e)e.remove();var g=$('g-'+k);if(g)g.classList.remove('fld--err');var c=$(k);if(c)c.removeAttribute('aria-invalid')}
function renderEmail(manter){
  limpaTimers();ETAPA='email';
  var cx=$('caixa');
  cx.innerHTML=
    '<h2 class="cx-t">Entrar</h2>'+
    '<form id="f-email" class="cx-f" novalidate>'+
    '<div class="fld fld--first" id="g-email">'+
    '<label class="lab" for="email">E-mail</label>'+
    '<input class="txt" id="email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="nome@exemplo.com" value="'+esc(manter||'')+'">'+
    '<p class="help" id="ajuda-email" hidden></p>'+
    '</div>'+
    campoSenha('senha','current-password','Sua conta fica só neste aparelho. Nada sai dele.')+
    '<p class="cx-esq"><button type="button" class="cx-cod__b" id="b-esqueci">Esqueci a senha</button></p>'+
    '<button type="submit" class="led-btn led-btn--block" id="b-enviar"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Entrar</span></button>'+
    '</form>'+
    '<button type="button" class="btn2 cx-criar" id="b-criar"><svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Criar nova conta</button>'+
    '<div class="cx-div" aria-hidden="true"><span>ou</span></div>'+
    '<div class="cx-prov" role="group" aria-label="Entrar com Google ou Apple">'+C.provedores().map(function(pv){return '<button type="button" class="btn2 cx-prov__b" data-prov="'+pv.id+'"><svg class="ico ico--marca" viewBox="0 0 24 24" aria-hidden="true">'+(MARCA[pv.id]||'')+'</svg><span>Continuar com '+pv.nome+'</span></button>'}).join('')+'</div>'+
    '<p class="cx-cod"><button type="button" class="cx-cod__b" id="b-via-codigo">Entrar com código</button></p>'+
    '<p class="cx-links"><a href="../../legal/#privacidade">Privacidade</a> · <a href="../../legal/#termos">Termos</a> · <a href="../../legal/#cookies">Cookies</a></p>'+
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
  $('f-email').addEventListener('submit',entrarSenha);
  $('b-esqueci').addEventListener('click',function(){renderEsqueci($('email').value.trim())});
  $('b-criar').addEventListener('click',function(){renderCriar($('email').value.trim())});
  $('b-via-codigo').addEventListener('click',renderImpressao);
  [].forEach.call(document.querySelectorAll('[data-prov]'),function(b){b.addEventListener('click',function(){var pv=b.getAttribute('data-prov');
    if(pv==='google'&&window.PLGOOGLE&&PLGOOGLE.ativo()&&PLGOOGLE.iniciar(voltar))return;   /* D-147g: Google de verdade */
    renderDados({origem:pv,nomeProv:b.textContent.replace('Continuar com ','')})})});
  var ls=[].slice.call(document.querySelectorAll('.cx-testes__lista .btn2'));
  for(var i=0;i<ls.length;i++)ls[i].addEventListener('click',entrarContaTeste);
  var em=$('email');focar(em);
  if(location.hash==='#estado-email-invalido')mostrarErroEmail();
  if(location.hash==='#estado-senha-incorreta')erroCampo('senha','E-mail ou senha incorretos. Confira os dois ou use «Esqueci a senha».');
}
function entrarSenha(ev){
  ev.preventDefault();
  var em=$('email').value.trim(),se=$('senha').value;
  var e=$('erro-email');if(e){e.remove();$('g-email').className='fld fld--first'}
  limpaErro('senha');
  if(!RE_EMAIL.test(em)){mostrarErroEmail();return}
  if(!se){erroCampo('senha','Digite sua senha.');return}
  EMAIL=em.toLowerCase();
  var b=$('b-enviar');
  ledBusy(b,true,'Entrando…');
  C.entrarComSenha(EMAIL,se).then(function(r){
    if(C.precisaCadastro&&C.precisaCadastro()){renderDados({origem:'email',email:r.email});return}
    toast('Olá, '+String(r.nome||r.email).split(' ')[0]+'! · Ambiente de teste');
    clearTimeout(tmIr);tmIr=setTimeout(irPara,900)
  },function(erro){
    ledBusy(b,false,'Entrar');
    var t=erro&&erro.tipo;
    if(t==='tentativas'){erroCampo('senha','Muitas tentativas. Espere '+mmss(erro.esperaMs||30000)+' e tente de novo.');bloquear(b,erro.esperaMs||30000,'Entrar')}
    else if(t==='indisponivel')erroCampo('senha','Não foi possível conferir a senha neste navegador.');
    else erroCampo('senha','E-mail ou senha incorretos. Confira os dois ou use «Esqueci a senha».')   /* não revela se o e-mail existe */
  })
}
function bloquear(b,ms,rotulo){ /* 5 erros → 30 s, com contagem no próprio botão */
  var fim=Date.now()+ms;b.disabled=true;
  function t(){var r=fim-Date.now();if(r<=0){b.disabled=false;led(b,rotulo);return}led(b,'Espere '+mmss(r));tmTenta=setTimeout(t,1000)}
  t()
}

/* ---------- criar nova conta (D-144): nome, e-mail, senha e aceite; tudo neste navegador (T5) ---------- */
function renderCriar(email){
  limpaTimers();ETAPA='criar';
  var cx=$('caixa');
  cx.innerHTML=
    '<h2 class="cx-t">Criar nova conta</h2>'+
    '<p class="cx-lead">Leva um minuto. Seus dados ficam só neste navegador.</p>'+
    '<form id="f-criar" class="cx-f" novalidate>'+
    '<div class="fld fld--first" id="g-c-nome">'+
    '<label class="lab" for="c-nome">Nome</label>'+
    '<input class="txt" id="c-nome" type="text" autocomplete="name" maxlength="60" placeholder="Como você quer ser chamado" aria-describedby="ajuda-c-nome">'+
    '<p class="help" id="ajuda-c-nome">Aparece só para você, na sua conta.</p>'+
    '</div>'+
    '<div class="fld" id="g-c-email">'+
    '<label class="lab" for="c-email">E-mail</label>'+
    '<input class="txt" id="c-email" type="email" autocomplete="email" inputmode="email" placeholder="nome@exemplo.com" value="'+esc(email||'')+'">'+
    '<p class="help" id="ajuda-c-email" hidden></p>'+
    '</div>'+
    campoSenha('c-senha','new-password','Pelo menos 8 caracteres.')+
    '<div class="fld cx-ac" id="g-c-aceite">'+
    '<label class="cx-ac__l"><input type="checkbox" id="c-aceite"><span>Li e aceito os <a href="../../legal/#termos">Termos</a> e a <a href="../../legal/#privacidade">Privacidade</a>.</span></label>'+
    '<p class="help" id="ajuda-c-aceite"></p>'+
    '</div>'+
    '<button type="submit" class="led-btn led-btn--block" id="b-criar-conta"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Criar conta e entrar</span></button>'+
    '</form>'+
    '<button type="button" class="cx-trocar" id="b-voltar-email">Já tenho conta</button>';
  $('b-voltar-email').addEventListener('click',function(){renderEmail($('c-email').value.trim())});
  $('f-criar').addEventListener('submit',function(ev){
    ev.preventDefault();
    ['c-nome','c-email','c-senha','c-aceite'].forEach(limpaErro);
    var b=$('b-criar-conta'),nome=$('c-nome').value;
    ledBusy(b,true,'Criando…');
    C.criarConta({nome:nome,email:$('c-email').value,senha:$('c-senha').value,aceite:$('c-aceite').checked}).then(function(){
      toast('Olá, '+nome.trim().split(' ')[0]+'! · Ambiente de teste');
      clearTimeout(tmIr);tmIr=setTimeout(irPara,900)
    },function(r){
      ledBusy(b,false,'Criar conta e entrar');
      var k=r&&r.erro,msg={nome:'Digite seu nome (de 2 a 60 letras).',email:'Digite um e-mail válido, como nome@exemplo.com.',senha:'A senha precisa ter pelo menos 8 caracteres.',aceite:'Para criar a conta, aceite os Termos e a Privacidade.',existe:'Já existe uma conta com este e-mail neste aparelho. Entre com a sua senha ou use «Esqueci a senha».'}[k]||'Não foi possível criar a conta neste navegador.';
      erroCampo({nome:'c-nome',email:'c-email',existe:'c-email',aceite:'c-aceite'}[k]||'c-senha',msg)
    })
  });
  focar($('c-nome'))
}

/* ---------- esqueci a senha (D-144): e-mail → código de 6 dígitos (fluxo que já existia) → senha nova ---------- */
function renderEsqueci(email){
  limpaTimers();ETAPA='esqueci';
  var cx=$('caixa');
  cx.innerHTML=
    '<h2 class="cx-t">Esqueci a senha</h2>'+
    '<p class="cx-lead">Digite seu e-mail. Geramos um código de 6 dígitos para você criar uma senha nova.</p>'+
    '<form id="f-rec" class="cx-f" novalidate>'+
    '<div class="fld fld--first" id="g-rec-email">'+
    '<label class="lab" for="rec-email">E-mail</label>'+
    '<input class="txt" id="rec-email" type="email" autocomplete="email" inputmode="email" placeholder="nome@exemplo.com" value="'+esc(email||'')+'">'+
    '<p class="help" id="ajuda-rec-email">Nada sai do seu aparelho.</p>'+
    '</div>'+
    '<button type="submit" class="led-btn led-btn--block" id="b-rec"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Enviar código</span></button>'+
    '</form>'+
    '<button type="button" class="cx-trocar" id="b-voltar-email">Voltar</button>';
  $('b-voltar-email').addEventListener('click',function(){renderEmail($('rec-email').value.trim())});
  $('f-rec').addEventListener('submit',enviarCodigo);
  focar($('rec-email'))
}
function renderNovaSenha(perfil){
  limpaTimers();ETAPA='nova-senha';
  var cx=$('caixa');
  function seguir(){
    if(C.precisaCadastro&&C.precisaCadastro()){renderDados({origem:'email',email:EMAIL});return}
    sucesso(nomePerfil(perfil))
  }
  cx.innerHTML=
    '<h2 class="cx-t">Crie uma senha nova</h2>'+
    '<p class="cx-lead">Código conferido para <strong>'+esc(EMAIL)+'</strong>.</p>'+
    '<form id="f-nova" class="cx-f" novalidate>'+
    campoSenha('n-senha','new-password','Pelo menos 8 caracteres. Fica só neste aparelho.').replace('class="fld"','class="fld fld--first"')+
    '<button type="submit" class="led-btn led-btn--block" id="b-nova"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Salvar senha e entrar</span></button>'+
    '</form>'+
    '<button type="button" class="cx-trocar" id="b-pular">Agora não</button>';
  $('b-pular').addEventListener('click',seguir);
  $('f-nova').addEventListener('submit',function(ev){
    ev.preventDefault();limpaErro('n-senha');
    var b=$('b-nova');ledBusy(b,true,'Salvando…');
    C.definirSenha($('n-senha').value).then(seguir,function(r){
      ledBusy(b,false,'Salvar senha e entrar');
      erroCampo('n-senha',r&&r.erro==='senha'?'A senha precisa ter pelo menos 8 caracteres.':'Não foi possível salvar a senha neste navegador.')
    })
  });
  focar($('n-senha'))
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
function enviarCodigo(ev){ /* «Esqueci a senha»: pede o código de 6 dígitos */
  ev.preventDefault();
  var em=$('rec-email').value.trim().toLowerCase();
  limpaErro('rec-email');
  if(!RE_EMAIL.test(em)){erroCampo('rec-email','Digite um e-mail válido, como nome@exemplo.com.');return}
  EMAIL=em;
  var b=$('b-rec');
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
    '<p class="cx-lead">Digitamos para <strong>'+esc(email)+'</strong> · <button type="button" class="cx-retro" id="b-trocar-email">Trocar e-mail</button></p>'+
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
  $('b-trocar-email').addEventListener('click',function(){renderEsqueci(email)});
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
    renderNovaSenha(s.perfil)                               /* D-144: código conferido → senha nova → (dados) → entra */
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
    '<h2 class="cx-t">Entrar com código</h2>'+
    '<p class="cx-lead">Use o seu e-mail e o código de impressão do pacote de folhas. A conferência acontece neste navegador; nada é enviado.</p>'+
    '<form id="f-imp" class="cx-f" novalidate>'+
    '<div class="fld fld--first" id="g-imp-email">'+
    '<label class="lab" for="imp-email">E-mail</label>'+
    '<input class="txt" id="imp-email" type="email" autocomplete="email" inputmode="email" placeholder="nome@exemplo.com" value="'+esc(EMAIL)+'">'+
    '<p class="help" id="ajuda-imp-email">Para lembrar de você neste aparelho.</p>'+
    '</div>'+
    '<div class="fld" id="g-imp">'+
    '<label class="lab" for="imp">Código de impressão</label>'+
    '<input class="txt cx-imp" id="imp" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="14" placeholder="PL-XXXX-XXXX">'+
    '<p class="help" id="ajuda-imp">Formato PL-XXXX-XXXX: 8 letras e números depois de PL.</p>'+
    '</div>'+
    '<button type="submit" class="led-btn led-btn--block" id="b-imp"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Conferir código</span></button>'+
    '</form>'+
    '<button type="button" class="cx-trocar" id="b-voltar-email">Voltar às outras formas de entrar</button>';
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
  focar($('imp-email').value?imp:$('imp-email'));
  $('f-imp').addEventListener('submit',verImpressao)
}
function erroImpEmail(){
  var g=$('g-imp-email');g.className='fld fld--first fld--err';
  var e=$('erro-imp-email');if(e)e.remove();
  var d=document.createElement('div');d.innerHTML=er('Digite um e-mail válido, como nome@exemplo.com.');var p=d.firstChild;p.id='erro-imp-email';
  g.insertBefore(p,$('ajuda-imp-email'));focar($('imp-email'))
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
  var v=$('imp').value,em=$('imp-email').value.trim();
  var e0=$('erro-imp-email');if(e0){e0.remove();$('g-imp-email').className='fld fld--first'}
  if(!RE_EMAIL.test(em)){erroImpEmail();return}
  EMAIL=em;
  ledBusy($('b-imp'),true,'Conferindo…');
  C.verificarCodigo(v).then(function(r){
    renderDados({origem:'codigo',email:em,pacote:r})            /* código ok → dados básicos → entra */
  },function(erro){
    ledBusy($('b-imp'),false,'Conferir código');
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
    if(r<=0){b.disabled=false;led(b,'Conferir código');return}
    led(b,'Espere '+mmss(r));
    tmTenta=setTimeout(t,1000)
  }
  t()
}

/* ---------- seus dados (cadastro básico, só neste navegador · T5) ---------- */
function renderDados(ctx){
  limpaTimers();ETAPA='dados';
  var cx=$('caixa'),fixo=!!ctx.email,aviso='';
  if(ctx.origem==='codigo'){
    var pk=ctx.pacote||{};
    aviso=cxInfo('<strong>Código conferido.</strong> '+esc(pk.pacote||'Pacote de folhas')+(pk.folhas?' · '+pk.folhas+' folhas':'')+(pk.fotos?' · até '+pk.fotos+' fotos':'')+'.')
  }else if(ctx.verificado){
    aviso=cxInfo('<strong>Conta Google confirmada.</strong> Falta só aceitar os Termos. Seus dados ficam neste aparelho.')
  }else if(ctx.origem!=='email'){                            /* T7: não fingir que o provedor foi acessado */
    aviso=cxInfo('<strong>Demonstração.</strong> A entrada com '+esc(ctx.nomeProv||ctx.origem)+' ainda não acessa a sua conta. Preencha seus dados para continuar; eles ficam só neste navegador.')
  }
  cx.innerHTML=
    '<h2 class="cx-t">Seus dados</h2>'+
    '<p class="cx-lead">Falta pouco. Como devemos chamar você?</p>'+aviso+
    '<form id="f-dados" class="cx-f" novalidate>'+
    '<div class="fld fld--first" id="g-d-nome">'+
    '<label class="lab" for="d-nome">Nome</label>'+
    '<input class="txt" id="d-nome" type="text" autocomplete="name" maxlength="60" placeholder="Como você quer ser chamado" value="'+esc(ctx.nome||'')+'">'+
    '<p class="help" id="ajuda-d-nome">Aparece só para você, na sua conta.</p>'+
    '</div>'+
    '<div class="fld" id="g-d-email">'+
    '<label class="lab" for="d-email">E-mail</label>'+
    '<input class="txt" id="d-email" type="email" autocomplete="email" inputmode="email" placeholder="nome@exemplo.com" value="'+esc(ctx.email||'')+'"'+(fixo?' readonly aria-readonly="true"':'')+'>'+
    '<p class="help" id="ajuda-d-email">'+(fixo?'Confirmado na etapa anterior.':'Para lembrar de você neste aparelho.')+'</p>'+
    '</div>'+
    '<div class="fld cx-ac" id="g-d-aceite">'+
    '<label class="cx-ac__l"><input type="checkbox" id="d-aceite"><span>Li e aceito os <a href="../../legal/#termos">Termos</a> e a <a href="../../legal/#privacidade">Privacidade</a>.</span></label>'+
    '<p class="help" id="ajuda-d-aceite"></p>'+
    '</div>'+
    '<button type="submit" class="led-btn led-btn--block" id="b-dados"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Entrar no Polar Life</span></button>'+
    '</form>'+
    '<button type="button" class="cx-trocar" id="b-voltar-dados">Voltar</button>';
  $('b-voltar-dados').addEventListener('click',function(){if(ctx.origem==='codigo'&&C.sairCodigo)C.sairCodigo();if(ctx.origem==='email'&&C.sair)C.sair();renderEmail(EMAIL)});
  $('f-dados').addEventListener('submit',function(ev){
    ev.preventDefault();
    ['nome','email','aceite'].forEach(function(k){var e=$('erro-d-'+k);if(e)e.remove();$('g-d-'+k).classList.remove('fld--err')});
    var r=C.completarCadastro({nome:$('d-nome').value,email:$('d-email').value,origem:ctx.origem,aceite:$('d-aceite').checked});
    if(r.erro){
      var msg={nome:'Digite seu nome (de 2 a 60 letras).',email:'Digite um e-mail válido, como nome@exemplo.com.',aceite:'Para entrar, aceite os Termos e a Privacidade.',codigo:'O código saiu da sessão. Confira o código de novo.'}[r.erro];
      var alvo=r.erro==='codigo'?'aceite':r.erro,g=$('g-d-'+alvo);g.classList.add('fld--err');
      var d=document.createElement('div');d.innerHTML=er(msg);var p=d.firstChild;p.id='erro-d-'+alvo;
      g.insertBefore(p,$('ajuda-d-'+alvo));focar($(alvo==='aceite'?'d-aceite':'d-'+alvo));return
    }
    toast('Olá, '+$('d-nome').value.trim().split(' ')[0]+'! · Ambiente de teste');
    clearTimeout(tmIr);tmIr=setTimeout(irPara,900)
  });
  focar(fixo?$('d-nome'):$('d-nome'))
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
    linha='<p class="cx-lead">Você já entrou como <strong>'+esc(s.nome||s.email)+'</strong> ('+(pl.nome||'Grátis')+').</p>'
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
/* volta do Google (D-147g): lida antes de tudo, e o token sai da barra de endereço */
var GR=window.PLGOOGLE&&PLGOOGLE.lerRetorno();
if(GR&&GR.voltar&&!voltar)voltar=GR.voltar;
if(C&&G){
  if(!C.temLocalStorage())semSuporte();
  else if(GR&&GR.erro){renderEmail('');toast(GR.erro==='cancelado'?'Entrada com Google cancelada.':'Não foi possível confirmar a conta Google. Tente de novo.')}
  else if(GR){var rg=C.entrarComProvedor({email:GR.email,nome:GR.nome,provedor:'google'});
    if(rg.ok){toast('Olá, '+String(rg.nome||GR.email).split(' ')[0]+'!');tmIr=setTimeout(irPara,700)}
    else if(rg.pendente)renderDados({origem:'google',email:GR.email,nome:rg.nome,verificado:true});
    else{renderEmail('');toast('Não foi possível confirmar a conta Google. Tente de novo.')}}
  else if(C.temSessao()&&C.cadastroPendente&&C.cadastroPendente()){var sc0=C.sessaoCodigo(),s0=C.sessao();renderDados(sc0?{origem:'codigo',email:''}:{origem:(s0&&s0.provedor)||'email',email:s0&&s0.email,nome:s0&&s0.nome,verificado:!!(s0&&s0.provedor==='google')})}
  else if(C.temSessao())renderEntrou();
  else renderEmail('');
}else{
  document.documentElement.className+=' sem-js'
}
})();
