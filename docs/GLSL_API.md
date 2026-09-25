# GLSL API v1

**English** · [한국어](GLSL_API-KR.md) · [README](../README.md)

The engine uses WebGL 2 / GLSL ES 3.00 fragment shaders and injects `#version`, shared uniforms and the final main function. Write one of these entry points:

```glsl
vec3 pattern(vec2 p) { return palette(length(p)); }
```

```glsl
void mainImage(out vec4 color, in vec2 fragCoord) {
  vec2 p = (2.0 * fragCoord - uResolution) / uResolution.y;
  color = vec4(palette(length(p)), 1.0);
}
```

`pattern` receives aspect-corrected coordinates centered at zero with positive y upward. Before transforms, the vertical range is −1 to 1. Layer rotation, zoom and offset are applied. `mainImage` receives raw pixel coordinates and must apply view transforms itself. Its alpha participates in layer blending; the final MP4 is opaque.

Colors are clamped to 0–1, non-finite results become black, and discarded pixels stay transparent within that layer. Frames do not read previous results. Avoid unbounded or very large nested GPU loops.

## Shared variables

| Name | Type | Value |
|---|---|---|
| uResolution | vec2 | Current render target size; preview and export differ |
| uLoop | float | Global phase × layer cycles + layer phase |
| uAngle | float | TAU × uLoop |
| uCycle | vec2 | cos(uAngle), sin(uAngle) |
| uTime | float | Global phase × duration, in seconds |
| uDuration | float | Full video duration in seconds |
| uFrame | int | Frame index; export starts at zero |
| uZoom | float | Zoom, 0.25–64 |
| uRotation | float | Layer rotation in radians |
| uOffset | vec2 | Offset in pattern coordinates |
| uSeed | float | Seed, 0–999; only affects code using it |
| uHue | float | Palette progression offset |
| uColorA/B/C | vec3 | Three selected RGB colors, 0–1 |
| iTime / iResolution / iFrame | macros | uTime / vec3(uResolution,1) / uFrame aliases |

`uTime` and `uFrame` do not automatically match at the loop boundary. Phase 1 is not wrapped to zero during inspection. Use `uCycle` or integer multiples of sine/cosine rotations for periodic code.

## Functions

`rotate(float)` returns mat2; `palette(float)` blends the three colors into vec3; `hash21(vec2)` returns a pseudorandom float; `noise2(vec2)` returns interpolated value noise; `fbm(vec2)` uses five octaves. `stroke(float distance, float halfWidth)` returns a derivative-smoothed line mask. PI and TAU are available.

Animate noise around a circle instead of translating indefinitely:

```glsl
vec3 pattern(vec2 p) {
  float n = fbm(p * 3.0 + uCycle * 0.6 + vec2(uSeed));
  return palette(n + 0.1 * uCycle.y) * (0.3 + n);
}
```

## Custom sliders

```glsl
// @slider uPetals 3 24 1 8 | Petals
```

Fields are variable, minimum, maximum, step, default, separator and display label. Up to 16 sliders per layer are supported. The engine declares a **float uniform** automatically. Do not redeclare it. Reserved variables, duplicate names, `gl_` prefixes and double underscores are rejected. Convert to integers with `int(uPetals + 0.5)` when needed.

The UI clamps values but does not guarantee integer semantics in arbitrary code. Round cycle counts explicitly. Source is limited to 48,000 characters per layer.

## Common loop mistakes

`p.x += uTime` ends at a different point; `p += uCycle * radius` returns to the start. `sin(uAngle * 1.5)` generally does not connect after one cycle. Use integer multiples or redesign the full period. Per-frame random changes may also create a boundary jump.

## Compatibility

Only a Shadertoy-style `mainImage` and the three aliases above are provided. `iChannel0–3`, buffers A–D, media textures, mouse/date/channel uniforms and multi-pass feedback are unsupported.

Built-in fractals use floats, without perturbation deep zoom, double-double or arbitrary precision. Some lines use derivative antialiasing; full-scene supersampling and temporal antialiasing are not provided.
