/* T-27 · Conta · brief rodada 2 §3. Renderiza a partir de PLCONTA (plano, limites, recibos).
   Pop-ups nível 3 com LED na opção segura (D-082). Sessão de código tem variante simplificada. */
(function(){
var $=function(i){return document.getElementById(i)};
var C=window.PLCONTA,G=window.PLGUARDA;
var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
var tmToast=null,abridor=null;

function toast(msg){clearTimeout(tmToast);$('toast-t').textContent=msg;$('toast').hidden=false;tmToast=setTimeout(function(){$('toast').hidden=true},4000)}
function focar(el){try{el.focus({preventScroll:true})}catch(e){el.focus()}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ico(n){return '<svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true">'+n+'</svg>'}
var I={pessoa:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  lixeira:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  sair:'<path d="M9 4h9v16H9M5 12h9M11 9l3 3-3 3"/>',
  panela:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
  baixar:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  aten:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>'};

function dataLonga(ts){var d=new Date(ts);return d.getDate()+' de '+MESES[d.getMonth()]+' de '+d.getFullYear()}

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
  $('scrim').hidden=false;dlg.hidden=false
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

/* ---------- render ---------- */
function render(){
  var sc=C.sessaoCodigo(),cx=$('corpo');
  if(sc){renderCodigo(sc,cx);return}
  var s=C.sessao();if(!s){location.replace(G?G.urlEntrar('conta'):'entrar/');return}
  var pl=C.plano()||{},id=pl.id;
  var h='';

  /* cartão Você */
  h+='<section class="cc" aria-labelledby="cc-voce"><h2 class="cc__t" id="cc-voce">Você</h2>'+
    '<div class="cc__row"><div class="cc__pilha"><p class="cc__email">'+esc(s.email)+'</p>'+
    '<p class="cc__meta">Entrou em '+dataLonga(s.entrouEm)+'</p></div>'+
    '<span class="pill">Conta de teste · '+esc(pl.nome||'Grátis')+'</span></div>'+
    '<div class="cc__act"><button type="button" class="btn2 btn2--danger" id="b-sair">'+ico(I.sair)+'Sair</button></div></section>';

  /* cartão Plano */
  h+='<section class="cc" aria-labelledby="cc-plano"><h2 class="cc__t" id="cc-plano">Plano</h2>';
  if(id==='pro'){
    h+='<p class="cc__plano">Pro · '+C.moeda(pl.preco)+' por mês</p>';
    var ate=pl.renovaTs?dataLonga(pl.renovaTs):'';
    if(pl.canceladoEm)h+='<p class="cc__meta">Pro até '+ate+' · depois, Grátis</p>';
    h+='<ul class="cc__folhas"><li>'+esc(pl.usadasMes)+' de '+esc(pl.usoRazoavel)+' folhas usadas em '+MESES[new Date().getMonth()]+' · uso razoável</li>'+
      '<li>Até '+esc(pl.fotosPorProjeto)+' fotos por projeto</li></ul>';
    /* atenções (DOC-03 §4: nunca bloqueia) */
    var av=pl.avisoPct/100*pl.usoRazoavel;
    if(pl.usadasMes>=pl.usoRazoavel)h+='<div class="atn" role="status">'+ico(I.aten)+'<p>Você chegou às '+pl.usoRazoavel+' folhas deste mês. Pode continuar exportando; vamos olhar o uso com calma.</p></div>';
    else if(pl.usadasMes>=av)h+='<div class="atn" role="status">'+ico(I.aten)+'<p>Você usou '+pl.usadasMes+' das '+pl.usoRazoavel+' folhas do uso razoável deste mês.</p></div>';
    /* assinatura: Pro pode desligar (D-119 / DOC-03 §2) */
    if(pl.canceladoEm){
      h+='<p class="cc__meta">A assinatura Polar Life volta a aparecer quando o plano virar Grátis.</p>'+
        '<div class="cc__act"><button type="button" class="btn2" id="b-reativar">'+ico(I.check)+'Reativar o Pro</button></div>'
    }else{
      var ligada=!pl.assinaturaDesligada;
      h+='<div class="sw-row"><div><p class="cc__meta" id="assin-l">'+(ligada?'Desligar':'Ligar')+' a assinatura Polar Life</p><p class="help">Muda o padrão de novos projetos. Os projetos atuais não mudam.</p></div>'+
        '<button type="button" class="sw" id="assin" role="switch" aria-checked="'+(ligada?'true':'false')+'" aria-labelledby="assin-l"><span></span></button></div>'+
        '<div class="cc__act"><button type="button" class="btn2 btn2--danger" id="b-cancelar">'+ico(I.lixeira)+'Cancelar assinatura</button></div>'
    }
  }else if(id==='avulsa'){
    h+='<p class="cc__plano">Folha avulsa</p>'+
      '<ul class="cc__folhas"><li>'+esc(pl.folhasCompradas.padrao)+' folhas padrão · '+esc(pl.folhasCompradas.grande)+' folhas grandes</li>'+
      '<li>Até '+esc(pl.fotosPorProjeto)+' fotos por projeto</li>'+
      '<li>Assinatura Polar Life nas polaroids: sempre ligada</li></ul>'+
      '<div class="cc__act"><a class="led-btn" id="b-planos" href="planos/"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Ver folhas e planos<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a></div>'
  }else{ /* grátis */
    var resta=Math.max(0,(pl.folhasMes||1)-pl.usadasMes);
    h+='<p class="cc__plano">Grátis · '+C.moeda(0)+'</p>'+
      '<ul class="cc__folhas"><li>'+resta+' de '+esc(pl.folhasMes||1)+' folha'+((pl.folhasMes||1)>1?'s':'')+' grátis disponível'+((pl.folhasMes||1)>1?'is':'')+' em '+MESES[new Date().getMonth()]+' · Renova em '+esc(pl.renovaEm||'')+'</li>'+
      '<li>Até '+esc(pl.fotosPorProjeto)+' fotos por projeto</li>'+
      '<li>Assinatura Polar Life nas polaroids: sempre ligada</li></ul>';
    if(resta===0)h+='<div class="atn" role="status">'+ico(I.aten)+'<p>Sua folha grátis deste mês já foi usada.</p></div>';
    h+='<div class="cc__act"><a class="led-btn" id="b-planos" href="planos/"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Ver folhas e planos<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a></div>'
  }
  h+='</section>';

  /* admin: cartão extra (§3.2) */
  if(id==='admin'){
    h+='<section class="cc" aria-labelledby="cc-admin"><h2 class="cc__t" id="cc-admin">Painel do admin</h2>'+
      '<p class="cc__meta">Limites de plano e contas de teste.</p>'+
      '<div class="cc__act"><a class="btn2" href="../admin/">'+ico(I.panelle)+'Abrir painel</a></div></section>'
  }

  /* recibos */
  var rs=pl.recibos||[];
  h+='<section class="cc" aria-labelledby="cc-rec"><h2 class="cc__t" id="cc-rec">Recibos</h2>';
  if(rs.length){
    h+='<ul class="rec-lista">';
    for(var i=0;i<rs.length;i++){
      h+='<li class="rec"><div class="rec__q"><p class="rec__d mono">'+esc(rs[i].data)+'</p><p class="rec__v">'+esc(rs[i].desc)+' · <span class="mono">'+esc(rs[i].valor)+'</span></p></div>'+
        '<button type="button" class="btn3" data-rec="'+i+'">Ver recibo</button></li>'
    }
    h+='</ul>'
  }else h+='<p class="rec-vazio">Nenhum recibo ainda.</p>';
  h+='</section>';

  /* seus dados */
  h+='<section class="cc" aria-labelledby="cc-dados"><h2 class="cc__t" id="cc-dados">Seus dados</h2>'+
    '<div class="cc__act"><button type="button" class="btn2" id="b-exportar">'+ico(I.baixar)+'Exportar meus dados</button>'+
    '<button type="button" class="btn2 btn2--danger" id="b-excluir">'+ico(I.lixeira)+'Excluir conta</button></div>'+
    '<p class="help">Suas fotos e projetos já estão no seu aparelho e não entram neste arquivo.</p></section>';

  cx.innerHTML=h;
  ligar()
}

/* variante da sessão de código de impressão (D-124) */
function renderCodigo(sc,cx){
  var pc=C.pacotes()[sc.pacote]||{nome:'Avulso básico',fotos:24,folhas:8};
  var h='<section class="cc" aria-labelledby="cc-voce"><h2 class="cc__t" id="cc-voce">Você</h2>'+
    '<div class="cc__row"><div class="cc__pilha"><p class="cc__email">Compra com código de impressão</p>'+
    '<p class="cc__meta">Entrou em '+dataLonga(sc.entrouEm)+'</p></div>'+
    '<span class="pill">Pacote '+esc(pc.nome)+'</span></div>';
  if(sc.usadoEm)h+='<div class="atn" role="status">'+ico(I.aten)+'<p>Seu código já foi usado.</p></div>';
  h+='<div class="cc__act"><button type="button" class="btn2 btn2--danger" id="b-sair">'+ico(I.sair)+'Sair</button></div></section>';
  h+='<section class="cc" aria-labelledby="cc-plano"><h2 class="cc__t" id="cc-plano">Plano</h2>'+
    '<p class="cc__plano">'+esc(pc.nome)+'</p>'+
    '<ul class="cc__folhas"><li>'+(sc.usadoEm?'0':sc.folhas)+' de '+sc.folhas+' folhas do pacote</li>'+
    '<li>Até '+sc.fotos+' fotos por projeto</li>'+
    '<li>Assinatura Polar Life nas polaroids: sempre ligada</li></ul>'+
    (sc.usadoEm?'<div class="info">'+ico(I.info)+'<p>Para imprimir de novo, compre outro código de impressão ou entre com e-mail.</p></div>':'')+
    '</section>';
  cx.innerHTML=h;
  ligar()
}

/* ---------- ações ---------- */
function ligar(){
  var b;
  if(b=$('b-sair'))b.addEventListener('click',function(){
    C.sair();
    toast('Você saiu. Seus projetos continuam neste aparelho.');
    setTimeout(function(){location.href=G?G.raiz():'../'},700)
  });
  if(b=$('b-planos'))b.setAttribute('href','planos/'+(location.search||''));
  if(b=$('b-cancelar'))b.addEventListener('click',function(){
    var pl=C.plano()||{},ate=pl.renovaTs?dataLonga(pl.renovaTs):'';
    var dias=pl.renovaTs?Math.max(0,Math.ceil((pl.renovaTs-Date.now())/86400000)):30;
    var extra=dias>23?'<p>Como você assinou há menos de 7 dias, o valor é devolvido por inteiro.</p>':''; /* [VALIDAR com advogado] */
    pop('Cancelar o Pro?',
      '<p>Você continua com o Pro até '+ate+'. Depois, a conta volta ao plano Grátis e a assinatura Polar Life volta a aparecer nas polaroids.</p>'+extra,
      [{led:true,txt:'Manter o Pro',cb:function(){fecharPop(false)}},
       {txt:'Cancelar assinatura',ic:ico(I.lixeira),cb:function(){C.cancelarPro();fecharPop(false);toast('Assinatura cancelada. Você continua com o Pro até '+ate+'.');render()}}])
  });
  if(b=$('b-reativar'))b.addEventListener('click',function(){
    C.assinarPro('aprovado');
    toast('Pro reativado · Ambiente de teste');
    render()
  });
  if(b=$('assin'))b.addEventListener('click',function(){
    var ligada=this.getAttribute('aria-checked')==='true'?false:true;
    this.setAttribute('aria-checked',ligada?'true':'false');
    var l=$('assin-l');if(l)l.textContent=(ligada?'Desligar':'Ligar')+' a assinatura Polar Life';
    C.trocarAssinatura(!ligada); /* preferência de novos projetos (brief §3.2) */
    toast(ligada?'Novos projetos nascem com a assinatura Polar Life.':'Novos projetos nascem sem assinatura.')
  });
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
    pop('Excluir sua conta de teste?',
      '<p>Folhas, créditos e recibos desta conta serão apagados deste navegador. Seus projetos e fotos continuam no aparelho.</p>',
      [{led:true,txt:'Manter conta',cb:function(){fecharPop(false)}},
       {txt:'Excluir conta',ic:ico(I.lixeira),cb:function(){C.excluirConta();fecharPop(false);toast('Conta de teste apagada deste navegador.');setTimeout(function(){location.href=G?G.raiz():'../'},700)}}])
  });
  var rs=[].slice.call(document.querySelectorAll('.btn3[data-rec]'));
  for(var i=0;i<rs.length;i++)rs[i].addEventListener('click',verRecibo)
}
function verRecibo(){
  var i=+this.getAttribute('data-rec'),r=((C.plano()||{}).recibos||[])[i];
  if(!r)return;
  pop('Recibo',
    '<dl><dt>Número</dt><dd class="mono">'+esc(r.id)+'</dd><dt>Data</dt><dd>'+esc(r.data)+'</dd><dt>Descrição</dt><dd>'+esc(r.desc)+'</dd><dt>Valor</dt><dd class="mono">'+esc(r.valor)+'</dd></dl>'+
    '<p>Recibo de teste. Em produção, o recibo chega por e-mail e pode ser baixado aqui.</p>',
    [{txt:'Fechar',cb:function(){fecharPop(true)}}],true)
}

if(C)render();
})();
