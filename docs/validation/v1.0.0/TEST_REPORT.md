# v1.0.0 validation report / 2026-09-22

**English** · [한국어](TEST_REPORT-KR.md)

The initial static app completed implementation and layered testing. Real GPU shader rendering and MP4 container handling were verified; the original environment could not execute the full native WebCodecs H.264 path. These findings do not certify all browsers or hardware.

| Layer | Result |
|---|---|
| JavaScript parsing | Passed |
| Node controls, JSON, timing, dimensions, MP4, seek writer, errors and abort | 17 passed |
| Actual WebGL 2 presets | 12 compiled/rendered |
| 320×180 endpoint samples | 12 matched |
| Deliberately discontinuous uLoop code | Correctly failed, mean difference 85/255 |
| Actual 3840×2160 readPixels | 33,177,600 bytes; GL error 0 |
| UI, search, layers, code recovery, sliders, loops, exports and mobile | 26 passed |
| AVC → MP4, seven configurations × two writers | 14 passed |
| Extra graphics regressions including discard, four layers and recovery | 16 passed |
| Example JSON/GLSL/loop checks | Three passed |
| Real WebGL with encoder instrumentation stubs | Timing, release and cancellation passed; not native codec validation |
| Native WebCodecs, native file picker, persistent storage restart | Not run in the original environment |

Detailed JSON is in this validation directory. Screenshots were captured from the app. Desktop 1600×1000 and mobile 390px layouts had no horizontal overflow or uncaught JavaScript exceptions.

## Environment

Playwright about:blank with local routing was required by navigation restrictions. It was not a secure context and did not expose VideoEncoder. Chromium + ANGLE SwiftShader + Xvfb performed real compilation, framebuffer rendering and readPixels; results are not hardware GPU benchmarks.

Only test documents omitted CSP and inlined matching SVG symbols. Production CSP and external icon paths stayed intact. This does not verify GitHub Pages HTTP/CSP behavior. Canvas rendering was not mocked.

## MP4 method

Development FFmpeg/libx264 produced reference H.264. ffprobe extracted configuration, samples, PTS and keyframe flags for the same `js/mp4.js` used by the app. Both memory Blob and seekable direct-writer paths were tested.

Twelve frames each were checked at 1920×1080/30, 2560×1440/30, 2048×1080/24, 3840×2160/30, 3840×2160/60 and 1080×1920/30. A reordered B-frame stream at 320×180/30 used 24 frames. Codec, dimensions, fps, duration and frame count matched, as did every decoded frame hash and its order.

Separately, real WebGL phase colors were read while VideoFrame/VideoEncoder stubs measured 12-frame timestamps, progress, cleanup and cancellation. The final frame in export-instrumentation.json belongs to a separate cancellation check. This verifies API flow, not native encoding. FFmpeg, Node and Python are test dependencies only.

## Reproduce and remaining work

```sh
node --test tests/*.test.mjs
python tests/validate_media.py --out ./test-artifacts/media
```

Open `tests/browser.html` on HTTPS/localhost for graphics and native WebCodecs → MP4 → video decoding, initiated by a user button. The original native check used two seconds, 30 fps and 60 frames.

Verify target Windows/macOS Chrome/Edge at every resolution and 24/30/60 fps. Document other browsers from actual probes and output. Test long UHD layered fractals, disk cancellation/existing-file preservation, memory limits, sleep/recovery and GPU loss. Inspect exported loops visually; low-resolution sample matches are not mathematical proof. No universal device-performance figures are supplied.
