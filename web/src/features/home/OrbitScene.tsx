import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useRef } from 'react';
import { AdditiveBlending, BackSide, SRGBColorSpace } from 'three';
import type { Group, Mesh } from 'three';

const vertex = `varying vec3 n;
void main(){ n=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const atmosphere = `varying vec3 n;
void main(){ float edge=pow(clamp(1.+normalize(n).z,0.,1.),21.);
gl_FragColor=vec4(.36,.77,1., edge*.96); }`;
const flareVertex = `varying vec2 coord;
void main(){coord=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const flare = `varying vec2 coord;
void main(){float r=length(coord); float haze=exp(-r*9.); float core=exp(-r*95.);
float streak=exp(-abs(coord.y)*230.-abs(coord.x)*15.);
float a=clamp(haze+(core+streak)*1.6,0.,1.);
gl_FragColor=vec4(mix(vec3(1.,.37,.12),vec3(1.,.91,.64),clamp(core+streak,0.,1.)),a);}`;

const bays = Array.from({ length: 64 }, (_, i) => (i * Math.PI) / 32);

function Station({ ring }: { ring: React.RefObject<Group | null> }) {
  return (
    <group rotation={[1.28, 0, 0.14, 'ZXY']}>
      <group name="habitat-ring" ref={ring}>
        <mesh>
          <torusGeometry args={[1, 0.034, 12, 96]} />
          <meshStandardMaterial color="#85929b" metalness={0.55} roughness={0.42} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.8, 0.026, 8, 80]} />
          <meshStandardMaterial color="#adc8d3" />
        </mesh>
        {bays.map((angle, i) => (
          <group rotation={[0, 0, angle]} key={angle}>
            <mesh position={[0, 0.99, 0.018]}>
              <boxGeometry args={[0.094, 0.125, 0.124]} />
              <meshStandardMaterial
                color={i % 5 === 0 ? '#5a595a' : '#506075'}
                metalness={0.48}
                roughness={0.38}
              />
            </mesh>
            <mesh position={[0, 1.055, 0.035]}>
              <boxGeometry args={[0.048, 0.007, 0.012]} />
              <meshBasicMaterial color={i % 4 === 0 ? '#ffaf62' : '#73849a'} />
            </mesh>
            {i % 16 === 0 && (
              <mesh position={[0, 0.5, -0.016]}>
                <boxGeometry args={[0.052, 0.86, 0.065]} />
                <meshStandardMaterial color="#9dabb2" />
              </mesh>
            )}
          </group>
        ))}
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.12, 0.82, 12]} />
        <meshStandardMaterial color="#c2c9c7" metalness={0.48} />
      </mesh>
      {[-0.28, -0.14, 0.12, 0.26].map((z) => (
        <mesh position={[0, 0, z]} key={z}>
          <torusGeometry args={[0.16, 0.022, 8, 24]} />
          <meshStandardMaterial color="#537387" />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.35]}>
        <sphereGeometry args={[0.097, 16, 10]} />
        <meshStandardMaterial color="#843b24" metalness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.54]}>
        <boxGeometry args={[0.015, 0.015, 0.8]} />
        <meshStandardMaterial color="#d5dce4" />
      </mesh>
    </group>
  );
}

function Orbit({ moving }: { moving: boolean }) {
  const earth = useRef<Mesh>(null),
    ring = useRef<Group>(null);
  const { width: w, height: h } = useThree((s) => s.viewport);
  const texture = useTexture('/home/earth.jpg', (map) => {
    map.colorSpace = SRGBColorSpace;
  });
  const narrow = w < h;
  const radius = Math.max(w * 2.15, h * 1.05);
  const x = w * 0.66,
    y = h * (narrow ? -0.2 : 0.12) - radius;
  const sunX = w * (narrow ? 0.04 : 0.08);
  const sunY = y + Math.sqrt(radius * radius - (sunX - x) ** 2);
  useFrame((_, delta) => {
    if (moving && earth.current && ring.current) {
      earth.current.rotation.y += delta * 0.016;
      ring.current.rotation.z -= delta * 0.2;
    }
  });
  return (
    <>
      <ambientLight intensity={0.32} color="#a2c7ff" />
      <directionalLight position={[-3, 6, 2]} intensity={2.5} color="#eff5ff" />
      <directionalLight position={[2, 1, -2]} intensity={2} color="#ff8b4f" />
      <group position={[x, y, -radius - 2]} scale={radius} rotation={[0.28, 0, -0.36]}>
        <mesh name="earth-surface" ref={earth} rotation={[0, 2.5, 0]}>
          <sphereGeometry args={[1, 144, 96]} />
          <meshStandardMaterial map={texture} color="#aabacc" roughness={1} />
        </mesh>
        <mesh scale={1.0025}>
          <sphereGeometry args={[1, 144, 96]} />
          <shaderMaterial
            args={[
              {
                vertexShader: vertex,
                fragmentShader: atmosphere,
                side: BackSide,
                transparent: true,
                depthWrite: false,
                blending: AdditiveBlending,
              },
            ]}
          />
        </mesh>
      </group>
      <mesh position={[sunX, sunY, -1]} scale={w * 0.56}>
        <planeGeometry />
        <shaderMaterial
          args={[
            {
              vertexShader: flareVertex,
              fragmentShader: flare,
              transparent: true,
              depthWrite: false,
            },
          ]}
        />
      </mesh>
      <group
        position={[w * (narrow ? 0.19 : 0.31), h * (narrow ? 0.235 : 0.258), 1]}
        scale={Math.min(w * 0.154, h * 0.29)}
      >
        <Station ring={ring} />
      </group>
    </>
  );
}

export default function OrbitScene({
  moving,
  onReady,
  onFailure,
}: {
  moving: boolean;
  onReady: () => void;
  onFailure: () => void;
}) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10], zoom: 80, near: 0.1, far: 500 }}
      dpr={[1, 1.5]}
      frameloop={moving ? 'always' : 'demand'}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', onFailure, { once: true });
        onReady();
      }}
    >
      <Orbit moving={moving} />
    </Canvas>
  );
}
