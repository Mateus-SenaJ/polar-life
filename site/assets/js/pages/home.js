/* T-01 · home · comportamento da página */
(function(){
var $=function(i){return document.getElementById(i)};
var count=1,tm,opener;
function render(){
  var empty=count===0||location.hash==='#vazia';
  $('lista').hidden=empty||count===0;$('top').hidden=empty;$('vazio').hidden=!empty;
  document.title='Polar Life · '+(empty?'Nenhum projeto':'Seus projetos');
}
window.addEventListener('hashchange',function(){if(location.hash==='#vazia'&&count>0){}render()});render();

function closeMenu(){var m=$('menu1');if(!m.hidden){m.hidden=true;$('more1').setAttribute('aria-expanded','false')}}
$('more1').onclick=function(e){e.stopPropagation();var m=$('menu1');m.hidden=!m.hidden;this.setAttribute('aria-expanded',String(!m.hidden));if(!m.hidden)m.querySelector('button').focus()};
document.addEventListener('click',function(e){if(!$('menu1').contains(e.target))closeMenu()});
$('menu1').addEventListener('keydown',function(e){
  var b=[].slice.call(this.querySelectorAll('button')),i=b.indexOf(document.activeElement);
  if(e.key==='ArrowDown'){e.preventDefault();b[(i+1)%b.length].focus()}
  if(e.key==='ArrowUp'){e.preventDefault();b[(i-1+b.length)%b.length].focus()}
  if(e.key==='Escape'){closeMenu();$('more1').focus()}
});
function toast(msg,undo){
  clearTimeout(tm);$('toast-t').textContent=msg;$('toast-undo').hidden=!undo;$('toast').hidden=false;
  tm=setTimeout(function(){$('toast').hidden=true},5000)
}
$('menu1').addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;closeMenu();
  if(b.dataset.act==='excluir'){opener=$('more1');$('scrim').hidden=false;$('dialog').hidden=false;$('dlg-cancel').focus()}
  if(b.dataset.act==='backup')toast('Backup salvo');
});
function closeDlg(){$('scrim').hidden=true;$('dialog').hidden=true;if(opener&&count>0)opener.focus()}
$('dlg-cancel').onclick=closeDlg;$('scrim').onclick=closeDlg;
$('novo1').onclick=$('novo2').onclick=function(){location.href='novo-projeto/'};
$('dlg-del').onclick=function(){count=0;closeDlg();$('card1').hidden=true;location.hash='#vazia';render();toast('Projeto excluído',true)};
$('toast-undo').onclick=function(){count=1;$('card1').hidden=false;history.replaceState(null,'','#projetos');render();toast('Projeto restaurado')};
document.addEventListener('keydown',function(e){
  if($('dialog').hidden)return;
  if(e.key==='Escape')closeDlg();
  if(e.key==='Tab'){var a=$('dlg-cancel'),z=$('dlg-del');
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
});
})();
