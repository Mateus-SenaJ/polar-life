/* T-03 · adicionar-fotos · comportamento da página */
(function(){
var $=function(i){return document.getElementById(i)};
var tm,opener,picked=[],salvando=Promise.resolve();
/* 44: com um projeto aberto, as fotos já escolhidas ficam e as novas recebem ids depois do maior */
var JA=(function(){try{var a=JSON.parse(sessionStorage.getItem('pl-fotos')||'null');return Array.isArray(a)&&window.PLPROJETOS&&PLPROJETOS.atual()?a:[]}catch(e){return []}})();
var PROJ0=window.PLPROJETOS?PLPROJETOS.atual():'';
var MAXJA=JA.reduce(function(m,x){return Math.max(m,+x||0)},0);
function toast(m){clearTimeout(tm);$('toast-t').textContent=m;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},4000)}

/* ===== Selos de estado: ícone + texto, nunca só cor (CN-05, DS-06) ===== */
var I={
 ok:'<svg class="ico okc" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
 clock:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
 info:'<svg class="ico okc" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/></svg>',
 warn:'<svg class="ico warn" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>',
 err:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};
var STATES={
 disponivel:{i:'ok',t:'Pronto para usar',a:[['Escolher fotos','secondary','pick']]},
 conectado:{i:'ok',t:'Conectado',a:[['Testar conexão','secondary','na'],['Desconectar','link','na']]},
 verificando:{i:'clock',t:'Verificando…',bar:1,a:[['Cancelar','secondary','na']]},
 reautorizar:{i:'warn',t:'Precisa entrar de novo',a:[['Reautorizar','secondary','na']]},
 embreve:{i:'clock',t:'Em breve',a:[],planb:1},
 indisponivel:{i:'info',t:'Esta plataforma não permite importar por aqui',a:[['Ver como fazer','secondary','howto']],planb:1},
 erro:{i:'err',t:'Não foi possível verificar agora',a:[['Tentar de novo','secondary','na']],planb:1}
};
var ICONS={
 phone:'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
 pics:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="1.5"/><path d="M21 16l-5-5-8 8"/>',
 share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
 cloud:'<path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9.5a4.25 4.25 0 0 1 0 8.5z"/>'
};
var state=(location.hash.match(/^#estado-(\w+)$/)||[])[1];
if(!STATES[state])state='embreve';
var SERVICES=[
 {id:'apple',name:'Galeria do iPhone ou iPad',icon:'phone',state:'disponivel',help:'No iPhone, escolha Biblioteca de Fotos no seletor. As fotos do iCloud que já aparecem na galeria funcionam.'},
 {id:'google',name:'Google Fotos',icon:'pics',state:state,help:'Você escolhe as fotos no Google. O Polar Life só recebe as selecionadas.'},
 {id:'insta',name:'Instagram e Facebook',icon:'share',state:'indisponivel',help:'O Instagram não permite importar por aqui. Salve a foto no aparelho e escolha Do aparelho.'},
 {id:'drive',name:'Drive, Dropbox e OneDrive',icon:'cloud',state:'embreve',help:'Escolha as fotos no lugar onde elas estão guardadas.'}
];
function card(s){
  var st=STATES[s.state];
  var h='<article class="svc" aria-labelledby="n-'+s.id+'"><div class="svc__top"><span class="svc__ico"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+ICONS[s.icon]+'</svg></span><h3 id="n-'+s.id+'">'+s.name+'</h3></div>';
  h+='<span class="stt">'+I[st.i]+st.t+'</span>';
  if(st.bar)h+='<div class="led-progress led-progress--thin" role="progressbar" aria-label="Verificando"><span class="led-progress__glow"></span><span class="led-progress__track"><span class="led-progress__fill"></span></span></div>';
  h+='<p>'+s.help+'</p><div class="svc__act">';
  st.a.forEach(function(a){
    h+='<button type="button" class="'+(a[1]==='link'?'link':'btn2')+'" data-act="'+a[2]+'" data-svc="'+s.id+'">'+a[0]+'</button>';
  });
  if(st.planb)h+='<button type="button" class="link" data-act="pick">Escolher do aparelho</button>'; /* CN-08: plano B sempre visível */
  return h+'</div></article>';
}
$('grid').innerHTML=SERVICES.map(card).join('');
$('grid').addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;
  var a=b.dataset.act;
  if(a==='pick'){$('f-device').click()}
  else if(a==='howto'){opener=b;$('scrim').hidden=false;$('dialog').hidden=false;$('dlg-close').focus()}
  else toast('Ainda não está disponível.');
});

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
  if(picked.length){firmarSelecao();salvando.then(function(){return window.PLSESSAO?PLSESSAO.salvarJa():null}).catch(function(){}).then(function(){location.href='../processando/'});return}   /* 44: grava o projeto antes de sair */
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

/* ===== Folha «Ver como fazer» (LED nível 3) ===== */
function closeDlg(){$('scrim').hidden=true;$('dialog').hidden=true;if(opener)opener.focus()}
$('dlg-close').onclick=closeDlg;$('scrim').onclick=closeDlg;
$('dlg-pick').onclick=function(){closeDlg();$('f-device').click()};
document.addEventListener('keydown',function(e){
  if($('dialog').hidden)return;
  if(e.key==='Escape')closeDlg();
  if(e.key==='Tab'){var a=$('dlg-close'),z=$('dlg-pick');
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
});
window.addEventListener('hashchange',function(){location.reload()});
})();
