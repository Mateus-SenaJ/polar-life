/* T-07 · Editor · Modo Folhas · DOC-05 FN-01/FN-02 · DOC-08 §3 (paginação) · dados de exemplo: DOC-04 §6 */
(function(){
var $=function(i){return document.getElementById(i)},tm;
var NOME='Viagem · Serra 2026';   /* nome do projeto: no exemplo, o nome de exemplo (DOC-04 §6) */
if(window.PLPROJETOS&&PLPROJETOS.atual())PLPROJETOS.listar().then(function(a){var p=a.filter(function(x){return x.id===PLPROJETOS.atual()})[0];if(p&&window.PLTEXTO&&PLTEXTO.ehReal()){NOME=p.nome;document.title='Polar Life · '+p.nome+' · Folhas';var e=document.querySelector('.eh__name');if(e)e.textContent=p.nome;
  try{var q=JSON.parse(sessionStorage.getItem('pl-quadro')||'null');if(Array.isArray(q)&&q.length){q[0]=q[0]||{};q[0].nome=p.nome;sessionStorage.setItem('pl-quadro',JSON.stringify(q))}}catch(x){}
  render()}});
function toast(m,undo){clearTimeout(tm);$('toast-t').textContent=m;$('toast-undo').hidden=!undo;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},5000)}
function nf(n){return String(Math.round(n*10)/10).replace('.',',')}

/* ---------- dados ---------- */
var PAPEIS=PLFOLHAS.PAPEIS;
var FR={w:88,h:107,jw:76,jh:76,lado:6,topo:6};                 /* Clássico 88 × 107 · janela 76 × 76 */
var F0=PLFOLHAS.formatoInicial(),POCKET=!!F0&&F0.fmt==='pocket';   /* D-159: formato escolhido na T-02 (D-113: Retro Pocket) */
if(F0)FR={fmt:F0.fmt,w:F0.w,h:F0.h,jw:F0.w-2*F0.lado,jh:F0.jh,lado:F0.lado,topo:F0.topo,rad:F0.rad};
var LEG=PLTEXTO.LEG;
var VERT={2:1,6:1,9:1,13:1,17:1,21:1};                          /* 6 verticais e 18 horizontais (T-05) */
var LISTA=[],TXT={},META={},EXT={},LG=null;
try{var Qd=JSON.parse(sessionStorage.getItem('pl-quadro')||'null');
  if(Array.isArray(Qd)&&Qd.length>=2&&Qd.slice(1).every(function(e){return e&&e.src>=1&&e.src<=400&&e.src%1===0})){
    Qd.slice(1).forEach(function(e,k){LISTA.push(e.src);if(typeof e.txt==='string')TXT[k+1]=e.txt;if(e.meta&&typeof e.meta==='object')META[k+1]=e.meta;EXT[k+1]={pad:e.pad||null,pl:e.pl||null}});
    if(Qd[0]&&Qd[0].leg&&Qd[0].leg.txt&&Qd[0].leg.data&&Qd[0].leg.loc)LG=PLTEXTO.migrar(Qd[0].leg);   /* estilo da legenda (T-10) vale nas folhas · D-135/D-136 */
    var fr=Qd[0]&&Qd[0].fr;                              /* formato escolhido na aba Molduras (D-084) */
    if(fr&&fr.w>0&&fr.h>0&&fr.lado>0&&fr.w-2*fr.lado>0){FR.w=fr.w;FR.h=fr.h;FR.lado=fr.lado;FR.topo=fr.topo;FR.jw=fr.w-2*fr.lado;FR.jh=fr.jh>0?fr.jh:FR.jw;FR.rad=fr.rad}
  }}catch(e){LISTA=[];TXT={};META={};EXT={};LG=null}
if(POCKET&&!LG)LG=PLTEXTO.legPocket(PLTEXTO.LEG0);
if(!LG&&PLTEXTO.ehReal())LG=PLTEXTO.legInicial();   /* D-149 */              /* D-113: sem estado salvo, entra com o padrão do Pocket */
if(!LISTA.length)try{var _l=JSON.parse(sessionStorage.getItem('pl-fotos')||'null');if(Array.isArray(_l)&&_l.length>=1&&_l.length<=400&&_l.every(function(x){return x>=1&&x<=400&&x%1===0}))LISTA=_l}catch(e){}
if(!LISTA.length&&!PLTEXTO.ehReal())for(var i=1;i<=24;i++)LISTA.push(i);      /* sem lista: projeto de exemplo (DOC-04 §6); projeto real vazio fica vazio */
var FOTOS=LISTA.map(function(sr,k){return{n:k+1,src:sr,v:!!VERT[sr],leg:TXT[k+1]!==undefined?TXT[k+1]:(PLTEXTO.ehReal()?'':LEG[(sr-1)%4]),m:META[k+1]||null,pad:EXT[k+1]?EXT[k+1].pad:null,pl:EXT[k+1]?EXT[k+1].pl:null}});
/* 44: projeto real (pl-fotos) → sem legendas, datas ou orientação de exemplo; os dados vêm do IndexedDB
   (data original do EXIF e dimensões reais) e a cidade é a que a pessoa digitar (BR-06: nunca coordenada). */
var REAL_ED=PLTEXTO.ehReal();
if(REAL_ED){FOTOS.forEach(function(f){if(TXT[f.n]===undefined)f.leg='';f.v=false});
  if(window.PLFOTOS)Promise.all(FOTOS.map(function(f){return PLFOTOS.ler(f.src).catch(function(){return null})})).then(function(rs){
    rs.forEach(function(r,i){if(!r)return;var f=FOTOS[i],iso=r.meta&&r.meta.iso||'';
      f.v=(r.h||0)>(r.w||0);if(r.w&&r.h)f.px={w:r.w,h:r.h};   /* pixels reais para a qualidade (BR-12) */
      if(!f.m)f.m={iso:iso,c:''};else if(!f.m.iso&&iso)f.m.iso=iso});
    if(typeof render==='function')render()
  })}
/* BR-12 · D-130: PPI efetivo de uma foto nas folhas. Usa o valor do Quadro (pl-ppi) quando existe; senão calcula com
   os pixels reais e o recorte salvo (zoom 100%, preencher, sem giro por padrão). Sem pixels reais, não arrisca: sem ponto. */
