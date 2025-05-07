import {
  useBox,
  useSphere,
  usePointToPointConstraint,
} from "@react-three/cannon";
import { forwardRef, useImperativeHandle } from "react";
import { Vector3 } from "three";

/* ————————  PUBLIC HANDLE  ———————— */
export interface RagdollHandle {
  type: "Man" | "Gorilla";
  dead: boolean;
}

/* ————————  INTERNAL SHARED BUILDER  ———————— */
type RagdollProps = {
  position: [number, number, number];
};

function buildRagdoll(
  type: "Man" | "Gorilla",
  props: RagdollProps,
  ref: React.Ref<RagdollHandle>,
) {
  /* ── rigid-body parts ─────────────────────────────────────────── */
  const [torso] = useBox(
    () => ({
      args: [0.6, 1.2, 0.4],
      mass: 8,
      position: props.position,
    }),
    undefined,
    [props.position],
  );

  const [head] = useSphere(
    () => ({
      args: [0.33],
      mass: 2,
      position: [props.position[0], props.position[1] + 0.9, props.position[2]],
    }),
    undefined,
    [props.position],
  );

  // limbs (boxes)
  const limbSize: [number, number, number] = [0.25, 0.8, 0.25];
  const limbMass = 2.5;
  const limbOffsets: Vector3[] = [
    new Vector3(-0.5, 0.4, 0), // LH
    new Vector3(0.5, 0.4, 0), // RH
    new Vector3(-0.25, -0.9, 0), // LL
    new Vector3(0.25, -0.9, 0), // RL
  ];
  const limbs = limbOffsets.map(
    (off) =>
      useBox(
        () => ({
          args: limbSize,
          mass: limbMass,
          position: [
            props.position[0] + off.x,
            props.position[1] + off.y,
            props.position[2] + off.z,
          ],
        }),
        undefined,
        [props.position],
      )[0],
  );

  /* ── joints / constraints ─────────────────────────────────────── */
  const connect = (a: any, b: any, pivot: Vector3) =>
    usePointToPointConstraint(a, b, {
      pivotA: [pivot.x, pivot.y, pivot.z],
      pivotB: [0, 0, 0],
    });

  connect(torso, head, new Vector3(0, 0.6, 0)); // neck
  connect(torso, limbs[0], new Vector3(-0.45, 0.55, 0)); // L-shoulder
  connect(torso, limbs[1], new Vector3(0.45, 0.55, 0)); // R-shoulder
  connect(torso, limbs[2], new Vector3(-0.25, -0.6, 0)); // L-hip
  connect(torso, limbs[3], new Vector3(0.25, -0.6, 0)); // R-hip

  /* ── imperative handle for death check ────────────────────────── */
  useImperativeHandle(
    ref,
    () => ({
      type,
      get dead() {
        const bodies = [torso, head, ...limbs].map((r) => r.current);
        // consider a body “dead” once every rigid body fell below y = –4
        return bodies.every((b) => b && b.position.y < -4);
      },
    }),
    [],
  );

  /* ── visuals ──────────────────────────────────────────────────── */
  const color = type === "Man" ? 0x3279ff : 0xaa2c2c;
  return (
    <>
      <mesh ref={torso} castShadow receiveShadow>
        <boxGeometry args={[0.6, 1.2, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh ref={head} castShadow receiveShadow>
        <sphereGeometry args={[0.33, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {limbs.map((limbRef, idx) => (
        <mesh key={idx} ref={limbRef} castShadow receiveShadow>
          <boxGeometry args={limbSize} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

/* ————————  PUBLIC COMPONENTS  ———————— */
export const ManRagdoll = forwardRef<RagdollHandle, RagdollProps>((p, ref) =>
  buildRagdoll("Man", p, ref),
);
export const GorillaRagdoll = forwardRef<RagdollHandle, RagdollProps>(
  (p, ref) => buildRagdoll("Gorilla", p, ref),
);
