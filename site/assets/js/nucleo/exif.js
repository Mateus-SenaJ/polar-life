/* EXIF mínimo: só data, orientação e presença de GPS (BR-06, T4). */
(function(){
function ler(file){return new Promise(function(ok){
  if(!file||!file.slice){ok({});return}
  var r=new FileReader();
  r.onload=function(){try{ok(parse(new Uint8Array(r.result)))}catch(e){ok({})}};
  r.onerror=function(){ok({})};r.readAsArrayBuffer(file.slice(0,256*1024));
})}
function parse(a){
  if(a[0]!==255||a[1]!==216)return{};var p=2,app=null;
  while(p+4<=a.length){if(a[p]!==255)break;var m=a[p+1],n=(a[p+2]<<8)+a[p+3];if(m===225&&n>=8&&a[p+4]===69&&a[p+5]===120&&a[p+6]===105&&a[p+7]===102&&a[p+8]===0&&a[p+9]===0){app=p+10;break}p+=2+n}
  if(app===null||app+8>a.length)return{};var le=a[app]===73&&a[app+1]===73,be=a[app]===77&&a[app+1]===77;if(!le&&!be)return{};
  function u16(o){return le?a[o]|a[o+1]<<8:a[o]<<8|a[o+1]}
  function u32(o){return le?(a[o]|a[o+1]<<8|a[o+2]<<16|a[o+3]<<24)>>>0:((a[o]<<24|a[o+1]<<16|a[o+2]<<8|a[o+3])>>>0)}
  function ifd(o){var n=u16(o),z={},i;for(i=0;i<n;i++){var x=o+2+i*12;if(x+12>a.length)break;z[u16(x)]={tipo:u16(x+2),n:u32(x+4),v:x+8,off:u32(x+8)}}return z}
  if(u16(app+2)!==42)return{};var z=ifd(app+u32(app+4)),out={};
  if(z[0x0112]){var q=z[0x0112],v=q.tipo===3&&q.n===1?u16(q.v):0;if(v>=1&&v<=8)out.orientacao=v}
  if(z[0x8825]&&z[0x8825].off)out.temGps=true;
  if(z[0x8769]&&z[0x8769].off){var e=ifd(app+z[0x8769].off)[0x9003];if(e&&e.n>=19){var at=app+e.off,s='',j;for(j=0;j<19&&at+j<a.length;j++)s+=String.fromCharCode(a[at+j]);var m=s.match(/^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)$/);if(m)out.iso=m[1]+'-'+m[2]+'-'+m[3]+'T'+m[4]+':'+m[5]+':'+m[6]}}
  return out
}
window.PLEXIF={ler:ler};
})();
