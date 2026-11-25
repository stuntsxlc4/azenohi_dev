import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { Group } from 'three';
import { App } from '../../app/App';

const lifecycle = vi.hoisted(() => ({
  frame: (_state: unknown, _delta: number) => {},
  viewport: { width: 16, height: 9, dpr: 2 },
  size: { width: 1440 },
  gl: { capabilities: { maxTextureSize: 16384, getMaxAnisotropy: () => 16 } },
  camera: { position: { x: 0, y: 0, z: 10, set: vi.fn<() => void>() } },
  invalidate: () => {},
  canvasDpr: vi.fn<(value: number) => void>(),
}));
const canvas = document.createElement('canvas');
const nodes = { Rotor: new Group(), Spindle: new Group() };
vi.mock('./Planet', () => ({ Planet: () => null })); // Texture selection and orbital transforms have their own tests.
vi.mock('@react-three/drei', () => ({
  useGLTF: () => ({ nodes }),
  Environment: ({ children }: { children: ReactNode }) => <>{children}</>,
  Lightformer: () => null,
}));
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: typeof lifecycle.frame) => {
    lifecycle.frame = callback;
  },
  useThree: (select: (state: { viewport: typeof lifecycle.viewport }) => unknown) =>
    select(lifecycle),
  Canvas: ({
    onCreated,
    children,
    dpr,
  }: {
    onCreated: (state: { gl: { domElement: HTMLCanvasElement } }) => void;
    children: ReactNode;
    dpr: number;
  }) => {
    lifecycle.canvasDpr(dpr);
    lifecycle.viewport.dpr = dpr;
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
it('keeps the station still for reduced motion, budgets DPR and switches to the poster on context loss', async () => {
  vi.stubGlobal('WebGL2RenderingContext', Object);
  const media = Object.assign(new EventTarget(), { matches: true });
  vi.stubGlobal('devicePixelRatio', 2);
  vi.stubGlobal('matchMedia', (query: string) =>
    query.includes('reduced-motion') ? media : { matches: false },
  );
  lifecycle.size.width = 1440;
  const { container } = render(<App />);
  const play = await screen.findByRole('button', { name: 'Play animation' });
  expect(lifecycle.canvasDpr).toHaveBeenLastCalledWith(2);
  const ring = container.querySelector('[name="habitat-ring"]');
  const carrier = container.querySelector('[name="station-carrier"]');
  const rotor = { z: 0 },
    position = { y: 0 };
  Object.defineProperty(ring, 'rotation', { value: rotor });
  Object.defineProperties(carrier, {
    position: { value: position },
    rotation: { value: { z: 0 } },
  });
  const state = {
    camera: { position: { x: 0, y: 0, z: 10, set: vi.fn<() => void>() } },
    viewport: lifecycle.viewport,
  };
  lifecycle.frame(state, 1);
  expect(rotor.z).toBe(0);
  lifecycle.viewport.width = 5;
  fireEvent.click(play);
  lifecycle.frame(state, 1);
  expect(rotor.z).toBeCloseTo(-0.056);
  expect(position.y).toBeGreaterThan(0);
  for (let i = 0; i < 400; i++) lifecycle.frame(state, 0.05);
  expect(lifecycle.canvasDpr).toHaveBeenLastCalledWith(2);
  lifecycle.size.width = 700;
  fireEvent.click(screen.getByRole('button', { name: 'Pause animation' }));
  fireEvent.click(screen.getByRole('button', { name: 'Play animation' }));
  expect(lifecycle.canvasDpr).toHaveBeenLastCalledWith(1.5);
  lifecycle.canvasDpr.mockClear();
  // A slow startup is excluded. Only sustained low throughput after warmup reduces DPR.
  for (let i = 0; i < 210; i++) lifecycle.frame(state, 0.05);
  expect(lifecycle.canvasDpr).not.toHaveBeenCalled();
  act(() => {
    for (let i = 0; i < 140; i++) lifecycle.frame(state, 0.05);
  });
  expect(lifecycle.canvasDpr).toHaveBeenLastCalledWith(1.25);

  act(() => {
    for (let i = 0; i < 1100; i++) lifecycle.frame(state, 0.015);
  });
  expect(lifecycle.canvasDpr).toHaveBeenLastCalledWith(1.5);
  await act(() => media.dispatchEvent(new Event('change')));
  expect(screen.getByRole('button', { name: 'Play animation' })).toBeInTheDocument();
  await act(() => canvas.dispatchEvent(new Event('webglcontextlost')));
  expect(screen.queryByTestId('scene')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Hybrid Intelligence' })).toBeVisible();
});

it('keeps the declared mobile buffer capped from startup through readiness and motion changes', async () => {
  lifecycle.size.width = 390;
  vi.stubGlobal('WebGL2RenderingContext', Object);
  vi.stubGlobal('devicePixelRatio', 3);
  const media = Object.assign(new EventTarget(), { matches: true });
  vi.stubGlobal('matchMedia', () => media);
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Play animation' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pause animation' }));
  expect(lifecycle.canvasDpr.mock.calls.length).toBeGreaterThan(1);
  expect(new Set(lifecycle.canvasDpr.mock.calls.flat())).toEqual(new Set([1.5]));
});

it('reframes the mounted, paused scene for desktop and portrait Projects', async () => {
  vi.stubGlobal('WebGL2RenderingContext', Object);
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: true }));
  lifecycle.viewport.width = 16;
  lifecycle.viewport.height = 9;
  const { container } = render(<App />);
  await screen.findByRole('button', { name: 'Play animation' });
  const station = container.querySelector('[name="station-carrier"]');
  fireEvent.click(screen.getByRole('link', { name: 'Explore projects' }));
  expect(lifecycle.camera.position.set).toHaveBeenLastCalledWith(0, -9 * 0.17, 10);
  lifecycle.viewport.width = 5;
  fireEvent.click(screen.getByRole('link', { name: 'Team' }));
  fireEvent.click(screen.getByRole('link', { name: 'Projects' }));
  expect(lifecycle.camera.position.set).toHaveBeenLastCalledWith(0, -9 * 0.3, 10);
  expect(container.querySelector('[name="station-carrier"]')).toBe(station);
  lifecycle.viewport.width = 16;
  history.replaceState(null, '', '/');
});
