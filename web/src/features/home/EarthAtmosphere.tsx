import { useMemo } from 'react';
import type { Texture, Vector3 } from 'three';

const vertex = /* glsl */ `
varying vec3 radial;
void main() {
  radial = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// The camera is orthographic and the solar elevation is fixed. Spherical
// symmetry leaves two independent dimensions for the atmospheric integral.
// The table is baked by scripts/build-earth-atmosphere.py in linear light.
const fragment = /* glsl */ `
uniform vec3 sun;
uniform sampler2D opticalMap;
varying vec3 radial;
void main() {
  vec3 back = vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
  vec3 normal = normalize(radial);
  vec3 projected = normal - back*dot(normal,back);
  float radius = length(projected)*1.012;
  vec3 sunlight = sun - back*dot(sun,back);
  float azimuth = dot(projected,sunlight)/max(length(projected)*length(sunlight),1e-6);
  float halfSine = sqrt(clamp(0.5*(1.0-azimuth),0.0,1.0));

  // Two adjacent ranges resolve the change from a ground intersection to a
  // full tangent chord. Sample texel centers on each side of the discontinuity.
  float column = radius < 1.0
    ? 175.0*(1.0-sqrt(1.0-radius))
    : 176.0 + 79.0*sqrt(clamp((radius-1.0)/0.012,0.0,1.0));
  float u = (column+0.5)/256.0;
  vec3 transmission = texture2D(opticalMap,vec2(u,0.5/97.0)).rgb;
  float opacity = 1.0-dot(transmission,vec3(0.2126,0.7152,0.0722));
  if (opacity < 0.001) discard;
  vec3 encoded = texture2D(opticalMap,vec2(u,(1.5+95.0*halfSine)/97.0)).rgb;
  vec3 inscatter = 4.0*encoded*encoded;
  vec3 source = inscatter/opacity;
  // Warm the grazing light near the solar azimuth; retain the blue upper limb.
  float twilight = (1.0-smoothstep(0.013,0.085,halfSine))
    * smoothstep(0.987,1.0,radius) * (1.0-smoothstep(1.003,1.010,radius));
  source += twilight * vec3(0.48,0.072,0.065);
  gl_FragColor = vec4(source,opacity);
  #include <tonemapping_fragment>
  // Retain part of the molecular spectrum in the filmic highlight shoulder.
  // Compressing each channel independently turns the brightest blue air gray.
  const vec3 luma = vec3(0.2126,0.7152,0.0722);
  float mappedLuminance = dot(gl_FragColor.rgb,luma);
  vec3 chromatic = min(vec3(1.0),source*mappedLuminance/max(dot(source,luma),1e-5));
  gl_FragColor.rgb = mix(gl_FragColor.rgb,chromatic,0.38);
  #include <colorspace_fragment>
}`;

interface AtmosphereProps {
  segments: number;
  sunDirection: Vector3;
  lookup: Texture;
}

export function EarthAtmosphere({ segments, sunDirection, lookup }: AtmosphereProps) {
  const uniforms = useMemo(
    () => ({ sun: { value: sunDirection }, opticalMap: { value: lookup } }),
    [sunDirection, lookup],
  );
  return (
    <mesh name="earth-atmosphere" scale={1.012} renderOrder={2}>
      <sphereGeometry args={[1, segments, segments / 2]} />
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
