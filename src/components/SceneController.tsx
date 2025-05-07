// src/components/SceneController.tsx
import {
  ManRagdoll,
  GorillaRagdoll,
  type RagdollHandle, // type-only import
} from "../engine3d/Ragdolls";
import { Ground } from "../engine3d/Ground";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";

interface Props {
  gorillaPositions: Vector3[];
  onWin: (w: "Man" | "Gorillas") => void;
}

export default function SceneController({ gorillaPositions, onWin }: Props) {
  /** Reference to every ragdoll so we can poll death state */
  const ragdolls = useRef<RagdollHandle[]>([]);

  /* ─────────────────────  BUILD CHILDREN ONCE  ───────────────────── */
  const children = useMemo(() => {
    const locals: RagdollHandle[] = [];

    // lone hero
    const els = [
      <ManRagdoll
        key="man"
        position={[-6, 4, 0]}
        ref={(h: RagdollHandle | null): void => {
          if (h) locals.push(h);
        }}
      />,
      // gorilla horde
      ...gorillaPositions.map((pos, i) => (
        <GorillaRagdoll
          key={`g${i}`}
          position={[pos.x, 4, pos.z]}
          ref={(h: RagdollHandle | null): void => {
            if (h) locals.push(h);
          }}
        />
      )),
    ];

    ragdolls.current = locals;
    return els;
  }, [gorillaPositions]);

  /* ─────────────────────  VICTORY POLL  ───────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      const menAlive = ragdolls.current.some(
        (d) => d.type === "Man" && !d.dead,
      );
      const gorillasAlive = ragdolls.current.some(
        (d) => d.type === "Gorilla" && !d.dead,
      );
      if (!menAlive || !gorillasAlive) {
        onWin(menAlive ? "Man" : "Gorillas");
        clearInterval(id);
      }
    }, 400);
    return () => clearInterval(id);
  }, [onWin]);

  return (
    <>
      <Ground />
      {children}
    </>
  );
}
