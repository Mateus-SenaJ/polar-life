/* T-06 · pergunta de orientação · pop-up LED nível 3 · DOC-04 FL-02 */
(function(){
var $=function(i){return document.getElementById(i)},tm;
function toast(m){clearTimeout(tm);$('toast-t').textContent=m;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
var dlg=$('dialog'),radios=dlg.querySelectorAll('input[name=o]');
function foco(){var c=dlg.querySelector('input:checked');(c||radios[0]).focus()}
$('go').onclick=function(){var v=dlg.querySelector('input:checked').value;try{sessionStorage.setItem('pl-orientacao',v);var f=JSON.parse(sessionStorage.getItem('pl-folhas')||'null');   /* a escolha daqui vale; o papel da T-02 fica (D-159) */
    if(f&&typeof f==='object'){delete f.separar;sessionStorage.setItem('pl-folhas',JSON.stringify(f))}else sessionStorage.removeItem('pl-folhas')}catch(e){}location.href='../editor/'};
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){location.href='../resumo/';return}
  if(e.key!=='Tab')return;                                    /* mantém o foco dentro do pop-up */
  var f=[].slice.call(dlg.querySelectorAll('input:checked,a[href],button')),a=f[0],z=f[f.length-1];
  if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
  else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
});
/* D-160: em projeto real, a pergunta e o fundo mostram as fotos escolhidas; o texto fixo do HTML é só o do exemplo (DOC-04 §6) */
function pl(n,s,p){return n+' '+(n===1?s:p)}
var L=null;try{L=JSON.parse(sessionStorage.getItem('pl-fotos')||'null')}catch(e){}
if(Array.isArray(L)&&L.length&&window.PLFOTOS){
  var bg=document.querySelector('#fundo .bg-t'),d=$('dlg-d');
  if(bg)bg.textContent=pl(L.length,'foto','fotos');
  if(d)d.textContent='Há fotos verticais e horizontais neste projeto.';
  Promise.all(L.map(function(i){return PLFOTOS.ler(i).catch(function(){return null})})).then(function(fs){
    var h=0,v=0;fs.forEach(function(r){if(!r)return;if((r.w||0)>=(r.h||0))h++;else v++});
    if(d){d.textContent='';var a=document.createElement('strong'),b=document.createElement('strong');a.textContent=pl(v,'vertical','verticais');b.textContent=pl(h,'horizontal','horizontais');
      d.appendChild(document.createTextNode('Há '));d.appendChild(a);d.appendChild(document.createTextNode(' e '));d.appendChild(b);d.appendChild(document.createTextNode(' entre as '+pl(L.length,'foto','fotos')+'.'))}
  })
}
foco();
})();
