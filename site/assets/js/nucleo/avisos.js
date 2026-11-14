/* PLAVISOS · notificações do PolarLife (D-208, DOC-16). Um modelo só de aviso:
     {id, tipo:'lembranca'|'sugestao'|'codigo'|'promocao'|'anuncio'|'sistema', titulo, texto, url, acao, criadoEm, validoAte,
      origem:'local'|'campanha', campanhaId?, fotos?:[chaves locais], criar?, estado:{lido, dispensado, adiadoAte, abertoEm, sistemaEm}}
   Caixa de entrada e preferências por conta, em localStorage («pl-avisos»). Avisos automáticos gerados no aparelho, a partir das
   fotos dos projetos da conta (IndexedDB), dos códigos e do plano (PLCONTA). Campanhas do admin em «pl-avisos-admin» (sem servidor:
   valem neste navegador, T7). Discrição (DOC-16 §3): no máximo 1 lembrança por dia e 1 sugestão por semana; notificação do aparelho
   só com permissão dada na Conta, sem som, fora do horário silencioso e no máximo 1 por dia.
   Privacidade (T5): a colagem é desenhada aqui (PLAVISOSARTE) e nenhuma foto, miniatura ou legenda sai do aparelho. */
(function(){
'use strict';
var K='pl-avisos',KA='pl-avisos-admin',DIA=86400000,BANCO='polar-life-avisos';
var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
var TIPOS={
  lembranca:{nome:'Lembranças',um:'Lembrança',desc:'Fotos suas deste dia em outros anos, com uma colagem.'},
  sugestao:{nome:'Sugestões',um:'Sugestão',desc:'Ideias de colagem a partir das fotos que você já tem.'},
  codigo:{nome:'Prazos',um:'Prazo',desc:'Código de impressão ou plano perto de vencer.'},
  promocao:{nome:'Promoções',um:'Promoção',desc:'Ofertas do PolarLife.'},
  anuncio:{nome:'Anúncios',um:'Anúncio',desc:'Novidades do PolarLife.'},
  sistema:{nome:'Avisos do PolarLife',um:'Aviso',desc:'Recados sobre o funcionamento do app.'}};
var ORDEM_SIS=['codigo','lembranca','sistema','sugestao','anuncio','promocao'];   /* o que vale mais a notificação do dia */
var PUBLICOS={todos:'Todas as contas',gratis:'Plano Grátis',avulsa:'Folha avulsa',assinantes:'Assinantes do Pro','codigo-vencendo':'Quem tem código perto de vencer'};
var DESTINOS=[{url:'',nome:'Projetos'},{url:'inicio/',nome:'Início'},{url:'conta/planos/',nome:'Folhas e planos'},{url:'conta/#codigos',nome:'Códigos de impressão'},{url:'conta/',nome:'Conta'},{url:'novo-projeto/',nome:'Novo projeto'}];
/* textos dos avisos automáticos, editáveis pelo admin. Variáveis: ver VARS */
var MODELOS_PADRAO={
  lembranca:{titulo:'Há {anos}: {fotos} de {data}',texto:'Reveja este dia e faça uma colagem com as suas fotos.'},
  sugestao:{titulo:'Você tem {fotos} de {mes}',texto:'Que tal uma retrospectiva? A colagem começa com as fotos que já estão no seu aparelho.'},
  codigo:{titulo:'Seu código vence em {dias}',texto:'O código {codigo} vale até {data}. Restam {folhas}.'}};
var VARS={lembranca:['anos','fotos','qtd','data','ano'],sugestao:['fotos','qtd','mes','ano'],codigo:['dias','codigo','data','folhas','qtd']};
var ouvintes=[],rodando=null,MEM={};

function ler(k,p){try{var v=localStorage.getItem(k);return v?JSON.parse(v):p}catch(e){return p}}
function gravar(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function agora(){return Date.now()}
function n1(n,um,varios){return n+' '+(n===1?um:varios)}
function dois(n){return ('0'+n).slice(-2)}
function diaLocal(t){var d=new Date(t);return d.getFullYear()+'-'+dois(d.getMonth()+1)+'-'+dois(d.getDate())}
function dataExtenso(d,m){return (d===1?'1º':d)+' de '+MESES[m]}
function maiuscula(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function soma(s){var h=2166136261,i;for(i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}
/* a mesma chave de dono dos projetos (D-193): resumo da conta, sem o e-mail */
function dono(){var c=ler('pl-conta',null),s=ler('pl-codigo-sessao',null),k=c&&c.email?'conta:'+String(c.email).trim().toLowerCase():s&&s.hash?'codigo:'+s.hash:'';return k?soma(k):''}
function raizApp(){var p=location.pathname,i=p.indexOf('/app/');return location.origin+(i<0?'/':p.slice(0,i+5))}
function avisar(){ouvintes.forEach(function(f){try{f()}catch(e){}})}
function formatar(m,v){return String(m||'').replace(/\{([a-z]+)\}/g,function(t,k){return v&&v[k]!==undefined?String(v[k]):t})}
function corta(s,n){s=String(s||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1).replace(/\s+\S*$/,'')+'…':s}

/* ---------- caixa de entrada e preferências, por conta ---------- */
function tudo(){var o=ler(K,null);if(!o||o.v!==1||!o.contas)o={v:1,contas:{}};return o}
function minha(o){var d=dono();if(!d)return null;var c=o.contas[d];if(!c)c=o.contas[d]={itens:{}};c.itens=c.itens||{};return c}
function mudar(fn){var o=tudo(),c=minha(o);if(!c)return null;var r=fn(c);gravar(K,o);return r}
function hora(v,p){v=Math.round(+v);return v>=0&&v<=23?v:p}
function prefsDe(c){
  var p=c&&c.prefs||{},t=p.tipos||{},s=p.silencio||{},k,
    out={ligado:p.ligado!==false,tipos:{},canal:p.canal==='sistema'?'sistema':'app',silencio:{ini:hora(s.ini,22),fim:hora(s.fim,8)},atualizadoEm:p.atualizadoEm||null};
  for(k in TIPOS)out.tipos[k]=t[k]!==false;
  return out
}
function prefs(){var c=minha(tudo());return prefsDe(c)}
/* futura PUT /conta/avisos/preferencias → avisos.salvar_preferencias (DOC-15 §8) */
function salvarPrefs(d){
  if(!dono())return {erro:'sessao'};
  var r=mudar(function(c){
    var p=prefsDe(c),k;
    if(d&&d.ligado!==undefined)p.ligado=!!d.ligado;
    if(d&&d.tipos)for(k in TIPOS)if(d.tipos[k]!==undefined)p.tipos[k]=!!d.tipos[k];
    if(d&&d.canal!==undefined){if(d.canal!=='app'&&d.canal!=='sistema')return {erro:'canal'};p.canal=d.canal}
    if(d&&d.silencio){
      var a=d.silencio.ini!==undefined?hora(d.silencio.ini,-1):p.silencio.ini,b=d.silencio.fim!==undefined?hora(d.silencio.fim,-1):p.silencio.fim;
      if(a<0||b<0)return {erro:'horario'};
      p.silencio={ini:a,fim:b}
    }
    p.atualizadoEm=new Date(agora()).toISOString();
    c.prefs=p;delete c.dia;                                  /* ligar um tipo vale já: os avisos do dia são conferidos de novo */
    return {ok:true,preferencias:p}
  });
  avisar();
  return r
}
/* horário silencioso (padrão 22h–8h): vale para a notificação do aparelho; o painel dentro do app nunca interrompe */
function silencioso(dt,p){
  p=p||prefs();var h=(dt||new Date(agora())).getHours(),a=p.silencio.ini,b=p.silencio.fim;
  if(a===b)return false;
  return a<b?(h>=a&&h<b):(h>=a||h<b)
}

/* ---------- painel do admin: campanhas, textos automáticos e pausas (feed deste navegador) ---------- */
function adm(){
  var o=ler(KA,null);
  if(!o||o.v!==1)o={v:1,campanhas:[],modelos:{},pausados:{}};
  o.campanhas=o.campanhas||[];o.modelos=o.modelos||{};o.pausados=o.pausados||{};
  return o
}
function modelosDe(A){var out={},k;for(k in MODELOS_PADRAO){var m=A.modelos[k]||{};out[k]={titulo:m.titulo||MODELOS_PADRAO[k].titulo,texto:m.texto||MODELOS_PADRAO[k].texto}}return out}
function viva(c,t){return (c.estado==='ativa'||c.estado==='agendada')&&(!c.inicio||c.inicio<=t)&&(!c.fim||c.fim>t)}
function situacao(c,t){ /* o que o painel mostra */
  if(c.estado==='rascunho'||c.estado==='pausada'||c.estado==='encerrada')return c.estado;
  if(c.fim&&c.fim<=t)return 'encerrada';
  if(c.inicio&&c.inicio>t)return 'agendada';
  return 'no-ar'
}

/* ---------- o que a conta tem: fotos com data, códigos e plano ---------- */
function partesIso(iso){var m=/^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d):(\d\d))?/.exec(String(iso||''));if(!m)return null;var a=+m[1],me=+m[2]-1,d=+m[3];if(a<1990||me>11||d<1||d>31)return null;return {a:a,m:me,d:d,t:new Date(a,me,d,+(m[4]||12),+(m[5]||0)).getTime()}}
/* fotos dos projetos desta conta: a data vem do estado do projeto («pl-quadro», meta.iso) e, sem ela, do EXIF guardado com a foto.
   Só leitura. Devolve {fotos:[{k,pid,a,m,d,t}], projetos:[{id,nome,criadoEm,fotos}]} */
function fotosDaConta(){
  var vazio={fotos:[],projetos:[]};
  if(!window.PLFOTOS||!window.indexedDB)return Promise.resolve(vazio);
  var D=dono();
  return PLFOTOS.abrirDB().then(function(d){return new Promise(function(ok){
    var t=d.transaction(['projetos','fotosProjeto'],'readonly'),ps=t.objectStore('projetos').getAll(),vs=t.objectStore('fotosProjeto').getAll(),ks=t.objectStore('fotosProjeto').getAllKeys();
    t.oncomplete=function(){
      d.close();
      var por={},fotos=[],vistos={},projetos=[],i;
      (ps.result||[]).forEach(function(p){
        if(p.exemplo||(p.dono&&p.dono!==D))return;
        var ordem=[],q=null;
        try{ordem=JSON.parse(p.estado&&p.estado['pl-fotos']||'[]')||[]}catch(e){}
        try{q=JSON.parse(p.estado&&p.estado['pl-quadro']||'null')}catch(e){}
        por[p.id]={ordem:ordem.map(Number),q:Array.isArray(q)?q:null,n:0};
        projetos.push({id:p.id,nome:p.nome||'Projeto sem nome',criadoEm:p.criadoEm||0,fotos:0})
      });
      for(i=0;i<(ks.result||[]).length;i++){
        var k=String(ks.result[i]),c=k.indexOf(':'),pid=k.slice(0,c),src=Number(k.slice(c+1)),P=por[pid],v=vs.result[i];
        if(!P||!v||!v.blob)continue;
        P.n++;
        var pos=P.ordem.indexOf(src),e=P.q&&pos>=0?P.q[pos+1]:null,iso=e&&e.meta&&e.meta.iso||v.meta&&v.meta.iso,dt=partesIso(iso);
        if(!dt)continue;
        var ass=(v.nome||'')+'|'+iso+'|'+v.w+'x'+v.h;         /* a mesma foto em dois projetos conta uma vez */
        if(vistos[ass])continue;vistos[ass]=1;
        fotos.push({k:k,pid:pid,a:dt.a,m:dt.m,d:dt.d,t:dt.t})
      }
      projetos.forEach(function(p){p.fotos=por[p.id].n});
      fotos.sort(function(a,b){return a.t-b.t});
      ok({fotos:fotos,projetos:projetos})
    };
    t.onerror=t.onabort=function(){d.close();ok(vazio)}
  })}).catch(function(){return vazio})
}
function chaves(l,max){return l.slice(0,max||24).map(function(f){return f.k})}
function codigosComPrazo(){ /* códigos com saldo e validade: {final, restam, validoAte(ms), dias} */
  var C=window.PLCONTA,out=[],t=agora();
  if(!C||!C.codigos)return out;
  C.codigos().forEach(function(k,i){
    if(k.situacao!=='disponivel'||!k.restam||!k.validoAte)return;
    var v=new Date(k.validoAte).getTime(),dias=Math.ceil((v-t)/DIA);
    if(dias<1&&v<=t)return;
    out.push({final:k.final||'',n:i,restam:k.restam,classe:k.classe,validoAte:v,dias:Math.max(1,dias)})
  });
  return out
}
function publicoDaConta(){
  var P=window.PLCONTA&&PLCONTA.plano?PLCONTA.plano():null,id=P&&P.id,l=['todos'];
  if(id==='gratis')l.push('gratis');
  if(id==='avulsa')l.push('avulsa');
  if(id==='pro'||id==='admin')l.push('assinantes');
  if(codigosComPrazo().some(function(k){return k.dias<=7}))l.push('codigo-vencendo');
  return l
}

/* ---------- geradores locais ---------- */
function novo(c,it){
  if(c.itens[it.id])return false;
  it.titulo=corta(it.titulo,60);it.texto=corta(it.texto,160);
  it.criadoEm=agora();it.origem=it.origem||'local';it.estado={};
  c.itens[it.id]=it;return true
}
/* «Neste dia»: fotos com o mesmo dia e mês em anos anteriores. Sem o dia exato: a semana passada (3 fotos ou mais) e, uma vez
   por mês, o mesmo mês do ano passado (6 ou mais). Devolve o aviso (sem gravar) ou null. */
function lembrancaDe(fotos,dt,M,soDia){
  var a=dt.getFullYear(),m=dt.getMonth(),d=dt.getDate(),hoje=diaLocal(dt.getTime()),porAno={},melhor=0,ano,l,s7,v;
  fotos.forEach(function(f){if(f.m===m&&f.d===d&&f.a<a){(porAno[f.a]=porAno[f.a]||[]).push(f)}});
  for(ano in porAno)if(porAno[ano].length>melhor||(porAno[ano].length===melhor&&+ano>+v)){melhor=porAno[ano].length;v=ano}
  if(melhor){
    l=porAno[v];
    var vars={anos:n1(a-v,'ano','anos'),fotos:n1(l.length,'foto','fotos'),qtd:l.length,data:dataExtenso(d,m),ano:v};
    return {id:'lem-'+hoje,tipo:'lembranca',dia:hoje,titulo:formatar(M.lembranca.titulo,vars),texto:formatar(M.lembranca.texto,vars),acao:'Criar colagem',
      fotos:chaves(l),criar:{nome:'Lembranças de '+dataExtenso(d,m)+' de '+v,col:{layout:'espalhadas'}},validoAte:dt.getTime()+7*DIA}
  }
  if(soDia)return null;
  s7=new Date(a,m,d-7);
  l=fotos.filter(function(f){return f.a===s7.getFullYear()&&f.m===s7.getMonth()&&f.d===s7.getDate()});
  if(l.length>=3)return {id:'lem-'+hoje,tipo:'lembranca',dia:hoje,titulo:'Há uma semana: '+n1(l.length,'foto','fotos')+' de '+dataExtenso(s7.getDate(),s7.getMonth()),
    texto:'Ainda dá tempo de transformar em colagem.',acao:'Criar colagem',fotos:chaves(l),criar:{nome:'Semana de '+dataExtenso(s7.getDate(),s7.getMonth()),col:{layout:'espalhadas'}},validoAte:dt.getTime()+7*DIA};
  l=fotos.filter(function(f){return f.a===a-1&&f.m===m});
  if(l.length>=6)return {id:'lem-mes-'+a+'-'+dois(m+1),tipo:'lembranca',dia:hoje,titulo:maiuscula(MESES[m])+' do ano passado: '+n1(l.length,'foto','fotos'),
    texto:'Reveja o mês e faça uma colagem com as suas fotos.',acao:'Criar colagem',fotos:chaves(l),criar:{nome:maiuscula(MESES[m])+' de '+(a-1),col:{peca:'r11',layout:'mural',margem:10}},validoAte:dt.getTime()+14*DIA};
  return null
}
function gerarLembranca(c,dados,dt,M){
  var hoje=diaLocal(dt.getTime()),id,ja=false;
  for(id in c.itens)if(c.itens[id].tipo==='lembranca'&&c.itens[id].dia===hoje)ja=true;   /* no máximo 1 por dia */
  if(ja)return;
  var it=lembrancaDe(dados.fotos,dt,M,false);
  if(it)novo(c,it)
}
/* sugestões a partir das fotos (ligam às sugestões de Projetos, SUG em pages/home.js): aniversário de projeto, fim de ano e
   retrospectiva do mês passado. Poucas: no máximo 1 nova por semana. */
function gerarSugestao(c,dados,dt,M){
  var t=dt.getTime(),a=dt.getFullYear(),m=dt.getMonth(),d=dt.getDate(),it=null,l,i,p;
  if(c.sugEm&&t-c.sugEm<7*DIA)return;
  for(i=0;i<dados.projetos.length&&!it;i++){
    p=dados.projetos[i];
    var cr=new Date(p.criadoEm),dias=Math.floor((new Date(a,m,d).getTime()-new Date(a,cr.getMonth(),cr.getDate()).getTime())/DIA),anos=a-cr.getFullYear();
    if(p.criadoEm&&anos>=1&&dias>=0&&dias<=2&&p.fotos>=3&&!c.itens['sug-aniv-'+p.id+'-'+a])
      it={id:'sug-aniv-'+p.id+'-'+a,tipo:'sugestao',titulo:'«'+corta(p.nome,30)+'» faz '+n1(anos,'ano','anos'),texto:'Que tal rever as '+p.fotos+' fotos e imprimir de novo ou montar uma colagem?',
        acao:'Abrir projeto',url:'?abrir='+encodeURIComponent(p.id),fotos:dados.fotos.filter(function(f){return f.pid===p.id}).map(function(f){return f.k}).slice(0,24),validoAte:t+14*DIA}
  }
  if(!it&&((m===11&&d>=10)||(m===0&&d<=10))){
    var ano=m===11?a:a-1;
    l=dados.fotos.filter(function(f){return f.a===ano});
    if(l.length>=12&&!c.itens['sug-ano-'+ano])
      it={id:'sug-ano-'+ano,tipo:'sugestao',titulo:'Seu '+ano+' em polaroids',texto:'Você tem '+l.length+' fotos deste ano. Que tal a retrospectiva do ano?',acao:'Criar colagem',
        fotos:chaves(l),criar:{nome:'Retrospectiva de '+ano,col:{peca:'r11',layout:'mural',margem:10}},validoAte:t+30*DIA}
  }
  if(!it){
    var pm=new Date(a,m-1,1),chave=pm.getFullYear()+'-'+dois(pm.getMonth()+1);
    l=dados.fotos.filter(function(f){return f.a===pm.getFullYear()&&f.m===pm.getMonth()});
    if(l.length>=12&&!c.itens['sug-mes-'+chave]){
      var vars={fotos:n1(l.length,'foto','fotos'),qtd:l.length,mes:MESES[pm.getMonth()],ano:pm.getFullYear()};
      it={id:'sug-mes-'+chave,tipo:'sugestao',titulo:formatar(M.sugestao.titulo,vars),texto:formatar(M.sugestao.texto,vars),acao:'Criar colagem',
        fotos:chaves(l),criar:{nome:'Retrospectiva de '+MESES[pm.getMonth()],col:{peca:'r45',layout:'mural',margem:10}},validoAte:t+30*DIA}
    }
  }
  if(it&&novo(c,it))c.sugEm=t
}
/* prazos: código de impressão com saldo a 7, 3 e 1 dia do vencimento; assinatura a 3 e 1 dia de renovar ou terminar */
function marco(dias,ms){var i;for(i=ms.length-1;i>=0;i--)if(dias<=ms[i])return ms[i];return 0}
function trocarMarco(c,base,m,it){ /* o aviso mais novo do mesmo prazo substitui o anterior (não acumula) */
  var id;
  if(c.itens[base+m])return;
  for(id in c.itens)if(id.indexOf(base)===0&&!(c.itens[id].estado||{}).dispensado){c.itens[id].estado=c.itens[id].estado||{};c.itens[id].estado.dispensado=agora();c.itens[id].estado.substituido=true}
  it.id=base+m;novo(c,it)
}
function gerarPrazos(c,M){
  var C=window.PLCONTA,t=agora();
  codigosComPrazo().forEach(function(k){
    var m=marco(k.dias,[1,3,7]);if(!m)return;
    var cl=k.classe==='grande'?['folha grande','folhas grandes']:['folha padrão','folhas padrão'],dv=new Date(k.validoAte);
    var vars={dias:n1(k.dias,'dia','dias'),codigo:k.final?'final '+k.final:'de impressão',data:dataExtenso(dv.getDate(),dv.getMonth()),folhas:n1(k.restam,cl[0],cl[1]),qtd:k.restam};
    trocarMarco(c,'cod-'+(k.final||'s'+k.n)+'-'+diaLocal(k.validoAte)+'-',m,{tipo:'codigo',assunto:'codigo',titulo:formatar(M.codigo.titulo,vars),texto:formatar(M.codigo.texto,vars),
      acao:'Ver código',url:'conta/#codigos',validoAte:k.validoAte})
  });
  var as=C&&C.assinatura?C.assinatura():null;
  if(as&&as.periodoFim){
    var fim=new Date(as.periodoFim).getTime(),dias=Math.ceil((fim-t)/DIA),m=marco(dias,[1,3]),df=new Date(fim),quando=dataExtenso(df.getDate(),df.getMonth());
    if(dias>=1&&m)trocarMarco(c,'pla-'+diaLocal(fim)+'-',m,as.canceladaEm?
      {tipo:'codigo',assunto:'plano',titulo:'Seu Pro termina em '+n1(dias,'dia','dias'),texto:'O Pro vale até '+quando+'. Depois, a conta volta ao plano Grátis.',acao:'Ver plano',url:'conta/#plano',validoAte:fim}:
      {tipo:'codigo',assunto:'plano',titulo:'Seu Pro renova em '+n1(dias,'dia','dias'),texto:'A renovação é em '+quando+'. Nesta versão de demonstração nada é cobrado.',acao:'Ver plano',url:'conta/#plano',validoAte:fim})
  }
}
/* campanhas lançadas pelo admin: entram na caixa de quem está no público; pausada, encerrada ou excluída some do painel */
function sincCampanhas(c,p){
  var A=adm(),t=agora(),pub=publicoDaConta(),vivas={},mudou=false,id;
  A.campanhas.forEach(function(k){
    if(!viva(k,t)||pub.indexOf(k.publico)<0||!p.ligado||p.tipos[k.tipo]===false)return;
    vivas[k.id]=1;
    var iid='cmp-'+k.id,it=c.itens[iid];
    if(!it){
      novo(c,{id:iid,tipo:k.tipo,origem:'campanha',campanhaId:k.id,titulo:k.titulo,texto:k.texto});
      it=c.itens[iid];k.cont=k.cont||{};k.cont.entregues=(k.cont.entregues||0)+1;mudou=true
    }
    it.titulo=k.titulo;it.texto=k.texto;it.url=k.url||'';it.acao=k.botao||'';it.canal=k.canal==='sistema'?'sistema':'app';it.validoAte=k.fim||null;it.fora=false
  });
  for(id in c.itens)if(c.itens[id].origem==='campanha'&&!vivas[c.itens[id].campanhaId])c.itens[id].fora=true;
  if(mudou)gravar(KA,A)
}
function contar(campanhaId,campo){
  var A=adm(),i;
  for(i=0;i<A.campanhas.length;i++)if(A.campanhas[i].id===campanhaId){var k=A.campanhas[i];k.cont=k.cont||{};k.cont[campo]=(k.cont[campo]||0)+1;gravar(KA,A);return}
}
function limpar(c){ /* o que venceu ou foi dispensado há mais de 30 dias sai; a caixa guarda no máximo 60 */
  var t=agora(),ids=Object.keys(c.itens),i,it,e;
  for(i=0;i<ids.length;i++){it=c.itens[ids[i]];e=it.estado||{};
    if((it.validoAte&&it.validoAte<t-30*DIA)||(e.dispensado&&e.dispensado<t-30*DIA)||(!it.validoAte&&it.criadoEm<t-90*DIA))delete c.itens[ids[i]]}
  ids=Object.keys(c.itens).sort(function(a,b){return c.itens[b].criadoEm-c.itens[a].criadoEm});
  for(i=60;i<ids.length;i++)delete c.itens[ids[i]]
}

/* ---------- leitura ---------- */
function visivel(it,p,t){
  var e=it.estado||{};
  if(e.dispensado||it.fora)return false;
  if(it.validoAte&&it.validoAte<t)return false;
  if(e.adiadoAte&&e.adiadoAte>t)return false;
  return p.ligado&&p.tipos[it.tipo]!==false
}
function quando(it){var e=it.estado||{};return e.adiadoAte||it.criadoEm}
function copia(it){var o=JSON.parse(JSON.stringify(it));o.estado=o.estado||{};o.temImagem=!!(it.fotos&&it.fotos.length);o.tipoNome=TIPOS[it.tipo]?TIPOS[it.tipo].um:'Aviso';return o}
function lista(){
  var c=minha(tudo()),out=[],p,t=agora(),id;
  if(!c)return out;
  p=prefsDe(c);
  for(id in c.itens)if(visivel(c.itens[id],p,t))out.push(copia(c.itens[id]));
  out.sort(function(a,b){return quando(b)-quando(a)});
  return out
}
function naoLidos(){return lista().filter(function(i){return !i.estado.lido}).length}
function historico(n){ /* os mais recentes, em qualquer estado, para a Conta */
  var c=minha(tudo()),out=[],t=agora(),p,id;
  if(!c)return out;
  p=prefsDe(c);
  for(id in c.itens){var it=copia(c.itens[id]),e=it.estado;
    if(e.substituido)continue;
    it.situacao=e.dispensado?'dispensado':it.fora||(it.validoAte&&it.validoAte<t)?'encerrado':e.adiadoAte&&e.adiadoAte>t?'adiado':e.lido?'lido':'novo';
    out.push(it)}
  out.sort(function(a,b){return b.criadoEm-a.criadoEm});
  return out.slice(0,n||10)
}
function item(id){var c=minha(tudo());return c&&c.itens[id]?copia(c.itens[id]):null}

/* ---------- ações da pessoa ---------- */
function marcarLidos(){
  var n=mudar(function(c){var p=prefsDe(c),t=agora(),id,k=0;for(id in c.itens)if(visivel(c.itens[id],p,t)&&!(c.itens[id].estado||{}).lido){c.itens[id].estado=c.itens[id].estado||{};c.itens[id].estado.lido=t;k++}return k});
  if(n)avisar();return n||0
}
/* futura POST /avisos/{id}/aberto → avisos.registrar_abertura */
function abrir(id){
  var cid=mudar(function(c){var it=c.itens[id];if(!it)return null;it.estado=it.estado||{};it.estado.lido=it.estado.lido||agora();if(it.estado.abertoEm)return null;it.estado.abertoEm=agora();return it.campanhaId||''});
  if(cid)contar(cid,'abertas');
  avisar();return cid!==undefined
}
/* futura POST /avisos/{id}/dispensado → avisos.registrar_dispensa */
function dispensar(id){
  var cid=mudar(function(c){var it=c.itens[id];if(!it||(it.estado||{}).dispensado)return null;it.estado=it.estado||{};it.estado.dispensado=agora();return it.campanhaId||''});
  if(cid)contar(cid,'dispensadas');
  avisar();return cid!==null&&cid!==undefined
}
function adiar(id){ /* «Lembrar amanhã»: volta amanhã de manhã, depois do horário silencioso, como novo */
  var r=mudar(function(c){var it=c.itens[id];if(!it)return false;var p=prefsDe(c),d=new Date(agora());
    it.estado=it.estado||{};it.estado.adiadoAte=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1,Math.max(8,p.silencio.fim<12?p.silencio.fim:8)).getTime();
    delete it.estado.lido;delete it.estado.sistemaEm;
    if(it.validoAte&&it.validoAte<it.estado.adiadoAte+DIA)it.validoAte=it.estado.adiadoAte+DIA;
    return true});
  avisar();return !!r
}

/* ---------- colagem do aviso (só lembrança e sugestão), gerada na hora ---------- */
function imagem(id,forma){ /* forma: 'mini' (quadrada, para a lista) ou 'larga' (2:1, para a notificação do aparelho) → Promise<canvas|null> */
  var it=item(id),A=window.PLAVISOSARTE;
  if(!it||!it.fotos||!it.fotos.length||!A)return Promise.resolve(null);
  var T=forma==='larga'?A.LARGA:A.MINI;
  return A.desenhar(it.fotos,T.w,T.h)
}
/* endereço blob: da miniatura, guardado enquanto a página vive (um por aviso); liberar() devolve a memória */
function miniatura(id,forma){   /* D-208: «larga» = a colagem 2:1 em destaque no cartão; «mini» = quadrada */
  forma=forma==='larga'?'larga':'mini';var k=id+'|'+forma;
  if(MEM[k])return Promise.resolve(MEM[k]);
  return imagem(id,forma).then(function(c){return window.PLAVISOSARTE?PLAVISOSARTE.paraBlob(c,'image/jpeg',0.86):null}).then(function(b){
    if(!b)return null;
    if(MEM[k])URL.revokeObjectURL(MEM[k]);
    MEM[k]=URL.createObjectURL(b);return MEM[k]})
}
function liberar(){var k;for(k in MEM){try{URL.revokeObjectURL(MEM[k])}catch(e){}}MEM={}}

/* «Criar colagem»: projeto novo, desta conta, com cópias das fotos do aviso já na Colagem. Tudo no IndexedDB do aparelho. */
function criarProjeto(id){
  var it=item(id),D=dono();
  if(!it||!it.fotos||!it.fotos.length||!it.criar||!window.PLFOTOS)return Promise.reject(new Error('Aviso sem fotos'));
  var P=window.PLCONTA&&PLCONTA.plano?PLCONTA.plano():null,max=P&&P.fotosPorProjeto?P.fotosPorProjeto:24,ks=it.fotos.slice(0,max);
  var pid='p'+agora().toString(36)+Math.random().toString(36).slice(2,7),n=0;
  return PLFOTOS.abrirDB().then(function(d){return new Promise(function(ok,no){
    var t=d.transaction(['projetos','fotosProjeto'],'readwrite'),s=t.objectStore('fotosProjeto'),lidos=[],falta=ks.length;
    function fim(){
      var ordem=[];
      lidos.filter(Boolean).forEach(function(v){n++;ordem.push(n);s.put(v,pid+':'+n)});
      if(!n){t.abort();return}
      var estado={'pl-fotos':JSON.stringify(ordem),'pl-colagem':JSON.stringify(Object.assign({ativo:true,fundo:{tipo:'foto'}},it.criar.col||{}))};
      var p={id:pid,nome:it.criar.nome||'Lembranças',criadoEm:agora(),atualizadoEm:agora(),exemplo:false,v:2,estado:estado};
      if(D)p.dono=D;
      t.objectStore('projetos').put(p)
    }
    ks.forEach(function(k,i){var g=s.get(k);g.onsuccess=function(){lidos[i]=g.result||null;if(!--falta)fim()};g.onerror=function(){if(!--falta)fim()}});
    t.oncomplete=function(){d.close();abrir(id);ok({id:pid,fotos:n})};
    t.onerror=t.onabort=function(){d.close();no(new Error('As fotos deste aviso não estão mais no aparelho'))}
  })})
}

/* ---------- notificação do aparelho (opcional) ---------- */
function suporte(){
  var N=window.Notification;
  return {suportado:!!N,permissao:N?N.permission:'unsupported',servico:!!(navigator.serviceWorker)}
}
function pedirPermissao(){ /* só por um toque da pessoa, na Conta › Notificações; nunca ao abrir o app */
  var N=window.Notification;
  if(!N||!N.requestPermission)return Promise.resolve('unsupported');
  return new Promise(function(ok){
    var feito=false,fim=function(v){if(feito)return;feito=true;ok(v||N.permission)},r;
    try{r=N.requestPermission(fim)}catch(e){fim('denied');return}
    if(r&&r.then)r.then(fim,function(){fim(N.permission)})
  }).then(function(v){avisar();espelhar();return v})
}
function podeSistema(dt){
  var c=minha(tudo()),p=prefsDe(c),s=suporte();
  if(!c||!p.ligado)return {ok:false,motivo:'desligado'};
  if(p.canal!=='sistema')return {ok:false,motivo:'canal'};
  if(s.permissao!=='granted')return {ok:false,motivo:'permissao'};
  if(silencioso(dt||new Date(agora()),p))return {ok:false,motivo:'silencio'};
  if(c.sisDia===diaLocal((dt||new Date(agora())).getTime()))return {ok:false,motivo:'limite'};   /* no máximo 1 por dia */
  return {ok:true}
}
function urlDe(it){
  var u=new URL(it.criar?'?criar='+encodeURIComponent(it.id):(it.url||''),raizApp());
  if(!it.criar)u.searchParams.set('aviso',it.id);
  return u.href
}
function registro(){
  if(!navigator.serviceWorker||!navigator.serviceWorker.getRegistration)return Promise.resolve(null);
  return navigator.serviceWorker.getRegistration(raizApp()).then(function(r){return r&&r.active?r:null},function(){return null})
}
function mostrarSistema(it){ /* → Promise<boolean>. Sem som (silent), uma etiqueta por tipo (a nova troca a anterior do mesmo tipo) */
  var N=window.Notification,A=window.PLAVISOSARTE;
  if(!N||N.permission!=='granted')return Promise.resolve(false);
  var ic=new URL('../assets/img/icones/icone-192.png',raizApp()).href;
  var op={body:it.texto||'',tag:'pl-'+it.tipo,silent:true,icon:ic,badge:ic,lang:'pt-BR',data:{url:urlDe(it),id:it.id}};
  var arte=it.fotos&&it.fotos.length&&A?A.desenhar(it.fotos,A.LARGA.w,A.LARGA.h).then(function(c){return A.paraDataUrl(c)}):Promise.resolve(null);
  return arte.then(function(img){
    if(img)op.image=img;                                     /* a colagem vai direto do aparelho para a notificação do aparelho (T5) */
    return registro().then(function(r){
      if(r&&r.showNotification)return r.showNotification(it.titulo,op).then(function(){return true});
      var n=new N(it.titulo,op);
      n.onclick=function(){try{window.focus()}catch(e){}location.href=op.data.url;n.close()};
      return true
    })
  }).catch(function(){return false})
}
/* ao abrir o app: no máximo uma notificação do aparelho por dia, com o aviso novo que mais importa */
function enviarSistema(){
  var pode=podeSistema();
  if(!pode.ok)return Promise.resolve({enviado:false,motivo:pode.motivo});
  var l=lista().filter(function(i){return !i.estado.lido&&!i.estado.sistemaEm&&(i.origem!=='campanha'||i.canal==='sistema')});
  l.sort(function(a,b){return ORDEM_SIS.indexOf(a.tipo)-ORDEM_SIS.indexOf(b.tipo)||b.criadoEm-a.criadoEm});
  if(!l.length)return Promise.resolve({enviado:false,motivo:'nada'});
  var it=l[0];
  return mostrarSistema(it).then(function(ok){
    if(ok)mudar(function(c){if(c.itens[it.id]){c.itens[it.id].estado=c.itens[it.id].estado||{};c.itens[it.id].estado.sistemaEm=agora()}c.sisDia=diaLocal(agora())});
    return {enviado:ok,id:it.id,motivo:ok?'':'falhou'}
  })
}
/* «Enviar um aviso de teste»: entra no painel e, com a permissão dada e o canal do aparelho ligado, aparece também lá
   (o teste é pedido pela pessoa: não conta no limite do dia nem espera o horário silencioso) */
function testar(){
  if(!dono())return Promise.resolve({painel:false,sistema:false});
  var it=mudar(function(c){var x={id:'teste-'+agora(),tipo:'sistema',titulo:'Aviso de teste',texto:'É assim que os avisos do PolarLife aparecem: discretos e sem som.',url:'conta/#notificacoes',acao:'Ajustar notificações',validoAte:agora()+DIA};
    novo(c,x);return JSON.parse(JSON.stringify(x))});
  avisar();
  var p=prefs(),s=suporte();
  if(!p.ligado||p.tipos.sistema===false)return Promise.resolve({painel:false,sistema:false,motivo:'desligado'});
  if(p.canal!=='sistema'||s.permissao!=='granted')return Promise.resolve({painel:true,sistema:false});
  return mostrarSistema(it).then(function(ok){return {painel:true,sistema:ok}})
}

/* ---------- agenda para o service worker (periodicsync e push) ----------
   O service worker não lê localStorage. Com a notificação do aparelho ligada, a página deixa num IndexedDB pequeno
   («polar-life-avisos») as preferências e os avisos dos próximos dias (título, texto, endereço e as chaves locais das fotos);
   o service worker monta a colagem na hora, a partir do IndexedDB das fotos. Nada disso sai do aparelho. */
function bancoAgenda(){return new Promise(function(ok,no){var r=indexedDB.open(BANCO,1);r.onupgradeneeded=function(){r.result.createObjectStore('kv')};r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}})}
function agendaLer(){return bancoAgenda().then(function(d){return new Promise(function(ok){var t=d.transaction('kv','readonly'),g=t.objectStore('kv').get('agenda');t.oncomplete=function(){d.close();ok(g.result||null)};t.onerror=function(){d.close();ok(null)}})}).catch(function(){return null})}
function agendaGravar(v){return bancoAgenda().then(function(d){return new Promise(function(ok){var t=d.transaction('kv','readwrite');if(v)t.objectStore('kv').put(v,'agenda');else t.objectStore('kv').delete('agenda');t.oncomplete=t.onerror=function(){d.close();ok()}})}).catch(function(){})}
function sincPeriodica(liga){
  return registro().then(function(r){
    if(!r||!r.periodicSync)return false;
    if(!liga)return r.periodicSync.unregister('pl-avisos').then(function(){return false},function(){return false});
    if(!navigator.permissions||!navigator.permissions.query)return false;
    return navigator.permissions.query({name:'periodic-background-sync'}).then(function(s){
      if(s.state!=='granted')return false;                   /* o navegador só concede com o app instalado */
      return r.periodicSync.register('pl-avisos',{minInterval:12*3600*1000}).then(function(){return true})
    })
  }).catch(function(){return false})
}
function espelhar(){
  if(!window.indexedDB)return Promise.resolve();
  var D=dono(),c=D?minha(tudo()):null,p=prefsDe(c),liga=!!c&&p.ligado&&p.canal==='sistema'&&suporte().permissao==='granted';
  if(!liga){sincPeriodica(false);return ler(K,null)?agendaGravar(null):Promise.resolve()}
  return agendaLer().then(function(antes){
    if(antes&&antes.dono===D&&antes.mostrados){            /* o que o service worker mostrou com o app fechado volta para a caixa */
      mudar(function(cc){var id;for(id in antes.mostrados){if(cc.itens[id]){cc.itens[id].estado=cc.itens[id].estado||{};cc.itens[id].estado.sistemaEm=antes.mostrados[id]}else if(antes.itens){antes.itens.forEach(function(x){if(x.id===id&&x.tipo==='lembranca'){var n=JSON.parse(JSON.stringify(x));delete n.urlAbs;novo(cc,n);cc.itens[id].estado.sistemaEm=antes.mostrados[id]}})}}
        if(antes.sisDia&&(!cc.sisDia||antes.sisDia>cc.sisDia))cc.sisDia=antes.sisDia});
      c=minha(tudo())
    }
    var hoje=diaLocal(agora()),itens=lista().filter(function(i){return !i.estado.lido&&!i.estado.sistemaEm&&(i.origem!=='campanha'||i.canal==='sistema')}).map(function(i){i.dia=hoje;return i});
    (c.agenda||[]).forEach(function(a){if(a.dia>hoje)itens.push(a)});
    itens=itens.map(function(i){return {id:i.id,tipo:i.tipo,titulo:i.titulo,texto:i.texto,dia:i.dia,urlAbs:urlDe(i),fotos:(i.fotos||[]).slice(0,24),criar:i.criar||null,acao:i.acao||'',validoAte:i.validoAte||null}});
    return agendaGravar({v:1,dono:D,prefs:p,sisDia:c.sisDia||'',raiz:raizApp(),icone:new URL('../assets/img/icones/icone-192.png',raizApp()).href,itens:itens,mostrados:{},gravadoEm:agora()})
  }).then(function(){return sincPeriodica(true)})
}

/* ---------- ciclo: gerar o que for de hoje ---------- */
function atualizar(op){
  if(!dono()||!window.PLCONTA)return Promise.resolve([]);
  if(rodando)return rodando;
  var A=adm(),M=modelosDe(A),hoje=diaLocal(agora()),precisa;
  mudar(function(c){
    var p=prefsDe(c);
    sincCampanhas(c,p);
    if(p.ligado&&p.tipos.codigo&&!A.pausados.codigo)gerarPrazos(c,M);
    limpar(c);
    precisa=(op&&op.forcar)||c.dia!==hoje
  });
  var fim=function(){rodando=null;avisar();return espelhar().then(lista,lista)};
  if(!precisa)return fim();
  rodando=fotosDaConta().then(function(dados){
    mudar(function(c){
      var p=prefsDe(c),dt=new Date(agora()),i,ag=[];
      if(p.ligado&&p.tipos.lembranca&&!A.pausados.lembranca){
        gerarLembranca(c,dados,dt,M);
        for(i=1;i<=14;i++){var d2=new Date(dt.getFullYear(),dt.getMonth(),dt.getDate()+i,9),x=lembrancaDe(dados.fotos,d2,M,true);if(x){x.fotos=x.fotos.slice(0,24);ag.push(x)}}
      }
      if(p.ligado&&p.tipos.sugestao&&!A.pausados.sugestao)gerarSugestao(c,dados,dt,M);
      c.agenda=ag;c.dia=hoje
    })
  }).then(fim,fim);
  return rodando
}

/* ---------- admin: campanhas (criar, editar, agendar, lançar, pausar, encerrar, duplicar, excluir) ---------- */
function eAdmin(){var P=window.PLCONTA&&PLCONTA.plano?PLCONTA.plano():null;return !!P&&P.id==='admin'}
function destinoOk(u){var i;for(i=0;i<DESTINOS.length;i++)if(DESTINOS[i].url===u)return true;return false}
function validar(d){
  var e={},t=String(d&&d.titulo||'').replace(/\s+/g,' ').trim(),x=String(d&&d.texto||'').replace(/\s+/g,' ').trim(),b=String(d&&d.botao||'').replace(/\s+/g,' ').trim();
  if(['promocao','anuncio','sistema'].indexOf(d&&d.tipo)<0)e.tipo='Escolha o tipo.';
  if(t.length<3||t.length>60)e.titulo='O título precisa ter de 3 a 60 caracteres.';
  if(x.length<3||x.length>160)e.texto='O texto precisa ter de 3 a 160 caracteres.';
  if(b.length>24)e.botao='O botão leva até 24 caracteres.';
  if(b&&!destinoOk(d.url||''))e.url='Escolha para onde o botão leva.';
  if(!PUBLICOS[d&&d.publico])e.publico='Escolha o público.';
  if(d&&d.canal!=='app'&&d.canal!=='sistema')e.canal='Escolha onde aparece.';
  if(d&&d.inicio&&d.fim&&d.fim<=d.inicio)e.fim='O fim precisa ser depois do início.';
  return e
}
function limpa(d,base){
  var c=base||{};
  c.tipo=d.tipo;c.titulo=String(d.titulo).replace(/\s+/g,' ').trim();c.texto=String(d.texto).replace(/\s+/g,' ').trim();
  c.botao=String(d.botao||'').replace(/\s+/g,' ').trim();c.url=c.botao?(d.url||''):'';
  c.publico=d.publico;c.canal=d.canal;c.inicio=d.inicio||null;c.fim=d.fim||null;c.atualizadaEm=agora();
  return c
}
function achar(A,id){var i;for(i=0;i<A.campanhas.length;i++)if(A.campanhas[i].id===id)return A.campanhas[i];return null}
function salvarCampanha(d){ /* cria (rascunho) ou edita; devolve {ok,campanha} ou {erros} */
  if(!eAdmin())return {erro:'permissao'};
  var e=validar(d),k;for(k in e)return {erros:e};
  var A=adm(),c=d.id?achar(A,d.id):null;
  if(d.id&&!c)return {erro:'nao-encontrada'};
  if(c)limpa(d,c);
  else{c=limpa(d,{id:'c'+agora().toString(36)+Math.random().toString(36).slice(2,6),estado:'rascunho',criadaEm:agora(),lancadaEm:null,cont:{entregues:0,abertas:0,dispensadas:0}});A.campanhas.unshift(c)}
  gravar(KA,A);avisar();
  return {ok:true,campanha:JSON.parse(JSON.stringify(c))}
}
function mudarCampanha(id,fn){
  if(!eAdmin())return {erro:'permissao'};
  var A=adm(),c=achar(A,id);if(!c)return {erro:'nao-encontrada'};
  var r=fn(c,A);if(r&&r.erro)return r;
  c.atualizadaEm=agora();gravar(KA,A);avisar();return {ok:true,campanha:JSON.parse(JSON.stringify(c))}
}
function lancar(id){return mudarCampanha(id,function(c){var t=agora();if(c.fim&&c.fim<=t)return {erro:'fim'};c.estado='ativa';if(!c.inicio||c.inicio>t)c.inicio=t;c.lancadaEm=c.lancadaEm||t})}
function agendar(id){return mudarCampanha(id,function(c){var t=agora();if(!c.inicio||c.inicio<=t)return {erro:'inicio'};if(c.fim&&c.fim<=c.inicio)return {erro:'fim'};c.estado='agendada'})}
function pausar(id){return mudarCampanha(id,function(c){if(c.estado!=='ativa'&&c.estado!=='agendada')return {erro:'estado'};c.estado='pausada'})}
function retomar(id){return mudarCampanha(id,function(c){if(c.estado!=='pausada')return {erro:'estado'};c.estado=c.inicio&&c.inicio>agora()?'agendada':'ativa'})}
function encerrar(id){return mudarCampanha(id,function(c){c.estado='encerrada';c.encerradaEm=agora()})}
function duplicar(id){
  if(!eAdmin())return {erro:'permissao'};
  var A=adm(),c=achar(A,id);if(!c)return {erro:'nao-encontrada'};
  var n=JSON.parse(JSON.stringify(c));
  n.id='c'+agora().toString(36)+Math.random().toString(36).slice(2,6);n.titulo=corta(c.titulo+' (cópia)',60);n.estado='rascunho';n.criadaEm=n.atualizadaEm=agora();n.lancadaEm=null;delete n.encerradaEm;n.cont={entregues:0,abertas:0,dispensadas:0};
  A.campanhas.unshift(n);gravar(KA,A);avisar();return {ok:true,campanha:n}
}
function excluir(id){
  if(!eAdmin())return {erro:'permissao'};
  var A=adm(),n=A.campanhas.length;
  A.campanhas=A.campanhas.filter(function(c){return c.id!==id});
  if(A.campanhas.length===n)return {erro:'nao-encontrada'};
  gravar(KA,A);avisar();return {ok:true}
}
function campanhas(){var t=agora();return adm().campanhas.map(function(c){var o=JSON.parse(JSON.stringify(c));o.cont=o.cont||{entregues:0,abertas:0,dispensadas:0};o.situacao=situacao(c,t);return o})}
function salvarModelos(m){ /* textos dos avisos automáticos; variável desconhecida é recusada */
  if(!eAdmin())return {erro:'permissao'};
  var A=adm(),e={},k,out={};
  for(k in MODELOS_PADRAO){
    var t=String(m&&m[k]&&m[k].titulo||'').replace(/\s+/g,' ').trim(),x=String(m&&m[k]&&m[k].texto||'').replace(/\s+/g,' ').trim(),ruins=[];
    (t+' '+x).replace(/\{([^}]*)\}/g,function(s,v){if(VARS[k].indexOf(v)<0)ruins.push(s)});
    if(t.length<3||t.length>60)e[k]='O título precisa ter de 3 a 60 caracteres.';
    else if(x.length<3||x.length>160)e[k]='O texto precisa ter de 3 a 160 caracteres.';
    else if(ruins.length)e[k]='Variável desconhecida: '+ruins.join(', ')+'.';
    out[k]={titulo:t,texto:x}
  }
  for(k in e)return {erros:e};
  A.modelos=out;gravar(KA,A);return {ok:true}
}
function restaurarModelos(){if(!eAdmin())return {erro:'permissao'};var A=adm();A.modelos={};gravar(KA,A);return {ok:true}}
function pausarTipo(tipo,pausado){if(!eAdmin())return {erro:'permissao'};if(!MODELOS_PADRAO[tipo])return {erro:'tipo'};var A=adm();A.pausados[tipo]=!!pausado;gravar(KA,A);return {ok:true}}
/* o feed publicado, no formato que o servidor futuro vai usar (DOC-16 §7): só campanhas que não são rascunho */
function feed(){
  var A=adm(),t=agora(),iso=function(x){return x?new Date(x).toISOString():null},k,auto={};
  for(k in MODELOS_PADRAO)auto[k]={pausado:!!A.pausados[k],titulo:modelosDe(A)[k].titulo,texto:modelosDe(A)[k].texto,variaveis:VARS[k]};
  return {produto:'PolarLife',formato:'avisos-feed',versao:1,geradoEm:iso(t),demonstracao:true,
    campanhas:A.campanhas.filter(function(c){return c.estado!=='rascunho'}).map(function(c){
      return {id:c.id,tipo:c.tipo,titulo:c.titulo,texto:c.texto,botao:c.botao||null,url:c.botao?c.url:null,publico:c.publico,canal:c.canal,inicio:iso(c.inicio),fim:iso(c.fim),situacao:situacao(c,t)}}),
    automaticos:auto}
}
function exemplo(tipo){ /* prévia dos textos automáticos no painel do admin */
  var v={lembranca:{anos:'1 ano',fotos:'6 fotos',qtd:6,data:'13 de novembro',ano:2025},sugestao:{fotos:'24 fotos',qtd:24,mes:'outubro',ano:2026},codigo:{dias:'3 dias',codigo:'final K7QX',data:'16 de novembro',folhas:'8 folhas padrão',qtd:8}};
  return v[tipo]||{}
}

