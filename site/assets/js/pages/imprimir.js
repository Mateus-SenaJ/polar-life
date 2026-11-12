/* T-21 · Imprimir agora e calibração · DOC-08 §6 (calibrarImpressora: fx = 100/X, fy = 100/Y, perfil por impressora e papel)
   A página de teste é real (iframe + window.print por clique). «Imprimir agora» das folhas depende do PDF (gerador ainda não ligado).
   Estados de revisão por hash: #estado-bloqueio (pop-up bloqueado) · #estado-calibrado */
(function(){
var $=function(i){return document.getElementById(i)},tm;
function toast(m){clearTimeout(tm);$('toast-t').textContent=m;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
function pl(n,s,p){return n+' '+(n===1?s:p)}
function pc(n){return (Math.round(n*1000)/10).toFixed(1).replace('.',',')+'%'}
function chave(){var t='';try{t=(sessionStorage.getItem('pl-quadro')||'')+'|'+(sessionStorage.getItem('pl-folhas')||'')+'|'+(sessionStorage.getItem('pl-colagem')||'')}catch(e){}for(var h=5381,i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return String(h)}
var estado=(location.hash.match(/^#estado-([\w-]+)$/)||[])[1];
var P=null;try{P=JSON.parse(sessionStorage.getItem('pl-prevoo')||'null')}catch(e){}
var papel=P&&P.ok?P.papel:'A4',W=P&&P.ok?P.w:210,H=P&&P.ok?P.h:297;
if(window.matchMedia('(max-width:767px)').matches||window.matchMedia('(pointer:coarse)').matches){$('so-desktop').hidden=false;$('corpo').hidden=true;$('sub').textContent='';return}

/* ---- perfis guardados (preferência do aparelho, por impressora e papel) ---- */
function perfis(){try{return JSON.parse(localStorage.getItem('pl-calib')||'{}')||{}}catch(e){return{}}}
function perfilDoPapel(){var o=perfis(),ks=Object.keys(o).filter(function(k){return k.split('|')[1]===papel});return ks.length?{k:ks[ks.length-1],v:o[ks[ks.length-1]]}:null}
function dataBR(iso){var d=new Date(iso);return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear()}
function mostraCalibrado(nome,v){
  $('cal-ok').hidden=false;$('cal-ok-t').textContent='Calibrado em '+dataBR(v.data);
  $('cal-ok-d').textContent=nome+' · '+papel+' · escala horizontal '+pc(v.fx)+' · vertical '+pc(v.fy)+'.';
  ['p1','p2','p3'].forEach(function(i){$(i).classList.add('feito')});$('aviso-cal').hidden=true
}

/* ---- topo: papel e botão de imprimir ---- */
$('info-papel').textContent=P&&P.ok?papel+' · '+pl(P.n,'folha','folhas')+' · '+(P.orient==='paisagem'?'paisagem':'retrato'):'Gere o arquivo antes: a impressão direta usa o PDF das folhas.';
$('imprimir-t').textContent='Imprimir agora'+(P&&P.ok?' ('+pl(P.n,'folha','folhas')+')':'');
if(!(P&&P.ok)){$('imprimir').disabled=true;$('imprimir').setAttribute('aria-disabled','true')}
var cal0=perfilDoPapel();
if(cal0)mostraCalibrado(cal0.k.split('|')[0],cal0.v);else $('aviso-cal').hidden=false;
function imprimirBytes(bytes){var u=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),f=document.createElement('iframe');f.setAttribute('aria-hidden','true');f.tabIndex=-1;f.style.cssText='position:fixed;left:-9999px;width:1px;height:1px;border:0';f.onload=function(){try{f.contentWindow.focus();f.contentWindow.print()}finally{setTimeout(function(){URL.revokeObjectURL(u);f.remove()},30000)}};f.src=u;document.body.appendChild(f)}
$('imprimir').onclick=function(){
  if(this.disabled)return;
  var prof=perfilDoPapel();
  if(prof&&window.PLGERADOR){PLGERADOR.pdf(PLGERADOR.projeto(),{f:'pdf',escala:{fx:prof.v.fx,fy:prof.v.fy}}).then(function(r){imprimirBytes(r.arquivos[0].bytes)},function(){toast('Não foi possível preparar o PDF para imprimir.')});return}
  if(!window.PLFOTOS){toast('Gere o PDF antes de imprimir.');return}
  PLFOTOS.lerArquivos(chave()).then(function(a){var pdf=a.filter(function(x){return x.tipo==='application/pdf'})[0];if(pdf)imprimirBytes(pdf.bytes);else toast('Gere o PDF antes de imprimir.')},function(){toast('Gere o PDF antes de imprimir.')})
};

/* ---- passo 1: página de teste (régua de 100 mm no tamanho real) ---- */
function paginaTeste(){
  var t='';for(var i=0;i<=10;i++)t+='<i class="th" style="left:'+(i*10)+'mm"></i><i class="tv" style="top:'+(i*10)+'mm"></i>';
  return'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Polar Life · página de teste</title><style>'
   +'@page{size:'+W+'mm '+H+'mm;margin:0}html,body{margin:0;padding:0;background:#fff;color:#000;font:12px/1.4 Arial,sans-serif}'
   +'.p{position:relative;width:'+W+'mm;height:'+H+'mm;overflow:hidden}.t{position:absolute;left:20mm;top:14mm;width:'+(W-40)+'mm}.t b{font-size:15px}'
   +'.h{position:absolute;left:20mm;top:60mm;width:100mm;height:0;border-top:.4mm solid #000}.v{position:absolute;left:20mm;top:80mm;width:0;height:100mm;border-left:.4mm solid #000}'
   +'.h i,.v i{position:absolute;display:block;background:#000}.th{top:0;width:.2mm;height:3mm;margin-top:-3mm}.tv{left:0;height:.2mm;width:3mm}'
   +'.l{position:absolute;font-size:11px}</style></head><body><div class="p"><div class="t"><b>Polar Life · página de teste</b><br>Imprima em <b>Tamanho real (100%)</b>, margens <b>Nenhuma</b>. Meça os dois traços com uma régua; cada um deve ter 100 mm.</div>'
   +'<div class="h">'+t.replace(/<i class="tv"[^>]*><\/i>/g,'')+'</div><div class="l" style="left:20mm;top:64mm">Traço horizontal · 100 mm</div>'
   +'<div class="v">'+t.replace(/<i class="th"[^>]*><\/i>/g,'')+'</div><div class="l" style="left:26mm;top:84mm">Traço vertical · 100 mm</div></div></body></html>'
}
function mostraBloqueio(){var b=$('bloq');b.hidden=false;$('p1').classList.remove('feito');b.focus()}
function pdfTeste(){if(!window.PDFLib)return Promise.resolve(null);return fetch('../../../assets/fonts/pdf/ibm-plex-mono-400.ttf').then(function(r){return r.arrayBuffer()}).then(function(bytes){return PDFLib.PDFDocument.create({updateMetadata:false}).then(function(d){d.registerFontkit(window.fontkit);d.catalog.set(PDFLib.PDFName.of('ViewerPreferences'),d.context.obj({PrintScaling:PDFLib.PDFName.of('None')}));return d.embedFont(bytes,{subset:true}).then(function(font){var pg=d.addPage([W/25.4*72,H/25.4*72]),k=72/25.4,x=20*k,y=(H-80)*k,i;pg.drawLine({start:{x:x,y:y},end:{x:x+100*k,y:y},thickness:.1*k});pg.drawLine({start:{x:x,y:y},end:{x:x,y:y-100*k},thickness:.1*k});for(i=0;i<=10;i++){pg.drawLine({start:{x:x+i*10*k,y:y},end:{x:x+i*10*k,y:y+3*k},thickness:.1*k});pg.drawLine({start:{x:x,y:y-i*10*k},end:{x:x+3*k,y:y-i*10*k},thickness:.1*k})}pg.drawText('100 mm',{x:x+40*k,y:y+5*k,size:9,font:font});return d.save()})})})}
function imprimeTeste(){
  $('bloq').hidden=true;
  try{
    var old=$('quadro-teste');if(old)old.remove();
    var f=document.createElement('iframe');f.id='quadro-teste';f.setAttribute('aria-hidden','true');f.tabIndex=-1;f.style.cssText='position:fixed;left:-9999px;top:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    var d=f.contentDocument;if(!d||!f.contentWindow)throw new Error('sem janela');
    pdfTeste().then(function(bytes){if(bytes){var u=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));f.onload=function(){f.contentWindow.focus();f.contentWindow.print();setTimeout(function(){URL.revokeObjectURL(u)},30000)};f.src=u}else{d.open();d.write(paginaTeste());d.close();setTimeout(function(){f.contentWindow.focus();f.contentWindow.print()},150)}$('p1').classList.add('feito');$('mx').focus()},mostraBloqueio)
  }catch(e){mostraBloqueio()}
}
$('teste').onclick=imprimeTeste;
if(estado==='bloqueio')mostraBloqueio();

/* ---- passo 2 e 3: medidas, escala, guardar ---- */
function num(s){var n=parseFloat(String(s).replace(',','.'));return isFinite(n)?n:NaN}
function confere(){
  var x=num($('mx').value),y=num($('my').value),ok=x>=80&&x<=120&&y>=80&&y<=120;
  $('mx').setAttribute('aria-invalid',String(!(x>=80&&x<=120)));$('my').setAttribute('aria-invalid',String(!(y>=80&&y<=120)));
  var e=$('m-erro');e.hidden=ok;e.textContent=ok?'':'Escreva uma medida entre 80 e 120 mm em cada traço.';
  if(ok){$('res').textContent='Escala: horizontal '+pc(100/x)+' · vertical '+pc(100/y)+'.'}
  $('guardar').disabled=!ok;$('guardar').setAttribute('aria-disabled',String(!ok));
  return ok?{fx:100/x,fy:100/y}:null
}
$('mx').oninput=$('my').oninput=function(){confere();if($('mx').value!==''&&$('my').value!=='')$('p2').classList.add('feito')};
$('guardar').onclick=function(){
  var s=confere();if(!s)return;
  var nome=($('nome').value||'').trim().replace(/\|/g,'')||'Minha impressora',v={fx:s.fx,fy:s.fy,data:new Date().toISOString()};
  try{var o=perfis();o[nome+'|'+papel]=v;localStorage.setItem('pl-calib',JSON.stringify(o));sessionStorage.setItem('pl-calibrou','1')}catch(e){toast('Não foi possível guardar neste navegador.');return}
  mostraCalibrado(nome,v);$('cal-ok').focus();toast('Calibração guardada para '+papel+'.')
};
if(estado==='calibrado'&&!cal0)mostraCalibrado('Minha impressora',{fx:1,fy:1.002,data:new Date().toISOString()});
confere()
})();
