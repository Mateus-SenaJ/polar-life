/* T-14 · Lote e seleção · DOC-05 FN-09 (seleção, copiar/colar estilo, aviso de ajuste individual), FN-00a («Valores diferentes»), FN-00b (4 níveis de escopo)
   Seleção = estado de tela (não entra no histórico). Aplicar e colar entram no histórico do quadro.js. */
(function(){
var Q=window.PLQ;if(!Q)return;
var $=function(i){return document.getElementById(i)};
var SEL={},esc='esta',ult='todas',modo=false,anc=0,clip=null;
var NOME={esta:'Somente esta',sel:'Selecionadas',folha:'Esta folha',todas:'Todas'};
var ROT={brilho:'Brilho',contraste:'Contraste',saturacao:'Saturação',temp:'Temperatura',realces:'Realces',sombras:'Sombras',nitidez:'Nitidez',vinheta:'Vinheta'};
function fo(i){return Math.ceil(i/4)}                       /* 4 polaroids por folha A4 (DOC-04 §6) [RECOMENDADO] */
function sel(){var r=[],i;for(i=1;i<=Q.N;i++)if(SEL[i])r.push(i);return r}
function conj(e){                                            /* destinos do escopo, sem a foto atual */
  e=e||(esc==='esta'?ult:esc);var c=Q.cur(),r=[],i;
  for(i=1;i<=Q.N;i++){if(i===c)continue;if(e==='todas'||(e==='sel'&&SEL[i])||(e==='folha'&&fo(i)===fo(c)))r.push(i)}
  return r}
function alvos(){return esc==='esta'?[]:conj(esc)}
function n(k,s,p){return k+' '+(k===1?s:p)}
function texto(){var c=Q.cur(),a=alvos().length,b='Alterando: só esta foto · Foto '+Q.p2(c);   /* D-182: os ajustes mexem só na foto aberta; o escopo diz para onde «Aplicar» leva (T7) */
  if(esc==='esta')return b;
  if(esc==='sel')return b+' · «Aplicar» vai para '+n(a,'selecionada','selecionadas');
  if(esc==='folha')return b+' · «Aplicar» vai para a Folha '+fo(c)+' ('+n(a,'foto','fotos')+')';
  return b+' · «Aplicar» vai para as outras '+a}
function dif(id){                                            /* fotos do escopo cujo valor de «id» difere da foto aberta (FN-00a) */
  if(esc==='esta')return[];var al=alvos(),S=Q.ST(),c=Q.S();
  return al.filter(function(i){var f=S[i].flt,g=c.flt;
    if(id==='filtro')return f.id!==g.id;
    if(id==='fint')return!(f.id==='original'&&g.id==='original')&&f.int!==g.int;
    return S[i].adj[id]!==c.adj[id]})}
function diff(){
  if(esc==='esta')return'';var r=[];
  Object.keys(ROT).forEach(function(k){if(dif(k).length)r.push(ROT[k])});
  if(dif('filtro').length||dif('fint').length)r.push('Filtro');
  return r.length?'Valores diferentes: '+r.join(', ')+'.':''}
function aviso(k){var a=$('scope-aviso');a.hidden=!k;a.querySelector('span').textContent=k?(k===1?'1 foto tem ajuste individual e foi mantida.':k+' fotos têm ajuste individual e foram mantidas.'):''}
function marca(i){var b=$('faixa').children[i-1];if(b){b.firstChild.classList.toggle('th--sel',!!SEL[i]);Q.thumb(i)}}
function marcaTudo(){for(var i=1;i<=Q.N;i++)marca(i)}

function montar(){
  var b=document.createElement('div'),h='';b.className='sbox';b.id='scope-box';b.hidden=true;
  h+='<div class="seg" role="radiogroup" aria-label="Escopo da alteração">';
  Object.keys(NOME).forEach(function(k){h+='<label class="seg__o"><input type="radio" name="escopo" value="'+k+'"><span>'+NOME[k]+'</span></label>'});
  h+='</div><p class="f__h" id="scope-diff" role="status" hidden></p>';
  h+='<p class="f__h" id="scope-aviso" role="status" hidden><svg class="ico sm"><use href="#i-info"/></svg><span></span></p>';
  h+='<div class="sbox__r"><strong class="sbox__n" id="sel-n" role="status"></strong><button type="button" class="btn2 btn2--sm" id="sel-modo" aria-pressed="false">Marcar na faixa</button></div>';
  h+='<div class="sbox__r"><button type="button" class="btn2 btn2--sm" id="sel-todas">Selecionar todas</button><button type="button" class="btn2 btn2--sm" id="sel-folha">Só esta folha</button><button type="button" class="btn2 btn2--sm" id="sel-limpar">Limpar</button></div>';
  h+='<div class="sbox__r"><button type="button" class="btn2 btn2--sm" id="est-copiar">Copiar estilo</button><button type="button" class="btn2 btn2--sm" id="est-colar" disabled>Colar estilo</button>'
    +'<button type="button" class="btn2 btn2--sm" id="est-dup"><svg class="ico sm"><use href="#i-copy"/></svg><span></span></button><button type="button" class="btn2 btn2--sm" id="est-rem"><svg class="ico sm"><use href="#i-trash"/></svg><span></span></button></div>';
  h+='<p class="f__h" id="est-h" role="status"><svg class="ico sm"><use href="#i-info"/></svg><span></span></p>';
  h+='<p class="f__h"><svg class="ico sm"><use href="#i-info"/></svg><span>Na faixa, Ctrl ou ⌘ + clique marca uma foto e Shift + clique marca um intervalo.</span></p>';
  b.innerHTML=h;$('scope').after(b);
  var lk=document.createElement('button');lk.type='button';lk.className='lk lk--mono';lk.id='scope-mod';lk.textContent='Modificar escopo';
  lk.setAttribute('aria-expanded','false');lk.setAttribute('aria-controls','scope-box');$('scope').appendChild(lk);
  lk.onclick=function(){var o=b.hidden;b.hidden=!o;lk.setAttribute('aria-expanded',o);render()};
  b.addEventListener('change',function(e){if(e.target.name==='escopo')set(e.target.value)});
  $('sel-modo').onclick=function(){modo=!modo;render()};
  $('sel-todas').onclick=function(){for(var i=1;i<=Q.N;i++)SEL[i]=true;marcaTudo();refresh()};
  $('sel-folha').onclick=function(){SEL={};for(var i=1;i<=Q.N;i++)if(fo(i)===fo(Q.cur()))SEL[i]=true;marcaTudo();refresh()};
  $('sel-limpar').onclick=function(){SEL={};marcaTudo();refresh()};
  $('est-copiar').onclick=function(){var s=Q.S();clip={adj:JSON.parse(JSON.stringify(s.adj)),flt:JSON.parse(JSON.stringify(s.flt))};Q.toast('Estilo da Foto '+Q.p2(Q.cur())+' copiado');render()};
  $('est-colar').onclick=colar;
  $('est-dup').onclick=function(){var k=Q.duplicar(alvoEst());if(k){aviso(0);Q.toast(k===1?'1 foto duplicada · Desfazer':k+' fotos duplicadas · Desfazer',true)}};
  $('est-rem').onclick=function(){if(!$('est-rem').disabled)confirmar(alvoEst())};
  $('faixa').addEventListener('click',function(e){
    var t=e.target.closest&&e.target.closest('.th');if(!t)return;
    var i=[].indexOf.call($('faixa').children,t.parentNode)+1,k,a,z;
    if(e.shiftKey){a=Math.min(anc||Q.cur(),i);z=Math.max(anc||Q.cur(),i);for(k=a;k<=z;k++)SEL[k]=true;marcaTudo()}
    else if(e.ctrlKey||e.metaKey||modo){if(SEL[i])delete SEL[i];else SEL[i]=true;anc=i;marca(i)}
    else return;
    e.stopPropagation();e.preventDefault();refresh()},true)}


/* pop-up «Remover N fotos do projeto?» (nível 3, DOC-01 §3) · foco preso · Esc mantém as fotos.
   LED fica em «Manter fotos»; a ação destrutiva é secundária, com lixeira, nunca LED nem vermelho (DS) */
var dlgV,dlgAlvo=[];
function dialogo(){
  if($('rem-dlg'))return;
  var sc=document.createElement('div');sc.className='scrim';sc.id='rem-scrim';sc.hidden=true;
  var d=document.createElement('div');d.className='dialog';d.id='rem-dlg';d.setAttribute('role','alertdialog');d.setAttribute('aria-modal','true');
  d.setAttribute('aria-labelledby','rem-t');d.setAttribute('aria-describedby','rem-d');d.hidden=true;
  d.innerHTML='<h2 id="rem-t"></h2><p id="rem-d"></p><div class="dialog__act">'
    +'<button type="button" class="btn2 btn2--lg" id="rem-sim"><svg class="ico sm"><use href="#i-trash"/></svg><span></span></button>'
    +'<button type="button" class="led-btn led-btn--light" id="rem-nao"><span class="smoke-layer" aria-hidden="true"></span><span class="btn-content"><span>Manter fotos</span></span></button></div>';
  document.body.appendChild(sc);document.body.appendChild(d);
  $('rem-nao').onclick=fecharDlg;sc.onclick=fecharDlg;
  $('rem-sim').onclick=function(){var a=dlgAlvo;fecharDlg(true);var k=Q.remover(a);
    if(k){aviso(0);Q.toast(k===1?'1 foto removida do projeto · Desfazer':k+' fotos removidas do projeto · Desfazer',true)}};
  document.addEventListener('keydown',function(e){
    if(d.hidden)return;
    if(e.key==='Escape'){e.preventDefault();fecharDlg();return}
    if(e.key!=='Tab')return;
    var a=$('rem-sim'),z=$('rem-nao');
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
    else if(document.activeElement!==a&&document.activeElement!==z){e.preventDefault();z.focus()}
  })}
function confirmar(al){
  dialogo();dlgAlvo=al.slice();dlgV=document.activeElement;
  var um=al.length===1;
  $('rem-t').textContent=um?'Remover esta foto do projeto?':'Remover '+al.length+' fotos do projeto?';
  $('rem-d').textContent=(um?'Ela sai':'Elas saem')+' do Quadro, das folhas e do PDF. '+(um?'O arquivo original continua':'Os arquivos originais continuam')+' onde você os guardou. Dá para desfazer com Ctrl+Z.';
  $('rem-sim').lastChild.textContent=um?'Remover esta foto':'Remover '+al.length+' fotos';
  $('rem-scrim').hidden=$('rem-dlg').hidden=false;$('rem-nao').focus()}
function fecharDlg(semFoco){
  $('rem-scrim').hidden=$('rem-dlg').hidden=true;
  if(semFoco!==true&&dlgV&&dlgV.focus)dlgV.focus()}
function alvoEst(){var m=sel();return m.length?m:[Q.cur()]}   /* Duplicar e Remover agem nas marcadas; sem marcação, na foto aberta */
function limpar(){SEL={};anc=0;if($('faixa').children.length===Q.N)marcaTudo();if($('scope-box'))refresh()}
function set(e){esc=e;if(e!=='esta')ult=e;aviso(0);Q.lote();render()}   /* D-182: sem o «Replicar»; o escopo só escolhe para onde o «Aplicar» leva */
function refresh(){aviso(0);render();Q.lote()}
function colar(){
  if(!clip)return;var c=Q.cur(),sub=$('subst').checked,q=0,keep=0,L=[c].concat(alvos()),S=Q.ST();
  L.forEach(function(i){if(i!==c&&(Q.individual||Q.ajustou)(S[i])&&!sub){keep++;return}S[i].adj=JSON.parse(JSON.stringify(clip.adj));S[i].flt=JSON.parse(JSON.stringify(clip.flt));if(i!==c)S[i].ind=false;q++});   /* D-182 */
  Q.commit('lote:colar');marcaTudo();aviso(keep);
  Q.toast('Estilo colado em '+n(q,'foto','fotos')+(keep?' · '+keep+(keep===1?' foi mantida':' foram mantidas'):''),true)}

function render(){
  if(!$('scope-box'))return;
  var s=sel(),d=diff();
  var leg=$('tab-legendas').getAttribute('aria-selected')==='true',lk=$('scope-mod');
  lk.hidden=$('scope').hidden||leg;
  if(lk.hidden)$('scope-box').hidden=true;
  [].slice.call($('scope-box').querySelectorAll('[name="escopo"]')).forEach(function(r){r.checked=r.value===esc});
  $('sel-n').textContent=s.length?n(s.length,'foto selecionada','fotos selecionadas'):'Nenhuma foto selecionada';
  $('sel-modo').setAttribute('aria-pressed',modo);$('sel-modo').textContent=modo?'Marcando na faixa · Concluir':'Marcar na faixa';
  $('sel-limpar').disabled=!s.length;
  $('est-colar').disabled=!clip;
  var al=alvoEst(),um=al.length===1,cabeRem=al.length<Q.N;
  $('est-dup').lastChild.textContent=um?'Duplicar esta foto':'Duplicar '+al.length+' fotos';
  $('est-rem').lastChild.textContent=um?'Remover esta foto':'Remover '+al.length+' fotos';
  $('est-rem').disabled=!cabeRem;
  $('est-h').lastChild.textContent=cabeRem?'Remover tira do projeto e do PDF. O arquivo original continua com você.':'O projeto precisa ficar com ao menos 1 foto.';
  $('scope-diff').hidden=!d;$('scope-diff').textContent=d;
  var fd=$('flt-dif');
  if(fd){var kf=dif('filtro').length;fd.hidden=!kf;fd.querySelector('span').textContent=kf?'Valores diferentes: '+n(kf,'foto do escopo usa','fotos do escopo usam')+' outro filtro.':''}
  if(Q.sinc)Q.sinc();
  $('faixa-w').classList.toggle('is-marcando',modo)}

window.PLLOTE={dif:dif,limpar:limpar,alvos:alvos,conj:conj,texto:texto,sel:function(i){return!!SEL[i]},lista:sel,aviso:aviso,render:render};
Q.sel=sel;
montar();render();Q.lote()
})();
