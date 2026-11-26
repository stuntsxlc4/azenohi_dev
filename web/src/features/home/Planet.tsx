import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import {
  type Mesh,
  type ShaderMaterial,
  Euler,
  LinearFilter,
  Matrix3,
  Matrix4,
  RedFormat,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
  Vector4,
} from 'three';

import { EarthAtmosphere, ReferenceSky } from './EarthAtmosphere';
import { getEarthQuality } from './earthQuality';
import {
  cloudFragment,
  dawnSurfaceFragment,
  dawnSurfaceVertex,
  sphereVertex,
  surfaceFragment,
} from './earthShaders';
import { SolarDisc } from './SolarDisc';

const initialTerrain = -1.9;
const initialClouds = -1.21;
const tau = 2 * Math.PI;

const tilt = new Euler(-0.36, 0, 0.08);
const rotation = new Matrix4().makeRotationFromEuler(tilt);
const polarAxis = new Vector3(0, 1, 0).transformDirection(rotation);
const primeMeridian = new Vector3(1, 0, 0).cross(polarAxis).normalize();
const east = polarAxis.clone().cross(primeMeridian);
const restRotation = new Matrix3().setFromMatrix4(
  rotation.multiply(new Matrix4().makeRotationY(initialTerrain)),
);
// Orthographic fit to the reference horizon in the 1672 × 941 artwork.
// The opaque surface begins four pixels below the luminous atmospheric edge.
const dawnGlobe = new Vector4(1780 / 1672, 1 - 4161 / 941, 3818 / 1672, 1672 / 941);

export function Planet({
  moving,
  sunrise = false,
  cameraX = 0,
  cameraY = 0,
}: {
  moving: boolean;
  sunrise?: boolean;
  cameraX?: number;
  cameraY?: number;
}) {
  const groundShader = useRef<ShaderMaterial>(null);
  const terrain = useRef<Mesh>(null);
  const clouds = useRef<Mesh>(null);
  const { width, height } = useThree((state) => state.viewport);
  const quality = useThree((state) => getEarthQuality(state.gl.capabilities, state.size.width));
  const ultra = quality.tier === 'ultra';
  const hardwareAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());
  const anisotropy = ultra ? hardwareAnisotropy : Math.min(8, hardwareAnisotropy);
  const [albedo, lights, density, reliefOcean, atmosphere, dawn, regionAlbedo, regionLights] =
    useTexture(
      [
        `/home/planet/albedo-${quality.albedoK}k.webp`,
        quality.lightsK === 8 ? '/home/planet/lights-8k.webp' : '/home/planet/lights.webp',
        `/home/planet/clouds-${quality.cloudsK}k.webp`,
        `/home/planet/relief-ocean-${quality.reliefK}k.webp`,
        '/home/planet/atmosphere.png',
        '/home/planet/orbital-dawn.webp',
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
          if (index === 0 || index === 5 || index === 6) map.colorSpace = SRGBColorSpace;
          if (index === 1 || index === 2 || index === 7) map.format = RedFormat;
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
  const plateWidth = Math.max(width, height * (portrait ? 0.98 : dawnGlobe.w));
  const plateHeight = plateWidth / dawnGlobe.w;
  const plateX = cameraX + width * (portrait ? -0.18 : 0.07) - plateWidth * 0.07;
  const plateY = cameraY + height * (portrait ? -0.09 : 0.052) - plateHeight * 0.052;
  const radius = sunrise ? plateWidth * dawnGlobe.z : Math.max(width * 2.41, height * 1.05);
  const centerX = sunrise ? plateX + (dawnGlobe.x - 0.5) * plateWidth : width * 0.599;
  const centerY = sunrise
    ? plateY + (dawnGlobe.y - 0.5) * plateHeight
    : height * (portrait ? -0.2 : 0.11573) - radius;
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
      dawnMap: { value: dawn },
      restRotation: { value: restRotation },
      polarAxis: { value: polarAxis },
      primeMeridian: { value: primeMeridian },
      east: { value: east },
      globe: { value: dawnGlobe },
      reliefOceanMap: { value: reliefOcean },
      cloudOffset: { value: (initialTerrain - initialClouds) / tau },
      albedoMap: { value: albedo },
      lightsMap: { value: lights },
      densityMap: { value: density },
      regionAlbedo: { value: regionAlbedo },
      regionLights: { value: regionLights },
    }),
    [albedo, lights, density, reliefOcean, regionAlbedo, regionLights, sunDirection, dawn],
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
      {sunrise && dawn && (
        <ReferenceSky
          map={dawn}
          centerX={plateX}
          centerY={plateY}
          width={plateWidth}
          height={plateHeight}
        />
      )}
      <group position={[centerX, centerY, -radius - 2]} scale={radius} rotation={tilt}>
        <mesh name="earth-surface" ref={terrain} rotation={[0, initialTerrain, 0]}>
          <sphereGeometry args={[1, segments, segments / 2]} />
          <shaderMaterial
            key={sunrise ? 'dawn' : quality.tier}
            ref={groundShader}
            vertexShader={sunrise ? dawnSurfaceVertex : sphereVertex}
            fragmentShader={sunrise ? dawnSurfaceFragment : surfaceFragment}
            defines={surfaceDefines}
            uniforms={uniforms}
          />
        </mesh>
        <mesh
          name="earth-clouds"
          visible={!sunrise}
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
        {!sunrise && atmosphere && (
          <EarthAtmosphere lookup={atmosphere} sunDirection={sunDirection} segments={segments} />
        )}
      </group>
      {!sunrise && (
        <SolarDisc
          horizonAngle={Math.asin(-normalX)}
          position={[sunX, sunY + height * 0.0009, -1]}
          size={Math.max(width * 0.6, height * 0.48)}
        />
      )}
    </>
  );
}
