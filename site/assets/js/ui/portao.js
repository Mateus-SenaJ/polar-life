/* PLPORTAO · T-26 portão de direito de uso (DOC-03 §4, brief §3.5–3.6).
   pedir(nFolhas, classe): chamado pelo LED de gerar da T-19. Resolve:
   {ok:true, usaGratis} | {ok:true, comprou} | {ok:false, motivo}.
   pagamento(qtd, classe, pro, cb): etapa de pagamento compartilhada com a página
   /app/conta/planos/ (brief §3.6/§3.7). Compra simulada; créditos só entram após
   «confirmado» (DOC-03 §8a). BR-10: quem consome é o gerar.js ao concluir, nunca aqui. */
(function(){
'use strict';
var PLPORTAO,PEND=null; /* PEND: {nFolhas, classe, resolve} no portão; {externo, cb} na página */

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ico(n){return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+n+'</svg>'}
var I={info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  rel:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  ok:'<path d="M5 12.5l4.5 4.5L19 7.5"/>'};

function dlg(){
  var d=document.querySelector('.plportao');
  if(d)return d;
  var s=document.createElement('div');
  s.className='plportao__scrim';
  s.addEventListener('click',function(){fechar({ok:false,motivo:'cancelado'})});
  document.body.appendChild(s);
  d=document.createElement('div');
  d.className='plportao led-dialog led-box led-box--3';
  d.setAttribute('role','dialog');
  d.setAttribute('aria-modal','true');
  d.setAttribute('aria-labelledby','pp-t');
  document.body.appendChild(d);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&d&&!d.hidden)fechar({ok:false,motivo:'cancelado'})});
  return d
}
function abrir(){
  var d=dlg();d.hidden=false;
  var s=document.querySelector('.plportao__scrim');if(s)s.hidden=false;
  return d
}
function fechar(resultado){
  var d=dlg();if(!d||d.hidden)return;
  d.hidden=true;
  var s=document.querySelector('.plportao__scrim');if(s)s.hidden=true;
  if(PEND){
    if(PEND.externo&&PEND.cb)PEND.cb(resultado);
    else if(PEND.resolve)PEND.resolve(resultado);
    PEND=null
  }
}
function titulo(t){var d=dlg();
  d.innerHTML='<h2 class="led-dialog__title" id="pp-t">'+esc(t)+'</h2><div class="pp-corpo"></div><div class="led-dialog__actions pp-act"></div>';
  return d}
function corpo(html){dlg().querySelector('.pp-corpo').innerHTML=html}
function acoes(lista){ /* [{led, txt, ic, cb, cls, terc}] */
  var d=dlg(),a=d.querySelector('.pp-act');a.innerHTML='';
  for(var i=0;i<lista.length;i++){
    var x=lista[i],b=document.createElement('button');
    b.type='button';
    b.className=x.led?'led-btn':'btn2 btn2--lg'+(x.cls?' '+x.cls:'');
    if(x.led)b.innerHTML='<span class="smoke-layer" aria-hidden="true"></span><span class="btn-content">'+(x.ic||'')+esc(x.txt)+'</span>';
    else b.innerHTML=(x.ic||'')+esc(x.txt);
    b.addEventListener('click',x.cb);
    a.appendChild(b)
  }
  var f=a.querySelector('.led-btn')||a.querySelector('button');
  if(f)try{f.focus({preventScroll:true})}catch(e){f.focus()}
}
function raizApp(){var g=window.PLGUARDA;return g&&g.raiz?g.raiz():null}

