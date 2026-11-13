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
/* D-193: os projetos são da conta. Quando muda quem está usando (entrar com outra conta, sair, código de impressão), o projeto
   aberto é fechado nesta aba e as fotos de trabalho saem do aparelho; os projetos continuam guardados, cada um com a sua conta. */
var SESSAO_K={'pl-conta':1,'pl-codigo-sessao':1};
function donoSessao(){var c=ler('pl-conta',null),s=ler('pl-codigo-sessao',null);return c&&c.email?'conta:'+String(c.email).trim().toLowerCase():s&&s.hash?'codigo:'+s.hash:''}
function fecharProjeto(){
  try{localStorage.removeItem('pl-projeto-atual')}catch(e){}
  try{for(var i=sessionStorage.length-1;i>=0;i--){var k=sessionStorage.key(i);if(/^pl-/.test(k))sessionStorage.removeItem(k)}}catch(e){}
  try{var r=indexedDB.open('polar-life');r.onsuccess=function(){var d=r.result;if(!d.objectStoreNames.contains('fotos')){d.close();return}var t=d.transaction('fotos','readwrite');t.objectStore('fotos').clear();t.oncomplete=t.onerror=function(){d.close()}}}catch(e){}
}
function gravar(k,v){var antes=SESSAO_K[k]?donoSessao():null;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){return false}if(antes!==null&&antes!==donoSessao())fecharProjeto();return true}
function apagar(k){var antes=SESSAO_K[k]?donoSessao():null;try{localStorage.removeItem(k)}catch(e){}if(antes!==null&&antes!==donoSessao())fecharProjeto()}
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
function direito(nFolhas,classe,chaveProj){
  if(!temSessao())return {ok:false,motivo:'semConta'};
  if(chaveProj){var g0=ler('pl-gerado24h',null);if(g0&&g0.k===chaveProj&&agora()-g0.t<DIA)return {ok:true,usaGratis:false,jaContado:true}}   /* DOC-03 §3: a mesma folha em 24 h já foi contada: não pede outra */
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
/* Cadastro básico depois de entrar (provedor, e-mail ou código): nome + e-mail, só neste navegador (T5).
   Com código de impressão, os dados ficam na sessão do código, que continua limitada ao pacote (D-124). */
var EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function completarCadastro(d){
  var nome=String(d&&d.nome||'').replace(/\s+/g,' ').trim(),email=String(d&&d.email||'').trim().toLowerCase(),origem=d&&d.origem||'email';
  if(nome.length<2||nome.length>60)return {erro:'nome'};
  if(!EMAIL_RE.test(email))return {erro:'email'};
  if(d.aceite!==true)return {erro:'aceite'};
  var sc=sessaoCodigo();
  if(origem==='codigo'){if(!sc)return {erro:'codigo'};sc.email=email;sc.nome=nome;sc.aceiteEm=agora();gravar('pl-codigo-sessao',sc);return {ok:true,codigo:true}}
  var c=contaDe(email);c.nome=nome;c.provedor=origem;c.aceiteEm=agora();salvarConta(email,c);
  gravar('pl-conta',{email:email,nome:nome,provedor:origem,entrouEm:agora()});return {ok:true}
}
/* Volta de um provedor real (Google, D-147g): e-mail confirmado pelo provedor. Conta já aceita → entra direto;
   conta nova → abre a sessão e pede «Seus dados» (nome + aceite), com o e-mail fixo. */
function entrarComProvedor(d){
  var email=String(d&&d.email||'').trim().toLowerCase(),prov=d&&d.provedor||'google',nome=String(d&&d.nome||'').replace(/\s+/g,' ').trim().slice(0,60);
  if(!EMAIL_RE.test(email))return {erro:'email'};
  var c=contaDe(email);
  gravar('pl-conta',{email:email,nome:c.nome||nome,provedor:prov,entrouEm:agora()});
  return c.aceiteEm||CONTAS_PADRAO[email]?{ok:true,nome:c.nome||nome}:{pendente:true,nome:nome}
}
function precisaCadastro(){var s=sessao();if(!s)return false;var c=contaDe(s.email);return !c.aceiteEm&&!CONTAS_PADRAO[s.email]}
function cadastroPendente(){var sc=sessaoCodigo();if(sc)return !sc.email;return precisaCadastro()}   /* código conferido ou e-mail novo sem «Seus dados» */

/* ---------- e-mail e senha (D-144) ----------
   A senha nunca é guardada nem sai do aparelho (T5): fica só a derivação PBKDF2-SHA-256 com sal aleatório
   por conta, em pl-contas-teste[email].senha = {alg, it, sal, hash}. 5 erros seguidos → espera de 30 s.
   Modo demonstração: «Esqueci a senha» usa o código de 6 dígitos mostrado na tela (D-116). */
var IT_SENHA=150000,TENTA_SENHA={n:0,bloqueadoAte:0},SAL_VAZIO='00000000000000000000000000000000';
/* D-196: as contas de teste também entram com e-mail e senha, em qualquer aparelho. Aqui fica só a derivação (PBKDF2 com sal);
   a senha em texto fica com o dono, fora do git. Uma senha criada neste aparelho («Esqueci a senha») vale no lugar dela. */
var SENHAS_PADRAO={
  'admin@polarlife.test':{alg:'PBKDF2-SHA256',it:150000,sal:'55f38803f9c27d2ea2224fc972242b9d',hash:'c4fa801c539c9575beb761b2b75902267ee1f4fffabed90646e4d6123406d588'},
  'gratis@polarlife.test':{alg:'PBKDF2-SHA256',it:150000,sal:'948d3bfd19bd4086c96e5fac053ffa3a',hash:'7317818f6c2e8207b4e7f15d0fc736b1d7c59e7c1edf79e2d2fe7c60c6e2415d'},
  'folha@polarlife.test':{alg:'PBKDF2-SHA256',it:150000,sal:'640b2b32ea91bab82554e5eeed4789df',hash:'fa5376cc9bdee442dfb6231eb25b98e4676e206ce5e1cde2f62a22fc47bde5bb'},
  'pro@polarlife.test':{alg:'PBKDF2-SHA256',it:150000,sal:'56dc2f2997264f438a7fc135375b77ea',hash:'00a05f89eeb9629079b1f0408190ff5706927af84753051b03ea827b327bbbf4'}
};
function paraHex(buf){var b=new Uint8Array(buf),h='',i,c;for(i=0;i<b.length;i++){c=b[i].toString(16);h+=c.length<2?'0'+c:c}return h}
function deHex(h){var b=new Uint8Array(h.length/2),i;for(i=0;i<b.length;i++)b[i]=parseInt(h.substr(i*2,2),16);return b}
function derivarSenha(senha,sal,it){
  if(!(window.crypto&&window.crypto.subtle&&window.TextEncoder))return Promise.reject({tipo:'indisponivel'});
  return window.crypto.subtle.importKey('raw',new TextEncoder().encode(String(senha)),'PBKDF2',false,['deriveBits']).then(function(k){
    return window.crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:deHex(sal),iterations:it},k,256)
  }).then(paraHex,function(){return Promise.reject({tipo:'indisponivel'})})}
