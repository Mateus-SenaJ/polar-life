/* T-13 · Inspetor · aba METADADOS · DOC-05 FN-08 · BR-07 (arquivo gerado sem metadados)
   Estado por foto em ST[n].meta (só existe depois de uma edição; o padrão vem de def(n)). Histórico vem do quadro.js. */
(function(){
var Q=window.PLQ;if(!Q)return;
var $=function(i){return document.getElementById(i)};
var ORIG=['Do aparelho','Câmera','Apple Fotos','Não informada'];
var err=null,built=false,hv=0,ult=0;
function z(n){return(n<10?'0':'')+n}
/* dados de exemplo: 14.07.26 em Campos do Jordão (DOC-04 §6); horas 08:00 + 30 min por foto [HIPÓTESE] */
var HEIC={5:1,7:1,12:1,13:1,18:1,22:1};   /* mesmas fotos «convertidas» da T-04 (processando.js) */
function def(n){if(sessionStorage.getItem('pl-fotos'))return{iso:'',ds:'',dh:0,c:'',cs:'',o:'Do aparelho',conv:false};n=Q.src(n);var m=480+30*(n-1);return{iso:'2026-07-14T'+z(Math.floor(m/60))+':'+z(m%60),ds:'exif',dh:0,c:'Campos do Jordão',cs:'gps',o:'Do aparelho',conv:!!HEIC[n]}}
function M(n){return Q.ST()[n].meta||def(n)}
function cp(n){return JSON.parse(JSON.stringify(M(n)))}
function pd(iso){var a=(iso||'').match(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+)(?::\d+)?$/);return a?{y:+a[1],m:+a[2],d:+a[3],h:+a[4],i:+a[5]}:null}   /* o EXIF pode vir com segundos */
function lido(iso){var p=pd(iso);return p?z(p.d)+'.'+z(p.m)+'.'+String(p.y).slice(2)+' · '+z(p.h)+':'+z(p.i):''}
function br(iso){var p=pd(iso);return p?z(p.d)+'/'+z(p.m)+'/'+p.y:''}
function desloca(iso,h){var p=pd(iso),t=new Date(Date.UTC(p.y,p.m-1,p.d,p.h,p.i)+h*3600000);
  return t.getUTCFullYear()+'-'+z(t.getUTCMonth()+1)+'-'+z(t.getUTCDate())+'T'+z(t.getUTCHours())+':'+z(t.getUTCMinutes())}
function lerData(t){
  var a=String(t).trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if(!a)return{e:'Use o formato dd/mm/aaaa.'};
  var d=+a[1],m=+a[2],y=+a[3],dt=new Date(Date.UTC(y,m-1,d));
  if(y<1900||dt.getUTCDate()!==d||dt.getUTCMonth()!==m-1)return{e:'Essa data não existe.'};
  if(dt.getTime()>Date.now())return{e:'A data não pode estar no futuro.'};
  return{y:y,m:m,d:d}}

/* leitura usada pela legenda (legendas.js) */
Q.meta=function(n){var m=M(n),p=pd(m.iso);return{iso:m.iso,data:p?new Date(p.y,p.m-1,p.d):null,cidade:m.c}};

function grava(n,m,k){Q.ST()[n].meta=m;Q.commit(k)}
function montar(){
  var p=$('p-metadados'),h='';
  h+='<section class="mod" aria-labelledby="md-h1"><h3 class="mod__h rotulo rotulo--m" id="md-h1">Esta foto</h3><dl class="rd" id="md-rd"></dl><div class="rd__s" id="md-selos"></div></section>';
  h+='<section class="mod" aria-labelledby="md-h2"><h3 class="mod__h rotulo rotulo--m" id="md-h2">Editar</h3>';
  h+='<div class="f" data-k="d"><div class="f__top"><label class="f__l" for="md-d">Data</label><button type="button" class="lk" data-clr="d">Sem data</button></div><div class="num num--l"><input id="md-d" inputmode="numeric" autocomplete="off" placeholder="dd/mm/aaaa"></div><p class="f__h" hidden><svg class="ico sm"><use href="#i-cancel"/></svg><span></span></p></div>';
  h+='<div class="f" data-k="c"><div class="f__top"><label class="f__l" for="md-c">Cidade</label><button type="button" class="lk" data-clr="c">Sem local</button></div><div class="num num--l"><input id="md-c" maxlength="60" autocomplete="off" list="md-c-l"><datalist id="md-c-l"></datalist></div><p class="f__h" hidden><svg class="ico sm"><use href="#i-cancel"/></svg><span></span></p></div>';
  h+='<div class="f"><div class="f__top"><label class="f__l" for="md-o">Origem</label></div><div class="num num--l"><select id="md-o">'+ORIG.map(function(o){return'<option>'+o+'</option>'}).join('')+'</select></div></div>';
  h+='<p class="f__h"><svg class="ico sm"><use href="#i-info"/></svg><span>Vale só para esta foto. Se a cidade ficar vazia, a legenda de local some.</span></p></section>';
  h+='<section class="mod" aria-labelledby="md-h3"><h3 class="mod__h rotulo rotulo--m" id="md-h3">Corrigir várias de uma vez</h3>';
  h+='<div class="f" data-k="h"><div class="f__top"><label class="f__l" for="md-h">Somar ou subtrair horas às datas</label></div><div class="num"><input id="md-h" inputmode="numeric" autocomplete="off" value="0"><span class="num__u mono">h</span></div><p class="f__h" hidden><svg class="ico sm"><use href="#i-cancel"/></svg><span></span></p></div>';
  h+='<p class="f__h" id="md-prev" role="status"></p>';
  h+='<button type="button" class="btn2" id="md-apl"></button>';
  h+='<p class="f__h"><svg class="ico sm"><use href="#i-info"/></svg><span id="md-esc"></span></p></section>';
  h+='<div class="msg"><svg class="ico"><use href="#i-info"/></svg><p>Só o que você quer lembrar. Coordenadas brutas não são exibidas. O arquivo gerado não leva os metadados originais.</p></div>';
  p.innerHTML=h;built=true;
  p.addEventListener('change',function(e){var t=e.target,n=Q.cur(),m;
    if(t.id==='md-d'){var r=lerData(t.value);if(r.e){err={k:'d',m:r.e};render();return}
      m=cp(n);var hora=pd(m.iso)?m.iso.slice(11):'12:00';m.iso=r.y+'-'+z(r.m)+'-'+z(r.d)+'T'+hora;m.ds='manual';m.dh=0;err=null;grava(n,m,'md:d');return}
    if(t.id==='md-c'){m=cp(n);m.c=t.value.trim();m.cs=m.c?'manual':'none';err=null;grava(n,m,'md:c');return}
    if(t.id==='md-o'){m=cp(n);m.o=t.value;grava(n,m,'md:o');return}
    if(t.id==='md-h'){var v=t.value.trim().replace('−','-');if(!/^[+-]?\d+$/.test(v)||Math.abs(+v)>48){err={k:'h',m:'Use um número inteiro entre −48 e 48.'};hv=0}else{err=null;hv=+v}render()}});
  p.addEventListener('input',function(e){
    if(e.target.id==='md-c'&&window.PLLOCAIS){var s0=Q.ST()[0].leg,dl=$('md-c-l');   /* D-139: «Cidade - UF» enquanto digita; desligado em «Sugestões de legendas» */
      if(!(s0&&(s0.sug===false||s0.original)))PLLOCAIS.buscar(e.target.value,8).then(function(r){dl.innerHTML=r.map(function(x){return'<option value="'+PLLOCAIS.rotulo(x)+'"></option>'}).join('')});else dl.innerHTML=''}
    if(e.target.id==='md-h'){var v=e.target.value.trim().replace('−','-');if(/^[+-]?\d+$/.test(v)&&Math.abs(+v)<=48){hv=+v;err=null}prev()}});
  p.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var n=Q.cur(),m;
    if(b.getAttribute('data-clr')==='d'){m=cp(n);m.iso='';m.ds='none';m.dh=0;err=null;grava(n,m,'md:d')}
    if(b.getAttribute('data-clr')==='c'){m=cp(n);m.c='';m.cs='none';err=null;grava(n,m,'md:c')}
    if(b.id==='md-apl'&&hv){var q=0,i,L=alvos();for(var j=0;j<L.length;j++){i=L[j];m=cp(i);if(m.iso){m.iso=desloca(m.iso,hv);m.dh+=hv;Q.ST()[i].meta=m;q++}}
      var t=(hv>0?'+':'−')+Math.abs(hv)+' h';hv=0;Q.commit('md:shift');Q.toast('Datas corrigidas em '+t+' · '+q+' fotos · Desfazer',true)}})}

