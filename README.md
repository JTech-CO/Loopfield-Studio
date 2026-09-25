# Loopfield Studio

**English** · [한국어](README-KR.md) · [Open Studio](https://jtech-co.github.io/Loopfield-Studio/)

**Create high-resolution motion loops with GLSL and layered patterns.**

![Loopfield Studio — Patterns. Code. Infinite motion.](assets/presets/og-repository.png)

Loopfield Studio is a browser-based **WebGL 2 + GLSL** graphics studio. Combine geometric patterns, fractals, organic motion and 3D-style shaders into looping videos. Start with presets and sliders, or write your own GLSL.

It runs on static hosting such as GitHub Pages. No account, API key, upload service or rendering backend is required. Processing happens on your device.

## Features

- 32 shader presets, including Mandelbrot and Julia fractals
- Up to four layers with blend modes and per-layer palettes
- GLSL editing, custom sliders and live preview
- Bloom, exposure, contrast, vignette and chromatic aberration
- Sample-based loop boundary inspection
- PNG export and silent H.264 MP4 export
- Project JSON import/export, including unapplied code drafts
- Responsive desktop, tablet and mobile layout
- Instant KR/EN switching with a saved preference; Korean is the default

## Output

| Format | Landscape resolution |
|---|---:|
| Full HD | 1920 × 1080 |
| DCI 2K | 2048 × 1080 |
| QHD | 2560 × 1440 |
| UHD 4K | 3840 × 2160 |

Choose 24, 30 or 60 fps and a duration of 2–60 seconds. Preview quality is independent of export resolution. DCI 2K is landscape only; the other sizes also support portrait and square output.

## A little GLSL

```glsl
vec3 pattern(vec2 p) {
  float radius = length(p);
  float wave = 0.5 + 0.5 * cos(radius * 12.0 + uCycle.x * 2.0);
  return palette(radius * 0.3 + uCycle.y * 0.2) * wave;
}
```

`uCycle` traces a circle to help connect the beginning and end of an animation. See the [GLSL API](docs/GLSL_API.md).

## Run locally

No build step or `npm install` is required.

```sh
python -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). Opening `index.html` through `file://` is unsupported.

## Hosting and browsers

The included workflow can deploy the repository root to GitHub Pages. Select **Settings → Pages → Source → GitHub Actions**. See [deployment](docs/DEPLOYMENT.md).

MP4 requires WebGL 2, WebCodecs `VideoEncoder`, an available H.264 encoder, and HTTPS or localhost. Desktop Chrome and Edge are the primary targets. 2K/4K and 60 fps support depends on the browser, GPU, OS and encoder. Unsupported output is reported without silently reducing resolution or disguising WebM as MP4.

## Documentation

- [User guide](docs/USER_GUIDE.md)
- [GLSL API](docs/GLSL_API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment and social previews](docs/DEPLOYMENT.md)
- [Validation report](docs/TEST_REPORT.md)
- [Development tests](tests/README.md)
- [Examples](examples/README.md)
- [Changelog](CHANGELOG.md)

Each document links to its Korean counterpart. Social images live in `assets/presets/`: `og-site.png` is connected to site metadata; `og-repository.png` can be uploaded in GitHub repository settings as the social preview.

## License

[MIT](LICENSE).
