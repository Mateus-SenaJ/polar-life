/* T-07 · Editor · Modo Folhas · DOC-05 FN-01/FN-02 · DOC-08 §3 (paginação) · dados de exemplo: DOC-04 §6 */
(function(){
var $=function(i){return document.getElementById(i)},tm;
function toast(m,undo){clearTimeout(tm);$('toast-t').textContent=m;$('toast-undo').hidden=!undo;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
function nf(n){return String(Math.round(n*10)/10).replace('.',',')}

/* ---------- dados ---------- */
var PAPEIS=PLFOLHAS.PAPEIS;
var FR={w:88,h:107,jw:76,jh:76,lado:6,topo:6};                 /* Clássico 88 × 107 · janela 76 × 76 */
var POCKET=false;try{POCKET=sessionStorage.getItem('pl-fmt')==='pocket'}catch(e){}   /* D-113: projeto novo «Retro Pocket» (T-02) */
if(POCKET)FR={w:66,h:99,jw:60,jh:79,lado:3,topo:3,rad:.4};     /* Retro Pocket 66 × 99 · janela 60 × 79 (D-113) */
var LEG=PLTEXTO.LEG;
var VERT={2:1,6:1,9:1,13:1,17:1,21:1};                          /* 6 verticais e 18 horizontais (T-05) */
var LISTA=[],TXT={},META={},LG=null;
try{var Qd=JSON.parse(sessionStorage.getItem('pl-quadro')||'null');
  if(Array.isArray(Qd)&&Qd.length>=2&&Qd.slice(1).every(function(e){return e&&e.src>=1&&e.src<=24&&e.src%1===0})){
    Qd.slice(1).forEach(function(e,k){LISTA.push(e.src);if(typeof e.txt==='string')TXT[k+1]=e.txt;if(e.meta&&typeof e.meta==='object')META[k+1]=e.meta});
    if(Qd[0]&&Qd[0].leg&&Qd[0].leg.txt&&Qd[0].leg.data&&Qd[0].leg.loc)LG=Qd[0].leg;   /* estilo da legenda (T-10) vale nas folhas */
    var fr=Qd[0]&&Qd[0].fr;                              /* formato escolhido na aba Molduras (D-084) */
    if(fr&&fr.w>0&&fr.h>0&&fr.lado>0&&fr.w-2*fr.lado>0){FR.w=fr.w;FR.h=fr.h;FR.lado=fr.lado;FR.topo=fr.topo;FR.jw=fr.w-2*fr.lado;FR.jh=fr.jh>0?fr.jh:FR.jw;FR.rad=fr.rad}
  }}catch(e){LISTA=[];TXT={};META={};LG=null}
if(POCKET&&!LG)LG=PLTEXTO.legPocket(PLTEXTO.LEG0);              /* D-113: sem estado salvo, entra com o padrão do Pocket */
if(!LISTA.length)try{var _l=JSON.parse(sessionStorage.getItem('pl-fotos')||'null');if(Array.isArray(_l)&&_l.length>=1&&_l.length<=400&&_l.every(function(x){return x>=1&&x<=24&&x%1===0}))LISTA=_l}catch(e){}
if(!LISTA.length)for(var i=1;i<=24;i++)LISTA.push(i);      /* origem de cada foto; o Quadro grava a lista ao duplicar e remover */
var FOTOS=LISTA.map(function(sr,k){return{n:k+1,src:sr,v:!!VERT[sr],leg:TXT[k+1]!==undefined?TXT[k+1]:LEG[(sr-1)%4],m:META[k+1]||null}});
var NF=FOTOS.length;
document.getElementById('scope-t').textContent='Alterando: Todas as fotos · '+NF;
document.getElementById('apply-t').textContent='Aplicar ao lote · '+NF+(NF===1?' foto':' fotos');
var DEF={papel:'A4',w:210,h:297,orient:'retrato',margem:10,gap:4,girar:true,align:'center',separar:false,guias:true,contorno:false,compr:'continua',cor:'preto',rodape:false,assin:true};
var D=PLFOLHAS.ler();                                          /* T-06 (pl-orientacao) + o que o editor salvou (D-085) */
var COR={preto:'#000000',azul:'#006194',laranja:'#FD761A'};

/* ---------- estado inicial: escolha da T-06 e estados de revisão por hash ---------- */
function salvaD(){try{sessionStorage.setItem('pl-folhas',JSON.stringify(D))}catch(e){}}
var est=(location.hash.match(/^#estado-([\w-]+)$/)||[])[1];
if(est==='parcial')D.separar=true;
if(est==='nao-cabe')D.papel='10x15';
if(est==='contorno'){D.guias=false;D.contorno=true}
if(est==='sem-linhas'){D.guias=false;D.contorno=false}

/* ---------- motor (DOC-08 §3) ---------- */
function papel(s){return PLFOLHAS.papel(s)}
function grade(s,p,giro){return PLFOLHAS.grade(s,p,giro,FR)}   /* motor compartilhado (motor-folhas.js) */
function melhor(s,p){return PLFOLHAS.melhor(s,p,FR)}
function aprov(R){var u=R.p.w-2*D.margem,v=R.p.h-2*D.margem,a=R.sheets.reduce(function(t,s){return t+s.cells.length},0)*FR.w*FR.h;return R.sheets.length?Math.round(a/(R.sheets.length*u*v)*100):0}

/* ---------- desenho da folha ---------- */
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

/* ---------- estilo da legenda nas folhas (T-10 → T-07) ---------- */
var FMTD=PLTEXTO.FMTD, caixaLG=PLTEXTO.caixaLG, estLG=PLTEXTO.estLG, dadosFoto=PLTEXTO.dadosFoto, localLG=PLTEXTO.localLG, LOC0=PLTEXTO.LOC0;
function polaroid(c,s,px,det){
  var L=c.x*px,T=c.y*px,W=c.w*px,H=c.h*px,ow=FR.w*px,oh=FR.h*px,ox=(W-ow)/2,oy=(H-oh)/2;
  var html='<figure class="pol'+(D.contorno&&!D.guias?' is-out':'')+'" data-n="'+c.f.n+'" style="left:'+L+'px;top:'+T+'px;width:'+W+'px;height:'+H+'px">';
  html+='<div class="pol__in" style="left:'+ox+'px;top:'+oy+'px;width:'+ow+'px;height:'+oh+'px'+(c.giro?';transform:rotate(90deg)':'')+'">';
  html+='<div class="pol__ph" style="left:'+FR.lado*px+'px;top:'+FR.topo*px+'px;width:'+FR.jw*px+'px;height:'+FR.jh*px+'px"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 19l7-11 4 6 3-4 6 9z"/></svg></div>';
  if(det){
    var yb=(FR.topo+FR.jh)*px;
    var cap,meta,pos='abaixo',tr='',mls='';
    if(LG){
      var DF=dadosFoto(c.f),dtx=LG.data.on&&DF.d?FMTD[LG.data.fmt||0](DF.d):'',lcx=LG.loc.on&&DF.c?localLG(LG.loc,DF.c):'';
      var t=LG.txt.on?caixaLG(c.f.leg,LG.txt.caixa):'';
      cap=t?'<span class="pol__cap" style="'+estLG(LG.txt,0,px,';letter-spacing:'+LG.txt.esp+'em')+'">'+esc(t)+'</span>':'';
      pos=LG.pos||'abaixo';
      tr=';transform-origin:left center;transform:translate('+(LG.dx||0)*px+'px,'+(LG.dy||0)*px+'px) rotate('+(LG.inc||0)+'deg)';
      var dE=dtx?'<time datetime="'+DF.iso+'" style="'+estLG(LG.data,0,px)+'">'+esc(dtx)+'</time>':'',
          lE=lcx?'<span style="'+estLG(LG.loc,0,px)+'">'+esc(lcx)+'</span>':'';
      var junto=(LG.meta||'junto')!=='linhas',ordem=LG.ordem||'data-loc';   /* D-113: juntas ou em linhas separadas */
      if(junto){                                 /* numa linha só: a maior fonte estrutura a linha, igual ao Quadro e ao PDF */
        var par=ordem==='loc-data'?[lE,dE]:[dE,lE];
        meta=(dtx||lcx)?'<span class="pol__meta" style="font-size:'+Math.max(LG.data.pt,LG.loc.pt)*.3528*px+'px">'+par.filter(Boolean).join(dtx&&lcx?' • ':'')+'</span>':''
      }else{                                     /* em linhas separadas, cada uma com o próprio corpo (1,2 · igual ao PDF) */
        var rws=(ordem==='loc-data'?[[LG.loc,lcx],[LG.data,dtx]]:[[LG.data,dtx],[LG.loc,lcx]]).filter(function(r){return r[1]});
        meta=rws.length?'<span class="pol__meta">'+rws.map(function(r){return'<span class="pol__mline" style="'+estLG(r[0],0,px)+'">'+esc(r[1])+'</span>'}).join('')+'</span>':''
      }
      if(LG.medida==='letras'&&pos!=='acima'&&(dtx||lcx)){   /* D-113 · MT-02: linhas nas posições exatas de PLTEXTO.linhas */
        var LNS=PLTEXTO.linhas(LG,FR,PLTEXTO.medTela,{temData:!!dtx,temLoc:!!lcx});
        var dX=dtx?'<time datetime="'+DF.iso+'" style="'+estLG(LG.data,0,px,';line-height:0')+'">'+esc(dtx)+'</time>':'',
            lX=lcx?'<span style="'+estLG(LG.loc,0,px,';line-height:0')+'">'+esc(lcx)+'</span>':'',
            sX=(dtx&&lcx)?'<span style="'+estLG({font:'IBM Plex Mono',pt:Math.max(LG.data.pt,LG.loc.pt),cor:'preto'},0,px,';line-height:0')+'"> • </span>':'';
        mls=LNS.map(function(ln){
          var dentro=ln.k==='data'?dX:ln.k==='loc'?lX:(ordem==='loc-data'?lX+sX+dX:dX+sX+lX);
          return'<div class="pol__ml" style="top:'+((ln.top-(FR.topo+FR.jh)-2.2)*px)+'px;'+estLG(ln.est,0,px,';line-height:'+ln.lh+'em')+'">'+dentro+'</div>'
        }).join('')
      }
    }else{
      cap='<span class="pol__cap" style="font-size:'+5.2*px+'px">'+esc(c.f.leg)+'</span>';
      var DG=dadosFoto(c.f),pt=[DG.d?FMTD[0](DG.d):'',DG.c?localLG(LOC0,DG.c):''].filter(Boolean).join(' • ');
      meta=pt?'<span class="pol__meta" style="font-size:'+2.5*px+'px">'+esc(pt)+'</span>':''
    }
    var pre=' data-preset="'+(LG?LG.preset:'simples')+'"',gap='margin-top:'+1.2*px+'px',X='left:'+FR.lado*px+'px;width:'+FR.jw*px+'px';
    var topo='<figcaption class="pol__top"'+pre+' style="'+X+';top:0;height:'+FR.topo*px+'px;gap:'+2*px+'px'+tr+'">';
    if(pos==='acima')html+=topo+cap+meta+'</figcaption>';
    else{
      if(pos==='ambas')html+=topo+cap+'</figcaption>';
      var metaOut=(pos==='ambas'||pos==='abaixo')&&!mls&&meta?meta.replace('class="pol__meta" style="','class="pol__meta" style="'+gap+';').replace('class="pol__meta">','class="pol__meta" style="'+gap+'">'):'';
      html+='<figcaption'+pre+' style="'+X+';top:'+(yb+2.2*px)+'px'+tr+'">'+(pos==='ambas'?'':cap)+metaOut+mls+'</figcaption>'
    }
    if(D.assin){var dirSig=PLTEXTO.assinaturaDir(LG,FR);   /* D-128: Pocket em duas linhas → assinatura espelhada à direita */
      html+='<img class="pol__sig" src="../../assets/img/logos/Logo_tipografia_lateral.png" alt="" style="'+(dirSig?'right':'left')+':'+FR.lado*px+'px;bottom:'+3*px+'px;width:'+3.9*2.9*px+'px">'}
  }
  return html+'</div></figure>'
}
function linhas(sh,p,px){                                          /* guias de corte · FN-02 · MT-04 */
  if(!D.guias)return'';
  var xs={},ys={},W=p.w*px,H=p.h*px,o='<svg class="guides" viewBox="0 0 '+W+' '+H+'" aria-hidden="true" style="color:'+COR[D.cor]+'">',k=function(v){return Math.round(v*100)/100};
  sh.cells.forEach(function(c){xs[k(c.x)]=1;xs[k(c.x+c.w)]=1;ys[k(c.y)]=1;ys[k(c.y+c.h)]=1});
  if(D.compr==='continua'){
    Object.keys(xs).forEach(function(x){o+='<line x1="'+x*px+'" y1="0" x2="'+x*px+'" y2="'+H+'" stroke="currentColor"/>'});
    Object.keys(ys).forEach(function(y){o+='<line x1="0" y1="'+y*px+'" x2="'+W+'" y2="'+y*px+'" stroke="currentColor"/>'})
  }else sh.cells.forEach(function(c){                              /* marcas de canto: até 5 mm para fora, sem entrar na vizinha */
    [[c.x,c.y,-1,-1],[c.x+c.w,c.y,1,-1],[c.x,c.y+c.h,-1,1],[c.x+c.w,c.y+c.h,1,1]].forEach(function(q){
      var ax=Math.min(5,q[2]<0?q[0]:p.w-q[0]),ay=Math.min(5,q[3]<0?q[1]:p.h-q[1]);
      sh.cells.forEach(function(d){
        if(d===c)return;
        if(d.y<c.y+c.h-.01&&d.y+d.h>c.y+.01){
          if(q[2]<0&&d.x+d.w<=c.x+.01)ax=Math.min(ax,c.x-(d.x+d.w));
          if(q[2]>0&&d.x>=c.x+c.w-.01)ax=Math.min(ax,d.x-(c.x+c.w))
        }
        if(d.x<c.x+c.w-.01&&d.x+d.w>c.x+.01){
          if(q[3]<0&&d.y+d.h<=c.y+.01)ay=Math.min(ay,c.y-(d.y+d.h));
          if(q[3]>0&&d.y>=c.y+c.h-.01)ay=Math.min(ay,d.y-(c.y+c.h))
        }
      });
      if(ax>0)o+='<line x1="'+q[0]*px+'" y1="'+q[1]*px+'" x2="'+(q[0]+q[2]*ax)*px+'" y2="'+q[1]*px+'" stroke="currentColor"/>';
      if(ay>0)o+='<line x1="'+q[0]*px+'" y1="'+q[1]*px+'" x2="'+q[0]*px+'" y2="'+(q[1]+q[3]*ay)*px+'" stroke="currentColor"/>'
    })
  });
  return o+'</svg>'
}
function desenhar(el,sh,p,px,det,idx,total){
  var h=sh.cells.map(function(c){return polaroid(c,sh,px,det)}).join('')+linhas(sh,p,px);
  if(det&&D.rodape&&px>1.2)h+='<div class="sheet__foot" style="bottom:'+Math.max(1,D.margem/2-1.2)*px+'px;font-size:'+2.2*px+'px">Viagem · Serra 2026 · Folha '+(idx+1)+' de '+total+'</div>';
  el.style.width=p.w*px+'px';el.style.height=p.h*px+'px';el.style.setProperty('--mm',px+'px');el.innerHTML=h;
  if(det)ajustarLeg(el,px)
}
/* «Ajustar para caber» (FN-07) e área segura (BR-13): mede a folha já desenhada */
var FORA=0;
function ajustarLeg(el,px){
  FORA=0;if(!LG)return;
  var min=8*.3528*px,sd=PLTEXTO.assinaturaDir(LG,FR);   /* D-128: assinatura à direita no Pocket em duas linhas */
  [].forEach.call(el.querySelectorAll('figcaption'),function(fg){
    var cap=fg.querySelector('.pol__cap'),mt=fg.querySelector('.pol__meta'),top=fg.classList.contains('pol__top');
    var lim=function(){return fg.clientWidth-(top&&cap&&mt?mt.offsetWidth+2*px:0)};
    if(cap&&LG.txt.fit){var fs=parseFloat(cap.style.fontSize);while(cap.scrollWidth>lim()+.5&&fs>min){fs-=.25;cap.style.fontSize=fs+'px'}}
    var x=0,base=(FR.h-3)*px,y0=fg.offsetTop,dy=(LG.dy||0)*px;
    var mls=[].slice.call(fg.querySelectorAll('.pol__ml'));  /* D-113: linhas absolutas também contam */
    if(cap&&cap.scrollWidth>lim()+.5)x=1;
    if(mt&&mt.scrollWidth>fg.clientWidth+.5)x=1;
    [].forEach.call(fg.querySelectorAll('.pol__mline'),function(m){if(m.scrollWidth>m.clientWidth+.5)x=1});
    mls.forEach(function(m){if(m.scrollWidth>m.clientWidth+.5)x=1});
    if(top){if(Math.max(cap?cap.offsetHeight:0,mt?mt.offsetHeight:0)>fg.offsetHeight+.5)x=1}
    else{
      var h=0;[].forEach.call(fg.children,function(c){h=Math.max(h,c.offsetTop+c.offsetHeight)});  /* máximo: cobre as absolutas */
      if(sd){                                     /* MT-02/D-128: desconta a zona da assinatura na posição nova */
        var sig=fg.parentNode.querySelector('.pol__sig'),sr=sig?sig.getBoundingClientRect():null;
        if(sr)[].forEach.call(fg.querySelectorAll('.pol__cap,.pol__ml,.pol__mline > time,.pol__mline > span'),function(e){
          var b=e.getBoundingClientRect();
          if(b.right>sr.left+.5&&b.left<sr.right-.5&&b.bottom>sr.top+.5)x=1
        });
        if(y0+h+dy>FR.h*px+.5)x=1
      }else if(y0+h+dy>base)x=1;
      if(y0+dy<(FR.topo+FR.jh)*px-.5)x=1
    }
    if(x)FORA++
  })
}

/* ---------- estado e interface ---------- */
var R,cur=0,hist=[JSON.stringify(D)],hi=0,lastK='',lastT=0;
function resumoTxt(){
  if(R.erro)return'A polaroid não cabe neste papel';
  return R.g.n+' por folha · '+R.sheets.length+' folhas · aproveitamento '+aprov(R)+'%'
}
function render(){
  R=PLFOLHAS.paginar(D,FR,FOTOS);
  var N=R.sheets.length;if(cur>=N)cur=Math.max(0,N-1);
  var p=R.p,orient=D.orient==='paisagem'?'paisagem':'retrato';
  /* campos */
  var sel=$('papel');if(!sel.options.length){[['A4','A4 (210 × 297 mm)'],['A3','A3 (297 × 420 mm)'],['A5','A5 (148 × 210 mm)'],['13x18','13 × 18 cm (130 × 180 mm)'],['10x15','10 × 15 cm (100 × 150 mm)'],['custom','Personalizado (50–1000 mm)']].forEach(function(o){var e=document.createElement('option');e.value=o[0];sel.appendChild(e)})}
  [].forEach.call(sel.options,function(o){
    var t={A4:'A4 (210 × 297 mm)',A3:'A3 (297 × 420 mm)',A5:'A5 (148 × 210 mm)','13x18':'13 × 18 cm (130 × 180 mm)','10x15':'10 × 15 cm (100 × 150 mm)',custom:'Personalizado (50–1000 mm)'}[o.value];
    if(o.value!=='custom'){var q=PAPEIS[o.value],pp=D.orient==='paisagem'?{w:q.h,h:q.w}:{w:q.w,h:q.h},m=melhor(D,pp);t+=' — '+(m.n?(o.value==='A4'?'Recomendado ('+m.n+' por folha)':m.n+' por folha'):'não cabe')}
    o.textContent=t
  });
  sel.value=D.papel;$('custom').hidden=D.papel!=='custom';
  if(document.activeElement!==$('w'))$('w').value=D.w;if(document.activeElement!==$('h'))$('h').value=D.h;
  if(document.activeElement!==$('margem'))$('margem').value=nf(D.margem);if(document.activeElement!==$('gap'))$('gap').value=nf(D.gap);
  ['orient','align','compr','cor'].forEach(function(n){[].forEach.call(document.getElementsByName(n),function(r){r.checked=r.value===D[n]})});
  ['girar','separar','guias','contorno','rodape','assin'].forEach(function(n){$(n).setAttribute('aria-checked',!!D[n])});
  /* guias × contorno (FN-02) */
  $('contorno').setAttribute('aria-disabled',D.guias);$('contorno-h').hidden=!D.guias;
  [].forEach.call(document.querySelectorAll('[data-k=compr] .seg,[data-k=cor] .seg'),function(s){s.classList.toggle('is-off',!D.guias);[].forEach.call(s.querySelectorAll('input'),function(i){i.disabled=!D.guias})});
  /* apoios */
  var a=grade(D,p,false),b=grade(D,p,true),mais=b.n-a.n;
  $('girar-h').textContent=mais>0?(D.girar?'+'+mais+' por folha neste papel.':'Ligue para +'+mais+' por folha.'):'Não aumenta o número por folha neste papel.';
  $('gap-h').textContent=D.guias&&D.gap<2?'Com guias, use 2 mm ou mais.':'De 0 a 30 mm. Com guias, use 2 mm ou mais.';
  $('margem-h').textContent='De 0 a 50 mm.';
  /* chips e textos */
  var rt=resumoTxt(),r=$('result');r.classList.toggle('is-err',R.erro);r.querySelector('use').setAttribute('href',R.erro?'#i-x':'#i-check');$('result-t').textContent=rt;
  var linhaT=D.guias?'Guias ligadas · '+(D.compr==='continua'?'linha contínua':'marcas de canto'):(D.contorno?'Contorno ligado':'Sem linhas de corte');
  $('rail-t').textContent=linhaT;$('rail-mm').textContent=D.guias?'0,1 mm':(D.contorno?'0,25 pt':'—');
  $('hud-l').textContent=D.guias?'Guias · 0,1 mm':(D.contorno?'Contorno · 0,25 pt':'Sem linhas');
  $('hud-r').textContent=p.n+' · '+(orient==='paisagem'?'Paisagem':'Retrato');
  $('cota').textContent='Margem '+nf(D.margem)+' mm · Entre polaroids '+nf(D.gap)+' mm';
  $('faixa-n').textContent=N;$('faixa-r').textContent=N?'Folha '+(cur+1)+' / '+N:'Sem folhas';
  var g=R.sheets[cur];
  $('ctx-sheet').textContent=N?'Modo Folhas · Folha '+(cur+1)+' de '+N+(g&&g.grupo?' · '+g.grupo:''):'Modo Folhas · Sem folhas';
  $('status').textContent=R.erro?'A polaroid não cabe neste papel':p.n+' '+orient+' · '+R.g.n+' clássicas por folha · '+N+' folhas no total';
  $('mesa').classList.toggle('is-err',R.erro);$('err').hidden=!R.erro;
  $('prev').disabled=cur<=0;$('next').disabled=cur>=N-1;
  
  $('undo').disabled=hi<=0;$('redo').disabled=hi>=hist.length-1;
  [].forEach.call(document.querySelectorAll('[data-reset]'),function(bt){var k=bt.getAttribute('data-reset');bt.hidden=D[k]===DEF[k]});
  var q0=R.sheets[cur]&&R.sheets[cur].cells[0],qh='quadro/#foto-'+(q0?q0.f.n:1);$('rail-q').href=qh;$('modes-q').href=qh;
  desenharMesa();faixa();
}
function desenharMesa(){
  var st=$('stage'),sh=$('sheet'),p=R.p;
  if(R.erro){sh.className='sheet is-empty';var px0=Math.min(st.clientWidth*.7/p.w,st.clientHeight/p.h);sh.style.width=p.w*px0+'px';sh.style.height=p.h*px0+'px';sh.innerHTML='';sh.setAttribute('aria-label','Folha vazia. A polaroid não cabe neste papel.');return}
  sh.className='sheet';
  var px=Math.min((st.clientWidth-8)/p.w,(st.clientHeight-8)/p.h);if(!(px>0))px=2;
  desenhar(sh,R.sheets[cur],p,px,px>1,cur,R.sheets.length);
  sh.setAttribute('aria-label','Folha '+(cur+1)+' de '+R.sheets.length+', '+R.sheets[cur].cells.length+' polaroids');
  var av=$('aviso-leg');if(av){av.hidden=!FORA;av.textContent=FORA?'Atenção: a legenda sai da área segura em '+FORA+(FORA===1?' polaroid':' polaroids')+' desta folha. Ajuste o corpo ou a posição na aba Legendas do Quadro, ou ligue «Ajustar para caber».':''}
  $('ctx-scale').textContent='Escala '+Math.round(px/(96/25.4)*100)+'%'
}
function faixa(){
  var ol=$('faixa');ol.innerHTML='';
  R.sheets.forEach(function(s,i){
    var li=document.createElement('li'),b=document.createElement('button');
    b.type='button';b.className='th'+(s.parcial?' th--partial':'');
    b.setAttribute('aria-label','Folha '+(i+1)+(s.parcial?', parcial, '+s.cells.length+' de '+s.per:'')+(s.grupo?', '+s.grupo.toLowerCase():''));
    if(i===cur)b.setAttribute('aria-current','true');
    var px=i===cur?.17:.14,t=document.createElement('span');t.className='tsheet';t.style.width=R.p.w*px+'px';t.style.height=R.p.h*px+'px';
    if(R.p.h*px>46){px=px*46/(R.p.h*px);t.style.width=R.p.w*px+'px';t.style.height=R.p.h*px+'px'}
    var keepG=D.guias;D.guias=false;desenhar(t,s,R.p,px,false,i,R.sheets.length);D.guias=keepG;
    var n=document.createElement('span');n.className='th__n mono';n.textContent='#'+(i<9?'0':'')+(i+1);
    b.appendChild(t);b.appendChild(n);b.onclick=function(){ir(i)};li.appendChild(b);ol.appendChild(li)
  })
}
function ir(i){if(i<0||i>=R.sheets.length)return;cur=i;render();var c=document.querySelector('.th[aria-current]');if(c&&c.scrollIntoView)c.scrollIntoView({block:'nearest',inline:'nearest'})}
$('sheet').addEventListener('click',function(e){var p=e.target.closest&&e.target.closest('.pol');if(p&&p.getAttribute('data-n'))location.href='quadro/#foto-'+p.getAttribute('data-n')});
$('prev').onclick=function(){ir(cur-1)};$('next').onclick=function(){ir(cur+1)};

/* ---------- histórico (FN-00c) ---------- */
function commit(k){
  var antes=R.sheets.length;
  render();
  var s=JSON.stringify(D),now=Date.now();
  if(s===hist[hi])return;
  if(k&&k===lastK&&now-lastT<700&&hi>0){hist[hi]=s}else{hist=hist.slice(0,hi+1);hist.push(s);hi++}
  lastK=k;lastT=now;salvaD();
  render();
  var dep=R.sheets.length;
  if(!R.erro&&antes&&dep&&antes!==dep)toast(antes+' folhas → '+dep+' folhas',true)
}
function aplicarHist(j){hi=j;D=JSON.parse(hist[hi]);lastK='';salvaD();render()}
function desfazer(){if(hi>0){var a=R.sheets.length;aplicarHist(hi-1);toast('Alteração desfeita')}}
$('undo').onclick=desfazer;$('redo').onclick=function(){if(hi<hist.length-1){aplicarHist(hi+1);toast('Alteração refeita')}};
$('toast-undo').onclick=function(){if(hi>0){aplicarHist(hi-1);toast('Alteração desfeita')}};
document.addEventListener('keydown',function(e){
  var m=e.ctrlKey||e.metaKey,t=e.target&&e.target.tagName;
  if(m&&!e.shiftKey&&e.key.toLowerCase()==='z'&&t!=='INPUT'){e.preventDefault();desfazer()}
  else if(m&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toLowerCase()==='z'))&&t!=='INPUT'){e.preventDefault();$('redo').click()}
});

/* ---------- controles ---------- */
$('papel').onchange=function(){D.papel=this.value;commit('papel')};
[].forEach.call(document.querySelectorAll('.seg input'),function(r){r.onchange=function(){if(this.disabled)return;D[this.name]=this.value;commit(this.name)}});
function numero(id,key,min,max,dec){
  var inp=$(id),f=inp.closest('.f'),h=f.querySelector('.f__h'),tmr,orig=h.textContent;
  function ler(){return parseFloat(inp.value.replace(',','.'))}
  function ok(v){return!isNaN(v)&&v>=min&&v<=max}
  function aplicar(){
    var v=ler();
    if(!ok(v)){f.classList.add('is-err');h.innerHTML='✕ Use um valor de '+min+' a '+max+' mm.';return}
    f.classList.remove('is-err');h.textContent=orig;
    D[key]=dec?Math.round(v*10)/10:Math.round(v);commit(key)
  }
  inp.addEventListener('input',function(){clearTimeout(tmr);tmr=setTimeout(aplicar,80)});
  inp.addEventListener('blur',function(){clearTimeout(tmr);f.classList.remove('is-err');h.textContent=orig;inp.value=nf(D[key])});
  [].forEach.call(f.querySelectorAll('.num__b'),function(b){b.onclick=function(){
    var v=Math.min(max,Math.max(min,(ok(ler())?ler():D[key])+(+b.getAttribute('data-step'))));
    inp.value=nf(v);f.classList.remove('is-err');h.textContent=orig;D[key]=dec?Math.round(v*10)/10:Math.round(v);commit(key)}});
}
numero('margem','margem',0,50,true);numero('gap','gap',0,30,true);numero('w','w',50,1000,false);numero('h','h',50,1000,false);
function alternar(id){$(id).onclick=function(){if(this.getAttribute('aria-disabled')==='true')return;D[id]=!D[id];commit(id)}}
['girar','rodape','assin'].forEach(alternar);
$('separar').onclick=function(){D.separar=!D.separar;try{sessionStorage.setItem('pl-orientacao',D.separar?'separar':'padrao')}catch(e){}commit('separar')};
$('contorno').onclick=function(){if(D.guias)return;D.contorno=!D.contorno;commit('contorno')};
$('guias').onclick=function(){
  if(D.guias){D.guias=false;commit('guias');return}
  if(D.contorno){abrir();return}                                   /* pop-up FN-02 */
  D.guias=true;commit('guias')
};
[].forEach.call(document.querySelectorAll('[data-reset]'),function(b){b.onclick=function(){var k=b.getAttribute('data-reset');D[k]=DEF[k];commit(k)}});
$('apply').onclick=function(){toast('Aplicado a '+NF+(NF===1?' foto':' fotos'))};
$('save').onclick=function(){toast('Próxima etapa: salvar o projeto em arquivo.')};
$('go').onclick=$('go2').onclick=function(){window.PLPREVOO.abrir(this)};   /* T-18 · pré-voo */
/* gancho para o pré-voo: mede a legenda em todas as folhas, desenhando-as fora da tela */
window.PLEDITOR={toast:toast,ctx:function(){return{R:R,D:D,FR:FR,FOTOS:FOTOS,LG:LG,aprov:aprov,
  foraTodas:function(){var t=0,box=document.createElement('div');box.setAttribute('aria-hidden','true');box.style.cssText='position:absolute;left:-99999px;top:0;visibility:hidden';document.body.appendChild(box);
    R.sheets.forEach(function(sh,i){var el=document.createElement('div');el.className='sheet';el.style.position='relative';box.appendChild(el);desenhar(el,sh,R.p,4,true,i,R.sheets.length);t+=FORA});
    document.body.removeChild(box);return t}}}};

/* pop-up «Ativar guias desliga o contorno?» · foco preso */
var dlg=$('dialog'),sc=$('scrim'),volta;
function abrir(){volta=document.activeElement;sc.hidden=dlg.hidden=false;$('dlg-no').focus()}
function fechar(){sc.hidden=dlg.hidden=true;if(volta)volta.focus()}
$('dlg-no').onclick=fechar;
$('dlg-yes').onclick=function(){D.contorno=false;D.guias=true;fechar();commit('guias')};
document.addEventListener('keydown',function(e){
  if(dlg.hidden)return;
  if(e.key==='Escape'){fechar();return}
  if(e.key!=='Tab')return;
  var f=[$('dlg-no'),$('dlg-yes')],z=f[1],a=f[0];
  if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
});

/* abas do inspetor */
var tabs=[].slice.call(document.querySelectorAll('.tab'));
function aba(t){tabs.forEach(function(x){var on=x===t;x.classList.toggle('is-on',on);x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1});var papel=t.id==='tab-papel';$('p-papel').hidden=!papel;$('p-outra').hidden=papel;$('p-outra').setAttribute('aria-labelledby',t.id)}
tabs.forEach(function(t,i){t.onclick=function(){aba(t)};t.onkeydown=function(e){var j=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:-1;if(j<0)return;j=(j+tabs.length)%tabs.length;tabs[j].focus();aba(tabs[j]);e.preventDefault()}});

/* tablet: inspetor deslizante · celular: painel inferior com 25%, 50% e 85% */
var insp=$('insp'),content=$('main'),SN=[25,50,85],sn=0,mq=window.matchMedia('(max-width:767.98px)'),mt=window.matchMedia('(min-width:768px) and (max-width:1023.98px)');
function snap(i){sn=i;document.documentElement.style.setProperty('--panel',SN[i]);$('grab').setAttribute('aria-label','Tamanho do painel: '+SN[i]+'%. Toque para alterar.');setTimeout(desenharMesa,260)}
$('grab').onclick=function(){snap((sn+1)%SN.length)};
$('grab').onkeydown=function(e){if(e.key==='ArrowUp'){snap(Math.min(2,sn+1));e.preventDefault()}if(e.key==='ArrowDown'){snap(Math.max(0,sn-1));e.preventDefault()}};
var y0,h0,moved=false;
$('grab').addEventListener('pointerdown',function(e){y0=e.clientY;h0=insp.getBoundingClientRect().height;moved=false;insp.classList.add('is-drag');this.setPointerCapture(e.pointerId)});
$('grab').addEventListener('pointermove',function(e){if(y0==null)return;var dy=y0-e.clientY;if(Math.abs(dy)>4)moved=true;if(moved){insp.style.height=Math.max(120,Math.min(innerHeight*.85,h0+dy))+'px'}});
$('grab').addEventListener('pointerup',function(){if(y0==null)return;insp.classList.remove('is-drag');if(moved){var pct=insp.getBoundingClientRect().height/innerHeight*100,k=0;SN.forEach(function(v,i){if(Math.abs(v-pct)<Math.abs(SN[k]-pct))k=i});insp.style.height='';snap(k);$('grab').onclick=null;setTimeout(function(){$('grab').onclick=function(){snap((sn+1)%SN.length)}},0)}y0=null});
$('insp-toggle').onclick=function(){var s=insp.classList.toggle('is-shut');content.classList.toggle('has-insp',!s);this.setAttribute('aria-expanded',!s);setTimeout(desenharMesa,260)};
function modo(){if(mt.matches){insp.classList.remove('is-shut');content.classList.add('has-insp');$('insp-toggle').setAttribute('aria-expanded','true')}else{content.classList.remove('has-insp');insp.classList.remove('is-shut')}}
mt.addListener?mt.addListener(modo):mt.addEventListener('change',modo);modo();snap(0);

/* redimensionamento */
var ro;if(window.ResizeObserver){ro=new ResizeObserver(function(){desenharMesa()});ro.observe($('stage'))}else window.addEventListener('resize',desenharMesa);
document.fonts&&document.fonts.addEventListener&&document.fonts.addEventListener('loadingdone',function(){PLTEXTO.limparMedTela();desenharMesa()}); /* métricas mudaram: recalcula as linhas (D-113) */

render();
})();
