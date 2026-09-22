import { Renderer } from './renderer.js';
import { MP4Muxer } from './mp4.js';
import { dimensions, bitrateFor, frameTiming, abortIfNeeded, sleep } from './utils.js';
import { supportedAVCConfigs, encoderError } from './avc.js';
export { findAVCConfig } from './avc.js';

function timed(promise,ms,label,signal) {
  let timer,handler;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label)),ms);});
  const aborted=new Promise((_,reject)=>{
    handler=()=>reject(new DOMException('렌더링을 취소했습니다.','AbortError'));
    if(signal?.aborted)handler();else signal?.addEventListener('abort',handler,{once:true});
  });
  return Promise.race([promise,timeout,aborted]).finally(()=>{clearTimeout(timer);signal?.removeEventListener('abort',handler);});
}
/** Flip readPixels' bottom-up rows for VideoFrame's top-down RGBA layout. */
export function topDownRGBA(renderer) {
  const pixels=renderer.pixels(),stride=renderer.width*4,half=Math.floor(renderer.height/2),row=new Uint8Array(stride);
  for(let y=0;y<half;y++) {
    const a=y*stride,b=(renderer.height-1-y)*stride;
    row.set(pixels.subarray(a,a+stride));pixels.copyWithin(a,b,b+stride);pixels.set(row,b);
  }
  return pixels;
}
function videoFrame(renderer,index,fps,input) {
  const timing={...frameTiming(index,fps),alpha:'discard'};
  if(input==='canvas')return new VideoFrame(renderer.canvas,timing);
  return new VideoFrame(topDownRGBA(renderer),{...timing,format:'RGBA',codedWidth:renderer.width,codedHeight:renderer.height,
    displayWidth:renderer.width,displayHeight:renderer.height});
}

/** A real first-frame encode, not merely isConfigSupported(). Nothing is written
 * to the MP4 until a candidate has encoded and flushed successfully.
 * Each failed attempt gets a new encoder; dimensions, fps and bitrate are invariant.
 */
