/*
 * Loopfield's deliberately narrow ISO BMFF writer (MIT).
 * One AVC/H.264 video track, square pixels, constant frame rate, no audio.
 * WebCodecs supplies length-prefixed AVC samples and its avcC decoder record.
 * In-memory files: ftyp / moov / mdat (fast start).
 * Direct-to-disk files: ftyp / extended-size mdat / moov (bounded payload RAM).
 * This is not a general MP4 demuxer, codec, or replacement for a media toolkit.
 */
const te = new TextEncoder();
const ascii = s => te.encode(s);
const zero = n => new Uint8Array(n);
export function concat(...arrays) {
  const out = new Uint8Array(arrays.reduce((n,a)=>n+a.length,0));
  let p=0;for(const a of arrays){out.set(a,p);p+=a.length;}return out;
}
const u16=(...v)=>{const b=new Uint8Array(v.length*2),d=new DataView(b.buffer);v.forEach((n,i)=>d.setUint16(i*2,n));return b;};
const u32=(...v)=>{const b=new Uint8Array(v.length*4),d=new DataView(b.buffer);v.forEach((n,i)=>d.setUint32(i*4,n));return b;};
const i32=(...v)=>{const b=new Uint8Array(v.length*4),d=new DataView(b.buffer);v.forEach((n,i)=>d.setInt32(i*4,n));return b;};
const u64=(...v)=>{const b=new Uint8Array(v.length*8),d=new DataView(b.buffer);v.forEach((n,i)=>d.setBigUint64(i*8,BigInt(n)));return b;};
export function box(type,...payload){const content=concat(...payload);if(content.length+8>0xffffffff)throw new Error('MP4 box가 너무 큽니다.');return concat(u32(content.length+8),ascii(type),content);}
const full=(type,version,flags,...payload)=>box(type,new Uint8Array([version,(flags>>>16)&255,(flags>>>8)&255,flags&255]),...payload);
const MATRIX=u32(0x10000,0,0,0,0x10000,0,0,0,0x40000000);
const FTYP=box('ftyp',ascii('isom'),u32(512),ascii('isomiso2avc1mp41'));
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
function bytes(data){if(data instanceof ArrayBuffer)return new Uint8Array(data.slice(0));return new Uint8Array(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength));}
function colorBox(cs) {
  if(!cs)return zero(0);
  const p={bt709:1,bt470bg:5,smpte170m:6,bt2020:9};
  const t={bt709:1,smpte170m:6,'iec61966-2-1':13,'bt2020-10':14,'bt2020-12':15,'pq':16,'hlg':18};
  const m={rgb:0,bt709:1,bt470bg:5,smpte170m:6,bt2020_ncl:9};
  if(!(cs.primaries in p)||!(cs.transfer in t)||!(cs.matrix in m))return zero(0);
  return box('colr',ascii('nclx'),u16(p[cs.primaries],t[cs.transfer],m[cs.matrix]),new Uint8Array([cs.fullRange?128:0]));
}
function runs(values){const out=[];for(const v of values){const last=out[out.length-1];if(last&&last[1]===v)last[0]++;else out.push([1,v]);}return out;}
export class MP4Muxer {
  constructor({width,height,fps,frames,writable=null,memoryLimit=256*1024*1024}) {
    if(![width,height,fps,frames].every(Number.isInteger)||Math.min(width,height,fps,frames)<1||Math.max(width,height)>65535)throw new Error('잘못된 MP4 트랙 설정입니다.');
    this.width=width;this.height=height;this.fps=fps;this.frames=frames;this.writable=writable;this.memoryLimit=memoryLimit;
    this.samples=[];this.buffers=[];this.payloadSize=0;this.config=null;this.colorSpace=null;this.started=false;this.done=false;this.aborted=false;
    this.position=FTYP.length+16;
  }
  async start() {
    if(this.started)throw new Error('MP4 writer가 이미 시작되었습니다.');this.started=true;
    if(this.writable){await this.writable.write(FTYP);await this.writable.write(concat(u32(1),ascii('mdat'),u64(0)));}
  }
  async addRaw(data,{timestamp,key},metadata={}) {
    if(!this.started||this.done||this.aborted)throw new Error('MP4 writer가 쓰기 가능한 상태가 아닙니다.');
    if(!(data instanceof Uint8Array)||!data.length)throw new Error('비어 있는 인코딩 프레임입니다.');
    if(this.samples.length>=this.frames)throw new Error('예상보다 많은 프레임이 인코딩되었습니다.');
    const cfg=metadata.decoderConfig;
    if(cfg?.description){
      const next=bytes(cfg.description);
      if(next[0]!==1||next.length<7)throw new Error('유효한 AVC decoder configuration record가 필요합니다.');
      if(this.config&&!equal(this.config,next))throw new Error('인코딩 도중 AVC 구성이 바뀌었습니다.');
      this.config=next;this.colorSpace=cfg.colorSpace||this.colorSpace;
    }
    const presentation=Math.round(timestamp*this.fps/1e6);
    if(!Number.isFinite(timestamp)||presentation<0||presentation>=this.frames||Math.abs(timestamp-presentation*1e6/this.fps)>2)throw new Error('인코더가 예상과 다른 타임스탬프를 반환했습니다.');
    if(!this.samples.length&&!key)throw new Error('첫 프레임은 키 프레임이어야 합니다.');
    if(!this.writable&&this.payloadSize+data.length>this.memoryLimit)throw new Error('메모리 내보내기 한도(256 MiB)를 넘었습니다. 디스크 직접 저장을 사용하거나 길이/비트레이트를 낮추세요.');
    const offset=this.position;
    if(this.writable)await this.writable.write(data);else this.buffers.push(data);
    this.samples.push({size:data.length,key:!!key,presentation,offset});this.payloadSize+=data.length;this.position+=data.length;
  }
  moov(offsets) {
    const n=this.samples.length,du=n,sc=this.fps;
    const mvhd=full('mvhd',0,0,u32(0,0,sc,du),u32(0x10000),u16(0x100),zero(10),MATRIX,zero(24),u32(2));
    const tkhd=full('tkhd',0,7,u32(0,0,1,0,du),zero(8),u16(0,0,0,0),MATRIX,u32(this.width*65536,this.height*65536));
    const mdhd=full('mdhd',0,0,u32(0,0,sc,du),u16(0x55c4,0));
    const hdlr=full('hdlr',0,0,u32(0),ascii('vide'),zero(12),ascii('Loopfield Video\0'));
    const vmhd=full('vmhd',0,1,u16(0,0,0,0));
    const dinf=box('dinf',full('dref',0,0,u32(1),full('url ',0,1)));
    const compressor=zero(32),label=ascii('Loopfield AVC');compressor[0]=label.length;compressor.set(label,1);
    const avc1=box('avc1',zero(6),u16(1),zero(16),u16(this.width,this.height),u32(72*65536,72*65536,0),u16(1),compressor,u16(24,0xffff),box('avcC',this.config),box('pasp',u32(1,1)),colorBox(this.colorSpace));
    const stsd=full('stsd',0,0,u32(1),avc1);
    const stts=full('stts',0,0,u32(1,n,1));
    // Signed composition offsets cover reordered encoder output without inventing DTS.
    // The fixed-cadence decode clock is sample index; PTS comes from WebCodecs.
    const deltas=this.samples.map((s,i)=>s.presentation-i),rr=runs(deltas);
    const ctts=deltas.some(x=>x!==0)?full('ctts',1,0,u32(rr.length),...rr.map(([count,delta])=>concat(u32(count),i32(delta)))):zero(0);
    const stsc=full('stsc',0,0,u32(1,1,1,1));
    const stsz=full('stsz',0,0,u32(0,n),u32(...this.samples.map(s=>s.size)));
    const large=offsets.some(o=>o>0xffffffff);
    const stco=full(large?'co64':'stco',0,0,u32(n),large?u64(...offsets):u32(...offsets));
    const keys=this.samples.flatMap((s,i)=>s.key?[i+1]:[]);
    const stss=full('stss',0,0,u32(keys.length),u32(...keys));
    const stbl=box('stbl',stsd,stts,ctts,stsc,stsz,stco,stss);
    return box('moov',mvhd,box('trak',tkhd,box('mdia',mdhd,hdlr,box('minf',vmhd,dinf,stbl))));
  }
  async finalize() {
    if(this.done||this.aborted)throw new Error('MP4 writer가 종료되었습니다.');
    if(!this.config)throw new Error('브라우저가 H.264 디코더 설정(avcC)을 반환하지 않았습니다.');
    if(this.samples.length!==this.frames)throw new Error(`프레임 수 불일치: ${this.samples.length}/${this.frames}`);
    if(new Set(this.samples.map(s=>s.presentation)).size!==this.frames)throw new Error('중복되거나 누락된 프레임 타임스탬프입니다.');
    let blob=null;
    if(this.writable){
      const moov=this.moov(this.samples.map(s=>s.offset));
      await this.writable.write(moov);
      await this.writable.write({type:'write',position:FTYP.length+8,data:u64(16+this.payloadSize)});
      await this.writable.close();
      this.fileSize=this.position+moov.length;
    }else{
      const preliminary=this.moov(this.samples.map(()=>0));
      let pos=FTYP.length+preliminary.length+8;
      const offsets=this.samples.map(s=>{const p=pos;pos+=s.size;return p;});
      const moov=this.moov(offsets);
      if(moov.length!==preliminary.length)throw new Error('MP4 오프셋 크기가 예상과 다릅니다.');
      blob=new Blob([FTYP,moov,u32(8+this.payloadSize),ascii('mdat'),...this.buffers],{type:'video/mp4'});
      this.fileSize=blob.size;
    }
    this.done=true;this.buffers=[];return {blob,bytes:this.fileSize,frames:this.frames,width:this.width,height:this.height,fps:this.fps};
  }
  async abort() {
    if(this.done||this.aborted)return;this.aborted=true;this.buffers=[];
    if(this.writable)try{await this.writable.abort();}catch{/* Already aborted/closed by the browser. */}
  }
}
