/* PLCONTA · conta simulada em modo demonstração (D-116, D-123, D-124).
   Contrato do brief rodada 2 §0.4 + códigos de impressão do adendo.
   Tudo local: localStorage, sem rede (T5). BR-10: consumo só após a geração concluir. */
(function(){
'use strict';
var SAL='polarlife-codigo-v1',ALFABETO='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/* 20 códigos semeados do pacote «Avulso básico» (D-124): só hashes, nunca o código legível. */
var SEMEADOS=['765ebf1f25fd6ee08532c6351653bdce2aabd3076b407d079dca25869adf4550','b664dcd115bfe719980d7a8475652204cf31e96a475fd4646101d48727b3861d','d7b2631c113dc0ac3431072061db7dbd06f258b7c73b62f9df311e935e1f4953','ecb1508281b02d73c19fc2de3fed0ac6f46f253985d4be5709e91be4eb76797d','bbe42e72b245f3e1c6202f9c1970b2d9af248ac497d0d9183367cb06d128bb35','a311092850f97a333cfc18cfc9aa3780774024e48b88ffc07cbbc5dc952fe4a5','f2e02cde76df5b155110eb3a1497825d8c0eb93041af1135308694aba6d8541f','0bbd955a75087b8a2b4403ea77c64c5f1e53b8ba54499a3a21cf2abb426961b7','eef21cd4bc04d14090c68567c4d15bc1d93d221ea667a2036f68d5f5669ecb3a','d0c410a33fbedd767bf39b25e51ecc74a088a76af61fbffe02228ecd1d8eb1eb','00a1ee9a76567b9e8523ff39ccad0f8a2966d729b6b0039badfbc38cefd0dc16','275c1931ce58b602aa9cea96b6ca3e0d61f9c0c50078ff34f6ba46a875c1563e','510f838038d653d4a68432be810652c66c4770d91fe7a234d35dd8b302af8a65','76e356375152b8f435cbfeff0388ff4ba74a57851423546abf518b5daafcc7d8','fe462f0e5bb87f7a783c87ee67e528f479892c08c0659652b3106ebf27974328','059a4842fa6a08ad902473f2038b423ab8467abff19703ee6104f236dc597a66','c56b8141efbc7269e3c7d402a5e6f4f67aa29014c8afa3e8f9d247b6fd2b2681','9026340a4a6068998f3856ea794f4a9997d49e683fbf6fe1b697cebc6d0ecb7d','7909f0a5f57918d61afab19812eed6b2af9d0e397379a7479ffaeb2f71215ba9','fea26dc0a4731d04983bcfc916e7929693a2e10c977debf453205ecdbb7e0bda'];
var SEMEADO_EM=1773553200000;                                   /* 2026-11-09 (data do adendo), fixo p/ ordenar a tabela */
/* Pacotes de código de impressão (D-124: «Avulso básico» = fotos e folhas do plano Folha avulsa) [HIPÓTESE]. */
var PACOTES={'avulso-basico':{nome:'Avulso básico',fotos:24,folhas:8},'avulso-grande':{nome:'Avulso grande',fotos:24,folhas:20}};
/* Planos padrão do DOC-03 §2 (editáveis pelo admin em pl-planos, D-116). */
var PLANOS_PADRAO={v:1,planos:{
  gratis:{fotos:24,folhasMes:1,assinatura:false},
  avulsa:{fotos:24,pacotes:[1,5,10],precoPadrao:2.9,precoGrande:5.5,assinatura:false},
  pro:{fotos:200,precoMes:14.9,usoRazoavel:100,avisoPct:80,assinatura:true}
}};
/* Contas de teste (D-116): domínio .test nunca resolve (T5). */
var CONTAS_PADRAO={
  'admin@polarlife.test':{nome:'Admin',perfil:'admin',folhasPadrao:0,folhasGrande:0,usadasMes:0,recibos:[]},
  'gratis@polarlife.test':{nome:'Grátis',perfil:'gratis',folhasPadrao:0,folhasGrande:0,usadasMes:0,recibos:[]},
  'folha@polarlife.test':{nome:'Folha avulsa',perfil:'avulsa',folhasPadrao:3,folhasGrande:0,usadasMes:0,recibos:[]},
  'pro@polarlife.test':{nome:'Pro',perfil:'pro',folhasPadrao:0,folhasGrande:0,usadasMes:12,recibos:[]}
};
var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
var DIA=86400000,PLCONTA;

function ler(k,p){try{var v=localStorage.getItem(k);return v?JSON.parse(v):p}catch(e){return p}}
function gravar(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function apagar(k){try{localStorage.removeItem(k)}catch(e){}}
function agora(){return Date.now()}
function agoraBR(){try{return new Date(new Date().toLocaleString('en-US',{timeZone:'America/Sao_Paulo'}))}catch(e){return new Date()}}
function chaveMes(){var d=agoraBR();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)}
function temLocalStorage(){try{localStorage.setItem('pl-teste','1');localStorage.removeItem('pl-teste');return true}catch(e){return false}}
function moeda(v){return 'R$ '+(Math.round(v*100)/100).toFixed(2).replace('.',',')}
function fmtData(ts){var d=new Date(ts);return d.getDate()+' de '+MESES[d.getMonth()]+' de '+d.getFullYear()}
function fmtDataCurta(ts){var d=new Date(ts);return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear()}
function proximoDia1(){var d=agoraBR(),m=d.getMonth()+1,a=d.getFullYear();if(m>11){m=0;a++}return {t:d.getTime(),txt:'1º de '+MESES[m]}}

/* ---------- hash do código (D-124): SHA-256 de sal + '|' + código sem traços em maiúsculas ---------- */
function sha256hex(txt){
  if(!(window.crypto&&window.crypto.subtle&&window.TextEncoder))return Promise.reject({tipo:'indisponivel'});
  return window.crypto.subtle.digest('SHA-256',new TextEncoder().encode(txt)).then(function(buf){
    var b=new Uint8Array(buf),h='',i,c;
    for(i=0;i<b.length;i++){c=b[i].toString(16);h+=c.length<2?'0'+c:c}
    return h})
}
function hashCodigo(cod){return sha256hex(SAL+'|'+cod)}
function normalizaCodigo(entrada){return String(entrada||'').toUpperCase().replace(/[^A-Z2-9]/g,'')}
function eCodigoPl(cod){return /^PL[A-HJ-NP-Z2-9]{8}$/.test(cod)}
/* Dígito verificador (regra do adendo): leituras 0-based e 1-based são ambas aceitas na conferência;
   o gerador usa a leitura 0-based (pesos 3–9). */
function dvsCodigo(corpo7){
  var s1=0,sp=0,j,v;
  for(j=0;j<7;j++){v=ALFABETO.indexOf(corpo7.charAt(j))+1;s1+=v;sp+=v*j}
  return [ALFABETO.charAt((sp+3*s1)%31),ALFABETO.charAt((sp+4*s1)%31)]
}
function dvOk(cod){
  if(!eCodigoPl(cod))return false;
  var dvs=dvsCodigo(cod.slice(2,9)),dv=cod.charAt(9);
  return dv===dvs[0]||dv===dvs[1]
}

/* ---------- banco de códigos (semeados + gerados pelo admin, D-124) ---------- */
function dbCodigos(){return ler('pl-codigos',{})}
function registroSemeado(hash){
  return {pacote:'avulso-basico',criadoEm:SEMEADO_EM,validaDias:365,usadoEm:null,revogado:false,semeado:true}
}
function buscarCodigo(hash){ /* confere o banco do navegador e os 20 semeados */
  var db=dbCodigos(),r=db[hash];
  if(r)return r;
  if(SEMEADOS.indexOf(hash)>=0)return registroSemeado(hash);
  return null
}
function materializar(hash,r){ /* código semeado usado/revogado passa a ser guardado (só hashes, D-124) */
  var db=dbCodigos();db[hash]=r;gravar('pl-codigos',db)
}
function situacaoCodigo(r){
  if(r.revogado)return 'revogado';
  if(r.usadoEm)return 'usado';
  if(agora()>r.criadoEm+r.validaDias*DIA)return 'vencido';
  return 'livre'
}

/* ---------- sessão ---------- */
function sessao(){return ler('pl-conta',null)}
function sessaoCodigo(){return ler('pl-codigo-sessao',null)}
function temSessao(){return !!(sessao()||sessaoCodigo())}
function contaDe(email){ /* estado da conta (padrões do DOC-03 §2 + o que o admin editou) */
  var todas=ler('pl-contas-teste',null)||{};var c=todas[email];
  if(!c){c=CONTAS_PADRAO[email]?JSON.parse(JSON.stringify(CONTAS_PADRAO[email])):{nome:email.split('@')[0],perfil:'gratis',folhasPadrao:0,folhasGrande:0,usadasMes:0,recibos:[]}}
  if(c.mes!==chaveMes())c.usadasMes=0;                         /* DOC-03 §3: mês-calendário no fuso de Brasília */
  return c}
function salvarConta(email,c){var todas=ler('pl-contas-teste',null)||{};c.mes=chaveMes();todas[email]=c;gravar('pl-contas-teste',todas)}
function perfilEfetivo(c){                                     /* Pro cancelado vira Grátis no fim do período (DOC-03 §5) */
  if(c.perfil==='pro'&&c.proAte&&agora()>c.proAte)return 'gratis';
  return c.perfil}
function contaAtual(){var s=sessao();return s?contaDe(s.email):null}

/* ---------- limites (pl-planos, editáveis pelo admin, D-116) ---------- */
function limites(){
  var p=PLANOS_PADRAO,e=ler('pl-planos',null),out={v:1,planos:{}},k;
  for(k in p.planos){out.planos[k]=e&&e.planos&&e.planos[k]?e.planos[k]:JSON.parse(JSON.stringify(p.planos[k]))}
  return out}
function nomePlano(id){return {gratis:'Grátis',avulsa:'Folha avulsa',pro:'Pro',admin:'Pro'}[id]||id}

/* ---------- plano da sessão atual ---------- */
function plano(){
  var sc=sessaoCodigo();
  if(sc){ /* sessão de compra avulsa (D-123): limitada ao pacote do código */
    var pc=PACOTES[sc.pacote]||{fotos:24,folhas:8};
    return {id:'codigo',codigo:true,nome:'Compra avulsa',pacote:pc.nome,fotosPorProjeto:sc.fotos,folhas:sc.folhas,usado:!!sc.usadoEm,assinaturaPodeDesligar:false}
  }
  var s=sessao();if(!s)return null;
  var c=contaDe(s.email),pf=perfilEfetivo(c),L=limites().planos[pf==='admin'?'pro':pf]||{};
  var o={id:pf,nome:nomePlano(pf),email:s.email,entrouEm:s.entrouEm,
    fotosPorProjeto:L.fotos||24,folhasCompradas:{padrao:c.folhasPadrao||0,grande:c.folhasGrande||0},
    usadasMes:c.usadasMes||0,assinaturaPodeDesligar:!!L.assinatura,assinaturaDesligada:!!c.assinaturaDesligada,recibos:c.recibos||[]};
  if(pf==='gratis'){o.folhasMes=L.folhasMes!==undefined?L.folhasMes:1;o.preco=0;var r=proximoDia1();o.renovaEm=r.txt;o.renovaTs=r.t}
  else if(pf==='avulsa'){o.precoPadrao=L.precoPadrao!==undefined?L.precoPadrao:2.9;o.precoGrande=L.precoGrande!==undefined?L.precoGrande:5.5;o.pacotes=L.pacotes||[1,5,10]}
  else{o.preco=L.precoMes!==undefined?L.precoMes:14.9;o.usoRazoavel=L.usoRazoavel||100;o.avisoPct=L.avisoPct||80;o.assuntoMes='uso razoável';if(c.proDesde){o.renovaTs=c.proDesde+30*DIA;o.renovaEm=fmtData(o.renovaTs)}if(c.canceladoEm)o.canceladoEm=c.canceladoEm}
  return o}

/* ---------- direito de uso e consumo (DOC-03 §4 · BR-10) ---------- */
function direito(nFolhas,classe){
  if(!temSessao())return {ok:false,motivo:'semConta'};
  var sc=sessaoCodigo();
  if(sc){ /* código de impressão: uso único do pacote (D-124) */
    if(sc.usadoEm)return {ok:false,motivo:'semFolhas',codigoUsado:true};
    return nFolhas<=sc.folhas?{ok:true,usaGratis:false,codigo:true}:{ok:false,motivo:'semFolhas',faltam:nFolhas-sc.folhas,codigo:true}
  }
  var s=sessao(),c=contaDe(s.email),pf=perfilEfetivo(c),L=limites().planos[pf==='admin'?'pro':pf]||{};
  if(pf==='pro'||pf==='admin')return {ok:true,usaGratis:false}; /* sem bloqueio automático (DOC-03 §4) */
  var fr=pf==='gratis'?Math.max(0,(L.folhasMes!==undefined?L.folhasMes:1)-(c.usadasMes||0)):0;
  var pr=classe==='grande'?(c.folhasGrande||0):(c.folhasPadrao||0);
  if(nFolhas<=fr+pr)return {ok:true,usaGratis:fr>0};
  return {ok:false,motivo:'semFolhas',faltam:nFolhas-fr-pr}}
function consumir(nFolhas,classe,chaveProj){
  var g=ler('pl-gerado24h',null);                              /* DOC-03 §3: mesma folha em 24 h conta uma vez */
  if(g&&g.k===chaveProj&&agora()-g.t<DIA)return {ok:true,jaContado:true};
  var sc=sessaoCodigo();
  if(sc){ /* impressão concluída com sucesso marca o código como usado (D-124) */
    sc.usadoEm=agora();gravar('pl-codigo-sessao',sc);
    var r=buscarCodigo(sc.hash);
    if(r){r.usadoEm=sc.usadoEm;if(r.semeado)materializar(sc.hash,r);else{var db=dbCodigos();db[sc.hash]=r;gravar('pl-codigos',db)}}
    if(chaveProj)gravar('pl-gerado24h',{k:chaveProj,t:agora()});
    return {ok:true}
  }
  var s=sessao();if(!s)return {ok:false};
  var c=contaDe(s.email),pf=perfilEfetivo(c),L=limites().planos[pf==='admin'?'pro':pf]||{};
  if(pf==='pro'||pf==='admin'){
    c.usadasMes=(c.usadasMes||0)+nFolhas;                     /* Pro: uso razoável é contado, não travado (DOC-03 §4) */
  }else{
    var fr=pf==='gratis'?Math.max(0,(L.folhasMes!==undefined?L.folhasMes:1)-(c.usadasMes||0)):0;
    var usa=Math.min(fr,nFolhas),resto=nFolhas-usa;            /* grátis do mês primeiro, depois as compradas */
    c.usadasMes=(c.usadasMes||0)+usa;
    if(resto>0){if(classe==='grande')c.folhasGrande=Math.max(0,(c.folhasGrande||0)-resto);else c.folhasPadrao=Math.max(0,(c.folhasPadrao||0)-resto)}
  }
  salvarConta(s.email,c);
  if(chaveProj)gravar('pl-gerado24h',{k:chaveProj,t:agora()});
  return {ok:true}}

/* ---------- código por e-mail (simulado, D-116: o código aparece na tela) ---------- */
var PEND=null;
function pedirCodigo(email){
  return new Promise(function(res){
    var cod=String(Math.floor(100000+Math.random()*900000));
    var p={email:email,codigo:cod,expiraEm:agora()+10*60000,pedidoEm:agora(),tentativas:0}; /* [HIPÓTESE] 10 min, C-t */
    PEND=p;
    setTimeout(function(){res({codigo:cod,expiraEm:p.expiraEm})},600) /* 600 ms simulados (brief §1.3) */
  })}
function confirmarCodigo(email,cod){
  return new Promise(function(res,rej){
    if(!PEND||PEND.email!==email){rej({tipo:'incorreto'});return}
    if(agora()>PEND.expiraEm){rej({tipo:'expirado'});return}
    if(PEND.tentativas>=5){rej({tipo:'tentativas'});return}   /* 5 tentativas → pedir novo (brief §1.4) */
    if(String(cod).replace(/\D/g,'')!==PEND.codigo){PEND.tentativas++;rej({tipo:'incorreto'});return}
    var c=contaDe(email),pf=c.perfil||'gratis';
    gravar('pl-conta',{email:email,entrouEm:agora()});
    res({email:email,perfil:pf,entrouEm:agora()})
  })}
function entrarComo(perfil){
  var email=null,em;
  for(em in CONTAS_PADRAO)if(CONTAS_PADRAO[em].perfil===perfil)email=em;
  if(!email)return null;
  gravar('pl-conta',{email:email,entrouEm:agora()});
  return sessao()}
function sair(){apagar('pl-conta');apagar('pl-codigo-sessao')}

/* ---------- código de impressão (D-123/D-124) ---------- */
var TENTA={n:0,bloqueadoAte:0};
function verificarCodigo(entrada){
  var cod=normalizaCodigo(entrada);
  if(!eCodigoPl(cod))return Promise.reject({tipo:'formato'});
  return hashCodigo(cod).then(function(hash){
    var r=buscarCodigo(hash);
    if(r){ /* hash primeiro: códigos semeados valem mesmo que a leitura do dígito difira */
      var sit=situacaoCodigo(r);
      if(sit==='revogado')return Promise.reject({tipo:'revogado'});
      if(sit==='usado')return Promise.reject({tipo:'usado'});
      if(sit==='vencido')return Promise.reject({tipo:'vencido'});
      var pc=PACOTES[r.pacote]||{nome:'Avulso básico',fotos:24,folhas:8};
      gravar('pl-codigo-sessao',{hash:hash,pacote:r.pacote,fotos:pc.fotos,folhas:pc.folhas,entrouEm:agora(),usadoEm:null});
      TENTA.n=0;
      return {ok:true,pacote:pc.nome,fotos:pc.fotos,folhas:pc.folhas}
    }
    if(!dvOk(cod))return Promise.reject({tipo:'dv'});        /* dígito errado: não gasta tentativa (adendo) */
    if(agora()<TENTA.bloqueadoAte)return Promise.reject({tipo:'tentativas',esperaMs:TENTA.bloqueadoAte-agora()});
    TENTA.n++;
    if(TENTA.n>=5){TENTA={n:5,bloqueadoAte:agora()+30000};return Promise.reject({tipo:'tentativas',esperaMs:30000})} /* 5 → 30 s */
    return Promise.reject({tipo:'invalido'})
  },function(){return Promise.reject({tipo:'indisponivel'})})}
function tentativasCodigo(){return {n:TENTA.n,esperaMs:Math.max(0,TENTA.bloqueadoAte-agora())}}
function sairCodigo(){apagar('pl-codigo-sessao')}

/* ---------- compra simulada (brief §3.6: sem campo de cartão; botões «Simular…») ---------- */
function novoRecibo(c,desc,valor){var r={id:'R'+String(agora()).slice(-6),data:fmtDataCurta(agora()),desc:desc,valor:valor};c.recibos=c.recibos||[];c.recibos.unshift(r);return r}
function comprar(n,classe,metodo){
  return new Promise(function(res){
    var s=sessao();
    if(!s){res({estado:'semConta'});return}
    var c=contaDe(s.email),L=limites().planos.avulsa;
    if(metodo==='aprovado'){
      var un=classe==='grande'?'folhas grandes':'folhas padrão';
      if(classe==='grande')c.folhasGrande=(c.folhasGrande||0)+n;else c.folhasPadrao=(c.folhasPadrao||0)+n;
      var rec=novoRecibo(c,n+' '+un,moeda(n*(classe==='grande'?L.precoGrande:L.precoPadrao)));
      salvarConta(s.email,c);
      res({estado:'confirmado',recibo:rec})
    }else if(metodo==='pendente')res({estado:'pendente'});
    else res({estado:'recusado'})
  })}
function assinarPro(metodo){
  return new Promise(function(res){
    var s=sessao();
    if(!s){res({estado:'semConta'});return}
    var c=contaDe(s.email),L=limites().planos.pro;
    if(metodo==='aprovado'){
      c.perfil='pro';c.proDesde=agora();c.proAte=agora()+30*DIA;delete c.canceladoEm;
      var rec=novoRecibo(c,'Assinatura Pro · 1 mês',moeda(L.precoMes));
      salvarConta(s.email,c);
      res({estado:'confirmado',recibo:rec})
    }else if(metodo==='pendente')res({estado:'pendente'});
    else res({estado:'recusado'})
  })}
function cancelarPro(){
  var s=sessao();if(!s)return false;
  var c=contaDe(s.email);c.canceladoEm=agora();c.proAte=c.proDesde?c.proDesde+30*DIA:agora()+30*DIA;
  salvarConta(s.email,c);return true}
function rebaixarGratis(){
  var s=sessao();if(!s)return false;
  var c=contaDe(s.email);c.perfil='gratis';delete c.proDesde;delete c.proAte;delete c.canceladoEm;
  salvarConta(s.email,c);return true}
function trocarAssinatura(off){ /* preferência da conta: padrão de novos projetos (brief §3.2) */
  var s=sessao();if(!s)return false;
  var c=contaDe(s.email);c.assinaturaDesligada=!!off;salvarConta(s.email,c);return true}
function excluirConta(){
  var s=sessao();if(!s)return false;
  var todas=ler('pl-contas-teste',null)||{};delete todas[s.email];gravar('pl-contas-teste',todas);
  apagar('pl-conta');return true}
function exportarDados(){
  var s=sessao();if(!s)return null;
  var c=contaDe(s.email),d={produto:'Polar Life',conta:{email:s.email,plano:plano()},recibos:c.recibos||[],geradoEm:new Date().toISOString()};
  return new Blob([JSON.stringify(d,null,2)],{type:'application/json'})}

/* ---------- admin (T-33) ---------- */
function salvarLimites(obj){if(obj&&obj.planos)return gravar('pl-planos',obj);return false}
function restaurarPadroes(){
  apagar('pl-planos');
  var todas=ler('pl-contas-teste',null)||{},em;               /* contas de teste voltam ao estado inicial; as outras ficam */
  for(em in CONTAS_PADRAO)todas[em]=JSON.parse(JSON.stringify(CONTAS_PADRAO[em]));
  gravar('pl-contas-teste',todas);return true}
function contasTeste(){
  var out=[],em;
  for(em in CONTAS_PADRAO){var c=contaDe(em),p=CONTAS_PADRAO[em].perfil;
    out.push({nome:CONTAS_PADRAO[em].nome,email:em,perfil:p,plano:nomePlano(p),folhasPadrao:c.folhasPadrao||0,folhasGrande:c.folhasGrande||0,usadasMes:c.usadasMes||0})}
  return out}
function adminSalvarContas(lista){ /* tabela do painel: plano, folhas compradas e uso do mês */
  var todas=ler('pl-contas-teste',null)||{},i,x;
  for(i=0;i<lista.length;i++){x=lista[i];var c=todas[x.email]||contaDe(x.email);
    if(x.perfil)c.perfil=x.perfil;
    if(x.perfil==='pro'){c.proDesde=c.proDesde||agora();c.proAte=(c.proDesde||agora())+30*DIA}
    if(x.perfil!=='pro'){delete c.proDesde;delete c.proAte;delete c.canceladoEm}
    c.folhasPadrao=+x.folhasPadrao||0;c.folhasGrande=+x.folhasGrande||0;c.usadasMes=+x.usadasMes||0;
    todas[x.email]=c}
  gravar('pl-contas-teste',todas);return true}

/* ---------- geração de códigos pelo admin (D-124: mostra a lista UMA vez, guarda só hashes) ---------- */
function gerarCodigoLegivel(){
  var corpo='',i;
  for(i=0;i<7;i++)corpo+=ALFABETO.charAt(Math.floor(Math.random()*31));
  return 'PL'+corpo+dvsCodigo(corpo)[0]}                    /* DV na leitura 0-based */
function gerarCodigos(pacoteId,qtd,validaDias){
  qtd=Math.max(1,Math.min(100,Math.round(qtd)||1));
  validaDias=Math.max(1,Math.round(validaDias)||30);
  var pc=PACOTES[pacoteId]?pacoteId:'avulso-basico';
  var db=dbCodigos(),feitos=[],i;
  for(i=0;i<qtd;i++)feitos.push(gerarCodigoLegivel());       /* colisão de hash é desprezível (2^256) */
  return Promise.all(feitos.map(function(cod){return hashCodigo(cod).then(function(h){
    db[h]={pacote:pc,criadoEm:agora(),validaDias:validaDias,usadoEm:null,revogado:false};
    return {codigo:cod,hash:h}})})).then(function(lista){gravar('pl-codigos',db);return lista})}
function revogarCodigo(hash){
  var r=buscarCodigo(hash);
  if(!r)return false;
  r.revogado=true;
  if(r.semeado)materializar(hash,r);else{var db=dbCodigos();db[hash]=r;gravar('pl-codigos',db)}
  return true}
function listarCodigos(){
  var db=dbCodigos(),out=[],h,r;
  for(h in db){r=db[h];out.push({hash:h,curto:h.slice(0,8),pacote:r.pacote,criadoEm:r.criadoEm,validaDias:r.validaDias,usadoEm:r.usadoEm||null,revogado:!!r.revogado,situacao:situacaoCodigo(r),semeado:false})}
  for(var i=0;i<SEMEADOS.length;i++){h=SEMEADOS[i];if(!db[h]){r=registroSemeado(h);out.push({hash:h,curto:h.slice(0,8),pacote:r.pacote,criadoEm:r.criadoEm,validaDias:r.validaDias,usadoEm:null,revogado:false,situacao:'livre',semeado:true})}}
  out.sort(function(a,b){return (a.usadoEm?0:1)-(b.usadoEm?0:1)||b.criadoEm-a.criadoEm});
  return out}

PLCONTA={
  modo:function(){return 'demo'},                             /* 'servidor' quando houver backend (DOC-12 §6) */
  provedores:function(){return []},                          /* C-d: sem Apple/Google no modo demo (T7) */
  temLocalStorage:temLocalStorage,
  sessao:sessao,sessaoCodigo:sessaoCodigo,temSessao:temSessao,
  pedirCodigo:pedirCodigo,confirmarCodigo:confirmarCodigo,entrarComo:entrarComo,sair:sair,
  plano:plano,direito:direito,consumir:consumir,
  comprar:comprar,assinarPro:assinarPro,cancelarPro:cancelarPro,rebaixarGratis:rebaixarGratis,
  trocarAssinatura:trocarAssinatura,excluirConta:excluirConta,exportarDados:exportarDados,
  limites:limites,contasTeste:contasTeste,moeda:moeda,
  /* códigos de impressão (D-123/D-124) */
  pacotes:function(){return JSON.parse(JSON.stringify(PACOTES))},
  verificarCodigo:verificarCodigo,tentativasCodigo:tentativasCodigo,sairCodigo:sairCodigo,
  dvOk:dvOk,
  admin:{
    salvarLimites:salvarLimites,restaurarPadroes:restaurarPadroes,salvarContas:adminSalvarContas,
    gerarCodigos:gerarCodigos,revogarCodigo:revogarCodigo,listarCodigos:listarCodigos
  }
};
window.PLCONTA=PLCONTA;
})();
