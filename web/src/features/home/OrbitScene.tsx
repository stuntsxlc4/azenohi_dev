import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { ACESFilmicToneMapping, MathUtils, SRGBColorSpace } from 'three';
import { Group } from 'three';
import { Planet } from './Planet';
import { Station } from './Station';
import { getEarthQuality } from './earthQuality';

interface MotionProps {
  view?: 'home' | 'team' | 'projects' | 'detail' | 'caseStudy';
  moving: boolean;
  pointer: RefObject<{ x: number; y: number }>;
}

const landscapeFrames = {
  home: { cameraY: 0, stationX: 0.34, stationY: 0.24, scale: 0.25 },
  team: { cameraY: -0.17, stationX: 0.31, stationY: 0.14, scale: 0.18 },
  projects: { cameraY: -0.17, stationX: 0.33, stationY: 0.11, scale: 0.18 },
  detail: { cameraY: -0.13, stationX: 0.35, stationY: 0.16, scale: 0.17 },
  caseStudy: { cameraY: -0.15, stationX: 0.43, stationY: 0.19, scale: 0.09 },
};
const portraitFrames: typeof landscapeFrames = {
  home: { cameraY: 0, stationX: 0.19, stationY: 0.235, scale: 0.29 },
  team: { cameraY: -0.29, stationX: 0.28, stationY: -0.058, scale: 0.065 },
  projects: { cameraY: -0.3, stationX: 0.3, stationY: -0.1, scale: 0.075 },
  detail: { cameraY: -0.22, stationX: 0.28, stationY: 0.03, scale: 0.065 },
  caseStudy: { cameraY: -0.22, stationX: 0.36, stationY: 0.1, scale: 0.045 },
};

