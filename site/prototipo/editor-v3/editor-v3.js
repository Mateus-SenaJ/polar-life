/* Protótipo · Editor v3 · Modo Quadro (tarefa 53) · ES5 · sem dependências.
   Demonstra: trilho/abas → painel contextual; seleção no palco → barra flutuante; «Polaroid original» (D-135);
   alinhamento Esquerda · Centro · Direita (D-136); stickers e emojis arrastáveis com alças (D-137). Não gera PDF. */
(function(){
var $=function(i){return document.getElementById(i)};
var FR={w:88,h:107,lado:6,topo:6,jw:76,jh:76};                 /* Clássico (mm) */
var EST={original:false,al:'esq',txtOn:true,txt:'Dia de rolê',pt:16,cor:'preto',font:'Caveat',dataOn:true,locOn:true,fmt:0,el:[],escopo:'esta'};
var COR={preto:'#000000',azul:'#006194',laranja:'#FD761A',branco:'#FFFFFF'};
var STK=[['coracao','Coração','Afeto'],['estrela','Estrela','Afeto'],['sol','Sol','Natureza'],['onda','Onda','Natureza'],['folha','Folha','Natureza'],['montanha','Montanha','Natureza'],['aviao','Avião','Viagem'],['pin','Pin de mapa','Viagem'],['balao','Balão','Festa'],['bolo','Bolo','Festa'],['confete','Confete','Festa'],['fita','Fita adesiva','Fita e papel'],['seta','Seta','Fita e papel']];
var EMO=['😀','😍','🥰','😎','🤩','😂','❤️','🧡','💙','✨','⭐','🌊','🌅','🌴','🏔️','🐶','🐱','🍕','🎂','🎉','✈️','📷','🎈','☀️'];
var FMT=['14.07.26','14/07/2026','14-07-2026','14/07/26','2026-07-14','07/2026','14 de julho de 2026','14 jul 2026','14 de julho','Julho de 2026','jul/26','terça, 14 de julho'];
var sel=null,painel='texto',hist=[],hi=-1,pmm=4,tm;

/* ---------- utilidades ---------- */
function pmmAtual(){return parseFloat(getComputedStyle($('pq')).getPropertyValue('--pmm'))||pmm}
function uid(){return Math.random().toString(36).slice(2,6)}
function copia(o){return JSON.parse(JSON.stringify(o))}
function toast(m,undo){clearTimeout(tm);$('toast-t').textContent=m;$('toast-undo').hidden=!undo;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},4000)}
function commit(){var s=JSON.stringify(EST);if(s===hist[hi])return;hist=hist.slice(0,hi+1);hist.push(s);hi++;render()}
function desfazer(){if(hi>0){hi--;var e=JSON.parse(hist[hi]);for(var k in e)EST[k]=e[k];sel=null;render();toast('Alteração desfeita')}}
function refazer(){if(hi<hist.length-1){hi++;var e=JSON.parse(hist[hi]);for(var k in e)EST[k]=e[k];render()}}
$('undo').onclick=desfazer;$('redo').onclick=refazer;$('toast-undo').onclick=desfazer;

/* ---------- cena de exemplo (ilustração na paleta) ---------- */
function cena(n){var sx=70+(n*53)%260;return'<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="#dfe6ea"/><rect width="400" height="200" fill="#006194" opacity=".14"/><circle cx="'+sx+'" cy="92" r="26" fill="#FD761A"/><path d="M0 205L70 120L120 175L190 95L270 190L330 135L400 200V300H0Z" fill="#006194" opacity=".55"/><path d="M0 240L90 170L160 225L250 160L330 230L400 195V300H0Z" fill="#000" opacity=".85"/><rect y="262" width="400" height="38" fill="#000"/></svg>'}

/* ---------- dimensionar a polaroid ---------- */
function dimensionar(){
  var st=$('stage'),r=st.getBoundingClientRect(),m=window.matchMedia('(max-width:767.98px)').matches;
  var h=r.height-(m?72:110),w=r.width-48,u=Math.max(1.6,Math.min(4.6,w/FR.w,h/FR.h));
  pmm=u;$('pq').style.setProperty('--pmm',u+'px');$('ctx-esc').textContent=Math.round(u/(96/25.4)*100)+'%'
}

