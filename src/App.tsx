import { useRef, useState } from "react";
import { Simulation } from "./engine/Simulation";
import { GameCanvas } from "./components/GameCanvas";
import "./index.css";

function App() {
  const simRef = useRef<Simulation>(new Simulation());
  const [winner, setWinner] = useState<"Man" | "Gorillas" | null>(null);

  // keep React in sync with engine
  const syncWinner = () =>
    setWinner(simRef.current.winner ? simRef.current.winner : null);

  return (
    <div className="app">
      <h1>🦍 Totally Accurate (ish) Battle Sim</h1>
      <GameCanvas sim={simRef.current} />
      <div className="controls">
        <button
          onClick={() => {
            simRef.current.start();
            setInterval(syncWinner, 200);
          }}
        >
          ▶ Start
        </button>
        <button
          onClick={() => {
            simRef.current.pause();
            syncWinner();
          }}
        >
          ⏸ Pause
        </button>
        <button
          onClick={() => {
            simRef.current.reset();
            setWinner(null);
          }}
        >
          🔄 Reset
        </button>
      </div>
      {winner && (
        <h2 className="winner">
          {winner === "Man" ? "The Man prevails!" : "Gorillas overwhelm!"}
        </h2>
      )}
      <p style={{ marginTop: 24, fontSize: 14, opacity: 0.6 }}>
        Blue = Man, Red = Gorillas. Health bars shown above each unit.
      </p>
    </div>
  );
}
export default App;