function senhaValida(s){return typeof s==='string'&&s.length>=8&&s.length<=128}
function normEmail(e){return String(e||'').trim().toLowerCase()}
function guardarSenha(email,senha){
  var b=new Uint8Array(16);window.crypto.getRandomValues(b);var sal=paraHex(b);
  return derivarSenha(senha,sal,IT_SENHA).then(function(h){
    var c=contaDe(email);c.senha={alg:'PBKDF2-SHA256',it:IT_SENHA,sal:sal,hash:h};salvarConta(email,c);return c})}
function temConta(email){var t=ler('pl-contas-teste',null)||{},c=t[email];return !!(CONTAS_PADRAO[email]||(c&&(c.senha||c.aceiteEm)))}
function criarConta(d){ /* «Criar nova conta»: nome, e-mail, senha e aceite; já entra */
  var nome=String(d&&d.nome||'').replace(/\s+/g,' ').trim(),email=normEmail(d&&d.email),senha=d&&d.senha;
  if(nome.length<2||nome.length>60)return Promise.reject({erro:'nome'});
  if(!EMAIL_RE.test(email))return Promise.reject({erro:'email'});
  if(!senhaValida(senha))return Promise.reject({erro:'senha'});
  if(!d||d.aceite!==true)return Promise.reject({erro:'aceite'});
  if(temConta(email))return Promise.reject({erro:'existe'});
  if(!(window.crypto&&window.crypto.subtle&&window.crypto.getRandomValues))return Promise.reject({erro:'indisponivel'});
  return guardarSenha(email,senha).then(function(c){
    c.nome=nome;c.provedor='senha';c.aceiteEm=agora();salvarConta(email,c);
    gravar('pl-conta',{email:email,nome:nome,provedor:'senha',entrouEm:agora()});
    return {email:email,nome:nome,perfil:c.perfil||'gratis'}
  },function(){return Promise.reject({erro:'indisponivel'})})}
