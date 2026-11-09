/* T-06 · pergunta de orientação · pop-up LED nível 3 · DOC-04 FL-02 */
(function(){
var $=function(i){return document.getElementById(i)},tm;
function toast(m){clearTimeout(tm);$('toast-t').textContent=m;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
var dlg=$('dialog'),radios=dlg.querySelectorAll('input[name=o]');
function foco(){var c=dlg.querySelector('input:checked');(c||radios[0]).focus()}
$('go').onclick=function(){var v=dlg.querySelector('input:checked').value;try{sessionStorage.setItem('pl-orientacao',v);sessionStorage.removeItem('pl-folhas')}catch(e){}location.href='../editor/'};
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){location.href='../resumo/';return}
  if(e.key!=='Tab')return;                                    /* mantém o foco dentro do pop-up */
  var f=[].slice.call(dlg.querySelectorAll('input:checked,a[href],button')),a=f[0],z=f[f.length-1];
  if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
  else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
});
foco();
})();
