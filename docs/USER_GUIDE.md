# Loopfield Studio user guide

**English** · [한국어](USER_GUIDE-KR.md) · [README](../README.md)

## Your first video

Choose Prism Bloom, then adjust Symmetry, Light bands and a palette on the right. Drag the preview to pan the selected layer and scroll to zoom. Use **Reset view** to restore its position and zoom.

Start with 1080p, 30 fps, 8 seconds and High quality. **Export video** opens settings; **MP4 Render** starts rendering. Test your device's encoder before exporting. Preview quality controls editing responsiveness and does not reduce MP4 resolution.

After completion, download the MP4. With direct disk saving enabled, select a destination at the start and the file is finalized there. An incomplete render is not offered as a completed video. Enable repeat in your video player to play the single exported cycle continuously.

Use **EN / KR** in the top bar to switch language immediately. The preference is stored in this browser. Switching preserves your project, shader draft, timeline and export settings. New projects start in English with Prism Bloom unless you have a saved language preference. The automatic title follows the chosen pattern and language. Editing the title once makes it custom, preserving it across pattern changes, language changes, reloads and JSON import/export. Starting a new project resets automatic naming. Existing projects without title-mode metadata keep their saved names. Shader source is never translated.

## Resolution and preview quality

The resolution buttons below the canvas set the actual PNG/MP4 size: 1080p is 1920×1080, DCI 2K is 2048×1080, QHD is 2560×1440 and UHD is 3840×2160. DCI 2K and QHD are distinct formats.

The 540p/720p/1080p/1440p/2160p preview settings affect editing GPU load only. You can edit at 540p and export at 4K. The camera button opens the PNG dialog. Resolution and aspect changes there also apply to MP4.

## Layers and color

Click **Add layer**, then choose a pattern to add a new layer. Selecting a preset normally replaces the current layer. Up to four layers are supported. Duplicate, delete, reorder or toggle visibility with the eye button. Earlier layers are composited first onto the background.

New layers use Screen blending. Normal blending covers underlying layers, Multiply darkens them, and Difference compares their colors. Try opacity 0.15–0.4 to avoid overwhelming the composition.

Palettes and shape controls belong to each layer. Bloom, exposure, contrast, vignette and chromatic aberration affect the full composition. Bloom is an SDR light effect, not HDR output. Seed only matters when a shader uses `uSeed`.

## Mandelbrot and Julia

Mandelbrot starts with z=0 and uses a different c for each pixel while iterating z²+c. Julia uses each pixel as the initial z with a shared c. Interior points are dark; escaping points are colored using iteration information.

Higher iteration limits increase boundary detail and GPU load. Adjust at 540p and check detail in the export. Zoom is limited to 64 and uses float precision, so these presets are not deep-zoom explorers. H.264 compression and 8-bit SDR may alter subtle edges and gradients.

## Code mode

On desktop, Code mode places the preview on the left and editor on the right. Drag the divider or use the arrow keys when it is focused. Home restores the default 56% split. Open the pattern library and settings with the top-bar buttons. At widths of 760px or less, the panels stack vertically.

`vec3 pattern(vec2 p)` returns RGB for a pixel. Zero is dark and one is bright. The engine handles WebGL setup and drawing.

```glsl
// @slider uRings 2 24 1 10 | Ring count
vec3 pattern(vec2 p) {
  float r = length(p);
  float rings = 0.5 + 0.5 * cos(r * uRings + uCycle.x);
  return palette(r + 0.15 * uCycle.y) * rings;
}
```

Apply or Ctrl/Cmd+Enter compiles the draft. On error, the last working preview remains visible. Applied source and drafts are stored separately in JSON. Apply or revert pending changes before exporting. See [GLSL API](GLSL_API.md).

## Reading loop checks

The inspector renders four small samples at phase 0, 1, 1/N and 1−1/N. Mean endpoint RGB difference at or below 0.5/255 counts as a sample match. Maximum difference and boundary-motion difference are also shown.

This is not a mathematical proof of continuity across every pixel and time. Inspect the completed video in repeat mode. Periodic values such as `uCycle`, `sin(uAngle)` and `cos(uAngle)` usually connect more naturally than linear `uTime` motion. Layer cycle counts are integers from 1 to 8.

## Saving projects

Changes autosave in this browser's storage. Private browsing, storage limits, clearing browser data or changing domains may remove access to that data. Save important work as project JSON. Autosave does not synchronize accounts.

Open a `.loopfield.json` file to restore layers, effects, export settings, GLSL and unapplied drafts. PNG export renders the current playback position at the selected output resolution.

## Export troubleshooting

Use HTTPS or localhost. **Test one encoded frame** renders the chosen size and actually encodes it as H.264. Cancel a slow test with **Cancel test**. One successful frame does not guarantee a full-length export.

Auto mode tries profiles, levels, browser encoder preferences and frame-input paths. Prefer software is a browser hint; it does not install a software codec. Save diagnostics JSON from settings or the result dialog to inspect failures.

Keep 4K selected and lower fps or encoding quality to try preserving resolution. If no encoder supports that size, change browser/device or choose a different size yourself. The app does not silently output 1080p. PNG does not require an H.264 encoder.

For memory warnings, save directly to disk or reduce duration/quality. A disabled direct-save option means the file API is unavailable. Cancellation does not offer an incomplete video. A native file picker may leave a newly created empty file after cancellation; writes to existing files are requested to commit on completion.

Sleep or a GPU restart may interrupt rendering. Keep the tab open. Save JSON and reload after context loss. Cancellation may take longer while the driver processes a large render.

## Keyboard and motion

Space toggles playback; Ctrl/Cmd+S saves the project; Ctrl/Cmd+Enter applies code. In the editor, Tab inserts two spaces and Esc focuses Apply. Esc closes dialogs or cancels rendering. With reduced motion enabled, preview starts paused and the export mark remains still.
