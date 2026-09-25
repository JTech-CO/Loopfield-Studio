# Changelog

**English** · [한국어](CHANGELOG-KR.md)

## Unreleased / 2026-09-26

- Default new sessions to English and Prism Bloom. Follow selected pattern names until the title is manually edited; preserve title mode in project JSON.

- Add a persistent KR/EN toggle, including dynamic status messages and accessible labels, without changing project data or shader drafts.
- Separate English and Korean documentation with reciprocal links.
- Refine Korean export, frame-rate and layer-order wording.
- Add separate site and repository social-preview artwork; wire site Open Graph/Twitter metadata.
- Replace the logo with layered orbits and use it in export progress, respecting reduced motion.

## 1.1.0 / 2026-09-22

- Resizable code layout with preview left/editor right, pointer and keyboard controls, Home reset, library/settings drawers.
- Aspect-correct preview without excessive internal whitespace; portrait, square and fullscreen support.
- Quick 1080p/DCI 2K/QHD/UHD export selection and PNG resolution dialog, independent of preview quality. Preview also supports 1440p/2160p.
- H.264 level selection based on rounded macroblocks, throughput and profile bitrate. Hardware/software preference candidates, actual first-frame encode/flush, alternate candidates and CPU RGBA retry. Reuse the successful first frame without duplication.
- Cancellable encoder tests, JSON diagnostics and invalidation after settings change. No automatic resolution reduction.
- Dark HTML category listbox with selection, focus, keyboard support and counts. Explicit colors for other selects/options.
- Twenty additional GLSL presets: spiral, Truchet, hex pulse, polar grid, rose, Lissajous, concentric grid, quasicrystal, Burning Ship, Multibrot, Newton, Sierpinski, aurora, caustics, metaballs, dunes, plasma, torus, superellipsoid and Schwarz P; 32 total.
- Preserve v1.0.0 JSON and source; missing encoder preference becomes auto.
- Separate actual test evidence from unverified native behavior in the [report](docs/TEST_REPORT.md).

## 1.0.0 / 2026-09-22

Initial implementation independent of ShaderDesk: 12 presets, four-layer composition, post-processing, code/sliders, sampled loop inspection, 1080p/QHD/DCI 2K/UHD output, WebCodecs H.264, an original MP4 writer, JSON/GLSL/PNG saving and static Pages deployment.

Development evidence covers real WebGL, 4K frames, AVC decoding through the muxer and UI. Native WebCodecs and File System Access require target-device testing. This version is not a complete platform certification or commercial SLA.
