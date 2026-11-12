/* PLMAIS · «mais ajustes» por seção do inspetor (D-172). Cada seção mostra só o básico; uma seta no título
   mostra/oculta os ajustes avançados. As regras ficam aqui (seção → blocos avançados), sem mexer no código de
   cada painel: o módulo marca os blocos depois que o painel é desenhado (MutationObserver) e guarda, por seção,
   se a pessoa deixou aberto (localStorage). Se um ajuste escondido foi alterado, a seta ganha um ponto e o
   rótulo avisa — nada muda a foto sem estar à vista de um toque. */
(function(){
'use strict';
/* título da seção → textos que identificam os blocos AVANÇADOS (rótulo ou texto do bloco) */
var REGRAS={
  'Papel e orientação':['Largura','Altura'],
  'Margem e espaço':['Girar para caber','Alinhamento do bloco','Separar por orientação'],
  'Linhas de corte':['Contorno da polaroid','Comprimento da guia','Cor da guia'],
  'Rodapé e assinatura':['Assinatura'],
  'Fundo da folha':['Posição horizontal','Posição vertical','Suavizar'],
  'Filtro':['Intensidade do filtro','Comparar'],
  'Recorte e posição':['Endireitar','Girar 90°','Grade de composição','Mostrar a foto inteira'],
  'Luz e cor':['Temperatura'],
  'Detalhe':['Realces','Sombras','Vinheta'],
  'Estilo':['Itálico','Cor da inscrição'],
  'Posição':['Deslocar na vertical'],
  'Personalizar':['Faixa inferior','Margens laterais','Cantos'],
  'Medidas':['Largura da janela','Altura da janela','Margem lateral','Faixa superior','Faixa inferior','Cantos arredondados','Travar','Medidas manuais']
};
var CHAVE='pl-mais',abertas={};
try{abertas=JSON.parse(localStorage.getItem(CHAVE)||'{}')||{}}catch(e){}
function guardar(){try{localStorage.setItem(CHAVE,JSON.stringify(abertas))}catch(e){}}
function txt(el){return (el.textContent||'').replace(/\s+/g,' ').trim()}
var SETA='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

function alterado(bloco){   /* o «Resetar» do bloco só fica ativo quando o valor saiu do padrão */
  var r=bloco.querySelectorAll('.rst');for(var i=0;i<r.length;i++)if(!r[i].hidden&&!r[i].disabled&&r[i].getAttribute('aria-disabled')!=='true')return true;
  return false
}
function aplicar(sec){
  var h=sec.querySelector(':scope > .mod__h');if(!h)return;
  var titulo=txt(h).replace(/\s*Mais ajustes.*$/,'').replace(/\s*·.*$/,'');
  var regra=REGRAS[titulo];if(!regra)return;
  var blocos=[].slice.call(sec.children).filter(function(k){return k!==h}),av=[];
  blocos.forEach(function(k){var t=txt(k);if(regra.some(function(r){return t.indexOf(r)>=0})){k.setAttribute('data-av','');av.push(k)}});
  if(!av.length)return;
  var aberto=!!abertas[titulo];sec.classList.toggle('mod--mais',aberto);
  var b=h.querySelector('.mais');
  if(!b){
    b=document.createElement('button');b.type='button';b.className='mais';b.innerHTML=SETA+'<span class="mais__pt" aria-hidden="true"></span>';
    b.addEventListener('click',function(){abertas[titulo]=!abertas[titulo];if(!abertas[titulo])delete abertas[titulo];guardar();aplicar(sec)});
    h.classList.add('mod__h--mais');h.appendChild(b);sec.classList.add('mod--temmais')
  }
  var mudou=!aberto&&av.some(alterado);
  b.setAttribute('aria-expanded',String(aberto));
  b.classList.toggle('mais--mudou',mudou);
  b.setAttribute('aria-label',(aberto?'Ocultar':'Mostrar')+' mais ajustes de '+titulo+(mudou?' (há ajustes alterados escondidos)':''));
  b.title=aberto?'Menos ajustes':'Mais ajustes'
}
var pend=false;
function varrer(){pend=false;[].forEach.call(document.querySelectorAll('.mod'),aplicar)}
function agendar(){if(!pend){pend=true;(window.requestAnimationFrame||setTimeout)(varrer)}}
function iniciar(){
  varrer();
  var raiz=document.getElementById('insp')||document.body;
  if(window.MutationObserver)new MutationObserver(function(ms){
    for(var i=0;i<ms.length;i++){var t=ms[i].target;if(!(t.closest&&t.closest('.mais'))){agendar();return}}
  }).observe(raiz,{childList:true,subtree:true});
  document.addEventListener('input',agendar,true);document.addEventListener('change',agendar,true)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
window.PLMAIS={REGRAS:REGRAS,varrer:varrer};
})();
