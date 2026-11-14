/* T-27 · Conta como página de configurações: Perfil, Plano e uso, Códigos, Pagamentos, Segurança, Preferências, Notificações, Privacidade.
   Navegação lateral no desktop (≥ 900 px) e lista que abre e fecha no celular. Tudo vem de PLCONTA, com a forma dos dados do
   DOC-15 §8. Um LED só por tela (T8): «Ver folhas e planos». Pop-ups nível 3 com LED na opção segura (D-082).
   Sessão por código de impressão (D-124) tem menos seções: não há conta, pagamento nem senha. */
(function(){
var $=function(i){return document.getElementById(i)};
var C=window.PLCONTA,G=window.PLGUARDA,AV=window.PLAVISOS;
var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
var MQ=window.matchMedia?window.matchMedia('(min-width:900px)'):null;
var tmToast=null,abridor=null;
var ativa=(location.hash||'').replace('#','');   /* seção aberta; no desktop, sem nenhuma, vale a primeira */
var aberto={nome:false,senha:false};             /* formulários abertos dentro das seções */
var aviso={};                                    /* recado do último envio de cada formulário: {erro:bool, txt} */
var IDS=[];

function toast(msg){clearTimeout(tmToast);$('toast-t').textContent=msg;$('toast').hidden=false;tmToast=setTimeout(function(){$('toast').hidden=true},4000)}
function focar(el){try{el.focus({preventScroll:true})}catch(e){el.focus()}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ico(n,g){return '<svg class="ico'+(g?'':' sm')+'" viewBox="0 0 24 24" aria-hidden="true">'+n+'</svg>'}
var I={pessoa:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  lixeira:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  sair:'<path d="M9 4h9v16H9M5 12h9M11 9l3 3-3 3"/>',
  painel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
  baixar:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  aten:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  lapis:'<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  folha:'<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7"/>',
  codigo:'<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12"/>',
  cartao:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  cadeado:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  ajustes:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  escudo:'<path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6z"/>',
  aparelho:'<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  seta:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  abre:'<path d="M6 9l6 6 6-6"/>',
  sino:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  mais:'<path d="M12 5v14M5 12h14"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>'};

function dataLonga(t){var d=new Date(t);return d.getDate()+' de '+MESES[d.getMonth()]+' de '+d.getFullYear()}
function dataCurta(t){var d=new Date(t);return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear()}
function n1(n,um,varios){return n+' '+(n===1?um:varios)}
function segundos(ms){return n1(Math.max(1,Math.ceil((ms||30000)/1000)),'segundo','segundos')}
function desk(){return !!(MQ&&MQ.matches)}

/* ---------- pop-up genérico (D-082) ---------- */
function pop(titulo,html,acoes,rec){ /* acoes: [{led:bool, txt, ic, cb}]; rec usa o «Fechar» fixo */
  var dlg=rec?$('rec-dialog'):$('dialog');
  abridor=document.activeElement;
  $(rec?'rec-t':'dlg-t').textContent=titulo;
  $(rec?'rec-corpo':'dlg-corpo').innerHTML=html;
  if(!rec){
    var act=$('dlg-act');
    act.innerHTML='';
    for(var i=0;i<acoes.length;i++){
      var a=acoes[i],b=document.createElement('button');
      b.type='button';
      b.className=a.led?'led-btn':'btn2 btn2--lg';
      if(a.led)b.innerHTML='<span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">'+(a.ic||'')+esc(a.txt)+'</span>';
      else b.innerHTML=(a.ic||'')+esc(a.txt);
      b.addEventListener('click',a.cb);
      act.appendChild(b)
    }
    var alvo=act.querySelector('.led-btn')||act.querySelector('button');
    if(alvo)focar(alvo)
  }
  $('scrim').hidden=false;dlg.hidden=false;
  if(rec)focar($('rec-fechar'))
}
function fecharPop(rec){
  var dlg=rec?$('rec-dialog'):$('dialog');
  dlg.hidden=true;
  $('scrim').hidden=$('dialog').hidden&&$('rec-dialog').hidden;
  if(abridor&&abridor.focus)try{focar(abridor)}catch(e){}
}
$('scrim').addEventListener('click',function(){fecharPop(false);fecharPop(true)});
$('rec-fechar').addEventListener('click',function(){fecharPop(true)});
document.addEventListener('keydown',function(e){
  if($('dialog').hidden&&$('rec-dialog').hidden)return;
  if(e.key==='Escape'){fecharPop(false);fecharPop(true)}
});

/* ---------- peças ---------- */
function cartao(id,titulo,corpo){return '<div class="cc" role="group" aria-labelledby="'+id+'"><h3 class="cc__t" id="'+id+'">'+titulo+'</h3>'+corpo+'</div>'}
function linha(rot,val){return '<div class="dl__l"><dt>'+rot+'</dt><dd>'+val+'</dd></div>'}
function estado(ic,txt){return '<span class="est">'+ico(ic)+esc(txt)+'</span>'}
function atn(txt){return '<div class="atn" role="status">'+ico(I.aten)+'<p>'+txt+'</p></div>'}
function info(txt){return '<div class="info">'+ico(I.info)+'<p>'+txt+'</p></div>'}
function recado(k){var a=aviso[k];return a?'<p class="'+(a.erro?'erro':'certo')+'" id="m-'+k+'" role="'+(a.erro?'alert':'status')+'">'+ico(a.erro?I.aten:I.check)+'<span>'+esc(a.txt)+'</span></p>':''}
function inclui(itens){var h='<ul class="inc">',i;for(i=0;i<itens.length;i++)h+='<li>'+ico(I.check)+'<span>'+itens[i]+'</span></li>';return h+'</ul>'}
function bloco(n,rot,sub){return '<div class="tile"><p class="tile__n">'+n+'</p><p class="tile__r">'+rot+'</p>'+(sub?'<p class="tile__s">'+sub+'</p>':'')+'</div>'}
function led(id,txt,href){return '<a class="led-btn" id="'+id+'" href="'+href+'"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">'+txt+ico(I.seta,true)+'</span></a>'}
var MES=function(){return MESES[new Date().getMonth()]};

/* ---------- 1 · Perfil e cadastro ---------- */
function secPerfil(pf,cod){
  var ENTRADA={senha:'E-mail e senha',google:'Google',email:'Código por e-mail',codigo:'Código de impressão'};
  var h='<dl class="dl">';
  if(cod&&!pf.email){
    h+=linha('Cadastro','Você entrou com um código de impressão, sem nome nem e-mail.')
  }else{
    h+=linha('Nome','<span id="v-nome">'+esc(pf.nome||'Sem nome')+'</span>');
    h+=linha('E-mail','<span id="v-email" class="quebra">'+esc(pf.email)+'</span>'+
      (cod?'':pf.emailVerificadoEm?estado(I.check,'Confirmado pelo Google'):estado(I.info,'Ainda não confirmado')))
  }
  h+=linha('Forma de entrada',ENTRADA[pf.provedor]||(C.temSenha()?ENTRADA.senha:ENTRADA.email));
  if(pf.criadoEm)h+=linha('Conta criada em',dataLonga(pf.criadoEm));
  h+=linha('Entrou neste navegador em',dataLonga(pf.entrouEm));
  h+='</dl>';
  if(!cod||pf.email){
    if(aberto.nome){
      h+='<form class="frm" id="f-nome" novalidate><label class="cmp" for="in-nome"><span class="cmp__r">Nome</span>'+
        '<input class="cmp__i" id="in-nome" type="text" maxlength="60" autocomplete="name" value="'+esc(pf.nome||'')+'"></label>'+recado('nome')+
        '<div class="cc__act"><button type="submit" class="btn2" id="b-nome-salvar">'+ico(I.check)+'Salvar nome</button>'+
        '<button type="button" class="btn2" id="b-nome-cancelar">'+ico(I.x)+'Cancelar</button></div></form>'
    }else h+=recado('nome')+'<div class="cc__act"><button type="button" class="btn2" id="b-nome">'+ico(I.lapis)+'Editar nome</button></div>'
  }
  if(!cod)h+=info('Demonstração: esta conta fica guardada só neste navegador, e o PolarLife ainda não envia e-mail de confirmação. O e-mail identifica a conta e não pode ser trocado nesta versão.');
  return {id:'perfil',nome:'Perfil e cadastro',ic:I.pessoa,resumo:pf.email||'Código de impressão',html:cartao('cc-cadastro','Cadastro',h)}
}

/* ---------- 2 · Plano e uso ---------- */
function secPlano(pl,du,as,sc){
  var id=pl.id,h='',u='',res='';
  if(sc){ /* sessão por código (D-124): um pacote, uma impressão */
    var pc=C.pacotes()[sc.pacote]||{nome:'Avulso básico'};
    h='<p class="cc__plano">'+esc(pc.nome)+'</p>'+
      inclui(['Uma impressão de até '+n1(sc.folhas,'folha','folhas'),'Até '+sc.fotos+' fotos por projeto','Assinatura PolarLife nas polaroids: sempre ligada']);
    u='<div class="tiles">'+bloco(du.creditosPadrao+' de '+sc.folhas,'folhas do pacote',sc.usadoEm?'Usado em '+dataCurta(sc.usadoEm):'Uso único')+'</div>';
    if(sc.usadoEm)u+=atn('Seu código já foi usado.')+info('Para imprimir de novo, compre outro código de impressão ou entre com e-mail.');
    res=pc.nome+' · '+(sc.usadoEm?'código usado':n1(sc.folhas,'folha','folhas'));
    return {id:'plano',nome:'Plano e uso',ic:I.folha,resumo:res,html:cartao('cc-plano','Seu plano',h)+cartao('cc-uso','Disponível para imprimir',u)}
  }
  var pad=du.creditosPadrao,gra=du.creditosGrande;
  if(id==='pro'||id==='admin'){
    var fim=as&&as.periodoFim?dataLonga(as.periodoFim):'';
    h='<div class="cc__row"><p class="cc__plano">Pro · '+(id==='admin'?'conta de administração':C.moeda(pl.preco)+' por mês')+'</p>'+
      (id==='admin'?'':as&&as.canceladaEm?estado(I.info,'Cancelado'):estado(I.check,'Ativo'))+'</div>'+
      inclui(['Folhas sem limite fixo, com uso razoável de '+esc(pl.usoRazoavel)+' por mês','Até '+esc(pl.fotosPorProjeto)+' fotos por projeto','Pode desligar a assinatura PolarLife nas polaroids']);
    if(id==='admin')h+='<p class="cc__meta">Esta conta usa os limites do Pro, sem assinatura nem cobrança.</p>';
    else if(as&&as.canceladaEm)h+='<p class="cc__meta" id="v-renova">'+(fim?'Pro até '+fim+' · depois, Grátis':'Pro até o fim do período já contratado · depois, Grátis')+'</p>';
    else h+='<p class="cc__meta" id="v-renova">'+(fim?'Renova em '+fim+'.':'Renovação mensal.')+' Demonstração: nenhuma cobrança é feita.</p>';
    if(id==='pro'){ /* assinatura: Pro pode desligar (D-119 / DOC-03 §2) */
      if(as&&as.canceladaEm){
        h+='<p class="cc__meta">A assinatura PolarLife volta a aparecer quando o plano virar Grátis.</p>'+
          '<div class="cc__act"><button type="button" class="btn2" id="b-reativar">'+ico(I.check)+'Reativar o Pro</button></div>'
      }else{
        var ligada=!pl.assinaturaDesligada;
        h+='<div class="sw-row"><div><p class="cc__meta" id="assin-l">'+(ligada?'Desligar':'Ligar')+' a assinatura PolarLife</p><p class="help">Muda o padrão de novos projetos. Os projetos atuais não mudam.</p></div>'+
          '<button type="button" class="sw" id="assin" role="switch" aria-checked="'+(ligada?'true':'false')+'" aria-labelledby="assin-l"><span></span></button></div>'+
          '<div class="cc__act"><a class="btn2" id="b-planos" href="planos/">'+ico(I.folha)+'Ver folhas e planos</a>'+
          '<button type="button" class="btn2 btn2--danger" id="b-cancelar">'+ico(I.lixeira)+'Cancelar assinatura</button></div>'
      }
    }
    var pct=Math.max(0,Math.min(100,Math.round(pl.usadasMes/pl.usoRazoavel*100)));
    u='<div class="tiles">'+bloco(esc(pl.usadasMes)+' de '+esc(pl.usoRazoavel),'folhas usadas em '+MES(),'uso razoável do Pro')+
      (pad?bloco(pad,pad===1?'folha padrão guardada':'folhas padrão guardadas'):'')+(gra?bloco(gra,gra===1?'folha grande guardada':'folhas grandes guardadas'):'')+'</div>'+
      '<div class="barra" role="img" aria-label="'+pct+'% do uso razoável do mês"><span style="width:'+pct+'%"></span></div>'+
      '<p class="cc__meta">Sem limite fixo: você pode continuar gerando folhas. O uso razoável existe só para acompanhar o mês e volta a zero no dia 1º.</p>';
    /* atenções (DOC-03 §4: nunca bloqueia) */
    var av=pl.avisoPct/100*pl.usoRazoavel;
    if(pl.usadasMes>=pl.usoRazoavel)u+=atn('Você chegou às '+pl.usoRazoavel+' folhas deste mês. Pode continuar exportando; vamos olhar o uso com calma.');
    else if(pl.usadasMes>=av)u+=atn('Você usou '+pl.usadasMes+' das '+pl.usoRazoavel+' folhas do uso razoável deste mês.');
    res='Pro · '+pl.usadasMes+' de '+pl.usoRazoavel+' folhas em '+MES()
  }else{
    var gratis=id==='gratis',fm=gratis?du.folhasGratisNoMes:0,fr=gratis?Math.max(0,fm-du.folhasGratisUsadasNoMes):0;
    if(gratis){
      h='<p class="cc__plano">Grátis · '+C.moeda(0)+'</p>'+
        inclui([n1(fm,'folha grátis','folhas grátis')+' por mês','Até '+esc(pl.fotosPorProjeto)+' fotos por projeto','Assinatura PolarLife nas polaroids: sempre ligada'])+
        '<p class="cc__meta" id="v-renova">A folha grátis renova em '+esc(pl.renovaEm||'')+'.</p>'
    }else{
      h='<p class="cc__plano">Folha avulsa</p>'+
        inclui(['Folhas compradas avulsas, sem mensalidade','Até '+esc(pl.fotosPorProjeto)+' fotos por projeto','Assinatura PolarLife nas polaroids: sempre ligada'])+
        '<p class="cc__meta" id="v-renova">Sem mensalidade nem renovação.</p>'
    }
    h+='<div class="cc__act"><a class="btn2" href="planos/">'+ico(I.folha)+'Ver folhas e planos</a></div>';   /* o LED da tela fica no cartão da conta, sempre à vista (T8) */
    u='<div class="tiles">'+(gratis?bloco(fr+' de '+fm,(fm===1?'folha grátis':'folhas grátis')+' de '+MES(),'Renova em '+esc(pl.renovaEm||'')):'')+
      bloco(pad,pad===1?'folha padrão':'folhas padrão','Comprada ou de código')+bloco(gra,gra===1?'folha grande':'folhas grandes','Comprada')+'</div>';
    var tp=fr+pad,tg=fr+gra;
    if(tp+tg===0)u+='<p class="cc__meta" id="v-limite">Você não tem folhas para gerar agora.</p>';
    else u+='<p class="cc__meta" id="v-limite">Agora dá para gerar até '+(tp?n1(tp,'folha padrão','folhas padrão'):'')+(tp&&tg?' ou ':'')+(tg?n1(tg,'folha grande','folhas grandes'):'')+'.</p>';
    if(gratis&&fr===0)u+=atn('Sua folha grátis deste mês já foi usada.');
    res=(gratis?'Grátis':'Folha avulsa')+' · '+(tp+tg===0?'sem folhas agora':n1(Math.max(tp,tg),'folha disponível','folhas disponíveis'))
  }
  return {id:'plano',nome:'Plano e uso',ic:I.folha,resumo:res,html:cartao('cc-plano','Seu plano',h)+cartao('cc-uso','Disponível para imprimir',u)}
}

/* ---------- 3 · Códigos de impressão ---------- */
function itemCodigo(k){
  var cl=k.classe==='grande'?['folha grande','folhas grandes']:['folha padrão','folhas padrão'];
  return '<li class="cod"><div class="cod__q"><p class="cod__n">'+esc(k.pacote)+(k.final?' <span class="mono">final '+esc(k.final)+'</span>':'')+'</p>'+
    '<p class="cod__d">'+(k.emUso?(k.restam?'Vale para uma impressão de até '+n1(k.folhas,cl[0],cl[1]):'As '+k.folhas+' folhas do pacote já foram usadas'):'Restam '+k.restam+' de '+n1(k.folhas,cl[0],cl[1]))+'</p>'+
    '<p class="cod__d">'+(k.emUso?'Em uso desde ':'Resgatado em ')+dataCurta(k.resgatadoEm)+(k.emUso&&k.restam&&k.validoAte?' · válido até '+dataCurta(k.validoAte):'')+'</p></div>'+
    (k.situacao==='disponivel'?estado(I.check,'Disponível'):estado(I.info,'Usado'))+'</li>'
}
function secCodigos(cs,cod){
  var liv=[],usa=[],i,h='',f='',tot=0;
  for(i=0;i<cs.length;i++){if(cs[i].situacao==='disponivel'){liv.push(cs[i]);tot+=cs[i].restam}else usa.push(cs[i])}
  if(!cod){
    f='<form class="frm" id="f-codigo" novalidate><label class="cmp" for="in-codigo"><span class="cmp__r">Código de impressão</span>'+
      '<input class="cmp__i cmp__i--cod" id="in-codigo" type="text" maxlength="14" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="PL-XXXX-XXXX"></label>'+recado('codigo')+
      '<div class="cc__act"><button type="submit" class="btn2" id="b-resgatar">'+ico(I.mais)+'Resgatar código</button></div></form>'+
      '<p class="help">As folhas do código entram no saldo desta conta e cada código vale uma vez. Nesta versão de demonstração, o código é conferido neste navegador.</p>'
  }
  if(!cs.length)h='<p class="vazio" id="cod-vazio">Nenhum código resgatado nesta conta.</p>';
  else{
    if(!cod)h+='<p class="cc__meta" id="cod-total">'+(tot?n1(tot,'folha de código disponível','folhas de código disponíveis')+'.':'Nenhuma folha de código disponível.')+'</p>';
    if(liv.length){h+='<h4 class="grupo">Ainda podem ser usados ('+liv.length+')</h4><ul class="cod-lista" id="cod-livres">';for(i=0;i<liv.length;i++)h+=itemCodigo(liv[i]);h+='</ul>'}
    if(usa.length){h+='<h4 class="grupo">Já usados ('+usa.length+')</h4><ul class="cod-lista" id="cod-usados">';for(i=0;i<usa.length;i++)h+=itemCodigo(usa[i]);h+='</ul>'}
    if(!cod)h+='<p class="help">As folhas compradas avulsas saem primeiro; as de código, depois, começando pelo código mais antigo.</p>'
  }
  if(cod)h+=info('Com um código você entra sem conta. Para juntar vários códigos e guardar as folhas, entre com e-mail e resgate os códigos na Conta.');
  return {id:'codigos',nome:'Códigos de impressão',ic:I.codigo,
    resumo:cs.length?(liv.length?n1(liv.length,'código disponível','códigos disponíveis'):'Nenhum código disponível'):'Nenhum código resgatado',
    html:(cod?'':cartao('cc-resgatar','Resgatar um código',f))+cartao('cc-codigos',cod?'Código em uso':'Seus códigos',h)}
}

/* ---------- 4 · Pagamentos ---------- */
function secPagamentos(pl,as,rs,fp){
  var h='',r='',a='',i;
  if(!fp.length)h='<div class="vazio vazio--caixa" id="pg-vazio">'+ico(I.cartao,true)+'<p>Nenhuma forma de pagamento cadastrada. As compras desta versão são de demonstração e não cobram nada.</p></div>'+
    '<p class="help">O PolarLife não pede nem guarda número de cartão.</p>';
  if(pl.id==='pro'&&as){
    a='<dl class="dl">'+linha('Plano','Pro · '+C.moeda(as.valorCentavos/100)+' por mês')+
      linha(as.canceladaEm?'Vale até':'Próxima renovação',as.periodoFim?dataLonga(as.periodoFim):(as.canceladaEm?'Fim do período já contratado':'Mensal'))+
      linha('Situação',as.canceladaEm?estado(I.info,'Cancelada'):estado(I.check,'Ativa'))+'</dl>'+
      '<p class="help">Assinatura de demonstração: nenhuma cobrança é feita. Para cancelar ou reativar, use «Plano e uso».</p>'
  }
  if(rs.length){
    r='<ul class="rec-lista">';
    for(i=0;i<rs.length;i++){
      r+='<li class="rec"><div class="rec__q"><p class="rec__d mono">'+(rs[i].emitidoEm?dataCurta(rs[i].emitidoEm):'')+' · '+esc(rs[i].numero)+'</p>'+
        '<p class="rec__v">'+esc(rs[i].descricao)+' · <span class="mono">'+C.moeda(rs[i].valorCentavos/100)+'</span></p>'+
        '<p class="rec__s">Demonstração: nada foi cobrado</p></div>'+
        '<button type="button" class="btn3" data-rec="'+i+'">Ver recibo</button></li>'
    }
    r+='</ul>'
  }else r='<p class="rec-vazio" id="rec-vazio">Nenhuma compra ainda.</p>';
  return {id:'pagamentos',nome:'Pagamentos',ic:I.cartao,resumo:rs.length?n1(rs.length,'recibo','recibos')+' de demonstração':'Nenhuma compra ainda',
    html:cartao('cc-formas','Formas de pagamento',h)+(a?cartao('cc-assin','Assinatura',a):'')+cartao('cc-rec','Histórico de compras e recibos',r)}
}

/* ---------- 5 · Segurança ---------- */
function secSeguranca(ss){
  var tem=C.temSenha(),h,a='',i;
  h='<div class="cc__row"><p class="cc__meta" id="v-senha">'+(tem?'Você entra com e-mail e senha.':'Esta conta ainda não tem senha.')+'</p>'+
    (tem?estado(I.check,'Senha definida'):estado(I.info,'Sem senha'))+'</div>';
  if(aberto.senha){
    h+='<form class="frm" id="f-senha" novalidate>'+
      '<input class="so-leitor" type="text" autocomplete="username" value="'+esc((C.sessao()||{}).email||'')+'" tabindex="-1" aria-hidden="true" readonly>'+
      (tem?'<label class="cmp" for="in-senha-atual"><span class="cmp__r">Senha atual</span><input class="cmp__i" id="in-senha-atual" type="password" autocomplete="current-password" maxlength="128"></label>':'')+
      '<label class="cmp" for="in-senha-nova"><span class="cmp__r">Senha nova</span><input class="cmp__i" id="in-senha-nova" type="password" autocomplete="new-password" maxlength="128"></label>'+
      '<label class="cmp" for="in-senha-rep"><span class="cmp__r">Repita a senha nova</span><input class="cmp__i" id="in-senha-rep" type="password" autocomplete="new-password" maxlength="128"></label>'+
      recado('senha')+
      '<div class="cc__act"><button type="submit" class="btn2" id="b-senha-salvar">'+ico(I.check)+'Salvar senha</button>'+
      '<button type="button" class="btn2" id="b-senha-cancelar">'+ico(I.x)+'Cancelar</button></div></form>'
  }else h+=recado('senha')+'<div class="cc__act"><button type="button" class="btn2" id="b-senha">'+ico(I.cadeado)+(tem?'Trocar senha':'Definir senha')+'</button></div>';
  h+='<p class="help">De 8 a 128 caracteres. A senha não é guardada: fica só um resumo embaralhado dela, neste navegador.</p>';
  a='<ul class="apr-lista" id="aparelhos">';
  for(i=0;i<ss.length;i++)a+='<li class="apr">'+ico(I.aparelho,true)+'<div class="apr__q"><p class="apr__n">'+esc(ss[i].aparelho)+'</p><p class="apr__d">Entrou em '+dataLonga(ss[i].criadaEm)+'</p></div>'+(ss[i].atual?estado(I.check,'Este aparelho'):'')+'</li>';
  a+='</ul>'+info('Demonstração: a conta fica só neste navegador, por isso só este aparelho aparece aqui.')+
    '<div class="cc__act"><button type="button" class="btn2 btn2--danger" id="b-sair-todos">'+ico(I.sair)+'Sair de todos os aparelhos</button></div>';
  return {id:'seguranca',nome:'Segurança',ic:I.cadeado,resumo:(tem?'Senha definida':'Sem senha')+' · '+n1(ss.length,'aparelho','aparelhos'),
    html:cartao('cc-senha','Senha',h)+cartao('cc-aparelhos','Aparelhos conectados',a)}
}

/* ---------- 6 · Preferências ---------- */
var UN=[['mm','Milímetros (mm)'],['cm','Centímetros (cm)'],['pol','Polegadas (pol)']];
function secPreferencias(pr,cod){
  var u='<fieldset class="opc" id="pref-un"><legend class="so-leitor">Unidade de medida</legend>',i,e='';
  for(i=0;i<UN.length;i++)u+='<label class="opc__o"><input type="radio" name="pref-un" value="'+UN[i][0]+'"'+(pr.unidade===UN[i][0]?' checked':'')+'><span>'+ico(I.check)+UN[i][1]+'</span></label>';
  u+='</fieldset><p class="help">Vale para as medidas da moldura personalizada, no editor.</p>';
  if(!cod){
    var on=pr.emails.novidades;
    e='<div class="sw-row"><div><p class="cc__meta" id="nov-l">Novidades e dicas do PolarLife</p><p class="help" id="nov-e">'+(on?'Ligado':'Desligado')+'</p></div>'+
      '<button type="button" class="sw" id="pref-novidades" role="switch" aria-checked="'+(on?'true':'false')+'" aria-labelledby="nov-l"><span></span></button></div>'+
      '<p class="help">Nesta versão o PolarLife não envia e-mails. A sua escolha fica guardada neste navegador.</p>'
  }
  return {id:'preferencias',nome:'Preferências',ic:I.ajustes,resumo:'Medidas em '+pr.unidade+(cod?'':' · novidades por e-mail '+(pr.emails.novidades?'ligadas':'desligadas')),
    html:cartao('cc-unidade','Unidade de medida',u)+(e?cartao('cc-emails','E-mails',e):'')+cartao('cc-app','Aplicativo','<div id="app-bloco"></div>')}
}
function renderApp(){ /* instalar é opcional (DOC-08 §7): só oferece quando o navegador deixa */
  var cx=$('app-bloco'),P=window.PLPWA,h;
  if(!cx)return;
  if(P&&P.standalone())h='<div class="cc__row"><p class="cc__meta">Você está usando o PolarLife como aplicativo.</p>'+estado(I.check,'Instalado neste aparelho')+'</div>';
  else if(P&&P.podeInstalar())h='<p class="cc__meta">Dá para instalar o PolarLife neste aparelho: ele abre numa janela própria e ganha um ícone.</p>'+
    '<div class="cc__act"><button type="button" class="btn2" id="b-instalar">'+ico(I.baixar)+'Instalar o PolarLife</button></div>';
  else if(P&&P.dicaIos())h='<p class="cc__meta">No iPhone ou iPad, abra o PolarLife no Safari, toque em Compartilhar e depois em «Adicionar à Tela de Início».</p>';
  else h='<p class="cc__meta" id="app-sem">Este navegador não ofereceu a instalação agora. Se o menu dele tiver «Instalar» ou «Adicionar à tela inicial», também funciona.</p>';
  h+=info('Instalar é opcional: pelo navegador o PolarLife funciona do mesmo jeito. Para desfazer, remova o aplicativo como qualquer outro (no computador, pelo menu da janela do app; no celular, segurando o ícone). Em alguns aparelhos, remover o aplicativo apaga os projetos guardados nele: salve um backup antes.');
  h+=info('No Android, com o aplicativo instalado, os links do PolarLife podem abrir direto nele (sem a barra do navegador). Para continuar no navegador, remova o aplicativo ou desligue «Abrir links compatíveis» em Configurações › Apps › PolarLife.');   /* D-207: o modo app nunca é imposto pelo site */
  cx.innerHTML=h;
  var b=$('b-instalar');
  if(b)b.addEventListener('click',function(){
    P.instalar().then(function(ok){toast(ok?'PolarLife instalado neste aparelho.':'Instalação cancelada.');renderApp()})
  })
}

/* ---------- 7 · Notificações (D-208, DOC-16) ----------
   Preferências dos avisos (PLAVISOS): liga/desliga geral e por tipo, onde avisar, horário silencioso, permissão do aparelho
   (pedida só pelo botão daqui), aviso de teste e os avisos recentes. Com servidor: GET/PUT /conta/avisos/preferencias (DOC-15 §8). */
function horas(id,rot,val){
  var h='<label class="nt-sel" for="'+id+'"><span class="cmp__r">'+rot+'</span><select id="'+id+'">',i;
  for(i=0;i<24;i++)h+='<option value="'+i+'"'+(i===val?' selected':'')+'>'+i+'h</option>';
  return h+'</select></label>'
}
function secNotificacoes(){
  var p=AV.prefs(),s=AV.suporte(),T=AV.TIPOS,k,g,o,t,hs,h,i,perm;
  g='<div class="sw-row"><div><p class="cc__meta" id="nt-geral-l">Receber avisos do PolarLife</p><p class="help">Lembranças, sugestões, prazos e novidades ficam no sino do cabeçalho, sem interromper o que você está fazendo.</p></div>'+
    '<button type="button" class="sw" id="nt-geral" role="switch" aria-checked="'+(p.ligado?'true':'false')+'" aria-labelledby="nt-geral-l"><span></span></button></div>'+
    '<ul class="nt-tipos" id="nt-tipos">';
  for(k in T)g+='<li class="sw-row"><div><p class="cc__meta" id="nt-t-'+k+'-l">'+esc(T[k].nome)+'</p><p class="help">'+esc(T[k].desc)+'</p></div>'+
    '<button type="button" class="sw" id="nt-t-'+k+'" data-nt-tipo="'+k+'" role="switch" aria-checked="'+(p.tipos[k]?'true':'false')+'" aria-labelledby="nt-t-'+k+'-l"'+(p.ligado?'':' disabled')+'><span></span></button></li>';
  g+='</ul>';
  o='<fieldset class="opc" id="nt-canal"><legend class="so-leitor">Onde avisar</legend>'+
    '<label class="opc__o"><input type="radio" name="nt-canal" value="app"'+(p.canal==='app'?' checked':'')+'><span>'+ico(I.check)+'Só dentro do PolarLife</span></label>'+
    '<label class="opc__o"><input type="radio" name="nt-canal" value="sistema"'+(p.canal==='sistema'?' checked':'')+'><span>'+ico(I.check)+'Também nas notificações do aparelho</span></label></fieldset>';
  if(!s.suportado)perm='<div class="cc__row"><p class="cc__meta">Este navegador não mostra notificações do aparelho. Os avisos continuam no sino.</p>'+estado(I.info,'Não disponível')+'</div>';
  else if(s.permissao==='granted')perm='<div class="cc__row"><p class="cc__meta">O PolarLife pode mostrar notificações neste aparelho.</p>'+estado(I.check,'Permitido')+'</div>';
  else if(s.permissao==='denied')perm='<div class="cc__row"><p class="cc__meta">As notificações do PolarLife estão bloqueadas neste navegador.</p>'+estado(I.aten,'Bloqueado')+'</div>'+
    '<p class="help" id="nt-desbloquear">Para desbloquear: toque no cadeado (ou no ícone ao lado do endereço), abra «Notificações», escolha «Permitir» e recarregue esta página. No app instalado: Configurações do aparelho › Apps › PolarLife › Notificações.</p>';
  else perm='<div class="cc__row"><p class="cc__meta">O navegador ainda vai perguntar se você permite.</p>'+estado(I.info,'Ainda não permitido')+'</div>'+
    '<div class="cc__act"><button type="button" class="btn2" id="b-nt-permitir">'+ico(I.sino)+'Permitir notificações do aparelho</button></div>';
  o+='<div id="nt-perm" data-estado="'+esc(s.suportado?s.permissao:'unsupported')+'">'+perm+'</div>'+
    '<p class="help">No aparelho, o PolarLife manda no máximo 1 notificação por dia, sempre sem som. A colagem que aparece nela é montada aqui, com as suas fotos.</p>';
  hs='<div class="nt-hora">'+horas('nt-sil-ini','Começa às',p.silencio.ini)+horas('nt-sil-fim','Termina às',p.silencio.fim)+'</div>'+
    '<p class="help" id="nt-sil-res">'+(p.silencio.ini===p.silencio.fim?'Sem horário silencioso.':'Das '+p.silencio.ini+'h às '+p.silencio.fim+'h o aparelho não recebe notificação do PolarLife.')+'</p>';
  t='<p class="cc__meta">Veja como um aviso aparece no sino'+(p.canal==='sistema'&&s.permissao==='granted'?' e nas notificações do aparelho.':'.')+'</p>'+recado('nt')+
    '<div class="cc__act"><button type="button" class="btn2" id="b-nt-teste">'+ico(I.sino)+'Enviar um aviso de teste</button></div>';
  var hi=AV.historico(8),SIT={novo:['Novo',I.info],lido:['Visto',I.check],dispensado:['Dispensado',I.x],adiado:['Volta amanhã',I.info],encerrado:['Encerrado',I.x]};
  if(!hi.length)h='<p class="vazio" id="nt-vazio">Nenhum aviso ainda.</p>';
  else{h='<ul class="nt-hist" id="nt-hist">';for(i=0;i<hi.length;i++)h+='<li class="cod"><div class="cod__q"><p class="cod__n">'+esc(hi[i].titulo)+'</p><p class="cod__d">'+esc(hi[i].tipoNome)+' · '+dataCurta(hi[i].criadoEm)+'</p></div>'+estado(SIT[hi[i].situacao][1],SIT[hi[i].situacao][0])+'</li>';h+='</ul>'}
  h+=info('As lembranças e sugestões são montadas neste aparelho, com as fotos dos seus projetos: nenhuma foto é enviada. Nesta versão os avisos são conferidos quando você abre o PolarLife; ainda não há envio pelo servidor.');
  return {id:'notificacoes',nome:'Notificações',ic:I.sino,resumo:p.ligado?'Avisos ligados · '+(p.canal==='sistema'?'no app e no aparelho':'só dentro do app'):'Avisos desligados',
    html:cartao('cc-nt-geral','Avisos',g)+cartao('cc-nt-onde','Onde avisar',o)+cartao('cc-nt-silencio','Horário silencioso',hs)+cartao('cc-nt-teste','Testar',t)+cartao('cc-nt-hist','Avisos recentes',h)}
}

/* ---------- 8 · Privacidade e dados ---------- */
function secPrivacidade(ac,cod){
  var d,t,x='';
  if(cod)d='<p class="cc__meta">Você entrou com um código de impressão, sem conta. O que você informou fica só neste navegador e sai dele quando você sair. Suas fotos e projetos ficam no seu aparelho.</p>';
  else d='<p class="cc__meta">Suas fotos e projetos ficam no seu aparelho. Os dados da conta (cadastro, plano, folhas, códigos e recibos) ficam, nesta versão de demonstração, só neste navegador.</p>'+
    '<div class="cc__act"><button type="button" class="btn2" id="b-exportar">'+ico(I.baixar)+'Exportar meus dados</button></div>'+
    '<p class="help">Suas fotos e projetos já estão no seu aparelho e não entram neste arquivo.</p>';
  t=(ac.length?'<p class="cc__meta" id="v-aceite">Você aceitou os Termos e a Política de Privacidade em '+dataLonga(ac[0].aceitoEm)+'.</p>':'')+
    '<ul class="docs"><li><a href="../../legal/#privacidade">'+ico(I.folha)+'Privacidade</a></li><li><a href="../../legal/#termos">'+ico(I.folha)+'Termos</a></li><li><a href="../../legal/#cookies">'+ico(I.folha)+'Cookies</a></li></ul>';
  if(!cod)x=cartao('cc-excluir','Excluir conta','<p class="cc__meta">Apaga desta conta o cadastro, as folhas, os códigos resgatados e os recibos guardados neste navegador. Seus projetos e fotos continuam no aparelho.</p>'+
    '<div class="cc__act"><button type="button" class="btn2 btn2--danger" id="b-excluir">'+ico(I.lixeira)+'Excluir conta</button></div>');
  return {id:'privacidade',nome:'Privacidade e dados',ic:I.escudo,resumo:cod?'Termos e políticas':'Exportar dados ou excluir a conta',
    html:cartao('cc-dados','Seus dados',d)+cartao('cc-docs','Termos e políticas',t)+x}
}

/* ---------- render ---------- */
function render(){
  var sc=C.sessaoCodigo(),s=C.sessao(),cx=$('corpo');
  if(!sc&&!s){location.replace(G?G.urlEntrar(location.pathname):'../entrar/');return}
  var cod=!!sc,pl=C.plano()||{},pf=C.perfil(),du=C.direitoDeUso(),as=C.assinatura(),secs=[],i,h,x;
  secs.push(secPerfil(pf,cod));
  secs.push(secPlano(pl,du,as,sc));
  secs.push(secCodigos(C.codigos(),cod));
  if(!cod){secs.push(secPagamentos(pl,as,C.recibos(),C.formasPagamento()));secs.push(secSeguranca(C.sessoes()))}
  secs.push(secPreferencias(C.preferencias(),cod));
  if(AV)secs.push(secNotificacoes());
  secs.push(secPrivacidade(C.aceites(),cod));
  IDS=[];for(i=0;i<secs.length;i++)IDS.push(secs[i].id);
  if(IDS.indexOf(ativa)<0)ativa='';

  h='<div class="cfg"><aside class="cfg__lado" aria-label="Sua conta">'+
    '<div class="quem"><p class="quem__n" id="quem-nome">'+esc(cod?(pf.nome||'Compra com código de impressão'):(pf.nome||pf.email))+'</p>'+
    (pf.email?'<p class="quem__e quebra">'+esc(pf.email)+'</p>':'')+
    '<span class="pill" id="quem-plano">'+esc(cod?'Pacote '+(pl.pacote||''):(pl.nome||'Grátis'))+'</span>'+
    (!cod&&(pl.id==='gratis'||pl.id==='avulsa')?'<div class="quem__led">'+led('b-planos','Ver folhas e planos','planos/')+'</div>':'')+'</div>'+   /* T8: o único LED da Conta, visível em qualquer seção */
    '<nav class="cfg__nav" aria-label="Seções da conta"><ul>';
  for(i=0;i<secs.length;i++)h+='<li><a class="cfg__l" href="#'+secs[i].id+'" data-ir="'+secs[i].id+'">'+ico(secs[i].ic,true)+'<span>'+secs[i].nome+'</span></a></li>';
  h+='</ul></nav><div class="cfg__fim">'+
    (pl.id==='admin'?'<a class="btn2" id="b-admin" href="../admin/">'+ico(I.painel)+'Painel do admin</a>':'')+
    '<button type="button" class="btn2 btn2--danger" id="b-sair">'+ico(I.sair)+'Sair</button></div></aside><div class="cfg__secs">';
  for(i=0;i<secs.length;i++){x=secs[i];
    h+='<section class="sec" id="sec-'+x.id+'" data-sec="'+x.id+'" aria-labelledby="t-'+x.id+'">'+
      '<h2 class="sec__h" id="t-'+x.id+'"><button type="button" class="sec__cab" data-abre="'+x.id+'" aria-expanded="false" aria-controls="c-'+x.id+'">'+
      ico(x.ic,true)+'<span class="sec__tt"><span class="sec__n">'+x.nome+'</span><span class="sec__res">'+esc(x.resumo)+'</span></span>'+
      '<svg class="ico sec__seta" viewBox="0 0 24 24" aria-hidden="true">'+I.abre+'</svg></button></h2>'+
      '<div class="sec__c" id="c-'+x.id+'">'+x.html+'</div></section>'
  }
  h+='</div></div>';
  cx.innerHTML=h;
  ligar();renderApp();aplicar()
}

/* mostra a seção ativa: painel único no desktop, lista que abre no celular */
function aplicar(){
  var d=desk(),atual=d?(ativa||IDS[0]):ativa,ss=document.querySelectorAll('.sec'),ls=document.querySelectorAll('.cfg__l'),i,on,b;
  for(i=0;i<ss.length;i++){
    on=ss[i].getAttribute('data-sec')===atual;
    ss[i].classList.toggle('is-on',on);
    b=ss[i].querySelector('.sec__cab');
    b.setAttribute('aria-expanded',on?'true':'false');
    b.tabIndex=d?-1:0                                  /* no desktop o título não é botão: quem troca é a navegação lateral */
  }
  for(i=0;i<ls.length;i++){
    if(ls[i].getAttribute('data-ir')===atual)ls[i].setAttribute('aria-current','true');else ls[i].removeAttribute('aria-current')
  }
}
function ir(id,rolar){
  ativa=id;
  try{history.replaceState(null,'',id?'#'+id:location.pathname+location.search)}catch(e){}
  aplicar();
  if(rolar&&id){var el=$('sec-'+id);if(el&&el.scrollIntoView)el.scrollIntoView({block:'start'})}
}
if(MQ){if(MQ.addEventListener)MQ.addEventListener('change',aplicar);else if(MQ.addListener)MQ.addListener(aplicar)}
window.addEventListener('hashchange',function(){var h=(location.hash||'').replace('#','');if(IDS.indexOf(h)>=0&&h!==ativa){ativa=h;aplicar()}});

/* ---------- ações ---------- */
function sairPara(msg){toast(msg);setTimeout(function(){location.href=G?G.raiz():'../'},700)}
function ligar(){
  var b,i,els;
  els=document.querySelectorAll('.cfg__l');
  for(i=0;i<els.length;i++)els[i].addEventListener('click',function(e){e.preventDefault();ir(this.getAttribute('data-ir'),false);var t=$('t-'+ativa);if(t){t.tabIndex=-1;focar(t)}});
  els=document.querySelectorAll('.sec__cab');
  for(i=0;i<els.length;i++)els[i].addEventListener('click',function(){if(desk())return;var id=this.getAttribute('data-abre');ir(ativa===id?'':id,ativa!==id)});

  if(b=$('b-sair'))b.addEventListener('click',function(){C.sair();sairPara('Você saiu. Seus projetos continuam neste aparelho.')});

  /* perfil */
  if(b=$('b-nome'))b.addEventListener('click',function(){aberto.nome=true;delete aviso.nome;render();focar($('in-nome'))});
  if(b=$('b-nome-cancelar'))b.addEventListener('click',function(){aberto.nome=false;delete aviso.nome;render();focar($('b-nome'))});
  if(b=$('f-nome'))b.addEventListener('submit',function(e){
    e.preventDefault();
    var r=C.atualizarPerfil({nome:$('in-nome').value});
    if(r.erro){aviso.nome={erro:true,txt:'Use um nome de 2 a 60 caracteres.'};render();focar($('in-nome'));return}
    aberto.nome=false;aviso.nome={txt:'Nome salvo.'};toast('Nome salvo');render();focar($('b-nome'))
  });

  /* plano */
  if(b=$('b-planos'))b.setAttribute('href','planos/'+(location.search||''));
  if(b=$('b-cancelar'))b.addEventListener('click',function(){
    var as=C.assinatura()||{},ate=as.periodoFim?dataLonga(as.periodoFim):'o fim do período já contratado';
    var dias=as.periodoFim?Math.max(0,Math.ceil((new Date(as.periodoFim).getTime()-Date.now())/86400000)):0;
    var extra=dias>23?'<p>Como você assinou há menos de 7 dias, o valor é devolvido por inteiro.</p>':''; /* [VALIDAR com advogado] */
    pop('Cancelar o Pro?',
      '<p>Você continua com o Pro até '+ate+'. Depois, a conta volta ao plano Grátis e a assinatura PolarLife volta a aparecer nas polaroids.</p>'+extra,
      [{led:true,txt:'Manter o Pro',cb:function(){fecharPop(false)}},
       {txt:'Cancelar assinatura',ic:ico(I.lixeira),cb:function(){C.cancelarPro();fecharPop(false);toast('Assinatura cancelada. O Pro vale até '+ate+'.');render()}}])
  });
  if(b=$('b-reativar'))b.addEventListener('click',function(){
    C.assinarPro('aprovado').then(function(){toast('Pro reativado');render()})
  });
  if(b=$('assin'))b.addEventListener('click',function(){
    var ligada=this.getAttribute('aria-checked')==='true'?false:true;
    this.setAttribute('aria-checked',ligada?'true':'false');
    var l=$('assin-l');if(l)l.textContent=(ligada?'Desligar':'Ligar')+' a assinatura PolarLife';
    C.trocarAssinatura(!ligada); /* preferência de novos projetos (brief §3.2) */
    toast(ligada?'Novos projetos nascem com a assinatura PolarLife.':'Novos projetos nascem sem assinatura.')
  });

  /* códigos de impressão */
  if(b=$('f-codigo'))b.addEventListener('submit',function(e){
    e.preventDefault();
    var bt=$('b-resgatar');bt.disabled=true;
    C.resgatarCodigo($('in-codigo').value).then(function(r){
      aviso.codigo={txt:'Código resgatado: '+n1(r.folhas,'folha padrão entrou','folhas padrão entraram')+' na sua conta.'};
      toast('Código resgatado');render();focar($('in-codigo'))
    },function(er){
      var t=er&&er.tipo,M={formato:'Confira o formato: PL seguido de 8 letras e números.',dv:'O dígito de conferência não bate. Confira o código digitado.',
        usado:'Este código já foi usado.',vencido:'Este código venceu.',revogado:'Este código foi revogado.',invalido:'Código não encontrado. Confira e tente de novo.',
        tentativas:'Muitas tentativas. Espere '+segundos(er&&er.esperaMs)+' e tente de novo.',indisponivel:'Não foi possível conferir o código neste navegador.'};
      var v=$('in-codigo').value;
      aviso.codigo={erro:true,txt:M[t]||M.indisponivel};render();
      $('in-codigo').value=v;focar($('in-codigo'))
    })
  });

  /* pagamentos */
  els=document.querySelectorAll('.btn3[data-rec]');
  for(i=0;i<els.length;i++)els[i].addEventListener('click',verRecibo);

  /* segurança */
  if(b=$('b-senha'))b.addEventListener('click',function(){aberto.senha=true;delete aviso.senha;render();focar($('in-senha-atual')||$('in-senha-nova'))});
  if(b=$('b-senha-cancelar'))b.addEventListener('click',function(){aberto.senha=false;delete aviso.senha;render();focar($('b-senha'))});
  if(b=$('f-senha'))b.addEventListener('submit',function(e){
    e.preventDefault();
    var at=$('in-senha-atual'),nova=$('in-senha-nova').value,rep=$('in-senha-rep').value,bt=$('b-senha-salvar');
    function falha(txt,campo){aviso.senha={erro:true,txt:txt};render();focar($(campo))}
    if(nova.length<8||nova.length>128){falha('A senha nova precisa ter de 8 a 128 caracteres.','in-senha-nova');return}
    if(nova!==rep){falha('As duas senhas novas não são iguais.','in-senha-rep');return}
    bt.disabled=true;
    C.trocarSenha(at?at.value:'',nova).then(function(){
      aberto.senha=false;aviso.senha={txt:'Senha salva.'};toast('Senha salva');render();focar($('b-senha'))
    },function(er){
      var t=er&&er.erro;
      if(t==='atual')falha('A senha atual não confere.','in-senha-atual');
      else if(t==='tentativas')falha('Muitas tentativas. Espere '+segundos(er.esperaMs)+' e tente de novo.','in-senha-atual');
      else if(t==='senha')falha('A senha nova precisa ter de 8 a 128 caracteres.','in-senha-nova');
      else falha('Não foi possível salvar a senha neste navegador.','in-senha-nova')
    })
  });
  if(b=$('b-sair-todos'))b.addEventListener('click',function(){
    pop('Sair de todos os aparelhos?',
      '<p>Você sai da conta em todos os aparelhos, inclusive neste. Nesta versão de demonstração, a conta só está conectada neste navegador. Seus projetos continuam no aparelho.</p>',
      [{led:true,txt:'Continuar conectado',cb:function(){fecharPop(false)}},
       {txt:'Sair de todos',ic:ico(I.sair),cb:function(){C.encerrarSessoes();fecharPop(false);sairPara('Você saiu de todos os aparelhos.')}}])
  });

  /* preferências */
  els=document.querySelectorAll('input[name="pref-un"]');
  for(i=0;i<els.length;i++)els[i].addEventListener('change',function(){
    if(!this.checked)return;
    var r=C.salvarPreferencias({unidade:this.value});
    if(r.erro)return;
    try{sessionStorage.setItem('pl-unidade',this.value)}catch(e){}   /* o editor lê daqui (molduras.js) */
    var s=document.querySelector('#sec-preferencias .sec__res');if(s)s.textContent=s.textContent.replace(/^Medidas em \S+/,'Medidas em '+this.value);
    toast('Medidas em '+this.value)
  });
  if(b=$('pref-novidades'))b.addEventListener('click',function(){
    var on=this.getAttribute('aria-checked')!=='true';
    this.setAttribute('aria-checked',on?'true':'false');
    $('nov-e').textContent=on?'Ligado':'Desligado';
    C.salvarPreferencias({emails:{novidades:on}});
    toast(on?'Preferência guardada: novidades ligadas.':'Preferência guardada: novidades desligadas.')
  });

  /* notificações (D-208) */
  function ntSalvar(d,msg,foco){var r=AV.salvarPrefs(d);if(r&&r.ok){AV.atualizar();if(msg)toast(msg);render();if(foco&&$(foco))focar($(foco))}}
  if(b=$('nt-geral'))b.addEventListener('click',function(){var on=this.getAttribute('aria-checked')!=='true';ntSalvar({ligado:on},on?'Avisos ligados.':'Avisos desligados.','nt-geral')});
  els=document.querySelectorAll('[data-nt-tipo]');
  for(i=0;i<els.length;i++)els[i].addEventListener('click',function(){
    var k=this.getAttribute('data-nt-tipo'),on=this.getAttribute('aria-checked')!=='true',t={};t[k]=on;
    ntSalvar({tipos:t},AV.TIPOS[k].nome+': '+(on?'ligado':'desligado')+'.',this.id)
  });
  els=document.querySelectorAll('input[name="nt-canal"]');
  for(i=0;i<els.length;i++)els[i].addEventListener('change',function(){
    if(!this.checked)return;
    var v=this.value,s=AV.suporte();
    ntSalvar({canal:v},v==='app'?'Avisos só dentro do PolarLife.':s.permissao==='granted'?'Avisos também nas notificações do aparelho.':'Falta permitir as notificações neste aparelho.',s.permissao==='default'&&v==='sistema'?'b-nt-permitir':null);
    if(!$('b-nt-permitir')||v!=='sistema'){var r=document.querySelector('input[name="nt-canal"]:checked');if(r)focar(r)}
  });
  if(b=$('b-nt-permitir'))b.addEventListener('click',function(){
    this.disabled=true;
    AV.pedirPermissao().then(function(v){
      if(v==='granted'){AV.salvarPrefs({canal:'sistema'});AV.atualizar();toast('Notificações permitidas neste aparelho.')}
      else toast(v==='denied'?'As notificações ficaram bloqueadas neste navegador.':'Permissão não concedida.');
      render();var x=document.querySelector('input[name="nt-canal"]:checked');if(x)focar(x)
    })
  });
  if((b=$('nt-sil-ini'))&&$('nt-sil-fim')){
    var sil=function(){ntSalvar({silencio:{ini:+$('nt-sil-ini').value,fim:+$('nt-sil-fim').value}},'Horário silencioso guardado.',this.id)};
    b.addEventListener('change',sil);$('nt-sil-fim').addEventListener('change',sil)
  }
  if(b=$('b-nt-teste'))b.addEventListener('click',function(){
    this.disabled=true;
    AV.testar().then(function(r){
      aviso.nt=!r.painel?{erro:true,txt:'Os avisos estão desligados. Ligue «Receber avisos» e «Avisos do PolarLife» para testar.'}:
        {txt:r.sistema?'Aviso de teste enviado: veja o sino e as notificações do aparelho.':'Aviso de teste enviado: veja o sino no alto da tela.'};
      toast(r.painel?'Aviso de teste enviado':'Avisos desligados');render();focar($('b-nt-teste'))
    })
  });

  /* privacidade e dados */
  if(b=$('b-exportar'))b.addEventListener('click',function(){
    var blob=C.exportarDados();
    if(!blob){toast('Não foi possível exportar neste navegador.');return}
    var d=new Date(),n='polarlife-conta-'+d.getFullYear()+('0'+(d.getMonth()+1)).slice(-2)+('0'+d.getDate()).slice(-2)+'.json';
    var u=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(u)},2000);
    toast('Dados exportados ('+n+')')
  });
  if(b=$('b-excluir'))b.addEventListener('click',function(){
    pop('Excluir sua conta?',
      '<p>Folhas, créditos e recibos desta conta serão apagados deste navegador. Seus projetos e fotos continuam no aparelho.</p>',
      [{led:true,txt:'Manter conta',cb:function(){fecharPop(false)}},
       {txt:'Excluir conta',ic:ico(I.lixeira),cb:function(){C.excluirConta();fecharPop(false);sairPara('Conta apagada deste navegador.')}}])
  })
}
function verRecibo(){
  var i=+this.getAttribute('data-rec'),r=C.recibos()[i];
  if(!r)return;
  pop('Recibo',
    '<dl><dt>Número</dt><dd class="mono">'+esc(r.numero)+'</dd><dt>Data</dt><dd>'+(r.emitidoEm?dataCurta(r.emitidoEm):'')+'</dd><dt>Descrição</dt><dd>'+esc(r.descricao)+'</dd><dt>Valor</dt><dd class="mono">'+C.moeda(r.valorCentavos/100)+'</dd></dl>'+
    '<p>Recibo de demonstração: nenhuma cobrança foi feita.</p>',
    [{txt:'Fechar',cb:function(){fecharPop(true)}}],true)
}

if(C){
  render();
  if(window.PLPWA&&window.PLPWA.aoMudar)window.PLPWA.aoMudar(renderApp)
}
})();
