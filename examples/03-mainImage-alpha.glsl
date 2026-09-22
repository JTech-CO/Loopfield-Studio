// mainImage uses pixel coordinates; common view transform is not automatic.
void mainImage(out vec4 color, in vec2 fragCoord) {
  vec2 p = (2.0 * fragCoord - uResolution) / uResolution.y;
  p = rotate(uRotation) * p / uZoom + uOffset;
  float d = abs(length(p - 0.25 * uCycle) - 0.55);
  float alpha = 1.0 - smoothstep(0.02, 0.025, d);
  color = vec4(palette(length(p) + 0.1 * uCycle.y), alpha);
}
