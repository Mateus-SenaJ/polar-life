/* T-23 Central de conexões · T-24 Verificação (DOC-07 §3 e §5). O teste NÃO lê, baixa nem envia fotos (CN-06).
   Instagram e Facebook nunca aparecem como «Conectado» nem com «Importar» (CN-03). Sempre há «Escolher do aparelho» (CN-08).
   Estados de revisão por hash: #estado-verificando · #estado-erro */
(function(){
var $=function(i){return document.getElementById(i)},foco=null,cancelado=false,tms=[];
var IC={ok:'<path d="M5 12l5 5 9-10"/>',relogio:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',falha:'<path d="M6 6l12 12M18 6L6 18"/>',atencao:'<path d="M12 4l9 16H3zM12 10v4M12 17h.01"/>',
 aparelho:'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',nuvem:'<path d="M7 18a4 4 0 010-8 5 5 0 019.5 1A3.5 3.5 0 0116.5 18z"/>',share:'<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v7h14v-7"/>',rede:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 11l7.6-4M8.2 13l7.6 4"/>'};
function svg(k,c){return '<svg class="ico'+(c?' '+c:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+IC[k]+'</svg>'}
var EST={disp:['ok','Pronto para usar'],ind:['info','Esta plataforma não permite importar por aqui'],erro:['falha','Não foi possível verificar agora']};
var https=location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1';
var temShare=typeof navigator.canShare==='function';
var estado=(location.hash.match(/^#estado-([\w-]+)$/)||[])[1];
var S=[
 {id:'aparelho',sec:'trazer',n:'Do aparelho',ic:'aparelho',e:'disp',a:'Escolha fotos da galeria ou de uma pasta. Aceita HEIC.',t:'dev'},
 {id:'camera',sec:'trazer',n:'Câmera',ic:'camera',e:'disp',a:'No celular, tire a foto na hora.'},
 {id:'apple',sec:'trazer',n:'Apple Fotos (iPhone e iPad)',ic:'aparelho',e:'disp',a:'No iPhone, escolha Biblioteca de Fotos no seletor. As fotos do iCloud que já aparecem na galeria funcionam.',t:'dev'},
 {id:'icloud',sec:'trazer',n:'iCloud Fotos (web)',ic:'nuvem',e:'ind',a:'Não há acesso por aqui. No iPhone ou iPad, toque em Do aparelho e escolha Biblioteca de Fotos.',g:'apple'},
 {id:'google',sec:'trazer',n:'Google Fotos',ic:'nuvem',e:'disp',a:'Você escolhe as fotos numa janela do próprio Google. Só as escolhidas vêm para este aparelho.'},
 {id:'compartilhar',sec:'levar',n:'Compartilhar o arquivo',ic:'share',e:'disp',a:temShare?'Envie pelo menu do aparelho.':'Neste navegador o arquivo é baixado e você escolhe o aplicativo.',t:'saida'},
 {id:'instagram',sec:'levar',n:'Instagram',ic:'rede',e:'ind',a:'O Instagram não permite importar por aqui. Salve a foto no aparelho e escolha Do aparelho. Para enviar, use Compartilhar ou baixe a imagem.',t:'rede',g:'rede'},
 {id:'facebook',sec:'levar',n:'Facebook',ic:'rede',e:'ind',a:'O Facebook não permite importar por aqui. Salve a foto no aparelho e escolha Do aparelho. Para enviar, use Compartilhar ou baixe a imagem.',t:'rede',g:'rede'}
];
if(estado==='erro')porId('compartilhar').e='erro';
function porId(i){return S.filter(function(s){return s.id===i})[0]}
function card(s){var e=EST[s.e];
 var acoes=s.e==='disp'?(s.id==='compartilhar'?'':'<a class="btn2" href="../adicionar-fotos/">Escolher fotos</a>'):s.e==='erro'?'':s.g?'<button type="button" class="btn2" data-g="'+s.g+'">Ver como fazer</button>':'<a class="btn2" href="../adicionar-fotos/">Escolher do aparelho</a>';
 if(s.t)acoes+='<button type="button" class="btn2" data-t="'+s.id+'">'+(s.e==='erro'?'Tentar de novo':'Testar conexão')+'</button>';
 return '<article class="cx" aria-labelledby="n-'+s.id+'"><div class="cx__top">'+svg(s.ic)+'<span class="cx__nome" id="n-'+s.id+'">'+s.n+'</span></div><span class="sel'+(s.e==='erro'?' sel--erro':'')+'">'+svg(e[0])+e[1]+'</span><p class="cx__ajuda">'+s.a+'</p><div class="cx__acoes">'+acoes+'</div></article>'}
['trazer','levar'].forEach(function(k){$(k).innerHTML=S.filter(function(s){return s.sec===k}).map(card).join('')});

/* diálogo (foco preso, Esc fecha) */
function abre(t,c,acts,de){foco=de||document.activeElement;$('dlg-t').textContent=t;$('dlg-c').innerHTML=c;$('dlg-a').innerHTML=acts;$('scrim').hidden=false;$('dlg').hidden=false;$('dlg').focus()}
function fecha(){cancelado=true;tms.forEach(clearTimeout);tms=[];$('dlg').hidden=true;$('scrim').hidden=true;if(foco&&foco.focus)foco.focus()}
document.addEventListener('keydown',function(ev){if($('dlg').hidden)return;
 if(ev.key==='Escape'){fecha();return}
 if(ev.key==='Tab'){var f=[].slice.call($('dlg').querySelectorAll('button,a[href]')).filter(function(x){return!x.disabled});if(!f.length){ev.preventDefault();return}
  var a=document.activeElement,i=f.indexOf(a);if(ev.shiftKey&&(i<=0)){ev.preventDefault();f[f.length-1].focus()}else if(!ev.shiftKey&&(i===f.length-1||i<0)){ev.preventDefault();f[0].focus()}}});
$('scrim').addEventListener('click',fecha);

/* T-23 · «Ver como fazer» (DOC-07 §4): 3 passos curtos, ícone neutro, sem marca de terceiro */
var GUIA={
 rede:['Como trazer fotos do Instagram e do Facebook','<p class="resumo">Estas plataformas não permitem importar por aqui. O caminho que funciona:</p><ol class="pas"><li>Salve a foto no aparelho pelo próprio aplicativo.</li><li>Volte ao PolarLife e escolha <strong>Do aparelho</strong>.</li><li>Opcional: se você baixou o arquivo de dados da conta, o ZIP poderá ser importado em versão futura.</li></ol>'],
 apple:['Como trazer fotos do iCloud','<ol class="pas"><li>No iPhone ou iPad, toque em <strong>Do aparelho</strong>.</li><li>Escolha <strong>Biblioteca de Fotos</strong> no seletor.</li><li>As fotos do iCloud que já aparecem na galeria funcionam. As HEIC são convertidas no aparelho (selo «Convertida»).</li></ol>']};
/* T-24 · linhas de verificação (DOC-07 §5), em ordem fixa; nenhuma toca em foto */
function espaco(){if(!(navigator.storage&&navigator.storage.estimate))return Promise.resolve(['atencao','Seu navegador não informa o espaço livre.']);
 return navigator.storage.estimate().then(function(r){var p=r.quota?Math.round(100*r.usage/r.quota):0;return p>=80?['atencao','Uso em '+p+'%. Libere espaço antes de importar muitas fotos.']:['ok','Há espaço livre.']},function(){return['atencao','Não foi possível medir o espaço.']})}
function canShareArq(){try{if(!temShare)return['atencao','Este navegador não compartilha arquivos. O arquivo será baixado.'];
 return navigator.canShare({files:[new File([new Uint8Array(1)],'teste.png',{type:'image/png'})]})?['ok','O menu de compartilhar aceita arquivos.']:['atencao','O menu não aceita este tipo de arquivo. O arquivo será baixado.']}catch(e){return['atencao','Não foi possível confirmar. O arquivo será baixado.']}}
var PASSOS={
 dev:[['Seletor de fotos do aparelho',function(){return['ok','Sempre disponível.']}],['Leitura de HEIC',function(){return['ok','Conversão para JPEG no aparelho.']}],['Espaço de armazenamento',espaco]],
 saida:[['Conexão segura (HTTPS)',function(){return https?['ok','Conexão segura.']:['falha','Sem HTTPS o menu de compartilhar não abre.']}],['Compartilhar arquivo',canShareArq],['Baixar imagem',function(){return['ok','Sempre disponível.']}]],
 rede:[['Importar por API',function(){return['ind','Esta plataforma não permite.']}],['Importar pelo aparelho',function(){return['ok','Salve a foto e escolha Do aparelho.']}],['Compartilhar arquivo',canShareArq]]};
var PIOR={ok:0,ind:1,atencao:2,falha:3};
function resumo(s,L){var p=L.reduce(function(m,l){return PIOR[l[1]]>PIOR[m]?l[1]:m},'ok');
 if(s.t==='rede')return'Esta plataforma não permite importar por API. Use Do aparelho.';
 if(p==='falha')return'Não foi possível compartilhar por aqui. Baixe o arquivo e escolha-o na galeria do aplicativo. Suas fotos não foram tocadas.';
 if(p==='atencao')return'Funciona, com um aviso. Suas fotos não foram tocadas.';
 return s.t==='saida'?'Tudo pronto. Você pode compartilhar o arquivo.':'Tudo pronto. Você pode trazer fotos deste caminho.'}
function testa(id,de){var s=porId(id),ps=PASSOS[s.t],L=[];cancelado=false;
 abre('Verificar: '+s.n,'<p class="resumo" role="status" id="rs">Verificando… Nenhuma foto é lida, baixada ou enviada.</p><div class="cbar led-progress led-progress--thin" id="cb" aria-hidden="true"><span class="led-progress__glow"></span><span class="led-progress__track"><span class="led-progress__fill"></span></span></div><ul class="lin" id="ln" aria-live="polite"></ul>','<button type="button" class="btn2" id="cancela">Cancelar</button>',de);
 $('cancela').onclick=fecha;$('cancela').focus();
 if(estado==='verificando')return;                       /* revisão: fica no meio do teste */
 (function passo(i){if(cancelado)return;
  if(i===ps.length){$('cb').hidden=true;$('rs').textContent=resumo(s,L);
   $('dlg-a').innerHTML=(L.some(function(l){return l[1]==='falha'})?'<button type="button" class="btn2" id="de-novo">Tentar de novo</button>':'')+'<button type="button" class="btn2" id="fim">Fechar</button>';
   if($('de-novo'))$('de-novo').onclick=function(){testa(id,foco)};$('fim').onclick=fecha;$('fim').focus();return}
  tms.push(setTimeout(function(){if(cancelado)return;
   Promise.resolve(ps[i][1]()).then(function(r){if(cancelado)return;L.push([ps[i][0],r[0],r[1]]);
    var k=r[0]==='ind'?'info':r[0];$('ln').insertAdjacentHTML('beforeend','<li data-e="'+r[0]+'">'+svg(k)+'<span><strong>'+ps[i][0]+'</strong> · '+({ok:'Tudo certo',atencao:'Atenção',falha:'Falhou',ind:'Indisponível por regra da plataforma'})[r[0]]+'<small>'+r[1]+'</small></span></li>');passo(i+1)})},estado==='verificando'?0:450))})(0)}
document.addEventListener('click',function(ev){var b=ev.target.closest('button[data-t],button[data-g]');if(!b)return;
 if(b.dataset.t)testa(b.dataset.t,b);
 else{var g=GUIA[b.dataset.g];abre(g[0],g[1],'<button type="button" class="btn2" id="fim">Fechar</button><a class="btn2" href="../adicionar-fotos/">Escolher do aparelho</a>',b);$('fim').onclick=fecha}});
if(estado==='verificando')testa('compartilhar',null);
})();