/* ---------- componentes de controle (regra única do §3 da especificação) ---------- */
function sw(id,rot,on,h){return'<div class="sw-row'+(id==='original'?' sw-row--big':'')+'"><div><span class="f__l" id="l-'+id+'">'+rot+'</span><p class="f__h" id="h-'+id+'">'+h+'</p></div><button type="button" class="sw" data-sw="'+id+'" role="switch" aria-checked="'+on+'" aria-labelledby="l-'+id+'"></button></div>'}
function seg(nome,rot,ops,v,extra){return'<div class="f"><span class="f__l" id="l-'+nome+'">'+rot+'</span><div class="seg'+(extra||'')+'" role="radiogroup" aria-labelledby="l-'+nome+'">'+ops.map(function(o){return'<label class="seg__o"><input type="radio" name="'+nome+'" value="'+o[0]+'"'+(o[0]===v?' checked':'')+'><span>'+(o[2]?'<svg class="ico sm"><use href="#'+o[2]+'"/></svg>':'')+o[1]+'</span></label>'}).join('')+'</div></div>'}
function sld(id,rot,u,min,max,v,h){return'<div class="f"><div class="f__top"><label class="f__l" for="n-'+id+'">'+rot+'</label></div><div class="sl"><input type="range" min="'+min+'" max="'+max+'" value="'+v+'" aria-label="'+rot+'" data-r="'+id+'"><span class="num num--sm"><input id="n-'+id+'" value="'+v+'" inputmode="decimal" data-n="'+id+'"><span class="num__u mono">'+u+'</span></span></div>'+(h?'<p class="f__h">'+h+'</p>':'')+'</div>'}
function num(id,rot,v,u,step){return'<div class="f"><label class="f__l" for="n-'+id+'">'+rot+'</label><div class="num" style="display:flex"><button type="button" class="num__b" data-step="'+id+'|-'+step+'" aria-label="Diminuir '+rot+'">−</button><input id="n-'+id+'" value="'+v+'" inputmode="decimal" style="flex:1;text-align:center"><span class="num__u mono">'+u+'</span><button type="button" class="num__b" data-step="'+id+'|'+step+'" aria-label="Aumentar '+rot+'">+</button></div></div>'}
function selc(id,rot,ops,v){return'<div class="f"><label class="f__l" for="s-'+id+'">'+rot+'</label><div class="sel"><select id="s-'+id+'" data-sel="'+id+'">'+ops.map(function(o,i){return'<option value="'+i+'"'+(i===v?' selected':'')+'>'+o+'</option>'}).join('')+'</select><svg class="ico sm"><use href="#i-down"/></svg></div></div>'}
function cores(id,v,lista){return'<div class="f"><span class="f__l" id="l-c-'+id+'">Cor</span><div class="cores" role="radiogroup" aria-labelledby="l-c-'+id+'">'+(lista||[['preto','Preto'],['azul','Azul'],['laranja','Laranja']]).map(function(c){return'<label class="cor"><input type="radio" name="cor-'+id+'" value="'+c[0]+'"'+(v===c[0]?' checked':'')+'><span><i style="background:'+COR[c[0]]+';'+(c[0]==='branco'?'border:1px solid #0003':'')+'"></i>'+c[1]+'</span></label>'}).join('')+'</div></div>'}
function fsel(rot,amostra,nome,fam){return'<div class="f"><span class="f__l">'+rot+'</span><button type="button" class="fsel" aria-haspopup="listbox"><span class="fsel__s" style="font-family:'+fam+'">'+amostra+'</span><small>'+nome+'</small><svg class="ico sm"><use href="#i-down"/></svg></button></div>'}
function linha3(fam,nome,pt,cor,id){return'<div class="linha3"><div><span class="f__l">Fonte</span><button type="button" class="fsel"><span class="fsel__s" style="font-family:'+fam+';font-size:14px">'+nome+'</span><svg class="ico sm"><use href="#i-down"/></svg></button></div><div><label class="f__l" for="n-'+id+'pt">Tamanho</label><span class="num" style="display:flex"><input id="n-'+id+'pt" value="'+pt+'" style="flex:1;text-align:center"><span class="num__u mono">pt</span></span></div><div><span class="f__l">Cor</span><div class="cores"><label class="cor"><input type="radio" name="c-'+id+'" checked><span><i style="background:'+COR[cor]+'"></i></span></label></div></div></div>'}
function disc(t,inner,open){return'<details class="disc"'+(open?' open':'')+'><summary>'+t+'</summary><div>'+inner+'</div></details>'}
function aviso(t){return'<div class="aviso"><svg class="ico sm"><use href="#i-info"/></svg><span>'+t+'</span></div>'}

