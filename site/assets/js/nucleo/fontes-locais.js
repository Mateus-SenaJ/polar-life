/* D-208 · Fontes do computador: Lucida Handwriting e as variações dela (Lucida Calligraphy, Lucida Casual).
   São proprietárias (Bigelow & Holmes): o site não pode distribuir o arquivo (licença + T6). Quando a fonte está instalada
   no aparelho e o navegador dá acesso a ela (Acesso a fontes locais, com permissão do usuário), os bytes são lidos aqui mesmo
   e servem à tela, ao PDF e à imagem (MT-02: tela = PDF = imagem). A licença dessas fontes permite embuti-las no documento
   do próprio usuário (fsType 8). Sem acesso, entra a livre mais parecida, na tela e no arquivo. Nada sai do aparelho (T5).
   Se um dia houver licença para a web, basta pôr o arquivo em assets/fonts/pdf/<arq>: o gerador tenta esse arquivo primeiro. */
(function(){
var LISTA=[
 {n:'Lucida Handwriting',fam:'PL Lucida Handwriting',arq:'pl-lucida-handwriting-400-italico.ttf',reserva:'Courgette',woff:'courgette-400.woff2',
  ps:['LucidaHandwriting-Italic','LucidaHandwritingStd-Italic','LucidaHandwritingStd']},
 {n:'Lucida Calligraphy',fam:'PL Lucida Calligraphy',arq:'pl-lucida-calligraphy-400-italico.ttf',reserva:'Fondamento Itálico',woff:'fondamento-400-italico.woff2',
  ps:['LucidaCalligraphy-Italic','LucidaCalligraphyStd-Italic','LucidaCalligraphyStd']},
 {n:'Lucida Casual',fam:'PL Lucida Casual',arq:'pl-lucida-casual-400-italico.ttf',reserva:'Merienda',woff:'merienda-400.woff2',opc:true,
  ps:['LucidaCasualStd-Italic','LucidaCasual-Italic']}
];
var BYTES={},INST={},FACE={},PERM='',api=typeof window.queryLocalFonts==='function',ouvintes=[];
var SC=document.currentScript,FONTS=SC&&SC.src?SC.src.replace(/js\/nucleo\/fontes-locais\.js[^\/]*$/,'fonts/'):'../assets/fonts/';
/* enquanto a fonte do computador não está em uso, o nome próprio (PL …) aponta para a reserva livre, como face itálica:
   a tela mostra exatamente a letra que vai para o PDF e para a imagem, sem itálico sintético (D-148) */
function face(it,fonte){
  if(typeof FontFace!=='function'||!document.fonts)return null;
  var ff;try{ff=new FontFace(it.fam,fonte,{style:'italic',weight:'400'})}catch(e){return null}
  document.fonts.add(ff);FACE[it.arq]=ff;return ff
}
LISTA.forEach(function(it){face(it,'url("'+FONTS+it.woff+'") format("woff2")')});
function porNome(n){for(var i=0;i<LISTA.length;i++)if(LISTA[i].n===n)return LISTA[i];return null}
function porArq(a){for(var i=0;i<LISTA.length;i++)if(LISTA[i].arq===a)return LISTA[i];return null}
function avisar(){try{document.dispatchEvent(new CustomEvent('pl-fontes-locais'))}catch(e){}ouvintes.forEach(function(f){try{f()}catch(e){}})}
/* instalada? local() pelo nome PostScript, sem permissão e sem ler nada */
function sondar(it){
  if(typeof FontFace!=='function')return Promise.resolve(false);
  var src=it.ps.map(function(p){return'local("'+p+'")'}).concat(['local("'+it.n+'")']).join(',');
  var ff;try{ff=new FontFace('PLSonda'+it.arq.replace(/[^a-z]/g,''),src)}catch(e){return Promise.resolve(false)}
  return ff.load().then(function(){return true},function(){return false})
}
function permissao(){
  if(!api||!navigator.permissions||!navigator.permissions.query)return Promise.resolve('');
  return navigator.permissions.query({name:'local-fonts'}).then(function(s){return s.state},function(){return''})
}
/* lê os bytes das fontes encontradas e registra cada uma com o nome próprio (PL …), só para o PolarLife */
function ler(){
  var todos=[].concat.apply([],LISTA.map(function(x){return x.ps}));
  return window.queryLocalFonts({postscriptNames:todos}).then(function(fs){
    var jobs=LISTA.map(function(it){
      var f=null;it.ps.some(function(p){f=fs.filter(function(x){return x.postscriptName===p})[0]||null;return!!f});
      if(!f||BYTES[it.arq])return null;
      return f.blob().then(function(b){return b.arrayBuffer()}).then(function(ab){
        var u=new Uint8Array(ab),ff=new FontFace(it.fam,u.slice().buffer,{style:'italic',weight:'400'});
        return ff.load().then(function(x){   /* só troca a reserva depois que a fonte do computador carregou */
          if(FACE[it.arq])try{document.fonts.delete(FACE[it.arq])}catch(e){}
          document.fonts.add(x);FACE[it.arq]=x;BYTES[it.arq]=u;INST[it.n]=true})
      }).catch(function(){})
    });
    return Promise.all(jobs)
  })
}
var pronto=Promise.all(LISTA.map(function(it){return sondar(it).then(function(v){INST[it.n]=v})}).concat([permissao().then(function(s){PERM=s})]))
  .then(function(){
    var algum=LISTA.some(function(it){return INST[it.n]});
    if(api&&PERM==='granted'&&algum)return ler().then(function(){if(Object.keys(BYTES).length)avisar()},function(){})
  }).catch(function(){});
/* pedido do usuário (precisa de um toque): o navegador mostra a pergunta de permissão */
function pedir(){
  if(!api)return Promise.resolve(false);
  return ler().then(function(){PERM='granted';avisar();return Object.keys(BYTES).length>0},function(){return permissao().then(function(s){PERM=s;avisar();return false})})
}
/* ok = em uso · pedir = instalada, falta permitir · bloqueada = permissão negada · sem-acesso = instalada, navegador sem acesso · ausente */
function estado(n){
  var it=porNome(n);if(!it)return'';
  if(BYTES[it.arq])return'ok';
  if(INST[it.n]===false)return'ausente';
  if(!api)return INST[it.n]?'sem-acesso':'ausente';
  if(PERM==='denied')return'bloqueada';
  return'pedir'
}
function texto(n){
  var it=porNome(n),e=estado(n);if(!it)return'';
  if(e==='ok')return'Do seu computador · vai para a tela, o PDF e a imagem.';
  if(e==='pedir')return'Instalada neste computador. Permita o acesso para usar; até lá, entra a '+it.reserva.replace(' Itálico','')+', a mais parecida.';
  if(e==='bloqueada')return'O acesso às fontes do computador está bloqueado neste navegador (ícone ao lado do endereço › Fontes). Até lá, entra a '+it.reserva.replace(' Itálico','')+'.';
  if(e==='sem-acesso')return'Instalada, mas este navegador não deixa o site usar fontes do computador (use o Chrome ou o Edge). Entra a '+it.reserva.replace(' Itálico','')+'.';
  return'Fonte paga, não vem com o site. Neste aparelho entra a '+it.reserva.replace(' Itálico','')+', a mais parecida.'
}
window.PLFONTESLOCAIS={LISTA:LISTA,pronto:pronto,pedir:pedir,estado:estado,texto:texto,porNome:porNome,porArq:porArq,
  bytes:function(a){return BYTES[a]||null},ouvir:function(f){ouvintes.push(f)},api:function(){return api}};
})();
