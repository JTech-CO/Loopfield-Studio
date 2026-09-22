import { dimensions, bitrateFor, abortIfNeeded } from './utils.js';

/** H.264 Annex A: MaxFS, MaxMBPS and Main/Baseline MaxBR (bits/s).
 * Size must be measured in *rounded-up 16x16 macroblocks*, not pixel area.
 * A 2048x1080 frame needs level 4.2, QHD needs 5.0; not indiscriminately 5.1.
 */
export const AVC_LEVELS = [
  { id:31, fs:3600,  mbps:108000,  br:14e6 },
  { id:32, fs:5120,  mbps:216000,  br:20e6 },
  { id:40, fs:8192,  mbps:245760,  br:20e6 },
  { id:41, fs:8192,  mbps:245760,  br:50e6 },
  { id:42, fs:8704,  mbps:522240,  br:50e6 },
  { id:50, fs:22080, mbps:589824,  br:135e6 },
  { id:51, fs:36864, mbps:983040,  br:240e6 },
  { id:52, fs:36864, mbps:2073600, br:240e6 }
];
export function validAVCLevels(width,height,fps,bitrate,profile='6400') {
  const mw=Math.ceil(width/16),mh=Math.ceil(height/16),mbs=mw*mh;
  return AVC_LEVELS.filter(l=>mbs<=l.fs&&mbs*fps<=l.mbps&&
    Math.max(mw,mh)**2<=8*l.fs&&bitrate<=l.br*(profile==='6400'?1.25:1));
}
export function avcCandidates(settings) {
  const [width,height]=dimensions(settings),bitrate=bitrateFor(settings);
  const preference={auto:['no-preference','prefer-hardware','prefer-software'],hardware:['prefer-hardware','no-preference','prefer-software'],software:['prefer-software','no-preference','prefer-hardware']}[settings.encoder]||['no-preference','prefer-hardware','prefer-software'];
  const candidates=[];
  for(const hardwareAcceleration of preference) {
    // Try the least demanding valid level in *each* profile before trying higher levels.
    const profiles=['6400','4d00','42e0','4200'];
    const levels=profiles.map(p=>validAVCLevels(width,height,settings.fps,bitrate,p));
    for(let i=0;i<AVC_LEVELS.length;i++)for(let j=0;j<profiles.length;j++) {
      const level=levels[j][i];if(!level)continue;
      candidates.push({codec:`avc1.${profiles[j]}${level.id.toString(16).padStart(2,'0')}`,width,height,bitrate,
        framerate:settings.fps,latencyMode:'realtime',hardwareAcceleration,avc:{format:'avc'}});
    }
  }
  return candidates;
}
export function assertWebCodecs() {
  if(!globalThis.isSecureContext)throw new Error('MP4 출력은 HTTPS 또는 localhost에서 열어야 합니다. GitHub Pages HTTPS 주소를 사용하세요.');
  if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined')throw new Error('이 브라우저에 WebCodecs VideoEncoder가 없습니다. WebCodecs 인코더를 제공하는 브라우저에서 실행해 주세요.');
}
export async function* supportedAVCConfigs(settings,{signal,diagnostics=[]}={}) {
  assertWebCodecs();
  for(const config of avcCandidates(settings)) {
    abortIfNeeded(signal);
    try {
      const r=await VideoEncoder.isConfigSupported(config);
      diagnostics.push({stage:'query',codec:config.codec,preference:config.hardwareAcceleration,supported:r.supported});
      if(r.supported)yield config;
    } catch(e) { diagnostics.push({stage:'query',codec:config.codec,preference:config.hardwareAcceleration,error:e.message}); }
  }
}
export async function findAVCConfig(settings,options={}) {
  for await(const config of supportedAVCConfigs(settings,options))return config;
  throw encoderError(settings,options.diagnostics||[]);
}
export function encoderError(settings,diagnostics=[]) {
  const [w,h]=dimensions(settings);
  const error=new Error(`${w} × ${h} · ${settings.fps}fps에서 사용할 수 있는 H.264 인코더를 찾지 못했습니다. 브라우저의 하드웨어/소프트웨어 경로를 모두 검사했습니다. 4K를 1080p로 바꿔 저장하지 않았습니다. 진단 JSON을 저장해 실패 단계를 확인하세요.`);
  error.name='EncoderUnavailableError';error.diagnostics=diagnostics;return error;
}
