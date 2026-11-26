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

const skyVertex = /* glsl */ `
uniform vec4 artFrame;
varying vec2 artUV;
void main() {
  // The orbital camera is orthographic. Reconstruct world XY on its far plane
  // so resizing or camera parallax moves the sky and atmospheric edge together.
  vec2 cameraXY = (position.xy - projectionMatrix[3].xy) /
    vec2(projectionMatrix[0][0], projectionMatrix[1][1]);
  artUV = (cameraXY + cameraPosition.xy - artFrame.xy) / artFrame.zw + 0.5;
  gl_Position = vec4(position.xy, 1., 1.);
}`;

const skyFragment = /* glsl */ `
uniform sampler2D dawn;
varying vec2 artUV;
void main() {
  // The portrait framing can extend above the painting. Fade the sky edge
  // into the shell behind the transparent canvas instead of stretching stars.
  vec2 outside = max(max(-artUV, artUV - 1.), 0.);
  float alpha = 1. - smoothstep(0., 0.12, max(outside.x, outside.y));
  gl_FragColor = vec4(texture2D(dawn, clamp(artUV, 0., 1.)).rgb, alpha);
  #include <colorspace_fragment>
}`;

interface ReferenceSkyProps {
  map: Texture;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export function ReferenceSky({ map, centerX, centerY, width, height }: ReferenceSkyProps) {
  const uniforms = useMemo(
    () => ({ dawn: { value: map }, artFrame: { value: [centerX, centerY, width, height] } }),
    [map, centerX, centerY, width, height],
  );
  return (
    <mesh name="dawn-sky" renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={skyVertex}
        fragmentShader={skyFragment}
        uniforms={uniforms}
        transparent
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}
