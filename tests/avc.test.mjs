import test from 'node:test';
import assert from 'node:assert/strict';
import { avcCandidates, validAVCLevels, findAVCConfig, assertWebCodecs } from '../js/avc.js';
import { topDownRGBA, openWorkingEncoder } from '../js/exporter.js';
import { defaultProject } from '../js/presets.js';
import { dimensions, bitrateFor } from '../js/utils.js';
import { validateProject } from '../js/project.js';
const base=defaultProject().output;
const setting=(resolution='uhd',fps=30)=>({...base,resolution,fps});

test('H.264 level accounts for macroblock rounding, frame rate, profile bitrate and portrait',()=>{
  for(const [r,fps,level] of [['1080p',30,40],['1080p',60,42],['dci2k',30,42],['qhd',30,50],['qhd',60,51],['uhd',30,51],['uhd',60,52]]){
    const s=setting(r,fps),[w,h]=dimensions(s);
    assert.equal(validAVCLevels(w,h,fps,bitrateFor(s))[0].id,level,r+'/'+fps);
    assert.equal(validAVCLevels(h,w,fps,bitrateFor(s))[0].id,level,'portrait '+r+'/'+fps);
  }
  assert.equal(validAVCLevels(1920,1080,30,32000000)[0].id,41);
  assert.equal(validAVCLevels(1920,1080,30,24000000,'6400')[0].id,40);
  assert.equal(validAVCLevels(1920,1080,30,24000000,'4d00')[0].id,41);
});
test('every candidate preserves exact selected dimensions, bitrate and FPS',()=>{
  for(const resolution of ['1080p','dci2k','qhd','uhd'])for(const aspect of ['landscape','portrait','square'])for(const fps of [24,30,60]){
    const s={...base,resolution,aspect,fps},[w,h]=dimensions(s),cs=avcCandidates(s);
    assert.ok(cs.length>0);assert.equal(new Set(cs.map(c=>JSON.stringify(c))).size,cs.length);
    for(const c of cs){assert.equal(c.width,w);assert.equal(c.height,h);assert.equal(c.framerate,fps);assert.equal(c.bitrate,bitrateFor(s));assert.equal(c.avc.format,'avc');assert.ok(!('bitrateMode' in c));}
  }
});
test('hardware/software setting is a preference with alternative candidates retained',()=>{
  for(const [key,first] of [['auto','no-preference'],['hardware','prefer-hardware'],['software','prefer-software']]){
    const cs=avcCandidates({...base,encoder:key});assert.equal(cs[0].hardwareAcceleration,first);
    assert.equal(new Set(cs.map(c=>c.hardwareAcceleration)).size,3);
  }
});
test('v1.0 project JSON migrates missing encoder preference without dropping resolution or source',()=>{
 const p=defaultProject();delete p.output.encoder;p.appVersion='1.0.0';p.output.resolution='uhd';
 const q=validateProject(p);assert.equal(q.output.encoder,'auto');assert.equal(q.output.resolution,'uhd');assert.equal(q.layers[0].source,p.layers[0].source);
 p.output.encoder='not-a-mode';assert.equal(validateProject(p).output.encoder,'auto');
});
test('CPU readback flips bottom-up RGBA rows without reversing channels or columns',()=>{
 const pixels=Uint8Array.from({length:24},(_,i)=>i),r={width:2,height:3,pixels:()=>pixels};
 assert.deepEqual([...topDownRGBA(r)],[16,17,18,19,20,21,22,23,8,9,10,11,12,13,14,15,0,1,2,3,4,5,6,7]);
});

