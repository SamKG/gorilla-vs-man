import React from "react";
import "./UiOverlay.css";

interface Props {
  winner: "Man" | "Gorillas" | null;
  onStart: () => void;
  onReset: () => void;
}

const UiOverlay: React.FC<Props> = ({ winner, onStart, onReset }) => (
  <div className="overlay">
    <h1>🦍 Totally Accurate (ish) Battle Sim – 3D</h1>
    <div className="controls">
      <button onClick={onStart}>▶ Start</button>
      <button onClick={onReset}>🔄 Reset</button>
    </div>
    {winner && (
      <h2 className="winner">
        {winner === "Man" ? "The Man prevails!" : "Gorillas overwhelm!"}
      </h2>
    )}
  </div>
);

export default UiOverlay;
