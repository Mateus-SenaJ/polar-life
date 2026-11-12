/* T-03 · adicionar-fotos · comportamento da página */
(function(){
var $=function(i){return document.getElementById(i)};
var tm,picked=[],salvando=Promise.resolve();
/* 44: com um projeto aberto, as fotos já escolhidas ficam e as novas recebem ids depois do maior */
var JA=(function(){try{var a=JSON.parse(sessionStorage.getItem('pl-fotos')||'null');return Array.isArray(a)&&window.PLPROJETOS&&PLPROJETOS.atual()?a:[]}catch(e){return []}})();
var PROJ0=window.PLPROJETOS?PLPROJETOS.atual():'';
var MAXJA=JA.reduce(function(m,x){return Math.max(m,+x||0)},0);
/* D-188: veio da Colagem (modelo primeiro, fotos depois): ao continuar, volta direto para ela, com as fotos novas na colagem */
var VOLTA=(function(){try{var c=JSON.parse(sessionStorage.getItem('pl-colagem')||'null');return sessionStorage.getItem('pl-volta')==='colagem'&&c&&c.ativo}catch(e){return false}})();
function juntarColagem(){try{var c=JSON.parse(sessionStorage.getItem('pl-colagem')||'null');if(c&&Array.isArray(c.fotos)){for(var i=1;i<=picked.length;i++)if(c.fotos.indexOf(MAXJA+i)<0)c.fotos.push(MAXJA+i);sessionStorage.setItem('pl-colagem',JSON.stringify(c))}}catch(e){}}
if(VOLTA){var vl=document.querySelector('.app-header a.btn2');if(vl)vl.href='../editor/#colagem';var hp=document.querySelector('.head p');if(hp)hp.textContent='As fotos escolhidas vão direto para a sua colagem. Elas continuam no seu aparelho.'}
function toast(m){clearTimeout(tm);$('toast-t').textContent=m;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},Math.max(4000,m.length*60))}   /* aviso longo fica mais tempo para ler */

