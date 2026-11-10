/* T-26 · planos (brief §3.7). Renderiza de PLCONTA.limites(); LED «Continuar» abre o pagamento
   compartilhado (PLPORTAO.pagamento); Grátis pede confirmação de rebaixamento (D-082). */
(function(){
var $=function(i){return document.getElementById(i)};
var C=window.PLCONTA,G=window.PLGUARDA;
var tmToast=null,sel='gratis',QTD=5,CLASSE='padrao';

function toast(msg){clearTimeout(tmToast);$('toast-t').textContent=msg;$('toast').hidden=false;tmToast=setTimeout(function(){$('toast').hidden=true},4000)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ico(n){return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+n+'</svg>'}
var I={check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>'};

function atual(){ /* estado local: qual radio, quanto, qual classe */
  var r=document.querySelector('input[name=plano]:checked');
  if(r)sel=r.value;
  return sel
}
function render(){
  var L=C.limites().planos,pl=C.plano()||{};
  var atualId=pl.codigo?'codigo':(pl.id==='admin'?'pro':pl.id);
  var h='';
  /* chip «Valores de teste» (modo demo, C-f) */
  var top=document.querySelector('.top h1');
  if(C.modo&&C.modo()==='demo'&&!document.querySelector('.plns__chip')){
    var ch=document.createElement('span');
    ch.className='plns__chip';
    ch.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9.5a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3L14 9V3"/></svg>Valores de teste';
    top.appendChild(ch)
  }

  /* Grátis */
  h+='<label class="pln"><input type="radio" name="plano" value="gratis"'+(atualId==='gratis'?' checked':'')+'>'+
   '<div class="pln__c"><div class="pln__top"><h2 class="pln__nome">Grátis</h2>'+(atualId==='gratis'?'<span class="pln__seu">Seu plano</span>':'')+'</div>'+
   '<p class="pln__preco">'+C.moeda(0)+'</p>'+
   '<ul class="pln__ul">'+
   '<li>'+ico(I.check)+esc(L.gratis.folhasMes)+' folha'+(L.gratis.folhasMes>1?'s':'')+' grátis por mês</li>'+
   '<li>'+ico(I.check)+'Até '+esc(L.gratis.fotos)+' fotos por projeto</li>'+
   '<li>'+ico(I.check)+'Assinatura Polar Life sempre ligada</li>'+
   '</ul></div></label>';

  /* Folha avulsa */
  var pac=L.avulsa.pacotes&&L.avulsa.pacotes.length?L.avulsa.pacotes:[1,5,10];
  h+='<label class="pln"><input type="radio" name="plano" value="avulsa"'+(atualId==='avulsa'||atualId==='codigo'?' checked':'')+'>'+
   '<div class="pln__c"><div class="pln__top"><h2 class="pln__nome">Folha avulsa</h2>'+(atualId==='avulsa'?'<span class="pln__seu">Seu plano</span>':'')+'</div>'+
   '<p class="pln__preco">'+C.moeda(L.avulsa.precoPadrao)+' a folha</p>'+
   '<ul class="pln__ul">'+
   '<li>'+ico(I.check)+C.moeda(L.avulsa.precoPadrao)+' a folha padrão · '+C.moeda(L.avulsa.precoGrande)+' a grande</li>'+
   '<li>'+ico(I.check)+'Até '+esc(L.avulsa.fotos)+' fotos por projeto</li>'+
   '<li>'+ico(I.check)+'Assinatura Polar Life sempre ligada</li>'+
   '</ul>'+
   '<div class="pln__compra">'+
   '<div class="pln__q"><span class="pln__q-l">Quantas folhas</span>'+
   '<span class="num"><button type="button" class="num__b" id="q-menos" aria-label="Menos folhas"><svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button>'+
   '<span class="num__v"><input id="qtd" inputmode="numeric" value="'+QTD+'" aria-label="Quantidade de folhas"><span class="num__u">folhas</span></span>'+
   '<button type="button" class="num__b" id="q-mais" aria-label="Mais folhas"><svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></span></div>'+
   '<div><span class="pln__q-l">Tamanho</span><div class="seg" role="radiogroup" aria-label="Tamanho da folha">'+
   '<label><input type="radio" name="classe" value="padrao"'+(CLASSE==='padrao'?' checked':'')+'><span>Padrão</span></label>'+
   '<label><input type="radio" name="classe" value="grande"'+(CLASSE==='grande'?' checked':'')+'><span>Grande</span></label>'+
   '</div></div>'+
   '<p class="pln__tot"><span>Total</span><span class="mono" id="tot">'+totTxt()+'</span></p>'+
   '<p class="help">Pacotes: '+pac.join(', ')+' folhas.</p>'+
   '</div></div></label>';

  /* Pro */
  h+='<label class="pln"><input type="radio" name="plano" value="pro"'+(atualId==='pro'?' checked':'')+'>'+
   '<div class="pln__c"><div class="pln__top"><h2 class="pln__nome">Pro</h2>'+(atualId==='pro'?'<span class="pln__seu">Seu plano</span>':'')+'</div>'+
   '<p class="pln__preco">'+C.moeda(L.pro.precoMes)+' por mês</p>'+
   '<ul class="pln__ul">'+
   '<li>'+ico(I.check)+'Folhas à vontade, uso razoável de '+esc(L.pro.usoRazoavel)+' por mês</li>'+
   '<li>'+ico(I.check)+'Até '+esc(L.pro.fotos)+' fotos por projeto</li>'+
   '<li>'+ico(I.check)+'Pode desligar a assinatura Polar Life</li>'+
   '<li>'+ico(I.check)+'Arrependimento em 7 dias</li>'+
   '</ul></div></label>';

  $('cartoes').innerHTML=h;
  var rs=[].slice.call($('cartoes').querySelectorAll('input[name=plano]'));
  for(var i=0;i<rs.length;i++)rs[i].addEventListener('change',function(){atual();abreCompra();atualizaLED()});
  var cs=[].slice.call($('cartoes').querySelectorAll('input[name=classe]'));
  for(var j=0;j<cs.length;j++)cs[j].addEventListener('change',function(){CLASSE=this.value;$('tot').textContent=totTxt();atualizaLED()});
  abreCompra();
  $('q-menos').addEventListener('click',function(){qtd(QTD-1)});
  $('q-mais').addEventListener('click',function(){qtd(QTD+1)});
  $('qtd').addEventListener('input',function(){
    var v=parseInt(this.value.replace(/\D/g,''),10);
    QTD=isNaN(v)?QTD:Math.min(50,Math.max(1,v));
    $('tot').textContent=totTxt();atualizaLED()
  });
  atualizaLED()
}
function totTxt(){
  var L=C.limites().planos.avulsa;
  return QTD+' folha'+(QTD>1?'s':'')+' '+(CLASSE==='grande'?'grandes':'padrão')+' · '+C.moeda(QTD*(CLASSE==='grande'?L.precoGrande:L.precoPadrao))
}
function abreCompra(){ /* mostra a compra só no cartão Avulsa escolhido */
  var av=document.querySelector('.pln input[value=avulsa]');
  var card=av?av.closest('.pln'):null;
  if(card)card.className='pln'+(atual()==='avulsa'?' pln--aberto':'')
}
function qtd(n){QTD=Math.min(50,Math.max(1,n));$('qtd').value=QTD;$('tot').textContent=totTxt();atualizaLED()}
function atualizaLED(){
  var pl=C.plano()||{},atualId=pl.codigo?'codigo':(pl.id==='admin'?'pro':pl.id),b=$('b-continuar'),aj=$('ajuda-continuar');
  var s=atual();
  b.disabled=false;
  if(s===atualId&&s!=='avulsa'){b.disabled=true;aj.textContent=s==='pro'?'Este já é o seu plano.':'Este já é o seu plano.'}
  else if(pl.codigo&&s!=='avulsa'){b.disabled=true;aj.textContent='Com um código de impressão, a compra é só de folhas avulsas.'}
  else if(pl.codigo&&s==='avulsa'){aj.textContent='A compra entra na conta ligada ao e-mail, não no código.'}
  else aj.textContent=''
}

/* ---------- Continuar (LED único, T8) ---------- */
$('f-planos').addEventListener('submit',function(ev){
  ev.preventDefault();
  var s=atual(),pl=C.plano()||{};
  if(pl.codigo){ /* sessão de código: sem conta para comprar */
    pop('Entrar para comprar',
      '<p>Você entrou com um código de impressão. Para comprar folhas ou assinar, entre com sua conta.</p>',
      [{led:true,txt:'Entrar com e-mail',cb:function(){fecharDlg();location.href=G?G.raiz()+'entrar/?voltar='+encodeURIComponent(location.pathname):'../../entrar/'}},
       {txt:'Voltar',cb:function(){fecharDlg()}}]);
    return
  }
  if(s==='pro'){PLPORTAO.pagamento(0,'padrao',true,depoisCompra);return}
  if(s==='avulsa'){PLPORTAO.pagamento(QTD,CLASSE,false,depoisCompra);return}
  /* Grátis: confirmar rebaixamento (brief §3.7) */
  pop('Mudar para o Grátis?',
    '<p>Você continua com as folhas já compradas. O que muda: 1 folha grátis por mês e a assinatura Polar Life sempre ligada.</p>',
    [{led:true,txt:'Continuar no plano atual',cb:function(){fecharDlg()}},
     {txt:'Mudar para o Grátis',cb:function(){C.rebaixarGratis();fecharDlg();toast('Plano mudado para o Grátis.');render()}}])
});
function depoisCompra(r){
  if(r&&r.ok&&r.comprou){toast('Compra concluída · Ambiente de teste');render()}
}

/* ---------- pop-up simples (padrões do app) ---------- */
var abridor=null;
function pop(titulo,html,acoes){
  abridor=document.activeElement;
  $('dlg-t').textContent=titulo;
  $('dlg-corpo').innerHTML=html;
  var a=$('dlg-act');a.innerHTML='';
  acoes.forEach(function(x){
    var b=document.createElement('button');
    b.type='button';
    b.className=x.led?'led-btn':'btn2 btn2--lg';
    if(x.led)b.innerHTML='<span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">'+esc(x.txt)+'</span>';
    else b.textContent=x.txt;
    b.addEventListener('click',x.cb);
    a.appendChild(b)
  });
  $('scrim').hidden=false;$('dialog').hidden=false;
  var f=a.querySelector('.led-btn')||a.querySelector('button');
  if(f)try{f.focus({preventScroll:true})}catch(e){}
}
function fecharDlg(){
  $('dialog').hidden=true;$('scrim').hidden=true;
  if(abridor&&abridor.focus)try{abridor.focus({preventScroll:true})}catch(e){}
}
$('scrim').addEventListener('click',fecharDlg);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('dialog').hidden)fecharDlg()});

if(C)render();
})();