/* ---------- portão: pedir ---------- */
function pedir(nFolhas,classe,chave){
  return new Promise(function(res){
    var C=window.PLCONTA;
    if(!C){res({ok:false,motivo:'semConta'});return}
    var g=C.direito(nFolhas,classe,chave);   /* chave do projeto: a mesma folha em 24 h passa sem pedir outra (DOC-03 §3) */
    if(g.ok){res({ok:true,usaGratis:!!g.usaGratis,codigo:!!g.codigo,jaContado:!!g.jaContado});return} /* linha na T-19, sem pop-up */
    PEND={nFolhas:nFolhas,classe:classe||'padrao',resolve:res};
    abrir();
    if(g.motivo==='semConta')semConta();
    else semFolhas(g)
  })
}
function semConta(){
  titulo('Entrar para gerar o arquivo');
  corpo('<p>Editar e ver o preview são sempre livres. Para gerar as folhas, entre com sua conta.</p>');
  acoes([
    {led:true,txt:'Entrar',cb:function(){ /* → T-25 com ?voltar (D-123) */
      var r=raizApp(),pg=r?r+'editor/exportar/':'';
      fechar({ok:false,motivo:'semConta'});
      location.href=r?r+'entrar/?voltar='+encodeURIComponent(pg):'entrar/'
    }},
    {txt:'Voltar',cb:function(){fechar({ok:false,motivo:'cancelado'})}}
  ])
}
function semFolhas(g){
  var C=window.PLCONTA,pl=C.plano()||{},n=PEND.nFolhas,faltam=g.faltam||n;
  if(pl.id==='gratis'){
    /* D-163: o título só diz que a folha grátis foi usada quando ela foi; senão, diz quantas faltam (T7) */
    var usou=(pl.usadasMes||0)>0||faltam>=n,qt=usou?n:faltam,gm=pl.folhasMes===undefined?1:pl.folhasMes;
    titulo(usou?'Sua folha grátis foi usada':'Este arquivo tem '+n+' folhas');
    corpo(usou?'<p>Este arquivo tem '+n+' folhas. Compre as folhas de que precisa ou assine o Pro.</p>'
      :'<p>O plano Grátis inclui '+gm+(gm===1?' folha':' folhas')+' por mês. Compre '+(qt===1?'a folha que falta':'as '+qt+' que faltam')+' ou assine o Pro.</p>');
    acoes([
      {led:true,txt:'Comprar '+qt+(qt===1?' folha':' folhas'),cb:function(){pagamento(qt,false)}},
      {txt:'Assinar o Pro',cls:'pp-pro',cb:function(){pagamento(0,true)}},
      {txt:'Voltar',cls:'pp-terc',cb:function(){fechar({ok:false,motivo:'semFolhas'})}}
    ])
  }else if(pl.codigo){
    titulo(g.codigoUsado?'Seu código já foi usado':'O código não cobre este arquivo');   /* D-163 */
    corpo(g.codigoUsado?'<p>Para gerar este arquivo, use outro código de impressão ou entre com sua conta.</p>'
      :'<p>Este arquivo tem '+n+' folhas e o seu código vale para '+(n-faltam)+'. Tire algumas fotos do projeto, use outro código ou entre com sua conta.</p>');
    acoes([
      {led:true,txt:'Entrar com outro código',cb:function(){
        var r=raizApp();fechar({ok:false,motivo:'semFolhas'});
        location.href=r?r+'entrar/':'entrar/'
      }},
      {txt:'Voltar',cb:function(){fechar({ok:false,motivo:'semFolhas'})}}
    ])
  }else{
    titulo('Faltam '+faltam+' folhas');
    corpo('<p>Você tem '+(n-faltam)+' folhas e este arquivo precisa de '+n+'.</p>');
    acoes([
      {led:true,txt:'Comprar '+faltam+' folhas',cb:function(){pagamento(faltam,false)}},
      {txt:'Assinar o Pro',cls:'pp-pro',cb:function(){pagamento(0,true)}},
      {txt:'Voltar',cls:'pp-terc',cb:function(){fechar({ok:false,motivo:'semFolhas'})}}
    ])
  }
}

