/* T-26 · Folhas e planos (brief §3.7) · D-208: três cartões alinhados, cada um com a sua ação; o Pro tem fundo preto e o
   único LED da tela (T8). Embaixo, «Tem um código?»: código de folhas avulsas (resgatarCodigo, só o hash) e cupom promocional
   (PLCONTA.conferirCupom: preço antes e depois; o cupom só é gasto com o pagamento aprovado). Compra simulada (T7). */
(function(){
var $=function(i){return document.getElementById(i)};
var C=window.PLCONTA,G=window.PLGUARDA;
var tmToast=null,QTD=5,CLASSE='padrao',CUPOM=null,msg={};

function toast(m){clearTimeout(tmToast);$('toast-t').textContent=m;$('toast').hidden=false;tmToast=setTimeout(function(){$('toast').hidden=true},4000)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ico(n,c){return '<svg class="ico'+(c?' '+c:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+n+'</svg>'}
var I={check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',aten:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  menos:'<path d="M5 12h14"/>',mais:'<path d="M12 5v14M5 12h14"/>',tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="8" cy="8" r="1.5"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>'};
function idAtual(){var pl=C.plano()||{};return pl.codigo?'codigo':(pl.id==='admin'?'pro':pl.id)}
function L(){return C.limites().planos}
/* preço com o cupom aplicado (quando vale para o produto) */
function preco(prod,valor){
  if(!CUPOM||CUPOM.produtos.indexOf(prod)<0)return{valor:valor,html:C.moeda(valor)};
  var d=C.descontoCupom(CUPOM,valor),v=Math.round((valor-d)*100)/100;
  return{valor:v,html:'<s class="pln__de" aria-label="de '+C.moeda(valor)+'">'+C.moeda(valor)+'</s> '+C.moeda(v)}
}
function prodAvulsa(){return CLASSE==='grande'?'folha_grande':'folha_padrao'}
function totAvulsa(){var l=L().avulsa;return QTD*(CLASSE==='grande'?l.precoGrande:l.precoPadrao)}
function totTxt(){return QTD+' folha'+(QTD>1?'s':'')+' '+(CLASSE==='grande'?'grandes':'padrão')+' · '+preco(prodAvulsa(),totAvulsa()).html}
function lista(itens,claro){return '<ul class="pln__ul">'+itens.map(function(t){return '<li>'+ico(I.check)+'<span>'+t+'</span></li>'}).join('')+'</ul>'}
function render(){
  var P=L(),at=idAtual(),h='',pl=C.plano()||{};
  /* chip «Demonstração · sem cobrança» (modo demo; D-194: a compra simulada fica) */
  var top=document.querySelector('.top h1');
  if(C.modo&&C.modo()==='demo'&&!document.querySelector('.plns__chip')){
    var ch=document.createElement('span');ch.className='plns__chip';
    ch.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9.5a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3L14 9V3"/></svg>Demonstração · sem cobrança';
    top.parentNode.insertBefore(ch,top.nextSibling)}
  /* Grátis */
  h+='<article class="pln" aria-labelledby="p-gratis"><div class="pln__top"><h2 class="pln__nome" id="p-gratis">Grátis</h2>'+(at==='gratis'?'<span class="pln__seu">Seu plano</span>':'')+'</div>'+
    '<p class="pln__preco">'+C.moeda(0)+'<span class="pln__per"> por mês</span></p>'+
    lista([esc(P.gratis.folhasMes)+' folha'+(P.gratis.folhasMes>1?'s':'')+' grátis por mês','Até '+esc(P.gratis.fotos)+' fotos por projeto','Assinatura PolarLife sempre ligada'])+
    '<div class="pln__acao">'+(at==='gratis'?'<p class="pln__nota">'+ico(I.check)+'Você está neste plano.</p>':'<button type="button" class="btn2 btn2--lg pln__b" id="b-gratis">Mudar para o Grátis</button>')+'</div></article>';
  /* Folha avulsa: a compra fica sempre à vista */
  var pac=P.avulsa.pacotes&&P.avulsa.pacotes.length?P.avulsa.pacotes:[1,5,10];
  h+='<article class="pln" aria-labelledby="p-avulsa"><div class="pln__top"><h2 class="pln__nome" id="p-avulsa">Folha avulsa</h2>'+(at==='avulsa'||at==='codigo'?'<span class="pln__seu">Seu plano</span>':'')+'</div>'+
    '<p class="pln__preco">'+preco('folha_padrao',P.avulsa.precoPadrao).html+'<span class="pln__per"> a folha</span></p>'+
    lista([C.moeda(P.avulsa.precoPadrao)+' a folha padrão · '+C.moeda(P.avulsa.precoGrande)+' a grande','Até '+esc(P.avulsa.fotos)+' fotos por projeto','Assinatura PolarLife sempre ligada'])+
    '<div class="pln__compra">'+
    '<div class="pln__q"><label class="pln__q-l" for="qtd">Quantas folhas</label>'+
    '<span class="num"><button type="button" class="num__b" id="q-menos" aria-label="Menos folhas">'+ico(I.menos,'sm')+'</button>'+
    '<span class="num__v"><input id="qtd" inputmode="numeric" value="'+QTD+'"><span class="num__u">folhas</span></span>'+
    '<button type="button" class="num__b" id="q-mais" aria-label="Mais folhas">'+ico(I.mais,'sm')+'</button></span></div>'+
    '<div class="pln__q"><span class="pln__q-l" id="cl-l">Tamanho</span><div class="seg" role="radiogroup" aria-labelledby="cl-l">'+
    '<label><input type="radio" name="classe" value="padrao"'+(CLASSE==='padrao'?' checked':'')+'><span>Padrão</span></label>'+
    '<label><input type="radio" name="classe" value="grande"'+(CLASSE==='grande'?' checked':'')+'><span>Grande</span></label></div></div>'+
    '<p class="pln__tot"><span>Total</span><span id="tot">'+totTxt()+'</span></p>'+
    '<p class="help">Pacotes sugeridos: '+pac.join(', ')+' folhas.</p></div>'+
    '<div class="pln__acao"><button type="button" class="btn2 btn2--lg pln__b" id="b-avulsa">Comprar '+QTD+' folha'+(QTD>1?'s':'')+'</button></div></article>';
  /* Pro: fundo preto e o LED da tela (T8) */
  h+='<article class="pln pln--pro" aria-labelledby="p-pro"><div class="pln__top"><h2 class="pln__nome" id="p-pro">Pro</h2>'+(at==='pro'?'<span class="pln__seu">Seu plano</span>':'<span class="pln__tag">Para quem imprime sempre</span>')+'</div>'+
    '<p class="pln__preco">'+preco('pro_mensal',P.pro.precoMes).html+'<span class="pln__per"> por mês</span></p>'+
    lista(['Folhas à vontade, uso razoável de '+esc(P.pro.usoRazoavel)+' por mês','Até '+esc(P.pro.fotos)+' fotos por projeto','Pode desligar a assinatura PolarLife','Arrependimento em 7 dias'])+
    '<div class="pln__acao">'+(at==='pro'?'<p class="pln__nota">'+ico(I.check)+'Você está neste plano. Cancelar ou ver a renovação fica na Conta › Plano e uso.</p>'
      :'<button type="button" class="led-btn led-btn--light led-btn--block" id="b-pro"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">Assinar o Pro</span></button>')+'</div></article>';
  $('cartoes').innerHTML=h;
  $('ajuda-continuar').textContent=pl.codigo?'Você entrou com um código de impressão: para comprar folhas ou assinar, entre com a sua conta.':'';
  ligarCartoes();codigos()
}
function qtd(n){QTD=Math.min(50,Math.max(1,n));$('qtd').value=QTD;atualizaTot()}
function atualizaTot(){$('tot').innerHTML=totTxt();var b=$('b-avulsa');if(b)b.textContent='Comprar '+QTD+' folha'+(QTD>1?'s':'')}
function ligarCartoes(){
  $('q-menos').addEventListener('click',function(){qtd(QTD-1)});
  $('q-mais').addEventListener('click',function(){qtd(QTD+1)});
  $('qtd').addEventListener('input',function(){var v=parseInt(this.value.replace(/\D/g,''),10);QTD=isNaN(v)?QTD:Math.min(50,Math.max(1,v));atualizaTot()});
  [].forEach.call($('cartoes').querySelectorAll('input[name=classe]'),function(r){r.addEventListener('change',function(){CLASSE=this.value;atualizaTot()})});
  var b;
  if(b=$('b-avulsa'))b.addEventListener('click',function(){comprar(false)});
  if(b=$('b-pro'))b.addEventListener('click',function(){comprar(true)});
  if(b=$('b-gratis'))b.addEventListener('click',function(){
    pop('Mudar para o Grátis?','<p>Você continua com as folhas já compradas. O que muda: 1 folha grátis por mês e a assinatura PolarLife sempre ligada.</p>',
      [{led:true,txt:'Continuar no plano atual',cb:fecharDlg},{txt:'Mudar para o Grátis',cb:function(){C.rebaixarGratis();fecharDlg();toast('Plano mudado para o Grátis.');render()}}])})
}
function comprar(pro){
  var pl=C.plano()||{};
  if(pl.codigo){   /* sessão de código: sem conta para comprar */
    pop('Entrar para comprar','<p>Você entrou com um código de impressão. Para comprar folhas ou assinar, entre com a sua conta.</p>',
      [{led:true,txt:'Entrar com e-mail',cb:function(){fecharDlg();location.href=G?G.raiz()+'entrar/?voltar='+encodeURIComponent(location.pathname):'../../entrar/'}},{txt:'Voltar',cb:fecharDlg}]);
    return}
  PLPORTAO.pagamento(pro?0:QTD,pro?'padrao':CLASSE,pro,depoisCompra,{cupom:CUPOM})
}
function depoisCompra(r){if(r&&r.ok&&r.comprou){if(CUPOM){CUPOM=null;msg.cupom={txt:'Cupom usado nesta compra.'}}toast('Compra concluída · demonstração, sem cobrança');render()}}

/* ---------- «Tem um código?» ---------- */
function recado(k){var m=msg[k];return m?'<p class="tc__m'+(m.erro?' tc__m--erro':'')+'" id="m-'+k+'" role="'+(m.erro?'alert':'status')+'">'+ico(m.erro?I.aten:I.check)+'<span>'+esc(m.txt)+'</span></p>':''}
function segundos(ms){var s=Math.ceil((ms||0)/1000);return s+' segundo'+(s===1?'':'s')}
function codigos(){
  var semConta=!!(C.plano()||{}).codigo,h='';
  h+='<form class="tc" id="f-codigo" novalidate aria-labelledby="t-codigo"><h3 class="tc__t" id="t-codigo">Código de folhas avulsas</h3>'+
    '<p class="help">O código que você recebeu (por e-mail ou num cartão) põe as folhas na sua conta.</p>'+
    '<label class="tc__l" for="in-codigo">Código</label><div class="tc__row"><input class="tc__in" id="in-codigo" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="PL·XXXX·XXXX" maxlength="16"'+(semConta?' disabled':'')+'>'+
    '<button type="submit" class="btn2 btn2--lg" id="b-codigo"'+(semConta?' disabled':'')+'>Usar código</button></div>'+
    (semConta?'<p class="help">Entre com a sua conta para pôr um código nela.</p>':'')+recado('codigo')+'</form>';
  h+='<form class="tc" id="f-cupom" novalidate aria-labelledby="t-cupom"><h3 class="tc__t" id="t-cupom">Cupom promocional</h3>'+
    '<p class="help">Desconto na compra de folhas ou na assinatura do Pro. Os preços acima já mostram o desconto.</p>';
  if(CUPOM){
    var oq=CUPOM.tipo==='percentual'?CUPOM.percentual+'% de desconto':C.moeda(CUPOM.valor)+' de desconto';
    h+='<div class="tc__ok" id="cupom-ok">'+ico(I.tag)+'<div><strong>'+esc(CUPOM.texto)+' · '+esc(CUPOM.rotulo)+'</strong><span>'+oq+' em '+CUPOM.produtos.map(function(p){return C.PRODUTOS[p].toLowerCase()}).join(', ')+
      (CUPOM.validoAte?' · até '+new Date(CUPOM.validoAte).toLocaleDateString('pt-BR'):'')+'</span></div>'+
      '<button type="button" class="btn2" id="b-cupom-tirar">'+ico(I.x,'sm')+'Tirar</button></div>'
  }else h+='<label class="tc__l" for="in-cupom">Cupom</label><div class="tc__row"><input class="tc__in" id="in-cupom" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20">'+
    '<button type="submit" class="btn2 btn2--lg" id="b-cupom">Aplicar cupom</button></div>';
  h+=recado('cupom')+'</form>';
  $('codigos-grade').innerHTML=h;
  $('f-codigo').addEventListener('submit',function(e){e.preventDefault();
    var v=$('in-codigo').value;
    C.resgatarCodigo(v).then(function(r){msg.codigo={txt:'Código aceito: '+r.folhas+' folha'+(r.folhas===1?' padrão entrou':'s padrão entraram')+' na sua conta.'};toast('Folhas na conta');render();var e2=$('in-codigo');if(e2)e2.focus()},function(er){
      var t=er&&er.tipo,M={formato:'Confira o formato: PL seguido de 8 letras e números.',dv:'O dígito de conferência não bate. Confira o código digitado.',usado:'Este código já foi usado.',vencido:'Este código venceu.',
        revogado:'Este código foi revogado.',invalido:'Código não encontrado. Confira e tente de novo.',tentativas:'Muitas tentativas. Espere '+segundos(er&&er.esperaMs)+' e tente de novo.',semConta:'Entre com a sua conta para pôr um código nela.',indisponivel:'Não foi possível conferir o código neste navegador.'};
      msg.codigo={erro:true,txt:M[t]||M.indisponivel};codigos();var e3=$('in-codigo');if(e3){e3.value=v;e3.setAttribute('aria-invalid','true');e3.setAttribute('aria-describedby','m-codigo');e3.focus()}})});
  $('f-cupom').addEventListener('submit',function(e){e.preventDefault();var inp=$('in-cupom');if(!inp)return;var v=inp.value;
    C.conferirCupom(v).then(function(r){CUPOM=r;msg.cupom={txt:'Cupom aplicado. Os preços já estão com o desconto.'};render();var t=$('b-cupom-tirar');if(t)t.focus()},function(er){
      var t=er&&er.tipo,M={formato:'O cupom tem de 4 a 20 letras e números.',invalido:'Cupom não encontrado. Confira e tente de novo.',vencido:'Este cupom venceu.',esgotado:'Este cupom já foi usado o máximo de vezes.',
        pausado:'Este cupom está pausado no momento.',revogado:'Este cupom foi cancelado.',usado:'Você já usou este cupom.',produto:'Este cupom não vale para estes produtos.'};
      msg.cupom={erro:true,txt:M[t]||'Não foi possível conferir o cupom.'};codigos();var e4=$('in-cupom');if(e4){e4.value=v;e4.setAttribute('aria-invalid','true');e4.setAttribute('aria-describedby','m-cupom');e4.focus()}})});
  var tb=$('b-cupom-tirar');if(tb)tb.addEventListener('click',function(){CUPOM=null;delete msg.cupom;render();var e5=$('in-cupom');if(e5)e5.focus()})
}

/* ---------- pop-up simples (padrões do app) ---------- */
var abridor=null;
function pop(titulo,html,acoes){
  abridor=document.activeElement;$('dlg-t').textContent=titulo;$('dlg-corpo').innerHTML=html;
  var a=$('dlg-act');a.innerHTML='';
  acoes.forEach(function(x){var b=document.createElement('button');b.type='button';b.className=x.led?'led-btn':'btn2 btn2--lg';
    if(x.led)b.innerHTML='<span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">'+esc(x.txt)+'</span>';else b.textContent=x.txt;
    b.addEventListener('click',x.cb);a.appendChild(b)});
  $('scrim').hidden=false;$('dialog').hidden=false;
  var f=a.querySelector('.led-btn')||a.querySelector('button');if(f)try{f.focus({preventScroll:true})}catch(e){}
}
function fecharDlg(){$('dialog').hidden=true;$('scrim').hidden=true;if(abridor&&abridor.focus)try{abridor.focus({preventScroll:true})}catch(e){}}
$('scrim').addEventListener('click',fecharDlg);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('dialog').hidden)fecharDlg()});

if(C)render();
})();
