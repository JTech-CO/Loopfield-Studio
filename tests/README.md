# Development tests

These tools are optional developer dependencies. The deployed Studio does not use Python, Node, FFmpeg, Pillow or Playwright.

## Pure JS tests

```sh
node --test tests/*.test.mjs
```

30 tests cover presets, JSON compatibility, H.264 candidate levels, exact output sizes, RGBA row order, first-frame retries/cancellation, MP4 boxes, timestamps and writer behavior. VideoEncoder tests in Node are explicitly mocks, not native codec verification.

## Real AVC MP4 container verification

Install FFmpeg/ffprobe, Python and Node, then run:

```sh
python tests/validate_media.py --out ./test-artifacts/media
```

Fourteen outputs are decoded and compared frame-for-frame with the reference AVC. This does not test WebCodecs.

## Browser graphics and UI regression

Install the Python packages `playwright` and `pillow`, and either a Chromium browser or Playwright's Chromium. Then:

```sh
python tests/qa_graphics.py
python tests/qa_ui.py
python tests/qa_export_flow.py
```

`LOOPFIELD_BROWSER` optionally selects an executable. `LOOPFIELD_HEADED=1` uses headed mode; on Linux this also needs a display/Xvfb. Some Chromium environments disable WebGL in headless mode; a WebGL boot failure is not a shader compile success. The v1.1.0 production report used Chromium + ANGLE SwiftShader in headed Xvfb.

Files are served to an about:blank test document through local Playwright route fulfillment. Only the test document's CSP is omitted and SVG symbols are inlined to avoid the opaque-origin SVG restriction. Do not count this as Pages deployment/CSP verification. The app's shipped HTML/CSP is not changed.

Results go to `test-artifacts/browser/`. Graphics tests regenerate the local preset thumbnails; UI tests regenerate `docs/images/` screenshots. No fonts are bundled. The export-flow test replaces only the encoder/frame API while using real WebGL readback; it does not verify native H.264.

## Native browser codec test

Open `tests/browser.html` on the actual HTTPS/localhost deployment. It encodes 2 seconds at the selected resolution and 24/30/60fps, remuxes to MP4 and decodes with a video element. Export the JSON report with the browser/OS/settings. Also test long videos and the native file picker in Studio.
