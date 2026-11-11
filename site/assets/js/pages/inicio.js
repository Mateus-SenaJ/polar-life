/* T-32 · Início (depois do login) · brief §2 · D-118 (Início), D-120 (modelos com emoji), D-054 (colagens não gastam folha)
   Os 8 modelos e as 6 colagens são dados versionados aqui (D-061): nada é inventado na tela.
   Aplicar um modelo grava o formato (ST[0].fr) e o estilo da legenda (ST[0].leg) no projeto atual
   (ou cria um) e abre o editor. O emoji fica no cartão do modelo; no texto da legenda ele não entra
   (D-120: a saída de emoji no PDF só chega na fase 4 do Editor v3). */
(function(){
'use strict';
var $=function(i){return document.getElementById(i)};
var C=window.PLCONTA,P=window.PLPROJETOS,T=window.PLTEXTO;

/* ---------- catálogo de formatos (o mesmo da aba Molduras · FN-03) ---------- */
var FMT={
 classico:{n:'Clássico',w:88,h:107,lado:6,topo:6,jh:76},
 mini:{n:'Mini quadrado',w:60,h:73,lado:6,topo:6,jh:48},
 pocket:{n:'Retro Pocket',w:66,h:99,lado:3,topo:3,jh:79},
 imini:{n:'Instax Mini',w:54,h:86,lado:4,topo:5,jh:62},
 isq:{n:'Instax Square',w:72,h:86,lado:5,topo:5,jh:62},
 iwide:{n:'Instax Wide',w:108,h:86,lado:4.5,topo:5,jh:62}
};
/* estilos prontos (DV-03): os mesmos 8 da aba Legendas */
var PRESET={simples:'Simples',contornada:'Contornada',etiqueta:'Etiqueta',carimbo:'Carimbo',pin:'Pin de local',calendario:'Calendário',bilhete:'Bilhete',manuscrito:'Manuscrito'};
var PRESET_P={simples:{},contornada:{},etiqueta:{'txt.caixa':'normal'},carimbo:{'txt.caixa':'maiusc','txt.esp':0.1},pin:{},calendario:{},bilhete:{'txt.font':'Special Elite'},manuscrito:{'txt.font':'Caveat','txt.caixa':'normal','txt.esp':0}};
var COR={preto:'#000000',azul:'#006194',laranja:'#FD761A'};

/* ---------- os 8 modelos (brief §2.4) ---------- */
var MODELOS=[
 {id:'praia',nome:'Praia',emoji:'🌊',fmt:'classico',fonte:'Shadows Into Light',preset:'manuscrito',cor:'azul',al:'esq',
  texto:'Dias de sol',dataOn:true,dataFmt:11,locOn:false,uso:'Férias, verão, mar',img:'polaroid-praia.svg',
  prev:[['Dias de sol','txt'],['jul/26','data']]},
 {id:'serra',nome:'Serra',emoji:'🏔️',fmt:'pocket',fonte:'Special Elite',preset:'bilhete',cor:'preto',al:'esq',
  texto:'Ar da serra',dataOn:true,dataFmt:3,locOn:true,uso:'Montanha, frio, estrada',img:'polaroid-montanha.svg',
  prev:[['Campos do Jordão - SP','loc'],['14/07/26','data'],['Ar da serra','txt']]},
 {id:'cidade',nome:'Cidade',emoji:'🌆',fmt:'imini',fonte:'Courier Prime',preset:'etiqueta',cor:'preto',al:'esq',
  texto:'Noite na cidade',dataOn:false,locOn:false,uso:'Rolê urbano, viagem a capitais',img:'polaroid-cidade.svg',
  prev:[['Noite na cidade','txt']]},
 {id:'por-do-sol',nome:'Pôr do sol',emoji:'🌅',fmt:'iwide',fonte:'Sacramento',preset:'simples',cor:'laranja',al:'esq',
  texto:'Fim de tarde',dataOn:false,locOn:false,uso:'Paisagens horizontais, céu',img:'polaroid-por-do-sol.svg',
  prev:[['Fim de tarde','txt']]},
 {id:'aniversario',nome:'Aniversário',emoji:'🎂',fmt:'isq',fonte:'Dancing Script',preset:'contornada',cor:'azul',al:'esq',
  texto:'Mais um ano',dataOn:true,dataFmt:9,locOn:false,uso:'Festa, presente de aniversário',img:'polaroid-aniversario.svg',
  prev:[['Mais um ano','txt'],['14 de julho','data']]},
 {id:'viagem',nome:'Viagem',emoji:'✈️',fmt:'classico',fonte:'Caveat',preset:'pin',cor:'preto',al:'esq',
  texto:'Até a próxima',dataOn:false,locOn:true,uso:'Roteiro com várias cidades',img:'polaroid-viagem.svg',
  prev:[['Campos do Jordão, SP','loc'],['Até a próxima','txt']]},
 {id:'nos-dois',nome:'Nós dois',emoji:'❤️',fmt:'mini',fonte:'Allura',preset:'simples',cor:'preto',al:'esq',
  texto:'Nós dois',dataOn:false,locOn:false,uso:'Casal, presente a dois',img:'polaroid-casal.svg',
  prev:[['Nós dois','txt']]},
 {id:'neste-dia',nome:'Neste dia',emoji:'📅',fmt:'classico',fonte:'Cutive Mono',preset:'calendario',cor:'azul',al:'esq',
  texto:'Pra lembrar',dataOn:true,dataFmt:0,locOn:false,uso:'Aniversário de data, retrospectiva',img:'polaroid-calendario.svg',
  prev:[['14.07.26','data'],['Pra lembrar','txt']]}
];
/* ---------- as 6 colagens (brief §2.5 · DOC-06 §4) ---------- */
var COLAGENS=[
 {formato:'Feed 1:1',px:'1080 × 1080',img:'colagem-feed.svg',w:800,h:800,itens:[
  {nome:'Mural do mês',frase:'Tudo o que cabe em nove quadros.'},
  {nome:'Mesa espalhada',frase:'Do jeito que ficaram na mesa.'}]},
 {formato:'Retrato 4:5',px:'1080 × 1350',img:'colagem-retrato.svg',w:800,h:1000,itens:[
  {nome:'Capa e destaques',frase:'Uma foto grande e as que vieram junto.'},
  {nome:'Linha do tempo',frase:'O mês, na ordem em que aconteceu.'}]},
 {formato:'Stories 9:16',px:'1080 × 1920',img:'colagem-stories.svg',w:800,h:1422,itens:[
  {nome:'Varal',frase:'Um varal para os dias de sol.'},
  {nome:'Tira',frase:'Quatro fotos, uma história só.'}]}
];

/* ---------- utilidades ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function nf(n){return String(Math.round(n*10)/10).replace('.',',')}
function setp(o,k,v){var a=k.split('.'),i;for(i=0;i<a.length-1;i++)o=o[a[i]];o[a[a.length-1]]=v}
function lerSess(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
function listaFotos(v){try{var a=JSON.parse(v||'null');if(Array.isArray(a)&&a.length>=1&&a.length<=400&&a.every(function(x){return x>=1&&x<=400&&x%1===0}))return a}catch(e){}return null}
function famFonte(n){if(T&&T.famLG){var f=T.famLG(n);if(f&&f.f)return f.f}return "'"+n+"',cursive"}
function famMono(){return "'IBM Plex Mono',ui-monospace,monospace"}
function quando(ts){
  var m=Math.max(0,Math.round((Date.now()-ts)/60000));
  if(m<1)return 'Editado agora';
  if(m===1)return 'Editado há 1 min';
  if(m<60)return 'Editado há '+m+' min';
  var h=Math.round(m/60);if(h<24)return 'Editado há '+h+(h===1?' hora':' horas');
  var d=Math.round(h/24);if(d===1)return 'Editado ontem';
  if(d<30)return 'Editado há '+d+' dias';
  var me=Math.round(d/30);if(me===1)return 'Editado há 1 mês';
  if(me<12)return 'Editado há '+me+' meses';
  var a=Math.round(me/12);return 'Editado há '+a+(a===1?' ano':' anos');
}

/* ---------- cabeçalho: conta, entrar e painel do admin ---------- */
function cabecalho(){
  var plano=C&&C.plano?C.plano():null;
  var conta=$('conta'),t=$('conta-t');
  if(conta&&t){
    if(plano){conta.href='../conta/';t.textContent='Conta · '+(plano.id==='admin'?'Admin':plano.nome)}
    else{conta.href='../entrar/';t.textContent='Entrar'}
  }
  var p=$('painel');
  if(p)p.hidden=!(plano&&plano.id==='admin');      /* o Painel é só da conta Admin (T-33) */
}

/* ---------- banners: monta o carrossel e leva o LED para o banner visível ---------- */
function moverLed(i){
  var f=$('faixa'),led=$('led-comecar');
  if(!f||!led)return;
  var slides=f.querySelectorAll('.faixa__slide');
  if(!slides[i])return;
  var alvo=slides[i].querySelector('.faixa__cta');
  if(alvo&&alvo!==led.parentNode)alvo.appendChild(led);
}
function banners(){
  var f=$('faixa');
  if(!f||!window.PLBANNERS)return;
  window.PLBANNERS.montar(f,function(i){moverLed(i)});
  moverLed(0);
}

/* ---------- 3 · Continue de onde parou ---------- */
function fotosDoProjeto(p){
  var n=Number(p.fotos)||0;
  var l=listaFotos(p.estado&&p.estado['pl-fotos']);
  if(!n&&l)n=l.length;
  if(!n&&p.estado){                     /* projeto de modelo: as fotos de exemplo do editor (DOC-04 §6) */
    try{var q=JSON.parse(p.estado['pl-quadro']||'null');if(Array.isArray(q)&&q.length>1)n=q.length-1}catch(e){}
  }
  return n;
}
function metaProjeto(p){
  var fotos=fotosDoProjeto(p),partes=[];
  partes.push(fotos+(fotos===1?' foto':' fotos'));
  var folha='',papel='';
  if(window.PLFOLHAS&&fotos){
    var s=copia(PLFOLHAS.PADRAO),est=p.estado||{},o=null;
    try{o=est['pl-folhas']?JSON.parse(est['pl-folhas']):null}catch(e){}
    if(o)for(var k in o)s[k]=o[k];else if(p.v!==2){s.margem=10;s.gap=4}   /* D-150: projeto antigo mantém 10/4 */
    var q=null;try{q=est['pl-quadro']?JSON.parse(est['pl-quadro']):null}catch(e){}
    var fr=(q&&q[0]&&q[0].fr)||null,geo=fr&&fr.w?{w:fr.w,h:fr.h,lado:fr.lado,topo:fr.topo,jh:fr.jh}:{w:88,h:107,lado:6,topo:6,jh:76};
    var c=PLFOLHAS.contar(s,geo,fotos,0);
    if(c.folhas>0){papel=PLFOLHAS.papel(s).n;folha=c.folhas+(c.folhas===1?' folha':' folhas')}
  }
  if(folha)partes.push(folha+' '+papel);
  var q2=null;try{q2=p.estado&&p.estado['pl-quadro']?JSON.parse(p.estado['pl-quadro']):null}catch(e){}
  var fr2=q2&&q2[0]&&q2[0].fr;
  if(fr2&&fr2.w)partes.push((FMT[fr2.fmt]?FMT[fr2.fmt].n:'Personalizado')+' '+nf(fr2.w)+' × '+nf(fr2.h)+' mm');
  return partes.join(' · ');
}
function copia(o){return JSON.parse(JSON.stringify(o))}
function cartao(p){
  var li=document.createElement('li');
  li.className='proj';
  var temFoto=!!p.fotos;
  li.innerHTML='<div class="proj__top">'
    +'<div class="proj__prev'+(temFoto?'':' proj__prev--vazia')+'" data-capa="'+esc(p.id)+'">'+(temFoto?'<img alt="" width="96" height="116">':'')+'</div>'
    +'<div class="proj__txt">'
    +'<p class="proj__nome">'+esc(p.nome)+'</p>'
    +'<p class="proj__meta">'+esc(metaProjeto(p))+'</p>'
    +'<p class="proj__quando">'+esc(quando(p.atualizadoEm))+'</p>'
    +'</div></div>'
    +'<button type="button" class="btn2 proj__b" data-abrir="'+esc(p.id)+'">Abrir</button>';
  return li;
}
function capas(){
  if(!P||!P.capa)return;
  [].forEach.call(document.querySelectorAll('[data-capa]'),function(el){
    var id=el.getAttribute('data-capa');
    P.capa(id).then(function(b){
      if(!b)return;
      var img=el.querySelector('img');
      if(!img)return;
      img.src=URL.createObjectURL(b);
    });
  });
}
function projetos(){
  var esq=$('esq-projetos'),lista=$('projs'),vazio=$('proj-vazio'),todos=$('ver-todos');
  if(!P||!lista)return;
  P.listar().then(function(l){
    if(esq)esq.classList.remove('is-on');
    lista.innerHTML='';
    if(!l.length){if(vazio)vazio.hidden=false;if(todos)todos.hidden=true;return}
    if(vazio)vazio.hidden=true;
    if(todos)todos.hidden=l.length<=3;          /* o link «Ver todos» só aparece com mais de 3 */
    l.slice(0,3).forEach(function(p){lista.appendChild(cartao(p))});
    capas();
  });
}

/* ---------- 4 · os 8 modelos ---------- */
function prevModelo(m){
  var h='';
  m.prev.forEach(function(p){
    var f=p[1]==='txt'?famFonte(m.fonte):famMono();
    var tam=p[1]==='txt'?'12px':'9px';
    h+='<span style="font-family:'+f+';font-size:'+tam+';color:'+COR[m.cor]+'">'+esc(p[0])+'</span>';
  });
  return h;
}
function modelos(){
  var ul=$('modelos');
  if(!ul)return;
  ul.innerHTML=MODELOS.map(function(m){
    var f=FMT[m.fmt];
    var img=m.img
      ? '<img class="mdl__img" src="../../assets/img/ilustracoes/'+m.img+'" width="92" height="112" alt="" loading="lazy">'
      : '<div class="mdl__vazia"><span class="mdl__janela"></span></div>';
    return '<li class="mdl">'
      +'<div class="mdl__prev">'+img+'<p class="mdl__leg">'+prevModelo(m)+'</p></div>'
      +'<h3 class="mdl__nome">'+esc(m.nome+' '+m.emoji)+'</h3>'
      +'<p class="mdl__meta mono">'+esc(f.n+' '+nf(f.w)+' × '+nf(f.h)+' · '+PRESET[m.preset])+'</p>'
      +'<p class="mdl__uso">'+esc(m.uso)+'</p>'
      +'<button type="button" class="btn2 mdl__b" data-modelo="'+esc(m.id)+'">Usar este modelo</button>'
      +'</li>';
  }).join('');
}

/* ---------- 5 · as 6 colagens ---------- */
function colagens(){
  var c=$('colags');
  if(!c)return;
  c.innerHTML=COLAGENS.map(function(g){
    var itens=g.itens.map(function(it){
      return '<li class="colag">'
        +'<div class="colag__prev"><img src="../../assets/img/ilustracoes/'+g.img+'" width="'+g.w+'" height="'+g.h+'" alt="" loading="lazy"></div>'
        +'<p class="colag__frase">'+esc(it.frase)+'</p>'
        +'<p class="colag__nome">'+esc(it.nome)+'</p>'
        +'<p class="colag__px mono">'+esc(g.px)+'</p>'
        +'<span class="selo-breve"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Em breve</span>'
        +'</li>';
    }).join('');
    return '<section class="colag__g" aria-label="'+esc(g.formato)+'"><h3 class="colag__fmt">'+esc(g.formato)+'</h3><ul class="colag__lista">'+itens+'</ul></section>';
  }).join('');
}

/* ---------- 2 · aplicar um modelo: ST[0].fr e ST[0].leg no projeto ---------- */
function legDe(m){
  var l=m.fmt==='pocket'?T.legPocket(T.LEG0):copia(T.LEG0);
  l.preset=m.preset;
  l.al=m.al||'esq';
  var p=PRESET_P[m.preset]||{},k;
  for(k in p)setp(l,k,p[k]);
  l.txt.font=m.fonte;
  l.txt.cor=m.cor;l.data.cor=m.cor;l.loc.cor=m.cor;
  l.data.on=!!m.dataOn;l.loc.on=!!m.locOn;
  if(m.dataFmt!=null)l.data.fmt=m.dataFmt;
  if(m.fmt==='pocket'){                 /* D-113: o Retro Pocket mede pelo topo das letras */
    l.txt.on=true;l.loc.sep=' - ';l.data.fmt=3;l.meta='linhas';l.ordem='loc-data';l.medida='letras';
  }
  T.migrar(l);
  return l;
}
function frDe(m){
  var f=FMT[m.fmt];
  return {fmt:m.fmt,w:f.w,h:f.h,jh:f.jh,lado:f.lado,topo:f.topo,rad:0.4,man:false,lock:true,ori:'v'};
}
function novaEntrada(src){
  return {src:src,modo:'preencher',z:100,ang:0,px:0,py:0,rot:0,flip:false,
    adj:{brilho:0,contraste:0,saturacao:0,temp:0,realces:0,sombras:0,nitidez:0,vinheta:0},
    txt:null,flt:{id:'original',int:100}};
}
function exemplo24(){var a=[],i;for(i=1;i<=24;i++)a.push(i);return a}
function entradasDe(fotos,quadros,m){
  var porSrc={},i,e,src;
  if(Array.isArray(quadros))for(i=1;i<quadros.length;i++){e=quadros[i];if(e&&e.src)porSrc[e.src]=e}
  var lista=fotos.length?fotos:exemplo24();
  var saida=[];
  for(i=0;i<lista.length;i++){
    src=lista[i];e=porSrc[src]||novaEntrada(src);
    if(i===0)e.txt=m.texto;                 /* o texto sugerido entra na primeira foto */
    saida.push(e);
  }
  return saida;
}
function aplicar(id){
  var m=null,i;
  for(i=0;i<MODELOS.length;i++)if(MODELOS[i].id===id)m=MODELOS[i];
  if(!m||!P)return;
  P.listar().then(function(l){
    var atual=P.atual();
    var proj=null;
    for(i=0;i<l.length;i++)if(l[i].id===atual)proj=l[i];
    var fotos=listaFotos(lerSess('pl-fotos'));
    if(!fotos&&proj)fotos=listaFotos(proj.estado&&proj.estado['pl-fotos']);
    var quadros=null;
    try{quadros=JSON.parse(lerSess('pl-quadro')||'null')}catch(e){}
    if(!quadros&&proj)try{quadros=JSON.parse(proj.estado['pl-quadro']||'null')}catch(e){}
    var q=[{leg:legDe(m),fr:frDe(m)}].concat(entradasDe(fotos||[],quadros,m));
    try{
      sessionStorage.setItem('pl-quadro',JSON.stringify(q));
      if(fotos&&fotos.length)sessionStorage.setItem('pl-fotos',JSON.stringify(fotos));
      else sessionStorage.removeItem('pl-fotos');
      sessionStorage.removeItem('pl-prevoo');      /* o pré-voo e a exportação valem para o quadro antigo */
      sessionStorage.removeItem('pl-exportar');
    }catch(e){}
    var salvar=function(){
      var est={},ch=['pl-fotos','pl-quadro','pl-folhas','pl-orientacao','pl-fmt','pl-colagem'];
      ch.forEach(function(k){var v=lerSess(k);if(v!==null)est[k]=v});
      P.salvarEstado(est).then(function(){location.href='../editor/quadro/'});
    };
    if(atual)salvar();
    else P.criar(m.nome,true).then(salvar);   /* projeto novo: o modelo já entra como exemplo */
  });
}

/* ---------- eventos ---------- */
function eventos(){
  var ul=$('modelos');
  if(ul)ul.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('[data-modelo]'):null;
    if(!b)return;
    aplicar(b.getAttribute('data-modelo'));
  });
  var lista=$('projs');
  if(lista)lista.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('[data-abrir]'):null;
    if(!b)return;
    var id=b.getAttribute('data-abrir');
    P.abrir(id).then(function(){location.href='../editor/'});
  });
}

/* ---------- início ---------- */
cabecalho();
banners();
modelos();
colagens();
projetos();
eventos();
})();