/* ---------- etapa de pagamento (simulada; brief §3.6) ---------- */
function pagamento(qtd,pro){
  var C=window.PLCONTA,L=C.limites().planos;
  var classe=PEND?PEND.classe:'padrao';
  var valor=pro?(L.pro.precoMes!==undefined?L.pro.precoMes:14.9):qtd*(classe==='grande'?L.avulsa.precoGrande:L.avulsa.precoPadrao);
  var desc=pro?'Assinatura Pro · 1 mês':qtd+' folha'+(qtd>1?'s':'')+' '+(classe==='grande'?'grandes':'padrão');
  PEND.pg={qtd:qtd,pro:!!pro,desc:desc,valor:valor,classe:classe};
  titulo(pro?'Assinar o Pro':'Comprar '+qtd+' folha'+(qtd>1?'s':''));
  corpo(
    '<fieldset class="pp-pg"><legend class="pp-pg__t">Como pagar</legend>'+
    '<label class="pp-pg__o"><input type="radio" name="pp-pg" value="cartao" checked><span>Cartão</span></label>'+
    '<label class="pp-pg__o"><input type="radio" name="pp-pg" value="pix"><span>Pix</span></label>'+
    '<label class="pp-pg__o"><input type="radio" name="pp-pg" value="boleto"><span>Boleto</span></label>'+
    '</fieldset>'+
    '<div class="pp-sim">'+ico(I.info)+'<p><strong>Demonstração:</strong> nenhum dado de pagamento é pedido e nada é cobrado. Escolha abaixo o que simular.</p></div>'+
    '<div class="pp-sim-b"><button type="button" class="btn2 btn2--lg pp-sim__b" data-m="aprovado">Simular pagamento aprovado</button>'+
    '<button type="button" class="btn2 btn2--lg pp-sim__b" data-m="pendente">Simular Pix pendente</button>'+
    '<button type="button" class="btn2 btn2--lg pp-sim__b" data-m="recusado">Simular pagamento recusado</button></div>');
  var sim=null;
  [].forEach.call(dlg().querySelectorAll('.pp-sim__b'),function(b){
    b.addEventListener('click',function(){
      sim=this.getAttribute('data-m');
      [].forEach.call(dlg().querySelectorAll('.pp-sim__b'),function(x){x.classList.remove('is-on')});
      this.classList.add('is-on');
      var led_=dlg().querySelector('.pp-act .led-btn');
      if(led_)led_.disabled=false
    })
  });
  acoes([
    {led:true,txt:'Pagar '+C.moeda(valor)+' (teste)',cb:function(){
      if(!sim)return; /* tracejado até escolher a simulação (brief §3.6) */
      if(pro)C.assinarPro(sim).then(depois);
      else C.comprar(qtd,classe,sim).then(depois)
    }},
    {txt:'Voltar',cb:function(){fechar({ok:false,motivo:'cancelado'})}}
  ]);
  var led_=dlg().querySelector('.pp-act .led-btn');
  if(led_)led_.disabled=true;
  var r0=dlg().querySelector('.pp-pg__o input');
  if(r0)try{r0.focus({preventScroll:true})}catch(e){}
}
function depois(r){
  var C=window.PLCONTA,pg=PEND&&PEND.pg?PEND.pg:{qtd:1,pro:false,desc:'folhas',valor:0};
  if(r.estado==='confirmado'){
    titulo('Pagamento confirmado');
    corpo('<div class="pp-sucesso">'+ico(I.ok)+'<p>Pagamento confirmado · '+esc(pg.desc)+' na conta</p></div>');
    acoes([
      {led:true,txt:'Continuar',cb:function(){fechar({ok:true,comprou:true})}}
    ])
  }else if(r.estado==='pendente'){
    titulo('Aguardando pagamento');
    corpo('<div class="pp-sim">'+ico(I.rel)+'<p>Aguardando pagamento. Seu projeto está salvo; você pode voltar depois.</p></div>'+
      '<p class="pp-pix mono">código Pix de demonstração · 00000000-0000-0000-0000-000000000000</p>');
    acoes([
      {txt:'Simular confirmação',cb:function(){
        if(pg.pro)C.assinarPro('aprovado').then(depois);
        else C.comprar(pg.qtd,pg.classe||'padrao','aprovado').then(depois)
      }},
      {txt:'Voltar ao projeto',cls:'pp-terc',cb:function(){fechar({ok:false,motivo:'pendente'})}}
    ])
  }else{
    titulo('Pagamento não aprovado');
    corpo('<div class="pp-erro">'+ico(I.x)+'<p>O pagamento não foi aprovado.</p></div>');
    acoes([
      {txt:'Tentar de novo',cb:function(){pagamento(pg.qtd,pg.pro)}},
      {txt:'Voltar ao projeto',cls:'pp-terc',cb:function(){fechar({ok:false,motivo:'recusado'})}}
    ])
  }
}

/* ---------- API pública ---------- */
PLPORTAO={
  pedir:pedir,
  /* página /app/conta/planos/: abre a etapa de pagamento direto (brief §3.7) */
  pagamento:function(qtd,classe,pro,cb){
    PEND={nFolhas:qtd,classe:classe||'padrao',externo:true,cb:cb||function(){}};
    abrir();
    pagamento(qtd,!!pro)
  },
  aberto:function(){var d=dlg();return !!(d&&!d.hidden)},
  fechar:fechar
};
window.PLPORTAO=PLPORTAO;
})();
