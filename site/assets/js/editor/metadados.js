/* Data e local de cada foto · DOC-05 FN-08 · BR-07 (arquivo gerado sem metadados) · D-148
   A aba «Metadados» saiu (D-148): a data e a cidade de cada foto, e a correção de horas em lote, vivem agora em
   Legendas › Avançado (legendas.js chama PLMET.html()). Estado por foto em ST[n].meta (só existe depois de uma edição;
   o padrão vem de def(n)). Q.meta é a leitura usada pela legenda. Histórico vem do quadro.js. */
(function(){
var Q=window.PLQ;if(!Q)return;
var $=function(i){return document.getElementById(i)};
var err=null,hv=0,ult=0;
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
Q.meta=function(n){var m=M(n),p=pd(m.iso);return{iso:m.iso,data:p?new Date(p.y,p.m-1,p.d):null,cidade:m.c,cs:m.cs,lugar:m.lugar||null}};
/* D-178: cidade lida do GPS (no formato de Avançado), para o campo mostrar de onde vem a linha de local */
function daFoto(m){return m&&m.lugar&&window.PLTEXTO?PLTEXTO.lugarTxt(m.lugar,Q.ST()[0].leg):''}

function refaz(ns){if(window.PLLEG&&PLLEG.refazer)PLLEG.refazer(ns)}   /* D-148: as linhas sugeridas seguem a data e a cidade */
function grava(n,m,k){Q.ST()[n].meta=m;Q.commit(k)}
/* marcação da seção (D-148): entra em Legendas › Avançado, sem repetir nada que o painel já tem */
function html(){
  var h='<div class="f md-sec" data-md="1"><div class="f__top"><span class="f__l">Data e cidade desta foto</span></div>'
   +'<p class="f__h" id="md-info" role="status"></p></div>';
  h+='<div class="f" data-k="d"><div class="f__top"><label class="f__l" for="md-d">Data</label><button type="button" class="lk" data-clr="d">Sem data</button></div><div class="num num--l"><input id="md-d" inputmode="numeric" autocomplete="off" placeholder="dd/mm/aaaa"></div><p class="f__h" hidden><svg class="ico sm"><use href="#i-cancel"/></svg><span></span></p></div>';
  h+='<div class="f" data-k="c"><div class="f__top"><label class="f__l" for="md-c">Cidade</label><button type="button" class="lk" data-clr="c">Sem local</button></div><div class="num num--l"><input id="md-c" maxlength="60" autocomplete="off" list="md-c-l"><datalist id="md-c-l"></datalist></div><p class="f__h" hidden><svg class="ico sm"><use href="#i-cancel"/></svg><span></span></p></div>';
  h+='<p class="f__h"><svg class="ico sm"><use href="#i-info"/></svg><span>Vale só para esta foto. Em branco, vale o local lido da foto; «Sem local» tira a cidade e o ponto. Coordenadas nunca aparecem e o arquivo gerado não leva os metadados originais.</span></p>';
  h+='<div class="f" data-k="h"><div class="f__top"><label class="f__l" for="md-h">Somar ou subtrair horas às datas</label></div><div class="num"><input id="md-h" inputmode="numeric" autocomplete="off" value="0"><span class="num__u mono">h</span></div><p class="f__h" hidden><svg class="ico sm"><use href="#i-cancel"/></svg><span></span></p></div>';
  h+='<p class="f__h" id="md-prev" role="status"></p>';
  h+='<button type="button" class="btn2" id="md-apl"></button>';
  h+='<p class="f__h"><svg class="ico sm"><use href="#i-info"/></svg><span id="md-esc"></span></p>';
  return h
}
function alvos(){var s=Q.sel?Q.sel():[],r=[],i;if(s.length)return s;for(i=1;i<=Q.N;i++)r.push(i);return r}
function afetadas(){return alvos().filter(function(i){return M(i).iso}).length}
function prev(){
  if(!$('md-prev'))return;
  var m=M(Q.cur()),q=afetadas(),b=$('md-apl'),ok=hv!==0&&q>0&&!(err&&err.k==='h');
  $('md-prev').textContent=!hv?'Informe as horas para ver como a data desta foto fica.':!m.iso?'Esta foto não tem data; as outras ('+q+') mudam.':'Foto '+Q.p2(Q.cur())+': '+lido(m.iso)+' → '+lido(desloca(m.iso,hv));
  b.disabled=!ok;b.textContent=q?'Aplicar em '+q+(q===1?' foto com data':' fotos com data'):'Nenhuma foto com data'}
function render(){
  if(!$('md-d'))return;                      /* a seção só existe com Legendas › Avançado aberto */
  if(Q.cur()!==ult){ult=Q.cur();err=null}
  var n=Q.cur(),m=M(n),P=$('p-legendas');
  $('md-info').textContent=(m.iso?lido(m.iso)+' · '+(m.ds==='exif'?'data lida da foto':m.ds==='manual'?'digitada por você':'sem data na foto'):'Sem data')+(m.dh?' · corrigida '+(m.dh>0?'+':'−')+Math.abs(m.dh)+' h':'')+(m.cs==='sem'?' · sem local':!m.c&&daFoto(m)?' · local lido da foto':m.c&&m.cs==='gps'?' · cidade aproximada':'');
  [['d',br(m.iso)],['c',m.c]].forEach(function(c){var box=P.querySelector('[data-k="'+c[0]+'"]'),inp=box.querySelector('input'),bad=err&&err.k===c[0];
    box.classList.toggle('is-err',!!bad);box.querySelector('p').hidden=!bad;if(bad)box.querySelector('p').lastChild.textContent=err.m;
    inp.setAttribute('aria-invalid',bad?'true':'false');if(document.activeElement!==inp&&!bad)inp.value=c[1]});
  var bh=P.querySelector('[data-k="h"]'),eh=err&&err.k==='h';
  bh.classList.toggle('is-err',!!eh);bh.querySelector('p').hidden=!eh;if(eh)bh.querySelector('p').lastChild.textContent=err.m;
  if(document.activeElement!==$('md-h')&&!eh)$('md-h').value=String(hv);
  P.querySelector('[data-clr="d"]').hidden=!m.iso;
  var gf=daFoto(m),bc=P.querySelector('[data-clr="c"]'),sem=m.cs==='sem';   /* D-178: «Sem local» ↔ «Usar o local da foto» */
  bc.textContent=sem?'Usar o local da foto':'Sem local';bc.hidden=sem?!gf:!(m.c||gf);
  $('md-c').placeholder=sem?'Sem local':gf?gf+' (da foto)':'';
  $('md-esc').textContent=(Q.sel&&Q.sel().length?'Vale só para as '+Q.sel().length+' fotos selecionadas na faixa.':'Nenhuma foto selecionada: vale para todas as fotos com data. Para escolher, use Ctrl ou ⌘ + clique na faixa.');
  prev()}
/* eventos: delegados no painel de legendas, que persiste enquanto o conteúdo é remontado */
var P0=$('p-legendas');
P0.addEventListener('change',function(e){var t=e.target,n=Q.cur(),m;
  if(t.id==='md-d'){var r=lerData(t.value);if(r.e){err={k:'d',m:r.e};render();return}
    m=cp(n);var hora=pd(m.iso)?m.iso.slice(11):'12:00';m.iso=r.y+'-'+z(r.m)+'-'+z(r.d)+'T'+hora;m.ds='manual';m.dh=0;err=null;grava(n,m,'md:d');refaz([n]);return}
  if(t.id==='md-c'){m=cp(n);m.c=t.value.trim();m.cs=m.c?'manual':'none';err=null;grava(n,m,'md:c');refaz([n]);return}
  if(t.id==='md-h'){var v=t.value.trim().replace('−','-');if(!/^[+-]?\d+$/.test(v)||Math.abs(+v)>48){err={k:'h',m:'Use um número inteiro entre −48 e 48.'};hv=0}else{err=null;hv=+v}render()}});
P0.addEventListener('input',function(e){
  if(e.target.id==='md-c'&&window.PLLOCAIS){var s0=Q.ST()[0].leg,dl=$('md-c-l');   /* D-139: «Cidade - UF» enquanto digita; desligado em «Sugestões de legendas» */
    if(!(s0&&(s0.sug===false||s0.original)))PLLOCAIS.buscar(e.target.value,8).then(function(r){dl.innerHTML=r.map(function(x){return'<option value="'+PLLOCAIS.rotulo(x)+'"></option>'}).join('')});else dl.innerHTML=''}
  if(e.target.id==='md-h'){var v=e.target.value.trim().replace('−','-');if(/^[+-]?\d+$/.test(v)&&Math.abs(+v)<=48){hv=+v;err=null}prev()}});
P0.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var n=Q.cur(),m;
  if(b.getAttribute('data-clr')==='d'){m=cp(n);m.iso='';m.ds='none';m.dh=0;err=null;grava(n,m,'md:d');refaz([n])}
  if(b.getAttribute('data-clr')==='c'){m=cp(n);var volta=m.cs==='sem';m.c='';m.cs=volta?'none':'sem';err=null;grava(n,m,'md:c');refaz([n])}
  if(b.id==='md-apl'&&hv){var q=0,i,L=alvos();for(var j=0;j<L.length;j++){i=L[j];m=cp(i);if(m.iso){m.iso=desloca(m.iso,hv);m.dh+=hv;Q.ST()[i].meta=m;q++}}
    var t=(hv>0?'+':'−')+Math.abs(hv)+' h';hv=0;Q.commit('md:shift');refaz(L);Q.toast('Datas corrigidas em '+t+' · '+q+' fotos · Desfazer',true)}});
window.PLMET={render:render,html:html};
if(window.PLLEG&&PLLEG.iniciar)PLLEG.iniciar();   /* D-149: preenche as linhas sugeridas assim que a leitura de data e cidade existe */
Q.render()
})();