function entrarComSenha(emailBruto,senha){
  var email=normEmail(emailBruto);
  if(agora()<TENTA_SENHA.bloqueadoAte)return Promise.reject({tipo:'tentativas',esperaMs:TENTA_SENHA.bloqueadoAte-agora()});
  var t=ler('pl-contas-teste',null)||{},c=t[email],reg=c&&c.senha||SENHAS_PADRAO[email]||null;
  /* conta sem senha ou inexistente: deriva do mesmo jeito e responde igual (não revela se o e-mail existe) */
  return derivarSenha(senha,reg?reg.sal:SAL_VAZIO,reg?reg.it:IT_SENHA).then(function(h){
    if(reg&&h===reg.hash){
      TENTA_SENHA.n=0;var cc=contaDe(email);   /* conta de teste que nunca entrou neste aparelho: vem dos padrões */
      gravar('pl-conta',{email:email,nome:cc.nome,provedor:'senha',entrouEm:agora()});
      return {email:email,nome:cc.nome,perfil:cc.perfil||'gratis'}
    }
    TENTA_SENHA.n++;
    if(TENTA_SENHA.n>=5){TENTA_SENHA={n:0,bloqueadoAte:agora()+30000};return Promise.reject({tipo:'tentativas',esperaMs:30000})}
    return Promise.reject({tipo:'incorreto'})
  })}
function definirSenha(senha){ /* depois de confirmar o código por e-mail («Esqueci a senha»): vale para a sessão aberta */
  var s=sessao();
  if(!s)return Promise.reject({erro:'sessao'});
  if(!senhaValida(senha))return Promise.reject({erro:'senha'});
  if(!(window.crypto&&window.crypto.subtle&&window.crypto.getRandomValues))return Promise.reject({erro:'indisponivel'});
  return guardarSenha(s.email,senha).then(function(){TENTA_SENHA={n:0,bloqueadoAte:0};return {ok:true}},function(){return Promise.reject({erro:'indisponivel'})})}

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
  var c=contaDe(s.email),d={produto:'PolarLife',conta:{email:s.email,plano:plano()},recibos:c.recibos||[],perfil:perfil(),preferencias:preferencias(),codigos:codigos(),aceites:aceites(),geradoEm:new Date().toISOString()};   /* GET /conta/dados → «exportar_dados» */
  return new Blob([JSON.stringify(d,null,2)],{type:'application/json'})}

/* ---------- Conta como página de configurações (perfil, uso, códigos, pagamentos, segurança, preferências) ----------
   Leituras e gravações pequenas, no localStorage, com a MESMA forma das tabelas do DOC-15 §7 (nomes em camelCase, datas em ISO 8601),
   para a tela não mudar quando a rota da API existir (DOC-15 §8). Nada daqui muda as funções de cima. Tudo local (T5). */
