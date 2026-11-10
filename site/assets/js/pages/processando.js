/* T-04 · processando · comportamento da página */
(function(){
var $=function(i){return document.getElementById(i)};
var tm;function toast(m){clearTimeout(tm);$('toast-t').textContent=m;$('toast').hidden=false;tm=setTimeout(function(){$('toast').hidden=true},4000)}

/* Dados de exemplo (DOC-04 §6: 24 fotos). Nomes neutros. */
var N=24,HEIC={5:1,7:1,12:1,13:1,18:1,22:1};
var FILES=[];
for(var k=1;k<=N;k++){FILES.push({n:'foto-'+(k<10?'0':'')+k+(HEIC[k]?'.heic':'.jpg'),heic:!!HEIC[k],st:'wait'})}
/* Erros previstos (DOC-04 FL-02): memória e arquivo inválido */
var FAIL={7:{why:'O aparelho ficou sem memória para converter esta foto. Feche outras abas e tente de novo.',retry:'ok'},19:{why:'O arquivo está danificado ou não é uma foto aceita.',retry:'fail'}};

var hash=location.hash,cur=-1,timer=null,finished=false;
var ICON={
 ok:'<svg class="ico okc" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
 wait:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
 fail:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};
function pad(n){return n}
function counts(){var ok=0,fail=0,done=0;FILES.forEach(function(f){if(f.st==='ok'){ok++;done++}else if(f.st==='fail'){fail++;done++}});return{ok:ok,fail:fail,done:done}}
function plural(n,s,p){return n+' '+(n===1?s:p)}

function drawFiles(){
  $('files').innerHTML=FILES.map(function(f,i){
    var s;
    if(f.st==='ok')s=ICON.ok+'Pronta'+(f.heic?' <span class="tag rotulo">Convertida</span>':'');
    else if(f.st==='fail')s=ICON.fail+'Não suportada';
    else if(f.st==='work')s=ICON.wait+(f.heic?'Convertendo…':'Lendo…');
    else s=ICON.wait+'Aguardando';
    return '<li><span class="nm">'+f.n+'</span><span class="st">'+s+'</span></li>';
  }).join('');
}
function setProg(p){var el=$('prog');el.style.setProperty('--value',p);el.setAttribute('aria-valuenow',p)}

function paint(){
  var c=counts();
  var pct=Math.round(c.done/N*100);setProg(pct);
  drawFiles();
  $('det-t').textContent='Ver todos os arquivos ('+N+')';
  if(!finished){
    var shown=Math.min(cur+1,N);
    $('lbl').textContent='Convertendo '+shown+' de '+N;
    $('pct').textContent=pct+'% concluído';
    $('prog').setAttribute('aria-valuetext','Convertendo '+shown+' de '+N);
  }else{
    $('lbl').textContent='Concluído · '+c.ok+' de '+N+' fotos preparadas';
    $('pct').textContent='';
    $('prog').setAttribute('aria-valuetext','Concluído');
  }
  /* erros por arquivo (MT-05): lista «não suportadas» com «Tentar de novo» */
  var failed=FILES.map(function(f,i){return{f:f,i:i}}).filter(function(x){return x.f.st==='fail'});
  var eb=$('errbox');
  if(failed.length){
    eb.hidden=false;
    var nums=failed.map(function(x){return x.i+1});
    var lista=nums.length===1?'A foto '+nums[0]:'As fotos '+nums.slice(0,-1).join(', ')+' e '+nums[nums.length-1];
    $('err-t').textContent=failed.length===1?'Não foi possível ler 1 foto':'Não foi possível ler '+failed.length+' fotos';
    $('err-d').textContent=lista+(failed.length===1?' está danificada ou ficou indisponível.':' estão danificadas ou ficaram indisponíveis.')+(finished?' '+(c.ok===1?'A outra':'As outras '+c.ok)+' '+(c.ok===1?'segue pronta.':'seguem prontas.'):'');
    $('fail').innerHTML=failed.map(function(x){
      return '<li><div><span class="nm">'+x.f.n+'</span><p class="why">'+x.f.why+'</p></div><div class="fail__act"><button type="button" class="btn2" data-a="retry" data-i=\"'+x.i+'\">Tentar de novo</button><button type="button" class="btn2" data-a="swap" data-i=\"'+x.i+'\">Trocar foto</button></div></li>';
    }).join('');
    /* erro = role alert (DOC-04 §5); só depois de terminar, para não repetir a cada arquivo */
    if(finished)eb.setAttribute('role','alert');else eb.removeAttribute('role');
  }else{eb.hidden=true}
  /* sucesso (§5) */
  var dn=$('done');
  if(finished&&c.ok>0&&!failed.length){dn.hidden=false;$('done-t').innerHTML='<strong>Concluído</strong> · '+plural(c.ok,'foto pronta','fotos prontas')}
  else dn.hidden=true;
  /* botão principal */
  var go=$('go');
  if(finished&&c.ok>0){go.removeAttribute('aria-busy');go.disabled=false;$('go-t').innerHTML='Continuar com '+plural(c.ok,'foto','fotos')+'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'}
  else if(finished){go.removeAttribute('aria-busy');go.disabled=true;$('go-t').textContent='Continuar'}
  else{go.setAttribute('aria-busy','true');go.disabled=true;$('go-t').textContent='Preparando…'}
}

function say(t){$('live').textContent=t}
function finish(){
  finished=true;clearInterval(timer);
  paint();
  var c=counts();
  say(c.fail?('Concluído. '+plural(c.ok,'foto pronta','fotos prontas')+' e '+plural(c.fail,'arquivo com erro','arquivos com erro')+'.'):('Concluído. '+plural(c.ok,'foto pronta','fotos prontas')+'.'));
}
function step(){
  if(cur>=0){
    var f=FILES[cur],num=cur+1;
    if(FAIL[num]&&hash!=='#concluido'){f.st='fail';f.why=FAIL[num].why}else f.st='ok';
  }
  cur++;
  if(cur>=N){finish();return}
  FILES[cur].st='work';
  paint();
  var pc=Math.round(counts().done/N*100);
  if(pc>=25&&pc<30)say('25% concluído');if(pc>=50&&pc<55)say('50% concluído');if(pc>=75&&pc<80)say('75% concluído');
}
function jump(n){ /* estados de revisão */
  for(var i=0;i<n;i++){FILES[i].st=(FAIL[i+1]&&hash!=='#concluido')?'fail':'ok';if(FILES[i].st==='fail')FILES[i].why=FAIL[i+1].why}
  cur=n;FILES[n].st='work';
}
if(hash==='#processando'){jump(2);paint()}   /* parado em «Convertendo 3 de 24» */
else if(hash==='#concluido'||hash==='#erro'){
  for(var i=0;i<N;i++){var ff=FILES[i];if(FAIL[i+1]&&hash==='#erro'){ff.st='fail';ff.why=FAIL[i+1].why}else ff.st='ok'}
  cur=N;finish();
}else{paint();timer=setInterval(step,320);step()}

/* Tentar de novo e Trocar foto, por arquivo */
var swapIdx=-1,swapBtn=null;
var OKEXT=/\.(jpe?g|png|webp|heic|heif)$/i,OKMIME=/^image\/(jpeg|png|webp|heic|heif)$/i;
$('fail').addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;
  var i=Number(b.dataset.i),f=FILES[i],num=i+1;
  if(b.dataset.a==='swap'){swapIdx=i;swapBtn=b;$('swap').value='';$('swap').click();return}
  b.disabled=true;b.textContent='Tentando…';
  setTimeout(function(){
    if(FAIL[num]&&FAIL[num].retry==='ok'){f.st='ok';delete f.why;say(f.n+' preparada.');paint();var nb=$('fail').querySelector('button');(nb||$('go')).focus()}
    else{b.disabled=false;b.textContent='Tentar de novo';toast('Ainda não foi possível ler este arquivo.')}
  },900);
});
$('swap').addEventListener('change',function(){
  var file=this.files&&this.files[0],i=swapIdx;
  if(!file||i<0)return;
  if(!(OKMIME.test(file.type)||OKEXT.test(file.name))){toast('«'+file.name+'» não é uma foto. Escolha JPEG, PNG, WebP ou HEIC.');if(swapBtn)swapBtn.focus();return}
  var f=FILES[i],heic=/\.(heic|heif)$/i.test(file.name)||/heic|heif/i.test(file.type);
  f.n=file.name;f.heic=heic;f.st='ok';delete f.why;
  say('Foto '+(i+1)+' trocada por '+file.name+'.');paint();
  var nb=$('fail').querySelector('button');(nb||$('go')).focus();
});
$('go').addEventListener('click',function(){if(this.disabled)return;location.href='../resumo/'});
$('cancel').addEventListener('click',function(){clearInterval(timer)});
window.addEventListener('hashchange',function(){location.reload()});
})();