export async function openWorkingEncoder(renderer,settings,{signal,onChunk=()=>{},onError=()=>{},onAttempt=()=>{},config:preferred=null,diagnostics=[]}={}) {
  const seen=new Set();
  async function* candidates() {
    if(preferred)yield preferred;
    yield* supportedAVCConfigs(settings,{signal,diagnostics});
  }
  for await(const config of candidates()) {
    const key=JSON.stringify(config);if(seen.has(key))continue;seen.add(key);
    const [w,h]=dimensions(settings);
    // A cached/query result from a different setting must never downscale the output.
    if(config.width!==w||config.height!==h||config.framerate!==settings.fps||config.bitrate!==bitrateFor(settings))continue;
    for(const input of ['canvas','rgba']) {
      abortIfNeeded(signal);let encoder,frame,error=null,committed=false;const packets=[];
      const entry={stage:'encode-first-frame',codec:config.codec,preference:config.hardwareAcceleration,input,width:w,height:h,fps:settings.fps};
      diagnostics.push(entry);onAttempt({...entry,attempt:diagnostics.filter(d=>d.stage==='encode-first-frame').length});
      try {
        encoder=new VideoEncoder({
          output(chunk,metadata) {
            const data=new Uint8Array(chunk.byteLength);chunk.copyTo(data);
            const packet={data,info:{timestamp:chunk.timestamp,key:chunk.type==='key'},metadata};
            if(committed)onChunk(packet);else packets.push(packet);
          },error(e) { error=e; if(committed)onError(e); }
        });
        encoder.configure(config);
        frame=videoFrame(renderer,0,settings.fps,input);encoder.encode(frame,{keyFrame:true});frame.close();frame=null;
        await timed(encoder.flush(),18000,'첫 프레임 인코더 응답 시간 초과',signal);
        if(error)throw error;if(!packets.length)throw new Error('첫 프레임 압축 데이터가 없습니다.');
        if(!packets.some(p=>p.metadata?.decoderConfig?.description))throw new Error('MP4에 필요한 AVC 설정 정보가 없습니다.');
        if(encoder.state!=='configured')throw new Error('인코더가 첫 프레임 이후 닫혔습니다.');
        entry.success=true;committed=true;
        return {encoder,config,input,packets,diagnostics};
      } catch(e) {
        frame?.close();if(encoder&&encoder.state!=='closed')encoder.close();
        entry.success=false;entry.error=e.message||String(e);abortIfNeeded(signal);
        await sleep(0);
      }
    }
  }
  throw encoderError(settings,diagnostics);
}
export async function testEncoder(project,{signal,onAttempt=()=>{}}={}) {
  let renderer,working;const diagnostics=[];
  try {
    renderer=new Renderer(document.createElement('canvas'));renderer.sync(project);renderer.resize(...dimensions(project.output));
    renderer.render(project,0,{frame:0});
    working=await openWorkingEncoder(renderer,project.output,{signal,onAttempt,diagnostics});
    return {config:working.config,input:working.input,diagnostics,verified:true};
  } catch(error) { if(!error.diagnostics)error.diagnostics=diagnostics;throw error; }
  finally { if(working?.encoder.state!=='closed')working?.encoder.close();renderer?.dispose(); }
}
export async function exportVideo(project,{signal,writable=null,config=null,onProgress=()=>{}}={}) {
  let renderer,encoder,muxer,wakeLock,cancelHandler;
  let fatal=null,writeChain=Promise.resolve(),done=false;const diagnostics=[];
  const captureError=e=>{if(!fatal)fatal=e instanceof Error?e:new Error(String(e));};
  try {
    abortIfNeeded(signal);
    const [width,height]=dimensions(project.output),fps=project.output.fps,total=project.output.duration*fps;
    const canvas=document.createElement('canvas');renderer=new Renderer(canvas,{onLost:()=>captureError(new Error('출력 중 GPU 컨텍스트가 손실되었습니다.'))});
    renderer.sync(project);renderer.resize(width,height);renderer.render(project,0,{frame:0});
    const started=performance.now();
    const packet=p=>{writeChain=writeChain.then(()=>muxer.addRaw(p.data,p.info,p.metadata)).catch(captureError);};
    const working=await openWorkingEncoder(renderer,project.output,{signal,config,diagnostics,onChunk:packet,onError:captureError,onAttempt:a=>{
      onProgress({stage:'probe',frame:0,total,percent:0,elapsed:(performance.now()-started)/1000,bytes:0,codec:a.codec,
        message:`실제 첫 프레임 검사 ${a.attempt} · ${a.preference} · ${a.input==='canvas'?'캔버스':'CPU RGBA'}`});
    }});
    encoder=working.encoder;config=working.config;
    abortIfNeeded(signal);
    muxer=new MP4Muxer({width,height,fps,frames:total,writable});await muxer.start();
    for(const p of working.packets)packet(p);await writeChain;if(fatal)throw fatal;
    cancelHandler=()=>{if(encoder.state!=='closed')encoder.close();};signal?.addEventListener('abort',cancelHandler,{once:true});
    try { wakeLock=await navigator.wakeLock?.request('screen'); } catch {}
    const progress=frame=>onProgress({stage:frame===total?'finalize':'render',frame,total,percent:frame/total,
      elapsed:(performance.now()-started)/1000,bytes:muxer.payloadSize,codec:config.codec,input:working.input});
    progress(1);
    // Frame zero is already encoded during negotiation. Do not duplicate it.
    for(let i=1;i<total;i++) {
      abortIfNeeded(signal);if(fatal)throw fatal;
      renderer.render(project,i/total,{frame:i});let frame;
      try { frame=videoFrame(renderer,i,fps,working.input);encoder.encode(frame,{keyFrame:i%Math.max(1,Math.round(fps*2))===0}); }
      finally { frame?.close(); }
      if((i+1)%4===0||i===total-1) {
        await timed(encoder.flush(),90000,'인코더가 응답하지 않습니다. 진단을 저장하고 다른 인코더 설정을 시도하세요.',signal);
        await writeChain;if(fatal)throw fatal;progress(i+1);
      }
      await sleep(0);
    }
    abortIfNeeded(signal);if(fatal)throw fatal;await writeChain;
    const result=await muxer.finalize();done=true;
    return {...result,codec:config.codec,bitrate:config.bitrate,input:working.input,preference:config.hardwareAcceleration,
      diagnostics,elapsed:(performance.now()-started)/1000};
  } catch(e) {
    if(signal?.aborted)throw new DOMException('렌더링을 취소했습니다.','AbortError');
    if(e.name==='AbortError')throw e;
    const error=new Error(`MP4 출력을 완료하지 못했습니다. ${e.message||e}`);error.diagnostics=e.diagnostics||diagnostics;throw error;
  } finally {
    if(cancelHandler)signal?.removeEventListener('abort',cancelHandler);
    if(encoder&&encoder.state!=='closed')encoder.close();await writeChain.catch(()=>{});
    if(!done){if(muxer)await muxer.abort();else if(writable)try{await writable.abort();}catch{}}
    renderer?.dispose();try{await wakeLock?.release();}catch{}
  }
}
export async function renderPNG(project,phase=0) {
  const canvas=document.createElement('canvas');let renderer;
  try {
    renderer=new Renderer(canvas);renderer.sync(project);renderer.resize(...dimensions(project.output));
    const total=project.output.fps*project.output.duration;renderer.render(project,phase,{frame:Math.floor(phase*total)});
    return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG 생성에 실패했습니다.')),'image/png'));
  } finally {renderer?.dispose();}
}
