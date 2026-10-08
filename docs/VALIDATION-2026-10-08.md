# 80-pattern library validation / 2026-10-08

**English** · [한국어](VALIDATION-2026-10-08-KR.md) · [Pattern catalog](PATTERNS.md)

The library adds five finite fractal curves, six planar constructions and five spatial models. Totals are 23 fractals, 29 geometric-motion presets, 19 spatial presets, eight organic presets and one code starting point. Existing 64 shaders and thumbnails are preserved.

- Node regression suite: **36 passed**, including unique IDs/names/sources, control ranges, English/Korean presentation and production `CNAME` retention.
- Actual Chromium WebGL 2 using ANGLE SwiftShader: **80/80** compile, render visible output, animate and match the loop endpoints at 240 × 144.
- The 16 new presets pass **138** individual/combined control-extreme variants. Every control changes visible output, all tested extremes remain visible, and no GL errors are recorded.
- Largest default mean absolute RGB endpoint difference: approximately **0.013947 / 255**. Largest combined-extreme difference: approximately **0.008189 / 255**. The existing match threshold is 0.5 / 255. These are finite-resolution checks, not a mathematical or device-independent guarantee.
- Original HTML/CSP on loopback HTTP: 80 cards, EN/Prism Bloom startup, all 16 new selections/resets, English/Korean names/search, automatic titles and manual-title preservation pass. No uncaught exceptions or failed resource requests are recorded.
- Sixteen 320 × 180 WebP thumbnails are generated from the actual shaders and visually reviewed. Curve margins were reduced to keep rocking/breathing shapes inside the frame.

## Native MP4 sample checks

On Windows Chromium with **Intel UHD Graphics / ANGLE Direct3D 11**, `koch` and `five-cell` each produce and play a **1920 × 1080, 24 fps, 2-second H.264 MP4**. Codec: `avc1.640028`; encoder preference: software. Browser decoding reports the exact resolution and two-second duration, and playback advances.

An earlier native-export attempt with forced SwiftShader exceeded its 120-second test cancellation deadline. The same representative presets pass with actual GPU rendering. This distinction matters: a software WebGL path is useful for repeatable small graphics tests but does not establish export performance. This update does not verify every preset at 4K, long durations, all GPUs or all encoder configurations.

## Reproduction

Run `node --test tests/*.test.mjs`, `python -X utf8 tests/qa_library.py` and `python -X utf8 tests/qa_library_ui.py`; see [development tests](../tests/README.md). Evidence is saved locally under `test-artifacts/browser/`: `library-80.json`, `library-expansion-80.png`, `library-80-ui.json`, `library-80-studio.png`, `native-library-80.json` and the two native MP4 samples. The native sample script is a local ignored diagnostic, rather than a deployed dependency.

All additions remain stateless and self-contained when exported as GLSL. Recursion, mesh/fiber counts, and control ranges are bounded; projection and inversion avoid singularities. No remote service, personal-data collection, runtime dependency or executable project import is added. Production HTTPS and the tracked domain file are preserved. Changes are committed locally only.