function iso(ts){return ts?new Date(ts).toISOString():null}
/* identidade.usuarios · futura GET /conta/perfil (SELECT com RLS). Sessão por código não tem conta: vem o que ela informou no cadastro. */
function perfil(){
  var sc=sessaoCodigo();
  if(sc)return {id:null,email:sc.email||null,emailVerificadoEm:null,nome:sc.nome||null,situacao:'ativa',criadoEm:null,atualizadoEm:null,entrouEm:iso(sc.entrouEm),provedor:'codigo'};
  var s=sessao();if(!s)return null;
  var c=contaDe(s.email),prov=s.provedor||c.provedor||null;
  return {id:null,email:s.email,
    emailVerificadoEm:prov==='google'?iso(c.aceiteEm||s.entrouEm):null,   /* só o Google confirma o e-mail de verdade; o código por e-mail é simulado (D-116) */
    nome:c.nome||s.nome||'',situacao:'ativa',criadoEm:iso(c.criadoEm||c.aceiteEm||null),atualizadoEm:iso(c.perfilEm||null),entrouEm:iso(s.entrouEm),provedor:prov}
}
/* identidade.usuarios (nome) · futura PATCH /conta/perfil → UPDATE (nome) com RLS (DOC-15 §4, correção). O e-mail troca por «trocar_email», com código. */
function atualizarPerfil(d){
  var nome=String(d&&d.nome||'').replace(/\s+/g,' ').trim();
  if(nome.length<2||nome.length>60)return {erro:'nome'};
  var sc=sessaoCodigo();
  if(sc){sc.nome=nome;gravar('pl-codigo-sessao',sc);return {ok:true,nome:nome}}
  var s=sessao();if(!s)return {erro:'sessao'};
  var c=contaDe(s.email);c.nome=nome;c.perfilEm=agora();salvarConta(s.email,c);
  s.nome=nome;gravar('pl-conta',s);
  return {ok:true,nome:nome}
}
/* privacidade.aceites · futura GET /conta/aceites */
function aceites(){
  var s=sessao(),sc=sessaoCodigo(),t=sc?sc.aceiteEm:(s?contaDe(s.email).aceiteEm:null);
  if(!t)return [];
  return [{documento:'termos',aceitoEm:iso(t)},{documento:'privacidade',aceitoEm:iso(t)}]
}
/* identidade.credenciais_senha · a tela só sabe se existe senha, nunca o hash */
function temSenha(){
  var s=sessao();if(!s)return false;
  var t=ler('pl-contas-teste',null)||{},c=t[s.email];
  return !!((c&&c.senha)||SENHAS_PADRAO[s.email])
}
/* POST /conta/senha → «definir_senha» (a API confere a senha atual com «conta_por_email» + Argon2id e encerra as outras sessões).
   Conta sem senha (Google ou código por e-mail) define a primeira direto. Erros: senha · atual · tentativas · indisponivel · sessao. */
function trocarSenha(atual,nova){
  var s=sessao();
  if(!s)return Promise.reject({erro:'sessao'});
  if(!senhaValida(nova))return Promise.reject({erro:'senha'});
  var t=ler('pl-contas-teste',null)||{},c=t[s.email],reg=c&&c.senha||SENHAS_PADRAO[s.email]||null;
  if(!reg)return definirSenha(nova);
  if(agora()<TENTA_SENHA.bloqueadoAte)return Promise.reject({erro:'tentativas',esperaMs:TENTA_SENHA.bloqueadoAte-agora()});
  return derivarSenha(String(atual||''),reg.sal,reg.it).then(function(h){
    if(h!==reg.hash){
      TENTA_SENHA.n++;
      if(TENTA_SENHA.n>=5){TENTA_SENHA={n:0,bloqueadoAte:agora()+30000};return Promise.reject({erro:'tentativas',esperaMs:30000})}
      return Promise.reject({erro:'atual'})
    }
    return definirSenha(nova)
  },function(){return Promise.reject({erro:'indisponivel'})})
}
/* identidade.sessoes (sem o hash do token) · futura GET /conta/sessoes. Em demonstração a conta só existe neste navegador:
   a lista tem uma linha, a deste aparelho. */
