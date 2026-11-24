import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import {
  type Mesh,
  type ShaderMaterial,
  RedFormat,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from 'three';

import { EarthAtmosphere } from './EarthAtmosphere';
import { SolarDisc } from './SolarDisc';

const initialTerrain = -1.9;
const initialClouds = -1.21;
const tau = 2 * Math.PI;

const sphereVertex = /* glsl */ `
varying vec2 mapUV;
varying vec3 worldNormal;
varying vec3 worldEast;
void main() {
  mapUV = uv;
  worldNormal = normalize(mat3(modelMatrix) * normal);
  float longitude = uv.x * 6.2831853 - 3.14159265;
  vec3 east = vec3(-sin(longitude),0.,-cos(longitude));
  worldEast = normalize(mat3(modelMatrix) * east);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Convert a tangent-plane direction into equirectangular UV displacement per planet radius.
const tangentUV = /* glsl */ `
vec2 projectedDirection(vec3 direction, vec3 east, vec3 north, float v) {
  return vec2(dot(direction,east)/(6.2831853*max(sin(v*3.14159265),0.02)),
              dot(direction,north)/3.14159265);
}`;

const surfaceFragment = /* glsl */ `
uniform sampler2D albedoMap;
uniform sampler2D lightsMap;
uniform sampler2D reliefOceanMap;
uniform sampler2D densityMap;
uniform float cloudOffset;
uniform vec3 sun;
varying vec2 mapUV;
varying vec3 worldNormal;
varying vec3 worldEast;
${tangentUV}
void main() {
  vec3 radial = normalize(worldNormal);
  vec3 east = normalize(worldEast);
  vec3 north = normalize(cross(radial,east));
  vec3 packedData = texture2D(reliefOceanMap,mapUV).rgb;
  float water = smoothstep(0.03,0.97,packedData.b);
  vec2 slope = (packedData.rg - vec2(128./255.)) * 0.8;
  vec3 n = normalize(radial + (1.-water)*(east*slope.x + north*slope.y));
  vec3 viewRay = normalize(vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2]));
  float mu = dot(radial,sun);
  float daylight = smoothstep(-0.14,0.15,mu);
  float illumination = max(dot(n,sun),0.0);
  vec3 albedo = texture2D(albedoMap,mapUV).rgb;

  // Trace the solar direction through the elevated cloud sphere. Shadow coordinates
  // use the actual longitude difference between the two independently rotating meshes.
  vec2 alongSun = projectedDirection(sun,east,north,mapUV.y);
  float rayToCloud = sqrt(max(mu,0.)*max(mu,0.)+0.00130)-max(mu,0.);
  float cloudDensity = texture2D(densityMap,mapUV+vec2(cloudOffset,0.)+alongSun*rayToCloud).r;
  float transmittance = exp(-2.0 * cloudDensity * cloudDensity);
  vec3 direct = illumination * transmittance * vec3(1.95,1.65,1.50);
  vec3 sky = mix(vec3(0.072,0.13,0.195),vec3(0.20,0.29,0.43),daylight);
  vec3 ground = albedo * (sky + direct);

  // Dielectric Fresnel + a rough-ocean microfacet lobe restricted to measured water.
  float noV = max(dot(radial,viewRay),0.);
  float fresnelSky = 0.020+0.98*pow(1.-noV,5.);
  vec3 halfVector = normalize(viewRay+sun);
  float noH = max(dot(radial,halfVector),0.);
  float alpha2 = 0.012;
  float denominator = noH*noH*(alpha2-1.)+1.;
  float distribution = alpha2/(3.14159265*denominator*denominator);
  // Schlick Fresnel for air/water (IOR 1.333) and height-correlated Smith GGX
  // visibility. The visibility term includes the microfacet BRDF denominator.
  float noL = max(mu,0.);
  float voH = clamp(dot(viewRay,halfVector),0.,1.);
  float fresnelSun = 0.0204 + 0.9796*pow(1.-voH,5.);
  float lambdaV = noL*sqrt(alpha2 + (1.-alpha2)*noV*noV);
  float lambdaL = noV*sqrt(alpha2 + (1.-alpha2)*noL*noL);
  float visibility = 0.5/max(lambdaV+lambdaL,0.0001);
  // Extinction along the grazing incident ray warms and attenuates the reflected beam.
  vec3 solarBeam = 0.76 * exp(-vec3(.048,.102,.204)/max(.024,noL));
  vec3 glint = solarBeam*noL*distribution*fresnelSun*visibility*transmittance;
  ground += water * (vec3(0.032,0.080,0.145)*fresnelSky + glint);

  float electricity = texture2D(lightsMap,mapUV).r;
  float district = textureLod(lightsMap,mapUV,1.6).r;
  float focused = max(0.,electricity + .68*(electricity-district));
  vec3 cityRadiance = mix(vec3(1.95,.82,.27),vec3(4.4,3.10,1.95),smoothstep(.06,.70,focused));
  ground += (pow(focused,1.06) + .055*district) * cityRadiance * (1.-daylight);
  gl_FragColor = vec4(ground,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const cloudFragment = /* glsl */ `
uniform sampler2D densityMap;
uniform vec3 sun;
varying vec2 mapUV;
varying vec3 worldNormal;
varying vec3 worldEast;
${tangentUV}
void main() {
  vec2 texel = 1.0/vec2(textureSize(densityMap,0));
  vec3 n = normalize(worldNormal);
  vec3 east = normalize(worldEast);
  vec3 north = normalize(cross(n,east));
  float density = texture2D(densityMap,mapUV).r;
  vec2 gradients = vec2(texture2D(densityMap,mapUV+vec2(texel.x,0.)).r -
                       texture2D(densityMap,mapUV-vec2(texel.x,0.)).r,
                       texture2D(densityMap,mapUV+vec2(0.,texel.y)).r -
                       texture2D(densityMap,mapUV-vec2(0.,texel.y)).r);
  vec3 cloudNormal = normalize(n-1.5*(east*gradients.x + north*gradients.y));
  vec2 upSun = projectedDirection(sun,east,north,mapUV.y) * 0.007;
  float upstream = texture2D(densityMap,mapUV+upSun).r;
  float shadow = exp(-3.2*max(upstream-density,0.));
  float incidence = dot(n,sun);
  float localLight = max(dot(cloudNormal,sun),0.);
  float twilight = smoothstep(-0.28,0.15,incidence);
  // The deck is illuminated by a hemisphere of skylight even on its shaded side.
  // Ice and liquid water scatter near-neutrally; the skylight carries the blue tint.
  vec3 sky = mix(vec3(.163,.213,.27),vec3(.51,.55,.59),twilight);
  float softDensity = textureLod(densityMap,mapUV,2.0).r;
  float ridge = clamp(3.1*(density-upstream) + 1.8*(density-softDensity),-.38,.90);
  vec3 sunset = mix(vec3(1.42,.80,.44),vec3(1.75,1.55,1.36),smoothstep(.015,.24,incidence));
  vec3 light = sky * (.64+.44*density+.32*ridge) + sunset*localLight*shadow;
  // Forward illumination catches the crests of optically thick clouds near the limb.
  float silverLining = smoothstep(-.069,.12,incidence) * max(0.,ridge) * density;
  light += silverLining * vec3(.48,.52,.55);
  // Thin cirrus transmits the ground; dense storm systems remain optically thick.
  float opacity = 1.-exp(-3.0*pow(density,1.20));
  gl_FragColor = vec4(light,opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function Planet({ moving }: { moving: boolean }) {
  const groundShader = useRef<ShaderMaterial>(null);
  const terrain = useRef<Mesh>(null);
  const clouds = useRef<Mesh>(null);
  const { width, height } = useThree((state) => state.viewport);
  const detailed = useThree(
    (state) =>
      state.size.width >= 1440 &&
      state.gl.capabilities.maxTextureSize >= 8192 &&
      state.gl.capabilities.getMaxAnisotropy() >= 8,
  );
  const cloudResolution = useThree((state) => (state.size.width >= 1024 ? 4 : 2));
  const anisotropy = useThree((state) => Math.min(8, state.gl.capabilities.getMaxAnisotropy()));
  const [albedo, lights, density, reliefOcean] = useTexture(
    [
      detailed ? '/home/planet/albedo-8k.webp' : '/home/planet/albedo-4k.webp',
      detailed ? '/home/planet/lights-8k.webp' : '/home/planet/lights.webp',
      `/home/planet/clouds-${detailed ? 8 : cloudResolution}k.webp`,
      detailed ? '/home/planet/relief-ocean-4k.webp' : '/home/planet/relief-ocean-2k.webp',
    ],
    (maps) => {
      maps.forEach((map, index) => {
        if (index === 0) map.colorSpace = SRGBColorSpace;
        else if (index === 1 || index === 2) map.format = RedFormat;
        map.wrapS = RepeatWrapping;
        map.anisotropy = anisotropy;
      });
    },
  );
  const portrait = width < height;
  const segments = detailed ? 192 : 128;
  const radius = Math.max(width * 2.41, height * 1.05);
  const centerX = width * 0.599;
  const centerY = height * (portrait ? -0.2 : 0.11573) - radius;
  const sunX = width * (portrait ? -0.36 : 0.08313);
  const normalX = (sunX - centerX) / radius;
  const sunDirection = useMemo(() => {
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
    }),
    [albedo, lights, density, reliefOcean, sunDirection],
  );
  useFrame((_, delta) => {
    if (!moving || !terrain.current || !clouds.current || !groundShader.current) return;
    terrain.current.rotation.y += delta * 0.006;
    clouds.current.rotation.y += delta * 0.0082;
    const phase = groundShader.current.uniforms['cloudOffset'];
    if (phase) phase.value = (terrain.current.rotation.y - clouds.current.rotation.y) / tau;
  });
  return (
    <>
      <group position={[centerX, centerY, -radius - 2]} scale={radius} rotation={[-0.36, 0, 0.08]}>
        <mesh name="earth-surface" ref={terrain} rotation={[0, initialTerrain, 0]}>
          <sphereGeometry args={[1, segments, segments / 2]} />
          <shaderMaterial
            ref={groundShader}
            vertexShader={sphereVertex}
            fragmentShader={surfaceFragment}
            uniforms={uniforms}
          />
        </mesh>
        <mesh
          name="earth-clouds"
          ref={clouds}
          scale={1.00065}
          rotation={[0, initialClouds, 0]}
          renderOrder={1}
        >
          <sphereGeometry args={[1, segments, segments / 2]} />
          <shaderMaterial
            vertexShader={sphereVertex}
            fragmentShader={cloudFragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
          />
        </mesh>
        <EarthAtmosphere sunDirection={sunDirection} segments={segments} />
      </group>
      <SolarDisc
        horizonAngle={Math.asin(-normalX)}
        position={[sunX, sunY + height * 0.0009, -1]}
        size={Math.max(width * 0.6, height * 0.48)}
      />
    </>
  );
}