// A static reflection capture gives the hull warm sunward and cool Earth-facing highlights.
function ReflectedLight() {
  return (
    <Environment frames={1} resolution={64} environmentIntensity={0.54}>
      <Lightformer
        form="rect"
        position={[-5, 1, 1]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[2, 5, 1]}
        intensity={4.4}
        color="#ffa17b"
      />
      <Lightformer
        form="rect"
        position={[0, -4, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[9, 5, 1]}
        intensity={1.65}
        color="#82aacd"
      />
      <Lightformer
        form="rect"
        position={[1, 4, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[5, 3, 1]}
        intensity={1.7}
        color="#d3e4ef"
      />
    </Environment>
  );
}

function Orbit({
  moving,
  view = 'home',
  pointer,
  onReady,
  onDprChange,
}: MotionProps & {
  onReady: () => void;
  onDprChange: (dpr: number) => void;
}) {
  useEffect(onReady, [onReady]);
  const ring = useRef<Group>(null);
  const station = useRef<Group>(null);
  const flightTime = useRef(0);
  const frameMetrics = useRef({ seconds: 0, frames: 0 });
  const samples = useRef({ warmup: 0, seconds: 0, frames: 0 });
  const quality = useThree((s) => getEarthQuality(s.gl.capabilities, s.size.width));
  const nativeDpr = window.devicePixelRatio || 1;
  const targetDpr = quality.tier === 'ultra' ? nativeDpr : Math.min(nativeDpr, 1.5);
  useLayoutEffect(() => {
    onDprChange(targetDpr);
    samples.current = { warmup: 0, seconds: 0, frames: 0 };
  }, [onDprChange, targetDpr]);
  useEffect(() => {
    const reset = () => {
      samples.current = { warmup: 0, seconds: 0, frames: 0 };
    };
    if (moving) reset();
    document.addEventListener('visibilitychange', reset);
    return () => document.removeEventListener('visibilitychange', reset);
  }, [moving]);
  const { width, height } = useThree((state) => state.viewport);
  const portrait = width < height;
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  // Normalized placements keep the original orbital animation independent of route framing.
  const frames = portrait ? portraitFrames : landscapeFrames;
  const frame = frames[view];
  const routeY = height * frame.cameraY;
  const stationX = width * frame.stationX;
  const stationY = height * frame.stationY;
  const stationSize = Math.min(width * (portrait ? 0.18 : 0.154), height * frame.scale);
  const [mount] = useState(() => new Group());
  const placed = useRef(false);
  useLayoutEffect(() => {
    if (!placed.current || !moving) {
      mount.position.set(stationX, stationY, 1);
      mount.scale.setScalar(stationSize);
      camera.position.set(0, routeY, camera.position.z);
      placed.current = true;
      invalidate();
    }
  }, [camera, invalidate, mount, moving, routeY, stationX, stationY, stationSize]);
  useFrame((state, delta) => {
    if (!moving || !ring.current || !station.current) return;
    mount.position.set(
      MathUtils.damp(mount.position.x, stationX, 6, delta),
      MathUtils.damp(mount.position.y, stationY, 6, delta),
      1,
    );
    mount.scale.setScalar(MathUtils.damp(mount.scale.x, stationSize, 6, delta));
    flightTime.current += delta;
    if (flightTime.current > 8 && !document.hidden) {
      const metrics = frameMetrics.current;
      metrics.seconds += delta;
      metrics.frames += 1;
      if (metrics.seconds >= 5) {
        const canvas = state.gl?.domElement;
        if (canvas)
          canvas.dataset['frameSample'] = JSON.stringify({
            fps: metrics.frames / metrics.seconds,
            seconds: metrics.seconds,
            dpr: state.viewport.dpr,
            width: canvas.clientWidth,
            height: canvas.clientHeight,
          });
        metrics.seconds = 0;
        metrics.frames = 0;
      }
    }
    ring.current.rotation.z -= delta * 0.056;
    station.current.position.y = Math.sin(flightTime.current * 0.18) * height * 0.0018;
    station.current.rotation.z = Math.sin(flightTime.current * 0.095) * 0.008;
    state.camera.position.x = MathUtils.damp(
      state.camera.position.x,
      pointer.current.x * 0.034,
      5,
      delta,
    );
    state.camera.position.y = MathUtils.damp(
      state.camera.position.y,
      routeY - pointer.current.y * 0.023,
      5,
      delta,
    );
    // Start measuring only after the loaded, visible scene has animated for eight seconds.
    // A second eight-second window keeps a compile or tab switch from downgrading Retina.
    // Ultra keeps its native buffer even when the OS limits refresh on battery.
    if (quality.tier === 'ultra') return;
    const sample = samples.current;
    if (document.hidden || delta <= 0 || delta > 1) return;
    if (sample.warmup < 8) {
      sample.warmup += delta;
      return;
    }
    sample.seconds += delta;
    sample.frames++;
    if (sample.seconds < 8) return;
    const fps = sample.frames / sample.seconds;
    const dpr = state.viewport.dpr;
    const floor = Math.min(targetDpr, 1);
    if (fps < 42 && dpr > floor) onDprChange(Math.max(floor, dpr - 0.25));
    else if (fps > 58 && dpr < targetDpr) onDprChange(Math.min(targetDpr, dpr + 0.25));
    sample.seconds = 0;
    sample.frames = 0;
  });
  return (
    <>
      <Planet moving={moving} />
      <ReflectedLight />
      <hemisphereLight args={['#a4bbd0', '#526b84', 0.38]} />
      <directionalLight position={[-5, 1, 1.2]} intensity={2.55} color="#ffb88e" />
      <directionalLight position={[1, 2, -4]} intensity={1.55} color="#a0bdd7" />
      <primitive object={mount}>
        <group ref={station} name="station-carrier">
          <Station ring={ring} />
        </group>
      </primitive>
    </>
  );
}

export default function OrbitScene({
  moving,
  view = 'home',
  pointer,
  onReady,
  onFailure,
}: MotionProps & { onReady: () => void; onFailure: () => void }) {
  // Begin within the mobile budget until the actual renderer capabilities are known.
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.5));
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10], zoom: 80, near: 0.1, far: 500 }}
      dpr={dpr}
      frameloop={moving ? 'always' : 'demand'}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1,
        outputColorSpace: SRGBColorSpace,
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', onFailure, { once: true });
      }}
    >
      <Orbit view={view} moving={moving} pointer={pointer} onReady={onReady} onDprChange={setDpr} />
    </Canvas>
  );
}