function aparelhoAtual(){
  var ua=navigator.userAgent||'';
  var nav=/Edg\//.test(ua)?'Edge':/OPR\//.test(ua)?'Opera':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Navegador';
  var so=/Android/.test(ua)?'Android':/iPhone|iPad|iPod/.test(ua)?'iOS':/Windows/.test(ua)?'Windows':/Mac OS X/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'';
  return (nav+(so?' · '+so:'')).slice(0,80)
}
function sessoes(){
  var e=sessaoCodigo()||sessao();
  if(!e)return [];
  return [{id:null,criadaEm:iso(e.entrouEm),ultimoUsoEm:iso(agora()),expiraEm:null,revogadaEm:null,aparelho:aparelhoAtual(),atual:true}]
}
/* POST /auth/sair-de-todos → «encerrar_sessoes». Devolve quantas sessões encerrou (aqui, a deste navegador). */
function encerrarSessoes(){var n=temSessao()?1:0;sair();return n}
/* Preferências da conta: unidade de medida e e-mails. [PENDENTE no DOC-15] Ainda não há tabela para isto: com servidor, pede uma
   migração nova (ex.: identidade.preferencias) e uma linha no inventário (§2) antes da rota GET/PATCH /conta/preferencias.
   Sem conta (sessão por código) a preferência é do aparelho (pl-preferencias). */
var UNIDADES={mm:1,cm:1,pol:1};
function prefPadrao(p){
  p=p||{};
  return {unidade:UNIDADES[p.unidade]?p.unidade:'mm',emails:{novidades:!!(p.emails&&p.emails.novidades)},atualizadoEm:p.atualizadoEm||null}
}
function preferencias(){
  var s=sessao();
  if(s&&!sessaoCodigo())return prefPadrao(contaDe(s.email).preferencias);
  return prefPadrao(ler('pl-preferencias',null))
}
function salvarPreferencias(d){
  var p=preferencias();
  if(d&&d.unidade!==undefined){if(!UNIDADES[d.unidade])return {erro:'unidade'};p.unidade=d.unidade}
  if(d&&d.emails&&d.emails.novidades!==undefined)p.emails.novidades=!!d.emails.novidades;
  p.atualizadoEm=iso(agora());
  var s=sessao();
  if(s&&!sessaoCodigo()){var c=contaDe(s.email);c.preferencias=p;salvarConta(s.email,c)}
  else gravar('pl-preferencias',p);
  return {ok:true,preferencias:p}
}
/* Formas de pagamento · futura GET /conta/pagamentos/metodos, lida do provedor de pagamento (checkout hospedado): o banco nunca
   guarda dado de cartão (DOC-15 §2, «Fora do banco, sempre»). Em demonstração a lista é sempre vazia: nada é cobrado. */
