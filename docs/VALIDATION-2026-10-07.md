# 64-pattern library validation / 2026-10-07

**English** · [한국어](VALIDATION-2026-10-07-KR.md) · [Pattern catalog](PATTERNS.md)

- Node regression suite: **35 passed**. All 64 IDs, English/Korean names and GLSL sources are unique, and all slider declarations pass range and localization checks.
- Actual Chromium WebGL 2: **64/64** shaders compile, render nonempty images and animate. ANGLE SwiftShader was used for repeatable local checks.
- Default loop endpoints match for **64/64** presets at 240 × 144. The largest mean absolute RGB difference was approximately **0.000704 / 255**; the existing match threshold is 0.5 / 255.
- **242** additional cases cover the expansion's individual slider minima/maxima and all sliders at their minima/maxima together. No WebGL errors; combined extreme settings pass sampled endpoint checks. Every new slider changes the rendered image at at least one extreme.
- **32** new 320 × 180 WebP thumbnails come from actual shader frames. A contact sheet was visually reviewed; curve/surface framing and the octahedral cavity were adjusted.
- With the original HTML/CSP intact: startup, 64 library cards, tesseract selection, slider reset and four-layer composition using tesseract/Mandelbulb/phyllotaxis/conformal grid pass. No uncaught exceptions or CSP violations were recorded.
- English/Korean tesseract names, searches and controls pass. Existing preset sources and existing thumbnails are preserved.

Reproduce the graphics checks with `python -X utf8 tests/qa_library.py`; see [development tests](../tests/README.md). Local evidence is written to `test-artifacts/browser/library-64.json`, `library-expansion.png`, `library-shell.json` and `tesseract-studio.png`.

Loop inspection is sampled, not a mathematical proof at every output resolution. These checks do not claim new native MP4/4K encoder certification or a GitHub Pages deployment test. The expansion adds bounded, local procedural shaders without external textures, services or project uploads.
