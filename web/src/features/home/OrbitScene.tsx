import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { ACESFilmicToneMapping, MathUtils, SRGBColorSpace } from 'three';
import type { Group } from 'three';
import { Planet } from './Planet';
import { Station } from './Station';

interface MotionProps {
  moving: boolean;
  pointer: RefObject<{ x: number; y: number }>;
}

const maxDpr = 1.75;

// A static reflection capture gives the hull warm sunward and cool Earth-facing highlights.
function ReflectedLight() {
  return (
    <Environment frames={1} resolution={64} environmentIntensity={0.54}>
      <Lightformer
        form="rect"
        position={[-5, 1, 1]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[2, 5, 1]}
        intensity={4}
        color="#ffd9ae"
      />
      <Lightformer
        form="rect"
        position={[0, -4, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[9, 5, 1]}
        intensity={1.5}
        color="#92afd1"
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

function Orbit({ moving, pointer, onReady }: MotionProps & { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  const ring = useRef<Group>(null);
  const station = useRef<Group>(null);
  const flightTime = useRef(0);
  const samples = useRef({ seconds: 0, frames: 0 });
  const { width, height } = useThree((state) => state.viewport);
  const portrait = width < height;
  useFrame((state, delta) => {
    if (!moving || !ring.current || !station.current) return;
    flightTime.current += delta;
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
      -pointer.current.y * 0.023,
      5,
      delta,
    );
    // Sample sustained frame time, skipping the first long frame after resuming a hidden tab.
    if (delta > 0 && delta < 0.5) {
      samples.current.frames++;
      samples.current.seconds += delta;
      if (samples.current.seconds >= 2.5) {
        const fps = samples.current.frames / samples.current.seconds;
        const dpr = state.viewport.dpr;
        const cap = Math.min(window.devicePixelRatio, maxDpr);
        // Keep at least one sample per CSS pixel unless sustained throughput is below 24 fps.
        const floor = fps < 24 ? 0.8 : 1;
        if (fps < 36 && dpr > floor) state.setDpr(Math.max(floor, dpr - 0.25));
        else if (fps > 57 && dpr < cap) state.setDpr(Math.min(cap, dpr + 0.25));
        samples.current = { seconds: 0, frames: 0 };
      }
    }
  });
  return (
    <>
      <Planet moving={moving} />
      <ReflectedLight />
      <hemisphereLight args={['#9eb9d3', '#637b9e', 0.4]} />
      <directionalLight position={[-5, 1, 1.2]} intensity={2.65} color="#ffce93" />
      <directionalLight position={[1, 2, -4]} intensity={1.5} color="#a9c1db" />
      <group
        position={[width * (portrait ? 0.19 : 0.31), height * (portrait ? 0.235 : 0.258), 1]}
        scale={Math.min(width * (portrait ? 0.18 : 0.154), height * 0.29)}
      >
        <group ref={station} name="station-carrier">
          <Station ring={ring} />
        </group>
      </group>
    </>
  );
}

export default function OrbitScene({
  moving,
  pointer,
  onReady,
  onFailure,
}: MotionProps & { onReady: () => void; onFailure: () => void }) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10], zoom: 80, near: 0.1, far: 500 }}
      dpr={[1, maxDpr]}
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
      <Orbit moving={moving} pointer={pointer} onReady={onReady} />
    </Canvas>
  );
}
