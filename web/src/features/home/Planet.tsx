import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import {
  type Mesh,
  type ShaderMaterial,
  LinearFilter,
  RedFormat,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from 'three';

import { EarthAtmosphere } from './EarthAtmosphere';
import { getEarthQuality } from './earthQuality';
import { cloudFragment, sphereVertex, surfaceFragment } from './earthShaders';
import { SolarDisc } from './SolarDisc';

const initialTerrain = -1.9;
const initialClouds = -1.21;
const tau = 2 * Math.PI;

export function Planet({ moving }: { moving: boolean }) {
  const groundShader = useRef<ShaderMaterial>(null);
  const terrain = useRef<Mesh>(null);
  const clouds = useRef<Mesh>(null);
  const { width, height } = useThree((state) => state.viewport);
  const quality = useThree((state) => getEarthQuality(state.gl.capabilities, state.size.width));
  const ultra = quality.tier === 'ultra';
  const hardwareAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());
  const anisotropy = ultra ? hardwareAnisotropy : Math.min(8, hardwareAnisotropy);
  const [albedo, lights, density, reliefOcean, atmosphere, regionAlbedo, regionLights] = useTexture(
    [
      `/home/planet/albedo-${quality.albedoK}k.webp`,
      quality.lightsK === 8 ? '/home/planet/lights-8k.webp' : '/home/planet/lights.webp',
      `/home/planet/clouds-${quality.cloudsK}k.webp`,
      `/home/planet/relief-ocean-${quality.reliefK}k.webp`,
      '/home/planet/atmosphere.png',
      ...(ultra ? ['/home/planet/europe-albedo.webp', '/home/planet/europe-lights.webp'] : []),
    ],
    (maps) => {
      maps.forEach((map, index) => {
        if (index === 4) {
          map.flipY = false;
          map.minFilter = map.magFilter = LinearFilter;
          map.generateMipmaps = false;
          return;
        }
        if (index === 0 || index === 5) map.colorSpace = SRGBColorSpace;
        if (index === 1 || index === 2 || index === 6) map.format = RedFormat;
        if (index < 4) map.wrapS = RepeatWrapping;
        if (map.anisotropy !== anisotropy) {
          map.anisotropy = anisotropy;
          map.needsUpdate = true;
        }
      });
    },
  );
  const surfaceDefines = useMemo(() => (ultra ? { REGIONAL_MAPS: 1 } : {}), [ultra]);
  const cloudDefines = useMemo(() => ({ CLOUD_STEPS: quality.cloudSteps }), [quality.cloudSteps]);
  const portrait = width < height;
  const segments = quality.segments;
  const radius = Math.max(width * 2.41, height * 1.05);
  const centerX = width * 0.599;
  const centerY = height * (portrait ? -0.2 : 0.11573) - radius;
  const sunX = width * (portrait ? -0.36 : 0.08313);
  const normalX = (sunX - centerX) / radius;
  const sunDirection = useMemo(() => {
    // Matches SUN_HORIZONTAL in build-earth-atmosphere.py. Rebake the LUT if this changes.
    const projectedLength = 0.129;
    return new Vector3(
      normalX * projectedLength,
      Math.sqrt(1 - normalX ** 2) * projectedLength,
      -Math.sqrt(1 - projectedLength ** 2),
    );
  }, [normalX]);
  const sunY = centerY + Math.sqrt(radius ** 2 - (sunX - centerX) ** 2);

  const uniforms = useMemo(
    () => ({
      sun: { value: sunDirection },
      reliefOceanMap: { value: reliefOcean },
      cloudOffset: { value: (initialTerrain - initialClouds) / tau },
      albedoMap: { value: albedo },
      lightsMap: { value: lights },
      densityMap: { value: density },
      regionAlbedo: { value: regionAlbedo },
      regionLights: { value: regionLights },
    }),
    [albedo, lights, density, reliefOcean, regionAlbedo, regionLights, sunDirection],
  );
  useFrame((_, delta) => {
    if (!terrain.current || !clouds.current || !groundShader.current) return;
    if (moving) {
      terrain.current.rotation.y += delta * 0.006;
      clouds.current.rotation.y += delta * 0.0082;
    }
    // A tier switch rebuilds the shader even in demand mode. Restore the
    // current shadow longitude on that first rendered frame, including paused views.
    const phase = groundShader.current.uniforms['cloudOffset'];
    if (phase) phase.value = (terrain.current.rotation.y - clouds.current.rotation.y) / tau;
  });
  return (
    <>
      <group position={[centerX, centerY, -radius - 2]} scale={radius} rotation={[-0.36, 0, 0.08]}>
        <mesh name="earth-surface" ref={terrain} rotation={[0, initialTerrain, 0]}>
          <sphereGeometry args={[1, segments, segments / 2]} />
          <shaderMaterial
            key={quality.tier}
            ref={groundShader}
            vertexShader={sphereVertex}
            fragmentShader={surfaceFragment}
            defines={surfaceDefines}
            uniforms={uniforms}
          />
        </mesh>
        <mesh
          name="earth-clouds"
          ref={clouds}
          scale={1.0015}
          rotation={[0, initialClouds, 0]}
          renderOrder={1}
        >
          <sphereGeometry args={[1, segments, segments / 2]} />
          <shaderMaterial
            vertexShader={sphereVertex}
            key={quality.tier}
            fragmentShader={cloudFragment}
            defines={cloudDefines}
            uniforms={uniforms}
            transparent
            depthWrite={false}
          />
        </mesh>
        {atmosphere && (
          <EarthAtmosphere lookup={atmosphere} sunDirection={sunDirection} segments={segments} />
        )}
      </group>
      <SolarDisc
        horizonAngle={Math.asin(-normalX)}
        position={[sunX, sunY + height * 0.0009, -1]}
        size={Math.max(width * 0.6, height * 0.48)}
      />
    </>
  );
}
