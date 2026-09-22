/* Loopfield Studio - MIT. No network requests or executable project imports. */
export const VERSION = '1.0.0';
export const MAX_LAYERS = 4;
export const MAX_SOURCE = 48000;
export const TAU = Math.PI * 2;
export const clamp = (x, min, max) => Math.min(max, Math.max(min, Number(x)));
export const finite = (x, fallback = 0) => Number.isFinite(Number(x)) ? Number(x) : fallback;
export const clone = value => JSON.parse(JSON.stringify(value));
export const uid = () => globalThis.crypto?.randomUUID?.() || `layer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export const mod = (x, n = 1) => ((x % n) + n) % n;
export const hexRGB = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
export const safeName = name => String(name).normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim().slice(0, 72) || 'Loopfield';
export const formatBytes = n => `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0)} MB`;
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove();
  // Do not revoke before the browser has consumed the download URL.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export function dimensions(settings) {
  const base = { '1080p': [1920, 1080], qhd: [2560, 1440], uhd: [3840, 2160], dci2k: [2048, 1080] };
  const [w, h] = base[settings.resolution] || base['1080p'];
  if (settings.resolution === 'dci2k') return [w, h];
  if (settings.aspect === 'portrait') return [h, w];
  if (settings.aspect === 'square') return [h, h];
  return [w, h];
}
export function bitrateFor(settings) {
  const [w, h] = dimensions(settings);
  const factor = { standard: 12, high: 20, master: 32 }[settings.quality] || 20;
  return Math.round(Math.min(180, factor * Math.pow(w * h / (1920 * 1080), .85) * Math.pow(settings.fps / 30, .65)) * 1e6);
}
export function frameTiming(index, fps) {
  const timestamp = Math.round(index * 1e6 / fps);
  return { timestamp, duration: Math.round((index + 1) * 1e6 / fps) - timestamp };
}
export function endpointMetrics(a, b) {
  if (a.length !== b.length || !a.length) throw new Error('비교할 프레임 크기가 다릅니다.');
  let sum = 0, squares = 0, max = 0;
  const count = a.length / 4 * 3;
  for (let i = 0; i < a.length; i++) {
    if (i % 4 === 3) continue;
    const d = Math.abs(a[i] - b[i]); sum += d; squares += d * d; max = Math.max(max, d);
  }
  return { mae: sum / count, rmse: Math.sqrt(squares / count), max, match: sum / count <= .5 };
}
export function abortIfNeeded(signal) {
  if (signal?.aborted) throw new DOMException('렌더링을 취소했습니다.', 'AbortError');
}
