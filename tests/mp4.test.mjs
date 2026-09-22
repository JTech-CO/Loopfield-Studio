import test from 'node:test';
import assert from 'node:assert/strict';
import { MP4Muxer } from '../js/mp4.js';
import { frameTiming } from '../js/utils.js';
const config={decoderConfig:{description:new Uint8Array([1,100,0,40,255,225,0,0])}};
// Structural fixtures only; tests/validate_media.py separately checks real AVC decoding.
const payload=new Uint8Array([0,0,0,2,0x65,0x88]);
function boxes(data,start=0,end=data.length){let pos=start,out=[];while(pos+8<=end){const d=new DataView(data.buffer,data.byteOffset+pos),short=d.getUint32(0),type=new TextDecoder().decode(data.slice(pos+4,pos+8));const size=short===1?Number(d.getBigUint64(8)):short;assert.ok(size>=8&&pos+size<=end);out.push({type,size,pos});pos+=size;}assert.equal(pos,end);return out;}
class MemorySink{
 constructor(){this.data=new Uint8Array(0);this.position=0;this.closed=false;this.aborted=false;}
 async write(raw){const command=raw.type==='write',data=command?raw.data:raw,position=command?raw.position:this.position;const next=new Uint8Array(Math.max(this.data.length,position+data.length));next.set(this.data);next.set(data,position);this.data=next;this.position=position+data.length;}
 async close(){this.closed=true;}async abort(){this.aborted=true;}
}
async function fill(m,order=[0,1,2]){await m.start();for(let i=0;i<order.length;i++)await m.addRaw(payload,{timestamp:frameTiming(order[i],30).timestamp,key:i===0},i===0?config:{});}
test('fast-start memory MP4 has correct top-level size, mime and order',async()=>{
 const m=new MP4Muxer({width:1920,height:1080,fps:30,frames:3});await fill(m);const r=await m.finalize(),a=new Uint8Array(await r.blob.arrayBuffer());assert.equal(r.blob.type,'video/mp4');assert.deepEqual(boxes(a).map(b=>b.type),['ftyp','moov','mdat']);assert.equal(r.bytes,a.length);assert.equal(r.frames,3);
});
test('direct writable layout patches 64-bit mdat and closes only after completion',async()=>{
 const sink=new MemorySink(),m=new MP4Muxer({width:3840,height:2160,fps:30,frames:3,writable:sink});await fill(m);assert.equal(sink.closed,false);const r=await m.finalize();assert.equal(r.blob,null);assert.equal(sink.closed,true);assert.deepEqual(boxes(sink.data).map(b=>b.type),['ftyp','mdat','moov']);assert.equal(boxes(sink.data)[1].size,16+3*payload.length);assert.equal(r.bytes,sink.data.length);
});
test('B-frame presentation reordering writes signed ctts',async()=>{
 const m=new MP4Muxer({width:320,height:180,fps:30,frames:3});await fill(m,[0,2,1]);const r=await m.finalize(),b=new Uint8Array(await r.blob.arrayBuffer());const s=new TextDecoder('latin1').decode(b),i=s.indexOf('ctts');assert.ok(i>0);assert.equal(b[i+4],1);
});
test('missing / duplicate frames, absent avcC and non-key start are errors',async()=>{
 let m=new MP4Muxer({width:320,height:180,fps:30,frames:3});await fill(m,[0,1]);await assert.rejects(m.finalize());
 m=new MP4Muxer({width:320,height:180,fps:30,frames:3});await fill(m,[0,1,1]);await assert.rejects(m.finalize());
 m=new MP4Muxer({width:320,height:180,fps:30,frames:1});await m.start();await m.addRaw(payload,{timestamp:0,key:true});await assert.rejects(m.finalize());
 m=new MP4Muxer({width:320,height:180,fps:30,frames:1});await m.start();await assert.rejects(m.addRaw(payload,{timestamp:0,key:false},config));
});
test('capacity, timebase drift and changing AVC config fail explicitly',async()=>{
 let m=new MP4Muxer({width:320,height:180,fps:30,frames:1,memoryLimit:2});await m.start();await assert.rejects(m.addRaw(payload,{timestamp:0,key:true},config));
 m=new MP4Muxer({width:320,height:180,fps:30,frames:2});await m.start();await m.addRaw(payload,{timestamp:0,key:true},config);await assert.rejects(m.addRaw(payload,{timestamp:80000,key:false}));await assert.rejects(m.addRaw(payload,{timestamp:33333,key:false},{decoderConfig:{description:new Uint8Array([1,77,0,40,255,225,0,0])}}));
});
test('abort reaches writable adapter and prevents subsequent additions',async()=>{
 const sink=new MemorySink(),m=new MP4Muxer({width:320,height:180,fps:30,frames:3,writable:sink});await m.start();await m.abort();assert.equal(sink.aborted,true);assert.equal(sink.closed,false);await assert.rejects(m.addRaw(payload,{timestamp:0,key:true},config));await m.abort();
});
