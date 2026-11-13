/* T-01 · projetos locais, sem envio de fotos (T5). */
(function(){var $=function(i){return document.getElementById(i)},selecionado='',tm;
function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}function tempo(t){var m=Math.max(0,Math.round((Date.now()-t)/60000));return m<1?'agora':m===1?'há 1 min':'há '+m+' min'}function toast(s){clearTimeout(tm);$('toast-t').textContent=s;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},4000)}
function render(a){var vazio=!a.length;$('lista').hidden=vazio;$('vazio').hidden=!vazio;document.title='PolarLife · Projetos';   /* D-177: sugestões e opções de criar ficam sempre no topo */if(vazio)return;var u=$('lista').querySelector('ul');u.innerHTML=a.map(function(p){return'<li class="card"><div class="card__row"><img class="avatar" data-capa="'+p.id+'" src="../assets/img/logos/Logo_favicon_PolarLife.png" width="54" height="48" alt=""><div class="card__txt"><h2 class="card__name"><a href="editor/" data-open="'+p.id+'">'+esc(p.nome)+'</a></h2><p class="card__meta">'+p.fotos+' '+(p.fotos===1?'foto':'fotos')+' · Salvo · '+tempo(p.atualizadoEm)+'</p></div><button type="button" class="more" data-more="'+p.id+'" aria-label="Mais ações: '+esc(p.nome)+'">•••</button></div><span class="chip rotulo">Salvo neste dispositivo</span><div class="menu led-menu" data-menu="'+p.id+'" role="menu" hidden><button type="button" data-act="abrir" data-id="'+p.id+'">Abrir</button><button type="button" data-act="renomear" data-id="'+p.id+'">Renomear</button><button type="button" data-act="duplicar" data-id="'+p.id+'">Duplicar</button><button type="button" data-act="backup" data-id="'+p.id+'">Salvar backup (.polarlife)</button><button type="button" data-act="excluir" data-id="'+p.id+'">Excluir projeto…</button></div></li>'}).join('')}
function renomearNoCartao(b,id){ /* edição no próprio cartão (sem prompt do navegador): Enter salva, Esc cancela */
  var card=b.closest('.card'),h=card.querySelector('.card__name'),a=h.querySelector('a'),antigo=a.textContent,inp=document.createElement('input'),feito=false;
  b.closest('[data-menu]').hidden=true;inp.type='text';inp.className='card__ren';inp.value=antigo;inp.maxLength=80;inp.setAttribute('aria-label','Nome do projeto');
  h.replaceChild(inp,a);inp.focus();inp.select();
  function fim(salvar){if(feito)return;feito=true;var n=inp.value.trim();if(salvar&&n&&n!==antigo)PLPROJETOS.renomear(id,n).then(function(){atualizar();toast('Projeto renomeado')});else atualizar()}
  inp.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();fim(true)}else if(ev.key==='Escape')fim(false)});
  inp.addEventListener('blur',function(){fim(true)})
}
function capas(){[].forEach.call(document.querySelectorAll('[data-capa]'),function(img){PLPROJETOS.capa(img.getAttribute('data-capa')).then(function(b){if(!b)return;img.src=URL.createObjectURL(b);img.classList.add('avatar--foto')})})}
function atualizar(){PLPROJETOS.listar().then(function(a){render(a);capas()})}function abrir(id){PLPROJETOS.abrir(id).then(function(p){var col=null;try{col=JSON.parse(sessionStorage.getItem('pl-colagem')||'null')}catch(e){}
  if(p&&!p.fotos&&!p.exemplo&&col&&col.ativo){try{if(!sessionStorage.getItem('pl-fotos'))sessionStorage.setItem('pl-fotos','[]')}catch(e){}location.href='editor/#colagem';return}   /* D-188: colagem vazia abre no modelo */
  location.href=p&&!p.fotos&&!p.exemplo?'adicionar-fotos/':'editor/'   /* D-158: projeto sem fotos continua em «Adicionar fotos» */},function(){atualizar();toast('Não foi possível abrir este projeto.')})}function baixar(o){var b=new Blob([JSON.stringify(o)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(o.projeto.nome||'projeto')+'.polarlife';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},0)}
