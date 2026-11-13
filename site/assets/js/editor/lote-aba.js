/* D-208 · Aba «Lote» do Quadro: muda todas as fotos de uma vez — a cidade por data (as fotos do mesmo dia juntas), a fonte,
   o tamanho, a posição, o espaçamento, a cor e os formatos da data e do local das legendas. Cada foto ainda pode ter o
   estilo próprio (Legendas › Só nesta foto); aqui dá para manter ou substituir esse estilo. Tudo entra no histórico (Ctrl+Z). */
(function(){
var Q=window.PLQ,LT=window.PLTEXTO,$=function(i){return document.getElementById(i)};if(!Q||!LT||!$('p-lote'))return;
var TAMS=[[7,'P'],[8,'M'],[10,'G'],[12,'GG']],CORES=[['preto','Preto'],['azul','Azul'],['laranja','Laranja']],subst=false;
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function z(n){return(n<10?'0':'')+n}
function L(){return window.PLLEG&&PLLEG.L?PLLEG.L():Q.ST()[0].leg}
function linhas(l){return l&&l.pad&&l.pad.on&&l.pad.l?l.pad.l:null}
function pl(n,s,p){return n+' '+(n===1?s:p)}
function comEstilo(){var r=[],i;for(i=1;i<=Q.N;i++)if(Q.ST()[i].lgx)r.push(i);return r}
/* valor que vale para todas (o da Legenda 1 quando há duas linhas) */
function atual(){var l=L()||{},pd=linhas(l),a=pd?LT.padLinha(pd[0]):null;
  return{font:a?a.font:(l.loc&&l.loc.font),pt:a?a.pt:(l.loc&&l.loc.pt),cor:a?a.cor:(l.loc&&l.loc.cor),al:l.al||'esq',dy:l.dy||0,lsp:l.lsp||0,av:LT.av(l)}}
function opcFontes(v){var FL=window.PLFONTESLOCAIS;return Object.keys(LT.CAT).map(function(c){var a=LT.FONTES.filter(function(x){if(x.c!==c)return false;var it=FL&&x.c==='pc'&&FL.porNome(x.n);return!(it&&it.opc&&FL.estado(x.n)!=='ok'&&FL.estado(x.n)!=='pedir')});
  return a.length?'<optgroup label="'+LT.CAT[c]+'">'+a.map(function(x){return'<option value="'+esc(x.n)+'"'+(x.n===v?' selected':'')+'>'+esc(x.n)+'</option>'}).join('')+'</optgroup>':''}).join('')}
function seg(nome,rot,ops,v){return'<div class="f"><span class="f__l" id="lt-'+nome+'-l">'+rot+'</span><div class="seg'+(ops.length===3?' seg--3':'')+'" role="radiogroup" aria-labelledby="lt-'+nome+'-l">'
  +ops.map(function(o){return'<label class="seg__o"><input type="radio" name="lt-'+nome+'" value="'+o[0]+'" data-lt="'+nome+'"'+(String(o[0])===String(v)?' checked':'')+'><span>'+o[1]+'</span></label>'}).join('')+'</div></div>'}
function faixa(k,rot,v,min,max,step,u){return'<div class="f"><div class="f__top"><label class="f__l" for="lt-'+k+'">'+rot+'</label><span class="mono" id="lt-'+k+'-v">'+String(v).replace('.',',')+u+'</span></div><input type="range" id="lt-'+k+'" data-lt="'+k+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+v+'"></div>'}
function dataBR(d){var a=d.split('-');return a.length===3?a[2]+'/'+a[1]+'/'+a[0]:d}
function resumoCidade(ns){var cs=[];ns.forEach(function(i){var m=Q.meta(i);if(m.cs==='sem')return;var c=m.cidade||(m.lugar&&LT.lugarTxt?LT.lugarTxt(m.lugar,Q.ST()[0].leg):'');if(c&&cs.indexOf(c)<0)cs.push(c)});
  return!cs.length?'Sem cidade':cs.length===1?cs[0]:pl(cs.length,'cidade','cidades')+': '+cs.slice(0,2).join(', ')+(cs.length>2?'…':'')}
function montar(){
  var P=$('p-lote');if(!P||P.hidden)return;
  var a=atual(),G=Q.porDia?Q.porDia():{},dias=Object.keys(G).filter(Boolean).sort(),sd=G['']||[],ce=comEstilo(),h='';
  h+='<p class="f__h lt-intro"><svg class="ico sm"><use href="#i-info"/></svg><span>Aqui a mudança vale para as '+pl(Q.N,'foto','fotos')+' do projeto. Para mudar uma foto só, use Legendas › Só nesta foto.</span></p>';
  /* 1 · cidade por data */
  h+='<section class="mod" aria-labelledby="lt-c-t"><h3 class="mod__h rotulo rotulo--m" id="lt-c-t">Cidade por data</h3><p class="f__h">As fotos do mesmo dia recebem a mesma cidade. Escolha na lista ou digite outro lugar.</p><ul class="lt-dias">';
  dias.forEach(function(d,k){var ns=G[d];
    h+='<li class="lt-dia"><div class="lt-dia__top"><strong>'+dataBR(d)+'</strong><span class="mono">'+pl(ns.length,'foto','fotos')+'</span></div><p class="f__h lt-dia__c">'+esc(resumoCidade(ns))+'</p>'
      +'<div class="num num--l"><input id="lt-cid-'+k+'" data-dia="'+d+'" maxlength="60" autocomplete="off" placeholder="Buscar cidade para este dia" aria-label="Cidade das fotos de '+dataBR(d)+'"></div></li>'});
  if(sd.length)h+='<li class="lt-dia"><div class="lt-dia__top"><strong>Sem data</strong><span class="mono">'+pl(sd.length,'foto','fotos')+'</span></div><p class="f__h">Sem a data, a cidade vai foto a foto (Legendas › Avançado).</p></li>';
  if(!dias.length&&!sd.length)h+='<li class="f__h">Sem fotos no projeto.</li>';
  h+='</ul></section>';
  /* 2 · legendas em todas */
  h+='<section class="mod" aria-labelledby="lt-l-t"><h3 class="mod__h rotulo rotulo--m" id="lt-l-t">Legendas em todas as fotos</h3>'
    +'<div class="f"><label class="f__l" for="lt-font">Fonte</label><div class="sel"><select id="lt-font" data-lt="font">'+opcFontes(a.font)+'</select><svg class="ico sm" aria-hidden="true"><use href="#i-down"/></svg></div></div>'
    +seg('pt','Tamanho',TAMS.map(function(t){return[t[0],t[1]]}),a.pt)
    +seg('cor','Cor',CORES,a.cor||'preto')
    +seg('al','Alinhamento',[['esq','Esquerda'],['centro','Centro'],['dir','Direita']],a.al)
    +faixa('dy','Deslocar para baixo',a.dy,0,5,.1,' mm')
    +faixa('lsp','Espaçamento entre as legendas',a.lsp,0,6,.5,' mm')
    +'<div class="f"><label class="f__l" for="lt-df">Formato da data</label><div class="sel"><select id="lt-df" data-lt="df">'+LT.DATA_AV.map(function(x){return'<option value="'+x[0]+'"'+(x[0]===a.av.df?' selected':'')+'>'+x[1]+'</option>'}).join('')+'</select><svg class="ico sm" aria-hidden="true"><use href="#i-down"/></svg></div></div>'
    +'<div class="f"><label class="f__l" for="lt-lf">Formato da localização</label><div class="sel"><select id="lt-lf" data-lt="lf">'+LT.LOC_AV.map(function(x){return'<option value="'+x[0]+'"'+(x[0]===a.av.lf?' selected':'')+'>'+x[1]+'</option>'}).join('')+'</select><svg class="ico sm" aria-hidden="true"><use href="#i-down"/></svg></div></div>'
    +'</section>';
  /* 3 · estilo próprio */
  h+='<section class="mod" aria-labelledby="lt-e-t"><h3 class="mod__h rotulo rotulo--m" id="lt-e-t">Fotos com estilo próprio</h3>'
    +'<p class="f__h" id="lt-e-n">'+(ce.length?pl(ce.length,'foto tem','fotos têm')+' fonte, tamanho ou posição próprios: '+ce.map(function(i){return'Foto '+Q.p2(i)}).slice(0,6).join(', ')+(ce.length>6?'…':'')+'.':'Nenhuma foto tem estilo próprio: tudo o que você muda aqui vale em todas.')+'</p>'
    +(ce.length?'<div class="sw-row"><div><span class="f__l" id="lt-sub-l">Substituir o estilo próprio</span><p class="f__h">'+(subst?'O que você mudar aqui vale também nessas fotos.':'Essas fotos mantêm o que têm de próprio.')+'</p></div><button type="button" class="sw" id="lt-sub" role="switch" aria-checked="'+subst+'" aria-labelledby="lt-sub-l"><span></span></button></div>'
      +'<button type="button" class="btn2 btn2--sm" id="lt-limpar">Voltar todas ao estilo de todas</button>':'')
    +'</section>';
  P.innerHTML=h;
  if(window.PLCIDADE)[].forEach.call(P.querySelectorAll('[data-dia]'),function(inp){var d=inp.getAttribute('data-dia');
    PLCIDADE.ligar(inp,{usadas:Q.cidadesUsadas,escolher:function(rot){var ns=G[d]||[];Q.cidadeEm(ns,rot,'lote:cidade');Q.toast('«'+rot+'» em '+pl(ns.length,'foto','fotos')+' de '+dataBR(d)+' · Desfazer',true);montar();var e=$(inp.id);if(e)e.focus()}})})
}
/* muda o estilo de todas; com «Substituir», tira das fotos o campo próprio equivalente */
function todas(fn,k,campo){
  var l=L();if(!l)return;fn(l);
  if(subst&&campo)for(var i=1;i<=Q.N;i++){var e=Q.ST()[i];if(e.lgx){delete e.lgx[campo];if(campo==='pt')delete e.lgx.esc;var v=LT.normLgx(e.lgx);if(v)e.lgx=v;else delete e.lgx}}
  Q.commit(k);if(window.PLLEG)PLLEG.render()}
function cadaLinha(l,f){var pd=linhas(l);if(pd)pd.forEach(f);['txt','data','loc'].forEach(function(k){if(l[k])f(l[k])})}
function aplicar(k,v){
  if(k==='font')todas(function(l){cadaLinha(l,function(o){o.font=v;var e=LT.estilosDe(v,o);if(o.b&&!e.b.ok)delete o.b;if(o.it&&!e.it.ok)delete o.it})},'lote:font','font');
  else if(k==='pt')todas(function(l){var pd=linhas(l);if(pd)pd.forEach(function(o){o.pt=+v});else{l.data.pt=+v;l.loc.pt=+v}},'lote:pt','pt');
  else if(k==='cor')todas(function(l){cadaLinha(l,function(o){o.cor=v})},'lote:cor');
  else if(k==='al')todas(function(l){l.al=v},'lote:al','al');
  else if(k==='dy')todas(function(l){l.dy=+v},'lote:dy','dy');
  else if(k==='lsp')todas(function(l){l.lsp=+v},'lote:lsp','lsp');
  else if(k==='df'||k==='lf'){todas(function(l){l.av=Object.assign({},l.av||{});l.av[k]=k==='df'?+v:v},'lote:'+k);if(window.PLLEG&&PLLEG.refazerTodas)PLLEG.refazerTodas()}
  Q.toast(k==='dy'||k==='lsp'?'Valeu para todas as fotos':'Legendas de todas as fotos atualizadas · Desfazer',k!=='dy'&&k!=='lsp')}
var P=$('p-lote');
P.addEventListener('change',function(e){var t=e.target,k=t.getAttribute&&t.getAttribute('data-lt');if(!k||t.type==='range')return;aplicar(k,t.value);montar();var n=P.querySelector('[data-lt="'+k+'"]'+(t.type==='radio'?'[value="'+t.value+'"]':''));if(n)n.focus()});
P.addEventListener('input',function(e){var t=e.target,k=t.getAttribute&&t.getAttribute('data-lt');if(!k||t.type!=='range')return;
  var l=L();if(!l)return;l[k]=+t.value;if(subst)for(var i=1;i<=Q.N;i++){var x=Q.ST()[i].lgx;if(x){delete x[k];if(!LT.normLgx(x))delete Q.ST()[i].lgx}}
  Q.commit('lote:'+k);if(window.PLLEG)PLLEG.render();var o=$('lt-'+k+'-v');if(o)o.textContent=String(t.value).replace('.',',')+' mm'});
P.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button');if(!b)return;
  if(b.id==='lt-sub'){subst=!subst;montar();var s=$('lt-sub');if(s)s.focus();return}
  if(b.id==='lt-limpar'){var ce=comEstilo();ce.forEach(function(i){delete Q.ST()[i].lgx});Q.commit('lote:limpar');if(window.PLLEG)PLLEG.render();montar();Q.toast(pl(ce.length,'foto voltou','fotos voltaram')+' ao estilo de todas · Desfazer',true)}});
window.PLLOTEABA={render:montar};
})();
