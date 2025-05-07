/* src/engine3d/Ragdolls.tsx */

import {
  useBox,
  useSphere,
  usePointToPointConstraint,
} from "@react-three/cannon";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ForwardedRef,
} from "react";
import { Vector3 } from "three";

/* ─────────────────────────── types ─────────────────────────── */

export type UnitKind = "Man" | "Gorilla";

export interface RagdollHandle {
  readonly kind: UnitKind;
  hp(): number;
  dead(): boolean;
  position(): Vector3;
  moveToward(target: Vector3, speed: number): void;
  takeDamage(dmg: number): void;
}

/* ─────────────────── balance / geometry ────────────────────── */

type BalanceEntry = {
  color: number;
  stats: { maxHp: number; range: number; damage: number };
  geom: { torso: Vector3; head: number; limb: Vector3 };
};

const BALANCE: Record<UnitKind, BalanceEntry> = {
  Man: {
    color: 0x3279ff,
    stats: { maxHp: 120, range: 4, damage: 16 },
    geom: {
      torso: new Vector3(0.6, 1.2, 0.4),
      head: 0.33,
      limb: new Vector3(0.25, 0.8, 0.25),
    },
  },
  Gorilla: {
    color: 0x2b2b2b,
    stats: { maxHp: 220, range: 3.2, damage: 26 },
    geom: {
      torso: new Vector3(0.9, 1.1, 0.6),
      head: 0.42,
      limb: new Vector3(0.35, 0.95, 0.35),
    },
  },
} as const;

/* ─────────────────────── utilities ─────────────────────────── */

const v = (x: number | Vector3, y?: number, z?: number): Vector3 =>
  x instanceof Vector3 ? x.clone() : new Vector3(x, y!, z!);

const setVelocity = (api: any, dir: Vector3, speed: number): void => {
  const vel = dir.clone().setLength(speed);
  api.velocity.set(vel.x, vel.y, vel.z);
};

/* ─────────────────── internal component ────────────────────── */

type BuildProps = { position: [number, number, number]; kind: UnitKind };

function InternalRagdoll(
  { position, kind }: BuildProps,
  ref: ForwardedRef<RagdollHandle>,
) {
  const cfg = BALANCE[kind];
  const { torso, head, limb } = cfg.geom;
  const { maxHp } = cfg.stats;

  /* physics bodies */
  const [torsoRef, torsoApi] = useBox(
    () => ({ args: torso.toArray(), mass: 8, position }),
    undefined,
    [position],
  );

  const [headRef] = useSphere(
    () => ({
      args: [head],
      mass: 2,
      position: [position[0], position[1] + torso.y / 2 + head, position[2]],
    }),
    undefined,
    [position],
  );

  const limbOffsets = [
    v(-0.45, 0.55, 0),
    v(0.45, 0.55, 0),
    v(-0.25, -0.6, 0),
    v(0.25, -0.6, 0),
  ];
  const limbs = limbOffsets.map(
    (off) =>
      useBox(
        () => ({
          args: limb.toArray(),
          mass: 2.5,
          position: [
            position[0] + off.x,
            position[1] + off.y,
            position[2] + off.z,
          ],
        }),
        undefined,
        [position],
      )[0],
  );

  const connect = (a: any, b: any, pivot: Vector3) =>
    usePointToPointConstraint(a, b, {
      pivotA: pivot.toArray(),
      pivotB: [0, 0, 0],
    });
  connect(torsoRef, headRef, v(0, torso.y / 2, 0));
  connect(torsoRef, limbs[0], v(-0.45, 0.3, 0));
  connect(torsoRef, limbs[1], v(0.45, 0.3, 0));
  connect(torsoRef, limbs[2], v(-0.25, -torso.y / 2, 0));
  connect(torsoRef, limbs[3], v(0.25, -torso.y / 2, 0));

  /* imperative API */
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
      },
      takeDamage: (dmg) => {
        hp.current = Math.max(0, hp.current - dmg);
      },
    }),
    [],
  );

  /* visuals */
  const color = cfg.color;
  return (
    <>
      <mesh ref={torsoRef} castShadow receiveShadow>
        <boxGeometry args={torso.toArray()} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh ref={headRef} castShadow receiveShadow>
        <sphereGeometry args={[head, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {limbs.map((lr, i) => (
        <mesh key={i} ref={lr} castShadow receiveShadow>
          <boxGeometry args={limb.toArray()} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

const ForwardInternal = forwardRef<RagdollHandle, BuildProps>(InternalRagdoll);

/* ─────────────────────── public wrappers ────────────────────── */

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
