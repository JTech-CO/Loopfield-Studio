# Language and branding validation / 2026-09-26

**English** · [한국어](VALIDATION-2026-09-26-KR.md)

- Node regression suite: **32 passed**, including all 32 presets' English names, descriptions and slider labels, and localization with interpolated values.
- Actual localhost app with production CSP, Playwright Chromium + ANGLE SwiftShader: **18 checks passed**, no JavaScript exceptions.
- Confirmed default Korean, immediate English switching, Korean restoration, saved preference after reload, unchanged project JSON and unapplied GLSL draft, English accessible labels and documentation links.
- Confirmed Julia selection and dynamic English controls, shared SVG export mark and disabled animation under reduced-motion preference.
- Native WebCodecs H.264 MP4 completed and played through HTMLVideoElement: **1920×1080, 24 fps, 2 seconds, 48 frames**, codec `avc1.640028`, approximately 5.7 MB. This run used the browser's native encoder, without VideoEncoder mocks.
- No horizontal overflow at 1024, 768 or 390 pixels; language control remained reachable. Desktop, mobile and export-dialog screenshots were visually reviewed.
- All local Markdown links were checked. Site/repository OG artwork was visually reviewed and copied into assets/presets. Metadata records the actual site-image dimensions.

[Machine-readable browser results](validation/2026-09-26/language.json). Reproduce with `node --test tests/*.test.mjs` and the localhost [language regression](../tests/README.md).

This run does not establish native 4K/60fps, long-video, OS file-picker or all-device behavior. Existing earlier reports retain their original scope. No GitHub push, live deployment or repository social-preview setting change was performed.
