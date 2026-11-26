import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import {
  Texture,
  SRGBColorSpace,
  NoColorSpace,
  RedFormat,
  RepeatWrapping,
  ClampToEdgeWrapping,
  LinearFilter,
} from 'three';

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
  atmosphere: new Texture(),
  dawn: new Texture(),
  regionAlbedo: new Texture(),
  regionLights: new Texture(),
};
const urls = vi.fn<(value: string[]) => void>();
vi.mock('@react-three/drei', () => ({
  useTexture: (assets: string[], setup: (value: Texture[]) => void) => {
    urls(assets);
    const maps = Object.values(textures).slice(0, assets.length);
    setup(maps);
    return maps;
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
  expect(textures.density.anisotropy).toBe(16);
  expect(textures.regionLights.format).toBe(RedFormat);
  expect(textures.regionAlbedo.colorSpace).toBe(SRGBColorSpace);
  expect(textures.regionAlbedo.wrapS).toBe(ClampToEdgeWrapping);
  expect(textures.atmosphere.flipY).toBe(false);
  expect(textures.atmosphere.anisotropy).toBe(1);
  expect(textures.atmosphere.minFilter).toBe(LinearFilter);
  expect(textures.atmosphere.generateMipmaps).toBe(false);
  expect(urls).toHaveBeenLastCalledWith(
    expect.arrayContaining(['/home/planet/europe-albedo.webp', '/home/planet/europe-lights.webp']),
  );
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
  const originalShader = terrain?.querySelector('shaderMaterial');
  rerender(<Planet moving={false} />);
  const mobileShader = terrain?.querySelector('shaderMaterial');
  expect(mobileShader).not.toBe(originalShader);
  const mobilePhase = { value: NaN };
  Object.defineProperty(mobileShader, 'uniforms', { value: { cloudOffset: mobilePhase } });
  scene.frame(null, 1);
  expect(mobilePhase.value).toBeCloseTo(phase.value, 8);
  expect(groundRotation.y).toBeCloseTo(0.006 * 0.05, 7);
  expect(textures.density.anisotropy).toBe(8);
  expect(urls.mock.lastCall?.[0]).not.toContain('/home/planet/europe-lights.webp');
  expect(urls).toHaveBeenLastCalledWith(
    expect.arrayContaining(['/home/planet/albedo-4k.webp', '/home/planet/clouds-2k.webp']),
  );
  scene.size.width = 1672;
  scene.viewport.width = 1672 / 80;
  rerender(<Planet moving={false} />);
  const restoredShader = terrain?.querySelector('shaderMaterial');
  expect(restoredShader).not.toBe(mobileShader);
  const restoredPhase = { value: NaN };
  Object.defineProperty(restoredShader, 'uniforms', { value: { cloudOffset: restoredPhase } });
  scene.frame(null, 1);
  expect(restoredPhase.value).toBeCloseTo(phase.value, 8);
  expect(urls.mock.lastCall?.[0]).toContain('/home/planet/europe-albedo.webp');
});

it('shares the reference frame between the Home sky and globe and preserves the mounted terrain on navigation', () => {
  const { container, rerender } = render(<Planet moving={false} sunrise />);
  const mesh = container.querySelector('mesh[name="earth-surface"]');
  const material = mesh?.querySelector('shaderMaterial');
  expect(mesh).toBeTruthy();
  expect(textures.dawn.colorSpace).toBe(SRGBColorSpace);
  expect(container.querySelector('mesh[name="dawn-sky"]')).toBeTruthy();
  expect(container.querySelector('mesh[name="solar-disc"]')).toBeNull();
  expect(container.querySelector('mesh[name="earth-atmosphere"]')).toBeNull();
  expect(Number(mesh?.parentElement?.getAttribute('scale'))).toBeCloseTo(3818 / 80);
  rerender(<Planet moving={false} />);
  expect(container.querySelector('mesh[name="earth-surface"]')).toBe(mesh);
  expect(mesh?.querySelector('shaderMaterial')).not.toBe(material);
  expect(container.querySelector('mesh[name="dawn-sky"]')).toBeNull();
  expect(container.querySelector('mesh[name="earth-atmosphere"]')).toBeTruthy();
});
