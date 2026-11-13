/* D-208 · «Enviar para» Instagram e WhatsApp, depois de gerar o PDF ou as imagens.
   A web não abre um aplicativo já com um arquivo do aparelho: no celular, o botão abre o menu de compartilhar do aparelho
   com o arquivo pronto (Web Share, DOC-06 §8: arquivo pronto antes do toque) e a pessoa toca no aplicativo; sem esse menu
   (computador), o arquivo é baixado e o aplicativo abre noutra aba para anexar. O texto diz isso (T7).
   O Instagram só aceita imagens (até 10 por publicação). Ícones de linha, em preto (T2), só para reconhecer o aplicativo. */
(function(){
var APPS={
 instagram:{n:'Instagram',url:'https://www.instagram.com/',ic:'<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.8 7.2h.01"/>'},
 whatsapp:{n:'WhatsApp',url:'https://web.whatsapp.com/',cel:'https://wa.me/',ic:'<path d="M4.6 19.4l1.1-3.6a7.6 7.6 0 1 1 2.9 2.7z"/><path d="M9.4 8.6c.1 2.9 2.7 5.6 5.9 5.9l.9-1.5-1.8-.8-.8.8c-1-.4-2.2-1.6-2.6-2.6l.8-.8-.8-1.8z"/>'}};
var cel=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
function svg(k){return'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+APPS[k].ic+'</svg>'}
function pode(fs){try{return!!(fs.length&&window.isSecureContext&&navigator.canShare&&navigator.canShare({files:fs}))}catch(e){return false}}
function baixar(fs){fs.forEach(function(f,i){setTimeout(function(){var u=URL.createObjectURL(f),a=document.createElement('a');a.href=u;a.download=f.name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000)},i*300)})}
/* montar(el, {arquivos:fn→[File], imagens:fn→[File], toast:fn(msg), semImagem:url}) */
function montar(el,o){
  if(!el)return;
  var fs=o.arquivos()||[],im=(o.imagens?o.imagens():fs.filter(function(f){return/^image\//.test(f.type)}))||[],menu=pode(im.length?im:fs);
  var h='<div class="enviar" role="group" aria-labelledby="enviar-t"><p class="enviar__t rotulo" id="enviar-t">Enviar para</p><div class="enviar__b">';
  h+=im.length?'<button type="button" class="btn2 enviar__app" data-app="instagram">'+svg('instagram')+'<span>Instagram</span></button>'
    :'<a class="btn2 enviar__app" href="'+(o.semImagem||'../exportar/')+'">'+svg('instagram')+'<span>Gerar imagem para o Instagram</span></a>';
  h+='<button type="button" class="btn2 enviar__app" data-app="whatsapp">'+svg('whatsapp')+'<span>WhatsApp</span></button></div>';
  h+='<p class="f__h enviar__h" id="enviar-h"><svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg><span>'
   +(menu?'O menu do aparelho abre com o arquivo: toque em Instagram (Feed, Stories ou Direct) ou em WhatsApp.'
    :'O arquivo é baixado e o aplicativo abre noutra aba. Lá, anexe o arquivo da pasta de downloads.')
   +(im.length?'':' O Instagram não aceita PDF: gere a imagem para publicar.')+'</span></p></div>';
  el.innerHTML=h;
  el.onclick=function(e){
    var b=e.target.closest&&e.target.closest('button[data-app]');if(!b)return;
    var app=b.getAttribute('data-app'),A=APPS[app],L=app==='instagram'?im.slice(0,10):(im.length&&fs.every(function(f){return/zip$/.test(f.type)})?im:fs);
    if(pode(L)){
      var p;try{p=navigator.share({files:L,title:'PolarLife'})}catch(x){p=Promise.reject(x)}   /* dentro do toque (ativação do usuário) */
      p.then(function(){o.toast&&o.toast('Pronto. Arquivo enviado pelo menu do aparelho.')},function(x){
        if(x&&x.name==='AbortError')return;
        baixar(L);abrir(A);o.toast&&o.toast('O menu não abriu. O arquivo foi baixado: anexe no '+A.n+'.')});
      return
    }
    baixar(L);abrir(A);o.toast&&o.toast('Arquivo baixado. No '+A.n+', anexe o arquivo da pasta de downloads.')
  }
}
function abrir(A){try{window.open(cel&&A.cel?A.cel:A.url,'_blank','noopener')}catch(e){}}
window.PLENVIAR={montar:montar,APPS:APPS};
})();
