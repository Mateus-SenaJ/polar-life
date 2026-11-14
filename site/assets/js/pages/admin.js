/* T-33 · Painel do admin (brief §4, D-116, D-124). Edita limites (pl-planos) e contas de teste;
   gera/revoga códigos de impressão (guarda só hashes). Tudo local neste navegador (T5). */
(function(){
var $=function(i){return document.getElementById(i)};
var C=window.PLCONTA,G=window.PLGUARDA;
var MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
var tmToast=null,tmDesf=null,tmVal=null,sujo=false,antes=null,abridor=null,EDIT=null;

function toast(msg,desfazer){
  clearTimeout(tmToast);clearTimeout(tmDesf);
  $('toast-t').textContent=msg;$('toast-desfazer').hidden=!desfazer;
  $('toast').hidden=false;
  tmToast=setTimeout(function(){$('toast').hidden=true},desfazer?8000:4000)
}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ico(n){return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+n+'</svg>'}
var I={x:'<path d="M6 6l12 12M18 6L6 18"/>',atn:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  lixo:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  cop:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'};
function dataCurta(ts){var d=new Date(ts);return ('0'+d.getDate()).slice(-2)+'/'+MESES[d.getMonth()]+'/'+d.getFullYear()}
function focar(el){try{el.focus({preventScroll:true})}catch(e){el.focus()}}
function pendencias(on){
  sujo=on;
  $('chip-pend').hidden=!on
}
function limpaValid(f){
  f.className='adm-f';
  var e=f.querySelector('.adm-err'),a=f.querySelector('.adm-atn');
  if(e)e.remove();if(a)a.remove()
}
function marcaErro(f,msg){
  limpaValid(f);
  var d=document.createElement('p');
  d.className='adm-err';d.setAttribute('role','alert');
  d.innerHTML=ico(I.x)+'<span>'+esc(msg)+'</span>';
  f.appendChild(d);f.className='adm-f adm-f--err';pendencias(true)
}
function marcaAtn(f,msg){
  var e=f.querySelector('.adm-atn');
  if(e)return;
  var d=document.createElement('p');
  d.className='adm-atn';
  d.innerHTML=ico(I.atn)+'<span>'+esc(msg)+'</span>';
  f.appendChild(d)
}

/* ---------- campo numérico genérico (FN-00a: 44 px, unidade dentro) ---------- */
/* opts: {id, rotulo, valor, min, max, passo, unidade, prefixo, decimais, aoMudar} */
function numerico(o){
  var f=document.createElement('div');
  f.className='adm-f';f.id='f-'+o.id;
  var fmt_=function(v){
    if(o.decimais)return String(v.toFixed(o.decimais)).replace('.',',');
    return String(Math.round(v))
  };
  f.innerHTML='<span class="adm-f__l" id="'+o.id+'-l">'+esc(o.rotulo)+'</span>'+
    '<span class="num"><button type="button" class="num__b" aria-label="Diminuir '+esc(o.rotulo)+'"><svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button>'+
    '<span class="num__v"><input id="'+o.id+'" inputmode="'+(o.decimais?'decimal':'numeric')+'" value="'+fmt_(o.valor)+'" aria-labelledby="'+o.id+'-l"'+(o.prefixo?' class="com-pre"':'')+'>'+
    (o.prefixo?'<span class="num__pre">'+o.prefixo+'</span>':'')+(o.unidade?'<span class="num__u">'+o.unidade+'</span>':'')+'</span>'+
    '<button type="button" class="num__b" aria-label="Aumentar '+esc(o.rotulo)+'"><svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></span>';
  var inp=f.querySelector('input'),bs=f.querySelectorAll('.num__b');
  function le(){
    var v=parseFloat(inp.value.replace(',','.'));
    return isNaN(v)?null:v
  }
  function aplica(v,silencioso){
    if(v===null){marcaErro(f,o.msgErro);return null}
    if(v<o.min||v>o.max){marcaErro(f,o.msgErro);return null}
    inp.value=fmt_(v);
    if(!silencioso){limpaValid(f);pendencias(true);o.aoMudar&&o.aoMudar(v)}
    return v
  }
  inp.addEventListener('input',function(){
    clearTimeout(tmVal);
    tmVal=setTimeout(function(){aplica(le())},80) /* debounce 80 ms (FN-00c) */
  });
  bs[0].addEventListener('click',function(){
    var v=le();if(v===null)v=o.max||0;
    aplica(Math.max(o.min,Math.round((v-o.passo)*100)/100))
  });
  bs[1].addEventListener('click',function(){
    var v=le();if(v===null)v=o.min||0;
    aplica(Math.min(o.max,Math.round((v+o.passo)*100)/100))
  });
  return {el:f,input:inp,le:le}
}
function texto(o){ /* pacotes: «1, 5, 10» */
  var f=document.createElement('div');
  f.className='adm-f';f.id='f-'+o.id;
  f.innerHTML='<span class="adm-f__l" id="'+o.id+'-l">'+esc(o.rotulo)+'</span>'+
    '<input class="txt" id="'+o.id+'" value="'+esc(o.valor)+'" aria-labelledby="'+o.id+'-l">';
  var inp=f.querySelector('input');
  inp.addEventListener('input',function(){
    clearTimeout(tmVal);
    tmVal=setTimeout(function(){
      var v=inp.value.split(',').map(function(s){return s.trim()}).filter(function(s){return s!==''}).map(Number);
      var ok=v.length>0&&v.every(function(n){return isFinite(n)&&Math.floor(n)===n&&n>=1&&n<=50});
      if(!ok)marcaErro(f,'Use números inteiros de 1 a 50 separados por vírgula.');
      else{limpaValid(f);pendencias(true);o.aoMudar&&o.aoMudar(v)}
    },80)
  });
  return {el:f,input:inp}
}

/* ---------- render ---------- */
function render(){
  var pl=C.plano()||{};
  if(pl.id!=='admin'){renderSemPermissao();return}
  $('pe').hidden=false;
  var L=C.limites().planos;
  EDIT=L; /* os campos escrevem nesta cópia; «Salvar» grava */
  var cx=$('corpo');
  cx.innerHTML='';

  var grid=document.createElement('div');
  grid.className='adm-grid';

  /* Grátis */
  var g=card('Grátis');
  g.appendChild(numerico({id:'g-fotos',rotulo:'Fotos por projeto',valor:L.gratis.fotos,min:1,max:500,passo:1,unidade:'fotos',msgErro:'Use um número inteiro entre 1 e 500.',aoMudar:function(v){L.gratis.fotos=v;confere()}}).el);
  g.appendChild(numerico({id:'g-folhas',rotulo:'Folhas grátis por mês',valor:L.gratis.folhasMes,min:0,max:10,passo:1,unidade:'folhas',msgErro:'Use um número inteiro entre 0 e 10.',aoMudar:function(v){L.gratis.folhasMes=v}}).el);
  g.appendChild(fixo('Dia de renovação do grátis','Renova em 1º de cada mês (fuso de Brasília).'));
  g.appendChild(sw('assin-gratis','Pode desligar a assinatura',L.gratis.assinatura,function(v){L.gratis.assinatura=v}));
  grid.appendChild(g);

  /* Folha avulsa */
  var a=card('Folha avulsa');
  a.appendChild(numerico({id:'a-fotos',rotulo:'Fotos por projeto',valor:L.avulsa.fotos,min:1,max:500,passo:1,unidade:'fotos',msgErro:'Use um número inteiro entre 1 e 500.',aoMudar:function(v){L.avulsa.fotos=v;confere()}}).el);
  a.appendChild(texto({id:'a-pacotes',rotulo:'Folhas por compra (pacotes)',valor:(L.avulsa.pacotes||[1,5,10]).join(', '),aoMudar:function(v){L.avulsa.pacotes=v}}).el);
  a.appendChild(numerico({id:'a-preco',rotulo:'Preço da folha padrão (R$)',valor:L.avulsa.precoPadrao,min:0,max:99.9,passo:0.1,decimais:2,prefixo:'R$',msgErro:'Use um valor entre 0,00 e 99,90.',aoMudar:function(v){L.avulsa.precoPadrao=v}}).el);
  a.appendChild(numerico({id:'a-grande',rotulo:'Preço da folha grande (R$)',valor:L.avulsa.precoGrande,min:0,max:99.9,passo:0.1,decimais:2,prefixo:'R$',msgErro:'Use um valor entre 0,00 e 99,90.',aoMudar:function(v){L.avulsa.precoGrande=v}}).el);
  a.appendChild(sw('assin-avulsa','Pode desligar a assinatura',L.avulsa.assinatura,function(v){L.avulsa.assinatura=v}));
  grid.appendChild(a);

  /* Pro */
  var p=card('Pro');
  p.appendChild(numerico({id:'p-fotos',rotulo:'Fotos por projeto',valor:L.pro.fotos,min:1,max:500,passo:1,unidade:'fotos',msgErro:'Use um número inteiro entre 1 e 500.',aoMudar:function(v){L.pro.fotos=v;confere()}}).el);
  p.appendChild(numerico({id:'p-mes',rotulo:'Preço mensal (R$)',valor:L.pro.precoMes,min:0,max:99.9,passo:0.1,decimais:2,prefixo:'R$',msgErro:'Use um valor entre 0,00 e 99,90.',aoMudar:function(v){L.pro.precoMes=v}}).el);
  p.appendChild(numerico({id:'p-uso',rotulo:'Uso razoável (folhas por mês)',valor:L.pro.usoRazoavel,min:10,max:1000,passo:10,unidade:'folhas',msgErro:'Use um número entre 10 e 1000.',aoMudar:function(v){L.pro.usoRazoavel=v}}).el);
  p.appendChild(selectPct(L.pro.avisoPct,function(v){L.pro.avisoPct=v}));
  p.appendChild(sw('assin-pro','Pode desligar a assinatura',L.pro.assinatura,function(v){L.pro.assinatura=v}));
  grid.appendChild(p);

  cx.appendChild(grid);
  cx.appendChild(contas());
  cx.appendChild(codigos());
  if(C.admin.criarCupom)cx.appendChild(cupons());
  if(window.PLAVISOS)cx.appendChild(notificacoes());
  antes=null;pendencias(false);
  function confere(){ /* atenção Pro < Grátis em fotos (não bloqueia) */
    var fg=document.getElementById('f-p-fotos');
    if(!fg)return;
    if(L.pro.fotos<L.gratis.fotos)marcaAtn(fg,'O Pro tem menos fotos por projeto que o Grátis. Tem certeza?');
    else{var atn=fg.querySelector('.adm-atn');if(atn)atn.remove()}
  }
}
function card(nome){
  var d=document.createElement('section');
  d.className='adm-c';
  d.innerHTML='<h2 class="adm-c__t">'+esc(nome)+'</h2>';
  return d
}
function fixo(rotulo,valor){
  var f=document.createElement('div');
  f.className='adm-f';
  f.innerHTML='<span class="adm-f__l">'+esc(rotulo)+'</span><div class="adm-fix"><span>'+esc(valor)+'</span></div>';
  return f
}
function sw(id,rotulo,val,cb){
  var f=document.createElement('div');
  f.className='adm-f';
  f.innerHTML='<div class="sw-row"><div><span class="adm-f__l" id="'+id+'-l">'+esc(rotulo)+'</span></div>'+
    '<button type="button" class="sw" id="'+id+'" role="switch" aria-checked="'+(val?'true':'false')+'" aria-labelledby="'+id+'-l"><span></span></button></div>';
  f.querySelector('.sw').addEventListener('click',function(){
    var novo=this.getAttribute('aria-checked')!=='true';
    this.setAttribute('aria-checked',novo?'true':'false');
    pendencias(true);cb(novo)
  });
  return f
}
function selectPct(val,cb){
  var f=document.createElement('div');
  f.className='adm-f';
  f.innerHTML='<span class="adm-f__l" id="p-aviso-l">Avisar em (% do uso razoável)</span><span class="sel"><select id="p-aviso" aria-labelledby="p-aviso-l">'+
    [50,70,80,90].map(function(x){return '<option value="'+x+'"'+(x===val?' selected':'')+'>'+x+' %</option>'}).join('')+
    '</select></span>';
  f.querySelector('select').addEventListener('change',function(){pendencias(true);cb(+this.value)});
  return f
}

/* ---------- contas de teste (tabela desktop / cartões mobile) ---------- */
function contas(){
  var sec=document.createElement('section');
  sec.className='adm-sec';
  sec.setAttribute('aria-labelledby','t-contas');
  sec.innerHTML='<h2 class="adm-sec__t" id="t-contas">Contas deste aparelho</h2><p class="adm-sec__p">Plano, folhas e uso do mês de cada conta. «Entrar como» troca a sessão deste navegador.</p>';
  var cs=C.contasTeste();

  var tb=document.createElement('div');
  var linhas=cs.map(function(c){
    var adminFixo=c.perfil==='admin';
    return '<tr><td><strong>'+esc(c.nome)+'</strong></td><td class="mono">'+esc(c.email)+'</td>'+
    '<td><span class="sel"><select data-email="'+esc(c.email)+'" data-k="perfil" aria-label="Plano de '+esc(c.nome)+'"'+(adminFixo?' disabled':'')+'>'+
    ['gratis','avulsa','pro'].map(function(p){return '<option value="'+p+'"'+(p===c.perfil?' selected':'')+'>'+esc({gratis:'Grátis',avulsa:'Folha avulsa',pro:'Pro'}[p])+'</option>'}).join('')+
    '</select></span>'+(adminFixo?'<p class="help">Admin fica no Pro + painel.</p>':'')+'</td>'+
    '<td><span class="num"><span class="num__v"><input data-email="'+esc(c.email)+'" data-k="padrao" inputmode="numeric" value="'+c.folhasPadrao+'" aria-label="Folhas padrão de '+esc(c.nome)+'"></span></span></td>'+
    '<td><span class="num"><span class="num__v"><input data-email="'+esc(c.email)+'" data-k="grande" inputmode="numeric" value="'+c.folhasGrande+'" aria-label="Folhas grandes de '+esc(c.nome)+'"></span></span></td>'+
    '<td><span class="num"><span class="num__v"><input data-email="'+esc(c.email)+'" data-k="mes" inputmode="numeric" value="'+c.usadasMes+'" aria-label="Usadas no mês por '+esc(c.nome)+'"></span></span></td>'+
    '<td><button type="button" class="b44" data-zerar="'+esc(c.email)+'">Zerar mês</button></td>'+
    '<td><button type="button" class="b44" data-como="'+esc(c.email)+'">Entrar como</button></td></tr>'
  }).join('');
  tb.innerHTML='<table class="tbl"><thead><tr><th>Nome</th><th>E-mail</th><th>Plano</th><th>Folhas padrão</th><th>Folhas grandes</th><th>Usadas no mês</th><th></th><th></th></tr></thead><tbody>'+linhas+'</tbody></table>';

  var cards=document.createElement('div');
  cards.className='adm-contas--cards';
  cards.innerHTML=cs.map(function(c){
    var adminFixo=c.perfil==='admin';
    return '<div class="adm-conta"><div class="adm-conta__top"><div><p>'+esc(c.nome)+'</p><p class="adm-conta__mail mono">'+esc(c.email)+'</p></div>'+
    '<span class="sit">'+esc({admin:'Pro + painel',gratis:'Grátis',avulsa:'Folha avulsa',pro:'Pro'}[c.perfil])+'</span></div>'+
    '<div class="adm-conta__grid">'+
    '<div><span class="adm-f__l">Plano</span><span class="sel"><select data-email="'+esc(c.email)+'" data-k="perfil"'+(adminFixo?' disabled':'')+'>'+
    ['gratis','avulsa','pro'].map(function(p){return '<option value="'+p+'"'+(p===c.perfil?' selected':'')+'>'+esc({gratis:'Grátis',avulsa:'Folha avulsa',pro:'Pro'}[p])+'</option>'}).join('')+'</select></span></div>'+
    '<div><span class="adm-f__l">Folhas padrão</span><span class="num"><span class="num__v"><input data-email="'+esc(c.email)+'" data-k="padrao" inputmode="numeric" value="'+c.folhasPadrao+'"></span></span></div>'+
    '<div><span class="adm-f__l">Folhas grandes</span><span class="num"><span class="num__v"><input data-email="'+esc(c.email)+'" data-k="grande" inputmode="numeric" value="'+c.folhasGrande+'"></span></span></div>'+
    '<div><span class="adm-f__l">Usadas no mês</span><span class="num"><span class="num__v"><input data-email="'+esc(c.email)+'" data-k="mes" inputmode="numeric" value="'+c.usadasMes+'"></span></span></div>'+
    '</div><div class="adm-conta__act"><button type="button" class="btn2" data-zerar="'+esc(c.email)+'">Zerar mês</button>'+
    '<button type="button" class="btn2" data-como="'+esc(c.email)+'">Entrar como</button></div></div>'
  }).join('');

  sec.appendChild(tb);sec.appendChild(cards);

  function leContas(){
    var lista=C.contasTeste(),els=[].slice.call(sec.querySelectorAll('[data-email]')),por={},i,e,k;
    for(i=0;i<els.length;i++){
      e=els[i].getAttribute('data-email');k=els[i].getAttribute('data-k');
      por[e]=por[e]||{};
      if(k==='perfil'){if(!els[i].disabled)por[e].perfil=els[i].value}
      else por[e][k]=parseInt(els[i].value.replace(/\D/g,''),10)||0
    }
    for(i=0;i<lista.length;i++){
      if(por[lista[i].email]){
        if(por[lista[i].email].perfil)lista[i].perfil=por[lista[i].email].perfil;
        lista[i].folhasPadrao=por[lista[i].email].padrao!==undefined?por[lista[i].email].padrao:lista[i].folhasPadrao;
        lista[i].folhasGrande=por[lista[i].email].grande!==undefined?por[lista[i].email].grande:lista[i].folhasGrande;
        lista[i].usadasMes=por[lista[i].email].mes!==undefined?por[lista[i].email].mes:lista[i].usadasMes
      }
    }
    return lista
  }
  function aplica(){
    var lista=leContas();
    C.admin.salvarContas(lista);
    toast('Contas atualizadas neste navegador')
  }
  sec.addEventListener('change',function(e){if(e.target.matches('select[data-email]'))aplica()});
  sec.addEventListener('input',deb(function(e){if(e.target.matches('input[data-email]'))aplica()},300));
  [].slice.call(sec.querySelectorAll('[data-zerar]')).forEach(function(b){
    b.addEventListener('click',function(){
      var em=this.getAttribute('data-zerar');
      var lista=leContas().map(function(c){if(c.email===em)c.usadasMes=0;return c});
      C.admin.salvarContas(lista);
      toast('Uso do mês zerado');
      render()
    })
  });
  [].slice.call(sec.querySelectorAll('[data-como]')).forEach(function(b){
    b.addEventListener('click',function(){
      var em=this.getAttribute('data-como'),c=null;
      C.contasTeste().forEach(function(x){if(x.email===em)c=x});
      if(!c)return;
      C.sair();
      C.entrarComo(c.perfil==='admin'?'admin':c.perfil);
      toast('Você entrou como '+c.nome);
      setTimeout(function(){location.href=G?G.raiz():'../'},800)
    })
  });
  return sec
}
function deb(fn,ms){var t;return function(){var a=arguments,s=this;clearTimeout(t);t=setTimeout(function(){fn.apply(s,a)},ms)}}

/* ---------- códigos de impressão (D-124) ---------- */
function codigos(){
  var sec=document.createElement('section');
  sec.className='adm-sec adm-cod';
  sec.setAttribute('aria-labelledby','t-cod');
  var pacs=C.pacotes(),ops='';
  for(var k in pacs)ops+='<option value="'+k+'">'+esc(pacs[k].nome)+'</option>';
  sec.innerHTML='<h2 class="adm-sec__t" id="t-cod">Códigos de impressão</h2>'+
    '<p class="adm-sec__p">Cada código vale um pacote de folhas para quem não quer conta. A conferência e o uso acontecem neste navegador; só os hashes ficam guardados.</p>'+
    '<div class="adm-cod__form">'+
    '<div class="adm-f"><span class="adm-f__l" id="cod-pac-l">Pacote</span><span class="sel"><select id="cod-pac" aria-labelledby="cod-pac-l">'+ops+'</select></span></div>'+
    '<div class="adm-f"><span class="adm-f__l" id="cod-qtd-l">Quantidade (1–100)</span><span class="num"><span class="num__v"><input id="cod-qtd" inputmode="numeric" value="10" aria-labelledby="cod-qtd-l"><span class="num__u">códigos</span></span></span></div>'+
    '<div class="adm-f"><span class="adm-f__l" id="cod-val-l">Validade (dias)</span><span class="num"><span class="num__v"><input id="cod-val" inputmode="numeric" value="30" aria-labelledby="cod-val-l"><span class="num__u">dias</span></span></span></div>'+
    '<button type="button" class="btn2 btn2--lg" id="cod-gerar">Gerar códigos</button>'+
    '</div>'+
    '<div id="cod-res"></div>'+
    '<div class="adm-cod__aviso">'+ico(I.atn)+'<span>Os códigos são gerados e guardados só neste navegador.</span></div>'+
    '<div id="cod-tabela"></div>';

  sec.querySelector('#cod-gerar').addEventListener('click',function(){
    var qtd=Math.max(1,Math.min(100,parseInt(sec.querySelector('#cod-qtd').value.replace(/\D/g,''),10)||1));
    var val=Math.max(1,parseInt(sec.querySelector('#cod-val').value.replace(/\D/g,''),10)||30);
    var pac=sec.querySelector('#cod-pac').value;
    var b=this;b.disabled=true;
    C.admin.gerarCodigos(pac,qtd,val).then(function(lista){
      b.disabled=false;
      /* lista legível mostrada UMA vez (D-124) */
      sec.querySelector('#cod-res').innerHTML='<div class="adm-cod__res">'+
        '<div class="adm-sec__t">Copie seus códigos agora</div>'+
        '<p class="adm-sec__p">Esta lista não aparece de novo. Depois de copiar, só o hash fica guardado.</p>'+
        '<ul class="adm-cod__lista">'+lista.map(function(x){return '<li>'+esc(x.codigo)+'</li>'}).join('')+'</ul>'+
        '<p style="margin-top:16px"><button type="button" class="btn2" id="cod-cop">'+ico(I.cop)+'Copiar todos</button></p></div>';
      var bc=sec.querySelector('#cod-cop');
      bc.addEventListener('click',function(){
        var t=lista.map(function(x){return x.codigo}).join('\n');
        var ok=function(){toast(qtd+' códigos copiados')};
        if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,function(){fallback()});
        else fallback();
        function fallback(){
          var ta=document.createElement('textarea');
          ta.value=t;document.body.appendChild(ta);ta.select();
          try{document.execCommand('copy');ok()}catch(e){toast('Não foi possível copiar')}
          ta.remove()
        }
      });
      tabelaCodigos();
      toast(qtd+' códigos gerados neste navegador')
    },function(){b.disabled=false;toast('Não foi possível gerar os códigos.')})
  });
  sec.querySelector('#cod-res').innerHTML='';
  tabelaCodigos();
  function tabelaCodigos(){
    var ls=C.admin.listarCodigos();
    if(!ls.length){sec.querySelector('#cod-tabela').innerHTML='';return}
    sec.querySelector('#cod-tabela').innerHTML=
      '<div style="margin-top:16px;overflow:auto"><table class="tbl"><thead><tr><th>Hash curto</th><th>Pacote</th><th>Criado</th><th>Validade</th><th>Situação</th><th></th></tr></thead><tbody>'+
      ls.map(function(x){
        return '<tr><td class="mono">'+esc(x.curto)+'…</td><td>'+esc((C.pacotes()[x.pacote]||{}).nome||x.pacote)+'</td>'+
        '<td class="mono">'+dataCurta(x.criadoEm)+'</td><td>'+esc(x.validaDias)+' dias</td>'+
        '<td><span class="sit">'+esc(x.revogado?'revogado':x.usadoEm?'usado':x.situacao==='vencido'?'vencido':'livre')+'</span></td>'+
        '<td>'+(x.revogado||x.usadoEm?'':'<button type="button" class="b44" data-rev="'+esc(x.hash)+'">Revogar</button>')+'</td></tr>'
      }).join('')+'</tbody></table></div>';
    [].slice.call(sec.querySelectorAll('[data-rev]')).forEach(function(b){
      b.addEventListener('click',function(){
        C.admin.revogarCodigo(this.getAttribute('data-rev'));
        toast('Código revogado');
        tabelaCodigos()
      })
    })
  }
  return sec
}

/* ---------- cupons promocionais (D-208 · comercial.cupons) ----------
   Criar (o texto do cupom é mostrado só agora; fica o hash), listar com usos e validade, pausar, reativar e revogar. */
function cupons(){
  var sec=document.createElement('section');sec.className='adm-sec adm-cup';sec.id='sec-cupons';sec.setAttribute('aria-labelledby','t-cup');
  var P=C.PRODUTOS,prods='';for(var k in P)prods+='<label class="adm-cup__p"><input type="checkbox" name="cup-prod" value="'+k+'" checked><span>'+esc(P[k])+'</span></label>';
  sec.innerHTML='<h2 class="adm-sec__t" id="t-cup">Cupons promocionais</h2>'+
    '<p class="adm-sec__p">Desconto na compra de folhas ou na assinatura do Pro. Quem tem o cupom digita em Folhas e planos. Só o hash do cupom fica guardado.</p>'+
    '<form class="adm-cup__form" id="cup-form" novalidate>'+
    '<div class="adm-f"><label class="adm-f__l" for="cup-texto">Cupom</label><input class="txt" id="cup-texto" maxlength="20" autocomplete="off" autocapitalize="characters" placeholder="VERAO10"></div>'+
    '<div class="adm-f"><label class="adm-f__l" for="cup-rot">Nome para reconhecer</label><input class="txt" id="cup-rot" maxlength="60" autocomplete="off" placeholder="Verão 2026"></div>'+
    '<div class="adm-f"><span class="adm-f__l" id="cup-tipo-l">Desconto</span><div class="adm-cup__d"><span class="sel"><select id="cup-tipo" aria-labelledby="cup-tipo-l"><option value="percentual">Porcentagem</option><option value="valor">Valor fixo</option></select></span>'+
    '<input class="txt" id="cup-val" inputmode="decimal" value="10" aria-label="Quanto de desconto"><span class="adm-cup__u" id="cup-u">%</span></div></div>'+
    '<fieldset class="adm-f adm-cup__ps"><legend class="adm-f__l">Vale para</legend>'+prods+'</fieldset>'+
    '<div class="adm-f"><label class="adm-f__l" for="cup-ate">Validade</label><input class="txt" id="cup-ate" type="date"><span class="adm-nt__dica">Vazio: sem prazo</span></div>'+
    '<div class="adm-f"><label class="adm-f__l" for="cup-max">Limite de usos</label><input class="txt" id="cup-max" inputmode="numeric" placeholder="Sem limite"></div>'+
    '<label class="adm-cup__um"><input type="checkbox" id="cup-um" checked><span>Uma vez por conta</span></label>'+
    '<p class="adm-err" id="cup-erro" role="alert" hidden></p>'+
    '<button type="submit" class="btn2 btn2--lg" id="cup-criar">Criar cupom</button></form>'+
    '<div class="adm-cod__aviso">'+ico(I.atn)+'<span>Demonstração · sem servidor: os cupons valem neste navegador.</span></div>'+
    '<div id="cup-tabela"></div>';
  var q=function(s){return sec.querySelector(s)};
  q('#cup-tipo').addEventListener('change',function(){q('#cup-u').textContent=this.value==='valor'?'R$':'%'});
  q('#cup-form').addEventListener('submit',function(e){e.preventDefault();
    var tipo=q('#cup-tipo').value,v=parseFloat(String(q('#cup-val').value).replace(',','.')),d={texto:q('#cup-texto').value,rotulo:q('#cup-rot').value,tipo:tipo,
      percentual:tipo==='percentual'?v:null,valor:tipo==='valor'?v:null,produtos:[].map.call(sec.querySelectorAll('[name=cup-prod]:checked'),function(x){return x.value}),
      validoAte:q('#cup-ate').value?q('#cup-ate').value+'T23:59:59':null,usosMax:q('#cup-max').value?parseInt(q('#cup-max').value,10):null,umPorConta:q('#cup-um').checked};
    C.admin.criarCupom(d).then(function(r){var er=q('#cup-erro');
      if(r.erros){var k=Object.keys(r.erros);er.textContent=k.map(function(x){return r.erros[x]}).join(' ');er.hidden=false;return}
      er.hidden=true;toast('Cupom '+String(d.texto).toUpperCase().replace(/[^A-Z0-9]/g,'')+' criado');q('#cup-texto').value='';q('#cup-rot').value='';tabela()})});
  function tabela(){
    var ls=C.admin.listarCupons();
    if(!ls.length){q('#cup-tabela').innerHTML='<p class="adm-sec__p">Nenhum cupom ainda.</p>';return}
    q('#cup-tabela').innerHTML='<div class="adm-cup__tab"><table class="tbl"><thead><tr><th>Cupom</th><th>Nome</th><th>Desconto</th><th>Vale para</th><th>Validade</th><th>Usos</th><th>Situação</th><th></th></tr></thead><tbody>'+
      ls.map(function(x){return '<tr><td class="mono">…'+esc(x.final)+'</td><td>'+esc(x.rotulo)+'</td><td>'+(x.tipo==='percentual'?x.percentual+'%':C.moeda(x.valor))+'</td><td>'+esc(x.produtos.join(', '))+'</td>'+
        '<td class="mono">'+(x.validoAte?dataCurta(+new Date(x.validoAte)):'—')+'</td><td class="mono">'+x.usos+(x.usosMax?' de '+x.usosMax:'')+'</td><td><span class="sit">'+esc(x.situacao)+'</span></td><td class="adm-cup__acts">'+
        (x.situacao==='ativo'?'<button type="button" class="b44" data-cup="'+esc(x.id)+'" data-sit="pausado">Pausar</button>':x.situacao==='pausado'?'<button type="button" class="b44" data-cup="'+esc(x.id)+'" data-sit="ativo">Reativar</button>':'')+
        (x.situacao!=='revogado'?'<button type="button" class="b44" data-cup="'+esc(x.id)+'" data-sit="revogado">Revogar</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div>';
    [].forEach.call(sec.querySelectorAll('[data-cup]'),function(b){b.addEventListener('click',function(){var s=b.getAttribute('data-sit');C.admin.mudarCupom(b.getAttribute('data-cup'),s);toast(s==='revogado'?'Cupom revogado':s==='pausado'?'Cupom pausado':'Cupom reativado');tabela()})})
  }
  tabela();return sec
}

/* ---------- notificações (D-208, DOC-16 §6) ----------
   Campanhas (promoção, anúncio, aviso do sistema): criar, editar, prévia, rascunho, agendar, lançar, pausar, encerrar, duplicar e
   excluir; textos dos avisos automáticos e pausa de cada um; exportar o feed. Sem servidor: tudo vale neste navegador (T7).
   Cada botão daqui grava na hora (não depende de «Salvar alterações», que é dos limites dos planos). */
function notificacoes(){
  var A=window.PLAVISOS,AD=A.admin,sec=document.createElement('section'),editando='';
  var TIPO={promocao:'Promoção',anuncio:'Anúncio',sistema:'Aviso do sistema'},SIT={rascunho:'Rascunho',agendada:'Agendada','no-ar':'No ar',pausada:'Pausada',encerrada:'Encerrada'};
  var CANAL={app:'Só no painel do app',sistema:'Painel e notificação do aparelho'};
  var IT={promocao:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="8" cy="8" r="1.5"/>',anuncio:'<path d="M4 10v4h3l7 4V6l-7 4z"/><path d="M17 9a4 4 0 0 1 0 6"/>',sistema:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    lembranca:'<rect x="5" y="3" width="14" height="18" rx="1.5"/><rect x="7.5" y="5.5" width="9" height="9"/>',sugestao:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',codigo:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'};
  var q=function(s){return sec.querySelector(s)};
  function ops(o,sel){var h='',k;for(k in o)h+='<option value="'+esc(k)+'"'+(k===sel?' selected':'')+'>'+esc(o[k])+'</option>';return h}
  function d2(n){return ('0'+n).slice(-2)}
  function paraCampo(ms){if(!ms)return '';var d=new Date(ms);return d.getFullYear()+'-'+d2(d.getMonth()+1)+'-'+d2(d.getDate())+'T'+d2(d.getHours())+':'+d2(d.getMinutes())}
  function doCampo(v){if(!v)return null;var t=new Date(v).getTime();return isNaN(t)?null:t}
  function dataHora(ms){var d=new Date(ms);return dataCurta(ms)+' '+d2(d.getHours())+':'+d2(d.getMinutes())}
  function campo(id,rot,html,dica){return '<div class="adm-f" id="f-'+id+'"><label class="adm-f__l" for="'+id+'" id="'+id+'-l">'+rot+'</label>'+html+(dica?'<span class="adm-nt__dica" id="'+id+'-d">'+dica+'</span>':'')+'</div>'}

  sec.className='adm-sec adm-nt';sec.id='sec-notificacoes';sec.setAttribute('aria-labelledby','t-nt');
  var dest='<option value="">Sem botão</option>'+A.DESTINOS.map(function(d){return '<option value="'+esc(d.url||'./')+'">'+esc(d.nome)+'</option>'}).join('');
  sec.innerHTML='<h2 class="adm-sec__t" id="t-nt">Notificações</h2>'+
    '<p class="adm-sec__p">Promoções, anúncios e avisos do PolarLife para quem usa o app, e os textos dos avisos automáticos (lembranças, sugestões e prazos).</p>'+
    '<div class="adm-cod__aviso" id="nt-demo">'+ico(I.atn)+'<span>Demonstração · sem servidor. As campanhas ficam neste navegador e aparecem para as contas que abrirem o PolarLife nele; nada é enviado a outros aparelhos.</span></div>'+
    '<div class="adm-nt__grade">'+
    '<form class="adm-nt__form" id="nt-form" novalidate aria-labelledby="nt-form-t"><h3 class="adm-nt__h" id="nt-form-t">Nova campanha</h3>'+
    campo('nt-tipo','Tipo','<span class="sel"><select id="nt-tipo">'+ops(TIPO,'promocao')+'</select></span>')+
    campo('nt-titulo','Título','<input class="txt" id="nt-titulo" maxlength="60" autocomplete="off">','<span id="nt-titulo-n">0</span> de 60')+
    campo('nt-texto','Texto','<textarea class="txt adm-nt__area" id="nt-texto" maxlength="160" rows="3"></textarea>','<span id="nt-texto-n">0</span> de 160')+
    '<div class="adm-nt__par">'+campo('nt-url','Botão leva para','<span class="sel"><select id="nt-url">'+dest+'</select></span>')+
    campo('nt-botao','Texto do botão','<input class="txt" id="nt-botao" maxlength="24" autocomplete="off" placeholder="Ver oferta">')+'</div>'+
    campo('nt-publico','Público','<span class="sel"><select id="nt-publico">'+ops(A.PUBLICOS,'todos')+'</select></span>')+
    '<div class="adm-nt__par">'+campo('nt-inicio','Início','<input class="txt" id="nt-inicio" type="datetime-local">','Vazio: ao lançar')+
    campo('nt-fim','Fim','<input class="txt" id="nt-fim" type="datetime-local">','Vazio: até encerrar')+'</div>'+
    campo('nt-canal','Onde aparece','<span class="sel"><select id="nt-canal">'+ops(CANAL,'app')+'</select></span>','No aparelho, só para quem permitiu; no máximo 1 por dia, sem som.')+
    '<p class="adm-err" id="nt-erro" role="alert" hidden></p>'+
    '<div class="adm-nt__act"><button type="submit" class="btn2" id="nt-salvar">Salvar rascunho</button><button type="button" class="btn2" id="nt-agendar">Agendar</button>'+
    '<button type="button" class="btn2" id="nt-lancar">Lançar agora</button><button type="button" class="btn2" id="nt-limpar">Limpar</button></div></form>'+
    '<div class="adm-nt__previa" aria-labelledby="nt-pv-t"><h3 class="adm-nt__h" id="nt-pv-t">Prévia</h3>'+
    '<p class="adm-f__l">No painel de avisos</p><div class="adm-nt__pv" id="nt-pv-painel"></div>'+
    '<p class="adm-f__l">Na notificação do aparelho</p><div class="adm-nt__sis" id="nt-pv-sis"></div>'+
    '<p class="adm-nt__dica">Promoções e anúncios vão sem imagem. A colagem só aparece nas lembranças e sugestões, montada no aparelho de cada pessoa com as fotos dela.</p></div>'+
    '</div>'+
    '<h3 class="adm-nt__h" id="nt-lista-t">Campanhas</h3><ul class="adm-nt__lista" id="nt-lista" aria-labelledby="nt-lista-t"></ul>'+
    '<div class="adm-nt__act"><button type="button" class="btn2" id="nt-exportar">'+ico('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>')+'Exportar JSON</button></div>'+
    '<p class="adm-nt__dica">O arquivo traz as campanhas lançadas e os textos automáticos, no formato que o servidor vai ler quando existir.</p>'+
    '<h3 class="adm-nt__h" id="nt-auto-t">Avisos automáticos</h3>'+
    '<p class="adm-sec__p">Gerados no aparelho de cada pessoa. Você escolhe o texto e pode pausar cada um.</p><div class="adm-nt__autos" id="nt-autos"></div>'+
    '<p class="adm-err" id="nt-auto-erro" role="alert" hidden></p>'+
    '<div class="adm-nt__act"><button type="button" class="btn2" id="nt-auto-salvar">Salvar textos</button><button type="button" class="btn2" id="nt-auto-padrao">Restaurar textos padrão</button></div>';

  function ler(){
    var u=q('#nt-url').value;
    return {id:editando||undefined,tipo:q('#nt-tipo').value,titulo:q('#nt-titulo').value,texto:q('#nt-texto').value,botao:u?q('#nt-botao').value:'',url:u==='./'?'':u,
      publico:q('#nt-publico').value,canal:q('#nt-canal').value,inicio:doCampo(q('#nt-inicio').value),fim:doCampo(q('#nt-fim').value)}
  }
  function preencher(c){
    editando=c?c.id:'';
    q('#nt-form-t').textContent=c?'Editando campanha':'Nova campanha';
    q('#nt-tipo').value=c?c.tipo:'promocao';q('#nt-titulo').value=c?c.titulo:'';q('#nt-texto').value=c?c.texto:'';
    q('#nt-botao').value=c?c.botao||'':'';q('#nt-url').value=c&&c.botao?(c.url||'./'):'';
    q('#nt-publico').value=c?c.publico:'todos';q('#nt-canal').value=c?c.canal:'app';
    q('#nt-inicio').value=c?paraCampo(c.inicio):'';q('#nt-fim').value=c?paraCampo(c.fim):'';
    q('#nt-limpar').textContent=c?'Cancelar edição':'Limpar';
    erro('');previa()
  }
  function erro(msg){var e=q('#nt-erro');e.hidden=!msg;e.innerHTML=msg?ico(I.x)+'<span>'+esc(msg)+'</span>':''}
  function previa(){
    var d=ler(),t=d.titulo.trim()||'Título da campanha',x=d.texto.trim()||'O texto aparece aqui, em até 160 caracteres.';
    q('#nt-titulo-n').textContent=d.titulo.length;q('#nt-texto-n').textContent=d.texto.length;
    q('#f-nt-botao').hidden=!q('#nt-url').value;
    q('#nt-pv-painel').innerHTML='<div class="av av--semimg"><div class="av__q"><p class="av__tipo"><svg viewBox="0 0 24 24" aria-hidden="true">'+IT[d.tipo]+'</svg>'+esc(A.TIPOS[d.tipo].um)+'</p><p class="av__n">'+esc(t)+'</p><p class="av__x">'+esc(x)+'</p></div>'+
      '<div class="av__act">'+(d.botao.trim()?'<span class="av__ir">'+esc(d.botao.trim())+'</span>':'')+'<span class="av__b">Lembrar amanhã</span><span class="av__b">Dispensar</span></div></div>';
    q('#nt-pv-sis').innerHTML=d.canal==='sistema'?'<img src="../../assets/img/icones/icone-192.png" width="40" height="40" alt=""><div><p class="adm-nt__sn">'+esc(t)+'</p><p class="adm-nt__sx">'+esc(x)+'</p><p class="adm-nt__so">PolarLife · sem som</p></div>':
      '<p class="adm-nt__sx">Esta campanha aparece só no painel do app.</p>'
  }
  function salvar(depois){ /* depois: 'lancar' | 'agendar' | undefined (rascunho) */
    var d=ler(),r,k;
    if(depois==='agendar'&&(!d.inicio||d.inicio<=Date.now())){erro('Para agendar, escolha um início no futuro.');focar(q('#nt-inicio'));return}
    r=AD.salvar(d);
    if(r.erros){for(k in r.erros){erro(r.erros[k]);var c=q('#nt-'+k);if(c)focar(c);return}}
    if(!r.ok){erro('Só a conta Admin grava campanhas.');return}
    if(depois){var r2=AD[depois](r.campanha.id);if(!r2.ok){erro(r2.erro==='fim'?'O fim já passou: ajuste a data para lançar.':'Não foi possível '+(depois==='lancar'?'lançar':'agendar')+' esta campanha.');editando=r.campanha.id;lista();return}}
    toast(depois==='lancar'?'Campanha lançada neste navegador':depois==='agendar'?'Campanha agendada':'Rascunho salvo');
    preencher(null);lista()
  }
  function lista(){
    var cs=AD.campanhas(),ul=q('#nt-lista');
    if(!cs.length){ul.innerHTML='<li class="adm-nt__vazio" id="nt-vazio">Nenhuma campanha ainda. Crie a primeira no formulário acima.</li>';return}
    ul.innerHTML=cs.map(function(c){
      var s=c.situacao,b=function(a,t){return '<button type="button" class="adm-nt__b" data-nt="'+a+'" data-id="'+esc(c.id)+'">'+t+'</button>'},h='';
      if(s!=='encerrada')h+=b('editar','Editar');
      if(s==='rascunho'||s==='agendada')h+=b('lancar','Lançar agora');
      if(s==='no-ar'||s==='agendada')h+=b('pausar','Pausar');
      if(s==='pausada')h+=b('retomar','Retomar');
      if(s!=='rascunho'&&s!=='encerrada')h+=b('encerrar','Encerrar');
      h+=b('duplicar','Duplicar')+b('excluir','Excluir');
      return '<li class="adm-nt__c" data-id="'+esc(c.id)+'" data-sit="'+s+'"><div class="adm-nt__ct"><p class="adm-nt__n">'+esc(c.titulo)+'</p><span class="sit">'+SIT[s]+'</span></div>'+
        '<p class="adm-nt__d">'+esc(c.texto)+'</p>'+
        '<p class="adm-nt__m">'+esc(TIPO[c.tipo])+' · '+esc(A.PUBLICOS[c.publico])+' · '+esc(CANAL[c.canal])+(c.botao?' · botão «'+esc(c.botao)+'»':'')+'</p>'+
        '<p class="adm-nt__m">'+(c.inicio?'Início '+dataHora(c.inicio):'Início ao lançar')+' · '+(c.fim?'fim '+dataHora(c.fim):'sem data de fim')+'</p>'+
        '<p class="adm-nt__k" aria-label="Contadores deste navegador"><span>Entregues <span class="mono" data-k="entregues">'+(c.cont.entregues||0)+'</span></span><span>Abertas <span class="mono" data-k="abertas">'+(c.cont.abertas||0)+'</span></span><span>Dispensadas <span class="mono" data-k="dispensadas">'+(c.cont.dispensadas||0)+'</span></span></p>'+
        '<div class="adm-nt__ca">'+h+'</div></li>'
    }).join('')
  }
  function autos(){
    var M=AD.modelos(),P=AD.pausados(),NOME={lembranca:'Lembrança «neste dia»',sugestao:'Sugestão do mês',codigo:'Prazo de código'},k,h='';
    for(k in M)h+='<div class="adm-nt__auto" data-auto="'+k+'"><div class="adm-nt__ct"><p class="adm-nt__n"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+IT[k]+'</svg>'+NOME[k]+'</p>'+
      '<div class="adm-nt__pausa"><span class="adm-f__l" id="nt-p-'+k+'-l">Pausado</span><button type="button" class="sw" id="nt-p-'+k+'" data-pausa="'+k+'" role="switch" aria-checked="'+(P[k]?'true':'false')+'" aria-labelledby="nt-p-'+k+'-l"><span></span></button></div></div>'+
      campo('nt-m-'+k+'-t','Título','<input class="txt" id="nt-m-'+k+'-t" maxlength="60" value="'+esc(M[k].titulo)+'" autocomplete="off">')+
      campo('nt-m-'+k+'-x','Texto','<textarea class="txt adm-nt__area" id="nt-m-'+k+'-x" maxlength="160" rows="2">'+esc(M[k].texto)+'</textarea>','Variáveis: '+A.VARS[k].map(function(v){return '{'+v+'}'}).join(' '))+
      '<p class="adm-nt__ex" id="nt-m-'+k+'-ex"></p></div>';
    q('#nt-autos').innerHTML=h;
    for(k in M)exemploDe(k)
  }
  function exemploDe(k){var v=AD.exemplo(k);q('#nt-m-'+k+'-ex').textContent='Exemplo: '+A.formatar(q('#nt-m-'+k+'-t').value,v)+' — '+A.formatar(q('#nt-m-'+k+'-x').value,v)}
  function erroAuto(msg){var e=q('#nt-auto-erro');e.hidden=!msg;e.innerHTML=msg?ico(I.x)+'<span>'+esc(msg)+'</span>':''}

  q('#nt-form').addEventListener('submit',function(e){e.preventDefault();salvar()});
  q('#nt-form').addEventListener('input',previa);q('#nt-form').addEventListener('change',previa);
  q('#nt-agendar').addEventListener('click',function(){salvar('agendar')});
  q('#nt-lancar').addEventListener('click',function(){salvar('lancar')});
  q('#nt-limpar').addEventListener('click',function(){preencher(null);focar(q('#nt-titulo'))});
  q('#nt-lista').addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-nt]');if(!b)return;
    var a=b.getAttribute('data-nt'),id=b.getAttribute('data-id'),c=null,r;
    AD.campanhas().forEach(function(x){if(x.id===id)c=x});
    if(!c)return;
    if(a==='editar'){preencher(c);focar(q('#nt-titulo'));q('#nt-form').scrollIntoView({block:'start'});return}
    if(a==='excluir'){
      pop('Excluir esta campanha?','<p>«'+esc(c.titulo)+'» sai da lista e do painel de quem já recebeu. Os contadores dela se perdem.</p>',
        [{led:true,txt:'Manter campanha',cb:fecharDlg},{txt:'Excluir campanha',ic:ico(I.lixo),cb:function(){AD.excluir(id);fecharDlg();if(editando===id)preencher(null);toast('Campanha excluída');lista();focar(q('#nt-titulo'))}}]);
      return
    }
    r=AD[a](id);
    if(!r.ok){toast(a==='lancar'&&r.erro==='fim'?'O fim já passou: edite a data para lançar.':'Não foi possível concluir.');return}
    toast({lancar:'Campanha lançada neste navegador',pausar:'Campanha pausada',retomar:'Campanha retomada',encerrar:'Campanha encerrada',duplicar:'Cópia criada como rascunho'}[a]);
    lista();
    var n=q('.adm-nt__c[data-id="'+(a==='duplicar'?r.campanha.id:id)+'"] .adm-nt__b');if(n)focar(n)
  });
  q('#nt-exportar').addEventListener('click',function(){
    var d=new Date(),n='polarlife-avisos-'+d.getFullYear()+d2(d.getMonth()+1)+d2(d.getDate())+'.json';
    var u=URL.createObjectURL(new Blob([JSON.stringify(AD.feed(),null,2)],{type:'application/json'})),a=document.createElement('a');
    a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},2000);
    toast('Feed exportado ('+n+')')
  });
  q('#nt-autos').addEventListener('input',function(e){var d=e.target.closest('[data-auto]');if(d)exemploDe(d.getAttribute('data-auto'))});
  q('#nt-autos').addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-pausa]');if(!b)return;
    var on=b.getAttribute('aria-checked')!=='true',k=b.getAttribute('data-pausa');
    if(AD.pausarTipo(k,on).ok){b.setAttribute('aria-checked',on?'true':'false');toast(on?'Aviso automático pausado':'Aviso automático retomado')}
  });
  q('#nt-auto-salvar').addEventListener('click',function(){
    var m={},k,r;
    for(k in AD.modelos())m[k]={titulo:q('#nt-m-'+k+'-t').value,texto:q('#nt-m-'+k+'-x').value};
    r=AD.salvarModelos(m);
    if(r.erros){for(k in r.erros){erroAuto(r.erros[k]);focar(q('#nt-m-'+k+'-t'));return}}
    erroAuto('');toast(r.ok?'Textos salvos neste navegador':'Só a conta Admin grava os textos.')
  });
  q('#nt-auto-padrao').addEventListener('click',function(){AD.restaurarModelos();erroAuto('');autos();toast('Textos padrão restaurados')});
  preencher(null);lista();autos();
  return sec
}