function alvos(){var s=Q.sel?Q.sel():[],r=[],i;if(s.length)return s;for(i=1;i<=Q.N;i++)r.push(i);return r}
function afetadas(){return alvos().filter(function(i){return M(i).iso}).length}
function prev(){
  var m=M(Q.cur()),q=afetadas(),b=$('md-apl'),ok=hv!==0&&q>0&&!(err&&err.k==='h');
  $('md-prev').textContent=!hv?'Informe as horas para ver como a data desta foto fica.':!m.iso?'Esta foto não tem data; as outras ('+q+') mudam.':'Foto '+Q.p2(Q.cur())+': '+lido(m.iso)+' → '+lido(desloca(m.iso,hv));
  b.disabled=!ok;b.textContent=q?'Aplicar em '+q+(q===1?' foto com data':' fotos com data'):'Nenhuma foto com data'}
function render(){
  if(!built)montar();
  if(Q.cur()!==ult){ult=Q.cur();err=null}
  var n=Q.cur(),m=M(n),a=Q.nat(n),rd=$('md-rd'),sel='';
  rd.innerHTML='<div><dt>Data</dt><dd>'+(m.iso?lido(m.iso):'Sem data')+'<span class="rotulo">'+(m.ds==='exif'?'Data da foto (EXIF)':m.ds==='manual'?'Digitada por você':'Sem data na foto')+(m.dh?' · corrigida '+(m.dh>0?'+':'−')+Math.abs(m.dh)+' h':'')+'</span></dd></div>'
   +'<div><dt>Orientação</dt><dd>'+(Q.vert(n)?'Vertical':'Horizontal')+'</dd></div>'
   +'<div><dt>Dimensões</dt><dd>'+a.w+' × '+a.h+' px</dd></div>'
   +'<div><dt>Perfil de cor</dt><dd>sRGB</dd></div>'
   +'<div><dt>Origem</dt><dd>'+m.o+'</dd></div>'
   +'<div><dt>Local</dt><dd>'+(m.c||'Sem local')+'</dd></div>';
  if(m.cs==='gps'&&m.c)sel+='<span class="pill rotulo">Aproximado</span>';
  if(m.conv)sel+='<span class="pill rotulo">Convertida</span>';
  $('md-selos').innerHTML=sel;
  var cmp=[['d',br(m.iso)],['c',m.c]];
  cmp.forEach(function(c){var box=$('p-metadados').querySelector('[data-k="'+c[0]+'"]'),inp=box.querySelector('input'),bad=err&&err.k===c[0];
    box.classList.toggle('is-err',!!bad);box.querySelector('p').hidden=!bad;if(bad)box.querySelector('p').lastChild.textContent=err.m;
    inp.setAttribute('aria-invalid',bad?'true':'false');if(document.activeElement!==inp&&!bad)inp.value=c[1]});
  var bh=$('p-metadados').querySelector('[data-k="h"]'),eh=err&&err.k==='h';
  bh.classList.toggle('is-err',!!eh);bh.querySelector('p').hidden=!eh;if(eh)bh.querySelector('p').lastChild.textContent=err.m;
  if(document.activeElement!==$('md-h')&&!eh)$('md-h').value=String(hv);
  $('md-o').value=m.o;
  $('p-metadados').querySelector('[data-clr="d"]').hidden=!m.iso;$('p-metadados').querySelector('[data-clr="c"]').hidden=!m.c;
  $('md-esc').textContent=(Q.sel&&Q.sel().length?'Vale só para as '+Q.sel().length+' fotos selecionadas na faixa.':'Nenhuma foto selecionada: vale para todas as fotos com data. Para escolher, use Ctrl ou ⌘ + clique na faixa.');
  prev()}
window.PLMET={render:render};
render();Q.render()
})();