$('lista').addEventListener('click',function(e){var b=e.target.closest('button,a');if(!b)return;if(b.dataset.more){var m=document.querySelector('[data-menu="'+b.dataset.more+'"]');m.hidden=!m.hidden;return}var id=b.dataset.id||b.dataset.open;if(!id)return;e.preventDefault(); /* o nome (data-open) também abre o projeto de verdade */if(b.dataset.act==='abrir'||b.dataset.open){abrir(id);return}if(b.dataset.act==='renomear'){renomearNoCartao(b,id);return}if(b.dataset.act==='duplicar'){PLPROJETOS.duplicar(id).then(atualizar);return}if(b.dataset.act==='backup'){PLPROJETOS.exportar(id).then(baixar);return}if(b.dataset.act==='excluir'){selecionado=id;$('scrim').hidden=false;$('dialog').hidden=false;$('dlg-cancel').focus()}});
function fechar(){$('scrim').hidden=true;$('dialog').hidden=true}$('dlg-cancel').onclick=fechar;$('scrim').onclick=fechar;$('dlg-del').onclick=function(){PLPROJETOS.excluir(selecionado).then(function(){fechar();atualizar();toast('Projeto excluído')})};$('novo1').onclick=function(){location.href='novo-projeto/'};
var input=document.createElement('input');input.type='file';input.accept='.polarlife,application/json';input.hidden=true;document.body.appendChild(input);$('backup').onclick=$('criar-backup').onclick=function(){input.click()};input.onchange=function(){var f=input.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{PLPROJETOS.importar(JSON.parse(r.result)).then(function(){atualizar();toast('Backup aberto como novo projeto')},function(){toast('Não foi possível abrir este backup.')})}catch(e){toast('Não foi possível abrir este backup.')}input.value=''};r.readAsText(f)};atualizar();
/* PWA (DOC-08 §7): instalar discreto (botão secundário, T8), dica do iPhone fechável e aviso de espaço */
document.addEventListener('DOMContentLoaded',function(){var P=window.PLPWA;if(!P)return;var bi=$('pwa-instalar'),dica=$('pwa-dica-ios'),barra=$('pwa-barra');
function mostrar(){bi.hidden=!P.podeInstalar();dica.hidden=!P.dicaIos();barra.hidden=bi.hidden&&dica.hidden}
bi.onclick=function(){P.instalar().then(mostrar)};$('pwa-dica-fechar').onclick=function(){P.fecharDica();mostrar()};
P.aoMudar(mostrar);mostrar();P.espaco().then(function(e){$('aviso-espaco').hidden=!(e&&e.cheio)})});
/* D-177: sugestões com foto real e «Colagem» criam o projeto já no formato/modo certo e seguem para escolher as fotos */
/* D-187: cada sugestão abre exatamente o modelo da imagem (tools/gerar-vitrine.mjs usa os mesmos formatos e layouts) */
var BRANCO={tipo:'cor',cor:'#FFFFFF',cor2:'#F8F9FA',ang:135,foto:null,px:50,py:50,suave:40};
var SUG={viagem:{nome:'Viagem com a turma',fmt:'classico'},cidade:{nome:'Rolê na cidade',fmt:'imini'},casal:{nome:'Nós dois',fmt:'pocket'},
  coracao:{nome:'Coração de verão',col:{layout:'coracao',orient:'paisagem',fundo:BRANCO}},varal:{nome:'Varal de memórias',col:{layout:'tira',orient:'paisagem',fundo:BRANCO}},
  mesa:{nome:'Mesa de recordações',col:{layout:'espalhadas',orient:'paisagem',fundo:{tipo:'foto'}}},
  /* D-198: mais formatos para imprimir e colagens em pé (9:16, 1080 × 1920) prontas para status e reels; a imagem não gasta folha */
  praia:{nome:'Dias de praia',fmt:'mini'},familia:{nome:'Família reunida',fmt:'iwide'},quadradas:{nome:'Quadradinhas',fmt:'isq'},
  'status-tira':{nome:'Tira para o status',col:{peca:'r916',layout:'cabine',margem:14,fundo:{tipo:'cor',cor:'#000000'}}},
  'status-varal':{nome:'Varal no stories',col:{peca:'r916',layout:'varal',margem:10,fundo:{tipo:'gradiente',cor:'#FFFFFF',cor2:'#F8F9FA',ang:180}}},
  'status-tempo':{nome:'Linha do tempo vertical',col:{peca:'r916',layout:'tempo',margem:10,fundo:BRANCO}},
  'status-capa':{nome:'Capa do status',col:{peca:'r916',layout:'capa',margem:10,fundo:{tipo:'cor',cor:'#F8F9FA'}}},
  'status-mural':{nome:'Mural do fim de semana',col:{peca:'r916',layout:'mural',margem:10,fundo:BRANCO}},
  'status-mesa':{nome:'Mesa no status',col:{peca:'r916',layout:'espalhadas',margem:8,fundo:{tipo:'foto',suave:45}}}};