/* D-181: «Outros lugares» saiu; toda forma nova de trazer fotos entra na caixa «Escolha suas fotos» (aparelho, câmera, Google Fotos). */
/* D-132: a leitura detalhada é delegada a PLIMPORTAR; aqui só aceita a escolha. */
var EXT=/\.(jpe?g|png|webp|avif|heic|heif|tif?f|dng|cr2|cr3|nef|arw|raf|orf|rw2|zip)$/i,MIME=/^image\/(jpeg|png|webp|avif|heic|heif|tiff)$/i;
function accepted(f){return EXT.test(f.name)||MIME.test(f.type)}
function plural(n,s,p){return n+' '+(n===1?s:p)}
function limiteFotos(){ /* D-027: o teto de fotos vem do plano, nunca copiado em código de tela */
  var P=window.PLCONTA&&PLCONTA.plano?PLCONTA.plano():null;
  return P&&P.fotosPorProjeto?P.fotosPorProjeto:24
}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function receive(list){
  if(window.PLIMPORTAR&&!(list&&list.__plExpandido)){ /* D-132: .zip e RAW viram fotos; cada arquivo com problema sai sozinho, com aviso */
    PLIMPORTAR.expandir([].slice.call(list||[])).then(function(r){
      if(r.erros.length)toast(r.erros.length===1?r.erros[0]:r.erros.length+' arquivos ficaram de fora. '+r.erros[0]);
      var a=r.arquivos;a.__plExpandido=true;if(a.length)receive(a)});
    return}
  var all=[].slice.call(list||[]);if(!all.length)return;
  var ok=all.filter(accepted),bad=all.filter(function(f){return !accepted(f)}).map(function(f){return f.name});
  var max=limiteFotos(),cabem=Math.max(0,max-JA.length-picked.length),extra=ok.length-cabem;
  if(extra>0)ok=ok.slice(0,cabem); /* acima do plano: as primeiras entram, o resto avisa (DOC-03 §7) */
  var fresh=picked.length===0&&ok.length>0&&!JA.length; /* 44: primeira escolha de um projeto vazio (num projeto aberto, acrescenta) */
  picked=picked.concat(ok);
  /* Arquivos escolhidos seguem direto para o IndexedDB deste aparelho (DOC-08 §5, T5).
     44: uma seleção nova limpa as fotos do envio anterior antes de gravar — senão fotos
     antigas por posição se misturam com as novas (bug «sempre aparecem 24 fotos»). */
  if(window.PLFOTOS)salvando=salvando
    .then(function(){return window.PLPROJETOS&&!PLPROJETOS.atual()?PLPROJETOS.criar('Projeto de '+new Date().toLocaleDateString('pt-BR')):null})
    .then(function(){return fresh?PLFOTOS.limpar():null})
    .then(function(){return Promise.all(ok.map(function(f,i){var n=MAXJA+picked.length-ok.length+i+1;return PLFOTOS.salvar(n,f,window.PLPROJETOS?PLPROJETOS.atual():'')   /* uma leitura grava a foto aberta e a cópia do projeto */}))})
    .catch(function(){toast('Não foi possível preparar uma foto neste navegador.')});
  render(bad,extra);
}
function render(bad,extra){
  var g=$('got'),h='';
  if(picked.length){
    h+='<div class="msg msg--ok"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg><p><strong>'+plural(picked.length,'foto escolhida','fotos escolhidas')+'.</strong> Elas continuam no seu aparelho.</p></div>';
  }
  if(extra>0){ /* D-027 · DOC-03 §7: «Escolher quais manter» ou ver planos */
    var P=window.PLCONTA&&PLCONTA.plano?PLCONTA.plano():null,nome=P&&P.nome?P.nome:'plano';
    h+='<div class="msg msg--warn" role="alert"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg><p><strong>'+plural(extra,'foto a mais','fotos a mais')+'.</strong> '+(P&&P.codigo?'O código de impressão vale até '+limiteFotos()+' fotos por projeto.':'O plano '+esc(nome)+' leva até '+limiteFotos()+' fotos por projeto. Escolha quais manter, ou <a class="link" href="../conta/planos/">veja os planos</a>.')+'</p></div>';
  }
  if(bad&&bad.length){
    var um=bad.length===1,nm=bad[0].replace(/[<>&"]/g,'');
    h+='<div class="msg msg--err" role="alert"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg><p><strong>'+(um?'Este arquivo não é uma foto':plural(bad.length,'arquivo não é uma foto','arquivos não são fotos'))+'.</strong> '+(um?'«'+nm+'» não pôde ser usado. ':'')+'Escolha uma foto, RAW com prévia JPEG ou uma pasta ZIP.</p></div>';
  }
  g.innerHTML=h;g.hidden=!h;
  var led=$('btn-device'),t=$('btn-device-t');
  if(picked.length){
    led.id='btn-device';
    t.innerHTML='Continuar com '+plural(picked.length,'foto','fotos')+'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    $('btn-camera').innerHTML='<svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Escolher mais fotos';
    $('btn-camera').dataset.mode='more';
    if(!$('btn-clear')){var c=document.createElement('button');c.type='button';c.className='link';c.id='btn-clear';c.textContent='Limpar escolha';$('drop').appendChild(c);c.onclick=function(){picked=[];if(window.PLFOTOS)salvando=PLFOTOS.limpar();$('btn-clear').remove();$('btn-camera').innerHTML='<svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>Usar a câmera';delete $('btn-camera').dataset.mode;render(0);$('btn-device').focus()}}
  }else{
    t.innerHTML='Escolher do aparelho<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  }
}
/* 44: a lista real de fotos escolhidas (ids = posições gravadas no IndexedDB) vira a
   fonte da verdade; o estado de folhas/quadro antigo é descartado para não carregar 24. */
function firmarSelecao(){
  var novos=[];for(var i=1;i<=picked.length;i++)novos.push(MAXJA+i);
  try{
    if(JA.length){ /* projeto aberto: as fotos novas entram no fim; quadro, folhas e ajustes ficam */
      sessionStorage.setItem('pl-fotos',JSON.stringify(JA.concat(novos)));
      var q=JSON.parse(sessionStorage.getItem('pl-quadro')||'null');
      if(Array.isArray(q)&&q.length===JA.length+1){novos.forEach(function(sr){q.push({src:sr,modo:'preencher',z:100,ang:0,px:0,py:0,rot:0,flip:false,adj:{brilho:0,contraste:0,saturacao:0,temp:0,realces:0,sombras:0,nitidez:0,vinheta:0},txt:null,flt:{id:'original',int:100}})});sessionStorage.setItem('pl-quadro',JSON.stringify(q))}
      else sessionStorage.removeItem('pl-quadro');
      ['pl-prevoo','pl-exportar'].forEach(function(k){sessionStorage.removeItem(k)});
    }else{
      sessionStorage.setItem('pl-fotos',JSON.stringify(novos));
      ['pl-quadro','pl-prevoo','pl-exportar'].forEach(function(k){sessionStorage.removeItem(k)});
      if(!PROJ0)sessionStorage.removeItem('pl-folhas');   /* D-159: projeto vindo de «Novo projeto» mantém o papel escolhido lá */
    }
  }catch(e){}
}
$('btn-device').addEventListener('click',function(){
  if(picked.length){firmarSelecao();if(VOLTA)juntarColagem();salvando.then(function(){return window.PLSESSAO?PLSESSAO.salvarJa():null}).catch(function(){}).then(function(){try{sessionStorage.removeItem('pl-volta')}catch(e){}location.href=VOLTA?'../editor/#colagem':'../processando/'});return}   /* 44: grava o projeto antes de sair · D-188: da Colagem, volta direto para ela */
  $('f-device').click();
});
$('btn-camera').addEventListener('click',function(){
  if(this.dataset.mode==='more')$('f-device').click();else $('f-camera').click();
});
$('f-device').addEventListener('change',function(){receive(this.files);this.value=''});
$('f-camera').addEventListener('change',function(){receive(this.files);this.value=''});

/* arrastar e colar */
var depth=0,drop=$('drop');
['dragenter','dragover'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();if(ev==='dragenter')depth++;drop.classList.add('drop--over')})});
drop.addEventListener('dragleave',function(){depth=Math.max(0,depth-1);if(!depth)drop.classList.remove('drop--over')});
drop.addEventListener('drop',function(e){e.preventDefault();depth=0;drop.classList.remove('drop--over');if(e.dataTransfer)receive(e.dataTransfer.files)});
window.addEventListener('dragover',function(e){e.preventDefault()});window.addEventListener('drop',function(e){e.preventDefault()});
document.addEventListener('paste',function(e){var fs=e.clipboardData&&e.clipboardData.files;if(fs&&fs.length)receive(fs)});

