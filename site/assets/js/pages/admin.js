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

/* ---------- sem permissão (§4.2) ---------- */
function renderSemPermissao(){
  $('pe').hidden=true;
  var verT=false;try{verT=localStorage.getItem('pl-ver-contas-teste')==='1'}catch(e){}   /* D-194: o atalho para a conta Admin só no aparelho do dono */
  $('corpo').innerHTML='<div class="adm-vazio"><h2>Este painel é só da conta Admin.</h2>'+
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