window.PLAVISOS={
  TIPOS:TIPOS,PUBLICOS:PUBLICOS,DESTINOS:DESTINOS,VARS:VARS,
  prefs:prefs,salvarPrefs:salvarPrefs,silencioso:silencioso,
  atualizar:atualizar,lista:lista,naoLidos:naoLidos,historico:historico,item:item,
  marcarLidos:marcarLidos,abrir:abrir,dispensar:dispensar,adiar:adiar,
  imagem:imagem,miniatura:miniatura,liberar:liberar,criarProjeto:criarProjeto,urlDe:urlDe,
  suporte:suporte,pedirPermissao:pedirPermissao,podeSistema:podeSistema,enviarSistema:enviarSistema,testar:testar,
  formatar:formatar,aoMudar:function(f){ouvintes.push(f)},
  admin:{campanhas:campanhas,validar:validar,salvar:salvarCampanha,lancar:lancar,agendar:agendar,pausar:pausar,retomar:retomar,encerrar:encerrar,duplicar:duplicar,excluir:excluir,
    modelos:function(){return modelosDe(adm())},modelosPadrao:function(){return JSON.parse(JSON.stringify(MODELOS_PADRAO))},salvarModelos:salvarModelos,restaurarModelos:restaurarModelos,
    pausados:function(){var A=adm(),o={},k;for(k in MODELOS_PADRAO)o[k]=!!A.pausados[k];return o},pausarTipo:pausarTipo,feed:feed,exemplo:exemplo}
};
})();
