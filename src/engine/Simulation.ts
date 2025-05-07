import { Entity } from "./Entity";
import { Man } from "./Man";
import { Gorilla } from "./Gorilla";
import { Vector2 } from "./Vector2";

export class Simulation {
  /** Drawn region */
  static readonly WIDTH = 800;
  static readonly HEIGHT = 600;

  private ctx: CanvasRenderingContext2D | null = null;
  private entities: Entity[] = [];
  private running = false;
  private lastT = 0;
  private animationHandle = 0;

  winner: "Man" | "Gorillas" | null = null;

  /** must be called once by React after canvas is ready */
  attachContext(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    ctx.canvas.width = Simulation.WIDTH;
    ctx.canvas.height = Simulation.HEIGHT;
  }

  /** spawn fresh units and reset */
  reset() {
    cancelAnimationFrame(this.animationHandle);
    this.entities = [];
    this.winner = null;

    // one man
    this.entities.push(
      new Man(new Vector2(Simulation.WIDTH * 0.2, Simulation.HEIGHT / 2)),
    );

    // 100 gorillas in a random-ish blob on the right side
    const center = new Vector2(
      Simulation.WIDTH * 0.75,
      Simulation.HEIGHT * 0.5,
    );
    const radius = 180;
    for (let i = 0; i < 100; i++) {
      const angle = (Math.PI * 2 * i) / 100;
      const r = radius * (0.6 + 0.4 * Math.random());
      const x = center.x + Math.cos(angle) * r;
      const y = center.y + Math.sin(angle) * r;
      this.entities.push(new Gorilla(new Vector2(x, y)));
    }
    this.draw(); // first frame
  }

  /** begin RAF loop */
  start() {
    if (this.running) return;
    this.running = true;
    this.lastT = performance.now();
    const step = (time: number) => {
      const dt = (time - this.lastT) / 1000;
      this.lastT = time;
      this.update(dt);
      this.draw();
      if (this.running) this.animationHandle = requestAnimationFrame(step);
    };
    this.animationHandle = requestAnimationFrame(step);
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this.animationHandle);
  }

  private update(dt: number) {
    if (this.winner) return;

    // step each
    for (const e of this.entities) {
      e.step(dt, this.entities);
    }

    // remove dead
    this.entities = this.entities.filter((e) => !e.dead);

    // check win
    const menAlive = this.entities.some((e) => e.team === "Man");
    const gorillasAlive = this.entities.some((e) => e.team === "Gorilla");
    if (!menAlive || !gorillasAlive) {
      this.winner = menAlive ? "Man" : "Gorillas";
      this.pause();
    }
  }

  private draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, Simulation.WIDTH, Simulation.HEIGHT);
    // ground
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, Simulation.WIDTH, Simulation.HEIGHT);

    // entities
    for (const e of this.entities) {
      e.draw(ctx);
    }
  }
}
