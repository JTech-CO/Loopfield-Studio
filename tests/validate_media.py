#!/usr/bin/env python3
"""Optional real-AVC muxer validation. Requires Python 3, Node 20+, FFmpeg/ffprobe.
Not a runtime dependency. DOES NOT test the browser's native WebCodecs encoder.
Builds AVC fixtures, re-muxes via js/mp4.js in memory and direct modes, decodes both,
and compares decoded per-frame hashes with the source encoder's reference file.
"""
from pathlib import Path
from fractions import Fraction
import subprocess, json, re, base64, argparse, tempfile
ROOT=Path(__file__).resolve().parents[1]

def run(*args):
    return subprocess.check_output([str(x) for x in args],stderr=subprocess.PIPE).decode()

def parse_hex(dump):
    pieces=[]
    for line in dump.splitlines():
        if ':' not in line: continue
        field=line.split(':',1)[1].strip().split('  ')[0]
        pieces.append(re.sub(r'\s','',field))
    return bytes.fromhex(''.join(pieces))

def hashes(path):
    out=run('ffmpeg','-v','error','-i',path,'-map','0:v:0','-f','framemd5','-')
    return [line.rsplit(',',1)[-1].strip() for line in out.splitlines() if line and not line.startswith('#')]

def validate(folder):
    folder.mkdir(parents=True,exist_ok=True); results=[]
    cases=[('1080p',1920,1080,30,12,0),('qhd',2560,1440,30,12,0),('dci2k',2048,1080,24,12,0),('uhd',3840,2160,30,12,0),('uhd60',3840,2160,60,12,0),('portrait',1080,1920,30,12,0),('bframes',320,180,30,24,3)]
    for name,w,h,fps,n,bframes in cases:
        reference=folder/f'{name}-reference.mp4'
        run('ffmpeg','-hide_banner','-v','error','-y','-f','lavfi','-i',f'testsrc2=size={w}x{h}:rate={fps}',
            '-frames:v',n,'-c:v','libx264','-threads','2','-preset','fast' if bframes else 'ultrafast','-crf','24',
            '-bf',bframes,'-g',60,'-pix_fmt','yuv420p',reference)
        info=json.loads(run('ffprobe','-v','error','-select_streams','v:0','-show_packets','-show_streams','-show_data','-of','json',reference))
        stream=info['streams'][0];data=reference.read_bytes()
        samples=[{'data':base64.b64encode(data[int(p['pos']):int(p['pos'])+int(p['size'])]).decode(),
                  'timestamp':round(float(p['pts_time'])*1e6),'key':'K' in p['flags']} for p in info['packets']]
        fixture={'width':w,'height':h,'fps':fps,'avcc':base64.b64encode(parse_hex(stream['extradata'])).decode(),'samples':samples}
        fp=folder/f'{name}.json';fp.write_text(json.dumps(fixture));expected=hashes(reference)
        for mode in ('memory','direct'):
            out=folder/f'{name}-{mode}.mp4'
            run('node',ROOT/'tests/remux_fixture.mjs',fp,out,mode)
            probe=json.loads(run('ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',out));s=probe['streams'][0]
            assert (s['width'],s['height'])==(w,h),s
            assert Fraction(s['r_frame_rate'])==fps,s
            assert int(s['nb_read_frames'])==n,s
            assert abs(float(s['duration'])-n/fps)<1e-5,s
            decoded=hashes(out);assert decoded==expected,f'{name}/{mode}: decoded frame content or presentation order differs'
            results.append({'case':name,'mode':mode,'width':w,'height':h,'fps':fps,'frames':n,'duration':float(s['duration']),'bytes':out.stat().st_size,'decodedFrameHashesMatch':True,'bframes':bframes})
            print(f'PASS {name:9} {mode:6} {w}x{h} {fps}fps {n} frames',flush=True)
    (folder/'media-results.json').write_text(json.dumps(results,indent=2));return results

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--out',type=Path);a=parser.parse_args()
    if a.out:validate(a.out.resolve())
    else:
        with tempfile.TemporaryDirectory(prefix='loopfield-media-') as temp:validate(Path(temp))
