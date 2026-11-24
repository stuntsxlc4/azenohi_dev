import { expect, it } from 'vitest';
import { getEarthQuality } from './earthQuality';

it('selects the texture budget from the viewport, input and WebGL limits', () => {
  const gpu = { maxTextureSize: 16384, getMaxAnisotropy: () => 16 };
  expect(getEarthQuality(gpu, 1728, false, false).tier).toBe('ultra');
  expect(getEarthQuality(gpu, 1728, false, true).tier).toBe('balanced');
  expect(getEarthQuality({ ...gpu, maxTextureSize: 4096 }, 1728, false, false).tier).toBe(
    'balanced',
  );
  expect(getEarthQuality(gpu, 1024, true, false).tier).toBe('mobile');
  expect(getEarthQuality(gpu, 390, false, false).tier).toBe('mobile');
});
