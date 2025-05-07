import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { Suspense, useMemo, useRef, useState } from "react";
import SceneController from "./components/SceneController";
import { Vector3 } from "three";
import UiOverlay from "./components/UiOverlay";
import "./index.css";

/** How many gorillas to spawn (100 feels good on modern GPUs) */
const GORILLA_COUNT = 100;

export default function App3D() {
  const [winner, setWinner] = useState<"Man" | "Gorillas" | null>(null);
  const resetFlag = useRef(0); // bump to force React to rerender ragdolls

  // positions for initial spawn
  const spawnPositions = useMemo(() => {
    const positions: Vector3[] = [];
    const center = new Vector3(6, 0, 0);
    const radius = 7;
    for (let i = 0; i < GORILLA_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / GORILLA_COUNT;
      const r = radius * (0.6 + 0.4 * Math.random());
      positions.push(
        new Vector3(
          center.x + Math.cos(angle) * r,
          0,
          center.z + Math.sin(angle) * r,
        ),
      );
    }
    return positions;
  }, []);

  return (
    <>
      <Canvas shadows camera={{ position: [0, 8, 18], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight
          castShadow
          position={[5, 15, 5]}
          intensity={0.9}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Physics gravity={[0, -25, 0]} allowSleep>
          <Suspense fallback={null}>
            <SceneController
              key={resetFlag.current /* resets ragdolls */}
              gorillaPositions={spawnPositions}
              onWin={(w) => setWinner(w)}
            />
          </Suspense>
        </Physics>
      </Canvas>

      <UiOverlay
        winner={winner}
        onStart={() => (resetFlag.current += 1)}
        onReset={() => {
          setWinner(null);
          resetFlag.current += 1;
        }}
      />
    </>
  );
}
