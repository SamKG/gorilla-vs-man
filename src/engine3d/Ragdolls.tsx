/* ──────────────────────────────────────────────────────────────
   src/engine3d/Ragdolls.tsx
   – Sliding-torso hit-box + floppy, collidable arms
   – Uses @react-three/cannon’s PublicApi type
   ──────────────────────────────────────────────────────────── */

import {
  useBox,
  usePointToPointConstraint,
  type PublicApi, // ← correct type
} from "@react-three/cannon";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ForwardedRef,
} from "react";
import { Vector3 } from "three";
import { useFrame } from "@react-three/fiber";

/* ───────────────- shared types ─────────────── */
export type UnitKind = "Man" | "Gorilla";

export interface RagdollHandle {
  readonly kind: UnitKind;
  hp(): number;
  dead(): boolean;
  position(): Vector3;
  moveToward(target: Vector3, speed: number): void;
  takeDamage(dmg: number): void;
}

/* ───────────────- balance & geometry ─────────────── */
type BalanceEntry = {
  color: number;
  stats: { maxHp: number; range: number; damage: number };
  geom: { torso: Vector3; arm: Vector3 };
};

const BALANCE: Record<UnitKind, BalanceEntry> = {
  Man: {
    color: 0x3279ff,
    stats: { maxHp: 120, range: 4, damage: 16 },
    geom: {
      torso: new Vector3(0.8, 1.6, 0.5),
      arm: new Vector3(0.25, 0.9, 0.25),
    },
  },
  Gorilla: {
    color: 0x2b2b2b,
    stats: { maxHp: 220, range: 3.2, damage: 26 },
    geom: {
      torso: new Vector3(1.1, 1.4, 0.7),
      arm: new Vector3(0.35, 1.1, 0.35),
    },
  },
} as const;

/* helpers */
const v = (x: number | Vector3, y?: number, z?: number): Vector3 =>
  x instanceof Vector3 ? x.clone() : new Vector3(x, y!, z!);

const setVelocity = (api: PublicApi, dir: Vector3, speed: number): void => {
  const vel = dir.clone().setLength(speed);
  api.wakeUp(); // ensure body is active
  api.velocity.set(vel.x, vel.y, vel.z);
};

/* ───────────────- internal builder ─────────────── */
type BuildProps = { position: [number, number, number]; kind: UnitKind };

function InternalRagdoll(
  { position, kind }: BuildProps,
  ref: ForwardedRef<RagdollHandle>,
) {
  /* config */
  const cfg = BALANCE[kind];
  const { torso, arm } = cfg.geom;
  const { maxHp } = cfg.stats;

  /* torso – single sliding box */
  const [torsoRef, torsoApi] = useBox(
    () => ({
      args: torso.toArray(),
      mass: 10,
      fixedRotation: true,
      position,
    }),
    undefined,
    [position],
  );

  /* two loose arms */
  const armOffsets = [
    v(-torso.x / 2, torso.y / 4, 0),
    v(torso.x / 2, torso.y / 4, 0),
  ];
  const arms: { ref: any; api: PublicApi }[] = armOffsets.map((off) => {
    const [ref, api] = useBox(
      () => ({
        args: arm.toArray(),
        mass: 2,
        position: [
          position[0] + off.x,
          position[1] + off.y,
          position[2] + off.z,
        ],
        linearDamping: 0,
        angularDamping: 0,
      }),
      undefined,
      [position],
    );
    return { ref, api };
  });

  /* attach arms with point constraints */
  arms.forEach(({ ref }, i) =>
    usePointToPointConstraint(torsoRef, ref, {
      pivotA: armOffsets[i].toArray(),
      pivotB: [0, 0, 0],
    }),
  );

  /* imperative handle */
  const hp = useRef(maxHp);
  useImperativeHandle(
    ref,
    (): RagdollHandle => ({
      kind,
      hp: () => hp.current,
      dead: () => hp.current <= 0,
      position: () => v(torsoRef.current!.position),
      moveToward: (target, speed) => {
        const dir = target.clone().sub(v(torsoRef.current!.position)).setY(0);
        if (dir.lengthSq() > 1e-4)
          setVelocity(torsoApi, dir.normalize(), speed);
        else torsoApi.velocity.set(0, 0, 0);
      },
      takeDamage: (dmg) => {
        hp.current = Math.max(0, hp.current - dmg);
      },
    }),
    [],
  );

  /* arm “spaz” driver */
  useFrame(() => {
    const jolt = 0.08;
    arms.forEach(({ api }) =>
      api.applyImpulse(
        [
          (Math.random() - 0.5) * jolt,
          (Math.random() - 0.5) * jolt,
          (Math.random() - 0.5) * jolt,
        ],
        [0, 0, 0],
      ),
    );
  });

  /* visuals */
  const color = cfg.color;
  return (
    <>
      <mesh ref={torsoRef} castShadow receiveShadow>
        <boxGeometry args={torso.toArray()} />
        <meshStandardMaterial color={color} />
      </mesh>
      {arms.map(({ ref }, i) => (
        <mesh key={i} ref={ref} castShadow receiveShadow>
          <boxGeometry args={arm.toArray()} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

const ForwardInternal = forwardRef<RagdollHandle, BuildProps>(InternalRagdoll);

/* wrappers */
export const ManRagdoll = forwardRef<
  RagdollHandle,
  { position: [number, number, number] }
>((props, ref) => (
  <ForwardInternal position={props.position} kind="Man" ref={ref} />
));

export const GorillaRagdoll = forwardRef<
  RagdollHandle,
  { position: [number, number, number] }
>((props, ref) => (
  <ForwardInternal position={props.position} kind="Gorilla" ref={ref} />
));

export const UNIT_BALANCE = BALANCE;
