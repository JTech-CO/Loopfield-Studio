/** Development-only bridge: feed real AVC packets to the same muxer as the app. */
import fs from 'node:fs/promises';
import { MP4Muxer } from '../js/mp4.js';
const [input,output,mode='memory']=process.argv.slice(2);
if(!input||!output)throw new Error('node tests/remux_fixture.mjs fixture.json output.mp4 [memory|direct]');
const f=JSON.parse(await fs.readFile(input,'utf8'));
let handle=null,position=0;
const writable=mode==='direct'?{
 async write(raw){const cmd=raw.type==='write',data=cmd?raw.data:raw,pos=cmd?raw.position:position;await handle.write(data,0,data.byteLength,pos);position=pos+data.byteLength;},
 async close(){await handle.close();handle=null;},async abort(){if(handle)await handle.close();handle=null;await fs.rm(output,{force:true});}
}:null;
try{
 if(writable)handle=await fs.open(output,'w');
 const m=new MP4Muxer({width:f.width,height:f.height,fps:f.fps,frames:f.samples.length,writable});await m.start();
 for(let i=0;i<f.samples.length;i++){
  const s=f.samples[i];await m.addRaw(new Uint8Array(Buffer.from(s.data,'base64')),{timestamp:s.timestamp,key:s.key},i?{}:{decoderConfig:{description:new Uint8Array(Buffer.from(f.avcc,'base64'))}});
 }
 const r=await m.finalize();if(r.blob)await fs.writeFile(output,new Uint8Array(await r.blob.arrayBuffer()));
 console.log(JSON.stringify({width:r.width,height:r.height,fps:r.fps,frames:r.frames,bytes:r.bytes,mode}));
}finally{if(handle)await handle.close();}
