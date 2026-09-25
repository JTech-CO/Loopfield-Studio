# v1.1.0 validation report / 2026-09-22

**English** · [한국어](TEST_REPORT-KR.md)

This historical report covers the v1.1.0 layout, resolution, encoder negotiation and preset expansion. The original environment **did not execute the complete native browser H.264 path**. Support queries, encoder stubs and FFmpeg-based AVC tests are not counted as native WebCodecs validation.

| Check | Result |
|---|---|
| Node logic, projects, MP4, AVC and simulated encoding retries | 30 passed |
| Actual WebGL 2 preset compilation/rendering | 32 passed |
| Default low-resolution endpoint samples | All 32 matched |
| All sliders at minimum / maximum | 64 renders; no GL errors |
| UI, layout, dark filters, keyboard, split, PNG, recovery, responsive | 35 passed |
| Actual PNG dimensions | Six landscape/portrait/square cases across 1080p, DCI 2K, QHD, UHD passed |
| UI 4K PNG download | 3840×2160; 6,041,269 bytes |
| Export instrumentation | Real 4K WebGL plus VideoEncoder/VideoFrame stubs; canvas/RGBA 12-frame timing, cleanup and cancellation passed; no duplicated first frame |
| Actual AVC → app MP4 writer → decode | Seven settings × memory/direct writer = 14 passed; frame hashes and order matched |
| Native full WebCodecs export on target devices | Not run in the original environment |
| Native OS file picker and disk permissions | Not run; writer adapter only |
| localStorage across restart | Not run in the original environment |

Evidence is under [validation/v1.1.0](validation/v1.1.0/). Earlier records are under [validation/v1.0.0](validation/v1.0.0/). Screenshots and all 32 thumbnails came from actual GLSL frames.

## UI findings

At 1600×1000 the canvas covered over 99% of its frame in both dimensions. The old excess flex whitespace was removed. Landscape, portrait and square retained their aspect ratios.

Code preview and editor tops aligned, with the editor to the right. Divider drag, arrows, Home and settings drawers passed. Widths 1024 and 768 used side-by-side panels; 390 stacked vertically without horizontal overflow.

Selecting 4K synchronized MP4 and PNG controls. Selecting DCI 2K in the PNG dialog also updated MP4. The downloaded PNG header and pixels confirmed size. Failed codec checks preserved UHD selection.

The HTML dark listbox used background rgb(32,38,48) and text rgb(242,243,245). Category/search/keyboard selection passed, with six fractal presets.

## Original browser environment

Chromium + ANGLE SwiftShader + Xvfb used the real shader compiler, framebuffer, readPixels and PNG encoder. This was not a hardware performance benchmark.

Navigation restrictions required an about:blank document with locally fulfilled routes. Only the test document had a base tag, omitted CSP and inline copies of SVG symbols. Production CSP stayed intact. These tests do not establish Pages response or CSP-network behavior.

That document was not a secure context and exposed no native VideoEncoder. The UI correctly reported the HTTPS error and preserved resolution. Native codec support must be checked on HTTPS/localhost.

## AVC and instrumentation scope

Development-only FFmpeg/libx264 generated 12 frames each at 1080p/30, QHD/30, DCI 2K/24, UHD/30, UHD/60 and portrait 1080×1920/30, plus 24 B-frames at 320×180/30. Samples and AVC configuration were remuxed with `js/mp4.js` using both writers; ffprobe and decoded frame hashes matched references. FFmpeg is not an app encoder dependency.

Export instrumentation read actual 3840×2160 pixels and checked i/N colors, timestamps, RGBA orientation, frame counts and resource lifetimes with explicit native-API stubs. This verifies frame delivery and cleanup, not actual H.264 encoding.

## Reproduction

```sh
node --test tests/*.test.mjs
python tests/validate_media.py --out ./test-artifacts/media
```

See [optional browser regressions](../tests/README.md). On HTTPS/localhost, `tests/browser.html` offers 32 graphics checks and a two-second native WebCodecs → MP4 → video-decode test at the chosen resolution and 24/30/60 fps. Studio's single-frame check is a quicker probe, not proof of full export success.

Target-device checks should cover Windows/macOS browsers, UHD 60 fps for 60 seconds, heavy layered fractals, memory limits, direct disk saving/cancellation and tab sleep/recovery. Software preference is a hint, not a bundled encoder. Sample matches are not a continuity proof.

For the later language/branding update, see [2026-09-26 checks](VALIDATION-2026-09-26.md).