/* ---------- painéis ---------- */
var P={
  texto:function(){
    var o=EST.original,h='';
    h+='<section class="mod">'+sw('original','Polaroid original',o,o?'Ligado · só a foto e a moldura. Desligue para editar os textos e stickers.':'Desligado · textos e stickers visíveis.')+'</section>';
    h+='<div id="texto-resto" class="'+(o?'veu':'')+'"'+(o?' aria-disabled="true"':'')+'>';
    h+='<section class="mod"><h3 class="mod__h">Posição</h3>'+seg('al','Alinhamento',[['esq','Esquerda','i-al-e'],['centro','Centro','i-al-c'],['dir','Direita','i-al-d']],EST.al,' seg--ico')+'<p class="f__h">Sempre abaixo da foto, com as mesmas margens laterais da janela.</p></section>';
    h+='<section class="mod"><h3 class="mod__h">Estilo</h3><div class="chips" role="radiogroup" aria-label="Estilos prontos">'+['Simples','Contornada','Etiqueta','Carimbo','Pin de local','Calendário','Bilhete','Manuscrito'].map(function(s,i){return'<button type="button" class="chip-o" aria-pressed="'+(i===0)+'">'+s+'</button>'}).join('')+'</div></section>';
    h+='<section class="mod"><h3 class="mod__h">Texto</h3>'+sw('txtOn','Mostrar texto',EST.txtOn,EST.txtOn?'Ligado':'Desligado')
     +'<div class="f"><div class="f__top"><label class="f__l" for="lg-in">Texto desta foto</label><span class="mono">'+EST.txt.length+'/80</span></div><input class="txt" id="lg-in" maxlength="80" value="'+EST.txt.replace(/"/g,'&quot;')+'" autocomplete="off"><p class="f__h">Até 80 caracteres. <button type="button" class="btn2 btn2--sm" style="margin-left:4px;height:30px"><svg class="ico sm"><use href="#i-spark"/></svg>Sugestões</button></p></div>'
     +fsel('Fonte',EST.txt||'Dia de rolê','Caveat · Manuscrita',"'Caveat',cursive")
     +sld('pt','Tamanho','pt',8,32,EST.pt,'De 8 a 32 pt.')+cores('txt',EST.cor)
     +disc('Mais opções do texto',seg('caixa','Caixa',[['normal','Normal'],['maiusc','Maiúsc.'],['cap','Capitalizada']],'normal')+sld('esp','Espaçamento','em',-5,30,0,'De −0,05 a 0,3 em.')+'<label class="chk"><input type="checkbox"><span><strong>Ajustar para caber</strong><span class="f__h">Reduz o tamanho até o texto caber na área segura.</span></span></label>')+'</section>';
    h+='<section class="mod"><h3 class="mod__h">Data</h3>'+sw('dataOn','Mostrar data',EST.dataOn,EST.dataOn?'Ligado · data da foto (EXIF)':'Desligado')+selc('fmt','Formato',FMT,EST.fmt)+linha3("'IBM Plex Mono',monospace",'IBM Plex Mono',8,'preto','data')+'</section>';
    h+='<section class="mod"><h3 class="mod__h">Local</h3>'+sw('locOn','Mostrar local',EST.locOn,EST.locOn?'Ligado · Campos do Jordão, SP (lido no aparelho)':'Desligado')+linha3("'IBM Plex Mono',monospace",'IBM Plex Mono',8,'preto','loc')
     +'<div style="height:12px"></div>'+disc('Como escrever o local',seg('uf','Estado',[['sigla','Sigla'],['nome','Nome'],['oculto','Oculto']],'sigla')+seg('pais','País',[['oculto','Oculto'],['nome','Nome'],['cod','Código']],'oculto')+selc('sep','Separador',['Vírgula · “Campos do Jordão, SP”','Ponto · “Campos do Jordão · SP”','Traço · “Campos do Jordão – SP”','Barra · “Campos do Jordão / SP”','Hífen · “Campos do Jordão - SP”'],0)+seg('ordem','Ordem',[['cidade','Cidade, Estado'],['estado','Estado, Cidade']],'cidade'))+'</section>';
    h+='<section class="mod">'+disc('Linhas',seg('meta','Data e local',[['junto','Na mesma linha'],['linhas','Em linhas separadas']],'junto')+seg('lordem','Ordem',[['data','Data primeiro'],['loc','Local primeiro']],'data')+seg('medida','Medir espaços por',[['caixa','Caixa do texto'],['letras','Topo das letras']],'caixa'))
     +disc('Ajuste fino',sld('dy','Deslocar na vertical','mm',-50,50,0,'De −5 a +5 mm.')+sld('inc','Inclinação','°',-50,50,0,'De −5° a +5°.'))+'</section>';
    h+='<section class="mod"><h3 class="mod__h">Assinatura</h3>'+seg('assin','Posição',[['auto','Automática'],['esq','Esq.'],['centro','Centro'],['dir','Dir.']],'auto')+'<p class="f__h">Automática: fica no canto que o texto não ocupa.</p></section>';
    h+='</div>';
    return{h:h,ft:'<button type="button" class="btn2"><svg class="ico sm"><use href="#i-reset"/></svg>Resetar textos</button><button type="button" class="btn2">Aplicar texto às demais · 23</button>'}
  },
  stickers:function(){
    var o=EST.original,h='',e=elSel();
    if(o)h+=aviso('Desligue «Polaroid original» (painel Texto) para usar stickers e emojis.');
    h+='<div class="'+(o?'veu':'')+'">';
    if(e){
      h+='<section class="mod"><h3 class="mod__h">Elemento selecionado · '+(e.t==='emoji'?e.v:nomeSt(e.v))+'</h3><div class="row2">'+num('w','Tamanho',e.w,'mm',1)+num('rot','Giro',e.rot,'°',15)+'</div>'
       +(e.t==='sticker'&&e.v!=='confete'?cores('el',e.cor,[['preto','Preto'],['azul','Azul'],['laranja','Laranja'],['branco','Branco']]):'')
       +'<div class="row2"><button type="button" class="btn2 btn2--sm" data-el="front"><svg class="ico sm"><use href="#i-front"/></svg>Trazer para frente</button><button type="button" class="btn2 btn2--sm" data-el="back"><svg class="ico sm"><use href="#i-back"/></svg>Enviar para trás</button></div><div class="row2"><button type="button" class="btn2 btn2--sm" data-el="dup"><svg class="ico sm"><use href="#i-copy"/></svg>Duplicar</button><button type="button" class="btn2 btn2--sm" data-el="del"><svg class="ico sm" style="color:var(--black)"><use href="#i-trash"/></svg>Excluir</button></div></section>'
    }
    h+='<section class="mod"><div class="seg" role="radiogroup" aria-label="Tipo" style="margin-bottom:12px"><label class="seg__o"><input type="radio" name="stt" value="st" checked><span>Stickers</span></label><label class="seg__o"><input type="radio" name="stt" value="em"><span>Emojis</span></label></div>'
     +'<div class="txt" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;color:#0009"><svg class="ico sm"><use href="#i-search"/></svg>Buscar sticker ou emoji</div>';
    var temas=[];STK.forEach(function(s){if(temas.indexOf(s[2])<0)temas.push(s[2])});
    temas.forEach(function(t){h+='<h3 class="mod__h" style="margin-top:8px">'+t+'</h3><div class="grade">'+STK.filter(function(s){return s[2]===t}).map(function(s){return'<button type="button" data-add="sticker|'+s[0]+'" aria-label="'+s[1]+'" title="'+s[1]+'" style="color:var(--black)"><svg><use href="#st-'+s[0]+'"/></svg></button>'}).join('')+'</div>'});
    h+='<h3 class="mod__h" style="margin-top:14px">Emojis <small class="f__h" style="display:inline">· fonte do aparelho</small></h3><div class="grade">'+EMO.map(function(e){return'<button type="button" data-add="emoji|'+e+'" aria-label="Emoji '+e+'">'+e+'</button>'}).join('')+'</div>';
    h+='<p class="f__h" style="margin-top:12px">Stickers são desenhos do Polar Life e saem em vetor no PDF. Emojis usam a fonte deste aparelho e saem como imagem nítida (600 PPI).</p></section></div>';
    return{h:h,ft:'<button type="button" class="btn2">Aplicar stickers às demais · 23</button>'}
  },
  recorte:function(){
    return{h:'<section class="mod">'+seg('modo','Modo do recorte',[['preencher','Preencher'],['encaixar','Encaixar']],'preencher')+sld('zoom','Zoom','%',100,400,100,'De 100 a 400%. Roda do mouse, pinça ou duplo toque também.')+sld('ang','Endireitar','°',-15,15,0,'De −15° a +15°. A grade fina aparece enquanto você ajusta.')
      +'<div class="row2"><button type="button" class="btn2"><svg class="ico sm"><use href="#i-rotate"/></svg>Girar 90°</button><button type="button" class="btn2" aria-pressed="false"><svg class="ico sm"><use href="#i-flip"/></svg>Espelhar</button></div>'
      +sw('inteira','Mostrar a foto inteira',false,'Desligado · um traço fino marca a janela; o que fica fora será cortado.')
      +'<div class="row2"><button type="button" class="btn2"><svg class="ico sm"><use href="#i-crop"/></svg>Centralizar</button><button type="button" class="btn2"><svg class="ico sm"><use href="#i-reset"/></svg>Resetar recorte</button></div></section>',ft:''}
  },
  ajustes:function(){
    var fl=['Original','P&B','Noir','Retrô','Foto Antiga','Praia','Pastel','Polaroid Clássico','Instantânea','Verão','Desbotado','Cinema'];
    var filt=['none','grayscale(1)','grayscale(1) contrast(1.4)','sepia(.4)','sepia(.7) contrast(.9)','saturate(1.3)','saturate(.6) brightness(1.1)','sepia(.2) saturate(.9)','contrast(1.15)','saturate(1.3) sepia(.15)','saturate(.5) brightness(1.08)','contrast(1.2) saturate(.85)'];
    return{h:'<section class="mod"><h3 class="mod__h">Filtro</h3><div class="seg" style="margin-bottom:10px"><label class="seg__o"><input type="radio" name="fv" checked><span>Todos · 12</span></label><label class="seg__o"><input type="radio" name="fv"><span>Favoritos</span></label></div><div class="grade grade--f" role="radiogroup" aria-label="Filtros">'+fl.map(function(f,i){return'<button type="button" role="radio" aria-checked="'+(i===0)+'"><span class="ph" style="filter:'+filt[i]+'">'+cena(3)+'</span>'+f+(i===3?'<span class="chip" style="height:20px;font-size:10px;background:var(--black);color:#fff">Sugerido</span>':'')+'</button>'}).join('')+'</div>'+sld('fint','Intensidade do filtro','%',0,100,100,'')+'</section>'
      +'<section class="mod"><h3 class="mod__h">Luz e cor</h3>'+sld('brilho','Brilho','',-100,100,0)+sld('contraste','Contraste','',-100,100,0)+sld('sat','Saturação','',-100,100,0)+sld('temp','Temperatura','',-100,100,0,'De −100 (azulado) a +100 (alaranjado).')+'</section>'
      +'<section class="mod">'+disc('Detalhe',sld('realces','Realces','',-100,100,-20)+sld('sombras','Sombras','',-100,100,25)+sld('nitidez','Nitidez','',0,100,0,'Aplicada só ao exportar.')+sld('vinheta','Vinheta','',0,100,15),true)+'</section>'
      +'<label class="chk"><input type="checkbox"><span><strong>Substituir ajustes individuais</strong><span class="f__h">Desmarcada, as fotos com ajuste próprio ficam como estão.</span></span></label>',
      ft:'<button type="button" class="btn2"><svg class="ico sm"><use href="#i-reset"/></svg>Resetar</button><button type="button" class="btn2"'+(EST.escopo==='esta'?' disabled style="opacity:.5"':'')+'>Aplicar às demais · '+(EST.escopo==='esta'?'0':EST.escopo==='sel'?'2':EST.escopo==='folha'?'3':'23')+'</button>'}
  },
  moldura:function(){
    var F=[['Clássico','88 × 107 mm',1],['Mini quadrado','60 × 73 mm'],['Retro Pocket','66 × 99 mm'],['Instax Mini','54 × 86 mm'],['Instax Square','72 × 86 mm'],['Instax Wide','108 × 86 mm'],['Personalizado','Medidas livres']];
    return{h:'<section class="mod"><h3 class="mod__h">Formato</h3><div class="fmt">'+F.map(function(f){return'<button type="button" aria-pressed="'+!!f[2]+'"><span>'+f[0]+'</span><span class="mono">'+f[1]+'</span></button>'}).join('')+'</div><p class="f__h">Trocar o formato abre a comparação antes/depois com o número de folhas.</p></section>'
      +'<section class="mod"><h3 class="mod__h">Orientação</h3>'+seg('ori','Polaroid',[['v','Vertical'],['h','Horizontal']],'v')+'<p class="f__h">Gira a polaroid inteira, com a legenda. Atalho: R.</p></section>'
      +'<section class="mod">'+disc('Atalhos de medida','<span class="f__l">Proporção da janela</span><div class="chips" style="margin:6px 0 12px">'+['1:1','4:5','3:4','2:3','5:4','4:3','3:2','16:9'].map(function(p,i){return'<button type="button" class="chip-o" aria-pressed="'+(i===0)+'">'+p+'</button>'}).join('')+'</div><span class="f__l">Faixa inferior</span><div class="chips" style="margin:6px 0 12px">'+['Fina 12','Média 19','Clássica 25','Extra 32'].map(function(p,i){return'<button type="button" class="chip-o" aria-pressed="'+(i===2)+'">'+p+' mm</button>'}).join('')+'</div><span class="f__l">Margens</span><div class="chips" style="margin:6px 0 12px">'+['Fina 3','Instax 4,5','Clássica 6','Larga 9'].map(function(p,i){return'<button type="button" class="chip-o" aria-pressed="'+(i===2)+'">'+p+' mm</button>'}).join('')+'</div><span class="f__l">Cantos</span><div class="chips" style="margin:6px 0 4px">'+['Reto','Fino','Suave','Redondo'].map(function(p,i){return'<button type="button" class="chip-o" aria-pressed="'+(i===1)+'">'+p+'</button>'}).join('')+'</div>')
      +disc('Medidas',seg('un','Unidade',[['mm','mm'],['cm','cm'],['pol','pol']],'mm')+'<div class="row2">'+num('mw','Largura externa',88,'mm',1)+num('mh','Altura externa',107,'mm',1)+'</div><div class="row2">'+num('jw','Largura da janela',76,'mm',1)+num('jh','Altura da janela',76,'mm',1)+'</div><div class="row2">'+num('lado','Margem lateral',6,'mm',.5)+num('topo','Faixa superior',6,'mm',.5)+'</div><div class="row2">'+num('bt','Faixa inferior',25,'mm',1)+num('rad','Cantos',0.4,'mm',.1)+'</div><label class="chk"><input type="checkbox" checked><span><strong>Margem uniforme</strong><span class="f__h">Lateral e superior andam juntas.</span></span></label><label class="chk"><input type="checkbox"><span><strong>Manter proporções do formato</strong></span></label>')+'</section>',
      ft:'<button type="button" class="btn2"><svg class="ico sm"><use href="#i-reset"/></svg>Resetar formato</button>'}
  },
  dados:function(){
    return{h:'<section class="mod"><h3 class="mod__h">Esta foto</h3><dl class="rd"><dt>Data</dt><dd>14.07.26 · 09:00 <span class="f__h" style="display:inline">· EXIF</span></dd><dt>Orientação</dt><dd>Horizontal</dd><dt>Dimensões</dt><dd>4032 × 3024 px</dd><dt>Perfil de cor</dt><dd>sRGB</dd><dt>Origem</dt><dd>Do aparelho</dd><dt>Local</dt><dd>Campos do Jordão <span class="chip" style="height:22px;font-size:11px">Aproximado</span></dd></dl></section>'
      +'<section class="mod"><h3 class="mod__h">Editar</h3><div class="f"><div class="f__top"><label class="f__l" for="md-d">Data</label><button type="button" class="btn2 btn2--sm" style="height:28px">Sem data</button></div><input class="txt" id="md-d" value="14/07/2026" inputmode="numeric"></div><div class="f"><div class="f__top"><label class="f__l" for="md-c">Cidade</label><button type="button" class="btn2 btn2--sm" style="height:28px">Sem local</button></div><input class="txt" id="md-c" value="Campos do Jordão"></div>'+selc('orig','Origem',['Do aparelho','Câmera','Apple Fotos','Não informada'],0)+'<p class="f__h">Vale só para esta foto. Cidade, nunca coordenadas.</p></section>'
      +'<section class="mod">'+disc('Corrigir várias de uma vez',num('h','Somar ou subtrair horas às datas',0,'h',1)+'<p class="f__h">Informe as horas para ver como a data desta foto fica.</p><button type="button" class="btn2" style="width:100%" disabled>Aplicar em 24 fotos com data</button>')+'</section>'+aviso('Só o que você quer lembrar. O arquivo gerado não leva os metadados originais.'),ft:''}
  },
  fotos:function(){
    var h='<section class="mod"><div class="row2"><button type="button" class="btn2"><svg class="ico sm"><use href="#i-plus"/></svg>Adicionar fotos</button><button type="button" class="btn2" aria-pressed="false">Marcar</button></div><p class="f__h" style="margin:-4px 0 10px">2 selecionadas · Ctrl + clique marca, Shift + clique marca um intervalo.</p><div class="chips"><button type="button" class="chip-o">Selecionar todas</button><button type="button" class="chip-o">Só esta folha</button><button type="button" class="chip-o">Limpar</button></div></section>';
    h+='<section class="mod"><h3 class="mod__h">Ações da seleção</h3><div class="row2"><button type="button" class="btn2 btn2--sm"><svg class="ico sm"><use href="#i-copy"/></svg>Copiar estilo</button><button type="button" class="btn2 btn2--sm" disabled style="opacity:.5">Colar estilo</button></div><div class="row2"><button type="button" class="btn2 btn2--sm">Duplicar · 2</button><button type="button" class="btn2 btn2--sm"><svg class="ico sm" style="color:var(--black)"><use href="#i-trash"/></svg>Remover · 2</button></div><p class="f__h">Estilo = ajustes, filtro e stickers. O texto segue «Aplicar texto».</p></section>';
    h+='<section class="mod"><h3 class="mod__h">Suas fotos · 24</h3><div class="grade">';
    for(var i=1;i<=12;i++)h+='<button type="button" aria-label="Foto '+i+'" style="padding:0;overflow:hidden;position:relative;border-color:'+(i===3?'var(--black)':'')+'">'+cena(i)+(i===2||i===5?'<span class="th__chk" style="display:flex"><svg class="ico sm"><use href="#i-check"/></svg></span>':'')+'</button>';
    return{h:h+'</div><p class="f__h">Arraste para reordenar.</p></section>',ft:''}
  }
};
function nomeSt(id){var s=STK.filter(function(x){return x[0]===id})[0];return s?s[1]:id}
function elSel(){if(!sel||sel.length<5)return null;return EST.el.filter(function(e){return e.id===sel})[0]||null}

/* ---------- barra flutuante contextual ---------- */
function bf(){
  var b=$('bf'),h='',e=elSel();
  if(EST.original&&(sel==='texto'||e)){b.hidden=true;return}
  if(e){
    h='<button type="button" class="ib" data-el="menor" aria-label="Diminuir"><svg class="ico"><use href="#i-minus"/></svg></button><span class="bf__t mono" aria-live="polite">'+e.w+' mm</span><button type="button" class="ib" data-el="maior" aria-label="Aumentar"><svg class="ico"><use href="#i-plus"/></svg></button><span class="bf__div"></span><button type="button" class="ib" data-el="girar" aria-label="Girar 15°"><svg class="ico"><use href="#i-rotate"/></svg></button><button type="button" class="ib" data-el="dup" aria-label="Duplicar"><svg class="ico"><use href="#i-copy"/></svg></button><button type="button" class="ib" data-el="front" aria-label="Trazer para frente"><svg class="ico"><use href="#i-front"/></svg></button><span class="bf__div"></span><button type="button" class="ib" data-el="del" aria-label="Excluir"><svg class="ico"><use href="#i-trash"/></svg></button>'
  }else if(sel==='texto'){
    h='<div class="seg seg--ico" role="radiogroup" aria-label="Alinhamento">'+[['esq','Esquerda','i-al-e'],['centro','Centro','i-al-c'],['dir','Direita','i-al-d']].map(function(o){return'<label class="seg__o"><input type="radio" name="bf-al" value="'+o[0]+'"'+(EST.al===o[0]?' checked':'')+'><span><svg class="ico sm"><use href="#'+o[2]+'"/></svg><span class="vh">'+o[1]+'</span></span></label>'}).join('')+'</div><span class="bf__div"></span><button type="button" class="btn2 btn2--sm" style="height:40px;box-shadow:none;font-family:Caveat;font-size:17px">Caveat</button><button type="button" class="ib" data-pt="-1" aria-label="Diminuir tamanho"><svg class="ico"><use href="#i-minus"/></svg></button><span class="bf__t mono">'+EST.pt+' pt</span><button type="button" class="ib" data-pt="1" aria-label="Aumentar tamanho"><svg class="ico"><use href="#i-plus"/></svg></button><span class="bf__div"></span><button type="button" class="btn2 btn2--sm" style="height:40px;box-shadow:none" data-foco="lg-in"><svg class="ico sm"><use href="#i-text"/></svg>Editar texto</button>'
  }else if(sel==='moldura'){
    h='<span class="bf__t">Clássico · 88 × 107 mm</span><span class="bf__div"></span><div class="seg" role="radiogroup" aria-label="Orientação"><label class="seg__o"><input type="radio" name="bf-ori" checked><span>Vertical</span></label><label class="seg__o"><input type="radio" name="bf-ori"><span>Horizontal</span></label></div><span class="bf__div"></span><button type="button" class="btn2 btn2--sm" style="height:40px;box-shadow:none" data-p="moldura"><svg class="ico sm"><use href="#i-ruler"/></svg>Medidas</button>'
  }else{
    h='<div class="seg" role="radiogroup" aria-label="Modo do recorte"><label class="seg__o"><input type="radio" name="bf-modo" checked><span>Preencher</span></label><label class="seg__o"><input type="radio" name="bf-modo"><span>Encaixar</span></label></div><span class="bf__div"></span><button type="button" class="ib" aria-label="Diminuir zoom"><svg class="ico"><use href="#i-minus"/></svg></button><span class="bf__t mono">100%</span><button type="button" class="ib" aria-label="Aumentar zoom"><svg class="ico"><use href="#i-plus"/></svg></button><span class="bf__div"></span><button type="button" class="ib" aria-label="Girar 90°"><svg class="ico"><use href="#i-rotate"/></svg></button><button type="button" class="ib" aria-label="Espelhar" aria-pressed="false"><svg class="ico"><use href="#i-flip"/></svg></button><button type="button" class="ib" aria-label="Grade de composição"><svg class="ico"><use href="#i-grid"/></svg></button><button type="button" class="ib" aria-label="Mostrar a foto inteira" aria-pressed="false"><svg class="ico"><use href="#i-eye"/></svg></button>'
  }
  b.innerHTML=h;b.hidden=false
}

/* ---------- elementos (stickers e emojis) ---------- */
function pintarEl(){
  var pq=$('pq');[].slice.call(pq.querySelectorAll('.el')).forEach(function(n){n.parentNode.removeChild(n)});
  EST.el.forEach(function(e){
    var d=document.createElement('div');d.className='el el--'+e.t+(e.id===sel?' is-sel':'');d.setAttribute('data-id',e.id);d.tabIndex=0;d.setAttribute('role','img');d.setAttribute('aria-label',(e.t==='emoji'?'Emoji '+e.v:'Sticker '+nomeSt(e.v))+'. Arraste para mover.');
    d.style.left='calc(var(--pmm)*'+e.x+')';d.style.top='calc(var(--pmm)*'+e.y+')';d.style.width='calc(var(--pmm)*'+e.w+')';d.style.height='calc(var(--pmm)*'+e.w+')';d.style.setProperty('--w','calc(var(--pmm)*'+e.w+')');d.style.setProperty('--rot',e.rot+'deg');
    d.innerHTML=(e.t==='emoji'?e.v:'<svg style="color:'+COR[e.cor]+'"><use href="#st-'+e.v+'"/></svg>')+'<span class="hd hd--tl" data-hd="tl"></span><span class="hd hd--tr" data-hd="tr"></span><span class="hd hd--bl" data-hd="bl"></span><span class="hd hd--br" data-hd="br"></span><span class="hd hd--rot" data-hd="rot" aria-label="Girar"></span><span class="el__ang mono">'+Math.round(e.rot)+'°</span>';
    pq.appendChild(d)
  })
}
function prender(e){                                            /* o elemento fica inteiro dentro da moldura, com 2 mm de respiro */
  var r=Math.abs(e.rot%180)*Math.PI/180,half=e.w/2*(Math.abs(Math.cos(r))+Math.abs(Math.sin(r)));
  e.w=Math.max(4,Math.min(40,Math.round(e.w*10)/10));
  e.x=Math.max(2+half,Math.min(FR.w-2-half,e.x));e.y=Math.max(2+half,Math.min(FR.h-2-half,e.y));
  e.x=Math.round(e.x*10)/10;e.y=Math.round(e.y*10)/10;e.rot=Math.round(e.rot)
}
function add(t,v){
  if(EST.el.length>=12){toast('Até 12 stickers por foto.');return}
  var e={id:uid(),t:t,v:v,x:FR.w/2,y:FR.topo+FR.jh+(FR.h-FR.topo-FR.jh)/2,w:t==='emoji'?10:12,rot:0,cor:'laranja'};
  if(t==='sticker')e.x=FR.w-FR.lado-8;                          /* nasce na faixa inferior, ao lado do texto */
  prender(e);EST.el.push(e);sel=e.id;commit();toast((t==='emoji'?'Emoji':'Sticker')+' adicionado · arraste para posicionar',true)
}
var drag=null;
$('pq').addEventListener('pointerdown',function(ev){
  var t=ev.target,hd=t.closest&&t.closest('.hd'),el=t.closest&&t.closest('.el');
  if(el){
    var id=el.getAttribute('data-id'),e=EST.el.filter(function(x){return x.id===id})[0];
    if(sel!==id){sel=id;render()}
    var u=pmmAtual(),r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    drag={e:e,modo:hd?hd.getAttribute('data-hd'):'move',x0:ev.clientX,y0:ev.clientY,ex:e.x,ey:e.y,ew:e.w,er:e.rot,u:u,cx:cx,cy:cy,d0:Math.hypot(ev.clientX-cx,ev.clientY-cy),a0:Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI};
    try{$('pq').setPointerCapture(ev.pointerId)}catch(x){}
    if(drag.modo==='rot')el.classList.add('is-rot');
    ev.preventDefault();return
  }
  if(t.closest('.pq__band')){sel='texto';render();return}
  if(t.closest('.pq__win')){sel='foto';render();return}
  sel='moldura';render()
});
$('pq').addEventListener('pointermove',function(ev){
  if(!drag)return;var e=drag.e,dx=(ev.clientX-drag.x0)/drag.u,dy=(ev.clientY-drag.y0)/drag.u;
  if(drag.modo==='move'){e.x=drag.ex+dx;e.y=drag.ey+dy;
    var g=Math.abs(e.x-FR.w/2)<1.5;if(g)e.x=FR.w/2;$('guia').classList.toggle('is-on',g)}
  else if(drag.modo==='rot'){var a=Math.atan2(ev.clientY-drag.cy,ev.clientX-drag.cx)*180/Math.PI;e.rot=drag.er+(a-drag.a0);if(ev.shiftKey)e.rot=Math.round(e.rot/15)*15;e.rot=((e.rot+180)%360+360)%360-180}
  else{var d=Math.hypot(ev.clientX-drag.cx,ev.clientY-drag.cy);e.w=drag.ew*d/Math.max(1,drag.d0)}
  prender(e);pintarEl();bfTexto(e)
});
function bfTexto(e){var t=$('bf').querySelector('.bf__t');if(t&&elSel())t.textContent=e.w+' mm'}
function solta(){if(!drag)return;drag=null;$('guia').classList.remove('is-on');commit()}
$('pq').addEventListener('pointerup',solta);$('pq').addEventListener('pointercancel',solta);
$('stage').addEventListener('pointerdown',function(ev){if(ev.target===$('stage')){sel=null;render()}});
function acaoEl(k){
  var e=elSel();if(!e)return;var i=EST.el.indexOf(e);
  if(k==='del'){EST.el.splice(i,1);sel=null;commit();toast('Sticker excluído',true);return}
  if(k==='dup'){var c=copia(e);c.id=uid();c.x+=3;c.y+=3;prender(c);EST.el.splice(i+1,0,c);sel=c.id;commit();return}
  if(k==='front'){EST.el.splice(i,1);EST.el.push(e)}
  if(k==='back'){EST.el.splice(i,1);EST.el.unshift(e)}
  if(k==='maior')e.w+=1;if(k==='menor')e.w-=1;if(k==='girar')e.rot+=15;
  prender(e);commit()
}

/* ---------- render ---------- */
function render(){
  var pq=$('pq');
  pq.classList.toggle('is-original',EST.original);
  pq.style.setProperty('--al',EST.al==='esq'?'left':EST.al==='centro'?'center':'right');
  pq.setAttribute('data-sel',sel&&sel.length<5?sel:'');
  $('lg-txt').hidden=!EST.txtOn;$('lg-txt').textContent=EST.txt;$('lg-txt').style.fontSize='calc(var(--pmm)*'+(EST.pt*.3528)+')';$('lg-txt').style.color=COR[EST.cor];
  $('lg-meta').hidden=!(EST.dataOn||EST.locOn);$('lg-meta').textContent=[EST.dataOn?FMT[EST.fmt]:'',EST.locOn?'Campos do Jordão, SP':''].filter(Boolean).join(' • ');
  var sig=$('sig');sig.className='pq__sig '+(EST.al==='dir'?'pq__sig--esq':'pq__sig--dir');   /* assinatura automática: canto que o texto não ocupa (D-129 reduzida) */
  pintarEl();bf();
  $('undo').disabled=hi<=0;$('redo').disabled=hi>=hist.length-1;
  var ESC={esta:'só esta foto',sel:'2 selecionadas',folha:'esta folha · 4',todas:'todas · 24'};$('escopo-t').textContent=ESC[EST.escopo];$('escopo-dot').hidden=EST.escopo==='esta';
  $('orig-atalho').checked=EST.original;
  montar()
}
function montar(){
  var e=elSel();if(e&&painel!=='stickers'){painel='stickers'}
  var p=P[painel]();var T={fotos:'Fotos',recorte:'Recorte',ajustes:'Ajustes',texto:'Texto',stickers:'Stickers e emojis',moldura:'Moldura',dados:'Dados da foto'};
  $('panel-t').textContent=T[painel];$('panel-in').innerHTML=p.h;$('panel-ft').innerHTML=p.ft;$('panel-ft').hidden=!p.ft;
  [].forEach.call(document.querySelectorAll('[data-p]'),function(b){var on=b.getAttribute('data-p')===painel;if(b.classList.contains('rail__i'))b.setAttribute('aria-current',on?'true':'false');if(b.classList.contains('tab'))b.setAttribute('aria-selected',on)})
}
function abrir(p){painel=p;if(p!=='stickers'&&elSel())sel=null;if(p==='texto'&&!sel)sel='texto';if(p==='recorte'&&!sel)sel='foto';if(p==='moldura'&&!sel)sel='moldura';$('panel').classList.add('is-open');render();$('panel-in').scrollTop=0}

/* ---------- eventos do painel e das barras ---------- */
document.addEventListener('click',function(ev){
  var b=ev.target.closest('button,[data-p]');if(!b)return;
  if(b.hasAttribute('data-p')){abrir(b.getAttribute('data-p'));return}
  if(b.hasAttribute('data-sw')){var k=b.getAttribute('data-sw');EST[k]=!EST[k];if(k==='original'&&EST.original&&(sel==='texto'||elSel()))sel=null;commit();return}
  if(b.hasAttribute('data-add')){var a=b.getAttribute('data-add').split('|');add(a[0],a[1]);return}
  if(b.hasAttribute('data-el')){acaoEl(b.getAttribute('data-el'));return}
  if(b.hasAttribute('data-pt')){EST.pt=Math.max(8,Math.min(32,EST.pt+ +b.getAttribute('data-pt')));commit();return}
  if(b.hasAttribute('data-foco')){abrir('texto');var i=$(b.getAttribute('data-foco'));if(i){i.focus();i.select()}return}
  if(b.hasAttribute('data-step')){var s=b.getAttribute('data-step').split('|'),e=elSel();if(e&&s[0]==='w'){e.w+=+s[1];prender(e);commit()}if(e&&s[0]==='rot'){e.rot+=+s[1];prender(e);commit()}return}
  if(b.id==='escopo-b'){var o=$('escopo-pop').hidden;$('escopo-pop').hidden=!o;b.setAttribute('aria-expanded',o);return}
  if(b.id==='panel-x'){$('panel').classList.remove('is-open');return}
  if(b.id==='grab'){var v=['38vh','22vh','78vh'],cur=document.documentElement.style.getPropertyValue('--sheet')||'38vh',i2=(v.indexOf(cur)+1)%3;document.documentElement.style.setProperty('--sheet',v[i2]);setTimeout(dimensionar,300);return}
  if(b.classList.contains('chip-o')&&b.parentNode.classList.contains('chips')){[].forEach.call(b.parentNode.children,function(c){c.setAttribute('aria-pressed',c===b)});return}
  if(b.getAttribute('role')==='radio'){[].forEach.call(b.parentNode.children,function(c){c.setAttribute('aria-checked',c===b)});return}
  if(b.classList.contains('th')&&!b.classList.contains('th--add')){[].forEach.call($('faixa-l').children,function(c){c.setAttribute('aria-current',c===b)});$('ctx-n').textContent=b.getAttribute('data-n')+' de 24';$('faixa-n').textContent=b.getAttribute('data-n')+' / 24';return}
});
document.addEventListener('change',function(ev){
  var t=ev.target;
  if(t.name==='al'||t.name==='bf-al'){EST.al=t.value;commit();return}
  if(t.name==='escopo'){EST.escopo=t.value;$('escopo-pop').hidden=true;$('escopo-b').setAttribute('aria-expanded','false');render();return}
  if(t.id==='orig-atalho'){EST.original=t.checked;sel=null;commit();return}
  if(t.hasAttribute('data-sel')&&t.getAttribute('data-sel')==='fmt'){EST.fmt=+t.value;commit();return}
  if(t.name==='cor-txt'){EST.cor=t.value;commit();return}
  if(t.name==='cor-el'){var e=elSel();if(e){e.cor=t.value;commit()}return}
});
document.addEventListener('input',function(ev){
  var t=ev.target;
  if(t.id==='lg-in'){EST.txt=t.value;render();t.focus();var n=t.value.length;t.setSelectionRange(n,n);return}
  if(t.getAttribute('data-r')==='pt'){EST.pt=+t.value;$('n-pt').value=t.value;renderLeve();return}
});
function renderLeve(){$('lg-txt').style.fontSize='calc(var(--pmm)*'+(EST.pt*.3528)+')';hist[hi]=JSON.stringify(EST)}
document.addEventListener('keydown',function(ev){
  var tag=ev.target.tagName,m=ev.ctrlKey||ev.metaKey;
  if(m&&ev.key.toLowerCase()==='z'&&tag!=='INPUT'){ev.preventDefault();ev.shiftKey?refazer():desfazer();return}
  if(m&&ev.key.toLowerCase()==='y'){ev.preventDefault();refazer();return}
  if(tag==='INPUT'||tag==='SELECT')return;
  if(ev.key==='Escape'){sel=null;$('escopo-pop').hidden=true;render();return}
  var e=elSel();if(!e)return;
  var st=ev.shiftKey?2:.5;
  if(ev.key==='Delete'||ev.key==='Backspace'){acaoEl('del');ev.preventDefault()}
  else if(m&&ev.key.toLowerCase()==='d'){acaoEl('dup');ev.preventDefault()}
  else if(ev.key==='ArrowLeft'){e.x-=st;prender(e);commit();ev.preventDefault()}
  else if(ev.key==='ArrowRight'){e.x+=st;prender(e);commit();ev.preventDefault()}
  else if(ev.key==='ArrowUp'){e.y-=st;prender(e);commit();ev.preventDefault()}
  else if(ev.key==='ArrowDown'){e.y+=st;prender(e);commit();ev.preventDefault()}
});
document.addEventListener('pointerdown',function(ev){if(!ev.target.closest('.ctx__wrap')){$('escopo-pop').hidden=true;$('escopo-b').setAttribute('aria-expanded','false')}});

/* ---------- faixa ---------- */
(function(){var h='';for(var i=1;i<=24;i++)h+='<button type="button" class="th'+(i===2||i===5?' is-sel':'')+'" data-n="'+(i<10?'0':'')+i+'" aria-current="'+(i===3)+'" aria-label="Foto '+i+' de 24'+(i===2||i===5?', selecionada':'')+'">'+cena(i)+'<span class="th__n mono">'+(i<10?'0':'')+i+'</span><span class="th__q" aria-hidden="true"></span><span class="th__chk"><svg class="ico sm"><use href="#i-check"/></svg></span></button>';
  h+='<button type="button" class="th th--add" aria-label="Adicionar fotos"><svg class="ico"><use href="#i-plus"/></svg>Adicionar</button>';$('faixa-l').innerHTML=h})();
$('win').innerHTML=cena(3);

/* ---------- partida ---------- */
window.PLV3={EST:EST,add:add,render:render,abrir:abrir,sel:function(v){if(v!==undefined)sel=v;return sel}};
if(window.ResizeObserver)new ResizeObserver(dimensionar).observe($('stage'));else window.addEventListener('resize',dimensionar);
dimensionar();sel='texto';commit();
var c0=$('faixa-l').querySelector('[aria-current=true]');if(c0&&c0.scrollIntoView)c0.scrollIntoView({block:'nearest',inline:'center'});
})();