/* D-168: Google Fotos pelo seletor oficial. Sem acesso nesta aba → pede a permissão (volta aqui com #google-fotos);
   com acesso → abre o seletor do Google numa janela e as fotos escolhidas entram como as do aparelho. */
(function(){
  var b=$('btn-gfotos');if(!b)return;
  if(!(window.PLGOOGLE&&PLGOOGLE.ativo()&&window.PLGFOTOS&&window.fetch)){b.hidden=true;var hc=document.querySelector(".pick__con");if(hc)hc.hidden=true;return}   /* sem Google, sem a ajuda do Google */
  var ocupado=false;
  function rotulo(t){b.lastChild.nodeValue=t}
  b.addEventListener('click',function(){
    if(ocupado)return;
    if(!PLGFOTOS.conectado()){toast('Abrindo o Google para você escolher as fotos…');PLGOOGLE.iniciarFotos(location.pathname);return}
    var j=null;try{j=window.open('about:blank','pl-google-fotos','width=980,height=760')}catch(e){}
    ocupado=true;b.setAttribute('aria-busy','true');rotulo('Escolha as fotos na janela do Google…');
    PLGFOTOS.escolher(j,function(fase,n,t){if(fase==='baixando')rotulo('Trazendo as fotos…');if(fase==='progresso')rotulo('Trazendo '+n+' de '+t+'…')})
      .then(function(fs){
        if(fs.length)receive(fs);
        toast(fs.length?(fs.length===1?'1 foto do Google Fotos':fs.length+' fotos do Google Fotos')+(fs.falhas?' · '+fs.falhas+' não vieram':'')+(fs.videos?' · vídeos ficam de fora':'')+'. O Google não envia o local das fotos: digite a cidade nas Legendas.':'Nenhuma foto escolhida.')   /* D-178: o «=d» do Google tira a localização do EXIF */
      },function(e){
        var m={acesso:'O acesso ao Google Fotos expirou. Toque de novo para permitir.',tempo:'O tempo para escolher acabou. Tente de novo.'}[e&&e.erro]||'Não foi possível trazer as fotos do Google agora.';
        toast(m)
      }).then(function(){ocupado=false;b.removeAttribute('aria-busy');rotulo('Do Google Fotos')})
  });
  var h=location.hash;
  if(/^#google-fotos/.test(h)){
    try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
    if(h==='#google-fotos'&&PLGFOTOS.conectado()){toast('Google Fotos conectado. Toque em «Do Google Fotos» para escolher.');b.focus()}
    else toast(h==='#google-fotos-cancelado'?'Você não permitiu o acesso ao Google Fotos.':'Não foi possível conectar ao Google Fotos.')
  }
})();
window.addEventListener('hashchange',function(){location.reload()});
})();
