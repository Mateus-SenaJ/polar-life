/* PolarLife · Google Fotos pelo seletor oficial (Google Photos Picker API, D-168).
   A pessoa escolhe as fotos numa janela do próprio Google; só as escolhidas são baixadas, direto para este
   aparelho (T5). Nenhum script do Google é carregado (T6): são chamadas REST com o token de 1 h que a tela de
   entrar guardou nesta aba (sessionStorage «pl-gfotos»). O token nunca vai para o projeto, o backup ou o PDF. */
(function(){
'use strict';
var API='https://photospicker.googleapis.com/v1/',CHAVE='pl-gfotos';

function acesso(){
  var a=null;try{a=JSON.parse(sessionStorage.getItem(CHAVE)||'null')}catch(e){}
  return a&&a.token&&a.expira>Date.now()+60000?a:null
}
function esquecer(){try{sessionStorage.removeItem(CHAVE)}catch(e){}}
function conectado(){return !!acesso()}

function chamar(metodo,caminho,token,corpo){
  return fetch(API+caminho,{method:metodo,headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:corpo?JSON.stringify(corpo):undefined})
    .then(function(r){
      if(r.status===401||r.status===403){esquecer();throw {erro:'acesso'}}
      if(!r.ok)throw {erro:'google',status:r.status};
      return r.status===204?null:r.json()
    })
}
function segundos(s,padrao){var n=parseFloat(String(s||''));return isFinite(n)&&n>0?n*1000:padrao}
function esperar(ms){return new Promise(function(ok){setTimeout(ok,ms)})}

/* Abre o seletor e devolve os arquivos escolhidos (File[]). `janela` precisa ser aberta no clique (bloqueio de pop-up). */
function escolher(janela,aviso){
  var a=acesso();aviso=aviso||function(){};
  if(!a){if(janela)janela.close();return Promise.reject({erro:'acesso'})}
  var sessao=null,cancelado=false;
  return chamar('POST','sessions',a.token,{}).then(function(s){
    sessao=s;
    var uri=String(s.pickerUri||'');
    if(!/^https:\/\/photos\.google\.com\//.test(uri))throw {erro:'google'};
    if(janela&&!janela.closed)janela.location.href=uri.replace(/\/?$/,'/autoclose');else window.open(uri,'_blank');
    aviso('escolhendo');
    var intervalo=segundos(s.pollingConfig&&s.pollingConfig.pollInterval,4000),limite=Date.now()+segundos(s.pollingConfig&&s.pollingConfig.timeoutIn,20*60000);
    function sondar(){
      if(Date.now()>limite)throw {erro:'tempo'};
      return esperar(intervalo).then(function(){return chamar('GET','sessions/'+encodeURIComponent(s.id),a.token)}).then(function(x){
        if(x&&x.mediaItemsSet)return x;
        if(janela&&janela.closed&&!cancelado){cancelado=true;intervalo=1500;limite=Math.min(limite,Date.now()+6000)}  /* janela fechada sem concluir: espera um pouco e desiste */
        return sondar()
      })
    }
    return sondar()
  }).then(function(){
    aviso('baixando');
    var itens=[];
    function pagina(tk){
      return chamar('GET','mediaItems?sessionId='+encodeURIComponent(sessao.id)+'&pageSize=100'+(tk?'&pageToken='+encodeURIComponent(tk):''),a.token).then(function(r){
        itens=itens.concat((r&&r.mediaItems)||[]);
        return r&&r.nextPageToken?pagina(r.nextPageToken):itens
      })
    }
    return pagina('')
  }).then(function(itens){
    var fotos=itens.filter(function(i){return i&&i.type!=='VIDEO'&&i.mediaFile&&i.mediaFile.baseUrl});
    var arquivos=[],i=0,falhas=0;
    function proximo(){   /* 3 downloads por vez */
      if(i>=fotos.length)return Promise.resolve();
      var m=fotos[i++].mediaFile,n=i;
      var url=String(m.baseUrl);
      if(!/^https:\/\/[a-z0-9.-]+\.googleusercontent\.com\//.test(url)){falhas++;return proximo()}
      return fetch(url+'=d',{headers:{'Authorization':'Bearer '+a.token}}).then(function(r){
        if(!r.ok)throw 0;return r.blob()
      }).then(function(b){
        var tipo=m.mimeType||b.type||'image/jpeg',nome=String(m.filename||('google-fotos-'+n+'.jpg')).replace(/[\\\/:*?"<>|]/g,'_');
        arquivos[n-1]=new File([b],nome,{type:tipo});aviso('progresso',arquivos.filter(Boolean).length,fotos.length)
      },function(){falhas++}).then(proximo)
    }
    return Promise.all([proximo(),proximo(),proximo()]).then(function(){
      var r=arquivos.filter(Boolean);r.falhas=falhas;r.videos=itens.length-fotos.length;return r
    })
  }).then(function(r){
    if(sessao)chamar('DELETE','sessions/'+encodeURIComponent(sessao.id),a.token).catch(function(){});   /* o Google apaga a seleção; nada fica com ele além do que já era dele */
    return r
  },function(e){
    if(sessao)chamar('DELETE','sessions/'+encodeURIComponent(sessao.id),a.token).catch(function(){});
    if(janela&&!janela.closed)try{janela.close()}catch(x){}
    throw e&&e.erro?e:{erro:'rede'}
  })
}

window.PLGFOTOS={conectado:conectado,escolher:escolher,esquecer:esquecer};
})();
