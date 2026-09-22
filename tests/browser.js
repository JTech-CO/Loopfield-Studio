import { PRESETS, defaultProject, createLayer } from '../js/presets.js';
import { Renderer, inspectLoop } from '../js/renderer.js';
import { exportVideo } from '../js/exporter.js';
import { clone, dimensions, endpointMetrics, downloadBlob } from '../js/utils.js';
const $=s=>document.querySelector(s),entries=[];
let busy=false,controller=null,result=null,url=null;
function log(name,pass,detail={}){entries.push({time:new Date().toISOString(),name,pass,detail});$('#log').textContent=entries.map(e=>`${e.pass?'PASS':'FAIL'} ${e.name}\n${JSON.stringify(e.detail)}`).join('\n\n');}
function lock(value){busy=value;$('#testGraphics').disabled=value;$('#testVideo').disabled=value;$('#resolution').disabled=value;$('#cancel').disabled=!value;}
function assert(value,message){if(!value)throw new Error(message);}
function renderer(){return new Renderer(document.createElement('canvas'));}
$('#testGraphics').addEventListener('click',async()=>{
 if(busy)return;lock(true);let r;
 try{
  r=renderer();r.resize(320,180);
  for(const preset of PRESETS){const p=defaultProject();p.layers=[createLayer(preset.id)];r.sync(p);const report=inspectLoop(r,p);assert(report.match,'시작/끝 샘플 불일치');r.render(p,.16);const pixels=r.pixels();assert(pixels.some((v,i)=>i%4!==3&&v>20),'비어 있는 결과');log(preset.name,true,report);await new Promise(resolve=>setTimeout(resolve,0));}
  let p=defaultProject();p.layers=['prism','orbital','kaleido','interference'].map((id,i)=>({...createLayer(id),blend:i?'screen':'normal',opacity:i?.2:1}));r.sync(p);r.render(p,.2);assert(!r.gl.getError(),'WebGL 오류');log('4레이어 합성',true);
  const before=r.pixels(),bad=clone(p);bad.layers[0].source='vec3 pattern(vec2 p){ERROR;}';let rejected=false;try{r.sync(bad);}catch{rejected=true;}assert(rejected,'잘못된 셰이더가 적용됨');r.render(p,.2);assert(endpointMetrics(before,r.pixels()).mae===0,'컴파일 실패 후 기존 화면 변경');log('트랜잭션 컴파일 복구',true);
  p=defaultProject();p.layers[0].source='vec3 pattern(vec2 p){if(uLoop>.25)discard;return vec3(1,0,0);}';r.sync(p);r.render(p,0);r.render(p,.5);const afterDiscard=r.pixels();
  let fresh;try{fresh=renderer();fresh.resize(320,180);fresh.sync(p);fresh.render(p,.5);assert(endpointMetrics(afterDiscard,fresh.pixels()).mae===0,'discard가 이전 프레임 잔상을 남김');}finally{fresh?.dispose();}log('discard 렌더의 프레임 독립성',true);
  p.layers[0].source='vec3 pattern(vec2 p){return vec3(uLoop,0,0);}';r.sync(p);assert(!inspectLoop(r,p).match,'불연속 코드가 잘못 통과함');log('불연속 루프 감지',true);
 }catch(e){log('그래픽 테스트 중단',false,{message:e.message});}finally{r?.dispose();lock(false);}
});
function waitVideo(video){return new Promise((resolve,reject)=>{
 let timer;const cleanup=()=>{clearTimeout(timer);video.removeEventListener('loadeddata',ready);video.removeEventListener('error',error);};
 const ready=()=>{cleanup();resolve();},error=()=>{cleanup();reject(new Error(video.error?.message||'MP4 디코딩 실패'));};
 video.addEventListener('loadeddata',ready,{once:true});video.addEventListener('error',error,{once:true});timer=setTimeout(()=>{cleanup();reject(new Error('MP4 재생 확인 시간 초과'));},20000);
});}
$('#testVideo').addEventListener('click',async()=>{
 if(busy)return;lock(true);controller=new AbortController();$('#saveVideo').hidden=true;$('#progress').value=0;
 try{
  const p=defaultProject();p.output={...p.output,resolution:$('#resolution').value,duration:2,fps:30,direct:false};
  result=await exportVideo(p,{signal:controller.signal,onProgress:v=>$('#progress').value=v.percent});
  assert(result.frames===60,'프레임 수가 다름');assert(result.blob?.type==='video/mp4','MP4 Blob 아님');
  if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(result.blob);const video=$('#video');video.hidden=false;
  const loaded=waitVideo(video);video.src=url;video.load();await loaded;
  const [w,h]=dimensions(p.output);assert(video.videoWidth===w&&video.videoHeight===h,'재생 해상도 불일치');assert(Math.abs(video.duration-2)<.05,'재생 길이 불일치');
  log('네이티브 WebCodecs → MP4 → 브라우저 디코딩',true,{width:w,height:h,frames:result.frames,fps:30,duration:video.duration,codec:result.codec,bytes:result.bytes,elapsed:result.elapsed,userAgent:navigator.userAgent});$('#saveVideo').hidden=false;
 }catch(e){log('네이티브 MP4',false,{message:e.message,secureContext:isSecureContext,VideoEncoder:typeof VideoEncoder});}finally{controller=null;lock(false);}
});
$('#cancel').addEventListener('click',()=>controller?.abort());
$('#saveVideo').addEventListener('click',()=>{if(result?.blob)downloadBlob(result.blob,`Loopfield-device-test-${result.width}x${result.height}.mp4`);});
$('#saveReport').addEventListener('click',()=>downloadBlob(new Blob([JSON.stringify({app:'Loopfield 1.0.0',userAgent:navigator.userAgent,secureContext:isSecureContext,entries},null,2)],{type:'application/json'}),'Loopfield-device-test.json'));