function comecar(o){
  try{['pl-quadro','pl-fotos','pl-folhas','pl-orientacao','pl-fmt','pl-colagem','pl-prevoo','pl-exportar','pl-volta','pl-uma'].forEach(function(k){sessionStorage.removeItem(k)});
    if(o.fmt)sessionStorage.setItem('pl-fmt',o.fmt);
    if(o.col)sessionStorage.setItem('pl-colagem',JSON.stringify(Object.assign({ativo:true,fundo:{tipo:'foto'}},o.col)))}catch(e){}
  /* D-188: colagem começa pelo modelo (as molduras vazias na tela) e as fotos entram depois; polaroids seguem para escolher as fotos */
  var ir=o.col?function(){try{sessionStorage.setItem('pl-fotos','[]')}catch(e){}location.href='editor/#colagem'}:function(){location.href='adicionar-fotos/'};
  if(!window.PLPROJETOS){ir();return}
  PLPROJETOS.criar(o.nome).then(ir,ir)
}
$('sugs').addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-sug]');if(!b)return;var o=SUG[b.getAttribute('data-sug')];if(o)comecar(o)});
/* D-198: as sugestões passam sozinhas para o lado (um cartão a cada 3,5 s; no fim, volta ao começo). Param com o cursor em cima,
   com o foco dentro, enquanto o dedo está na faixa (voltam 4 s depois), fora da tela e com movimento reduzido; «Pausar» ao lado
   do título (WCAG 2.2.2). Deslizar com o dedo continua funcionando. */
(function(){
  var box=document.querySelector('.sugs'),ul=$('sugs'),bt=$('sugs-pausa');if(!box||!ul)return;
  var calmo=false;try{calmo=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
  var ligado=!calmo,parado=false,visivel=true,tm=null,volta=null;
  if(calmo&&bt)bt.hidden=true;
  function passo(){var a=ul.children[0],b=ul.children[1];return a&&b?b.getBoundingClientRect().left-a.getBoundingClientRect().left:0}
  function anda(){var max=box.scrollWidth-box.clientWidth;if(max<=4)return;var x=box.scrollLeft+passo();box.scrollTo({left:x>max-4?0:x,behavior:'smooth'})}
  function agenda(){clearTimeout(tm);tm=null;if(ligado&&!parado&&visivel&&!document.hidden)tm=setTimeout(function(){anda();agenda()},3500)}
  function suspende(s){parado=s;agenda()}
  box.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')suspende(true)});
  box.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')suspende(false)});
  box.addEventListener('focusin',function(){suspende(true)});
  box.addEventListener('focusout',function(){setTimeout(function(){if(!box.contains(document.activeElement))suspende(false)},0)});
  box.addEventListener('touchstart',function(){clearTimeout(volta);suspende(true)},{passive:true});
  box.addEventListener('touchend',function(){clearTimeout(volta);volta=setTimeout(function(){suspende(false)},4000)},{passive:true});
  document.addEventListener('visibilitychange',agenda);
  if(window.IntersectionObserver)new IntersectionObserver(function(es){visivel=es[0].isIntersecting;agenda()}).observe(box);
  if(bt)bt.addEventListener('click',function(){ligado=!ligado;bt.querySelector('span').textContent=ligado?'Pausar':'Retomar';bt.setAttribute('aria-label',ligado?'Pausar a passagem das sugestões':'Retomar a passagem das sugestões');bt.querySelector('svg').innerHTML=ligado?'<path d="M9 6v12M15 6v12"/>':'<path d="M8 5l11 7-11 7z"/>';agenda()});
  window.PLSUGS={passar:anda,ligado:function(){return ligado&&!parado&&visivel}};   /* para os testes */
  agenda();
})();
$('criar-colagem').onclick=function(){comecar({nome:'Colagem de '+new Date().toLocaleDateString('pt-BR'),col:{layout:'espalhadas'}})};
})();