/* ---------- sem permissão (§4.2) ---------- */
function renderSemPermissao(){
  $('pe').hidden=true;
  var verT=false;try{verT=localStorage.getItem('pl-ver-contas-teste')==='1'}catch(e){}   /* D-194: o atalho para a conta Admin só no aparelho do dono */
  $('corpo').innerHTML='<div class="adm-vazio"><h2>Só a conta Admin abre este painel.</h2>'+
    '<p>Sua conta continua com o editor, a Conta e a exportação.</p>'+
    (verT?'<button type="button" class="btn2" id="b-como-admin">Entrar como Admin</button>':'<a class="btn2" href="../inicio/">Voltar ao Início</a>')+'</div>';
  if($('b-como-admin'))$('b-como-admin').addEventListener('click',function(){
    C.entrarComo('admin');
    toast('Você entrou como Admin');
    setTimeout(render,400)
  })
}

/* ---------- salvar / restaurar (LED único na base, T8) ---------- */
$('b-salvar').addEventListener('click',function(){
  if(document.querySelector('.adm-f--err')){toast('Corrija os campos marcados antes de salvar.');return}
  if(!EDIT)return;
  antes=JSON.parse(JSON.stringify({v:1,planos:EDIT}));
  C.admin.salvarLimites({v:1,planos:EDIT});
  pendencias(false);
  toast('Limites salvos neste navegador',true)
});
$('toast-desfazer').addEventListener('click',function(){
  if(antes){C.admin.salvarLimites(antes);antes=null}
  $('toast').hidden=true;
  toast('Alterações desfeitas');
  render()
});
$('b-restaurar').addEventListener('click',function(){
  pop('Restaurar os valores padrão?',
    '<p>Os números do DOC-03 voltam para os três planos e as contas de teste voltam ao estado inicial. Nada muda nos seus projetos.</p>',
    [{led:true,txt:'Manter como está',cb:fecharDlg},
     {txt:'Restaurar padrões',ic:ico(I.lixo),cb:function(){
       C.admin.restaurarPadroes();
       fecharDlg();
       toast('Valores padrão restaurados');
       render()
     }}])
});

