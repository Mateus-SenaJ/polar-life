/* Polar Life · entrar com Google (D-147g). Fluxo OpenID Connect por redirecionamento (response_type=id_token):
   a página vai a accounts.google.com e volta com o id_token no fragmento (#). Nenhum script, fonte ou iframe do Google
   é carregado (T6) e nada sai deste aparelho além da ida ao Google, que a própria pessoa escolhe (T5).
   Sem ID de cliente configurado, o botão continua no modo demonstração (T7: não fingir que o Google foi acessado). */
(function(){
'use strict';
/* ID público do cliente OAuth (Google Cloud → APIs e serviços → Credenciais). Não é segredo. */
var CLIENT_ID='393241385100-mi0hngc1gcgr416vktf18tiaf7karel5.apps.googleusercontent.com';
var AUTH='https://accounts.google.com/o/oauth2/v2/auth',CHAVE='pl-google-pedido';

function aleatorio(){var b=new Uint8Array(16);window.crypto.getRandomValues(b);return Array.prototype.map.call(b,function(x){return ('0'+x.toString(16)).slice(-2)}).join('')}
function ativo(){return !!(CLIENT_ID&&window.crypto&&window.crypto.getRandomValues&&window.sessionStorage)}
/* a volta é sempre a própria tela de entrar, na raiz do site (Vercel ou GitHub Pages) */
function retornoUrl(){return location.origin+location.pathname.replace(/[^\/]*$/,'')}

function iniciar(voltar){
  if(!ativo())return false;
  var pedido={state:aleatorio(),nonce:aleatorio(),voltar:voltar||'',em:Date.now()};
  try{sessionStorage.setItem(CHAVE,JSON.stringify(pedido))}catch(e){return false}
  location.assign(AUTH+'?'+[
    ['client_id',CLIENT_ID],['redirect_uri',retornoUrl()],['response_type','id_token'],
    ['scope','openid email profile'],['state',pedido.state],['nonce',pedido.nonce],['prompt','select_account']
  ].map(function(p){return p[0]+'='+encodeURIComponent(p[1])}).join('&'));
  return true
}

function b64url(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';
  var bin=atob(s),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  return new TextDecoder().decode(u)}

/* Lê a volta do Google. Devolve null (não é volta), {erro} ou {email,nome,voltar}.
   Confere state, nonce, aud, iss, exp e e-mail verificado. A assinatura não é conferida aqui: a sessão é local
   (nenhum servidor confia neste token) e a CSP só permite conexões ao próprio site. */
function lerRetorno(){
  var h=location.hash||'';if(h.indexOf('id_token=')<0&&h.indexOf('error=')<0)return null;
  var q={};h.slice(1).split('&').forEach(function(p){var i=p.indexOf('=');if(i>0)q[decodeURIComponent(p.slice(0,i))]=decodeURIComponent(p.slice(i+1).replace(/\+/g,' '))});
  try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}   /* tira o token da barra e do histórico */
  var pedido=null;try{pedido=JSON.parse(sessionStorage.getItem(CHAVE)||'null');sessionStorage.removeItem(CHAVE)}catch(e){}
  if(q.error)return {erro:q.error==='access_denied'?'cancelado':'google'};
  if(!pedido||q.state!==pedido.state)return {erro:'estado'};
  var c;try{c=JSON.parse(b64url(String(q.id_token).split('.')[1]||''))}catch(e){return {erro:'token'}}
  var agoraS=Math.floor(Date.now()/1000);
  if(c.aud!==CLIENT_ID||(c.iss!=='https://accounts.google.com'&&c.iss!=='accounts.google.com')||!(c.exp>agoraS)||c.nonce!==pedido.nonce)return {erro:'token'};
  if(!c.email||c.email_verified===false)return {erro:'email'};
  return {email:String(c.email).toLowerCase(),nome:String(c.name||c.given_name||'').trim(),voltar:pedido.voltar}
}

window.PLGOOGLE={ativo:ativo,iniciar:iniciar,lerRetorno:lerRetorno,retornoUrl:retornoUrl,
  _definirId:function(id){CLIENT_ID=String(id||'')}};   /* só para testes */
})();
