import * as THREE from "three";
import { usePlane } from "@react-three/cannon";
import { useMemo } from "react";

export function Ground() {
  // simple static plane at y = 0
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0] }));

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: 0xa3a3a3 });
    m.roughness = 0.9;
    return m;
  }, []);

  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[200, 200]} />
      {/* material via primitive avoids TS ‘attach’ typings fuss */}
      <primitive object={material} attach="material" />
    </mesh>
  );
}
