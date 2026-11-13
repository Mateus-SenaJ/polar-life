/* D-208 · Cidade em lista suspensa com busca (combobox ARIA 1.2). Os municípios vêm de PLLOCAIS (arquivos do próprio site,
   nada sai do aparelho, T5). Vazio: primeiro as cidades já usadas no projeto, depois capitais. Para um lugar fora da lista
   (outro país, um bairro), a última opção usa o texto digitado. Teclado: ↑ ↓ andam, Enter escolhe, Esc fecha. */
(function(){
var CAPITAIS=[['São Paulo','SP'],['Rio de Janeiro','RJ'],['Salvador','BA'],['Brasília','DF'],['Belo Horizonte','MG'],['Fortaleza','CE'],['Recife','PE'],['Porto Alegre','RS'],['Curitiba','PR'],['Florianópolis','SC'],['Manaus','AM'],['Belém','PA']];
var seq=0;
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function rot(r){return r.cidade+(r.uf?' - '+r.uf:'')}
/* ligar(input, {escolher(rotulo, r), usadas: fn→[rótulos]}) */
function ligar(inp,o){
  if(!inp||inp._cbx)return;o=o||{};
  var id='cbx-'+(++seq),box=inp.parentNode,lb=document.createElement('ul'),bt=document.createElement('button'),L=[],at=-1,tm=null,aberta=false,nb=0;
  inp._cbx=true;inp.removeAttribute('list');
  inp.setAttribute('role','combobox');inp.setAttribute('aria-autocomplete','list');inp.setAttribute('aria-expanded','false');inp.setAttribute('aria-controls',id);
  lb.id=id;lb.className='cbx__lista';lb.setAttribute('role','listbox');lb.setAttribute('aria-label','Cidades');lb.hidden=true;
  bt.type='button';bt.className='cbx__abre';bt.tabIndex=-1;bt.setAttribute('aria-label','Mostrar cidades');
  bt.innerHTML='<svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  box.classList.add('cbx');box.appendChild(bt);box.appendChild(lb);
  function fechar(){aberta=false;lb.hidden=true;inp.setAttribute('aria-expanded','false');inp.removeAttribute('aria-activedescendant');at=-1}
  function pinta(grupos){
    L=[];var h='';
    grupos.forEach(function(g){if(!g[1].length)return;h+='<li class="cbx__g" role="presentation">'+esc(g[0])+'</li>';
      g[1].forEach(function(x){var i=L.length;L.push(x);h+='<li class="cbx__o" role="option" id="'+id+'-'+i+'" data-i="'+i+'" aria-selected="false">'+(x.livre?'Usar «'+esc(x.t)+'»':esc(x.t))+'</li>'})});
    if(!L.length)h='<li class="cbx__g" role="presentation">Nenhuma cidade encontrada</li>';
    lb.innerHTML=h;aberta=true;lb.hidden=false;inp.setAttribute('aria-expanded','true');at=-1;inp.removeAttribute('aria-activedescendant')}
  function buscar(){
    var q=inp.value.trim(),us=(o.usadas?o.usadas():[]).filter(Boolean);
    if(q.length<2){var vis={};us=us.filter(function(t){if(vis[t])return false;vis[t]=1;return true});
      pinta([['Usadas neste projeto',us.map(function(t){return{t:t}})],['Capitais',CAPITAIS.map(function(c){return{t:c[0]+' - '+c[1],r:{cidade:c[0],uf:c[1]}}}).filter(function(x){return!vis[x.t]})]]);return}
    var k=++nb;
    (window.PLLOCAIS?PLLOCAIS.buscar(q,12):Promise.resolve([])).then(function(r){
      if(k!==nb)return;
      var achou=r.map(function(x){return{t:rot(x),r:x}}),igual=achou.some(function(x){return x.t.toLowerCase()===q.toLowerCase()});
      pinta([['Cidades',achou],['Outro lugar',igual?[]:[{t:q,livre:true}]]])})}
  function marca(i){var os=lb.querySelectorAll('.cbx__o');if(!os.length)return;at=(i+os.length)%os.length;
    [].forEach.call(os,function(e,j){e.setAttribute('aria-selected',j===at?'true':'false');e.classList.toggle('is-at',j===at)});
    inp.setAttribute('aria-activedescendant',os[at].id);if(os[at].scrollIntoView)os[at].scrollIntoView({block:'nearest'})}
  function escolhe(i){var x=L[i];if(!x)return;inp.value=x.t;fechar();if(o.escolher)o.escolher(x.t,x.r||null)}
  inp.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(buscar,120)});
  inp.addEventListener('focus',function(){if(!aberta&&o.abrirNoFoco!==false)buscar()});
  inp.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){e.preventDefault();if(!aberta){buscar();return}marca(at+1);return}
    if(e.key==='ArrowUp'){e.preventDefault();if(aberta)marca(at-1);return}
    if(e.key==='Enter'&&aberta&&at>=0){e.preventDefault();escolhe(at);return}
    if(e.key==='Escape'&&aberta){e.preventDefault();e.stopPropagation();fechar();return}
    if(e.key==='Tab')fechar()});
  inp.addEventListener('blur',function(){setTimeout(function(){if(document.activeElement!==inp)fechar()},150)});
  lb.addEventListener('mousedown',function(e){e.preventDefault()});   /* o foco fica no campo */
  lb.addEventListener('click',function(e){var li=e.target.closest&&e.target.closest('.cbx__o');if(li)escolhe(+li.getAttribute('data-i'))});
  bt.addEventListener('mousedown',function(e){e.preventDefault()});
  bt.addEventListener('click',function(){if(aberta){fechar();return}inp.focus();buscar()})
}
window.PLCIDADE={ligar:ligar};
})();
