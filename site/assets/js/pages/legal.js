/* T-30 · legal · comportamento da página */
(function(){
var views=['privacidade','termos','cookies'],base='PolarLife · ';
function route(){
  var h=location.hash.slice(1); if(views.indexOf(h)<0)h='privacidade';
  views.forEach(function(v){
    document.getElementById('v-'+v).hidden=(v!==h);
    var a=document.querySelector('[data-tab="'+v+'"]');
    if(v===h)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  document.title=base+document.getElementById('v-'+h).dataset.title;
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);route();

var KEY='plc-aviso',cookie=document.getElementById('cookie');
function seen(){try{return localStorage.getItem(KEY)==='1'}catch(e){return false}}
function setSeen(){try{localStorage.setItem(KEY,'1')}catch(e){}}
function pad(){document.body.style.paddingBottom=cookie.hidden?'':(cookie.offsetHeight+32)+'px'}
if(!seen()){cookie.hidden=false;pad()}
document.getElementById('cookie-ok').onclick=function(){setSeen();cookie.hidden=true;pad()};
window.addEventListener('resize',pad);

var scrim=document.getElementById('scrim'),dlg=document.getElementById('dialog'),opener=null,sw=document.getElementById('sw-ana');
function open(){opener=document.activeElement;try{sw.setAttribute('aria-checked',localStorage.getItem('plc-analise')==='1'?'true':'false')}catch(e){}scrim.hidden=false;dlg.hidden=false;document.getElementById('dlg-cancel').focus()}
function close(){scrim.hidden=true;dlg.hidden=true;if(opener)opener.focus()}
document.getElementById('open-pref').onclick=open;
document.getElementById('dlg-cancel').onclick=close;scrim.onclick=close;
sw.onclick=function(){sw.setAttribute('aria-checked',sw.getAttribute('aria-checked')==='true'?'false':'true')};
document.getElementById('dlg-save').onclick=function(){
  try{localStorage.setItem('plc-analise',sw.getAttribute('aria-checked')==='true'?'1':'0')}catch(e){}
  setSeen();cookie.hidden=true;pad();close();
  var t=document.getElementById('toast');t.hidden=false;setTimeout(function(){t.hidden=true},2500)
};
document.addEventListener('keydown',function(e){
  if(dlg.hidden)return;
  if(e.key==='Escape')close();
  if(e.key==='Tab'){var f=dlg.querySelectorAll('button:not([aria-disabled="true"])');var a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
});
})();