function formasPagamento(){return []}
/* comercial.recibos · futura GET /conta/recibos (SELECT com RLS). Os recibos de hoje são de demonstração (compra simulada). */
function recibos(){
  var s=sessao();if(!s||sessaoCodigo())return [];
  return (contaDe(s.email).recibos||[]).map(function(r){
    var m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(r.data||''),v=parseFloat(String(r.valor||'').replace(/[^\d,]/g,'').replace(',','.'));
    return {numero:r.id,descricao:r.desc,valorCentavos:isNaN(v)?0:Math.round(v*100),moeda:'BRL',
      emitidoEm:m?iso(new Date(+m[3],+m[2]-1,+m[1],12).getTime()):null,notaFiscalRef:null,demonstracao:true}
  })
}
/* comercial.assinaturas (a viva) · futura GET /conta/assinatura. Nulo quando não há Pro. */
function assinatura(){
  var s=sessao();if(!s||sessaoCodigo())return null;
  var c=contaDe(s.email);
  if(perfilEfetivo(c)!=='pro')return null;
  var L=limites().planos.pro,fim=c.proAte||(c.proDesde?c.proDesde+30*DIA:null);
  return {situacao:c.canceladoEm?'cancelada_no_fim':'ativa',periodoInicio:iso(c.proDesde||null),periodoFim:iso(fim),canceladaEm:iso(c.canceladoEm||null),
    assinaturaDesligada:!!c.assinaturaDesligada,valorCentavos:Math.round((L.precoMes!==undefined?L.precoMes:14.9)*100),moeda:'BRL',provedor:null}
}
/* GET /conta/direito → «direito_de_uso»: o mesmo JSON do contrato (DOC-12 §6.4), para a tela mostrar quanto dá para imprimir agora. */
function direitoDeUso(){
  var sc=sessaoCodigo();
  if(sc)return {plano:'codigo',creditosPadrao:sc.usadoEm?0:sc.folhas,creditosGrande:0,folhasGratisNoMes:0,folhasGratisUsadasNoMes:0,usoNoMes:0,usoRazoavel:null,
    fotosPorProjeto:sc.fotos,assinaturaPodeDesligar:false,assinaturaDesligada:false,expiraEm:null,renovaEm:null};
  var p=plano();if(!p)return null;
  var g=p.id==='gratis',pro=p.id==='pro'||p.id==='admin',a=assinatura(),d1=agoraBR(),m=d1.getMonth()+2,an=d1.getFullYear();
  if(m>12){m=1;an++}
  return {plano:p.id==='admin'?'pro':p.id,creditosPadrao:p.folhasCompradas.padrao,creditosGrande:p.folhasCompradas.grande,
    folhasGratisNoMes:g?p.folhasMes:0,folhasGratisUsadasNoMes:g?Math.min(p.usadasMes,p.folhasMes):0,
    usoNoMes:pro?p.usadasMes:0,usoRazoavel:pro?p.usoRazoavel:null,fotosPorProjeto:p.fotosPorProjeto,
    assinaturaPodeDesligar:!!p.assinaturaPodeDesligar,assinaturaDesligada:!!p.assinaturaDesligada,
    expiraEm:a?a.periodoFim:null,renovaEm:an+'-'+('0'+m).slice(-2)+'-01'}
}
/* Códigos de impressão da pessoa · comercial.codigos_impressao (usado_por) + movimentos_folhas (tipo 'codigo') · futura GET /conta/codigos.
   Guarda só os 4 últimos caracteres («final»), como o banco. «restam» é só para a tela: as folhas de um código entram no saldo da
   classe, e a conta considera que as compradas avulsas saem primeiro; quando o saldo fica menor que a soma dos códigos, baixa do
   código mais antigo. */
function codigos(){
  var sc=sessaoCodigo();
  if(sc){
    var r=buscarCodigo(sc.hash),pc=PACOTES[sc.pacote]||{nome:'Avulso básico'};
    return [{final:null,pacote:pc.nome,classe:'padrao',folhas:sc.folhas,restam:sc.usadoEm?0:sc.folhas,fotosMax:sc.fotos,resgatadoEm:iso(sc.entrouEm),
      usadoEm:iso(sc.usadoEm||null),validoAte:r?iso(r.criadoEm+r.validaDias*DIA):null,situacao:sc.usadoEm?'usado':'disponivel',emUso:true}]
  }
  var s=sessao();if(!s)return [];
  var c=contaDe(s.email),lista=c.codigos||[],saldo={padrao:c.folhasPadrao||0,grande:c.folhasGrande||0},soma={padrao:0,grande:0},i,x,mudou=false;
  for(i=0;i<lista.length;i++)soma[lista[i].classe]+=lista[i].restam;
  for(i=0;i<lista.length;i++){x=lista[i];
    if(soma[x.classe]>saldo[x.classe]&&x.restam>0){var tira=Math.min(x.restam,soma[x.classe]-saldo[x.classe]);x.restam-=tira;soma[x.classe]-=tira;mudou=true}}
  if(mudou){c.codigos=lista;salvarConta(s.email,c)}
  return lista.map(function(k){
    return {final:k.final,pacote:(PACOTES[k.pacote]||{nome:k.pacote}).nome,classe:k.classe,folhas:k.folhas,restam:k.restam,fotosMax:k.fotosMax,
      resgatadoEm:iso(k.resgatadoEm),usadoEm:null,validoAte:iso(k.validoAte),situacao:k.restam>0?'disponivel':'usado',emUso:false}
  })
}
/* POST /codigos/resgate → «resgatar_codigo» (PL002 não encontrado · PL003 usado, revogado ou vencido): uso único, credita as folhas
   do pacote no saldo da conta. Diferente de verificarCodigo, que abre uma sessão sem conta. Mesma trava de tentativas (D-124). */