var PPI_Q=(function(){try{var a=JSON.parse(sessionStorage.getItem('pl-ppi')||'null');return Array.isArray(a)&&a.length===FOTOS.length?a:null}catch(e){return null}})();
var EST_Q=(function(){try{var q=JSON.parse(sessionStorage.getItem('pl-quadro')||'null');return Array.isArray(q)&&q.length===FOTOS.length+1?q:null}catch(e){return null}})();
function ppiDe(f){
  if(PPI_Q&&typeof PPI_Q[f.n-1]==='number')return PPI_Q[f.n-1];
  if(!f.px)return 0;
  var e=EST_Q&&EST_Q[f.n]||{},z=e.z||100,rot=e.rot||0,w=rot%180?f.px.h:f.px.w,h=rot%180?f.px.w:f.px.h,jq=FR.jw/FR.jh;   /* jq como no Quadro: largura ÷ altura da janela */
  var b=e.modo==='encaixar'?Math.min(1/w,1/(jq*h)):Math.max(1/w,1/(jq*h));
  return Math.round(1/(b*z/100)/FR.jw*25.4)}
var NF=FOTOS.length;
document.getElementById('scope-t').textContent='Alterando: Todas as fotos · '+NF;
document.getElementById('apply-t').textContent='Aplicar ao lote · '+NF+(NF===1?' foto':' fotos');
var DEF={papel:'A4',w:210,h:297,orient:'retrato',margem:3,gap:0,girar:true,align:'center',separar:false,guias:true,contorno:false,compr:'continua',cor:'preto',rodape:false,assin:true};
var D=(PLFOLHAS.lerFolhas||PLFOLHAS.ler)();                     /* T-06 (pl-orientacao) + o que o editor salvou (D-085) · D-176: só as Folhas */
var C=PLFOLHAS.lerColagem?PLFOLHAS.lerColagem():{};              /* D-176: a Colagem tem estado próprio (pl-colagem) */
/* assinatura segue a regra do plano (D-123): Grátis e Folha avulsa sempre ligada; Pro pode desligar */
var PLN=window.PLCONTA&&PLCONTA.plano?PLCONTA.plano():null;
if(PLN&&!PLN.assinaturaPodeDesligar)D.assin=true;
else if(PLN&&PLN.assinaturaDesligada){try{var _f=JSON.parse(sessionStorage.getItem('pl-folhas')||'null');if(!_f||_f.assin===undefined)D.assin=false}catch(e){}   /* D-159: o papel da T-02 não decide a assinatura */}
var COR={preto:'#000000',azul:'#006194',laranja:'#FD761A'};