function environment(t,{query=()=>true,fail=()=>false,metadata=true}={}) {
 const saved=Object.fromEntries(['VideoEncoder','VideoFrame','isSecureContext'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const frames=[],instances=[],configs=[];
 class Frame {constructor(source,options){this.source=source;this.options=options;this.input=source instanceof Uint8Array?'rgba':'canvas';this.closed=false;frames.push(this);}close(){this.closed=true;}}
 class Encoder {
   static async isConfigSupported(c){return {supported:query(c),config:c};}
   constructor(callbacks){this.callbacks=callbacks;this.state='unconfigured';this.queue=[];instances.push(this);}
   configure(c){this.config=c;configs.push(c);this.state='configured';}
   encode(frame){this.queue.push({input:frame.input,timestamp:frame.options.timestamp});}
   async flush(){
     if(fail(this.config,this.queue[0]?.input))throw new Error('Simulated encoder initialization failure');
     for(const f of this.queue){const chunk={byteLength:4,type:'key',timestamp:f.timestamp,copyTo:a=>a.set([1,2,3,4])};this.callbacks.output(chunk,metadata?{decoderConfig:{description:new Uint8Array([1,100,0,51])}}:{});}this.queue=[];
   }
   close(){this.state='closed';}
 }
 Object.defineProperty(globalThis,'isSecureContext',{value:true,configurable:true});globalThis.VideoEncoder=Encoder;globalThis.VideoFrame=Frame;
 t.after(()=>{for(const [k,v]of Object.entries(saved)){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}});
 return {frames,instances,configs,renderer:{width:3840,height:2160,canvas:{tag:'canvas'},pixels:()=>new Uint8Array(3840*2160*4)}};
}
test('first-frame success buffers one packet and closes the input frame',async t=>{
 const e=environment(t);let committed=0;
 const r=await openWorkingEncoder(e.renderer,setting(),{onChunk:()=>committed++});
 assert.equal(r.packets.length,1);assert.equal(r.packets[0].info.timestamp,0);assert.equal(committed,0);assert.equal(r.input,'canvas');
 assert.equal(e.frames.length,1);assert.equal(e.frames[0].closed,true);r.encoder.close();
});
test('canvas transfer failure retries top-down RGBA at the same 4K configuration',async t=>{
 const e=environment(t,{fail:(_,input)=>input==='canvas'});
 const r=await openWorkingEncoder(e.renderer,setting());assert.equal(r.input,'rgba');assert.equal(r.config.width,3840);assert.equal(r.config.height,2160);
 assert.equal(e.instances[0].state,'closed');assert.ok(e.frames.every(f=>f.closed));assert.equal(r.packets.length,1);r.encoder.close();
});
test('runtime hardware failures reach software-preference candidate without downsizing',async t=>{
 const e=environment(t,{query:c=>c.codec==='avc1.640033',fail:c=>c.hardwareAcceleration!=='prefer-software'});
 const r=await openWorkingEncoder(e.renderer,setting());assert.equal(r.config.hardwareAcceleration,'prefer-software');assert.equal(r.config.width,3840);
 assert.ok(r.diagnostics.some(x=>x.stage==='encode-first-frame'&&x.success===false));assert.ok(e.frames.every(f=>f.closed));r.encoder.close();
});
test('stale cached 1080p configuration is skipped when exporting UHD',async t=>{
 const e=environment(t);const old=avcCandidates(setting('1080p'))[0];const r=await openWorkingEncoder(e.renderer,setting(),{config:old});
 assert.equal(r.config.width,3840);assert.ok(e.configs.every(c=>c.width===3840));r.encoder.close();
});
test('unsupported encoders fail explicitly with diagnostics and no false MP4 success',async t=>{
 environment(t,{query:()=>false});const diagnostics=[];
 await assert.rejects(findAVCConfig(setting(),{diagnostics}),e=>e.name==='EncoderUnavailableError'&&e.diagnostics.length>0&&e.message.includes('3840'));
});
test('a trial lacking AVC decoder configuration cannot be committed to an MP4',async t=>{
 const e=environment(t,{query:c=>c.codec==='avc1.640033'&&c.hardwareAcceleration==='no-preference',metadata:false});
 await assert.rejects(openWorkingEncoder(e.renderer,setting()),/인코더를 찾지/);assert.ok(e.instances.every(x=>x.state==='closed'));
});
test('abort interrupts negotiation and closes failed encoder attempts',async t=>{
 const e=environment(t);const abort=new AbortController();abort.abort();
 await assert.rejects(openWorkingEncoder(e.renderer,setting(),{signal:abort.signal}),{name:'AbortError'});assert.equal(e.frames.length,0);
});
test('insecure origins are rejected before native encoder use',t=>{
 environment(t);Object.defineProperty(globalThis,'isSecureContext',{value:false,configurable:true});assert.throws(assertWebCodecs,/HTTPS/);
});
