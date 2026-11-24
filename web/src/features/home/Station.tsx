import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import type { RefObject } from 'react';
import type { Group } from 'three';

export function Station({ ring }: { ring: RefObject<Group | null> }) {
  const { nodes } = useGLTF('/home/orbital-habitat.glb');
  // Each mount owns its transforms while sharing the loader's geometry and materials.
  const parts = useMemo(
    () => ({ rotor: nodes['Rotor']!.clone(), spindle: nodes['Spindle']!.clone() }),
    [nodes],
  );
  return (
    <group rotation={[1.28, 0, 0.14, 'ZXY']} dispose={null}>
      <group name="habitat-ring" ref={ring}>
        <primitive object={parts.rotor} />
      </group>
      <primitive object={parts.spindle} />
    </group>
  );
}