/* ---------- estado inicial: escolha da T-06 e estados de revisão por hash ---------- */
function salvaD(){try{sessionStorage.setItem('pl-folhas',JSON.stringify(D));sessionStorage.setItem('pl-colagem',JSON.stringify(C));if(window.PLSESSAO)PLSESSAO.agendar()}catch(e){}}
var est=(location.hash.match(/^#estado-([\w-]+)$/)||[])[1];
if(est==='parcial')D.separar=true;
if(est==='nao-cabe')D.papel='10x15';
if(est==='contorno'){D.guias=false;D.contorno=true}
if(est==='sem-linhas'){D.guias=false;D.contorno=false}

/* ---------- motor (DOC-08 §3) ---------- */
function papel(s){return PLFOLHAS.papel(s)}
function grade(s,p,giro){return PLFOLHAS.grade(s,p,giro,FR)}   /* motor compartilhado (motor-folhas.js) */
function melhor(s,p){return PLFOLHAS.melhor(s,p,FR)}
function aprov(R){if(R.colagem)return null;var u=R.p.w-2*D.margem,v=R.p.h-2*D.margem,a=R.sheets.reduce(function(t,s){return t+s.cells.length},0)*FR.w*FR.h;return R.sheets.length?Math.round(a/(R.sheets.length*u*v)*100):0}

/* ---------- desenho da folha ---------- */
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

/* ---------- estilo da legenda nas folhas (T-10 → T-07) ---------- */
var FMTD=PLTEXTO.FMTD, caixaLG=PLTEXTO.caixaLG, estLG=PLTEXTO.estLG, dadosFoto=PLTEXTO.dadosFoto, localLG=PLTEXTO.localLG, LOC0=PLTEXTO.LOC0;
var MINI_PEDIDO={},REDRAW=null,ABA=null;   /* miniaturas pedidas · redesenho agrupado · aba aberta */
/* foto dentro da moldura: a real em projeto real, o ícone neutro enquanto ela não chega (nunca a cena de exemplo) */
function fotoPol(c,det){
  var icone='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 19l7-11 4 6 3-4 6 9z"/></svg>';
  if(!REAL_ED||!c.f.px)return icone;
  var u=PLFOTOTELA.tem(c.f.src,true);
  if(!u){if(!PLFOTOTELA.falhou(c.f.src))pedirMini(c.f.src,det);return icone}
  var e=(EST_Q&&EST_Q[c.f.n])||{},est=PLFOTOTELA.estilo(c.f.px,e,FR.jw/FR.jh);
  var vin=(e.adj&&e.adj.vinheta)||0,filt=det&&PLFOTOTELA.ajustou(e)?';filter:url(#pf-'+c.f.n+')':'';
  return '<div style="position:absolute;'+est+filt+'">'+PLFOTOTELA.html(u,vin)+'</div>'
}
function pedirMini(sr,det){
  if(MINI_PEDIDO[sr])return;MINI_PEDIDO[sr]=1;
  PLFOTOTELA.mini(sr,!!det).then(function(u){MINI_PEDIDO[sr]=0;if(u)agenda()})
}
function agenda(){          /* um redesenho só para todas as miniaturas que chegaram */
  if(REDRAW)return;
  REDRAW=setTimeout(function(){REDRAW=null;desenharMesa();faixa();if(ABA==='tab-fotos'||ABA==='tab-colagem')painelExtra(ABA)},60)
}
function polaroid(c,s,px,det){
  var L=c.x*px,T=c.y*px,W=c.w*px,H=c.h*px,ow=FR.w*px,oh=FR.h*px,ox=(W-ow)/2,oy=(H-oh)/2;
  var al=LG?(LG.al||'esq'):'esq',alCSS=al==='dir'?'right':al==='centro'?'center':'left';   /* D-136: mesmo alinhamento da tela e do PDF */
  var html='<figure class="pol'+(colOn()?' pol--col':(D.contorno&&!D.guias?' is-out':''))+'" data-n="'+c.f.n+'" style="left:'+L+'px;top:'+T+'px;width:'+W+'px;height:'+H+'px;--al:'+alCSS+'">';
  html+='<div class="pol__in" style="left:'+ox+'px;top:'+oy+'px;width:'+ow+'px;height:'+oh+'px'+((c.giro||c.rot||(c.s&&c.s!==1))?';transform:rotate('+((c.giro?90:0)+(c.rot||0))+'deg)'+(c.s&&c.s!==1?' scale('+c.s+')':''):'')+(colOn()?';background:#FFFFFF;box-shadow:inset 0 0 0 1px #000000':'')+'">';
  html+='<div class="pol__ph" style="left:'+FR.lado*px+'px;top:'+FR.topo*px+'px;width:'+FR.jw*px+'px;height:'+FR.jh*px+'px">'+fotoPol(c,det)+'</div>';
  if(det&&(!LG||!LG.original)){                    /* D-135: com a Polaroid original a faixa fica sem texto */
    var yb=(FR.topo+FR.jh)*px;
    var cap,meta,tr='',mls='';
    var LGp=PLTEXTO.comPadrao(LG,c.f);   /* D-139 */
    if(LGp){
      var DF=dadosFoto(c.f),dtx=LGp._pad?LGp._dt:(LGp.data.on&&DF.d?PLTEXTO.cxMeta(LGp,FMTD[LGp.data.fmt||0](DF.d)):''),lcx=LGp._pad?LGp._lc:(LGp.loc.on&&DF.c?PLTEXTO.cxMeta(LGp,localLG(LGp.loc,DF.c)):'');   /* D-148 */
      var t=LGp.txt.on?caixaLG(c.f.leg,LGp.txt.caixa):'';
      cap=t?'<span class="pol__cap" style="'+estLG(LGp.txt,0,px,';letter-spacing:'+LGp.txt.esp+'em')+'">'+esc(t)+'</span>':'';
      tr=';transform-origin:left center;transform:translateY('+(LGp.dy||0)*px+'px) rotate('+(LGp.inc||0)+'deg)';
      var dE=dtx?'<time datetime="'+DF.iso+'" style="'+estLG(LGp.data,0,px)+'">'+esc(dtx)+'</time>':'',
          lE=lcx?'<span style="'+estLG(LGp.loc,0,px)+'">'+esc(lcx)+'</span>':'';
      var junto=(LGp.meta||'junto')!=='linhas',ordem=LGp.ordem||'data-loc';   /* D-113: juntas ou em linhas separadas */
      if(junto){                                 /* numa linha só: a maior fonte estrutura a linha, igual ao Quadro e ao PDF */
        var par=ordem==='loc-data'?[lE,dE]:[dE,lE];
        meta=(dtx||lcx)?'<span class="pol__meta" style="font-size:'+Math.max(LGp.data.pt,LGp.loc.pt)*.3528*px+'px">'+par.filter(Boolean).join(dtx&&lcx?PLTEXTO.sepMeta(LGp):'')+'</span>':''
      }else{                                     /* em linhas separadas, cada uma com o próprio corpo (1,2 · igual ao PDF) */
        var rws=(ordem==='loc-data'?[[LGp.loc,lcx],[LGp.data,dtx]]:[[LGp.data,dtx],[LGp.loc,lcx]]).filter(function(r){return r[1]});
        meta=rws.length?'<span class="pol__meta">'+rws.map(function(r){return'<span class="pol__mline" style="'+estLG(r[0],0,px)+'">'+esc(r[1])+'</span>'}).join('')+'</span>':''
      }
      if(LGp.medida==='letras'&&(dtx||lcx)){      /* D-113 · MT-02: linhas nas posições exatas de PLTEXTO.linhas */
        var LNS=PLTEXTO.linhas(LGp,FR,PLTEXTO.medTela,{temData:!!dtx,temLoc:!!lcx});
        var dX=dtx?'<time datetime="'+DF.iso+'" style="'+estLG(LGp.data,0,px,';line-height:0')+'">'+esc(dtx)+'</time>':'',
            lX=lcx?'<span style="'+estLG(LGp.loc,0,px,';line-height:0')+'">'+esc(lcx)+'</span>':'',
            sX=(dtx&&lcx)?'<span style="'+estLG({font:'IBM Plex Mono',pt:Math.max(LGp.data.pt,LGp.loc.pt),cor:'preto'},0,px,';line-height:0')+'">'+PLTEXTO.sepMeta(LGp)+'</span>':'';
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
    var pre=' data-preset="'+(LGp?LGp.preset:'simples')+'"',gap='margin-top:'+1.2*px+'px',X='left:'+FR.lado*px+'px;width:'+FR.jw*px+'px';
    var metaOut=!mls&&meta?meta.replace('class="pol__meta" style="','class="pol__meta" style="'+gap+';').replace('class="pol__meta">','class="pol__meta" style="'+gap+'">'):'';
    html+='<figcaption'+pre+' style="'+X+';top:'+(yb+2.2*px)+'px'+tr+'">'+cap+metaOut+mls+'</figcaption>'
  }
  if(det&&D.assin){var dirSig=PLTEXTO.assinaturaPos(LG||PLTEXTO.LEG0,FR)==='dir'; /* D-129/D-136: canto oposto ao texto */
    html+='<img class="pol__sig" src="../../assets/img/logos/Logo_tipografia_lateral.png" alt="" style="'+(dirSig?'right':'left')+':'+FR.lado*px+'px;bottom:'+3*px+'px;width:'+3.9*2.9*px+'px">'}
  if(det&&window.PLQUALIDADE){var qp=ppiDe(c.f);if(qp)html+=PLQUALIDADE.ponto(qp,{decorativo:true}).outerHTML}   /* D-130: ponto na moldura (a folha é role=img) */
  return html+'</div></figure>'
}
function linhas(sh,p,px){                                          /* guias de corte · FN-02 · MT-04 */
  if(!D.guias||colOn())return'';   /* D-150: a Colagem não tem guias de corte */
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
/* ---------- Modo Colagem (D-150 a D-152): fundo + posições vindas de PLCOLAGEM, as mesmas do PDF (MT-02) ---------- */
function colOn(){return !!(C&&C.ativo&&window.PLCOLAGEM)}
function cfg(){return colOn()?PLCOLAGEM.config(D,C):D}
function COL(){return C}         /* D-176: a folha que está na tela — Colagem ou Folhas, nunca misturadas */
function fundoTela(p,px){
  if(!colOn())return{css:'',html:''};
  var F=PLCOLAGEM.fundo(C,FOTOS,REAL_ED);
  if(F.tipo==='cor')return{css:F.cor,html:''};
  if(F.tipo==='gradiente')return{css:'linear-gradient('+F.ang+'deg,'+F.cor+','+F.cor2+')',html:''};
  var u=PLFOTOTELA.tem(F.src,true);
  if(!u){if(!PLFOTOTELA.falhou(F.src))pedirMini(F.src,false);return{css:'#FFFFFF',html:''}}
  var b=PLCOLAGEM.blurMm(F.suave)*px;   /* a caixa cresce o desfoque para as bordas não clarearem (igual ao PDF) */
  return{css:'#FFFFFF',html:'<div class="sheet__fundo" data-fundo="foto" aria-hidden="true" style="position:absolute;inset:0;overflow:hidden;pointer-events:none"><div style="position:absolute;inset:'+(-b)+'px;background:url('+u+') '+F.px+'% '+F.py+'%/cover no-repeat'+(b>0?';filter:blur('+b+'px)':'')+'"></div><div style="position:absolute;inset:0;background:rgba(255,255,255,'+PLCOLAGEM.clareia(F.suave)+')"></div></div>'}
}
function desenhar(el,sh,p,px,det,idx,total){
  var fs='',fd=fundoTela(p,px);
  if(det&&REAL_ED){          /* os filtros das fotos ajustadas: um SVG só, no começo da folha */
    var defs=sh.cells.map(function(c){var e=(EST_Q&&EST_Q[c.f.n])||{};return PLFOTOTELA.filtro('pf-'+c.f.n,e)}).filter(Boolean).join('');
    if(defs)fs='<svg width="0" height="0" aria-hidden="true">'+defs+'</svg>';
  }
  var h=fd.html+fs+sh.cells.map(function(c){return polaroid(c,sh,px,det)}).join('')+linhas(sh,p,px);
  if(det&&!colOn()&&D.rodape&&px>1.2)h+='<div class="sheet__foot" style="bottom:'+Math.max(1,D.margem/2-1.2)*px+'px;font-size:'+2.2*px+'px">'+NOME+' · Folha '+(idx+1)+' de '+total+'</div>';
  el.style.width=p.w*px+'px';el.style.height=p.h*px+'px';el.style.setProperty('--mm',px+'px');el.style.background=fd.css;el.innerHTML=h;
  if(det)ajustarLeg(el,px)
}
/* «Ajustar para caber» (FN-07) e área segura (BR-13): mede a folha já desenhada */
var FORA=0;
function ajustarLeg(el,px){
  FORA=0;if(!LG)return;
  var min=8*.3528*px,sd=PLTEXTO.assinaturaPos(LG,FR)==='dir';   /* D-129/D-136: assinatura no canto oposto ao texto */
  [].forEach.call(el.querySelectorAll('figcaption'),function(fg){
    var cap=fg.querySelector('.pol__cap'),mt=fg.querySelector('.pol__meta');
    var lim=function(){return fg.clientWidth};
    if(cap&&LG.txt.fit){var fs=parseFloat(cap.style.fontSize);while(cap.scrollWidth>lim()+.5&&fs>min){fs-=.25;cap.style.fontSize=fs+'px'}}
    var x=0,base=(FR.h-3)*px,y0=fg.offsetTop,dy=(LG.dy||0)*px;
    var mls=[].slice.call(fg.querySelectorAll('.pol__ml'));  /* D-113: linhas absolutas também contam */
    if(cap&&cap.scrollWidth>lim()+.5)x=1;
    if(mt&&mt.scrollWidth>fg.clientWidth+.5)x=1;
    [].forEach.call(fg.querySelectorAll('.pol__mline'),function(m){if(m.scrollWidth>m.clientWidth+.5)x=1});
    mls.forEach(function(m){if(m.scrollWidth>m.clientWidth+.5)x=1});
    var h=0;[].forEach.call(fg.children,function(c){h=Math.max(h,c.offsetTop+c.offsetHeight)});  /* máximo: cobre as absolutas */
    if(sd){                                     /* MT-02/D-128: desconta a zona da assinatura na posição nova */
      var sig=fg.parentNode.querySelector('.pol__sig'),sr=sig?sig.getBoundingClientRect():null;
      if(sr)[].forEach.call(fg.querySelectorAll('.pol__cap,.pol__ml,.pol__mline > time,.pol__mline > span'),function(e){
        var b=e.getBoundingClientRect();
        if(b.right>sr.left+.5&&b.left<sr.right-.5&&b.bottom>sr.top+.5)x=1
      });
      if(y0+h+dy>FR.h*px+.5)x=1
    }else if(y0+h+dy>base)x=1;
    if(y0+dy<(FR.topo+FR.jh)*px-.5)x=1;
    if(x)FORA++
  })
}

/* ---------- estado e interface ---------- */
function snapHist(){return JSON.stringify({d:D,c:C})}                   /* D-176: o desfazer cobre Folhas e Colagem */
var R,cur=0,hist=[snapHist()],hi=0,lastK='',lastT=0;
function resumoTxt(){
  if(R.erro)return'A polaroid não cabe neste papel';
  if(R.colagem){var n=R.g.n,f=R.sheets.length;return f?n+(n===1?' polaroid':' polaroids')+' por folha · '+f+(f===1?' folha':' folhas'):'Sem fotos para a colagem'}   /* D-150: a contagem é a do layout (PLCOLAGEM), não a grade de Folhas */
  return R.g.n+' por folha · '+R.sheets.length+' folhas · aproveitamento '+aprov(R)+'%'
}
function render(){
  R=PLFOLHAS.paginar(cfg(),FR,FOTOS);
  var N=R.sheets.length;if(cur>=N)cur=Math.max(0,N-1);
  var p=R.p,orient=(colOn()?C.orient:D.orient)==='paisagem'?'paisagem':'retrato';   /* D-176 */
  var outro=Object.assign({},D,{orient:D.orient==='paisagem'?'retrato':'paisagem'}),RO=PLFOLHAS.paginar(outro,FR,FOTOS),sug=$('sug-orient');if(sug){var eco=!R.erro&&!RO.erro&&RO.sheets.length<R.sheets.length;sug.hidden=!eco;if(eco){var no=outro.orient==='paisagem'?'Paisagem':'Retrato';$('sug-orient-t').textContent=no+': '+RO.g.n+' por folha · economiza '+(R.sheets.length-RO.sheets.length)+' folha'+(R.sheets.length-RO.sheets.length===1?'':'s');$('sug-orient-b').textContent='Usar '+no.toLowerCase();$('sug-orient-b').onclick=function(){D.orient=outro.orient;commit('orient')}}}
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
  /* assinatura × plano (D-123): desabilitada com o motivo, nunca só por cor (T3) */
  var assinFixa=!!(PLN&&!PLN.assinaturaPodeDesligar);
  $('assin').setAttribute('aria-disabled',assinFixa);
  $('assin-h').firstChild.textContent=assinFixa?'Desligar a assinatura Polar Life é do Pro. Logo no canto inferior esquerdo de cada moldura.':'Logo no canto inferior esquerdo de cada moldura.';
  /* guias × contorno (FN-02) */
  $('contorno').setAttribute('aria-disabled',D.guias);$('contorno-h').hidden=!D.guias;
  [].forEach.call(document.querySelectorAll('[data-k=compr] .seg,[data-k=cor] .seg'),function(s){s.classList.toggle('is-off',!D.guias);[].forEach.call(s.querySelectorAll('input'),function(i){i.disabled=!D.guias})});
  /* apoios */
  var a=grade(D,p,false),b=grade(D,p,true),mais=b.n-a.n;
  $('girar-h').textContent=mais>0?(D.girar?'+'+mais+' por folha neste papel.':'Ligue para +'+mais+' por folha.'):'Não aumenta o número por folha neste papel.';
  $('gap-h').textContent=D.gap===0?(D.guias?'0 mm: polaroids encostadas; as guias viram uma linha só entre elas.':'0 mm: polaroids encostadas.'):'De 0 a 30 mm.';   /* D-150: padrão 0 mm */
  $('margem-h').textContent=D.margem<PLFOLHAS.MARGEM_MIN?'Abaixo de '+nf(PLFOLHAS.MARGEM_MIN)+' mm a impressora pode cortar a borda da folha.':'De 0 a 50 mm. Padrão: '+nf(PLFOLHAS.PADRAO.margem)+' mm.';   /* D-150 */
  /* chips e textos */
  var rt=resumoTxt(),r=$('result');r.classList.toggle('is-err',R.erro);r.querySelector('use').setAttribute('href',R.erro?'#i-x':'#i-check');$('result-t').textContent=rt;
  var linhaT=colOn()?'Colagem · sem guias de corte':D.guias?'Guias ligadas · '+(D.compr==='continua'?'linha contínua':'marcas de canto'):(D.contorno?'Contorno ligado':'Sem linhas de corte');
  [['rail-folhas','modes-folhas',false],['rail-colagem','modes-colagem',true]].forEach(function(t){var on=colOn()===t[2];t.slice(0,2).forEach(function(i){var e=$(i);if(!e)return;e.classList.toggle('is-on',on);if(on)e.setAttribute('aria-current','page');else e.removeAttribute('aria-current')})});   /* D-150: o modo ativo na barra lateral */
  $('ctx-modo').textContent=colOn()?'Modo Colagem':'Modo Folhas';
  $('rail-t').textContent=linhaT;$('rail-mm').textContent=colOn()?'—':D.guias?'0,15 mm':(D.contorno?'0,25 pt':'—');
  var hudLab=colOn()?'Colagem':D.guias?'Guias':(D.contorno?'Contorno':'Sem linhas'),hudVal=colOn()?'':D.guias?'0,15 mm':(D.contorno?'0,25 pt':'');
  $('hud-lab').textContent=hudLab;$('hud-val').textContent=hudVal;$('hud-val').hidden=!hudVal;
  $('hud-format').textContent=p.n;$('hud-orient').textContent=orient==='paisagem'?'Paisagem':'Retrato';
  $('cota-margem').textContent=nf(D.margem)+' mm';$('cota-gap').textContent=nf(D.gap)+' mm';
  var g=R.sheets[cur];
  $('faixa-n').textContent=N;$('faixa-label').hidden=!N;$('faixa-current').hidden=!N;$('faixa-total').hidden=!N;$('faixa-empty').hidden=!!N;
  $('faixa-current').textContent=cur+1;$('faixa-total').textContent=N;
  $('ctx-sheet-label').hidden=!N;$('ctx-sheet').hidden=!N;$('ctx-empty').hidden=!!N;
  $('ctx-sheet').textContent=(cur+1)+' de '+N;
  $('ctx-grupo').textContent=g&&g.grupo?g.grupo:'';$('ctx-grupo').hidden=!(g&&g.grupo);
  $('status').textContent=R.erro?'A polaroid não cabe neste papel':p.n+' '+orient+' · '+(R.colagem?R.g.n+' no máximo por folha · '+N+(N===1?' folha':' folhas')+' de colagem':R.g.n+' por folha · '+N+(N===1?' folha':' folhas')+' no total');
  $('mesa').classList.toggle('is-err',R.erro);$('err').hidden=!R.erro;
  $('prev').disabled=cur<=0;$('next').disabled=cur>=N-1;
  
  $('undo').disabled=hi<=0;$('redo').disabled=hi>=hist.length-1;
  [].forEach.call(document.querySelectorAll('[data-reset]'),function(bt){var k=bt.getAttribute('data-reset');bt.hidden=D[k]===DEF[k]});
  var q0=R.sheets[cur]&&R.sheets[cur].cells[0],qh='quadro/#foto-'+(q0?q0.f.n:1);$('rail-q').href=qh;$('modes-q').href=qh;
  desenharMesa();faixa();
}
function desenharMesa(){
  var st=$('stage'),sh=$('sheet'),p=R.p;
  if(R.erro||!R.sheets.length){sh.className='sheet is-empty';   /* sem folha: papel pequeno demais ou projeto ainda sem fotos */var px0=Math.min(st.clientWidth*.7/p.w,st.clientHeight/p.h);sh.style.width=p.w*px0+'px';sh.style.height=p.h*px0+'px';sh.innerHTML='';sh.setAttribute('aria-label','Folha vazia. A polaroid não cabe neste papel.');return}
  sh.className='sheet';
  var px=Math.min((st.clientWidth-8)/p.w,(st.clientHeight-8)/p.h);if(!(px>0))px=2;
  desenhar(sh,R.sheets[cur],p,px,px>1,cur,R.sheets.length);
  var qps=R.sheets[cur].cells.map(function(c){return ppiDe(c.f)}).filter(Boolean);
  sh.setAttribute('aria-label','Folha '+(cur+1)+' de '+R.sheets.length+', '+R.sheets[cur].cells.length+' polaroids'+(qps.length&&window.PLQUALIDADE?', '+PLQUALIDADE.resumo(qps):''));
  var av=$('aviso-leg');if(av){av.hidden=!FORA;av.textContent=FORA?'Atenção: a legenda sai da área segura em '+FORA+(FORA===1?' polaroid':' polaroids')+' desta folha. Ajuste o corpo ou a posição na aba Legendas do Quadro, ou ligue «Ajustar para caber».':''}
  $('ctx-scale').textContent=Math.round(px/(96/25.4)*100)+'%'
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
document.addEventListener('keydown',function(e){if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA')ir(cur+(e.key==='ArrowLeft'?-1:1))});
var toqueX;$('stage').addEventListener('pointerdown',function(e){toqueX=e.clientX});$('stage').addEventListener('pointerup',function(e){if(toqueX!=null&&Math.abs(e.clientX-toqueX)>40)ir(cur+(e.clientX<toqueX?1:-1));toqueX=null});

/* ---------- histórico (FN-00c) ---------- */
function commit(k){
  var antes=R.sheets.length;
  render();
  var s=snapHist(),now=Date.now();
  if(s===hist[hi])return;
  if(k&&k===lastK&&now-lastT<700&&hi>0){hist[hi]=s}else{hist=hist.slice(0,hi+1);hist.push(s);hi++}
  lastK=k;lastT=now;salvaD();
  render();
  var dep=R.sheets.length;
  if(k!=='modo'&&!R.erro&&antes&&dep&&antes!==dep)toast(antes+' folhas → '+dep+' folhas',true)
}
function aplicarHist(j){hi=j;var o=JSON.parse(hist[hi]);D=o.d;C=o.c;lastK='';salvaD();render()}
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
$('save').onclick=function(){if(!window.PLPROJETOS||!PLPROJETOS.atual()){toast('Abra um projeto para salvar o backup.');return}PLPROJETOS.exportar(PLPROJETOS.atual()).then(function(o){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download=o.projeto.nome+'.polarlife';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},0)})};
$('go').onclick=$('go2').onclick=function(){window.PLPREVOO.abrir(this)};   /* T-18 · pré-voo */
/* gancho para o pré-voo: mede a legenda em todas as folhas, desenhando-as fora da tela */
window.PLEDITOR={toast:toast,ctx:function(){return{R:R,D:D,C:C,FR:FR,FOTOS:FOTOS,LG:LG,aprov:aprov,ppi:ppiDe,
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
var ESCOPO='todas';
function alvo(){return ESCOPO==='folha'&&R.sheets[cur]?R.sheets[cur].cells.map(function(c){return c.f.n}):FOTOS.map(function(f){return f.n})}
function quadro(){try{var q=JSON.parse(sessionStorage.getItem('pl-quadro')||'null');if(Array.isArray(q)&&q.length===NF+1)return q}catch(e){}var q=[{leg:LG,fr:FR}];FOTOS.forEach(function(f){q.push({src:f.src,z:100,ang:0,px:0,py:0,rot:0,flip:false,modo:'preencher',adj:{brilho:0,contraste:0,saturacao:0,temp:0,realces:0,sombras:0,nitidez:0,vinheta:0},flt:{id:'original',int:100},txt:f.leg||null})});return q}
function salvarQuadro(q){q[0]=q[0]||{};q[0].leg=LG;q[0].fr=FR;q[0].nome=REAL_ED?NOME:null;EST_Q=q;try{sessionStorage.setItem('pl-quadro',JSON.stringify(q));sessionStorage.removeItem('pl-fmt');   /* D-159: a moldura já está no projeto */if(window.PLSESSAO)PLSESSAO.agendar()}catch(e){}}
function escopo(){var n=alvo().length;$('scope-t').textContent='Alterando: '+(ESCOPO==='folha'?'Esta folha':'Todas as fotos')+' · '+n;var a=$('escopo-ajuda');if(a)a.textContent=ESCOPO==='folha'?'Somente as '+n+' fotos desta folha.':'Todas as '+n+' fotos do projeto.'}
/* ---------- aba Colagem (D-150 a D-152) ---------- */
function modoColagem(ligar){return function(e){if(e)e.preventDefault();if(colOn()===ligar)return;colSet(function(c){c.ativo=ligar},'modo');abasDoModo()}}
['rail-folhas','modes-folhas'].forEach(function(i){$(i).onclick=modoColagem(false)});['rail-colagem','modes-colagem'].forEach(function(i){$(i).onclick=modoColagem(true)});
if(location.hash==='#colagem')setTimeout(function(){modoColagem(true)();try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}},0);   /* D-161: «Colagem» no Quadro abre as Folhas já no modo Colagem */
function colSet(fn,k){C=PLCOLAGEM.norm(C);fn(C);C=PLCOLAGEM.norm(C);commit(k||'colagem')}
function painelColagem(){
  var C=PLCOLAGEM.norm(COL()),F=C.fundo,h='',L=PLCOLAGEM.LAYOUTS.filter(function(l){return l.id===C.layout})[0];
  /* D-176: tamanho próprio da colagem (não mexe no papel das Folhas) e escolha das fotos que entram */
  var PE=PLCOLAGEM.PECAS,TODAS=!C.fotos;
  h+='<section class="mod"><h3 class="mod__h rotulo rotulo--m">Tamanho da colagem</h3><p class="f__h">A colagem tem papel próprio: as Folhas de polaroids para recortar continuam como estão.</p>'
    +'<div class="f"><label class="f__l" for="col-peca">Papel da colagem</label><div class="sel"><select id="col-peca">'+Object.keys(PE).map(function(k){return'<option value="'+k+'"'+(k===C.peca?' selected':'')+'>'+PE[k].n+' ('+PE[k].w+' × '+PE[k].h+' mm)</option>'}).join('')+'</select></div></div>'
    +'<div class="f"><span class="f__l" id="col-ori-l">Orientação</span><div class="seg" role="radiogroup" aria-labelledby="col-ori-l">'+[['retrato','Retrato'],['paisagem','Paisagem']].map(function(t){return'<label class="seg__o"><input type="radio" name="col-ori" value="'+t[0]+'"'+(C.orient===t[0]?' checked':'')+'><span>'+t[1]+'</span></label>'}).join('')+'</div></div>'
    +faixa('col-margem','Margem da colagem',C.margem,3,25,' mm')+'</section>';
  h+='<section class="mod"><h3 class="mod__h rotulo rotulo--m">Fotos da colagem</h3><div class="sw-row"><div><span class="f__l">Usar todas as fotos</span><p class="f__h">'+(TODAS?'Todas as '+FOTOS.length+' fotos entram na colagem.':C.fotos.length+' de '+FOTOS.length+' fotos escolhidas.')+'</p></div><button type="button" class="sw" id="col-todas" role="switch" aria-checked="'+TODAS+'" aria-label="Usar todas as fotos"><span></span></button></div>'
    +(TODAS?'':'<div class="foto-grid" id="col-sel">'+FOTOS.map(function(f){var on=C.fotos.indexOf(f.src)>=0,u=REAL_ED?PLFOTOTELA.tem(f.src,true):'';if(REAL_ED&&!u&&!PLFOTOTELA.falhou(f.src))pedirMini(f.src,false);return'<button type="button" class="foto-mini" data-col-foto="'+f.src+'" aria-pressed="'+on+'">'+(u?'<span style="padding-top:0">'+PLFOTOTELA.html(u,0,'cover')+'</span>':'')+'<small>'+(on?'✓ ':'')+'Foto '+f.n+'</small></button>'}).join('')+'</div><p class="f__h">Toque nas fotos para tirar ou pôr na colagem.</p>')+'</section>';
  h+='<section class="mod"><h3 class="mod__h rotulo rotulo--m">Layout</h3><div class="f"><label class="f__l" for="col-layout">Disposição das polaroids</label><div class="sel"><select id="col-layout">'+PLCOLAGEM.LAYOUTS.map(function(l){return'<option value="'+l.id+'"'+(l.id===C.layout?' selected':'')+'>'+l.n+'</option>'}).join('')+'</select></div><p class="f__h" id="col-layout-h">'+L.d+' A medida da polaroid não muda: o que não cabe passa para a folha seguinte.</p></div></section>';
  h+='<section class="mod"><h3 class="mod__h rotulo rotulo--m">Fundo da folha</h3><div class="f"><span class="f__l" id="col-tipo-l">Tipo de fundo</span><div class="seg" role="radiogroup" aria-labelledby="col-tipo-l" id="col-tipo">'+[['cor','Cor'],['gradiente','Degradê'],['foto','Foto']].map(function(t){return'<label class="seg__o"><input type="radio" name="col-tipo" value="'+t[0]+'"'+(F.tipo===t[0]?' checked':'')+'><span>'+t[1]+'</span></label>'}).join('')+'</div></div>';
  function cor(id,rot,v){return'<div class="f"><label class="f__l" for="'+id+'">'+rot+'</label><div class="col-cor"><input type="color" id="'+id+'" value="'+v.toLowerCase()+'" aria-label="'+rot+'"><input type="text" id="'+id+'-hex" value="'+v+'" maxlength="7" inputmode="text" autocomplete="off" spellcheck="false" aria-label="'+rot+', código hexadecimal"></div></div>'}
  function faixa(id,rot,v,min,max,u){return'<div class="f"><div class="f__top"><label class="f__l" for="'+id+'">'+rot+'</label><span class="mono" id="'+id+'-v">'+v+u+'</span></div><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" value="'+v+'"></div>'}
  if(F.tipo==='cor')h+=cor('col-cor','Cor do fundo',F.cor)+'<p class="f__h">Qualquer cor: o fundo é conteúdo da sua colagem.</p>';
  if(F.tipo==='gradiente')h+=cor('col-cor','Cor inicial',F.cor)+cor('col-cor2','Cor final',F.cor2)+faixa('col-ang','Ângulo',F.ang,0,360,'°');
  if(F.tipo==='foto'){
    var cur=PLCOLAGEM.fotoDeFundo(C,FOTOS);
    h+='<div class="f"><span class="f__l">Foto do fundo</span><div class="foto-grid" id="col-fotos">'+FOTOS.map(function(f){
      var u=REAL_ED?PLFOTOTELA.tem(f.src,true):'';if(REAL_ED&&!u&&!PLFOTOTELA.falhou(f.src))pedirMini(f.src,false);
      return'<button type="button" class="foto-mini" data-fundo-foto="'+f.src+'" aria-pressed="'+(f.src===cur)+'">'+(u?'<span style="padding-top:0">'+PLFOTOTELA.html(u,0,'cover')+'</span>':'')+'<small>'+(f.src===cur?'✓ ':'')+'Foto '+f.n+'</small></button>'}).join('')+'</div><p class="f__h">'+(C.fundo.foto==null?'Padrão: a primeira foto do projeto.':'Foto escolhida. ')+'</p>'+(C.fundo.foto!=null?'<button type="button" class="btn2 btn2--sm" id="col-foto-padrao">Usar a primeira foto</button>':'')+'</div>';
    h+=faixa('col-px','Posição horizontal',F.px,0,100,'%')+faixa('col-py','Posição vertical',F.py,0,100,'%')+faixa('col-suave','Suavizar o fundo',F.suave,0,100,'%')+'<p class="f__h">A foto cobre a folha toda. Suavizar desfoca e clareia o fundo para as polaroids se destacarem.</p>';
  }
  return h+'</section>'
}
function ligaColagem(id){
  var P=$('painel-extra'),q=function(s){return P.querySelector(s)};
  var pc=q('#col-peca');if(pc)pc.onchange=function(){var v=this.value;colSet(function(c){c.peca=v});painelExtra(id)};
  [].forEach.call(P.querySelectorAll('[name=col-ori]'),function(r){r.onchange=function(){var v=this.value;colSet(function(c){c.orient=v});painelExtra(id)}});
  var mg=q('#col-margem');if(mg)mg.oninput=function(){q('#col-margem-v').textContent=mg.value+' mm';colSet(function(c){c.margem=+mg.value},'col-margem')};
  var td=q('#col-todas');if(td)td.onclick=function(){colSet(function(c){c.fotos=c.fotos?null:FOTOS.map(function(f){return f.src})});painelExtra(id)};
  [].forEach.call(P.querySelectorAll('[data-col-foto]'),function(b){b.onclick=function(){var v=+b.getAttribute('data-col-foto');colSet(function(c){var a=c.fotos||[],i=a.indexOf(v);if(i>=0){if(a.length>1)a.splice(i,1)}else a.push(v);c.fotos=FOTOS.map(function(f){return f.src}).filter(function(x){return a.indexOf(x)>=0})});painelExtra(id)}});
  q('#col-layout').onchange=function(){var v=this.value;colSet(function(c){c.layout=v});painelExtra(id)};
  [].forEach.call(P.querySelectorAll('[name=col-tipo]'),function(r){r.onchange=function(){var v=this.value;colSet(function(c){c.fundo.tipo=v});painelExtra(id)}});
  function cor(i,k){var a=q('#'+i),b=q('#'+i+'-hex');if(!a)return;
    a.oninput=function(){b.value=a.value.toUpperCase();colSet(function(c){c.fundo[k]=a.value},'col-'+k)};
    b.onchange=function(){var v=b.value.trim();if(v[0]!=='#')v='#'+v;if(/^#[0-9a-f]{6}$/i.test(v)){b.value=v.toUpperCase();a.value=v.toLowerCase();colSet(function(c){c.fundo[k]=v},'col-'+k)}else b.value=a.value.toUpperCase()}}
  cor('col-cor','cor');cor('col-cor2','cor2');
  [['col-ang','ang','°'],['col-px','px','%'],['col-py','py','%'],['col-suave','suave','%']].forEach(function(t){var e=q('#'+t[0]);if(e)e.oninput=function(){q('#'+t[0]+'-v').textContent=e.value+t[2];colSet(function(c){c.fundo[t[1]]=+e.value},t[0])}});
  [].forEach.call(P.querySelectorAll('[data-fundo-foto]'),function(b){b.onclick=function(){var s=+b.getAttribute('data-fundo-foto');colSet(function(c){c.fundo.foto=(FOTOS[0]&&s===FOTOS[0].src)?null:s});painelExtra(id)}});
  var pd=q('#col-foto-padrao');if(pd)pd.onclick=function(){colSet(function(c){c.fundo.foto=null});painelExtra(id)}
}
function painelExtra(id){
  if(id==='tab-legendas'&&!LG)LG=JSON.parse(JSON.stringify(PLTEXTO.LEG0));
  var h=id==='tab-colagem'?'':window.PLCTRL.escopo(),ids=alvo(),q=quadro();
  if(id==='tab-fotos'){
    var minis=FOTOS.map(function(f){
      var u=REAL_ED?PLFOTOTELA.tem(f.src,true):'';
      if(REAL_ED&&!u&&!PLFOTOTELA.falhou(f.src))pedirMini(f.src,false);
      return'<button type="button" class="foto-mini" data-abrir="'+f.n+'">'+(u?'<span style="padding-top:0">'+PLFOTOTELA.html(u,0,'cover')+'</span>':'')+'<small>Foto '+f.n+'</small></button>'
    }).join('');
    h+='<section class="mod"><h3 class="mod__h rotulo rotulo--m">Suas fotos · '+NF+'</h3><div class="foto-grid">'+minis+'</div><a class="btn2" href="../adicionar-fotos/">Adicionar fotos</a><p class="f__h">Abra uma foto para recortar, duplicar ou remover.</p></section>';
  }
  if(id==='tab-ajustes'){var a=q[ids[0]]&&q[ids[0]].adj||{};h+='<section class="mod"><h3 class="mod__h rotulo rotulo--m">Luz e cor</h3>'+window.PLCTRL.numero('ef-brilho','Brilho',a.brilho||0,-100,100,1,'')+window.PLCTRL.numero('ef-contraste','Contraste',a.contraste||0,-100,100,1,'')+'<div class="f"><label class="f__l" for="ef-filtro">Filtro</label><div class="sel"><select id="ef-filtro"><option value="original">Original</option><option value="pb">Preto e branco</option><option value="retro">Retrô</option><option value="cinema">Cinema</option></select></div></div><p class="f__h">As alterações respeitam ajustes individuais protegidos.</p></section>'}
  if(id==='tab-legendas'){h+='<section class="mod"><h3 class="mod__h rotulo rotulo--m">Legenda</h3><div class="sw-row"><div><span class="f__l">Sem legendas</span><p class="f__h" id="orig-estado">'+(LG.original?'Ligado · só a foto e a moldura':'Desligado · textos visíveis')+'</p></div><button type="button" class="sw" id="ef-original" role="switch" aria-checked="'+!!LG.original+'" aria-label="Sem legendas"><span></span></button></div><div class="f"><span class="f__l" id="ef-al-l">Alinhamento</span><div class="seg" role="radiogroup" aria-labelledby="ef-al-l" id="ef-al"><label class="seg__o"><input type="radio" name="ef-al" value="esq"><span>Esquerda</span></label><label class="seg__o"><input type="radio" name="ef-al" value="centro"><span>Centro</span></label><label class="seg__o"><input type="radio" name="ef-al" value="dir"><span>Direita</span></label></div><p class="f__h">Sempre abaixo da foto, nas mesmas margens laterais.</p></div></section>'}
  if(id==='tab-molduras')h+='<section class="mod"><h3 class="mod__h rotulo rotulo--m">Formato e estilo das fotos</h3><div class="f"><label class="f__l" for="ef-formato">Moldura</label><div class="sel"><select id="ef-formato"><option value="classico">Polaroid Clássico · 88 × 107 mm</option><option value="mini">Mini quadrado · 60 × 73 mm</option><option value="pocket">Retro Pocket · 66 × 99 mm</option><option value="imini">Instax Mini · 54 × 86 mm</option><option value="isq">Instax Square · 72 × 86 mm</option><option value="iwide">Instax Wide · 108 × 86 mm</option></select></div></div><p class="f__h">A medida da polaroid fica travada; a folha apenas reorganiza.</p></section>';
  if(id==='tab-colagem')h=painelColagem();
  $('painel-extra').innerHTML=h;var se=$('escopo-folhas');if(se){se.value=ESCOPO;escopo();
  se.onchange=function(){ESCOPO=this.value;painelExtra(id)}}
  if(id==='tab-colagem')ligaColagem(id);
  var orig=$('ef-original');if(orig)orig.onclick=function(){LG.original=!LG.original;salvarQuadro(quadro());render();painelExtra(id)};
  var al=$('ef-al');if(al){[].forEach.call(al.querySelectorAll('input'),function(r){r.checked=r.value===(LG.al||'esq');r.onchange=function(){LG.al=this.value;salvarQuadro(quadro());render()}})};   /* D-136: botões de seleção E · C · D */
  var fmt=$('ef-formato');if(fmt)fmt.value=FR.fmt||(POCKET?'pocket':'classico');if(fmt)fmt.onchange=function(){var o=PLFOLHAS.FORMATOS[this.value],m=[o.w,o.h,o.lado,o.topo,o.jh]; /* mesmas medidas do FMT de molduras.js (D-113) */
    FR={fmt:this.value,w:m[0],h:m[1],lado:m[2],topo:m[3],jw:m[0]-2*m[2],jh:m[4],rad:FR.rad!=null?FR.rad:.4,man:false,lock:true,ori:FR.ori||'v'};
    if(this.value==='pocket')LG=PLTEXTO.legPocket(LG||PLTEXTO.LEG0);   /* D-113: legenda em duas linhas */salvarQuadro(quadro());render();toast('Formato aplicado a '+alvo().length+' fotos')};
  [].forEach.call($('painel-extra').querySelectorAll('.num input'),function(i){i.onchange=function(){var v=Math.max(-100,Math.min(100,parseFloat(this.value.replace(',','.'))||0)),q=quadro();this.value=v,k=this.id==='ef-brilho'?'brilho':'contraste';alvo().forEach(function(n){q[n].adj[k]=v});salvarQuadro(q);render();toast(k==='brilho'?'Brilho aplicado a '+alvo().length+' fotos':'Contraste aplicado a '+alvo().length+' fotos')};});
  [].forEach.call($('painel-extra').querySelectorAll('[data-step]'),function(b){b.onclick=function(){var i=this.parentNode.querySelector('input'),v=(parseFloat(i.value)||0)+parseFloat(this.getAttribute('data-step'));i.value=v;i.dispatchEvent(new Event('change'))}});
  [].forEach.call($('painel-extra').querySelectorAll('[data-abrir]'),function(b){b.onclick=function(){location.href='quadro/#foto-'+b.getAttribute('data-abrir')}})
}
function aba(t){ABA=t.id;tabs.forEach(function(x){var on=x===t;x.classList.toggle('is-on',on);x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1});var papel=t.id==='tab-papel';$('p-papel').hidden=!papel;$('p-outra').hidden=papel;$('p-outra').setAttribute('aria-labelledby',t.id);if(!papel)painelExtra(t.id)}
tabs.forEach(function(t,i){t.onclick=function(){aba(t)};t.onkeydown=function(e){var j=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:-1;if(j<0)return;j=(j+tabs.length)%tabs.length;for(var n=0;tabs[j].hidden&&n<tabs.length;n++)j=(j+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[j].focus();aba(tabs[j]);e.preventDefault()}});
/* D-176: no modo Colagem a aba «Papel» (das Folhas) dá lugar à aba «Colagem»; nas Folhas, o contrário */
function abasDoModo(){var co=colOn(),tp=$('tab-papel'),tc=$('tab-colagem');if(!tp||!tc)return;tp.hidden=co;tc.hidden=!co;
  if(co&&ABA!=='tab-colagem'&&(ABA==='tab-papel'||!ABA||colOn()))aba(tc);else if(!co&&ABA==='tab-colagem')aba(tp)}
abasDoModo();

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
