# Architecture / v1.1.0

**English** · [한국어](ARCHITECTURE-KR.md) · [README](../README.md)

## Boundaries and modules

The host serves static HTML, CSS, JavaScript and image assets. The browser edits code, compiles shaders on the GPU and encodes H.264. No API uploads project or video payloads. Static requests and ordinary hosting logs may exist; there are no separate rendering endpoints, API keys or paid encoding jobs.

`app.js` owns UI state and events; `editor.js` handles text editing/highlighting; `project.js` validates and stores projects. `presets.js` and `presets-extra.js` contain 32 original shaders. `glsl.js` supplies the shared API and compiler wrapper. `renderer.js` manages GPU targets and composition; `avc.js` negotiates AVC profiles/levels; `exporter.js` handles probing, frames, WebCodecs and cancellation; `mp4.js` writes single-track AVC ISO BMFF. `utils.js` contains pure helpers.

`i18n.js` and `locales/en.js` localize presentation text and accessible attributes. Original DOM values are retained for reversible switching; a scoped MutationObserver handles dynamic UI updates. Editor source and input values are excluded. Confirmations are translated at their call site. Language uses a separate `loopfield.language.v1` storage key and does not modify project JSON. No external translation service is used.

## Layout

Design mode has library, preview and settings columns. The preview follows output aspect ratio and contains the whole canvas without cropping or stretching. Code mode turns library/settings into drawers and uses a preview/divider/editor grid. The split range is 30–70%, default 56%, stored separately in localStorage. Small phones stack panels. Preview quality belongs to UI state; output dimensions belong to `project.output`, shared by quick buttons, PNG and MP4 settings.

Categories use an HTML listbox with explicit dark colors. Other selects specify background, text and color scheme. Preset thumbnails are actual local GLSL renders. The favicon and animated export mark share an orbit-based SVG; reduced-motion preference disables its animation.

## GPU pipeline

Three output-sized RGBA8 targets are used: one temporary layer target and two ping-pong composition targets. The layer target is cleared to transparent before every layer, so discard and transparent `mainImage` pixels cannot leave previous-frame trails. Uniforms carry palettes, transforms, cycles and sliders.

Two quarter-size targets extract bright areas and apply Gaussian blur. The final pass applies bloom, exposure, contrast, chromatic aberration, vignette and time-independent dithering. This is artistic SDR processing, not linear HDR optics, and does not require float-texture extensions.

Frames do not depend on earlier results. Reproducibility is intended on the same device/settings/phase, without promising bit-identical output across GPU drivers or codecs. Compilation prepares all new programs transactionally; failure releases only new resources and preserves the old preview.

## Timing and loop inspection

N = duration × fps. Frame i uses phase i/N and timestamp round(i × 1,000,000 / fps). Duration is the difference between neighboring timestamps. The final phase is (N−1)/N; no duplicate phase-1 frame is appended. Preview wall-clock timing does not affect offline export.

Loop inspection compares phases 0, 1, 1/N and 1−1/N at low resolution. It does not wrap the endpoint to manufacture a match. Mean endpoint RGB difference ≤0.5/255 is a diagnostic threshold, not a proof of global continuity.

## H.264 and MP4

Support queries use the exact output size, fps and bitrate. Dimensions are rounded to 16-pixel macroblocks. MaxFS, MaxMBPS, dimension limits and profile-specific MaxBR determine High/Main/Baseline candidates. DCI 2K/30 needs at least level 4.2, QHD/30 level 5.0, UHD/30 level 5.1 and UHD/60 level 5.2; bitrate can require a higher level.

Each candidate gets a fresh encoder and an actual frame-zero encode/flush. Failure can retry top-down RGBA input from vertically flipped readPixels, different profiles/levels and acceleration preferences. The first successful chunk is held until the MP4 writer begins, then reused; the remaining loop starts at frame 1. Failed frames/encoders are closed. Failures after full export begins discard the result instead of joining different codecs midway.

Hardware preferences are hints, not proof of the device used. CPU RGBA is an input transport fallback, not a software H.264 implementation. No WASM/FFmpeg encoder ships with the app. If all candidates fail, resolution remains unchanged and diagnostics are returned.

Length-prefixed AVC NAL chunks are requested. `decoderConfig.description` supplies avcC. Chunk timestamps are validated. Each VideoFrame is closed. The first frame and small subsequent batches are flushed, and file writes are awaited to bound queues. GPU rendering runs on the main thread; native encoding follows browser implementation.

The writer supports one silent, constant-fps AVC video track with square pixels. It writes mvhd/tkhd/mdhd/stsd/avc1/avcC/stts/stsc/stsz/stco or co64/stss, and signed ctts when decode and presentation order differ. Sample count, unique PTS, initial keyframe and consistent AVC configuration are required.

Memory output uses fast-start ftyp → moov → mdat, with a 256 MiB encoded-payload cap. GPU, codec and Blob memory are additional. Direct saving uses ftyp → 64-bit mdat → moov, patches mdat size with a seek, then closes. Sample tables still scale with frame count and this layout is not fast-start. Failure/cancellation aborts the writer; native file-picker creation of an empty file is outside app control.

## Projects and security

JSON validation checks format/version, 1–4 layers, up to 48,000 source characters per layer, a 1 MiB import limit, ranges, colors and enums. There is no eval or project script execution. Text and syntax highlighting use text nodes. Draft and applied source are separate.

Custom GLSL can consume excessive GPU time; this is not a hostile-shader sandbox. The current model imports personal files and has no public shader upload service. A public gallery, sharing URLs or remote code would need additional limits and review.

CSP allows self resources, required blob media/images and dynamic UI styles. No external scripts, tracking, SharedArrayBuffer or multithreaded WASM are required, so COOP/COEP are unnecessary.

## Future extensions

Possible work includes worker-based rendering, job queues, antialiasing choices, periodic parameter keyframes and high-precision fractals. Audio and additional codecs require corresponding muxer changes.
