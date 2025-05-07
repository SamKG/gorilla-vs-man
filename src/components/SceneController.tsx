/**
 * Game-logic glue: spawns 100 men vs 1 gorilla, runs very simple melee AI,
 * determines victory, tells parent when someone wins.
 */
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";
import {
  ManRagdoll,
  GorillaRagdoll,
  type RagdollHandle,
  UNIT_BALANCE,
} from "../engine3d/Ragdolls";
import { Ground } from "../engine3d/Ground";

interface Props {
  men: Vector3[];
  gorillaPos: Vector3;
  active: boolean;
  onWin: (w: "Man" | "Gorillas") => void;
}

export default function SceneController({
  men,
  gorillaPos,
  active,
  onWin,
}: Props) {
  const ragdolls = useRef<RagdollHandle[]>([]);
  const EXPECTED_UNITS = men.length + 1; // 1 gorilla

  /* spawn once ------------------------------------------------------- */
  const children = useMemo(() => {
    const locals: RagdollHandle[] = [];
    const collect: React.RefCallback<RagdollHandle> = (h) => {
      if (h) locals.push(h); // Array.push return value is ignored → void
    };

    const elements = [
      <GorillaRagdoll key="g" position={gorillaPos.toArray()} ref={collect} />,
      ...men.map((p, i) => (
        <ManRagdoll key={i} position={p.toArray()} ref={collect} />
      )),
    ];

    ragdolls.current = locals; // mutate in place – refs arrive later
    return elements;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [men, gorillaPos]);

  /* AI + victory loop ------------------------------------------------ */
  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      /* ↳ Ignore ticks until every ragdoll has mounted */
      if (ragdolls.current.length < EXPECTED_UNITS) return;

      const living = ragdolls.current.filter((d) => !d.dead());
      const menAlive = living.some((d) => d.kind === "Man");
      const gorAlive = living.some((d) => d.kind === "Gorilla");

      /* victory? */
      if (!menAlive || !gorAlive) {
        onWin(menAlive ? "Man" : "Gorillas");
        clearInterval(timer);
        return;
      }

      /* very crude AI ------------------------------------------------ */
      const now = performance.now() * 1e-3;

      for (const a of living) {
        /* nearest enemy */
        let nearest: RagdollHandle | null = null;
        let best = Infinity;

        for (const b of living) {
          if (b.kind === a.kind) continue;
          const d2 = a.position().distanceToSquared(b.position());
          if (d2 < best) {
            best = d2;
            nearest = b;
          }
        }
        if (!nearest) continue;

        /* fight or move */
        const { range, damage } = UNIT_BALANCE[a.kind].stats;
        if (best <= range * range) {
          const last = attackMemo.get(a) ?? 0;
          if (now - last >= 0.6) {
            nearest.takeDamage(damage);
            attackMemo.set(a, now);
          }
          a.moveToward(a.position(), 0); // stop
        } else {
          a.moveToward(nearest.position(), a.kind === "Man" ? 6 : 4.2);
        }
      }
    }, 80);

    return () => clearInterval(timer);
  }, [active, onWin, EXPECTED_UNITS]);

  return (
    <>
      <Ground />
      {children}
    </>
  );
}

const attackMemo = new WeakMap<RagdollHandle, number>();
