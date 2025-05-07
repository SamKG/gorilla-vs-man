import { useEffect, useRef } from "react";
import { Simulation } from "../engine/Simulation";

interface Props {
  sim: Simulation;
}

export const GameCanvas: React.FC<Props> = ({ sim }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext("2d");
    if (!ctx) return;
    sim.attachContext(ctx);
    sim.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  return (
    <canvas
      ref={ref}
      style={{
        border: "2px solid #888",
        borderRadius: 8,
        display: "block",
        margin: "0 auto",
      }}
    />
  );
};
