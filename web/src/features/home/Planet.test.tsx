import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Texture, SRGBColorSpace, NoColorSpace, RedFormat, RepeatWrapping } from 'three';

import { Planet } from './Planet';

const scene = vi.hoisted(() => ({
  frame: (_state: unknown, _delta: number) => {},
  viewport: { width: 1672 / 80, height: 941 / 80 },
  size: { width: 1672 },
  gl: { capabilities: { maxTextureSize: 8192, getMaxAnisotropy: () => 16 } },
}));
const textures = {
  albedo: new Texture(),
  lights: new Texture(),
  density: new Texture(),
  reliefOcean: new Texture(),
};
const urls = vi.fn<(value: string[]) => void>();
vi.mock('@react-three/drei', () => ({
  useTexture: (assets: string[], setup: (value: Texture[]) => void) => {
    urls(assets);
    setup(Object.values(textures));
    return Object.values(textures);
  },
}));
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: typeof scene.frame) => {
    scene.frame = callback;
  },
  useThree: (select: (value: typeof scene) => unknown) => select(scene),
}));

it('places sunrise on the curved limb and keeps city lights attached to the rotating ground while clouds drift', () => {
  const { container, rerender } = render(<Planet moving />);
  const terrain = container.querySelector('mesh[name="earth-surface"]');
  const cloud = container.querySelector('mesh[name="earth-clouds"]');
  expect(terrain).toBeTruthy();
  expect(cloud).toBeTruthy();
  const groundRotation = { y: 0 },
    cloudRotation = { y: 0 };
  const phase = { value: 0 };
  Object.defineProperty(terrain?.querySelector('shaderMaterial'), 'uniforms', {
    value: { cloudOffset: phase },
  });
  Object.defineProperty(terrain, 'rotation', { value: groundRotation });
  Object.defineProperty(cloud, 'rotation', { value: cloudRotation });
  expect(urls).toHaveBeenLastCalledWith(expect.arrayContaining(['/home/planet/albedo-8k.webp']));
  expect(textures.albedo.colorSpace).toBe(SRGBColorSpace);
  expect(textures.density.anisotropy).toBe(8);
  expect(textures.density.format).toBe(RedFormat);
  expect(textures.reliefOcean.colorSpace).toBe(NoColorSpace);
  expect(textures.reliefOcean.wrapS).toBe(RepeatWrapping);
  expect(urls).toHaveBeenLastCalledWith(
    expect.arrayContaining(['/home/planet/relief-ocean-4k.webp', '/home/planet/clouds-8k.webp']),
  );

  const plane = container.querySelector('planeGeometry')?.parentElement;
  const [x, y] = (plane?.getAttribute('position') ?? '').split(',').map(Number);
  expect((x ?? NaN) * 80 + 836).toBeCloseTo(975, 0);
  expect(Math.abs(470.5 - (y ?? NaN) * 80 - 455)).toBeLessThan(2);

  scene.frame(null, 1 / 30);
  scene.frame(null, 1 / 60);
  expect(groundRotation.y).toBeCloseTo(0.006 * 0.05, 7);
  expect(cloudRotation.y).toBeCloseTo(0.0082 * 0.05, 7);
  expect(phase.value).toBeCloseTo((groundRotation.y - cloudRotation.y) / (2 * Math.PI), 8);
  scene.viewport.width = 390 / 80;
  scene.size.width = 390;
  rerender(<Planet moving={false} />);
  scene.frame(null, 1);
  expect(groundRotation.y).toBeCloseTo(0.006 * 0.05, 7);
  expect(urls).toHaveBeenLastCalledWith(
    expect.arrayContaining(['/home/planet/albedo-4k.webp', '/home/planet/clouds-2k.webp']),
  );
});