/* sair da página com edições pendentes (§4.4) */
window.addEventListener('beforeunload',function(e){
  if(sujo){e.preventDefault();e.returnValue=''}
});
document.addEventListener('click',function(e){
  if(!sujo)return;
  var a=e.target.closest&&e.target.closest('a[href]');
  if(a&&!a.closest('.adm-pe')&&a.getAttribute('href')&&a.getAttribute('href').charAt(0)!=='#'){
    e.preventDefault();
    pop('Sair sem salvar?',
      '<p>As alterações dos planos ainda não foram salvas neste navegador.</p>',
      [{led:true,txt:'Continuar editando',cb:fecharDlg},
       {txt:'Sair sem salvar',cb:function(){pendencias(false);fecharDlg();location.href=a.href}}])
  }
});

/* ---------- pop-up ---------- */
function pop(titulo,html,acoes){
  abridor=document.activeElement;
  $('dlg-t').textContent=titulo;
  $('dlg-corpo').innerHTML=html;
  var act=$('dlg-act');act.innerHTML='';
  acoes.forEach(function(x){
    var b=document.createElement('button');
    b.type='button';
    b.className=x.led?'led-btn':'btn2 btn2--lg';
    if(x.led)b.innerHTML='<span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">'+(x.ic||'')+esc(x.txt)+'</span>';
    else b.innerHTML=(x.ic||'')+esc(x.txt);
    b.addEventListener('click',x.cb);
    act.appendChild(b)
  });
  $('scrim').hidden=false;$('dialog').hidden=false;
  var f=act.querySelector('.led-btn')||act.querySelector('button');
  if(f)focar(f)
}
function fecharDlg(){
  $('dialog').hidden=true;$('scrim').hidden=true;
  if(abridor&&abridor.focus)focar(abridor)
}
$('scrim').addEventListener('click',fecharDlg);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('dialog').hidden)fecharDlg()});

if(C)render();
})();
