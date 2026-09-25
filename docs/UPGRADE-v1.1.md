# Upgrade from v1.0.0 to v1.1.0

**English** · [한국어](UPGRADE-v1.1-KR.md)

Replace the repository-root contents with the complete contents of the new ZIP's `Loopfield-Studio/` folder. Update index.html, css, js, assets, tests and docs together; mixing individual scripts can break HTML IDs and module contracts. This version adds avc.js, presets-extra.js and new WebP thumbnails.

Export project JSON from the previous app first. Schema version remains 1, preserving v1.0.0 GLSL, layers and resolution. Missing encoder preference defaults to auto. The autosave key is unchanged on the same origin. Transfer JSON when changing domains.

Keep an existing CNAME and DNS configuration. The ZIP does not choose a domain. After deployment, hard-refresh and check the footer for Loopfield 1.1.0. There is no service worker.

## Updated controls

- Code: left preview and right editor, with a resizable divider; library/settings become top-bar drawers.
- Resolution: the buttons beneath the canvas set PNG and MP4 output independently of preview quality.
- PNG: camera button → confirm resolution → Save PNG.
- MP4: resolution → Export video → fps/duration/quality → one-frame test → MP4 Render.
- Diagnostics: save JSON from settings or the export result. H.264 4K support is device-dependent.

See [Changelog](../CHANGELOG.md) and [validation scope](TEST_REPORT.md).
