import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../js/presets.js';
import { parseControls } from '../js/glsl.js';
import { translate } from '../js/i18n.js';

test('all built-in preset names, descriptions and slider labels have English presentations', () => {
  for (const preset of PRESETS) {
    for (const value of [preset.ko, preset.description, ...parseControls(preset.code).map(c => c.label)]) {
      assert.doesNotMatch(translate(value, 'en'), /[가-힣]/, value);
      assert.equal(translate(value, 'ko'), value);
    }
  }
});

test('localization preserves interpolated values, English source and Korean originals', () => {
  const message = '1920 × 1080 · 24fps · 2초 · 48프레임';
  assert.equal(translate(message, 'en'), '1920 × 1080 · 24fps · 2s · 48frames');
  assert.equal(translate(message, 'ko'), message);
  assert.equal(translate('vec3 pattern(vec2 p) { return palette(0.5); }', 'en'), 'vec3 pattern(vec2 p) { return palette(0.5); }');
  assert.equal(translate('현재 재생 위치의 한 프레임을 저장합니다.', 'en'), 'Save one frame at the current playback position.');
});
