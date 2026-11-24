import { useMemo } from 'react';
import type { Vector3 } from 'three';

const vertex = /* glsl */ `
varying vec3 radial;
varying vec3 worldPosition;
void main() {
  radial = normalize(mat3(modelMatrix) * position);
  worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Distances are in Earth radii. The cut-off is 76 km and the density scale
// heights are 8 km for air molecules and 1.2 km for boundary-layer aerosols.
const fragment = /* glsl */ `
uniform vec3 sun;
varying vec3 radial;
varying vec3 worldPosition;
const float outerRadius = 1.012;
const float pi = 3.14159265;
const vec2 scaleHeights = vec2(0.001256, 0.000188);
const vec3 rayleigh = vec3(37.0, 86.0, 211.0);
const vec3 mie = vec3(7.5);
// Broad visible absorption bands of stratospheric ozone, RGB approximation.
const vec3 ozoneExtinction = vec3(19.0,8.5,1.2);
const vec3 aerosolExtinction = mie / 0.9;

vec3 extinction(vec2 columns) {
  return rayleigh * columns.x + aerosolExtinction * columns.y;
}

// Approximate the spherical exponential column toward the Sun. The expression
// approaches H/mu near zenith and sqrt(pi*r*H/2) at a tangent. For rays that
// pass their tangent, subtract the outward segment from the full chord.
vec2 solarColumns(float radius, float mu, vec2 density) {
  float cosine = abs(mu);
  vec2 airMass = 1.0 / (0.5*cosine + sqrt(0.25*cosine*cosine + 2.0*scaleHeights/(pi*radius)));
  vec2 outward = density * scaleHeights * airMass;
  if (mu >= 0.0) return outward;
  float tangent = radius * sqrt(max(0.0,1.0 - mu*mu));
  vec2 closestDensity = exp(-max(0.0,tangent - 1.0)/scaleHeights);
  return max(vec2(0.0),closestDensity * sqrt(2.0*pi*radius*scaleHeights) - outward);
}

void main() {
  vec3 back = normalize(vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2]));
  vec3 viewRay = isOrthographic ? -back : normalize(worldPosition-cameraPosition);
  vec3 entry = normalize(radial)*outerRadius;
  float closest = -dot(entry, viewRay);
  float impact2 = max(0.0,outerRadius*outerRadius - closest*closest);
  float distanceInAir = 2.0*closest;
  if (impact2 < 1.0) distanceInAir = closest - sqrt(1.0 - impact2);
  if (distanceInAir <= 0.0) discard;

  float cosTheta = dot(viewRay,sun);
  float phaseR = 3.0/(16.0*pi) * (1.0+cosTheta*cosTheta);
  const float g = 0.77;
  float phaseM = (1.0-g*g)/(4.0*pi*pow(1.0+g*g-2.0*g*cosTheta,1.5));
  // Orthographic view rays are parallel. Use the Sun's projected azimuth
  // around the limb to confine the aureole of low-altitude aerosols to sunrise.
  vec3 skySun = sun - back*dot(sun,back);
  vec3 skyRadial = entry - back*dot(entry,back);
  float arc = dot(skySun,skyRadial)/max(length(skySun)*length(skyRadial),1e-5);
  float aureole = 0.10+0.90*exp(-750.0*max(0.0,1.0-arc));
  vec3 light = vec3(0.0);
  float ozonePath = 0.0;
  vec2 path = vec2(0.0);
  float stepLength = distanceInAir/float(ATMOSPHERE_STEPS);

  for (int i=0; i<ATMOSPHERE_STEPS; i++) {
    vec3 p = entry + viewRay*((float(i)+0.5)*stepLength);
    float radius = length(p);
    vec2 density = exp(-max(radius-1.0,0.0)/scaleHeights);
    vec2 segment = density*stepLength;
    float mu = dot(p,sun)/radius;
    float horizon = -sqrt(max(0.0,1.0-1.0/(radius*radius)));
    // Angular radius of the solar disc is roughly 0.27 degrees.
    float visibility = smoothstep(horizon-0.0047,horizon+0.0047,mu);
    vec2 airToSun = solarColumns(radius,mu,density);
    // Ozone concentration peaks around 24 km. Unlike sea-level aerosols,
    // it filters long tangent paths through otherwise very thin upper air.
    float altitude = max(0.0,radius-1.0);
    float ozoneHeight = (altitude-0.0037)/0.0023;
    float ozoneDensity = exp(-ozoneHeight*ozoneHeight);
    float ozoneSegment = ozoneDensity*stepLength;
    float ozoneToSun = 0.002*ozoneDensity/max(0.13,mu);
    vec3 tau = extinction(path+0.5*segment+airToSun)
      + (ozonePath+0.5*ozoneSegment+ozoneToSun)*ozoneExtinction;
    vec3 transmission = exp(-tau);
    light += visibility*transmission*(phaseR*rayleigh*segment.x+phaseM*aureole*mie*segment.y);
    path += segment;
    ozonePath += ozoneSegment;
  }

  vec3 transmission = exp(-extinction(path));
  float opacity = 1.0-dot(transmission,vec3(0.2126,0.7152,0.0722));
  if (opacity < 0.0005) discard;
  // Convert accumulated linear radiance to a source color for alpha compositing.
  // Directional irradiance exceeds display white before the renderer's tone curve.
  // Grade just the optical limb. At the tangent, a few kilometres of
  // vertical separation changes the traversed molecular column dramatically.
  float tangentAltitude = sqrt(impact2)-1.0;
  float limb = smoothstep(0.984,1.0,impact2);
  float crest = exp(-abs(tangentAltitude)/0.00085);
  vec3 illumination = vec3(6.2,6.7,7.2) * mix(vec3(1.0),vec3(1.7,0.50,1.0),limb);
  illumination *= 1.0 + vec3(0.36,0.50,0.61)*crest;
  opacity *= 1.0-0.24*smoothstep(0.0019,0.0062,tangentAltitude);
  gl_FragColor = vec4(illumination*light/max(opacity,0.0005),opacity);
  #include <tonemapping_fragment>
  // Preserve the rose-violet crest through the filmic shoulder, in display
  // linear space. Ground away from the silhouette retains its natural colors.
  gl_FragColor.rgb *= mix(vec3(1.0),vec3(1.0,0.36,0.52),smoothstep(0.984,0.999,impact2));
  #include <colorspace_fragment>
}`;

interface AtmosphereProps {
  segments: number;
  sunDirection: Vector3;
}

export function EarthAtmosphere({ segments, sunDirection }: AtmosphereProps) {
  const uniforms = useMemo(() => ({ sun: { value: sunDirection } }), [sunDirection]);
  const defines = useMemo(() => ({ ATMOSPHERE_STEPS: segments >= 160 ? 10 : 6 }), [segments]);
  return (
    <mesh name="earth-atmosphere" scale={1.012} renderOrder={2}>
      <sphereGeometry args={[1, segments, segments / 2]} />
      <shaderMaterial
        key={defines.ATMOSPHERE_STEPS}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        defines={defines}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