function resgatarCodigo(entrada){
  var s=sessao();
  if(!s||sessaoCodigo())return Promise.reject({tipo:'semConta'});
  var cod=normalizaCodigo(entrada);
  if(!eCodigoPl(cod))return Promise.reject({tipo:'formato'});
  return hashCodigo(cod).then(function(hash){
    var r=buscarCodigo(hash);
    if(!r){
      if(!dvOk(cod))return Promise.reject({tipo:'dv'});
      if(agora()<TENTA.bloqueadoAte)return Promise.reject({tipo:'tentativas',esperaMs:TENTA.bloqueadoAte-agora()});
      TENTA.n++;
      if(TENTA.n>=5){TENTA={n:5,bloqueadoAte:agora()+30000};return Promise.reject({tipo:'tentativas',esperaMs:30000})}
      return Promise.reject({tipo:'invalido'})
    }
    var sit=situacaoCodigo(r);
    if(sit!=='livre')return Promise.reject({tipo:sit});
    var pc=PACOTES[r.pacote]||{nome:'Avulso básico',fotos:24,folhas:8},db;
    r.usadoEm=agora();
    if(r.semeado)materializar(hash,r);else{db=dbCodigos();db[hash]=r;gravar('pl-codigos',db)}
    var c=contaDe(s.email);
    c.folhasPadrao=(c.folhasPadrao||0)+pc.folhas;
    c.codigos=c.codigos||[];
    c.codigos.push({final:cod.slice(-4),pacote:r.pacote,classe:'padrao',folhas:pc.folhas,restam:pc.folhas,fotosMax:pc.fotos,resgatadoEm:agora(),validoAte:r.criadoEm+r.validaDias*DIA});
    salvarConta(s.email,c);
    TENTA.n=0;
    return {ok:true,pacote:pc.nome,folhas:pc.folhas,classe:'padrao',fotosMax:pc.fotos}
  },function(){return Promise.reject({tipo:'indisponivel'})})
}

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
  provedores:function(){return [{id:'google',nome:'Google'}]},      /* D-144: segundo bloco; D-194: a Apple saiu (só simulava a entrada) */ /* modo demo: o botão leva ao cadastro local e avisa que o provedor ainda não é acessado (T7) */
  completarCadastro:completarCadastro,entrarComProvedor:entrarComProvedor,precisaCadastro:precisaCadastro,cadastroPendente:cadastroPendente,
  temLocalStorage:temLocalStorage,
  sessao:sessao,sessaoCodigo:sessaoCodigo,temSessao:temSessao,
  pedirCodigo:pedirCodigo,confirmarCodigo:confirmarCodigo,entrarComo:entrarComo,sair:sair,
  criarConta:criarConta,entrarComSenha:entrarComSenha,definirSenha:definirSenha,              /* e-mail e senha (D-144) */
  plano:plano,direito:direito,consumir:consumir,
  comprar:comprar,assinarPro:assinarPro,cancelarPro:cancelarPro,rebaixarGratis:rebaixarGratis,
  trocarAssinatura:trocarAssinatura,excluirConta:excluirConta,exportarDados:exportarDados,
  limites:limites,contasTeste:contasTeste,moeda:moeda,
  /* Conta como página de configurações: mesmas formas do DOC-15 §7, prontas para virar rota (DOC-15 §8) */
  perfil:perfil,atualizarPerfil:atualizarPerfil,aceites:aceites,temSenha:temSenha,trocarSenha:trocarSenha,sessoes:sessoes,encerrarSessoes:encerrarSessoes,
  preferencias:preferencias,salvarPreferencias:salvarPreferencias,formasPagamento:formasPagamento,recibos:recibos,assinatura:assinatura,
  direitoDeUso:direitoDeUso,codigos:codigos,resgatarCodigo:resgatarCodigo,
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
