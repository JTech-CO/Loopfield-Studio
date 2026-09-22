import { Renderer } from './renderer.js';
import { MP4Muxer } from './mp4.js';
import { dimensions, bitrateFor, frameTiming, abortIfNeeded, sleep } from './utils.js';

/** Query actual resolution and frame rate; never claim a resolution was encoded after downscaling. */
export async function findAVCConfig(settings) {
  if(!globalThis.isSecureContext)throw new Error('MP4 출력은 HTTPS 또는 localhost에서 열어야 합니다. GitHub Pages의 HTTPS 주소를 사용하세요.');
  if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined')throw new Error('이 브라우저에는 WebCodecs VideoEncoder가 없습니다. 최신 데스크톱 Chrome 또는 Edge에서 다시 시도하세요.');
  const [width,height]=dimensions(settings),bitrate=bitrateFor(settings);
  const area=width*height;
  const level=area>1920*1080?(settings.fps>30?'34':'33'):(settings.fps>30?'2a':'28');
  const levels=[...new Set([level,'34'])];
  // hardwareAcceleration is only a preference; WebCodecs does not expose which device was selected.
  for(const hardwareAcceleration of ['prefer-hardware','no-preference']){
    for(const profile of ['6400','4d00','4200'])for(const lv of levels){
      const config={codec:`avc1.${profile}${lv}`,width,height,bitrate,framerate:settings.fps,
        latencyMode:'realtime',bitrateMode:'variable',hardwareAcceleration,avc:{format:'avc'}};
      try{const result=await VideoEncoder.isConfigSupported(config);if(result.supported)return config;}catch{/* Try the next advertised profile. */}
    }
  }
  throw new Error(`${width} × ${height}, ${settings.fps}fps의 H.264 인코더를 찾지 못했습니다. 해상도/FPS를 낮추거나 다른 기기에서 시도하세요. WebM을 MP4로 이름만 바꾸지 않습니다.`);
}
function timed(promise,ms,label) {
  let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label)),ms);})]).finally(()=>clearTimeout(timer));
}
export async function exportVideo(project,{signal,writable=null,config=null,onProgress=()=>{}}={}) {
  let renderer,encoder,muxer,wakeLock,cancelHandler;
  let fatal=null,writeChain=Promise.resolve(),done=false;
  const captureError=e=>{if(!fatal)fatal=e instanceof Error?e:new Error(String(e));};
  try{
    abortIfNeeded(signal);
    config=config||await findAVCConfig(project.output);
    abortIfNeeded(signal);
    const [width,height]=dimensions(project.output),fps=project.output.fps,total=project.output.duration*fps;
    const canvas=document.createElement('canvas');renderer=new Renderer(canvas,{onLost:()=>captureError(new Error('출력 중 GPU 컨텍스트가 손실되었습니다.'))});
    renderer.sync(project);renderer.resize(width,height);
    muxer=new MP4Muxer({width,height,fps,frames:total,writable});await muxer.start();
    encoder=new VideoEncoder({
      output(chunk,metadata){
        // copyTo is synchronous: release the browser's transient chunk storage immediately.
        const data=new Uint8Array(chunk.byteLength);chunk.copyTo(data);
        const info={timestamp:chunk.timestamp,key:chunk.type==='key'};
        writeChain=writeChain.then(()=>muxer.addRaw(data,info,metadata)).catch(captureError);
      },error:captureError
    });
    encoder.configure(config);
    cancelHandler=()=>{if(encoder.state!=='closed')encoder.close();};
    signal?.addEventListener('abort',cancelHandler,{once:true});
    try{wakeLock=await navigator.wakeLock?.request('screen');}catch{/* A wake lock is optional. */}
    const started=performance.now();
    for(let i=0;i<total;i++){
      abortIfNeeded(signal);if(fatal)throw fatal;
      // A frame's phase comes only from its index, never performance.now() or requestAnimationFrame.
      renderer.render(project,i/total,{frame:i});
      let frame;
      try{frame=new VideoFrame(canvas,{...frameTiming(i,fps),alpha:'discard'});encoder.encode(frame,{keyFrame:i%Math.max(1,Math.round(fps*2))===0});}
      finally{frame?.close();}
      // A first-frame flush exercises the *actual* encoder, not only isConfigSupported().
      // Subsequent small batches bound the number of in-flight GPU/video frames and disk writes.
      if(i===0||(i+1)%8===0||i===total-1){
        await timed(encoder.flush(),90000,'인코더가 응답하지 않습니다. 해상도/FPS를 낮추고 다시 시도하세요.');
        await writeChain;if(fatal)throw fatal;
        onProgress({stage:i===total-1?'finalize':'render',frame:i+1,total,percent:(i+1)/total,elapsed:(performance.now()-started)/1000,bytes:muxer.payloadSize,codec:config.codec});
      }
      // Yield to cancel/progress UI without tying offline frame timing to browser paint timing.
      await sleep(0);
    }
    abortIfNeeded(signal);if(fatal)throw fatal;
    await writeChain;
    const result=await muxer.finalize();done=true;
    return {...result,codec:config.codec,bitrate:config.bitrate,elapsed:(performance.now()-started)/1000};
  }catch(e){
    if(signal?.aborted)throw new DOMException('렌더링을 취소했습니다.','AbortError');
    if(e.name==='AbortError')throw e;
    throw new Error(`MP4 출력을 완료하지 못했습니다. ${e.message||e}`);
  }finally{
    if(cancelHandler)signal?.removeEventListener('abort',cancelHandler);
    if(encoder&&encoder.state!=='closed')encoder.close();
    await writeChain.catch(()=>{});
    if(!done){if(muxer)await muxer.abort();else if(writable)try{await writable.abort();}catch{}}
    renderer?.dispose();try{await wakeLock?.release();}catch{}
  }
}
export async function renderPNG(project,phase=0) {
  const canvas=document.createElement('canvas');let renderer;
  try{
    renderer=new Renderer(canvas);renderer.sync(project);renderer.resize(...dimensions(project.output));
    const total=project.output.fps*project.output.duration;
    renderer.render(project,phase,{frame:Math.floor(phase*total)});
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG 생성에 실패했습니다.')),'image/png'));
    return blob;
  }finally{renderer?.dispose();}
}
