import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { SRGBColorSpace, Texture } from 'three';
import { App } from '../../app/App';

const lifecycle = vi.hoisted(() => ({
  frame: (_state: unknown, _delta: number) => {},
  width: 1200,
}));
const canvas = document.createElement('canvas');
const texture = new Texture();
vi.mock('@react-three/drei', () => ({
  useTexture: (_url: string, loaded: (value: Texture) => void) => {
    loaded(texture);
    return texture;
  },
}));
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: typeof lifecycle.frame) => {
    lifecycle.frame = callback;
  },
  useThree: (select: (state: { viewport: { width: number; height: number } }) => unknown) =>
    select({ viewport: { width: lifecycle.width, height: 800 } }),
  Canvas: ({
    onCreated,
    children,
  }: {
    onCreated: (state: { gl: { domElement: HTMLCanvasElement } }) => void;
    children: ReactNode;
  }) => {
    useEffect(() => {
      onCreated({ gl: { domElement: canvas } });
    }, [onCreated]);
    return <div data-testid="scene">{children}</div>;
  },
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('moves the planet and ring independently, respects reduced motion and falls back on context loss', async () => {
  vi.stubGlobal('WebGL2RenderingContext', Object);
  const media = Object.assign(new EventTarget(), { matches: true });
  vi.stubGlobal('matchMedia', () => media);
  const { container } = render(<App />);
  const play = await screen.findByRole('button', { name: 'Play animation' });
  // The DOM host stands in for the GPU. Give the two referenced mesh nodes Three-style transforms.
  const earth = container.querySelector('mesh[name="earth-surface"]');
  const ring = container.querySelector('group[name="habitat-ring"]');
  expect(earth).toBeTruthy();
  expect(ring).toBeTruthy();
  const earthRotation = { y: 2.5 },
    ringRotation = { z: 0 };
  Object.defineProperty(earth, 'rotation', { value: earthRotation });
  Object.defineProperty(ring, 'rotation', { value: ringRotation });
  lifecycle.frame(null, 2);
  expect(ringRotation.z).toBe(0);
  expect(texture.colorSpace).toBe(SRGBColorSpace);
  lifecycle.width = 390;
  fireEvent.click(play);
  lifecycle.frame(null, 2);
  expect(earthRotation.y).toBeCloseTo(2.532);
  expect(ringRotation.z).toBeCloseTo(-0.4);
  await act(() => media.dispatchEvent(new Event('change')));
  expect(screen.getByRole('button', { name: 'Play animation' })).toBeInTheDocument();
  await act(() => canvas.dispatchEvent(new Event('webglcontextlost')));
  expect(screen.queryByTestId('scene')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Hybrid Intelligence' })).toBeVisible();
});
