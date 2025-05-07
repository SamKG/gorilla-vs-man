import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { Suspense, useMemo, useRef, useState } from "react";
import SceneController from "./components/SceneController";
import { Vector3 } from "three";
import UiOverlay from "./components/UiOverlay";
import "./index.css";

/* balance knobs */
const MEN = 100;
const GORILLA_POS = new Vector3(-6, 4, 0);

export default function App3D() {
  const [winner, setWinner] = useState<"Man" | "Gorillas" | null>(null);
  const [active, setActive] = useState(false); // drives AI loop
  const resetNonce = useRef(0); // forces ragdoll re-mount

  /* spawn ring of men around +x axis */
  const menPositions = useMemo(() => {
    const out: Vector3[] = [];
    const centre = new Vector3(6, 0, 0);
    const radius = 7;
    for (let i = 0; i < MEN; i++) {
      const theta = (Math.PI * 2 * i) / MEN;
      const r = radius * (0.6 + 0.4 * Math.random());
      out.push(
        new Vector3(
          centre.x + Math.cos(theta) * r,
          4,
          centre.z + Math.sin(theta) * r,
        ),
      );
    }
    return out;
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
              /* resetting key wipes the whole scene clean */
              key={resetNonce.current}
              men={menPositions}
              gorillaPos={GORILLA_POS}
              active={active}
              onWin={(w) => {
                setWinner(w);
                setActive(false);
              }}
            />
          </Suspense>
        </Physics>
      </Canvas>

      <UiOverlay
        winner={winner}
        onStart={() => {
          /* user may smash “Start” repeatedly – no harm */
          setActive(true);
        }}
        onReset={() => {
          setWinner(null);
          setActive(false);
          /* bump key so React remounts fresh ragdolls */
          resetNonce.current += 1;
        }}
      />
    </>
  );
}
