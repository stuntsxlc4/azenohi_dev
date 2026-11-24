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
  float photosphere = 1.0 - smoothstep(0.0065-aa, 0.0065+aa, r);
  float visible = smoothstep(-0.002-aa, -0.002+aa, offset.y);
  float aureole = exp(-length(offset * vec2(0.67, 1.45)) * 42.0);
  float veil = exp(-length(offset * vec2(0.76, 1.26)) * 9.0);
  // Low-angle haze lights the sky above the limb. The weaker optical flare
  // below it leaves the cloud filaments and city lights visible.
  float skyWeight = mix(0.16, 1.0, smoothstep(-0.078,0.004,offset.y));
  float streak = exp(-abs(offset.y)*295.0 - abs(offset.x)*18.0);
  float opacity = (1.0 - smoothstep(0.33,0.49,length(offset))) *
    (skyWeight*(1.30*veil + 1.32*aureole) + 0.68*streak + photosphere*visible);
  // A copper core fades through coral into the cooler twilight sky.
  vec3 radiance = mix(vec3(0.85,0.038,0.094),vec3(1.28,0.143,0.038),veil*veil)
    + pow(aureole,1.24)*vec3(3.15,1.42,0.44)
    + streak*vec3(2.8,1.73,0.68) + photosphere*visible*vec3(13.0,10.0,6.7);
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
