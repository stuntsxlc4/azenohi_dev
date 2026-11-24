const vertexShader = /* glsl */ `
varying vec2 offset;
void main() {
  offset = uv - 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = /* glsl */ `
varying vec2 offset;
void main() {
  // The x axis follows the local tangent of the horizon. Refraction compresses
  // the solar image vertically and the opaque limb eclipses its lower half.
  float r = length(offset * vec2(1.0, 1.45));
  float aa = max(fwidth(r), 0.00015);
  float photosphere = 1.0 - smoothstep(0.005-aa, 0.005+aa, r);
  float visible = smoothstep(-0.002-aa, -0.002+aa, offset.y);
  float aureole = exp(-length(offset * vec2(0.67, 1.6)) * 54.0);
  float veil = exp(-length(offset * vec2(0.85, 1.32)) * 10.0);
  // Low-angle haze lights the sky above the limb. The weaker optical flare
  // below it leaves the cloud filaments and city lights visible.
  float skyWeight = mix(0.26, 1.0, smoothstep(-0.034,0.006,offset.y));
  float streak = exp(-abs(offset.y)*295.0 - abs(offset.x)*18.0);
  float opacity = (1.0 - smoothstep(0.33,0.49,length(offset))) *
    (skyWeight*(1.3*veil + 1.4*aureole) + 0.68*streak + photosphere*visible);
  vec3 radiance = vec3(1.5,0.10,0.07) + aureole*vec3(2.7,0.50,0.17)
    + streak*vec3(2.1,0.66,0.38) + photosphere*visible*vec3(11.0,6.6,3.8);
  gl_FragColor = vec4(radiance, min(1.0,opacity));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function SolarDisc({
  position,
  size,
  horizonAngle,
}: {
  position: [number, number, number];
  size: number;
  horizonAngle: number;
}) {
  return (
    <mesh
      name="solar-disc"
      position={position}
      scale={size}
      rotation={[0, 0, horizonAngle]}
      renderOrder={3}
    >
      <planeGeometry />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
